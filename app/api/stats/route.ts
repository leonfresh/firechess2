/**
 * GET /api/stats — public aggregate site stats for social proof.
 * No auth required. Cached for 15 minutes at the edge.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions, reports } from "@/lib/schema";
import { count, gte, sql } from "drizzle-orm";

export const revalidate = 900; // 15 min ISR cache

export async function GET() {
  try {
    const now = new Date();
    const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [[{ totalUsers }], [{ activeUsers30d }], [{ totalReports }]] =
      await Promise.all([
        db.select({ totalUsers: count(users.id) }).from(users),
        db
          .select({
            activeUsers30d: sql<number>`COUNT(DISTINCT ${sessions.userId})`,
          })
          .from(sessions)
          .where(gte(sessions.expires, ago30d)),
        db.select({ totalReports: count(reports.id) }).from(reports),
      ]);

    return NextResponse.json(
      {
        totalUsers: Number(totalUsers),
        activeUsers30d: Number(activeUsers30d),
        totalReports: Number(totalReports),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { totalUsers: 0, activeUsers30d: 0, totalReports: 0 },
      { status: 500 },
    );
  }
}
