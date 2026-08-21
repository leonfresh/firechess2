import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { computeScanReportMeta } from "@/lib/scan-session";
import { SAMPLE_REPORTS } from "@/lib/sample-reports";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/admin/refresh-samples
 *
 * Recomputes reportMeta (accuracy, rating, labels) for all curated sample
 * reports from their stored results — uses the leaks-based fallback, so no
 * diagnostics are needed. Keeps the famous players' numbers current after
 * formula changes (e.g. the Aug 2026 accuracy fix).
 *
 * Auth: admin session (open the URL in a logged-in admin browser), or
 * Bearer CRON_SECRET (Vercel cron — registered in vercel.json).
 */

type RefreshResult = {
  id: string;
  username: string;
  accuracy: number;
  rating: number;
};

async function runRefresh(): Promise<RefreshResult[]> {
  const ids = SAMPLE_REPORTS.map((r) => r.reportId).filter(
    Boolean,
  ) as string[];
  if (ids.length === 0) return [];

  const rows = await db
    .select()
    .from(scanSessions)
    .where(inArray(scanSessions.id, ids));

  const refreshed: RefreshResult[] = [];
  for (const row of rows) {
    if (!row.result) continue;
    const fresh = computeScanReportMeta(row.result, row.config.cpThreshold);
    if (!fresh) continue;
    await db
      .update(scanSessions)
      .set({ reportMeta: fresh, updatedAt: new Date() })
      .where(eq(scanSessions.id, row.id));
    refreshed.push({
      id: row.id,
      username: row.chessUsername,
      accuracy: fresh.estimatedAccuracy,
      rating: fresh.estimatedRating,
    });
  }
  return refreshed;
}

async function handle(req: NextRequest) {
  const session = await auth();
  const adminCheck = session?.user?.id
    ? await isAdmin(session.user.id)
    : false;
  const secret = process.env.CRON_SECRET;
  const cronOk =
    !!secret && req.headers.get("authorization") === `Bearer ${secret}`;

  if (!adminCheck && !cronOk) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = await runRefresh();
  return NextResponse.json({ refreshed: results.length, results });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
