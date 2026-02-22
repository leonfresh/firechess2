"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { stockfishClient } from "@/lib/stockfish-client";
import { EvalBar } from "@/components/eval-bar";
import { Chessboard } from "react-chessboard";
import type { MoveSquare, RepeatedOpeningLeak } from "@/lib/types";

type MistakeCardProps = {
  leak: RepeatedOpeningLeak;
  engineDepth: number;
};

type MoveDetails = {
  from: string;
  to: string;
  promotion?: string;
  san: string;
};

type BoardSquare =
  | "a1"
  | "a2"
  | "a3"
  | "a4"
  | "a5"
  | "a6"
  | "a7"
  | "a8"
  | "b1"
  | "b2"
  | "b3"
  | "b4"
  | "b5"
  | "b6"
  | "b7"
  | "b8"
  | "c1"
  | "c2"
  | "c3"
  | "c4"
  | "c5"
  | "c6"
  | "c7"
  | "c8"
  | "d1"
  | "d2"
  | "d3"
  | "d4"
  | "d5"
  | "d6"
  | "d7"
  | "d8"
  | "e1"
  | "e2"
  | "e3"
  | "e4"
  | "e5"
  | "e6"
  | "e7"
  | "e8"
  | "f1"
  | "f2"
  | "f3"
  | "f4"
  | "f5"
  | "f6"
  | "f7"
  | "f8"
  | "g1"
  | "g2"
  | "g3"
  | "g4"
  | "g5"
  | "g6"
  | "g7"
  | "g8"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "h7"
  | "h8";

function isBoardSquare(square: string): square is BoardSquare {
  return /^[a-h][1-8]$/.test(square);
}

function isUci(move: string): boolean {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
}

function parseMove(move: string): MoveSquare | null {
  if (!isUci(move)) return null;

  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move.slice(4, 5) || undefined
  };
}

function deriveMoveDetails(fen: string, move: string | null): MoveDetails | null {
  if (!move) return null;

  try {
    const chess = new Chess(fen);

    if (isUci(move)) {
      const parsed = parseMove(move);
      if (!parsed) return null;

      const result = chess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined
      });

      if (!result) return null;
      return {
        from: result.from,
        to: result.to,
        promotion: result.promotion ?? undefined,
        san: result.san
      };
    }

    const result = chess.move(move);
    if (!result) return null;

    return {
      from: result.from,
      to: result.to,
      promotion: result.promotion ?? undefined,
      san: result.san
    };
  } catch {
    return null;
  }
}

function formatPrincipalVariation(fen: string, uciMoves: string[]): string {
  try {
    const chess = new Chess(fen);
    const tokens: string[] = [];

    for (const uci of uciMoves) {
      if (!isUci(uci)) break;
      const parsed = parseMove(uci);
      if (!parsed) break;

      const moveNumber = chess.moveNumber();
      const side = chess.turn();
      const result = chess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined
      });

      if (!result) break;

      if (side === "w") {
        tokens.push(`${moveNumber}.${result.san}`);
      } else {
        tokens.push(`${moveNumber}...${result.san}`);
      }
    }

    return tokens.join(" ");
  } catch {
    return "";
  }
}

function formatEval(valueCp: number, options?: { showPlus?: boolean }): string {
  const evalPawns = valueCp / 100;
  const rounded = Math.round(evalPawns * 100) / 100;
  const text = rounded.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  if (options?.showPlus && rounded > 0) {
    return `+${text}`;
  }
  return text;
}

