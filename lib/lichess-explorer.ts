/**
 * Lichess Opening Explorer API integration.
 *
 * Queries https://explorer.lichess.ovh/lichess for a given FEN and returns
 * move-level statistics. Identifies "outlier" moves — those that appear in
 * 100+ games and have a win-rate significantly above the field — so they
 * can be highlighted as database recommendations on the board.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ExplorerMove = {
  uci: string;
  san: string;
  white: number;   // white wins count
  draws: number;
  black: number;   // black wins count
  totalGames: number;
  winRate: number;  // from the perspective of sideToMove (0-1)
  averageRating: number;
};

export type ExplorerResult = {
  moves: ExplorerMove[];
  totalGames: number;
  /** The strongest database pick (outlier), or null if nothing qualifies. */
  topPick: ExplorerMove | null;
  /** Opening name from the Lichess database, e.g. "Dutch Defense" */
  openingName?: string;
  /** ECO code, e.g. "A80" */
  openingEco?: string;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const API_BASE = "https://explorer.lichess.ovh/lichess";

/** Only consider moves with at least this many games. */
const MIN_GAMES = 100;

/**
 * A move must beat the weighted-average win-rate by at least this many
 * percentage points to qualify as an "outlier".
 */
const OUTLIER_MARGIN = 0.04; // 4 pp

/** Minimum absolute win-rate for the top pick (avoid noise in equal positions). */
const MIN_WIN_RATE = 0.48;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function computeWinRate(
  white: number,
  draws: number,
  black: number,
  sideToMove: "white" | "black",
): number {
  const total = white + draws + black;
  if (total === 0) return 0;
  const wins = sideToMove === "white" ? white : black;
  return (wins + 0.5 * draws) / total;
}

/* ------------------------------------------------------------------ */
/*  Request queue — prevents 429 by serialising API calls              */
/* ------------------------------------------------------------------ */

const CONCURRENCY = 1;           // max parallel requests (1 = fully serial)
const DELAY_BETWEEN_MS = 350;    // minimum gap between requests
const MAX_RETRIES = 3;           // retry on 429 / 5xx
const INITIAL_BACKOFF_MS = 1500; // first retry waits this long

/** In-flight count and pending queue */
let inflight = 0;
const pending: Array<() => void> = [];

function enqueue(): Promise<void> {
  if (inflight < CONCURRENCY) {
    inflight++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    pending.push(() => { inflight++; resolve(); });
  });
}

function dequeue(): void {
  // Add a small delay before releasing the next request
  setTimeout(() => {
    inflight--;
    if (pending.length > 0) {
      const next = pending.shift()!;
      next();
    }
  }, DELAY_BETWEEN_MS);
}

/* ------------------------------------------------------------------ */
/*  Response cache — avoid re-fetching the same position               */
/* ------------------------------------------------------------------ */

type CacheEntry = { result: ExplorerResult; timestamp: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(fen: string, sideToMove: string): string {
  return `${fen}|${sideToMove}`;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch Lichess explorer data for a position and return an outlier top-pick
 * if one exists.
 *
 * Requests are automatically queued (max 1 in-flight at a time with 350ms
 * spacing) to respect the Lichess Explorer API rate limit. Results are
 * cached for 5 minutes.
 *
 * @param fen        The position to look up.
 * @param sideToMove Which colour is to move (so we compute win-rate correctly).
 * @returns          An `ExplorerResult` (moves may be empty on error / 404).
 */
export async function fetchExplorerMoves(
  fen: string,
  sideToMove: "white" | "black",
): Promise<ExplorerResult> {
  const empty: ExplorerResult = { moves: [], totalGames: 0, topPick: null, openingName: undefined, openingEco: undefined };

  // Check cache first
  const key = cacheKey(fen, sideToMove);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  // Wait for our turn in the queue
  await enqueue();

  try {
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const url = new URL(API_BASE);
        url.searchParams.set("variant", "standard");
        url.searchParams.set("fen", fen);
        url.searchParams.set("speeds", "bullet,blitz,rapid,classical");
        url.searchParams.set("ratings", "1600,1800,2000,2200,2500");

        const res = await fetch(url.toString(), {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });

        lastResponse = res;

        if (res.ok) {
          const data = await res.json();
          if (!data?.moves || !Array.isArray(data.moves)) {
            cache.set(key, { result: empty, timestamp: Date.now() });
            return empty;
          }

          const openingName: string | undefined = data.opening?.name || undefined;
          const openingEco: string | undefined = data.opening?.eco || undefined;

          const moves: ExplorerMove[] = (data.moves as any[]).map((m) => {
            const w = Number(m.white) || 0;
            const d = Number(m.draws) || 0;
            const b = Number(m.black) || 0;
            return {
              uci: m.uci as string,
              san: m.san as string,
              white: w,
              draws: d,
              black: b,
              totalGames: w + d + b,
              winRate: computeWinRate(w, d, b, sideToMove),
              averageRating: Number(m.averageRating) || 0,
            };
          });

          const totalGames = moves.reduce((sum, m) => sum + m.totalGames, 0);

          /* ---------- Outlier detection ---------- */
          const qualifying = moves.filter((m) => m.totalGames >= MIN_GAMES);
          if (qualifying.length === 0) {
            const result = { moves, totalGames, topPick: null, openingName, openingEco };
            cache.set(key, { result, timestamp: Date.now() });
            return result;
          }

          const weightedSum = qualifying.reduce(
            (acc, m) => acc + m.winRate * m.totalGames,
            0,
          );
          const totalQualifyingGames = qualifying.reduce(
            (acc, m) => acc + m.totalGames,
            0,
          );
          const avgWinRate = weightedSum / totalQualifyingGames;

          const sorted = [...qualifying].sort((a, b) => b.winRate - a.winRate);
          const best = sorted[0];

          const isOutlier =
            best.winRate >= avgWinRate + OUTLIER_MARGIN &&
            best.winRate >= MIN_WIN_RATE;

          const result: ExplorerResult = {
            moves,
            totalGames,
            topPick: isOutlier ? best : null,
            openingName,
            openingEco,
          };
          cache.set(key, { result, timestamp: Date.now() });
          return result;
        }

        // Retryable status codes: 429, 5xx
        if (attempt < MAX_RETRIES && (res.status === 429 || res.status >= 500)) {
          const retryAfter = Number(res.headers.get("retry-after") ?? "0");
          const backoffMs = retryAfter > 0
            ? retryAfter * 1000
            : INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        // Non-retryable error
        return empty;
      } catch (err) {
        // Network error / timeout — retry
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, INITIAL_BACKOFF_MS * Math.pow(2, attempt)));
          continue;
        }
        return empty;
      }
    }

    return empty;
  } finally {
    dequeue();
  }
}
