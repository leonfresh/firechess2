"use client";

import { GameReview } from "@/components/game-review";

export function ReviewPageClient({ initialPgn }: { initialPgn?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Game Review</h1>
        <p className="mt-1 text-sm text-slate-400">
          Analyze any game move by move with Stockfish 18 — quality badges, eval graph, and per-move commentary.
        </p>
      </div>
      <GameReview initialPgn={initialPgn} />
    </div>
  );
}
