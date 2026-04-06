import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TACTIC_MOTIFS, type TacticMotif } from "@/lib/tactics-motifs";
import { TacticIllustration } from "@/components/tactics-illustrations";
import { TacticPuzzleBoard } from "@/components/tactic-puzzle-board";

export function generateStaticParams() {
  return TACTIC_MOTIFS.map((t) => ({ motif: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ motif: string }>;
}): Promise<Metadata> {
  const { motif } = await params;
  const tactic = TACTIC_MOTIFS.find((t) => t.id === motif);
  if (!tactic) return {};

  const title = `${tactic.name} in Chess — How to Spot and Use It`;
  const description = `${tactic.tagline} Learn how to identify the ${tactic.name.toLowerCase()}, use it to win material, and defend against it with clear examples.`;

  return {
    title,
    description,
    alternates: { canonical: `https://firechess.com/tactics/${tactic.id}` },
    openGraph: {
      title: `${tactic.name} Chess Tactic | FireChess`,
      description,
      url: `https://firechess.com/tactics/${tactic.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tactic.name} — Chess Tactic Guide`,
      description,
    },
  };
}

function TacticJsonLd({ tactic }: { tactic: TacticMotif }) {
  const base = "https://firechess.com";
  const url = `${base}/tactics/${tactic.id}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${tactic.name} in Chess — How to Spot and Use It`,
    description: tactic.tagline,
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
        name: "Chess Tactics",
        item: `${base}/tactics`,
      },
      { "@type": "ListItem", position: 3, name: tactic.name, item: url },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tactic.faqs.map(({ q, a }) => ({
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

const FREQ_LABEL: Record<string, string> = {
  "very-common": "Very common",
  common: "Common",
  uncommon: "Uncommon",
};

export default async function TacticMotifPage({
  params,
}: {
  params: Promise<{ motif: string }>;
}) {
  const { motif } = await params;
  const tactic = TACTIC_MOTIFS.find((t) => t.id === motif);
  if (!tactic) notFound();

  const related = TACTIC_MOTIFS.filter(
    (t) => tactic.related.includes(t.id) && t.id !== tactic.id,
  );

  return (
    <>
      <TacticJsonLd tactic={tactic} />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-stone-300 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/tactics"
            className="hover:text-stone-300 transition-colors"
          >
            Tactics
          </Link>
          <span>/</span>
          <span className="text-stone-300">{tactic.name}</span>
        </nav>

        {/* Illustration */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/[0.06]">
          <TacticIllustration id={tactic.id} />
        </div>

        {/* Meta badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${DIFFICULTY_COLORS[tactic.difficulty]}`}
          >
            {tactic.difficulty}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-stone-400">
            {FREQ_LABEL[tactic.frequency]}
          </span>
        </div>

        {/* Title + tagline */}
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {tactic.name}
        </h1>
        <p className="mt-3 text-lg text-amber-300/90 font-medium italic">
          "{tactic.tagline}"
        </p>
        <p className="mt-4 text-base leading-relaxed text-stone-300">
          {tactic.description}
        </p>

        {/* Key Ideas */}
        <section className="mt-10" aria-labelledby="ideas-heading">
          <h2 id="ideas-heading" className="mb-4 text-xl font-bold text-white">
            Key Ideas
          </h2>
          <ul className="space-y-3">
            {tactic.keyIdeas.map((idea, i) => (
              <li key={i} className="flex gap-3 text-sm text-stone-300">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                  {i + 1}
                </span>
                {idea}
              </li>
            ))}
          </ul>
        </section>

        {/* How to Spot It + How to Defend — side by side on md+ */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section aria-labelledby="spot-heading">
            <h2 id="spot-heading" className="mb-4 text-lg font-bold text-white">
              How to Spot It
            </h2>
            <ul className="space-y-2.5">
              {tactic.howToSpot.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-stone-300">
                  <span className="mt-0.5 text-emerald-400 flex-shrink-0">
                    ✓
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="defend-heading">
            <h2
              id="defend-heading"
              className="mb-4 text-lg font-bold text-white"
            >
              How to Defend Against It
            </h2>
            <ul className="space-y-2.5">
              {tactic.howToDefend.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-stone-300">
                  <span className="mt-0.5 text-red-400 flex-shrink-0">⚠</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Interactive Puzzles */}
        {tactic.examples.length > 0 && (
          <section className="mt-10" aria-labelledby="puzzles-heading">
            <h2
              id="puzzles-heading"
              className="mb-2 text-xl font-bold text-white"
            >
              Interactive Puzzles
            </h2>
            <p className="mb-4 text-sm text-stone-400">
              Find the best move — drag or click a piece to play it out.
            </p>
            <TacticPuzzleBoard
              examples={tactic.examples}
              tacticName={tactic.name}
            />
          </section>
        )}

        {/* FAQ */}
        <section className="mt-12" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="mb-6 text-xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-5">
            {tactic.faqs.map(({ q, a }, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <h3 className="text-sm font-semibold text-white">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related tactics */}
        {related.length > 0 && (
          <section className="mt-12" aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="mb-4 text-xl font-bold text-white"
            >
              Related Tactics
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((t) => (
                <Link
                  key={t.id}
                  href={`/tactics/${t.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/10 transition-colors group"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                      {t.name}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">{t.tagline}</p>
                  </div>
                  <span className="text-stone-600 group-hover:text-amber-500 transition-colors">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6 text-center">
          <p className="text-sm font-semibold text-amber-300">
            Train this tactic right now
          </p>
          <p className="mt-1 text-xs text-stone-400">
            FireChess has thousands of rated {tactic.name.toLowerCase()} puzzles
            sorted by difficulty.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/train"
              className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
            >
              Practice Puzzles
            </Link>
            <Link
              href="/tactics"
              className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-stone-300 hover:border-white/20 transition-colors"
            >
              All Tactics
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
