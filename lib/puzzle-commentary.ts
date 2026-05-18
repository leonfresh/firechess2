import { Chess } from "chess.js";
import { explainMoves } from "./position-explainer";

export type PuzzleTheme =
  | "fork"
  | "pin"
  | "skewer"
  | "discoveredAttack"
  | "doubleCheck"
  | "mateIn1"
  | "mateIn2"
  | "mateIn3"
  | "backRankMate"
  | "smotheredMate"
  | "sacrifice"
  | "deflection"
  | "attraction"
  | "interference"
  | "hangingPiece"
  | "trappedPiece"
  | "promotion"
  | "enPassant"
  | "endgame"
  | "rookEndgame"
  | "pawnEndgame"
  | "queenEndgame"
  | "knightEndgame"
  | "bishopEndgame"
  | "xRayAttack"
  | "zugzwang"
  | "quietMove"
  | "clearance"
  | "crushing"
  | "advantage"
  | string;

export interface PuzzleScript {
  intro: string;
  hints: string[];
  moveHints: string[];
  thinkingPrompt: string;
  moveComments: string[];
  wrongMoveQuestion: string;
  wrongMoveAnswer: string;
  opponentDevQuestion: string;
  opponentDevAnswer: string;
  conclusion: string;
}

interface CommentaryInput {
  themes: PuzzleTheme[];
  fen: string;
  solutionMoves: string[];
  wrongMove: string | null;
  wrongMoveLoss: number;
  opponentDeviation: string | null;
  opponentDeviationResponse: string | null;
  rating: number;
  puzzleId: string;
}

// ── Seeded RNG (deterministic per puzzle) ────────────────────────────────────

function seededRng(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Chess helpers ────────────────────────────────────────────────────────────

const PIECE_NAMES: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

function uciToAlg(uci: string, chess: Chess): string {
  try {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci[4] ?? "";
    const move = chess.moves({ verbose: true }).find((candidate) => {
      return (
        candidate.from === from &&
        candidate.to === to &&
        (candidate.promotion ?? "") === promotion
      );
    });
    const piece = move
      ? { type: move.piece }
      : chess.get(from as Parameters<Chess["get"]>[0]);
    if (!piece) return uci;
    if (move?.flags.includes("k")) return "castle kingside";
    if (move?.flags.includes("q")) return "castle queenside";
    const pieceName = PIECE_NAMES[piece.type] ?? piece.type;
    const promotionText = move?.promotion
      ? `, promoting to ${PIECE_NAMES[move.promotion] ?? move.promotion}`
      : "";
    const captureText = move?.captured ? ` takes ${to}` : ` to ${to}`;
    return `${pieceName}${captureText}${promotionText}`;
  } catch {
    return uci;
  }
}

function uciToAction(uci: string, chess: Chess): string {
  try {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci[4] ?? "";
    const move = chess.moves({ verbose: true }).find((candidate) => {
      return (
        candidate.from === from &&
        candidate.to === to &&
        (candidate.promotion ?? "") === promotion
      );
    });
    const piece = move
      ? { type: move.piece }
      : chess.get(from as Parameters<Chess["get"]>[0]);
    if (!piece) return uci;
    if (move?.flags.includes("k")) return "castle kingside";
    if (move?.flags.includes("q")) return "castle queenside";

    const pieceName = PIECE_NAMES[piece.type] ?? piece.type;
    const promotionText = move?.promotion
      ? ` and promote to ${PIECE_NAMES[move.promotion] ?? move.promotion}`
      : "";

    if (move?.captured) {
      return `take on ${to} with the ${pieceName}${promotionText}`;
    }

    return `move the ${pieceName} to ${to}${promotionText}`;
  } catch {
    return uci;
  }
}

function uciToMoveObj(uci: string) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci[4] as "q" | "r" | "b" | "n" | undefined,
  };
}

function getSideToMove(fen: string): "white" | "black" {
  return fen.split(" ")[1] === "w" ? "white" : "black";
}

type MoveNarrative = {
  detectedThemeName: string | null;
  moveAlg: string;
  piece: string;
  theme: PuzzleTheme;
};

