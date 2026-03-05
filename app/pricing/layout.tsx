import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Free & Pro Plans",
  description:
    "Compare FireChess Free and Pro plans. Unlock unlimited game scans, deeper engine analysis (depth 22), full tactic & endgame reports, and more. Upgrade or get lifetime access.",
  openGraph: {
    title: "FireChess Pricing — Free & Pro Plans",
    description:
      "Compare Free and Pro plans. Unlock unlimited scans, deeper analysis, full reports, and more.",
    url: "https://firechess.com/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FireChess Pricing — Free & Pro Plans",
    description:
      "Compare Free and Pro plans. Unlimited scans, deeper analysis, full reports.",
  },
  alternates: { canonical: "https://firechess.com/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
