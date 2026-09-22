import { NextRequest, NextResponse } from 'next/server';
import { getChaosWeek } from '@/lib/chaos-week';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chaos/week?days=7
 *
 * The Game of the Week: every archived Chaos game in the window, scored on chaos
 * events (signature powers, anomalies, king captures, rarity) rather than engine
 * accuracy. Same window, same winner for the site, the card and the Discord post.
 */
export async function GET(req: NextRequest) {
  const daysParam = Number(req.nextUrl.searchParams.get('days') ?? '7');
  const days = Number.isFinite(daysParam) ? Math.min(30, Math.max(1, Math.round(daysParam))) : 7;
  const week = await getChaosWeek({ days });
  return NextResponse.json(week, { headers: { 'Cache-Control': 'no-store' } });
}
