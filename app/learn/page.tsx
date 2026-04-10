"use client";

/**
 * /learn — Personalized Chess Learning Path  (INTERNAL / NOT INDEXED)
 *
 * Brilliant-style step-by-step lesson path generated from the user's
 * scan data. Each "path" is 5 steps pulled from their real weaknesses:
 *
 *   Step types:
 *     "concept"  — read a short explanation card (30s)
 *     "tactics"  — solve 3 Lichess puzzles on their worst motif
 *     "blunder"  — spot the best move from their own game
 *     "endgame"  — drill their weakest endgame type
 *     "quiz"     — chess knowledge quiz question
 *     "memory"   — piece memory board snapshot
 *
 * Path generation priority (uses scan data when available, falls back
 * to universal content so the page always works even without a scan):
 *   1. Worst tactical motif → concept card + tactics drill
 *   2. Worst endgame type   → concept card + endgame drill
 *   3. Own-game blunder     → blunder spotter
 *   4. Quiz (universal)
 *   5. Memory (universal)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/session-provider";
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
import { Chessboard } from "@/components/chessboard-compat";
import { Chess } from "chess.js";
import { playSound } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";

/* ─────────────────────────────────────────────────────────────── */
/*  Types                                                           */
/* ─────────────────────────────────────────────────────────────── */

type SavedReport = {
  id: string;
  chessUsername: string;
  scanMode: string;
  leaks: any[];
  missedTactics: any[];
  diagnostics: any;
  timeManagement: any;
  createdAt: string;
};

type StepType =
  | "concept"
  | "tactics"
  | "blunder"
  | "endgame"
  | "quiz"
  | "memory";

type LessonStep = {
  id: string;
  type: StepType;
  title: string;
  subtitle: string;
  icon: string;
  // extra data per type
  conceptBody?: ConceptBody;
  tacticsTheme?: string; // Lichess theme slug
  drillPositions?: DrillPosition[];
  quizQuestion?: QuizQuestion;
  memoryPosition?: MemoryPosition;
};

type ConceptBody = {
  headline: string;
  explanation: string;
  tip: string;
  tipIcon: string;
};

type DrillPosition = {
  fen: string;
  bestMove: string;
  label: string;
  cpLoss?: number;
};

/* ─────────────────────────────────────────────────────────────── */
/*  Concept card content library                                    */
/* ─────────────────────────────────────────────────────────────── */

