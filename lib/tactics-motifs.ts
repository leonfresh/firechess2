/**
 * Tactics Motifs — curated library of chess tactical patterns.
 *
 * Each motif covers:
 *  - What it is and why it works
 *  - How to spot it
 *  - How to defend against it
 *  - Example FEN
 *  - SEO-oriented FAQ
 */

export type TacticMotif = {
  id: string;
  name: string;
  /** Short, punchy tagline */
  tagline: string;
  /** Short paragraph description */
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  /** How often this appears in games */
  frequency: "very-common" | "common" | "uncommon";
  /** Core concepts to understand */
  keyIdeas: string[];
  /** Practical tips to recognize it over the board */
  howToSpot: string[];
  /** Tips for the defending side */
  howToDefend: string[];
  /** FEN of a clear example position */
  exampleFen: string;
  /** Prose explaining the example */
  exampleDescription: string;
  /** Related tactic IDs */
  related: string[];
  faqs: { q: string; a: string }[];
};

export const TACTIC_MOTIFS: TacticMotif[] = [
  /* ───────────────────────────── PINS ──────────────────────────────── */
  {
    id: "pins",
    name: "The Pin",
    tagline: "Freeze a piece in place — attack through it to win material.",
    description:
      "A pin occurs when a piece cannot move without exposing a more valuable piece behind it to capture. Absolute pins fix a piece against the king (moving it is illegal), while relative pins fix it against a queen or rook (moving it loses material). Mastering pins is one of the fastest ways to win material in chess.",
    difficulty: "beginner",
    frequency: "very-common",
    keyIdeas: [
      "An absolute pin makes a piece completely immobile — it cannot move at all because doing so would put the king in check",
      "A relative pin means moving the pinned piece is legal but loses significant material behind it",
      "Bishops, rooks, and queens can all create pins along ranks, files, and diagonals",
      "Piling pressure on a pinned piece by attacking it multiple times is the classic way to exploit a pin",
      "A pin is most powerful when the piece pinned against is the king — exploit it before the king can escape",
    ],
    howToSpot: [
      "Look for your bishops, rooks, or queens aligned along a rank, file, or diagonal with two opposing pieces in line",
      "Ask: is there a more valuable piece directly behind the target? If yes, a pin may be possible",
      "Check if pieces are defending other pieces — a pinned piece cannot defend",
      "Look for pins that target a defending piece: if the defender is pinned, the piece it guards becomes vulnerable",
    ],
    howToDefend: [
      "Break the pin by moving the more valuable piece off the line first",
      "Interpose another piece between the pin and the valuable piece behind it",
      "Counter-attack the pinning piece to drive it away before the pin becomes decisive",
      "Castle to move the king to safety — many pins target pieces pinned to the king",
    ],
    exampleFen:
      "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    exampleDescription:
      "White's bishop on c4 pins Black's knight on c6 against the queen on d8. If Black plays ...Nd4, the queen on d8 is exposed. White should avoid ...Nxe4 tricks and capitalize on the pin with d3 planning to attack c6 with Nc3 or Bg5.",
    related: ["skewers", "discovered-attack"],
    faqs: [
      {
        q: "What is a pin in chess?",
        a: "A pin is a tactic where a piece cannot move without exposing a more valuable piece behind it. An absolute pin is against the king (moving is illegal); a relative pin is against another valuable piece (moving loses material).",
      },
      {
        q: "What pieces can create a pin?",
        a: "Bishops, rooks, and queens can create pins. Bishops pin along diagonals, rooks along ranks and files, and queens along all directions.",
      },
      {
        q: "How do you exploit a pin?",
        a: "Pile more attackers onto the pinned piece than the opponent has defenders. Since the pinned piece usually cannot move, it will eventually be lost. You can also use a pin to deny a piece its defensive duty.",
      },
      {
        q: "What is the difference between an absolute and relative pin?",
        a: "An absolute pin is against the king — the pinned piece literally cannot move without putting the king in check. A relative pin is against a queen, rook, or other valuable piece — the pinned piece can move but doing so loses significant material.",
      },
      {
        q: "How do you defend against a pin?",
        a: "Break the pin by moving the valuable piece off the line, interpose a piece to block it, or attack the pinning piece to force it to retreat.",
      },
    ],
  },

  /* ───────────────────────────── FORKS ─────────────────────────────── */
  {
    id: "forks",
    name: "The Fork",
    tagline: "One piece, two threats — your opponent can only save one.",
    description:
      "A fork is when a single attacking piece simultaneously threatens two or more of the opponent's pieces. The opponent can only save one, so the attacker wins the other. Knights are the classic forking piece because of their unique L-shaped movement, but any piece can fork. Recognizing fork patterns is essential for every level of chess player.",
    difficulty: "beginner",
    frequency: "very-common",
    keyIdeas: [
      "Any piece can fork, but knights are the most dangerous because their moves are hardest to foresee",
      "A fork is most effective when it attacks the king (forcing the response) and another valuable piece simultaneously",
      "Look for 'family fork' opportunities with knights: simultaneously attacking king, queen, and rooks",
      "Pawn forks are often unexpected and highly effective — a single pawn can fork two pieces",
      "Forks can be set up by forcing pieces onto specific squares before delivering the fork",
    ],
    howToSpot: [
      "After any knight move, check all squares it currently attacks — are two enemy pieces on those squares?",
      "Look for enemy pieces clustered on the same color or within knight-jumping distance",
      "After a tactic forcing a piece to a specific square, ask: can my knight jump to attack that piece AND another?",
      "Pawn forks: look for two enemy pieces that can be simultaneously attacked by a pawn on its diagonal",
      "Check forks: if you can give check while attacking another piece, your opponent must respond to check first",
    ],
    howToDefend: [
      "Avoid placing two pieces on squares that can be simultaneously forked — keep key pieces spread out",
      "When you see a knight near your position, visualize all squares it could land on next move",
      "After being forked, check if you can win the forking piece with a counter-attack before saving one of your pieces",
      "Interpose a piece to cover one of the forked squares, or create a strong counter-threat",
    ],
    exampleFen:
      "r1bqkb1r/pppp1ppp/8/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5",
    exampleDescription:
      "Black's knight on d4 forks White's bishop on c2 and knight on f3. This is the classic 'Noah's Ark Trap' setup in the Ruy López where a central fork wins material for Black. White must lose at least the bishop or the knight.",
    related: ["pins", "discovered-attack"],
    faqs: [
      {
        q: "What is a fork in chess?",
        a: "A fork is when one piece attacks two or more of the opponent's pieces at the same time. The opponent can only move one piece to safety, so the other is captured.",
      },
      {
        q: "Which piece is best at forking?",
        a: "Knights are considered the best forking pieces because their L-shaped movement is hard to visualize and they can jump over other pieces. However, queens, bishops, rooks, and even pawns can fork effectively.",
      },
      {
        q: "What is a royal fork?",
        a: "A royal fork (also called a family fork) is when a knight simultaneously attacks the king, queen, and often a rook at the same time, winning at least the queen since the king must move out of check.",
      },
      {
        q: "How do I set up a fork?",
        a: "Forks can be set up by forcing the opponent's pieces onto specific squares using tactical threats. Look for checks or captures that force pieces into a fork pattern, then deliver the fork.",
      },
    ],
  },

  /* ─────────────────────────── SKEWERS ─────────────────────────────── */
  {
    id: "skewers",
    name: "The Skewer",
    tagline: "Attack the more valuable piece — and win what hides behind it.",
    description:
      "A skewer is the inverse of a pin: the more valuable piece is attacked first and must move, exposing an equally or less valuable piece behind it to capture. Queens and kings are most commonly skewered. Understanding skewers alongside pins gives you a complete toolkit for exploiting pieces on the same rank, file, or diagonal.",
    difficulty: "beginner",
    frequency: "common",
    keyIdeas: [
      "In a skewer, the more valuable piece is in front and must move to escape the attack",
      "After the valuable piece moves, the attacker captures the piece that was hiding behind it",
      "Rooks, bishops, and queens can all execute skewers along lines",
      "King skewers are especially powerful in endgames — the king is forced to move and material is won",
      "A skewer can win undefended pieces or even pieces that were protected but behind someone else",
    ],
    howToSpot: [
      "Look for your rook, bishop, or queen aligned with a valuable enemy piece — is there another piece directly behind it?",
      "In endgames, look for king positions where the king is on the same file, rank, or diagonal as another piece",
      "After a long diagonal or rank becomes open, visualize what's on the other end",
      "Any time you can check to force a king move, ask: what does moving the king expose?",
    ],
    howToDefend: [
      "Keep your king out of long lines of pieces in endgames — active king placement matters",
      "Don't leave valuable pieces on the same file, rank, or diagonal as lesser pieces",
      "If skewered, check if the piece behind can escape or if you have a counter-threat that gains tempo",
      "Occupy the line between your pieces to break the skewer",
    ],
    exampleFen: "8/8/8/8/3k4/8/3R4/3K4 w - - 0 1",
    exampleDescription:
      "White's rook on d2 can skewer the black king on d4 with Rd2-d8+ (rook check). The king must move off the d-file, and the rook can then follow up. In endgames, skewers with rooks are one of the most common winning techniques.",
    related: ["pins", "discovered-attack"],
    faqs: [
      {
        q: "What is a skewer in chess?",
        a: "A skewer attacks a high-value piece directly, forcing it to move, which then exposes a second piece behind it to capture. It's the reverse of a pin.",
      },
      {
        q: "What's the difference between a skewer and a pin?",
        a: "In a pin, the less valuable piece is in front and can't move. In a skewer, the more valuable piece is in front and is forced to move, exposing what's behind it.",
      },
      {
        q: "Can a knight create a skewer?",
        a: "No. Knights jump to their destination square directly — they don't attack along lines. Only long-range pieces (bishops, rooks, queens) can create skewers.",
      },
      {
        q: "How do I practice spotting skewers?",
        a: "Train by looking at any position for all long open lines (files, ranks, diagonals) and asking whether you can place a sliding piece at one end to threaten both ends. Tactics trainers like the FireChess puzzle system include dedicated skewer exercises.",
      },
    ],
  },

  /* ──────────────────────── DISCOVERED ATTACK ──────────────────────── */
  {
    id: "discovered-attack",
    name: "Discovered Attack",
    tagline: "Move one piece to unleash a hidden weapon behind it.",
    description:
      "A discovered attack occurs when a piece moves and unmasks a second piece that delivers an attack. The piece that physically moves can also make a threat of its own, creating a double threat that is almost impossible to meet. The discovered check — where the king is attacked by the unmasked piece — is among the most powerful tactics in chess.",
    difficulty: "intermediate",
    frequency: "common",
    keyIdeas: [
      "Two threats arise simultaneously: one from the moved piece and one from the unmasked piece",
      "A discovered check forces the opponent to deal with check first, giving your other piece free rein",
      "A 'double check' (where both pieces give check) can only be escaped by moving the king",
      "The 'battery' (two aligned pieces) must be set up before the discovery can be delivered",
      "The moving piece should create its own threat — check, capture, or decisive attack — not just step aside",
    ],
    howToSpot: [
      "Look for pieces hiding behind other friendly pieces along ranks, files, or diagonals",
      "Ask: if I move the blocking piece, what lines open up and what do they aim at?",
      "Identify if the moving piece can simultaneously attack a second target",
      "Realized knights are especially effective moving pieces — they can both reveal a bishop/rook battery and fork",
    ],
    howToDefend: [
      "Avoid placing your king on the same line as an enemy battery even if the line appears blocked",
      "Eliminate the front piece of a battery to defuse the potential discovery",
      "Keep track of all your opponent's hidden long-range piece alignments",
      "If facing a double check, the only legal response is to move the king — be sure the king has safe squares",
    ],
    exampleFen:
      "r2qkb1r/ppp2ppp/2n1bn2/3pp3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 2 7",
    exampleDescription:
      "White has a potential discovered attack: if the knight on f3 moves with a threat (e.g. Ne5 attacking the queen on d8 and f7), it also reveals the bishop on c4's line toward the king. This pattern of knight-moving to attack while the bishop battery fires is a classic Italian Game resource.",
    related: ["pins", "forks"],
    faqs: [
      {
        q: "What is a discovered attack in chess?",
        a: "A discovered attack is when you move a piece to reveal an attack from a second piece hidden behind it. Both pieces can create threats simultaneously, making the tactic very difficult to defend.",
      },
      {
        q: "What is a discovered check?",
        a: "A discovered check is a discovered attack where the revealed piece gives check to the king. The moving piece is then free to create another threat since the opponent must first deal with the check.",
      },
      {
        q: "What is a double check?",
        a: "A double check is when both the moving piece and the revealed piece give check simultaneously. It is the most powerful form of discovered attack because the only legal response is to move the king — you cannot block or capture both checking pieces at once.",
      },
      {
        q: "How do I create a discovered attack?",
        a: "First, set up a 'battery' — two pieces aligned on the same rank, file, or diagonal with one blocking the other's line. Then look for a way to move the blocking piece with tempo (check, capture, or threat) to reveal the attack from behind.",
      },
    ],
  },

  /* ──────────────────────── BACK-RANK MATE ─────────────────────────── */
  {
    id: "back-rank-mate",
    name: "Back-Rank Mate",
    tagline: "Trap the king behind its own pawns — then deliver checkmate.",
    description:
      "A back-rank mate occurs when the king is trapped on the back rank by its own pawns and a rook or queen delivers checkmate along that rank. It is one of the most common mating patterns at all levels, recurring in thousands of games every day. Knowing both how to create it and how to prevent it is essential knowledge for any chess player.",
    difficulty: "beginner",
    frequency: "very-common",
    keyIdeas: [
      "The king is trapped by its own pawns — the 'pawn shelter' becomes a prison",
      "A rook or queen slides to the back rank to deliver checkmate when no retreat is possible",
      "Back-rank threats force piece placement and can create indirect material gains even when immediate mate isn't available",
      "The classic back-rank tactic involves sacrificing material to deflect or eliminate the back-rank defender",
      "Creating a 'luft' (escape square) for the king is the standard prevention — move one pawn one square forward",
    ],
    howToSpot: [
      "Check if the opposing king is on the back rank with no open file to the next rank",
      "Ask: is there only one rook or queen defending the back rank? If yes, can I take it or deflect it?",
      "Count back-rank defenders vs attackers — if defenders are overloaded, a back-rank combination may work",
      "Look for pieces pinned to back-rank defense: a rook that cannot leave because it guards mate on the 8th rank",
    ],
    howToDefend: [
      "Create 'luft' — push one of the pawns in front of the king one square to give it an escape square",
      "Keep at least one rook defending the back rank if your king is behind a pawn shelter",
      "Be aware when your back-rank pieces are tied down to defense — this limits your tactical options",
      "In endgames, activate your king early to avoid back-rank vulnerabilities",
    ],
    exampleFen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    exampleDescription:
      "White can play Rd8+ and if Black blocks with a back-rank piece, Rxd8 is checkmate. If Black's pawns were on f7-g7-h7 with no escape, Rd8# would be immediate. This is the purest illustration of back-rank vulnerability — Black needs luft (h6 or g6) urgently.",
    related: ["deflection", "interference"],
    faqs: [
      {
        q: "What is a back-rank mate in chess?",
        a: "A back-rank mate (also called a back-rank checkmate or Corridor mate) is when a rook or queen delivers checkmate on the opponent's first or eighth rank, and the king cannot escape because it is blocked by its own pawns.",
      },
      {
        q: "How do I prevent a back-rank mate?",
        a: "Create 'luft' by pushing one of the pawns in front of your castled king by one square. This gives the king an escape square and prevents back-rank checkmates.",
      },
      {
        q: "What is luft in chess?",
        a: "Luft (German for 'air') is a pawn move that creates an escape square for the king, preventing back-rank checkmates. It's a key defensive technique in closed positions.",
      },
      {
        q: "How do I exploit a back-rank weakness?",
        a: "Look for ways to deflect or destroy the piece defending the back rank (usually a rook). Material sacrifices to eliminate the back-rank defender often lead to immediate checkmate or win of heavy material.",
      },
    ],
  },

  /* ──────────────────────── SMOTHERED MATE ─────────────────────────── */
  {
    id: "smothered-mate",
    name: "Smothered Mate",
    tagline:
      "A knight delivers checkmate — the king suffocates among its own pieces.",
    description:
      "Smothered mate is one of chess's most elegant combinations: a knight delivers checkmate to a king that has been completely surrounded by its own pieces, leaving it with no escape squares. The typical sequence involves a queen sacrifice to lure a rook to the corner, then the knight administers a poetic coup de grâce. The pattern — attributed to Philidor — appears in games from the 15th century to modern grandmaster play.",
    difficulty: "intermediate",
    frequency: "uncommon",
    keyIdeas: [
      "The king is surrounded on all sides by its own pieces, making it unable to flee",
      "The classic pattern requires a queen sacrifice to place a friendly rook on the corner square adjacent to the king",
      "The knight's L-shape movement allows it to check a king that no other piece can reach due to a crowded position",
      "Smothered mate usually occurs on h8 or g8 (or h1/g1 on the queen's side)",
      "Requires a specific king position — castled into the corner with rook on f8 and pawns on f7, g7, h7",
    ],
    howToSpot: [
      "Look for a king that has castled and is surrounded by pieces on g8 (rook on f8, pawns on f7, g7, h7)",
      "This pattern requires a knight that can reach f7 or f2 to give check",
      "The sequence: Nf7+ (check, fork with Ng5+), then Nh6++ (double check), Qg8+ Rxg8, Nf7#",
      "Recognize when your opponent's pieces form a 'smothering' configuration and calculate the knight route in",
    ],
    howToDefend: [
      "Avoid having all three pawns (f7, g7, h7) intact with a rook on f8 and castled king on g8 — this is the exact smothered mate setup",
      "Keep the f-pawn or h-pawn advanced to give the king an escape square",
      "Similarly, avoid the mirror pattern on the queenside",
    ],
    exampleFen: "6rk/6pp/8/8/8/8/6PP/6NK w - - 0 1",
    exampleDescription:
      "White has a smothered mate in two: Nf7+ Rxf7?? Nh6#. Black's king on h8 is surrounded — g8 is occupied by its own rook (after Nf7+ forces Rxf7), g7 and h7 are blocked by pawns. The knight delivers checkmate on h6 to the trapped king. This is the essence of smothered mate.",
    related: ["back-rank-mate", "deflection"],
    faqs: [
      {
        q: "What is smothered mate in chess?",
        a: "Smothered mate is when a knight delivers checkmate to a king that is surrounded and immobilized by its own pieces. The king has no escape squares because all adjacent squares are occupied by its own material.",
      },
      {
        q: "What is the Philidor Legacy?",
        a: "The Philidor Legacy is the classical smothered mate sequence: Nf7+ (fork), Nh6++ (double check), then Qg8+! Rxg8, and Nf7#. The queen sacrifice forces the rook to cover the king's only escape, and the knight delivers mate.",
      },
      {
        q: "Can any piece deliver smothered mate?",
        a: "No — smothered mate is unique to knights because only the knight can jump over pieces and reach squares that all other pieces cannot access in a crowded position. The L-shape move is what makes it possible.",
      },
      {
        q: "How often does smothered mate occur in real games?",
        a: "Smothered mate is relatively rare but stunning when it occurs. The pattern is more commonly used as a threat to win material, or the opponent resigns when they see the combination rather than allowing mate.",
      },
    ],
  },

  /* ─────────────────────────── ZWISCHENZUG ─────────────────────────── */
  {
    id: "zwischenzug",
    name: "Zwischenzug",
    tagline:
      "Ignore the obvious recapture — play a powerful in-between move first.",
    description:
      "Zwischenzug (German: 'in-between move', also called intermezzo) is the technique of inserting a powerful intermediate move before the 'expected' recapture or continuation. Instead of simply recapturing, you first play a move — usually a check, capture, or decisive threat — that forces your opponent to respond, creating a more favorable situation before completing the expected sequence. Zwischenzug is what separates calculating players from reactive ones.",
    difficulty: "intermediate",
    frequency: "common",
    keyIdeas: [
      "Never assume your opponent must recapture — they may play an in-between move that changes the position entirely",
      "Common zwischenzug includes check before recapture, winning a tempo or changing the recapture order",
      "Material evaluation must always account for zwischenzug possibilities — recapture sequences are rarely forced",
      "A zwischenzug can turn a losing recapture into equality, or an equal position into a winning one",
      "Always ask 'what if they don't recapture?' before committing to a sequence",
    ],
    howToSpot: [
      "After a capture, can you play a check or new attack before recapturing?",
      "Look for moments where your opponent 'assumes' you'll recapture — this is your opportunity",
      "Whenever calculating a sequence, always test each position for unexpected threats that interrupt the flow",
      "Checks are the strongest zwischenzug because they force a response and guarantee tempo",
    ],
    howToDefend: [
      "Before completing a recapture, always ask: does my opponent have a zwischenzug here?",
      "Don't assume lines are forced — double-check at every step in your calculation",
      "If you suspect a zwischenzug, look for ways to pre-empt it by completing your threat first or sealing the position",
    ],
    exampleFen:
      "r1bqk2r/pp2ppbp/2np1np1/2pP4/4P3/2N2N2/PP2BPPP/R1BQK2R b KQkq - 0 7",
    exampleDescription:
      "This position from the Grünfeld Defense illustrates zwischenzug concepts: rather than simply recapturing the d5 pawn, Black can first play ...Nb4 attacking the bishop on e2 before recapturing. The in-between move forces White to move the bishop, changing the recapture dynamics completely.",
    related: ["discovered-attack", "deflection"],
    faqs: [
      {
        q: "What is a zwischenzug in chess?",
        a: "Zwischenzug (in-between move or intermezzo) is when instead of the 'expected' recapture or continuation, a player first inserts a more powerful intermediate move — usually a check, capture, or strong threat — before completing the original sequence.",
      },
      {
        q: "How do you pronounce zwischenzug?",
        a: "Zwischenzug is pronounced 'ZVISH-en-tsoog'. It comes from German — 'zwischen' means 'between' and 'Zug' means 'move'.",
      },
      {
        q: "What makes zwischenzug so powerful?",
        a: "It violates the opponent's expectation. If you can force the opponent to respond to an intermediate threat, you change the position before completing the sequence — often creating a winning advantage that wouldn't exist in the 'normal' recapture line.",
      },
      {
        q: "How do I train myself to look for zwischenzug?",
        a: "Deliberately pause before every recapture and ask: 'Do I have something better than recapturing right now?' Practice never assuming a sequence is forced — especially after your opponent makes a capture.",
      },
    ],
  },

  /* ─────────────────────────── DEFLECTION ──────────────────────────── */
  {
    id: "deflection",
    name: "Deflection",
    tagline: "Force a key defender away from its post — then strike.",
    description:
      "Deflection (also called decoy or overloading) is the technique of forcing a piece away from a square or line it is defending, exposing something it was protecting. The deflecting move is usually a sacrifice — you offer material to force the defending piece to move or capture, removing it from its defensive duty. The resulting exposure is worth more than the material invested.",
    difficulty: "intermediate",
    frequency: "common",
    keyIdeas: [
      "Identify which piece is holding your opponent's position together — your target is to deflect that piece",
      "The deflecting sacrifice must be decisive: the opponent must capture it (or face a worse outcome)",
      "Overloading is related: a piece asked to defend two things at once can only do one when threatened",
      "Deflection sacrifices range from a single pawn to a queen — the material cost is justified by the resulting tactics",
      "After deflecting a defender, the previously protected piece or square becomes the second target",
    ],
    howToSpot: [
      "Find a piece that is defending something critical — if it weren't there, what would happen?",
      "Ask: can I force that piece away with a sacrifice it 'must' take?",
      "Look for pieces overloaded — defending two things at once — and attack both simultaneously",
      "Back-rank defenders are classic deflection targets: winning the rook forced to guard the back rank opens a mating attack",
    ],
    howToDefend: [
      "Avoid overloading individual pieces with too many defensive duties",
      "When you feel a piece is critically placed, ask whether the opponent can deflect it and plan a backup",
      "Counter-attack to create your own threats when being deflected — sometimes a mutual attack resolves more favorably",
    ],
    exampleFen: "r5k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    exampleDescription:
      "White can deflect Black's back-rank defender with Rd8+! If Rxd8, the rook is gone and White has won decisive material. Black's rook was overloaded — defending the back rank AND possibly other duties. Forcing it to capture defects the defensive structure.",
    related: ["back-rank-mate", "interference", "zwischenzug"],
    faqs: [
      {
        q: "What is deflection in chess?",
        a: "Deflection is a tactic that forces a defending piece away from the square or line it is protecting, usually through a sacrifice. Once deflected, the piece can no longer defend what it was guarding.",
      },
      {
        q: "What is the difference between deflection and decoy?",
        a: "A decoy lures a piece to a specific (usually bad) square. Deflection forces a piece away from a good square. They overlap conceptually — both involve forcing a piece to move — but decoy emphasizes the destination while deflection emphasizes what is left unprotected.",
      },
      {
        q: "What is overloading in chess tactics?",
        a: "Overloading is when a single piece is asked to perform too many defensive duties. You can exploit an overloaded piece by attacking both things it defends simultaneously, forcing it to abandon one of its duties.",
      },
      {
        q: "How do I practice deflection tactics?",
        a: "Look for positions where one piece is the only defender of a critical square — then calculate if a sacrifice forces it away. The FireChess puzzle trainer includes targeted deflection puzzles to build pattern recognition.",
      },
    ],
  },

  /* ────────────────────────── INTERFERENCE ─────────────────────────── */
  {
    id: "interference",
    name: "Interference",
    tagline:
      "Block the connection between two defending pieces — divide and conquer.",
    description:
      "Interference is an advanced tactic where you place a piece on a square that simultaneously blocks the communication between two of the opponent's pieces. A rook that defended along a file and a queen behind it suddenly can't coordinate — the interference piece cuts their connection. Interference sacrifices can win material or lead to checkmate, and recognizing them requires a keen eye for piece coordination.",
    difficulty: "advanced",
    frequency: "uncommon",
    keyIdeas: [
      "Interference targets the line of communication between two cooperating pieces",
      "An interference piece is usually sacrificed — the piece is placed on the blocking square even if it can be captured",
      "After the interference, one or both of the blocked pieces becomes unable to defend what it previously protected",
      "Pieces that defend along two lines (like a queen) are especially vulnerable to interference — block one task and the other defense collapses",
      "Interference is most effective when both blocked pieces are controlling critical squares or preventing checkmate",
    ],
    howToSpot: [
      "Identify two of the opponent's pieces that defend the same critical squares — is there a square on their shared line?",
      "Ask: if I put my piece on square X, which opponent communications are cut?",
      "After interference, recalculate the position from scratch — often devastating threats appear",
      "Interference is frequently the final step in a combination that only becomes clear after eliminating defenders one by one",
    ],
    howToDefend: [
      "Avoid relying on pieces that are far apart to defend the same squares — break the chain into independent defenses",
      "If you sense interference is possible, find ways to defend the critical square with multiple pieces from different directions",
      "Counter-attack as a response — interference sacrifices often give you material that can fuel a counter-offense",
    ],
    exampleFen: "2r3k1/5pp1/7p/8/8/8/1R6/4R1K1 w - - 0 1",
    exampleDescription:
      "A conceptual interference example: if White could place a piece on c8 interrupting Black's rook's defense of the back rank while Black's king is cornered, the back rank would become vulnerable. Interference patterns are typically identified by tracing how opponent pieces coordinate and finding where a sacrifice disrupts that cooperation.",
    related: ["deflection", "back-rank-mate"],
    faqs: [
      {
        q: "What is interference in chess?",
        a: "Interference is a tactic where you deliberately place a piece on a square that cuts the line of communication between two of your opponent's pieces. This disrupts their coordination and can expose a weakness or enable a mating attack.",
      },
      {
        q: "How is interference different from blocking?",
        a: "Blocking is a defensive technique (you block a check or attack). Interference is offensive — you interpose your piece between enemy pieces to disrupt their coordination and exploit the resulting weaknesses.",
      },
      {
        q: "Is interference common in games?",
        a: "Interference is one of the more advanced and less frequent tactical motifs. It appears most often in complex positions with many pieces, and is frequently the decisive move in longer combinations.",
      },
      {
        q: "What pieces are typically used for interference?",
        a: "Any piece can execute an interference, but pawns are common because they are cheap and hard to ignore. Knights and rooks are also frequently used. The interference piece is often sacrificed since the positional gain outweighs the material cost.",
      },
    ],
  },
];

export const TACTIC_CATEGORIES = [
  { id: "all", label: "All Tactics" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
] as const;
