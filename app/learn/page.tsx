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
  QUIZ_BANK,
  type QuizQuestion,
} from "@/components/chess-quiz";
import { PieceMemory, type MemoryPosition } from "@/components/piece-memory";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { Chess } from "chess.js";
import { playSound, preloadSounds } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import { useBoardSize } from "@/lib/use-board-size";

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
  gmGame?: {
    players: string; // e.g. "Kasparov vs Topalov"
    event: string; // e.g. "Wijk aan Zee, 1999"
    story: string; // 2-3 sentence narrative about the game
    motifDescription: string; // what the motif-specific moment was
    fen?: string; // position where the motif occurred (optional visual)
  };
};

type DrillPosition = {
  fen: string;
  bestMove: string;
  label: string;
  cpLoss?: number;
};

type WeaknessTopic = {
  key: string;
  label: string;
  icon: string;
  description: string;
  severity: "high" | "medium" | "low" | "universal";
  lichessTheme: string;
  conceptKey: string;
  ownPositions: DrillPosition[];
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
    gmGame: {
      players: "Mikhail Tal vs Vasily Smyslov",
      event: "Candidates Tournament, 1959",
      story:
        "Tal, the 'Magician from Riga', used breathtaking sacrifices and unexpected forks throughout the 1959 Candidates to become the youngest World Champion. Against Smyslov, his knight leapt to c7 attacking both rooks simultaneously — Smyslov could save only one.",
      motifDescription:
        "Tal's knight on c7 forked both rooks, winning the exchange immediately.",
      fen: "1r3k2/8/8/2N5/8/8/8/4K3 w - - 0 1",
    },
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
    gmGame: {
      players: "Bobby Fischer vs Robert Byrne",
      event: "US Championship, New York, 1963",
      story:
        "Fischer demolished Byrne in just 21 moves, delivering what is often called the greatest game played in the US Championship. A bishop pin on Byrne's knight meant the knight couldn't recapture, letting Fischer's combination crash through before Byrne could unravel.",
      motifDescription:
        "Fischer used a bishop pin on the d2-knight to launch a brilliant queen sacrifice — with the knight pinned, Byrne's defence collapsed entirely.",
      fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    },
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
    gmGame: {
      players: "Garry Kasparov vs Viswanathan Anand",
      event: "PCA World Championship, New York, 1995",
      story:
        "In Game 10, Kasparov demonstrated perfect endgame technique in a rook ending. But the tactical seed was a rook skewer in the middlegame — his rook attacked Anand's queen along the e-file, forcing it to step aside and exposing the rook behind it.",
      motifDescription:
        "Kasparov's rook skewered Anand's queen along the open e-file, winning the rook that had been sheltering behind it.",
    },
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
    gmGame: {
      players: "Garry Kasparov vs Veselin Topalov",
      event: "Wijk aan Zee, 1999",
      story:
        "Widely voted the greatest game ever played, Kasparov sacrificed his rook twice in 20 moves in what became known as the 'Immortal Game' of the modern era. On move 20, Kasparov played Rxd4, a discovered attack — his bishop on h5 suddenly had a clear diagonal to g6, threatening devastating discovered checks that Topalov had no answer to.",
      motifDescription:
        "Rxd4 cleared the diagonal for Kasparov's bishop, unleashing a discovered attack that Topalov could not survive.",
    },
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
    gmGame: {
      players: "Bobby Fischer vs Donald Byrne",
      event: "Rosenwald Memorial Tournament, New York, 1956",
      story:
        "Playing at just 13 years old, Fischer delivered 'The Game of the Century'. After a stunning queen sacrifice, Fischer used a rook to invade the back rank — Byrne's king was trapped behind its own pawns, and there was simply no escape from the back-rank threat.",
      motifDescription:
        "Fischer's rook reached Byrne's back rank, and with the king imprisoned by its own un-moved pawns, checkmate was forced in just a few more moves.",
      fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    },
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
    gmGame: {
      players: "Paul Morphy vs Duke of Brunswick & Count Isouard",
      event: "Paris Opera, 1858",
      story:
        "The 'Opera Game' is the most celebrated attacking game from the 19th century. Morphy, playing against two noblemen at the opera, used a deflection sacrifice on move 16 — Qb8+!! — to drag the rook away from defending the back rank, after which checkmate was unstoppable.",
      motifDescription:
        "Morphy's Qb8+! forced Black's rook to capture, deflecting it from its defensive post and clearing the way for a back-rank mate.",
    },
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
    gmGame: {
      players: "Magnus Carlsen vs Levon Aronian",
      event: "Wijk aan Zee, 2012",
      story:
        "Carlsen, at the peak of his powers, built up a monster endgame advantage only to blunder a piece in time trouble — leaving a rook hanging on a7. Aronian snapped it up immediately with Ra8xa7, winning decisive material. It was a rare lapse that cost Carlsen the game while he was completely winning.",
      motifDescription:
        "Carlsen left his rook on a7 undefended. Aronian simply took it — a reminder that even World Champions must check for hanging pieces on every move.",
    },
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
    gmGame: {
      players: "Anatoly Karpov vs Viktor Korchnoi",
      event: "World Championship Match, Baguio, 1978",
      story:
        "The 1978 World Championship match was an epic 32-game struggle. Karpov won several critical rook endings with the principle of placing his rook behind the passed pawn — squeezing Korchnoi with the Lucena technique to convert a single passed pawn into the win.",
      motifDescription:
        "Karpov placed his rook behind his passed d-pawn, and as the pawn advanced, his rook gained energy while Korchnoi's rook was pinned in front — the classic winning algorithm.",
    },
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
    gmGame: {
      players: "José Raúl Capablanca vs Frank Marshall",
      event: "New York, 1918",
      story:
        "Capablanca was one of chess history's greatest endgame artists. Against Marshall, he entered a pawn endgame that looked drawish to observers but was anything but. Capa activated his king immediately and used precise opposition to queen a pawn while Marshall's passive king could do nothing.",
      motifDescription:
        "Capablanca marched his king to the center to seize opposition. Marshall's king was driven back, and Capablanca's passed pawn promoted before Marshall could react.",
    },
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
    gmGame: {
      players: "Magnus Carlsen vs Sergey Karjakin",
      event: "World Championship Match, New York, 2016",
      story:
        "After 12 drawn classical games, Carlsen and Karjakin went to tiebreaks. In one of the tensest moments, Carlsen held a queen-and-pawn advantage but Karjakin fought back with perpetual check threats. Carlsen found the precise king march to a safe haven, converting the point and retaining the title.",
      motifDescription:
        "Carlsen shielded his king from perpetual check by advancing it along the queenside, blocking Karjakin's queen out. The stalemate trap was carefully avoided, and the pawn promoted.",
    },
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
    gmGame: {
      players: "Akiba Rubinstein vs Georg Salwe",
      event: "Łódź, 1908",
      story:
        "Rubinstein was the undisputed king of rook endgames but his technique in bishop endings was equally profound. In this game, he won from opposite-coloured bishops by creating a passed pawn his bishop could support while Salwe's bishop was completely unable to blockade — a masterclass in pawn placement.",
      motifDescription:
        "Rubinstein placed his pawns on squares his bishop covered, forcing Salwe's bishop into total passivity and pushing the pawn through.",
    },
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
    gmGame: {
      players: "Tigran Petrosian vs Samuel Reshevsky",
      event: "Zurich Candidates Tournament, 1953",
      story:
        "Petrosian, the master of prophylaxis and piece manoeuvres, outplayed Reshevsky in a knight-and-pawn ending. His knight was centralised on e5 for most of the endgame, controlling critical squares, while Reshevsky's knight drifted to the rim and became purely passive — a textbook demonstration of 'a knight on the rim is dim'.",
      motifDescription:
        "Petrosian's centralised knight on e5 dominated the board. Reshevsky's knight, stranded on h6, could not participate in either attack or defense.",
    },
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
    gmGame: {
      players: "Garry Kasparov vs Anatoly Karpov",
      event: "World Championship Match, Moscow, 1985",
      story:
        "Kasparov's legendary Game 24 to clinch the 1985 World Championship title was a kingside attack masterpiece. With three pieces bearing down on Karpov's castled king, Kasparov sacrificed a rook on f6 to rip open the king shelter, and Karpov's defenses crumbled with nowhere to run.",
      motifDescription:
        "Kasparov counted 4 attackers vs 2 defenders on Karpov's king zone. The rook sacrifice on f6 opened lines and unleashed a decisive mating attack.",
    },
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
/*  Helpers                                                         */
/* ─────────────────────────────────────────────────────────────── */

function parseUci(move: string) {
  return {
    from: move.slice(0, 2) as CbSquare,
    to: move.slice(2, 4) as CbSquare,
    promotion: (move.slice(4, 5) || undefined) as
      | "q"
      | "r"
      | "b"
      | "n"
      | undefined,
  };
}

/* Small ✓/✗ badge positioned over the target square */
function MoveIndicator({
  square,
  type,
  orientation,
  boardSize,
}: {
  square: string;
  type: "correct" | "wrong";
  orientation: "white" | "black";
  boardSize: number;
}) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  const sqSize = boardSize / 8;
  const x = orientation === "white" ? file * sqSize : (7 - file) * sqSize;
  const y = orientation === "white" ? (7 - rank) * sqSize : rank * sqSize;
  const size = Math.max(18, Math.round(sqSize * 0.36));
  return (
    <div
      className="pointer-events-none absolute z-20 flex items-center justify-center rounded-full font-bold shadow-lg"
      style={{
        left: x + sqSize - size - 2,
        top: y + 2,
        width: size,
        height: size,
        fontSize: size * 0.65,
        lineHeight: 1,
        backgroundColor: type === "correct" ? "#22c55e" : "#ef4444",
        color: "#fff",
        animation: "indicator-pop 0.15s ease-out",
      }}
    >
      {type === "correct" ? "✓" : "✗"}
    </div>
  );
}

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
/*  Weakness analysis + focused lesson builder                      */
/* ─────────────────────────────────────────────────────────────── */

