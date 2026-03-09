/**
 * Daily Login Rewards — 7-day streak cycle for retention.
 *
 * Server-authoritative: streak state lives in the database via /api/daily-login.
 * localStorage is used as a read-through cache and fallback for guests.
 */

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
/*  Local cache helpers                                                 */
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

const EMPTY: LoginState = {
  currentDay: 0,
  lastClaimDate: "",
  claimedToday: false,
  totalDaysLogged: 0,
  cyclesCompleted: 0,
};

function readLocalState(): LoginState {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as LoginState;
    parsed.claimedToday = parsed.lastClaimDate === todayStr();
    return parsed;
  } catch {
    return { ...EMPTY };
  }
}

function writeLocalState(state: LoginState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Get login state from local cache (sync).
 * Use `fetchLoginStateFromServer()` to refresh from DB.
 */
export function getLoginState(): LoginState {
  return readLocalState();
}

/**
 * Fetch authoritative login state from the server.
 * Updates local cache on success. Returns null if not logged in.
 */
export async function fetchLoginStateFromServer(): Promise<LoginState | null> {
  try {
    const res = await fetch("/api/daily-login", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    const state: LoginState = {
      currentDay: data.state.currentDay,
      lastClaimDate: data.state.lastClaimDate,
      claimedToday: data.state.claimedToday,
      totalDaysLogged: data.state.totalDaysLogged,
      cyclesCompleted: data.state.cyclesCompleted,
    };
    writeLocalState(state);
    return state;
  } catch {
    return null;
  }
}

/**
 * Claim today's login reward.
 * Tries the server first (DB authoritative); falls back to localStorage for guests.
 */
export async function claimDailyReward(): Promise<{
  reward: DayReward;
  newBalance: number;
  state: LoginState;
} | null> {
  // ── Server claim ──
  try {
    const res = await fetch("/api/daily-login", {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      const state: LoginState = {
        currentDay: data.state.currentDay,
        lastClaimDate: data.state.lastClaimDate,
        claimedToday: true,
        totalDaysLogged: data.state.totalDaysLogged,
        cyclesCompleted: data.state.cyclesCompleted,
      };
      writeLocalState(state);

      if (typeof window !== "undefined") {
        localStorage.setItem("fc-coins", String(data.newBalance));
        window.dispatchEvent(
          new CustomEvent("fc-coins-changed", { detail: data.newBalance }),
        );
      }
      return { reward: data.reward, newBalance: data.newBalance, state };
    }

    // Already claimed today
    if (res.status === 400) return null;
  } catch {
    // API unreachable — fall through to local fallback
  }

  // ── Local fallback for guests ──
  return claimLocal();
}

function claimLocal(): {
  reward: DayReward;
  newBalance: number;
  state: LoginState;
} | null {
  const state = readLocalState();
  const today = todayStr();
  if (state.lastClaimDate === today) return null;

  const yesterday = yesterdayStr();
  const nextDay =
    state.lastClaimDate === yesterday && state.currentDay < 7
      ? state.currentDay + 1
      : 1;

  const reward = LOGIN_REWARDS[nextDay - 1];

  let currentBalance = 0;
  if (typeof window !== "undefined") {
    currentBalance =
      parseInt(localStorage.getItem("fc-coins") ?? "0", 10) || 0;
  }
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
    } catch {
      /* ignore */
    }

    window.dispatchEvent(
      new CustomEvent("fc-coins-changed", { detail: newBalance }),
    );
  }

  const newState: LoginState = {
    currentDay: nextDay,
    lastClaimDate: today,
    claimedToday: true,
    totalDaysLogged: state.totalDaysLogged + 1,
    cyclesCompleted: state.cyclesCompleted + (nextDay === 7 ? 1 : 0),
  };
  writeLocalState(newState);

  return { reward, newBalance, state: newState };
}

/** Check if streak is still active (claimed yesterday or today). */
export function isStreakActive(): boolean {
  const state = readLocalState();
  return (
    state.lastClaimDate === todayStr() ||
    state.lastClaimDate === yesterdayStr()
  );
}
