"use client";

/**
 * Opening Sparring — play against weighted Lichess database moves.
 *
 * Flow:
 *  1. User picks their color and a target rating (e.g. 1800).
 *  2. Each opponent turn: fetch /api/sparring-move, pick a move via weighted
 *     random sampling, validate it isn't a blunder with quick Stockfish eval.
 *  3. When book runs out or after move 20, offer to continue vs. Stockfish
 *     at the appropriate depth for the target rating.
 *  4. After the session, show a motif summary of what happened.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { playSound } from "@/lib/sounds";
import { stockfishPool } from "@/lib/stockfish-client";
import { useBoardSize } from "@/lib/use-board-size";
import { explainMoves } from "@/lib/position-explainer";
import { useBoardTheme, useShowCoordinates, useCustomPieces } from "@/lib/use-coins";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Color = "white" | "black";

type MoveCandidate = {
  uci: string;
  san: string;
  games: number;
  winRate: number;
  averageRating: number;
  white: number;
  draws: number;
  black: number;
};

type SparringMoveResponse =
  | { outOfBook: true; reason?: string; totalGames?: number }
  | {
      outOfBook: false;
      candidates: MoveCandidate[];
      totalGames: number;
      targetRating: number;
    };

type MoveRecord = {
  san: string;
  uci: string;
  fenBefore: string; // FEN before the move
  fen: string;       // FEN after the move
  byUser: boolean;
  cpLoss?: number;
  /** White-relative Stockfish eval before/after the move (for coaching) */
  evalBefore?: number;
  evalAfter?: number;
  bestMoveUci?: string | null;
  bookCandidate?: MoveCandidate | null;
};

type Phase = "setup" | "playing" | "out-of-book-prompt" | "stockfish" | "gameover";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Convert a target ELO to a Stockfish search depth.
 * Rough mapping — lower depth = more mistakes.
 */
function ratingToDepth(rating: number): number {
  if (rating < 800) return 1;
  if (rating < 1000) return 2;
  if (rating < 1200) return 3;
  if (rating < 1400) return 5;
  if (rating < 1600) return 7;
  if (rating < 1800) return 9;
  if (rating < 2000) return 11;
  if (rating < 2200) return 13;
  if (rating < 2500) return 15;
  return 18;
}

/**
 * Weighted random pick from candidates.
 * Candidates with more games are proportionally more likely to be chosen.
 */
function weightedPick(candidates: MoveCandidate[]): MoveCandidate {
  const total = candidates.reduce((s, c) => s + c.games, 0);
  let rand = Math.random() * total;
  for (const c of candidates) {
    rand -= c.games;
    if (rand <= 0) return c;
  }
  return candidates[candidates.length - 1];
}

/**
 * Blunder threshold: reject a candidate if its eval drop is worse than
 * this many centipawns compared to the best engine move.
 * Scales with rating — weaker players allow slightly worse moves.
 */
function blunderThreshold(rating: number): number {
  if (rating < 1200) return 250;
  if (rating < 1600) return 180;
  if (rating < 2000) return 120;
  return 80;
}

/** Format a centipawn loss as "+X.XX" style */
function fmtCp(cp: number): string {
  return (cp / 100).toFixed(2);
}

/** Evaluate a position and return cp from sideToMove's perspective */
async function evalPosition(fen: string, depth: number): Promise<number | null> {
  const result = await stockfishPool.evaluateFen(fen, depth);
  if (!result) return null;
  // chess.js FEN encodes side to move; cp is always from white's perspective in SF
  // We flip for black since Stockfish always gives white-relative cp
  const chess = new Chess(fen);
  const sideToMove = chess.turn();
  return sideToMove === "w" ? result.cp : -result.cp;
}

/* ------------------------------------------------------------------ */
/*  Move quality system (matches Guess the Move page)                  */
/* ------------------------------------------------------------------ */

type MoveQuality = "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";

function classifyByCpLoss(cpLoss: number): MoveQuality {
  if (cpLoss <= 5) return "best";
  if (cpLoss <= 15) return "excellent";
  if (cpLoss <= 40) return "good";
  if (cpLoss <= 90) return "inaccuracy";
  if (cpLoss <= 200) return "mistake";
  return "blunder";
}

const QUALITY_EMOJI: Record<MoveQuality, string> = {
  best: "✅", excellent: "💎", good: "👍",
  inaccuracy: "⚠️", mistake: "❌", blunder: "💀",
};

const QUALITY_COLOR: Record<MoveQuality, string> = {
  best: "text-emerald-400", excellent: "text-cyan-400", good: "text-green-400",
  inaccuracy: "text-amber-400", mistake: "text-orange-400", blunder: "text-red-400",
};

