import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/puzzles?themes=fork,pin&count=3
 *
 * Fetches random Lichess puzzles filtered by theme.
 * We fetch one puzzle per theme (up to `count`) so the user gets
 * variety across their weak areas.
 */

const LICHESS_PUZZLE_URL = "https://lichess.org/api/puzzle/next";

// Valid Lichess puzzle themes we map to
const VALID_THEMES = new Set([
  "advancedPawn", "advantage", "anapiamata", "arabianMate", "attackingF2F7",
  "attraction", "backRankMate", "bishopEndgame", "bodenMate", "capturingDefender",
  "castling", "clearance", "crushing", "defensiveMove", "deflection",
  "discoveredAttack", "doubleBishopMate", "doubleCheck", "enPassant",
  "endgame", "equality", "exposedKing", "fork", "hangingPiece",
  "hookMate", "interference", "intermezzo", "kingsideAttack",
  "knightEndgame", "long", "master", "masterVsMaster", "mate", "mateIn1",
  "mateIn2", "mateIn3", "mateIn4", "mateIn5", "middlegame", "oneMove",
  "opening", "pawnEndgame", "pin", "promotion", "queenEndgame",
  "queenRookEndgame", "queensideAttack", "quietMove", "rookEndgame",
  "sacrifice", "short", "skewer", "smotheredMate", "superGM",
  "trappedPiece", "underPromotion", "veryLong", "xRayAttack", "zugzwang",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const themesParam = searchParams.get("themes") ?? "";
  const count = Math.min(parseInt(searchParams.get("count") ?? "3", 10) || 3, 6);

  const requestedThemes = themesParam
    .split(",")
    .map((t) => t.trim())
    .filter((t) => VALID_THEMES.has(t));

  if (requestedThemes.length === 0) {
    return NextResponse.json({ puzzles: [] });
  }

  // Fetch one puzzle per theme, up to count
  const themesToFetch = requestedThemes.slice(0, count);
  const puzzles: any[] = [];

  for (const theme of themesToFetch) {
    try {
      const res = await fetch(`${LICHESS_PUZZLE_URL}?angle=${theme}`, {
        headers: { Accept: "application/json" },
        // Don't cache — we want fresh random puzzles
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = await res.json();
      puzzles.push({
        ...data,
        matchedTheme: theme,
      });
    } catch {
      // Skip failed fetches
    }
  }

  return NextResponse.json({ puzzles });
}
