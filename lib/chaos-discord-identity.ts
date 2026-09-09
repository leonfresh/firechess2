import { createHmac, timingSafeEqual } from 'node:crypto';
const audience = 'chaos-discord-v1';
export function signDiscordIdentity(id: string, now = Date.now()) {
  const secret = process.env.CHAOS_LIVE_SECRET;
  if (!secret || !/^discord_\d{17,20}$/.test(id)) throw new Error('Identity unavailable');
  const payload = Buffer.from(JSON.stringify({aud: audience, sub: id, exp: now + 12 * 60 * 60_000})).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
}
export function readDiscordIdentity(token: string, now = Date.now()): string | null {
  try {
    const secret = process.env.CHAOS_LIVE_SECRET;
    if (!secret || token.length > 2048) return null;
    const [payload, sig, extra] = token.split('.');
    if (!payload || !sig || extra) return null;
    const actual = Buffer.from(sig, 'base64url'), expected = createHmac('sha256', secret).update(payload).digest();
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.aud === audience && /^discord_\d{17,20}$/.test(data.sub) && data.exp > now ? data.sub : null;
  } catch { return null; }
}