export function MistakeCard({ leak, engineDepth }: MistakeCardProps) {
  const badMove = useMemo(() => deriveMoveDetails(leak.fenBefore, leak.userMove), [leak.fenBefore, leak.userMove]);
  const bestMove = useMemo(() => deriveMoveDetails(leak.fenBefore, leak.bestMove), [leak.fenBefore, leak.bestMove]);
  const boardId = useMemo(() => `mistake-${leak.fenBefore.replace(/[^a-zA-Z0-9]/g, "-")}`, [leak.fenBefore]);
  const boardOrientation = leak.sideToMove === "black" ? "black" : "white";
  const whiteEvalBefore = leak.sideToMove === "white" ? leak.evalBefore : -leak.evalBefore;
  const whiteEvalAfter = leak.sideToMove === "white" ? leak.evalAfter : -leak.evalAfter;

  const [fen, setFen] = useState(leak.fenBefore);
  const [solved, setSolved] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [explanation, setExplanation] = useState("");
  const timerIds = useRef<number[]>([]);

  const displayedEvalCp = useMemo(() => {
    if (fen === leak.fenAfter) return whiteEvalAfter;
    return whiteEvalBefore;
  }, [fen, leak.fenAfter, whiteEvalAfter, whiteEvalBefore]);

  const clearTimers = () => {
    timerIds.current.forEach((timerId) => window.clearTimeout(timerId));
    timerIds.current = [];
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const customSquareStyles = useMemo(() => {
    if (animating) return {};
    if (!badMove) return {};

    return {
      [badMove.from]: { backgroundColor: "rgba(239, 68, 68, 0.45)" },
      [badMove.to]: { backgroundColor: "rgba(239, 68, 68, 0.45)" }
    };
  }, [animating, badMove]);

  const customArrows = useMemo(() => {
    if (animating) {
      return [] as [BoardSquare, BoardSquare, string?][];
    }

    const arrows: [BoardSquare, BoardSquare, string?][] = [];

    if (bestMove && isBoardSquare(bestMove.from) && isBoardSquare(bestMove.to)) {
      arrows.push([bestMove.from, bestMove.to, "rgba(34, 197, 94, 0.9)"]);
    }

    if (badMove && isBoardSquare(badMove.from) && isBoardSquare(badMove.to)) {
      arrows.push([badMove.from, badMove.to, "rgba(239, 68, 68, 0.9)"]);
    }

    return arrows;
  }, [animating, badMove, bestMove]);

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (animating) return false;
    if (!bestMove) return false;

    const promotion = piece[1]?.toLowerCase() as PieceSymbol | undefined;
    const moveMatches =
      sourceSquare === bestMove.from &&
      targetSquare === bestMove.to &&
      (bestMove.promotion ? bestMove.promotion === promotion : true);

    if (!moveMatches) return false;

    const chess = new Chess(fen);
    const result = chess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: (bestMove.promotion as PieceSymbol | undefined) ?? promotion
    });

    if (!result) return false;

    setFen(chess.fen());
    setSolved(true);
    return true;
  };

  const moveToUci = (move: MoveDetails | null): string | null => {
    if (!move) return null;
    return `${move.from}${move.to}${move.promotion ?? ""}`;
  };

  const animateSequence = (startFen: string, uciMoves: string[]) => {
    clearTimers();

    const chess = new Chess(startFen);
    setFen(chess.fen());
    setAnimating(true);
    setSolved(false);

    const playable = uciMoves.slice(0, 10);

    playable.forEach((uci, moveIndex) => {
      const timerId = window.setTimeout(() => {
        if (!isUci(uci)) return;
        const parsed = parseMove(uci);
        if (!parsed) return;

        const result = chess.move({
          from: parsed.from,
          to: parsed.to,
          promotion: parsed.promotion as PieceSymbol | undefined
        });

        if (result) {
          setFen(chess.fen());
        }
      }, (moveIndex + 1) * 2000);

      timerIds.current.push(timerId);
    });

    const resetTimerId = window.setTimeout(
      () => {
        setFen(leak.fenBefore);
        setAnimating(false);
      },
      (playable.length + 1) * 2000 + 4000
    );

    timerIds.current.push(resetTimerId);
  };

  const onExplainMistake = async () => {
    if (explaining || animating) return;

    setExplaining(true);
    setExplanation("");

    try {
      const playedUci = moveToUci(badMove);
      const bestSan = bestMove?.san ?? leak.bestMove ?? "N/A";

      if (!playedUci) {
        setExplanation("Could not parse your played move for this position.");
        return;
      }

      const afterPlayed = new Chess(leak.fenBefore);
      const playedParsed = parseMove(playedUci);
      if (!playedParsed) {
        setExplanation("Could not parse your played move for this position.");
        return;
      }

      const playedResult = afterPlayed.move({
        from: playedParsed.from,
        to: playedParsed.to,
        promotion: playedParsed.promotion as PieceSymbol | undefined
      });

      if (!playedResult) {
        setExplanation("Could not play your move on this position.");
        return;
      }

      const line = await stockfishClient.getPrincipalVariation(afterPlayed.fen(), 10, 12);
      if (!line) {
        setExplanation("Engine did not return a principal variation for this position.");
        return;
      }

      const sanLine: string[] = [playedResult.san];
      const continuation = formatPrincipalVariation(afterPlayed.fen(), line.pvMoves);
      if (continuation) {
        sanLine.push(continuation);
      }

      setExplanation(
        `Played ${badMove?.san ?? leak.userMove} loses about ${formatEval(leak.cpLoss)} eval. ` +
          `Best move is ${bestSan}. ` +
          `Engine punishment line: ${sanLine.length ? sanLine.join(" ") : "not available"}.`
      );

      if (line.pvMoves.length > 0) {
        animateSequence(leak.fenBefore, [playedUci, ...line.pvMoves]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to explain this position.";
      setExplanation(message);
    } finally {
      setExplaining(false);
    }
  };

  const onExplainBestMove = async () => {
    if (explaining || animating) return;

    setExplaining(true);
    setExplanation("");

    try {
      const bestUci = moveToUci(bestMove);
      if (!bestUci) {
        setExplanation("Could not parse the highlighted best move for this position.");
        return;
      }

      const bestFenChess = new Chess(leak.fenBefore);
      let evalAfterBestText = "";
      let bestContinuationMoves: string[] = [];

      const parsed = parseMove(bestUci);
      if (!parsed) {
        setExplanation("Could not parse the highlighted best move for this position.");
        return;
      }

      const moved = bestFenChess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined
      });

      if (!moved) {
        setExplanation("Could not apply the highlighted best move for this position.");
        return;
      }

      const bestEval = await stockfishClient.evaluateFen(bestFenChess.fen(), engineDepth);
      if (bestEval) {
        evalAfterBestText = ` Eval after best move is around ${formatEval(bestEval.cp, { showPlus: true })} (side to move).`;
      }

      const continuation = await stockfishClient.getPrincipalVariation(bestFenChess.fen(), 9, engineDepth);
      bestContinuationMoves = continuation?.pvMoves ?? [];

      const pvText = formatPrincipalVariation(leak.fenBefore, [bestUci, ...bestContinuationMoves]);

      setExplanation(
        `Best move ${bestMove?.san ?? leak.bestMove ?? "N/A"} preserves the position and avoids the ${formatEval(
          leak.cpLoss
        )} eval drop from your played move.` +
          evalAfterBestText +
          ` Engine best line: ${pvText || "not available"}.`
      );

      const fullBestLine = [bestUci, ...bestContinuationMoves];
      if (fullBestLine.length > 0) {
        animateSequence(leak.fenBefore, fullBestLine);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to explain this position.";
      setExplanation(message);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/20">
      <div className="grid gap-4 md:grid-cols-[372px_1fr]">
        <div className="mx-auto flex w-full max-w-[370px] shrink-0 items-start gap-2">
          <EvalBar evalCp={displayedEvalCp} height={340} />
          <Chessboard
            id={boardId}
            position={fen}
            arePiecesDraggable={!solved && !!bestMove}
            onPieceDrop={onDrop}
            customSquareStyles={customSquareStyles}
            customArrows={customArrows}
            boardOrientation={boardOrientation}
            boardWidth={340}
            customDarkSquareStyle={{ backgroundColor: "#b58863" }}
            customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Repeated Opening Leak</h3>
          <p className="text-sm text-slate-300">
            You reached this position <span className="font-semibold text-white">{leak.reachCount}</span> times and
            played <span className="font-mono text-red-400">{leak.userMove}</span>{" "}
            <span className="font-semibold text-white">{leak.moveCount}</span> times.
          </p>

          <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            <p>
              Eval Loss: <span className="font-semibold text-red-400">{formatEval(leak.cpLoss)}</span>
            </p>
            <p>
              Eval before: <span className="font-semibold text-slate-100">{formatEval(leak.evalBefore, { showPlus: true })}</span>
            </p>
            <p>
              Eval after: <span className="font-semibold text-slate-100">{formatEval(leak.evalAfter, { showPlus: true })}</span>
            </p>
            <p>
              Best move: <span className="font-mono text-emerald-400">{bestMove?.san ?? "N/A"}</span>
            </p>
            <p>
              Played move: <span className="font-mono text-red-400">{badMove?.san ?? leak.userMove}</span>
            </p>
          </div>

          {!!leak.tags?.length && (
            <div className="flex flex-wrap gap-2">
              {leak.tags.map((tag) => (
                <span
                  key={`${leak.fenBefore}-${tag}`}
                  className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm text-slate-400">
            Puzzle: drag the best move on the board. {solved ? "Solved ✅" : "Not solved yet"}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={explaining || animating}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white transition hover:bg-emerald-500 disabled:opacity-60"
              onClick={onExplainMistake}
            >
              {explaining ? "Explaining..." : animating ? "Animating..." : "Explain played move"}
            </button>

            <button
              type="button"
              disabled={explaining || animating}
              className="rounded-md bg-emerald-800 px-3 py-2 text-sm text-white transition hover:bg-emerald-700 disabled:opacity-60"
              onClick={onExplainBestMove}
            >
              {explaining ? "Explaining..." : animating ? "Animating..." : "Explain best move"}
            </button>

            {solved && (
              <button
                type="button"
                className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-700"
                onClick={() => {
                  clearTimers();
                  setFen(leak.fenBefore);
                  setSolved(false);
                  setAnimating(false);
                }}
              >
                Reset puzzle
              </button>
            )}
          </div>

          {explanation && <p className="rounded-md bg-slate-950/70 p-3 text-sm text-slate-200">{explanation}</p>}
        </div>
      </div>
    </article>
  );
}
