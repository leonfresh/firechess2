/**
 * POST /api/ghost/result
 * Save a completed Ghost Mode session result.
 *
 * Body: {
 *   gameId: string
 *   syncRate: number          // 0-100
 *   movesPlayed: number
 *   movesMatched: number
 *   cookFound: boolean
 *   cookPly?: number
 *   cookUci?: string
 *   guestToken?: string       // if not logged in
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ghostResults } from "@/lib/schema";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  let body: {
    gameId: string;
    syncRate: number;
    movesPlayed: number;
    movesMatched: number;
    cookFound: boolean;
    cookPly?: number;
    cookUci?: string;
    guestToken?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.gameId || typeof body.syncRate !== "number") {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const syncRate = Math.max(0, Math.min(100, body.syncRate));

  try {
    const [row] = await db
      .insert(ghostResults)
      .values({
        gameId: body.gameId,
        userId,
        guestToken: body.guestToken ?? null,
        syncRate,
        movesPlayed: body.movesPlayed ?? 0,
        movesMatched: body.movesMatched ?? 0,
        cookFound: body.cookFound ?? false,
        cookPly: body.cookPly ?? null,
        cookUci: body.cookUci ?? null,
      })
      .returning({ id: ghostResults.id });

    return NextResponse.json({ id: row.id });
  } catch (err) {
    console.error("[api/ghost/result POST]", err);
    return NextResponse.json(
      { error: "Failed to save result" },
      { status: 500 },
    );
  }
}
