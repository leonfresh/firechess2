/**
 * Coin economy — virtual currency for retention gamification.
 *
 * Coins are earned from activities throughout the app and can be spent
 * in the Coin Shop on cosmetic items (board themes, profile titles).
 *
 * Storage: localStorage keys
 *   - "fc-coins"       → number (balance)
 *   - "fc-coin-log"    → CoinTransaction[] (recent history, capped at 50)
 *   - "fc-coin-shop"   → string[] (purchased item IDs)
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
  study_task:      { amount: 5,  label: "Study task completed" },
  scan_complete:   { amount: 15, label: "Scan saved" },
  achievement:     { amount: 20, label: "Achievement unlocked" },
  repertoire_save: { amount: 2,  label: "Move saved to repertoire" },
};

/* ------------------------------------------------------------------ */
/*  Core API                                                            */
/* ------------------------------------------------------------------ */

const KEY_BALANCE = "fc-coins";
const KEY_LOG     = "fc-coin-log";
const KEY_SHOP    = "fc-coin-shop";
const MAX_LOG     = 50;

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

/** Award coins for an activity. Returns new balance. */
export function earnCoins(reason: Exclude<CoinReason, "shop_purchase">): number {
  const { amount, label } = COIN_REWARDS[reason];
  const balance = getBalance() + amount;
  localStorage.setItem(KEY_BALANCE, String(balance));

  const log = getLog();
  log.unshift({ amount, reason, label, timestamp: new Date().toISOString() });
  if (log.length > MAX_LOG) log.length = MAX_LOG;
  localStorage.setItem(KEY_LOG, JSON.stringify(log));

  // Dispatch custom event so UI can react instantly
  window.dispatchEvent(new CustomEvent("fc-coins-changed", { detail: balance }));
  return balance;
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
