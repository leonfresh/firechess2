"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { stockfishClient } from "@/lib/stockfish-client";
import { EvalBar } from "@/components/eval-bar";
import { Chessboard } from "react-chessboard";
import { playSound } from "@/lib/sounds";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates } from "@/lib/use-coins";
import { ExplanationModal, type SimpleExplanation } from "@/components/explanation-modal";
import type { EndgameMistake, MoveSquare } from "@/lib/types";

type EndgameCardProps = {
  mistake: EndgameMistake;
  engineDepth: number;
};

type MoveDetails = {
  from: string;
  to: string;
  promotion?: string;
  san: string;
};

type BoardSquare =
  | "a1" | "a2" | "a3" | "a4" | "a5" | "a6" | "a7" | "a8"
  | "b1" | "b2" | "b3" | "b4" | "b5" | "b6" | "b7" | "b8"
  | "c1" | "c2" | "c3" | "c4" | "c5" | "c6" | "c7" | "c8"
  | "d1" | "d2" | "d3" | "d4" | "d5" | "d6" | "d7" | "d8"
  | "e1" | "e2" | "e3" | "e4" | "e5" | "e6" | "e7" | "e8"
  | "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8"
  | "g1" | "g2" | "g3" | "g4" | "g5" | "g6" | "g7" | "g8"
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "h7" | "h8";

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
      return { from: result.from, to: result.to, promotion: result.promotion ?? undefined, san: result.san };
    }
    const result = chess.move(move);
    if (!result) return null;
    return { from: result.from, to: result.to, promotion: result.promotion ?? undefined, san: result.san };
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

const MATE_THRESHOLD = 99000;

function isMateScore(cp: number): boolean {
  return Math.abs(cp) >= MATE_THRESHOLD;
}

function formatEval(valueCp: number, options?: { showPlus?: boolean }): string {
  if (isMateScore(valueCp)) {
    const n = 100000 - Math.abs(valueCp);
    const sign = valueCp > 0 ? "+" : "-";
    return n <= 0 ? `${sign}Mate` : `${sign}M${n}`;
  }
  const evalPawns = valueCp / 100;
  const rounded = Math.round(evalPawns * 100) / 100;
  const text = rounded.toFixed(2).replace(/\.00$/, "").replace(/(\.)0$/, "$1");
  if (options?.showPlus && rounded > 0) return `+${text}`;
  return text;
}

function formatEvalLoss(cpLoss: number): string {
  if (cpLoss >= MATE_THRESHOLD) return "Mate";
  const pawns = cpLoss / 100;
  const rounded = Math.round(pawns * 100) / 100;
  return rounded.toFixed(2).replace(/\.00$/, "").replace(/(\.)0$/, "$1");
}

const ENDGAME_TYPE_ICON: Record<string, string> = {
  "Pawn": "♟",
  "Rook": "♜",
  "Rook + Bishop": "♜♝",
  "Rook + Knight": "♜♞",
  "Rook + Minor": "♜♝",
  "Knight vs Knight": "♞♞",
  "Bishop vs Bishop": "♝♝",
  "Knight vs Bishop": "♞♝",
  "Bishop vs Knight": "♝♞",
  "Bishop + Knight": "♝♞",
  "Two Bishops": "♝♝",
  "Two Knights": "♞♞",
  "Minor Piece": "♝",
  "Queen": "♛",
  "Queen + Rook": "♛♜",
  "Queen + Minor": "♛♝",
  "Opposite Bishops": "♗♝",
  "Complex": "♔",
};

