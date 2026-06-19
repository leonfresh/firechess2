"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Gauge,
  Lightbulb,
  ListChecks,
  X,
} from "lucide-react";
import { GuidedWalkBoard } from "@/components/guided-walk/guided-walk-board";
import type {
  AnalysisReport,
  EndgameMistake,
  MentalStats,
  MissedTactic,
  PositionEvalTrace,
  RepeatedOpeningLeak,
} from "@/lib/types";

/* ────────────────────────────────────────────────────────────────────────
 * GuidedWalk
 *
 * A Brilliant-style, one-card-at-a-time presenter layered over the existing
 * report data. It does NOT recompute anything — it sequences the user through
 * their findings, then graduates to the full report via onFinish().
 *
 * 4 lean steps (v1):
 *   0. Headline   — accuracy snapshot + the one-line verdict
 *   1. Top leak   — biggest repeated opening mistake + a mini-drill
 *   2. A tactic   — one missed tactic as a solve/reveal micro-interaction
 *   3. The plan   — top 3 things to drill this week, then "see full report"
 *
 * The full report is rendered separately (untouched) by the page once the
 * user finishes or skips.
 * ──────────────────────────────────────────────────────────────────────── */

export type GuidedWalkProps = {
  /** Aggregate report card (accuracy, rating, leak rate). */
  report: AnalysisReport;
  /** Vibe title from the report card, e.g. "Solid but slow". */
  vibeTitle?: string;
  /** Games analyzed in this scan. */
  gamesAnalyzed: number;
  /** Repeated opening leaks, sorted by impact downstream. */
  leaks: RepeatedOpeningLeak[];
  /** One-off opening mistakes. */
  oneOffMistakes: RepeatedOpeningLeak[];
  /** Position traces for the drill engine. */
  positionTraces: PositionEvalTrace[];
  /** Missed tactics for step 2 + the drill. */
  missedTactics: MissedTactic[];
  /** Endgame mistakes (used by the drill engine if present). */
  endgameMistakes?: EndgameMistake[];
  /** FENs to exclude from drilling (DB-approved inaccuracies). */
  excludeFens?: Set<string>;
  /** Mental/tilt stats — for a one-line insight in the plan step. */
  mentalStats?: MentalStats | null;
  /** Username, for copy. */
  username: string;
  /** Called when the user finishes or skips → page flips to full view. */
  onFinish: () => void;
};

