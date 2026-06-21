"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Chess } from "chess.js";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Gauge,
  Lightbulb,
  ListChecks,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { GuidedWalkBoard } from "@/components/guided-walk/guided-walk-board";
import {
  StrengthsRadar,
  buildRadarNarrative,
  computeRadarData,
  type RadarProps,
} from "@/components/radar-chart";
import { isMissedMateTactic } from "@/lib/tactic-utils";
import type {
  AnalysisReport,
  BrilliantMove,
  EndgameMistake,
  MentalStats,
  MissedTactic,
  PositionEvalTrace,
  RepeatedOpeningLeak,
} from "@/lib/types";

/* ── Move display helpers ────────────────────────────────────────────────
 * userMove/bestMove fields are stored as UCI (e.g. "h7h8", "e7e8q"). The full
 * report's cards convert to SAN at render via chess.js; the guided tour now
 * does the same so moves read as "h8=Q+" / "Nf3" rather than raw coordinates.
 * Never returns null — falls back to a human-readable UCI format so callers
 * never show raw coordinate notation like "h7h8" in the UI. */
function fmtUci(uci: string): string {
  const to = uci.slice(2, 4);
  const promo = uci.length > 4 ? `=${uci[4].toUpperCase()}` : "";
  return `${to}${promo}`;
}

function moveSan(fen: string, move: string | null | undefined): string | null {
  if (!move) return null;
  try {
    const c = new Chess(fen);
    const uci = /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
    const r = uci
      ? c.move({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: (move.slice(4, 5) || undefined) as
            | "q"
            | "r"
            | "b"
            | "n"
            | undefined,
        })
      : c.move(move);
    if (r) return r.san;
  } catch {
    // chess.js failed — format the UCI into something readable
  }
  // Fallback: format UCI as a readable human string instead of raw coords
  if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
    return fmtUci(move);
  }
  return move;
}

/** Derive the side to move ("white" | "black") from a FEN's active-color field.
 *  Used for opening-leak traces, which carry no userColor of their own. */
function colorFromFen(fen: string): "white" | "black" {
  return fen.split(" ")[1] === "b" ? "black" : "white";
}

/* ────────────────────────────────────────────────────────────────────────
 * GuidedWalk
 *
 * A Brilliant-style, one-screen-at-a-time presenter that takes over the full
 * viewport (a portal over document.body, page scroll locked) and walks the
 * user through everything important in their scan — then graduates to the full
 * report via onFinish(). It does NOT recompute anything; it sequences the
 * existing report data.
 *
 * Renders as a fixed full-screen overlay (deep-black, immersive) so the report
 * page is fully hidden while in guided mode, like the Brilliant screenshot.
 *
 * Up to 8 steps (steps with no data are omitted, so the counter always matches
 * real content):
 *   1. Headline   — accuracy snapshot + the one-line verdict
 *   2. Radar      — strengths radar + strongest/weakest dimensions
 *   3. Top leak   — biggest repeated opening mistake (your move vs best)
 *   4. Tactic     — one missed tactic as a solve/reveal micro-interaction
 *   5. Brilliant  — your best engine-approved move (a positive beat)
 *   6. Endgame    — one endgame technique moment
 *   7. Profile    — coach's note + top strengths spotlights
 *   8. The plan   — top things to drill this week + clock/tilt check
 *
 * The full report is rendered separately (untouched) by the page once the
 * user finishes or skips.
 * ──────────────────────────────────────────────────────────────────────── */

