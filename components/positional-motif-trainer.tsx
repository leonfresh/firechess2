"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { useBoardSize } from "@/lib/use-board-size";
import {
  useBoardTheme,
  useShowCoordinates,
  useCustomPieces,
} from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import { stockfishClient, type LocalEngineLine } from "@/lib/stockfish-client";

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

type TrainState =
  | "thinking"
  | "correct"
  | "wrong"
  | "revealed"
  | "freeplay";

export type PositionalMotifTrainerProps = {
  motifs: Motif[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function isUci(move: string): boolean {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
}

/** Convert a UCI principal variation into SAN moves (stops at the first illegal ply). */
function pvToSan(fen: string, pv: string[]): string[] {
  const san: string[] = [];
  const chess = new Chess(fen);
  for (const uci of pv) {
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci[4] || undefined) as PieceSymbol | undefined,
    });
    if (!move) break;
    san.push(move.san);
  }
  return san;
}

/** Format an engine eval as "+1.2" / "−0.4" / "M3". */
function formatEval(line: LocalEngineLine): string {
  if (line.mateIn != null) return `M${Math.abs(line.mateIn)}`;
  const cp = line.cp / 100;
  return `${cp > 0 ? "+" : cp < 0 ? "−" : ""}${Math.abs(cp).toFixed(1)}`;
}

function resolveMove(
  fen: string,
  move: string | null | undefined,
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
    if (r)
      return {
        from: r.from,
        to: r.to,
        promotion: r.promotion,
        fen: chess.fen(),
      };
  } catch {}
  return null;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

