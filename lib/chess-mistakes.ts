/**
 * Chess Mistakes — common errors by category with explanations and fixes.
 */

export type ChessMistake = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category:
    | "tactical"
    | "positional"
    | "opening"
    | "endgame"
    | "time-management";
  /** Who makes this mistake most often */
  affectsRating: string;
  /** Why players fall into this error */
  whyItHappens: string;
  /** Step-by-step how to stop making it */
  howToFix: string[];
  /** What to look for on every move to avoid this */
  checklistItem: string;
  /** FEN showing the mistake or its typical pattern */
  exampleFen: string;
  exampleDescription: string;
  faqs: { q: string; a: string }[];
};

export const CHESS_MISTAKES: ChessMistake[] = [
  /* ─────────────── HANGING PIECES ─────────────── */
  {
    id: "hanging-pieces",
    name: "Hanging Pieces",
    tagline: "The #1 cause of lost games at every level below 1800.",
    description:
      "A hanging piece is an undefended piece that can be captured for free. Leaving pieces en prise is the single most common mistake in chess — it costs material and often the game. Even intermediate players hang pieces regularly, usually because they're focused on their own plan and not checking the opponent's replies.",
    category: "tactical",
    affectsRating: "Under 1800",
    whyItHappens:
      "Players focus on executing their own plan and forget to ask 'what can my opponent do now?' after each move. Hanging pieces often happen when a piece is moved away from covering another piece, or when a piece is moved onto an attacked square without noticing.",
    howToFix: [
      "After every move, ask: 'What did my opponent's last move threaten?' before planning your reply",
      "Before playing your move, ask: 'Am I leaving any piece undefended or moving onto an attacked square?'",
      "Do a quick 'hanging piece scan' before every move: check all your pieces are either defended or on safe squares",
      "Use the 'LPDO' rule: Loose Pieces Drop Off — any undefended piece is in danger",
      "Practice blunder-check exercises: given a position, list all undefended pieces for both sides",
    ],
    checklistItem:
      "Are all my pieces defended? Does my move leave anything hanging?",
    exampleFen:
      "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    exampleDescription:
      "A typical Italian Game position. Both sides have pieces developed but not all are defended. White must always check whether Bc4 is attacked before playing a new move, and Black must verify the e5-pawn is defended. Missing a free capture here loses material immediately.",
    faqs: [
      {
        q: "Why do I still hang pieces even when I know I shouldn't?",
        a: "Hanging pieces is often an attention problem, not a knowledge problem. The fix is building a habit: a mandatory 'blunder check' before every move. Check your entire board briefly — is anything under attack? It takes 2 seconds and prevents the majority of material losses.",
      },
      {
        q: "Is there a pattern to the pieces I hang most often?",
        a: "Yes — use FireChess to scan your games. Most players have a recurring culprit: often it's rooks left on back ranks, knights moving to undefended squares, or bishops on long diagonals suddenly skewered. Knowing your personal pattern helps you watch for it specifically.",
      },
      {
        q: "Does doing more puzzles help with hanging pieces?",
        a: "Partially. Standard puzzles train you to find wins — but hanging pieces are 'anti-puzzles' where you must avoid losing. Specifically practice hanging-piece detection drills: given a position, find all loose pieces in 5 seconds. FireChess's drill mode does exactly this with your own games.",
      },
    ],
  },

  /* ─────────────── BACK RANK BLUNDERS ─────────────── */
  {
    id: "back-rank-blunder",
    name: "Back Rank Weakness",
    tagline:
      "Your own pieces trap your king on the back rank — then a rook ends it.",
    description:
      "A back rank weakness occurs when a king is 'trapped' on its starting rank with no escape square — usually because pawns are still in front of it and haven't been moved. A rook or queen delivering check on the first rank results in checkmate. Even grandmasters get mated on the back rank when they forget to create an escape square.",
    category: "tactical",
    affectsRating: "Under 1600",
    whyItHappens:
      "After castling, the three pawns in front of the king look like safety. Players focus on attacks and forget the back rank is still a vulnerability. Often the issue compounds: pieces leave the back rank, the pawns never create a luft, and suddenly a rook check is checkmate.",
    howToFix: [
      "Get in the habit of creating a 'luft' (escape square) early in the middlegame — move a pawn in front of the king one square (typically g3 or h3)",
      "Before rook trades on an open file, check if your king has an escape square from back rank checks",
      "When calculating combinations, always check if your king can be mated on the back rank as a defensive resource for your opponent",
      "In the endgame, even with major pieces, check if a rook check on rank 1 is possible before advancing",
    ],
    checklistItem: "Does my king have an escape square from a back rank check?",
    exampleFen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    exampleDescription:
      "Both kings are in castled positions with intact pawn shelters — but neither has a luft. If White plays Ra8+, it's checkmate. The lesson: move h3 or g3 early in the game to create an escape square and prevent this exact pattern.",
    faqs: [
      {
        q: "When is the best time to create a luft?",
        a: "Typically after your pieces are developed and the position has stabilized — around moves 12–18. A luft (h3 or g3 for White, h6 or g6 for Black) costs half a tempo but prevents checkmate. Do it when nothing more urgent is available.",
      },
      {
        q: "How do I exploit my opponent's back rank weakness?",
        a: "Look for rook moves to or along the opponent's back rank. If their king is trapped and a rook can reach the 8th rank, calculate whether any rook invasion is check or checkmate. Removing the piece that would otherwise capture the rook is the typical preparatory step.",
      },
      {
        q: "Can the back rank weakness appear outside king safety?",
        a: "Yes — also in rook endgames. A king on h1 with pawns on g2 and h2 is back-rank mated by a rook on e1 just as easily. In endgames, activate the king early to avoid this passive position.",
      },
    ],
  },

  /* ─────────────── DEVELOPING TOO SLOWLY ─────────────── */
  {
    id: "slow-development",
    name: "Slow Development",
    tagline:
      "Every move spent not developing is a gift to your opponent's attack.",
    description:
      "Slow development — moving the same piece twice, making unnecessary pawn moves, or developing to passive squares — is the root cause of many opening-phase disasters. An under-developed position loses material to tactical shots, gets attacked before defenses are set up, and often collapses quickly.",
    category: "opening",
    affectsRating: "Under 1400",
    whyItHappens:
      "Players know the opening principles but break them without realizing it — playing 'one more pawn move' or retreating a piece to a passive square looks safe but loses crucial development time. Gambits and tricky openings also tempt players to grab material instead of developing.",
    howToFix: [
      "Follow the opening principles religiously: develop knights before bishops, don't move the same piece twice without a clear reason, castle early",
      "Count your developed pieces vs the opponent's after each move in the opening — if you're behind, prioritize getting pieces out",
      "Avoid grabbing gambited pawns if it requires more than one extra pawn move to do so safely",
      "If you've moved a piece twice in the opening, ask: was that absolutely necessary, or did I just waste a tempo?",
      "Aim to have all pieces off the back rank and the king castled by move 10–12",
    ],
    checklistItem:
      "Am I activating a piece this move, or wasting time on something non-essential?",
    exampleFen: "rnbqkbnr/pppp1ppp/8/4p3/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 0 2",
    exampleDescription:
      "After 1.c4 e5 — White has played a flank pawn move. Both sides still have all pieces on the back rank. The decision to play 2.Nc3 or 2.g3 activates a piece or prepares fianchetto; playing 2.a3 or 2.b4 would be slow development, wasting time while Black develops freely.",
    faqs: [
      {
        q: "Is it always wrong to move a pawn in the opening?",
        a: "No — controlling the center with e4/d4 (or e5/d5) is essential. The mistake is moving pawns that don't contribute to center control or piece development. One or two central pawn moves are fine; three or four pawn moves in a row in the opening is usually wrong.",
      },
      {
        q: "What does 'losing a tempo' mean?",
        a: "A tempo is a move. Losing a tempo means wasting a move that could have been spent developing or improving a piece. If your opponent makes you move a piece twice while they develop a new piece each move, they gain a 'tempo' — their pieces are more active for the same number of moves played.",
      },
      {
        q: "My opponent played a weird move in the opening. Should I punish it?",
        a: "Only if you can do so while continuing to develop. If punishing their mistake requires 3 pawn moves and retreating a piece, you may gain material but lose the development race. The best response to bad opening play is fast, principled development that leaves you with an active, coordinated position.",
      },
    ],
  },

  /* ─────────────── WEAK KING SAFETY ─────────────── */
  {
    id: "king-safety-neglect",
    name: "Neglecting King Safety",
    tagline: "The most decisive blow in chess always targets an unsafe king.",
    description:
      "King safety is the highest priority in chess — all other considerations are secondary when your king is under attack. Neglecting to castle, delaying castling while launching an attack, or weakening the pawn shelter after castling are the most dangerous errors a player can make. An unsafe king loses to combinations that wouldn't work with a safely tucked king.",
    category: "tactical",
    affectsRating: "Under 1600",
    whyItHappens:
      "Players see an active position and delay castling to keep attacking or to not 'waste a move.' Others create pawn weaknesses in front of their king (g4, h4, f3) not realizing how exposed this makes the king. Sometimes a player just forgets to castle and then can't.",
    howToFix: [
      "Castle as soon as reasonable in any open or semi-open position — don't delay past move 10",
      "Never advance pawns in front of your own king without calculating the consequences fully",
      "When choosing whether to attack, first ask: is my king safe? If not, address that first",
      "In positions with open files near your king, ensure you have enough defenders",
      "If the center is open, castle no matter what — a king in the center in an open position is almost always in danger",
    ],
    checklistItem:
      "Is my king safe, or have I created weaknesses in front of it?",
    exampleFen:
      "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5",
    exampleDescription:
      "An Italian Game middlegame. White's king is still in the center and the e1-h4 diagonal is exposed. Black can play 5...d6 or 5...0-0 and wait for the right moment. White must castle immediately — playing another attacking move while the king is in the center is a serious positional error.",
    faqs: [
      {
        q: "Can I delay castling to attack?",
        a: "Only in closed positions where the center is fully locked and there's no way for the opponent to open lines quickly. In open or semi-open positions, delaying castling past move 10 is almost always dangerous. A rule of thumb: if the center is not fully closed, castle.",
      },
      {
        q: "I castled but my king still got attacked. Why?",
        a: "Castling is only the first step — you must also avoid weakening the pawn shelter afterward. Common errors after castling: playing h4 or g4 to start a kingside attack (which backfires), playing f3 to secure e4 (which weakens g3 and h2), or trading off the defensive bishop on g2/g7.",
      },
      {
        q: "Is queenside castling riskier than kingside?",
        a: "Generally yes. The queenside has more open lines in many positions such as after 1.e4 e5 — the a- and b-files often open. Queenside castling is also harder to protect with three pawns. Unless you have a specific plan (attack on a different wing), kingside castling is the safer default.",
      },
    ],
  },

  /* ─────────────── PASSIVE PIECES ─────────────── */
  {
    id: "passive-pieces",
    name: "Passive Pieces",
    tagline: "A piece with no good squares is dead weight — reactivate it.",
    description:
      "Passive pieces are those stuck on the back rank, blocked by pawns, or sitting on squares where they have no impact on the game. Having even one consistently passive piece is like playing with a material deficit. Positional chess is largely about the art of activating every piece.",
    category: "positional",
    affectsRating: "Under 1700",
    whyItHappens:
      "Players develop pieces early and then forget about them as the game progresses. A knight on a1, a bishop blocked behind its own pawns, or a rook never leaving its starting square are all passive pieces that players simply 'forget' to activate. Passive piece syndrome also happens when pawn chains trap minor pieces.",
    howToFix: [
      "On every move, ask: which of my pieces is worst placed, and can I improve it?",
      "Reactivate your worst piece — reroute the knight, switch the bishop to a better diagonal",
      "Break pawn chains that are blocking your pieces — sometimes a pawn sacrifice opens things up",
      "In quiet positions, the player who improves their pieces consistently will win",
      "Rooks belong on open files or the 7th rank — if your rooks are still on a1/h1 in the middlegame, that's a problem",
    ],
    checklistItem:
      "Is any piece of mine sitting passively? What's the plan to activate it?",
    exampleFen:
      "r3k2r/pbqn1ppp/1p2pn2/2pp4/3P4/1BN1PN2/PP3PPP/R1BQK2R w KQkq - 0 1",
    exampleDescription:
      "White's bishop on c1 is completely passive — blocked by its own pawns on d4 and e3. White's highest priority is activating this bishop: either via b2 with a2-a3-b4 plan, or e3-d2-c3 maneuver. Until the bishop is active, White plays with a 'ghost piece.'",
    faqs: [
      {
        q: "What's the most commonly passive piece?",
        a: "The 'bad bishop' — a bishop blocked behind its own fixed pawns on the same color complex. It's common in French Defense structures (Black's light-squared bishop behind d5-e6) and King's Indian structures (White's light-squared bishop blocked by e4). Reactivating or trading the bad bishop is a key strategic goal.",
      },
      {
        q: "How do I know which piece is my worst?",
        a: "Ask: if I could replace one of my pieces with something more active right now, which would it be? The piece that's on the most irrelevant square with the fewest good moves is your worst piece. Improving it — even at the cost of a slight structural concession — is often worth it.",
      },
      {
        q: "Is it worth sacrificing a pawn to activate a piece?",
        a: "Sometimes, yes. A piece that goes from completely passive to extremely active can be worth a pawn in positional compensation. This is the logic behind many positional pawn sacrifices in modern chess. Evaluate by asking: after the sacrifice and piece activation, is my overall piece activity significantly better?",
      },
    ],
  },

  /* ─────────────── POOR ENDGAME CONVERSION ─────────────── */
  {
    id: "endgame-conversion",
    name: "Failing to Convert Winning Endgames",
    tagline:
      "Winning positions don't convert themselves — endgame technique does.",
    description:
      "Many players win the middlegame battle but draw or even lose winning endgames because they lack technique. The most common failure is reaching a king-and-pawn endgame with a one-pawn advantage and not knowing how to queen it, or entering a rook endgame with an extra pawn and allowing a positional draw.",
    category: "endgame",
    affectsRating: "Under 1800",
    whyItHappens:
      "Endgame study is neglected in favor of openings and tactics. Players assume a pawn advantage means 'just push' without understanding opposition, key squares, pawn breaks, and rook positioning. Rook endgames especially are notoriously tricky — even grandmasters sometimes fail to convert them.",
    howToFix: [
      "Study the fundamental K+P endgames: opposition, key squares, pawn breakthroughs, the rule of the square",
      "Learn Lucena (winning technique in R+P vs R) and Philidor (defensive technique in R vs R+P)",
      "In any winning endgame, activate the king immediately — it's the most important piece in the endgame",
      "Trade rooks only when the resulting pawn endgame is a theoretical win — use an engine to check",
      "Study your own conversion failures: use FireChess to find games where you had a winning endgame and drew or lost",
    ],
    checklistItem:
      "In the endgame, is my king active? Do I know the theoretical outcome of this position?",
    exampleFen: "8/8/4k3/4p3/4P3/4K3/8/8 w - - 0 1",
    exampleDescription:
      "A classic king-and-pawn vs king-and-pawn endgame — two pawns locked on e4/e5, both kings facing each other. This is a theoretical draw because neither pawn can advance. But a one-pawn advantage with the right king position is a win — the difference hinges on who has the opposition.",
    faqs: [
      {
        q: "What endgames should every player study first?",
        a: "In order: (1) King + pawn vs King — learn key squares, opposition, and the rule of the square. (2) Rook + pawn vs Rook — learn Philidor for defense and Lucena for offense. (3) Rook endgames with extra pawns — learn the 'active rook' principle. These three cover 80% of endgame situations.",
      },
      {
        q: "How do I know when to trade into an endgame?",
        a: "Ask: is the resulting endgame a theoretical win? The classic mistake is trading queens and entering a pawn endgame assuming 'a pawn up must be winning' — sometimes it's a draw. Check king position, pawn structure, and whether your king can reach the key squares before simplifying.",
      },
      {
        q: "Is it better to keep queens or trade into a rook ending when up a pawn?",
        a: "It depends on the position, but rook endings with an extra pawn are notoriously drawn with correct defense. Sometimes keeping queens gives more winning chances because the defensive resources in rook endgames (Philidor position, rook checks) are very precise. There's no universal rule — evaluate each case.",
      },
    ],
  },

  /* ─────────────── PREMATURE ATTACK ─────────────── */
  {
    id: "premature-attack",
    name: "Premature Attack",
    tagline:
      "Attacking before your pieces are ready is the fastest way to lose.",
    description:
      "A premature attack is one launched without sufficient piece development, king safety, or coordination. Players see an apparent weakness in the opponent's position and attack before all the pieces are ready to support it. The attack runs out of steam, the opponent counter-attacks, and the position collapses.",
    category: "positional",
    affectsRating: "Under 1600",
    whyItHappens:
      "The desire to attack is strong — particularly after spotting what looks like a weakness. Players rush the attack without checking: are my pieces coordinated? Is my king safe? Do I have enough pieces in the attack? The result is a piece-by-piece collapse as the opponent defends and counter-attacks.",
    howToFix: [
      "Before launching any attack, count the pieces you have attacking vs the opponent's defenders",
      "Ensure your most active pieces are already in the attack area — don't attack with one piece",
      "Castle first unless you're 100% certain the attack wins on the spot",
      "Ask: 'If my opponent ignores my threat and plays their best move, what happens?' — if the answer is 'my attack dies,' it's premature",
      "Build up pressure systematically: improve all your pieces before committing to an attack",
    ],
    checklistItem:
      "Before attacking: do I have enough pieces ready, and is my king safe?",
    exampleFen:
      "rnbqk2r/pppp1ppp/5n2/2b1p3/4P3/2NP4/PPP2PPP/R1BQKBNR w KQkq - 2 5",
    exampleDescription:
      "White has two center pawns but pieces are undeveloped. If White plays f2-f4 here to launch a kingside attack, it weakens e3 and the king's diagonal while pieces are not ready to attack. The correct plan is 5.Nf3, 6.Be2 or 6.Bc4, then 7.0-0 — complete development first.",
    faqs: [
      {
        q: "How do I know if I have enough pieces to attack?",
        a: "A general rule: to attack the castled king, you want at least 3 pieces directly participating in the attack (usually queen + rook + minor piece). With only 1–2 pieces, the opponent can typically defend. Count pieces pointed at the king vs defenders in front of the king.",
      },
      {
        q: "What's the difference between a good sacrifice and a premature attack?",
        a: "A good sacrifice is calculated concretely to a forced or near-forced win. A premature attack is based on optimism — 'this should work.' Before any sacrifice, calculate the opponent's best defensive resources. If you can find a refutation, the sacrifice is premature. If you can't, it might be sound.",
      },
    ],
  },

  /* ─────────────── IGNORING OPPONENT THREATS ─────────────── */
  {
    id: "ignoring-threats",
    name: "Ignoring Opponent's Threats",
    tagline: "The most dangerous move is the one you didn't notice.",
    description:
      "A fundamental and extremely common mistake: after the opponent plays, many players immediately look for their own plan without first asking 'what did my opponent just threaten?' This leads to walking into tactical combinations, missing that a piece is now attacked, or allowing checkmate in 1.",
    category: "tactical",
    affectsRating: "Under 1600",
    whyItHappens:
      "Players are excited about their own plan and execute it without updating their model of the position after the opponent's move. The opponent's move changed the position — threats that didn't exist before may exist now. Failing to re-evaluate is a form of inattention.",
    howToFix: [
      "Make it an absolute rule: after every opponent move, before thinking about your own plan, ask 'what is the threat?'",
      "Look for checks, captures, and pawn advances first — these are the immediate threats",
      "If the opponent just moved a piece, ask: where does that piece now attack?",
      "Develop the habit of updating your mental picture of the board after each opponent move — treat it as a new position",
      "Do hanging-piece and threat-detection exercises: given a position after an opponent's move, find the new threats in 10 seconds",
    ],
    checklistItem: "What did my opponent just threaten with that move?",
    exampleFen:
      "rnbqk2r/pppp1ppp/5n2/2b1p3/4PP2/2N5/PPPP2PP/R1BQKBNR b KQkq - 0 4",
    exampleDescription:
      "White just played f2-f4. Black must immediately register the threat: f4-f5 is coming, attacking the bishop on c5 and gaining space. Black who ignores this and plays an unrelated developing move will be surprised when the bishop is suddenly under pressure. Ask: what moved? What does it threaten now?",
    faqs: [
      {
        q: "How do I build the habit of checking threats?",
        a: "Make it a mandatory first step in your thought process, not an afterthought. Every move: (1) Opponent moved — what does it threaten? (2) Now plan your reply. This sounds simple but requires conscious practice. After 200 games of doing it deliberately, it becomes automatic.",
      },
      {
        q: "What types of threats am I most likely to miss?",
        a: "Long-range piece moves (bishop or queen moving across the board to a totally different diagonal), discovered threats (a piece moves and reveals an attack from a piece behind it), and two-move threats (not a direct threat this move but forced next move). Scanning for these three categories first covers most cases.",
      },
    ],
  },
];
