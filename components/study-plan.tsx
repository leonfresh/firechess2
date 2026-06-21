"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { earnCoins } from "@/lib/coins";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type StudyPlan = {
  id: string;
  title: string;
  progress: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  weaknesses: {
    accuracy?: number;
    leakCount?: number;
    tacticsPerGame?: number;
    severeLeakRate?: number;
    topLeakOpenings?: string[];
  } | null;
  createdAt: string;
};

type StudyTask = {
  id: string;
  category: "opening" | "tactic" | "endgame" | "habit" | "puzzle" | "review";
  title: string;
  description: string;
  priority: number;
  recurring: boolean;
  dayIndex: number | null;
  completed: boolean;
  completedAt: string | null;
  link: string | null;
  icon: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  opening: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  tactic: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  endgame: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  habit: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  puzzle: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  review: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
};

function categoryLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function progressColor(p: number) {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 50) return "bg-cyan-500";
  if (p >= 25) return "bg-amber-500";
  return "bg-slate-500";
}

function streakMessage(streak: number) {
  if (streak >= 7) return "Incredible week! 🔥";
  if (streak >= 5) return "On fire! Keep it up!";
  if (streak >= 3) return "Nice streak going!";
  if (streak >= 1) return "Good start!";
  return "Start your streak today";
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function StudyPlanWidget({ chessUsername, source }: { chessUsername?: string; source?: string; userPlan?: string }) {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (chessUsername) params.set("username", chessUsername);
      if (source) params.set("source", source);
      const qs = params.toString();
      const res = await fetch(`/api/study-plan${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      setPlan(data.plan ?? null);
      setTasks(data.tasks ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [chessUsername, source]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  async function toggleTask(taskId: string, completed: boolean) {
    setTogglingIds((prev) => new Set(prev).add(taskId));

    // Award coins for completing a task
    if (completed) {
      try { earnCoins("study_task"); } catch {}
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed } : t))
    );

    try {
      const res = await fetch("/api/study-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, completed }),
      });
      const data = await res.json();
      if (res.ok && plan) {
        setPlan({
          ...plan,
          progress: data.progress,
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
        });
      }
    } catch {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !completed } : t))
      );
    }
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }

  async function deletePlan() {
    if (!plan || !confirm("Delete this study plan? You can always generate a new one.")) return;
    try {
      await fetch(`/api/study-plan?id=${plan.id}`, { method: "DELETE" });
      setPlan(null);
      setTasks([]);
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="glass-card animate-pulse p-6">
        <div className="h-5 w-40 rounded bg-white/10" />
        <div className="mt-4 space-y-3">
          <div className="h-12 rounded-xl bg-white/5" />
          <div className="h-12 rounded-xl bg-white/5" />
          <div className="h-12 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  // No plan — show CTA to generate one (Brilliant-style premium card)
  if (!plan) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.04] via-fuchsia-500/[0.03] to-cyan-500/[0.04]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-cyan-500/10 blur-[60px]" />
        <div className="relative flex flex-col items-center px-8 pb-8 pt-10 text-center">
          {/* Chess king illustration */}
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-lg shadow-violet-500/10">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-violet-300">
              <path d="M12 2 L13 6 L16 4 L14 8 L18 8 L15 11 L18 14 L14 14 L13 18 L11 18 L10 14 L6 14 L9 11 L6 8 L10 8 L8 4 L11 6 Z" className="fill-violet-300/10" />
              <rect x="7" y="19" width="10" height="3" rx="0.5" className="fill-violet-400/20" />
            </svg>
          </div>
          <h3 className="text-xl font-extrabold text-white">Unlock Your Personal Study Plan</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Run an analysis scan and FireChess builds a weekly study plan around your biggest weaknesses — with daily tasks, drills, and progress tracking.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:brightness-110"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Run a Scan
          </Link>
        </div>
      </div>
    );
  }

  // Has a plan — render it
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const recurringTasks = tasks.filter((t) => t.recurring);
  const weeklyTasks = tasks.filter((t) => !t.recurring);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.03] via-fuchsia-500/[0.02] to-cyan-500/[0.03]">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/10 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-cyan-500/10 blur-[60px]" />

      <div className="relative p-6 md:p-8">
        {/* Top row: illustration + title */}
        <div className="flex flex-col items-center text-center md:flex-row md:items-start md:gap-8 md:text-left">
          {/* Chess illustration (like Brilliant's balance scale) */}
          <div className="mb-4 flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-lg shadow-violet-500/10 md:mb-0">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-violet-300">
              <rect x="4" y="2" width="16" height="3" rx="0.5" className="fill-violet-400/20" />
              <circle cx="12" cy="10" r="5" className="fill-violet-300/10" />
              <path d="M7 15 L17 15 L12 19 Z" className="fill-violet-300/15" />
              <circle cx="12" cy="10" r="1.5" fill="currentColor" />
              <rect x="11" y="10" width="2" height="5" />
              <rect x="8" y="19" width="8" height="3" rx="0.5" className="fill-violet-400/20" />
            </svg>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <span className="rounded-full bg-violet-500/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-violet-400">
                Study Plan
              </span>
              {plan.weaknesses?.topLeakOpenings?.[0] && (
                <span className="rounded-full bg-amber-500/10 px-3 py-0.5 text-[11px] font-medium text-amber-400/80">
                  {plan.weaknesses.topLeakOpenings[0]}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-2xl font-extrabold text-white md:text-3xl">{plan.title}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {completedCount}/{totalCount} tasks · {plan.currentStreak} day streak
            </p>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Progress</span>
                <span className="font-bold text-white">{plan.progress}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full ${progressColor(plan.progress)} transition-all duration-500`}
                  style={{ width: `${plan.progress}%` }}
                />
              </div>
            </div>

            {/* Actions row */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/daily"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:brightness-110"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {plan.progress > 0 ? "Continue Training" : "Start Training"}
              </Link>
              <button
                onClick={deletePlan}
                className="rounded-lg p-2 text-white/20 transition-colors hover:bg-red-500/20 hover:text-red-400"
                title="Delete plan"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Habits */}
      {recurringTasks.length > 0 && (
        <div className="border-t border-white/[0.06] px-6 pb-2 pt-4 md:px-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400/70">Daily Habits</span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="mt-2 space-y-1.5">
            {recurringTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                toggling={togglingIds.has(task.id)}
                expanded={expandedTaskId === task.id}
                onToggle={() => toggleTask(task.id, !task.completed)}
                onExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Weekly Tasks */}
      {weeklyTasks.length > 0 && (
        <div className="border-t border-white/[0.06] px-6 pb-4 pt-4 md:px-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400/70">This Week</span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="mt-2 space-y-1.5">
            {weeklyTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                toggling={togglingIds.has(task.id)}
                expanded={expandedTaskId === task.id}
                onToggle={() => toggleTask(task.id, !task.completed)}
                onExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 100% celebration */}
      {plan.progress === 100 && (
        <div className="border-t border-white/[0.06] px-6 py-5 text-center md:px-8">
          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.06] to-cyan-500/[0.06] p-5">
            <p className="text-lg font-bold text-emerald-300">🎉 All tasks complete!</p>
            <p className="mt-1 text-sm text-slate-400">
              Run a new scan to generate a fresh study plan and track your improvement.
            </p>
            <Link href="/" className="btn-primary mt-3 inline-flex items-center gap-2 text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              New Scan
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Task Row                                                            */
/* ------------------------------------------------------------------ */

function TaskRow({
  task,
  toggling,
  expanded,
  onToggle,
  onExpand,
}: {
  task: StudyTask;
  toggling: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}) {
  const colors = CATEGORY_COLORS[task.category] ?? CATEGORY_COLORS.review;

  return (
    <div
      className={`group rounded-lg border transition-all ${
        task.completed
          ? "border-white/[0.04] bg-white/[0.015] opacity-60"
          : `${colors.border} bg-white/[0.025] hover:bg-white/[0.04]`
      }`}
    >
      <div className="flex items-center gap-2.5 p-2.5">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          disabled={toggling}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
            task.completed
              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
              : "border-white/15 bg-white/[0.03] hover:border-white/30"
          } ${toggling ? "animate-pulse" : ""}`}
        >
          {task.completed && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        {/* Icon */}
        <span className="text-base">{task.icon}</span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm ${task.completed ? "text-white/40 line-through" : "font-semibold text-white"}`}>
              {task.title}
            </span>
            {task.recurring && (
              <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-400">Daily</span>
            )}
            {task.dayIndex && !task.recurring && (
              <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/30">Day {task.dayIndex}</span>
            )}
          </div>
        </div>

        {/* Expand / Link */}
        <div className="flex shrink-0 items-center gap-1">
          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded p-1 text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
              title="Open resource"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
          <button
            onClick={onExpand}
            className="rounded p-1 text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded description */}
      {expanded && (
        <div className="animate-fade-in border-t border-white/5 px-2.5 pb-2.5 pt-2">
          <p className="text-xs leading-relaxed text-slate-400">{task.description}</p>
        </div>
      )}
    </div>
  );
}
