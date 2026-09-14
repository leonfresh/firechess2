import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engine Assist — FireChess",
  description:
    "Play a real game with the engine's moves in front of you. Every move is logged assisted or solo, so you find out exactly what the engine is worth to your chess.",
  openGraph: {
    title: "Engine Assist | FireChess",
    description:
      "See what the engine would play against every move — then see what your chess looks like without it. Assisted and solo moves are scored separately.",
    url: "https://firechess.com/assist",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Engine Assist | FireChess",
    description:
      "The legal way to know what the engine would play. Your assisted and engine-free moves are scored side by side.",
  },
  alternates: { canonical: "https://firechess.com/assist" },
};

export default function AssistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
