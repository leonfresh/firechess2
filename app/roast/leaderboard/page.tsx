"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

/* ── Types ── */
interface RoastEntry {
  id: string;
  score: number;
  gamesPlayed: number;
  streakCount: number;
  quizScore: number;
  createdAt: string;
  userName: string | null;
  userImage: string | null;
}

type Period = "daily" | "weekly" | "lifetime";

/* ── Helpers ── */
function rankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
}

function scoreColor(score: number) {
  if (score >= 3000) return "text-emerald-400";
  if (score >= 1500) return "text-cyan-400";
  if (score >= 600) return "text-amber-400";
  return "text-red-400";
}

function scoreGlow(score: number) {
  if (score >= 3000) return "shadow-emerald-500/20";
  if (score >= 1500) return "shadow-cyan-500/20";
  if (score >= 600) return "shadow-amber-500/20";
  return "shadow-red-500/20";
}

export default function RoastLeaderboardPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [entries, setEntries] = useState<RoastEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roast/leaderboard?period=${p}&limit=50`);
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period, fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="text-4xl">🐸</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                Roast Leaderboard
              </span>
            </h1>
            <span className="text-4xl">🔥</span>
          </div>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400">
            The top &ldquo;Roast the Elo&rdquo; quiz show scores. Guess Elos, answer
            quiz questions, build streaks&nbsp;— and climb the ranks.
          </p>
          <Link
            href="/roast"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            ← Back to Roast the Elo
          </Link>
        </div>

        {/* ── Period toggle ── */}
        <div className="mb-8 flex items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit mx-auto">
          {(["daily", "weekly", "lifetime"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                period === p
                  ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 shadow-sm shadow-orange-500/10"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              {p === "daily" ? "Today" : p === "weekly" ? "This Week" : "All Time"}
            </button>
          ))}
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <svg className="h-8 w-8 animate-spin text-orange-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
              <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-slate-500">Loading leaderboard…</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
            <span className="text-5xl">🏟️</span>
            <h2 className="text-xl font-bold text-white">No scores yet</h2>
            <p className="max-w-md text-sm text-slate-400">
              {period === "daily"
                ? "No one has saved a score today yet. Be the first!"
                : period === "weekly"
                ? "No scores saved this week. Play and save your score to claim the top spot!"
                : "No scores yet. Play Roast the Elo and save your score to appear here."}
            </p>
            <Link
              href="/roast"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:brightness-110"
            >
              🔥 Play Roast the Elo
            </Link>
          </div>
        )}

        {/* ── Podium (top 3) ── */}
        {!loading && entries.length > 0 && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {entries.slice(0, 3).map((entry, i) => {
                const rank = i + 1;
                const podiumBorder = rank === 1 ? "border-orange-500/30" : rank === 2 ? "border-slate-400/20" : "border-red-700/20";
                const podiumGlow = rank === 1 ? "shadow-orange-500/10" : rank === 2 ? "shadow-slate-400/5" : "shadow-red-700/5";
                const titleGrad = rank === 1 ? "from-orange-400 to-yellow-300" : rank === 2 ? "from-slate-300 to-slate-400" : "from-red-400 to-orange-600";

                return (
                  <div
                    key={entry.id}
                    className={`relative overflow-hidden rounded-2xl border ${podiumBorder} bg-white/[0.02] p-6 text-center shadow-lg ${podiumGlow} ${rank === 1 ? "sm:order-2 sm:-mt-4" : rank === 2 ? "sm:order-1" : "sm:order-3"}`}
                  >
                    {rank === 1 && (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/[0.06] via-transparent to-yellow-500/[0.04]" />
                    )}
                    <div className="relative">
                      <span className="text-3xl">{rankBadge(rank)}</span>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        {entry.userImage && (
                          <Image
                            src={entry.userImage}
                            alt=""
                            width={28}
                            height={28}
                            className="rounded-full"
                            unoptimized
                          />
                        )}
                        <p className={`text-lg font-extrabold bg-gradient-to-r ${titleGrad} bg-clip-text text-transparent`}>
                          {entry.userName ?? "Anonymous"}
                        </p>
                      </div>
                      <p className={`mt-4 text-3xl font-black tabular-nums ${scoreColor(entry.score)}`}>
                        {entry.score.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Score</p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p className="font-bold text-white">{entry.gamesPlayed}</p>
                          <p className="text-slate-600">Games</p>
                        </div>
                        <div>
                          <p className="font-bold text-orange-400">{entry.streakCount}</p>
                          <p className="text-slate-600">Streak</p>
                        </div>
                        <div>
                          <p className="font-bold text-cyan-400">{entry.quizScore.toLocaleString()}</p>
                          <p className="text-slate-600">Quiz</p>
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
                      <th className="px-5 py-3 text-right">Score</th>
                      <th className="hidden px-5 py-3 text-right sm:table-cell">Games</th>
                      <th className="hidden px-5 py-3 text-right sm:table-cell">Streak</th>
                      <th className="hidden px-5 py-3 text-right md:table-cell">Quiz Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(3).map((entry, i) => {
                      const rank = i + 4;
                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-3.5 font-bold text-slate-500">{rank}</td>
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
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-xs font-bold text-slate-400">
                                  {(entry.userName?.[0] ?? "?").toUpperCase()}
                                </div>
                              )}
                              <p className="font-semibold text-white">{entry.userName ?? "Anonymous"}</p>
                            </div>
                          </td>
                          <td className={`px-5 py-3.5 text-right font-black tabular-nums ${scoreColor(entry.score)}`}>
                            {entry.score.toLocaleString()}
                          </td>
                          <td className="hidden px-5 py-3.5 text-right tabular-nums text-slate-300 sm:table-cell">
                            {entry.gamesPlayed}
                          </td>
                          <td className="hidden px-5 py-3.5 text-right tabular-nums text-orange-400 sm:table-cell">
                            {entry.streakCount}
                          </td>
                          <td className="hidden px-5 py-3.5 text-right tabular-nums text-cyan-400 md:table-cell">
                            {entry.quizScore.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── CTA ── */}
            <div className="mt-10 flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-slate-500">
                Think you can do better? Play Roast the Elo and save your score.
              </p>
              <Link
                href="/roast"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:brightness-110"
              >
                🔥 Play &amp; Compete
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
