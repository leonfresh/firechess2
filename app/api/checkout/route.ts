/**
 * POST /api/checkout — create a Stripe Checkout session for Pro upgrade.
 *
 * Requires an authenticated session. Attaches the user ID as metadata
 * so the webhook can link the subscription back to our DB.
 *
 * Body (optional): { "plan": "lifetime" } — creates a one-time payment
 * checkout for the $59 lifetime deal instead of a monthly subscription.
 * { "plan": "report", "scanId": "…" } — a one-time $9 unlock of one report
 * (see lib/report-unlock.ts). Report unlocks from the last 30 days count
 * toward Lifetime.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scanSessions, subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isExpiredScanSession } from "@/lib/scan-session";
import { hasReportUnlock, lifetimeCreditCents, LIFETIME_CENTS, REPORT_UNLOCK_CENTS } from "@/lib/report-unlock";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia" as any,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again later." }, { status: 503 });
  }
  const stripe = getStripe();

  // Parse optional body for plan type
  let isLifetime = false;
  let reportScanId: string | null = null;
  try {
    const body = await req.json();
    isLifetime = body?.plan === "lifetime";
    if (body?.plan === "report" && typeof body.scanId === "string") reportScanId = body.scanId;
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

  // Guard: don't let already-active users buy again
  if (sub?.status === "active") {
    if (sub.plan === "lifetime") {
      return NextResponse.json(
        { error: "You already have lifetime access." },
        { status: 409 },
      );
    }
    if (sub.plan === "pro" && reportScanId) {
      return NextResponse.json(
        { error: "Your Pro plan already includes the full report." },
        { status: 409 },
      );
    }
    if (sub.plan === "pro" && !isLifetime) {
      return NextResponse.json(
        { error: "You already have an active Pro subscription." },
        { status: 409 },
      );
    }
  }

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

  // Read ?ref= affiliate cookie (set by RefTracker client component)
  const refSlug = req.cookies.get("fc_ref")?.value ?? null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.firechess.com";

  if (reportScanId) {
    const [scan] = await db
      .select({ id: scanSessions.id, status: scanSessions.status, chessUsername: scanSessions.chessUsername, expiresAt: scanSessions.expiresAt, savedReportId: scanSessions.savedReportId })
      .from(scanSessions)
      .where(eq(scanSessions.id, reportScanId))
      .limit(1);
    if (!scan || scan.status !== "ready" || isExpiredScanSession(scan)) {
      return NextResponse.json({ error: "This report is no longer available." }, { status: 404 });
    }
    if (await hasReportUnlock(session.user.id, scan.id)) {
      return NextResponse.json({ error: "You already unlocked this report." }, { status: 409 });
    }
    // Promotion codes stay off: a 100%-off affiliate code must not make unlocks free.
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `FireChess full report — ${scan.chessUsername}`,
              description:
                "Every finding in this report, kept permanently. Counts toward Lifetime for 30 days.",
            },
            unit_amount: REPORT_UNLOCK_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        plan: "report",
        scanId: scan.id,
        ...(refSlug ? { ref: refSlug } : {}),
      },
      success_url: `${appUrl}/report/${scan.id}?unlocked=1`,
      cancel_url: `${appUrl}/report/${scan.id}`,
    });
    return NextResponse.json({ url: checkoutSession.url });
  }

  if (isLifetime) {
    // One-time payment for lifetime Pro, less any report unlocks from the last 30 days
    const creditCents = await lifetimeCreditCents(session.user.id);
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "FireChess Pro — Lifetime Access",
              description: creditCents
                ? `One-time payment. Full Pro features forever — includes a ${(creditCents / 100).toFixed(2)} credit for your recent report unlocks.`
                : "One-time payment. Full Pro features forever — no recurring fees.",
            },
            unit_amount: LIFETIME_CENTS - creditCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        description: "FireChess Lifetime Pro — one-time payment, never expires",
      },
      metadata: {
        userId: session.user.id,
        plan: "lifetime",
        ...(refSlug ? { ref: refSlug } : {}),
      },
      success_url: `${appUrl}/?upgraded=lifetime`,
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
    metadata: { userId: session.user.id, ...(refSlug ? { ref: refSlug } : {}) },
    success_url: `${appUrl}/?upgraded=pro`,
    cancel_url: `${appUrl}/pricing`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
