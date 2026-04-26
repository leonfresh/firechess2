"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { Chess } from "chess.js";
import { useBoardSize } from "@/lib/use-board-size";
import {
  useBoardTheme,
  useShowCoordinates,
  useCustomPieces,
} from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";

/* ─── Constants ─── */

const DIFFICULTY_RANGES = [
  { label: "600–1000", min: 600, max: 1000 },
  { label: "1000–1500", min: 1000, max: 1500 },
  { label: "1500–2000", min: 1500, max: 2000 },
  { label: "2000–2500", min: 2000, max: 2500 },
  { label: "2500–3000", min: 2500, max: 3000 },
];

const THEMES = [
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "doubleCheck",
  "mateIn1",
  "mateIn2",
  "mateIn3",
  "sacrifice",
  "deflection",
  "attraction",
  "interference",
  "endgame",
  "rookEndgame",
  "pawnEndgame",
  "knightEndgame",
  "bishopEndgame",
  "queenEndgame",
  "promotion",
  "enPassant",
  "backRankMate",
  "smotheredMate",
  "hangingPiece",
  "trappedPiece",
  "xRayAttack",
  "zugzwang",
  "quietMove",
  "clearance",
  "crushing",
  "advantage",
  "equality",
];

/* ─── Types ─── */

interface Puzzle {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string;
  game_url: string;
  opening_tags: string;
}

type PuzzleState = "idle" | "playing" | "waiting" | "solved" | "failed";
type MoveQuality =
  | "brilliant"
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

const QUALITY: Record<MoveQuality, { label: string; color: string }> = {
  brilliant: { label: "Brilliant!", color: "#00b4ac" },
  best: { label: "Best!", color: "#3e9b3e" },
  excellent: { label: "Excellent", color: "#7a9e35" },
  good: { label: "Good", color: "#596c52" },
  inaccuracy: { label: "Inaccuracy", color: "#f5a400" },
  mistake: { label: "Mistake", color: "#e89200" },
  blunder: { label: "Blunder", color: "#c42020" },
};

/* ─── Helpers ─── */

function uciToMove(uci: string) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    ...(uci.length === 5 ? { promotion: uci[4] } : {}),
  };
}

const PIECE_VALUE: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

/**
 * Static Exchange Evaluation: returns net material gain for the side to move
 * after the optimal capture sequence at `square`.
 */
function see(chess: Chess, square: string): number {
  let minVal = Infinity;
  let minFrom = "";
  for (const m of chess.moves({ verbose: true })) {
    if (m.to === square) {
      const attacker = chess.get(m.from as any);
      if (attacker) {
        const v = PIECE_VALUE[attacker.type] ?? 0;
        if (v < minVal) {
          minVal = v;
          minFrom = m.from;
        }
      }
    }
  }
  if (!minFrom) return 0;
  const captured = chess.get(square as any);
  const capturedVal = captured ? (PIECE_VALUE[captured.type] ?? 0) : 0;
  const temp = new Chess(chess.fen());
  try {
    temp.move({ from: minFrom, to: square });
  } catch {
    return 0;
  }
  return Math.max(0, capturedVal - see(temp, square));
}

/** Returns true if moving from→to results in a net material loss (sacrifice). */
function isSacrifice(chess: Chess, from: string, to: string): boolean {
  const moving = chess.get(from as any);
  if (!moving || moving.type === "k") return false;
  const captured = chess.get(to as any);
  const capturedVal = captured ? (PIECE_VALUE[captured.type] ?? 0) : 0;
  const temp = new Chess(chess.fen());
  try {
    temp.move({ from, to });
  } catch {
    return false;
  }
  // Net = what we captured minus what opponent gains from optimal recaptures
  return capturedVal - see(temp, to) < 0;
}

/**
 * Detect pins for the side to move.
 * Returns:
 *  - pinnedSquares: squares whose piece cannot legally move (absolute pin)
 *  - exposedSquares: squares that are undefended/accessible BECAUSE of those pins
 *    (for pawns: the two diagonal capture squares it would normally cover)
 */
/**
 * Detect "remove the defender" patterns.
 * Given the current position and the solution moves, find opponent pieces that are
 * the SOLE defender of a square the solution targets.
 * Returns:
 *  - defenderSquares: opponent pieces that are the sole defender of a critical square
 *  - guardedSquares: the critical squares they are defending
 *  - arrows: [from, to] pairs for drawing defender→guarded arrows
 */
/**
 * Detects the "remove the guard" motif purely from the position.
 * For every opponent piece the player currently attacks, if it has exactly
 * one defender, that defender is flagged. The badge pulses if the player
 * can also directly capture that defender (fully solution-independent).
 */
