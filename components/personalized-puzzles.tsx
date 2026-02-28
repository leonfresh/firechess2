"use client";

/**
 * PersonalizedPuzzles â€” Fetches Lichess puzzles based on the user's
 * detected weaknesses from their scan (tactic tags, endgame types, motifs).
 *
 * Opens a modal with a single board that cycles through puzzles of different
 * weakness themes. Supports click-to-move with legal move indicators.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { Square as CbSquare, PromotionPieceOption } from "react-chessboard/dist/chessboard/types";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import type { MissedTactic, EndgameMistake, RepeatedOpeningLeak } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Tag â†’ Lichess theme mapping                                         */
/* ------------------------------------------------------------------ */

const TAG_TO_LICHESS: Record<string, string> = {
  // Tactic tags
  "Fork": "fork",
  "Knight Fork?": "fork",
  "Discovered Attack": "discoveredAttack",
  "Pin": "pin",
  "Skewer": "skewer",
  "Sacrifice": "sacrifice",
  "Missed Mate": "mate",
  "Missed Check": "advantage",
  "Missed Capture": "hangingPiece",
  "Back Rank": "backRankMate",
  "Hanging Piece": "hangingPiece",
  "Exposed King": "exposedKing",
  "Queen Tactic": "attraction",
  "En Passant": "enPassant",
  "Promotion": "promotion",
  "Underpromotion": "underPromotion",
  "Center Control": "middlegame",
  "King Safety": "kingsideAttack",
  "Attacking f2/f7": "attackingF2F7",
  "Advanced Pawn": "advancedPawn",
  "Tactical Pattern": "short",
  // Severity-based fallbacks
  "Winning Blunder": "crushing",
  "Major Miss": "advantage",
  "Tactical Miss": "short",
  // Phase
  "Middlegame": "middlegame",
  "Opening Development": "opening",
  // Endgame types
  "Pawn Endgame": "pawnEndgame",
  "Rook Endgame": "rookEndgame",
  "Knight Endgame": "knightEndgame",
  "Bishop Endgame": "bishopEndgame",
  "Queen Endgame": "queenEndgame",
};

const ENDGAME_TYPE_TO_LICHESS: Record<string, string> = {
  "Pawn": "pawnEndgame",
  "Rook": "rookEndgame",
  "Queen": "queenEndgame",
  "Queen + Rook": "queenRookEndgame",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function extractThemes(
  tactics: MissedTactic[],
  endgames: EndgameMistake[],
  leaks?: RepeatedOpeningLeak[]
): string[] {
  const themeCount = new Map<string, number>();

  // Count tactic tag occurrences
  for (const t of tactics) {
    for (const tag of t.tags) {
      const lichessTheme = TAG_TO_LICHESS[tag];
      if (lichessTheme) {
        themeCount.set(lichessTheme, (themeCount.get(lichessTheme) ?? 0) + 1);
      }
    }
  }

  // Count opening leak tag occurrences
  if (leaks) {
    for (const l of leaks) {
      for (const tag of l.tags ?? []) {
        const lichessTheme = TAG_TO_LICHESS[tag];
        if (lichessTheme) {
          themeCount.set(lichessTheme, (themeCount.get(lichessTheme) ?? 0) + 1);
        }
      }
    }
  }

  // Count endgame type occurrences
  for (const e of endgames) {
    const lichessTheme = ENDGAME_TYPE_TO_LICHESS[e.endgameType];
    if (lichessTheme) {
      themeCount.set(lichessTheme, (themeCount.get(lichessTheme) ?? 0) + 1);
    }
    for (const tag of e.tags) {
      const lt = TAG_TO_LICHESS[tag];
      if (lt) themeCount.set(lt, (themeCount.get(lt) ?? 0) + 1);
    }
  }

  // Sort by frequency â€” most common weakness first
  return [...themeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([theme]) => theme)
    // Deduplicate and limit
    .slice(0, 6);
}

/** Convert PGN moves to a FEN at a given ply */
function parsePgnMoves(pgn: string): string[] {
  return pgn
    .replace(/\{[^}]*\}/g, "")          // {comments}
    .replace(/\d+\.{3}/g, "")           // 1...
    .replace(/\d+\./g, "")              // 1.
    .split(/\s+/)
    .filter(t => t.length > 0 && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));
}

