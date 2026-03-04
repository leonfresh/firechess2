/**
 * Opening Cheat Sheets — curated library of opening guides.
 *
 * Each guide covers:
 *  - ECO code, move order, key ideas
 *  - Plans for both sides
 *  - Common traps
 *  - Critical positions (FEN)
 */

export type OpeningGuide = {
  id: string;
  name: string;
  eco: string;
  /** e.g. "e4 openings", "d4 openings", "flank" */
  category: "e4" | "d4" | "flank" | "e4-e5" | "semi-open" | "indian";
  /** First few moves in SAN */
  moves: string;
  /** One-liner summary */
  tagline: string;
  /** Key ideas / philosophy */
  keyIdeas: string[];
  /** Plans for White */
  whitePlans: string[];
  /** Plans for Black */
  blackPlans: string[];
  /** Common traps or pitfalls */
  traps: { name: string; description: string }[];
  /** Critical positions with FEN and explanation */
  positions: { fen: string; label: string; note: string }[];
  /** Difficulty: beginner, intermediate, advanced */
  difficulty: "beginner" | "intermediate" | "advanced";
  /** Famous practitioners */
  players: string[];
};

export const OPENING_GUIDES: OpeningGuide[] = [
  /* ================================================================ */
  /*  E4-E5 OPENINGS                                                    */
  /* ================================================================ */
  {
    id: "italian-game",
    name: "Italian Game",
    eco: "C50–C54",
    category: "e4-e5",
    moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4",
    tagline: "Classical development targeting f7 — ideal for beginners.",
    keyIdeas: [
      "Rapid development of bishop to an active diagonal",
      "Central control with d3 or d4",
      "Pressure against the f7 pawn",
      "Flexible pawn structures allowing many plans",
    ],
    whitePlans: [
      "Play c3 and d4 to establish a strong center (Giuoco Piano)",
      "Develop pieces quickly with Nc3, 0-0, and Re1",
      "Use the bishop pair actively after d4 exchanges",
      "Attack on the kingside after castling short",
    ],
    blackPlans: [
      "Counter in the center with d5 or d6",
      "Develop Bc5 or Nf6 to challenge White's setup",
      "Castle early for king safety",
      "Look for …Na5 to challenge the c4 bishop",
    ],
    traps: [
      {
        name: "Fried Liver Attack",
        description: "After 3…Nf6 4.Ng5 d5 5.exd5 Nxd5?? 6.Nxf7! Kxf7 7.Qf3+ — devastating attack on the exposed king.",
      },
      {
        name: "Légal Trap",
        description: "White sacrifices the queen with Nxe5 to deliver checkmate with Bxf7+ and minor pieces.",
      },
    ],
    positions: [
      {
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
        label: "Starting Position",
        note: "The Italian Game tabiya. Black chooses between Bc5 (Giuoco Piano), Nf6 (Two Knights), or d6.",
      },
      {
        fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2BPP3/5N2/PPP2PPP/RNBQK2R b KQkq d3 0 4",
        label: "Center Strike with d4",
        note: "White fights for the center immediately. Critical moment for Black to decide on exd4 or d6.",
      },
    ],
    difficulty: "beginner",
    players: ["Giuoco Greco", "Garry Kasparov", "Fabiano Caruana"],
  },
  {
    id: "ruy-lopez",
    name: "Ruy López (Spanish Game)",
    eco: "C60–C99",
    category: "e4-e5",
    moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5",
    tagline: "The king of openings — deep strategic play with long-term pressure.",
    keyIdeas: [
      "Indirect pressure on e5 through the c6 knight",
      "Building a slow positional advantage",
      "Flexible plans depending on Black's setup",
      "One of the most deeply analyzed openings in chess history",
    ],
    whitePlans: [
      "Maintain central tension and avoid premature exchanges",
      "Play d4 at the right moment to open the center",
      "Maneuver Nd2-f1-g3 or e3 for kingside play",
      "Use the bishop pair after a6-b5 retreats",
    ],
    blackPlans: [
      "Play …a6 to challenge the bishop (Morphy Defense)",
      "Counter with …d6 and …Nf6 for solid development",
      "The Marshall Attack (…d5) for aggressive counterplay",
      "Aim for …f5 breaks in the Berlin endgame",
    ],
    traps: [
      {
        name: "Noah's Ark Trap",
        description: "After a6, b5, c5 — Black traps the Bb5 on a4 with …b5 and …c5 closing the diagonal.",
      },
      {
        name: "Tarrasch Trap",
        description: "In the Open Ruy Lopez, if White plays 8.dxe5?? the knight on b5 hangs after …Na5.",
      },
    ],
    positions: [
      {
        fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
        label: "Ruy López Starting Position",
        note: "The pin on c6 creates subtle pressure on Black's center. Most common reply: 3…a6.",
      },
      {
        fen: "r1bqkbnr/1ppp1ppp/p1n5/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
        label: "After 3…a6 4.Ba4 (Morphy Defense)",
        note: "White maintains the bishop. The game has enormous theoretical depth from here.",
      },
    ],
    difficulty: "intermediate",
    players: ["Bobby Fischer", "Garry Kasparov", "Anatoly Karpov", "Magnus Carlsen"],
  },
  {
    id: "scotch-game",
    name: "Scotch Game",
    eco: "C44–C45",
    category: "e4-e5",
    moves: "1.e4 e5 2.Nf3 Nc6 3.d4",
    tagline: "Immediate central confrontation — active and straightforward.",
    keyIdeas: [
      "Open the center early for piece activity",
      "Avoid the deep theory of the Ruy López",
      "White gets an active game quickly",
    ],
    whitePlans: [
      "Recapture on d4 with the knight for central control",
      "Develop rapidly and castle kingside",
      "Use the open d-file and half-open e-file",
      "In the Scotch Four Knights, play Nd5 for pressure",
    ],
    blackPlans: [
      "Capture exd4 to open lines",
      "Play …Qh4 (Steinitz variation) for aggressive counterplay",
      "Develop Bc5 or Bb4 for active piece play",
      "Aim for …d5 to equalize in the center",
    ],
    traps: [
      {
        name: "Scotch Gambit f7 Attack",
        description: "After 4.Bc4 Nf6 5.e5 — White gains tempo and targets f7 aggressively.",
      },
    ],
    positions: [
      {
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 3",
        label: "Scotch Game Position",
        note: "White immediately challenges the center. Black almost always plays 3…exd4.",
      },
    ],
    difficulty: "beginner",
    players: ["Garry Kasparov", "Magnus Carlsen"],
  },
  {
    id: "kings-gambit",
    name: "King's Gambit",
    eco: "C30–C39",
    category: "e4-e5",
    moves: "1.e4 e5 2.f4",
    tagline: "The romantic sacrifice — gambit the f-pawn for a swashbuckling attack.",
    keyIdeas: [
      "Sacrifice a pawn for rapid development and an open f-file",
      "Remove Black's e5 pawn to dominate the center with d4",
      "Aggressive kingside play from move 2",
      "Leads to sharp, tactical positions",
    ],
    whitePlans: [
      "After exf4, play Nf3 and Bc4 for quick development",
      "Open the f-file for the rook after castling",
      "Push d4 for a massive center",
      "Launch a kingside attack with g3 and Bxf4",
    ],
    blackPlans: [
      "Accept with …exf4 and try to hold the extra pawn",
      "Decline with …Bc5 (Classical Defense) keeping a solid center",
      "Counter-gambit with …d5 (Falkbeer Counter-Gambit)",
      "Play …Qh4+ to exploit White's weakened kingside early",
    ],
    traps: [
      {
        name: "Qh4+ Check",
        description: "After 2…exf4 3.Nf3?? Black plays 3…d6 then …Qh4+ exploiting the weak f2 square.",
      },
      {
        name: "Muzio Gambit",
        description: "White sacrifices a whole knight on f7 for a devastating attack: 3.Nf3 g5 4.Bc4 g4 5.0-0!?",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2",
        label: "King's Gambit Offered",
        note: "The critical moment: accept with …exf4 or decline? Both lead to rich positions.",
      },
    ],
    difficulty: "intermediate",
    players: ["Boris Spassky", "Paul Morphy", "David Bronstein"],
  },
  {
    id: "vienna-game",
    name: "Vienna Game",
    eco: "C25–C29",
    category: "e4-e5",
    moves: "1.e4 e5 2.Nc3",
    tagline: "A flexible delayed King's Gambit with Nc3 — less committal, many options.",
    keyIdeas: [
      "Prepare f4 with the knight already developed",
      "More flexible than the King's Gambit — can transpose",
      "Supports a central buildup with Bc4 and d3",
    ],
    whitePlans: [
      "Play f4 (Vienna Gambit) after Nf6 for aggressive play",
      "Develop Bc4, d3, and f4 for a slow buildup",
      "Transpose into the Bishop's Opening with Bc4",
    ],
    blackPlans: [
      "Play …Nf6 for solid development",
      "…Bc5 to develop actively and keep options open",
      "Counter the f4 push with …d5 central break",
    ],
    traps: [
      {
        name: "Frankenstein-Dracula Variation",
        description: "1.e4 e5 2.Nc3 Nf6 3.Bc4 Nxe4!? 4.Qh5 Nd6 5.Bb3 Nc6 — wild complications.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 2",
        label: "Vienna Game Starting Position",
        note: "Nc3 supports e4 and prepares f4. Very flexible for White.",
      },
    ],
    difficulty: "intermediate",
    players: ["Mikhail Chigorin", "Boris Spassky"],
  },
  {
    id: "petrov-defense",
    name: "Petrov Defense (Russian Game)",
    eco: "C42–C43",
    category: "e4-e5",
    moves: "1.e4 e5 2.Nf3 Nf6",
    tagline: "Solid and symmetrical — Black mirrors White and aims for equality.",
    keyIdeas: [
      "Black immediately counterattacks e4 instead of defending e5",
      "Leads to solid, drawish positions",
      "White must play accurately to keep any advantage",
    ],
    whitePlans: [
      "Play 3.Nxe5 (main line) — NOT 3.d4 which gives up the center",
      "After 3.Nxe5 d6 4.Nf3 Nxe4 — play for a slight edge with d4",
      "Try 3.d4 (Steinitz Attack) for an open game",
    ],
    blackPlans: [
      "Equalize with precise play after 3.Nxe5 d6 4.Nf3 Nxe4",
      "Maintain symmetry and simplify toward equality",
      "Play …Be7, …0-0, …Re8 for rock-solid setup",
    ],
    traps: [
      {
        name: "Stafford Gambit",
        description: "2…Nf6 3.Nxe5 Nc6!? — a dubious but tricky gambit popular online. White must play 4.Nxc6! (not 4.Nf3??).",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        label: "Petrov Defense",
        note: "Black mirrors White's knight move. The game often becomes very solid and strategic.",
      },
    ],
    difficulty: "beginner",
    players: ["Fabiano Caruana", "Sergey Karjakin", "Vladimir Kramnik"],
  },

  /* ================================================================ */
  /*  SICILIAN & SEMI-OPEN                                              */
  /* ================================================================ */
  {
    id: "sicilian-open",
    name: "Sicilian Defense (Open)",
    eco: "B20–B99",
    category: "semi-open",
    moves: "1.e4 c5 2.Nf3 d6 3.d4",
    tagline: "The most popular and sharpest response to 1.e4 — asymmetric and combative.",
    keyIdeas: [
      "Black fights for the center with a pawn on c5 instead of e5",
      "Asymmetric pawn structures create imbalanced, decisive games",
      "Both sides have clear attacking plans on opposite wings",
      "Massive theoretical depth across dozens of variations",
    ],
    whitePlans: [
      "Open the center with d4 and recapture with the knight",
      "Develop Bc4/Be2, castle, and play on the kingside",
      "In many lines: f3, Be3, Qd2, 0-0-0 for a kingside pawn storm",
      "The English Attack (f3, Be3, Qd2) is a universal approach",
    ],
    blackPlans: [
      "Counter on the queenside with …a6, …b5, …Bb7",
      "Use the half-open c-file after …cxd4",
      "Play …e5 to challenge the center",
      "The …d5 break is often the key equalizing move",
    ],
    traps: [
      {
        name: "Siberian Trap (Kan/Taimanov)",
        description: "After …Qa5 checking and winning the e5 knight if White plays carelessly.",
      },
      {
        name: "Magnus Smith Trap",
        description: "In the Dragon: White plays Nd5 and if …e5?? then Nc7+ forks.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/pp2pppp/3p4/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 3",
        label: "Open Sicilian – d4 Played",
        note: "The critical moment. Black takes on d4, and after Nxd4 the open Sicilian begins.",
      },
      {
        fen: "rnbqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R b KQkq - 1 5",
        label: "Najdorf Tabiya – 5…a6",
        note: "The most popular position in all of chess. Black plays …a6 preparing …e5 or …b5.",
      },
    ],
    difficulty: "intermediate",
    players: ["Garry Kasparov", "Bobby Fischer", "Magnus Carlsen", "Vishwanathan Anand"],
  },
  {
    id: "sicilian-najdorf",
    name: "Sicilian Najdorf",
    eco: "B90–B99",
    category: "semi-open",
    moves: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6",
    tagline: "The sharpest Sicilian — Fischer and Kasparov's weapon of choice.",
    keyIdeas: [
      "…a6 is a multipurpose move: prepares …e5 or …b5",
      "Flexible — can lead to positional or wildly tactical play",
      "The most analyzed opening line in history",
    ],
    whitePlans: [
      "6.Bg5 (Classical) — pins the knight, leads to sharp play",
      "6.Be3 (English Attack) — f3, Qd2, 0-0-0, g4 pawn storm",
      "6.Be2 (Quiet system) — positional approach",
      "6.f3 (also English Attack setup) — very aggressive",
    ],
    blackPlans: [
      "Play …e5 to seize central space",
      "Counter on the queenside with …b5 and …Bb7",
      "Use the …d5 break to equalize when possible",
      "Against 6.Bg5: the Poisoned Pawn (…Qb6) is double-edged",
    ],
    traps: [
      {
        name: "Poisoned Pawn Variation",
        description: "6.Bg5 e6 7.f4 Qb6!? grabbing the b2 pawn — incredibly sharp and deeply analyzed.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
        label: "Najdorf 5…a6",
        note: "White's 6th move defines the entire character of the game. Multiple viable systems.",
      },
    ],
    difficulty: "advanced",
    players: ["Bobby Fischer", "Garry Kasparov", "Viswanathan Anand", "Maxime Vachier-Lagrave"],
  },
  {
    id: "sicilian-dragon",
    name: "Sicilian Dragon",
    eco: "B70–B79",
    category: "semi-open",
    moves: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6",
    tagline: "The fianchetto Sicilian — Black's dark-squared bishop breathes fire.",
    keyIdeas: [
      "Black fianchettoes on g7, creating a powerful diagonal",
      "The Yugoslav Attack leads to one of chess's most violent battles",
      "Both sides castle on opposite wings and attack",
    ],
    whitePlans: [
      "Yugoslav Attack: Be3, f3, Qd2, 0-0-0, then h4-h5-h6",
      "Pawn storm on the kingside to break open Black's castle",
      "Sac on g6 or h5 to crack open the king",
    ],
    blackPlans: [
      "Fianchetto the bishop on g7 for a powerful diagonal",
      "Counterattack on the queenside: …Rc8, …a5, …b5",
      "Use the c-file pressure after …Rc8",
      "The exchange sacrifice …Rxc3 is a standard Dragon theme",
    ],
    traps: [
      {
        name: "Exchange Sac on c3",
        description: "…Rxc3! bxc3 opens lines, shatters White's queenside, and unleashes the Dragon bishop.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/pp2pp1p/3p1np1/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
        label: "Dragon Setup",
        note: "Black commits to ...g6. White decides between the fearsome Yugoslav Attack or calmer lines.",
      },
    ],
    difficulty: "advanced",
    players: ["Garry Kasparov", "Teimour Radjabov", "Sergei Tiviakov"],
  },
  {
    id: "french-defense",
    name: "French Defense",
    eco: "C00–C19",
    category: "semi-open",
    moves: "1.e4 e6",
    tagline: "Solid and strategic — the French wall holds and counterattacks.",
    keyIdeas: [
      "Black builds a solid pawn chain e6-d5",
      "The light-squared bishop (c8) is often the 'French bishop' problem piece",
      "Strategic complexity with pawn chains and piece maneuvering",
    ],
    whitePlans: [
      "Build a pawn center with d4, e5 (Advance Variation)",
      "Exchange center pawns (Exchange Variation) for simpler play",
      "Nc3 systems — Winawer or Classical for sharp play",
      "Occupy space and restrict Black's pieces",
    ],
    blackPlans: [
      "Challenge the center with …c5 (the standard break)",
      "Play …f6 to undermine the e5 pawn in the Advance",
      "Activate the bad bishop with …b6 and …Ba6, or exchange it",
      "The …Qb6 move hits b2 and pressures d4",
    ],
    traps: [
      {
        name: "Winawer Poisoned Pawn",
        description: "3.Nc3 Bb4 4.e5 c5 5.a3 Bxc3+ 6.bxc3 — wild imbalances, Black can grab pawns.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
        label: "French Defense",
        note: "After 1…e6, Black prepares 2…d5 to challenge the center. Solid but slightly passive.",
      },
      {
        fen: "rnbqkbnr/ppp2ppp/4p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
        label: "Advance Variation (3.e5)",
        note: "White gains space but creates a target. Black plays …c5 to attack the pawn chain base.",
      },
    ],
    difficulty: "intermediate",
    players: ["Mikhail Botvinnik", "Viktor Korchnoi", "Alexander Morozevich"],
  },
  {
    id: "caro-kann",
    name: "Caro-Kann Defense",
    eco: "B10–B19",
    category: "semi-open",
    moves: "1.e4 c6",
    tagline: "Rock-solid — support …d5 without blocking the light bishop.",
    keyIdeas: [
      "…c6 supports …d5 while keeping the c8-bishop unblocked",
      "More solid than the French — fewer bad bishop problems",
      "Strategic play with clear plans for both sides",
    ],
    whitePlans: [
      "Advance Variation (3.e5) — grab space, restrict Black",
      "Classical (4.Nf3 or 4.Bd3) — develop normally",
      "Exchange Variation — simplify but maintain initiative",
      "2 Knights / Fantasy Variation for aggressive surprise",
    ],
    blackPlans: [
      "Play …d5 and establish a solid center",
      "After exd5 cxd5 — develop normally with …Bf5 or …Bg4",
      "In the Advance: break with …c5 and …e6",
      "Activate pieces naturally — the bishop is NOT bad here",
    ],
    traps: [
      {
        name: "Advance Bayonet Attack",
        description: "3.e5 Bf5 4.g4!? — the Short variation, very sharp and aggressive.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
        label: "Caro-Kann Starting Position",
        note: "1…c6 prepares …d5 next. Simple and logical.",
      },
    ],
    difficulty: "beginner",
    players: ["Anatoly Karpov", "Vishwanathan Anand", "Ding Liren"],
  },
  {
    id: "pirc-defense",
    name: "Pirc Defense",
    eco: "B07–B09",
    category: "semi-open",
    moves: "1.e4 d6 2.d4 Nf6 3.Nc3 g6",
    tagline: "Hypermodern — let White build a center, then strike it down.",
    keyIdeas: [
      "Black allows White a big center and attacks it later",
      "Fianchetto on g7 provides long-term pressure",
      "Flexible — can transpose to many systems",
    ],
    whitePlans: [
      "Build a massive center with e4, d4, f3",
      "Austrian Attack (f4) for aggressive kingside play",
      "Classical (Nf3, Be2) for solid development",
    ],
    blackPlans: [
      "Fianchetto …Bg7 and castle kingside",
      "Strike the center with …c5 or …e5",
      "Play …b5 for queenside counterplay",
    ],
    traps: [
      {
        name: "Austrian Attack Mishap",
        description: "After 4.f4 Bg7 5.Nf3 0-0 6.e5?! — too early; Black gets counterplay with …dxe5 fxe5 Nd5.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/ppp1pp1p/3p1np1/8/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 4",
        label: "Pirc Defense Setup",
        note: "Black will fianchetto and attack the center. White must decide on an aggressive or calm setup.",
      },
    ],
    difficulty: "intermediate",
    players: ["Viktor Korchnoi", "Vladimir Kramnik"],
  },
  {
    id: "scandinavian",
    name: "Scandinavian Defense",
    eco: "B01",
    category: "semi-open",
    moves: "1.e4 d5",
    tagline: "Strike the center immediately — simple, direct, and underestimated.",
    keyIdeas: [
      "Black hits e4 on move 1 — the simplest possible approach",
      "After 2.exd5 Qxd5, Black develops the queen early",
      "Solid structures and straightforward development",
    ],
    whitePlans: [
      "Gain a tempo with Nc3 attacking the queen",
      "Develop naturally and maintain a slight space advantage",
      "Play d4 to control the center after the queen retreats",
    ],
    blackPlans: [
      "After …Qd5: retreat to Qa5 or Qd6 to avoid tempo loss",
      "The …Nf6 variation (2…Nf6!?) gambits but develops faster",
      "Set up a solid structure with …c6, …Bf5, …e6",
    ],
    traps: [
      {
        name: "Icelandic Gambit",
        description: "2.exd5 Nf6 3.c4 e6!? — ambitious gambit giving up two pawns for rapid development.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
        label: "Scandinavian Defense",
        note: "Black challenges e4 immediately. 2.exd5 is nearly universal.",
      },
    ],
    difficulty: "beginner",
    players: ["Bent Larsen", "Ian Rogers"],
  },
  {
    id: "alekhine-defense",
    name: "Alekhine's Defense",
    eco: "B02–B05",
    category: "semi-open",
    moves: "1.e4 Nf6",
    tagline: "Provocative — lure White's pawns forward then attack them.",
    keyIdeas: [
      "Black invites White to advance pawns and then targets them",
      "Hypermodern philosophy — control the center from a distance",
      "Requires precise play from Black to avoid being overwhelmed",
    ],
    whitePlans: [
      "Chase the knight: e5, d4, c4 building a pawn center",
      "Four Pawns Attack for maximum aggression",
      "Exchange Variation for a calm game",
    ],
    blackPlans: [
      "Allow the pawn center, then undermine with …d6, …c5, …Nc6",
      "Target the overextended pawns",
      "Develop pieces to attack the center from the flanks",
    ],
    traps: [
      {
        name: "Four Pawns Overextension",
        description: "After e5 Nd5 d4 d6 c4 Nb6 f4 — White has 4 central pawns but they can become targets.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
        label: "Alekhine's Defense",
        note: "The knight on f6 provokes 2.e5. Black will retreat and counterattack the center later.",
      },
    ],
    difficulty: "advanced",
    players: ["Alexander Alekhine", "Lev Alburt"],
  },

  /* ================================================================ */
  /*  D4 OPENINGS                                                       */
  /* ================================================================ */
  {
    id: "queens-gambit",
    name: "Queen's Gambit",
    eco: "D06–D69",
    category: "d4",
    moves: "1.d4 d5 2.c4",
    tagline: "The queen of openings — classical central control and strategic depth.",
    keyIdeas: [
      "Not a true gambit — White can usually regain the c4 pawn",
      "White fights for central control with c4 challenging d5",
      "Leads to rich strategic and positional play",
    ],
    whitePlans: [
      "After QGD (…e6): play for a minority attack on the queenside",
      "After QGA (…dxc4): recover the pawn and develop actively",
      "Build the ideal center with e4 if possible",
      "Use the c-file and queenside pawn majority",
    ],
    blackPlans: [
      "Queen's Gambit Declined (…e6): solid, defend d5, play …c5 later",
      "Queen's Gambit Accepted (…dxc4): grab the pawn, develop, give it back",
      "Slav Defense (…c6): support d5 without blocking the bishop",
      "Semi-Slav (…c6 + …e6): complex and sharp",
    ],
    traps: [
      {
        name: "Elephant Trap (QGD)",
        description: "After 1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Nbd7 5.cxd5 exd5 6.Nxd5?? Nxd5! 7.Bxd8 Bb4+ winning the queen.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2",
        label: "Queen's Gambit Offered",
        note: "Black must decide: accept (…dxc4), decline (…e6), or play the Slav (…c6).",
      },
    ],
    difficulty: "beginner",
    players: ["Anatoly Karpov", "Vladimir Kramnik", "Ding Liren"],
  },
  {
    id: "london-system",
    name: "London System",
    eco: "D00",
    category: "d4",
    moves: "1.d4 d5 2.Bf4",
    tagline: "The solid system opening — same setup against everything.",
    keyIdeas: [
      "White plays Bf4 early regardless of Black's setup",
      "A system opening — learn one setup, play it against anything",
      "Solid, low-risk, positionally sound",
    ],
    whitePlans: [
      "Set up with d4, Bf4, e3, Nf3, Bd3, Nbd2, c3",
      "Castle kingside and play for a slow buildup",
      "The Jobava London (Nc3 instead of Nf3) is more aggressive",
      "Break with e4 when well-prepared",
    ],
    blackPlans: [
      "Challenge with …c5 to attack the d4 pawn",
      "Play …Bf5 or …Bg4 for active piece development",
      "…Qb6 hits b2 and pressures the center",
      "Set up …e6, …Bd6 challenging the f4 bishop",
    ],
    traps: [
      {
        name: "Bishop Trap after …Bd6",
        description: "If Black plays …Bd6 early, White can avoid Bxd6 and maintain the bishop pair with Bg3.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2",
        label: "London System",
        note: "Bf4 before e3 is the hallmark. White will build a solid pyramid structure.",
      },
    ],
    difficulty: "beginner",
    players: ["Magnus Carlsen", "Gata Kamsky", "Eric Hansen"],
  },
  {
    id: "queens-gambit-declined",
    name: "Queen's Gambit Declined",
    eco: "D30–D69",
    category: "d4",
    moves: "1.d4 d5 2.c4 e6",
    tagline: "Classical and rock-solid — Black maintains the d5 pawn.",
    keyIdeas: [
      "Black keeps a solid center with …e6 supporting d5",
      "The 'bad' light-squared bishop on c8 is a well-known issue",
      "One of the most strategically rich openings",
    ],
    whitePlans: [
      "Minority attack: a4-a5, b4-b5 to create queenside weaknesses",
      "Exchange variation (cxd5 exd5) to target the isolated d5 pawn",
      "Bg5 pin on f6 — a classical approach",
    ],
    blackPlans: [
      "Play …c5 to challenge the center",
      "Develop the c8 bishop to d7, b7 (via a6) or exchange it",
      "The Lasker Defense (…Ne4) to simplify",
      "Tartakower Variation (…b6) to fianchetto the bishop",
    ],
    traps: [
      {
        name: "Cambridge Springs",
        description: "After 5.Bg5 Nbd7 — Black plays …Qa5 pinning on the a5-e1 diagonal, winning material if White is careless.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
        label: "QGD After 2…e6",
        note: "Black's setup is solid but the c8 bishop is locked in. Strategic plans dominate.",
      },
    ],
    difficulty: "intermediate",
    players: ["Anatoly Karpov", "Emanuel Lasker", "Ding Liren"],
  },
  {
    id: "slav-defense",
    name: "Slav Defense",
    eco: "D10–D19",
    category: "d4",
    moves: "1.d4 d5 2.c4 c6",
    tagline: "Defend d5 with …c6 — keeps the bishop free to develop.",
    keyIdeas: [
      "…c6 supports d5 without blocking the light-squared bishop",
      "More flexible than the QGD — the bishop can go to f5 or g4",
      "The Semi-Slav (adding …e6) leads to incredibly sharp play",
    ],
    whitePlans: [
      "Play Nf3, Nc3 and develop normally",
      "Push e4 when Black allows it",
      "In the Exchange Slav: play for queenside minority attack",
    ],
    blackPlans: [
      "Develop …Bf5 before …e6 to avoid the 'French bishop' problem",
      "Play …dxc4 and try to hold the extra pawn with …b5",
      "Semi-Slav with …e6: enter the Meran or Anti-Meran",
    ],
    traps: [
      {
        name: "Marshall Gambit Trap",
        description: "In the Semi-Slav Meran: sacrificial play with …dxc4, …b5, …a6 — very sharp territory.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
        label: "Slav Defense",
        note: "…c6 keeps the light bishop free. White typically continues with Nf3 or Nc3.",
      },
    ],
    difficulty: "intermediate",
    players: ["Vladimir Kramnik", "Viswanathan Anand", "Magnus Carlsen"],
  },

  /* ================================================================ */
  /*  INDIAN DEFENSES                                                   */
  /* ================================================================ */
  {
    id: "kings-indian",
    name: "King's Indian Defense",
    eco: "E60–E99",
    category: "indian",
    moves: "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7",
    tagline: "The ultimate fighting defense — Black concedes space then counterattacks violently.",
    keyIdeas: [
      "Black allows White a huge center and then storms it",
      "Kingside attacks with …f5 and …g5 pawn storms",
      "Requires courage — Black is often under pressure initially",
      "Leads to extremely dynamic, double-edged positions",
    ],
    whitePlans: [
      "Classical (Nf3, Be2, 0-0): solid and flexible",
      "Sämisch (f3): ultra-solid, prepares Be3 and queenside play",
      "Four Pawns Attack (e4, f4): aggressive central occupation",
      "Bayonet Attack (b4): modern approach in the Classical",
    ],
    blackPlans: [
      "Play …e5 to challenge the center",
      "After d5: close the center and attack on the kingside with …f5",
      "Storm with …f5, …g5, …Nf6-h5-f4",
      "The …c5 break on the queenside in some lines",
    ],
    traps: [
      {
        name: "Mar del Plata Sac",
        description: "In the main line: Black often sacrifices the exchange or a piece for a devastating kingside attack.",
      },
    ],
    positions: [
      {
        fen: "rnbqk2r/ppppppbp/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
        label: "King's Indian Setup",
        note: "Black's fianchettoed bishop is a monster. White must decide on a system against the KID.",
      },
    ],
    difficulty: "advanced",
    players: ["Garry Kasparov", "Bobby Fischer", "Bobby Fischer", "Teimour Radjabov"],
  },
  {
    id: "nimzo-indian",
    name: "Nimzo-Indian Defense",
    eco: "E20–E59",
    category: "indian",
    moves: "1.d4 Nf6 2.c4 e6 3.Nc3 Bb4",
    tagline: "Pin the knight, control e4 — one of Black's best openings.",
    keyIdeas: [
      "Black pins the c3 knight to control the e4 square",
      "Willing to give up the bishop pair for structural advantages",
      "One of the most respected defenses at the highest level",
    ],
    whitePlans: [
      "4.Qc2 (Classical): prevent doubled pawns",
      "4.e3 (Rubinstein): solid, develop naturally",
      "4.f3 (Sämisch): aggressive, aim for e4",
      "4.Nf3 (Kasparov Variation): flexible",
    ],
    blackPlans: [
      "Control e4 — the key strategic goal",
      "Double White's pawns with …Bxc3+ when favorable",
      "Play …c5 and …d5 for a solid central presence",
      "Develop harmoniously: …b6, …Bb7, …0-0",
    ],
    traps: [
      {
        name: "Hübner Variation Tactics",
        description: "After …c5, …cxd4, …Nc6, and …Bxc3 — White gets the bishop pair but Black has a lead in development.",
      },
    ],
    positions: [
      {
        fen: "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
        label: "Nimzo-Indian",
        note: "The pin on c3 is the defining feature. White must decide how to deal with it.",
      },
    ],
    difficulty: "intermediate",
    players: ["Mikhail Botvinnik", "Garry Kasparov", "Magnus Carlsen", "Ding Liren"],
  },
  {
    id: "queens-indian",
    name: "Queen's Indian Defense",
    eco: "E12–E19",
    category: "indian",
    moves: "1.d4 Nf6 2.c4 e6 3.Nf3 b6",
    tagline: "Fianchetto the queen-side bishop — flexible and solid.",
    keyIdeas: [
      "Black fianchettoes on b7 to control e4 and the long diagonal",
      "Often played when White avoids 3.Nc3 (preventing the Nimzo)",
      "Solid, strategic, and hard to attack",
    ],
    whitePlans: [
      "Control e4 with g3 and Bg2 (main line)",
      "Petrosian variation: a3 preventing …Bb4",
      "Play for the center with Nc3 and e4",
    ],
    blackPlans: [
      "Fianchetto …Bb7 and control the central light squares",
      "Play …Be7, …0-0, and …d5 for a solid position",
      "…c5 to challenge the center",
    ],
    traps: [
      {
        name: "Bogo-Indian Transpose",
        description: "3…Bb4+ (Bogo-Indian) is a common transposition — be ready for both lines.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/p1pp1ppp/1p2pn2/8/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4",
        label: "Queen's Indian",
        note: "…b6 fianchettoes the bishop. White often responds with g3 for a battle of fianchettoes.",
      },
    ],
    difficulty: "intermediate",
    players: ["Anatoly Karpov", "Vladimir Kramnik", "Ding Liren"],
  },
  {
    id: "grunfeld-defense",
    name: "Grünfeld Defense",
    eco: "D70–D99",
    category: "indian",
    moves: "1.d4 Nf6 2.c4 g6 3.Nc3 d5",
    tagline: "Destroy the center! — Black hits d4 immediately with a fianchetto.",
    keyIdeas: [
      "Black concedes the center early then attacks it with pieces",
      "The g7 bishop and the d5 break are Black's main weapons",
      "Requires deep theoretical knowledge — heavily analyzed",
    ],
    whitePlans: [
      "Exchange Variation (cxd5 Nxd5 e4): build a massive center",
      "Russian System: Nf3, Qb3 targeting b7 and d5",
      "Maintain the center and develop actively",
    ],
    blackPlans: [
      "Strike with …d5 to challenge the center immediately",
      "After exd5 Nxd5 Nxd5: play …c5 to attack d4",
      "Use the g7 bishop's pressure on the long diagonal",
      "Piece activity over pawn structure",
    ],
    traps: [
      {
        name: "Exchange Svidler Variation",
        description: "Sharp lines where Black sacrifices pawns for dynamic piece play against White's center.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/ppp1pp1p/5np1/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq d6 0 4",
        label: "Grünfeld Defense",
        note: "…d5 strikes immediately. One of the most principled and dynamic openings for Black.",
      },
    ],
    difficulty: "advanced",
    players: ["Garry Kasparov", "Peter Svidler", "Magnus Carlsen"],
  },
  {
    id: "dutch-defense",
    name: "Dutch Defense",
    eco: "A80–A99",
    category: "indian",
    moves: "1.d4 f5",
    tagline: "A fighting response to d4 — Black aims to control e4 aggressively.",
    keyIdeas: [
      "Black seizes control of the e4 square with …f5",
      "Creates imbalanced, fighting positions",
      "Three main systems: Classical, Stonewall, Leningrad",
    ],
    whitePlans: [
      "Play g3 and Bg2 to control the long diagonal",
      "Exploit the weakened e8-h5 diagonal",
      "Staunton Gambit (2.e4!?) for aggressive surprise",
    ],
    blackPlans: [
      "Stonewall: …d5, …e6, …f5, …Bd6 — a fortress setup",
      "Classical: …e6, …Be7, develop harmoniously",
      "Leningrad: …g6, …Bg7, …d6 — fianchetto and …e5",
    ],
    traps: [
      {
        name: "Staunton Gambit",
        description: "2.e4!? fxe4 3.Nc3 — White develops rapidly and can create dangerous attacks against the weakened king.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/ppppp1pp/8/5p2/3P4/8/PPP1PPPP/RNBQKBNR w KQkq f6 0 2",
        label: "Dutch Defense",
        note: "…f5 is aggressive and committal. White must choose how to exploit the weakened kingside.",
      },
    ],
    difficulty: "intermediate",
    players: ["Hikaru Nakamura", "Magnus Carlsen", "Simon Williams"],
  },
  {
    id: "benoni-defense",
    name: "Modern Benoni",
    eco: "A60–A79",
    category: "indian",
    moves: "1.d4 Nf6 2.c4 c5 3.d5 e6",
    tagline: "Asymmetric pawn structure — Black sacrifices the center for dynamic play.",
    keyIdeas: [
      "Black creates an asymmetric pawn structure with …c5 and …e6",
      "The pawn on d5 gives White space but Black has queenside play",
      "Very dynamic — both sides have clear plans",
    ],
    whitePlans: [
      "Use the space advantage — play on the kingside with e4 and f4",
      "Restrict Black's …b5 break",
      "Central control and piece pressure",
    ],
    blackPlans: [
      "Break with …b5 on the queenside — the key thematic break",
      "Use the a and b files after …a6 and …b5",
      "The dark-squared bishop on g7 exerts pressure",
      "Piece activity compensates for the pawn deficit",
    ],
    traps: [
      {
        name: "…b5 Pawn Break",
        description: "When Black achieves …b5 successfully, the position often becomes very comfortable. White must prevent or prepare for it.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/pp1p1ppp/4pn2/2pP4/2P5/8/PP2PPPP/RNBQKBNR w KQkq - 0 4",
        label: "Modern Benoni",
        note: "After 3.d5 — the asymmetric structure is set. Black will fianchetto and aim for …b5.",
      },
    ],
    difficulty: "advanced",
    players: ["Mikhail Tal", "Vugar Gashimov", "Boris Spassky"],
  },

  /* ================================================================ */
  /*  FLANK OPENINGS                                                    */
  /* ================================================================ */
  {
    id: "english-opening",
    name: "English Opening",
    eco: "A10–A39",
    category: "flank",
    moves: "1.c4",
    tagline: "Control the center from the flank — flexible and positional.",
    keyIdeas: [
      "Flank pawn move that controls d5 without committing the d-pawn",
      "Can transpose into many d4 openings",
      "Allows White to choose between many different setups",
    ],
    whitePlans: [
      "Play g3 and Bg2 for a Réti-style fianchetto",
      "Build up with Nc3, e3/e4 depending on Black's response",
      "Reversed Sicilian structures after 1.c4 e5",
      "Transpose into 1.d4 systems with a later d4 push",
    ],
    blackPlans: [
      "Play …e5 (Reversed Sicilian) for an aggressive setup",
      "…c5 (Symmetrical English) for equal chances",
      "…Nf6 and …e6 heading toward a Queen's Indian/Nimzo setup",
    ],
    traps: [
      {
        name: "Reversed Dragon",
        description: "After 1.c4 e5 2.Nc3 Nf6 3.g3 d5 4.cxd5 Nxd5 — White gets a Reversed Dragon with an extra tempo.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1",
        label: "English Opening",
        note: "1.c4 — flexible and non-committal. White keeps options open for many transpositions.",
      },
    ],
    difficulty: "intermediate",
    players: ["Mikhail Botvinnik", "Garry Kasparov", "Magnus Carlsen"],
  },
  {
    id: "reti-opening",
    name: "Réti Opening",
    eco: "A04–A09",
    category: "flank",
    moves: "1.Nf3 d5 2.c4",
    tagline: "Hypermodern flexibility — develop knights before pawns.",
    keyIdeas: [
      "Knights before bishops, bishops before rooks",
      "Control the center without occupying it with pawns",
      "Extremely transposable into many openings",
    ],
    whitePlans: [
      "Fianchetto both bishops: g3 Bg2, b3 Bb2",
      "Play for c4 to challenge Black's d5 pawn",
      "Transpose into the English, QGD, or Catalan",
    ],
    blackPlans: [
      "Maintain the d5 pawn and develop solidly",
      "Play …c6 for a Slav-like setup",
      "…Nf6, …e6, …Be7 for a classical structure",
    ],
    traps: [
      {
        name: "Réti Gambit",
        description: "1.Nf3 d5 2.c4 dxc4 — White can gambit the c-pawn for rapid development with e3, Bxc4.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/ppp1pppp/8/3p4/2P5/5N2/PP1PPPPP/RNBQKB1R b KQkq c3 0 2",
        label: "Réti Opening",
        note: "White develops the knight first and challenges d5 with c4. Very flexible.",
      },
    ],
    difficulty: "intermediate",
    players: ["Richard Réti", "Vladimir Kramnik", "Magnus Carlsen"],
  },
  {
    id: "catalan-opening",
    name: "Catalan Opening",
    eco: "E01–E09",
    category: "flank",
    moves: "1.d4 Nf6 2.c4 e6 3.g3",
    tagline: "Fianchetto the bishop and squeeze — a modern grandmaster favorite.",
    keyIdeas: [
      "White fianchettoes on g2, combining d4 ideas with bishop pressure",
      "The Bg2 bishop targets the entire a8-h1 diagonal",
      "Leads to technical, positional positions favoring White",
    ],
    whitePlans: [
      "Fianchetto with g3, Bg2 and develop with Nf3, 0-0",
      "Play for the e4 break when ready",
      "Squeeze Black on the long diagonal",
      "Open Catalan (after …dxc4): recover the pawn with Bg2 pressure",
    ],
    blackPlans: [
      "Play …dxc4 (Open Catalan) and try to hold the pawn",
      "Closed Catalan (…b6, …Bb7): fight for the long diagonal",
      "Develop solidly with …Be7, …0-0, …c5",
    ],
    traps: [
      {
        name: "Open Catalan Pawn Grab",
        description: "After …dxc4, Black tries …a6, …b5 to hold the pawn — but White's Bg2 creates enormous pressure.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/6P1/PP2PP1P/RNBQKBNR b KQkq - 0 3",
        label: "Catalan Setup",
        note: "g3 signals the Catalan. The bishop will go to g2. Very popular at the elite level.",
      },
    ],
    difficulty: "intermediate",
    players: ["Vladimir Kramnik", "Magnus Carlsen", "Ding Liren"],
  },
  {
    id: "kings-indian-attack",
    name: "King's Indian Attack",
    eco: "A07–A08",
    category: "flank",
    moves: "1.Nf3 d5 2.g3 Nf6 3.Bg2",
    tagline: "A system for White — the same setup works against almost anything.",
    keyIdeas: [
      "System opening: Nf3, g3, Bg2, 0-0, d3, Nbd2, e4",
      "Works against French, Sicilian, and many other structures",
      "Bobby Fischer's favorite White system",
    ],
    whitePlans: [
      "Set up Nf3, g3, Bg2, 0-0, d3, Nbd2",
      "Play e4 and e5 to gain kingside space",
      "Transfer a knight to the kingside for an attack (Nf1-e3/h4)",
      "Push h4-h5 in some lines for a direct attack",
    ],
    blackPlans: [
      "Develop solidly and fight for the center",
      "Play …c5 and …Nc6 for queenside activity",
      "Prevent e4-e5 if possible",
    ],
    traps: [
      {
        name: "e5 Space Grab",
        description: "Once White achieves e5, the position can become very cramping for Black. Prevention is key.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/ppp1pppp/5n2/3p4/8/5NP1/PPPPPP1P/RNBQKB1R w KQkq - 2 3",
        label: "King's Indian Attack Setup",
        note: "White will play Bg2, 0-0, d3, Nbd2: a universal system that's hard to defuse.",
      },
    ],
    difficulty: "beginner",
    players: ["Bobby Fischer", "Levon Aronian"],
  },
  {
    id: "bird-opening",
    name: "Bird's Opening",
    eco: "A02–A03",
    category: "flank",
    moves: "1.f4",
    tagline: "An aggressive flank opener — seize e5 and attack the kingside.",
    keyIdeas: [
      "Control the e5 square from move 1",
      "Can lead to a Reversed Dutch setup",
      "Less theory to learn — surprise value",
    ],
    whitePlans: [
      "Develop with Nf3, g3, Bg2 (Leningrad-style)",
      "Play d3, e3, Be2 for a Stonewall setup",
      "Use f4 to support e5 occupation",
    ],
    blackPlans: [
      "Play d5 for central control",
      "From's Gambit: 1…e5!? — sacrifice a pawn for active play",
      "Develop naturally and exploit the weakened e1-h4 diagonal",
    ],
    traps: [
      {
        name: "From's Gambit",
        description: "1.f4 e5!? 2.fxe5 d6 3.exd6 Bxd6 — Black gets rapid development and attacks the weakened kingside.",
      },
    ],
    positions: [
      {
        fen: "rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR b KQkq f3 0 1",
        label: "Bird's Opening",
        note: "1.f4 — unorthodox but sound. Controls e5 and leads to unique positions.",
      },
    ],
    difficulty: "intermediate",
    players: ["Henry Bird", "Hikaru Nakamura", "Simon Williams"],
  },

  /* ================================================================ */
  /*  ADDITIONAL POPULAR OPENINGS                                       */
  /* ================================================================ */
  {
    id: "trompowsky",
    name: "Trompowsky Attack",
    eco: "A45",
    category: "d4",
    moves: "1.d4 Nf6 2.Bg5",
    tagline: "Pin the knight immediately — avoid mainstream theory.",
    keyIdeas: [
      "White pins the f6 knight on move 2, avoiding Indian setups",
      "Forces Black into less-charted territory early",
      "Can lead to sharp or quiet positions",
    ],
    whitePlans: [
      "After …Ne4: play Bf4 or Bh4 maintaining the bishop",
      "Set up e3, Bd3, Nd2 for a solid structure",
      "2.Bg5 e6 3.e4 — aggressive transposition",
    ],
    blackPlans: [
      "Play …Ne4 to challenge the bishop immediately",
      "…d5 for a solid central presence",
      "…c5 to attack the d4 pawn",
    ],
    traps: [
      {
        name: "Raptor Variation",
        description: "After 2…Ne4 3.Bf4 c5 — sharp positions where both sides have resources.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/pppppppp/5n2/6B1/3P4/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2",
        label: "Trompowsky Attack",
        note: "2.Bg5 — an aggressive surprise weapon. Black must decide how to react to the pin.",
      },
    ],
    difficulty: "intermediate",
    players: ["Magnus Carlsen", "Julian Hodgson", "Richard Rapport"],
  },
  {
    id: "torre-attack",
    name: "Torre Attack",
    eco: "A46",
    category: "d4",
    moves: "1.d4 Nf6 2.Nf3 e6 3.Bg5",
    tagline: "A quiet system with Bg5 — solid and hard to prepare against.",
    keyIdeas: [
      "System approach: d4, Nf3, Bg5, e3, Bd3, Nbd2",
      "The pin on f6 limits Black's coordination",
      "Avoid heavy theory — play on understanding",
    ],
    whitePlans: [
      "Build a solid setup with e3, Bd3, Nbd2, 0-0",
      "Play c3 and e4 for a central break",
      "Use the pin on f6 to restrict Black's plans",
    ],
    blackPlans: [
      "Break the pin with …h6 and …g5 or …Be7",
      "Develop naturally: …d5, …c5, …Nc6",
      "Challenge with …c5 to open the position",
    ],
    traps: [
      {
        name: "Torre Pin Pressure",
        description: "If Black isn't careful, the Bg5 pin can lead to doubled pawns on f6 after Bxf6, weakening the kingside.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/pppp1ppp/4pn2/6B1/3P4/5N2/PPP1PPPP/RN1QKB1R b KQkq - 1 3",
        label: "Torre Attack Setup",
        note: "Bg5 before e3 defines the Torre. A quiet but dangerous system.",
      },
    ],
    difficulty: "beginner",
    players: ["Carlos Torre Repetto", "Levon Aronian"],
  },
  {
    id: "benko-gambit",
    name: "Benko Gambit (Volga Gambit)",
    eco: "A57–A59",
    category: "d4",
    moves: "1.d4 Nf6 2.c4 c5 3.d5 b5",
    tagline: "Sacrifice a pawn for lasting queenside pressure — practical and effective.",
    keyIdeas: [
      "Black gives up the b5 pawn for open a and b files",
      "Long-lasting queenside initiative with minimal risk",
      "One of the most practical gambits — easy to play for Black",
    ],
    whitePlans: [
      "Accept the gambit (cxb5 a6 bxa6 Bxa6) and try to hold",
      "Decline with a4 — keep the structure closed",
      "Play e4, Nc3 and try to develop before Black's pressure tells",
    ],
    blackPlans: [
      "Open the a and b files for rook pressure",
      "Fianchetto on g7 for the long diagonal",
      "…d6, …Nbd7, …Nb6 targeting a4 and c4",
      "Pressure is almost automatic and long-lasting",
    ],
    traps: [
      {
        name: "Declined Trap",
        description: "If White plays a4 too early, Black can get …b4 with a space advantage on both wings.",
      },
    ],
    positions: [
      {
        fen: "rnbqkb1r/p2ppppp/5n2/1ppP4/2P5/8/PP2PPPP/RNBQKBNR w KQkq b6 0 4",
        label: "Benko Gambit",
        note: "…b5 offers the pawn. White almost always takes, and Black gets superb compensation.",
      },
    ],
    difficulty: "intermediate",
    players: ["Pal Benko", "Veselin Topalov", "Alexei Shirov"],
  },
];

