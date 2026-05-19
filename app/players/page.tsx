import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GM_PROFILES, type GmProfile } from "@/lib/gm-profiles";

export const metadata: Metadata = {
  title: "Chess Grandmasters — Playing Styles, Openings & Career Profiles",
  description:
    "Explore in-depth profiles of the world's greatest chess grandmasters. Learn their opening repertoires, playing styles, career highlights, and the lessons you can apply to your own game.",
  alternates: { canonical: "https://firechess.com/players" },
  openGraph: {
    title: "Chess Grandmaster Profiles | FireChess",
    description:
      "In-depth profiles of Magnus Carlsen, Kasparov, Fischer, Tal, Karpov, Capablanca, Polgar, and more — opening repertoires, style analysis, and lessons to improve your chess.",
    url: "https://firechess.com/players",
    type: "website",
  },
};

function IndexJsonLd() {
  const base = "https://firechess.com";

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
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Chess Grandmaster Profiles",
    description:
      "In-depth chess grandmaster profiles with style analysis, openings, and lessons",
    numberOfItems: GM_PROFILES.length,
    itemListElement: GM_PROFILES.map((gm, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${gm.name} — Chess Style, Openings & Best Games`,
      url: `${base}/players/${gm.id}`,
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

const ERA_ORDER: GmProfile["era"][] = [
  "romantic",
  "classical",
  "modern",
  "contemporary",
];

const ERA_LABELS: Record<GmProfile["era"], string> = {
  romantic: "Romantic Era",
  classical: "Classical Era",
  modern: "Modern Era",
  contemporary: "Contemporary Era",
};

const ERA_COLORS: Record<GmProfile["era"], string> = {
  romantic: "amber",
  classical: "blue",
  modern: "emerald",
  contemporary: "purple",
};

const ERA_DESCRIPTIONS: Record<GmProfile["era"], string> = {
  romantic:
    "1800s–1880s: The age of brilliant sacrifices, king hunts, and unapologetic aggression.",
  classical:
    "1880s–1920s: Lasker and Capablanca refined principles of positional chess and endgame mastery.",
  modern:
    "1920s–1980s: Opening theory exploded; players like Fischer and Tal pushed preparation and creativity to new heights.",
  contemporary:
    "1990s–present: Computer-era preparation, universal players, and the Carlsen generation dominate.",
};

export default function PlayersIndexPage() {
  const byEra = ERA_ORDER.reduce<Record<GmProfile["era"], GmProfile[]>>(
    (acc, era) => {
      acc[era] = GM_PROFILES.filter((g) => g.era === era);
      return acc;
    },
    { romantic: [], classical: [], modern: [], contemporary: [] },
  );

  const totalGms = GM_PROFILES.length;

  return (
    <>
      <IndexJsonLd />
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-300">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-300">Grandmasters</span>
          </nav>

          {/* Header */}
          <header className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-300">
              ♛ {totalGms} Grandmaster Profiles
            </div>
            <h1 className="mb-4 text-5xl font-black tracking-tight text-white sm:text-6xl">
              Chess Grandmasters
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              In-depth profiles of the greatest players in chess history — their
              opening repertoires, playing styles, career highlights, and the
              lessons you can steal for your own game.
            </p>
          </header>

          {/* Eras */}
          {ERA_ORDER.map((era) => {
            const gms = byEra[era];
            if (!gms.length) return null;
            const color = ERA_COLORS[era];

            return (
              <section key={era} className="mb-16">
                <div className="mb-7 flex items-center gap-4">
                  <div
                    className={`h-px flex-1 bg-gradient-to-r from-${color}-500/40 to-transparent`}
                  />
                  <div className="text-center">
                    <h2
                      className={`text-2xl font-black text-${color}-300 tracking-tight`}
                    >
                      {ERA_LABELS[era]}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {ERA_DESCRIPTIONS[era]}
                    </p>
                  </div>
                  <div
                    className={`h-px flex-1 bg-gradient-to-l from-${color}-500/40 to-transparent`}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {gms.map((gm) => (
                    <Link
                      key={gm.id}
                      href={`/players/${gm.id}`}
                      className={`group relative overflow-hidden rounded-2xl border bg-slate-900 p-5 transition-all duration-200 hover:shadow-lg border-${color}-500/20 hover:border-${color}-400/50 hover:bg-slate-800/80 hover:shadow-${color}-900/30`}
                    >
                      {/* Era-tinted gradient overlay */}
                      <div
                        className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-${color}-500/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      />
                      <div className="relative">
                        <div className="mb-3 flex items-start gap-3">
                          {gm.imageUrl ? (
                            <div
                              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-${color}-500/30 group-hover:ring-${color}-400/70 transition-all duration-200 shadow-md shadow-black/40`}
                            >
                              <Image
                                src={gm.imageUrl}
                                alt={gm.name}
                                fill
                                className="object-cover object-top"
                                sizes="64px"
                              />
                            </div>
                          ) : (
                            <div
                              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-${color}-900/40 text-2xl ring-2 ring-${color}-500/30`}
                            >
                              ♟
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3
                                className={`font-bold text-white text-lg group-hover:text-${color}-300 transition-colors duration-200`}
                              >
                                {gm.name}
                              </h3>
                              {gm.worldChampion && (
                                <span className="shrink-0 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-semibold text-yellow-300 ring-1 ring-yellow-400/30">
                                  ♛ WC
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {gm.nationality} · {gm.born}–
                              {gm.died ?? "present"}
                              {gm.peakRating && (
                                <span
                                  className={`ml-1.5 font-semibold text-${color}-400/80`}
                                >
                                  Peak {gm.peakRating}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <p className="mb-3 text-sm text-slate-300 line-clamp-2 leading-snug">
                          {gm.tagline}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {gm.style.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className={`rounded-full border border-${color}-500/25 bg-${color}-500/10 px-2.5 py-0.5 text-xs font-medium text-${color}-300`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {/* CTA */}
          <section className="mt-4 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">
              Train with Their Openings
            </h2>
            <p className="mb-6 text-slate-400">
              FireChess analyzes your games and compares your opening choices to
              the world's best. Find the gaps and get a personalized improvement
              plan.
            </p>
            <Link
              href="/analyze"
              className="inline-block rounded-lg bg-orange-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-orange-400"
            >
              🔥 Analyze My Games Free
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
