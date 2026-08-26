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
  until: number | null;
  maxTactics: number | null;
  maxEndgames: number | null;
  /**
   * Raw PGN text for the "pgn" source (possibly multiple games). Stored in the
   * config jsonb column so PGN-based reports stay reloadable/shareable. Only
   * present when source === "pgn".
   */
  pgnText?: string;
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
  reportSummary?: string;
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
  // Winsorize avgCpLoss: the endgame sampler can emit implausible averages
  // (130-1800cp) that would floor the loss score; cap at 3 pawns.
  const lossScore = clampScore(
    100 * Math.exp(-Math.min(endgameStats.avgCpLoss, 300) / 100),
  );
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
  const leaks = result?.leaks ?? [];

  // Opening loss sample: full position traces on live scans; stored reports only
  // persist the flagged leak list (diagnostics aren't saved), so fall back to it.
  const lossPairs = traces?.length
    ? traces
        .filter((trace) => typeof trace.cpLoss === "number")
        .map((trace) => ({ loss: trace.cpLoss ?? 0, reach: trace.reachCount ?? 1 }))
    : leaks.map((leak) => ({ loss: leak.cpLoss ?? 0, reach: leak.reachCount ?? 1 }));

  if (lossPairs.length === 0) return null;

  const lossValues = lossPairs.map((pair) => pair.loss);
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

  const totalWeight = lossPairs.reduce((sum, pair) => sum + pair.reach, 0);
  const weightedCpLoss =
    totalWeight > 0
      ? lossPairs.reduce((sum, pair) => sum + pair.loss * pair.reach, 0) /
        totalWeight
      : 0;
  const severeLeakRate =
    lossValues.filter((loss) => loss >= cpThreshold).length / lossValues.length;

  // Accuracy: anchor to a rating-appropriate curve, then nudge by how the
  // opening leak sample compares to what that rating should produce.
  // A pure leak-loss curve (K=1000) cannot separate skill levels — the
  // flagged-leak samples cluster at 60-125cp for everyone, which left
  // 850-rated players at ~90% and the demo reports looking broken.
  // Anchor ≈ 55-97.5% across 400-3400 rating; the leak adjustment moves the
  // value within ±6 points, so an unusually leaky sample still reads lower.
  const actualRating = result?.playerRating;
  const anchorAccuracy =
    actualRating && actualRating > 0
      ? Math.min(97.5, Math.max(30, 55 + (actualRating - 400) * 0.014))
      : Math.min(99.5, Math.max(25, 100 * Math.exp(-weightedCpLoss / 1000)));
  const expectedLoss =
    actualRating && actualRating > 0
      ? Math.max(2, 50 - actualRating / 60)
      : null;
  let estimatedAccuracy = anchorAccuracy;
  if (expectedLoss !== null) {
    const diff = expectedLoss - weightedCpLoss;
    const adjustment = Math.max(-6, Math.min(6, diff * 0.25));
    estimatedAccuracy = anchorAccuracy + adjustment;
  }
  estimatedAccuracy = Math.min(99.5, Math.max(25, estimatedAccuracy));

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
    const sampleFactor = Math.min(1, lossPairs.length / 50);
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
    Math.min(99, Math.round((lossPairs.length / 40) * 100)),
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

  // Determine dominant weakness (used for both title and summary)
  const openingCount = result?.leaks?.length ?? 0;
  const tacticsCount = result?.missedTactics?.length ?? 0;
  const endgameCount = result?.endgameMistakes?.length ?? 0;
  const timeCount = result?.timeManagement?.moments?.length ?? 0;

  type WeaknessType = "tactics" | "endgame" | "opening" | "time" | "balanced";
  const dominant: WeaknessType = (() => {
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

  // ── Title system ─────────────────────────────────────────────────────────
  // 6 ELO tiers, feel-good framing that celebrates player level while
  // naming the single growth area. Each title validates where the player IS,
  // not just what they're missing.
  //   tier 0: < 800   | tier 1: 800-1199 | tier 2: 1200-1599
  //   tier 3: 1600-1999 | tier 4: 2000-2299 | tier 5: 2300+
  const ratingTier =
    estimatedRating >= 2300
      ? 5
      : estimatedRating >= 2000
        ? 4
        : estimatedRating >= 1600
          ? 3
          : estimatedRating >= 1200
            ? 2
            : estimatedRating >= 800
              ? 1
              : 0;

  const VIBE_TITLES: Record<
    WeaknessType,
    [string, string, string, string, string, string]
  > = {
    tactics: [
      "Sharp Instincts Finding Their Edge",
      "Pattern Hunter on the Rise",
      "Calculation Getting Dangerous",
      "Precise and Near-Master Sharp",
      "Expert Attacker, One Sharp Edge Remains",
      "World-Class Sharpness, Final Calculation Thread",
    ],
    endgame: [
      "Fighting Spirit, Conversion Learning",
      "Resilient Defender, Technique Building",
      "Strong Fighter, Endgame Mastery Unlocking",
      "Advanced Technician, Converting Under Pressure",
      "Expert Strategist, Endgame Refinement Ahead",
      "Near-Flawless — Endgame Precision Is the Last Step",
    ],
    opening: [
      "Fearless Explorer, Repertoire Building",
      "Bold Player, Opening Map Expanding",
      "Solid Thinker, Opening System Developing",
      "Sharp Repertoire, Preparation Deepening",
      "Expert Theorist, Deep Prep Forming",
      "World-Class Opening Sense, Final Lines Loading",
    ],
    time: [
      "Fearless Under Pressure, Clock Taming Next",
      "Tenacious Fighter, Time Sense Evolving",
      "Determined Player, Clock Management Developing",
      "Skilled Competitor, Time Mastery Ahead",
      "Expert Vision, Clock Precision the Next Edge",
      "Elite Mind, Clock Mastery the Final Frontier",
    ],
    balanced: [
      "Fearless Beginner, Every Game Builds the Foundation",
      "Rising Player, Solid Instincts Across the Board",
      "Well-Rounded Competitor, Edges Quietly Closing",
      "Advanced All-Rounder, Closing the Final Gap",
      "Expert Competitor, Elite Within Reach",
      "World-Class All-Rounder, Perfecting the Peak",
    ],
  };

  const vibeTitle = VIBE_TITLES[dominant][ratingTier];

  // ── Human-like report summary ─────────────────────────────────────────────
  const username = result?.username ?? "This player";

  const ratingLabel =
    estimatedRating >= 2300
      ? "GM-level"
      : estimatedRating >= 2000
        ? "expert-level"
        : estimatedRating >= 1600
          ? "advanced club-level"
          : estimatedRating >= 1200
            ? "intermediate"
            : estimatedRating >= 800
              ? "developing"
              : "beginner";

  const accuracyLabel =
    estimatedAccuracy >= 92
      ? "exceptional"
      : estimatedAccuracy >= 88
        ? "strong"
        : estimatedAccuracy >= 83
          ? "solid"
          : estimatedAccuracy >= 78
            ? "moderate"
            : "developing";

  const consistencyLabel =
    consistencyScore >= 85
      ? "remarkably consistent"
      : consistencyScore >= 70
        ? "fairly consistent"
        : consistencyScore >= 55
          ? "somewhat inconsistent"
          : "prone to high-variance swings";

  const strengthLines: string[] = [];
  const weaknessLines: string[] = [];

  // Strengths
  const openingLeakRatio =
    openingCount > 0 && (result?.repeatedPositions ?? 0) > 0
      ? openingCount / result!.repeatedPositions
      : null;
  if (openingLeakRatio !== null && openingLeakRatio < 0.08) {
    strengthLines.push("opening preparation is a genuine asset");
  }
  if (tacticsCount <= 2) {
    strengthLines.push("tactical awareness is a clear strength");
  }
  if (endgameCount <= 2) {
    strengthLines.push("endgame technique is reliable");
  }
  if (severeLeakRate < 0.1) {
    strengthLines.push("composure under pressure stands out");
  }

  // Weaknesses
  if (dominant === "tactics" && tacticsCount > 3) {
    weaknessLines.push(
      `missed ${tacticsCount} tactical shots — pattern recognition work will unlock the most rating points`,
    );
  }
  if (dominant === "endgame" && endgameCount > 3) {
    weaknessLines.push(
      `${endgameCount} endgame errors suggest conversion and technique is the area to focus on`,
    );
  }
  if (dominant === "opening" && openingCount > 3) {
    weaknessLines.push(
      `${openingCount} recurring opening leaks signal that a tighter repertoire will add immediate stability`,
    );
  }
  if (dominant === "time" && timeCount > 3) {
    weaknessLines.push(
      "time management under pressure is the clearest leak — slower moves in complex positions will improve results",
    );
  }
  if (dominant === "balanced") {
    weaknessLines.push(
      "no single area dominates, which means incremental gains across all pillars will compound quickly",
    );
  }

  const strengthsText =
    strengthLines.length > 0
      ? `Standout strengths include ${strengthLines.slice(0, 2).join(" and ")}.`
      : "";

  const weaknessText =
    weaknessLines.length > 0
      ? `The key growth area: ${weaknessLines[0]}.`
      : "";

  const consistencyText = `Move quality is ${consistencyLabel} (consistency score ${consistencyScore}/100), with a ${(severeLeakRate * 100).toFixed(0)}% rate of high-cost errors.`;

  const outlookText =
    estimatedRating >= 2300
      ? "The profile reflects a world-class game — refinements at this level are subtle and deeply specific."
      : estimatedRating >= 2000
        ? "The fundamentals are expert-grade. Addressing the flagged area could push this profile into master territory."
        : estimatedRating >= 1600
          ? "This is a well-developed game. Targeted work on the weak pillar will have an outsized effect at this level."
          : estimatedRating >= 1200
            ? "The foundation is solid. Locking in the key weakness will accelerate improvement significantly."
            : "Every game is adding to the pattern library. Consistent practice on the flagged area will fast-track growth.";

  const reportSummary = [
    `${username} shows ${accuracyLabel} ${ratingLabel} play with ${estimatedAccuracy.toFixed(1)}% move accuracy across ${lossPairs.length} scored positions.`,
    strengthsText,
    weaknessText,
    consistencyText,
    outlookText,
  ]
    .filter(Boolean)
    .join(" ");
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
    sampleSize: lossPairs.length,
    vibeTitle,
    reportSummary,
    endgameTechniqueScore,
  };
}
