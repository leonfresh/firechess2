"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates, useCustomPieces } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type MotifExample = {
  fenBefore: string;
  userMove?: string;
  bestMove?: string | null;
  cpLoss: number;
};

type Motif = {
  name: string;
  icon: string;
  count: number;
  avgCpLoss: number;
  examples: MotifExample[];
};

type DrillPosition = {
  fenBefore: string;
  bestMove: string;
  cpLoss: number;
  motifName: string;
  motifIcon: string;
  correctFrom: string;
  correctTo: string;
  correctPromo?: string;
  resolvedFen: string;
};

type TrainState = "thinking" | "correct" | "wrong" | "revealed";

export type PositionalMotifTrainerProps = {
  motifs: Motif[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function isUci(move: string): boolean {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
}

function resolveMove(
  fen: string,
  move: string | null | undefined
): { from: string; to: string; promotion?: string; fen: string } | null {
  if (!move) return null;
  try {
    const chess = new Chess(fen);
    let r;
    if (isUci(move)) {
      r = chess.move({
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        promotion: (move[4] || undefined) as PieceSymbol | undefined,
      });
    } else {
      r = chess.move(move);
    }
    if (r) return { from: r.from, to: r.to, promotion: r.promotion, fen: chess.fen() };
  } catch {}
  return null;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

export function PositionalMotifTrainer({ motifs }: PositionalMotifTrainerProps) {
  const { ref: boardRef, size: boardSize } = useBoardSize(560);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();

  // Build a flat queue from all motifs' examples that have a valid bestMove
  const queue = useMemo((): DrillPosition[] => {
    const positions: DrillPosition[] = [];
    for (const motif of motifs) {
      for (const ex of motif.examples) {
        if (!ex.bestMove) continue;
        const resolved = resolveMove(ex.fenBefore, ex.bestMove);
        if (!resolved) continue;
        positions.push({
          fenBefore: ex.fenBefore,
          bestMove: ex.bestMove,
          cpLoss: ex.cpLoss,
          motifName: motif.name,
          motifIcon: motif.icon,
          correctFrom: resolved.from,
          correctTo: resolved.to,
          correctPromo: resolved.promotion,
          resolvedFen: resolved.fen,
        });
      }
    }
    // Sort worst-to-best so the most impactful positions come first
    return positions.sort((a, b) => b.cpLoss - a.cpLoss);
  }, [motifs]);

  const [expanded, setExpanded] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fen, setFen] = useState("");
  const [trainState, setTrainState] = useState<TrainState>("thinking");
  const [selectedSq, setSelectedSq] = useState<string | null>(null);
  const [legalMoveSqs, setLegalMoveSqs] = useState<string[]>([]);
  const [wrongMove, setWrongMove] = useState<{ from: string; to: string } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [solved, setSolved] = useState(0);
  const [total, setTotal] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [orientation, setOrientation] = useState<"white" | "black">("white");

  const current = queue[currentIdx];

  // Load position when index changes or when trainer expands
  useEffect(() => {
    if (!expanded || !current) return;
    preloadSounds();
    setFen(current.fenBefore);
    setTrainState("thinking");
    setSelectedSq(null);
    setLegalMoveSqs([]);
    setWrongMove(null);
    setLastMove(null);
    setHintShown(false);
    try {
      const chess = new Chess(current.fenBefore);
      setOrientation(chess.turn() === "w" ? "white" : "black");
    } catch {
      setOrientation("white");
    }
  }, [expanded, currentIdx, current]);

  const attemptMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (trainState !== "thinking" || !current) return false;

      const isCorrect =
        from === current.correctFrom &&
        to === current.correctTo &&
        (!current.correctPromo || promotion === current.correctPromo);

      try {
        const chess = new Chess(fen);
        const r = chess.move({
          from,
          to,
          promotion: (promotion || undefined) as PieceSymbol | undefined,
        });
        if (!r) return false;

        if (isCorrect) {
          setFen(chess.fen());
          setLastMove({ from, to });
          setTrainState("correct");
          setSolved((s) => s + 1);
          setTotal((t) => t + 1);
          playSound("correct");
        } else {
          setTrainState("wrong");
          setTotal((t) => t + 1);
          setWrongMove({ from, to });
          playSound("wrong");
          setTimeout(() => {
            setFen(current.fenBefore);
            setTrainState("thinking");
            setWrongMove(null);
          }, 900);
        }
        return true;
      } catch {
        return false;
      }
    },
    [trainState, current, fen]
  );

  const onDrop = useCallback(
    (from: string, to: string) => {
      if (trainState !== "thinking") return false;
      const result = attemptMove(from, to);
      setSelectedSq(null);
      setLegalMoveSqs([]);
      return result;
    },
    [trainState, attemptMove]
  );

  const onSquareClick = useCallback(
    (square: CbSquare) => {
      if (trainState !== "thinking") {
        setSelectedSq(null);
        setLegalMoveSqs([]);
        return;
      }
      const chess = new Chess(fen);
      if (selectedSq && selectedSq !== square) {
        if (legalMoveSqs.includes(square)) {
          attemptMove(selectedSq, square);
          setSelectedSq(null);
          setLegalMoveSqs([]);
          return;
        }
      }
      const piece = chess.get(square as Parameters<Chess["get"]>[0]);
      if (piece && piece.color === chess.turn()) {
        setSelectedSq(square);
        const moves = chess.moves({ square: square as any, verbose: true });
        setLegalMoveSqs(moves.map((m) => m.to));
      } else {
        setSelectedSq(null);
        setLegalMoveSqs([]);
      }
    },
    [trainState, fen, selectedSq, legalMoveSqs, attemptMove]
  );

  const revealSolution = useCallback(() => {
    if (!current) return;
    setLastMove({ from: current.correctFrom, to: current.correctTo });
    setFen(current.resolvedFen);
    setTrainState("revealed");
  }, [current]);

  const goNext = useCallback(() => {
    setCurrentIdx((i) => (i + 1 < queue.length ? i + 1 : 0));
  }, [queue.length]);

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (lastMove) {
      styles[lastMove.from] = { background: "rgba(255,255,0,0.35)" };
      styles[lastMove.to] = { background: "rgba(255,255,0,0.35)" };
    }

    if (selectedSq) {
      styles[selectedSq] = { background: "rgba(255,255,0,0.4)" };
    }

    if (selectedSq && trainState === "thinking") {
      try {
        const chess = new Chess(fen);
        for (const sq of legalMoveSqs) {
          const hasPiece = chess.get(sq as Parameters<Chess["get"]>[0]);
          styles[sq] = hasPiece
            ? { background: "radial-gradient(circle, transparent 55%, rgba(0,0,0,0.25) 55%)", borderRadius: "50%" }
            : { background: "radial-gradient(circle, rgba(0,0,0,0.25) 25%, transparent 25%)", borderRadius: "50%" };
        }
      } catch {}
    }

    if (wrongMove) {
      styles[wrongMove.from] = { background: "rgba(239,68,68,0.4)" };
      styles[wrongMove.to] = { background: "rgba(239,68,68,0.4)" };
    }

    if (hintShown && current) {
      styles[current.correctFrom] = {
        background: "rgba(16,185,129,0.5)",
        boxShadow: "inset 0 0 12px rgba(16,185,129,0.6)",
      };
    }

    if ((trainState === "correct" || trainState === "revealed") && lastMove) {
      styles[lastMove.from] = { background: "rgba(34,197,94,0.3)" };
      styles[lastMove.to] = { background: "rgba(34,197,94,0.3)" };
    }

    return styles;
  }, [lastMove, selectedSq, legalMoveSqs, fen, trainState, wrongMove, hintShown, current]);

  if (queue.length === 0) return null;

  const solvePct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const topMotifs = motifs.slice(0, 4);

  /* ---- Collapsed CTA ---- */
  if (!expanded) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-500/10 blur-[80px]" />

        <div className="relative flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl shadow-lg shadow-amber-500/10">
            🧠
          </span>
          <h3 className="mt-5 text-2xl font-extrabold text-white md:text-3xl">
            Positional Pattern Trainer
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
            Train the exact positions from your games where positional habits hurt you. Find the best
            move in {queue.length} real position{queue.length !== 1 ? "s" : ""} — ranked by how much
            you lost.
          </p>

          {/* Motif chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {topMotifs.map((m) => (
              <span
                key={m.name}
                className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-[11px] font-medium text-amber-400"
              >
                <span>{m.icon}</span>
                {m.name} ×{m.count}
              </span>
            ))}
            {motifs.length > 4 && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-500">
                +{motifs.length - 4} more
              </span>
            )}
          </div>

          {/* Feature cards */}
          <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3">
              <span className="text-lg">♟️</span>
              <p className="text-xs font-bold text-white">Your Own Positions</p>
              <p className="text-[10px] text-slate-500">Real mistakes from your games</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-orange-500/15 bg-orange-500/[0.04] px-4 py-3">
              <span className="text-lg">🎯</span>
              <p className="text-xs font-bold text-white">Find the Best Move</p>
              <p className="text-[10px] text-slate-500">Interactive solving</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3">
              <span className="text-lg">📈</span>
              <p className="text-xs font-bold text-white">Break the Pattern</p>
              <p className="text-[10px] text-slate-500">Rewire your positional thinking</p>
            </div>
          </div>

          <div className="mt-7">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-110"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Train Positional Weaknesses
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Expanded trainer ---- */
  return (
    <div
      className="w-full rounded-2xl p-5 md:p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.95) 100%)",
      }}
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-xl">
            🧠
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">Positional Pattern Trainer</h2>
            <p className="text-sm text-slate-400">
              Find the best move in positions from your own games
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stats bar */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Correct</span>
          <span className="text-sm font-bold text-emerald-400">{solved}</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Attempted</span>
          <span className="text-sm font-bold text-white">{total}</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Accuracy</span>
          <span
            className={`text-sm font-bold ${
              solvePct >= 70
                ? "text-emerald-400"
                : solvePct >= 40
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {total > 0 ? `${solvePct}%` : "—"}
          </span>
        </div>
        {current && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-lg">{current.motifIcon}</span>
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
              {current.motifName}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,560px)_1fr] md:gap-8">
        {/* Board */}
        <div ref={boardRef} className="relative mx-auto w-full max-w-[560px] shrink-0">
          <Chessboard
            id={`positional-trainer-${currentIdx}`}
            position={fen}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            arePiecesDraggable={trainState === "thinking"}
            boardOrientation={orientation}
            boardWidth={boardSize}
            animationDuration={200}
            customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
            customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
            customSquareStyles={customSquareStyles}
            showBoardNotation={showCoords}
            customPieces={customPieces}
          />
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Position info */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Position {currentIdx + 1} of {queue.length}
                </h3>
                {current && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Mistake cost: −{(current.cpLoss / 100).toFixed(1)} pawns
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  trainState === "correct"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : trainState === "wrong"
                      ? "bg-red-500/15 text-red-400"
                      : trainState === "revealed"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-violet-500/15 text-violet-400"
                }`}
              >
                {trainState === "correct"
                  ? "✓ Correct!"
                  : trainState === "wrong"
                    ? "✗ Wrong"
                    : trainState === "revealed"
                      ? "Solution shown"
                      : "Your turn"}
              </span>
            </div>
          </div>

          {/* Instruction text */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-400">
              {trainState === "thinking" && (
                <>
                  <span className="text-white">Find the best positional move.</span> This position
                  is from one of your own games. Click a piece to see legal moves, or drag it to
                  the target square.
                </>
              )}
              {trainState === "correct" && (
                <>
                  <span className="text-emerald-400">Well done!</span> That&apos;s the best move
                  here. Understanding <em>why</em> this works will help break the{" "}
                  <span className="font-semibold text-amber-300">{current?.motifName}</span> habit.
                </>
              )}
              {trainState === "wrong" && (
                <>
                  <span className="text-red-400">Not quite.</span> The position will reset — try
                  again, or use Hint / Show Solution below.
                </>
              )}
              {trainState === "revealed" && (
                <>
                  <span className="text-blue-400">Solution revealed.</span> Study the position,
                  then move to the next one when ready.
                </>
              )}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Progress</span>
              <span className="text-slate-400">
                {currentIdx + 1} / {queue.length}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{
                  width: `${Math.max(4, Math.round(((currentIdx + 1) / queue.length) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-auto flex flex-wrap gap-2">
            {trainState === "thinking" && (
              <>
                <button
                  type="button"
                  onClick={() => setHintShown(true)}
                  disabled={hintShown}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/[0.12] hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Hint
                </button>
                <button
                  type="button"
                  onClick={revealSolution}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Show Solution
                </button>
              </>
            )}
            {(trainState === "correct" || trainState === "revealed") && (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:brightness-110"
              >
                Next Position →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
