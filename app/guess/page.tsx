"use client";

/**
 * /guess — Guess the Move
 *
 * Play through famous GM games and try to guess each move.
 * Shares the PGN library with the PGN Analyzer.
 * Supports click-to-move, keyboard nav, scoring, and hints.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Move } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { SAMPLE_GAMES, GAME_CATEGORIES, type SampleGame, type GameCategory } from "@/lib/sample-games";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates, useCustomPieces } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import { stockfishClient } from "@/lib/stockfish-client";

/* ────────────────────────── Types ────────────────────────── */

type GuessResult = "correct" | "close" | "wrong";

type EngineRating = "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";

interface MoveGuess {
  moveIdx: number;
  san: string;
  actualSan: string;
  result: GuessResult;
  /** User's FEN before this move */
  fen: string;
  /** Engine rating of the user's move (filled async) */
  userRating?: EngineRating;
  /** Engine rating of the master's move (filled async) */
  masterRating?: EngineRating;
}

/* ────────────────────────── Helpers ────────────────────────── */

/** Parse a PGN into an array of SAN moves */
function parsePgnMoves(pgn: string): string[] {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch {
    return [];
  }
  return chess.history();
}

/** Get the side to move label */
function sideLabel(color: "w" | "b") {
  return color === "w" ? "White" : "Black";
}

/** Score text for a result */
function resultLabel(r: GuessResult) {
  if (r === "correct") return "Correct!";
  if (r === "close") return "Close!";
  return "Not quite";
}

const RESULT_COLOR: Record<GuessResult, string> = {
  correct: "text-emerald-400",
  close: "text-amber-400",
  wrong: "text-red-400",
};

const RESULT_BG: Record<GuessResult, string> = {
  correct: "bg-emerald-500/15 border-emerald-500/20",
  close: "bg-amber-500/15 border-amber-500/20",
  wrong: "bg-red-500/15 border-red-500/20",
};

/* ────── Engine move classification ────── */

function classifyByCpLoss(cpLoss: number): EngineRating {
  if (cpLoss <= 5) return "best";
  if (cpLoss <= 15) return "excellent";
  if (cpLoss <= 40) return "good";
  if (cpLoss <= 90) return "inaccuracy";
  if (cpLoss <= 200) return "mistake";
  return "blunder";
}

const ENGINE_RATING_EMOJI: Record<EngineRating, string> = {
  best: "✅",
  excellent: "💎",
  good: "👍",
  inaccuracy: "⚠️",
  mistake: "❌",
  blunder: "💀",
};

const ENGINE_RATING_COLOR: Record<EngineRating, string> = {
  best: "text-emerald-400",
  excellent: "text-cyan-400",
  good: "text-green-400",
  inaccuracy: "text-amber-400",
  mistake: "text-orange-400",
  blunder: "text-red-400",
};

