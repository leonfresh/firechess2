import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guess the Elo — Chess Roast Mode",
  description:
    "Watch real chess games and guess the players' Elo rating. Get hilarious roast commentary on blunders and brilliant moves. A fun way to train your chess intuition.",
  openGraph: {
    title: "Guess the Elo — Chess Roast Mode | FireChess",
    description:
      "Watch real games and guess the Elo. Get hilarious roast commentary on blunders and brilliant moves.",
    url: "https://firechess.com/roast",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess the Elo — Chess Roast Mode | FireChess",
    description:
      "Guess the Elo and get roasted. A fun way to train your chess intuition.",
  },
  alternates: { canonical: "https://firechess.com/roast" },
};

export default function RoastLayout({ children }: { children: React.ReactNode }) {
  return children;
}