const DETECTED_THEME_PRIORITY: Array<{
  names: string[];
  theme: PuzzleTheme;
}> = [
  { names: ["Smothered Mate"], theme: "smotheredMate" },
  { names: ["Back-Rank Mate", "Back Rank"], theme: "backRankMate" },
  { names: ["Double Check"], theme: "doubleCheck" },
  {
    names: ["Knight Fork", "Queen Fork", "Pawn Fork", "Fork"],
    theme: "fork",
  },
  { names: ["Pin"], theme: "pin" },
  { names: ["Skewer"], theme: "skewer" },
  {
    names: ["Discovered Attack", "Discovered Check"],
    theme: "discoveredAttack",
  },
  { names: ["Sacrifice", "Exchange Sacrifice"], theme: "sacrifice" },
  { names: ["Deflection"], theme: "deflection" },
  { names: ["Attraction"], theme: "attraction" },
  { names: ["Interference"], theme: "interference" },
  { names: ["Clearance"], theme: "clearance" },
  { names: ["Hanging Piece"], theme: "hangingPiece" },
  { names: ["Trapped Piece"], theme: "trappedPiece" },
  { names: ["Promotion", "Underpromotion"], theme: "promotion" },
  { names: ["En Passant"], theme: "enPassant" },
  { names: ["Zugzwang"], theme: "zugzwang" },
  { names: ["Rook Endgame"], theme: "rookEndgame" },
  { names: ["Pawn Endgame"], theme: "pawnEndgame" },
  { names: ["Queen Endgame"], theme: "queenEndgame" },
  { names: ["Knight Endgame"], theme: "knightEndgame" },
  { names: ["Bishop Endgame"], theme: "bishopEndgame" },
  { names: ["Endgame"], theme: "endgame" },
  { names: ["X-Ray Attack"], theme: "xRayAttack" },
  { names: ["Crushing"], theme: "crushing" },
  { names: ["Advantage"], theme: "advantage" },
];

function pickDetectedTheme(
  themeNames: string[],
): { detectedThemeName: string; theme: PuzzleTheme } | null {
  for (const candidate of DETECTED_THEME_PRIORITY) {
    const detectedThemeName = themeNames.find((name) =>
      candidate.names.includes(name),
    );
    if (detectedThemeName) {
      return { detectedThemeName, theme: candidate.theme };
    }
  }

  return null;
}

function getThemeTemplates(theme: PuzzleTheme): ThemeTemplates {
  return (THEME_TEMPLATES[theme] ?? THEME_TEMPLATES.default) as ThemeTemplates;
}

function buildDetectedHint(
  detectedThemeName: string | null,
  piece: string,
): string | null {
  switch (detectedThemeName) {
    case "Knight Fork":
    case "Queen Fork":
    case "Pawn Fork":
    case "Fork":
      return `This is a ${piece} fork. Find the square where your ${piece} attacks two valuable targets at once.`;
    case "Pin":
      return "This is about a pin. Look for the line move that freezes a piece in front of something more valuable.";
    case "Skewer":
      return "Look for a skewer: attack the more valuable piece first so the piece behind it drops next.";
    case "Discovered Attack":
    case "Discovered Check":
      return "A discovered attack is hiding here. Move the front piece so the line behind it suddenly comes alive.";
    case "Double Check":
      return "Look for the move that creates a double check. If both pieces check at once, the king has to run.";
    case "Back Rank":
    case "Back-Rank Mate":
      return "Check the back rank. If the king has no luft, one heavy-piece move can be decisive.";
    case "Sacrifice":
    case "Exchange Sacrifice":
      return "Do not count material first. Look for the sacrifice that opens the real tactic.";
    case "Deflection":
      return "One defender is overloaded here. Find the move that drags it away from its real job.";
    case "Attraction":
      return "You want one of their pieces on the wrong square. Look for the bait that lures it there.";
    case "Interference":
      return "Look for the move that cuts the connection between a defender and the square it needs to protect.";
    case "Clearance":
      return "One of your own pieces is in the way. Find the clearance move first, then the tactic follows.";
    case "Hanging Piece":
      return "Something is loose here. Find the clean move that wins the undefended piece.";
    case "Trapped Piece":
      return "A piece is running out of squares. Find the move that shuts the last escape door.";
    case "Promotion":
    case "Underpromotion":
      return "The key idea is promotion. Work out the cleanest way to queen, or underpromote if that is the only precise finish.";
    case "En Passant":
      return "This is an en passant idea. If you do not take it now, the chance disappears.";
    case "Zugzwang":
      return "The point is zugzwang. Find the move that leaves them with no comfortable reply.";
    default:
      return null;
  }
}

// ── Template banks ───────────────────────────────────────────────────────────

const THINKING_PROMPTS = [
  "Take your time, no rush. I'll be right here.",
  "You've got this — just take a sec and feel out the position.",
  "Go on, have a good think. I believe in you.",
  "I won't say a word... okay maybe just one hint. Just kidding, it's all you.",
];

const CONCLUSIONS = [
  "See? I knew you'd get it. That was actually really clean.",
  "That's the one! Honestly you made that look easy.",
  "Boom. Did you see how everything just snapped into place? So satisfying.",
  "That's chess. Beautiful when it works, isn't it? Okay next one, let's go.",
  "Yep, exactly like that. You're getting it.",
];

const WRONG_MOVE_ANSWERS: Record<string, string[]> = {
  default: [
    "Tempting, right? But after {wrongMove} they just {escape} and now you've actually lost a tempo. The position sort of... unravels.",
    "I thought you might go there. It feels forcing, but after {escape} it actually gives them time to consolidate. You want to hit them where they can't run.",
    "Ooh, nice try. The problem is after {wrongMove} the king just steps away and you've spent your best piece for nothing.",
    "So close, but {wrongMove} lets them wiggle out. You need a move that's decisive right now.",
  ],
};

