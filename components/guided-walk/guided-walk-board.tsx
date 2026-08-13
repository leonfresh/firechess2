"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { Chessboard, type CbSquare, type PromotionPieceOption } from "@/components/chessboard-compat";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useCustomPieces, useShowCoordinates } from "@/lib/use-coins";

/* ────────────────────────────────────────────────────────────────────────
 * GuidedWalkBoard
 *
 * A lightweight, always-open chessboard for the guided walkthrough. Two modes:
 *
 *  - "static": renders the position with arrows comparing the user's move
 *    (red) vs the engine's best move (green). Used for Step 2 (the leak).
 *  - "interactive": a solve-or-reveal micro-interaction — the user drags the
 *    best move and gets instant feedback. Used for Step 3 (the tactic).
 *
 * This deliberately does NOT reuse DrillMode, which is a collapsible batch
 * trainer (closed by default). The walkthrough needs the board visible
 * immediately with no extra chrome.
 * ──────────────────────────────────────────────────────────────────────── */

type Props = {
  fen: string;
  /** The user's actual (wrong) move, UCI or SAN. */
  userMove?: string | null;
  /** The engine's best move, UCI or SAN. */
  bestMove?: string | null;
  /** Who the user plays as — sets board orientation. */
  userColor: "white" | "black";
  mode: "static" | "interactive";
  /** Praise mode: highlight the user's move as a great find (green) instead of
   *  the usual red "you played / green best move" contrast. Used for brilliant
   *  moves, where the user's move IS the move worth celebrating. */
  praise?: boolean;
  /** Fired (once) when the user plays the correct best move in interactive
   *  mode. Lets a parent (e.g. the recap trainer) track solves + auto-advance
   *  without re-implementing move matching. */
  onSolved?: () => void;
};

type Sq = { from: string; to: string; promotion?: string };

function isUci(m: string): boolean {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m);
}

/** Resolve a UCI or SAN move against a FEN into from/to squares. */
function resolve(fen: string, move: string | null | undefined): Sq | null {
  if (!move) return null;
  try {
    const c = new Chess(fen);
    if (isUci(move)) {
      const r = c.move({
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        promotion: (move.slice(4, 5) || undefined) as PieceSymbol | undefined,
      });
      return r ? { from: r.from, to: r.to, promotion: r.promotion ?? undefined } : null;
    }
    const r = c.move(move);
    return r ? { from: r.from, to: r.to, promotion: r.promotion ?? undefined } : null;
  } catch {
    return null;
  }
}

