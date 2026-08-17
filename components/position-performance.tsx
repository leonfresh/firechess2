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

    const worstByLossRate = [...withGames]
      .map((l) => ({
        leak: l,
        lossRate: openCount(l) > 0 ? (l.userLosses ?? 0) / openCount(l) : 0,
      }))
      .filter(({ lossRate }) => lossRate > 0.4) // only positions you actually lose from
      .sort((a, b) => {
        const aScore = a.lossRate * (a.leak.reachCount || 1);
        const bScore = b.lossRate * (b.leak.reachCount || 1);
        return bScore - aScore;
      })
      .map(({ leak }) => leak)
      .slice(0, limit);

    const bestByWinRate = [...withGames]
      .map((l) => ({
        leak: l,
        winRateVal: openCount(l) > 0 ? (l.userWins ?? 0) / openCount(l) : 0,
      }))
      .filter(({ winRateVal }) => winRateVal > 0.5)
      .sort((a, b) => {
        const aScore = a.winRateVal * (a.leak.reachCount || 1);
        const bScore = b.winRateVal * (b.leak.reachCount || 1);
        return bScore - aScore;
      })
      .map(({ leak }) => leak)
      .slice(0, limit);

    return { worst: worstByLossRate, best: bestByWinRate };
  }, [leaks, limit]);

  if (worst.length === 0 && best.length === 0) return null;

  return (
    <section id="section-position-performance" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#565061]">
            Position Performance
          </p>
          <h3 className="text-xl font-bold text-white">
            Positions you own &amp; positions that own you
          </h3>
          <p className="mt-1 text-sm text-[#8d8696]">
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
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#1e1a24] py-4 text-xs text-[#565061]">
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
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#1e1a24] py-4 text-xs text-[#565061]">
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
  const lossRate = total > 0 ? losses / total : 0;

  return (
    <div className="flex gap-3 rounded-xl border border-[#1e1a24] bg-black/20 p-3">
      {/* Mini board */}
      <div className="h-[120px] w-[120px] shrink-0 overflow-hidden rounded-lg border border-[#1e1a24]">
        <Chessboard
          position={leak.fenBefore}
          boardWidth={120}
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
        <p className="mt-0.5 text-[10px] text-[#565061]">
          Reached {leak.reachCount || total} times · {total} games
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${type === "worst" ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
            {type === "worst"
              ? `${(lossRate * 100).toFixed(0)}% loss rate`
              : `${(wr * 100).toFixed(0)}% win rate`}
          </span>
          <span className="rounded bg-[#ff5a1f]/[0.08] px-1.5 py-0.5 text-[9px] font-bold text-[#ff8c42]">
            {(leak.cpLoss / 100).toFixed(1)} avg cp
          </span>
        </div>
        <p className="mt-1 text-[9px] text-[#565061]">
          {wins}W / {losses}L / {leak.userDraws ?? 0}D
        </p>
      </div>
    </div>
  );
}
