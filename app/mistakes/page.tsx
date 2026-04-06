import type { Metadata } from "next";
import Link from "next/link";
import { CHESS_MISTAKES } from "@/lib/chess-mistakes";

export const metadata: Metadata = {
  title: "Common Chess Mistakes — How to Stop Losing to Avoidable Errors",
  description:
    "The most common chess mistakes at every level: hanging pieces, back rank blunders, slow development, king safety neglect, passive pieces, and more. How to recognize and fix each one.",
  alternates: { canonical: "https://firechess.com/mistakes" },
  openGraph: {
    title: "Common Chess Mistakes & How to Fix Them | FireChess",
    description:
      "Hanging pieces, back rank mates, premature attacks, passive pieces — find what's costing you the most Elo and exactly how to fix it.",
    url: "https://firechess.com/mistakes",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Most Common Chess Mistakes — How to Fix Them | FireChess",
    description:
      "Stop hanging pieces, missing back rank mates, and playing passive pieces. A guide to the most costly chess errors and their fixes.",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  tactical: "Tactical",
  positional: "Positional",
  opening: "Opening",
  endgame: "Endgame",
  "time-management": "Time Management",
};

const CATEGORY_COLORS: Record<
  string,
  { badge: string; dot: string; border: string }
> = {
  tactical: {
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-400",
    border: "border-red-500/20",
  },
  positional: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    border: "border-amber-500/20",
  },
  opening: {
    badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    dot: "bg-cyan-400",
    border: "border-cyan-500/20",
  },
  endgame: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    border: "border-emerald-500/20",
  },
  "time-management": {
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    dot: "bg-purple-400",
    border: "border-purple-500/20",
  },
};

function JsonLd() {
  const base = "https://firechess.com";
  const url = `${base}/mistakes`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: "Common Chess Mistakes",
        item: url,
      },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Most Common Chess Mistakes",
    description:
      "The most frequent errors that cost chess players Elo — and exactly how to fix them.",
    url,
    numberOfItems: CHESS_MISTAKES.length,
    itemListElement: CHESS_MISTAKES.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.name,
      url: `${base}/mistakes/${m.id}`,
      description: m.tagline,
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

export default function MistakesIndexPage() {
  const categories = [
    "tactical",
    "positional",
    "opening",
    "endgame",
    "time-management",
  ] as const;

  return (
    <>
      <JsonLd />
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="transition-colors hover:text-stone-300">
            Home
          </Link>
          <span>/</span>
          <span className="text-stone-300">Common Mistakes</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Common Chess Mistakes
          </h1>
          <p className="mt-3 max-w-2xl text-base text-stone-300">
            Most Elo is lost to the same handful of mistakes — hanging pieces,
            ignoring threats, neglecting king safety, converting winning
            endgames. Identify which ones affect your game most, and fix them
            one by one.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-500">
            <Link
              href="/tactics"
              className="transition-colors hover:text-stone-300"
            >
              → Tactics guides
            </Link>
            <Link
              href="/improve"
              className="transition-colors hover:text-stone-300"
            >
              → Improvement by rating
            </Link>
            <Link
              href="/positions"
              className="transition-colors hover:text-stone-300"
            >
              → Positional concepts
            </Link>
          </div>
        </header>

        {/* Category sections */}
        {categories.map((cat) => {
          const mistakes = CHESS_MISTAKES.filter((m) => m.category === cat);
          if (!mistakes.length) return null;
          const col = CATEGORY_COLORS[cat];

          return (
            <section key={cat} className="mb-12" aria-labelledby={`cat-${cat}`}>
              <div className="mb-5 flex items-center gap-3">
                <span
                  className={`h-3 w-3 flex-shrink-0 rounded-full ${col.dot}`}
                />
                <h2
                  id={`cat-${cat}`}
                  className="text-lg font-semibold text-white"
                >
                  {CATEGORY_LABELS[cat]} Mistakes
                </h2>
                <span className="text-sm text-stone-600">
                  {mistakes.length} article{mistakes.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {mistakes.map((m) => (
                  <Link
                    key={m.id}
                    href={`/mistakes/${m.id}`}
                    className={`group flex flex-col gap-3 rounded-2xl border bg-white/[0.03] p-5 transition-all hover:bg-white/[0.06] ${col.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {m.name}
                      </h3>
                      <span
                        className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${col.badge}`}
                      >
                        {CATEGORY_LABELS[m.category]}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-stone-400">
                      {m.tagline}
                    </p>
                    <p className="text-xs text-stone-600">
                      <span className="font-medium text-stone-500">
                        Affects:{" "}
                      </span>
                      {m.affectsRating}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                      How to fix it
                      <svg
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.07] to-cyan-500/[0.05] p-8 text-center">
          <h2 className="text-xl font-bold text-white">
            Find YOUR most expensive mistake
          </h2>
          <p className="mt-2 text-sm text-stone-400">
            FireChess scans your games and ranks your mistakes by Elo impact —
            so you know exactly what to fix first.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.03]"
          >
            Analyze My Games — Free
          </Link>
        </div>
      </div>
    </>
  );
}