const UNIVERSAL_TOPICS: WeaknessTopic[] = [
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "hangingPiece",
  "backRankMate",
  "deflection",
  "kingsideAttack",
  "rookEndgame",
  "pawnEndgame",
  "queenEndgame",
  "bishopEndgame",
  "knightEndgame",
].map((key) => ({
  key,
  label: THEME_DISPLAY[key] ?? key,
  icon: CONCEPT_CARDS[key]?.tipIcon ?? "♟",
  description:
    (CONCEPT_CARDS[key]?.intro?.split(" ").slice(0, 7).join(" ") ?? "") + "…",
  severity: "universal" as const,
  lichessTheme: key,
  conceptKey: key,
  ownPositions: [],
}));

/**
 * Themes structurally related to each other —
 * used to surface universal topics likely to help based on the user's weaknesses.
 */
const RELATED_THEMES: Record<string, string[]> = {
  fork: ["discoveredAttack", "deflection", "pin"],
  pin: ["skewer", "fork", "hangingPiece"],
  skewer: ["pin", "fork"],
  discoveredAttack: ["fork", "deflection", "backRankMate"],
  hangingPiece: ["deflection", "fork", "pin"],
  backRankMate: ["kingsideAttack", "deflection"],
  deflection: ["fork", "discoveredAttack", "backRankMate"],
  kingsideAttack: ["backRankMate", "deflection"],
  rookEndgame: ["pawnEndgame", "queenEndgame"],
  pawnEndgame: ["rookEndgame", "bishopEndgame"],
  queenEndgame: ["rookEndgame", "queenEndgame"],
  bishopEndgame: ["pawnEndgame", "knightEndgame"],
  knightEndgame: ["bishopEndgame", "pawnEndgame"],
};

