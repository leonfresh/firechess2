/**
 * GET /api/leaderboard — Public leaderboard.
 *
 * Query params:
 *   period = "week" (default) | "all"
 *   limit  = number (default 50, max 100)
 *
 * Returns the top reports by firechessScore.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports, users } from "@/lib/schema";
import { desc, gte, isNotNull, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "week";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 100);

  // Build a WHERE clause for time period
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const conditions = [isNotNull(reports.firechessScore)];
  if (period === "week") {
    conditions.push(gte(reports.createdAt, weekAgo));
  }

  const rows = await db
    .select({
      id: reports.id,
      chessUsername: reports.chessUsername,
      source: reports.source,
      firechessScore: reports.firechessScore,
      estimatedAccuracy: reports.estimatedAccuracy,
      weightedCpLoss: reports.weightedCpLoss,
      leakCount: reports.leakCount,
      tacticsCount: reports.tacticsCount,
      gamesAnalyzed: reports.gamesAnalyzed,
      playerRating: reports.playerRating,
      createdAt: reports.createdAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(reports)
    .innerJoin(users, sql`${reports.userId} = ${users.id}`)
    .where(sql`${sql.join(conditions, sql` AND `)}`)
    .orderBy(desc(reports.firechessScore))
    .limit(limit);

  return NextResponse.json({ period, entries: rows });
}
