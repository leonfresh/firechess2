import type { PreviewPattern } from "../components/modern-preview/sample-data";
import { coachingTheme } from "./report-coaching";

export type PracticeMemory = Record<string, { due: number; streak: number; needsReview: boolean; theme: string }>;
export type PracticeOutcome = "solved" | "missed" | "revealed";
export const DAY = 86_400_000;
export function exerciseKey(pattern: PreviewPattern) { return `${pattern.fen.split(" ").slice(0, 4).join(" ")}|${pattern.best}`; }
export function readPracticeMemory(value: unknown): PracticeMemory {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, PracticeMemory[string]] => {
    const v = entry[1];
    return !!v && typeof v === "object" && typeof v.due === "number" && Number.isFinite(v.due) && typeof v.streak === "number" && v.streak >= 0 && typeof v.needsReview === "boolean" && typeof v.theme === "string";
  }).slice(-2000));
}
export function recordPractice(memory: PracticeMemory, pattern: PreviewPattern, outcome: PracticeOutcome, now: number): PracticeMemory {
  const key = exerciseKey(pattern), previous = memory[key];
  if (outcome === "solved" && previous && previous.due > now) return memory;
  // A correction immediately after a miss is useful practice, not demonstrated recall.
  const needsReview = outcome !== "solved";
  const streak = needsReview ? 0 : Math.min(3, (previous?.streak ?? 0) + 1);
  return readPracticeMemory({ ...memory, [key]: { due: now + DAY * (needsReview ? 1 : [1, 1, 3, 7][streak]), streak, needsReview, theme: coachingTheme(pattern) } });
}
/** Revisit due exercises, then try unseen positions sharing a previously missed theme. */
export function buildReviewSession(patterns: PreviewPattern[], memory: PracticeMemory, now: number, limit = 6) {
  const seen = new Set<string>();
  const missedThemes = new Set(Object.values(memory).filter(m => m.needsReview).map(m => m.theme));
  const unique = patterns.filter(p => { const key = exerciseKey(p); if (seen.has(key)) return false; seen.add(key); return true; });
  const due = unique.filter(p => memory[exerciseKey(p)]?.due <= now).sort((a, b) => memory[exerciseKey(a)].due - memory[exerciseKey(b)].due);
  const transfer = unique.filter(p => !memory[exerciseKey(p)] && missedThemes.has(coachingTheme(p)));
  // Leave room to test the idea in a different position when one is available.
  return [...due.slice(0, transfer.length ? Math.max(1, limit - 2) : limit), ...transfer].slice(0, limit);
}

export type MissionSnapshot = { version: 1; scanId: string; theme: string; count: number; games: number; settings: string; gameUrls: string[]; createdAt: string | null };
export function readMission(value: unknown): MissionSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<MissionSnapshot>;
  return v.version === 1 && typeof v.scanId === "string" && typeof v.theme === "string" && typeof v.count === "number" && Number.isFinite(v.count) && v.count >= 0 && typeof v.games === "number" && v.games > 0 && Number.isFinite(v.games) && typeof v.settings === "string" && Array.isArray(v.gameUrls) && v.gameUrls.every(u => typeof u === "string") && (v.createdAt === null || typeof v.createdAt === "string") ? v as MissionSnapshot : null;
}
export function compareMission(before: MissionSnapshot, after: MissionSnapshot) {
  if (before.scanId === after.scanId) return { status: "waiting", message: "Your mission is saved. Come back with a new scan after trying it in your games." };
  if (before.settings !== after.settings) return { status: "incomparable", message: "These scans use different analysis settings. Use matching settings to compare this habit." };
  if (!before.createdAt || !after.createdAt || !(Date.parse(after.createdAt) > Date.parse(before.createdAt))) return { status: "incomparable", message: "We cannot establish that this report is newer than your mission baseline." };
  if (before.gameUrls.length !== before.games || after.gameUrls.length !== after.games || after.gameUrls.some(url => before.gameUrls.includes(url))) return { status: "incomparable", message: "These reports overlap or lack complete game identifiers. Scan a separate batch of games to measure this habit without counting the same games twice." };
  const previousRate = before.count / before.games * 100, currentRate = after.count / after.games * 100;
  const direction = currentRate < previousRate ? "fewer" : currentRate > previousRate ? "more" : "the same number of";
  return { status: "compared", message: `${before.theme}: ${previousRate.toFixed(1)} → ${currentRate.toFixed(1)} recorded findings per 100 analyzed games (${before.games} → ${after.games} games). This batch has ${direction} recorded findings per game. Different opponents and positions affect the result; this is not proof of improvement.` };
}
