/**
 * POST /api/chaos/event — one player-journey step: { event, detail? }. Allow-listed events only
 * (mirrors CHAOS_EVENTS in lib/chaos-events.ts, a client module), keyed by the caller's Chaos
 * identity (account, Discord or browser guest). Best-effort: always 204, never slows or breaks the
 * game. Read as aggregates on /admin/chaos.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getChaosUserId } from "@/lib/chaos-auth";

const EVENTS = new Set(["lobby_view", "practice_start", "queue_start", "queue_cancel", "wait_ai", "invite", "match_found"]);

export async function POST(req: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  try {
    const id = await getChaosUserId(req);
    if (!id) return done;
    const raw = await req.text();
    if (raw.length > 2048) return done;
    const body = JSON.parse(raw) as { event?: unknown; detail?: unknown };
    const event = String(body.event ?? "");
    if (!EVENTS.has(event)) return done;
    const surface = req.headers.get("x-chaos-identity") ? "activity" : "website";
    const detail = body.detail && typeof body.detail === "object" ? JSON.stringify(body.detail).slice(0, 500) : null;
    await db.execute(sql`insert into chaos_event (player_id, surface, event, detail) values (${id}, ${surface}, ${event}, ${detail}::jsonb)`);
  } catch {
    // Analytics must never break the game.
  }
  return done;
}
