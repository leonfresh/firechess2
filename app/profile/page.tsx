"use client";

/**
 * /profile — Chess Profile & Lesson Plan Generator
 *
 * Lets the user link a chess username (picked from their scanned games),
 * view aggregated weakness data, and auto-generate a shareable lesson plan
 * for coaches or self-study.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/session-provider";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type SavedReport = {
  id: string;
  chessUsername: string;
  source: string;
  scanMode: string;
  gamesAnalyzed: number;
  estimatedAccuracy: number | null;
  estimatedRating: number | null;
  weightedCpLoss: number | null;
  severeLeakRate: number | null;
  leakCount: number | null;
  tacticsCount: number | null;
  leaks: { tags?: string[] }[];
  missedTactics: { motif?: string }[];
  reportMeta: { topTag?: string; vibeTitle?: string } | null;
  createdAt: string;
};

type PlayerOption = { username: string; source: "lichess" | "chesscom" };

type LessonTask = {
  week: number;
  category: string;
  title: string;
  description: string;
  link: string;
  icon: string;
};

/* ------------------------------------------------------------------ */
/*  Lesson plan generator                                               */
/* ------------------------------------------------------------------ */

const TAG_TO_TRAINING: Record<
  string,
  { link: string; icon: string; label: string }
> = {
  Opening: {
    link: "/openings",
    icon: "🌲",
    label: "Opening repertoire drills",
  },
  "Center Control": {
    link: "/openings",
    icon: "♟️",
    label: "Center control openings",
  },
  Endgame: { link: "/endgames", icon: "👑", label: "Endgame technique" },
  "Pawn Endgame": {
    link: "/endgames",
    icon: "♙",
    label: "Pawn endgame technique",
  },
  "Rook Endgame": {
    link: "/endgames",
    icon: "♖",
    label: "Rook endgame mastery",
  },
  "King Safety": { link: "/tactics", icon: "🛡️", label: "King safety drills" },
  "Missed Check": {
    link: "/tactics",
    icon: "⚔️",
    label: "Tactical pattern recognition",
  },
  "Missed Capture": {
    link: "/tactics",
    icon: "🎯",
    label: "Tactical awareness",
  },
  "Tactical Miss": { link: "/tactics", icon: "🔍", label: "Tactic puzzles" },
  "Major Blunder": {
    link: "/tactics",
    icon: "💥",
    label: "Blunder prevention",
  },
  Crushing: { link: "/tactics", icon: "🚨", label: "Critical moment training" },
  "Repeated Habit": {
    link: "/train",
    icon: "🔁",
    label: "Break bad habits — drill mode",
  },
  Middlegame: { link: "/train", icon: "⚡", label: "Middlegame strategy" },
  Fork: { link: "/tactics", icon: "🍴", label: "Fork pattern drills" },
  Pin: { link: "/tactics", icon: "📌", label: "Pin & skewer tactics" },
  Skewer: { link: "/tactics", icon: "📌", label: "Pin & skewer tactics" },
};

const DEFAULT_TRAINING = {
  link: "/train",
  icon: "📚",
  label: "General training",
};