const CONCEPT_CARDS: Record<string, ConceptBody> = {
  fork: {
    headline: "The Fork",
    explanation:
      "A fork attacks two (or more) pieces simultaneously with a single move. The most powerful forks are knight forks — because the knight's L-shape lets it threaten squares that no other piece covers at that moment. The key is finding an outpost square the knight can reach safely.",
    tip: "Before every knight move, ask: does this square attack two valuable targets at once?",
    tipIcon: "♞",
  },
  pin: {
    headline: "The Pin",
    explanation:
      "A pin immobilises a piece because moving it would expose a more valuable piece behind it (absolute pin = exposes the king; relative pin = exposes a less valuable piece). Bishops and rooks are the primary pinning pieces. A pinned piece can often be attacked again to win material.",
    tip: "Look for pieces that are on the same rank, file, or diagonal as your opponent's king or queen.",
    tipIcon: "♗",
  },
  skewer: {
    headline: "The Skewer",
    explanation:
      "A skewer is the reverse of a pin — you attack a valuable piece, it moves, and you win the piece behind it. Rooks and bishops skewer along lines. Common skewer targets: king skewered off the back rank revealing a rook, or queen skewered to expose a rook.",
    tip: "After forcing a king or queen to move, always check whether a piece was left behind.",
    tipIcon: "♜",
  },
  discoveredAttack: {
    headline: "Discovered Attack",
    explanation:
      "A discovered attack happens when one piece moves out of the way to unleash an attack by a piece behind it. The moving piece can also make a threat of its own — when both threats are simultaneous this is a double attack. Discovered checks are especially powerful because the opponent must deal with check first.",
    tip: "Look for pieces that are 'blocking' one of your long-range pieces (bishop, rook, queen) from attacking.",
    tipIcon: "💥",
  },
  backRankMate: {
    headline: "Back Rank Weakness",
    explanation:
      "When a king is trapped behind its own pawns on the back rank, a rook or queen can deliver checkmate simply by landing on that rank. The pawns that were meant to shelter the king become its prison. Creating a luft (escape square with h3/g3) eliminates this weakness.",
    tip: "At any point you have a rook on an open file near the opponent's king, look for back-rank targets.",
    tipIcon: "🏚️",
  },
  deflection: {
    headline: "Deflection",
    explanation:
      "Deflection forces a defending piece away from its important duty (guarding a square, protecting another piece, stopping checkmate). You sacrifice or attack a piece to lure the defender off, then exploit the gap. Different from a decoy — deflection pushes away, decoy lures toward a target.",
    tip: "Identify what one piece is doing for your opponent — then ask how you can force it away.",
    tipIcon: "🔀",
  },
  hangingPiece: {
    headline: "Hanging Pieces",
    explanation:
      "A hanging piece is completely undefended and can be taken for free. Many games are decided by one player repeatedly leaving pieces en prise. The discipline is: before every move, scan all your pieces — is every one defended or safe? This 'blunder check' habit is the single fastest way to gain Elo.",
    tip: "After every move, ask: did I just leave anything hanging? Did my opponent?",
    tipIcon: "🎣",
  },
  rookEndgame: {
    headline: "Rook Endgames",
    explanation:
      "Rook endgames are the most common endgame type and the most difficult to convert. Two key principles: keep your rook active (rooks belong behind passed pawns — yours or theirs) and centralise your king. The Philidor position (drawing technique) and the Lucena position (winning technique) are essential knowledge.",
    tip: "Rooks are most powerful from behind — place your rook behind the passed pawn, not in front of it.",
    tipIcon: "♜",
  },
  pawnEndgame: {
    headline: "Pawn Endgames",
    explanation:
      "Pawn endgames are decided by king activity and the opposition. The side with the active king almost always wins. Key concepts: opposition (directly facing the opponent king one square apart), the key squares (squares where a king wins regardless), and zugzwang (being forced to move is losing).",
    tip: "In a pawn endgame, race your king to the center immediately — a passive king loses almost every time.",
    tipIcon: "♟",
  },
  queenEndgame: {
    headline: "Queen Endgames",
    explanation:
      "Queen endgames are notoriously drawish due to perpetual check threats. The winning side must combine king activity with accurate queen placement, avoiding any stalemate tricks. Always check if your opponent can force repetition before entering a queen endgame.",
    tip: "Watch for stalemate tricks — the defending side will try to sacrifice the queen to reach stalemate.",
    tipIcon: "♛",
  },
  bishopEndgame: {
    headline: "Bishop Endgames",
    explanation:
      "Same-coloured bishop endgames are often drawn even with an extra pawn if the pawns can be blockaded on the bishop's colour. Opposite-coloured bishop endgames are famously drawish — the defending bishop can never be chased off the blockading square.",
    tip: "Place your pawns on the opposite colour to your bishop so they can't be permanently blocked.",
    tipIcon: "♗",
  },
  knightEndgame: {
    headline: "Knight Endgames",
    explanation:
      "Knight endgames are similar to pawn endgames in speed — knights are slow and need centralisation. Extra pawns are more decisive than in bishop endgames because there are no drawn 'wrong colour bishop' tricks. Knight vs pawns: a single pawn can often draw against a knight.",
    tip: "Centralise the knight immediately — a knight on the rim is dim, especially in endgames.",
    tipIcon: "♞",
  },
  kingsideAttack: {
    headline: "King Safety",
    explanation:
      "An exposed king is a liability in every phase of the game. Common mistakes: delaying castling too long, moving king-side pawns unnecessarily, and trading the bishop that protects the castled king. When your opponent's king is exposed, open files and diagonals toward it with tempo.",
    tip: "Count the attackers vs defenders near the enemy king before launching an attack.",
    tipIcon: "🔥",
  },
  default: {
    headline: "Chess Fundamentals",
    explanation:
      "Strong chess is built on consistent fundamentals: develop pieces quickly, control the centre, castle early, connect your rooks, and always check for tactics before moving. These principles apply at every level and every phase of the game.",
    tip: "Before every move: check for opponent threats, check your pieces are safe, then make your move.",
    tipIcon: "♟",
  },
};

