import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Puzzle Dungeon — Roguelike Chess Puzzles",
  description:
    "Dive into the Puzzle Dungeon — a roguelike chess puzzle mode. Solve increasingly difficult tactical puzzles, earn rewards, and see how deep you can go.",
  openGraph: {
    title: "Puzzle Dungeon — Roguelike Chess Puzzles | FireChess",
    description:
      "A roguelike chess puzzle mode. Solve increasingly difficult tactical puzzles and see how deep you can go.",
    url: "https://firechess.com/dungeon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Puzzle Dungeon — Roguelike Chess Puzzles | FireChess",
    description:
      "Roguelike chess puzzles. Solve tactics, earn rewards, and go deeper.",
  },
  alternates: { canonical: "https://firechess.com/dungeon" },
};

export default function DungeonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
