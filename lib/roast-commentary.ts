/**
 * Roast Commentary Engine — AnarchyChess / Gotham-style humour
 *
 * Generates contextual, sarcastic commentary based on Stockfish evaluations
 * of real game moves. Designed to never feel repetitive by having a deep
 * pool of lines for every situation, and combining multiple dimensions
 * (piece type, eval swing, move number, elo bracket, specific patterns).
 */

import { Chess, type Move } from "chess.js";

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export type MoveClassification =
  | "brilliant"
  | "great"
  | "best"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "miss";    // missed a winning tactic

export interface AnalyzedMove {
  san: string;
  uci: string;
  moveNumber: number;
  color: "w" | "b";
  fen: string;           // FEN before the move
  fenAfter: string;      // FEN after the move
  cpBefore: number;      // eval before (from side to move's perspective)
  cpAfter: number;       // eval after (from side to move's perspective — flipped)
  bestMoveSan: string | null;
  cpLoss: number;        // centipawn loss vs best move
  classification: MoveClassification;

  // Pattern flags
  isCapture: boolean;
  isCheck: boolean;
  isCastle: boolean;
  isPromotion: boolean;
  pieceType: string;     // p, n, b, r, q, k
  capturedPiece?: string;
  hungPiece: boolean;    // piece was left en prise after this move
  hungWhat?: string;     // what piece was hung
  sacrificedMaterial: boolean;
  wasBookMove: boolean;
  mateInN: number | null;
  missedMateInN: number | null;
  walkedIntoFork: boolean;
  walkedIntoPin: boolean;
  evalSwing: number;
  isResignationWorthy: boolean;
}

export interface GameSummary {
  moves: AnalyzedMove[];
  whiteElo: number;
  blackElo: number;
  avgElo: number;
  result: string;
  opening: string;
  totalBlunders: number;
  totalMistakes: number;
  worstMove: AnalyzedMove | null;
  bestMove: AnalyzedMove | null;
  biggestSwing: AnalyzedMove | null;
}

/* ================================================================== */
/*  Classification                                                      */
/* ================================================================== */

export function classifyMove(cpLoss: number, isBestMove: boolean): MoveClassification {
  if (isBestMove) return "best";
  if (cpLoss <= 10) return "great";
  if (cpLoss <= 25) return "good";
  if (cpLoss <= 50) return "inaccuracy";
  if (cpLoss <= 150) return "mistake";
  return "blunder";
}

/* ================================================================== */
/*  Roast Lines — MASSIVE pool for variety                              */
/* ================================================================== */

// ── Blunder roasts (by piece type) ──

const BLUNDER_GENERAL = [
  "Oh no. Oh NO. What was that?",
  "Ladies and gentlemen… we have a blunder.",
  "This move was so bad the chess pieces filed a complaint.",
  "Even Stockfish crashed trying to understand this.",
  "I need a moment. That move physically hurt me.",
  "Bold strategy: lose on purpose. Unorthodox, but let's see.",
  "And just like that, the advantage evaporates.",
  "This is why we can't have nice things in chess.",
  "Actually laughing out loud. What was the plan here?",
  "The engine just dropped 3 evaluation points. Like it saw a ghost.",
  "If mistakes were currency, this player would be rich.",
  "Plot twist: they're throwing on purpose. Right? RIGHT?",
  "That move belongs in a museum. The Museum of Bad Decisions.",
  "Somewhere, a chess coach just felt a disturbance in the force.",
  "This is the chess equivalent of walking into a glass door.",
  "Tell me you don't see the board without telling me you don't see the board.",
  "My man saw the best move and chose violence against himself.",
  "I physically recoiled. That was ROUGH.",
  "The kind of move that makes you Alt+F4 and go touch grass.",
  "If I showed this to a 1200, they'd roast the player. A 1200.",
];

