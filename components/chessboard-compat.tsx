"use client";

/**
 * Compatibility wrapper for react-chessboard v5.
 *
 * Accepts the v4-style props used throughout the codebase and maps them
 * to the v5 `options` API. This avoids rewriting every <Chessboard> usage.
 */

import React, { useEffect, useRef, useState } from "react";
import { Chessboard as ChessboardV5, defaultPieces } from "react-chessboard";
import type { ChessboardOptions } from "react-chessboard";
import type {
  Arrow,
  PieceDropHandlerArgs,
  PieceHandlerArgs,
  SquareHandlerArgs,
  PieceRenderObject,
} from "react-chessboard";

// v4-style Square type — just a string alias
export type CbSquare = string;
export type PromotionPieceOption = string;

type V4ArrowTuple = [string, string, string?];

export interface ChessboardCompatProps {
  id?: string;
  key?: string;
  position?: string;
  boardOrientation?: "white" | "black";
  boardWidth?: number;
  arePiecesDraggable?: boolean;
  isDraggablePiece?: (args: { piece: string; sourceSquare: string }) => boolean;
  animationDuration?: number;
  showBoardNotation?: boolean;

  // Styles
  customBoardStyle?: React.CSSProperties;
  customDarkSquareStyle?: React.CSSProperties;
  customLightSquareStyle?: React.CSSProperties;
  customSquareStyles?: Record<string, React.CSSProperties>;

  // Pieces
  customPieces?: Record<
    string,
    (props: { squareWidth: number; square?: string }) => React.ReactElement
  >;

  // Callbacks — v4 signatures
  onPieceDrop?: (
    sourceSquare: string,
    targetSquare: string,
    piece?: string,
  ) => boolean;
  onSquareClick?: (square: string) => void;
  onMouseOverSquare?: (square: string) => void;
  onMouseOutSquare?: (square: string) => void;
  onPieceDragBegin?: (piece: string, sourceSquare: string) => void;
  onBoardWidthChange?: (width: number) => void;
  onPromotionPieceSelect?: (
    piece: string | undefined,
    promoteFromSquare?: string,
    promoteToSquare?: string,
  ) => boolean;

  // Promotion dialog
  showPromotionDialog?: boolean;
  promotionToSquare?: string;

  // Arrows
  customArrows?: V4ArrowTuple[] | any[];

  // Custom square renderer
  customSquare?: React.ComponentType<any>;
}

/**
 * Convert v4-style customPieces to v5 PieceRenderObject.
 *
 * v4: `(props: { squareWidth: number; square?: string }) => ReactElement`
 * v5: `(props?: { fill?: string; square?: string; svgStyle?: CSSProperties }) => JSX.Element`
 *
 * We wrap each renderer to bridge the signatures. Since v5 no longer passes
 * squareWidth directly, we use a ResizeObserver on the board container to
 * measure it.
 */
function convertCustomPieces(
  v4Pieces: Record<
    string,
    (props: { squareWidth: number; square?: string }) => React.ReactElement
  >,
  squareWidth: number,
): PieceRenderObject {
  // Start with all 12 default piece renderers so any piece type not in our
  // custom set falls back to the standard SVG instead of being `undefined`
  // (which would cause React error #130 inside react-chessboard).
  const result: PieceRenderObject = { ...defaultPieces };
  for (const [code, renderer] of Object.entries(v4Pieces)) {
    result[code] = (props?: { fill?: string; square?: string }) => {
      return renderer({ squareWidth, square: props?.square });
    };
  }
  return result;
}

function convertArrows(v4Arrows?: V4ArrowTuple[] | any[]): Arrow[] | undefined {
  if (!v4Arrows || v4Arrows.length === 0) return undefined;
  return v4Arrows.map((a: any) => {
    if (Array.isArray(a)) {
      return {
        startSquare: a[0],
        endSquare: a[1],
        color: a[2] ?? "rgba(255, 170, 0, 0.8)",
      };
    }
    return a as Arrow;
  });
}

