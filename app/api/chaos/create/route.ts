/**
 * POST /api/chaos/create — Create a new Chaos Chess room
 * Body: { hostColor: "white" | "black" }
 * Returns: { roomCode, roomId }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosRooms } from "@/lib/schema";
import { createSyncState } from "@/lib/chaos-room-sync";
import { getChaosUserId } from "@/lib/chaos-auth";
import { timeControl } from "@/lib/chaos-clock";

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
  const {base: timeControlSeconds, inc: incrementSeconds} = timeControl(body.timeControlSeconds, body.incrementSeconds);

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
      isMatchmaking: body.matchmaking === true,
      timeControlSeconds: timeControlSeconds ?? null,
      incrementSeconds,
    })
    .returning({ id: chaosRooms.id, roomCode: chaosRooms.roomCode });

  return NextResponse.json({ roomCode: room.roomCode, roomId: room.id, draftProtocol: body.draftProtocol === 2 ? 2 : undefined });
}
