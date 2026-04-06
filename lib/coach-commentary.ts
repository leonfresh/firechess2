/**
 * coach-commentary.ts
 *
 * Generates Naroditsky-style instructional coaching narration for chess moves.
 * Built on top of position-explainer.ts — adds themed analogy pools and
 * educational framing for each tactical/positional motif.
 */

import { Chess, type Square } from "chess.js";
import { explainMoves } from "./position-explainer";

/* ── Types ── */

export type MoveClassification =
  | "brilliant"
  | "best"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export interface CoachMove {
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  color: "w" | "b";
  moveNumber: number;
  cpLoss: number;
  classification: MoveClassification;
  bestMoveSan: string | null;
  bestMoveUci: string | null;
  evalBeforeWhite: number;
  evalAfterWhite: number;
}

export interface CoachNarration {
  text: string;
  isKeyMoment: boolean;
  keyMomentLabel: string | null;
  themes: string[];
}

/* ── Phase detection ── */

function detectGamePhase(fen: string): "Opening" | "Middlegame" | "Endgame" {
  try {
    const chess = new Chess(fen);
    const board = chess.board();
    let total = 0;
    let queens = 0;
    for (const row of board) {
      for (const sq of row) {
        if (!sq) continue;
        total++;
        if (sq.type === "q") queens++;
      }
    }
    if (total > 24) return "Opening";
    if (total <= 12 || queens === 0) return "Endgame";
    return "Middlegame";
  } catch {
    return "Middlegame";
  }
}

/* ── Theme openers — mix of punchy one-liners and fuller explanations ── */

