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

/** Compute per-step board annotations during PV animation. */
function computeStepAnnotations(
  fenBefore: string,
  fenAfterMove: string,
  moveFrom: string,
  moveTo: string,
  san: string,
  isGoodSide: boolean,
  captured: string | undefined,
  tacticTags: string[],
): {
  arrows: [BoardSquare, BoardSquare, string?][];
  highlights: Record<string, { backgroundColor?: string; boxShadow?: string }>;
  badges: Record<string, { label: string; color: string }>;
} {
  const moveColor = isGoodSide
    ? "rgba(34, 197, 94, 0.9)"
    : "rgba(239, 68, 68, 0.85)";
  const moveBg = isGoodSide
    ? "rgba(34, 197, 94, 0.25)"
    : "rgba(239, 68, 68, 0.18)";

  const arrows: [BoardSquare, BoardSquare, string?][] = [];
  const highlights: Record<string, { backgroundColor?: string; boxShadow?: string }> = {};
  const badges: Record<string, { label: string; color: string }> = {};

  if (isBoardSquare(moveFrom) && isBoardSquare(moveTo)) {
    arrows.push([moveFrom, moveTo, moveColor]);
  }
  highlights[moveFrom] = { backgroundColor: moveBg };
  highlights[moveTo] = { backgroundColor: moveBg };

  const tagSet = new Set(tacticTags);

  try {
    const chess = new Chess(fenAfterMove);
    const piece = chess.get(moveTo as Parameters<Chess["get"]>[0]);
    const movedType = piece?.type;
    const movedColor = piece?.color;
    const oppColor = movedColor === "w" ? "b" : "w";
    const PV: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

    // ── Check / Checkmate ──
    if (chess.isCheckmate()) {
      for (const row of chess.board()) {
        for (const sq of row) {
          if (sq && sq.type === "k" && sq.color === chess.turn()) {
            highlights[sq.square] = {
              backgroundColor: "rgba(239, 68, 68, 0.6)",
              boxShadow: "inset 0 0 14px rgba(239, 68, 68, 0.8)",
            };
            badges[sq.square] = { label: "Checkmate!", color: "#dc2626" };
          }
        }
      }
    } else if (chess.isCheck()) {
      for (const row of chess.board()) {
        for (const sq of row) {
          if (sq && sq.type === "k" && sq.color === chess.turn()) {
            highlights[sq.square] = {
              backgroundColor: "rgba(239, 68, 68, 0.5)",
              boxShadow: "inset 0 0 12px rgba(239, 68, 68, 0.6)",
            };
            badges[sq.square] = { label: "Check!", color: "#dc2626" };
          }
        }
      }
    }

    // ── Threats from the moved piece (fork / attack detection) ──
    if (piece) {
      const parts = fenAfterMove.split(" ");
      if (parts[1] !== piece.color) {
        parts[1] = piece.color;
        try {
          const flipped = new Chess(parts.join(" "));
          const moves = flipped.moves({ verbose: true, square: moveTo as any });
          const attacks = moves
            .filter((m) => m.captured && m.from === moveTo)
            .map((m) => ({ sq: m.to, val: PV[m.captured!] ?? 0, piece: m.captured! }))
            .filter((a) => a.val >= 3);

          if (attacks.length >= 2) {
            // Fork
            const label = movedType === "n" ? "Knight Fork!"
              : movedType === "q" ? "Queen Fork!"
              : movedType === "p" ? "Pawn Fork!"
              : "Fork!";
            badges[moveTo] = { label, color: "#f59e0b" };
            for (const a of attacks) {
              highlights[a.sq] = {
                backgroundColor: "rgba(245, 158, 11, 0.4)",
                boxShadow: "inset 0 0 8px rgba(245, 158, 11, 0.5)",
              };
              if (isBoardSquare(moveTo) && isBoardSquare(a.sq)) {
                arrows.push([moveTo as BoardSquare, a.sq as BoardSquare, "rgba(245, 158, 11, 0.7)"]);
              }
            }
          } else if (attacks.length === 1 && attacks[0].val >= 5) {
            highlights[attacks[0].sq] = { backgroundColor: "rgba(245, 158, 11, 0.35)" };
            if (isBoardSquare(moveTo) && isBoardSquare(attacks[0].sq)) {
              arrows.push([
                moveTo as BoardSquare,
                attacks[0].sq as BoardSquare,
                "rgba(245, 158, 11, 0.6)",
              ]);
            }
          }
        } catch { /* skip */ }
      }
    }

    // ── Discovered Attack — highlight the unmasked line ──
    if ((tagSet.has("Discovered Attack") || (chess.isCheck() && movedType !== "n" && movedType !== "q")) && piece) {
      // find sliders of the mover's color that now attack opponent pieces through the vacated square
      try {
        const parts2 = fenAfterMove.split(" ");
        parts2[1] = movedColor!;
        const flipped2 = new Chess(parts2.join(" "));
        for (const row of chess.board()) {
          for (const sq of row) {
            if (sq && sq.color === movedColor && (sq.type === "b" || sq.type === "r" || sq.type === "q") && sq.square !== moveTo) {
              const sliderMoves = flipped2.moves({ verbose: true, square: sq.square as any });
              const hitsOpp = sliderMoves.filter(m => m.captured && m.from === sq.square);
              for (const hit of hitsOpp) {
                const targetPiece = chess.get(hit.to as any);
                if (targetPiece && targetPiece.color === oppColor && PV[targetPiece.type] >= 3) {
                  if (!badges[sq.square]) badges[sq.square] = { label: "Discovery!", color: "#a855f7" };
                  highlights[hit.to] = {
                    backgroundColor: "rgba(168, 85, 247, 0.35)",
                    boxShadow: "inset 0 0 8px rgba(168, 85, 247, 0.4)",
                  };
                  if (isBoardSquare(sq.square) && isBoardSquare(hit.to)) {
                    arrows.push([sq.square as BoardSquare, hit.to as BoardSquare, "rgba(168, 85, 247, 0.7)"]);
                  }
                }
              }
            }
          }
        }
      } catch { /* skip */ }
    }

    // ── Pin detection — highlight pinned piece ──
    if (tagSet.has("Pin") || tagSet.has("Tactical Pattern")) {
      try {
        // A pinned piece can't move (or limited moves). Check opponent pieces that have fewer legal moves
        const oppMoves = chess.moves({ verbose: true });
        // Find opponent pieces with 0 legal moves from their square (they might be pinned)
        const pieceSqs = new Map<string, number>();
        for (const m of oppMoves) pieceSqs.set(m.from, (pieceSqs.get(m.from) ?? 0) + 1);
        // Look for pieces on the line between a slider and king — simplified via tag hint
      } catch { /* skip */ }
    }

    // ── Skewer — tag-based highlight ──
    if (tagSet.has("Skewer") && piece && (movedType === "r" || movedType === "b" || movedType === "q")) {
      if (!badges[moveTo]) badges[moveTo] = { label: "Skewer!", color: "#ec4899" };
    }

    // ── Sacrifice ──
    if (tagSet.has("Sacrifice")) {
      try {
        const beforeChess = new Chess(fenBefore);
        const sacrificePiece = beforeChess.get(moveFrom as any);
        if (sacrificePiece && captured) {
          if (PV[sacrificePiece.type] > PV[captured] + 1) {
            badges[moveTo] = { label: "Sacrifice!", color: "#8b5cf6" };
            highlights[moveTo] = {
              backgroundColor: "rgba(139, 92, 246, 0.35)",
              boxShadow: "inset 0 0 10px rgba(139, 92, 246, 0.5)",
            };
          }
        }
      } catch { /* skip */ }
    }

    // ── Hanging Piece — highlight the piece left hanging ──
    if (tagSet.has("Hanging Piece") && isGoodSide) {
      // The moved piece may now be undefended — highlight it
      highlights[moveTo] = {
        backgroundColor: "rgba(239, 68, 68, 0.35)",
        boxShadow: "inset 0 0 8px rgba(239, 68, 68, 0.4)",
      };
      if (!badges[moveTo]) badges[moveTo] = { label: "Hanging!", color: "#ef4444" };
    }

    // ── En Passant ──
    if (movedType === "p" && san.includes("x") && !captured) {
      // En passant capture — the captured pawn was on a different square
      const epSquare = moveTo[0] + moveFrom[1]; // captured pawn's square
      if (isBoardSquare(epSquare)) {
        highlights[epSquare] = {
          backgroundColor: "rgba(245, 158, 11, 0.4)",
          boxShadow: "inset 0 0 8px rgba(245, 158, 11, 0.4)",
        };
        badges[epSquare] = { label: "e.p.", color: "#f59e0b" };
      }
    }
    if (tagSet.has("En Passant") && !Object.values(badges).some(b => b.label === "e.p.")) {
      if (!badges[moveTo]) badges[moveTo] = { label: "En Passant", color: "#f59e0b" };
    }

    // ── Promotion ──
    if (san.includes("=") || tagSet.has("Promotion") || tagSet.has("Underpromotion")) {
      const promoMatch = san.match(/=([QRBN])/);
      if (promoMatch) {
        const promoLabel = tagSet.has("Underpromotion") ? `Underpromotes!` : `Promotes!`;
        if (!badges[moveTo]) badges[moveTo] = { label: promoLabel, color: "#22c55e" };
        highlights[moveTo] = {
          backgroundColor: "rgba(34, 197, 94, 0.35)",
          boxShadow: "inset 0 0 10px rgba(34, 197, 94, 0.5)",
        };
      }
    }

    // ── Advanced Pawn ──
    if (tagSet.has("Advanced Pawn") && movedType === "p") {
      const rank = parseInt(moveTo[1]);
      const isAdvanced = movedColor === "w" ? rank >= 6 : rank <= 3;
      if (isAdvanced && !badges[moveTo]) {
        badges[moveTo] = { label: "Passed!", color: "#22c55e" };
      }
    }

    // ── Exposed King ──
    if (tagSet.has("Exposed King") && isGoodSide) {
      // Find the user's king and highlight — moving a shield pawn
      for (const row of chess.board()) {
        for (const sq of row) {
          if (sq && sq.type === "k" && sq.color === movedColor) {
            highlights[sq.square] = {
              backgroundColor: "rgba(239, 68, 68, 0.3)",
              boxShadow: "inset 0 0 10px rgba(239, 68, 68, 0.4)",
            };
            if (!badges[sq.square]) badges[sq.square] = { label: "Exposed!", color: "#ef4444" };
          }
        }
      }
    }

    // ── King Safety ──
    if (tagSet.has("King Safety") && !tagSet.has("Exposed King")) {
      // Generic king safety concern — subtle highlight
      for (const row of chess.board()) {
        for (const sq of row) {
          if (sq && sq.type === "k" && sq.color === (isGoodSide ? movedColor : oppColor)) {
            if (!highlights[sq.square]) {
              highlights[sq.square] = { backgroundColor: "rgba(239, 68, 68, 0.2)" };
            }
          }
        }
      }
    }

    // ── Castling ──
    if (tagSet.has("Castling") && san.startsWith("O")) {
      if (!badges[moveTo]) badges[moveTo] = { label: "Castles", color: "#3b82f6" };
    }

    // ── Center Control ──
    if (tagSet.has("Center Control") && ["d4","d5","e4","e5"].includes(moveTo)) {
      if (!badges[moveTo]) badges[moveTo] = { label: "Center!", color: "#3b82f6" };
    }

    // ── Capture badge (fallback when no other badge present) ──
    if (captured && !badges[moveTo]) {
      const sym =
        captured === "q"
          ? "♛"
          : captured === "r"
            ? "♜"
            : captured === "b"
              ? "♝"
              : captured === "n"
                ? "♞"
                : null;
      if (sym) badges[moveTo] = { label: `Wins ${sym}`, color: "#22c55e" };
    }
  } catch {
    /* best effort */
  }

  return { arrows, highlights, badges };
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
  const { ref: boardSizeRef, size: boardSize } = useBoardSize(400);
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();
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
  const [tacticCards, setTacticCards] = useState<{
    type: "winning" | "punishment";
    move: string;
    impact: string;
    evalAfter?: string;
    line?: string;
    bestMove?: string;
  } | null>(null);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [fenCopied, setFenCopied] = useState(false);
  const [boardInstance, setBoardInstance] = useState(0);
  const timerIds = useRef<number[]>([]);
  const fenCopiedTimerRef = useRef<number | null>(null);

  const isMate = isMateScore(tactic.cpBefore) || tactic.cpLoss >= MATE_THRESHOLD;
  const severityColor = isMate ? "#dc2626" : tactic.cpLoss >= 600 ? "#ef4444" : tactic.cpLoss >= 400 ? "#f59e0b" : "#f97316";
  const severityLabel = isMate ? "Missed Mate" : tactic.cpLoss >= 600 ? "Critical" : tactic.cpLoss >= 400 ? "Major" : "Missed";

  const [animEvalCp, setAnimEvalCp] = useState<number | null>(null);

  // Per-step annotations shown during PV animation
  const [animArrows, setAnimArrows] = useState<[BoardSquare, BoardSquare, string?][]>([]);
  const [animSquareStyles, setAnimSquareStyles] = useState<Record<string, { backgroundColor?: string; boxShadow?: string }>>({});
  const [animBadges, setAnimBadges] = useState<Record<string, { label: string; color: string }>>({});

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
    if (animating) return animSquareStyles;
    if (!userMoveDetails) return {};
    return {
      [userMoveDetails.from]: { backgroundColor: "rgba(245, 158, 11, 0.40)" },
      [userMoveDetails.to]: { backgroundColor: "rgba(245, 158, 11, 0.40)" }
    };
  }, [animating, animSquareStyles, userMoveDetails]);

  const customArrows = useMemo(() => {
    if (animating) return animArrows;
    const arrows: [BoardSquare, BoardSquare, string?][] = [];
    if (bestMoveDetails && isBoardSquare(bestMoveDetails.from) && isBoardSquare(bestMoveDetails.to)) {
      arrows.push([bestMoveDetails.from, bestMoveDetails.to, "rgba(34, 197, 94, 0.9)"]);
    }
    if (userMoveDetails && isBoardSquare(userMoveDetails.from) && isBoardSquare(userMoveDetails.to)) {
      arrows.push([userMoveDetails.from, userMoveDetails.to, "rgba(245, 158, 11, 0.9)"]);
    }
    return arrows;
  }, [animating, animArrows, userMoveDetails, bestMoveDetails]);

  const customSquare = useMemo(() => {
    return ((props: any) => {
      const square = props?.square as string | undefined;
      const animBadge = animating && square ? animBadges[square] : null;
      const showSeverity = !animating && !!userMoveDetails && square === userMoveDetails.to;
      const badge = animBadge ?? (showSeverity ? { label: severityLabel, color: severityColor } : null);
      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {badge ? (
            <span
              className="pointer-events-none absolute right-0.5 top-0.5 z-[40] rounded px-1 py-[1px] text-[9px] font-bold text-white shadow"
              style={{ backgroundColor: badge.color }}
            >
              {badge.label}
            </span>
          ) : null}
        </div>
      );
    }) as any;
  }, [animating, animBadges, userMoveDetails, severityColor, severityLabel]);

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
    setAnimArrows([]);
    setAnimSquareStyles({});
    setAnimBadges({});

    const userColorChar = tactic.userColor === "white" ? "w" : "b";

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
        const fenBeforeStep = chess.fen();
        const result = chess.move({
          from: parsed.from,
          to: parsed.to,
          promotion: parsed.promotion as PieceSymbol | undefined,
        });
        if (result) {
          setFen(chess.fen());

          // Compute tactical annotations for this step
          const isGoodSide = result.color === userColorChar;
          const ann = computeStepAnnotations(
            fenBeforeStep,
            chess.fen(),
            result.from,
            result.to,
            result.san,
            isGoodSide,
            result.captured,
            tactic.tags,
          );
          setAnimArrows(ann.arrows);
          setAnimSquareStyles(ann.highlights);
          setAnimBadges(ann.badges);

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
        setAnimArrows([]);
        setAnimSquareStyles({});
        setAnimBadges({});
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
    setAnimArrows([]);
    setAnimSquareStyles({});
    setAnimBadges({});
    setFen(tactic.fenBefore);
    setBoardInstance((v) => v + 1);
  };

  const onShowWinningLine = async () => {
    if (explaining || animating) return;
    setExplaining(true);
    setExplanation("");
    setTacticCards(null);
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
      let evalAfterBestStr: string | undefined;
      const bestEval = await stockfishClient.evaluateFen(bestFenChess.fen(), engineDepth);
      if (bestEval) {
        evalAfterBestStr = formatEval(bestEval.cp, { showPlus: true });
      }
      const continuation = await stockfishClient.getPrincipalVariation(bestFenChess.fen(), 9, engineDepth);
      const bestContinuationMoves = continuation?.pvMoves ?? [];
      const pvText = formatPrincipalVariation(tactic.fenBefore, [bestUci, ...bestContinuationMoves]);
      const gainText = isMate
        ? "leads to forced mate"
        : `gains about ${formatEvalLoss(tactic.cpLoss)} eval`;
      setTacticCards({
        type: "winning",
        move: bestMoveDetails?.san ?? tactic.bestMove,
        impact: gainText,
        evalAfter: evalAfterBestStr,
        line: pvText || undefined,
      });
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
    setTacticCards(null);
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
        ? "missed a forced mate"
        : `missed a ${formatEvalLoss(tactic.cpLoss)} eval gain`;
      setTacticCards({
        type: "punishment",
        move: userMoveDetails?.san ?? tactic.userMove,
        impact: missedText,
        bestMove: bestMoveDetails?.san ?? tactic.bestMove,
        line: sanLine.length ? sanLine.join(" ") : undefined,
      });
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
      <div className="grid gap-0 md:grid-cols-[minmax(0,480px)_1fr]">
        {/* Board side */}
        <div ref={boardSizeRef} className="relative overflow-hidden border-b border-amber-500/[0.08] bg-amber-500/[0.02] p-3 sm:p-5 md:border-b-0 md:border-r">
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

          {/* Coaching tip */}
          <div className="rounded-xl border border-amber-500/[0.08] bg-amber-500/[0.02] p-3">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
              <span className="mt-0.5 shrink-0 text-amber-400">💡</span>
              <span>
                {isMate
                  ? "Before every move, ask: \"Can I give check? Can I checkmate?\" Build the habit of scanning for mate patterns first."
                  : typeof tactic.timeRemainingSec === "number" && tactic.timeRemainingSec <= 30
                    ? "This tactic was missed under time pressure. Practice blitz tactics puzzles to improve your speed pattern recognition."
                    : tactic.tags.includes("Missed Capture") || tactic.tags.includes("Forcing Capture")
                      ? "Always evaluate captures before quiet moves. Ask \"What does this capture actually win?\" — count the exchange carefully."
                      : tactic.tags.includes("Knight Fork?")
                        ? "Knight forks are one of the most common tactical patterns. Look for squares where a knight attacks two or more pieces simultaneously."
                        : tactic.tags.includes("Back Rank")
                          ? "Back rank weaknesses are deadly. Always check if your back rank has an escape square — consider h3/h6 luft moves proactively."
                          : tactic.tags.includes("Pin") || tactic.tags.includes("Skewer")
                            ? "Pins and skewers exploit piece alignment along a rank, file, or diagonal. Before moving, check if any pieces are aligned with your king or queen."
                            : "Before committing to a move, apply the \"CCT\" checklist: Checks, Captures, Threats. This simple habit catches most tactics."}
              </span>
            </p>
          </div>

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
          {(tacticCards || explanation) && (
            <div className="animate-fade-in space-y-2">
              {tacticCards ? (
                <>
                  {/* Compact preview — click to open modal */}
                  <button
                    type="button"
                    onClick={() => setExplainModalOpen(true)}
                    className={`w-full text-left rounded-xl border p-3 transition-all hover:brightness-110 cursor-pointer ${
                      tacticCards.type === "winning"
                        ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                        : "border-red-500/20 bg-red-500/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-semibold ${
                        tacticCards.type === "winning" ? "text-emerald-300" : "text-red-300"
                      }`}>
                        {tacticCards.type === "winning" ? "✓ " : "✗ "}
                        <strong className="text-white">{tacticCards.move}</strong>
                        {" — "}{tacticCards.impact}
                      </p>
                      {tacticCards.evalAfter && (
                        <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-mono font-bold tabular-nums text-emerald-400">
                          {tacticCards.evalAfter}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                      Tap to see full explanation
                    </p>
                  </button>
                </>
              ) : (
                <div className="rounded-xl border border-amber-500/[0.08] bg-amber-500/[0.02] p-4 text-sm text-slate-300">
                  {explanation}
                </div>
              )}
            </div>
          )}

          {/* Explanation Modal */}
          <ExplanationModal
            open={explainModalOpen}
            onClose={() => setExplainModalOpen(false)}
            variant="tactic"
            simpleExplanation={tacticCards as SimpleExplanation | null}
            plainExplanation={explanation || undefined}
            title={tacticCards?.type === "winning"
              ? `Winning Move: ${bestMoveDetails?.san ?? tactic.bestMove}`
              : `Your Move: ${userMoveDetails?.san ?? tactic.userMove}`
            }
            subtitle={isMate ? "Missed forced mate" : `Missed ${formatEvalLoss(tactic.cpLoss)} eval gain`}
          />
        </div>
      </div>
    </article>
  );
}