/**
 * Sets up the puzzle position.
 * - Position at `initialPly` is BEFORE the trigger move.
 * - The trigger move is `pgnMoves[initialPly]` (from the game PGN).
 * - `solution[0]` is the solver's first move (after the trigger).
 */
function setupPuzzlePosition(pgn: string, initialPly: number): {
  preTriggerFen: string;
  postTriggerFen: string;
  triggerFrom: string;
  triggerTo: string;
  solverColor: "white" | "black";
} {
  const chess = new Chess();
  const moves = parsePgnMoves(pgn);

  // Play to initialPly to get position before trigger
  for (let i = 0; i < Math.min(initialPly, moves.length); i++) {
    try { chess.move(moves[i]); } catch { break; }
  }
  const preTriggerFen = chess.fen();

  // Play the trigger move from PGN (NOT solution[0])
  let triggerFrom = "";
  let triggerTo = "";
  let postTriggerFen = preTriggerFen;
  if (initialPly < moves.length) {
    try {
      const result = chess.move(moves[initialPly]);
      if (result) {
        triggerFrom = result.from;
        triggerTo = result.to;
        postTriggerFen = chess.fen();
      }
    } catch { /* trigger move failed */ }
  }

  // Solver is whoever moves AFTER the trigger
  const solverColor = new Chess(postTriggerFen).turn() === "w" ? "white" : "black";

  return { preTriggerFen, postTriggerFen, triggerFrom, triggerTo, solverColor };
}

/** Human-readable theme labels */
const THEME_LABELS: Record<string, string> = {
  fork: "Forks",
  discoveredAttack: "Discovered Attacks",
  pin: "Pins",
  skewer: "Skewers",
  sacrifice: "Sacrifices",
  mate: "Checkmate Patterns",
  backRankMate: "Back Rank Mates",
  hangingPiece: "Hanging Pieces",
  exposedKing: "Exposed King",
  attraction: "Attraction",
  enPassant: "En Passant",
  promotion: "Promotion",
  underPromotion: "Underpromotion",
  middlegame: "Middlegame Tactics",
  opening: "Opening Tactics",
  kingsideAttack: "Kingside Attacks",
  attackingF2F7: "Attacking f2/f7",
  advancedPawn: "Advanced Pawns",
  crushing: "Crushing Attacks",
  advantage: "Converting Advantage",
  short: "Short Tactics",
  pawnEndgame: "Pawn Endgames",
  rookEndgame: "Rook Endgames",
  knightEndgame: "Knight Endgames",
  bishopEndgame: "Bishop Endgames",
  queenEndgame: "Queen Endgames",
  queenRookEndgame: "Queen + Rook Endgames",
};

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type LichessPuzzle = {
  game: {
    id: string;
    pgn: string;
    players: { name: string; color: string; rating: number }[];
  };
  puzzle: {
    id: string;
    rating: number;
    plays: number;
    solution: string[];
    themes: string[];
    initialPly: number;
  };
  matchedTheme: string;
};


type PuzzleState = "setup" | "solving" | "correct" | "wrong";

/* ------------------------------------------------------------------ */
/*  Puzzle Modal  single board cycling through themes                   */
/* ------------------------------------------------------------------ */

