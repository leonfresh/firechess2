/**
 * POST /api/checkout — create a Stripe Checkout session for Pro upgrade.
 *
 * Requires an authenticated session. Attaches the user ID as metadata
 * so the webhook can link the subscription back to our DB.
 *
 * Body (optional): { "plan": "lifetime" } — creates a one-time payment
 * checkout for the $59 lifetime deal instead of a monthly subscription.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse optional body for plan type
  let isLifetime = false;
  try {
    const body = await req.json();
    isLifetime = body?.plan === "lifetime";
  } catch {
    // No body or invalid JSON — default to monthly subscription
  }

  // Check for existing Stripe customer
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  let customerId = sub?.stripeCustomerId ?? undefined;

  // Create or reuse Stripe customer
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;

    // Persist customer ID
    await db
      .insert(subscriptions)
      .values({
        userId: session.user.id,
        stripeCustomerId: customerId,
        plan: "free",
        status: "active",
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: { stripeCustomerId: customerId },
      });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://firechess.com";

  if (isLifetime) {
    // One-time payment for lifetime Pro
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "FireChess Pro — Lifetime Access",
              description: "One-time payment. Full Pro features forever — no recurring fees.",
            },
            unit_amount: 5900, // $59.00
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        description: "FireChess Lifetime Pro — one-time payment, never expires",
      },
      metadata: { userId: session.user.id, plan: "lifetime" },
      success_url: `${appUrl}/?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
    });
    return NextResponse.json({ url: checkoutSession.url });
  }

  // Monthly subscription
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    allow_promotion_codes: true,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_PRO_MONTHLY!,
        quantity: 1,
      },
    ],
    metadata: { userId: session.user.id },
    success_url: `${appUrl}/?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
