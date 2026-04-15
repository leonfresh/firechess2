"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { useSession } from "@/components/session-provider";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";
import type { MissedTactic } from "@/lib/types";
import { getSRSQueue, recordResult, getSRSStats } from "@/lib/srs";
import {
  ChessQuiz,
  getDailyQuizQuestions,
  type QuizQuestion,
} from "@/components/chess-quiz";
import {
  PieceMemory,
  getDailyMemoryPositions,
  type MemoryPosition,
} from "@/components/piece-memory";

/* ─────────────────────────────── Types ─────────────────────────────── */

type LichessPuzzle = {
  game: {
    id: string;
    pgn: string;
    players: { name: string; color: string; rating: number }[];
  };
  puzzle: {
    id: string;
    rating: number;
    solution: string[];
    themes: string[];
    initialPly: number;
  };
  matchedTheme: string;
};

type SavedReport = {
  missedTactics: MissedTactic[];
  leaks: any[];
  diagnostics: any;
  playerRating?: number | null;
};

type TaskIntro = {
  icon: string;
  headline: string;
  body: string;
};

type DailyTask =
  | { type: "puzzle"; puzzle: LichessPuzzle; intro: TaskIntro }
  | { type: "blunder"; tactic: MissedTactic; intro: TaskIntro }
  | { type: "quiz"; question: QuizQuestion; intro: TaskIntro }
  | { type: "memory"; position: MemoryPosition; intro: TaskIntro };

type TaskResult = "pending" | "correct" | "wrong";

type PageState =
  | "loading"
  | "unauthenticated"
  | "no-reports"
  | "no-data"
  | "session"
  | "complete";

/* ─────────────────────────────── Constants / theme map ─────────────── */

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
  "Forcing Capture": "crushing",
  "Winning Blunder": "crushing",
  "Major Miss": "crushing",
};

const FALLBACK_THEMES = [
  "fork",
  "pin",
  "sacrifice",
  "hangingPiece",
  "backRankMate",
];
const ROUTINE_KEY = "fc-daily-routine";

const THEME_DISPLAY: Record<string, string> = {
  fork: "fork",
  pin: "pin",
  skewer: "skewer",
  discoveredAttack: "discovered attack",
  doubleCheck: "double check",
  backRankMate: "back-rank checkmate",
  sacrifice: "sacrifice",
  deflection: "deflection",
  intermezzo: "in-between move",
  trappedPiece: "trapped piece",
  hangingPiece: "hanging piece",
  mate: "mating pattern",
  crushing: "forcing sequence",
};

function buildPuzzleIntro(puzzle: LichessPuzzle): TaskIntro {
  const raw = puzzle.matchedTheme;
  const display = raw ? (THEME_DISPLAY[raw] ?? raw) : "tactical pattern";
  return {
    icon: "🧩",
    headline: `Train your ${display} vision`,
    body: `This puzzle was selected because you've struggled with ${display} patterns in your games. Solving it sharpens your pattern recognition when it counts most.`,
  };
}

function buildBlunderIntro(
  tactic: MissedTactic,
  card?: { reps: number; interval: number },
): TaskIntro {
  const motifRaw = tactic.tags?.[0];
  const motifTheme = motifRaw ? MOTIF_TO_THEME[motifRaw] : undefined;
  const motifDisplay = motifTheme
    ? (THEME_DISPLAY[motifTheme] ?? "tactical")
    : "tactical";

  // Spaced repetition context line
  let srsSuffix = "";
  if (card) {
    if (card.reps === 0) srsSuffix = " First time seeing this one.";
    else if (card.interval >= 14)
      srsSuffix = ` You've seen this ${card.reps} time${card.reps !== 1 ? "s" : ""} — keep the streak going.`;
    else srsSuffix = ` Review #${card.reps + 1} — pattern reinforcement.`;
  }

  return {
    icon: card && card.reps > 0 ? "🔁" : "⚠️",
    headline:
      card && card.reps > 0
        ? `Revisit your move ${tactic.moveNumber} mistake`
        : `Fix your move ${tactic.moveNumber} blunder`,
    body: `On move ${tactic.moveNumber} you missed a ${motifDisplay} opportunity. This position is taken directly from your own game — let's drill until it becomes automatic.${srsSuffix}`,
  };
}

/* ─────────────────────────────── Helpers ────────────────────────────── */

function dayOfYear(): number {
  const now = new Date();
  return Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function getWeakThemes(reports: SavedReport[]): string[] {
  const counts = new Map<string, number>();
  for (const r of reports) {
    for (const t of r.missedTactics ?? []) {
      for (const tag of t.tags ?? []) {
        const theme = MOTIF_TO_THEME[tag];
        if (theme) counts.set(theme, (counts.get(theme) ?? 0) + 1);
      }
    }
  }
  return [
    ...new Set(
      [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t),
    ),
  ].slice(0, 5);
}

function buildBlunderPool(reports: SavedReport[]): MissedTactic[] {
  return reports.flatMap((r) =>
    (r.missedTactics ?? []).filter(
      (t) => t.fenBefore && t.bestMove && t.cpLoss > 50,
    ),
  );
}

function parsePgnMoves(pgn: string): string[] {
  return pgn
    .replace(/\{[^}]*\}/g, "")
    .replace(/\d+\.{3}/g, "")
    .replace(/\d+\./g, "")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));
}

