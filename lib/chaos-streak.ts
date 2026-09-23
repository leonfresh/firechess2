/**
 * Chaos Chess daily streaks for signed-in players.
 *
 * A streak day is an Australia/Sydney calendar day (the same boundary as the first-win-of-the-day
 * gold bonus) on which the player finished at least one gold-paying game, i.e. has a 'match' row
 * in chaos_gold_ledger. That inherits every gold rule: guest seats never count, and the per-pair
 * anti-farm cap applies. The bonus itself is minted server-side by archive_chaos_match()
 * (migrations/chaos-streak.sql) on the first paying game of each day; this module only mirrors the
 * formula so the interface can show what the next day is worth. Keep the two in step.
 */

export const STREAK_TIME_ZONE = "Australia/Sydney";
export const STREAK_BONUS_STEP = 10;
export const STREAK_BONUS_CAP = 50;

/** Gold paid on day N of a streak: nothing on day 1, then +10 a day up to +50. */
export function streakBonus(day: number): number {
  return day < 2 ? 0 : Math.min(STREAK_BONUS_STEP * (day - 1), STREAK_BONUS_CAP);
}

export type StreakSummary = {
  /** Consecutive days ending today, or ending yesterday while today is still open. */
  current: number;
  best: number;
  playedToday: boolean;
  /** Gold the next streak day pays: today's if not yet played, otherwise tomorrow's. */
  nextBonus: number;
};

const DAY_MS = 86_400_000;
const dayNumber = (day: string) => Math.round(Date.parse(`${day}T00:00:00Z`) / DAY_MS);

/**
 * Summarise a streak from the distinct YYYY-MM-DD days (in STREAK_TIME_ZONE) the player earned
 * match gold, and today's date in the same zone. Order and duplicates do not matter.
 */
export function summarizeStreak(days: string[], today: string): StreakSummary {
  const numbers = Array.from(new Set(days.map(dayNumber))).filter(Number.isFinite).sort((a, b) => a - b);
  const set = new Set(numbers);
  const now = dayNumber(today);

  let best = 0, run = 0, previous = NaN;
  for (const n of numbers) {
    run = n === previous + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = n;
  }

  const playedToday = set.has(now);
  let current = 0;
  for (let n = playedToday ? now : now - 1; set.has(n); n--) current++;

  return { current, best, playedToday, nextBonus: streakBonus(current + 1) };
}
