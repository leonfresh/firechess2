import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getChaosWeek, weekKey } from '@/lib/chaos-week';
import { WeekCard } from '@/lib/chaos-card';

export const runtime = 'nodejs';

/**
 * GET /api/chaos/week/image[?days=7]
 *
 * The Game of the Week card. Renders the picked week's winner, or a friendly
 * "no games yet" card when the archive window is empty, so the OG tag never 404s.
 */
export async function GET(req: NextRequest) {
  const daysParam = Number(req.nextUrl.searchParams.get('days') ?? '7');
  const days = Number.isFinite(daysParam) ? Math.min(30, Math.max(1, Math.round(daysParam))) : 7;
  const week = await getChaosWeek({ days });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'firechess.com').replace(/^https?:\/\//, '');
  const winner = week.winner;

  if (!winner) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            background: '#0d1726',
            color: '#fff0c7',
            fontFamily: 'sans-serif',
            padding: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              border: '3px solid #c69a54',
              borderRadius: 34,
              background: 'linear-gradient(120deg,#29445a,#192639)',
              gap: 18,
            }}
          >
            <div style={{ display: 'flex', fontSize: 30, color: '#d7fa64', letterSpacing: 3 }}>
              CHAOS CHESS · GAME OF THE WEEK
            </div>
            <div style={{ display: 'flex', fontSize: 62, fontWeight: 900 }}>No games archived yet</div>
            <div style={{ display: 'flex', fontSize: 26, color: '#9fb6c6' }}>
              Draft powers. Break chess. Play a match and claim the card.
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=300' } },
    );
  }

  return new ImageResponse(
    (
      <WeekCard
        data={{
          weekLabel: weekKey(new Date(week.windowEnd)),
          gamesScored: week.gamesScored,
          headline: winner.headline,
          blurb: winner.blurb,
          white: winner.white,
          black: winner.black,
          winner: winner.winner,
          reason: winner.reason,
          score: winner.score,
          tier: winner.tier,
          badges: winner.badges,
          siteUrl,
        }}
      />
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=300', 'Content-Disposition': 'inline; filename="chaos-game-of-the-week.png"' },
    },
  );
}
