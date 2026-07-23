import type { Metadata } from "next";
import { ReviewPageClient } from "./client";

export const metadata: Metadata = {
  title: "Game Review — Analyze any game | FireChess",
  description:
    "Paste a PGN, load your Lichess/Chess.com games, or review a scanned game. Stockfish-powered move analysis with per-move badges and LLM commentary.",
};

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ pgn?: string }>;
}) {
  const params = await searchParams;
  const initialPgn = params.pgn ? decodeURIComponent(params.pgn) : undefined;

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <ReviewPageClient initialPgn={initialPgn} />
      </div>
    </div>
  );
}