export function PositionalMotifTrainer({
  motifs,
}: PositionalMotifTrainerProps) {
  const { ref: boardRef, size: boardSize } = useBoardSize(420);
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
  const [wrongMove, setWrongMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [wrongFen, setWrongFen] = useState<string | null>(null);
  const [playedSan, setPlayedSan] = useState<string | null>(null);
  const [bestLine, setBestLine] = useState<LocalEngineLine | null>(null);
  const [lineLoading, setLineLoading] = useState(false);
  const [pvStep, setPvStep] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [solved, setSolved] = useState(0);
  const [total, setTotal] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [orientation, setOrientation] = useState<"white" | "black">("white");

  const current = queue[currentIdx];

  /** SAN of the move the user should have played, from the starting FEN. */
  const bestSan = useMemo(() => {
    if (!current) return null;
    try {
      const chess = new Chess(current.fenBefore);
      const mv = chess.move({
        from: current.correctFrom,
        to: current.correctTo,
        promotion: current.correctPromo as PieceSymbol | undefined,
      });
      return mv?.san ?? null;
    } catch {
      return null;
    }
  }, [current]);

  // Load position when index changes or when trainer expands
  useEffect(() => {
    if (!expanded || !current) return;
    preloadSounds();
    setFen(current.fenBefore);
    setTrainState("thinking");
    setSelectedSq(null);
    setLegalMoveSqs([]);
    setWrongMove(null);
    setWrongFen(null);
    setPlayedSan(null);
    setBestLine(null);
    setLineLoading(false);
    setPvStep(0);
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
      if (!current) return false;
      // Free play: any legal move applies, no scoring, no feedback.
      if (
        trainState === "freeplay" ||
        trainState === "correct" ||
        trainState === "revealed"
      ) {
        try {
          const chess = new Chess(fen);
          const r = chess.move({
            from,
            to,
            promotion: (promotion || undefined) as PieceSymbol | undefined,
          });
          if (!r) return false;
          setFen(chess.fen());
          setLastMove({ from, to });
          setTrainState("freeplay");
          setSelectedSq(null);
          setLegalMoveSqs([]);
          return true;
        } catch {
          return false;
        }
      }
      if (trainState !== "thinking") return false;

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
          // Keep the wrong position on the board and fetch the engine's
          // best line so the user can see — right there — what they missed.
          setTrainState("wrong");
          setTotal((t) => t + 1);
          setWrongMove({ from, to });
          setWrongFen(chess.fen());
          try {
            const chessAfter = new Chess(fen);
            const played = chessAfter.move({
              from,
              to,
              promotion: (promotion || undefined) as PieceSymbol | undefined,
            });
            setPlayedSan(played?.san ?? null);
          } catch {
            setPlayedSan(null);
          }
          playSound("wrong");
          setLineLoading(true);
          setBestLine(null);
          setPvStep(0);
          // Line starts AFTER the wrong move: shows how play continues (the
          // punishment / refutation) all the way to the end.
          stockfishClient
            .getPrincipalVariation(chess.fen(), 18, 12)
            .then((line) => {
              setBestLine(line);
              setLineLoading(false);
            })
            .catch(() => {
              setBestLine(null);
              setLineLoading(false);
            });
        }
        return true;
      } catch {
        return false;
      }
    },
    [trainState, current, fen],
  );

  /** Step through the engine line on the board (wrong-move explanation). */
  const stepLine = useCallback(
    (step: number) => {
      if (!wrongFen || !bestLine?.pvMoves?.length) return;
      const clamped = Math.max(0, Math.min(step, bestLine.pvMoves.length));
      const chess = new Chess(wrongFen);
      let lastFrom = "";
      let lastTo = "";
      for (let i = 0; i < clamped; i += 1) {
        const uci = bestLine.pvMoves[i];
        const mv = chess.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: (uci[4] || undefined) as PieceSymbol | undefined,
        });
        if (!mv) break;
        lastFrom = mv.from;
        lastTo = mv.to;
      }
      setFen(chess.fen());
      setLastMove(lastFrom && lastTo ? { from: lastFrom, to: lastTo } : null);
      setPvStep(clamped);
    },
    [wrongFen, bestLine],
  );

  /** Reset the current position back to the starting FEN and try again. */
  const retryPosition = useCallback(() => {
    if (!current) return;
    setFen(current.fenBefore);
    setTrainState("thinking");
    setSelectedSq(null);
    setLegalMoveSqs([]);
    setWrongMove(null);
    setWrongFen(null);
    setPlayedSan(null);
    setBestLine(null);
    setLineLoading(false);
    setPvStep(0);
    setLastMove(null);
    setHintShown(false);
  }, [current]);

  const onDrop = useCallback(
    (from: string, to: string) => {
      if (trainState === "wrong" || lineLoading) return false;
      const result = attemptMove(from, to);
      setSelectedSq(null);
      setLegalMoveSqs([]);
      return result;
    },
    [trainState, lineLoading, attemptMove],
  );

  const onSquareClick = useCallback(
    (square: CbSquare) => {
      if (trainState === "wrong" || lineLoading) {
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
    [trainState, fen, selectedSq, legalMoveSqs, attemptMove],
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

    if (selectedSq && (trainState === "thinking" || trainState === "freeplay")) {
      try {
        const chess = new Chess(fen);
        for (const sq of legalMoveSqs) {
          const hasPiece = chess.get(sq as Parameters<Chess["get"]>[0]);
          styles[sq] = hasPiece
            ? {
                background:
                  "radial-gradient(circle, transparent 55%, rgba(0,0,0,0.25) 55%)",
                borderRadius: "50%",
              }
            : {
                background:
                  "radial-gradient(circle, rgba(0,0,0,0.25) 25%, transparent 25%)",
                borderRadius: "50%",
              };
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
  }, [
    lastMove,
    selectedSq,
    legalMoveSqs,
    fen,
    trainState,
    wrongMove,
    hintShown,
    current,
  ]);

  if (queue.length === 0) return null;

  const solvePct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const topMotifs = motifs.slice(0, 4);

  /* ---- Collapsed CTA ---- */
  if (!expanded) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#ff5a1f]/25 p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ff5a1f]/[0.08] via-orange-500/[0.04] to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ff5a1f]/[0.08] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-500/10 blur-[80px]" />

        <div className="relative flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff5a1f]/[0.08] text-3xl shadow-lg shadow-amber-500/10">
            🧠
          </span>
          <h3 className="mt-5 text-2xl font-extrabold text-white md:text-3xl">
            Positional Pattern Trainer
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#8d8696]">
            Train the exact positions from your games where positional habits
            hurt you. Find the best move in {queue.length} real position
            {queue.length !== 1 ? "s" : ""} — ranked by how much you lost.
          </p>

          {/* Motif chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {topMotifs.map((m) => (
              <span
                key={m.name}
                className="flex items-center gap-1.5 rounded-full border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] px-3 py-1.5 text-[11px] font-medium text-[#ff8c42]"
              >
                <span>{m.icon}</span>
                {m.name} ×{m.count}
              </span>
            ))}
            {motifs.length > 4 && (
              <span className="flex items-center gap-1.5 rounded-full border border-orange-500/10 bg-orange-500/[0.03] px-3 py-1.5 text-[11px] font-medium text-[#565061]">
                +{motifs.length - 4} more
              </span>
            )}
          </div>

          {/* Feature cards */}
          <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] px-4 py-3">
              <span className="text-lg">♟️</span>
              <p className="text-xs font-bold text-white">Your Own Positions</p>
              <p className="text-[10px] text-[#565061]">
                Real mistakes from your games
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-orange-500/15 bg-orange-500/[0.04] px-4 py-3">
              <span className="text-lg">🎯</span>
              <p className="text-xs font-bold text-white">Find the Best Move</p>
              <p className="text-[10px] text-[#565061]">Interactive solving</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] px-4 py-3">
              <span className="text-lg">📈</span>
              <p className="text-xs font-bold text-white">Break the Pattern</p>
              <p className="text-[10px] text-[#565061]">
                Rewire your positional thinking
              </p>
            </div>
          </div>

          <div className="mt-7">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#ff5a1f] to-orange-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-110"
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
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff5a1f]/[0.08] text-xl">
            🧠
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">
              Positional Pattern Trainer
            </h2>
            <p className="text-sm text-[#8d8696]">
              Find the best move in positions from your own games
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/10 bg-orange-500/[0.04] text-[#8d8696] transition-colors hover:bg-orange-500/[0.08] hover:text-white"
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
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-orange-500/5 bg-black/20 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#565061]">Correct</span>
          <span className="text-sm font-bold text-emerald-400">{solved}</span>
        </div>
        <div className="h-4 w-px bg-[#ff5a1f]/10" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#565061]">Attempted</span>
          <span className="text-sm font-bold text-white">{total}</span>
        </div>
        <div className="h-4 w-px bg-[#ff5a1f]/10" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#565061]">Accuracy</span>
          <span
            className={`text-sm font-bold ${
              solvePct >= 70
                ? "text-emerald-400"
                : solvePct >= 40
                  ? "text-[#ff8c42]"
                  : "text-red-400"
            }`}
          >
            {total > 0 ? `${solvePct}%` : "—"}
          </span>
        </div>
        {current && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-lg">{current.motifIcon}</span>
            <span className="rounded-full bg-[#ff5a1f]/[0.08] px-2.5 py-0.5 text-xs font-semibold text-[#ff8c42]">
              {current.motifName}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,560px)_1fr] md:gap-8">
        {/* Board */}
        <div
          ref={boardRef}
          className="relative mx-auto w-full max-w-[420px] shrink-0"
        >
          <Chessboard
            id={`positional-trainer-${currentIdx}`}
            position={fen}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            arePiecesDraggable={trainState !== "wrong"}
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
          <div className="rounded-xl border border-orange-500/5 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Position {currentIdx + 1} of {queue.length}
                </h3>
                {current && (
                  <p className="mt-0.5 text-xs text-[#565061]">
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
                        : "bg-[#ff5a1f]/[0.08] text-[#ff8c42]"
                }`}
              >
                {trainState === "correct"
                  ? "✓ Correct — keep playing"
                  : trainState === "wrong"
                    ? "✗ Wrong — see best line"
                    : trainState === "revealed"
                      ? "Solution shown — keep playing"
                      : trainState === "freeplay"
                        ? "♟ Free play"
                        : "Your turn"}
              </span>
            </div>
          </div>

          {/* Instruction text */}
          <div className="rounded-xl border border-orange-500/5 bg-black/20 p-4">
            <p className="text-xs font-medium text-[#8d8696]">
              {trainState === "thinking" && (
                <>
                  <span className="text-white">
                    Find the best positional move.
                  </span>{" "}
                  This position is from one of your own games. Click a piece to
                  see legal moves, or drag it to the target square.
                </>
              )}
              {trainState === "correct" && (
                <>
                  <span className="text-emerald-400">Well done!</span>{" "}
                  That&apos;s the best move here. The board is unlocked — keep
                  playing the line yourself, or move to the next position.
                </>
              )}
              {trainState === "wrong" && (
                <>
                  {lineLoading ? (
                    <span className="text-red-400">Not quite.</span>
                  ) : (
                    <span className="text-red-400">Not the best move.</span>
                  )}{" "}
                  {lineLoading ? (
                    <>Checking the engine&apos;s best line…</>
                  ) : bestLine?.pvMoves?.length ? (
                    <>
                      You played{" "}
                      <span className="font-mono font-bold text-white">
                        {playedSan ?? "that move"}
                      </span>
                      {bestSan ? (
                        <>
                          {" "}
                          — best was{" "}
                          <span className="font-mono font-bold text-emerald-400">
                            {bestSan}
                          </span>
                        </>
                      ) : null}
                      . From here the engine&apos;s line{" "}
                      <span className="font-semibold text-emerald-400">
                        ({formatEval(bestLine)})
                      </span>
                      :
                    </>
                  ) : (
                    <>Try again, or use Hint / Show Solution below.</>
                  )}
                </>
              )}
              {trainState === "revealed" && (
                <>
                  <span className="text-blue-400">Solution revealed.</span>{" "}
                  Study the position — the board is unlocked if you want to
                  keep playing it.
                </>
              )}
              {trainState === "freeplay" && (
                <>
                  <span className="text-[#ff8c42]">Free play.</span> Make
                  moves for either side to explore the position, then move to
                  the next one when ready.
                </>
              )}
            </p>
          </div>

          {/* Wrong-move explanation: engine line, clickable to step through */}
          {trainState === "wrong" &&
            !lineLoading &&
            bestLine?.pvMoves &&
            bestLine.pvMoves.length > 0 && (
              <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {pvToSan(wrongFen ?? fen, bestLine.pvMoves).map((san, i) => (
                    <button
                      key={`${san}-${i}`}
                      type="button"
                      onClick={() => stepLine(i + 1)}
                      className={`rounded-md px-2 py-1 font-mono text-xs font-bold transition-colors ${
                        pvStep === i + 1
                          ? "bg-emerald-500/25 text-emerald-300"
                          : "bg-black/30 text-[#8d8696] hover:bg-black/50 hover:text-white"
                      }`}
                    >
                      {san}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-[#565061]">
                  Click a move to step through the line on the board.
                </p>
              </div>
            )}

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#565061]">Progress</span>
              <span className="text-[#8d8696]">
                {currentIdx + 1} / {queue.length}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e1a24]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff5a1f] to-orange-500 transition-all duration-500"
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
                  className="flex items-center gap-1.5 rounded-xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] px-4 py-2.5 text-xs font-medium text-[#ff8c42] transition-colors hover:bg-[#ff5a1f]/[0.12] hover:text-[#ff8c42] disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className="flex items-center gap-1.5 rounded-xl border border-orange-500/10 bg-orange-500/[0.03] px-4 py-2.5 text-xs font-medium text-[#8d8696] transition-colors hover:bg-orange-500/[0.06] hover:text-white"
                >
                  Show Solution
                </button>
              </>
            )}
            {trainState === "wrong" && (
              <>
                <button
                  type="button"
                  onClick={retryPosition}
                  className="flex items-center gap-1.5 rounded-xl border border-orange-500/10 bg-orange-500/[0.03] px-4 py-2.5 text-xs font-medium text-[#8d8696] transition-colors hover:bg-orange-500/[0.06] hover:text-white"
                >
                  ↺ Try Again
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#ff5a1f] to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:brightness-110"
                >
                  Next Position →
                </button>
              </>
            )}
            {(trainState === "correct" ||
              trainState === "revealed" ||
              trainState === "freeplay") && (
              <>
                <button
                  type="button"
                  onClick={retryPosition}
                  className="flex items-center gap-1.5 rounded-xl border border-orange-500/10 bg-orange-500/[0.03] px-4 py-2.5 text-xs font-medium text-[#8d8696] transition-colors hover:bg-orange-500/[0.06] hover:text-white"
                >
                  ↺ Reset
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#ff5a1f] to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:brightness-110"
                >
                  Next Position →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
