/**
 * GET  /api/admin/users?q=search — list/search users with full info (admin only).
 * PATCH /api/admin/users — grant or revoke Pro for a user (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, accounts, subscriptions, reports, sessions } from "@/lib/schema";
import { eq, or, ilike, sql, desc, count, max } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  // Build base query — all users or filtered
  const whereClause = q.length >= 2
    ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
    : undefined;

  // Main user data + subscription
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      plan: subscriptions.plan,
      subStatus: subscriptions.status,
      subCreatedAt: subscriptions.createdAt,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      stripeCustomerId: subscriptions.stripeCustomerId,
      weeklyDigest: subscriptions.weeklyDigest,
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .where(whereClause)
    .orderBy(desc(users.id))
    .limit(100);

  // Get login providers for each user
  const userIds = rows.map((r) => r.id);

  // Batch fetch: accounts (providers), report counts, latest session
  const [accountRows, reportRows, sessionRows] = await Promise.all([
    userIds.length > 0
      ? db
          .select({
            userId: accounts.userId,
            provider: accounts.provider,
            providerAccountId: accounts.providerAccountId,
          })
          .from(accounts)
          .where(sql`${accounts.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
      : [],
    userIds.length > 0
      ? db
          .select({
            userId: reports.userId,
            reportCount: count(reports.id),
            lastReport: max(reports.createdAt),
          })
          .from(reports)
          .where(sql`${reports.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(reports.userId)
      : [],
    userIds.length > 0
      ? db
          .select({
            userId: sessions.userId,
            latestExpiry: max(sessions.expires),
          })
          .from(sessions)
          .where(sql`${sessions.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(sessions.userId)
      : [],
  ]);

  // Build lookup maps
  const providersByUser = new Map<string, { provider: string; providerAccountId: string }[]>();
  for (const a of accountRows) {
    const list = providersByUser.get(a.userId) ?? [];
    list.push({ provider: a.provider, providerAccountId: a.providerAccountId });
    providersByUser.set(a.userId, list);
  }

  const reportsByUser = new Map<string, { count: number; lastReport: string | null }>();
  for (const r of reportRows) {
    reportsByUser.set(r.userId, {
      count: Number(r.reportCount),
      lastReport: r.lastReport ? new Date(r.lastReport).toISOString() : null,
    });
  }

  const sessionByUser = new Map<string, string | null>();
  for (const s of sessionRows) {
    sessionByUser.set(s.userId, s.latestExpiry ? new Date(s.latestExpiry).toISOString() : null);
  }

  const result = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    image: r.image,
    plan: r.plan ?? "free",
    subStatus: r.subStatus ?? "active",
    subCreatedAt: r.subCreatedAt ? new Date(r.subCreatedAt).toISOString() : null,
    currentPeriodEnd: r.currentPeriodEnd ? new Date(r.currentPeriodEnd).toISOString() : null,
    stripeCustomerId: r.stripeCustomerId,
    weeklyDigest: r.weeklyDigest ?? true,
    providers: providersByUser.get(r.id) ?? [],
    reportCount: reportsByUser.get(r.id)?.count ?? 0,
    lastReport: reportsByUser.get(r.id)?.lastReport ?? null,
    lastSession: sessionByUser.get(r.id) ?? null,
  }));

  return NextResponse.json({ users: result, total: result.length });
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