/* ─────────────────────────────────────────────────────────────── */
/*  Motif → display label mapping                                   */
/* ─────────────────────────────────────────────────────────────── */

const MOTIF_TO_THEME: Record<string, string> = {
  "Knight Fork": "fork",
  "Queen Fork": "fork",
  "Pawn Fork": "fork",
  Fork: "fork",
  Pin: "pin",
  Skewer: "skewer",
  "Discovered Attack": "discoveredAttack",
  "Discovered Check": "discoveredAttack",
  "Double Check": "discoveredAttack",
  "Back Rank": "backRankMate",
  Sacrifice: "hangingPiece",
  Deflection: "deflection",
  "Trapped Piece": "hangingPiece",
  "Hanging Piece": "hangingPiece",
  "Missed Mate": "backRankMate",
  "Missed Capture": "hangingPiece",
  "Forcing Capture": "fork",
  "Winning Blunder": "hangingPiece",
  "Major Miss": "hangingPiece",
  "King Exposure": "kingsideAttack",
};

const ENDGAME_TO_CONCEPT: Record<string, string> = {
  Pawn: "pawnEndgame",
  Rook: "rookEndgame",
  "Rook + Bishop": "rookEndgame",
  "Rook + Knight": "rookEndgame",
  "Rook + Minor": "rookEndgame",
  Queen: "queenEndgame",
  "Queen + Rook": "queenEndgame",
  "Two Bishops": "bishopEndgame",
  "Bishop vs Bishop": "bishopEndgame",
  "Knight vs Knight": "knightEndgame",
  "Knight vs Bishop": "knightEndgame",
  "Bishop vs Knight": "bishopEndgame",
};

const ENDGAME_TO_THEME: Record<string, string> = {
  Pawn: "pawnEndgame",
  Rook: "rookEndgame",
  "Rook + Bishop": "rookEndgame",
  "Rook + Knight": "rookEndgame",
  Queen: "queenEndgame",
  "Two Bishops": "bishopEndgame",
  "Knight vs Knight": "knightEndgame",
  "Bishop vs Bishop": "bishopEndgame",
};

const THEME_DISPLAY: Record<string, string> = {
  fork: "Forks",
  pin: "Pins",
  skewer: "Skewers",
  discoveredAttack: "Discovered Attacks",
  backRankMate: "Back Rank Tactics",
  deflection: "Deflection",
  hangingPiece: "Hanging Pieces",
  kingsideAttack: "King Safety",
  rookEndgame: "Rook Endgames",
  pawnEndgame: "Pawn Endgames",
  queenEndgame: "Queen Endgames",
  bishopEndgame: "Bishop Endgames",
  knightEndgame: "Knight Endgames",
};

/* ─────────────────────────────────────────────────────────────── */
/*  Path generator                                                  */
/* ─────────────────────────────────────────────────────────────── */

