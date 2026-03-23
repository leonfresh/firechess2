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
    .where(and(eq(chaosRooms.roomCode, code), eq(chaosRooms.status, "waiting")));

  if (rooms.length === 0) {
    return NextResponse.json({ error: "Room not found or already full" }, { status: 404 });
  }

  const room = rooms[0];

  if (room.hostId === userId) {
    return NextResponse.json({ error: "You can't join your own room" }, { status: 400 });
  }

  if (room.guestId && room.guestId !== userId) {
    return NextResponse.json({ error: "Room is already full" }, { status: 400 });
  }

  // Join the room
  await db
    .update(chaosRooms)
    .set({
      guestId: userId,
      status: "playing",
      updatedAt: new Date(),
    })
    .where(eq(chaosRooms.id, room.id));

  return NextResponse.json({
    roomId: room.id,
    hostColor: room.hostColor,
    fen: room.fen,
    chaosState: room.chaosState,
  });
}
