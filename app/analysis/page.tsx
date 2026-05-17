import type { Metadata } from "next";
import { PositionAnalysisBoard } from "@/components/position-analysis-board";

export const metadata: Metadata = {
  title: "Analysis Board — Explore any position | FireChess",
  description:
    "Start from the default chess position or load a FEN and analyze it with a clean Stockfish-powered board.",
};

export default async function AnalysisBoardPage({
  searchParams,
}: {
  searchParams: Promise<{
    fen?: string;
    orientation?: string;
    title?: string;
  }>;
}) {
  const params = await searchParams;
  const fen = params.fen?.trim() || undefined;
  const orientation = params.orientation === "black" ? "black" : "white";
  const title = params.title?.trim() || "Analysis board";

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <PositionAnalysisBoard
          initialFen={fen}
          initialOrientation={orientation}
          title={title}
          subtitle="Start from the default board or load any FEN, then play branches and inspect the engine live."
        />
      </div>
    </div>
  );
}
