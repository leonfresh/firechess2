/**
 * GET  /api/gift/[token]  — check token validity (public)
 * POST /api/gift/[token]  — redeem token (authenticated)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { giftLinks, giftRedemptions, subscriptions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

async function resolveToken(token: string) {
  const [link] = await db
    .select()
    .from(giftLinks)
    .where(eq(giftLinks.token, token))
    .limit(1);
  return link ?? null;
}

function linkStatus(link: typeof giftLinks.$inferSelect): "valid" | "expired" | "revoked" | "exhausted" {
  if (link.revokedAt) return "revoked";
  if (link.expiresAt && link.expiresAt < new Date()) return "expired";
  if (link.usedCount >= link.maxUses) return "exhausted";
  return "valid";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const link = await resolveToken(token);
  if (!link) {
    return NextResponse.json({ error: "Gift link not found." }, { status: 404 });
  }
  const status = linkStatus(link);
  return NextResponse.json({
    label: link.label,
    planType: link.planType,
    durationDays: link.durationDays,
    usesRemaining: Math.max(0, link.maxUses - link.usedCount),
    status,
  });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to claim this gift." }, { status: 401 });
  }
  const userId = session.user.id;

  const { token } = await params;
  const link = await resolveToken(token);
  if (!link) {
    return NextResponse.json({ error: "Gift link not found." }, { status: 404 });
  }

  const status = linkStatus(link);
  if (status !== "valid") {
    const messages: Record<string, string> = {
      revoked: "This gift link has been revoked.",
      expired: "This gift link has expired.",
      exhausted: "This gift link has reached its maximum number of uses.",
    };
    return NextResponse.json({ error: messages[status] }, { status: 410 });
  }

  // Check if this user already redeemed this specific link
  const [existing] = await db
    .select()
    .from(giftRedemptions)
    .where(and(eq(giftRedemptions.giftLinkId, link.id), eq(giftRedemptions.userId, userId)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "You have already claimed this gift link." }, { status: 409 });
  }

  // Determine subscription period end
  const currentPeriodEnd =
    link.durationDays
      ? new Date(Date.now() + link.durationDays * 24 * 60 * 60 * 1000)
      : link.planType === "lifetime"
      ? null
      : null; // permanent pro — no expiry tracked

  // Record redemption and grant Pro
  try {
    // Record redemption
    await db.insert(giftRedemptions).values({ giftLinkId: link.id, userId });

    // Increment use count
    await db
      .update(giftLinks)
      .set({ usedCount: link.usedCount + 1 })
      .where(eq(giftLinks.id, link.id));

    // Grant Pro / Lifetime
    await db
      .insert(subscriptions)
      .values({
        userId,
        plan: link.planType,
        status: "active",
        currentPeriodEnd: currentPeriodEnd ?? null,
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          plan: link.planType,
          status: "active",
          currentPeriodEnd: currentPeriodEnd ?? null,
          updatedAt: new Date(),
        },
      });
  } catch (err: any) {
    console.error("Gift redemption error:", err);
    return NextResponse.json({ error: "Failed to redeem gift. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, plan: link.planType });
}
