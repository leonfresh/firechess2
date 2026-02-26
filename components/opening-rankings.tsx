"use client";

/**
 * OpeningRankings — ranks all the user's openings from weakest to strongest
 * based on aggregated leak data and win/loss stats.
 */

import { useEffect, useMemo, useState } from "react";
import { fetchExplorerMoves } from "@/lib/lichess-explorer";
import type { RepeatedOpeningLeak } from "@/lib/types";

type OpeningAgg = {
  name: string;
  fens: Set<string>;
  totalLeaks: number;
  totalOneOffs: number;
  avgCpLoss: number;
  worstCpLoss: number;
  totalGames: number;    // sum of reachCount across positions
  userWins: number;
  userDraws: number;
  userLosses: number;
  /** Computed health score 0-100 (higher = better) */
  health: number;
};

type Props = {
  leaks: RepeatedOpeningLeak[];
  oneOffMistakes: RepeatedOpeningLeak[];
};

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

/** Compute a health score from aggregate stats. */
function computeHealth(agg: {
  avgCpLoss: number;
  worstCpLoss: number;
  totalLeaks: number;
  totalOneOffs: number;
  userWins: number;
  userDraws: number;
  userLosses: number;
}): number {
  // 1. CPL penalty: lower avg CPL = better (0-80 maps to 100-20)
  const cplScore = clamp(100 - agg.avgCpLoss * 1.0);

  // 2. Frequency penalty: more leaks = worse
  const leakPenalty = Math.min(40, (agg.totalLeaks + agg.totalOneOffs * 0.5) * 8);

  // 3. Win rate bonus
  const total = agg.userWins + agg.userDraws + agg.userLosses;
  const winRate = total > 0 ? (agg.userWins + agg.userDraws * 0.5) / total : 0.5;
  const winBonus = (winRate - 0.5) * 40; // ±20

  return clamp(Math.round(cplScore - leakPenalty + winBonus));
}

function healthColor(h: number) {
  if (h >= 70) return "text-emerald-400";
  if (h >= 45) return "text-amber-400";
  return "text-red-400";
}
function healthBg(h: number) {
  if (h >= 70) return "bg-emerald-500/15";
  if (h >= 45) return "bg-amber-500/15";
  return "bg-red-500/15";
}
function healthBorder(h: number) {
  if (h >= 70) return "border-emerald-500/20";
  if (h >= 45) return "border-amber-500/20";
  return "border-red-500/20";
}
function healthBarBg(h: number) {
  if (h >= 70) return "bg-emerald-400";
  if (h >= 45) return "bg-amber-400";
  return "bg-red-400";
}
function healthLabel(h: number) {
  if (h >= 80) return "Excellent";
  if (h >= 65) return "Solid";
  if (h >= 50) return "Shaky";
  if (h >= 35) return "Weak";
  return "Critical";
}
function healthIcon(h: number) {
  if (h >= 70) return "✅";
  if (h >= 45) return "⚠️";
  return "🔴";
}

