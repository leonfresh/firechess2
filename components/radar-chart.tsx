"use client";

/**
 * StrengthsRadar — a beautiful radar chart showing player strengths and weaknesses.
 *
 * Dimensions (all normalized to 0‒100):
 *   1. Accuracy      — from estimatedAccuracy (already 0‒100)
 *   2. Opening Prep   — inverse of leak rate (fewer repeated leaks → stronger)
 *   3. Tactical Eye   — inverse of tactics‑miss rate
 *   4. Composure      — inverse of severe leak rate
 *   5. Consistency    — low cpLoss variance → high consistency
 *   6. Resilience     — survival despite bad positions (low severe rate + decent accuracy)
 */

import { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type RadarDimension = {
  dimension: string;
  value: number;          // 0‒100
  fullMark: number;       // always 100
};

export type RadarProps = {
  /** estimatedAccuracy (0-100) */
  accuracy: number;
  /** number of repeated opening leaks */
  leakCount: number;
  /** total positions scanned for leaks */
  repeatedPositions: number;
  /** number of missed tactics */
  tacticsCount: number;
  /** gamesAnalyzed */
  gamesAnalyzed: number;
  /** weighted centipawn loss */
  weightedCpLoss: number;
  /** severe leak rate (0-1) */
  severeLeakRate: number;
  /** Time management score 0-100 (from clock data, null if unavailable) */
  timeManagementScore?: number | null;
  /** compact mode — smaller radius, no labels */
  compact?: boolean;
  /** custom class */
  className?: string;
};

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

export function computeRadarData(props: RadarProps): RadarDimension[] {
  const {
    accuracy,
    leakCount,
    repeatedPositions,
    tacticsCount,
    gamesAnalyzed,
    weightedCpLoss,
    severeLeakRate,
  } = props;

  // 1. Accuracy (already 0-100, keep as reported)
  const dim1 = clamp(accuracy);

  // 2. Opening Prep — fewer leaks per position = better
  //    Exponential decay: 2% leak rate ≈ 83, 10% ≈ 37, 25% ≈ 8
  const leakRate = repeatedPositions > 0 ? leakCount / repeatedPositions : 0;
  const dim2 = clamp(100 * Math.exp(-leakRate * 10));

  // 3. Tactical Eye — fewer missed tactics per game = better
  //    Exponential decay on per-game rate:
  //    0/game → 100, 1/game → 55, 2/game → 30, 4/game → 9
  //    When tactics weren't scanned (tacticsCount === -1), estimate from accuracy.
  const dim3 = tacticsCount < 0
    ? clamp(dim1 * 0.9)                               // proxy when no tactics scan
    : (() => {
        const tacticsPerGame = gamesAnalyzed > 0 ? tacticsCount / gamesAnalyzed : 0;
        return clamp(100 * Math.exp(-tacticsPerGame * 0.6));
      })();

  // 4. Composure — inverse severe leak rate, exponential
  //    2% → ~74, 5% → ~47, 10% → ~22, 25% → ~2
  const dim4 = clamp(100 * Math.exp(-severeLeakRate * 15));

  // 5. Time Management — from clock data analysis score (0-100)
  //    Falls back to 50 if no clock data available
  const dim5 = clamp(props.timeManagementScore ?? 50);

  // 6. Resilience — blend of accuracy + composure, composure-weighted
  const dim6 = clamp(dim1 * 0.3 + dim4 * 0.7);

  return [
    { dimension: "Accuracy", value: Math.round(dim1), fullMark: 100 },
    { dimension: "Opening Prep", value: Math.round(dim2), fullMark: 100 },
    { dimension: "Tactical Eye", value: Math.round(dim3), fullMark: 100 },
    { dimension: "Composure", value: Math.round(dim4), fullMark: 100 },
    { dimension: "Time Mgmt", value: Math.round(dim5), fullMark: 100 },
    { dimension: "Resilience", value: Math.round(dim6), fullMark: 100 },
  ];
}

export function StrengthsRadar(props: RadarProps) {
  const data = computeRadarData(props);
  const { compact = false, className = "" } = props;

  const avg = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length);
  // Dynamic color based on average
  const fillColor =
    avg >= 75
      ? "rgb(16, 185, 129)"   // emerald-500
      : avg >= 50
        ? "rgb(6, 182, 212)"    // cyan-500
        : avg >= 30
          ? "rgb(245, 158, 11)"  // amber-500
          : "rgb(239, 68, 68)";  // red-500

  const strokeColor =
    avg >= 75
      ? "rgb(52, 211, 153)"
      : avg >= 50
        ? "rgb(34, 211, 238)"
        : avg >= 30
          ? "rgb(251, 191, 36)"
          : "rgb(248, 113, 113)";

  return (
    <div className={`relative ${className}`}>
      <ResponsiveContainer width="100%" height={compact ? 200 : 320}>
        <RadarChart cx="50%" cy="50%" outerRadius={compact ? "65%" : "70%"} data={data}>
          <PolarGrid
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="3 3"
          />
          {!compact && (
            <PolarAngleAxis
              dataKey="dimension"
              tick={{
                fill: "rgba(255,255,255,0.6)",
                fontSize: 11,
                fontWeight: 500,
              }}
            />
          )}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Strength"
            dataKey="value"
            stroke={strokeColor}
            fill={fillColor}
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{
              r: compact ? 2 : 3,
              fill: strokeColor,
              strokeWidth: 0,
            }}
            animationDuration={800}
          />
          {!compact && (
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "13px",
              }}
              formatter={(value: number | undefined) => [`${value ?? 0}/100`, "Score"]}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>

      {/* Center Score */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div
            className={`font-bold ${compact ? "text-lg" : "text-3xl"}`}
            style={{ color: strokeColor }}
          >
            {avg}
          </div>
          {!compact && (
            <div className="text-xs font-medium text-white/40">overall</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * InsightCards — 6 in-depth analysis cards, one per radar dimension.
 * Each card shows the score, verdict, deep analysis, practical meaning,
 * and a 3-step structured improvement plan.
 */
export function InsightCards({ data, props, hasProAccess = false }: { data: RadarDimension[]; props: RadarProps; hasProAccess?: boolean }) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (dim: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(dim)) next.delete(dim);
      else next.add(dim);
      return next;
    });
  };

  // Overall summary
  const avg = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length);
  const sorted = [...data].sort((a, b) => a.value - b.value);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  const borderForValue = (v: number) =>
    v >= 75 ? "border-emerald-500/20" : v >= 50 ? "border-cyan-500/20" : v >= 30 ? "border-amber-500/20" : "border-red-500/20";
  const bgGrad = (v: number) =>
    v >= 75
      ? "from-emerald-500/[0.06] to-transparent"
      : v >= 50
        ? "from-cyan-500/[0.06] to-transparent"
        : v >= 30
          ? "from-amber-500/[0.06] to-transparent"
          : "from-red-500/[0.06] to-transparent";
  const scoreColor = (v: number) =>
    v >= 75 ? "text-emerald-400" : v >= 50 ? "text-cyan-400" : v >= 30 ? "text-amber-400" : "text-red-400";
  const scoreBg = (v: number) =>
    v >= 75 ? "bg-emerald-500/15" : v >= 50 ? "bg-cyan-500/15" : v >= 30 ? "bg-amber-500/15" : "bg-red-500/15";
  const barBg = (v: number) =>
    v >= 75 ? "bg-emerald-400" : v >= 50 ? "bg-cyan-400" : v >= 30 ? "bg-amber-400" : "bg-red-400";
  const ringColor = (v: number) =>
    v >= 75 ? "ring-emerald-500/30" : v >= 50 ? "ring-cyan-500/30" : v >= 30 ? "ring-amber-500/30" : "ring-red-500/30";

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="glass-card border-white/[0.08] bg-gradient-to-r from-fuchsia-500/[0.04] to-transparent p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-3xl shadow-lg shadow-fuchsia-500/10">📊</span>
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Deep Analysis
              <span className={`ml-3 inline-flex items-center rounded-full px-3 py-1 text-base font-bold ${scoreBg(avg)} ${scoreColor(avg)}`}>
                {avg}/100
              </span>
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {avg >= 75
                ? <>Strong profile. Your edge is <span className="font-semibold text-emerald-400">{strongest.dimension}</span> — maintain it while shoring up <span className="text-amber-400">{weakest.dimension}</span>.</>
                : avg >= 50
                  ? <>Solid foundation. <span className="font-semibold text-emerald-400">{strongest.dimension}</span> leads your profile; <span className="font-semibold text-amber-400">{weakest.dimension}</span> ({weakest.value}) has the most upside.</>
                  : avg >= 30
                    ? <>Room to grow. Prioritize <span className="font-semibold text-amber-400">{weakest.dimension}</span> ({weakest.value}) — it&apos;s your biggest bottleneck.</>
                    : <>Developing player — start with <span className="font-semibold text-red-400">{weakest.dimension}</span> for the fastest gains.</>}
            </p>
          </div>
        </div>
      </div>

      {/* Cards grid — 2 columns on md, 3 on lg */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((d, i) => {
          const insight = getDimInsight(d.dimension, d.value, props);
          const isOpen = expandedCards.has(d.dimension);
          const icon = DIM_ICONS[d.dimension] ?? "📈";
          const subtitle = DIM_SUBTITLE[d.dimension] ?? "";

          return (
            <div
              key={d.dimension}
              className={`animate-fade-in-up rounded-2xl border ${borderForValue(d.value)} bg-gradient-to-br ${bgGrad(d.value)} backdrop-blur-sm transition-all duration-300`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Card header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${scoreBg(d.value)} text-xl ring-1 ${ringColor(d.value)}`}>
                      {icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-white">{d.dimension}</h3>
                      <p className="text-[11px] text-slate-500">{subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-black ${scoreColor(d.value)}`}>{d.value}</span>
                    <p className={`text-[10px] font-semibold ${scoreColor(d.value)} opacity-80`}>{insight.verdict}</p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-4 h-1.5 w-full rounded-full bg-white/[0.06]">
                  <div
                    className={`h-1.5 rounded-full ${barBg(d.value)} transition-all duration-1000`}
                    style={{ width: `${d.value}%` }}
                  />
                </div>

                {/* Short description */}
                <p className="mt-3 text-[12px] leading-relaxed text-slate-400">{insight.desc}</p>

                {/* Expand toggle */}
                <button
                  type="button"
                  onClick={() => hasProAccess ? toggleCard(d.dimension) : undefined}
                  className={`mt-3 flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                    hasProAccess
                      ? "text-white/40 hover:text-white/70"
                      : "text-violet-400/60 hover:text-violet-400/80"
                  }`}
                >
                  {hasProAccess ? (
                    <>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {isOpen ? "Show less" : "Full analysis & study plan"}
                    </>
                  ) : (
                    <a href="/pricing" className="flex items-center gap-1.5 text-violet-400/70 hover:text-violet-400">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Pro: Full analysis & study plan
                    </a>
                  )}
                </button>
              </div>

              {/* Expanded deep content — Pro only */}
              {isOpen && hasProAccess && (
                <div className="animate-fade-in border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4">
                  {/* Deep analysis */}
                  <div>
                    <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
                      Detailed Analysis
                    </h4>
                    <p className="text-[12px] leading-relaxed text-slate-400">{insight.analysis}</p>
                  </div>

                  {/* What this means */}
                  <div>
                    <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                      What This Means
                    </h4>
                    <p className="text-[12px] leading-relaxed text-slate-400">{insight.meaning}</p>
                  </div>

                  {/* Study plan */}
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400/70">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                      Study Plan
                    </h4>
                    <ol className="space-y-2">
                      {insight.studyPlan.map((step, si) => (
                        <li key={si} className="flex gap-2.5 text-[12px] leading-relaxed text-slate-400">
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${scoreBg(d.value)} ${scoreColor(d.value)}`}>
                            {si + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Quick tip */}
                  <div className={`rounded-lg ${scoreBg(d.value)} px-3 py-2.5`}>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      <span className={`font-bold ${scoreColor(d.value)}`}>Quick Tip:</span>{" "}
                      {insight.tip}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}/**
 * Dynamic per-dimension insight generator.
 * Returns score-dependent description, verdict, improvement tip, and deep analysis.
 */
type DimInsight = {
  verdict: string;
  desc: string;
  tip: string;
  /** Multi-paragraph deep analysis for in-depth cards */
  analysis: string;
  /** "What this means in practice" explanation */
  meaning: string;
  /** Structured study plan — 3 concrete steps */
  studyPlan: [string, string, string];
};

const DIM_ICONS: Record<string, string> = {
  Accuracy: "🎯",
  "Opening Prep": "📚",
  "Tactical Eye": "⚡",
  Composure: "🧘",
  "Time Mgmt": "⏱️",
  Resilience: "🛡️",
};

const DIM_SUBTITLE: Record<string, string> = {
  Accuracy: "Move Quality in Known Positions",
  "Opening Prep": "Repertoire Depth & Consistency",
  "Tactical Eye": "Forcing Move Detection",
  Composure: "Blunder Resistance Under Pressure",
  "Time Mgmt": "Clock Usage & Move Pacing",
  Resilience: "Mental Fortitude & Recovery",
};

function getDimInsight(dim: string, value: number, props: RadarProps): DimInsight {
  const { leakCount, repeatedPositions, tacticsCount, gamesAnalyzed, weightedCpLoss, severeLeakRate } = props;

  switch (dim) {
    case "Accuracy": {
      if (value >= 85)
        return {
          verdict: "Excellent",
          desc: `Your opening moves match the engine's top choices ${value}% of the time — that's strong preparation.`,
          tip: "Focus on the rare positions where you deviate. Check for novelties or transpositions that catch you off-guard.",
          analysis: `Across your scanned games, you chose the engine's recommended move or an equally-valued alternative ${value}% of the time in positions you've seen before. This is a hallmark of serious preparation — most players rated under 2000 hover in the 50-70% range. Your deviations, when they happen, tend to be minor inaccuracies rather than fundamental misunderstandings of the position.`,
          meaning: "In practical terms, your opponents rarely get a free advantage from the opening. You're consistently entering the middlegame with equal or better chances, which means your results hinge on middlegame skill rather than opening preparation gaps.",
          studyPlan: [
            "Identify the 2-3 specific positions where you still deviate — these are in the leaks section below. Even patching one will push you above 90%.",
            "Check for transposition tricks: sometimes you know line A perfectly but reach it via move order B and get confused. Map out the transpositions in your repertoire.",
            "At this level, consider studying recent top-level games in your openings for new ideas rather than drilling basics.",
          ],
        };
      if (value >= 65)
        return {
          verdict: "Solid",
          desc: `You're playing the right move about ${value}% of the time, which is respectable but leaves room for growth.`,
          tip: "Pick your 2-3 most-played openings and learn the critical lines to depth 12-15 moves. Even small accuracy gains compound.",
          analysis: `At ${value}% accuracy, you have a reasonable grasp of your openings but are leaking small advantages in roughly ${100 - value}% of familiar positions. These aren't catastrophic mistakes — they're the kind of second-best moves that don't lose on the spot but hand your opponent a slight edge consistently. Over many games, this compounds into noticeable rating points lost.`,
          meaning: "You're getting playable positions most of the time, but you're starting many games a fraction of a pawn down. Against well-prepared opponents at your level, that small edge often decides the game. The good news: this is one of the easiest dimensions to improve because it's pure knowledge, not calculation.",
          studyPlan: [
            "Build a focused repertoire of 2-3 openings per color. Go deep (12-15 moves) rather than wide. Breadth comes later.",
            "Use the specific leaks flagged in this report as your study list — they're positions you actually reach, so fixing them has immediate impact.",
            "After studying a line, play 10+ rapid games with it and check your accuracy in those specific positions afterwards.",
          ],
        };
      if (value >= 45)
        return {
          verdict: "Inconsistent",
          desc: `At ${value}%, you know the right ideas but frequently choose second-best moves in familiar positions.`,
          tip: "Build a personal repertoire and drill it. Use the leaks flagged in this report as your study list — they're the highest-leverage fixes.",
          analysis: `With ${value}% accuracy, you're playing the right move less than half the time in positions you reach repeatedly. This suggests you have general opening knowledge — you know which openings you play and the broad plans — but haven't committed the specific move orders to memory. You're relying on intuition where concrete knowledge would serve you better.`,
          meaning: "In practice, you're giving your opponents a free advantage in more than half your games before the middlegame even begins. This is a significant handicap that's masking your true playing strength. Players with better opening prep at your skill level are winning games they shouldn't, purely from the opening edge.",
          studyPlan: [
            "Simplify ruthlessly: pick ONE opening as White and ONE as Black. Stick with them for at least 50 games each.",
            "For each opening, learn the first 10 moves of the 3 most common opponent responses. Use a repertoire trainer to drill these daily.",
            "Review every leak from this report. For each one, write down the correct move and why it's better. The act of writing cements it.",
          ],
        };
      return {
        verdict: "Needs Work",
        desc: `Only ${value}% accuracy suggests you're winging it in the opening rather than following known good lines.`,
        tip: "Start simple: pick one opening as White and one as Black. Study the first 10 moves deeply. Accuracy comes from repetition.",
        analysis: `At ${value}% accuracy, you're essentially improvising in the opening phase. Most of your moves in familiar positions are suboptimal, meaning you haven't internalized any particular repertoire. This is the single biggest area of improvement available to you — the gap between where you are and where you could be with basic preparation is enormous.`,
        meaning: "You're effectively starting every game at a disadvantage. While stronger players enter the middlegame with a plan and an equal position, you're frequently entering it confused and worse off. The silver lining: because this score is so low, even modest study will produce dramatic improvements in your results.",
        studyPlan: [
          "Pick the simplest possible openings: as White, try the London System or Italian Game. As Black, try the Caro-Kann or the Classical Sicilian. These have clear plans.",
          "Learn just the first 5-7 moves of each. Don't go deeper until you can play these moves instantly without thinking.",
          "Play 20 games and note every position where you weren't sure what to do. Look up the answer and add it to your repertoire.",
        ],
      };
    }

    case "Opening Prep": {
      const leakRate = repeatedPositions > 0 ? ((leakCount / repeatedPositions) * 100).toFixed(0) : "0";
      const leakRateNum = repeatedPositions > 0 ? (leakCount / repeatedPositions) * 100 : 0;
      if (value >= 80)
        return {
          verdict: "Well-Prepared",
          desc: `Only ${leakRate}% of your repeated positions leak eval — your repertoire is well-drilled.`,
          tip: "Maintain your edge by occasionally checking for new engine developments in your main lines.",
          analysis: `Out of ${repeatedPositions} positions you reached multiple times, only ${leakCount} showed a consistent eval loss — a ${leakRate}% leak rate. This means your repertoire is battle-tested and solid. You're not just knowing the right moves in theory; you're executing them consistently in actual games under time pressure.`,
          meaning: "Your preparation gives you a genuine competitive edge. Opponents who haven't studied their openings as deeply are handing you small advantages game after game. Over a tournament or a rating climb, this compounds significantly. You're winning the opening battle before the middlegame begins.",
          studyPlan: [
            "Review the few leaks that do exist — at your level, fixing even one or two remaining weak spots can have outsized impact.",
            "Expand your repertoire sideways: add a secondary weapon for situations where your main line is heavily analyzed by your opponents.",
            "Stay current: check engine updates for your main lines every few months. Theory evolves, and yesterday's best move sometimes isn't today's.",
          ],
        };
      if (value >= 55)
        return {
          verdict: "Decent Coverage",
          desc: `${leakRate}% of repeated positions are leaks. You know your openings, but there are gaps opponents can exploit.`,
          tip: "The top 3 leaks in this report are low-hanging fruit. Patch those and your prep score will jump significantly.",
          analysis: `You have ${leakCount} leaking positions out of ${repeatedPositions} repeated ones (${leakRate}%). Your repertoire has a solid core, but there are specific positions where you consistently choose a suboptimal move. These aren't random mistakes — they're systematic. You reach the same position, face the same decision, and make the same wrong choice each time.`,
          meaning: `Any opponent who studies your games will find these patterns. At your level, that might not happen often, but you're still leaving ${leakRateNum > 20 ? "significant" : "some"} rating points on the table. The positions you're leaking in are ones you already see regularly — fixing them doesn't require learning anything new, just correcting what you already play.`,
          studyPlan: [
            "Sort the leaks by how often you reach them (the 'times reached' count). Fix the most frequent ones first — maximum impact per hour of study.",
            "For each leak, don't just memorize the right move — understand the strategic idea behind it. Why does the engine prefer it? What plan does it support?",
            "After patching your top 3 leaks, run another scan to see the improvement. Measurable progress is motivating.",
          ],
        };
      if (value >= 30)
        return {
          verdict: "Patchy",
          desc: `${leakCount} leaks across ${repeatedPositions} positions (${leakRate}% leak rate) means you have significant blind spots.`,
          tip: "You're making the same mistake in the same position repeatedly. Drill each flagged leak until the correct move is instinct.",
          analysis: `With ${leakCount} leaks out of ${repeatedPositions} positions (${leakRate}% leak rate), nearly ${leakRateNum > 40 ? "half" : "a third"} of your familiar positions are problematic. This isn't about encountering new positions — you're seeing the same boards over and over and choosing poorly each time. The pattern is clear: you have general opening knowledge but haven't drilled the specific critical moments.`,
          meaning: "In practical terms, you're donating small advantages to your opponents in a large fraction of your games. These mini-disadvantages seem small individually, but they add up to significantly worse results than your tactical and middlegame skills would predict. Your rating is being held back by preparation gaps.",
          studyPlan: [
            "Pick the 5 most frequent leaks from this report. Create flashcards: position on one side, correct move + explanation on the other.",
            "Drill these positions daily for 2 weeks. Studies show spaced repetition cements opening knowledge faster than any other method.",
            "Track your leak rate over time. If it drops below 20% after a month of drilling, your rating should follow within weeks.",
          ],
        };
      return {
        verdict: "Unprepared",
        desc: `A ${leakRate}% leak rate is very high — you're essentially improvising in positions you see regularly.`,
        tip: "Go through each leak one by one. Even learning 5 correct responses will dramatically change your results.",
        analysis: `${leakCount} leaks out of ${repeatedPositions} positions means a ${leakRate}% leak rate — the vast majority of positions you reach repeatedly are ones where you play a suboptimal move. This is the chess equivalent of retaking the same exam and getting the same questions wrong each time. The positions are familiar, but you don't have reliable knowledge of what to do.`,
        meaning: "This is likely the single biggest factor limiting your rating. You're essentially entering every game with a preparation deficit, meaning you need to outplay your opponents in the middlegame just to equalize. Fixing your preparation would effectively give you a free rating boost without improving any other aspect of your game.",
        studyPlan: [
          "Don't try to fix everything at once. Pick the 3 leaks you see most often and learn the correct move for each. Just three.",
          "After learning those 3, play 10-15 games and actively look for those positions. When they appear, play the correct move consciously.",
          "Once those are solid, add 3 more. This incremental approach is more sustainable than trying to overhaul your entire repertoire at once.",
        ],
      };
    }

    case "Tactical Eye": {
      const perGame = gamesAnalyzed > 0 ? (tacticsCount / gamesAnalyzed).toFixed(1) : "0";
      if (value >= 80)
        return {
          verdict: "Sharp",
          desc: `Averaging ${perGame} missed tactics per game — you're catching most forcing opportunities.`,
          tip: "Keep your tactical edge by doing 10-15 puzzles daily. Focus on speed to build pattern recognition.",
          analysis: `Across ${gamesAnalyzed} games, you missed only ${tacticsCount} tactical opportunities — an average of ${perGame} per game. Most of these are likely deep or complex sequences rather than simple one-move tactics. Your pattern recognition is strong, and you're consistently checking for forcing moves before committing to a plan.`,
          meaning: "Your tactical awareness is a genuine weapon. When opponents leave pieces en prise, miss back-rank threats, or allow forks, you're usually there to punish them. This translates directly to points on the board — tactical players at your level win games they 'shouldn't' because they capitalize on every opportunity.",
          studyPlan: [
            "Shift from quantity to quality in tactics training. Focus on 2200+ rated puzzles that require 4+ move calculations rather than simple one-movers.",
            "Review the specific tactics you did miss (shown in this report). Are they a specific motif? Discovered attacks, zwischenzugs, or quiet moves in combinations?",
            "Work on calculation speed: set a 30-second limit per puzzle. The gap between seeing a tactic and seeing it fast enough to use it in a game is where rating gains live.",
          ],
        };
      if (value >= 55)
        return {
          verdict: "Aware",
          desc: `${perGame} missed tactics per game means you see a lot but let some slip. ${tacticsCount} total missed across ${gamesAnalyzed} games.`,
          tip: "You're missing tactics in specific motifs. Check the pattern analysis above — train your weakest motif category first.",
          analysis: `With ${tacticsCount} missed tactics across ${gamesAnalyzed} games (${perGame} per game), you have decent tactical awareness but aren't catching everything. The tactics you're missing likely fall into specific categories — perhaps you see knight forks easily but miss discovered attacks, or you calculate well in sharp positions but overlook tactics in quiet ones.`,
          meaning: `You're leaving wins and advantages on the table in roughly ${Number(perGame) > 1.5 ? "every other" : "some"} game${Number(perGame) > 1.5 ? "" : "s"}. These aren't positions where a tactic is barely visible — the engine found a significant advantage (≥200cp) that you walked past. Closing this gap would convert drawn games into wins and losing games into draws.`,
          studyPlan: [
            "Do 15 tactical puzzles daily on Lichess or Chess Tempo. Aim for 85%+ accuracy before increasing difficulty.",
            "Review the missed tactics from this report and categorize them: forks, pins, skewers, discovered attacks, etc. Train your weakest category specifically.",
            "Before every move in your games, spend 5 seconds asking: 'Are there any checks, captures, or threats I should consider first?' This habit alone fixes most miss patterns.",
          ],
        };
      if (value >= 30)
        return {
          verdict: "Spotty",
          desc: `${perGame} missed per game (${tacticsCount} total) — you're leaving significant material on the table.`,
          tip: "Dedicate 15 minutes daily to tactical puzzles, especially forks, pins, and discovered attacks. The patterns will click.",
          analysis: `Missing ${perGame} tactics per game (${tacticsCount} across ${gamesAnalyzed} games) indicates a significant gap in pattern recognition. You're not calculating through forcing sequences before deciding on your move, meaning you settle for 'decent-looking' moves when winning ones are available. This is extremely common at intermediate levels and is the most fixable weakness.`,
          meaning: "In concrete terms, you're probably winning 15-25% fewer games than a player with your same positional understanding but better tactical vision. Every missed tactic is either a win you didn't take, an advantage you didn't press, or material you left on the board. This is likely the fastest path to gaining rating.",
          studyPlan: [
            "Start a daily puzzle habit: 20 puzzles, untimed, focusing on getting the right answer rather than speed. Do this for 30 days straight.",
            "Study the basic tactical patterns: fork, pin, skewer, discovered attack, double check, removing the defender, deflection. Learn to name them when you see them.",
            "In your games, whenever you see a piece move to an active square, ask yourself: 'What does this threaten? What does it leave undefended?' Train yourself to think in threat-terms.",
          ],
        };
      return {
        verdict: "Blind Spots",
        desc: `Missing ${perGame} tactics per game suggests you aren't scanning for forcing moves before deciding.`,
        tip: "Before every move, ask: are there any checks, captures, or threats? This one habit can cut your missed tactics in half.",
        analysis: `At ${perGame} missed tactics per game (${tacticsCount} total), you're consistently failing to check for forcing moves. This isn't about complex 5-move combinations — many of these are 2-3 move sequences that involve basic patterns like forks and pins. Your decision-making process likely skips the 'Is there a tactic here?' check and goes straight to positional considerations.`,
        meaning: "This is probably costing you more rating points than any other single factor. Even if your positional understanding is good, missing basic tactics means you're leaving whole pieces and decisive advantages on the board. The good news: tactical vision improves faster than any other chess skill with targeted practice.",
        studyPlan: [
          "Start with basic 1-move tactical puzzles (mate-in-1, simple forks). Get comfortable with the patterns before moving to harder content.",
          "Install the 'checks, captures, threats' habit: before EVERY move, spend 10 seconds checking all checks, all captures, and all threats — for both sides.",
          "Play 10-minute games instead of 3-minute games. The extra time gives you space to actually look for tactics rather than moving on instinct.",
        ],
      };
    }

    case "Composure": {
      const sevPct = (severeLeakRate * 100).toFixed(1);
      const oneInN = Math.round(1 / Math.max(severeLeakRate, 0.01));
      if (value >= 75)
        return {
          verdict: "Cool-Headed",
          desc: `Only ${sevPct}% severe leak rate — you rarely crack under pressure. Blunders are uncommon in your games.`,
          tip: "Protect this strength. When you feel tilt coming on, take a break between games rather than playing through frustration.",
          analysis: `With only ${sevPct}% of your positions resulting in severe eval drops (≥200cp loss), you demonstrate exceptional emotional control at the board. Roughly only 1 in ${oneInN} of your moves is a serious blunder. This means you maintain a stable decision-making process even when the position gets complicated or when you're under time pressure.`,
          meaning: "Composure is one of the hardest skills to develop and one of the most valuable. Players who don't blunder win games by simply outlasting opponents who do. Your low blunder rate means you're a tough opponent to beat — people need to genuinely outplay you rather than waiting for you to self-destruct.",
          studyPlan: [
            "Maintain this strength by recognizing your personal tilt triggers. When you notice frustration, anxiety, or overconfidence — pause before moving.",
            "Practice 'blunder-checking' as an automatic habit: before clicking your move, spend 3 seconds asking 'Am I leaving anything hanging?' even when you feel confident.",
            "Push your limits: play against stronger opponents or in tournaments. Composure under real pressure is even more valuable than composure in casual games.",
          ],
        };
      if (value >= 50)
        return {
          verdict: "Mostly Steady",
          desc: `${sevPct}% of positions result in severe eval drops. You're generally composed but have occasional meltdowns.`,
          tip: "Review your worst moments from this report. Do they cluster around a specific opening or game phase? Fixing the trigger stops the collapse.",
          analysis: `At ${sevPct}% severe leak rate, you're stable most of the time but have predictable breaking points. Roughly 1 in ${oneInN} positions leads to a serious mistake. These blunders aren't random — they likely cluster in specific situations: positions with lots of pieces, time scrambles, or after you've already made one mistake (the 'tilt cascade' where one error leads to several more).`,
          meaning: "Your blunder rate is a significant but fixable drag on your results. You probably have several games where you were winning or equal before a single catastrophic move changed the outcome. If you could halve your severe leak rate, you'd likely see a 50-100 point rating increase from the games you'd stop losing.",
          studyPlan: [
            "Identify your blunder clusters: are they in specific openings, time scrambles, or after already making a mistake? Knowing the trigger is half the fix.",
            "Implement a physical pause before critical moves: take your hand off the mouse, take a breath, re-evaluate. Blunders often happen when we move too quickly.",
            "After each game with a blunder, write one sentence about what happened emotionally. Over 20 games, you'll see a clear pattern you can address.",
          ],
        };
      if (value >= 25)
        return {
          verdict: "Volatile",
          desc: `A ${sevPct}% severe leak rate means roughly 1 in ${oneInN} positions is a disaster.`,
          tip: "Build a pre-move checklist: (1) What did my opponent just threaten? (2) Is anything hanging? (3) Any checks? Run it every time.",
          analysis: `With ${sevPct}% of positions resulting in severe eval drops, you're blundering far too often. Roughly 1 in ${oneInN} moves is a serious mistake — that's likely multiple significant blunders per game. This pattern suggests impulsive decision-making: you're choosing moves based on first impressions rather than checking for safety. When things go wrong in a game, the errors tend to cascade.`,
          meaning: "This is dramatically affecting your results. Even if you find strong ideas and build winning positions, the frequent collapses mean you're converting far fewer wins than your skill level suggests. Many of your losses are probably games you should have won or drawn. Improving composure alone could add 100-200 rating points.",
          studyPlan: [
            "Adopt the '10-second rule': before EVERY move, count to 10 and re-check the board. Is anything hanging? Any opponent checks or captures?",
            "Play longer time controls (15+10 or 30-minute games). Speed chess reinforces bad habits; slower chess lets you practice the discipline of checking.",
            "Review your blunder games with an engine, but focus on the moment before the blunder. What were you thinking? What did you miss? Build awareness of your blind spots.",
          ],
        };
      return {
        verdict: "Fragile",
        desc: `${sevPct}% severe leaks is very high — you're losing won games through avoidable collapses.`,
        tip: "Slow down significantly. Set a rule: never move in under 5 seconds. Most severe blunders come from speed, not skill.",
        analysis: `A ${sevPct}% severe leak rate means you're making game-changing blunders at an alarming frequency. Multiple times per game, you're making moves that lose 200+ centipawns — often equivalent to blundering a full piece or walking into checkmate. This isn't a skill issue in the traditional sense; it's a process issue. You're not checking your moves before playing them.`,
        meaning: "This is the single most important thing for you to fix. Nothing else in chess matters if you're giving away pieces every few moves. The good news: this is entirely fixable with discipline, not talent. Every strong player has been through this phase and overcome it the same way — by slowing down and checking.",
        studyPlan: [
          "Rule #1 for the next 50 games: never move in under 10 seconds, no matter how obvious the move seems. Set a physical timer if needed.",
          "Before every move, say to yourself (even out loud): 'Is anything hanging? Can my opponent give check?' If the answer isn't clear, don't move yet.",
          "Switch to 15+10 time control exclusively. Bullet and blitz are actively harmful to you right now because they reinforce impulsive play.",
        ],
      };
    }

    case "Time Mgmt": {
      const hasClockData = props.timeManagementScore != null;
      if (!hasClockData)
        return {
          verdict: "No Data",
          desc: "Clock data wasn't available for your games. Play with clocks enabled to unlock this dimension.",
          tip: "Lichess and Chess.com both record clock times — make sure clocks are enabled in your games.",
          analysis: "We couldn't compute a time management score because the games analyzed didn't include clock timestamps. This can happen with imported games, older archives, or certain game types. The dimension defaults to 50 when clock data is missing.",
          meaning: "Time management is one of the most practical skills in competitive chess, especially in blitz and rapid. Without clock data, we can't tell you how well you're pacing yourself — but the other five dimensions still give a strong picture of your play.",
          studyPlan: [
            "Play timed games on Lichess or Chess.com with clocks enabled so future scans can analyze your time usage.",
            "When you re-scan, this card will show your pacing consistency, time scramble frequency, and early-game time usage.",
            "In the meantime, practice time discipline: set a personal rule like 'no more than 10% of my time on the first 5 moves'.",
          ],
        };
      if (value >= 75)
        return {
          verdict: "Metronome",
          desc: "Your clock usage is consistent and disciplined — you're rarely in time trouble and you pace your games well.",
          tip: "Strong time management means you can play longer time controls and outperform opponents who get into scrambles. Use this edge.",
          analysis: `With a time management score of ${value}, your pacing is excellent. You distribute your thinking time evenly across the game, avoid time scrambles, and don't waste clock on early moves where your preparation should carry you. This level of discipline is what separates tournament players from casual ones — you're making decisions about when to think, not just what to think.`,
          meaning: "In practical play, good time management is force multiplication. The same calculation ability produces better moves when you have 5 minutes left instead of 30 seconds. You're consistently giving yourself enough time for the critical moments, which means your tactical and positional skills are fully expressed in your games rather than being handicapped by time pressure.",
          studyPlan: [
            "Focus on critical moment recognition: learn when a position demands deep calculation vs when you can play on intuition. This lets you reallocate time even more effectively.",
            "Experiment with faster time controls where your pacing advantage becomes an even bigger weapon — many opponents collapse under time pressure that doesn't affect you.",
            "Study increment vs non-increment strategies: with your discipline, increment games are a particular strength since opponents can't rely on you flagging.",
          ],
        };
      if (value >= 50)
        return {
          verdict: "Steady",
          desc: "Your time usage is reasonable but has room for improvement — occasional time scrambles or uneven pacing in some games.",
          tip: "Try setting mental checkpoints: know roughly how much time you should have at moves 10, 20, and 30.",
          analysis: `A time management score of ${value} means you're generally okay with the clock but have inconsistencies. You might spend too long on some moves and then rush through others, or occasionally fall into time trouble in longer games. The core issue is usually decision-making speed rather than the clock itself — when you're unsure, you burn time.`,
          meaning: "The practical impact is that your move quality probably dips in the second half of your games. Your early-game accuracy might be solid, but rushed late-game decisions undo that advantage. In tournaments, this pattern leads to 'should have won' draws and 'almost held' losses — games where better time allocation would have changed the result.",
          studyPlan: [
            "After each game, review your clock at key moments: how much time did you have at move 15? Move 25? Look for patterns in when you speed up or slow down.",
            "Build opening preparation depth so you can play the first 8-12 moves quickly and confidently, banking time for complex middlegame decisions.",
            "Practice the '30-second rule': if you've been thinking for 30 seconds without progress, play the move you had at the 15-second mark. Perfectionism is time's enemy.",
          ],
        };
      if (value >= 30)
        return {
          verdict: "Erratic",
          desc: "Your time usage is inconsistent — you're frequently getting into time trouble or spending disproportionate time on early moves.",
          tip: "Use an increment time control (e.g. 10+5) to build better pacing habits before moving to non-increment games.",
          analysis: `A score of ${value} indicates significant time management issues. Common patterns include: spending 20%+ of your total time in the first 5-10 moves (often replaying preparation you should know), long tanks on positions that don't warrant deep calculation, and then scrambling with very little time left for genuinely critical decisions. This isn't about thinking speed — it's about thinking allocation.`,
          meaning: "In practical terms, you're probably playing many of your critical moves — the ones that decide the game — with a fraction of the time you should have. A player with your same tactical and positional ability but better time management would score significantly higher. You're effectively handicapping yourself every game.",
          studyPlan: [
            "Play 5 games where you deliberately spend less than 5 seconds on each of the first 10 moves. This breaks the habit of re-analyzing known positions over the board.",
            "Switch to increment games (10+5 or 15+10) exclusively for 2 weeks. The increment safety net builds confidence in committing to moves faster.",
            "After each game, calculate what percentage of your total time was spent in the first 10 moves vs the rest. Aim for under 20%.",
          ],
        };
      return {
        verdict: "Time Trouble",
        desc: "You frequently run very low on time, and your move pacing is highly uneven. This is likely costing you multiple games.",
        tip: "Start with slower time controls with increment. Focus on making any reasonable move within 15 seconds — speed of decision matters more than perfection.",
        analysis: `With a score of ${value}, time management is a major weakness. You're likely getting into severe time trouble in most games, spending heavily in the opening or early middlegame and then being forced to blitz out critical moves. The clock is essentially an extra opponent that's beating you in many games before your actual opponent does.`,
        meaning: "This is likely your single biggest practical weakness. Improving your time management would improve your results more than any amount of tactical training or opening study, because those skills only work when you have time to use them. Many of your losses probably happen in positions where you had a good or even winning position but couldn't convert due to time pressure.",
        studyPlan: [
          "Play 20 games of 15+10 where your only goal is to never drop below 3 minutes remaining. Don't worry about winning — just manage the clock.",
          "Build a simple opening repertoire you can play on autopilot in 10 seconds per move for the first 8 moves. This banks time immediately.",
          "Practice decision-making speed with puzzle rush or timed tactics: the goal is getting faster at committing to a move, not finding the perfect one.",
        ],
      };
    }

    case "Resilience": {
      if (value >= 75)
        return {
          verdict: "Rock-Solid",
          desc: "You maintain quality even in uncomfortable positions — strong mental game combined with good fundamentals.",
          tip: "Push yourself with harder challenges: play up in rating pools or try classical time controls where precision matters more.",
          analysis: "Your resilience score combines accuracy and composure — two skills that together determine how you perform under real game conditions. A score this high means you're not just good in a vacuum; you maintain your level when positions get messy, when you're under time pressure, and when things aren't going according to plan. This is the hallmark of a tournament-tough player.",
          meaning: "In tournament contexts, resilience is often the deciding factor. Two players with similar skills but different resilience scores will have dramatically different results in long events. You're the kind of player who's dangerous even from worse positions because opponents know you won't crack and hand them the game.",
          studyPlan: [
            "Challenge yourself with harder competition: play up in rating pools, enter tournaments, or try longer time controls where sustained quality matters most.",
            "Study defensive techniques specifically — exchange sacrifices, fortress constructions, and counterattacking resources. Making your resilience even more active.",
            "Maintain your mental game with good habits: sleep, hydration, and breaks between tournament games. Resilience is partly physical.",
          ],
        };
      if (value >= 50)
        return {
          verdict: "Durable",
          desc: "You mostly hold it together but can falter when things get messy. Your baseline skills carry you through most positions.",
          tip: "Practice playing slightly worse positions on purpose. Defending well is a trainable skill — and it frustrates opponents.",
          analysis: "Your accuracy and composure are both reasonable, giving you enough resilience to handle normal game situations. However, when both are tested simultaneously — for example, a complex position where you're slightly worse and low on time — cracks can appear. Your quality drops more than it should when multiple stressors combine.",
          meaning: "In most games, your resilience is fine. But in critical tournament games or positions where everything is on the line, you're likely to perform below your normal level. The gap between your 'comfortable game' quality and your 'under pressure' quality is where rating points get lost.",
          studyPlan: [
            "Practice defending worse positions intentionally: set up engines to give you slightly worse endgames and try to hold the draw. This builds comfort with adversity.",
            "When you make a mistake in a game, make a conscious effort to reset emotionally before the next move. The 'tilt cascade' — where one error leads to several more — is your biggest risk.",
            "Study practical endgames: knowing that certain positions are drawn or won regardless of details gives you confidence that shores up resilience.",
          ],
        };
      if (value >= 30)
        return {
          verdict: "Brittle",
          desc: "When your accuracy drops or pressure mounts, the quality of your play deteriorates quickly.",
          tip: "Work on composure first — that's the bigger contributor to this score. Even small improvements in blunder-avoidance will boost resilience.",
          analysis: "Your resilience is limited by weaknesses in both accuracy and composure. When the position demands precise play AND emotional control, your results suffer significantly. This often manifests as games where a single mistake triggers a collapse — you go from a playable position to a lost one in just 2-3 moves because the first error rattles you into making more.",
          meaning: "This pattern probably feels familiar: you play well for 20 moves, then one bad move leads to two more, and suddenly the game is over. Opponents who recognize this pattern (even subconsciously) will play provocatively against you, creating complications because they know you're more likely to crack than play precisely under pressure.",
          studyPlan: [
            "Prioritize composure training (see the Composure card) — it contributes 70% of this score. Reducing blunders will have the biggest single impact on resilience.",
            "After a mistake, take a deliberate 30-second pause. Get a drink of water. Look away from the board. Break the emotional response before choosing your next move.",
            "Practice playing 'boring' chess: solid, defensive positions where the goal is simply not to lose rather than to win. Building defensive patience improves resilience more than any offensive skill.",
          ],
        };
      return {
        verdict: "Fragile",
        desc: "Both accuracy and composure are low, meaning you struggle to maintain any consistency when the position gets complex.",
        tip: "Simplify your openings. Play solid, well-known structures with fewer tactical complications until your fundamentals improve.",
        analysis: "A low resilience score reflects foundational weaknesses in both opening accuracy and blunder-avoidance. Complex, sharp positions are your kryptonite because they demand both precise knowledge and emotional steadiness — and both are currently areas of growth for you. Your play likely has high variance: occasionally solid games followed by rapid collapses.",
        meaning: "In practical terms, your results are unpredictable. You can beat players rated significantly higher than you on a good day, but you can also lose to much weaker players when things go wrong. Stabilizing your play — reducing the lows rather than trying to reach higher highs — is the fastest path to sustainable improvement.",
        studyPlan: [
          "Simplify everything: play solid, low-theory openings (London System, Caro-Kann) where the positions are calm and the right moves are logical rather than memorized.",
          "Address the Composure dimension first. If you can cut your blunder rate, that alone will stabilize your games and build the foundation for everything else.",
          "Set a realistic goal: try to reduce your variance rather than increasing your peak. Aim to have zero 'collapse games' in your next 20 rather than one brilliant game.",
        ],
      };
    }

    default:
      return { verdict: "", desc: "", tip: "", analysis: "", meaning: "", studyPlan: ["", "", ""] };
  }
}

/**
 * RadarLegend — shows each dimension with its score, dynamic assessment, and tailored tips.
 */
export function RadarLegend({ data, props }: { data: RadarDimension[]; props: RadarProps }) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  // Derive overall assessment
  const avg = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length);
  const sorted = [...data].sort((a, b) => a.value - b.value);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  return (
    <div className="space-y-3">
      {/* Overall summary sentence */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11px] leading-relaxed text-slate-400">
        {avg >= 75 ? (
          <>Strong overall profile ({avg}/100). Your biggest edge is <span className="font-semibold text-emerald-400">{strongest.dimension}</span> — keep leveraging it.</>
        ) : avg >= 50 ? (
          <>Solid foundation ({avg}/100). <span className="font-semibold text-emerald-400">{strongest.dimension}</span> is your strength; <span className="font-semibold text-amber-400">{weakest.dimension}</span> ({weakest.value}) is holding you back the most.</>
        ) : avg >= 30 ? (
          <>Room to grow ({avg}/100). Focus on <span className="font-semibold text-amber-400">{weakest.dimension}</span> ({weakest.value}) first — it&apos;s your biggest bottleneck. <span className="font-semibold text-cyan-400">{strongest.dimension}</span> ({strongest.value}) shows promise.</>
        ) : (
          <>Developing player ({avg}/100). Start with <span className="font-semibold text-red-400">{weakest.dimension}</span> — even small gains there will have the biggest impact on your results.</>
        )}
      </div>

      {/* Dimension rows */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {data.map((d) => {
          const insight = getDimInsight(d.dimension, d.value, props);
          const isExpanded = expandedDim === d.dimension;
          const color =
            d.value >= 75
              ? "text-emerald-400"
              : d.value >= 50
                ? "text-cyan-400"
                : d.value >= 30
                  ? "text-amber-400"
                  : "text-red-400";
          const bg =
            d.value >= 75
              ? "bg-emerald-400"
              : d.value >= 50
                ? "bg-cyan-400"
                : d.value >= 30
                  ? "bg-amber-400"
                  : "bg-red-400";
          const verdictColor =
            d.value >= 75
              ? "text-emerald-400/90"
              : d.value >= 50
                ? "text-cyan-400/90"
                : d.value >= 30
                  ? "text-amber-400/90"
                  : "text-red-400/90";

          return (
            <div key={d.dimension}>
              <button
                type="button"
                onClick={() => setExpandedDim(isExpanded ? null : d.dimension)}
                className="flex w-full items-center gap-3 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs font-medium text-white/60">
                      {d.dimension}
                      <svg className="h-3 w-3 text-white/20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium ${verdictColor}`}>{insight.verdict}</span>
                      <span className={`text-xs font-bold ${color}`}>{d.value}</span>
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/5">
                    <div
                      className={`h-1 rounded-full ${bg} transition-all duration-700`}
                      style={{ width: `${d.value}%`, opacity: 0.7 }}
                    />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="animate-fade-in mt-1.5 mb-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11px] leading-relaxed">
                  <p className="text-slate-400">{insight.desc}</p>
                  <p className="mt-1.5 text-slate-500">
                    <span className="font-semibold text-emerald-400/80">How to improve:</span>{" "}
                    {insight.tip}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
