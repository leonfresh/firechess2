"use client";

import { useState, useCallback, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";

/* ------------------------------------------------------------------ */
/*  Question bank                                                       */
/* ------------------------------------------------------------------ */

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
  category: "rules" | "tactics" | "endgame" | "openings" | "strategy";
};

export const QUIZ_BANK: QuizQuestion[] = [
  {
    question: "A fork attacks how many pieces at once?",
    options: ["One", "Two or more", "Exactly three", "All opponent's pieces"],
    answer: 1,
    explanation:
      "A fork is a move where a single piece attacks two or more opponent pieces simultaneously, forcing them to lose material.",
    category: "tactics",
  },
  {
    question: "Which piece can jump over other pieces?",
    options: ["Rook", "Bishop", "Queen", "Knight"],
    answer: 3,
    explanation:
      "The knight moves in an L-shape and is the only piece that can jump over pieces standing between it and its destination.",
    category: "rules",
  },
  {
    question: "What is the standard point value of a queen?",
    options: ["5", "8", "9", "10"],
    answer: 2,
    explanation:
      "The queen is worth approximately 9 points — roughly equal to two rooks (5+5=10, minus a small coordination penalty) or three minor pieces.",
    category: "rules",
  },
  {
    question:
      "In a pin, the attacked piece cannot move because it would expose what?",
    options: [
      "A fork",
      "The king or a more valuable piece",
      "A pawn structure weakness",
      "En passant rights",
    ],
    answer: 1,
    explanation:
      "A pin is when a piece cannot move without exposing a more valuable piece (often the king) behind it to attack.",
    category: "tactics",
  },
  {
    question: "Can a king castle if it would pass through check?",
    options: [
      "Yes, always",
      "Yes, but only kingside",
      "No",
      "Only in rapid chess",
    ],
    answer: 2,
    explanation:
      "Castling is illegal if the king starts on, passes through, or would land on a square that is under attack.",
    category: "rules",
  },
  {
    question: "What is a 'skewer'?",
    options: [
      "Attacking a pawn with a bishop",
      "Forcing a valuable piece to move, exposing a less valuable piece behind it",
      "Moving two rooks to the same file",
      "A king-side attack pattern",
    ],
    answer: 1,
    explanation:
      "A skewer is like a reversed pin — the valuable piece is in front and must move, leaving the piece behind it to be captured.",
    category: "tactics",
  },
  {
    question: "K+R vs K: can you force checkmate?",
    options: [
      "No, it's always a draw",
      "Yes, but only on the edge of the board",
      "Yes, anywhere on the board",
      "Only if you also have a pawn",
    ],
    answer: 1,
    explanation:
      "King and rook vs lone king is a basic forced checkmate — you use the rook to cut off the king and force it to a corner or edge.",
    category: "endgame",
  },
  {
    question: "What does 'en passant' mean in French?",
    options: [
      "In passing",
      "The middlegame",
      "Through the pawn",
      "Exchange sacrifice",
    ],
    answer: 0,
    explanation:
      'En passant ("in passing") is a special pawn capture where a pawn that has just moved two squares can be captured by an enemy pawn as if it had only moved one.',
    category: "rules",
  },
  {
    question: "Which of these openings starts 1.e4 e5 2.Nf3 Nc6 3.Bb5?",
    options: [
      "The Sicilian Defense",
      "The Ruy López",
      "The Italian Game",
      "The French Defense",
    ],
    answer: 1,
    explanation:
      "The Ruy López (also called the Spanish Opening) begins 1.e4 e5 2.Nf3 Nc6 3.Bb5, pinning the knight that defends the e5 pawn.",
    category: "openings",
  },
  {
    question:
      "In the endgame, which is generally more valuable—a bishop or a knight?",
    options: [
      "Knight, because it can reach any square",
      "Bishop, because it's faster across an open board",
      "They're always equal",
      "It depends—bishops prefer open positions, knights prefer closed ones",
    ],
    answer: 3,
    explanation:
      "Bishops are faster on open boards (controlling long diagonals), while knights excel in closed positions where they can use outposts and aren't blocked by pawns.",
    category: "endgame",
  },
  {
    question: "What is 'discovered check'?",
    options: [
      "Finding a check your opponent missed",
      "Moving a piece to reveal a check by a piece behind it",
      "A checkmate that was not announced",
      "When a computer finds a check you missed",
    ],
    answer: 1,
    explanation:
      "A discovered check occurs when moving one piece reveals an attack on the enemy king by another piece that was previously blocked.",
    category: "tactics",
  },
  {
    question:
      "Which of these is the correct 'opposition' concept in king endgames?",
    options: [
      "Always keep your king next to pawns",
      "Place your king so the enemy king must give way",
      "Always centralize your king immediately",
      "Keep your king behind your own pawns",
    ],
    answer: 1,
    explanation:
      "Opposition (direct or distant) means placing your king two squares from the enemy king so that when it's the opponent's turn to move, their king must step aside.",
    category: "endgame",
  },
  {
    question: "The 'rule of the square' in pawn endgames tells you what?",
    options: [
      "Whether your queen beats a passed pawn",
      "Whether a king can catch a passed pawn before it promotes",
      "How many squares a king can control",
      "When to exchange pawns",
    ],
    answer: 1,
    explanation:
      "Draw the diagonal from the pawn to the promotion square — if the opposing king can step inside that square on its move, it can catch the pawn.",
    category: "endgame",
  },
  {
    question: "What is the Sicilian Defense's first move for Black?",
    options: ["1...e5", "1...c5", "1...e6", "1...d5"],
    answer: 1,
    explanation:
      "After 1.e4, Black plays 1...c5 — the Sicilian Defense. It's the most popular response to 1.e4 at top level, fighting for the d4 square asymmetrically.",
    category: "openings",
  },
  {
    question: "A 'zwischenzug' is:",
    options: [
      "A German word for a chess clock",
      "Queening with a pawn",
      "An in-between move that changes the expected sequence",
      "A back-rank checkmate",
    ],
    answer: 2,
    explanation:
      'Zwischenzug ("in-between move") is when instead of the expected recapture or response, you insert a stronger move first — often a check, threat, or capture.',
    category: "tactics",
  },
  {
    question: "Can K+2B checkmate a lone king?",
    options: [
      "No, it's always a draw",
      "Yes, but both bishops must be on different colours",
      "Yes, only with bishops on the same colour",
      "Only if the king is in a corner",
    ],
    answer: 1,
    explanation:
      "Two bishops on opposite colours can force checkmate with precise play, typically driving the king to a corner. Two bishops on the same colour cannot cover all squares.",
    category: "endgame",
  },
  {
    question: "What is '5-fold repetition' in chess?",
    options: [
      "A player making the same move 5 times",
      "An automatic draw when the same position occurs 5 times",
      "Winning by repeating a tactic 5 times",
      "A castling rule exception",
    ],
    answer: 1,
    explanation:
      "Under FIDE rules a draw is claimed (or adjudicated automatically online) when the same position occurs 5 times with the same player to move.",
    category: "rules",
  },
  {
    question:
      "Which pawn structure feature involves a pawn with no friendly pawns on adjacent files?",
    options: ["Passed pawn", "Backward pawn", "Isolated pawn", "Doubled pawn"],
    answer: 2,
    explanation:
      "An isolated pawn has no friendly pawns on the files immediately to its left or right — it can't be defended by pawns and is often a long-term weakness.",
    category: "strategy",
  },
  {
    question: "In the opening, which principle is considered most important?",
    options: [
      "Push all your pawns quickly",
      "Develop pieces, control the center, castle",
      "Attack the king from move one",
      "Trade off all the pawns first",
    ],
    answer: 1,
    explanation:
      "The three core opening principles are: develop your pieces to active squares, fight for central control (d4/d5/e4/e5), and castle to put your king safe.",
    category: "openings",
  },
  {
    question: "What is stalemate?",
    options: [
      "Checkmate in the endgame",
      "When the side to move has no legal moves but is NOT in check — a draw",
      "When neither side can win — an automatic draw",
      "A draw by threefold repetition",
    ],
    answer: 1,
    explanation:
      "Stalemate occurs when the player to move has no legal moves and is NOT in check — it's an immediate draw, regardless of material imbalance.",
    category: "rules",
  },
];

