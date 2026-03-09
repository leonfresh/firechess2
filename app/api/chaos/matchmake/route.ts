/**
 * GET /api/chaos/matchmake — Find an open matchmaking room to join
 * Returns: { roomId, roomCode } or { waiting: true } if none found
 *
 * POST /api/chaos/matchmake — Create a matchmaking room
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chaosRooms } from "@/lib/schema";
import { eq, and, ne, isNull } from "drizzle-orm";
import { createChaosState } from "@/lib/chaos-chess";

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

  // Look for an open matchmaking room that isn't ours
  const rooms = await db
    .select()
    .from(chaosRooms)
    .where(
      and(
        eq(chaosRooms.isMatchmaking, true),
        eq(chaosRooms.status, "waiting"),
        ne(chaosRooms.hostId, session.user.id),
      ),
    )
    .limit(1);

  if (rooms.length > 0) {
    const room = rooms[0];

    // Join the room
    await db
      .update(chaosRooms)
      .set({
        guestId: session.user.id,
        status: "playing",
        isMatchmaking: false,
        updatedAt: new Date(),
      })
      .where(eq(chaosRooms.id, room.id));

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
