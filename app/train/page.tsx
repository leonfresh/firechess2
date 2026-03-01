"use client";

/**
 * /train — Weakness Trainer
 *
 * Training modes tailored to the player's weaknesses from their scan reports:
 *   1. Weakness Trainer — puzzles targeting your worst motifs
 *   2. Speed Drill — timed puzzle rush (3/5 min)
 *   3. Blunder Spotter — find the best move from your own game positions
 *   4. Opening Trainer — practice your opening leaks
 *   5. Endgame Gym — practice your weakest endgame types
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { Square as CbSquare } from "react-chessboard/dist/chessboard/types";
import { useSession } from "@/components/session-provider";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import { EvalBar } from "@/components/eval-bar";
import { earnCoins } from "@/lib/coins";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Mode = "weakness" | "speed" | "blunder" | "opening" | "endgame";

type SavedReport = {
  id: string;
  chessUsername: string;
  leaks: any[];
  missedTactics: any[];
  diagnostics: any;
  createdAt: string;
};

type PuzzleData = {
  puzzle: {
    id: string;
    initialPly: number;
    solution: string[];
    themes: string[];
  };
  game: {
    pgn: string;
    id: string;
  };
  matchedTheme: string;
};

type DrillPosition = {
  fen: string;
  bestMove: string;
  label: string;
  cpLoss?: number;
};

/* ------------------------------------------------------------------ */
/*  Motif → Lichess theme mapping                                      */
/* ------------------------------------------------------------------ */

const MOTIF_TO_THEME: Record<string, string> = {
  "Knight Fork": "fork",
  "Queen Fork": "fork",
  "Pawn Fork": "fork",
  Fork: "fork",
  Pin: "pin",
  Skewer: "skewer",
  "Discovered Attack": "discoveredAttack",
  "Discovered Check": "discoveredAttack",
  "Double Check": "doubleCheck",
  "Back Rank": "backRankMate",
  Sacrifice: "sacrifice",
  Deflection: "deflection",
  Zwischenzug: "intermezzo",
  "Trapped Piece": "trappedPiece",
  "Hanging Piece": "hangingPiece",
  "Missed Mate": "mate",
  "Missed Check": "fork", // approx
  "Missed Capture": "hangingPiece", // approx
  "Forcing Capture": "crushing",
  "Winning Blunder": "crushing",
  "Major Miss": "crushing",
};