function buildLessonPath(
  reports: SavedReport[],
  quizQs: QuizQuestion[],
  memPs: MemoryPosition[],
  pathSeed: number,
): LessonStep[] {
  const steps: LessonStep[] = [];

  // ── Weak motif data ──
  const motifCounts = new Map<string, number>();
  const blunderPositions: DrillPosition[] = [];

  for (const r of reports) {
    for (const t of r.missedTactics ?? []) {
      for (const tag of t.tags ?? []) {
        const theme = MOTIF_TO_THEME[tag];
        if (theme) motifCounts.set(theme, (motifCounts.get(theme) ?? 0) + 1);
      }
      // Collect blunder positions (big cp losses from own games)
      if (t.cpLoss >= 200 && t.fenBefore && t.bestMove) {
        blunderPositions.push({
          fen: t.fenBefore,
          bestMove: t.bestMove,
          label: `Game #${t.gameIndex}, Move ${t.moveNumber}`,
          cpLoss: t.cpLoss,
        });
      }
    }
  }

  const sortedMotifs = Array.from(motifCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const topMotif = sortedMotifs[0]?.[0] ?? null;

  // ── Weak endgame data ──
  const endgameMap = new Map<
    string,
    { total: number; count: number; mistakes: DrillPosition[] }
  >();
  for (const r of reports) {
    const stats = r.diagnostics?.endgameStats;
    if (stats?.byType) {
      for (const bt of stats.byType) {
        const e = endgameMap.get(bt.type) ?? {
          total: 0,
          count: 0,
          mistakes: [],
        };
        e.total += bt.avgCpLoss * bt.count;
        e.count += bt.count;
        endgameMap.set(bt.type, e);
      }
    }
    for (const m of r.diagnostics?.endgameMistakes ?? []) {
      if (m.fenBefore && m.bestMove) {
        const e = endgameMap.get(m.endgameType);
        if (e) {
          e.mistakes.push({
            fen: m.fenBefore,
            bestMove: m.bestMove,
            label: `${m.endgameType} Endgame — Move ${m.moveNumber}`,
            cpLoss: m.cpLoss,
          });
        }
      }
    }
  }

  const sortedEndgames = Array.from(endgameMap.entries())
    .map(([type, d]) => ({
      type,
      avgCpLoss: d.count > 0 ? d.total / d.count : 0,
      mistakes: d.mistakes,
    }))
    .filter((e) => e.avgCpLoss > 0)
    .sort((a, b) => b.avgCpLoss - a.avgCpLoss);
  const topEndgame = sortedEndgames[0] ?? null;

  // ── STEP 1: Concept card for worst tactic motif (or default) ──
  const conceptKey = topMotif ?? "default";
  const conceptData = CONCEPT_CARDS[conceptKey] ?? CONCEPT_CARDS.default;
  steps.push({
    id: `concept-${pathSeed}`,
    type: "concept",
    title: conceptData.headline,
    subtitle: topMotif
      ? `Your most-missed tactic: ${THEME_DISPLAY[topMotif] ?? topMotif}`
      : "Chess fundamentals",
    icon: conceptData.tipIcon,
    conceptBody: conceptData,
  });

  // ── STEP 2: Tactics drill on the same motif ──
  steps.push({
    id: `tactics-${pathSeed}`,
    type: "tactics",
    title: `${THEME_DISPLAY[conceptKey] ?? "Tactics"} Drill`,
    subtitle: "Solve 3 puzzles on your weakness",
    icon: "🎯",
    tacticsTheme: conceptKey,
  });

  // ── STEP 3: Own-game blunder OR endgame drill ──
  if (blunderPositions.length > 0) {
    steps.push({
      id: `blunder-${pathSeed}`,
      type: "blunder",
      title: "Your Own Blunders",
      subtitle: "Find the best move from your real games",
      icon: "🔍",
      drillPositions: blunderPositions.slice(0, 5),
    });
  } else if (topEndgame && topEndgame.mistakes.length > 0) {
    const endgameConceptKey =
      ENDGAME_TO_CONCEPT[topEndgame.type] ?? "rookEndgame";
    const endgameConceptData =
      CONCEPT_CARDS[endgameConceptKey] ?? CONCEPT_CARDS.default;
    steps.push({
      id: `endgame-concept-${pathSeed}`,
      type: "concept",
      title: endgameConceptData.headline,
      subtitle: `Your weakest endgame: ${topEndgame.type}`,
      icon: endgameConceptData.tipIcon,
      conceptBody: endgameConceptData,
    });
  } else {
    // Universal fallback: quiz
    const q = quizQs[pathSeed % quizQs.length];
    if (q) {
      steps.push({
        id: `quiz-fallback-${pathSeed}`,
        type: "quiz",
        title: "Quick Knowledge Check",
        subtitle: "One chess theory question",
        icon: "🧠",
        quizQuestion: q,
      });
    }
  }

  // ── STEP 4: Endgame drill or memory ──
  if (
    topEndgame &&
    topEndgame.mistakes.length > 0 &&
    blunderPositions.length > 0
  ) {
    steps.push({
      id: `endgame-${pathSeed}`,
      type: "endgame",
      title: `${topEndgame.type} Endgame Practice`,
      subtitle: "Drill from your actual endgame mistakes",
      icon: "♟",
      drillPositions: topEndgame.mistakes.slice(0, 5),
    });
  } else {
    const mem = memPs[(pathSeed + 1) % Math.max(memPs.length, 1)];
    if (mem) {
      steps.push({
        id: `memory-${pathSeed}`,
        type: "memory",
        title: "Piece Memory",
        subtitle: "Memorise the position, then place the pieces",
        icon: "🧩",
        memoryPosition: mem,
      });
    }
  }

  // ── STEP 5: Quiz ──
  const qIdx = (pathSeed + 2) % Math.max(quizQs.length, 1);
  const q = quizQs[qIdx];
  if (q) {
    steps.push({
      id: `quiz-${pathSeed}`,
      type: "quiz",
      title: "Chess Quiz",
      subtitle: "Test your understanding",
      icon: "🧠",
      quizQuestion: q,
    });
  }

  return steps.slice(0, 5);
}

/* ─────────────────────────────────────────────────────────────── */
/*  Concept Card Component                                          */
/* ─────────────────────────────────────────────────────────────── */

function ConceptCard({
  body,
  onComplete,
}: {
  body: ConceptBody;
  onComplete: () => void;
}) {
  const [read, setRead] = useState(false);

  // "mark as read" after 8 seconds automatically, but button available immediately
  useEffect(() => {
    const t = setTimeout(() => setRead(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Main card */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">{body.tipIcon}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{body.headline}</h2>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
              Concept
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">
          {body.explanation}
        </p>
        {/* Tip block */}
        <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            💡 Key tip
          </p>
          <p className="text-sm text-cyan-200/80">{body.tip}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setRead(true);
          onComplete();
        }}
        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:brightness-110 active:scale-[0.98]"
      >
        Got it — next step →
      </button>

      {!read && (
        <p className="text-center text-[11px] text-slate-600">
          Take a moment to read before continuing
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Position Drill Step — one position at a time, drag to move      */
/* ─────────────────────────────────────────────────────────────── */

function PositionDrillStep({
  positions,
  onComplete,
}: {
  positions: DrillPosition[];
  onComplete: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [fen, setFen] = useState<string>(positions[0]?.fen ?? "");
  const completedRef = useRef(false);

  const pos = positions[idx] ?? null;

  const orientation = useMemo<"white" | "black">(() => {
    const raw = pos?.fen ?? "";
    return raw.split(" ")[1] === "b" ? "black" : "white";
  }, [pos?.fen]);

  const handleDrop = useCallback(
    (src: string, tgt: string): boolean => {
      if (!pos || status !== "idle") return false;
      const chess = new Chess(pos.fen);
      let move;
      try {
        move = chess.move({ from: src, to: tgt, promotion: "q" });
      } catch {
        return false;
      }
      if (!move) return false;

      const uci = `${src}${tgt}`;
      const best = pos.bestMove ?? "";
      const correct =
        move.san === best ||
        move.san.replace(/[+#]/g, "") === best.replace(/[+#]/g, "") ||
        uci === best ||
        `${uci}q` === best;

      setFen(chess.fen());
      setStatus(correct ? "correct" : "wrong");

      setTimeout(() => {
        if (correct) {
          const next = idx + 1;
          if (next >= positions.length) {
            if (!completedRef.current) {
              completedRef.current = true;
              onComplete();
            }
          } else {
            setIdx(next);
            setFen(positions[next].fen);
            setStatus("idle");
          }
        } else {
          setFen(pos.fen);
          setStatus("idle");
        }
      }, 1200);

      return true;
    },
    [pos, status, idx, positions, onComplete],
  );

  if (!pos) return null;

  return (
    <div className="mx-auto max-w-sm space-y-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {positions.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i < idx
                ? "bg-emerald-500"
                : i === idx
                  ? "bg-purple-400"
                  : "bg-white/[0.1]"
            }`}
          />
        ))}
      </div>

      {/* Board */}
      <div className="overflow-hidden rounded-xl">
        <Chessboard
          position={fen}
          boardOrientation={orientation}
          onPieceDrop={handleDrop}
          arePiecesDraggable={status === "idle"}
        />
      </div>

      {/* Feedback */}
      <div
        className={`rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors ${
          status === "correct"
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : status === "wrong"
              ? "border border-red-500/30 bg-red-500/10 text-red-300"
              : "border border-white/[0.06] bg-white/[0.03] text-slate-400"
        }`}
      >
        {status === "correct"
          ? `✓ Correct!${pos.label ? ` — ${pos.label}` : ""}`
          : status === "wrong"
            ? "✗ Not quite — try again"
            : pos.label
              ? pos.label
              : "Find the best move"}
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={onComplete}
        className="w-full rounded-lg py-1 text-xs text-slate-600 hover:text-slate-500"
      >
        Skip →
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Tactics Step (fetches Lichess puzzles)                          */
/* ─────────────────────────────────────────────────────────────── */

function TacticsStep({
  theme,
  onComplete,
}: {
  theme: string;
  onComplete: (score: number) => void;
}) {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [solved, setSolved] = useState(0);
  const [failed, setFailed] = useState(0);
  const [done, setDone] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetch(`/api/puzzles?themes=${theme}&limit=3`)
      .then((r) => r.json())
      .then((data) => {
        const puzzles = data.puzzles ?? [];
        // Convert lichess format to DrillPosition
        const drills = puzzles
          .map((p: any) => ({
            fen: p.fen ?? p.puzzle?.fen,
            bestMove: p.puzzle?.solution?.[0] ?? p.bestMove,
            label: `${THEME_DISPLAY[theme] ?? theme} puzzle`,
          }))
          .filter((d: any) => d.fen && d.bestMove);
        setPositions(drills);
      })
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  }, [theme]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="text-sm">Loading puzzles…</p>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-slate-400 text-sm">
          No puzzles available for this theme right now.
        </p>
        <button
          type="button"
          onClick={() => onComplete(0)}
          className="rounded-xl bg-white/[0.06] px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.1]"
        >
          Skip →
        </button>
      </div>
    );
  }

  return (
    <PositionDrillStep
      positions={positions}
      onComplete={() => onComplete(solved)}
    />
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Step Wrapper — progress + header                               */
/* ─────────────────────────────────────────────────────────────── */

function StepHeader({
  step,
  totalSteps,
  stepIndex,
}: {
  step: LessonStep;
  totalSteps: number;
  stepIndex: number;
}) {
  const pct = (stepIndex / totalSteps) * 100;

  return (
    <div className="mb-6">
      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-slate-500 shrink-0">
          {stepIndex}/{totalSteps}
        </span>
      </div>
      {/* Step label */}
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">{step.icon}</span>
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">
            {step.title}
          </h2>
          <p className="text-xs text-slate-500">{step.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Path Overview Screen                                            */
/* ─────────────────────────────────────────────────────────────── */

const STEP_TYPE_COLORS: Record<StepType, string> = {
  concept: "from-violet-900/60 to-purple-900/40 border-violet-500/25",
  tactics: "from-red-900/50 to-rose-900/30 border-red-500/20",
  blunder: "from-orange-900/50 to-amber-900/30 border-amber-500/20",
  endgame: "from-cyan-900/50 to-sky-900/30 border-cyan-500/20",
  quiz: "from-emerald-900/50 to-green-900/30 border-emerald-500/20",
  memory: "from-indigo-900/50 to-blue-900/30 border-indigo-500/20",
};

const STEP_TYPE_LABELS: Record<StepType, string> = {
  concept: "Learn",
  tactics: "Practice",
  blunder: "Review",
  endgame: "Drill",
  quiz: "Quiz",
  memory: "Memory",
};

function PathOverview({
  steps,
  username,
  onStart,
}: {
  steps: LessonStep[];
  username: string | null;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Hero */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400">
          ✦ Personalized Path
        </div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          Your Lesson for Today
        </h1>
        <p className="text-sm text-slate-400">
          {username ? `Built from ${username}'s scan data · ` : ""}5 steps · ~10
          min
        </p>
      </div>

      {/* Steps list */}
      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`flex items-center gap-4 rounded-xl border bg-gradient-to-r p-4 ${STEP_TYPE_COLORS[step.type]}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-lg font-black text-white">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{step.icon}</span>
                <p className="font-semibold text-sm text-white truncate">
                  {step.title}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {step.subtitle}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-600 border border-white/[0.06] rounded px-1.5 py-0.5">
              {STEP_TYPE_LABELS[step.type]}
            </span>
          </div>
        ))}
      </div>

      {/* Start */}
      <button
        type="button"
        onClick={onStart}
        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
      >
        Begin Lesson →
      </button>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-slate-600">
        🧪 Early preview — give us feedback in{" "}
        <a
          href="https://discord.gg/YS8fc4FtEk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-400 underline"
        >
          Discord
        </a>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Completion Screen                                               */
/* ─────────────────────────────────────────────────────────────── */

function CompletionScreen({
  stepsCompleted: total,
  onRestart,
}: {
  stepsCompleted: number;
  onRestart: () => void;
}) {
  useEffect(() => {
    playSound("correct");
    earnCoins("study_task");
  }, []);

  return (
    <div className="mx-auto max-w-sm space-y-6 py-8 text-center">
      <div className="text-6xl">🏆</div>
      <div>
        <h2 className="text-2xl font-black text-white">Lesson Complete!</h2>
        <p className="mt-2 text-sm text-slate-400">
          You finished all {total} steps. Keep it up every day to see real
          improvement.
        </p>
      </div>
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
          +10 coins earned
        </p>
        <p className="mt-0.5 text-[11px] text-emerald-300/60">
          Come back tomorrow for a new path
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onRestart}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 py-3 text-sm font-bold text-white hover:brightness-110"
        >
          Do Another Path
        </button>
        <Link
          href="/train"
          className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.06] transition-colors"
        >
          Back to Training Hub
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  No-scan state                                                   */
/* ─────────────────────────────────────────────────────────────── */

function NoScanState() {
  return (
    <div className="mx-auto max-w-sm space-y-5 py-8 text-center">
      <div className="text-5xl">🔍</div>
      <div>
        <h2 className="text-xl font-bold text-white">No Scan Found</h2>
        <p className="mt-2 text-sm text-slate-400">
          Your personalized path is built from your game scan. Run a scan first,
          save it to your profile, and come straight back here.
        </p>
      </div>
      <Link
        href="/#analyzer"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-cyan-500/25 hover:brightness-110"
      >
        Scan My Games →
      </Link>
      <p className="text-[11px] text-slate-600">
        Or{" "}
        <Link
          href="/train"
          className="text-slate-500 hover:text-slate-400 underline"
        >
          open the Training Hub
        </Link>{" "}
        for universal drills that work without a scan
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Main Page                                                       */
/* ─────────────────────────────────────────────────────────────── */

export default function LearnPage() {
  const { authenticated, loading: sessionLoading } = useSession();

  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const [quizQs] = useState<QuizQuestion[]>(() =>
    getDailyQuizQuestions(10, Math.floor(Date.now() / 86_400_000)),
  );
  const [memPs] = useState<MemoryPosition[]>(() =>
    getDailyMemoryPositions(5, Math.floor(Date.now() / 86_400_000)),
  );

  // Path state
  const [pathSeed, setPathSeed] = useState(() =>
    Math.floor(Date.now() / 86_400_000),
  ); // one per day
  const [phase, setPhase] = useState<"overview" | "active" | "done">(
    "overview",
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Fetch saved reports (guests skip — they get universal path)
  useEffect(() => {
    if (sessionLoading || !authenticated) {
      setLoadingReports(false);
      return;
    }
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => {
        const reps: SavedReport[] = data.reports ?? [];
        setReports(reps);
        if (reps.length > 0) setSelectedUser(reps[0].chessUsername);
      })
      .catch(() => {})
      .finally(() => setLoadingReports(false));
  }, [authenticated, sessionLoading]);

  const userReports = useMemo(
    () =>
      selectedUser
        ? reports.filter((r) => r.chessUsername === selectedUser)
        : reports,
    [reports, selectedUser],
  );

  const steps = useMemo(
    () => buildLessonPath(userReports, quizQs, memPs, pathSeed),
    [userReports, quizQs, memPs, pathSeed],
  );

  const currentStep = steps[stepIndex] ?? null;
  const totalSteps = steps.length;

  const advance = useCallback(() => {
    if (stepIndex + 1 >= totalSteps) {
      setPhase("done");
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, totalSteps]);

  const restart = useCallback(() => {
    setPathSeed((s) => s + 1);
    setStepIndex(0);
    setPhase("overview");
    setCoinsEarned(0);
  }, []);

  // Loading state
  if (sessionLoading || loadingReports) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/train"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Training Hub
        </Link>

        {/* Username selector (if multiple) */}
        {reports.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {[...new Set(reports.map((r) => r.chessUsername))].length > 1 ? (
              <select
                value={selectedUser ?? ""}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-slate-300 focus:outline-none"
              >
                {[...new Set(reports.map((r) => r.chessUsername))].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-slate-400">
                {selectedUser}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Guest nudge */}
      {!authenticated && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-4 py-3">
          <p className="text-xs text-purple-300/70">
            Showing a universal path — sign in & save a scan to personalise it.
          </p>
          <Link
            href="/auth/signin"
            className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:brightness-110"
          >
            Sign in
          </Link>
        </div>
      )}

      {/* Content */}
      {authenticated && reports.length === 0 ? (
        <NoScanState />
      ) : phase === "overview" ? (
        <PathOverview
          steps={steps}
          username={selectedUser}
          onStart={() => setPhase("active")}
        />
      ) : phase === "done" ? (
        <CompletionScreen stepsCompleted={totalSteps} onRestart={restart} />
      ) : currentStep ? (
        <div>
          <StepHeader
            step={currentStep}
            totalSteps={totalSteps}
            stepIndex={stepIndex + 1}
          />

          {currentStep.type === "concept" && currentStep.conceptBody && (
            <ConceptCard body={currentStep.conceptBody} onComplete={advance} />
          )}

          {currentStep.type === "tactics" && (
            <TacticsStep
              theme={currentStep.tacticsTheme ?? "fork"}
              onComplete={advance}
            />
          )}

          {(currentStep.type === "blunder" || currentStep.type === "endgame") &&
            currentStep.drillPositions && (
              <PositionDrillStep
                positions={currentStep.drillPositions}
                onComplete={advance}
              />
            )}

          {currentStep.type === "quiz" && currentStep.quizQuestion && (
            <div className="mx-auto max-w-lg space-y-4">
              <ChessQuiz
                question={currentStep.quizQuestion}
                onComplete={(correct) => {
                  if (correct) playSound("correct");
                  setTimeout(advance, 800);
                }}
              />
            </div>
          )}

          {currentStep.type === "memory" && currentStep.memoryPosition && (
            <div className="mx-auto max-w-lg">
              <PieceMemory
                position={currentStep.memoryPosition}
                onComplete={advance}
                viewSeconds={5}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
