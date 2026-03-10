/**
 * POST /api/chaos/create — Create a new Chaos Chess room
 * Body: { hostColor: "white" | "black" }
 * Returns: { roomCode, roomId }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosRooms } from "@/lib/schema";
import { createChaosState } from "@/lib/chaos-chess";
import { getChaosUserId } from "@/lib/chaos-auth";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  const userId = await getChaosUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const hostColor = body.hostColor === "black" ? "black" : "white";

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
      isMatchmaking: body.matchmaking === true,
    })
    .returning({ id: chaosRooms.id, roomCode: chaosRooms.roomCode });

  return NextResponse.json({ roomCode: room.roomCode, roomId: room.id });
}
