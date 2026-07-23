"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { MoveBadge } from "@/components/move-badge";
import { stockfishClient } from "@/lib/stockfish-client";
import { useBoardSize } from "@/lib/use-board-size";
import {
  classifyMoveQuality,
  MOVE_CLASSIFICATION_COLORS,
  MOVE_CLASSIFICATION_EMOJI,
  type MoveClassification,
} from "@/lib/move-quality";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload } from "lucide-react";

type AnalyzedMove = {
  ply: number;
  san: string;
  fenBefore: string;
  fenAfter: string;
  moveNumber: number;
  color: "w" | "b";
  classification?: MoveClassification;
  cpLoss?: number;
  cpBefore?: number;
  cpAfter?: number;
  bestMove?: string | null;
};

type GameMeta = {
  white: string | null;
  black: string | null;
  result: string | null;
  date?: string | null;
  event?: string | null;
  eco?: string | null;
};

function parsePgn(pgn: string): { meta: GameMeta; moves: string[] } | null {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    const meta: GameMeta = {
      white: chess.header()["White"] || "White",
      black: chess.header()["Black"] || "Black",
      result: chess.header()["Result"] || "*",
      date: chess.header()["Date"],
      event: chess.header()["Event"],
      eco: chess.header()["ECO"],
    };
    return {
      meta,
      moves: history.map((m) => m.san),
    };
  } catch {
    return null;
  }
}

