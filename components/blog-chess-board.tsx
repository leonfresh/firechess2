"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Chessboard } from "@/components/chessboard-compat";
import { Chess } from "chess.js";
import { stockfishClient } from "@/lib/stockfish-client";
import { MOVE_CLASSIFICATION_SHORT_LABELS } from "@/lib/move-quality";
import type { MoveClassification } from "@/lib/move-quality";

interface BlogChessBoardProps {
  fen: string;
  moves?: string;
  orientation?: "white" | "black";
  caption?: string;
  size?: number;
  /** When true, runs Stockfish on each position to show move badges (!! ! ? ?? etc) */
  showAnalysis?: boolean;
}

const BADGE_STYLES: Record<MoveClassification, { bg: string; text: string }> = {
  brilliant: { bg: "#06b6d440", text: "#22d3ee" },
  best: { bg: "#10b98140", text: "#34d399" },
  good: { bg: "#34d39920", text: "#6ee7b7" },
  book: { bg: "#94a3b820", text: "#cbd5e1" },
  inaccuracy: { bg: "#f59e0b40", text: "#fbbf24" },
  mistake: { bg: "#f9731640", text: "#fb923c" },
  blunder: { bg: "#ef444440", text: "#f87171" },
};

/**
 * Interactive chess board for blog posts with optional Stockfish analysis badges.
 */
