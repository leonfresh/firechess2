/**
 * GET  /api/chaos/rating?roomId=xxx  — returns both players' ratings for a room
 * GET  /api/chaos/rating             — returns just the caller's rating
 * POST /api/chaos/rating             — submit game result; saves ELO for both players
 *   Body: { roomId, result: "win" | "loss" | "draw" }
 *         { mode: "ai", difficulty: "easy"|"medium"|"hard", result }  — AI game (no roomId)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosRatings, chaosRooms } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getChaosUserId } from "@/lib/chaos-auth";
import { computeEloChange, DEFAULT_CHAOS_ELO } from "@/lib/chaos-elo";

/* ── helper: fetch or create a rating row ─────────────────────────── */
async function getRating(userId: string) {
  const rows = await db.select().from(chaosRatings).where(eq(chaosRatings.userId, userId));
  if (rows.length > 0) return rows[0];
  // Default for new players — not inserted yet (lazy insert on first save)
  return {
    userId,
    rating: DEFAULT_CHAOS_ELO,
    wins: 0,
    losses: 0,
    draws: 0,
    gamesPlayed: 0,
    peakRating: DEFAULT_CHAOS_ELO,
  };
}

/* ── GET ──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const session = await auth();
  const roomId = req.nextUrl.searchParams.get("roomId");

  if (!roomId) {
    // Just return caller's own rating
    if (!session?.user?.id) return NextResponse.json({ rating: DEFAULT_CHAOS_ELO, gamesPlayed: 0 });
    const row = await getRating(session.user.id);
    return NextResponse.json({ rating: row.rating, gamesPlayed: row.gamesPlayed, wins: row.wins, losses: row.losses, draws: row.draws, peakRating: row.peakRating });
  }

  // Return both players' ratings for the room
  const userId = await getChaosUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rooms = await db.select().from(chaosRooms).where(eq(chaosRooms.id, roomId));
  if (rooms.length === 0) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const room = rooms[0];
  if (room.hostId !== userId && room.guestId !== userId) {
    return NextResponse.json({ error: "Not in this room" }, { status: 403 });
  }

  const opponentId = room.hostId === userId ? room.guestId : room.hostId;
  const [myRow, oppRow] = await Promise.all([
    getRating(userId),
    opponentId ? getRating(opponentId) : Promise.resolve({ rating: DEFAULT_CHAOS_ELO, gamesPlayed: 0 }),
  ]);

  return NextResponse.json({
    myRating: myRow.rating,
    myGamesPlayed: myRow.gamesPlayed,
    opponentRating: (oppRow as any).rating,
  });
}

/* ── POST ─────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json();
  const { roomId, result, mode, difficulty } = body as {
    roomId?: string;
    result: "win" | "loss" | "draw";
    mode?: string;
    difficulty?: string;
  };

  if (!result) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  /* ── AI game: no room required, use fixed AI rating by difficulty ── */
  if (mode === "ai") {
    const aiRating = difficulty === "hard" ? 1600 : difficulty === "medium" ? 1200 : 800;
    const myRow = await getRating(userId);
    const score: 1 | 0.5 | 0 = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
    const delta = computeEloChange(myRow.rating, aiRating, score, myRow.gamesPlayed);
    const newRating = Math.max(100, myRow.rating + delta);
    const myUpdate = {
      rating: newRating,
      wins: myRow.wins + (result === "win" ? 1 : 0),
      losses: myRow.losses + (result === "loss" ? 1 : 0),
      draws: myRow.draws + (result === "draw" ? 1 : 0),
      gamesPlayed: myRow.gamesPlayed + 1,
      peakRating: Math.max(myRow.peakRating, newRating),
      updatedAt: new Date(),
    };
    const existing = await db.select().from(chaosRatings).where(eq(chaosRatings.userId, userId));
    if (existing.length > 0) {
      await db.update(chaosRatings).set(myUpdate).where(eq(chaosRatings.userId, userId));
    } else {
      await db.insert(chaosRatings).values({ userId, ...myUpdate });
    }
    return NextResponse.json({ ok: true, newRating, delta });
  }

  /* ── Multiplayer game: needs roomId ── */
  if (!roomId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const rooms = await db.select().from(chaosRooms).where(eq(chaosRooms.id, roomId));
  if (rooms.length === 0) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const room = rooms[0];
  if (room.hostId !== userId && room.guestId !== userId) {
    return NextResponse.json({ error: "Not in this room" }, { status: 403 });
  }

  const opponentId = room.hostId === userId ? room.guestId : room.hostId;

  const [myRow, oppRow] = await Promise.all([
    getRating(userId),
    opponentId ? getRating(opponentId) : Promise.resolve(null),
  ]);

  const myRating = myRow.rating;
  const oppRating = oppRow?.rating ?? DEFAULT_CHAOS_ELO;
  const myGames = myRow.gamesPlayed;

  const score: 1 | 0.5 | 0 = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
  const delta = computeEloChange(myRating, oppRating, score, myGames);
  const newRating = Math.max(100, myRating + delta);

  // Upsert my rating
  const myUpdate = {
    rating: newRating,
    wins: myRow.wins + (result === "win" ? 1 : 0),
    losses: myRow.losses + (result === "loss" ? 1 : 0),
    draws: myRow.draws + (result === "draw" ? 1 : 0),
    gamesPlayed: myGames + 1,
    peakRating: Math.max(myRow.peakRating, newRating),
    updatedAt: new Date(),
  };

  const existingMine = await db.select().from(chaosRatings).where(eq(chaosRatings.userId, userId));
  if (existingMine.length > 0) {
    await db.update(chaosRatings).set(myUpdate).where(eq(chaosRatings.userId, userId));
  } else {
    await db.insert(chaosRatings).values({ userId, ...myUpdate });
  }

  // Also save opponent's rating if they're a real (non-guest) user
  if (opponentId && !opponentId.startsWith("guest_") && oppRow) {
    const oppScore: 1 | 0.5 | 0 = result === "win" ? 0 : result === "draw" ? 0.5 : 1;
    const oppDelta = computeEloChange(oppRating, myRating, oppScore, (oppRow as any).gamesPlayed ?? 0);
    const newOppRating = Math.max(100, oppRating + oppDelta);
    const oppUpdate = {
      rating: newOppRating,
      wins: (oppRow as any).wins + (oppScore === 1 ? 1 : 0),
      losses: (oppRow as any).losses + (oppScore === 0 ? 1 : 0),
      draws: (oppRow as any).draws + (oppScore === 0.5 ? 1 : 0),
      gamesPlayed: ((oppRow as any).gamesPlayed ?? 0) + 1,
      peakRating: Math.max((oppRow as any).peakRating ?? DEFAULT_CHAOS_ELO, newOppRating),
      updatedAt: new Date(),
    };
    const existingOpp = await db.select().from(chaosRatings).where(eq(chaosRatings.userId, opponentId));
    if (existingOpp.length > 0) {
      await db.update(chaosRatings).set(oppUpdate).where(eq(chaosRatings.userId, opponentId));
    } else {
      await db.insert(chaosRatings).values({ userId: opponentId, ...oppUpdate });
    }
  }

  return NextResponse.json({ ok: true, newRating, delta });
}
