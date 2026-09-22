import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getChaosMatchCard } from '@/lib/chaos-week';
import { MatchCard } from '@/lib/chaos-card';

export const runtime = 'nodejs';

/**
 * GET /api/chaos/share/image?match=<matchId|roomId>[&size=square]
 *
 * The big card a player shares after winning OR losing: result, names, the chaos
 * events that decided it, a Chaos Score and the replay CTA. `size=square` (1080)
 * is for feeds and chat; the default 1200x630 is what Discord/X unfurl.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const matchId = params.get('match') ?? params.get('id') ?? '';
  const card = await getChaosMatchCard(matchId);
  if (!card) return new Response('Game not found', { status: 404 });

  const square = ['square', '1', 'true', '1080'].includes((params.get('size') ?? '').toLowerCase());
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'firechess.com').replace(/^https?:\/\//, '');
  const data = {
    headline: card.headline,
    blurb: card.blurb,
    white: card.white,
    black: card.black,
    winner: card.winner,
    reason: card.reason,
    rated: card.rated,
    timeControl: card.timeControl,
    platform: card.platform,
    score: card.score,
    tier: card.tier,
    badges: card.badges,
    events: card.events.map((event) => ({ icon: event.icon, label: event.label })),
    plies: card.plies,
    siteUrl,
  };

  return new ImageResponse(<MatchCard data={data} square={square} />, {
    width: square ? 1080 : 1200,
    height: square ? 1080 : 630,
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Content-Disposition': 'inline; filename="chaos-chess-match.png"',
    },
  });
}
