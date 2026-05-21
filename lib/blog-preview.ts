/**
 * Static blog post previews for client-side rendering (e.g., the homepage section).
 * This avoids importing `lib/blog.ts` (which uses Node `fs`) in client components.
 *
 * Keep in sync with content/blog/*.md — update whenever posts are added or titles change.
 * Posts are sorted newest-first; only the first HOMEPAGE_BLOG_LIMIT are shown.
 */

export const HOMEPAGE_BLOG_LIMIT = 4;

export type BlogPreview = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readingTime: number;
};

/** Latest posts, newest first. Update when adding new articles. */
export const BLOG_PREVIEWS: BlogPreview[] = [
  {
    slug: "why-your-puzzle-rating-is-higher-than-your-rapid-rating",
    title: "Why Your Puzzle Rating Is Higher Than Your Rapid Rating",
    description:
      "Why puzzle ratings sit far above rapid ratings, what that gap really means, and how to turn tactical strength into actual game wins.",
    date: "2026-06-18",
    tags: ["tactics", "improvement", "rating"],
    readingTime: 6,
  },
  {
    slug: "italian-game-mistakes-club-players-make",
    title: "Italian Game Mistakes Club Players Keep Making",
    description:
      "The most common Italian Game mistakes for club players, with practical fixes, example positions, and simple plans you can use right away.",
    date: "2026-06-17",
    tags: ["openings", "italian-game", "improvement"],
    readingTime: 6,
  },
  {
    slug: "how-to-build-a-chess-study-plan-from-your-own-games",
    title: "How to Build a Chess Study Plan From Your Own Games",
    description:
      "Use your own recent games to build a realistic chess study plan instead of guessing what to work on next.",
    date: "2026-06-15",
    tags: ["study-plan", "improvement", "analysis"],
    readingTime: 6,
  },
  {
    slug: "how-to-study-chess-openings-without-memorizing",
    title: "How to Study Chess Openings Without Memorizing Everything",
    description:
      "A practical way to study chess openings through ideas, plans, structures, and your own repeated mistakes instead of endless memorization.",
    date: "2026-06-13",
    tags: ["openings", "study", "improvement"],
    readingTime: 5,
  },
  {
    slug: "chess-brilliant-move-explained",
    title: "Brilliant Moves in Chess: What They Are and How to Find Them",
    description:
      "What makes a move 'brilliant' in chess? How do Chess.com and other platforms detect them, and can you train yourself to find brilliant moves more often?",
    date: "2026-06-16",
    tags: ["analysis", "tactics", "improvement"],
    readingTime: 9,
  },
  {
    slug: "how-to-improve-at-chess",
    title: "How to Improve at Chess: The Only Guide You Actually Need",
    description:
      "The most effective path to chess improvement isn't studying harder — it's studying the right things. Here's a structured approach that actually works.",
    date: "2026-06-10",
    tags: ["improvement", "fundamentals"],
    readingTime: 9,
  },
  {
    slug: "chess-accuracy-score-explained",
    title: "Chess Accuracy Score Explained: What 90%+ Actually Means",
    description:
      "What is the chess accuracy score, how is it calculated, and what does a 90%+ accuracy actually tell you about how well you played? A deep dive.",
    date: "2026-06-04",
    tags: ["analysis", "fundamentals"],
    readingTime: 8,
  },
  {
    slug: "free-chess-analysis-tools-2026",
    title: "The Best Free Chess Analysis Tools in 2026",
    description:
      "A practical comparison of the best free tools for analyzing your chess games in 2026 — including engine depth, opening coverage, and ease of use.",
    date: "2026-04-08",
    tags: ["tools", "analysis"],
    readingTime: 7,
  },
  {
    slug: "how-to-stop-blundering-chess",
    title: "How to Stop Blundering in Chess: A Practical Guide",
    description:
      "Blunders aren't random — they follow patterns. Learn the 6 most common blunder types and concrete techniques to reduce them in your games.",
    date: "2026-02-20",
    tags: ["improvement", "tactics"],
    readingTime: 8,
  },
  {
    slug: "what-is-centipawn-loss",
    title: "What Is Centipawn Loss and Why It Matters",
    description:
      "Understanding centipawn loss (CPL) — the key metric engines use to measure your chess accuracy, and how to use it to improve.",
    date: "2026-02-18",
    tags: ["analysis", "fundamentals"],
    readingTime: 7,
  },
  {
    slug: "breaking-chess-rating-plateau",
    title: "Breaking Through a Chess Rating Plateau",
    description:
      "Why do players get stuck at the same rating for months? The answer usually isn't more games — it's targeted analysis of your repeat mistakes.",
    date: "2026-02-14",
    tags: ["improvement", "mindset"],
    readingTime: 8,
  },
  {
    slug: "how-to-analyze-chess-games",
    title: "How to Analyze Your Chess Games Effectively",
    description:
      "A step-by-step process for reviewing your chess games that actually leads to improvement, not just scrolling through engine lines.",
    date: "2026-02-12",
    tags: ["analysis", "improvement"],
    readingTime: 9,
  },
];

/** Returns the N most recent posts for homepage display. */
export function getHomepageBlogPreviews(n = HOMEPAGE_BLOG_LIMIT): BlogPreview[] {
  return BLOG_PREVIEWS.slice(0, n);
}
