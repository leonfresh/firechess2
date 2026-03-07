/**
 * GET /api/roast/leaderboard — Roast the Elo public leaderboard.
 *
 * Query params:
 *   period = "daily" | "weekly" (default) | "lifetime"
 *   limit  = number (default 50, max 100)
 *
 * Returns top roast scores with user info.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roastScores, users } from "@/lib/schema";
import { desc, gte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "weekly";
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1),
    100,
  );

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const conditions: ReturnType<typeof gte>[] = [];
  if (period === "daily") {
    conditions.push(gte(roastScores.createdAt, dayAgo));
  } else if (period === "weekly") {
    conditions.push(gte(roastScores.createdAt, weekAgo));
  }
  // "lifetime" has no time filter

  const whereClause =
    conditions.length > 0
      ? sql`${sql.join(conditions, sql` AND `)}`
      : undefined;

  const rows = await db
    .select({
      id: roastScores.id,
      score: roastScores.score,
      gamesPlayed: roastScores.gamesPlayed,
      streakCount: roastScores.streakCount,
      quizScore: roastScores.quizScore,
      createdAt: roastScores.createdAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(roastScores)
    .innerJoin(users, sql`${roastScores.userId} = ${users.id}`)
    .where(whereClause)
    .orderBy(desc(roastScores.score))
    .limit(limit);

  return NextResponse.json({ period, entries: rows });
}
