import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { isExpiredScanSession } from "@/lib/scan-session";
import OpponentBattleCard from "@/components/opponent-battle-card";

export default async function OpponentPage({
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

  if (!scan || isExpiredScanSession(scan)) notFound();

  const data = {
    id: scan.id,
    chessUsername: scan.chessUsername,
    status: scan.status,
    result: scan.result,
  };

  return <OpponentBattleCard data={data} />;
}
