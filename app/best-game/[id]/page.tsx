import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { isExpiredScanSession, type PublicScanSessionPayload } from "@/lib/scan-session";
import { SAMPLE_REPORTS } from "@/lib/sample-reports";
import { BestGameView } from "./best-game-view";

const SAMPLE_REPORT_IDS = new Set(
  SAMPLE_REPORTS.map((r) => r.reportId).filter(Boolean),
);

export const dynamic = "force-dynamic";

function pickBestGame(scan: PublicScanSessionPayload) {
  const result = scan.result;
  if (!result) return null;

  const brilliants = result.brilliantMoves ?? [];
  const tactics = result.missedTactics;
  const endgames = result.endgameMistakes;
  const games = result.games ?? [];

  if (games.length === 0) return null;

  // Score each game: +3 per brilliant move, -1 per missed tactic or endgame error
  const scores = new Map<number, number>();
  const brilliantPerGame = new Map<number, number>();

  for (let i = 0; i < games.length; i++) {
    scores.set(i, 0);
    brilliantPerGame.set(i, 0);
  }

  for (const b of brilliants) {
    const idx = b.gameIndex;
    scores.set(idx, (scores.get(idx) ?? 0) + 3);
    brilliantPerGame.set(idx, (brilliantPerGame.get(idx) ?? 0) + 1);
  }

  for (const t of tactics) {
    const idx = t.gameIndex;
    scores.set(idx, (scores.get(idx) ?? 0) - 1);
  }

  for (const e of endgames) {
    const idx = e.gameIndex;
    scores.set(idx, (scores.get(idx) ?? 0) - 1);
  }

  // Best game = highest score, tie-break on brilliant moves
  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < games.length; i++) {
    const score = scores.get(i) ?? 0;
    const brills = brilliantPerGame.get(i) ?? 0;
    if (score > bestScore || (score === bestScore && brills > (brilliantPerGame.get(bestIdx) ?? 0))) {
      bestScore = score;
      bestIdx = i;
    }
  }

  const game = games[bestIdx];
  return {
    index: bestIdx,
    ...game,
    brilliantCount: brilliantPerGame.get(bestIdx) ?? 0,
    totalScore: bestScore,
  };
}

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

  const bestGame = pickBestGame(payload);

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
