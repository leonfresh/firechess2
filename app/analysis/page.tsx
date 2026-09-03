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
    <div className="min-h-screen bg-[#070608] text-white">
      {/* Full-width layout — analysis boards get all the room they can use */}
      <div className="px-4 py-6 sm:px-6 sm:py-8 xl:px-12">
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
