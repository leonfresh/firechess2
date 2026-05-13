import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ScanSessionPage } from "@/components/scan-session-page";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { isExpiredScanSession } from "@/lib/scan-session";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [scan] = await db
    .select()
    .from(scanSessions)
    .where(eq(scanSessions.id, id))
    .limit(1);

  if (!scan || isExpiredScanSession(scan)) {
    notFound();
  }

  return (
    <ScanSessionPage
      initialScan={{
        id: scan.id,
        userId: scan.userId,
        chessUsername: scan.chessUsername,
        source: scan.source,
        scanMode: scan.scanMode,
        status: scan.status,
        config: scan.config,
        result: scan.result,
        reportMeta: scan.reportMeta,
        error: scan.error,
        savedReportId: scan.savedReportId,
        expiresAt: scan.expiresAt ? scan.expiresAt.toISOString() : null,
        createdAt: scan.createdAt ? scan.createdAt.toISOString() : null,
        updatedAt: scan.updatedAt ? scan.updatedAt.toISOString() : null,
      }}
    />
  );
}