const QUALITY_BG: Record<MoveQuality, string> = {
  best: "bg-emerald-500/[0.08] border-emerald-500/20",
  excellent: "bg-cyan-500/[0.08] border-cyan-500/20",
  good: "bg-green-500/[0.08] border-green-500/20",
  inaccuracy: "bg-amber-500/[0.08] border-amber-500/20",
  mistake: "bg-orange-500/[0.08] border-orange-500/20",
  blunder: "bg-red-500/[0.08] border-red-500/20",
};

const QUALITY_LABEL: Record<MoveQuality, string> = {
  best: "Best", excellent: "Excellent", good: "Good",
  inaccuracy: "Inaccuracy", mistake: "Mistake", blunder: "Blunder",
};

const QUALITY_BG_SOLID: Record<MoveQuality, string> = {
  best:       "rgba(16,185,129,0.90)",
  excellent:  "rgba(6,182,212,0.90)",
  good:       "rgba(34,197,94,0.90)",
  inaccuracy: "rgba(245,158,11,0.90)",
  mistake:    "rgba(249,115,22,0.90)",
  blunder:    "rgba(239,68,68,0.90)",
};

/** Themes that are genuinely instructive for the player (excludes metadata like phase, check, etc.) */
const COACHING_THEMES = new Set([
  "Hanging Piece", "Hangs Material", "Trapped Piece", "Weakening Move",
  "Walks Into Fork", "Walks Into Pin", "Back-Rank Mate Threat",
  "Exposed King", "Losing Exchange", "Back Rank",
  "Knight Fork", "Skewer", "Passive Retreat", "King Exposure",
  "Pin", "Discovered Attack", "X-Ray Attack",
]);

const COACHING_THEME_ICONS: Record<string, string> = {
  "Hanging Piece": "💀", "Hangs Material": "💀",
  "Trapped Piece": "🪤", "Weakening Move": "🏚️",
  "Walks Into Fork": "🍴", "Walks Into Pin": "📌",
  "Back-Rank Mate Threat": "🏰", "Back Rank": "🏰",
  "Exposed King": "🔓", "King Exposure": "👑",
  "Losing Exchange": "📉", "Passive Retreat": "🐢",
  "Knight Fork": "♞", "Skewer": "🎯",
  "Pin": "📌", "Discovered Attack": "⚡", "X-Ray Attack": "🔭",
};

/**
 * Cluster positional themes across all user moves to surface recurring patterns.
 * Uses `explainMoves` (pure chess.js, no Stockfish) — fast enough for ~30 moves.
 */
function computeSessionMotifs(
  moves: MoveRecord[],
): Array<{ name: string; count: number; avgCpLoss: number }> {
  const themeCounts = new Map<string, { count: number; totalLoss: number }>();

  for (const m of moves) {
    if (!m.byUser || (m.cpLoss ?? 0) < 30) continue;
    if (m.evalBefore === undefined || m.evalAfter === undefined) continue;
    try {
      const insight = explainMoves(
        m.fenBefore,
        m.uci,
        m.bestMoveUci ?? null,
        m.cpLoss ?? 0,
        m.evalBefore,
        m.evalAfter,
      );
      for (const theme of insight.played.themes) {
        if (!COACHING_THEMES.has(theme)) continue;
        const existing = themeCounts.get(theme);
        if (existing) {
          existing.count++;
          existing.totalLoss += m.cpLoss ?? 0;
        } else {
          themeCounts.set(theme, { count: 1, totalLoss: m.cpLoss ?? 0 });
        }
      }
    } catch { /* best-effort */ }
  }

  return [...themeCounts.entries()]
    .map(([name, v]) => ({ name, count: v.count, avgCpLoss: v.totalLoss / v.count }))
    .sort((a, b) => b.count - a.count || b.avgCpLoss - a.avgCpLoss)
    .slice(0, 6);
}

/* ------------------------------------------------------------------ */
/*  Main component                                                       */
/* ------------------------------------------------------------------ */

