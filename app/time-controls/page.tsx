import type { Metadata } from "next";
import Link from "next/link";
import { TIME_CONTROLS } from "@/lib/time-controls";

export const metadata: Metadata = {
  title: "Chess Time Controls — Bullet, Blitz, Rapid & Classical Guides",
  description:
    "How to play well in every time format: bullet (1+0, 2+1), blitz (3+0, 5+0), rapid (10+0, 15+10), and classical (30+0, 90+30). Tips, mistakes, opening advice, and improvement plans.",
  alternates: { canonical: "https://firechess.com/time-controls" },
  openGraph: {
    title: "Chess Time Control Guides | FireChess",
    description:
      "Master bullet, blitz, rapid, and classical chess — with format-specific tips, common mistakes, and improvement plans for each time control.",
    url: "https://firechess.com/time-controls",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bullet, Blitz, Rapid & Classical Chess Guides | FireChess",
    description:
      "How to improve at every time format — bullet premoves, blitz clock management, rapid planning, classical preparation.",
  },
};

const FORMAT_COLORS: Record<
  string,
  { badge: string; glow: string; border: string; dot: string }
> = {
  bullet: {
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
    glow: "shadow-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
  },
  blitz: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    glow: "shadow-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  rapid: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    glow: "shadow-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  classical: {
    badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    glow: "shadow-cyan-500/10",
    border: "border-cyan-500/20",
    dot: "bg-cyan-400",
  },
};

function JsonLd() {
  const base = "https://firechess.com";
  const url = `${base}/time-controls`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: "Time Control Guides",
        item: url,
      },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Chess Time Control Guides",
    description:
      "How to play well in bullet, blitz, rapid, and classical chess.",
    url,
    numberOfItems: TIME_CONTROLS.length,
    itemListElement: TIME_CONTROLS.map((tc, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: tc.name,
      url: `${base}/time-controls/${tc.id}`,
      description: tc.tagline,
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

export default function TimeControlsIndexPage() {
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
          <span className="text-stone-300">Time Control Guides</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Chess Time Control Guides
          </h1>
          <p className="mt-3 max-w-2xl text-base text-stone-300">
            Each time control is a different game. Bullet rewards premoves and
            reflexes. Blitz rewards pattern recognition. Rapid rewards planning
            and endgame technique. Classical rewards deep preparation. This is
            how to play well in each.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-500">
            <Link
              href="/improve"
              className="transition-colors hover:text-stone-300"
            >
              → Improvement guides by rating
            </Link>
            <Link
              href="/mistakes"
              className="transition-colors hover:text-stone-300"
            >
              → Common chess mistakes
            </Link>
          </div>
        </header>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {TIME_CONTROLS.map((tc) => {
            const col = FORMAT_COLORS[tc.id] ?? FORMAT_COLORS.rapid;
            return (
              <Link
                key={tc.id}
                href={`/time-controls/${tc.id}`}
                className={`group flex flex-col gap-4 rounded-2xl border bg-white/[0.03] p-6 shadow-lg transition-all hover:bg-white/[0.06] ${col.border} ${col.glow}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {tc.name}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {tc.formats.map((f) => (
                        <span
                          key={f}
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${col.badge}`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`h-3 w-3 flex-shrink-0 rounded-full mt-1 ${col.dot}`}
                  />
                </div>
                <p className="text-sm leading-relaxed text-stone-400">
                  {tc.tagline}
                </p>
                <div className="space-y-1.5">
                  {tc.tips.slice(0, 3).map((tip, i) => (
                    <div key={i} className="flex gap-2 text-xs text-stone-500">
                      <span className="text-emerald-600">→</span>
                      {tip}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                  Full guide
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
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.07] to-cyan-500/[0.05] p-8 text-center">
          <h2 className="text-xl font-bold text-white">
            Which time control should you focus on?
          </h2>
          <p className="mt-2 text-sm text-stone-400">
            FireChess shows your win rate by time control across all your games
            — so you know exactly where your Elo is being lost.
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
