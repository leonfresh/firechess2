import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FAMOUS_GAMES, type FamousGame } from "@/lib/famous-games";
import { BlogChessBoard } from "@/components/blog-chess-board";
import { GM_PROFILES } from "@/lib/gm-profiles";

export function generateStaticParams() {
  return FAMOUS_GAMES.map((g) => ({ slug: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = FAMOUS_GAMES.find((g) => g.id === slug);
  if (!game) return {};

  const title = `${game.name} (${game.year}) — ${game.white} vs ${game.black}`;
  const description = game.tagline;

  return {
    title,
    description,
    alternates: { canonical: `https://firechess.com/games/${game.id}` },
    openGraph: {
      title: `${game.name} | FireChess Famous Games`,
      description,
      url: `https://firechess.com/games/${game.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.name} (${game.year})`,
      description,
    },
  };
}

function GameJsonLd({ game }: { game: FamousGame }) {
  const base = "https://firechess.com";
  const url = `${base}/games/${game.id}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${game.name} — ${game.white} vs ${game.black} (${game.year})`,
    description: game.tagline,
    url,
    datePublished: `${game.year}-01-01`,
    author: { "@type": "Organization", name: "FireChess" },
    publisher: {
      "@type": "Organization",
      name: "FireChess",
      logo: { "@type": "ImageObject", url: `${base}/firechess-logo.png` },
    },
    about: {
      "@type": "Event",
      name: game.event,
      startDate: String(game.year),
      description: game.story,
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: "Famous Games",
        item: `${base}/games`,
      },
      { "@type": "ListItem", position: 3, name: game.name, item: url },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: game.faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  );
}

const ERA_COLORS: Record<string, string> = {
  romantic: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  classical: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  modern: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  contemporary: "border-purple-500/30 bg-purple-500/10 text-purple-400",
};

const RESULT_LABEL: Record<string, string> = {
  "1-0": "White wins",
  "0-1": "Black wins",
  "1/2-1/2": "Draw",
};

export default async function FamousGamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = FAMOUS_GAMES.find((g) => g.id === slug);
  if (!game) notFound();

  const related = FAMOUS_GAMES.filter(
    (g) => game.related.includes(g.id) && g.id !== game.id,
  ).slice(0, 3);

  const starGm = game.starPlayerSlug
    ? GM_PROFILES.find((gm) => gm.id === game.starPlayerSlug)
    : undefined;

  return (
    <>
      <GameJsonLd game={game} />

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="transition-colors hover:text-stone-300">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/games"
            className="transition-colors hover:text-stone-300"
          >
            Famous Games
          </Link>
          <span>/</span>
          <span className="text-stone-300">{game.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          {starGm?.imageUrl && (
            <div className="float-right ml-4 mb-2 hidden sm:block">
              <Link href={`/players/${starGm.id}`} className="group block">
                <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-white/10 transition-all group-hover:ring-white/30">
                  <Image
                    src={starGm.imageUrl}
                    alt={starGm.name}
                    fill
                    className="object-cover object-top"
                    sizes="80px"
                  />
                </div>
                <p className="mt-1.5 text-center text-[10px] text-stone-500 group-hover:text-stone-300">{starGm.name}</p>
              </Link>
            </div>
          )}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${ERA_COLORS[game.era] ?? "border-white/10 bg-white/[0.05] text-stone-400"}`}
            >
              {game.era}
            </span>
            <span className="rounded border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-stone-400">
              {game.year}
            </span>
            <span className="rounded border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-stone-400">
              {RESULT_LABEL[game.result] ?? game.result}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {game.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-400">
            <span className="text-white font-medium">{game.white}</span>
            <span className="text-stone-600">vs</span>
            <span className="text-white font-medium">{game.black}</span>
          </div>

          <p className="mt-1 text-xs text-stone-500">{game.event}</p>
          <p className="mt-3 text-base leading-relaxed text-stone-300">
            {game.tagline}
          </p>
        </header>

        {/* Interactive board */}
        <section className="mb-10">
          <BlogChessBoard
            fen={game.fen}
            moves={game.moves}
            orientation={game.orientation}
            caption={game.caption}
          />
        </section>

        {/* Story */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
            📖 The Story
          </h2>
          <p className="leading-relaxed text-stone-300">{game.story}</p>
        </section>

        {/* Key moment */}
        <section className="mb-10 rounded-2xl border border-orange-500/15 bg-orange-500/[0.05] p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-400">
            ⚡ Key Moment — Move {game.keyMoment.moveNumber}
          </h2>
          <p className="text-sm leading-relaxed text-stone-300">
            {game.keyMoment.description}
          </p>
        </section>

        {/* Tactical themes */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
            🎯 Tactical Themes
          </h2>
          <div className="flex flex-wrap gap-2">
            {game.tacticalThemes.map((theme) => (
              <span
                key={theme}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs capitalize text-stone-300"
              >
                {theme}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
            ❓ Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {game.faqs.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
              >
                <p className="mb-1.5 font-semibold text-stone-200">{q}</p>
                <p className="text-sm leading-relaxed text-stone-400">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-10 rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.07] to-red-600/[0.04] p-6 text-center">
          <h2 className="text-lg font-bold text-white">
            Do you make similar mistakes in your own games?
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Scan your Lichess or Chess.com games and see exactly which tactical
            patterns you miss — powered by Stockfish&nbsp;18, free.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-glow-sm transition-all hover:shadow-glow"
            >
              🔥 Analyze My Games Free
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:bg-white/[0.08]"
            >
              Browse All Famous Games
            </Link>
          </div>
        </section>

        {/* Related games */}
        {related.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              ♟️ Related Famous Games
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/games/${r.id}`}
                  className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:border-orange-500/20 hover:bg-white/[0.04]"
                >
                  <p className="font-semibold text-stone-200 group-hover:text-white text-sm">
                    {r.name}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {r.white} vs {r.black}, {r.year}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
