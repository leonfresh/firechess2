"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useBoardSize } from "@/lib/use-board-size";
import { playSound } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";
import { useBoardTheme, useShowCoordinates } from "@/lib/use-coins";
import type { MissedTactic, MoveSquare } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Deterministic daily index from all tactics across reports */
function dailyIndex(total: number): number {
  if (total === 0) return 0;
  const now = new Date();
  // day-of-year seed: same puzzle all day
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return dayOfYear % total;
}

function isUci(move: string): boolean {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
}

function parseUci(move: string): MoveSquare | null {
  if (!isUci(move)) return null;
  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move.slice(4, 5) || undefined,
  };
}

function toSan(fen: string, move: string): string | null {
  try {
    const chess = new Chess(fen);
    if (isUci(move)) {
      const p = parseUci(move);
      if (!p) return null;
      const r = chess.move({
        from: p.from,
        to: p.to,
        promotion: p.promotion as PieceSymbol | undefined,
      });
      return r?.san ?? null;
    }
    const r = chess.move(move);
    return r?.san ?? null;
  } catch {
    return null;
  }
}

type BoardSquare =
  | "a1" | "a2" | "a3" | "a4" | "a5" | "a6" | "a7" | "a8"
  | "b1" | "b2" | "b3" | "b4" | "b5" | "b6" | "b7" | "b8"
  | "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "c7" | "c8"
  | "d1" | "d2" | "d3" | "d4" | "d5" | "d6" | "d7" | "d8"
  | "e1" | "e2" | "e3" | "e4" | "e5" | "e6" | "e7" | "e8"
  | "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8"
  | "g1" | "g2" | "g3" | "g4" | "g5" | "g6" | "g7" | "g8"
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "h7" | "h8";

