"use client";

/**
 * /dashboard — Analysis history, progress tracking, and strengths radar.
 *
 * Sections:
 *   1. Header with overall stats
 *   2. Strengths radar (latest report)
 *   3. Progress over time — line chart of accuracy & rating
 *   4. Report history list with mini radar thumbnails
 */

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { MistakeCard } from "@/components/mistake-card";
import { TacticCard } from "@/components/tactic-card";
import { StudyPlanWidget } from "@/components/study-plan";
import { AchievementsPanel, type AchievementCtx } from "@/components/achievements";
import { GoalWidget } from "@/components/goal-widget";
import { DailyChallenge } from "@/components/daily-challenge";
import { ProgressHighlights } from "@/components/progress-highlights";
import { RepertoirePanel } from "@/components/opening-repertoire";
import { PercentileWidget } from "@/components/percentile-widget";
import { CoinShop } from "@/components/coin-shop";
import { DailyLoginRewards } from "@/components/daily-login-rewards";
import { OnboardingTour } from "@/components/onboarding-tour";
import { useCoinBalance } from "@/lib/use-coins";
import { useProfileTitle } from "@/lib/use-coins";
import { earnCoins } from "@/lib/coins";
import {
  StrengthsRadar,
  RadarLegend,
  computeRadarData,
  type RadarProps,
} from "@/components/radar-chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type SavedReport = {
  id: string;
  chessUsername: string;
  source: string;
  scanMode: string;
  gamesAnalyzed: number;
  maxGames: number | null;
  maxMoves: number | null;
  cpThreshold: number | null;
  engineDepth: number | null;
  estimatedAccuracy: number | null;
  estimatedRating: number | null;
  weightedCpLoss: number | null;
  severeLeakRate: number | null;
  repeatedPositions: number | null;
  leakCount: number | null;
  tacticsCount: number | null;
  leaks: any[];
  missedTactics: any[];
  diagnostics: any;
  reportMeta: {
    consistencyScore?: number;
    p75CpLoss?: number;
    confidence?: number;
    topTag?: string;
    vibeTitle?: string;
    sampleSize?: number;
  } | null;
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function radarPropsFrom(r: SavedReport): RadarProps {
  return {
    accuracy: r.estimatedAccuracy ?? 0,
    leakCount: r.leakCount ?? 0,
    repeatedPositions: r.repeatedPositions ?? 0,
    tacticsCount: r.tacticsCount ?? 0,
    gamesAnalyzed: r.gamesAnalyzed,
    weightedCpLoss: r.weightedCpLoss ?? 0,
    severeLeakRate: r.severeLeakRate ?? 0,
    timeManagementScore: null,
  };
}