const BLUNDER_QUEEN = [
  "They just HUNG the queen. The QUEEN. On a silver platter.",
  "Queen hangs like laundry on a Sunday afternoon.",
  "That queen was worth 9 points. Now it's worth memories.",
  "Giving the queen away like free samples at Costco.",
  "My brother in Christ, the queen was RIGHT THERE.",
  "Queen sacrifice? No. Queen donation. Taxes, if you will.",
  "They lost the queen faster than I lose my motivation to study openings.",
  "Hanging the queen is crazy, but hanging it on move {move} is INSANE.",
  "The queen: 'Am I a joke to you?' Apparently yes.",
  "Next time just start the game without a queen, save time.",
  "This isn't a sacrifice. Sacrifices have purpose. This is just grief.",
  "RIP to the queen. She didn't deserve this.",
];

const BLUNDER_ROOK = [
  "That rook just got donated to charity.",
  "Hanging a rook. Classic. Love to see it.",
  "The rook hangs and nobody noticed until it was too late.",
  "Free rook! Get your free rook here!",
  "That rook was just vibing and then— yeah.",
  "A whole rook. Five points. Gone. Reduced to atoms.",
  "Imagine working 20 moves to get a rook active, then hanging it.",
  "The rook: *exists*. The opponent: *I'll take that, thanks.*",
];

const BLUNDER_KNIGHT = [
  "That knight jumped right into the shadow realm.",
  "The knight went to an outpost… an outpost of no return.",
  "Knight goes from hero to zero in one move.",
  "They put the knight where it could be taken for free. Why.",
  "My man sent the knight on a suicide mission.",
  "That knight is pinned, forked, and crying.",
];

const BLUNDER_BISHOP = [
  "The bishop just walked into a trap like it's a mall sale.",
  "Bishop hangs. The diagonal of death claims another victim.",
  "Imagine losing a bishop for literally nothing.",
  "That bishop had so much potential. Had.",
  "The bishop moved to the worst possible square. Achievement unlocked.",
];

const BLUNDER_PAWN = [
  "It's just a pawn but the position is now completely lost.",
  "Losing a pawn here is like pulling one card from a house of cards.",
  "A pawn drop, and the whole structure collapses.",
  "One pawn. That's all it took to ruin everything.",
];

// ── Hung piece roasts ──

const HUNG_PIECE_ROASTS = [
  "They just left a piece hanging. Completely en prise. Just sitting there.",
  "That piece is hanging like a decoration. Except it's your position that's decorated.",
  "Hanging a piece in {year}? In this economy?",
  "The piece is free. It's literally free. And they just… left it there.",
  "They calculated everything except the part where the piece could be taken.",
  "No defense, no compensation, no plan. Just vibes and hanging pieces.",
  "This is the chess equivalent of leaving your car unlocked with the keys in it.",
  "Stockfish doesn't even need to think here. The piece is just… free.",
];

// ── Sacrifice roasts (sacrifice that's actually a blunder) ──

const FAKE_SACRIFICE = [
  "They sacrificed the {piece}! Bold! Brave! …and terrible.",
  "Is it a sacrifice if you get absolutely nothing for it? Asking for a friend.",
  "SACRIFICE! *checks engine* Oh. It's just losing material.",
  "The Tal wannabe energy is strong but the execution is… lacking.",
  "What a sacrifice! What a concept! What a… blunder.",
  "They went for the speculative sacrifice. Except it's not speculative, it's just bad.",
  "\"I'll sac the {piece} and get attacking chances.\" — narrator: there were no attacking chances.",
  "Kasparov would've made this work. This is not Kasparov.",
  "Sometimes you sacrifice material for compensation. This is not one of those times.",
];

// ── Missed mate ──

const MISSED_MATE = [
  "They had mate in {n}. MATE IN {n}. And they played THAT.",
  "Mate was right there. Like RIGHT there. On the board. Staring at them.",
  "How do you miss mate in {n}? How?? I need answers.",
  "The computer is showing mate in {n} and this person chose to play a developing move.",
  "Mate in {n} was available. Instead, we got whatever THIS is.",
  "The one time in the whole game they have a forced mate, and they don't see it.",
  "Imagine having mate in {n} and thinking 'nah, let me improve my knight.'",
  "Mate blindness: when the winning move is literally checkmate and you don't play it.",
  "Missing mate in {n} should be illegal. Actually, in some countries it probably is.",
];

