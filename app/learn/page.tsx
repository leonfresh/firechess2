"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  // Hardcoded position mode
  fen?: string;
  orientation?: "white" | "black";
  correctMoves?: string[];
  wrongMoves?: string[];
  // Live Lichess puzzle mode (fetchTheme overrides fen/correctMoves)
  fetchTheme?: string;
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
  subtitle: "When greed loses time, and when practical play takes over",
  icon: "⚡",
  estimatedMinutes: 9,
  tags: ["middlegame", "strategy", "initiative", "sacrifice"],
  slides: [
    {
      kind: "text",
      heading: "A pawn won, but the initiative lost",
      body: "After 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4?! 4.Nxe5? Qg5, White is technically a pawn up. Practically, White is the side in danger. The queen hits g2, the knight on e5 is loose, and Black is the one asking the questions. That is the initiative: not material, but the right to make threats.",
      // Blackburne Shilling Gambit: 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4?! 4.Nxe5? Qg5
      fen: "r1b1kbnr/pppp1ppp/8/4N1q1/2BnP3/8/PPPP1PPP/RNBQK2R w KQkq - 1 5",
      orientation: "white",
      highlights: ["e5", "g5", "g2"],
      arrows: [
        ["g5", "g2"],
        ["g5", "e5"],
      ],
    },
    {
      kind: "text",
      heading: "What the initiative actually means",
      body: "The initiative belongs to the side that is making threats and forcing the opponent to react. Every tempo spent answering a threat is a tempo not spent improving your own position. That is why a single pawn can be worthless if the other side gets open lines, quick development, or a vulnerable king to attack. Initiative is time converted into pressure.",
    },
    {
      kind: "interact",
      heading: "Find White's forcing reply",
      instruction:
        "White cannot spend a move defending everything. Find a forcing move that keeps Black's king exposed instead.",
      // Blackburne Shilling Gambit: 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4?! 4.Nxe5? Qg5
      fen: "r1b1kbnr/pppp1ppp/8/4N1q1/2BnP3/8/PPPP1PPP/RNBQK2R w KQkq - 1 5",
      orientation: "white",
      correctMoves: ["c4f7", "e5f7"],
      correctExplanation:
        "Correct. White survives by creating threats of White's own. In dynamic positions, forcing moves matter more than clinging to the extra pawn.",
      wrongExplanation:
        "Passive defence is too slow here. Once you have handed over the initiative, you must ask questions back immediately.",
    },
    {
      kind: "text",
      heading: "Sometimes you buy the initiative on purpose",
      body: "The same logic works in reverse. In the King's Gambit, White offers the f-pawn immediately with 1.e4 e5 2.f4. White is not trying to be clever with material; White is buying open lines, central control, and rapid development. A pawn is being exchanged for time.",
      // King's Gambit after 1.e4 e5 2.f4
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq - 0 2",
      orientation: "white",
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
      body: "The classic example is the Sicilian Najdorf Poisoned Pawn. After 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bg5 e6 7.f4, Black is tempted by ...Qb6 and ...Qxb2. The pawn can be taken, but the queen loses time and White's attack arrives first. The material is real; the danger is even more real.",
      // Najdorf tabiya: 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bg5 e6 7.f4
      fen: "rnbqkb1r/1p3ppp/p2ppn2/6B1/3NPP2/2N5/PPP3PP/R2QKB1R b KQkq - 0 7",
      orientation: "black",
      highlights: ["b2", "d8"],
      arrows: [["d8", "b6"]],
    },
    {
      kind: "interact",
      heading: "Play the sober move",
      instruction:
        "Black is tempted by the queen raid ...Qb6 and ...Qxb2. Find the move that develops normally and keeps the king safe.",
      // Najdorf tabiya: 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bg5 e6 7.f4
      fen: "rnbqkb1r/1p3ppp/p2ppn2/6B1/3NPP2/2N5/PPP3PP/R2QKB1R b KQkq - 0 7",
      orientation: "black",
      correctMoves: ["f8e7"],
      wrongMoves: ["d8b6"],
      correctExplanation:
        "Exactly. ...Be7 is normal chess: finish development, castle, and only then talk about pawns. The queen raid creates a time debt Black may never repay.",
      wrongExplanation:
        "The pawn is poisoned because the queen loses time and White's attack arrives first. In dynamic positions, loose material is often bait.",
    },
    {
      kind: "text",
      heading: "When the attack has burned out",
      body: "Now compare a quieter position. The queens are off. Both kings are safe. Black has just played ...h5, trying to look active on the kingside, but there is no mating attack here. Once the heavy pieces disappear, initiative matters less and static gains matter more.",
      // Queen's Pawn structure: 1.d4 d5 2.Nf3 Nf6 3.e3 e6 4.Bd3 c5 5.O-O Nc6 6.c3 Bd6 7.Nbd2 O-O 8.dxc5 Bxc5 9.e4 dxe4 10.Nxe4 Nxe4 11.Bxe4 Qxd1 12.Rxd1 h5
      fen: "r1b2rk1/pp3pp1/2n1p3/2b4p/4B3/2P2N2/PP3PPP/R1BR2K1 w - - 0 13",
      orientation: "white",
      highlights: ["c6", "c5", "h5"],
      arrows: [["e4", "c6"]],
    },
    {
      kind: "interact",
      heading: "Play the practical move",
      instruction:
        "With queens off and no direct attack left, improve White's position immediately. Find the practical move.",
      // Queen's Pawn structure after ...h5 from the line above
      fen: "r1b2rk1/pp3pp1/2n1p3/2b4p/4B3/2P2N2/PP3PPP/R1BR2K1 w - - 0 13",
      orientation: "white",
      correctMoves: ["e4c6"],
      correctExplanation:
        "Bxc6. With no direct attack left, White should cash in immediately: eliminate the knight and leave Black with damaged queenside pawns.",
      wrongExplanation:
        "This is not the moment for a ghost attack. When the queens are gone and the king is safe, clean structural gains matter more than flashy ideas.",
    },
    {
      kind: "choice",
      heading: "How do you know the initiative is fading?",
      question:
        "Which detail most clearly tells you the position is no longer about a direct attack?",
      choices: [
        "There is still a pawn you could win",
        "The queens are off and the king is no longer exposed",
        "One side has the bishop pair",
        "A rook is sitting on an open file",
      ],
      correctIndex: 1,
      explanation:
        "Initiative is made of forcing threats. Once the queens are off and the king is safe, those threats shrink, so structural and material gains become the main story.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "Steinitz said 'The right move requires the right moment.' That is the whole lesson.\n\n✓ A pawn is not free if taking it hands your opponent the initiative\n✓ If you fall behind in time, answer with forcing moves, not passive defence\n✓ Sacrificing material is justified when it buys open lines, tempi, or king exposure\n✓ Once the queens come off and the king is safe, stop hunting ghosts and take the practical gain",
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
/*  LiveInteractSlide — fetches a real Lichess puzzle              */
/* ─────────────────────────────────────────────────────────────── */

function LiveInteractSlide({
  slide,
  onNext,
}: {
  slide: InteractSlide;
  onNext: () => void;
}) {
  const [loadState, setLoadState] = useState<"fetching" | "error" | "ready">(
    "fetching",
  );
  const [fen, setFen] = useState("");
  const [triggerPlayed, setTriggerPlayed] = useState(false);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [moveIdx, setMoveIdx] = useState(0);
  const [solveState, setSolveState] = useState<"playing" | "correct">(
    "playing",
  );
  const [attempts, setAttempts] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [legalSqs, setLegalSqs] = useState<string[]>([]);
  const [hintSq, setHintSq] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const fetched = useRef(false);
  const gameRef = useRef(new Chess());
  const preFenRef = useRef("");
  const triggerRef = useRef<{ from: string; to: string } | null>(null);

  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    if (fetched.current || !slide.fetchTheme) return;
    fetched.current = true;
    fetch(`/api/puzzles?themes=${slide.fetchTheme}&count=1`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.puzzles?.[0];
        if (!p) {
          setLoadState("error");
          return;
        }
        const pgn: string = p.game?.pgn ?? "";
        const initialPly: number = p.puzzle?.initialPly ?? 0;
        const solution: string[] = p.puzzle?.solution ?? [];
        if (!pgn || solution.length === 0) {
          setLoadState("error");
          return;
        }
        const full = new Chess();
        full.loadPgn(pgn);
        const history = full.history({ verbose: true });
        const board = new Chess();
        for (let i = 0; i < Math.min(initialPly, history.length); i++) {
          board.move(history[i].san);
        }
        preFenRef.current = board.fen();
        let tFrom: string | null = null,
          tTo: string | null = null;
        if (initialPly < history.length) {
          const m = history[initialPly];
          tFrom = m.from;
          tTo = m.to;
          board.move(m.san);
        }
        gameRef.current = new Chess(board.fen());
        if (tFrom && tTo) triggerRef.current = { from: tFrom, to: tTo };
        setFen(preFenRef.current);
        setSolutionMoves(solution);
        setOrientation(board.turn() === "w" ? "white" : "black");
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, [slide.fetchTheme]);

  // Animate the opponent's trigger move before handing control to the player
  useEffect(() => {
    if (loadState !== "ready" || triggerPlayed) return;
    const t = setTimeout(() => {
      setFen(gameRef.current.fen());
      if (triggerRef.current) setLastMove(triggerRef.current);
      playSound("move");
      setTriggerPlayed(true);
    }, 700);
    return () => clearTimeout(t);
  }, [loadState, triggerPlayed]);

  const uciParts = (uci: string) => ({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: (uci[4] || "q") as "q" | "r" | "b" | "n",
  });

  const handleDrop = useCallback(
    (from: string, to: string): boolean => {
      if (
        !triggerPlayed ||
        solveState !== "playing" ||
        moveIdx >= solutionMoves.length
      )
        return false;
      const exp = uciParts(solutionMoves[moveIdx]);
      if (from !== exp.from || to !== exp.to) {
        playSound("wrong");
        const a = attempts + 1;
        setAttempts(a);
        if (a >= 2) setHintSq(exp.from);
        return false;
      }
      const newGame = new Chess(gameRef.current.fen());
      try {
        newGame.move({ from, to, promotion: exp.promotion });
      } catch {
        return false;
      }
      playSound(newGame.isCheck() ? "check" : "correct");
      gameRef.current = new Chess(newGame.fen());
      setFen(newGame.fen());
      setLastMove({ from, to });
      setHintSq(null);
      setSelected(null);
      setLegalSqs([]);
      const nextIdx = moveIdx + 1;
      if (nextIdx >= solutionMoves.length) {
        setSolveState("correct");
        setTimeout(onNext, 1400);
        return true;
      }
      // Play the opponent's response automatically
      const opp = uciParts(solutionMoves[nextIdx]);
      setTimeout(() => {
        const g2 = new Chess(gameRef.current.fen());
        try {
          g2.move({ from: opp.from, to: opp.to, promotion: opp.promotion });
        } catch {
          /* ignore */
        }
        playSound(g2.isCheck() ? "check" : "move");
        gameRef.current = new Chess(g2.fen());
        setFen(g2.fen());
        setLastMove({ from: opp.from, to: opp.to });
        setMoveIdx(nextIdx + 1);
      }, 600);
      setMoveIdx(nextIdx);
      return true;
    },
    [triggerPlayed, solveState, moveIdx, solutionMoves, attempts, onNext],
  );

  const handleSquareClick = useCallback(
    (sq: string) => {
      if (!triggerPlayed || solveState !== "playing") return;
      if (!selected) {
        const piece = gameRef.current.get(sq as any);
        if (piece && piece.color === gameRef.current.turn()) {
          setSelected(sq);
          setLegalSqs(
            gameRef.current
              .moves({ square: sq as any, verbose: true })
              .map((m) => m.to),
          );
        }
      } else {
        if (sq === selected) {
          setSelected(null);
          setLegalSqs([]);
          return;
        }
        const moved = handleDrop(selected, sq);
        if (!moved) {
          const piece = gameRef.current.get(sq as any);
          if (piece && piece.color === gameRef.current.turn()) {
            setSelected(sq);
            setLegalSqs(
              gameRef.current
                .moves({ square: sq as any, verbose: true })
                .map((m) => m.to),
            );
            return;
          }
        }
        setSelected(null);
        setLegalSqs([]);
      }
    },
    [triggerPlayed, solveState, selected, handleDrop],
  );

  const sqStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    sqStyles[lastMove.from] = { backgroundColor: "rgba(255,170,0,0.30)" };
    sqStyles[lastMove.to] = { backgroundColor: "rgba(255,170,0,0.45)" };
  }
  if (hintSq)
    sqStyles[hintSq] = {
      boxShadow: "inset 0 0 18px 6px rgba(251,191,36,0.55)",
      borderRadius: "4px",
    };
  if (selected)
    sqStyles[selected] = { backgroundColor: "rgba(255,210,0,0.45)" };
  if (selected && solveState === "playing") {
    for (const sq of legalSqs) {
      const hasPiece = gameRef.current.get(sq as any);
      sqStyles[sq] = hasPiece
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

  if (loadState === "fetching")
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading position…</p>
      </div>
    );
  if (loadState === "error")
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm text-slate-500">
          Couldn't load puzzle. Try refreshing.
        </p>
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-white/[0.06] px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.1]"
        >
          Skip →
        </button>
      </div>
    );

  const toMoveLabel = orientation === "white" ? "White" : "Black";
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          {slide.heading}
        </h2>
        <p className="mt-2 text-sm text-slate-400">{slide.instruction}</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
          {!triggerPlayed ? "Opponent is moving…" : `${toMoveLabel} to move`}
        </p>
      </div>
      <LessonBoard
        fen={fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
        orientation={orientation}
        onDrop={handleDrop}
        onSquareClick={handleSquareClick}
        draggable={triggerPlayed && solveState === "playing"}
        customSquareStyles={sqStyles}
      />
      {triggerPlayed && solveState === "playing" && (
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${i < attempts ? "bg-red-500" : "bg-white/[0.10]"}`}
            />
          ))}
          {hintSq && (
            <span className="ml-2 text-xs text-amber-400">
              💡 Move the highlighted piece
            </span>
          )}
        </div>
      )}
      <div
        className={`rounded-2xl border px-5 py-4 transition-all duration-300 ${
          solveState === "correct"
            ? "border-emerald-500/30 bg-emerald-500/[0.06]"
            : "border-white/[0.06] bg-white/[0.02]"
        }`}
      >
        <p
          className={`text-sm font-semibold ${solveState === "correct" ? "text-emerald-300" : "text-slate-500"}`}
        >
          {solveState === "correct"
            ? `✓ ${slide.correctExplanation}`
            : !triggerPlayed
              ? "Opponent's move is coming…"
              : "Find the best move — drag or click"}
        </p>
      </div>
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
  const [fen, setFen] = useState(slide.fen ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [legalSqs, setLegalSqs] = useState<string[]>([]);
  const orientation = slide.orientation ?? "white";

  useEffect(() => {
    preloadSounds();
  }, []);

  const tryMove = useCallback(
    (from: string, to: string): boolean => {
      if (state !== "idle") return false;
      const chess = new Chess(slide.fen ?? "");
      let move;
      try {
        move = chess.move({ from, to, promotion: "q" });
      } catch {
        return false;
      }
      if (!move) return false;

      const uci = from + to;
      const isCorrect = (slide.correctMoves ?? []).some(
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
          setFen(slide.fen ?? "");
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
    const hintFrom = (slide.correctMoves ?? [])[0]?.slice(0, 2);
    if (hintFrom)
      squareStyles[hintFrom] = { backgroundColor: "rgba(251,191,36,0.45)" };
  }

  const toMove = (slide.fen ?? "").split(" ")[1] === "b" ? "Black" : "White";

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
      {slide?.kind === "interact" &&
        (slide.fetchTheme ? (
          <LiveInteractSlide key={idx} slide={slide} onNext={handleNext} />
        ) : (
          <InteractSlideView key={idx} slide={slide} onNext={handleNext} />
        ))}
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
