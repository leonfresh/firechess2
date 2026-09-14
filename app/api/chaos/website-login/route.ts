import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChaosUserId } from '@/lib/chaos-auth';
import { signWebsiteIdentity, websiteIdentityCookie, websiteIdentityLifetime } from '@/lib/chaos-website-identity';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin?callbackUrl=%2Fapi%2Fchaos%2Fwebsite-login', req.url));
  }
  // Register the verified FireChess account before entering the rated queue.
  await getChaosUserId(req);
  const production = new URL(req.url).hostname.endsWith('.firechess.com') || new URL(req.url).hostname === 'firechess.com';
  const response = NextResponse.redirect(production ? 'https://chaos.firechess.com' : new URL('/chaos?play=1', req.url));
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(websiteIdentityCookie, signWebsiteIdentity(session.user.id), {
    httpOnly: true, secure: production, sameSite: 'lax', path: '/api/chaos',
    maxAge: websiteIdentityLifetime, ...(production ? { domain: '.firechess.com' } : {}),
  });
  return response;
}