// ── Good move / brilliant roasts ──

const BRILLIANT_ROASTS = [
  "WAIT. That's actually… brilliant? At THIS elo?",
  "Okay I take back everything I said. That move was FIRE.",
  "Even Stockfish approves. And Stockfish approves of NOTHING.",
  "A glimmer of hope! A flash of genius in the darkness!",
  "This is the best move in the game and it's not even close.",
  "Where was this energy three moves ago when they hung a piece?",
  "They found the only move. And it was the hardest one. Respect.",
  "The engine likes this. I like this. Chess is beautiful sometimes.",
  "This move is so good I had to double-check the elo. Still {elo}. Wow.",
  "Galaxy brain move. Completely unexpected. Is this even the same player?",
  "Okay that was disgusting. In a good way. What a move.",
];

const GREAT_MOVE_ROASTS = [
  "Solid move. Top engine choice. Nothing to roast here… unfortunately.",
  "Playing the best move? In MY game? More likely than you think.",
  "Credit where it's due — that's textbook.",
  "The right move for the right reasons. A rare sighting.",
  "Accurate. Clean. Almost suspicious for this elo range.",
];

// ── Inaccuracy roasts ──

const INACCURACY_ROASTS = [
  "Not the worst, not the best. The C+ of chess moves.",
  "An inaccuracy. The move that says 'I kind of know what I'm doing.'",
  "Slightly worse than ideal. Like putting ketchup on a steak.",
  "The engine prefers something else, but honestly? Vibes.",
  "It's an inaccuracy but I've seen way worse. We'll allow it.",
  "This move is like a participation trophy. You tried.",
  "Suboptimal but not punishable. The equivalent of jaywalking in chess.",
  "Could be better, but they could also have hung the queen. So, progress.",
  "The kind of move that loses 0.3 pawns but gains 0 knowledge.",
  "This is the move of someone who's not quite panicking. Yet.",
];

// ── Mistake roasts ──

const MISTAKE_ROASTS = [
  "That's a mistake. Not a blunder, but definitely a mistake.",
  "The position just went from 'fine' to 'hmm.' That's never good.",
  "This move is like taking a wrong turn on a road trip. You'll survive, but it'll cost you.",
  "A clear mistake. The evaluation bar just did a little jump.",
  "The advantage just flipped like a pancake. Thanks, I hate it.",
  "My man gave away a full pawn of advantage with that one.",
  "This move is the equivalent of studying for the wrong exam.",
  "A mistake that the opponent absolutely should punish. Key word: should.",
  "And just like that, the comfortable advantage becomes uncomfortable.",
  "This is the moment where everything starts going sideways.",
  "The kind of error that makes you go 'was that really the best I could do?' No. No it wasn't.",
];

// ── Opening-specific roasts ──

const EARLY_BLUNDER = [
  "Blunder on move {move}?! The game just STARTED.",
  "We're {move} moves in and someone already blundered. Speed run.",
  "Move {move}. Already a blunder. This is going to be a ride.",
  "It took {move} moves to reach a losing position. Impressive in the wrong way.",
  "The opening lasted {move} moves before someone decided to improvise. Badly.",
  "Some people study openings. This player studied the 'how to lose fast' guide.",
  "An opening blunder. The chess equivalent of tripping at the starting line.",
  "Blunder on move {move}. Some people just want to watch their own position burn.",
];

// ── Walk into fork / pin ──

const WALKED_INTO_FORK = [
  "They walked directly into a fork. Like a cartoon character stepping on a rake.",
  "Knight fork incoming! And they just… let it happen.",
  "The classic 'I didn't see the fork' moment. Textbook.",
  "Double attack? Triple attack? Who's counting at this point.",
];

const WALKED_INTO_PIN = [
  "That piece is now pinned to the king. Stuck. Can't move. Sad.",
  "They walked into an absolute pin. The piece is bricked.",
  "Pinned and helpless. The chess equivalent of being stuck in traffic.",
];

// ── Elo-specific commentary ──

