import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chaos Gold Leaderboard — Most Gold Earned",
  description:
    "The Chaos Chess gold leaderboard. Gold is earned by finishing games — 10 a game, +15 for a win, +5 on a timed clock and +25 for your first win of the day. Buying powers spends gold but never costs you your place.",
  openGraph: {
    title: "Chaos Gold Leaderboard — Most Gold Earned | FireChess",
    description:
      "Who has earned the most gold in Chaos Chess, and what they bought with it.",
    url: "https://www.firechess.com/leaderboard/gold",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaos Gold Leaderboard — Most Gold Earned | FireChess",
    description: "The Chaos Chess gold leaderboard.",
  },
  alternates: { canonical: "https://www.firechess.com/leaderboard/gold" },
};

export default function ChaosGoldLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
