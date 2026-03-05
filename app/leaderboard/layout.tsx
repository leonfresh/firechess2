import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — Top Analysis Scores",
  description:
    "See who has the highest chess analysis scores on FireChess. Compare your opening accuracy, tactical skill, and endgame precision with players worldwide.",
  openGraph: {
    title: "Leaderboard — Top Analysis Scores | FireChess",
    description:
      "See who has the highest chess analysis scores. Compare your accuracy with players worldwide.",
    url: "https://firechess.com/leaderboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leaderboard — Top Analysis Scores | FireChess",
    description:
      "Top chess analysis scores. Compare your accuracy with players worldwide.",
  },
  alternates: { canonical: "https://firechess.com/leaderboard" },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
