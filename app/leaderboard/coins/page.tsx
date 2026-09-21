"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AvatarImg } from "@/components/avatar-image";
import { useSession } from "@/components/session-provider";

interface CoinLeaderboardEntry {
  userId: string;
  name: string | null;
  image: string | null;
  chaosUsername: string | null;
  balance: number;
  spent: number;
  earned: number;
}

interface CoinTotals {
  players: number;
  earned: number;
}

function rankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
}

function earnedColor(earned: number) {
  if (earned >= 5000) return "text-amber-300";
  if (earned >= 1000) return "text-amber-400";
  if (earned >= 200) return "text-yellow-500";
  return "text-slate-300";
}

function displayName(entry: CoinLeaderboardEntry) {
  return entry.chaosUsername ?? entry.name ?? "Anonymous";
}

function initials(entry: CoinLeaderboardEntry) {
  return (displayName(entry)[0] ?? "?").toUpperCase();
}

export default function CoinLeaderboardPage() {
  const { user } = useSession();
  const [entries, setEntries] = useState<CoinLeaderboardEntry[]>([]);
  const [totals, setTotals] = useState<CoinTotals | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard/coins?limit=50");
      const data = await res.json();
      setEntries(data.entries ?? []);
      setTotals(data.totals ?? null);
    } catch {
      setEntries([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const isMe = (entry: CoinLeaderboardEntry) =>
    !!user?.id && entry.userId === user.id;

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto site-width px-4 py-12 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="text-4xl">🪙</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                Coins Earned
              </span>
              <span className="ml-2 text-white">Leaderboard</span>
            </h1>
          </div>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400">
            Lifetime coins earned across FireChess — daily puzzles, study
            tasks, scans, streaks and achievements. Spending in the Coin Shop
            never costs you your rank.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link
              href="/leaderboard"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Analysis Leaderboard
            </Link>
            <span className="text-slate-600">·</span>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-400 transition-all hover:bg-amber-500/20"
            >
              🪙 Coin Shop
            </Link>
          </div>
        </div>

        {/* ── Totals ── */}
        {!loading && totals && totals.earned > 0 && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-semibold text-amber-400">
              🪙 {totals.earned.toLocaleString()} coins earned
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
            <p className="text-sm text-slate-500">Loading coin rankings…</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
            <span className="text-5xl">🪙</span>
            <h2 className="text-xl font-bold text-white">
              No coins earned yet
            </h2>
            <p className="max-w-md text-sm text-slate-400">
              Complete the Daily Challenge, finish a study task, or save a
              scan to earn your first coins and claim the top spot.
            </p>
            <Link
              href="/daily"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:brightness-110"
            >
              🪙 Earn Coins
            </Link>
          </div>
        )}

        {/* ── Podium (top 3) ── */}
        {!loading && entries.length > 0 && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {entries.slice(0, Math.min(3, entries.length)).map((entry, i) => {
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
                    key={entry.userId}
                    className={`relative overflow-hidden rounded-2xl border ${podiumBorder} bg-white/[0.02] p-6 text-center shadow-lg ${
                      rank === 1 ? "sm:order-2 sm:-mt-4" : rank === 2 ? "sm:order-1" : "sm:order-3"
                    } ${isMe(entry) ? "ring-1 ring-amber-400/40" : ""}`}
                  >
                    {rank === 1 && (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-yellow-500/[0.04]" />
                    )}
                    <div className="relative">
                      <span className="text-3xl">{rankBadge(rank)}</span>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <AvatarImg
                          src={entry.image}
                          className="h-7 w-7 rounded-full object-cover"
                          fallback={
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                              {initials(entry)}
                            </span>
                          }
                        />
                        <p
                          className={`text-lg font-extrabold bg-gradient-to-r ${titleGrad} bg-clip-text text-transparent`}
                        >
                          {displayName(entry)}
                        </p>
                        {isMe(entry) && (
                          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                            You
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-4 text-3xl font-black tabular-nums ${earnedColor(entry.earned)}`}
                      >
                        {entry.earned.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Coins Earned
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <p className="font-bold text-white">
                            {entry.balance.toLocaleString()}
                          </p>
                          <p className="text-slate-600">Balance</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400">
                            {entry.spent.toLocaleString()}
                          </p>
                          <p className="text-slate-600">Spent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Full table ── */}
            {entries.length > 3 && (
              <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 w-12">#</th>
                      <th className="px-5 py-3">Player</th>
                      <th className="px-5 py-3 text-right">Earned</th>
                      <th className="px-5 py-3 text-right">Balance</th>
                      <th className="hidden px-5 py-3 text-right sm:table-cell">
                        Spent
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(3).map((entry, i) => (
                      <tr
                        key={entry.userId}
                        className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] ${
                          isMe(entry) ? "bg-amber-500/[0.05]" : ""
                        }`}
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-500">
                          {i + 4}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <AvatarImg
                              src={entry.image}
                              className="h-6 w-6 rounded-full object-cover"
                              fallback={
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-400">
                                  {initials(entry)}
                                </span>
                              }
                            />
                            <p className="font-semibold text-white">
                              {displayName(entry)}
                            </p>
                            {isMe(entry) && (
                              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          className={`px-5 py-3.5 text-right font-black tabular-nums ${earnedColor(entry.earned)}`}
                        >
                          {entry.earned.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-slate-300">
                          {entry.balance.toLocaleString()}
                        </td>
                        <td className="hidden px-5 py-3.5 text-right tabular-nums text-slate-400 sm:table-cell">
                          {entry.spent.toLocaleString()}
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
                Earn coins from daily puzzles, study tasks and scans — then
                spend them on themes, piece sets and titles.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/daily"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:brightness-110"
                >
                  🪙 Earn More Coins
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm font-bold text-amber-400 transition-all hover:bg-amber-500/20"
                >
                  Open the Coin Shop
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
