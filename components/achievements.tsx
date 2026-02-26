"use client";

import { useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type AchievementDef = {
  id: string;
  icon: string;
  title: string;
  description: string;
  /** colour theme */
  color: "emerald" | "amber" | "cyan" | "fuchsia" | "violet" | "orange" | "rose" | "sky";
  /** return true if unlocked */
  check: (ctx: AchievementCtx) => boolean;
};

export type AchievementCtx = {
  totalReports: number;
  totalGames: number;
  totalLeaks: number;
  totalTactics: number;
  bestAccuracy: number | null;
  bestRating: number | null;
  longestStudyStreak: number;
  studyPlanProgress: number; // 0-100
  uniqueUsernames: number;
  scanModes: string[];
  latestAccuracy: number | null;
  previousAccuracy: number | null;
};

/* ------------------------------------------------------------------ */
/*  Achievement Definitions                                             */
/* ------------------------------------------------------------------ */

const ACHIEVEMENTS: AchievementDef[] = [
  // Milestones
  {
    id: "first_scan",
    icon: "🔬",
    title: "First Scan",
    description: "Run your first analysis",
    color: "emerald",
    check: (c) => c.totalReports >= 1,
  },
  {
    id: "five_scans",
    icon: "📊",
    title: "Getting Serious",
    description: "Run 5 analyses",
    color: "cyan",
    check: (c) => c.totalReports >= 5,
  },
  {
    id: "ten_scans",
    icon: "🏅",
    title: "Dedicated Analyst",
    description: "Run 10 analyses",
    color: "amber",
    check: (c) => c.totalReports >= 10,
  },
  {
    id: "25_scans",
    icon: "🏆",
    title: "Grand Analyst",
    description: "Run 25 analyses",
    color: "fuchsia",
    check: (c) => c.totalReports >= 25,
  },
  // Games
  {
    id: "100_games",
    icon: "♟️",
    title: "Century",
    description: "Analyze 100 games total",
    color: "emerald",
    check: (c) => c.totalGames >= 100,
  },
  {
    id: "500_games",
    icon: "♞",
    title: "Half a Thousand",
    description: "Analyze 500 games total",
    color: "cyan",
    check: (c) => c.totalGames >= 500,
  },
  {
    id: "1000_games",
    icon: "♛",
    title: "The Thousand",
    description: "Analyze 1,000 games total",
    color: "amber",
    check: (c) => c.totalGames >= 1000,
  },
  // Accuracy
  {
    id: "acc_70",
    icon: "🎯",
    title: "On Target",
    description: "Reach 70% accuracy in a scan",
    color: "emerald",
    check: (c) => (c.bestAccuracy ?? 0) >= 70,
  },
  {
    id: "acc_80",
    icon: "💎",
    title: "Diamond Precision",
    description: "Reach 80% accuracy in a scan",
    color: "cyan",
    check: (c) => (c.bestAccuracy ?? 0) >= 80,
  },
  {
    id: "acc_90",
    icon: "👑",
    title: "Grandmaster Accuracy",
    description: "Reach 90% accuracy in a scan",
    color: "amber",
    check: (c) => (c.bestAccuracy ?? 0) >= 90,
  },
  // Rating
  {
    id: "rating_1200",
    icon: "⭐",
    title: "Rising Star",
    description: "Estimated rating above 1200",
    color: "emerald",
    check: (c) => (c.bestRating ?? 0) >= 1200,
  },
  {
    id: "rating_1500",
    icon: "🌟",
    title: "Club Player",
    description: "Estimated rating above 1500",
    color: "cyan",
    check: (c) => (c.bestRating ?? 0) >= 1500,
  },
  {
    id: "rating_1800",
    icon: "💫",
    title: "Tournament Strength",
    description: "Estimated rating above 1800",
    color: "amber",
    check: (c) => (c.bestRating ?? 0) >= 1800,
  },
  {
    id: "rating_2000",
    icon: "🏆",
    title: "Expert",
    description: "Estimated rating above 2000",
    color: "fuchsia",
    check: (c) => (c.bestRating ?? 0) >= 2000,
  },
  // Improvement
  {
    id: "improved",
    icon: "📈",
    title: "Improving",
    description: "Increase accuracy between scans",
    color: "emerald",
    check: (c) =>
      c.latestAccuracy != null &&
      c.previousAccuracy != null &&
      c.latestAccuracy > c.previousAccuracy,
  },
  // Study plan
  {
    id: "plan_started",
    icon: "📋",
    title: "Student",
    description: "Start a study plan",
    color: "violet",
    check: (c) => c.studyPlanProgress > 0,
  },
  {
    id: "plan_complete",
    icon: "🎓",
    title: "Graduate",
    description: "Complete 100% of a study plan",
    color: "amber",
    check: (c) => c.studyPlanProgress >= 100,
  },
  // Streaks
  {
    id: "streak_3",
    icon: "🔥",
    title: "On Fire",
    description: "3-day study streak",
    color: "orange",
    check: (c) => c.longestStudyStreak >= 3,
  },
  {
    id: "streak_7",
    icon: "🔥",
    title: "Week Warrior",
    description: "7-day study streak",
    color: "amber",
    check: (c) => c.longestStudyStreak >= 7,
  },
  {
    id: "streak_30",
    icon: "🔥",
    title: "Monthly Master",
    description: "30-day study streak",
    color: "fuchsia",
    check: (c) => c.longestStudyStreak >= 30,
  },
  // Modes
  {
    id: "all_modes",
    icon: "🧩",
    title: "Full Spectrum",
    description: "Use Openings, Tactics, and Both scan modes",
    color: "fuchsia",
    check: (c) => {
      const modes = new Set(c.scanModes);
      return modes.has("openings") && (modes.has("tactics") || modes.has("both")) && (modes.has("endgames") || modes.has("both"));
    },
  },
  // Multi-user
  {
    id: "multi_user",
    icon: "👥",
    title: "Coach Mode",
    description: "Analyze 2+ different players",
    color: "sky",
    check: (c) => c.uniqueUsernames >= 2,
  },
];

/* ------------------------------------------------------------------ */
/*  Colour map                                                          */
/* ------------------------------------------------------------------ */

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", glow: "shadow-emerald-500/10" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-400",   glow: "shadow-amber-500/10" },
  cyan:    { bg: "bg-cyan-500/10",     border: "border-cyan-500/25",    text: "text-cyan-400",    glow: "shadow-cyan-500/10" },
  fuchsia: { bg: "bg-fuchsia-500/10",  border: "border-fuchsia-500/25", text: "text-fuchsia-400", glow: "shadow-fuchsia-500/10" },
  violet:  { bg: "bg-violet-500/10",   border: "border-violet-500/25",  text: "text-violet-400",  glow: "shadow-violet-500/10" },
  orange:  { bg: "bg-orange-500/10",   border: "border-orange-500/25",  text: "text-orange-400",  glow: "shadow-orange-500/10" },
  rose:    { bg: "bg-rose-500/10",     border: "border-rose-500/25",    text: "text-rose-400",    glow: "shadow-rose-500/10" },
  sky:     { bg: "bg-sky-500/10",      border: "border-sky-500/25",     text: "text-sky-400",     glow: "shadow-sky-500/10" },
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function AchievementsPanel({ ctx }: { ctx: AchievementCtx }) {
  const [showAll, setShowAll] = useState(false);

  const { unlocked, locked } = useMemo(() => {
    const u: (AchievementDef & { unlocked: true })[] = [];
    const l: (AchievementDef & { unlocked: false })[] = [];
    for (const a of ACHIEVEMENTS) {
      if (a.check(ctx)) u.push({ ...a, unlocked: true });
      else l.push({ ...a, unlocked: false });
    }
    return { unlocked: u, locked: l };
  }, [ctx]);

  const displayed: (AchievementDef & { unlocked: boolean })[] = showAll ? [...unlocked, ...locked] : unlocked.length > 0 ? unlocked : locked.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Achievements</h2>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-xs text-white/40 transition-colors hover:text-white/70"
        >
          {showAll ? "Show unlocked" : "Show all"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700"
          style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
        />
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {displayed.map((a) => {
          const isUnlocked = a.unlocked;
          const c = COLOR_MAP[a.color] ?? COLOR_MAP.emerald;
          return (
            <div
              key={a.id}
              className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                isUnlocked
                  ? `${c.border} ${c.bg} shadow-lg ${c.glow}`
                  : "border-white/[0.04] bg-white/[0.015] opacity-40"
              }`}
            >
              <span className={`text-2xl ${isUnlocked ? "" : "grayscale"}`}>{a.icon}</span>
              <p className={`text-[11px] font-bold leading-tight ${isUnlocked ? c.text : "text-white/40"}`}>
                {a.title}
              </p>
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-[10px] text-white/70 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                {a.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
