import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opening Explorer — Chess Opening Guides & Stats",
  description:
    "Explore chess openings with interactive guides, win-rate statistics, and key variations. See which openings work best for your playing style and rating range.",
  openGraph: {
    title: "Opening Explorer — Chess Opening Guides & Stats | FireChess",
    description:
      "Explore chess openings with interactive guides, win-rate statistics, and key variations.",
    url: "https://firechess.com/openings",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Opening Explorer — Chess Opening Guides & Stats | FireChess",
    description:
      "Interactive chess opening guides with win-rate statistics and key variations.",
  },
  alternates: { canonical: "https://firechess.com/openings" },
};

export default function OpeningsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
