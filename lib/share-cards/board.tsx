/**
 * Board rendering for FireChess share cards.
 * Renders a FEN position into a React element tree that next/og (satori)
 * can rasterise. Pieces come from the Lichess CDN (cburnett set) and are
 * embedded as base64 data URIs so satori does not need external fetches
 * at render time.
 */

import type { ReactElement } from "react";
import { LICHESS_PIECE_CDN, PIECE_SET } from "./theme";

/* ── Types ─────────────────────────────────────────────────────────────── */

export type BoardOrientation = "white" | "black";

export interface BoardRenderOptions {
  /** Square edge length in px (board = 8 * squareSize) */
  squareSize: number;
  /** Light square colour */
  lightSq: string;
  /** Dark square colour */
  darkSq: string;
  /** Which side is at the bottom */
  orientation: BoardOrientation;
  /** Optional arrow: from square → to square (e.g. ["e2","e4"]) */
  arrow?: [string, string] | null;
  /** Optional last-move highlight squares */
  highlight?: [string, string] | null;
  /** Optional check-square highlight */
  checkSquare?: string | null;
  /** Optional badge drawn on a square (e.g. "!!" on the brilliant-move destination) */
  badge?: { square: string; text: string; color: string } | null;
  /** Border radius of the whole board wrapper */
  borderRadius?: number;
  /** Box-shadow / glow colour */
  glowColor?: string;
}

/* ── FEN helpers ───────────────────────────────────────────────────────── */

/** Unicode fallback glyphs (used if the CDN fetch fails) */
const PIECE_CHAR: Record<string, string> = {
  K: "\u2654", Q: "\u2655", R: "\u2656", B: "\u2657", N: "\u2658", P: "\u2659",
  k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F",
};

/** Map FEN char → Lichess piece key (e.g. "K" → "wK", "q" → "bQ") */
function fenCharToPieceKey(ch: string): string {
  const isWhite = ch === ch.toUpperCase();
  return `${isWhite ? "w" : "b"}${ch.toUpperCase()}`;
}

/** Parse a FEN board into an 8×8 matrix. Row 0 = rank 8, Col 0 = file a. */
export function parseFenBoard(fen: string): (string | null)[][] {
  const ranks = fen.split(" ")[0].split("/");
  const board: (string | null)[][] = [];
  for (const rank of ranks) {
    const row: (string | null)[] = [];
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch, 10); i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    board.push(row);
  }
  return board;
}

/** Convert algebraic square (e.g. "e4") to [row, col] in the un-flipped matrix. */
function squareToCoords(sq: string): [number, number] | null {
  const file = sq.charCodeAt(0) - 97; // a=0
  const rank = parseInt(sq[1], 10);
  if (file < 0 || file > 7 || rank < 1 || rank > 8) return null;
  return [8 - rank, file];
}

/** Fetch an image and return a base64 data URI */
async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const ct = res.headers.get("content-type") ?? "image/svg+xml";
    return `data:${ct};base64,${base64}`;
  } catch {
    return null;
  }
}

/* ── Public API ────────────────────────────────────────────────────────── */

export interface PreparedBoard {
  /** 8×8 matrix, already flipped if orientation is black */
  board: (string | null)[][];
  /** Map FEN char → data URI */
  pieceUris: Record<string, string>;
  /** Arrow in flipped-matrix coordinates */
  arrow: { from: [number, number]; to: [number, number] } | null;
  /** Highlight squares in flipped-matrix coordinates */
  highlight: [number, number][] | null;
  /** Check square in flipped-matrix coordinates */
  checkSquare: [number, number] | null;
  /** Badge in flipped-matrix coordinates */
  badge: { at: [number, number]; text: string; color: string } | null;
  /** Side to move (w/b) */
  sideToMove: "w" | "b";
}

/**
 * Parse the FEN, fetch piece images, and normalise geometry for the requested orientation.
 */
export async function prepareBoard(
  fen: string,
  opts: Pick<
    BoardRenderOptions,
    "orientation" | "arrow" | "highlight" | "checkSquare" | "badge"
  >,
): Promise<PreparedBoard> {
  const flip = opts.orientation === "black";
  const raw = parseFenBoard(fen);

  // Collect unique pieces and fetch their SVGs in parallel
  const unique = new Set<string>();
  for (const row of raw) for (const cell of row) if (cell) unique.add(cell);
  const keys = Array.from(unique);
  const uris = await Promise.all(
    keys.map((ch) => fetchAsDataUri(`${LICHESS_PIECE_CDN}/${PIECE_SET}/${fenCharToPieceKey(ch)}.svg`)),
  );
  const pieceUris: Record<string, string> = {};
  keys.forEach((ch, i) => {
    const uri = uris[i];
    if (uri) pieceUris[ch] = uri;
  });

  // Flip matrix if black is on bottom
  const board = flip ? raw.map((r) => [...r].reverse()).reverse() : raw;

  const mapSq = (sq: string): [number, number] | null => {
    const c = squareToCoords(sq);
    if (!c) return null;
    return flip ? [7 - c[0], 7 - c[1]] : c;
  };

  return {
    board,
    pieceUris,
    arrow: opts.arrow
      ? (() => {
          const from = mapSq(opts.arrow[0]);
          const to = mapSq(opts.arrow[1]);
          return from && to ? { from, to } : null;
        })()
      : null,
    highlight: opts.highlight
      ? (opts.highlight.map(mapSq).filter(Boolean) as [number, number][])
      : null,
    checkSquare: opts.checkSquare ? mapSq(opts.checkSquare) : null,
    badge: opts.badge
      ? (() => {
          const at = mapSq(opts.badge.square);
          return at ? { at, text: opts.badge.text, color: opts.badge.color } : null;
        })()
      : null,
    sideToMove: (fen.split(" ")[1] ?? "w") as "w" | "b",
  };
}

