"use client";

import type { StructuralReport } from "@/lib/types";

/** Structural color palette per axis */
const AXIS_META: Record<string, { label: string; icon: string; bar: string; bg: string }> = {
  fianchetto: { label: "Fianchetto", icon: "🏰", bar: "bg-emerald-400", bg: "bg-emerald-500/10" },
  doubleFianchetto: { label: "Double Fianchetto", icon: "🏯", bar: "bg-emerald-300", bg: "bg-emerald-500/8" },
  centerType: { label: "Center Type", icon: "🎯", bar: "bg-blue-400", bg: "bg-blue-500/10" },
  castling: { label: "Castling", icon: "🏁", bar: "bg-[#ff5a1f]", bg: "bg-[#ff5a1f]/[0.08]" },
  iqp: { label: "IQP", icon: "💎", bar: "bg-[#ff5a1f]", bg: "bg-[#ff5a1f]/[0.08]" },
  pawnStructure: { label: "Pawn Structure", icon: "🧱", bar: "bg-rose-400", bg: "bg-rose-500/10" },
  kingSafety: { label: "King Safety", icon: "👑", bar: "bg-[#ff5a1f]", bg: "bg-[#ff5a1f]/[0.08]" },
  pawnChain: { label: "Pawn Chains", icon: "⛓️", bar: "bg-orange-400", bg: "bg-orange-500/10" },
};

type Props = {
  report: StructuralReport;
};

function patternLabel(axis: string, pattern: string): string {
  if (axis === "fianchetto" || axis === "doubleFianchetto") {
    if (pattern === "single") return "Your Single";
    if (pattern === "double") return "Your Double";
    if (pattern === "none") return "None";
    if (pattern === "not-double") return "Not Double";
    if (pattern.startsWith("opponent-")) return `Opponent ${pattern.replace("opponent-", "")}`;
  }
  if (axis === "centerType" || axis === "castling") return pattern.charAt(0).toUpperCase() + pattern.slice(1);
  if (axis === "iqp") {
    if (pattern === "user-iqp") return "Your IQP";
    if (pattern === "opponent-iqp") return "Opponent IQP";
    return "No IQP";
  }
  if (axis === "pawnStructure") {
    if (pattern === "shattered") return "Your Shattered";
    if (pattern === "isolated") return "Your Isolated";
    if (pattern === "doubled") return "Your Doubled";
    if (pattern === "healthy") return "Your Healthy";
    if (pattern === "no-pawns") return "No Pawns";
    return `Your ${pattern.charAt(0).toUpperCase() + pattern.slice(1)}`;
  }
  if (pattern.startsWith("chain-")) return `Chain-${pattern.replace("chain-", "")}`;
  return pattern.charAt(0).toUpperCase() + pattern.slice(1);
}

function winRateColor(wr: number): string {
  if (wr >= 55) return "text-emerald-400";
  if (wr >= 45) return "text-[#ff8c42]";
  return "text-red-400";
}

function winRateBarColor(wr: number): string {
  if (wr >= 55) return "bg-emerald-400";
  if (wr >= 45) return "bg-[#ff5a1f]";
  return "bg-red-400";
}

export function ScanStructuralStats({ report }: Props) {
  const { byAxis, topInsights } = report;
  const orderedAxes = Object.keys(AXIS_META).filter((a) => byAxis[a]?.length > 0);

  if (orderedAxes.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-[1.5rem] border border-[#1e1a24] bg-[#ff5a1f]/[0.04] p-5 sm:p-6">
        <h3 className="text-lg font-bold text-white">🏗️ Positional Structure</h3>
        <p className="mt-1 text-sm text-[#8d8696]">
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
              className="rounded-xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] px-4 py-3 text-sm text-[#ff8c42]"
            >
              <span className="font-semibold">💡 {insight.text}</span>
              <span className="ml-2 text-xs text-[#565061]">
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
              className="rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{meta.icon}</span>
                <span className="text-sm font-semibold text-white">
                  {meta.label}
                </span>
                <span className="ml-auto text-xs text-[#565061]">
                  {totalGames}g
                </span>
              </div>

              <div className="space-y-3">
                {entries.slice(0, 4).map((entry) => {
                  const pct = entry.winPct;
                  return (
                    <div key={entry.pattern}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-[#f0edf2] font-medium">
                          {patternLabel(axis, entry.pattern)}
                        </span>
                        <span className={winRateColor(pct)}>
                          {pct}%
                        </span>
                      </div>
                      {/* Win/Draw/Loss bar */}
                      <div className="mb-1 flex h-2 overflow-hidden rounded-full bg-[#1e1a24]">
                        {entry.wins > 0 && (
                          <div
                            className="bg-emerald-400 transition-all"
                            style={{ width: `${(entry.wins / entry.games) * 100}%` }}
                          />
                        )}
                        {entry.draws > 0 && (
                          <div
                            className="bg-[#ff5a1f] transition-all"
                            style={{ width: `${(entry.draws / entry.games) * 100}%` }}
                          />
                        )}
                        {entry.losses > 0 && (
                          <div
                            className="bg-red-400 transition-all"
                            style={{ width: `${(entry.losses / entry.games) * 100}%` }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#565061]">
                        <span className="text-emerald-400 font-medium">{entry.wins}W</span>
                        <span className="text-[#ff8c42] font-medium">{entry.draws}D</span>
                        <span className="text-red-400 font-medium">{entry.losses}L</span>
                        <span className="ml-auto">{entry.games} game{entry.games !== 1 ? "s" : ""}</span>
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
        <div className="rounded-[1.5rem] border border-[#1e1a24] bg-[#ff5a1f]/[0.04] p-5 sm:p-6">
          <h4 className="mb-3 text-sm font-semibold text-[#f0edf2]">
            Your Structural Strengths
          </h4>
          <div className="space-y-2">
            {topInsights.slice(0, 3).map((insight, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
                <div>
                  <span className="text-[#f0edf2]">
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
