/**
 * POST /api/webhooks/stripe — handle Stripe webhook events.
 *
 * Updates the user's subscription status in our DB based on:
 *   - checkout.session.completed → pro + active
 *   - customer.subscription.updated → status sync
 *   - customer.subscription.deleted → free + canceled
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, affiliates, affiliateReferrals } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia" as any,
  });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    /* ── Checkout completed — activate Pro or Lifetime ── */
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const isLifetime = session.metadata?.plan === "lifetime";

      const subscriptionId = isLifetime
        ? null
        : typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      await db
        .insert(subscriptions)
        .values({
          userId,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
          stripeSubscriptionId: subscriptionId ?? null,
          plan: isLifetime ? "lifetime" : "pro",
          status: "active",
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
            stripeSubscriptionId: subscriptionId ?? null,
            plan: isLifetime ? "lifetime" : "pro",
            status: "active",
            updatedAt: new Date(),
          },
        });

      // ── Affiliate referral tracking ──
      // session.discounts is already present in the webhook event (no expand needed).
      // Each discount item has promotion_code as a string ID like "promo_XXXX".
      try {
        const discounts = session.discounts as Array<{
          coupon: string;
          promotion_code: string | null;
        }> | null | undefined;

        const promoCodeId = discounts?.[0]?.promotion_code ?? null;

        if (promoCodeId) {
          // Find which affiliate owns this promo code
          const [affiliate] = await db
            .select()
            .from(affiliates)
            .where(eq(affiliates.stripePromoCodeId, promoCodeId))
            .limit(1);

          if (affiliate) {
            // amount_total is in cents, already after discount
            const amountCents = session.amount_total ?? 0;
            const commissionCents = Math.round(amountCents * affiliate.commissionPct / 100);

            await db.insert(affiliateReferrals).values({
              affiliateId: affiliate.id,
              userId,
              stripeSessionId: session.id,
              planType: isLifetime ? "lifetime" : "pro",
              amountCents,
              commissionCents,
            });
          }
        }
      } catch (affiliateErr) {
        // Never fail the whole webhook because of affiliate tracking
        console.error("Affiliate referral tracking error:", affiliateErr);
      }

      break;
    }

    /* ── Subscription updated (renewal, payment issue, etc.) ── */
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (!customerId) break;

      // Don't downgrade lifetime users
      const [existing] = await db
        .select({ plan: subscriptions.plan })
        .from(subscriptions)
        .where(eq(subscriptions.stripeCustomerId, customerId))
        .limit(1);
      if (existing?.plan === "lifetime") break;

      const isPro = sub.status === "active" || sub.status === "trialing";
      const periodEndTs = (sub as any).current_period_end as number | undefined;
      const periodEnd = periodEndTs
        ? new Date(periodEndTs * 1000)
        : null;

      await db
        .update(subscriptions)
        .set({
          plan: isPro ? "pro" : "free",
          status: mapStripeStatus(sub.status),
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeCustomerId, customerId));
      break;
    }

    /* ── Invoice paid — track recurring affiliate commission ── */
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;

      // Only track renewals — first payment is already captured via checkout.session.completed
      if (invoice.billing_reason === "subscription_create") break;

      const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as any)?.id;
      if (!customerId) break;

      // Find the FireChess user for this Stripe customer
      const [userSub] = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions)
        .where(eq(subscriptions.stripeCustomerId, customerId))
        .limit(1);
      if (!userSub?.userId) break;

      // Look up their original affiliate referral to find which affiliate referred them
      try {
        const [originalReferral] = await db
          .select({
            affiliateId: affiliateReferrals.affiliateId,
          })
          .from(affiliateReferrals)
          .where(eq(affiliateReferrals.userId, userSub.userId))
          .limit(1);

        if (!originalReferral) break;

        // Get the affiliate's current commission % (may have changed since signup)
        const [affiliate] = await db
          .select({ commissionPct: affiliates.commissionPct, active: affiliates.active })
          .from(affiliates)
          .where(eq(affiliates.id, originalReferral.affiliateId))
          .limit(1);

        // Don't pay commission for deactivated affiliates
        if (!affiliate || !affiliate.active) break;

        const amountCents = invoice.amount_paid ?? 0;
        if (amountCents === 0) break;

        const commissionCents = Math.round(amountCents * affiliate.commissionPct / 100);

        await db.insert(affiliateReferrals).values({
          affiliateId: originalReferral.affiliateId,
          userId: userSub.userId,
          stripeSessionId: typeof invoice.id === "string" ? invoice.id : null,
          planType: "pro",
          amountCents,
          commissionCents,
        });
      } catch (recurringErr) {
        console.error("Recurring affiliate commission error:", recurringErr);
      }
      break;
    }

    /* ── Subscription deleted — revert to free (but not lifetime) ── */
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (!customerId) break;

      // Don't downgrade lifetime users
      const [existingDel] = await db
        .select({ plan: subscriptions.plan })
        .from(subscriptions)
        .where(eq(subscriptions.stripeCustomerId, customerId))
        .limit(1);
      if (existingDel?.plan === "lifetime") break;

      await db
        .update(subscriptions)
        .set({
          plan: "free",
          status: "canceled",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeCustomerId, customerId));
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(
  s: Stripe.Subscription.Status,
): "active" | "canceled" | "past_due" | "incomplete" | "trialing" {
  switch (s) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "canceled";
  }
}
