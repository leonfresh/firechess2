"use client";

/**
 * OpeningIdeas — "interesting alternatives" surfaced from the Lichess DB.
 *
 * For recurring positions where the user keeps playing the same move, the
 * scan looks for moves they have NOT been playing that the Lichess Opening
 * Explorer scores highly on both axes: popularity (many games) and result
 * (win rate). Named lines get a bonus because discovering "the Portuguese
 * Gambit" is more fun than being told "play the second-best move".
 */

import { useMemo } from "react";
import { Chessboard } from "@/components/chessboard-compat";
import type { OpeningIdea } from "@/lib/types";
import { Lightbulb, ArrowRight, Sparkles } from "lucide-react";

type OpeningIdeasProps = {
  ideas: OpeningIdea[];
  onOpenAnalysis: (idea: OpeningIdea) => void;
};

function isSquare(sq: string): boolean {
  return /^[a-h][1-8]$/.test(sq);
}

function formatGames(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

export function OpeningIdeas({ ideas, onOpenAnalysis }: OpeningIdeasProps) {
  if (ideas.length === 0) return null;

  return (
    <section id="section-opening-ideas" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#565061]">
            Opening Ideas
          </p>
          <h3 className="text-xl font-bold text-white">
            Interesting alternatives worth trying
          </h3>
          <p className="mt-1 text-sm text-[#8d8696]">
            High-win-rate, highly-played database moves you haven&apos;t tried
            from positions you keep reaching.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] px-3 py-1.5 text-[11px] font-semibold text-[#ff8c42]">
          <Sparkles className="h-3 w-3" />
          {ideas.length} idea{ideas.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ideas.map((idea, i) => (
          <OpeningIdeaCard key={`${idea.fenBefore}-${idea.suggestedUci}`} idea={idea} index={i} onOpenAnalysis={onOpenAnalysis} />
        ))}
      </div>
    </section>
  );
}

function OpeningIdeaCard({
  idea,
  index,
  onOpenAnalysis,
}: {
  idea: OpeningIdea;
  index: number;
  onOpenAnalysis: (idea: OpeningIdea) => void;
}) {
  const m = idea.suggestedUci;
  const from = m.slice(0, 2);
  const to = m.slice(2, 4);

  const arrows = useMemo(() => {
    if (!isSquare(from) || !isSquare(to)) return [];
    return [[from, to, "rgba(255, 90, 31, 0.92)"]] as [string, string, string?][];
  }, [from, to]);

  const userMoveTotal = idea.userWins + idea.userDraws + idea.userLosses;
  const userWinRate = userMoveTotal > 0 ? idea.userWins / userMoveTotal : 0;
  const compare = idea.userMoveDbWinRate !== undefined;

  // Spread between suggestion and the move they currently play (DB vs DB).
  const dbDelta =
    compare && idea.userMoveDbWinRate !== undefined
      ? idea.suggestedWinRate - idea.userMoveDbWinRate
      : null;

  const rating = idea.averageRating ? `${Math.round(idea.averageRating)} avg` : "";

  return (
    <div className="flex flex-col rounded-[1.75rem] border border-[#1e1a24] bg-[#121015] p-5 transition hover:border-[#ff5a1f]/25 sm:p-6">
      <div className="flex gap-4">
        {/* Board with suggestion arrow */}
        <div className="relative h-[132px] w-[132px] shrink-0 overflow-hidden rounded-xl border border-[#1e1a24]">
          <Chessboard
            position={idea.fenBefore}
            boardWidth={132}
            boardOrientation={idea.sideToMove}
            arePiecesDraggable={false}
            customArrows={arrows}
            customDarkSquareStyle={{ backgroundColor: "#779952" }}
            customLightSquareStyle={{ backgroundColor: "#edeed1" }}
          />
          <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur">
            {idea.openingName || "Your recurring position"}
          </span>
        </div>

        {/* Copy */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#565061]">
            #{index + 1} · you reach this {idea.reachCount}×
          </p>
          <p className="mt-1.5 text-[13px] text-[#8d8696]">
            You keep playing{" "}
            <span className="font-bold text-[#f0edf2]">{idea.userMove}</span>
            {idea.userMoveCount > 1 ? ` (${idea.userMoveCount}×)` : ""} — but{" "}
            <span className="font-bold text-[#ff8c42]">
              {idea.suggestedMove}
            </span>{" "}
            scores better:
          </p>

          {idea.suggestedOpeningName ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] px-2.5 py-1 text-xs font-semibold text-[#ff8c42]">
              <Lightbulb className="h-3.5 w-3.5" />
              {idea.suggestedOpeningName}
            </p>
          ) : null}

          <div className="mt-3 space-y-2">
            {/* Their current move in DB */}
            {compare && idea.userMoveDbWinRate !== undefined ? (
              <div>
                <div className="flex justify-between text-[10px] text-[#565061]">
                  <span>{idea.userMove} in DB</span>
                  <span>{(idea.userMoveDbWinRate * 100).toFixed(1)}% · {formatGames(idea.userMoveDbGames ?? 0)} games</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1e1a24]">
                  <div
                    className="h-full rounded-full bg-[#8d8696]/50"
                    style={{ width: `${Math.min(100, idea.userMoveDbWinRate * 100)}%` }}
                  />
                </div>
              </div>
            ) : null}

            {/* Suggestion */}
            <div>
              <div className="flex justify-between text-[10px]">
                <span className="font-semibold text-[#ff8c42]">
                  {idea.suggestedMove} — {idea.suggestedOpeningName?.split(": ").pop() ?? "suggested"}
                </span>
                <span className="text-[#565061]">
                  {(idea.suggestedWinRate * 100).toFixed(1)}% · {formatGames(idea.suggestedGames)} games{rating ? ` · ${rating}` : ""}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1e1a24]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff5a1f] to-[#ff8c42]"
                  style={{ width: `${Math.min(100, idea.suggestedWinRate * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {dbDelta !== null && dbDelta > 0.001 ? (
            <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#8d8696]">
              <ArrowRight className="h-3 w-3 text-[#ff5a1f]" />
              +{(dbDelta * 100).toFixed(1)}pp better in the database
            </p>
          ) : null}

          <p className="mt-1 text-[10px] text-[#565061]">
            Your results with {idea.userMove}: {idea.userWins}W {idea.userDraws}D {idea.userLosses}L
            {userMoveTotal > 0 ? ` (${(userWinRate * 100).toFixed(0)}% win rate)` : ""}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2.5 border-t border-[#1e1a24] pt-3.5">
        <button
          type="button"
          onClick={() => onOpenAnalysis(idea)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] px-3.5 py-1.5 text-xs font-semibold text-[#ff8c42] transition hover:bg-[#ff5a1f]/[0.14]"
        >
          Explore this move
        </button>
        <a
          href={`https://lichess.org/analysis/${encodeURIComponent(idea.fenBefore)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#1e1a24] px-3.5 py-1.5 text-xs font-medium text-[#8d8696] transition hover:bg-[#ff5a1f]/[0.08] hover:text-white"
        >
          Open on Lichess
          <span className="text-[10px]">↗</span>
        </a>
      </div>
    </div>
  );
}
