import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — What's New",
  description:
    "Stay up to date with the latest FireChess features, improvements, bug fixes, and design updates. See the full release history.",
  openGraph: {
    title: "Changelog — What's New | FireChess",
    description:
      "Latest FireChess features, improvements, bug fixes, and design updates.",
    url: "https://firechess.com/changelog",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Changelog — What's New | FireChess",
    description:
      "Latest FireChess features, improvements, and updates.",
  },
  alternates: { canonical: "https://firechess.com/changelog" },
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
