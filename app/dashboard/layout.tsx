import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Your Analysis History",
  description:
    "View your saved analysis reports, track improvement over time, and review your chess strengths and weaknesses on your personal FireChess dashboard.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://firechess.com/dashboard" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
