/**
 * Sparring Move API
 *
 * Given a FEN and target rating, returns the best "human-realistic" move to play
 * against the user. Logic:
 *
 * 1. Fetch Lichess Explorer moves for the given rating bucket.
 * 2. If book moves exist (>= MIN_BOOK_GAMES total):
 *    a. Weight each move by games played (popularity sampling).
 *    b. Filter out outright blunders: any move whose eval drop is > blunderThreshold
 *       relative to the best engine move is discarded. This uses a quick depth-8
 *       Stockfish eval on the caller's side — but for the server route we just
 *       return the weighted candidates and let the client do the final blunder check.
 *    c. Return the weighted candidate list so the client can pick with blunder filter.
 * 3. If out of book: return { outOfBook: true } so the client switches to Stockfish
 *    at the appropriate ELO-equivalent depth.
 *
 * GET /api/sparring-move?fen=<fen>&rating=<number>&sideToMove=<white|black>
 */

import { NextRequest, NextResponse } from "next/server";

const LICHESS_EXPLORER = "https://explorer.lichess.org/lichess";

/** Minimum total games across all moves before we consider a position "in book" */
const MIN_BOOK_GAMES = 500;

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

  const url = new URL(LICHESS_EXPLORER);
  url.searchParams.set("variant", "standard");
  url.searchParams.set("fen", fen);
  url.searchParams.set("speeds", "bullet,blitz,rapid,classical");
  url.searchParams.set("ratings", ratings);
  url.searchParams.set("topGames", "0");
  url.searchParams.set("recentGames", "0");
  url.searchParams.set("moves", "20");

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.LICHESS_API_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      // Out-of-book or rate limited — signal client to use Stockfish
      const result = { outOfBook: true, reason: `lichess_${res.status}` };
      return NextResponse.json(result);
    }

    const data = await res.json() as {
      moves?: Array<{
        uci: string;
        san: string;
        white: number;
        draws: number;
        black: number;
        averageRating: number;
      }>;
      white?: number;
      draws?: number;
      black?: number;
    };

    const moves = data.moves ?? [];

    // Count total games across all moves
    const totalGames = moves.reduce(
      (sum, m) => sum + (m.white + m.draws + m.black),
      0,
    );

    if (totalGames < MIN_BOOK_GAMES || moves.length === 0) {
      const result = { outOfBook: true, reason: "insufficient_data", totalGames };
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
    };

    cache.set(cacheKey, { data: result, ts: Date.now() });
    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    // On network error, signal out-of-book so the client falls back to Stockfish
    return NextResponse.json({
      outOfBook: true,
      reason: isTimeout ? "timeout" : "network_error",
    });
  }
}
