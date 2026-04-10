import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn — Personalized Chess Path",
  description:
    "Your personalized chess learning path built from your scan data.",
  robots: { index: false, follow: false },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
