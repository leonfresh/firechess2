"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnalysisBoardModal } from "@/components/analysis-board-modal";
import { BrilliantMoveCard } from "@/components/brilliant-move-card";
import { CardCarousel } from "@/components/card-carousel";
import type { CommunityPostComposerSeed } from "@/components/community-post-composer-modal";
import { EndgameCard } from "@/components/endgame-card";
import { MistakeCard } from "@/components/mistake-card";
import { tiltInsight } from "@/components/guided-walk/guided-walk";
import { GuidedWalk, type GuidedSaveStatus } from "@/components/guided-walk/guided-walk";
import { GuidedWalkBoard } from "@/components/guided-walk/guided-walk-board";
import { ReportViewToggle } from "@/components/guided-walk/report-view-toggle";
import { ReportEntryChoice } from "@/components/guided-walk/report-entry-choice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  MentalGameLoading,
  ScanMentalGame,
} from "@/components/scan-mental-game";
import { OpeningRankings } from "@/components/opening-rankings";
import { ScanPositionalMotifs } from "@/components/scan-positional-motifs";
import {
  RadarLegend,
  StrengthsRadar,
  buildRadarNarrative,
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
  BrilliantMove,
  EndgameStats,
  EndgameMistake,
  MentalStats,
  MissedTactic,
  PositionalFinding,
  RepeatedOpeningLeak,
  TimeManagementReport,
  TimeMoment,
} from "@/lib/types";
import {
  POSITIONAL_MOTIF_NAMES,
  buildMotifs,
  type DerivedMotif,
  type MotifExample,
} from "@/lib/build-motifs";
const FREE_SCAN_SECTION_SAMPLE = 6;
const COMPACT_REPORT_INITIAL_COUNT = 6;
const COMPACT_REPORT_LOAD_BATCH = 24;
const DEFAULT_ANALYSIS_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// ── Floating section nav ─────────────────────────────────────────────────────

type FloatingNavSection = {
  id: string;
  label: string;
  icon: string;
  count?: number;
  countColor?: string;
};

type ReportAnalysisTarget = {
  fen: string;
  orientation: "white" | "black";
  title: string;
  subtitle: string;
};

type ReportViewMode = "guided" | "full";

