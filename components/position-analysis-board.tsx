"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Chess, type PieceSymbol } from "chess.js";
import {
  Chessboard,
  type CbSquare,
  type PromotionPieceOption,
} from "@/components/chessboard-compat";
import { MoveBadge } from "@/components/move-badge";
import { EvalBar } from "@/components/eval-bar";
import {
  buildMoveQualityCommentary,
  classifyMoveQuality,
  MOVE_CLASSIFICATION_LABELS,
  type MoveClassification,
} from "@/lib/move-quality";
import { useBoardSize } from "@/lib/use-board-size";
import { stockfishClient, type LocalEngineLine } from "@/lib/stockfish-client";
import {
  useBoardTheme,
  useCustomPieces,
  useShowCoordinates,
} from "@/lib/use-coins";

type AnalysisMove = {
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  moveNumber: number;
  color: "w" | "b";
  classification?: MoveClassification;
  cpLoss?: number;
  bestMoveSan?: string | null;
  commentary?: string;
};

type LastMoveJudgement = {
  square: string;
  classification: MoveClassification;
  cpLoss: number;
  evalBefore: number;
  evalAfter: number;
  bestMoveSan: string | null;
  commentary: string;
};

type VariationPlaybackState = {
  active: boolean;
  key: string | null;
  label: string | null;
};

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const PUZZLE_BADGE_ASSET: Partial<Record<MoveClassification, string>> = {
  brilliant: "brilliant",
  best: "best",
  good: "good",
  inaccuracy: "inaccuracy",
  mistake: "mistake",
  blunder: "blunder",
};

function toWhitePerspective(fen: string, cp: number) {
  return fen.includes(" w ") ? cp : -cp;
}

function toSan(fen: string, uci: string | null) {
  if (!uci || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null;

  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined,
    });
    return move?.san ?? null;
  } catch {
    return null;
  }
}

function formatEval(cp: number | null) {
  if (cp == null) return "…";
  if (Math.abs(cp) >= 99000) {
    const mate = 100000 - Math.abs(cp);
    return `${cp > 0 ? "+" : "-"}M${Math.max(1, mate)}`;
  }
  const pawns = cp / 100;
  return `${pawns > 0 ? "+" : ""}${(Math.round(pawns * 10) / 10).toFixed(1)}`;
}

function formatPvLine(fen: string, pvMoves: string[]) {
  if (pvMoves.length === 0) return "";

  try {
    const chess = new Chess(fen);
    const tokens: string[] = [];

    for (const uci of pvMoves.slice(0, 8)) {
      const result = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined,
      });
      if (!result) break;
      const prefix =
        result.color === "w"
          ? `${chess.moveNumber() - 1}.`
          : `${chess.moveNumber() - 1}...`;
      tokens.push(`${prefix}${result.san}`);
    }

    return tokens.join(" ");
  } catch {
    return "";
  }
}

function safeOrientation(value?: string): "white" | "black" {
  return value === "black" ? "black" : "white";
}

