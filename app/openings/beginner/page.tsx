import type { Metadata } from "next";
import Link from "next/link";
import { OPENING_GUIDES } from "@/lib/opening-guides";

export const metadata: Metadata = {
  title: "Best Chess Openings for Beginners — Easy to Learn & Win",
  description:
    "The best beginner chess openings: Italian Game, London System, Scandinavian, Queen's Gambit and more. Simple principles, clear plans, and common traps explained.",
  alternates: { canonical: "https://firechess.com/openings/beginner" },
  openGraph: {
    title: "Best Chess Openings for Beginners | FireChess",
    description:
      "Master beginner-friendly chess openings with clear ideas and plans for both sides. Includes Italian Game, London System, Queen's Gambit and more.",
    url: "https://firechess.com/openings/beginner",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Chess Openings for Beginners",
    description:
      "Simple openings with clear plans — perfect for players rated 400–1200.",
  },
};

const guides = OPENING_GUIDES.filter((g) => g.difficulty === "beginner");

const ECO_BADGE =
  "rounded border border-white/10 bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-stone-400";

function JsonLd() {
  const base = "https://firechess.com";
  const url = `${base}/openings/beginner`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: "Chess Openings",
        item: `${base}/openings`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Beginner Openings",
        item: url,
      },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Best Chess Openings for Beginners",
    description:
      "A curated list of the easiest chess openings with clear ideas and plans.",
    url,
    numberOfItems: guides.length,
    itemListElement: guides.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.name,
      url: `${base}/openings/${g.id}`,
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

export default function BeginnerOpeningsPage() {
  return (
    <>
      <JsonLd />
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-stone-300 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/openings"
            className="hover:text-stone-300 transition-colors"
          >
            Openings
          </Link>
          <span>/</span>
          <span className="text-stone-300">Beginner</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Beginner
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Best Chess Openings for Beginners
          </h1>
          <p className="mt-3 text-base text-stone-300">
            {guides.length} beginner-friendly openings with clear plans for both
            sides, common traps, and interactive move demonstrations. Ideal for
            players rated 400–1200.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-500">
            <Link
              href="/openings/intermediate"
              className="hover:text-stone-300 transition-colors"
            >
              → Intermediate openings
            </Link>
            <Link
              href="/openings/advanced"
              className="hover:text-stone-300 transition-colors"
            >
              → Advanced openings
            </Link>
            <Link
              href="/openings"
              className="hover:text-stone-300 transition-colors"
            >
              → All openings
            </Link>
          </div>
        </header>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/openings/${guide.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-emerald-500/20 hover:bg-white/[0.04]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={ECO_BADGE}>{guide.eco}</span>
                <span className="text-[10px] font-mono text-stone-600">
                  {guide.moves}
                </span>
              </div>
              <h2 className="text-base font-bold text-white">{guide.name}</h2>
              <p className="text-sm text-stone-400">{guide.tagline}</p>
              <ul className="mt-1 space-y-1">
                {guide.keyIdeas.slice(0, 2).map((idea) => (
                  <li
                    key={idea}
                    className="flex items-start gap-1.5 text-xs text-stone-500"
                  >
                    <span className="mt-0.5 text-emerald-600">♟</span>
                    {idea}
                  </li>
                ))}
              </ul>
              <span className="mt-auto pt-2 text-xs font-medium text-emerald-500">
                View full guide →
              </span>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <section className="mt-12 rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.07] to-red-600/[0.04] p-6 text-center">
          <h2 className="text-lg font-bold text-white">
            Are you losing with beginner openings?
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Scan your Lichess or Chess.com games to see exactly where you go
            wrong — free Stockfish analysis.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-glow-sm transition-all hover:shadow-glow"
            >
              ⚡ Analyze My Games Free
            </Link>
            <Link
              href="/openings"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:border-white/[0.15] hover:text-white"
            >
              Browse All Openings
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
