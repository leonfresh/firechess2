import type { TimeMoment, PositionalFinding } from "@/lib/types";

export type TimePositionalInsight = {
  timeVerdict: "rushed" | "wasted";
  motifName: string;
  motifIcon: string;
  overlapCount: number;
  totalVerdictCount: number;
  avgSecondsOnMotif: number;
  avgCpLossOnMotif: number;
  exampleFens: string[];
  insight: string;
};

export type TimePositionalReport = {
  insights: TimePositionalInsight[];
  summary: string;
  totalOverlaps: number;
  unmatchedCount: number;
};

function tagToMotifName(tag: string): string | null {
  const m: Record<string, string> = {
    "Hanging Piece": "Hanging Pieces",
    "Unnecessary Capture": "Unnecessary Captures",
    "Premature Trade": "Premature Trades",
    "Released Tension": "Released Tension",
    "Passive Retreat": "Passive Retreats",
    "Trading Advantage": "Trading Advantage",
    "Greedy Pawn Grab": "Greedy Pawn Grabs",
    "Weakened Pawn Structure": "Weakened Pawn Structure",
    "Wrong Recapture": "Wrong Recaptures",
    "Missed Development": "Missed Development",
    "King Exposure": "King Exposure",
    "Piece Activity": "Piece Activity",
    "Premature Pawn Break": "Premature Pawn Breaks",
    "Inaccuracy": "General Inaccuracy",
    "Neglected Castling": "Neglected Castling",
    "Aimless Move": "Aimless Moves",
    "Overextended Pawn": "Overextended Pawns",
    "Center Neglect": "Center Neglect",
  };
  return m[tag] ?? null;
}

function motifIcon(name: string): string {
  const icons: Record<string, string> = {
    "Hanging Pieces": "💀",
    "Unnecessary Captures": "🚫",
    "Premature Trades": "🤝",
    "Released Tension": "💨",
    "Passive Retreats": "🐢",
    "Trading Advantage": "📉",
    "Greedy Pawn Grabs": "🍕",
    "Weakened Pawn Structure": "🏚️",
    "Wrong Recaptures": "↩️",
    "Missed Development": "🐌",
    "King Exposure": "👑",
    "Piece Activity": "📊",
    "Premature Pawn Breaks": "⚔️",
    "General Inaccuracy": "⚠️",
    "Neglected Castling": "🏰",
    "Aimless Moves": "🌀",
    "Overextended Pawns": "📏",
    "Center Neglect": "🎯",
  };
  return icons[name] ?? "📌";
}

function buildInsight(o: {
  timeVerdict: "rushed" | "wasted";
  motifName: string;
  overlapCount: number;
  totalVerdictCount: number;
  avgSecondsOnMotif: number;
  avgCpLossOnMotif: number;
}): string {
  const pct = ((o.overlapCount / o.totalVerdictCount) * 100).toFixed(0);
  const cp = (o.avgCpLossOnMotif / 100).toFixed(1);

  if (o.timeVerdict === "rushed") {
    if (o.motifName === "Hanging Pieces") {
      return `${o.overlapCount} of your ${o.totalVerdictCount} rushed moves left a piece hanging (${pct}%). Averaging just ${o.avgSecondsOnMotif.toFixed(1)}s per move, each cost ~${cp} pawns. Slow down enough to run a blunder check before committing.`;
    }
    if (o.motifName === "Unnecessary Captures") {
      return `${o.overlapCount} rushed capture decisions (${pct}% of rushed moves). Capturing fast feels aggressive, but these cost ~${cp} pawns each. Take 3 extra seconds to ask: "Does this capture actually improve my position?"`;
    }
    if (o.motifName === "Premature Trades") {
      return `${o.overlapCount} rushed piece trades (${pct}% of rushed moves). Trading without calculating the aftermath is a common speed habit — these cost ~${cp} pawns on average.`;
    }
    return `${o.overlapCount} of your ${o.totalVerdictCount} rushed moves involved "${o.motifName.toLowerCase()}" (${pct}%). Averaging ${o.avgSecondsOnMotif.toFixed(1)}s per move, these cost ~${cp} pawns each.`;
  }

  if (o.motifName === "Unnecessary Captures") {
    return `${o.overlapCount} moments spent ${o.avgSecondsOnMotif.toFixed(1)}s on simple captures (${pct}% of overthinking). These are pattern-recognition decisions — save the clock for positions that actually need calculation.`;
  }
  if (o.motifName === "Passive Retreats") {
    return `${o.overlapCount} retreat decisions took ${o.avgSecondsOnMotif.toFixed(1)}s on average (${pct}% of overthinking). When retreating, the priority is a safe square — not the perfect square.`;
  }
  if (o.motifName === "Aimless Moves") {
    return `${o.overlapCount} aimless moves still took ${o.avgSecondsOnMotif.toFixed(1)}s (${pct}% of overthinking). Before calculating, decide what you're trying to achieve.`;
  }
  return `${o.overlapCount} moments of overthinking on "${o.motifName.toLowerCase()}" (${pct}% of wasted time). Averaging ${o.avgSecondsOnMotif.toFixed(1)}s, these decisions should come faster with pattern recognition.`;
}