export function OpeningRankings({ leaks, oneOffMistakes }: Props) {
  const allPositions = useMemo(() => {
    const all = [...leaks, ...oneOffMistakes];
    // Deduplicate by FEN
    const map = new Map<string, RepeatedOpeningLeak[]>();
    for (const item of all) {
      const arr = map.get(item.fenBefore) ?? [];
      arr.push(item);
      map.set(item.fenBefore, arr);
    }
    return map;
  }, [leaks, oneOffMistakes]);

  const [openingNames, setOpeningNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch opening names for all unique FENs
  useEffect(() => {
    if (allPositions.size === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchNames = async () => {
      const names = new Map<string, string>();
      const fens = Array.from(allPositions.keys());

      // Batch in groups of 4 to not overload API
      for (let i = 0; i < fens.length; i += 4) {
        if (cancelled) break;
        const batch = fens.slice(i, i + 4);
        const results = await Promise.allSettled(
          batch.map(async (fen) => {
            const items = allPositions.get(fen)!;
            const side = items[0].sideToMove;
            const result = await fetchExplorerMoves(fen, side);
            if (result.openingName) {
              names.set(fen, result.openingName);
            }
          })
        );
      }

      if (!cancelled) {
        setOpeningNames(names);
        setLoading(false);
      }
    };

    fetchNames();
    return () => { cancelled = true; };
  }, [allPositions]);

  // Aggregate by opening name
  const rankings = useMemo(() => {
    if (loading) return [];

    const byOpening = new Map<string, {
      fens: Set<string>;
      leaks: RepeatedOpeningLeak[];
      oneOffs: RepeatedOpeningLeak[];
    }>();

    for (const [fen, items] of allPositions) {
      const name = openingNames.get(fen) ?? "Unknown Opening";
      let agg = byOpening.get(name);
      if (!agg) {
        agg = { fens: new Set(), leaks: [], oneOffs: [] };
        byOpening.set(name, agg);
      }
      agg.fens.add(fen);
      for (const item of items) {
        const isLeak = leaks.includes(item);
        if (isLeak) agg.leaks.push(item);
        else agg.oneOffs.push(item);
      }
    }

    const result: OpeningAgg[] = [];
    for (const [name, agg] of byOpening) {
      const allItems = [...agg.leaks, ...agg.oneOffs];
      const totalCp = allItems.reduce((s, l) => s + l.cpLoss, 0);
      const avgCp = allItems.length > 0 ? totalCp / allItems.length : 0;
      const worstCp = allItems.reduce((s, l) => Math.max(s, l.cpLoss), 0);
      const totalGames = allItems.reduce((s, l) => s + l.reachCount, 0);
      const uw = allItems.reduce((s, l) => s + (l.userWins ?? 0), 0);
      const ud = allItems.reduce((s, l) => s + (l.userDraws ?? 0), 0);
      const ul = allItems.reduce((s, l) => s + (l.userLosses ?? 0), 0);

      const health = computeHealth({
        avgCpLoss: avgCp,
        worstCpLoss: worstCp,
        totalLeaks: agg.leaks.length,
        totalOneOffs: agg.oneOffs.length,
        userWins: uw,
        userDraws: ud,
        userLosses: ul,
      });

      result.push({
        name,
        fens: agg.fens,
        totalLeaks: agg.leaks.length,
        totalOneOffs: agg.oneOffs.length,
        avgCpLoss: Math.round(avgCp),
        worstCpLoss: Math.round(worstCp),
        totalGames,
        userWins: uw,
        userDraws: ud,
        userLosses: ul,
        health,
      });
    }

    // Sort weakest first
    result.sort((a, b) => a.health - b.health);
    return result;
  }, [loading, allPositions, openingNames, leaks]);

  if (allPositions.size === 0) return null;

  if (loading) {
    return (
      <div className="glass-card border-indigo-500/15 bg-gradient-to-r from-indigo-500/[0.04] to-transparent p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-3xl shadow-lg shadow-indigo-500/10 animate-pulse">📊</span>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Opening Health Rankings</h2>
            <p className="mt-1 text-sm text-slate-400 animate-pulse">Identifying your openings…</p>
          </div>
        </div>
      </div>
    );
  }

  if (rankings.length === 0) return null;

  const weakest = rankings[0];
  const strongest = rankings[rankings.length - 1];

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="glass-card border-indigo-500/15 bg-gradient-to-r from-indigo-500/[0.04] to-transparent p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-3xl shadow-lg shadow-indigo-500/10">📊</span>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Opening Health Rankings
              <span className="ml-3 inline-flex items-center rounded-full bg-indigo-500/15 px-3 py-1 text-sm font-bold text-indigo-400">
                {rankings.length} opening{rankings.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {rankings.length >= 2 ? (
                <>
                  Weakest: <span className="font-semibold text-red-400">{weakest.name}</span> ({weakest.health}/100)
                  {" · "}
                  Strongest: <span className="font-semibold text-emerald-400">{strongest.name}</span> ({strongest.health}/100)
                </>
              ) : (
                <>Your openings ranked by overall health — mistakes, frequency, and outcomes.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Rankings list */}
      <div className="space-y-2">
        {rankings.map((opening, idx) => {
          const total = opening.userWins + opening.userDraws + opening.userLosses;
          const winPct = total > 0 ? Math.round((opening.userWins / total) * 100) : null;

          return (
            <div
              key={opening.name}
              className={`group rounded-xl border ${healthBorder(opening.health)} bg-gradient-to-r from-white/[0.02] to-transparent p-4 transition-all duration-200 hover:bg-white/[0.03]`}
            >
              <div className="flex items-center gap-4">
                {/* Rank number */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${healthBg(opening.health)} text-sm font-black ${healthColor(opening.health)}`}>
                  #{idx + 1}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold text-white text-sm sm:text-base">{opening.name}</h3>
                    <span className="text-sm">{healthIcon(opening.health)}</span>
                  </div>

                  {/* Health bar */}
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]">
                      <div
                        className={`h-1.5 rounded-full ${healthBarBg(opening.health)} transition-all duration-700`}
                        style={{ width: `${opening.health}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${healthColor(opening.health)}`}>{opening.health}</span>
                  </div>

                  {/* Stats row */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span>{opening.totalLeaks} leak{opening.totalLeaks !== 1 ? "s" : ""}</span>
                    {opening.totalOneOffs > 0 && (
                      <span>{opening.totalOneOffs} one-off{opening.totalOneOffs !== 1 ? "s" : ""}</span>
                    )}
                    <span>avg {opening.avgCpLoss}cp loss</span>
                    {winPct !== null && total >= 2 && (
                      <span className={winPct >= 55 ? "text-emerald-400/70" : winPct >= 45 ? "text-amber-400/70" : "text-red-400/70"}>
                        {winPct}% win rate ({total} games)
                      </span>
                    )}
                  </div>
                </div>

                {/* Health label */}
                <div className="hidden shrink-0 text-right sm:block">
                  <span className={`text-xs font-semibold ${healthColor(opening.health)}`}>
                    {healthLabel(opening.health)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