function PuzzleModal({
  puzzles: initialPuzzles,
  themes,
  onClose,
  onLoadMore,
}: {
  puzzles: LichessPuzzle[];
  themes: string[];
  onClose: () => void;
  onLoadMore: () => Promise<LichessPuzzle[]>;
}) {
  const { ref: boardRef, size: boardSize } = useBoardSize(560);
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();

  const [queue, setQueue] = useState<LichessPuzzle[]>(initialPuzzles);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fen, setFen] = useState("");
  const [solutionIdx, setSolutionIdx] = useState(0);
  const [state, setState] = useState<PuzzleState>("setup");
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [selectedSq, setSelectedSq] = useState<string | null>(null);
  const [legalMoveSqs, setLegalMoveSqs] = useState<string[]>([]);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [promoFrom, setPromoFrom] = useState<string | null>(null);
  const [promoTo, setPromoTo] = useState<string | null>(null);
  const [solved, setSolved] = useState(0);

  // Memoize side-to-move so isDraggablePiece doesn't instantiate Chess per piece
  const sideToMove = useMemo(() => {
    try { return new Chess(fen).turn(); } catch { return "w"; }
  }, [fen]);

  const isDraggablePiece = useCallback(
    ({ piece }: { piece: string }) => {
      if (state !== "solving") return false;
      return piece.startsWith(sideToMove === "w" ? "w" : "b");
    },
    [state, sideToMove]
  );
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [wrongMove, setWrongMove] = useState<{ from: string; to: string } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const puzzleSetupRef = useRef<{
    postTriggerFen: string;
    triggerFrom: string;
    triggerTo: string;
  } | null>(null);

  const puzzle = queue[currentIdx] ?? null;

  // Load initial position when puzzle changes
  useEffect(() => {
    if (!puzzle) return;
    const setup = setupPuzzlePosition(puzzle.game.pgn, puzzle.puzzle.initialPly);

    // Start at pre-trigger position (the trigger animates after a delay)
    setFen(setup.preTriggerFen);
    setSolutionIdx(0); // solution[0] is the solver's FIRST move
    setState("setup");
    setSelectedSq(null);
    setLegalMoveSqs([]);
    setWrongMove(null);
    setLastMove(null);
    setOrientation(setup.solverColor);

    // Save trigger info for the animation effect
    puzzleSetupRef.current = {
      postTriggerFen: setup.postTriggerFen,
      triggerFrom: setup.triggerFrom,
      triggerTo: setup.triggerTo,
    };

    preloadSounds();
  }, [puzzle]);

  // Auto-play the trigger move (from PGN, NOT solution[0]) after a brief delay
  useEffect(() => {
    if (state !== "setup" || !puzzle || !puzzleSetupRef.current) return;
    const trigger = puzzleSetupRef.current;
    const timer = setTimeout(() => {
      setFen(trigger.postTriggerFen);
      if (trigger.triggerFrom && trigger.triggerTo) {
        setLastMove({ from: trigger.triggerFrom, to: trigger.triggerTo });
      }
      setState("solving");
      playSound("move");
    }, 600);
    return () => clearTimeout(timer);
  }, [state, puzzle]);



  const attemptMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (state !== "solving" || !puzzle) return false;

      const expected = puzzle.puzzle.solution[solutionIdx];
      if (!expected) return false;

      const attemptUci = from + to + (promotion ?? "");
      const expectedBase = expected.slice(0, 4);
      const expectedPromo = expected.slice(4, 5);

      const matches =
        from + to === expectedBase &&
        (!expectedPromo || promotion === expectedPromo || (!promotion && expectedPromo === "q"));

      if (!matches) {
        setState("wrong");
        setStreak(0);
        setWrongMove({ from, to });
        playSound("wrong");

        // Reset after a moment
        setTimeout(() => {
          // Rebuild position: start from post-trigger, replay solution moves
          const postTrigger = puzzleSetupRef.current?.postTriggerFen;
          if (!postTrigger) return;
          const chess = new Chess(postTrigger);
          for (let i = 0; i < solutionIdx && i < puzzle.puzzle.solution.length; i++) {
            const m = puzzle.puzzle.solution[i];
            try {
              chess.move({
                from: m.slice(0, 2),
                to: m.slice(2, 4),
                promotion: m.slice(4, 5) || undefined,
              } as any);
            } catch { break; }
          }
          setFen(chess.fen());
          setState("solving");
          setWrongMove(null);
        }, 1000);
        return false;
      }

      // Correct move
      try {
        const chess = new Chess(fen);
        chess.move({
          from: expected.slice(0, 2),
          to: expected.slice(2, 4),
          promotion: expected.slice(4, 5) || undefined,
        } as any);
        const newFen = chess.fen();
        setFen(newFen);
        setLastMove({ from: expected.slice(0, 2), to: expected.slice(2, 4) });
        playSound("move");

        const nextIdx = solutionIdx + 1;

        if (nextIdx >= puzzle.puzzle.solution.length) {
          // Puzzle complete!
          setState("correct");
          setSolved((s) => s + 1);
          setStreak((s) => {
            const ns = s + 1;
            setBestStreak((b) => Math.max(b, ns));
            return ns;
          });
          playSound("correct");
          return true;
        }

        // Play opponent's response
        setSolutionIdx(nextIdx);
        setTimeout(() => {
          const oppMove = puzzle.puzzle.solution[nextIdx];
          if (oppMove) {
            try {
              const c2 = new Chess(newFen);
              c2.move({
                from: oppMove.slice(0, 2),
                to: oppMove.slice(2, 4),
                promotion: oppMove.slice(4, 5) || undefined,
              } as any);
              setFen(c2.fen());
              setLastMove({ from: oppMove.slice(0, 2), to: oppMove.slice(2, 4) });
              setSolutionIdx(nextIdx + 1);
              playSound("move");
            } catch { /* */ }
          }
        }, 400);

        return true;
      } catch {
        return false;
      }
    },
    [state, solutionIdx, fen, puzzle]
  );

  const onDrop = useCallback(
    (from: string, to: string, _piece: string) => {
      if (state !== "solving" || !puzzle) return false;
      const chess = new Chess(fen);
      const piece = chess.get(from as Parameters<Chess["get"]>[0]);
      // Check promotion
      if (piece?.type === "p") {
        const rank = parseInt(to[1]);
        const isPromo = (piece.color === "w" && rank === 8) || (piece.color === "b" && rank === 1);
        if (isPromo) {
          setPromoFrom(from);
          setPromoTo(to);
          setShowPromoDialog(true);
          return false; // don't apply yet — wait for promotion choice
        }
      }
      attemptMove(from, to);
      setSelectedSq(null);
      setLegalMoveSqs([]);
      return false; // we handle position via fen state, not the lib
    },
    [state, puzzle, fen, attemptMove]
  );

  const onPieceDragBegin = useCallback(
    (_piece: string, sourceSquare: string) => {
      if (state !== "solving" || !puzzle) return;
      const chess = new Chess(fen);
      const p = chess.get(sourceSquare as Parameters<Chess["get"]>[0]);
      if (!p || p.color !== chess.turn()) return;
      const moves = chess.moves({ square: sourceSquare as any, verbose: true });
      setSelectedSq(sourceSquare);
      setLegalMoveSqs(moves.map((m) => m.to));
    },
    [state, puzzle, fen]
  );

  const onSquareClick = useCallback(
    (square: CbSquare) => {
      if (state !== "solving" || !puzzle) {
        setSelectedSq(null);
        setLegalMoveSqs([]);
        return;
      }

      const chess = new Chess(fen);

      // If a piece is selected  try to move
      if (selectedSq && selectedSq !== square) {
        if (legalMoveSqs.includes(square)) {
          const piece = chess.get(selectedSq as Parameters<Chess["get"]>[0]);
          // Check promotion
          if (piece?.type === "p") {
            const rank = parseInt(square[1]);
            const isPromo = (piece.color === "w" && rank === 8) || (piece.color === "b" && rank === 1);
            if (isPromo) {
              setPromoFrom(selectedSq);
              setPromoTo(square);
              setShowPromoDialog(true);
              return;
            }
          }
          attemptMove(selectedSq, square);
          setSelectedSq(null);
          setLegalMoveSqs([]);
          return;
        }
      }

      // Select piece
      const pieceOnSq = chess.get(square as Parameters<Chess["get"]>[0]);
      const sideToMove = chess.turn();
      if (pieceOnSq && pieceOnSq.color === sideToMove) {
        setSelectedSq(square);
        const moves = chess.moves({ square: square as any, verbose: true });
        setLegalMoveSqs(moves.map((m) => m.to));
      } else {
        setSelectedSq(null);
        setLegalMoveSqs([]);
      }
    },
    [state, puzzle, fen, selectedSq, legalMoveSqs, attemptMove]
  );



  const onPromotionPieceSelect = useCallback(
    (piece?: PromotionPieceOption) => {
      setShowPromoDialog(false);
      if (!piece || !promoFrom || !promoTo) {
        setSelectedSq(null);
        setLegalMoveSqs([]);
        return true;
      }
      const promo = piece[1]?.toLowerCase() ?? "q";
      attemptMove(promoFrom, promoTo, promo);
      setSelectedSq(null);
      setLegalMoveSqs([]);
      setPromoFrom(null);
      setPromoTo(null);
      return true;
    },
    [promoFrom, promoTo, attemptMove]
  );

  // Legal move dot styles
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Last move highlight
    if (lastMove) {
      const lmColor = "rgba(255, 255, 0, 0.35)";
      styles[lastMove.from] = { background: lmColor };
      styles[lastMove.to] = { background: lmColor };
    }

    // Selection highlight
    if (selectedSq && state === "solving") {
      styles[selectedSq] = { background: "rgba(255, 255, 0, 0.4)" };
    }

    // Legal move dots
    if (selectedSq && state === "solving") {
      try {
        const chess = new Chess(fen);
        for (const sq of legalMoveSqs) {
          const hasPiece = chess.get(sq as Parameters<Chess["get"]>[0]);
          if (hasPiece) {
            styles[sq] = {
              background: "radial-gradient(circle, transparent 55%, rgba(0,0,0,0.25) 55%)",
              borderRadius: "50%",
            };
          } else {
            styles[sq] = {
              background: "radial-gradient(circle, rgba(0,0,0,0.25) 25%, transparent 25%)",
              borderRadius: "50%",
            };
          }
        }
      } catch { /* */ }
    }

    // Wrong move highlight
    if (wrongMove) {
      styles[wrongMove.from] = { ...styles[wrongMove.from], background: "rgba(239,68,68,0.4)" };
      styles[wrongMove.to] = { ...styles[wrongMove.to], background: "rgba(239,68,68,0.4)" };
    }

    return styles;
  }, [selectedSq, legalMoveSqs, fen, state, wrongMove, lastMove]);

  const goNext = useCallback(async () => {
    if (currentIdx + 1 < queue.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      // Fetch more puzzles
      setLoadingMore(true);
      try {
        const more = await onLoadMore();
        if (more.length > 0) {
          setQueue((q) => [...q, ...more]);
          setCurrentIdx((i) => i + 1);
        }
      } catch { /* */ }
      setLoadingMore(false);
    }
  }, [currentIdx, queue.length, onLoadMore]);

  const themeLabel = puzzle ? THEME_LABELS[puzzle.matchedTheme] ?? puzzle.matchedTheme : "";
  const rating = puzzle?.puzzle.rating ?? 0;
  const progress = queue.length > 0 ? ((solved / Math.max(queue.length, solved + 1)) * 100) : 0;

  return (
      <div
        className="w-full rounded-2xl p-5 md:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.95) 100%)",
        }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-emerald-400"><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.404 2.404 0 0 1 1.705-.707c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" /></svg>
            </span>
            <div>
              <h2 className="text-xl font-bold text-white">Personalized Puzzles</h2>
              <p className="text-sm text-slate-400">Find the best move — matched to your weaknesses</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Stats bar */}
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Solved</span>
            <span className="text-sm font-bold text-emerald-400">{solved}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Streak</span>
            <span className="text-sm font-bold text-orange-400">{"\uD83D\uDD25"} {streak}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Best</span>
            <span className="text-sm font-bold text-amber-400">{bestStreak}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Theme</span>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">{themeLabel}</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,560px)_1fr] md:gap-8">
          {/* Board */}
          <div ref={boardRef} className="relative mx-auto flex w-full max-w-[560px] shrink-0 items-start" style={{ willChange: "transform" }}>
            <div className="relative w-full rounded-xl">
              <Chessboard
                id={`puzzle-${puzzle?.puzzle.id ?? "none"}`}
                position={fen}
                onPieceDrop={onDrop}
                onSquareClick={onSquareClick}
                onPieceDragBegin={onPieceDragBegin}
                onPromotionPieceSelect={onPromotionPieceSelect}
                showPromotionDialog={showPromoDialog}
                promotionToSquare={promoTo as CbSquare | undefined}
                arePiecesDraggable={state === "solving"}
                isDraggablePiece={isDraggablePiece}
                boardOrientation={orientation}
                boardWidth={boardSize}
                animationDuration={200}
                customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                customSquareStyles={customSquareStyles}
                showBoardNotation={showCoords}
              />
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {/* Puzzle info */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Puzzle #{currentIdx + 1}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Rating: {rating}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    state === "correct"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : state === "wrong"
                        ? "bg-red-500/15 text-red-400"
                        : state === "solving"
                          ? "bg-violet-500/15 text-violet-400"
                          : "bg-slate-500/15 text-slate-400"
                  }`}
                >
                  {state === "correct"
                    ? " Solved!"
                    : state === "wrong"
                      ? " Try again"
                      : state === "solving"
                        ? "Your turn"
                        : "Setting up..."}
                </span>
              </div>

              {/* Puzzle themes */}
              {puzzle && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {puzzle.puzzle.themes.slice(0, 5).map((t) => (
                    <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-medium text-slate-400">
                {state === "setup" && "Watch the opponent's move..."}
                {state === "solving" && (
                  <>
                    <span className="text-white">Find the best move.</span> Click a piece to see legal moves, or drag it to the target square.
                  </>
                )}
                {state === "correct" && (
                  <>
                    <span className="text-emerald-400">Excellent!</span> You found the winning continuation.
                  </>
                )}
                {state === "wrong" && (
                  <>
                    <span className="text-red-400">Not quite.</span> The position will reset  try again.
                  </>
                )}
              </p>
            </div>

            {/* Solved progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Progress</span>
                <span className="text-slate-400">{solved} / {queue.length} puzzles</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-wrap gap-2">
              {state === "correct" && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={loadingMore}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Next Puzzle "}
                </button>
              )}
              {puzzle && (
                <a
                  href={`https://lichess.org/training/${puzzle.puzzle.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Open on Lichess 
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

