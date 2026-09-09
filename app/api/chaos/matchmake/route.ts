/**
 * GET    /api/chaos/matchmake — Find & atomically join an open matchmaking room
 * POST   /api/chaos/matchmake — Create a matchmaking room (auto-cancels stale ones)
 * DELETE /api/chaos/matchmake — Cancel a matchmaking room
 *
 * GET  returns: { roomId, roomCode, hostColor } or { waiting: true }
 * POST returns: { roomId, roomCode, hostColor }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosRooms } from "@/lib/schema";
import { eq, and, ne, isNull, gte, sql } from "drizzle-orm";
import { createSyncState, startServerOpening } from "@/lib/chaos-room-sync";
import { getChaosUserId } from "@/lib/chaos-auth";
import { notifyLiveRoom } from "@/lib/chaos-live-token";
import { timeControl } from "@/lib/chaos-clock";

/** Rooms older than this are considered abandoned */
const STALE_THRESHOLD_MS = 90_000; // 90 seconds

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET(req: NextRequest) {
  const userId = await getChaosUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  // Listing never claims a seat and exposes only explicitly public queue rooms.
  if (req.nextUrl.searchParams.get("list") === "1") {
    const data = await db.execute(sql`select r."roomCode", r."timeControlSeconds", r."incrementSeconds",
      coalesce(p.name,'Guest player') as name, p.rating, coalesce(p.games,0) as games,
      (p.id is not null and r."timeControlSeconds">0) as "ratedEligible",
      (r."hostId"=${userId}) as yours
      from chaos_room r left join chaos_player p on p.id=r."hostId"
      where r."isMatchmaking"=true and r.status='waiting' and r."guestId" is null
      and r."createdAt">=${cutoff.toISOString()}
      and coalesce((r."chaosState"->'_sync'->>'draftProtocol')::integer,1)=2
      order by r."createdAt" asc limit 30`);
    return NextResponse.json({ rooms: data.rows }, { headers: { "Cache-Control": "no-store" } });
  }

  const control = timeControl(Number(req.nextUrl.searchParams.get("base")), Number(req.nextUrl.searchParams.get("inc")));
  // Match players who chose the same clock.
  const rooms = await db
    .select()
    .from(chaosRooms)
    .where(
      and(
        eq(chaosRooms.isMatchmaking, true),
        eq(chaosRooms.status, "waiting"),
        isNull(chaosRooms.guestId),
        ne(chaosRooms.hostId, userId),
        gte(chaosRooms.createdAt, cutoff),
        eq(chaosRooms.timeControlSeconds, control.base),
        eq(chaosRooms.incrementSeconds, control.inc),
        sql`coalesce((${chaosRooms.chaosState}->'_sync'->>'draftProtocol')::integer, 1) = ${req.nextUrl.searchParams.get("draftProtocol") === "2" ? 2 : 1}`,
      ),
    )
    .limit(1);

  if (rooms.length > 0) {
    const room = rooms[0];

    const openingState = startServerOpening(room);
    // Atomic join — only succeeds if room is still unclaimed
    const result = await db
      .update(chaosRooms)
      .set({
        guestId: userId,
        chaosState: openingState,
        status: "playing",
        isMatchmaking: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(chaosRooms.id, room.id),
          eq(chaosRooms.status, "waiting"),
          isNull(chaosRooms.guestId),
        ),
      )
      .returning({ id: chaosRooms.id });

    if (result.length === 0) {
      // Race lost — room was already claimed
      return NextResponse.json({ waiting: true });
    }

    await notifyLiveRoom(room.id, (openingState as any)?._sync?.opening?.deadline);
    return NextResponse.json({
      roomId: room.id,
      roomCode: room.roomCode,
      hostColor: room.hostColor,
      timeControlSeconds: room.timeControlSeconds,
      incrementSeconds: room.incrementSeconds,
    });
  }

  return NextResponse.json({ waiting: true });
}

export async function POST(req: NextRequest) {
  const userId = await getChaosUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const unlimitedTime = !!body.unlimitedTime;
  const control = timeControl(unlimitedTime ? -1 : body.timeControlSeconds, body.incrementSeconds);

  // Auto-cancel any existing matchmaking rooms from this user
  await db
    .update(chaosRooms)
    .set({ isMatchmaking: false, status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(chaosRooms.hostId, userId),
        eq(chaosRooms.isMatchmaking, true),
        eq(chaosRooms.status, "waiting"),
      ),
    );

  const hostColor = Math.random() > 0.5 ? "white" : "black";
  const roomCode = generateRoomCode();
  const chaosState = createSyncState(body.draftProtocol === 2);

  const [room] = await db
    .insert(chaosRooms)
    .values({
      roomCode,
      hostId: userId,
      hostColor,
      chaosState,
      status: "waiting",
      isMatchmaking: true,
      timeControlSeconds: control.base,
      incrementSeconds: control.inc,
    })
    .returning({ id: chaosRooms.id, roomCode: chaosRooms.roomCode });

  return NextResponse.json({
    roomId: room.id,
    roomCode: room.roomCode,
    hostColor,
  });
}

/** Cancel a matchmaking room (on timeout, manual cancel, or switching rooms) */
export async function DELETE(req: NextRequest) {
  const userId = await getChaosUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { roomId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // no body — cancel all
  }

  if (body.roomId) {
    await db
      .update(chaosRooms)
      .set({ isMatchmaking: false, status: "cancelled", updatedAt: new Date() })
      .where(
        and(eq(chaosRooms.id, body.roomId), eq(chaosRooms.hostId, userId), eq(chaosRooms.status, "waiting"), eq(chaosRooms.isMatchmaking, true), isNull(chaosRooms.guestId)),
      );
  } else {
    await db
      .update(chaosRooms)
      .set({ isMatchmaking: false, status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(chaosRooms.hostId, userId),
          eq(chaosRooms.isMatchmaking, true),
          eq(chaosRooms.status, "waiting"),
        ),
      );
  }

  return NextResponse.json({ ok: true });
}

