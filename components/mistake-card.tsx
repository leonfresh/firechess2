"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { stockfishClient } from "@/lib/stockfish-client";
import { EvalBar } from "@/components/eval-bar";
import { Chessboard } from "react-chessboard";
import { playSound } from "@/lib/sounds";
import type { MoveSquare, RepeatedOpeningLeak } from "@/lib/types";
import { fetchExplorerMoves, type ExplorerMove } from "@/lib/lichess-explorer";

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

type MoveBadge = {
  label: "Inaccuracy" | "Mistake" | "Blunder";
  color: string;
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

function classifyLossBadge(cpLoss: number): MoveBadge {
  if (cpLoss >= 200) return { label: "Blunder", color: "#ef4444" };
  if (cpLoss >= 100) return { label: "Mistake", color: "#f59e0b" };
  return { label: "Inaccuracy", color: "#f97316" };
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
  const [explaining, setExplaining] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [fenCopied, setFenCopied] = useState(false);
  const [boardInstance, setBoardInstance] = useState(0);
  const timerIds = useRef<number[]>([]);
  const fenCopiedTimerRef = useRef<number | null>(null);
  const moveBadge = useMemo(() => classifyLossBadge(leak.cpLoss), [leak.cpLoss]);

  /* ── Lichess explorer database moves ── */
  const [explorerMoves, setExplorerMoves] = useState<ExplorerMove[]>([]);
  const [explorerTotal, setExplorerTotal] = useState(0);
  const [dbPick, setDbPick] = useState<ExplorerMove | null>(null);
  const [dbPickApproved, setDbPickApproved] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [userMoveExplorerData, setUserMoveExplorerData] = useState<ExplorerMove | null>(null);
  const dbPickMove = useMemo(
    () => (dbPick ? deriveMoveDetails(leak.fenBefore, dbPick.uci) : null),
    [dbPick, leak.fenBefore],
  );

  useEffect(() => {
    let cancelled = false;
    fetchExplorerMoves(leak.fenBefore, leak.sideToMove).then(async (result) => {
      if (cancelled) return;
      const filteredMoves = result.moves.filter((m) => m.totalGames >= 50);
      setExplorerMoves(filteredMoves);
      setExplorerTotal(result.totalGames);

      // Check if the user's move is in the explorer with decent stats
      const userMoveInDb = filteredMoves.find((m) => m.uci === leak.userMove);
      if (userMoveInDb && userMoveInDb.totalGames >= 100) {
        setUserMoveExplorerData(userMoveInDb);
      }

      if (result.topPick) {
        // Only show if the database pick differs from both the engine best and the user move
        const isDifferent =
          result.topPick.uci !== leak.bestMove &&
          result.topPick.uci !== leak.userMove;

        if (isDifferent) {
          // Engine-check: make sure the DB move doesn't lose significant eval
          try {
            const moveDetails = deriveMoveDetails(leak.fenBefore, result.topPick.uci);
            if (moveDetails) {
              const afterDb = new Chess(leak.fenBefore);
              const moved = afterDb.move({
                from: moveDetails.from,
                to: moveDetails.to,
                promotion: moveDetails.promotion as PieceSymbol | undefined,
              });
              if (moved) {
                const evalResult = await stockfishClient.evaluateFen(afterDb.fen(), 10);
                if (evalResult && !cancelled) {
                  // Compare: eval after DB move vs eval before (from side-to-move perspective)
                  const evalAfterDb = -evalResult.cp; // flip because it's now opponent's turn
                  const lossVsBefore = leak.evalBefore - evalAfterDb;
                  // Approve if it doesn't lose more than 60cp vs the current position
                  if (lossVsBefore <= 60) {
                    setDbPick(result.topPick);
                    setDbPickApproved(true);
                  } else {
                    // Show it still but mark as not approved
                    setDbPick(result.topPick);
                    setDbPickApproved(false);
                  }
                }
              }
            }
          } catch {
            // If engine check fails, still show the pick but not approved
            if (!cancelled) {
              setDbPick(result.topPick);
              setDbPickApproved(false);
            }
          }
        }
      }
    });
    return () => { cancelled = true; };
  }, [leak.fenBefore, leak.sideToMove, leak.bestMove, leak.userMove, leak.evalBefore]);

  const [animEvalCp, setAnimEvalCp] = useState<number | null>(null);

  const displayedEvalCp = useMemo(() => {
    if (animEvalCp !== null) return animEvalCp;
    if (fen === leak.fenAfter) return whiteEvalAfter;
    return whiteEvalBefore;
  }, [fen, leak.fenAfter, whiteEvalAfter, whiteEvalBefore, animEvalCp]);

  const clearTimers = () => {
    timerIds.current.forEach((timerId) => window.clearTimeout(timerId));
    timerIds.current = [];
  };

  useEffect(() => {
    return () => {
      clearTimers();
      if (fenCopiedTimerRef.current) {
        window.clearTimeout(fenCopiedTimerRef.current);
      }
    };
  }, []);

  const copyFen = async () => {
    try {
      await navigator.clipboard.writeText(leak.fenBefore);
      setFenCopied(true);
      if (fenCopiedTimerRef.current) {
        window.clearTimeout(fenCopiedTimerRef.current);
      }
      fenCopiedTimerRef.current = window.setTimeout(() => setFenCopied(false), 1200);
    } catch {
      setExplanation("Could not copy FEN to clipboard on this browser.");
    }
  };

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

    // 3rd arrow: Lichess database pick (blue) — only if engine-approved
    if (dbPick && dbPickApproved && dbPickMove && isBoardSquare(dbPickMove.from) && isBoardSquare(dbPickMove.to)) {
      arrows.push([dbPickMove.from, dbPickMove.to, "rgba(59, 130, 246, 0.85)"]);
    }

    return arrows;
  }, [animating, badMove, bestMove, dbPick, dbPickApproved, dbPickMove]);

  const customSquare = useMemo(() => {
    return ((props: any) => {
      const square = props?.square as string | undefined;
      const showBadge = !animating && !!badMove && square === badMove.to;

      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {showBadge ? (
            <span
              className="pointer-events-none absolute right-0.5 top-0.5 z-[40] rounded px-1 py-[1px] text-[9px] font-bold text-white shadow"
              style={{ backgroundColor: moveBadge.color }}
            >
              {moveBadge.label}
            </span>
          ) : null}
        </div>
      );
    }) as any;
  }, [animating, badMove, moveBadge.color, moveBadge.label]);

  const moveToUci = (move: MoveDetails | null): string | null => {
    if (!move) return null;
    return `${move.from}${move.to}${move.promotion ?? ""}`;
  };

  const animateSequence = (startFen: string, uciMoves: string[]) => {
    clearTimers();

    const chess = new Chess(startFen);
    setFen(chess.fen());
    setAnimating(true);
    setAnimEvalCp(whiteEvalBefore);

    // Pre-compute FENs for each step so we can evaluate them
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
          // Evaluate this position at low depth for a quick eval bar update
          stockfishClient.evaluateFen(step.fen, 8).then((evalResult) => {
            if (evalResult) {
              // evaluateFen returns cp from side-to-move perspective;
              // convert to white's perspective for the eval bar
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
        setFen(leak.fenBefore);
        setAnimating(false);
        setAnimEvalCp(null);
        setBoardInstance((value) => value + 1);
      },
      (steps.length + 1) * 2000 + 4000
    );

    timerIds.current.push(resetTimerId);
  };

  const stopAnimation = () => {
    clearTimers();
    setAnimating(false);
    setAnimEvalCp(null);
    setFen(leak.fenBefore);
    setBoardInstance((value) => value + 1);
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

  const onExplainDbMove = async () => {
    if (explaining || animating || !dbPick || !dbPickMove) return;

    setExplaining(true);
    setExplanation("");

    try {
      const dbUci = `${dbPickMove.from}${dbPickMove.to}${dbPickMove.promotion ?? ""}`;
      const afterDb = new Chess(leak.fenBefore);
      const parsed = parseMove(dbUci);
      if (!parsed) {
        setExplanation("Could not parse the database move.");
        return;
      }

      const moved = afterDb.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined,
      });

      if (!moved) {
        setExplanation("Could not apply the database move.");
        return;
      }

      const evalResult = await stockfishClient.evaluateFen(afterDb.fen(), engineDepth);
      let evalText = "";
      if (evalResult) {
        const evalAfterDb = -evalResult.cp;
        evalText = ` Engine eval after ${dbPickMove.san}: ${formatEval(evalAfterDb, { showPlus: true })}.`;
      }

      const continuation = await stockfishClient.getPrincipalVariation(afterDb.fen(), 9, engineDepth);
      const contMoves = continuation?.pvMoves ?? [];
      const pvText = formatPrincipalVariation(leak.fenBefore, [dbUci, ...contMoves]);

      const winPct = (dbPick.winRate * 100).toFixed(1);
      const gamesText = dbPick.totalGames >= 1_000
        ? `${(dbPick.totalGames / 1_000).toFixed(0)}K`
        : dbPick.totalGames.toLocaleString();

      setExplanation(
        `Database move ${dbPickMove.san} is the most popular choice among rated players in this position, ` +
          `played in ${gamesText} games with a ${winPct}% win rate. ` +
          `Unlike the engine's top pick (${bestMove?.san ?? "N/A"}), this move prioritises ` +
          `practical results — patterns that humans score well with.` +
          evalText +
          (pvText ? ` Likely continuation: ${pvText}.` : "")
      );

      const fullLine = [dbUci, ...contMoves];
      if (fullLine.length > 0) {
        animateSequence(leak.fenBefore, fullLine);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to explain this position.";
      setExplanation(message);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <article className="glass-card-hover overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[480px_1fr]">
        {/* Board side */}
        <div className="relative border-b border-white/[0.04] bg-white/[0.01] p-5 md:border-b-0 md:border-r">
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
              <h3 className="text-lg font-bold text-white">Repeated Opening Leak</h3>
              <span
                className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: moveBadge.color }}
              >
                {moveBadge.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              You reached this position <span className="font-semibold text-slate-200">{leak.reachCount}</span> times and
              played <span className="font-mono text-red-400">{leak.userMove}</span>{" "}
              <span className="font-semibold text-slate-200">{leak.moveCount}</span> times.
            </p>
          </div>

          {/* Explorer-approved practical move banner */}
          {moveBadge.label === "Inaccuracy" && userMoveExplorerData && userMoveExplorerData.winRate >= 0.45 && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-sm">
                ✅
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/70">
                  Practical Opening Choice
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Your move <span className="font-mono font-bold text-slate-300">{badMove?.san}</span> is played in{" "}
                  <span className="font-semibold text-slate-300">{userMoveExplorerData.totalGames.toLocaleString()}</span> games
                  with a <span className="font-semibold text-emerald-400">{(userMoveExplorerData.winRate * 100).toFixed(0)}%</span> win rate.
                  The engine slightly prefers another move, but this is a fine choice against human players.
                </p>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Eval Loss</p>
              <p className="mt-0.5 text-lg font-bold text-red-400">{formatEval(leak.cpLoss)}</p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Eval Before</p>
              <p className="mt-0.5 text-lg font-bold text-slate-200">{formatEval(leak.evalBefore, { showPlus: true })}</p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Eval After</p>
              <p className="mt-0.5 text-lg font-bold text-slate-200">{formatEval(leak.evalAfter, { showPlus: true })}</p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Best Move</p>
              <p className="mt-0.5 text-lg font-bold text-emerald-400 font-mono">{bestMove?.san ?? "N/A"}</p>
            </div>
          </div>

          {/* Lichess Opening Explorer */}
          {explorerMoves.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowExplorer((v) => !v)}
                className="flex w-full items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-3.5 py-2.5 text-left transition-colors hover:bg-blue-500/[0.1]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(59,130,246)" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-blue-400/70">Opening Explorer</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    What other players chose here · {explorerTotal.toLocaleString()} games in database
                  </p>
                </div>
                <svg
                  className={`h-4 w-4 shrink-0 text-blue-400/50 transition-transform ${showExplorer ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {showExplorer && (
                <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  {/* Info tooltip */}
                  <div className="border-b border-white/[0.04] px-3.5 py-2">
                    <p className="text-[11px] text-slate-500">
                      Moves played by rated players (1600–2500) in this exact position on Lichess.
                      Sorted by win rate. Popularity shown as % of total games.
                    </p>
                  </div>

                  {/* Table header */}
                  <div className="grid grid-cols-[minmax(50px,1fr)_60px_1fr_50px] items-center gap-1 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    <span>Move</span>
                    <span className="text-right">Games</span>
                    <span className="text-center">White / Draw / Black</span>
                    <span className="text-right">Win%</span>
                  </div>

                  {/* Move rows */}
                  {explorerMoves
                    .sort((a, b) => b.winRate - a.winRate)
                    .slice(0, 12)
                    .map((m, idx) => {
                      const total = m.white + m.draws + m.black;
                      const wPct = total > 0 ? (m.white / total) * 100 : 0;
                      const dPct = total > 0 ? (m.draws / total) * 100 : 0;
                      const bPct = total > 0 ? (m.black / total) * 100 : 0;
                      const popularity = explorerTotal > 0 ? (m.totalGames / explorerTotal) * 100 : 0;
                      const isUserMove = m.uci === leak.userMove;
                      const isBest = m.uci === leak.bestMove;
                      const isDbPick = dbPick?.uci === m.uci;

                      return (
                        <div
                          key={`${m.uci}-${idx}`}
                          className={`grid grid-cols-[minmax(50px,1fr)_60px_1fr_50px] items-center gap-1 px-3.5 py-1.5 text-xs ${
                            idx % 2 === 0 ? "bg-white/[0.01]" : ""
                          } ${isDbPick ? "ring-1 ring-blue-500/30 bg-blue-500/[0.06]" : ""}`}
                        >
                          {/* Move name */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-semibold ${
                                isBest
                                  ? "text-emerald-400"
                                  : isUserMove
                                    ? "text-red-400"
                                    : isDbPick
                                      ? "text-blue-400"
                                      : "text-slate-300"
                              }`}
                            >
                              {m.san}
                            </span>
                            <span className="text-[10px] text-slate-500">{popularity.toFixed(0)}%</span>
                          </div>

                          {/* Game count */}
                          <span className="text-right tabular-nums text-slate-400">
                            {m.totalGames >= 1_000_000
                              ? `${(m.totalGames / 1_000_000).toFixed(1)}M`
                              : m.totalGames >= 1_000
                                ? `${(m.totalGames / 1_000).toFixed(0)}K`
                                : m.totalGames.toLocaleString()}
                          </span>

                          {/* Win/Draw/Loss bar */}
                          <div className="flex h-4 overflow-hidden rounded-sm">
                            <div
                              className="bg-white transition-all"
                              style={{ width: `${wPct}%` }}
                              title={`White wins: ${wPct.toFixed(1)}%`}
                            />
                            <div
                              className="bg-slate-500 transition-all"
                              style={{ width: `${dPct}%` }}
                              title={`Draws: ${dPct.toFixed(1)}%`}
                            />
                            <div
                              className="bg-slate-800 transition-all"
                              style={{ width: `${bPct}%` }}
                              title={`Black wins: ${bPct.toFixed(1)}%`}
                            />
                          </div>

                          {/* Win rate */}
                          <span className="text-right tabular-nums font-medium text-slate-300">
                            {(m.winRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}

                  {/* Legend */}
                  <div className="flex items-center gap-4 border-t border-white/[0.04] px-3.5 py-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-4 rounded-sm bg-white" /> White wins
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-4 rounded-sm bg-slate-500" /> Draw
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-4 rounded-sm bg-slate-800" /> Black wins
                    </span>
                    {explorerMoves.some((m) => m.uci === leak.bestMove) && (
                      <span className="flex items-center gap-1">
                        <span className="font-mono font-semibold text-emerald-400">Abc</span> = engine best
                      </span>
                    )}
                    {explorerMoves.some((m) => m.uci === leak.userMove) && (
                      <span className="flex items-center gap-1">
                        <span className="font-mono font-semibold text-red-400">Abc</span> = your move
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* DB pick highlight — only when approved */}
              {dbPick && dbPickApproved && dbPickMove && (
                <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-3.5 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-sm">
                    📊
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-blue-400/70">
                      Top Database Pick · Engine Approved ✓
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      <span className="font-mono font-bold text-blue-400">{dbPickMove.san}</span>
                      {" "}has the highest win rate ({(dbPick.winRate * 100).toFixed(1)}%) among moves
                      that don&apos;t lose significant eval.
                      Shown as the{" "}
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />{" "}
                      blue arrow on the board.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {!!leak.tags?.length && (
            <div className="flex flex-wrap gap-1.5">
              {leak.tags.map((tag) => (
                <span key={`${leak.fenBefore}-${tag}`} className="tag-emerald text-[11px]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Green = best move
            <span className="mx-2 text-slate-600">|</span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-400" />
            Red = your move
            {dbPick && dbPickApproved && (
              <>
                <span className="mx-2 text-slate-600">|</span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />
                Blue = database pick
              </>
            )}
          </p>

          {/* FEN block */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Position FEN</span>
              <button
                type="button"
                onClick={copyFen}
                className="btn-secondary h-7 px-2.5 text-[11px]"
              >
                {fenCopied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5 font-mono text-[11px] text-slate-500">
              {leak.fenBefore}
            </pre>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={explaining || animating}
              className="btn-primary flex h-10 items-center gap-2 text-sm"
              onClick={onExplainBestMove}
            >
              {explaining ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              {explaining ? "Explaining..." : animating ? "Animating..." : "Explain best move"}
            </button>

            <button
              type="button"
              disabled={explaining || animating}
              className="btn-secondary flex h-10 items-center gap-2 text-sm"
              onClick={onExplainMistake}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {explaining ? "..." : animating ? "..." : "Explain played move"}
            </button>

            {dbPick && dbPickApproved && dbPickMove && (
              <button
                type="button"
                disabled={explaining || animating}
                className="flex h-10 items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/[0.08] px-4 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/[0.15] disabled:opacity-40"
                onClick={onExplainDbMove}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                {explaining ? "..." : animating ? "..." : "Explain database move"}
              </button>
            )}

            {animating && (
              <div className="ml-1 flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                  onClick={stopAnimation}
                  title="Stop"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                </button>
              </div>
            )}
          </div>

          {/* Explanation output */}
          {explanation && (
            <div className="animate-fade-in rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-slate-300">
              {explanation}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