const ENGINE_RATING_LABEL: Record<EngineRating, string> = {
  best: "Best",
  excellent: "Excellent",
  good: "Good",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

/* ────────────────────────── Tag Filters ────────────────────────── */

const TAG_OPTIONS = [
  { value: "all", label: "All Games", icon: "📚" },
  { value: "attack", label: "Attack", icon: "⚔️" },
  { value: "sacrifice", label: "Sacrifice", icon: "💥" },
  { value: "positional", label: "Positional", icon: "🧠" },
  { value: "endgame", label: "Endgame", icon: "♔" },
  { value: "defense", label: "Defense", icon: "🛡️" },
  { value: "tactics", label: "Tactics", icon: "🎯" },
] as const;

/* ────────────────────────── Component ────────────────────────── */

export default function GuessTheMovePage() {
  // ── Board & theme ──
  const { ref: boardRef, size: boardSize } = useBoardSize(560, { evalBar: false });
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();

  // ── Game selection state ──
  const [selectedGame, setSelectedGame] = useState<SampleGame | null>(null);
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<GameCategory | "all">("all");

  // ── Guess-the-move state ──
  const [chess] = useState(() => new Chess());
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIdx, setCurrentMoveIdx] = useState(0); // which move we're guessing next
  const [guesses, setGuesses] = useState<MoveGuess[]>([]);
  const [boardFen, setBoardFen] = useState("start");
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [selectedSquare, setSelectedSquare] = useState<CbSquare | null>(null);
  const [legalMoves, setLegalMoves] = useState<Map<CbSquare, CbSquare[]>>(new Map());
  const [lastGuessResult, setLastGuessResult] = useState<{ result: GuessResult; san: string; actual: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [guessingSide, setGuessingSide] = useState<"w" | "b" | "both">("both");
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Track the opponent's last move for board highlighting */
  const [opponentLastMove, setOpponentLastMove] = useState<{ from: string; to: string } | null>(null);
  /** Track the last guess result square + badge for the emoji overlay */
  const [guessBadge, setGuessBadge] = useState<{ square: string; result: GuessResult } | null>(null);
  const moveListRef = useRef<HTMLDivElement>(null);

  // Preload sounds
  useEffect(() => { preloadSounds(); }, []);

  // ── Filtered games ──
  const filteredGames = useMemo(() => {
    let games = SAMPLE_GAMES;
    if (activeCategory !== "all") games = games.filter(g => g.category === activeCategory);
    if (tagFilter !== "all") games = games.filter(g => g.tags.includes(tagFilter as any));
    return games;
  }, [tagFilter, activeCategory]);

  // ── Start a game ──
  const startGame = useCallback((game: SampleGame, side: "w" | "b" | "both" = "both") => {
    const parsedMoves = parsePgnMoves(game.pgn);
    if (parsedMoves.length === 0) {
      setLoadError(`Could not load "${game.label}". The PGN may be invalid or empty. Try another game.`);
      return;
    }
    setLoadError(null);

    setSelectedGame(game);
    setMoves(parsedMoves);
    setCurrentMoveIdx(0);
    setGuesses([]);
    setLastGuessResult(null);
    setShowHint(false);
    setGameComplete(false);
    setGuessingSide(side);
    setOpponentLastMove(null);
    setGuessBadge(null);
    chess.reset();
    setBoardFen(chess.fen());
    setSelectedSquare(null);

    // Set orientation based on which side we're guessing
    if (side === "w") setBoardOrientation("white");
    else if (side === "b") setBoardOrientation("black");
    else setBoardOrientation("white");

    // Compute legal moves for initial position
    updateLegalMoves(chess);
  }, [chess]);

  // ── Update legal moves map ──
  const updateLegalMoves = useCallback((c: Chess) => {
    const map = new Map<CbSquare, CbSquare[]>();
    const allMoves = c.moves({ verbose: true });
    for (const m of allMoves) {
      const from = m.from as CbSquare;
      if (!map.has(from)) map.set(from, []);
      map.get(from)!.push(m.to as CbSquare);
    }
    setLegalMoves(map);
  }, []);

  // ── Determine if we should guess this move or auto-play it ──
  const shouldGuess = useCallback((moveIdx: number) => {
    if (guessingSide === "both") return true;
    // Even indices (0, 2, 4...) = White moves, Odd = Black
    const isWhiteMove = moveIdx % 2 === 0;
    if (guessingSide === "w" && isWhiteMove) return true;
    if (guessingSide === "b" && !isWhiteMove) return true;
    return false;
  }, [guessingSide]);

  // ── Advance: play the actual move and move to next ──
  const advanceToNext = useCallback((fromIdx: number) => {
    const nextIdx = fromIdx + 1;
    if (nextIdx >= moves.length) {
      setGameComplete(true);
      return;
    }
    setCurrentMoveIdx(nextIdx);
    // Keep lastGuessResult visible — it stays until the next guess replaces it
    setShowHint(false);
    setSelectedSquare(null);

    // If next move shouldn't be guessed, auto-play it
    if (!shouldGuess(nextIdx)) {
      // Auto-play — give a small delay for the animation
      setTimeout(() => {
        try {
          const result = chess.move(moves[nextIdx]);
          if (result) {
            setBoardFen(chess.fen());
            setOpponentLastMove({ from: result.from, to: result.to });
            setGuessBadge(null);
            playSound(result.captured ? "capture" : "move");
            // Try to advance again
            const next2 = nextIdx + 1;
            if (next2 >= moves.length) {
              setGameComplete(true);
              return;
            }
            setCurrentMoveIdx(next2);
            updateLegalMoves(chess);
          }
        } catch { /* ignore */ }
      }, 400);
    } else {
      updateLegalMoves(chess);
    }
  }, [chess, moves, shouldGuess, updateLegalMoves]);

  // ── Auto-play opponent's first move if guessing one side and it starts with opponent ──
  useEffect(() => {
    if (!selectedGame || moves.length === 0 || currentMoveIdx !== 0) return;
    if (!shouldGuess(0)) {
      // Auto-play first move
      setTimeout(() => {
        try {
          const result = chess.move(moves[0]);
          if (result) {
            setBoardFen(chess.fen());
            setOpponentLastMove({ from: result.from, to: result.to });
            playSound(result.captured ? "capture" : "move");
            setCurrentMoveIdx(1);
            updateLegalMoves(chess);
          }
        } catch { /* ignore */ }
      }, 500);
    }
  }, [selectedGame, moves, currentMoveIdx, shouldGuess, chess, updateLegalMoves]);

  // ── Handle a guess (user plays a move) ──
  const handleGuess = useCallback((from: string, to: string, promotion?: string) => {
    if (gameComplete || currentMoveIdx >= moves.length) return;
    if (!shouldGuess(currentMoveIdx)) return;

    const fenBefore = chess.fen();
    const actualSan = moves[currentMoveIdx];

    // Try user's move
    let userMove: Move | null = null;
    try {
      userMove = chess.move({ from, to, promotion: promotion || undefined });
    } catch { /* invalid */ }

    if (!userMove) return;

    const userSan = userMove.san;

    // Determine result
    let result: GuessResult;
    if (userSan === actualSan) {
      result = "correct";
      playSound(userMove.captured ? "capture" : "move");
    } else {
      // Check if it's "close" — same piece type moving, or same destination
      const tempChess = new Chess(fenBefore);
      let actualMove: Move | null = null;
      try { actualMove = tempChess.move(actualSan); } catch { /* */ }

      const sameDestination = actualMove && userMove.to === actualMove.to;
      const samePiece = actualMove && userMove.piece === actualMove.piece;

      if (sameDestination || samePiece) {
        result = "close";
      } else {
        result = "wrong";
      }

      playSound("wrong");

      // Undo user's move and play the actual move
      chess.undo();
      try {
        chess.move(actualSan);
      } catch { /* */ }
    }

    setBoardFen(chess.fen());

    // Get the actual move's destination for badge placement
    const tempForActual = new Chess(fenBefore);
    let actualTo = "";
    try {
      const am = tempForActual.move(actualSan);
      if (am) actualTo = am.to;
    } catch { /* */ }
    setGuessBadge({ square: actualTo, result });
    setOpponentLastMove(null);

    const guess: MoveGuess = {
      moveIdx: currentMoveIdx,
      san: userSan,
      actualSan,
      result,
      fen: fenBefore,
    };

    setGuesses(prev => [...prev, guess]);
    setLastGuessResult({ result, san: userSan, actual: actualSan });
    setSelectedSquare(null);

    // Async engine evaluation of both moves
    const guessIdx = guesses.length; // index of the guess we just pushed
    (async () => {
      try {
        // Evaluate position before the move.
        // Stockfish always reports cp from the current side-to-move's perspective,
        // so evalBefore.cp > 0 means "the player whose turn it is is winning".
        const evalBefore = await stockfishClient.evaluateFen(fenBefore, 12);
        if (!evalBefore) return;
        const cpBefore = evalBefore.cp; // from mover's perspective

        // Evaluate after user's move
        const chessUser = new Chess(fenBefore);
        const um = chessUser.move(userSan);
        if (!um) return;
        const evalAfterUser = await stockfishClient.evaluateFen(chessUser.fen(), 12);
        // After the move the opponent is now to move, so negate to stay in the original mover's frame
        const cpAfterUser = evalAfterUser ? -evalAfterUser.cp : cpBefore;
        const userCpLoss = Math.max(0, cpBefore - cpAfterUser);

        // Evaluate after master's move
        const chessMaster = new Chess(fenBefore);
        const mm = chessMaster.move(actualSan);
        if (!mm) return;
        const evalAfterMaster = await stockfishClient.evaluateFen(chessMaster.fen(), 12);
        const cpAfterMasterVal = evalAfterMaster ? -evalAfterMaster.cp : cpBefore;
        const masterCpLoss = Math.max(0, cpBefore - cpAfterMasterVal);

        // If user's move is as good or better than GM's, upgrade to "correct"
        const userIsAsGood = userCpLoss <= masterCpLoss + 10; // 10cp tolerance
        const wasWrong = result !== "correct";

        setGuesses(prev => prev.map((g, idx) =>
          idx === guessIdx
            ? {
                ...g,
                userRating: classifyByCpLoss(userCpLoss),
                masterRating: classifyByCpLoss(masterCpLoss),
                ...(wasWrong && userIsAsGood ? { result: "correct" as GuessResult } : {}),
              }
            : g
        ));

        // Upgrade the visible feedback + play correct sound
        if (wasWrong && userIsAsGood) {
          setLastGuessResult({ result: "correct", san: userSan, actual: actualSan });
          setGuessBadge(prev => prev ? { ...prev, result: "correct" } : prev);
          playSound("move");
        }
      } catch { /* engine not available — ratings stay undefined */ }
    })();

    // Auto-advance after a short delay
    setTimeout(() => {
      advanceToNext(currentMoveIdx);
    }, result === "correct" ? 800 : 1400);
  }, [chess, currentMoveIdx, moves, gameComplete, shouldGuess, advanceToNext]);

  // ── Click-to-move ──
  const onSquareClick = useCallback((square: CbSquare) => {
    if (gameComplete) return;
    if (!shouldGuess(currentMoveIdx)) return;

    if (selectedSquare) {
      // Second click — attempt move
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      handleGuess(selectedSquare, square);
      setSelectedSquare(null);
    } else {
      // First click — select piece
      if (legalMoves.has(square)) {
        setSelectedSquare(square);
      }
    }
  }, [selectedSquare, handleGuess, legalMoves, gameComplete, shouldGuess, currentMoveIdx]);

  // ── Drag-and-drop ──
  const onPieceDrop = useCallback((from: CbSquare, to: CbSquare) => {
    handleGuess(from, to);
    return true;
  }, [handleGuess]);

  // ── Board highlights ──
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Highlight opponent's last move (from/to squares) in amber
    if (opponentLastMove) {
      styles[opponentLastMove.from] = { backgroundColor: "rgba(255, 170, 0, 0.35)" };
      styles[opponentLastMove.to] = { backgroundColor: "rgba(255, 170, 0, 0.45)" };
    }

    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
      const targets = legalMoves.get(selectedSquare) ?? [];
      for (const t of targets) {
        styles[t] = {
          background: "radial-gradient(circle, rgba(0,0,0,0.15) 25%, transparent 25%)",
          borderRadius: "50%",
        };
      }
    }
    return styles;
  }, [selectedSquare, legalMoves, opponentLastMove]);

  // ── Hint: highlight the destination square of the actual move ──
  const hintStyles = useMemo(() => {
    if (!showHint || currentMoveIdx >= moves.length) return {};
    const tempChess = new Chess(chess.fen());
    // We need the position BEFORE the current move, but chess is already at that position
    try {
      const move = tempChess.move(moves[currentMoveIdx]);
      if (move) {
        return {
          [move.to]: { backgroundColor: "rgba(16, 185, 129, 0.35)", borderRadius: "50%" },
        } as Record<string, React.CSSProperties>;
      }
    } catch { /* */ }
    return {};
  }, [showHint, currentMoveIdx, moves, chess]);

  // ── Keyboard: F to flip ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        setBoardOrientation(o => o === "white" ? "black" : "white");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Score calculation ──
  const score = useMemo(() => {
    const correct = guesses.filter(g => g.result === "correct").length;
    const close = guesses.filter(g => g.result === "close").length;
    const total = guesses.length;
    const points = correct * 2 + close;
    const maxPoints = total * 2;
    const percentage = total > 0 ? Math.round((points / maxPoints) * 100) : 0;
    return { correct, close, wrong: total - correct - close, total, points, maxPoints, percentage };
  }, [guesses]);

  // ── Guess badge: emoji overlay on the destination square ──
  const GUESS_BADGE_CONFIG: Record<GuessResult, { emoji: string; bg: string; title: string }> = {
    correct: { emoji: "✅", bg: "rgba(16,185,129,0.85)", title: "Correct" },
    close:   { emoji: "⚠️", bg: "rgba(245,158,11,0.85)", title: "Close" },
    wrong:   { emoji: "❌", bg: "rgba(239,68,68,0.85)", title: "Wrong" },
  };

  const customSquareRenderer = useMemo(() => {
    return ((props: any) => {
      const sq = props?.square as string | undefined;
      const showBadge = sq && guessBadge && sq === guessBadge.square;
      const cfg = showBadge ? GUESS_BADGE_CONFIG[guessBadge!.result] : null;
      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {showBadge && cfg && (
            <span
              className="pointer-events-none absolute -right-0.5 -top-0.5 z-[40] flex h-5 w-5 items-center justify-center rounded-full text-[11px] shadow-lg"
              style={{ backgroundColor: cfg.bg }}
              title={cfg.title}
            >
              {cfg.emoji}
            </span>
          )}
        </div>
      );
    }) as any;
  }, [guessBadge]);

  // ── Cooking meter: rolling average of last N guesses ──
  const cookingLevel = useMemo(() => {
    if (guesses.length === 0) return 0;
    const window = guesses.slice(-10); // last 10 guesses
    const pts = window.reduce((s, g) => {
      if (g.result === "correct") return s + 2; // includes engine-upgraded moves
      if (g.result === "close") return s + 1;
      // Engine-rated quality bonus for wrong moves that were still decent
      if (g.result === "wrong" && (g.userRating === "best" || g.userRating === "excellent")) return s + 1;
      if (g.result === "wrong" && g.userRating === "good") return s + 0.5;
      return s;
    }, 0);
    return Math.min(100, Math.round((pts / (window.length * 2)) * 100));
  }, [guesses]);

  const cookingLabel = useMemo(() => {
    if (guesses.length === 0) return { text: "Warming up…", emoji: "🍳", color: "text-slate-400" };
    if (cookingLevel >= 90) return { text: "ABSOLUTELY COOKING", emoji: "🔥", color: "text-red-400" };
    if (cookingLevel >= 75) return { text: "You're on fire!", emoji: "🔥", color: "text-orange-400" };
    if (cookingLevel >= 60) return { text: "Locked in", emoji: "😤", color: "text-amber-400" };
    if (cookingLevel >= 40) return { text: "Getting warmer", emoji: "🌡️", color: "text-yellow-400" };
    if (cookingLevel >= 20) return { text: "Simmering", emoji: "🫕", color: "text-blue-400" };
    return { text: "Stone cold", emoji: "🥶", color: "text-cyan-400" };
  }, [guesses.length, cookingLevel]);

  // ── Move number for display ──
  const currentMoveNumber = Math.floor(currentMoveIdx / 2) + 1;
  const currentSide = currentMoveIdx % 2 === 0 ? "w" : "b";

  // ── Auto-scroll move list ──
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [guesses]);

  // ── Back to game selection ──
  const goBack = useCallback(() => {
    setSelectedGame(null);
    setMoves([]);
    setGuesses([]);
    setGameComplete(false);
    setCurrentMoveIdx(0);
    setLastGuessResult(null);
    setOpponentLastMove(null);
    setGuessBadge(null);
    chess.reset();
    setBoardFen("start");
  }, [chess]);

  /* ────────────── Render: Game Selection ────────────── */
  if (!selectedGame) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Guess the Move
            </h1>
            <p className="mt-3 text-lg text-slate-400">
              Play through famous GM games and try to find the moves they played.
              <br className="hidden sm:block" />
              {SAMPLE_GAMES.length} games across {GAME_CATEGORIES.length} collections.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
            {/* Sidebar: Category folders */}
            <aside className="flex flex-row flex-wrap gap-2 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:gap-1 lg:overflow-y-auto lg:self-start custom-scrollbar">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all text-left ${
                  activeCategory === "all"
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    : "bg-white/[0.02] text-slate-400 border border-white/[0.04] hover:bg-white/[0.06] hover:text-slate-200"
                }`}
              >
                <span>📚</span>
                <span className="truncate">All Games</span>
                <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                  {SAMPLE_GAMES.length}
                </span>
              </button>
              {GAME_CATEGORIES.map(cat => {
                const count = SAMPLE_GAMES.filter(g => g.category === cat.key).length;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all text-left ${
                      activeCategory === cat.key
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        : "bg-white/[0.02] text-slate-400 border border-white/[0.04] hover:bg-white/[0.06] hover:text-slate-200"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                    <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      {count}
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* Main content area */}
            <div className="min-w-0">
              {/* Category description */}
              {activeCategory !== "all" && (
                <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">{GAME_CATEGORIES.find(c => c.key === activeCategory)?.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{GAME_CATEGORIES.find(c => c.key === activeCategory)?.label}</p>
                    <p className="text-xs text-slate-500">{GAME_CATEGORIES.find(c => c.key === activeCategory)?.description}</p>
                  </div>
                </div>
              )}

              {/* Tag filters */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {TAG_OPTIONS.map(tag => (
                  <button
                    key={tag.value}
                    onClick={() => setTagFilter(tag.value)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      tagFilter === tag.value
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm"
                        : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-200"
                    }`}
                  >
                    <span>{tag.icon}</span>
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Game grid */}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredGames.map((game) => {
                  const resultTag = game.pgn.match(/\[Result "([^"]+)"\]/)?.[1] ?? "";
                  const whiteWon = resultTag === "1-0";
                  const blackWon = resultTag === "0-1";
                  const catInfo = GAME_CATEGORIES.find(c => c.key === game.category);
                  return (
                    <div
                      key={game.label}
                      className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-blue-500/20 hover:bg-blue-500/[0.03]"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate">{game.label}</p>
                          <p className="mt-0.5 text-xs text-slate-500 truncate">{game.description}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-slate-400 ml-2">
                          {game.year}
                        </span>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-1">
                        {activeCategory === "all" && catInfo && (
                          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                            {catInfo.icon} {catInfo.label}
                          </span>
                        )}
                        {game.tags.map(tag => (
                          <span key={tag} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-500 capitalize">
                            {tag}
                          </span>
                        ))}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${whiteWon ? "bg-white/[0.08] text-white" : blackWon ? "bg-slate-700/50 text-slate-300" : "bg-white/[0.04] text-slate-500"}`}>
                          {resultTag}
                        </span>
                      </div>

                      {/* Play buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => startGame(game, "w")}
                          className="flex-1 rounded-xl bg-white/[0.06] py-2 text-xs font-bold text-slate-300 transition-all hover:bg-white/[0.12] hover:text-white"
                        >
                          ♔ White
                        </button>
                        <button
                          onClick={() => startGame(game, "b")}
                          className="flex-1 rounded-xl bg-white/[0.06] py-2 text-xs font-bold text-slate-300 transition-all hover:bg-white/[0.12] hover:text-white"
                        >
                          ♚ Black
                        </button>
                        <button
                          onClick={() => startGame(game, "both")}
                          className="rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/25"
                          title="Guess both sides"
                        >
                          Both
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredGames.length === 0 && (
                <div className="mt-12 text-center">
                  <p className="text-slate-500">No games match this filter.</p>
                  <button onClick={() => { setTagFilter("all"); setActiveCategory("all"); }} className="mt-2 text-sm text-blue-400 hover:underline">
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error modal */}
        {loadError && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setLoadError(null)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
              className="relative z-10 w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-950 p-6 shadow-2xl shadow-red-500/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-2xl">⚠️</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white">Failed to Load Game</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{loadError}</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLoadError(null)}
                  className="rounded-xl bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-slate-300 transition-all hover:bg-white/[0.12] hover:text-white"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  /* ────────────── Render: Game In Progress ────────────── */
  return (
    <main className="min-h-screen bg-[#0a0a0f] pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={goBack}
            className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Games
          </button>
          <div className="text-center flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{selectedGame.label}</p>
            <p className="text-[10px] text-slate-500">{selectedGame.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBoardOrientation(o => o === "white" ? "black" : "white")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
              title="Flip board (F)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          {/* Board column */}
          <div ref={boardRef} className="flex flex-col items-center gap-3">
            <div className="w-full max-w-[560px]">
              <div className="overflow-hidden rounded-xl">
                <Chessboard
                  id="guess-board"
                  position={boardFen}
                  boardOrientation={boardOrientation}
                  boardWidth={boardSize}
                  arePiecesDraggable={!gameComplete && shouldGuess(currentMoveIdx)}
                  onPieceDrop={onPieceDrop}
                  onSquareClick={onSquareClick}
                  animationDuration={300}
                  customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                  customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                  showBoardNotation={showCoords}
                  customSquareStyles={{ ...squareStyles, ...hintStyles }}
                  customSquare={customSquareRenderer}
                  customPieces={customPieces}
                />
              </div>
            </div>

            {/* Feedback — persistent until next guess */}
            {lastGuessResult && !gameComplete && (() => {
              const latestGuess = guesses[guesses.length - 1];
              return (
                <div className={`coach-insight flex flex-col gap-1 rounded-xl border px-4 py-3 ${RESULT_BG[lastGuessResult.result]}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-extrabold ${RESULT_COLOR[lastGuessResult.result]}`}>
                      {resultLabel(lastGuessResult.result)}
                    </span>
                    {lastGuessResult.result !== "correct" ? (
                      <span className="text-sm text-slate-300">
                        You played <span className="font-bold">{lastGuessResult.san}</span>
                        {" · "}
                        GM played <span className="font-bold text-emerald-400">{lastGuessResult.actual}</span>
                      </span>
                    ) : lastGuessResult.san !== lastGuessResult.actual ? (
                      <span className="text-sm text-emerald-300/80">
                        <span className="font-bold">{lastGuessResult.san}</span> — equally strong as the GM&apos;s <span className="font-bold">{lastGuessResult.actual}</span>!
                      </span>
                    ) : (
                      <span className="text-sm text-emerald-300/80">
                        <span className="font-bold">{lastGuessResult.san}</span> — you matched the GM!
                      </span>
                    )}
                  </div>
                  {/* Engine rating detail line */}
                  {latestGuess?.userRating && (() => {
                    const isCorrect = latestGuess.result === "correct";
                    const isBadMove = latestGuess.userRating === "inaccuracy" || latestGuess.userRating === "mistake" || latestGuess.userRating === "blunder";
                    return (
                      <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${ENGINE_RATING_COLOR[latestGuess.userRating]}`}>
                            {ENGINE_RATING_EMOJI[latestGuess.userRating]} {isCorrect ? "Engine rates this move" : "Your move"}: {ENGINE_RATING_LABEL[latestGuess.userRating]}
                          </span>
                          {!isCorrect && latestGuess.masterRating && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className={`font-semibold ${ENGINE_RATING_COLOR[latestGuess.masterRating]}`}>
                                GM move: {ENGINE_RATING_LABEL[latestGuess.masterRating]}
                              </span>
                            </>
                          )}
                        </div>
                        {isCorrect && isBadMove && (
                          <span className="text-[10px] text-slate-500">
                            You matched the GM — but even GMs aren&apos;t perfect!
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* Game complete */}
            {gameComplete && (
              <div className="coach-insight w-full max-w-[560px] rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] to-purple-500/[0.03] p-6 text-center">
                <p className="gradient-text text-2xl font-black tracking-tight sm:text-3xl">
                  Game Complete!
                </p>
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-black text-emerald-400">{score.correct}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Correct</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-amber-400">{score.close}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Close</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-red-400">{score.wrong}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Wrong</p>
                  </div>
                  <div className="h-10 w-px bg-white/[0.1]" />
                  <div className="text-center">
                    <p className={`text-2xl font-black ${score.percentage >= 70 ? "text-emerald-400" : score.percentage >= 40 ? "text-amber-400" : "text-red-400"}`}>
                      {score.percentage}%
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Score</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    onClick={goBack}
                    className="rounded-xl bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-slate-300 transition-all hover:bg-white/[0.12] hover:text-white"
                  >
                    ← Choose Another
                  </button>
                  <button
                    onClick={() => startGame(selectedGame, guessingSide)}
                    className="rounded-xl bg-blue-500/15 px-5 py-2.5 text-sm font-bold text-blue-400 transition-all hover:bg-blue-500/25"
                  >
                    🔄 Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Controls: Hint + Move info */}
            {!gameComplete && (
              <div className="flex w-full max-w-[560px] items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${currentSide === "w" ? "bg-white text-gray-900" : "bg-gray-800 text-white"}`}>
                    {currentMoveNumber}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {shouldGuess(currentMoveIdx) ? (
                        <>Find {sideLabel(currentSide)}&apos;s move</>
                      ) : (
                        <>Waiting...</>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Move {currentMoveIdx + 1} of {moves.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!showHint && shouldGuess(currentMoveIdx) && (
                    <button
                      onClick={() => setShowHint(true)}
                      className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20"
                    >
                      💡 Hint
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-bold text-emerald-400">{score.correct}</span>
                    <span>/</span>
                    <span className="font-bold text-slate-300">{score.total}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Move history */}
          <div className="flex flex-col gap-3">
            {/* Cooking Meter */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Cooking Meter</h3>
                <span className="text-sm">{cookingLabel.emoji}</span>
              </div>
              {/* Meter bar */}
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800 border border-white/[0.06]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(cookingLevel, 3)}%`,
                    background: cookingLevel >= 75
                      ? "linear-gradient(90deg, #f97316, #ef4444, #dc2626)"
                      : cookingLevel >= 50
                      ? "linear-gradient(90deg, #eab308, #f97316)"
                      : cookingLevel >= 25
                      ? "linear-gradient(90deg, #3b82f6, #eab308)"
                      : "linear-gradient(90deg, #64748b, #3b82f6)",
                  }}
                />
                {/* Glowing tip when cooking */}
                {cookingLevel >= 60 && (
                  <div
                    className="absolute inset-y-0 w-3 rounded-full blur-sm animate-pulse"
                    style={{
                      left: `calc(${cookingLevel}% - 6px)`,
                      background: cookingLevel >= 75 ? "#ef4444" : "#f97316",
                    }}
                  />
                )}
              </div>
              <p className={`mt-1.5 text-center text-[11px] font-bold tracking-wide ${cookingLabel.color}`}>
                {cookingLabel.text}
              </p>
            </div>

            {/* Score card */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Your Score</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-lg font-black text-emerald-400">{score.correct}</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-amber-400">{score.close}</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">Close</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-red-400">{score.wrong}</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">Wrong</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-black ${score.percentage >= 70 ? "text-emerald-400" : score.percentage >= 40 ? "text-amber-400" : "text-red-400"}`}>
                    {score.total > 0 ? `${score.percentage}%` : "—"}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">Score</p>
                </div>
              </div>
            </div>

            {/* Move history */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Move History</h3>
              <div ref={moveListRef} className="max-h-[400px] overflow-y-auto space-y-1 custom-scrollbar">
                {guesses.length === 0 && (
                  <p className="text-center text-xs text-slate-600 py-4">
                    Make your first guess to start...
                  </p>
                )}
                {guesses.map((g, i) => {
                  const moveNum = Math.floor(g.moveIdx / 2) + 1;
                  const isWhite = g.moveIdx % 2 === 0;
                  return (
                    <div
                      key={i}
                      className={`group/row relative flex flex-col gap-0.5 rounded-lg border px-3 py-1.5 text-xs ${RESULT_BG[g.result]}`}
                    >
                      {/* Main row */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 w-8 shrink-0">
                          {moveNum}{isWhite ? "." : "…"}
                        </span>
                        {g.result === "correct" ? (
                          <span className="font-bold text-emerald-400">{g.actualSan}</span>
                        ) : (
                          <>
                            <span className="text-slate-500 line-through">{g.san}</span>
                            <span className="text-slate-600">→</span>
                            <span className="font-bold text-emerald-400">{g.actualSan}</span>
                          </>
                        )}
                        <span className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          g.result === "correct" ? "bg-emerald-500/20 text-emerald-400" :
                          g.result === "close" ? "bg-amber-500/20 text-amber-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {g.result === "correct" ? "✓" : g.result === "close" ? "≈" : "✗"}
                        </span>
                      </div>
                      {/* Engine rating detail — always visible */}
                      {g.userRating && (
                        <div className="flex items-center gap-2 pl-8 text-[9px] text-slate-400">
                          <span>
                            {ENGINE_RATING_EMOJI[g.userRating]}{" "}
                            <span className={`font-semibold ${ENGINE_RATING_COLOR[g.userRating]}`}>{ENGINE_RATING_LABEL[g.userRating]}</span>
                          </span>
                          {g.masterRating && g.result !== "correct" && (
                            <span>· GM: <span className={`font-semibold ${ENGINE_RATING_COLOR[g.masterRating]}`}>{ENGINE_RATING_LABEL[g.masterRating]}</span></span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Game info */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Game Info</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">White</span>
                  <span className="font-semibold text-white">{selectedGame.white}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Black</span>
                  <span className="font-semibold text-white">{selectedGame.black}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Year</span>
                  <span className="font-semibold text-white">{selectedGame.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Moves</span>
                  <span className="font-semibold text-white">{moves.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guessing</span>
                  <span className="font-semibold text-white">
                    {guessingSide === "w" ? "White" : guessingSide === "b" ? "Black" : "Both sides"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
