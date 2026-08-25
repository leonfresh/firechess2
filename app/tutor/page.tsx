"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Chessboard } from "@/components/chessboard-compat";
import { Chess } from "chess.js";
import { useBoardSize } from "@/lib/use-board-size";
import {
  useBoardTheme,
  useShowCoordinates,
  useCustomPieces,
} from "@/lib/use-coins";
import { usePuzzleTutor } from "@/lib/use-puzzle-tutor";

const PuzzleAvatar = dynamic(
  () => import("@/components/puzzle-avatar/PuzzleAvatar"),
  { ssr: false, loading: () => <div className="w-full h-full" /> },
);

interface Puzzle {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string;
  game_url: string;
}

const DIFFICULTY_RANGES = [
  { label: "Beginner", min: 600, max: 1000 },
  { label: "Club", min: 1000, max: 1500 },
  { label: "Advanced", min: 1500, max: 2000 },
  { label: "Master", min: 2000, max: 9999 },
] as const;

const VOICES = [
  { id: "en-US-AvaNeural", label: "Ava ✨" },
  { id: "en-US-JennyNeural", label: "Jenny" },
  { id: "en-US-AriaNeural", label: "Aria" },
  { id: "en-US-SaraNeural", label: "Sara" },
  { id: "en-US-MichelleNeural", label: "Michelle" },
  { id: "en-GB-SoniaNeural", label: "Sonia 🇬🇧" },
  { id: "en-AU-NatashaNeural", label: "Natasha 🇦🇺" },
] as const;

function uciToMoveObj(uci: string) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length === 5 ? (uci[4] as "q" | "r" | "b" | "n") : undefined,
  };
}

const PHASE_LABEL: Record<string, string> = {
  loading: "Analyzing…",
  intro: "Introduction",
  hint: "Hint",
  thinking: "Your Turn!",
  move: "Solution",
  opponent_dev_question: "Their Move?",
  opponent_dev_answer: "Variation",
  conclusion: "Well Done!",
  done: "Complete",
};

