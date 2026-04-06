import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TIME_CONTROLS, type TimeControlGuide } from "@/lib/time-controls";

export function generateStaticParams() {
  return TIME_CONTROLS.map((tc) => ({ format: tc.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ format: string }>;
}): Promise<Metadata> {
  const { format } = await params;
  const tc = TIME_CONTROLS.find((x) => x.id === format);
  if (!tc) return {};

  const title = `${tc.name} Chess — How to Improve at ${tc.formats[0]}`;
  const description = `${tc.tagline} Tips, common mistakes, opening advice, time management, and an improvement plan for ${tc.name.toLowerCase()} chess.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://firechess.com/time-controls/${tc.id}`,
    },
    openGraph: {
      title: `${tc.name} Chess Guide | FireChess`,
      description,
      url: `https://firechess.com/time-controls/${tc.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tc.name} Chess — Tips & Improvement Plan`,
      description,
    },
  };
}

function TimeControlJsonLd({ tc }: { tc: TimeControlGuide }) {
  const base = "https://firechess.com";
  const url = `${base}/time-controls/${tc.id}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${tc.name} Chess — How to Improve at ${tc.formats[0]}`,
    description: tc.tagline,
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
        name: "Time Control Guides",
        item: `${base}/time-controls`,
      },
      { "@type": "ListItem", position: 3, name: tc.name, item: url },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tc.faqs.map(({ q, a }) => ({
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

const FORMAT_BADGE: Record<string, string> = {
  bullet: "border-red-500/30 bg-red-500/10 text-red-400",
  blitz: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  rapid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  classical: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
};

export default async function TimeControlPage({
  params,
}: {
  params: Promise<{ format: string }>;
}) {
  const { format } = await params;
  const tc = TIME_CONTROLS.find((x) => x.id === format);
  if (!tc) notFound();

  const others = TIME_CONTROLS.filter((x) => x.id !== tc.id);
  const badgeCls =
    FORMAT_BADGE[tc.id] ?? "border-white/10 bg-white/[0.05] text-stone-400";

  return (
    <>
      <TimeControlJsonLd tc={tc} />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="transition-colors hover:text-stone-300">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/time-controls"
            className="transition-colors hover:text-stone-300"
          >
            Time Control Guides
          </Link>
          <span>/</span>
          <span className="text-stone-300">{tc.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap gap-2">
            {tc.formats.map((f) => (
              <span
                key={f}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeCls}`}
              >
                {f}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {tc.name}
          </h1>
          <p className="mt-2 text-lg text-stone-400">{tc.tagline}</p>
          <p className="mt-4 text-base leading-relaxed text-stone-300">
            {tc.description}
          </p>
          <p className="mt-3 text-sm text-stone-500">
            <span className="font-semibold text-stone-400">Best for: </span>
            {tc.targetAudience}
          </p>
        </header>

        {/* Unique Challenges */}
        <section className="mb-10" aria-labelledby="challenges">
          <h2 id="challenges" className="mb-4 text-xl font-bold text-white">
            Unique Challenges at This Time Control
          </h2>
          <ul className="flex flex-col gap-3">
            {tc.uniqueChallenges.map((c, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                  {i + 1}
                </span>
                <span className="text-stone-300">{c}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Tips */}
        <section className="mb-10" aria-labelledby="tips">
          <h2 id="tips" className="mb-4 text-xl font-bold text-white">
            Tips for {tc.name}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {tc.tips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-stone-300">
                <span className="mt-0.5 flex-shrink-0 text-emerald-500">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* Two-column: Opening + Time Management */}
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <section
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5"
            aria-labelledby="openings"
          >
            <h2 id="openings" className="mb-3 font-bold text-white">
              Opening Strategy
            </h2>
            <p className="text-sm leading-relaxed text-stone-300">
              {tc.openingAdvice}
            </p>
          </section>
          <section
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5"
            aria-labelledby="time-mgmt"
          >
            <h2 id="time-mgmt" className="mb-3 font-bold text-white">
              Time Management
            </h2>
            <p className="text-sm leading-relaxed text-stone-300">
              {tc.timeManagement}
            </p>
          </section>
        </div>

        {/* Common Mistakes */}
        <section className="mb-10" aria-labelledby="mistakes">
          <h2 id="mistakes" className="mb-4 text-xl font-bold text-white">
            Common Mistakes
          </h2>
          <ul className="flex flex-col gap-2.5">
            {tc.commonMistakes.map((m, i) => (
              <li key={i} className="flex gap-3 text-stone-300">
                <span className="mt-0.5 flex-shrink-0 text-red-500">✗</span>
                {m}
              </li>
            ))}
          </ul>
        </section>

        {/* Improvement Plan */}
        <section className="mb-10" aria-labelledby="improve">
          <h2 id="improve" className="mb-4 text-xl font-bold text-white">
            Improvement Plan
          </h2>
          <ul className="flex flex-col gap-3">
            {tc.improvementPlan.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  {i + 1}
                </span>
                <span className="text-stone-300">{step}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-10" aria-labelledby="faq">
          <h2 id="faq" className="mb-5 text-xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-4">
            {tc.faqs.map(({ q, a }, i) => (
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

        {/* Other formats */}
        <section className="mb-10" aria-labelledby="other-formats">
          <h2 id="other-formats" className="mb-4 text-xl font-bold text-white">
            Other Time Control Guides
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.id}
                href={`/time-controls/${o.id}`}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all hover:bg-white/[0.06]"
              >
                <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm">
                  {o.name}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {o.formats.slice(0, 2).join(", ")}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.07] to-cyan-500/[0.05] p-7 text-center">
          <h2 className="text-lg font-bold text-white">
            See how you perform in {tc.name.toLowerCase()} specifically
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            FireChess breaks down your results by time control — so you know
            exactly where you're losing Elo.
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
