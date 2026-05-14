"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CardCarousel } from "@/components/card-carousel";
import type { CommunityPostComposerSeed } from "@/components/community-post-composer-modal";
import { EndgameCard } from "@/components/endgame-card";
import { MistakeCard } from "@/components/mistake-card";
import {
  MentalGameLoading,
  ScanMentalGame,
} from "@/components/scan-mental-game";
import { OpeningRankings } from "@/components/opening-rankings";
import { ScanPositionalMotifs } from "@/components/scan-positional-motifs";
import {
  RadarLegend,
  StrengthsRadar,
  computeRadarData,
  type RadarDimension,
} from "@/components/radar-chart";
import { TacticCard } from "@/components/tactic-card";
import { TimeCard } from "@/components/time-card";
import type { AnalysisProgress } from "@/lib/client-analysis";
import { computeEndgameTechniqueScore } from "@/lib/scan-session";
import { isMissedMateTactic } from "@/lib/tactic-utils";
import type {
  ComputedScanReport,
  PublicScanSessionPayload,
} from "@/lib/scan-session";
import type {
  EndgameStats,
  EndgameMistake,
  MissedTactic,
  PositionalFinding,
  RepeatedOpeningLeak,
  TimeManagementReport,
  TimeMoment,
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
    match: (position) => position.tags.includes("Missed Mate"),
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
            Strengths and coaching
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

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-[1.75rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_rgba(15,23,42,0.82)_38%,_rgba(2,6,23,0.96)_100%)] p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Good news first
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {isProcessing
              ? "FireChess is still locking the strength profile, but this section stays visible so the report does not jump from metrics straight into weaknesses."
              : "The confidence-first strengths summary appears here as soon as enough positions are scored."}
          </p>
          <div className="mt-4 space-y-2 animate-pulse">
            <div className="h-4 w-4/5 rounded-full bg-white/[0.08]" />
            <div className="h-4 w-3/5 rounded-full bg-white/[0.06]" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {["Current edge", "Also helping"].map((label) => (
            <div
              key={label}
              className="rounded-[1.25rem] border border-white/[0.08] bg-white/[0.02] p-4 animate-pulse"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {label}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-white/[0.08]" />
                <div className="min-w-0 flex-1">
                  <div className="h-3 w-2/3 rounded-full bg-white/[0.08]" />
                  <div className="mt-2 h-2.5 w-full rounded-full bg-white/[0.06]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
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

        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6 animate-pulse">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Coach&apos;s note
            </p>
            <div className="mt-4 h-3 w-full rounded-full bg-white/[0.08]" />
            <div className="mt-2 h-3 w-11/12 rounded-full bg-white/[0.06]" />
            <div className="mt-2 h-3 w-4/5 rounded-full bg-white/[0.06]" />
          </div>

          <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Profile outline
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                The detailed readout appears here as soon as the strength map
                stabilizes.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
      </div>
    </div>
  );
}

function FollowUpStatusRow({
  label,
  detail,
  status,
  tone,
}: {
  label: string;
  detail: string;
  status: string;
  tone: "cyan" | "emerald" | "amber";
}) {
  const toneClasses = {
    cyan: {
      border: "border-cyan-500/20 bg-cyan-500/[0.06]",
      badge: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
      dot: "bg-cyan-400",
    },
    emerald: {
      border: "border-emerald-500/20 bg-emerald-500/[0.06]",
      badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      dot: "bg-emerald-400",
    },
    amber: {
      border: "border-amber-500/20 bg-amber-500/[0.06]",
      badge: "border-amber-500/20 bg-amber-500/10 text-amber-100",
      dot: "bg-amber-400",
    },
  }[tone];

  return (
    <div className={`rounded-[1.25rem] border p-4 ${toneClasses.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {detail}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${toneClasses.dot}`} />
          {status}
        </span>
      </div>
    </div>
  );
}

function ReportFollowUpCta({
  drillsReady,
  issueCount,
  isProcessing,
}: {
  drillsReady: boolean;
  issueCount: number;
  isProcessing: boolean;
}) {
  const statusLabel = drillsReady
    ? `${issueCount} target${issueCount === 1 ? "" : "s"} ready`
    : isProcessing
      ? "Loading"
      : "Standby";

  return (
    <div className="rounded-[1.75rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_rgba(15,23,42,0.82)_38%,_rgba(2,6,23,0.96)_100%)] p-6 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Follow-up queue
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
            Keep the report moving
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            {drillsReady
              ? "The scan is ready to hand off into drills. Use the CTA below instead of expanding another heavy report block here."
              : isProcessing
                ? "FireChess is still building the drill handoff from the live scan. The CTA stays here so you can jump in as soon as it locks."
                : "The follow-up shell is in place. FireChess will light it up here once the drill handoff is ready."}
          </p>
        </div>

        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-sm font-semibold text-slate-200">
          {statusLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <FollowUpStatusRow
          label="Weakness drills"
          detail={
            drillsReady
              ? "Theme-matched drills are ready from the report issues above."
              : "Matching recurring mistakes to the drill queue."
          }
          status={drillsReady ? "Ready" : "Loading..."}
          tone={drillsReady ? "emerald" : "cyan"}
        />
        <FollowUpStatusRow
          label="Study plan"
          detail="Weekly follow-up is being wired into this report flow."
          status="Loading..."
          tone="amber"
        />
        <FollowUpStatusRow
          label="Daily follow-up"
          detail="Short report-linked sessions will slot in here once the handoff is finished."
          status={drillsReady ? "Loading..." : "Queued"}
          tone={drillsReady ? "cyan" : "amber"}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {drillsReady ? (
          <Link
            href="/train"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/12 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/18 hover:text-white"
          >
            Open Puzzles & Drills
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-300 opacity-70"
          >
            Drills loading...
          </button>
        )}

        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-300 opacity-70"
        >
          Study plan loading...
        </button>
      </div>
    </div>
  );
}

const RADAR_DIMENSION_ICONS: Record<string, string> = {
  Accuracy: "🎯",
  "Opening Prep": "📚",
  "Tactical Eye": "⚡",
  Composure: "🧘",
  "Time Mgmt": "⏱️",
  Endgames: "♜",
  Resilience: "🛡️",
};

const RADAR_STRENGTH_NOTES: Record<string, string> = {
  Accuracy:
    "Your move quality is already giving the rest of your game a steadier base.",
  "Opening Prep":
    "You are reaching enough familiar structures to avoid starting every game from scratch.",
  "Tactical Eye":
    "You are spotting enough forcing ideas to create chances instead of only reacting.",
  Composure:
    "You are holding enough positions together to avoid every rough moment turning into a collapse.",
  "Time Mgmt":
    "Your clock handling is giving your chess enough room to show up on the board.",
  Endgames:
    "Your endgame technique is converting enough better endings and saving enough worse ones to matter.",
  Resilience:
    "You keep enough fight in messy spots to stay competitive after mistakes.",
};

function buildRadarNarrative(data: RadarDimension[]) {
  const sorted = [...data].sort((a, b) => a.value - b.value);
  const strongest = sorted.at(-1) ?? data[0];
  const backupStrength = sorted.at(-2) ?? strongest;
  const weakest = sorted[0] ?? data[0];
  const avg = Math.round(
    data.reduce((sum, dimension) => sum + dimension.value, 0) / data.length,
  );

  if (!strongest || !backupStrength || !weakest) {
    return {
      topStrengths: data.slice(0, 2),
      confidenceLead:
        "There is already something useful in this profile to build around.",
      strengthNote:
        "The point of this section is to show where your confidence should come from before the training plan starts asking for more.",
      coachingParagraph:
        "Use the report as a starting point, not a verdict. Lean on what already feels stable and make the next improvement one clear target at a time.",
    };
  }

  if (avg >= 75) {
    return {
      topStrengths: [strongest, backupStrength],
      confidenceLead: `${strongest.dimension} is already a real weapon in your games, with ${backupStrength.dimension} right behind it.`,
      strengthNote:
        "This report reads more like refinement than repair. You already have clear strengths to lean on.",
      coachingParagraph: `You already have a strong base, especially in ${strongest.dimension}. The cleanest next gain now is ${weakest.dimension}: tighten that one bottleneck and the rest of the profile should feel even more reliable. Treat this report as sharpening, not rebuilding.`,
    };
  }

  if (avg >= 50) {
    return {
      topStrengths: [strongest, backupStrength],
      confidenceLead: `${strongest.dimension} is already giving your games real structure.`,
      strengthNote: `You are not starting from zero here. ${backupStrength.dimension} is also helping keep the floor of your game higher.`,
      coachingParagraph: `You already have a solid foundation, led by ${strongest.dimension}. The next jump should come from ${weakest.dimension}, because that is the main thing pulling the rest of the profile down. Fix that one deliberately and the rest of your game should feel steadier without losing confidence.`,
    };
  }

  if (avg >= 30) {
    return {
      topStrengths: [strongest, backupStrength],
      confidenceLead: `${strongest.dimension} is the first part of your game that already looks buildable.`,
      strengthNote:
        "That matters more than the low points. The report still shows a base you can trust while you improve the rest.",
      coachingParagraph: `There is enough here to build on, especially in ${strongest.dimension}. The biggest lift now comes from ${weakest.dimension}: get that bottleneck under control and the whole profile should calm down. Focus on one weakness at a time and let your stronger area keep the rest of your game stable.`,
    };
  }

  return {
    topStrengths: [strongest, backupStrength],
    confidenceLead: `${strongest.dimension} is still the best place to start building confidence.`,
    strengthNote:
      "Even a rough report is useful when it shows you where the first solid footing is.",
    coachingParagraph: `This report is a starting point, not a label. Build around ${strongest.dimension} first, then put most of your effort into ${weakest.dimension}, because that is where the fastest gains should come from. Small progress there will make the rest of your game feel less fragile.`,
  };
}

function StrengthSpotlightCard({
  label,
  dimension,
  accent,
}: {
  label: string;
  dimension: RadarDimension;
  accent: "emerald" | "cyan";
}) {
  const accentClasses =
    accent === "emerald"
      ? {
          border: "border-emerald-500/20 bg-emerald-500/[0.06]",
          badge: "border-emerald-500/20 bg-emerald-500/12 text-emerald-100",
          icon: "bg-emerald-500/15 text-emerald-200",
        }
      : {
          border: "border-cyan-500/20 bg-cyan-500/[0.06]",
          badge: "border-cyan-500/20 bg-cyan-500/12 text-cyan-100",
          icon: "bg-cyan-500/15 text-cyan-200",
        };

  return (
    <div className={`rounded-[1.5rem] border p-5 ${accentClasses.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {label}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${accentClasses.icon}`}
            >
              {RADAR_DIMENSION_ICONS[dimension.dimension] ?? "✨"}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">
                {dimension.dimension}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                {RADAR_STRENGTH_NOTES[dimension.dimension] ??
                  "There is already something reliable here to build around."}
              </p>
            </div>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${accentClasses.badge}`}
        >
          {dimension.value}/100
        </span>
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

type CoachInsightLine = {
  text: string;
  type: "positive" | "improve";
};

const ENDGAME_TYPE_ICONS: Record<string, string> = {
  Pawn: "♟",
  Rook: "♜",
  "Rook + Bishop": "♜♝",
  "Rook + Knight": "♜♞",
  "Rook + Minor": "♜♝",
  "Knight vs Knight": "♞♞",
  "Bishop vs Bishop": "♝♝",
  "Knight vs Bishop": "♞♝",
  "Bishop vs Knight": "♝♞",
  "Bishop + Knight": "♝♞",
  "Two Bishops": "♝♝",
  "Two Knights": "♞♞",
  "Minor Piece": "♝",
  Queen: "♛",
  "Queen + Rook": "♛♜",
  "Queen + Minor": "♛♝",
  "Opposite Bishops": "♗♝",
  Complex: "♔",
};

const ENDGAME_TYPE_NOTES: Record<string, string> = {
  Pawn: "Practice king activity, opposition, and key squares. These endings are decided by tempi more often than tactics.",
  Rook: "Study Lucena and Philidor positions first. Rook activity behind passed pawns usually matters more than pawn grabbing.",
  "Rook + Bishop":
    "Use the rook to create targets while the bishop controls long diagonals. Restriction matters more than speed here.",
  "Rook + Knight":
    "Knights need stable outposts. If the board opens, the rook usually becomes the star piece.",
  "Rook + Minor":
    "Coordinate the rook with the minor piece instead of letting them chase separate plans.",
  "Knight vs Knight":
    "These often behave like pawn endings. Central king activity and passed-pawn races decide more than flashy tactics.",
  "Bishop vs Bishop":
    "Fix pawns on the enemy bishop's color and use the king aggressively to create targets.",
  "Knight vs Bishop":
    "If you have the knight, lock the structure. If you have the bishop, open the board and use the long-range pressure.",
  "Bishop vs Knight":
    "Use the bishop's range and play on both wings when possible. Do not let the knight settle on stable outposts.",
  "Bishop + Knight":
    "Coordinate both pieces before pushing for concrete gains. The pieces are strong together but awkward when split.",
  "Two Bishops":
    "Keep the board open and avoid unnecessary bishop trades. The pair wins by stretching the opponent.",
  "Two Knights":
    "Support pawn promotion plans. The knights need concrete targets or they can drift without impact.",
  "Minor Piece":
    "Piece activity and pawn structure decide these endings. Look for the pawn skeletons where your piece is naturally stronger.",
  Queen:
    "Centralize the queen, watch perpetual-check resources, and keep king safety ahead of material greed.",
  "Queen + Rook":
    "Look for mating nets, back-rank ideas, and perpetual tricks. This material balance punishes loose kings fast.",
  "Queen + Minor":
    "Use the queen to create threats while the minor piece controls key escape squares and supports conversion.",
  "Opposite Bishops":
    "These are often drawish. The attacker usually needs play on both wings to make progress.",
  Complex:
    "Simplify when ahead and complicate when behind. King safety and piece coordination matter more than memorized technique.",
};

function CoachInsightPanel({
  headline,
  headlineClass,
  lines,
  borderClass,
  backgroundClass,
}: {
  headline: string;
  headlineClass: string;
  lines: CoachInsightLine[];
  borderClass: string;
  backgroundClass: string;
}) {
  if (lines.length === 0) return null;

  return (
    <div
      className={`rounded-[1.5rem] border p-5 sm:p-6 ${borderClass} ${backgroundClass}`}
    >
      <p
        className={`text-lg font-black tracking-tight sm:text-xl ${headlineClass}`}
      >
        {headline}
      </p>
      <div className="mt-3 space-y-2">
        {lines.map((line, index) => (
          <div key={`${line.type}-${index}`} className="flex items-start gap-2">
            <span
              className={`mt-0.5 text-xs ${line.type === "positive" ? "text-emerald-400" : "text-slate-500"}`}
            >
              {line.type === "positive" ? "✦" : "▸"}
            </span>
            <p
              className={`text-sm leading-relaxed ${line.type === "positive" ? "text-emerald-300/90" : "text-slate-400"}`}
            >
              {line.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TacticsCoachInsight({
  missedTactics,
}: {
  missedTactics: MissedTactic[];
}) {
  if (missedTactics.length === 0) return null;

  const timePressureCount = missedTactics.filter(
    (tactic) =>
      typeof tactic.timeRemainingSec === "number" &&
      tactic.timeRemainingSec <= 30,
  ).length;
  const timePressureRate =
    missedTactics.length > 0 ? timePressureCount / missedTactics.length : 0;
  const matesMissed = missedTactics.filter(isMissedMateTactic).length;
  const nonMateTactics = missedTactics.filter(
    (tactic) => tactic.cpLoss < 99000,
  );
  const avgLoss =
    nonMateTactics.reduce((sum, tactic) => sum + tactic.cpLoss, 0) /
    Math.max(1, nonMateTactics.length);
  const totalMissed = missedTactics.length;

  let headline = "A few tactical gaps to patch.";
  let headlineClass = "text-amber-100";
  const lines: CoachInsightLine[] = [];

  if (totalMissed <= 2 && matesMissed === 0) {
    headline = "Sharp tactical vision.";
    headlineClass = "text-emerald-200";
  } else if (matesMissed >= 2) {
    headline = "Forced mates are slipping through.";
  } else if (timePressureRate > 0.5 && timePressureCount >= 2) {
    headline = "Time pressure is blinding your tactics.";
  } else if (avgLoss > 500) {
    headline = "You're leaving pieces on the table.";
  } else if (totalMissed >= 5) {
    headline = "Too many tactics are going unnoticed.";
  }

  if (matesMissed === 0 && totalMissed > 0) {
    lines.push({
      text: "You did not miss any forced checkmates. Your mating pattern awareness is holding up well.",
      type: "positive",
    });
  }
  if (timePressureCount === 0 && totalMissed > 0) {
    lines.push({
      text: "None of these misses came under severe time pressure, so this looks more like pattern recognition than panic.",
      type: "positive",
    });
  }
  if (totalMissed <= 3 && totalMissed > 0 && avgLoss < 300) {
    lines.push({
      text: "Most of the misses are smaller tactical edges rather than total collapses. That is easier to tighten up than a full rebuild.",
      type: "positive",
    });
  }
  if (matesMissed >= 1) {
    lines.push({
      text: `${matesMissed} forced mate${matesMissed > 1 ? "s" : ""} slipped through. Daily mate-in-2 and mate-in-3 reps should pay back quickly here.`,
      type: "improve",
    });
  }
  if (timePressureRate > 0.4 && timePressureCount >= 2) {
    lines.push({
      text: `${(timePressureRate * 100).toFixed(0)}% of the misses happened with 30 seconds or less. That is a sign to slow down slightly in sharp positions.`,
      type: "improve",
    });
  }
  if (avgLoss > 400 && nonMateTactics.length >= 2) {
    lines.push({
      text: `The average miss is worth ${(avgLoss / 100).toFixed(1)} pawns. Rebuilding a habit of checking checks, captures, and threats before every move is the fastest fix.`,
      type: "improve",
    });
  }
  if (totalMissed >= 5) {
    lines.push({
      text: `${totalMissed} tactical misses across the sample is enough to justify a short daily puzzle block focused on pattern repetition, not just raw difficulty.`,
      type: "improve",
    });
  }

  return (
    <CoachInsightPanel
      headline={headline}
      headlineClass={headlineClass}
      lines={lines.slice(0, 3)}
      borderClass="border-amber-500/15"
      backgroundClass="bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.10),_rgba(15,23,42,0.82)_40%,_rgba(2,6,23,0.96)_100%)]"
    />
  );
}

function TacticalPatternAnalysis({ motifs }: { motifs: DerivedMotif[] }) {
  if (motifs.length === 0) return null;

  return (
    <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Pattern Analysis
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Ranked worst to best so the training target is obvious instead of
            buried in the tactic list.
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Ranked Worst to Best
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {motifs.map((motif, index) => {
          const total = motifs.length;
          const isWorst = index === 0;
          const isBest = index === total - 1;
          const ratio = total > 1 ? index / (total - 1) : 0.5;
          const rankColor =
            ratio >= 0.7
              ? "text-emerald-400"
              : ratio >= 0.3
                ? "text-amber-400"
                : "text-red-400";
          const borderClass = isWorst
            ? "border-red-500/20 bg-red-500/[0.06]"
            : isBest
              ? "border-emerald-500/20 bg-emerald-500/[0.04]"
              : "border-white/[0.06] bg-white/[0.02]";
          const badgeBg = isWorst
            ? "bg-red-500/15"
            : isBest
              ? "bg-emerald-500/15"
              : "bg-white/[0.06]";

          return (
            <div
              key={motif.name}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all hover:border-white/[0.12] ${borderClass}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${badgeBg} ${rankColor}`}
              >
                #{index + 1}
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-lg">
                {motif.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  {motif.name}
                  {isWorst ? (
                    <span className="ml-1.5 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                      WEAKEST
                    </span>
                  ) : null}
                  {isBest && total > 1 ? (
                    <span className="ml-1.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      BEST
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-400">
                  {motif.count}x missed
                  {motif.avgCpLoss < 99000 ? (
                    <>
                      {" "}
                      · avg{" "}
                      <span className={rankColor}>
                        -{(motif.avgCpLoss / 100).toFixed(1)}
                      </span>
                    </>
                  ) : (
                    " · forced mate"
                  )}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badgeBg} ${rankColor}`}
              >
                {motif.count}
              </span>
            </div>
          );
        })}
      </div>

      {motifs.length >= 2 ? (
        <p className="mt-4 text-xs text-slate-500">
          Focus the next round of training on the top recurring motif first.
          That is where repetition is hurting you most.
        </p>
      ) : null}
    </div>
  );
}

function EndgameCoachInsight({
  endgameStats,
  endgameMistakes,
}: {
  endgameStats: EndgameStats;
  endgameMistakes: EndgameMistake[];
}) {
  const { totalPositions, avgCpLoss, conversionRate, holdRate, weakestType } =
    endgameStats;
  const mistakeCount = endgameMistakes.length;
  const mistakeRate = totalPositions > 0 ? mistakeCount / totalPositions : 0;

  let headline = "Decent endgame play with room to grow.";
  let headlineClass = "text-sky-100";
  const lines: CoachInsightLine[] = [];

  if (avgCpLoss <= 20 && mistakeRate <= 0.1) {
    headline = "Your endgame technique is rock-solid.";
    headlineClass = "text-emerald-200";
  } else if (conversionRate != null && conversionRate < 40) {
    headline = "You are letting winning endgames slip away.";
  } else if (holdRate != null && holdRate < 30) {
    headline = "Defensive endgames need work.";
  } else if (avgCpLoss > 60) {
    headline = "Endgame inaccuracies are adding up.";
  } else if (mistakeRate > 0.25) {
    headline = "Too many endgame errors for this sample.";
  }

  if (conversionRate != null && conversionRate >= 70) {
    lines.push({
      text: `${conversionRate.toFixed(0)}% conversion rate. You are cashing in winning endings reliably.`,
      type: "positive",
    });
  }
  if (holdRate != null && holdRate >= 60) {
    lines.push({
      text: `${holdRate.toFixed(0)}% hold rate from worse endings. That defensive skill saves real points.`,
      type: "positive",
    });
  }
  if (avgCpLoss <= 25 && totalPositions >= 3) {
    lines.push({
      text: `Only ${(avgCpLoss / 100).toFixed(2)} average pawn loss in endings. Your technical moves are already fairly clean.`,
      type: "positive",
    });
  }
  if (mistakeRate <= 0.1 && mistakeCount > 0) {
    lines.push({
      text: `Only ${mistakeCount} notable endgame mistake${mistakeCount !== 1 ? "s" : ""} across ${totalPositions} positions.`,
      type: "positive",
    });
  }
  if (conversionRate != null && conversionRate < 50) {
    lines.push({
      text: `You are converting only ${conversionRate.toFixed(0)}% of winning endings. Technique work should give a direct rating return here.`,
      type: "improve",
    });
  }
  if (holdRate != null && holdRate < 40) {
    lines.push({
      text: `Only ${holdRate.toFixed(0)}% of worse endings are being held. Fortress ideas and defensive king activity are the first place to train.`,
      type: "improve",
    });
  }
  if (weakestType) {
    lines.push({
      text: `${weakestType} endings are the clearest weak spot in this report. Targeted work there should move the whole endgame section fastest.`,
      type: "improve",
    });
  }
  if (avgCpLoss > 60) {
    lines.push({
      text: `Average endgame loss is ${(avgCpLoss / 100).toFixed(2)} pawns. Slowing down and calculating one move deeper in simplified positions should help.`,
      type: "improve",
    });
  }

  return (
    <CoachInsightPanel
      headline={headline}
      headlineClass={headlineClass}
      lines={lines.slice(0, 3)}
      borderClass="border-sky-500/15"
      backgroundClass="bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.10),_rgba(15,23,42,0.82)_40%,_rgba(2,6,23,0.96)_100%)]"
    />
  );
}

function EndgameTypeBreakdown({
  endgameStats,
  endgameMistakes,
}: {
  endgameStats: EndgameStats;
  endgameMistakes: EndgameMistake[];
}) {
  if (endgameStats.byType.length === 0 && endgameMistakes.length === 0)
    return null;

  const mistakeRate =
    endgameStats.totalPositions > 0
      ? ((endgameMistakes.length / endgameStats.totalPositions) * 100).toFixed(
          0,
        )
      : "0";
  const failedConversions = endgameMistakes.filter((mistake) =>
    mistake.tags.includes("Failed Conversion"),
  ).length;
  const worstBlunder =
    endgameMistakes.length === 0
      ? "N/A"
      : endgameMistakes.some((mistake) => mistake.cpLoss >= 99000)
        ? "Mate"
        : `-${(Math.max(...endgameMistakes.map((mistake) => mistake.cpLoss)) / 100).toFixed(1)}`;

  return (
    <div className="space-y-4">
      {endgameStats.byType.length > 0 ? (
        <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                By Type
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Ranked worst to best so you can see which endgame family is
                actually costing you the most.
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Ranked Worst to Best
            </p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {endgameStats.byType.map((entry, index) => {
              const total = endgameStats.byType.length;
              const isWeakest = index === 0;
              const isBest = index === total - 1;
              const ratio = total > 1 ? index / (total - 1) : 0.5;
              const rankColor =
                ratio >= 0.7
                  ? "text-emerald-400"
                  : ratio >= 0.3
                    ? "text-amber-400"
                    : "text-red-400";
              const borderClass = isWeakest
                ? "border-red-500/20 bg-red-500/[0.06]"
                : isBest
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : "border-white/[0.06] bg-white/[0.02]";
              const badgeBg = isWeakest
                ? "bg-red-500/15"
                : isBest
                  ? "bg-emerald-500/15"
                  : "bg-white/[0.06]";

              return (
                <div
                  key={entry.type}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all hover:border-white/[0.12] ${borderClass}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${badgeBg} ${rankColor}`}
                  >
                    #{index + 1}
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-lg">
                    {ENDGAME_TYPE_ICONS[entry.type] ?? "♔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {entry.type}
                      {isWeakest ? (
                        <span className="ml-1.5 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                          WEAKEST
                        </span>
                      ) : null}
                      {isBest ? (
                        <span className="ml-1.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          BEST
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-400">
                      {entry.count} position{entry.count !== 1 ? "s" : ""} · avg{" "}
                      <span className={rankColor}>
                        -{(entry.avgCpLoss / 100).toFixed(2)}
                      </span>{" "}
                      · {entry.mistakes} mistake
                      {entry.mistakes !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {endgameStats.weakestType ? (
        <div className="rounded-[1.25rem] border border-red-500/15 bg-red-500/[0.05] p-5">
          <p className="text-sm font-semibold text-red-300">
            Weakest area: {endgameStats.weakestType} endgames
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {ENDGAME_TYPE_NOTES[endgameStats.weakestType] ??
              "Focus on this endgame family first. It is the clearest place where technique work should improve practical results."}
          </p>
        </div>
      ) : null}

      {endgameMistakes.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Mistake rate"
            value={`${mistakeRate}%`}
            tone="amber"
          />
          <MetricCard label="Worst blunder" value={worstBlunder} tone="sky" />
          <MetricCard
            label="Failed conversions"
            value={failedConversions}
            tone="fuchsia"
          />
        </div>
      ) : null}
    </div>
  );
}

function TimeManagementCoachInsight({
  timeManagement,
}: {
  timeManagement: TimeManagementReport;
}) {
  const {
    score,
    wastedThinks,
    rushedMoves,
    justifiedThinks,
    efficientMoves,
    avgTimePerMove,
    timeScrambleCount,
    moments,
    gamesWithClockData,
  } = timeManagement;
  const total = moments.length;
  const rushRatio = total > 0 ? rushedMoves / total : 0;
  const wasteRatio = total > 0 ? wastedThinks / total : 0;

  let headline = "Room to sharpen your clock sense.";
  let headlineClass = "text-fuchsia-100";
  const lines: CoachInsightLine[] = [];

  if (score >= 75) {
    headline = "Your clock management is a weapon.";
    headlineClass = "text-emerald-200";
  } else if (
    efficientMoves >= 2 &&
    rushedMoves === 0 &&
    timeScrambleCount === 0 &&
    score >= 60
  ) {
    headline = "Your quick intuition is helping, not hurting.";
    headlineClass = "text-emerald-200";
  } else if (wasteRatio > rushRatio && wastedThinks >= 3) {
    headline = "You are overthinking quiet positions.";
  } else if (rushRatio > wasteRatio && rushedMoves >= 3) {
    headline = "Slow down. Speed is costing you.";
  } else if (score < 50) {
    headline = "Your clock is working against you.";
  }

  if (justifiedThinks >= 3) {
    lines.push({
      text: `${justifiedThinks} moments show you invested time in the right spots. That is a real strength, not hesitation.`,
      type: "positive",
    });
  }
  if (efficientMoves >= 2) {
    lines.push({
      text: `${efficientMoves} fast decisions still held move quality. That is good intuition, not careless speed.`,
      type: "positive",
    });
  }
  if (timeScrambleCount === 0 && gamesWithClockData >= 3) {
    lines.push({
      text: "You avoided time scrambles across the whole sample. That keeps your real chess available in the late game.",
      type: "positive",
    });
  }
  if (avgTimePerMove >= 8 && avgTimePerMove <= 25 && score >= 60) {
    lines.push({
      text: `Averaging ${avgTimePerMove.toFixed(1)} seconds per move is a healthy pace for stable decision-making.`,
      type: "positive",
    });
  }
  if (wastedThinks >= 3) {
    lines.push({
      text: `${wastedThinks} moments were spent overthinking non-critical positions. Trust simpler moves faster and save clock for the real decisions.`,
      type: "improve",
    });
  }
  if (rushedMoves >= 3) {
    lines.push({
      text: `${rushedMoves} complex positions were played too quickly. Those are the moves that deserve the extra 5 to 10 seconds.`,
      type: "improve",
    });
  }
  if (timeScrambleCount >= 2) {
    lines.push({
      text: `${timeScrambleCount} games ended in serious time trouble. More even clock budgeting should convert directly into better late-game accuracy.`,
      type: "improve",
    });
  }
  if (avgTimePerMove < 5 && score < 60) {
    lines.push({
      text: `Only ${avgTimePerMove.toFixed(1)} seconds per move on average is probably too fast for the complexity you are reaching.`,
      type: "improve",
    });
  }
  if (avgTimePerMove > 30) {
    lines.push({
      text: `${avgTimePerMove.toFixed(1)} seconds per move is high. Routine pattern recognition work should help you reserve time for real complications.`,
      type: "improve",
    });
  }

  return (
    <CoachInsightPanel
      headline={headline}
      headlineClass={headlineClass}
      lines={lines.slice(0, 3)}
      borderClass="border-fuchsia-500/15"
      backgroundClass="bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.10),_rgba(15,23,42,0.82)_40%,_rgba(2,6,23,0.96)_100%)]"
    />
  );
}

function orientationFromFen(fen: string): "white" | "black" {
  return fen.includes(" w ") ? "white" : "black";
}

function buildOpeningLeakCommunitySeed(
  leak: RepeatedOpeningLeak,
): CommunityPostComposerSeed {
  const openingName = leak.openingName?.trim() ?? "";

  return {
    initialKind: "position",
    initialSourceType: "analysis",
    initialFen: leak.fenBefore,
    initialTitle: openingName
      ? `What is the right move in this ${openingName}?`
      : "What would you play in this report position?",
    initialPrompt: openingName
      ? `My report flagged this ${openingName} position. What would you play here, and why?`
      : "My report flagged this position. What would you play here, and why?",
    initialOpeningName: openingName,
    initialOrientation: orientationFromFen(leak.fenBefore),
    initialPuzzleMoves: leak.bestMove ? [leak.bestMove] : [],
  };
}

function buildTacticCommunitySeed(
  tactic: MissedTactic,
): CommunityPostComposerSeed {
  const missedMate = isMissedMateTactic(tactic);

  return {
    initialKind: "position",
    initialSourceType: "analysis",
    initialFen: tactic.fenBefore,
    initialTitle: missedMate
      ? `Find the missed mate from game #${tactic.gameIndex}`
      : `Find the missed tactic from game #${tactic.gameIndex}`,
    initialPrompt: missedMate
      ? "My report says there was a forced mate here. Can you find it?"
      : "My report flagged this as a missed tactic. What is the winning line here?",
    initialOrientation: orientationFromFen(tactic.fenBefore),
    initialPuzzleMoves: tactic.bestMove ? [tactic.bestMove] : [],
  };
}

function buildEndgameCommunitySeed(
  mistake: EndgameMistake,
): CommunityPostComposerSeed {
  return {
    initialKind: "position",
    initialSourceType: "endgame-scan",
    initialFen: mistake.fenBefore,
    initialTitle: `${mistake.endgameType} endgame from game #${mistake.gameIndex}`,
    initialPrompt: `My report flagged this ${mistake.endgameType.toLowerCase()} endgame. What is the best move here?`,
    initialOrientation: orientationFromFen(mistake.fenBefore),
    initialPuzzleMoves: mistake.bestMove ? [mistake.bestMove] : [],
  };
}

function buildTimeMomentCommunitySeed(
  moment: TimeMoment,
): CommunityPostComposerSeed {
  return {
    initialKind: "position",
    initialSourceType: "analysis",
    initialFen: moment.fen,
    initialTitle: `Clock decision from game #${moment.gameIndex}, move ${moment.moveNumber}`,
    initialPrompt: `My report tagged this as a ${moment.verdict} time-management moment. What is the best move here?`,
    initialOrientation: orientationFromFen(moment.fen),
    initialPuzzleMoves: moment.bestMove ? [moment.bestMove] : [],
  };
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
  onCreateCommunityPost,
}: {
  scan: PublicScanSessionPayload;
  reportMeta: ComputedScanReport | null;
  hasProAccess?: boolean;
  scanProgress?: AnalysisProgress | null;
  onCreateCommunityPost?: (seed: CommunityPostComposerSeed) => void;
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
      endgameTechniqueScore:
        reportMeta.endgameTechniqueScore ??
        computeEndgameTechniqueScore(endgameStats),
    };
  }, [endgameStats, realLeakCount, reportMeta, result, timeManagementScore]);

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
  const followUpIssueCount =
    leaks.length + missedTactics.length + endgameMistakes.length;
  const drillsReady =
    scan.status === "ready" && followUpIssueCount > 0 && !isProcessing;
  const radarNarrative = radarData ? buildRadarNarrative(radarData) : null;

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
    leaks.length === 0 &&
    oneOffMistakes.length === 0 &&
    openingSummaries.length === 0 &&
    (scanProgress?.phase === "parse" ||
    scanProgress?.phase === "aggregate" ||
    scanProgress?.phase === "eval"
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
      : !hasReachedPhase("parse")
        ? {
            message: "Opening pass is queued",
            detail: "Starts as soon as the archive fetch finishes.",
            current: 0,
            total: scanGameTotal,
            percent: 0,
            countLabel: "games",
          }
        : null);

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

      {radarProps && radarData && radarNarrative ? (
        <div className="space-y-4">
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Strengths"
              title="What is already working"
              description="Start with the part of the report that should feel good: these are the pieces of your game already giving you something real to stand on."
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="rounded-[1.75rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_rgba(15,23,42,0.82)_38%,_rgba(2,6,23,0.96)_100%)] p-6 sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Good news first
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                  {radarNarrative.confidenceLead}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {radarNarrative.strengthNote}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {radarNarrative.topStrengths.map((dimension, index) => (
                  <StrengthSpotlightCard
                    key={dimension.dimension}
                    label={index === 0 ? "Current edge" : "Also helping"}
                    dimension={dimension}
                    accent={index === 0 ? "emerald" : "cyan"}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader
              eyebrow="Profile"
              title="Radar and coaching summary"
              description="A quick human read on where the next training gain should come from, without losing sight of what is already working."
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
              <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
                <StrengthsRadar {...radarProps} />
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Coach&apos;s note
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {radarNarrative.coachingParagraph}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
                  <div className="max-w-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Profile outline
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      Read the full profile as a quick outline: what is holding
                      up, what is dragging, and where the next training gain
                      should come from.
                    </p>
                  </div>
                  <div className="mt-5">
                    <RadarLegend data={radarData} props={radarProps} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
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
                    onCreateCommunityPost={
                      onCreateCommunityPost
                        ? () =>
                            onCreateCommunityPost(
                              buildOpeningLeakCommunitySeed(leak),
                            )
                        : undefined
                    }
                  />
                ))}
              </CardCarousel>
            </div>
          ) : openingsSectionProgress ? (
            <SectionLoadingProgress {...openingsSectionProgress} />
          ) : isProcessing && hasPassedPhase("eval") ? (
            <EmptySection message="No recurring opening leaks detected so far. The rest of the report is still processing." />
          ) : isProcessing ? (
            <SectionLoadingProgress
              message="Preparing opening report"
              detail="Collecting recurring opening leaks and expensive one-off misses."
              current={0}
              total={scanGameTotal}
              percent={0}
              countLabel="games"
            />
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
                    onCreateCommunityPost={
                      onCreateCommunityPost
                        ? () =>
                            onCreateCommunityPost(
                              buildOpeningLeakCommunitySeed(mistake),
                            )
                        : undefined
                    }
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

          <TacticalPatternAnalysis motifs={tacticalMotifs} />
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
            <TacticsCoachInsight missedTactics={missedTactics} />
          ) : null}

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
                  onCreateCommunityPost={
                    onCreateCommunityPost
                      ? () =>
                          onCreateCommunityPost(
                            buildTacticCommunitySeed(tactic),
                          )
                      : undefined
                  }
                />
              ))}
            </CardCarousel>
          ) : tacticsSectionProgress ? (
            <SectionLoadingProgress {...tacticsSectionProgress} />
          ) : isProcessing && hasPassedPhase("tactics") ? (
            <EmptySection message="No major missed tactics detected so far. The rest of the report is still processing." />
          ) : isProcessing ? (
            <SectionLoadingProgress
              message="Tactics scan is warming up"
              detail="Scanning for missed forcing lines and tactical shots."
              current={0}
              total={scanGameTotal}
              percent={0}
              countLabel="games"
            />
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

          {endgameStats ? (
            <EndgameCoachInsight
              endgameStats={endgameStats}
              endgameMistakes={endgameMistakes}
            />
          ) : null}

          {endgameStats ? (
            <EndgameTypeBreakdown
              endgameStats={endgameStats}
              endgameMistakes={endgameMistakes}
            />
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
                  onCreateCommunityPost={
                    onCreateCommunityPost
                      ? () =>
                          onCreateCommunityPost(
                            buildEndgameCommunitySeed(mistake),
                          )
                      : undefined
                  }
                />
              ))}
            </CardCarousel>
          ) : endgamesSectionProgress ? (
            <SectionLoadingProgress {...endgamesSectionProgress} />
          ) : isProcessing && hasPassedPhase("endgames") ? (
            <EmptySection message="No major endgame mistakes detected so far. The rest of the report is still processing." />
          ) : isProcessing ? (
            <SectionLoadingProgress
              message="Endgame scan is warming up"
              detail="Checking conversion and defense errors across the scanned games."
              current={0}
              total={scanGameTotal}
              percent={0}
              countLabel="games"
            />
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

          {timeManagement?.timeScrambleCount ? (
            <div className="rounded-[1.25rem] border border-red-500/15 bg-red-500/[0.05] px-4 py-3 text-sm text-red-200">
              {timeManagement.timeScrambleCount} of{" "}
              {timeManagement.gamesWithClockData} games had time scrambles. That
              usually means the late moves were played under avoidable pressure.
            </div>
          ) : null}

          {timeManagement ? (
            <TimeManagementCoachInsight timeManagement={timeManagement} />
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
                  onCreateCommunityPost={
                    onCreateCommunityPost
                      ? () =>
                          onCreateCommunityPost(
                            buildTimeMomentCommunitySeed(moment),
                          )
                      : undefined
                  }
                />
              ))}
            </CardCarousel>
          ) : timeSectionProgress ? (
            <SectionLoadingProgress {...timeSectionProgress} />
          ) : isProcessing && hasPassedPhase("time") ? (
            <EmptySection message="No notable time-management moments detected so far. The rest of the report is still processing." />
          ) : isProcessing ? (
            <SectionLoadingProgress
              message="Time-management scan is warming up"
              detail="Stitching together move times, scrambles, and rushed decisions."
              current={0}
              total={scanGameTotal}
              percent={0}
              countLabel="games"
            />
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

      {result ? (
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Training"
            title="What to do next"
            description={
              drillsReady
                ? "The scan is finished. Use the next-step CTA below to jump into drills without adding another full report block here."
                : "The report follow-up appears here early so you can see what is coming next, even while the drill handoff is still loading."
            }
          />
          <ReportFollowUpCta
            drillsReady={drillsReady}
            issueCount={followUpIssueCount}
            isProcessing={isProcessing}
          />
        </section>
      ) : null}
    </div>
  );
}