export function PositionAnalysisBoard({
  initialFen = STARTING_FEN,
  initialOrientation = "white",
  title = "Analysis board",
  subtitle = "Play moves, inspect top engine lines, and branch without leaving the position.",
  standaloneHref,
}: {
  initialFen?: string;
  initialOrientation?: "white" | "black";
  title?: string;
  subtitle?: string;
  standaloneHref?: string;
}) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();
  const { ref: boardRef, size: boardSize } = useBoardSize(520);
  const [fen, setFen] = useState(initialFen || STARTING_FEN);
  const [orientation, setOrientation] = useState<"white" | "black">(
    initialOrientation,
  );
  const [moveHistory, setMoveHistory] = useState<AnalysisMove[]>([]);
  const [historyStack, setHistoryStack] = useState<string[]>([
    initialFen || STARTING_FEN,
  ]);
  const [fenInput, setFenInput] = useState(initialFen || STARTING_FEN);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [engineDepth, setEngineDepth] = useState(12);
  const [engineBusy, setEngineBusy] = useState(false);
  const [engineEval, setEngineEval] = useState<number | null>(null);
  const [topLines, setTopLines] = useState<LocalEngineLine[]>([]);
  const [copied, setCopied] = useState(false);
  const [promotionFrom, setPromotionFrom] = useState<string | null>(null);
  const [promotionTo, setPromotionTo] = useState<string | null>(null);
  const [showPromotion, setShowPromotion] = useState(false);
  const [lastMoveJudgement, setLastMoveJudgement] =
    useState<LastMoveJudgement | null>(null);
  const [variationPlayback, setVariationPlayback] =
    useState<VariationPlaybackState>({
      active: false,
      key: null,
      label: null,
    });
  const requestIdRef = useRef(0);
  const moveReviewRequestRef = useRef(0);
  const variationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setFen(initialFen || STARTING_FEN);
    setFenInput(initialFen || STARTING_FEN);
    setOrientation(initialOrientation);
    setMoveHistory([]);
    setHistoryStack([initialFen || STARTING_FEN]);
    setSelectedSquare(null);
    setLegalTargets([]);
    setLastMoveJudgement(null);
  }, [initialFen, initialOrientation]);

  useEffect(() => {
    return () => {
      if (variationTimeoutRef.current != null) {
        window.clearTimeout(variationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (variationPlayback.active) return;

    const requestId = ++requestIdRef.current;
    setEngineBusy(true);

    void Promise.all([
      stockfishClient.evaluateFen(fen, engineDepth),
      stockfishClient.getTopMoves(fen, 3, Math.max(10, engineDepth - 1)),
    ])
      .then(([evalResult, lines]) => {
        if (requestId !== requestIdRef.current) return;
        setEngineEval(
          evalResult ? toWhitePerspective(fen, evalResult.cp) : null,
        );
        setTopLines(lines ?? []);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setEngineEval(null);
        setTopLines([]);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setEngineBusy(false);
        }
      });
  }, [fen, engineDepth, variationPlayback.active]);

  const currentTurn = fen.includes(" w ") ? "White" : "Black";
  const lastMove = moveHistory[moveHistory.length - 1] ?? null;
  const boardPosition = useMemo(() => new Chess(fen), [fen]);
  const lastMoveReviewKey = lastMove
    ? `${lastMove.fenBefore}|${lastMove.fenAfter}|${lastMove.uci}|${moveHistory.length}`
    : null;

  useEffect(() => {
    if (!lastMove) {
      moveReviewRequestRef.current += 1;
      setLastMoveJudgement(null);
      return;
    }

    if (variationPlayback.active) {
      return;
    }

    const requestId = ++moveReviewRequestRef.current;
    const reviewDepth = Math.max(10, engineDepth - 1);

    void Promise.all([
      stockfishClient.evaluateFen(lastMove.fenBefore, reviewDepth),
      stockfishClient.evaluateFen(lastMove.fenAfter, reviewDepth),
    ])
      .then(([beforeEval, afterEval]) => {
        if (
          requestId !== moveReviewRequestRef.current ||
          !beforeEval ||
          !afterEval
        ) {
          return;
        }

        const evalBeforeWhite = toWhitePerspective(
          lastMove.fenBefore,
          beforeEval.cp,
        );
        const evalAfterWhite = toWhitePerspective(
          lastMove.fenAfter,
          afterEval.cp,
        );
        const evalBeforeMover =
          lastMove.color === "w" ? evalBeforeWhite : -evalBeforeWhite;
        const evalAfterMover =
          lastMove.color === "w" ? evalAfterWhite : -evalAfterWhite;
        const cpLoss = Math.max(0, evalBeforeMover - evalAfterMover);
        const isBestMove =
          beforeEval.bestMove === lastMove.uci ||
          (beforeEval.bestMove &&
            lastMove.uci.startsWith(beforeEval.bestMove.slice(0, 4)) &&
            cpLoss <= 5);
        const classification = classifyMoveQuality({
          cpLoss,
          isBestMove: !!isBestMove,
          evalBeforeMover,
          evalAfterMover,
          fenBefore: lastMove.fenBefore,
          moveUci: lastMove.uci,
          moveIndex: moveHistory.length - 1,
        });
        const bestMoveSan = toSan(lastMove.fenBefore, beforeEval.bestMove);
        const commentary = buildMoveQualityCommentary({
          classification,
          cpLoss,
          evalBefore: evalBeforeWhite,
          evalAfter: evalAfterWhite,
          bestMoveSan,
        });

        setLastMoveJudgement({
          square: lastMove.uci.slice(2, 4),
          classification,
          cpLoss,
          evalBefore: evalBeforeWhite,
          evalAfter: evalAfterWhite,
          bestMoveSan,
          commentary,
        });
        setMoveHistory((prev) => {
          if (prev.length === 0) return prev;
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            classification,
            cpLoss,
            bestMoveSan,
            commentary,
          };
          return next;
        });
      })
      .catch(() => {
        if (requestId === moveReviewRequestRef.current) {
          setLastMoveJudgement(null);
        }
      });
  }, [engineDepth, lastMoveReviewKey, variationPlayback.active]);

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};

    for (const target of legalTargets) {
      const hasPiece = boardPosition.get(target as Parameters<Chess["get"]>[0]);
      styles[target] = hasPiece
        ? {
            background:
              "radial-gradient(circle, transparent 52%, rgba(0,0,0,0.45) 52%)",
          }
        : {
            background:
              "radial-gradient(circle, rgba(0,0,0,0.35) 25%, transparent 26%)",
          };
    }

    if (lastMove) {
      styles[lastMove.uci.slice(0, 2)] = {
        backgroundColor: "rgba(20,168,152,0.38)",
      };
      styles[lastMove.uci.slice(2, 4)] = {
        backgroundColor: "rgba(20,168,152,0.60)",
      };
    }

    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: "rgba(20, 85, 255, 0.45)",
      };
    }

    return styles;
  }, [boardPosition, lastMove, legalTargets, selectedSquare]);

  const bestMoveArrow = useMemo(() => {
    const bestMove = topLines[0]?.bestMove;
    if (!bestMove || !/^[a-h][1-8][a-h][1-8]/.test(bestMove)) return [];
    return [
      [bestMove.slice(0, 2), bestMove.slice(2, 4), "rgba(34,197,94,0.75)"],
    ] as [string, string, string][];
  }, [topLines]);

  const customSquareRenderer = useMemo(() => {
    return ((props: any) => {
      const square = props?.square as string | undefined;
      const classification =
        square && lastMoveJudgement?.square === square
          ? lastMoveJudgement.classification
          : null;
      const asset = classification ? PUZZLE_BADGE_ASSET[classification] : null;

      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {classification && asset ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/move-badges/${asset}.svg`}
                alt={MOVE_CLASSIFICATION_LABELS[classification]}
                title={MOVE_CLASSIFICATION_LABELS[classification]}
                className="pointer-events-none absolute -right-1 -top-1 z-40 h-7 w-7 drop-shadow-lg"
              />
            </>
          ) : classification ? (
            <MoveBadge classification={classification} variant="corner" />
          ) : null}
        </div>
      );
    }) as any;
  }, [lastMoveJudgement]);

  const selectSquare = (square: CbSquare) => {
    if (variationPlayback.active) return;

    const chess = new Chess(fen);
    const piece = chess.get(square as Parameters<Chess["get"]>[0]);

    if (selectedSquare && legalTargets.includes(square)) {
      executeMove(selectedSquare, square);
      return;
    }

    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      setLegalTargets(
        chess
          .moves({
            square: square as Parameters<Chess["moves"]>[0]["square"],
            verbose: true,
          })
          .map((move) => move.to),
      );
      return;
    }

    setSelectedSquare(null);
    setLegalTargets([]);
  };

  const pushMove = (move: AnalysisMove, nextFen: string) => {
    setFen(nextFen);
    setFenInput(nextFen);
    setMoveHistory((prev) => [...prev, move]);
    setHistoryStack((prev) => [...prev, nextFen]);
    setSelectedSquare(null);
    setLegalTargets([]);
  };

  const stopVariationPlayback = () => {
    if (variationTimeoutRef.current != null) {
      window.clearTimeout(variationTimeoutRef.current);
      variationTimeoutRef.current = null;
    }
    setVariationPlayback({ active: false, key: null, label: null });
  };

  const executeMove = (
    sourceSquare: string,
    targetSquare: string,
    promotion?: string,
  ) => {
    try {
      const chess = new Chess(fen);
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: promotion as PieceSymbol | undefined,
      });

      if (!move) return false;

      const historyEntry: AnalysisMove = {
        san: move.san,
        uci: `${move.from}${move.to}${move.promotion ?? ""}`,
        fenBefore: fen,
        fenAfter: chess.fen(),
        moveNumber: Number((fen.split(" ")[5] ?? "1").trim()),
        color: move.color,
      };

      pushMove(historyEntry, chess.fen());
      return true;
    } catch {
      return false;
    }
  };

  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    if (variationPlayback.active) return false;

    const chess = new Chess(fen);
    const piece = chess.get(sourceSquare as Parameters<Chess["get"]>[0]);
    const isPromotion =
      piece?.type === "p" &&
      ((piece.color === "w" && targetSquare.endsWith("8")) ||
        (piece.color === "b" && targetSquare.endsWith("1")));

    if (isPromotion) {
      setPromotionFrom(sourceSquare);
      setPromotionTo(targetSquare);
      setShowPromotion(true);
      return false;
    }

    return executeMove(sourceSquare, targetSquare);
  };

  const onPromotionPieceSelect = (piece?: PromotionPieceOption) => {
    setShowPromotion(false);
    if (!piece || !promotionFrom || !promotionTo) {
      setPromotionFrom(null);
      setPromotionTo(null);
      return true;
    }

    executeMove(promotionFrom, promotionTo, piece[1]?.toLowerCase());
    setPromotionFrom(null);
    setPromotionTo(null);
    return true;
  };

  const undoMove = () => {
    stopVariationPlayback();

    if (historyStack.length <= 1) return;

    setHistoryStack((prev) => {
      const next = prev.slice(0, -1);
      const fallbackFen = next[next.length - 1] ?? initialFen;
      setFen(fallbackFen);
      setFenInput(fallbackFen);
      return next;
    });
    setMoveHistory((prev) => prev.slice(0, -1));
    setSelectedSquare(null);
    setLegalTargets([]);
  };

  const resetBoard = () => {
    stopVariationPlayback();

    setFen(initialFen || STARTING_FEN);
    setFenInput(initialFen || STARTING_FEN);
    setMoveHistory([]);
    setHistoryStack([initialFen || STARTING_FEN]);
    setSelectedSquare(null);
    setLegalTargets([]);
  };

  const applyFenInput = () => {
    stopVariationPlayback();

    try {
      const chess = new Chess(fenInput.trim());
      const nextFen = chess.fen();
      setFen(nextFen);
      setHistoryStack([nextFen]);
      setMoveHistory([]);
      setSelectedSquare(null);
      setLegalTargets([]);
    } catch {
      setFenInput(fen);
    }
  };

  const playTopLine = (line: LocalEngineLine, key: string, label: string) => {
    stopVariationPlayback();

    const previewMoves = line.pvMoves.slice(0, 8);
    if (previewMoves.length === 0) return;

    const chess = new Chess(fen);
    const steps: Array<{ move: AnalysisMove; nextFen: string }> = [];

    for (const uci of previewMoves) {
      try {
        const fenBefore = chess.fen();
        const result = chess.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined,
        });
        if (!result) break;

        steps.push({
          move: {
            san: result.san,
            uci,
            fenBefore,
            fenAfter: chess.fen(),
            moveNumber: Number((fenBefore.split(" ")[5] ?? "1").trim()),
            color: result.color,
          },
          nextFen: chess.fen(),
        });
      } catch {
        break;
      }
    }

    if (steps.length === 0) return;

    setVariationPlayback({ active: true, key, label });

    let stepIndex = 0;
    const runStep = () => {
      const step = steps[stepIndex];
      if (!step) {
        setVariationPlayback({ active: false, key: null, label: null });
        variationTimeoutRef.current = null;
        return;
      }

      pushMove(step.move, step.nextFen);
      stepIndex += 1;

      if (stepIndex < steps.length) {
        variationTimeoutRef.current = window.setTimeout(runStep, 500);
        return;
      }

      variationTimeoutRef.current = null;
      setVariationPlayback({ active: false, key: null, label: null });
    };

    runStep();
  };

  const copyFen = async () => {
    try {
      await navigator.clipboard.writeText(fen);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const rows = useMemo(() => {
    const result: Array<{
      moveNumber: number;
      white?: AnalysisMove;
      black?: AnalysisMove;
    }> = [];

    for (const move of moveHistory) {
      const lastRow = result[result.length - 1];
      if (!lastRow || lastRow.moveNumber !== move.moveNumber) {
        result.push({
          moveNumber: move.moveNumber,
          white: move.color === "w" ? move : undefined,
          black: move.color === "b" ? move : undefined,
        });
        continue;
      }

      if (move.color === "w") lastRow.white = move;
      else lastRow.black = move;
    }

    return result;
  }, [moveHistory]);

  const topLineSummary = topLines.map((line, index) => ({
    key: `${line.bestMove ?? "none"}-${index}`,
    san: toSan(fen, line.bestMove),
    eval: toWhitePerspective(fen, line.cp),
    pv: formatPvLine(fen, line.pvMoves),
  }));

  const currentStateText = (() => {
    try {
      const chess = new Chess(fen);
      if (chess.isCheckmate()) return "Checkmate";
      if (chess.isStalemate()) return "Stalemate";
      if (chess.isDraw()) return "Drawn";
      if (chess.isCheck()) return `${currentTurn} to move — in check`;
      return `${currentTurn} to move`;
    } catch {
      return `${currentTurn} to move`;
    }
  })();

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                Position analysis
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                {title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                {subtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setOrientation((prev) =>
                    prev === "white" ? "black" : "white",
                  )
                }
                className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
              >
                Flip
              </button>
              <button
                type="button"
                onClick={copyFen}
                className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
              >
                {copied ? "Copied" : "Copy FEN"}
              </button>
              {standaloneHref ? (
                <Link
                  href={standaloneHref}
                  className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                >
                  Open full board
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,20rem)]">
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
            <div ref={boardRef} className="mx-auto w-full max-w-[640px]">
              <div className="flex items-start gap-2 sm:gap-3">
                <EvalBar evalCp={engineEval ?? 0} height={boardSize} />
                <div className="overflow-hidden rounded-xl">
                  <Chessboard
                    id="position-analysis-board"
                    position={fen}
                    boardOrientation={orientation}
                    boardWidth={boardSize}
                    arePiecesDraggable={!variationPlayback.active}
                    onPieceDrop={onPieceDrop}
                    onSquareClick={selectSquare}
                    showPromotionDialog={showPromotion}
                    promotionToSquare={promotionTo ?? undefined}
                    onPromotionPieceSelect={onPromotionPieceSelect}
                    customDarkSquareStyle={{
                      backgroundColor: boardTheme.darkSquare,
                    }}
                    customLightSquareStyle={{
                      backgroundColor: boardTheme.lightSquare,
                    }}
                    customSquareStyles={squareStyles}
                    customSquare={customSquareRenderer}
                    customArrows={bestMoveArrow}
                    showBoardNotation={showCoords}
                    customPieces={customPieces}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={undoMove}
                disabled={moveHistory.length === 0}
                className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={resetBoard}
                className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
              >
                Reset
              </button>
              <div className="ml-auto flex items-center gap-2">
                {variationPlayback.active && variationPlayback.label ? (
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-100">
                    Playing {variationPlayback.label}
                  </span>
                ) : null}
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  {currentStateText}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  Eval {formatEval(engineEval)}
                </span>
              </div>
            </div>

            {lastMove && lastMoveJudgement ? (
              <div className="mt-4 rounded-[1.25rem] border border-white/[0.08] bg-black/15 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <MoveBadge
                      classification={lastMoveJudgement.classification}
                    />
                    <span className="text-sm font-semibold text-white">
                      Last move: {lastMove.moveNumber}
                      {lastMove.color === "w" ? "." : "..."}
                      {lastMove.san}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    {formatEval(lastMoveJudgement.evalBefore)} →{" "}
                    {formatEval(lastMoveJudgement.evalAfter)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {lastMoveJudgement.commentary}
                </p>
                {lastMoveJudgement.bestMoveSan &&
                lastMoveJudgement.bestMoveSan !== lastMove.san ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Engine preferred{" "}
                    <span className="font-semibold text-emerald-300">
                      {lastMoveJudgement.bestMoveSan}
                    </span>
                    .
                  </p>
                ) : null}
              </div>
            ) : lastMove ? (
              <div className="mt-4 rounded-[1.25rem] border border-white/[0.08] bg-black/15 p-4 text-sm text-slate-400">
                Reviewing the previous move with Stockfish...
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Engine
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Top lines
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {variationPlayback.active && (
                    <button
                      type="button"
                      onClick={stopVariationPlayback}
                      className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                    >
                      Stop
                    </button>
                  )}
                  <select
                    value={engineDepth}
                    onChange={(event) =>
                      setEngineDepth(Number(event.target.value))
                    }
                    className="rounded-lg border border-white/[0.1] bg-slate-950/70 px-2 py-1.5 text-xs font-semibold text-slate-200 outline-none"
                  >
                    {[10, 12, 14, 16, 18].map((depth) => (
                      <option key={depth} value={depth}>
                        Depth {depth}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {topLineSummary.length > 0 ? (
                  topLineSummary.map((line, index) => (
                    <div
                      key={line.key}
                      className={`rounded-2xl border p-3 ${
                        index === 0
                          ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                          : "border-white/[0.08] bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
                          {index === 0 ? "Best move" : `Line ${index + 1}`}
                        </p>
                        <span className="text-xs font-bold text-slate-300">
                          {formatEval(line.eval)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-black text-emerald-200">
                        {line.san ?? "—"}
                      </p>
                      {line.pv ? (
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                          {line.pv}
                        </p>
                      ) : null}
                      {line.pv ? (
                        <button
                          type="button"
                          onClick={() =>
                            playTopLine(
                              topLines[index],
                              line.key,
                              index === 0 ? "best line" : `line ${index + 1}`,
                            )
                          }
                          disabled={variationPlayback.active}
                          className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {variationPlayback.active &&
                          variationPlayback.key === line.key
                            ? "Playing..."
                            : "Play on board"}
                        </button>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-slate-400">
                    {engineBusy
                      ? "Reading the position with Stockfish..."
                      : "No engine line available yet."}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Load position
              </p>
              <div className="mt-3 space-y-3">
                <textarea
                  value={fenInput}
                  onChange={(event) => setFenInput(event.target.value)}
                  className="h-24 w-full rounded-xl border border-white/[0.08] bg-slate-950/70 px-3 py-2 font-mono text-xs text-slate-200 outline-none transition focus:border-cyan-500/30"
                />
                <button
                  type="button"
                  onClick={applyFenInput}
                  className="w-full rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  Load FEN
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Moves
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              Current branch
            </p>
          </div>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
            {moveHistory.length} ply
          </span>
        </div>

        <div className="mt-4 max-h-[42rem] overflow-y-auto space-y-2 pr-1">
          {rows.length > 0 ? (
            rows.map((row) => (
              <div
                key={row.moveNumber}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <span className="text-xs font-bold text-slate-500">
                  {row.moveNumber}.
                </span>
                <div className="min-w-0">
                  {row.white ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-white">
                          {row.white.san}
                        </p>
                        {row.white.classification ? (
                          <span className="shrink-0">
                            <MoveBadge
                              classification={row.white.classification}
                              variant="pill"
                              className="px-2 py-0.5 text-[10px]"
                            />
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-[11px] font-mono text-slate-500">
                        {row.white.uci}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </div>
                <div className="min-w-0">
                  {row.black ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-white">
                          {row.black.san}
                        </p>
                        {row.black.classification ? (
                          <span className="shrink-0">
                            <MoveBadge
                              classification={row.black.classification}
                              variant="pill"
                              className="px-2 py-0.5 text-[10px]"
                            />
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-[11px] font-mono text-slate-500">
                        {row.black.uci}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-slate-400">
              Start playing moves from the board to build a new branch from this
              position.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function buildStandaloneAnalysisHref(args: {
  fen: string;
  orientation?: "white" | "black";
  title?: string;
}) {
  const params = new URLSearchParams();
  params.set("fen", args.fen);
  params.set("orientation", safeOrientation(args.orientation));
  if (args.title) params.set("title", args.title);
  return `/analysis?${params.toString()}`;
}
