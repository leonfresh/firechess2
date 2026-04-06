import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ENDGAME_GUIDES, type EndgameGuide } from "@/lib/endgame-guides";
import { EndgameIllustration } from "@/components/endgame-illustrations";

export function generateStaticParams() {
  return ENDGAME_GUIDES.map((g) => ({ type: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const guide = ENDGAME_GUIDES.find((g) => g.id === type);
  if (!guide) return {};

  const title = `${guide.name} — Chess Endgame Theory & Technique`;
  const description = `${guide.tagline} Learn the key principles, essential techniques, and common mistakes in ${guide.name.toLowerCase()} endgames with FEN examples.`;

  return {
    title,
    description,
    alternates: { canonical: `https://firechess.com/endgames/${guide.id}` },
    openGraph: {
      title: `${guide.name} | FireChess Endgame Guide`,
      description,
      url: `https://firechess.com/endgames/${guide.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${guide.name} — Endgame Guide`,
      description,
    },
  };
}

function EndgameJsonLd({ guide }: { guide: EndgameGuide }) {
  const base = "https://firechess.com";
  const url = `${base}/endgames/${guide.id}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${guide.name} — Chess Endgame Theory & Technique`,
    description: guide.tagline,
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
        name: "Endgame Guides",
        item: `${base}/endgames`,
      },
      { "@type": "ListItem", position: 3, name: guide.name, item: url },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map(({ q, a }) => ({
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

export default async function EndgameGuidePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const guide = ENDGAME_GUIDES.find((g) => g.id === type);
  if (!guide) notFound();

  // Related: other endgames at same or adjacent difficulty
  const related = ENDGAME_GUIDES.filter(
    (g) => g.id !== guide.id && g.difficulty === guide.difficulty,
  ).slice(0, 3);

  return (
    <>
      <EndgameJsonLd guide={guide} />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-stone-300 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/endgames"
            className="hover:text-stone-300 transition-colors"
          >
            Endgames
          </Link>
          <span>/</span>
          <span className="text-stone-300">{guide.name}</span>
        </nav>

        {/* Illustration */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/[0.06]">
          <EndgameIllustration id={guide.id} />
        </div>

        {/* Meta badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${DIFFICULTY_COLORS[guide.difficulty]}`}
          >
            {guide.difficulty}
          </span>
          <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-stone-400">
            {guide.material}
          </span>
        </div>

        {/* Title + tagline */}
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {guide.name}
        </h1>
        <p className="mt-3 text-lg text-emerald-300/90 font-medium italic">
          "{guide.tagline}"
        </p>
        <p className="mt-4 text-base leading-relaxed text-stone-300">
          {guide.description}
        </p>

        {/* Key Principles */}
        <section className="mt-10" aria-labelledby="principles-heading">
          <h2
            id="principles-heading"
            className="mb-4 text-xl font-bold text-white"
          >
            Key Principles
          </h2>
          <ul className="space-y-3">
            {guide.keyPrinciples.map((principle, i) => (
              <li key={i} className="flex gap-3 text-sm text-stone-300">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                  {i + 1}
                </span>
                {principle}
              </li>
            ))}
          </ul>
        </section>

        {/* Techniques + Common Mistakes */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section aria-labelledby="techniques-heading">
            <h2
              id="techniques-heading"
              className="mb-4 text-lg font-bold text-white"
            >
              Essential Techniques
            </h2>
            <ul className="space-y-2.5">
              {guide.techniques.map((tech, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-stone-300">
                  <span className="mt-0.5 text-emerald-400 flex-shrink-0">
                    ✓
                  </span>
                  {tech}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="mistakes-heading">
            <h2
              id="mistakes-heading"
              className="mb-4 text-lg font-bold text-white"
            >
              Common Mistakes
            </h2>
            <ul className="space-y-2.5">
              {guide.commonMistakes.map((mistake, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-stone-300">
                  <span className="mt-0.5 text-red-400 flex-shrink-0">⚠</span>
                  {mistake}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Example Position */}
        <section className="mt-10" aria-labelledby="example-eg-heading">
          <h2
            id="example-eg-heading"
            className="mb-4 text-xl font-bold text-white"
          >
            Example Position
          </h2>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-3 rounded-lg bg-white/[0.03] p-3">
              <p className="font-mono text-xs text-stone-400 break-all">
                {guide.exampleFen}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-stone-300">
              {guide.exampleDescription}
            </p>
            <Link
              href="/analyze"
              className="mt-4 inline-block rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              Analyze this position →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12" aria-labelledby="faq-eg-heading">
          <h2 id="faq-eg-heading" className="mb-6 text-xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-5">
            {guide.faqs.map(({ q, a }, i) => (
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

        {/* Related Endgames */}
        {related.length > 0 && (
          <section className="mt-12" aria-labelledby="related-eg-heading">
            <h2
              id="related-eg-heading"
              className="mb-4 text-xl font-bold text-white"
            >
              More Endgame Guides
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((g) => (
                <Link
                  key={g.id}
                  href={`/endgames/${g.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/10 transition-colors group"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {g.name}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">{g.tagline}</p>
                  </div>
                  <span className="text-stone-600 group-hover:text-emerald-500 transition-colors">
                    →
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/endgames"
              className="mt-4 inline-block text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              ← All endgame guides
            </Link>
          </section>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 text-center">
          <p className="text-sm font-semibold text-emerald-300">
            Practice your endgame technique
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Use FireChess's game analysis to review your endgame play and spot
            where positions were winnable.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/analyze"
              className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-black hover:bg-emerald-400 transition-colors"
            >
              Analyze Your Games
            </Link>
            <Link
              href="/endgames"
              className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-stone-300 hover:border-white/20 transition-colors"
            >
              All Endgame Guides
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
