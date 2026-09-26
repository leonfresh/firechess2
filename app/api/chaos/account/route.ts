import { NextRequest, NextResponse } from 'next/server';
import { getChaosUserId } from '@/lib/chaos-auth';
import { readWebsiteIdentity, signWebsiteIdentity, websiteIdentityCookie, websiteIdentityCookieOptions } from '@/lib/chaos-website-identity';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const id = await getChaosUserId(req);
  const result = id && !id.startsWith('guest_') ? await db.execute(sql`select name from chaos_player where id=${id}`) : null;
  const response = NextResponse.json({ player: result?.rows[0] ? { id, name: result.rows[0].name } : null }, { headers: { 'Cache-Control': 'no-store' } });
  // Sliding sign-in: every visit pushes the website identity's expiry another 30 days out.
  const cookie = req.cookies.get(websiteIdentityCookie)?.value;
  const cookieId = cookie ? readWebsiteIdentity(cookie) : null;
  if (cookieId && cookieId === id) {
    try { response.cookies.set(websiteIdentityCookie, signWebsiteIdentity(cookieId), websiteIdentityCookieOptions(req.nextUrl.hostname)); } catch {}
  }
  return response;
}