const THEME_OPENERS: Record<string, string[]> = {
  Fork: [
    "Two pieces attacked at once — only one can be saved.",
    "One move, two targets, one impossible dilemma. That is the fork.",
    "Look at the geometry. A single piece sits at a crossroads, pointing at two targets simultaneously.",
    "The fork is chess at its most brutal. The opponent can only save one piece, so something falls.",
    "Classic fork. Two threats created with a single move — the opponent literally cannot solve both.",
    "When a move attacks two pieces at once, someone is losing material. That is the whole idea.",
  ],
  "Knight Fork": [
    "The knight fork — the most common tactical pattern at every level of chess.",
    "That L-shape is lethal when two targets line up correctly.",
    "Knights are the only pieces that jump over others, which is exactly why forks like this are so hard to see coming.",
    "The knight fork is everywhere in club chess. The knight's unusual movement means it attacks squares that no other piece can cover simultaneously.",
    "Classic knight fork. The defending side never sees this coming because the knight's path is so counterintuitive.",
    "When a knight hops to the right square, it can point at a king and a rook at the same moment. That is the nightmare every chess player fears.",
  ],
  Pin: [
    "The pinned piece is frozen solid — it cannot move without losing something behind it.",
    "A pin is one of the most powerful restrictions in chess. That piece wants to move, but it simply cannot.",
    "Think of a pin like a parking ticket. The piece is stuck there. It exists on the board but cannot participate.",
    "Pins reduce the value of a piece to almost nothing. You cannot use what you cannot move.",
    "The pin hits immediately and keeps doing damage for as long as it lasts. Pile pressure on the immobilized piece.",
    "Notice the line. The pinned piece shields something more valuable behind it — that is the whole point.",
  ],
  Skewer: [
    "Attack the most valuable target. It runs. Then you take whatever was hiding behind it.",
    "A skewer is the reverse of a pin — go after the high-value piece first, and collect the lesser one behind it.",
    "The skewer works because the opponent has no choice. Save the king or queen, and pay with the piece sheltering behind it.",
    "Force the more valuable piece to flee, then clean up what is left behind. Elegant and effective.",
    "Reverse pin. The big piece moves to safety, and the smaller piece that was hiding behind it has nowhere to go.",
  ],
  "Discovered Attack": [
    "One move, two threats. When that piece moved, it uncovered a second attack from the piece behind it.",
    "Discovered attacks are devastating because the opponent must solve two problems at once — which is usually impossible.",
    "The front piece moves. The rear piece suddenly attacks. Two threats launch in a single turn.",
    "This is one of the most powerful weapons in chess. The moving piece creates one threat, the piece it uncovers creates another.",
    "Notice what was behind that piece. By moving out of the way, a second attack is revealed — and now there are two things to deal with simultaneously.",
  ],
  "Discovered Check": [
    "Move one piece — reveal a check from the piece behind it. The moving piece gets to do whatever it wants, because the check must be answered first.",
    "The beauty of a discovered check: the moving piece can capture, threaten, or jump to any square it likes. The king has to deal with the check before anything else.",
    "A check from behind. The moving piece is completely free to create havoc elsewhere because the opponent must immediately address the check.",
    "Discovered check — one of the most forcing sequences in chess. Two threats, one of which cannot be ignored.",
  ],
  "Double Check": [
    "Two pieces give check at the same time. The only legal move is to move the king — you cannot block or capture both attackers.",
    "Double check. You cannot block it. You cannot capture both pieces. The king must run.",
    "When two pieces check simultaneously, it is one of the most forcing positions in all of chess. The king has no option but to move.",
    "Double check — and the king has nowhere comfortable to go. This pattern leads directly to checkmate more often than not.",
  ],
  "Back Rank": [
    "The king is trapped behind its own pawns. If a rook or queen reaches the back rank, there is no escape.",
    "Back rank weakness — the most common way games end at every level. Always give your king a way out.",
    "The king looks safe, but it is a prisoner of its own pawn shield. One heavy piece on the back rank ends the game.",
    "This is why you make a luft — push one of those pawns so the king has an escape square. Without it, the back rank is a ticking time bomb.",
    "The back rank mate is the most common oversight in casual chess. The pawn cage that protects the king also traps it.",
  ],
  "Back-Rank Mate": [
    "Back-rank checkmate — the king is surrounded by its own pawns and has nowhere to run.",
    "The pawns that were supposed to protect the king ended up being its prison. Classic back-rank mate.",
    "Checkmate on the back rank. Remember this every time you castle — create an escape square before it is too late.",
    "The king, smothered by friendly pawns, cannot escape. This is the punishment for forgetting to push h3 or g3.",
  ],
  "Hanging Piece": [
    "That piece is just hanging — undefended and free to take.",
    "A hanging piece in chess is like an unlocked door. Someone will walk through it.",
    "Every undefended piece is a target. All the opponent needs is a forcing sequence to exploit it.",
    "One unprotected piece can unravel an entire position. In chess, every piece needs a guardian.",
  ],
  "Trapped Piece": [
    "Trapped. No safe squares left — that piece is as good as gone.",
    "A trapped piece is almost worse than a lost piece, because it ties down defensive resources while contributing nothing.",
    "The piece has no escape. The opponent can take their time building a net around it.",
    "When a piece runs out of safe moves, it becomes a ghost — on the board physically but unable to affect the game.",
  ],
  Sacrifice: [
    "Material goes down, but the position improves dramatically. That is the logic of a sacrifice.",
    "Giving up material to gain something you cannot count — initiative, king exposure, a decisive attack.",
    "Chess is not just counting pieces. Sometimes a position is worth more than the material it contains.",
    "A sacrifice. The compensation is not immediate, but the pieces left on the board will prove to be more powerful than what was given away.",
    "The boldest statement in chess: I give you material because my position is so superior it does not matter.",
    "Material sacrifices are bets on the position. The attacker says: my pieces will be worth more through threats and activity than through raw counting.",
  ],
  "Exchange Sacrifice": [
    "A rook goes, but what is gained is worth more — an outpost, an attack, or a dominant piece.",
    "The exchange sacrifice: giving up a rook for a bishop or knight when the minor piece simply out-values the rook in that specific position.",
    "Petrosian built his entire career around this idea: a rook is not automatically worth more than a minor piece. It depends on the position.",
    "Rook for a minor piece. On paper it looks wrong. In this position it is exactly right.",
    "An exchange sacrifice is one of the most sophisticated weapons in chess. The question is never what it is worth in the abstract — it is what it is worth here.",
  ],
  "Winning Exchange": [
    "Trading a lesser piece for a more valuable one. Small gains compound over the course of a game.",
    "A favorable exchange — and those small material surpluses decide games at the highest level.",
    "Win an exchange, convert the advantage. It sounds mechanical, but this is how games are actually won.",
  ],
  "Losing Exchange": [
    "An unfavorable trade — giving up more than received. If there is no compensation, that material difference will be felt.",
    "The exchange goes the wrong way. Was there something concrete gained? If not, the material deficit is real.",
    "Giving up more material than you receive. Sometimes positional compensation justifies it — but that has to be proven over the rest of the game.",
  ],
  "Passed Pawn": [
    "A passed pawn is a permanent advantage. It can only get stronger from here.",
    "Think of a passed pawn like a candidate heading for promotion — the closer it gets to the eighth rank, the more your opponent has to commit to stopping it.",
    "No enemy pawn can ever block or capture this pawn. That makes it a long-term threat that never goes away.",
    "Passed pawns follow the same principle as a snowball rolling downhill: the further they advance, the more dangerous they become.",
    "The pawn is passed, and it is going to require serious defensive resources to deal with. That means the opponent's pieces are tied down.",
  ],
  "Advanced Pawn": [
    "A pawn this deep in enemy territory demands constant attention — and that attention comes at a cost.",
    "Every rank an advanced pawn climbs, the opponent's options narrow.",
    "The opponent must now deal with this pawn, which means their pieces cannot be doing anything else.",
    "An advanced pawn is like a guest who has outstayed their welcome — it cannot be ignored, but removing it is expensive.",
  ],
  Promotion: [
    "The pawn makes it. A new queen, and the game is over.",
    "Queening a pawn instantly transforms the material balance. The entire game was leading to this.",
    "Promotion — after all that work escorting the pawn forward, it finally gets its reward.",
    "A new queen enters the board. The initiative has completely shifted.",
  ],
  Underpromotion: [
    "Promoting to a knight instead of a queen. This is not a mistake — it is precision.",
    "Underpromotion. It looks strange, but a queen here would create stalemate or miss a critical threat. The knight is exactly right.",
    "The surprising choice — not a queen, but a knight. Sometimes the smaller piece is the correct one.",
  ],
  Castling: [
    "The king reaches safety and a rook enters the game. Two problems solved with one move.",
    "Castling — king safety and rook activation at the same time. Do this as early as the position allows.",
    "The single most important moment in most openings. The king gets tucked away, the rook steps toward activity.",
    "Castle early, castle often. Getting the king to safety before complications arise is a fundamental chess habit.",
  ],
  "Exposed King": [
    "The king is exposed. Open files, missing pawn cover — the opponent does not need much to start an attack.",
    "An exposed king is a ticking clock. Lines will open, pieces will arrive, and without cover there is no way to stop it.",
    "Without a pawn shield, the king becomes a target. Open or semi-open files nearby will be occupied soon.",
    "This king is naked in the center. In chess, that is a problem that compounds with every move.",
  ],
  "Weakening Move": [
    "Pawn moves are permanent. Every advance leaves squares behind it forever unprotected.",
    "That pawn move created a hole — a square the pawn can never return to defend. Expect a piece to land there.",
    "Once a pawn advances, it cannot go back. The weakness created here will exist for the rest of the game.",
    "Every pawn push is a double-edged sword. Ground gained in front, weakness left behind.",
  ],
  Development: [
    "Undeveloped pieces lose games. Getting them out early is not optional.",
    "Development is the currency of the opening — and this is making an investment.",
    "Every unmoved piece is a frozen asset. The opening phase is about mobilizing all of them before the fight starts.",
    "In the opening, tempo is everything. A piece developed now is a piece that can participate in the coming fight.",
  ],
  "Center Control": [
    "Controlling the center is the core objective of the opening. Pieces in the center cover the most ground.",
    "The center is the most valuable real estate on the board. Whoever dominates d4, d5, e4, and e5 tends to control the game.",
    "Central squares give pieces maximum reach. That is why every opening principle traces back to controlling them.",
    "Pieces in the center can swing to any part of the board quickly. Pieces on the edge take too long to get involved.",
  ],
  "Open File": [
    "Open files are highways for rooks. Seize them before the opponent does.",
    "Rooks on open files. One of the most basic and most important concepts in the middlegame.",
    "An open file is where rooks become dominant pieces. Put them there and watch what happens.",
    "The side that controls open files has a structural advantage that never fades — rooks can invade, double up, and reach the seventh rank.",
  ],
  Outpost: [
    "A piece on an outpost square cannot be chased away by a pawn — and that makes it enormously powerful.",
    "An outpost: a square the opponent's pawns can never attack. A knight here can be the strongest piece on the board.",
    "Knights love outposts. Planted on a central square with no pawn to threaten them, they can dominate entire positions.",
    "Outpost pieces are long-term advantages. You plant them, they stay, and the opponent has to live with them forever.",
  ],
  "En Passant": [
    "En passant — one of chess's most surprising rules. The window to capture is exactly one move.",
    "The en passant opportunity lasts for precisely one move. Use it now or lose the right forever.",
    "If a pawn advances two squares past an enemy pawn, it can be captured as if it had moved only one square — but only immediately.",
  ],
  "Attacking f2/f7": [
    "The f7 pawn is the most vulnerable square in Black's position — defended only by the king before castling.",
    "Targeting f2 or f7 exploits a fundamental structural weakness. Sharp players probe this square immediately.",
    "The f7 pawn is barely defended and sits next to the king. A successful attack there often ends the game early.",
    "Before castling, f2 and f7 are protected exclusively by the king. Any queen or bishop pointed at those squares creates immediate pressure.",
  ],
  "Overloaded Piece": [
    "One piece is trying to defend two things at once — and that is impossible.",
    "Overloaded defender. Force it to give up one task and the other target collapses.",
    "The trick is to find the piece doing two jobs, then attack both things it is guarding. Something has to give.",
    "When a single defender is responsible for two targets simultaneously, one of those targets is going to fall.",
  ],
  "Arabian Mate": [
    "Rook and knight, working together — the Arabian mate.",
    "The Arabian mate: one of the oldest named mating patterns in chess. Rook controls the line, knight delivers the blow.",
    "Rook and knight in perfect harmony to corner the king. One of the most elegant finishes in the game.",
  ],
  "Smothered Mate": [
    "The smothered mate. A knight delivers checkmate and the king cannot move because its own pieces are in the way.",
    "The king is smothered by its own army — checkmate delivered by a knight. A stunning way to finish a game.",
    "One of the most celebrated patterns in chess: the king, walled in by friendly pieces, cannot escape a knight check.",
    "The smothered mate. The victim's own pawns and pieces become the prison. The knight just closes the door.",
  ],
  "Boden's Mate": [
    "Boden's mate — two bishops on crisscrossing diagonals, and the king has nowhere to run.",
    "Two bishops, two diagonals, one checkmate. Boden's mate is one of the most aesthetically beautiful finishes in chess.",
  ],
  "Anastasia's Mate": [
    "Anastasia's mate: rook and knight working along an edge file, with the king's own pieces blocking escape.",
    "Rook and knight, edge file, king hemmed in by its own allies — that is Anastasia's mate.",
  ],
};