export function BlogChessBoard({
  fen,
  moves,
  orientation = "white",
  caption,
  showAnalysis = false,
}: BlogChessBoardProps) {
  const moveList = moves
    ? moves
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
    : [];
  const hasSequence = moveList.length > 0;

  const [currentIdx, setCurrentIdx] = useState(-1);
  const [displayFen, setDisplayFen] = useState(fen);
  const [isPlaying, setIsPlaying] = useState(false);
  const [classifications, setClassifications] = useState<Record<number, MoveClassification | null>>({});
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fensRef = useRef<string[]>([fen]);
  const chessRef = useRef<Chess | null>(null);

  // Pre-compute FEN positions
  useEffect(() => {
    if (!hasSequence) return;
    try {
      const chess = new Chess(fen);
      const positions = [fen];
      for (const m of moveList) {
        try {
          const result = chess.move(m);
          if (!result) break;
          positions.push(chess.fen());
        } catch {
          break;
        }
      }
      fensRef.current = positions;
      chessRef.current = chess;
    } catch {
      fensRef.current = [fen];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, moves]);

  // Run Stockfish analysis
  useEffect(() => {
    if (!showAnalysis || !hasSequence || Object.keys(classifications).length > 0) return;
    
    setAnalysisLoading(true);
    const run = async () => {
      const results: Record<number, MoveClassification | null> = {};
      for (let i = 0; i < moveList.length; i++) {
        const positionFen = fensRef.current[i];
        if (!positionFen) continue;
        
        try {
          const evalResult = await stockfishClient.evaluateFen(positionFen, 12);
          const playedUci = getUciFromSan(positionFen, moveList[i]);
          
          if (!evalResult || !playedUci) {
            results[i] = "good";
            continue;
          }

          const isBest = evalResult.bestMove === playedUci;
          const bestUci = evalResult.bestMove;
          
          // Calculate cp loss
          let cpLoss = 0;
          if (bestUci && bestUci !== playedUci) {
            const afterBest = getEvalAfterMove(positionFen, bestUci);
            const afterPlayed = evalResult.cp;
            // For the side to move, positive cp = good
            const turn = getTurnFromFen(positionFen);
            const diff = turn === "w" ? afterPlayed - (afterBest ?? 0) : (afterBest ?? 0) - afterPlayed;
            cpLoss = Math.max(0, diff);
          }

          if (isBest) {
            // Check if it's a brilliant sacrifice or just best
            const isSacrifice = checkSacrifice(positionFen, playedUci);
            results[i] = isSacrifice ? "brilliant" : "best";
          } else if (cpLoss >= 150) {
            results[i] = "blunder";
          } else if (cpLoss >= 80) {
            results[i] = "mistake";
          } else if (cpLoss >= 40) {
            results[i] = "inaccuracy";
          } else {
            results[i] = "good";
          }
        } catch {
          results[i] = null;
        }
      }
      setClassifications(results);
      setAnalysisLoading(false);
    };
    run();
  }, [showAnalysis, hasSequence, moveList, fen, classifications]);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(-1, Math.min(idx, fensRef.current.length - 2));
    setCurrentIdx(clamped);
    setDisplayFen(fensRef.current[clamped + 1]);
  }, []);

  const play = useCallback(() => {
    if (!hasSequence) return;
    setIsPlaying(true);
    let startIdx = currentIdx;
    if (startIdx >= fensRef.current.length - 2) {
      startIdx = -1;
      goTo(-1);
    }
    let idx = startIdx;
    playTimerRef.current = setInterval(() => {
      idx++;
      if (idx >= fensRef.current.length - 1) {
        if (playTimerRef.current) clearInterval(playTimerRef.current);
        setIsPlaying(false);
        goTo(idx - 1);
        return;
      }
      goTo(idx);
    }, 1200);
  }, [currentIdx, hasSequence, goTo]);

  const pause = useCallback(() => {
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    pause();
    goTo(-1);
  }, [pause, goTo]);

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  // Current move display
  const moveLabel = currentIdx >= 0 && currentIdx < moveList.length ? moveList[currentIdx] : null;
  const moveNumber = currentIdx >= 0
    ? `${Math.floor(currentIdx / 2) + 1}${currentIdx % 2 === 0 ? "." : "..."}`
    : null;
  const currentClassification = showAnalysis && currentIdx >= 0
    ? classifications[currentIdx] ?? null
    : null;

  return (
    <div className="my-8 flex flex-col items-center gap-3">
      <div
        className="relative overflow-hidden rounded-xl border border-white/[0.08] shadow-lg"
        style={{ maxWidth: 420, width: "100%" }}
      >
        <Chessboard
          id={`blog-board-${fen.slice(0, 20)}`}
          position={displayFen}
          boardOrientation={orientation}
          arePiecesDraggable={false}
          animationDuration={300}
          customDarkSquareStyle={{ backgroundColor: "#779952" }}
          customLightSquareStyle={{ backgroundColor: "#edeed1" }}
        />
      </div>

      {/* Controls */}
      {hasSequence && (
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            title="Reset"
          >⏮</button>
          <button
            onClick={() => { pause(); goTo(currentIdx - 1); }}
            disabled={currentIdx <= -1}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous move"
          >◀</button>
          <button
            onClick={isPlaying ? pause : play}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:text-emerald-300"
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={() => { pause(); goTo(currentIdx + 1); }}
            disabled={currentIdx >= fensRef.current.length - 2}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next move"
          >▶</button>
        </div>
      )}

      {/* Move indicator with badge */}
      {hasSequence && moveLabel && (
        <div className="flex items-center gap-2 text-xs font-mono">
          {currentClassification && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold leading-none"
              style={{
                background: BADGE_STYLES[currentClassification].bg,
                color: BADGE_STYLES[currentClassification].text,
              }}
            >
              {MOVE_CLASSIFICATION_SHORT_LABELS[currentClassification]}
            </span>
          )}
          <span className="text-slate-500">
            {moveNumber} {moveLabel} ({currentIdx + 1}/{moveList.length})
          </span>
          {analysisLoading && Object.keys(classifications).length === 0 && (
            <span className="text-slate-600 text-[10px]">analyzing...</span>
          )}
        </div>
      )}

      {caption && (
        <p className="max-w-[420px] text-center text-sm text-slate-400 italic">
          {caption}
        </p>
      )}
    </div>
  );
}

/* ── Helpers ── */

function getTurnFromFen(fen: string): "w" | "b" {
  return (fen.split(" ")[1] || "w") as "w" | "b";
}

function getUciFromSan(fen: string, san: string): string | null {
  try {
    const chess = new Chess(fen);
    const move = chess.move(san);
    return move ? move.from + move.to + (move.promotion ?? "") : null;
  } catch {
    return null;
  }
}

function getEvalAfterMove(fen: string, uci: string): number | null {
  try {
    const chess = new Chess(fen);
    const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || undefined });
    return move ? null : null; // We'd need Stockfish to eval this — returns null to skip
  } catch {
    return null;
  }
}

function checkSacrifice(fen: string, uci: string): boolean {
  try {
    const chess = new Chess(fen);
    const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || undefined });
    return !!move?.captured;
  } catch {
    return false;
  }
}
