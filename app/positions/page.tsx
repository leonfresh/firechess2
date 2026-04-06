import type { Metadata } from "next";
import Link from "next/link";
import { POSITIONAL_MOTIFS } from "@/lib/positional-motifs";

export const metadata: Metadata = {
  title: "Chess Positional Concepts — Master Structure, Pieces & Plans",
  description:
    "Learn essential chess positional motifs: isolated pawns, passed pawns, outposts, open files, bishop pair, weak squares, pawn majorities, and king activity. With GM quotes and clear explanations.",
  alternates: { canonical: "https://firechess.com/positions" },
  openGraph: {
    title: "Chess Positional Concepts | FireChess",
    description:
      "Master positional chess: isolated pawns, outposts, open files, bishop pair, weak squares, and more — with GM quotes from Kasparov, Fischer, Nimzowitsch, Capablanca.",
    url: "https://firechess.com/positions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Positional Concepts — Structure & Plans | FireChess",
    description:
      "Outposts, open files, bishop pair, pawn majorities — master positional chess with GM insight.",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  "pawn-structure": "Pawn Structure",
  "piece-activity": "Piece Activity",
  "king-safety": "King Safety",
  space: "Space & Control",
};

const CATEGORY_COLORS: Record<
  string,
  { badge: string; dot: string; border: string }
> = {
  "pawn-structure": {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    border: "border-amber-500/20",
  },
  "piece-activity": {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    border: "border-emerald-500/20",
  },
  "king-safety": {
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-400",
    border: "border-red-500/20",
  },
  space: {
    badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    dot: "bg-cyan-400",
    border: "border-cyan-500/20",
  },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  intermediate: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  advanced: "border-red-500/30 bg-red-500/10 text-red-400",
};

function JsonLd() {
  const base = "https://firechess.com";
  const url = `${base}/positions`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: "Positional Concepts",
        item: url,
      },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Chess Positional Concepts",
    description:
      "A guide to the essential positional motifs every chess player must understand.",
    url,
    numberOfItems: POSITIONAL_MOTIFS.length,
    itemListElement: POSITIONAL_MOTIFS.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.name,
      url: `${base}/positions/${m.id}`,
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

export default function PositionsIndexPage() {
  const categories = [
    "pawn-structure",
    "piece-activity",
    "king-safety",
    "space",
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
          <span className="text-stone-300">Positional Concepts</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Chess Positional Concepts
          </h1>
          <p className="mt-3 max-w-2xl text-base text-stone-300">
            Tactics win pieces. Positional understanding wins games. Learn the
            structural and strategic motifs that separate club players from
            serious competitors — with wisdom from Kasparov, Fischer,
            Capablanca, and Nimzowitsch.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-500">
            <Link
              href="/tactics"
              className="transition-colors hover:text-stone-300"
            >
              → Tactics patterns
            </Link>
            <Link
              href="/endgames"
              className="transition-colors hover:text-stone-300"
            >
              → Endgame guides
            </Link>
            <Link
              href="/train"
              className="transition-colors hover:text-stone-300"
            >
              → Practice positions
            </Link>
          </div>
        </header>

        {/* Category sections */}
        {categories.map((cat) => {
          const motifs = POSITIONAL_MOTIFS.filter((m) => m.category === cat);
          if (!motifs.length) return null;
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
                  {CATEGORY_LABELS[cat]}
                </h2>
                <span className="text-sm text-stone-600">
                  {motifs.length} concept{motifs.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {motifs.map((m) => (
                  <Link
                    key={m.id}
                    href={`/positions/${m.id}`}
                    className={`group flex flex-col gap-3 rounded-2xl border bg-white/[0.03] p-5 transition-all hover:bg-white/[0.06] ${col.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {m.name}
                      </h3>
                      <span
                        className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${DIFFICULTY_COLORS[m.difficulty]}`}
                      >
                        {m.difficulty}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-stone-400">
                      {m.tagline}
                    </p>
                    {/* First GM quote teaser */}
                    {m.gmQuotes[0] && (
                      <blockquote className="border-l-2 border-amber-500/40 pl-3 text-xs italic text-stone-500">
                        "{m.gmQuotes[0].text.slice(0, 90)}
                        {m.gmQuotes[0].text.length > 90 ? "…" : ""}"
                        <span className="not-italic font-medium text-stone-600">
                          {" "}
                          — {m.gmQuotes[0].author}
                        </span>
                      </blockquote>
                    )}
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                      Read guide
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
            See which positional concepts YOU struggle with
          </h2>
          <p className="mt-2 text-sm text-stone-400">
            FireChess scans your games and shows your exact positional blind
            spots — not generic advice.
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
