/**
 * Opening Cheat Sheets — curated library of opening guides.
 *
 * Each guide covers:
 *  - ECO code, move order, key ideas
 *  - Plans for both sides
 *  - Common traps
 *  - Critical positions (FEN)
 */

export type TrapLine = {
  /** Short name for this trap / variation */
  name: string;
  /** Prose explanation shown above the board */
  explanation: string;
  /** Starting FEN — use initial position for lines starting from move 1 */
  fen: string;
  /** Comma-separated SAN moves, e.g. "e4,e5,Nf3,Nc6,Bc4,Nf6,Ng5" */
  moves: string;
  /** Which side's perspective to show the board from */
  orientation: "white" | "black";
  /** Short caption displayed below the interactive board */
  caption: string;
};

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
  /** Interactive trap lines for rich in-page demonstrations */
  trapLines?: TrapLine[];
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
        description:
          "White's knight dives to f7, sacrificing itself to rip open the king. If Black takes back wrong, the queen swoops in with a devastating check.",
      },
      {
        name: "Légal Trap",
        description:
          "White sacrifices the queen with a knight capture, then delivers checkmate using the bishop and minor pieces.",
      },
    ],
    trapLines: [
      {
        name: "Légal's Mate",
        explanation:
          "Black pins the f3-knight with Bg4, thinking White's queen is unprotected. But White sacrifices the queen with Nxe5!, and after the greedy Bxd1, unleashes Bxf7+ Ke7 Nd5#. Three minor pieces deliver a picture-perfect checkmate. This is one of the oldest recorded traps in chess history.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves: "e4,e5,Nf3,Nc6,Bc4,d6,Nc3,Bg4,Nxe5,Bxd1,Bxf7+,Ke7,Nd5#",
        orientation: "white",
        caption:
          "5.Nxe5! sacrifices the queen — 6.Bxf7+ Ke7 7.Nd5# is checkmate",
      },
      {
        name: "Fried Liver Attack",
        explanation:
          "In the Two Knights Defense, after 4.Ng5 d5 5.exd5 Nxd5, White bombs f7 with 6.Nxf7! — sacrificing the knight to drag Black's king into the open. After 6...Kxf7 7.Qf3+ Ke6, White follows with Nc3 and has tremendous attacking compensation. Black's king will never find a safe home.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,Nf3,Nc6,Bc4,Nf6,Ng5,d5,exd5,Nxd5,Nxf7,Kxf7,Qf3+,Ke6,Nc3,Nb4,Bb3,c6,a3,Na6,d4,Nc7",
        orientation: "white",
        caption:
          "6.Nxf7! forces Black's king out — Qf3+ and Nc3 create unstoppable threats",
      },
      {
        name: "Evans Gambit",
        explanation:
          "After 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5, White plays 4.b4! — the Evans Gambit, offering a wing pawn for rapid development and a dominant center. After 4...Bxb4 5.c3 Ba5 6.d4 exd4 7.0-0, White gets a massive center and attacking chances. Morphy, Kasparov, and Tal all loved this brilliant gambit.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,Nf3,Nc6,Bc4,Bc5,b4,Bxb4,c3,Ba5,d4,exd4,O-O,Nge7,cxd4,d5,exd5,Nxd5,Ba3,Be6,Bb5,Bb6,Nc3,Nf4,Be7,Qxe7,Nd5,Bxd5",
        orientation: "white",
        caption:
          "4.b4! the Evans Gambit — White sacrifices a flank pawn to build a dominant center",
      },
      {
        name: "Traxler Counter-Attack",
        explanation:
          "When White plays 4.Ng5 to threaten Nxf7, Black can ignore it entirely with 4...Bc5!? — the Traxler. After 5.Nxf7 Bxf2+!, White's king is forced out of safety. Black gives up the rook but gets a queen and bishop bearing down from f2. It's one of chess's most dangerous gambits and catches many White players completely off guard.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,Nf3,Nc6,Bc4,Nf6,Ng5,Bc5,Nxf7,Bxf2+,Kf1,Qe7,Nxh8,d5,exd5,Nd4,d6,Bg4",
        orientation: "black",
        caption:
          "4...Bc5!? ignores Nxf7 — after Bxf2+! Black launches a ferocious attack",
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
    tagline:
      "The king of openings — deep strategic play with long-term pressure.",
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
        description:
          "Black traps White's bishop on a4 by pushing b5 and c5 — closing every escape diagonal.",
      },
      {
        name: "Tarrasch Trap",
        description:
          "In the Open Ruy Lopez, if White takes on e5 too early, the knight on b5 hangs to a knight attack.",
      },
    ],
    trapLines: [
      {
        name: "Noah's Ark Trap",
        explanation:
          "White grabs a central pawn with Qxd4, but Black has a long-term queenside plan. After ...c5 and ...Be6, the queen is driven back and Black plays ...c4, shutting the bishop on b3 out of the game forever. The bishop watches helplessly while Black consolidates a superior position.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,Nf3,Nc6,Bb5,a6,Ba4,d6,d4,b5,Bb3,Nxd4,Nxd4,exd4,Qxd4,c5,Qd5,Be6,Qc6+,Bd7,Qd5,c4",
        orientation: "black",
        caption:
          "...c4 and ...b4 seal the bishop's fate — every escape diagonal is closed",
      },
      {
        name: "Marshall Attack Gambit",
        explanation:
          "Frank Marshall secretly prepared this pawn sacrifice for years, finally unleashing it on Capablanca in 1918. After 8...d5!, Black gives up a pawn to strip White's kingside of defenders and launch a devastating attacking sequence. White must play the resulting complications with perfect accuracy just to survive.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,Nf3,Nc6,Bb5,a6,Ba4,Nf6,O-O,Be7,Re1,b5,Bb3,O-O,c3,d5,exd5,Nxd5,Nxe5,Nxe5,Rxe5,c6,d4,Bd6,Re1,Qh4,g3,Qh3,Be3,Bg4",
        orientation: "black",
        caption:
          "8...d5! sacrifices a pawn — Black's pieces flood the kingside for a crushing attack",
      },
      {
        name: "Berlin Defense — The Endgame Wall",
        explanation:
          "The Berlin Defense (3...Nf6) leads to a famous endgame after 4.0-0 Nxe4 5.d4 Nd6 6.Bxc6 dxc6 7.dxe5 Nf5 8.Qxd8+ Kxd8. Black gives up castling rights but gets a rock-solid endgame with the bishop pair and active play. Kramnik used this to neutralize Kasparov's Ruy Lopez completely at the 2000 World Championship.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,Nf3,Nc6,Bb5,Nf6,O-O,Nxe4,d4,Nd6,Bxc6,dxc6,dxe5,Nf5,Qxd8+,Kxd8,Nc3,Ke8,h3,h6,Rd1",
        orientation: "black",
        caption:
          "The Berlin Endgame — Qxd8+ Kxd8 gives Black a slightly worse but ultra-solid endgame, Kramnik's world championship weapon",
      },
      {
        name: "Open Ruy Lopez — Dilworth Attack",
        explanation:
          "In the Open Spanish (5...Nxe4), Black grabs the e4 pawn. After White builds up with Bb3, d4, c3 and Bc2, Black unleashes 11...Nxf2!! — the Dilworth sacrifice. The knight on f2 wrecks White's kingside pawn structure and opens the f-file. Black gets rook and two pawns for two pieces with a raging initiative.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,Nf3,Nc6,Bb5,a6,Ba4,Nf6,O-O,Nxe4,d4,b5,Bb3,d5,dxe5,Be6,c3,Bc5,Nbd2,O-O,Bc2,Nxf2,Rxf2,f6,exf6,Rxf6+,Kh1,Rxf3",
        orientation: "black",
        caption:
          "11...Nxf2!! the Dilworth sacrifice — rook+2 pawns for two pieces with a raging attack",
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
    players: [
      "Bobby Fischer",
      "Garry Kasparov",
      "Anatoly Karpov",
      "Magnus Carlsen",
    ],
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
        description:
          "White develops the bishop to c4 and pushes e5, gaining tempo and targeting f7 aggressively.",
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
    tagline:
      "The romantic sacrifice — gambit the f-pawn for a swashbuckling attack.",
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
        description:
          "If White plays knight f3 too early, Black can exploit the weak f2 square with a devastating queen check on h4.",
      },
      {
        name: "Muzio Gambit",
        description:
          "White sacrifices a whole knight on f7 for a devastating attack — castling into the storm and unleashing total chaos.",
      },
    ],
    trapLines: [
      {
        name: "Kieseritzky Gambit — h4 Thrust",
        explanation:
          "After Black accepts the gambit and plays g5 to hold the extra pawn, White strikes with h4. Black tries to advance with g4, chasing the knight to e5. If Black then plays 5...Nf6 defensively, White responds with Bc4, threatening Nxf7 — forking the queen and rook. The h-file opens up for a devastating attack.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,f4,exf4,Nf3,g5,h4,g4,Ne5,Nf6,Bc4,d5,exd5,Bd6,d4,Nh5,Nd3,Qxh4+,Kf1,Ng3+,Kg1,Qh1#",
        orientation: "white",
        caption:
          "h4! destabilizes g5 — White opens the h-file for a ferocious attack",
      },
      {
        name: "Falkbeer Counter-Gambit",
        explanation:
          "Instead of accepting passively, Black fires back at White's center immediately with 2...d5! The Falkbeer Counter-Gambit turns the tables — Black accepts a pawn deficit to seize the initiative. After 3.exd5 e4!, Black's central pawn cramps White's position and creates problems for the f3-knight.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,f4,d5,exd5,e4,d3,Nf6,dxe4,Nxe4,Nf3,Bc5,Qe2,Bf2+,Kd1,Qxd5+,Nbd2",
        orientation: "black",
        caption:
          "2...d5! counter-attacks immediately — Black seizes the initiative in the King's Gambit",
      },
      {
        name: "Muzio Gambit — Knight Sacrifice",
        explanation:
          "The Muzio Gambit is one of chess's most romantic attacking weapons. White plays 5.0-0!? in the King's Gambit Accepted, sacrificing the entire knight on f3 after ...g4. After 5...gxf3 6.Qxf3, White has two pawns less but unbelievable development and open lines. The queen swoops to f3, both bishops are aimed at the enemy king, and rooks connect instantly.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,f4,exf4,Nf3,g5,Bc4,g4,O-O,gxf3,Qxf3,Qf6,e5,Qxe5,Bxf7+,Kxf7,d4,Qxd4+,Be3,Qb4,Nc3,c6,Nd5,Qe7",
        orientation: "white",
        caption:
          "5.0-0!? sacrifices the f3-knight — two pawns down but White's pieces are devastating",
      },
      {
        name: "Classical Defense Declined — Bishop's Gambit",
        explanation:
          "Instead of playing 3.Nf3, White can immediately offer the bishop with 3.Bc4!? in the Bishop's Gambit. If Black plays 3...Qh4+, White's king must go to f1 — but White argues the attack is premature and the queen will be chased back. The Bishop's Gambit leads to unusual, dynamic positions where Black's queen is often misplaced.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e5,f4,exf4,Bc4,Qh4+,Kf1,d6,Nc3,Nc6,Nf3,Qh5,d4,g5,h4,g4,Ng5,Nh6,Nxf7,Nxf7,Bxf7+,Kd8,Qxg4",
        orientation: "white",
        caption:
          "3.Bc4! Bishop's Gambit — White accepts Kf1 to keep a dangerous initiative on the kingside",
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
    tagline:
      "A flexible delayed King's Gambit with Nc3 — less committal, many options.",
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
        description:
          "Black snatches the e-pawn with the knight, White fires the queen to h5 creating chaos — wild complications ensue.",
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
    tagline:
      "Solid and symmetrical — Black mirrors White and aims for equality.",
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
        description:
          "A dubious but tricky gambit popular online — Black offers the knight and if White retreats instead of exchanging, complications arise.",
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
    tagline:
      "The most popular and sharpest response to 1.e4 — asymmetric and combative.",
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
        description:
          "After …Qa5 checking and winning the e5 knight if White plays carelessly.",
      },
      {
        name: "Magnus Smith Trap",
        description:
          "In the Dragon, White puts the knight on d5 and if Black pushes e5 carelessly, the knight forks with check on c7.",
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
    players: [
      "Garry Kasparov",
      "Bobby Fischer",
      "Magnus Carlsen",
      "Vishwanathan Anand",
    ],
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
        description:
          "The bishop goes to g5 early, Black grabs the b2 pawn with the queen — incredibly sharp and deeply analyzed.",
      },
    ],
    trapLines: [
      {
        name: "Poisoned Pawn Variation",
        explanation:
          "After 6.Bg5 e6 7.f4 Qb6, Black plays the Poisoned Pawn — grabbing 8...Qxb2. White responds with 9.Rb1 Qa3, and follows with 10.e5 to attack. Black's queen is stranded in enemy territory while White launches a central onslaught. The line is so dangerous it was considered losing for Black before Fischer proved it workable.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Bg5,e6,f4,Qb6,Qd2,Qxb2,Rb1,Qa3,e5,dxe5,fxe5,Nfd7,Ne4,h6,Bh4,Qxa2",
        orientation: "white",
        caption:
          "8...Qxb2 grabs the pawn — 9.Rb1 Qa3 10.e5 attacks while the queen is trapped",
      },
      {
        name: "English Attack — Kingside Pawn Storm",
        explanation:
          "The English Attack (6.Be3) is White's most aggressive modern weapon against the Najdorf. White follows up with f3, Qd2, g4, and castles queenside — then storms the h-file at the Black king. Both players race to attack the opposing king in this race against time.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Be3,e5,Nb3,Be6,f3,Be7,Qd2,O-O,O-O-O,Nbd7,g4,b5,g5,b4,Ne2,Ne8,f4,a5",
        orientation: "white",
        caption:
          "6.Be3 → f3, g4, Qd2, 0-0-0 — White launches a kingside pawn storm",
      },
      {
        name: "Fischer/Sozin Attack",
        explanation:
          "Bobby Fischer popularized 6.Bc4 against the Najdorf. The idea is to aim the bishop at f7 and build a quick attack before Black can stabilize. After 6...e6 7.Bb3, Black often plays 7...b5 to gain queenside space. The position is full of tactical ideas on both sides — Fischer won famous games with this exact line.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Bc4,e6,Bb3,b5,O-O,Be7,Qf3,Qb6,Be3,Qb7,Qg3,O-O,f4,b4,Na4,Nxe4",
        orientation: "white",
        caption:
          "6.Bc4 targets f7 immediately — Fischer's dynamic weapon against the Najdorf",
      },
      {
        name: "Scheveningen Trap — Early Ng5 Threat",
        explanation:
          "In the Classical variation 6.Bg5 e6, many beginners fall for the trap of playing 7...b5?? too early. After 8.Bxf6! gxf6 9.Nd5!!, the knight fork attacks the queen on d8 and threatens Nxb4. Black collapses immediately. The correct move is 7...Be7 first, protecting the g5 bishop and consolidating.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,a6,Bg5,e6,f4,b5,Bxf6,gxf6,Nd5,Qb6,Nxb6",
        orientation: "white",
        caption:
          "7...b5?? loses to 8.Bxf6! gxf6 9.Nd5!! — the fork wins decisive material",
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
    players: [
      "Bobby Fischer",
      "Garry Kasparov",
      "Viswanathan Anand",
      "Maxime Vachier-Lagrave",
    ],
  },
  {
    id: "sicilian-dragon",
    name: "Sicilian Dragon",
    eco: "B70–B79",
    category: "semi-open",
    moves: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6",
    tagline:
      "The fianchetto Sicilian — Black's dark-squared bishop breathes fire.",
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
        description:
          "Black sacrifices the rook on c3! Recapturing shatters White's queenside pawns and unleashes the Dragon bishop.",
      },
    ],
    trapLines: [
      {
        name: "Yugoslav Attack — White Attacks the King",
        explanation:
          "The Yugoslav Attack is the most critical test for the Dragon. White castles queenside and sends pawns h4-h5-h6 at Black's king. Black must counterattack on the c-file with Rc8 and push queenside pawns. Both sides are racing to mate the other — a single tempo can decide the game.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Be3,Bg7,f3,O-O,Qd2,Nc6,Bc4,Bd7,O-O-O,Rb8,h4,h5,Bg5,Re8,Kb1,Ne5,Bb3,Nc4,Bxc4",
        orientation: "white",
        caption:
          "White plays h4-h5 storm while Black counterattacks on the c-file — a race to deliver checkmate",
      },
      {
        name: "Exchange Sacrifice on c3",
        explanation:
          "Black's classic tactical idea in the Dragon: sacrifice the c-file rook onto c3! Recapturing with bxc3 shatters White's queenside pawns and removes a key defender. The Dragon bishop on g7 then dominates the long diagonal, White's exposed king and disconnected pawns become permanent liabilities.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Be3,Bg7,f3,Nc6,Qd2,O-O,Bc4,Bd7,O-O-O,Rc8,Bb3,Ne5,h4,h5,Kb1,Nc4,Bxc4,Rxc4",
        orientation: "black",
        caption:
          "...Rxc3! destroys the queenside structure — the Dragon bishop dominates after bxc3",
      },
      {
        name: "Dragon vs 9.Bc4 — Typical Soltis Maneuver",
        explanation:
          "In the Soltis Variation of the Yugoslav Attack, Black plays 12...Rfe8!? followed by 13...h5! — seemingly stopping White's h5 push, but actually preparing a powerful king march to h7. The rook on e8 defends against e5 breaks and Black's plan is ...Rh8, ...Bh6 to trade off White's attacking bishop. A deeply researched, computer-approved defensive setup.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Be3,Bg7,f3,Nc6,Qd2,O-O,Bc4,Bd7,O-O-O,Qa5,Bb3,Rfe8,h4,h5,Kb1,Ne5",
        orientation: "black",
        caption:
          "12...Rfe8! and 13...h5! — the Soltis Defense stops the h-file storm and prepares counterplay",
      },
      {
        name: "Dragon — Early Bc4 d5 Trick",
        explanation:
          "White plays an early Bc4 to pressure d5 and eyeball f7. If Black carelessly plays 6...Bg7?? White can strike with 7.e5! dxe5 8.Nxe5 and the knight on e5 along with the bishop on c4 create enormous pressure. The standard response is 6...e6 to close the dangerous diagonal before completing development.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,c5,Nf3,d6,d4,cxd4,Nxd4,Nf6,Nc3,g6,Bc4,Bg7,e5,dxe5,Bxf7+,Kxf7,Nd5",
        orientation: "white",
        caption:
          "6...Bg7?? allows 7.e5! — White wins material with a forced sequence",
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
        description:
          "Black pins the knight with the bishop, trades it off, and snatches pawns — wild imbalances where both sides have chances.",
      },
    ],
    trapLines: [
      {
        name: "Winawer Variation — Poisoned Pawn",
        explanation:
          "After 3.Nc3 Bb4 4.e5, Black plays 4...c5 5.a3 Bxc3+ 6.bxc3. Now 7.Qg4 threatens to grab g7 with devastating effect. Black can decline with 7...0-0, but the sharper refutation is to play 7...Qc7 — offering White the g7 and h7 pawns while Black destroys the center. White's king stays in the middle, vulnerable to counterattack.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e6,d4,d5,Nc3,Bb4,e5,c5,a3,Bxc3+,bxc3,Ne7,Qg4,Qc7,Qxg7,Rg8,Qxh7,cxd4,Ne2,Nbc6,f4,dxc3,Qd3,d4,Nxd4,Nxd4,Qxd4,Bd7",
        orientation: "black",
        caption:
          "7.Qg4 threatens g7 — Black lets White grab the pawns while demolishing the center",
      },
      {
        name: "Alekhine-Chatard Attack",
        explanation:
          "In the Classical French (3.Nc3 Nf6 4.Bg5 Be7 5.e5 Nfd7), White gambles with 6.h4!? — threatening h5 and Bxe7 followed by Qg4. If Black accepts with 6...Bxg5 7.hxg5 Qxg5, White has sacrificed the bishop but obtained a massive kingside attack. Black's king will be hunted.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e6,d4,d5,Nc3,Nf6,Bg5,Be7,e5,Nfd7,h4,Bxg5,hxg5,Qxg5,Nh3,Qe7,Qg4,g6,O-O-O,c5,f4,Nc6,Nf2,cxd4,Nb5,Nb6",
        orientation: "white",
        caption:
          "6.h4!? gambit — White sacrifices the bishop to create a devastating kingside attack",
      },
      {
        name: "Advance Variation — Milner-Barry Gambit",
        explanation:
          "In the Advance French (3.e5 c5 4.c3), White plays 5.Nf3 Nc6 6.Bd3 cxd4 7.cxd4 Bd7 8.0-0 — and now Black plays 8...Nxd4?? thinking the d-pawn is free. But White pounces with 9.Nxd4 Qxd4 and 10.Nc3!, threatening Nb5 attacking the queen and Nd5. Black scrambles but White already has a crushing attack — the h7 pawn falls and the kingside collapses.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e6,d4,d5,e5,c5,c3,Nc6,Nf3,Qb6,Bd3,cxd4,cxd4,Bd7,O-O,Nxd4,Nxd4,Qxd4,Nc3,Qb4,Qe2,Bb5,Nxb5,Qxb5,Bd2,Qa5,a4",
        orientation: "white",
        caption:
          "The Milner-Barry Gambit — White sacrifices d4 to launch a wave of tactical threats",
      },
      {
        name: "Tarrasch — Isolated Queen's Pawn Battle",
        explanation:
          "A key strategic theme in the Tarrasch Variation: after 3.Nd2 c5 4.exd5 exd5 5.Ngf3 Nc6 6.Bb5, Black often gets an isolated d-pawn. This IQP (Isolated Queen's Pawn) gives dynamic piece activity and kingside attacking chances, but in the endgame it becomes a weakness. White must blockade on d4, Black must attack before liquidating.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "e4,e6,d4,d5,Nd2,c5,exd5,exd5,Ngf3,Nc6,Bb5,Bd6,O-O,Ne7,dxc5,Bxc5,Nb3,Bd6,Re1,O-O,Nbd4,Bc7,c3,Bg4,Qd3,Re8",
        orientation: "black",
        caption:
          "The IQP position — Black's d5 pawn is weak long-term, but now it fuels a powerful middlegame attack",
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
        description:
          "The Short variation — White pushes e5 and then g4 for a very sharp and aggressive bayonet attack.",
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
        description:
          "White pushes e5 too early and Black strikes back in the center — the overextended pawn becomes a target.",
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
    tagline:
      "Strike the center immediately — simple, direct, and underestimated.",
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
        description:
          "Black gambits two pawns for rapid development — an ambitious gambit that can catch White off guard.",
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
        description:
          "White builds a massive 4-pawn center, but it can become overextended — Black chips away at the base and the whole structure collapses.",
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
    tagline:
      "The queen of openings — classical central control and strategic depth.",
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
        description:
          "White greedily takes on d5 with the knight, Black recaptures, and when White snaps up the queen, a devastating bishop check wins it right back.",
      },
    ],
    trapLines: [
      {
        name: "Albin Counter-Gambit — Lasker Trap",
        explanation:
          "Instead of declining, Black bombs the center with 2...e5! — the Albin Counter-Gambit. After 3.dxe5 d4 4.e3 Bb4+!, if White plays 5.Bd2 dxe3 6.Bxb4+?? exf2+! 7.Ke2 fxg1=N+! — Black promotes to a KNIGHT with check, winning the rook. One of chess's most spectacular under-promotion tricks.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "d4,d5,c4,e5,dxe5,d4,e3,Bb4+,Bd2,dxe3,Bxb4+,exf2+,Ke2,fxg1=N+,Rxg1,Bg4+,Ke3,Nc6,a3,Qd4+",
        orientation: "black",
        caption:
          "7.fxg1=N+! — Black under-promotes to a knight, forking king and rook!",
      },
      {
        name: "QGA Trap — Punishing the Pawn Grab",
        explanation:
          "In the Queen's Gambit Accepted, Black accepts the gambit pawn and then naively tries to HOLD it with 3...b5? After 4.a4, if Black plays 4...c6? 5.axb5 cxb5??, White ignores the pawn and plays 6.Qf3! threatening both Ra8 and f7. Black cannot save both — the queen crashes in for a decisive winning advantage.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves: "d4,d5,c4,dxc4,e3,b5,a4,a6,axb5,axb5,Qf3,e6,Qb7,Ra7",
        orientation: "white",
        caption:
          "6.Qf3! after 5...cxb5?? — threatens Ra8 and Qxb7 simultaneously, winning decisive material",
      },
      {
        name: "Elephant Trap — QGD Variation",
        explanation:
          "A sneaky trap in the Queen's Gambit Declined with 4.Bg5. After 4...Nbd7 5.cxd5 exd5 6.Nxd5?? White thinks it's winning a pawn cleanly. But Black plays 6...Nxd5! 7.Bxd8 Bb4+! 8.Qd2 Bxd2+ 9.Kxd2 Kxd8 — and Black has come out a full piece ahead! White's greedy knight capture overlooked the discovered check.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "d4,d5,c4,e6,Nc3,Nf6,Bg5,Nbd7,cxd5,exd5,Nxd5,Nxd5,Bxd8,Bb4+,Qd2,Bxd2+,Kxd2,Kxd8",
        orientation: "black",
        caption:
          "6.Nxd5?? loses to 6...Nxd5! 7.Bxd8 Bb4+! — the discovered check wins a full piece",
      },
      {
        name: "Cambridge Springs Trap",
        explanation:
          "The Cambridge Springs (5...Nbd7 6...Qa5) is a dangerous trap in the QGD. After 6...Qa5 7.cxd5 Nxd5!, if White plays 8.Bxd8?? — Black responds 8...Bb4! double-attacking the king and knight on c3. The bishop on d8 is lost but Black gets a far superior position and decisive material advantage. White must play 8.Qd2 instead.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "d4,d5,c4,e6,Nc3,Nf6,Bg5,Nbd7,e3,c6,Nf3,Qa5,cxd5,Nxd5,Bd8,Bb4,Rc1,Nxc3",
        orientation: "black",
        caption:
          "6...Qa5! sets the trap — 8.Bxd8?? Bb4! wins a piece via the double attack",
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
        description:
          "If Black plays bishop d6 early, White can avoid the trade and maintain the bishop pair by retreating to g3.",
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
        description:
          "Black plays queen a5 pinning along the a5-e1 diagonal — winning material if White is careless.",
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
        description:
          "In the Semi-Slav Meran — sacrificial play with pawn grabs on the queenside leads to very sharp territory.",
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
    tagline:
      "The ultimate fighting defense — Black concedes space then counterattacks violently.",
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
        description:
          "In the main line: Black often sacrifices the exchange or a piece for a devastating kingside attack.",
      },
    ],
    trapLines: [
      {
        name: "Averbakh Variation — The e5 Blunder",
        explanation:
          "In the Averbakh system, White plays 6.Bg5 — a seemingly natural developing move. If Black immediately plays 6...e5??, White wins immediately with 7.dxe5 dxe5 8.Qxd8! Rxd8 9.Nd5 — the knight forks multiple pieces and Black loses material. Many beginners fall for this trap against the Averbakh.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,Be2,O-O,Bg5,e5,dxe5,dxe5,Qxd8,Rxd8,Nd5,Nxd5,cxd5,f6,Bh4,b5,Nf3,Nbd7",
        orientation: "white",
        caption:
          "6...e5?? loses to 7.dxe5 dxe5 8.Qxd8! Rxd8 9.Nd5 — Black gets forked",
      },
      {
        name: "Mar del Plata — Kingside Storm",
        explanation:
          "The Mar del Plata variation is the heartbeat of the King's Indian. After the center closes with d5, White pushes for c5 on the queenside while Black storms the kingside with f5, g5, f4, g4. Black often sacrifices a bishop or exchange on the h3 square to break through. It's a race to mate.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,Nf3,O-O,Be2,e5,O-O,Nc6,d5,Ne7,Ne1,Nd7,Nd3,f5,Bd2,Nf6,f3,f4,c5,g5,cxd6,cxd6,Nb5,Rf7",
        orientation: "black",
        caption:
          "White advances c5 on the queenside while Black races with f5-g5-f4-g4 — a double-edged race",
      },
      {
        name: "Sämisch Variation — Pawn Storm",
        explanation:
          "The Sämisch (5.f3) is White's most threatening setup against the King's Indian. White plays Be3, Qd2, and castles queenside, then launches g4-g5-h4 — the same storm as the Yugoslav Dragon. Black must react sharply. The critical idea is 6...c5 (Sämisch Gambit) or 6...e5 7.Nge2 c6 to fight the center before White's attack arrives.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,f3,O-O,Be3,e5,Nge2,c6,Qd2,Nbd7,O-O-O,a6,Kb1,b5,g4,b4,Na4,Qa5,b3,c5",
        orientation: "black",
        caption:
          "Sämisch vs King's Indian — g4-g5 storm vs ...c5-b5-b4 queenside counterattack",
      },
      {
        name: "Four Pawns Attack — Central Overextension",
        explanation:
          "White occupies the entire center with pawns (e4, d4, c4, f4) in the Four Pawns Attack. This looks overwhelming, but Black has a secret weapon: 6...c5! After 7.d5, Black plays 7...b5! — the classic counter that attacks c4 while White's overextended center becomes vulnerable to the bishop jabs from g7. If White grabs on b5, the c6-knight sacs are devastating.",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves:
          "d4,Nf6,c4,g6,Nc3,Bg7,e4,d6,f4,O-O,Nf3,c5,d5,b5,cxb5,a6,bxa6,Bxa6,e5,dxe5,fxe5,Nfd7,e6,Nde5,Nxe5,Bxe5,exf7+,Rxf7",
        orientation: "black",
        caption:
          "6...c5! 7.d5 b5! — Black blows up White's center before it can contain the King's Indian bishop",
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
    players: [
      "Garry Kasparov",
      "Bobby Fischer",
      "Bobby Fischer",
      "Teimour Radjabov",
    ],
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
        description:
          "Black pushes c5, trades in the center, develops the knight and captures on c3 — White gets the bishop pair but Black leads in development.",
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
    players: [
      "Mikhail Botvinnik",
      "Garry Kasparov",
      "Magnus Carlsen",
      "Ding Liren",
    ],
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
        description:
          "The Bogo-Indian bishop check is a common transposition — be ready for both lines.",
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
    tagline:
      "Destroy the center! — Black hits d4 immediately with a fianchetto.",
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
        description:
          "Sharp lines where Black sacrifices pawns for dynamic piece play against White's center.",
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
    tagline:
      "A fighting response to d4 — Black aims to control e4 aggressively.",
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
        description:
          "White gambits the e-pawn early and develops the knight to c3 — creating dangerous attacks against the weakened king.",
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
    tagline:
      "Asymmetric pawn structure — Black sacrifices the center for dynamic play.",
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
        description:
          "When Black achieves …b5 successfully, the position often becomes very comfortable. White must prevent or prepare for it.",
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
        description:
          "Black recaptures on d5 with the knight, giving White a Reversed Dragon setup with an extra tempo advantage.",
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
        description:
          "White gambits the c-pawn for rapid development — quickly recapturing with the bishop for active piece play.",
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
    tagline:
      "Fianchetto the bishop and squeeze — a modern grandmaster favorite.",
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
        description:
          "After Black grabs the c-pawn, they try to hold it with a6 and b5 — but White's fianchettoed bishop creates enormous pressure.",
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
    tagline:
      "A system for White — the same setup works against almost anything.",
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
        description:
          "Once White achieves e5, the position can become very cramping for Black. Prevention is key.",
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
        description:
          "Black sacrifices a pawn to open lines — the bishop lands on d6 with rapid development and a vicious attack on the weakened kingside.",
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
        description:
          "Black challenges the bishop with knight to e4, then pushes c5 — sharp positions where both sides have resources.",
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
        description:
          "If Black isn't careful, the bishop pin on g5 leads to doubled pawns after the trade on f6, weakening the kingside.",
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
    tagline:
      "Sacrifice a pawn for lasting queenside pressure — practical and effective.",
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
        description:
          "If White plays a4 too early, Black can get …b4 with a space advantage on both wings.",
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