function computeDefenders(chess: Chess): {
  defenderSquares: Set<string>;
  guardedSquares: Set<string>;
  attackableDefenders: Set<string>;
  arrows: [string, string][];
} {
  const defenderSquares = new Set<string>();
  const guardedSquares = new Set<string>();
  const attackableDefenders = new Set<string>();
  const arrows: [string, string][] = [];

  const turn = chess.turn();
  const opponent = turn === "w" ? "b" : "w";
  const board = chess.board();

  // Build the full set of squares the player pseudo-legally attacks.
  const playerAttacks = new Set<string>();
  for (const row of board) {
    for (const cell of row) {
      if (!cell || cell.color !== turn) continue;
      if (cell.type === "p") {
        for (const sq of getPawnAttackSquares(board, cell.square))
          playerAttacks.add(sq);
      } else if (cell.type === "k") {
        const f = cell.square.charCodeAt(0) - 97;
        const r = parseInt(cell.square[1]) - 1;
        for (let df = -1; df <= 1; df++)
          for (let dr = -1; dr <= 1; dr++) {
            if (df === 0 && dr === 0) continue;
            const nf = f + df,
              nr = r + dr;
            if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8)
              playerAttacks.add(String.fromCharCode(97 + nf) + (nr + 1));
          }
      } else {
        for (const sq of getAttackSquares(board, cell.square))
          playerAttacks.add(sq);
      }
    }
  }

  // For each opponent piece the player attacks, count its sole defenders.
  for (const row of board) {
    for (const cell of row) {
      if (!cell || cell.color !== opponent) continue;
      if (!playerAttacks.has(cell.square)) continue;

      const defenders: string[] = [];
      for (const row2 of board) {
        for (const cell2 of row2) {
          if (
            !cell2 ||
            cell2.color !== opponent ||
            cell2.square === cell.square
          )
            continue;
          if (cell2.type === "k") {
            const f = cell2.square.charCodeAt(0) - 97;
            const r = parseInt(cell2.square[1]) - 1;
            const tf = cell.square.charCodeAt(0) - 97;
            const tr = parseInt(cell.square[1]) - 1;
            if (Math.abs(f - tf) <= 1 && Math.abs(r - tr) <= 1)
              defenders.push(cell2.square);
          } else if (cell2.type === "p") {
            if (getPawnAttackSquares(board, cell2.square).has(cell.square))
              defenders.push(cell2.square);
          } else {
            if (getAttackSquares(board, cell2.square).has(cell.square))
              defenders.push(cell2.square);
          }
        }
      }

      // Only flag sole defenders — with 2+ the motif is ambiguous
      if (defenders.length === 1) {
        const def = defenders[0];
        defenderSquares.add(def);
        guardedSquares.add(cell.square);
        // Arrow: attacked piece → its defender ("this piece is in the way")
        arrows.push([cell.square, def]);
        // Pulse if the player can also directly capture the defender
        if (playerAttacks.has(def)) attackableDefenders.add(def);
      }
    }
  }

  return { defenderSquares, guardedSquares, attackableDefenders, arrows };
}
/** Returns the two diagonal attack squares of a pawn on `sq`. */
function getPawnAttackSquares(
  board: ReturnType<Chess["board"]>,
  sq: string,
): Set<string> {
  const file = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq[1]) - 1;
  const piece = board[7 - rank][file];
  const squares = new Set<string>();
  if (!piece || piece.type !== "p") return squares;
  const dir = piece.color === "w" ? 1 : -1;
  const toSq = (f: number, r: number) => String.fromCharCode(97 + f) + (r + 1);
  if (file > 0) squares.add(toSq(file - 1, rank + dir));
  if (file < 7) squares.add(toSq(file + 1, rank + dir));
  return squares;
}

/**
 * Returns all squares a piece on `sq` pseudo-legally attacks
 * (ray-scans for sliders, L-moves for knights — ignores pins/checks).
 */
function getAttackSquares(
  board: ReturnType<Chess["board"]>,
  sq: string,
): Set<string> {
  const file = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq[1]) - 1;
  const piece = board[7 - rank][file]; // board[0]=rank8, board[7]=rank1
  if (!piece) return new Set();

  const squares = new Set<string>();
  const toSq = (f: number, r: number) => String.fromCharCode(97 + f) + (r + 1);

  function scanRay(df: number, dr: number) {
    let f = file + df,
      r = rank + dr;
    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      squares.add(toSq(f, r));
      if (board[7 - r][f]) break; // blocked by any piece
      f += df;
      r += dr;
    }
  }

  if (piece.type === "r") {
    for (const [df, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      scanRay(df, dr);
  } else if (piece.type === "b") {
    for (const [df, dr] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ])
      scanRay(df, dr);
  } else if (piece.type === "q") {
    for (const [df, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ])
      scanRay(df, dr);
  } else if (piece.type === "n") {
    for (const [df, dr] of [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ]) {
      const nf = file + df,
        nr = rank + dr;
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) squares.add(toSq(nf, nr));
    }
  }
  // Pawns handled separately in computePins
  return squares;
}