const OPPONENT_DEV_ANSWERS = [
  "If they go {opponentDev} instead, then you play it cool and just {response} — they're still toast either way.",
  "Interesting — if {opponentDev}, your best reply is actually {response}. Keeps the pressure on perfectly.",
  "Good question! {opponentDev} is a stubborn try, but {response} and it's still completely winning.",
];

// ── Per-theme templates ───────────────────────────────────────────────────────

interface ThemeTemplates {
  intros: string[];
  hints: string[];
  moveComments: string[];
  wrongMoveQuestions: string[];
}

const THEME_TEMPLATES: Partial<Record<PuzzleTheme, ThemeTemplates>> & {
  default: ThemeTemplates;
} = {
  fork: {
    intros: [
      "Okay sooo this one is all about geometry. One piece, two problems — that's the vibe here.",
      "I love this type. Look at how the pieces are spaced out on the board. Anything catch your eye?",
      "This is one of those positions where one single move does sooo much work at once.",
      "Hint: you're looking for a move that threatens two of their pieces at the same time. Feel it out.",
    ],
    hints: [
      "Look at what squares your {piece} could reach in one move. How many of their pieces does it eyeball from there?",
      "Think about moves that put them in a dilemma — where they can only save one thing at a time.",
      "The key piece here is your {piece}. Where does it want to land?",
      "Notice the spacing between those two pieces. Anything in your arsenal that could threaten both at once?",
    ],
    moveComments: [
      "Yes! {move} — the {piece} lands right in the middle and suddenly attacks both. They can only save one.",
      "There it is. {move}, and now they're in a fork. Can't save everything at once.",
      "{move}! The {piece} just parks itself in that beautiful central square. Two threats, one move.",
    ],
    wrongMoveQuestions: [
      "Okay before we go — what if you just played {wrongMove} here? It looks super forcing...",
      "A lot of people would want to play {wrongMove} first. What do you think happens?",
      "What if you went {wrongMove}? Seems aggressive, right?",
    ],
  },
  pin: {
    intros: [
      "Pins are honestly so underrated. Look at the piece alignment here — something's stuck.",
      "Okay, look very carefully at which pieces are lined up. One of their pieces is kind of... trapped.",
      "This position has a pin in it somewhere. Your job is to find it and exploit it.",
      "So here's the thing — a pinned piece can't really defend anything. Look for the lineup.",
    ],
    hints: [
      "Trace the lines on the board — any of their pieces sitting in front of something more valuable?",
      "If a piece can't move because something worse would happen, it's basically not a piece. See where that applies here.",
      "Think about your bishops and rooks. Any of their pieces in the way of something they really don't want to expose?",
      "A pinned piece is a liability. Look for one of their pieces that's stuck in place.",
    ],
    moveComments: [
      "{move} — and now that {piece} is completely pinned. It literally cannot move.",
      "Beautiful. {move} and the {piece} is frozen. All you have to do now is pile on.",
      "{move}! Pinning the {piece} against their king. It's stuck and it knows it.",
    ],
    wrongMoveQuestions: [
      "What if instead you went {wrongMove} first? Looks like it wins material right away...",
      "Someone might try {wrongMove} here — tempting, right? What do you think happens?",
      "What about {wrongMove}? Seems direct...",
    ],
  },
  mateIn1: {
    intros: [
      "Okay this one's quick — there's a checkmate in one move hiding here. Take a look!",
      "One move and it's over. Where is it?",
      "Checkmate in one! I'll let you find it — you've totally got this.",
      "There's a one-move checkmate somewhere in this position. Look for the king's escape squares.",
    ],
    hints: [
      "Check every single square around the king — are they all covered or blocked?",
      "Where is the king? How many escape squares does it have? Think about closing them all off in one shot.",
      "Sometimes the checkmate is a quiet move, not a flashy capture. Look everywhere.",
      "The king is more exposed than it looks. One decisive move ends it all.",
    ],
    moveComments: [
      "{move}! That's checkmate — the king has nowhere to go.",
      "{move} and it's over! Beautiful — no escape.",
      "Checkmate! {move} covers every last square. Well played.",
    ],
    wrongMoveQuestions: [
      "Quick question — what if instead you played {wrongMove}? It's also check...",
      "What about {wrongMove} first? Also looks pretty dangerous...",
    ],
  },
  mateIn2: {
    intros: [
      "There's a forced checkmate in two moves here. The fun part is finding the first one — it might surprise you.",
      "Two moves to checkmate! The first move is the key — once you see it, the rest flows.",
      "Okay so there's a mate in two hiding here. First move forces something, second move ends it.",
      "This is a mate in two. Take your time — the first move might look a little odd but it's perfect.",
    ],
    hints: [
      "Think about what the first move needs to do — it should set up the checkmate, not deliver it.",
      "Where does the king want to run? Your first move should close off that escape.",
      "Sometimes the first move of a mating sequence isn't a check. Look for quiet threats.",
      "Force them into a position where no matter what they do, the next move is checkmate.",
    ],
    moveComments: [
      "{move} — and now they're in a mating net. No matter what they play, it's checkmate next.",
      "Yes! {move} forces them into a hopeless position. Watch...",
      "{move}! The king is walking into a trap. Beautiful first move.",
    ],
    wrongMoveQuestions: [
      "Before the answer — what if you played {wrongMove} as your first move? It's also check...",
      "What about {wrongMove} first? Some people go for that...",
      "What if you tried {wrongMove}? Looks like it could work...",
    ],
  },
  mateIn3: {
    intros: [
      "There's a forced mate in three here. This one's a little deeper — take your time.",
      "Three moves to checkmate. The first move is everything — it should be forcing.",
      "Okay so this is a mate in three. You need to think ahead just a little bit here.",
      "Mate in three! This one requires some calculation. Each move should be forcing.",
    ],
    hints: [
      "Think about what forcing moves you have — checks, captures, serious threats.",
      "The first move should limit the king significantly. Where does it want to go?",
      "Calculate two or three moves ahead. Every move should be forcing or near-forcing.",
      "Look at the king's position. What's the most efficient way to run out its squares?",
    ],
    moveComments: [
      "{move} — that's the key! Forces the sequence.",
      "{move}! Excellent. Now they're in trouble.",
      "Yes! {move} and the net is closing.",
    ],
    wrongMoveQuestions: [
      "What if you gave check with {wrongMove} first instead? It's also forcing...",
      "What about {wrongMove} as the first move?",
      "Some players would play {wrongMove} here. What happens then?",
    ],
  },
  sacrifice: {
    intros: [
      "Oh, this one is special. Sometimes in chess you have to give something to get something even better.",
      "This position has a sacrifice in it. It might look scary at first but trust the logic.",
      "Here's one where the right move actually gives material away. But don't panic — it's worth it.",
      "Sometimes the best moves look like mistakes at first. Look for something a little unexpected here.",
    ],
    hints: [
      "What if you could give up material to open up lines or expose their king?",
      "Is there a piece you could sacrifice that would force the position in your favor?",
      "Don't be afraid to give something away here. Sometimes the position demands it.",
      "Look for captures that your opponent HAS to accept — and what it means if they do.",
    ],
    moveComments: [
      "{move}! Giving up the {piece} — but look at what it unlocks.",
      "The sacrifice! {move} and now the position explodes in your favor.",
      "{move} — that's the beautiful sacrifice. Material down, but the attack is overwhelming.",
    ],
    wrongMoveQuestions: [
      "What if instead of sacrificing, you just played the safe {wrongMove}?",
      "What about {wrongMove}? Keeps the material but...",
      "Some people would play {wrongMove} here and keep things quiet. What do you think?",
    ],
  },
  deflection: {
    intros: [
      "This one's about removing a key defender. One of their pieces is doing too much work.",
      "Sometimes the best move is to take away what's protecting the thing you want to attack.",
      "Look for a piece that's overloaded — it's trying to do too many jobs at once.",
      "There's a defender in the way here. Your job is to deal with it first.",
    ],
    hints: [
      "Which of their pieces is protecting something critical? What happens if you make it move?",
      "Think about forcing their key defender away from the square it needs to be on.",
      "Sometimes attacking two things at once forces a piece to abandon one of its duties.",
      "Look at what their most important defender is protecting. Can you deflect it?",
    ],
    moveComments: [
      "{move}! Forces their {piece} to abandon its post. Now the real attack begins.",
      "{move} — deflecting the key defender. Once it moves, everything opens up.",
      "There it is. {move} and the defender is pulled away. The position collapses for them.",
    ],
    wrongMoveQuestions: [
      "What if you went straight for {wrongMove} without deflecting first?",
      "What about {wrongMove} — goes straight to the target?",
    ],
  },
  backRankMate: {
    intros: [
      "Okay look at their back rank for a second. Does something look a little... suffocated?",
      "Their king is stuck on the back rank with no escape. One powerful move could end everything.",
      "Back rank issues! Their king is trapped by its own pawns. Look for the knockout.",
      "This is a back rank weakness. Their king can't move up and there's a heavy piece incoming.",
    ],
    hints: [
      "Count the escape squares for their king. Are any of them actually available?",
      "Their own pawns are boxing the king in. What's the most powerful piece you can throw at that back rank?",
      "Look at the first rank — it's a prison right now. How do you use that?",
      "Sometimes the most decisive moves don't even need to give check. Look at the back rank.",
    ],
    moveComments: [
      "{move}! Their king is completely trapped on the back rank. No escape.",
      "The back rank strike! {move} and there's nowhere to run.",
      "{move} — sliding right to the back rank. It's over.",
    ],
    wrongMoveQuestions: [
      "What if you tried {wrongMove} instead of the main line?",
      "What about {wrongMove} — also attacks the back rank...",
    ],
  },
  smotheredMate: {
    intros: [
      "Oh this one is so satisfying when you see it. The king is going to get smothered by its own pieces.",
      "Smothered mate! The king's escape squares are blocked by its own army. The knight loves this.",
      "This is one of the most beautiful checkmates in chess. The king gets suffocated by its own pieces.",
      "Look at the king — surrounded by its own pieces. One knight maneuver and it's lights out.",
    ],
    hints: [
      "Look at where the king is and how many of its squares are blocked by its own pieces.",
      "Knights are sneaky — think about where yours could jump to deliver a decisive check.",
      "The magic here is that their pieces are actually working against their king. Exploit that.",
      "The king has nowhere to go because its own pieces are blocking every square. Just close the cage.",
    ],
    moveComments: [
      "{move}! The knight delivers the smothered mate — the king choked by its own pieces.",
      "Beautiful! {move} — the king is completely smothered. Classic.",
      "{move}! Textbook smothered mate. The knight finishes it.",
    ],
    wrongMoveQuestions: [
      "What if you played {wrongMove} first — also puts the king in a tough spot?",
      "What about {wrongMove}? Looks like it might work...",
    ],
  },
  hangingPiece: {
    intros: [
      "Oh they left something hanging! Free material is on the table here.",
      "Look carefully — one of their pieces is just... sitting there unprotected.",
      "There's a hanging piece somewhere in this position. Take what's given!",
      "Free real estate alert. Find the unprotected piece and take it.",
    ],
    hints: [
      "Go through their pieces one by one — is each one protected? You might find a freebie.",
      "Sometimes the best move is the simple one. Is there a piece you can just take?",
      "Check if all their pieces are defended. You might be surprised.",
      "Look for material that's just sitting there with no guard. Take it!",
    ],
    moveComments: [
      "{move}! Taking the hanging {piece}. Free material is free material.",
      "Simple and clean — {move}, winning the undefended {piece}.",
      "{move}! Grabbing the free piece. Sometimes chess is just that simple.",
    ],
    wrongMoveQuestions: [
      "What if instead of taking the hanging piece you played {wrongMove}?",
      "What about {wrongMove} — also looks tempting?",
    ],
  },
  quietMove: {
    intros: [
      "Okay this one is tricky because the best move is a quiet one — no checks, no captures.",
      "Sometimes the most powerful move is a soft one. Look for something that just... improves your position massively.",
      "This one requires you to think past the obvious checks and captures. The best move is quiet.",
      "The key move here doesn't capture anything or give check. It just sets up an unstoppable threat.",
    ],
    hints: [
      "Don't just look for checks and captures — sometimes a quiet move is the most dangerous.",
      "Think about what threat you could set up that your opponent literally cannot stop.",
      "The best move here improves the position in a way that leaves them helpless.",
      "What if you just moved a piece to a better square? Sometimes that's all it takes.",
    ],
    moveComments: [
      "{move}! The quiet {piece} move — and suddenly there's no good answer for them.",
      "There it is. {move} — no check, no capture, just an unstoppable threat.",
      "{move}! The quiet move that wins. Beautiful.",
    ],
    wrongMoveQuestions: [
      "What if you tried the more forcing {wrongMove} instead?",
      "What about {wrongMove}? Looks more direct...",
    ],
  },
  promotion: {
    intros: [
      "There's a pawn that wants to be a queen! The key is how to get it there.",
      "Promotion is on the board. Figure out how to push that pawn through.",
      "Queening time! Look for the cleanest way to promote.",
      "There's a passed pawn that can queen here. How do you make it happen?",
    ],
    hints: [
      "Look at the pawn and what's blocking or guarding the promotion square.",
      "Sometimes you need to clear the path for the pawn before pushing.",
      "The promotion is winning — you just need to figure out the right sequence.",
      "What's standing between that pawn and queening? Deal with it.",
    ],
    moveComments: [
      "{move}! Clearing the path for the pawn. Promotion is coming.",
      "Yes! {move} and the pawn is unstoppable now.",
      "{move}! The pawn queens next move. Game over.",
    ],
    wrongMoveQuestions: [
      "What if you just pushed the pawn with {wrongMove} right away?",
      "What about {wrongMove} — going straight for it?",
    ],
  },
  enPassant: {
    intros: [
      "En passant time! This one catches so many people off guard.",
      "This is a classic en passant situation. It's now or never — you can only do this on this exact move.",
      "There's an en passant capture available here. Don't miss it!",
      "This position calls for en passant. Take it while you can.",
    ],
    hints: [
      "Look at the pawn that just moved two squares. You can capture it as if it only moved one.",
      "En passant is only available right now — next move the opportunity is gone forever.",
      "The en passant capture is the key move here. Trust it.",
      "Think about that pawn that just moved two squares. There's a special rule about it...",
    ],
    moveComments: [
      "{move}! The en passant capture. Grabbed it just in time.",
      "En passant! {move} — and that pawn is gone.",
      "{move}! Perfect en passant. That changes the structure in your favor.",
    ],
    wrongMoveQuestions: [
      "What if you skipped the en passant and played {wrongMove} instead?",
      "What about {wrongMove} — ignoring the en passant?",
    ],
  },
  zugzwang: {
    intros: [
      "This one has a very cool concept — your opponent is basically in a situation where every move makes things worse for them.",
      "This is a zugzwang position. They have to move but every move hurts them.",
      "Zugzwang! The situation where being forced to move is actually a disadvantage.",
      "Here's the thing — your opponent would love to just pass their turn. But they can't.",
    ],
    hints: [
      "Think about putting them in a situation where every possible move loses material or concedes ground.",
      "Look at their options — what happens if they move any of their pieces?",
      "Sometimes the winning move just waits and forces them to ruin their own position.",
      "The goal is to run out their reasonable moves. What's the move that does that?",
    ],
    moveComments: [
      "{move}! And now they're in zugzwang. Every move hurts.",
      "The zugzwang move. {move} — they have to make things worse for themselves.",
      "{move}! Forcing zugzwang. Whatever they do, the position collapses.",
    ],
    wrongMoveQuestions: [
      "What if instead you went aggressive with {wrongMove}?",
      "What about {wrongMove}? Looks more active...",
    ],
  },
  discoveredAttack: {
    intros: [
      "There's a discovered attack hiding here — moving one piece to unleash another.",
      "This is all about the discovered attack. One piece steps away and another one suddenly attacks.",
      "Think about moving a piece to reveal an attack from behind it.",
      "Sometimes a piece needs to step aside so the one behind it can do the real work.",
    ],
    hints: [
      "Look at your pieces that are lined up — if one moves, what does the one behind it suddenly attack?",
      "Think about which of your pieces is blocking an attack from another piece.",
      "The discover is the key. Move one piece, unleash another.",
      "Look for a move that creates two threats at once by revealing a hidden piece.",
    ],
    moveComments: [
      "{move}! The discovered attack — the {piece} steps aside and now the line is open.",
      "Beautiful discovered attack. {move} moves the {piece} and reveals a devastating threat.",
      "{move}! Two threats at once from the discovered attack. They can't handle both.",
    ],
    wrongMoveQuestions: [
      "What if you played the direct {wrongMove} instead of the discovery?",
      "What about {wrongMove}? Also attacks something...",
    ],
  },
  xRayAttack: {
    intros: [
      "There's an X-ray attack here — a piece attacking through another piece.",
      "Think about pieces attacking through the board. X-ray vision!",
      "This one involves a piece attacking a square even through another piece.",
      "The concept here is looking through pieces — one piece covers a square via another.",
    ],
    hints: [
      "Consider that pieces can sometimes 'see through' other pieces for tactical purposes.",
      "Look at the long-range pieces — what do they attack even behind other pieces?",
      "Think about what happens if a piece on a certain square were removed. What does your piece suddenly cover?",
      "X-ray attacks are subtle. Look at what your rooks and queens target through the position.",
    ],
    moveComments: [
      "{move}! The X-ray attack — the piece attacks right through the position.",
      "{move} exploits the X-ray. Clean and precise.",
      "Beautiful! {move} and the X-ray wins the material.",
    ],
    wrongMoveQuestions: [
      "What about the direct {wrongMove} instead?",
      "What if you just played {wrongMove}?",
    ],
  },
  doubleCheck: {
    intros: [
      "Oh this one is going to be spicy — there's a double check coming. Two pieces giving check at once.",
      "Double check! Two pieces checking the king simultaneously — there's no blocking or interposing.",
      "This position calls for a double check. The king MUST move — nothing else works.",
      "Get ready for a double check. When two pieces give check at once, the only answer is king move.",
    ],
    hints: [
      "A double check means the king has to move — so think about where it can go. Or not go.",
      "Look for a move that gives check with one piece while discovering a check with another.",
      "Two checks at once means no blocking, no capturing — king must move. Where can it go?",
      "Think about a piece that can step to check and reveal another piece also giving check.",
    ],
    moveComments: [
      "{move}! Double check — both pieces attack the king simultaneously. King must move.",
      "The double check! {move} and there's nothing they can do but run.",
      "{move}! Two checks at once. The king has to step and now...",
    ],
    wrongMoveQuestions: [
      "What if you just gave the single check with {wrongMove}?",
      "What about {wrongMove} first?",
    ],
  },
  clearance: {
    intros: [
      "This position needs a clearance move — you need to get a piece out of the way first.",
      "Sometimes you need to clear a square or a line before the real tactic works.",
      "There's a clearance needed here. Something is in the way of the winning move.",
      "First you need to clear the path. One move sets everything up.",
    ],
    hints: [
      "Look at what would happen if a certain square were empty. How do you empty it?",
      "Is one of your own pieces blocking the winning plan? How do you get it out of the way?",
      "Think about what needs to move for the tactics to work.",
      "Clear the way first. The winning move needs an open line or square.",
    ],
    moveComments: [
      "{move}! The clearance — now the line is open for the real attack.",
      "Clearing the path with {move}. Now everything works.",
      "{move} — gets out of the way and sets up the finish.",
    ],
    wrongMoveQuestions: [
      "What if you skipped the clearance and just played {wrongMove}?",
      "What about going straight to {wrongMove}?",
    ],
  },
  attraction: {
    intros: [
      "This one's about luring an enemy piece to a bad square. Sometimes you want them to come to you.",
      "Attraction tactic! You're going to drag their king or piece to a square it doesn't want to be on.",
      "Sometimes the best move is to offer something to lure their piece into a trap.",
      "You want their piece on a specific square. How do you get it there?",
    ],
    hints: [
      "Think about a sacrifice that forces their piece onto a bad square.",
      "Where do you want their king or piece to be? How can you force it there?",
      "Sometimes you give something up to drag a piece to a vulnerable position.",
      "Lure them in. If their piece accepts the bait, what happens next?",
    ],
    moveComments: [
      "{move}! The attraction sacrifice — forces the king/piece right where you want it.",
      "Brilliant! {move} drags the {piece} to {to} where it becomes vulnerable.",
      "{move}! The lure. And now the piece is exactly where you need it.",
    ],
    wrongMoveQuestions: [
      "What about {wrongMove} instead of the attraction?",
      "What if you tried the direct {wrongMove}?",
    ],
  },
  trappedPiece: {
    intros: [
      "One of their pieces is about to get trapped — it's on the edge and running out of squares.",
      "This position has a trapped piece in it. Look for the piece that has no good squares to go to.",
      "There's a piece that's about to get cornered. Look for how to close the escape routes.",
      "Sometimes the best strategy is cutting off a piece's retreats until it's completely stuck.",
    ],
    hints: [
      "Look for an opponent piece that has limited mobility. Can you take away its remaining squares?",
      "A piece in the corner has fewer options. Is there one that's already nearly trapped?",
      "Think about advancing pawns or pieces to cut off retreats from the vulnerable piece.",
      "Which of their pieces feels uncomfortable? How do you trap it completely?",
    ],
    moveComments: [
      "{move}! Trapping the {piece} — it has nowhere left to go.",
      "The {piece} is now completely trapped after {move}. It's going to fall.",
      "{move}! Cutting off the last escape square. The {piece} is dead.",
    ],
    wrongMoveQuestions: [
      "What if you went for {wrongMove} instead of the trapping move?",
      "What about {wrongMove}?",
    ],
  },
  endgame: {
    intros: [
      "This is an endgame technique puzzle. Precision matters more here than anywhere else.",
      "Endgames! Every tempo counts. Look for the most accurate move.",
      "Endgame precision time. One wrong move and the win can slip away.",
      "This is where technique separates good players from great ones. What's the winning plan?",
    ],
    hints: [
      "Think about pawn structure, king activity, and piece coordination in this endgame.",
      "In endgames, the king is a strong piece. How can you activate yours?",
      "Precise calculation is key here. Each move needs to be the most efficient one.",
      "Think about the most important principle in this type of endgame. What applies here?",
    ],
    moveComments: [
      "{move}! The precise endgame technique. Every tempo matters here.",
      "Exactly right. {move} — clean endgame play.",
      "{move}! That's the winning technique. Accurate and efficient.",
    ],
    wrongMoveQuestions: [
      "What if you tried {wrongMove} instead? Looks natural...",
      "What about {wrongMove}?",
    ],
  },
  default: {
    intros: [
      "Take a good look at this position. There's something here — feel it out.",
      "Okay so this one requires some thought. Look at every piece and what it's doing.",
      "There's a tactic hiding here. Take your time, don't rush.",
      "Look at the position carefully. Something isn't quite right for them.",
    ],
    hints: [
      "Look at which of their pieces are the most vulnerable. What's the least defended?",
      "Think about checks, captures, and threats — in that order.",
      "Sometimes the answer is hidden in the geometry of the position. Look at the piece relationships.",
      "Consider what move would create the biggest problem for your opponent right now.",
    ],
    moveComments: [
      "{move}! That's the move. Clean and strong.",
      "Nice! {move} — and the position changes completely in your favor.",
      "{move}! Perfect. Exactly the right idea.",
    ],
    wrongMoveQuestions: [
      "Before we see the answer — what if you played {wrongMove}? Looks tempting...",
      "What about {wrongMove} here? Some people would try that.",
      "What if you went {wrongMove} instead? It seems forcing...",
    ],
  },
};

