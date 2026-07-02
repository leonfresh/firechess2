import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Puzzle Trainer — 3M+ Chess Puzzles by Rating & Theme | FireChess",
  description:
    "Sharpen your tactical vision with over 3 million Lichess puzzles filtered by rating and motif. Track your accuracy with move-quality badges — Brilliant, Best, Excellent, and more.",
  openGraph: {
    title: "Puzzle Trainer | FireChess",
    description:
      "Sharpen your tactical vision with over 3 million Lichess puzzles filtered by rating and motif.",
    url: "https://firechess.com/puzzles",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Puzzle Trainer | FireChess",
    description:
      "Sharpen your tactical vision with over 3 million Lichess puzzles filtered by rating and motif.",
  },
  alternates: {
    canonical: "https://firechess.com/puzzles",
  },
};

export default function PuzzlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