/* ── Good move comments (phase-specific, large pool to avoid repetition) ── */

const GOOD_MOVE_COMMENTS: Record<string, string[]> = {
  Opening: [
    // --- One-liners ---
    "Active. Clean. Correct.",
    "Piece out. One step closer to a safe king.",
    "No wasted moves here.",
    "Clean development. Nothing fancy — just solid.",
    "Principled chess.",
    "Central influence established.",
    "This is how openings are supposed to be played.",
    "Textbook. Every move should do something — develop, control, or prepare to castle — and this does.",
    // --- Two-three sentence ---
    "Good development. Piece activity, central influence, king safety — all boxes checked.",
    "Solid opening play. Develop pieces, control the center, castle early — these three principles never go out of style.",
    "The pieces are pointing toward the center. That is exactly where they belong in the opening.",
    "Notice how this keeps things flexible. The position is not committed yet — just building a foundation.",
    "Sound and principled. The secret to surviving the opening without falling for tricks is not memorizing lines — it is understanding moves like this.",
    "Every opening move should pass a simple test: does it develop a piece, contest the center, or improve king safety? This passes all three.",
    "Clean development. The reason openings are taught through principles rather than lines is because good moves like this naturally flow from understanding.",
    "Opening theory exists for a reason. Not to copy moves blindly, but because moves like this have proven sound after decades of testing.",
    // --- Slightly longer ---
    "Following the three core opening principles: development, center control, king safety. It sounds simple because it is — and because most players still get it wrong.",
    "In chess, every unmoved piece is a frozen asset. Getting pieces out early and toward the center is a habit the best players in the world built before they were strong. This is that habit in action.",
  ],
  Middlegame: [
    // --- One-liners ---
    "Active. Passive pieces lose games.",
    "Simple but purposeful.",
    "Creating problems for the opponent to solve.",
    "The inactive piece becomes active.",
    "Nothing fancy — the best moves rarely are.",
    "Improving the worst piece. That is the Karpov principle.",
    "Good chess.",
    "This is what quiet dominance looks like.",
    // --- Two-three sentence ---
    "Strong. Improves the piece and adds coordination to the position.",
    "Good. Which piece is doing the least? Find it. Activate it. That question drives most good middlegame play.",
    "Solid coordination. The real advantage in chess often comes from having all the pieces working together — not from a single brilliant move.",
    "Purposeful play. Every piece moved should have a reason: a threat created, a weakness targeted, a piece improved. This has a reason.",
    "This increases piece activity and keeps the initiative. In chess, the player with the most active pieces almost always wins.",
    "The position is speaking, and this move listens to it.",
    "If there are no tactics available, improve your worst piece. This is that principle in action.",
    "Not a move you would find in a tactics book, but exactly the kind of move that decides games at the highest level — patient, purposeful, correct.",
    "Prophylactic. Eliminating a potential threat before it materializes — that is advanced thinking.",
    // --- Slightly longer ---
    "The best middlegame moves are often the ones that do the most without looking like much. No fireworks — just better coordination, better activity, and a position that slowly tightens like a vice.",
    "Every good move in the middlegame either creates a threat, improves a piece, or restricts the opponent. This does two of those three things at once.",
    "Accumulation chess. No single moment changes everything, but small advantages compound — a marginally better piece position, a slightly more active rook, a fractionally more secure king. This is how positional games are won.",
  ],
  Endgame: [
    // --- One-liners ---
    "King to the center. The most important endgame principle.",
    "In the endgame, every pawn matters.",
    "Precision. There is no margin for error here.",
    "Technique. Looks simple — takes years to learn.",
    "Every tempo matters in the endgame.",
    // --- Two-three sentence ---
    "Precise endgame technique. Centralize the king and advance every useful pawn — those two ideas win most endgames.",
    "Good endgame decision. When material reduces, the king stops hiding and becomes a fighting piece. This is that moment.",
    "Solid technique. The plan in most endgames is simple in concept and demanding in execution: activate the king, advance passed pawns, cut off the opponent's king.",
    "In the endgame, every tempo and every pawn matters more than in any other phase. This move makes the most of both.",
    "King activity is the most important endgame factor once heavy pieces come off the board. Bring it to the center.",
    "This kind of endgame accuracy separates players who understand what they are doing from those who are just hoping.",
    "The best endgame moves often look unremarkable — quiet, modest, completely correct.",
    // --- Slightly longer ---
    "Converting an advantage in the endgame requires this kind of technical mastery: no shortcuts, no unnecessary complexity, just the most efficient path to the goal.",
    "Zugzwang — being forced to make a weakening move — is around every corner in the endgame. Playing methodically to improve the position while restricting the opponent is the correct approach.",
  ],
};

