/**
 * Resolve a user identity for Chaos Chess API routes.
 *
 * Priority:
 * 1. Signed Discord Activity identity
 * 2. Authenticated FireChess session → session.user.id
 * 3. Signed website cookie shared with chaos.firechess.com
 * 4. X-Guest-Id header → guest_<uuid>
 *
 * Returns null if neither is available.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { readDiscordIdentity } from "./chaos-discord-identity";
import { readWebsiteIdentity, websiteIdentityCookie } from './chaos-website-identity';
import { db } from './db';
import { sql } from 'drizzle-orm';

export async function getChaosUserId(req: NextRequest): Promise<string | null> {
  const identity = req.headers.get("x-chaos-identity");
  if (identity) return readDiscordIdentity(identity);
  const session = await auth();
  if (session?.user?.id) {
    if (/\/(matchmake|create|join|account|website-login)$/.test(req.nextUrl.pathname)) await db.execute(sql`insert into chaos_player (id, name)
      select id, left(coalesce(nullif(chaos_username,''),nullif(name,''),'Player'),80) from "user" where id=${session.user.id}
      on conflict (id) do update set name=excluded.name where chaos_player.name is distinct from excluded.name`);
    return session.user.id;
  }

  const websiteIdentity = req.cookies.get(websiteIdentityCookie)?.value;
  if (websiteIdentity) {
    const id = readWebsiteIdentity(websiteIdentity);
    if (id) return id;
  }

  const guestId = req.headers.get("x-guest-id");
  if (guestId && /^guest_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId)) return guestId;

  return null;
}

/** Guest identities are the only seats that can never be rated: they have no chaos_player row. */
export function isGuestId(id: string | null | undefined): boolean {
  return !!id && id.startsWith("guest_");
}
