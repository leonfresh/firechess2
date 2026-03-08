"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

interface BlogChessBoardProps {
  /** Starting FEN position */
  fen: string;
  /** Comma-separated list of SAN moves to play through */
  moves?: string;
  /** Board orientation */
  orientation?: "white" | "black";
  /** Caption shown below the board */
  caption?: string;
  /** Board size in pixels (defaults to responsive) */
  size?: number;
}

/**
 * Interactive chess board for blog posts.
 * Shows a position and optionally lets readers play through a move sequence.
 */
export function BlogChessBoard({
  fen,
  moves,
  orientation = "white",
  caption,
}: BlogChessBoardProps) {
  const moveList = moves
    ? moves.split(",").map((m) => m.trim()).filter(Boolean)
    : [];
  const hasSequence = moveList.length > 0;

  const [currentIdx, setCurrentIdx] = useState(-1); // -1 = starting position
  const [displayFen, setDisplayFen] = useState(fen);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chessRef = useRef<Chess | null>(null);
  const fensRef = useRef<string[]>([fen]);

  // Pre-compute all FEN positions for the sequence
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
      chessRef.current = chess;
    } catch {
      fensRef.current = [fen];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, moves]);

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(-1, Math.min(idx, fensRef.current.length - 2));
      setCurrentIdx(clamped);
      setDisplayFen(fensRef.current[clamped + 1]);
    },
    [],
  );

  const play = useCallback(() => {
    if (!hasSequence) return;
    setIsPlaying(true);
    // Start from beginning if at the end
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

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  // Current move label
  const moveLabel =
    currentIdx >= 0 && currentIdx < moveList.length
      ? moveList[currentIdx]
      : null;
  const moveNumber =
    currentIdx >= 0
      ? `${Math.floor(currentIdx / 2) + 1}${currentIdx % 2 === 0 ? "." : "..."}`
      : null;

  return (
    <div className="my-8 flex flex-col items-center gap-3">
      {/* Board */}
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
          {/* Reset */}
          <button
            onClick={reset}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            title="Reset"
          >
            ⏮
          </button>
          {/* Back */}
          <button
            onClick={() => { pause(); goTo(currentIdx - 1); }}
            disabled={currentIdx <= -1}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous move"
          >
            ◀
          </button>
          {/* Play/Pause */}
          <button
            onClick={isPlaying ? pause : play}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:text-emerald-300"
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          {/* Forward */}
          <button
            onClick={() => { pause(); goTo(currentIdx + 1); }}
            disabled={currentIdx >= fensRef.current.length - 2}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next move"
          >
            ▶
          </button>
        </div>
      )}

      {/* Move indicator */}
      {hasSequence && moveLabel && (
        <div className="text-xs text-slate-500 font-mono">
          {moveNumber} {moveLabel} ({currentIdx + 1}/{moveList.length})
        </div>
      )}

      {/* Caption */}
      {caption && (
        <p className="max-w-[420px] text-center text-sm text-slate-400 italic">
          {caption}
        </p>
      )}
    </div>
  );
}