/* ── Book move comments ── */

const BOOK_COMMENTS = [
  "Established theory.",
  "Mainline.",
  "Both sides are still in well-known territory.",
  "Theory. Every grandmaster has started from openings like this.",
  "Standard opening play — the foundation that more complex ideas are built on.",
  "A principled opening move: development, center control, king safety.",
  "Following well-established principles — there is nothing wrong with that.",
  "This is the most common move in this position, and for good reason.",
  "Book. The theory here is deep and well-tested.",
  "Solid. Nothing dramatic yet — just building the position correctly.",
  "Part of the mainline. Whether the deeper theoretical battles matter here depends on what follows.",
  "Clean and correct. No need to reinvent the wheel in the opening.",
];

/* ── Classification intro lines ── */

const BLUNDER_INTROS = [
  // statement style
  "This is the critical turning point —",
  "Here is where things go wrong:",
  "A key mistake worth studying carefully:",
  "Instructive error — understanding why this fails is a genuine lesson:",
  "This loses material or allows a decisive attack:",
  "The game changes here:",
  "Stop here. This is the moment everything falls apart:",
  "One move undoes a lot of good work —",
  "This is painful to look at, but it is worth studying:",
  "A costly mistake —",
  // rhetorical question style
  "Wait — can this really be true? Unfortunately, yes.",
  "This looks normal. It is not.",
  "At first glance this seems fine. It is not fine at all.",
  "Nothing looks wrong here on the surface — but look closer.",
  "This is the kind of move you play in two seconds and regret for two hours.",
];

