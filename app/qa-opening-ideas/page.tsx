"use client";

import { OpeningIdeas } from "@/components/opening-ideas";
import type { OpeningIdea } from "@/lib/types";

/** Scratch QA route — renders OpeningIdeas with realistic mock data. */
export default function OpeningIdeasQaPage() {
  const ideas: OpeningIdea[] = [
    {
      fenBefore: "rnbqkb1r/ppp1pppp/5n2/3P4/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
      sideToMove: "black",
      openingName: "Scandinavian Defense: Modern Variation",
      userMove: "Nxd5",
      userMoveCount: 11,
      reachCount: 12,
      userWins: 5,
      userDraws: 2,
      userLosses: 4,
      suggestedMove: "Bg4",
      suggestedUci: "c8g4",
      suggestedWinRate: 0.543,
      suggestedGames: 1852322,
      suggestedOpeningName: "Scandinavian Defense: Portuguese Gambit",
      suggestedEco: "B01",
      userMoveDbWinRate: 0.478,
      userMoveDbGames: 4831855,
      averageRating: 1835,
    },
    {
      fenBefore: "rnbqkbnr/ppp1pppp/8/8/2pP4/5N2/PP2PPPP/RNBQKB1R b KQkq - 0 3",
      sideToMove: "black",
      openingName: "Queen's Gambit Accepted",
      userMove: "Nf6",
      userMoveCount: 9,
      reachCount: 10,
      userWins: 3,
      userDraws: 2,
      userLosses: 4,
      suggestedMove: "a6",
      suggestedUci: "a7a6",
      suggestedWinRate: 0.466,
      suggestedGames: 161760,
      suggestedOpeningName: "Queen's Gambit Accepted: Alekhine Defense",
      suggestedEco: "D22",
      userMoveDbWinRate: 0.438,
      userMoveDbGames: 1215291,
      averageRating: 1911,
    },
  ];

  return (
    <main
      className="min-h-screen bg-[#070608] px-6 py-10"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-bold text-white">QA: OpeningIdeas</h1>
        <OpeningIdeas ideas={ideas} onOpenAnalysis={() => {}} />
        <OpeningIdeas ideas={[]} onOpenAnalysis={() => {}} />
        <p className="text-xs text-[#565061]">
          Above: two cards with real DB numbers. The empty case renders null.
        </p>
      </div>
    </main>
  );
}
