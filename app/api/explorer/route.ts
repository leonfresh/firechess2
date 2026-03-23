/**
 * Server-side proxy for the Lichess Opening Explorer API.
 *
 * Proxying through Next.js server-side avoids CORS / COEP issues that arise
 * when the browser calls explorer.lichess.org directly under our strict
 * Cross-Origin-Embedder-Policy: require-corp headers.
 *
 * GET /api/explorer?fen=<fen>&sideToMove=<white|black>
 */

import { NextRequest, NextResponse } from "next/server";

const LICHESS_EXPLORER = "https://explorer.lichess.org/lichess";

// Server-side cache — shared across all requests for the lifetime of the process.
// Avoids hammering Lichess when multiple clients hit the same position.
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fen = searchParams.get("fen");
  const sideToMove = searchParams.get("sideToMove") ?? "white";

  if (!fen) {
    return NextResponse.json(
      { error: "Missing fen parameter" },
      { status: 400 },
    );
  }

  const cacheKey = `${fen}|${sideToMove}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { "X-Cache": "HIT" },
    });
  }

  const url = new URL(LICHESS_EXPLORER);
  url.searchParams.set("variant", "standard");
  url.searchParams.set("fen", fen);
  url.searchParams.set("speeds", "bullet,blitz,rapid,classical");
  url.searchParams.set("ratings", "1600,1800,2000,2200,2500");
  url.searchParams.set("topGames", "0");
  url.searchParams.set("recentGames", "0");

  const headers: Record<string, string> = { Accept: "application/json" };
  const lichessToken = process.env.LICHESS_API_TOKEN;
  if (lichessToken) {
    headers["Authorization"] = `Bearer ${lichessToken}`;
  }

  try {
    const res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(10_000),
      // next: { revalidate: 300 } // optional ISR cache
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Lichess explorer error", status: res.status },
        { status: res.status === 429 ? 429 : 502 },
      );
    }

    const data = await res.json();
    cache.set(cacheKey, { data, ts: Date.now() });

    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      { error: isTimeout ? "Upstream timeout" : "Network error" },
      { status: 504 },
    );
  }
}
