/**
 * Coin economy — virtual currency for retention gamification.
 *
 * Coins are earned from activities throughout the app and can be spent
 * in the Coin Shop on cosmetic items (board themes, profile titles).
 *
 * Storage: localStorage (instant cache) + Neon DB (authoritative, via /api/coins).
 * On page load the DB state is fetched and overwrites localStorage.
 * Every earn/spend writes to localStorage immediately (for UI speed)
 * and fires a background POST to /api/coins so the DB stays in sync.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type CoinReason =
  | "daily_correct"
  | "daily_wrong"
  | "daily_streak"
  | "study_task"
  | "scan_complete"
  | "achievement"
  | "repertoire_save"
  | "shop_purchase";

export type CoinTransaction = {
  amount: number;
  reason: CoinReason;
  label: string;
  timestamp: string;
};

/* ------------------------------------------------------------------ */
/*  Reward amounts                                                      */
/* ------------------------------------------------------------------ */

export const COIN_REWARDS: Record<
  Exclude<CoinReason, "shop_purchase">,
  { amount: number; label: string }
> = {
  daily_correct:   { amount: 10, label: "Daily Challenge — correct!" },
  daily_wrong:     { amount: 3,  label: "Daily Challenge — attempted" },
  daily_streak:    { amount: 2,  label: "Daily streak bonus" },
  study_task:      { amount: 2,  label: "Study task completed" },
  scan_complete:   { amount: 5,  label: "Scan saved" },
  achievement:     { amount: 20, label: "Achievement unlocked" },
  repertoire_save: { amount: 2,  label: "Move saved to repertoire" },
};

/* ------------------------------------------------------------------ */
/*  Core API                                                            */
/* ------------------------------------------------------------------ */

const KEY_BALANCE = "fc-coins";
const KEY_LOG     = "fc-coin-log";
const KEY_SHOP    = "fc-coin-shop";
const KEY_SCAN_DAY = "fc-scan-coin-day";
const KEY_STUDY_DAY = "fc-study-coin-day";
const KEY_SYNCED  = "fc-coins-synced";
const MAX_LOG     = 50;
const MAX_SCAN_REWARDS_PER_DAY = 3;
const MAX_STUDY_REWARDS_PER_DAY = 20;

/* ------------------------------------------------------------------ */
/*  DB sync helpers (fire-and-forget)                                   */
/* ------------------------------------------------------------------ */

/** Background POST to /api/coins — never throws. */
function dbEarn(reason: string): void {
  fetch("/api/coins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "earn", reason }),
  }).catch(() => {/* offline / unauthenticated — localStorage only */});
}

/** Background spend to /api/coins — never throws. */
function dbSpend(amount: number, itemId: string): void {
  fetch("/api/coins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "spend", amount, itemId }),
  }).catch(() => {});
}

/**
 * Sync from DB → localStorage on page load.
 * If the user has never synced, migrates localStorage → DB first.
 * Returns { balance, purchases } from the authoritative source.
 */
export async function syncCoinsFromDb(): Promise<{ balance: number; purchases: string[] } | null> {
  if (typeof window === "undefined") return null;

  const alreadySynced = localStorage.getItem(KEY_SYNCED);

  if (!alreadySynced) {
    // First time: push localStorage state to DB (migration)
    const localBalance = getBalance();
    const localPurchases = getPurchased();
    try {
      const res = await fetch("/api/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", balance: localBalance, purchases: localPurchases }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      // Write DB-authoritative state back to localStorage
      localStorage.setItem(KEY_BALANCE, String(data.balance ?? 0));
      if (data.purchases?.length) {
        localStorage.setItem(KEY_SHOP, JSON.stringify(data.purchases));
      }
      localStorage.setItem(KEY_SYNCED, "1");
      window.dispatchEvent(new CustomEvent("fc-coins-changed", { detail: data.balance ?? 0 }));
      return { balance: data.balance ?? 0, purchases: data.purchases ?? [] };
    } catch {
      return null; // offline — stay on localStorage
    }
  }

  // Already synced before — fetch latest from DB
  try {
    const res = await fetch("/api/coins");
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem(KEY_BALANCE, String(data.balance ?? 0));
    if (data.purchases?.length) {
      localStorage.setItem(KEY_SHOP, JSON.stringify(data.purchases));
    }
    window.dispatchEvent(new CustomEvent("fc-coins-changed", { detail: data.balance ?? 0 }));
    return { balance: data.balance ?? 0, purchases: data.purchases ?? [] };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Public API (unchanged signatures — callers don't need changes)      */
/* ------------------------------------------------------------------ */

/** Read current coin balance. */
export function getBalance(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEY_BALANCE) ?? "0", 10) || 0;
}

/** Read recent transaction log. */
export function getLog(): CoinTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY_LOG) ?? "[]");
  } catch {
    return [];
  }
}