/**
 * Build the full topic list for a user:
 * - Personalised topics from scan data (sorted by severity: high → medium → low)
 * - Universal topics that aren't already covered by personalised ones,
 *   sorted by how related they are to the user's detected weaknesses.
 */
function buildTopics(userReports: SavedReport[]): WeaknessTopic[] {
  const personalised = analyzeWeaknesses(userReports);
  const personalisedKeys = new Set(personalised.map((t) => t.lichessTheme));

  // Score each universal topic by how related it is to the user's weak themes
  const filtered = UNIVERSAL_TOPICS.filter(
    (t) => !personalisedKeys.has(t.lichessTheme),
  );

  const scored = filtered.map((t) => {
    let score = 0;
    for (const weakKey of personalisedKeys) {
      if (RELATED_THEMES[weakKey]?.includes(t.lichessTheme)) score++;
    }
    return { topic: t, score };
  });
  scored.sort((a, b) => b.score - a.score);

  return [...personalised, ...scored.map((s) => s.topic)];
}

function analyzeWeaknesses(reports: SavedReport[]): WeaknessTopic[] {
  const motifCounts = new Map<string, number>();
  const motifPositions = new Map<string, DrillPosition[]>();

  for (const r of reports) {
    for (const t of r.missedTactics ?? []) {
      for (const tag of t.tags ?? []) {
        const theme = MOTIF_TO_THEME[tag];
        if (!theme) continue;
        motifCounts.set(theme, (motifCounts.get(theme) ?? 0) + 1);
        if (t.cpLoss >= 200 && t.fenBefore && t.bestMove) {
          const arr = motifPositions.get(theme) ?? [];
          arr.push({
            fen: t.fenBefore,
            bestMove: t.bestMove,
            label: `Move ${t.moveNumber}`,
            cpLoss: t.cpLoss,
          });
          motifPositions.set(theme, arr);
        }
      }
    }
  }

  const endgameData = new Map<
    string,
    { total: number; count: number; positions: DrillPosition[] }
  >();
  for (const r of reports) {
    const stats = r.diagnostics?.endgameStats;
    if (stats?.byType) {
      for (const bt of stats.byType) {
        const e = endgameData.get(bt.type) ?? {
          total: 0,
          count: 0,
          positions: [],
        };
        e.total += bt.avgCpLoss * bt.count;
        e.count += bt.count;
        endgameData.set(bt.type, e);
      }
    }
    for (const m of r.diagnostics?.endgameMistakes ?? []) {
      if (m.fenBefore && m.bestMove) {
        const e = endgameData.get(m.endgameType);
        if (e) {
          e.positions.push({
            fen: m.fenBefore,
            bestMove: m.bestMove,
            label: `${m.endgameType} — Move ${m.moveNumber}`,
            cpLoss: m.cpLoss,
          });
        }
      }
    }
  }

  const topics: WeaknessTopic[] = [];

  for (const [theme, count] of motifCounts.entries()) {
    const concept = CONCEPT_CARDS[theme];
    if (!concept) continue;
    const severity: "high" | "medium" | "low" =
      count >= 5 ? "high" : count >= 2 ? "medium" : "low";
    topics.push({
      key: theme,
      label: THEME_DISPLAY[theme] ?? theme,
      icon: concept.tipIcon,
      description: `Missed ${count} time${count !== 1 ? "s" : ""} in your games`,
      severity,
      lichessTheme: theme,
      conceptKey: theme,
      ownPositions: motifPositions.get(theme)?.slice(0, 5) ?? [],
    });
  }

  for (const [type, data] of endgameData.entries()) {
    if (data.count < 1) continue;
    const avgLoss = data.total / data.count;
    if (avgLoss < 30) continue;
    const conceptKey = ENDGAME_TO_CONCEPT[type] ?? "rookEndgame";
    const lichessTheme = ENDGAME_TO_THEME[type] ?? "rookEndgame";
    const concept = CONCEPT_CARDS[conceptKey];
    if (!concept) continue;
    const severity: "high" | "medium" | "low" =
      avgLoss >= 150 ? "high" : avgLoss >= 80 ? "medium" : "low";
    const existing = topics.find((t) => t.conceptKey === conceptKey);
    if (existing) continue; // already added from tactics
    topics.push({
      key: `${conceptKey}_${type}`,
      label: `${type} Endgames`,
      icon: concept.tipIcon,
      description: `Avg ${Math.round(avgLoss)} cp lost in ${type.toLowerCase()} endgames`,
      severity,
      lichessTheme,
      conceptKey,
      ownPositions: data.positions.slice(0, 5),
    });
  }

  const sevOrder = { high: 0, medium: 1, low: 2, universal: 3 };
  topics.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  return topics;
}

/* Maps a concept key to which quiz categories are relevant for it */
const CONCEPT_TO_QUIZ_CATEGORY: Record<string, QuizQuestion["category"][]> = {
  fork: ["tactics"],
  pin: ["tactics"],
  skewer: ["tactics"],
  discoveredAttack: ["tactics"],
  hangingPiece: ["tactics"],
  backRankMate: ["tactics"],
  deflection: ["tactics"],
  kingsideAttack: ["tactics"],
  rookEndgame: ["endgame"],
  pawnEndgame: ["endgame"],
  queenEndgame: ["endgame"],
  bishopEndgame: ["endgame"],
  knightEndgame: ["endgame"],
};

function getTopicQuizQuestion(conceptKey: string, seed: number): QuizQuestion {
  const cats = CONCEPT_TO_QUIZ_CATEGORY[conceptKey];
  const pool = cats
    ? QUIZ_BANK.filter((q) => cats.includes(q.category))
    : QUIZ_BANK;
  const bank = pool.length > 0 ? pool : QUIZ_BANK;
  return bank[Math.abs(seed) % bank.length];
}

