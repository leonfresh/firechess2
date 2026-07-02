import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube Creator Partnership — Free Pro Access | FireChess",
  description:
    "Get free FireChess Pro for your channel. Analyze games on stream, give viewers a promo code, and earn 30% recurring commission on every upgrade.",
  openGraph: {
    title: "YouTube Creator Partnership | FireChess",
    description:
      "Get free FireChess Pro for your channel. Analyze games on stream, give viewers a promo code, and earn 30% recurring commission.",
    url: "https://firechess.com/youtubers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Creator Partnership | FireChess",
    description:
      "Get free FireChess Pro for your channel. Analyze games on stream, give viewers a promo code, and earn 30% recurring commission.",
  },
  alternates: {
    canonical: "https://firechess.com/youtubers",
  },
};

export default function YoutubersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
