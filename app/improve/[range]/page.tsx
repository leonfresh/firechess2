import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RATING_GUIDES, type RatingGuide } from "@/lib/rating-guides";

export function generateStaticParams() {
  return RATING_GUIDES.map((g) => ({ range: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ range: string }>;
}): Promise<Metadata> {
  const { range } = await params;
  const g = RATING_GUIDES.find((x) => x.id === range);
  if (!g) return {};

  const title = `How to Improve at Chess ${g.range} — ${g.title}`;
  const description = `${g.tagline} What to study, the most common errors, a weekly practice plan, and a realistic timeline to break the ${g.range.split("–")[1]} barrier.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://firechess.com/improve/${g.id}`,
    },
    openGraph: {
      title: `${g.title} Chess Improvement Guide | FireChess`,
      description,
      url: `https://firechess.com/improve/${g.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${g.title} — Chess Improvement Guide`,
      description,
    },
  };
}

function ImproveJsonLd({ g }: { g: RatingGuide }) {
  const base = "https://firechess.com";
  const url = `${base}/improve/${g.id}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `How to Improve at Chess ${g.range} — ${g.title}`,
    description: g.tagline,
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
        name: "Improvement Guides",
        item: `${base}/improve`,
      },
      { "@type": "ListItem", position: 3, name: g.title, item: url },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: g.faqs.map(({ q, a }) => ({
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

export default async function RatingGuidePage({
  params,
}: {
  params: Promise<{ range: string }>;
}) {
  const { range } = await params;
  const g = RATING_GUIDES.find((x) => x.id === range);
  if (!g) notFound();

  const idx = RATING_GUIDES.findIndex((x) => x.id === range);
  const prev = idx > 0 ? RATING_GUIDES[idx - 1] : null;
  const next = idx < RATING_GUIDES.length - 1 ? RATING_GUIDES[idx + 1] : null;

  return (
    <>
      <ImproveJsonLd g={g} />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="transition-colors hover:text-stone-300">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/improve"
            className="transition-colors hover:text-stone-300"
          >
            Improvement Guides
          </Link>
          <span>/</span>
          <span className="text-stone-300">{g.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-500">
            {g.range} Elo
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {g.title}
          </h1>
          <p className="mt-2 text-lg text-stone-400">{g.tagline}</p>
          <p className="mt-4 text-base leading-relaxed text-stone-300">
            {g.description}
          </p>
        </header>

        {/* Core challenge + timeframe */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Core challenge
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-100">
              {g.coreChallenge}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
              Realistic timeframe
            </p>
            <p className="mt-2 text-sm text-stone-200">{g.timeframe}</p>
          </div>
        </div>

        {/* Common Errors */}
        <section className="mb-10" aria-labelledby="errors">
          <h2 id="errors" className="mb-4 text-xl font-bold text-white">
            What Players at This Level Do Wrong
          </h2>
          <ul className="flex flex-col gap-2.5">
            {g.commonErrors.map((e, i) => (
              <li key={i} className="flex gap-3 text-stone-300">
                <span className="mt-0.5 flex-shrink-0 text-red-500">✗</span>
                {e}
              </li>
            ))}
          </ul>
        </section>

        {/* What to Study */}
        <section className="mb-10" aria-labelledby="study">
          <h2 id="study" className="mb-4 text-xl font-bold text-white">
            What to Study (Highest ROI First)
          </h2>
          <ul className="flex flex-col gap-3">
            {g.whatToStudy.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  {i + 1}
                </span>
                <span className="text-stone-300">{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Weekly Plan */}
        <section className="mb-10" aria-labelledby="plan">
          <h2 id="plan" className="mb-4 text-xl font-bold text-white">
            Weekly Practice Plan
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                  <th className="px-4 py-3 text-left font-semibold text-stone-300">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-300">
                    Frequency
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-stone-300 sm:table-cell">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody>
                {g.weeklyPlan.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-white/[0.04] ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                  >
                    <td className="px-4 py-3 font-medium text-stone-200">
                      {row.activity}
                    </td>
                    <td className="px-4 py-3 text-stone-400">
                      {row.frequency}
                    </td>
                    <td className="hidden px-4 py-3 text-stone-500 sm:table-cell">
                      {row.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FireChess tip */}
        <div className="mb-10 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            FireChess tip at this level
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-200">
            {g.firechessTip}
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Try it free
            <svg
              className="h-3.5 w-3.5"
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
          </Link>
        </div>

        {/* FAQ */}
        <section className="mb-10" aria-labelledby="faq">
          <h2 id="faq" className="mb-5 text-xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-4">
            {g.faqs.map(({ q, a }, i) => (
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

        {/* Prev / next */}
        <div className="mb-10 grid grid-cols-2 gap-4">
          {prev ? (
            <Link
              href={`/improve/${prev.id}`}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all hover:bg-white/[0.06]"
            >
              <p className="text-xs text-stone-600">← Previous level</p>
              <p className="mt-1 font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm">
                {prev.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/improve/${next.id}`}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-right transition-all hover:bg-white/[0.06]"
            >
              <p className="text-xs text-stone-600">Next level →</p>
              <p className="mt-1 font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm">
                {next.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.07] to-cyan-500/[0.05] p-7 text-center">
          <h2 className="text-lg font-bold text-white">
            Ready to break through {g.range.split("–")[1]}?
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            FireChess shows you exactly what's holding you back — from your own
            games, not generic advice.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.03]"
          >
            Analyze My Games — Free
          </Link>
        </div>
      </div>
    </>
  );
}
