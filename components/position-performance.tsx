"use client";

import { useMemo } from "react";
import { Chessboard } from "@/components/chessboard-compat";
import type { RepeatedOpeningLeak } from "@/lib/types";
import { Trophy, Skull, Lock, Sparkles } from "lucide-react";

type PositionPerformanceProps = {
  leaks: RepeatedOpeningLeak[];
  hasProAccess: boolean;
};

const FREE_LIMIT = 3;
const PRO_LIMIT = 10;

function openCount(leak: RepeatedOpeningLeak): number {
  return (leak.userWins ?? 0) + (leak.userLosses ?? 0) + (leak.userDraws ?? 0);
}

function winRate(leak: RepeatedOpeningLeak): number {
  const total = openCount(leak);
  return total > 0 ? (leak.userWins ?? 0) / total : 0;
}

export function PositionPerformance({ leaks, hasProAccess }: PositionPerformanceProps) {
  const limit = hasProAccess ? PRO_LIMIT : FREE_LIMIT;

  const { worst, best } = useMemo(() => {
    const withGames = leaks.filter((l) => openCount(l) >= 2 && l.fenBefore);

    const worstByDamage = [...withGames]
      .sort((a, b) => {
        const aScore = (a.reachCount || 1) * a.cpLoss;
        const bScore = (b.reachCount || 1) * b.cpLoss;
        return bScore - aScore;
      })
      .slice(0, limit);

    const bestByWinRate = [...withGames]
      .filter((l) => winRate(l) > 0.5)
      .sort((a, b) => {
        const aScore = winRate(a) * (a.reachCount || 1);
        const bScore = winRate(b) * (b.reachCount || 1);
        return bScore - aScore;
      })
      .slice(0, limit);

    return { worst: worstByDamage, best: bestByWinRate };
  }, [leaks, limit]);

  if (worst.length === 0 && best.length === 0) return null;

  return (
    <section id="section-position-performance" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Position Performance
          </p>
          <h3 className="text-xl font-bold text-white">
            Positions you own &amp; positions that own you
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Your best and worst recurring positions, ranked by frequency and impact.
          </p>
        </div>
        {!hasProAccess && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-orange-300">
            <Lock className="h-3 w-3" />
            Pro shows up to 10
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Worst positions */}
        <div className="rounded-[1.75rem] border border-red-500/10 bg-red-500/[0.03] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Skull className="h-5 w-5 text-red-400" />
            <h4 className="text-sm font-bold text-white">Toughest positions</h4>
            <span className="ml-auto rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
              {worst.length}
            </span>
          </div>
          <div className="space-y-3">
            {worst.map((leak, i) => (
              <PositionCard key={i} leak={leak} type="worst" />
            ))}
            {!hasProAccess && worst.length < PRO_LIMIT && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.06] py-4 text-xs text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                Upgrade to Pro for up to 10 positions
              </div>
            )}
          </div>
        </div>

        {/* Best positions */}
        <div className="rounded-[1.75rem] border border-emerald-500/10 bg-emerald-500/[0.03] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Strongest positions</h4>
            <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              {best.length}
            </span>
          </div>
          <div className="space-y-3">
            {best.map((leak, i) => (
              <PositionCard key={i} leak={leak} type="best" />
            ))}
            {!hasProAccess && best.length < PRO_LIMIT && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.06] py-4 text-xs text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                Upgrade to Pro for up to 10 positions
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PositionCard({ leak, type }: { leak: RepeatedOpeningLeak; type: "best" | "worst" }) {
  const total = openCount(leak);
  const wr = winRate(leak);
  const losses = leak.userLosses ?? 0;
  const wins = leak.userWins ?? 0;

  return (
    <div className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
      {/* Mini board */}
      <div className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-lg border border-white/[0.06]">
        <Chessboard
          position={leak.fenBefore}
          boardWidth={80}
          arePiecesDraggable={false}
          customDarkSquareStyle={{ backgroundColor: "#779952" }}
          customLightSquareStyle={{ backgroundColor: "#edeed1" }}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-white">
          {leak.openingName || "Unknown position"}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500">
          Reached {leak.reachCount || total} times · {total} games
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${type === "worst" ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
            {wr >= 0.5 ? `${(wr * 100).toFixed(0)}%` : `${((1 - wr) * 100).toFixed(0)}%`} {type === "worst" ? "loss rate" : "win rate"}
          </span>
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
            −{(leak.cpLoss / 100).toFixed(1)} avg cp
          </span>
        </div>
        {type === "worst" && losses > 2 && (
          <p className="mt-1 text-[9px] text-slate-500">
            {wins}W / {losses}L / {leak.userDraws ?? 0}D
          </p>
        )}
      </div>
    </div>
  );
}
