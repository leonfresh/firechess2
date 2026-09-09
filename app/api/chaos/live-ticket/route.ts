import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chaosRooms } from "@/lib/schema";
import { getChaosUserId } from "@/lib/chaos-auth";
import { createLiveToken } from "@/lib/chaos-live-token";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (!process.env.CHAOS_LIVE_ORIGIN || !process.env.CHAOS_LIVE_SECRET) return reply({ error: "Live hosting unavailable" }, 503);
  const user = await getChaosUserId(req), roomId = req.nextUrl.searchParams.get("roomId");
  if (!user) return reply({ error: "Unauthorized" }, 401);
  if (!roomId || roomId.length > 80) return reply({ error: "Missing room" }, 400);
  const [room] = await db.select({ hostId: chaosRooms.hostId, guestId: chaosRooms.guestId }).from(chaosRooms).where(eq(chaosRooms.id, roomId));
  if (!room || room.hostId !== user && room.guestId !== user) return reply({ error: "Not in this room" }, 403);
  return reply({ token: createLiveToken(roomId, user), origin: process.env.CHAOS_LIVE_ORIGIN });
}
