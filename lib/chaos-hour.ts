/**
 * Chaos Hour: every day 20:00-21:00 UTC, match gold is paid twice. One shared hour gathers the
 * small player base into the same queue instead of spreading it across the day. It was the
 * busiest hour of the three weeks before launch (US afternoon, UK and Europe evening).
 *
 * The server side is chaos_hour_active() in migrations/chaos-hour.sql: change both together.
 */
export const CHAOS_HOUR_UTC = 20;
const HOUR = 60 * 60 * 1000;

export type ChaosHourState = { live: boolean; /** ms until it starts (0 when live) */ startsIn: number; /** ms until it ends (0 when not live) */ endsIn: number; start: Date };

export function chaosHourState(now = Date.now()): ChaosHourState {
  const d = new Date(now);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), CHAOS_HOUR_UTC);
  if (now >= today && now < today + HOUR) return { live: true, startsIn: 0, endsIn: today + HOUR - now, start: new Date(today) };
  const next = now < today ? today : today + 24 * HOUR;
  return { live: false, startsIn: next - now, endsIn: 0, start: new Date(next) };
}

/** "2h 14m", "14m", "under a minute" */
export function formatWait(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes <= 1) return "under a minute";
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
