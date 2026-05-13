/**
 * GET /api/ghost/games/[id]
 * Returns the full game data needed for a Ghost Mode session:
 * - moves array (ply, san, uci, fenAfter)
 * - cookCandidates
 * - all mission metadata
 * Raw pgnMoves is excluded from the response.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ghostGames } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
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
        moves: ghostGames.moves,
        playAs: ghostGames.playAs,
        startPly: ghostGames.startPly,
        endPly: ghostGames.endPly,
        missionTitle: ghostGames.missionTitle,
        missionContext: ghostGames.missionContext,
        missionObjective: ghostGames.missionObjective,
        difficulty: ghostGames.difficulty,
        tags: ghostGames.tags,
        featured: ghostGames.featured,
        cookCandidates: ghostGames.cookCandidates,
        sourceUrl: ghostGames.sourceUrl,
      })
      .from(ghostGames)
      .where(eq(ghostGames.id, id));

    if (rows.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("[api/ghost/games/[id] GET]", err);
    return NextResponse.json({ error: "Failed to load game" }, { status: 500 });
  }
}
