import type { Metadata } from "next";
import { ModernLanding } from "@/components/modern-preview/landing";

export const metadata: Metadata = {
  title: "Homepage preview | FireChess",
  robots: { index: false, follow: false },
};

export default function NewLandingPage() {
  return <ModernLanding />;
}