/* ── Satori-friendly React renderer ───────────────────────────────────── */

export function renderBoardElement(prep: PreparedBoard, opts: BoardRenderOptions): ReactElement {
  const { squareSize: SQ, lightSq, darkSq } = opts;
  const boardPx = SQ * 8;
  const radius = opts.borderRadius ?? 12;
  const glow = opts.glowColor ?? "rgba(0,0,0,0.5)";

  const isHighlighted = (r: number, c: number) =>
    prep.highlight?.some(([hr, hc]) => hr === r && hc === c) ?? false;
  const isCheck = (r: number, c: number) =>
    prep.checkSquare?.[0] === r && prep.checkSquare?.[1] === c;

  // Arrow geometry (in px, relative to board top-left). SVG is used because
  // satori/next-og renders CSS border-triangle arrows unreliably.
  let arrowEl: ReactElement | null = null;
  if (prep.arrow) {
    const { from, to } = prep.arrow;
    const x1 = from[1] * SQ + SQ / 2;
    const y1 = from[0] * SQ + SQ / 2;
    const x2 = to[1] * SQ + SQ / 2;
    const y2 = to[0] * SQ + SQ / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len > 0.5) {
      const ux = dx / len;
      const uy = dy / len;
      const headLen = Math.max(16, SQ * 0.34);
      const headW = Math.max(11, SQ * 0.24);
      const shaftW = Math.max(4, SQ * 0.09);
      // Stop the shaft at the base of the head so the tip lands on square centre.
      const bx = x2 - ux * headLen;
      const by = y2 - uy * headLen;
      // Perpendicular for the head wings / shaft width.
      const px = -uy;
      const py = ux;
      const sw = shaftW / 2;
      const hw = headW;
      const path =
        `M ${x1 + px * sw} ${y1 + py * sw} ` +
        `L ${bx + px * sw} ${by + py * sw} ` +
        `L ${bx + px * hw} ${by + py * hw} ` +
        `L ${x2} ${y2} ` +
        `L ${bx - px * hw} ${by - py * hw} ` +
        `L ${bx - px * sw} ${by - py * sw} ` +
        `L ${x1 - px * sw} ${y1 - py * sw} Z`;
      arrowEl = (
        <svg
          width={boardPx}
          height={boardPx}
          style={{ position: "absolute", left: 0, top: 0, display: "flex" }}
        >
          <path d={path} fill="rgba(251,146,60,0.88)" />
        </svg>
      );
    }
  }

  // Badge (e.g. "!!") drawn on the destination square.
  let badgeEl: ReactElement | null = null;
  if (prep.badge) {
    const [br, bc] = prep.badge.at;
    const d = Math.round(SQ * 0.42);
    badgeEl = (
      <div
        style={{
          position: "absolute",
          left: bc * SQ + SQ - d - 2,
          top: br * SQ + 2,
          width: d,
          height: d,
          borderRadius: d / 2,
          background: prep.badge.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid rgba(255,255,255,0.85)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
        }}
      >
        <span
          style={{
            fontSize: Math.round(SQ * 0.26),
            fontWeight: 900,
            color: "#062a30",
            lineHeight: 1,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {prep.badge.text}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        width: boardPx,
        height: boardPx,
        borderRadius: radius,
        overflow: "hidden",
        border: `2px solid rgba(255,255,255,0.12)`,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 8px 32px ${glow}`,
        position: "relative",
        flexShrink: 0,
      }}
    >
      {prep.board.map((row, r) => (
        <div key={r} style={{ display: "flex", flexDirection: "column" }}>
          {row.map((piece, c) => {
            const isLight = (r + c) % 2 === 0;
            const pieceUri = piece ? prep.pieceUris[piece] : null;
            const hl = isHighlighted(r, c);
            const ck = isCheck(r, c);
            return (
              <div
                key={c}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: SQ,
                  height: SQ,
                  backgroundColor: isLight ? lightSq : darkSq,
                  position: "relative",
                }}
              >
                {hl && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(251,191,36,0.35)",
                    }}
                  />
                )}
                {ck && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(239,68,68,0.45)",
                    }}
                  />
                )}
                {piece && pieceUri ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pieceUri}
                    width={SQ - 4}
                    height={SQ - 4}
                    style={{ objectFit: "contain", position: "relative" }}
                    alt=""
                  />
                ) : piece ? (
                  <span
                    style={{
                      fontSize: SQ * 0.72,
                      lineHeight: 1,
                      color: piece === piece.toUpperCase() ? "#f8f8f8" : "#1a1a1a",
                      textShadow:
                        piece === piece.toUpperCase()
                          ? "0 1px 2px rgba(0,0,0,0.4)"
                          : "0 1px 2px rgba(255,255,255,0.2)",
                      position: "relative",
                    }}
                  >
                    {PIECE_CHAR[piece] ?? ""}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
      {arrowEl}
      {badgeEl}
    </div>
  );
}
