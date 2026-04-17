import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chess Profile — FireChess",
  description:
    "Your linked chess identity, aggregated weakness data, and auto-generated lesson plan. Share your training plan with your coach.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
