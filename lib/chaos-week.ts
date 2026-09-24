import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  endingKey,
  endingShareTable,
  scoreChaosGame,
  type ChaosBadge,
  type ChaosEvent,
  type ChaosMoment,
  type ChaosScore,
  type ChaosTier,
} from "./chaos-score";

export type ChaosWeekEntry = {
  id: string;
  roomId: string;
  gameNumber: number;
  white: string;
  black: string;
  winner: string;
  reason: string;
  rated: boolean;
  delta: number | null;
  endedAt: string;
  platform: string;
  timeControl: string;
  score: number;
  watchReasons: string[];
  tier: ChaosTier;
  headline: string;
  blurb: string;
  badgeLine: string;
  events: ChaosEvent[];
  badges: ChaosBadge[];
  moment: ChaosMoment | null;
  plies: number;
  powersInPlay: number;
  signature: string[];
};

/** A scored entry plus the full score breakdown, for cards and detail views. */
export type ChaosCard = ChaosWeekEntry & { detail: ChaosScore };

export type ChaosWeek = {
  weekKey: string;
  windowStart: string;
  windowEnd: string;
  gamesScored: number;
  winner: ChaosWeekEntry | null;
  podium: ChaosWeekEntry[];
  endingShares: Record<string, number>;
};

type MatchRow = {
  id: string;
  room_id: string;
  game_number: number;
  winner: string;
  reason: string;
  rated: boolean;
  host_color: string;
  host_id: string;
  guest_id: string;
  host: string;
  guest: string;
  host_delta: number | null;
  guest_delta: number | null;
  ended_at: string | Date;
  record: any;
};

const timeControlLabel = (seconds: number, increment: number) =>
  seconds > 0 ? `${Math.round(seconds / 60)}+${increment ?? 0}` : "No rush";

/** Everything the share card + OG tags need, scored, for one match id or room id. */
export async function getChaosMatchCard(key: string): Promise<ChaosCard | null> {
  if (!key || key.length > 150) return null;
  const result = await db.execute(sql`
    select m.id, m.room_id, m.game_number, m.winner, m.reason, m.rated, m.host_color,
           m.host_id, m.guest_id, m.host_delta, m.guest_delta, m.ended_at, m.record,
           coalesce(h.name, 'Guest player') as host,
           coalesce(g.name, 'Guest player') as guest
    from chaos_match m
    left join chaos_player h on h.id = m.host_id
    left join chaos_player g on g.id = m.guest_id
    where m.id = ${key} or m.room_id = ${key}
    order by m.game_number desc
    limit 1`);
  const row = (result.rows as MatchRow[])[0];
  if (!row) return null;
  const shares = await getEndingShares();
  return toEntry(row, shares);
}

export async function getEndingShares(): Promise<Record<string, number>> {
  const result = await db.execute(sql`
    select reason, count(*)::int as n from chaos_match group by 1`);
  return endingShareTable(result.rows as { reason: string; n: number }[]);
}

/** Unnamed players (guest identities) would read "Guest player vs Guest player" on a
 * card or the front page, so fall back to the side they played. */
const displayName = (name: string, side: "white" | "black") =>
  name === "Guest player" ? (side === "white" ? "White" : "Black") : name;

function toEntry(row: MatchRow, shares: Record<string, number>): ChaosCard {
  const hostIsWhite = row.host_color === "white";
  const white = displayName(String(hostIsWhite ? row.host : row.guest).slice(0, 40), "white");
  const black = displayName(String(hostIsWhite ? row.guest : row.host).slice(0, 40), "black");
  const record = row.record ?? {};
  const delta = row.host_delta !== null && row.host_delta !== undefined ? Number(row.host_delta) : null;
  const scored = scoreChaosGame({
    winner: row.winner,
    reason: row.reason,
    record,
    rated: !!row.rated,
    ratingDelta: delta,
    endingShare: shares[endingKey(row.reason)],
    captureFen: null,
  });
  const endedAt = row.ended_at instanceof Date ? row.ended_at.toISOString() : String(row.ended_at);
  return {
    id: row.id,
    roomId: row.room_id,
    gameNumber: row.game_number,
    white,
    black,
    winner: row.winner,
    reason: row.reason,
    rated: !!row.rated,
    delta,
    endedAt,
    platform: /^discord_\d{17,20}$/.test(String(row.host_id || row.guest_id || "")) ? "Discord" : "Website",
    timeControl: timeControlLabel(Number(record.timeControlSeconds ?? 0), Number(record.incrementSeconds ?? 0)),
    detail: scored,
    score: scored.score,
    watchReasons: scored.watchReasons,
    tier: scored.tier,
    headline: scored.headline,
    blurb: scored.blurb,
    badgeLine: scored.badgeLine,
    events: scored.events,
    badges: scored.badges,
    moment: scored.moment,
    plies: scored.plies,
    powersInPlay: scored.powersInPlay.white.length + scored.powersInPlay.black.length,
    signature: scored.signature,
  };
}

/** ISO-ish week key (Mon–Sun) used to cache-bust the Game of the Week card. */
export function weekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * The Game of the Week: signed-in opponents from the last 7 days, scored on chaos
 * events only. Deterministic — same window, same winner — so a page render, a
 * Discord post and a cron job all agree without storing a pick.
 */
export async function getChaosWeek(options?: { days?: number; limit?: number }): Promise<ChaosWeek> {
  const days = options?.days ?? 7;
  const limit = options?.limit ?? 400;
  const shares = await getEndingShares();
  const result = await db.execute(sql`
    select m.id, m.room_id, m.game_number, m.winner, m.reason, m.rated, m.host_color,
           m.host_id, m.guest_id, m.host_delta, m.guest_delta, m.ended_at, m.record,
           coalesce(h.name, 'Guest player') as host,
           coalesce(g.name, 'Guest player') as guest
    from chaos_match m
    left join chaos_player h on h.id = m.host_id
    left join chaos_player g on g.id = m.guest_id
    where m.ended_at > now() - (${days} * interval '1 day')
      and h.id is not null and g.id is not null
      and left(m.host_id, 6) <> 'guest_' and left(m.guest_id, 6) <> 'guest_'
      and m.host_id <> m.guest_id
    order by m.ended_at desc
    limit ${limit}`);
  const rows = result.rows as MatchRow[];
  const entries = rows
    .map((row) => toEntry(row, shares))
    // Stub games (aborted starts, 0-2 plies) are archive noise, never a highlight.
    .filter((entry) => entry.plies >= 6 && entry.moment !== null && !/abort|disconnect|abandon/i.test(entry.reason))
    // Deterministic tie-break: more signature powers, then shorter, then the
    // EARLIER game wins — so a page render, the card and the cron post agree.
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.signature.length - a.signature.length ||
        a.plies - b.plies ||
        a.endedAt.localeCompare(b.endedAt) || a.id.localeCompare(b.id),
    );
  const now = new Date();
  const start = new Date(now.getTime() - days * 86400000);
  return {
    weekKey: weekKey(now),
    windowStart: start.toISOString(),
    windowEnd: now.toISOString(),
    gamesScored: entries.length,
    winner: entries[0] ?? null,
    podium: entries.slice(0, 5),
    endingShares: shares,
  };
}
