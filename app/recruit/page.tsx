import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Skip SSR entirely — component depends on localStorage, window, and Stockfish WASM
const RecruitChess = dynamic(
  () => import("@/components/recruit-chess").then((m) => m.RecruitChess),
  { ssr: false, loading: () => null },
);

export const metadata: Metadata = {
  title: "Recruit Chess — Build Your Army | FireChess",
  description:
    "Draft chaos-powered chess pieces from a rotating shop, upgrade duplicates to legendary tier, and watch Stockfish auto-battle your army in fully animated fights. Go viral with the Nuclear Queen.",
  openGraph: {
    title: "Recruit Chess — Build Your Army",
    description: "Draft pieces. Assign chaos modifiers. Watch your army fight.",
  },
};

export default function RecruitPage() {
  return <RecruitChess />;
}