export type GuidedSaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "duplicate"
  | "error";

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
  /** Missed tactics for the tactic step + the drill. */
  missedTactics: MissedTactic[];
  /** Endgame mistakes (used by the endgame step if present). */
  endgameMistakes?: EndgameMistake[];
  /** FENs to exclude from drilling (DB-approved inaccuracies). */
  excludeFens?: Set<string>;
  /** Mental/tilt stats — for a one-line insight in the plan step. */
  mentalStats?: MentalStats | null;
  /** Username, for copy. */
  username: string;
  /** Radar props — when present, the strengths-radar step is shown. */
  radarProps?: RadarProps | null;
  /** Brilliant moves — when present, the brilliant-move step is shown. */
  brilliantMoves?: BrilliantMove[];
  /**
   * Save-to-profile handler. When provided (along with `saveStatus`), the final
   * "plan" step shows a save prompt. The parent owns the real save logic and
   * reflects progress back via `saveStatus`; GuidedWalk stays save-agnostic.
   * If omitted, no prompt is rendered.
   */
  onSave?: () => void;
  /** Save progress, mirrored from the parent's save state. */
  saveStatus?: GuidedSaveStatus;
  /** Whether the user is signed in — flips copy to "Sign in to Save" for guests. */
  authenticated?: boolean;
  /** Called when the user finishes or skips → page flips to full view. */
  onFinish: () => void;
};