export default function TutorPage() {
  const { ref: boardRef, size: boardSize } = useBoardSize();
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();
  const customPieces = useCustomPieces();

  // Board state
  const [boardFen, setBoardFen] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
    "white",
  );
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [showWrong, setShowWrong] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);

  // Puzzle state
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<
    (typeof DIFFICULTY_RANGES)[number]
  >(DIFFICULTY_RANGES[1]);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES[0].id);

  // Tutor
  const {
    state: tutorState,
    audioRef: tutorAudioRef,
    startTutor,
    submitMove,
    stopTutor,
    skipPhase,
    setVoice,
  } = usePuzzleTutor();

  const startingFenRef = useRef<string | null>(null);
  const solutionMovesRef = useRef<string[]>([]);
  const triggerMoveRef = useRef<{ from: string; to: string } | null>(null);

  useEffect(() => {
    fetch("/api/turso-puzzles/ping").catch(() => {});
  }, []);

  const startLoadedPuzzle = useCallback(() => {
    const fen = startingFenRef.current;
    if (!puzzle || !fen || solutionMovesRef.current.length === 0) {
      return;
    }

    startTutor({
      id: puzzle.id,
      fen,
      solutionMoves: solutionMovesRef.current.join(" "),
      themes: puzzle.themes ?? "",
      rating: puzzle.rating,
    });
  }, [puzzle, startTutor]);

  // Sync board with tutor progress — replay only the plies the tutor has applied.
  useEffect(() => {
    const startFen = startingFenRef.current;
    if (!startFen) return;

    const moves = solutionMovesRef.current;
    const ch = new Chess();
    try {
      ch.load(startFen);
      for (
        let i = 0;
        i < tutorState.appliedMoveCount && i < moves.length;
        i++
      ) {
        ch.move(uciToMoveObj(moves[i]));
      }
      setBoardFen(ch.fen());
      if (tutorState.appliedMoveCount > 0) {
        const lastUci =
          moves[Math.min(tutorState.appliedMoveCount - 1, moves.length - 1)];
        if (lastUci) {
          setLastMove({ from: lastUci.slice(0, 2), to: lastUci.slice(2, 4) });
        }
      } else {
        setLastMove(triggerMoveRef.current);
      }
    } catch {
      setBoardFen(startFen);
    }
  }, [tutorState.appliedMoveCount]);

  // Load puzzle and prepare it for tutor playback
  const loadPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    stopTutor();
    setPuzzle(null);
    startingFenRef.current = null;
    solutionMovesRef.current = [];
    triggerMoveRef.current = null;
    setLastMove(null);
    setShowCorrect(false);

    try {
      const params = new URLSearchParams({
        ratingMin: String(difficulty.min),
        ratingMax: String(difficulty.max),
        limit: "1",
      });

      const fetchPuzzle = async () => {
        return fetch(`/api/turso-puzzles?${params}`);
      };

      let res = await fetchPuzzle();
      if (!res.ok) {
        await fetch("/api/turso-puzzles/ping").catch(() => {});
        res = await fetchPuzzle();
      }

      if (!res.ok) throw new Error("Failed to fetch puzzle");
      const data = (await res.json()) as { puzzles: Puzzle[] };
      const p = data.puzzles[0];
      if (!p) throw new Error("No puzzle found");

      // Apply trigger move so board shows the position the player must solve
      const allMoves = p.moves.split(" ").filter(Boolean);
      const [triggerUci, ...solution] = allMoves;

      const chess = new Chess();
      chess.load(p.fen);
      chess.move(uciToMoveObj(triggerUci));

      const fen = chess.fen();
      startingFenRef.current = fen;
      solutionMovesRef.current = solution;
      setBoardFen(fen);
      setBoardOrientation(chess.turn() === "b" ? "black" : "white");
      const triggerMove = {
        from: triggerUci.slice(0, 2),
        to: triggerUci.slice(2, 4),
      };
      triggerMoveRef.current = triggerMove;
      setLastMove(triggerMove);
      setPuzzle(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [difficulty, stopTutor]);

  // Auto-load a puzzle, but wait for an explicit user start before narrating.
  useEffect(() => {
    loadPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setVoice(selectedVoice);
  }, [selectedVoice, setVoice]);

  const isInteractive =
    tutorState.awaitingUserMove && tutorState.phase === "thinking";

  const legalMoves = useMemo(() => {
    const movesBySource = new Map<string, string[]>();
    if (!isInteractive) {
      return movesBySource;
    }

    try {
      const currentBoard = new Chess(boardFen);
      const verboseMoves = currentBoard.moves({ verbose: true });
      for (const move of verboseMoves) {
        const targets = movesBySource.get(move.from) ?? [];
        targets.push(move.to);
        movesBySource.set(move.from, targets);
      }
    } catch {
      // Ignore malformed positions and leave the board without click hints.
    }

    return movesBySource;
  }, [boardFen, isInteractive]);

  useEffect(() => {
    setSelectedSquare(null);
  }, [boardFen, isInteractive]);

  // Square highlight styles for last move
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: "rgba(20, 168, 152, 0.38)" };
      styles[lastMove.to] = { backgroundColor: "rgba(20, 168, 152, 0.60)" };
    }

    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: "rgba(20,85,255,0.45)" };
      for (const target of legalMoves.get(selectedSquare) ?? []) {
        const hasPiece = (() => {
          try {
            return Boolean(new Chess(boardFen).get(target as never));
          } catch {
            return false;
          }
        })();

        styles[target] = hasPiece
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
  }, [boardFen, lastMove, legalMoves, selectedSquare]);

  // Handle player move attempt during tutor thinking phases.
  const handleTutorMove = useCallback(
    (from: string, to: string): boolean => {
      if (!tutorState.awaitingUserMove || tutorState.phase !== "thinking") {
        return false;
      }

      const expectedUci = tutorState.expectedMove;
      if (!expectedUci) return false;
      const attemptedUci =
        expectedUci.length === 5 &&
        expectedUci.slice(0, 2) === from &&
        expectedUci.slice(2, 4) === to
          ? `${from}${to}${expectedUci[4]}`
          : `${from}${to}`;

      const currentBoard = new Chess();
      try {
        currentBoard.load(boardFen);
        currentBoard.move(uciToMoveObj(attemptedUci));
      } catch {
        setShowWrong(true);
        setTimeout(() => setShowWrong(false), 700);
        return false;
      }

      const isCorrect =
        expectedUci.slice(0, 2) === from && expectedUci.slice(2, 4) === to;

      if (isCorrect) {
        submitMove(attemptedUci);
        setShowCorrect(true);
        setTimeout(() => setShowCorrect(false), 800);
        return true;
      }

      setShowWrong(true);
      setTimeout(() => setShowWrong(false), 700);
      return false;
    },
    [
      boardFen,
      submitMove,
      tutorState.awaitingUserMove,
      tutorState.expectedMove,
      tutorState.phase,
    ],
  );

  const onSquareClick = useCallback(
    (square: string) => {
      if (!isInteractive) {
        return;
      }

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }

        if (legalMoves.has(square)) {
          setSelectedSquare(square);
          return;
        }

        handleTutorMove(selectedSquare, square);
        setSelectedSquare(null);
        return;
      }

      if (legalMoves.has(square)) {
        setSelectedSquare(square);
      }
    },
    [handleTutorMove, isInteractive, legalMoves, selectedSquare],
  );

  const onPieceDrop = useCallback(
    (from: string, to: string): boolean => {
      const didMove = handleTutorMove(from, to);
      setSelectedSquare(null);
      return didMove;
    },
    [handleTutorMove],
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8 md:px-8 md:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Puzzle Tutor
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Watch, listen, and learn — your personal coach walks you through
              every move
            </p>
          </div>
          <div className="flex-1" />
          <div className="flex gap-1.5 flex-wrap">
            {DIFFICULTY_RANGES.map((d) => (
              <button
                key={d.label}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  difficulty.label === d.label
                    ? "bg-pink-500/20 border-pink-500/50 text-pink-300"
                    : "border-white/[0.08] bg-transparent text-zinc-500 hover:text-zinc-200 hover:border-white/[0.15]"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {/* Voice selector */}
          <select
            value={selectedVoice}
            onChange={(e) => {
              setSelectedVoice(e.target.value);
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs border border-white/[0.08] bg-zinc-900 text-zinc-300 hover:border-white/[0.15] transition-all cursor-pointer focus:outline-none focus:border-pink-500/50"
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <button
            onClick={startLoadedPuzzle}
            disabled={loading || tutorState.isPlaying || !puzzle}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-500 hover:to-purple-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
          >
            {loading
              ? "Loading…"
              : tutorState.isPlaying
                ? "Playing…"
                : "Start →"}
          </button>
          <button
            onClick={loadPuzzle}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-white/[0.16] hover:bg-white/[0.06]"
          >
            New Puzzle
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-xl bg-red-950/40 border border-red-800/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {tutorState.error && (
          <div className="px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-sm">
            {tutorState.error}
          </div>
        )}

        {/* ── Main two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* Left: Avatar + speech bubble */}
          <div className="flex flex-col gap-3">
            {/* Avatar canvas */}
            <div
              className="relative rounded-2xl overflow-hidden border border-pink-500/[0.15] bg-gradient-to-b from-pink-950/20 to-purple-950/20"
              style={{ aspectRatio: "3/4" }}
            >
              <PuzzleAvatar
                audioRef={tutorAudioRef}
                gesture={tutorState.gesture}
                className="w-full h-full"
              />

              {/* Phase label overlay */}
              {tutorState.phase !== "idle" && (
                <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm ${
                      tutorState.phase === "thinking"
                        ? "bg-pink-500/50 text-pink-100"
                        : tutorState.phase === "done"
                          ? "bg-emerald-500/50 text-emerald-100"
                          : "bg-black/50 text-zinc-200"
                    }`}
                  >
                    {PHASE_LABEL[tutorState.phase] ?? tutorState.phase}
                  </span>
                  {tutorState.phase === "thinking" &&
                    tutorState.thinkingCountdown > 0 && (
                      <span className="text-base font-mono font-bold text-pink-200 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-0.5">
                        {tutorState.thinkingCountdown}s
                      </span>
                    )}
                </div>
              )}
            </div>

            {/* Speech bubble */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p
                className={`text-sm leading-relaxed min-h-[72px] transition-colors duration-200 ${
                  tutorState.isPlaying ? "text-zinc-100" : "text-zinc-500"
                }`}
              >
                {tutorState.currentText ||
                  (tutorState.phase === "idle"
                    ? puzzle
                      ? "Puzzle ready. Click Start when you want the tutor to begin narrating."
                      : "Loading a puzzle for your coaching session..."
                    : tutorState.phase === "loading"
                      ? "Let me take a look at this one…"
                      : "…")}
              </p>

              <div className="mt-3 flex gap-2 items-center flex-wrap">
                {tutorState.isPlaying && tutorState.phase !== "thinking" && (
                  <button
                    onClick={skipPhase}
                    className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors border border-white/[0.06] rounded-lg px-2.5 py-1 hover:border-white/[0.15]"
                  >
                    Skip →
                  </button>
                )}
                {tutorState.isPlaying && (
                  <button
                    onClick={stopTutor}
                    className="text-xs text-zinc-700 hover:text-red-400 transition-colors ml-auto"
                  >
                    Stop
                  </button>
                )}
                {!tutorState.isPlaying &&
                  puzzle &&
                  tutorState.phase !== "done" && (
                    <button
                      onClick={startLoadedPuzzle}
                      disabled={loading || !puzzle}
                      className="text-xs text-pink-400 hover:text-pink-300 transition-colors border border-pink-500/30 rounded-lg px-2.5 py-1 hover:border-pink-500/50 disabled:opacity-40"
                    >
                      Start →
                    </button>
                  )}
                {!tutorState.isPlaying && (
                  <button
                    onClick={loadPuzzle}
                    disabled={loading}
                    className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors border border-white/[0.06] rounded-lg px-2.5 py-1 hover:border-white/[0.15] disabled:opacity-40"
                  >
                    {tutorState.phase === "done"
                      ? "Next Puzzle →"
                      : "New Puzzle"}
                  </button>
                )}
              </div>
            </div>

            {/* Puzzle metadata */}
            {puzzle && (
              <div className="rounded-xl px-3 py-2 text-xs text-zinc-700 font-mono flex gap-3 items-center">
                <span>#{puzzle.id}</span>
                <span className="text-orange-500/60">★{puzzle.rating}</span>
                <span className="truncate">
                  {puzzle.themes?.split(" ").slice(0, 3).join(", ")}
                </span>
                <a
                  href={puzzle.game_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto hover:text-zinc-400 transition-colors"
                >
                  ↗
                </a>
              </div>
            )}
          </div>

          {/* Right: Chess board */}
          <div className="flex flex-col gap-3">
            <div ref={boardRef} className="relative w-full">
              {/* Wrong move flash */}
              {showWrong && (
                <div className="pointer-events-none absolute inset-0 z-10 rounded bg-red-500/25 animate-pulse" />
              )}

              {/* Correct move flash */}
              {showCorrect && (
                <div className="pointer-events-none absolute inset-0 z-10 rounded bg-emerald-500/20" />
              )}

              {/* "Find the move" badge during thinking */}
              {isInteractive && (
                <div className="absolute top-3 right-3 z-20">
                  <span className="text-xs font-bold bg-pink-600/90 text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
                    Find the move!
                  </span>
                </div>
              )}

              <Chessboard
                position={boardFen}
                boardWidth={boardSize}
                boardOrientation={boardOrientation}
                arePiecesDraggable={isInteractive}
                isDraggablePiece={({ sourceSquare }) =>
                  isInteractive && legalMoves.has(sourceSquare)
                }
                onPieceDrop={onPieceDrop}
                onSquareClick={onSquareClick}
                customSquareStyles={squareStyles}
                showBoardNotation={showCoords}
                customDarkSquareStyle={{
                  backgroundColor: boardTheme.darkSquare,
                }}
                customLightSquareStyle={{
                  backgroundColor: boardTheme.lightSquare,
                }}
                customPieces={customPieces}
                animationDuration={350}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setBoardOrientation((o) =>
                    o === "white" ? "black" : "white",
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-white/[0.06] text-zinc-500 text-xs hover:text-zinc-200 hover:border-white/[0.12] transition-all"
              >
                ⇅ Flip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
