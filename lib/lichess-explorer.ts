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
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch Lichess explorer data for a position and return an outlier top-pick
 * if one exists.
 *
 * @param fen        The position to look up.
 * @param sideToMove Which colour is to move (so we compute win-rate correctly).
 * @returns          An `ExplorerResult` (moves may be empty on error / 404).
 */
export async function fetchExplorerMoves(
  fen: string,
  sideToMove: "white" | "black",
): Promise<ExplorerResult> {
  const empty: ExplorerResult = { moves: [], totalGames: 0, topPick: null };

  try {
    const url = new URL(API_BASE);
    url.searchParams.set("variant", "standard");
    url.searchParams.set("fen", fen);
    url.searchParams.set("speeds", "bullet,blitz,rapid,classical");
    url.searchParams.set("ratings", "1600,1800,2000,2200,2500");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return empty;

    const data = await res.json();
    if (!data?.moves || !Array.isArray(data.moves)) return empty;

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
    if (qualifying.length === 0) return { moves, totalGames, topPick: null };

    // Weighted average win-rate across all qualifying moves
    const weightedSum = qualifying.reduce(
      (acc, m) => acc + m.winRate * m.totalGames,
      0,
    );
    const totalQualifyingGames = qualifying.reduce(
      (acc, m) => acc + m.totalGames,
      0,
    );
    const avgWinRate = weightedSum / totalQualifyingGames;

    // Best qualifying move
    const sorted = [...qualifying].sort((a, b) => b.winRate - a.winRate);
    const best = sorted[0];

    // It must exceed the average by the margin AND clear an absolute floor
    const isOutlier =
      best.winRate >= avgWinRate + OUTLIER_MARGIN &&
      best.winRate >= MIN_WIN_RATE;

    return {
      moves,
      totalGames,
      topPick: isOutlier ? best : null,
    };
  } catch {
    return empty;
  }
}
