"use client";

/**
 * MiniChessBoard — tiny SVG chess board from a 64-char position string.
 *
 * Position string: rank 8 → rank 1, file a → h. Use '.' for empty squares.
 * Upper-case = White pieces, lower-case = Black pieces.
 * Piece codes: K Q R B N P / k q r b n p
 */

const PIECE_IMAGE_MAP: Record<string, string> = {
  K: "/pieces/chess24/wK.png",
  Q: "/pieces/chess24/wQ.png",
  R: "/pieces/chess24/wR.png",
  B: "/pieces/chess24/wB.png",
  N: "/pieces/chess24/wN.png",
  P: "/pieces/chess24/wP.png",
  k: "/pieces/chess24/bK.png",
  q: "/pieces/chess24/bQ.png",
  r: "/pieces/chess24/bR.png",
  b: "/pieces/chess24/bB.png",
  n: "/pieces/chess24/bN.png",
  p: "/pieces/chess24/bP.png",
};

export function MiniChessBoard({
  pos,
  highlight,
}: {
  pos: string;
  highlight?: number;
}) {
  const cells = pos.padEnd(64, ".").slice(0, 64).split("");
  const CELL = 8;
  return (
    <svg viewBox={`0 0 ${CELL * 8} ${CELL * 8}`} className="h-full w-full">
      <defs>
        <linearGradient id="mini-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8efff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id="mini-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#87a7f3" />
          <stop offset="100%" stopColor="#6d7bd4" />
        </linearGradient>
        <linearGradient id="mini-highlight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {cells.map((piece, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const light = (col + row) % 2 === 0;
        const px = col * CELL;
        const py = row * CELL;
        const pieceSrc = piece !== "." ? (PIECE_IMAGE_MAP[piece] ?? "") : "";
        const isHighlight = highlight !== undefined && i === highlight;
        return (
          <g key={i}>
            <rect
              x={px}
              y={py}
              width={CELL}
              height={CELL}
              fill={
                isHighlight
                  ? "url(#mini-highlight)"
                  : light
                    ? "url(#mini-light)"
                    : "url(#mini-dark)"
              }
            />
            {pieceSrc && (
              <image
                x={px + CELL / 2}
                y={py + CELL / 2}
                width={CELL * 0.92}
                height={CELL * 0.92}
                href={pieceSrc}
                transform={`translate(${-CELL * 0.46} ${-CELL * 0.46})`}
                preserveAspectRatio="xMidYMid meet"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
