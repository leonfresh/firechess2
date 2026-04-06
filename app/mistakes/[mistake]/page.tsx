import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CHESS_MISTAKES, type ChessMistake } from "@/lib/chess-mistakes";

export function generateStaticParams() {
  return CHESS_MISTAKES.map((m) => ({ mistake: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mistake: string }>;
}): Promise<Metadata> {
  const { mistake } = await params;
  const m = CHESS_MISTAKES.find((x) => x.id === mistake);
  if (!m) return {};

  const title = `${m.name} in Chess — Why It Happens and How to Fix It`;
  const description = `${m.tagline} Learn why players make this mistake, how to recognize it, and the exact steps to eliminate it from your game.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://firechess.com/mistakes/${m.id}`,
    },
    openGraph: {
      title: `${m.name} | Chess Mistake Guide — FireChess`,
      description,
      url: `https://firechess.com/mistakes/${m.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${m.name} — Chess Mistake Guide`,
      description,
    },
  };
}

function MistakeJsonLd({ m }: { m: ChessMistake }) {
  const base = "https://firechess.com";
  const url = `${base}/mistakes/${m.id}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${m.name} in Chess — Why It Happens and How to Fix It`,
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
        name: "Common Mistakes",
        item: `${base}/mistakes`,
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

const CATEGORY_COLORS: Record<string, string> = {
  tactical: "border-red-500/30 bg-red-500/10 text-red-400",
  positional: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  opening: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  endgame: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  "time-management": "border-purple-500/30 bg-purple-500/10 text-purple-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  tactical: "Tactical",
  positional: "Positional",
  opening: "Opening",
  endgame: "Endgame",
  "time-management": "Time Management",
};

export default async function ChessMistakePage({
  params,
}: {
  params: Promise<{ mistake: string }>;
}) {
  const { mistake } = await params;
  const m = CHESS_MISTAKES.find((x) => x.id === mistake);
  if (!m) notFound();

  const others = CHESS_MISTAKES.filter((x) => x.id !== m.id).slice(0, 3);
  const catCls =
    CATEGORY_COLORS[m.category] ??
    "border-white/10 bg-white/[0.05] text-stone-400";

  return (
    <>
      <MistakeJsonLd m={m} />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="transition-colors hover:text-stone-300">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/mistakes"
            className="transition-colors hover:text-stone-300"
          >
            Common Mistakes
          </Link>
          <span>/</span>
          <span className="text-stone-300">{m.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${catCls}`}
            >
              {CATEGORY_LABELS[m.category]}
            </span>
            <span className="text-xs text-stone-600">
              Affects: {m.affectsRating}
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

        {/* Why It Happens */}
        <section className="mb-10" aria-labelledby="why">
          <h2 id="why" className="mb-3 text-xl font-bold text-white">
            Why It Happens
          </h2>
          <p className="leading-relaxed text-stone-300">{m.whyItHappens}</p>
        </section>

        {/* Checklist reminder */}
        <div className="mb-10 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Pre-move checklist
          </p>
          <p className="mt-2 text-base font-semibold text-stone-100">
            {m.checklistItem}
          </p>
        </div>

        {/* How to Fix */}
        <section className="mb-10" aria-labelledby="fix">
          <h2 id="fix" className="mb-4 text-xl font-bold text-white">
            How to Fix It
          </h2>
          <ul className="flex flex-col gap-3">
            {m.howToFix.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  {i + 1}
                </span>
                <span className="text-stone-300">{step}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Example Position */}
        <section className="mb-10" aria-labelledby="example">
          <h2 id="example" className="mb-4 text-xl font-bold text-white">
            Example Position
          </h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
            <p className="mb-3 text-sm font-mono text-stone-500 break-all">
              FEN: {m.exampleFen}
            </p>
            <p className="text-base leading-relaxed text-stone-300">
              {m.exampleDescription}
            </p>
          </div>
        </section>

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

        {/* Other mistakes */}
        <section className="mb-10" aria-labelledby="other">
          <h2 id="other" className="mb-4 text-xl font-bold text-white">
            Other Common Mistakes
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.id}
                href={`/mistakes/${o.id}`}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all hover:bg-white/[0.06]"
              >
                <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm">
                  {o.name}
                </p>
                <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                  {o.tagline}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.07] to-cyan-500/[0.05] p-7 text-center">
          <h2 className="text-lg font-bold text-white">
            Are you making this mistake in your games?
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            FireChess scans your last 50–200 games and shows you exactly which
            errors are costing you the most Elo.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.03]"
          >
            Scan My Games — Free
          </Link>
        </div>
      </div>
    </>
  );
}
