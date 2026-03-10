/**
 * GET    /api/chaos/matchmake — Find & atomically join an open matchmaking room
 * POST   /api/chaos/matchmake — Create a matchmaking room (auto-cancels stale ones)
 * DELETE /api/chaos/matchmake — Cancel a matchmaking room
 *
 * GET  returns: { roomId, roomCode, hostColor } or { waiting: true }
 * POST returns: { roomId, roomCode, hostColor }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chaosRooms } from "@/lib/schema";
import { eq, and, ne, isNull, gte } from "drizzle-orm";
import { createChaosState } from "@/lib/chaos-chess";

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  // Look for a recent, open matchmaking room that isn't ours
  const rooms = await db
    .select()
    .from(chaosRooms)
    .where(
      and(
        eq(chaosRooms.isMatchmaking, true),
        eq(chaosRooms.status, "waiting"),
        isNull(chaosRooms.guestId),
        ne(chaosRooms.hostId, session.user.id),
        gte(chaosRooms.createdAt, cutoff),
      ),
    )
    .limit(1);

  if (rooms.length > 0) {
    const room = rooms[0];

    // Atomic join — only succeeds if room is still unclaimed
    const result = await db
      .update(chaosRooms)
      .set({
        guestId: session.user.id,
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

    return NextResponse.json({
      roomId: room.id,
      roomCode: room.roomCode,
      hostColor: room.hostColor,
    });
  }

  return NextResponse.json({ waiting: true });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-cancel any existing matchmaking rooms from this user
  await db
    .update(chaosRooms)
    .set({ isMatchmaking: false, status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(chaosRooms.hostId, session.user.id),
        eq(chaosRooms.isMatchmaking, true),
        eq(chaosRooms.status, "waiting"),
      ),
    );

  const hostColor = Math.random() > 0.5 ? "white" : "black";
  const roomCode = generateRoomCode();
  const chaosState = createChaosState();

  const [room] = await db
    .insert(chaosRooms)
    .values({
      roomCode,
      hostId: session.user.id,
      hostColor,
      chaosState,
      status: "waiting",
      isMatchmaking: true,
    })
    .returning({ id: chaosRooms.id, roomCode: chaosRooms.roomCode });

  return NextResponse.json({ roomId: room.id, roomCode: room.roomCode, hostColor });
}

/** Cancel a matchmaking room (on timeout, manual cancel, or switching rooms) */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
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
        and(
          eq(chaosRooms.id, body.roomId),
          eq(chaosRooms.hostId, session.user.id),
        ),
      );
  } else {
    await db
      .update(chaosRooms)
      .set({ isMatchmaking: false, status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(chaosRooms.hostId, session.user.id),
          eq(chaosRooms.isMatchmaking, true),
          eq(chaosRooms.status, "waiting"),
        ),
      );
  }

  return NextResponse.json({ ok: true });
}
