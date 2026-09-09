import type { Metadata } from "next";
import { ModernReport } from "@/components/modern-preview/report";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isExpiredScanSession } from "@/lib/scan-session";
import { notFound, redirect } from "next/navigation";
import { SAMPLE_REPORTS } from "@/lib/sample-reports";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Report preview | FireChess",
  robots: { index: false, follow: false },
};

export default async function NewReportPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id = "8c8d499e-1f04-4121-aabc-71a818b98ce6" } = await searchParams;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const curated = SAMPLE_REPORTS.some(report => report.reportId === id);
  const [scan] = await db.select({ id: scanSessions.id, expiresAt: scanSessions.expiresAt, status: scanSessions.status, chessUsername: scanSessions.chessUsername, source: scanSessions.source, config: scanSessions.config, result: scanSessions.result, reportMeta: scanSessions.reportMeta }).from(scanSessions).where(eq(scanSessions.id, id)).limit(1);
  if (!scan || (!curated && isExpiredScanSession(scan))) notFound();
  if (scan.status !== "ready" || !scan.result) redirect(`/report/${id}`);
  const { expiresAt, status, ...preview } = scan;
  return <ModernReport key={id} scan={preview} />;
}
