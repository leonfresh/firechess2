/**
 * GET /api/recruit/ghost?round=N
 *
 * Returns a ghost build for the given round.
 * Tries to find a real player ghost from the DB first,
 * falls back to a generated AI ghost if none found.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recruitGhostBuilds } from "@/lib/schema";
import { eq, gte, lte, sql } from "drizzle-orm";
import { generateGhostBuild } from "@/lib/recruit-chess";

export async function GET(req: NextRequest) {
  const roundParam = req.nextUrl.searchParams.get("round");
  const round = Math.max(1, Math.min(8, parseInt(roundParam ?? "1", 10) || 1));

  try {
    // Look for a human ghost build within ±1 round range
    const rows = await db
      .select()
      .from(recruitGhostBuilds)
      .where(
        sql`${recruitGhostBuilds.round} BETWEEN ${round - 1} AND ${round + 1}
          AND ${recruitGhostBuilds.isAI} = false`,
      )
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (rows.length > 0) {
      const row = rows[0];
      return NextResponse.json({
        displayName: row.displayName,
        commander: row.commander,
        army: row.armySnapshot,
        round: row.round,
        rating: row.rating,
        isAI: false,
      });
    }
  } catch {
    // DB failure — fall through to AI ghost
  }

  // Generate an AI ghost
  const ghost = generateGhostBuild(round, "tactician");
  return NextResponse.json(ghost);
}
