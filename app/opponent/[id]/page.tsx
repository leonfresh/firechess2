import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import OpponentBattleCard from "@/components/opponent-battle-card";

export const dynamic = "force-static";
export const revalidate = false;

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

  if (!scan) notFound();

  return <OpponentBattleCard id={id} />;
}
