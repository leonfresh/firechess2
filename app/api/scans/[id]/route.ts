import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import {
  computeScanReportMeta,
  isExpiredScanSession,
  type ComputedScanReport,
  type PublicScanSessionPayload,
  type ScanSessionStatus,
} from "@/lib/scan-session";
import type { AnalyzeResponse } from "@/lib/types";

type ScanSessionRow = typeof scanSessions.$inferSelect;

function toPayload(row: ScanSessionRow): PublicScanSessionPayload {
  return {
    id: row.id,
    userId: row.userId,
    chessUsername: row.chessUsername,
    source: row.source,
    scanMode: row.scanMode,
    status: row.status,
    config: row.config,
    result: row.result,
    reportMeta: row.reportMeta,
    error: row.error,
    savedReportId: row.savedReportId,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

async function canManageSession(
  row: ScanSessionRow,
  userId: string | null | undefined,
  ownerToken: string | null,
) {
  if (userId && row.userId === userId) return true;
  if (ownerToken && row.guestToken && ownerToken === row.guestToken)
    return true;
  if (userId && (await isAdmin(userId))) return true;
  return false;
}

async function getSessionOrNull(id: string) {
  const [row] = await db
    .select()
    .from(scanSessions)
    .where(eq(scanSessions.id, id))
    .limit(1);

  return row ?? null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const row = await getSessionOrNull(id);
    if (!row || isExpiredScanSession(row)) {
      return NextResponse.json({ error: "Scan not found." }, { status: 404 });
    }

    return NextResponse.json({ scan: toPayload(row) });
  } catch (error) {
    console.error("[scans GET]", error);
    return NextResponse.json(
      { error: "Failed to load scan session." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const ownerToken = req.headers.get("x-scan-owner-token");
    const { id } = await context.params;
    const row = await getSessionOrNull(id);

    if (!row || isExpiredScanSession(row)) {
      return NextResponse.json({ error: "Scan not found." }, { status: 404 });
    }

    if (!(await canManageSession(row, session?.user?.id, ownerToken))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as {
      status?: ScanSessionStatus;
      result?: AnalyzeResponse | null;
      reportMeta?: ComputedScanReport | null;
      error?: string | null;
      savedReportId?: string | null;
      clearExpiry?: boolean;
      regenerateReportMeta?: boolean;
    };

    const nextStatus = body.status;
    if (
      nextStatus !== undefined &&
      nextStatus !== "processing" &&
      nextStatus !== "ready" &&
      nextStatus !== "failed"
    ) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    // Admin-only: recompute title, summary and radar stats from stored result
    if (body.regenerateReportMeta) {
      const adminCheck = session?.user?.id
        ? await isAdmin(session.user.id)
        : false;
      if (!adminCheck) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const currentResult = row.result;
      if (!currentResult) {
        return NextResponse.json(
          { error: "No result stored — run the full scan first." },
          { status: 400 },
        );
      }
      const freshMeta = computeScanReportMeta(
        currentResult,
        row.config.cpThreshold,
      );
      if (!freshMeta) {
        return NextResponse.json(
          { error: "Not enough data to compute report meta." },
          { status: 400 },
        );
      }
      const [updated] = await db
        .update(scanSessions)
        .set({ reportMeta: freshMeta, updatedAt: new Date() })
        .where(eq(scanSessions.id, id))
        .returning();
      return NextResponse.json({ scan: toPayload(updated) });
    }

    const updates: Partial<typeof scanSessions.$inferInsert> & {
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (nextStatus !== undefined) updates.status = nextStatus;
    if (body.result !== undefined) updates.result = body.result;
    if (body.reportMeta !== undefined) updates.reportMeta = body.reportMeta;
    if (body.error !== undefined) updates.error = body.error;
    if (body.savedReportId !== undefined)
      updates.savedReportId = body.savedReportId;
    if (body.clearExpiry) updates.expiresAt = null;
    if (body.savedReportId && session?.user?.id) {
      updates.userId = session.user.id;
    }

    const [updated] = await db
      .update(scanSessions)
      .set(updates)
      .where(eq(scanSessions.id, id))
      .returning();

    return NextResponse.json({ scan: toPayload(updated) });
  } catch (error) {
    console.error("[scans PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update scan session." },
      { status: 500 },
    );
  }
}
