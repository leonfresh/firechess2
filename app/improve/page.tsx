import type { Metadata } from "next";
import Link from "next/link";
import { RATING_GUIDES } from "@/lib/rating-guides";

export const metadata: Metadata = {
  title: "How to Improve at Chess — Rating Guides from 400 to 2000",
  description:
    "Step-by-step chess improvement guides for every rating bracket: 400-800, 800-1000, 1000-1200, 1200-1500, 1500-1800, 1800-2000. What to study, how to practice, and how long it takes.",
  alternates: { canonical: "https://firechess.com/improve" },
  openGraph: {
    title: "How to Improve at Chess — Rating Guides | FireChess",
    description:
      "Structured chess improvement guides for every rating range — what to study, common errors, weekly plans, and realistic timelines.",
    url: "https://firechess.com/improve",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Improvement Guides by Rating | FireChess",
    description:
      "From 400 to 2000 — what to study at each level, common mistakes, and proven improvement plans.",
  },
};

function JsonLd() {
  const base = "https://firechess.com";
  const url = `${base}/improve`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: "Improvement Guides",
        item: url,
      },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Chess Improvement Guides by Rating",
    description: "How to break every rating ceiling from 400 to 2000.",
    url,
    numberOfItems: RATING_GUIDES.length,
    itemListElement: RATING_GUIDES.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.title,
      url: `${base}/improve/${g.id}`,
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

const RANGE_COLORS = [
  "border-slate-500/20 bg-slate-500/[0.04]",
  "border-blue-500/20 bg-blue-500/[0.04]",
  "border-cyan-500/20 bg-cyan-500/[0.04]",
  "border-emerald-500/20 bg-emerald-500/[0.04]",
  "border-amber-500/20 bg-amber-500/[0.04]",
  "border-red-500/20 bg-red-500/[0.04]",
];

export default function ImproveIndexPage() {
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
          <span className="text-stone-300">Improvement Guides</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            How to Improve at Chess
          </h1>
          <p className="mt-3 max-w-2xl text-base text-stone-300">
            Each rating bracket has a specific set of problems — and a specific
            set of solutions. Find your range, understand what's holding you
            back, and follow a structured plan to break through.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-500">
            <Link
              href="/mistakes"
              className="transition-colors hover:text-stone-300"
            >
              → Common mistakes
            </Link>
            <Link
              href="/tactics"
              className="transition-colors hover:text-stone-300"
            >
              → Tactics guides
            </Link>
            <Link
              href="/endgames"
              className="transition-colors hover:text-stone-300"
            >
              → Endgame guides
            </Link>
          </div>
        </header>

        {/* Rating ladder */}
        <div className="relative flex flex-col gap-0">
          {RATING_GUIDES.map((g, i) => (
            <Link
              key={g.id}
              href={`/improve/${g.id}`}
              className={`group relative flex gap-5 rounded-2xl border p-6 transition-all hover:bg-white/[0.04] ${RANGE_COLORS[i % RANGE_COLORS.length]}`}
            >
              {/* Rank number */}
              <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-sm font-bold text-stone-300">
                  {i + 1}
                </span>
                {i < RATING_GUIDES.length - 1 && (
                  <div className="w-px flex-1 bg-white/[0.06]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {g.title}
                  </h2>
                  <span className="text-sm font-medium text-stone-500">
                    {g.range} Elo
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-400">{g.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-stone-500">
                  <span>
                    <span className="font-medium text-stone-400">
                      Core challenge:{" "}
                    </span>
                    {g.coreChallenge}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.whatToStudy.slice(0, 2).map((s, si) => (
                    <span
                      key={si}
                      className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-xs text-stone-400"
                    >
                      {s.split(":")[0].replace(/^[^a-zA-Z]+/, "")}
                    </span>
                  ))}
                  <span className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-xs text-stone-600">
                    {g.timeframe.split(" ").slice(0, 5).join(" ")}…
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-shrink-0 items-center">
                <svg
                  className="h-5 w-5 text-stone-700 transition-all group-hover:text-emerald-500 group-hover:translate-x-0.5"
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

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.07] to-cyan-500/[0.05] p-8 text-center">
          <h2 className="text-xl font-bold text-white">
            Not sure what's holding you back?
          </h2>
          <p className="mt-2 text-sm text-stone-400">
            FireChess scans your games and shows you exactly which skills to
            improve — tactics, openings, endgames, or time management.
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