const ENDGAME_TO_THEME: Record<string, string> = {
  Pawn: "pawnEndgame",
  Rook: "rookEndgame",
  "Rook + Bishop": "rookEndgame",
  "Rook + Knight": "rookEndgame",
  Queen: "queenEndgame",
  "Queen + Rook": "queenRookEndgame",
  "Knight vs Knight": "knightEndgame",
  "Bishop vs Bishop": "bishopEndgame",
  "Knight vs Bishop": "knightEndgame",
  "Bishop vs Knight": "bishopEndgame",
  "Two Bishops": "bishopEndgame",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function parseUci(move: string) {
  return {
    from: move.slice(0, 2) as CbSquare,
    to: move.slice(2, 4) as CbSquare,
    promotion: (move.slice(4, 5) || undefined) as "q" | "r" | "b" | "n" | undefined,
  };
}

function squareToUci(from: string, to: string, promo?: string) {
  return `${from}${to}${promo ?? ""}`;
}

/** Get worst tactic motifs from saved reports, sorted by frequency */
function getWeakMotifs(reports: SavedReport[]): { motif: string; count: number; theme: string }[] {
  const counts = new Map<string, number>();
  for (const r of reports) {
    for (const t of r.missedTactics ?? []) {
      for (const tag of t.tags ?? []) {
        const theme = MOTIF_TO_THEME[tag];
        if (theme) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
    }
  }
  return Array.from(counts.entries())
    .map(([motif, count]) => ({ motif, count, theme: MOTIF_TO_THEME[motif] }))
    .sort((a, b) => b.count - a.count);
}

/** Get worst endgame types from reports */
function getWeakEndgames(reports: SavedReport[]): { type: string; avgCpLoss: number; theme: string }[] {
  const statsMap = new Map<string, { total: number; count: number }>();
  for (const r of reports) {
    const endgameStats = r.diagnostics?.endgameStats;
    if (!endgameStats?.byType) continue;
    for (const bt of endgameStats.byType) {
      const existing = statsMap.get(bt.type) ?? { total: 0, count: 0 };
      existing.total += bt.avgCpLoss * bt.count;
      existing.count += bt.count;
      statsMap.set(bt.type, existing);
    }
  }
  return Array.from(statsMap.entries())
    .map(([type, s]) => ({
      type,
      avgCpLoss: s.count > 0 ? s.total / s.count : 0,
      theme: ENDGAME_TO_THEME[type] ?? "endgame",
    }))
    .filter((e) => e.avgCpLoss > 0)
    .sort((a, b) => b.avgCpLoss - a.avgCpLoss);
}

/** Unique themes from weak motifs */
function uniqueThemes(motifs: { theme: string }[], max: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of motifs) {
    if (!seen.has(m.theme)) {
      seen.add(m.theme);
      result.push(m.theme);
      if (result.length >= max) break;
    }
  }
  return result;
}

/** Build blunder positions from own game tactics AND opening leaks */
function buildBlunderPositions(reports: SavedReport[]): DrillPosition[] {
  const positions: DrillPosition[] = [];
  const seenFens = new Set<string>();

  // From missed tactics (threshold lowered to catch more positions)
  for (const r of reports) {
    for (const t of r.missedTactics ?? []) {
      if (t.fenBefore && t.bestMove && t.cpLoss >= 50) {
        if (!seenFens.has(t.fenBefore)) {
          seenFens.add(t.fenBefore);
          positions.push({
            fen: t.fenBefore,
            bestMove: t.bestMove,
            label: (t.tags ?? []).join(", ") || "Tactic",
            cpLoss: t.cpLoss,
          });
        }
      }
    }
  }

  // Also pull significant opening leaks as blunder positions (cpLoss >= 80)
  for (const r of reports) {
    for (const leak of r.leaks ?? []) {
      const fen = leak.fen ?? leak.fenBefore;
      const best = leak.bestMove ?? leak.correctMoves?.[0];
      const cp = leak.cpLoss ?? leak.avgCpLoss;
      if (fen && best && cp >= 80 && !seenFens.has(fen)) {
        seenFens.add(fen);
        positions.push({
          fen,
          bestMove: best,
          label: leak.openingName ?? leak.opening ?? "Opening blunder",
          cpLoss: cp,
        });
      }
    }
  }

  // Shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions;
}

/** Build opening drill positions from leaks */
function buildOpeningPositions(reports: SavedReport[]): DrillPosition[] {
  const positions: DrillPosition[] = [];
  const seenFens = new Set<string>();
  for (const r of reports) {
    for (const leak of r.leaks ?? []) {
      const fen = leak.fen ?? leak.fenBefore;
      if (!fen || seenFens.has(fen)) continue;
      seenFens.add(fen);
      const best = leak.bestMove ?? leak.correctMoves?.[0];
      if (best) {
        positions.push({
          fen,
          bestMove: best,
          label: leak.openingName ?? leak.opening ?? "Opening",
          cpLoss: leak.avgCpLoss ?? leak.cpLoss,
        });
      }
    }
  }
  return positions;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Mode cards data                                                    */
/* ------------------------------------------------------------------ */

const MODES: {
  id: Mode;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  needsReport: boolean;
}[] = [
  {
    id: "weakness",
    title: "Weakness Trainer",
    description: "Puzzles targeting your worst tactical motifs from your scans",
    icon: "🎯",
    gradient: "from-red-500/20 to-orange-500/20",
    needsReport: true,
  },
  {
    id: "speed",
    title: "Speed Drill",
    description: "Solve as many puzzles as you can before time runs out",
    icon: "⚡",
    gradient: "from-amber-500/20 to-yellow-500/20",
    needsReport: false,
  },
  {
    id: "blunder",
    title: "Blunder Spotter",
    description: "Find the best move in positions from your own games",
    icon: "🔍",
    gradient: "from-fuchsia-500/20 to-pink-500/20",
    needsReport: true,
  },
  {
    id: "opening",
    title: "Opening Trainer",
    description: "Practice the correct moves in your recurring opening leaks",
    icon: "📖",
    gradient: "from-emerald-500/20 to-teal-500/20",
    needsReport: true,
  },
  {
    id: "endgame",
    title: "Endgame Gym",
    description: "Sharpen your weakest endgame types with targeted puzzles",
    icon: "♚",
    gradient: "from-cyan-500/20 to-blue-500/20",
    needsReport: true,
  },
];

/* ------------------------------------------------------------------ */
/*  PuzzleBoard — reusable interactive puzzle-solving board             */
/* ------------------------------------------------------------------ */

type PuzzleBoardProps = {
  fen: string;
  solutionMoves: string[]; // UCI moves in order
  orientation: "white" | "black";
  onSolved: () => void;
  onFailed: () => void;
  showHint?: boolean;
};

function PuzzleBoard({ fen, solutionMoves, orientation, onSolved, onFailed, showHint }: PuzzleBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: boardRef, size: boardSize } = useBoardSize(480);
  const boardTheme = useBoardTheme();
  const [game, setGame] = useState(() => new Chess(fen));
  const [moveIndex, setMoveIndex] = useState(0);
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">("playing");
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;
  const [shaking, setShaking] = useState(false);

  // Apply initial "setup" move (opponent's move from the puzzle)
  useEffect(() => {
    preloadSounds();
    if (solutionMoves.length === 0) return;
    const setupMove = solutionMoves[0];
    const parsed = parseUci(setupMove);
    const newGame = new Chess(fen);
    const timer = setTimeout(() => {
      try {
        newGame.move({ from: parsed.from, to: parsed.to, promotion: parsed.promotion });
        playSound("move");
        setGame(new Chess(newGame.fen()));
        setMoveIndex(1);
      } catch {
        setMoveIndex(1);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [fen, solutionMoves]);

  // Show hint
  useEffect(() => {
    if (showHint && status === "playing" && moveIndex < solutionMoves.length) {
      const expected = solutionMoves[moveIndex];
      setHintSquare(expected.slice(0, 2));
    } else {
      setHintSquare(null);
    }
  }, [showHint, status, moveIndex, solutionMoves]);

  const handleDrop = useCallback(
    (from: CbSquare, to: CbSquare) => {
      if (status !== "playing") return false;

      const expected = solutionMoves[moveIndex];
      if (!expected) return false;

      const expectedParsed = parseUci(expected);
      const matchesBase = from === expectedParsed.from && to === expectedParsed.to;

      if (matchesBase) {
        const promotion = expectedParsed.promotion ?? "q";
        const newGame = new Chess(game.fen());
        try {
          newGame.move({ from, to, promotion });
        } catch {
          return false;
        }
        playSound(newGame.isCheck() ? "check" : "move");
        setGame(new Chess(newGame.fen()));

        const nextIndex = moveIndex + 1;

        if (nextIndex >= solutionMoves.length) {
          setStatus("correct");
          playSound("correct");
          onSolved();
          return true;
        }

        const opponentMove = solutionMoves[nextIndex];
        const opParsed = parseUci(opponentMove);
        setTimeout(() => {
          const g = new Chess(newGame.fen());
          try {
            g.move({ from: opParsed.from, to: opParsed.to, promotion: opParsed.promotion });
            playSound(g.isCheck() ? "check" : "move");
            setGame(new Chess(g.fen()));
            setMoveIndex(nextIndex + 1);
          } catch {
            setStatus("correct");
            onSolved();
          }
        }, 400);

        setMoveIndex(nextIndex);
        setAttempts(0); // reset attempts on correct move
        return true;
      }

      // Wrong move — retry logic
      playSound("wrong");
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);

      if (newAttempts >= MAX_ATTEMPTS) {
        // Out of tries — show answer and fail
        setStatus("wrong");
        onFailed();
      }
      // Otherwise stay on "playing" — let user retry

      return false;
    },
    [game, moveIndex, solutionMoves, status, onSolved, onFailed, attempts]
  );

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (hintSquare) {
    customSquareStyles[hintSquare] = {
      boxShadow: "inset 0 0 20px 6px rgba(34, 197, 94, 0.5)",
      borderRadius: "4px",
    };
  }
  if (status === "correct") {
    const lastMove = solutionMoves[solutionMoves.length - 1];
    if (lastMove) {
      customSquareStyles[lastMove.slice(2, 4)] = {
        boxShadow: "inset 0 0 20px 6px rgba(34, 197, 94, 0.6)",
      };
    }
  }
  if (status === "wrong") {
    const expected = solutionMoves[moveIndex];
    if (expected) {
      customSquareStyles[expected.slice(0, 2)] = {
        boxShadow: "inset 0 0 16px 4px rgba(239, 68, 68, 0.5)",
      };
      customSquareStyles[expected.slice(2, 4)] = {
        boxShadow: "inset 0 0 16px 4px rgba(34, 197, 94, 0.5)",
      };
    }
  }

  return (
    <div ref={boardRef} className="flex flex-col items-center gap-3">
      {/* Turn indicator */}
      <div className="flex items-center gap-2 text-xs">
        <div className={`h-3 w-3 rounded-full ${orientation === "white" ? "bg-white border border-slate-400" : "bg-slate-800 border border-slate-500"}`} />
        <span className="text-slate-400">Your turn as {orientation}</span>
      </div>
      <div
        style={{ width: boardSize, height: boardSize }}
        className={`shrink-0 overflow-hidden rounded-xl shadow-2xl transition-transform ${shaking ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
      >
        <Chessboard
          id="train-board"
          position={game.fen()}
          onPieceDrop={handleDrop}
          boardOrientation={orientation}
          boardWidth={boardSize}
          animationDuration={200}
          arePiecesDraggable={status === "playing"}
          customSquareStyles={customSquareStyles}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
        />
      </div>
      {/* Attempts remaining */}
      {status === "playing" && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <span
              key={i}
              className={`text-base transition-all ${i < MAX_ATTEMPTS - attempts ? "opacity-100" : "opacity-20 scale-75"}`}
            >
              ❤️
            </span>
          ))}
          {attempts > 0 && (
            <span className="ml-2 text-xs text-red-400/80">
              {MAX_ATTEMPTS - attempts} {MAX_ATTEMPTS - attempts === 1 ? "try" : "tries"} left
            </span>
          )}
        </div>
      )}
      {status === "wrong" && (
        <p className="text-sm font-medium text-red-400">
          Out of tries — the correct move is shown above
        </p>
      )}
      {status === "correct" && (
        <p className="text-sm font-medium text-emerald-400">✓ Correct!</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SimplePuzzleBoard — for blunder/opening modes (single move)        */
/* ------------------------------------------------------------------ */

type SimpleBoardProps = {
  position: DrillPosition;
  onResult: (correct: boolean) => void;
  showHint?: boolean;
};

function SimplePuzzleBoard({ position, onResult, showHint }: SimpleBoardProps) {
  const { ref: boardRef, size: boardSize } = useBoardSize(480);
  const boardTheme = useBoardTheme();
  const [game] = useState(() => new Chess(position.fen));
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">("playing");
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;
  const [shaking, setShaking] = useState(false);
  const orientation = game.turn() === "w" ? "white" : "black";

  const expected = parseUci(position.bestMove);

  useEffect(() => {
    preloadSounds();
  }, []);

  const handleDrop = useCallback(
    (from: CbSquare, to: CbSquare) => {
      if (status !== "playing") return false;
      if (from === expected.from && to === expected.to) {
        const newGame = new Chess(game.fen());
        try {
          newGame.move({ from, to, promotion: expected.promotion ?? "q" });
        } catch {
          return false;
        }
        playSound("correct");
        setStatus("correct");
        onResult(true);
        return true;
      }

      // Wrong move — retry logic
      playSound("wrong");
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);

      if (newAttempts >= MAX_ATTEMPTS) {
        setStatus("wrong");
        onResult(false);
      }

      return false;
    },
    [game, expected, status, onResult, attempts]
  );

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (showHint && status === "playing") {
    customSquareStyles[expected.from] = {
      boxShadow: "inset 0 0 20px 6px rgba(34, 197, 94, 0.5)",
      borderRadius: "4px",
    };
  }
  if (status === "wrong") {
    customSquareStyles[expected.from] = {
      boxShadow: "inset 0 0 16px 4px rgba(239, 68, 68, 0.5)",
    };
    customSquareStyles[expected.to] = {
      boxShadow: "inset 0 0 16px 4px rgba(34, 197, 94, 0.5)",
    };
  }

  return (
    <div ref={boardRef} className="flex flex-col items-center gap-3">
      {/* Turn indicator */}
      <div className="flex items-center gap-2 text-xs">
        <div className={`h-3 w-3 rounded-full ${orientation === "white" ? "bg-white border border-slate-400" : "bg-slate-800 border border-slate-500"}`} />
        <span className="text-slate-400">Your turn as {orientation}</span>
      </div>
      <div
        style={{ width: boardSize, height: boardSize }}
        className={`shrink-0 overflow-hidden rounded-xl shadow-2xl transition-transform ${shaking ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
      >
        <Chessboard
          id="simple-train-board"
          position={game.fen()}
          onPieceDrop={handleDrop}
          boardOrientation={orientation}
          boardWidth={boardSize}
          animationDuration={200}
          arePiecesDraggable={status === "playing"}
          customSquareStyles={customSquareStyles}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
        />
      </div>
      {/* Attempts remaining */}
      {status === "playing" && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <span
              key={i}
              className={`text-base transition-all ${i < MAX_ATTEMPTS - attempts ? "opacity-100" : "opacity-20 scale-75"}`}
            >
              ❤️
            </span>
          ))}
          {attempts > 0 && (
            <span className="ml-2 text-xs text-red-400/80">
              {MAX_ATTEMPTS - attempts} {MAX_ATTEMPTS - attempts === 1 ? "try" : "tries"} left
            </span>
          )}
        </div>
      )}
      {status === "wrong" && (
        <p className="text-sm font-medium text-red-400">
          Out of tries — the correct move is shown above
        </p>
      )}
      {status === "correct" && (
        <p className="text-sm font-medium text-emerald-400">✓ Correct!</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function TrainPage() {
  const { authenticated, loading: sessionLoading, user } = useSession();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [solved, setSolved] = useState(0);
  const [failed, setFailed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Speed drill state
  const [speedTime, setSpeedTime] = useState<3 | 5>(3);
  const [timeLeft, setTimeLeft] = useState(0);
  const [speedActive, setSpeedActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Blunder / opening positions
  const [drillPositions, setDrillPositions] = useState<DrillPosition[]>([]);
  const [currentDrill, setCurrentDrill] = useState(0);

  // Session complete
  const [sessionDone, setSessionDone] = useState(false);

  // Load reports
  useEffect(() => {
    if (sessionLoading) return;
    if (!authenticated) {
      setLoadingReports(false);
      return;
    }
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .catch(() => {})
      .finally(() => setLoadingReports(false));
  }, [authenticated, sessionLoading]);

  const weakMotifs = useMemo(() => getWeakMotifs(reports), [reports]);
  const weakEndgames = useMemo(() => getWeakEndgames(reports), [reports]);
  const blunderPositions = useMemo(() => buildBlunderPositions(reports), [reports]);
  const openingPositions = useMemo(() => buildOpeningPositions(reports), [reports]);

  // Fetch puzzles for a set of themes
  const fetchPuzzles = useCallback(async (themes: string[], count = 5) => {
    setLoadingPuzzles(true);
    setPuzzles([]);
    setCurrentPuzzle(0);
    setSolved(0);
    setFailed(0);
    setCoinsEarned(0);
    setSessionDone(false);
    try {
      const res = await fetch(
        `/api/puzzles?themes=${themes.join(",")}&count=${count}`
      );
      const data = await res.json();
      setPuzzles(data.puzzles ?? []);
    } catch {}
    setLoadingPuzzles(false);
  }, []);

  // Start a mode
  const startMode = useCallback(
    async (mode: Mode) => {
      setActiveMode(mode);
      setShowHint(false);
      setSessionDone(false);
      setSolved(0);
      setFailed(0);
      setCoinsEarned(0);

      if (mode === "weakness") {
        const themes = uniqueThemes(weakMotifs, 5);
        if (themes.length === 0) {
          // Fallback to general tactics
          await fetchPuzzles(["fork", "pin", "skewer", "sacrifice", "hangingPiece"], 5);
        } else {
          await fetchPuzzles(themes, 5);
        }
      } else if (mode === "speed") {
        const themes = weakMotifs.length > 0
          ? uniqueThemes(weakMotifs, 4)
          : ["fork", "pin", "sacrifice", "hangingPiece"];
        await fetchPuzzles(themes, 6);
        setTimeLeft(speedTime * 60);
      } else if (mode === "blunder") {
        setDrillPositions(blunderPositions.slice(0, 10));
        setCurrentDrill(0);
      } else if (mode === "opening") {
        setDrillPositions(openingPositions.slice(0, 10));
        setCurrentDrill(0);
      } else if (mode === "endgame") {
        const themes = weakEndgames.length > 0
          ? uniqueThemes(weakEndgames, 4)
          : ["pawnEndgame", "rookEndgame", "bishopEndgame", "knightEndgame"];
        await fetchPuzzles(themes, 5);
      }
    },
    [weakMotifs, weakEndgames, blunderPositions, openingPositions, fetchPuzzles, speedTime]
  );

  // Speed drill timer
  useEffect(() => {
    if (!speedActive || activeMode !== "speed") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setSpeedActive(false);
          setSessionDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [speedActive, activeMode]);

  // Handle puzzle solved
  const handlePuzzleSolved = useCallback(() => {
    setSolved((s) => s + 1);
    const coins = earnCoins("study_task");
    if (coins > 0) setCoinsEarned((c) => c + coins);

    // Auto-advance after delay
    setTimeout(() => {
      if (activeMode === "speed" && speedActive) {
        // Fetch more puzzles for speed mode
        const themes = weakMotifs.length > 0
          ? uniqueThemes(weakMotifs, 4)
          : ["fork", "pin", "sacrifice", "hangingPiece"];
        fetchPuzzles(themes, 6);
      } else {
        setCurrentPuzzle((p) => {
          if (p + 1 >= puzzles.length) {
            setSessionDone(true);
            return p;
          }
          return p + 1;
        });
      }
      setShowHint(false);
    }, 1500);
  }, [activeMode, speedActive, weakMotifs, fetchPuzzles, puzzles.length]);

  // Handle puzzle failed
  const handlePuzzleFailed = useCallback(() => {
    setFailed((f) => f + 1);
    setTimeout(() => {
      if (activeMode === "speed" && speedActive) {
        const themes = weakMotifs.length > 0
          ? uniqueThemes(weakMotifs, 4)
          : ["fork", "pin", "sacrifice", "hangingPiece"];
        fetchPuzzles(themes, 6);
      } else {
        setCurrentPuzzle((p) => {
          if (p + 1 >= puzzles.length) {
            setSessionDone(true);
            return p;
          }
          return p + 1;
        });
      }
      setShowHint(false);
    }, 2000);
  }, [activeMode, speedActive, weakMotifs, fetchPuzzles, puzzles.length]);

  // Handle drill result (blunder/opening)
  const handleDrillResult = useCallback(
    (correct: boolean) => {
      if (correct) {
        setSolved((s) => s + 1);
        const coins = earnCoins("study_task");
        if (coins > 0) setCoinsEarned((c) => c + coins);
      } else {
        setFailed((f) => f + 1);
      }
      setTimeout(() => {
        setCurrentDrill((d) => {
          if (d + 1 >= drillPositions.length) {
            setSessionDone(true);
            return d;
          }
          return d + 1;
        });
        setShowHint(false);
      }, 1500);
    },
    [drillPositions.length]
  );

  // Back to mode select
  const goBack = () => {
    setActiveMode(null);
    setPuzzles([]);
    setDrillPositions([]);
    setSessionDone(false);
    setSpeedActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ─── Puzzle rendering helpers ───

  const currentPuzzleData = puzzles[currentPuzzle] ?? null;
  const puzzleFen = useMemo(() => {
    if (!currentPuzzleData) return null;
    // Reconstruct FEN from PGN up to initialPly
    try {
      const game = new Chess();
      const pgn = currentPuzzleData.game.pgn;
      game.loadPgn(pgn);
      const history = game.history({ verbose: true });
      const targetPly = currentPuzzleData.puzzle.initialPly;
      const rebuild = new Chess();
      for (let i = 0; i < Math.min(targetPly, history.length); i++) {
        rebuild.move(history[i].san);
      }
      return rebuild.fen();
    } catch {
      return null;
    }
  }, [currentPuzzleData]);

  const puzzleOrientation = useMemo(() => {
    if (!puzzleFen) return "white" as const;
    const chess = new Chess(puzzleFen);
    // After the setup move from the puzzle, the solving side is the one whose turn it is
    // The first solution move is the opponent's, so the solver is the one who moves second
    return chess.turn() === "w" ? "black" : "white";
  }, [puzzleFen]);

  // ─── Render ───

  const isLoading = sessionLoading || loadingReports;

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-fuchsia-500/[0.05] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-cyan-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-12 md:px-10 md:py-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                {activeMode ? MODES.find((m) => m.id === activeMode)?.title : "Training"}
              </h1>
              {activeMode && (
                <span className="text-2xl">{MODES.find((m) => m.id === activeMode)?.icon}</span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {activeMode
                ? MODES.find((m) => m.id === activeMode)?.description
                : "Choose a training mode tailored to your weaknesses"}
            </p>
          </div>
          {activeMode && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          {!activeMode && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
          </div>
        )}

        {/* Not signed in */}
        {!isLoading && !authenticated && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
            <p className="text-lg font-semibold text-white">Sign in to start training</p>
            <p className="mt-2 text-sm text-slate-400">
              Training modes are personalized based on your saved scan reports.
            </p>
            <Link
              href="/auth/signin"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-fuchsia-500/25"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Mode selection */}
        {!isLoading && authenticated && !activeMode && (
          <div className="space-y-6">
            {/* Weakness summary */}
            {reports.length > 0 && weakMotifs.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Your weakest areas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {weakMotifs.slice(0, 6).map((m) => (
                    <span
                      key={m.motif}
                      className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300"
                    >
                      {m.motif} ({m.count})
                    </span>
                  ))}
                  {weakEndgames.slice(0, 3).map((e) => (
                    <span
                      key={e.type}
                      className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300"
                    >
                      {e.type} endgame
                    </span>
                  ))}
                </div>
              </div>
            )}

            {reports.length === 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
                <p className="text-sm text-amber-300">
                  <strong>No scan reports yet.</strong> Run a scan first to unlock personalized training.
                  Speed Drill is available without reports.
                </p>
              </div>
            )}

            {/* Mode cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODES.map((mode) => {
                const disabled = mode.needsReport && reports.length === 0;
                const hasData =
                  mode.id === "blunder" ? blunderPositions.length > 0 :
                  mode.id === "opening" ? openingPositions.length > 0 :
                  true;
                const actuallyDisabled = disabled || (mode.needsReport && !hasData && mode.id !== "weakness" && mode.id !== "endgame");

                return (
                  <button
                    key={mode.id}
                    onClick={() => !actuallyDisabled && startMode(mode.id)}
                    disabled={actuallyDisabled}
                    className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br ${mode.gradient} p-6 text-left transition-all ${
                      actuallyDisabled
                        ? "cursor-not-allowed opacity-40"
                        : "hover:border-white/[0.15] hover:shadow-lg hover:shadow-white/[0.02] active:scale-[0.98]"
                    }`}
                  >
                    <div className="mb-3 text-3xl">{mode.icon}</div>
                    <h3 className="text-lg font-bold text-white">{mode.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{mode.description}</p>
                    {mode.id === "blunder" && blunderPositions.length > 0 && (
                      <p className="mt-2 text-[11px] text-slate-500">{blunderPositions.length} positions available</p>
                    )}
                    {mode.id === "opening" && openingPositions.length > 0 && (
                      <p className="mt-2 text-[11px] text-slate-500">{openingPositions.length} leaks to practice</p>
                    )}
                    {mode.id === "weakness" && weakMotifs.length > 0 && (
                      <p className="mt-2 text-[11px] text-slate-500">Targeting: {weakMotifs.slice(0, 3).map(m => m.motif).join(", ")}</p>
                    )}
                    {mode.id === "endgame" && weakEndgames.length > 0 && (
                      <p className="mt-2 text-[11px] text-slate-500">Focus: {weakEndgames.slice(0, 2).map(e => e.type).join(", ")}</p>
                    )}
                    {!actuallyDisabled && (
                      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-white/60 transition-colors group-hover:text-white">
                        Start training
                        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                    {actuallyDisabled && (
                      <p className="mt-3 text-[11px] text-slate-500">
                        {reports.length === 0
                          ? "Requires a scan report"
                          : mode.id === "blunder"
                          ? "Run a scan with tactics analysis to unlock"
                          : mode.id === "opening"
                          ? "Run an opening scan to unlock"
                          : "No data available"}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* Active training session                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {activeMode && !sessionDone && (
          <div className="space-y-6">
            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span className="text-sm font-medium text-white">{solved}</span>
                <span className="text-xs text-slate-500">solved</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400">✗</span>
                <span className="text-sm font-medium text-white">{failed}</span>
                <span className="text-xs text-slate-500">missed</span>
              </div>
              {coinsEarned > 0 && (
                <div className="flex items-center gap-1.5">
                  <span>🪙</span>
                  <span className="text-sm font-medium text-amber-400">+{coinsEarned}</span>
                </div>
              )}
              {activeMode === "speed" && (
                <div className={`ml-auto flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-bold ${
                  timeLeft <= 30 ? "bg-red-500/20 text-red-400" :
                  timeLeft <= 60 ? "bg-amber-500/20 text-amber-400" :
                  "bg-white/[0.04] text-white"
                }`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(timeLeft)}
                </div>
              )}
              <button
                onClick={() => setShowHint((h) => !h)}
                className={`ml-auto rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  showHint
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                }`}
              >
                💡 Hint
              </button>
            </div>

            {/* Speed drill pre-start */}
            {activeMode === "speed" && !speedActive && puzzles.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <p className="text-lg font-bold text-white">Ready?</p>
                <p className="mt-2 text-sm text-slate-400">
                  Solve as many puzzles as you can in {speedTime} minutes
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={() => { setSpeedTime(3); setTimeLeft(180); }}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      speedTime === 3
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                        : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                    }`}
                  >
                    3 min
                  </button>
                  <button
                    onClick={() => { setSpeedTime(5); setTimeLeft(300); }}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      speedTime === 5
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                        : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                    }`}
                  >
                    5 min
                  </button>
                </div>
                <button
                  onClick={() => setSpeedActive(true)}
                  className="mt-6 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-amber-500/25 active:scale-95"
                >
                  Start ⚡
                </button>
              </div>
            )}

            {/* Puzzle board (weakness, speed, endgame modes) */}
            {(activeMode === "weakness" || (activeMode === "speed" && speedActive) || activeMode === "endgame") && (
              <>
                {loadingPuzzles && (
                  <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
                    <span className="ml-3 text-sm text-slate-400">Loading puzzles...</span>
                  </div>
                )}
                {!loadingPuzzles && puzzleFen && currentPuzzleData && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono">
                        {currentPuzzleData.matchedTheme}
                      </span>
                      {activeMode !== "speed" && (
                        <span>Puzzle {currentPuzzle + 1} of {puzzles.length}</span>
                      )}
                    </div>
                    <PuzzleBoard
                      key={`${currentPuzzleData.puzzle.id}-${currentPuzzle}`}
                      fen={puzzleFen}
                      solutionMoves={currentPuzzleData.puzzle.solution}
                      orientation={puzzleOrientation}
                      onSolved={handlePuzzleSolved}
                      onFailed={handlePuzzleFailed}
                      showHint={showHint}
                    />
                  </div>
                )}
                {!loadingPuzzles && puzzles.length === 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                    <p className="text-sm text-slate-400">
                      No puzzles found for your weakness themes. Try running a scan first.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Drill board (blunder, opening modes) */}
            {(activeMode === "blunder" || activeMode === "opening") && (
              <>
                {drillPositions.length === 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                    <p className="text-sm text-slate-400">
                      No {activeMode === "blunder" ? "blunder" : "opening"} positions found. Run a scan first.
                    </p>
                  </div>
                )}
                {drillPositions.length > 0 && currentDrill < drillPositions.length && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-white/[0.06] px-2 py-0.5">
                        {drillPositions[currentDrill].label}
                      </span>
                      <span>Position {currentDrill + 1} of {drillPositions.length}</span>
                      {drillPositions[currentDrill].cpLoss != null && (
                        <span className="text-red-400">
                          -{drillPositions[currentDrill].cpLoss} cp
                        </span>
                      )}
                    </div>
                    <SimplePuzzleBoard
                      key={`drill-${currentDrill}`}
                      position={drillPositions[currentDrill]}
                      onResult={handleDrillResult}
                      showHint={showHint}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* Session complete                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}

        {sessionDone && (
          <div className="mx-auto max-w-md rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-8 text-center">
            <div className="mb-4 text-4xl">
              {solved > failed ? "🏆" : solved > 0 ? "💪" : "📚"}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {activeMode === "speed" ? "Time's Up!" : "Session Complete"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {solved + failed > 0
                ? `You solved ${solved} out of ${solved + failed} puzzles (${Math.round((solved / (solved + failed)) * 100)}%)`
                : "No puzzles attempted"}
            </p>

            <div className="mt-6 flex justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{solved}</p>
                <p className="text-xs text-slate-500">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{failed}</p>
                <p className="text-xs text-slate-500">Missed</p>
              </div>
              {coinsEarned > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">+{coinsEarned}</p>
                  <p className="text-xs text-slate-500">Coins</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => startMode(activeMode!)}
                className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-fuchsia-500/25 active:scale-95"
              >
                Play Again
              </button>
              <button
                onClick={goBack}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                Choose Mode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
