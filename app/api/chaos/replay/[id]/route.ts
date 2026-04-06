/**
 * GET /api/chaos/replay/[id]
 * Public endpoint — returns finished game data for replay viewing.
 * No authentication required; only exposes data for games with status "finished".
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosRooms } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const rooms = await db
    .select({
      id: chaosRooms.id,
      status: chaosRooms.status,
      hostColor: chaosRooms.hostColor,
      chaosState: chaosRooms.chaosState,
      moveHistory: chaosRooms.moveHistory,
      createdAt: chaosRooms.createdAt,
    })
    .from(chaosRooms)
    .where(eq(chaosRooms.id, id));

  if (rooms.length === 0) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const room = rooms[0];

  // Only expose finished games to the public
  if (room.status !== "finished") {
    return NextResponse.json(
      { error: "Game not finished or not available for replay" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: room.id,
    hostColor: room.hostColor,
    chaosState: room.chaosState,
    moveHistory: room.moveHistory,
    createdAt: room.createdAt?.toISOString() ?? null,
  });
}
