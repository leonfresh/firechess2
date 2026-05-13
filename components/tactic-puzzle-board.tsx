"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useId,
  type CSSProperties,
} from "react";
import { Chessboard } from "@/components/chessboard-compat";
import {
  useBoardTheme,
  useCustomPieces,
  useShowCoordinates,
} from "@/lib/use-coins";
import { Chess } from "chess.js";

export interface PuzzleExample {
  fen: string;
  orientation: "white" | "black";
  puzzle: string;
  continuation: string;
  caption: string;
}

interface TacticPuzzleBoardProps {
  examples: PuzzleExample[];
  tacticName: string;
  variant?: "default" | "compact";
  showCoordinates?: boolean;
}

type Status = "ready" | "animating" | "solved" | "revealed";

type FeedbackTone = "correct" | "wrong" | "illegal" | "solved" | "revealed";

type FeedbackState = {
  tone: FeedbackTone;
  title: string;
  detail: string;
};

type PreparedMove = {
  san: string;
  from: string;
  to: string;
  promotion?: string;
  fenAfter: string;
};

function parseSanMoves(line: string) {
  return line
    .split(",")
    .map((move) => move.trim())
    .filter(Boolean);
}

function getFeedbackStyles(tone: FeedbackTone) {
  switch (tone) {
    case "correct":
      return {
        badge:
          "border-emerald-500/35 bg-emerald-500/12 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]",
        panel: "border-emerald-500/20 bg-emerald-500/[0.08]",
        accent: "text-emerald-300",
      };
    case "solved":
      return {
        badge:
          "border-emerald-500/35 bg-emerald-500/18 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]",
        panel: "border-emerald-500/20 bg-emerald-500/[0.1]",
        accent: "text-emerald-200",
      };
    case "revealed":
      return {
        badge:
          "border-amber-500/35 bg-amber-500/14 text-amber-100 shadow-[0_0_0_1px_rgba(245,158,11,0.12)]",
        panel: "border-amber-500/18 bg-amber-500/[0.08]",
        accent: "text-amber-200",
      };
    case "illegal":
      return {
        badge:
          "border-rose-500/35 bg-rose-500/14 text-rose-100 shadow-[0_0_0_1px_rgba(244,63,94,0.14)]",
        panel: "border-rose-500/18 bg-rose-500/[0.08]",
        accent: "text-rose-200",
      };
    case "wrong":
    default:
      return {
        badge:
          "border-red-500/35 bg-red-500/14 text-red-100 shadow-[0_0_0_1px_rgba(239,68,68,0.14)]",
        panel: "border-red-500/18 bg-red-500/[0.08]",
        accent: "text-red-200",
      };
  }
}

