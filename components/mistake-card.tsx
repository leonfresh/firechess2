"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { stockfishClient } from "@/lib/stockfish-client";
import { EvalBar } from "@/components/eval-bar";
import { Chessboard } from "react-chessboard";
import type { Square as CbSquare, PromotionPieceOption } from "react-chessboard/dist/chessboard/types";
import { playSound } from "@/lib/sounds";
import { useBoardSize } from "@/lib/use-board-size";
import type { MoveSquare, RepeatedOpeningLeak } from "@/lib/types";
import { fetchExplorerMoves, type ExplorerMove } from "@/lib/lichess-explorer";
import { explainOpeningLeak, describeEndPosition, type MoveExplanation, type PositionExplanation } from "@/lib/position-explainer";
import { SaveToRepertoireButton } from "@/components/opening-repertoire";
import { useBoardTheme } from "@/lib/use-coins";

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
  label: "Inaccuracy" | "Mistake" | "Blunder" | "Sideline";
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

function classifyLossBadge(cpLoss: number, dbApproved?: boolean, explorerMove?: ExplorerMove | null): MoveBadge {
  // Analysis-side DB approval (exact threshold match)
  if (dbApproved) return { label: "Sideline", color: "#6366f1" };

  // Formula-based sideline detection:
  // The more games in the DB and the higher the win rate, the more CPL
  // is needed before we call the move an inaccuracy/mistake.
  //   dbScore examples (winRate ≈ 0.50):
  //     50 games  → ~65    |  500 games → ~108
  //   5 000 games → ~148   | 50 000     → ~188
  // 500 000 games → ~228   (capped at 300)
  if (explorerMove && explorerMove.totalGames >= 50 && explorerMove.winRate >= 0.40) {
    const dbScore = Math.min(
      300,
      Math.log10(explorerMove.totalGames) * 40 * (explorerMove.winRate / 0.50),
    );
    if (cpLoss <= dbScore) {
      return { label: "Sideline", color: "#6366f1" };
    }
  }

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
  const { ref: boardSizeRef, size: boardSize } = useBoardSize(480);
  const boardTheme = useBoardTheme();
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
  const [richExplanation, setRichExplanation] = useState<PositionExplanation | null>(null);
  const [activeExplainTab, setActiveExplainTab] = useState<"played" | "best" | "db" | null>(null);
  const [fenCopied, setFenCopied] = useState(false);
  const [boardInstance, setBoardInstance] = useState(0);
  const timerIds = useRef<number[]>([]);
  const fenCopiedTimerRef = useRef<number | null>(null);

  /* ── PV playback state ── */
  const [pvSteps, setPvSteps] = useState<{ uci: string; fen: string }[]>([]);
  const [pvStepIndex, setPvStepIndex] = useState(-1); // -1 = starting position (before any moves)
  const [pvAutoplay, setPvAutoplay] = useState(false);
  const autoplayTimer = useRef<number | null>(null);

  /* ── Freeplay state ── */
  const [freeplayMode, setFreeplayMode] = useState(false);
  const [freeplayEvalCp, setFreeplayEvalCp] = useState<number | null>(null);
  const [freeplayHistory, setFreeplayHistory] = useState<string[]>([]); // stack of FENs for undo
  const [freeplayEvaluating, setFreeplayEvaluating] = useState(false);
  const [freeplayBadge, setFreeplayBadge] = useState<{ label: string; color: string } | null>(null);
  const freeplayBadgeTimer = useRef<number | null>(null);
  const [fpLastMoveTo, setFpLastMoveTo] = useState<string | null>(null);
  const [fpLastMoveFrom, setFpLastMoveFrom] = useState<string | null>(null);
  // Click-to-move in freeplay
  const [fpSelectedSq, setFpSelectedSq] = useState<string | null>(null);
  const [fpLegalMoves, setFpLegalMoves] = useState<string[]>([]);
  const [showFpPromo, setShowFpPromo] = useState(false);
  const [fpPromoFrom, setFpPromoFrom] = useState<string | null>(null);
  const [fpPromoTo, setFpPromoTo] = useState<string | null>(null);

  /* ── Custom drag system (avoids react-chessboard position:fixed issues) ── */
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);
  const dragSourceSq = useRef<string | null>(null);
  const isDragging = useRef(false);

  /** Convert page coords to board square, respecting orientation */
  const coordsToSquare = (pageX: number, pageY: number): string | null => {
    const el = boardContainerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = pageX - rect.left;
    const y = pageY - rect.top;
    const size = rect.width / 8;
    let col = Math.floor(x / size);
    let row = Math.floor(y / size);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    if (boardOrientation === "white") {
      return `${String.fromCharCode(97 + col)}${8 - row}`;
    } else {
      return `${String.fromCharCode(97 + (7 - col))}${row + 1}`;
    }
  };

  const cleanupDrag = () => {
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
    // Restore hidden piece opacity
    const el = boardContainerRef.current;
    if (el && dragSourceSq.current) {
      const sq = el.querySelector(`[data-square="${dragSourceSq.current}"]`) as HTMLElement | null;
      if (sq) {
        const pieceEl = sq.querySelector("[data-piece]") as HTMLElement | null;
        if (pieceEl) pieceEl.style.opacity = "1";
      }
    }
    dragSourceSq.current = null;
    isDragging.current = false;
  };

  const handleBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!freeplayMode || freeplayEvaluating) return;
    // Only primary button
    if (e.button !== 0) return;

    const square = coordsToSquare(e.clientX, e.clientY);
    if (!square) return;

    const chess = new Chess(fen);
    const sideToMove = fen.includes(" w ") ? "w" : "b";
    const pieceOnSquare = chess.get(square as Parameters<Chess["get"]>[0]);
    if (!pieceOnSquare || pieceOnSquare.color !== sideToMove) return;

    // Find the piece image in the square
    const el = boardContainerRef.current;
    if (!el) return;
    const sqEl = el.querySelector(`[data-square="${square}"]`) as HTMLElement | null;
    if (!sqEl) return;
    const pieceEl = sqEl.querySelector("[data-piece]") as HTMLElement | null;
    // Try to find an <img> or <svg> inside, or clone the whole piece element
    const imgEl = sqEl.querySelector("img, svg") as HTMLElement | null;
    const sourceEl = imgEl || pieceEl;
    if (!sourceEl) return;

    e.preventDefault();

    // Create ghost
    const ghost = document.createElement("div");
    const rect = el.getBoundingClientRect();
    const sqSize = rect.width / 8;
    ghost.style.cssText = `
      position: fixed;
      z-index: 99999;
      pointer-events: none;
      width: ${sqSize}px;
      height: ${sqSize}px;
      transform: translate(-50%, -50%);
      opacity: 0.9;
    `;
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.style.width = "100%";
    clone.style.height = "100%";
    ghost.appendChild(clone);
    document.body.appendChild(ghost);
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;

    // Hide original piece
    if (pieceEl) pieceEl.style.opacity = "0";

    dragGhostRef.current = ghost;
    dragSourceSq.current = square;
    isDragging.current = true;

    // Also set selection highlight
    const moves = chess.moves({ square: square as Parameters<Chess["moves"]>[0]["square"], verbose: true });
    setFpSelectedSq(square);
    setFpLegalMoves(moves.map(m => m.to));

    // Capture pointer for smooth tracking
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !dragGhostRef.current) return;
    dragGhostRef.current.style.left = `${e.clientX}px`;
    dragGhostRef.current.style.top = `${e.clientY}px`;
  };

  const handleBoardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !dragSourceSq.current) return;

    const targetSquare = coordsToSquare(e.clientX, e.clientY);
    const sourceSquare = dragSourceSq.current;
    cleanupDrag();

    if (!targetSquare || targetSquare === sourceSquare) {
      // No move — keep selection active for click-to-move
      return;
    }

    // Check for promotion
    const chess = new Chess(fen);
    const piece = chess.get(sourceSquare as Parameters<Chess["get"]>[0]);
    if (piece?.type === "p") {
      const targetRank = parseInt(targetSquare[1]);
      const isPromo = (piece.color === "w" && targetRank === 8) || (piece.color === "b" && targetRank === 1);
      if (isPromo) {
        setFpPromoFrom(sourceSquare);
        setFpPromoTo(targetSquare);
        setShowFpPromo(true);
        return;
      }
    }

    executeFreeplayMove(sourceSquare, targetSquare);
    setFpSelectedSq(null);
    setFpLegalMoves([]);
  };

  // Cleanup drag on unmount or mode change
  useEffect(() => {
    return () => { cleanupDrag(); };
  }, [freeplayMode]);

  // Pre-compute coaching explanations once
  const coaching = useMemo<MoveExplanation>(
    () => explainOpeningLeak(leak.fenBefore, leak.userMove, leak.bestMove, leak.cpLoss, leak.evalBefore, leak.evalAfter),
    [leak.fenBefore, leak.userMove, leak.bestMove, leak.cpLoss, leak.evalBefore, leak.evalAfter],
  );

  /* ── Lichess explorer database moves ── */
  const [explorerMoves, setExplorerMoves] = useState<ExplorerMove[]>([]);
  const [explorerTotal, setExplorerTotal] = useState(0);
  const [explorerLoading, setExplorerLoading] = useState(true);
  const [dbPick, setDbPick] = useState<ExplorerMove | null>(null);
  const [dbPickApproved, setDbPickApproved] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [userMoveExplorerData, setUserMoveExplorerData] = useState<ExplorerMove | null>(null);
  const [openingName, setOpeningName] = useState<string | null>(null);
  const moveBadge = useMemo(
    () => classifyLossBadge(leak.cpLoss, leak.dbApproved, userMoveExplorerData),
    [leak.cpLoss, leak.dbApproved, userMoveExplorerData],
  );
  const dbPickMove = useMemo(
    () => (dbPick ? deriveMoveDetails(leak.fenBefore, dbPick.uci) : null),
    [dbPick, leak.fenBefore],
  );

  useEffect(() => {
    let cancelled = false;
    setExplorerLoading(true);
    fetchExplorerMoves(leak.fenBefore, leak.sideToMove).then(async (result) => {
      if (cancelled) return;
      const filteredMoves = result.moves.filter((m) => m.totalGames >= 10);
      setExplorerMoves(filteredMoves);
      setExplorerTotal(result.totalGames);
      setExplorerLoading(false);
      if (result.openingName) setOpeningName(result.openingName);

      // Check if the user's move is in the explorer with decent stats
      const userMoveInDb = filteredMoves.find(
        (m) => m.uci === leak.userMove || m.san === leak.userMove
      );
      if (userMoveInDb && userMoveInDb.totalGames >= 50) {
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
    if (freeplayMode && freeplayEvalCp !== null) return freeplayEvalCp;
    if (animEvalCp !== null) return animEvalCp;
    if (fen === leak.fenAfter) return whiteEvalAfter;
    return whiteEvalBefore;
  }, [fen, leak.fenAfter, whiteEvalAfter, whiteEvalBefore, animEvalCp, freeplayMode, freeplayEvalCp]);

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
      if (autoplayTimer.current) {
        window.clearTimeout(autoplayTimer.current);
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
    // Freeplay mode: show click-to-move highlights, last-move highlight, and check highlight
    if (freeplayMode) {
      const styles: Record<string, React.CSSProperties> = {};

      // Last-move highlights (subtle yellow tint like Lichess)
      if (fpLastMoveFrom) {
        styles[fpLastMoveFrom] = { backgroundColor: "rgba(255, 255, 0, 0.35)" };
      }
      if (fpLastMoveTo) {
        styles[fpLastMoveTo] = { backgroundColor: "rgba(255, 255, 0, 0.42)" };
      }

      // Check highlight — red radial glow on king square
      try {
        const chess = new Chess(fen);
        if (chess.isCheck()) {
          const sideInCheck = chess.turn(); // 'w' or 'b'
          const board = chess.board();
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const piece = board[r][c];
              if (piece && piece.type === "k" && piece.color === sideInCheck) {
                const file = String.fromCharCode(97 + c);
                const rank = String(8 - r);
                const kingSq = `${file}${rank}`;
                styles[kingSq] = {
                  background: "radial-gradient(circle, rgba(239, 68, 68, 0.85) 0%, rgba(239, 68, 68, 0.45) 40%, rgba(239, 68, 68, 0.15) 70%, transparent 100%)",
                };
              }
            }
          }
        }
      } catch { /* ignore */ }

      // Selection + legal move dots (drawn on top of last-move highlights)
      if (fpSelectedSq) {
        styles[fpSelectedSq] = { background: "rgba(255, 255, 0, 0.4)" };
        try {
          const chess = new Chess(fen);
          for (const sq of fpLegalMoves) {
            const hasPiece = chess.get(sq as Parameters<Chess["get"]>[0]);
            if (hasPiece) {
              styles[sq] = { background: "radial-gradient(circle, transparent 55%, rgba(0,0,0,0.25) 55%)", borderRadius: "50%" };
            } else {
              styles[sq] = { background: "radial-gradient(circle, rgba(0,0,0,0.25) 25%, transparent 25%)", borderRadius: "50%" };
            }
          }
        } catch { /* ignore */ }
      }
      return styles;
    }
    if (animating) return {};
    if (!badMove) return {};

    return {
      [badMove.from]: { backgroundColor: "rgba(239, 68, 68, 0.45)" },
      [badMove.to]: { backgroundColor: "rgba(239, 68, 68, 0.45)" }
    };
  }, [animating, badMove, freeplayMode, fpSelectedSq, fpLegalMoves, fen, fpLastMoveFrom, fpLastMoveTo]);

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

  /* ── Freeplay helpers ── */
  const classifyFreeplayBadge = (cpLoss: number): { label: string; color: string } => {
    if (cpLoss <= 10) return { label: "Best", color: "#10b981" };
    if (cpLoss <= 50) return { label: "Good", color: "#22d3ee" };
    if (cpLoss <= 100) return { label: "Inaccuracy", color: "#f97316" };
    if (cpLoss <= 200) return { label: "Mistake", color: "#f59e0b" };
    return { label: "Blunder", color: "#ef4444" };
  };

  const enterFreeplay = () => {
    if (animating) stopAnimation();
    setFreeplayMode(true);
    setFreeplayHistory([fen]);
    setFreeplayEvalCp(null);
    setFreeplayBadge(null);
    setFpSelectedSq(null);
    setFpLegalMoves([]);
    setFpLastMoveFrom(null);
    setFpLastMoveTo(null);
  };

  const exitFreeplay = () => {
    setFreeplayMode(false);
    setFreeplayEvalCp(null);
    setFreeplayHistory([]);
    setFreeplayBadge(null);
    setFpSelectedSq(null);
    setFpLegalMoves([]);
    setShowFpPromo(false);
    setFpLastMoveFrom(null);
    setFpLastMoveTo(null);
    setFen(leak.fenBefore);
    setBoardInstance((v) => v + 1);
  };

  const resetFreeplay = () => {
    setFen(leak.fenBefore);
    setFreeplayHistory([leak.fenBefore]);
    setFreeplayEvalCp(null);
    setFreeplayBadge(null);
    setFpSelectedSq(null);
    setFpLegalMoves([]);
    setShowFpPromo(false);
    setFpLastMoveFrom(null);
    setFpLastMoveTo(null);
    setBoardInstance((v) => v + 1);
  };

  const undoFreeplay = () => {
    if (freeplayHistory.length <= 1) return;
    const prev = [...freeplayHistory];
    prev.pop();
    const prevFen = prev[prev.length - 1];
    setFreeplayHistory(prev);
    setFen(prevFen);
    setFreeplayBadge(null);
    setFpSelectedSq(null);
    setFpLegalMoves([]);
    setFpLastMoveFrom(null);
    setFpLastMoveTo(null);
    // Re-evaluate the previous position
    stockfishClient.evaluateFen(prevFen, 10).then((ev) => {
      if (ev) {
        const whiteEv = prevFen.includes(" w ") ? ev.cp : -ev.cp;
        setFreeplayEvalCp(whiteEv);
      }
    }).catch(() => {});
  };

  const executeFreeplayMove = (sourceSquare: string, targetSquare: string, promotion?: string) => {
    try {
      const chess = new Chess(fen);
      const result = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: (promotion as PieceSymbol | undefined),
      });
      if (!result) return false;

      const beforeFen = fen;
      const newFen = chess.fen();
      setFen(newFen);
      setFreeplayHistory((prev) => [...prev, newFen]);
      setFpSelectedSq(null);
      setFpLegalMoves([]);
      setFpLastMoveFrom(sourceSquare);
      setFpLastMoveTo(targetSquare);

      // Sound
      if (result.san.includes("+") || result.san.includes("#")) playSound("check");
      else if (result.captured) playSound("capture");
      else playSound("move");

      // Evaluate with Stockfish
      setFreeplayEvaluating(true);
      (async () => {
        try {
          const [afterEval, beforeEval] = await Promise.all([
            stockfishClient.evaluateFen(newFen, 10),
            stockfishClient.evaluateFen(beforeFen, 10),
          ]);
          if (afterEval) {
            // Eval from white's perspective
            const whiteEvAfter = newFen.includes(" w ") ? afterEval.cp : -afterEval.cp;
            setFreeplayEvalCp(whiteEvAfter);

            // Compute cpLoss for the mover
            if (beforeEval) {
              const moverColor = beforeFen.includes(" w ") ? "w" : "b";
              const moverEvBefore = moverColor === "w" ? beforeEval.cp : -beforeEval.cp;
              const moverEvAfter = moverColor === "w" ? (-afterEval.cp) : afterEval.cp;
              const cpLoss = Math.max(0, moverEvBefore - moverEvAfter);
              const badge = classifyFreeplayBadge(cpLoss);
              setFreeplayBadge(badge);
              if (freeplayBadgeTimer.current) window.clearTimeout(freeplayBadgeTimer.current);
              freeplayBadgeTimer.current = window.setTimeout(() => setFreeplayBadge(null), 3000);
            }
          }
        } catch { /* best-effort */ }
        finally { setFreeplayEvaluating(false); }
      })();

      return true;
    } catch {
      return false;
    }
  };

  const onFreeplayDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    const promotion = piece[1]?.toLowerCase();
    return executeFreeplayMove(sourceSquare, targetSquare, promotion);
  };

  const onFreeplaySquareClick = (square: CbSquare, _piece?: unknown) => {
    if (freeplayEvaluating) {
      setFpSelectedSq(null);
      setFpLegalMoves([]);
      return;
    }
    const chess = new Chess(fen);
    const sideToMove = fen.includes(" w ") ? "w" : "b";

    // If already selected, try to move to the clicked square
    if (fpSelectedSq && fpSelectedSq !== square) {
      if (fpLegalMoves.includes(square)) {
        const piece = chess.get(fpSelectedSq as Parameters<Chess["get"]>[0]);
        if (piece?.type === "p") {
          const targetRank = parseInt(square[1]);
          const isPromo = (piece.color === "w" && targetRank === 8) || (piece.color === "b" && targetRank === 1);
          if (isPromo) {
            setFpPromoFrom(fpSelectedSq);
            setFpPromoTo(square);
            setShowFpPromo(true);
            return;
          }
        }
        const fakeColor = sideToMove === "w" ? "w" : "b";
        const fakePiece = `${fakeColor}${(piece?.type ?? "p").toUpperCase()}`;
        executeFreeplayMove(fpSelectedSq, square, fakePiece[1]?.toLowerCase());
        return;
      }
    }

    const pieceOnSquare = chess.get(square as Parameters<Chess["get"]>[0]);
    if (pieceOnSquare && pieceOnSquare.color === sideToMove) {
      setFpSelectedSq(square);
      const moves = chess.moves({ square: square as Parameters<Chess["moves"]>[0]["square"], verbose: true });
      setFpLegalMoves(moves.map(m => m.to));
    } else {
      setFpSelectedSq(null);
      setFpLegalMoves([]);
    }
  };

  const onFreeplayPromoPick = (piece?: PromotionPieceOption) => {
    setShowFpPromo(false);
    if (!piece || !fpPromoFrom || !fpPromoTo) {
      setFpSelectedSq(null);
      setFpLegalMoves([]);
      return true;
    }
    const promoChar = piece[1]?.toLowerCase() ?? "q";
    executeFreeplayMove(fpPromoFrom, fpPromoTo, promoChar);
    setFpPromoFrom(null);
    setFpPromoTo(null);
    return true;
  };

  const customSquare = useMemo(() => {
    return ((props: any) => {
      const square = props?.square as string | undefined;
      // In freeplay, show badge on destination square of last move
      if (freeplayMode && fpLastMoveTo && square === fpLastMoveTo && freeplayBadge) {
        return (
          <div style={props?.style} className="relative h-full w-full">
            {props?.children}
            <span
              className="pointer-events-none absolute right-0.5 top-0.5 z-[40] rounded px-1 py-[1px] text-[9px] font-bold text-white shadow"
              style={{ backgroundColor: freeplayBadge.color }}
            >
              {freeplayBadge.label}
            </span>
          </div>
        );
      }
      const showBadge = !freeplayMode && !animating && !!badMove && square === badMove.to;

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
  }, [animating, badMove, moveBadge.color, moveBadge.label, freeplayMode, fpLastMoveTo, freeplayBadge]);

  const moveToUci = (move: MoveDetails | null): string | null => {
    if (!move) return null;
    return `${move.from}${move.to}${move.promotion ?? ""}`;
  };

  /** Replay UCI moves from a starting FEN — returns the final FEN or null on failure */
  const computeFinalFen = (startFen: string, uciMoves: string[]): string | null => {
    try {
      const sim = new Chess(startFen);
      for (const uci of uciMoves) {
        if (!isUci(uci)) return null;
        const p = parseMove(uci);
        if (!p) return null;
        const r = sim.move({ from: p.from, to: p.to, promotion: p.promotion as PieceSymbol | undefined });
        if (!r) return null;
      }
      return sim.fen();
    } catch { return null; }
  };

  const userPerspective = leak.sideToMove === "white" ? "w" as const : "b" as const;

  const animateSequence = (startFen: string, uciMoves: string[]) => {
    clearTimers();

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

    setPvSteps(steps);
    setPvStepIndex(-1); // start at the initial position
    setFen(startFen);
    setAnimating(true);
    setAnimEvalCp(whiteEvalBefore);
    setPvAutoplay(true); // auto-start playback
  };

  /** Navigate PV to a specific step index (-1 = starting position) */
  const pvGoTo = (targetIndex: number) => {
    if (targetIndex < -1 || targetIndex >= pvSteps.length) return;
    setPvStepIndex(targetIndex);

    if (targetIndex === -1) {
      setFen(leak.fenBefore);
      setAnimEvalCp(whiteEvalBefore);
      return;
    }

    const step = pvSteps[targetIndex];
    // Replay all moves up to targetIndex on a fresh Chess to get the exact position
    const chess = new Chess(leak.fenBefore);
    for (let i = 0; i <= targetIndex; i++) {
      const s = pvSteps[i];
      const parsed = parseMove(s.uci);
      if (!parsed) break;
      const result = chess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined,
      });
      if (!result) break;
      // Play sound only for the target move
      if (i === targetIndex) {
        if (/[+#]/.test(result.san)) playSound("check");
        else if (result.captured) playSound("capture");
        else playSound("move");
      }
    }
    setFen(chess.fen());

    // Evaluate position at this step for eval bar
    stockfishClient.evaluateFen(step.fen, 8).then((evalResult) => {
      if (evalResult) {
        const turn = new Chess(step.fen).turn();
        const whiteEval = turn === "w" ? evalResult.cp : -evalResult.cp;
        setAnimEvalCp(whiteEval);
      }
    }).catch(() => {});
  };

  const pvNext = () => {
    if (pvStepIndex < pvSteps.length - 1) pvGoTo(pvStepIndex + 1);
  };
  const pvPrev = () => {
    if (pvStepIndex > -1) pvGoTo(pvStepIndex - 1);
  };
  const pvFirst = () => pvGoTo(-1);
  const pvLast = () => pvGoTo(pvSteps.length - 1);

  // Autoplay effect — step forward every 1.5s
  useEffect(() => {
    if (!pvAutoplay || !animating || pvSteps.length === 0) return;
    autoplayTimer.current = window.setTimeout(() => {
      if (pvStepIndex < pvSteps.length - 1) {
        pvGoTo(pvStepIndex + 1);
      } else {
        // Reached the end — stop autoplay
        setPvAutoplay(false);
      }
    }, 1500);
    return () => {
      if (autoplayTimer.current) window.clearTimeout(autoplayTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pvAutoplay, animating, pvStepIndex, pvSteps.length]);

  const stopAnimation = () => {
    clearTimers();
    setPvAutoplay(false);
    setPvSteps([]);
    setPvStepIndex(-1);
    setAnimating(false);
    setAnimEvalCp(null);
    setFen(leak.fenBefore);
    setBoardInstance((value) => value + 1);
  };

  const onExplainMistake = async () => {
    if (explaining || animating) return;

    setExplaining(true);
    setExplanation("");
    setRichExplanation(null);
    setActiveExplainTab("played");

    try {
      const playedUci = moveToUci(badMove);
      const bestSan = bestMove?.san ?? leak.bestMove ?? "N/A";

      if (!playedUci) {
        setExplanation("Could not parse your played move for this position.");
        return;
      }

      // Show structured coaching explanation
      setRichExplanation(coaching.played);

      const afterPlayed = new Chess(leak.fenBefore);
      const playedParsed = parseMove(playedUci);
      if (!playedParsed) return;

      const playedResult = afterPlayed.move({
        from: playedParsed.from,
        to: playedParsed.to,
        promotion: playedParsed.promotion as PieceSymbol | undefined
      });

      if (!playedResult) return;

      const line = await stockfishClient.getPrincipalVariation(afterPlayed.fen(), 10, 12);
      if (!line) return;

      const sanLine: string[] = [playedResult.san];
      const continuation = formatPrincipalVariation(afterPlayed.fen(), line.pvMoves);
      if (continuation) sanLine.push(continuation);

      // Compute the final FEN for position outlook
      const fullMistakeLine = [playedUci, ...line.pvMoves];
      const finalFen = computeFinalFen(leak.fenBefore, fullMistakeLine);
      let outlookObs: string[] = [];
      if (finalFen) {
        const finalEval = await stockfishClient.evaluateFen(finalFen, 8);
        const outlook = describeEndPosition(finalFen, userPerspective, finalEval?.cp ?? null);
        if (outlook.summary) outlookObs.push(`**Position outlook**: ${outlook.summary}`);
        outlookObs = outlookObs.concat(outlook.details.map(d => `  · ${d}`));
      }

      // Append the PV + outlook to the coaching text
      setRichExplanation(prev => prev ? {
        ...prev,
        observations: [
          ...prev.observations,
          `**Engine punishment line**: ${sanLine.join(" ")}`,
          ...outlookObs,
        ]
      } : prev);

      if (line.pvMoves.length > 0) {
        animateSequence(leak.fenBefore, fullMistakeLine);
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
    setRichExplanation(null);
    setActiveExplainTab("best");

    try {
      const bestUci = moveToUci(bestMove);
      if (!bestUci) {
        setExplanation("Could not parse the highlighted best move for this position.");
        return;
      }

      // Show structured coaching explanation
      setRichExplanation(coaching.best);

      const bestFenChess = new Chess(leak.fenBefore);
      let bestContinuationMoves: string[] = [];

      const parsed = parseMove(bestUci);
      if (!parsed) return;

      const moved = bestFenChess.move({
        from: parsed.from,
        to: parsed.to,
        promotion: parsed.promotion as PieceSymbol | undefined
      });

      if (!moved) return;

      const bestEval = await stockfishClient.evaluateFen(bestFenChess.fen(), engineDepth);
      const continuation = await stockfishClient.getPrincipalVariation(bestFenChess.fen(), 9, engineDepth);
      bestContinuationMoves = continuation?.pvMoves ?? [];

      const pvText = formatPrincipalVariation(leak.fenBefore, [bestUci, ...bestContinuationMoves]);

      // Position outlook for the best line end position
      const fullBestLine = [bestUci, ...bestContinuationMoves];
      const bestFinalFen = computeFinalFen(leak.fenBefore, fullBestLine);
      let bestOutlookObs: string[] = [];
      if (bestFinalFen) {
        const fe = await stockfishClient.evaluateFen(bestFinalFen, 8);
        const outlook = describeEndPosition(bestFinalFen, userPerspective, fe?.cp ?? null);
        if (outlook.summary) bestOutlookObs.push(`**Position outlook**: ${outlook.summary}`);
        bestOutlookObs = bestOutlookObs.concat(outlook.details.map(d => `  · ${d}`));
      }

      // Append eval, PV, and outlook to coaching observations
      const extraObs: string[] = [];
      if (bestEval) {
        extraObs.push(`**Eval after best move**: ${formatEval(-bestEval.cp, { showPlus: true })}`);
      }
      if (pvText) {
        extraObs.push(`**Engine best line**: ${pvText}`);
      }
      extraObs.push(...bestOutlookObs);
      if (extraObs.length > 0) {
        setRichExplanation(prev => prev ? {
          ...prev,
          observations: [...prev.observations, ...extraObs]
        } : prev);
      }

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
    setRichExplanation(null);
    setActiveExplainTab("db");

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

      const winPct = (dbPick.winRate * 100).toFixed(1);
      const gamesText = dbPick.totalGames >= 1_000
        ? `${(dbPick.totalGames / 1_000).toFixed(0)}K`
        : dbPick.totalGames.toLocaleString();

      // Build rich explanation for DB move
      const dbObservations: string[] = [];

      const evalResult = await stockfishClient.evaluateFen(afterDb.fen(), engineDepth);
      if (evalResult) {
        const evalAfterDb = -evalResult.cp;
        dbObservations.push(`**Eval after move**: ${formatEval(evalAfterDb, { showPlus: true })}`);
      }

      const continuation = await stockfishClient.getPrincipalVariation(afterDb.fen(), 9, engineDepth);
      const contMoves = continuation?.pvMoves ?? [];
      const pvText = formatPrincipalVariation(leak.fenBefore, [dbUci, ...contMoves]);
      if (pvText) {
        dbObservations.push(`**Likely continuation**: ${pvText}`);
      }

      // Position outlook for DB move line
      const fullDbLine = [dbUci, ...contMoves];
      const dbFinalFen = computeFinalFen(leak.fenBefore, fullDbLine);
      if (dbFinalFen) {
        const fe = await stockfishClient.evaluateFen(dbFinalFen, 8);
        const outlook = describeEndPosition(dbFinalFen, userPerspective, fe?.cp ?? null);
        if (outlook.summary) dbObservations.push(`**Position outlook**: ${outlook.summary}`);
        outlook.details.forEach(d => dbObservations.push(`  · ${d}`));
      }

      setRichExplanation({
        headline: `Database Pick · ${winPct}% win rate`,
        coaching:
          `**${dbPickMove.san}** is the most popular choice among rated players in this exact position, ` +
          `played in ${gamesText} games with a **${winPct}% win rate**. ` +
          `Unlike the engine's top pick (${bestMove?.san ?? "N/A"}), this move prioritises ` +
          `practical results — patterns that humans score well with.`,
        themes: ["Database Pick", "Practical Choice"],
        observations: dbObservations,
      });

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
      <div className="grid gap-0 md:grid-cols-[minmax(0,520px)_1fr]">
        {/* Board side */}
        <div ref={boardSizeRef} className="relative overflow-hidden border-b border-white/[0.04] bg-white/[0.01] p-3 sm:p-5 md:border-b-0 md:border-r">
          <div className="mx-auto flex w-full max-w-[460px] items-start gap-2 sm:gap-3">
            <EvalBar evalCp={displayedEvalCp} height={boardSize} />
            <div
              ref={boardContainerRef}
              className="flex-1 min-w-0"
              onPointerDown={handleBoardPointerDown}
              onPointerMove={handleBoardPointerMove}
              onPointerUp={handleBoardPointerUp}
              style={{ touchAction: "none" }}
            >
              <Chessboard
                key={`${boardId}-${boardInstance}`}
                id={boardId}
                position={fen}
                arePiecesDraggable={false}
                onSquareClick={freeplayMode ? onFreeplaySquareClick : undefined}
                onPromotionPieceSelect={freeplayMode ? onFreeplayPromoPick : undefined}
                showPromotionDialog={freeplayMode && showFpPromo}
                promotionToSquare={(freeplayMode && fpPromoTo) as CbSquare | undefined}
                customSquare={customSquare}
                customSquareStyles={customSquareStyles}
                customArrows={freeplayMode ? [] : customArrows}
                boardOrientation={boardOrientation}
                boardWidth={boardSize}
                customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                customBoardStyle={{ borderRadius: "12px", overflow: "hidden" }}
              />
            </div>
          </div>

          {/* Freeplay controls */}
          {freeplayMode && (
            <div className="mx-auto mt-2 flex w-full max-w-[460px] items-center justify-between pl-[27px]">
              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Freeplay</span>
                {freeplayEvaluating && (
                  <span className="text-[10px] text-slate-500 animate-pulse">Evaluating…</span>
                )}
                {freeplayBadge && !freeplayEvaluating && (
                  <span
                    className="animate-fade-in rounded-md px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: freeplayBadge.color }}
                  >
                    {freeplayBadge.label}
                  </span>
                )}
                {freeplayHistory.length > 1 && (
                  <span className="text-[10px] tabular-nums text-slate-500">
                    {freeplayHistory.length - 1} move{freeplayHistory.length - 1 !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Undo */}
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                  onClick={undoFreeplay}
                  disabled={freeplayHistory.length <= 1}
                  title="Undo move"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                </button>
                {/* Reset */}
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-500/[0.15] hover:text-amber-400 disabled:opacity-30"
                  onClick={resetFreeplay}
                  disabled={freeplayHistory.length <= 1}
                  title="Reset to starting position"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
                {/* Exit freeplay */}
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/[0.15] hover:text-red-400"
                  onClick={exitFreeplay}
                  title="Exit freeplay"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* Freeplay toggle (when not in freeplay) */}
          {!freeplayMode && !animating && (
            <div className="mx-auto mt-2 flex w-full max-w-[460px] pl-[27px]">
              <button
                type="button"
                className="flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 text-[11px] text-slate-400 transition-colors hover:border-emerald-500/20 hover:bg-emerald-500/[0.06] hover:text-emerald-400"
                onClick={enterFreeplay}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                Freeplay
              </button>
            </div>
          )}
        </div>

        {/* Info side */}
        <div className="space-y-5 p-5 md:p-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-white">
                {moveBadge.label === "Sideline" ? "Offbeat Sideline" : "Repeated Opening Leak"}
                {openingName && (
                  <span className="ml-1 text-sm font-medium text-slate-400"> — {openingName}</span>
                )}
              </h3>
              <span
                className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: moveBadge.color }}
              >
                {moveBadge.label}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/[0.06] px-3.5 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-lg">🔁</span>
              <p className="text-sm text-slate-300">
                You reached this position{" "}
                <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-bold text-orange-300">{leak.reachCount}×</span>{" "}
                and played{" "}
                <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 font-mono font-bold text-red-400">{badMove?.san ?? leak.userMove}</span>{" "}
                <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-bold text-orange-300">{leak.moveCount}×</span>
              </p>
            </div>
          </div>

          {/* Offbeat sideline banner — from analysis or card's explorer lookup */}
          {moveBadge.label === "Sideline" && (() => {
            const wr = leak.dbApproved && leak.dbWinRate != null ? leak.dbWinRate : userMoveExplorerData?.winRate;
            const gm = leak.dbApproved && leak.dbGames != null ? leak.dbGames : userMoveExplorerData?.totalGames;
            return wr != null && gm != null ? (
              <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] px-3.5 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-lg">
                  📚
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-400/70">
                    Known Opening Line
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Your move <span className="font-mono font-bold text-slate-300">{badMove?.san}</span> is played in{" "}
                    <span className="font-semibold text-slate-300">{gm.toLocaleString()}</span> database games
                    with a <span className="font-semibold text-indigo-400">{(wr * 100).toFixed(0)}%</span> win rate.
                    The engine prefers a different approach, but this is a well-known sideline with practical results.
                  </p>
                </div>
              </div>
            ) : null;
          })()}

          {/* Low-confidence explorer note for non-sideline inaccuracies */}
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
              <p className="mt-0.5 text-lg font-bold text-slate-200">{formatEval(whiteEvalBefore, { showPlus: true })}</p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Eval After</p>
              <p className="mt-0.5 text-lg font-bold text-slate-200">{formatEval(whiteEvalAfter, { showPlus: true })}</p>
            </div>
            <div className="stat-card py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Best Move</p>
              <p className="mt-0.5 text-lg font-bold text-emerald-400 font-mono">{bestMove?.san ?? "N/A"}</p>
            </div>
          </div>

          {/* Your win rate with this line */}
          {(() => {
            const w = leak.userWins ?? 0;
            const d = leak.userDraws ?? 0;
            const l = leak.userLosses ?? 0;
            const total = w + d + l;
            if (total === 0) return null;
            const pct = ((w + 0.5 * d) / total * 100).toFixed(0);
            const barW = total > 0 ? (w / total * 100) : 0;
            const barD = total > 0 ? (d / total * 100) : 0;
            const barL = total > 0 ? (l / total * 100) : 0;
            const pctNum = parseFloat(pct);
            const pctColor = pctNum >= 55 ? "text-emerald-400" : pctNum >= 45 ? "text-amber-400" : "text-red-400";
            return (
              <div className="stat-card px-3.5 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Your Record With This Line</p>
                  <p className={`text-sm font-bold ${pctColor}`}>{pct}%</p>
                </div>
                <div className="mt-2 flex gap-0.5 overflow-hidden rounded-full h-2">
                  {barW > 0 && <div className="bg-emerald-500" style={{ width: `${barW}%` }} />}
                  {barD > 0 && <div className="bg-slate-400" style={{ width: `${barD}%` }} />}
                  {barL > 0 && <div className="bg-red-500" style={{ width: `${barL}%` }} />}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                  <span><span className="font-semibold text-emerald-400">{w}W</span> · <span className="font-semibold text-slate-400">{d}D</span> · <span className="font-semibold text-red-400">{l}L</span></span>
                  <span>{total} game{total !== 1 ? "s" : ""}</span>
                </div>
              </div>
            );
          })()}

          {/* Lichess Opening Explorer */}
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
                    {explorerTotal > 0
                      ? `What other players chose here · ${explorerTotal.toLocaleString()} games in database`
                      : "See what other players chose in this position"}
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
                  {explorerMoves.length > 0 ? (
                  <>
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
                  </>
                  ) : explorerLoading ? (
                  <div className="px-3.5 py-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-xs text-slate-400">Loading explorer data…</p>
                    </div>
                  </div>
                  ) : (
                  <div className="px-3.5 py-4 text-center">
                    <p className="text-xs text-slate-500">
                      This position is too deep or rare for the Lichess database.
                      No games with enough occurrences found.
                    </p>
                  </div>
                  )}
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

          {/* Save to Repertoire */}
          {leak.bestMove && (
            <div className="flex items-center">
              <SaveToRepertoireButton
                fen={leak.fenBefore}
                correctMove={typeof leak.bestMove === "string" ? leak.bestMove : ""}
                userMove={leak.userMove}
                tags={leak.tags ?? []}
                sideToMove={leak.sideToMove}
                userColor={leak.userColor}
                cpLoss={leak.cpLoss}
              />
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
                {/* First */}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                  onClick={pvFirst}
                  disabled={pvStepIndex <= -1}
                  title="First"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                {/* Prev */}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                  onClick={pvPrev}
                  disabled={pvStepIndex <= -1}
                  title="Previous move"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
                </button>
                {/* Play / Pause */}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                  onClick={() => setPvAutoplay(a => !a)}
                  title={pvAutoplay ? "Pause" : "Autoplay"}
                >
                  {pvAutoplay ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                {/* Next */}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                  onClick={pvNext}
                  disabled={pvStepIndex >= pvSteps.length - 1}
                  title="Next move"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                </button>
                {/* Last */}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                  onClick={pvLast}
                  disabled={pvStepIndex >= pvSteps.length - 1}
                  title="Last"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12h2V6z"/></svg>
                </button>
                {/* Move counter */}
                <span className="px-1.5 text-[11px] tabular-nums text-slate-500">
                  {pvStepIndex + 1}/{pvSteps.length}
                </span>
                {/* Stop / Close */}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/[0.15] hover:text-red-400"
                  onClick={stopAnimation}
                  title="Stop and reset"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
          </div>

          {/* Rich coaching explanation */}
          {(richExplanation || explanation) && (
            <div className="animate-fade-in space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              {richExplanation ? (
                <>
                  {/* Tab header */}
                  <div className="flex items-center gap-2">
                    {(["played", "best", ...(dbPick && dbPickApproved ? ["db" as const] : [])] as ("played" | "best" | "db")[]).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          // Stop any existing animation/explanation before switching tabs
                          if (animating) stopAnimation();
                          setExplaining(false);
                          setActiveExplainTab(tab);
                          // Use setTimeout to let the state clear before starting new explanation
                          setTimeout(() => {
                            if (tab === "played") onExplainMistake();
                            else if (tab === "best") onExplainBestMove();
                            else if (tab === "db") onExplainDbMove();
                          }, 50);
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          activeExplainTab === tab
                            ? tab === "played"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : tab === "best"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-white/[0.04] text-slate-500 border border-transparent hover:bg-white/[0.08] hover:text-slate-400"
                        }`}
                      >
                        {tab === "played" ? `Your Move (${badMove?.san ?? leak.userMove})` : tab === "best" ? `Best Move (${bestMove?.san ?? "?"})` : `DB Move (${dbPickMove?.san ?? "?"})`}
                      </button>
                    ))}
                  </div>

                  {/* Headline badge */}
                  <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold ${
                    activeExplainTab === "played"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : activeExplainTab === "best"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {activeExplainTab === "played" ? "✗" : activeExplainTab === "best" ? "✓" : "📊"}
                    {" "}{richExplanation.headline}
                  </div>

                  {/* Coaching paragraph */}
                  <p className="text-sm leading-relaxed text-slate-300" dangerouslySetInnerHTML={{
                    __html: richExplanation.coaching
                      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                  }} />

                  {/* Theme tags */}
                  {richExplanation.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {richExplanation.themes.map((theme) => (
                        <span
                          key={theme}
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                            activeExplainTab === "played"
                              ? "border-red-500/20 bg-red-500/10 text-red-400"
                              : activeExplainTab === "best"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Detailed observations */}
                  {richExplanation.observations.length > 0 && (
                    <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Details</p>
                      {richExplanation.observations.map((obs, i) => (
                        <p
                          key={i}
                          className="flex items-start gap-2 text-xs text-slate-400"
                        >
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                          <span dangerouslySetInnerHTML={{
                            __html: obs.replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-300">$1</strong>')
                          }} />
                        </p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-300">{explanation}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