function computePins(chess: Chess): {
  pinnedSquares: Set<string>;
  exposedSquares: Set<string>;
} {
  const pinnedSquares = new Set<string>();
  const exposedSquares = new Set<string>();

  const turn = chess.turn(); // side to move (the player solving)
  const opponent = turn === "w" ? "b" : "w"; // whose pins we want to reveal

  // Check the OPPONENT's pieces — a pinned opponent piece is a clue for the solver.
  for (const square of chess.board().flat()) {
    if (!square || square.color !== opponent) continue;
    if (square.type === "k") continue;

    const sq = square.square;
    const piece = square;

    // Temporarily remove the piece and see if king is in check
    const temp = new Chess(chess.fen());
    const board = chess.board();
    // Build FEN with this piece removed.
    // board[r] in chess.js = rank (8-r): board[0]=rank8, board[7]=rank1.
    // FEN expects ranks in order 8→1, so iterate r from 0 to 7.
    // cellSq rank = (8 - r), not (r + 1).
    const rows: string[] = [];
    for (let r = 0; r <= 7; r++) {
      let rowStr = "";
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        const cellSq = String.fromCharCode(97 + c) + (8 - r);
        if (cellSq === sq) {
          empty++;
        } else if (cell) {
          if (empty > 0) {
            rowStr += empty;
            empty = 0;
          }
          const ch = cell.type;
          rowStr += cell.color === "w" ? ch.toUpperCase() : ch;
        } else {
          empty++;
        }
      }
      if (empty > 0) rowStr += empty;
      rows.push(rowStr);
    }
    const fenParts = chess.fen().split(" ");
    fenParts[0] = rows.join("/");
    // Switch turn to opponent so isCheck() tests the opponent's king
    fenParts[1] = opponent;
    try {
      temp.load(fenParts.join(" "));
    } catch {
      continue;
    }
    if (temp.isCheck()) {
      pinnedSquares.add(sq);

      // Determine exposed squares based on piece type
      const file = sq.charCodeAt(0) - 97; // 0-7
      const rank = parseInt(sq[1]) - 1; // 0-7

      if (piece.type === "p") {
        // Pawn normally defends its two diagonal capture squares.
        // Because it's pinned it can't move to defend them → those squares are exposed.
        const dir = piece.color === "w" ? 1 : -1;
        for (const df of [-1, 1]) {
          const nf = file + df;
          const nr = rank + dir;
          if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
            exposedSquares.add(String.fromCharCode(97 + nf) + (nr + 1));
          }
        }
      } else {
        // Exposed = squares the piece pseudo-legally attacks but can NO LONGER legally reach.
        // chess.js moves() respects pins, so it only returns legal moves (along pin ray).
        // getAttackSquares() ignores the pin → gives all normally-attacked squares.
        // The difference is what's now undefended/accessible for the solver.
        const allAttacks = getAttackSquares(chess.board(), sq);
        const legalFenParts = chess.fen().split(" ");
        legalFenParts[1] = opponent;
        const legalChess = new Chess();
        try {
          legalChess.load(legalFenParts.join(" "));
        } catch {
          continue;
        }
        const legalTargets = new Set(
          legalChess
            .moves({ verbose: true })
            .filter((m) => m.from === sq)
            .map((m) => m.to),
        );
        for (const s of allAttacks) {
          if (!legalTargets.has(s as any)) exposedSquares.add(s);
        }
      }
    }
  }

  return { pinnedSquares, exposedSquares };
}

/* ─── Brilliant Effect (board-relative, teal) ─── */

function BrilliantEffect({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: 8 + Math.random() * 84,
        y: 8 + Math.random() * 84,
        delay: Math.random() * 0.45,
        size: 8 + Math.random() * 12,
        dur: 0.7 + Math.random() * 0.9,
        sym: ["✦", "★", "◆", "✸", "✺"][Math.floor(Math.random() * 5)],
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden rounded">
      {/* Teal radial board flash */}
      <div
        className="absolute inset-0"
        style={{ animation: "brilliantFlash 0.65s ease-out forwards" }}
      />
      {/* Expanding concentric rings from board center */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "55%",
            height: "55%",
            borderRadius: "50%",
            border: "3px solid #2dd4bf",
            opacity: 0,
            transform: "translate(-50%, -50%) scale(0.1)",
            animation: `brilliantRing 1.1s ease-out ${i * 0.22}s forwards`,
          }}
        />
      ))}
      {/* "BRILLIANT!" text centered on board */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: "brilliantBanner 2.5s ease-in-out forwards" }}
      >
        <div className="flex flex-col items-center gap-1">
          <div
            className="text-4xl font-black tracking-tight px-4 py-1.5 rounded-xl"
            style={{
              color: "#5eead4",
              textShadow: "0 0 20px #14b8a6, 0 0 40px #0d9488",
              background: "rgba(0,0,0,0.62)",
              border: "1px solid rgba(45,212,191,0.4)",
            }}
          >
            !! BRILLIANT!
          </div>
          <div
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(94,234,212,0.7)" }}
          >
            Piece Sacrifice
          </div>
        </div>
      </div>
      {/* Sparkle particles scattered across board */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            color: "#2dd4bf",
            opacity: 0,
            animation: `brilliantParticle ${p.dur}s ease-out ${p.delay}s forwards`,
          }}
        >
          {p.sym}
        </div>
      ))}
      <style>{`
        @keyframes brilliantFlash {
          0%   { background: transparent; }
          20%  { background: radial-gradient(circle at 50% 50%, rgba(20,184,166,0.35) 0%, transparent 70%); }
          100% { background: transparent; }
        }
        @keyframes brilliantRing {
          0%   { opacity: 0.9; transform: translate(-50%, -50%) scale(0.1); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(2.8); }
        }
        @keyframes brilliantBanner {
          0%   { opacity: 0; transform: scale(0.75) translateY(14px); }
          10%  { opacity: 1; transform: scale(1.06) translateY(0); }
          60%  { opacity: 1; transform: scale(1)    translateY(0); }
          100% { opacity: 0; transform: scale(1.02) translateY(-8px); }
        }
        @keyframes brilliantParticle {
          0%   { opacity: 1; transform: translateY(0)     scale(1);   }
          100% { opacity: 0; transform: translateY(-60px) scale(0.2); }
        }
      `}</style>
    </div>
  );
}