export function GuidedWalk(props: GuidedWalkProps) {
  const [step, setStep] = useState(0);
  // SSR guard: portals need document.body, so wait for mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Select the single highest-impact items for each board step. ──

  // Top leak: highest cpLoss × reachCount, needs a usable board position.
  const topLeak = useMemo(() => {
    return [...props.leaks]
      .filter((l) => l.fenBefore && l.userColor)
      .map((l) => ({ leak: l, impact: (l.cpLoss ?? 0) * (l.reachCount ?? 1) }))
      .sort((a, b) => b.impact - a.impact)[0]?.leak ?? null;
  }, [props.leaks]);

  // Top tactic: prefer mate / big swing, needs a FEN.
  const topTactic = useMemo(() => {
    const usable = props.missedTactics.filter((t) => t.fenBefore && t.userColor);
    if (usable.length === 0) return null;
    return [...usable].sort((a, b) => {
      const aScore = (a.mateIn ?? 0) * 1000 + (a.cpAfter ?? 0);
      const bScore = (b.mateIn ?? 0) * 1000 + (b.cpAfter ?? 0);
      return bScore - aScore;
    })[0];
  }, [props.missedTactics]);

  // Best brilliant: prefer the biggest eval gain for the user.
  const topBrilliant = useMemo(() => {
    const usable = (props.brilliantMoves ?? []).filter(
      (b) => b.fenBefore && b.userColor,
    );
    if (usable.length === 0) return null;
    return [...usable].sort(
      (a, b) => (b.cpAfter ?? 0) - (b.cpBefore ?? 0) - ((a.cpAfter ?? 0) - (a.cpBefore ?? 0)),
    )[0];
  }, [props.brilliantMoves]);

  // One endgame moment: biggest cpLoss, needs a FEN.
  const topEndgame = useMemo(() => {
    const usable = (props.endgameMistakes ?? []).filter(
      (e) => e.fenBefore && e.userColor,
    );
    if (usable.length === 0) return null;
    return [...usable].sort((a, b) => (b.cpLoss ?? 0) - (a.cpLoss ?? 0))[0];
  }, [props.endgameMistakes]);

  // Radar narrative for the profile step.
  const radarData = useMemo(
    () => (props.radarProps ? computeRadarData(props.radarProps) : null),
    [props.radarProps],
  );
  const narrative = useMemo(
    () => (radarData ? buildRadarNarrative(radarData) : null),
    [radarData],
  );

  // Top items for the weekly plan.
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



  // ── Build the step list dynamically (omit steps with no data). ──
  const steps = useMemo(() => {
    const list: string[] = ["headline"];
    if (props.radarProps && radarData) list.push("radar");
    list.push("leak");
    list.push("tactic");
    if (topBrilliant) list.push("brilliant");
    if (topEndgame) list.push("endgame");
    if (narrative) list.push("profile");
    list.push("plan");
    return list;
  }, [props.radarProps, radarData, topBrilliant, topEndgame, narrative]);

  const totalSteps = steps.length;
  const isLast = step === totalSteps - 1;

  const next = () => (isLast ? props.onFinish() : setStep((s) => s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // ── Lock page scroll while the takeover is mounted. ──
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ── Keyboard nav: arrows + Escape. ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.key === "Escape") {
        e.preventDefault();
        props.onFinish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, totalSteps]);

  if (!mounted) return null;

  const currentStep = steps[step];

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#050507] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Guided report walkthrough"
    >
      {/* Ambient glow — subtle, like the Brilliant backdrop. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(249,115,22,0.10) 0%, rgba(15,23,42,0.0) 45%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Top bar: progress + skip */}
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-orange-400"
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

      {/* Step body — scrolls if it overflows; centered, animates per step. */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 items-center overflow-y-auto px-5 py-8 sm:px-8">
        <div key={currentStep} className="animate-fade-in-up w-full">
          {currentStep === "headline" && (
            <HeadlineStep
              report={props.report}
              vibeTitle={props.vibeTitle}
              gamesAnalyzed={props.gamesAnalyzed}
              username={props.username}
            />
          )}
          {currentStep === "radar" && props.radarProps && radarData && (
            <RadarStep
              radarProps={props.radarProps}
              data={radarData}
              narrative={narrative}
            />
          )}
          {currentStep === "leak" && (
            <TopLeakStep
              leak={topLeak}
              hasNoLeaks={props.leaks.length === 0}
            />
          )}
          {currentStep === "tactic" && (
            <TacticStep
              tactic={topTactic}
              hasNoTactics={props.missedTactics.length === 0}
            />
          )}
          {currentStep === "brilliant" && topBrilliant && (
            <BrilliantStep brilliant={topBrilliant} />
          )}
          {currentStep === "endgame" && topEndgame && (
            <EndgameStep endgame={topEndgame} />
          )}
          {currentStep === "profile" && narrative && radarData && (
            <ProfileStep narrative={narrative} data={radarData} />
          )}
          {currentStep === "plan" && (
            <PlanStep
              planItems={planItems}
              mentalStats={props.mentalStats}
              username={props.username}
              onSave={props.onSave}
              saveStatus={props.saveStatus}
              authenticated={props.authenticated}
            />
          )}

        </div>
      </div>

      {/* Bottom nav — pinned to the bottom of the viewport. */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl shrink-0 items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-5 sm:px-8">
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
    </div>,
    document.body,
  );
}

/* ── Step 1: Headline ─────────────────────────────────────────────────── */

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
      <h2 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">
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

      <div className="mt-8 grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Accuracy"
          value={`${(report.estimatedAccuracy ?? 0).toFixed(1)}%`}
          color="text-emerald-400"
        />
        <Stat
          label="Est. Rating"
          value={
            report.estimatedRating ? report.estimatedRating.toString() : "—"
          }
          color="text-cyan-400"
        />
        <Stat
          label="Avg eval loss"
          value={((report.weightedCpLoss ?? 0) / 100).toFixed(2)}
          color="text-amber-400"
        />
        <Stat
          label="Leak rate"
          value={`${((report.severeLeakRate ?? 0) * 100).toFixed(0)}%`}
          color="text-red-400"
        />
      </div>

      {vibeTitle && (
        <p className="mt-6 text-sm italic text-slate-500">
          Verdict: {vibeTitle}
        </p>
      )}
    </div>
  );
}

/* ── Step 2: Strengths radar ──────────────────────────────────────────── */

