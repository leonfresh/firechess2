import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chaos Chess Leaderboard — ELO Rankings",
  description:
    "The Chaos Chess ELO leaderboard. Ratings start at 1200 and update after every ranked game — see who tops the ladder.",
  openGraph: {
    title: "Chaos Chess Leaderboard — ELO Rankings | FireChess",
    description:
      "The Chaos Chess ELO leaderboard. Ratings start at 1200 and update after every ranked game.",
    url: "https://www.firechess.com/leaderboard/chaos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaos Chess Leaderboard — ELO Rankings | FireChess",
    description:
      "The Chaos Chess ELO leaderboard — ratings update after every ranked game.",
  },
  alternates: { canonical: "https://www.firechess.com/leaderboard/chaos" },
};

export default function ChaosLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
