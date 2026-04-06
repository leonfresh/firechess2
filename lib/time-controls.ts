/**
 * Time Control Guides — how to play well in each time format.
 */

export type TimeControlGuide = {
  id: string;
  name: string;
  /** e.g. "1+0 / 2+1" */
  formats: string[];
  tagline: string;
  description: string;
  /** Who this guide is primarily useful for */
  targetAudience: string;
  /** Key differences from standard chess advice */
  uniqueChallenges: string[];
  /** Core tips specific to this control */
  tips: string[];
  /** Common mistakes players make in this format */
  commonMistakes: string[];
  /** Opening repertoire advice for this format */
  openingAdvice: string;
  /** Endgame/time management advice */
  timeManagement: string;
  /** How to improve specifically for this format */
  improvementPlan: string[];
  faqs: { q: string; a: string }[];
};

export const TIME_CONTROLS: TimeControlGuide[] = [
  /* ─────────────────────────── BULLET ──────────────────────────── */
  {
    id: "bullet",
    name: "Bullet Chess",
    formats: ["1+0", "2+1"],
    tagline: "One second per move. Premoves, intuition, and chaos — mastered.",
    description:
      "Bullet chess (1–2 minutes per side) is the most extreme form of competitive chess. At this speed, there's almost no time for calculation — everything is pattern recognition, reflexes, and clock management. Bullet has its own metagame, skill set, and hazards that are completely different from slower formats.",
    targetAudience:
      "Players rated 1200+ looking to sharpen reflexes and opening familiarity",
    uniqueChallenges: [
      "You often have under 5 seconds per move — conscious calculation is nearly impossible",
      "Premove (queuing moves before your opponent plays) is essential and also dangerous",
      "Flag wins (winning on time) are a legitimate strategy, not a bug",
      "Tactical blunders are frequent for both sides — staying solid often wins more than brilliancies",
      "The result often depends as much on clock handling as on the chess played",
    ],
    tips: [
      "Use premoves aggressively in known positions and endgames — learn when it's safe to premove",
      "Play solid, natural-looking moves rather than sharp calculating lines",
      "Get pieces to sensible squares quickly — don't spend time optimizing",
      "In endgames, move instantly — flag your opponent before they flag you",
      "Know your opening lines deeply enough to play the first 10–15 moves without thinking",
      "Focus on not hanging pieces — avoiding blunders beats trying to find brilliancies",
      "Use the flagging endgame — keep pieces on the board to complicate time pressure",
    ],
    commonMistakes: [
      "Pre-moving into a losing position without checking the board",
      "Using too much time early in 'critical' positions that aren't actually critical",
      "Playing exotic openings that require calculation instead of solid, memorized lines",
      "Forgetting about the clock while calculating a long line",
      "Not practicing bullet mode — regular chess prep doesn't directly transfer here",
    ],
    openingAdvice:
      "Play the most natural, solid openings you know deeply. The Sicilian Najdorf and King's Indian may be excellent in classical chess but require too much calculation under 60 seconds. Prefer openings with clear plans: the London, Italian, King's Indian Attack, French, Caro-Kann. The goal is to reach a known middlegame structure with 30+ seconds remaining.",
    timeManagement:
      "In bullet, time IS the resource. Never spend more than 5–10 seconds on any move unless you're in mutual time pressure where both sides have under 10 seconds. Learn to read the clock gap — if you have 10 extra seconds on your opponent, you can take a bit more time; if you're behind, blitz everything. In dead drawn endgames, complicate deliberately to create flagging chances.",
    improvementPlan: [
      "Play 100+ bullet games per week to build reflexes and pattern recognition",
      "Review your games in rapid/classical mode to spot recurring tactical patterns",
      "Solve tactical puzzles on 2–3 second timers to train rapid pattern recognition",
      "Learn 3–4 solid opening lines to 15 moves depth — no calculation required",
      "Study endgame flag-survival techniques: king activity, premove patterns, fortress positions",
    ],
    faqs: [
      {
        q: "Can bullet chess improve my overall game?",
        a: "Bullet improves your opening familiarity, pattern recognition speed, and premove comfort. But it also trains bad habits — making impulsive moves, not calculating, flagging in drawn positions. The best approach is to play bullet for fun and speed training, but do serious study in blitz or rapid.",
      },
      {
        q: "What rating should I be before taking bullet seriously?",
        a: "Around 1000+. Below that, bullet is mostly chaos. Once you have solid piece development habits and can spot basic tactics, bullet starts rewarding actual chess knowledge rather than pure luck.",
      },
      {
        q: "How do I stop hanging pieces in bullet?",
        a: "Train with 3-second tactical puzzles. The key is building a 'hanging piece detector' that fires automatically before you click. Also, learn which square every piece is going to move to before reaching for the mouse — hover, check, click.",
      },
      {
        q: "Should I use premoves?",
        a: "Yes, but selectively. Safe premoves: recapturing with the obvious piece, castling, making a pawn capture in the endgame, king moves in king-and-pawn endings. Dangerous premoves: any position where the opponent has a surprising reply. Never premove in tactical positions.",
      },
    ],
  },

  /* ─────────────────────────── BLITZ ───────────────────────────── */
  {
    id: "blitz",
    name: "Blitz Chess",
    formats: ["3+0", "3+2", "5+0", "5+3"],
    tagline:
      "The gold standard of online chess — fast enough to be exciting, slow enough to actually play.",
    description:
      "Blitz (3–5 minutes per side) is the most popular online format and the one where most competitive online players spend the majority of their time. It's fast enough that you can't calculate everything, but slow enough that skill and chess understanding genuinely shine through.",
    targetAudience:
      "All online chess players — blitz is the default competitive format",
    uniqueChallenges: [
      "You have time to calculate short combinations (2–3 moves) but not long ones",
      "Clock management is critical — losing on time in winning positions is common",
      "The gap between knowing a principle and applying it quickly is huge",
      "Openings need to be solid but not robotically memorized",
      "Endgame technique must be fairly automatic to execute under time pressure",
    ],
    tips: [
      "Pause to think at critical junctures (piece captures, king safety decisions) but auto-pilot natural moves",
      "Use at least 30–60 seconds for genuinely sharp or critical positions",
      "If you're ahead in material with 20+ seconds, convert efficiently — don't complicate",
      "Learn the most common tactical patterns so you spot them in under 5 seconds",
      "In the endgame, activate your king immediately — it's almost always the right plan",
      "Don't second-guess your intuition unless something looks very wrong",
    ],
    commonMistakes: [
      "Playing the entire game on autopilot and never pausing to reassess",
      "Spending 90% of your time on the opening when the middlegame deserves it",
      "Chasing speculative attack when a solid positional move keeps the advantage",
      "Panic-moving when flagging instead of playing the objectively best move",
      "Forgetting to clock-check — being surprised that you have 15 seconds when you thought you had 50",
    ],
    openingAdvice:
      "Blitz is where opening preparation genuinely pays off. Know 10–15 moves of your main openings, understand the resulting middlegame plans, and be able to execute the first 8 moves in under 90 seconds. Strong blitz openings: as White, 1.e4 with Italian or Ruy Lopez; 1.d4 with London. As Black against 1.e4: Caro-Kann or French; against 1.d4: King's Indian or Nimzo-Indian. Avoid the sharpest theory lines.",
    timeManagement:
      "Aim to reach move 20 with at least 1:30 remaining in a 3+0 game. Reserve 30 seconds for critical decisions, and move quickly when the position is clear. In 5+0, you can afford one deep think (60+ seconds) in the whole game. In increment formats (3+2, 5+3), time pressure is less punishing — take slightly more time in sharp positions.",
    improvementPlan: [
      "Analyze your blitz games: filter for losses where you had a winning position — find the critical moments",
      "Study frequently-arising middlegame structures in your opening, not just opening moves",
      "Do 20 tactical puzzles daily with a 10-second timer — reflex training for blitz patterns",
      "Work on converting simple winning endgames: K+P vs K, R+K vs K, R+P vs R",
      "Play a mix of blitz and rapid — rapid study feeds your blitz intuition",
    ],
    faqs: [
      {
        q: "Is blitz or rapid better for improvement?",
        a: "Rapid is better for improvement. You have time to actually think and identify gaps. Blitz is closer to a test or competition. Play rapid to learn, blitz to compete and benchmark. Most top players recommend 70% of practice in rapid/classical with 30% blitz.",
      },
      {
        q: "Why do I play worse in blitz than puzzles?",
        a: "Puzzle solving is pattern matching in a low-pressure environment. Blitz adds clock pressure, an opponent trying to trick you, and the accumulation of a full game's decision-making. The fix is to do time-pressured puzzles (10-second timers) and play more blitz games so the time pressure becomes normal.",
      },
      {
        q: "My blitz rating is 200 points higher than my rapid rating. Is that normal?",
        a: "Actually it's usually the reverse — most players are slightly higher in rapid because there's more time to think. If your blitz is much higher, it could mean you're playing by intuition/pattern in blitz but over-thinking in rapid. Try playing rapid more intuitively.",
      },
    ],
  },

  /* ─────────────────────────── RAPID ───────────────────────────── */
  {
    id: "rapid",
    name: "Rapid Chess",
    formats: ["10+0", "10+5", "15+10", "25+10"],
    tagline:
      "Enough time to actually think — the format where chess knowledge separates players.",
    description:
      "Rapid chess (10–25 minutes per side) is the sweet spot between enough time to calculate properly and enough speed to require practical decision-making. It's the primary format of most over-the-board tournaments and the format where genuine chess improvement is most directly tested.",
    targetAudience:
      "All serious chess players — rapid is where real chess skill is tested",
    uniqueChallenges: [
      "You have time to calculate 4–6 move combinations but must decide when to stop",
      "Positional plans need to be considered, not just immediate tactics",
      "Endgame technique is fully tested — there's enough time to play accurately",
      "Avoiding subconscious blunders after 50+ minutes of concentration",
      "Pacing: saving enough time for complex endings when you've used a lot early",
    ],
    tips: [
      "Establish a thought process: look for opponent's threats first, then calculate your candidate moves",
      "In complex positions, verbalize the position to yourself: 'My plan is X, the threats are Y'",
      "Use the extra time to check your moves before playing — spot your own blunders",
      "In winning positions, convert efficiently — don't get clever with 20+ seconds on the clock",
      "Take your time in critical moments (move 15–25 are typically the game-deciding moves)",
      "In the endgame, think about pawn structure and king activity before piece moves",
    ],
    commonMistakes: [
      "Using 8 minutes on the first 10 moves of the opening — save time for the middlegame",
      "Playing the first 'obvious' move without considering alternatives",
      "Underestimating the opponent's resources — overconfidence leads to blunders in winning positions",
      "Not checking for tactical shots after the opponent's moves",
      "Neglecting the clock in a fixed mindset of 'I have plenty of time'",
    ],
    openingAdvice:
      "In rapid, a full repertoire matters. You should have main lines and sideline answers prepared. The first 15 moves can often be played confidently with 5 minutes or less used. Sound, principled openings work better than tricky systems — in 10+ minutes, the opponent has time to refute unsound gambits. Build a narrow but deep repertoire rather than wide but shallow.",
    timeManagement:
      "Budget your time by phase: opening (5% of clock), middlegame (60%), endgame (35%). In a 10-minute game that means roughly 30 seconds of theory in the opening, leaving 9:30 for the real chess. Check the clock every 10 moves and recalibrate. If you're under 3 minutes in a complex middle game, start simplifying.",
    improvementPlan: [
      "Analyze every rapid game — both wins and losses — looking for the moment the evaluation shifted",
      "Study a complete opening repertoire with middlegame plans, not just opening moves",
      "Work through classic endgame studies (Capablanca, Rook endings) — rapid tests endgame technique fully",
      "Train positional evaluation: spend time assessing 'which side is better and why' in complex positions",
      "Review grandmaster games in your opening — understand the plans, not just the moves",
    ],
    faqs: [
      {
        q: "Should I play rapid or focus on long classical games?",
        a: "For most club players, 15+10 rapid is ideal — it's long enough to play properly but short enough to get many practice games. Classical (30+ min) is better for going deep on complex positions, but most online improvement comes from the rapid feedback loop of many rapid games + analysis.",
      },
      {
        q: "I lose concentration in long rapid games. What helps?",
        a: "Concentration in chess is trainable. Play longer games deliberately — the fatigue is part of the exercise. Between moves, look away and reset your vision of the board. Take a breath before critical moves. Avoid analyzing positions in your head during the opponent's think-time — stay focused on the board.",
      },
      {
        q: "What's the ideal mix of rapid, blitz, and study?",
        a: "A common recommendation among coaches: 40% study (openings, tactics, endgames), 40% rapid play, 20% blitz. The study + rapid combination builds knowledge and tests it properly. Blitz keeps your reflexes sharp and is fine to enjoy, but shouldn't dominate practice time.",
      },
    ],
  },

  /* ─────────────────────────── CLASSICAL ───────────────────────── */
  {
    id: "classical",
    name: "Classical Chess",
    formats: ["30+0", "60+0", "90+30", "40 moves in 2 hours"],
    tagline:
      "The original format of chess — where deep calculation and true mastery shine.",
    description:
      "Classical chess (30+ minutes per side, often 90 minutes + 30-second increment for tournament play) is the format in which the game was developed and perfected. With time to calculate deeply and consider long-term plans, classical chess demands and rewards the highest levels of chess understanding. It's also the format of FIDE official competitions.",
    targetAudience:
      "Serious tournament players and those studying chess deeply",
    uniqueChallenges: [
      "Deep calculation is expected — shallow moves get punished more consistently",
      "Psychological endurance matters — 4–6 hour games require sustained concentration",
      "Every move can be scrutinized, so blunders are less forgivable",
      "Preparation and opening theory go much deeper than other formats",
      "Time trouble can still happen — even 90 minutes can run out in complex positions",
    ],
    tips: [
      "Develop a rigorous thought process — every move should follow a structured candidate evaluation",
      "Use the 'candidate moves' method: list 2–4 candidate moves before calculating any of them",
      "Identify the key feature of the position before deciding on a plan",
      "Double-check moves that seem obvious — in classical chess, the obvious move is sometimes wrong",
      "In time trouble, revert to simple, safe moves — don't calculate deeply in under 5 minutes",
      "Use your opponent's time to rest your eyes and briefly relax — don't always calculate on their clock",
    ],
    commonMistakes: [
      "Spending the first 90 minutes in a known opening variation — trust your preparation and play quickly",
      "Calculating too many lines shallowly instead of focusing on 2–3 candidates deeply",
      "Missing the opponent's best defensive resource when in a 'winning' position",
      "Flagging in a drawn or winning position due to poor time management",
      "Pre-determined plans — ignoring that the opponent's last move changed everything",
    ],
    openingAdvice:
      "Opening preparation for classical chess goes much deeper than for blitz. You need to know the theory to move 20+ in your main lines, understand the resulting structures, and have prepared novelties or improvements. Working with an opening database and engine analysis is expected at club level and above. Study the 'why' behind moves, not just the moves themselves.",
    timeManagement:
      "Allocate time based on position complexity. A standard guideline: 1–2 minutes for simple moves, 5–10 minutes for critical decisions, 15+ minutes for truly sharp or game-deciding moments. Check the clock at every 10th move. In tournament formats with time controls (40 moves in 2 hours), count the moves and pace yourself — don't reach move 35 with 5 minutes left.",
    improvementPlan: [
      "Study complete annotated classical games — understand every decision point",
      "Analyze your own classical games deeply with an engine — find where your thinking went wrong, not just what was wrong",
      "Study endgame theory: rook endings, pawn structures, technical conversions",
      "Work on calculation training: solve complex 5+ move combinations without moving pieces",
      "Read chess books — Silman's Complete Endgame Course, Dvoretsky's Endgame Manual, and positional works",
    ],
    faqs: [
      {
        q: "Why do even grandmasters sometimes flag in classical games?",
        a: "Time pressure in classical chess often happens in the most complex positions — precisely because they're complex. When you're calculating deeply in a critical position around move 35–40, it's easy to use 20+ minutes on a critical decision and suddenly have very little left. Time management is a genuine skill even at the top level.",
      },
      {
        q: "Can online rapid help improve my OTB classical game?",
        a: "Yes, significantly. Online rapid trains tactical vision, opening knowledge, and endgame intuition. The main gap is psychological — sitting at a board without an engine safety net, under time pressure, for 4+ hours is different from online play. Supplement online study with some OTB tournament experience.",
      },
      {
        q: "What's a good FIDE classical tournament time control?",
        a: "The standard FIDE time control is 90 minutes for 40 moves, then 30 minutes for the rest of the game, with a 30-second increment from move 1. This gives approximately 2–3 hours per side in a full game. Rapid FIDE is 25+10 per player.",
      },
    ],
  },
];
