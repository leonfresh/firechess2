/**
 * GET /api/admin/chaos?days=30 — Chaos Chess growth, funnel, retention, economy and balance
 * metrics for the /admin/chaos dashboard (admin only, read-only). See lib/chaos-admin-stats.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { loadChaosAdminStats } from "@/lib/chaos-admin-stats";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const stats = await loadChaosAdminStats(
    async (text) => (await db.execute(sql.raw(text))).rows as Record<string, unknown>[],
    req.nextUrl.searchParams.get("days"),
  );
  return NextResponse.json(stats, { headers: { "Cache-Control": "private, no-store" } });
}
