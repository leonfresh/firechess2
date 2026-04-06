/**
 * Endgame Guides — curated library of essential endgame concepts.
 *
 * Each guide covers:
 *  - Core theory and principles
 *  - Key positions (FEN)
 *  - Techniques and patterns
 *  - Common mistakes
 *  - SEO-oriented FAQ
 */

export type EndgameGuide = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  material: string;
  keyPrinciples: string[];
  techniques: string[];
  commonMistakes: string[];
  /** Featured FEN example */
  exampleFen: string;
  exampleDescription: string;
  faqs: { q: string; a: string }[];
};

export const ENDGAME_GUIDES: EndgameGuide[] = [
  /* ─────────────────────── KING & PAWN ──────────────────────────────── */
  {
    id: "king-pawn",
    name: "King & Pawn Endgames",
    tagline:
      "Master the cornerstone of all endgames — king activity decides everything.",
    description:
      "King and pawn endgames form the foundation of all endgame theory. Unlike middle-game play where the king hides, in the endgame the king becomes a powerful piece that must actively support passed pawns and fight for key squares. The concepts learned here — opposition, key squares, pawn breakthroughs — apply in virtually every type of endgame.",
    difficulty: "beginner",
    material: "Kings + Pawns",
    keyPrinciples: [
      "The king is a fighting piece in the endgame — centralize it immediately",
      "Opposition: the king directly facing the other king with one square in between. The side that does NOT have the move has the opposition",
      "Key squares: squares that, if the attacker's king reaches, guarantee pawn promotion regardless of the defender's response",
      "A passed pawn is extremely valuable — its advance must be stopped while your king supports its own",
      "The rule of the square: a king can catch a passed pawn if it can enter the 'square' formed by the pawn's path",
    ],
    techniques: [
      "Gaining the opposition to push the defending king back",
      "Triangulation: wasting a move to give the opponent the unwanted opposition",
      "Using zugzwang to force the defender into a losing position",
      "Breakthrough combinations: sacrificing multiple pawns to create an unstoppable passer",
      "The 'key squares' technique to determine whether a king-pawn endgame is won or drawn",
    ],
    commonMistakes: [
      "Keeping the king passive while the opponent's king invades — activate the king immediately",
      "Missing zugzwang: a position where the side to move is at a disadvantage",
      "Miscalculating the 'rule of the square' and allowing an unstoppable passed pawn",
      "Moving a pawn when a king move was better — unnecessary pawn moves can create weaknesses",
      "Not recognizing drawn fortress positions with a rook's pawn and wrong-colored bishop",
    ],
    exampleFen: "8/8/8/4k3/4P3/4K3/8/8 w - - 0 1",
    exampleDescription:
      "White to move wins with Kd4! (not e5). White takes the key squares in front of the pawn — d5, e5, f5 are the key squares for an e-pawn. With optimal play, the white king leads the pawn to promotion. This illustrates the critical importance of king placement, not just pawn pushes.",
    faqs: [
      {
        q: "What are key squares in king and pawn endgames?",
        a: "Key squares are specific squares that, if the attacking king can reach them, guarantee pawn promotion no matter how the defending king responds. For a pawn on e4, the key squares are d6, e6, and f6. For edge pawns (a or h file), the key squares are different and these endgames are often drawn.",
      },
      {
        q: "What is the opposition in chess endgames?",
        a: "Opposition is when two kings face each other with exactly one square between them. The king that does NOT have the move is said to 'have the opposition' and can force the opposing king to yield ground. Direct opposition (same file or rank), diagonal opposition, and distant opposition are all important concepts.",
      },
      {
        q: "When is a king and pawn endgame drawn?",
        a: "A king and pawn endgame is typically drawn when the defending king can reach the key squares in front of the pawn, or with a rook's pawn (a or h file) where the defending king can reach the corner the pawn promotes on. Some fortress positions are also drawn despite material imbalance.",
      },
      {
        q: "What is zugzwang in pawn endgames?",
        a: "Zugzwang is when any move a side makes worsens their position, but they must move (you can't pass in chess). In king-pawn endgames, zugzwang arises frequently — the side with the move is forced to yield the opposition or step off a key square.",
      },
      {
        q: "How important are king and pawn endgames?",
        a: "They are the most important endgame type. GM Yuri Averbakh said 'A player who cannot handle king-pawn endgames cannot play chess.' The concepts transfer to all other endgames — rooks, bishops, knights all have king-pawn endgame foundations.",
      },
    ],
  },

  /* ──────────────────────── ROOK ENDGAMES ───────────────────────────── */
  {
    id: "rook",
    name: "Rook Endgames",
    tagline:
      "Rook endgames are the most common — master Lucena and Philidor to win and draw.",
    description:
      "Rook endgames are by far the most frequently occurring endgame in practice — approximately a third of all games end in rook endgames. They are also notoriously difficult, full of subtle nuances. The two essential positions every player must know are the Lucena position (how to win with a rook and extra pawn) and the Philidor position (how to draw without the pawn). GM Siegbert Tarrasch said 'All rook endgames are drawn' — that's an exaggeration, but it shows how common defensive resources are.",
    difficulty: "intermediate",
    material: "Rooks + Kings + Pawns",
    keyPrinciples: [
      "The rook belongs behind passed pawns — both yours and the opponent's (Tarrasch's rule)",
      "Active rook: a passive rook is a liability; cut the king off along a rank or file",
      "Lucena position: the winning technique — 'building a bridge' to shield the king from checks",
      "Philidor position: the drawing technique — keep the rook on the 6th rank until the pawn advances, then shift to the back rank",
      "King activity: in rook endgames, an active king is often worth more than a pawn",
    ],
    techniques: [
      "Building the bridge in the Lucena position to escort the pawn to promotion",
      "Philidor's defensive position on the 6th rank to achieve a draw",
      "Cutting off the king with a rook — limiting the defending king to fewer files",
      "The 'back rank check' method to gradually advance a pawn under rook protection",
      "Luring the opposing rook away from critical defense with back-rank checks",
    ],
    commonMistakes: [
      "Placing the rook passively in front of your own pawn instead of behind it",
      "Not knowing the Lucena and Philidor positions — these are mandatory knowledge",
      "Letting the opposing king get in front of your passed pawn — cut it off early",
      "Allowing perpetual checks: when you have extra material but your king has no shelter from rook checks",
      "Rushing to push the pawn instead of improving the king and rook coordination first",
    ],
    exampleFen: "1K1k4/1P6/8/8/8/8/r7/R7 w - - 0 1",
    exampleDescription:
      "This is the simplified Lucena building block: White needs to shield the king from checks to promote the pawn. The technique involves moving the rook to cut off checks — 'building a bridge' by placing the rook on the 4th rank to shield. This is the foundational winning technique every player must master.",
    faqs: [
      {
        q: "What is the Lucena position in chess?",
        a: "The Lucena position is the fundamental winning position in rook endgames with an extra pawn: the king has crossed to the sixth rank in front of the pawn, and the pawn is on the 7th rank. The winning technique involves 'building a bridge' — positioning the rook to block checks and shepherd the pawn to queening.",
      },
      {
        q: "What is the Philidor position?",
        a: "The Philidor position is the fundamental drawing technique in rook endgames: the defending side keeps its rook on the 6th rank (the 3rd rank from the opponent) to restrict the advancing king. When the pawn advances to the 6th rank, the rook switches to the back rank for perpetual checks.",
      },
      {
        q: "Are all rook endgames drawn?",
        a: "No — Tarrasch's famous quote overstates it. But rook endgames do have more drawing resources than other endgames. The Philidor defense, perpetual checks, and fortress positions give the defender many survival options. Precise technique is required to win — even with a pawn up.",
      },
      {
        q: "Where should I put my rook in pawn endgames?",
        a: "Behind passed pawns — both yours and your opponent's. Tarrasch's rule: 'Put your rook behind the passed pawn.' This gives your rook maximum activity as the pawn advances, and denies the same to the opponent.",
      },
      {
        q: "How do I stop perpetual checks in a rook endgame?",
        a: "Keep your king sheltered behind pawns or advance it to a position where it's shielded from checks. The 'building a bridge' technique in the Lucena position specifically solves this problem — the rook is used to block check from the side.",
      },
    ],
  },

  /* ──────────────────── BISHOP VS KNIGHT ────────────────────────────── */
  {
    id: "bishop-vs-knight",
    name: "Bishop vs Knight",
    tagline:
      "Open positions favor the bishop — closed positions empower the knight.",
    description:
      "The bishop vs knight question is one of chess's most intriguing imbalances. Neither piece is universally better — the position decides. Bishops excel in open positions with pawn chains on both sides of the board where long diagonals grant them sweeping power. Knights thrive in closed, fortified positions where they can reach outpost squares and the bishop's diagonals are blocked. Understanding this imbalance helps you make strategic decisions throughout the game.",
    difficulty: "intermediate",
    material: "Bishop vs Knight (with Pawns)",
    keyPrinciples: [
      "Bishops are stronger in open positions and when pawns are on both wings",
      "Knights are stronger in closed positions and in 'octopus' outpost squares unreachable by opponent's pawns",
      "Two bishops (the bishop pair) are considered a lasting strategic advantage in most open positions",
      "A bishop is 'bad' when its own pawns are fixed on the same color as the bishop — the pawns block its activity",
      "Knights can reach any square in any number of moves, but need time — bishops can shift diagonals quickly",
    ],
    techniques: [
      "Creating outpost squares for your knight — squares where the knight cannot be driven away by pawns",
      "Exploiting the bad bishop: when your opponent's bishop is blocked by its own pawns, create pawn structures that keep it passive",
      "Using the bishop's long-range power to attack pawns on both sides of the board simultaneously",
      "In knight endings, the king's centralization is paramount — the king becomes the decisive attacker",
      "Converting bishop endings: place pawns on the opposite color from your bishop to make them 'passers' that the opponent's bishop cannot stop",
    ],
    commonMistakes: [
      "Not considering whether the pawn structure favors your bishop or your knight when planning trades",
      "Leaving your own pawns on the same color as your bishop — you create a 'passive' bishop",
      "Underestimating the knight's power in closed positions — it can be worth more than a bishop",
      "Believing the bishop is always better than the knight — it depends entirely on the position",
      "Not using the king aggressively in purely minor piece endings",
    ],
    exampleFen: "8/5p2/4p3/3pP3/3P1N2/8/8/3B2K1 w - - 0 1",
    exampleDescription:
      "This endgame demonstrates the classic imbalance: White has a bishop and knight vs Black's two pawns. The key questions are: is the d4 pawn a weakness (blocked by pawn)? Can the knight reach an outpost on e6? The strategic evaluation — not just piece counting — determines the outcome.",
    faqs: [
      {
        q: "Is a bishop better than a knight in chess?",
        a: "It depends entirely on the position. Bishops excel in open positions with pawn play on both wings of the board. Knights thrive in closed positions with secure outpost squares. Neither piece is universally superior.",
      },
      {
        q: "What is a bad bishop in chess?",
        a: "A bad bishop is one whose own pawns are fixed on the same color as the bishop, blocking its diagonals and making it a passive defensive piece. For example, if you have a light-squared bishop and all your pawns are on light squares, your bishop is restricted and 'bad'.",
      },
      {
        q: "What is an outpost square for a knight?",
        a: "An outpost is a square in the opponent's territory that cannot be attacked by an enemy pawn. A knight on an outpost is very powerful because it cannot be driven away — it sits there permanently, potentially dominating the position.",
      },
      {
        q: "What are two bishops worth?",
        a: "The 'bishop pair' (having both bishops while the opponent has a bishop and knight or two knights) is worth about half a pawn in open positions. In open positions, two bishops dominate because they cover all squares and long diagonals. In closed positions their advantage diminishes.",
      },
      {
        q: "How do I fight against the bishop pair?",
        a: "Close the position to limit the bishops' diagonals. Trade off one of the bishops to eliminate the pair. Place pawns on both colors to give one bishop a blocked diagonal. Create a strong knight outpost that dominates both bishops.",
      },
    ],
  },

  /* ─────────────────────── THE OPPOSITION ───────────────────────────── */
  {
    id: "opposition",
    name: "The Opposition",
    tagline:
      "Force the enemy king to retreat — the most fundamental endgame weapon.",
    description:
      "The opposition is arguably the most important single concept in all of endgame play. When two kings face each other with exactly one square between them, the king that does NOT have the move 'has the opposition' — it forces the opposing king to step aside. Mastering direct, diagonal, and distant opposition is the foundation of king-pawn endgame mastery, and the concept extends into more complex endgames as well.",
    difficulty: "beginner",
    material: "Kings (and Pawns)",
    keyPrinciples: [
      "Direct opposition: kings on the same file or rank with one square between them. The side NOT to move has the opposition and can advance",
      "Diagonal opposition: kings on the same diagonal with one square between corners",
      "Distant opposition: kings separated by more squares but still on the same file, rank, or diagonal",
      "The side with the opposition controls the approach — the opposing king must yield ground",
      "Triangulation: using three-square king maneuvers to 'waste' a move and transfer the opposition to the opponent",
    ],
    techniques: [
      "Claiming the direct opposition to force the king aside and advance your pawn",
      "Triangulation to gain the opposition when the king must move (only possible when a third triangle square exists)",
      "Recognizing distant opposition as a preparatory step before taking direct opposition",
      "Using the opposition in Rook pawn (a/h) endgames — they require precise opposition technique or they are drawn",
      "A-pawn and H-pawn endgames: the defender claims the corner; recognize when they succeed vs. when the attacking king outmaneuvers",
    ],
    commonMistakes: [
      "Advancing the pawn instead of using the king to gain ground — always use the king first",
      "Failing to see when the opponent has a triangulation resource — they may have a secret way to transfer the move",
      "Misjudging distant opposition and missing the winning move",
      "Overlooking the 'corner rule' in rook's pawn endgames — drawing fortress in the corner is very common",
    ],
    exampleFen: "8/8/3k4/3P4/3K4/8/8/8 w - - 0 1",
    exampleDescription:
      "White wants to push d5-d6-d7-d8 but needs the king to lead. With Kc4 (taking the opposition after Black's response), White's king marches to c6 or e6 (the key squares for a d-pawn) and the pawn promotes. If the kings are in direct opposition and it is Black's move, White wins; if White's move, the result depends on the exact position.",
    faqs: [
      {
        q: "What is the opposition in chess?",
        a: "The opposition is when two kings face each other with exactly one square between them. The player who does NOT have to move is said to 'hold the opposition' — their king stays firm while the other must step aside or yield ground.",
      },
      {
        q: "What is triangulation in chess?",
        a: "Triangulation is a three-move king maneuver used to 'waste' a move and give the opponent the opposition (i.e., the move). The king travels around three squares in a triangle shape, ending up on its starting square but with the move transferred. It only works when the defending king has less space and cannot mirror the triangulation.",
      },
      {
        q: "Does opposition matter in rook endgames?",
        a: "Opposition is most critical in king-pawn endgames. In rook endgames, other concepts (Philidor, Lucena, king activity) tend to dominate. However, in rook + pawn vs rook endgames, king placement — including opposition principles — is still relevant.",
      },
      {
        q: "How do I practice learning the opposition?",
        a: "Start with simple king-versus-king-and-pawn positions and manually work out who wins before checking with an engine. Try to figure out the key squares and the opposition without analysis assistance first, then verify. Repeated practice of these basic positions builds the intuition quickly.",
      },
    ],
  },

  /* ──────────────────────── QUEEN ENDGAMES ──────────────────────────── */
  {
    id: "queen",
    name: "Queen Endgames",
    tagline:
      "The most dynamic endgame — queen vs pawn races and perpetual checks.",
    description:
      "Queen endgames are among the most complex and dynamic in chess. The queen's enormous range means positions change character instantly with each move. Queen vs pawn endgames, queen + pawn endgames, and queen vs rook are all crucial theoretical areas. Unlike rook endgames, queen endings are frequently decided by perpetual checks, and converting a material advantage requires precise calculation to avoid drawing traps.",
    difficulty: "advanced",
    material: "Queen + Kings (± Pawns)",
    keyPrinciples: [
      "Queens are extremely powerful but perpetual check defense is always available for the weaker side — watch for it",
      "A queen alone almost always draws against a rook — the defending rook can set up perpetual check stalemate defenses",
      "Queen vs pawn on the 7th rank: won except when the pawn is on a, c, or f file (where stalemate traps exist)",
      "In queen endgames, king safety matters enormously — the king can be perpetually chased",
      "Centralized queens are hard to stop — a queen on d5 or e5 dominates the board",
    ],
    techniques: [
      "Queen vs pawn technique: use queen checks to deflect then approach with the king",
      "Avoiding perpetual check: keep your king sheltered near a pawn wall",
      "Queen + pawn vs queen: use the queen to shield the king from checks while advancing the pawn",
      "The queen vs rook draw: understanding when the rook can reach safety vs when the queen corrals it",
      "Queen vs two rooks: often a draw due to coordinated perpetual checks",
    ],
    commonMistakes: [
      "Underestimating perpetual check resources — always calculate the opponent's check/stalemate sequences",
      "Not recognizing the a, c, or f-pawn stalemate tricks in queen vs pawn positions",
      "Trying to checkmate with a queen when a draw by perpetual is looming — a draw may be forced",
      "Being too greedy: winning more material often only strengthens the opponent's perpetual check",
      "Forgetting that a queen and pawn can lose to a lone queen if the checks never stop",
    ],
    exampleFen: "8/Q7/8/8/8/3k4/3p4/3K4 b - - 0 1",
    exampleDescription:
      "Queen vs pawn on d2 pushed to the 7th rank (almost promoting). White's queen must use checks to approach with the king. The technique: check the black king to specific squares, then bring the white king closer. On a, c, or f-file pawns, stalemate defenses arise — this d-pawn is a standard win for the queen side.",
    faqs: [
      {
        q: "Can a queen beat a pawn on the 7th rank?",
        a: "Usually yes. The queen can check the opposing king and then bring its own king up to support. The exceptions are a-pawn, c-pawn, and f-pawn positions where the defending king can reach a stalemate square and the queen cannot make progress without allowing stalemate.",
      },
      {
        q: "Is queen vs rook a win for the queen?",
        a: "In theory yes, but in practice it is very difficult and often drawn. The defending rook can set up 'Philidor's fortress' or generate perpetual rook sacrifice defenses. The winning side must use precise technique; many queen vs rook positions that are theoretically won are drawn in practice.",
      },
      {
        q: "What is a stalemate trap in queen endgames?",
        a: "In queen vs pawn positions, the defending side can sometimes place the pawn on the 7th rank with the king in front of it on a corner or edge square. If the queen takes the pawn or gets too close without maintaining distance, the opposing king has no legal moves and the game is a stalemate draw.",
      },
      {
        q: "How do I avoid perpetual checks against my queen?",
        a: "Keep your king sheltered behind pawns if possible. Avoid positions where the opponent's queen can set up repeated checks with no way to interpose. Sometimes the fastest way to stop perpetual checks is to trade queens on favorable terms.",
      },
    ],
  },

  /* ──────────────────────── KNIGHT ENDGAMES ─────────────────────────── */
  {
    id: "knight",
    name: "Knight Endgames",
    tagline:
      "Slow moving but strategically rich — king activity is everything.",
    description:
      "Knight endgames have a distinct character: the knight moves slowly and can get 'out of sync' with a pawn race across the board (it takes many moves to cross from one wing to another). They are often considered similar to pawn endgames in their logic, and zugzwang is common. The king's activity is even more critical here than in rook endings, as a centralized, active king can easily outweigh a passive one.",
    difficulty: "intermediate",
    material: "Knights + Kings + Pawns",
    keyPrinciples: [
      "Knights need lots of moves to cross the board — plan their routes in advance, especially in pawn races",
      "Knight endgames have more zugzwang themes than almost any other endgame type",
      "An active king in knight endgames is often decisive — outpost squares for the knight are vital",
      "A knight on the rim is dim — edge squares significantly reduce the knight's mobility and power",
      "Knight vs pawns: a knight alone can rarely stop two connected passed pawns without king help",
    ],
    techniques: [
      "Planning knight routes early — count the number of moves the knight needs to reach key squares",
      "Exploiting zugzwang: place the opponent in a position where any move worsens their position",
      "Knight outpost play: find irreplaceable squares where the knight dominates",
      "Using the king to escort pawns in knight endgames, just like in king-pawn endings",
      "The 'wrong-colored knight' concept: a knight is often helpless stopping a bishop-colored pawn promotion",
    ],
    commonMistakes: [
      "Forgetting how slow the knight is and miscounting moves in pawn races",
      "Leaving the knight on the rim — edge squares cut its mobility dramatically",
      "Not accounting for the knight's inability to lose tempo (it always changes color), unlike the king",
      "Underestimating zugzwang — many knight endgames are decided by it",
      "Trading a well-placed knight for a poorly placed one without strong compensation",
    ],
    exampleFen: "8/8/3k4/8/2N5/3K4/8/8 w - - 0 1",
    exampleDescription:
      "A pure king + knight position illustrates the fundamental concept: the knight on c4 covers a wide range of squares, but its effective range depends entirely on where it needs to go next. In a pawn race scenario, always count the knight's moves carefully before committing to a plan — a single miscalculation can mean the difference between winning and drawing.",
    faqs: [
      {
        q: "Are knight endgames like pawn endgames?",
        a: "Yes — many chess trainers compare them directly. Like pawn endgames, zugzwang appears frequently, king activity is paramount, and pawn structure determines the strategic direction. The key difference is the knight's slowness across the board.",
      },
      {
        q: "What does 'a knight on the rim is dim' mean?",
        a: "A knight on the edge of the board (a-file, h-file, 1st rank, 8th rank) attacks fewer squares than a knight toward the center. A knight in the corner attacks only 2 squares; a knight on d4 or e4 attacks 8 squares. Keeping knights centralized maximizes their power.",
      },
      {
        q: "Can a knight stop a passed pawn?",
        a: "Yes, if it can get in front of the pawn in time. But because the knight is slow, it sometimes cannot stop a passed pawn — especially if the knight must also cover another pawn or square. Always calculate precisely whether the knight arrives in time.",
      },
      {
        q: "What is a knight outpost?",
        a: "A knight outpost is a square in the opponent's territory that the knight can occupy and cannot be chased away by enemy pawns. An outpost knight on d5 or e5 can dominate the entire position, threatening pieces on multiple squares simultaneously.",
      },
      {
        q: "How does zugzwang work in knight endings?",
        a: "Knights cannot 'waste' a move staying on the same color (unlike bishops), and the pawn rules still apply. This means zugzwang — where any move makes your position worse — is common. A well-timed king maneuver can put the opponent in zugzwang decisively.",
      },
    ],
  },
];
