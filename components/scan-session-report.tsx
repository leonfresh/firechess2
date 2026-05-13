"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CardCarousel } from "@/components/card-carousel";
import { EndgameCard } from "@/components/endgame-card";
import { MistakeCard } from "@/components/mistake-card";
import {
  MentalGameLoading,
  ScanMentalGame,
} from "@/components/scan-mental-game";
import { OpeningRankings } from "@/components/opening-rankings";
import { PersonalizedPuzzles } from "@/components/personalized-puzzles";
import { ScanPositionalMotifs } from "@/components/scan-positional-motifs";
import {
  InsightCards,
  RadarLegend,
  StrengthsRadar,
  computeRadarData,
} from "@/components/radar-chart";
import { TacticCard } from "@/components/tactic-card";
import { TimeCard } from "@/components/time-card";
import type { AnalysisProgress } from "@/lib/client-analysis";
import type {
  ComputedScanReport,
  PublicScanSessionPayload,
} from "@/lib/scan-session";
import type {
  MissedTactic,
  PositionalFinding,
  RepeatedOpeningLeak,
} from "@/lib/types";

const POSITIONAL_MOTIF_NAMES = new Set([
  "Unnecessary Captures",
  "Premature Trades",
  "Released Tension",
  "Passive Retreats",
  "Trading Advantage",
  "Greedy Pawn Grabs",
  "Weakened Pawn Structure",
  "Wrong Recaptures",
  "Missed Development",
  "King Exposure",
  "Piece Activity",
  "Premature Pawn Breaks",
  "General Inaccuracy",
  "Neglected Castling",
  "Aimless Moves",
  "Overextended Pawns",
  "Center Neglect",
  "Hanging Pieces",
]);

const STILL_WINNING_THRESHOLD = 350;
const FREE_SCAN_SECTION_SAMPLE = 9;
const COMPACT_REPORT_INITIAL_COUNT = 3;
const COMPACT_REPORT_SECOND_STEP = 9;

type TaggedPosition = {
  tags: string[];
  cpLoss: number;
  fenBefore: string;
  userMove?: string;
  bestMove?: string | null;
  evalAfterUser?: number;
  gameUrl?: string;
};

type DerivedMotif = {
  name: string;
  icon: string;
  count: number;
  avgCpLoss: number;
  examples: Array<{
    fenBefore: string;
    userMove?: string;
    bestMove?: string | null;
    cpLoss: number;
    gameUrl?: string;
  }>;
};

type MotifDefinition = {
  name: string;
  icon: string;
  positional?: boolean;
  match: (position: TaggedPosition) => boolean;
};

function nextCompactRevealTarget(current: number, total: number) {
  if (current < COMPACT_REPORT_SECOND_STEP) {
    return Math.min(total, COMPACT_REPORT_SECOND_STEP);
  }

  return total;
}

function useCompactSectionReveal(total: number, resetKey: string) {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(total, COMPACT_REPORT_INITIAL_COUNT),
  );

  useEffect(() => {
    setVisibleCount(Math.min(total, COMPACT_REPORT_INITIAL_COUNT));
  }, [resetKey]);

  useEffect(() => {
    setVisibleCount((current) => {
      if (total <= 0) return 0;
      if (current < COMPACT_REPORT_INITIAL_COUNT) {
        return Math.min(total, COMPACT_REPORT_INITIAL_COUNT);
      }

      return Math.min(current, total);
    });
  }, [total]);

  const shownCount = Math.min(visibleCount, total);
  const hiddenCount = Math.max(0, total - shownCount);

  return {
    shownCount,
    hiddenCount,
    loadMore: () =>
      setVisibleCount((current) => nextCompactRevealTarget(current, total)),
    showLess: () =>
      setVisibleCount(Math.min(total, COMPACT_REPORT_INITIAL_COUNT)),
  };
}

function CompactCardFooter({
  shown,
  total,
  label,
  onLoadMore,
  onShowLess,
}: {
  shown: number;
  total: number;
  label: string;
  onLoadMore: () => void;
  onShowLess: () => void;
}) {
  if (total <= COMPACT_REPORT_INITIAL_COUNT) return null;

  const remaining = Math.max(0, total - shown);
  const nextTarget = nextCompactRevealTarget(shown, total);
  const nextIncrement = Math.max(0, nextTarget - shown);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-400">
        {shown < total
          ? `Showing ${shown} of ${total} ${label}.`
          : `Showing all ${total} ${label}.`}
      </p>
      <div className="flex flex-wrap gap-2">
        {remaining > 0 ? (
          <button
            type="button"
            onClick={onLoadMore}
            className="inline-flex items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
          >
            {shown >= COMPACT_REPORT_SECOND_STEP
              ? `Load remaining ${remaining}`
              : `Load ${nextIncrement} more`}
          </button>
        ) : null}
        {shown > COMPACT_REPORT_INITIAL_COUNT ? (
          <button
            type="button"
            onClick={onShowLess}
            className="inline-flex items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
          >
            Show fewer
          </button>
        ) : null}
      </div>
    </div>
  );
}

function formatCompactBadge({
  shown,
  available,
  total,
  singular,
  plural,
}: {
  shown: number;
  available: number;
  total: number;
  singular: string;
  plural: string;
}) {
  if (shown < available) return `${shown} shown / ${available} available`;
  if (total > available) return `${available} available / ${total} found`;
  return `${available} ${available === 1 ? singular : plural}`;
}

