import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chess Coach — Instructional Game Narration",
  description:
    "Import any PGN or pick a famous game to get move-by-move instructional coaching with Stockfish analysis. Learn tactics, patterns, and positional ideas narrated in plain English.",
  openGraph: {
    title: "Chess Coach — Instructional Game Narration | FireChess",
    description:
      "Move-by-move chess coaching with Stockfish analysis. Understand every tactic, pattern, and positional idea as they happen.",
    url: "https://firechess.com/coach",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Coach — Instructional Game Narration | FireChess",
  },
  alternates: { canonical: "https://firechess.com/coach" },
};

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
