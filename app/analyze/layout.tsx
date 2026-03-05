import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analyze Game — PGN Chess Analyzer",
  description:
    "Paste any PGN and get instant move-by-move analysis with Stockfish 18. See blunders, inaccuracies, missed tactics, and improvement suggestions — all in your browser.",
  openGraph: {
    title: "Analyze Game — PGN Chess Analyzer | FireChess",
    description:
      "Paste any PGN for instant move-by-move analysis with Stockfish 18. Find blunders, inaccuracies, and missed tactics.",
    url: "https://firechess.com/analyze",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Analyze Game — PGN Chess Analyzer | FireChess",
    description:
      "Instant move-by-move chess analysis with Stockfish 18.",
  },
  alternates: { canonical: "https://firechess.com/analyze" },
};

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
