"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

/* ── Types ── */
interface LeaderboardEntry {
  id: string;
  chessUsername: string;
  source: "lichess" | "chesscom";
  firechessScore: number;
  estimatedAccuracy: number | null;
  weightedCpLoss: number | null;
  leakCount: number | null;
  tacticsCount: number | null;
  gamesAnalyzed: number;
  playerRating: number | null;
  createdAt: string;
  userName: string | null;
  userImage: string | null;
}

type Period = "week" | "all";

/* ── Medal colors ── */
function rankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
}

function scoreColor(score: number) {
  if (score >= 700) return "text-emerald-400";
  if (score >= 500) return "text-cyan-400";
  if (score >= 300) return "text-amber-400";
  return "text-red-400";
}

function scoreGlow(score: number) {
  if (score >= 700) return "shadow-emerald-500/20";
  if (score >= 500) return "shadow-cyan-500/20";
  if (score >= 300) return "shadow-amber-500/20";
  return "shadow-red-500/20";
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${p}&limit=50`);
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
            <span className="text-4xl">🏆</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h1>
          </div>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400">
            The best FireChess analysis reports ranked by composite score.
            Score is based on accuracy, CPL, opening leaks, and missed tactics.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link
              href="/leaderboard/chaos"
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-semibold text-purple-400 transition-all hover:bg-purple-500/20"
            >
              ⚡ Chaos Chess ELO
            </Link>
          </div>
        </div>

        {/* ── Period toggle ── */}
        <div className="mb-8 flex items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit mx-auto">
          {(["week", "all"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                period === p
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 shadow-sm shadow-amber-500/10"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              {p === "week" ? "This Week" : "All Time"}
            </button>
          ))}
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <svg className="h-8 w-8 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
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
            <h2 className="text-xl font-bold text-white">No entries yet</h2>
            <p className="max-w-md text-sm text-slate-400">
              {period === "week"
                ? "No reports saved this week. Be the first to claim the top spot!"
                : "No reports with scores yet. Analyze your games and save a report to appear here."}
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:brightness-110"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Analyze Your Games
            </Link>
          </div>
        )}

        {/* ── Podium (top 3) ── */}
        {!loading && entries.length > 0 && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {entries.slice(0, 3).map((entry, i) => {
                const rank = i + 1;
                const podiumBorder = rank === 1 ? "border-amber-500/30" : rank === 2 ? "border-slate-400/20" : "border-orange-700/20";
                const podiumGlow = rank === 1 ? "shadow-amber-500/10" : rank === 2 ? "shadow-slate-400/5" : "shadow-orange-700/5";
                const titleGrad = rank === 1 ? "from-amber-400 to-yellow-300" : rank === 2 ? "from-slate-300 to-slate-400" : "from-orange-400 to-amber-600";

                return (
                  <div
                    key={entry.id}
                    className={`relative overflow-hidden rounded-2xl border ${podiumBorder} bg-white/[0.02] p-6 text-center shadow-lg ${podiumGlow} ${rank === 1 ? "sm:order-2 sm:-mt-4" : rank === 2 ? "sm:order-1" : "sm:order-3"}`}
                  >
                    {rank === 1 && (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-yellow-500/[0.04]" />
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
                          {entry.chessUsername}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                        <span className={entry.source === "lichess" ? "text-slate-400" : "text-green-400"}>
                          {entry.source === "lichess" ? "lichess" : "chess.com"}
                        </span>
                        {entry.playerRating && (
                          <>
                            <span>·</span>
                            <span>{entry.playerRating}</span>
                          </>
                        )}
                      </div>
                      <p className={`mt-4 text-3xl font-black tabular-nums ${scoreColor(entry.firechessScore)}`}>
                        {entry.firechessScore.toFixed(0)}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">FireChess Score</p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p className="font-bold text-white">{entry.estimatedAccuracy?.toFixed(0) ?? "—"}%</p>
                          <p className="text-slate-600">Accuracy</p>
                        </div>
                        <div>
                          <p className="font-bold text-fuchsia-400">{entry.leakCount ?? 0}</p>
                          <p className="text-slate-600">Leaks</p>
                        </div>
                        <div>
                          <p className="font-bold text-cyan-400">{entry.tacticsCount ?? 0}</p>
                          <p className="text-slate-600">Missed</p>
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
                      <th className="hidden px-5 py-3 text-right sm:table-cell">Accuracy</th>
                      <th className="hidden px-5 py-3 text-right md:table-cell">CPL</th>
                      <th className="hidden px-5 py-3 text-right sm:table-cell">Leaks</th>
                      <th className="hidden px-5 py-3 text-right md:table-cell">Games</th>
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
                                  {(entry.chessUsername?.[0] ?? "?").toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-white">{entry.chessUsername}</p>
                                <p className="text-[10px] text-slate-500">
                                  {entry.source === "lichess" ? "lichess" : "chess.com"}
                                  {entry.playerRating ? ` · ${entry.playerRating}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className={`px-5 py-3.5 text-right font-black tabular-nums ${scoreColor(entry.firechessScore)}`}>
                            {entry.firechessScore.toFixed(0)}
                          </td>
                          <td className="hidden px-5 py-3.5 text-right tabular-nums text-slate-300 sm:table-cell">
                            {entry.estimatedAccuracy?.toFixed(1) ?? "—"}%
                          </td>
                          <td className="hidden px-5 py-3.5 text-right tabular-nums text-slate-400 md:table-cell">
                            {entry.weightedCpLoss?.toFixed(1) ?? "—"}
                          </td>
                          <td className="hidden px-5 py-3.5 text-right tabular-nums text-fuchsia-400 sm:table-cell">
                            {entry.leakCount ?? 0}
                          </td>
                          <td className="hidden px-5 py-3.5 text-right tabular-nums text-slate-400 md:table-cell">
                            {entry.gamesAnalyzed}
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
                Think you can do better? Analyze your games and claim your spot.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:brightness-110"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Analyze &amp; Compete
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
