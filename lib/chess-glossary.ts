/**
 * Chess glossary database for pSEO pages at /glossary/[slug]
 * ~50 terms: tactics, strategy, endgame, special moves, concepts.
 */

export type GlossaryCategory =
  | "tactics"
  | "strategy"
  | "endgame"
  | "openings"
  | "special-moves"
  | "concepts"
  | "game-phases";

export type GlossaryTerm = {
  id: string;
  term: string;
  category: GlossaryCategory;
  /** One-liner for SEO meta description */
  tagline: string;
  /** 2-3 sentence definition */
  definition: string;
  /** Concrete example a beginner can follow */
  example: string;
  /** Why learning this term improves your chess */
  whyItMatters: string;
  /** Optional FEN position illustrating the concept */
  fen?: string;
  faqs: { q: string; a: string }[];
  related: string[];
};

const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  tactics: "Tactics",
  strategy: "Strategy",
  endgame: "Endgame",
  openings: "Openings",
  "special-moves": "Special Moves",
  concepts: "Concepts",
  "game-phases": "Game Phases",
};

export { CATEGORY_LABELS };

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // ── TACTICS ──────────────────────────────────────────────────
  {
    id: "fork",
    term: "Fork",
    category: "tactics",
    tagline:
      "A fork is a tactic where one piece attacks two or more enemy pieces simultaneously, forcing your opponent to lose material.",
    definition:
      "A fork occurs when a single piece attacks two or more of the opponent's pieces at the same time. Since only one can be saved per move, the forking player wins material. Knights are the most notorious forking pieces because their L-shaped movement can attack multiple pieces from unexpected angles.",
    example:
      "Place a White knight on e5. It attacks the Black queen on d7 and the Black rook on c6 at the same time. Black can only move one — so White captures the other for free. This is a classic knight fork.",
    whyItMatters:
      "Recognizing fork patterns — especially knight forks — is one of the fastest ways to win material at beginner and intermediate levels. Always look for squares where your knight can attack two pieces at once.",
    faqs: [
      {
        q: "Which piece is best at forking?",
        a: "Knights are the best forking piece because they jump over other pieces and attack in an L-shape that's hard to anticipate. Queens, rooks, and bishops can also fork, but knight forks are the most common at club level.",
      },
      {
        q: "What is a royal fork?",
        a: "A royal fork is when a single piece simultaneously attacks the king and queen — the two most valuable pieces. This almost always wins the queen immediately since the king must escape check.",
      },
      {
        q: "What is a family fork?",
        a: "A family fork is when a knight attacks three or more pieces at once — the king, queen, and a rook, for example. The term is informal but widely used.",
      },
    ],
    related: ["double-check", "skewer", "discovered-attack", "tactic"],
  },
  {
    id: "pin",
    term: "Pin",
    category: "tactics",
    tagline:
      "A pin is a tactic where a piece is immobilized because moving it would expose a more valuable piece behind it to capture.",
    definition:
      "A pin occurs when an attacking piece threatens a defending piece that, if moved, would expose a more valuable piece behind it to capture. An absolute pin is when the pinned piece cannot legally move because it would leave its own king in check. A relative pin is when moving the pinned piece is legal but loses material.",
    example:
      "A White bishop on b3 pins a Black knight on e6 against the Black king on g8. The knight cannot legally move — it would expose the king to check. White can now attack the pinned knight with a pawn on d5, winning the knight for free.",
    whyItMatters:
      "Pins are one of the most powerful strategic tools in chess. A pinned piece cannot defend other pieces effectively. Learning to create pins — and to escape or break them — is essential for any improving player.",
    faqs: [
      {
        q: "What is an absolute pin?",
        a: "An absolute pin is when a pinned piece cannot legally move because doing so would expose its king to check. Moving the piece would be an illegal move.",
      },
      {
        q: "What is a relative pin?",
        a: "A relative pin is when moving the pinned piece is technically legal, but doing so would lose a more valuable piece behind it. The pin is 'relative' because the player can choose to ignore it — at a material cost.",
      },
      {
        q: "Which pieces can create pins?",
        a: "Only pieces that move in straight lines can create pins: bishops (diagonals), rooks (ranks and files), and queens (all directions). Knights and pawns cannot pin.",
      },
    ],
    related: ["skewer", "fork", "discovered-attack", "tactic"],
  },
  {
    id: "skewer",
    term: "Skewer",
    category: "tactics",
    tagline:
      "A skewer is the reverse of a pin — a valuable piece is attacked directly and must move, exposing a less valuable piece behind it to capture.",
    definition:
      "A skewer is a tactic where a piece attacks a high-value enemy piece (usually the king or queen). When that piece moves to safety, a less valuable piece behind it is captured. It's the opposite of a pin: in a pin the valuable piece is in the back; in a skewer it's in the front.",
    example:
      "A White rook on a1 attacks the Black king on a8. The king must move off the a-file. After Kg8, the White rook captures the Black rook on a6 — which was sitting behind the king. The king was 'skewered' to the rook.",
    whyItMatters:
      "Skewers often win material because the piece in front (the king or queen) is too valuable to sacrifice and must flee. Endgames with rooks and queens are especially rich in skewer opportunities.",
    faqs: [
      {
        q: "What is the difference between a pin and a skewer?",
        a: "In a pin, the more valuable piece is behind the attacked piece. In a skewer, the more valuable piece is the one being attacked directly — it moves away, and the piece behind it gets captured.",
      },
      {
        q: "Which pieces can create skewers?",
        a: "Only sliding pieces — bishops, rooks, and queens — can create skewers because they attack along lines.",
      },
    ],
    related: ["pin", "fork", "x-ray", "tactic"],
  },
  {
    id: "discovered-attack",
    term: "Discovered Attack",
    category: "tactics",
    tagline:
      "A discovered attack is unleashed when one piece moves and unmasks an attack from a piece behind it — often winning material or giving check.",
    definition:
      "A discovered attack occurs when a piece moves and, in doing so, reveals an attack from a piece that was behind it on a line (rank, file, or diagonal). The power of a discovered attack comes from the fact that the moving piece can simultaneously threaten something else — creating two threats at once that the opponent may not be able to answer.",
    example:
      "White has a bishop on e4 aligned with the Black queen on a8, but a White knight on c6 is blocking. When the knight moves away — say to d8, giving check — it reveals the bishop's attack on the queen. Black must deal with the check, and White wins the queen.",
    whyItMatters:
      "Discovered attacks are extremely powerful because they generate two threats simultaneously. The piece that moves can threaten a third thing while the piece behind delivers the real blow. Experienced players always look for 'unblocking' moves that reveal hidden attacks.",
    faqs: [
      {
        q: "What is a discovered check?",
        a: "A discovered check is when a piece moves and the resulting uncovered attack is on the enemy king — putting it in check. These are especially dangerous because the moving piece can threaten material elsewhere while the opponent must spend a move escaping check.",
      },
      {
        q: "What is a double check?",
        a: "A double check is when the moving piece also gives check simultaneously with the discovered check piece. Double checks are among the most powerful tactics in chess because the king must move — it cannot block or capture both checking pieces.",
      },
    ],
    related: ["double-check", "fork", "pin", "zwischenzug"],
  },
  {
    id: "double-check",
    term: "Double Check",
    category: "tactics",
    tagline:
      "A double check is when two pieces simultaneously give check — the king must move since no single capture or block can stop both.",
    definition:
      "A double check occurs when a king is attacked by two pieces at the same time, typically produced by a discovered check where the moving piece also gives check. It is the most forcing tactic in chess — the king cannot capture or block (one piece can be captured or blocked, not two), so it must move. Double checks can deliver checkmate in positions that appear otherwise defended.",
    example:
      "White plays Nd7+: the knight gives check, and simultaneously uncovers a bishop's check on the king. Two pieces checking at once — the king has nowhere to block or capture and must flee. White follows up with a mating attack.",
    whyItMatters:
      "Knowing double check patterns helps you find devastating combinations that appear from nowhere. Any time you have a discovered check candidate, ask: can the moving piece also give check at the same time?",
    faqs: [
      {
        q: "Can you block a double check?",
        a: "No. Blocking works against a single check, but a double check comes from two directions simultaneously. The only legal response is to move the king.",
      },
      {
        q: "Can you capture both checking pieces in a double check?",
        a: "No. You can only make one move per turn, so you can capture at most one of the checking pieces. The other remains on the board. That's why double check forces the king to move.",
      },
    ],
    related: ["discovered-attack", "check", "checkmate", "fork"],
  },
  {
    id: "zwischenzug",
    term: "Zwischenzug",
    category: "tactics",
    tagline:
      "Zwischenzug (German for 'in-between move') is an unexpected intermediate move played instead of the expected reply, often changing the whole calculation.",
    definition:
      "Zwischenzug (also called an 'intermezzo') is an intermediate move played instead of the expected recapture or reply. It typically gives check or makes a strong threat that must be answered first, and then the original recapture or plan follows. Zwischenzugs frequently turn a losing sequence into a winning one because the opponent hasn't calculated the intermediate move.",
    example:
      "White takes a pawn on d5 and expects Black to recapture. But instead of recapturing, Black plays Qb6+ — a check that wins a pawn on f2 along the way. After White deals with the check, Black recaptures on d5. The Zwischenzug gained a free pawn.",
    whyItMatters:
      "Missing an opponent's zwischenzug is one of the most common calculation errors. Always ask 'does my opponent have a check or strong threat before the expected recapture?' before committing to a sequence.",
    faqs: [
      {
        q: "How do you pronounce 'Zwischenzug'?",
        a: "'TSVISH-en-tsoog' — it's German for 'between/intermediate move'. English players also call it an 'intermezzo' (Italian for the same concept).",
      },
      {
        q: "How do you defend against a Zwischenzug?",
        a: "Anticipate it by calculating all your opponent's checks and threats before assuming they'll play the expected response. Experienced players mentally follow each forcing variation to its end before committing.",
      },
    ],
    related: ["discovered-attack", "tactic", "fork", "tempo"],
  },
  {
    id: "deflection",
    term: "Deflection",
    category: "tactics",
    tagline:
      "Deflection is a tactic that forces an enemy piece away from a key defensive duty — often a square, file, rank, or another piece it is protecting.",
    definition:
      "A deflection tactic forces an enemy piece to abandon its defensive post — by capturing a piece it cannot ignore, or by making a threat it must answer. Once the defender is deflected, the square or piece it was guarding becomes vulnerable. Deflection is closely related to overloading — the difference is that in deflection the piece is physically moved away, while in overloading it is given too many tasks to handle.",
    example:
      "White's queen is aiming at h7 but the Black rook on h8 defends it. White plays Rxh8+! — deflecting the rook. If Black recaptures (Rxh8), the queen can no longer be stopped from delivering mate on h7. The rook was deflected from its duty.",
    whyItMatters:
      "Learning to spot deflection helps you remove key defenders from critical squares. Ask: 'which piece is doing the most important job here, and can I force it away?'",
    faqs: [
      {
        q: "What is the difference between deflection and decoy?",
        a: "In a deflection, a piece is pushed away from its defensive role. In a decoy, a piece is lured toward a specific square to exploit its new position. Both remove defenders — deflection pushes, decoy attracts.",
      },
    ],
    related: ["decoy", "overloading", "pin", "fork"],
  },
  {
    id: "decoy",
    term: "Decoy",
    category: "tactics",
    tagline:
      "A decoy lures an enemy piece to a specific square where it becomes vulnerable or where its new position enables a follow-up tactic.",
    definition:
      "A decoy sacrifice draws an enemy piece to an unfavorable square. Typically a piece is sacrificed to force the opponent's king or queen onto a specific square, where a follow-up combination wins material or delivers checkmate. Decoys are common in mating attacks: the king is lured forward via a bait piece, then trapped.",
    example:
      "White offers a queen sacrifice: Qxh7+. If Black's king takes (Kxh7), White plays Rh1# — the king has been decoyed onto h7 where it's mated. The queen sacrifice was a decoy to lure the king to its doom.",
    whyItMatters:
      "Decoy tactics often lead to spectacular combinations, especially sacrificing the queen or rook to drag the enemy king into a mating net. Train yourself to ask: 'what happens if I force the king to this specific square?'",
    faqs: [
      {
        q: "Is a decoy the same as a sacrifice?",
        a: "Not always — a sacrifice is a broader term for giving up material. A decoy is a specific type of sacrifice where the material is offered specifically to lure a piece to a targeted square. Every decoy involves a sacrifice, but not every sacrifice is a decoy.",
      },
    ],
    related: ["deflection", "overloading", "checkmate", "fork"],
  },
  {
    id: "overloading",
    term: "Overloading",
    category: "tactics",
    tagline:
      "Overloading is a tactic where a defending piece is given more defensive duties than it can handle — attacking both will win one.",
    definition:
      "Overloading occurs when a single piece is responsible for defending multiple important squares, pieces, or functions simultaneously. When both tasks are attacked at once, the piece cannot cover them all — the attacker captures one of the undefended items. Overloading is best exploited by creating two simultaneous threats against a piece that can only answer one.",
    example:
      "Black's queen on d7 defends both the rook on d4 and the bishop on g4. White plays Rxd4, attacking both. If Black's queen takes the rook (Qxd4), White captures the bishop (Bxg4). The queen was overloaded — it couldn't defend two pieces at once.",
    whyItMatters:
      "Piece economy is everything in chess. When your opponent has one piece doing two jobs, probe both simultaneously. Overloading is the backbone of many combination sequences.",
    faqs: [
      {
        q: "How do you create an overloading situation?",
        a: "Identify one of your opponent's pieces that is doing two or more defensive tasks. Then attack both targets simultaneously so they cannot all be defended. This often requires a preliminary sacrifice or forcing move.",
      },
    ],
    related: ["deflection", "fork", "pin", "tactic"],
  },
  {
    id: "x-ray",
    term: "X-Ray Attack",
    category: "tactics",
    tagline:
      "An X-ray attack is when a piece exerts pressure through an enemy piece, targeting what's behind it on the same line.",
    definition:
      "An X-ray attack (also called an X-ray defense or transparency tactic) occurs when a piece attacks through an enemy piece on the same rank, file, or diagonal. The most common form is a queen or rook 'seeing through' an enemy queen to attack or defend beyond it. This often creates pins, exploits weaknesses, or defends key squares from a distance.",
    example:
      "White's rook on a1 aims at the Black queen on a5. Behind the queen sits the Black king on a8. If the queen moves, the king is in check — the rook was using X-ray vision through the queen. This can prevent the queen from capturing a piece on a5 because doing so would bring her onto the rook's line of fire.",
    whyItMatters:
      "X-ray vision is a concept experienced players use constantly when working out which squares are truly safe. Before moving a piece onto a square, make sure no enemy piece is 'seeing through' another piece to attack it.",
    faqs: [
      {
        q: "Is x-ray a common tactic?",
        a: "It appears more often in endgames (where pieces are less cluttered) and in queen endings. It's an important concept for understanding why certain squares are not as safe as they appear.",
      },
    ],
    related: ["pin", "skewer", "battery", "discovered-attack"],
  },

  // ── STRATEGY ─────────────────────────────────────────────────
  {
    id: "outpost",
    term: "Outpost",
    category: "strategy",
    tagline:
      "An outpost is a square in the opponent's half of the board that cannot be attacked by enemy pawns — ideal for placing a knight or other piece permanently.",
    definition:
      "An outpost is a square on the 4th, 5th, 6th, or 7th rank that cannot be attacked by any enemy pawn. A piece placed on an outpost — especially a knight — is extremely powerful because the opponent cannot drive it away with pawns. The best outposts are supported by your own pawns and sit in front of a pawn weakness in the opponent's position.",
    example:
      "White has pawns on c4 and e4, and Black has no pawn on d5 or f5 to challenge. Square d5 is an outpost for White — no Black pawn can ever attack it. A White knight on d5 dominates the board, pressuring Black's position from a fixed, unassailable square.",
    whyItMatters:
      "Creating and occupying outposts — especially with knights — is one of the most reliable strategic advantages in chess. Many world championship games have been won by a knight sitting on an unchallenged outpost for 30+ moves.",
    faqs: [
      {
        q: "Why are knights better than bishops on outposts?",
        a: "Bishops are long-range pieces that do well in open positions. Knights, being short-range, benefit enormously from being placed on fixed squares they can never be driven from. A knight on a 5th-rank outpost often outperforms a bishop that has no pawn targets to attack.",
      },
      {
        q: "How do you create an outpost?",
        a: "You create an outpost by exchanging or advancing pawns so the enemy has no pawn on the adjacent files to challenge your target square. Opening the c-file by trading c-pawns often creates a d5 outpost for the player who retains the e-pawn.",
      },
    ],
    related: ["weak-square", "isolated-pawn", "knight", "pawn-structure"],
  },
  {
    id: "weak-square",
    term: "Weak Square",
    category: "strategy",
    tagline:
      "A weak square is one that can no longer be defended by pawns and can be permanently occupied by the opponent.",
    definition:
      "A weak square is a square — typically in your own half of the board — that cannot be defended by pawns (because the pawns that could have defended it have moved or been exchanged). A weak square becomes dangerous when your opponent can place a piece there that cannot easily be driven away. The most strategically significant weak squares are those in the center and, especially, on the 6th rank.",
    example:
      "If Black plays ...f5 and ...g6, the e6 square becomes permanently weak — no Black pawn can ever cover it. A White knight planted on e6 sits in the heart of Black's position, controls key squares, and is nearly impossible to remove.",
    whyItMatters:
      "Creating and exploiting weak squares is the essence of positional chess. Before advancing pawns, always consider whether you're creating long-term weaknesses that the opponent can occupy. Conversely, search your opponent's pawn structure for squares that can never be defended.",
    faqs: [
      {
        q: "What is a 'hole' in chess?",
        a: "A hole is a specific type of weak square — one that is in your own territory, cannot be covered by your own pawns, and can be occupied by an enemy piece. The term is especially used for squares on the 4th–6th ranks. An e4–d4 pawn configuration creates a hole on d5 for Black.",
      },
      {
        q: "What is a color weakness?",
        a: "A color weakness is when all your pawns are on one color of square, making all the squares of the opposite color permanently weak. If your dark-squared bishop has been exchanged and all your pawns are on dark squares, White can exploit the light squares throughout your position.",
      },
    ],
    related: ["outpost", "pawn-structure", "isolated-pawn", "bishop-pair"],
  },
  {
    id: "isolated-pawn",
    term: "Isolated Pawn",
    category: "strategy",
    tagline:
      "An isolated pawn has no friendly pawns on adjacent files to support it, making it a long-term weakness that can't be defended by pawns alone.",
    definition:
      "An isolated pawn (also called an 'isolani') is a pawn with no pawns of the same color on either neighboring file. It cannot be supported by other pawns, so pieces must defend it — creating passive, defensive positions. However, an isolated pawn often gives its owner active piece play, open files, and space in the center. The question is whether the dynamic compensation outweighs the long-term structural weakness.",
    example:
      "After 1.e4 e5 2.d4 exd4 (the Scotch Game), White often recaptures to get a d4 isolani. It gives White a space advantage and active pieces, but in an endgame it becomes a target that Black can attack with rooks and a king.",
    whyItMatters:
      "Knowing when an isolated pawn is a weakness versus a strength is a key positional skill. In middlegames with active pieces, the isolani is often worth the structural cost. In simplified endgames, it frequently loses.",
    faqs: [
      {
        q: "Is an isolated pawn always bad?",
        a: "No — in the middlegame an isolated pawn often provides excellent compensation: open files for rooks, space, dynamic piece activity. Many openings (Sicilian, Caro-Kann, Scotch) regularly produce isolated pawns for good reason. The weakness typically shows most in the endgame.",
      },
      {
        q: "How do you fight against an isolated pawn?",
        a: "The classic strategy is to blockade it with a piece (especially a knight on the square in front of it), exchange most pieces, and then attack the pawn in the endgame with your rooks and king. Avoid opening the position, as that gives the isolated-pawn player active piece play.",
      },
    ],
    related: ["passed-pawn", "doubled-pawns", "pawn-structure", "outpost"],
  },
  {
    id: "passed-pawn",
    term: "Passed Pawn",
    category: "strategy",
    tagline:
      "A passed pawn has no opposing pawns blocking it or on adjacent files to capture it — making it a powerful endgame weapon that can promote.",
    definition:
      "A passed pawn is a pawn with no opposing pawn directly in front of it or on either adjacent file — meaning no enemy pawn can stop it from advancing to promotion without piece intervention. In endgames, passed pawns are among the most decisive advantages. A protected passed pawn (supported by another pawn) is especially powerful. The rule of thumb: 'passed pawns must be pushed.'",
    example:
      "White has a pawn on d5, and Black has no pawns on c, d, or e files. It's a passed pawn. As pieces come off the board, the king must go chase it or it marches to d8 and promotes to a queen. A protected passed pawn — say with White's c4 pawn supporting a d5 passer — is even harder to stop.",
    whyItMatters:
      "Creating a passed pawn — or preventing one — is often the central goal in the endgame phase. Study how to use the outside passed pawn as a decoy to draw the opponent's king away, allowing your own king to take material on the other side.",
    faqs: [
      {
        q: "What is an outside passed pawn?",
        a: "An outside passed pawn is a passed pawn on one flank while the main action is on the other flank. It functions as a distraction — forcing the opponent's king or pieces to chase it, leaving the rest of the board undefended.",
      },
      {
        q: "What is a candidate passer?",
        a: "A candidate passer is a pawn that could become passed if one or more opposing pawns were exchanged. Recognizing candidate passers helps you plan pawn breaks and exchanges to create a future passed pawn.",
      },
    ],
    related: ["isolated-pawn", "pawn-structure", "promotion", "endgame"],
  },
  {
    id: "doubled-pawns",
    term: "Doubled Pawns",
    category: "strategy",
    tagline:
      "Doubled pawns are two pawns of the same color on the same file — usually a weakness since they cannot protect each other.",
    definition:
      "Doubled pawns occur when two pawns of the same color land on the same file, typically after capturing toward the center. The rear pawn is especially vulnerable — it blocks the front pawn, can't be supported by a pawn from behind, and restricts the forward pawn's advance. However, doubled pawns sometimes come with compensation: the open or half-open file created for rooks, or active piece play.",
    example:
      "After the Ruy Lopez Exchange Variation (3.Bxc6 dxc6), Black has doubled c-pawns. The c6 pawn is particularly weak and can't advance easily. But Black gains the bishop pair and an open d-file — whether the doubled pawns are a weakness or a fair trade depends on the position.",
    whyItMatters:
      "Automatically labeling doubled pawns as 'bad' is a mistake. Ask: what did the player get in return? If the trade was the bishop pair or an open file, doubled pawns can be fine or even good. Evaluate compensation every time.",
    faqs: [
      {
        q: "Can doubled pawns be an advantage?",
        a: "Yes. Doubled pawns can control extra squares, open files for rooks, and are sometimes structurally necessary to maintain the initiative. In the Ruy Lopez Exchange or many Sicilian lines, doubled pawns are deliberately accepted for concrete compensation.",
      },
      {
        q: "What is tripled pawns?",
        a: "Tripled pawns are three pawns of the same color on one file — a severe structural weakness. The middle pawn is almost immobile and the rearmost pawn is usually a permanent target. Tripled pawns are rare but almost always a serious disadvantage.",
      },
    ],
    related: ["isolated-pawn", "pawn-structure", "bishop-pair", "open-file"],
  },
  {
    id: "bishop-pair",
    term: "Bishop Pair",
    category: "strategy",
    tagline:
      "The bishop pair is possessing both bishops while your opponent has lost one — an enduring strategic advantage in open and semi-open positions.",
    definition:
      "Having the bishop pair means you possess both a light-squared and dark-squared bishop while your opponent has only one (or none). Two bishops together cover all squares on the board and tend to dominate in open positions with long diagonals. The advantage of the bishop pair increases as the position opens up and decreases in closed pawn structures.",
    example:
      "After the Ruy Lopez Exchange (Bxc6 dxc6), White gives up the bishop pair but gains structural assets. In open games with passed pawns and bishops on long diagonals, the two bishops often outperform a bishop and knight or two knights.",
    whyItMatters:
      "The bishop pair is one of the most common long-term advantages in positional chess. In many opening systems, gaining or preserving the bishop pair is a primary strategic goal. Learn how to exploit it by opening the position.",
    faqs: [
      {
        q: "Why are two bishops better than bishop and knight?",
        a: "Two bishops cover both colors and work well in tandem along open diagonals. A bishop and knight combination is more versatile in complex positions — the knight can access squares the bishop cannot. In very open positions, the bishop pair usually wins; in closed positions, the knight is often preferred.",
      },
      {
        q: "How do you exploit the bishop pair?",
        a: "Open the position with pawn breaks, exchange knights, and create targets on both colors of squares. Avoid trading one of your bishops or allowing the position to close. A bishop pair in a closed position is often worth no more than a single bishop.",
      },
    ],
    related: ["weak-square", "open-file", "pawn-structure", "outpost"],
  },
  {
    id: "open-file",
    term: "Open File",
    category: "strategy",
    tagline:
      "An open file is a file with no pawns of either color — giving rooks maximum activity and control along the entire column.",
    definition:
      "An open file is a vertical column with no pawns on it. Rooks thrive on open files because they can operate the full length of the board without being blocked. Controlling an open file — ideally with doubled rooks — is one of the most reliable positional advantages. A half-open file has pawns of only one color, giving the other side's rook partial activity.",
    example:
      "After an exchange on d4, the d-file is fully open. White doubles rooks on d1 and d2, eyeing d7 and d8. Black must waste pieces defending the 7th rank. White creates threats along the open file — putting pressure on Black's position simply by occupying the column.",
    whyItMatters:
      "A simple positional rule: put your rooks on open files. Control of open files restricts the opponent, supports piece infiltration, and creates enduring pressure. Creating and keeping open files is a fundamental goal in the middlegame.",
    faqs: [
      {
        q: "What is a half-open file?",
        a: "A half-open file (or semi-open file) has only one side's pawns on it. The side without a pawn on that file has a rook advantage — their rook can move freely along the file immediately. Many sicilian positions create a half-open c-file for Black.",
      },
      {
        q: "What does it mean to dominate the open file?",
        a: "Dominating an open file means your rooks (ideally doubled) control it so well that the opponent's rooks cannot contest it. This often lets you penetrate to the 7th or 8th rank, creating decisive attacking chances or endgame advantages.",
      },
    ],
    related: ["doubled-rooks", "rook", "pawn-structure", "endgame"],
  },
  {
    id: "pawn-structure",
    term: "Pawn Structure",
    category: "strategy",
    tagline:
      "Pawn structure is the arrangement of all pawns on the board — it determines the long-term strategic character of a position, often regardless of piece placement.",
    definition:
      "Pawn structure (or pawn skeleton) refers to the overall arrangement of both players' pawns across the board. Because pawns can only move forward, their structure is slow to change and powerfully shapes the long-term plan. Key structural features include isolated pawns, doubled pawns, passed pawns, pawn chains, open files, and blocked positions. Most opening systems are defined by the resulting pawn structures.",
    example:
      "The Sicilian Defense leads to distinctive pawn structures: White often has a central pawn majority (e4, d4) while Black has a queenside majority (c5, b7, a7). This guides both sides' plans — White attacks on the kingside, Black counterattacks on the queenside and in the center.",
    whyItMatters:
      "Understanding pawn structures at an intermediate level is more valuable than memorizing openings — the structure dictates the plan in most positions. Study typical pawn structures (isolani, hanging pawns, pawn chains) to automatically know what to do in each.",
    faqs: [
      {
        q: "Do pawn structures change during a game?",
        a: "Pawn structures change slowly compared to piece positions — pawns can only move forward and changes require captures. This is why structural decisions (like accepting doubled pawns or creating a passed pawn) have long-lasting consequences.",
      },
      {
        q: "What book should I read about pawn structure?",
        a: "'Pawn Structure Chess' by Andrew Soltis is a classic — it teaches plans based on typical pawn configurations rather than specific openings. 'Silman's Complete Endgame Course' also covers structural endgame principles well.",
      },
    ],
    related: ["isolated-pawn", "passed-pawn", "doubled-pawns", "outpost"],
  },

  // ── SPECIAL MOVES ─────────────────────────────────────────────
  {
    id: "en-passant",
    term: "En Passant",
    category: "special-moves",
    tagline:
      "En passant is a special pawn capture that can only occur immediately after an opponent's pawn advances two squares from its starting position.",
    definition:
      "En passant (French for 'in passing') is a special pawn capture rule. When a pawn advances two squares from its starting position and lands beside an opponent's pawn, the opponent may capture it as if it had only moved one square — but only on the very next move. If the opportunity is not taken immediately, it is lost forever.",
    example:
      "White's pawn is on e5. Black plays d7-d5, landing on d5 — right beside White's pawn. White can play exd6 en passant, capturing the Black pawn as if it had only moved to d6. The result: White's pawn is now on d6, and Black's d-pawn is removed.",
    whyItMatters:
      "Missing or forgetting en passant can be costly — it's a free pawn capture opportunity that expires after one move. It's often tested in chess puzzles and can change pawn structure dramatically, opening or closing files.",
    faqs: [
      {
        q: "Can pieces other than pawns capture en passant?",
        a: "No — en passant is exclusively a pawn move. Only a pawn can capture another pawn en passant.",
      },
      {
        q: "Is en passant mandatory?",
        a: "No — it's optional. You don't have to take en passant. But if you don't take it on your very next move, the opportunity is gone for that pawn.",
      },
      {
        q: "Why does en passant exist?",
        a: "En passant was introduced in the 15th century when pawns gained the ability to advance two squares on their first move (a change made to speed up games). The en passant rule preserved the principle that a pawn cannot bypass an enemy pawn that controls the squares it passes through.",
      },
    ],
    related: ["promotion", "pawn-structure", "castling", "stalemate"],
  },
  {
    id: "castling",
    term: "Castling",
    category: "special-moves",
    tagline:
      "Castling is the only move in chess that moves two pieces at once — the king and rook — simultaneously tucking the king to safety.",
    definition:
      "Castling is a special move where the king moves two squares toward a rook, and the rook jumps to the square the king passed over. Kingside castling (O-O) tucks the king to g1 and puts the rook on f1. Queenside castling (O-O-O) moves the king to c1 and the rook to d1 (for White). You cannot castle if the king is in check, if any square the king passes through is attacked, or if either the king or that rook has moved previously.",
    example:
      "After 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5, both sides can consider castling kingside. White plays O-O: king moves from e1 to g1, rook jumps from h1 to f1. The king is now tucked safely behind the kingside pawns, the rook is centralized, and both goals of king safety and rook development are achieved in one move.",
    whyItMatters:
      "Castling is one of the most important strategic decisions in the opening. Delay castling and your king stays in the center, vulnerable to attack along open files. Castle early and your king is safer while your rook becomes active.",
    faqs: [
      {
        q: "Can you castle if you're in check?",
        a: "No — you cannot castle while in check. You must first get out of check by another means (blocking, capturing, or moving the king). After escaping check, if the king and the relevant rook haven't moved, castling is still possible.",
      },
      {
        q: "Can you castle if a square your king passes through is attacked?",
        a: "No — the king cannot pass through a square that is under attack when castling. For kingside castling, f1 and g1 must both be unattacked. For queenside castling, c1 and d1 must both be unattacked (the rook may pass through an attacked square).",
      },
      {
        q: "What is castling into/toward attack?",
        a: "Castling 'into attack' means castling to the side where the opponent already has attacking forces — generally a mistake unless it's a long-term strategic plan. 'Castling toward the attack' means your opponent has already committed to a flank attack and you castle toward it, either to counterattack or to meet it head-on.",
      },
    ],
    related: ["en-passant", "stalemate", "king-safety", "check"],
  },
  {
    id: "promotion",
    term: "Promotion",
    category: "special-moves",
    tagline:
      "Promotion is when a pawn reaches the 8th rank (or 1st rank for Black) and is converted into any piece — almost always a queen.",
    definition:
      "Promotion (or queening) occurs when a pawn advances to the final rank — the 8th rank for White, the 1st rank for Black. The pawn is then removed and replaced with any piece of the same color: queen, rook, bishop, or knight. Promoting to a queen is almost always the best choice. Underpromotion (to a rook, bishop, or knight) is occasionally the correct move when promoting to a queen would cause stalemate or a knight promotion delivers check or fork.",
    example:
      "White's passed pawn on d7 advances to d8. White promotes to a queen: d8=Q. Black is now facing a queen ahead in material and will likely resign shortly, as White can checkmate relatively quickly with the extra queen.",
    whyItMatters:
      "Creating a passed pawn and promoting it is one of the most common winning plans in endgames. Understanding how close a passed pawn is to promotion — and how to support it with your king — is essential endgame technique.",
    faqs: [
      {
        q: "Can you promote to the same piece you already have?",
        a: "Yes — you can have two or more queens, rooks, bishops, or knights on the board at the same time via promotion. There is no rule limiting you to one of each.",
      },
      {
        q: "What is underpromotion?",
        a: "Underpromotion is promoting to a rook, bishop, or knight instead of a queen. It's occasionally correct when queening would deliver stalemate (losing the game) or when a knight promotion delivers an immediate fork or checkmate.",
      },
      {
        q: "What is the 'square rule' for passed pawns?",
        a: "The square rule (or 'rule of the square') is an endgame technique: draw a diagonal from the pawn to the promotion square — if the opposing king can step inside this 'square' on its move, it can catch the pawn. If it can't, the pawn promotes without piece help.",
      },
    ],
    related: ["passed-pawn", "en-passant", "endgame", "stalemate"],
  },
  {
    id: "stalemate",
    term: "Stalemate",
    category: "special-moves",
    tagline:
      "Stalemate is a draw that occurs when the player to move has no legal moves but is not in check — a lifesaving resource for the losing side.",
    definition:
      "Stalemate is a draw condition: it occurs when a player has no legal move on their turn and their king is not in check. The game ends immediately as a draw. Stalemate is neither a win nor a loss for either side. It is one of the most common ways for a losing side to escape — and one of the most common mistakes for winning players to hand away a won game.",
    example:
      "White has a queen and king vs Black's lone king. White's queen moves to a6. Black has only the king on a8. White plays Qa7? — not checkmate, but stalemate! The Black king has no legal moves (a8 is the only square, and a7 is occupied by the queen). The game is a draw.",
    whyItMatters:
      "Stalemate costs winning players countless points. Always verify checkmate before moving: ask 'does my opponent have any legal move?' before each candidate move in a won ending. At the same time, stalemate tricks are a brilliant defensive resource — learn them to save seemingly hopeless endgames.",
    faqs: [
      {
        q: "Is stalemate a win for the player not in check?",
        a: "No — stalemate is a draw for both players. Neither side wins. The game ends immediately.",
      },
      {
        q: "Can you stalemate a king at the start of the game?",
        a: "Technically stalemate can occur at any point if both conditions are met (player to move, no legal moves, king not in check). In practice it happens most often in endgames when one side has been stripped of most pieces.",
      },
      {
        q: "What is a stalemate trap?",
        a: "A stalemate trap is a deliberate strategy by the losing side to reduce their pieces and maneuver the king or remaining pieces into a position where stalemate becomes possible. A classic example is queen vs rook endgames where the losing side aims for stalemate to draw.",
      },
    ],
    related: ["checkmate", "promotion", "castling", "endgame"],
  },

  // ── CONCEPTS ──────────────────────────────────────────────────
  {
    id: "zugzwang",
    term: "Zugzwang",
    category: "concepts",
    tagline:
      "Zugzwang is a situation where the obligation to move is a disadvantage — any move worsens your position, but you must move anyway.",
    definition:
      "Zugzwang (German for 'compulsion to move') is a situation where any move a player makes worsens their own position, but they must move. In a normal position, having more moves is an advantage. In zugzwang, the player would prefer to 'pass' but cannot. It occurs most commonly in endgames but can also arise in the middlegame. Mutual zugzwang is the rare case where whichever player has to move loses.",
    example:
      "White king on e4, White pawn on e5, Black king on e7. It's Black's turn: any king move loses immediately to the advancing pawn. It's Black's misfortune to move — if it were White's turn, the position would be a draw. Black is in zugzwang.",
    whyItMatters:
      "Zugzwang is a critical endgame concept that explains why 'opposition' and 'triangulation' matter. Many king and pawn endgames are decided entirely by who is put in zugzwang. If you master zugzwang thinking, you'll win many endgames that others draw.",
    faqs: [
      {
        q: "Is zugzwang common in the middlegame?",
        a: "Zugzwang in the middlegame is called 'quasi-zugzwang' and is less absolute — it means that every move is unpleasant, not that every move loses immediately. True zugzwang (where any move loses) is predominantly an endgame phenomenon.",
      },
      {
        q: "What is the Immortal Zugzwang game?",
        a: "The most famous zugzwang game is Sämisch vs Nimzowitsch (1923). Nimzowitsch created a position where Sämisch was in such complete zugzwang that all of Sämisch's pieces were completely paralyzed and any move worsened his situation. It is called the 'Immortal Zugzwang Game'.",
      },
    ],
    related: ["opposition", "triangulation", "endgame", "tempo"],
  },
  {
    id: "tempo",
    term: "Tempo",
    category: "concepts",
    tagline:
      "A tempo is a single turn of play — gaining a tempo means forcing your opponent to waste a move, while losing a tempo means moving a piece twice when once would have sufficed.",
    definition:
      "A tempo (plural: tempi) is one unit of time in chess — essentially one move. 'Gaining a tempo' means making your opponent waste a move, giving you one extra move to develop, attack, or improve your position. 'Losing a tempo' means spending a move that accomplishes nothing useful — such as moving a piece twice in the opening when you could have developed a new piece. Tempo is especially critical in the opening and in tactical sequences.",
    example:
      "After 1.e4 e5 2.Nf3 Nc6 3.Bc4, White attacks the f7 pawn but Black plays 3...Nd4? instead of a useful developing move. White plays 4.Nxe5, threatening Qh5 winning material. Black spent a move that gained nothing; White gained a tempo by threatening something concrete.",
    whyItMatters:
      "In the opening, every move should develop a piece or improve your position. 'Moving a piece twice is losing a tempo' — and in sharp positions, one tempo can be the difference between winning and losing. In tactical sequences, a move that wins a tempo (by making a threat) often changes the whole picture.",
    faqs: [
      {
        q: "What does it mean to 'win a tempo' with a move?",
        a: "Winning a tempo means making a move that forces your opponent to react — ideally a check or strong threat — so that you get an 'extra' move compared to normal. If you give check and your opponent must move the king, you make your next move while your opponent has been 'forced' — you've gained a free tempo.",
      },
      {
        q: "What is a 'tempo move' in endgames?",
        a: "A tempo move in the endgame is a move that passes the obligation to move to your opponent, putting them in zugzwang. These are usually king moves that 'waste' time to change who has to move next.",
      },
    ],
    related: ["zugzwang", "initiative", "zwischenzug", "opposition"],
  },
  {
    id: "initiative",
    term: "Initiative",
    category: "concepts",
    tagline:
      "The initiative is the ability to make threats that must be answered — the player with the initiative dictates the pace and direction of play.",
    definition:
      "The initiative means your opponent is constantly reacting to your threats rather than pursuing their own plans. A player with the initiative makes one threat after another, forcing defensive responses. The initiative can be worth more than a pawn in sharp positions — a player who keeps the initiative can attack, while the player without it plays passively. The initiative can shift: making a move that gives your opponent counterplay transfers it.",
    example:
      "After a gambit sacrifice (White gives a pawn), Black has more material but White's pieces are more active. White attacks the king with consecutive threats: Ng5, Qh5, and Bxf7+. Black can only respond to each threat and never has time to consolidate the extra pawn. White has the initiative.",
    whyItMatters:
      "Playing for the initiative is often more effective than playing for material. An attacking player who keeps making threats can win without ever being objectively 'better' in engine evaluation. Conversely, giving up the initiative often means playing a long, unpleasant defense.",
    faqs: [
      {
        q: "How do you maintain the initiative?",
        a: "Keep making threats that force your opponent to respond. Don't stop to consolidate material if doing so lets the opponent regroup. Every move should either threaten something or significantly improve your piece placement while maintaining the pressure.",
      },
      {
        q: "When is it right to give up the initiative for material?",
        a: "When the material gain is large enough that the initiative runs dry — either the attacker runs out of threats or the defender successfully neutralizes the attack and consolidates. This calculation is one of the hardest in chess.",
      },
    ],
    related: ["tempo", "compensation", "attack", "zugzwang"],
  },
  {
    id: "prophylaxis",
    term: "Prophylaxis",
    category: "concepts",
    tagline:
      "Prophylaxis is the practice of anticipating and preventing your opponent's plans before they can be carried out.",
    definition:
      "Prophylaxis (from the Greek for 'prevention') is the chess habit of asking 'what is my opponent trying to do?' before making each move. A prophylactic move prevents the opponent's best plan rather than immediately pursuing your own. It is a hallmark of top-level strategic play — grandmasters like Karpov and Kramnik built entire careers on prophylactic thinking, preventing counterplay before it started.",
    example:
      "Black wants to use the outpost on d5. White prophylactically plays a4, preventing ...b5 which would support a future ...Nd5. By preemptively stopping the plan, White ensures that d5 is never occupied by a Black knight. Even though a4 doesn't threaten anything directly, it's a powerful prophylactic move.",
    whyItMatters:
      "Most players up to 1800 only think about their own plans. Adding prophylaxis — asking 'what is my opponent threatening?' on every move — is one of the biggest improvements any intermediate player can make. This single habit will save you from countless tactical oversights.",
    faqs: [
      {
        q: "Who is the greatest prophylactic player in chess history?",
        a: "Anatoly Karpov is widely considered the greatest prophylactic player. He often prevented his opponent's every plan so effectively that opponents found themselves paralyzed with nothing constructive to do.",
      },
      {
        q: "Is prophylaxis the same as playing defensively?",
        a: "Not exactly. Prophylaxis can be part of an aggressive plan — you prevent the opponent's counterplay so your own attack proceeds uninterrupted. It's more about awareness than passivity.",
      },
    ],
    related: ["tempo", "initiative", "outpost", "weak-square"],
  },
  {
    id: "opposition",
    term: "Opposition",
    category: "concepts",
    tagline:
      "Opposition is a key endgame concept where two kings face each other with one square between them — the player who does NOT have to move has the advantage.",
    definition:
      "Opposition occurs when the two kings are on the same rank, file, or diagonal with exactly one square between them, and it is the other player's turn to move. The player who does NOT have to move 'has the opposition' — meaning their opponent must step aside, giving up control of key squares. Opposition is critical in king and pawn endgames: it determines whether the king can advance or must give way.",
    example:
      "White king on e4, Black king on e6 — they face each other on the e-file with e5 between them. If it is Black's turn, White has the opposition. Black must step aside (to d6, f6, etc.), allowing White's king to advance to e5 and push the pawn to promotion.",
    whyItMatters:
      "Understanding opposition is the foundation of king and pawn endgame technique. Many seemingly drawn K+P endings are actually won or lost based entirely on whether the attacker can obtain the opposition. Without it, the king may never penetrate. With it, the king advances and promotes.",
    faqs: [
      {
        q: "What is distant opposition?",
        a: "Distant opposition is when two kings are on the same rank or file with an odd number of squares (more than one) between them. The same principle applies: the player not to move can maintain the opposition. Distant opposition is key to understanding Lucena and Philidor endgames.",
      },
      {
        q: "What is diagonal opposition?",
        a: "Diagonal opposition is when the kings face each other diagonally with one square between them. This form of opposition also matters in king maneuvers — maintaining diagonal opposition sometimes gives the same advantages as direct opposition.",
      },
    ],
    related: ["zugzwang", "triangulation", "tempo", "endgame"],
  },
  {
    id: "triangulation",
    term: "Triangulation",
    category: "concepts",
    tagline:
      "Triangulation is a king maneuver that 'wastes' a tempo to reach the same square but with the opponent now having to move — transferring zugzwang.",
    definition:
      "Triangulation is an endgame technique where a king moves in a triangle (three moves to return to the same square) to 'waste' one move and pass the obligation to move to the opponent. This only works when the opponent's king has a smaller area to maneuver (and therefore can't triangulate back). The result: the same position, but with the other side to move — often putting them in zugzwang.",
    example:
      "White king on e4, Black king on e6. If White plays directly, it results in a draw (Black matches White's moves). Instead, White triangulates: Ke3–d3–d4–e4 — three moves to return to e4. Black's king, restricted to fewer squares, cannot do the same. White now has the opposition and can break through.",
    whyItMatters:
      "Triangulation is one of the most profound endgame techniques. Games between experienced players are often decided by one side knowing how to triangulate and the other not. If you master it, you'll convert many K+P endgames that would otherwise be draws.",
    faqs: [
      {
        q: "When does triangulation NOT work?",
        a: "Triangulation fails when the opponent's king has as much room to maneuver as yours — they can triangulate back and restore the position. It also fails when the pawn structure prevents the king from taking the triangular path.",
      },
    ],
    related: ["opposition", "zugzwang", "tempo", "endgame"],
  },
  {
    id: "compensation",
    term: "Compensation",
    category: "concepts",
    tagline:
      "Compensation is the non-material advantage — initiative, activity, pawn structure, king safety — that offsets being down in material.",
    definition:
      "Compensation refers to positional or dynamic advantages that offset a material deficit. When a player sacrifices a pawn or piece, they gain compensation in the form of initiative, development, open lines, an attack, or a structural advantage. A sacrifice with sufficient compensation is sound; without it, the sacrifice is merely a blunder. Evaluating compensation accurately is one of the hardest skills at every level of chess.",
    example:
      "In the King's Gambit (1.e4 e5 2.f4 exf4), White gives a pawn for rapid development and open lines. The compensation is: active piece play, a half-open f-file, and attacking chances. Whether this is enough depends on Black's responses — but it's a genuine trade, not a blunder.",
    whyItMatters:
      "Fixating on material and ignoring compensation leads to passive, losing positions. The player who gave the piece often has all the fun; the player who's 'winning' in material plays the anxious defensive role. Learn to assess compensation to know when to sacrifice and when accepting a sacrifice is walking into trouble.",
    faqs: [
      {
        q: "How do computers evaluate compensation?",
        a: "Modern engines evaluate positions in centipawns — they estimate the equivalent material value of all advantages (space, king safety, pawn structure, piece activity) and convert it to a single number. A -0.5 evaluation for the side down a pawn means the engine considers the compensation almost sufficient.",
      },
    ],
    related: ["initiative", "sacrifice", "tempo", "pawn-structure"],
  },

  // ── ENDGAME ───────────────────────────────────────────────────
  {
    id: "lucena-position",
    term: "Lucena Position",
    category: "endgame",
    tagline:
      "The Lucena position is a winning rook and pawn endgame technique where the attacker 'builds a bridge' to shepherd the pawn to promotion.",
    definition:
      "The Lucena position is a fundamental won endgame where the attacker has a rook and pawn on the 7th rank, and the king is in front of the pawn cutting off the defending king. The winning technique is called 'building a bridge': the attacking rook cuts off the defending rook's checking distance, allowing the king to step forward and the pawn to promote. Every serious player must know this technique.",
    example:
      "White: king on f6, pawn on f7, rook on a7. Black: king on h8, rook on f1. White 'builds a bridge': 1.Re7! (cutting off checks) ...Rf2 2.Re4! (preparing the bridge) ...Rf1 3.Kf5! ...Rf2+ 4.Ke5! ...Rf1 5.Re1! Rxe1 6.f8=Q+. The rook blocked upper-rank checks to let the king escort the pawn forward.",
    whyItMatters:
      "Knowing the Lucena position can literally win games you'd otherwise draw. It is the most important standard technique in rook endgames and occurs regularly in professional games.",
    faqs: [
      {
        q: "What is the Philidor position?",
        a: "The Philidor position is the corresponding defensive technique — the drawing strategy for the weaker side in rook and pawn endgames. The defending rook stays on the 6th rank to cut off the attacking king, then falls behind the pawn to give checks from behind when the pawn advances.",
      },
    ],
    related: ["philidor-position", "endgame", "passed-pawn", "opposition"],
  },
  {
    id: "philidor-position",
    term: "Philidor Position",
    category: "endgame",
    tagline:
      "The Philidor position is the fundamental drawing technique in rook and pawn endgames — the defending rook holds from the 6th rank until the pawn advances, then checks from behind.",
    definition:
      "The Philidor position is the classic drawing technique for the weaker side in rook and pawn endgames. The defending rook occupies the 6th rank (blocking the attacking king's advance), and when the attacker's pawn is forced to advance to the 6th rank to make progress, the defending rook moves to behind the pawn and harrasses it with checks from the rear. Named after François-André Philidor (1749).",
    example:
      "Black: king on e8, rook on f6. White: king on e5, rook on a7, pawn on e6. Black's rook sits on f6, cutting off White's king. If White plays Kd6, Black plays Rf1 and starts checking from f5, f4, f3 — the king can never escape the perpetual, making it a draw.",
    whyItMatters:
      "Knowing the Philidor drawing technique saves games that appear lost. A rook and pawn vs rook ending is only won if the attacker reaches the Lucena position. The defender who correctly applies the Philidor technique will draw.",
    faqs: [
      {
        q: "Who was Philidor?",
        a: "François-André Philidor (1726–1795) was a French chess master and composer, considered the strongest player of his era. He wrote 'Analyse du Jeu des Échecs' (1749), which revolutionized chess theory with the famous quote: 'Pawns are the soul of chess.'",
      },
    ],
    related: ["lucena-position", "endgame", "opposition", "passed-pawn"],
  },

  // ── OPENINGS ──────────────────────────────────────────────────
  {
    id: "gambit",
    term: "Gambit",
    category: "openings",
    tagline:
      "A gambit is an opening sacrifice — usually a pawn — made in exchange for initiative, development, and attacking chances.",
    definition:
      "A gambit is an opening move or sequence where a player voluntarily sacrifices material (most commonly a pawn, occasionally a piece) in order to gain a positional advantage: rapid development, open lines, initiative, or an attacking position. If the opponent accepts the gambit, they take the material but may fall behind in development or face immediate danger. Famous gambits include the King's Gambit, Queen's Gambit, and Evan's Gambit.",
    example:
      "In the Queen's Gambit (1.d4 d5 2.c4), White offers the c4 pawn. If Black takes (2...dxc4), White gets extra space and open lines for rapid piece deployment. However, White can regain the pawn relatively easily, so the 'gambit' is partly illusory — but the positional benefits are real.",
    whyItMatters:
      "Understanding gambits helps you evaluate sacrifices throughout the game — not just in openings. The principles of compensation, initiative, and development apply everywhere. Playing gambits is also an excellent way to learn attacking chess.",
    faqs: [
      {
        q: "Is the Queen's Gambit really a gambit?",
        a: "The Queen's Gambit (1.d4 d5 2.c4) is technically a gambit, but it's sometimes called a 'false gambit' because the c4 pawn can almost always be regained. The term 'gambit' still applies, but the positional goals are different from sharp gambits like the King's Gambit.",
      },
      {
        q: "Should beginner players play gambits?",
        a: "Gambits are excellent for beginners because they teach the value of development, initiative, and attacking patterns. The King's Gambit, Italian Game, and various Sicilian variations are enjoyable and instructive gambits for lower-rated players.",
      },
    ],
    related: ["compensation", "initiative", "tempo", "sacrifice"],
  },
  {
    id: "fianchetto",
    term: "Fianchetto",
    category: "openings",
    tagline:
      "A fianchetto develops a bishop to b2 or g2 (or b7/g7 for Black), placing it on a long diagonal where it exerts lasting pressure.",
    definition:
      "A fianchetto (Italian for 'little flank') is the development of a bishop to b2 or g2 for White (b7 or g7 for Black), achieved by first advancing the corresponding knight pawn (b2 pawn to b3 or g2 pawn to g3). The bishop sits on an open long diagonal, exerting pressure across the entire board. The King's Indian Defense, Grünfeld, Catalan, and King's Indian Attack all feature fianchettoed bishops.",
    example:
      "White plays 1.Nf3 2.g3 3.Bg2 4.O-O — a standard fianchetto setup. The bishop on g2 controls the long diagonal from g2 to a8, pressuring Black's queenside and influencing the center. This bishop is sometimes called the 'Catalan bishop.'",
    whyItMatters:
      "A fianchettoed bishop is one of the most powerful long-term positional weapons. It can influence the game from g2 all the way to a8, often exerting pressure for 30+ moves. Learning to use and fight fianchettoed bishops is essential for any improving player.",
    faqs: [
      {
        q: "What is a 'bad bishop' in a fianchetto?",
        a: "A fianchettoed bishop becomes a 'bad bishop' if your own pawns land on the same color as it, blocking its diagonals and reducing its activity. In these cases, the opponent's bishop often dominates the color complex the fianchettoed bishop once controlled.",
      },
      {
        q: "Should you attack the fianchetto by playing h5-h6-h7?",
        a: "This is a common attacking plan: push the h-pawn to attack the pawn in front of the fianchettoed bishop (g6 or g3). This undermines the bishop's pawn cover and can open the h-file for a rook attack. It's an effective plan when the center is closed.",
      },
    ],
    related: ["bishop-pair", "pawn-structure", "outpost", "gambit"],
  },
  {
    id: "sicilian-defense",
    term: "Sicilian Defense",
    category: "openings",
    tagline:
      "The Sicilian Defense (1.e4 c5) is the most popular chess opening at all levels — Black fights for the center asymmetrically, creating imbalanced positions rich in counterplay.",
    definition:
      "The Sicilian Defense begins with 1.e4 c5. Instead of symmetrically contesting the center with 1...e5, Black uses the c5 pawn to control d4 while keeping the position asymmetrical. White typically gets a spatial advantage and attacking chances on the kingside; Black gets a queenside majority and counterplay. The resulting positions are rich in imbalance, making the Sicilian the most played and extensively analyzed opening in chess history.",
    example:
      "After 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 — the Sicilian Najdorf, Bobby Fischer's and Kasparov's favorite defense. White will launch a kingside attack; Black will counterattack on the queenside. Complex, rich chess full of tactical and strategic depth.",
    whyItMatters:
      "Understanding why the Sicilian is the most popular defense — asymmetry, counterplay, imbalance — teaches you the core principle of fighting chess. If you only play symmetrical or equalizing defenses, you miss the fun.",
    faqs: [
      {
        q: "Why is the Sicilian Defense so popular?",
        a: "The Sicilian is the most popular response to 1.e4 because it fights for the win from move one. Black avoids the symmetrical 1...e5 positions and instead creates an imbalanced structure where both sides have winning chances — ideal for Black, who needs to win as a lower-rated player or tournament leader.",
      },
      {
        q: "What are the main Sicilian variations?",
        a: "The main Sicilian variations include the Najdorf (5...a6), the Dragon (5...g6), the Scheveningen (5...e6), the Classical (5...Nc6), the Kan (5...a6 and ...e6 setup), and dozens more. Each has its own character and theory.",
      },
    ],
    related: ["gambit", "fianchetto", "open-file", "initiative"],
  },
  {
    id: "ruy-lopez",
    term: "Ruy López",
    category: "openings",
    tagline:
      "The Ruy López (1.e4 e5 2.Nf3 Nc6 3.Bb5) is the most classical and heavily analyzed king's pawn opening — White pressures the e5 pawn and fights for central control.",
    definition:
      "The Ruy López (also called the Spanish Opening) begins with 1.e4 e5 2.Nf3 Nc6 3.Bb5. White's bishop pins or pressures the knight that defends e5, aiming to undermine Black's central pawn. Black has many responses: the Berlin Defense (3...Nf6), the Morphy Defense (3...a6), the Closed variation (3...a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 O-O), and many more. It is the most played and studied opening sequence in chess history.",
    example:
      "After 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3, the classic Closed Ruy López position is reached. Both sides complete development and then the real strategic battle begins — White will typically try to establish a central pawn majority, while Black counterattacks and tries to open the position.",
    whyItMatters:
      "The Ruy López teaches classical opening principles — controlling the center, rapid development, king safety. Most of the great world champions (Morphy, Capablanca, Fischer, Kasparov, Carlsen) played it extensively. Understanding it gives insight into all classical chess.",
    faqs: [
      {
        q: "Is the Ruy López still played at the top level?",
        a: "Yes — the Ruy López remains one of the most played openings at the grandmaster level, alongside the Sicilian. The Berlin Defense especially surged in popularity after Kramnik used it to defeat Kasparov in 2000.",
      },
      {
        q: "Who was Ruy López?",
        a: "Ruy López de Segura was a 16th-century Spanish bishop and chess master who wrote one of the earliest chess treatises, 'Libro de la invención liberal y arte del juego del ajedrez' (1561), in which he analyzed this opening.",
      },
    ],
    related: ["gambit", "sicilian-defense", "fianchetto", "pawn-structure"],
  },

  // ── GAME PHASES ───────────────────────────────────────────────
  {
    id: "check",
    term: "Check",
    category: "game-phases",
    tagline:
      "Check is when the king is directly attacked by an enemy piece and must be rescued immediately — it is not checkmate until escape is impossible.",
    definition:
      "Check is when a king is attacked by one or more enemy pieces. A player in check must immediately resolve it by moving the king, blocking the attack, or capturing the attacking piece. Failing to resolve check is an illegal move. Check is distinct from checkmate: in check, escape is possible; in checkmate, no escape remains and the game ends.",
    example:
      "White plays Qh5+. The Black king on e8 is now in check from the queen. Black must respond: Ke7 (escape), blocking with a piece (Qf7), or capturing the queen if possible. Black cannot ignore the check and play any other move.",
    whyItMatters:
      "Understanding check is fundamental to chess. Checks are often used as forcing moves in combinations — they restrict the opponent to a single response, allowing the attacker to control the tempo. Many combinations work because only one square is safe for the king after a check.",
    faqs: [
      {
        q: "What is perpetual check?",
        a: "Perpetual check is when one player can give an endless series of checks that the other player cannot escape without risking greater losses. The result is typically a draw by repetition — both players repeat the same position three times.",
      },
      {
        q: "Can a king capture a piece to get out of check?",
        a: "Yes — if capturing the attacking piece moves the king to a square not attacked by any other enemy piece, it is a legal way to escape check.",
      },
    ],
    related: ["checkmate", "double-check", "castling", "stalemate"],
  },
  {
    id: "checkmate",
    term: "Checkmate",
    category: "game-phases",
    tagline:
      "Checkmate is the end of the game — the king is in check with no legal move to escape, and the player who delivers it wins.",
    definition:
      "Checkmate (or simply 'mate') is the position where a player's king is in check and there is no legal move to escape: the king cannot move to any safe square, no piece can block the check, and the attacking piece cannot be captured. Checkmate ends the game immediately — the player whose king is mated loses. The goal of chess is to deliver checkmate.",
    example:
      "Scholar's Mate: after 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6? 4.Qxf7#. The White queen on f7 is supported by the bishop on c4 and puts Black's king in check. No Black piece can block or capture, and the king has no safe square — it's checkmate.",
    whyItMatters:
      "Every tactic, strategy, and endgame technique in chess ultimately serves the goal of delivering checkmate or forcing your opponent to resign before it. Studying famous checkmate patterns — back rank mate, smothered mate, Scholar's Mate — helps you recognize them instantly in your own games.",
    faqs: [
      {
        q: "What is the fastest possible checkmate?",
        a: "The Fool's Mate (2.Qh4# after 1.f3 e5 2.g4) finishes the game in two moves — the fastest possible checkmate in chess. Scholar's Mate (4 moves) is the quickest practical checkmate.",
      },
      {
        q: "What is a smothered mate?",
        a: "A smothered mate is checkmate delivered by a knight against a king that has been hemmed in (smothered) by its own pieces. The classic smothered mate pattern usually involves a knight on f7 or c7 delivering check against a king trapped by its own rook and pawns.",
      },
    ],
    related: ["check", "stalemate", "double-check", "fork"],
  },
  {
    id: "endgame",
    term: "Endgame",
    category: "game-phases",
    tagline:
      "The endgame is the final phase of the chess game — when queens (and often other pieces) are off the board and king activity becomes decisive.",
    definition:
      "The endgame is the phase of the chess game where relatively few pieces remain — typically after most heavy pieces (queens and often rooks) have been exchanged. In the endgame, the king becomes an active piece rather than a vulnerability, and small advantages (a single extra pawn, a better-placed king, the Lucena/Philidor technique) become decisive. Famous endgame categories include king and pawn endgames, rook endgames, and opposite-colored bishop endings.",
    example:
      "After queen and all rooks are exchanged, White has a bishop and three pawns vs Black's bishop and three pawns. The endgame has begun: king activation, opposition, and passed pawn creation become the primary plans. A slight structural advantage (like a passed a-pawn or a better-placed king) is often enough to win.",
    whyItMatters:
      "Most games between beginners end by blunder in the middlegame, but improving players increasingly play to the endgame — where endgame technique determines the result. Studying endgames is the highest-ROI investment for any player below 2000.",
    faqs: [
      {
        q: "What is the most important endgame to learn first?",
        a: "King and pawn endgames are the foundation — they teach opposition, triangulation, and passed pawn principles. After that, rook endgames (especially the Philidor and Lucena positions) are the most practically important, as rook endings occur in roughly 40% of all games.",
      },
    ],
    related: ["opposition", "zugzwang", "promotion", "passed-pawn"],
  },
  {
    id: "middlegame",
    term: "Middlegame",
    category: "game-phases",
    tagline:
      "The middlegame is the most complex phase of chess — it begins after the opening and ends when enough pieces have been exchanged to enter the endgame.",
    definition:
      "The middlegame is the phase following the opening, characterized by complex piece interaction, tactical battles, and strategic maneuvering. Both players have typically completed development, castled their kings, and connected their rooks. Plans become more concrete — attacking the king, creating passed pawns, exploiting structural weaknesses, or launching coordinated piece attacks. The middlegame ends when sufficient material has been exchanged to enter a simpler endgame.",
    example:
      "After a Sicilian opening, White launches a kingside attack with pawns and pieces while Black generates queenside counterplay. The middlegame involves planning, calculating tactical sequences, and deciding when to transition to the endgame — all at the same time.",
    whyItMatters:
      "The middlegame is where most games are decided — by tactical blunders, missed combinations, or strategic planning failures. Pattern recognition (knowing common tactical motifs, mating patterns, and positional themes) is the main tool for improving in the middlegame.",
    faqs: [
      {
        q: "How do you improve in the middlegame?",
        a: "Solve lots of tactics puzzles — pattern recognition transfers directly to middlegame play. Study grandmaster games to understand strategic plans in typical pawn structures. Analysis of your own games is the single most effective method.",
      },
    ],
    related: ["endgame", "tactic", "pawn-structure", "initiative"],
  },
  {
    id: "tactic",
    term: "Tactic",
    category: "game-phases",
    tagline:
      "A tactic is a sequence of forced moves that immediately wins material or delivers checkmate — the short-term 'violence' of chess.",
    definition:
      "A tactic is a calculated, forcing sequence of moves that achieves an immediate concrete goal — usually winning material, delivering checkmate, or at minimum improving the position dramatically in a single sequence. Tactics rely on forcing moves (checks, captures, threats) that limit the opponent's replies. Common tactical motifs include the fork, pin, skewer, discovered attack, and double check. Tactics are the 'short-term' element of chess, as opposed to strategy (the long-term plan).",
    example:
      "White plays Rxd8+. If Black recaptures (Rxd8), White plays Rxd8# — checkmate. This two-move 'tactic' ends the game immediately. Every move in the sequence is forced: Black had to capture the rook, and then the second rook delivered mate.",
    whyItMatters:
      "The fastest way to improve at chess (especially below 1800) is to do daily tactics puzzles. Pattern recognition is a genuine skill that transfers to real games — positions you've seen in puzzles become instantly recognizable at the board.",
    faqs: [
      {
        q: "What is the difference between a tactic and a strategy?",
        a: "Tactics are concrete, short-term, and forcing — they win material or give checkmate in a fixed number of moves. Strategy is long-term, non-forcing, and plan-based — it involves improving piece placement, creating weaknesses, and building advantages that pay off over many moves.",
      },
      {
        q: "How often should I practice tactics?",
        a: "Daily, if possible. Even 10–15 minutes a day of focused puzzle solving produces measurable improvement within weeks. Consistent practice outperforms occasional marathon sessions.",
      },
    ],
    related: ["fork", "pin", "skewer", "discovered-attack"],
  },
  {
    id: "sacrifice",
    term: "Sacrifice",
    category: "concepts",
    tagline:
      "A sacrifice is a deliberate decision to give up material — a pawn, piece, or even the queen — in exchange for a positional, dynamic, or attacking advantage.",
    definition:
      "A sacrifice is a voluntary offer of material with the expectation of gaining a greater benefit: initiative, an attack on the king, a decisive positional advantage, or checkmate. Sacrifices range from pawn gambits in the opening to spectacular queen sacrifices in the middlegame. A sacrifice is 'sound' if the compensation is objectively sufficient; 'speculative' if it relies on practical complications rather than clear calculation. Famous sacrifices — Tal's piece sacs, Kasparov's queen sacrifices — are the most celebrated moments in chess history.",
    example:
      "Kasparov vs Topalov 1999: White sacrifices a rook in spectacular fashion — Rxd4! — to expose the Black king. The combination involves a series of forcing moves and concludes with a stunning king march. This 'Immortal Game' is studied as a masterclass in sacrificial attacking chess.",
    whyItMatters:
      "Learning when to sacrifice takes chess from rule-following to real creativity. The question 'what can I give up here to get something more important?' unlocks combinations invisible to material-counting players. Train your ability to evaluate compensation and your sacrificial game will improve.",
    faqs: [
      {
        q: "What is a positional sacrifice?",
        a: "A positional sacrifice is one where the compensation is not immediate attacking threats but long-term strategic factors: a powerful pawn center, a dominant piece on an outpost, or the elimination of the opponent's best defensive piece. These are harder to evaluate than tactical sacrifices.",
      },
      {
        q: "What is a pseudo-sacrifice?",
        a: "A pseudo-sacrifice is a temporary material sacrifice where the material is recaptured within a few moves — the 'gift' was only on loan. A fork that wins a piece back is technically a pseudo-sacrifice in some contexts.",
      },
    ],
    related: ["compensation", "gambit", "initiative", "tactic"],
  },
  {
    id: "battery",
    term: "Battery",
    category: "tactics",
    tagline:
      "A battery is when two major pieces (two rooks, queen and rook, or queen and bishop) are lined up on the same file, rank, or diagonal — doubling their attacking power.",
    definition:
      "A battery is a formation where two pieces of the same type (rooks, or a queen with a rook or bishop) are aligned on the same rank, file, or diagonal. The pieces support and reinforce each other's attacks — often overwhelming a single defending piece. Doubled rooks on an open file, a queen and rook on the 7th rank, or a queen and bishop on a long diagonal are all batteries. Batteries are fundamental to rook attack, siege of the 7th rank, and diagonal pressure.",
    example:
      "White doubles rooks on the d-file (Rook on d1, Rook on d2). The d-file is open. Black's rook on d8 cannot hold: if Black's rook trades, White's second rook takes over the file and penetrates to d7 or d8. The battery overwhelms the single defender.",
    whyItMatters:
      "Understanding batteries helps you maximize the power of your heavy pieces. Don't leave rooks on separate files when an open file exists — double them, create the battery, and dominate.",
    faqs: [
      {
        q: "What is a queen-bishop battery?",
        a: "A queen-bishop battery on a diagonal is a powerful attacking formation — the bishop reinforces the queen along a diagonal, creating threats that can be hard to defend. The most famous example is the Bishops Battery in the two-bishop endgame or in King's Indian-style attacks.",
      },
    ],
    related: ["open-file", "x-ray", "pin", "discovered-attack"],
  },
  {
    id: "elo",
    term: "Elo Rating",
    category: "concepts",
    tagline:
      "The Elo rating system is the standard way to measure chess strength — a number that rises when you beat stronger players and falls when you lose to weaker ones.",
    definition:
      "The Elo rating system, developed by Arpad Elo in the 1960s, assigns each player a numerical rating that reflects their relative strength. When you beat a higher-rated player, you gain more points; beats against lower-rated players earn fewer. The system is self-correcting: as your true strength improves, your rating converges on the correct number over many games. FIDE uses it for classical chess; online platforms have their own adapted versions.",
    example:
      "A player rated 1500 beats someone rated 1700. The rating difference suggests they were expected to lose — so the 1500 gains more points than they would for beating another 1500. The expected score formula means big upsets yield big rating gains.",
    whyItMatters:
      "Your rating is a useful (though imperfect) measure of progress. Focus on improvement, not rating — but the rating is a convenient benchmark for which openings, tactics, and endgame concepts to study for your current level.",
    faqs: [
      {
        q: "What is a good chess rating?",
        a: "Beginner: under 800. Intermediate: 800–1400. Club player: 1400–1800. Strong club player: 1800–2000. Expert: 2000–2200. Candidate Master: 2200+. International Master: 2400+. Grandmaster: 2500+. The world elite play above 2700.",
      },
      {
        q: "Are online ratings the same as FIDE ratings?",
        a: "No — online ratings (Chess.com, Lichess) are calibrated differently and tend to be higher than equivalent FIDE ratings. A Chess.com 1500 rapid rating is typically closer to 1000–1100 FIDE. Lichess ratings are often closer to FIDE than Chess.com ratings.",
      },
    ],
    related: ["tactic", "endgame", "compensation", "initiative"],
  },
];
