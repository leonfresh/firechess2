"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { EvalBar } from "@/components/eval-bar";
import { Chessboard } from "react-chessboard";
import type { MissedTactic, PositionEvalTrace } from "@/lib/types";

type DrillItem = {
  fenBefore: string;
  bestMove: string | null;
  cpLoss: number;
  evalBefore: number | null;
  category: "opening" | "tactic";
  label: string;
};

type DrillModeProps = {
  positions: PositionEvalTrace[];
  tactics?: MissedTactic[];
  /** Optional label variant to customize button and header text */
  variant?: "openings" | "tactics" | "combined";
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

export function DrillMode({ positions, tactics = [], variant }: DrillModeProps) {
  const drillPositions = useMemo(() => {
    const openingItems: DrillItem[] = positions
      .filter((position) => position.flagged && typeof position.cpLoss === "number" && position.bestMove)
      .map((p) => ({
        fenBefore: p.fenBefore,
        bestMove: p.bestMove,
        cpLoss: p.cpLoss ?? 0,
        evalBefore: p.evalBefore,
        category: "opening" as const,
        label: `Opening (−${((p.cpLoss ?? 0) / 100).toFixed(1)})`
      }));

    const tacticItems: DrillItem[] = tactics.map((t) => ({
      fenBefore: t.fenBefore,
      bestMove: t.bestMove,
      cpLoss: t.cpLoss,
      evalBefore: t.cpBefore,
      category: "tactic" as const,
      label: `Tactic (−${(t.cpLoss / 100).toFixed(1)})`
    }));

    return [...openingItems, ...tacticItems].sort((a, b) => b.cpLoss - a.cpLoss);
  }, [positions, tactics]);

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

  // Derive label/icon based on variant or content
  const drillVariant = variant ?? (positions.length > 0 && tactics.length > 0 ? "combined" : tactics.length > 0 ? "tactics" : "openings");
  const variantConfig = {
    openings: { label: "Drill Opening Leaks", icon: "🔁", accent: "emerald", emoji: "🎯" },
    tactics: { label: "Drill Missed Tactics", icon: "⚡", accent: "amber", emoji: "⚡" },
    combined: { label: "Drill All Positions", icon: "🔥", accent: "fuchsia", emoji: "🎯" },
  }[drillVariant];

  if (drillPositions.length === 0) return null;

  const buttonClass = drillVariant === "tactics"
    ? "btn-amber flex h-12 items-center gap-2.5 text-sm"
    : "btn-primary flex h-12 items-center gap-2.5 text-sm";

  return (
    <section className="space-y-4">
      <button
        type="button"
        className={buttonClass}
        onClick={() => setIsOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        {variantConfig.label}
        <span className="rounded-full bg-slate-950/30 px-2 py-0.5 text-xs">{drillPositions.length} cards</span>
      </button>

      {isOpen && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" style={{ isolation: "isolate" }}>
          <div
            className="animate-fade-in w-full max-w-[1200px] rounded-2xl border border-white/[0.08] p-8"
            style={{
              background: "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.95) 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset, 0 20px 60px -12px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-xl">{variantConfig.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{variantConfig.label}</h2>
                  <p className="text-sm text-slate-400">Find the best move on the board</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary flex h-9 items-center gap-1.5 px-4 text-sm"
                onClick={() => {
                  clearTimers();
                  setIsOpen(false);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Close
              </button>
            </div>

            <div className="grid gap-8 md:grid-cols-[480px_1fr]">
              <div className="relative mx-auto flex w-full max-w-[470px] shrink-0 items-start gap-3">
                <EvalBar evalCp={displayedEvalCp} height={440} />
                <div className="rounded-xl">
                  <Chessboard
                    id={`drill-${index}`}
                    position={fen}
                    onPieceDrop={onDrop}
                    arePiecesDraggable={true}
                    boardOrientation={boardOrientation as "white" | "black"}
                    boardWidth={440}
                    customDarkSquareStyle={{ backgroundColor: "#779952" }}
                    customLightSquareStyle={{ backgroundColor: "#edeed1" }}
                  />
                </div>
              </div>

              <div className="space-y-5">
                {/* Progress indicator */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-sm font-bold text-slate-300">
                    {index + 1}/{drillPositions.length}
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${((index + 1) / drillPositions.length) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {current.category === "opening" ? "Opening Leak" : "Missed Tactic"} &middot; {current.label}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className={`flex items-center gap-3 rounded-xl border p-4 ${
                  solved
                    ? "border-emerald-500/20 bg-emerald-500/[0.05]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}>
                  {solved ? (
                    <>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">✓</span>
                      <span className="font-medium text-emerald-300">Correct! Moving to next...</span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400">?</span>
                      <span className="text-slate-300">Your turn — drag the best move</span>
                    </>
                  )}
                </div>

                {feedback && !solved && (
                  <div className="animate-fade-in rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3 text-sm text-red-300">
                    {feedback}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary flex h-10 items-center gap-1.5 px-4"
                    onClick={() => setIndex((prev) => (prev - 1 + drillPositions.length) % drillPositions.length)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn-secondary flex h-10 items-center gap-1.5 px-4"
                    onClick={goNext}
                  >
                    Next
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary flex h-10 items-center gap-1.5 px-4"
                    onClick={() => {
                      if (!current) return;
                      setFen(current.fenBefore);
                      setSolved(false);
                      setFeedback("");
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-12.36L1 10"/></svg>
                    Reset
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
