"use client";

/**
 * OpeningRankings — shows ALL openings the user played across the scan,
 * with mini board positions, color badges, and win/draw/loss stats.
 * Sorted from lowest win rate to highest.
 *
 * Opening names come from the scan data (Lichess API / Chess.com PGN headers)
 * — no extra API calls needed.
 */

import { useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { useBoardTheme, useShowCoordinates } from "@/lib/use-coins";
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
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();

  /* ── Build rankings from props (no async, no API calls) ── */
  const rankings: OpeningEntry[] = useMemo(() => {
    // Build a FEN→openingName lookup from summaries that have names
    const fenToName = new Map<string, string>();
    for (const s of openingSummaries) {
      if (s.openingName && !fenToName.has(s.fen)) {
        fenToName.set(s.fen, s.openingName);
      }
    }

    // Group by (opening name + userColor), aggregating W/D/L
    const byNameColor = new Map<string, OpeningEntry>();

    for (const s of openingSummaries) {
      const name = fenToName.get(s.fen) ?? "Unknown Opening";
      const mergeKey = `${name}::${s.userColor}`;
      const existing = byNameColor.get(mergeKey);

      if (existing) {
        existing.games++;
        if (s.result === "win") existing.wins++;
        else if (s.result === "draw") existing.draws++;
        else existing.losses++;
      } else {
        byNameColor.set(mergeKey, {
          key: mergeKey,
          fen: s.fen,
          userColor: s.userColor,
          name,
          games: 1,
          wins: s.result === "win" ? 1 : 0,
          draws: s.result === "draw" ? 1 : 0,
          losses: s.result === "loss" ? 1 : 0,
          winRate: 0,
        });
      }
    }

    const result = Array.from(byNameColor.values()).filter((r) => r.games >= 5);
    for (const r of result) {
      r.winRate = r.games > 0 ? Math.round((r.wins / r.games) * 100) : 0;
    }

    // Sort by win rate ascending (worst first)
    result.sort((a, b) => a.winRate - b.winRate || b.games - a.games);
    return result;
  }, [openingSummaries]);

  /* ── Early returns ── */
  if (openingSummaries.length === 0 || rankings.length === 0) return null;

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

      {/* ── Rankings grid (2-col on md+) ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rankings.map((entry, idx) => (
          <div
            key={entry.key}
            className="group rounded-xl border border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent p-3 transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.03]"
          >
            {/* Top row: rank badge + name + color + win-rate label */}
            <div className="mb-2 flex items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${winRateBadgeBg(entry.winRate)} ${winRateColor(entry.winRate)}`}
              >
                #{idx + 1}
              </div>
              <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-white">{entry.name}</h3>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  entry.userColor === "white"
                    ? "bg-white/10 text-white"
                    : "bg-slate-600/30 text-slate-300"
                }`}
              >
                {entry.userColor === "white" ? "♔" : "♚"}{" "}
                {entry.userColor === "white" ? "White" : "Black"}
              </span>
              <span className={`hidden shrink-0 text-xs font-semibold sm:inline ${winRateColor(entry.winRate)}`}>
                {winRateLabel(entry.winRate)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Board — larger */}
              <div
                className="shrink-0 border border-white/[0.08]"
                style={{ width: 120, height: 120 }}
              >
                <Chessboard
                  id={`opening-rank-${idx}`}
                  position={entry.fen}
                  boardWidth={120}
                  arePiecesDraggable={false}
                  boardOrientation={entry.userColor}
                  animationDuration={0}
                  customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                  customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                  showBoardNotation={showCoords}
                />
              </div>

              {/* Info column */}
              <div className="min-w-0 flex-1">
                {/* Win rate bar */}
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-white/[0.06]">
                    <div
                      className={`h-2 rounded-full ${winRateBarBg(entry.winRate)} transition-all duration-700`}
                      style={{ width: `${Math.max(entry.winRate, 2)}%` }}
                    />
                  </div>
                  <span className={`min-w-[3ch] text-right text-sm font-bold ${winRateColor(entry.winRate)}`}>
                    {entry.winRate}%
                  </span>
                </div>

                {/* W / D / L stats */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  <span className="font-medium text-slate-400">
                    {entry.games} game{entry.games !== 1 ? "s" : ""}
                  </span>
                  <span className="text-emerald-400/70">+{entry.wins}W</span>
                  <span className="text-slate-400/70">={entry.draws}D</span>
                  <span className="text-red-400/70">&minus;{entry.losses}L</span>
                </div>

                {/* Win rate label (mobile) */}
                <div className="mt-2 sm:hidden">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${winRateBadgeBg(entry.winRate)} ${winRateColor(entry.winRate)}`}>
                    {winRateLabel(entry.winRate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
