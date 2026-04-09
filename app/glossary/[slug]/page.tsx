import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  GLOSSARY_TERMS,
  CATEGORY_LABELS,
  type GlossaryTerm,
} from "@/lib/chess-glossary";

export function generateStaticParams() {
  return GLOSSARY_TERMS.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const term = GLOSSARY_TERMS.find((t) => t.id === slug);
  if (!term) return {};

  const title = `What Is ${term.term} in Chess? — Definition & Examples`;
  const description = term.tagline;

  return {
    title,
    description,
    alternates: { canonical: `https://firechess.com/glossary/${term.id}` },
    openGraph: {
      title: `${term.term} — Chess Glossary | FireChess`,
      description,
      url: `https://firechess.com/glossary/${term.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `What Is ${term.term} in Chess?`,
      description,
    },
  };
}

function TermJsonLd({ term }: { term: GlossaryTerm }) {
  const base = "https://firechess.com";
  const url = `${base}/glossary/${term.id}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `What Is ${term.term} in Chess? — Definition & Examples`,
    description: term.tagline,
    url,
    author: { "@type": "Organization", name: "FireChess" },
    publisher: {
      "@type": "Organization",
      name: "FireChess",
      logo: { "@type": "ImageObject", url: `${base}/firechess-logo.png` },
    },
    about: {
      "@type": "DefinedTerm",
      name: term.term,
      description: term.definition,
      inDefinedTermSet: `${base}/glossary`,
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "FireChess", item: base },
      { "@type": "ListItem", position: 2, name: "Chess Glossary", item: `${base}/glossary` },
      { "@type": "ListItem", position: 3, name: term.term, item: url },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: term.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}

const CATEGORY_COLORS: Record<GlossaryTerm["category"], string> = {
  tactics: "red",
  strategy: "blue",
  endgame: "emerald",
  openings: "purple",
  "special-moves": "amber",
  concepts: "cyan",
  "game-phases": "slate",
};

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = GLOSSARY_TERMS.find((t) => t.id === slug);
  if (!term) notFound();

  const color = CATEGORY_COLORS[term.category];
  const relatedTerms = GLOSSARY_TERMS.filter((t) =>
    term.related.includes(t.id)
  );
  const sameCategory = GLOSSARY_TERMS.filter(
    (t) => t.id !== term.id && t.category === term.category
  ).slice(0, 4);

  return (
    <>
      <TermJsonLd term={term} />
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-300">Home</Link>
            <span>/</span>
            <Link href="/glossary" className="hover:text-slate-300">Chess Glossary</Link>
            <span>/</span>
            <span className="text-slate-300">{term.term}</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <span
              className={`mb-4 inline-block rounded-full bg-${color}-500/10 px-3 py-1 text-xs font-medium text-${color}-400 ring-1 ring-${color}-500/20`}
            >
              {CATEGORY_LABELS[term.category]}
            </span>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              What Is {term.term} in Chess?
            </h1>
            <p className="text-xl leading-relaxed text-slate-300">{term.tagline}</p>
          </header>

          {/* Definition */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold">Definition</h2>
            <p className="leading-relaxed text-slate-300">{term.definition}</p>
          </section>

          {/* Example */}
          <section className="mb-10 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="mb-3 text-lg font-bold text-white">Example</h2>
            <p className="leading-relaxed text-slate-300">{term.example}</p>
          </section>

          {/* Why it matters */}
          <section className="mb-10 rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
            <h2 className="mb-3 text-lg font-bold text-orange-300">
              Why It Matters for Your Chess
            </h2>
            <p className="leading-relaxed text-slate-300">{term.whyItMatters}</p>
          </section>

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="mb-6 text-2xl font-bold">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {term.faqs.map((faq) => (
                <div key={faq.q} className="rounded-lg bg-slate-800/50 p-5">
                  <h3 className="mb-2 font-semibold text-white">{faq.q}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">
              Practice {term.term} in Your Games
            </h2>
            <p className="mb-6 text-slate-400">
              FireChess detects tactical patterns like {term.term.toLowerCase()} in your games and shows you exactly what you missed — and how to find them next time.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/analyze"
                className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-400"
              >
                🔥 Analyze My Games Free
              </Link>
              <Link
                href="/glossary"
                className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-300 transition-colors hover:border-slate-400 hover:text-white"
              >
                Browse Full Glossary
              </Link>
            </div>
          </section>

          {/* Related terms */}
          {relatedTerms.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-xl font-bold">Related Terms</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedTerms.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/glossary/${rel.id}`}
                    className="group flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-slate-500 hover:bg-slate-800"
                  >
                    <span
                      className={`mt-0.5 shrink-0 rounded bg-${CATEGORY_COLORS[rel.category]}-500/10 px-1.5 py-0.5 text-xs font-medium text-${CATEGORY_COLORS[rel.category]}-400`}
                    >
                      {CATEGORY_LABELS[rel.category]}
                    </span>
                    <div>
                      <p className="font-semibold text-white group-hover:text-orange-300 transition-colors">
                        {rel.term}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{rel.tagline}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* More in this category */}
          {sameCategory.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">
                More {CATEGORY_LABELS[term.category]} Terms
              </h2>
              <div className="flex flex-wrap gap-2">
                {sameCategory.map((t) => (
                  <Link
                    key={t.id}
                    href={`/glossary/${t.id}`}
                    className={`rounded-full border border-${color}-500/20 bg-${color}-500/10 px-4 py-1.5 text-sm font-medium text-${color}-300 transition-colors hover:bg-${color}-500/20`}
                  >
                    {t.term}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
