import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback — Send Us Your Thoughts",
  description:
    "Share feedback, report bugs, or suggest features for FireChess. We read every message and use your input to improve the platform.",
  openGraph: {
    title: "Feedback | FireChess",
    description:
      "Share feedback, report bugs, or suggest features for FireChess.",
    url: "https://firechess.com/feedback",
    type: "website",
  },
  alternates: { canonical: "https://firechess.com/feedback" },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