function delta(a: number | null, b: number | null): string {
  if (a == null || b == null) return "";
  const diff = a - b;
  if (diff === 0) return "";
  return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { authenticated, loading: sessionLoading, user, plan } = useSession();
  const profileTitle = useProfileTitle();
  const coinBalance = useCoinBalance();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fc-dashboard-player") ?? "__all__";
    }
    return "__all__";
  });

  async function handleDeleteReport(id: string) {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reports?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } catch {}
    setDeletingId(null);
  }

  useEffect(() => {
    if (sessionLoading) return;
    if (!authenticated) {
      setLoading(false);
      return;
    }
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authenticated, sessionLoading]);

  // Unique usernames (with source) for the filter dropdown
  const userOptions = useMemo(() => {
    const seen = new Map<string, { username: string; source: string }>();
    for (const r of reports) {
      const key = `${r.chessUsername}__${r.source}`;
      if (!seen.has(key)) seen.set(key, { username: r.chessUsername, source: r.source });
    }
    return Array.from(seen.values());
  }, [reports]);

  // Persist selection to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fc-dashboard-player", selectedUser);
    }
  }, [selectedUser]);

  // Auto-select: prefer user's session name → localStorage → first user if only one
  useEffect(() => {
    if (userOptions.length === 0) return;
    const saved = typeof window !== "undefined" ? localStorage.getItem("fc-dashboard-player") : null;

    // If the saved value is a valid option, keep it
    if (saved && saved !== "__all__" && userOptions.some((u) => `${u.username}__${u.source}` === saved)) {
      if (selectedUser !== saved) setSelectedUser(saved);
      return;
    }

    // Try to match the signed-in user's name to a chess username
    if (user?.name && selectedUser === "__all__") {
      const match = userOptions.find((u) => u.username.toLowerCase() === user.name!.toLowerCase());
      if (match) {
        setSelectedUser(`${match.username}__${match.source}`);
        return;
      }
    }

    // Fall back: auto-select if only one player
    if (selectedUser === "__all__" && userOptions.length === 1) {
      setSelectedUser(`${userOptions[0].username}__${userOptions[0].source}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userOptions]);

  // Filtered reports for stats / charts
  const filtered = useMemo(() => {
    if (selectedUser === "__all__") return reports;
    return reports.filter(
      (r) => `${r.chessUsername}__${r.source}` === selectedUser
    );
  }, [reports, selectedUser]);

  // Latest report
  const latest = filtered[0] ?? null;
  const previous = filtered[1] ?? null;

  // Progress data for line chart (oldest → newest, with timestamps for date axis)
  const progressData = useMemo(() => {
    return [...filtered]
      .reverse()
      .map((r) => ({
        timestamp: new Date(r.createdAt).getTime(),
        date: formatShortDate(r.createdAt),
        accuracy: r.estimatedAccuracy ?? 0,
        rating: r.estimatedRating ?? 0,
        cpLoss: r.weightedCpLoss ?? 0,
      }));
  }, [filtered]);

  // Aggregate stats
  const totalGames = filtered.reduce((s, r) => s + r.gamesAnalyzed, 0);
  const totalLeaks = filtered.reduce((s, r) => s + (r.leakCount ?? 0), 0);
  const totalTactics = filtered.reduce((s, r) => s + (r.tacticsCount ?? 0), 0);

  // Days since last scan (for rescan reminder)
  const daysSinceLastScan = useMemo(() => {
    if (!latest) return null;
    const diff = Date.now() - new Date(latest.createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [latest]);

  // All missed tactics across all filtered reports (for Daily Challenge)
  const allTactics = useMemo(() => {
    return filtered.flatMap((r) => r.missedTactics ?? []);
  }, [filtered]);

  // Achievement context
  const achievementCtx: AchievementCtx = useMemo(() => {
    const allAccuracies = reports.map((r) => r.estimatedAccuracy).filter((a): a is number => a != null);
    const allRatings = reports.map((r) => r.estimatedRating).filter((r): r is number => r != null);
    const uniqueUsernames = new Set(reports.map((r) => `${r.chessUsername}__${r.source}`)).size;
    return {
      totalReports: reports.length,
      totalGames: reports.reduce((s, r) => s + r.gamesAnalyzed, 0),
      totalLeaks: reports.reduce((s, r) => s + (r.leakCount ?? 0), 0),
      totalTactics: reports.reduce((s, r) => s + (r.tacticsCount ?? 0), 0),
      bestAccuracy: allAccuracies.length > 0 ? Math.max(...allAccuracies) : null,
      bestRating: allRatings.length > 0 ? Math.max(...allRatings) : null,
      longestStudyStreak: 0, // will be filled by study plan widget later
      studyPlanProgress: 0,
      uniqueUsernames,
      scanModes: [...new Set(reports.map((r) => r.scanMode))],
      latestAccuracy: latest?.estimatedAccuracy ?? null,
      previousAccuracy: previous?.estimatedAccuracy ?? null,
    };
  }, [reports, latest, previous]);

  /* ─── loading / auth states ─── */
  if (sessionLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-white/50">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <div className="glass-card max-w-md space-y-4 p-8 text-center">
          <div className="text-4xl">📊</div>
          <h2 className="text-xl font-bold text-white">Sign in to view your dashboard</h2>
          <p className="text-sm text-white/50">
            Your analysis reports are saved to your account. Sign in to track your
            progress over time.
          </p>
          <Link
            href="/auth/signin"
            className="btn-primary mx-auto mt-4 inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <div className="glass-card max-w-md space-y-4 p-8 text-center">
          <div className="text-4xl">🔬</div>
          <h2 className="text-xl font-bold text-white">No reports yet</h2>
          <p className="text-sm text-white/50">
            Run your first analysis on the{" "}
            <Link href="/" className="text-emerald-400 hover:underline">
              scanner page
            </Link>{" "}
            and your report will appear here automatically.
          </p>
          <Link href="/" className="btn-primary mx-auto mt-4 inline-block">
            Go to Scanner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-emerald-500/[0.07] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-cyan-500/[0.06] blur-[100px]" />
        <div className="animate-float absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 px-6 py-12 md:px-10">
        <div className="mx-auto max-w-6xl space-y-10">

          {/* ─── Header ─── */}
          <header className="animate-fade-in-up space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Dashboard
              </h1>
              {(plan === "pro" || plan === "lifetime") && (
                <span className={`text-xs ${plan === "lifetime" ? "tag-amber" : "tag-emerald"}`}>{plan === "lifetime" ? "LIFETIME" : "PRO"}</span>
              )}
              {profileTitle && (
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${profileTitle.badgeClass}`}>
                  {profileTitle.name}
                </span>
              )}
              {coinBalance > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                  <span>🪙</span> {coinBalance.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-sm text-white/40">
              {user?.name ? `${user.name}'s` : "Your"} chess analysis overview
            </p>
          </header>

          {/* ─── User Filter ─── */}
          {userOptions.length > 1 && (
            <div className="animate-fade-in-up flex items-center gap-3" style={{ animationDelay: "0.05s" }}>
              <label className="text-xs font-medium text-white/40">Player</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white backdrop-blur transition-colors hover:border-white/20 focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="__all__" className="bg-slate-900">All players</option>
                {userOptions.map((u) => (
                  <option
                    key={`${u.username}__${u.source}`}
                    value={`${u.username}__${u.source}`}
                    className="bg-slate-900"
                  >
                    {u.username} ({u.source})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ─── Stat Cards ─── */}
          <div data-tour="stats" className="animate-fade-in-up grid grid-cols-2 gap-4 md:grid-cols-4" style={{ animationDelay: "0.1s" }}>
            <StatCard
              label="Reports"
              value={filtered.length}
              icon="📋"
            />
            <StatCard
              label="Games Analyzed"
              value={totalGames.toLocaleString()}
              icon="♟️"
            />
            <StatCard
              label="Leaks Found"
              value={totalLeaks.toLocaleString()}
              icon="🔍"
            />
            <StatCard
              label="Tactics Missed"
              value={totalTactics.toLocaleString()}
              icon="⚡"
            />
          </div>

          {/* ─── Rescan Reminder ─── */}
          {daysSinceLastScan != null && daysSinceLastScan >= 3 && (
            <div className="animate-fade-in-up rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/[0.06] via-amber-500/[0.03] to-transparent p-4" style={{ animationDelay: "0.12s" }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-xl">⏰</span>
                  <div>
                    <p className="text-sm font-bold text-white">Time for a new scan!</p>
                    <p className="text-xs text-slate-400">
                      It&apos;s been {daysSinceLastScan} day{daysSinceLastScan !== 1 ? "s" : ""} since your last analysis. Run a fresh scan to track improvement.
                    </p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-500/15 transition-all hover:brightness-110"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  New Scan
                </Link>
              </div>
            </div>
          )}

          {/* ─── Progress Highlights (rescan improvement) ─── */}
          {latest && previous && filtered.length >= 2 && (
            <div className="animate-fade-in-up" style={{ animationDelay: "0.13s" }}>
              <ProgressHighlights latest={latest} previous={previous} />
            </div>
          )}

          {/* ─── Study Plan ─── */}
          <div data-tour="study-plan" className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <StudyPlanWidget
              chessUsername={selectedUser !== "__all__" ? selectedUser.split("__")[0] : undefined}
              source={selectedUser !== "__all__" ? selectedUser.split("__")[1] : undefined}
            />
          </div>

          {/* ─── Daily Login Rewards ─── */}
          <div data-tour="daily-login" className="animate-fade-in-up" style={{ animationDelay: "0.155s" }}>
            <DailyLoginRewards />
          </div>

          {/* ─── Daily Challenge ─── */}
          {allTactics.length > 0 && (
            <div data-tour="daily-challenge" className="animate-fade-in-up" style={{ animationDelay: "0.16s" }}>
              <DailyChallenge allTactics={allTactics} />
            </div>
          )}

          {/* ─── Training CTA ─── */}
          <Link
            href="/train"
            className="animate-fade-in-up group block rounded-2xl border border-white/[0.06] bg-gradient-to-r from-fuchsia-500/[0.08] to-cyan-500/[0.08] p-5 transition-all hover:border-fuchsia-500/20 hover:shadow-lg"
            style={{ animationDelay: "0.165s" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15 text-2xl">
                🎯
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white group-hover:text-fuchsia-300">
                  Training Center
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Practice puzzles targeting your weaknesses. Speed drills, opening trainer, endgame gym, and more.
                </p>
              </div>
              <svg className="h-5 w-5 shrink-0 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* ─── Goal + Achievements row ─── */}
          <div data-tour="goals" className="grid gap-6 lg:grid-cols-2">
            <div className="animate-fade-in-up" style={{ animationDelay: "0.17s" }}>
              <GoalWidget
                currentAccuracy={latest?.estimatedAccuracy ?? null}
                currentRating={latest?.estimatedRating ?? null}
              />
            </div>
            <div className="glass-card animate-fade-in-up p-6" style={{ animationDelay: "0.18s" }}>
              <AchievementsPanel ctx={achievementCtx} />
            </div>
          </div>

          {/* ─── Percentile + Repertoire row ─── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="animate-fade-in-up" style={{ animationDelay: "0.19s" }}>
              <PercentileWidget
                accuracy={latest?.estimatedAccuracy ?? null}
                rating={latest?.estimatedRating ?? null}
              />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "0.20s" }}>
              <RepertoirePanel />
            </div>
          </div>

          {/* ─── Main Grid: Radar + Progress ─── */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Radar */}
            <div data-tour="radar" className="glass-card animate-fade-in-up space-y-4 p-6" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Strengths & Weaknesses</h2>
                <span className="text-xs text-white/30">Latest report</span>
              </div>

              {latest && (
                <>
                  <StrengthsRadar {...radarPropsFrom(latest)} />
                  <RadarLegend data={computeRadarData(radarPropsFrom(latest))} props={radarPropsFrom(latest)} />
                </>
              )}
            </div>

            {/* Progress Chart */}
            <div data-tour="progress" className="glass-card animate-fade-in-up space-y-4 p-6" style={{ animationDelay: "0.3s" }}>
              <h2 className="text-lg font-semibold text-white">Progress Over Time</h2>

              {progressData.length < 2 ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-sm text-white/40">
                    Run at least 2 analyses to see your progress chart.
                  </p>
                </div>
              ) : (
                <>
                  {/* Accuracy */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-medium text-white/50">Accuracy</span>
                      {latest && previous && (
                        <DeltaBadge value={delta(latest.estimatedAccuracy, previous.estimatedAccuracy)} />
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={progressData}>
                        <defs>
                          <linearGradient id="gradAccuracy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          type="number"
                          scale="time"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={(ts: number) =>
                            new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          }
                          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={30}
                        />
                        <Tooltip
                          labelFormatter={(label) =>
                            new Date(Number(label)).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          }
                          contentStyle={{
                            background: "rgba(15,23,42,0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="accuracy"
                          stroke="rgb(16,185,129)"
                          fill="url(#gradAccuracy)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "rgb(52,211,153)" }}
                          animationDuration={800}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* CP Loss */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      <span className="text-xs font-medium text-white/50">Avg CP Loss</span>
                      {latest && previous && (
                        <DeltaBadge value={delta(latest.weightedCpLoss, previous.weightedCpLoss)} invert />
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={progressData}>
                        <defs>
                          <linearGradient id="gradCp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          type="number"
                          scale="time"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={(ts: number) =>
                            new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          }
                          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={30}
                        />
                        <Tooltip
                          labelFormatter={(label) =>
                            new Date(Number(label)).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          }
                          contentStyle={{
                            background: "rgba(15,23,42,0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cpLoss"
                          stroke="rgb(6,182,212)"
                          fill="url(#gradCp)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "rgb(34,211,238)" }}
                          animationDuration={800}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ─── Coin Shop ─── */}
          <div data-tour="coin-shop" className="animate-fade-in-up" style={{ animationDelay: "0.38s" }}>
            <CoinShop />
          </div>

          {/* ─── Key Metrics Comparison (latest vs previous) ─── */}
          {latest && previous && filtered.length >= 2 && (
            <div className="glass-card animate-fade-in-up space-y-4 p-6" style={{ animationDelay: "0.4s" }}>
              <h2 className="text-lg font-semibold text-white">Latest vs. Previous</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <CompareMetric
                  label="Accuracy"
                  current={latest.estimatedAccuracy}
                  prev={previous.estimatedAccuracy}
                  suffix="%"
                />
                <CompareMetric
                  label="Est. Rating"
                  current={latest.estimatedRating}
                  prev={previous.estimatedRating}
                />
                <CompareMetric
                  label="Avg CP Loss"
                  current={latest.weightedCpLoss}
                  prev={previous.weightedCpLoss}
                  invert
                />
                <CompareMetric
                  label="Severe Leak Rate"
                  current={latest.severeLeakRate != null ? latest.severeLeakRate * 100 : null}
                  prev={previous.severeLeakRate != null ? previous.severeLeakRate * 100 : null}
                  suffix="%"
                  invert
                />
              </div>
            </div>
          )}

          {/* ─── Report History ─── */}
          <div data-tour="reports" className="animate-fade-in-up space-y-4" style={{ animationDelay: "0.5s" }}>
            <h2 className="text-lg font-semibold text-white">Report History</h2>
            <div className="space-y-3">
              {reports.map((r, i) => (
                <ReportRow
                  key={r.id}
                  report={r}
                  index={i}
                  expanded={expandedId === r.id}
                  onToggle={() =>
                    setExpandedId(expandedId === r.id ? null : r.id)
                  }
                  onDelete={() => handleDeleteReport(r.id)}
                />
              ))}
            </div>
          </div>

          {/* ─── Onboarding Tour ─── */}
          <OnboardingTour />

        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="glass-card flex items-center gap-4 p-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-white/40">{label}</div>
      </div>
    </div>
  );
}

function DeltaBadge({ value, invert = false }: { value: string; invert?: boolean }) {
  if (!value) return null;
  const num = parseFloat(value);
  const isGood = invert ? num < 0 : num > 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        isGood
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-red-500/20 text-red-400"
      }`}
    >
      {value}
    </span>
  );
}

function CompareMetric({
  label,
  current,
  prev,
  suffix = "",
  invert = false,
}: {
  label: string;
  current: number | null;
  prev: number | null;
  suffix?: string;
  invert?: boolean;
}) {
  const diff = current != null && prev != null ? current - prev : null;
  const isGood = diff != null ? (invert ? diff < 0 : diff > 0) : false;
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <div className="mb-1 text-xs text-white/40">{label}</div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold text-white">
          {current != null ? current.toFixed(1) : "—"}{suffix}
        </span>
        {diff != null && (
          <span
            className={`mb-0.5 text-xs font-semibold ${
              isGood ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {diff > 0 ? "+" : ""}
            {diff.toFixed(1)}
          </span>
        )}
      </div>
      <div className="mt-1 text-[10px] text-white/25">
        prev: {prev != null ? prev.toFixed(1) : "—"}{suffix}
      </div>
    </div>
  );
}

function ReportRow({
  report,
  index,
  expanded,
  onToggle,
  onDelete,
}: {
  report: SavedReport;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const r = report;
  const rProps = radarPropsFrom(r);
  const radarData = computeRadarData(rProps);
  const avg = Math.round(radarData.reduce((s, d) => s + d.value, 0) / radarData.length);
  const avgColor =
    avg >= 75
      ? "text-emerald-400"
      : avg >= 50
        ? "text-cyan-400"
        : avg >= 30
          ? "text-amber-400"
          : "text-red-400";

  const sourceIcon = r.source === "lichess" ? "♞" : "♚";
  const modeLabel =
    r.scanMode === "openings"
      ? "Openings"
      : r.scanMode === "tactics"
        ? "Tactics"
        : "Full Scan";

  return (
    <div className="glass-card relative overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-4 pr-10 text-left transition-colors hover:bg-white/[0.02]"
      >
        {/* Mini score circle */}
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-sm font-bold ${avgColor}`}
        >
          {avg}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">
              {r.chessUsername}
            </span>
            <span className="text-xs text-white/30">{sourceIcon}</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
              {modeLabel}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-white/30">
            <span>{r.gamesAnalyzed} games</span>
            <span>·</span>
            <span>{r.leakCount ?? 0} leaks</span>
            <span>·</span>
            <span>{r.tacticsCount ?? 0} tactics</span>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="text-xs text-white/30">{formatDate(r.createdAt)}</div>
          <div className="mt-1 text-xs text-white/20">
            {r.estimatedAccuracy != null
              ? `${r.estimatedAccuracy.toFixed(1)}% acc`
              : ""}
          </div>
        </div>

        <svg
          className={`h-4 w-4 flex-shrink-0 text-white/20 transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete report"
        className="absolute right-2 top-2 rounded-lg p-1.5 text-white/20 transition-colors hover:bg-red-500/20 hover:text-red-400"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-6 space-y-6">
          {/* Report Card (same layout as scanner) */}
          {r.estimatedAccuracy != null && (
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-6">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/[0.08] via-emerald-500/[0.05] to-cyan-500/[0.08]" />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-white">Analysis Report</h3>
                  <div className="flex flex-wrap gap-2">
                    {r.reportMeta?.vibeTitle && (
                      <span className="tag-fuchsia">{r.reportMeta.vibeTitle}</span>
                    )}
                    <span className="tag-emerald">Stockfish 18</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="stat-card"><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Accuracy</p><p className="mt-1 text-2xl font-bold text-emerald-400">{r.estimatedAccuracy?.toFixed(1)}%</p></div>
                  <div className="stat-card"><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Est. Rating</p><p className="mt-1 text-2xl font-bold text-emerald-400">{r.estimatedRating?.toFixed(0)}</p></div>
                  <div className="stat-card"><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Avg Eval Loss</p><p className="mt-1 text-2xl font-bold text-emerald-400">{((r.weightedCpLoss ?? 0) / 100).toFixed(2)}</p></div>
                  <div className="stat-card"><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Leak Rate</p><p className="mt-1 text-2xl font-bold text-red-400">{((r.severeLeakRate ?? 0) * 100).toFixed(0)}%</p></div>
                </div>
                {r.reportMeta && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <div className="stat-card"><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Consistency</p><p className="mt-1 text-2xl font-bold text-cyan-400">{r.reportMeta.consistencyScore ?? "—"}/100</p></div>
                    <div className="stat-card"><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Peak Throw</p><p className="mt-1 text-2xl font-bold text-cyan-400">{((r.reportMeta.p75CpLoss ?? 0) / 100).toFixed(2)}</p></div>
                    <div className="stat-card"><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Confidence</p><p className="mt-1 text-2xl font-bold text-cyan-400">{r.reportMeta.confidence ?? "—"}%</p></div>
                    <div className="stat-card"><p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Main Pattern</p><p className="mt-1 text-sm font-bold text-fuchsia-400">{r.reportMeta.topTag ?? "—"}</p></div>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/30">
                  <span>{r.gamesAnalyzed} games</span>
                  <span>·</span>
                  <span>Depth {r.engineDepth ?? "—"}</span>
                  <span>·</span>
                  <span>{r.source}</span>
                  <span>·</span>
                  <span>{r.scanMode}</span>
                  {r.reportMeta?.sampleSize && (
                    <><span>·</span><span>{r.reportMeta.sampleSize} positions</span></>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Radar */}
            <div>
              <StrengthsRadar {...rProps} />
              <div className="mt-4">
                <RadarLegend data={radarData} props={rProps} />
              </div>
            </div>

            {/* Stats grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Accuracy" value={`${r.estimatedAccuracy?.toFixed(1) ?? "—"}%`} />
                <MiniStat label="Est. Rating" value={`${r.estimatedRating?.toFixed(0) ?? "—"}`} />
                <MiniStat label="Avg CP Loss" value={`${r.weightedCpLoss?.toFixed(1) ?? "—"}`} />
                <MiniStat label="Severe Leak Rate" value={`${((r.severeLeakRate ?? 0) * 100).toFixed(1)}%`} />
                <MiniStat label="Opening Leaks" value={`${r.leakCount ?? 0}`} />
                <MiniStat label="Missed Tactics" value={`${r.tacticsCount ?? 0}`} />
                <MiniStat label="Games" value={`${r.gamesAnalyzed}`} />
                <MiniStat label="Engine Depth" value={`${r.engineDepth ?? "—"}`} />
              </div>
            </div>
          </div>

          {/* Opening Leaks */}
          {r.leaks && r.leaks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Opening Leaks ({r.leaks.length})</h3>
              <div className="space-y-4">
                {r.leaks.slice(0, 10).map((leak: any, i: number) => (
                  <MistakeCard
                    key={`${leak.fenBefore}-${i}`}
                    leak={leak}
                    engineDepth={r.engineDepth ?? 12}
                  />
                ))}
              </div>
              {r.leaks.length > 10 && (
                <p className="text-center text-xs text-white/30">
                  Showing 10 of {r.leaks.length} leaks
                </p>
              )}
            </div>
          )}

          {/* Missed Tactics */}
          {r.missedTactics && r.missedTactics.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Missed Tactics ({r.missedTactics.length})</h3>
              <div className="space-y-4">
                {r.missedTactics.slice(0, 10).map((tactic: any, i: number) => (
                  <TacticCard
                    key={`${tactic.fenBefore}-${i}`}
                    tactic={tactic}
                    engineDepth={r.engineDepth ?? 12}
                  />
                ))}
              </div>
              {r.missedTactics.length > 10 && (
                <p className="text-center text-xs text-white/30">
                  Showing 10 of {r.missedTactics.length} tactics
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="text-[10px] text-white/30">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
