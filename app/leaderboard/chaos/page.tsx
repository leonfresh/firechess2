"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface ChaosLeaderboardEntry {
  userId: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  peakRating: number;
  userName: string | null;
  chaosUsername: string | null;
  userImage: string | null;
  updatedAt: string | null;
}

function ratingColor(rating: number) {
  if (rating >= 2000) return "text-amber-400";
  if (rating >= 1600) return "text-purple-400";
  if (rating >= 1400) return "text-cyan-400";
  if (rating >= 1200) return "text-slate-200";
  return "text-slate-400";
}

function rankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
}

function winRate(wins: number, gamesPlayed: number) {
  if (gamesPlayed === 0) return "—";
  return `${Math.round((wins / gamesPlayed) * 100)}%`;
}

export default function ChaosLeaderboardPage() {
  const [entries, setEntries] = useState<ChaosLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chaos/leaderboard?limit=50");
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="text-4xl">⚡</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Chaos Chess
              </span>
              <span className="ml-2 text-white">Leaderboard</span>
            </h1>
          </div>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400">
            ELO-ranked chaos chess players. Ratings start at 1200 and update
            after every ranked game.
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
              href="/chaos"
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 px-4 py-1.5 text-sm font-semibold text-purple-400 transition-all hover:bg-purple-500/30"
            >
              ⚡ Play Chaos Chess
            </Link>
          </div>
        </div>

        {/* ── Rating tiers legend ── */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-xs">
          {[
            {
              label: "2000+  Master",
              color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
            },
            {
              label: "1600   Expert",
              color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
            },
            {
              label: "1400   Advanced",
              color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
            },
            {
              label: "1200   Intermediate",
              color: "text-slate-200 border-white/10 bg-white/[0.04]",
            },
          ].map((t) => (
            <span
              key={t.label}
              className={`rounded-full border px-3 py-1 font-semibold ${t.color}`}
            >
              {t.label}
            </span>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <svg
              className="h-8 w-8 animate-spin text-purple-400"
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
            <p className="text-sm text-slate-500">Loading chaos rankings…</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
            <span className="text-5xl">🏟️</span>
            <h2 className="text-xl font-bold text-white">
              No ranked games yet
            </h2>
            <p className="max-w-md text-sm text-slate-400">
              Be the first to play a ranked Chaos Chess game and claim the top
              spot!
            </p>
            <Link
              href="/chaos"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:brightness-110"
            >
              ⚡ Play Now
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
                    className={`relative overflow-hidden rounded-2xl border ${podiumBorder} bg-white/[0.02] p-6 text-center shadow-lg ${rank === 1 ? "sm:order-2 sm:-mt-4" : rank === 2 ? "sm:order-1" : "sm:order-3"}`}
                  >
                    {rank === 1 && (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-yellow-500/[0.04]" />
                    )}
                    <div className="relative">
                      <span className="text-3xl">{rankBadge(rank)}</span>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        {entry.userImage ? (
                          <Image
                            src={entry.userImage}
                            alt=""
                            width={28}
                            height={28}
                            className="rounded-full"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                            {(
                              (entry.chaosUsername ?? entry.userName)?.[0] ??
                              "?"
                            ).toUpperCase()}
                          </div>
                        )}
                        <p
                          className={`text-lg font-extrabold bg-gradient-to-r ${titleGrad} bg-clip-text text-transparent`}
                        >
                          {entry.chaosUsername ?? entry.userName ?? "Anonymous"}
                        </p>
                      </div>
                      <p
                        className={`mt-4 text-3xl font-black tabular-nums ${ratingColor(entry.rating)}`}
                      >
                        {entry.rating}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Chaos ELO
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p className="font-bold text-emerald-400">
                            {entry.wins}
                          </p>
                          <p className="text-slate-600">Wins</p>
                        </div>
                        <div>
                          <p className="font-bold text-red-400">
                            {entry.losses}
                          </p>
                          <p className="text-slate-600">Losses</p>
                        </div>
                        <div>
                          <p className="font-bold text-white">
                            {winRate(entry.wins, entry.gamesPlayed)}
                          </p>
                          <p className="text-slate-600">Win %</p>
                        </div>
                      </div>
                      {entry.peakRating > entry.rating && (
                        <p className="mt-2 text-[10px] text-slate-500">
                          Peak: {entry.peakRating}
                        </p>
                      )}
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
                      <th className="px-5 py-3 text-right">ELO</th>
                      <th className="hidden px-5 py-3 text-right sm:table-cell">
                        Peak
                      </th>
                      <th className="hidden px-5 py-3 text-right sm:table-cell">
                        W / L / D
                      </th>
                      <th className="px-5 py-3 text-right">Win%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(3).map((entry, i) => (
                      <tr
                        key={entry.userId}
                        className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-500">
                          {i + 4}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {entry.userImage ? (
                              <Image
                                src={entry.userImage}
                                alt=""
                                width={24}
                                height={24}
                                className="rounded-full"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-400">
                                {(
                                  (entry.chaosUsername ??
                                    entry.userName)?.[0] ?? "?"
                                ).toUpperCase()}
                              </div>
                            )}
                            <p className="font-semibold text-white">
                              {entry.chaosUsername ??
                                entry.userName ??
                                "Anonymous"}
                            </p>
                          </div>
                        </td>
                        <td
                          className={`px-5 py-3.5 text-right font-black tabular-nums ${ratingColor(entry.rating)}`}
                        >
                          {entry.rating}
                        </td>
                        <td className="hidden px-5 py-3.5 text-right tabular-nums text-slate-400 sm:table-cell">
                          {entry.peakRating}
                        </td>
                        <td className="hidden px-5 py-3.5 text-right tabular-nums text-slate-400 sm:table-cell">
                          <span className="text-emerald-400">{entry.wins}</span>
                          {" / "}
                          <span className="text-red-400">{entry.losses}</span>
                          {" / "}
                          <span className="text-slate-400">{entry.draws}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-slate-300">
                          {winRate(entry.wins, entry.gamesPlayed)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-slate-500">
                Play ranked games to earn your spot on the leaderboard.
              </p>
              <Link
                href="/chaos"
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