export function Chessboard(props: ChessboardCompatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(props.boardWidth ?? 400);

  // Dedup ref: prevent double-fire when both onPieceClick and onSquareClick
  // trigger for the same square within a single event cycle.
  const lastPieceClickRef = useRef<{ square: string; time: number } | null>(
    null,
  );

  // Measure board width for customPieces squareWidth calculation
  useEffect(() => {
    if (props.boardWidth) {
      setMeasuredWidth(props.boardWidth);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setMeasuredWidth(w);
          props.onBoardWidthChange?.(w);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [props.boardWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  const squareWidth = measuredWidth / 8;

  // v4 accepted "start" as a special keyword for the initial position; v5 only accepts FEN strings.
  // Also guard against empty strings which produce garbage boards.
  const STARTING_FEN =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const position =
    !props.position || props.position === "start"
      ? STARTING_FEN
      : props.position;

  // v5 uses document.querySelector(`#${id}-square-...`) internally for
  // animation calculations. IDs containing dots, slashes, or spaces break
  // CSS selectors, so we sanitise the id to only keep safe characters.
  const safeId = props.id?.replace(/[^a-zA-Z0-9_-]/g, "-");

  const options: ChessboardOptions = {
    id: safeId,
    position,
    boardOrientation: props.boardOrientation,
    allowDragging: props.arePiecesDraggable,
    animationDurationInMs: props.animationDuration,
    showNotation: props.showBoardNotation,

    // Styles
    boardStyle: {
      ...(props.customBoardStyle ?? {}),
      ...(props.boardWidth
        ? { width: props.boardWidth, height: props.boardWidth }
        : {}),
    },
    darkSquareStyle: props.customDarkSquareStyle,
    lightSquareStyle: props.customLightSquareStyle,
    // When squareRenderer is provided, v5 skips the fallback div that applies
    // squareStyles — so we inject them via the wrapper below instead.
    squareStyles: props.customSquare ? undefined : props.customSquareStyles,

    // Arrows
    arrows: convertArrows(props.customArrows),

    // Pieces
    pieces: props.customPieces
      ? convertCustomPieces(props.customPieces, squareWidth)
      : undefined,

    // Drag activation distance — prevent dnd-kit's PointerSensor from
    // blocking click events due to natural mouse jitter (<5px). Without this,
    // even 1px of movement during a click activates the drag and adds a
    // document-level click-event stopper that prevents onSquareClick from firing.
    dragActivationDistance: 5,

    // Callbacks — adapt v4 signatures to v5
    onPieceDrop: props.onPieceDrop
      ? ({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
          return props.onPieceDrop!(
            sourceSquare ?? "",
            targetSquare ?? "",
            piece?.pieceType,
          );
        }
      : undefined,

    onSquareClick: props.onSquareClick
      ? ({ square }: SquareHandlerArgs) => {
          // Skip if onPieceClick already handled this square in the same event cycle
          const last = lastPieceClickRef.current;
          if (last && last.square === square && Date.now() - last.time < 50)
            return;
          props.onSquareClick!(square);
        }
      : undefined,

    // Forward piece clicks to the same handler. In v5, the dnd-kit Draggable
    // wrapper can prevent click events from bubbling from Piece to Square, so
    // we need onPieceClick as the primary click path for occupied squares.
    onPieceClick: props.onSquareClick
      ? ({ square }: PieceHandlerArgs) => {
          lastPieceClickRef.current = {
            square: square ?? "",
            time: Date.now(),
          };
          props.onSquareClick!(square ?? "");
        }
      : undefined,

    onPieceDrag: props.onPieceDragBegin
      ? ({ piece, square }: PieceHandlerArgs) => {
          props.onPieceDragBegin!(piece.pieceType, square ?? "");
        }
      : undefined,

    canDragPiece: props.isDraggablePiece
      ? ({ piece, square }: PieceHandlerArgs) => {
          return props.isDraggablePiece!({
            piece: piece.pieceType,
            sourceSquare: square ?? "",
          });
        }
      : undefined,

    onMouseOverSquare: props.onMouseOverSquare
      ? ({ square }: SquareHandlerArgs) => {
          props.onMouseOverSquare!(square ?? "");
        }
      : undefined,

    onMouseOutSquare: props.onMouseOutSquare
      ? ({ square }: SquareHandlerArgs) => {
          props.onMouseOutSquare!(square ?? "");
        }
      : undefined,

    // Square renderer — wrap to re-inject squareStyles as `style` prop, since
    // v5 only applies squareStyles in the fallback path (skipped when squareRenderer is set).
    squareRenderer: props.customSquare
      ? (((rendererProps: any) => {
          const sq = rendererProps?.square as string | undefined;
          const squareStyle =
            sq && props.customSquareStyles
              ? props.customSquareStyles[sq]
              : undefined;
          return (props.customSquare as any)({
            ...rendererProps,
            style: squareStyle,
          });
        }) as any)
      : undefined,
  };

  // --- Promotion dialog overlay (v5 removed the built-in one) ---
  const promoOverlay =
    props.showPromotionDialog && props.promotionToSquare
      ? (() => {
          const sq = props.promotionToSquare!;
          const rank = parseInt(sq[1]);
          const colorPrefix = rank === 8 ? "w" : "b";
          const pieces = ["Q", "R", "B", "N"];
          const file = sq.charCodeAt(0) - 97; // 0-7

          // Board might be flipped
          const isFlipped = props.boardOrientation === "black";
          const leftPct = isFlipped ? ((7 - file) / 8) * 100 : (file / 8) * 100;
          const topPct = isFlipped
            ? rank === 8
              ? (7 / 8) * 100
              : 0
            : rank === 8
              ? 0
              : (4 / 8) * 100;

          return (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 100,
                background: "rgba(0,0,0,0.45)",
              }}
              onClick={() => props.onPromotionPieceSelect?.(undefined)}
            >
              <div
                style={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${100 / 8}%`,
                  display: "flex",
                  flexDirection: "column",
                  background: "#fff",
                  borderRadius: 4,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {pieces.map((p) => {
                  const pieceCode = `${colorPrefix}${p}`;
                  return (
                    <button
                      key={p}
                      style={{
                        aspectRatio: "1",
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: squareWidth * 0.7,
                      }}
                      onMouseOver={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(0,0,0,0.1)";
                      }}
                      onMouseOut={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                      }}
                      onClick={() => {
                        props.onPromotionPieceSelect?.(
                          pieceCode,
                          undefined,
                          sq,
                        );
                      }}
                    >
                      {promoUnicode(pieceCode)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()
      : null;

  const board = <ChessboardV5 options={options} />;

  // Wrap in a container div so we can measure width when boardWidth isn't provided
  if (props.boardWidth) {
    return (
      <div style={{ position: "relative" }}>
        {board}
        {promoOverlay}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      {board}
      {promoOverlay}
    </div>
  );
}

/** Map piece codes like "wQ" to unicode chess symbols */
function promoUnicode(code: string): string {
  const map: Record<string, string> = {
    wQ: "\u2655",
    wR: "\u2656",
    wB: "\u2657",
    wN: "\u2658",
    bQ: "\u265B",
    bR: "\u265C",
    bB: "\u265D",
    bN: "\u265E",
  };
  return map[code] ?? code;
}
