"use client";

import { useMemo, type CSSProperties } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { MoveBadge } from "@/components/move-badge";
import { useBoardSize } from "@/lib/use-board-size";
import {
  useBoardTheme,
  useCustomPieces,
  useShowCoordinates,
} from "@/lib/use-coins";
import type { BrilliantMove } from "@/lib/types";

function formatEval(cp: number) {
  if (Math.abs(cp) >= 99000) {
    const mate = 100000 - Math.abs(cp);
    return `${cp > 0 ? "+" : "-"}M${Math.max(1, mate)}`;
  }

  const pawns = cp / 100;
  return `${pawns > 0 ? "+" : ""}${(Math.round(pawns * 10) / 10).toFixed(1)}`;
}

function toWhiteEval(fen: string, cp: number) {
  return fen.includes(" w ") ? cp : -cp;
}

function moveSquareStyles(move: BrilliantMove) {
  return {
    [move.userMove.slice(0, 2)]: {
      backgroundColor: "rgba(34, 211, 238, 0.18)",
    },
    [move.userMove.slice(2, 4)]: {
      backgroundColor: "rgba(34, 211, 238, 0.35)",
    },
  } as Record<string, CSSProperties>;
}

function moveSan(fen: string, uci: string) {
  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined,
    });
    if (move) return move.san;
  } catch {
    // fall through to formatting below
  }
  // Human-readable fallback instead of raw UCI
  const to = uci.slice(2, 4);
  const promo = uci.length > 4 ? `=${uci[4].toUpperCase()}` : "";
  return `${to}${promo}`;
}

export function BrilliantMoveCard({
  move,
  onOpenAnalysis,
}: {
  move: BrilliantMove;
  onOpenAnalysis?: () => void;
}) {
  const { ref: boardRef, size: boardSize } = useBoardSize(440);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();
  const orientation = move.userColor === "black" ? "black" : "white";
  const san = useMemo(() => moveSan(move.fenBefore, move.userMove), [move]);
  const bestSan = useMemo(
    () => (move.bestMove ? moveSan(move.fenBefore, move.bestMove) : null),
    [move],
  );
  // Show eval BEFORE the brilliant move (board shows the position you're asked to find it in)
  const whiteEvalBefore = toWhiteEval(move.fenBefore, move.cpBefore);
  // Arrow showing the brilliant move: from → to in cyan
  const moveArrow: [string, string, string] = [
    move.userMove.slice(0, 2),
    move.userMove.slice(2, 4),
    "rgba(34, 211, 238, 0.85)",
  ];

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-cyan-500/15 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_rgba(15,23,42,0.82)_42%,_rgba(2,6,23,0.96)_100%)] shadow-[0_20px_60px_-38px_rgba(34,211,238,0.55)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="border-b border-[#1e1a24] p-4 lg:border-b-0 lg:border-r">
          <div ref={boardRef} className="mx-auto w-full max-w-[430px]">
            <div className="flex items-start gap-2">
              <EvalBar evalCp={whiteEvalBefore} height={boardSize} />
              <div className="overflow-hidden rounded-xl">
                <Chessboard
                  id={`brilliant-${move.gameIndex}-${move.moveNumber}-${move.userMove}`}
                  position={move.fenBefore}
                  boardOrientation={orientation}
                  boardWidth={boardSize}
                  arePiecesDraggable={false}
                  customDarkSquareStyle={{
                    backgroundColor: boardTheme.darkSquare,
                  }}
                  customLightSquareStyle={{
                    backgroundColor: boardTheme.lightSquare,
                  }}
                  showBoardNotation={showCoords}
                  customSquareStyles={moveSquareStyles(move)}
                  customArrows={[moveArrow]}
                  customPieces={customPieces}
                  customSquare={(props: any) => {
                    const square = props?.square as string | undefined;
                    const showBadge = square === move.userMove.slice(2, 4);

                    return (
                      <div
                        style={props?.style}
                        className="relative h-full w-full"
                      >
                        {props?.children}
                        {showBadge ? (
                          <MoveBadge
                            classification="brilliant"
                            variant="corner"
                          />
                        ) : null}
                      </div>
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <MoveBadge classification="brilliant" />
              <span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-100">
                Game {move.gameIndex} · Move {move.moveNumber}
              </span>
            </div>
            <div className="text-right text-xs text-[#8d8696]">
              <p>{move.userColor === "white" ? "White" : "Black"} to move</p>
              <p>
                {formatEval(move.cpBefore)} → {formatEval(move.cpAfter)}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black tracking-tight text-white">
              {san}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#f0edf2]">
              {move.reason}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#1e1a24] bg-[#ff5a1f]/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#565061]">
                Played move
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{san}</p>
              <p className="mt-1 text-xs text-[#8d8696]">
                Eval gain {((move.cpAfter - move.cpBefore) / 100).toFixed(1)}{" "}
                pawns
              </p>
            </div>
            <div className="rounded-2xl border border-[#1e1a24] bg-[#ff5a1f]/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#565061]">
                Engine line
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {bestSan ?? san}
              </p>
              <p className="mt-1 text-xs text-[#8d8696]">
                {move.line && move.line.length > 0
                  ? move.line.join(" ")
                  : "Principal variation ready in the clean board."}
              </p>
            </div>
          </div>

          {onOpenAnalysis ? (
            <button
              type="button"
              onClick={onOpenAnalysis}
              className="inline-flex items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Open clean analysis board
            </button>
          ) : null}

          {move.gameUrl?.startsWith("http") ? (
            <a
              href={`${move.gameUrl}${move.gameUrl.includes("lichess.org") ? `#${(move.moveNumber - 1) * 2 + (move.userColor === "white" ? 1 : 2)}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.04] px-4 py-2 text-xs font-semibold text-[#8d8696] transition hover:border-[#ff5a1f]/30 hover:bg-[#1e1a24] hover:text-white"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View game
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
