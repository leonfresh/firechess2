import type {
  AnalysisSource,
  ScanMode,
  TimeControl,
} from "@/lib/client-analysis";
import type { AnalyzeResponse, EndgameStats } from "@/lib/types";

export type ScanSessionStatus = "processing" | "ready" | "failed";

export type ScanSessionConfig = {
  maxGames: number;
  maxMoves: number;
  cpThreshold: number;
  engineDepth: number;
  source: AnalysisSource;
  scanMode: ScanMode;
  speed: TimeControl[];
  since: number | null;
  maxTactics: number | null;
  maxEndgames: number | null;
};

export type ComputedScanReport = {
  estimatedAccuracy: number;
  estimatedRating: number;
  weightedCpLoss: number;
  severeLeakRate: number;
  p75CpLoss: number;
  consistencyScore: number;
  confidence: number;
  topTag: string;
  sampleSize: number;
  vibeTitle: string;
  endgameTechniqueScore?: number | null;
};

export type PublicScanSessionPayload = {
  id: string;
  userId: string | null;
  chessUsername: string;
  source: AnalysisSource;
  scanMode: ScanMode;
  status: ScanSessionStatus;
  config: ScanSessionConfig;
  result: AnalyzeResponse | null;
  reportMeta: ComputedScanReport | null;
  error: string | null;
  savedReportId: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export const GUEST_SCAN_TTL_MS = 24 * 60 * 60 * 1000;
export const SCAN_OWNER_STORAGE_KEY_PREFIX = "firechess-scan-owner";
export const SCAN_EXPIRY_POPUP_DISMISS_PREFIX = "firechess-scan-popup";

export function getGuestScanExpiryDate(from = new Date()) {
  return new Date(from.getTime() + GUEST_SCAN_TTL_MS);
}

export function scanOwnerStorageKey(scanId: string) {
  return `${SCAN_OWNER_STORAGE_KEY_PREFIX}:${scanId}`;
}

export function scanExpiryDismissKey(scanId: string) {
  return `${SCAN_EXPIRY_POPUP_DISMISS_PREFIX}:${scanId}`;
}

export function isExpiredScanSession(session: {
  expiresAt: Date | string | null;
  savedReportId?: string | null;
}) {
  if (!session.expiresAt || session.savedReportId) return false;

  const expiresAt =
    session.expiresAt instanceof Date
      ? session.expiresAt
      : new Date(session.expiresAt);

  return (
    Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()
  );
}

export function buildReportContentHash(
  result: AnalyzeResponse,
  source: AnalysisSource,
  scanMode: ScanMode,
) {
  return JSON.stringify({
    u: result.username,
    s: source,
    m: scanMode,
    g: result.gamesAnalyzed,
    leakKeys: result.leaks
      .map((leak) => `${leak.fenBefore}:${leak.userMove}`)
      .sort(),
    tacticKeys: result.missedTactics
      .map(
        (tactic) =>
          `${tactic.fenBefore}:${tactic.userMove}:${tactic.gameIndex}`,
      )
      .sort(),
  });
}

export function computeEndgameTechniqueScore(
  endgameStats: EndgameStats | null,
) {
  if (!endgameStats || endgameStats.totalPositions <= 0) return null;

  const clampScore = (value: number) => Math.max(0, Math.min(100, value));
  const lossScore = clampScore(100 * Math.exp(-endgameStats.avgCpLoss / 100));
  const weightedParts = [{ value: lossScore, weight: 0.6 }];

  if (typeof endgameStats.conversionRate === "number") {
    weightedParts.push({ value: endgameStats.conversionRate, weight: 0.25 });
  }

  if (typeof endgameStats.holdRate === "number") {
    weightedParts.push({ value: endgameStats.holdRate, weight: 0.15 });
  }

  const totalWeight = weightedParts.reduce((sum, part) => sum + part.weight, 0);
  const rawScore =
    totalWeight > 0
      ? weightedParts.reduce((sum, part) => sum + part.value * part.weight, 0) /
        totalWeight
      : 50;
  const sampleWeight = Math.min(1, endgameStats.totalPositions / 12);

  return Math.round(clampScore(50 + (rawScore - 50) * sampleWeight));
}

export function computeScanReportMeta(
  result: AnalyzeResponse | null,
  cpThreshold: number,
): ComputedScanReport | null {
  const traces = result?.diagnostics?.positionTraces;
  if (!traces?.length) return null;

  const valid = traces.filter((trace) => typeof trace.cpLoss === "number");
  if (valid.length === 0) return null;

  const lossValues = valid.map((trace) => trace.cpLoss ?? 0);
  const sortedLosses = [...lossValues].sort((left, right) => left - right);
  const percentileIndex = Math.floor(sortedLosses.length * 0.75);
  const p75CpLoss =
    sortedLosses[Math.min(sortedLosses.length - 1, percentileIndex)] ?? 0;
  const meanCpLoss =
    lossValues.reduce((sum, value) => sum + value, 0) / lossValues.length;
  const variance =
    lossValues.reduce(
      (sum, value) => sum + Math.pow(value - meanCpLoss, 2),
      0,
    ) / Math.max(1, lossValues.length);
  const stdDevCpLoss = Math.sqrt(variance);

  const weightedLossNumerator = valid.reduce(
    (sum, trace) => sum + (trace.cpLoss ?? 0) * trace.reachCount,
    0,
  );
  const totalWeight = valid.reduce((sum, trace) => sum + trace.reachCount, 0);
  const weightedCpLoss =
    totalWeight > 0 ? weightedLossNumerator / totalWeight : 0;
  const severeLeakRate =
    valid.filter((trace) => (trace.cpLoss ?? 0) >= cpThreshold).length /
    valid.length;

  // Blend opening cp loss with endgame avg cp loss for a more holistic accuracy %.
  // Opening leaks are frequency-weighted; endgame avgCpLoss is a simple average.
  // When both are available, weight them 55/45 to reflect the full-game picture.
  const endgameAvgCpLoss =
    typeof result?.endgameStats?.avgCpLoss === "number" &&
    result.endgameStats.avgCpLoss > 0
      ? result.endgameStats.avgCpLoss
      : null;
  const blendedCpLoss =
    endgameAvgCpLoss !== null
      ? weightedCpLoss * 0.55 + endgameAvgCpLoss * 0.45
      : weightedCpLoss;

  const estimatedAccuracy = Math.min(
    99.5,
    Math.max(25, 100 * Math.exp(-blendedCpLoss / 120)),
  );

  const actualRating = result?.playerRating;
  let estimatedRating: number;

  if (actualRating && actualRating > 0) {
    const clampedLoss = Math.max(1, weightedCpLoss);
    const expectedLoss = Math.max(2, 50 - actualRating / 60);
    const diff = expectedLoss - clampedLoss;
    const adjustment = Math.max(-200, Math.min(200, diff * 8));
    const leakAdjustment = severeLeakRate * -150;

    estimatedRating = Math.round(
      Math.min(2800, Math.max(400, actualRating + adjustment + leakAdjustment)),
    );
  } else {
    const clampedLoss = Math.max(2, weightedCpLoss);
    const baseRating = 1800 - 400 * Math.log10(clampedLoss);
    const leakPenalty = severeLeakRate * 400;
    const sampleFactor = Math.min(1, valid.length / 50);
    const rawRating = baseRating - leakPenalty;
    const adjustedRating = 1200 + (rawRating - 1200) * sampleFactor;

    estimatedRating = Math.round(Math.min(2400, Math.max(400, adjustedRating)));
  }

  const consistencyScore = Math.max(
    1,
    Math.min(100, Math.round(100 - stdDevCpLoss / 4)),
  );
  const confidence = Math.max(
    10,
    Math.min(99, Math.round((valid.length / 40) * 100)),
  );

  const topTag = (() => {
    if (!result?.leaks?.length) return "No big leak pattern";

    const counts = new Map<string, number>();
    for (const leak of result.leaks) {
      for (const tag of leak.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    if (counts.size === 0) return "No big leak pattern";

    let best = "No big leak pattern";
    let bestCount = 0;
    for (const [tag, count] of counts.entries()) {
      if (count > bestCount) {
        best = tag;
        bestCount = count;
      }
    }

    return best;
  })();

  // Pick a title that reflects the dominant weakness across all report sections,
  // not just openings, crossed with a rough skill tier.
  const openingCount = result?.leaks?.length ?? 0;
  const tacticsCount = result?.missedTactics?.length ?? 0;
  const endgameCount = result?.endgameMistakes?.length ?? 0;
  const timeCount = result?.timeManagement?.moments?.length ?? 0;

  type WeaknessType = "tactics" | "endgame" | "opening" | "time" | "balanced";
  const dominant: WeaknessType = (() => {
    // Weight tactics and endgame higher — they're more signal-dense than opening leaks
    const scores = {
      tactics: tacticsCount * 1.5,
      endgame: endgameCount * 1.2,
      time: timeCount,
      opening: openingCount,
    };
    const max = Math.max(...Object.values(scores));
    if (max === 0) return "balanced";
    if (scores.tactics === max) return "tactics";
    if (scores.endgame === max) return "endgame";
    if (scores.time === max) return "time";
    if (scores.opening === max) return "opening";
    return "balanced";
  })();

  // tier 0 = <1200, 1 = 1200-1599, 2 = 1600-1999, 3 = 2000+
  const ratingTier =
    estimatedRating >= 2000
      ? 3
      : estimatedRating >= 1600
        ? 2
        : estimatedRating >= 1200
          ? 1
          : 0;

  const VIBE_TITLES: Record<WeaknessType, [string, string, string, string]> = {
    tactics: [
      "⚔️ Pattern Recognition Arc",
      "⚔️ Sharpness Loading...",
      "⚔️ Tactics Holding the Rating Back",
      "⚔️ Your Tactics Are the Ceiling",
    ],
    endgame: [
      "♟ Converting Is Hard",
      "♟ Winning Then Losing",
      "♟ The Last 20 Moves Hurt",
      "♟ Winning Then Stumbling",
    ],
    opening: [
      "📚 Opening Habits In Progress",
      "📚 Building Your Opening Map",
      "📚 Opening Drift Costing Points",
      "📚 Prep Gap Showing",
    ],
    time: [
      "⏱ The Clock Is the Enemy",
      "⏱ Playing Too Fast",
      "⏱ Time Pressure Is Leaking",
      "⏱ Clock Costs You Games",
    ],
    balanced: [
      "🧠 Every Game Is a Lesson",
      "🌱 Improvement Arc Active",
      "⚡ Solid — Small Leaks Everywhere",
      "🔥 Near the Top, Still Leaking",
    ],
  };

  const vibeTitle = VIBE_TITLES[dominant][ratingTier];
  const endgameTechniqueScore = computeEndgameTechniqueScore(
    result?.endgameStats ?? null,
  );

  return {
    estimatedAccuracy,
    estimatedRating,
    weightedCpLoss,
    severeLeakRate,
    p75CpLoss,
    consistencyScore,
    confidence,
    topTag,
    sampleSize: valid.length,
    vibeTitle,
    endgameTechniqueScore,
  };
}
