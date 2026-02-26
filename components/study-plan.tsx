"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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

  // No plan — show CTA to generate one
  if (!plan) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.06] via-fuchsia-500/[0.04] to-cyan-500/[0.06]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-[70px]" />
        <div className="relative flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl shadow-lg shadow-violet-500/10">📋</span>
          <h3 className="mt-5 text-xl font-extrabold text-white">Your Personal Study Plan</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Run an analysis scan and save your report. FireChess will generate a personalized weekly study plan based on your biggest weaknesses — with daily tasks, drills, and progress tracking.
          </p>
          <Link
            href="/"
            className="btn-primary mt-5 inline-flex items-center gap-2"
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
    <div className="space-y-5">
      {/* Plan header card */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.05] via-transparent to-fuchsia-500/[0.05]" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/10 blur-[60px]" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-2xl shadow-lg shadow-violet-500/10">📋</span>
              <div>
                <h3 className="text-lg font-bold text-white">{plan.title}</h3>
                <p className="text-sm text-slate-400">
                  {completedCount}/{totalCount} tasks complete
                </p>
              </div>
            </div>
            <button
              onClick={deletePlan}
              title="Delete plan"
              className="rounded-lg p-1.5 text-white/20 transition-colors hover:bg-red-500/20 hover:text-red-400"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Progress</span>
              <span className="font-bold text-white">{plan.progress}%</span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full ${progressColor(plan.progress)} transition-all duration-500`}
                style={{ width: `${plan.progress}%` }}
              />
            </div>
          </div>

          {/* Streak + Stats */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-orange-500/15 bg-orange-500/[0.06] px-3 py-1.5">
              <span className="text-base">🔥</span>
              <div>
                <div className="text-sm font-bold text-orange-400">{plan.currentStreak} day{plan.currentStreak !== 1 ? "s" : ""}</div>
                <div className="text-[10px] text-orange-400/60">{streakMessage(plan.currentStreak)}</div>
              </div>
            </div>
            {plan.longestStreak > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
                <span className="text-base">🏆</span>
                <div>
                  <div className="text-sm font-bold text-white">{plan.longestStreak} day{plan.longestStreak !== 1 ? "s" : ""}</div>
                  <div className="text-[10px] text-white/40">Best streak</div>
                </div>
              </div>
            )}
            {plan.weaknesses && plan.weaknesses.topLeakOpenings && plan.weaknesses.topLeakOpenings.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
                <span className="text-base">🎯</span>
                <div>
                  <div className="text-sm font-bold text-white">{plan.weaknesses.topLeakOpenings[0]}</div>
                  <div className="text-[10px] text-white/40">Focus opening</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Habits */}
      {recurringTasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400/70">Daily Habits</span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="space-y-2">
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
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400/70">This Week</span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="space-y-2">
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
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.06] to-cyan-500/[0.06] p-5 text-center">
          <p className="text-lg font-bold text-emerald-300">🎉 All tasks complete!</p>
          <p className="mt-1 text-sm text-slate-400">
            Run a new scan to generate a fresh study plan and track your improvement.
          </p>
          <Link href="/" className="btn-primary mt-3 inline-flex items-center gap-2 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            New Scan
          </Link>
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
      className={`group rounded-xl border transition-all ${
        task.completed
          ? "border-white/[0.04] bg-white/[0.015] opacity-60"
          : `${colors.border} bg-white/[0.025] hover:bg-white/[0.04]`
      }`}
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          disabled={toggling}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
            task.completed
              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
              : "border-white/15 bg-white/[0.03] hover:border-white/30"
          } ${toggling ? "animate-pulse" : ""}`}
        >
          {task.completed && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        {/* Icon */}
        <span className="text-lg">{task.icon}</span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${task.completed ? "text-white/40 line-through" : "text-white"}`}>
              {task.title}
            </span>
            {task.recurring && (
              <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-400">Daily</span>
            )}
            {task.dayIndex && !task.recurring && (
              <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/30">Day {task.dayIndex}</span>
            )}
          </div>
          <span className={`rounded-full ${colors.bg} ${colors.text} text-[10px] font-medium px-1.5 py-0.5`}>
            {categoryLabel(task.category)}
          </span>
        </div>

        {/* Expand / Link */}
        <div className="flex shrink-0 items-center gap-1.5">
          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg p-1.5 text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
              title="Open resource"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
          <button
            onClick={onExpand}
            className="rounded-lg p-1.5 text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
          >
            <svg
              width="14"
              height="14"
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
        <div className="animate-fade-in border-t border-white/5 px-3.5 pb-3.5 pt-3">
          <p className="text-sm leading-relaxed text-slate-400">{task.description}</p>
        </div>
      )}
    </div>
  );
}
