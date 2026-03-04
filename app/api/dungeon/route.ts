import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/dungeon?difficulty=easy|medium|hard&count=3
 *
 * Fetches Lichess puzzles suitable for the dungeon roguelike mode.
 * Maps difficulty to appropriate Lichess puzzle themes:
 *   easy   → mateIn1, oneMove, short, fork, hangingPiece
 *   medium → mateIn2, pin, skewer, discoveredAttack, sacrifice, deflection
 *   hard   → mateIn3, quietMove, interference, zugzwang, long, veryLong
 *   boss   → mateIn4, mateIn5, veryLong, zugzwang
 */

const LICHESS_PUZZLE_URL = "https://lichess.org/api/puzzle/next";

const DIFFICULTY_THEMES: Record<string, string[]> = {
  easy: ["mateIn1", "oneMove", "short", "fork", "hangingPiece", "backRankMate"],
  medium: ["mateIn2", "pin", "skewer", "discoveredAttack", "sacrifice", "deflection", "attraction"],
  hard: ["mateIn3", "quietMove", "interference", "clearance", "long", "advancedPawn", "xRayAttack"],
  boss: ["mateIn4", "mateIn5", "veryLong", "zugzwang", "smotheredMate"],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const difficulty = searchParams.get("difficulty") ?? "easy";
  const count = Math.min(parseInt(searchParams.get("count") ?? "3", 10) || 3, 8);

  const themes = DIFFICULTY_THEMES[difficulty] ?? DIFFICULTY_THEMES.easy;

  // Pick random themes from the difficulty pool
  const shuffled = [...themes].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  const puzzles: any[] = [];

  for (const theme of selected) {
    try {
      const res = await fetch(`${LICHESS_PUZZLE_URL}?angle=${theme}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = await res.json();
      puzzles.push({
        ...data,
        matchedTheme: theme,
        difficulty,
      });
    } catch {
      // Skip failed fetches
    }
  }

  return NextResponse.json({ puzzles });
}
