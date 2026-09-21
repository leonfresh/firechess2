import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coin Leaderboard — Most Coins Earned",
  description:
    "See who has earned the most FireChess coins. Ranked by lifetime coins earned from daily puzzles, study tasks, scans and streaks — spending in the Coin Shop never costs you your rank.",
  openGraph: {
    title: "Coin Leaderboard — Most Coins Earned | FireChess",
    description:
      "Ranked by lifetime coins earned from daily puzzles, study tasks, scans and streaks.",
    url: "https://www.firechess.com/leaderboard/coins",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coin Leaderboard — Most Coins Earned | FireChess",
    description:
      "Ranked by lifetime coins earned across FireChess.",
  },
  alternates: { canonical: "https://www.firechess.com/leaderboard/coins" },
};

export default function CoinLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
