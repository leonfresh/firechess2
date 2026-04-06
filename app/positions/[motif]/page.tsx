import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlogChessBoard } from "@/components/blog-chess-board";
import {
  POSITIONAL_MOTIFS,
  type PositionalMotif,
} from "@/lib/positional-motifs";

export function generateStaticParams() {
  return POSITIONAL_MOTIFS.map((m) => ({ motif: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ motif: string }>;
}): Promise<Metadata> {
  const { motif } = await params;
  const m = POSITIONAL_MOTIFS.find((x) => x.id === motif);
  if (!m) return {};

  const title = `${m.name} in Chess — How to Use It and Defend Against It`;
  const description = `${m.tagline} Learn the key ideas, exploitation techniques, and defensive resources for the ${m.name.toLowerCase()} positional concept — with GM insight.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://firechess.com/positions/${m.id}`,
    },
    openGraph: {
      title: `${m.name} | Chess Positional Guide — FireChess`,
      description,
      url: `https://firechess.com/positions/${m.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${m.name} — Chess Positional Concept`,
      description,
    },
  };
}

function PositionJsonLd({ m }: { m: PositionalMotif }) {
  const base = "https://firechess.com";
  const url = `${base}/positions/${m.id}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${m.name} in Chess — How to Use It and Defend Against It`,
    description: m.tagline,
    url,
    author: { "@type": "Organization", name: "FireChess" },
    publisher: {
      "@type": "Organization",
      name: "FireChess",
      logo: { "@type": "ImageObject", url: `${base}/firechess-logo.png` },
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
        name: "Positional Concepts",
        item: `${base}/positions`,
      },
      { "@type": "ListItem", position: 3, name: m.name, item: url },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: m.faqs.map(({ q, a }) => ({
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

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  intermediate: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  advanced: "border-red-500/30 bg-red-500/10 text-red-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  "pawn-structure": "Pawn Structure",
  "piece-activity": "Piece Activity",
  "king-safety": "King Safety",
  space: "Space & Control",
};

export default async function PositionalMotifPage({
  params,
}: {
  params: Promise<{ motif: string }>;
}) {
  const { motif } = await params;
  const m = POSITIONAL_MOTIFS.find((x) => x.id === motif);
  if (!m) notFound();

  const related = POSITIONAL_MOTIFS.filter(
    (x) => x.id !== m.id && m.related.includes(x.id),
  ).slice(0, 3);

  return (
    <>
      <PositionJsonLd m={m} />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="transition-colors hover:text-stone-300">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/positions"
            className="transition-colors hover:text-stone-300"
          >
            Positional Concepts
          </Link>
          <span>/</span>
          <span className="text-stone-300">{m.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${DIFFICULTY_COLORS[m.difficulty]}`}
            >
              {m.difficulty}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-xs text-stone-400">
              {CATEGORY_LABELS[m.category]}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {m.name}
          </h1>
          <p className="mt-2 text-lg text-stone-400">{m.tagline}</p>
          <p className="mt-4 text-base leading-relaxed text-stone-300">
            {m.description}
          </p>
        </header>

        {/* GM Quotes */}
        {m.gmQuotes.length > 0 && (
          <section className="mb-10" aria-labelledby="gm-quotes">
            <h2
              id="gm-quotes"
              className="mb-4 text-sm font-bold uppercase tracking-widest text-amber-500"
            >
              What the Grandmasters Say
            </h2>
            <div className="flex flex-col gap-4">
              {m.gmQuotes.map((q, i) => (
                <figure
                  key={i}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-5"
                >
                  <blockquote className="text-base italic text-stone-200">
                    "{q.text}"
                  </blockquote>
                  <figcaption className="mt-3 text-sm font-semibold text-amber-400">
                    — {q.author}
                    {q.context && (
                      <span className="ml-1 font-normal text-stone-500">
                        ({q.context})
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Key Ideas */}
        <section className="mb-10" aria-labelledby="key-ideas">
          <h2 id="key-ideas" className="mb-4 text-xl font-bold text-white">
            Key Ideas
          </h2>
          <ul className="flex flex-col gap-3">
            {m.keyIdeas.map((idea, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  {i + 1}
                </span>
                <span className="text-stone-300">{idea}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Example Position */}
        <section className="mb-10" aria-labelledby="example">
          <h2 id="example" className="mb-4 text-xl font-bold text-white">
            Example Position
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
            <div className="flex justify-center p-4 pb-0">
              <div className="w-full max-w-[360px]">
                <BlogChessBoard fen={m.exampleFen} orientation="white" />
              </div>
            </div>
            <p className="p-5 text-sm leading-relaxed text-stone-300">
              {m.exampleDescription}
            </p>
          </div>
        </section>

        {/* Two-column: How to Exploit + How to Defend */}
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <section aria-labelledby="exploit">
            <h2
              id="exploit"
              className="mb-4 text-lg font-bold text-emerald-400"
            >
              How to Exploit It
            </h2>
            <ul className="flex flex-col gap-2.5">
              {m.howToExploit.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-stone-300">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="defend">
            <h2 id="defend" className="mb-4 text-lg font-bold text-red-400">
              How to Defend Against It
            </h2>
            <ul className="flex flex-col gap-2.5">
              {m.howToDefend.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-stone-300">
                  <span className="mt-0.5 text-red-500">✗</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* FAQ */}
        <section className="mb-10" aria-labelledby="faq">
          <h2 id="faq" className="mb-5 text-xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-4">
            {m.faqs.map(({ q, a }, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5"
              >
                <h3 className="font-semibold text-white">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mb-10" aria-labelledby="related">
            <h2 id="related" className="mb-4 text-xl font-bold text-white">
              Related Concepts
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/positions/${r.id}`}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all hover:bg-white/[0.06]"
                >
                  <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm">
                    {r.name}
                  </p>
                  <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                    {r.tagline}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.07] to-cyan-500/[0.05] p-7 text-center">
          <h2 className="text-lg font-bold text-white">
            Find your positional blind spots
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            FireChess shows you exactly which positional concepts cost you the
            most Elo — using your own games.
          </p>
          <Link
            href="/#analyzer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.03]"
          >
            Analyze My Games — Free
          </Link>
        </div>
      </div>
    </>
  );
}
