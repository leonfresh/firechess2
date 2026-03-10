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

export async function getChaosUserId(req: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const guestId = req.headers.get("x-guest-id");
  if (guestId && guestId.startsWith("guest_")) return guestId;

  return null;
}
