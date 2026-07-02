import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { ScanSessionPage } from "@/components/scan-session-page";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { isExpiredScanSession } from "@/lib/scan-session";
import { SAMPLE_REPORTS } from "@/lib/sample-reports";

const SAMPLE_REPORT_IDS = new Set(
  SAMPLE_REPORTS.map((r) => r.reportId).filter(Boolean),
);

export const dynamic = "force-dynamic";

/* ── Rich per-report metadata for SEO ── */
function scanMetaDescription(scan: {
  chessUsername: string;
  scanMode: string;
  result: { gamesAnalyzed?: number; repeatedPositions?: number } | null;
  reportMeta: { vibeTitle?: string; estimatedRating?: number; topTag?: string } | null;
}): string {
  const username = scan.chessUsername;
  const modeStr =
    scan.scanMode === "openings"
      ? "opening leaks"
      : scan.scanMode === "tactics"
        ? "missed tactics"
        : scan.scanMode === "endgames"
          ? "endgame blunders"
          : "chess weaknesses";

  const games = scan.result?.gamesAnalyzed ?? 0;
  const leaks = scan.result?.repeatedPositions ?? 0;
  const vibe = scan.reportMeta?.vibeTitle;
  const rating = scan.reportMeta?.estimatedRating;

  const parts: string[] = [];
  if (vibe) parts.push(`"${vibe}"`);
  if (games > 0) parts.push(`${games} games analyzed`);
  if (leaks > 0) parts.push(`${leaks} repeated openings found`);
  if (rating) parts.push(`estimated rating: ~${rating}`);
  parts.push(`powered by Stockfish 18`);

  return `${username}'s chess analysis report — ${parts.join(" · ")}. Free scan of ${modeStr}.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const [scan] = await db
    .select()
    .from(scanSessions)
    .where(eq(scanSessions.id, id))
    .limit(1);

  if (!scan || (!SAMPLE_REPORT_IDS.has(id) && isExpiredScanSession(scan))) {
    return {};
  }

  const username = scan.chessUsername;
  const title = `${username}'s Chess Analysis Report | FireChess`;
  const description = scanMetaDescription(scan);

  // Indexable if: (a) it's a curated sample report, or (b) the user explicitly saved it
  const shouldIndex = SAMPLE_REPORT_IDS.has(id) || Boolean(scan.savedReportId);

  return {
    title,
    description,
    openGraph: {
      title: `${username}'s Chess Analysis — ${scan.reportMeta?.vibeTitle ?? "Full Report"} | FireChess`,
      description,
      url: `https://firechess.com/report/${id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${username}'s Chess Report`,
      description,
    },
    alternates: { canonical: `https://firechess.com/report/${id}` },
    robots: {
      index: shouldIndex,
      follow: true,
    },
  };
}

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

  if (!scan || (!SAMPLE_REPORT_IDS.has(id) && isExpiredScanSession(scan))) {
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
