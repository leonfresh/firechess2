/**
 * Live spectator counts ("👁 12 watching"), kept in the Chaos Upstash Redis as one sorted set per
 * room: member = an anonymous per-tab viewer id, score = last heartbeat. A viewer counts for
 * WINDOW_MS after its last heartbeat. Players are never recorded, only counted for.
 *
 * Budget (Upstash free plan, 500k commands a month): a watching tab sends a heartbeat every 15s
 * (4 commands), a player reads the count every 15s (1 command). Without Redis configured (local
 * development) every call resolves null and the UI simply hides the count.
 */

const WINDOW_MS = 40_000;
const VIEWER_ID = /^[a-z0-9-]{8,64}$/i;
const ROOM_ID = /^[\w:.-]{1,150}$/;

const key = (roomId: string) => `chaos:spectators:${roomId}`;

async function pipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  const url = process.env.CHAOS_REDIS_KV_REST_API_URL, token = process.env.CHAOS_REDIS_KV_REST_API_TOKEN;
  if (!url || !token || !commands.length) return null;
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return null;
    const results = (await response.json()) as { result?: unknown; error?: string }[];
    return results.some((r) => r.error) ? null : results.map((r) => r.result);
  } catch {
    return null; // counts are decoration; never fail the page over them
  }
}

/** Heartbeat for one watching tab; returns the room's current spectator count. */
export async function recordSpectator(roomId: string, viewerId: string): Promise<number | null> {
  if (!ROOM_ID.test(roomId) || !VIEWER_ID.test(viewerId)) return spectatorCount(roomId);
  const now = Date.now();
  const results = await pipeline([
    ["ZADD", key(roomId), now, viewerId],
    ["ZREMRANGEBYSCORE", key(roomId), 0, now - WINDOW_MS],
    ["EXPIRE", key(roomId), 120],
    ["ZCARD", key(roomId)],
  ]);
  return results ? Number(results[3]) || 0 : null;
}

/** Current count for each room (read-only). */
export async function spectatorCounts(roomIds: string[]): Promise<Record<string, number> | null> {
  const rooms = roomIds.filter((id) => ROOM_ID.test(id)).slice(0, 25);
  if (!rooms.length) return {};
  const since = Date.now() - WINDOW_MS;
  const results = await pipeline(rooms.map((id) => ["ZCOUNT", key(id), since, "+inf"]));
  if (!results) return null;
  return Object.fromEntries(rooms.map((id, i) => [id, Number(results[i]) || 0]));
}

export async function spectatorCount(roomId: string): Promise<number | null> {
  const counts = await spectatorCounts([roomId]);
  return counts ? counts[roomId] ?? 0 : null;
}
