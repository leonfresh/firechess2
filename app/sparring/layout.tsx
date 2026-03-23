import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opening Sparring — FireChess",
  description:
    "Practice your openings against real Lichess database moves weighted by your target rating. When the book runs out, continue with Stockfish at equivalent strength.",
  openGraph: {
    title: "Opening Sparring | FireChess",
    description:
      "Spar against real human moves from millions of Lichess games, filtered by rating and blunder-checked before play.",
    url: "https://firechess.com/sparring",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Opening Sparring | FireChess",
    description:
      "Play against weighted Lichess book moves at your target rating, then continue with Stockfish when the book runs out.",
  },
  alternates: { canonical: "https://firechess.com/sparring" },
};

export default function SparringLayout({ children }: { children: React.ReactNode }) {
  return children;
}