function setupPuzzlePosition(pgn: string, initialPly: number) {
  const chess = new Chess();
  const moves = parsePgnMoves(pgn);
  for (let i = 0; i < Math.min(initialPly, moves.length); i++) {
    try {
      chess.move(moves[i]);
    } catch {
      break;
    }
  }
  const preTriggerFen = chess.fen();
  let triggerFrom = "",
    triggerTo = "",
    postTriggerFen = preTriggerFen;
  if (initialPly < moves.length) {
    try {
      const result = chess.move(moves[initialPly]);
      if (result) {
        triggerFrom = result.from;
        triggerTo = result.to;
        postTriggerFen = chess.fen();
      }
    } catch {}
  }
  const solverColor: "white" | "black" =
    new Chess(postTriggerFen).turn() === "w" ? "white" : "black";
  return { preTriggerFen, postTriggerFen, triggerFrom, triggerTo, solverColor };
}

function parseUci(move: string) {
  return {
    from: move.slice(0, 2) as CbSquare,
    to: move.slice(2, 4) as CbSquare,
    promotion: (move.slice(4, 5) || undefined) as "q" | undefined,
  };
}

/* ─────────────────────────────── Streak helpers ─────────────────────── */

function getTodayStr() {
  return new Date().toDateString();
}

function loadRoutineData(): {
  completedToday: boolean;
  streak: number;
  correctCount: number;
  totalCount: number;
} {
  if (typeof window === "undefined")
    return { completedToday: false, streak: 0, correctCount: 0, totalCount: 0 };
  try {
    const raw = localStorage.getItem(ROUTINE_KEY);
    if (!raw)
      return {
        completedToday: false,
        streak: 0,
        correctCount: 0,
        totalCount: 0,
      };
    const data = JSON.parse(raw);
    const todayStr = getTodayStr();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toDateString();
    const completedToday = data.date === todayStr;
    const streak =
      data.lastCompleted === todayStr || data.lastCompleted === yStr
        ? (data.streak ?? 1)
        : 0;
    return {
      completedToday,
      streak,
      correctCount: data.correctCount ?? 0,
      totalCount: data.totalCount ?? 0,
    };
  } catch {
    return { completedToday: false, streak: 0, correctCount: 0, totalCount: 0 };
  }
}

function saveRoutine(streak: number, correctCount: number, totalCount: number) {
  localStorage.setItem(
    ROUTINE_KEY,
    JSON.stringify({
      date: getTodayStr(),
      lastCompleted: getTodayStr(),
      streak,
      correctCount,
      totalCount,
    }),
  );
}

/* ─────────────────────────────── MoveIndicator ───────────────────────── */

function MoveIndicator({
  square,
  type,
  orientation,
  boardSize,
}: {
  square: string;
  type: "correct" | "wrong";
  orientation: "white" | "black";
  boardSize: number;
}) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  const sqSize = boardSize / 8;
  const x = orientation === "white" ? file * sqSize : (7 - file) * sqSize;
  const y = orientation === "white" ? (7 - rank) * sqSize : rank * sqSize;
  const size = Math.max(18, Math.round(sqSize * 0.36));
  return (
    <div
      className="pointer-events-none absolute z-20 flex items-center justify-center rounded-full font-bold shadow-lg"
      style={{
        left: x + sqSize - size - 2,
        top: y + 2,
        width: size,
        height: size,
        fontSize: size * 0.65,
        lineHeight: 1,
        backgroundColor: type === "correct" ? "#22c55e" : "#ef4444",
        color: "#fff",
      }}
    >
      {type === "correct" ? "✓" : "✗"}
    </div>
  );
}

/* ─────────────────────────────── BlunderBoard ───────────────────────── */

