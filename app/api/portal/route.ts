/**
 * POST /api/portal — create a Stripe Customer Portal session.
 *
 * Redirects Pro subscribers to Stripe's hosted portal where they can
 * update payment methods, view invoices, or cancel their subscription.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
});

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up Stripe customer ID
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Please subscribe first." },
      { status: 400 },
    );
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.firechess.com"}/account`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error("Stripe portal error:", err.message);
    return NextResponse.json(
      { error: "Could not create billing portal session." },
      { status: 500 },
    );
  }
}