export function TacticPuzzleBoard({
  examples,
  tacticName,
  variant = "default",
  showCoordinates,
}: TacticPuzzleBoardProps) {
  const [exIdx, setExIdx] = useState(0);
  const [status, setStatus] = useState<Status>("ready");
  const [displayFen, setDisplayFen] = useState(examples[0].fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongBlink, setWrongBlink] = useState(false);
  const [wrongMove, setWrongMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [nextMoveIdx, setNextMoveIdx] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardInstanceId = useId();
  const example = examples[exIdx];
  const compact = variant === "compact";
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const coinCoordinates = useShowCoordinates();

  const preparedMoves = useMemo<PreparedMove[]>(() => {
    const chess = new Chess(example.fen);
    const sanMoves = [example.puzzle, ...parseSanMoves(example.continuation)];
    const moves: PreparedMove[] = [];

    for (const san of sanMoves) {
      const result = chess.move(san);
      if (!result) break;

      moves.push({
        san,
        from: result.from,
        to: result.to,
        promotion: result.promotion,
        fenAfter: chess.fen(),
      });
    }

    return moves;
  }, [example.continuation, example.fen, example.puzzle]);

  const clearSequenceTimer = useCallback(() => {
    if (sequenceTimerRef.current) {
      clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
  }, []);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  const clearTransientFeedback = useCallback(
    (tones: FeedbackTone[], delay = 950) => {
      clearFeedbackTimer();
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback((current) =>
          current && tones.includes(current.tone) ? null : current,
        );
        setWrongBlink(false);
        setWrongMove(null);
        feedbackTimerRef.current = null;
      }, delay);
    },
    [clearFeedbackTimer],
  );

  useEffect(() => {
    clearSequenceTimer();
    clearFeedbackTimer();
    setDisplayFen(example.fen);
    setStatus("ready");
    setSelected(null);
    setWrongBlink(false);
    setWrongMove(null);
    setLastMove(null);
    setNextMoveIdx(0);
    setFeedback(null);
  }, [
    clearFeedbackTimer,
    clearSequenceTimer,
    example.continuation,
    example.fen,
    example.puzzle,
  ]);

  useEffect(() => {
    return () => {
      clearSequenceTimer();
      clearFeedbackTimer();
    };
  }, [clearFeedbackTimer, clearSequenceTimer]);

  const applyPreparedMove = useCallback(
    (moveIndex: number) => {
      const move = preparedMoves[moveIndex];
      if (!move) return;

      setDisplayFen(move.fenAfter);
      setLastMove({ from: move.from, to: move.to });
    },
    [preparedMoves],
  );

  const finishAtMoveIndex = useCallback(
    (moveIndex: number) => {
      const nextUserMove = moveIndex + 1;
      if (nextUserMove >= preparedMoves.length) {
        setStatus("solved");
        setNextMoveIdx(preparedMoves.length);
        setFeedback({
          tone: "solved",
          title: "✓ Puzzle solved",
          detail:
            preparedMoves.length > 0
              ? `You completed the stored line starting with ${preparedMoves[0].san}.`
              : "You completed the stored line.",
        });
        return;
      }

      setNextMoveIdx(nextUserMove);
      setStatus("ready");
      setFeedback({
        tone: "correct",
        title: "✓ Correct",
        detail: "Opponent replied. Your turn again for the next move.",
      });
      clearTransientFeedback(["correct"], 1050);
    },
    [clearTransientFeedback, preparedMoves],
  );

  const autoplayOpponentReply = useCallback(
    (moveIndex: number) => {
      const move = preparedMoves[moveIndex];
      if (!move) {
        setStatus("solved");
        return;
      }

      setStatus("animating");
      clearSequenceTimer();
      sequenceTimerRef.current = setTimeout(() => {
        applyPreparedMove(moveIndex);
        finishAtMoveIndex(moveIndex);
      }, 700);
    },
    [applyPreparedMove, clearSequenceTimer, finishAtMoveIndex, preparedMoves],
  );

  const playRemainingLine = useCallback(
    (startIndex: number) => {
      if (startIndex >= preparedMoves.length) {
        setStatus("revealed");
        return;
      }

      clearSequenceTimer();
      clearFeedbackTimer();
      setStatus("revealed");
      setFeedback({
        tone: "revealed",
        title: "Showing solution",
        detail: "The saved line is playing out move by move on the board.",
      });

      let moveIndex = startIndex;
      const step = () => {
        const move = preparedMoves[moveIndex];
        if (!move) {
          sequenceTimerRef.current = null;
          return;
        }

        applyPreparedMove(moveIndex);
        moveIndex += 1;

        if (moveIndex < preparedMoves.length) {
          sequenceTimerRef.current = setTimeout(step, 850);
        } else {
          sequenceTimerRef.current = null;
        }
      };

      sequenceTimerRef.current = setTimeout(step, 450);
    },
    [applyPreparedMove, clearFeedbackTimer, clearSequenceTimer, preparedMoves],
  );

  const registerFailedAttempt = useCallback(
    (
      tone: Extract<FeedbackTone, "wrong" | "illegal">,
      from: string,
      to: string,
      title: string,
      detail: string,
    ) => {
      setFeedback({ tone, title, detail });
      setWrongBlink(true);
      setWrongMove({ from, to });
      setSelected(null);
      clearTransientFeedback([tone]);
      return false;
    },
    [clearTransientFeedback],
  );

  const tryMove = useCallback(
    (from: string, to: string): boolean => {
      if (status !== "ready") return false;

      let chess: Chess;
      try {
        chess = new Chess(displayFen);
      } catch {
        return false;
      }

      const expected = preparedMoves[nextMoveIdx];
      if (!expected) return false;

      const legalMoves = chess.moves({
        square: from as Parameters<Chess["moves"]>[0],
        verbose: true,
      }) as Array<{
        from: string;
        to: string;
        promotion?: string;
        san: string;
      }>;

      if (!legalMoves.some((move) => move.to === to)) {
        return registerFailedAttempt(
          "illegal",
          from,
          to,
          "✕ Illegal move",
          "That move is not legal in this position.",
        );
      }

      const candidateMoves = legalMoves.filter((move) => move.to === to);
      const chosenMove =
        candidateMoves.find((move) => move.promotion === expected.promotion) ??
        candidateMoves.find((move) => move.promotion === "q") ??
        candidateMoves[0];

      const result = chess.move({
        from,
        to,
        promotion: chosenMove.promotion,
      });
      if (!result) {
        return registerFailedAttempt(
          "illegal",
          from,
          to,
          "✕ Illegal move",
          "That move is not legal in this position.",
        );
      }

      const matchesExpected =
        result.from === expected.from &&
        result.to === expected.to &&
        (expected.promotion ? result.promotion === expected.promotion : true);

      if (!matchesExpected) {
        return registerFailedAttempt(
          "wrong",
          result.from,
          result.to,
          "✕ Not the puzzle move",
          "Legal move, but not the stored continuation. Try again.",
        );
      }

      setDisplayFen(chess.fen());
      setLastMove({ from: result.from, to: result.to });
      setSelected(null);
      setWrongBlink(false);
      setWrongMove(null);
      clearFeedbackTimer();
      setFeedback({
        tone: "correct",
        title: "✓ Correct",
        detail: `${expected.san} is the move. Watch for the reply.`,
      });

      const opponentMoveIdx = nextMoveIdx + 1;
      if (opponentMoveIdx >= preparedMoves.length) {
        setStatus("solved");
        setNextMoveIdx(preparedMoves.length);
        setFeedback({
          tone: "solved",
          title: "✓ Puzzle solved",
          detail:
            preparedMoves.length > 1
              ? "You completed the full stored line."
              : `${expected.san} finishes the puzzle.`,
        });
        return true;
      }

      autoplayOpponentReply(opponentMoveIdx);
      return true;
    },
    [
      autoplayOpponentReply,
      clearFeedbackTimer,
      displayFen,
      nextMoveIdx,
      preparedMoves,
      registerFailedAttempt,
      status,
    ],
  );

  const showSolution = useCallback(() => {
    clearFeedbackTimer();
    setSelected(null);
    setWrongBlink(false);
    setWrongMove(null);
    setDisplayFen(example.fen);
    setLastMove(null);
    setNextMoveIdx(0);
    playRemainingLine(0);
  }, [clearFeedbackTimer, example.fen, playRemainingLine]);

  const reset = useCallback((idx: number) => {
    setExIdx(idx);
  }, []);

  const legalMoveSquares = useMemo(() => {
    if (!selected || status !== "ready") return [];

    try {
      const chess = new Chess(displayFen);
      return (
        chess.moves({
          square: selected as Parameters<Chess["moves"]>[0],
          verbose: true,
        }) as Array<{ to: string }>
      ).map((move) => move.to);
    } catch {
      return [];
    }
  }, [displayFen, selected, status]);

  const handleSquareClick = useCallback(
    (square: string) => {
      if (status !== "ready") return;

      const chess = new Chess(displayFen);
      const turn = chess.turn();
      const piece = chess.get(square as Parameters<typeof chess.get>[0]);

      if (!selected) {
        if (piece && piece.color === turn) {
          setSelected(square);
        }
        return;
      }

      if (square === selected) {
        setSelected(null);
        return;
      }

      if (piece && piece.color === turn) {
        setSelected(square);
        return;
      }

      const moved = tryMove(selected, square);
      if (!moved) setSelected(null);
    },
    [displayFen, selected, status, tryMove],
  );

  const handlePieceDrop = useCallback(
    (from: string, to: string): boolean => {
      if (status !== "ready") return false;
      setSelected(null);
      return tryMove(from, to);
    },
    [status, tryMove],
  );

  const isDraggablePiece = useCallback(
    ({ sourceSquare }: { piece: string; sourceSquare: string }) => {
      if (status !== "ready") return false;

      try {
        const chess = new Chess(displayFen);
        const piece = chess.get(sourceSquare as Parameters<Chess["get"]>[0]);
        return Boolean(piece && piece.color === chess.turn());
      } catch {
        return false;
      }
    },
    [displayFen, status],
  );

  const whoMoves = useMemo(() => {
    try {
      return new Chess(displayFen).turn() === "w" ? "White" : "Black";
    } catch {
      return example.orientation === "white" ? "White" : "Black";
    }
  }, [displayFen, example.orientation]);

  const borderColor = wrongBlink
    ? "border-red-500/60"
    : feedback?.tone === "correct" || status === "solved"
      ? "border-emerald-500/50"
      : feedback?.tone === "revealed" || status === "revealed"
        ? "border-amber-500/40"
        : "border-white/[0.08]";

  const highlightStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};

    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: "rgba(56, 189, 248, 0.35)",
      };
      styles[lastMove.to] = {
        backgroundColor: "rgba(249, 115, 22, 0.35)",
      };
    }

    if (selected && status === "ready") {
      styles[selected] = {
        ...(styles[selected] ?? {}),
        backgroundColor: "rgba(255, 210, 0, 0.45)",
      };

      try {
        const chess = new Chess(displayFen);
        for (const square of legalMoveSquares) {
          const hasPiece = chess.get(square as Parameters<Chess["get"]>[0]);
          styles[square] = {
            ...(styles[square] ?? {}),
            background: hasPiece
              ? "radial-gradient(circle, transparent 56%, rgba(255,255,255,0.34) 56%)"
              : "radial-gradient(circle, rgba(255,255,255,0.3) 23%, transparent 24%)",
            borderRadius: "50%",
          };
        }
      } catch {
        // Board can briefly hold an intermediate FEN while animating.
      }
    }

    if (wrongMove) {
      styles[wrongMove.from] = {
        ...(styles[wrongMove.from] ?? {}),
        backgroundColor: "rgba(239, 68, 68, 0.45)",
      };
      styles[wrongMove.to] = {
        ...(styles[wrongMove.to] ?? {}),
        backgroundColor: "rgba(239, 68, 68, 0.45)",
      };
    }

    return styles;
  }, [displayFen, lastMove, legalMoveSquares, selected, status, wrongMove]);

  const statusBadge =
    status === "solved"
      ? "Solved"
      : status === "revealed"
        ? "Showing line"
        : status === "animating"
          ? "Opponent reply"
          : `${whoMoves} to move`;

  const instruction =
    status === "solved"
      ? "You played the full stored line. Reset it or move to the next puzzle."
      : status === "revealed"
        ? "The saved solution line is playing out on the board."
        : status === "animating"
          ? "Correct move. Watch the opponent reply, then keep playing the line."
          : "Find the next move. After you move, the opponent reply autoplays and then it becomes your turn again.";

  const feedbackStyles = feedback ? getFeedbackStyles(feedback.tone) : null;
  const boardBanner = feedback
    ? {
        className: feedbackStyles?.badge ?? "",
        label: feedback.title,
      }
    : null;

  const board = (
    <div
      className={`relative overflow-hidden rounded-xl border shadow-lg transition-all duration-300 ${borderColor}`}
      style={{ maxWidth: compact ? undefined : 420, width: "100%" }}
    >
      {boardBanner && (
        <div
          className={`absolute left-2 right-2 top-2 z-10 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold backdrop-blur ${boardBanner.className}`}
        >
          {boardBanner.label}
        </div>
      )}

      <Chessboard
        id={`tactic-puzzle-${boardInstanceId}-${exIdx}`}
        position={displayFen}
        boardOrientation={example.orientation}
        arePiecesDraggable={status === "ready"}
        isDraggablePiece={isDraggablePiece}
        animationDuration={240}
        showBoardNotation={showCoordinates ?? (coinCoordinates && !compact)}
        onPieceDrop={handlePieceDrop}
        onSquareClick={handleSquareClick}
        customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
        customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
        customSquareStyles={highlightStyles}
        customPieces={customPieces}
      />
    </div>
  );

  const actions = (
    <div className="flex flex-wrap gap-2">
      {(status === "ready" || status === "animating") && (
        <button
          type="button"
          onClick={showSolution}
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Show solution
        </button>
      )}
      {status !== "ready" && (
        <button
          type="button"
          onClick={() => reset(exIdx)}
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Reset puzzle
        </button>
      )}
      {examples.length > 1 &&
        exIdx < examples.length - 1 &&
        status !== "ready" && (
          <button
            type="button"
            onClick={() => reset(exIdx + 1)}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
          >
            Next puzzle
          </button>
        )}
    </div>
  );

  return (
    <div className="space-y-4">
      {examples.length > 1 && !compact && (
        <div className="flex flex-wrap gap-2">
          {examples.map((_, i) => (
            <button
              key={`${tacticName}-${i}`}
              type="button"
              onClick={() => reset(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                i === exIdx
                  ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                  : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              Puzzle {i + 1}
            </button>
          ))}
        </div>
      )}

      {compact ? (
        <div className="space-y-3">
          {board}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
                {statusBadge}
              </p>
              {examples.length > 1 && (
                <span className="rounded-full border border-white/[0.08] bg-black/20 px-2.5 py-1 text-[11px] text-slate-400">
                  {exIdx + 1} / {examples.length}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium leading-snug text-stone-200">
              {example.caption}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {instruction}
            </p>
            {feedback && feedbackStyles && (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 ${feedbackStyles.panel}`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${feedbackStyles.accent}`}
                >
                  {feedback.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/80">
                  {feedback.detail}
                </p>
              </div>
            )}
            <div className="mt-3">{actions}</div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          {board}

          <div className="flex min-w-0 flex-1 flex-col gap-3 md:pt-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
                {statusBadge}
              </p>
              <p className="mt-1.5 text-sm font-medium leading-snug text-stone-200">
                {example.caption}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {instruction}
              </p>

              {feedback && feedbackStyles && (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2 ${feedbackStyles.panel}`}
                >
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${feedbackStyles.accent}`}
                  >
                    {feedback.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/80">
                    {feedback.detail}
                  </p>
                </div>
              )}
            </div>

            {actions}
          </div>
        </div>
      )}
    </div>
  );
}
