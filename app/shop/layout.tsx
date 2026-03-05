import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coin Shop — Board Themes & Piece Sets",
  description:
    "Spend your earned coins on custom board themes and piece sets. Personalize your FireChess experience with unique visual styles.",
  openGraph: {
    title: "Coin Shop — Board Themes & Piece Sets | FireChess",
    description:
      "Spend coins on custom board themes and piece sets. Personalize your chess experience.",
    url: "https://firechess.com/shop",
    type: "website",
  },
  alternates: { canonical: "https://firechess.com/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
