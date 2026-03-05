import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings",
  description:
    "Manage your FireChess account, subscription, and preferences.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://firechess.com/account" },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
