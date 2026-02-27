"use client";

import { useMemo, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { EvalBar } from "@/components/eval-bar";
import { Chessboard } from "react-chessboard";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates } from "@/lib/use-coins";
import type { TimeMoment, MoveSquare } from "@/lib/types";

type TimeCardProps = {
  moment: TimeMoment;
};

type BoardSquare =
  | "a1" | "a2" | "a3" | "a4" | "a5" | "a6" | "a7" | "a8"
  | "b1" | "b2" | "b3" | "b4" | "b5" | "b6" | "b7" | "b8"
  | "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "c7" | "c8"
  | "d1" | "d2" | "d3" | "d4" | "d5" | "d6" | "d7" | "d8"
  | "e1" | "e2" | "e3" | "e4" | "e5" | "e6" | "e7" | "e8"
  | "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8"
  | "g1" | "g2" | "g3" | "g4" | "g5" | "g6" | "g7" | "g8"
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "h7" | "h8";

function isBoardSquare(square: string): square is BoardSquare {
  return /^[a-h][1-8]$/.test(square);
}

function isUci(move: string): boolean {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
}

function parseMove(move: string): MoveSquare | null {
  if (!isUci(move)) return null;
  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move.slice(4, 5) || undefined,
  };
}

function deriveSan(fen: string, uci: string): string | null {
  try {
    const chess = new Chess(fen);
    if (isUci(uci)) {
      const parsed = parseMove(uci);
      if (!parsed) return null;
      const result = chess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined,
      });
      return result?.san ?? null;
    }
    const result = chess.move(uci);
    return result?.san ?? null;
  } catch {
    return null;
  }
}

function formatTime(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  return `${seconds.toFixed(1)}s`;
}

const VERDICT_CONFIG = {
  wasted: {
    icon: "⏳",
    label: "Time Wasted",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    gradientFrom: "from-red-500/[0.06]",
    tagBg: "bg-red-500/15",
    tagText: "text-red-400",
    arrowColor: "rgba(239, 68, 68, 0.7)",
    squareBg: "rgba(239, 68, 68, 0.2)",
  },
  rushed: {
    icon: "💨",
    label: "Rushed Move",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    gradientFrom: "from-amber-500/[0.06]",
    tagBg: "bg-amber-500/15",
    tagText: "text-amber-400",
    arrowColor: "rgba(245, 158, 11, 0.7)",
    squareBg: "rgba(245, 158, 11, 0.2)",
  },
  justified: {
    icon: "✅",
    label: "Well-Timed Think",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    gradientFrom: "from-emerald-500/[0.06]",
    tagBg: "bg-emerald-500/15",
    tagText: "text-emerald-400",
    arrowColor: "rgba(34, 197, 94, 0.7)",
    squareBg: "rgba(34, 197, 94, 0.2)",
  },
  neutral: {
    icon: "⏱️",
    label: "Neutral",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    gradientFrom: "from-slate-500/[0.06]",
    tagBg: "bg-slate-500/15",
    tagText: "text-slate-400",
    arrowColor: "rgba(148, 163, 184, 0.7)",
    squareBg: "rgba(148, 163, 184, 0.2)",
  },
} as const;