type PersonalizedPuzzlesProps = {
  tactics: MissedTactic[];
  endgames: EndgameMistake[];
  leaks?: RepeatedOpeningLeak[];
};

export function PersonalizedPuzzles({ tactics, endgames, leaks }: PersonalizedPuzzlesProps) {
  const [puzzles, setPuzzles] = useState<LichessPuzzle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const themes = useMemo(() => extractThemes(tactics, endgames, leaks), [tactics, endgames, leaks]);

  const fetchPuzzles = useCallback(async (): Promise<LichessPuzzle[]> => {
    if (themes.length === 0) return [];
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/puzzles?themes=${themes.join(",")}&count=${Math.min(themes.length, 6)}`
      );
      if (!res.ok) throw new Error("Failed to fetch puzzles");
      const data = await res.json();
      const fetched = data.puzzles ?? [];
      return fetched;
    } catch {
      setError("Couldn't load puzzles from Lichess. Try again later.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [themes]);

  const handleOpen = useCallback(async () => {
    const fetched = await fetchPuzzles();
    if (fetched.length > 0) {
      setPuzzles(fetched);
      setExpanded(true);
    }
  }, [fetchPuzzles]);

  const handleLoadMore = useCallback(async (): Promise<LichessPuzzle[]> => {
    try {
      const res = await fetch(
        `/api/puzzles?themes=${themes.join(",")}&count=${Math.min(themes.length, 6)}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      const more = data.puzzles ?? [];
      setPuzzles((prev) => [...prev, ...more]);
      return more;
    } catch {
      return [];
    }
  }, [themes]);

  if (themes.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl border border-emerald-500/20">
        {!expanded || puzzles.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-10">
            {/* Decorative background */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-cyan-500/[0.04] to-violet-500/[0.08]" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-[80px]" />

          <div className="relative flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 shadow-lg shadow-emerald-500/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-emerald-400"><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.404 2.404 0 0 1 1.705-.707c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" /></svg>
            </span>
            <h3 className="mt-5 text-2xl font-extrabold text-white md:text-3xl">
              Practice Your Weak Spots
            </h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
              We found patterns you struggle with. Load personalized Lichess puzzles that target your exact weaknesses — forks you miss, pins you overlook, endgames you botch.
            </p>

            {/* Weakness chips */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {themes.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5 text-[11px] font-medium text-emerald-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {THEME_LABELS[t] ?? t}
                </span>
              ))}
            </div>

            {/* Feature highlights */}
            <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3">
                <span className="text-lg">{"\uD83C\uDFAF"}</span>
                <p className="text-xs font-bold text-white">Targeted Training</p>
                <p className="text-[10px] text-slate-500">Matched to your scan</p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.04] px-4 py-3">
                <span className="text-lg">{"\u265F\uFE0F"}</span>
                <p className="text-xs font-bold text-white">Interactive Board</p>
                <p className="text-[10px] text-slate-500">Click or drag to solve</p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-violet-500/15 bg-violet-500/[0.04] px-4 py-3">
                <span className="text-lg">{"\u267E\uFE0F"}</span>
                <p className="text-xs font-bold text-white">Unlimited & Free</p>
                <p className="text-[10px] text-slate-500">Powered by Lichess</p>
              </div>
            </div>

            {/* Open button */}
            <div className="mt-7">
              <button
                type="button"
                onClick={handleOpen}
                disabled={loading}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                      <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Loading Puzzles…
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                    </svg>
                    Start Personalized Puzzles
                  </>
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-4 text-sm text-red-400">{error}</p>
            )}
          </div>
        </div>
        ) : (
          <PuzzleModal
            puzzles={puzzles}
            themes={themes}
            onClose={() => setExpanded(false)}
            onLoadMore={handleLoadMore}
          />
        )}
      </div>
    </div>
  );
}