/* Deterministic daily selection seeded by day */
export function getDailyQuizQuestions(
  count: number,
  seed: number,
): QuizQuestion[] {
  const all = [...QUIZ_BANK];
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

const CATEGORY_BADGE: Record<
  QuizQuestion["category"],
  { label: string; color: string }
> = {
  rules: {
    label: "Rules",
    color: "border-blue-500/20 bg-blue-500/[0.07] text-blue-400",
  },
  tactics: {
    label: "Tactics",
    color: "border-red-500/20 bg-red-500/[0.07] text-red-400",
  },
  endgame: {
    label: "Endgame",
    color: "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400",
  },
  openings: {
    label: "Openings",
    color: "border-sky-500/20 bg-sky-500/[0.07] text-sky-400",
  },
  strategy: {
    label: "Strategy",
    color: "border-violet-500/20 bg-violet-500/[0.07] text-violet-400",
  },
};

type Props = {
  question: QuizQuestion;
  onComplete: (correct: boolean) => void;
};

export function ChessQuiz({ question, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setSelected(null);
    setRevealed(false);
  }, [question]);

  const handleSelect = useCallback(
    (idx: number) => {
      if (revealed) return;
      setSelected(idx);
      setRevealed(true);
      const correct = idx === question.answer;
      if (correct) {
        playSound("correct");
        earnCoins("study_task");
      } else {
        playSound("wrong");
      }
      // Give time to read explanation before auto-advancing
      setTimeout(() => onComplete(correct), 2000);
    },
    [revealed, question, onComplete],
  );

  const badge = CATEGORY_BADGE[question.category];

  return (
    <div className="space-y-4">
      {/* Category badge */}
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.color}`}
      >
        {badge.label}
      </span>

      {/* Question */}
      <p className="text-base font-semibold leading-relaxed text-white sm:text-lg">
        {question.question}
      </p>

      {/* Options */}
      <div className="grid gap-2.5">
        {question.options.map((opt, idx) => {
          let style =
            "border border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white";
          if (revealed) {
            if (idx === question.answer) {
              style =
                "border border-emerald-500/40 bg-emerald-500/[0.12] text-emerald-300";
            } else if (idx === selected) {
              style = "border border-red-500/40 bg-red-500/[0.10] text-red-300";
            } else {
              style =
                "border border-white/[0.05] bg-white/[0.01] text-slate-600";
            }
          }
          return (
            <button
              key={idx}
              type="button"
              disabled={revealed}
              onClick={() => handleSelect(idx)}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${style}`}
            >
              <span className="mr-2 font-mono text-xs opacity-50">
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
            selected === question.answer
              ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300"
              : "border-red-500/20 bg-red-500/[0.05] text-red-300"
          }`}
        >
          <span className="mr-1.5 font-bold">
            {selected === question.answer ? "✓ Correct!" : "✗ Not quite."}
          </span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}
