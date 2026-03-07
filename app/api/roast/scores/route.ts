/**
 * POST /api/roast/scores — Save a Roast the Elo session score.
 *
 * Body: { score: number, gamesPlayed: number, streakCount: number, quizScore: number }
 * Requires authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roastScores } from "@/lib/schema";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { score, gamesPlayed, streakCount, quizScore } = body;

    if (typeof score !== "number" || typeof gamesPlayed !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const [row] = await db
      .insert(roastScores)
      .values({
        userId: session.user.id,
        score: Math.max(0, Math.round(score)),
        gamesPlayed: Math.max(0, Math.round(gamesPlayed)),
        streakCount: Math.max(0, Math.round(streakCount ?? 0)),
        quizScore: Math.max(0, Math.round(quizScore ?? 0)),
      })
      .returning({ id: roastScores.id });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("Failed to save roast score:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