export function GuidedWalk(props: GuidedWalkProps) {
  const [step, setStep] = useState(0);

  // Pick the single highest-impact leak for step 1.
  const topLeak = useMemo(() => {
    return [...props.leaks]
      .map((l) => ({ leak: l, impact: (l.cpLoss ?? 0) * (l.reachCount ?? 1) }))
      .sort((a, b) => b.impact - a.impact)[0]?.leak ?? null;
  }, [props.leaks]);

  // Pick one missed tactic (prefer one with a mate or big swing).
  const topTactic = useMemo(() => {
    if (props.missedTactics.length === 0) return null;
    return [...props.missedTactics].sort((a, b) => {
      const aScore = (a.mateIn ?? 0) * 1000 + (a.cpAfter ?? 0);
      const bScore = (b.mateIn ?? 0) * 1000 + (b.cpAfter ?? 0);
      return bScore - aScore;
    })[0];
  }, [props.missedTactics]);

  // Top 3 items for the weekly plan.
  const planItems = useMemo(() => {
    const items: { label: string; tag: string }[] = [];
    for (const l of props.leaks.slice(0, 2)) {
      items.push({
        label: l.openingName ?? "A recurring opening position",
        tag: "Opening",
      });
    }
    if (topTactic) {
      items.push({
        label: topTactic.mateIn
          ? `Find mate in ${topTactic.mateIn}`
          : "Spot winning tactics",
        tag: "Tactics",
      });
    }
    if (items.length === 0 && props.oneOffMistakes[0]) {
      items.push({
        label: "Review your one-off opening blunders",
        tag: "Openings",
      });
    }
    return items.slice(0, 3);
  }, [props.leaks, props.oneOffMistakes, topTactic]);

  const totalSteps = 4;
  const isLast = step === totalSteps - 1;

  const next = () => (isLast ? props.onFinish() : setStep((s) => s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="animate-fade-in-up">
      <div
        className="relative flex min-h-[34rem] flex-col rounded-[2rem] border border-white/[0.06] p-5 shadow-[0_40px_120px_-64px_rgba(20,8,5,0.95)] sm:p-7 lg:p-9"
        style={{
          background:
            "linear-gradient(150deg, rgba(10,9,13,0.97) 0%, rgba(19,13,16,0.96) 50%, rgba(46,24,14,0.94) 100%)",
        }}
      >
        {/* Top bar: progress + skip */}
        <div className="flex shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-7 bg-orange-400"
                    : i < step
                      ? "w-3 bg-orange-400/60"
                      : "w-3 bg-white/15"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={props.onFinish}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-white"
          >
            Skip walkthrough
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Step body — sized to its content so nothing scrolls inside the card. */}
        <div className="mt-7 flex-1">
          {step === 0 && (
            <HeadlineStep
              report={props.report}
              vibeTitle={props.vibeTitle}
              gamesAnalyzed={props.gamesAnalyzed}
              username={props.username}
            />
          )}
          {step === 1 && (
            <TopLeakStep leak={topLeak} hasNoLeaks={props.leaks.length === 0} />
          )}
          {step === 2 && (
            <TacticStep
              tactic={topTactic}
              hasNoTactics={props.missedTactics.length === 0}
            />
          )}
          {step === 3 && (
            <PlanStep
              planItems={planItems}
              mentalStats={props.mentalStats}
              username={props.username}
            />
          )}
        </div>

        {/* Bottom nav — pinned to the card bottom, never moves */}
        <div className="mt-7 flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-xs font-medium text-slate-600">
            {step + 1} / {totalSteps}
          </span>
          <button
            type="button"
            onClick={next}
            className="btn-cta-fire group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            {isLast ? (
              <>
                See full report
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Step 0: Headline ──────────────────────────────────────────────────── */

function HeadlineStep({
  report,
  vibeTitle,
  gamesAnalyzed,
  username,
}: {
  report: AnalysisReport;
  vibeTitle?: string;
  gamesAnalyzed: number;
  username: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/[0.07] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.28em] text-emerald-200/70">
        <Gauge className="h-3 w-3" />
        Scan complete · {gamesAnalyzed} games
      </span>
      <h2 className="mt-5 text-3xl font-black leading-tight text-white sm:text-4xl">
        Here&apos;s the one thing
        <br />
        <span className="bg-gradient-to-r from-amber-200 via-orange-300 to-red-400 bg-clip-text text-transparent">
          costing you the most rating
        </span>
      </h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
        We compared every move in {username}&apos;s games against Stockfish 18.
        Here&apos;s what matters most — then we&apos;ll walk you through it.
      </p>

      <div className="mt-7 grid w-full max-w-md grid-cols-2 gap-3">
        <Stat
          label="Accuracy"
          value={`${report.estimatedAccuracy.toFixed(1)}%`}
          color="text-emerald-400"
        />
        <Stat
          label="Est. Rating"
          value={report.estimatedRating.toString()}
          color="text-cyan-400"
        />
        <Stat
          label="Avg eval loss"
          value={(report.weightedCpLoss / 100).toFixed(2)}
          color="text-amber-400"
        />
        <Stat
          label="Leak rate"
          value={`${(report.severeLeakRate * 100).toFixed(0)}%`}
          color="text-red-400"
        />
      </div>

      {vibeTitle && (
        <p className="mt-5 text-sm italic text-slate-500">
          Verdict: {vibeTitle}
        </p>
      )}
    </div>
  );
}

/* ── Step 1: Top leak ──────────────────────────────────────────────────── */

function TopLeakStep({
  leak,
  hasNoLeaks,
}: {
  leak: RepeatedOpeningLeak | null;
  hasNoLeaks: boolean;
}) {
  if (hasNoLeaks || !leak) {
    return (
      <EmptyStep
        icon={<Lightbulb className="h-7 w-7 text-emerald-400" />}
        title="No repeated opening leaks"
        text="Your opening play didn't show a single position you keep getting wrong. That's genuinely rare — nice work on the openings."
      />
    );
  }
  return (
    <div>
      <StepHeader
        eyebrow="Your biggest opening leak"
        title={leak.openingName ?? "A recurring position"}
        icon={<Crosshair className="h-4 w-4" />}
        tone="orange"
      />
      <div className="mt-4 grid items-start gap-5 lg:grid-cols-2">
        {/* The position, with your move (red) vs the best move (green) */}
        <GuidedWalkBoard
          fen={leak.fenBefore}
          userMove={leak.userMove}
          bestMove={leak.bestMove}
          userColor={leak.userColor}
          mode="static"
        />
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-sm leading-relaxed text-slate-300">
              You played{" "}
              <span className="font-bold text-white">{leak.userMove}</span>{" "}
              {leak.bestMove && (
                <>
                  instead of{" "}
                  <span className="font-bold text-emerald-400">
                    {leak.bestMove}
                  </span>
                </>
              )}
              .
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MiniStat
                label="Recurred"
                value={`${leak.reachCount ?? 1}×`}
              />
              <MiniStat
                label="Cost / time"
                value={`${(leak.cpLoss ?? 0).toFixed(0)}cp`}
                tone="warn"
              />
              <MiniStat
                label="Your record"
                value={`${leak.userWins ?? 0}-${leak.userDraws ?? 0}-${leak.userLosses ?? 0}`}
                tone={
                  (leak.userLosses ?? 0) > (leak.userWins ?? 0)
                    ? "bad"
                    : "neutral"
                }
              />
            </div>
          </div>
          <div className="rounded-xl border border-orange-500/15 bg-orange-500/[0.04] p-4">
            <p className="text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-orange-300">Why it matters:</span>{" "}
              A leak that shows up in {leak.reachCount ?? 1} of your games is a
              habit, not a blunder. Fix this one position and you fix it every
              time you reach it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 2: A tactic ──────────────────────────────────────────────────── */

function TacticStep({
  tactic,
  hasNoTactics,
}: {
  tactic: MissedTactic | null;
  hasNoTactics: boolean;
}) {
  if (hasNoTactics || !tactic) {
    return (
      <EmptyStep
        icon={<Lightbulb className="h-7 w-7 text-emerald-400" />}
        title="No missed tactics detected"
        text="The engine didn't find a forced tactic you let slip. Either you're sharp, or this scan didn't cover tactics — try a 'tactics' scan to be sure."
      />
    );
  }
  return (
    <div>
      <StepHeader
        eyebrow={tactic.mateIn ? `You missed mate in ${tactic.mateIn}` : "A tactic you missed"}
        title={tactic.mateIn ? "There was a forced mate" : "There was a winning shot"}
        icon={<Crosshair className="h-4 w-4" />}
        tone="orange"
      />
      <div className="mt-4 grid items-start gap-5 lg:grid-cols-2">
        <GuidedWalkBoard
          fen={tactic.fenBefore}
          bestMove={tactic.bestMove}
          userColor={tactic.userColor}
          mode="interactive"
        />
        <div className="space-y-4 lg:pt-1">
          <p className="text-sm leading-relaxed text-slate-400">
            Drag the best move onto the board — instant feedback. This is the kind
            of pattern that, once you see it, you stop losing to.
          </p>
          <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.04] p-4">
            <p className="text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-cyan-300">Tip:</span>{" "}
              {tactic.mateIn
                ? `Forced mate in ${tactic.mateIn} — look for forcing checks and captures that narrow the king's escape squares.`
                : "Tactics like this come from undefended pieces, overloaded defenders, or a sudden attack on the king. Train the pattern, not the position."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 3: The plan ──────────────────────────────────────────────────── */

function PlanStep({
  planItems,
  mentalStats,
  username,
}: {
  planItems: { label: string; tag: string }[];
  mentalStats?: MentalStats | null;
  username: string;
}) {
  return (
    <div>
      <StepHeader
        eyebrow="Your drill plan for this week"
        title="Three things to fix"
        icon={<ListChecks className="h-4 w-4" />}
        tone="orange"
      />
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Drill these until they&apos;re automatic. The full report has every
        position, deeper analysis, and shareable cards.
      </p>

      <div className="mt-4 space-y-2.5">
        {planItems.length > 0 ? (
          planItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-slate-200">
                {item.label}
              </span>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {item.tag}
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-sm text-slate-400">
            No specific drills to queue — your scan came back clean. Keep
            playing and scan again after a batch of new games.
          </p>
        )}
      </div>

      {mentalStats && (
        <div className="mt-4 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.04] p-4">
          <p className="text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-cyan-300">Clock check:</span>{" "}
            {tiltInsight(mentalStats, username)}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Shared bits ───────────────────────────────────────────────────────── */

function StepHeader({
  eyebrow,
  title,
  icon,
  tone,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  tone: "orange" | "emerald";
}) {
  const toneClass =
    tone === "orange"
      ? "bg-orange-400/[0.08] text-orange-200/80"
      : "bg-emerald-400/[0.08] text-emerald-200/80";
  return (
    <div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] ${toneClass}`}
      >
        {icon}
        {eyebrow}
      </span>
      <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
        {title}
      </h3>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "bad";
}) {
  const color =
    tone === "warn"
      ? "text-amber-400"
      : tone === "bad"
        ? "text-red-400"
        : "text-white";
  return (
    <div>
      <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
    </div>
  );
}

function EmptyStep({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06]">
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
        {text}
      </p>
    </div>
  );
}

export function tiltInsight(stats: MentalStats, username: string): string {
  // Best-effort insight from whatever mental/clock data is present.
  if (typeof stats.tiltRate === "number" && stats.tiltRate > 40) {
    return `${username} loses ${stats.tiltRate.toFixed(0)}% of games immediately after a loss — tilt is leaking rating. Take a 5-minute break between rated games to reset.`;
  }
  if (typeof stats.timeoutRate === "number" && stats.timeoutRate > 15) {
    return `${username} loses ${stats.timeoutRate.toFixed(0)}% of games on time — flag time. Slow down before move 15 to keep a reserve for the decisive moments.`;
  }
  if (typeof stats.stability === "number" && stats.stability < 50) {
    return `${username}'s mental stability score is ${stats.stability.toFixed(0)}/100. Results swing a lot game-to-game — steadier pacing will compound.`;
  }
  return `${username}'s tilt and clock profile looks healthy (stability ${stats.stability?.toFixed(0) ?? "—"}/100) — no major red flags here.`;
}
