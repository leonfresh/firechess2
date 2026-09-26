/**
 * Chaos Hour → Discord — Vercel Cron Job, 15 minutes before the hour (see lib/chaos-hour.ts).
 * A heads-up gathers players into the same queue. Secured by CRON_SECRET like /api/chaos/week/post
 * and a visible no-op without CHAOS_DISCORD_WEBHOOK.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const webhook = process.env.CHAOS_DISCORD_WEBHOOK || process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return NextResponse.json({ skipped: 'CHAOS_DISCORD_WEBHOOK is not set' });
  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'Chaos Chess',
      embeds: [{
        title: '⚡ Chaos Hour starts in 15 minutes',
        description: 'For one hour every online game pays **double gold**. Queue up with everyone else and spend it in the shop.\n\n▶ Play in Discord: start the **Chaos Chess** Activity in any voice channel\n▶ Play in the browser: https://chaos.firechess.com',
        color: 0xd4f77a,
      }],
    }),
  });
  if (!response.ok) return NextResponse.json({ error: 'Discord rejected the post', status: response.status }, { status: 502 });
  return NextResponse.json({ posted: true });
}
