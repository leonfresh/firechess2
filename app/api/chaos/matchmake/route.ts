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
import { eq, and, ne, isNull, gte } from "drizzle-orm";
import { createChaosState } from "@/lib/chaos-chess";
import { getChaosUserId } from "@/lib/chaos-auth";

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

  // Look for a recent, open matchmaking room that isn't ours
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
      ),
    )
    .limit(1);

  if (rooms.length > 0) {
    const room = rooms[0];

    // Atomic join — only succeeds if room is still unclaimed
    const result = await db
      .update(chaosRooms)
      .set({
        guestId: userId,
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

  let body: { timeControlSeconds?: number; incrementSeconds?: number } = {};
  try {
    body = await req.json();
  } catch {
    // no body — use defaults
  }
  const timeControlSeconds: number | null = body.timeControlSeconds ?? null;
  const incrementSeconds: number = body.incrementSeconds ?? 0;

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
  const chaosState = createChaosState();

  const [room] = await db
    .insert(chaosRooms)
    .values({
      roomCode,
      hostId: userId,
      hostColor,
      chaosState,
      status: "waiting",
      isMatchmaking: true,
      timeControlSeconds,
      incrementSeconds,
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
        and(eq(chaosRooms.id, body.roomId), eq(chaosRooms.hostId, userId)),
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
