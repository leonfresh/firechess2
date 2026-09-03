"use client";

/**
 * BestGameReplay — shared mini step-through for the "best game" highlight.
 *
 * Used by three surfaces so the board behaves identically everywhere:
 *   - the guided tour's best-game step (dark takeover),
 *   - the full report's "Your best game" section (Ember & Ink),
 *   - (the standalone /best-game page has its own full-game replay).
 *
 * The component is intentionally style-neutral: it renders the themed board
 * plus minimal transport controls. Callers supply the surrounding card,
 * headline copy and stats.
 *
 * Replays the last N plies of the picked game (BestGame.tail). Step index 0
 * shows the position BEFORE the first tail move, so users can rewind into
 * the finish. When the game ended in mate, the tail's final ply is the
 * mating move and gets a highlighted chip.
 */

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { useBoardSize } from "@/lib/use-board-size";
import {
  useBoardTheme,
  useCustomPieces,
  useShowCoordinates,
} from "@/lib/use-coins";
import type { BestGame } from "@/lib/best-game";

export function BestGameReplay({
  bestGame,
  accentClass = "border-[#1e1a24] bg-[#121015] text-[#f0edf2] hover:border-[#ff5a1f]/25",
  chipClass = "bg-[#121015] border-[#1e1a24] text-[#8d8696]",
}: {
  bestGame: BestGame;
  /** Class overrides so the controls adapt to the hosting surface's palette. */
  accentClass?: string;
  chipClass?: string;
}) {
  const { ref: boardRef, size: boardSize } = useBoardSize(440, { evalBar: false });
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();

  const tail = bestGame.tail;
  const [step, setStep] = useState(tail.length);

  // Reset to the end whenever a different game is shown (e.g. result refresh).
  useEffect(() => {
    setStep(tail.length);
  }, [tail]);
  const startFen = useMemo(() => {
    try {
      return tail.length > 0 ? tail[0].fenBefore : new Chess().fen();
    } catch {
      return new Chess().fen();
    }
  }, [tail]);

  const pos = step === 0 ? startFen : tail[step - 1].fenAfter;
  const current = step > 0 ? tail[step - 1] : null;

  // Square highlights: last-move from/to tinted; king-in-check square red.
  const highlightStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (!current) return styles;
    styles[current.from] = {
      backgroundColor: "rgba(255,138,66,0.55)",
      borderRadius: "4px",
    };
    styles[current.to] = {
      backgroundColor: current.isMate
        ? "rgba(239,68,68,0.55)"
        : "rgba(255,138,66,0.30)",
      borderRadius: "4px",
    };
    if (current.isCheck && !current.isMate) {
      // Mark the checked king square via the board scan.
      try {
        const c = new Chess(current.fenAfter);
        const rows = c.board();
        outer: for (let r = 0; r < 8; r++) {
          for (let f = 0; f < 8; f++) {
            const sq = rows[r][f];
            if (sq && sq.type === "k") {
              styles[`${"abcdefgh"[f]}${8 - r}`] = {
                backgroundColor: "rgba(239,68,68,0.4)",
                borderRadius: "4px",
              };
              break outer;
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
    return styles;
  }, [current]);

  const atStart = step === 0;
  const atEnd = step >= tail.length;

  const plyOf = (i: number) => tail[i - 1];
  const moveLabel = (i: number) => {
    const p = plyOf(i);
    return p.color === "w" ? `${p.moveNumber}. ${p.san}` : `${p.moveNumber}… ${p.san}`;
  };

  const orientation = bestGame.userColor === "black" ? "black" : "white";
  const boardId = `best-game-replay-${bestGame.index}-${bestGame.mate?.san ?? "plain"}`;

  return (
    <div className="w-full">
      <div ref={boardRef} className="mx-auto w-full">
        <div className="overflow-hidden rounded-xl border border-[#1e1a24] shadow-lg shadow-black/30">
          <Chessboard
            id={boardId}
            position={pos}
            boardOrientation={orientation}
            boardWidth={boardSize}
            arePiecesDraggable={false}
            customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
            customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
            customSquareStyles={highlightStyles}
            showBoardNotation={showCoords}
            customPieces={customPieces}
          />
        </div>
      </div>

      {/* Transport controls */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={atStart}
          onClick={() => setStep(0)}
          aria-label="Rewind to before the finish"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${accentClass}`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={atStart}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          aria-label="Previous move"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${accentClass}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[6.5rem] text-center font-mono text-sm font-semibold text-white">
          {current ? moveLabel(step) : step > 0 ? "—" : "Start"}
        </span>
        <button
          type="button"
          disabled={atEnd}
          onClick={() => setStep((s) => Math.min(tail.length, s + 1))}
          aria-label="Next move"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${accentClass}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={atEnd}
          onClick={() => setStep(tail.length)}
          aria-label="Jump to the final position"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${accentClass}`}
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* SAN chips — clickable step-through */}
      {tail.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {tail.map((p, i) => {
            const idx = i + 1;
            const active = step === idx;
            return (
              <button
                key={`${p.moveNumber}-${p.san}-${i}`}
                type="button"
                onClick={() => setStep(idx)}
                className={`rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold transition ${
                  active
                    ? "border-[#ff5a1f]/40 bg-[#ff5a1f]/[0.12] text-[#ff8c42]"
                    : p.isMate
                      ? "border-red-500/30 bg-red-500/[0.08] text-red-300"
                      : chipClass
                }`}
              >
                {moveLabel(idx)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
