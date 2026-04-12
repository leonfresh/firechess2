"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { playSound, preloadSounds } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import { useBoardSize } from "@/lib/use-board-size";

/* ─────────────────────────────────────────────────────────────── */
/*  Types                                                           */
/* ─────────────────────────────────────────────────────────────── */

type RatingBand = "800" | "1200" | "1600" | "2000";

type TextSlide = {
  kind: "text";
  heading: string;
  body: string;
  fen?: string;
  orientation?: "white" | "black";
  highlights?: string[];
  arrows?: [string, string][];
};

type InteractSlide = {
  kind: "interact";
  heading: string;
  instruction: string;
  fen: string;
  orientation?: "white" | "black";
  correctMoves: string[]; // UCI strings that are CORRECT
  wrongMoves?: string[]; // UCI strings that should be flagged as wrong
  correctExplanation: string;
  wrongExplanation: string;
};

type ChoiceSlide = {
  kind: "choice";
  heading: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

type Slide = TextSlide | InteractSlide | ChoiceSlide;

type Lesson = {
  id: string;
  band: RatingBand;
  title: string;
  subtitle: string;
  icon: string;
  estimatedMinutes: number;
  tags: string[];
  slides: Slide[];
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson: The Initiative                                          */
/* ─────────────────────────────────────────────────────────────── */

const INITIATIVE_LESSON: Lesson = {
  id: "initiative-2000",
  band: "2000",
  title: "The Initiative",
  subtitle: "When NOT to take free pawns — and when to sacrifice material",
  icon: "⚡",
  estimatedMinutes: 12,
  tags: ["middlegame", "strategy", "initiative", "sacrifice"],
  slides: [
    {
      kind: "text",
      heading: "The pawn is free. Should you take it?",
      body: "White has just pushed e4 and Black's pawn on c5 looks undefended. You can take it right now for free. Your hand is already moving... but is this the right decision? In this lesson we will show you why capturing a free pawn can be one of the most dangerous moves on the board.",
      fen: "r1bqk2r/pp1p1ppp/2n1pn2/2p5/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6",
      orientation: "white",
      highlights: ["c5", "d4"],
    },
    {
      kind: "text",
      heading: "What the initiative actually means",
      body: "The initiative belongs to the side that is making threats and forcing the opponent to react. Each tempo you spend responding to your opponent is a tempo you cannot use to attack. The player with the initiative is dictating the game; the other player is just trying to survive. Material is meaningless if you run out of time to use it.",
    },
    {
      kind: "text",
      heading: "The cost of taking",
      body: "After 1.e4 e5 2.Nf3 Nc6 3.Bc4, White's bishop stares down the f7 pawn. If Black grabs the pawn on b2, White gets a massive lead in development. Every move Black spends with the queen manoeuvring to capture and escape is a move White spends bringing pieces toward the uncastled Black king. The material gain comes with a time debt.",
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      orientation: "white",
      highlights: ["c4", "f7"],
      arrows: [["c4", "f7"]],
    },
    {
      kind: "interact",
      heading: "Should White take the pawn?",
      instruction:
        "Black just played ...d5. There is a pawn on c5 available. Find the move that maintains the initiative rather than grabbing material.",
      fen: "r1bqkb1r/pp3ppp/2n1pn2/2pp4/3P4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6",
      orientation: "white",
      correctMoves: ["e2e4", "c1g5", "f1b5"],
      wrongMoves: ["d4c5"],
      correctExplanation:
        "Exactly. Developing with tempo keeps the pressure on. Grabbing c5 would let Black equalise immediately with active play.",
      wrongExplanation:
        "Taking on c5 gives Black freedom. After ...e6 and ...Bxc5, Black recaptures with tempo and is fully equal.",
    },
    {
      kind: "text",
      heading: "Give material to seize the initiative",
      body: "The initiative can also be bought with material. In the King's Gambit, White sacrifices a pawn immediately — 1.e4 e5 2.f4. Why? Because after 2...exf4, White has given up a pawn but gets a free hand in the centre. Every piece White develops will come with a threat; Black will be perpetually on the back foot.",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq - 0 2",
      orientation: "white",
    },
    {
      kind: "interact",
      heading: "Sacrifice the Exchange to seize the attack",
      instruction:
        "White can sacrifice the bishop on h7, smashing open the king. Find the move that rips open the Black king position.",
      fen: "r1bqk2r/pp2nppp/2p1p3/3pP3/1b1P4/2NB1N2/PP3PPP/R1BQK2R w KQkq - 0 9",
      orientation: "white",
      correctMoves: ["d3h7"],
      correctExplanation:
        "Bxh7+! forces Kxh7 and White's attack is devastating — Black's king is dragged into the open and cannot castle.",
      wrongExplanation:
        "There is a forcing sacrifice that wins by force here. Look at the h7 square.",
    },
    {
      kind: "choice",
      heading: "The critical decision",
      question:
        "Before taking a free pawn in the opening, what is the most important question to ask?",
      choices: [
        "Is the pawn defended?",
        "How many pawns will I be up?",
        "What forcing threats does my opponent get after I take?",
        "Can my queen escape quickly?",
      ],
      correctIndex: 2,
      explanation:
        "The right question is always: what does my opponent get? Usually the answer is 'a tempo, an open file, and a lead in development' — all worth more than one pawn in the opening.",
    },
    {
      kind: "text",
      heading: "The Poisoned Pawn",
      body: "The most famous pawn-grab trap is the Poisoned Pawn in the Sicilian Najdorf. Black can take the b2 pawn with 6...Qxb2, winning a pawn. But White gets the bishop pair, an open b-file, and piece activity that is devastating. Grandmasters have studied this for 60 years and it remains controversial — even at the elite level the initiative is that dangerous.",
      fen: "rn1qkb1r/pp3ppp/2pppn2/6B1/3NPP2/2N5/PPP3PP/R2QKB1R b KQkq - 0 7",
      orientation: "black",
      highlights: ["b2", "d8"],
      arrows: [["d8", "b2"]],
    },
    {
      kind: "interact",
      heading: "Resist the temptation",
      instruction:
        "Black can take on b2 but should not. Find a developing move instead that keeps Black safe.",
      fen: "rn1qkb1r/pp3ppp/2pppn2/6B1/3NPP2/2N5/PPP3PP/R2QKB1R b KQkq - 0 7",
      orientation: "black",
      correctMoves: ["f8e7", "h7h6", "d8b6"],
      wrongMoves: ["d8b2"],
      correctExplanation:
        "Good. Developing and preparing to castle keeps Black solid. Grabbing b2 leads to a vicious attack that most players cannot survive.",
      wrongExplanation:
        "Qxb2 is the Poisoned Pawn — White gets tremendous compensation with open lines toward the Black king. This pawn costs Black the game.",
    },
    {
      kind: "text",
      heading: "When SHOULD you take the material?",
      body: "Taking material is correct when: (1) you keep the initiative afterward, (2) you can consolidate before being mated, or (3) you are already clearly winning and simplification helps. Also: in the endgame, extra material almost always wins. The 'do not take free pawns' rule is primarily a middlegame, opening-phase concept.",
    },
    {
      kind: "interact",
      heading: "Now it IS correct to take",
      instruction:
        "The position is stable, both kings are safe, and there is a free pawn. White should simply take it.",
      fen: "2rq1rk1/pp2bppp/2n1pn2/3p4/3P4/2N2NB1/PP2BPPP/2RQ1RK1 w - - 0 13",
      orientation: "white",
      correctMoves: ["d4d5", "c3d5", "f3d4"],
      correctExplanation:
        "Yes. Both sides are developed and castled. Taking the pawn here wins material with no compensation for Black — the initiative belongs to whoever has more material now.",
      wrongExplanation:
        "Look again — the position is quiet with both kings safe. A free pawn is simply a free pawn here.",
    },
    {
      kind: "choice",
      heading: "The fundamental question",
      question:
        "When deciding whether to take a free pawn in the middlegame, the key question is:",
      choices: [
        "Is it defended by a pawn or just a piece?",
        "Can I defend the pawn once I take it?",
        "Who has the initiative in the position after I take?",
        "How much material will I be up total?",
      ],
      correctIndex: 2,
      explanation:
        "Material is meaningless without the time to use it. Asking 'who has the initiative after the capture' tells you whether the pawn is truly free or comes with a hidden bill.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "Steinitz said 'The right move requires the right moment.' Material advantage is only useful if you survive to convert it.\n\n✓ In the opening and early middlegame, the initiative > one pawn\n✓ Ask what forcing threats your opponent gets before capturing\n✓ Sacrificing material to gain the initiative is often winning\n✓ In the stable middlegame and endgame, extra material decides",
    },
  ],
};

const LESSONS: Lesson[] = [INITIATIVE_LESSON];

/* ─────────────────────────────────────────────────────────────── */
/*  ELO band metadata                                               */
/* ─────────────────────────────────────────────────────────────── */

const BAND_LABELS: Record<RatingBand, string> = {
  "800": "800 – 1200",
  "1200": "1200 – 1600",
  "1600": "1600 – 2000",
  "2000": "2000+",
};

const BAND_DESCRIPTIONS: Record<RatingBand, string> = {
  "800": "Fundamentals — basic tactics and piece safety",
  "1200": "Patterns — pawn structure and coordination",
  "1600": "Strategy — planning and complex positions",
  "2000": "Mastery — initiative, dynamics, and compensation",
};

const BAND_COLORS: Record<
  RatingBand,
  { bg: string; text: string; ring: string; pill: string }
> = {
  "800": {
    bg: "bg-emerald-500/[0.08]",
    text: "text-emerald-300",
    ring: "ring-emerald-500/30",
    pill: "bg-emerald-500/20 text-emerald-300",
  },
  "1200": {
    bg: "bg-sky-500/[0.08]",
    text: "text-sky-300",
    ring: "ring-sky-500/30",
    pill: "bg-sky-500/20 text-sky-300",
  },
  "1600": {
    bg: "bg-amber-500/[0.08]",
    text: "text-amber-300",
    ring: "ring-amber-500/30",
    pill: "bg-amber-500/20 text-amber-300",
  },
  "2000": {
    bg: "bg-purple-500/[0.08]",
    text: "text-purple-300",
    ring: "ring-purple-500/30",
    pill: "bg-purple-500/20 text-purple-300",
  },
};

/* ─────────────────────────────────────────────────────────────── */
/*  LessonProgress                                                  */
/* ─────────────────────────────────────────────────────────────── */

function LessonProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < current
              ? "bg-purple-500"
              : i === current
                ? "bg-purple-400/70"
                : "bg-white/[0.08]"
          }`}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  LessonBoard                                                     */
/* ─────────────────────────────────────────────────────────────── */

function LessonBoard({
  fen,
  orientation = "white",
  highlights = [],
  arrows = [],
  onDrop,
  onSquareClick,
  draggable = false,
  customSquareStyles = {},
}: {
  fen: string;
  orientation?: "white" | "black";
  highlights?: string[];
  arrows?: [string, string][];
  onDrop?: (from: string, to: string) => boolean;
  onSquareClick?: (sq: string) => void;
  draggable?: boolean;
  customSquareStyles?: Record<string, React.CSSProperties>;
}) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const { ref, size } = useBoardSize(480);

  const hlStyles: Record<string, React.CSSProperties> = {};
  for (const sq of highlights) {
    hlStyles[sq] = { backgroundColor: "rgba(251,191,36,0.38)" };
  }

  const cbArrows = arrows.map(
    ([f, t]) => [f, t, "rgba(139,92,246,0.7)"] as [string, string, string],
  );

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl ring-1 ring-white/[0.08]"
    >
      <Chessboard
        position={fen}
        boardOrientation={orientation}
        boardWidth={size}
        arePiecesDraggable={draggable}
        onPieceDrop={onDrop}
        onSquareClick={onSquareClick}
        customArrows={cbArrows}
        customSquareStyles={{ ...hlStyles, ...customSquareStyles }}
        customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
        customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
        customPieces={customPieces}
        animationDuration={200}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  TextSlideView                                                   */
/* ─────────────────────────────────────────────────────────────── */

function TextSlideView({
  slide,
  onNext,
}: {
  slide: TextSlide;
  onNext: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white leading-snug">
          {slide.heading}
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-300 whitespace-pre-line">
          {slide.body}
        </p>
      </div>

      {slide.fen && (
        <LessonBoard
          fen={slide.fen}
          orientation={slide.orientation}
          highlights={slide.highlights}
          arrows={slide.arrows}
          draggable={false}
        />
      )}

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
      >
        Continue →
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  InteractSlideView                                               */
/* ─────────────────────────────────────────────────────────────── */

function InteractSlideView({
  slide,
  onNext,
}: {
  slide: InteractSlide;
  onNext: () => void;
}) {
  const [state, setState] = useState<"idle" | "correct" | "wrong">("idle");
  const [attempts, setAttempts] = useState(0);
  const [fen, setFen] = useState(slide.fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [legalSqs, setLegalSqs] = useState<string[]>([]);
  const orientation = slide.orientation ?? "white";

  useEffect(() => {
    preloadSounds();
  }, []);

  const tryMove = useCallback(
    (from: string, to: string): boolean => {
      if (state !== "idle") return false;
      const chess = new Chess(slide.fen);
      let move;
      try {
        move = chess.move({ from, to, promotion: "q" });
      } catch {
        return false;
      }
      if (!move) return false;

      const uci = from + to;
      const isCorrect = slide.correctMoves.some(
        (m) =>
          m === uci ||
          m === uci + "q" ||
          (m.startsWith(from) && m.slice(2, 4) === to),
      );
      const isExplicitlyWrong = (slide.wrongMoves ?? []).some(
        (m) => m === uci || m === uci + "q",
      );

      if (isCorrect) {
        setFen(chess.fen());
        setState("correct");
        playSound("correct");
      } else {
        playSound("wrong");
        const a = attempts + 1;
        setAttempts(a);
        setState("wrong");
        setSelected(null);
        setLegalSqs([]);
        setTimeout(() => {
          setFen(slide.fen);
          setState("idle");
        }, 1200);
      }
      return true;
    },
    [state, slide.fen, slide.correctMoves, slide.wrongMoves, attempts],
  );

  const handleDrop = useCallback(
    (from: string, to: string): boolean => {
      const ok = tryMove(from, to);
      setSelected(null);
      setLegalSqs([]);
      return ok;
    },
    [tryMove],
  );

  const handleSquareClick = useCallback(
    (sq: string) => {
      if (state !== "idle") return;
      if (!selected) {
        const chess = new Chess(fen);
        const piece = chess.get(sq as Parameters<typeof chess.get>[0]);
        if (piece && piece.color === chess.turn()) {
          setSelected(sq);
          const moves = chess.moves({ square: sq as any, verbose: true });
          setLegalSqs(moves.map((m) => m.to));
        }
      } else {
        if (sq === selected) {
          setSelected(null);
          setLegalSqs([]);
          return;
        }
        const moved = tryMove(selected, sq);
        if (!moved) {
          const chess = new Chess(fen);
          const piece = chess.get(sq as Parameters<typeof chess.get>[0]);
          if (piece && piece.color === chess.turn()) {
            setSelected(sq);
            const moves = chess.moves({ square: sq as any, verbose: true });
            setLegalSqs(moves.map((m) => m.to));
            return;
          }
        }
        setSelected(null);
        setLegalSqs([]);
      }
    },
    [state, fen, selected, tryMove],
  );

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (selected)
    squareStyles[selected] = { backgroundColor: "rgba(255,210,0,0.45)" };
  if (selected && state === "idle") {
    const chess = new Chess(fen);
    for (const sq of legalSqs) {
      const hasPiece = chess.get(sq as any);
      squareStyles[sq] = hasPiece
        ? {
            background:
              "radial-gradient(circle, transparent 55%, rgba(0,0,0,0.28) 55%)",
            borderRadius: "50%",
          }
        : {
            background:
              "radial-gradient(circle, rgba(0,0,0,0.28) 26%, transparent 26%)",
            borderRadius: "50%",
          };
    }
  }
  if (attempts >= 2 && state === "idle") {
    const hintFrom = slide.correctMoves[0]?.slice(0, 2);
    if (hintFrom)
      squareStyles[hintFrom] = { backgroundColor: "rgba(251,191,36,0.45)" };
  }

  const toMove = slide.fen.split(" ")[1] === "b" ? "Black" : "White";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          {slide.heading}
        </h2>
        <p className="mt-2 text-sm text-slate-400">{slide.instruction}</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
          {toMove} to move
        </p>
      </div>

      <LessonBoard
        fen={fen}
        orientation={orientation}
        onDrop={handleDrop}
        onSquareClick={handleSquareClick}
        draggable={state === "idle"}
        customSquareStyles={squareStyles}
      />

      {/* Feedback area */}
      <div
        className={`rounded-2xl border px-5 py-4 transition-all duration-300 ${
          state === "correct"
            ? "border-emerald-500/30 bg-emerald-500/[0.06]"
            : state === "wrong"
              ? "border-red-500/30 bg-red-500/[0.06]"
              : attempts >= 2
                ? "border-amber-500/30 bg-amber-500/[0.06]"
                : "border-white/[0.06] bg-white/[0.02]"
        }`}
      >
        <p
          className={`text-sm font-semibold ${
            state === "correct"
              ? "text-emerald-300"
              : state === "wrong"
                ? "text-red-300"
                : attempts >= 2
                  ? "text-amber-300"
                  : "text-slate-500"
          }`}
        >
          {state === "correct"
            ? `✓ ${slide.correctExplanation}`
            : state === "wrong"
              ? `✗ ${slide.wrongExplanation}`
              : attempts >= 2
                ? "💡 Hint: look at the highlighted piece"
                : "Drag a piece or click to select"}
        </p>
      </div>

      {state === "correct" && (
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Continue →
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  ChoiceSlideView                                                 */
/* ─────────────────────────────────────────────────────────────── */

function ChoiceSlideView({
  slide,
  onNext,
}: {
  slide: ChoiceSlide;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          {slide.heading}
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-200">
          {slide.question}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {slide.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = i === slide.correctIndex;
          let cls =
            "rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition-all duration-200 ";
          if (!answered) {
            cls +=
              "border-white/[0.08] bg-white/[0.03] text-slate-200 hover:border-purple-500/40 hover:bg-purple-500/[0.06] cursor-pointer";
          } else if (isCorrect) {
            cls +=
              "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-200 cursor-default";
          } else if (isSelected && !isCorrect) {
            cls +=
              "border-red-500/40 bg-red-500/[0.08] text-red-300 cursor-default";
          } else {
            cls +=
              "border-white/[0.04] bg-white/[0.01] text-slate-600 cursor-default";
          }

          return (
            <button
              key={i}
              type="button"
              className={cls}
              onClick={() => {
                if (!answered) setSelected(i);
              }}
              disabled={answered}
            >
              <span className="mr-2 font-black text-slate-600">
                {answered
                  ? isCorrect
                    ? "✓"
                    : isSelected
                      ? "✗"
                      : String.fromCharCode(65 + i)
                  : String.fromCharCode(65 + i)}
                .
              </span>
              {choice}
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] px-5 py-4">
            <p className="text-sm leading-relaxed text-purple-200/80">
              {slide.explanation}
            </p>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Continue →
          </button>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  LessonRunner                                                    */
/* ─────────────────────────────────────────────────────────────── */

function LessonRunner({
  lesson,
  onBack,
  onComplete,
}: {
  lesson: Lesson;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const slide = lesson.slides[idx];
  const total = lesson.slides.length;

  const handleNext = useCallback(() => {
    if (idx + 1 >= total) {
      setDone(true);
      earnCoins("study_task");
      playSound("correct");
    } else {
      setIdx((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [idx, total]);

  if (done) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-6xl shadow-2xl shadow-amber-500/30">
          🏆
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            Lesson Complete!
          </h2>
          <p className="mt-2 text-sm text-slate-400">{lesson.title}</p>
        </div>
        <div className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-4">
          <p className="text-sm font-black text-emerald-400">
            +10 coins earned
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-300/50">
            Keep practicing daily
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <button
            type="button"
            onClick={onComplete}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-4 text-sm font-bold text-white hover:brightness-110"
          >
            Back to Lessons →
          </button>
          <Link
            href="/train"
            className="block w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] py-3.5 text-sm font-semibold text-slate-400 hover:bg-white/[0.05] transition-colors text-center"
          >
            Training Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back
        </button>
        <div className="flex-1">
          <LessonProgress current={idx} total={total} />
        </div>
        <span className="text-[11px] text-slate-600">
          {idx + 1} / {total}
        </span>
      </div>

      {/* Slide */}
      {slide?.kind === "text" && (
        <TextSlideView slide={slide} onNext={handleNext} />
      )}
      {slide?.kind === "interact" && (
        <InteractSlideView key={idx} slide={slide} onNext={handleNext} />
      )}
      {slide?.kind === "choice" && (
        <ChoiceSlideView key={idx} slide={slide} onNext={handleNext} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  LessonCatalog                                                   */
/* ─────────────────────────────────────────────────────────────── */

function LessonCatalog({ onSelect }: { onSelect: (lesson: Lesson) => void }) {
  const bands: RatingBand[] = ["800", "1200", "1600", "2000"];

  return (
    <div className="mx-auto max-w-lg space-y-10">
      <div className="pt-2 text-center">
        <p className="text-[11px] font-black uppercase tracking-widest text-purple-400">
          ✦ Learn Chess
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-white">
          Lessons
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Structured lessons on the topics that matter most at your level.
        </p>
      </div>

      {bands.map((band) => {
        const bandLessons = LESSONS.filter((l) => l.band === band);
        const colors = BAND_COLORS[band];
        return (
          <div key={band} className="space-y-3">
            <div
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 ring-1 ${colors.bg} ${colors.ring}`}
            >
              <div>
                <p
                  className={`text-xs font-black uppercase tracking-widest ${colors.text}`}
                >
                  {BAND_LABELS[band]}
                </p>
                <p className="text-[11px] text-slate-500">
                  {BAND_DESCRIPTIONS[band]}
                </p>
              </div>
            </div>
            {bandLessons.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] px-5 py-4 text-center">
                <p className="text-[12px] text-slate-700">
                  More lessons coming soon
                </p>
              </div>
            ) : (
              bandLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onSelect(lesson)}
                  className={`group w-full flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all hover:brightness-110 active:scale-[0.99] ring-1 ${colors.bg} ${colors.ring}`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-2xl">
                    {lesson.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white">{lesson.title}</p>
                    <p className="mt-0.5 text-[12px] text-slate-500 line-clamp-1">
                      {lesson.subtitle}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors.pill}`}
                      >
                        {lesson.estimatedMinutes} min
                      </span>
                      {lesson.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))
            )}
          </div>
        );
      })}

      <p className="text-center text-[11px] text-slate-700">
        🧪 Early preview ·{" "}
        <a
          href="https://discord.gg/YS8fc4FtEk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 hover:text-slate-400 underline"
        >
          give feedback in Discord
        </a>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Page                                                            */
/* ─────────────────────────────────────────────────────────────── */

export default function LearnPage() {
  const [phase, setPhase] = useState<"catalog" | "lesson">("catalog");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const handleSelect = useCallback((lesson: Lesson) => {
    setActiveLesson(lesson);
    setPhase("lesson");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBack = useCallback(() => {
    setPhase("catalog");
    setActiveLesson(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.05] bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur sm:px-6">
        {phase === "catalog" ? (
          <Link
            href="/train"
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Training Hub
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Lessons
          </button>
        )}
        {activeLesson && phase === "lesson" && (
          <p className="text-xs font-semibold text-slate-500 truncate max-w-[60%]">
            {activeLesson.title}
          </p>
        )}
        <div className="w-24" />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {phase === "catalog" && <LessonCatalog onSelect={handleSelect} />}
        {phase === "lesson" && activeLesson && (
          <LessonRunner
            lesson={activeLesson}
            onBack={handleBack}
            onComplete={handleBack}
          />
        )}
      </div>
    </div>
  );
}
