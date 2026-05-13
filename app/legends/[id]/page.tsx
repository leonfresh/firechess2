import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ghostGames } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { LegendsBoard } from "@/components/legends-board";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const rows = await db
    .select({
      whiteName: ghostGames.whiteName,
      blackName: ghostGames.blackName,
      missionTitle: ghostGames.missionTitle,
      missionContext: ghostGames.missionContext,
      tournament: ghostGames.tournament,
      eventDate: ghostGames.eventDate,
    })
    .from(ghostGames)
    .where(eq(ghostGames.id, id));

  if (rows.length === 0) return { title: "Legends | FireChess" };

  const g = rows[0];
  return {
    title: `${g.missionTitle} — Legends | FireChess`,
    description: g.missionContext.slice(0, 155),
    openGraph: {
      images: [
        {
          url: `/api/legends/share-card?whiteName=${encodeURIComponent(g.whiteName)}&blackName=${encodeURIComponent(g.blackName)}&tournament=${encodeURIComponent(g.tournament)}&eventDate=${encodeURIComponent(g.eventDate)}&syncRate=0&cookFound=0&playAs=white`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function LegendsSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rows = await db
    .select({
      id: ghostGames.id,
      whiteName: ghostGames.whiteName,
      blackName: ghostGames.blackName,
      whiteElo: ghostGames.whiteElo,
      blackElo: ghostGames.blackElo,
      tournament: ghostGames.tournament,
      eventDate: ghostGames.eventDate,
      result: ghostGames.result,
      eco: ghostGames.eco,
      openingName: ghostGames.openingName,
      moves: ghostGames.moves,
      playAs: ghostGames.playAs,
      startPly: ghostGames.startPly,
      endPly: ghostGames.endPly,
      missionTitle: ghostGames.missionTitle,
      missionContext: ghostGames.missionContext,
      missionObjective: ghostGames.missionObjective,
      difficulty: ghostGames.difficulty,
      tags: ghostGames.tags,
      featured: ghostGames.featured,
      cookCandidates: ghostGames.cookCandidates,
      sourceUrl: ghostGames.sourceUrl,
    })
    .from(ghostGames)
    .where(eq(ghostGames.id, id));

  if (rows.length === 0) notFound();

  return <LegendsBoard game={rows[0]} />;
}