/** Award coins for an activity. Returns amount earned (0 if capped). */
export function earnCoins(reason: Exclude<CoinReason, "shop_purchase">): number {
  const today = new Date().toISOString().slice(0, 10);

  // Daily cap for scan rewards — max 3 per day
  if (reason === "scan_complete") {
    const raw = localStorage.getItem(KEY_SCAN_DAY);
    let scanDay = { date: "", count: 0 };
    try { scanDay = raw ? JSON.parse(raw) : scanDay; } catch {}
    if (scanDay.date === today) {
      if (scanDay.count >= MAX_SCAN_REWARDS_PER_DAY) return 0; // capped
      scanDay.count++;
    } else {
      scanDay = { date: today, count: 1 };
    }
    localStorage.setItem(KEY_SCAN_DAY, JSON.stringify(scanDay));
  }

  // Daily cap for study/training rewards — max 20 per day
  if (reason === "study_task") {
    const raw = localStorage.getItem(KEY_STUDY_DAY);
    let studyDay = { date: "", count: 0 };
    try { studyDay = raw ? JSON.parse(raw) : studyDay; } catch {}
    if (studyDay.date === today) {
      if (studyDay.count >= MAX_STUDY_REWARDS_PER_DAY) return 0; // capped
      studyDay.count++;
    } else {
      studyDay = { date: today, count: 1 };
    }
    localStorage.setItem(KEY_STUDY_DAY, JSON.stringify(studyDay));
  }

  const { amount, label } = COIN_REWARDS[reason];
  const balance = getBalance() + amount;
  localStorage.setItem(KEY_BALANCE, String(balance));

  const log = getLog();
  log.unshift({ amount, reason, label, timestamp: new Date().toISOString() });
  if (log.length > MAX_LOG) log.length = MAX_LOG;
  localStorage.setItem(KEY_LOG, JSON.stringify(log));

  // Dispatch custom event so UI can react instantly
  window.dispatchEvent(new CustomEvent("fc-coins-changed", { detail: balance }));

  // Background DB sync
  dbEarn(reason);

  return amount;
}

/** Spend coins on a shop item. Returns true if successful. */
export function spendCoins(amount: number, itemId: string): boolean {
  const balance = getBalance();
  if (balance < amount) return false;

  const newBalance = balance - amount;
  localStorage.setItem(KEY_BALANCE, String(newBalance));

  const log = getLog();
  log.unshift({
    amount: -amount,
    reason: "shop_purchase",
    label: `Purchased: ${itemId}`,
    timestamp: new Date().toISOString(),
  });
  if (log.length > MAX_LOG) log.length = MAX_LOG;
  localStorage.setItem(KEY_LOG, JSON.stringify(log));

  // Mark item as purchased
  const purchased = getPurchased();
  if (!purchased.includes(itemId)) {
    purchased.push(itemId);
    localStorage.setItem(KEY_SHOP, JSON.stringify(purchased));
  }

  window.dispatchEvent(new CustomEvent("fc-coins-changed", { detail: newBalance }));

  // Background DB sync
  dbSpend(amount, itemId);

  return true;
}

/** Get list of purchased item IDs. */
export function getPurchased(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY_SHOP) ?? "[]");
  } catch {
    return [];
  }
}

/** Check if a specific item has been purchased. */
export function hasPurchased(itemId: string): boolean {
  return getPurchased().includes(itemId);
}