const MISTAKE_INTROS = [
  "A significant inaccuracy:",
  "This causes real problems:",
  "An important moment to understand:",
  "Better was available — here is why:",
  "This gives the opponent a meaningful advantage:",
  "Not catastrophic, but definitely not right:",
  "The correct path exists, but this is not it:",
  "A understandable move that turns out to be wrong:",
  "The position required more precision:",
  "This is the kind of inaccuracy that does not look serious — until the opponent punishes it.",
  "One degree off. But in chess, one degree off compounds into a real problem.",
  "It looks reasonable. The computer disagrees, and the computer is correct.",
];

const INACCURACY_INTROS = [
  "Slightly inaccurate:",
  "A small but real subtlety:",
  "This misses a better idea:",
  "An understandable move, but not the most precise:",
  "The position calls for something sharper:",
  "Close, but not quite:",
  "Reasonable, but the best move was available:",
  "A missed opportunity —",
  "The engine finds something better here:",
  "Solid enough, but not optimal:",
];

const BRILLIANT_INTROS = [
  "Exceptional move — take a moment to appreciate this:",
  "Brilliant. Here is why this works:",
  "A fantastic find — not easy to see, but exactly right:",
  "This is the kind of move you study chess to recognize:",
  "Outstanding. The computer agrees, and here is what makes it work:",
  "Stop everything. This is special:",
  "Not the obvious move. Not even close to the obvious move. And yet it is the best move:",
  "The computer loves this. So should you.",
  "This is what chess mastery looks like — the move most players would never consider:",
  "Counterintuitive, deep, and completely correct:",
  "It does not look right at first. That is the point.",
  "A move that would make any grandmaster pause and admire it:",
];

/* ── Key moment label ── */

const KEY_TACTICAL_THEMES = new Set([
  "Fork",
  "Knight Fork",
  "Pin",
  "Skewer",
  "Discovered Attack",
  "Discovered Check",
  "Double Check",
  "Back Rank",
  "Back-Rank Mate",
  "Arabian Mate",
  "Smothered Mate",
  "Boden's Mate",
  "Anastasia's Mate",
  "Sacrifice",
  "Exchange Sacrifice",
  "Promotion",
  "Underpromotion",
  "Overloaded Piece",
]);

const KEY_POSITIONAL_THEMES = new Set([
  "Passed Pawn",
  "Trapped Piece",
  "Exposed King",
  "Weakening Move",
  "Attacking f2/f7",
  "Outpost",
]);

function getKeyMomentLabel(
  classification: MoveClassification,
  primaryTheme: string | undefined,
): string | null {
  if (classification === "brilliant") return "Brilliant!";
  if (classification === "blunder") return "Blunder";
  if (classification === "mistake") return "Mistake";
  if (!primaryTheme) return null;
  if (KEY_TACTICAL_THEMES.has(primaryTheme)) return primaryTheme;
  if (KEY_POSITIONAL_THEMES.has(primaryTheme)) return "Key Moment";
  return null;
}

/* ── Helpers ── */

function pickLine(pool: string[], used: Set<string>): string {
  const unused = pool.filter((l) => !used.has(l));
  const src = unused.length > 0 ? unused : pool;
  const line = src[Math.floor(Math.random() * src.length)];
  used.add(line);
  return line;
}

/** Seeded random in [0,1) — uses a simple hash of move number + san to be deterministic per move */
function stableRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/** 30% of the time, prefix a move announcement like "Nf6 — " or "Look at Nf6." */
function maybeSanPrefix(san: string, seed: number): string {
  const r = stableRandom(seed);
  if (r < 0.15) return `${san} — `;
  if (r < 0.28) return `Look at ${san}. `;
  if (r < 0.38) return `${san}. `;
  return "";
}

/* ── Phase labels to skip when looking for primary theme ── */

const PHASE_LABELS = new Set([
  "Opening",
  "Middlegame",
  "Endgame",
  "Pawn Endgame",
  "Rook Endgame",
  "Bishop Endgame",
  "Endgame",
]);

/* ── Player profiles for famous-game narration ── */

