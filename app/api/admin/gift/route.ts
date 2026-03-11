/**
 * Admin API for gift links.
 *
 * GET    /api/admin/gift — list all gift links with redemption stats
 * POST   /api/admin/gift — create a new gift link
 * PATCH  /api/admin/gift — revoke a gift link
 * DELETE /api/admin/gift — delete a gift link
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { giftLinks } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

function generateToken(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all gift links with redemption count joined
  const rows = await db
    .select({
      id: giftLinks.id,
      label: giftLinks.label,
      token: giftLinks.token,
      maxUses: giftLinks.maxUses,
      usedCount: giftLinks.usedCount,
      planType: giftLinks.planType,
      durationDays: giftLinks.durationDays,
      expiresAt: giftLinks.expiresAt,
      revokedAt: giftLinks.revokedAt,
      createdAt: giftLinks.createdAt,
    })
    .from(giftLinks)
    .orderBy(sql`${giftLinks.createdAt} desc`);

  return NextResponse.json({ giftLinks: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { label, maxUses, planType, durationDays, expiresAt } = body;

  if (!label?.trim()) {
    return NextResponse.json({ error: "Label is required." }, { status: 400 });
  }

  const token = generateToken();

  const [created] = await db
    .insert(giftLinks)
    .values({
      label: label.trim(),
      token,
      maxUses: maxUses ?? 50,
      planType: planType ?? "pro",
      durationDays: durationDays ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  return NextResponse.json({ giftLink: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, action } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (action === "revoke") {
    await db
      .update(giftLinks)
      .set({ revokedAt: new Date() })
      .where(eq(giftLinks.id, id));
    return NextResponse.json({ success: true });
  }

  if (action === "unrevoke") {
    await db
      .update(giftLinks)
      .set({ revokedAt: null })
      .where(eq(giftLinks.id, id));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.delete(giftLinks).where(eq(giftLinks.id, id));
  return NextResponse.json({ success: true });
}
