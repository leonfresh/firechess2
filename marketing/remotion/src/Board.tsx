import React from "react";
import { Chessboard } from "react-chessboard";

/**
 * The REAL react-chessboard (v5), same square colors the site uses.
 * Animation disabled so each frame is deterministic for Remotion.
 * `rings` maps a square -> ring color (last-move / blunder highlight).
 */
export const Board: React.FC<{
  id: string;
  fen: string;
  size: number;
  rings?: Record<string, string>;
}> = ({ id, fen, size, rings = {} }) => {
  const squareStyles: Record<string, React.CSSProperties> = {};
  for (const [sq, color] of Object.entries(rings)) {
    squareStyles[sq] = { boxShadow: `inset 0 0 0 6px ${color}` };
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 16px 56px rgba(0,0,0,.55), 0 0 0 4px rgba(168,85,247,.3)",
      }}
    >
      <Chessboard
        options={{
          id,
          position: fen,
          allowDragging: false,
          showNotation: false,
          animationDurationInMs: 0,
          darkSquareStyle: { backgroundColor: "#779952" },
          lightSquareStyle: { backgroundColor: "#edeed1" },
          squareStyles,
          boardStyle: { width: size, height: size },
        }}
      />
    </div>
  );
};
