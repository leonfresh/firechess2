/**
 * Game of the Week → Discord — Vercel Cron Job
 *
 * Posts the week's best Chaos Chess game to a Discord channel: the Game of the
 * Week card, the chaos timeline and the replay link. Same scoring as the website
 * (/chaos/week) and the card route, so the post and the page never disagree.
 *
 * Secured by the CRON_SECRET bearer check, matching /api/cron/weekly-digest.
 * Requires CHAOS_DISCORD_WEBHOOK (falls back to DISCORD_WEBHOOK_URL); with no
 * webhook configured the run is a visible no-op instead of an error.
 *
 * Schedule in vercel.json: { "path": "/api/chaos/week/post", "schedule": "0 9 * * 1" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { postWeekToDiscord } from '@/lib/chaos-week-post';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await postWeekToDiscord();
  const status = 'error' in result ? 502 : 200;
  return NextResponse.json(result, { status });
}
