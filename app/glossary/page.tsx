import type { Metadata } from "next";
import Link from "next/link";
import {
  GLOSSARY_TERMS,
  CATEGORY_LABELS,
  type GlossaryCategory,
  type GlossaryTerm,
} from "@/lib/chess-glossary";

export const metadata: Metadata = {
  title: "Chess Glossary — Every Chess Term Explained Simply",
  description:
    "The complete chess glossary: clear definitions of every chess term from fork and pin to zugzwang, fianchetto, and Elo rating. Learn chess vocabulary with examples.",
  alternates: { canonical: "https://firechess.com/glossary" },
  openGraph: {
    title: "Chess Glossary — Every Chess Term Explained | FireChess",
    description:
      "Clear definitions of chess terms: fork, pin, skewer, zugzwang, fianchetto, en passant, and more — each with examples and why it matters for your game.",
    url: "https://firechess.com/glossary",
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
      { "@type": "ListItem", position: 2, name: "Chess Glossary", item: `${base}/glossary` },
    ],
  };

  const definedTermSet = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Chess Glossary",
    description: "Definitions of chess terms: tactics, strategy, endgame, openings, and concepts",
    url: `${base}/glossary`,
    hasDefinedTerm: GLOSSARY_TERMS.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.tagline,
      url: `${base}/glossary/${t.id}`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSet) }}
      />
    </>
  );
}

const CATEGORY_ORDER: GlossaryCategory[] = [
  "tactics",
  "strategy",
  "concepts",
  "special-moves",
  "endgame",
  "openings",
  "game-phases",
];

const CATEGORY_COLORS: Record<GlossaryCategory, string> = {
  tactics: "red",
  strategy: "blue",
  endgame: "emerald",
  openings: "purple",
  "special-moves": "amber",
  concepts: "cyan",
  "game-phases": "slate",
};

const CATEGORY_ICONS: Record<GlossaryCategory, string> = {
  tactics: "⚡",
  strategy: "♟",
  endgame: "♔",
  openings: "📖",
  "special-moves": "✦",
  concepts: "🧠",
  "game-phases": "🎯",
};

export default function GlossaryIndexPage() {
  const byCategory = CATEGORY_ORDER.reduce<Record<GlossaryCategory, GlossaryTerm[]>>(
    (acc, cat) => {
      acc[cat] = GLOSSARY_TERMS.filter((t) => t.category === cat);
      return acc;
    },
    {
      tactics: [],
      strategy: [],
      endgame: [],
      openings: [],
      "special-moves": [],
      concepts: [],
      "game-phases": [],
    }
  );

  return (
    <>
      <IndexJsonLd />
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-300">Home</Link>
            <span>/</span>
            <span className="text-slate-300">Chess Glossary</span>
          </nav>

          {/* Header */}
          <header className="mb-12 text-center">
            <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl">
              Chess Glossary
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-slate-400">
              Every chess term explained clearly — from your first fork to the Lucena position.{" "}
              {GLOSSARY_TERMS.length} terms with definitions, examples, and why each matters.
            </p>
          </header>

          {/* Quick-nav pills */}
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {CATEGORY_ORDER.map((cat) => {
              const color = CATEGORY_COLORS[cat];
              return (
                <a
                  key={cat}
                  href={`#${cat}`}
                  className={`rounded-full border border-${color}-500/20 bg-${color}-500/10 px-4 py-1.5 text-sm font-medium text-${color}-300 transition-colors hover:bg-${color}-500/20`}
                >
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                </a>
              );
            })}
          </div>

          {/* Categories */}
          {CATEGORY_ORDER.map((cat) => {
            const terms = byCategory[cat];
            if (!terms.length) return null;
            const color = CATEGORY_COLORS[cat];

            return (
              <section key={cat} id={cat} className="mb-14 scroll-mt-20">
                <h2 className={`mb-6 text-2xl font-bold text-${color}-400`}>
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {terms.map((term) => (
                    <Link
                      key={term.id}
                      href={`/glossary/${term.id}`}
                      className="group rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-slate-500 hover:bg-slate-800"
                    >
                      <p className="mb-1 font-bold text-white group-hover:text-orange-300 transition-colors">
                        {term.term}
                      </p>
                      <p className="text-sm text-slate-400 line-clamp-2">{term.tagline}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {/* CTA */}
          <section className="mt-4 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">Put These Concepts Into Practice</h2>
            <p className="mb-6 text-slate-400">
              FireChess finds forks, pins, and missed tactical patterns in your real games — then shows you exactly how to spot them next time.
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
