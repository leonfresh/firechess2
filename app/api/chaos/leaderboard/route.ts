/**
 * GET /api/chaos/leaderboard?limit=50
 * Returns top Chaos Chess players ranked by ELO rating.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosRatings, users } from "@/lib/schema";
import { desc, sql, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const limit = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10) || 50, 1),
    100,
  );

  const rows = await db
    .select({
      userId: chaosRatings.userId,
      rating: chaosRatings.rating,
      wins: chaosRatings.wins,
      losses: chaosRatings.losses,
      draws: chaosRatings.draws,
      gamesPlayed: chaosRatings.gamesPlayed,
      peakRating: chaosRatings.peakRating,
      updatedAt: chaosRatings.updatedAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(chaosRatings)
    .innerJoin(users, sql`${chaosRatings.userId} = ${users.id}`)
    .where(gte(chaosRatings.gamesPlayed, 1))
    .orderBy(desc(chaosRatings.rating))
    .limit(limit);

  return NextResponse.json({ entries: rows });
}
