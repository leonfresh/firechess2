import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { isExpiredScanSession, type PublicScanSessionPayload } from "@/lib/scan-session";
import { SAMPLE_REPORTS } from "@/lib/sample-reports";
import { pickBestGame } from "@/lib/best-game";
import { BestGameView } from "./best-game-view";

const SAMPLE_REPORT_IDS = new Set(
  SAMPLE_REPORTS.map((r) => r.reportId).filter(Boolean),
);

export const dynamic = "force-dynamic";

export default async function BestGamePage({
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

  const payload: PublicScanSessionPayload = {
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
  };

  const bestGame = pickBestGame({
    username: scan.chessUsername,
    games: payload.result?.games,
    brilliantMoves: payload.result?.brilliantMoves,
    missedTactics: payload.result?.missedTactics,
    endgameMistakes: payload.result?.endgameMistakes,
  });

  if (!bestGame) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">No game data available</h1>
        <p className="mt-3 text-slate-400">
          This scan doesn&apos;t have detailed game data for the best-game feature.
          Re-run the scan to populate it.
        </p>
      </main>
    );
  }

  return (
    <BestGameView
      bestGame={bestGame}
      scanId={id}
      username={scan.chessUsername}
    />
  );
}