/** Quick endgame tips per type — shown on each card */
const ENDGAME_TIPS: Record<string, string> = {
  "Pawn": "King activity is everything in pawn endgames. Centralise your king and create a passed pawn. Count tempi carefully — one move can decide the game.",
  "Rook": "Keep your rook active and behind passed pawns (yours or your opponent's). The Lucena and Philidor positions are essential knowledge here.",
  "Rook + Bishop": "The bishop pair with rooks favours the side with more space. Restrict the opponent's bishop to a bad diagonal and use your rook to attack weak pawns.",
  "Rook + Knight": "Knights struggle in open positions with rooks. Keep the position closed if you have the knight; open it if you're playing against one.",
  "Rook + Minor": "Coordinate your rook and minor piece. The minor piece often defends while the rook attacks — don't let them get passive.",
  "Knight vs Knight": "Knight endgames closely resemble pawn endgames. King position and pawn structure matter more than the knights themselves.",
  "Bishop vs Bishop": "Same-colour bishop endgames can be very technical. Try to fix your opponent's pawns on your bishop's colour to create targets.",
  "Knight vs Bishop": "Knights are strong in closed positions with fixed pawns. If you have the knight, keep pawns locked; if the bishop, open the position.",
  "Bishop vs Knight": "Bishops excel in open positions. Keep the position fluid, use your long-range piece to attack pawns on both sides of the board.",
  "Bishop + Knight": "The bishop + knight checkmate pattern requires practice. In general, coordinate both pieces to control key squares and restrict the enemy king.",
  "Two Bishops": "The bishop pair is a powerful advantage. Keep the position open and use both diagonals to dominate. Avoid trading one bishop away.",
  "Two Knights": "Two knights alone cannot force checkmate (without opponent's pawns). Focus on creating and promoting passed pawns instead.",
  "Minor Piece": "Minor piece endgames are highly sensitive to pawn structure. Choose the right piece exchanges and keep your minor piece active.",
  "Queen": "In queen endgames, king safety is paramount. Centralise your queen and look for perpetual check resources. Passed pawns are key assets.",
  "Queen + Rook": "Heavy piece endgames are tactical. Look for back rank threats and queen+rook battery formations. Don't forget stalemate tricks when defending.",
  "Queen + Minor": "Use your queen's mobility with the minor piece's tactical potential. Knights create fork threats; bishops support long-range queen operations.",
  "Opposite Bishops": "Opposite-colour bishop endgames are very drawish. The attacker needs a two-pawn advantage or a passed pawn on both sides to win. Fortresses are common.",
  "Complex": "Complex endgames require calculation. Simplify when ahead, complicate when behind. Prioritise king safety and piece activity.",
};