function buildFocusedLesson(
  topic: WeaknessTopic,
  quizQs: QuizQuestion[],
  seed: number,
): LessonStep[] {
  const steps: LessonStep[] = [];
  const concept = CONCEPT_CARDS[topic.conceptKey] ?? CONCEPT_CARDS.default;

  // Step 1: Concept lesson
  steps.push({
    id: `concept-${seed}`,
    type: "concept",
    title: concept.headline,
    subtitle:
      topic.severity !== "universal"
        ? topic.description
        : "Master this pattern",
    icon: topic.icon,
    conceptBody: concept,
  });

  // Step 2: Own-game positions (shown right after theory for immediate relevance)
  if (topic.ownPositions.length > 0) {
    steps.push({
      id: `own-${seed}`,
      type: "blunder",
      title: "Spot It in Your Game",
      subtitle: "Find the move you missed in a real game",
      icon: "🔍",
      drillPositions: topic.ownPositions,
    });
  }

  // Step 3: Lichess puzzles on this theme
  steps.push({
    id: `tactics-${seed}`,
    type: "tactics",
    title: `${topic.label} Drill`,
    subtitle: "Solve 3 puzzles on this pattern",
    icon: "🎯",
    tacticsTheme: topic.lichessTheme,
  });

  // Step 4: Quiz — filtered to this topic's category
  const q = getTopicQuizQuestion(topic.conceptKey, seed);
  steps.push({
    id: `quiz-${seed}`,
    type: "quiz",
    title: "Knowledge Check",
    subtitle: "Test what you just learned",
    icon: "🧠",
    quizQuestion: q,
  });

  return steps;
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
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const { size: boardSize } = useBoardSize(320);
  const [page, setPage] = useState(0);
  // Extra "GM Game" page if we have gmGame data
  const hasGmGame = !!body.gmGame;
  const totalPages = body.steps.length + (hasGmGame ? 1 : 0);
  const isGmPage = hasGmGame && page === body.steps.length;
  const isLast = page === totalPages - 1;
  const step = !isGmPage ? body.steps[page] : null;

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
        {Array.from({ length: totalPages }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < page
                ? "w-5 bg-violet-500"
                : i === page
                  ? "w-5 bg-violet-400"
                  : "w-1.5 bg-white/[0.12]"
            }`}
          />
        ))}
      </div>

      {/* Theory step card */}
      {step && (
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
      )}

      {/* GM Game showcase page */}
      {isGmPage && body.gmGame && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] overflow-hidden">
          {/* Header */}
          <div className="border-b border-amber-500/10 px-5 py-3.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-1">
              ♟ GM Masterclass
            </p>
            <p className="font-bold text-white text-sm">
              {body.gmGame.players}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {body.gmGame.event}
            </p>
          </div>
          {/* Story */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm leading-relaxed text-slate-300">
              {body.gmGame.story}
            </p>
            {/* Position board */}
            {body.gmGame.fen && (
              <div
                className="overflow-hidden rounded-xl mx-auto"
                style={{ width: boardSize, maxWidth: "100%" }}
              >
                <Chessboard
                  position={body.gmGame.fen}
                  arePiecesDraggable={false}
                  boardOrientation="white"
                  boardWidth={boardSize}
                  customDarkSquareStyle={{
                    backgroundColor: boardTheme.darkSquare,
                  }}
                  customLightSquareStyle={{
                    backgroundColor: boardTheme.lightSquare,
                  }}
                  customPieces={customPieces}
                />
              </div>
            )}
            {/* Motif callout */}
            <div className="flex gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3">
              <span className="shrink-0 text-base">{body.tipIcon}</span>
              <p className="text-[13px] leading-relaxed text-violet-200/80">
                {body.gmGame.motifDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key principle — only on last theory page (just before GM page, or last if no GM) */}
      {!isGmPage && page === body.steps.length - 1 && (
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
          {isLast
            ? "Got it → Start Puzzles"
            : isGmPage
              ? "Done — Start Puzzles →"
              : page === body.steps.length - 1 && hasGmGame
                ? `See GM Example →`
                : `Next: ${body.steps[page + 1]?.label} →`}
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
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const { ref: boardRef, size: boardSize } = useBoardSize(480);
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [fen, setFen] = useState<string>(positions[0]?.fen ?? "");
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [legalMoveSqs, setLegalMoveSqs] = useState<string[]>([]);
  const [moveIndicator, setMoveIndicator] = useState<{
    square: string;
    type: "correct" | "wrong";
  } | null>(null);
  const completedRef = useRef(false);

  const pos = positions[idx] ?? null;

  // Reset hint/attempts when position changes
  useEffect(() => {
    setAttempts(0);
    setShowHint(false);
  }, [idx]);

  const orientation = useMemo<"white" | "black">(() => {
    const raw = pos?.fen ?? "";
    return raw.split(" ")[1] === "b" ? "black" : "white";
  }, [pos?.fen]);

  const hintSquare = pos?.bestMove?.slice(0, 2) ?? null;

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (showHint && hintSquare) {
      styles[hintSquare] = {
        backgroundColor: "rgba(251, 191, 36, 0.45)",
        borderRadius: "4px",
      };
    }
    if (selected) {
      styles[selected] = { backgroundColor: "rgba(255,210,0,0.45)" };
    }
    // Legal move dots
    if (selected && status === "idle") {
      try {
        const chess = new Chess(pos?.fen ?? fen);
        for (const sq of legalMoveSqs) {
          const hasPiece = chess.get(sq as Parameters<typeof chess.get>[0]);
          styles[sq] = hasPiece
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
      } catch {
        /* ignore */
      }
    }
    return styles;
  }, [showHint, hintSquare, selected, legalMoveSqs, status, pos?.fen, fen]);

  const advanceOrComplete = useCallback(
    (nextIdx: number) => {
      if (nextIdx >= positions.length) {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      } else {
        setIdx(nextIdx);
        setFen(positions[nextIdx].fen);
        setStatus("idle");
      }
    },
    [positions, onComplete],
  );

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
      setSelected(null);
      setLegalMoveSqs([]);
      setMoveIndicator({ square: tgt, type: correct ? "correct" : "wrong" });

      if (correct) {
        playSound("correct");
        setTimeout(() => {
          setMoveIndicator(null);
          advanceOrComplete(idx + 1);
        }, 1400);
      } else {
        playSound("wrong");
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 2) setShowHint(true);
        setTimeout(() => {
          setMoveIndicator(null);
          setFen(pos.fen);
          setStatus("idle");
        }, 1000);
      }

      return true;
    },
    [pos, status, idx, attempts, advanceOrComplete],
  );

  const handleShowAnswer = useCallback(() => {
    if (!pos) return;
    const chess = new Chess(pos.fen);
    try {
      const best = pos.bestMove ?? "";
      chess.move({
        from: best.slice(0, 2),
        to: best.slice(2, 4),
        promotion: "q",
      });
      setFen(chess.fen());
      setStatus("correct");
      playSound("correct");
      setTimeout(() => advanceOrComplete(idx + 1), 1800);
    } catch {
      advanceOrComplete(idx + 1);
    }
  }, [pos, idx, advanceOrComplete]);

  const handleSquareClick = useCallback(
    (square: string) => {
      if (!pos || status !== "idle") return;
      if (!selected) {
        const chess = new Chess(pos.fen);
        const piece = chess.get(square as Parameters<typeof chess.get>[0]);
        if (piece && piece.color === chess.turn()) {
          setSelected(square);
          const moves = chess.moves({
            square: square as Parameters<typeof chess.moves>[0]["square"],
            verbose: true,
          });
          setLegalMoveSqs(moves.map((m) => m.to));
        }
      } else {
        if (square === selected) {
          setSelected(null);
          setLegalMoveSqs([]);
          return;
        }
        const moved = handleDrop(selected, square);
        if (!moved) {
          const chess = new Chess(pos.fen);
          const piece = chess.get(square as Parameters<typeof chess.get>[0]);
          if (piece && piece.color === chess.turn()) {
            setSelected(square);
            const moves = chess.moves({
              square: square as Parameters<typeof chess.moves>[0]["square"],
              verbose: true,
            });
            setLegalMoveSqs(moves.map((m) => m.to));
            return;
          }
        }
        setSelected(null);
        setLegalMoveSqs([]);
      }
    },
    [pos, status, selected, handleDrop],
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
        ref={boardRef}
        className={`relative overflow-hidden rounded-2xl ring-2 transition-all duration-300 ${
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
          onSquareClick={handleSquareClick}
          arePiecesDraggable={status === "idle"}
          customSquareStyles={customSquareStyles}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          customPieces={customPieces}
        />
        {moveIndicator && (
          <MoveIndicator
            square={moveIndicator.square}
            type={moveIndicator.type}
            orientation={orientation}
            boardSize={boardSize}
          />
        )}
      </div>

      {/* Feedback */}
      <div
        className={`rounded-2xl px-5 py-3.5 text-center text-sm font-semibold transition-all duration-300 ${
          status === "correct"
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : status === "wrong"
              ? "border border-red-500/30 bg-red-500/10 text-red-300"
              : showHint
                ? "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border border-white/[0.06] bg-white/[0.03] text-slate-500"
        }`}
      >
        {status === "correct"
          ? "✓ Correct!"
          : status === "wrong"
            ? attempts >= 2
              ? "Keep trying — the highlighted piece is the key"
              : "✗ Not the best move — try again"
            : showHint
              ? "💡 Hint: move the highlighted piece"
              : (pos.label ?? "Drag a piece to make your move")}
      </div>

      {/* Hint / Show answer / Skip row */}
      <div className="flex items-center justify-center gap-4">
        {attempts >= 3 && status === "idle" && (
          <button
            type="button"
            onClick={handleShowAnswer}
            className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 transition-all hover:bg-amber-500/20"
          >
            Show answer →
          </button>
        )}
        <button
          type="button"
          onClick={onComplete}
          className="text-xs text-slate-700 underline-offset-2 hover:text-slate-500"
        >
          Skip →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Tactics Step (fetches Lichess puzzles)                          */
/* ─────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────── */
/*  LivePuzzleBoard — plays trigger move, supports multi-move       */
/* ─────────────────────────────────────────────────────────────── */

type LivePuzzleBoardProps = {
  fen: string; // preTriggerFen
  triggerMove: string | null; // UCI move played by opponent before puzzle
  solutionMoves: string[]; // full UCI solution array
  orientation: "white" | "black";
  onSolved: () => void;
  onFailed: () => void;
};

function LivePuzzleBoard({
  fen,
  triggerMove,
  solutionMoves,
  orientation,
  onSolved,
  onFailed,
}: LivePuzzleBoardProps) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const { ref: boardRef, size: boardSize } = useBoardSize(480);
  const [game, setGame] = useState(() => new Chess(fen));
  const [moveIndex, setMoveIndex] = useState(-1); // -1 = waiting for trigger
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">(
    "playing",
  );
  const [attempts, setAttempts] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [opponentLastMove, setOpponentLastMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [legalMoveSqs, setLegalMoveSqs] = useState<string[]>([]);
  const [moveIndicator, setMoveIndicator] = useState<{
    square: string;
    type: "correct" | "wrong";
  } | null>(null);
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    preloadSounds();
    if (!triggerMove) {
      setMoveIndex(0);
      return;
    }
    const parsed = parseUci(triggerMove);
    const timer = setTimeout(() => {
      const newGame = new Chess(fen);
      try {
        newGame.move({
          from: parsed.from,
          to: parsed.to,
          promotion: parsed.promotion,
        });
        playSound("move");
        setGame(new Chess(newGame.fen()));
        setOpponentLastMove({ from: parsed.from, to: parsed.to });
      } catch {
        /* skip bad trigger */
      }
      setMoveIndex(0);
    }, 700);
    return () => clearTimeout(timer);
  }, [fen, triggerMove]);

  const hintSquare =
    showHint && moveIndex >= 0 && moveIndex < solutionMoves.length
      ? solutionMoves[moveIndex].slice(0, 2)
      : null;

  const handleDrop = useCallback(
    (from: CbSquare, to: CbSquare): boolean => {
      if (status !== "playing" || moveIndex < 0) return false;
      const expected = solutionMoves[moveIndex];
      if (!expected) return false;

      const exp = parseUci(expected);
      if (from === exp.from && to === exp.to) {
        const promotion = exp.promotion ?? "q";
        const newGame = new Chess(game.fen());
        try {
          newGame.move({ from, to, promotion });
        } catch {
          return false;
        }
        playSound("correct");
        setGame(new Chess(newGame.fen()));
        setAttempts(0);
        setShowHint(false);
        setSelected(null);
        setLegalMoveSqs([]);
        setMoveIndicator({ square: to, type: "correct" });

        const nextIndex = moveIndex + 1;
        if (nextIndex >= solutionMoves.length) {
          setStatus("correct");
          setTimeout(onSolved, 800);
          return true;
        }

        // Auto-play opponent's response
        const oppMove = solutionMoves[nextIndex];
        const oppParsed = parseUci(oppMove);
        setTimeout(() => {
          setMoveIndicator(null);
          const g = new Chess(newGame.fen());
          try {
            g.move({
              from: oppParsed.from,
              to: oppParsed.to,
              promotion: oppParsed.promotion,
            });
            playSound(g.isCheck() ? "check" : "move");
            setGame(new Chess(g.fen()));
            setOpponentLastMove({ from: oppParsed.from, to: oppParsed.to });
            setMoveIndex(nextIndex + 1);
          } catch {
            setStatus("correct");
            onSolved();
          }
        }, 500);
        setMoveIndex(nextIndex);
        return true;
      }

      // Wrong
      playSound("wrong");
      setMoveIndicator({ square: to, type: "wrong" });
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts >= 2) setShowHint(true);
      setTimeout(() => setShaking(false), 400);
      setTimeout(() => setMoveIndicator(null), 800);

      if (newAttempts >= MAX_ATTEMPTS) {
        setStatus("wrong");
        // Show the correct move
        const cp = parseUci(expected);
        setTimeout(() => {
          const g = new Chess(game.fen());
          try {
            g.move({
              from: cp.from,
              to: cp.to,
              promotion: cp.promotion ?? "q",
            });
            setGame(new Chess(g.fen()));
          } catch {}
        }, 400);
        setTimeout(() => onFailed(), 2500);
      }
      return false;
    },
    [game, moveIndex, solutionMoves, status, attempts, onSolved, onFailed],
  );

  const handleSquareClick = useCallback(
    (square: string) => {
      if (status !== "playing" || moveIndex < 0) return;
      if (!selected) {
        const piece = game.get(square as Parameters<typeof game.get>[0]);
        if (piece && piece.color === game.turn()) {
          setSelected(square);
          const moves = game.moves({
            square: square as Parameters<typeof game.moves>[0]["square"],
            verbose: true,
          });
          setLegalMoveSqs(moves.map((m) => m.to));
        }
      } else {
        if (square === selected) {
          setSelected(null);
          setLegalMoveSqs([]);
          return;
        }
        const moved = handleDrop(selected as CbSquare, square as CbSquare);
        if (!moved) {
          const piece = game.get(square as Parameters<typeof game.get>[0]);
          if (piece && piece.color === game.turn()) {
            setSelected(square);
            const moves = game.moves({
              square: square as Parameters<typeof game.moves>[0]["square"],
              verbose: true,
            });
            setLegalMoveSqs(moves.map((m) => m.to));
            return;
          }
        }
        setSelected(null);
        setLegalMoveSqs([]);
      }
    },
    [status, moveIndex, selected, game, handleDrop],
  );

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (opponentLastMove && status === "playing") {
    squareStyles[opponentLastMove.from] = {
      backgroundColor: "rgba(255,170,0,0.3)",
    };
    squareStyles[opponentLastMove.to] = {
      backgroundColor: "rgba(255,170,0,0.45)",
    };
  }
  if (hintSquare) {
    squareStyles[hintSquare] = {
      boxShadow: "inset 0 0 18px 5px rgba(34,197,94,0.5)",
      borderRadius: "4px",
    };
  }
  if (status === "correct") {
    const last = solutionMoves[solutionMoves.length - 1];
    if (last)
      squareStyles[last.slice(2, 4)] = {
        boxShadow: "inset 0 0 18px 5px rgba(34,197,94,0.6)",
      };
  }
  if (status === "wrong") {
    const exp = solutionMoves[moveIndex];
    if (exp) {
      squareStyles[exp.slice(0, 2)] = {
        boxShadow: "inset 0 0 14px 4px rgba(239,68,68,0.5)",
      };
      squareStyles[exp.slice(2, 4)] = {
        boxShadow: "inset 0 0 14px 4px rgba(34,197,94,0.5)",
      };
    }
  }
  if (selected) {
    squareStyles[selected] = { backgroundColor: "rgba(255,210,0,0.45)" };
  }
  // Legal move dots
  if (selected && status === "playing") {
    try {
      for (const sq of legalMoveSqs) {
        const hasPiece = game.get(sq as Parameters<typeof game.get>[0]);
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
    } catch {
      /* ignore */
    }
  }

  const toMove = orientation === "white" ? "White" : "Black";
  const statusText =
    status === "correct"
      ? "✓ Correct!"
      : status === "wrong"
        ? "Answer shown — watch the move"
        : moveIndex < 0
          ? "Waiting for opponent…"
          : showHint
            ? "💡 Move the highlighted piece"
            : `${toMove} to move — find the best continuation`;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-3">
      <p
        className={`text-center text-sm font-semibold ${
          status === "correct"
            ? "text-emerald-400"
            : status === "wrong"
              ? "text-red-400"
              : showHint
                ? "text-amber-400"
                : "text-slate-400"
        }`}
      >
        {statusText}
      </p>

      <div
        ref={boardRef}
        className={`relative overflow-hidden rounded-2xl ring-2 transition-all duration-300 ${
          status === "correct"
            ? "ring-emerald-500/50"
            : status === "wrong"
              ? "ring-red-500/40"
              : "ring-white/[0.06]"
        } ${shaking ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
      >
        <Chessboard
          position={game.fen()}
          boardOrientation={orientation}
          onPieceDrop={handleDrop}
          onSquareClick={handleSquareClick}
          arePiecesDraggable={status === "playing" && moveIndex >= 0}
          animationDuration={200}
          customSquareStyles={squareStyles}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          customPieces={customPieces}
        />
        {moveIndicator && (
          <MoveIndicator
            square={moveIndicator.square}
            type={moveIndicator.type}
            orientation={orientation}
            boardSize={boardSize}
          />
        )}
      </div>

      {/* Attempts dots */}
      {status === "playing" && moveIndex >= 0 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i < attempts ? "bg-red-500" : "bg-white/[0.12]"
              }`}
            />
          ))}
          <span className="ml-1 text-[11px] text-slate-600">
            {MAX_ATTEMPTS - attempts} attempt
            {MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} left
          </span>
        </div>
      )}

      {status === "playing" &&
        moveIndex >= 0 &&
        attempts >= MAX_ATTEMPTS - 1 && (
          <p className="text-center text-[11px] text-amber-500/70">
            Last try — hint: move from the highlighted square
          </p>
        )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Tactics Step — fetches Lichess puzzles & runs LivePuzzleBoard   */
/* ─────────────────────────────────────────────────────────────── */

type PuzzleSetup = {
  preTriggerFen: string;
  triggerMove: string | null;
  solutionMoves: string[];
  orientation: "white" | "black";
  theme: string;
};

function TacticsStep({
  theme,
  onComplete,
}: {
  theme: string;
  onComplete: (score: number) => void;
}) {
  const [puzzles, setPuzzles] = useState<PuzzleSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [solved, setSolved] = useState(0);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetch(`/api/puzzles?themes=${theme}&count=3`)
      .then((r) => r.json())
      .then((data) => {
        const raw = data.puzzles ?? [];
        const setups: PuzzleSetup[] = [];
        for (const p of raw) {
          try {
            const pgn: string = p.game?.pgn ?? "";
            const initialPly: number = p.puzzle?.initialPly ?? 0;
            const solution: string[] = p.puzzle?.solution ?? [];
            if (!pgn || solution.length === 0) continue;

            const fullGame = new Chess();
            fullGame.loadPgn(pgn);
            const history = fullGame.history({ verbose: true });

            // Replay up to initialPly to get preTriggerFen
            const board = new Chess();
            for (let i = 0; i < Math.min(initialPly, history.length); i++) {
              board.move(history[i].san);
            }
            const preTriggerFen = board.fen();

            // triggerMove = move AT initialPly (opponent's last move)
            let triggerMove: string | null = null;
            let postTriggerFen = preTriggerFen;
            if (initialPly < history.length) {
              const m = history[initialPly];
              triggerMove = m.from + m.to + (m.promotion ?? "");
              board.move(m.san);
              postTriggerFen = board.fen();
            }

            const orientation: "white" | "black" =
              new Chess(postTriggerFen).turn() === "w" ? "white" : "black";

            setups.push({
              preTriggerFen,
              triggerMove,
              solutionMoves: solution,
              orientation,
              theme: p.matchedTheme ?? theme,
            });
          } catch {
            /* skip malformed */
          }
        }
        setPuzzles(setups);
      })
      .catch(() => setPuzzles([]))
      .finally(() => setLoading(false));
  }, [theme]);

  const advance = useCallback(
    (wasSolved: boolean) => {
      if (wasSolved) setSolved((s) => s + 1);
      setCurrent((c) => {
        if (c + 1 >= puzzles.length) {
          // done — defer to avoid state update during render
          setTimeout(() => onComplete(wasSolved ? solved + 1 : solved), 400);
          return c;
        }
        return c + 1;
      });
    },
    [puzzles.length, solved, onComplete],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="text-sm">Loading puzzles…</p>
      </div>
    );
  }

  if (puzzles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-slate-400 text-sm">
          No puzzles found for this theme right now.
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

  const puzzle = puzzles[current];

  return (
    <div className="flex flex-col gap-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {puzzles.map((_, i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              i < current
                ? "bg-emerald-500"
                : i === current
                  ? "bg-purple-400 scale-110"
                  : "bg-white/[0.12]"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-300">
          🎯 {THEME_DISPLAY[puzzle.theme] ?? puzzle.theme}
        </span>
        <span className="text-xs text-slate-600">
          {current + 1} / {puzzles.length}
        </span>
      </div>

      <LivePuzzleBoard
        key={`${current}-${puzzle.preTriggerFen.slice(0, 20)}`}
        fen={puzzle.preTriggerFen}
        triggerMove={puzzle.triggerMove}
        solutionMoves={puzzle.solutionMoves}
        orientation={puzzle.orientation}
        onSolved={() => advance(true)}
        onFailed={() => advance(false)}
      />

      <button
        type="button"
        onClick={() => advance(false)}
        className="mx-auto text-xs text-slate-700 underline-offset-2 hover:text-slate-500"
      >
        Skip →
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Step Wrapper — progress + header                               */
/* ─────────────────────────────────────────────────────────────── */

const STEP_TYPE_LABELS: Record<StepType, string> = {
  concept: "Learn",
  tactics: "Practice",
  blunder: "Review",
  endgame: "Drill",
  quiz: "Quiz",
  memory: "Memory",
};

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
/*  Topic Picker Screen                                             */
/* ─────────────────────────────────────────────────────────────── */

function TopicPicker({
  topics,
  username,
  onSelect,
}: {
  topics: WeaknessTopic[];
  username: string | null;
  onSelect: (topic: WeaknessTopic) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const scanTopics = topics.filter((t) => t.severity !== "universal");
  const universalTopics = topics.filter((t) => t.severity === "universal");
  // Top 3 universal topics were sorted to be structurally related to the user's weak areas
  const suggestedUniversal =
    scanTopics.length > 0 ? universalTopics.slice(0, 3) : [];
  const otherUniversal =
    scanTopics.length > 0 ? universalTopics.slice(3) : universalTopics;

  const SEVERITY_BADGE: Record<
    "high" | "medium" | "low",
    { label: string; color: string }
  > = {
    high: {
      label: "Weak area",
      color: "border-red-500/30 bg-red-500/10 text-red-400",
    },
    medium: {
      label: "Needs work",
      color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    },
    low: {
      label: "Practice more",
      color: "border-slate-500/30 bg-white/[0.05] text-slate-400",
    },
  };

  const hasRecommended = scanTopics.length > 0 || suggestedUniversal.length > 0;
  const recommendedTopics = [...scanTopics, ...suggestedUniversal];

  return (
    <div className="mx-auto max-w-md space-y-8">
      {/* Header */}
      <div className="pt-2 text-center space-y-1.5">
        <p className="text-[11px] font-black uppercase tracking-widest text-purple-400">
          ✦ Personalised Learning
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Choose a lesson
        </h1>
        {username && (
          <p className="text-sm text-slate-500">
            Tailored to {username}&apos;s games
          </p>
        )}
      </div>

      {/* Recommended section */}
      {hasRecommended && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-0.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-600 text-[9px] font-black text-white">
              ✦
            </span>
            <p className="text-[11px] font-black uppercase tracking-widest text-purple-400">
              Recommended for you
            </p>
          </div>
          {recommendedTopics.map((topic, i) => {
            const isPersonalised = topic.severity !== "universal";
            const badge = isPersonalised
              ? SEVERITY_BADGE[topic.severity as "high" | "medium" | "low"]
              : null;
            return (
              <button
                key={topic.key}
                type="button"
                onClick={() => onSelect(topic)}
                className="group w-full flex items-center gap-3.5 rounded-2xl border border-purple-500/25 bg-purple-500/[0.06] px-4 py-4 text-left transition-all hover:border-purple-500/50 hover:bg-purple-500/[0.10] active:scale-[0.99]"
              >
                {/* Rank bubble */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600/80 text-sm font-black text-white shadow-lg shadow-purple-500/20">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm">
                      {topic.label}
                    </p>
                    {isPersonalised && badge && (
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    )}
                    {!isPersonalised && (
                      <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-purple-400">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                    {isPersonalised
                      ? topic.description
                      : (CONCEPT_CARDS[topic.conceptKey]?.intro
                          ?.split(" ")
                          .slice(0, 9)
                          .join(" ") ?? "") + "…"}
                  </p>
                </div>
                <span className="text-xl">{topic.icon}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Other lessons */}
      {otherUniversal.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              {hasRecommended ? "Other lessons" : "All lessons"}
            </p>
            {!showAll && otherUniversal.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-[10px] font-semibold text-slate-600 hover:text-slate-400 transition-colors"
              >
                Show all ({otherUniversal.length}) ↓
              </button>
            )}
          </div>
          {(showAll ? otherUniversal : otherUniversal.slice(0, 5)).map(
            (topic) => (
              <button
                key={topic.key}
                type="button"
                onClick={() => onSelect(topic)}
                className="w-full flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04] active:scale-[0.99]"
              >
                <div className="text-xl shrink-0">{topic.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-300 text-sm">
                    {topic.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-1">
                    {(CONCEPT_CARDS[topic.conceptKey]?.intro
                      ?.split(" ")
                      .slice(0, 9)
                      .join(" ") ?? "") + "…"}
                  </p>
                </div>
                <svg
                  className="h-4 w-4 shrink-0 text-slate-700"
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
            ),
          )}
          {!showAll && otherUniversal.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full rounded-2xl border border-white/[0.05] bg-white/[0.01] py-3 text-[12px] font-semibold text-slate-600 hover:text-slate-400 hover:bg-white/[0.03] transition-colors"
            >
              Show {otherUniversal.length - 5} more lessons ↓
            </button>
          )}
        </div>
      )}

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

  // Path state
  const [pathSeed, setPathSeed] = useState(() =>
    Math.floor(Date.now() / 86_400_000),
  );
  const [selectedTopic, setSelectedTopic] = useState<WeaknessTopic | null>(
    null,
  );
  const [phase, setPhase] = useState<"overview" | "active" | "done">(
    "overview",
  );
  const [stepIndex, setStepIndex] = useState(0);

  // Fetch saved reports (guests skip — they get universal topics)
  useEffect(() => {
    if (sessionLoading || !authenticated) {
      setLoadingReports(false);
      return;
    }
    setLoadingReports(true);
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

  const topics = useMemo(() => buildTopics(userReports), [userReports]);

  const steps = useMemo(
    () =>
      selectedTopic ? buildFocusedLesson(selectedTopic, quizQs, pathSeed) : [],
    [selectedTopic, quizQs, pathSeed],
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
    setSelectedTopic(null);
    setPhase("overview");
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
        {phase === "overview" ? (
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
        ) : (
          <button
            type="button"
            onClick={restart}
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
            {phase === "active" ? "Topics" : "Exit"}
          </button>
        )}

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
              Sign in &amp; save a scan to personalise your lessons.
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
        {phase === "done" ? (
          <CompletionScreen stepsCompleted={totalSteps} onRestart={restart} />
        ) : phase === "overview" ? (
          <TopicPicker
            topics={topics}
            username={selectedUser}
            onSelect={(topic) => {
              setSelectedTopic(topic);
              setStepIndex(0);
              setPhase("active");
            }}
          />
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