export function GuidedWalkBoard({ fen, userMove, bestMove, userColor, mode, praise, onSolved }: Props) {
  const { ref, size } = useBoardSize(420, { evalBar: false });
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();

  const userSq = useMemo(() => resolve(fen, userMove), [fen, userMove]);
  const bestSq = useMemo(() => resolve(fen, bestMove), [fen, bestMove]);

  // Interactive state
  const [solved, setSolved] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [fenState, setFenState] = useState(fen);
  const [selected, setSelected] = useState<CbSquare | null>(null);
  const [highlight, setHighlight] = useState<Sq | null>(null);

  // Reset when the position changes.
  useEffect(() => {
    setFenState(fen);
    setSolved(false);
    setAttempted(false);
    setSelected(null);
    setHighlight(null);
  }, [fen]);

  const arrows = useMemo(() => {
    const list: [string, string, string?][] = [];
    if (mode === "static") {
      if (praise) {
        // Praise: the user's move is the hero — a single bold green arrow.
        if (userSq) list.push([userSq.from, userSq.to, "#22c55e"]);
      } else {
        // Best move first (drawn under) in green; user move in red on top.
        if (bestSq) list.push([bestSq.from, bestSq.to, "#22c55e"]);
        if (userSq) list.push([userSq.from, userSq.to, "#ef4444"]);
      }
    } else {
      // Interactive: show the best-move hint in green so the user has a target,
      // and the user's own move (red) once they've attempted and missed.
      if (bestSq) list.push([bestSq.from, bestSq.to, "#22c55e"]);
      if (attempted && !solved && userSq) {
        list.push([userSq.from, userSq.to, "#ef4444"]);
      }
    }
    return list;
  }, [bestSq, userSq, mode, attempted, solved, praise]);

  function legalMovesFrom(square: string): string[] {
    try {
      const c = new Chess(fenState);
      return c.moves({ square: square as never, verbose: true }).map((m) => m.to);
    } catch {
      return [];
    }
  }

  function onDrop(sourceSq: string, targetSq: string, promo?: PieceSymbol): boolean {
    if (solved) return false;
    try {
      const c = new Chess(fenState);
      const r = c.move({ from: sourceSq, to: targetSq, promotion: promo });
      if (!r) return false;

      setAttempted(true);
      // Correct if it lands on the best move's target (and from, if available).
      const correct =
        (!bestSq || bestSq.from === sourceSq) && bestSq?.to === targetSq;
      if (correct) {
        setSolved(true);
        setHighlight({ from: sourceSq, to: targetSq });
        setFenState(c.fen());
        onSolved?.();
        return true;
      }
      // Wrong — show the best move as a hint, snap back.
      setHighlight(bestSq);
      return false;
    } catch {
      return false;
    }
  }

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  // In static mode, tint squares. Praise mode celebrates the user's move
  // (green); the normal contrast shows the user's move red vs best green.
  if (mode === "static") {
    const userTint = praise ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)";
    if (userSq) {
      customSquareStyles[userSq.from] = { background: userTint };
      customSquareStyles[userSq.to] = { background: userTint };
    }
    if (!praise && bestSq) {
      customSquareStyles[bestSq.from] = {
        ...(customSquareStyles[bestSq.from] ?? {}),
        boxShadow: "inset 0 0 0 3px rgba(34,197,94,0.6)",
      };
      customSquareStyles[bestSq.to] = {
        boxShadow: "inset 0 0 0 3px rgba(34,197,94,0.6)",
      };
    }
  }
  // In interactive mode, highlight last attempt.
  if (mode === "interactive" && highlight) {
    if (solved) {
      customSquareStyles[highlight.from] = { background: "rgba(34,197,94,0.4)" };
      customSquareStyles[highlight.to] = { background: "rgba(34,197,94,0.4)" };
    } else if (attempted) {
      customSquareStyles[highlight.from] = { background: "rgba(239,68,68,0.3)" };
      customSquareStyles[highlight.to] = { background: "rgba(239,68,68,0.3)" };
    }
  }

  return (
    <div ref={ref} className="mx-auto w-full max-w-[420px]">
      <div className="overflow-hidden rounded-xl shadow-lg shadow-black/30">
        <Chessboard
          id={`guided-${mode}-${fen.slice(0, 8)}`}
          position={fenState}
          boardOrientation={userColor}
          boardWidth={size}
          arePiecesDraggable={mode === "interactive" && !solved}
          onPieceDrop={(from, to, promo) => {
            const ok = onDrop(from, to, promo as PieceSymbol | undefined);
            return ok;
          }}
          customArrows={arrows as never}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          customSquareStyles={customSquareStyles}
          showBoardNotation={showCoords}
          customPieces={customPieces}
        />
      </div>

      {mode === "interactive" && (
        <div className="mt-3 text-center text-sm">
          {solved ? (
            <p className="font-semibold text-emerald-400">
              ✓ Correct — that&apos;s the move.
            </p>
          ) : attempted ? (
            <p className="font-medium text-red-400">
              Not quite. The green arrow shows the best move — try again.
            </p>
          ) : (
            <p className="text-[#8d8696]">
              Drag the best move for{" "}
              {userColor === "white" ? "White" : "Black"}.
            </p>
          )}
        </div>
      )}

      {mode === "static" && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          {praise ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
              Your move
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-[#8d8696]">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                You played
              </span>
              <span className="flex items-center gap-1.5 text-[#8d8696]">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                Best move
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Silence the unused-import lint for PromotionPieceOption (kept for parity with
// the chessboard-compat API surface; referenced in callbacks via CbSquare).
export type { CbSquare, PromotionPieceOption };