function generateLessonPlan(reports: SavedReport[]): LessonTask[] {
  // Count tag frequency across all reports
  const tagCounts = new Map<string, number>();
  for (const r of reports) {
    for (const leak of r.leaks ?? []) {
      for (const tag of leak.tags ?? []) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    for (const t of r.missedTactics ?? []) {
      if (t.motif) tagCounts.set(t.motif, (tagCounts.get(t.motif) ?? 0) + 1);
    }
  }

  // Sort by frequency, skip severity tags - keep actionable ones
  const skipTags = new Set([
    "Opening",
    "Middlegame",
    "Endgame",
    "Repeated Habit",
  ]);
  const phaseTags = ["Opening", "Middlegame", "Endgame"];

  const topActionable = [...tagCounts.entries()]
    .filter(([tag]) => !skipTags.has(tag) && TAG_TO_TRAINING[tag])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const topPhases = phaseTags
    .filter((tag) => tagCounts.has(tag))
    .sort((a, b) => (tagCounts.get(b) ?? 0) - (tagCounts.get(a) ?? 0))
    .slice(0, 2);

  const tasks: LessonTask[] = [];
  let week = 1;

  // Week 1: Top 2 critical issues
  for (const [tag] of topActionable.slice(0, 2)) {
    const training = TAG_TO_TRAINING[tag] ?? DEFAULT_TRAINING;
    const count = tagCounts.get(tag) ?? 0;
    tasks.push({
      week,
      category: tag,
      title: training.label,
      description: `Appeared ${count} time${count !== 1 ? "s" : ""} in your games. High priority.`,
      link: training.link,
      icon: training.icon,
    });
  }

  // Add a phase focus if Opening or Endgame is a weakness
  if (topPhases[0] === "Opening" || topPhases[0] === "Endgame") {
    const tr = TAG_TO_TRAINING[topPhases[0]];
    const count = tagCounts.get(topPhases[0]) ?? 0;
    tasks.push({
      week,
      category: topPhases[0],
      title: tr.label,
      description: `${count} mistake${count !== 1 ? "s" : ""} in the ${topPhases[0].toLowerCase()} phase.`,
      link: tr.link,
      icon: tr.icon,
    });
  }

  week = 2;

  // Week 2: Next 2 issues
  for (const [tag] of topActionable.slice(2, 4)) {
    const training = TAG_TO_TRAINING[tag] ?? DEFAULT_TRAINING;
    const count = tagCounts.get(tag) ?? 0;
    tasks.push({
      week,
      category: tag,
      title: training.label,
      description: `Appeared ${count} time${count !== 1 ? "s" : ""} in your games.`,
      link: training.link,
      icon: training.icon,
    });
  }

  // Add general review
  tasks.push({
    week: 2,
    category: "Review",
    title: "Game review — analyze your recent games",
    description: "Re-scan your latest games to track improvement from Week 1.",
    link: "/",
    icon: "🔍",
  });

  week = 3;

  // Week 3: Remaining issues + habit formation
  for (const [tag] of topActionable.slice(4, 6)) {
    const training = TAG_TO_TRAINING[tag] ?? DEFAULT_TRAINING;
    const count = tagCounts.get(tag) ?? 0;
    tasks.push({
      week,
      category: tag,
      title: training.label,
      description: `Appeared ${count} time${count !== 1 ? "s" : ""} in your games.`,
      link: training.link,
      icon: training.icon,
    });
  }

  if (tagCounts.has("Repeated Habit")) {
    const count = tagCounts.get("Repeated Habit") ?? 0;
    tasks.push({
      week: 3,
      category: "Habit",
      title: "Break recurring mistakes — drill mode",
      description: `${count} repeated pattern${count !== 1 ? "s" : ""} detected. Drill until they stop.`,
      link: "/train",
      icon: "🔁",
    });
  }

  tasks.push({
    week: 4,
    category: "Mixed",
    title: "Full scan — measure improvement",
    description:
      "Do a fresh full scan to see how your accuracy and rating estimate have improved.",
    link: "/",
    icon: "📈",
  });

  tasks.push({
    week: 4,
    category: "Daily",
    title: "Daily challenge habit",
    description:
      "Solve the daily puzzle every day this week to build pattern recognition.",
    link: "/daily",
    icon: "📅",
  });

  // If very few tags, fill with fallback recommendations
  if (tasks.length < 4) {
    tasks.push(
      {
        week: 1,
        category: "Tactics",
        title: "Tactic puzzles",
        description: "Build pattern recognition with daily puzzles.",
        link: "/tactics",
        icon: "⚔️",
      },
      {
        week: 1,
        category: "Endgames",
        title: "Endgame fundamentals",
        description:
          "Master king + pawn endgames — the most common endgame type.",
        link: "/endgames",
        icon: "👑",
      },
    );
  }

  return tasks;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

const SOURCE_LABEL: Record<
  string,
  { name: string; color: string; flag: string }
> = {
  chesscom: { name: "Chess.com", color: "text-emerald-400", flag: "♟️" },
  lichess: { name: "Lichess", color: "text-slate-300", flag: "🔥" },
};

function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_LABEL[source] ?? {
    name: source,
    color: "text-slate-400",
    flag: "♟️",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${s.color}`}
    >
      {s.flag} {s.name}
    </span>
  );
}

function WeaknessBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-500">{count}×</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const WEEK_COLORS = [
  "border-orange-500/30 bg-orange-500/5",
  "border-blue-500/30 bg-blue-500/5",
  "border-violet-500/30 bg-violet-500/5",
  "border-emerald-500/30 bg-emerald-500/5",
];
const WEEK_LABELS = ["Week 1", "Week 2", "Week 3", "Week 4"];

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

const LINKED_USER_KEY = "fc-profile-linked-user";

export default function ProfilePage() {
  const { loading: sessionLoading, authenticated, user } = useSession();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkedUser, setLinkedUser] = useState<string>(""); // "username__source"
  const [showPlan, setShowPlan] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load reports
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

  // Unique player options
  const playerOptions = useMemo<PlayerOption[]>(() => {
    const seen = new Map<string, PlayerOption>();
    for (const r of reports) {
      const key = `${r.chessUsername}__${r.source}`;
      if (!seen.has(key))
        seen.set(key, {
          username: r.chessUsername,
          source: r.source as "lichess" | "chesscom",
        });
    }
    return Array.from(seen.values());
  }, [reports]);

  // Load/persist linked user
  useEffect(() => {
    if (playerOptions.length === 0) return;
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem(LINKED_USER_KEY)
        : null;
    if (
      saved &&
      playerOptions.some((p) => `${p.username}__${p.source}` === saved)
    ) {
      setLinkedUser(saved);
    } else if (user?.name) {
      const match = playerOptions.find(
        (p) => p.username.toLowerCase() === user.name!.toLowerCase(),
      );
      if (match) setLinkedUser(`${match.username}__${match.source}`);
      else
        setLinkedUser(
          `${playerOptions[0].username}__${playerOptions[0].source}`,
        );
    } else {
      setLinkedUser(`${playerOptions[0].username}__${playerOptions[0].source}`);
    }
  }, [playerOptions, user?.name]);

  useEffect(() => {
    if (linkedUser && typeof window !== "undefined") {
      localStorage.setItem(LINKED_USER_KEY, linkedUser);
    }
  }, [linkedUser]);

  const profileName = linkedUser.split("__")[0] ?? "";
  const profileSource = linkedUser.split("__")[1] ?? "";

  // Reports for the linked user
  const profileReports = useMemo(
    () =>
      reports.filter((r) => `${r.chessUsername}__${r.source}` === linkedUser),
    [reports, linkedUser],
  );

  const latestReport = profileReports[0] ?? null;

  // Aggregate tag counts
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of profileReports) {
      for (const leak of r.leaks ?? []) {
        for (const tag of leak.tags ?? []) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
    }
    return counts;
  }, [profileReports]);

  const topTags = useMemo(() => {
    const ignore = new Set(["Opening", "Middlegame", "Endgame"]);
    return [...tagCounts.entries()]
      .filter(([t]) => !ignore.has(t))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [tagCounts]);

  const maxTagCount = topTags[0]?.[1] ?? 1;

  // Lesson plan
  const lessonPlan = useMemo(
    () => (showPlan ? generateLessonPlan(profileReports) : []),
    [showPlan, profileReports],
  );

  const planByWeek = useMemo(() => {
    const weeks: Record<number, LessonTask[]> = {};
    for (const task of lessonPlan) {
      if (!weeks[task.week]) weeks[task.week] = [];
      weeks[task.week].push(task);
    }
    return weeks;
  }, [lessonPlan]);

  const profileCompleteness = useMemo(() => {
    let score = 0;
    if (linkedUser) score += 25;
    const hasOpeningScan = profileReports.some(
      (r) => r.scanMode === "openings" || r.scanMode === "both",
    );
    const hasTacticsScan = profileReports.some((r) => r.scanMode === "tactics");
    const hasEndgameScan = profileReports.some(
      (r) => r.scanMode === "endgames",
    );
    if (hasOpeningScan) score += 25;
    if (hasTacticsScan) score += 25;
    if (hasEndgameScan) score += 25;
    return { score, hasOpeningScan, hasTacticsScan, hasEndgameScan };
  }, [linkedUser, profileReports]);

  function copyPlan() {
    const lines = [
      `Chess Training Plan — ${profileName} on ${SOURCE_LABEL[profileSource]?.name ?? profileSource}`,
      "",
    ];
    for (const [w, tasks] of Object.entries(planByWeek)) {
      lines.push(`${WEEK_LABELS[Number(w) - 1]}:`);
      for (const t of tasks) {
        lines.push(`  ${t.icon} ${t.title} — ${t.description}`);
      }
      lines.push("");
    }
    lines.push("Generated by FireChess — firechess.app");
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  /* ── Render ── */

  if (!sessionLoading && !authenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <div className="text-5xl">♟️</div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Chess Profile</h1>
          <p className="mt-2 text-slate-400">
            Sign in to build your chess profile and generate lesson plans.
          </p>
        </div>
        <Link
          href="/auth/signin"
          className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="text-5xl">📡</div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Build Your Chess Profile
          </h1>
          <p className="mt-2 text-slate-400">
            Scan your games first — FireChess will analyze your mistakes and
            build a profile automatically.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Scan My Games
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Chess Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Your linked chess identity and auto-generated training plan.
        </p>
      </div>

      {/* ── Player Picker ── */}
      <div className="glass-card space-y-4 p-6">
        <h2 className="text-base font-semibold text-white">Linked Player</h2>
        <p className="text-sm text-slate-400">
          Select which scanned username represents you. Lesson plans are
          generated for this profile.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {playerOptions.map((p) => {
            const key = `${p.username}__${p.source}`;
            const isSelected = linkedUser === key;
            const count = reports.filter(
              (r) => `${r.chessUsername}__${r.source}` === key,
            ).length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setLinkedUser(key);
                  setShowPlan(false);
                }}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-orange-500/50 bg-orange-500/10 ring-1 ring-orange-500/30"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${isSelected ? "bg-orange-500/20" : "bg-white/[0.06]"}`}
                >
                  {SOURCE_LABEL[p.source]?.flag ?? "♟️"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">
                    {p.username}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <SourceBadge source={p.source} />
                    <span className="text-xs text-slate-500">
                      {count} scan{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Profile Completeness ── */}
      {linkedUser && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Profile Completeness
            </h2>
            <span
              className={`text-sm font-bold ${profileCompleteness.score >= 100 ? "text-emerald-400" : profileCompleteness.score >= 50 ? "text-amber-400" : "text-orange-400"}`}
            >
              {profileCompleteness.score}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/[0.06]">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${
                profileCompleteness.score >= 100
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-orange-500 to-amber-400"
              }`}
              style={{ width: `${profileCompleteness.score}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            {[
              { label: "Linked player", done: !!linkedUser, link: null },
              {
                label: "Opening scan",
                done: profileCompleteness.hasOpeningScan,
                link: "/",
              },
              {
                label: "Tactics scan",
                done: profileCompleteness.hasTacticsScan,
                link: "/",
              },
              {
                label: "Endgame scan",
                done: profileCompleteness.hasEndgameScan,
                link: "/",
              },
            ].map((step) => (
              <div
                key={step.label}
                className={`flex items-center gap-2 rounded-lg p-3 ${step.done ? "bg-emerald-500/10" : "bg-white/[0.03]"}`}
              >
                <span
                  className={step.done ? "text-emerald-400" : "text-slate-600"}
                >
                  {step.done ? "✓" : "○"}
                </span>
                <span
                  className={step.done ? "text-emerald-300" : "text-slate-500"}
                >
                  {step.label}
                </span>
                {!step.done && step.link && (
                  <Link
                    href={step.link}
                    className="ml-auto text-xs text-orange-400 hover:underline"
                  >
                    Scan →
                  </Link>
                )}
              </div>
            ))}
          </div>
          {profileCompleteness.score < 100 && (
            <p className="text-xs text-slate-500">
              Complete all scans to unlock the full lesson plan generator.
            </p>
          )}
        </div>
      )}

      {/* ── stats summary ── */}
      {latestReport && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Profile Stats
            </h2>
            <span className="text-xs text-slate-500">
              Based on {profileReports.length} scan
              {profileReports.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "Accuracy",
                value:
                  latestReport.estimatedAccuracy != null
                    ? `${Math.round(latestReport.estimatedAccuracy)}%`
                    : "—",
                color: "text-emerald-400",
              },
              {
                label: "Est. Rating",
                value:
                  latestReport.estimatedRating != null
                    ? Math.round(latestReport.estimatedRating).toString()
                    : "—",
                color: "text-blue-400",
              },
              {
                label: "Avg CP Loss",
                value:
                  latestReport.weightedCpLoss != null
                    ? Math.round(latestReport.weightedCpLoss).toString()
                    : "—",
                color: "text-amber-400",
              },
              {
                label: "Games Scanned",
                value: profileReports
                  .reduce((s, r) => s + r.gamesAnalyzed, 0)
                  .toString(),
                color: "text-slate-300",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/[0.03] p-4 text-center"
              >
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {topTags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300">
                Top Weaknesses
              </h3>
              <div className="space-y-2.5">
                {topTags.map(([tag, count]) => (
                  <WeaknessBar
                    key={tag}
                    label={tag}
                    count={count}
                    max={maxTagCount}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Lesson Plan ── */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Lesson Plan</h2>
            <p className="mt-1 text-sm text-slate-400">
              Auto-generated from your weaknesses. Share this with your coach.
            </p>
          </div>
          {!showPlan ? (
            <button
              type="button"
              onClick={() => setShowPlan(true)}
              disabled={profileReports.length === 0}
              className="flex-shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate Plan
            </button>
          ) : (
            <button
              type="button"
              onClick={copyPlan}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/[0.2] hover:text-white"
            >
              {copied ? (
                <>
                  <svg
                    className="h-4 w-4 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy for coach
                </>
              )}
            </button>
          )}
        </div>

        {showPlan && Object.entries(planByWeek).length > 0 && (
          <div className="space-y-4">
            {Object.entries(planByWeek).map(([w, tasks]) => {
              const weekIdx = Number(w) - 1;
              return (
                <div
                  key={w}
                  className={`rounded-xl border p-4 space-y-3 ${WEEK_COLORS[weekIdx] ?? WEEK_COLORS[0]}`}
                >
                  <h3 className="text-sm font-bold text-white">
                    {WEEK_LABELS[weekIdx] ?? `Week ${w}`}
                  </h3>
                  <div className="space-y-2">
                    {tasks.map((task, i) => (
                      <Link
                        key={i}
                        href={task.link}
                        className="flex items-start gap-3 rounded-lg bg-black/20 p-3 text-sm transition hover:bg-black/30"
                      >
                        <span className="text-base leading-none mt-0.5">
                          {task.icon}
                        </span>
                        <div>
                          <div className="font-medium text-white">
                            {task.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {task.description}
                          </div>
                        </div>
                        <svg
                          className="ml-auto h-4 w-4 flex-shrink-0 text-slate-600 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}

            <p className="text-xs text-slate-600 pt-1">
              Plan based on{" "}
              {profileReports.reduce((s, r) => s + (r.leakCount ?? 0), 0)}{" "}
              mistakes across{" "}
              {profileReports.reduce((s, r) => s + r.gamesAnalyzed, 0)} games.
            </p>
          </div>
        )}

        {showPlan && Object.entries(planByWeek).length === 0 && (
          <p className="text-sm text-slate-500">
            Not enough data yet. Scan more games to generate a full plan.
          </p>
        )}
      </div>
    </div>
  );
}
