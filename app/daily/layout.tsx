import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Training — Your Personalized Daily Routine",
  description:
    "A short daily training session tailored to your weaknesses — puzzles and drills drawn from your own games. Build a streak and improve every day.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://firechess.com/daily" },
};

export default function DailyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
