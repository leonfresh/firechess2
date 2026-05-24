/**
 * POST   /api/reports — Save an analysis report (with dedup via contentHash).
 * GET    /api/reports — Fetch all reports for the authenticated user.
 * DELETE /api/reports — Delete a report by id (query param).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports, scanSessions } from "@/lib/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

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

  if (rows.length === 0) {
    return NextResponse.json({ reports: [] });
  }

  const linkedSessions = await db
    .select({
      id: scanSessions.id,
      savedReportId: scanSessions.savedReportId,
    })
    .from(scanSessions)
    .where(
      inArray(
        scanSessions.savedReportId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(desc(scanSessions.updatedAt), desc(scanSessions.createdAt));

  const scanSessionIdByReportId = new Map<string, string>();
  for (const sessionRow of linkedSessions) {
    if (
      !sessionRow.savedReportId ||
      scanSessionIdByReportId.has(sessionRow.savedReportId)
    ) {
      continue;
    }
    scanSessionIdByReportId.set(sessionRow.savedReportId, sessionRow.id);
  }

  return NextResponse.json({
    reports: rows.map((row) => ({
      ...row,
      scanSessionId: scanSessionIdByReportId.get(row.id) ?? null,
    })),
  });
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
    oneOffMistakes,
    missedTactics,
    diagnostics,
    reportMeta,
    mentalStats,
    timeManagement,
    contentHash,
    playerRating,
  } = body;

  if (!chessUsername || !source) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  // Dedup: check if a report with the same hash exists for this user.
  // If found, refresh its computed fields so re-saves after formula updates
  // always reflect the latest stats.
  if (contentHash) {
    const [dup] = await db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.userId, session.user.id),
          eq(reports.contentHash, contentHash),
        ),
      )
      .limit(1);

    if (dup) {
      // Recompute firechessScore with the freshly-supplied values
      const accDup =
        typeof estimatedAccuracy === "number" ? estimatedAccuracy : 50;
      const lcDup = leaks?.length ?? 0;
      const tcDup = missedTactics?.length ?? 0;
      const gaDup = gamesAnalyzed ?? 0;
      const cplDup = typeof weightedCpLoss === "number" ? weightedCpLoss : 50;
      const rawScoreDup =
        accDup * 8 -
        cplDup * 2 -
        lcDup * 3 -
        tcDup * 4 +
        Math.min(gaDup, 50) * 0.5;
      const firechessScoreDup =
        Math.round(Math.max(0, Math.min(1000, rawScoreDup)) * 10) / 10;

      await db
        .update(reports)
        .set({
          chessUsername,
          source,
          scanMode: scanMode ?? "both",
          gamesAnalyzed: gamesAnalyzed ?? 0,
          maxGames: maxGames ?? null,
          maxMoves: maxMoves ?? null,
          cpThreshold: cpThreshold ?? null,
          engineDepth: engineDepth ?? null,
          reportMeta: reportMeta ?? null,
          estimatedAccuracy,
          estimatedRating,
          weightedCpLoss,
          severeLeakRate,
          repeatedPositions: repeatedPositions ?? 0,
          leakCount: lcDup,
          tacticsCount: tcDup,
          leaks: leaks ?? [],
          oneOffMistakes: oneOffMistakes ?? [],
          missedTactics: missedTactics ?? [],
          diagnostics: diagnostics ?? null,
          mentalStats: mentalStats ?? null,
          timeManagement: timeManagement ?? null,
          firechessScore: firechessScoreDup,
          playerRating: typeof playerRating === "number" ? playerRating : null,
        })
        .where(eq(reports.id, dup.id));

      return NextResponse.json({
        saved: false,
        reason: "duplicate",
        id: dup.id,
      });
    }
  }

  // Compute composite FireChess Score (0–1000)
  const acc = typeof estimatedAccuracy === "number" ? estimatedAccuracy : 50;
  const lc = leaks?.length ?? 0;
  const tc = missedTactics?.length ?? 0;
  const ga = gamesAnalyzed ?? 0;
  const cpl = typeof weightedCpLoss === "number" ? weightedCpLoss : 50;
  const rawScore = acc * 8 - cpl * 2 - lc * 3 - tc * 4 + Math.min(ga, 50) * 0.5;
  const firechessScore =
    Math.round(Math.max(0, Math.min(1000, rawScore)) * 10) / 10;

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
      oneOffMistakes: oneOffMistakes ?? [],
      missedTactics: missedTactics ?? [],
      diagnostics: diagnostics ?? null,
      mentalStats: mentalStats ?? null,
      timeManagement: timeManagement ?? null,
      contentHash: contentHash ?? null,
      firechessScore,
      playerRating: typeof playerRating === "number" ? playerRating : null,
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
    .where(and(eq(reports.id, id), eq(reports.userId, session.user.id)))
    .returning({ id: reports.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true, id: deleted[0].id });
}
