/**
 * GET  /api/admin/users?q=search — search users by name/email (admin only).
 * PATCH /api/admin/users — grant or revoke Pro for a user (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/schema";
import { eq, or, ilike, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const pattern = `%${q}%`;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      plan: subscriptions.plan,
      status: subscriptions.status,
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .where(or(ilike(users.name, pattern), ilike(users.email, pattern)))
    .limit(20);

  return NextResponse.json({
    users: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      plan: r.plan ?? "free",
      status: r.status ?? "active",
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, plan } = body as { userId?: string; plan?: string };

  if (!userId || !plan || !["free", "pro", "lifetime"].includes(plan)) {
    return NextResponse.json(
      { error: "userId and plan (free | pro | lifetime) are required" },
      { status: 400 }
    );
  }

  // Upsert the subscription row
  await db
    .insert(subscriptions)
    .values({
      userId,
      plan: plan as "free" | "pro" | "lifetime",
      status: "active",
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        plan: plan as "free" | "pro" | "lifetime",
        status: "active",
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true, userId, plan });
}
