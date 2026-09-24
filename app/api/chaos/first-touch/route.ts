/**
 * POST /api/chaos/first-touch — remember where a Chaos player identity first arrived from
 * (referring host, utm tags, ?ref=). Body: { surface, referrer, utmSource, utmMedium, utmCampaign,
 * ref, landing }. One row per identity; the first touch wins. Best-effort: always answers 204, also
 * before migrations/chaos-attribution.sql has created the table.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getChaosUserId } from "@/lib/chaos-auth";

const clip = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

function referrerHost(value: unknown): string | null {
  const raw = clip(value, 500);
  if (!raw) return null;
  try {
    return new URL(raw).hostname.replace(/^www\./, "").slice(0, 120) || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  try {
    const id = await getChaosUserId(req);
    if (!id) return done;
    const raw = await req.text();
    if (raw.length > 4096) return done;
    const body = JSON.parse(raw) as Record<string, unknown>;
    const surface = body.surface === "activity" ? "activity" : "website";
    await db.execute(sql`insert into chaos_first_touch (player_id, surface, referrer_host, utm_source, utm_medium, utm_campaign, ref, landing)
      values (${id}, ${surface}, ${referrerHost(body.referrer)}, ${clip(body.utmSource, 80)}, ${clip(body.utmMedium, 80)},
        ${clip(body.utmCampaign, 120)}, ${clip(body.ref, 80)}, ${clip(body.landing, 200)})
      on conflict (player_id) do nothing`);
  } catch {
    // Attribution must never break the game.
  }
  return done;
}
