import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chaos Chess — Free Online Chess Variant with Power-ups",
  description:
    "Play Chaos Chess free online — a chess variant where both players draft permanent piece power-ups every 5 turns. Knooks, ghost rooks, nuclear queens and more. No download required.",
  keywords: [
    "chaos chess",
    "chess variants online",
    "chess with power ups",
    "chess power-ups game",
    "online chess variant",
    "chess roguelike",
    "chess modifiers",
    "chess draft mode",
    "fun chess variants",
    "free chess variant",
    "chess with special pieces",
    "fairy chess online",
    "chess variants to play",
    "chess variant free",
  ],
  openGraph: {
    title: "Chaos Chess — Free Online Chess Variant with Power-ups",
    description:
      "Draft permanent piece power-ups every 5 turns. Knooks, ghost rooks, nuclear queens. Play free vs AI or friends — no download needed.",
    url: "https://firechess.com/chaos",
    siteName: "FireChess",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaos Chess — Free Online Chess Variant with Power-ups",
    description:
      "Both players draft permanent piece power-ups every 5 turns. Free to play vs AI or friends.",
  },
  alternates: {
    canonical: "https://firechess.com/chaos",
  },
};

export default function ChaosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
