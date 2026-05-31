"use client";

import Link from "next/link";
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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

// useLayoutEffect fires before paint on the client; fall back to useEffect on the server
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type ReplayStep = {
  fen: string;
  from: string | null;
  to: string | null;
  label: string;
};

function getPgnRootFen(pgnText: string) {
  const fenHeader = pgnText.match(/\[FEN\s+"([^"]+)"\]/)?.[1];
  const setUp = /\[SetUp\s+"1"\]/.test(pgnText);

  if (!fenHeader || !setUp) return STARTING_FEN;

  try {
    return new Chess(fenHeader).fen();
  } catch {
    return STARTING_FEN;
  }
}

function buildReplaySteps(pgn: string | null | undefined) {
  const pgnValue = pgn?.trim();
  if (!pgnValue) return null;

  try {
    const replayChess = new Chess();
    replayChess.loadPgn(pgnValue);
    const history = replayChess.history({ verbose: true });
    if (history.length === 0) return null;

    const rootFen = getPgnRootFen(pgnValue);
    const board = rootFen === STARTING_FEN ? new Chess() : new Chess(rootFen);
    const steps: ReplayStep[] = [
      {
        fen: board.fen(),
        from: null,
        to: null,
        label: "Start position",
      },
    ];

    for (const move of history) {
      const moveNumber = Number(board.fen().split(" ")[5] ?? "1") || 1;
      const result = board.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion ?? undefined,
      });

      if (!result) {
        return null;
      }

      steps.push({
        fen: board.fen(),
        from: result.from,
        to: result.to,
        label:
          result.color === "w"
            ? `${moveNumber}. ${result.san}`
            : `${moveNumber}... ${result.san}`,
      });
    }

    return steps;
  } catch {
    return null;
  }
}