const PLAYER_PROFILES: Record<string, { full: string; style: string }> = {
  Fischer: {
    full: "Bobby Fischer",
    style:
      "Fischer, widely regarded as the greatest technical chess genius of all time, was famous for his relentless precision and uncompromising will to squeeze every last advantage out of any position",
  },
  Kasparov: {
    full: "Garry Kasparov",
    style:
      "Kasparov, perhaps the most dynamic and combative world champion in history, combined volcanic attacking energy with encyclopedic preparation to dominate chess for two decades",
  },
  Karpov: {
    full: "Anatoly Karpov",
    style:
      "Karpov, one of the most precise positional players who ever lived, specialized in the slow suffocation of opponents — accumulating tiny advantages until there was simply no air left in the position",
  },
  Morphy: {
    full: "Paul Morphy",
    style:
      "Morphy, the forefather of modern chess, invented the principle of rapid development and used it to dismantle every opponent of his era with breathtaking combinational play",
  },
  Tal: {
    full: "Mikhail Tal",
    style:
      "Tal, the Magician from Riga, was famous for sacrifices that defied conventional calculation — he created complications so deep that even engines struggle to refute them",
  },
  Capablanca: {
    full: "José Raúl Capablanca",
    style:
      "Capablanca, the Cuban genius who made chess look effortless, had an intuitive grasp of piece activity and endgame technique that has rarely been matched in chess history",
  },
  Botvinnik: {
    full: "Mikhail Botvinnik",
    style:
      "Botvinnik, the patriarch of the Soviet chess school, approached every game with rigorous preparation and positional discipline — a supremely methodical champion",
  },
  Petrosian: {
    full: "Tigran Petrosian",
    style:
      "Petrosian, the Iron Tigran, was a defensive genius who anticipated threats before they materialized and sacrificed the exchange with remarkable frequency to gain lasting positional compensation",
  },
  Spassky: {
    full: "Boris Spassky",
    style:
      "Spassky was one of the most versatile world champions — equally capable of brilliant attacks, resourceful defense, and deep positional play",
  },
  Carlsen: {
    full: "Magnus Carlsen",
    style:
      "Carlsen, dominant at the top for over a decade, is renowned for his ability to convert microscopic advantages into wins and his almost supernatural feel for piece activity",
  },
  Anand: {
    full: "Viswanathan Anand",
    style:
      "Anand, one of the fastest thinkers in chess history, was a supremely versatile world champion capable of brilliant attacks or extraordinary defensive resourcefulness",
  },
  Kramnik: {
    full: "Vladimir Kramnik",
    style:
      "Kramnik, who famously dethroned Kasparov with the Berlin Defense, was celebrated for deep structural understanding, precision in maneuvering, and an almost impenetrable defense",
  },
  Topalov: {
    full: "Veselin Topalov",
    style:
      "Topalov was an aggressive and creative player who thrived in sharp, double-edged positions and was always willing to sacrifice material for attacking chances",
  },
  Nakamura: {
    full: "Hikaru Nakamura",
    style:
      "Nakamura, one of the top players in the world, is known for his tactical sharpness, creative opening preparation, and fierce competitive fire",
  },
  Caruana: {
    full: "Fabiano Caruana",
    style:
      "Caruana is celebrated for his exhaustive preparation, technical precision, and ability to navigate the most complex middlegame structures",
  },
};

function resolvePlayer(
  nameField: string,
): { full: string; style: string } | null {
  if (!nameField) return null;
  for (const [key, profile] of Object.entries(PLAYER_PROFILES)) {
    if (nameField.toLowerCase().includes(key.toLowerCase())) return profile;
  }
  // Normalize "Last, First" → usable short name
  const comma = nameField.indexOf(",");
  if (comma > 0) return { full: nameField.slice(0, comma).trim(), style: "" };
  return { full: nameField.split(" ")[0] ?? nameField, style: "" };
}

/* ── Narrative continuity bridges ── */

const CONTINUITY_AFTER_BLUNDER = [
  "After that key mistake, ",
  "With the position now compromised, ",
  "Following that error, ",
  "In the wake of that blunder, ",
  "The damage is done — now ",
  "After that mistake changes the game, ",
];

const CONTINUITY_AFTER_BRILLIANT = [
  "Building on that excellent move, ",
  "Pressing the advantage, ",
  "Continuing the strong play, ",
  "Maintaining the momentum, ",
  "With the position now clearly better, ",
  "Keeping the pressure on — ",
];

const CONTINUITY_SAME_THEME = [
  "The same motif appears again — ",
  "Notice the pattern repeating. ",
  "Once more, the same tactical idea: ",
  "This theme keeps coming back. ",
];

/* ── Context interfaces ── */

export interface PrevMoveContext {
  classification: MoveClassification;
  themes: string[];
  san: string;
  cpLoss: number;
}

export interface GameContext {
  whiteName?: string;
  blackName?: string;
  year?: number;
}

/* ── Main export ── */

