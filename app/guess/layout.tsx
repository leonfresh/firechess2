import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guess the Move — Play Through GM Games",
  description:
    "Test your chess intuition by guessing moves from real grandmaster games. Score points for matching the GM's choices and learn from the best players in history.",
  openGraph: {
    title: "Guess the Move — Play Through GM Games | FireChess",
    description:
      "Test your intuition by guessing GM moves. Score points and learn from the best players in history.",
    url: "https://firechess.com/guess",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess the Move — Play Through GM Games | FireChess",
    description:
      "Guess GM moves and learn from the best players in history.",
  },
  alternates: { canonical: "https://firechess.com/guess" },
};

export default function GuessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
