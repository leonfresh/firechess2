import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Train — Weakness Trainer",
  description:
    "Practice your weakest areas with targeted chess training. Drill openings, tactics, endgames, and positional play based on your real game mistakes.",
  openGraph: {
    title: "Weakness Trainer | FireChess",
    description:
      "Targeted chess training based on your real game mistakes. Drill openings, tactics, endgames, and positional play.",
    url: "https://firechess.com/train",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weakness Trainer | FireChess",
    description:
      "Targeted chess training based on your real game mistakes.",
  },
  alternates: { canonical: "https://firechess.com/train" },
};

export default function TrainLayout({ children }: { children: React.ReactNode }) {
  return children;
}
