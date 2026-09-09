/**
 * Resolve a user identity for Chaos Chess API routes.
 *
 * Priority:
 * 1. Authenticated session → session.user.id
 * 2. X-Guest-Id header → guest_<uuid>
 *
 * Returns null if neither is available.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { readDiscordIdentity } from "./chaos-discord-identity";

export async function getChaosUserId(req: NextRequest): Promise<string | null> {
  const identity = req.headers.get("x-chaos-identity");
  if (identity) return readDiscordIdentity(identity);
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const guestId = req.headers.get("x-guest-id");
  if (guestId && /^guest_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId)) return guestId;

  return null;
}
