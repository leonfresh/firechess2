/**
 * JSON-LD structured data components for SEO rich snippets.
 * Renders <script type="application/ld+json"> in the <head>.
 */

/* ── Organization ── */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FireChess",
    url: "https://firechess.com",
    logo: "https://firechess.com/firechess-logo.png",
    sameAs: [
      "https://github.com/leonfresh/firechess2",
      "https://discord.gg/YS8fc4FtEk",
    ],
    description:
      "Free chess analysis tool that scans your Lichess and Chess.com games for repeated opening mistakes, missed tactics, and endgame blunders using Stockfish 18.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── WebApplication ── */
export function WebApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FireChess",
    url: "https://firechess.com",
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript, WebAssembly, SharedArrayBuffer",
    description:
      "Scan your Lichess and Chess.com games for repeated opening mistakes, missed tactics, and endgame blunders. Powered by Stockfish 18 WASM — free, fast, and private.",
    offers: [
      {
        "@type": "Offer",
        name: "Free Plan",
        price: "0",
        priceCurrency: "USD",
        description: "Scan up to 300 games, depth 12 analysis",
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "4.99",
        priceCurrency: "USD",
        description: "Unlimited games, depth 22 analysis, full reports",
      },
    ],
    screenshot: "https://firechess.com/og-image.png",
    featureList: [
      "Opening leak detection",
      "Missed tactics analysis",
      "Endgame blunder detection",
      "Personalized puzzles",
      "Guess the Move mode",
      "Puzzle Dungeon roguelike",
      "Weakness training",
      "Opening explorer",
      "Guess the Elo roast mode",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── BreadcrumbList ── */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `https://firechess.com${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── FAQPage (for pricing/about) ── */
export function FAQJsonLd({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── Article (for blog posts) ── */
export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  author,
  image,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  author: string;
  image?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    datePublished,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "FireChess",
      logo: {
        "@type": "ImageObject",
        url: "https://firechess.com/firechess-logo.png",
      },
    },
    ...(image && {
      image: {
        "@type": "ImageObject",
        url: image,
      },
    }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── WebSite with SearchAction (sitelinks search box) ── */
export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FireChess",
    url: "https://firechess.com",
    description:
      "Free chess analysis tool — scan your games for opening leaks, missed tactics, and endgame blunders.",
    publisher: {
      "@type": "Organization",
      name: "FireChess",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://firechess.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
