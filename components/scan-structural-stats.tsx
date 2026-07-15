"use client";

import type { StructuralReport } from "@/lib/types";

/** Structural color palette per axis */
const AXIS_META: Record<string, { label: string; icon: string; bar: string; bg: string }> = {
  fianchetto: { label: "Fianchetto", icon: "🏰", bar: "bg-emerald-400", bg: "bg-emerald-500/10" },
  doubleFianchetto: { label: "Double Fianchetto", icon: "🏯", bar: "bg-emerald-300", bg: "bg-emerald-500/8" },
  centerType: { label: "Center Type", icon: "🎯", bar: "bg-blue-400", bg: "bg-blue-500/10" },
  castling: { label: "Castling", icon: "🏁", bar: "bg-violet-400", bg: "bg-violet-500/10" },
  iqp: { label: "IQP", icon: "💎", bar: "bg-amber-400", bg: "bg-amber-500/10" },
  pawnStructure: { label: "Pawn Structure", icon: "🧱", bar: "bg-rose-400", bg: "bg-rose-500/10" },
  kingSafety: { label: "King Safety", icon: "👑", bar: "bg-cyan-400", bg: "bg-cyan-500/10" },
  pawnChain: { label: "Pawn Chains", icon: "⛓️", bar: "bg-orange-400", bg: "bg-orange-500/10" },
};

type Props = {
  report: StructuralReport;
};

function patternLabel(axis: string, pattern: string): string {
  if (axis === "fianchetto" || axis === "doubleFianchetto") {
    if (pattern === "single") return "Single";
    if (pattern === "double") return "Double";
    if (pattern === "none") return "None";
    if (pattern === "not-double") return "Not Double";
    if (pattern.startsWith("opponent-")) return `Opponent ${pattern.replace("opponent-", "")}`;
  }
  if (axis === "centerType") return pattern.charAt(0).toUpperCase() + pattern.slice(1);
  if (axis === "iqp") {
    if (pattern === "white-iqp") return "White IQP";
    if (pattern === "black-iqp") return "Black IQP";
    return "No IQP";
  }
  if (pattern.startsWith("chain-")) return `${pattern.replace("chain-", "Chain-")}`;
  return pattern.charAt(0).toUpperCase() + pattern.slice(1);
}

function winRateColor(wr: number): string {
  if (wr >= 55) return "text-emerald-400";
  if (wr >= 45) return "text-amber-400";
  return "text-red-400";
}

function winRateBarColor(wr: number): string {
  if (wr >= 55) return "bg-emerald-400";
  if (wr >= 45) return "bg-amber-400";
  return "bg-red-400";
}

export function ScanStructuralStats({ report }: Props) {
  const { byAxis, topInsights } = report;
  const orderedAxes = Object.keys(AXIS_META).filter((a) => byAxis[a]?.length > 0);

  if (orderedAxes.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <h3 className="text-lg font-bold text-white">🏗️ Positional Structure</h3>
        <p className="mt-1 text-sm text-slate-400">
          How your win rate shifts depending on the pawn structure and piece
          placement in your games.
        </p>
      </div>

      {/* Insights */}
      {topInsights.length > 0 && (
        <div className="space-y-2">
          {topInsights.slice(0, 3).map((insight, i) => (
            <div
              key={i}
              className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] px-4 py-3 text-sm text-cyan-300"
            >
              <span className="font-semibold">💡 {insight.text}</span>
              <span className="ml-2 text-xs text-slate-500">
                ({insight.axis})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Axes */}
      <div className="grid gap-3 sm:grid-cols-2">
        {orderedAxes.map((axis) => {
          const meta = AXIS_META[axis];
          const entries = byAxis[axis];
          const totalGames = entries.reduce((s, e) => s + e.games, 0);
          const bestEntry = [...entries].sort((a, b) => b.winPct - a.winPct)[0];

          return (
            <div
              key={axis}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{meta.icon}</span>
                <span className="text-sm font-semibold text-white">
                  {meta.label}
                </span>
                <span className="ml-auto text-xs text-slate-500">
                  {totalGames}g
                </span>
              </div>

              <div className="space-y-2">
                {entries.slice(0, 4).map((entry) => {
                  const pct = entry.winPct;
                  return (
                    <div key={entry.pattern}>
                      <div className="mb-0.5 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          {patternLabel(axis, entry.pattern)}
                        </span>
                        <span className={winRateColor(pct)}>
                          {pct}% ({entry.games})
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full transition-all ${winRateBarColor(pct)}`}
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Best pattern highlight */}
      {topInsights.length > 0 && (
        <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
          <h4 className="mb-3 text-sm font-semibold text-slate-300">
            Your Structural Strengths
          </h4>
          <div className="space-y-2">
            {topInsights.slice(0, 3).map((insight, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
                <div>
                  <span className="text-slate-300">
                    You win{" "}
                    <span className="font-bold text-emerald-400">
                      {insight.best.winPct}%
                    </span>{" "}
                    of games with <strong>{insight.best.pattern}</strong>{" "}
                    positions ({insight.best.games} games)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
