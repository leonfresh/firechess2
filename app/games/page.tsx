import type { Metadata } from "next";
import Link from "next/link";
import { FAMOUS_GAMES } from "@/lib/famous-games";

export const metadata: Metadata = {
  title: "Famous Chess Games — The Greatest Games Ever Played",
  description:
    "Explore 25 of the most famous chess games in history — the Immortal Game, Opera Game, Game of the Century, Kasparov's Immortal, and more. Each with an interactive board and full analysis.",
  alternates: { canonical: "https://firechess.com/games" },
  openGraph: {
    title: "Famous Chess Games | FireChess",
    description:
      "25 of the greatest chess games ever played — interactive boards, full stories, tactical themes, and analysis. From Morphy to Carlsen.",
    url: "https://firechess.com/games",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Greatest Chess Games Ever Played | FireChess",
    description:
      "Interactive guides to 25 famous chess games — Immortal Game, Opera Game, Game of the Century, Kasparov's Immortal, and more.",
  },
};

const ERA_COLORS: Record<string, { badge: string; dot: string }> = {
  romantic: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
  },
  classical: {
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    dot: "bg-blue-400",
  },
  modern: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
  },
  contemporary: {
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    dot: "bg-purple-400",
  },
};

const ERA_ORDER = ["romantic", "classical", "modern", "contemporary"];

function JsonLd() {
  const base = "https://firechess.com";
  const url = `${base}/games`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: "Famous Chess Games",
        item: url,
      },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "The Greatest Chess Games Ever Played",
    description:
      "25 of the most famous and instructive games in chess history, with interactive boards and analysis.",
    url,
    numberOfItems: FAMOUS_GAMES.length,
    itemListElement: FAMOUS_GAMES.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.name,
      url: `${base}/games/${g.id}`,
      description: g.tagline,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </>
  );
}

export default function FamousGamesPage() {
  const byEra = ERA_ORDER.map((era) => ({
    era,
    games: FAMOUS_GAMES.filter((g) => g.era === era),
  })).filter((e) => e.games.length > 0);

  return (
    <>
      <JsonLd />
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="transition-colors hover:text-stone-300">
            Home
          </Link>
          <span>/</span>
          <span className="text-stone-300">Famous Games</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            The Greatest Chess Games Ever Played
          </h1>
          <p className="mt-3 max-w-2xl text-base text-stone-400">
            From Morphy&apos;s 1858 Opera masterpiece to Carlsen&apos;s 2016
            Championship clincher — {FAMOUS_GAMES.length} famous games, each
            with an interactive board, full story, and the tactical themes you
            can learn from them.
          </p>
        </header>

        {/* Games by era */}
        {byEra.map(({ era, games }) => {
          const colors = ERA_COLORS[era] ?? ERA_COLORS.modern;
          const eraLabel = era.charAt(0).toUpperCase() + era.slice(1);
          return (
            <section key={era} className="mb-12">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${colors.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                  {eraLabel} Era
                </span>
                <span className="text-xs text-stone-600">
                  {games.length} games
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {games.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all hover:border-orange-500/20 hover:bg-white/[0.04]"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h2 className="font-bold text-stone-200 group-hover:text-white text-sm leading-snug">
                        {game.name}
                      </h2>
                      <span className="shrink-0 text-xs text-stone-600 font-mono">
                        {game.year}
                      </span>
                    </div>

                    <p className="mb-3 text-xs text-stone-500">
                      {game.white} <span className="text-stone-700">vs</span>{" "}
                      {game.black}
                    </p>

                    <p className="text-xs leading-relaxed text-stone-400 line-clamp-2">
                      {game.tagline}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {game.tacticalThemes.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] capitalize text-stone-500"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <section className="rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.07] to-red-600/[0.04] p-6 text-center">
          <h2 className="text-lg font-bold text-white">
            Ready to find brilliancies in your own games?
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            FireChess scans your Lichess or Chess.com games for tactical
            patterns like the ones in these masterpieces — powered by
            Stockfish&nbsp;18.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-glow-sm transition-all hover:shadow-glow"
          >
            🔥 Analyze My Games Free
          </Link>
        </section>
      </div>
    </>
  );
}