// ── Fill template tokens ──────────────────────────────────────────────────────

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(
    /\{(\w+)\}/g,
    (_, key: string) => vars[key] ?? `{${key}}`,
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildPuzzleScript(input: CommentaryInput): PuzzleScript {
  const rng = seededRng(input.puzzleId);

  const fallbackTheme =
    input.themes.find((t) => t in THEME_TEMPLATES) ?? "default";

  const moveNarratives: MoveNarrative[] = input.solutionMoves.map((uci, i) => {
    const tempChess = new Chess(input.fen);
    for (let j = 0; j < i; j++) {
      const move = input.solutionMoves[j];
      try {
        tempChess.move({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: move[4],
        });
      } catch {
        /* skip */
      }
    }

    const moveAlg = uciToAlg(uci, tempChess);
    const piece =
      PIECE_NAMES[
        tempChess.get(uci.slice(0, 2) as Parameters<Chess["get"]>[0])?.type ??
          ""
      ] ?? "piece";

    let theme = fallbackTheme;
    let detectedThemeName: string | null = null;

    try {
      const detected = pickDetectedTheme(
        explainMoves(tempChess.fen(), uci, uci, 0, 0, 0).best.themes,
      );
      if (detected) {
        theme = detected.theme;
        detectedThemeName = detected.detectedThemeName;
      }
    } catch {
      // Best-effort only — fall back to the puzzle's supplied themes.
    }

    return {
      detectedThemeName,
      moveAlg,
      piece,
      theme,
    };
  });

  const primaryTheme = moveNarratives[0]?.theme ?? fallbackTheme;
  const T = getThemeTemplates(primaryTheme);

  // Parse position for piece info
  const chess = new Chess(input.fen);
  const side = getSideToMove(input.fen);

  // Get first solution move piece info
  const firstMoveUci = input.solutionMoves[0] ?? "";
  const firstMoveAlg = moveNarratives[0]?.moveAlg
    ? moveNarratives[0].moveAlg
    : "the best move";
  const firstPiece = moveNarratives[0]?.piece
    ? moveNarratives[0].piece
    : "piece";

  const wrongMoveLabel = input.wrongMove ?? "the tempting move";
  const wrongMovePhrase = input.wrongMove
    ? uciToAlg(input.wrongMove, chess)
    : wrongMoveLabel;

  const opponentDevChess = new Chess(input.fen);
  let opponentDevLabel = input.opponentDeviation ?? "another move";
  let opponentDevAction = "play something else";
  let opponentDevResponse = "keep the pressure on";

  try {
    const firstSolutionMove = input.solutionMoves[0];
    if (firstSolutionMove) {
      opponentDevChess.move(uciToMoveObj(firstSolutionMove));
    }

    if (input.opponentDeviation) {
      opponentDevLabel = uciToAlg(input.opponentDeviation, opponentDevChess);
      opponentDevAction = uciToAction(
        input.opponentDeviation,
        opponentDevChess,
      );

      if (input.opponentDeviationResponse) {
        const responseChess = new Chess(opponentDevChess.fen());
        responseChess.move(uciToMoveObj(input.opponentDeviation));
        opponentDevResponse = uciToAlg(
          input.opponentDeviationResponse,
          responseChess,
        );
      }
    }
  } catch {
    // Keep fallback phrasing if line reconstruction fails.
  }

  const vars: Record<string, string> = {
    piece: firstPiece,
    move: firstMoveAlg,
    wrongMove: wrongMovePhrase,
    side,
    escape: "stepping away",
    response: opponentDevResponse,
    opponentDev: opponentDevLabel,
  };

  const intro = fill(pick(T.intros, rng), vars);

  // Pick 2 distinct hints
  const shuffledHints = [...T.hints].sort(() => rng() - 0.5);
  const hints = shuffledHints.slice(0, 2).map((h) => fill(h, vars));

  const thinkingPrompt = pick(THINKING_PROMPTS, rng);

  const moveHints = moveNarratives.map((narrative) => {
    const hintVars = {
      ...vars,
      move: narrative.moveAlg,
      piece: narrative.piece,
    };
    const detectedHint = buildDetectedHint(
      narrative.detectedThemeName,
      narrative.piece,
    );
    if (detectedHint) {
      return detectedHint;
    }
    return fill(pick(getThemeTemplates(narrative.theme).hints, rng), hintVars);
  });

  // Per-move commentary
  const moveComments = moveNarratives.map((narrative) => {
    const moveVars = {
      ...vars,
      move: narrative.moveAlg,
      piece: narrative.piece,
    };
    return fill(
      pick(getThemeTemplates(narrative.theme).moveComments, rng),
      moveVars,
    );
  });

  const wrongMoveQuestion = input.wrongMove
    ? fill(pick(T.wrongMoveQuestions, rng), vars)
    : "What if you played a different move here? Can you see why it doesn't work?";

  const wrongMoveAnswerTemplate = pick(WRONG_MOVE_ANSWERS.default, rng);
  const wrongMoveAnswer = fill(wrongMoveAnswerTemplate, vars);

  const opponentDevQuestion = input.opponentDeviation
    ? `What if instead of following the line, they ${opponentDevAction} instead?`
    : "What if they tried to resist and played something else?";

  const opponentDevAnswer = input.opponentDeviationResponse
    ? fill(pick(OPPONENT_DEV_ANSWERS, rng), vars)
    : input.opponentDeviation
      ? `If they ${opponentDevAction} instead, you're still winning because the pressure never really goes away.`
      : "If they try something else, the position still stays completely under control.";

  const conclusion = pick(CONCLUSIONS, rng);

  return {
    intro,
    hints,
    moveHints,
    thinkingPrompt,
    moveComments,
    wrongMoveQuestion,
    wrongMoveAnswer,
    opponentDevQuestion,
    opponentDevAnswer,
    conclusion,
  };
}
