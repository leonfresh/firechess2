"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CommunityBoardPreview } from "@/components/community-board-preview";
import { TacticPuzzleBoard } from "@/components/tactic-puzzle-board";
import {
  formatCommunityLineMove,
  type CommunityPuzzleData,
} from "@/lib/community-shared";

type CommunityPuzzleInlinePlayerProps = {
  fen?: string | null;
  pgn?: string | null;
  orientation?: "white" | "black";
  prompt: string;
  puzzleData: CommunityPuzzleData;
  href?: string;
  size?: number;
  showCoordinates?: boolean;
  defaultPlaying?: boolean;
  showPlayToggle?: boolean;
  showFooterBar?: boolean;
};

export function CommunityPuzzleInlinePlayer({
  fen,
  pgn,
  orientation,
  prompt,
  puzzleData,
  href,
  size = 420,
  showCoordinates = false,
  defaultPlaying = false,
  showPlayToggle = true,
  showFooterBar = true,
}: CommunityPuzzleInlinePlayerProps) {
  const [playing, setPlaying] = useState(defaultPlaying);

  const examples = useMemo(
    () => [
      {
        fen: puzzleData.startFen,
        orientation: puzzleData.orientation,
        puzzle: puzzleData.solution[0].san,
        continuation: puzzleData.solution
          .slice(1)
          .map((move) => move.san)
          .join(", "),
        caption: prompt,
      },
    ],
    [prompt, puzzleData],
  );

  return (
    <div className="min-w-0 space-y-3 pb-1">
      {playing ? (
        <TacticPuzzleBoard
          tacticName="Community Puzzle"
          examples={examples}
          variant="compact"
          showCoordinates={showCoordinates}
        />
      ) : (
        <CommunityBoardPreview
          fen={fen ?? puzzleData.startFen}
          pgn={pgn}
          orientation={orientation ?? puzzleData.orientation}
          size={size}
          showCoordinates={showCoordinates}
        />
      )}

      {(showFooterBar || showPlayToggle || href) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          {showFooterBar ? (
            <div className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-[11px] text-slate-300">
              <span className="font-semibold uppercase tracking-[0.14em] text-slate-500">
                Last Move
              </span>{" "}
              <span className="ml-1 font-mono text-white">
                {formatCommunityLineMove(puzzleData.previousMove)}
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {showPlayToggle && (
              <button
                type="button"
                onClick={() => setPlaying((value) => !value)}
                className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/12 px-3 py-1.5 text-xs font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/45 hover:bg-fuchsia-400/18 hover:text-white"
              >
                {playing ? "Back to preview" : "Play here"}
              </button>
            )}

            {href && (
              <Link
                href={href}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/[0.16] hover:text-white"
              >
                Open full puzzle
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
