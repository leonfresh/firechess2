"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/** Chaos Chess gold board — ranked by lifetime gold earned from finished games. */

interface GoldRow {
  name: string;
  gold: number;
  games: number;
  earned: number;
  spent: number;
}

interface Standings {
  gold?: GoldRow[];
  goldTotals?: { players: number; earned: number };
}

function rankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
}

function earnedColor(earned: number) {
  if (earned >= 1000) return "text-amber-300";
  if (earned >= 200) return "text-amber-400";
  if (earned >= 50) return "text-yellow-500";
  return "text-slate-300";
}

export default function ChaosGoldLeaderboardPage() {
  const [gold, setGold] = useState<GoldRow[]>([]);
  const [totals, setTotals] = useState<{ players: number; earned: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chaos/standings");
      const data: Standings = await res.json();
      setGold(data.gold ?? []);
      setTotals(data.goldTotals ?? null);
    } catch {
      setGold([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto site-width px-4 py-12 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="text-4xl">🪙</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                Chaos Gold
              </span>
              <span className="ml-2 text-white">Leaderboard</span>
            </h1>
          </div>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400">
            Gold is the Chaos Chess currency — earned by finishing games.
            10 a game, +15 for a win, +5 on a timed clock, +25 for your first
            win of the day. Buying powers spends gold but never removes you
            from this board.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/leaderboard/chaos"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Chaos ELO ladder
            </Link>
            <span className="text-slate-600">·</span>
            <Link
              href="/chaos?play=1"
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-semibold text-purple-400 transition-all hover:bg-purple-500/20"
            >
              ⚡ Play Chaos Chess
            </Link>
          </div>
        </div>

        {/* ── Totals ── */}
        {!loading && totals && totals.earned > 0 && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-semibold text-amber-400">
              🪙 {totals.earned.toLocaleString()} gold earned
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-semibold text-slate-300">
              {totals.players.toLocaleString()}{" "}
              {totals.players === 1 ? "player" : "players"}
            </span>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <svg
              className="h-8 w-8 animate-spin text-amber-400"
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
            <p className="text-sm text-slate-500">Loading gold standings…</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && gold.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
            <span className="text-5xl">🪙</span>
            <h2 className="text-xl font-bold text-white">No gold earned yet</h2>
            <p className="max-w-md text-sm text-slate-400">
              Finish a Chaos Chess game while signed in with FireChess or
              Discord to earn gold and claim the first spot.
            </p>
            <Link
              href="/chaos?play=1"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:brightness-110"
            >
              ⚡ Play Chaos Chess
            </Link>
          </div>
        )}

        {/* ── Podium (top 3) ── */}
        {!loading && gold.length > 0 && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {gold.slice(0, Math.min(3, gold.length)).map((row, i) => {
                const rank = i + 1;
                const podiumBorder =
                  rank === 1
                    ? "border-amber-500/30"
                    : rank === 2
                      ? "border-slate-400/20"
                      : "border-orange-700/20";
                const titleGrad =
                  rank === 1
                    ? "from-amber-400 to-yellow-300"
                    : rank === 2
                      ? "from-slate-300 to-slate-400"
                      : "from-orange-400 to-amber-600";

                return (
                  <div
                    key={`${row.name}-${rank}`}
                    className={`relative overflow-hidden rounded-2xl border ${podiumBorder} bg-white/[0.02] p-6 text-center shadow-lg ${
                      rank === 1 ? "sm:order-2 sm:-mt-4" : rank === 2 ? "sm:order-1" : "sm:order-3"
                    }`}
                  >
                    {rank === 1 && (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-yellow-500/[0.04]" />
                    )}
                    <div className="relative">
                      <span className="text-3xl">{rankBadge(rank)}</span>
                      <p
                        className={`mt-3 text-lg font-extrabold bg-gradient-to-r ${titleGrad} bg-clip-text text-transparent`}
                      >
                        {row.name}
                      </p>
                      <p
                        className={`mt-4 text-3xl font-black tabular-nums ${earnedColor(row.earned)}`}
                      >
                        {row.earned.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Gold Earned
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <p className="font-bold text-white">
                            {row.gold.toLocaleString()}
                          </p>
                          <p className="text-slate-600">In hand</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400">{row.games}</p>
                          <p className="text-slate-600">
                            {row.games === 1 ? "Game" : "Games"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Full table ── */}
            {gold.length > 3 && (
              <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 w-12">#</th>
                      <th className="px-5 py-3">Player</th>
                      <th className="px-5 py-3 text-right">Gold earned</th>
                      <th className="px-5 py-3 text-right">In hand</th>
                      <th className="hidden px-5 py-3 text-right sm:table-cell">
                        Games
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gold.slice(3).map((row, i) => (
                      <tr
                        key={`${row.name}-${i + 4}`}
                        className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-500">
                          {i + 4}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-white">
                          {row.name}
                        </td>
                        <td
                          className={`px-5 py-3.5 text-right font-black tabular-nums ${earnedColor(row.earned)}`}
                        >
                          {row.earned.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-slate-300">
                          {row.gold.toLocaleString()}
                        </td>
                        <td className="hidden px-5 py-3.5 text-right tabular-nums text-slate-400 sm:table-cell">
                          {row.games}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── CTA ── */}
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-slate-500">
                Gold buys new powers in the Armoury. Finish games to earn more.
              </p>
              <Link
                href="/chaos?play=1"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:brightness-110"
              >
                ⚡ Play Chaos Chess
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
