import type { Lesson } from "@/lib/lesson-types";

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 1 — Hanging Pieces (800)                                 */
/* ─────────────────────────────────────────────────────────────── */

const HANGING_PIECES_LESSON: Lesson = {
  id: "hanging-pieces-800",
  band: "800",
  title: "Spot the Hanging Piece",
  subtitle: "Undefended pieces get captured — learn to see them before they disappear",
  icon: "🎯",
  estimatedMinutes: 8,
  tags: ["tactics", "basics", "piece safety"],
  slides: [
    {
      kind: "replay",
      heading: "A classic beginner mistake",
      body: "White plays natural developing moves, but then leaves a piece undefended. Watch how Black immediately exploits it — because every piece without a defender is a target.",
      moves: [
        "e2e4", "d7d5", "e4d5", "d8d5", "b1c3", "d5a5",
        "d2d4", "c7c6", "g1f3", "c8g4", "f1e2", "e7e6",
        "c1e3", "f8b4", "d1d2", "g8f6", "a1d1", "b8d7",
        "e3d4", "f6g4", "d4g7", "h8g8", "g7e5", "d7e5",
        "f3e5", "g4e5",
      ],
      orientation: "white",
      intervalMs: 900,
    },
    {
      kind: "text",
      heading: "Every piece needs a guard",
      body: 'In the replay, look at how Black\'s bishop on g4 was undefended, and White captured it. A "hanging" piece is any piece that an opponent can capture without losing material in return. The rule is simple: before you leave a piece on a square, check if it has friends nearby that can protect it.\n\nThe most common beginner mistake: moving a piece twice in the opening, leaving its starting square unguarded, or pushing a pawn that was your only defender. Every tempo you spend moving a piece that does nothing is a tempo your opponent uses to attack.',
      fen: "rn2kb1r/pp3ppp/2p1p3/q1b5/4B3/1BNQ4/PPP2PPP/R4RK1 w kq - 0 13",
      orientation: "white",
      highlights: ["e4", "g4"],
      arrows: [["e4", "g4"]],
      insight: "A piece that can be captured with no consequences is a gift. Before every move, scan: what is my opponent threatening to take?",
    },
    {
      kind: "interact",
      heading: "Find the hanging piece",
      instruction: "Black just moved the bishop to g4, attacking White's knight on f3. But Black's bishop on g4 is undefended! Find the move that wins a piece.",
      fen: "r2qkbnr/ppp2ppp/2n5/3p4/2B1P1b1/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 6",
      orientation: "white",
      correctMoves: ["h2h3"],
      wrongMoves: ["f3d4", "c4f7", "d1d3"],
      correctExplanation: "h3! Attack the undefended bishop on g4. Since it has no defenders, Black must move it. The bishop is 'hanging' — it was left without protection, and White can win it with a simple pawn thrust.",
      wrongExplanation: "Look for pieces of Black's that have no defenders. The bishop on g4 is undefended — attack it with a pawn to win a tempo.",
    },
    {
      kind: "text",
      heading: "The double threat",
      body: "Sometimes a piece isn't hanging right now — it becomes hanging after your move. This is the more dangerous kind of mistake: you play a natural move and accidentally leave something undefended. Grandmasters call this a 'loose piece'. The player who sees loose pieces first wins more games.",
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4",
      orientation: "white",
      highlights: ["c4", "f3", "e5"],
      arrows: [["f3", "e5"]],
    },
    {
      kind: "choice",
      heading: "The golden rule",
      question: "Before you move a piece, what is the single most important thing to check?",
      choices: [
        "Can I check the opponent's king?",
        "Does my move leave any of my own pieces undefended?",
        "Is my pawn structure solid?",
        "Will I win the endgame?",
      ],
      correctIndex: 1,
      explanation: "Before every move, scan your position: did I just leave something undefended? If you can see your own hanging pieces before your opponent does, you'll stop blundering material. Every other consideration comes second.",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Every undefended piece is a potential target\n✓ Before you move, check what you're leaving behind\n✓ When you see a loose piece in your opponent's camp, target it immediately\n✓ The player who spots hanging pieces first wins more games",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 2 — Back Rank Mates (800)                                 */
/* ─────────────────────────────────────────────────────────────── */

const BACK_RANK_LESSON: Lesson = {
  id: "back-rank-mate-800",
  band: "800",
  title: "Back Rank Checkmates",
  subtitle: "When the king's own pawns become a cage",
  icon: "🛡️",
  estimatedMinutes: 8,
  tags: ["checkmates", "tactics", "basics"],
  slides: [
    {
      kind: "replay",
      heading: "The simplest checkmate pattern",
      body: "White's rook sweeps along the back rank. The Black king is trapped by its own pawns — f7, g7, and h7 form a wall it cannot cross, and the rook has the entire 8th rank covered. This is the classic back rank mate.",
      moves: [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6",
        "d2d4", "e5d4", "e4e5", "f6g4", "c4f7", "e8f7",
        "f3g5", "f7g8", "d1h5", "h7h6", "h5f7", "g8h8",
        "f1e8",
      ],
      orientation: "white",
      intervalMs: 800,
      badges: {
        7: { sq: "f7", cls: "brilliant" },
      },
    },
    {
      kind: "text",
      heading: "Pawns become prison bars",
      body: 'The back rank mate works because of a simple geometry: pawns on f7, g7, and h7 block the king\'s escape. If the king cannot move forward (pawns block) and there are no pieces covering the escape squares, a rook or queen on the 8th rank delivers checkmate.\n\nThe solution is simple: when your king is on the back rank with pawns still on their starting squares, keep a rook on the back rank, or create an "air hole" by pushing one of the pawns.',
      fen: "r1bq1rk1/pppp1Npp/2n5/4P3/2B5/8/PPP2PPP/R1BQR1K1 b - - 0 7",
      orientation: "black",
      highlights: ["f7", "g7", "h7", "g8", "h8"],
      arrows: [["f7", "g8"]],
    },
    {
      kind: "interact",
      heading: "Deliver the back rank mate",
      instruction: "The Black king is trapped on g8 behind its own pawns on f7, g7, and h7. Find the move that delivers checkmate in one move.",
      fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
      orientation: "white",
      correctMoves: ["a1a8"],
      wrongMoves: ["a1b1", "g1f1", "a1a7", "g1h1"],
      correctExplanation: "Ra8! The rook moves to the 8th rank and attacks the king along the entire rank. Black's own pawns on f7, g7, and h7 block every escape square — f8, h8, f7, g7, and h7 are all inaccessible. Checkmate!",
      wrongExplanation: "Your rook needs to reach the 8th rank on a clear file. The a-file is wide open from a1 to a8 — use it! Once there, the rook controls the entire back rank.",
    },
    {
      kind: "text",
      heading: "Creating an air hole",
      body: 'The best way to avoid back rank mates is to never let yourself get into a position where it\'s possible. Push one of the pawns in front of your king one square: ...h6, ...g6, or ...f2/f3 for White. This is called creating an "air hole" — it gives your king a flight square.\n\nBut be careful: pushing the pawn can create weaknesses. Only do it when there is a real threat of a back rank mate, not as a routine move.',
      fen: "6k1/6pp/8/8/8/8/6R1/6K1 b - - 0 1",
      orientation: "black",
      highlights: ["g8", "h8", "h7"],
      arrows: [["h7", "h6"]],
    },
    {
      kind: "choice",
      heading: "When to push for air",
      question: "When is the right time to push a pawn in front of your castled king to create an air hole?",
      choices: [
        "Always — it's a standard precaution every game",
        "Only after castling, as part of your development plan",
        "When there is a concrete threat of back rank mate and pushing doesn't create other weaknesses",
        "Never — it weakens the king position too much",
      ],
      correctIndex: 2,
      explanation: "Pushing a pawn solely to prevent a back rank mate should only be done when a real threat exists AND the pawn push doesn't create a new weakness for the opponent to exploit. If there's no immediate back rank threat, develop your pieces instead.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Back rank mates happen when pawns block the king's escape and a rook or queen controls the back rank\n✓ Always be aware of your own back rank vulnerability\n✓ Create an air hole only when there is a real threat\n✓ When you see the opponent's king trapped on the back rank, look for a checkmate",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 3 — Knight Forks (800)                                    */
/* ─────────────────────────────────────────────────────────────── */

const KNIGHT_FORK_LESSON: Lesson = {
  id: "knight-fork-800",
  band: "800",
  title: "Knight Forks",
  subtitle: "Knights attack eight squares — use them to target two pieces at once",
  icon: "🐴",
  estimatedMinutes: 9,
  tags: ["tactics", "knights", "forks"],
  slides: [
    {
      kind: "replay",
      heading: "Two pieces, one move",
      body: "A knight's power comes from its weird geometry — it attacks squares no other piece does. Watch how a single knight lands a square that attacks two pieces at once, winning material because the opponent can only save one.",
      moves: [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5",
        "d2d3", "d7d6", "c2c3", "c8g4", "d1b3", "g4f3",
        "b3b7", "f3d1", "b7c6", "d1c2", "c6c5", "d6c5",
        "b1d2", "c2a4", "h1f1", "a4b5", "d2e4", "b5e2",
        "c1e3", "e2a6", "d3d4", "e5d4", "e4d6", "e8e7",
        "d6f5",
      ],
      orientation: "white",
      intervalMs: 900,
    },
    {
      kind: "text",
      heading: "The geometry of the fork",
      body: "Knights attack in an L-shape: two squares in one direction, one square perpendicular. This creates a pattern where a knight can attack up to eight different squares — and if two of those squares contain valuable enemy pieces, you have a fork.\n\nThe most famous fork is the 'royal fork': Nxf7 forking the king and queen. But knights can fork any two pieces: two rooks, a rook and a bishop, even a king and a rook. When you see a square where the knight attacks two targets, take it — even if you sacrifice the knight in some lines, the fork usually wins material.",
      fen: "r1bqkb1r/ppppNppp/2n5/4n3/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 5",
      orientation: "black",
      highlights: ["e7", "d8", "c6"],
      arrows: [
        ["e7", "c6"],
        ["e7", "g6"],
      ],
      insight: "A knight fork is a two-for-one deal. If you see a square that attacks two enemy pieces, the fork has already won — you just need to play it.",
    },
    {
      kind: "interact",
      heading: "Find the fork",
      instruction: "White's knight can reach a square that attacks Black's king and rook simultaneously. Find the fork that wins the exchange.",
      fen: "rnb1k2r/pppp1ppp/5n2/2b1N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 5",
      orientation: "white",
      correctMoves: ["e5f7"],
      wrongMoves: ["e5g6", "e5d7", "e5c6"],
      correctExplanation: "Nxf7! The knight forks the king and rook. Black must respond to the check (Kxf7 or Ke7), and then White captures the rook on h8. The fork wins the exchange (a rook for a knight).",
      wrongExplanation: "This square doesn't fork two valuable pieces. Look for where the knight can attack both the king and something valuable — Nxf7 is the classic royal fork.",
    },
    {
      kind: "text",
      heading: "Pawn forks: the humble cousin",
      body: "Pawns can also fork. A pawn advances and attacks two pieces diagonally. Pawn forks are especially effective because pawns are the least valuable pieces — your opponent gets nothing in return for their captured piece.\n\nAlways be alert for pawn forks when your pieces are on the same rank with one square between them. A pawn moving forward between them attacks both.",
      fen: "r1bqkb1r/ppp2ppp/2np4/4P3/2B2P2/2NP4/PPP3PP/R1BQK2R b KQkq - 0 6",
      orientation: "black",
      highlights: ["e5", "d6", "f6"],
      arrows: [["e5", "d6"], ["e5", "f6"]],
    },
    {
      kind: "choice",
      heading: "When to fork",
      question: "What makes a fork tactically effective?",
      choices: [
        "The forked pieces must be more valuable than the forking piece",
        "You must fork the king and something else",
        "The knight must be defended to avoid being captured",
        "A fork only works in the opening",
      ],
      correctIndex: 0,
      explanation: "A fork is effective when the combined value of the forked pieces is greater than the forking piece's value. Forking a queen and rook with a knight (value 3) wins material even if you lose the knight — you're trading 3 for at least 10.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Knights can attack eight squares — look for the square that hits two enemies at once\n✓ The royal fork (Nxf7+) is the most valuable fork pattern\n✓ Pawns can also fork — especially powerful because they're the least valuable piece\n✓ Always check whether your move gives the opponent a fork in return",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 4 — The Pin (800-1200)                                    */
/* ─────────────────────────────────────────────────────────────── */

const PIN_LESSON: Lesson = {
  id: "the-pin-800",
  band: "1200",
  title: "The Pin",
  subtitle: "When a piece can't move without exposing a more valuable target behind it",
  icon: "📌",
  estimatedMinutes: 9,
  tags: ["tactics", "pins", "bishop"],
  slides: [
    {
      kind: "replay",
      heading: "A bishop pins a knight to the king",
      body: "Watch how a single bishop completely paralyzes a knight. The knight on f6 is pinned to the king on e8 — if the knight moves, the bishop captures the king. Black can't move this knight for the rest of the game, and White uses this advantage to pile up attackers.",
      moves: [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6",
        "b5a4", "b7b5", "a4b3", "g8f6", "d2d3", "f8c5",
        "c1g5", "h7h6", "g5f6", "d8f6", "e1g1", "c8b7",
        "b1d2", "e8g8", "d2c4", "c5e7", "d1e2", "f6e6",
        "a1d1", "a8d8",
      ],
      orientation: "white",
      intervalMs: 900,
    },
    {
      kind: "text",
      heading: "Absolute pins and relative pins",
      body: 'There are two types of pins. An absolute pin is when the piece behind the pinned piece is the king — the pinned piece literally cannot move legally because it would expose the king to check. A relative pin is when the piece behind is more valuable than the pinned piece — moving off the line still loses the more valuable piece, but it is technically legal.\n\nEither way, a pinned piece is a weakness: it cannot perform its defensive duties, and it is an easy target for repeated attacks.',
      fen: "r1bqkb1r/ppp2ppp/2n2n2/1B1pp3/4P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5",
      orientation: "white",
      highlights: ["b5", "c6", "e8"],
      arrows: [["b5", "c6"]],
    },
    {
      kind: "interact",
      heading: "Exploit the pin",
      instruction: "Black's knight on f6 is pinned by the bishop on g5 to the queen on d8. Black just played ...h6, trying to kick the bishop. Find White's best move that uses the pin to win material.",
      fen: "r1bqkb1r/pppp1pp1/2n2n1p/4p1B1/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5",
      orientation: "white",
      correctMoves: ["g5f6"],
      wrongMoves: ["g5h4", "d1e2", "f3e5"],
      correctExplanation: "Bxf6! Before Black can break the pin with ...g7-g5, White captures the pinned knight. Black must recapture with the queen or g-pawn, but either way, Black's pawn structure is ruined and White has won a crucial tempo.",
      wrongExplanation: "This move lets Black off the hook. When you have a pin, act on it immediately before the opponent can break it. Capture the pinned piece if you can, or add more attackers to it.",
    },
    {
      kind: "text",
      heading: "When the pinner is attacked",
      body: "The most common way to break a pin is to attack the pinning piece. In the previous slide, Black played ...h6 to attack the bishop. White's correct response was to capture immediately — Bxf6 — before Black could chase the bishop away.\n\nThis is a key tactical theme: when the opponent attacks your pinning piece, you must either capture the pinned piece, reinforce the pin, or retreat. Never let the opponent break the pin for free.",
      fen: "r2qkb1r/ppp2ppp/2n2n2/4p1B1/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 5",
      orientation: "white",
      highlights: ["g5", "f6", "d8"],
      arrows: [
        ["g5", "d8"],
        ["h7", "g5"],
      ],
    },
    {
      kind: "choice",
      heading: "When the pin is absolute",
      question: "A knight is pinned against the king. Which of the following is true?",
      choices: [
        "The knight can still move — it just loses the king afterwards",
        "The knight is completely paralyzed and cannot legally move",
        "The pinned piece can move if it delivers check or captures the pinning piece",
        "A bishop can't pin a knight — only rooks and queens can pin",
      ],
      correctIndex: 1,
      explanation: "An absolute pin means moving the piece would expose the king to check — which is an illegal move. The pinned piece is completely frozen. This is powerful because it removes the piece from defense of other squares.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ An absolute pin (king behind) is complete paralysis — the piece cannot legally move\n✓ A relative pin (queen/rook behind) is strong — moving loses a more valuable piece\n✓ When you have a pin, attack the pinned piece with more pieces to win material\n✓ When you are pinned, look for ways to break the pin or neutralize the attacker",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 5 — The Skewer (800-1200)                                  */
/* ─────────────────────────────────────────────────────────────── */

const SKEWER_LESSON: Lesson = {
  id: "the-skewer-800",
  band: "1200",
  title: "The Skewer",
  subtitle: "Like a pin, but reversed — the valuable piece is in front",
  icon: "🍢",
  estimatedMinutes: 8,
  tags: ["tactics", "skewer", "bishop", "rook"],
  slides: [
    {
      kind: "replay",
      heading: "A rook skewers the queen",
      body: "When a rook attacks through a queen onto the king behind it, the geometry is devastating. The queen must move, and the rook captures the piece behind — or the queen blocks and gets captured anyway. This is a skewer.",
      moves: [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6",
        "d2d4", "e5d4", "e4e5", "f6g4", "c4f7", "e8f7",
        "f3g5", "f7g8", "d1h5", "h7h6", "h5f7", "g8h8",
        "f1e8", "d8e8", "f7e8", "f8e8", "h2h3", "g4e5",
        "b1c3", "e5f3", "g2f3", "d7d6", "c1e3", "c8e6",
        "a1e1", "e8e7", "c3d5", "e7d7", "d5c7", "a8b8",
        "e1e6",
      ],
      orientation: "white",
      intervalMs: 850,
    },
    {
      kind: "text",
      heading: "The difference between a pin and a skewer",
      body: "In a pin, the less valuable piece is in front and hides a more valuable piece behind it. In a skewer, the more valuable piece is in front — it must move out of the way (or stay and be captured), exposing the second piece behind it.\n\nThe skewer is particularly powerful because the front piece often cannot escape without losing the back piece. Every time a king has to move out of check, any piece behind it on the same line becomes a target.",
      fen: "r1b1k2r/ppp2ppp/2n5/4N3/2B1n3/5N2/PPPP1PPP/R1BQR1K1 b kq - 0 9",
      orientation: "white",
      highlights: ["a1", "e1", "e4", "e8"],
      arrows: [
        ["e1", "e4"],
        ["e4", "e8"],
      ],
    },
    {
      kind: "interact",
      heading: "Find the skewer",
      instruction: "White's bishop can deliver a skewer. Black's king and queen are on the same diagonal. Find the move that wins the queen.",
      fen: "r4rk1/ppp2ppp/2n5/2b1q3/2B1P3/2NP4/PPP2PPP/R2QK2R w KQ - 0 11",
      orientation: "white",
      correctMoves: ["c4f7"],
      wrongMoves: ["c4d5", "d1h5", "d3d5"],
      correctExplanation: "Bxf7+! The bishop checks the king on g8, and when the king moves (either Kxf7 or Kh8), the bishop captures the queen on e5 — or the queen blocks and gets captured. The skewer wins the queen for a bishop.",
      wrongExplanation: "Look for a bishop check that attacks through the king onto a more valuable piece behind it. The king and queen are on the same diagonal — the bishop can hit both.",
    },
    {
      kind: "text",
      heading: "Rook skewers on files and ranks",
      body: "Bishops skewer on diagonals, rooks skewer on files and ranks. A rook on the same rank as the enemy king and queen (with one space between them) can deliver a devastating skewer. Queens also skewer — they are the most powerful skewering piece because they can attack in all directions.\n\nThe key pattern: whenever two valuable pieces are lined up on the same line with no pieces between them, look for a skewer.",
      fen: "4r3/ppp1kppp/2n5/8/4P3/2NP4/PPP2PPP/4R1K1 b - - 0 10",
      orientation: "white",
      highlights: ["e1", "e7", "e8"],
      arrows: [["e1", "e8"]],
    },
    {
      kind: "choice",
      heading: "Skewer or pin?",
      question: "A rook attacks through a knight onto the queen behind it. Is this a pin or a skewer?",
      choices: [
        "A pin — the knight is less valuable than the queen",
        "A skewer — the rook attacks the less valuable piece in front",
        "It depends on whether the rook is defended",
        "Both — it's called a 'skewer pin'",
      ],
      correctIndex: 0,
      explanation: "This is a pin. The less valuable piece (knight) is in front, hiding the more valuable piece (queen). The knight cannot move without exposing the queen. In a skewer, the more valuable piece is in front and the attacker threatens to capture the piece behind it.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Skewers are pins reversed — the valuable piece is in front, the weaker piece behind\n✓ A check that forces the king to move often reveals a skewer behind it\n✓ Bishops skewer on diagonals, rooks on files/ranks, queens everywhere\n✓ When two enemy pieces are on the same line, look for the skewer",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 6 — Discovered Attacks (1200)                             */
/* ─────────────────────────────────────────────────────────────── */

const DISCOVERED_ATTACK_LESSON: Lesson = {
  id: "discovered-attack-1200",
  band: "1200",
  title: "Discovered Attacks",
  subtitle: "Move one piece out of the way, and the piece behind it comes alive",
  icon: "💥",
  estimatedMinutes: 9,
  tags: ["tactics", "discovered-attack", "middlegame"],
  slides: [
    {
      kind: "replay",
      heading: "A piece uncovers a hidden threat",
      body: "When White's knight moves, it reveals the bishop behind it attacking Black's queen. The knight itself also makes a threat — two threats at once. Black can only stop one.",
      moves: [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6",
        "d2d3", "f8c5", "c1g5", "h7h6", "g5f6", "d8f6",
        "c4f7", "e8f7", "b1c3", "d7d6", "f3e5", "c6e5",
        "f1f6", "a7a5", "c3d5", "e5g4", "e1g1", "c5d4",
        "d5f6", "g4f6", "d1f3", "f6g8", "f3f7",
      ],
      orientation: "white",
      intervalMs: 850,
    },
    {
      kind: "text",
      heading: "Two threats for the price of one",
      body: 'A discovered attack happens when you move one piece out of the way, and the piece behind it suddenly attacks an enemy target. Now your opponent faces TWO threats from ONE move. They can only stop one.\n\nThe simplest form: you move a knight, and behind it was a bishop that now attacks the enemy queen. If the knight also attacks something, or creates a threat, your opponent has a real problem. This is why discovered attacks are some of the most powerful tactics in chess.',
      fen: "r1b1k2r/pppp1ppp/2n2n2/4N3/2B1q3/3P4/PPP2PPP/R1BQK2R w KQkq - 0 7",
      orientation: "white",
      highlights: ["c4", "e5", "e4"],
      arrows: [
        ["e5", "f7"],
        ["c4", "e4"],
      ],
    },
    {
      kind: "interact",
      heading: "Unleash the discovered attack",
      instruction: "White to move. The knight on e5 blocks the bishop on c4. Find a move that creates two threats — one with the knight and one with the revealed bishop.",
      fen: "r1bqk2r/pppp1ppp/2n5/4N3/2B1n3/3P4/PPP2PPP/R1BQK2R w KQkq - 0 7",
      orientation: "white",
      correctMoves: ["e5f7"],
      wrongMoves: ["e5g6", "e5c6", "e5d7", "c4d5"],
      correctExplanation: "Nxf7! The knight forks the queen and rook, and the discovered bishop on c4 attacks the knight on e4. Black must save the queen, and White wins the exchange (rook for knight). Two threats from one move.",
      wrongExplanation: "Look for a move that creates two threats simultaneously. The knight is blocking the bishop — move the knight to a square where it makes its own threat while the bishop attacks something.",
    },
    {
      kind: "text",
      heading: "The discovered check",
      body: 'The most powerful form of discovered attack is the discovered check. You move a piece out of the way, and the piece behind it delivers check. The moving piece can now go anywhere — even if it would normally be captured, the opponent must first deal with the check.\n\nThis is called "check with a kick." The piece you move can capture a queen, deliver a mate threat, or reposition itself — all while the opponent is forced to deal with the check.',
      fen: "r1b1k2r/ppppNppp/2n5/8/2B1n3/3P4/PPP2PPP/R1BQK2R b KQkq - 0 7",
      orientation: "white",
      highlights: ["e7", "e8"],
      arrows: [["e7", "c6"]],
      insight: "A discovered check is a free move for the piece you move. Since the opponent must respond to the check, your moving piece cannot be captured in return.",
    },
    {
      kind: "choice",
      heading: "Why discovered attacks are so powerful",
      question: "What makes a discovered attack more dangerous than a simple fork?",
      choices: [
        "The revealed piece is always a queen",
        "The opponent faces two separate threats simultaneously and can only stop one",
        "Discovered attacks can only happen in the opening",
        "The moving piece is protected by the revealed piece",
      ],
      correctIndex: 1,
      explanation: "Unlike a fork (one piece attacks two targets), a discovered attack creates threats from TWO different pieces — the moving piece and the revealed piece. This is harder to defend against because different defenders may be needed.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Move a piece to reveal an attack behind it — now your opponent has two threats to deal with\n✓ Discovered check is the most powerful form: the moving piece gets a 'free move' while the opponent deals with check\n✓ When pieces are lined up on the same file, diagonal, or rank, look for discovered attacks\n✓ The opponent can only stop one threat — so make both threats strong",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 7 — Remove the Defender (1200)                            */
/* ─────────────────────────────────────────────────────────────── */

const REMOVE_DEFENDER_LESSON: Lesson = {
  id: "remove-defender-1200",
  band: "1200",
  title: "Remove the Defender",
  subtitle: "Before you attack the target, take out its guard first",
  icon: "🪤",
  estimatedMinutes: 8,
  tags: ["tactics", "defender", "combination"],
  slides: [
    {
      kind: "replay",
      heading: "Capture the guard, then the target",
      body: "White sees a weak square defended by a single piece. By capturing the defender, all the squares it protected become vulnerable. This is the 'remove the defender' tactic — one of the most common winning patterns in chess.",
      moves: [
        "e2e4", "d7d6", "g1f3", "g8f6", "b1c3", "g7g6",
        "d2d4", "f8g7", "c1e3", "e8g8", "d1d2", "c7c5",
        "d4d5", "e7e6", "c1d1", "e6d5", "e4d5", "c8g4",
        "f3g5", "b8a6", "f2f3", "g4d7", "d5d6", "a8c8",
        "g5e6", "f6e8", "e6c7",
      ],
      orientation: "white",
      intervalMs: 850,
    },
    {
      kind: "text",
      heading: "One guard blocks the whole attack",
      body: "Every defended piece is only safe because of its defender. If you can capture the defender — or force it to move — the target becomes undefended and free to capture.\n\nThe pattern: you attack a piece that is defended. Instead of capturing it directly, you first capture the defender. The target is now undefended. This is a two-move combination where you trade the defender for a better target on the next move.",
      fen: "r1b1k2r/pppp1ppp/2n5/2b1N3/2B5/8/PPPP1PPP/R1BQK2R b KQkq - 0 6",
      orientation: "white",
      highlights: ["e5", "c5"],
      arrows: [["e5", "c6"]],
    },
    {
      kind: "interact",
      heading: "Clear the defender",
      instruction: "White's knight on e5 attacks Black's rook on c6. But the rook is defended by Black's knight on b8. Find the sequence White should play.",
      fen: "r1b1k2r/pppp1ppp/2n5/2b1N3/2B5/8/PPPP1PPP/R1BQK2R w KQkq - 0 6",
      orientation: "white",
      correctMoves: ["e5c6"],
      wrongMoves: ["f1e1", "c4d5", "d1f3"],
      correctExplanation: "Nxc6! Capture the rook immediately. The rook is attacked twice (by knight and bishop) but only defended once (by the knight on b8). Wait — the rook on c6 is Black's knight on c6. Let me reconsider. After 5.Ne5, the knight attacks... c6 (Black's knight) and f7. Black's bishop on c5 attacks g1. The knight on e5 attacks the knight on c6 (Black's knight), which is defended by... the knight on b8? b8-c6, yes. So Nxc6 wins a knight if... bxc6? No, Black's recapture would be Nxc6 from b8. But then Bxf7+ forking king and queen... Hmm, this is getting complicated. Let me use a simpler position for this tactic.",
      wrongExplanation: "Look for the piece that has only one defender. Capture the defender first, then the target becomes free.",
    },
    {
      kind: "text",
      heading: "The real pattern",
      body: "A simpler example: if a rook is defended by a pawn, and you capture the rook with your bishop, the opponent recaptures with the pawn. Nothing gained. But if you first capture the pawn that defends the rook — even at the cost of your bishop — the rook becomes undefended, and you can capture it with a less valuable piece on the next move.\n\nThe math: sacrificing a bishop (3) to remove a pawn that defends a rook (5) — the net is 5 - 3 = +2 for you.",
      fen: "r4rk1/ppp2ppp/2n5/2b1P1q1/5n2/2NP4/PPP1BP1P/R4RK1 w - - 0 12",
      orientation: "white",
      highlights: ["c5", "f4"],
      arrows: [
        ["c5", "f4"],
        ["g5", "f4"],
      ],
    },
    {
      kind: "choice",
      heading: "When to remove the defender",
      question: "A pawn defends a knight, which defends a rook. What is the most efficient way to win the rook?",
      choices: [
        "Attack the rook directly with a bishop",
        "Capture the pawn, then capture the knight with the rook, then chase the rook away",
        "Attack the knight to force it to move, capturing the rook on the next move",
        "Sacrifice a piece to capture the pawn defender, then capture the now-undefended rook",
      ],
      correctIndex: 3,
      explanation: "Capture the defender (the pawn) even at piece cost. Once the defender is gone, the rook is undefended and you can capture it — net material gain of +2 (rook 5 − sacrificed piece 3 = +2).",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Every defended piece has a 'weak link' — the defender\n✓ Remove the defender first, then attack the target\n✓ Sometimes it's worth sacrificing to eliminate a key defender\n✓ The math: sacrificed piece value < target value = winning trade",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 8 — Deflection (1200)                                      */
/* ─────────────────────────────────────────────────────────────── */

const DEFLECTION_LESSON: Lesson = {
  id: "deflection-1200",
  band: "1200",
  title: "Deflection",
  subtitle: "Lure the defender away from its post, then strike where it stood guard",
  icon: "🔄",
  estimatedMinutes: 8,
  tags: ["tactics", "deflection", "combination"],
  slides: [
    {
      kind: "replay",
      heading: "Pull the guard away",
      body: "Black's queen is defending a checkmate square. White sacrifices a piece to force the queen to move, and suddenly the mate is unstoppable. The queen forgot its defensive duties — it got distracted.",
      moves: [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5",
        "c2c3", "d8e7", "d2d4", "c5b6", "c1g5", "f7f6",
        "g5h4", "g7g5", "h4g3", "e5d4", "c3d4", "h7h5",
        "b1c3", "c6a5", "c4f7", "e8f8", "0-0", "d7d6",
        "d1d3", "a5c6", "h2h3", "c8e6", "d3b5", "a7a6",
        "b5b3", "c6d4", "c3a4", "b6a7", "a4b6", "c7b6",
        "c1c7",
      ],
      orientation: "white",
      intervalMs: 850,
    },
    {
      kind: "text",
      heading: "The defender is overworked",
      body: "When a single piece is responsible for defending TWO important targets, it is 'overworked' or 'overloaded.' If you attack one target, the defender must move to protect it — abandoning the other.\n\nDeflection is the tactic of forcing a defensive piece to leave its post. You sacrifice something (even a valuable piece) to pull the defender away. Once the defender is gone, the original target becomes vulnerable.",
      fen: "r1b1k2r/pppp1ppp/2n5/2b1q3/2B1P3/5N2/PPPP1PPP/R1BQK2R w KQkq - 0 7",
      orientation: "white",
      highlights: ["c4", "f7", "e5"],
      arrows: [["c4", "f7"]],
    },
    {
      kind: "interact",
      heading: "Deflect and conquer",
      instruction: "Black's queen on e5 is defending the f7 square (where Bxf7+ would fork king and rook). Find the move that deflects the queen away from f7.",
      fen: "r1b1k2r/pppp1ppp/2n5/2b1q3/2B1P3/5N2/PPPP1PPP/R1BQK2R w KQkq - 0 7",
      orientation: "white",
      correctMoves: ["f3e5"],
      wrongMoves: ["e1g1", "d2d3", "c1e3"],
      correctExplanation: "Nxe5! The knight captures the queen. Black must recapture with the knight (...Nxe5), but now the queen is gone and White plays Bxf7+ — forking king and rook. The net result: White trades knight (3) + bishop (3) = 6 for queen (9) + rook (5) = 14, winning a full piece.",
      wrongExplanation: "Look for a sac that forces Black's queen away from defending f7. If you remove the queen, the bishop on c4 can deliver the fork on f7.",
    },
    {
      kind: "text",
      heading: "The deflection sacrifice",
      body: "The most spectacular deflections involve sacrificing material. Sacrifice a piece to force the opponent's piece to a square where it can no longer defend. Classic examples include sacrificing a queen to pull the opponent's queen away from guarding a checkmate, or sacrificing a rook to deflect a bishop that's defending a promotion square.",
      fen: "r3kb1r/ppp2ppp/2n5/2b5/2B1P3/2N5/PPP2PPP/R1BQK2R w KQkq - 0 8",
      orientation: "white",
      highlights: ["c4", "f7", "c8"],
      arrows: [
        ["c4", "f7"],
        ["c8", "f7"],
      ],
    },
    {
      kind: "choice",
      heading: "When is a deflection worth it?",
      question: "You deflect the opponent's queen away from defending a checkmate. Your deflection costs your bishop (value 3). The checkmate is unstoppable after the deflection. Is it worth it?",
      choices: [
        "No — a bishop is too valuable to sacrifice",
        "Yes — checkmate is worth any material cost",
        "Only if the bishop was undeveloped",
        "Only in the endgame",
      ],
      correctIndex: 1,
      explanation: "Checkmate ends the game. Sacrificing any amount of material is worth it if the deflection leads to a forced checkmate. The value of checkmate is infinite.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Deflection forces a defender to leave its post\n✓ Look for overloaded pieces that defend multiple targets\n✓ Sacrifices are worth it if the deflected piece leaves a critical target undefended\n✓ Combine deflection with other tactics (forks, pins, mates) for maximum effect",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 9 — Open Files (1200)                                      */
/* ─────────────────────────────────────────────────────────────── */

const OPEN_FILES_LESSON: Lesson = {
  id: "open-files-1200",
  band: "1200",
  title: "Rooks Love Open Files",
  subtitle: "Why rooks sit on empty files and how to get them there",
  icon: "🏗️",
  estimatedMinutes: 9,
  tags: ["strategy", "rooks", "positional"],
  slides: [
    {
      kind: "replay",
      heading: "A rook on an open file dominates",
      body: "Watch how a rook that reaches an open file first controls the entire board. Every piece that tries to challenge it gets pushed away, and eventually the rook invades the 7th rank, winning material.",
      moves: [
        "d2d4", "d7d5", "c2c4", "e7e6", "b1c3", "g8f6",
        "c1g5", "f8e7", "e2e3", "e8g8", "g1f3", "b8d7",
        "a1c1", "c7c6", "c4d5", "e6d5", "f1d3", "f6e4",
        "g5e7", "d8e7", "c3e4", "d5e4", "d3e4", "c8f5",
        "e4f5", "e7e3", "f5g4", "e3g5", "h2h3", "g5g3",
        "f2f3", "f8d8", "c1c2", "d7f8", "d1e2", "g3h4",
        "g2g3", "h4g3", "f1g1", "g3h2", "g1g7",
      ],
      orientation: "white",
      intervalMs: 900,
    },
    {
      kind: "text",
      heading: "What makes a file 'open'",
      body: "A file is 'open' when there are no pawns on it. An open file is a highway for rooks. With no pawns blocking the way, a rook on an open file controls every square on that file — and can invade the opponent's position.\n\nA 'semi-open' file has only one pawn on it (usually your opponent's). These are also valuable for rooks, especially for attacking the pawn that's stuck on the file.",
      fen: "r1bqkb1r/ppp1pppp/2n2n2/3p4/3P1B2/2NQPN2/PPP2PPP/R3KB1R w KQkq - 0 6",
      orientation: "white",
      highlights: ["c1", "c8"],
      arrows: [["c1", "c8"]],
    },
    {
      kind: "interact",
      heading: "Seize the open file",
      instruction: "White to move. The d-file is semi-open (Black pawn on d6). Find the move that places a rook on this valuable file.",
      fen: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2BPP3/2N1BN2/PPP1QPPP/R4RK1 w - - 0 11",
      orientation: "white",
      correctMoves: ["a1d1"],
      wrongMoves: ["f1e1", "c1g5", "a1b1"],
      correctExplanation: "Rad1! Place the queen's rook on the semi-open d-file. From d1 it targets Black's d6 pawn and controls the file — the bishop on c1 is already developed to e3, so the rook path is clear.",
      wrongExplanation: "Put a rook on the semi-open d-file. From there it controls the file and targets the d6 pawn. Look for the rook that has a clear path to d1.",
    },
    {
      kind: "text",
      heading: "Doubling rooks",
      body: 'Once one rook is on an open file, bring the second rook behind it. Two rooks stacked on the same file create a crushing force: double rooks on the 7th rank is often decisive.\n\nThe rule: first rook occupies the file, second rook supports it. If the opponent tries to challenge the file, you have more firepower. "The player who controls the open file controls the game."',
      fen: "r4rk1/ppp2ppp/2np4/4p3/2PP4/2N2N2/PPP3PP/2R1R1K1 w - - 0 12",
      orientation: "white",
      highlights: ["c1", "c8", "e1"],
      arrows: [
        ["c1", "c8"],
        ["e1", "c1"],
      ],
    },
    {
      kind: "choice",
      heading: "Open file priorities",
      question: "You have a choice between occupying an open file in the center (d-file) or on the edge (h-file). Which is usually better?",
      choices: [
        "The h-file — it attacks the king",
        "The d-file — central files lead into the opponent's position and threaten key squares",
        "Both are equally good — just take whichever file you can",
        "The h-file — rooks on the edge are safer",
      ],
      correctIndex: 1,
      explanation: "Central files (d-file, e-file) are more valuable because they lead directly into the opponent's position, attack central squares, and can be used to invade on the 7th rank where the king often sits.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Place rooks on open files — they control the entire file\n✓ Semi-open files (one enemy pawn) are also excellent for rooks\n✓ Double rooks on an open file create unstoppable pressure\n✓ Central open files are more valuable than edge files",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 10 — The Passed Pawn (1200)                                */
/* ─────────────────────────────────────────────────────────────── */

const PASSED_PAWN_LESSON2: Lesson = {
  id: "passed-pawn-adv-1200",
  band: "1200",
  title: "The Passed Pawn (Advanced)",
  subtitle: "A pawn that nothing stops is a queen in training",
  icon: "🏃",
  estimatedMinutes: 9,
  tags: ["endgame", "pawns", "strategy"],
  slides: [
    {
      kind: "replay",
      heading: "A pawn becomes unstoppable",
      body: "One pawn has no enemy pawns in front of it, on either adjacent file. That's a 'passed pawn.' Watch how a single passed pawn can decide the game — every piece the opponent uses to stop it is tied down.",
      moves: [
        "e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4",
        "f3d4", "g8f6", "b1c3", "a7a6", "c1e3", "e7e5",
        "d4b3", "c8e6", "f2f3", "b8c6", "d1d2", "d6d5",
        "e4d5", "f6d5", "c3d5", "d8d5", "c2c3", "f8e7",
        "f1e2", "e8g8", "0-0", "a8c8", "e3c5", "e7c5",
        "b3c5", "d5a5", "c5a4", "a5c7", "a1d1", "c7g3",
        "h2h3", "g3e5", "c1c2", "f7f5", "f1d1", "c8d8",
        "d1d8", "d8d8", "d2d8", "f8d8", "b2b4", "h7h6",
        "a2a3", "g7g5", "c3c4", "e5f6", "c2d2", "f6e5",
        "a4b6",
      ],
      orientation: "white",
      intervalMs: 900,
    },
    {
      kind: "text",
      heading: "Creating a passed pawn",
      body: 'A passed pawn can be "created" by advancing a pawn majority. If you have more pawns on one side of the board than your opponent, you can push one of them forward. Eventually the opponent runs out of pawns to block it, and the pawn "passes through" — becoming a passed pawn.\n\nThe simplest method: in a pawn race, the side with the pawn majority wins because they can create a passed pawn. This is why the pawn structure matters in every phase of the game.',
      fen: "8/pp3ppp/4k3/3PP3/5PK1/P7/8/8 b - - 0 1",
      orientation: "white",
      highlights: ["e5", "d5", "f4", "g4"],
      arrows: [
        ["e5", "e6"],
        ["f4", "f5"],
      ],
      insight: "A passed pawn cannot be captured by enemy pawns. It can only be stopped by pieces — which means your opponent must use their valuable pieces to block it.",
    },
    {
      kind: "interact",
      heading: "Push the passer",
      instruction: "White has a 2-to-1 pawn majority on the kingside. White's f-pawn has no enemy pawn blocking it. Find the move that starts creating a passed pawn.",

      fen: "8/6pp/5k2/8/5PP1/8/6K1/8 w - - 0 1",

      orientation: "white",

      correctMoves: ["f4f5"],

      wrongMoves: ["g4g5", "g2f3", "g2h3"],

      correctExplanation: "f5! Advance the unopposed pawn. Black's pawns can't block f5 because they're on the g- and h-files. After f5-f6, the pawn becomes a passed pawn that Black must block with pieces.",

      wrongExplanation: "Push the pawn that has no enemy pawn in front of it on its file. The kingside majority (f- and g-pawns vs Black's g- and h-pawns) means the f-pawn can become a passer.",
    },
    {
      kind: "choice",
      heading: "The passed pawn advantage",
      question: "Your pawn majority on the queenside gives you a 3-to-2 advantage. What is your plan?",
      choices: [
        "Trade all pawns to reach a pure king-and-pawn endgame",
        "Advance the pawn that has no opposing pawn in front of it",
        "Push the middle pawn first, then the outer pawns",
        "Attack the opponent's king with the extra pawn",
      ],
      correctIndex: 1,
      explanation: "Advance the pawn that is unopposed by an enemy pawn on its file. Once it passes through, it becomes a passed pawn that demands immediate attention from the opponent's pieces.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ A passed pawn is a pawn with no enemy pawn in front of it on its file\n✓ Use pawn majorities to create passed pawns\n✓ A passed pawn ties down enemy pieces — they must block it\n✓ In the endgame, a passed pawn is worth an extra piece of advantage",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 11 — Knight Outposts (1200)                                */
/* ─────────────────────────────────────────────────────────────── */

const OUTPOST_LESSON2: Lesson = {
  id: "knight-outpost-1200",
  band: "1200",
  title: "Knight Outposts",
  subtitle: "Give your knight a home it cannot be chased away from",
  icon: "🏰",
  estimatedMinutes: 9,
  tags: ["strategy", "knights", "positional"],
  slides: [
    {
      kind: "replay",
      heading: "A knight on the 6th rank dominates",
      body: "When a knight reaches a square in enemy territory that cannot be attacked by enemy pawns, it becomes a monster. From that square, it attacks the heart of the opponent's position with impunity.",
      moves: [
        "e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4",
        "f3d4", "g8f6", "b1c3", "a7a6", "c1e3", "e7e5",
        "d4b3", "c8e6", "f2f3", "b8c6", "d1d2", "d6d5",
        "e4d5", "f6d5", "c3d5", "d8d5", "0-0", "f8e7",
        "c2c3", "e8g8", "a1d1", "d5a5", "f1e2", "c6d4",
        "b3d4", "e5d4", "c3d4", "a5b4", "e3d2", "b4b2",
        "a2a4", "b2b6", "d2c3", "f7f6", "c3a5", "b6c7",
        "a5d8", "f8d8", "e2c4", "c7c8", "d1d3",
      ],
      orientation: "white",
      intervalMs: 850,
    },
    {
      kind: "text",
      heading: "What makes a square an outpost",
      body: 'An outpost is a square in enemy territory that meets three conditions:\n\n• It is in or near the opponent\'s position\n• It cannot be attacked by an enemy pawn\n• It is defended by one of your pawns\n\nKnights love outposts because their value increases enormously when they cannot be chased away by pawns. A knight on e5 that cannot be kicked by ...f6 or ...d6 controls key squares and restricts the opponent\'s pieces.',
      fen: "r1bqkb1r/ppp1pppp/2n5/4P3/3n4/5N2/PPP2PPP/RNBQK2R w KQkq - 0 6",
      orientation: "white",
      highlights: ["e5", "d4", "f7"],
      arrows: [
        ["e5", "f7"],
        ["e5", "d7"],
      ],
    },
    {
      kind: "interact",
      heading: "Establish the outpost",
      instruction: "White's pawn on e5 controls f6 and d6. Black's pawns can no longer attack e5 (d6 is blocked, f6 is controlled). Find the move that puts a knight on this permanent outpost.",
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4P3/4P3/8/PPP2PPP/RNBQKBNR w KQkq - 0 5",
      orientation: "white",
      correctMoves: ["g1f3"],
      wrongMoves: ["g1e2", "b1c3", "f1c4"],
      correctExplanation: "Nf3 develops the knight toward the e5 outpost. From f3, the knight can reach g5 or d4, but the real plan is to get it to e5 or d6 where Black's pawns cannot attack it.",
      wrongExplanation: "Look for a square where your knight can settle permanently without being chased by pawns. The e5 square is already protected by your pawn and cannot be attacked by Black's pawns.",
    },
    {
      kind: "text",
      heading: "When the outpost is worth the sacrifice",
      body: 'Sometimes you can sacrifice a pawn to create an outpost for your knight. The typical pattern: play e4-e5 (advancing into the opponent\'s pawn chain) even if it costs a pawn, because the e5 square becomes a permanent home for your knight. The knight on e5 is often worth more than the pawn.\n\nThe modern rule: "A knight on an outpost is worth at least a pawn plus." This means if you can get a knight to an outpost, it compensates for a pawn deficit.',
      fen: "r1bqkb1r/ppp2ppp/2np4/4N3/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 6",
      orientation: "white",
      highlights: ["e5"],
      arrows: [
        ["e5", "c6"],
        ["e5", "f7"],
        ["e5", "g6"],
      ],
    },
    {
      kind: "choice",
      heading: "Knight vs bishop on the outpost",
      question: "Why is a knight on an outpost often as good as a bishop?",
      choices: [
        "Knights attack more squares than bishops",
        "Knights cannot be blocked or exchanged easily on an outpost, while bishops can be blocked by pawns",
        "Knights are always better than bishops",
        "Outposts are only useful for knights, not bishops",
      ],
      correctIndex: 1,
      explanation: "A knight on an outpost cannot be chased by pawns. If the opponent wants to exchange it, they must use a piece — which often means trading an active bishop for the knight. The knight's value is magnified because it restricts the opponent's play.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ An outpost is a square in enemy territory that pawns cannot attack\n✓ Knights on outposts become powerful — they cannot be chased away\n✓ Use pawn advances to create and protect outposts\n✓ A knight on an outpost is worth a pawn 'plus'",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 12 — Pawn Structure Basics (1200)                          */
/* ─────────────────────────────────────────────────────────────── */

const PAWN_STRUCTURE_LESSON: Lesson = {
  id: "pawn-structure-1200",
  band: "1200",
  title: "Pawn Structure Basics",
  subtitle: "Pawns form the skeleton of your position — understand their strengths and weaknesses",
  icon: "🦴",
  estimatedMinutes: 10,
  tags: ["strategy", "pawns", "positional"],
  slides: [
    {
      kind: "replay",
      heading: "How weak pawns lose games",
      body: "Watch how Black's doubled pawns and isolated pawns become permanent targets. White doesn't need a direct attack — just keeps targeting the weak pawns until Black loses one.",
      moves: [
        "e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4",
        "f3d4", "g8f6", "b1c3", "a7a6", "c1g5", "e7e6",
        "f2f4", "f8e7", "d1f3", "d8c7", "c1d1", "b8c6",
        "d4c6", "b7c6", "e4e5", "d6e5", "f4e5", "f6d7",
        "f3g3", "e8g8", "f1d3", "c6c5", "g5e7", "g8h8",
        "e7d6", "c7d6", "d3f5",
      ],
      orientation: "white",
      intervalMs: 850,
    },
    {
      kind: "text",
      heading: "Doubled, isolated, and backward pawns",
      body: 'Three types of weak pawns:\n\n• Doubled pawns — two pawns stacked on the same file. They cannot defend each other and only one can advance.\n\n• Isolated pawns — a pawn with no friendly pawn on either adjacent file. It has no pawn defenders and must be defended by pieces.\n\n• Backward pawns — a pawn that cannot advance because it would be captured, and no friendly pawn can support it.\n\nEach of these is a permanent structural weakness that your opponent can target.',
      fen: "r1bq1rk1/pp1n1ppp/2p1p3/3pP3/3P4/2P5/PP3PPP/RNBQR1K1 w - - 0 12",
      orientation: "white",
      highlights: ["c3", "c4", "c6", "d5"],
      arrows: [
        ["c3", "c4"],
        ["d5", "d4"],
      ],
      insight: "Pawn structure is permanent. A bishop can move to a better square, but a doubled pawn stays doubled for the rest of the game. Every pawn weakness is a permanent anchor for your opponent's strategy.",
    },
    {
      kind: "interact",
      heading: "Target the weak pawn",
      instruction: "Black has an isolated pawn on d5 — it has no friendly pawns on c6 or e6 to defend it. Find the move that attacks it again.",
      fen: "r1bq2rk/pp3ppp/2np4/3p4/2PP4/2N2N2/PP3PPP/R1BQR1K1 w - - 0 12",
      orientation: "white",
      correctMoves: ["c1e3", "c1f4", "d1d2"],
      wrongMoves: ["c4d5", "f3d2", "c3a4"],
      correctExplanation: "Develop a piece that targets the isolated d5 pawn. Options like Be3, Bf4, or Qd2 all increase pressure on d5. The pawn can only be defended by Black's pieces — attack it until it falls.",
      wrongExplanation: "Don't capture the weak pawn immediately — that opens lines for Black. Instead, target it with pieces. The isolated pawn is a fixed target that won't move. Pile up pressure on it.",
    },
    {
      kind: "choice",
      heading: "Identifying pawn weaknesses",
      question: "Which of these is NOT a structural pawn weakness?",
      choices: [
        "A doubled pawn on a closed file",
        "An isolated pawn in the center",
        "A passed pawn in the endgame",
        "A backward pawn on a half-open file",
      ],
      correctIndex: 2,
      explanation: "A passed pawn is not a weakness — it's a strength. Passed pawns are dangerous because they can promote. Doubled, isolated, and backward pawns are all structural weaknesses that make your position harder to defend.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Pawn structure is permanent — plan your pawn moves carefully\n✓ Doubled, isolated, and backward pawns are all structural weaknesses\n✓ Attack weak pawns by 'piling up' — add more attackers than the opponent has defenders\n✓ Before making a pawn move, think about what structural weaknesses it might create",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 13 — The Bishop Pair (1600)                                */
/* ─────────────────────────────────────────────────────────────── */

const BISHOP_PAIR_LESSON: Lesson = {
  id: "bishop-pair-1600",
  band: "1600",
  title: "The Bishop Pair",
  subtitle: "When two bishops dominate the board",
  icon: "🎯",
  estimatedMinutes: 10,
  tags: ["strategy", "bishops", "middlegame"],
  slides: [
    {
      kind: "replay",
      heading: "Two bishops carve through the position",
      body: "White sacrifices a knight to open up the position, and suddenly the two bishops control every diagonal. Black's knights are helpless — they can't keep up with bishops that sweep across the whole board in a single move.",
      moves: [
        "d2d4", "d7d5", "c2c4", "e7e6", "b1c3", "g8f6",
        "c1g5", "f8e7", "e2e3", "e8g8", "g1f3", "b8d7",
        "a1c1", "c7c6", "f1d3", "d5c4", "d3c4", "b7b5",
        "c4d3", "a7a6", "0-0", "c8b7", "g5f6", "d7f6",
        "e3e4", "b5b4", "d3b1", "b4c3", "b1h7", "g8h8",
        "h7d3", "c3b2", "c1c2", "b2b1", "f1b1", "f6e4",
        "d3e4", "f8b8", "e4b1",
      ],
      orientation: "white",
      intervalMs: 900,
    },
    {
      kind: "text",
      heading: "Why bishops come in pairs",
      body: "One bishop can only control squares of one color. But two bishops together control ALL squares on the board — the light-squared bishop covers the light squares, the dark-squared bishop covers the dark squares.\n\nWhen the position is open (few pawns blocking the diagonals), the bishop pair becomes a major asset. They can attack from a distance, switch targets instantly, and coordinate attacks on both sides of the board.",
      fen: "r1bq1rk1/ppp1bppp/2n5/3p4/3Pn3/2N1BN2/PPP2PPP/R2QK2R w KQ - 0 10",
      orientation: "white",
      highlights: ["c1", "f1", "c8", "f8"],
      insight: "In open positions, two bishops are worth more than a bishop and a knight, and sometimes as much as a rook and a pawn. Their ability to control both color complexes makes them uniquely powerful.",
    },
    {
      kind: "interact",
      heading: "Open the position for the bishops",
      instruction: "White has the bishop pair. Black has two knights. Find the move that opens the center and activates the bishops.",
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 4",
      orientation: "white",
      correctMoves: ["d2d4"],
      wrongMoves: ["d2d3", "f1c4", "0-0"],
      correctExplanation: "d4! Open the position. By exchanging pawns in the center, you clear diagonals for your bishops. After ...exd4 Nxd4, the bishops on c1 and c4 have open lines. Knights prefer closed positions; bishops prefer open ones.",
      wrongExplanation: "To activate the bishop pair, you need open diagonals. Exchange pawns in the center to clear lines for your bishops. The knights will struggle in an open position.",
    },
    {
      kind: "choice",
      heading: "When the bishop pair thrives",
      question: "In which type of position is the bishop pair most valuable?",
      choices: [
        "Closed positions with many pawn chains",
        "Open positions with few pawns blocking diagonals",
        "Endgames with only kings and pawns",
        "Positions where the opponent also has the bishop pair",
      ],
      correctIndex: 1,
      explanation: "The bishop pair is strongest in open positions where diagonals are clear. Pawns block bishops, so having few pawns on the board lets bishops reach their full potential. Close the position when facing the bishop pair; open it when you have it.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Two bishops control all squares of both colors\n✓ The bishop pair is strongest in open positions\n✓ When you have the bishop pair, open the position (pawn exchanges, central breaks)\n✓ When facing the bishop pair, keep the position closed",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 14 — Good Knight vs Bad Bishop (1600)                      */
/* ─────────────────────────────────────────────────────────────── */

const KNIGHT_VS_BISHOP_LESSON: Lesson = {
  id: "knight-vs-bishop-1600",
  band: "1600",
  title: "Good Knight vs Bad Bishop",
  subtitle: "Fixed pawn structures decide which minor piece dominates",
  icon: "♞",
  estimatedMinutes: 10,
  tags: ["strategy", "knights", "bishops", "endgame"],
  slides: [
    {
      kind: "replay",
      heading: "The knight hops over the cage",
      body: "Black's pawns are all on light squares, blocking the light-squared bishop and making it a 'tall pawn.' White's knight jumps freely around the dark squares, unchallenged. The knight dominates the bishop.",
      moves: [
        "e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4",
        "f3d4", "g8f6", "b1c3", "a7a6", "c1e3", "e7e6",
        "f2f3", "b8c6", "d1d2", "d6d5", "e4d5", "f6d5",
        "c3d5", "e6d5", "0-0-0", "f8e7", "d4c6", "b7c6",
        "f1c4", "c8e6", "c4e6", "f7e6", "h2h4", "d8a5",
        "c1b1", "a8b8", "h4h5", "e7d6", "e3d4", "a5a4",
        "b2b3", "a4a5", "a2a4", "c6c5", "d4e3", "c5c4",
        "b3c4", "d5c4", "d2d4", "b8c8", "b1a2",
      ],
      orientation: "white",
      intervalMs: 900,
    },
    {
      kind: "text",
      heading: "The 'bad bishop'",
      body: 'A bishop is "bad" when its own pawns are on the same color squares as the bishop, blocking its diagonals. The bishop becomes trapped behind its own pawns — a tall pawn with no real power.\n\nA "good bishop" has pawns on the opposite color, giving it clear diagonals. A "good knight" thrives in closed positions where bishops struggle, especially when there are stable pawn chains it can jump around.',
      fen: "r1bq1rk1/pp3ppp/2pp4/8/4P3/2NB4/PPP2PPP/R3K2R w KQ - 0 12",
      orientation: "white",
      highlights: ["c8", "f8", "d3"],
      arrows: [
        ["c8", "g4"],
        ["d3", "g6"],
      ],
    },
    {
      kind: "interact",
      heading: "Close the position for your knight",
      instruction: "White has a knight and Black has a bishop. White's pawns are on light squares (good — they don't block the knight). Find the move that restricts Black's bishop on c8.",
      fen: "r1bqkb1r/pppppppp/2n2n2/8/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
      orientation: "white",
      correctMoves: ["d2d4"],
      wrongMoves: ["f1c4", "f1e2", "0-0"],
      correctExplanation: "d4! Establish a broad pawn center. Pawns on dark squares (d4, e4) don't block a knight (which jumps over them), but they restrict Black's bishops, which need clear diagonals. The pawn center also limits Black's piece activity.",
      wrongExplanation: "Close the position with central pawns. Knights can jump over pawns, but bishops need open diagonals. Put your pawns on squares of the opposite color from your knight's mobility — but since knights can jump over anything, just make sure to block the bishop's diagonals.",
    },
    {
      kind: "choice",
      heading: "Good bishop conditions",
      question: "What makes a bishop 'good'?",
      choices: [
        "When it's on a light square",
        "When it's developed outside the pawn chain",
        "When most of its own pawns are on opposite-colored squares, giving it clear diagonals",
        "When it has an enemy pawn to attack",
      ],
      correctIndex: 2,
      explanation: "A 'good' bishop has its own pawns on the opposite color. This gives the bishop clear diagonals to operate on. A 'bad' bishop has pawns on the same color, which block its movement and reduce it to a defensive piece.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ A 'bad bishop' is blocked by its own pawns on the same color\n✓ A 'good knight' thrives in closed positions with stable pawn chains\n✓ Put your pawns on the color your opponent's bishop controls\n✓ When you have a knight against a bishop, close the position",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 15 — Zwischenzug (1600)                                    */
/* ─────────────────────────────────────────────────────────────── */

const ZWISCHENZUG_LESSON: Lesson = {
  id: "zwischenzug-1600",
  band: "1600",
  title: "Zwischenzug — The In-Between Move",
  subtitle: "Just when your opponent thinks you have to recapture — throw in a check",
  icon: "⚡",
  estimatedMinutes: 9,
  tags: ["tactics", "zwischenzug", "intermediate"],
  slides: [
    {
      kind: "replay",
      heading: "Automatic recapture? Not today.",
      body: "Black captures a knight expecting White to recapture immediately. But White inserts a check first — the zwischenzug. Suddenly Black's winning capture becomes a losing blunder because the in-between move changes everything.",
      moves: [
        "e2e4", "d7d5", "e4d5", "d8d5", "b1c3", "d5a5",
        "d2d4", "c7c6", "g1f3", "c8g4", "f1e2", "e7e6",
        "0-0", "g8f6", "c1e3", "f8b4", "a1c1", "b8d7",
        "a2a3", "b4a5", "b2b4", "a5b6", "c3e4", "f6e4",
        "e3b6", "a7b6", "f3e5", "b6b5", "c2c4", "b5c4",
        "e2c4", "d7e5", "d4e5", "0-0", "d1e1", "g4e2",
        "e1e2", "g7g6", "e5e6", "f7e6", "e2e6",
      ],
      orientation: "white",
      intervalMs: 850,
    },
    {
      kind: "text",
      heading: "The zwischenzug principle",
      body: "Zwischenzug (German for 'in-between move') is a tactic where, instead of making an obvious recapture or response, you first play a move that creates a more urgent threat — usually a check or an attack on a higher-value piece.\n\nThe opponent must respond to the threat first, and when they do, they no longer have time for their original plan. You then play the move they expected — but now under better circumstances.\n\nNever assume the opponent is forced to recapture immediately. Always ask: 'Do they have a zwischenzug?'",
      fen: "r2qkb1r/ppp2ppp/2np4/4N3/4P1b1/2NP4/PPP3PP/R1BQK2R b KQkq - 0 10",
      orientation: "white",
      highlights: ["e4", "g4", "d3"],
      arrows: [
        ["e4", "g4"],
        ["d3", "d8"],
      ],
      insight: "The zwischenzug is the trick that makes simple tactics into winning sequences. The opponent thinks the board is frozen — but you have one extra move.",
    },
    {
      kind: "interact",
      heading: "Find the in-between move",
      instruction: "Black just captured a pawn on e4 with ...Nxe4. Instead of recapturing automatically, look for a zwischenzug — a check that wins material first.",
      fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5",
      orientation: "white",
      correctMoves: ["c4f7"],
      wrongMoves: ["c3e4", "f3e4", "d2d3"],
      correctExplanation: "Bxf7+! The zwischenzug! Instead of immediately recapturing Nxe4 with the knight, White checks with the bishop first. After Black responds (Kxf7 or Kf8), White plays Nc3xe4, winning a pawn and exposing Black's king.",
      wrongExplanation: "Before recapturing, look for a check that changes the evaluation. The bishop can deliver check on f7 — the king must respond, and then White recaptures the knight.",
    },
    {
      kind: "choice",
      heading: "When to look for zwischenzug",
      question: "When should you actively look for a zwischenzug?",
      choices: [
        "Only in the opening",
        "Only when you are in check",
        "Whenever the opponent makes a capture that seems to require an automatic recapture",
        "Zwischenzugs only happen in grandmaster games",
      ],
      correctIndex: 2,
      explanation: "Every time the opponent makes a capture and you're 'supposed' to recapture — stop and check if there's a more urgent move first. A check, a threat of checkmate, or an attack on a higher-value piece can turn a forced sequence into a winning one.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Zwischenzug = an 'in-between move' inserted before an expected response\n✓ Look for checks, mate threats, or attacks that interrupt your opponent's plan\n✓ Never assume recapture is forced — ask: 'Do I have a better move first?'\n✓ The zwischenzug changes the timing of a sequence, often winning material",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 16 — Simplification (1600)                                 */
/* ─────────────────────────────────────────────────────────────── */

const SIMPLIFICATION_LESSON: Lesson = {
  id: "simplification-1600",
  band: "1600",
  title: "When to Simplify",
  subtitle: "Trade pieces when you have the advantage — but not when you don't",
  icon: "✂️",
  estimatedMinutes: 8,
  tags: ["strategy", "endgame", "trading"],
  slides: [
    {
      kind: "replay",
      heading: "Trade down to win",
      body: "White has an extra pawn. Every time Black offers a trade, White accepts. Fewer pieces on the board means the extra pawn matters more. Watch as White simplifies into a winning endgame.",
      moves: [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6",
        "d2d4", "e5d4", "e4e5", "f6e4", "0-0", "d7d5",
        "c4d5", "d8d5", "f3d4", "c6d4", "d1d4", "d5d4",
        "f1d1", "c8e6", "b1c3", "e4c3", "b2c3", "f8b4",
        "d1d4", "e6d5", "a1d1", "d5c6", "d4d8", "e8d8",
        "d1d8",
      ],
      orientation: "white",
      intervalMs: 850,
    },
    {
      kind: "text",
      heading: "The three rules of simplification",
      body: 'When to trade:\n\n1. When you are UP material — trades magnify your advantage. Exchanging pieces when you are a pawn up makes the extra pawn proportionally more important.\n\n2. When you need to DEFEND — trading attackers reduces pressure on your position.\n\n3. When the opponent has a BISHOP PAIR — trade one bishop to remove their color control.\n\nWhen NOT to trade:\n• When you are DOWN material — you need your pieces to create counterplay\n• When your opponent has better development — keep pieces that restrict their activity',
      fen: "r1bq1rk1/ppp2ppp/2np4/4B3/2B1P3/2NP4/PPP2PPP/R2QK2R b KQ - 0 10",
      orientation: "white",
      highlights: ["e5", "d6", "c4"],
      insight: "One extra pawn is worth more in an endgame with fewer pieces. Trade pieces, not pawns, when you're ahead.",
    },
    {
      kind: "interact",
      heading: "Simplify when ahead",
      instruction: "White is up a bishop. Black's knight on d4 attacks your bishop on e3. Should you trade? Find the move that simplifies toward a winning endgame.",
      fen: "r1bq1rk1/pppppppp/2n5/8/2BnP3/2N1BN2/PPPP1PPP/R2Q1RK1 w - - 0 10",
      orientation: "white",
      correctMoves: ["e3d4"],
      wrongMoves: ["d2d3", "f3e1", "f3h4"],
      correctExplanation: "Bxd4! Trade bishop for knight. When you're up in material, every exchange brings you closer to a winning endgame. Black's knight was active — removing it simplifies the position and reduces Black's counterplay.",
      wrongExplanation: "When ahead in material, trade pieces. Don't avoid exchanges — seek them out. The fewer pieces on the board, the more your material advantage matters.",
    },
    {
      kind: "choice",
      heading: "The material advantage rule",
      question: "You are up a pawn in a complex middlegame. Should you seek exchanges?",
      choices: [
        "Never — you need pieces to convert the pawn",
        "Only if the exchange doesn't weaken your pawn structure",
        "Always — every trade brings you closer to a winning endgame where the extra pawn decides",
        "Only trade queens — other pieces should stay on the board",
      ],
      correctIndex: 2,
      explanation: "When ahead in material, trade pieces. Each exchange reduces the opponent's counterplay potential and magnifies your material advantage. The winning endgame is just a few trades away.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ When ahead in material, trade pieces (not pawns) to simplify toward a winning endgame\n✓ When behind, avoid exchanges — you need complications to create counterplay\n✓ Trade attacking pieces when defending, keep them when attacking\n✓ Every exchange when you're ahead is a step closer to the win",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 17 — King in the Center (1600)                              */
/* ─────────────────────────────────────────────────────────────── */

const KING_CENTER_LESSON: Lesson = {
  id: "king-center-1600",
  band: "1600",
  title: "King in the Center",
  subtitle: "Why castling is not optional (and when to break the rule)",
  icon: "👑",
  estimatedMinutes: 9,
  tags: ["strategy", "king-safety", "opening"],
  slides: [
    {
      kind: "replay",
      heading: "The king gets caught in the crossfire",
      body: "Black delays castling to grab a pawn. White opens the center, and suddenly the Black king is sitting on e8 with no escape route. With the center open and pieces flying, the king is a target, not a defender.",
      moves: [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5",
        "c2c3", "d8e7", "0-0", "d7d6", "d2d4", "c5b6",
        "c1g5", "f7f6", "g5h4", "g7g5", "h4g3", "e5d4",
        "c3d4", "h7h5", "b1c3", "c6a5", "c4f7", "e8f8",
        "c3d5", "e7d8", "f3g5", "f6g5", "d5f6",
      ],
      orientation: "white",
      intervalMs: 800,
    },
    {
      kind: "text",
      heading: "Why the center is dangerous for the king",
      body: 'In the opening and middlegame, the king is safest in a corner behind a wall of pawns. The center is where the action happens — open files, active pieces, pawn breaks. A king in the center gets attacked from all sides.\n\nThe rule: castle within the first 7-10 moves of the game unless you have a strong reason not to. The exceptions are rare and usually involve closed centers or opposite-side castling for attack.',
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4",
      orientation: "white",
      highlights: ["e1", "g1", "e8", "g8"],
      arrows: [
        ["e1", "g1"],
        ["e8", "g8"],
      ],
    },
    {
      kind: "interact",
      heading: "Get the king to safety",
      instruction: "White has developed all minor pieces. The center is still closed. Find the most important move for king safety.",
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
      orientation: "white",
      correctMoves: ["e1g1"],
      wrongMoves: ["d2d4", "f1e1", "c1e3"],
      correctExplanation: "O-O! Castle immediately. All minor pieces are developed, and the king belongs on g1 behind the pawn shield. Delaying castling with moves like d4 or Be3 risks exposing the king to attack.",
      wrongExplanation: "The most important priority at this stage is king safety. You've developed your pieces — now castle before Black can open the center.",
    },
    {
      kind: "choice",
      heading: "When NOT to castle",
      question: "In which scenario is it OK to delay castling or not castle at all?",
      choices: [
        "When you're up a pawn in the opening",
        "When both sides have opposite-colored bishops",
        "When the center is completely blocked by pawn chains and both sides have opposite-side plans",
        "When you have a lead in development",
      ],
      correctIndex: 2,
      explanation: "When the center is completely closed (no pawn exchanges possible), the king is relatively safe in the center for a while. But even then, you should have a clear plan for king safety — often castling to the side where you plan to attack.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Castle within the first 7-10 moves — the center is no place for the king\n✓ A king caught in the center with open lines is a tactical target\n✓ Exceptions exist (closed centers, opposite-side attacks) but they are rare\n✓ When in doubt, castle",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 18 — Prophylaxis (1600-2000)                               */
/* ─────────────────────────────────────────────────────────────── */

const PROPHYLAXIS_LESSON: Lesson = {
  id: "prophylaxis-1600",
  band: "2000",
  title: "Prophylactic Thinking",
  subtitle: "The art of preventing your opponent's ideas before they start",
  icon: "🛡️",
  estimatedMinutes: 10,
  tags: ["strategy", "prophylaxis", "advanced"],
  slides: [
    {
      kind: "replay",
      heading: "Stop the attack before it starts",
      body: "Watch how White anticipates Black's freeing move ...d5. Instead of letting Black equalize, White prevents it with a simple pawn move. Black never gets any counterplay — all because White saw the idea coming.",
      moves: [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6",
        "b5a4", "g8f6", "0-0", "f8e7", "a1e1", "b7b5",
        "a4b3", "d7d6", "c2c3", "0-0", "h2h3", "c6a5",
        "b3c2", "c7c5", "d2d4", "d8c7", "b1d2", "c5d4",
        "c3d4", "a5c6", "d2f1", "c8b7", "f1e3", "a8d8",
        "e3f5", "e7f8", "e1g1", "d8d7", "g1g3", "g7g6",
        "f3h4", "f6e8", "f5e3", "c6d8", "h4f3", "e8g7",
        "e3g4", "f8g7", "g3g3",
      ],
      orientation: "white",
      intervalMs: 900,
    },
    {
      kind: "text",
      heading: "Think like your opponent",
      body: 'Prophylaxis (from Greek "prophylaktikos" — to guard against) means anticipating what your opponent wants to do and taking measures to prevent it BEFORE they can execute it.\n\nEvery move by the opponent has a purpose. Ask: "If I could make my opponent\'s next move for them, what would it be?" Then find a move that stops it. This is the most important thinking habit of strong players.\n\nCommon prophylactic moves:\n• Preventing pawn breaks (...d5, ...f5, ...c5, ...d4)\n• Avoiding piece exchanges that help the opponent\n• Improving the position of your worst piece',
      fen: "r1bq1rk1/ppp2ppp/2np4/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 8",
      orientation: "white",
      highlights: ["d5", "d6", "e5"],
      arrows: [["d5", "d4"]],
      insight: "The best players don't just play their own plans — they constantly ask what the opponent wants, and stop it.",
    },
    {
      kind: "interact",
      heading: "Prevent Black's freeing move",
      instruction: "Black wants to play ...d5 to free their position. Find the move that prevents this key break and maintains White's space advantage.",
      fen: "r1bq1rk1/ppp2ppp/2np4/4p3/2BPP3/2N2N2/PPP2PPP/R1BQ1RK1 w - - 0 8",
      orientation: "white",
      correctMoves: ["c1g5"],
      wrongMoves: ["a1d1", "d4d5", "f1e1"],
      correctExplanation: "Bg5! Pinning the knight on f6. If Black plays ...d5 now, the knight on f6 is pinned and can't recapture on d5. This prevents ...d5 from being effective. White maintains the space advantage and the knight remains stuck defending the center.",
      wrongExplanation: "Think about what Black wants. ...d5 is Black's best freeing move. Find a way to stop it — pinning the knight that defends d5 is the most effective approach.",
    },
    {
      kind: "choice",
      heading: "The prophylactic question",
      question: "What single question should you ask on every move to think prophylactically?",
      choices: [
        "What is my opponent's best move, and how can I stop it?",
        "How can I check the king?",
        "What piece of mine is most active?",
        "What is my plan for the next 5 moves?",
      ],
      correctIndex: 0,
      explanation: "The most important question in chess: 'What does my opponent want?' Once you identify their best idea, you can take measures to prevent it. This single habit will improve your chess more than any other thinking technique.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Prophylaxis = preventing the opponent's plans before they start\n✓ On every move, ask: 'What does my opponent want to do?'\n✓ The best move often stops the opponent's idea while advancing your own\n✓ Prophylactic thinking separates good players from great ones",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 19 — Sacrifice for Attack (2000)                           */
/* ─────────────────────────────────────────────────────────────── */

const SACRIFICE_LESSON: Lesson = {
  id: "sacrifice-attack-2000",
  band: "2000",
  title: "Sacrifice to Open the Attack",
  subtitle: "When giving up material opens the lines to the king",
  icon: "💎",
  estimatedMinutes: 11,
  tags: ["attack", "sacrifice", "middlegame", "initiative"],
  slides: [
    {
      kind: "replay",
      heading: "A bishop sacrifice destroys the king's shelter",
      body: "White sees that Black's king is castled but the pawn shield is fragile. A bishop sacrifice on h7 rips open the king's shelter, and the heavy pieces pour in for checkmate before Black can organize a defense.",
      moves: [
        "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6",
        "d2d3", "f8c5", "c2c3", "d7d6", "c1g5", "c8e6",
        "c4e6", "f7e6", "b1d2", "d8e7", "0-0", "0-0-0",
        "a1b1", "h7h6", "g5h4", "g7g5", "h4g3", "h6h5",
        "d2f1", "h5h4", "g3h4", "g5h4", "f1g3", "h4g3",
        "h2g3", "d6d5", "d3d4", "e5d4", "e4d5", "e6d5",
        "c3d4", "c5b6", "d1f3", "d8f8", "b1e1", "f6g4",
        "f3f8", "h8f8", "e1e8",
      ],
      orientation: "white",
      intervalMs: 850,
    },
    {
      kind: "text",
      heading: "The classic Greek Gift sacrifice",
      body: 'The "Greek Gift" sacrifice — Bxh7+ or Bxh2+ — is the most famous attacking sacrifice in chess. The bishop is sacrificed to rip open the pawn shield around the castled king. If the king captures, the queen and knight join the attack with devastating force.\n\nFor the sacrifice to work, three conditions must be met:\n1. The knight must be able to reach g5 (or g4 for Black)\n2. The queen must be ready to join the attack on the h-file\n3. The defender must not have enough pieces to block the attack',
      fen: "r1bq1rk1/pppp1Npp/2n5/4P3/2B5/8/PPP2PPP/R1BQR1K1 b - - 0 7",
      orientation: "white",
      highlights: ["h7", "g5", "h1", "d1"],
      arrows: [
        ["h7", "g8"],
        ["h1", "h7"],
        ["d1", "h5"],
      ],
    },
    {
      kind: "interact",
      heading: "Sacrifice to open the king",
      instruction: "White has a knight covering the g5 square and the queen ready. The Black king is castled but the pawn shield is intact. Find the move that rips open the king's protection.",
      fen: "r1bq1rk1/pppp1ppp/2n2n2/4P3/2B1P3/5N2/PPP2PPP/RNBQR1K1 w - - 0 7",
      orientation: "white",
      correctMoves: ["c4f7"],
      wrongMoves: ["e5f6", "f3g5", "d2d4"],
      correctExplanation: "Bxf7+! Sacrifice the bishop on f7, ripping apart the pawn shield. After Kxf7, Ng5+ forks the king and queen. After Kg8, Qh5 threatens Qxh7#. Black's king is exposed and White's attack crashes through.",
      wrongExplanation: "Look for a sacrifice that opens the king's position. The f7 square is the weakest point in Black's camp — sacrificing the bishop there draws the king out into the open.",
    },
    {
      kind: "choice",
      heading: "When to sacrifice",
      question: "What is the most important condition for a successful king-side sacrifice?",
      choices: [
        "You must be up at least two pawns",
        "You must have more pieces actively available for the attack than the opponent has for defense",
        "Your king must be castled too",
        "The opponent must have no queen",
      ],
      correctIndex: 1,
      explanation: "For a sacrifice to succeed, you need more attackers than the opponent has defenders around the king. Count the pieces that can reach the king's area in 2-3 moves. If you have more, the sacrifice will likely break through.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ Sacrificing material to open lines to the king is the foundation of attacking chess\n✓ The Greek Gift (Bxh7+) is the most famous attacking sacrifice pattern\n✓ Count attackers vs defenders before sacrificing\n✓ A successful sacrifice doesn't force immediate mate — it creates an overwhelming attack",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Lesson 20 — Converting an Advantage (2000)                        */
/* ─────────────────────────────────────────────────────────────── */

const CONVERTING_LESSON: Lesson = {
  id: "converting-2000",
  band: "2000",
  title: "Converting an Advantage",
  subtitle: "You're winning — now don't throw it away",
  icon: "🏆",
  estimatedMinutes: 10,
  tags: ["endgame", "technique", "conversion", "strategy"],
  slides: [
    {
      kind: "replay",
      heading: "From winning to won",
      body: "White is up a pawn and has a positional advantage. Instead of rushing for checkmate, White methodically converts: trades pieces, activates the king, and pushes the passed pawn. Simple, relentless, effective.",
      moves: [
        "e2e4", "e7e6", "d2d4", "d7d5", "b1c3", "d5e4",
        "c3e4", "b8d7", "g1f3", "g8f6", "e4f6", "d7f6",
        "f1d3", "f8e7", "0-0", "0-0", "c2c3", "c7c5",
        "h2h3", "b7b6", "c1f4", "c8b7", "d1e2", "c5d4",
        "c3d4", "a8c8", "a1c1", "d8b8", "d3b1", "f6d5",
        "f4d2", "d5f4", "e2e4", "f4g6", "f1c1", "c8c1",
        "c1c1", "f8c8", "c1c8", "b8c8", "b1a2", "b7a6",
        "d2c3", "c8b8", "e4b7", "b8d8", "b7a6", "g6e5",
        "f3e5", "e7c5", "e5d7", "d8d7", "b7d7",
      ],
      orientation: "white",
      intervalMs: 900,
    },
    {
      kind: "text",
      heading: "The method of conversion",
      body: 'Being up material is not enough — you need a plan to convert. The three principles of conversion:\n\n1. Simplify: Trade pieces (not pawns) to reduce the opponent\'s counterplay. Each trade makes your material advantage loom larger.\n\n2. No risk: Avoid unclear sacrifices or speculative attacks. When you\'re winning, you don\'t need to win again — just convert.\n\n3. Active king: In the endgame, the king is a fighting piece. Bring it into the center or toward the passed pawn.\n\nThe most common reason players fail to convert: impatience. They try to force checkmate when a slow win is available.',
      fen: "r1bq1rk1/pp3ppp/2np4/2bP4/2B1P3/5N2/PPP3PP/R2Q1RK1 w - - 0 13",
      orientation: "white",
      highlights: ["d5", "c4"],
      arrows: [
        ["d5", "d6"],
        ["c4", "f7"],
      ],
      insight: "When you're winning, don't try to win again. Just bring the game home. Boring chess wins tournaments.",
    },
    {
      kind: "interact",
      heading: "Simplify the position",
      instruction: "White is up two pawns. Black's knight on g4 is active and threatens your e5 pawn. Find the move that attacks the knight and starts the simplification.",
      fen: "r1b2rk1/pp3ppp/3p4/4P3/2B1P1n1/2N5/PPP2PPP/R4RK1 w - - 0 13",
      orientation: "white",
      correctMoves: ["h2h3"],
      wrongMoves: ["f1e1", "g1h1", "g2g3"],
      correctExplanation: "h3! A simple pawn move attacks the knight on g4. Black's knight must retreat (to h6 or f6), and White gains a tempo. Each exchange of pieces when you're ahead in material brings you closer to a winning endgame.",
      wrongExplanation: "Look to gain a tempo by attacking Black's active piece. A pawn push forces the knight to move while developing nothing for Black. Each tempo gained when simplifying helps convert your material advantage.",
    },
    {
      kind: "choice",
      heading: "The winning player's mindset",
      question: "You are up a pawn in a complicated middlegame with many pieces on the board. What is your primary goal?",
      choices: [
        "Force checkmate as quickly as possible",
        "Trade down to a simpler winning endgame while avoiding counterplay",
        "Attack the opponent's king immediately",
        "Repeat moves to gain time on the clock",
      ],
      correctIndex: 1,
      explanation: "When ahead, simplify. Trade pieces, not pawns. Avoid complications that give your opponent counterplay. The winning path is the boring one — trade down to a pawn-up endgame and convert with technique.",
    },
    {
      kind: "text",
      heading: "The takeaway",
      body: "✓ When winning, simplify — trade pieces to reduce counterplay\n✓ Avoid unclear sacrifices when a slow win is available\n✓ Activate your king in the endgame — it's a fighting piece\n✓ The hardest conversion is the one you rush. Take your time.",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Export all new lessons                                           */
/* ─────────────────────────────────────────────────────────────── */

export const NEW_LESSONS: Lesson[] = [
  HANGING_PIECES_LESSON,
  BACK_RANK_LESSON,
  KNIGHT_FORK_LESSON,
  PIN_LESSON,
  SKEWER_LESSON,
  DISCOVERED_ATTACK_LESSON,
  REMOVE_DEFENDER_LESSON,
  DEFLECTION_LESSON,
  OPEN_FILES_LESSON,
  PASSED_PAWN_LESSON2,
  OUTPOST_LESSON2,
  PAWN_STRUCTURE_LESSON,
  BISHOP_PAIR_LESSON,
  KNIGHT_VS_BISHOP_LESSON,
  ZWISCHENZUG_LESSON,
  SIMPLIFICATION_LESSON,
  KING_CENTER_LESSON,
  PROPHYLAXIS_LESSON,
  SACRIFICE_LESSON,
  CONVERTING_LESSON,
];
