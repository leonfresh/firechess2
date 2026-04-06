/**
 * GET /api/me — return the current user's session info + plan.
 *
 * Reads plan directly from DB (not the JWT cookie) so it always reflects
 * the latest subscription state — e.g. after a Stripe webhook fires.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isAdmin as checkIsAdmin } from "@/lib/admin";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false, plan: "free" });
  }

  const userId = session.user.id;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const admin = await checkIsAdmin(userId);
  const plan = admin ? "lifetime" : (sub?.plan ?? "free");
  const subscriptionStatus = sub?.status ?? "active";

  return NextResponse.json({
    authenticated: true,
    plan,
    subscriptionStatus,
    isAdmin: admin,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  });
}
