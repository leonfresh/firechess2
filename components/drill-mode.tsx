"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { EvalBar } from "@/components/eval-bar";
import { Chessboard } from "react-chessboard";
import type { PositionEvalTrace } from "@/lib/types";

type DrillModeProps = {
  positions: PositionEvalTrace[];
};

type MoveDetails = {
  from: string;
  to: string;
  promotion?: string;
};

function isUci(move: string): boolean {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
}

function parseUci(move: string) {
  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move.slice(4, 5) || undefined
  };
}

function deriveMoveDetails(fen: string, move: string | null): MoveDetails | null {
  if (!move) return null;

  try {
    const chess = new Chess(fen);

    if (isUci(move)) {
      const parsed = parseUci(move);
      const result = chess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined
      });

      if (!result) return null;

      return {
        from: result.from,
        to: result.to,
        promotion: result.promotion ?? undefined
      };
    }

    const result = chess.move(move);
    if (!result) return null;

    return {
      from: result.from,
      to: result.to,
      promotion: result.promotion ?? undefined
    };
  } catch {
    return null;
  }
}

export function DrillMode({ positions }: DrillModeProps) {
  const drillPositions = useMemo(
    () =>
      positions
        .filter((position) => typeof position.cpLoss === "number" && position.bestMove)
        .sort((a, b) => (b.cpLoss ?? 0) - (a.cpLoss ?? 0)),
    [positions]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [fen, setFen] = useState(drillPositions[0]?.fenBefore ?? "start");
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState("");
  const timerIds = useRef<number[]>([]);

  const current = drillPositions[index] ?? null;
  const bestMove = useMemo(
    () => (current ? deriveMoveDetails(current.fenBefore, current.bestMove) : null),
    [current]
  );

  const clearTimers = () => {
    timerIds.current.forEach((timer) => window.clearTimeout(timer));
    timerIds.current = [];
  };

  useEffect(() => {
    if (!current) return;
    setFen(current.fenBefore);
    setSolved(false);
    setFeedback("");
  }, [index, current?.fenBefore]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const boardOrientation = current?.fenBefore.includes(" w ") ? "white" : "black";

  const displayedEvalCp = useMemo(() => {
    if (!current || typeof current.evalBefore !== "number") return null;
    return current.fenBefore.includes(" w ") ? current.evalBefore : -current.evalBefore;
  }, [current]);

  const goNext = () => {
    setIndex((prev) => (prev + 1) % drillPositions.length);
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (!current || !bestMove) return false;

    const promotion = piece[1]?.toLowerCase();
    const isCorrect =
      sourceSquare === bestMove.from &&
      targetSquare === bestMove.to &&
      (bestMove.promotion ? bestMove.promotion === promotion : true);

    if (!isCorrect) {
      setFeedback("Try again.");
      return false;
    }

    const chess = new Chess(fen);
    const result = chess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: (bestMove.promotion as PieceSymbol | undefined) ?? (promotion as PieceSymbol | undefined)
    });

    if (!result) return false;

    setFen(chess.fen());
    setSolved(true);
    setFeedback("Correct! Moving to next card...");

    clearTimers();
    const timer = window.setTimeout(() => {
      goNext();
    }, 900);
    timerIds.current.push(timer);

    return true;
  };

  if (drillPositions.length === 0) return null;

  return (
    <section className="space-y-3">
      <button
        type="button"
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        onClick={() => setIsOpen(true)}
      >
        Open Drill Mode ({drillPositions.length} cards)
      </button>

      {isOpen && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Drill Mode</h2>
              <button
                type="button"
                className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700"
                onClick={() => {
                  clearTimers();
                  setIsOpen(false);
                }}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[372px_1fr]">
              <div className="mx-auto flex w-full max-w-[370px] shrink-0 items-start gap-2">
                <EvalBar evalCp={displayedEvalCp} height={340} />
                <Chessboard
                  id={`drill-${index}`}
                  position={fen}
                  onPieceDrop={onDrop}
                  arePiecesDraggable={true}
                  boardOrientation={boardOrientation as "white" | "black"}
                  boardWidth={340}
                  customDarkSquareStyle={{ backgroundColor: "#b58863" }}
                  customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
                />
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  Card {index + 1}/{drillPositions.length} • Reach {current.reachCount}
                </p>
                <p>Solve by finding the best move on the board.</p>
                <p>{solved ? "Solved ✅" : "Your turn."}</p>
                {feedback && <p className="rounded-md bg-slate-950/70 p-3 text-slate-200">{feedback}</p>}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-slate-800 px-3 py-2 text-slate-100 hover:bg-slate-700"
                    onClick={() => setIndex((prev) => (prev - 1 + drillPositions.length) % drillPositions.length)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-slate-800 px-3 py-2 text-slate-100 hover:bg-slate-700"
                    onClick={goNext}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-slate-800 px-3 py-2 text-slate-100 hover:bg-slate-700"
                    onClick={() => {
                      if (!current) return;
                      setFen(current.fenBefore);
                      setSolved(false);
                      setFeedback("");
                    }}
                  >
                    Reset Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
