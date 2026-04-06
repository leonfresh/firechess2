/**
 * GET  /api/admin/users?q=search — list/search users with full info (admin only).
 * PATCH /api/admin/users — grant or revoke Pro for a user (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  subscriptions,
  reports,
  sessions,
  studyPlans,
  userCoins,
} from "@/lib/schema";
import { eq, or, ilike, sql, desc, count, max, sum } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const PAGE_SIZE = 100;
  const offset = Math.max(
    0,
    parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10) || 0,
  );

  // Build base query — all users or filtered
  const whereClause =
    q.length >= 2
      ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
      : undefined;

  // Get real total count
  const [{ total }] = await db
    .select({ total: count(users.id) })
    .from(users)
    .where(whereClause);

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
    .limit(PAGE_SIZE)
    .offset(offset);

  // Get login providers for each user
  const userIds = rows.map((r) => r.id);

  // Batch fetch: accounts (providers), report counts, latest session, study stats
  const [accountRows, reportRows, sessionRows, studyRows, coinRows] =
    await Promise.all([
      userIds.length > 0
        ? db
            .select({
              userId: accounts.userId,
              provider: accounts.provider,
              providerAccountId: accounts.providerAccountId,
            })
            .from(accounts)
            .where(
              sql`${accounts.userId} IN (${sql.join(
                userIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            )
        : [],
      userIds.length > 0
        ? db
            .select({
              userId: reports.userId,
              reportCount: count(reports.id),
              lastReport: max(reports.createdAt),
              totalGames: sum(reports.gamesAnalyzed),
            })
            .from(reports)
            .where(
              sql`${reports.userId} IN (${sql.join(
                userIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            )
            .groupBy(reports.userId)
        : [],
      userIds.length > 0
        ? db
            .select({
              userId: sessions.userId,
              latestExpiry: max(sessions.expires),
            })
            .from(sessions)
            .where(
              sql`${sessions.userId} IN (${sql.join(
                userIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            )
            .groupBy(sessions.userId)
        : [],
      userIds.length > 0
        ? db
            .select({
              userId: studyPlans.userId,
              planCount: count(studyPlans.id),
              currentStreak: max(studyPlans.currentStreak),
              longestStreak: max(studyPlans.longestStreak),
              totalProgress: sum(studyPlans.progress),
            })
            .from(studyPlans)
            .where(
              sql`${studyPlans.userId} IN (${sql.join(
                userIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            )
            .groupBy(studyPlans.userId)
        : [],
      userIds.length > 0
        ? db
            .select({
              userId: userCoins.userId,
              balance: userCoins.balance,
            })
            .from(userCoins)
            .where(
              sql`${userCoins.userId} IN (${sql.join(
                userIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            )
        : [],
    ]);

  // Build lookup maps
  const providersByUser = new Map<
    string,
    { provider: string; providerAccountId: string }[]
  >();
  for (const a of accountRows) {
    const list = providersByUser.get(a.userId) ?? [];
    list.push({ provider: a.provider, providerAccountId: a.providerAccountId });
    providersByUser.set(a.userId, list);
  }

  const reportsByUser = new Map<
    string,
    { count: number; lastReport: string | null; totalGames: number }
  >();
  for (const r of reportRows) {
    reportsByUser.set(r.userId, {
      count: Number(r.reportCount),
      lastReport: r.lastReport ? new Date(r.lastReport).toISOString() : null,
      totalGames: Number(r.totalGames ?? 0),
    });
  }

  const sessionByUser = new Map<string, string | null>();
  for (const s of sessionRows) {
    sessionByUser.set(
      s.userId,
      s.latestExpiry ? new Date(s.latestExpiry).toISOString() : null,
    );
  }

  const coinsByUser = new Map<string, number>();
  for (const c of coinRows) {
    coinsByUser.set(c.userId, Number(c.balance ?? 0));
  }

  const studyByUser = new Map<
    string,
    {
      planCount: number;
      currentStreak: number;
      longestStreak: number;
      avgProgress: number;
    }
  >();
  for (const s of studyRows) {
    const pc = Number(s.planCount) || 1;
    studyByUser.set(s.userId, {
      planCount: pc,
      currentStreak: Number(s.currentStreak ?? 0),
      longestStreak: Number(s.longestStreak ?? 0),
      avgProgress: Math.round(Number(s.totalProgress ?? 0) / pc),
    });
  }

  const result = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    image: r.image,
    plan: r.plan ?? "free",
    subStatus: r.subStatus ?? "active",
    subCreatedAt: r.subCreatedAt
      ? new Date(r.subCreatedAt).toISOString()
      : null,
    currentPeriodEnd: r.currentPeriodEnd
      ? new Date(r.currentPeriodEnd).toISOString()
      : null,
    stripeCustomerId: r.stripeCustomerId,
    weeklyDigest: r.weeklyDigest ?? true,
    providers: providersByUser.get(r.id) ?? [],
    reportCount: reportsByUser.get(r.id)?.count ?? 0,
    totalGamesAnalyzed: reportsByUser.get(r.id)?.totalGames ?? 0,
    lastReport: reportsByUser.get(r.id)?.lastReport ?? null,
    lastSession: sessionByUser.get(r.id) ?? null,
    studyPlans: studyByUser.get(r.id)?.planCount ?? 0,
    currentStreak: studyByUser.get(r.id)?.currentStreak ?? 0,
    longestStreak: studyByUser.get(r.id)?.longestStreak ?? 0,
    avgStudyProgress: studyByUser.get(r.id)?.avgProgress ?? 0,
    coins: coinsByUser.get(r.id) ?? 0,
  }));

  return NextResponse.json({ users: result, total: Number(total) });
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
      { status: 400 },
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

/**
 * POST /api/admin/users — Grant 1 month of Pro to a user (admin only).
 * Sets plan=pro, status=active, currentPeriodEnd = now + 30 days.
 * If already pro, extends from the later of now or the current period end.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId } = body as { userId?: string };

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Fetch current sub to know if we should extend from current period end
  const [existing] = await db
    .select({ currentPeriodEnd: subscriptions.currentPeriodEnd })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const base =
    existing?.currentPeriodEnd && existing.currentPeriodEnd > new Date()
      ? existing.currentPeriodEnd
      : new Date();

  const newPeriodEnd = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db
    .insert(subscriptions)
    .values({
      userId,
      plan: "pro",
      status: "active",
      currentPeriodEnd: newPeriodEnd,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        plan: "pro",
        status: "active",
        currentPeriodEnd: newPeriodEnd,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({
    ok: true,
    userId,
    plan: "pro",
    currentPeriodEnd: newPeriodEnd.toISOString(),
  });
}

/**
 * PUT /api/admin/users — Grant coins to a user (admin only).
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, coins } = body as { userId?: string; coins?: number };

  if (!userId || typeof coins !== "number" || coins < 1 || coins > 10000) {
    return NextResponse.json(
      { error: "userId and coins (1–10000) are required" },
      { status: 400 },
    );
  }

  // Upsert: add coins to the user's balance
  const result = await db
    .insert(userCoins)
    .values({ userId, balance: coins })
    .onConflictDoUpdate({
      target: userCoins.userId,
      set: {
        balance: sql`${userCoins.balance} + ${coins}`,
      },
    })
    .returning({ balance: userCoins.balance });

  const newBalance = Number(result[0]?.balance ?? coins);

  return NextResponse.json({ ok: true, userId, granted: coins, newBalance });
}
