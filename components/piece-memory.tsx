"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Chessboard } from "@/components/chessboard-compat";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import { useBoardSize } from "@/lib/use-board-size";
import { playSound } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

/**
 * questionType:
 *   "location" — answer is a square (e.g. "e4"); user clicks the empty board
 *   "piece"    — answer is a piece name (e.g. "knight"); user picks from piece buttons
 *   "choice"   — freeform multiple choice; user picks from choices[]
 */
export type MemoryPosition = {
  fen: string;
  label: string;
  question: string;
  answer: string;
  hint: string;
  questionType: "location" | "piece" | "choice";
  choices?: string[];
};

/* ------------------------------------------------------------------ */
/*  Position bank                                                       */
/* ------------------------------------------------------------------ */

export const MEMORY_POSITIONS: MemoryPosition[] = [
  // ── Location: click the square ──────────────────────────────────────
  {
    // Ruy López — Ba4 lurking after ...a6
    fen: "r1bqk2r/1bpp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQR1K1 b kq - 5 6",
    label: "Ruy López — Morphy Defence (main line, 6 moves in)",
    question: "A white bishop retreated after a pawn push. Click the square it's on now.",
    answer: "a4",
    hint: "It retreated from b5 when ...a6 was played",
    questionType: "location",
  },
  {
    // King's Indian Defence — Bg7 fianchetto
    fen: "rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP2BPPP/R1BQK2R b KQ - 2 7",
    label: "King's Indian Defence — Classical Setup (7 moves in)",
    question: "Black has fianchettoed a bishop. Click the square it sits on.",
    answer: "g7",
    hint: "Fianchetto means the bishop sits behind its own pawn on the second diagonal square",
    questionType: "location",
  },
  {
    // Nimzo-Indian — Bb4 pin
    fen: "rnbq1rk1/pp3ppp/4pn2/2pp4/1bPP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 0 7",
    label: "Nimzo-Indian Defence — Classical (7 moves in)",
    question: "A black bishop is actively pinning a white piece. Where is it?",
    answer: "b4",
    hint: "It pins the knight that would otherwise help control the centre",
    questionType: "location",
  },
  {
    // Sicilian Najdorf 6.Bg5 — Bg5
    fen: "rnbqkb1r/1p3ppp/p2ppn2/6B1/3NPP2/2N5/PPP3PP/R2QKB1R b KQkq - 0 8",
    label: "Sicilian Najdorf — 6.Bg5 Variation (8 moves in)",
    question: "White has an aggressively placed bishop applying indirect pressure. Click it.",
    answer: "g5",
    hint: "It threatens to double black's pawns by capturing on f6",
    questionType: "location",
  },
  {
    // QGD Orthodox — Bg5
    fen: "r1bq1rk1/pppnbppp/4pn2/3p2B1/2PP4/2N1PN2/PP3PPP/R2QKB1R w KQ - 4 7",
    label: "Queen's Gambit Declined — Orthodox Defence (7 moves in)",
    question: "White's most active bishop applies pin pressure from outside the chain. Click it.",
    answer: "g5",
    hint: "It pins the knight against the queen",
    questionType: "location",
  },
  {
    // Catalan — Bg2 fianchetto
    fen: "rnbq1rk1/ppp1bppp/4pn2/3p4/2PP4/5NP1/PP2PPBP/RNBQ1RK1 b - - 4 6",
    label: "Catalan Opening — Closed Variation (6 moves in)",
    question: "White has fianchettoed a bishop that dominates the long diagonal. Click it.",
    answer: "g2",
    hint: "It exerts long-range pressure from behind white's pawns",
    questionType: "location",
  },
  {
    // Caro-Kann Classical — Bg6 retreat
    fen: "rn1qkbnr/pp2pppp/2p3b1/8/3P4/6N1/PPP2PPP/R1BQKBNR w KQkq - 1 6",
    label: "Caro-Kann Defence — Classical Variation (6 moves in)",
    question: "Black's bishop retreated to safety after being threatened. Click its new square.",
    answer: "g6",
    hint: "It retreated from f5 when the white knight chased it",
    questionType: "location",
  },
  {
    // Sicilian Dragon — Bg7 Dragon bishop
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 3 9",
    label: "Sicilian Dragon — Yugoslav Attack Setup (9 moves in)",
    question: "The famous Dragon bishop breathes fire along the long diagonal. Click it.",
    answer: "g7",
    hint: "The 'Dragon bishop' is why this variation has its fierce name",
    questionType: "location",
  },
  {
    // Morphy's Opera Game – position before Qb8+!! (final combination)
    // (Morphy vs Duke of Brunswick & Count Isouard, Paris 1858, move 15 side)
    fen: "1r1k3r/p2n1ppp/4q3/4p3/8/1Q6/PPP2PPP/2KR4 w - - 0 16",
    label: "Morphy's Opera Game (Paris, 1858) — just before a famous Queen sacrifice",
    question: "White's queen is ready to deliver a spectacular blow. Click the square it's on.",
    answer: "b3",
    hint: "The queen is on the b-file, eyeing both b8 and f7",
    questionType: "location",
  },
  {
    // Fischer vs Byrne 1956 – "Game of the Century", around move 17 after Nxc3
    // Position approx after 17.Bxb6 Nxb1 18.Bxc7
    fen: "r3r1k1/ppBb1ppp/2n5/2b5/8/2n5/PPP2PPP/R1B1K2R w KQ - 0 18",
    label: "Fischer vs Byrne — Game of the Century (New York, 1956)",
    question: "Black has a knight deep in white's position on a stunning outpost. Click it.",
    answer: "c3",
    hint: "It sits on c3, threatening multiple pieces and causing chaos",
    questionType: "location",
  },
  {
    // Endgame — Rook and King vs King
    fen: "8/8/4k3/8/4K3/8/8/4R3 w - - 0 1",
    label: "Rook Endgame — Key squares (study position)",
    question: "The white rook controls a critical rank. Click the square the rook is on.",
    answer: "e1",
    hint: "It's on the back rank, ready to cut off the black king",
    questionType: "location",
  },
  {
    // KP endgame — King and Pawn
    fen: "8/8/8/3k4/3P4/3K4/8/8 w - - 0 1",
    label: "King & Pawn Endgame — Opposition study",
    question: "The critical pawn is in the centre. Click the square it stands on.",
    answer: "d4",
    hint: "It's on the fourth rank, ready to push towards promotion",
    questionType: "location",
  },

  // ── Piece type: what's on this square? ──────────────────────────────
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    label: "Italian Game — after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6",
    question: "What type of piece occupies c6 for Black?",
    answer: "knight",
    hint: "It developed to defend the e5 pawn and contest the centre",
    questionType: "piece",
  },
  {
    fen: "rnbqkbnr/pp1ppppp/8/2p5/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 2",
    label: "Queen's Gambit — early central tension",
    question: "What type of piece is sitting on d4 for White?",
    answer: "pawn",
    hint: "White played two central moves in the first two turns",
    questionType: "piece",
  },
  {
    fen: "r1bq1rk1/pp2ppbp/2np1np1/3Pp3/2B1P3/2N1BN2/PPP2PPP/R2QK2R w KQ - 0 9",
    label: "King's Indian — sharp pawn structure (9 moves in)",
    question: "What type of piece is on d5 for White?",
    answer: "pawn",
    hint: "White pushed a central pawn deep into black's half to gain space",
    questionType: "piece",
  },
  {
    fen: "r1bq1rk1/1p1nbppp/p2ppn2/8/3NP3/2N1BP2/PPPQ2PP/2KR1B1R w - - 3 10",
    label: "Sicilian Scheveningen — solid black setup (10 moves in)",
    question: "What type of piece does Black have developed on d7?",
    answer: "knight",
    hint: "Black used it to support the pawn structure while developing",
    questionType: "piece",
  },

  // ── Choice: multiple choice questions ───────────────────────────────
  {
    fen: "r1bqkb1r/ppp2ppp/2np1n2/4p3/2B1P3/2NP4/PPP2PPP/R1BQK1NR w KQkq - 0 5",
    label: "Giuoco Piano — active development (5 moves in)",
    question: "How many white minor pieces (knights + bishops) are off their starting squares?",
    answer: "3",
    hint: "Count the knight on c3, bishop on c4, and the knight that started on g1",
    questionType: "choice",
    choices: ["2", "3", "4", "5"],
  },
  {
    fen: "8/8/4k3/3pP3/3K4/8/8/8 w - - 0 1",
    label: "Pawn Endgame — passed pawns racing",
    question: "How many pawns remain on the board in total?",
    answer: "2",
    hint: "Count all pawns, both colours",
    questionType: "choice",
    choices: ["1", "2", "3", "4"],
  },
  {
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 3 9",
    label: "Sicilian Dragon — how many pieces on the kingside?",
    question: "How many black pieces (non-pawns) are on the kingside (files e–h)?",
    answer: "3",
    hint: "Count the fianchettoed bishop, the knight, and the rook after castling",
    questionType: "choice",
    choices: ["2", "3", "4", "5"],
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
/*  Piece selector options                                              */
/* ------------------------------------------------------------------ */

const PIECE_OPTIONS = [
  { label: "Pawn", value: "pawn", symbol: "♟" },
  { label: "Knight", value: "knight", symbol: "♞" },
  { label: "Bishop", value: "bishop", symbol: "♝" },
  { label: "Rook", value: "rook", symbol: "♜" },
  { label: "Queen", value: "queen", symbol: "♛" },
  { label: "King", value: "king", symbol: "♚" },
  { label: "Empty", value: "empty", symbol: "◻" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

type Phase = "memorize" | "recall" | "result";

export function PieceMemory({
  position,
  onComplete,
  viewSeconds = 7,
}: {
  position: MemoryPosition;
  onComplete: (correct: boolean) => void;
  viewSeconds?: number;
}) {
  const { ref: boardRef, size: boardSize } = useBoardSize(1600, {
    evalBar: false,
  });
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();

  const [phase, setPhase] = useState<Phase>("memorize");
  const [timeLeft, setTimeLeft] = useState(viewSeconds);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Countdown during memorize
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
    if (!selected) return;
    const norm = (s: string) => s.toLowerCase().replace(/[-\s]/g, "");
    const isCorrect = norm(selected) === norm(position.answer);
    setCorrect(isCorrect);
    setPhase("result");
    if (isCorrect) {
      playSound("correct");
      earnCoins("study_task");
    } else {
      playSound("wrong");
    }
    setTimeout(() => onComplete(isCorrect), 2500);
  }, [selected, position.answer, onComplete]);

  // Square styles for result phase (location questions)
  const resultSquareStyles: Record<string, CSSProperties> = {};
  if (phase === "result" && position.questionType === "location") {
    resultSquareStyles[position.answer] = {
      backgroundColor: "rgba(34, 197, 94, 0.55)",
      boxShadow: "inset 0 0 0 3px rgba(34, 197, 94, 0.8)",
    };
    if (selected && selected !== position.answer) {
      resultSquareStyles[selected] = {
        backgroundColor: "rgba(239, 68, 68, 0.45)",
        boxShadow: "inset 0 0 0 3px rgba(239, 68, 68, 0.8)",
      };
    }
  }

  // Recall highlight for location (selected square)
  const recallSquareStyles: Record<string, CSSProperties> = selected
    ? {
        [selected]: {
          backgroundColor: "rgba(245, 158, 11, 0.5)",
          boxShadow: "inset 0 0 0 3px rgba(245, 158, 11, 0.9)",
        },
      }
    : {};

  return (
    <div className="w-full space-y-4">
      <p className="text-sm font-medium text-[#8d8696]">{position.label}</p>

      {/* ── MEMORIZE PHASE ──────────────────────────────────────────── */}
      {phase === "memorize" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#565061]">
            <span>Study the position carefully…</span>
            <span
              className={`font-bold tabular-nums ${timeLeft <= 2 ? "text-red-400" : "text-amber-400"}`}
            >
              {timeLeft}s
            </span>
          </div>
          <div ref={boardRef} className="w-full">
            <Chessboard
              id="memory-board"
              position={position.fen}
              boardWidth={boardSize}
              arePiecesDraggable={false}
              customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
              customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
              customPieces={customPieces}
            />
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#1e1a24]">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-1000"
              style={{ width: `${(timeLeft / viewSeconds) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── RECALL PHASE ────────────────────────────────────────────── */}
      {phase === "recall" && (
        <div className="space-y-4">
          <p className="text-base font-semibold text-white">{position.question}</p>

          {/* LOCATION — interactive empty board */}
          {position.questionType === "location" && (
            <div className="space-y-3">
              <p className="text-xs text-[#565061]">
                {selected
                  ? `Selected: ${selected.toUpperCase()} — click another square or confirm`
                  : "Click the square on the board below"}
              </p>
              <div ref={boardRef} className="w-full">
                <Chessboard
                  id="memory-recall-board"
                  position="8/8/8/8/8/8/8/8"
                  boardWidth={boardSize}
                  arePiecesDraggable={false}
                  onSquareClick={(sq) => setSelected(sq)}
                  customSquareStyles={recallSquareStyles}
                  customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                  customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                />
              </div>
              {selected && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
                >
                  Confirm: {selected.toUpperCase()}
                </button>
              )}
            </div>
          )}

          {/* PIECE — piece type selector */}
          {position.questionType === "piece" && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {PIECE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelected(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold transition-all ${
                      selected === opt.value
                        ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                        : "border-[#1e1a24] bg-[#ff5a1f]/[0.04] text-[#8d8696] hover:border-[#ff5a1f]/20 hover:text-white"
                    }`}
                  >
                    <span className="text-2xl leading-none">{opt.symbol}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              {selected && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
                >
                  Confirm: {selected}
                </button>
              )}
            </div>
          )}

          {/* CHOICE — multiple choice */}
          {position.questionType === "choice" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(position.choices ?? []).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setSelected(choice)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                      selected === choice
                        ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                        : "border-[#1e1a24] bg-[#ff5a1f]/[0.04] text-[#8d8696] hover:border-[#ff5a1f]/20 hover:text-white"
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
              {selected && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
                >
                  Confirm: {selected}
                </button>
              )}
            </div>
          )}

          {/* Hint */}
          {showHint ? (
            <p className="text-xs text-amber-400/80">💡 {position.hint}</p>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-xs text-[#565061] hover:text-[#8d8696] transition-colors"
            >
              Show hint
            </button>
          )}
        </div>
      )}

      {/* ── RESULT PHASE ────────────────────────────────────────────── */}
      {phase === "result" && (
        <div className="space-y-3">
          <p className="text-base font-semibold text-white">{position.question}</p>

          {/* Show full board with square highlights */}
          <div ref={boardRef} className="w-full">
            <Chessboard
              id="memory-result-board"
              position={position.fen}
              boardWidth={boardSize}
              arePiecesDraggable={false}
              customSquareStyles={resultSquareStyles}
              customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
              customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
              customPieces={customPieces}
            />
          </div>

          <div
            className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
              correct
                ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300"
                : "border-red-500/20 bg-red-500/[0.05] text-red-300"
            }`}
          >
            <span className="font-bold">
              {correct
                ? "✓ Correct!"
                : `✗ The answer is: ${position.answer.toUpperCase()}`}
            </span>
            {!correct && (
              <span className="ml-1 text-[#8d8696]"> — {position.hint}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
