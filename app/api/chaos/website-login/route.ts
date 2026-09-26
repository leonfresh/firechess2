import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChaosUserId } from '@/lib/chaos-auth';
import { signWebsiteIdentity, websiteIdentityCookie, websiteIdentityCookieOptions } from '@/lib/chaos-website-identity';

export async function GET(req: NextRequest) {
  const session = await auth();
  // ?switch=1 always shows the sign-in page, so a player signed in with Google can pick Lichess.
  if (!session?.user?.id || req.nextUrl.searchParams.get('switch') === '1') {
    return NextResponse.redirect(new URL('/auth/signin?callbackUrl=%2Fapi%2Fchaos%2Fwebsite-login', req.url));
  }
  // Register the verified FireChess account before entering the rated queue.
  await getChaosUserId(req);
  const options = websiteIdentityCookieOptions(new URL(req.url).hostname);
  const response = NextResponse.redirect(options.domain ? 'https://chaos.firechess.com' : new URL('/chaos?play=1', req.url));
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(websiteIdentityCookie, signWebsiteIdentity(session.user.id), options);
  return response;
}
