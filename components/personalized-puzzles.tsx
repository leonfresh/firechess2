"use client";

/**
 * PersonalizedPuzzles — Fetches Lichess puzzles based on the user's
 * detected weaknesses from their scan (tactic tags, endgame types, motifs).
 *
 * Maps FireChess tactic/endgame tags → Lichess puzzle themes, then fetches
 * one puzzle per weakness theme so training is personalized.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates } from "@/lib/use-coins";
import type { MissedTactic, EndgameMistake, RepeatedOpeningLeak } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Tag → Lichess theme mapping                                         */
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

  // Sort by frequency — most common weakness first
  return [...themeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([theme]) => theme)
    // Deduplicate and limit
    .slice(0, 6);
}

/** Convert PGN moves to a FEN at a given ply */
function pgnToFen(pgn: string, ply: number): string {
  const chess = new Chess();
  const moves = pgn.split(" ");
  for (let i = 0; i < Math.min(ply, moves.length); i++) {
    try {
      chess.move(moves[i]);
    } catch {
      break;
    }
  }
  return chess.fen();
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

type PuzzleState = "ready" | "solving" | "correct" | "wrong";

/* ------------------------------------------------------------------ */
/*  Puzzle Card                                                         */
/* ------------------------------------------------------------------ */

function PuzzleCard({ puzzle }: { puzzle: LichessPuzzle }) {
  const { ref: boardRef, size: boardSize } = useBoardSize(380);
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();

  const [fen, setFen] = useState("");
  const [solutionIdx, setSolutionIdx] = useState(0);
  const [state, setState] = useState<PuzzleState>("ready");
  const [orientation, setOrientation] = useState<"white" | "black">("white");

  // Set up initial position from PGN + initialPly
  useEffect(() => {
    const initialFen = pgnToFen(puzzle.game.pgn, puzzle.puzzle.initialPly);
    setFen(initialFen);
    setSolutionIdx(0);
    setState("ready");

    // Determine orientation: the player to move at initialPly is the solver
    const chess = new Chess(initialFen);
    setOrientation(chess.turn() === "w" ? "white" : "black");
  }, [puzzle]);

  // After "ready", play the opponent's first move (initialPly move) to set up the puzzle
  useEffect(() => {
    if (state !== "ready" || !fen) return;
    const timer = setTimeout(() => {
      try {
        const chess = new Chess(fen);
        const firstMove = puzzle.puzzle.solution[0];
        if (firstMove) {
          chess.move({
            from: firstMove.slice(0, 2),
            to: firstMove.slice(2, 4),
            promotion: firstMove.slice(4, 5) || undefined,
          } as any);
          setFen(chess.fen());
          setSolutionIdx(1);
          setState("solving");
        }
      } catch {
        setState("solving");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [state, fen, puzzle.puzzle.solution]);

  const onDrop = useCallback(
    (from: string, to: string) => {
      if (state !== "solving") return false;

      const expectedUci = puzzle.puzzle.solution[solutionIdx];
      if (!expectedUci) return false;

      const attemptUci = from + to;
      // Check if the move matches (with or without promotion)
      const matches =
        expectedUci.startsWith(attemptUci) ||
        attemptUci === expectedUci.slice(0, 4);

      if (!matches) {
        setState("wrong");
        // Reset after a moment
        setTimeout(() => {
          const resetFen = pgnToFen(puzzle.game.pgn, puzzle.puzzle.initialPly);
          const chess = new Chess(resetFen);
          // Replay solution up to current point
          for (let i = 0; i < solutionIdx; i++) {
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
        }, 1200);
        return false;
      }

      // Correct move
      try {
        const chess = new Chess(fen);
        chess.move({
          from: expectedUci.slice(0, 2),
          to: expectedUci.slice(2, 4),
          promotion: expectedUci.slice(4, 5) || undefined,
        } as any);
        const newFen = chess.fen();
        setFen(newFen);

        const nextIdx = solutionIdx + 1;

        if (nextIdx >= puzzle.puzzle.solution.length) {
          // Puzzle complete!
          setState("correct");
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
              setSolutionIdx(nextIdx + 1);
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

  const themeLabel = THEME_LABELS[puzzle.matchedTheme] ?? puzzle.matchedTheme;
  const rating = puzzle.puzzle.rating;

  // Border color based on state
  const borderColor =
    state === "correct"
      ? "border-emerald-500/30"
      : state === "wrong"
        ? "border-red-500/30"
        : "border-violet-500/15";

  const statusBg =
    state === "correct"
      ? "bg-emerald-500/15 text-emerald-400"
      : state === "wrong"
        ? "bg-red-500/15 text-red-400"
        : "bg-violet-500/15 text-violet-400";

  return (
    <div ref={boardRef} className={`glass-card overflow-hidden transition-colors ${borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧩</span>
          <div>
            <span className="text-xs font-bold text-white">{themeLabel}</span>
            <span className="ml-2 text-[10px] text-slate-500">Rating {rating}</span>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusBg}`}>
          {state === "correct"
            ? "✓ Solved!"
            : state === "wrong"
              ? "✗ Try again"
              : state === "solving"
                ? "Your turn"
                : "Loading..."}
        </span>
      </div>

      {/* Board */}
      <div className="flex justify-center p-4">
        <div style={{ width: boardSize, height: boardSize }}>
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardWidth={boardSize}
            boardOrientation={orientation}
            animationDuration={200}
            arePiecesDraggable={state === "solving"}
            showBoardNotation={showCoords}
            customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
            customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5">
        <a
          href={`https://lichess.org/training/${puzzle.puzzle.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-slate-500 transition-colors hover:text-slate-300"
        >
          Open on Lichess ↗
        </a>
        <div className="flex items-center gap-1.5">
          {puzzle.puzzle.themes.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-slate-500"
            >
              {t}
            </span>
          ))}
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
  const [fetched, setFetched] = useState(false);

  const themes = useMemo(() => extractThemes(tactics, endgames, leaks), [tactics, endgames, leaks]);

  const fetchPuzzles = useCallback(async () => {
    if (themes.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/puzzles?themes=${themes.join(",")}&count=${Math.min(themes.length, 3)}`
      );
      if (!res.ok) throw new Error("Failed to fetch puzzles");
      const data = await res.json();
      setPuzzles(data.puzzles ?? []);
      setFetched(true);
    } catch {
      setError("Couldn't load puzzles from Lichess. Try again later.");
    } finally {
      setLoading(false);
    }
  }, [themes]);

  // Don't auto-fetch — let the user click to load
  if (themes.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Big CTA before puzzles are loaded */}
      {!fetched ? (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 p-8 md:p-10">
          {/* Decorative background */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-cyan-500/[0.04] to-violet-500/[0.08]" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-[80px]" />

          <div className="relative flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl shadow-lg shadow-emerald-500/10">🧩</span>
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
                <span className="text-lg">🎯</span>
                <p className="text-xs font-bold text-white">Targeted Training</p>
                <p className="text-[10px] text-slate-500">Matched to your scan</p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.04] px-4 py-3">
                <span className="text-lg">♟️</span>
                <p className="text-xs font-bold text-white">Interactive Board</p>
                <p className="text-[10px] text-slate-500">Solve right here</p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-violet-500/15 bg-violet-500/[0.04] px-4 py-3">
                <span className="text-lg">♾️</span>
                <p className="text-xs font-bold text-white">Unlimited & Free</p>
                <p className="text-[10px] text-slate-500">Powered by Lichess</p>
              </div>
            </div>

            {/* Load button */}
            <div className="mt-7">
              <button
                type="button"
                onClick={fetchPuzzles}
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
                    Load Personalized Puzzles
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header after loaded */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-xl">🧩</span>
              <div>
                <h2 className="text-lg font-bold text-white">Personalized Puzzles</h2>
                <p className="text-xs text-slate-500">Matched to: {themes.map(t => THEME_LABELS[t] ?? t).join(", ")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchPuzzles}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? "animate-spin" : ""}>
                <path d="M21 12a9 9 0 11-6.22-8.56" />
                <path d="M21 3v5h-5" />
              </svg>
              {loading ? "Loading…" : "New Puzzles"}
            </button>
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4 text-center text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Puzzle grid */}
      {puzzles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {puzzles.map((p) => (
            <PuzzleCard key={p.puzzle.id} puzzle={p} />
          ))}
        </div>
      )}
    </div>
  );
}
