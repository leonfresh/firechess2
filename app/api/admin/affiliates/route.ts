/**
 * /api/admin/affiliates — Affiliate management (admin only).
 *
 * GET    — list all affiliates with aggregated stats
 * POST   — create a new affiliate
 * PATCH  — update an affiliate (toggle active, update commission/code/notes)
 * DELETE — permanently delete an affiliate and its referral records
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { affiliates, affiliateReferrals } from "@/lib/schema";
import { eq, sum, count, sql } from "drizzle-orm";

/* ── GET: list affiliates with stats ── */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Aggregate per affiliate
  const rows = await db
    .select({
      id: affiliates.id,
      name: affiliates.name,
      email: affiliates.email,
      stripePromoCodeId: affiliates.stripePromoCodeId,
      stripePromoCode: affiliates.stripePromoCode,
      commissionPct: affiliates.commissionPct,
      notes: affiliates.notes,
      active: affiliates.active,
      createdAt: affiliates.createdAt,
    })
    .from(affiliates)
    .orderBy(sql`${affiliates.createdAt} DESC`);

  // For each affiliate, fetch referral totals
  const statsRows = await db
    .select({
      affiliateId: affiliateReferrals.affiliateId,
      totalReferrals: count(affiliateReferrals.id),
      totalRevenueCents: sum(affiliateReferrals.amountCents),
      totalCommissionCents: sum(affiliateReferrals.commissionCents),
      unpaidCommissionCents: sql<number>`SUM(CASE WHEN ${affiliateReferrals.paid} = false THEN ${affiliateReferrals.commissionCents} ELSE 0 END)`,
    })
    .from(affiliateReferrals)
    .groupBy(affiliateReferrals.affiliateId);

  const statsMap = new Map(statsRows.map((s) => [s.affiliateId, s]));

  const result = rows.map((a) => {
    const s = statsMap.get(a.id);
    return {
      ...a,
      totalReferrals: Number(s?.totalReferrals ?? 0),
      totalRevenueCents: Number(s?.totalRevenueCents ?? 0),
      totalCommissionCents: Number(s?.totalCommissionCents ?? 0),
      unpaidCommissionCents: Number(s?.unpaidCommissionCents ?? 0),
    };
  });

  return NextResponse.json({ affiliates: result });
}

/* ── POST: create affiliate ── */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, stripePromoCodeId, stripePromoCode, commissionPct, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [created] = await db
    .insert(affiliates)
    .values({
      name: name.trim(),
      email: email?.trim() || null,
      stripePromoCodeId: stripePromoCodeId?.trim() || null,
      stripePromoCode: stripePromoCode?.trim().toUpperCase() || null,
      commissionPct: Number(commissionPct) || 20,
      notes: notes?.trim() || null,
    })
    .returning();

  return NextResponse.json({ affiliate: created });
}

/* ── PATCH: update affiliate or mark referrals paid ── */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, action } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Mark all unpaid referrals for this affiliate as paid
  if (action === "mark_paid") {
    await db
      .update(affiliateReferrals)
      .set({ paid: true, paidAt: new Date() })
      .where(eq(affiliateReferrals.affiliateId, id));
    return NextResponse.json({ ok: true });
  }

  const { name, email, stripePromoCodeId, stripePromoCode, commissionPct, notes, active } = body;

  await db
    .update(affiliates)
    .set({
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(email !== undefined ? { email: email?.trim() || null } : {}),
      ...(stripePromoCodeId !== undefined ? { stripePromoCodeId: stripePromoCodeId?.trim() || null } : {}),
      ...(stripePromoCode !== undefined ? { stripePromoCode: stripePromoCode?.trim().toUpperCase() || null } : {}),
      ...(commissionPct !== undefined ? { commissionPct: Number(commissionPct) } : {}),
      ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
      ...(active !== undefined ? { active: Boolean(active) } : {}),
    })
    .where(eq(affiliates.id, id));

  return NextResponse.json({ ok: true });
}

/* ── DELETE: remove affiliate ── */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.delete(affiliates).where(eq(affiliates.id, id));
  return NextResponse.json({ ok: true });
}
