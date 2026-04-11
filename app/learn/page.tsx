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
  intro: string;
  steps: { label: string; text: string }[];
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
    intro: "One piece, two threats — that's the essence of a fork.",
    steps: [
      {
        label: "The core idea",
        text: "A fork attacks two pieces at the same time with a single move. Your opponent can only move one piece per turn, so they'll almost always lose material. Even a 'bad' piece can fork if it attacks two valuable enough targets.",
      },
      {
        label: "Why knights fork best",
        text: "Knights reach squares no other piece can cover in the same move — their L-shape is unique. A centralised knight can fork almost any two pieces. Royal forks (attacking the king + anything else) are especially powerful because the king must move.",
      },
      {
        label: "How to find forks",
        text: "Scan for squares your piece can reach safely. Ask: does landing here attack two valuable targets at once? Look especially for the king or queen as one of the targets — the opponent has no choice but to deal with those.",
      },
    ],
    tip: "Before every knight move, ask: does this square attack two valuable targets at once?",
    tipIcon: "♞",
  },
  pin: {
    headline: "The Pin",
    intro:
      "A pin keeps an enemy piece frozen — because moving it reveals something worse.",
    steps: [
      {
        label: "Absolute vs. relative pin",
        text: "In an absolute pin the piece behind is the king — the pinned piece literally cannot move by the rules. In a relative pin the piece behind is just more valuable, so moving the front piece is a losing trade. Both are equally exploitable.",
      },
      {
        label: "How to create a pin",
        text: "Bishops pin along diagonals; rooks and queens pin along ranks and files. Align your long-range piece so an enemy piece stands between it and a more valuable target. Batteries (two rooks or queen + rook) make pins devastating.",
      },
      {
        label: "Exploit the pinned piece",
        text: "Once pinned, a piece is paralysed. Attack it with pawns or pieces — a pinned pawn can almost never be defended enough. Piling on extra attackers forces material gain. Also look for ways to discover a second attack while the pin holds.",
      },
    ],
    tip: "Look for pieces that are on the same rank, file, or diagonal as your opponent's king or queen.",
    tipIcon: "♗",
  },
  skewer: {
    headline: "The Skewer",
    intro:
      "A skewer is a pin in reverse — attack the valuable piece first, win what's hiding behind it.",
    steps: [
      {
        label: "How a skewer works",
        text: "You attack a high-value piece (king or queen) along a rank, file, or diagonal. It's forced to move out of the way — and the piece hiding behind it is then exposed and free to take. The attacker gains material almost for free.",
      },
      {
        label: "Most common patterns",
        text: "A rook skewers a king off the back rank to capture a rook behind it. A bishop skewers a queen to win a rook on the same diagonal. Always check when your opponent's pieces line up — if a valuable piece is 'shielding' a weaker one, a skewer may exist.",
      },
      {
        label: "Skewering checks win fastest",
        text: "A skewer that is also a check is almost always winning — the king must move first (no choice), and whatever was sheltering behind it is yours for free. Seek positions where your rook or bishop lands with check AND a piece stands behind the king.",
      },
    ],
    tip: "After forcing a king or queen to move, always check whether a piece was left behind.",
    tipIcon: "♜",
  },
  discoveredAttack: {
    headline: "Discovered Attack",
    intro:
      "Move one piece — and the piece behind it suddenly attacks. Two threats, one move.",
    steps: [
      {
        label: "The trigger and the gun",
        text: "A discovered attack has two actors: the 'trigger' piece you actually move, and the 'gun' — the long-range piece that fires once the trigger clears its path. The crucial detail: the trigger piece can make its OWN threat while the gun fires. That creates two simultaneous attacks.",
      },
      {
        label: "Discovered check is the best",
        text: "When the revealed attack hits the king (discovered check), the opponent MUST address the check first — they can do nothing about the trigger piece's threat. This is why discovered checks almost always win material. Look for your pieces hiding behind your bishops, rooks, and queen.",
      },
      {
        label: "How to find them",
        text: "Ask: which of my pieces stands in front of another long-range piece? If I moved that front piece somewhere powerful, what does the back piece suddenly attack? The trigger move should be a threat itself — ideally a check, capture, or fork — so the opponent can't deal with both.",
      },
    ],
    tip: "Look for pieces blocking one of your long-range pieces — moving them could fire two threats at once.",
    tipIcon: "💥",
  },
  backRankMate: {
    headline: "Back Rank Weakness",
    intro: "The pawns sheltering your king can become its prison.",
    steps: [
      {
        label: "Why it happens",
        text: "After castling, the king typically sits on the back rank behind three pawns. Those pawns provide safety — but if the king ever needs to escape forward, the pawns block it. A rook or queen landing on the back rank delivers checkmate because there's nowhere to run.",
      },
      {
        label: "The cure: create a 'luft'",
        text: "Push one kingside pawn one square (h3 or g3 for White, h6/g6 for Black) to give the king an escape square. This takes one tempo but eliminates the back-rank weakness permanently. It's almost always worth doing once the endgame nears.",
      },
      {
        label: "Look for it in your opponent's camp",
        text: "If your opponent has never moved their kingside pawns, the back-rank mate threat is live. Centralise your rook on an open file pointing at their back rank. Even the threat of Rxe8# can force your opponent into a losing defence, winning material elsewhere.",
      },
    ],
    tip: "Any rook on an open file near the opponent's king — immediately look for back-rank mate.",
    tipIcon: "🏚️",
  },
  deflection: {
    headline: "Deflection",
    intro:
      "Force the one piece holding everything together to abandon its post.",
    steps: [
      {
        label: "What deflection does",
        text: "Deflection sacrifices or attacks a piece specifically to drag it away from a critical square — one it's guarding a mate threat on, protecting another piece, or using to block a check. The moment that defender abandons its duty, you strike the square it was protecting.",
      },
      {
        label: "Find the overloaded defender",
        text: "Look for a single piece doing two jobs at once (guarding two squares, or guarding AND blocking a check). Overloaded pieces are prime deflection targets — they can't abandon one duty without surrendering the other. Ask: what does this piece defend? What if it were gone?",
      },
      {
        label: "The classic pattern",
        text: "A queen sacrifice to deflect a key defender is the engine of many mating attacks. If the opponent takes, they give up the mate defence. If they don't, you win material instead. Deflection sacrifices don't need to be recoverable — the positional gain is often worth two pawns.",
      },
    ],
    tip: "Identify what one piece is doing for your opponent — then ask how you can force it away.",
    tipIcon: "🔀",
  },
  hangingPiece: {
    headline: "Hanging Pieces",
    intro:
      "The fastest way to gain — and lose — material: pieces left undefended.",
    steps: [
      {
        label: "What 'hanging' means",
        text: "A piece is hanging if it can be captured and the opponent gains material from the trade. Completely undefended pieces can simply be taken for free. Many games at every level are decided by a single hanging piece — the player who notices it first wins.",
      },
      {
        label: "The blunder check habit",
        text: "Before you move, run this 5-second check: (1) What is my opponent threatening — any captures, forks, checks? (2) After choosing your move, ask: does THIS move leave any of my pieces unprotected? If yes, reconsider. This one habit eliminates most blunders.",
      },
      {
        label: "Hanging in disguise",
        text: "A piece can be 'effectively hanging' even if defended — if the defender is itself attacked, or if the exchange trades a rook for a bishop. Always count the number of attackers vs. defenders on a contested piece. If attackers outnumber defenders, the piece is effectively hanging.",
      },
    ],
    tip: "After every move, ask: did I leave anything hanging? Did my opponent?",
    tipIcon: "🎣",
  },
  rookEndgame: {
    headline: "Rook Endgames",
    intro:
      "The most common endgame type — and the most technical. Activity wins, not material.",
    steps: [
      {
        label: "Rooks belong behind passed pawns",
        text: "Whether the passed pawn is yours or your opponent's, your rook belongs behind it. Your rook gains power as the pawn advances; the enemy rook is pinned in front of it, entirely passive. This single principle decides more rook endings than anything else.",
      },
      {
        label: "Centralise your king",
        text: "In the endgame, the king is a fighting piece. The moment queens come off the board, rush your king toward the center (and toward the passed pawns). A passive king on the corner loses most rook endings. A centralised king supporting your pawn is often decisive.",
      },
      {
        label: "Lucena and Philidor",
        text: "Learn two positions by name. The Lucena position is the key winning technique — rook on the 1st rank sheltering your king, then 'build a bridge' to block checks. The Philidor position is the key drawing method — rook on the 6th cutting off the enemy king, switching to the back rank only when forced.",
      },
    ],
    tip: "Rooks are most powerful from behind — place your rook behind the passed pawn, not in front of it.",
    tipIcon: "♜",
  },
  pawnEndgame: {
    headline: "Pawn Endgames",
    intro: "Every tempo is life-or-death. The active king always wins.",
    steps: [
      {
        label: "Activate your king immediately",
        text: "The moment pawns are trading and pieces come off, sprint your king toward the center. A centralised king attacks pawns on both sides of the board and shepherds your own pawns forward. A passive king on the back rank almost always loses, even in seemingly balanced positions.",
      },
      {
        label: "The Opposition",
        text: "When two kings face each other one square apart with the opponent to move, the side NOT to move has 'the opposition' and the opponent's king must yield. Grabbing the opposition forces the enemy king backward — often deciding whether a pawn promotes or whether the game draws.",
      },
      {
        label: "Key squares",
        text: "Every pawn has three 'key squares' two ranks ahead of it. If your king reaches any key square, the pawn promotes regardless of where the enemy king stands. Knowing the key squares tells you exactly which squares your king must target — and whether the endgame is won or drawn from any given position.",
      },
    ],
    tip: "In a pawn endgame, race your king to the centre immediately — a passive king loses almost every time.",
    tipIcon: "♟",
  },
  queenEndgame: {
    headline: "Queen Endgames",
    intro: "Looks won — but perpetual check can steal the draw in seconds.",
    steps: [
      {
        label: "The perpetual check trap",
        text: "Queen + pawn vs. queen is among the most drawn endings in chess. The defending queen gives perpetual check — the winning king gets chased endlessly. You must shield your king from checks, typically by placing it near the queening pawn or behind another pawn as a shield.",
      },
      {
        label: "Stalemate tricks",
        text: "With an extra queen, it's surprisingly easy to stalemate the defender. If the enemy king has no legal moves and you give check carelessly, it's a draw. Always verify your king has escape squares before every queen check — especially when the enemy king is trapped in a corner.",
      },
      {
        label: "King centralisation",
        text: "The winning king must march to the center and use pawns as shields against checks. Getting your king to the center stops most perpetual check attempts. Once checks are exhausted, bring both queen and king to support the queening pawn — triangulate if needed to reach a basic winning position.",
      },
    ],
    tip: "Watch for stalemate tricks — always check the enemy king has a legal move before playing any queen check.",
    tipIcon: "♛",
  },
  bishopEndgame: {
    headline: "Bishop Endgames",
    intro:
      "Opposite-coloured bishops almost always draw. Same-coloured bishops almost always decide.",
    steps: [
      {
        label: "Same-colour bishops",
        text: "When both bishops travel on the same colour, normal endgame rules apply. Extra pawns are significant. Focus on king activity (centralise fast), pawn breaks (advance on both flanks), and avoiding pawn exchanges that reduce your advantage.",
      },
      {
        label: "Opposite-colour bishops",
        text: "When your bishop is dark-squared and theirs is light-squared, draws are common — even two extra pawns often don't win. The defending bishop blockades on its colour and cannot be chased away. Winning requires an unstoppable passed pawn or a direct king attack, not material alone.",
      },
      {
        label: "Pawn colour placement",
        text: "Keep your pawns on the OPPOSITE colour to your bishop — they control different squares together, and the enemy bishop can never block them. Pawns on the same colour as your own bishop get permanently blockaded by the opponent's same-coloured bishop. This single rule determines endgame accessibility.",
      },
    ],
    tip: "Place your pawns on the opposite colour to your bishop — they control more squares together.",
    tipIcon: "♗",
  },
  knightEndgame: {
    headline: "Knight Endgames",
    intro:
      "Treat them like pawn endgames — king activity and extra pawns are decisive.",
    steps: [
      {
        label: "Centralise the knight",
        text: "Unlike bishops, a knight has no long-range power — it needs to be close to the action. A centralised knight (d4/e4/d5/e5) covers up to 8 squares. A knight on the rim covers only 2–4. Repositioning takes multiple moves, so get central early and keep it there.",
      },
      {
        label: "Extra pawns matter more than in bishop endings",
        text: "There's no 'wrong-colour' draw trick in knight endings. Every extra pawn is a genuine winning attempt. An extra passed pawn with knight support is usually decisive — push it while the knight covers key blocking squares. Trade your worst pawn for your opponent's best to simplify.",
      },
      {
        label: "Knight vs. lone pawn (draw territory)",
        text: "A lone knight usually draws against a single connected pawn pair — it can sacrifice itself to force stalemate or permanently circle the pawn. Don't assume a single pawn advantage wins automatically. Winning requires the king in front of the pawn AND the knight actively cutting off the enemy king.",
      },
    ],
    tip: "Centralise the knight immediately — a knight on the rim is dim, especially in endgames.",
    tipIcon: "♞",
  },
  kingsideAttack: {
    headline: "King Safety",
    intro:
      "An exposed king is a target — in the middlegame, in the endgame, always.",
    steps: [
      {
        label: "How king safety breaks down",
        text: "Three main causes: (1) delaying castling too long, allowing a central attack before you've castled; (2) pushing kingside pawns without a concrete reason — each pawn move creates a permanent weakness in your king's shelter; (3) trading the bishop that guards your castled king's colour without compensation.",
      },
      {
        label: "Launching a kingside attack",
        text: "Open files and diagonals toward the king (pawn sacrifices, exchanges). Bring at least three pieces toward the king — queen + two others is a minimum. A queen + rook battery on the same file is often immediately decisive. Act with tempo: check, threat, check. Never let the opponent consolidate.",
      },
      {
        label: "Count attackers vs. defenders",
        text: "Before sacrificing material to open the king, count: how many of your pieces are attacking the king's zone, and how many pieces are defending it? If you outnumber the defenders by 2 or more, there's usually a breakthrough. If it's equal, look for deflection or a forcing sequence to tip the balance.",
      },
    ],
    tip: "Count the attackers vs defenders near the king before committing to any sacrifice.",
    tipIcon: "🔥",
  },
  default: {
    headline: "Chess Fundamentals",
    intro:
      "Great chess comes from great habits, applied consistently on every single move.",
    steps: [
      {
        label: "Check for threats first",
        text: "Before deciding your own move, always ask: what is my opponent threatening? Hanging pieces, forks, checks, and incoming attacks must be identified before planning your own. Most tactical disasters happen because this question was skipped entirely.",
      },
      {
        label: "The three opening principles",
        text: "Develop a piece every move (get pieces off the back rank), control the center (e4/d4/e5/d5 are the key squares), and castle early for king safety. These three principles apply from move 1 through move 15 and eliminate most opening mistakes at every level.",
      },
      {
        label: "The blunder check",
        text: "After finding your move but BEFORE playing it, run a 5-second safety check: Does this move leave any of my pieces hanging? Does it walk into a fork, pin, or discovered attack? Does my opponent have a forcing response? This single habit eliminates most blunders and is the fastest path to rating improvement.",
      },
    ],
    tip: "Before every move: check for opponent threats, verify your pieces are safe, then play.",
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
    tacticsTheme: conceptKey === "default" ? "hangingPiece" : conceptKey,
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
  const [page, setPage] = useState(0);
  const totalPages = body.steps.length;
  const isLast = page === totalPages - 1;
  const step = body.steps[page];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      {/* Icon + intro — only on first page */}
      {page === 0 && (
        <div className="text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.05] text-5xl ring-1 ring-white/[0.08]">
            {body.tipIcon}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {body.headline}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{body.intro}</p>
        </div>
      )}

      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5">
        {body.steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= page ? "w-5 bg-violet-500" : "w-1.5 bg-white/[0.12]"
            }`}
          />
        ))}
      </div>

      {/* Current step card */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-6">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600/80 text-xs font-black text-white">
            {page + 1}
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-violet-400">
            {step.label}
          </p>
        </div>
        <p className="text-[15px] leading-7 text-slate-200">{step.text}</p>
      </div>

      {/* Key principle — only on last page */}
      {isLast && (
        <div className="flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] px-5 py-4">
          <span className="mt-0.5 shrink-0 text-xl">💡</span>
          <div>
            <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-amber-400">
              Key Principle
            </p>
            <p className="text-sm leading-relaxed text-amber-100/70">
              {body.tip}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {page > 0 && (
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3.5 text-sm font-semibold text-slate-400 hover:bg-white/[0.07] transition-colors"
          >
            ← Back
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (isLast) onComplete();
            else setPage((p) => p + 1);
          }}
          className="flex-1 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-3.5 text-base font-bold text-white shadow-xl shadow-purple-500/20 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          {isLast ? "Got it →" : `Next: ${body.steps[page + 1]?.label} →`}
        </button>
      </div>
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
      if (correct) playSound("correct");
      else playSound("wrong");

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
      }, 1400);

      return true;
    },
    [pos, status, idx, positions, onComplete],
  );

  if (!pos) return null;

  const toMove = pos.fen.split(" ")[1] === "b" ? "Black" : "White";

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      {/* Instruction */}
      <div className="text-center">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-slate-500">
          {toMove} to move
        </p>
        <p className="mt-0.5 text-base font-bold text-white">
          Find the best move
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {positions.map((_, i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              i < idx
                ? "bg-emerald-500 scale-100"
                : i === idx
                  ? "bg-purple-400 scale-110"
                  : "bg-white/[0.12]"
            }`}
          />
        ))}
      </div>

      {/* Board */}
      <div
        className={`overflow-hidden rounded-2xl ring-2 transition-all duration-300 ${
          status === "correct"
            ? "ring-emerald-500/60"
            : status === "wrong"
              ? "ring-red-500/50"
              : "ring-white/[0.06]"
        }`}
      >
        <Chessboard
          position={fen}
          boardOrientation={orientation}
          onPieceDrop={handleDrop}
          arePiecesDraggable={status === "idle"}
        />
      </div>

      {/* Feedback */}
      <div
        className={`rounded-2xl px-5 py-3.5 text-center text-sm font-semibold transition-all duration-300 ${
          status === "correct"
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : status === "wrong"
              ? "border border-red-500/30 bg-red-500/10 text-red-300"
              : "border border-white/[0.06] bg-white/[0.03] text-slate-500"
        }`}
      >
        {status === "correct"
          ? "✓ Correct!"
          : status === "wrong"
            ? "✗ Not the best move — try again"
            : (pos.label ?? "Drag a piece to make your move")}
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={onComplete}
        className="mx-auto text-xs text-slate-700 underline-offset-2 hover:text-slate-500"
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
    fetch(`/api/puzzles?themes=${theme}&count=3`)
      .then((r) => r.json())
      .then((data) => {
        const puzzles = data.puzzles ?? [];
        // Lichess returns { game: { pgn }, puzzle: { initialPly, solution } }
        // Derive FEN by replaying the PGN up to initialPly half-moves.
        const drills: DrillPosition[] = [];
        for (const p of puzzles) {
          try {
            const pgn: string = p.game?.pgn ?? "";
            const initialPly: number = p.puzzle?.initialPly ?? 0;
            const solution: string[] = p.puzzle?.solution ?? [];
            if (!pgn || !solution.length) continue;

            const game = new Chess();
            game.loadPgn(pgn);
            const sanMoves = game.history();

            const board = new Chess();
            for (let i = 0; i < initialPly && i < sanMoves.length; i++) {
              board.move(sanMoves[i]);
            }
            const fen = board.fen();
            const bestMove = solution[0]; // UCI like "e2e4"

            if (fen && bestMove) {
              drills.push({
                fen,
                bestMove,
                label: `${THEME_DISPLAY[theme] ?? theme} puzzle`,
              });
            }
          } catch {
            // skip malformed puzzle
          }
        }
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
  const TYPE_COLOR: Record<StepType, string> = {
    concept: "bg-violet-500",
    tactics: "bg-red-500",
    blunder: "bg-amber-500",
    endgame: "bg-cyan-500",
    quiz: "bg-emerald-500",
    memory: "bg-indigo-400",
  };

  return (
    <div className="mb-8">
      {/* Segment progress bar */}
      <div className="flex gap-1.5 mb-5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < stepIndex
                ? TYPE_COLOR[step.type]
                : i === stepIndex - 1
                  ? TYPE_COLOR[step.type] + " opacity-90"
                  : "bg-white/[0.08]"
            }`}
          />
        ))}
      </div>
      {/* Step type badge + title */}
      <div className="flex items-center gap-3">
        <span
          className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white ${TYPE_COLOR[step.type]}`}
        >
          {STEP_TYPE_LABELS[step.type]}
        </span>
        <h2 className="text-lg font-bold text-white leading-tight">
          {step.title}
        </h2>
      </div>
      {step.subtitle && (
        <p className="mt-1.5 ml-0 text-sm text-slate-500">{step.subtitle}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Path Overview Screen                                            */
/* ─────────────────────────────────────────────────────────────── */

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
  const TYPE_DOT: Record<StepType, string> = {
    concept: "bg-violet-500",
    tactics: "bg-red-500",
    blunder: "bg-amber-500",
    endgame: "bg-cyan-500",
    quiz: "bg-emerald-500",
    memory: "bg-indigo-400",
  };

  return (
    <div className="mx-auto max-w-md space-y-7">
      {/* Hero */}
      <div className="space-y-2 pt-2 text-center">
        <p className="text-[11px] font-black uppercase tracking--widest text-purple-400">
          ✦ Your lesson for today
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white">
          {username ? `${username}'s Path` : "Daily Path"}
        </h1>
        <p className="text-sm text-slate-500">
          {steps.length} steps · ~10 min · personalised
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5"
          >
            <div
              className={`h-8 w-8 shrink-0 rounded-full ${TYPE_DOT[step.type]} flex items-center justify-center text-xs font-black text-white`}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {step.title}
              </p>
              <p className="truncate text-[11px] text-slate-600">
                {step.subtitle}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-600">
              {STEP_TYPE_LABELS[step.type]}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onStart}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-4 text-base font-bold text-white shadow-2xl shadow-purple-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
      >
        Start Lesson →
      </button>

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
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-6xl shadow-2xl shadow-amber-500/30">
        🏆
      </div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white">
          Lesson Complete!
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          You finished {total} steps. Come back tomorrow for a new path.
        </p>
      </div>
      <div className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-4">
        <p className="text-sm font-black text-emerald-400">+10 coins earned</p>
        <p className="mt-0.5 text-[11px] text-emerald-300/50">
          Keep the streak going — practice daily
        </p>
      </div>
      <div className="flex w-full flex-col gap-2.5">
        <button
          type="button"
          onClick={onRestart}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 py-4 text-sm font-bold text-white hover:brightness-110"
        >
          Do Another Path →
        </button>
        <Link
          href="/train"
          className="block w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] py-3.5 text-sm font-semibold text-slate-400 hover:bg-white/[0.05] transition-colors"
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
    setLoadingReports(true); // ensure spinner shows while fetching
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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top chrome — back + username */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.05] bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link
          href="/train"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Exit
        </Link>

        <span className="text-xs font-bold tracking-widest text-slate-600 uppercase">
          Learn
        </span>

        {/* Username selector */}
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
              <span className="text-slate-600">{selectedUser}</span>
            )}
          </div>
        )}
        {reports.length === 0 && <div className="w-16" />}
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14">
        {/* Guest nudge */}
        {!authenticated && (
          <div className="mb-8 flex items-center justify-between gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] px-4 py-3">
            <p className="text-xs text-purple-300/60">
              Sign in & save a scan to personalise your path.
            </p>
            <Link
              href="/auth/signin"
              className="shrink-0 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:brightness-110"
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
              <ConceptCard
                body={currentStep.conceptBody}
                onComplete={advance}
              />
            )}

            {currentStep.type === "tactics" && (
              <TacticsStep
                theme={currentStep.tacticsTheme ?? "fork"}
                onComplete={advance}
              />
            )}

            {(currentStep.type === "blunder" ||
              currentStep.type === "endgame") &&
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
                  onComplete={(_correct) => {
                    // ChessQuiz plays sound internally — don't double-play
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
    </div>
  );
}
