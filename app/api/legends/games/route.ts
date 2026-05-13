/**
 * GET /api/ghost/games
 * List ghost games, optionally filtered by difficulty / featured / search.
 * Returns lightweight game cards (no moves array, no cookCandidates).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ghostGames } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export const revalidate = 3600; // Cache for 1 hour at edge

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const difficulty = searchParams.get("difficulty") as
    | "beginner"
    | "intermediate"
    | "expert"
    | null;
  const featuredOnly = searchParams.get("featured") === "1";

  try {
    const conditions = [];
    if (difficulty) conditions.push(eq(ghostGames.difficulty, difficulty));
    if (featuredOnly) conditions.push(eq(ghostGames.featured, true));

    const rows = await db
      .select({
        id: ghostGames.id,
        whiteName: ghostGames.whiteName,
        blackName: ghostGames.blackName,
        whiteElo: ghostGames.whiteElo,
        blackElo: ghostGames.blackElo,
        tournament: ghostGames.tournament,
        eventDate: ghostGames.eventDate,
        result: ghostGames.result,
        eco: ghostGames.eco,
        openingName: ghostGames.openingName,
        playAs: ghostGames.playAs,
        startPly: ghostGames.startPly,
        endPly: ghostGames.endPly,
        missionTitle: ghostGames.missionTitle,
        missionContext: ghostGames.missionContext,
        missionObjective: ghostGames.missionObjective,
        difficulty: ghostGames.difficulty,
        tags: ghostGames.tags,
        featured: ghostGames.featured,
        sourceUrl: ghostGames.sourceUrl,
        createdAt: ghostGames.createdAt,
      })
      .from(ghostGames)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(ghostGames.featured, ghostGames.createdAt);

    return NextResponse.json({ games: rows });
  } catch (err) {
    console.error("[api/ghost/games GET]", err);
    return NextResponse.json(
      { error: "Failed to load games" },
      { status: 500 },
    );
  }
}
