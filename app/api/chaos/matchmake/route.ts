import { loadOpeningOwnership } from "@/lib/chaos-opening-ownership";
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
import { eq, and, ne, isNull, gte, sql, inArray, lt } from "drizzle-orm";
import { createSyncState, startServerOpening, MATCHMAKING_WINDOW_MS } from "@/lib/chaos-room-sync";
import { getChaosUserId, isGuestId } from "@/lib/chaos-auth";
import { notifyLiveRoom } from "@/lib/chaos-live-token";
import { timeControl } from "@/lib/chaos-clock";

/** Posted challenges older than this are abandoned: unlisted and no longer joinable */
const STALE_THRESHOLD_MS = MATCHMAKING_WINDOW_MS;

// The guest UUID is already a bearer identity for anonymous requests. Keep it
// associated with this browser after sign-in to cancel/exclude its old seeks.
function seekerIds(req: NextRequest, userId: string) {
  const guest = req.headers.get("x-guest-id") ?? "";
  return /^guest_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guest)
    ? [...new Set([userId, guest])] : [userId];
}

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

  const identities = seekerIds(req, userId);
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  await db.update(chaosRooms).set({status:"cancelled", isMatchmaking:false, updatedAt:new Date()})
    .where(and(eq(chaosRooms.status,"waiting"),eq(chaosRooms.isMatchmaking,true),isNull(chaosRooms.guestId),lt(chaosRooms.createdAt,cutoff)));

  // Listing never claims a seat and exposes only explicitly public queue rooms.
  if (req.nextUrl.searchParams.get("list") === "1") {
    // Optional Activity scope: mark challenges posted by people in the same voice channel so the
    // lobby can put them first ("in this call") instead of showing an anonymous pool.
    const instance = (req.nextUrl.searchParams.get("instance") ?? "").slice(0, 64);
    const scoped = /^[\w.-]{1,64}$/.test(instance) ? instance : null;
    const data = await db.execute(sql`select r."roomCode", r."timeControlSeconds", r."incrementSeconds",
      coalesce(p.name,'Guest player') as name, p.rating, coalesce(p.games,0) as games,
      (p.id is not null and r."timeControlSeconds">0) as "ratedEligible",
      (r."hostId" in (${sql.join(identities.map(id => sql`${id}`), sql`, `)})) as yours,
      (${scoped}::text is not null and exists(select 1 from chaos_launch l
        where l.player_id=r."hostId" and l.instance_id=${scoped} and l.created_at > now() - interval '12 hours')) as "sameInstance"
      from chaos_room r left join chaos_player p on p.id=r."hostId"
      where r."isMatchmaking"=true and r.status='waiting' and r."guestId" is null
      and r."createdAt">=${cutoff.toISOString()}
      and coalesce((r."chaosState"->'_sync'->>'draftProtocol')::integer,1)=2
      order by "sameInstance" desc, r."createdAt" asc limit 30`);
    return NextResponse.json({ rooms: data.rows }, { headers: { "Cache-Control": "no-store" } });
  }

  const control = timeControl(Number(req.nextUrl.searchParams.get("base")), Number(req.nextUrl.searchParams.get("inc")));
  // Match players who chose the same clock, preferring the same account class: a signed-in seeker
  // is paired with a signed-in host (that pair is what makes a game rated), a guest with a guest.
  // Falls back to any open room so matchmaking never dead-ends on an empty pool.
  const seekerIsGuest = isGuestId(userId);
  const findRoom = (sameClassOnly: boolean) =>
    db
      .select()
      .from(chaosRooms)
      .where(
        and(
          eq(chaosRooms.isMatchmaking, true),
          eq(chaosRooms.status, "waiting"),
          isNull(chaosRooms.guestId),
          ...identities.map(id => ne(chaosRooms.hostId, id)),
          gte(chaosRooms.createdAt, cutoff),
          eq(chaosRooms.timeControlSeconds, control.base),
          eq(chaosRooms.incrementSeconds, control.inc),
          sql`coalesce((${chaosRooms.chaosState}->'_sync'->>'draftProtocol')::integer, 1) = ${req.nextUrl.searchParams.get("draftProtocol") === "2" ? 2 : 1}`,
          sameClassOnly ? sql`(${chaosRooms.hostId} like 'guest\\_%') = ${seekerIsGuest}` : undefined,
        ),
      )
      .limit(1);

  let rooms = await findRoom(true);
  if (rooms.length === 0) rooms = await findRoom(false);

  if (rooms.length > 0) {
    const room = rooms[0];

    const openingState = startServerOpening(room, Date.now(), await loadOpeningOwnership(room.hostId, userId));
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
          gte(chaosRooms.createdAt, new Date(Date.now() - STALE_THRESHOLD_MS)),
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
        inArray(chaosRooms.hostId, seekerIds(req, userId)),
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
        and(eq(chaosRooms.id, body.roomId), inArray(chaosRooms.hostId, seekerIds(req, userId)), eq(chaosRooms.status, "waiting"), eq(chaosRooms.isMatchmaking, true), isNull(chaosRooms.guestId)),
      );
  } else {
    await db
      .update(chaosRooms)
      .set({ isMatchmaking: false, status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          inArray(chaosRooms.hostId, seekerIds(req, userId)),
          eq(chaosRooms.isMatchmaking, true),
          eq(chaosRooms.status, "waiting"),
        ),
      );
  }

  return NextResponse.json({ ok: true });
}

