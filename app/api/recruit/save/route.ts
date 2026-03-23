/**
 * POST /api/recruit/save
 *
 * Save a completed Recruit Chess game and contribute the player's army
 * to the ghost pool for future opponents.
 *
 * Body (JSON):
 *   {
 *     commander: string,
 *     army: Array<{pieceType, modifierId, tier}>,
 *     roundsCompleted: number,
 *     won: boolean,
 *     finalHp: number,
 *     displayName?: string,   // name to show as ghost opponent
 *     guestToken?: string,    // if not logged in
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recruitGames, recruitGhostBuilds } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { calcRecruitRating } from "@/lib/recruit-chess";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  let body: {
    commander: string;
    army: unknown;
    roundsCompleted: number;
    won: boolean;
    finalHp: number;
    displayName?: string;
    guestToken?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Basic validation
  if (!body.commander || typeof body.roundsCompleted !== "number") {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const rating = calcRecruitRating(
    body.won ? body.roundsCompleted : Math.max(0, body.roundsCompleted - 1),
    body.finalHp,
    body.roundsCompleted,
  );

  try {
    // Save the game record
    const [game] = await db
      .insert(recruitGames)
      .values({
        userId,
        guestToken: body.guestToken ?? null,
        commander: body.commander,
        armySnapshot: body.army ?? [],
        roundsCompleted: body.roundsCompleted,
        won: body.won,
        finalHp: body.finalHp,
        rating,
      })
      .returning({ id: recruitGames.id });

    // Add the army to the ghost pool so future players can face it
    if (body.roundsCompleted >= 1) {
      await db.insert(recruitGhostBuilds).values({
        userId,
        guestToken: body.guestToken ?? null,
        displayName: body.displayName ?? "Ghost Player",
        commander: body.commander,
        armySnapshot: body.army ?? [],
        round: body.roundsCompleted,
        rating,
        isAI: false,
      });
    }

    return NextResponse.json({ gameId: game.id, rating });
  } catch (err) {
    console.error("[recruit/save]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
