import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { ghostGames } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legends — Play as Chess Greats | FireChess",
  description:
    "Step into the shoes of Fischer, Kasparov, Tal, and more. Play critical moments from legendary games and see how well you sync with history's greatest minds.",
};

// ── Server-side data fetch ──────────────────────────────────────────

async function getGames(difficulty?: string, featured?: boolean) {
  const conditions = [];
  if (
    difficulty &&
    ["beginner", "intermediate", "expert"].includes(difficulty)
  ) {
    conditions.push(
      eq(
        ghostGames.difficulty,
        difficulty as "beginner" | "intermediate" | "expert",
      ),
    );
  }
  if (featured) conditions.push(eq(ghostGames.featured, true));

  return db
    .select({
      id: ghostGames.id,
      whiteName: ghostGames.whiteName,
      blackName: ghostGames.blackName,
      tournament: ghostGames.tournament,
      eventDate: ghostGames.eventDate,
      result: ghostGames.result,
      openingName: ghostGames.openingName,
      eco: ghostGames.eco,
      playAs: ghostGames.playAs,
      startPly: ghostGames.startPly,
      endPly: ghostGames.endPly,
      missionTitle: ghostGames.missionTitle,
      missionContext: ghostGames.missionContext,
      difficulty: ghostGames.difficulty,
      tags: ghostGames.tags,
      featured: ghostGames.featured,
    })
    .from(ghostGames)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(ghostGames.featured, ghostGames.createdAt);
}

// ── Difficulty badge ─────────────────────────────────────────────────

function DifficultyBadge({ d }: { d: string }) {
  const styles: Record<string, string> = {
    beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    expert: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${styles[d] ?? styles.beginner}`}
    >
      {d.charAt(0).toUpperCase() + d.slice(1)}
    </span>
  );
}

// ── Mission card ─────────────────────────────────────────────────────

function MissionCard({
  game,
}: {
  game: Awaited<ReturnType<typeof getGames>>[number];
}) {
  const gmName = game.playAs === "white" ? game.whiteName : game.blackName;
  const year = game.eventDate?.slice(0, 4);
  const moveCount = game.endPly - game.startPly + 1;

  return (
    <Link
      href={`/legends/${game.id}`}
      className="group block bg-slate-900 border border-white/[0.07] rounded-2xl overflow-hidden hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-900/20 transition-all duration-200"
    >
      {/* Color band */}
      <div
        className={`h-1 w-full ${
          game.featured
            ? "bg-gradient-to-r from-violet-600 to-blue-500"
            : "bg-gradient-to-r from-slate-700 to-slate-600"
        }`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">👻</span>
              {game.featured && (
                <span className="text-xs text-yellow-400 font-semibold">
                  ⭐ Featured
                </span>
              )}
            </div>
            <h3 className="text-white font-bold text-base leading-tight group-hover:text-violet-300 transition-colors">
              {game.missionTitle}
            </h3>
          </div>
          <DifficultyBadge d={game.difficulty} />
        </div>

        {/* Players */}
        <div className="text-sm text-slate-300 mb-1">
          <span className="font-semibold text-white">{game.whiteName}</span>
          <span className="text-slate-500 mx-1">vs</span>
          <span className="font-semibold text-white">{game.blackName}</span>
        </div>

        <div className="text-xs text-slate-500 mb-3">
          {game.tournament}
          {year && ` · ${year}`}
          {game.openingName && (
            <>
              {" · "}
              <span className="text-slate-400">{game.openingName}</span>
            </>
          )}
        </div>

        {/* Context preview */}
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
          {game.missionContext}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Play as{" "}
            <span className="text-slate-300 font-semibold">{gmName}</span>{" "}
            <span className="text-slate-600">({game.playAs})</span>
          </span>
          <span className="text-slate-600">{moveCount} moves</span>
        </div>
      </div>

      {/* Arrow hint */}
      <div className="px-5 pb-4 text-right">
        <span className="text-violet-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          Start Mission →
        </span>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default async function LegendsPage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string; featured?: string }>;
}) {
  const sp = await searchParams;
  const difficulty = sp.difficulty;
  const featuredOnly = sp.featured === "1";

  const games = await getGames(difficulty, featuredOnly);
  const featured = games.filter((g) => g.featured);
  const rest = games.filter((g) => !g.featured);

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center relative">
          <div className="text-5xl mb-4">�</div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Legends
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Play as chess legends at the exact moments that made history. Can
            you match the moves that defined the game?
          </p>

          {/* Filters */}
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <Link
              href="/legends"
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                !difficulty && !featuredOnly
                  ? "bg-violet-600 text-white border-violet-600"
                  : "text-slate-400 border-white/[0.1] hover:border-white/[0.2]"
              }`}
            >
              All Missions
            </Link>
            <Link
              href="/legends?featured=1"
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                featuredOnly
                  ? "bg-yellow-500 text-black border-yellow-500"
                  : "text-slate-400 border-white/[0.1] hover:border-white/[0.2]"
              }`}
            >
              ⭐ Featured
            </Link>
            {["beginner", "intermediate", "expert"].map((d) => (
              <Link
                key={d}
                href={`/legends?difficulty=${d}`}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                  difficulty === d
                    ? "bg-white/10 text-white border-white/30"
                    : "text-slate-400 border-white/[0.1] hover:border-white/[0.2]"
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {games.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            No missions found. Check back soon!
          </div>
        ) : (
          <>
            {featured.length > 0 && !difficulty && !featuredOnly && (
              <section className="mb-12">
                <h2 className="text-slate-300 text-sm font-bold uppercase tracking-widest mb-5">
                  ⭐ Featured Missions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((g) => (
                    <MissionCard key={g.id} game={g} />
                  ))}
                </div>
              </section>
            )}

            {(rest.length > 0 || difficulty || featuredOnly) && (
              <section>
                {!difficulty && !featuredOnly && rest.length > 0 && (
                  <h2 className="text-slate-300 text-sm font-bold uppercase tracking-widest mb-5">
                    All Missions
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(difficulty || featuredOnly ? games : rest).map((g) => (
                    <MissionCard key={g.id} game={g} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
