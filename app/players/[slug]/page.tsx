import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GM_PROFILES, type GmProfile } from "@/lib/gm-profiles";
import { FAMOUS_GAMES } from "@/lib/famous-games";

export function generateStaticParams() {
  return GM_PROFILES.map((gm) => ({ slug: gm.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gm = GM_PROFILES.find((g) => g.id === slug);
  if (!gm) return {};

  const title = `${gm.name} — Chess Style, Openings & Best Games`;
  const description = gm.tagline;

  return {
    title,
    description,
    alternates: { canonical: `https://firechess.com/players/${gm.id}` },
    openGraph: {
      title: `${gm.name} | FireChess Player Profiles`,
      description,
      url: `https://firechess.com/players/${gm.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${gm.name} — Chess Style & Openings`,
      description,
    },
  };
}

function PlayerJsonLd({ gm }: { gm: GmProfile }) {
  const base = "https://firechess.com";
  const url = `${base}/players/${gm.id}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${gm.name} — Chess Style, Openings & Best Games`,
    description: gm.tagline,
    url,
    author: { "@type": "Organization", name: "FireChess" },
    publisher: {
      "@type": "Organization",
      name: "FireChess",
      logo: { "@type": "ImageObject", url: `${base}/firechess-logo.png` },
    },
    about: {
      "@type": "Person",
      name: gm.fullName,
      birthDate: `${gm.born}-01-01`,
      ...(gm.died ? { deathDate: `${gm.died}-01-01` } : {}),
      nationality: gm.nationality,
      jobTitle: gm.worldChampion ? "World Chess Champion" : "Chess Grandmaster",
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "FireChess", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: "Chess Grandmasters",
        item: `${base}/players`,
      },
      { "@type": "ListItem", position: 3, name: gm.name, item: url },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: gm.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}

const ERA_COLORS: Record<GmProfile["era"], string> = {
  romantic: "amber",
  classical: "blue",
  modern: "emerald",
  contemporary: "purple",
};

const ERA_LABELS: Record<GmProfile["era"], string> = {
  romantic: "Romantic Era",
  classical: "Classical Era",
  modern: "Modern Era",
  contemporary: "Contemporary Era",
};

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gm = GM_PROFILES.find((g) => g.id === slug);
  if (!gm) notFound();

  const color = ERA_COLORS[gm.era];
  const relatedGms = GM_PROFILES.filter(
    (g) =>
      g.id !== gm.id &&
      (g.era === gm.era || g.worldChampion === gm.worldChampion),
  ).slice(0, 3);
  const linkedGames = FAMOUS_GAMES.filter((g) =>
    gm.famousGameIds.includes(g.id),
  );

  return (
    <>
      <PlayerJsonLd gm={gm} />
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-300">
              Home
            </Link>
            <span>/</span>
            <Link href="/players" className="hover:text-slate-300">
              Grandmasters
            </Link>
            <span>/</span>
            <span className="text-slate-300">{gm.name}</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full bg-${color}-500/10 px-3 py-1 text-xs font-medium text-${color}-400 ring-1 ring-${color}-500/20`}
                  >
                    {ERA_LABELS[gm.era]}
                  </span>
                  {gm.worldChampion && (
                    <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400 ring-1 ring-yellow-500/20">
                      ♛ World Champion {gm.championYears}
                    </span>
                  )}
                  {gm.peakRating && (
                    <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
                      Peak: {gm.peakRating}
                    </span>
                  )}
                </div>

                <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">
                  {gm.name}
                </h1>
                <p className="mb-1 text-lg text-slate-400">
                  {gm.nationality} · {gm.born}–{gm.died ?? "present"} ·{" "}
                  {gm.title}
                </p>
                <p className="mt-4 text-xl leading-relaxed text-slate-300">
                  {gm.tagline}
                </p>
              </div>
              {gm.imageUrl && (
                <div className="relative hidden sm:block h-52 w-40 shrink-0 overflow-hidden rounded-xl ring-2 ring-slate-700">
                  <Image
                    src={gm.imageUrl}
                    alt={`${gm.name} portrait`}
                    fill
                    className="object-cover object-top"
                    sizes="160px"
                    priority
                  />
                </div>
              )}
            </div>
          </header>

          {/* Bio */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold">Career Overview</h2>
            <p className="leading-relaxed text-slate-300">{gm.bio}</p>
          </section>

          {/* Style badges */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold">Playing Style</h2>
            <div className="flex flex-wrap gap-2">
              {gm.style.map((s) => (
                <span
                  key={s}
                  className={`rounded-full bg-${color}-500/10 px-3 py-1.5 text-sm font-medium text-${color}-300 ring-1 ring-${color}-500/20`}
                >
                  {s}
                </span>
              ))}
            </div>
          </section>

          {/* Openings as White */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold">
              Favourite Openings as White
            </h2>
            <ul className="space-y-4">
              {gm.openingsWhite.map((op) => (
                <li key={op.name} className="rounded-lg bg-slate-800/60 p-4">
                  <p className="mb-1 font-semibold text-white">
                    {op.eco && (
                      <span className="mr-2 text-slate-400 text-sm">
                        {op.eco}
                      </span>
                    )}
                    {op.name}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {op.notes}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Openings as Black */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold">
              Favourite Openings as Black
            </h2>
            <ul className="space-y-4">
              {gm.openingsBlack.map((op) => (
                <li key={op.name} className="rounded-lg bg-slate-800/60 p-4">
                  <p className="mb-1 font-semibold text-white">
                    {op.eco && (
                      <span className="mr-2 text-slate-400 text-sm">
                        {op.eco}
                      </span>
                    )}
                    {op.name}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {op.notes}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Career Highlights */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold">Career Highlights</h2>
            <ul className="space-y-2">
              {gm.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-slate-300">
                  <span className={`mt-1 text-${color}-400 shrink-0`}>✦</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Lessons to Learn */}
          <section className="mb-10 rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
            <h2 className="mb-4 text-xl font-bold text-orange-300">
              What You Can Learn from {gm.name}
            </h2>
            <ul className="space-y-3">
              {gm.lessonsToLearn.map((lesson) => (
                <li key={lesson} className="flex gap-3 text-slate-300">
                  <span className="mt-1 text-orange-400 shrink-0">→</span>
                  <span>{lesson}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Famous Games */}
          {linkedGames.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-bold">Famous Games to Study</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {linkedGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="group rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-slate-500 hover:bg-slate-800"
                  >
                    <p className="mb-1 font-semibold text-white group-hover:text-orange-300 transition-colors">
                      {game.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {game.white} vs {game.black} · {game.year}
                    </p>
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                      {game.tagline}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="mb-6 text-2xl font-bold">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {gm.faqs.map((faq) => (
                <div key={faq.q} className="rounded-lg bg-slate-800/50 p-5">
                  <h3 className="mb-2 font-semibold text-white">{faq.q}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">
              Train Like {gm.name.split(" ")[gm.name.split(" ").length - 1]}
            </h2>
            <p className="mb-6 text-slate-400">
              FireChess analyzes your games with the same opening repertoire and
              style principles used by the world's best — find your weaknesses
              and fix them.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/analyze"
                className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-400"
              >
                🔥 Analyze My Games Free
              </Link>
              <Link
                href="/players"
                className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-300 transition-colors hover:border-slate-400 hover:text-white"
              >
                Browse All Grandmasters
              </Link>
            </div>
          </section>

          {/* Related GMs */}
          {relatedGms.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl font-bold">Related Grandmasters</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {relatedGms.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/players/${rel.id}`}
                    className="group rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-slate-500 hover:bg-slate-800"
                  >
                    <p className="mb-1 font-semibold text-white group-hover:text-orange-300 transition-colors">
                      {rel.name}
                    </p>
                    <p className="mb-2 text-xs text-slate-500">
                      {rel.nationality} · {rel.born}–{rel.died ?? "present"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {rel.style.slice(0, 2).map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