export function EndgameCard({ mistake, engineDepth }: EndgameCardProps) {
  const { ref: boardSizeRef, size: boardSize } = useBoardSize(400);
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();
  const userMoveDetails = useMemo(
    () => deriveMoveDetails(mistake.fenBefore, mistake.userMove),
    [mistake.fenBefore, mistake.userMove]
  );
  const bestMoveDetails = useMemo(
    () => deriveMoveDetails(mistake.fenBefore, mistake.bestMove),
    [mistake.fenBefore, mistake.bestMove]
  );
  const boardId = useMemo(
    () => `endgame-${mistake.fenBefore.replace(/[^a-zA-Z0-9]/g, "-")}`,
    [mistake.fenBefore]
  );
  const boardOrientation = mistake.userColor === "black" ? "black" : "white";
  const whiteEvalBefore = mistake.sideToMove === "white" ? mistake.cpBefore : -mistake.cpBefore;
  const whiteEvalAfter = mistake.sideToMove === "white" ? mistake.cpAfter : -mistake.cpAfter;

  const [fen, setFen] = useState(mistake.fenBefore);
  const [explaining, setExplaining] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [endgameCards, setEndgameCards] = useState<{
    type: "best" | "consequence";
    move: string;
    impact: string;
    evalAfter?: string;
    line?: string;
    bestMove?: string;
    context?: string;
  } | null>(null);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [animLineUci, setAnimLineUci] = useState<string[]>([]);
  const [fenCopied, setFenCopied] = useState(false);
  const [boardInstance, setBoardInstance] = useState(0);
  const timerIds = useRef<number[]>([]);
  const fenCopiedTimerRef = useRef<number | null>(null);

  const isBlunder = mistake.cpLoss >= 300;
  const isMistake = mistake.cpLoss >= 150;
  const severityColor = isBlunder ? "#ef4444" : isMistake ? "#f59e0b" : "#38bdf8";
  const severityLabel = isBlunder ? "Blunder" : isMistake ? "Mistake" : "Inaccuracy";

  const [animEvalCp, setAnimEvalCp] = useState<number | null>(null);

  const displayedEvalCp = useMemo(() => {
    if (animEvalCp !== null) return animEvalCp;
    if (fen === mistake.fenAfter) return whiteEvalAfter;
    return whiteEvalBefore;
  }, [fen, mistake.fenAfter, whiteEvalAfter, whiteEvalBefore, animEvalCp]);

  const clearTimers = () => {
    timerIds.current.forEach((timerId) => window.clearTimeout(timerId));
    timerIds.current = [];
  };

  useEffect(() => {
    return () => {
      clearTimers();
      if (fenCopiedTimerRef.current) window.clearTimeout(fenCopiedTimerRef.current);
    };
  }, []);

  const copyFen = async () => {
    try {
      await navigator.clipboard.writeText(mistake.fenBefore);
      setFenCopied(true);
      if (fenCopiedTimerRef.current) window.clearTimeout(fenCopiedTimerRef.current);
      fenCopiedTimerRef.current = window.setTimeout(() => setFenCopied(false), 1200);
    } catch {
      setExplanation("Could not copy FEN to clipboard on this browser.");
    }
  };

  const customSquareStyles = useMemo(() => {
    if (animating) return {};
    if (!userMoveDetails) return {};
    return {
      [userMoveDetails.from]: { backgroundColor: "rgba(56, 189, 248, 0.35)" },
      [userMoveDetails.to]: { backgroundColor: "rgba(56, 189, 248, 0.35)" }
    };
  }, [animating, userMoveDetails]);

  const customArrows = useMemo(() => {
    if (animating) return [] as [BoardSquare, BoardSquare, string?][];
    const arrows: [BoardSquare, BoardSquare, string?][] = [];
    if (bestMoveDetails && isBoardSquare(bestMoveDetails.from) && isBoardSquare(bestMoveDetails.to)) {
      arrows.push([bestMoveDetails.from, bestMoveDetails.to, "rgba(34, 197, 94, 0.9)"]);
    }
    if (userMoveDetails && isBoardSquare(userMoveDetails.from) && isBoardSquare(userMoveDetails.to)) {
      arrows.push([userMoveDetails.from, userMoveDetails.to, "rgba(56, 189, 248, 0.9)"]);
    }
    return arrows;
  }, [animating, userMoveDetails, bestMoveDetails]);

  const customSquare = useMemo(() => {
    return ((props: any) => {
      const square = props?.square as string | undefined;
      const showBadge = !animating && !!userMoveDetails && square === userMoveDetails.to;
      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {showBadge ? (
            <span
              className="pointer-events-none absolute right-0.5 top-0.5 z-[40] rounded px-1 py-[1px] text-[9px] font-bold text-white shadow"
              style={{ backgroundColor: severityColor }}
            >
              {severityLabel}
            </span>
          ) : null}
        </div>
      );
    }) as any;
  }, [animating, userMoveDetails, severityColor, severityLabel]);

  const moveToUciStr = (move: MoveDetails | null): string | null => {
    if (!move) return null;
    return `${move.from}${move.to}${move.promotion ?? ""}`;
  };

  const animateSequence = (startFen: string, uciMoves: string[]) => {
    clearTimers();
    const chess = new Chess(startFen);
    setFen(chess.fen());
    setAnimating(true);
    setAnimEvalCp(whiteEvalBefore);

    const steps: { uci: string; fen: string }[] = [];
    const simChess = new Chess(startFen);
    for (const uci of uciMoves.slice(0, 10)) {
      if (!isUci(uci)) break;
      const parsed = parseMove(uci);
      if (!parsed) break;
      const r = simChess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined,
      });
      if (!r) break;
      steps.push({ uci, fen: simChess.fen() });
    }

    steps.forEach((step, moveIndex) => {
      const timerId = window.setTimeout(() => {
        const parsed = parseMove(step.uci);
        if (!parsed) return;
        const result = chess.move({
          from: parsed.from,
          to: parsed.to,
          promotion: parsed.promotion as PieceSymbol | undefined,
        });
        if (result) {
          setFen(chess.fen());
          if (/[+#]/.test(result.san)) playSound("check");
          else if (result.captured) playSound("capture");
          else playSound("move");
          stockfishClient.evaluateFen(step.fen, 8).then((evalResult) => {
            if (evalResult) {
              const turn = new Chess(step.fen).turn();
              const whiteEval = turn === "w" ? evalResult.cp : -evalResult.cp;
              setAnimEvalCp(whiteEval);
            }
          }).catch(() => {});
        }
      }, (moveIndex + 1) * 2000);
      timerIds.current.push(timerId);
    });

    const resetTimerId = window.setTimeout(
      () => {
        setFen(mistake.fenBefore);
        setAnimating(false);
        setAnimEvalCp(null);
        setBoardInstance((v) => v + 1);
      },
      (steps.length + 1) * 2000 + 4000
    );
    timerIds.current.push(resetTimerId);
  };

  const stopAnimation = () => {
    clearTimers();
    setAnimating(false);
    setAnimEvalCp(null);
    setFen(mistake.fenBefore);
    setBoardInstance((v) => v + 1);
  };

  const onShowBestLine = async () => {
    if (explaining || animating) return;
    setExplaining(true);
    setExplanation("");
    setEndgameCards(null);
    setAnimLineUci([]);
    try {
      const bestUci = moveToUciStr(bestMoveDetails);
      if (!bestUci) {
        setExplanation("Could not parse the best move for this position.");
        return;
      }
      const bestFenChess = new Chess(mistake.fenBefore);
      const parsed = parseMove(bestUci);
      if (!parsed) {
        setExplanation("Could not parse the best move for this position.");
        return;
      }
      const moved = bestFenChess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined
      });
      if (!moved) {
        setExplanation("Could not apply the best move for this position.");
        return;
      }
      let evalAfterBestStr: string | undefined;
      const bestEval = await stockfishClient.evaluateFen(bestFenChess.fen(), engineDepth);
      if (bestEval) {
        evalAfterBestStr = formatEval(bestEval.cp, { showPlus: true });
      }
      const continuation = await stockfishClient.getPrincipalVariation(bestFenChess.fen(), 9, engineDepth);
      const bestContinuationMoves = continuation?.pvMoves ?? [];
      const pvText = formatPrincipalVariation(mistake.fenBefore, [bestUci, ...bestContinuationMoves]);
      setEndgameCards({
        type: "best",
        move: bestMoveDetails?.san ?? mistake.bestMove,
        impact: `Your move ${userMoveDetails?.san ?? mistake.userMove} loses about ${formatEvalLoss(mistake.cpLoss)} eval`,
        evalAfter: evalAfterBestStr,
        line: pvText || undefined,
      });
      const fullBestLine = [bestUci, ...bestContinuationMoves];
      setAnimLineUci(fullBestLine);
      setExplainModalOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to explain this position.";
      setExplanation(message);
    } finally {
      setExplaining(false);
    }
  };

  const onShowConsequence = async () => {
    if (explaining || animating) return;
    setExplaining(true);
    setExplanation("");
    setEndgameCards(null);
    setAnimLineUci([]);
    try {
      const playedUci = moveToUciStr(userMoveDetails);
      if (!playedUci) {
        setExplanation("Could not parse your played move for this position.");
        return;
      }
      const afterPlayed = new Chess(mistake.fenBefore);
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
        setExplanation("Engine did not return a principal variation.");
        return;
      }
      const sanLine: string[] = [playedResult.san];
      const pvContinuation = formatPrincipalVariation(afterPlayed.fen(), line.pvMoves);
      if (pvContinuation) sanLine.push(pvContinuation);

      const failedConversion = mistake.tags.includes("Failed Conversion");
      const contextText = failedConversion
        ? "You had a winning position but failed to convert."
        : `Lost about ${formatEvalLoss(mistake.cpLoss)} eval in this ${mistake.endgameType} endgame.`;

      setEndgameCards({
        type: "consequence",
        move: userMoveDetails?.san ?? mistake.userMove,
        impact: contextText,
        bestMove: bestMoveDetails?.san ?? mistake.bestMove,
        line: sanLine.length ? sanLine.join(" ") : undefined,
        context: failedConversion ? "Failed Conversion" : undefined,
      });
      const fullLine = [playedUci, ...line.pvMoves];
      setAnimLineUci(fullLine);
      setExplainModalOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to explain this position.";
      setExplanation(message);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <article className="glass-card-hover overflow-hidden border-sky-500/10">
      <div className="grid gap-0 md:grid-cols-[minmax(0,480px)_1fr]">
        {/* Board side */}
        <div ref={boardSizeRef} className="relative overflow-hidden border-b border-sky-500/[0.08] bg-sky-500/[0.02] p-3 sm:p-5 md:border-b-0 md:border-r">
          <div className="mx-auto flex w-full max-w-[460px] items-start gap-2 sm:gap-3">
            <EvalBar evalCp={displayedEvalCp} height={boardSize} />
            <div className="overflow-hidden rounded-xl">
              <Chessboard
                key={`${boardId}-${boardInstance}`}
                id={boardId}
                position={fen}
                arePiecesDraggable={false}
                customSquare={customSquare}
                customSquareStyles={customSquareStyles}
                customArrows={customArrows}
                boardOrientation={boardOrientation}
                boardWidth={boardSize}
                customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                showBoardNotation={showCoords}
              />
            </div>
          </div>
        </div>

        {/* Info side */}
        <div className="space-y-5 p-5 md:p-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-sky-300">
                {ENDGAME_TYPE_ICON[mistake.endgameType] ?? "♔"} {mistake.endgameType} Endgame
                <span className="ml-2 text-sm font-normal text-slate-400">
                  Game #{mistake.gameIndex}, Move {mistake.moveNumber}
                </span>
              </h3>
              <span
                className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: severityColor }}
              >
                {severityLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              You played{" "}
              <span className="font-mono text-sky-400">{userMoveDetails?.san ?? mistake.userMove}</span>{" "}
              but the best move was{" "}
              <span className="font-mono text-emerald-400">{bestMoveDetails?.san ?? mistake.bestMove}</span>,{" "}
              losing <span className="font-semibold text-sky-300">~{formatEvalLoss(mistake.cpLoss)}</span> eval.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Eval Before</p>
              <p className="mt-0.5 text-lg font-bold text-slate-200">
                {formatEval(mistake.cpBefore, { showPlus: true })}
              </p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Eval After Your Move</p>
              <p className="mt-0.5 text-lg font-bold text-sky-400">
                {formatEval(mistake.cpAfter, { showPlus: true })}
              </p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Eval Lost</p>
              <p className="mt-0.5 text-lg font-bold text-red-400">
                −{formatEvalLoss(mistake.cpLoss)}
              </p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Best Move</p>
              <p className="mt-0.5 text-lg font-bold font-mono text-emerald-400">
                {bestMoveDetails?.san ?? mistake.bestMove}
              </p>
            </div>
          </div>

          {/* Tags */}
          {!!mistake.tags?.length && (
            <div className="flex flex-wrap gap-1.5">
              {mistake.tags.map((tag) => (
                <span
                  key={`${mistake.fenBefore}-${tag}`}
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                    tag === "Failed Conversion"
                      ? "border-red-500/20 bg-red-500/10 text-red-400"
                      : tag === "Stalemate!"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                        : "border-sky-500/20 bg-sky-500/10 text-sky-400"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Endgame tip */}
          {ENDGAME_TIPS[mistake.endgameType] && (
            <div className="rounded-xl border border-sky-500/[0.08] bg-sky-500/[0.02] p-3">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                <span className="mt-0.5 shrink-0 text-sky-400">💡</span>
                <span><span className="font-semibold text-sky-300">{mistake.endgameType} tip:</span> {ENDGAME_TIPS[mistake.endgameType]}</span>
              </p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Green = best move
            <span className="mx-2 text-slate-600">|</span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-400" />
            Blue = your move
          </p>

          {/* FEN block */}
          <div className="rounded-xl border border-sky-500/[0.08] bg-sky-500/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Position FEN</span>
              <button type="button" onClick={copyFen} className="btn-secondary h-7 px-2.5 text-[11px]">
                {fenCopied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5 font-mono text-[11px] text-slate-500">
              {mistake.fenBefore}
            </pre>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={explaining || animating}
              className="flex h-10 items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 text-sm font-semibold text-sky-300 transition-all hover:bg-sky-500/20 hover:text-sky-200 disabled:opacity-50"
              onClick={onShowBestLine}
            >
              {explaining ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
              {explaining ? "Analyzing..." : animating ? "Animating..." : "Show best line"}
            </button>

            <button
              type="button"
              disabled={explaining || animating}
              className="btn-secondary flex h-10 items-center gap-2 text-sm"
              onClick={onShowConsequence}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {explaining ? "..." : animating ? "..." : "What went wrong"}
            </button>

            {animating && (
              <div className="ml-1 flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                  onClick={stopAnimation}
                  title="Stop"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Explanation output */}
          {(endgameCards || explanation) && (
            <div className="animate-fade-in space-y-2">
              {endgameCards ? (
                <>
                  {/* Compact preview — click to open modal */}
                  <button
                    type="button"
                    onClick={() => setExplainModalOpen(true)}
                    className={`w-full text-left rounded-xl border p-3 transition-all hover:brightness-110 cursor-pointer ${
                      endgameCards.type === "best"
                        ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                        : "border-red-500/20 bg-red-500/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-semibold ${
                        endgameCards.type === "best" ? "text-emerald-300" : "text-red-300"
                      }`}>
                        {endgameCards.type === "best" ? "✓ Best: " : "✗ "}
                        <strong className="text-white">{endgameCards.move}</strong>
                      </p>
                      {endgameCards.evalAfter && (
                        <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-mono font-bold tabular-nums text-emerald-400">
                          {endgameCards.evalAfter}
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 text-[11px] ${
                      endgameCards.type === "best" ? "text-emerald-400/70" : "text-red-400/70"
                    }`}>
                      {endgameCards.impact}
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                      Tap to see full explanation
                    </p>
                  </button>
                </>
              ) : (
                <div className="rounded-xl border border-sky-500/[0.08] bg-sky-500/[0.02] p-4 text-sm text-slate-300">
                  {explanation}
                </div>
              )}
            </div>
          )}

          {/* Explanation Modal */}
          <ExplanationModal
            open={explainModalOpen}
            onClose={() => setExplainModalOpen(false)}
            variant="endgame"
            simpleExplanation={endgameCards as SimpleExplanation | null}
            plainExplanation={explanation || undefined}
            fen={mistake.fenBefore}
            uciMoves={animLineUci}
            boardOrientation={boardOrientation}
            autoPlay
            title={endgameCards?.type === "best"
              ? `Best Move: ${bestMoveDetails?.san ?? mistake.bestMove}`
              : `Your Move: ${userMoveDetails?.san ?? mistake.userMove}`
            }
            subtitle={`${mistake.endgameType} endgame — lost ~${formatEvalLoss(mistake.cpLoss)} eval`}
          />
        </div>
      </div>
    </article>
  );
}