/* ─── Correct Move Flash ─── */
function CorrectFlash({ color }: { color: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded z-10"
      style={{
        boxShadow: `inset 0 0 0 3px ${color}`,
        animation: "correctFlash 0.7s ease-out forwards",
      }}
    >
      <style>{`
        @keyframes correctFlash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Wrong Shake ─── */
function WrongFlash() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded z-10"
      style={{
        boxShadow: "inset 0 0 0 3px rgba(239,68,68,0.8)",
        animation: "wrongShake 0.5s ease-out forwards",
      }}
    >
      <style>{`
        @keyframes wrongShake {
          0%,100% { opacity: 0; transform: translateX(0); }
          15%      { opacity: 1; transform: translateX(-6px); }
          30%      { opacity: 1; transform: translateX(6px); }
          45%      { opacity: 1; transform: translateX(-4px); }
          60%      { opacity: 1; transform: translateX(4px); }
          80%      { opacity: 0.5; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Page ─── */

export default function PuzzlesPage() {
  // Board sizing + theming
  const { ref: boardRef, size: boardSize } = useBoardSize(480, {
    evalBar: false,
  });
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();

  // Filter / load state
  const [selectedDifficulty, setSelectedDifficulty] = useState(
    DIFFICULTY_RANGES[2],
  );
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [limit, setLimit] = useState(1);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [activePuzzleIdx, setActivePuzzleIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Puzzle play state
  const chessRef = useRef<Chess>(new Chess());
  const [boardFen, setBoardFen] = useState<string>("start");
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
    "white",
  );
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [solutionIdx, setSolutionIdx] = useState(0);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>("idle");

  // Interaction state
  const [selectedSquare, setSelectedSquare] = useState<CbSquare | null>(null);
  const [legalMoves, setLegalMoves] = useState<Map<CbSquare, CbSquare[]>>(
    new Map(),
  );
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [moveBadge, setMoveBadge] = useState<{
    square: string;
    quality: MoveQuality;
  } | null>(null);

  // Effects
  const [showBrilliant, setShowBrilliant] = useState(false);
  const [showCorrect, setShowCorrect] = useState<string | null>(null); // color string
  const [showWrong, setShowWrong] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Pin visualisation state — recomputed whenever the position changes
  const [pinInfo, setPinInfo] = useState<{
    pinnedSquares: Set<string>;
    exposedSquares: Set<string>;
  }>({ pinnedSquares: new Set(), exposedSquares: new Set() });

  // Defender visualisation state
  const [defenderInfo, setDefenderInfo] = useState<{
    defenderSquares: Set<string>;
    guardedSquares: Set<string>;
    attackableDefenders: Set<string>;
    arrows: [string, string][];
  }>({
    defenderSquares: new Set(),
    guardedSquares: new Set(),
    attackableDefenders: new Set(),
    arrows: [],
  });

  // Hint toggles
  const [showPinHints, setShowPinHints] = useState(true);
  const [showDefenderHints, setShowDefenderHints] = useState(true);

  // Puzzle buffer — holds up to 5 pre-fetched puzzles for instant auto-advance
  const puzzleBufferRef = useRef<Puzzle[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFillingBufferRef = useRef(false);

  const activePuzzle = puzzles[activePuzzleIdx] ?? null;

  // Preload sounds on mount + wake Turso
  useEffect(() => {
    preloadSounds();
    fetch("/api/turso-puzzles/ping").catch(() => {});
  }, []);

  /* ─── Update legal moves from current chess instance ─── */
  const updateLegalMoves = useCallback(() => {
    const map = new Map<CbSquare, CbSquare[]>();
    for (const m of chessRef.current.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from)!.push(m.to);
    }
    setLegalMoves(map);
    // Recompute pin + defender visualisation whenever the position changes
    setPinInfo(computePins(chessRef.current));
    setDefenderInfo(computeDefenders(chessRef.current));
  }, []);

  /* ─── Load a puzzle onto the board ─── */
  const loadPuzzleBoard = useCallback(
    (puzzle: Puzzle) => {
      const allMoves = puzzle.moves.split(" ");
      // First UCI = opponent trigger move. Rest = solution alternating player/opponent.
      const [triggerUci, ...solution] = allMoves;

      const instance = new Chess();
      try {
        instance.load(puzzle.fen);
        instance.move(uciToMove(triggerUci));
      } catch (e) {
        console.error("[puzzle] failed to load", e);
      }

      chessRef.current = instance;
      setSolutionMoves(solution);
      setSolutionIdx(0);
      setPuzzleState("playing");
      setSelectedSquare(null);
      // Show the opponent trigger move as a highlight so player sees what was played
      setLastMove({ from: triggerUci.slice(0, 2), to: triggerUci.slice(2, 4) });
      setMoveBadge(null);
      setShowBrilliant(false);
      setShowCorrect(null);
      setShowWrong(false);

      const fen = instance.fen();
      setBoardFen(fen);
      // Orient so the player to move is at the bottom
      setBoardOrientation(instance.turn() === "b" ? "black" : "white");
      updateLegalMoves();
      // Compute initial pin state for the starting position
      setPinInfo(computePins(instance));
      // Compute defender hints — also kept in ref so updateLegalMoves can access them
      setDefenderInfo(computeDefenders(instance));
    },
    [updateLegalMoves],
  );

  /* ─── Auto-play opponent's response ─── */
  const playOpponentMove = useCallback(
    (idx: number, solution: string[]) => {
      if (idx >= solution.length) {
        setPuzzleState("solved");
        playSound("correct");
        return;
      }
      setPuzzleState("waiting");
      setTimeout(() => {
        const uci = solution[idx];
        try {
          const result = chessRef.current.move(uciToMove(uci));
          if (result) {
            setBoardFen(chessRef.current.fen());
            setLastMove({ from: result.from, to: result.to });
            playSound(result.captured ? "capture" : "move");
          }
        } catch {
          /* */
        }

        const next = idx + 1;
        if (next >= solution.length) {
          setPuzzleState("solved");
          playSound("correct");
        } else {
          setSolutionIdx(next);
          setPuzzleState("playing");
          updateLegalMoves();
        }
      }, 600);
    },
    [updateLegalMoves],
  );

  /* ─── Handle player move attempt ─── */
  const handleMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (puzzleState !== "playing") return;
      if (solutionIdx >= solutionMoves.length) return;

      const expected = solutionMoves[solutionIdx];
      const expectedFrom = expected.slice(0, 2);
      const expectedTo = expected.slice(2, 4);
      const isCorrect = from === expectedFrom && to === expectedTo;

      if (!isCorrect) {
        // Try to make it to verify it's at least a legal move
        const temp = new Chess(chessRef.current.fen());
        let legal = false;
        try {
          const r = temp.move({ from, to, promotion });
          legal = !!r;
        } catch {
          /* */
        }

        if (!legal) return; // illegal move — ignore silently
        setShowWrong(true);
        setTimeout(() => setShowWrong(false), 600);
        setMoveBadge(null);
        playSound("wrong");
        return;
      }

      // ── Correct move ──
      const fenBefore = chessRef.current.fen();
      const sacrifice = isSacrifice(chessRef.current, from, to);

      let result;
      try {
        result = chessRef.current.move(uciToMove(expected));
      } catch {
        return;
      }
      if (!result) return;

      const newFen = chessRef.current.fen();
      setBoardFen(newFen);
      setLastMove({ from: result.from, to: result.to });
      setSelectedSquare(null);

      // Determine quality
      const quality: MoveQuality = sacrifice ? "brilliant" : "best";
      setMoveBadge({ square: result.to, quality });

      if (sacrifice) {
        setShowBrilliant(true);
        playSound("bell-double");
      } else {
        setShowCorrect(QUALITY.best.color);
        setTimeout(() => setShowCorrect(null), 800);
        playSound(result.captured ? "capture" : "move");
      }

      const nextIdx = solutionIdx + 1;
      // Opponent responds after a short pause
      setTimeout(
        () => {
          setMoveBadge(null);
          playOpponentMove(nextIdx, solutionMoves);
        },
        sacrifice ? 1600 : 900,
      );
    },
    [puzzleState, solutionIdx, solutionMoves, playOpponentMove],
  );

  /* ─── Click-to-move ─── */
  const onSquareClick = useCallback(
    (square: CbSquare) => {
      if (puzzleState !== "playing") return;
      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }
        if (legalMoves.has(square)) {
          setSelectedSquare(square);
          return;
        }
        handleMove(selectedSquare, square);
        setSelectedSquare(null);
      } else {
        if (legalMoves.has(square)) {
          setSelectedSquare(square);
          playSound("select");
        }
      }
    },
    [selectedSquare, legalMoves, puzzleState, handleMove],
  );

  const onPieceDrop = useCallback(
    (from: CbSquare, to: CbSquare) => {
      handleMove(from, to);
      setSelectedSquare(null);
      return true;
    },
    [handleMove],
  );

  /* ─── Square styles: selected + legal dots + last move + pin exposed squares ─── */
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Pin-exposed squares: green glow
    if (showPinHints) {
      for (const sq of pinInfo.exposedSquares) {
        styles[sq] = {
          background:
            "radial-gradient(circle, rgba(34,197,94,0.55) 0%, rgba(34,197,94,0.18) 60%, transparent 100%)",
          boxShadow:
            "inset 0 0 12px 4px rgba(34,197,94,0.45), 0 0 16px 6px rgba(34,197,94,0.3)",
        };
      }
    }

    // Defender-guarded squares: orange/red glow
    if (showDefenderHints) {
      for (const sq of defenderInfo.guardedSquares) {
        styles[sq] = {
          background:
            "radial-gradient(circle, rgba(239,100,30,0.52) 0%, rgba(239,100,30,0.18) 60%, transparent 100%)",
          boxShadow:
            "inset 0 0 12px 4px rgba(239,100,30,0.45), 0 0 16px 6px rgba(239,100,30,0.3)",
        };
      }
    }

    if (lastMove) {
      // Chess.com teal last-move highlight
      styles[lastMove.from] = { backgroundColor: "rgba(20,168,152,0.38)" };
      styles[lastMove.to] = { backgroundColor: "rgba(20,168,152,0.60)" };
    }

    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: "rgba(20,85,255,0.45)" };
      for (const t of legalMoves.get(selectedSquare) ?? []) {
        const hasPiece = chessRef.current.get(t as any);
        styles[t] = hasPiece
          ? {
              background:
                "radial-gradient(circle, transparent 52%, rgba(0,0,0,0.45) 52%)",
            }
          : {
              background:
                "radial-gradient(circle, rgba(0,0,0,0.35) 25%, transparent 26%)",
            };
      }
    }

    return styles;
  }, [
    selectedSquare,
    legalMoves,
    lastMove,
    boardFen,
    pinInfo,
    defenderInfo,
    showPinHints,
    showDefenderHints,
  ]);

  /* ─── Move quality badge + pin badge + defender shield overlay ─── */
  const customSquareRenderer = useMemo(() => {
    return ((props: any) => {
      const sq = props?.square as string | undefined;
      const badge =
        sq && moveBadge && sq === moveBadge.square ? moveBadge : null;
      const cfg = badge ? QUALITY[badge.quality] : null;
      const isPinned =
        showPinHints && sq ? pinInfo.pinnedSquares.has(sq) : false;
      const isDefender =
        showDefenderHints && sq ? defenderInfo.defenderSquares.has(sq) : false;
      const isCapturable =
        showDefenderHints && sq
          ? defenderInfo.attackableDefenders.has(sq)
          : false;
      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {/* Pin badge — top-left */}
          {isPinned && (
            <div
              className="pointer-events-none absolute -left-1 -top-1 z-40 flex h-6 w-6 items-center justify-center rounded-full text-sm leading-none"
              style={{
                background: "rgba(0,0,0,0.72)",
                border: "1.5px solid rgba(251,191,36,0.85)",
                boxShadow: "0 0 6px 2px rgba(251,191,36,0.5)",
              }}
              title="Pinned piece"
            >
              📌
            </div>
          )}
          {/* Defender shield badge — top-left (or alongside pin); pulses when the solution captures it */}
          {isDefender && (
            <div
              className={`pointer-events-none absolute -left-1 z-40 flex h-6 w-6 items-center justify-center rounded-full text-sm leading-none${
                isCapturable ? " animate-pulse" : ""
              }`}
              style={{
                top: isPinned ? "18px" : "-4px",
                background: "rgba(0,0,0,0.72)",
                border: `1.5px solid ${
                  isCapturable ? "rgba(239,68,68,0.95)" : "rgba(239,100,30,0.9)"
                }`,
                boxShadow: `0 0 6px 2px ${
                  isCapturable ? "rgba(239,68,68,0.65)" : "rgba(239,100,30,0.5)"
                }`,
              }}
              title={
                isCapturable ? "You can take this defender!" : "Key defender"
              }
            >
              🛡️
            </div>
          )}
          {/* Move quality badge — top-right */}
          {badge && cfg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/move-badges/${badge.quality}.svg`}
              alt={cfg.label}
              title={cfg.label}
              className="pointer-events-none absolute -right-1 -top-1 z-40 h-7 w-7 drop-shadow-lg"
            />
          )}
        </div>
      );
    }) as any;
  }, [moveBadge, pinInfo, defenderInfo, showPinHints, showDefenderHints]);

  /* ─── Background buffer fill ─── */
  const fillBuffer = useCallback(async () => {
    if (isFillingBufferRef.current) return;
    if (puzzleBufferRef.current.length >= 5) return;
    isFillingBufferRef.current = true;

    const needed = 5 - puzzleBufferRef.current.length;
    // Over-fetch to compensate for dupe filtering
    const fetchLimit = Math.min(needed * 3, 15);

    const params = new URLSearchParams({
      ratingMin: String(selectedDifficulty.min),
      ratingMax: String(selectedDifficulty.max),
      limit: String(fetchLimit),
    });
    if (selectedThemes.length > 0)
      params.set("themes", selectedThemes.join(","));

    try {
      const res = await fetch(`/api/turso-puzzles?${params}`);
      const data = await res.json();
      if (!res.ok) return;
      const rows = (data.puzzles ?? []) as Puzzle[];
      const fresh = rows.filter((p) => !seenIdsRef.current.has(p.id));
      const toAdd = fresh.slice(0, 5 - puzzleBufferRef.current.length);
      puzzleBufferRef.current = [...puzzleBufferRef.current, ...toAdd];
    } catch {
      // Silent — buffer stays smaller, fetchNextPuzzle falls back to direct fetch
    } finally {
      isFillingBufferRef.current = false;
    }
  }, [selectedDifficulty, selectedThemes]);

  /* ─── Load puzzles from API ─── */
  const loadPuzzles = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPuzzles([]);
    setBoardFen("start");
    setPuzzleState("idle");
    setActivePuzzleIdx(0);
    setSelectedSquare(null);
    setLastMove(null);
    setMoveBadge(null);
    setShowBrilliant(false);
    setCountdown(null);
    // Clear buffer and seen-IDs when filter settings change
    puzzleBufferRef.current = [];
    seenIdsRef.current = new Set();
    isFillingBufferRef.current = false;

    const params = new URLSearchParams({
      ratingMin: String(selectedDifficulty.min),
      ratingMax: String(selectedDifficulty.max),
      limit: String(limit),
    });
    if (selectedThemes.length > 0)
      params.set("themes", selectedThemes.join(","));

    try {
      const res = await fetch(`/api/turso-puzzles?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      const rows = (data.puzzles ?? []) as Puzzle[];
      // Mark loaded puzzles as seen so they won't appear in the buffer
      rows.forEach((p) => seenIdsRef.current.add(p.id));
      setPuzzles(rows);
      if (rows[0]) loadPuzzleBoard(rows[0]);
      // Pre-fill buffer in background while user solves the first puzzle
      fillBuffer();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, limit, selectedThemes, loadPuzzleBoard, fillBuffer]);

  // Pop next puzzle from pre-fetched buffer (instant), then refill.
  // Falls back to a direct fetch if buffer is empty.
  const fetchNextPuzzle = useCallback(async () => {
    const buffered = puzzleBufferRef.current[0];
    if (buffered) {
      puzzleBufferRef.current = puzzleBufferRef.current.slice(1);
      seenIdsRef.current.add(buffered.id);
      // Cap seen-IDs at 50 to avoid unbounded growth
      if (seenIdsRef.current.size > 50) {
        seenIdsRef.current.delete(seenIdsRef.current.values().next().value!);
      }
      setPuzzles([buffered]);
      setActivePuzzleIdx(0);
      setError(null);
      loadPuzzleBoard(buffered);
      // Refill buffer in background
      fillBuffer();
      return;
    }

    // Buffer empty — direct fetch fallback
    const params = new URLSearchParams({
      ratingMin: String(selectedDifficulty.min),
      ratingMax: String(selectedDifficulty.max),
      limit: "5",
    });
    if (selectedThemes.length > 0)
      params.set("themes", selectedThemes.join(","));

    try {
      const res = await fetch(`/api/turso-puzzles?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      const rows = (data.puzzles ?? []) as Puzzle[];
      // Pick first non-dupe, buffer the rest
      const fresh = rows.filter((p) => !seenIdsRef.current.has(p.id));
      const puzzle = fresh[0] ?? rows[0]; // last-resort fallback
      if (!puzzle) return;
      seenIdsRef.current.add(puzzle.id);
      // Buffer remaining fresh puzzles
      const rest = fresh.slice(1, 5);
      puzzleBufferRef.current = [...puzzleBufferRef.current, ...rest];
      rest.forEach((p) => seenIdsRef.current.add(p.id));
      setPuzzles([puzzle]);
      setActivePuzzleIdx(0);
      setError(null);
      loadPuzzleBoard(puzzle);
    } catch (e: any) {
      setError(e.message);
    }
  }, [selectedDifficulty, selectedThemes, loadPuzzleBoard, fillBuffer]);

  function selectPuzzle(idx: number) {
    setActivePuzzleIdx(idx);
    loadPuzzleBoard(puzzles[idx]);
  }

  function resetPuzzle() {
    if (activePuzzle) loadPuzzleBoard(activePuzzle);
  }

  function nextPuzzle() {
    const next = activePuzzleIdx + 1;
    if (next < puzzles.length) {
      setActivePuzzleIdx(next);
      loadPuzzleBoard(puzzles[next]);
    }
  }

  function toggleTheme(theme: string) {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme],
    );
  }

  /* ─── Auto-advance with 3-second countdown ─── */
  useEffect(() => {
    if (puzzleState !== "solved") {
      setCountdown(null);
      return;
    }
    setCountdown(3);
    const t1 = setTimeout(() => setCountdown(2), 1000);
    const t2 = setTimeout(() => setCountdown(1), 2000);
    const t3 = setTimeout(() => {
      setCountdown(null);
      const next = activePuzzleIdx + 1;
      if (next < puzzles.length) {
        // More puzzles queued — load the next one
        setActivePuzzleIdx(next);
        loadPuzzleBoard(puzzles[next]);
      } else {
        // Queue exhausted — fetch a fresh puzzle with the same filters (no board reset)
        fetchNextPuzzle();
      }
    }, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setCountdown(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleState]);

  /* ─── Status banner ─── */
  const statusBanner = useMemo(() => {
    if (puzzleState === "solved") {
      return {
        text:
          countdown !== null
            ? `Puzzle Solved! 🎉  —  Next in ${countdown}…`
            : "Puzzle Solved! 🎉",
        cls: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
      };
    }
    if (puzzleState === "waiting")
      return {
        text: "Opponent is thinking…",
        cls: "bg-zinc-800 border-zinc-700 text-zinc-400",
      };
    if (puzzleState === "playing")
      return {
        text: `Find the best move (${solutionMoves.length - solutionIdx} moves left)`,
        cls: "bg-zinc-800/50 border-zinc-700/50 text-zinc-300",
      };
    return null;
  }, [puzzleState, solutionMoves, solutionIdx, countdown]);

  /* ─────────────── Render ─────────────── */
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-0.5">Puzzles</h1>
        <p className="text-zinc-500 text-sm mb-5">
          3.35M Lichess puzzles via Turso
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* ── Left: Controls ── */}
          <div className="space-y-4">
            {/* Difficulty */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Rating Range
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DIFFICULTY_RANGES.map((d) => (
                  <button
                    key={d.label}
                    onClick={() => setSelectedDifficulty(d)}
                    className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                      selectedDifficulty.label === d.label
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Themes */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Themes{" "}
                <span className="text-zinc-600 normal-case font-normal">
                  (optional)
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                {THEMES.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => toggleTheme(theme)}
                    className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                      selectedThemes.includes(theme)
                        ? "bg-sky-600 border-sky-500 text-white"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
              {selectedThemes.length > 0 && (
                <button
                  onClick={() => setSelectedThemes([])}
                  className="mt-1 text-xs text-zinc-500 hover:text-zinc-300 underline"
                >
                  clear all
                </button>
              )}
            </div>

            {/* Count */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Count
              </p>
              <div className="flex gap-1.5">
                {[1, 3, 5, 10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setLimit(n)}
                    className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                      limit === n
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Load button */}
            <button
              onClick={loadPuzzles}
              disabled={loading}
              className="w-full py-2.5 rounded bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {loading ? "Loading…" : "Load Puzzles"}
            </button>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-800/50 rounded px-3 py-2">
                {error}
              </p>
            )}

            {/* Puzzle list */}
            {puzzles.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Results ({puzzles.length})
                </p>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                  {puzzles.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => selectPuzzle(i)}
                      className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                        i === activePuzzleIdx
                          ? "border-orange-500/60 bg-orange-500/10 text-orange-300"
                          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      <span className="font-mono text-xs text-zinc-500 mr-2">
                        #{p.id}
                      </span>
                      <span className="text-orange-400 font-semibold mr-2">
                        ★{p.rating}
                      </span>
                      <span className="text-zinc-500 text-xs truncate">
                        {p.themes?.split(" ").slice(0, 3).join(", ")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Move quality legend */}
            <div className="border border-zinc-800 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Move Quality
              </p>
              {(
                Object.entries(QUALITY) as [
                  MoveQuality,
                  (typeof QUALITY)[MoveQuality],
                ][]
              ).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/move-badges/${key}.svg`}
                    alt={cfg.label}
                    className="w-5 h-5 shrink-0"
                  />
                  <span style={{ color: cfg.color }} className="font-medium">
                    {cfg.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Board ── */}
          <div className="space-y-3">
            {/* Status banner */}
            {statusBanner && (
              <div
                className={`px-4 py-2 rounded border text-sm font-medium ${statusBanner.cls}`}
              >
                {statusBanner.text}
              </div>
            )}

            {/* Board */}
            <div ref={boardRef} className="relative w-full max-w-[520px]">
              {showBrilliant && (
                <BrilliantEffect onDone={() => setShowBrilliant(false)} />
              )}
              {showCorrect && <CorrectFlash color={showCorrect} />}
              {showWrong && <WrongFlash />}
              <Chessboard
                position={boardFen}
                boardWidth={boardSize}
                boardOrientation={boardOrientation}
                arePiecesDraggable={puzzleState === "playing"}
                onPieceDrop={onPieceDrop}
                onSquareClick={onSquareClick}
                customSquareStyles={squareStyles}
                customSquare={customSquareRenderer}
                showBoardNotation={showCoords}
                customDarkSquareStyle={{
                  backgroundColor: "#b58863",
                }}
                customLightSquareStyle={{
                  backgroundColor: "#f0d9b5",
                }}
                customPieces={customPieces}
                animationDuration={180}
                customArrows={
                  showDefenderHints
                    ? defenderInfo.arrows.map(([from, to]) => [
                        from,
                        to,
                        "rgba(59,130,246,0.85)",
                      ])
                    : []
                }
              />
            </div>

            {/* Controls row */}
            {activePuzzle && puzzleState !== "idle" && (
              <div className="flex flex-wrap gap-2 max-w-[520px]">
                <button
                  onClick={resetPuzzle}
                  className="px-4 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 text-sm hover:border-zinc-500 transition-colors"
                >
                  ↺ Reset
                </button>
                <button
                  onClick={() =>
                    setBoardOrientation((o) =>
                      o === "white" ? "black" : "white",
                    )
                  }
                  className="px-4 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 text-sm hover:border-zinc-500 transition-colors"
                >
                  ⇅ Flip
                </button>
                <a
                  href={activePuzzle.game_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 text-sm hover:border-zinc-500 transition-colors"
                >
                  Lichess ↗
                </a>
                {puzzleState === "solved" &&
                  activePuzzleIdx + 1 < puzzles.length && (
                    <button
                      onClick={nextPuzzle}
                      className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                    >
                      Next Puzzle →
                    </button>
                  )}
              </div>
            )}

            {/* Motif hint toggles */}
            {activePuzzle && puzzleState !== "idle" && (
              <div className="flex flex-wrap gap-2 max-w-[520px]">
                <button
                  onClick={() => setShowPinHints((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
                    showPinHints
                      ? "border-yellow-600/70 bg-yellow-600/15 text-yellow-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-500"
                  }`}
                  title="Toggle pin hints"
                >
                  📌 Pin hints
                </button>
                <button
                  onClick={() => setShowDefenderHints((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
                    showDefenderHints
                      ? "border-orange-600/70 bg-orange-600/15 text-orange-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-500"
                  }`}
                  title="Toggle defender hints"
                >
                  🛡️ Defender hints
                </button>
              </div>
            )}

            {/* Puzzle info */}
            {activePuzzle && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs space-y-1.5 font-mono max-w-[520px]">
                <div className="flex gap-4">
                  <span>
                    <span className="text-zinc-500">ID: </span>
                    <span className="text-zinc-300">{activePuzzle.id}</span>
                  </span>
                  <span>
                    <span className="text-zinc-500">Rating: </span>
                    <span className="text-orange-400 font-semibold">
                      {activePuzzle.rating}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Themes: </span>
                  <span className="text-sky-300">{activePuzzle.themes}</span>
                </div>
                {activePuzzle.opening_tags && (
                  <div>
                    <span className="text-zinc-500">Opening: </span>
                    <span className="text-zinc-400">
                      {activePuzzle.opening_tags}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500">Solution: </span>
                  <span className="text-green-400">
                    {solutionMoves.map((m, i) => (
                      <span
                        key={i}
                        className={
                          i < solutionIdx
                            ? "opacity-40"
                            : i === solutionIdx && puzzleState === "playing"
                              ? "text-white"
                              : ""
                        }
                      >
                        {m}{" "}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