const SUB_1000_FLAVOR = [
  "This is below 1000 chess. We're in the trenches.",
  "Sub-1000 energy is a different kind of beautiful.",
  "At this elo, every game is a blunder speedrun competition.",
  "The pieces are on the board. That's about all we can say.",
  "Both players are fighting gravity as much as each other.",
];

const ELO_1000_1300 = [
  "Ah, the 1000-1300 bracket. Where dreams of grandeur meet reality.",
  "They know the rules. They just don't know what to do with them.",
  "This is the 'I watched one Gotham Chess video' elo range.",
  "Some opening knowledge, lots of one-move blunders. Classic.",
  "The 'I can see two moves ahead but not three' zone.",
];

const ELO_1300_1600 = [
  "1300-1600: the 'I'm actually decent… sometimes' bracket.",
  "These players know tactics exist. Finding them? Different story.",
  "The intermediate plateau. Where improvement goes to die.",
  "They have ideas. The ideas are just not always good.",
  "This is the elo where you start losing to people who actually study.",
];

const ELO_1600_2000 = [
  "1600-2000: now we're cooking. These players have seen some things.",
  "The 'I actually have an opening repertoire' bracket.",
  "Advanced club players. They don't hang pieces often. OFTEN.",
  "At this level, the mistakes are subtle. The blunders? Spectacular.",
  "Good enough to be dangerous. Not good enough to be consistent.",
];

const ELO_ABOVE_2000 = [
  "Above 2000. These players actually know what they're doing.",
  "Expert level. The mistakes here are genuinely hard to spot.",
  "When a 2000+ blunders, they blunder with STYLE.",
  "At this elo, you need a computer to find the mistakes.",
  "High-level chess. Where the difference between best and second-best matters.",
];

// ── Move number context ──

const EARLY_GAME_CONTEXT = [
  "We're still in the opening.",
  "The position is still theoretical.",
  "Both sides are developing.",
  "Still book territory.",
];

const MIDDLEGAME_CONTEXT = [
  "We're deep in the middlegame now.",
  "The battle is fully engaged.",
  "Pieces are flying across the board.",
  "The position is getting spicy.",
];

const ENDGAME_CONTEXT = [
  "We've reached the endgame.",
  "The board is clearing out.",
  "Precision matters more than ever now.",
  "Endgame technique time. Or lack thereof.",
];

// ── Result reveal lines ──

export const REVEAL_TOO_HIGH = [
  "You thought they were better than that? Generous.",
  "Overestimated. Way overestimated. These are MORTALS.",
  "You gave too much credit. Rookie mistake.",
  "That's like thinking the guy at the park is secretly a GM.",
  "You sweet summer child. This is LOW elo chess.",
  "Your faith in humanity's chess ability is touching, but misplaced.",
  "If only they were that good. If only.",
];

export const REVEAL_TOO_LOW = [
  "How DARE you underestimate these players.",
  "They're actually better than you thought. Uncomfortable, isn't it?",
  "You went too low! These people have TRAINING.",
  "Disrespectful. These players actually practice.",
  "You judged too harshly. Sure, they blundered, but they also played SOME good moves.",
  "They're higher rated than that, believe it or not.",
  "Even with the blunders, they're rated higher than your guess.",
];

export const REVEAL_CORRECT = [
  "NAILED IT. Are you secretly a coach?",
  "Right on the money! You've seen enough games to know.",
  "Correct! Your pattern recognition is 📈",
  "Bulls-eye. You can just SMELL the elo. Impressive.",
  "Spot on! This is exactly what {elo} chess looks like.",
  "Crushed it. You clearly spend too much time on the internet. Same.",
  "Ding ding ding! We have a winner!",
  "You know your elo brackets. That's either impressive or concerning.",
];

// ── Game-opener lines (shown at start) ──

export const GAME_INTRO = [
  "Alright chat, let's see what we're working with today.",
  "Fresh game. Let's find out if it's a masterpiece or a disaster.",
  "New game time. Place your bets: genius or tragedy?",
  "Let's analyze this game and try not to cry.",
  "Buckle up. We're about to witness some chess. Or something resembling chess.",
  "Okay, what do we got? Let's see the first moves.",
  "Time for another 'Guess the Elo.' I can already feel the pain.",
  "Let's see if these players know what they're doing. Spoiler: probably not.",
  "Here we go. Another game, another potential crime scene.",
  "Welcome to 'Is This Chess or Just Two People Pushing Wood?'",
];

