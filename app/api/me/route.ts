/**
 * GET /api/me — return the current user's session info + plan.
 *
 * Used by client components to hydrate Pro/Free state from the real DB.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ authenticated: false, plan: "free" });
  }

  return NextResponse.json({
    authenticated: true,
    plan: (session as any).plan ?? "free",
    subscriptionStatus: (session as any).subscriptionStatus ?? "active",
    isAdmin: (session as any).isAdmin ?? false,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  });
}
