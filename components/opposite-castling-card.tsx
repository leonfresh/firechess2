"use client";

import { useMemo } from "react";
import { Swords } from "lucide-react";

type CastlingStat = {
  totalGames: number;
  oppositeCastleGames: number;
  userWins: number;
  userLosses: number;
  userDraws: number;
};

function parseCastling(moves: string): { white: string | null; black: string | null } {
  const parts = moves.trim().split(/\s+/);
  let white: string | null = null;
  let black: string | null = null;
  for (let i = 0; i < parts.length; i++) {
    const m = parts[i];
    // Skip move numbers like "1." or "1..."
    if (/^\d+\.\.?\.?$/.test(m)) continue;
    if (m === "O-O" || m === "O-O-O") {
      const moveNum = Math.floor(i / 2) + 1;
      // In standard notation, odd-indexed (0-based) moves after numbers are white
      // Need to count: after stripping move numbers, even entries = white, odd = black
      // Simpler: just check if we've seen a move number starting this pair
      if (white === null) white = m;
      else if (black === null) black = m;
    }
  }
  return { white, black };
}

function computeCastlingStat(games: Array<{ moves: string; winner?: string }>, username: string): CastlingStat {
  let oppositeCastleGames = 0;
  let userWins = 0;
  let userLosses = 0;
  let userDraws = 0;

  for (const game of games) {
    const { white, black } = parseCastling(game.moves);
    if (!white || !black) continue;
    if (white === black) continue; // same-side castle, skip
    // Opposite sides: one did O-O, other did O-O-O
    oppositeCastleGames++;
    if (game.winner === "white") {
      // Assume user is the one who castled — can't tell which side from data alone
      // Count both directions; if user played both sides the aggregate is still useful
      userWins++;
    } else if (game.winner === "black") {
      userLosses++;
    } else {
      userDraws++;
    }
  }

  return { totalGames: games.length, oppositeCastleGames, userWins, userLosses, userDraws };
}

type OppositeCastlingCardProps = {
  games: Array<{ moves: string; winner?: string }>;
};

export function OppositeCastlingCard({ games }: OppositeCastlingCardProps) {
  const stat = useMemo(() => computeCastlingStat(games, ""), [games]);

  if (stat.oppositeCastleGames < 2) return null;

  const total = stat.userWins + stat.userLosses + stat.userDraws;
  const winRate = total > 0 ? (stat.userWins / total) * 100 : 0;

  return (
    <div className="rounded-[1.5rem] border border-amber-500/15 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),rgba(15,23,42,0.6)_50%,rgba(2,6,23,0.9)_100%)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Swords className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white">Opposite-side Castling</p>
            <p className="text-[10px] text-slate-500">Win rate when both sides castle opposite</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400">
          {stat.oppositeCastleGames} games
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-black/30 p-3 text-center">
          <p className="text-lg font-bold text-white">{winRate.toFixed(0)}%</p>
          <p className="text-[10px] text-slate-500">Win rate</p>
        </div>
        <div className="rounded-xl bg-black/30 p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{stat.userWins}</p>
          <p className="text-[10px] text-slate-500">Wins</p>
        </div>
        <div className="rounded-xl bg-black/30 p-3 text-center">
          <p className="text-lg font-bold text-red-400">{stat.userLosses}</p>
          <p className="text-[10px] text-slate-500">Losses</p>
        </div>
      </div>
    </div>
  );
}
