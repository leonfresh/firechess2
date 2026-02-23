/**
 * POST   /api/reports — Save an analysis report (with dedup via contentHash).
 * GET    /api/reports — Fetch all reports for the authenticated user.
 * DELETE /api/reports — Delete a report by id (query param).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  GET  — list user reports                                           */
/* ------------------------------------------------------------------ */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.userId, session.user.id))
    .orderBy(desc(reports.createdAt));

  return NextResponse.json({ reports: rows });
}

/* ------------------------------------------------------------------ */
/*  POST — save a report (dedup)                                       */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    chessUsername,
    source,
    scanMode,
    gamesAnalyzed,
    maxGames,
    maxMoves,
    cpThreshold,
    engineDepth,
    estimatedAccuracy,
    estimatedRating,
    weightedCpLoss,
    severeLeakRate,
    repeatedPositions,
    leaks,
    missedTactics,
    diagnostics,
    reportMeta,
    contentHash,
  } = body;

  if (!chessUsername || !source) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Dedup: check if a report with the same hash exists for this user
  if (contentHash) {
    const [dup] = await db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.userId, session.user.id),
          eq(reports.contentHash, contentHash)
        )
      )
      .limit(1);

    if (dup) {
      return NextResponse.json({ saved: false, reason: "duplicate", id: dup.id });
    }
  }

  const [inserted] = await db
    .insert(reports)
    .values({
      userId: session.user.id,
      chessUsername,
      source,
      scanMode: scanMode ?? "both",
      gamesAnalyzed: gamesAnalyzed ?? 0,
      maxGames,
      maxMoves,
      cpThreshold,
      engineDepth,
      estimatedAccuracy,
      estimatedRating,
      weightedCpLoss,
      severeLeakRate,
      repeatedPositions: repeatedPositions ?? 0,
      leakCount: leaks?.length ?? 0,
      tacticsCount: missedTactics?.length ?? 0,
      reportMeta: reportMeta ?? null,
      leaks: leaks ?? [],
      missedTactics: missedTactics ?? [],
      diagnostics: diagnostics ?? null,
      contentHash: contentHash ?? null,
    })
    .returning({ id: reports.id });

  return NextResponse.json({ saved: true, id: inserted.id });
}

/* ------------------------------------------------------------------ */
/*  DELETE — remove a report by id                                     */
/* ------------------------------------------------------------------ */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }

  // Only delete if the report belongs to the authenticated user
  const deleted = await db
    .delete(reports)
    .where(
      and(
        eq(reports.id, id),
        eq(reports.userId, session.user.id)
      )
    )
    .returning({ id: reports.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true, id: deleted[0].id });
}