export function GameReview({ initialPgn }: { initialPgn?: string }) {
  const [pgn, setPgn] = useState(initialPgn || "");
  const [gameLoaded, setGameLoaded] = useState(false);
  const [meta, setMeta] = useState<GameMeta | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [currentPly, setCurrentPly] = useState(0);
  const [analyzedMoves, setAnalyzedMoves] = useState<AnalyzedMove[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [inputPgn, setInputPgn] = useState(initialPgn || "");
  const [error, setError] = useState<string | null>(null);

  const { ref: boardContainerRef, size: boardSize } = useBoardSize(420, { evalBar: true, minSize: 240 });
  const boardTheme = { darkSquare: "#779952", lightSquare: "#edeed1" };

  // Parse PGN and load game
  const loadGame = useCallback((pgnText: string) => {
    setError(null);
    const parsed = parsePgn(pgnText);
    if (!parsed) {
      setError("Invalid PGN. Check the format and try again.");
      return;
    }
    setMeta(parsed.meta);
    setMoves(parsed.moves);
    setCurrentPly(0);
    setGameLoaded(true);
    setAnalyzedMoves([]);
  }, []);

  // Analyze all moves with Stockfish
  useEffect(() => {
    if (!gameLoaded || moves.length === 0 || analyzedMoves.length > 0) return;

    setAnalyzing(true);
    const results: AnalyzedMove[] = [];

    (async () => {
      const chess = new Chess();
      // Evaluate starting position
      const startEval = await stockfishClient.evaluateFen(chess.fen(), 12);
      let prevCp = startEval?.cp ?? 20;

      for (let ply = 0; ply < moves.length; ply++) {
        const fenBefore = chess.fen();
        chess.move(moves[ply]);
        const fenAfter = chess.fen();
        const moveNum = Math.floor(ply / 2) + 1;
        const color = ply % 2 === 0 ? "w" : "b";

        // Evaluate the new position
        const evalResult = await stockfishClient.evaluateFen(fenAfter, 12);
        const cpAfter = evalResult?.cp ?? prevCp;
        const cpBefore = prevCp;

        // Determine cpLoss and best move
        let cpLoss = 0;
        if (evalResult?.bestMove) {
          // Evaluate the best move from the previous position
          const bestChess = new Chess(fenBefore);
          try {
            bestChess.move(evalResult.bestMove);
            const bestEval = await stockfishClient.evaluateFen(bestChess.fen(), 12);
            const bestCp = bestEval?.cp ?? cpAfter;
            cpLoss = Math.max(0, Math.round((bestCp - cpAfter) * (color === "w" ? 1 : -1)));
          } catch { /* use default */ }
        }

        // Classify move quality
        const classification = classifyMoveQuality({
          cpLoss,
          isBestMove: cpLoss <= 15,
          evalBeforeMover: cpBefore * (color === "w" ? 1 : -1),
          evalAfterMover: cpAfter * (color === "w" ? 1 : -1),
          fenBefore,
          moveUci: evalResult?.bestMove ?? null,
          moveIndex: ply,
        });

        results.push({
          ply,
          san: moves[ply],
          fenBefore,
          fenAfter,
          moveNumber: moveNum,
          color,
          classification,
          cpLoss,
          cpBefore,
          cpAfter,
          bestMove: evalResult?.bestMove ?? null,
        });

        prevCp = cpAfter;
      }

      setAnalyzedMoves(results);
      setAnalyzing(false);
    })();
  }, [gameLoaded, moves]);

  // Current game state
  const currentGame = useMemo(() => {
    if (!gameLoaded || moves.length === 0) return null;
    const chess = new Chess();
    for (let i = 0; i < currentPly; i++) {
      chess.move(moves[i]);
    }
    return chess;
  }, [gameLoaded, moves, currentPly]);

  const currentMove = useMemo(() => {
    if (currentPly === 0) return null;
    return analyzedMoves[currentPly - 1] ?? null;
  }, [analyzedMoves, currentPly]);

  const keyboardHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setCurrentPly((p) => Math.min(p + 1, moves.length));
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrentPly((p) => Math.max(p - 1, 0));
        e.preventDefault();
      } else if (e.key === "Home") {
        setCurrentPly(0);
        e.preventDefault();
      } else if (e.key === "End") {
        setCurrentPly(moves.length);
        e.preventDefault();
      }
    },
    [moves.length],
  );

  useEffect(() => {
    window.addEventListener("keydown", keyboardHandler);
    return () => window.removeEventListener("keydown", keyboardHandler);
  }, [keyboardHandler]);

  if (!gameLoaded) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Game Review</h2>
          <p className="mb-6 text-sm text-slate-400">
            Paste a PGN, load by Lichess/Chess.com username, or pick from a scan.
          </p>
          <textarea
            value={inputPgn}
            onChange={(e) => setInputPgn(e.target.value)}
            placeholder={`1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 ...`}
            rows={8}
            className="mb-4 w-full rounded-xl border border-white/[0.08] bg-black/30 p-4 font-mono text-sm text-slate-200 placeholder-slate-600 focus:border-orange-500/30 focus:outline-none"
          />
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <button
            onClick={() => loadGame(inputPgn)}
            disabled={!inputPgn.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Analyze Game
          </button>
          <p className="mt-4 text-xs text-slate-500">Use arrow keys ← → to navigate moves after loading.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Board panel */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3">
          <div className="flex-1 truncate">
            <p className="text-sm font-bold text-white">{meta?.white} vs {meta?.black}</p>
            <p className="text-xs text-slate-400">
              {meta?.result} · {meta?.date || "Unknown date"} · {analyzedMoves.length} moves
            </p>
          </div>
          {analyzing && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
              Analyzing...
            </span>
          )}
        </div>

        {/* Board + Eval bar */}
        <div ref={boardContainerRef} className="flex gap-3">
          <div className="min-w-0 flex-1">
            {currentGame && (
              <Chessboard
                id="game-review"
                position={currentGame.fen()}
                boardWidth={boardSize}
                arePiecesDraggable={false}
                customBoardStyle={{
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
                customDarkSquareStyle={{ backgroundColor: "#779952" }}
                customLightSquareStyle={{ backgroundColor: "#edeed1" }}
              />
            )}
          </div>
          <EvalBar evalCp={currentMove?.cpAfter ?? 20} height={boardSize} />
        </div>

        {/* Move info */}
        {currentMove && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white">
                  {currentMove.moveNumber}{currentMove.color === "w" ? "." : "..."}
                </span>
                <span className="text-lg font-semibold text-white">{currentMove.san}</span>
                <MoveBadge classification={currentMove.classification || "good"} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>cp loss: {currentMove.cpLoss}</span>
                <span>·</span>
                <span>{currentMove.cpBefore != null ? (currentMove.cpBefore / 100).toFixed(1) : "?"} → {currentMove.cpAfter != null ? (currentMove.cpAfter / 100).toFixed(1) : "?"}</span>
              </div>
            </div>
            {currentMove.classification && (
              <p className="mt-2 text-sm text-slate-400">
                {MOVE_CLASSIFICATION_EMOJI[currentMove.classification]}{" "}
                {currentMove.classification !== "book"
                  ? buildMoveCommentary(currentMove)
                  : "Book move — standard theory."}
              </p>
            )}
          </div>
        )}

        {/* Eval graph */}
        {analyzedMoves.length > 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="mb-2 text-xs font-semibold text-slate-400">Evaluation graph</p>
            <div className="relative h-24 overflow-hidden rounded-lg bg-black/40">
              <svg viewBox={`0 0 ${analyzedMoves.length} 100`} className="h-full w-full" preserveAspectRatio="none">
                <polyline
                  points={analyzedMoves
                    .map((m, i) => {
                      const cp = m.cpAfter ?? 0;
                      const y = 50 - Math.min(50, Math.max(-50, cp / 30));
                      return `${i},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="rgb(249, 115, 22)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Zero line */}
                <line x1="0" y1="50" x2={analyzedMoves.length} y2="50" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                {/* Move quality dots */}
                {analyzedMoves.map((m, i) => {
                  if (!m.classification) return null;
                  const cp = m.cpAfter ?? 0;
                  const y = 50 - Math.min(50, Math.max(-50, cp / 30));
                  const colors: Record<string, string> = {
                    brilliant: "#06b6d4",
                    best: "#10b981",
                    good: "#34d399",
                    book: "#94a3b8",
                    inaccuracy: "#f59e0b",
                    mistake: "#f97316",
                    blunder: "#ef4444",
                  };
                  return (
                    <circle
                      key={i}
                      cx={i}
                      cy={y}
                      r="2"
                      fill={colors[m.classification] ?? "#94a3b8"}
                      opacity={0.7}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Move list sidebar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-semibold text-slate-400">Moves</p>
          <span className="text-xs text-slate-500">
            {currentPly > 0 ? `${currentPly}/${moves.length}` : "Start position"}
          </span>
        </div>

        {/* Move nav buttons */}
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <button onClick={() => setCurrentPly(0)} disabled={currentPly === 0} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setCurrentPly((p) => Math.max(p - 1, 0))} disabled={currentPly === 0} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[80px] text-center text-[11px] font-medium text-slate-400">
            {currentPly === 0 ? "Start" : `Move ${Math.ceil(currentPly / 2)}`}
          </span>
          <button onClick={() => setCurrentPly((p) => Math.min(p + 1, moves.length))} disabled={currentPly === moves.length} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronRight className="h-5 w-5" />
          </button>
          <button onClick={() => setCurrentPly(moves.length)} disabled={currentPly === moves.length} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent">
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>

        {/* Move list */}
        <div className="max-h-[500px] overflow-y-auto rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: Math.ceil(analyzedMoves.length / 2) }).map((_, round) => {
              const wMove = analyzedMoves[round * 2];
              const bMove = analyzedMoves[round * 2 + 1];
              return (
                <div
                  key={round}
                  className={`grid grid-cols-[40px_1fr_1fr] gap-1 px-3 py-1.5 text-xs transition-colors ${
                    currentPly === (wMove?.ply ?? 0) + 1 || currentPly === (bMove?.ply ?? 0) + 1
                      ? "bg-orange-500/10"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="text-slate-500">{round + 1}.</span>
                  {wMove && (
                    <button
                      onClick={() => setCurrentPly(wMove.ply + 1)}
                      className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-left transition ${currentPly === wMove.ply + 1 ? "bg-orange-500/15" : ""}`}
                    >
                      <span className="text-white">{wMove.san}</span>
                      {wMove.classification && (
                        <span className={`text-[10px] ${MOVE_CLASSIFICATION_COLORS[wMove.classification]}`}>
                          {MOVE_CLASSIFICATION_EMOJI[wMove.classification]}
                        </span>
                      )}
                    </button>
                  )}
                  {bMove ? (
                    <button
                      onClick={() => setCurrentPly(bMove.ply + 1)}
                      className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-left transition ${currentPly === bMove.ply + 1 ? "bg-orange-500/15" : ""}`}
                    >
                      <span className="text-white">{bMove.san}</span>
                      {bMove.classification && (
                        <span className={`text-[10px] ${MOVE_CLASSIFICATION_COLORS[bMove.classification]}`}>
                          {MOVE_CLASSIFICATION_EMOJI[bMove.classification]}
                        </span>
                      )}
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => {
            setGameLoaded(false);
            setAnalyzedMoves([]);
            setMoves([]);
            setCurrentPly(0);
            setMeta(null);
          }}
          className="w-full rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          ← New game
        </button>
      </div>
    </div>
  );
}

function buildMoveCommentary(move: AnalyzedMove): string {
  switch (move.classification) {
    case "brilliant":
      return "A brilliant sacrifice or tactical shot — best move found under pressure.";
    case "best":
      return "You matched the engine's top choice.";
    case "good":
      return "A solid move that kept the position under control.";
    case "inaccuracy":
      return `A slight slip that cost about ${((move.cpLoss ?? 0) / 100).toFixed(1)} pawns.`;
    case "mistake":
      return `A real miss that dropped about ${((move.cpLoss ?? 0) / 100).toFixed(1)} pawns${move.bestMove ? `; best was ${move.bestMove}.` : "."}`;
    case "blunder":
      return `A heavy error that changed the eval by ${((move.cpLoss ?? 0) / 100).toFixed(1)} pawns${move.bestMove ? `; ${move.bestMove} was the save.` : "."}`;
    default:
      return "";
  }
}
