/**
 * GET /api/percentile?accuracy=X&rating=Y
 *
 * Returns the user's percentile rank compared to all reports in the DB.
 * Data is fully anonymous — only aggregate counts are returned.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accuracy = parseFloat(searchParams.get("accuracy") ?? "");
  const rating = parseFloat(searchParams.get("rating") ?? "");

  if (isNaN(accuracy) && isNaN(rating)) {
    return NextResponse.json(
      { error: "Provide at least one of: accuracy, rating" },
      { status: 400 }
    );
  }

  const result: {
    accuracyPercentile?: number;
    ratingPercentile?: number;
    totalReports: number;
  } = { totalReports: 0 };

  // Count total reports with non-null values
  const [{ count: totalAcc }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reports)
    .where(sql`${reports.estimatedAccuracy} IS NOT NULL`);

  const [{ count: totalRat }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reports)
    .where(sql`${reports.estimatedRating} IS NOT NULL`);

  result.totalReports = Math.max(totalAcc, totalRat);

  // Accuracy percentile: % of reports with accuracy <= user's accuracy
  if (!isNaN(accuracy) && totalAcc > 0) {
    const [{ count: belowCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reports)
      .where(
        sql`${reports.estimatedAccuracy} IS NOT NULL AND ${reports.estimatedAccuracy} <= ${accuracy}`
      );

    result.accuracyPercentile = Math.round((belowCount / totalAcc) * 100);
  }

  // Rating percentile: % of reports with rating <= user's rating
  if (!isNaN(rating) && totalRat > 0) {
    const [{ count: belowCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reports)
      .where(
        sql`${reports.estimatedRating} IS NOT NULL AND ${reports.estimatedRating} <= ${rating}`
      );

    result.ratingPercentile = Math.round((belowCount / totalRat) * 100);
  }

  return NextResponse.json(result);
}
