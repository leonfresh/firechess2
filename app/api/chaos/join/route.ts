/**
 * POST /api/chaos/join — Join an existing Chaos Chess room
 * Body: { roomCode: string }
 * Returns: { roomId, hostColor, fen, chaosState }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosRooms } from "@/lib/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getChaosUserId } from "@/lib/chaos-auth";
import { notifyLiveRoom } from "@/lib/chaos-live-token";
import { startServerOpening } from "@/lib/chaos-room-sync";

export async function POST(req: NextRequest) {
  const userId = await getChaosUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const code = (body.roomCode ?? "").toUpperCase().trim();

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 });
  }

  // Find the room
  const rooms = await db
    .select()
    .from(chaosRooms)
    .where(
      and(eq(chaosRooms.roomCode, code), eq(chaosRooms.status, "waiting")),
    );

  if (rooms.length === 0) {
    return NextResponse.json(
      { error: "Room not found or already full" },
      { status: 404 },
    );
  }

  const room = rooms[0];

  if (room.hostId === userId) {
    return NextResponse.json(
      { error: "You can't join your own room" },
      { status: 400 },
    );
  }

  if (room.guestId && room.guestId !== userId) {
    return NextResponse.json(
      { error: "Room is already full" },
      { status: 400 },
    );
  }

  if (room.isMatchmaking && (room.createdAt?.getTime() ?? 0) < Date.now() - 90_000) {
    return NextResponse.json({ error: "This challenge has expired. Choose another player." }, { status: 410 });
  }
  const openingState = startServerOpening(room);
  // Join the room
  const joined = await db
    .update(chaosRooms)
    .set({
      guestId: userId,
      chaosState: openingState,
      status: "playing",
      isMatchmaking: false,
      updatedAt: new Date(),
    })
    .where(and(eq(chaosRooms.id, room.id), eq(chaosRooms.status, "waiting"), isNull(chaosRooms.guestId)))
    .returning({ id: chaosRooms.id });
  if (!joined.length) return NextResponse.json({ error: "Room is already full" }, { status: 409 });

  await notifyLiveRoom(room.id, (openingState as any)?._sync?.opening?.deadline);
  return NextResponse.json({
    roomId: room.id,
    hostColor: room.hostColor,
    fen: room.fen,
    chaosState: openingState,
    timeControlSeconds: room.timeControlSeconds,
    incrementSeconds: room.incrementSeconds,
  });
}

