"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Chessboard } from "@/components/chessboard-compat";
import { Chess } from "chess.js";

export interface PuzzleExample {
  /** Starting FEN */
  fen: string;
  /** Orientation of the board */
  orientation: "white" | "black";
  /** Winning move in SAN (e.g. "Nc7+"). Used to validate the user's move. */
  puzzle: string;
  /** Comma-separated SAN moves to play automatically after the puzzle is solved */
  continuation: string;
  /** Short prompt shown below the board */
  caption: string;
}

interface TacticPuzzleBoardProps {
  examples: PuzzleExample[];
  tacticName: string;
}

type Status = "idle" | "correct" | "wrong" | "revealed";

export function TacticPuzzleBoard({
  examples,
  tacticName,
}: TacticPuzzleBoardProps) {
  const [exIdx, setExIdx] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [displayFen, setDisplayFen] = useState(examples[0].fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongBlink, setWrongBlink] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const example = examples[exIdx];

  // Pre-compute correct move's from/to squares
  const correctMoveRef = useRef<{ from: string; to: string } | null>(null);
  useEffect(() => {
    try {
      const chess = new Chess(example.fen);
      const result = chess.move(example.puzzle);
      if (result) correctMoveRef.current = { from: result.from, to: result.to };
    } catch {
      correctMoveRef.current = null;
    }
  }, [example.fen, example.puzzle]);

  const playContinuation = useCallback((startFen: string, moves: string) => {
    const moveList = moves
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (!moveList.length) return;
    const fens: string[] = [];
    try {
      const chess = new Chess(startFen);
      for (const m of moveList) {
        const r = chess.move(m);
        if (!r) break;
        fens.push(chess.fen());
      }
    } catch {
      return;
    }

    let i = 0;
    const tick = () => {
      if (i >= fens.length) return;
      setDisplayFen(fens[i]);
      i++;
      timerRef.current = setTimeout(tick, 1100);
    };
    timerRef.current = setTimeout(tick, 700);
  }, []);

  const handleCorrect = useCallback(
    (fenAfterMove: string) => {
      setDisplayFen(fenAfterMove);
      setStatus("correct");
      setSelected(null);
      playContinuation(fenAfterMove, example.continuation);
    },
    [example.continuation, playContinuation],
  );

  const tryMove = useCallback(
    (from: string, to: string): boolean => {
      if (status !== "idle") return false;
      const correct = correctMoveRef.current;
      if (!correct) return false;

      if (from === correct.from && to === correct.to) {
        try {
          const chess = new Chess(example.fen);
          chess.move({ from, to, promotion: "q" });
          handleCorrect(chess.fen());
          return true;
        } catch {
          return false;
        }
      }

      // Wrong move
      setWrongBlink(true);
      setTimeout(() => setWrongBlink(false), 600);
      setSelected(null);
      return false;
    },
    [status, example.fen, handleCorrect],
  );

  const showSolution = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      const chess = new Chess(example.fen);
      const result = chess.move(example.puzzle);
      if (!result) return;
      setDisplayFen(chess.fen());
      setStatus("revealed");
      setSelected(null);
      playContinuation(chess.fen(), example.continuation);
    } catch {
      /* */
    }
  }, [example, playContinuation]);

  const reset = useCallback(
    (idx: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setExIdx(idx);
      setStatus("idle");
      setDisplayFen(examples[idx].fen);
      setSelected(null);
      setWrongBlink(false);
    },
    [examples],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Click-to-move: first click selects, second click places
  const handleSquareClick = useCallback(
    (square: string) => {
      if (status !== "idle") return;
      if (!selected) {
        const chess = new Chess(example.fen);
        const piece = chess.get(square as Parameters<typeof chess.get>[0]);
        const turn = chess.turn();
        if (piece && piece.color === turn) setSelected(square);
      } else {
        if (square === selected) {
          setSelected(null);
          return;
        }
        const moved = tryMove(selected, square);
        if (!moved) {
          // Maybe they clicked another own piece instead
          const chess = new Chess(example.fen);
          const piece = chess.get(square as Parameters<typeof chess.get>[0]);
          const turn = chess.turn();
          if (piece && piece.color === turn) {
            setSelected(square);
            return;
          }
        }
        setSelected(null);
      }
    },
    [status, selected, example.fen, tryMove],
  );

  const handlePieceDrop = useCallback(
    (from: string, to: string): boolean => {
      if (status !== "idle") return false;
      setSelected(null);
      return tryMove(from, to);
    },
    [status, tryMove],
  );

  const whoMoves = example.orientation === "white" ? "White" : "Black";
  const borderColor =
    status === "correct"
      ? "border-emerald-500/50"
      : wrongBlink
        ? "border-red-500/60"
        : status === "revealed"
          ? "border-amber-500/40"
          : "border-white/[0.08]";

  const highlightStyles: Record<string, React.CSSProperties> = selected
    ? { [selected]: { backgroundColor: "rgba(255, 210, 0, 0.45)" } }
    : {};

  return (
    <div className="space-y-4">
      {/* Puzzle tabs */}
      {examples.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {examples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => reset(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                i === exIdx
                  ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                  : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              Puzzle {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* Board */}
        <div
          className={`relative overflow-hidden rounded-xl border shadow-lg transition-all duration-300 ${borderColor}`}
          style={{ maxWidth: 420, width: "100%" }}
        >
          {/* Status banner */}
          {status !== "idle" && (
            <div
              className={`absolute left-2 right-2 top-2 z-10 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold backdrop-blur ${
                status === "correct"
                  ? "bg-emerald-900/80 text-emerald-300"
                  : "bg-amber-900/80 text-amber-300"
              }`}
            >
              {status === "correct"
                ? "✓ Correct! Playing out the continuation…"
                : `Solution: ${example.puzzle}`}
            </div>
          )}

          <Chessboard
            id={`tactic-puzzle-${exIdx}-${example.fen.slice(0, 10)}`}
            position={displayFen}
            boardOrientation={example.orientation}
            arePiecesDraggable={status === "idle"}
            animationDuration={240}
            onPieceDrop={handlePieceDrop}
            onSquareClick={handleSquareClick}
            customDarkSquareStyle={{ backgroundColor: "#779952" }}
            customLightSquareStyle={{ backgroundColor: "#edeed1" }}
            customSquareStyles={highlightStyles}
          />
        </div>

        {/* Sidebar: prompt + buttons */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:pt-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
              {whoMoves} to move
            </p>
            <p className="mt-1.5 text-sm font-medium leading-snug text-stone-200">
              {example.caption}
            </p>

            {wrongBlink && (
              <p className="mt-2 text-xs font-semibold text-red-400">
                ✗ Not quite — try another move
              </p>
            )}

            {status === "correct" && (
              <p className="mt-2 text-xs font-semibold text-emerald-400">
                ✓ {example.puzzle}! Perfect — watch the continuation play out.
              </p>
            )}

            {status === "revealed" && (
              <p className="mt-2 text-xs text-amber-300">
                The winning move was{" "}
                <span className="font-mono font-bold">{example.puzzle}</span> —
                study the continuation to understand why.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {status === "idle" && (
              <button
                type="button"
                onClick={showSolution}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                Show solution
              </button>
            )}
            {status !== "idle" && (
              <button
                type="button"
                onClick={() => reset(exIdx)}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                ↺ Try again
              </button>
            )}
            {examples.length > 1 &&
              exIdx < examples.length - 1 &&
              status !== "idle" && (
                <button
                  type="button"
                  onClick={() => reset(exIdx + 1)}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
                >
                  Next puzzle →
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
