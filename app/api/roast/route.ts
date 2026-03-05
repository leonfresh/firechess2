/**
 * /api/roast — Fetch random Lichess games for "Guess the Elo" roast mode
 *
 * Uses the Lichess database explorer to find recent games at random Elo
 * brackets, then exports the full PGN from the Lichess game API.
 *
 * Query params:
 *   ?bracket=1400  — optional, target Elo bracket (default: random)
 */

import { NextRequest, NextResponse } from "next/server";

/* ── Lichess rating brackets available in the explorer ── */
const RATING_BRACKETS = [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500] as const;

// Weighted pool to bias towards mid-Elos (where most fun/blunders are)
const WEIGHTED_POOL = [
  1000, 1000,
  1200, 1200, 1200,
  1400, 1400, 1400, 1400,
  1600, 1600, 1600, 1600,
  1800, 1800, 1800,
  2000, 2000,
  2200,
  2500,
];

type ExplorerGame = {
  id: string;
  winner: "white" | "black" | null;
  speed: string;
  white: { name: string; rating: number };
  black: { name: string; rating: number };
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const requestedBracket = url.searchParams.get("bracket");

    // Pick bracket
    let bracket: number;
    if (requestedBracket && RATING_BRACKETS.includes(Number(requestedBracket) as any)) {
      bracket = Number(requestedBracket);
    } else {
      bracket = WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
    }

    // Fetch recent games from the Lichess database explorer
    const explorerUrl = `https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid&ratings=${bracket}&recentGames=8`;
    const explorerRes = await fetch(explorerUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!explorerRes.ok) {
      console.error("Explorer API error:", explorerRes.status);
      return NextResponse.json({ error: "Failed to fetch from Lichess explorer" }, { status: 502 });
    }

    const explorerData = await explorerRes.json();
    const recentGames: ExplorerGame[] = explorerData.recentGames ?? [];

    if (recentGames.length === 0) {
      return NextResponse.json({ error: "No games found" }, { status: 404 });
    }

    // Pick a random game from the results (prefer decisive results for entertainment)
    const decisiveGames = recentGames.filter((g) => g.winner);
    const pool = decisiveGames.length > 0 ? decisiveGames : recentGames;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    // Fetch the full PGN from Lichess
    const pgnUrl = `https://lichess.org/game/export/${picked.id}?evals=false&clocks=false&opening=true`;
    const pgnRes = await fetch(pgnUrl, {
      headers: { Accept: "application/x-chess-pgn" },
      next: { revalidate: 0 },
    });

    if (!pgnRes.ok) {
      console.error("Game export error:", pgnRes.status);
      return NextResponse.json({ error: "Failed to export game" }, { status: 502 });
    }

    const pgn = await pgnRes.text();

    // Parse opening from PGN headers
    const openingMatch = pgn.match(/\[Opening "(.+?)"\]/);
    const opening = openingMatch?.[1] ?? "Unknown Opening";

    // Parse result
    const resultMatch = pgn.match(/\[Result "(.+?)"\]/);
    const result = resultMatch?.[1] ?? "*";

    // Parse termination
    const terminationMatch = pgn.match(/\[Termination "(.+?)"\]/);
    const termination = terminationMatch?.[1] ?? "";

    return NextResponse.json({
      id: picked.id,
      pgn,
      whitePlayer: picked.white.name,
      blackPlayer: picked.black.name,
      whiteElo: picked.white.rating,
      blackElo: picked.black.rating,
      avgElo: Math.round((picked.white.rating + picked.black.rating) / 2),
      bracket,
      opening,
      result,
      termination,
      winner: picked.winner,
    });
  } catch (err) {
    console.error("Roast API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