export function CommunityBoardPreview({
  fen,
  pgn,
  orientation = "white",
  size = 240,
  showCoordinates,
  href,
  showReplayControls = true,
}: {
  fen?: string | null;
  pgn?: string | null;
  orientation?: "white" | "black";
  size?: number;
  showCoordinates?: boolean;
  href?: string;
  showReplayControls?: boolean;
}) {
  const instanceId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const coinCoordinates = useShowCoordinates();
  const [boardWidth, setBoardWidth] = useState(0);

  const replaySteps = useMemo(
    () => (showReplayControls ? buildReplaySteps(pgn) : null),
    [pgn, showReplayControls],
  );
  const maxStepIndex = replaySteps ? replaySteps.length - 1 : 0;
  const hasReplayControls = Boolean(replaySteps && replaySteps.length > 1);
  const [currentStepIndex, setCurrentStepIndex] = useState(maxStepIndex);
  const [autoplay, setAutoplay] = useState(false);

  const lastMove = useMemo(() => {
    if (hasReplayControls) {
      const currentStep = replaySteps?.[currentStepIndex] ?? null;
      if (!currentStep?.from || !currentStep?.to) return null;

      return {
        from: currentStep.from,
        to: currentStep.to,
        label: currentStep.label,
      };
    }

    const fallbackReplay = buildReplaySteps(pgn);
    const finalStep = fallbackReplay?.at(-1) ?? null;
    if (!finalStep?.from || !finalStep?.to) return null;

    return {
      from: finalStep.from,
      to: finalStep.to,
      label: finalStep.label,
    };
  }, [currentStepIndex, hasReplayControls, pgn, replaySteps]);

  const displayedFen =
    hasReplayControls && replaySteps
      ? (replaySteps[currentStepIndex]?.fen ?? fen ?? STARTING_FEN)
      : (fen ?? STARTING_FEN);

  const currentReplayLabel =
    hasReplayControls && replaySteps
      ? (replaySteps[currentStepIndex]?.label ?? "Start position")
      : null;

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
    setCurrentStepIndex(maxStepIndex);
    setAutoplay(false);
  }, [maxStepIndex, pgn]);

  useIsomorphicLayoutEffect(() => {
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

  useEffect(() => {
    if (!autoplay || !hasReplayControls) return;
    if (currentStepIndex >= maxStepIndex) {
      setAutoplay(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentStepIndex((current) => Math.min(maxStepIndex, current + 1));
    }, 850);

    return () => window.clearTimeout(timer);
  }, [autoplay, currentStepIndex, hasReplayControls, maxStepIndex]);

  const jumpToStart = () => {
    setAutoplay(false);
    setCurrentStepIndex(0);
  };

  const stepBackward = () => {
    setAutoplay(false);
    setCurrentStepIndex((current) => Math.max(0, current - 1));
  };

  const toggleAutoplay = () => {
    if (!hasReplayControls) return;

    if (autoplay) {
      setAutoplay(false);
      return;
    }

    if (currentStepIndex >= maxStepIndex) {
      setCurrentStepIndex(0);
    }

    setAutoplay(true);
  };

  const stepForward = () => {
    setAutoplay(false);
    setCurrentStepIndex((current) => Math.min(maxStepIndex, current + 1));
  };

  const jumpToEnd = () => {
    setAutoplay(false);
    setCurrentStepIndex(maxStepIndex);
  };

  const boardElement = (
    <Chessboard
      id={`community-preview-${instanceId}-${orientation}-${size}`}
      position={displayedFen}
      boardOrientation={orientation}
      arePiecesDraggable={false}
      boardWidth={boardWidth}
      showBoardNotation={showCoordinates ?? (coinCoordinates && size >= 220)}
      customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
      customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
      customSquareStyles={customSquareStyles}
      customPieces={customPieces}
    />
  );

  return (
    <div
      ref={frameRef}
      className="w-full max-w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 shadow-xl shadow-black/20"
      style={{ maxWidth: `${size}px` }}
    >
      {href && !hasReplayControls ? (
        <Link href={href} className="block">
          {boardElement}
        </Link>
      ) : (
        boardElement
      )}

      {hasReplayControls ? (
        <div className="border-t border-white/[0.08] bg-white/[0.03] px-3 py-3">
          <div className="flex flex-col gap-2 text-[11px] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="font-semibold uppercase tracking-[0.16em] text-slate-500">
                Game Replay
              </span>
              <p className="mt-1 truncate font-mono text-slate-200">
                {currentStepIndex === 0 ? "Start position" : currentReplayLabel}
              </p>
            </div>
            <span className="self-start rounded-full border border-white/[0.08] bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-slate-300 sm:self-auto">
              {currentStepIndex}/{maxStepIndex}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-slate-200 sm:flex-nowrap">
            <button
              type="button"
              onClick={jumpToStart}
              disabled={currentStepIndex === 0}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] transition hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Jump to start"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M6 6h2v12H6zm3.5 6l8.5 6V6z"
                  transform="scale(-1,1) translate(-24,0)"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={stepBackward}
              disabled={currentStepIndex === 0}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] transition hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous move"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={toggleAutoplay}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/25 bg-cyan-500/12 text-cyan-100 transition hover:brightness-110"
              aria-label={autoplay ? "Pause autoplay" : "Autoplay moves"}
            >
              {autoplay ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 19h4V5H6zm8-14v14h4V5z" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="m8 5 11 7-11 7z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={stepForward}
              disabled={currentStepIndex >= maxStepIndex}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] transition hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next move"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="m8.59 16.59 4.58-4.59-4.58-4.59L10 6l6 6-6 6z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={jumpToEnd}
              disabled={currentStepIndex >= maxStepIndex}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] transition hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Jump to end"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
          </div>
        </div>
      ) : lastMove ? (
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px]">
          <span className="font-semibold uppercase tracking-[0.16em] text-slate-500">
            Previous Move
          </span>
          <span className="truncate font-mono text-slate-200">
            {lastMove.label}
          </span>
        </div>
      ) : null}
    </div>
  );
}