export function TimeCard({ moment }: TimeCardProps) {
  const { ref: boardSizeRef, size: boardSize } = useBoardSize(400);
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();
  const [fenCopied, setFenCopied] = useState(false);

  const config = VERDICT_CONFIG[moment.verdict];
  const boardOrientation = moment.userColor === "black" ? "black" : "white";

  const userSan = useMemo(
    () => deriveSan(moment.fen, moment.userMove),
    [moment.fen, moment.userMove]
  );

  const bestSan = useMemo(
    () => (moment.bestMove ? deriveSan(moment.fen, moment.bestMove) : null),
    [moment.fen, moment.bestMove]
  );

  // Compute eval for the eval bar (white perspective)
  const whiteEval = useMemo(() => {
    if (moment.evalBefore == null) return 0;
    // evalBefore is from user perspective; convert to white perspective
    return moment.userColor === "white" ? moment.evalBefore : -moment.evalBefore;
  }, [moment.evalBefore, moment.userColor]);

  // Square styles — highlight the move
  const squareStyles = useMemo(() => {
    const styles: Record<string, { backgroundColor?: string; boxShadow?: string }> = {};
    const parsed = parseMove(moment.userMove);
    if (parsed) {
      if (isBoardSquare(parsed.from)) {
        styles[parsed.from] = { backgroundColor: config.squareBg };
      }
      if (isBoardSquare(parsed.to)) {
        styles[parsed.to] = { backgroundColor: config.squareBg };
      }
    }
    return styles;
  }, [moment.userMove, config.squareBg]);

  // Arrow showing the user's move
  const arrows = useMemo(() => {
    const parsed = parseMove(moment.userMove);
    if (!parsed) return [];
    if (isBoardSquare(parsed.from) && isBoardSquare(parsed.to)) {
      return [[parsed.from, parsed.to, config.arrowColor]] as [BoardSquare, BoardSquare, string?][];
    }
    return [];
  }, [moment.userMove, config.arrowColor]);

  // Best move arrow (if different)
  const bestArrows = useMemo(() => {
    if (!moment.bestMove || moment.bestMove === moment.userMove) return [];
    const parsed = parseMove(moment.bestMove);
    if (!parsed) return [];
    if (isBoardSquare(parsed.from) && isBoardSquare(parsed.to)) {
      return [[parsed.from, parsed.to, "rgba(34, 197, 94, 0.5)"]] as [BoardSquare, BoardSquare, string?][];
    }
    return [];
  }, [moment.bestMove, moment.userMove]);

  const allArrows = useMemo(
    () => [...arrows, ...bestArrows],
    [arrows, bestArrows]
  );

  const copyFen = async () => {
    try {
      await navigator.clipboard.writeText(moment.fen);
      setFenCopied(true);
      setTimeout(() => setFenCopied(false), 1200);
    } catch { /* ignore */ }
  };

  // Complexity bar
  const complexityColor =
    moment.complexity >= 70 ? "bg-red-400" :
    moment.complexity >= 50 ? "bg-amber-400" :
    moment.complexity >= 30 ? "bg-cyan-400" :
    "bg-slate-400";

  return (
    <div className={`glass-card overflow-hidden ${config.borderColor} bg-gradient-to-br ${config.gradientFrom} to-transparent`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bgColor} text-xl`}>
            {config.icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.tagBg} ${config.tagText}`}>
                Game {moment.gameIndex}
              </span>
              {moment.isTactical && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  Tactical
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Move {moment.moveNumber} · {moment.userColor === "white" ? "White" : "Black"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Time badge */}
          <div className="text-right">
            <p className={`text-lg font-bold ${config.color}`}>{formatTime(moment.timeSpentSec)}</p>
            <p className="text-[10px] text-slate-500">{formatTime(moment.timeRemainingSec)} left</p>
          </div>
        </div>
      </div>

      {/* Board + Info */}
      <div className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Board */}
          <div ref={boardSizeRef} className="relative shrink-0" style={{ width: "min(100%, 320px)" }}>
            <div className="flex">
              {moment.evalBefore != null && (
                <EvalBar evalCp={whiteEval} height={boardSize} />
              )}
              <Chessboard
                id={`time-${moment.gameIndex}-${moment.moveNumber}`}
                position={moment.fen}
                boardWidth={boardSize - (moment.evalBefore != null ? 28 : 0)}
                boardOrientation={boardOrientation}
                arePiecesDraggable={false}
                customArrows={allArrows}
                customSquareStyles={squareStyles}
                showBoardNotation={showCoords}
                customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
              />
            </div>
          </div>

          {/* Analysis info */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {/* Your move */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Your Move</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-xl font-bold ${moment.verdict === "justified" ? "text-emerald-400" : moment.cpLoss && moment.cpLoss >= 100 ? "text-red-400" : "text-slate-200"}`}>
                  {userSan ?? moment.userMove}
                </span>
                {moment.cpLoss != null && moment.cpLoss > 0 && (
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400">
                    −{(moment.cpLoss / 100).toFixed(1)}
                  </span>
                )}
              </div>
              {bestSan && moment.bestMove !== moment.userMove && (
                <p className="mt-1 text-xs text-slate-500">
                  Best: <span className="font-semibold text-emerald-400">{bestSan}</span>
                </p>
              )}
            </div>

            {/* Time analysis */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Time Analysis</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{moment.reason}</p>
            </div>

            {/* Complexity meter */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Position Complexity</p>
                <span className="text-xs font-bold text-slate-300">{moment.complexity}/100</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all ${complexityColor}`}
                  style={{ width: `${moment.complexity}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                <span>Simple</span>
                <span>Critical</span>
              </div>
            </div>

            {/* Copy FEN */}
            <button
              type="button"
              onClick={copyFen}
              className="flex items-center gap-1.5 self-start rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/[0.05] hover:text-slate-200"
            >
              {fenCopied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  Copy FEN
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
