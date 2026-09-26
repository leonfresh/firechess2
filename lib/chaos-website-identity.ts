import { createHmac, timingSafeEqual } from 'node:crypto';

export const websiteIdentityCookie = 'chaos-website-identity';
const audience = 'chaos-website-v1';
// 30 days, renewed whenever Chaos loads the account (see /api/chaos/account), so an active
// player stays signed in. It was 12 hours with no renewal, which signed everyone out daily.
export const websiteIdentityLifetime = 30 * 24 * 60 * 60;
const validId = (id: unknown): id is string => typeof id === 'string' && id.length > 0 && id.length <= 200 && !id.startsWith('guest_') && !id.startsWith('discord_');

export function signWebsiteIdentity(id: string, now = Date.now()) {
  const secret = process.env.CHAOS_LIVE_SECRET;
  if (!secret || !validId(id)) throw new Error('Identity unavailable');
  const payload = Buffer.from(JSON.stringify({ aud: audience, sub: id, exp: now + websiteIdentityLifetime * 1000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
}

/** Cookie options: shared by chaos.firechess.com in production, host-only in development. */
export function websiteIdentityCookieOptions(hostname: string) {
  const production = hostname === 'firechess.com' || hostname.endsWith('.firechess.com');
  return {
    httpOnly: true, secure: production, sameSite: 'lax' as const, path: '/api/chaos',
    maxAge: websiteIdentityLifetime, ...(production ? { domain: '.firechess.com' } : {}),
  };
}

export function readWebsiteIdentity(token: string, now = Date.now()): string | null {
  try {
    const secret = process.env.CHAOS_LIVE_SECRET;
    if (!secret || token.length > 2048) return null;
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return null;
    const actual = Buffer.from(signature, 'base64url');
    const expected = createHmac('sha256', secret).update(payload).digest();
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.aud === audience && validId(data.sub) && Number.isFinite(data.exp) && data.exp > now ? data.sub : null;
  } catch { return null; }
}