export default function OpeningSparring() {
  // ----- setup state -----
  const [userColor, setUserColor] = useState<Color>("white");
  const [targetRating, setTargetRating] = useState(1500);
  const [phase, setPhase] = useState<Phase>("setup");

  // ----- game state -----
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(chessRef.current.fen());
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [evalCp, setEvalCp] = useState<number | null>(null);
  const [bookMoveCount, setBookMoveCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [promotionPending, setPromotionPending] = useState<{
    from: string;
    to: string;
  } | null>(null);

  /** Quality badge for the piece on the last user move's destination square */
  const [pieceBadge, setPieceBadge] = useState<{ square: string; quality: MoveQuality } | null>(null);

  /** Coaching insight for the most recent user move */
  const [lastMoveInsight, setLastMoveInsight] = useState<{
    quality: MoveQuality;
    cpLoss: number;
    headline: string;
    coaching: string;
    themes: string[];
    bestMoveSan: string | null;
  } | null>(null);

  // board cosmetics
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();
  const customPieces = useCustomPieces();
  const { ref: containerRef, size: boardSize } = useBoardSize(520);

  /* ------------------------------------------------------------------ */
  /*  Fetch & play opponent move                                           */
  /* ------------------------------------------------------------------ */

  const playOpponentMove = useCallback(
    async (currentFen: string, chess: Chess) => {
      setIsOpponentThinking(true);
      setPieceBadge(null);
      const sideToMove: Color = chess.turn() === "w" ? "white" : "black";

      try {
        // 1. Try book move
        const res = await fetch(
          `/api/sparring-move?fen=${encodeURIComponent(currentFen)}&rating=${targetRating}&sideToMove=${sideToMove}`,
        );
        const data: SparringMoveResponse = await res.json();

        if (!data.outOfBook && data.candidates.length > 0) {
          // --- In-book phase ---
          const candidates = data.candidates;
          const totalGames = data.totalGames;
          const threshold = blunderThreshold(targetRating);

          /**
           * Protect any move that accounts for >= 12% of total games at this
           * rating. If 20% of 1500-rated players really do hang a pawn here,
           * the opponent should hang it 20% of the time — that's authentic.
           * Only filter moves that are BOTH rarely played AND a big blunder.
           */
          const PROTECT_RATIO = 0.12;

          // Single multi-PV call — one Stockfish request covers all candidates
          const engineLines = await stockfishPool.getTopMoves(
            currentFen,
            Math.min(candidates.length + 5, 20),
            8,
          );

          // Build UCI → engine cp map (cp from side-to-move's perspective)
          const engineCpMap = new Map<string, number>();
          for (const line of engineLines) {
            if (line.bestMove) engineCpMap.set(line.bestMove, line.cp);
          }
          const bestEngineCp = engineLines[0]?.cp ?? null;

          const pool: MoveCandidate[] = [];
          for (const candidate of candidates) {
            const share = candidate.games / Math.max(1, totalGames);

            // Always include heavily-played moves regardless of eval
            if (share >= PROTECT_RATIO) {
              pool.push(candidate);
              continue;
            }

            // No engine data — accept anything with at least 3% of games
            if (bestEngineCp === null) {
              if (share >= 0.03) pool.push(candidate);
              continue;
            }

            const moveCp = engineCpMap.get(candidate.uci);
            if (moveCp === undefined) {
              // Not in engine's top N — keep if it has at least 3% game share
              if (share >= 0.03) pool.push(candidate);
              continue;
            }

            // Filter only if it's a big blunder AND rarely played
            const cpLoss = bestEngineCp - moveCp;
            if (cpLoss <= threshold) pool.push(candidate);
          }

          // Always have something to pick from
          const finalPool = pool.length > 0 ? pool : candidates.slice(0, 3);
          const chosen = weightedPick(finalPool);

          // Play the move
          const move = chess.move(chosen.uci, { strict: false });
          if (!move) {
            // Shouldn't happen but fall back to Stockfish
            setPhase("out-of-book-prompt");
            setIsOpponentThinking(false);
            return;
          }

          const newFen = chess.fen();
          setFen(newFen);
          setLastMove({ from: move.from, to: move.to });
          setBookMoveCount((n) => n + 1);
          setStatusMessage(
            `Opponent played ${move.san} (${chosen.games.toLocaleString()} games, ${Math.round(chosen.winRate * 100)}% win rate)`,
          );
          setMoveHistory((prev) => [
            ...prev,
            {
              san: move.san,
              uci: chosen.uci,
              fenBefore: currentFen,
              fen: newFen,
              byUser: false,
              bookCandidate: chosen,
            },
          ]);

          playSound(move.captured ? "capture" : "move");

          // Quick async eval update for eval bar
          evalPosition(newFen, 10).then((cp) => {
            if (cp !== null) setEvalCp(cp);
          });

          if (chess.isGameOver()) {
            setPhase("gameover");
          }
        } else {
          // --- Out of book ---
          setPhase("out-of-book-prompt");
        }
      } catch {
        setPhase("out-of-book-prompt");
      } finally {
        setIsOpponentThinking(false);
      }
    },
    [targetRating],
  );

  /* ------------------------------------------------------------------ */
  /*  Stockfish opponent move                                             */
  /* ------------------------------------------------------------------ */

  const playStockfishMove = useCallback(
    async (currentFen: string, chess: Chess) => {
      setIsOpponentThinking(true);
      setPieceBadge(null);
      const depth = ratingToDepth(targetRating);

      try {
        const result = await stockfishPool.evaluateFen(currentFen, depth);
        if (!result?.bestMove) {
          setPhase("gameover");
          return;
        }

        const move = chess.move(result.bestMove, { strict: false });
        if (!move) {
          setPhase("gameover");
          return;
        }

        const newFen = chess.fen();
        setFen(newFen);
        setLastMove({ from: move.from, to: move.to });
        setStatusMessage(`Stockfish (depth ${depth}) played ${move.san}`);
        setMoveHistory((prev) => [
          ...prev,
          {
            san: move.san,
            uci: result.bestMove!,
            fenBefore: currentFen,
            fen: newFen,
            byUser: false,
            bookCandidate: null,
          },
        ]);

        playSound(move.captured ? "capture" : "move");
        setEvalCp(null); // will update asynchronously

        evalPosition(newFen, 10).then((cp) => {
          if (cp !== null) setEvalCp(cp);
        });

        if (chess.isGameOver()) setPhase("gameover");
      } finally {
        setIsOpponentThinking(false);
      }
    },
    [targetRating],
  );

  /* ------------------------------------------------------------------ */
  /*  Handle opponent turn                                                */
  /* ------------------------------------------------------------------ */

  const triggerOpponentTurn = useCallback(
    (currentFen: string, chess: Chess, currentPhase: Phase) => {
      if (currentPhase === "playing") {
        playOpponentMove(currentFen, chess);
      } else if (currentPhase === "stockfish") {
        playStockfishMove(currentFen, chess);
      }
    },
    [playOpponentMove, playStockfishMove],
  );

  /* ------------------------------------------------------------------ */
  /*  Handle user move                                                    */
  /* ------------------------------------------------------------------ */

  const handleUserMove = useCallback(
    async (from: string, to: string, promotion?: string) => {
      const chess = chessRef.current;
      if (chess.turn() !== (userColor === "white" ? "w" : "b")) return;
      if (phase !== "playing" && phase !== "stockfish") return;

      // Capture FEN before the move for eval comparison
      const prevFen = chess.fen();

      const uci = `${from}${to}${promotion ?? ""}`;

      // Try the move
      let move;
      try {
        move = chess.move({ from, to, promotion: promotion ?? "q" });
      } catch {
        return;
      }
      if (!move) return;

      setSelectedSquare(null);
      setLegalMoves([]);

      const newFen = chess.fen();
      setFen(newFen);
      setLastMove({ from: move.from, to: move.to });
      playSound(move.captured ? "capture" : "move");
      if (chess.inCheck()) playSound("check");

      // Async: eval + coaching insight (non-blocking)
      let cpLoss: number | undefined;
      let evalBefore: number | undefined;
      let evalAfter: number | undefined;
      let bestMoveUci: string | null = null;

      try {
        const [beforeResult, afterResult] = await Promise.all([
          stockfishPool.evaluateFen(prevFen, 10),
          stockfishPool.evaluateFen(newFen, 10),
        ]);

        if (beforeResult && afterResult) {
          evalBefore = beforeResult.cp;   // white-relative
          evalAfter = afterResult.cp;     // white-relative
          bestMoveUci = beforeResult.bestMove ?? null;
          const sign = userColor === "white" ? 1 : -1;
          cpLoss = Math.max(0, sign * (evalBefore - evalAfter));

          // Synchronous coaching insight (pure chess.js — no extra Stockfish calls)
          try {
            const insight = explainMoves(
              prevFen, uci, bestMoveUci, cpLoss, evalBefore, evalAfter,
            );
            const quality = classifyByCpLoss(cpLoss);
            const coachingThemes = insight.played.themes.filter(t => COACHING_THEMES.has(t));

            let bestMoveSan: string | null = null;
            if (bestMoveUci && cpLoss >= 40) {
              try {
                const tmp = new Chess(prevFen);
                const r = tmp.move(bestMoveUci, { strict: false });
                bestMoveSan = r?.san ?? null;
              } catch { /* ignore */ }
            }

            setLastMoveInsight({
              quality,
              cpLoss,
              headline: insight.played.headline,
              coaching: cpLoss >= 50
                ? (insight.played.takeaway ?? insight.played.coaching.split(". ")[0] + ".")
                : "",
              themes: coachingThemes,
              bestMoveSan,
            });
          } catch { /* not critical */ }
          // Set quality badge regardless of whether coaching insight succeeded
          setPieceBadge({ square: move.to, quality: classifyByCpLoss(cpLoss) });
        }
      } catch {
        // Not critical
      }

      setMoveHistory((prev) => [
        ...prev,
        {
          san: move.san,
          uci,
          fenBefore: prevFen,
          fen: newFen,
          byUser: true,
          cpLoss,
          evalBefore,
          evalAfter,
          bestMoveUci,
        },
      ]);

      if (chess.isGameOver()) {
        setPhase("gameover");
        return;
      }

      setStatusMessage("Opponent is thinking…");
      triggerOpponentTurn(newFen, chess, phase);
    },
    [phase, userColor, moveHistory, triggerOpponentTurn],
  );

  /* ------------------------------------------------------------------ */
  /*  Board interaction                                                   */
  /* ------------------------------------------------------------------ */

  const handleSquareClick = useCallback(
    (square: string) => {
      const chess = chessRef.current;
      if (chess.turn() !== (userColor === "white" ? "w" : "b")) return;
      if (phase !== "playing" && phase !== "stockfish") return;
      if (isOpponentThinking) return;

      if (selectedSquare) {
        if (legalMoves.includes(square)) {
          // Check for pawn promotion
          const piece = chess.get(selectedSquare as any);
          const isPromotion =
            piece?.type === "p" &&
            ((userColor === "white" && square[1] === "8") ||
              (userColor === "black" && square[1] === "1"));

          if (isPromotion) {
            setPromotionPending({ from: selectedSquare, to: square });
            return;
          }
          handleUserMove(selectedSquare, square);
        } else if (square === selectedSquare) {
          setSelectedSquare(null);
          setLegalMoves([]);
        } else {
          // Maybe clicking own piece
          const piece = chess.get(square as any);
          const myColor = userColor === "white" ? "w" : "b";
          if (piece && piece.color === myColor) {
            setSelectedSquare(square);
            const moves = chess.moves({ square: square as any, verbose: true });
            setLegalMoves(moves.map((m) => m.to));
          } else {
            setSelectedSquare(null);
            setLegalMoves([]);
          }
        }
      } else {
        const piece = chess.get(square as any);
        const myColor = userColor === "white" ? "w" : "b";
        if (piece && piece.color === myColor) {
          setSelectedSquare(square);
          const moves = chess.moves({ square: square as any, verbose: true });
          setLegalMoves(moves.map((m) => m.to));
        }
      }
    },
    [selectedSquare, legalMoves, phase, userColor, isOpponentThinking, handleUserMove],
  );

  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (isOpponentThinking) return false;
      if (phase !== "playing" && phase !== "stockfish") return false;
      const chess = chessRef.current;
      if (chess.turn() !== (userColor === "white" ? "w" : "b")) return false;

      const piece = chess.get(sourceSquare as any);
      const isPromotion =
        piece?.type === "p" &&
        ((userColor === "white" && targetSquare[1] === "8") ||
          (userColor === "black" && targetSquare[1] === "1"));

      if (isPromotion) {
        // Default queen promotion on drag
        handleUserMove(sourceSquare, targetSquare, "q");
        return true;
      }

      const prevFen = chess.fen();
      handleUserMove(sourceSquare, targetSquare);
      return chess.fen() !== prevFen;
    },
    [phase, userColor, isOpponentThinking, handleUserMove],
  );

  /* ------------------------------------------------------------------ */
  /*  Start game                                                          */
  /* ------------------------------------------------------------------ */

  const startGame = useCallback(() => {
    const chess = new Chess();
    chessRef.current = chess;
    setFen(chess.fen());
    setMoveHistory([]);
    setLastMove(null);
    setEvalCp(0);
    setBookMoveCount(0);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMoveInsight(null);
    setPieceBadge(null);
    setStatusMessage("Game started — your move!");
    setPhase("playing");

    // If user plays black, opponent goes first
    if (userColor === "black") {
      setStatusMessage("Opponent is thinking…");
      setTimeout(() => {
        playOpponentMove(chess.fen(), chess);
      }, 300);
    }
  }, [userColor, playOpponentMove]);

  /* ------------------------------------------------------------------ */
  /*  Continue with Stockfish                                             */
  /* ------------------------------------------------------------------ */

  const continueWithStockfish = useCallback(() => {
    setPhase("stockfish");
    setStatusMessage(`Continuing with Stockfish (depth ${ratingToDepth(targetRating)})…`);
    const chess = chessRef.current;
    // If it's the opponent's turn, trigger immediately
    const opponentTurn = chess.turn() !== (userColor === "white" ? "w" : "b");
    if (opponentTurn) {
      playStockfishMove(chess.fen(), chess);
    }
  }, [targetRating, userColor, playStockfishMove]);

  /* ------------------------------------------------------------------ */
  /*  Square highlights                                                  */
  /* ------------------------------------------------------------------ */

  const customSquareStyles: Record<string, React.CSSProperties> = {};

  if (lastMove) {
    customSquareStyles[lastMove.from] = { background: "rgba(255, 197, 0, 0.25)" };
    customSquareStyles[lastMove.to] = { background: "rgba(255, 197, 0, 0.45)" };
  }
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = { background: "rgba(97, 170, 240, 0.55)" };
  }
  for (const sq of legalMoves) {
    customSquareStyles[sq] = {
      background:
        chessRef.current.get(sq as any)
          ? "radial-gradient(circle, rgba(255,0,0,0.35) 60%, transparent 65%)"
          : "radial-gradient(circle, rgba(0,0,0,0.2) 30%, transparent 35%)",
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Eval bar value (white-relative)                                    */
  /* ------------------------------------------------------------------ */

  // evalCp is stored from sideToMove's perspective — convert to white-relative
  const evalBarCp = (() => {
    if (evalCp === null) return 0;
    const turn = chessRef.current.turn();
    return turn === "w" ? evalCp : -evalCp;
  })();

  // Pixel position of the quality badge overlay (top-right corner of dest square)
  const badgeOverlayStyle = useMemo((): React.CSSProperties | null => {
    if (!pieceBadge) return null;
    const sq = pieceBadge.square;
    const file = sq.charCodeAt(0) - 97; // 0 = a-file, 7 = h-file
    const rank = parseInt(sq[1]) - 1;   // 0 = rank 1, 7 = rank 8
    const squarePx = boardSize / 8;
    const col = userColor === "white" ? file : 7 - file;
    const row = userColor === "white" ? 7 - rank : rank;
    return {
      position: "absolute",
      left: (col + 1) * squarePx - 10,
      top: row * squarePx - 10,
      backgroundColor: QUALITY_BG_SOLID[pieceBadge.quality],
      zIndex: 50,
      pointerEvents: "none",
    };
  }, [pieceBadge, boardSize, userColor]);

  /* ------------------------------------------------------------------ */
  /*  Session summary                                                    */
  /* ------------------------------------------------------------------ */

  const userMoves = moveHistory.filter((m) => m.byUser);
  const avgCpLoss =
    userMoves.length > 0 && userMoves.some((m) => m.cpLoss !== undefined)
      ? Math.round(
          userMoves.reduce((s, m) => s + (m.cpLoss ?? 0), 0) /
            userMoves.filter((m) => m.cpLoss !== undefined).length,
        )
      : null;

  /* ------------------------------------------------------------------ */
  /*  Render: Setup                                                      */
  /* ------------------------------------------------------------------ */

  if (phase === "setup") {
    return (
      <div className="flex flex-col items-center gap-8 py-10 px-4">
        <div className="text-center max-w-lg">
          <h1 className="text-3xl font-bold text-white mb-2">Opening Sparring</h1>
          <p className="text-zinc-400 text-sm">
            Play against real moves from millions of Lichess games. The opponent
            picks moves weighted by how often they&apos;re played at your target
            rating, filtered to avoid outright blunders. When the opening book
            runs out, you can continue against Stockfish at equivalent strength.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-6">
          {/* Color */}
          <div>
            <label className="text-zinc-300 text-sm font-medium mb-2 block">
              Play as
            </label>
            <div className="flex gap-3">
              {(["white", "black"] as Color[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setUserColor(c)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    userColor === c
                      ? "border-blue-500 bg-blue-500/20 text-blue-300"
                      : "border-zinc-600 bg-zinc-800 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {c === "white" ? "♙ White" : "♟ Black"}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-zinc-300 text-sm font-medium mb-1 block">
              Opponent rating: <span className="text-white font-bold">{targetRating}</span>
            </label>
            <input
              type="range"
              min={600}
              max={2800}
              step={50}
              value={targetRating}
              onChange={(e) => setTargetRating(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>600</span>
              <span>1200</span>
              <span>1600</span>
              <span>2000</span>
              <span>2800</span>
            </div>
            <p className="text-zinc-500 text-xs mt-2">
              Book phase uses Lichess games near this rating. Stockfish phase uses
              depth {ratingToDepth(targetRating)}.
            </p>
          </div>

          <button
            onClick={startGame}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            Start Sparring
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Out-of-book prompt                                          */
  /* ------------------------------------------------------------------ */

  if (phase === "out-of-book-prompt") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-4 text-center">
        <div className="text-4xl">📖</div>
        <h2 className="text-2xl font-bold text-white">Opening book exhausted</h2>
        <p className="text-zinc-400 max-w-sm text-sm">
          After {bookMoveCount} book moves, this position has too few Lichess games
          at the {targetRating} level to sample reliably. Continue with Stockfish
          at equivalent strength (depth {ratingToDepth(targetRating)})?
        </p>
        <div className="flex gap-3">
          <button
            onClick={continueWithStockfish}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            Continue with Stockfish
          </button>
          <button
            onClick={() => setPhase("gameover")}
            className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-semibold rounded-xl transition-colors"
          >
            End Session
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Game Over summary                                           */
  /* ------------------------------------------------------------------ */

  if (phase === "gameover") {
    const chess = chessRef.current;
    let result = "Game over";
    if (chess.isCheckmate()) {
      result = chess.turn() === (userColor === "white" ? "w" : "b") ? "You lost on time / checkmate" : "You won by checkmate!";
    } else if (chess.isDraw()) {
      result = "Draw";
    }

    return (
      <div className="flex flex-col items-center gap-6 py-10 px-4">
        <h2 className="text-2xl font-bold text-white">{result}</h2>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-full max-w-md">
          <h3 className="text-zinc-300 font-semibold mb-3">Session Summary</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{moveHistory.length}</div>
              <div className="text-xs text-zinc-500 mt-1">Total moves</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{bookMoveCount}</div>
              <div className="text-xs text-zinc-500 mt-1">Book moves</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {avgCpLoss !== null ? fmtCp(avgCpLoss) : "—"}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Avg loss</div>
            </div>
          </div>

          {/* Move quality distribution */}
          {(() => {
            const counts = { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 } as Record<MoveQuality, number>;
            const evaled = userMoves.filter(m => m.cpLoss !== undefined);
            for (const m of evaled) counts[classifyByCpLoss(m.cpLoss!)]++;
            if (evaled.length === 0) return null;
            const entries = (["best", "excellent", "good", "inaccuracy", "mistake", "blunder"] as MoveQuality[]).filter(k => counts[k] > 0);
            return (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 mb-2">Move quality</div>
                <div className="flex gap-1">
                  {entries.map(k => (
                    <div key={k} className={`flex-1 rounded-lg px-1 py-2 text-center border ${QUALITY_BG[k]}`}>
                      <div className={`text-base font-bold leading-none ${QUALITY_COLOR[k]}`}>{counts[k]}</div>
                      <div className="text-zinc-500 text-[9px] mt-1 leading-none truncate">{QUALITY_LABEL[k]}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Positional motifs detected during the session */}
          {(() => {
            const motifs = computeSessionMotifs(moveHistory);
            if (motifs.length === 0) return null;
            return (
              <div className="mt-4">
                <div className="text-xs text-zinc-400 font-medium mb-2">Recurring patterns in your play</div>
                <div className="flex flex-col gap-1.5">
                  {motifs.map(m => (
                    <div key={m.name} className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-2">
                      <span className="text-base">{COACHING_THEME_ICONS[m.name] ?? "🔍"}</span>
                      <span className="text-sm text-zinc-300 flex-1">{m.name}</span>
                      <span className="text-xs text-zinc-500">{m.count}×</span>
                      <span className="text-xs text-orange-400 ml-1">&minus;{fmtCp(m.avgCpLoss)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Move list */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {moveHistory.map((m, i) => {
              const moveNum = Math.floor(i / 2) + 1;
              const isWhiteMove = i % 2 === 0;
              const quality = m.cpLoss !== undefined ? classifyByCpLoss(m.cpLoss) : null;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1 rounded text-sm"
                >
                  {isWhiteMove && (
                    <span className="text-zinc-500 w-6 text-right shrink-0">{moveNum}.</span>
                  )}
                  <span className={`font-mono ${m.byUser ? "text-white" : "text-zinc-400"}`}>
                    {m.san}
                  </span>
                  {m.byUser && quality && (
                    <span className={`text-xs ml-auto ${QUALITY_COLOR[quality]}`}>
                      {QUALITY_EMOJI[quality]} {QUALITY_LABEL[quality]}
                      {m.cpLoss !== undefined && ` −${fmtCp(m.cpLoss)}`}
                    </span>
                  )}
                  {!m.byUser && m.bookCandidate && (
                    <span className="text-xs text-zinc-600 ml-auto">
                      {m.bookCandidate.games.toLocaleString()} games
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPhase("setup")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            New Game
          </button>
          <button
            onClick={startGame}
            className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-semibold rounded-xl transition-colors"
          >
            Rematch
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Playing / Stockfish                                        */
  /* ------------------------------------------------------------------ */

  const isUserTurn =
    !isOpponentThinking &&
    chessRef.current.turn() === (userColor === "white" ? "w" : "b") &&
    !chessRef.current.isGameOver();

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-3 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-[540px]">
        <div>
          <h1 className="text-xl font-bold text-white">Opening Sparring</h1>
          <p className="text-xs text-zinc-500">
            vs {targetRating} •{" "}
            {phase === "stockfish" ? (
              <span className="text-amber-400">Stockfish depth {ratingToDepth(targetRating)}</span>
            ) : (
              <span className="text-blue-400">Lichess Book ({bookMoveCount} moves)</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setPhase("gameover")}
          className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded-lg px-3 py-1.5 transition-colors"
        >
          ✕ End
        </button>
      </div>

      {/* Opponent indicator */}
      <div className="flex items-center gap-2 w-full max-w-[540px]">
        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-sm">
          {userColor === "white" ? "♟" : "♙"}
        </div>
        <span className="text-sm text-zinc-400">
          Opponent ({targetRating}
          {phase === "stockfish" ? " · SF" : " · Lichess DB"})
        </span>
        {isOpponentThinking && (
          <span className="text-xs text-blue-400 animate-pulse ml-1">thinking…</span>
        )}
      </div>

      {/* Board + eval bar — ref here so useBoardSize measures this container */}
      <div ref={containerRef} className="relative mx-auto flex w-full max-w-[540px] shrink-0 items-start gap-2 sm:gap-3">
        <EvalBar
          evalCp={evalBarCp}
          height={boardSize}
        />
        <div className="relative shrink-0" style={{ width: boardSize, height: boardSize }}>
          <Chessboard
            position={fen}
            boardOrientation={userColor}
            boardWidth={boardSize}
            onPieceDrop={handlePieceDrop}
            onSquareClick={handleSquareClick}
            customSquareStyles={customSquareStyles}
            customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
            customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
            customPieces={customPieces}
            showBoardNotation={showCoords}
          />
          {pieceBadge && badgeOverlayStyle && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] shadow-lg"
              style={badgeOverlayStyle}
            >
              {QUALITY_EMOJI[pieceBadge.quality]}
            </span>
          )}
        </div>
      </div>

      {/* User indicator */}
      <div className="flex items-center gap-2 w-full max-w-[540px]">
        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-sm">
          {userColor === "white" ? "♙" : "♟"}
        </div>
        <span className="text-sm text-zinc-300 font-medium">You</span>
        {isUserTurn && (
          <span className="text-xs text-green-400 ml-1">your turn</span>
        )}
      </div>

      {/* Last-move coaching insight */}
      {lastMoveInsight && (
        <div className={`w-full max-w-[540px] border rounded-xl p-3 ${QUALITY_BG[lastMoveInsight.quality]}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{QUALITY_EMOJI[lastMoveInsight.quality]}</span>
            <span className={`text-sm font-semibold ${QUALITY_COLOR[lastMoveInsight.quality]}`}>
              {QUALITY_LABEL[lastMoveInsight.quality]}
            </span>
            {lastMoveInsight.cpLoss > 0 && (
              <span className="text-xs text-zinc-500">
                &minus;{fmtCp(lastMoveInsight.cpLoss)}
              </span>
            )}
            {lastMoveInsight.bestMoveSan && (
              <span className="text-xs text-zinc-500 ml-auto">
                Best: <span className="text-zinc-300 font-mono">{lastMoveInsight.bestMoveSan}</span>
              </span>
            )}
          </div>
          {lastMoveInsight.headline && (
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              {lastMoveInsight.headline}
            </p>
          )}
          {lastMoveInsight.coaching && (
            <p className="text-xs text-zinc-500 mt-1 italic leading-relaxed">
              {lastMoveInsight.coaching}
            </p>
          )}
          {lastMoveInsight.themes.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {lastMoveInsight.themes.slice(0, 3).map(t => (
                <span
                  key={t}
                  className="text-[10px] bg-zinc-800/80 text-zinc-400 rounded-full px-2 py-0.5"
                >
                  {COACHING_THEME_ICONS[t] ? `${COACHING_THEME_ICONS[t]} ` : ""}{t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status bar */}
      {statusMessage && (
        <div className="w-full max-w-[540px] text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
          {statusMessage}
        </div>
      )}

      {/* Move list */}
      {moveHistory.length > 0 && (
        <div className="w-full max-w-[540px] bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <div className="flex gap-1 flex-wrap">
            {moveHistory.slice(-12).map((m, i) => {
              const absIdx = moveHistory.length - Math.min(12, moveHistory.length) + i;
              const moveNum = Math.floor(absIdx / 2) + 1;
              const isWhite = absIdx % 2 === 0;
              return (
                <span key={absIdx} className="inline-flex items-baseline gap-0.5 text-xs font-mono">
                  {isWhite && (
                    <span className="text-zinc-600 mr-0.5">{moveNum}.</span>
                  )}
                  <span className={m.byUser ? "text-white" : "text-zinc-400"}>
                    {m.san}
                  </span>
                  {m.byUser && m.cpLoss !== undefined && (
                    <span className={`text-[9px] ${QUALITY_COLOR[classifyByCpLoss(m.cpLoss)]}`}>
                      {QUALITY_EMOJI[classifyByCpLoss(m.cpLoss)]}
                    </span>
                  )}{" "}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
