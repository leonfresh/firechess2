// Small, fixed excerpt from the public Gothamchess sample report. These routes
// preview the interface; they do not imply a fresh scan or a personal report.
export const SAMPLE_REPORT_URL = "/report/8c8d499e-1f04-4121-aabc-71a818b98ce6";

export type PatternCategory = "Openings" | "Tactics" | "Endgames" | "Brilliants" | "Clock" | "Positional";
export type PreviewPattern = {
  id: string;
  category: PatternCategory;
  title: string;
  opening: string;
  fen: string;
  played: string;
  best: string;
  from: string;
  to: string;
  context: string;
  explanation: string;
  habit: string;
  hint: string;
  severity: string;
  promotion?: string;
  gameUrl?: string;
  tags?: string[];
};

export const PATTERNS: PreviewPattern[] = [
  {
    id: "larsen", category: "Openings", title: "Develop before you attack",
    opening: "Nimzowitsch–Larsen Attack", fen: "rnbqkb1r/pppp1ppp/4pn2/8/8/1P6/PBPPPPPP/RN1QKBNR w KQkq - 0 3",
    played: "g4", best: "e3", from: "e2", to: "e3", context: "Position reached 3 times · White to move",
    explanation: "The early g-pawn push leaves your king exposed while your pieces are still on their starting squares. e3 opens a path for the bishop and supports your development.",
    habit: "Before starting a flank attack, check whether your king and minor pieces are ready.",
    hint: "Which pawn move opens a diagonal for your f1 bishop?", severity: "Recurring pattern",
  },
  {
    id: "reti", category: "Openings", title: "Challenge the center",
    opening: "Réti Opening", fen: "rnbqkbnr/pppp1ppp/4p3/8/8/5NP1/PPPPPP1P/RNBQKB1R b KQkq - 0 2",
    played: "g5", best: "c5", from: "c7", to: "c5", context: "Same move played 3 times · Black to move",
    explanation: "Pushing g5 weakens the squares around your king. c5 takes space and challenges the center without committing your kingside pawns.",
    habit: "Meet a quiet opening with central space and development, then choose a plan.",
    hint: "Advance the c-pawn two squares to contest d4.", severity: "Recurring pattern",
  },
  {
    id: "mate", category: "Tactics", title: "Look for the forcing finish",
    opening: "Missed checkmate · Game 108, move 37", fen: "6k1/2p2p1p/2P1p1b1/4Q3/P7/8/1Pq5/K1Rr4 b - - 0 37",
    played: "Qb1+", best: "Qxa4#", from: "c2", to: "a4", context: "Missed mate in one · Black to move",
    explanation: "Qb1+ gives check, but Qxa4 ends the game. The queen attacks along the a-file while your other pieces take away the king’s escape squares.",
    habit: "When you find a check, take one more look: is there a checkmate?",
    hint: "Your queen can capture a pawn and give mate on the a-file.", severity: "Missed mate",
  },
  {
    id: "rook", category: "Endgames", title: "Keep the rook active",
    opening: "Rook ending · Game 29, move 43", fen: "5R2/p7/2p4P/8/8/4k1p1/PPP4r/2K5 w - - 9 43",
    played: "a4", best: "Re8+", from: "f8", to: "e8", context: "Defensive resource · White to move",
    explanation: "The pawn push lets Black create a mating threat. Re8+ checks the king immediately and keeps your rook involved in the defense.",
    habit: "In a difficult rook ending, look for active checks before making a quiet pawn move.",
    hint: "Slide the rook one file left to check the king.", severity: "Endgame mistake",
  },
];

export const HERO_FEN = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5";
