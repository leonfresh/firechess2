"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";

function parseSanMoves(raw: string): string[] {
  return raw
    .replace(/\d+\./g, "")
    .replace(/\.\.\./g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function OpeningSlugClient({ moves: rawMoves }: { moves: string }) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();

  const sans = useMemo(() => parseSanMoves(rawMoves), [rawMoves]);

  const fens = useMemo(() => {
    const g = new Chess();
    const arr = [g.fen()];
    for (const san of sans) {
      try {
        g.move(san);
        arr.push(g.fen());
      } catch {
        break;
      }
    }
    return arr;
  }, [sans]);

  const maxIndex = fens.length - 1;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [rawMoves]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setIndex((prev) => {
          if (prev >= maxIndex) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, maxIndex]);

  const goBack = useCallback(() => {
    setPlaying(false);
    setIndex((p) => Math.max(0, p - 1));
  }, []);
  const goForward = useCallback(() => {
    setPlaying(false);
    setIndex((p) => Math.min(maxIndex, p));
  }, [maxIndex]);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);
  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p) setIndex((i) => (i >= maxIndex ? 0 : i));
      return !p;
    });
  }, [maxIndex]);

  const moveLabel = useMemo(() => {
    if (index === 0) return "Starting position";
    const moveNum = Math.ceil(index / 2);
    const isBlack = index % 2 === 0;
    return `${moveNum}${isBlack ? "..." : "."} ${sans[index - 1]}`;
  }, [index, sans]);

  return (
    <div className="glass-card flex flex-col items-center gap-3 p-4">
      <Chessboard
        position={fens[index]}
        boardWidth={280}
        arePiecesDraggable={false}
        customBoardStyle={{ borderRadius: "8px", overflow: "hidden" }}
        customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
        customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
        customPieces={customPieces}
      />
      <p className="text-xs text-stone-400">{moveLabel}</p>
      <div className="flex items-center gap-1.5">
        {[
          { label: "⏮", action: reset, title: "Reset" },
          { label: "◀", action: goBack, title: "Back" },
          {
            label: playing ? "⏸" : "▶",
            action: togglePlay,
            title: playing ? "Pause" : "Play",
          },
          { label: "▶", action: goForward, title: "Forward" },
        ].map(({ label, action, title }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={action}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm text-stone-300 transition-colors hover:border-white/[0.15] hover:text-white"
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-stone-600">
        {index} / {maxIndex} moves
      </p>
    </div>
  );
}
