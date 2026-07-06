"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
  showAnalysis?: boolean;
}

const BADGE_STYLES: Record<MoveClassification, { bg: string; text: string; border: string }> = {
  brilliant: { bg: "rgba(6,182,212,0.15)", text: "#22d3ee", border: "rgba(6,182,212,0.3)" },
  best: { bg: "rgba(16,185,129,0.15)", text: "#34d399", border: "rgba(16,185,129,0.25)" },
  good: { bg: "rgba(52,211,153,0.08)", text: "#6ee7b7", border: "rgba(52,211,153,0.15)" },
  book: { bg: "rgba(148,163,184,0.08)", text: "#cbd5e1", border: "rgba(148,163,184,0.1)" },
  inaccuracy: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", border: "rgba(245,158,11,0.25)" },
  mistake: { bg: "rgba(249,115,22,0.15)", text: "#fb923c", border: "rgba(249,115,22,0.25)" },
  blunder: { bg: "rgba(239,68,68,0.15)", text: "#f87171", border: "rgba(239,68,68,0.3)" },
};

export function BlogChessBoard({
  fen,
  moves,
  orientation = "white",
  caption,
  showAnalysis = false,
}: BlogChessBoardProps) {
  const moveList = useMemo(
    () =>
      moves
        ? moves.split(",").map((m) => m.trim()).filter(Boolean)
        : [],
    [moves]
  );
  const hasSequence = moveList.length > 0;

  const [currentIdx, setCurrentIdx] = useState(-1);
  const [displayFen, setDisplayFen] = useState(fen);
  const [isPlaying, setIsPlaying] = useState(false);
  const [classifications, setClassifications] = useState<(MoveClassification | null)[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisStartedRef = useRef(false);
  const fensRef = useRef<string[]>([fen]);

  // Pre-compute FEN positions
  useEffect(() => {
    if (!hasSequence) return;
    try {
      const chess = new Chess(fen);
      const positions = [fen];
      for (const m of moveList) {
        const result = chess.move(m);
        if (!result) break;
        positions.push(chess.fen());
      }
      fensRef.current = positions;
    } catch {
      fensRef.current = [fen];
    }
  }, [fen, moves, hasSequence, moveList]);

  // Run Stockfish analysis once
  useEffect(() => {
    if (!showAnalysis || !hasSequence || analysisStartedRef.current) return;
    analysisStartedRef.current = true;
    setAnalysisError(null);

    const run = async () => {
      const results: (MoveClassification | null)[] = [];
      for (let i = 0; i < moveList.length; i++) {
        const positionFen = fensRef.current[i];
        if (!positionFen) { results.push(null); continue; }

        try {
          const evalResult = await stockfishClient.evaluateFen(positionFen, 10);
          const playedUci = getUciFromSan(positionFen, moveList[i]);

          if (!evalResult || !playedUci) {
            results.push("good");
            continue;
          }

          const isBest = evalResult.bestMove === playedUci;

          // Calculate cp loss (positive = bad for the mover)
          let cpLoss = 0;
          if (evalResult.bestMove && !isBest) {
            cpLoss = Math.abs(evalResult.cp); // approximate
          }

          if (isBest) {
            const chess = new Chess(positionFen);
            const move = chess.move(moveList[i]);
            const isSacrifice = move && move.captured && evalResult.cp < -100;
            results.push(isSacrifice ? "brilliant" : "best");
          } else if (cpLoss >= 150) {
            results.push("blunder");
          } else if (cpLoss >= 80) {
            results.push("mistake");
          } else if (cpLoss >= 40) {
            results.push("inaccuracy");
          } else {
            results.push("good");
          }
        } catch (e) {
          results.push(null);
        }
      }
      setClassifications(results);
    };

    run().catch((e) => setAnalysisError(String(e)));
  }, [showAnalysis, hasSequence, moveList, fen]);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(-1, Math.min(idx, fensRef.current.length - 2));
    setCurrentIdx(clamped);
    setDisplayFen(fensRef.current[clamped + 1]);
  }, []);

  const play = useCallback(() => {
    if (!hasSequence) return;
    setIsPlaying(true);
    let startIdx = currentIdx;
    if (startIdx >= fensRef.current.length - 2) { startIdx = -1; goTo(-1); }
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

  const reset = useCallback(() => { pause(); goTo(-1); }, [pause, goTo]);

  useEffect(() => {
    return () => { if (playTimerRef.current) clearInterval(playTimerRef.current); };
  }, []);

  const currentMoveLabel = currentIdx >= 0 && currentIdx < moveList.length ? moveList[currentIdx] : null;
  const currentMoveNum = currentIdx >= 0
    ? `${Math.floor(currentIdx / 2) + 1}${currentIdx % 2 === 0 ? "." : "..."}`
    : null;
  const currentBadge = showAnalysis && currentIdx >= 0 ? classifications[currentIdx] : null;
  const hasAllBadges = showAnalysis && classifications.length === moveList.length && moveList.length > 0;

  return (
    <div className="my-8 flex flex-col items-center gap-3">
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] shadow-lg" style={{ maxWidth: 420, width: "100%" }}>
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
          <button onClick={reset}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            title="Reset">⏮</button>
          <button onClick={() => { pause(); goTo(currentIdx - 1); }}
            disabled={currentIdx <= -1}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous">◀</button>
          <button onClick={isPlaying ? pause : play}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:text-emerald-300">
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={() => { pause(); goTo(currentIdx + 1); }}
            disabled={currentIdx >= fensRef.current.length - 2}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next">▶</button>
        </div>
      )}

      {/* Move list with badges (like /analyze page) */}
      {hasAllBadges && (
        <div className="w-full max-w-[420px]">
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 max-h-[200px] overflow-y-auto">
            {moveList.map((move, i) => {
              const cls = classifications[i];
              const isCurrent = i === currentIdx;
              const pairNum = Math.floor(i / 2) + 1;
              const isWhite = i % 2 === 0;
              return (
                <button
                  key={i}
                  onClick={() => { pause(); goTo(i); }}
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-mono transition-colors ${
                    isCurrent ? "ring-1 ring-white/30 bg-white/[0.08]" : "hover:bg-white/[0.04]"
                  }`}
                  style={{ background: isCurrent ? (cls ? BADGE_STYLES[cls].bg : undefined) : undefined }}
                >
                  <span className="text-slate-600 text-[10px]">{pairNum}{isWhite ? "." : "..."}</span>
                  <span className="text-slate-300">{move}</span>
                  {cls && (
                    <span
                      className="inline-flex items-center justify-center rounded px-1 py-0 text-[9px] font-bold leading-none"
                      style={{
                        background: BADGE_STYLES[cls].bg,
                        color: BADGE_STYLES[cls].text,
                        border: `1px solid ${BADGE_STYLES[cls].border}`,
                        minWidth: 20,
                      }}
                    >
                      {MOVE_CLASSIFICATION_SHORT_LABELS[cls]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Single move indicator (before analysis loads) */}
      {!hasAllBadges && hasSequence && currentMoveLabel && (
        <div className="flex items-center gap-2 text-xs font-mono">
          {currentBadge && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold leading-none"
              style={{ background: BADGE_STYLES[currentBadge].bg, color: BADGE_STYLES[currentBadge].text }}
            >
              {MOVE_CLASSIFICATION_SHORT_LABELS[currentBadge]}
            </span>
          )}
          <span className="text-slate-500">{currentMoveNum} {currentMoveLabel} ({currentIdx + 1}/{moveList.length})</span>
          {showAnalysis && classifications.length === 0 && !analysisError && (
            <span className="text-slate-600 text-[10px]">♟ analyzing...</span>
          )}
          {analysisError && <span className="text-red-400 text-[10px]">analysis error</span>}
        </div>
      )}

      {caption && (
        <p className="max-w-[420px] text-center text-sm text-slate-400 italic">{caption}</p>
      )}
    </div>
  );
}

/* ── Helpers ── */

function getUciFromSan(fen: string, san: string): string | null {
  try {
    const chess = new Chess(fen);
    const move = chess.move(san);
    return move ? move.from + move.to + (move.promotion ?? "") : null;
  } catch {
    return null;
  }
}