function isBoardSquare(sq: string): sq is BoardSquare {
  return /^[a-h][1-8]$/.test(sq);
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

type DailyChallengeProps = {
  /** All missed tactics from all saved reports */
  allTactics: MissedTactic[];
};

type ChallengeState = "ready" | "correct" | "wrong" | "revealed";

export function DailyChallenge({ allTactics }: DailyChallengeProps) {
  const { ref: boardRef, size: boardSize } = useBoardSize(280);
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();

  const tactic = useMemo(() => {
    if (allTactics.length === 0) return null;
    const idx = dailyIndex(allTactics.length);
    return allTactics[idx];
  }, [allTactics]);

  const [state, setState] = useState<ChallengeState>("ready");
  const [userAttempt, setUserAttempt] = useState<string | null>(null);

  // localStorage to track completed daily challenges
  const storageKey = "fc-daily-challenge";
  const [completedToday, setCompletedToday] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const { date, result } = JSON.parse(stored);
      const today = new Date().toDateString();
      if (date === today && result) {
        setCompletedToday(true);
        setState(result === "correct" ? "correct" : "wrong");
      }
    }
  }, []);

  const bestMoveSan = useMemo(() => {
    if (!tactic) return null;
    return toSan(tactic.fenBefore, tactic.bestMove);
  }, [tactic]);

  const bestMoveSquares = useMemo(() => {
    if (!tactic) return null;
    return parseUci(tactic.bestMove);
  }, [tactic]);

  const handleDrop = useCallback(
    (from: string, to: string) => {
      if (!tactic || state !== "ready" || completedToday) return false;

      // Check if the user's move matches the best move
      const uci = from + to;
      const bestFrom = tactic.bestMove.slice(0, 2);
      const bestTo = tactic.bestMove.slice(2, 4);

      const isCorrect = from === bestFrom && to === bestTo;

      // Validate the move is legal
      try {
        const chess = new Chess(tactic.fenBefore);
        const result = chess.move({ from, to, promotion: "q" });
        if (!result) return false;
      } catch {
        return false;
      }

      const userSan = toSan(tactic.fenBefore, uci);
      setUserAttempt(userSan);

      if (isCorrect) {
        setState("correct");
        playSound("correct");
        earnCoins("daily_correct");
      } else {
        setState("wrong");
        playSound("wrong");
        earnCoins("daily_wrong");
      }

      // Save to localStorage
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          date: new Date().toDateString(),
          result: isCorrect ? "correct" : "wrong",
        })
      );
      setCompletedToday(true);

      return true;
    },
    [tactic, state, completedToday]
  );

  const handleReveal = useCallback(() => {
    setState("revealed");
    // Also mark as completed
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        date: new Date().toDateString(),
        result: "revealed",
      })
    );
    setCompletedToday(true);
  }, []);

  // Daily challenge streak
  const streak = useMemo(() => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem("fc-daily-streak");
    if (!stored) return 0;
    try {
      const { count, lastDate } = JSON.parse(stored);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (
        lastDate === new Date().toDateString() ||
        lastDate === yesterday.toDateString()
      ) {
        return count;
      }
      return 0;
    } catch {
      return 0;
    }
  }, []);

  // Update streak on completion
  useEffect(() => {
    if (!completedToday || state === "ready") return;
    if (typeof window === "undefined") return;

    const today = new Date().toDateString();
    const stored = localStorage.getItem("fc-daily-streak");
    let newCount = 1;

    if (stored) {
      try {
        const { count, lastDate } = JSON.parse(stored);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate === yesterday.toDateString()) {
          newCount = count + 1;
        } else if (lastDate === today) {
          newCount = count; // Already counted today
        }
      } catch {}
    }

    localStorage.setItem(
      "fc-daily-streak",
      JSON.stringify({ count: newCount, lastDate: today })
    );

    // Streak bonus coins
    if (newCount > 1) {
      earnCoins("daily_streak");
    }
  }, [completedToday, state]);

  if (!tactic) return null;

  // Highlight squares for answer reveal
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if ((state === "correct" || state === "revealed") && bestMoveSquares) {
    if (isBoardSquare(bestMoveSquares.from)) {
      customSquareStyles[bestMoveSquares.from] = {
        background: "rgba(16, 185, 129, 0.35)",
        borderRadius: "4px",
      };
    }
    if (isBoardSquare(bestMoveSquares.to)) {
      customSquareStyles[bestMoveSquares.to] = {
        background: "rgba(16, 185, 129, 0.35)",
        borderRadius: "4px",
      };
    }
  }
  if (state === "wrong" && userAttempt && bestMoveSquares) {
    if (isBoardSquare(bestMoveSquares.from)) {
      customSquareStyles[bestMoveSquares.from] = {
        background: "rgba(16, 185, 129, 0.25)",
        borderRadius: "4px",
      };
    }
    if (isBoardSquare(bestMoveSquares.to)) {
      customSquareStyles[bestMoveSquares.to] = {
        background: "rgba(16, 185, 129, 0.25)",
        borderRadius: "4px",
      };
    }
  }

  const cpLoss = tactic.cpLoss / 100;
  const tags = tactic.tags ?? [];

  return (
    <div className="glass-card space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-xl">
            🧩
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Daily Challenge</h2>
            <p className="text-xs text-white/40">
              Find the best move you missed in a real game
            </p>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-bold text-amber-400">{streak}</span>
          </div>
        )}
      </div>

      {/* Board */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div ref={boardRef} className="w-full max-w-[280px] flex-shrink-0">
          <Chessboard
            position={tactic.fenBefore}
            boardWidth={Math.min(boardSize, 280)}
            boardOrientation={tactic.userColor === "white" ? "white" : "black"}
            onPieceDrop={state === "ready" ? handleDrop : () => false}
            arePiecesDraggable={state === "ready"}
            customSquareStyles={customSquareStyles}
            customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
            customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
            showBoardNotation={showCoords}
          />
        </div>

        {/* Info panel */}
        <div className="flex flex-1 flex-col gap-3">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Status messages */}
          {state === "ready" && (
            <div className="space-y-2">
              <p className="text-sm text-white/60">
                <span className="font-semibold text-white">
                  {tactic.userColor === "white" ? "White" : "Black"}
                </span>{" "}
                to move. Find the best move!
              </p>
              <p className="text-xs text-white/30">
                You missed this tactic (−{cpLoss.toFixed(2)} eval).
                Drag a piece to make your move.
              </p>
              <button
                onClick={handleReveal}
                className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/70"
              >
                Reveal answer
              </button>
            </div>
          )}

          {state === "correct" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-lg">
                  ✓
                </span>
                <p className="text-sm font-bold text-emerald-400">Correct!</p>
              </div>
              <p className="text-xs text-white/50">
                The best move was{" "}
                <span className="font-mono font-bold text-emerald-400">
                  {bestMoveSan ?? tactic.bestMove}
                </span>
                . You found it!
              </p>
            </div>
          )}

          {state === "wrong" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-lg">
                  ✗
                </span>
                <p className="text-sm font-bold text-red-400">Not quite!</p>
              </div>
              <p className="text-xs text-white/50">
                You played{" "}
                <span className="font-mono text-red-400">
                  {userAttempt ?? "—"}
                </span>
                . The best move was{" "}
                <span className="font-mono font-bold text-emerald-400">
                  {bestMoveSan ?? tactic.bestMove}
                </span>
                .
              </p>
              <p className="text-xs text-white/30">
                This tactic cost you {cpLoss.toFixed(2)} eval in the game.
              </p>
            </div>
          )}

          {state === "revealed" && (
            <div className="space-y-2">
              <p className="text-sm text-white/60">
                The best move was{" "}
                <span className="font-mono font-bold text-emerald-400">
                  {bestMoveSan ?? tactic.bestMove}
                </span>
              </p>
              <p className="text-xs text-white/30">
                This tactic cost you {cpLoss.toFixed(2)} eval in the game.
                Try solving tomorrow&apos;s puzzle!
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-[10px] text-white/25">
            <span>Move {tactic.moveNumber}</span>
            <span>·</span>
            <span>Game #{tactic.gameIndex + 1}</span>
            {tactic.timeRemainingSec != null && (
              <>
                <span>·</span>
                <span>
                  {Math.floor(tactic.timeRemainingSec / 60)}:{String(Math.floor(tactic.timeRemainingSec % 60)).padStart(2, "0")} on clock
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
