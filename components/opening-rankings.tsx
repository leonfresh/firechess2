"use client";

/**
 * OpeningRankings — shows ALL openings the user played across the scan,
 * with mini board positions, color badges, and win/draw/loss stats.
 * Sorted from lowest win rate to highest.
 */

import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { fetchExplorerMoves } from "@/lib/lichess-explorer";
import type { OpeningSummary, PlayerColor } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type OpeningEntry = {
  key: string;
  fen: string;
  userColor: PlayerColor;
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number; // 0-100
};

type Props = {
  openingSummaries: OpeningSummary[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function winRateColor(wr: number) {
  if (wr >= 55) return "text-emerald-400";
  if (wr >= 45) return "text-amber-400";
  return "text-red-400";
}

function winRateBarBg(wr: number) {
  if (wr >= 55) return "bg-emerald-400";
  if (wr >= 45) return "bg-amber-400";
  return "bg-red-400";
}

function winRateBadgeBg(wr: number) {
  if (wr >= 55) return "bg-emerald-500/15";
  if (wr >= 45) return "bg-amber-500/15";
  return "bg-red-500/15";
}

function winRateLabel(wr: number) {
  if (wr >= 65) return "Strong";
  if (wr >= 55) return "Good";
  if (wr >= 45) return "Even";
  if (wr >= 35) return "Weak";
  return "Struggling";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OpeningRankings({ openingSummaries }: Props) {
  /* ── 1. Group summaries by (FEN + userColor) ── */
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { fen: string; userColor: PlayerColor; games: number; wins: number; draws: number; losses: number }
    >();

    for (const s of openingSummaries) {
      const key = `${s.fen}::${s.userColor}`;
      const agg = map.get(key) ?? { fen: s.fen, userColor: s.userColor, games: 0, wins: 0, draws: 0, losses: 0 };
      agg.games++;
      if (s.result === "win") agg.wins++;
      else if (s.result === "draw") agg.draws++;
      else agg.losses++;
      map.set(key, agg);
    }

    return map;
  }, [openingSummaries]);

  /* ── 2. Collect unique FENs for name lookups ── */
  const uniqueFens = useMemo(() => {
    const fens = new Set<string>();
    for (const [, agg] of grouped) fens.add(agg.fen);
    return Array.from(fens);
  }, [grouped]);

  /* ── 3. Fetch opening names from Lichess explorer ── */
  const [openingNames, setOpeningNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uniqueFens.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchNames = async () => {
      const names = new Map<string, string>();

      // Batch in groups of 4 to respect rate limits
      for (let i = 0; i < uniqueFens.length; i += 4) {
        if (cancelled) break;
        const batch = uniqueFens.slice(i, i + 4);
        await Promise.allSettled(
          batch.map(async (fen) => {
            const side = fen.includes(" w ") ? "white" : "black";
            try {
              const result = await fetchExplorerMoves(fen, side as PlayerColor);
              if (result.openingName) names.set(fen, result.openingName);
            } catch { /* non-critical */ }
          }),
        );
      }

      if (!cancelled) {
        setOpeningNames(names);
        setLoading(false);
      }
    };

    fetchNames();
    return () => {
      cancelled = true;
    };
  }, [uniqueFens]);

  /* ── 4. Build final sorted rankings ── */
  const rankings: OpeningEntry[] = useMemo(() => {
    if (loading) return [];

    // Merge entries that share the same (opening name + color)
    const byNameColor = new Map<string, OpeningEntry>();

    for (const [, agg] of grouped) {
      const name = openingNames.get(agg.fen) ?? "Unknown Opening";
      const mergeKey = `${name}::${agg.userColor}`;
      const existing = byNameColor.get(mergeKey);

      if (existing) {
        existing.games += agg.games;
        existing.wins += agg.wins;
        existing.draws += agg.draws;
        existing.losses += agg.losses;
        // Keep the FEN with the most games as the representative
        const existingGames = grouped.get(`${existing.fen}::${existing.userColor}`)?.games ?? 0;
        if (agg.games > existingGames) existing.fen = agg.fen;
      } else {
        byNameColor.set(mergeKey, {
          key: mergeKey,
          fen: agg.fen,
          userColor: agg.userColor,
          name,
          games: agg.games,
          wins: agg.wins,
          draws: agg.draws,
          losses: agg.losses,
          winRate: 0,
        });
      }
    }

    const result = Array.from(byNameColor.values());
    for (const r of result) {
      r.winRate = r.games > 0 ? Math.round((r.wins / r.games) * 100) : 0;
    }

    // Sort by win rate ascending (worst first)
    result.sort((a, b) => a.winRate - b.winRate || b.games - a.games);
    return result;
  }, [loading, grouped, openingNames]);

  /* ── Early returns ── */
  if (openingSummaries.length === 0) return null;

  if (loading) {
    return (
      <div className="glass-card border-indigo-500/15 bg-gradient-to-r from-indigo-500/[0.04] to-transparent p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-3xl shadow-lg shadow-indigo-500/10 animate-pulse">
            📊
          </span>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold tracking-tight text-white">Opening Rankings</h2>
            <p className="mt-1 animate-pulse text-sm text-slate-400">Identifying your openings…</p>
          </div>
        </div>
      </div>
    );
  }

  if (rankings.length === 0) return null;

  const totalGames = openingSummaries.length;
  const worst = rankings[0];
  const best = rankings[rankings.length - 1];

  return (
    <div className="space-y-3">
      {/* ── Section header ── */}
      <div className="glass-card border-indigo-500/15 bg-gradient-to-r from-indigo-500/[0.04] to-transparent p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-3xl shadow-lg shadow-indigo-500/10">
            📊
          </span>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Opening Rankings
              <span className="ml-3 inline-flex items-center rounded-full bg-indigo-500/15 px-3 py-1 text-sm font-bold text-indigo-400">
                {rankings.length} opening{rankings.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {rankings.length >= 2 ? (
                <>
                  Lowest:{" "}
                  <span className="font-semibold text-red-400">
                    {worst.name} ({worst.winRate}%)
                  </span>
                  {" · "}
                  Highest:{" "}
                  <span className="font-semibold text-emerald-400">
                    {best.name} ({best.winRate}%)
                  </span>
                  {" · "}
                  <span className="text-slate-500">{totalGames} games total</span>
                </>
              ) : (
                <>All your openings ranked by win rate — lowest to highest.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Rankings list ── */}
      <div className="space-y-2">
        {rankings.map((entry, idx) => (
          <div
            key={entry.key}
            className="group rounded-xl border border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent p-3 transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.03]"
          >
            <div className="flex items-center gap-3">
              {/* Rank badge */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${winRateBadgeBg(entry.winRate)} ${winRateColor(entry.winRate)}`}
              >
                #{idx + 1}
              </div>

              {/* Mini board */}
              <div
                className="shrink-0 overflow-hidden rounded-lg border border-white/[0.08]"
                style={{ width: 72, height: 72 }}
              >
                <Chessboard
                  id={`opening-rank-${idx}`}
                  position={entry.fen}
                  boardWidth={72}
                  arePiecesDraggable={false}
                  boardOrientation={entry.userColor}
                  animationDuration={0}
                  customDarkSquareStyle={{ backgroundColor: "#374151" }}
                  customLightSquareStyle={{ backgroundColor: "#6b7280" }}
                />
              </div>

              {/* Info column */}
              <div className="min-w-0 flex-1">
                {/* Name + color badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-white">{entry.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      entry.userColor === "white"
                        ? "bg-white/10 text-white"
                        : "bg-slate-600/30 text-slate-300"
                    }`}
                  >
                    {entry.userColor === "white" ? "♔" : "♚"}{" "}
                    {entry.userColor === "white" ? "White" : "Black"}
                  </span>
                </div>

                {/* Win rate bar */}
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]">
                    <div
                      className={`h-1.5 rounded-full ${winRateBarBg(entry.winRate)} transition-all duration-700`}
                      style={{ width: `${Math.max(entry.winRate, 2)}%` }}
                    />
                  </div>
                  <span className={`min-w-[3ch] text-right text-xs font-bold ${winRateColor(entry.winRate)}`}>
                    {entry.winRate}%
                  </span>
                </div>

                {/* W / D / L stats */}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                  <span>
                    {entry.games} game{entry.games !== 1 ? "s" : ""}
                  </span>
                  <span className="text-emerald-400/70">+{entry.wins}</span>
                  <span className="text-slate-400/70">={entry.draws}</span>
                  <span className="text-red-400/70">&minus;{entry.losses}</span>
                </div>
              </div>

              {/* Win rate label (desktop) */}
              <div className="hidden shrink-0 text-right sm:block">
                <span className={`text-xs font-semibold ${winRateColor(entry.winRate)}`}>
                  {winRateLabel(entry.winRate)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