/* ─── Helper: find guide by opening name (fuzzy match from game analysis) ─── */

const OPENING_KEYWORDS: Map<string, string> = new Map();
for (const g of OPENING_GUIDES) {
  OPENING_KEYWORDS.set(g.name.toLowerCase(), g.id);
  // Also index key words from the name
  for (const word of g.name.toLowerCase().split(/[\s\-()]+/)) {
    if (word.length > 3) OPENING_KEYWORDS.set(word, g.id);
  }
}

export function findGuideByName(openingName: string): OpeningGuide | undefined {
  const lower = openingName.toLowerCase();
  // Exact match first
  for (const g of OPENING_GUIDES) {
    if (lower.includes(g.name.toLowerCase())) return g;
  }
  // Keyword match
  for (const [keyword, id] of OPENING_KEYWORDS) {
    if (lower.includes(keyword)) {
      return OPENING_GUIDES.find((g) => g.id === id);
    }
  }
  return undefined;
}

export const OPENING_CATEGORIES = [
  { id: "e4-e5", label: "1.e4 e5", icon: "♔" },
  { id: "semi-open", label: "Semi-Open (vs e4)", icon: "♞" },
  { id: "d4", label: "1.d4 Systems", icon: "♕" },
  { id: "indian", label: "Indian Defenses", icon: "♗" },
  { id: "flank", label: "Flank Openings", icon: "♖" },
] as const;
