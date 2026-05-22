import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/dungeon?difficulty=easy|medium|hard|boss&mode=tactic|opening|endgame|time-pressure|guess-eval|guess-elo&excludeThemes=fork,pin&count=3
 *
 * Fetches Lichess puzzles suitable for the dungeon roguelike mode.
 * Modes map to different theme pools so dungeon acts can feel mechanically distinct,
 * while `excludeThemes` helps avoid showing the same motif over and over in one run.
 */

const LICHESS_PUZZLE_URL = "https://lichess.org/api/puzzle/next";

const THEME_POOLS: Record<string, Record<string, string[]>> = {
  tactic: {
    easy: [
      "mateIn1",
      "oneMove",
      "short",
      "fork",
      "hangingPiece",
      "backRankMate",
    ],
    medium: [
      "mateIn2",
      "pin",
      "skewer",
      "discoveredAttack",
      "sacrifice",
      "deflection",
      "attraction",
    ],
    hard: [
      "mateIn3",
      "quietMove",
      "interference",
      "clearance",
      "long",
      "advancedPawn",
      "xRayAttack",
    ],
    boss: ["mateIn4", "mateIn5", "veryLong", "zugzwang", "smotheredMate"],
  },
  opening: {
    easy: ["opening", "oneMove", "short", "advantage", "castling"],
    medium: ["opening", "short", "advantage", "pin", "deflection", "sacrifice"],
    hard: [
      "opening",
      "middlegame",
      "advantage",
      "quietMove",
      "interference",
      "long",
    ],
    boss: ["opening", "advantage", "quietMove", "long", "veryLong"],
  },
  endgame: {
    easy: ["endgame", "pawnEndgame", "rookEndgame", "promotion"],
    medium: [
      "endgame",
      "rookEndgame",
      "bishopEndgame",
      "knightEndgame",
      "queenEndgame",
    ],
    hard: [
      "endgame",
      "rookEndgame",
      "queenEndgame",
      "bishopEndgame",
      "knightEndgame",
      "zugzwang",
      "promotion",
    ],
    boss: [
      "endgame",
      "queenEndgame",
      "queenRookEndgame",
      "zugzwang",
      "veryLong",
    ],
  },
  "time-pressure": {
    easy: ["oneMove", "fork", "hangingPiece", "mateIn1", "backRankMate"],
    medium: [
      "short",
      "mateIn2",
      "fork",
      "deflection",
      "capturingDefender",
      "backRankMate",
    ],
    hard: [
      "mateIn3",
      "short",
      "deflection",
      "quietMove",
      "intermezzo",
      "discoveredAttack",
    ],
    boss: ["mateIn4", "short", "quietMove", "interference", "veryLong"],
  },
  "guess-eval": {
    easy: ["opening", "middlegame", "advantage", "equality"],
    medium: ["middlegame", "advantage", "equality", "endgame", "quietMove"],
    hard: ["middlegame", "advantage", "endgame", "quietMove", "long"],
    boss: ["middlegame", "endgame", "quietMove", "long", "veryLong"],
  },
  "guess-elo": {
    easy: ["opening", "middlegame", "short", "equality"],
    medium: ["opening", "middlegame", "endgame", "advantage", "equality"],
    hard: ["middlegame", "endgame", "advantage", "quietMove", "long"],
    boss: ["middlegame", "endgame", "quietMove", "long", "veryLong"],
  },
};

function getThemePool(mode: string, difficulty: string): string[] {
  const modePool = THEME_POOLS[mode] ?? THEME_POOLS.tactic;
  return modePool[difficulty] ?? modePool.easy;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const difficulty = searchParams.get("difficulty") ?? "easy";
  const mode = searchParams.get("mode") ?? "tactic";
  const excludeThemes = new Set(
    (searchParams.get("excludeThemes") ?? "")
      .split(",")
      .map((theme) => theme.trim())
      .filter(Boolean),
  );
  const count = Math.min(
    parseInt(searchParams.get("count") ?? "3", 10) || 3,
    8,
  );

  const baseThemes = getThemePool(mode, difficulty);
  const filteredThemes = baseThemes.filter(
    (theme) => !excludeThemes.has(theme),
  );
  const themes = filteredThemes.length > 0 ? filteredThemes : baseThemes;

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
