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
  /** Concept key this question specifically tests (e.g. "fork", "pin", "rookEndgame") */
  motif?: string;
  /** Difficulty tag — used to filter questions to the user's elo level */
  difficulty?: "beginner" | "intermediate" | "advanced";
};

export const QUIZ_BANK: QuizQuestion[] = [
  {
    question: "A fork attacks how many pieces at once?",
    options: ["One", "Two or more", "Exactly three", "All opponent's pieces"],
    answer: 1,
    explanation:
      "A fork is a move where a single piece attacks two or more opponent pieces simultaneously, forcing them to lose material.",
    category: "tactics",
    motif: "fork",
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
    motif: "pin",
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
    motif: "skewer",
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
    motif: "rookEndgame",
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
    motif: "discoveredAttack",
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
    motif: "pawnEndgame",
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
    motif: "pawnEndgame",
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
    motif: "bishopEndgame",
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
    motif: "queenEndgame",
  },
  // ── Motif-specific questions ──────────────────────────────────────────
  {
    question:
      "Which piece executes a fork most naturally due to its unique movement pattern?",
    options: ["Bishop", "Rook", "Knight", "Queen"],
    answer: 2,
    explanation:
      "Knights jump over pieces and reach squares no other piece can reach in one move — their L-shape lets them attack two distant targets simultaneously. Even modest knights can fork kings and queens.",
    category: "tactics",
    motif: "fork",
  },
  {
    question: "A 'royal fork' is especially powerful because:",
    options: [
      "It wins the opponent's queen instantly",
      "The king must move out of check, guaranteeing the other target is captured",
      "It only works in endgames",
      "It requires two knights",
    ],
    answer: 1,
    explanation:
      "When a piece attacks the king (check) alongside another target, the opponent MUST deal with the check first — they cannot save the other piece. A fork with check is almost always winning.",
    category: "tactics",
    motif: "fork",
  },
  {
    question:
      "What is the difference between an absolute pin and a relative pin?",
    options: [
      "An absolute pin uses a rook; a relative pin uses a bishop",
      "An absolute pin is on the king — the piece literally cannot move; a relative pin is on a more valuable piece — moving is legal but losing",
      "Absolute pins are always decisive; relative pins are only useful in endgames",
      "Absolute pins point along files; relative pins point along diagonals",
    ],
    answer: 1,
    explanation:
      "In an absolute pin, the pinned piece cannot legally move because it would expose the king to check. In a relative pin, moving the piece is legal but loses material — the piece 'behind' is simply more valuable.",
    category: "tactics",
    motif: "pin",
  },
  {
    question: "What makes a discovered attack especially dangerous?",
    options: [
      "The attacking piece gains additional squares",
      "The trigger piece makes its own independent threat while the piece behind it fires on a new target — two simultaneous threats",
      "It always results in checkmate",
      "Only the revealed piece attacks; the trigger piece does nothing",
    ],
    answer: 1,
    explanation:
      "A discovered attack creates TWO threats at once: the trigger piece's own move (a check, fork, or capture) AND the long-range piece now firing behind it. The opponent can only address one, so material is gained.",
    category: "tactics",
    motif: "discoveredAttack",
  },
  {
    question:
      "After you threaten a back-rank mate, what is the best preventive move for the opponent?",
    options: [
      "Trade off the rook immediately",
      "Bring a queen to the back rank",
      "Create a 'luft' — advance one kingside pawn to give the king an escape square",
      "Castle queenside",
    ],
    answer: 2,
    explanation:
      "A 'luft' (German for 'air') is a one-square kingside pawn advance (h3/g3 or h6/g6) that creates an escape square. It permanently removes the back-rank mate threat at the cost of a single tempo.",
    category: "tactics",
    motif: "backRankMate",
  },
  {
    question: "What is the tactical goal of a deflection sacrifice?",
    options: [
      "Winning a pawn to simplify to an endgame",
      "Forcing a key defending piece to abandon the square or piece it is protecting",
      "Opening the g-file for a kingside attack",
      "Exchanging your worst piece for the opponent's best",
    ],
    answer: 1,
    explanation:
      "Deflection forces a defender away from a critical post. Once it leaves, you access the square or piece it was guarding. A deflection sacrifice doesn't need to be materially sound — the positional gain is the point.",
    category: "tactics",
    motif: "deflection",
  },
  {
    question: "A piece is 'hanging' when:",
    options: [
      "It is pinned to the king",
      "It has advanced past the 5th rank",
      "It can be captured for material gain — either undefended or inadequately defended",
      "It is blocking one of your own pieces",
    ],
    answer: 2,
    explanation:
      "A hanging piece can be taken profitably. This means either completely undefended, or defended by fewer pieces than are attacking it (making the exchange winning for the attacker). Checking for hanging pieces every move is the fastest way to reduce blunders.",
    category: "tactics",
    motif: "hangingPiece",
  },
  {
    question:
      "Before sacrificing material to crack open the king, what should you count first?",
    options: [
      "How many total pawns each side has",
      "The number of pieces each side has in total",
      "The attackers vs. defenders in the enemy king's zone",
      "How many open files exist on the board",
    ],
    answer: 2,
    explanation:
      "Counting attackers vs. defenders near the king tells you whether you have enough firepower. If your attackers outnumber their defenders by 2+, there is usually a forced breakthrough. If equal, look for a deflection or forcing sequence to tip the balance first.",
    category: "tactics",
    motif: "kingsideAttack",
  },
  {
    question:
      "Where should your rook be placed relative to a passed pawn in a rook endgame?",
    options: [
      "In front of the pawn to slow it temporarily",
      "On an adjacent file for sideways control",
      "Behind the passed pawn — yours or the opponent's",
      "On the 7th rank regardless of pawn position",
    ],
    answer: 2,
    explanation:
      "The rook belongs BEHIND the passed pawn. If it's your pawn, the rook gains power as the pawn advances. If it's the opponent's pawn, placing your rook behind it contains the passer. A rook in front of a passed pawn is passive; behind it is active.",
    category: "endgame",
    motif: "rookEndgame",
  },
  {
    question:
      "The Lucena position is important in rook endgames because it shows how to:",
    options: [
      "Draw against a stronger opponent",
      "Win with rook + pawn vs. lone rook using the 'bridge' technique",
      "Force stalemate from a losing position",
      "Force opposition in king-and-pawn endings",
    ],
    answer: 1,
    explanation:
      "The Lucena position is the key winning blueprint: shelter your king behind the pawn, then 'build a bridge' with your rook to block perpetual checks. Knowing it lets you convert many rook endings that look unclear.",
    category: "endgame",
    motif: "rookEndgame",
  },
  {
    question:
      "In queen + pawn vs. lone queen, why is the winning side's job so difficult?",
    options: [
      "The pawn cannot promote while queens are on the board",
      "The defending queen can give perpetual check, chasing the winning king endlessly",
      "Queens always stalemate in the endgame",
      "The attacking queen loses too much mobility escorting the pawn",
    ],
    answer: 1,
    explanation:
      "In queen + pawn vs. queen, the defending side typically gives perpetual check — chasing the winning king around the board. You must shelter the king (behind a pawn or toward the center) to escape checks and finally promote.",
    category: "endgame",
    motif: "queenEndgame",
  },
  {
    question:
      "In an opposite-coloured bishop endgame, an extra pawn usually means:",
    options: [
      "An easy win — the extra pawn always promotes",
      "A likely draw — the defender's bishop blockades on its own colour and cannot be driven away",
      "The game is decided by king activity alone",
      "You should immediately trade the bishop for the opponent's",
    ],
    answer: 1,
    explanation:
      "Opposite-coloured bishop endgames are famously drawish — even with two extra pawns the defending bishop can blockade on the squares the attacker's bishop cannot reach. Winning requires an unstoppable passed pawn or a direct king-side attack, not just material.",
    category: "endgame",
    motif: "bishopEndgame",
  },
  {
    question:
      "In a same-coloured bishop endgame, where should you place your pawns?",
    options: [
      "On the same colour as your bishop so it defends them",
      "On the opposite colour to your bishop — so they control squares your bishop cannot",
      "As far advanced as possible regardless of colour",
      "Only on central squares (d4/e4/d5/e5)",
    ],
    answer: 1,
    explanation:
      "Pawns on the OPPOSITE colour to your bishop control squares your bishop cannot reach — together they dominate the board. Pawns on the same colour as your bishop are vulnerable to being blockaded by the enemy bishop on the same colour complex.",
    category: "endgame",
    motif: "bishopEndgame",
  },
  {
    question:
      "Why is a knight on the edge of the board considered weak in endgames?",
    options: [
      "It can be captured by pawns more easily on the edge",
      "It controls only 2–4 squares instead of up to 8 from a central position",
      "It cannot reach the opponent's back rank from the rim",
      "It always gets pinned by the enemy rook on the edge",
    ],
    answer: 1,
    explanation:
      "A centralised knight on d4/e5 controls up to 8 squares and dominates both halves of the board. A knight on a1, h1, a8, or h8 controls only 2 squares. In an endgame, where every tempo and square matters, that loss of mobility is often decisive.",
    category: "endgame",
    motif: "knightEndgame",
  },
  {
    question:
      "In a pawn endgame, which squares must your king reach to guarantee the pawn promotes?",
    options: [
      "Any square on the same file as the pawn",
      "The square directly in front of the pawn",
      "The key squares — the three squares two ranks directly ahead of the pawn",
      "Any square in the opponent's half of the board",
    ],
    answer: 2,
    explanation:
      "Every pawn has three 'key squares' two ranks ahead of it. If your king reaches any key square, the pawn promotes regardless of where the enemy king stands. Knowing the key squares tells you precisely what your king must target.",
    category: "endgame",
    motif: "pawnEndgame",
  },
  // ── Intermediate questions (1200–1700 elo) ────────────────────────────
  {
    question: "A 'good bishop' vs a 'bad bishop' — what's the difference?",
    options: [
      "A bishop near the center vs one on the edge",
      "A bishop with open diagonals vs one blocked by its own pawns on the same colour",
      "A light-squared bishop vs a dark-squared bishop",
      "A bishop used for attack vs one used for defence",
    ],
    answer: 1,
    explanation:
      "A 'good bishop' has its own pawns on the OPPOSITE colour, giving it open diagonals. A 'bad bishop' is hemmed in by its own pawns on the same colour complex — reducing it to a tall pawn. Recognising this guides pawn placement for the rest of the game.",
    category: "strategy",
    difficulty: "intermediate",
  },
  {
    question:
      "The Isolated Queen Pawn (IQP) gives the owner which middlegame asset?",
    options: [
      "A permanent passed pawn ready to promote",
      "A strong d5 outpost for pieces and dynamic attacking piece play",
      "Extra material — it counts as two pawns in this structure",
      "Automatic queenside pawn majority",
    ],
    answer: 1,
    explanation:
      "The IQP provides the d5 (or d4) outpost for a knight and creates active, open positions where the piece play typically compensates for the structural weakness. In endgames the IQP usually becomes a target — so the owner should seek activity and attack while pieces are on the board.",
    category: "strategy",
    difficulty: "intermediate",
  },
  {
    question: "The 'principle of two weaknesses' says:",
    options: [
      "Never allow two pawn weaknesses in your own camp",
      "Attack on both wings — once the defender addresses one weakness, you exploit the other",
      "Always create two passed pawns simultaneously",
      "Two isolated pawns cancel each other out structurally",
    ],
    answer: 1,
    explanation:
      "A solid defence can hold against one threat. To break through, create a second weakness far from the first — the defender cannot guard both forever. Zugzwang eventually forces a concession on one or the other side. This technique is the backbone of top-level endgame play.",
    category: "strategy",
    difficulty: "intermediate",
  },
  {
    question: "Nimzowitsch's concept of 'blockade' means:",
    options: [
      "Locking all pawns in the center to prevent exchanges",
      "Placing a piece (ideally a knight) on the square directly in front of a passed pawn to fix and neutralise it",
      "Preventing the opponent from castling via piece pressure",
      "Stacking rooks on the 7th rank",
    ],
    answer: 1,
    explanation:
      "Nimzowitsch's blockade: park a piece — especially a knight — directly in front of an enemy passed pawn. The piece restrains the pawn while simultaneously becoming a powerful outpost. A well-placed blockader can decide the entire game.",
    category: "strategy",
    difficulty: "intermediate",
  },
  {
    question: "'Prophylaxis' in chess means:",
    options: [
      "A forcing sequence that creates two simultaneous threats",
      "Anticipating and preventing the opponent's plan before they can execute it",
      "An opening sacrifice for the initiative",
      "Placing rooks on open files before the opponent does",
    ],
    answer: 1,
    explanation:
      "Prophylaxis (a concept developed by Petrosian) means spending a move to stop the opponent's best plan rather than blindly pursuing your own. In quiet positions this often wins more than an active move — by denying threatening counterplay, you maintain control and eventually outmanoeuvre the opponent.",
    category: "strategy",
    difficulty: "intermediate",
  },
  {
    question: "A 'pawn break' achieves what?",
    options: [
      "Winning a pawn by force with a tactical sequence",
      "Changing the pawn structure to open files, activate pieces, or release a passive bishop",
      "Preventing the opponent from promoting",
      "Promoting a pawn by sacrificing the others around it",
    ],
    answer: 1,
    explanation:
      "A pawn break (like …c5 in the King's Indian or …e5 in the French) disrupts a locked pawn structure. It opens diagonals for bishops, creates outposts, and activates rooks on newly opened files. Knowing which pawn break to play — and when — is a key strategic skill.",
    category: "strategy",
    difficulty: "intermediate",
  },
  // ── Advanced questions (1700+ elo) ────────────────────────────────────
  {
    question: "The Philidor position (R+P vs R endgame) is used to:",
    options: [
      "Win rook vs rook with an extra pawn using a piston technique",
      "Draw as the defender: rook on the 6th rank holds, then swings to the back for perpetual check once the pawn advances",
      "Win by cutting off the enemy king on the 4th rank",
      "Force stalemate from a lost position with a counter-sacrifice",
    ],
    answer: 1,
    explanation:
      "In the Philidor, the defending rook sits on the 6th rank (e.g. Ra6). When the attacker pushes their king forward, the rook drops to the back rank and delivers perpetual check from behind the pawn — forcing a draw. It's the essential drawing technique in R+P vs R.",
    category: "endgame",
    motif: "rookEndgame",
    difficulty: "advanced",
  },
  {
    question: "Triangulation in king-pawn endgames allows you to:",
    options: [
      "Reach the same square in three moves instead of two, losing a tempo to create zugzwang",
      "Triple the king's attacking range by advancing three ranks at once",
      "Form a triangular formation that prevents the opponent from entering",
      "Promote a pawn by triangulating around a defending piece",
    ],
    answer: 0,
    explanation:
      "Triangulation: your king takes 3 moves to reach a square it could reach in 2, while the opponent's king cannot mimic the manoeuvre. This 'wastes' one move, transferring the obligation to move to the opponent and placing them in zugzwang. It only works when there is an odd-even parity difference in the king paths.",
    category: "endgame",
    difficulty: "advanced",
  },
  {
    question:
      "Bishop pawn (a- or h-file) + wrong-colour bishop vs lone king — what is the result with best play?",
    options: [
      "A straightforward win — any extra pawn is enough",
      "A draw — the defending king reaches the corner the bishop doesn't control and cannot be dislodged",
      "A win only if the kings are not yet in opposition",
      "A draw only if the defending king is already in the corner",
    ],
    answer: 1,
    explanation:
      "The 'wrong-colour bishop' draw is one of the most famous endgame exceptions: if the bishop doesn't control the queening square colour, the defending king hides in the corner of the opposite colour. Stalemate becomes unavoidable. Even a world champion cannot win this — it's a theoretical draw.",
    category: "endgame",
    difficulty: "advanced",
  },
  {
    question:
      "A 'trebuchet' (mutual zugzwang) in a king-and-pawn endgame means:",
    options: [
      "A rook on the 7th rank controlling two open files simultaneously",
      "Whoever is to move loses their pawn — both kings hold the opposing pawn but must step aside on their turn",
      "A bishop controlling both diagonals via a centralised outpost",
      "Three connected passed pawns that always beat a rook",
    ],
    answer: 1,
    explanation:
      "A trebuchet is a mutual zugzwang where the side to move must give way, losing their pawn and (usually) the game. You force an opponent into a trebuchet by using triangulation to transfer the move to them. Recognising this structure instantly tells you whether a king-and-pawn endgame is won.",
    category: "endgame",
    difficulty: "advanced",
  },
  {
    question:
      "In the famous Saavedra endgame study, why does the pawn promote to a rook instead of a queen?",
    options: [
      "A rook is faster at delivering checkmate",
      "Promoting to a queen allows a stalemate trick — giving up the rook with check creates stalemate; promoting to a rook avoids this and wins",
      "A rook covers more endgame squares than a queen in that exact position",
      "The queen would be immediately captured by the defending rook",
    ],
    answer: 1,
    explanation:
      "c8=Q?? allows the defender to sacrifice their rook with check on c6 (or a8), leaving the queen pinned against a stalemate. c8=R! sidesteps the stalemate while threatening Ra8# — and if the rook moves to avoid mate, White picks it up. Saavedra is the classic lesson that underpromotion is sometimes the ONLY winning move.",
    category: "endgame",
    difficulty: "advanced",
  },
  {
    question:
      "Two connected passed pawns on the 6th rank vs a lone rook — who is winning?",
    options: [
      "The rook easily holds — two-vs-one is manageable",
      "The pawns win — they are generally stronger than a rook at that stage",
      "The result depends entirely on which side has the move",
      "It's always a draw with precise defensive play",
    ],
    answer: 1,
    explanation:
      "Connected passed pawns on the 6th rank are typically stronger than a rook. The rook must deal with both simultaneously — stopping one lets the other advance. This endgame caught out even world-class players: pawns on e6 and f6 typically win against a lone rook unless there is an immediate perpetual check or stalemate resource.",
    category: "endgame",
    difficulty: "advanced",
  },
  {
    question:
      "Against the Isolated Queen Pawn (IQP), what is the classic strategic recipe?",
    options: [
      "Trade all pieces immediately and reach a pure pawn endgame",
      "Blockade the IQP with a piece on d5, trade off the IQP owner's active pieces, then attack the pawn as material decreases",
      "Attack the king directly while ignoring the IQP",
      "Push your own center pawns to neutralise the IQP's space advantage",
    ],
    answer: 1,
    explanation:
      "The correct IQP defence (mastered by Petrosian and Karpov): place a knight on d5 to blockade, eliminate the opponent's most active attacking pieces, and steer into an endgame where the isolated pawn is an unmovable target. An extra piece safely blockading the IQP often decides the game in the endgame.",
    category: "strategy",
    difficulty: "advanced",
  },
  {
    question: "K+B+N vs K is:",
    options: [
      "A draw — bishop and knight together cannot force checkmate",
      "A forced win, but technically demanding — checkmate must happen in the corner matching the bishop's colour",
      "An easy win in under 20 moves with any technique",
      "A win only if the defending king is already on the edge",
    ],
    answer: 1,
    explanation:
      "K+B+N vs K is a forced win but one of the hardest fundamentals to master. Checkmate only occurs in the corner that matches the bishop's colour, requiring precise coordination between the knight and bishop to drive the king there. The 'W-manoeuvre' to reroute the knight is the key technique, and it can require close to 50 moves.",
    category: "endgame",
    difficulty: "advanced",
  },
];

const DIFFICULTY_RANK: Record<
  NonNullable<QuizQuestion["difficulty"]>,
  number
> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/**
 * Return `count` quiz questions seeded by `seed`.
 * When `difficulty` is provided, questions above the user's level are excluded
 * so advanced users see hard questions and beginners don't see deep endgame theory.
 */
export function getDailyQuizQuestions(
  count: number,
  seed: number,
  difficulty?: QuizQuestion["difficulty"],
): QuizQuestion[] {
  let pool = [...QUIZ_BANK];

  if (difficulty) {
    const userRank = DIFFICULTY_RANK[difficulty];
    // Keep questions at or below the user's level; untagged questions are always shown
    const filtered = pool.filter(
      (q) => !q.difficulty || DIFFICULTY_RANK[q.difficulty] <= userRank,
    );
    // Only apply the filter if it leaves enough questions to choose from
    if (filtered.length >= Math.max(count * 2, 5)) pool = filtered;
  }

  let s = seed;
  for (let i = pool.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
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
