/**
 * POST /api/chaos/move — Make a move in a Chaos Chess room
 * Body: { roomId, from, to, promotion?, chaosMove?, newFen, chaosState, captured? }
 *
 * GET  /api/chaos/move?roomId=xxx — Poll current game state
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosRooms } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getChaosUserId } from "@/lib/chaos-auth";

export async function GET(req: NextRequest) {
  const userId = await getChaosUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  const rooms = await db
    .select()
    .from(chaosRooms)
    .where(eq(chaosRooms.id, roomId));

  if (rooms.length === 0) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const room = rooms[0];

  // Verify user is part of this room
  if (room.hostId !== userId && room.guestId !== userId) {
    return NextResponse.json({ error: "Not in this room" }, { status: 403 });
  }

  return NextResponse.json({
    fen: room.fen,
    chaosState: room.chaosState,
    status: room.status,
    moveHistory: room.moveHistory,
    lastMoveFrom: room.lastMoveFrom,
    lastMoveTo: room.lastMoveTo,
    hostId: room.hostId,
    guestId: room.guestId,
    hostColor: room.hostColor,
    capturedPawnsWhite: room.capturedPawnsWhite,
    capturedPawnsBlack: room.capturedPawnsBlack,
    timeControlSeconds: room.timeControlSeconds,
    incrementSeconds: room.incrementSeconds,
    timerWhiteMs: room.timerWhiteMs,
    timerBlackMs: room.timerBlackMs,
    updatedAt: room.updatedAt?.toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getChaosUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { roomId, from, to, newFen, chaosState, lastMoveFrom, lastMoveTo } = body;

  if (!roomId || !newFen) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rooms = await db
    .select()
    .from(chaosRooms)
    .where(eq(chaosRooms.id, roomId));

  if (rooms.length === 0) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const room = rooms[0];

  // Verify user is part of this room
  if (room.hostId !== userId && room.guestId !== userId) {
    return NextResponse.json({ error: "Not in this room" }, { status: 403 });
  }

  // Update game state
  const moveHistory = Array.isArray(room.moveHistory) ? [...(room.moveHistory as any[])] : [];
  moveHistory.push({ from, to, timestamp: Date.now() });

  await db
    .update(chaosRooms)
    .set({
      fen: newFen,
      chaosState: chaosState ?? room.chaosState,
      moveHistory,
      lastMoveFrom: lastMoveFrom ?? from,
      lastMoveTo: lastMoveTo ?? to,
      status: body.status ?? room.status,
      capturedPawnsWhite: body.capturedPawnsWhite ?? room.capturedPawnsWhite,
      capturedPawnsBlack: body.capturedPawnsBlack ?? room.capturedPawnsBlack,
      timerWhiteMs: body.timerWhiteMs ?? room.timerWhiteMs,
      timerBlackMs: body.timerBlackMs ?? room.timerBlackMs,
      updatedAt: new Date(),
    })
    .where(eq(chaosRooms.id, roomId));

  return NextResponse.json({ ok: true });
}
