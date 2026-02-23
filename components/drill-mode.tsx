"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { EvalBar } from "@/components/eval-bar";
import { Chessboard } from "react-chessboard";
import { playSound, preloadSounds } from "@/lib/sounds";
import { stockfishClient } from "@/lib/stockfish-client";
import type { MissedTactic, PositionEvalTrace } from "@/lib/types";

type MoveBadge = {
  label: "Best" | "Good" | "Inaccuracy" | "Mistake" | "Blunder";
  color: string;
  accepted: boolean;
};

function classifyMoveBadge(cpLoss: number): MoveBadge {
  if (cpLoss <= 10) return { label: "Best", color: "#10b981", accepted: true };
  if (cpLoss <= 50) return { label: "Good", color: "#22d3ee", accepted: true };
  if (cpLoss <= 100) return { label: "Inaccuracy", color: "#f97316", accepted: false };
  if (cpLoss <= 200) return { label: "Mistake", color: "#f59e0b", accepted: false };
  return { label: "Blunder", color: "#ef4444", accepted: false };
}

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
  /** FENs to exclude from the drill (e.g. DB-approved inaccuracies) */
  excludeFens?: Set<string>;
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

export function DrillMode({ positions, tactics = [], excludeFens, variant }: DrillModeProps) {
  const drillPositions = useMemo(() => {
    const openingItems: DrillItem[] = positions
      .filter((position) => position.flagged && typeof position.cpLoss === "number" && position.bestMove && !(excludeFens?.has(position.fenBefore)))
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
  }, [positions, tactics, excludeFens]);

  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [fen, setFen] = useState(drillPositions[0]?.fenBefore ?? "start");
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [solvedSet, setSolvedSet] = useState<Set<number>>(new Set());
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [moveBadge, setMoveBadge] = useState<MoveBadge | null>(null);
  const [evaluating, setEvaluating] = useState(false);
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
    if (isOpen) preloadSounds();
  }, [isOpen]);

  useEffect(() => {
    if (!current) return;
    setFen(current.fenBefore);
    setSolved(false);
    setFeedback("");
    setHintSquare(null);
    setAttempts(0);
    setMoveBadge(null);
    setEvaluating(false);
  }, [index, current?.fenBefore]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "n") goNext();
      else if (e.key === "ArrowLeft" || e.key === "p") setIndex((prev) => (prev - 1 + drillPositions.length) % drillPositions.length);
      else if (e.key === "h") {
        if (bestMove && !solved) {
          setHintSquare(bestMove.from);
          playSound("select");
        }
      } else if (e.key === "r") {
        if (current) { setFen(current.fenBefore); setSolved(false); setFeedback(""); setHintSquare(null); }
      } else if (e.key === "Escape") {
        clearTimers();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, bestMove, solved, current, drillPositions.length]);

  const boardOrientation = current?.fenBefore.includes(" w ") ? "white" : "black";

  const displayedEvalCp = useMemo(() => {
    if (!current || typeof current.evalBefore !== "number") return null;
    return current.fenBefore.includes(" w ") ? current.evalBefore : -current.evalBefore;
  }, [current]);

  const goNext = () => {
    setIndex((prev) => (prev + 1) % drillPositions.length);
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (!current || !bestMove || evaluating || solved) return false;

    const promotion = piece[1]?.toLowerCase();

    // Try to apply the move — must be legal
    const chess = new Chess(fen);
    const result = chess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: (promotion as PieceSymbol | undefined),
    });
    if (!result) return false;

    // Play the move on the board immediately so it feels responsive
    const newFen = chess.fen();
    setFen(newFen);

    // Play appropriate sound
    if (result.san.includes("+") || result.san.includes("#")) {
      playSound("check");
    } else if (result.captured) {
      playSound("capture");
    } else {
      playSound("move");
    }

    // Check if it's the exact best move
    const isExactBest =
      sourceSquare === bestMove.from &&
      targetSquare === bestMove.to &&
      (bestMove.promotion ? bestMove.promotion === promotion : true);

    if (isExactBest) {
      // Exact match — instant Best badge, no eval needed
      setMoveBadge({ label: "Best", color: "#10b981", accepted: true });
      markSolved();
      return true;
    }

    // Not the exact best move — evaluate both positions with Stockfish
    setEvaluating(true);
    (async () => {
      try {
        // Evaluate the position AFTER the user's move and AFTER the best move
        const bestChess = new Chess(current.fenBefore);
        const bm = bestChess.move({
          from: bestMove.from,
          to: bestMove.to,
          promotion: bestMove.promotion as PieceSymbol | undefined,
        });
        if (!bm) {
          rejectMove("Evaluation error — try the best move", 0);
          return;
        }

        const [userEval, bestEval] = await Promise.all([
          stockfishClient.evaluateFen(newFen, 10),
          stockfishClient.evaluateFen(bestChess.fen(), 10),
        ]);

        if (!userEval || !bestEval) {
          rejectMove("Engine unavailable — try the best move", 0);
          return;
        }

        // evaluateFen returns cp from side-to-move perspective.
        // After the move, the side to move has flipped, so negate both
        // to get the evaluation from the MOVER's perspective.
        const userCp = -userEval.cp;
        const bestCp = -bestEval.cp;
        const cpLoss = Math.max(0, bestCp - userCp);

        const badge = classifyMoveBadge(cpLoss);
        setMoveBadge(badge);

        if (badge.accepted) {
          // Good enough — accept the move
          markSolved();
        } else {
          // Not good enough — snap back
          const newAttempts = attempts + 1;
          rejectMove(
            `${badge.label} (−${(cpLoss / 100).toFixed(1)}) — try again!`,
            newAttempts,
          );
        }
      } catch {
        rejectMove("Evaluation error — try again", attempts);
      } finally {
        setEvaluating(false);
      }
    })();

    return true;
  };

  /** Accept the move, update streak/solved state, auto-advance */
  const markSolved = () => {
    setSolved(true);
    setStreak((s) => {
      const next = s + 1;
      setBestStreak((b) => Math.max(b, next));
      return next;
    });
    setSolvedSet((prev) => new Set(prev).add(index));
    setFeedback("");
    setHintSquare(null);

    clearTimers();
    const timer = window.setTimeout(() => {
      goNext();
    }, 1200);
    timerIds.current.push(timer);
  };

  /** Reject the move, snap the board back, maybe auto-hint */
  const rejectMove = (msg: string, newAttempts: number) => {
    setAttempts(newAttempts);
    setFeedback(msg);
    setStreak(0);
    playSound("wrong");

    // Snap the board back after a brief pause so the user sees the badge
    clearTimers();
    const snapTimer = window.setTimeout(() => {
      if (current) setFen(current.fenBefore);
    }, 600);
    timerIds.current.push(snapTimer);

    // Auto-hint after 3 bad attempts
    if (newAttempts >= 3 && bestMove) {
      setHintSquare(bestMove.from);
    }
  };

  // Derive label/icon based on variant or content
  const drillVariant = variant ?? (positions.length > 0 && tactics.length > 0 ? "combined" : tactics.length > 0 ? "tactics" : "openings");
  const variantConfig = {
    openings: { label: "Drill Opening Leaks", icon: "🔁", accent: "emerald", emoji: "🎯" },
    tactics: { label: "Drill Missed Tactics", icon: "⚡", accent: "amber", emoji: "⚡" },
    combined: { label: "Drill All Positions", icon: "🔥", accent: "fuchsia", emoji: "🎯" },
  }[drillVariant];

  // Difficulty badge based on cpLoss
  const getDifficulty = (cpLoss: number) => {
    if (cpLoss >= 300) return { label: "Hard", color: "bg-red-500/20 text-red-400 border-red-500/20" };
    if (cpLoss >= 150) return { label: "Medium", color: "bg-amber-500/20 text-amber-400 border-amber-500/20" };
    return { label: "Easy", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" };
  };

  // Hint square highlight
  const customSquareStyles = useMemo(() => {
    if (!hintSquare || solved) return {};
    return {
      [hintSquare]: {
        background: "radial-gradient(circle, rgba(16,185,129,0.55) 30%, transparent 70%)",
        borderRadius: "50%",
      },
    };
  }, [hintSquare, solved]);

  const allSolved = solvedSet.size >= drillPositions.length;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" style={{ isolation: "isolate" }}>
          <div
            className="animate-fade-in w-full max-w-[1200px] rounded-2xl border border-white/[0.08] p-6 md:p-8"
            style={{
              background: "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.95) 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset, 0 20px 60px -12px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-xl">{variantConfig.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{variantConfig.label}</h2>
                  <p className="text-sm text-slate-400">Find the best move on the board</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Streak badge */}
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-sm font-semibold text-orange-400">
                    <span className="text-base">🔥</span> {streak} streak
                  </div>
                )}
                {/* Solved counter */}
                <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300">
                  <span className="text-base">✅</span> {solvedSet.size}/{drillPositions.length}
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
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* All-solved celebration */}
            {allSolved && (
              <div className="mb-5 animate-fade-in rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] to-cyan-500/[0.08] p-4 text-center">
                <p className="text-lg font-bold text-emerald-300">🎉 All puzzles solved!</p>
                <p className="mt-1 text-sm text-slate-400">
                  Best streak: <span className="font-semibold text-orange-400">🔥 {bestStreak}</span>
                  {" · "}You can keep practicing or close the drill.
                </p>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-[480px_1fr] md:gap-8">
              {/* Board */}
              <div className="relative mx-auto flex w-full max-w-[470px] shrink-0 items-start gap-3">
                <EvalBar evalCp={displayedEvalCp} height={440} />
                <div className="overflow-hidden rounded-xl shadow-lg shadow-black/30">
                  <Chessboard
                    id={`drill-${index}`}
                    position={fen}
                    onPieceDrop={onDrop}
                    arePiecesDraggable={!solved && !evaluating}
                    boardOrientation={boardOrientation as "white" | "black"}
                    boardWidth={440}
                    customDarkSquareStyle={{ backgroundColor: "#779952" }}
                    customLightSquareStyle={{ backgroundColor: "#edeed1" }}
                    customSquareStyles={customSquareStyles}
                  />
                </div>
              </div>

              {/* Right panel */}
              <div className="flex flex-col gap-4">
                {/* Progress bar + puzzle info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Puzzle {index + 1}</span>
                      <span className="text-slate-500">of {drillPositions.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Category badge */}
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                        current.category === "tactic"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                          : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                      }`}>
                        {current.category === "tactic" ? "⚡ Tactic" : "📖 Opening"}
                      </span>
                      {/* Difficulty badge */}
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getDifficulty(current.cpLoss).color}`}>
                        {getDifficulty(current.cpLoss).label}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${((index + 1) / drillPositions.length) * 100}%` }}
                    />
                  </div>
                  {/* Pill indicators */}
                  <div className="flex flex-wrap gap-1">
                    {drillPositions.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIndex(i)}
                        className={`h-2 w-2 rounded-full transition-all ${
                          i === index
                            ? "scale-125 bg-cyan-400"
                            : solvedSet.has(i)
                            ? "bg-emerald-500/70"
                            : "bg-white/[0.12] hover:bg-white/[0.2]"
                        }`}
                        title={`Puzzle ${i + 1}${solvedSet.has(i) ? " (solved)" : ""}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Status card */}
                <div className={`flex items-center gap-3 rounded-xl border p-4 transition-all duration-300 ${
                  solved
                    ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                    : feedback
                    ? "border-red-500/20 bg-red-500/[0.04]"
                    : evaluating
                    ? "border-cyan-500/20 bg-cyan-500/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}>
                  {evaluating ? (
                    <>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20 text-lg">
                        <svg className="h-5 w-5 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 60" /></svg>
                      </span>
                      <div>
                        <span className="font-semibold text-cyan-300">Evaluating your move...</span>
                        <p className="text-xs text-slate-400">Stockfish is checking move quality</p>
                      </div>
                    </>
                  ) : solved ? (
                    <>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-lg text-emerald-400">✓</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-300">Correct!</span>
                        {moveBadge && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                            style={{ backgroundColor: moveBadge.color + "22", color: moveBadge.color, border: `1px solid ${moveBadge.color}33` }}
                          >
                            {moveBadge.label === "Best" ? "⭐ " : ""}{moveBadge.label}
                          </span>
                        )}
                        <p className="text-xs text-slate-400">Auto-advancing...</p>
                      </div>
                    </>
                  ) : feedback ? (
                    <>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20 text-lg text-red-400">✗</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-300">{feedback}</span>
                          {moveBadge && !moveBadge.accepted && (
                            <span
                              className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                              style={{ backgroundColor: moveBadge.color + "22", color: moveBadge.color, border: `1px solid ${moveBadge.color}33` }}
                            >
                              {moveBadge.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {attempts >= 3 ? "Hint: the correct piece is highlighted" : `Attempt ${attempts}/3 — piece snaps back`}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-lg text-slate-400">
                        {boardOrientation === "white" ? "♔" : "♚"}
                      </span>
                      <div>
                        <span className="text-slate-200">Your turn as <span className="font-semibold">{boardOrientation}</span></span>
                        <p className="text-xs text-slate-500">Drag the best move on the board</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Eval info */}
                {typeof current.evalBefore === "number" && (
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-slate-400">
                    Position eval: <span className="font-mono font-medium text-slate-200">
                      {current.evalBefore > 0 ? "+" : ""}{(current.evalBefore / 100).toFixed(1)}
                    </span>
                    {" · "}Loss: <span className="font-mono font-medium text-red-400">
                      −{(current.cpLoss / 100).toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary flex h-10 items-center gap-1.5 px-4 text-sm"
                    onClick={() => setIndex((prev) => (prev - 1 + drillPositions.length) % drillPositions.length)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                    Prev
                    <kbd className="ml-1 hidden rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[10px] text-slate-500 sm:inline">←</kbd>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary flex h-10 items-center gap-1.5 px-4 text-sm"
                    onClick={goNext}
                  >
                    Next
                    <kbd className="ml-1 hidden rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[10px] text-slate-500 sm:inline">→</kbd>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary flex h-10 items-center gap-1.5 px-4 text-sm"
                    onClick={() => {
                      if (bestMove && !solved) {
                        setHintSquare(bestMove.from);
                        playSound("select");
                      }
                    }}
                    disabled={solved || !bestMove}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Hint
                    <kbd className="ml-1 hidden rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[10px] text-slate-500 sm:inline">H</kbd>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary flex h-10 items-center gap-1.5 px-4 text-sm"
                    onClick={() => {
                      if (!current) return;
                      setFen(current.fenBefore);
                      setSolved(false);
                      setFeedback("");
                      setHintSquare(null);
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-12.36L1 10"/></svg>
                    Reset
                    <kbd className="ml-1 hidden rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[10px] text-slate-500 sm:inline">R</kbd>
                  </button>
                </div>

                {/* Keyboard shortcuts legend */}
                <p className="mt-auto hidden text-xs text-slate-600 sm:block">
                  ← → navigate · H hint · R reset · Esc close
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
