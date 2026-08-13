"use client";

import { useMemo } from "react";
import Link from "next/link";
import { TacticPuzzleBoard } from "@/components/tactic-puzzle-board";

type FlashcardPost = {
  slug: string;
  title: string;
  prompt: string;
  description: string | null;
  startFen: string;
  orientation: "white" | "black";
  kind: string;
  previousMove?: {
    san: string;
    uci: string;
    color: "w" | "b";
    moveNumber: number;
  };
  solution: Array<{
    san: string;
    uci: string;
    color: "w" | "b";
    moveNumber: number;
  }>;
};

function formatLineMove(move: NonNullable<FlashcardPost["previousMove"]>) {
  return move.color === "w"
    ? `${move.moveNumber}. ${move.san}`
    : `${move.moveNumber}... ${move.san}`;
}

export function CommunityFlashcards({ posts }: { posts: FlashcardPost[] }) {
  const examples = useMemo(
    () =>
      posts.map((post) => ({
        fen: post.startFen,
        orientation: post.orientation,
        puzzle: post.solution[0].san,
        continuation: post.solution
          .slice(1)
          .map((move) => move.san)
          .join(", "),
        caption: `${post.title} — ${post.prompt}`,
      })),
    [posts],
  );

  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-[#1e1a24] bg-[#ff5a1f]/[0.04] p-6 sm:p-7">
        <h2 className="text-lg font-bold text-white">Flashcard Review</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8d8696]">
          This profile has not shared any verified puzzle posts yet. Flashcard
          mode now only includes existing community puzzles with stored solve
          lines, so every card can be played out like a real puzzle.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#1e1a24] bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_30%),rgba(255,255,255,0.03)] p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Flashcard Review</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8d8696]">
            This deck now uses only verified puzzle posts from the profile. Pick
            the move on the board, then keep playing the line as each opponent
            reply autoplays between your turns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 font-semibold text-fuchsia-200">
            {posts.length} verified {posts.length === 1 ? "puzzle" : "puzzles"}
          </span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-200">
            Opponent reply autoplays
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_22rem] xl:items-start">
        <TacticPuzzleBoard
          tacticName="Community Flashcards"
          examples={examples}
        />

        <div className="space-y-4">
          <div className="rounded-2xl border border-[#1e1a24] bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#565061]">
              How This Mode Works
            </p>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[#f0edf2]">
              <p>
                1. The deck only includes community posts that already have a
                stored puzzle line.
              </p>
              <p>2. You make the first move yourself on the board.</p>
              <p>
                3. After each correct move, the opponent reply autoplays and
                then you keep going until the stored line is finished.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1e1a24] bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#565061]">
              Puzzle Deck
            </p>
            <div className="mt-3 space-y-3">
              {posts.map((post, index) => (
                <div
                  key={post.slug}
                  className="rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.04] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-300">
                        Puzzle {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {post.title}
                      </p>
                    </div>
                    <span className="rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.05] px-2.5 py-1 text-[11px] text-[#8d8696]">
                      {post.kind}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-[#8d8696]">
                    {post.prompt}
                  </p>

                  <div className="mt-3 rounded-xl border border-[#1e1a24] bg-black/20 px-3 py-2 text-xs text-[#f0edf2]">
                    {post.previousMove ? (
                      <>
                        <span className="text-[#565061]">Last move:</span>{" "}
                        <span className="font-mono text-white">
                          {formatLineMove(post.previousMove)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#565061]">Puzzle start:</span>{" "}
                        <span className="font-mono text-white">
                          {post.orientation === "white"
                            ? "White to move"
                            : "Black to move"}
                        </span>
                      </>
                    )}
                  </div>

                  {post.description && (
                    <p className="mt-2 text-xs leading-relaxed text-[#565061]">
                      {post.description}
                    </p>
                  )}

                  <Link
                    href={`/community/${post.slug}#play-puzzle`}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
                  >
                    Open original puzzle →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
