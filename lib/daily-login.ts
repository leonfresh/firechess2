/**
 * Daily Login Rewards — 7-day streak cycle for retention.
 *
 * Tracks consecutive daily logins and gives escalating coin rewards.
 * Cycle resets after day 7 or if a day is missed.
 *
 * Storage: localStorage key "fc-daily-login"
 */

import { getBalance } from "@/lib/coins";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type DayReward = {
  day: number;
  coins: number;
  label: string;
  icon: string;
};

export type LoginState = {
  /** Current streak day (1-7) — 0 means never claimed */
  currentDay: number;
  /** ISO date string of last claim (YYYY-MM-DD) */
  lastClaimDate: string;
  /** Whether today has already been claimed */
  claimedToday: boolean;
  /** Total days ever claimed */
  totalDaysLogged: number;
  /** Number of full 7-day cycles completed */
  cyclesCompleted: number;
};

/* ------------------------------------------------------------------ */
/*  Reward schedule                                                     */
/* ------------------------------------------------------------------ */

export const LOGIN_REWARDS: DayReward[] = [
  { day: 1, coins: 5,  label: "Welcome back!",     icon: "👋" },
  { day: 2, coins: 8,  label: "On a roll!",         icon: "🔥" },
  { day: 3, coins: 10, label: "Keep going!",        icon: "⚡" },
  { day: 4, coins: 12, label: "Halfway there!",     icon: "🎯" },
  { day: 5, coins: 15, label: "Dedicated player!",  icon: "💪" },
  { day: 6, coins: 20, label: "Almost there!",      icon: "🌟" },
  { day: 7, coins: 30, label: "Weekly reward!",     icon: "🏆" },
];

/* ------------------------------------------------------------------ */
/*  Storage                                                             */
/* ------------------------------------------------------------------ */

const KEY = "fc-daily-login";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function readState(): LoginState {
  if (typeof window === "undefined") {
    return { currentDay: 0, lastClaimDate: "", claimedToday: false, totalDaysLogged: 0, cyclesCompleted: 0 };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { currentDay: 0, lastClaimDate: "", claimedToday: false, totalDaysLogged: 0, cyclesCompleted: 0 };
    const parsed = JSON.parse(raw) as LoginState;
    parsed.claimedToday = parsed.lastClaimDate === todayStr();
    return parsed;
  } catch {
    return { currentDay: 0, lastClaimDate: "", claimedToday: false, totalDaysLogged: 0, cyclesCompleted: 0 };
  }
}

function writeState(state: LoginState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/** Get current login state (streak, claimed today, etc.) */
export function getLoginState(): LoginState {
  return readState();
}

/**
 * Claim today's login reward.
 * Returns the reward for today, or null if already claimed.
 */
export function claimDailyReward(): { reward: DayReward; newBalance: number; state: LoginState } | null {
  const state = readState();
  const today = todayStr();

  if (state.lastClaimDate === today) return null;

  const yesterday = yesterdayStr();
  let nextDay: number;

  if (state.lastClaimDate === yesterday && state.currentDay < 7) {
    nextDay = state.currentDay + 1;
  } else {
    nextDay = 1;
  }

  const reward = LOGIN_REWARDS[nextDay - 1];

  const currentBalance = getBalance();
  const newBalance = currentBalance + reward.coins;
  if (typeof window !== "undefined") {
    localStorage.setItem("fc-coins", String(newBalance));

    try {
      const logRaw = localStorage.getItem("fc-coin-log");
      const log = logRaw ? JSON.parse(logRaw) : [];
      log.unshift({
        amount: reward.coins,
        reason: "daily_streak" as const,
        label: `Day ${nextDay} login reward`,
        timestamp: new Date().toISOString(),
      });
      if (log.length > 50) log.length = 50;
      localStorage.setItem("fc-coin-log", JSON.stringify(log));
    } catch { /* ignore */ }

    window.dispatchEvent(new CustomEvent("fc-coins-changed", { detail: newBalance }));
  }

  const newState: LoginState = {
    currentDay: nextDay,
    lastClaimDate: today,
    claimedToday: true,
    totalDaysLogged: state.totalDaysLogged + 1,
    cyclesCompleted: state.cyclesCompleted + (nextDay === 7 ? 1 : 0),
  };
  writeState(newState);

  return { reward, newBalance, state: newState };
}

/** Check if streak is still active (claimed yesterday or today). */
export function isStreakActive(): boolean {
  const state = readState();
  return state.lastClaimDate === todayStr() || state.lastClaimDate === yesterdayStr();
}
