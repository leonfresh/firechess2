import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OPENING_GUIDES, type OpeningGuide } from "@/lib/opening-guides";
import { OpeningSlugClient, OpeningEmbedButton } from "./client";
import { BlogChessBoard } from "@/components/blog-chess-board";

/* ── Static params: one page per opening ── */
export function generateStaticParams() {
  return OPENING_GUIDES.map((g) => ({ slug: g.id }));
}

/* ── Per-page metadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = OPENING_GUIDES.find((g) => g.id === slug);
  if (!guide) return {};

  const title = `${guide.name} — Chess Opening Guide (ECO ${guide.eco})`;
  const description = `Learn the ${guide.name} (${guide.moves}). ${guide.tagline} Discover key ideas, plans for both sides, common traps, and critical positions.`;

  return {
    title,
    description,
    openGraph: {
      title: `${guide.name} | FireChess Opening Guide`,
      description,
      url: `https://firechess.com/openings/${guide.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${guide.name} Chess Opening Guide`,
      description,
    },
    alternates: { canonical: `https://firechess.com/openings/${guide.id}` },
  };
}

/* ── JSON-LD structured data ── */
function OpeningJsonLd({ guide }: { guide: OpeningGuide }) {
  const base = "https://firechess.com";
  const url = `${base}/openings/${guide.id}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${guide.name} Chess Opening Guide`,
    description: guide.tagline,
    url,
    author: { "@type": "Organization", name: "FireChess" },
    publisher: {
      "@type": "Organization",
      name: "FireChess",
      logo: { "@type": "ImageObject", url: `${base}/firechess-logo.png` },
    },
    about: {
      "@type": "Thing",
      name: guide.name,
      description: `${guide.name} (ECO ${guide.eco}): ${guide.moves}`,
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
        name: "Chess Openings",
        item: `${base}/openings`,
      },
      { "@type": "ListItem", position: 3, name: guide.name, item: url },
    ],
  };

  const faqItems = [
    { q: `What is the ${guide.name}?`, a: guide.tagline },
    {
      q: `What are the key ideas in the ${guide.name}?`,
      a: guide.keyIdeas.join(" "),
    },
    {
      q: `What are White's main plans in the ${guide.name}?`,
      a: guide.whitePlans.join(" "),
    },
    {
      q: `What are Black's main plans in the ${guide.name}?`,
      a: guide.blackPlans.join(" "),
    },
  ];

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ q, a }) => ({
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

/* ── Sibling openings (same category, excluding self) ── */
function relatedOpenings(guide: OpeningGuide): OpeningGuide[] {
  return OPENING_GUIDES.filter(
    (g) => g.category === guide.category && g.id !== guide.id,
  ).slice(0, 4);
}

/* ── Page component (server) ── */
export default async function OpeningSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = OPENING_GUIDES.find((g) => g.id === slug);
  if (!guide) notFound();

  const related = relatedOpenings(guide);

  const DIFFICULTY_STYLE: Record<string, string> = {
    beginner: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    intermediate: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    advanced: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <>
      <OpeningJsonLd guide={guide} />

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
          <span className="text-stone-300">{guide.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded border border-white/10 bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-stone-400">
              ECO {guide.eco}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${DIFFICULTY_STYLE[guide.difficulty] ?? "border-white/10 bg-white/[0.05] text-stone-400"}`}
            >
              {guide.difficulty}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {guide.name}
          </h1>
          <p className="mt-2 font-mono text-sm text-stone-400">{guide.moves}</p>
          <p className="mt-3 text-base text-stone-300">{guide.tagline}</p>

          {guide.players.length > 0 && (
            <p className="mt-2 text-sm text-stone-500">
              Famous practitioners:{" "}
              <span className="text-stone-400">{guide.players.join(", ")}</span>
            </p>
          )}
        </header>

        {/* Board + Key Ideas — two-column on desktop */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Interactive board */}
          <OpeningSlugClient moves={guide.moves} />

          {/* Key ideas */}
          <section className="glass-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Key Ideas
            </h2>
            <ul className="space-y-2">
              {guide.keyIdeas.map((idea) => (
                <li
                  key={idea}
                  className="flex items-start gap-2 text-sm text-stone-300"
                >
                  <span className="mt-0.5 text-orange-500">♟</span>
                  {idea}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Plans */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section className="glass-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
              ♔ Plans for White
            </h2>
            <ul className="space-y-2">
              {guide.whitePlans.map((plan) => (
                <li
                  key={plan}
                  className="flex items-start gap-2 text-sm text-stone-300"
                >
                  <span className="mt-0.5 shrink-0 text-stone-600">—</span>
                  {plan}
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
              ♚ Plans for Black
            </h2>
            <ul className="space-y-2">
              {guide.blackPlans.map((plan) => (
                <li
                  key={plan}
                  className="flex items-start gap-2 text-sm text-stone-300"
                >
                  <span className="mt-0.5 shrink-0 text-stone-600">—</span>
                  {plan}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Traps — short list */}
        {guide.traps.length > 0 && (
          <section className="mt-6 glass-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              ⚠️ Common Traps &amp; Pitfalls
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {guide.traps.map((trap) => (
                <div
                  key={trap.name}
                  className="rounded-xl border border-red-500/15 bg-red-500/[0.06] p-4"
                >
                  <p className="mb-1 text-sm font-semibold text-red-300">
                    {trap.name}
                  </p>
                  <p className="text-sm leading-relaxed text-stone-400">
                    {trap.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interactive Trap Lines */}
        {guide.trapLines && guide.trapLines.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-6 text-xl font-bold text-white">
              🔥 Traps &amp; Variations — Play Through Them
            </h2>
            <div className="space-y-10">
              {guide.trapLines.map((trap) => (
                <div
                  key={trap.name}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 md:p-7"
                >
                  <h3 className="mb-2 text-lg font-semibold text-orange-300">
                    {trap.name}
                  </h3>
                  <p className="mb-5 text-sm leading-relaxed text-stone-400 md:text-base">
                    {trap.explanation}
                  </p>
                  <BlogChessBoard
                    fen={trap.fen}
                    moves={trap.moves}
                    orientation={trap.orientation}
                    caption={trap.caption}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Critical positions */}
        {guide.positions.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              📍 Critical Positions
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {guide.positions.map((pos) => (
                <div key={pos.fen} className="glass-card p-4">
                  <p className="mb-1 text-sm font-semibold text-stone-200">
                    {pos.label}
                  </p>
                  <p className="mb-3 text-sm text-stone-400">{pos.note}</p>
                  <code className="block break-all rounded bg-white/[0.04] px-3 py-2 text-[11px] font-mono text-stone-500">
                    {pos.fen}
                  </code>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-10 rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.07] to-red-600/[0.04] p-6 text-center">
          <h2 className="text-lg font-bold text-white">
            Are you leaking games in the {guide.name}?
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Scan your Lichess or Chess.com games and see exactly where you lose
            in this opening — powered by Stockfish&nbsp;18, free.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-glow-sm transition-all hover:shadow-glow"
            >
              ⚡ Scan My {guide.name} Games
            </Link>
            <Link
              href="/openings"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:border-white/[0.15] hover:text-white"
            >
              Browse All Openings
            </Link>
            <OpeningEmbedButton slug={guide.id} name={guide.name} />
          </div>
        </section>

        {/* Related openings */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
              Related Openings
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/openings/${r.id}`}
                  className="glass-card-hover rounded-xl p-4 text-sm"
                >
                  <p className="font-semibold text-stone-200">{r.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-stone-500">
                    {r.moves}
                  </p>
                  <p className="mt-1.5 text-xs text-stone-400 line-clamp-2">
                    {r.tagline}
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
