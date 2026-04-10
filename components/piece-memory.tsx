"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import { playSound } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";

/* ------------------------------------------------------------------ */
/*  Position bank: interesting mid-game positions for memory training  */
/* ------------------------------------------------------------------ */

export type MemoryPosition = {
  fen: string;
  label: string;
  question: string; // e.g. "Where is the white queen?"
  answer: string; // e.g. "d1"
  hint: string; // e.g. "Look at the first rank"
};

export const MEMORY_POSITIONS: MemoryPosition[] = [
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    label: "Italian Game — where is the white bishop?",
    question: "After 1.e4 e5 2.Nf3 Nc6 3.Bc4: where is the white bishop?",
    answer: "c4",
    hint: "It aims at f7, the kingside",
  },
  {
    fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
    label: "Sicilian Defence — which pawn moved?",
    question: "After 1.e4 c5: which square did the black pawn move to?",
    answer: "c5",
    hint: "Black plays asymmetrically, not mirroring e4",
  },
  {
    fen: "r1bqkb1r/ppp2ppp/2np1n2/4p3/2B1P3/2NP4/PPP2PPP/R1BQK1NR w KQkq - 0 5",
    label: "Giuoco Piano — count White's minor pieces",
    question: "How many white minor pieces are off the back rank?",
    answer: "3",
    hint: "Minor pieces are bishops and knights",
  },
  {
    fen: "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    label: "Both bishops on c4/c5 — mirror image",
    question: "Which square does the black bishop occupy?",
    answer: "c5",
    hint: "It mirrors the white bishop's position",
  },
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    label: "Ruy López — pin on the knight",
    question: "Where is the white bishop that pins the knight?",
    answer: "b5",
    hint: "It came from f1 via a4 or directly to b5",
  },
  {
    fen: "rnbqkbnr/ppp1pppp/8/3p4/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2",
    label: "Queen's Gambit — tension in the center",
    question: "What are the two center pawns White played?",
    answer: "d4 and e4",
    hint: "White immediately occupies both central squares",
  },
  {
    fen: "4k3/4p3/4K3/8/8/8/8/8 w - - 0 1",
    label: "King + Pawn endgame",
    question: "What square is the black king on?",
    answer: "e8",
    hint: "The king is on the back rank, same file as the pawn",
  },
  {
    fen: "8/8/8/3k4/3P4/3K4/8/8 w - - 0 1",
    label: "Endgame — pawn race",
    question: "What square is the white pawn on?",
    answer: "d4",
    hint: "It's on the fourth rank, central file",
  },
];

export function getDailyMemoryPositions(
  count: number,
  seed: number,
): MemoryPosition[] {
  const all = [...MEMORY_POSITIONS];
  let s = seed;
  for (let i = all.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

type Phase =
  | "memorize" // board is visible, countdown running
  | "recall" // board is hidden, answer input
  | "result"; // right/wrong + explanation

type Props = {
  position: MemoryPosition;
  onComplete: (correct: boolean) => void;
  viewSeconds?: number;
};

export function PieceMemory({ position, onComplete, viewSeconds = 5 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(400);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();

  const [phase, setPhase] = useState<Phase>("memorize");
  const [timeLeft, setTimeLeft] = useState(viewSeconds);
  const [answer, setAnswer] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Board container autoscale
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setBoardSize(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Countdown timer during memorize phase
  useEffect(() => {
    if (phase !== "memorize") return;
    if (timeLeft <= 0) {
      setPhase("recall");
      return;
    }
    const t = setTimeout(() => setTimeLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const handleSubmit = useCallback(() => {
    if (!answer.trim()) return;
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
    const isCorrect = norm(answer) === norm(position.answer);
    setCorrect(isCorrect);
    setPhase("result");
    if (isCorrect) {
      playSound("correct");
      earnCoins("study_task");
    } else {
      playSound("wrong");
    }
    setTimeout(() => onComplete(isCorrect), 2200);
  }, [answer, position.answer, onComplete]);

  return (
    <div className="space-y-4">
      {/* Label */}
      <p className="text-sm font-medium text-slate-400">{position.label}</p>

      {/* Board (hidden during recall/result) */}
      {phase === "memorize" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Study the position…</span>
            <span
              className={`font-bold tabular-nums ${timeLeft <= 2 ? "text-red-400" : "text-amber-400"}`}
            >
              {timeLeft}s
            </span>
          </div>
          <div ref={containerRef} className="w-full max-w-[440px]">
            <Chessboard
              id="memory-board"
              position={position.fen}
              boardWidth={boardSize}
              arePiecesDraggable={false}
              customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
              customLightSquareStyle={{
                backgroundColor: boardTheme.lightSquare,
              }}
              customPieces={customPieces}
            />
          </div>
          {/* Progress bar */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-1000"
              style={{ width: `${(timeLeft / viewSeconds) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Hidden board overlay during recall */}
      {(phase === "recall" || phase === "result") && (
        <div className="relative w-full max-w-[440px]">
          <div
            ref={containerRef}
            className="opacity-0 pointer-events-none w-full"
          >
            <Chessboard
              id="memory-board-hidden"
              position={position.fen}
              boardWidth={boardSize}
              arePiecesDraggable={false}
              customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
              customLightSquareStyle={{
                backgroundColor: boardTheme.lightSquare,
              }}
              customPieces={customPieces}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#0a0a0f]/95 border border-white/[0.08]">
            <span className="text-4xl">🧠</span>
          </div>
        </div>
      )}

      {/* Question & answer input */}
      {phase !== "memorize" && (
        <div className="space-y-3">
          <p className="text-base font-semibold text-white">
            {position.question}
          </p>

          {phase === "recall" && (
            <div className="flex gap-2">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder="Your answer…"
                autoFocus
                className="flex-1 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
              >
                Check
              </button>
            </div>
          )}

          {phase === "recall" &&
            (showHint ? (
              <p className="text-xs text-amber-400/80">
                💡 Starts with:{" "}
                <span className="font-mono font-bold">
                  {position.answer[0].toUpperCase()}
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                Show hint
              </button>
            ))}

          {phase === "result" && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                correct
                  ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300"
                  : "border-red-500/20 bg-red-500/[0.05] text-red-300"
              }`}
            >
              <span className="mr-1 font-bold">
                {correct ? "✓ Correct!" : `✗ The answer is: ${position.answer}`}
              </span>
              {!correct && ` — ${position.hint}.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