const MOTIF_DEFS: MotifDefinition[] = [
  {
    name: "Hanging Pieces",
    icon: "💀",
    positional: true,
    match: (position) => position.tags.includes("Hanging Piece"),
  },
  {
    name: "Missed Mate",
    icon: "👑",
    match: (position) =>
      position.tags.some(
        (tag) => tag === "Missed Mate" || tag === "Winning Blunder",
      ) && position.cpLoss >= 99000,
  },
  {
    name: "Missed Check",
    icon: "⚡",
    match: (position) => position.tags.includes("Missed Check"),
  },
  {
    name: "Missed Capture",
    icon: "🗡️",
    match: (position) =>
      position.tags.includes("Missed Capture") ||
      position.tags.includes("Forcing Capture"),
  },
  {
    name: "Back Rank Threats",
    icon: "🏰",
    match: (position) => position.tags.includes("Back Rank"),
  },
  {
    name: "Knight Tactics",
    icon: "♞",
    match: (position) => position.tags.includes("Knight Fork?"),
  },
  {
    name: "Queen Tactics",
    icon: "♛",
    match: (position) => position.tags.includes("Queen Tactic"),
  },
  {
    name: "Converting Advantage",
    icon: "📈",
    match: (position) => position.tags.includes("Converting Advantage"),
  },
  {
    name: "Equal Position Misses",
    icon: "⚖️",
    match: (position) => position.tags.includes("Equal Position"),
  },
  {
    name: "Unnecessary Captures",
    icon: "🚫",
    positional: true,
    match: (position) => position.tags.includes("Unnecessary Capture"),
  },
  {
    name: "Premature Trades",
    icon: "🤝",
    positional: true,
    match: (position) => position.tags.includes("Premature Trade"),
  },
  {
    name: "Released Tension",
    icon: "💨",
    positional: true,
    match: (position) => position.tags.includes("Released Tension"),
  },
  {
    name: "Passive Retreats",
    icon: "🐢",
    positional: true,
    match: (position) => position.tags.includes("Passive Retreat"),
  },
  {
    name: "Trading Advantage",
    icon: "📉",
    positional: true,
    match: (position) => position.tags.includes("Trading Advantage"),
  },
  {
    name: "Greedy Pawn Grabs",
    icon: "🍕",
    positional: true,
    match: (position) => position.tags.includes("Greedy Pawn Grab"),
  },
  {
    name: "Weakened Pawn Structure",
    icon: "🏚️",
    positional: true,
    match: (position) => position.tags.includes("Weakened Pawn Structure"),
  },
  {
    name: "Wrong Recaptures",
    icon: "↩️",
    positional: true,
    match: (position) => position.tags.includes("Wrong Recapture"),
  },
  {
    name: "Missed Development",
    icon: "🐌",
    positional: true,
    match: (position) => position.tags.includes("Missed Development"),
  },
  {
    name: "King Exposure",
    icon: "👑",
    positional: true,
    match: (position) => position.tags.includes("King Exposure"),
  },
  {
    name: "Piece Activity",
    icon: "📊",
    positional: true,
    match: (position) => position.tags.includes("Piece Activity"),
  },
  {
    name: "Premature Pawn Breaks",
    icon: "⚔️",
    positional: true,
    match: (position) => position.tags.includes("Premature Pawn Break"),
  },
  {
    name: "General Inaccuracy",
    icon: "⚠️",
    positional: true,
    match: (position) => position.tags.includes("Inaccuracy"),
  },
  {
    name: "Neglected Castling",
    icon: "🏰",
    positional: true,
    match: (position) => position.tags.includes("Neglected Castling"),
  },
  {
    name: "Aimless Moves",
    icon: "🌀",
    positional: true,
    match: (position) => position.tags.includes("Aimless Move"),
  },
  {
    name: "Overextended Pawns",
    icon: "📏",
    positional: true,
    match: (position) => position.tags.includes("Overextended Pawn"),
  },
  {
    name: "Center Neglect",
    icon: "🎯",
    positional: true,
    match: (position) => position.tags.includes("Center Neglect"),
  },
];

function AnalysisSectionSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4 animate-pulse py-2">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <div className="flex gap-4">
            <div className="h-16 w-16 shrink-0 rounded-xl bg-white/[0.08]" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-3/4 rounded bg-white/[0.08]" />
              <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
              <div className="h-3 w-2/3 rounded bg-white/[0.06]" />
            </div>
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-slate-500">{label}</p>
    </div>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 text-sm text-slate-400 sm:p-6">
      {message}
    </div>
  );
}

function ProSectionLimitNotice({
  label,
  shown,
  total,
}: {
  label: string;
  shown: number;
  total: number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/[0.08] p-5 text-sm text-amber-100 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-amber-200">
            Free shows the top {shown} {label}.
          </p>
          <p className="mt-1 text-amber-100/80">
            {total - shown} more {label} unlock with Pro.
          </p>
        </div>
        <a
          href="/pricing"
          className="inline-flex items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/20"
        >
          Unlock Full List
        </a>
      </div>
    </div>
  );
}

