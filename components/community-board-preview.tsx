"use client";

import { Chessboard } from "@/components/chessboard-compat";
import {
  useBoardTheme,
  useCustomPieces,
  useShowCoordinates,
} from "@/lib/use-coins";
import { STARTING_FEN } from "@/lib/community-shared";
import { Chess } from "chess.js";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export function CommunityBoardPreview({
  fen,
  pgn,
  orientation = "white",
  size = 240,
  showCoordinates,
}: {
  fen?: string | null;
  pgn?: string | null;
  orientation?: "white" | "black";
  size?: number;
  showCoordinates?: boolean;
}) {
  const instanceId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const coinCoordinates = useShowCoordinates();
  const [boardWidth, setBoardWidth] = useState(size);

  const lastMove = useMemo(() => {
    const pgnValue = pgn?.trim();
    if (!pgnValue) return null;

    try {
      const chess = new Chess();
      chess.loadPgn(pgnValue);
      const history = chess.history({ verbose: true });
      const lastPlayedMove = history.at(-1);
      if (!lastPlayedMove) return null;

      const plyCount = history.length;
      const moveNumber = Math.ceil(plyCount / 2);
      const label =
        lastPlayedMove.color === "w"
          ? `${moveNumber}. ${lastPlayedMove.san}`
          : `${moveNumber}... ${lastPlayedMove.san}`;

      return {
        from: lastPlayedMove.from,
        to: lastPlayedMove.to,
        label,
      };
    } catch {
      return null;
    }
  }, [pgn]);

  const customSquareStyles = useMemo(() => {
    if (!lastMove) return undefined;

    const highlightStyles: Record<string, CSSProperties> = {
      [lastMove.from]: {
        background: "rgba(34, 211, 238, 0.28)",
        borderRadius: "4px",
        boxShadow: "inset 0 0 0 2px rgba(125, 211, 252, 0.42)",
      },
      [lastMove.to]: {
        background: "rgba(249, 115, 22, 0.3)",
        borderRadius: "4px",
        boxShadow: "inset 0 0 0 2px rgba(253, 186, 116, 0.5)",
      },
    };

    return highlightStyles;
  }, [lastMove]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateBoardWidth = () => {
      const nextWidth = Math.floor(frame.clientWidth);
      if (nextWidth > 0) {
        setBoardWidth(Math.min(size, nextWidth));
      }
    };

    updateBoardWidth();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateBoardWidth);
    observer.observe(frame);

    return () => observer.disconnect();
  }, [size]);

  return (
    <div
      ref={frameRef}
      className="w-full max-w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 shadow-xl shadow-black/20"
      style={{ maxWidth: `${size}px` }}
    >
      <Chessboard
        id={`community-preview-${instanceId}-${orientation}-${size}`}
        position={fen || STARTING_FEN}
        boardOrientation={orientation}
        arePiecesDraggable={false}
        boardWidth={boardWidth}
        showBoardNotation={showCoordinates ?? (coinCoordinates && size >= 220)}
        customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
        customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
        customSquareStyles={customSquareStyles}
        customPieces={customPieces}
      />

      {lastMove && (
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px]">
          <span className="font-semibold uppercase tracking-[0.16em] text-slate-500">
            Previous Move
          </span>
          <span className="truncate font-mono text-slate-200">
            {lastMove.label}
          </span>
        </div>
      )}
    </div>
  );
}
