/** Shared presets and wall-clock projection. Only the server updates the anchor. */
// The middle preset was 5+3 until Sept 2026: 46% of those games were lost on time with the draft
// pause already working, so it gained increment. Unknown pairs (old clients sending 300/3) resolve
// to it through timeControl()'s fallback.
export const CHAOS_TIME_CONTROLS = [
  { label: "2+1", base: 120, inc: 1 },
  { label: "5+5", base: 300, inc: 5 },
  { label: "10+5", base: 600, inc: 5 },
] as const;
/**
 * `since` is when the active side's time starts running. It can lie in the future: after a power
 * draft or the opening anomaly pick the player to move gets PICK_READING_GRACE_MS to take in the
 * new powers before their clock runs.
 */
export type MatchClock = { w: number; b: number; active: "w" | "b" | null; since: number };
/** Free reading time for the player to move when the clock resumes after a pick. */
export const PICK_READING_GRACE_MS = 8_000;
export function timeControl(base: unknown, inc: unknown) {
  if (base === -1) return { label: "No rush", base: -1, inc: 0 };
  return CHAOS_TIME_CONTROLS.find(c => c.base === base && c.inc === inc) ?? CHAOS_TIME_CONTROLS[1];
}
export function projectClock(clock: MatchClock, now: number): MatchClock {
  const result = { ...clock, since: Math.max(now, clock.since) };
  if (clock.active) result[clock.active] = Math.max(0, clock[clock.active] - Math.max(0, now - clock.since));
  return result;
}
