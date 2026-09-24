/**
 * "Usually busiest around 8pm your time" for the matchmaking lobby. /api/chaos/busy-hours returns
 * finished games per UTC hour; the browser shifts that into its own time zone here, so every player
 * sees the peak in local time without the server knowing where they are.
 */

/** Below this many games in the sample the peak is noise, so the lobby shows nothing. */
export const BUSY_HOURS_MIN_GAMES = 20;

/**
 * Local hour (0-23) at the centre of the busiest 3-hour window, or null when the sample is too
 * small. `timezoneOffsetMinutes` is Date#getTimezoneOffset(): UTC minus local, e.g. -600 in Sydney.
 */
export function busiestLocalHour(utcCounts: readonly number[], timezoneOffsetMinutes: number): number | null {
  if (utcCounts.length !== 24) return null;
  const total = utcCounts.reduce((a, n) => a + (Number.isFinite(n) && n > 0 ? n : 0), 0);
  if (total < BUSY_HOURS_MIN_GAMES) return null;
  const shift = Math.round(-timezoneOffsetMinutes / 60);
  const local = Array.from({ length: 24 }, (_, h) => Math.max(0, utcCounts[(((h - shift) % 24) + 24) % 24] || 0));
  let best = 0, bestScore = -1, bestCentre = -1;
  for (let h = 0; h < 24; h++) {
    const score = local[(h + 23) % 24] + local[h] + local[(h + 1) % 24];
    // Neighbouring windows tie around a single busy hour; the busier centre wins.
    if (score > bestScore || (score === bestScore && local[h] > bestCentre)) { best = h; bestScore = score; bestCentre = local[h]; }
  }
  return best;
}

/** 20 -> "8pm", 0 -> "midnight", 12 -> "noon". */
export function hourLabel(hour: number): string {
  if (hour === 0) return "midnight";
  if (hour === 12) return "noon";
  return `${hour % 12}${hour < 12 ? "am" : "pm"}`;
}