function FloatingSectionNav({ sections }: { sections: FloatingNavSection[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  // Show only after scrolling past the top nav bar
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (sections.length < 2) return null;

  return (
    <div
      className={`fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 transition-opacity duration-300 lg:flex ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Container pill */}
      <div className="flex flex-col gap-1 rounded-2xl border border-white/[0.08] bg-slate-950/80 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-md">
        {sections.map(({ id, label, icon, count, countColor }) => {
          const isActive = id === activeId;
          return (
            <button
              key={id}
              type="button"
              onClick={() =>
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              aria-label={`Jump to ${label}`}
              title={label}
              className={`group relative flex w-9 items-center justify-center rounded-xl border py-2 transition-all duration-200 ${
                isActive
                  ? "border-white/20 bg-white/[0.10] text-white shadow-md shadow-black/30"
                  : "border-transparent text-slate-300 hover:border-white/[0.10] hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {/* Left tooltip */}
              <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg border border-white/[0.1] bg-slate-900/95 px-2.5 py-1 text-[11px] font-semibold text-slate-200 opacity-0 shadow-xl backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
                {label}
                {count ? (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 text-[9px] font-bold ${countColor ?? "bg-white/10 text-slate-300"}`}
                  >
                    {count}
                  </span>
                ) : null}
              </span>

              <span className="text-base leading-none">{icon}</span>

              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -left-0.5 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white/50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function nextCompactRevealTarget(current: number, total: number) {
  return Math.min(total, current + COMPACT_REPORT_LOAD_BATCH);
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

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[1.25rem] border border-white/[0.07] bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-500"
            style={{ width: `${Math.min(100, (shown / total) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-300">{shown}</span> of{" "}
          <span className="font-semibold text-slate-300">{total}</span> {label}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {remaining > 0 ? (
          <button
            type="button"
            onClick={onLoadMore}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-500/25 bg-orange-500/[0.09] px-4 py-2 text-xs font-semibold text-orange-200 transition-all duration-200 hover:border-orange-400/40 hover:bg-orange-500/[0.16] hover:text-white active:scale-[0.97]"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
            {remaining <= COMPACT_REPORT_LOAD_BATCH
              ? `Show all ${remaining}`
              : `Load ${COMPACT_REPORT_LOAD_BATCH} more`}
          </button>
        ) : null}
        {shown > COMPACT_REPORT_INITIAL_COUNT ? (
          <button
            type="button"
            onClick={onShowLess}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-400 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-slate-200 active:scale-[0.97]"
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



function EmptySection({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[1.5rem] border border-emerald-500/[0.12] bg-emerald-500/[0.04] p-5 text-sm text-slate-400 sm:p-6">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/[0.15] text-xs text-emerald-400">
        ✓
      </span>
      <span className="text-slate-300">{message}</span>
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
  const hidden = total - shown;
  return (
    <div
      className="relative overflow-hidden rounded-[1.5rem] border border-amber-500/25 p-5 sm:p-6"
      style={{
        background:
          "linear-gradient(135deg, rgba(30,16,4,0.97) 0%, rgba(44,22,6,0.97) 52%, rgba(56,22,8,0.96) 100%)",
      }}
    >
      {/* top shimmer line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      {/* ambient glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/[0.07] blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          {/* lock icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/[0.12] text-xl">
            🔒
          </div>
          <div>
            <p className="font-bold text-white">
              {hidden} more {label} locked
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-amber-100/70">
              You're seeing{" "}
              <span className="font-semibold text-amber-200">{shown}</span> of{" "}
              <span className="font-semibold text-white">{total}</span> {label}.
              Pro unlocks the complete list and every future scan.
            </p>
          </div>
        </div>

        <a
          href="/pricing"
          className="btn-cta-fire inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
        >
          Unlock Pro
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
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
          detail="A personalised weekly plan is generated from your scan results and waiting on your dashboard."
          status="Ready"
          tone="emerald"
        />
        <FollowUpStatusRow
          label="Daily follow-up"
          detail="Your daily challenge is live. Short sessions tied to today's theme help reinforce what the scan found."
          status="Ready"
          tone="emerald"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {drillsReady ? (
          <Link
            href="/train"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.12] px-5 py-2.5 text-sm font-semibold text-emerald-100 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/50 hover:bg-emerald-500/[0.2] hover:text-white hover:shadow-[0_12px_32px_-12px_rgba(16,185,129,0.45)]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Open Puzzles & Drills
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-slate-400 opacity-60 cursor-not-allowed"
          >
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Drills loading...
          </button>
        )}

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/[0.10] px-5 py-2.5 text-sm font-semibold text-violet-100 shadow-[0_8px_24px_-12px_rgba(139,92,246,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/50 hover:bg-violet-500/[0.18] hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          View Study Plan
        </Link>
        <Link
          href="/daily"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.10] px-5 py-2.5 text-sm font-semibold text-cyan-100 shadow-[0_8px_24px_-12px_rgba(6,182,212,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/50 hover:bg-cyan-500/[0.18] hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Daily Challenge
        </Link>
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
  viewMode,
  onToggleView,
}: {
  eyebrow: string;
  title: string;
  description: string;
  badge?: ReactNode;
  live?: boolean;
  viewMode?: "list" | "grid";
  onToggleView?: () => void;
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

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {badge ? (
            <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1 font-medium text-slate-200">
              {badge}
            </span>
          ) : null}
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/[0.1] px-3 py-1 text-cyan-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              Live
            </span>
          ) : null}
          {onToggleView ? (
            <button
              type="button"
              onClick={onToggleView}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/[0.08] hover:text-slate-200"
              aria-label={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
            >
              {viewMode === "list" ? (
                <>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="3" width="8" height="8" rx="1" />
                    <rect x="13" y="3" width="8" height="8" rx="1" />
                    <rect x="3" y="13" width="8" height="8" rx="1" />
                    <rect x="13" y="13" width="8" height="8" rx="1" />
                  </svg>
                  Grid
                </>
              ) : (
                <>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <circle cx="3" cy="6" r="1" fill="currentColor" />
                    <circle cx="3" cy="12" r="1" fill="currentColor" />
                    <circle cx="3" cy="18" r="1" fill="currentColor" />
                  </svg>
                  List
                </>
              )}
            </button>
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
    <>
      {matesMissed > 0 ? (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-base font-black text-white shadow-lg">
            ♛
          </span>
          <div>
            <p className="text-sm font-bold text-red-300">
              {matesMissed} missed mate{matesMissed > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-slate-400">
              Forced checkmate{matesMissed > 1 ? "s were" : " was"} available but
              went unnoticed — these are the highest-impact misses.
            </p>
          </div>
        </div>
      ) : null}
      <CoachInsightPanel
        headline={headline}
        headlineClass={headlineClass}
        lines={lines.slice(0, 3)}
        borderClass="border-amber-500/15"
        backgroundClass="bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.10),_rgba(15,23,42,0.82)_40%,_rgba(2,6,23,0.96)_100%)]"
      />
    </>
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

function buildOpeningAnalysisTarget(
  leak: RepeatedOpeningLeak,
): ReportAnalysisTarget {
  return {
    fen: leak.fenBefore,
    orientation: orientationFromFen(leak.fenBefore),
    title: leak.openingName?.trim()
      ? `${leak.openingName} analysis board`
      : "Opening report position",
    subtitle:
      "Explore the full opening position, branch alternatives, and keep the report open in the background.",
  };
}

function buildTacticAnalysisTarget(tactic: MissedTactic): ReportAnalysisTarget {
  return {
    fen: tactic.fenBefore,
    orientation: orientationFromFen(tactic.fenBefore),
    title: `Missed tactic · Game ${tactic.gameIndex}`,
    subtitle: `Move ${tactic.moveNumber} · Branch the line, inspect alternatives, and replay the tactic cleanly.`,
  };
}

function buildEndgameAnalysisTarget(
  mistake: EndgameMistake,
): ReportAnalysisTarget {
  return {
    fen: mistake.fenBefore,
    orientation: orientationFromFen(mistake.fenBefore),
    title: `${mistake.endgameType} endgame analysis`,
    subtitle: `Game ${mistake.gameIndex} · Move ${mistake.moveNumber} · Explore the technique from this exact position.`,
  };
}

function buildTimeAnalysisTarget(moment: TimeMoment): ReportAnalysisTarget {
  return {
    fen: moment.fen,
    orientation: orientationFromFen(moment.fen),
    title: `${moment.verdict} clock moment`,
    subtitle: `Game ${moment.gameIndex} · Move ${moment.moveNumber} · Inspect the move and clock decision on a clean board.`,
  };
}

function buildBrilliantAnalysisTarget(
  move: BrilliantMove,
): ReportAnalysisTarget {
  return {
    fen: move.fenBefore,
    orientation: orientationFromFen(move.fenBefore),
    title: `Brilliant move · Game ${move.gameIndex}`,
    subtitle: `Move ${move.moveNumber} · Replay the shot, test alternatives, and inspect the engine line without leaving the report.`,
  };
}

export function ScanSessionReport({
  scan,
  reportMeta,
  hasProAccess = false,
  scanProgress = null,
  perPhaseProgress,
  guidedLaunchSignal = 0,
  onCreateCommunityPost,
  onSave,
  saveStatus,
  authenticated,
}: {
  scan: PublicScanSessionPayload;
  reportMeta: ComputedScanReport | null;
  hasProAccess?: boolean;
  scanProgress?: AnalysisProgress | null;
  perPhaseProgress?: Partial<
    Record<AnalysisProgress["phase"], AnalysisProgress>
  >;
  /** Bumped by the parent to request a switch into guided mode (e.g. from the
   *  scan-complete modal). */
  guidedLaunchSignal?: number;
  onCreateCommunityPost?: (seed: CommunityPostComposerSeed) => void;
  /** Save-to-profile handler — threaded down to the GuidedWalk's final-step
   *  prompt. When omitted, no prompt is shown. The parent (scan-session-page)
   *  owns the real save logic. */
  onSave?: () => void;
  /** Save progress, mirrored from the parent. */
  saveStatus?: GuidedSaveStatus;
  /** Whether the user is signed in — flips the prompt copy for guests. */
  authenticated?: boolean;
}) {
  const result = scan.result;
  const isProcessing = scan.status === "processing";

  const leaks = result?.leaks ?? [];
  const oneOffMistakes = result?.oneOffMistakes ?? [];
  const missedTactics = result?.missedTactics ?? [];
  const endgameMistakes = result?.endgameMistakes ?? [];
  const brilliantMoves = result?.brilliantMoves ?? [];
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

  // ── Chart data for Performance Overview ──
  const categoryData = useMemo(() => {
    const openingCp = leaks.reduce((s, l) => s + l.cpLoss, 0) +
      oneOffMistakes.reduce((s, m) => s + m.cpLoss, 0);
    const tacticCp = missedTactics.reduce((s, t) => s + t.cpLoss, 0);
    const endgameCp = endgameMistakes.reduce((s, e) => s + e.cpLoss, 0);
    const positionalCp = positionalFindings.reduce((s, p) => s + p.cpLoss, 0);
    return [
      { name: "Openings", count: leaks.length + oneOffMistakes.length, cpLoss: openingCp, fill: "#f59e0b" },
      { name: "Tactics", count: missedTactics.length, cpLoss: tacticCp, fill: "#ef4444" },
      { name: "Endgames", count: endgameMistakes.length, cpLoss: endgameCp, fill: "#8b5cf6" },
      { name: "Positional", count: positionalFindings.length, cpLoss: positionalCp, fill: "#06b6d4" },
    ].filter((d) => d.count > 0);
  }, [leaks, oneOffMistakes, missedTactics, endgameMistakes, positionalFindings]);

  const phaseData = useMemo(() => {
    const midgameTactics = missedTactics.filter(
      (t) => !t.moveNumber || t.moveNumber <= 35,
    );
    const endgameTactics = missedTactics.filter(
      (t) => t.moveNumber && t.moveNumber > 35,
    );
    return [
      {
        name: "Opening",
        cpLoss: leaks.reduce((s, l) => s + l.cpLoss, 0) +
          oneOffMistakes.reduce((s, m) => s + m.cpLoss, 0),
        fill: "#22c55e",
      },
      {
        name: "Middlegame",
        cpLoss: midgameTactics.reduce((s, t) => s + t.cpLoss, 0) +
          positionalFindings.reduce((s, p) => s + p.cpLoss, 0),
        fill: "#f59e0b",
      },
      {
        name: "Endgame",
        cpLoss: endgameMistakes.reduce((s, e) => s + e.cpLoss, 0) +
          endgameTactics.reduce((s, t) => s + t.cpLoss, 0),
        fill: "#ef4444",
      },
    ];
  }, [leaks, oneOffMistakes, missedTactics, endgameMistakes, positionalFindings]);

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
  const accessibleBrilliants = hasProAccess
    ? brilliantMoves
    : brilliantMoves.slice(0, FREE_SCAN_SECTION_SAMPLE);
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
  const brilliantReveal = useCompactSectionReveal(
    accessibleBrilliants.length,
    `${scan.id}:brilliant`,
  );
  const timeReveal = useCompactSectionReveal(
    accessibleMoments.length,
    `${scan.id}:time`,
  );
  const [analysisTarget, setAnalysisTarget] =
    useState<ReportAnalysisTarget | null>(null);

  const [sectionViewModes, setSectionViewModes] = useState<
    Record<string, "list" | "grid">
  >({});
  const [reportViewMode, setReportViewMode] = useState<ReportViewMode>(
    // Full report while scanning; guided tour offered via modal when ready.
    "full",
  );
  const getSV = (id: string): "list" | "grid" => sectionViewModes[id] ?? "list";
  const toggleSV = (id: string) =>
    setSectionViewModes((p) => ({
      ...p,
      [id]: (p[id] ?? "list") === "list" ? "grid" : "list",
    }));
  const changeReportViewMode = (mode: ReportViewMode) => {
    setReportViewMode(mode);
  };

  // Parent (scan-complete modal) can request the guided walkthrough by bumping
  // the signal. Ignore the initial 0 so it doesn't fire on mount.
  useEffect(() => {
    if (guidedLaunchSignal > 0) {
      setReportViewMode("guided");
    }
  }, [guidedLaunchSignal]);

  // ── Entry choice prompt ──
  // Once the scan completes, ask guided vs full. Fresh scans show the
  // scan-complete modal instead, so this only fires for reports already ready.
  const entryChoiceKey = `firechess-report-entry-choice:${scan.id}`;
  const shouldPromptEntry =
    typeof window !== "undefined" &&
    window.localStorage.getItem(entryChoiceKey) !== "dismissed";
  const [showEntryChoice, setShowEntryChoice] = useState(
    scan.status === "ready" &&
      Boolean(scan.result) &&
      guidedLaunchSignal === 0 &&
      shouldPromptEntry,
  );
  const dismissEntryChoice = (mode: ReportViewMode) => {
    setShowEntryChoice(false);
    changeReportViewMode(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(entryChoiceKey, "dismissed");
    }
  };

  const visibleLeaks = accessibleLeaks.slice(0, leakReveal.shownCount);
  const visibleOneOffMistakes = accessibleOneOffMistakes.slice(
    0,
    oneOffReveal.shownCount,
  );
  const visibleTactics = accessibleTactics.slice(0, tacticReveal.shownCount);
  const visibleEndgames = accessibleEndgames.slice(0, endgameReveal.shownCount);
  const visibleBrilliantMoves = accessibleBrilliants.slice(
    0,
    brilliantReveal.shownCount,
  );
  const visibleMoments = accessibleMoments.slice(0, timeReveal.shownCount);
  const hiddenTacticsCount = Math.max(
    0,
    missedTactics.length - accessibleTactics.length,
  );
  const hiddenEndgamesCount = Math.max(
    0,
    endgameMistakes.length - accessibleEndgames.length,
  );
  const hiddenBrilliantMovesCount = Math.max(
    0,
    brilliantMoves.length - accessibleBrilliants.length,
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

  const showBrilliants =
    scan.scanMode !== "time-management" &&
    ((result?.reportVersion ?? 0) >= 2 || brilliantMoves.length > 0);
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
    currentPhaseRank >= phaseOrder[phase] || Boolean(perPhaseProgress?.[phase]);
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
    (() => {
      const p =
        perPhaseProgress?.["eval"] ??
        perPhaseProgress?.["aggregate"] ??
        perPhaseProgress?.["parse"] ??
        (scanProgress?.phase === "parse" ||
        scanProgress?.phase === "aggregate" ||
        scanProgress?.phase === "eval"
          ? scanProgress
          : null);
      if (p)
        return {
          message: p.message,
          detail:
            p.detail ??
            "Walking your archive and scoring recurring opening positions.",
          current: p.current,
          total: p.total,
          percent: p.percent,
          countLabel:
            p.phase === "eval" || p.phase === "aggregate"
              ? "positions"
              : "games",
        };
      if (!hasReachedPhase("parse"))
        return {
          message: "Opening pass is queued",
          detail: "Starts as soon as the archive fetch finishes.",
          current: 0,
          total: scanGameTotal,
          percent: 0,
          countLabel: "games",
        };
      return null;
    })();

  const tacticsSectionProgress =
    isProcessing &&
    missedTactics.length === 0 &&
    (() => {
      const p =
        perPhaseProgress?.["tactics"] ??
        (scanProgress?.phase === "tactics" ? scanProgress : null);
      if (p)
        return {
          message: p.message,
          detail: p.detail ?? "Scanning the archive for missed forcing lines.",
          current: p.current ?? 0,
          total: p.total ?? scanGameTotal,
          percent: p.percent,
          countLabel: "games",
        };
      if (!hasReachedPhase("tactics"))
        return {
          message: "Tactics queue is ready",
          detail: "Starts automatically after the opening pass finishes.",
          current: 0,
          total: scanGameTotal,
          percent: 0,
          countLabel: "games",
        };
      return null;
    })();

  const endgamesSectionProgress =
    isProcessing &&
    endgameMistakes.length === 0 &&
    !endgameStats &&
    (() => {
      const p =
        perPhaseProgress?.["endgames"] ??
        (scanProgress?.phase === "endgames" ? scanProgress : null);
      if (p)
        return {
          message: p.message,
          detail:
            p.detail ??
            "Checking conversion and defense errors across your archive.",
          current: p.current ?? 0,
          total: p.total ?? scanGameTotal,
          percent: p.percent,
          countLabel: "games",
        };
      if (!hasReachedPhase("endgames"))
        return {
          message: "Endgame pass is queued",
          detail: "Starts after tactics finishes.",
          current: 0,
          total: scanGameTotal,
          percent: 0,
          countLabel: "games",
        };
      return null;
    })();

  const timeSectionProgress =
    isProcessing &&
    !timeManagement &&
    (() => {
      const p =
        perPhaseProgress?.["time"] ??
        (scanProgress?.phase === "time" ? scanProgress : null);
      if (p)
        return {
          message: p.message,
          detail:
            p.detail ?? "Checking clocks, scrambles, and rushed decisions.",
          current: p.current ?? 0,
          total: p.total ?? scanGameTotal,
          percent: p.percent,
          countLabel: "games",
        };
      if (!hasReachedPhase("time"))
        return {
          message: "Time-management pass is queued",
          detail: "Starts after the endgame pass completes.",
          current: 0,
          total: scanGameTotal,
          percent: 0,
          countLabel: "games",
        };
      return null;
    })();

  const floatingNavSections: FloatingNavSection[] = [
    categoryData.length > 0 && {
      id: "section-overview",
      label: "Overview",
      icon: "📊",
    },
    showBrilliants && {
      id: "section-brilliant",
      label: "Brilliant",
      icon: "💎",
      count: brilliantMoves.length || undefined,
      countColor: "bg-cyan-500/20 text-cyan-300",
    },
    showOpenings && {
      id: "section-openings",
      label: "Openings",
      icon: "📚",
      count: leaks.length || undefined,
      countColor: "bg-cyan-500/20 text-cyan-300",
    },
    showTactics && {
      id: "section-tactics",
      label: "Tactics",
      icon: "⚔️",
      count: missedTactics.length || undefined,
      countColor: "bg-amber-500/20 text-amber-300",
    },
    showEndgames && {
      id: "section-endgames",
      label: "Endgames",
      icon: "♟",
      count: endgameMistakes.length || undefined,
      countColor: "bg-sky-500/20 text-sky-300",
    },
    showTimeManagement && {
      id: "section-time",
      label: "Time",
      icon: "⏱️",
      count: timeMoments.length || undefined,
      countColor: "bg-fuchsia-500/20 text-fuchsia-300",
    },
    positionalMotifs.length > 0 && {
      id: "section-positional",
      label: "Positional",
      icon: "🏛️",
      count: positionalMotifs.length || undefined,
      countColor: "bg-violet-500/20 text-violet-300",
    },
    !!result && {
      id: "section-training",
      label: "Drills",
      icon: "🎯",
    },
  ].filter(Boolean) as FloatingNavSection[];
  return (
    <>
      <ReportEntryChoice
        open={showEntryChoice}
        onChoose={dismissEntryChoice}
      />
      {reportViewMode === "full" ? (
        <FloatingSectionNav sections={floatingNavSections} />
      ) : null}

      {/* ── Sticky view toggle (Guided / Full) — always present ── */}
      <ReportViewToggle
        viewMode={reportViewMode}
        onChange={(mode) => {
          if (mode === "guided") {
            // Re-entering guided scrolls back to the top so the walkthrough
            // starts fresh.
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          changeReportViewMode(mode);
        }}
        disabled={isProcessing}
      />

      {/* ── Guided walkthrough (Brilliant-style, full-viewport takeover) ──
          Immersive full-screen sequence: headline → radar → top leak →
          tactic → brilliant → endgame → profile → plan, then hands off to
          the full report via the sticky toggle. Renders in a portal over the
          page body, so the mt-6 wrapper below is just a render anchor. */}
      {reportViewMode === "guided" && reportMeta ? (
        <div className="mt-6">
          <GuidedWalk
            report={reportMeta}
            vibeTitle={reportMeta.vibeTitle}
            gamesAnalyzed={result.gamesAnalyzed || scan.config.maxGames}
            source={scan.config.source}
            leaks={leaks}
            oneOffMistakes={oneOffMistakes}
            positionTraces={result.diagnostics?.positionTraces ?? []}
            missedTactics={accessibleTactics}
            positionalFindings={positionalFindings}
            endgameMistakes={accessibleEndgames}
            mentalStats={mentalStats}
            username={scan.chessUsername}
            radarProps={radarProps}
            brilliantMoves={accessibleBrilliants}
            onSave={onSave}
            saveStatus={saveStatus}
            authenticated={authenticated}
            onFinish={() => changeReportViewMode("full")}
          />
        </div>
      ) : null}

      {reportViewMode === "full" ? (
      <div className="mt-6 space-y-6">


        {showOpenings ||
        showTactics ||
        showEndgames ||
        showBrilliants ||
        showTimeManagement ? (
          <nav
            aria-label="Report sections"
            className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
          >
            {showBrilliants ? (
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("section-brilliant")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white"
              >
                💎 Brilliant
                {brilliantMoves.length > 0 ? (
                  <span className="rounded-full bg-cyan-500/20 px-1.5 text-[10px] font-bold text-cyan-300">
                    {brilliantMoves.length}
                  </span>
                ) : null}
              </button>
            ) : null}
            {showOpenings ? (
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("section-openings")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white"
              >
                📚 Openings
                {leaks.length > 0 ? (
                  <span className="rounded-full bg-cyan-500/20 px-1.5 text-[10px] font-bold text-cyan-300">
                    {leaks.length}
                  </span>
                ) : null}
              </button>
            ) : null}
            {showTactics ? (
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("section-tactics")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white"
              >
                ⚔️ Tactics
                {missedTactics.length > 0 ? (
                  <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] font-bold text-amber-300">
                    {missedTactics.length}
                  </span>
                ) : null}
              </button>
            ) : null}
            {showEndgames ? (
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("section-endgames")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white"
              >
                ♟ Endgames
                {endgameMistakes.length > 0 ? (
                  <span className="rounded-full bg-sky-500/20 px-1.5 text-[10px] font-bold text-sky-300">
                    {endgameMistakes.length}
                  </span>
                ) : null}
              </button>
            ) : null}
            {showTimeManagement ? (
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("section-time")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white"
              >
                ⏱️ Time
                {timeMoments.length > 0 ? (
                  <span className="rounded-full bg-fuchsia-500/20 px-1.5 text-[10px] font-bold text-fuchsia-300">
                    {timeMoments.length}
                  </span>
                ) : null}
              </button>
            ) : null}
          </nav>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            label="Games analyzed"
            value={result.gamesAnalyzed || scan.config.maxGames}
            hint={isProcessing ? "Updating live" : undefined}
          />
          {!isProcessing && result.games && result.games.length > 0 ? (
            <Link
              href={`/best-game/${scan.id}`}
              className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.03] p-4 transition hover:border-amber-500/30 hover:from-amber-500/[0.10] hover:to-orange-500/[0.06]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
                Best Game
              </p>
              <p className="mt-1 text-sm font-bold text-amber-200 group-hover:text-amber-100">
                View your best performance →
              </p>
              <div className="absolute -bottom-2 -right-2 text-3xl opacity-10">🏆</div>
            </Link>
          ) : null}
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
                {reportMeta.reportSummary
                  ? reportMeta.reportSummary
                  : reportMeta.topTag === "No big leak pattern"
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
                        Read the full profile as a quick outline: what is
                        holding up, what is dragging, and where the next
                        training gain should come from.
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

        {/* ── Performance Overview ── */}
        {categoryData.length > 0 && (
          <section id="section-overview" className="space-y-4">
            <SectionHeader
              eyebrow="At a glance"
              title="Performance overview"
              description="Where your mistakes landed and how much each phase cost you."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Mistakes by category */}
              <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Mistakes by category
                </h3>
                <p className="mb-4 text-[11px] text-slate-600">
                  Count of errors detected per area
                </p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15,23,42,0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
                        formatter={(value) => [value ?? 0, "Mistakes"]}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="top"
                          fill="#94a3b8"
                          fontSize={11}
                          fontWeight={700}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CP loss by game phase */}
              <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  CP loss by game phase
                </h3>
                <p className="mb-4 text-[11px] text-slate-600">
                  Total centipawns lost per phase of the game
                </p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={phaseData} margin={{ left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15,23,42,0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
                        formatter={(value) => [value != null ? `${value.toLocaleString()}cp` : "0cp", "Total cp loss"]}
                      />
                      <Bar dataKey="cpLoss" radius={[4, 4, 0, 0]} maxBarSize={48}>
                        {phaseData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                        <LabelList
                          dataKey="cpLoss"
                          position="top"
                          fill="#94a3b8"
                          fontSize={11}
                          fontWeight={700}
                          formatter={(value) => value != null ? `${value.toLocaleString()}cp` : "0cp"}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}

        {showBrilliants ? (
          <section id="section-brilliant" className="space-y-4">
            <SectionHeader
              eyebrow="Highlights"
              title="Brilliant moves"
              description={
                isProcessing
                  ? "Sacrifices and engine-approved shots are compiled near the end of the scan."
                  : "Every brilliant move the scan found, with free members seeing the first six and Pro unlocking the full set."
              }
              badge={formatCompactBadge({
                shown: visibleBrilliantMoves.length,
                available: accessibleBrilliants.length,
                total: brilliantMoves.length,
                singular: "brilliant move",
                plural: "brilliant moves",
              })}
              live={isProcessing}
              viewMode={getSV("brilliant")}
              onToggleView={() => toggleSV("brilliant")}
            />

            {visibleBrilliantMoves.length > 0 ? (
              <CardCarousel
                viewMode={getSV("brilliant")}
                footer={
                  <CompactCardFooter
                    shown={visibleBrilliantMoves.length}
                    total={accessibleBrilliants.length}
                    label="brilliant moves"
                    onLoadMore={brilliantReveal.loadMore}
                    onShowLess={brilliantReveal.showLess}
                  />
                }
              >
                {visibleBrilliantMoves.map((move) => (
                  <BrilliantMoveCard
                    key={`${move.gameIndex}-${move.moveNumber}-${move.userMove}`}
                    move={move}
                    onOpenAnalysis={() =>
                      setAnalysisTarget(buildBrilliantAnalysisTarget(move))
                    }
                  />
                ))}
              </CardCarousel>
            ) : isProcessing ? (
              <SectionLoadingProgress
                message="Brilliant-move highlights are compiling"
                detail="Checking for best-move sacrifices and other standout tactical shots."
                current={0}
                total={scanGameTotal}
                percent={0}
                countLabel="games"
              />
            ) : (
              <EmptySection message="No brilliant moves were detected in this scan." />
            )}

            {!isProcessing && hiddenBrilliantMovesCount > 0 ? (
              <ProSectionLimitNotice
                label="brilliant moves"
                shown={accessibleBrilliants.length}
                total={brilliantMoves.length}
              />
            ) : null}
          </section>
        ) : null}

        {showOpenings ? (
          <section id="section-openings" className="space-y-4">
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
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-white">
                      Recurring opening leaks
                    </h3>
                    <button
                      type="button"
                      onClick={() => toggleSV("leaks")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/[0.08] hover:text-slate-200"
                    >
                      {getSV("leaks") === "list" ? "Grid" : "List"}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Positions you keep reaching and misplaying often enough to
                    become a real pattern in your repertoire.
                  </p>
                </div>

                <CardCarousel
                  viewMode={getSV("leaks")}
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
                      onOpenAnalysis={() =>
                        setAnalysisTarget(buildOpeningAnalysisTarget(leak))
                      }
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
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-white">
                      Sharp one-off misses
                    </h3>
                    <button
                      type="button"
                      onClick={() => toggleSV("one-offs")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/[0.08] hover:text-slate-200"
                    >
                      {getSV("one-offs") === "list" ? "Grid" : "List"}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Positions that did not repeat often enough to become leaks,
                    but were still expensive.
                  </p>
                </div>

                <CardCarousel
                  viewMode={getSV("one-offs")}
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
                      onOpenAnalysis={() =>
                        setAnalysisTarget(buildOpeningAnalysisTarget(mistake))
                      }
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
          <section id="section-tactics" className="space-y-4">
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
              viewMode={getSV("tactics")}
              onToggleView={() => toggleSV("tactics")}
            />

            {missedTactics.length > 0 ? (
              <TacticsCoachInsight missedTactics={missedTactics} />
            ) : null}

            {missedTactics.length > 0 ? (
              <CardCarousel
                viewMode={getSV("tactics")}
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
                    onOpenAnalysis={() =>
                      setAnalysisTarget(buildTacticAnalysisTarget(tactic))
                    }
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
          <section id="section-endgames" className="space-y-4">
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
              viewMode={getSV("endgames")}
              onToggleView={() => toggleSV("endgames")}
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
                viewMode={getSV("endgames")}
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
                    onOpenAnalysis={() =>
                      setAnalysisTarget(buildEndgameAnalysisTarget(mistake))
                    }
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
          <section id="section-time" className="space-y-4">
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
              viewMode={getSV("time")}
              onToggleView={() => toggleSV("time")}
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
                {timeManagement.gamesWithClockData} games had time scrambles.
                That usually means the late moves were played under avoidable
                pressure.
              </div>
            ) : null}

            {timeManagement ? (
              <TimeManagementCoachInsight timeManagement={timeManagement} />
            ) : null}

            {visibleMoments.length > 0 ? (
              <CardCarousel
                viewMode={getSV("time")}
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
                    onOpenAnalysis={() =>
                      setAnalysisTarget(buildTimeAnalysisTarget(moment))
                    }
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
          <ScanMentalGame
            mentalStats={mentalStats}
            hasProAccess={hasProAccess}
          />
        ) : isProcessing ? (
          <MentalGameLoading />
        ) : null}

        {positionalMotifs.length > 0 ? (
          <section id="section-positional" className="space-y-4">
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
          <section id="section-training" className="space-y-4">
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
      ) : null}
      <AnalysisBoardModal
        open={Boolean(analysisTarget)}
        onClose={() => setAnalysisTarget(null)}
        fen={analysisTarget?.fen ?? DEFAULT_ANALYSIS_FEN}
        orientation={analysisTarget?.orientation ?? "white"}
        title={analysisTarget?.title}
        subtitle={analysisTarget?.subtitle}
      />
    </>
  );
}
