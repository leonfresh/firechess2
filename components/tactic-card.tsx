"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { stockfishClient } from "@/lib/stockfish-client";
import { EvalBar } from "@/components/eval-bar";
import { Chessboard } from "react-chessboard";
import { playSound } from "@/lib/sounds";
import type { MissedTactic, MoveSquare } from "@/lib/types";

type TacticCardProps = {
  tactic: MissedTactic;
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

function mateInN(cp: number): number {
  return 100000 - Math.abs(cp);
}

function formatEval(valueCp: number, options?: { showPlus?: boolean }): string {
  if (isMateScore(valueCp)) {
    const n = mateInN(valueCp);
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

export function TacticCard({ tactic, engineDepth }: TacticCardProps) {
  const userMoveDetails = useMemo(
    () => deriveMoveDetails(tactic.fenBefore, tactic.userMove),
    [tactic.fenBefore, tactic.userMove]
  );
  const bestMoveDetails = useMemo(
    () => deriveMoveDetails(tactic.fenBefore, tactic.bestMove),
    [tactic.fenBefore, tactic.bestMove]
  );
  const boardId = useMemo(
    () => `tactic-${tactic.fenBefore.replace(/[^a-zA-Z0-9]/g, "-")}`,
    [tactic.fenBefore]
  );
  const boardOrientation = tactic.userColor === "black" ? "black" : "white";
  const whiteEvalBefore = tactic.sideToMove === "white" ? tactic.cpBefore : -tactic.cpBefore;
  const whiteEvalAfter = tactic.sideToMove === "white" ? tactic.cpAfter : -tactic.cpAfter;

  const [fen, setFen] = useState(tactic.fenBefore);
  const [explaining, setExplaining] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [fenCopied, setFenCopied] = useState(false);
  const [boardInstance, setBoardInstance] = useState(0);
  const timerIds = useRef<number[]>([]);
  const fenCopiedTimerRef = useRef<number | null>(null);

  const isMate = isMateScore(tactic.cpBefore) || tactic.cpLoss >= MATE_THRESHOLD;
  const severityColor = isMate ? "#dc2626" : tactic.cpLoss >= 600 ? "#ef4444" : tactic.cpLoss >= 400 ? "#f59e0b" : "#f97316";
  const severityLabel = isMate ? "Missed Mate" : tactic.cpLoss >= 600 ? "Critical" : tactic.cpLoss >= 400 ? "Major" : "Missed";

  const [animEvalCp, setAnimEvalCp] = useState<number | null>(null);

  const displayedEvalCp = useMemo(() => {
    if (animEvalCp !== null) return animEvalCp;
    if (fen === tactic.fenAfter) return whiteEvalAfter;
    return whiteEvalBefore;
  }, [fen, tactic.fenAfter, whiteEvalAfter, whiteEvalBefore, animEvalCp]);

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
      await navigator.clipboard.writeText(tactic.fenBefore);
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
      [userMoveDetails.from]: { backgroundColor: "rgba(245, 158, 11, 0.40)" },
      [userMoveDetails.to]: { backgroundColor: "rgba(245, 158, 11, 0.40)" }
    };
  }, [animating, userMoveDetails]);

  const customArrows = useMemo(() => {
    if (animating) return [] as [BoardSquare, BoardSquare, string?][];
    const arrows: [BoardSquare, BoardSquare, string?][] = [];
    if (bestMoveDetails && isBoardSquare(bestMoveDetails.from) && isBoardSquare(bestMoveDetails.to)) {
      arrows.push([bestMoveDetails.from, bestMoveDetails.to, "rgba(34, 197, 94, 0.9)"]);
    }
    if (userMoveDetails && isBoardSquare(userMoveDetails.from) && isBoardSquare(userMoveDetails.to)) {
      arrows.push([userMoveDetails.from, userMoveDetails.to, "rgba(245, 158, 11, 0.9)"]);
    }
    return arrows;
  }, [animating, userMoveDetails, bestMoveDetails]);

  const customSquare = useMemo(() => {
    return ((props: any) => {
      const square = props?.square as string | undefined;
      const showBadge = !animating && !!bestMoveDetails && square === bestMoveDetails.to;
      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {showBadge ? (
            <span className="pointer-events-none absolute right-0.5 top-0.5 z-[40] rounded px-1 py-[1px] text-[9px] font-bold text-white shadow bg-emerald-500">
              Best
            </span>
          ) : null}
        </div>
      );
    }) as any;
  }, [animating, bestMoveDetails]);

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

    // Pre-compute FENs for each step
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
          // Play appropriate move sound
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
        setFen(tactic.fenBefore);
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
    setFen(tactic.fenBefore);
    setBoardInstance((v) => v + 1);
  };

  const onShowWinningLine = async () => {
    if (explaining || animating) return;
    setExplaining(true);
    setExplanation("");
    try {
      const bestUci = moveToUciStr(bestMoveDetails);
      if (!bestUci) {
        setExplanation("Could not parse the winning move for this position.");
        return;
      }
      const bestFenChess = new Chess(tactic.fenBefore);
      const parsed = parseMove(bestUci);
      if (!parsed) {
        setExplanation("Could not parse the winning move for this position.");
        return;
      }
      const moved = bestFenChess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined
      });
      if (!moved) {
        setExplanation("Could not apply the winning move for this position.");
        return;
      }
      let evalAfterBestText = "";
      const bestEval = await stockfishClient.evaluateFen(bestFenChess.fen(), engineDepth);
      if (bestEval) {
        evalAfterBestText = ` Eval after best move: ${formatEval(bestEval.cp, { showPlus: true })} (side to move).`;
      }
      const continuation = await stockfishClient.getPrincipalVariation(bestFenChess.fen(), 9, engineDepth);
      const bestContinuationMoves = continuation?.pvMoves ?? [];
      const pvText = formatPrincipalVariation(tactic.fenBefore, [bestUci, ...bestContinuationMoves]);
      const gainText = isMate
        ? "leads to forced mate"
        : `gains about ${formatEvalLoss(tactic.cpLoss)} eval through a forcing sequence`;
      setExplanation(
        `The winning move ${bestMoveDetails?.san ?? tactic.bestMove} ${gainText}.${evalAfterBestText} ` +
          `Winning line: ${pvText || "not available"}.`
      );
      const fullBestLine = [bestUci, ...bestContinuationMoves];
      if (fullBestLine.length > 0) animateSequence(tactic.fenBefore, fullBestLine);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to explain this position.";
      setExplanation(message);
    } finally {
      setExplaining(false);
    }
  };

  const onShowPunishment = async () => {
    if (explaining || animating) return;
    setExplaining(true);
    setExplanation("");
    try {
      const playedUci = moveToUciStr(userMoveDetails);
      if (!playedUci) {
        setExplanation("Could not parse your played move for this position.");
        return;
      }
      const afterPlayed = new Chess(tactic.fenBefore);
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
      const continuation = formatPrincipalVariation(afterPlayed.fen(), line.pvMoves);
      if (continuation) sanLine.push(continuation);
      const missedText = isMate
        ? "and missed a forced mate"
        : `and missed a ${formatEvalLoss(tactic.cpLoss)} eval gain`;
      setExplanation(
        `You played ${userMoveDetails?.san ?? tactic.userMove} ${missedText}. ` +
          `The winning move was ${bestMoveDetails?.san ?? tactic.bestMove}. ` +
          `What happens after your move: ${sanLine.length ? sanLine.join(" ") : "not available"}.`
      );
      if (line.pvMoves.length > 0) {
        animateSequence(tactic.fenBefore, [playedUci, ...line.pvMoves]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to explain this position.";
      setExplanation(message);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <article className="glass-card-hover overflow-hidden border-amber-500/10">
      <div className="grid gap-0 md:grid-cols-[480px_1fr]">
        {/* Board side */}
        <div className="relative border-b border-amber-500/[0.08] bg-amber-500/[0.02] p-5 md:border-b-0 md:border-r">
          <div className="mx-auto flex w-full max-w-[460px] items-start gap-3">
            <EvalBar evalCp={displayedEvalCp} height={400} />
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
                boardWidth={400}
                customDarkSquareStyle={{ backgroundColor: "#779952" }}
                customLightSquareStyle={{ backgroundColor: "#edeed1" }}
              />
            </div>
          </div>
        </div>

        {/* Info side */}
        <div className="space-y-5 p-5 md:p-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-amber-300">
                ⚡ Missed Tactic
                <span className="ml-2 text-sm font-normal text-slate-400">
                  Game #{tactic.gameIndex}, Move {tactic.moveNumber}
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
              {isMate ? (
                <>You had a <span className="font-semibold text-red-400">forced mate</span> but played{" "}
                <span className="font-mono text-amber-400">{userMoveDetails?.san ?? tactic.userMove}</span> instead.</>
              ) : (
                <>You had a forcing move that wins{" "}
                <span className="font-semibold text-amber-300">~{formatEvalLoss(tactic.cpLoss)}</span> eval, but you played{" "}
                <span className="font-mono text-amber-400">{userMoveDetails?.san ?? tactic.userMove}</span> instead.</>
              )}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Eval Before</p>
              <p className="mt-0.5 text-lg font-bold text-slate-200">
                {formatEval(tactic.cpBefore, { showPlus: true })}
              </p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Eval After Your Move</p>
              <p className="mt-0.5 text-lg font-bold text-amber-400">
                {formatEval(tactic.cpAfter, { showPlus: true })}
              </p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{isMate ? "Missed" : "Material Missed"}</p>
              <p className={`mt-0.5 text-lg font-bold ${isMate ? "text-red-500" : "text-red-400"}`}>
                {isMate ? "Forced Mate" : `−${formatEvalLoss(tactic.cpLoss)}`}
              </p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Winning Move</p>
              <p className="mt-0.5 text-lg font-bold font-mono text-emerald-400">
                {bestMoveDetails?.san ?? tactic.bestMove}
              </p>
            </div>
          </div>

          {/* Tags */}
          {(!!tactic.tags?.length || tactic.timeRemainingSec !== null) && (
            <div className="flex flex-wrap gap-1.5">
              {tactic.tags.filter(t => t !== "Time Pressure").map((tag) => (
                <span key={`${tactic.fenBefore}-${tag}`} className="tag-amber text-[11px]">
                  {tag}
                </span>
              ))}
              {typeof tactic.timeRemainingSec === "number" && tactic.timeRemainingSec <= 30 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Time Pressure ({tactic.timeRemainingSec}s left)
                </span>
              )}
              {typeof tactic.timeRemainingSec === "number" && tactic.timeRemainingSec > 30 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {tactic.timeRemainingSec}s on clock
                </span>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Green = winning move
            <span className="mx-2 text-slate-600">|</span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
            Amber = your move
          </p>

          {/* FEN block */}
          <div className="rounded-xl border border-amber-500/[0.08] bg-amber-500/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Position FEN</span>
              <button type="button" onClick={copyFen} className="btn-secondary h-7 px-2.5 text-[11px]">
                {fenCopied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5 font-mono text-[11px] text-slate-500">
              {tactic.fenBefore}
            </pre>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={explaining || animating}
              className="btn-amber flex h-10 items-center gap-2 text-sm"
              onClick={onShowWinningLine}
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
              {explaining ? "Analyzing..." : animating ? "Animating..." : "Show winning line"}
            </button>

            <button
              type="button"
              disabled={explaining || animating}
              className="btn-secondary flex h-10 items-center gap-2 text-sm"
              onClick={onShowPunishment}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {explaining ? "..." : animating ? "..." : "Why it matters"}
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
          {explanation && (
            <div className="animate-fade-in rounded-xl border border-amber-500/[0.08] bg-amber-500/[0.02] p-4 text-sm text-slate-300">
              {explanation}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
