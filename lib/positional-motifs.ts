/**
 * Positional Motifs — curated library of chess positional concepts.
 *
 * Includes GM quotes, key ideas, and SEO FAQs.
 */

export type GmQuote = {
  text: string;
  author: string;
  /** Optional context, e.g. "on pawn structures" */
  context?: string;
};

export type PositionalMotif = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: "pawn-structure" | "piece-activity" | "king-safety" | "space";
  /** Authoritative GM quotes about this concept */
  gmQuotes: GmQuote[];
  keyIdeas: string[];
  howToExploit: string[];
  howToDefend: string[];
  /** FEN of a clear illustrative position */
  exampleFen: string;
  exampleDescription: string;
  related: string[];
  faqs: { q: string; a: string }[];
};

export const POSITIONAL_MOTIFS: PositionalMotif[] = [
  /* ─────────────────────── ISOLATED PAWN ───────────────────────── */
  {
    id: "isolated-pawn",
    name: "Isolated Pawn (IQP)",
    tagline: "A pawn with no friendly neighbors — weakness or dynamic weapon?",
    description:
      "The isolated queen's pawn (IQP) arises frequently from openings like the French, Caro-Kann, and QGD. It cannot be protected by other pawns, making it a long-term target. But the open files and active piece play it grants often compensate — and sometimes more than compensate.",
    difficulty: "intermediate",
    category: "pawn-structure",
    gmQuotes: [
      {
        text: "The isolated pawn casts a shadow over the entire chessboard.",
        author: "Aron Nimzowitsch",
        context: "My System, on the IQP weakness",
      },
      {
        text: "The IQP gives the possessor dynamic counterplay. The side without it must play very precisely to exploit the weakness.",
        author: "Garry Kasparov",
        context: "On IQP positions in the Nimzo-Indian",
      },
    ],
    keyIdeas: [
      "The IQP gives the owner open e- and c-files for rooks and active squares for bishops and knights",
      "The square directly in front of the IQP (d5 for a d-pawn) is a permanent outpost for the opposing side",
      "The IQP owner must seek middlegame activity — in simplified endings the pawn is often losing",
      "The standard plan is to trade the IQP off or launch a kingside attack before simplification",
      "Knights are the best blockaders; place one on d5 and the pawn becomes a long-term anchor",
    ],
    howToExploit: [
      "Trade off pieces to steer toward a simplified endgame where the IQP is purely weak",
      "Plant a knight or bishop on the blockade square directly in front of the pawn",
      "Target the d-pawn with rooks, doubling on the d-file",
      "Avoid allowing the IQP owner to advance e4-e5 or d4-d5 as a pawn break",
    ],
    howToDefend: [
      "Generate piece activity on open files to compensate for the structural weakness",
      "Consider the pawn push d4-d5 as a break to release tension and free your pieces",
      "Target the enemy king if the position allows a kingside attack",
      "Avoid exchanging pieces too early — the IQP is strongest in piece-rich positions",
    ],
    exampleFen: "r1bqr1k1/pp3ppp/2pb1n2/3p4/3P4/2NBB3/PPQ2PPP/R4RK1 w - - 0 1",
    exampleDescription:
      "White has the isolated d4-pawn but a pair of bishops, an active queen, and pressure along the e-file. The position is dynamically balanced. White should seek d4-d5 or a kingside attack before Black consolidates.",
    related: ["passed-pawn", "outpost", "open-file"],
    faqs: [
      {
        q: "Is an isolated pawn always bad?",
        a: "Not at all. In middlegames with active pieces, the IQP often provides more than enough compensation through open files, active squares, and attacking chances. It only becomes a serious weakness in simplified endgames where it can be targeted without counter-play.",
      },
      {
        q: "How do I beat the isolated pawn?",
        a: "Trade pieces to reach an endgame, blockade the pawn on its advance square with a knight or bishop, and double rooks on the file to pressure it. Avoid giving the IQP owner pawn breaks like d5 or e5.",
      },
      {
        q: "What openings lead to IQP positions?",
        a: "French Defense (3...c5 lines), Caro-Kann (4...Bf5 or 4...Nd7 with ...c5), QGD exchange variation, and Nimzo-Indian (4.e3 c5 5.Nge2) are the most common sources.",
      },
    ],
  },

  /* ─────────────────────── PASSED PAWN ─────────────────────────── */
  {
    id: "passed-pawn",
    name: "Passed Pawn",
    tagline:
      "No enemy pawn can stop it — a passed pawn must be pushed or it haunts you.",
    description:
      "A passed pawn has no opposing pawns on its file or adjacent files to block its advance to promotion. In the endgame, passed pawns are often the decisive factor — the side with the more advanced passed pawn typically wins. Every grandmaster has deeply studied how to create, advance, and blockade passed pawns.",
    difficulty: "beginner",
    category: "pawn-structure",
    gmQuotes: [
      {
        text: "A passed pawn is a criminal that should be kept under lock and key. Mild measures, such as police surveillance, are not sufficient.",
        author: "Aron Nimzowitsch",
        context: "My System, on blockading passed pawns",
      },
      {
        text: "The passed pawn is a major trump in the endgame. Its advance must be opposed from the very start.",
        author: "José Raúl Capablanca",
        context: "Chess Fundamentals",
      },
      {
        text: "It is not enough to have a passed pawn; you must advance it.",
        author: "Mikhail Botvinnik",
      },
    ],
    keyIdeas: [
      "A passed pawn is most dangerous in the endgame when kings and rooks are the primary forces",
      "Distant passed pawns are especially powerful in king-pawn endgames — they decoy the enemy king",
      "A connected passed pawn duo (two pawns marching together) is almost always winning",
      "Protected passed pawns are the strongest — a piece protects the pawn while it advances",
      "The rule of the square: if the king cannot enter the square of the advancing pawn, the pawn promotes",
    ],
    howToExploit: [
      "Trade pieces to simplify into an endgame where the passer can advance",
      "Use the king to escort the passed pawn — king activity is critical in pawn endgames",
      "Create a second threat (distant passed pawn) to force the enemy king to choose",
      "Rooks belong behind passed pawns — both your own (pushing it) and the enemy's (stopping it)",
    ],
    howToDefend: [
      "Blockade the passed pawn with a piece — ideally a knight on the queening square",
      "Attack the blockader to force it to move, then replace it",
      "Create your own counterplay somewhere on the board to distract the opponent",
      "Use the rule of the square to decide if the position is theoretically drawn",
    ],
    exampleFen: "8/8/4k3/3p4/8/4K3/8/8 w - - 0 1",
    exampleDescription:
      "Black has a passed d5-pawn with outside king support. White must calculate whether the king can enter the pawn's 'square' to stop it. This is a classic king-and-pawn endgame exercise in passer technique.",
    related: ["isolated-pawn", "outpost", "king-activity"],
    faqs: [
      {
        q: "What is the 'rule of the square' for passed pawns?",
        a: "Draw a diagonal from the pawn to its queening square, forming a square. If the opposing king can step into this square on their turn, they can catch the pawn. If not, the pawn promotes. It's a quick mental calculation tool for endgames.",
      },
      {
        q: "Where should rooks go relative to passed pawns?",
        a: "Behind your own passed pawn — this lets the rook push the pawn forward while staying active. Behind the opponent's passed pawn — this restrains it. Nimzowitsch's principle: rooks belong behind passed pawns.",
      },
      {
        q: "What's a candidate passer?",
        a: "A candidate passer is a pawn that could become passed after a pawn exchange. In a pawn majority, deciding which pawn to advance to create the best passed pawn is a key strategic decision.",
      },
    ],
  },

  /* ──────────────────────── OUTPOST ────────────────────────────── */
  {
    id: "outpost",
    name: "Outpost",
    tagline:
      "A square that no enemy pawn can attack — the perfect home for your knight.",
    description:
      "An outpost is a square in the opponent's half of the board that cannot be attacked by enemy pawns. Placing a knight on an outpost — particularly on d5, e5, c5, or f5 — creates a powerful piece that dominates the position. Outpost knights are notoriously difficult to dislodge.",
    difficulty: "intermediate",
    category: "piece-activity",
    gmQuotes: [
      {
        text: "The knight is the only piece that can jump over others. On an outpost deep in enemy territory, it becomes a monster.",
        author: "Mikhail Tal",
      },
      {
        text: "A knight on d5 is worth more than any bishop.",
        author: "Bobby Fischer",
        context: "On the strength of centralized knights",
      },
      {
        text: "Outposts are permanent pluses. A bishop can be traded, but an outpost knight digs in like a siege piece.",
        author: "Anatoly Karpov",
      },
    ],
    keyIdeas: [
      "An outpost is only truly strong if the opponent cannot challenge it with pawns",
      "Knights are the best outpost pieces because they cannot be attacked at range by pawns",
      "An outpost is created by advancing pawns to control the square from behind",
      "A knight on d6 or e6 can paralyze an entire position, cutting off communication between the enemy's pieces",
      "Outpost squares often arise from doubled or isolated pawns — the weakness and the outpost are two sides of the same coin",
    ],
    howToExploit: [
      "Identify squares in the opponent's camp that cannot be attacked by enemy pawns",
      "Use your own pawns to control and support the outpost square before occupying it",
      "Route the knight to the outpost via the most efficient path — use 'knight maneuver' plans",
      "Once the knight is on the outpost, add pressure to the position with rooks and bishops",
    ],
    howToDefend: [
      "Prevent the outpost square from being established by keeping pawn chains intact",
      "Trade the incoming knight before it establishes itself on the outpost",
      "Challenge the supporting pawns to take away the square control",
      "Counter-attack in another area of the board to distract the opponent from improving their knight",
    ],
    exampleFen: "r2q1rk1/pp3ppp/2pb1n2/3Np3/4P3/2NB4/PPP2PPP/R2QR1K1 w - - 0 1",
    exampleDescription:
      "White's knight on d5 is a model outpost — no Black pawn can attack it, it controls key central squares, and it cannot be challenged by a piece without significant concessions. This 'octopus knight' pattern is one of the most common winning positional themes.",
    related: ["isolated-pawn", "bishop-pair", "open-file"],
    faqs: [
      {
        q: "What makes a square an outpost?",
        a: "A square becomes an outpost when no enemy pawn can attack it — usually because the pawns on adjacent files have been exchanged or advanced past the square. The square must typically be on the 4th rank or deeper in the opponent's territory.",
      },
      {
        q: "Can bishops use outposts?",
        a: "Bishops can sit on strong squares, but they aren't called 'outpost bishops' because they attack at range without needing a fixed square. It's mainly a knight concept — knights need a stable perch because they have limited range.",
      },
      {
        q: "How do I create an outpost for myself?",
        a: "Exchange the pawn that guards the target square. If d5 is your target, provoke ...c6-c5 or ...e6-e5 — either exchange or advance opens d5 to occupation. Support the square with your own pawn (e.g. e4 supporting a piece on d5 or f5).",
      },
    ],
  },

  /* ──────────────────────── OPEN FILE ──────────────────────────── */
  {
    id: "open-file",
    name: "Open File",
    tagline:
      "Control the only open highway on the board — seize it with rooks.",
    description:
      "An open file (no pawns on it) or a half-open file (only one side has no pawn) is a major strategic highway. Whoever controls the open file with rooks typically has a meaningful positional advantage. The battle for open files is one of the most fundamental themes in positional chess.",
    difficulty: "beginner",
    category: "piece-activity",
    gmQuotes: [
      {
        text: "Rooks belong on open files. Put them there and they play themselves.",
        author: "Reuben Fine",
        context: "Basic Chess Endings",
      },
      {
        text: "The player who controls the only open file has a positional trump that cannot easily be neutralized.",
        author: "Siegbert Tarrasch",
      },
      {
        text: "Occupy open files with your rooks, and the enemy is squeezed as if in a vice.",
        author: "Aron Nimzowitsch",
        context: "My System",
      },
    ],
    keyIdeas: [
      "An open file gives rooks access to the 7th rank — the most powerful rook placement",
      "A half-open file (one side) can be used to pressure the enemy pawn from a distance",
      "When rooks are doubled on an open file, they cannot easily be dislodged without major concessions",
      "After castling queenside, the c- and d-files often open, creating critical rook lanes",
      "Control the invasion square at the end of the open file — plant a rook on the 7th rank",
    ],
    howToExploit: [
      "Identify open or half-open files early and race to place rooks on them",
      "Double rooks on the file for maximum pressure — one on the 1st, one on the 2nd",
      "Invade the 7th rank to attack enemy pawns still on their starting squares",
      "Use the open file to create a passed pawn or to infiltrate with the king in endgames",
    ],
    howToDefend: [
      "Contest the open file by placing your own rook on it — challenge for control",
      "Close the file by advancing a pawn to block access",
      "Trade off the invading rook to reduce pressure",
      "Ensure your king is not exposed to rook attacks along the open file",
    ],
    exampleFen:
      "r4rk1/ppp2ppp/2n1bn2/3q4/3P4/2NB1N2/PPQ2PPP/R1B1R1K1 w - - 0 1",
    exampleDescription:
      "The e-file is fully open. White's Re1 is perfectly placed on it. The strategic goal is to double rooks on the e-file and invade on e7. Black must react immediately or face a crushing build-up of rook pressure.",
    related: ["outpost", "passed-pawn", "rook-activity"],
    faqs: [
      {
        q: "What's the difference between an open file and a half-open file?",
        a: "An open file has no pawns of either color on it. A half-open file has one side's pawn cleared from it — for example, after ...cxd4, the c-file becomes half-open for Black (Black has no c-pawn) but White still has a d-pawn nearby. Half-open files are still valuable for rooks.",
      },
      {
        q: "Should I always try to put rooks on open files?",
        a: "Almost always, yes. The main exception is when the open file doesn't lead anywhere useful — if it's blocked by your own pieces or doesn't penetrate enemy territory. But in most positions, the first rook on the critical open file gains a lasting advantage.",
      },
      {
        q: "What is the '7th rank invasion' and why does it matter?",
        a: "A rook on the 7th rank (or 2nd rank for Black) attacks the opponent's pawns that haven't moved from their starting squares, forces the enemy king to the back rank, and controls critical central squares. Two rooks on the 7th rank are sometimes called 'pigs' because they gobble up pawns.",
      },
    ],
  },

  /* ──────────────────────── BISHOP PAIR ────────────────────────── */
  {
    id: "bishop-pair",
    name: "Bishop Pair",
    tagline:
      "Two bishops vs bishop and knight — long-term structural dominance.",
    description:
      "The bishop pair — owning both bishops while your opponent has been reduced to one bishop (or none) — is a well-known long-term positional advantage. In open positions with plenty of space, the two bishops sweep diagonals in both directions and are extremely hard to combat with a bishop-and-knight or two knights.",
    difficulty: "intermediate",
    category: "piece-activity",
    gmQuotes: [
      {
        text: "Two bishops in an open position are practically irresistible.",
        author: "Wilhelm Steinitz",
      },
      {
        text: "The bishop pair is a permanent advantage — you carry it into the endgame if you keep the position open.",
        author: "Garry Kasparov",
        context: "On Nimzo-Indian bishop pair structures",
      },
      {
        text: "I would rather have two bishops than a bishop and a knight nine times out of ten.",
        author: "Bobby Fischer",
      },
    ],
    keyIdeas: [
      "The bishop pair is strongest in open positions with pawns on both wings — they cover the whole board",
      "In closed positions with fixed pawn chains, the bishops are often worse than knights",
      "To neutralize the bishop pair, close the position with pawns and trade one bishop off",
      "A bishop on a long diagonal actively participating in the game is worth far more than a 'dead' bishop blocked by its own pawns",
      "In the endgame, the bishop pair typically outperforms any other combination of minor pieces",
    ],
    howToExploit: [
      "Open the position with pawn breaks — the more open the board, the stronger your bishops",
      "Place bishops on long diagonals that cut across the board — h2-b8, a1-h8 diagonals",
      "Create passed pawns that the bishops can support from a distance",
      "Avoid blocking your own bishops with pawn chains on their color",
    ],
    howToDefend: [
      "Close the position with pawns — fixed pawn chains reduce bishop mobility sharply",
      "Trade one of the enemy bishops at the cost of some structural concession",
      "Place your knight on a strong outpost where it isn't challenged by pawns",
      "Opposite-colored bishop positions often draw even with a pawn deficit",
    ],
    exampleFen:
      "r1bqk2r/pppp1ppp/2n2n2/2b1p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 0 1",
    exampleDescription:
      "An open central position with active piece play. Whoever retains the bishop pair here will have a long-term structural edge — both bishops can influence both wings simultaneously while knights need to reposition.",
    related: ["outpost", "open-file", "isolated-pawn"],
    faqs: [
      {
        q: "Is the bishop pair always an advantage?",
        a: "No. In closed positions with fixed pawn chains (like the King's Indian or French with locked center), the bishops become significantly weaker because they can't maneuver easily. Knights are often better in these structures. The key is pawn structure — open = bishops, closed = knights.",
      },
      {
        q: "How do I give up the bishop pair in an opening?",
        a: "This usually happens in the Nimzo-Indian (4...Bb4), Berlin Ruy Lopez, and Budapest Gambit. You sacrifice the bishop pair in exchange for some structural damage or rapid development. You accept the long-term positional concession for a more immediate tactical compensation.",
      },
      {
        q: "What does 'wrong-colored bishop' mean?",
        a: "A wrong-colored bishop is one that doesn't control the squares where its own pawns are fixed. For example, if your pawns are on e4, g4 (dark squares) and you have a dark-squared bishop, you're blocking your own bishop's diagonals. Ideally your bishop controls the opposite color to your pawn chain.",
      },
    ],
  },

  /* ──────────────────────── WEAK SQUARES ───────────────────────── */
  {
    id: "weak-squares",
    name: "Weak Squares",
    tagline: "Holes in your pawn structure that enemy pieces will never leave.",
    description:
      "A weak square is one that cannot be defended by any of your own pawns — typically created by advancing pawns past a color complex. Weak squares become permanent liabilities when enemy pieces are able to occupy them. The most dangerous weak squares are in your own camp on the 3rd or 4th rank.",
    difficulty: "intermediate",
    category: "pawn-structure",
    gmQuotes: [
      {
        text: "Weak points or holes in the opponent's position must be occupied by pieces, not pawns.",
        author: "Aron Nimzowitsch",
        context: "On utilizing weak squares",
      },
      {
        text: "Never create a weakness that your opponent can put a piece on permanently.",
        author: "Anatoly Karpov",
      },
      {
        text: "The most dangerous weakness is not the pawn itself — it is the square the pawn used to inhabit.",
        author: "Tigran Petrosian",
      },
    ],
    keyIdeas: [
      "Advancing a pawn leaves the square it was on (and adjacent squares of the same color) permanently weak",
      "The most common color weakness patterns: ...g6 + ...f6 creates dark square holes; e3 + f4 creates a light square complex",
      "A piece on a weak square cannot be dislodged by pawns — only by pieces, which costs material",
      "Weak squares often travel in clusters — a single advance can weaken an entire diagonal complex",
      "The bishop that controls the color of the weak squares is worth protecting",
    ],
    howToExploit: [
      "Identify the color complex weakened by the opponent's pawn advances",
      "Trade off the opponent's bishop that defends those squares",
      "Route a knight or bishop to the weak square — once there, it dominates",
      "Combine pressure on weak squares with other threats to prevent the opponent from addressing both",
    ],
    howToDefend: [
      "Avoid creating pawn weaknesses by advancing pawns without sufficient compensation",
      "Keep the 'good bishop' — the one that can patrol the color complex you've weakened",
      "Counter-attack to keep the opponent too busy to exploit the weak squares",
      "Accept that not every weakness can be defended — sometimes you must create counter-play elsewhere",
    ],
    exampleFen:
      "r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P1B2/2NBPN2/PPP2PPP/R2QK2R w KQ - 0 1",
    exampleDescription:
      "Black has played ...d5-d4 blocking the center, but this has weakened the c5 and e5 squares. White's knight on c3 eyes c5 via d5 or e4, and the light-squared bishop on f4 eyes the d6 square. The weak square complex around d6-c5-e5 will haunt Black's position.",
    related: ["outpost", "bishop-pair", "isolated-pawn"],
    faqs: [
      {
        q: "What's a 'color complex weakness'?",
        a: "When you advance pawns on one color (say dark squares: d5, e4, f5), you permanently remove defense from the other color (light squares: c4, d5, e6). The opponent can plant pieces on these undefended light squares indefinitely. Nimzowitsch called this a 'chronic weakness' — it doesn't heal.",
      },
      {
        q: "Can I recover from a weak square in my camp?",
        a: "Only partially. You can try to trade off the piece that's sitting on your weak square, or launch active counter-play elsewhere. But truly permanent weak squares — ones where the opponent can always reoccupy — require you to create enough counter-threats that the weakness becomes irrelevant.",
      },
      {
        q: "How does trading bishops help with weak squares?",
        a: "If your dark-squared bishop is traded, the dark squares in your position become permanently weak — your opponent's bishop and knights will dominate them forever. The side with more weak squares should keep the bishop that can cover them; the side exploiting weak squares should try to exchange that bishop off.",
      },
    ],
  },

  /* ────────────────────── PAWN MAJORITY ────────────────────────── */
  {
    id: "pawn-majority",
    name: "Pawn Majority",
    tagline:
      "More pawns on one wing — use them to create an unstoppable passer.",
    description:
      "A pawn majority exists when one side has more pawns on one wing than the opponent. A queenside majority (3 pawns vs 2) can produce a passed pawn by advancing the extra pawn. This passed pawn then becomes a major endgame weapon, forcing the opponent to divert pieces to stop it.",
    difficulty: "intermediate",
    category: "pawn-structure",
    gmQuotes: [
      {
        text: "The decision factor in endgames is the passed pawn. The majority produces it.",
        author: "José Raúl Capablanca",
        context: "Chess Fundamentals",
      },
      {
        text: "A queenside pawn majority in the endgame is often more valuable than a piece.",
        author: "Vasily Smyslov",
      },
    ],
    keyIdeas: [
      "A queenside majority (3-2) is the most common type and appears in many QGD and Caro-Kann structures",
      "The majority must be mobilized — advance the pawns to create a passed pawn before the opponent stops it",
      "The pawn that should advance first is the one not being directly attacked ('lever' pawn)",
      "A majority is less valuable if the pawns are blocked, isolated, or doubled",
      "In the middlegame, a majority is often more of a long-term weapon for the endgame",
    ],
    howToExploit: [
      "Trade down to a pawn endgame — majorities shine when pieces are off the board",
      "Advance the majority's 'lever pawn' to create the passed pawn — typically the c-pawn in a queenside majority",
      "Use the resulting passed pawn to distract the enemy king while your king invades the other wing",
      "Support the majority with the king in the endgame — kings escort passed pawns",
    ],
    howToDefend: [
      "Block the majority pawns — place a piece in front of the most advanced pawn",
      "Create your own counter-play on the other wing to divert attention",
      "Try to exchange your way into an endgame where the majority is neutralized",
      "Attack the base of the pawn majority early to break it up",
    ],
    exampleFen: "8/p1p5/1p6/8/8/1PP5/P7/8 w - - 0 1",
    exampleDescription:
      "White has a 3-2 queenside majority. The correct plan is to advance c3-c4-c5-c6 to create a passed pawn, while using the b3 pawn as support. Black's majority is equally active on the other side — timing is everything.",
    related: ["passed-pawn", "isolated-pawn", "outpost"],
    faqs: [
      {
        q: "What's a 'mobile majority' vs a 'crippled majority'?",
        a: "A mobile majority is three healthy connected pawns that can advance freely. A crippled majority is hobbled by doubled pawns or blocked pawns — it cannot create a passed pawn efficiently. For example, three pawns (a, b, d) with no c-pawn is a crippled majority because the d-pawn can never pass.",
      },
      {
        q: "When should I steer for an endgame with a pawn majority?",
        a: "When your majority is healthier (more mobile) than your opponent's, and you have an active king ready to support the advance. Avoid simplifying if your king is badly placed — a majority means nothing if the king can't escort the passer.",
      },
      {
        q: "Is a kingside majority as valuable as a queenside one?",
        a: "Generally yes, but context matters. A queenside majority is often more dangerous because the kings typically castle kingside — a queenside passer threatens to promote without the king being nearby to stop it. A kingside majority is more useful when both kings have castled on the same side.",
      },
    ],
  },

  /* ─────────────────────── KING ACTIVITY ───────────────────────── */
  {
    id: "king-activity",
    name: "King Activity",
    tagline: "In the endgame, the king is a powerful fighting piece — use it.",
    description:
      "In the opening and middlegame, the king hides behind pawns. But in the endgame, with fewer pieces on the board, the king becomes a powerful attacking and defensive weapon. Activating the king early in the endgame is one of the most important endgame skills a chess player can develop.",
    difficulty: "beginner",
    category: "king-safety",
    gmQuotes: [
      {
        text: "The king is a fighting piece. Use it!",
        author: "Reuben Fine",
      },
      {
        text: "In the endgame, the king must be centralized. A passive king on the back rank is a disaster.",
        author: "José Raúl Capablanca",
        context: "Chess Fundamentals",
      },
      {
        text: "One of the most common errors is to underestimate the power of the king in the endgame.",
        author: "Mikhail Botvinnik",
      },
    ],
    keyIdeas: [
      "In pawn endgames, king centralization is almost always the highest priority move",
      "The opposition (kings facing each other with an odd number of squares between them) determines who breaks through",
      "The triangulation technique uses the king to 'lose a tempo' and gain the opposition",
      "An active king on the 5th or 6th rank literally wins games — it attacks pawns and supports its own",
      "King activity is even critical in rook endgames — a passive king by a7 vs a king on d4 is often losing",
    ],
    howToExploit: [
      "Activate your king immediately when queens and most pieces are traded",
      "March the king toward the center or toward the critical pawns",
      "Use the king to attack enemy pawns directly while supporting your own",
      "In pawn endgames, calculate opposition, key squares, and triangulation precisely",
    ],
    howToDefend: [
      "Keep your own king active to match the opponent's king activity",
      "Don't allow the opponent's king to penetrate your pawn structure unchallenged",
      "Use rook checks to drive the enemy king back to a passive position",
      "Create outside passed pawns to distract the enemy king from the critical sector",
    ],
    exampleFen: "8/8/4k3/8/4K3/8/4P3/8 w - - 0 1",
    exampleDescription:
      "White's king on e4 is actively centralized and directly supporting the e-pawn. Black needs to navigate the opposition carefully — whether the White king can penetrate to the key squares (e6, f6, d6) around the pawn determines the result.",
    related: ["passed-pawn", "pawn-majority", "outpost"],
    faqs: [
      {
        q: "When should I start activating my king?",
        a: "Generally once queens are off the board. In rook endgames, as soon as checks slow down and the position stabilizes. In pawn endgames, immediately. The window to activate the king is often only a few moves — missing it can mean the difference between a win and a draw.",
      },
      {
        q: "What is the 'opposition' in king-pawn endgames?",
        a: "Opposition occurs when two kings face each other with exactly one square between them. The player who doesn't have the 'move' (i.e., whose turn it is NOT) has the opposition — and typically has the advantage in king-pawn endings because the other king must step aside.",
      },
      {
        q: "Can king activity matter in the middlegame?",
        a: "Rarely, but yes — in simplified positions after many trades, a 'pseudoendgame' occurs where the king is suddenly needed in the center even before all heavy pieces are traded. Some grandmasters deliberately march their king through the center in what look like middlegame positions.",
      },
    ],
  },
];