// ── Fun final summaries ──

export const GAME_SUMMARY_LINES = [
  "{blunders} blunders, {mistakes} mistakes, and {inaccuracies} inaccuracies. A normal day in {elo} chess.",
  "Final tally: {blunders} blunders. Both players really said 'no one's winning today.'",
  "With {blunders} blunders in {totalMoves} moves, that's a blunder every {frequency} moves. Consistency is key.",
  "The accuracy chart for this game looks like a seismograph during an earthquake.",
  "Honestly? For {elo} rated players, this could've been way worse. Could've.",
  "This game was a rollercoaster. Mostly the part where it crashes.",
  "Both players fought hard. Unfortunately, they also fought smart moves.",
  "In summary: chaos, pain, and the occasional good move by accident.",
  "I've seen worse. Not much worse, but worse.",
  "What a game. What an absolute circus of a game.",
];

/* ================================================================== */
/*  Commentary Selection Engine                                         */
/* ================================================================== */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUnique<T>(arr: readonly T[], exclude: Set<string>): T {
  const available = arr.filter(l => !exclude.has(String(l)));
  if (available.length === 0) return pick(arr); // fallback
  return pick(available);
}

function template(str: string, vars: Record<string, string | number>): string {
  let result = str;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

export function generateMoveComment(
  move: AnalyzedMove,
  usedLines: Set<string>,
  summary: GameSummary,
): string | null {
  const vars = {
    move: move.moveNumber,
    piece: pieceName(move.pieceType),
    elo: summary.avgElo,
    year: new Date().getFullYear(),
    n: move.missedMateInN ?? 0,
  };

  let line: string | null = null;

  // ── Brilliant / Best ──
  if (move.classification === "brilliant" || (move.classification === "best" && move.sacrificedMaterial)) {
    line = template(pickUnique(BRILLIANT_ROASTS, usedLines), vars);
  }

  // ── Great / Best (normal) ──
  else if (move.classification === "great" || move.classification === "best") {
    // Only comment on ~30% of good moves to keep it interesting
    if (Math.random() < 0.3) {
      line = template(pickUnique(GREAT_MOVE_ROASTS, usedLines), vars);
    }
  }

  // ── Missed mate ──
  else if (move.missedMateInN && move.missedMateInN <= 5) {
    line = template(pickUnique(MISSED_MATE, usedLines), vars);
  }

  // ── Blunder ──
  else if (move.classification === "blunder") {
    // Early blunder?
    if (move.moveNumber <= 8) {
      line = template(pickUnique(EARLY_BLUNDER, usedLines), vars);
    }
    // Piece-specific hung piece
    else if (move.hungPiece) {
      const piecePool =
        move.hungWhat === "q" ? BLUNDER_QUEEN :
        move.hungWhat === "r" ? BLUNDER_ROOK :
        move.hungWhat === "n" ? BLUNDER_KNIGHT :
        move.hungWhat === "b" ? BLUNDER_BISHOP :
        move.hungWhat === "p" ? BLUNDER_PAWN :
        BLUNDER_GENERAL;
      line = template(pickUnique(piecePool, usedLines), vars);
    }
    // Fake sacrifice
    else if (move.sacrificedMaterial) {
      line = template(pickUnique(FAKE_SACRIFICE, usedLines), vars);
    }
    // Walked into fork or pin
    else if (move.walkedIntoFork) {
      line = template(pickUnique(WALKED_INTO_FORK, usedLines), vars);
    }
    else if (move.walkedIntoPin) {
      line = template(pickUnique(WALKED_INTO_PIN, usedLines), vars);
    }
    // General blunder
    else {
      line = template(pickUnique(BLUNDER_GENERAL, usedLines), vars);
    }
  }

  // ── Mistake ──
  else if (move.classification === "mistake") {
    line = template(pickUnique(MISTAKE_ROASTS, usedLines), vars);
  }

  // ── Inaccuracy — only comment sometimes ──
  else if (move.classification === "inaccuracy") {
    if (Math.random() < 0.4) {
      line = template(pickUnique(INACCURACY_ROASTS, usedLines), vars);
    }
  }

  // ── Hung piece on an otherwise okay-ish move ──
  if (!line && move.hungPiece && move.cpLoss > 100) {
    line = template(pickUnique(HUNG_PIECE_ROASTS, usedLines), vars);
  }

  if (line) usedLines.add(line);
  return line;
}

export function getEloFlavorLine(elo: number): string {
  if (elo < 1000) return pick(SUB_1000_FLAVOR);
  if (elo < 1300) return pick(ELO_1000_1300);
  if (elo < 1600) return pick(ELO_1300_1600);
  if (elo < 2000) return pick(ELO_1600_2000);
  return pick(ELO_ABOVE_2000);
}

export function getPhaseContext(moveNumber: number, totalMoves: number): string {
  const pct = moveNumber / totalMoves;
  if (pct < 0.25) return pick(EARLY_GAME_CONTEXT);
  if (pct < 0.7) return pick(MIDDLEGAME_CONTEXT);
  return pick(ENDGAME_CONTEXT);
}

function pieceName(piece: string): string {
  switch (piece) {
    case "q": return "queen";
    case "r": return "rook";
    case "b": return "bishop";
    case "n": return "knight";
    case "k": return "king";
    case "p": return "pawn";
    default: return "piece";
  }
}

/* ================================================================== */
/*  Analysis helpers                                                    */
/* ================================================================== */

/** Check if a piece is hanging (en prise) after a move */
export function isHanging(chess: Chess, square: string): { hanging: boolean; piece?: string } {
  const piece = chess.get(square as any);
  if (!piece) return { hanging: false };

  // Check if any opponent piece can capture this square
  const moves = chess.moves({ verbose: true });
  // We need to check from the opponent's perspective
  // So we look at what the OTHER side can capture
  const opponentMoves = chess.moves({ verbose: true });
  for (const m of opponentMoves) {
    if (m.to === square && m.captured) {
      // Check if the capture is profitable (simple material comparison)
      return { hanging: true, piece: piece.type };
    }
  }
  return { hanging: false };
}

/** Piece material value for simple comparisons */
export function materialValue(piece: string): number {
  switch (piece) {
    case "p": return 1;
    case "n": return 3;
    case "b": return 3;
    case "r": return 5;
    case "q": return 9;
    case "k": return 0;
    default: return 0;
  }
}

/** Count total material on the board */
export function countMaterial(chess: Chess): { white: number; black: number } {
  const board = chess.board();
  let white = 0, black = 0;
  for (const row of board) {
    for (const sq of row) {
      if (!sq) continue;
      const val = materialValue(sq.type);
      if (sq.color === "w") white += val;
      else black += val;
    }
  }
  return { white, black };
}

/* ================================================================== */
/*  Elo bracket helpers                                                 */
/* ================================================================== */

export const ELO_BRACKETS = [
  { label: "Absolute beginner", range: "< 800", min: 0, max: 800, emoji: "🐣" },
  { label: "Beginner", range: "800 – 1100", min: 800, max: 1100, emoji: "🌱" },
  { label: "Casual player", range: "1100 – 1400", min: 1100, max: 1400, emoji: "♟️" },
  { label: "Intermediate", range: "1400 – 1700", min: 1400, max: 1700, emoji: "⚔️" },
  { label: "Advanced", range: "1700 – 2000", min: 1700, max: 2000, emoji: "🏆" },
  { label: "Expert / Master", range: "2000+", min: 2000, max: 3500, emoji: "👑" },
] as const;

export function getEloBracketIdx(elo: number): number {
  if (elo < 800) return 0;
  if (elo < 1100) return 1;
  if (elo < 1400) return 2;
  if (elo < 1700) return 3;
  if (elo < 2000) return 4;
  return 5;
}
