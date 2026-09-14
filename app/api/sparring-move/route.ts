/**
 * Sparring Move API
 *
 * Given a FEN and target rating, returns the best "human-realistic" move to play
 * against the user. Logic:
 *
 * 1. Fetch Lichess Explorer moves for the given rating bucket.
 * 2. If that bucket is thin (< BROADEN_BELOW games), re-query with no rating
 *    filter and use the wider set — flagged `broadened` so the client can say
 *    so. The point is to keep drawing real human moves as deep as the database
 *    goes instead of ending the book early.
 * 3. If book moves exist (>= MIN_BOOK_GAMES total):
 *    a. Weight each move by games played (popularity sampling).
 *    b. Filter out outright blunders: any move whose eval drop is > blunderThreshold
 *       relative to the best engine move is discarded. This uses a quick depth-8
 *       Stockfish eval on the caller's side — but for the server route we just
 *       return the weighted candidates and let the client do the final blunder check.
 *    c. Return the weighted candidate list so the client can pick with blunder filter.
 * 4. If nothing is left: return { outOfBook: true } so the client switches to
 *    Stockfish at the appropriate ELO-equivalent depth — silently, mid-game.
 *
 * GET /api/sparring-move?fen=<fen>&rating=<number>&sideToMove=<white|black>
 */

import { NextRequest, NextResponse } from "next/server";

const LICHESS_EXPLORER = "https://explorer.lichess.org/lichess";

/**
 * Minimum total games across all moves before we consider a position "in book".
 * One game is enough — the opponent keeps playing real database moves for as
 * long as the database has anything at all.
 */
const MIN_BOOK_GAMES = 1;

/** Below this many games in the rating buckets, widen the search to all ratings */
const BROADEN_BELOW = 10;

/**
 * Map a target rating to Lichess rating buckets.
 * Each bucket covers from its value to the next. We pick a reasonable spread.
 */
function ratingsForTarget(rating: number): string {
  if (rating < 1200) return "0,1000,1200";
  if (rating < 1400) return "1000,1200,1400";
  if (rating < 1600) return "1200,1400,1600";
  if (rating < 1800) return "1400,1600,1800";
  if (rating < 2000) return "1600,1800,2000";
  if (rating < 2200) return "1800,2000,2200";
  if (rating < 2500) return "2000,2200,2500";
  return "2200,2500";
}

type ExplorerMove = {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number;
};

/** Returns null when the explorer can't be reached — distinct from "no games". */
async function fetchExplorerMoves(
  fen: string,
  ratings: string | null,
  headers: Record<string, string>,
): Promise<ExplorerMove[] | null> {
  const url = new URL(LICHESS_EXPLORER);
  url.searchParams.set("variant", "standard");
  url.searchParams.set("fen", fen);
  url.searchParams.set("speeds", "bullet,blitz,rapid,classical");
  if (ratings) url.searchParams.set("ratings", ratings);
  url.searchParams.set("topGames", "0");
  url.searchParams.set("recentGames", "0");
  url.searchParams.set("moves", "20");

  const res = await fetch(url.toString(), {
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { moves?: ExplorerMove[] };
  return data.moves ?? [];
}

function countGames(moves: ExplorerMove[]): number {
  return moves.reduce((sum, m) => sum + (m.white + m.draws + m.black), 0);
}

/** Server-side cache */
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fen = searchParams.get("fen");
  const ratingParam = searchParams.get("rating");
  const sideToMove = searchParams.get("sideToMove") ?? "white";

  if (!fen) {
    return NextResponse.json({ error: "Missing fen" }, { status: 400 });
  }

  const rating = Math.max(500, Math.min(3000, parseInt(ratingParam ?? "1500", 10)));
  const ratings = ratingsForTarget(rating);

  const cacheKey = `${fen}|${rating}|${sideToMove}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, { headers: { "X-Cache": "HIT" } });
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.LICHESS_API_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const bucketed = await fetchExplorerMoves(fen, ratings, headers);
    if (bucketed === null) {
      // Explorer unreachable or rate-limited — NOT cached, so a transient blip
      // doesn't pin this position to Stockfish for the next 10 minutes.
      return NextResponse.json({
        outOfBook: true,
        reason: "explorer_unavailable",
      });
    }

    let moves = bucketed;
    let broadened = false;
    if (countGames(bucketed) < BROADEN_BELOW) {
      const wide = await fetchExplorerMoves(fen, null, headers);
      if (wide && countGames(wide) > countGames(bucketed)) {
        moves = wide;
        broadened = true;
      }
    }

    const totalGames = countGames(moves);

    if (moves.length === 0 || totalGames < MIN_BOOK_GAMES) {
      const result = { outOfBook: true, reason: "no_games", totalGames };
      cache.set(cacheKey, { data: result, ts: Date.now() });
      return NextResponse.json(result);
    }

    // Build candidate list with game counts and win rates
    const candidates = moves.map((m) => {
      const games = m.white + m.draws + m.black;
      const winRate =
        sideToMove === "white"
          ? (m.white + 0.5 * m.draws) / Math.max(1, games)
          : (m.black + 0.5 * m.draws) / Math.max(1, games);
      return {
        uci: m.uci,
        san: m.san,
        games,
        winRate: Math.round(winRate * 1000) / 1000,
        averageRating: m.averageRating,
        white: m.white,
        draws: m.draws,
        black: m.black,
      };
    });

    const result = {
      outOfBook: false,
      candidates,
      totalGames,
      targetRating: rating,
      broadened,
    };

    cache.set(cacheKey, { data: result, ts: Date.now() });
    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    // On network error, signal out-of-book so the client falls through to
    // Stockfish without interrupting the game.
    return NextResponse.json({
      outOfBook: true,
      reason: isTimeout ? "timeout" : "network_error",
    });
  }
}