function SectionLoadingProgress({
  message,
  detail,
  current,
  total,
  percent,
  countLabel,
}: {
  message: string;
  detail?: string;
  current?: number;
  total?: number;
  percent: number;
  countLabel?: string;
}) {
  const hasCount = typeof total === "number" && total > 0;
  const safeCurrent = Math.max(0, current ?? 0);
  const safeTotal = hasCount ? Math.max(safeCurrent, total) : undefined;
  const progressPercent =
    hasCount && safeTotal ? (safeCurrent / safeTotal) * 100 : percent;

  return (
    <div className="rounded-[1.5rem] border border-cyan-500/20 bg-cyan-500/[0.06] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{message}</p>
          <p className="mt-1 text-sm text-slate-300">{detail}</p>
        </div>
        <p className="text-lg font-black text-cyan-200">
          {hasCount && safeTotal
            ? `${safeCurrent}/${safeTotal}${countLabel ? ` ${countLabel}` : ""}`
            : `${Math.round(percent)}%`}
        </p>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-[width] duration-300"
          style={{ width: `${Math.max(6, progressPercent)}%` }}
        />
      </div>
    </div>
  );
}

function RadarLoadingState({
  progress,
  isProcessing,
}: {
  progress?: AnalysisProgress | null;
  isProcessing: boolean;
}) {
  const progressPercent = Math.max(8, Math.min(96, progress?.percent ?? 0));
  const hasCount = typeof progress?.total === "number" && progress.total > 0;
  const progressLabel = isProcessing
    ? hasCount
      ? `${Math.max(0, progress?.current ?? 0)}/${progress?.total}`
      : `${Math.round(progressPercent)}%`
    : "Pending";

  const heading = isProcessing
    ? (progress?.message ?? "Building the strength map")
    : "Strength map pending";

  const detail = isProcessing
    ? progress?.phase === "eval"
      ? (progress.detail ??
        "Scoring recurring positions so the strength map can lock onto a stable profile.")
      : progress?.phase === "tactics" ||
          progress?.phase === "endgames" ||
          progress?.phase === "time"
        ? "The chart appears once enough scored positions are locked in for a stable profile."
        : (progress?.detail ??
          "Building your strengths map from the live scan.")
    : "This scan needs more scored positions before the radar chart can lock onto a stable profile.";

  return (
    <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-white">
            Strengths and weaknesses
          </h2>
          <p className="mt-2 text-sm font-semibold text-white">{heading}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            {detail}
          </p>
        </div>
        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-200">
          {progressLabel}
        </span>
      </div>

      {isProcessing ? (
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
          Scores appear once enough positions are evaluated.
        </div>
      )}

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="mx-auto flex aspect-square w-full max-w-[22rem] items-center justify-center rounded-full border border-white/[0.08] bg-[radial-gradient(circle,_rgba(34,211,238,0.08),_rgba(15,23,42,0.18)_52%,_rgba(2,6,23,0.08)_100%)]">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="grid h-24 w-24 place-items-center rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                Radar
              </div>
              <p className="max-w-[15rem] text-xs leading-relaxed text-slate-500">
                The chart appears as soon as enough positions are scored to make
                the profile stable.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {["Accuracy", "Opening Prep", "Tactical Eye", "Composure"].map(
            (label) => (
              <div
                key={label}
                className="rounded-[1.25rem] border border-white/[0.08] bg-white/[0.02] p-4 animate-pulse"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {label}
                </p>
                <div className="mt-3 h-3 w-3/4 rounded-full bg-white/[0.08]" />
                <div className="mt-2 h-2.5 w-1/2 rounded-full bg-white/[0.06]" />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  badge,
  live,
}: {
  eyebrow: string;
  title: string;
  description: string;
  badge?: ReactNode;
  live?: boolean;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {badge ? (
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-slate-300">
              {badge}
            </span>
          ) : null}
          {live ? (
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-200">
              Live update
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "slate" | "emerald" | "cyan" | "amber" | "sky" | "fuchsia";
}) {
  const toneClasses = {
    slate: "border-white/[0.08] bg-white/[0.03] text-white",
    emerald: "border-emerald-500/20 bg-emerald-500/[0.08] text-white",
    cyan: "border-cyan-500/20 bg-cyan-500/[0.08] text-white",
    amber: "border-amber-500/20 bg-amber-500/[0.08] text-white",
    sky: "border-sky-500/20 bg-sky-500/[0.08] text-white",
    fuchsia: "border-fuchsia-500/20 bg-fuchsia-500/[0.08] text-white",
  }[tone];

  return (
    <div className={`rounded-[1.25rem] border p-4 ${toneClasses}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function formatPawnLoss(cpLoss: number) {
  return `${(cpLoss / 100).toFixed(2)} pawns`;
}

function buildMotifs(
  missedTactics: MissedTactic[],
  leaks: RepeatedOpeningLeak[],
  oneOffMistakes: RepeatedOpeningLeak[],
  positionalFindings: PositionalFinding[],
) {
  const allPositions: TaggedPosition[] = [];

  for (const tactic of missedTactics) {
    allPositions.push({
      tags: tactic.tags,
      cpLoss: tactic.cpLoss,
      fenBefore: tactic.fenBefore,
      userMove: tactic.userMove,
      bestMove: tactic.bestMove,
      evalAfterUser: -tactic.cpAfter,
    });
  }

  for (const leak of leaks) {
    if (!leak.tags?.length) continue;
    allPositions.push({
      tags: leak.tags,
      cpLoss: leak.cpLoss,
      fenBefore: leak.fenBefore,
      userMove: leak.userMove,
      bestMove: leak.bestMove,
      evalAfterUser:
        typeof leak.evalAfter === "number" ? -leak.evalAfter : undefined,
    });
  }

  for (const mistake of oneOffMistakes) {
    if (!mistake.tags?.length) continue;
    allPositions.push({
      tags: mistake.tags,
      cpLoss: mistake.cpLoss,
      fenBefore: mistake.fenBefore,
      userMove: mistake.userMove,
      bestMove: mistake.bestMove,
      evalAfterUser:
        typeof mistake.evalAfter === "number" ? -mistake.evalAfter : undefined,
    });
  }

  for (const finding of positionalFindings) {
    if (!finding.tags?.length) continue;
    allPositions.push({
      tags: finding.tags,
      cpLoss: finding.cpLoss,
      fenBefore: finding.fenBefore,
      userMove: finding.userMove,
      bestMove: finding.bestMove,
      gameUrl: finding.gameUrl,
    });
  }

  if (allPositions.length === 0) return [];

  const groups: DerivedMotif[] = [];

  for (const definition of MOTIF_DEFS) {
    const seenFens = new Set<string>();
    const matching: TaggedPosition[] = [];

    for (const position of allPositions) {
      if (!definition.match(position) || seenFens.has(position.fenBefore)) {
        continue;
      }

      if (
        typeof position.evalAfterUser === "number" &&
        position.evalAfterUser > STILL_WINNING_THRESHOLD
      ) {
        continue;
      }

      seenFens.add(position.fenBefore);
      matching.push(position);
    }

    const minCount = definition.positional ? 1 : 2;
    if (matching.length < minCount) continue;

    const avgCpLoss =
      matching.reduce((sum, position) => sum + position.cpLoss, 0) /
      matching.length;

    groups.push({
      name: definition.name,
      icon: definition.icon,
      count: matching.length,
      avgCpLoss,
      examples: [...matching]
        .sort((left, right) => right.cpLoss - left.cpLoss)
        .slice(0, 6)
        .map((position) => ({
          fenBefore: position.fenBefore,
          userMove: position.userMove,
          bestMove: position.bestMove,
          cpLoss: position.cpLoss,
          gameUrl: position.gameUrl,
        })),
    });
  }

  return groups.sort((left, right) => right.avgCpLoss - left.avgCpLoss);
}

export function ScanSessionReport({
  scan,
  reportMeta,
  hasProAccess = false,
  scanProgress = null,
}: {
  scan: PublicScanSessionPayload;
  reportMeta: ComputedScanReport | null;
  hasProAccess?: boolean;
  scanProgress?: AnalysisProgress | null;
}) {
  const result = scan.result;
  const isProcessing = scan.status === "processing";

  const leaks = result?.leaks ?? [];
  const oneOffMistakes = result?.oneOffMistakes ?? [];
  const missedTactics = result?.missedTactics ?? [];
  const endgameMistakes = result?.endgameMistakes ?? [];
  const openingSummaries = result?.openingSummaries ?? [];
  const positionalFindings = result?.positionalFindings ?? [];
  const timeManagement = result?.timeManagement ?? null;
  const endgameStats = result?.endgameStats ?? null;
  const mentalStats = result?.mentalStats ?? null;
  const timeManagementScore =
    result?.timeManagementScore ?? timeManagement?.score ?? null;
  const isTimeManagementScan = scan.scanMode === "time-management";
  const timeMoments = timeManagement?.moments ?? [];

  const realLeakCount = useMemo(
    () => leaks.filter((leak) => !leak.dbApproved).length,
    [leaks],
  );

  const motifs = useMemo(
    () => buildMotifs(missedTactics, leaks, oneOffMistakes, positionalFindings),
    [missedTactics, leaks, oneOffMistakes, positionalFindings],
  );

  const tacticalMotifs = useMemo(
    () => motifs.filter((motif) => !POSITIONAL_MOTIF_NAMES.has(motif.name)),
    [motifs],
  );

  const positionalMotifs = useMemo(
    () => motifs.filter((motif) => POSITIONAL_MOTIF_NAMES.has(motif.name)),
    [motifs],
  );

  const radarProps = useMemo(() => {
    if (!result || !reportMeta) return null;

    return {
      accuracy: reportMeta.estimatedAccuracy,
      leakCount: realLeakCount,
      repeatedPositions: result.repeatedPositions,
      tacticsCount: result.totalTacticsFound,
      gamesAnalyzed: result.gamesAnalyzed,
      weightedCpLoss: reportMeta.weightedCpLoss,
      severeLeakRate: reportMeta.severeLeakRate,
      timeManagementScore,
    };
  }, [realLeakCount, reportMeta, result, timeManagementScore]);

  const radarData = useMemo(
    () => (radarProps ? computeRadarData(radarProps) : null),
    [radarProps],
  );

  const accessibleLeaks = leaks;
  const accessibleOneOffMistakes = oneOffMistakes;
  const accessibleTactics = hasProAccess
    ? missedTactics
    : missedTactics.slice(0, FREE_SCAN_SECTION_SAMPLE);
  const accessibleEndgames = hasProAccess
    ? endgameMistakes
    : endgameMistakes.slice(0, FREE_SCAN_SECTION_SAMPLE);
  const accessibleMoments = hasProAccess
    ? timeMoments
    : timeMoments.slice(0, FREE_SCAN_SECTION_SAMPLE);

  const leakReveal = useCompactSectionReveal(
    accessibleLeaks.length,
    `${scan.id}:leaks`,
  );
  const oneOffReveal = useCompactSectionReveal(
    accessibleOneOffMistakes.length,
    `${scan.id}:one-offs`,
  );
  const tacticReveal = useCompactSectionReveal(
    accessibleTactics.length,
    `${scan.id}:tactics`,
  );
  const endgameReveal = useCompactSectionReveal(
    accessibleEndgames.length,
    `${scan.id}:endgames`,
  );
  const timeReveal = useCompactSectionReveal(
    accessibleMoments.length,
    `${scan.id}:time`,
  );

  const visibleLeaks = accessibleLeaks.slice(0, leakReveal.shownCount);
  const visibleOneOffMistakes = accessibleOneOffMistakes.slice(
    0,
    oneOffReveal.shownCount,
  );
  const visibleTactics = accessibleTactics.slice(0, tacticReveal.shownCount);
  const visibleEndgames = accessibleEndgames.slice(0, endgameReveal.shownCount);
  const visibleMoments = accessibleMoments.slice(0, timeReveal.shownCount);
  const hiddenTacticsCount = Math.max(
    0,
    missedTactics.length - accessibleTactics.length,
  );
  const hiddenEndgamesCount = Math.max(
    0,
    endgameMistakes.length - accessibleEndgames.length,
  );
  const hiddenTimeMomentsCount = Math.max(
    0,
    timeMoments.length - accessibleMoments.length,
  );

  if (!result) return null;

  const showOpenings =
    scan.scanMode === "openings" ||
    scan.scanMode === "both" ||
    leaks.length > 0 ||
    oneOffMistakes.length > 0 ||
    openingSummaries.length > 0;

  const showTactics =
    scan.scanMode === "tactics" ||
    scan.scanMode === "both" ||
    missedTactics.length > 0 ||
    tacticalMotifs.length > 0;

  const showEndgames =
    scan.scanMode === "endgames" ||
    scan.scanMode === "both" ||
    endgameMistakes.length > 0 ||
    Boolean(endgameStats);

  const showTimeManagement =
    isTimeManagementScan || scan.scanMode === "both" || Boolean(timeManagement);

  const showTraining =
    scan.status === "ready" &&
    (leaks.length > 0 ||
      missedTactics.length > 0 ||
      endgameMistakes.length > 0);

  const phaseOrder: Record<AnalysisProgress["phase"], number> = {
    fetch: 0,
    parse: 1,
    aggregate: 2,
    eval: 3,
    tactics: 4,
    endgames: 5,
    time: 6,
    done: 7,
  };
  const currentPhaseRank = scanProgress ? phaseOrder[scanProgress.phase] : -1;
  const hasReachedPhase = (phase: AnalysisProgress["phase"]) =>
    currentPhaseRank >= phaseOrder[phase];
  const hasPassedPhase = (phase: AnalysisProgress["phase"]) =>
    currentPhaseRank > phaseOrder[phase];
  const scanGameTotal = Math.max(
    result.gamesAnalyzed || 0,
    scan.config.maxGames || 0,
    1,
  );

  const openingsSectionProgress =
    isProcessing &&
    scanProgress &&
    leaks.length === 0 &&
    oneOffMistakes.length === 0 &&
    openingSummaries.length === 0 &&
    (scanProgress.phase === "parse" ||
      scanProgress.phase === "aggregate" ||
      scanProgress.phase === "eval")
      ? {
          message: scanProgress.message,
          detail:
            scanProgress.detail ??
            "Walking your archive and scoring recurring opening positions.",
          current: scanProgress.current,
          total: scanProgress.total,
          percent: scanProgress.percent,
          countLabel:
            scanProgress.phase === "eval" || scanProgress.phase === "aggregate"
              ? "positions"
              : "games",
        }
      : null;

  const tacticsSectionProgress =
    isProcessing &&
    missedTactics.length === 0 &&
    (scanProgress?.phase === "tactics"
      ? {
          message: scanProgress.message,
          detail:
            scanProgress.detail ??
            "Scanning the archive for missed forcing lines.",
          current: scanProgress.current ?? 0,
          total: scanProgress.total ?? scanGameTotal,
          percent: scanProgress.percent,
          countLabel: "games",
        }
      : !hasReachedPhase("tactics")
        ? {
            message: "Tactics queue is ready",
            detail: "Starts automatically after the opening pass finishes.",
            current: 0,
            total: scanGameTotal,
            percent: 0,
            countLabel: "games",
          }
        : null);

  const endgamesSectionProgress =
    isProcessing &&
    endgameMistakes.length === 0 &&
    !endgameStats &&
    (scanProgress?.phase === "endgames"
      ? {
          message: scanProgress.message,
          detail:
            scanProgress.detail ??
            "Checking conversion and defense errors across your archive.",
          current: scanProgress.current ?? 0,
          total: scanProgress.total ?? scanGameTotal,
          percent: scanProgress.percent,
          countLabel: "games",
        }
      : !hasReachedPhase("endgames")
        ? {
            message: "Endgame pass is queued",
            detail: "Starts after tactics finishes.",
            current: 0,
            total: scanGameTotal,
            percent: 0,
            countLabel: "games",
          }
        : null);

  const timeSectionProgress =
    isProcessing &&
    !timeManagement &&
    (scanProgress?.phase === "time"
      ? {
          message: scanProgress.message,
          detail:
            scanProgress.detail ??
            "Checking clocks, scrambles, and rushed decisions.",
          current: scanProgress.current ?? 0,
          total: scanProgress.total ?? scanGameTotal,
          percent: scanProgress.percent,
          countLabel: "games",
        }
      : !hasReachedPhase("time")
        ? {
            message: "Time-management pass is queued",
            detail: "Starts after the endgame pass completes.",
            current: 0,
            total: scanGameTotal,
            percent: 0,
            countLabel: "games",
          }
        : null);

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Games analyzed"
          value={result.gamesAnalyzed || scan.config.maxGames}
          hint={isProcessing ? "Updating live" : undefined}
        />
        <MetricCard
          label="Repeat positions"
          value={result.repeatedPositions}
          tone="emerald"
        />
        <MetricCard
          label="Opening leaks"
          value={leaks.length}
          tone="cyan"
          hint={
            realLeakCount !== leaks.length
              ? `${realLeakCount} count toward scoring`
              : undefined
          }
        />
        <MetricCard
          label="Missed tactics"
          value={result.totalTacticsFound || missedTactics.length}
          tone="amber"
        />
        <MetricCard
          label="Endgame mistakes"
          value={endgameMistakes.length}
          tone="sky"
        />
        {reportMeta ? (
          <MetricCard
            label={
              isTimeManagementScan && timeManagementScore != null
                ? "Time score"
                : "Accuracy"
            }
            value={
              isTimeManagementScan && timeManagementScore != null
                ? `${timeManagementScore}/100`
                : `${reportMeta.estimatedAccuracy.toFixed(1)}%`
            }
            tone="fuchsia"
          />
        ) : (
          <MetricCard
            label="Overall profile"
            value={isProcessing ? "Building" : "Pending"}
            hint="Scores appear once enough positions are evaluated"
            tone="fuchsia"
          />
        )}
      </section>

      {reportMeta ? (
        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_rgba(15,23,42,0.9)_42%,_rgba(2,6,23,0.98)_100%)] p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {isProcessing ? "Live report preview" : "Report summary"}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-[2.2rem]">
              {reportMeta.vibeTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {reportMeta.topTag === "No big leak pattern"
                ? "The scan has enough signal to score the profile, but no single opening tag is dominating the sample."
                : `Your strongest recurring signal right now is ${reportMeta.topTag}. The sections below update as more detail locks in.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-slate-200">
                Confidence {reportMeta.confidence}%
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-slate-200">
                {reportMeta.sampleSize} scored positions
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-slate-200">
                Consistency {reportMeta.consistencyScore}/100
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Estimated rating"
              value={reportMeta.estimatedRating}
              tone="cyan"
            />
            <MetricCard
              label="Avg eval loss"
              value={formatPawnLoss(reportMeta.weightedCpLoss)}
              tone="fuchsia"
            />
            <MetricCard
              label="Severe leak rate"
              value={`${(reportMeta.severeLeakRate * 100).toFixed(0)}%`}
              tone="amber"
            />
            <MetricCard
              label="75th percentile loss"
              value={formatPawnLoss(reportMeta.p75CpLoss)}
              tone="emerald"
            />
          </div>
        </section>
      ) : null}

      {radarProps && radarData ? (
        <>
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-6">
            <h2 className="text-lg font-bold text-white">
              Strengths and weaknesses
            </h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <StrengthsRadar {...radarProps} />
              <RadarLegend data={radarData} props={radarProps} />
            </div>
          </div>
          <InsightCards
            data={radarData}
            props={radarProps}
            hasProAccess={hasProAccess}
          />
        </>
      ) : isProcessing || result ? (
        <RadarLoadingState
          progress={scanProgress}
          isProcessing={isProcessing}
        />
      ) : null}

      {showOpenings ? (
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Openings"
            title="Opening report"
            description={
              isProcessing
                ? "Recurring leaks, rankings, and one-off misses appear here as each opening pass completes."
                : "Recurring leaks, opening rankings, and the sharpest one-off misses from the scanned archive."
            }
            badge={formatCompactBadge({
              shown: visibleLeaks.length,
              available: accessibleLeaks.length,
              total: leaks.length,
              singular: "recurring leak",
              plural: "recurring leaks",
            })}
            live={isProcessing}
          />

          {openingSummaries.length > 0 ? (
            <OpeningRankings openingSummaries={openingSummaries} />
          ) : null}

          {leaks.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
                <h3 className="text-lg font-bold text-white">
                  Recurring opening leaks
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Positions you keep reaching and misplaying often enough to
                  become a real pattern in your repertoire.
                </p>
              </div>

              <CardCarousel
                viewMode="grid"
                footer={
                  <CompactCardFooter
                    shown={visibleLeaks.length}
                    total={accessibleLeaks.length}
                    label="opening leaks"
                    onLoadMore={leakReveal.loadMore}
                    onShowLess={leakReveal.showLess}
                  />
                }
              >
                {visibleLeaks.map((leak) => (
                  <MistakeCard
                    key={`${leak.fenBefore}-${leak.userMove}`}
                    leak={leak}
                    engineDepth={scan.config.engineDepth}
                  />
                ))}
              </CardCarousel>
            </div>
          ) : openingsSectionProgress ? (
            <SectionLoadingProgress {...openingsSectionProgress} />
          ) : isProcessing ? (
            <AnalysisSectionSkeleton label="Collecting recurring opening leaks..." />
          ) : (
            <EmptySection message="No recurring opening leaks were detected in this scan." />
          )}

          {oneOffMistakes.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
                <h3 className="text-lg font-bold text-white">
                  Sharp one-off misses
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Positions that did not repeat often enough to become leaks,
                  but were still expensive.
                </p>
              </div>

              <CardCarousel
                viewMode="grid"
                footer={
                  <CompactCardFooter
                    shown={visibleOneOffMistakes.length}
                    total={accessibleOneOffMistakes.length}
                    label="one-off misses"
                    onLoadMore={oneOffReveal.loadMore}
                    onShowLess={oneOffReveal.showLess}
                  />
                }
              >
                {visibleOneOffMistakes.map((mistake) => (
                  <MistakeCard
                    key={`${mistake.fenBefore}-${mistake.userMove}-${mistake.moveCount}`}
                    leak={mistake}
                    engineDepth={scan.config.engineDepth}
                  />
                ))}
              </CardCarousel>
            </div>
          ) : null}
        </section>
      ) : null}

      {tacticalMotifs.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Patterns"
            title="Recurring tactical themes"
            description="Grouped motifs ranked by impact so you can see what keeps showing up across your games."
            badge={`${tacticalMotifs.length} motif${tacticalMotifs.length === 1 ? "" : "s"}`}
            live={isProcessing}
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {tacticalMotifs.map((motif) => (
              <div
                key={motif.name}
                className="rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg">{motif.icon}</p>
                    <h3 className="mt-2 text-base font-bold text-white">
                      {motif.name}
                    </h3>
                  </div>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-300">
                    {motif.count}x
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Average damage: {formatPawnLoss(motif.avgCpLoss)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {showTactics ? (
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Tactics"
            title="Missed tactics"
            description={
              isProcessing
                ? "Tactical misses land here as soon as the forcing-line pass finishes."
                : "Forcing moves and tactical shots the scan found and ranked by impact."
            }
            badge={formatCompactBadge({
              shown: visibleTactics.length,
              available: accessibleTactics.length,
              total: Math.max(result.totalTacticsFound, missedTactics.length),
              singular: "found",
              plural: "found",
            })}
            live={isProcessing}
          />

          {missedTactics.length > 0 ? (
            <CardCarousel
              viewMode="grid"
              footer={
                <CompactCardFooter
                  shown={visibleTactics.length}
                  total={accessibleTactics.length}
                  label="tactics"
                  onLoadMore={tacticReveal.loadMore}
                  onShowLess={tacticReveal.showLess}
                />
              }
            >
              {visibleTactics.map((tactic) => (
                <TacticCard
                  key={`${tactic.fenBefore}-${tactic.userMove}-${tactic.gameIndex}`}
                  tactic={tactic}
                  engineDepth={scan.config.engineDepth}
                />
              ))}
            </CardCarousel>
          ) : tacticsSectionProgress ? (
            <SectionLoadingProgress {...tacticsSectionProgress} />
          ) : isProcessing && hasPassedPhase("tactics") ? (
            <EmptySection message="No major missed tactics detected so far. The rest of the report is still processing." />
          ) : isProcessing ? (
            <AnalysisSectionSkeleton label="Scanning for missed tactics..." />
          ) : (
            <EmptySection message="No major missed tactics were detected in this scan." />
          )}

          {!isProcessing && hiddenTacticsCount > 0 ? (
            <ProSectionLimitNotice
              label="tactics"
              shown={accessibleTactics.length}
              total={missedTactics.length}
            />
          ) : null}
        </section>
      ) : null}

      {showEndgames ? (
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Endgames"
            title="Endgame report"
            description={
              isProcessing
                ? "As endgame positions finish evaluating, the sharpest conversion and defense errors appear here."
                : "Conversion errors, hold failures, and the endgame types that cost the most."
            }
            badge={formatCompactBadge({
              shown: visibleEndgames.length,
              available: accessibleEndgames.length,
              total: endgameMistakes.length,
              singular: "mistake",
              plural: "mistakes",
            })}
            live={isProcessing}
          />

          {endgameStats ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Positions analyzed"
                value={endgameStats.totalPositions}
                tone="sky"
              />
              <MetricCard
                label="Average loss"
                value={formatPawnLoss(endgameStats.avgCpLoss)}
                tone="amber"
              />
              <MetricCard
                label="Weakest type"
                value={endgameStats.weakestType ?? "None"}
                tone="cyan"
              />
              <MetricCard
                label="Conversion rate"
                value={
                  endgameStats.conversionRate == null
                    ? "N/A"
                    : `${endgameStats.conversionRate.toFixed(0)}%`
                }
                tone="emerald"
              />
            </div>
          ) : null}

          {endgameMistakes.length > 0 ? (
            <CardCarousel
              viewMode="grid"
              footer={
                <CompactCardFooter
                  shown={visibleEndgames.length}
                  total={accessibleEndgames.length}
                  label="endgame mistakes"
                  onLoadMore={endgameReveal.loadMore}
                  onShowLess={endgameReveal.showLess}
                />
              }
            >
              {visibleEndgames.map((mistake) => (
                <EndgameCard
                  key={`${mistake.fenBefore}-${mistake.userMove}-${mistake.gameIndex}`}
                  mistake={mistake}
                  engineDepth={scan.config.engineDepth}
                />
              ))}
            </CardCarousel>
          ) : endgamesSectionProgress ? (
            <SectionLoadingProgress {...endgamesSectionProgress} />
          ) : isProcessing && hasPassedPhase("endgames") ? (
            <EmptySection message="No major endgame mistakes detected so far. The rest of the report is still processing." />
          ) : isProcessing ? (
            <AnalysisSectionSkeleton label="Analyzing endgame positions..." />
          ) : (
            <EmptySection message="No major endgame mistakes were detected in this scan." />
          )}

          {!isProcessing && hiddenEndgamesCount > 0 ? (
            <ProSectionLimitNotice
              label="endgame mistakes"
              shown={accessibleEndgames.length}
              total={endgameMistakes.length}
            />
          ) : null}
        </section>
      ) : null}

      {showTimeManagement ? (
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Time"
            title="Time management"
            description={
              isProcessing
                ? "Clock-usage patterns appear here once move times and engine agreement are stitched together."
                : "Rushed moves, wasted thinks, and the moments where your clock management actually helped."
            }
            badge={
              timeManagement
                ? formatCompactBadge({
                    shown: visibleMoments.length,
                    available: accessibleMoments.length,
                    total: timeMoments.length,
                    singular: "moment",
                    plural: "moments",
                  })
                : "Waiting for clock data"
            }
            live={isProcessing}
          />

          {timeManagement ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Score"
                value={`${timeManagement.score}/100`}
                tone="fuchsia"
              />
              <MetricCard
                label="Avg / move"
                value={`${timeManagement.avgTimePerMove.toFixed(1)}s`}
                tone="slate"
              />
              <MetricCard
                label="Justified thinks"
                value={timeManagement.justifiedThinks}
                tone="emerald"
              />
              <MetricCard
                label="Time wasted"
                value={timeManagement.wastedThinks}
                tone="amber"
              />
              <MetricCard
                label="Rushed moves"
                value={timeManagement.rushedMoves}
                tone="cyan"
              />
            </div>
          ) : null}

          {visibleMoments.length > 0 ? (
            <CardCarousel
              viewMode="grid"
              footer={
                <CompactCardFooter
                  shown={visibleMoments.length}
                  total={accessibleMoments.length}
                  label="time-management moments"
                  onLoadMore={timeReveal.loadMore}
                  onShowLess={timeReveal.showLess}
                />
              }
            >
              {visibleMoments.map((moment) => (
                <TimeCard
                  key={`${moment.fen}-${moment.userMove}-${moment.gameIndex}`}
                  moment={moment}
                />
              ))}
            </CardCarousel>
          ) : timeSectionProgress ? (
            <SectionLoadingProgress {...timeSectionProgress} />
          ) : isProcessing && hasPassedPhase("time") ? (
            <EmptySection message="No notable time-management moments detected so far. The rest of the report is still processing." />
          ) : isProcessing ? (
            <AnalysisSectionSkeleton label="Analyzing clock usage..." />
          ) : (
            <EmptySection message="No notable time-management moments were detected in this scan." />
          )}

          {!isProcessing && hiddenTimeMomentsCount > 0 ? (
            <ProSectionLimitNotice
              label="time-management moments"
              shown={accessibleMoments.length}
              total={timeMoments.length}
            />
          ) : null}
        </section>
      ) : null}

      {mentalStats ? (
        <ScanMentalGame mentalStats={mentalStats} hasProAccess={hasProAccess} />
      ) : isProcessing ? (
        <MentalGameLoading />
      ) : null}

      {positionalMotifs.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Positional"
            title="Habits beneath the blunders"
            description="These quieter patterns show up before the tactical punishment. They are strong follow-up training targets."
            badge={`${positionalMotifs.length} motif${positionalMotifs.length === 1 ? "" : "s"}`}
            live={isProcessing}
          />

          <ScanPositionalMotifs
            motifs={positionalMotifs}
            isProcessing={isProcessing}
            showTrainer={scan.status === "ready"}
            hasProAccess={hasProAccess}
          />
        </section>
      ) : null}

      {showTraining ? (
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Training"
            title="Puzzle follow-up"
            description="Turn the scan into drills immediately with theme-matched practice pulled from the exact weaknesses found above."
          />
          <PersonalizedPuzzles
            tactics={missedTactics}
            endgames={endgameMistakes}
            leaks={leaks}
          />
        </section>
      ) : null}
    </div>
  );
}