export function generateCoachLine(
  move: CoachMove,
  usedLines = new Set<string>(),
  prevContext?: PrevMoveContext,
  gameContext?: GameContext,
): CoachNarration {
  // Skip silent narration for very early book moves
  if (move.moveNumber <= 2 && move.cpLoss < 5) {
    return { text: "", isKeyMoment: false, keyMomentLabel: null, themes: [] };
  }

  // Get the position explanation from the existing engine
  let explanation;
  try {
    explanation = explainMoves(
      move.fenBefore,
      move.uci,
      move.bestMoveUci,
      move.cpLoss,
      move.evalBeforeWhite,
      move.evalAfterWhite,
    );
  } catch {
    return { text: "", isKeyMoment: false, keyMomentLabel: null, themes: [] };
  }

  const themes: string[] = explanation.played.themes ?? [];
  const phase = detectGamePhase(move.fenBefore);

  // Find primary instructional theme (skip game-phase labels)
  const primaryTheme = themes.find((t) => !PHASE_LABELS.has(t));

  // Decide if this is a key "lesson" moment
  const isKeyMoment =
    move.classification === "blunder" ||
    move.classification === "mistake" ||
    move.classification === "brilliant" ||
    (move.classification === "best" &&
      themes.some((t) => KEY_TACTICAL_THEMES.has(t))) ||
    (move.cpLoss === 0 && themes.some((t) => KEY_TACTICAL_THEMES.has(t)));

  /* ── Book moves: brief theory note ── */
  if (move.classification === "book" && move.cpLoss < 10) {
    const text = pickLine(BOOK_COMMENTS, usedLines);
    return { text, isKeyMoment: false, keyMomentLabel: null, themes };
  }

  const keyMomentLabel = getKeyMomentLabel(move.classification, primaryTheme);
  // Seed for deterministic style choices — different every move, not truly random so TTS sounds
  // natural rather than repeating the same structural format back-to-back
  const seed = move.moveNumber * 7 + (move.color === "w" ? 0 : 3);
  let text = "";

  if (isKeyMoment) {
    /* ── Key moment: classification intro + theme analogy + engine coaching ── */
    let intro = "";
    if (move.classification === "blunder") {
      intro =
        BLUNDER_INTROS[Math.floor(stableRandom(seed) * BLUNDER_INTROS.length)];
    } else if (move.classification === "mistake") {
      intro =
        MISTAKE_INTROS[
          Math.floor(stableRandom(seed + 1) * MISTAKE_INTROS.length)
        ];
    } else if (move.classification === "brilliant") {
      intro =
        BRILLIANT_INTROS[
          Math.floor(stableRandom(seed + 2) * BRILLIANT_INTROS.length)
        ];
    }

    const coaching = explanation.played.coaching ?? "";
    const takeaway = explanation.played.takeaway ?? "";

    // 50% chance to use a shorter theme opener for variety — avoids every key moment being a long lecture
    let themeOpener = "";
    if (primaryTheme && THEME_OPENERS[primaryTheme]) {
      const pool = THEME_OPENERS[primaryTheme];
      // Prefer shorter entries (≤90 chars) roughly half the time
      const short = pool.filter((l) => l.length <= 90);
      const useShort = stableRandom(seed + 5) < 0.45 && short.length > 0;
      themeOpener = pickLine(useShort ? short : pool, usedLines);
    }

    const parts = [intro, themeOpener, coaching, takeaway].filter(Boolean);
    text = parts
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();
  } else if (move.classification === "inaccuracy") {
    /* ── Minor inaccuracy ── */
    const intro =
      INACCURACY_INTROS[
        Math.floor(stableRandom(seed) * INACCURACY_INTROS.length)
      ];
    const coaching = explanation.played.coaching ?? "";
    text = coaching ? `${intro} ${coaching}`.trim() : intro;
  } else {
    /* ── Good/best move: phase comment + optional theme note ── */
    const phasePool =
      GOOD_MOVE_COMMENTS[phase] ?? GOOD_MOVE_COMMENTS["Middlegame"];
    text = pickLine(phasePool, usedLines);

    // Append a theme observation if there is something tactically notable
    if (
      primaryTheme &&
      THEME_OPENERS[primaryTheme] &&
      KEY_TACTICAL_THEMES.has(primaryTheme)
    ) {
      // Use a shorter variant for the theme note when appended to a good-move comment
      const pool = THEME_OPENERS[primaryTheme];
      const short = pool.filter((l) => l.length <= 90);
      const src = short.length > 0 ? short : pool;
      const themeNote = pickLine(src, usedLines);
      text = `${text} ${themeNote}`;
    }

    // 30% chance to prefix with the move name for variety
    const prefix = maybeSanPrefix(move.san, seed);
    if (prefix) text = `${prefix}${text}`;
  }

  /* ── Narrative continuity prefix ── */
  let continuityPrefix = "";
  if (prevContext && text) {
    if (
      prevContext.classification === "blunder" ||
      prevContext.classification === "mistake"
    ) {
      const pool = CONTINUITY_AFTER_BLUNDER;
      continuityPrefix = pool[Math.floor(Math.random() * pool.length)];
    } else if (prevContext.classification === "brilliant") {
      const pool = CONTINUITY_AFTER_BRILLIANT;
      continuityPrefix = pool[Math.floor(Math.random() * pool.length)];
    } else if (
      primaryTheme &&
      prevContext.themes.includes(primaryTheme) &&
      KEY_TACTICAL_THEMES.has(primaryTheme)
    ) {
      const pool = CONTINUITY_SAME_THEME;
      continuityPrefix = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  /* ── Player name injection for key moments in famous games ── */
  let playerPrefix = "";
  if (gameContext && isKeyMoment && text) {
    const moverName =
      move.color === "w" ? gameContext.whiteName : gameContext.blackName;
    if (moverName) {
      const profile = resolvePlayer(moverName);
      if (profile) {
        if (profile.style) {
          playerPrefix = `${profile.full} plays ${move.san} here. ${profile.style}. `;
        } else {
          playerPrefix = `${profile.full} plays ${move.san}. `;
        }
      }
    }
  }

  if (playerPrefix || continuityPrefix) {
    text = `${playerPrefix}${continuityPrefix}${text}`;
  }

  return { text, isKeyMoment, keyMomentLabel, themes };
}

/* ══════════════════════════════════════════════════════════════
   Variation / "What if?" line generation
══════════════════════════════════════════════════════════════ */

/** Detect if the piece that just landed on `toSquare` can be captured in `fenAfter`. */
function detectCapturableSquare(
  fenAfter: string,
  toSquare: string,
): { captureSan?: string } {
  try {
    const chess = new Chess(fenAfter);
    const captures = chess
      .moves({ verbose: true })
      .filter((m) => m.to === (toSquare as Square));
    if (captures.length === 0) return {};
    // Prefer the least-valuable attacker — the most surprising version
    const VAL: Record<string, number> = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };
    captures.sort((a, b) => (VAL[a.piece] ?? 9) - (VAL[b.piece] ?? 9));
    return { captureSan: captures[0].san };
  } catch {
    return {};
  }
}

const MISSED_MOVE_BRIDGES = [
  "Here is what was available — ",
  "Most viewers want to see the winning line here: ",
  "Here is what was missed: ",
  "The engine finds something powerful: ",
  "The key sequence that was overlooked — ",
  "Pause here. This is worth understanding. ",
];

const SACRIFICE_QUESTION_BRIDGES = [
  "Now the question everyone asks — can they take it? ",
  "Can the piece actually be captured? ",
  "What happens if the opponent accepts? ",
  "Here is what most people want to know: what if they take? ",
  "The natural follow-up — what if they accept the piece? ",
];

const BRILLIANT_THREAT_BRIDGES = [
  "If this goes unanswered — ",
  "The threat from here is concrete: ",
  "Here is what the attack looked like if ignored: ",
];

/**
 * Generate a "What if?" variation paragraph for key moments.
 *
 * @param bestLineSans  SAN moves from Stockfish's PV starting at fenBefore
 *                      (i.e., what the engine recommends instead of the played move)
 * @param continuationSans  SAN moves from Stockfish's PV starting at fenAfter
 *                          (i.e., best play continuing from the actual position)
 */
export function generateVariationLine(
  move: CoachMove,
  bestLineSans: string[],
  continuationSans: string[],
): string | null {
  if (!bestLineSans.length && !continuationSans.length) return null;

  const mover = move.color === "w" ? "White" : "Black";
  const s = (n: number) => stableRandom(move.moveNumber * 7 + n);

  /* CASE 1 — Blunder or mistake: show the winning line that was available */
  if (
    (move.classification === "blunder" || move.classification === "mistake") &&
    bestLineSans.length >= 1
  ) {
    const bridge =
      MISSED_MOVE_BRIDGES[Math.floor(s(11) * MISSED_MOVE_BRIDGES.length)];
    const [b0, b1, b2] = bestLineSans;
    const strength =
      move.cpLoss > 400
        ? "the advantage is decisive"
        : move.cpLoss > 200
          ? "the position is winning"
          : "the position is significantly better";

    if (b2) {
      return `${bridge}${b0}. After ${b1}, ${b2} and ${strength}.`;
    } else if (b1) {
      return `${bridge}${b0}. After ${b1}, ${strength}.`;
    } else {
      return `${bridge}${b0} — a move that would have left ${mover} with a ${move.cpLoss > 200 ? "winning" : "significantly better"} position.`;
    }
  }

  /* CASE 2 — Piece on a capturable square (sacrifice or tactic offered) */
  const hangCheck = detectCapturableSquare(move.fenAfter, move.uci.slice(2, 4));
  if (
    hangCheck.captureSan &&
    (move.classification === "brilliant" ||
      move.classification === "best" ||
      move.classification === "good" ||
      move.cpLoss < 30)
  ) {
    const bridge =
      SACRIFICE_QUESTION_BRIDGES[
        Math.floor(s(13) * SACRIFICE_QUESTION_BRIDGES.length)
      ];
    const captureSan = hangCheck.captureSan;

    if (!continuationSans.length) {
      return `${bridge}Taking with ${captureSan} actually loses — the resulting activity and open lines more than compensate for the material.`;
    }

    // Does engine say to take it?
    const engineEndorsesTaking = continuationSans[0] === captureSan;

    if (engineEndorsesTaking) {
      const resp = continuationSans.slice(1, 3).join(", ");
      return `${bridge}Yes — ${captureSan} is the natural try. But after ${resp || "the forced follow-up"}, ${mover} has decisive compensation through the initiative and open lines.`;
    } else {
      const bestDefense = continuationSans[0];
      const follow = continuationSans[1]
        ? `, but even then ${mover} keeps the pressure with ${continuationSans[1]}`
        : "";
      return `${bridge}Taking with ${captureSan} is actually a mistake. The engine says the best defense is ${bestDefense} — declining and trying to consolidate${follow}.`;
    }
  }

  /* CASE 3 — Brilliant move: show the underlying threat */
  if (move.classification === "brilliant" && continuationSans.length >= 1) {
    const bridge =
      BRILLIANT_THREAT_BRIDGES[
        Math.floor(s(17) * BRILLIANT_THREAT_BRIDGES.length)
      ];
    const threat = continuationSans.slice(0, 3).join(" ");
    return `${bridge}${threat} follows, and there is no good defense against it.`;
  }

  return null;
}

export function getPhaseBanner(fen: string, moveNumber: number): string | null {
  const phase = detectGamePhase(fen);
  if (phase === "Opening" && moveNumber === 1) return null; // no banner at start
  return phase;
}

/* ── Summary lesson bullets ── */

export function buildLessonSummary(
  moves: {
    classification: MoveClassification;
    themes: string[];
    san: string;
    moveNumber: number;
    color: "w" | "b";
    narration: string | null;
  }[],
): { moment: string; lesson: string }[] {
  const results: { moment: string; lesson: string }[] = [];

  for (const m of moves) {
    if (!m.narration || m.narration.length < 20) continue;
    if (m.classification === "blunder" || m.classification === "mistake") {
      const side = m.color === "w" ? "White" : "Black";
      const moveStr = `${m.moveNumber}${m.color === "b" ? "..." : "."} ${m.san}`;
      results.push({
        moment: `${side} plays ${moveStr}`,
        lesson: m.narration.split(". ").slice(0, 2).join(". ") + ".",
      });
    }
    if (results.length >= 3) break;
  }

  return results;
}
