"use client";

import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type GoalType = "accuracy" | "rating";

type Goal = {
  type: GoalType;
  target: number;
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function GoalWidget({
  currentAccuracy,
  currentRating,
}: {
  currentAccuracy: number | null;
  currentRating: number | null;
}) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [editing, setEditing] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>("rating");
  const [goalValue, setGoalValue] = useState("");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("fc-goal");
    if (saved) {
      try { setGoal(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const saveGoal = useCallback(() => {
    const val = parseInt(goalValue);
    if (isNaN(val) || val <= 0) return;
    const newGoal: Goal = { type: goalType, target: val, createdAt: new Date().toISOString() };
    setGoal(newGoal);
    localStorage.setItem("fc-goal", JSON.stringify(newGoal));
    setEditing(false);
  }, [goalType, goalValue]);

  const clearGoal = useCallback(() => {
    setGoal(null);
    localStorage.removeItem("fc-goal");
    setEditing(false);
  }, []);

  // Calculate progress
  const current = goal?.type === "accuracy" ? currentAccuracy : currentRating;
  const progress = goal && current != null
    ? Math.min(100, Math.max(0, (current / goal.target) * 100))
    : 0;
  const remaining = goal && current != null ? goal.target - current : null;
  const achieved = remaining != null && remaining <= 0;

  // No goal set — show CTA
  if (!goal && !editing) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/15 p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-emerald-500/[0.04]" />
        <div className="relative flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-2xl">🎯</span>
          <h3 className="mt-3 text-base font-bold text-white">Set a Goal</h3>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            Set a target rating or accuracy and track your progress toward it.
          </p>
          <button
            onClick={() => setEditing(true)}
            className="mt-4 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/15 transition-all hover:brightness-110"
          >
            Set Goal
          </button>
        </div>
      </div>
    );
  }

  // Editing mode
  if (editing) {
    return (
      <div className="rounded-2xl border border-cyan-500/20 p-6">
        <h3 className="text-base font-bold text-white">Set Your Goal</h3>
        <div className="mt-4 space-y-4">
          {/* Type picker */}
          <div className="flex gap-2">
            <button
              onClick={() => { setGoalType("rating"); setGoalValue(""); }}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                goalType === "rating"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/60"
              }`}
            >
              🏆 Target Rating
            </button>
            <button
              onClick={() => { setGoalType("accuracy"); setGoalValue(""); }}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                goalType === "accuracy"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/60"
              }`}
            >
              🎯 Target Accuracy
            </button>
          </div>

          {/* Value input */}
          <div>
            <label className="text-xs text-white/40">
              {goalType === "rating" ? "Target Rating (e.g. 1500)" : "Target Accuracy % (e.g. 80)"}
            </label>
            <input
              type="number"
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
              placeholder={goalType === "rating" ? "1500" : "80"}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-cyan-500/50 focus:outline-none"
              min={goalType === "accuracy" ? 1 : 100}
              max={goalType === "accuracy" ? 100 : 3500}
            />
            {current != null && (
              <p className="mt-1 text-[10px] text-white/30">
                Current: {current.toFixed(goalType === "accuracy" ? 1 : 0)}{goalType === "accuracy" ? "%" : ""}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={saveGoal}
              disabled={!goalValue || isNaN(parseInt(goalValue))}
              className="flex-1 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-40"
            >
              Save Goal
            </button>
            <button
              onClick={() => { setEditing(false); }}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/50 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active goal display
  const isRating = goal?.type === "rating";
  const gradientFrom = achieved ? "from-emerald-500/[0.08]" : isRating ? "from-cyan-500/[0.06]" : "from-emerald-500/[0.06]";
  const gradientTo = achieved ? "to-cyan-500/[0.08]" : "to-transparent";
  const borderColor = achieved ? "border-emerald-500/25" : isRating ? "border-cyan-500/20" : "border-emerald-500/20";
  const barColor = achieved ? "bg-gradient-to-r from-emerald-400 to-cyan-400" : isRating ? "bg-cyan-500" : "bg-emerald-500";

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${borderColor} p-6`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo}`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-xl">
              {achieved ? "🎉" : isRating ? "🏆" : "🎯"}
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                {achieved ? "Goal Achieved!" : `Target: ${goal!.target}${isRating ? "" : "%"}`}
              </h3>
              <p className="text-xs text-slate-400">
                {achieved
                  ? `You've hit your ${isRating ? "rating" : "accuracy"} goal!`
                  : remaining != null
                    ? `${Math.abs(remaining).toFixed(isRating ? 0 : 1)}${isRating ? " points" : "%"} to go`
                    : "Run a scan to track progress"}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => { setGoalType(goal!.type); setGoalValue(String(goal!.target)); setEditing(true); }}
              title="Edit goal"
              className="rounded-lg p-1.5 text-white/20 transition-colors hover:bg-white/[0.06] hover:text-white/50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
            </button>
            <button
              onClick={clearGoal}
              title="Remove goal"
              className="rounded-lg p-1.5 text-white/20 transition-colors hover:bg-red-500/20 hover:text-red-400"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/30">
              Current: {current != null ? current.toFixed(isRating ? 0 : 1) : "—"}{isRating ? "" : "%"}
            </span>
            <span className="font-bold text-white/50">{progress.toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full ${barColor} transition-all duration-700`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {achieved && (
          <button
            onClick={() => { setGoalType(goal!.type); setGoalValue(""); setEditing(true); }}
            className="mt-3 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Set a new goal →
          </button>
        )}
      </div>
    </div>
  );
}