function RadarStep({
  radarProps,
  data,
  narrative,
}: {
  radarProps: RadarProps;
  data: ReturnType<typeof computeRadarData>;
  narrative: ReturnType<typeof buildRadarNarrative> | null;
}) {
  const avg = Math.round(
    data.reduce((s, d) => s + d.value, 0) / data.length,
  );
  const sorted = [...data].sort((a, b) => a.value - b.value);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  return (
    <div className="flex flex-col items-center text-center">
      <StepHeader
        eyebrow="Your strengths profile"
        title="Where you're already strong"
        icon={<Gauge className="h-4 w-4" />}
        tone="orange"
      />
      {narrative && (
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-400">
          {narrative.confidenceLead}
        </p>
      )}

      <div className="mt-6 grid w-full items-center gap-6 lg:grid-cols-2">
        <div className="glass-card p-4 sm:p-5">
          <StrengthsRadar {...radarProps} />
        </div>
        <div className="space-y-3 text-left">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
              Strongest dimension
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {strongest?.dimension}{" "}
              <span className="text-emerald-400">{strongest?.value}</span>
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
              Biggest opportunity
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {weakest?.dimension}{" "}
              <span className="text-amber-400">{weakest?.value}</span>
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Overall
            </p>
            <p className="mt-1 text-3xl font-black text-white">{avg}<span className="text-base text-slate-500">/100</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 3: Top leak ─────────────────────────────────────────────────── */

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
  // UCI → SAN for display, matching the full report's cards.
  const userSan = moveSan(leak.fenBefore, leak.userMove);
  const bestSan = moveSan(leak.fenBefore, leak.bestMove);
  const isSideline = leak.dbApproved;
  return (
    <div>
      <StepHeader
        eyebrow={isSideline ? "An offbeat sideline you play" : "Your biggest opening leak"}
        title={leak.openingName ?? "A recurring position"}
        icon={<Crosshair className="h-4 w-4" />}
        tone={isSideline ? "emerald" : "orange"}
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
              {leak.userMove ? (
                <>
                  You played{" "}
                  <span className="font-bold text-white">{userSan ?? leak.userMove}</span>{" "}
                  {leak.bestMove && (
                    <>
                      instead of{" "}
                      <span className="font-bold text-emerald-400">
                        {bestSan ?? leak.bestMove}
                      </span>
                    </>
                  )}
                  .
                </>
              ) : (
                <>
                  The engine suggests{" "}
                  {leak.bestMove ? (
                    <span className="font-bold text-emerald-400">
                      {bestSan ?? leak.bestMove}
                    </span>
                  ) : (
                    "a cleaner continuation"
                  )}
                  .
                </>
              )}
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

          {/* Offbeat sideline banner */}
          {isSideline && leak.dbWinRate != null && leak.dbGames != null && (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] px-3.5 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-lg">
                📚
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-400/70">
                  Known Opening Line
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Your move{" "}
                  <span className="font-mono font-bold text-slate-300">
                    {userSan ?? leak.userMove}
                  </span>{" "}
                  is played in{" "}
                  <span className="font-semibold text-slate-300">
                    {leak.dbGames.toLocaleString()}
                  </span>{" "}
                  database games with a{" "}
                  <span className="font-semibold text-indigo-400">
                    {(leak.dbWinRate * 100).toFixed(0)}%
                  </span>{" "}
                  win rate. The engine prefers a different approach, but
                  this is a well-known sideline with practical results.
                </p>
              </div>
            </div>
          )}

          {isSideline ? (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
              <p className="text-xs leading-relaxed text-slate-400">
                <span className="font-semibold text-emerald-300">Nothing to fix:</span>{" "}
                This isn't a mistake — it's a sideline you know. The engine just prefers a different
                move, but your choice is well-established in practice with decent results.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-orange-500/15 bg-orange-500/[0.04] p-4">
              <p className="text-xs leading-relaxed text-slate-400">
                <span className="font-semibold text-orange-300">Why it matters:</span>{" "}
                A leak that shows up in {leak.reachCount ?? 1} of your games is a
                habit, not a blunder. Fix this one position and you fix it every
                time you reach it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Step 4: A tactic ─────────────────────────────────────────────────── */

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

/* ── Step 5: A brilliant move ─────────────────────────────────────────── */

function BrilliantStep({ brilliant }: { brilliant: BrilliantMove }) {
  return (
    <div>
      <StepHeader
        eyebrow="Your best move this scan"
        title="You found a brilliant"
        icon={<Sparkles className="h-4 w-4" />}
        tone="orange"
      />
      <div className="mt-4 grid items-start gap-5 lg:grid-cols-2">
        {/* Praise mode: the user's move is highlighted green as a great find. */}
        <GuidedWalkBoard
          fen={brilliant.fenBefore}
          userMove={brilliant.userMove}
          userColor={brilliant.userColor}
          mode="static"
          praise
        />
        <div className="space-y-4 lg:pt-1">
          <p className="text-sm leading-relaxed text-slate-300">
            Not every finding here is a leak. The engine flagged this move as
            brilliant — a deep, non-obvious idea that most players miss. You
            found it.
          </p>
          {brilliant.reason && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
              <p className="text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-emerald-300">Why it&apos;s strong:</span>{" "}
                {brilliant.reason}
              </p>
            </div>
          )}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <div className="grid grid-cols-2 gap-2 text-center">
              <MiniStat
                label="Eval swing"
                value={`+${(((brilliant.cpAfter ?? 0) - (brilliant.cpBefore ?? 0)) / 100).toFixed(2)}`}
                tone="good"
              />
              <MiniStat
                label="Move no."
                value={`${brilliant.moveNumber ?? "?"}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 6: An endgame moment ────────────────────────────────────────── */

function EndgameStep({ endgame }: { endgame: EndgameMistake }) {
  const userSan = moveSan(endgame.fenBefore, endgame.userMove);
  const bestSan = moveSan(endgame.fenBefore, endgame.bestMove);
  return (
    <div>
      <StepHeader
        eyebrow="Endgame technique"
        title={endgame.endgameType ?? "A conversion that slipped"}
        icon={<Crosshair className="h-4 w-4" />}
        tone="orange"
      />
      <div className="mt-4 grid items-start gap-5 lg:grid-cols-2">
        <GuidedWalkBoard
          fen={endgame.fenBefore}
          userMove={endgame.userMove}
          bestMove={endgame.bestMove}
          userColor={endgame.userColor}
          mode="static"
        />
        <div className="space-y-4 lg:pt-1">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-sm leading-relaxed text-slate-300">
              {endgame.userMove ? (
                <>
                  You played{" "}
                  <span className="font-bold text-white">{userSan ?? endgame.userMove}</span>{" "}
                  {endgame.bestMove && (
                    <>
                      instead of{" "}
                      <span className="font-bold text-emerald-400">
                        {bestSan ?? endgame.bestMove}
                      </span>
                    </>
                  )}
                  .
                </>
              ) : (
                <>
                  The engine suggests{" "}
                  {endgame.bestMove ? (
                    <span className="font-bold text-emerald-400">
                      {bestSan ?? endgame.bestMove}
                    </span>
                  ) : (
                    "a cleaner technique"
                  )}
                  .
                </>
              )}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <MiniStat
                label="Cost"
                value={`${(endgame.cpLoss ?? 0).toFixed(0)}cp`}
                tone="warn"
              />
              <MiniStat
                label="Move no."
                value={`${endgame.moveNumber ?? "?"}`}
              />
            </div>
          </div>
          <div className="rounded-xl border border-sky-500/15 bg-sky-500/[0.04] p-4">
            <p className="text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-sky-300">Why endgames matter:</span>{" "}
              Endgames are where points are banked or thrown away. Fewer pieces
              means fewer calculations — the right technique here is pure
              knowledge, and it converts results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 7: Profile / coach's note ───────────────────────────────────── */

function ProfileStep({
  narrative,
  data,
}: {
  narrative: ReturnType<typeof buildRadarNarrative>;
  data: ReturnType<typeof computeRadarData>;
}) {
  return (
    <div>
      <StepHeader
        eyebrow="Your profile"
        title="The coach's read"
        icon={<Trophy className="h-4 w-4" />}
        tone="orange"
      />
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
        {narrative.coachingParagraph}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {narrative.topStrengths.map((dimension, index) => (
          <ProfileSpotlightCard
            key={dimension.dimension}
            label={index === 0 ? "Current edge" : "Also helping"}
            dimension={dimension}
            accent={index === 0 ? "emerald" : "cyan"}
          />
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          All dimensions
        </p>
        <div className="space-y-2">
          {data.map((d) => (
            <ProfileBar key={d.dimension} dimension={d.dimension} value={d.value} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSpotlightCard({
  label,
  dimension,
  accent,
}: {
  label: string;
  dimension: { dimension: string; value: number };
  accent: "emerald" | "cyan";
}) {
  const accentClass =
    accent === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400"
      : "border-cyan-500/20 bg-cyan-500/[0.05] text-cyan-400";
  return (
    <div className={`rounded-xl border ${accentClass} p-4`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-white">
        {dimension.dimension}{" "}
        <span className="opacity-90">{dimension.value}</span>
      </p>
    </div>
  );
}

function ProfileBar({ dimension, value }: { dimension: string; value: number }) {
  const barBg =
    value >= 75
      ? "bg-emerald-400"
      : value >= 50
        ? "bg-cyan-400"
        : value >= 30
          ? "bg-amber-400"
          : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-xs text-slate-500">
        {dimension}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-1.5 rounded-full ${barBg} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-white">
        {value}
      </span>
    </div>
  );
}

/* ── Step 8: The plan ─────────────────────────────────────────────────── */

function PlanStep({
  planItems,
  mentalStats,
  username,
  onSave,
  saveStatus = "idle",
  authenticated = true,
}: {
  planItems: { label: string; tag: string }[];
  mentalStats?: MentalStats | null;
  username: string;
  onSave?: () => void;
  saveStatus?: GuidedSaveStatus;
  authenticated?: boolean;
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

      {onSave && (
        <SavePrompt
          onSave={onSave}
          saveStatus={saveStatus}
          authenticated={authenticated}
        />
      )}
    </div>
  );
}

/* ── Save-to-profile prompt (final step) ──────────────────────────────── */

function SavePrompt({
  onSave,
  saveStatus,
  authenticated,
}: {
  onSave: () => void;
  saveStatus: GuidedSaveStatus;
  authenticated: boolean;
}) {
  // Already saved — confirm and step back. No button needed.
  if (saveStatus === "saved" || saveStatus === "duplicate") {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-bold text-emerald-300">
            {saveStatus === "duplicate"
              ? "Already on your dashboard"
              : "Saved to your profile"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
            Find it anytime on your dashboard. The full report below has every
            position and deeper analysis.
          </p>
        </div>
      </div>
    );
  }

  const isSaving = saveStatus === "saving";
  const isError = saveStatus === "error";

  return (
    <div className="mt-5 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-cyan-500/[0.06] to-emerald-500/[0.04] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
          <Bookmark className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h4 className="text-base font-bold text-white">
            {authenticated ? "Save this report" : "Keep this report"}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {authenticated
              ? "Lock these findings to your profile so you can come back to them anytime."
              : "Create a free account to save this scan to your profile before it expires in 24 hours."}
          </p>
          {isError && (
            <p className="mt-2 text-xs font-medium text-red-400">
              Something went wrong saving — tap to try again.
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="btn-cta-fire group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isSaving ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-20"
              />
              <path
                d="M12 2a10 10 0 019.95 9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Saving…
          </>
        ) : (
          <>
            {authenticated ? "Save Report" : "Sign in to Save"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </div>
  );
}

/* ── Step 9: Best game showcase ──────────────────────────────────────────── */

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
    <div className="text-center">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] ${toneClass}`}
      >
        {icon}
        {eyebrow}
      </span>
      <h3 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{title}</h3>
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
  tone?: "neutral" | "warn" | "bad" | "good";
}) {
  const color =
    tone === "warn"
      ? "text-amber-400"
      : tone === "bad"
        ? "text-red-400"
        : tone === "good"
          ? "text-emerald-400"
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
