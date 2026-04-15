/**
 * Spaced Repetition System for blunder positions.
 *
 * Uses a simplified SM-2-style algorithm stored entirely in localStorage
 * so it works with zero backend changes.
 *
 * Key for each position: SHA-based on `fenBefore + bestMove` (truncated).
 * Storage: localStorage["fc-srs"] = JSON map of cardId → SRSCard
 */

const STORE_KEY = "fc-srs";

export type SRSCard = {
  /** Stable identifier: first 16 chars of fenBefore + bestMove */
  id: string;
  /** Interval in days until next review */
  interval: number;
  /** Ease factor (SM-2 style, starts at 2.5) */
  ease: number;
  /** Number of times reviewed */
  reps: number;
  /** ISO date string of next due date */
  due: string;
  /** cpLoss at the time of recording — used for prioritising severe blunders */
  cpLoss: number;
};

/** Leitner-style intervals in days for correct (1,3,7,14,30) */
const CORRECT_INTERVALS = [1, 3, 7, 14, 30, 60];
/** Wrong resets to 1 day */
const WRONG_INTERVAL = 1;

function cardId(fenBefore: string, bestMove: string): string {
  // Simple stable id: first 12 chars of fen + bestMove
  return (fenBefore.slice(0, 12) + bestMove)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function loadStore(): Record<string, SRSCard> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, SRSCard>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

/** Get or create a card for this position. New cards are due today. */
export function getCard(
  fenBefore: string,
  bestMove: string,
  cpLoss: number,
): SRSCard {
  const store = loadStore();
  const id = cardId(fenBefore, bestMove);
  if (store[id]) return store[id];
  return {
    id,
    interval: 0,
    ease: 2.5,
    reps: 0,
    due: todayStr(),
    cpLoss,
  };
}

/** Record the result of a review and update the card. */
export function recordResult(
  fenBefore: string,
  bestMove: string,
  cpLoss: number,
  correct: boolean,
): SRSCard {
  const store = loadStore();
  const id = cardId(fenBefore, bestMove);
  const existing = store[id] ?? {
    id,
    interval: 0,
    ease: 2.5,
    reps: 0,
    due: todayStr(),
    cpLoss,
  };

  let { ease, reps, interval } = existing;

  if (correct) {
    reps += 1;
    // Next interval from the table, clamped to last entry
    interval =
      CORRECT_INTERVALS[Math.min(reps - 1, CORRECT_INTERVALS.length - 1)];
    // Bump ease slightly for correct
    ease = Math.min(3.0, ease + 0.1);
  } else {
    // Wrong: reset to beginning
    reps = 0;
    interval = WRONG_INTERVAL;
    ease = Math.max(1.3, ease - 0.2);
  }

  const updated: SRSCard = {
    ...existing,
    ease,
    reps,
    interval,
    cpLoss,
    due: addDays(interval),
  };
  store[id] = updated;
  saveStore(store);
  return updated;
}

/** Return blunders sorted by SRS priority for today's session.
 *
 * Priority order:
 * 1. New cards (never seen) — sorted by cpLoss desc
 * 2. Due today or overdue — sorted by how overdue + cpLoss
 * 3. Not yet due — excluded (they'll appear on their due date)
 */
export function getSRSQueue<
  T extends { fenBefore: string; bestMove: string; cpLoss: number },
>(tactics: T[], maxCount: number): T[] {
  if (typeof window === "undefined") return tactics.slice(0, maxCount);

  const store = loadStore();
  const today = todayStr();

  type Scored = { tactic: T; score: number };

  const scored: Scored[] = tactics.map((t) => {
    const id = cardId(t.fenBefore, t.bestMove);
    const card = store[id];

    if (!card) {
      // New card — high priority, weighted by cpLoss
      return { tactic: t, score: 10000 + t.cpLoss };
    }

    if (card.due <= today) {
      // Due or overdue
      const daysOverdue = Math.max(
        0,
        Math.floor(
          (new Date(today).getTime() - new Date(card.due).getTime()) / 86400000,
        ),
      );
      return { tactic: t, score: 5000 + daysOverdue * 100 + t.cpLoss };
    }

    // Not due yet — lowest priority (will be filtered out unless we need volume)
    const daysUntilDue = Math.floor(
      (new Date(card.due).getTime() - new Date(today).getTime()) / 86400000,
    );
    return { tactic: t, score: -daysUntilDue };
  });

  scored.sort((a, b) => b.score - a.score);

  // Only serve due/new cards if we have enough; otherwise fall back to top of queue
  const due = scored.filter((s) => s.score > 0);
  const source = due.length >= maxCount ? due : scored;
  return source.slice(0, maxCount).map((s) => s.tactic);
}

/** Stats for display — how many cards are due today, total seen, etc. */
export function getSRSStats(
  tactics: Array<{ fenBefore: string; bestMove: string }>,
): { dueToday: number; totalSeen: number; totalCards: number } {
  const store = loadStore();
  const today = todayStr();
  let dueToday = 0;
  let totalSeen = 0;
  for (const t of tactics) {
    const id = cardId(t.fenBefore, t.bestMove);
    const card = store[id];
    if (!card) {
      dueToday++;
      continue;
    } // new = due
    totalSeen++;
    if (card.due <= today) dueToday++;
  }
  return { dueToday, totalSeen, totalCards: tactics.length };
}