function BlunderBoard({
  tactic,
  onComplete,
}: {
  tactic: MissedTactic;
  onComplete: (correct: boolean) => void;
}) {
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(400);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const [game, setGame] = useState(() => new Chess(tactic.fenBefore));
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">(
    "playing",
  );
  const [attempts, setAttempts] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [indicator, setIndicator] = useState<{
    sq: string;
    type: "correct" | "wrong";
  } | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<
    Record<string, React.CSSProperties>
  >({});
  const MAX_TRIES = 3;

  const orientation = useMemo<"white" | "black">(
    () => (new Chess(tactic.fenBefore).turn() === "w" ? "white" : "black"),
    [tactic.fenBefore],
  );
  const expected = useMemo(() => parseUci(tactic.bestMove), [tactic.bestMove]);

  // Board autoscale
  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setBoardSize(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    preloadSounds();
  }, []);

  const handleDrop = useCallback(
    (from: CbSquare, to: CbSquare) => {
      if (status !== "playing") return false;
      setSelectedSquare(null);
      setLegalMoveSquares({});

      // Reject illegal moves silently — no life penalty
      const isLegal = game
        .moves({ verbose: true })
        .some((m: any) => m.from === from && m.to === to);
      if (!isLegal) return false;

      // Accept expected move OR any move that delivers checkmate
      const testG = new Chess(game.fen());
      try {
        testG.move({ from, to, promotion: "q" });
      } catch {}
      const deliversMate = testG.isCheckmate();

      if ((from === expected.from && to === expected.to) || deliversMate) {
        const g = new Chess(game.fen());
        try {
          g.move({ from, to, promotion: expected.promotion ?? "q" });
        } catch {
          return false;
        }
        playSound("correct");
        setGame(new Chess(g.fen()));
        setIndicator({ sq: to, type: "correct" });
        setStatus("correct");
        earnCoins("study_task");
        // Record correct result in SRS
        recordResult(tactic.fenBefore, tactic.bestMove, tactic.cpLoss, true);
        setTimeout(() => onComplete(true), 900);
        return true;
      }

      playSound("wrong");
      setIndicator({ sq: to, type: "wrong" });
      const next = attempts + 1;
      setAttempts(next);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setIndicator(null), 800);

      if (next >= MAX_TRIES) {
        setStatus("wrong");
        // Record wrong result in SRS — will show again tomorrow
        recordResult(tactic.fenBefore, tactic.bestMove, tactic.cpLoss, false);
        setTimeout(() => {
          const g = new Chess(game.fen());
          try {
            g.move({
              from: expected.from,
              to: expected.to,
              promotion: expected.promotion ?? "q",
            });
            setGame(new Chess(g.fen()));
          } catch {}
        }, 500);
        setTimeout(() => onComplete(false), 2200);
      }
      return false;
    },
    [game, expected, status, attempts, onComplete],
  );

  const handleSquareClick = useCallback(
    (square: CbSquare) => {
      if (status !== "playing") return;

      // Clicking a highlighted legal-move square → execute move
      if (selectedSquare && legalMoveSquares[square]) {
        const from = selectedSquare as CbSquare;
        setSelectedSquare(null);
        setLegalMoveSquares({});
        handleDrop(from, square);
        return;
      }

      // Select a piece and show its legal move dots
      const piece = game.get(square as any);
      const isOwnPiece =
        piece &&
        (orientation === "white" ? piece.color === "w" : piece.color === "b");
      if (!isOwnPiece) {
        setSelectedSquare(null);
        setLegalMoveSquares({});
        return;
      }

      const moves = game.moves({ square: square as any, verbose: true });
      if (moves.length === 0) {
        setSelectedSquare(null);
        setLegalMoveSquares({});
        return;
      }

      setSelectedSquare(square);
      const styles: Record<string, React.CSSProperties> = {
        [square]: { backgroundColor: "rgba(255, 255, 0, 0.25)" },
      };
      for (const move of moves) {
        const isCapture = !!game.get(move.to as any);
        styles[move.to] = isCapture
          ? {
              background:
                "radial-gradient(circle, transparent 68%, rgba(255,0,0,0.55) 69%)",
            }
          : {
              background:
                "radial-gradient(circle, rgba(0,180,0,0.75) 14%, transparent 15%)",
            };
      }
      setLegalMoveSquares(styles);
    },
    [game, selectedSquare, legalMoveSquares, status, orientation, handleDrop],
  );

  const customSquareStyles: Record<string, React.CSSProperties> = {
    ...legalMoveSquares,
  };
  if (status === "wrong") {
    customSquareStyles[expected.from] = {
      boxShadow: "inset 0 0 16px 4px rgba(239,68,68,0.5)",
    };
    customSquareStyles[expected.to] = {
      boxShadow: "inset 0 0 16px 4px rgba(34,197,94,0.5)",
    };
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-xs">
        <div
          className={`h-3 w-3 rounded-full border ${
            orientation === "white"
              ? "border-slate-400 bg-white"
              : "border-slate-500 bg-slate-800"
          }`}
        />
        <span className="text-slate-400">Your turn as {orientation}</span>
      </div>

      <div
        ref={boardContainerRef}
        className={`relative w-full max-w-[440px] overflow-hidden rounded-xl shadow-2xl transition-transform ${
          shaking ? "animate-[shake_0.3s_ease-in-out]" : ""
        }`}
      >
        <Chessboard
          id="daily-blunder"
          position={game.fen()}
          onPieceDrop={handleDrop}
          onSquareClick={handleSquareClick}
          boardOrientation={orientation}
          boardWidth={boardSize}
          animationDuration={200}
          arePiecesDraggable={status === "playing"}
          customSquareStyles={customSquareStyles}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          customPieces={customPieces}
        />
        {indicator && (
          <MoveIndicator
            square={indicator.sq}
            type={indicator.type}
            orientation={orientation}
            boardSize={boardSize}
          />
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: MAX_TRIES }).map((_, i) => (
          <span
            key={i}
            className={`text-base transition-all ${
              i < MAX_TRIES - attempts ? "opacity-100" : "scale-75 opacity-20"
            }`}
          >
            ❤️
          </span>
        ))}
      </div>

      {status === "correct" && (
        <p className="text-sm font-medium text-emerald-400">✓ Correct!</p>
      )}
      {status === "wrong" && (
        <p className="text-sm font-medium text-red-400">
          Out of tries — correct move shown
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────── LichessPuzzleBoard ─────────────────── */

function LichessPuzzleBoard({
  puzzle,
  onComplete,
}: {
  puzzle: LichessPuzzle;
  onComplete: (correct: boolean) => void;
}) {
  const setup = useMemo(
    () => setupPuzzlePosition(puzzle.game.pgn, puzzle.puzzle.initialPly),
    [puzzle],
  );
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(400);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();

  const [game, setGame] = useState(() => new Chess(setup.preTriggerFen));
  const [moveIndex, setMoveIndex] = useState(-1);
  const [status, setStatus] = useState<
    "setup" | "playing" | "correct" | "wrong"
  >("setup");
  const [attempts, setAttempts] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [indicator, setIndicator] = useState<{
    sq: string;
    type: "correct" | "wrong";
  } | null>(null);
  const [lastOppMove, setLastOppMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<
    Record<string, React.CSSProperties>
  >({});

  const MAX_TRIES = 3;
  const orientation = setup.solverColor;
  const solution = puzzle.puzzle.solution;

  // Board autoscale
  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setBoardSize(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    preloadSounds();
    const timer = setTimeout(() => {
      if (setup.triggerFrom && setup.triggerTo) {
        const g = new Chess(setup.preTriggerFen);
        try {
          g.move({
            from: setup.triggerFrom as CbSquare,
            to: setup.triggerTo as CbSquare,
            promotion: "q",
          });
          playSound("move");
          setGame(new Chess(g.fen()));
          setLastOppMove({ from: setup.triggerFrom, to: setup.triggerTo });
        } catch {}
      }
      setMoveIndex(0);
      setStatus("playing");
    }, 600);
    return () => clearTimeout(timer);
  }, [setup]);

  const handleDrop = useCallback(
    (from: CbSquare, to: CbSquare) => {
      if (status !== "playing" || moveIndex < 0) return false;
      setSelectedSquare(null);
      setLegalMoveSquares({});

      const expectedUci = solution[moveIndex];
      if (!expectedUci) return false;
      const exp = parseUci(expectedUci);

      // Reject illegal moves silently — no life penalty
      const isLegal = game
        .moves({ verbose: true })
        .some((m: any) => m.from === from && m.to === to);
      if (!isLegal) return false;

      // Accept expected move OR any move that delivers checkmate
      const testG = new Chess(game.fen());
      try {
        testG.move({ from, to, promotion: "q" });
      } catch {}
      const deliversMate = testG.isCheckmate();

      if ((from === exp.from && to === exp.to) || deliversMate) {
        const g = new Chess(game.fen());
        try {
          g.move({ from, to, promotion: exp.promotion ?? "q" });
        } catch {
          return false;
        }
        playSound("correct");
        setGame(new Chess(g.fen()));
        setIndicator({ sq: to, type: "correct" });

        const next = moveIndex + 1;
        if (deliversMate || next >= solution.length) {
          setStatus("correct");
          earnCoins("study_task");
          setTimeout(() => onComplete(true), 900);
          return true;
        }

        // Apply opponent's reply
        const opp = solution[next];
        const oppParsed = parseUci(opp);
        setTimeout(() => {
          setIndicator(null);
          const g2 = new Chess(g.fen());
          try {
            g2.move({
              from: oppParsed.from,
              to: oppParsed.to,
              promotion: oppParsed.promotion ?? "q",
            });
            playSound(g2.isCheck() ? "check" : "move");
            setGame(new Chess(g2.fen()));
            setLastOppMove({ from: oppParsed.from, to: oppParsed.to });
            setMoveIndex(next + 1);
          } catch {
            setStatus("correct");
            earnCoins("study_task");
            setTimeout(() => onComplete(true), 400);
          }
        }, 400);

        setMoveIndex(next);
        setAttempts(0);
        return true;
      }

      playSound("wrong");
      setIndicator({ sq: to, type: "wrong" });
      const na = attempts + 1;
      setAttempts(na);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setIndicator(null), 800);

      if (na >= MAX_TRIES) {
        setStatus("wrong");
        setTimeout(() => {
          const g = new Chess(game.fen());
          try {
            g.move({
              from: exp.from,
              to: exp.to,
              promotion: exp.promotion ?? "q",
            });
            setGame(new Chess(g.fen()));
          } catch {}
        }, 500);
        setTimeout(() => onComplete(false), 2200);
      }
      return false;
    },
    [game, moveIndex, solution, status, attempts, onComplete],
  );

  const handleSquareClick = useCallback(
    (square: CbSquare) => {
      if (status !== "playing") return;

      // Clicking a highlighted legal-move square → execute move
      if (selectedSquare && legalMoveSquares[square]) {
        const from = selectedSquare as CbSquare;
        setSelectedSquare(null);
        setLegalMoveSquares({});
        handleDrop(from, square);
        return;
      }

      // Select a piece and show its legal move dots
      const piece = game.get(square as any);
      const isOwnPiece =
        piece &&
        (orientation === "white" ? piece.color === "w" : piece.color === "b");
      if (!isOwnPiece) {
        setSelectedSquare(null);
        setLegalMoveSquares({});
        return;
      }

      const moves = game.moves({ square: square as any, verbose: true });
      if (moves.length === 0) {
        setSelectedSquare(null);
        setLegalMoveSquares({});
        return;
      }

      setSelectedSquare(square);
      const styles: Record<string, React.CSSProperties> = {
        [square]: { backgroundColor: "rgba(255, 255, 0, 0.25)" },
      };
      for (const move of moves) {
        const isCapture = !!game.get(move.to as any);
        styles[move.to] = isCapture
          ? {
              background:
                "radial-gradient(circle, transparent 68%, rgba(255,0,0,0.55) 69%)",
            }
          : {
              background:
                "radial-gradient(circle, rgba(0,180,0,0.75) 14%, transparent 15%)",
            };
      }
      setLegalMoveSquares(styles);
    },
    [game, selectedSquare, legalMoveSquares, status, orientation, handleDrop],
  );

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastOppMove && status === "playing") {
    customSquareStyles[lastOppMove.from] = {
      backgroundColor: "rgba(255,170,0,0.3)",
    };
    customSquareStyles[lastOppMove.to] = {
      backgroundColor: "rgba(255,170,0,0.45)",
    };
  }
  // Overlay legal move dots (after opp-move highlights)
  Object.assign(customSquareStyles, legalMoveSquares);
  if (status === "wrong") {
    const exp = solution[moveIndex];
    if (exp) {
      customSquareStyles[exp.slice(0, 2)] = {
        boxShadow: "inset 0 0 16px 4px rgba(239,68,68,0.5)",
      };
      customSquareStyles[exp.slice(2, 4)] = {
        boxShadow: "inset 0 0 16px 4px rgba(34,197,94,0.5)",
      };
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-xs">
        <div
          className={`h-3 w-3 rounded-full border ${
            orientation === "white"
              ? "border-slate-400 bg-white"
              : "border-slate-500 bg-slate-800"
          }`}
        />
        <span className="text-slate-400">Your turn as {orientation}</span>
      </div>

      <div
        ref={boardContainerRef}
        className={`relative w-full max-w-[440px] overflow-hidden rounded-xl shadow-2xl ${
          shaking ? "animate-[shake_0.3s_ease-in-out]" : ""
        }`}
      >
        <Chessboard
          id="daily-puzzle"
          position={game.fen()}
          onPieceDrop={handleDrop}
          onSquareClick={handleSquareClick}
          boardOrientation={orientation}
          boardWidth={boardSize}
          animationDuration={200}
          arePiecesDraggable={status === "playing"}
          customSquareStyles={customSquareStyles}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          customPieces={customPieces}
        />
        {indicator && (
          <MoveIndicator
            square={indicator.sq}
            type={indicator.type}
            orientation={orientation}
            boardSize={boardSize}
          />
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {status === "playing" &&
          Array.from({ length: MAX_TRIES }).map((_, i) => (
            <span
              key={i}
              className={`text-base transition-all ${
                i < MAX_TRIES - attempts ? "opacity-100" : "scale-75 opacity-20"
              }`}
            >
              ❤️
            </span>
          ))}
      </div>

      {status === "correct" && (
        <p className="text-sm font-medium text-emerald-400">✓ Correct!</p>
      )}
      {status === "wrong" && (
        <p className="text-sm font-medium text-red-400">
          Out of tries — correct move shown
        </p>
      )}
      {puzzle.puzzle.rating > 0 && (
        <p className="text-xs text-slate-600">
          Lichess puzzle · {puzzle.puzzle.themes.slice(0, 3).join(", ")} · ★{" "}
          {puzzle.puzzle.rating}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────── TaskIntroCard ─────────────────────── */

function TaskIntroCard({
  intro,
  onStart,
}: {
  intro: TaskIntro;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-4xl">
        {intro.icon}
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">{intro.headline}</h2>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-400">
          {intro.body}
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-400"
      >
        Start →
      </button>
    </div>
  );
}

/* ─────────────────────────────── DailyPage ─────────────────────────── */

export default function DailyPage() {
  const { authenticated, loading: sessionLoading } = useSession();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [taskKey, setTaskKey] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(
    null,
  );
  const [streak, setStreak] = useState(0);
  const [completedCorrect, setCompletedCorrect] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [hasTacticsScan, setHasTacticsScan] = useState(true);
  const [taskPhase, setTaskPhase] = useState<"intro" | "playing">("intro");
  const [srsStats, setSrsStats] = useState<{
    dueToday: number;
    totalSeen: number;
    totalCards: number;
  } | null>(null);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  useEffect(() => {
    if (sessionLoading) return;
    if (!authenticated) {
      setPageState("unauthenticated");
      return;
    }

    const routineData = loadRoutineData();
    if (routineData.completedToday) {
      setStreak(routineData.streak);
      setCompletedCorrect(routineData.correctCount);
      setCompletedTotal(routineData.totalCount);
      setPageState("complete");
      return;
    }

    setStreak(routineData.streak);

    fetch("/api/reports")
      .then((r) => r.json())
      .then(async (data) => {
        const reports: SavedReport[] = data.reports ?? [];
        if (reports.length === 0) {
          setPageState("no-reports");
          return;
        }

        // Check if any scan has tactics data
        const tacticsAvailable = reports.some(
          (r) =>
            (r.missedTactics?.length ?? 0) > 0 &&
            (r as any).scanMode !== "openings",
        );
        setHasTacticsScan(tacticsAvailable);

        // Compute SRS stats from the full blunder pool for display
        if (tacticsAvailable) {
          const fullPool = buildBlunderPool(reports);
          setSrsStats(getSRSStats(fullPool));
        }

        // Derive user's chess rating from the most recent report that has it
        const userRating =
          reports.find((r) => r.playerRating)?.playerRating ?? null;

        // Map rating to quiz difficulty bracket
        const quizDifficulty: QuizQuestion["difficulty"] =
          userRating === null
            ? undefined
            : userRating >= 1700
              ? "advanced"
              : userRating >= 1200
                ? "intermediate"
                : "beginner";

        // Build blunder pool using SRS queue — surfaces positions due for review today
        const pool = tacticsAvailable ? buildBlunderPool(reports) : [];
        // getSRSQueue returns new + due positions sorted by priority; cap at 3 per session
        const blunders = getSRSQueue(pool, 3);

        // Determine puzzle themes from weak motifs, or fall back to generic
        const weakThemes = getWeakThemes(reports);
        const themes = [...new Set([...weakThemes, ...FALLBACK_THEMES])].slice(
          0,
          5,
        );

        // Fetch Lichess puzzles — pass rating so Lichess targets appropriate difficulty
        let lichessPuzzles: LichessPuzzle[] = [];
        try {
          const ratingParam = userRating ? `&rating=${userRating}` : "";
          const res = await fetch(
            `/api/puzzles?themes=${themes.join(",")}&count=5${ratingParam}`,
          );
          const pData = await res.json();
          lichessPuzzles = pData.puzzles ?? [];
        } catch {}

        // Build task list — interleave puzzles and blunders
        const taskList: DailyTask[] = [];
        let pi = 0;
        let bi = 0;
        while (pi < lichessPuzzles.length || bi < blunders.length) {
          if (pi < lichessPuzzles.length) {
            const p = lichessPuzzles[pi++];
            taskList.push({
              type: "puzzle",
              puzzle: p,
              intro: buildPuzzleIntro(p),
            });
          }
          if (pi < lichessPuzzles.length) {
            const p = lichessPuzzles[pi++];
            taskList.push({
              type: "puzzle",
              puzzle: p,
              intro: buildPuzzleIntro(p),
            });
          }
          if (bi < blunders.length) {
            const t = blunders[bi++];
            // Load existing SRS card for the intro context
            const { getCard } = await import("@/lib/srs");
            const card = getCard(t.fenBefore, t.bestMove, t.cpLoss);
            taskList.push({
              type: "blunder",
              tactic: t,
              intro: buildBlunderIntro(t, card),
            });
          }
        }
        while (pi < lichessPuzzles.length) {
          const p = lichessPuzzles[pi++];
          taskList.push({
            type: "puzzle",
            puzzle: p,
            intro: buildPuzzleIntro(p),
          });
        }

        // Add quiz and memory tasks at natural break points
        const quizQs = getDailyQuizQuestions(1, dayOfYear(), quizDifficulty);
        const memoryPs = getDailyMemoryPositions(1, dayOfYear());
        if (quizQs.length > 0) {
          const difficultyLabel =
            quizDifficulty === "advanced"
              ? "Advanced level"
              : quizDifficulty === "intermediate"
                ? "Intermediate level"
                : quizDifficulty === "beginner"
                  ? "Foundations"
                  : "Chess Knowledge Check";
          taskList.splice(Math.min(2, taskList.length), 0, {
            type: "quiz",
            question: quizQs[0],
            intro: {
              icon: "🧠",
              headline: difficultyLabel + " — Knowledge Check",
              body:
                quizDifficulty === "advanced"
                  ? "A question calibrated to your level. These are the nuances that separate good players from great ones."
                  : quizDifficulty === "intermediate"
                    ? "A question on chess strategy and technique — material matched to your current rating range."
                    : "A quick question to test your understanding of chess principles — no board needed.",
            },
          });
        }
        if (memoryPs.length > 0) {
          taskList.splice(Math.min(5, taskList.length), 0, {
            type: "memory",
            position: memoryPs[0],
            intro: {
              icon: "👁️",
              headline: "Visualization Training",
              body: "Strong players can picture positions with their eyes closed. You have 5 seconds to memorize this position — then answer from memory.",
            },
          });
        }

        // If we still have nothing (Lichess down + no blunders) show fetch error
        if (taskList.length === 0) {
          setPageState("no-data");
          return;
        }

        setTasks(taskList);
        setResults(new Array(taskList.length).fill("pending") as TaskResult[]);
        setPageState("session");
      })
      .catch(() => setPageState("no-data"));
  }, [authenticated, sessionLoading]);

  const handleTaskComplete = useCallback(
    (correct: boolean) => {
      const result: TaskResult = correct ? "correct" : "wrong";
      setLastResult(result);
      setResults((prev) => {
        const next = [...prev];
        next[currentIdx] = result;
        return next;
      });
    },
    [currentIdx],
  );

  const handleNext = useCallback(() => {
    const nextIdx = currentIdx + 1;

    if (nextIdx >= tasks.length) {
      // Session complete — count results including the final task
      const finalResults = [...results];
      finalResults[currentIdx] = lastResult === "correct" ? "correct" : "wrong";
      const correctCount = finalResults.filter((r) => r === "correct").length;
      const total = finalResults.length;
      const newStreak = streak + 1;
      saveRoutine(newStreak, correctCount, total);
      setStreak(newStreak);
      setCompletedCorrect(correctCount);
      setCompletedTotal(total);
      setPageState("complete");
    } else {
      setCurrentIdx(nextIdx);
      setLastResult(null);
      setTaskPhase("intro");
    }
  }, [currentIdx, tasks.length, results, lastResult, streak]);

  const isLastTask = currentIdx === tasks.length - 1;
  const currentTask = tasks[currentIdx] ?? null;

  /* ── Render: Loading ── */
  if (pageState === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-amber-400" />
          <p className="text-sm text-slate-500">Loading today's session…</p>
        </div>
      </main>
    );
  }

  /* ── Render: Unauthenticated ── */
  if (pageState === "unauthenticated") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
        <div className="max-w-sm text-center">
          <div className="mb-4 text-5xl">📅</div>
          <h1 className="mb-2 text-2xl font-bold text-white">Daily Training</h1>
          <p className="mb-6 text-sm leading-relaxed text-slate-400">
            Sign in to get your personalized daily training routine — puzzles
            and drills drawn from your own games.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-400"
          >
            Sign in to start
          </Link>
        </div>
      </main>
    );
  }

  /* ── Render: No reports (first-time user) ── */
  if (pageState === "no-reports") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
        <div className="max-w-sm text-center">
          <div className="mb-4 text-5xl">🔍</div>
          <h1 className="mb-2 text-2xl font-bold text-white">No data yet</h1>
          <p className="mb-6 text-sm leading-relaxed text-slate-400">
            Run a game scan first — your daily routine is built from your actual
            mistakes so every exercise is relevant to you.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-400"
          >
            Scan my games
          </Link>
        </div>
      </main>
    );
  }

  /* ── Render: No data (Lichess down, no blunders available either) ── */
  if (pageState === "no-data") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
        <div className="max-w-sm text-center">
          <div className="mb-4 text-5xl">⚡</div>
          <h1 className="mb-2 text-2xl font-bold text-white">
            Couldn't load today's session
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-slate-400">
            Puzzle data from Lichess is temporarily unavailable. Try again in a
            moment.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-400"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  /* ── Render: Complete ── */
  if (pageState === "complete") {
    const scorePercent =
      completedTotal > 0
        ? Math.round((completedCorrect / completedTotal) * 100)
        : 0;
    const isGreat = scorePercent >= 80;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
        <div className="w-full max-w-md">
          {/* Completion card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
            <div className="mb-2 text-5xl">{isGreat ? "🎉" : "💪"}</div>
            <h1 className="mb-1 text-2xl font-bold text-white">
              {isGreat ? "Session complete!" : "Session complete"}
            </h1>
            <p className="mb-6 text-sm text-slate-400">
              {isGreat
                ? "Great work — see you tomorrow."
                : "Keep at it — consistency beats perfection."}
            </p>

            {/* Score */}
            <div className="mb-4 flex justify-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-white">
                  {completedCorrect}/{completedTotal}
                </p>
                <p className="text-xs text-slate-500">correct</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-amber-400">
                  🔥 {streak}
                </p>
                <p className="text-xs text-slate-500">day streak</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                style={{ width: `${scorePercent}%` }}
              />
            </div>

            {/* Result dots */}
            {completedTotal > 0 && (
              <div className="mb-6 flex justify-center gap-1.5 flex-wrap">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-full ${
                      r === "correct"
                        ? "bg-emerald-500"
                        : r === "wrong"
                          ? "bg-red-500"
                          : "bg-white/10"
                    }`}
                    title={`Task ${i + 1}: ${r}`}
                  />
                ))}
              </div>
            )}

            <p className="mb-6 text-xs text-slate-600">
              Come back tomorrow for a new session
            </p>

            <div className="flex flex-col gap-2">
              <Link
                href="/train"
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                More training →
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Render: Session ── */
  const progressPct =
    tasks.length > 0 ? Math.round((currentIdx / tasks.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-4 pb-16 pt-8">
      <div className="mx-auto max-w-2xl">
        {/* ── Header ── */}
        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Daily Training</h1>
              <p className="text-xs text-slate-500">{today}</p>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1.5">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-bold text-amber-400">
                  {streak} day streak
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>
                {currentIdx} / {tasks.length} done
              </span>
              <span>{tasks.length - currentIdx} remaining</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Task dots */}
          <div className="mt-2.5 flex gap-1.5 flex-wrap">
            {tasks.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all ${
                  i < currentIdx
                    ? results[i] === "correct"
                      ? "bg-emerald-500"
                      : "bg-red-500/70"
                    : i === currentIdx
                      ? "scale-125 bg-amber-400"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>

          {/* SRS due-count badge */}
          {srsStats && srsStats.totalCards > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  srsStats.dueToday > 0
                    ? "border-amber-500/25 bg-amber-500/[0.07] text-amber-400"
                    : "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-400"
                }`}
              >
                <span>{srsStats.dueToday > 0 ? "🔁" : "✅"}</span>
                {srsStats.dueToday > 0
                  ? `${srsStats.dueToday} blunder${srsStats.dueToday !== 1 ? "s" : ""} due for review`
                  : "All blunders reviewed — come back tomorrow"}
              </span>
              {srsStats.totalSeen > 0 && (
                <span className="text-[10px] text-slate-600">
                  {srsStats.totalSeen}/{srsStats.totalCards} in rotation
                </span>
              )}
            </div>
          )}

          {/* No tactics scan notice */}
          {!hasTacticsScan && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-sky-500/15 bg-sky-500/[0.05] px-3 py-2.5">
              <span className="mt-0.5 shrink-0 text-sm">💡</span>
              <p className="text-xs leading-relaxed text-slate-400">
                Today's session is{" "}
                <span className="text-white">puzzles only</span> — blunder
                drills activate after a{" "}
                <Link
                  href="/analyze"
                  className="text-sky-400 underline-offset-2 hover:underline"
                >
                  tactics scan
                </Link>
                .
              </p>
            </div>
          )}
        </div>

        {/* ── Task Card ── */}
        {currentTask && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            {/* Type badge + instruction */}
            <div className="mb-4 flex items-center gap-3">
              {currentTask.type === "puzzle" ? (
                <span className="rounded-full border border-sky-500/20 bg-sky-500/[0.08] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-400">
                  Puzzle
                </span>
              ) : currentTask.type === "blunder" ? (
                <span className="rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-400">
                  Blunder Drill
                </span>
              ) : currentTask.type === "quiz" ? (
                <span className="rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-400">
                  Quiz
                </span>
              ) : (
                <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-400">
                  Memory
                </span>
              )}
              <p className="text-sm text-slate-400">
                {currentTask.type === "puzzle"
                  ? "Find the best move sequence"
                  : currentTask.type === "blunder"
                    ? "Fix your mistake — find the best move"
                    : currentTask.type === "quiz"
                      ? "Answer the question"
                      : "Study the position, then recall from memory"}
              </p>
              <span className="ml-auto text-xs text-slate-600">
                {currentIdx + 1}/{tasks.length}
              </span>
            </div>

            {/* Intro slide or active task */}
            {taskPhase === "intro" ? (
              <TaskIntroCard
                intro={currentTask.intro}
                onStart={() => {
                  setTaskPhase("playing");
                  setTaskKey((k) => k + 1);
                }}
              />
            ) : (
              <div key={taskKey}>
                {currentTask.type === "puzzle" ? (
                  <LichessPuzzleBoard
                    puzzle={currentTask.puzzle}
                    onComplete={handleTaskComplete}
                  />
                ) : currentTask.type === "blunder" ? (
                  <BlunderBoard
                    tactic={currentTask.tactic}
                    onComplete={handleTaskComplete}
                  />
                ) : currentTask.type === "quiz" ? (
                  <ChessQuiz
                    question={currentTask.question}
                    onComplete={handleTaskComplete}
                  />
                ) : (
                  <PieceMemory
                    position={currentTask.position}
                    onComplete={handleTaskComplete}
                  />
                )}
              </div>
            )}

            {/* Next / Complete button — shown after task finishes */}
            {lastResult !== null && taskPhase === "playing" && (
              <div className="mt-5 flex flex-col items-center gap-2">
                <div
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${
                    lastResult === "correct"
                      ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400"
                      : "border-red-500/20 bg-red-500/[0.06] text-red-400"
                  }`}
                >
                  {lastResult === "correct" ? "✓ Correct" : "✗ Missed it"}
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-400"
                >
                  {isLastTask ? "Complete session ✓" : "Next exercise →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-xs text-slate-600 hover:text-slate-400"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
