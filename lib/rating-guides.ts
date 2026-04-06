/**
 * Rating Improvement Guides — how to break each rating ceiling.
 */

export type RatingGuide = {
  id: string;
  /** e.g. "800 → 1000" */
  range: string;
  /** Short label e.g. "From 800 to 1000" */
  title: string;
  tagline: string;
  description: string;
  /** The core skill gap at this level */
  coreChallenge: string;
  /** What players at the BOTTOM of this range do wrong */
  commonErrors: string[];
  /** The 3-5 highest ROI things to study */
  whatToStudy: string[];
  /** Concrete weekly practice plan */
  weeklyPlan: { activity: string; frequency: string; purpose: string }[];
  /** How to use FireChess specifically at this level */
  firechessTip: string;
  /** How long a realistic improvement timeline typically takes */
  timeframe: string;
  faqs: { q: string; a: string }[];
};

export const RATING_GUIDES: RatingGuide[] = [
  /* ──────────────────── 400 → 800 ──────────────────── */
  {
    id: "400-to-800",
    range: "400–800",
    title: "From 400 to 800",
    tagline: "Learn the rules properly and stop giving pieces away for free.",
    description:
      "The 400–800 range is where chess begins. Most games are decided by simple piece giveaways — someone leaves a queen en prise, walks into checkmate in one, or forgets to castle. The ceiling here isn't strategic — it's about basic tactical awareness and developing pieces. Nail those and 800+ comes quickly.",
    coreChallenge:
      "Recognizing immediate threats and not hanging pieces every other game.",
    commonErrors: [
      "Leaving pieces completely undefended (hanging pieces)",
      "Not noticing checkmate in 1 — both your own and the opponent's",
      "Not developing pieces — all 8 games have the same undeveloped rooks",
      "Moving the queen out on move 2 and getting it chased",
      "Not knowing when the game is over (not recognizing checkmate patterns)",
    ],
    whatToStudy: [
      "Chess fundamentals: how pieces move, relative values, check and checkmate",
      "Basic tactical patterns: checkmate in 1, forks, capturing hanging pieces",
      "Opening principles: develop pieces, control the center, castle",
      "Practice recognizing checkmate patterns: back rank, smothered mate, queen + rook ladder",
    ],
    weeklyPlan: [
      {
        activity: "Checkmate in 1 puzzles",
        frequency: "Daily — 20 puzzles",
        purpose:
          "Build the most essential pattern: delivering and seeing checkmate",
      },
      {
        activity: "Play 5-minute blitz games",
        frequency: "5–7 games per day",
        purpose: "Apply the principles and build game sense",
      },
      {
        activity: "Review your lost games",
        frequency: "After every game",
        purpose: "Find the move where you hung a piece or missed checkmate",
      },
    ],
    firechessTip:
      "Scan your games with FireChess and look at the 'Biggest Blunders' section — you'll see in one glance what piece you hang most often. At this level it's almost always the queen or a back-rank mate. Focus your puzzle work on exactly that pattern.",
    timeframe:
      "Most players can reach 800 within 4–8 weeks of consistent play and basic tactical study.",
    faqs: [
      {
        q: "I keep losing my queen early. How do I stop?",
        a: "Don't move the queen out early (avoid Qh5 on move 2 or Qf3 before developing knights). When you do move the queen, always check: can the opponent chase it with a pawn or piece? If yes, find a safer square or develop a piece instead. The queen is worth 9 pawns — treat it accordingly.",
      },
      {
        q: "Should I play longer time controls to improve faster?",
        a: "At 400–800, 5-minute blitz is fine for building habits. The games end quickly, you get lots of practice, and the tactical patterns at this level are simple enough to spot even in fast games. Add some 10-minute rapid games to practice thinking more carefully.",
      },
      {
        q: "How many games do I need to play?",
        a: "Volume matters more than quality at this stage — you're building game sense. Aim for 20+ games per week combined with daily puzzle solving. The key is consistent practice, not studying chess theory books.",
      },
    ],
  },

  /* ──────────────────── 800 → 1000 ──────────────────── */
  {
    id: "800-to-1000",
    range: "800–1000",
    title: "From 800 to 1000",
    tagline: "Tactics, tactics, tactics — and stop one-move blundering.",
    description:
      "The 800–1000 range is defined by one-move blunders — pieces left en prise, hanging pieces after exchanges, missing simple forks and pins. Players here understand the opening basics but still routinely overlook immediate threats. Fixing your blunder rate is the single biggest impact improvement at this level.",
    coreChallenge:
      "Consistently checking for one-move blunders and recognizing basic two-move tactics (forks, pins).",
    commonErrors: [
      "One-move blunders — hanging pieces after exchanges",
      "Missing two-move tactics (forks, pins on the newly placed piece)",
      "Capturing material and leaving the capturing piece hanging",
      "Neglecting to castle until it's too late",
      "Not checking: 'if I play this move, can my opponent take something for free?'",
    ],
    whatToStudy: [
      "Tactical motifs: forks (especially knight forks), pins, simple discovered attacks",
      "The F3/F6 blunder-check habit before every move",
      "Opening principles: don't violate the rules (develop, center, castle)",
      "Basic checkmate patterns: 2-piece mates (Q+R, Q+B)",
    ],
    weeklyPlan: [
      {
        activity: "Tactics puzzles (fork, pin, simple combos)",
        frequency: "Daily — 30 puzzles",
        purpose: "Build an internal library of tactical patterns",
      },
      {
        activity: "Rapid games (10 minutes)",
        frequency: "5 games per day",
        purpose: "Enough time to apply the blunder-check habit",
      },
      {
        activity: "Post-game review: find your blunders",
        frequency: "After every game",
        purpose: "Identify your most common blunder pattern and target it",
      },
    ],
    firechessTip:
      "Use FireChess's Drill Mode — it extracts your actual blunder positions from your games and makes you re-solve them. At 800–1000 this is extremely powerful: you're not doing random puzzles, you're fixing YOUR specific mistakes.",
    timeframe:
      "Most players cross 1000 within 2–3 months of consistent tactical training and blunder-check habit building.",
    faqs: [
      {
        q: "How do I build the blunder-check habit?",
        a: "Before every move, ask two questions: (1) What did my opponent just threaten? (2) If I play this move, do I leave anything hanging? It takes 5 seconds. Make it mandatory — no exceptions. After about 300 games of forcing yourself to do this, it becomes automatic.",
      },
      {
        q: "Is opening study worth it at 800–1000?",
        a: "Minimal opening theory is fine — know the first 4–5 moves of one or two openings. But don't spend more than 20% of your study time on openings at this level. Tactics will gain you far more Elo per hour of study than opening theory.",
      },
    ],
  },

  /* ──────────────────── 1000 → 1200 ──────────────────── */
  {
    id: "1000-to-1200",
    range: "1000–1200",
    title: "From 1000 to 1200",
    tagline: "Move from random tactics to consistent positional foundations.",
    description:
      "At 1000–1200, raw blundering starts to decrease and players begin to develop positional instincts — right and wrong. This is the level where most players start to understand development and king safety but still lack consistent calculation and miss two-to-three move combinations regularly.",
    coreChallenge:
      "Calculating 2–3 move combinations correctly and building a real opening to middlegame understanding.",
    commonErrors: [
      "Moving the same piece twice in the opening or developing to passive squares",
      "Not castling or castling into a storm",
      "Missing two-move tactics (especially double attacks)",
      "No clear plan in the middlegame — random piece moves",
      "Exchanges that give up material or positional advantage unconsciously",
    ],
    whatToStudy: [
      "Tactics: 2–3 move combinations (forks, pins, skewers, discovered attacks)",
      "Opening structures: learn ONE solid opening per color and the typical middlegame plans",
      "Basic positional concepts: piece activity, open files, pawn structure",
      "Endgame basics: K+P vs K, passed pawns",
    ],
    weeklyPlan: [
      {
        activity: "Mixed tactics puzzles (2–3 move combos)",
        frequency: "Daily — 30 puzzles",
        purpose: "Push calculation depth to 3 moves reliably",
      },
      {
        activity: "Rapid games (10–15 minutes)",
        frequency: "5 games per day",
        purpose: "Apply tactical and positional skills in real games",
      },
      {
        activity: "Learn one opening repertoire",
        frequency: "2–3 sessions per week",
        purpose: "Reach middlegame positions you understand",
      },
      {
        activity: "Review with FireChess",
        frequency: "Weekly",
        purpose: "Find your recurring mistake patterns across many games",
      },
    ],
    firechessTip:
      "The Opening Analysis in FireChess will show you which specific lines you lose most often. At 1000–1200, this is often a recurring opening blunder you play in game after game. Fix one opening hole at a time.",
    timeframe:
      "Reaching 1200 typically takes 3–5 months for a player who studies consistently and plays 5+ games per week.",
    faqs: [
      {
        q: "I feel stuck at 1000. What's the breakthrough?",
        a: "At 1000, the biggest gains usually come from (1) fixing one recurring tactical blind spot (use FireChess to find it) and (2) learning one solid opening so you enter the middlegame with an equal or better position. One habit change + one piece of opening knowledge typically breaks the plateau.",
      },
      {
        q: "Should I study with a coach at 1000?",
        a: "Not essential at this level — there's so much free improvement available. Self-study with free resources (Chess.com Learn, Lichess puzzles, FireChess analysis) can take you to 1400+ without a coach. A coach becomes more valuable around 1400–1600 when self-study alone starts to plateau.",
      },
    ],
  },

  /* ──────────────────── 1200 → 1500 ──────────────────── */
  {
    id: "1200-to-1500",
    range: "1200–1500",
    title: "From 1200 to 1500",
    tagline: "Study real chess — openings, plans, endgame technique.",
    description:
      "The 1200–1500 range is where players transition from reactive chess to proactive chess. You can handle basic tactics, but games are still decided by positional misunderstandings, poor plans, and endgame errors. This is the level where actual chess study (not just playing games and doing puzzles) starts to matter.",
    coreChallenge:
      "Developing a coherent middlegame plan and consistent endgame technique.",
    commonErrors: [
      "Achieving a good position from the opening and then drifting without a plan",
      "Trading pieces without evaluating whether the resulting position is better or worse",
      "Entering losing endgames because of poor simplification decisions",
      "Structural weaknesses created by careless pawn moves",
      "Missing the opponent's positional positional plan — playing reactively instead of actively",
    ],
    whatToStudy: [
      "Positional chess: pawn structure, piece activity, the concept of weak squares",
      "Opening repertoire with middlegame plans: know the typical plans in your openings",
      "Endgame technique: Lucena position, Philidor position, bishop vs knight endings",
      "Calculation training: solve 4–5 move combinations accurately",
      "Study 10–15 annotated master games in your opening to understand positional ideas",
    ],
    weeklyPlan: [
      {
        activity: "Tactical puzzles (3–5 moves deep)",
        frequency: "Daily — 20 puzzles",
        purpose: "Increase calculation depth and precision",
      },
      {
        activity: "Endgame study (one position per session)",
        frequency: "3x per week",
        purpose:
          "Build essential endgame technique that directly saves / wins games",
      },
      {
        activity: "Rapid / classical games (15+ minutes)",
        frequency: "Daily if possible",
        purpose: "Enough time to apply positional thinking",
      },
      {
        activity: "FireChess full game scan",
        frequency: "Weekly",
        purpose: "Track your opening and tactical improvement over time",
      },
    ],
    firechessTip:
      "FireChess's Radar Chart will show your relative strengths: tactics, endgames, opening knowledge. At 1200–1500, most players have a sharp imbalance — strong tactically but weak in endgames, or the reverse. Focus your study on whichever bar is shortest on your radar.",
    timeframe:
      "1200 to 1500 typically takes 6–12 months of structured study for a dedicated player. Pure game-playing without study rarely breaks 1400.",
    faqs: [
      {
        q: "Do I need to memorize opening theory to reach 1500?",
        a: "You need to understand your openings, not memorize them. Know the first 10–12 moves of one main line per color and, more importantly, understand WHY each move is played and what the resulting middlegame plans are. Memorization without understanding will fail as soon as the opponent deviates.",
      },
      {
        q: "Is 1500 a significant milestone?",
        a: "Yes — 1500 roughly marks the boundary between 'club level' and 'strong club level.' Players above 1500 have consistent tactical vision, understand positional ideas, and can execute endgame technique reliably. It's also roughly the level where FIDE classical ratings begin to carry weight in club competitions.",
      },
    ],
  },

  /* ──────────────────── 1500 → 1800 ──────────────────── */
  {
    id: "1500-to-1800",
    range: "1500–1800",
    title: "From 1500 to 1800",
    tagline: "Deepen your opening knowledge and master technical endgames.",
    description:
      "The 1500–1800 range requires genuine chess mastery: a solid opening repertoire, deep understanding of middlegame structures, and robust endgame technique. Games at this level are rarely decided by simple blunders — they're decided by small positional advantages that are nursed into won endgames, or by preparation advantages in the opening.",
    coreChallenge:
      "Converting small advantages consistently and navigating complex endgames accurately.",
    commonErrors: [
      "Missing subtle positional imbalances — playing 'solid' moves instead of the best move",
      "Failing to convert technically winning endgames (R+P vs R, K+P structures)",
      "Not having deep enough opening preparation — getting surprised in the main lines",
      "Calculation inaccuracies in 6–8 move sequences",
      "Psychological errors: playing too cautiously in winning positions, or too aggressively in equal ones",
    ],
    whatToStudy: [
      "Deep opening preparation: 15–20 moves in main lines with sideline answers",
      "Positional masterworks: Karpov's games, games of Capablanca and Petrosian",
      "Advanced endgame theory: rook endgames with multiple pawns, opposite-colored bishops",
      "Long calculation training: solve 6–8 move combinations without a board",
      "Strategic planning: pawn breaks, piece sacrifice for structural compensation",
    ],
    weeklyPlan: [
      {
        activity: "Deep opening preparation",
        frequency: "3x per week — 45 min sessions",
        purpose:
          "Build a repertoire deep enough to out-prepare 1500–1800 players",
      },
      {
        activity: "Endgame technique practice",
        frequency: "3x per week",
        purpose:
          "Turn technical wins into actual wins instead of stressful draws",
      },
      {
        activity: "Classical games (25+ minutes)",
        frequency: "3–5 per week",
        purpose:
          "The positions are complex enough to actually test strategic skill",
      },
      {
        activity: "FireChess opening deep-dive",
        frequency: "Monthly",
        purpose:
          "Find exactly which opening lines you most often lose in and plug those holes",
      },
    ],
    firechessTip:
      "At 1500–1800, FireChess's Opening Analysis becomes a serious study tool. Filter your last 100 games by opening line — you'll see your exact win rate by variation. Find the line where your win rate is lowest and study it specifically with an engine.",
    timeframe:
      "1500 to 1800 is a significant jump. Expect 12–24 months of structured study. Many players plateau at 1600–1700 for years without targeted improvement work.",
    faqs: [
      {
        q: "I'm stuck at 1600 for a year. What's the fastest way out?",
        a: "Scan your last 100 games with FireChess. Your plateau almost always has a specific cause: a recurring opening problem, an endgame theme you keep botching, or a tactical pattern you miss consistently. Identify the exact gap, study it for 4–6 weeks exclusively, and retest. Targeted improvement beats general study at this level.",
      },
      {
        q: "Should I study classic master games at this level?",
        a: "Yes — this is where game study starts to pay serious dividends. Pick one opening line you play and study 10 master games in that specific line. Don't just follow the moves — actively predict what both sides will play next and why. Capablanca's and Karpov's games are especially instructive for positional technique.",
      },
    ],
  },

  /* ──────────────────── 1800 → 2000 ──────────────────── */
  {
    id: "1800-to-2000",
    range: "1800–2000",
    title: "From 1800 to 2000",
    tagline:
      "Advanced preparation, concrete calculation, and tournament-level endgames.",
    description:
      "Crossing 2000 is a major milestone — it's listed on FIDE rating cards, recognized in clubs worldwide, and requires a genuinely comprehensive skill set. At 1800–2000, games are won by opening preparation advantages, superior calculation in critical middlegame positions, and flawless endgame technique.",
    coreChallenge:
      "Concrete deep calculation and the ability to find the objectively best move in critical positions.",
    commonErrors: [
      "Inaccurate deep calculation — finding the right plan but the wrong variation",
      "Opening preparation gaps — being out-prepared and entering unfamiliar territory",
      "Psychological over-caution in winning positions — playing for safety when the win requires precision",
      "Endgame difficulties in complex multi-pawn rook or opposite-colored bishop endings",
      "Missing subtle tactics that require 7–9 move calculations",
    ],
    whatToStudy: [
      "Calculation training: Dvoretsky's 'Forcing Chess Moves', complex combination solving",
      "Opening novelties: find improvements in your main lines using engines",
      "Advanced endgame: Dvoretsky's Endgame Manual, complex rook endings",
      "Analyze your own games deeply: find every inaccuracy with an engine and understand why",
      "Study recent grandmaster games in your specific opening systems",
    ],
    weeklyPlan: [
      {
        activity: "Calculation training (solving complex problems)",
        frequency: "Daily — 60 min",
        purpose: "Push calculation accuracy in critical positions",
      },
      {
        activity: "Opening preparation with engine",
        frequency: "3x per week",
        purpose: "Find novelties and plug preparation gaps",
      },
      {
        activity: "Classical or correspondence games",
        frequency: "3–5 per week",
        purpose: "Test preparation and deep calculation in real games",
      },
      {
        activity: "FireChess deep analysis session",
        frequency: "After every tournament or 20 games",
        purpose:
          "Find systemic weaknesses in your play that statistical analysis reveals",
      },
    ],
    firechessTip:
      "At 1800+, FireChess is most valuable for statistical pattern recognition — not just finding blunders. Filter by pawn structure to find which middlegame structure you score worst in. Filter by endgame type. The patterns that emerge from 200+ games reveal blind spots even a coach might miss.",
    timeframe:
      "1800 to 2000 takes most dedicated players 2–4 years. The gap is real — players at 1800 know chess well; players at 2000 have mastered it at a level where very few amateurs reach.",
    faqs: [
      {
        q: "How important is a chess coach at this level?",
        a: "Very important. Above 1800, self-study has diminishing returns — you need someone who can pinpoint your specific calculation errors and preparation gaps. A coach who reviews your games and spots where your thinking process breaks down is worth more than 100 general puzzle sessions.",
      },
      {
        q: "Is correspondence chess worth trying?",
        a: "Yes — correspondence chess (using an engine is often allowed) is excellent for opening preparation and understanding deep positional ideas. Even if you use an engine, the process of understanding WHY the engine prefers certain moves teaches you concepts you then carry into OTB play.",
      },
    ],
  },
];