function buildTagMap(findings: PositionalFinding[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const f of findings) {
    if (!f.tags?.length) continue;
    const existing = map.get(f.fenBefore) ?? new Set();
    for (const tag of f.tags) existing.add(tag);
    map.set(f.fenBefore, existing);
  }
  return map;
}

export function crossReferenceTimeAndPositional(
  timeMoments: TimeMoment[],
  positionalFindings: PositionalFinding[],
): TimePositionalReport {
  if (timeMoments.length === 0 || positionalFindings.length === 0) {
    return {
      insights: [],
      summary: "Not enough data to cross-reference time and positional patterns yet. More games with clock data will unlock this section.",
      totalOverlaps: 0,
      unmatchedCount: timeMoments.length,
    };
  }

  const tagMap = buildTagMap(positionalFindings);

  type Overlap = {
    timeVerdict: "rushed" | "wasted";
    motifName: string;
    seconds: number[];
    cpLosses: number[];
    fens: string[];
  };

  const overlaps = new Map<string, Overlap>();
  let unmatched = 0;

  for (const moment of timeMoments) {
    const v = moment.verdict;
    if (v !== "rushed" && v !== "wasted") continue;

    const tags = tagMap.get(moment.fen);
    if (!tags || tags.size === 0) { unmatched++; continue; }

    tags.forEach((tag) => {
      const name = tagToMotifName(tag);
      if (!name) return;

      const key = `${v}:${name}`;
      const existing = overlaps.get(key);
      if (existing) {
        existing.seconds.push(moment.timeSpentSec);
        if (moment.cpLoss != null) existing.cpLosses.push(moment.cpLoss);
        if (existing.fens.length < 3) existing.fens.push(moment.fen);
      } else {
        overlaps.set(key, {
          timeVerdict: v,
          motifName: name,
          seconds: [moment.timeSpentSec],
          cpLosses: moment.cpLoss != null ? [moment.cpLoss] : [],
          fens: [moment.fen],
        });
      }
    });
  }

  const insights: TimePositionalInsight[] = [];
  overlaps.forEach((o) => {
    if (o.seconds.length < 1) return;
    const total = timeMoments.filter((m) => m.verdict === o.timeVerdict).length;
    const avgSec = o.seconds.reduce((a, b) => a + b, 0) / o.seconds.length;
    const avgCp = o.cpLosses.length > 0
      ? o.cpLosses.reduce((a, b) => a + b, 0) / o.cpLosses.length
      : 0;

    insights.push({
      timeVerdict: o.timeVerdict,
      motifName: o.motifName,
      motifIcon: motifIcon(o.motifName),
      overlapCount: o.seconds.length,
      totalVerdictCount: total,
      avgSecondsOnMotif: avgSec,
      avgCpLossOnMotif: avgCp,
      exampleFens: o.fens,
      insight: buildInsight({
        timeVerdict: o.timeVerdict,
        motifName: o.motifName,
        overlapCount: o.seconds.length,
        totalVerdictCount: total,
        avgSecondsOnMotif: avgSec,
        avgCpLossOnMotif: avgCp,
      }),
    });
  });

  insights.sort((a, b) => b.avgCpLossOnMotif - a.avgCpLossOnMotif);
  const totalOverlaps = insights.reduce((s, i) => s + i.overlapCount, 0);

  let summary = "";
  if (insights.length === 0) {
    summary = "No clear patterns emerged between your time management and positional habits. Your clock usage and positional mistakes are happening in different positions — which is actually a good sign.";
  } else if (insights.length === 1) {
    summary = `One clear pattern stood out: ${insights[0].insight.split(".")[0]}. Fix this one connection and both your clock and position quality should improve together.`;
  } else {
    const [a, b] = insights;
    summary = `${insights.length} patterns found where your clock habits and positional mistakes overlap. The top two: "${a.motifName}" paired with ${a.timeVerdict} moves, and "${b.motifName}" with ${b.timeVerdict} moves.`;
  }

  return { insights, summary, totalOverlaps, unmatchedCount: unmatched };
}
