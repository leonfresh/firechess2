/** Shared presets and wall-clock projection. Only the server updates the anchor. */
export const CHAOS_TIME_CONTROLS = [
  { label: "2+1", base: 120, inc: 1 },
  { label: "5+3", base: 300, inc: 3 },
  { label: "10+5", base: 600, inc: 5 },
] as const;
export type MatchClock = { w: number; b: number; active: "w" | "b" | null; since: number };
export function timeControl(base: unknown, inc: unknown) {
  if (base === -1) return { label: "No rush", base: -1, inc: 0 };
  return CHAOS_TIME_CONTROLS.find(c => c.base === base && c.inc === inc) ?? CHAOS_TIME_CONTROLS[1];
}
export function projectClock(clock: MatchClock, now: number): MatchClock {
  const result = { ...clock, since: now };
  if (clock.active) result[clock.active] = Math.max(0, clock[clock.active] - Math.max(0, now - clock.since));
  return result;
}
