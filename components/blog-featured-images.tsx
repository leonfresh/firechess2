/**
 * Blog Featured Images  unique chess-themed SVG artwork for each blog post.
 * Uses the dungeon-illustrations.tsx style: drawn piece silhouettes, atmospheric
 * gradients, glow filters, and subtle animations. Pure SVG, no external assets.
 */

export function BlogFeaturedImage({ slug }: { slug: string }) {
  switch (slug) {
    case "how-to-analyze-chess-games":
      return <AnalyzeArt />;
    case "what-is-centipawn-loss":
      return <CentipawnArt />;
    case "why-you-keep-losing-same-openings":
      return <OpeningsArt />;
    case "how-to-find-opening-weaknesses":
      return <WeaknessesArt />;
    case "endgame-patterns-club-players-miss":
      return <EndgameArt />;
    case "free-chess-analysis-tools-2026":
      return <FreeToolsArt />;
    case "chess-time-management-tips":
      return <TimeArt />;
    case "how-to-stop-blundering-chess":
      return <BlunderArt />;
    case "breaking-chess-rating-plateau":
      return <PlateauArt />;
    case "chess-middlegame-strategy-finding-a-plan":
      return <MiddlegameArt />;
    case "chaos-chess-roguelike-draft-mode":
      return <ChaosArt />;
    case "chess-accuracy-score-explained":
      return <AccuracyArt />;
    case "how-to-improve-at-chess":
      return <ImproveArt />;
    case "chess-brilliant-move-explained":
      return <BrilliantArt />;
    case "why-your-puzzle-rating-is-higher-than-your-rapid-rating":
      return <PuzzleVsRapidArt />;
    case "italian-game-mistakes-club-players-make":
      return <ItalianMistakesArt />;
    case "how-to-build-a-chess-study-plan-from-your-own-games":
      return <StudyPlanArt />;
    case "how-to-study-chess-openings-without-memorizing":
      return <OpeningStudyArt />;
    case "how-to-play-chaos-chess":
      return <ChaosHowToArt />;
    case "best-chaos-chess-modifiers-ranked":
      return <ModifierTierArt />;
    case "most-played-openings-by-rating":
      return <OpeningsDataArt />;
    case "how-often-chess-players-blunder":
      return <BlunderDataArt />;
    case "sicilian-defense-for-beginners":
      return <SicilianArt />;
    case "guess-the-elo-chess":
      return <GuessTheEloChessArt />;
    case "average-centipawn-loss-by-rating":
      return <AverageCentipawnLossByArt />;
    case "guess-elo-from-pgn":
      return <GuessEloFromPgnArt />;
    case "firechess-july-2026-feature-update":
      return <FirechessJuly2026Art />;
    case "shirov-topalov-bh3-sacrifice":
      return <ShirovTopalovBh3Art />;
    case "guess-the-elo-chess":
      return <GuessTheEloChessArt />;
    case "chess-rating-1200-to-1500":
      return <ChessRating1200Art />;
    case "best-chess-openings-for-beginners-by-rating":
      return <BestOpeningsBeginnersArt />;
    case "chess-tactics-every-player-should-know":
      return <TacticsArt />;
    case "lichess-vs-chess-com-improvement":
      return <LichessVsChesscomArt />;
    case "immortal-zugzwang-game-samisch-nimzowitsch":
      return <ImmortalZugzwangArt />;
    case "chess-calculation-training-calculate-variations":
      return <CalculationTrainingArt />;
    case "chess-visualisation-training-3-moves-ahead":
      return <VisualisationTrainingArt />;
    case "london-system-guide-club-players":
      return <LondonSystemArt />;
    case "queens-gambit-guide":
      return <QueensGambitArt />;
    case "average-centipawn-loss-guide":
      return <AverageCentipawnLossGuideArt />;
    case "best-chess-variants-online-2026":
      return <BestChessVariantsArt />;
    case "chess-mistakes-by-rating":
      return <MistakesByRatingArt />;
    case "chess-opening-principles":
      return <OpeningPrinciplesArt />;
    case "chess-opening-traps":
      return <OpeningTrapsArt />;
    case "firechess-vs-aimchess-comparison-2026":
      return <FirechessVsAimchessArt />;
    case "how-to-review-chess-games":
      return <ReviewGamesArt />;
    case "my-opening-tree-chess-repertoire":
      return <OpeningTreeArt />;
    case "caro-kann-defense-guide":
      return <CaroKannArt />;
    case "chess-accuracy-by-rating-guide":
      return <AccuracyRatingArt />;
    case "chess-blunder-patterns-by-rating":
      return <BlunderPatternsArt />;
    case "chess-gambits-for-club-players":
      return <GambitsArt />;
    case "chess-improvement-metrics-to-track":
      return <MetricsArt />;
    case "chess-improvement-mistakes-club-players":
      return <ImprovementMistakesArt />;
    case "chess-pattern-recognition":
      return <PatternRecognitionArt />;
    case "chess-pawn-structure-guide":
      return <PawnStructureArt />;
    case "chess-skill-levels-explained":
      return <SkillLevelsArt />;
    case "chess-thinking-process":
      return <ThinkingProcessArt />;
    case "how-long-to-get-good-at-chess":
      return <HowLongArt />;
    case "how-to-analyze-chess-games-guide":
      return <AnalyzeGuideArt />;
    case "how-to-prepare-for-chess-tournament":
      return <TournamentPrepArt />;
    case "how-to-read-chess-engine-analysis":
      return <EngineReadArt />;
    case "king-and-pawn-endgames-guide":
      return <KingPawnEndgameArt />;
    case "pawn-tension-chess-guide":
      return <PawnTensionArt />;
    case "rook-endgames-guide-club-players":
      return <RookEndgameArt />;
    case "skill-gap-between-rating-levels":
      return <SkillGapArt />;
    case "stop-repeating-chess-mistakes":
      return <StopRepeatingArt />;
    default:
      return <DefaultArt />;
  }
}

/* ================================================================== */
/*  1. Analyze  magnifying glass over chessboard                      */
/* ================================================================== */
function AnalyzeArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="a-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#0a1628" />
        </linearGradient>
        <radialGradient id="a-glow" cx="200" cy="95" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06b6d4" stopOpacity="0.22" /><stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <filter id="a-f"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#a-bg)" />
      <rect width="400" height="200" fill="url(#a-glow)" />
      {/* Board grid */}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <line key={`v${i}`} x1={120+i*20} y1="50" x2={120+i*20} y2="170" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.4" />
      ))}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <line key={`h${i}`} x1="120" y1={50+i*15} x2="280" y2={50+i*15} stroke="#334155" strokeWidth="0.5" strokeOpacity="0.4" />
      ))}
      {/* Dark squares */}
      {[0,1,2,3,4,5,6,7].map(r =>
        [0,1,2,3,4,5,6,7].filter(c => (r + c) % 2 === 1).map(c => (
          <rect key={`s${r}${c}`} x={120+c*20} y={50+r*15} width="20" height="15" fill="#1e293b" fillOpacity="0.5" />
        ))
      )}
      {/* Magnifying glass */}
      <circle cx="200" cy="100" r="48" fill="none" stroke="#67e8f9" strokeWidth="3" strokeOpacity="0.7" filter="url(#a-f)" />
      <circle cx="200" cy="100" r="48" fill="#06b6d4" fillOpacity="0.06" />
      <line x1="234" y1="132" x2="270" y2="168" stroke="#67e8f9" strokeWidth="6" strokeOpacity="0.7" strokeLinecap="round" />
      <line x1="234" y1="132" x2="270" y2="168" stroke="#67e8f9" strokeWidth="12" strokeOpacity="0.12" strokeLinecap="round" />
      {/* Pawn visible through lens */}
      <circle cx="200" cy="82" r="8" fill="#67e8f9" fillOpacity="0.65" />
      <path d="M194,89 L189,112 Q200,117 211,112 L206,89 Z" fill="#67e8f9" fillOpacity="0.55" />
      <ellipse cx="200" cy="114" rx="14" ry="4.5" fill="#67e8f9" fillOpacity="0.5" />
      {/* Analysis lines radiating from piece */}
      <line x1="188" y1="85" x2="148" y2="60" stroke="#10b981" strokeWidth="2" strokeOpacity="0.7" strokeDasharray="4 3">
        <animate attributeName="strokeDashoffset" from="14" to="0" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="212" y1="85" x2="252" y2="60" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.7" strokeDasharray="4 3">
        <animate attributeName="strokeDashoffset" from="14" to="0" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="200" y1="72" x2="200" y2="42" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.7" strokeDasharray="4 3">
        <animate attributeName="strokeDashoffset" from="14" to="0" dur="2s" repeatCount="indefinite" />
      </line>
      {/* Arrow tips */}
      <polygon points="148,60 155,58 153,65" fill="#10b981" fillOpacity="0.7" />
      <polygon points="252,60 245,58 247,65" fill="#ef4444" fillOpacity="0.7" />
      <polygon points="200,42 196,49 204,49" fill="#fbbf24" fillOpacity="0.7" />
      {/* Small piece silhouettes on board */}
      <circle cx="160" cy="72" r="4" fill="#94a3b8" fillOpacity="0.35" />
      <rect x="157" y="75" width="6" height="8" rx="1" fill="#94a3b8" fillOpacity="0.35" />
      <circle cx="240" cy="72" r="4" fill="#94a3b8" fillOpacity="0.35" />
      <rect x="237" y="75" width="6" height="8" rx="1" fill="#94a3b8" fillOpacity="0.35" />
    </svg>
  );
}

/* ================================================================== */
/*  2. Centipawn  eval bar + precision measuring pawn                  */
/* ================================================================== */
function CentipawnArt() {
  return (
    <svg viewBox="0 0 400 220" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="c-bg" x1="0" y1="0" x2="400" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#1a1020" />
        </linearGradient>
        <linearGradient id="c-eval" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22c55e" /><stop offset="0.5" stopColor="#fbbf24" /><stop offset="1" stopColor="#ef4444" />
        </linearGradient>
        <radialGradient id="c-glow" cx="210" cy="110" r="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.28" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="c-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="220" fill="url(#c-bg)" />
      <rect width="400" height="220" fill="url(#c-glow)" />
      {/* Eval bar on left */}
      <rect x="40" y="30" width="18" height="160" rx="9" fill="url(#c-eval)" fillOpacity="0.92" />
      <rect x="40" y="30" width="18" height="160" rx="9" fill="none" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* Slider mark on eval bar */}
      <rect x="36" y="105" width="26" height="4" rx="2" fill="white" fillOpacity="0.8" />
      {/* Tick marks on eval bar */}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <line key={`t${i}`} x1="60" y1={30+i*20} x2="66" y2={30+i*20} stroke="#94a3b8" strokeWidth="0.5" strokeOpacity="0.5" />
      ))}
      {/* Concentric measurement circles around pawn */}
      <circle cx="210" cy="110" r="70" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="3 4" strokeOpacity="0.55" />
      <circle cx="210" cy="110" r="50" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 4" strokeOpacity="0.6" />
      <circle cx="210" cy="110" r="30" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2 3" strokeOpacity="0.7" />
      {/* Cross-hair lines */}
      <line x1="130" y1="110" x2="290" y2="110" stroke="#475569" strokeWidth="0.7" strokeOpacity="0.5" />
      <line x1="210" y1="30" x2="210" y2="190" stroke="#475569" strokeWidth="0.7" strokeOpacity="0.5" />
      {/* Pawn silhouette  precision target */}
      <circle cx="210" cy="88" r="11" fill="#f59e0b" fillOpacity="0.92" />
      <path d="M201,98 L194,132 Q210,139 226,132 L219,98 Z" fill="#f59e0b" fillOpacity="0.85" />
      <ellipse cx="210" cy="134" rx="20" ry="7" fill="#f59e0b" fillOpacity="0.78" />
      {/* Glowing outline on the pawn */}
      <circle cx="210" cy="88" r="11" fill="none" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.8" filter="url(#c-f)" />
      {/* Floating measurement text */}
      <text x="310" y="70" textAnchor="middle" fill="#fbbf24" fillOpacity="0.45" fontSize="28" fontWeight="700">{'±0.3'}</text>
      <text x="320" y="170" textAnchor="middle" fill="#ef4444" fillOpacity="0.4" fontSize="22" fontWeight="700">{'-1.2'}</text>
      <text x="105" y="60" textAnchor="middle" fill="#22c55e" fillOpacity="0.4" fontSize="22" fontWeight="700">{'+0.5'}</text>
    </svg>
  );
}

/* ================================================================== */
/*  3. Losing Openings  storm over board, lightning, toppled pieces    */
/* ================================================================== */
function OpeningsArt() {
  return (
    <svg viewBox="0 0 400 190" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="o-bg" x1="0" y1="0" x2="400" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1e1b4b" /><stop offset="1" stopColor="#0c1220" />
        </linearGradient>
        <radialGradient id="o-flash" cx="185" cy="60" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.18" /><stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id="o-glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="190" fill="url(#o-bg)" />
      <rect width="400" height="190" fill="url(#o-flash)" />
      {/* Storm clouds */}
      <path d="M0,25 Q40,10 90,22 Q130,5 180,20 Q220,8 270,24 Q320,6 370,18 Q390,12 400,20 L400,0 L0,0 Z" fill="#1e1b4b" fillOpacity="0.85" />
      <path d="M0,38 Q60,22 120,35 Q180,18 240,32 Q300,14 360,28 Q390,20 400,32 L400,0 L0,0 Z" fill="#0f172a" fillOpacity="0.7" />
      {/* Lightning bolt */}
      <path d="M185,22 L175,55 L190,50 L170,88 L195,78 L162,135" fill="none" stroke="#fbbf24" strokeWidth="3" strokeOpacity="0.9" strokeLinejoin="round" filter="url(#o-glow)">
        <animate attributeName="opacity" values="1;0.3;1;0.6;1" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M185,22 L175,55 L190,50 L170,88 L195,78 L162,135" fill="none" stroke="#fbbf24" strokeWidth="10" strokeOpacity="0.1" strokeLinejoin="round" />
      {/* Board surface */}
      <path d="M60,140 L340,140 L320,185 L80,185 Z" fill="#1e293b" fillOpacity="0.6" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.4" />
      {/* Standing king  dark, ominous */}
      <g transform="translate(250,105)">
        <rect x="-1.5" y="-32" width="3" height="7" fill="#cbd5e1" fillOpacity="0.7" />
        <rect x="-4" y="-29" width="8" height="3" fill="#cbd5e1" fillOpacity="0.7" />
        <circle cx="0" cy="-20" r="7" fill="#cbd5e1" fillOpacity="0.6" />
        <path d="M-5,-14 L-9,2 Q0,6 9,2 L5,-14 Z" fill="#cbd5e1" fillOpacity="0.6" />
        <ellipse cx="0" cy="4" rx="12" ry="4" fill="#cbd5e1" fillOpacity="0.5" />
      </g>
      {/* Toppled pawn (rotated) */}
      <g transform="translate(160,142) rotate(70)">
        <circle cx="0" cy="-12" r="5" fill="#94a3b8" fillOpacity="0.45" />
        <path d="M-3,-8 L-5,5 Q0,8 5,5 L3,-8 Z" fill="#94a3b8" fillOpacity="0.45" />
        <ellipse cx="0" cy="6" rx="7" ry="2.5" fill="#94a3b8" fillOpacity="0.4" />
      </g>
      {/* Toppled knight (rotated) */}
      <g transform="translate(290,148) rotate(-55)">
        <path d="M-5,6 L-7,-12 Q-8,-22 -2,-26 L0,-28 Q3,-25 5,-22 L7,-16 Q9,-12 7,-8 L7,0 Q4,3 -3,3 Z" fill="#94a3b8" fillOpacity="0.45" />
        <circle cx="-1" cy="-20" r="1.5" fill="#0c1220" fillOpacity="0.5" />
      </g>
      {/* Rain streaks */}
      {[80,130,200,260,310,350].map((x,i) => (
        <line key={`r${i}`} x1={x} y1={30+i*5} x2={x-4} y2={45+i*5} stroke="#94a3b8" strokeWidth="0.6" strokeOpacity="0.3" />
      ))}
    </svg>
  );
}

/* ================================================================== */
/*  4. Weaknesses  spotlight cone revealing cracks                    */
/* ================================================================== */
function WeaknessesArt() {
  return (
    <svg viewBox="0 0 400 230" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="w-bg" x1="0" y1="0" x2="400" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#14102a" />
        </linearGradient>
        <linearGradient id="w-spot" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#fef9c3" stopOpacity="0.22" /><stop offset="1" stopColor="#fef9c3" stopOpacity="0" />
        </linearGradient>
        <filter id="w-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="230" fill="url(#w-bg)" />
      {/* Spotlight cone from above */}
      <path d="M200,0 L120,230 L280,230 Z" fill="url(#w-spot)" />
      <line x1="200" y1="0" x2="120" y2="230" stroke="#fef9c3" strokeWidth="0.8" strokeOpacity="0.12" />
      <line x1="200" y1="0" x2="280" y2="230" stroke="#fef9c3" strokeWidth="0.8" strokeOpacity="0.12" />
      {/* Ground surface */}
      <rect x="0" y="170" width="400" height="60" fill="#1e293b" fillOpacity="0.5" />
      <line x1="0" y1="170" x2="400" y2="170" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* Cracks in the ground (illuminated) */}
      <g stroke="#ef4444" strokeWidth="1.5" fill="none" strokeOpacity="0.6">
        <path d="M180,172 L185,185 L175,195 L182,210" />
        <path d="M210,174 L218,188 L212,200 L220,215" />
        <path d="M195,180 L200,175 L208,182" />
        <path d="M170,185 L178,190" />
        <path d="M222,190 L230,198" />
      </g>
      {/* Queen silhouette in spotlight */}
      <g transform="translate(200,130)">
        <circle cx="0" cy="-38" r="3.5" fill="#fbbf24" fillOpacity="0.7" />
        <path d="M-10,-26 L-8,-34 L-4,-28 L0,-36 L4,-28 L8,-34 L10,-26 Z" fill="#fbbf24" fillOpacity="0.6" />
        <circle cx="0" cy="-22" r="10" fill="#fbbf24" fillOpacity="0.55" />
        <path d="M-7,-14 L-12,4 Q0,9 12,4 L7,-14 Z" fill="#fbbf24" fillOpacity="0.55" />
        <ellipse cx="0" cy="6" rx="16" ry="5.5" fill="#fbbf24" fillOpacity="0.45" />
      </g>
      {/* Long shadow from queen */}
      <polygon points="184,170 165,230 235,230 216,170" fill="black" fillOpacity="0.25" />
      {/* Source lamp circle at top */}
      <circle cx="200" cy="6" r="8" fill="#fef9c3" fillOpacity="0.3" filter="url(#w-f)" />
      <circle cx="200" cy="6" r="3" fill="#fef9c3" fillOpacity="0.6" />
    </svg>
  );
}

/* ================================================================== */
/*  5. Endgame Patterns  moonlit scene, lone king, distant rook       */
/* ================================================================== */
function EndgameArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="e-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="0.6" stopColor="#0f172a" /><stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>
        <radialGradient id="e-moon" cx="320" cy="40" r="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fef9c3" stopOpacity="0.2" /><stop offset="1" stopColor="#fef9c3" stopOpacity="0" />
        </radialGradient>
        <filter id="e-f"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#e-bg)" />
      <rect width="400" height="200" fill="url(#e-moon)" />
      {/* Stars */}
      {[[60,20],[140,35],[220,15],[280,45],[360,25],[40,50],[180,55]].map(([x,y],i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={1+i*0.15} fill="#fef9c3" fillOpacity={0.35+i*0.03}>
          <animate attributeName="opacity" values={`${0.35+i*0.03};${0.1};${0.35+i*0.03}`} dur={`${2+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Moon */}
      <circle cx="320" cy="40" r="22" fill="#fef9c3" fillOpacity="0.15" filter="url(#e-f)" />
      <circle cx="320" cy="40" r="16" fill="#fef9c3" fillOpacity="0.25" />
      <circle cx="314" cy="36" r="13" fill="url(#e-bg)" fillOpacity="0.7" />
      {/* Ground / horizon */}
      <rect x="0" y="140" width="400" height="60" fill="#1e293b" fillOpacity="0.4" />
      <line x1="0" y1="140" x2="400" y2="140" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.45" />
      {/* Lone king walking */}
      <g transform="translate(150,102)">
        <rect x="-2" y="-36" width="4" height="8" fill="#cbd5e1" fillOpacity="0.75" />
        <rect x="-5" y="-33" width="10" height="4" fill="#cbd5e1" fillOpacity="0.75" />
        <circle cx="0" cy="-22" r="9" fill="#cbd5e1" fillOpacity="0.65" />
        <path d="M-6,-14 L-11,5 Q0,10 11,5 L6,-14 Z" fill="#cbd5e1" fillOpacity="0.65" />
        <ellipse cx="0" cy="7" rx="14" ry="5" fill="#cbd5e1" fillOpacity="0.5" />
      </g>
      {/* King's long moonlit shadow */}
      <polygon points="136,140 120,190 180,190 164,140" fill="black" fillOpacity="0.2" />
      {/* Distant rook  smaller, further right */}
      <g transform="translate(310,125) scale(0.6)">
        <rect x="-10" y="-26" width="20" height="22" rx="1" fill="#94a3b8" fillOpacity="0.5" />
        <rect x="-12" y="-30" width="5" height="6" fill="#94a3b8" fillOpacity="0.5" />
        <rect x="-3" y="-30" width="5" height="6" fill="#94a3b8" fillOpacity="0.5" />
        <rect x="6" y="-30" width="5" height="6" fill="#94a3b8" fillOpacity="0.5" />
        <ellipse cx="0" cy="0" rx="14" ry="5" fill="#94a3b8" fillOpacity="0.4" />
      </g>
      {/* Footprints (dots) from king */}
      {[0,1,2,3].map(i => (
        <circle key={`fp${i}`} cx={175+i*20} cy={142+i*3} r="1.5" fill="#64748b" fillOpacity={0.35 - i*0.06} />
      ))}
    </svg>
  );
}

/* ================================================================== */
/*  6. Free Tools  forge/workshop scene with glowing piece on anvil   */
/* ================================================================== */
function FreeToolsArt() {
  return (
    <svg viewBox="0 0 400 230" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ft-bg" x1="0" y1="0" x2="400" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#1c1008" />
        </linearGradient>
        <radialGradient id="ft-heat" cx="200" cy="115" r="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f97316" stopOpacity="0.25" /><stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <filter id="ft-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="230" fill="url(#ft-bg)" />
      <rect width="400" height="230" fill="url(#ft-heat)" />
      {/* Anvil */}
      <path d="M155,155 L160,128 L240,128 L245,155 L270,162 L130,162 Z" fill="#4b5563" stroke="#6b7280" strokeWidth="0.8" />
      <rect x="160" y="122" width="80" height="8" rx="2" fill="#6b7280" />
      {/* Anvil base */}
      <rect x="175" y="162" width="50" height="30" fill="#4b5563" stroke="#6b7280" strokeWidth="0.5" />
      <rect x="165" y="188" width="70" height="8" rx="2" fill="#4b5563" />
      {/* Glowing pawn being forged */}
      <g transform="translate(200,95)" filter="url(#ft-f)">
        <circle cx="0" cy="-10" r="8" fill="#f97316" fillOpacity="0.85" />
        <path d="M-5,-3 L-8,18 Q0,23 8,18 L5,-3 Z" fill="#f97316" fillOpacity="0.75" />
        <ellipse cx="0" cy="20" rx="12" ry="4" fill="#f97316" fillOpacity="0.65" />
      </g>
      {/* Sparks flying up */}
      {[[185,80],[195,65],[210,72],[215,58],[188,55],[220,85]].map(([x,y],i) => (
        <circle key={`sp${i}`} cx={x} cy={y} r={1.2+i*0.25} fill="#fbbf24" fillOpacity={0.8-i*0.08}>
          <animate attributeName="cy" from={`${y}`} to={`${y-15}`} dur={`${1+i*0.3}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur={`${1+i*0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Hammer resting to the right */}
      <rect x="280" y="110" width="35" height="16" rx="3" fill="#9ca3af" stroke="#6b7280" strokeWidth="0.5" />
      <rect x="294" y="126" width="7" height="45" rx="2" fill="#a8a29e" />
      {/* Tongs on the left */}
      <line x1="100" y1="100" x2="155" y2="130" stroke="#9ca3af" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="105" y1="108" x2="155" y2="134" stroke="#9ca3af" strokeWidth="3.5" strokeLinecap="round" />
      {/* Stone wall background */}
      <g stroke="#475569" strokeWidth="0.5" fill="none" strokeOpacity="0.25">
        <line x1="30" y1="40" x2="30" y2="200" /><line x1="60" y1="20" x2="60" y2="200" />
        <line x1="340" y1="20" x2="340" y2="200" /><line x1="370" y1="40" x2="370" y2="200" />
        <line x1="20" y1="60" x2="70" y2="60" /><line x1="20" y1="100" x2="70" y2="100" />
        <line x1="330" y1="60" x2="380" y2="60" /><line x1="330" y1="100" x2="380" y2="100" />
      </g>
      {/* Heat shimmer at the bottom */}
      <line x1="140" y1="200" x2="260" y2="200" stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.12" />
    </svg>
  );
}

/* ================================================================== */
/*  7. Time Management  hourglass with chess piece inside             */
/* ================================================================== */
function TimeArt() {
  return (
    <svg viewBox="0 0 400 190" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="t-bg" x1="0" y1="0" x2="400" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#14102a" />
        </linearGradient>
        <radialGradient id="t-glow" cx="200" cy="95" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06b6d4" stopOpacity="0.28" /><stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <filter id="t-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="190" fill="url(#t-bg)" />
      <rect width="400" height="190" fill="url(#t-glow)" />
      {/* Hourglass frame */}
      <rect x="158" y="18" width="84" height="6" rx="3" fill="#94a3b8" fillOpacity="0.85" />
      <rect x="158" y="166" width="84" height="6" rx="3" fill="#94a3b8" fillOpacity="0.85" />
      {/* Hourglass glass shape */}
      <path d="M165,24 L165,68 Q200,100 200,95 Q200,100 235,68 L235,24 Z" fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeOpacity="0.8" />
      <path d="M165,166 L165,122 Q200,90 200,95 Q200,90 235,122 L235,166 Z" fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeOpacity="0.8" />
      {/* Sand in top chamber */}
      <path d="M168,55 Q185,62 200,58 Q215,62 232,55 L216,80 Q200,88 184,80 Z" fill="#f59e0b" fillOpacity="0.6" />
      {/* Sand stream */}
      <line x1="200" y1="90" x2="200" y2="115" stroke="#f59e0b" strokeWidth="2.5" strokeOpacity="0.8">
        <animate attributeName="strokeDashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
      </line>
      {/* Sand pile at bottom */}
      <path d="M182,158 Q192,148 200,145 Q208,148 218,158" fill="#f59e0b" fillOpacity="0.55" />
      <path d="M172,162 Q186,152 200,148 Q214,152 228,162" fill="#f59e0b" fillOpacity="0.4" />
      {/* Knight piece inside top chamber */}
      <g transform="translate(200,45) scale(0.7)">
        <path d="M-5,6 L-7,-12 Q-8,-22 -2,-26 L0,-28 Q3,-25 5,-22 L7,-16 Q9,-12 7,-8 L7,0 Q4,3 -3,3 Z" fill="#67e8f9" fillOpacity="0.85" />
        <circle cx="-1" cy="-20" r="1.5" fill="#0c1220" fillOpacity="0.7" />
        <ellipse cx="0" cy="6" rx="8" ry="3" fill="#67e8f9" fillOpacity="0.75" />
      </g>
      {/* Clock tick marks around hourglass */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = 200 + Math.cos(rad) * 115;
        const y = 95 + Math.sin(rad) * 85;
        return <circle key={`ck${i}`} cx={x} cy={y} r="2.5" fill="#64748b" fillOpacity="0.5" />;
      })}
      {/* Time pressure text watermark */}
      <text x="65" y="100" textAnchor="middle" fill="white" fillOpacity="0.1" fontSize="32" fontWeight="700">{'0:30'}</text>
      <text x="335" y="100" textAnchor="middle" fill="white" fillOpacity="0.1" fontSize="32" fontWeight="700">{'5:00'}</text>
    </svg>
  );
}

/* ================================================================== */
/*  8. Stop Blundering  knight teetering on cliff edge                */
/* ================================================================== */
function BlunderArt() {
  return (
    <svg viewBox="0 0 400 220" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="b-bg" x1="0" y1="0" x2="400" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#14102a" />
        </linearGradient>
        <linearGradient id="b-chasm" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#0f172a" /><stop offset="1" stopColor="#000000" />
        </linearGradient>
        <radialGradient id="b-back" cx="230" cy="80" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.18" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <filter id="b-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="220" fill="url(#b-bg)" />
      <rect width="400" height="220" fill="url(#b-back)" />
      {/* Cliff surface */}
      <path d="M0,130 L210,130 L215,132 L218,140 L220,220 L0,220 Z" fill="#1e293b" fillOpacity="0.7" />
      <line x1="0" y1="130" x2="210" y2="130" stroke="#64748b" strokeWidth="1.2" strokeOpacity="0.6" />
      {/* Cliff edge cracks */}
      <g stroke="#64748b" strokeWidth="0.7" fill="none" strokeOpacity="0.45">
        <path d="M205,130 L202,142 L207,155" />
        <path d="M195,130 L193,138" />
        <path d="M180,130 L182,140 L178,148" />
      </g>
      {/* Chasm / void */}
      <rect x="218" y="130" width="182" height="90" fill="url(#b-chasm)" fillOpacity="0.8" />
      {/* Far cliff wall */}
      <path d="M320,160 L320,220 L400,220 L400,160 L325,155 Z" fill="#1e293b" fillOpacity="0.4" />
      <line x1="320" y1="160" x2="400" y2="160" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.35" />
      {/* Knight on the cliff edge, tilted dangerously */}
      <g transform="translate(205,90) rotate(12)">
        <path d="M-8,10 L-10,-16 Q-12,-28 -5,-34 L-3,-36 Q1,-33 4,-30 L7,-22 Q10,-18 8,-12 L8,2 Q5,6 -5,6 Z" fill="#cbd5e1" fillOpacity="0.75" />
        <circle cx="-3" cy="-26" r="2.5" fill="#0c1220" fillOpacity="0.5" />
        <ellipse cx="0" cy="10" rx="12" ry="4" fill="#cbd5e1" fillOpacity="0.6" />
      </g>
      {/* Dramatic backlight behind knight */}
      <circle cx="230" cy="85" r="45" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.15" filter="url(#b-f)" />
      {/* Falling pebbles from edge */}
      {[[222,145],[228,155],[232,148],[226,162]].map(([x,y],i) => (
        <circle key={`p${i}`} cx={x} cy={y} r={2-i*0.3} fill="#64748b" fillOpacity={0.4-i*0.06}>
          <animate attributeName="cy" from={`${y}`} to={`${y+30}`} dur={`${1.5+i*0.4}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur={`${1.5+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Danger exclamation mark */}
      <g filter="url(#b-f)" opacity="0.75">
        <text x="270" y="80" textAnchor="middle" fill="#ef4444" fontSize="40" fontWeight="900">{'!'}</text>
      </g>
    </svg>
  );
}

/* ================================================================== */
/*  9. Rating Plateau  pawn climbing stone stairs toward crown         */
/* ================================================================== */
function PlateauArt() {
  return (
    <svg viewBox="0 0 400 190" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="p-bg" x1="0" y1="0" x2="400" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#14102a" />
        </linearGradient>
        <radialGradient id="p-crown" cx="330" cy="35" r="70" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.25" /><stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id="p-f"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="190" fill="url(#p-bg)" />
      <rect width="400" height="190" fill="url(#p-crown)" />
      {/* Stone stairs going up-right */}
      {[
        [50, 150, 65, 18],
        [115, 130, 65, 18],
        [180, 110, 65, 18],
        [245, 90, 65, 18],
        [310, 70, 65, 18],
      ].map(([x, y, w, h], i) => (
        <g key={`st${i}`}>
          <rect x={x} y={y} width={w} height={h} fill="#1e293b" fillOpacity={0.7 - i * 0.03} stroke="#475569" strokeWidth="0.8" strokeOpacity="0.45" />
          {/* Stone texture lines */}
          <line x1={x + 15} y1={y} x2={x + 15} y2={y + h} stroke="#475569" strokeWidth="0.4" strokeOpacity="0.25" />
          <line x1={x + 40} y1={y} x2={x + 40} y2={y + h} stroke="#475569" strokeWidth="0.4" strokeOpacity="0.25" />
        </g>
      ))}
      {/* Stair vertical faces */}
      {[
        [115, 130, 20],
        [180, 110, 20],
        [245, 90, 20],
        [310, 70, 20],
      ].map(([x, y, h], i) => (
        <rect key={`sf${i}`} x={x} y={y} width={65} height={h} fill="#0f172a" fillOpacity="0.5" />
      ))}
      {/* Pawn at bottom step */}
      <g transform="translate(82,120)">
        <circle cx="0" cy="-14" r="7" fill="#06b6d4" fillOpacity="0.8" />
        <path d="M-4,-8 L-7,10 Q0,14 7,10 L4,-8 Z" fill="#06b6d4" fillOpacity="0.7" />
        <ellipse cx="0" cy="12" rx="10" ry="3.5" fill="#06b6d4" fillOpacity="0.6" />
      </g>
      {/* Glowing crown at top */}
      <g transform="translate(342,48)" filter="url(#p-f)">
        <path d="M-12,8 L-10,0 L-5,5 L0,-3 L5,5 L10,0 L12,8 Z" fill="#fbbf24" fillOpacity="0.85" />
        <rect x="-12" y="8" width="24" height="5" rx="1" fill="#fbbf24" fillOpacity="0.75" />
        <circle cx="-5" cy="5" r="1.5" fill="#fbbf24" fillOpacity="0.95" />
        <circle cx="5" cy="5" r="1.5" fill="#fbbf24" fillOpacity="0.95" />
        <circle cx="0" cy="-1" r="1.5" fill="#fbbf24" fillOpacity="0.95" />
      </g>
      {/* Dashed path showing the climb */}
      <path d="M82,135 L147,115 L212,95 L277,75 L342,55" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.55">
        <animate attributeName="strokeDashoffset" from="14" to="0" dur="2s" repeatCount="indefinite" />
      </path>
      {/* Rating numbers watermark */}
      <text x="60" y="180" fill="white" fillOpacity="0.06" fontSize="14">{'800'}</text>
      <text x="320" y="60" fill="white" fillOpacity="0.06" fontSize="14">{'2000'}</text>
    </svg>
  );
}

/* ================================================================== */
/*  10. Middlegame Strategy  compass with chess king at center         */
/* ================================================================== */
function MiddlegameArt() {
  return (
    <svg viewBox="0 0 400 230" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="m-bg" x1="0" y1="0" x2="400" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#14102a" />
        </linearGradient>
        <radialGradient id="m-glow" cx="200" cy="115" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.15" /><stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <filter id="m-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="230" fill="url(#m-bg)" />
      <rect width="400" height="230" fill="url(#m-glow)" />
      {/* Compass circles */}
      <circle cx="200" cy="115" r="85" fill="none" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx="200" cy="115" r="75" fill="none" stroke="#64748b" strokeWidth="0.8" strokeOpacity="0.35" />
      <circle cx="200" cy="115" r="65" fill="none" stroke="#475569" strokeWidth="0.5" strokeOpacity="0.25" />
      {/* Compass tick marks on outer ring */}
      {Array.from({ length: 36 }).map((_, i) => {
        const deg = i * 10;
        const rad = (deg * Math.PI) / 180;
        const inner = deg % 90 === 0 ? 78 : 82;
        const x1 = 200 + Math.cos(rad) * inner;
        const y1 = 115 + Math.sin(rad) * inner;
        const x2 = 200 + Math.cos(rad) * 85;
        const y2 = 115 + Math.sin(rad) * 85;
        return <line key={`cm${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth={deg % 90 === 0 ? 2 : 0.5} strokeOpacity={deg % 90 === 0 ? 0.6 : 0.25} />;
      })}
      {/* Cardinal directional arrows */}
      {/* North  Attack (red) */}
      <polygon points="200,30 194,48 206,48" fill="#ef4444" fillOpacity="0.8" />
      <line x1="200" y1="48" x2="200" y2="60" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.5" />
      {/* East  Positional (green) */}
      <polygon points="290,115 272,109 272,121" fill="#10b981" fillOpacity="0.8" />
      <line x1="260" y1="115" x2="272" y2="115" stroke="#10b981" strokeWidth="2" strokeOpacity="0.5" />
      {/* South  Endgame (cyan) */}
      <polygon points="200,200 194,182 206,182" fill="#06b6d4" fillOpacity="0.8" />
      <line x1="200" y1="170" x2="200" y2="182" stroke="#06b6d4" strokeWidth="2" strokeOpacity="0.5" />
      {/* West  Defense (amber) */}
      <polygon points="110,115 128,109 128,121" fill="#f59e0b" fillOpacity="0.8" />
      <line x1="128" y1="115" x2="140" y2="115" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.5" />
      {/* King piece at compass center */}
      <g transform="translate(200,110)">
        <rect x="-1.5" y="-24" width="3" height="7" fill="#e2e8f0" fillOpacity="0.8" />
        <rect x="-4" y="-21" width="8" height="3" fill="#e2e8f0" fillOpacity="0.8" />
        <circle cx="0" cy="-14" r="7" fill="#e2e8f0" fillOpacity="0.65" />
        <path d="M-5,-8 L-8,10 Q0,14 8,10 L5,-8 Z" fill="#e2e8f0" fillOpacity="0.65" />
        <ellipse cx="0" cy="12" rx="10" ry="3.5" fill="#e2e8f0" fillOpacity="0.5" />
      </g>
      {/* Glowing center dot */}
      <circle cx="200" cy="115" r="4" fill="#22c55e" fillOpacity="0.5" filter="url(#m-f)" />
      {/* Compass needle pointing NE */}
      <line x1="200" y1="115" x2="240" y2="70" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="200" y1="115" x2="160" y2="160" stroke="#e2e8f0" strokeWidth="1.5" strokeOpacity="0.2" />
    </svg>
  );
}

/* ================================================================== */
/*  11. Chaos Chess  stormy board, glowing modified pieces, purple    */
/* ================================================================== */
function ChaosArt() {
  return (
    <svg viewBox="0 0 400 210" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ch-bg" x1="0" y1="0" x2="400" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0618" /><stop offset="1" stopColor="#0d0520" />
        </linearGradient>
        <radialGradient id="ch-center" cx="200" cy="105" r="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0.22" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ch-left" cx="95" cy="130" r="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.18" /><stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ch-right" cx="305" cy="118" r="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.18" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <filter id="ch-glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="ch-soft"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="210" fill="url(#ch-bg)" />
      <rect width="400" height="210" fill="url(#ch-center)" />
      <rect width="400" height="210" fill="url(#ch-left)" />
      <rect width="400" height="210" fill="url(#ch-right)" />

      {/* Chessboard grid (subtle, warped feel) */}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <line key={`cv${i}`} x1={115+i*22} y1="48" x2={115+i*22} y2="172" stroke="#2d1a5a" strokeWidth="0.5" strokeOpacity="0.7" />
      ))}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <line key={`ch${i}`} x1="115" y1={48+i*15.5} x2="291" y2={48+i*15.5} stroke="#2d1a5a" strokeWidth="0.5" strokeOpacity="0.7" />
      ))}
      {[0,1,2,3,4,5,6,7].map(r =>
        [0,1,2,3,4,5,6,7].filter(c => (r+c)%2===1).map(c => (
          <rect key={`sq${r}${c}`} x={115+c*22} y={48+r*15.5} width="22" height="15.5" fill="#1e0f3a" fillOpacity="0.55" />
        ))
      )}

      {/* Lightning arc across the board */}
      <path d="M115,105 L148,92 L160,110 L185,88 L200,105 L222,80 L240,100 L265,85 L291,105"
        fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.55" strokeLinejoin="round"
        filter="url(#ch-glow)">
        <animate attributeName="opacity" values="0.55;0.15;0.55;0.35;0.55" dur="3.5s" repeatCount="indefinite" />
      </path>

      {/* Queen — nuclear glow (centre) */}
      <g transform="translate(200,100)" filter="url(#ch-glow)">
        <circle cx="0" cy="-20" r="3" fill="#a855f7" fillOpacity="0.6" />
        <path d="M-7,-14 L-7,-20 L-3,-16 L0,-22 L3,-16 L7,-20 L7,-14 Z" fill="#a855f7" fillOpacity="0.55" />
        <circle cx="0" cy="-10" r="8" fill="#a855f7" fillOpacity="0.45" />
        <path d="M-5,-4 L-8,10 Q0,14 8,10 L5,-4 Z" fill="#a855f7" fillOpacity="0.5" />
        <ellipse cx="0" cy="12" rx="12" ry="4" fill="#a855f7" fillOpacity="0.4" />
        {/* ☢️ badge */}
        <circle cx="9" cy="-22" r="5" fill="#22c55e" fillOpacity="0.8" />
        <text x="9" y="-19" textAnchor="middle" fill="white" fontSize="6" fontWeight="700">{"☢"}</text>
      </g>

      {/* Knight — ghost (left) */}
      <g transform="translate(95,128)" opacity="0.6">
        <path d="M-6,6 L-8,-14 Q-9,-24 -3,-28 L-1,-30 Q2,-27 4,-24 L6,-18 Q8,-14 6,-9 L6,-1 Q3,2 -4,2 Z"
          fill="#94a3b8" fillOpacity="0.4" filter="url(#ch-soft)" />
        <ellipse cx="0" cy="6" rx="9" ry="3" fill="#94a3b8" fillOpacity="0.35" />
        {/* 👻 badge */}
        <circle cx="8" cy="-28" r="5" fill="#7c3aed" fillOpacity="0.85" />
        <text x="8" y="-25" textAnchor="middle" fill="white" fontSize="6">{"👻"}</text>
      </g>

      {/* Rook — collateral (right) */}
      <g transform="translate(305,115)">
        <rect x="-9" y="-22" width="18" height="20" rx="1" fill="#ef4444" fillOpacity="0.35" />
        <rect x="-11" y="-26" width="5" height="6" fill="#ef4444" fillOpacity="0.4" />
        <rect x="-3" y="-26" width="5" height="6" fill="#ef4444" fillOpacity="0.4" />
        <rect x="5" y="-26" width="5" height="6" fill="#ef4444" fillOpacity="0.4" />
        <ellipse cx="0" cy="0" rx="12" ry="4" fill="#ef4444" fillOpacity="0.35" />
        {/* 💥 badge */}
        <circle cx="10" cy="-26" r="5" fill="#ef4444" fillOpacity="0.85" />
        <text x="10" y="-23" textAnchor="middle" fill="white" fontSize="6">{"💥"}</text>
      </g>

      {/* Draft card silhouettes floating above */}
      {[[-70,-2,"#22c55e","COMMON"],[0,-12,"#a855f7","EPIC"],[70,-2,"#3b82f6","RARE"]].map(([dx, dy, col, lbl], i) => (
        <g key={`card${i}`} transform={`translate(${200+(dx as number)},${38+(dy as number)})`}>
          <rect x="-14" y="-16" width="28" height="34" rx="4"
            fill="#13082a" fillOpacity="0.8"
            stroke={col as string} strokeOpacity={i===1?0.8:0.35} strokeWidth={i===1?1.5:1} />
          <text x="0" y="-4" textAnchor="middle" fill={col as string} fillOpacity="0.85" fontSize="5" fontWeight="700">{lbl as string}</text>
          <rect x="-8" y="0" width="16" height="1.5" rx="0.8" fill={col as string} fillOpacity="0.35" />
          <rect x="-6" y="4" width="12" height="1.5" rx="0.8" fill={col as string} fillOpacity="0.25" />
          <rect x="-6" y="8" width="10" height="1.5" rx="0.8" fill={col as string} fillOpacity="0.2" />
        </g>
      ))}

      {/* "DRAFT PHASE" watermark text */}
      <text x="200" y="196" textAnchor="middle" fill="white" fillOpacity="0.06" fontSize="18" fontWeight="900" letterSpacing="3">{"DRAFT PHASE"}</text>
    </svg>
  );
}

/* ================================================================== */
/*  Default  atmospheric chess silhouette                              */
/* ================================================================== */
function AccuracyArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="acBg2" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#080d1a" /><stop offset="1" stopColor="#0d1425" />
        </linearGradient>
        <radialGradient id="acG12" cx="200" cy="100" r="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.07" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="acG22" cx="500" cy="180" r="180" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" stopOpacity="0.07" /><stop offset="1" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <filter id="acGlow2"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ef4444" /><stop offset="0.5" stopColor="#f59e0b" /><stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#acBg2)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <rect width="680" height="280" rx="18" fill="url(#acG12)" />
      <rect width="680" height="280" rx="18" fill="url(#acG22)" />
      <text x="340" y="34" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui">Chess Accuracy Explained</text>
      {/* Gauge arc */}
      <g transform="translate(170,155)">
        <path d="M -85 0 A 85 85 0 0 1 85 0" stroke="#1e293b" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M -85 0 A 85 85 0 0 1 70 -45" stroke="#6366f1" strokeWidth="14" fill="none" strokeLinecap="round" />
        <line x1="0" y1="0" x2="67" y2="-43" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round" filter="url(#acGlow2)" />
        <circle r="7" fill="#6366f1" filter="url(#acGlow2)" />
        <text y="26" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="system-ui" filter="url(#acGlow2)">94%</text>
        <text y="44" textAnchor="middle" fill="#a5b4fc" fontSize="12" fontFamily="system-ui">Accuracy</text>
        <text x="-90" y="14" fill="#ef4444" fontSize="10" textAnchor="middle" fontFamily="system-ui">0</text>
        <text x="0" y="-92" fill="#f59e0b" fontSize="10" textAnchor="middle" fontFamily="system-ui">50</text>
        <text x="90" y="14" fill="#10b981" fontSize="10" textAnchor="middle" fontFamily="system-ui">100</text>
      </g>
      {/* Bracket bars */}
      <g transform="translate(360, 55)">
        {[
          { label: "1000–1200", val: 60, color: "#ef4444" },
          { label: "1200–1600", val: 74, color: "#f59e0b" },
          { label: "1600–2000", val: 87, color: "#22d3ee" },
          { label: "2000–2400", val: 93, color: "#10b981" },
          { label: "2400+ GM", val: 100, color: "#a5b4fc" },
        ].map((row, i) => (
          <g key={row.label} transform={`translate(0, ${i * 38})`}>
            <rect width="280" height="30" rx="6" fill="#0f172a" fillOpacity="0.7" stroke="#1e293b" />
            <text x="10" y="19" fill="#94a3b8" fontSize="11" fontFamily="system-ui">{row.label}</text>
            <rect x="120" y="8" width="110" height="10" rx="4" fill="#1e293b" />
            <rect x="120" y="8" width={row.val * 1.1} height="10" rx="4" fill={row.color} fillOpacity="0.7" />
            <text x="240" y="18" fill={row.color} fontSize="11" fontFamily="system-ui">~{row.val}%</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function ImproveArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="impBg2" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#080c18" /><stop offset="1" stopColor="#0e1422" />
        </linearGradient>
        <radialGradient id="impG2" cx="340" cy="140" r="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.06" /><stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <filter id="impF2"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#impBg2)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <rect width="680" height="280" rx="18" fill="url(#impG2)" />
      <text x="340" y="34" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui">The Improvement Triangle</text>
      {/* Triangle */}
      <polygon points="340,60 90,245 590,245" fill="none" stroke="#334155" strokeWidth="1.5" />
      <polygon points="340,60 215,153 340,153" fill="#6366f1" fillOpacity="0.07" />
      <polygon points="340,60 465,153 340,153" fill="#10b981" fillOpacity="0.07" />
      <polygon points="215,153 90,245 340,245" fill="#f59e0b" fillOpacity="0.07" />
      <polygon points="465,153 590,245 340,245" fill="#22d3ee" fillOpacity="0.07" />
      <line x1="340" y1="60" x2="340" y2="245" stroke="#1e293b" strokeWidth="1" />
      <line x1="215" y1="153" x2="465" y2="153" stroke="#1e293b" strokeWidth="1" />
      {/* Apex: Tactics */}
      <circle cx="340" cy="60" r="26" fill="#6366f1" fillOpacity="0.12" stroke="#6366f1" strokeOpacity="0.3" />
      <text x="340" y="57" textAnchor="middle" fill="#a5b4fc" fontSize="12" fontWeight="700" fontFamily="system-ui">TACTICS</text>
      <text x="340" y="70" textAnchor="middle" fill="#818cf8" fontSize="9" fontFamily="system-ui">highest ROI</text>
      {/* Left: Endgame */}
      <circle cx="140" cy="222" r="28" fill="#f59e0b" fillOpacity="0.10" stroke="#f59e0b" strokeOpacity="0.25" />
      <text x="140" y="219" textAnchor="middle" fill="#fcd34d" fontSize="11" fontWeight="700" fontFamily="system-ui">ENDGAME</text>
      <text x="140" y="231" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="system-ui">technique</text>
      {/* Right: Opening */}
      <circle cx="540" cy="222" r="28" fill="#22d3ee" fillOpacity="0.10" stroke="#22d3ee" strokeOpacity="0.25" />
      <text x="540" y="219" textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="700" fontFamily="system-ui">OPENING</text>
      <text x="540" y="231" textAnchor="middle" fill="#22d3ee" fontSize="9" fontFamily="system-ui">structure</text>
      {/* Center: Analysis */}
      <circle cx="340" cy="178" r="24" fill="#10b981" fillOpacity="0.12" stroke="#10b981" strokeOpacity="0.3" />
      <text x="340" y="175" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="700" fontFamily="system-ui">ANALYSIS</text>
      <text x="340" y="189" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="system-ui">the glue</text>
    </svg>
  );
}

function BrilliantArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brBg2" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#080a16" /><stop offset="1" stopColor="#0b0e1e" />
        </linearGradient>
        <radialGradient id="brGl2" cx="340" cy="140" r="230" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06b6d4" stopOpacity="0.1" /><stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <filter id="brF3"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="brF4"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#brBg2)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <rect width="680" height="280" rx="18" fill="url(#brGl2)" />
      {/* Central diamond */}
      <g transform="translate(340, 140)">
        <circle r="70" fill="#06b6d4" fillOpacity="0.05" filter="url(#brF3)" />
        <circle r="52" fill="#06b6d4" fillOpacity="0.07" />
        <polygon points="0,-42 28,0 0,42 -28,0" fill="#06b6d4" fillOpacity="0.18" stroke="#06b6d4" strokeWidth="1.5" filter="url(#brF4)" />
        <polygon points="0,-42 28,0 0,42 -28,0" fill="none" stroke="#67e8f9" strokeWidth="0.5" strokeOpacity="0.6" />
        <line x1="0" y1="-42" x2="28" y2="0" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.4" />
        <line x1="0" y1="-42" x2="-28" y2="0" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.4" />
        <line x1="-28" y1="0" x2="0" y2="9" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.3" />
        <line x1="28" y1="0" x2="0" y2="9" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.3" />
        {/* Sparkles */}
        <g filter="url(#brF4)" stroke="#67e8f9" strokeWidth="1" strokeOpacity="0.8">
          <line x1="-53" y1="-40" x2="-49" y2="-40" /><line x1="-51" y1="-42" x2="-51" y2="-38" />
          <line x1="50" y1="-50" x2="54" y2="-50" /><line x1="52" y1="-52" x2="52" y2="-48" />
          <line x1="54" y1="36" x2="58" y2="36" /><line x1="56" y1="34" x2="56" y2="38" />
        </g>
        <text y="66" textAnchor="middle" fill="#67e8f9" fontSize="14" fontWeight="700" fontFamily="system-ui" letterSpacing="2">BRILLIANT</text>
      </g>
      {/* Left criteria */}
      <g transform="translate(28, 48)">
        <text fill="#475569" fontSize="10" fontWeight="600" fontFamily="system-ui" letterSpacing="1">CRITERIA</text>
        {[
          ["1", "Sacrifice or non-obvious", "Alternatives clearly worse"],
          ["2", "Objectively best move", "Engine top-1, large gap"],
          ["3", "Counterintuitive", "Hard for humans to find"],
        ].map(([n, title, sub], i) => (
          <g key={n} transform={`translate(0, ${20 + i * 56})`}>
            <rect width="180" height="46" rx="7" fill="#0f172a" stroke="#1e293b" />
            <circle cx="16" cy="23" r="8" fill="#06b6d4" fillOpacity="0.15" stroke="#06b6d4" strokeOpacity="0.4" />
            <text x="16" y="27" textAnchor="middle" fill="#22d3ee" fontSize="11" fontFamily="system-ui">{n}</text>
            <text x="34" y="18" fill="#cbd5e1" fontSize="11" fontFamily="system-ui">{title}</text>
            <text x="34" y="33" fill="#475569" fontSize="10" fontFamily="system-ui">{sub}</text>
          </g>
        ))}
      </g>
      {/* Right rarity */}
      <g transform="translate(472, 48)">
        <text fill="#475569" fontSize="10" fontWeight="600" fontFamily="system-ui" letterSpacing="1">RARITY</text>
        <rect y="16" width="180" height="72" rx="8" fill="#0f172a" stroke="#1e293b" />
        <text x="12" y="36" fill="#94a3b8" fontSize="11" fontFamily="system-ui">Per 100 games (1400–1800):</text>
        <text x="12" y="62" fill="#22d3ee" fontSize="30" fontWeight="800" fontFamily="system-ui" filter="url(#brF4)">~1–3</text>
        <text x="12" y="80" fill="#475569" fontSize="10" fontFamily="system-ui">brilliants found</text>
        <rect y="104" width="180" height="78" rx="8" fill="#0f172a" stroke="#1e293b" />
        <text x="12" y="122" fill="#94a3b8" fontSize="11" fontFamily="system-ui">Most brilliants involve:</text>
        <text x="12" y="142" fill="#67e8f9" fontSize="11" fontFamily="system-ui">♞ Piece sacrifice</text>
        <text x="12" y="158" fill="#67e8f9" fontSize="11" fontFamily="system-ui">♖ Rook to active square</text>
        <text x="12" y="174" fill="#67e8f9" fontSize="11" fontFamily="system-ui">♕ Queen deflection</text>
      </g>
    </svg>
  );
}

function PuzzleVsRapidArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pvrBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#08111d" /><stop offset="1" stopColor="#111827" />
        </linearGradient>
        <radialGradient id="pvrLeft" cx="170" cy="132" r="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.12" /><stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pvrRight" cx="515" cy="132" r="140" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.12" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#pvrBg)" />
      <rect width="680" height="280" rx="18" fill="url(#pvrLeft)" />
      <rect width="680" height="280" rx="18" fill="url(#pvrRight)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="34" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui">Puzzle Rating vs Rapid Rating</text>
      <line x1="340" y1="56" x2="340" y2="240" stroke="#334155" strokeDasharray="4 4" />
      <g transform="translate(170, 62)">
        <text x="0" y="0" textAnchor="middle" fill="#86efac" fontSize="13" fontWeight="700" fontFamily="system-ui">PUZZLES</text>
        <circle cx="0" cy="76" r="54" fill="#14532d" fillOpacity="0.18" stroke="#22c55e" strokeOpacity="0.25" />
        <path d="M-28,56 h20 v-18 h16 v18 h20 v16 h-20 v18 h-16 v-18 h-20 z" fill="#86efac" fillOpacity="0.9" />
        <text x="0" y="154" textAnchor="middle" fill="#a7f3d0" fontSize="28" fontWeight="800" fontFamily="system-ui">2200</text>
        <text x="0" y="176" textAnchor="middle" fill="#4ade80" fontSize="11" fontFamily="system-ui">forced position, clear target</text>
      </g>
      <g transform="translate(510, 62)">
        <text x="0" y="0" textAnchor="middle" fill="#fca5a5" fontSize="13" fontWeight="700" fontFamily="system-ui">RAPID</text>
        <circle cx="0" cy="76" r="54" fill="#7f1d1d" fillOpacity="0.16" stroke="#ef4444" strokeOpacity="0.22" />
        <circle cx="0" cy="76" r="22" fill="none" stroke="#fca5a5" strokeWidth="6" strokeOpacity="0.85" />
        <line x1="0" y1="76" x2="0" y2="58" stroke="#fca5a5" strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="76" x2="14" y2="86" stroke="#fca5a5" strokeWidth="4" strokeLinecap="round" />
        <text x="0" y="154" textAnchor="middle" fill="#fecaca" fontSize="28" fontWeight="800" fontFamily="system-ui">1200</text>
        <text x="0" y="176" textAnchor="middle" fill="#f87171" fontSize="11" fontFamily="system-ui">clock, opening, threats, nerves</text>
      </g>
      <text x="340" y="238" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="system-ui">same tactical brain, very different conditions</text>
    </svg>
  );
}

function ItalianMistakesArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="itBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#151a2a" />
        </linearGradient>
        <radialGradient id="itGlow" cx="340" cy="140" r="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.14" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#itBg)" />
      <rect width="680" height="280" rx="18" fill="url(#itGlow)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="34" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui">Italian Game Mistakes</text>
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <line key={`iv${i}`} x1={164 + i * 44} y1="58" x2={164 + i * 44} y2="234" stroke="#334155" strokeWidth="0.6" strokeOpacity="0.45" />
      ))}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <line key={`ih${i}`} x1="164" y1={58 + i * 22} x2="516" y2={58 + i * 22} stroke="#334155" strokeWidth="0.6" strokeOpacity="0.45" />
      ))}
      {[0,1,2,3,4,5,6,7].map(r =>
        [0,1,2,3,4,5,6,7].filter(c => (r + c) % 2 === 1).map(c => (
          <rect key={`is${r}${c}`} x={164 + c * 44} y={58 + r * 22} width="44" height="22" fill="#1e293b" fillOpacity="0.55" />
        ))
      )}
      <circle cx="362" cy="146" r="28" fill="#ef4444" fillOpacity="0.12" stroke="#ef4444" strokeOpacity="0.4" />
      <text x="362" y="152" textAnchor="middle" fill="#fca5a5" fontSize="18" fontWeight="800" fontFamily="system-ui">?!</text>
      <path d="M274,103 L304,125 L337,115" fill="none" stroke="#22c55e" strokeWidth="3" strokeOpacity="0.75" strokeLinecap="round" />
      <path d="M404,165 L439,149 L470,153" fill="none" stroke="#f59e0b" strokeWidth="3" strokeOpacity="0.75" strokeLinecap="round" />
      <text x="210" y="248" fill="#94a3b8" fontSize="12" fontFamily="system-ui">develop</text>
      <text x="314" y="248" fill="#94a3b8" fontSize="12" fontFamily="system-ui">castle</text>
      <text x="416" y="248" fill="#94a3b8" fontSize="12" fontFamily="system-ui">time d4</text>
    </svg>
  );
}

function StudyPlanArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="spBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#090f1b" /><stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="spGlow" cx="340" cy="132" r="210" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06b6d4" stopOpacity="0.12" /><stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#spBg)" />
      <rect width="680" height="280" rx="18" fill="url(#spGlow)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="34" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui">Build a Study Plan From Your Games</text>
      {[
        { x: 112, y: 74, title: "Opening Leak", sub: "repeat value high", col: "#f59e0b" },
        { x: 276, y: 120, title: "Missed Tactic", sub: "drill this motif", col: "#22c55e" },
        { x: 440, y: 84, title: "Endgame Slip", sub: "study king activity", col: "#06b6d4" },
      ].map((card) => (
        <g key={card.title} transform={`translate(${card.x},${card.y})`}>
          <rect width="128" height="72" rx="10" fill="#111827" fillOpacity="0.85" stroke={card.col} strokeOpacity="0.25" />
          <text x="14" y="28" fill={card.col} fontSize="12" fontWeight="700" fontFamily="system-ui">{card.title}</text>
          <text x="14" y="48" fill="#94a3b8" fontSize="11" fontFamily="system-ui">{card.sub}</text>
        </g>
      ))}
      <path d="M176,174 C236,205 278,212 340,212 C404,212 445,198 506,164" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6 5" />
      <rect x="250" y="188" width="180" height="50" rx="12" fill="#0b1220" stroke="#22c55e" strokeOpacity="0.3" />
      <text x="340" y="209" textAnchor="middle" fill="#86efac" fontSize="13" fontWeight="700" fontFamily="system-ui">Next 7 Days</text>
      <text x="340" y="226" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontFamily="system-ui">1 main weakness, 1 support weakness, 1 maintenance habit</text>
    </svg>
  );
}

function OpeningStudyArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="osBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0b1020" /><stop offset="1" stopColor="#16122a" />
        </linearGradient>
        <radialGradient id="osGlow" cx="340" cy="140" r="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0.14" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#osBg)" />
      <rect width="680" height="280" rx="18" fill="url(#osGlow)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="34" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui">Study Openings Without Memorizing Everything</text>
      <g transform="translate(112,72)">
        <rect width="172" height="138" rx="12" fill="#0f172a" stroke="#334155" />
        <text x="18" y="28" fill="#fca5a5" fontSize="12" fontWeight="700" fontFamily="system-ui">MEMORIZE ONLY</text>
        <text x="18" y="58" fill="#94a3b8" fontSize="11" fontFamily="system-ui">move 8</text>
        <text x="18" y="78" fill="#94a3b8" fontSize="11" fontFamily="system-ui">move 9</text>
        <text x="18" y="98" fill="#94a3b8" fontSize="11" fontFamily="system-ui">move 10</text>
        <text x="18" y="128" fill="#f87171" fontSize="11" fontFamily="system-ui">opponent deviates - panic</text>
      </g>
      <g transform="translate(396,72)">
        <rect width="172" height="138" rx="12" fill="#0f172a" stroke="#334155" />
        <text x="18" y="28" fill="#c084fc" fontSize="12" fontWeight="700" fontFamily="system-ui">UNDERSTAND SHAPE</text>
        <text x="18" y="58" fill="#cbd5e1" fontSize="11" fontFamily="system-ui">pawn structure</text>
        <text x="18" y="78" fill="#cbd5e1" fontSize="11" fontFamily="system-ui">piece squares</text>
        <text x="18" y="98" fill="#cbd5e1" fontSize="11" fontFamily="system-ui">plans + breaks</text>
        <text x="18" y="128" fill="#a78bfa" fontSize="11" fontFamily="system-ui">deviation - still playable</text>
      </g>
      <path d="M304,141 L372,141" stroke="#64748b" strokeWidth="2.5" strokeDasharray="7 6" />
      <polygon points="372,141 360,135 360,147" fill="#64748b" />
    </svg>
  );
}

function DefaultArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="d-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#14102a" />
        </linearGradient>
        <radialGradient id="d-glow" cx="200" cy="100" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.15" /><stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill="url(#d-bg)" />
      <rect width="400" height="200" fill="url(#d-glow)" />
      {/* Ground */}
      <rect x="0" y="145" width="400" height="55" fill="#1e293b" fillOpacity="0.4" />
      <line x1="0" y1="145" x2="400" y2="145" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.45" />
      {/* Left pawn */}
      <g transform="translate(140,110)">
        <circle cx="0" cy="-12" r="6" fill="#94a3b8" fillOpacity="0.5" />
        <path d="M-4,-7 L-6,10 Q0,13 6,10 L4,-7 Z" fill="#94a3b8" fillOpacity="0.5" />
        <ellipse cx="0" cy="11" rx="9" ry="3" fill="#94a3b8" fillOpacity="0.4" />
      </g>
      {/* Center king (larger, brighter) */}
      <g transform="translate(200,95)">
        <rect x="-2" y="-32" width="4" height="8" fill="#22c55e" fillOpacity="0.65" />
        <rect x="-5" y="-29" width="10" height="4" fill="#22c55e" fillOpacity="0.65" />
        <circle cx="0" cy="-20" r="9" fill="#22c55e" fillOpacity="0.55" />
        <path d="M-6,-12 L-10,12 Q0,17 10,12 L6,-12 Z" fill="#22c55e" fillOpacity="0.55" />
        <ellipse cx="0" cy="14" rx="14" ry="5" fill="#22c55e" fillOpacity="0.45" />
      </g>
      {/* Right pawn */}
      <g transform="translate(260,110)">
        <circle cx="0" cy="-12" r="6" fill="#94a3b8" fillOpacity="0.5" />
        <path d="M-4,-7 L-6,10 Q0,13 6,10 L4,-7 Z" fill="#94a3b8" fillOpacity="0.5" />
        <ellipse cx="0" cy="11" rx="9" ry="3" fill="#94a3b8" fillOpacity="0.4" />
      </g>
      {/* Watermark */}
      <text x="200" y="180" textAnchor="middle" fill="white" fillOpacity="0.04" fontSize="20" fontWeight="700">{'FIRECHESS'}</text>
    </svg>
  );
}

/* ================================================================== */
/*  Chaos Chess  how to play  3 draft cards + 5-phase track           */
/* ================================================================== */
function ChaosHowToArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chtBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0618" /><stop offset="1" stopColor="#0d0a1e" />
        </linearGradient>
        <radialGradient id="chtGlow" cx="340" cy="120" r="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0.16" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <filter id="chtF"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#chtBg)" />
      <rect width="680" height="280" rx="18" fill="url(#chtGlow)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="#a855f7" strokeOpacity="0.16" />
      <text x="340" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="system-ui">How to Play Chaos Chess</text>
      <text x="340" y="56" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="system-ui">Draft a permanent modifier every 5 turns</text>
      {/* 3 draft cards */}
      {[
        { dx: -120, lbl: "COMMON", col: "#22c55e", icon: "🚀" },
        { dx: 0, lbl: "EPIC", col: "#a855f7", icon: "🔫" },
        { dx: 120, lbl: "RARE", col: "#3b82f6", icon: "🏇" },
      ].map((c, i) => (
        <g key={c.lbl} transform={`translate(${340 + c.dx},150)`}>
          <rect x="-44" y="-44" width="88" height="108" rx="9" fill="#160a30" fillOpacity="0.9"
            stroke={c.col} strokeOpacity={i === 1 ? 0.85 : 0.4} strokeWidth={i === 1 ? 2 : 1.2}
            filter={i === 1 ? "url(#chtF)" : undefined} />
          <text x="0" y="-22" textAnchor="middle" fontSize="26">{c.icon}</text>
          <text x="0" y="22" textAnchor="middle" fill={c.col} fontSize="11" fontWeight="700" fontFamily="system-ui">{c.lbl}</text>
          <rect x="-30" y="34" width="60" height="3" rx="1.5" fill={c.col} fillOpacity="0.3" />
          <rect x="-24" y="42" width="48" height="3" rx="1.5" fill={c.col} fillOpacity="0.2" />
        </g>
      ))}
      {/* 5-phase escalation track */}
      <line x1="120" y1="246" x2="560" y2="246" stroke="#a855f7" strokeOpacity="0.25" strokeWidth="2" />
      {[
        { x: 120, c: "#64748b" }, { x: 230, c: "#3b82f6" }, { x: 340, c: "#a855f7" },
        { x: 450, c: "#a855f7" }, { x: 560, c: "#fbbf24" },
      ].map((p, i) => (
        <g key={`ph${i}`}>
          <circle cx={p.x} cy="246" r={i === 4 ? 7 : 5.5} fill={p.c} />
          <text x={p.x} y="266" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui">{`T${(i + 1) * 5}`}</text>
        </g>
      ))}
    </svg>
  );
}

/* ================================================================== */
/*  Chaos modifier tier list  S / A / B / C rows                       */
/* ================================================================== */
function ModifierTierArt() {
  const rows = [
    { t: "S", col: "#fbbf24", icons: ["🔫", "👸", "🏇", "⚡"] },
    { t: "A", col: "#a855f7", icons: ["☢️", "🌙", "🔱", "💥"] },
    { t: "B", col: "#3b82f6", icons: ["🚀", "🐉", "💀"] },
    { t: "C", col: "#64748b", icons: ["🌀", "🪃"] },
  ];
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mtrBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0618" /><stop offset="1" stopColor="#11091f" />
        </linearGradient>
        <radialGradient id="mtrGlow" cx="340" cy="140" r="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.1" /><stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#mtrBg)" />
      <rect width="680" height="280" rx="18" fill="url(#mtrGlow)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="38" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="system-ui">Best Chaos Chess Modifiers, Ranked</text>
      {rows.map((row, i) => (
        <g key={row.t} transform={`translate(70,${64 + i * 48})`}>
          <rect x="0" y="0" width="48" height="40" rx="8" fill={row.col} fillOpacity="0.16" stroke={row.col} strokeOpacity="0.5" />
          <text x="24" y="27" textAnchor="middle" fill={row.col} fontSize="20" fontWeight="900" fontFamily="system-ui">{row.t}</text>
          <rect x="58" y="0" width="482" height="40" rx="8" fill="#150c28" fillOpacity="0.7" stroke="#2a1a44" />
          {row.icons.map((ic, j) => (
            <g key={j} transform={`translate(${80 + j * 56},20)`}>
              <rect x="-20" y="-15" width="40" height="30" rx="6" fill={row.col} fillOpacity="0.08" stroke={row.col} strokeOpacity="0.22" />
              <text x="0" y="6" textAnchor="middle" fontSize="16">{ic}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

/* ================================================================== */
/*  Openings by rating  heatmap grid + board motif                     */
/* ================================================================== */
function OpeningsDataArt() {
  const cells = [
    [44, 47, 49, 50, 51, 52],
    [43, 46, 48, 48, 49, 47],
    [46, 48, 49, 50, 51, 50],
    [45, 47, 48, 47, 48, 46],
    [48, 49, 50, 51, 50, 52],
  ];
  const color = (v: number) => {
    if (v >= 51) return "#0c7d57";
    if (v >= 50) return "#2f5d50";
    if (v >= 49) return "#3a4252";
    if (v >= 47) return "#7a4250";
    return "#b03048";
  };
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="opdBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0e1a" /><stop offset="1" stopColor="#0d1222" />
        </linearGradient>
        <radialGradient id="opdGlow" cx="340" cy="150" r="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" stopOpacity="0.1" /><stop offset="1" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#opdBg)" />
      <rect width="680" height="280" rx="18" fill="url(#opdGlow)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="system-ui">1.5M Games: Openings by Rating</text>
      <text x="340" y="56" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="system-ui">White win % heatmap  green = White scores well</text>
      {/* heatmap */}
      <g transform="translate(150,76)">
        {cells.map((rowArr, r) =>
          rowArr.map((v, c) => (
            <g key={`${r}-${c}`}>
              <rect x={c * 62} y={r * 32} width="58" height="28" rx="4" fill={color(v)} />
              <text x={c * 62 + 29} y={r * 32 + 18} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600" fontFamily="system-ui">{v}</text>
            </g>
          )),
        )}
        {/* axis labels */}
        {["<1k", "1.2k", "1.4k", "1.6k", "1.8k", "2.2k"].map((l, i) => (
          <text key={l} x={i * 62 + 29} y="-8" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui">{l}</text>
        ))}
      </g>
      <text x="60" y="160" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="system-ui" transform="rotate(-90 60 160)">opening</text>
    </svg>
  );
}

/* ================================================================== */
/*  Blunders by rating  descending bar chart + tilted piece           */
/* ================================================================== */
function BlunderDataArt() {
  const vals = [11.9, 9.8, 8.8, 7.9, 7.0, 6.6, 5.9, 5.1];
  const max = 12;
  const labels = ["<1k", "1.0k", "1.2k", "1.4k", "1.6k", "1.8k", "2.0k", "2.2k"];
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bldBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0e1a" /><stop offset="1" stopColor="#140d1a" />
        </linearGradient>
        <radialGradient id="bldGlow" cx="200" cy="120" r="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.1" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#bldBg)" />
      <rect width="680" height="280" rx="18" fill="url(#bldGlow)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="system-ui">How Often Players Blunder, by Rating</text>
      <text x="340" y="56" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="system-ui">Blunders per 100 moves  60k analyzed games</text>
      {/* bars */}
      <g transform="translate(60,80)">
        <line x1="0" y1="160" x2="560" y2="160" stroke="#334155" strokeWidth="1" />
        {vals.map((v, i) => {
          const h = (v / max) * 150;
          const t = i / (vals.length - 1);
          const col = `rgb(${Math.round(225 - (225 - 16) * t)},${Math.round(60 + (185 - 60) * t)},${Math.round(72 + (129 - 72) * t)})`;
          const x = i * 70 + 12;
          return (
            <g key={i}>
              <rect x={x} y={160 - h} width="44" height={h} rx="4" fill={col} />
              <text x={x + 22} y={160 - h - 7} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700" fontFamily="system-ui">{v}</text>
              <text x={x + 22} y="178" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui">{labels[i]}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/* ================================================================== */
/*  Sicilian Defense — knight + pawn clash                             */
/* ================================================================== */
function SicilianArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="siBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0618" /><stop offset="1" stopColor="#120a1a" />
        </linearGradient>
        <radialGradient id="siGl" cx="340" cy="140" r="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.15" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="siF"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#siBg)" />
      <rect width="680" height="280" rx="18" fill="url(#siGl)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="36" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="system-ui" letterSpacing="0.3">Sicilian Defense for Beginners</text>
      <text x="340" y="56" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="600" fontFamily="system-ui">1.e4 c5 — Three winning lines for club players</text>
      <g transform="translate(340, 210)" fill="none">
        <g transform="translate(-90, -75)" filter="url(#siF)">
          <ellipse cx="90" cy="95" rx="30" ry="5" fill="black" fillOpacity="0.3" />
          <path d="M70,90 L60,38 Q65,28 78,30 L95,38 L105,25 Q110,20 115,28 L115,60 Q118,70 130,75 L140,80 L140,90 Z" fill="#f59e0b" fillOpacity="0.88" />
          <circle cx="80" cy="42" r="6" fill="#f59e0b" fillOpacity="0.95" />
          <rect x="68" y="78" width="70" height="5" rx="2" fill="#f59e0b" fillOpacity="0.75" />
          <rect x="72" y="83" width="58" height="4" rx="2" fill="#f59e0b" fillOpacity="0.5" />
          <path d="M65,88 L145,88 L145,92 L65,92 Z" fill="#f59e0b" fillOpacity="0.35" />
        </g>
        <g transform="translate(50, -60)" filter="url(#siF)">
          <ellipse cx="30" cy="85" rx="12" ry="2.5" fill="black" fillOpacity="0.25" />
          <circle cx="30" cy="55" r="8" fill="#94a3b8" fillOpacity="0.6" />
          <path d="M23,62 L16,85 Q30,90 44,85 L37,62 Z" fill="#94a3b8" fillOpacity="0.55" />
          <ellipse cx="30" cy="86" rx="13" ry="4.5" fill="#94a3b8" fillOpacity="0.5" />
        </g>
        <g transform="translate(160, -50)">
          <rect x="0" y="0" width="180" height="30" rx="6" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.06" />
          <circle cx="14" cy="15" r="5" fill="#10b981" fillOpacity="0.4" />
          <text x="25" y="19" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui">Accelerated Dragon</text>
        </g>
        <g transform="translate(160, -14)">
          <rect x="0" y="0" width="180" height="30" rx="6" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.06" />
          <circle cx="14" cy="15" r="5" fill="#06b6d4" fillOpacity="0.4" />
          <text x="25" y="19" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui">Classical Sicilian</text>
        </g>
        <g transform="translate(160, 22)">
          <rect x="0" y="0" width="180" height="30" rx="6" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.06" />
          <circle cx="14" cy="15" r="5" fill="#a855f7" fillOpacity="0.4" />
          <text x="25" y="19" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui">Kan Variation</text>
        </g>
      </g>
      <path d="M160,170 L160,140 Q160,130 170,130 L340,130" stroke="#f59e0b" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
      <path d="M160,50 L160,80 Q160,90 170,90 L340,90" stroke="#f59e0b" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/* ================================================================== */
/*  ACPL by Rating — horizontal gauge: beginner red → GM cyan         */
/* ================================================================== */
function AverageCentipawnLossByArt() {
  const vals = [250, 120, 80, 62, 50, 45, 35, 25, 20, 15];
  const labels = ["0", "1k", "1.2k", "1.4k", "1.6k", "1.8k", "2k", "2.2k", "2.4k", "2.6k+"];
  const max = 250;
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="apBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0e1a" /><stop offset="1" stopColor="#140d1a" />
        </linearGradient>
        <radialGradient id="apGlow" cx="340" cy="120" r="260" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06b6d4" stopOpacity="0.08" /><stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="apGauge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ef4444" /><stop offset="0.35" stopColor="#f59e0b" /><stop offset="0.65" stopColor="#22c55e" /><stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="apF"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#apBg)" />
      <rect width="680" height="280" rx="18" fill="url(#apGlow)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="system-ui">Average Centipawn Loss by Rating</text>
      <text x="340" y="56" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="system-ui">ACPL drops as rating rises · 50k+ games</text>
      <g transform="translate(60, 100)">
        <rect x="0" y="0" width="560" height="12" rx="6" fill="url(#apGauge)" fillOpacity="0.85" />
        {vals.map((v, i) => {
          const x = (i / (vals.length - 1)) * 560;
          const h = (v / max) * 60;
          const col = i < 3 ? "#f87171" : i < 5 ? "#fbbf24" : i < 7 ? "#4ade80" : "#67e8f9";
          return (
            <g key={i}>
              <rect x={x - 2.5} y={85 - h} width="5" height={h} rx="2" fill={col} filter="url(#apF)" />
              <text x={x} y={-8} textAnchor="middle" fill={col} fontSize="9" fontWeight="700" fontFamily="system-ui">{v}</text>
              <text x={x} y="24" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="system-ui">{labels[i]}</text>
            </g>
          );
        })}
        <line x1="0" y1="0" x2="560" y2="0" stroke="#334155" strokeWidth="0.5" />
        <line x1="0" y1="12" x2="560" y2="12" stroke="#334155" strokeWidth="0.5" />
      </g>
      <text x="340" y="268" textAnchor="middle" fill="#06b6d4" fontSize="9" fontWeight="600" fontFamily="system-ui" letterSpacing="1.5">ANALYSIS — ACPL BENCHMARKS</text>
    </svg>
  );
}

/* ================================================================== */
/*  Guess the Elo — glowing question mark with surrounding pieces      */
/* ================================================================== */
function GuessTheEloChessArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="geBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0618" /><stop offset="1" stopColor="#120a1a" />
        </linearGradient>
        <radialGradient id="geGlow" cx="340" cy="140" r="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0.12" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <filter id="geF"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#geBg)" />
      <rect width="680" height="280" rx="18" fill="url(#geGlow)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="system-ui">Guess the Elo Chess</text>
      <text x="340" y="56" textAnchor="middle" fill="#a855f7" fontSize="11" fontFamily="system-ui">Can you spot the rating? Test your chess eye</text>
      {/* Central question mark */}
      <g transform="translate(340, 158)" filter="url(#geF)">
        <circle r="52" fill="#a855f7" fillOpacity="0.07" />
        <circle r="38" fill="#a855f7" fillOpacity="0.12" stroke="#a855f7" strokeOpacity="0.4" strokeWidth="1" />
        <text x="0" y="-18" textAnchor="middle" fill="#c084fc" fontSize="42" fontWeight="800" fontFamily="system-ui">?</text>
        <text x="0" y="10" textAnchor="middle" fill="#a855f7" fontSize="14" fontFamily="system-ui">ELO</text>
      </g>
      {/* Piece silhouettes around the ? */}
      <g transform="translate(340, 148)" fill="#94a3b8" fillOpacity="0.5">
        <g transform="translate(-100, -30)"><circle cx="8" cy="6" r="6.5"/><path d="M0,15 L-5,30 Q8,35 21,30 L16,15 Z"/><ellipse cx="8" cy="31" rx="12" ry="4"/></g>
        <g transform="translate(100, -30)"><circle cx="8" cy="6" r="6.5"/><path d="M0,15 L-5,30 Q8,35 21,30 L16,15 Z"/><ellipse cx="8" cy="31" rx="12" ry="4"/></g>
        <g transform="translate(-120, 20)"><ellipse cx="8" cy="12" rx="4" ry="6"/><rect x="2" y="18" width="12" height="8" rx="2"/></g>
        <g transform="translate(110, 20)"><ellipse cx="8" cy="12" rx="4" ry="6"/><rect x="2" y="18" width="12" height="8" rx="2"/></g>
      </g>
      {/* Analysis lines radiating */}
      {[-60, 60].map((dx, i) => (
        <line key={i} x1={340 + dx} y1="100" x2={340 + dx * 0.3} y2="130" stroke="#a855f7" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
      ))}
    </svg>
  );
}

/* ================================================================== */
/*  Guess Elo from PGN — document with magnifying glass               */
/* ================================================================== */
function GuessEloFromPgnArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gpBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0e1a" /><stop offset="1" stopColor="#140d1a" />
        </linearGradient>
        <radialGradient id="gpGlow" cx="300" cy="140" r="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0.1" /><stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <filter id="gpF"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#gpBg)" />
      <rect width="680" height="280" rx="18" fill="url(#gpGlow)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="system-ui">Guess Elo from PGN</text>
      <text x="340" y="56" textAnchor="middle" fill="#3b82f6" fontSize="11" fontFamily="system-ui">Upload a PGN file and estimate the rating instantly</text>
      <g transform="translate(200, 148)" filter="url(#gpF)">
        <rect x="-60" y="-40" width="120" height="80" rx="6" fill="#1e293b" fillOpacity="0.5" stroke="#334155" strokeWidth="1" />
        <rect x="-53" y="-33" width="106" height="2" rx="1" fill="#475569" />
        <rect x="-53" y="-27" width="80" height="2" rx="1" fill="#475569" />
        <rect x="-53" y="-21" width="60" height="2" rx="1" fill="#475569" />
        <rect x="-53" y="-15" width="90" height="2" rx="1" fill="#475569" />
        <rect x="-53" y="-9" width="70" height="2" rx="1" fill="#475569" />
        <rect x="-53" y="-3" width="85" height="2" rx="1" fill="#475569" />
        <rect x="-53" y="3" width="55" height="2" rx="1" fill="#475569" />
        <path d="M-60,-40 L-56,-44 L64,-44 L60,-40" fill="#1e293b" fillOpacity="0.5" stroke="#334155" strokeWidth="1" />
        <rect x="-10" y="-44" width="20" height="6" rx="2" fill="#3b82f6" fillOpacity="0.3" />
        <text x="5" y="-40" textAnchor="middle" fill="#60a5fa" fontSize="7" fontWeight="700" fontFamily="system-ui">PGN</text>
      </g>
      <g transform="translate(340, 120)" filter="url(#gpF)">
        <circle cx="0" cy="0" r="32" fill="#3b82f6" fillOpacity="0.06" stroke="#3b82f6" strokeOpacity="0.2" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="22" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeOpacity="0.6" />
        <line x1="16" y1="16" x2="32" y2="32" stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.6" />
        <text x="0" y="4" textAnchor="middle" fill="#60a5fa" fontSize="20" fontWeight="700" fontFamily="system-ui">ELO</text>
      </g>
      <text x="340" y="268" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="600" fontFamily="system-ui" letterSpacing="1.5">TOOL — PGN RATING ESTIMATOR</text>
    </svg>
  );
}

/* ================================================================== */
/*  July 2026 Feature Update — timeline roadmap with release dots      */
/* ================================================================== */
function FirechessJuly2026Art() {
  const features = [
    { x: 80, c: "#f59e0b", lbl: "Roast", h: 60 },
    { x: 200, c: "#22c55e", lbl: "Daily", h: 75 },
    { x: 320, c: "#a855f7", lbl: "Chaos", h: 90 },
    { x: 440, c: "#3b82f6", lbl: "Reports", h: 65 },
    { x: 560, c: "#ef4444", lbl: "Pro+", h: 50 },
  ];
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fuBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0618" /><stop offset="1" stopColor="#0f081f" />
        </linearGradient>
        <radialGradient id="fuGl" cx="340" cy="140" r="260" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0.08" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <filter id="fuF"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#fuBg)" />
      <rect width="680" height="280" rx="18" fill="url(#fuGl)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="system-ui">What's New on FireChess</text>
      <text x="340" y="56" textAnchor="middle" fill="#a855f7" fontSize="11" fontFamily="system-ui">28 releases · 4 major features · 1 lifetime plan</text>
      <line x1="60" y1="180" x2="620" y2="180" stroke="#a855f7" strokeOpacity="0.15" strokeWidth="2" />
      {features.map((f, i) => (
        <g key={i}>
          <rect x={f.x - 16} y={180 - f.h} width="32" height={f.h} rx="4" fill={f.c} fillOpacity="0.15" stroke={f.c} strokeOpacity="0.4" strokeWidth="1" filter="url(#fuF)" />
          <circle cx={f.x} cy={180} r="7" fill={f.c} fillOpacity="0.3" stroke={f.c} strokeWidth="2" filter="url(#fuF)" />
          <circle cx={f.x} cy={180} r="7" fill={f.c} fillOpacity="0.6" stroke={f.c} strokeWidth="2" />
          <circle cx={f.x} cy={180} r="3" fill="white" fillOpacity="0.8" />
          <text x={f.x} y={180 - f.h - 8} textAnchor="middle" fill={f.c} fontSize="10" fontWeight="700" fontFamily="system-ui">{f.lbl}</text>
        </g>
      ))}
      <rect x="0" y="200" width="680" height="80" fill="#111827" fillOpacity="0.2" />
      <line x1="0" y1="200" x2="680" y2="200" stroke="#1f2937" />
      <g transform="translate(340, 235)">
        <rect x="-100" y="-14" width="200" height="28" rx="14" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.06" />
        <text x="0" y="5" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="system-ui">H1 2026 — 28 releases shipped</text>
      </g>
    </svg>
  );
}

/* ================================================================== */
/*  Shirov vs Topalov — glowing bishop sacrifice with dramatic rays    */
/* ================================================================== */
function ShirovTopalovBh3Art() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0608" /><stop offset="1" stopColor="#160808" />
        </linearGradient>
        <radialGradient id="shGl" cx="340" cy="140" r="260" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.15" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="shBurst" cx="340" cy="140" r="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.3" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <filter id="shF"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="shF2"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#shBg)" />
      <rect width="680" height="280" rx="18" fill="url(#shGl)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <text x="340" y="36" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="system-ui">The Immortal Bh3 Sacrifice</text>
      <text x="340" y="54" textAnchor="middle" fill="#f87171" fontSize="11" fontFamily="system-ui">Shirov vs Topalov · Linares 1998</text>
      {/* Brilliant badge */}
      <g transform="translate(340, 74)">
        <rect x="-28" y="-10" width="56" height="20" rx="10" fill="#06b6d4" fillOpacity="0.15" stroke="#06b6d4" strokeOpacity="0.4" strokeWidth="1" />
        <text x="0" y="4" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="800" fontFamily="system-ui">!! Brilliant</text>
      </g>
      {[0,45,90,135,180,225,270,315].map((a) => {
        const r = a * Math.PI / 180;
        const x2 = 340 + Math.cos(r) * 120;
        const y2 = 140 + Math.sin(r) * 120;
        return <line key={a} x1="340" y1="140" x2={x2} y2={y2} stroke="#ef4444" strokeOpacity="0.12" strokeWidth="1.5" />;
      })}
      <circle cx="340" cy="140" r="40" fill="url(#shBurst)" />
      <circle cx="340" cy="140" r="36" fill="#ef4444" fillOpacity="0.08" stroke="#fbbf24" strokeOpacity="0.3" strokeWidth="1.5" filter="url(#shF)" />
      <g transform="translate(340, 137)" filter="url(#shF2)">
        <path d="M332,15 L336,5 Q340,0 344,5 L348,15 Z" fill="#fbbf24" fillOpacity="0.9" />
        <circle cx="340" cy="-5" r="6" fill="#fbbf24" fillOpacity="0.95" />
        <ellipse cx="340" cy="8" rx="6" ry="3" fill="#fbbf24" fillOpacity="0.7" />
        <ellipse cx="340" cy="18" rx="9" ry="3" fill="#fbbf24" fillOpacity="0.5" />
        <line x1="337" y1="10" x2="337" y2="15" stroke="#fbbf24" strokeOpacity="0.6" strokeWidth="0.8" />
        <line x1="343" y1="10" x2="343" y2="15" stroke="#fbbf24" strokeOpacity="0.6" strokeWidth="0.8" />
      </g>
      <circle cx="340" cy="140" r="80" fill="none" stroke="#ef4444" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="4 6" />
      <circle cx="340" cy="140" r="100" fill="none" stroke="#ef4444" strokeOpacity="0.04" strokeWidth="1" strokeDasharray="2 8" />
      <g transform="translate(230, 160)" fill="#94a3b8" fillOpacity="0.35">
        <circle cx="15" cy="10" r="8"/><path d="M5,22 L-2,40 Q15,46 32,40 L25,22 Z"/><ellipse cx="15" cy="42" rx="16" ry="5.5"/>
      </g>
      <g transform="translate(420, 150)" fill="#94a3b8" fillOpacity="0.3">
        <rect x="8" y="0" width="4" height="12" rx="1"/><circle cx="10" cy="-6" r="6"/>
        <path d="M4,12 L0,24 L20,24 L16,12 Z"/><rect x="-2" y="24" width="24" height="5" rx="2"/>
      </g>
      <text x="340" y="268" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600" fontFamily="system-ui" letterSpacing="1.5">47...Bh3!! — THE MOVE THAT STUNNED KASPAROV</text>
    </svg>
  );
}

/* ================================================================== */
/*  Chess rating 1200 to 1500 — climbing graph with piece milestones   */
/* ================================================================== */
function ChessRating1200Art() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#080c18" /><stop offset="1" stopColor="#0a1020" />
        </linearGradient>
        <radialGradient id="rGl" cx="340" cy="140" r="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" stopOpacity="0.08" /><stop offset="1" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rPg" cx="340" cy="240" r="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.06" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <filter id="rF"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="rF2"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="rLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="0.5" stopColor="#22c55e" stopOpacity="0.8" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#rBg)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <rect width="680" height="280" rx="18" fill="url(#rGl)" />
      {/* Title */}
      <text x="340" y="32" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="system-ui" letterSpacing="1">1200 → 1500</text>
      <text x="340" y="50" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="system-ui">The Improvement Climb</text>
      {/* Grid lines */}
      <line x1="70" y1="90" x2="610" y2="90" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
      <line x1="70" y1="130" x2="610" y2="130" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
      <line x1="70" y1="170" x2="610" y2="170" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
      <line x1="70" y1="210" x2="610" y2="210" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
      {/* Graph climb path */}
      <path d="M70,220 C130,225 160,200 200,175 C240,150 250,160 280,145 C310,130 340,120 370,110 C400,100 420,105 450,100 C480,95 530,110 610,80" fill="none" stroke="url(#rLine)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Glow under the curve */}
      <path d="M70,220 C130,225 160,200 200,175 C240,150 250,160 280,145 C310,130 340,120 370,110 C400,100 420,105 450,100 C480,95 530,110 610,80 L610,270 L70,270 Z" fill="url(#rPg)" fillOpacity="0.5" />
      {/* Milestone markers */}
      {/* 1200 — pawn milestone */}
      <g transform="translate(70, 220)">
        <circle r="18" fill="#6366f1" fillOpacity="0.15" stroke="#6366f1" strokeOpacity="0.4" strokeWidth="1" filter="url(#rF)" />
        <text y="6" textAnchor="middle" fill="#a5b4fc" fontSize="20" fontFamily="serif">♟</text>
        <text y="40" textAnchor="middle" fill="#6366f1" fontSize="12" fontWeight="700" fontFamily="system-ui">1200</text>
      </g>
      {/* 1300 — knight milestone */}
      <g transform="translate(200, 175)">
        <circle r="18" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1" filter="url(#rF)" />
        <text y="7" textAnchor="middle" fill="#6ee7b7" fontSize="18" fontFamily="serif">♞</text>
        <text y="40" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="700" fontFamily="system-ui">1300</text>
      </g>
      {/* 1400 — bishop milestone */}
      <g transform="translate(370, 110)">
        <circle r="18" fill="#22d3ee" fillOpacity="0.15" stroke="#22d3ee" strokeOpacity="0.4" strokeWidth="1" filter="url(#rF)" />
        <text y="7" textAnchor="middle" fill="#67e8f9" fontSize="18" fontFamily="serif">♝</text>
        <text y="40" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="700" fontFamily="system-ui">1400</text>
      </g>
      {/* 1500 — queen/crown milestone */}
      <g transform="translate(610, 80)">
        <circle r="22" fill="#f59e0b" fillOpacity="0.15" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="1.5" filter="url(#rF2)" />
        <text y="7" textAnchor="middle" fill="#fcd34d" fontSize="20" fontFamily="serif">♛</text>
        <text y="45" textAnchor="middle" fill="#f59e0b" fontSize="13" fontWeight="700" fontFamily="system-ui">1500</text>
      </g>
      {/* Decorative chessboard mini-patterns */}
      <g opacity="0.03">
        {[0,1,2,3,4,5,6,7].map(r =>
          [0,1,2,3,4,5,6,7].filter(c => (r + c) % 2 === 1).map(c => (
            <rect key={`b${r}${c}`} x={40 + c * 6} y={250 + r * 3.5} width="6" height="3.5" fill="white" />
          ))
        )}
      </g>
      <text x="340" y="268" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="system-ui" letterSpacing="1">RATING PROGRESSION · FOUR PILLARS TO CLIMB</text>
    </svg>
  );
}

/* ================================================================== */
/*  Best openings for beginners — chessboard with opening cards        */
/* ================================================================== */
function BestOpeningsBeginnersArt() {
  return (
    <svg viewBox="0 0 680 280" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="obBg" x1="0" y1="0" x2="680" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0e1a" /><stop offset="1" stopColor="#0d1222" />
        </linearGradient>
        <radialGradient id="obGl" cx="340" cy="140" r="260" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.06" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="obCard1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.15" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="obCard2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10b981" stopOpacity="0.15" /><stop offset="1" stopColor="#10b981" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="obCard3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.15" /><stop offset="1" stopColor="#6366f1" stopOpacity="0.03" />
        </linearGradient>
        <filter id="obF"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="680" height="280" rx="18" fill="url(#obBg)" />
      <rect x="1" y="1" width="678" height="278" rx="17" stroke="white" strokeOpacity="0.05" />
      <rect width="680" height="280" fill="url(#obGl)" />
      {/* Title */}
      <text x="340" y="32" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="system-ui" letterSpacing="1">OPENINGS FOR EVERY LEVEL</text>
      <text x="340" y="50" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui">From Beginner to Tournament Player</text>
      {/* Chessboard — mini */}
      <g transform="translate(24, 68)">
        {[0,1,2,3,4,5,6,7].map(r =>
          [0,1,2,3,4,5,6,7].map(c => {
            const d = (r + c) % 2 === 1;
            return <rect key={`${r}${c}`} x={c*12} y={r*12} width="12" height="12" fill={d ? '#1e3a5f' : '#e8edf3'} rx="1" />;
          })
        )}
        {/* Mini pieces */}
        <text x={24} y={84} textAnchor="middle" fill="#0f172a" fontSize="10" fontFamily="serif">♔</text>
        <text x={24} y={12} textAnchor="middle" fill="#1e3a5f" fontSize="10" fontFamily="serif">♚</text>
        <text x={12} y={72} textAnchor="middle" fill="#0f172a" fontSize="8" fontFamily="serif">♙</text>
        <text x={36} y={24} textAnchor="middle" fill="#1e3a5f" fontSize="8" fontFamily="serif">♟</text>
      </g>
      {/* Opening recommendation cards */}
      {/* Card 1: Under 1000 — Italian Game */}
      <g transform="translate(130, 64)">
        <rect width="165" height="62" rx="10" fill="url(#obCard1)" stroke="#f59e0b" strokeOpacity="0.2" strokeWidth="1" />
        <text x="12" y="20" fill="#fbbf24" fontSize="11" fontWeight="800" fontFamily="system-ui">&lt; 1000</text>
        <text x="12" y="36" fill="#f1f5f9" fontSize="10" fontFamily="system-ui" fontWeight="600">Italian Game</text>
        <text x="12" y="50" fill="#94a3b8" fontSize="8.5" fontFamily="system-ui">1.e4 e5 2.Nf3 Nc6 3.Bc4</text>
      </g>
      {/* Card 2: 1000–1200 — London System */}
      <g transform="translate(130, 132)">
        <rect width="165" height="62" rx="10" fill="url(#obCard2)" stroke="#10b981" strokeOpacity="0.2" strokeWidth="1" />
        <text x="12" y="20" fill="#34d399" fontSize="11" fontWeight="800" fontFamily="system-ui">1000–1200</text>
        <text x="12" y="36" fill="#f1f5f9" fontSize="10" fontFamily="system-ui" fontWeight="600">London System</text>
        <text x="12" y="50" fill="#94a3b8" fontSize="8.5" fontFamily="system-ui">1.d4 2.Bf4 3.e3 — system</text>
      </g>
      {/* Card 3: 1400+ — Queen's Gambit */}
      <g transform="translate(130, 200)">
        <rect width="165" height="62" rx="10" fill="url(#obCard3)" stroke="#6366f1" strokeOpacity="0.2" strokeWidth="1" />
        <text x="12" y="20" fill="#818cf8" fontSize="11" fontWeight="800" fontFamily="system-ui">1400+</text>
        <text x="12" y="36" fill="#f1f5f9" fontSize="10" fontFamily="system-ui" fontWeight="600">Queen's Gambit</text>
        <text x="12" y="50" fill="#94a3b8" fontSize="8.5" fontFamily="system-ui">1.d4 d5 2.c4 — classical</text>
      </g>
      {/* Right side — rating ladder */}
      <g transform="translate(380, 60)">
        <text x="0" y="16" fill="#64748b" fontSize="9" fontFamily="system-ui" fontWeight="600" letterSpacing="2">RATING LADDER</text>
        {/* Ladder items */}
        {[
          { r: "1800+", label: "Full repertoire", color: "#22d3ee", y: 36 },
          { r: "1600", label: "Ruy Lopez / Catalan", color: "#06b6d4", y: 74 },
          { r: "1400", label: "Queen's Gambit", color: "#10b981", y: 112 },
          { r: "1200", label: "London System", color: "#84cc16", y: 150 },
          { r: "1000", label: "Italian + Caro-Kann", color: "#eab308", y: 188 },
        ].map((item) => (
          <g key={item.r}>
            <text x="0" y={item.y} fill={item.color} fontSize="13" fontWeight="800" fontFamily="system-ui">{item.r}</text>
            <text x="55" y={item.y} fill="#cbd5e1" fontSize="11" fontFamily="system-ui">{item.label}</text>
            <line x1="0" y1={item.y + 6} x2="260" y2={item.y + 6} stroke="#1e293b" strokeWidth="0.5" />
          </g>
        ))}
        {/* Arrow */}
        <path d="M10,210 L10,34 M5,42 L10,34 L15,42" stroke="#22d3ee" strokeOpacity="0.3" strokeWidth="1.5" fill="none" />
      </g>
      {/* Decorative pieces */}
      <g opacity="0.08">
        <text x="12" y="268" fill="white" fontSize="14" fontFamily="serif">♟♞♝♜♛♚</text>
      </g>
      <text x="340" y="270" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="system-ui" letterSpacing="1">OPENING RECOMMENDATIONS · LEVEL UP YOUR REPERTOIRE</text>
    </svg>
  );
}

/* ================================================================== */
/*  24. Chess Tactics  knight fork radiating lines, pin diagonal       */
/* ================================================================== */
function TacticsArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tac-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#1a0a1a" />
        </linearGradient>
        <radialGradient id="tac-glow" cx="200" cy="100" r="140" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.15" /><stop offset="0.5" stopColor="#fbbf24" stopOpacity="0.08" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tac-knight-glow" cx="180" cy="80" r="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.4" /><stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id="tac-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#tac-bg)" />
      <rect width="400" height="200" fill="url(#tac-glow)" />
      {/* Board grid in background */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`tv${i}`} x1={100+i*25} y1="30" x2={100+i*25} y2="180" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.3" />
      ))}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`th${i}`} x1="100" y1={30+i*18.75} x2="275" y2={30+i*18.75} stroke="#334155" strokeWidth="0.5" strokeOpacity="0.3" />
      ))}
      {/* Dark squares on partial board */}
      {[0,1,2,3,4,5,6,7].map(r =>
        [0,1,2,3,4,5,6,7].filter(c => (r + c) % 2 === 1).map(c => (
          <rect key={`ts${r}${c}`} x={100+c*25} y={30+r*18.75} width="25" height="18.75" fill="#1e293b" fillOpacity="0.4" />
        ))
      )}
      {/* Knight silhouette (central) */}
      <g transform="translate(175, 60)" filter="url(#tac-f)">
        <circle cx="20" cy="55" r="9" fill="#fbbf24" fillOpacity="0.15" />
        <path d="M12,28 Q10,18 16,12 Q20,8 26,12 Q32,16 30,24 L32,28 Q34,32 30,36 L26,38 Q22,40 18,38 Z" fill="#fbbf24" fillOpacity="0.9" />
        <path d="M12,28 Q10,18 16,12 Q20,8 26,12 Q32,16 30,24 L32,28 Q34,32 30,36 L26,38 Q22,40 18,38 Z" fill="none" stroke="#fcd34d" strokeWidth="1.5" />
        <path d="M22,10 L24,4 L28,10" fill="#fbbf24" fillOpacity="0.9" />
        <circle cx="24" cy="18" r="2" fill="#0c1220" />
        <path d="M10,24 Q6,20 8,16" stroke="#fcd34d" strokeWidth="1.5" fill="none" />
        <path d="M8,20 Q4,16 6,12" stroke="#fcd34d" strokeWidth="1.5" fill="none" />
      </g>
      {/* Fork lines radiating from knight */}
      <g strokeDasharray="5 3" strokeWidth="2" strokeOpacity="0.8">
        <line x1="200" y1="95" x2="270" y2="45" stroke="#ef4444">
          <animate attributeName="strokeDashoffset" from="16" to="0" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="200" y1="95" x2="135" y2="45" stroke="#22c55e">
          <animate attributeName="strokeDashoffset" from="16" to="0" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="200" y1="95" x2="280" y2="155" stroke="#3b82f6">
          <animate attributeName="strokeDashoffset" from="16" to="0" dur="2s" repeatCount="indefinite" />
        </line>
      </g>
      {/* Target piece icons at arrow ends */}
      <text x="280" y="42" textAnchor="middle" fill="#ef4444" fontSize="28" fontFamily="serif" filter="url(#tac-f)">♔</text>
      <text x="280" y="42" textAnchor="middle" fill="#ef4444" fontSize="28" fontFamily="serif" opacity="0.5">♔</text>
      <text x="125" y="42" textAnchor="middle" fill="#22c55e" fontSize="28" fontFamily="serif" filter="url(#tac-f)">♕</text>
      <text x="125" y="42" textAnchor="middle" fill="#22c55e" fontSize="28" fontFamily="serif" opacity="0.5">♕</text>
      <text x="290" y="158" textAnchor="middle" fill="#3b82f6" fontSize="26" fontFamily="serif" filter="url(#tac-f)">♖</text>
      {/* Pin line — bishop diagonal */}
      <line x1="100" y1="180" x2="220" y2="40" stroke="#fbbf24" strokeWidth="3" strokeOpacity="0.5" strokeDasharray="2 6" />
      <text x="90" y="185" textAnchor="middle" fill="#fbbf24" fontSize="18" fontFamily="serif" opacity="0.6">♗</text>
      {/* Chain link for pin icon */}
      <g transform="translate(155, 145)" opacity="0.45">
        <circle cx="0" cy="0" r="4" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="10" cy="0" r="4" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="4" y1="0" x2="6" y2="0" stroke="#fbbf24" strokeWidth="1.5" />
      </g>
      {/* Bottom tagline */}
      <text x="200" y="196" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="system-ui" letterSpacing="2">FORK · PIN · SKEWER · DISCOVERED ATTACK · ZWISCHENZUG</text>
      {/* Pulsing glow */}
      <circle cx="200" cy="95" r="15" fill="#fbbf24" fillOpacity="0.08">
        <animate attributeName="r" values="10;25;10" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.12;0.02;0.12" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ================================================================== */
/*  9. Lichess vs Chess.com  two platforms clashing, scales balancing */
/* ================================================================== */
function LichessVsChesscomArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lc-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#14102a" />
        </linearGradient>
        <radialGradient id="lc-left" cx="120" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" stopOpacity="0.18" /><stop offset="1" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lc-right" cx="280" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0.18" /><stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <filter id="lc-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#lc-bg)" />
      <rect width="400" height="200" fill="url(#lc-left)" />
      <rect width="400" height="200" fill="url(#lc-right)" />
      {/* Center divider line */}
      <line x1="200" y1="20" x2="200" y2="180" stroke="#475569" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 3" />
      {/* LEFT SIDE — Lichess (green, open, minimalist) */}
      <g transform="translate(120,60)">
        <rect x="-20" y="-25" width="40" height="50" rx="5" fill="none" stroke="#10b981" strokeWidth="2.5" strokeOpacity="0.8" />
        <rect x="-15" y="-18" width="30" height="8" rx="2" fill="#10b981" fillOpacity="0.7" />
        <rect x="-15" y="-5" width="24" height="7" rx="2" fill="#10b981" fillOpacity="0.5" />
        <rect x="-15" y="7" width="30" height="7" rx="2" fill="#10b981" fillOpacity="0.6" />
      </g>
      {/* Lichess pieces (minimalist outlines) */}
      <g transform="translate(95,115)" fill="none" stroke="#10b981" strokeWidth="1.8" strokeOpacity="0.6">
        <circle cx="0" cy="-12" r="5" />
        <path d="M-3,-8 L-4,4 Q0,7 4,4 L3,-8 Z" />
        <ellipse cx="0" cy="6" rx="7" ry="2.5" />
        <g transform="translate(35,0)">
          <path d="M-5,7 L-6,-12 Q-7,-22 -1,-26 L1,-28 Q4,-25 6,-22 L8,-16 Q10,-12 8,-8 L8,0 Q5,3 -3,3 Z" />
          <circle cx="1" cy="-20" r="1.5" fill="#10b981" fillOpacity="0.5" />
        </g>
      </g>
      <text x="120" y="170" textAnchor="middle" fill="#10b981" fillOpacity="0.55" fontSize="11" fontFamily="system-ui" letterSpacing="2">FREE · OPEN · ALL FEATURES</text>
      <path d="M108,182 Q120,190 132,182 Q138,178 144,182 Q156,190 168,182" fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.35" />
      {/* RIGHT SIDE — Chess.com (blue, polished, premium) */}
      <g transform="translate(280,58)">
        <circle cx="0" cy="-20" r="3" fill="#3b82f6" fillOpacity="0.7" />
        <path d="M-8,-14 L-6,-20 L-2,-15 L0,-22 L2,-15 L6,-20 L8,-14 Z" fill="#3b82f6" fillOpacity="0.6" />
        <circle cx="0" cy="-10" r="9" fill="#3b82f6" fillOpacity="0.5" />
        <path d="M-6,-3 L-10,12 Q0,16 10,12 L6,-3 Z" fill="#3b82f6" fillOpacity="0.5" />
        <ellipse cx="0" cy="14" rx="13" ry="4.5" fill="#3b82f6" fillOpacity="0.4" />
      </g>
      <g transform="translate(260,115)" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeOpacity="0.6">
        <circle cx="0" cy="-12" r="5" />
        <path d="M-3,-8 L-4,4 Q0,7 4,4 L3,-8 Z" />
        <ellipse cx="0" cy="6" rx="7" ry="2.5" />
        <g transform="translate(35,0)">
          <circle cx="0" cy="-20" r="3.5" />
          <path d="M-5,-6 L-7,-18 L-3,-14 L0,-24 L3,-14 L7,-18 L5,-6 Z" />
          <circle cx="0" cy="-10" r="8" />
          <path d="M-5,-3 L-8,8 Q0,12 8,8 L5,-3 Z" />
          <ellipse cx="0" cy="10" rx="11" ry="3.5" />
        </g>
      </g>
      <text x="280" y="170" textAnchor="middle" fill="#3b82f6" fillOpacity="0.55" fontSize="11" fontFamily="system-ui" letterSpacing="2">POLISHED · CURATED · $14.99/MO</text>
      <text x="280" y="186" textAnchor="middle" fill="#3b82f6" fillOpacity="0.35" fontSize="13" fontFamily="system-ui">$</text>
      {/* Center "VS" decal */}
      <circle cx="200" cy="92" r="18" fill="none" stroke="#475569" strokeWidth="1.5" strokeOpacity="0.4" />
      <text x="200" y="99" textAnchor="middle" fill="#fbbf24" fillOpacity="0.6" fontSize="16" fontFamily="system-ui" fontWeight="700">VS</text>
      <line x1="182" y1="92" x2="168" y2="92" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.15" />
      <line x1="218" y1="92" x2="232" y2="92" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.15" />
      <line x1="200" y1="74" x2="200" y2="64" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.15" />
      <line x1="200" y1="110" x2="200" y2="120" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.15" />
    </svg>
  );
}

/* ================================================================== */
/*  Immortal Zugzwang  locked pieces, cage bars, trapped king         */
/* ================================================================== */
function ImmortalZugzwangArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="iz-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0f1a" /><stop offset="1" stopColor="#140a1a" />
        </linearGradient>
        <radialGradient id="iz-glow" cx="200" cy="100" r="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.12" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <filter id="iz-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#iz-bg)" />
      <rect width="400" height="200" fill="url(#iz-glow)" />
      {/* Cage bars — zugzwang visual metaphor */}
      <line x1="80" y1="25" x2="80" y2="175" stroke="#475569" strokeWidth="2" strokeOpacity="0.35" />
      <line x1="120" y1="25" x2="120" y2="175" stroke="#475569" strokeWidth="1.5" strokeOpacity="0.25" />
      <line x1="280" y1="25" x2="280" y2="175" stroke="#475569" strokeWidth="1.5" strokeOpacity="0.25" />
      <line x1="320" y1="25" x2="320" y2="175" stroke="#475569" strokeWidth="2" strokeOpacity="0.35" />
      {/* Top bar */}
      <line x1="60" y1="35" x2="340" y2="35" stroke="#475569" strokeWidth="2" strokeOpacity="0.3" />
      {/* Bottom bar */}
      <line x1="60" y1="165" x2="340" y2="165" stroke="#475569" strokeWidth="2" strokeOpacity="0.3" />
      {/* Central chessboard — 4x4 mini board */}
      <g transform="translate(152,68)">
        {[0,1,2,3].map(r =>
          [0,1,2,3].filter(c => (r + c) % 2 === 0).map(c => (
            <rect key={`s${r}${c}`} x={c*24} y={r*24} width="24" height="24" fill="#1e293b" fillOpacity="0.4" />
          ))
        )}
        {[0,1,2,3].map(r =>
          [0,1,2,3].filter(c => (r + c) % 2 === 1).map(c => (
            <rect key={`t${r}${c}`} x={c*24} y={r*24} width="24" height="24" fill="#334155" fillOpacity="0.25" />
          ))
        )}
      </g>
      {/* Trapped white king — center board, surrounded by black pieces */}
      <g transform="translate(200,92)" filter="url(#iz-f)">
        <text x="0" y="0" textAnchor="middle" fill="#fbbf24" fontSize="28" fontFamily="serif" fillOpacity="0.7">♔</text>
        {/* Restriction rings */}
        <circle cx="0" cy="0" r="20" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3">
          <animate attributeName="r" values="20;24;20" dur="3s" repeatCount="indefinite" />
          <animate attributeName="strokeOpacity" values="0.3;0.15;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
      {/* Black queen dominating from c-file */}
      <g transform="translate(128,68)">
        <text x="0" y="0" textAnchor="middle" fill="#a78bfa" fontSize="20" fontFamily="serif" fillOpacity="0.6">♛</text>
      </g>
      {/* Black bishop dominating diagonal */}
      <g transform="translate(248,140)">
        <text x="0" y="0" textAnchor="middle" fill="#a78bfa" fontSize="18" fontFamily="serif" fillOpacity="0.5">♝</text>
      </g>
      {/* Black rook controlling file */}
      <g transform="translate(248,68)">
        <text x="0" y="0" textAnchor="middle" fill="#a78bfa" fontSize="18" fontFamily="serif" fillOpacity="0.5">♜</text>
      </g>
      {/* White pawns — blocked, can't move */}
      <g fill="#fbbf24" fillOpacity="0.3">
        <text x="176" y="164" fontSize="14" fontFamily="serif">♟</text>
        <text x="200" y="164" fontSize="14" fontFamily="serif">♟</text>
        <text x="224" y="164" fontSize="14" fontFamily="serif">♟</text>
      </g>
      {/* Static trapped white knights */}
      <g fill="#fbbf24" fillOpacity="0.25">
        <text x="152" y="116" fontSize="16" fontFamily="serif">♞</text>
        <text x="248" y="116" fontSize="16" fontFamily="serif">♞</text>
      </g>
      {/* Zigzag lines showing "no exit" */}
      <path d="M152,44 Q170,50 176,44 Q182,38 188,44 Q194,50 200,44 Q206,38 212,44 Q218,50 224,44 Q230,38 236,44 Q242,50 248,44" fill="none" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 3" />
      <path d="M152,156 Q170,150 176,156 Q182,162 188,156 Q194,150 200,156 Q206,162 212,156 Q218,150 224,156 Q230,162 236,156 Q242,150 248,156" fill="none" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 3" />
      {/* "Zugzwang" text */}
      <text x="200" y="36" textAnchor="middle" fill="#8b5cf6" fillOpacity="0.5" fontSize="10" fontFamily="system-ui" letterSpacing="3">ZUGZWANG</text>
      <text x="200" y="186" textAnchor="middle" fill="#8b5cf6" fillOpacity="0.4" fontSize="10" fontFamily="system-ui" letterSpacing="3">NO GOOD MOVES</text>
    </svg>
  );
}

/* ================================================================== */
/*  Calculation Training  brain/neural network, chess pieces           */
/* ================================================================== */
function CalculationTrainingArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ct-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0e1a" /><stop offset="1" stopColor="#0d1025" />
        </linearGradient>
        <radialGradient id="ct-glow" cx="200" cy="100" r="140" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06b6d4" stopOpacity="0.15" /><stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <filter id="ct-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#ct-bg)" />
      <rect width="400" height="200" fill="url(#ct-glow)" />
      {/* Neural network connections — calculation metaphor */}
      <g stroke="#06b6d4" strokeWidth="0.6" strokeOpacity="0.2">
        <line x1="60" y1="100" x2="340" y2="100" />
        <line x1="60" y1="100" x2="200" y2="40" />
        <line x1="60" y1="100" x2="200" y2="160" />
        <line x1="340" y1="100" x2="200" y2="40" />
        <line x1="340" y1="100" x2="200" y2="160" />
        <line x1="200" y1="40" x2="200" y2="160" />
        <line x1="100" y1="70" x2="300" y2="130" />
        <line x1="100" y1="130" x2="300" y2="70" />
      </g>
      {/* Node points — synapses firing */}
      <circle cx="60" cy="100" r="4" fill="#06b6d4" opacity="0.6" filter="url(#ct-f)"/>
      <circle cx="340" cy="100" r="4" fill="#06b6d4" opacity="0.6" filter="url(#ct-f)"/>
      <circle cx="200" cy="40" r="3" fill="#22d3ee" opacity="0.5" />
      <circle cx="200" cy="160" r="3" fill="#22d3ee" opacity="0.5" />
      <circle cx="100" cy="70" r="2" fill="#06b6d4" opacity="0.35" />
      <circle cx="300" cy="130" r="2" fill="#06b6d4" opacity="0.35" />
      <circle cx="100" cy="130" r="2" fill="#06b6d4" opacity="0.35" />
      <circle cx="300" cy="70" r="2" fill="#06b6d4" opacity="0.35" />
      {/* Animated synapse pulse */}
      <circle cx="200" cy="100" r="2" fill="#22d3ee" opacity="0.8">
        <animate attributeName="r" values="2;6;2" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite" />
      </circle>
      {/* Chess pieces as thought nodes */}
      <g transform="translate(160,85)">
        <text textAnchor="middle" fill="#fbbf24" fontSize="22" fontFamily="serif" opacity="0.8">♘</text>
      </g>
      <g transform="translate(240,85)">
        <text textAnchor="middle" fill="#fbbf24" fontSize="22" fontFamily="serif" opacity="0.8">♗</text>
      </g>
      <g transform="translate(200,115)">
        <text textAnchor="middle" fill="#fbbf24" fontSize="22" fontFamily="serif" opacity="0.8">♔</text>
      </g>
      {/* Branching lines — calculating variations */}
      <path d="M260,85 Q280,75 290,80 Q300,85 295,95 Q290,105 300,110" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="2 2" />
      <path d="M140,85 Q120,75 110,80 Q100,85 105,95 Q110,105 100,110" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="2 2" />
      {/* Title text */}
      <text x="200" y="36" textAnchor="middle" fill="#06b6d4" fillOpacity="0.35" fontSize="8" fontFamily="system-ui" letterSpacing="4">CALCULATION</text>
      <text x="200" y="186" textAnchor="middle" fill="#64748b" fillOpacity="0.3" fontSize="9" fontFamily="system-ui" letterSpacing="2">CANDIDATES · FORCING · DEPTH · CHECK</text>
      {/* Arrow showing depth progression */}
      <path d="M80,172 L100,168 M90,170 L110,166 M100,168 L120,164" fill="none" stroke="#f59e0b" strokeWidth="0.6" strokeOpacity="0.25" />
    </svg>
  );
}

/* ================================================================== */
/*  Visualisation Training  mind's eye seeing 3 moves ahead            */
/* ================================================================== */
function VisualisationTrainingArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vis-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0e1a" /><stop offset="1" stopColor="#0d1025" />
        </linearGradient>
        <radialGradient id="vis-glow" cx="200" cy="100" r="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.15" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vis-beam" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.3" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
        <filter id="vis-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#vis-bg)" />
      <rect width="400" height="200" fill="url(#vis-glow)" />
      {/* Mini chessboard at centre */}
      <g transform="translate(172,78)">
        {[0,1,2,3,4,5].map(r =>
          [0,1,2,3,4,5].filter(c => (r + c) % 2 === 0).map(c => (
            <rect key={`s${r}${c}`} x={c*10} y={r*10} width="10" height="10" fill="#1e293b" fillOpacity="0.6" />
          ))
        )}
        {[0,1,2,3,4,5].map(r =>
          [0,1,2,3,4,5].filter(c => (r + c) % 2 === 1).map(c => (
            <rect key={`t${r}${c}`} x={c*10} y={r*10} width="10" height="10" fill="#334155" fillOpacity="0.35" />
          ))
        )}
        {/* Pieces on board — simplified silhouettes */}
        <text x="0" y="55" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="serif" opacity="0.7">♔</text>
        <text x="10" y="25" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="serif" opacity="0.6">♘</text>
        <text x="20" y="45" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="serif" opacity="0.5">♟</text>
        <text x="30" y="15" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="serif" opacity="0.6">♗</text>
        <text x="40" y="35" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="serif" opacity="0.6">♚</text>
        <text x="50" y="55" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="serif" opacity="0.5">♜</text>
      </g>
      {/* Cylinder beam projecting forward — "seeing ahead" */}
      <ellipse cx="200" cy="75" rx="50" ry="12" fill="url(#vis-beam)" />
      {/* Three projection layers — 1, 2, 3 moves ahead */}
      <g transform="translate(200,155)">
        {/* Layer 1 — 1 move ahead (closest, brightest) */}
        <line x1="-15" y1="5" x2="-20" y2="18" stroke="#a78bfa" strokeWidth="2.5" strokeOpacity="0.8" strokeLinecap="round" />
        <line x1="15" y1="5" x2="20" y2="18" stroke="#a78bfa" strokeWidth="2.5" strokeOpacity="0.8" strokeLinecap="round" />
        <line x1="0" y1="5" x2="0" y2="22" stroke="#a78bfa" strokeWidth="2.5" strokeOpacity="0.8" strokeLinecap="round" />
        <circle cx="-20" cy="18" r="2.5" fill="#a78bfa" opacity="0.9" filter="url(#vis-f)" />
        <circle cx="20" cy="18" r="2.5" fill="#a78bfa" opacity="0.9" filter="url(#vis-f)" />
        <circle cx="0" cy="22" r="2.5" fill="#a78bfa" opacity="0.9" filter="url(#vis-f)" />
        
        {/* Layer 2 — 2 moves ahead (medium distance) */}
        <line x1="-20" y1="18" x2="-28" y2="32" stroke="#a78bfa" strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round" />
        <line x1="20" y1="18" x2="28" y2="32" stroke="#a78bfa" strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round" />
        <line x1="0" y1="22" x2="0" y2="36" stroke="#a78bfa" strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round" />
        <circle cx="-28" cy="32" r="2" fill="#a78bfa" opacity="0.65" />
        <circle cx="28" cy="32" r="2" fill="#a78bfa" opacity="0.65" />
        <circle cx="0" cy="36" r="2" fill="#a78bfa" opacity="0.65" />
        
        {/* Layer 3 — 3 moves ahead (farthest, faintest) */}
        <line x1="-28" y1="32" x2="-35" y2="46" stroke="#a78bfa" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round" />
        <line x1="28" y1="32" x2="35" y2="46" stroke="#a78bfa" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round" />
        <line x1="0" y1="36" x2="0" y2="50" stroke="#a78bfa" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round" />
        <circle cx="-35" cy="46" r="1.5" fill="#a78bfa" opacity="0.4" />
        <circle cx="35" cy="46" r="1.5" fill="#a78bfa" opacity="0.4" />
        <circle cx="0" cy="50" r="1.5" fill="#a78bfa" opacity="0.4" />
      </g>
      {/* Eye silhouette at top — the "mind's eye" */}
      <g transform="translate(200,30)">
        <path d="M-28,0 Q-20,-14 0,-14 Q20,-14 28,0 Q20,14 0,14 Q-20,14 -28,0 Z" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeOpacity="0.5" />
        <circle cx="0" cy="0" r="7" fill="#a78bfa" opacity="0.12" />
        <circle cx="0" cy="0" r="3" fill="#a78bfa" opacity="0.35" filter="url(#vis-f)" />
      </g>
      {/* Connecting line from eye to board */}
      <line x1="200" y1="44" x2="200" y2="72" stroke="#a78bfa" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="2 3" />
      {/* Labels */}
      <text x="200" y="184" textAnchor="middle" fill="#a78bfa" fillOpacity="0.3" fontSize="8" fontFamily="system-ui" letterSpacing="4">3 MOVES AHEAD</text>
    </svg>
  );
}

/* ================================================================== */
/*  The London System  — pawn triangle with radiant king & bishop      */
/* ================================================================== */
function LondonSystemArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lon-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="lon-glow" cx="200" cy="100" r="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.2" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lon-tri" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.35" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0.08" />
        </linearGradient>
        <filter id="lon-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#lon-bg)" />
      <rect width="400" height="200" fill="url(#lon-glow)" />
      
      {/* The London Triangle — 3 pawns forming the triangle structure */}
      {/* Central pawn (d4) — the anchor */}
      <g transform="translate(200,70)">
        <circle cx="0" cy="-18" r="12" fill="#a78bfa" fillOpacity="0.85" />
        <path d="M-7,-8 L-11,22 Q0,28 11,22 L7,-8 Z" fill="#a78bfa" fillOpacity="0.8" />
        <ellipse cx="0" cy="24" rx="16" ry="6" fill="#a78bfa" fillOpacity="0.7" />
        {/* Glow ring */}
        <circle cx="0" cy="-18" r="18" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeOpacity="0.5" filter="url(#lon-f)" />
      </g>
      
      {/* Left pawn (c3) */}
      <g transform="translate(152,112) scale(0.85)">
        <circle cx="0" cy="-16" r="10" fill="#8b5cf6" fillOpacity="0.65" />
        <path d="M-6,-7 L-9,18 Q0,23 9,18 L6,-7 Z" fill="#8b5cf6" fillOpacity="0.6" />
        <ellipse cx="0" cy="20" rx="13" ry="5" fill="#8b5cf6" fillOpacity="0.55" />
      </g>
      
      {/* Right pawn (e3) */}
      <g transform="translate(248,112) scale(0.85)">
        <circle cx="0" cy="-16" r="10" fill="#8b5cf6" fillOpacity="0.65" />
        <path d="M-6,-7 L-9,18 Q0,23 9,18 L6,-7 Z" fill="#8b5cf6" fillOpacity="0.6" />
        <ellipse cx="0" cy="20" rx="13" ry="5" fill="#8b5cf6" fillOpacity="0.55" />
      </g>
      
      {/* Connecting lines — triangle shape */}
      <line x1="200" y1="96" x2="152" y2="112" stroke="#a78bfa" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="4 3" />
      <line x1="200" y1="96" x2="248" y2="112" stroke="#a78bfa" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="4 3" />
      <line x1="152" y1="112" x2="248" y2="112" stroke="#a78bfa" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="4 3" />
      
      {/* Bishop silhouette behind the pawns — the Bf4 setup */}
      <g transform="translate(200,38)">
        <path d="M-3,-12 Q0,-16 3,-12 L5,-4 Q6,2 4,6 L2,10 Q1,12 0,12 Q-1,12 -2,10 L-4,6 Q-6,2 -5,-4 Z" fill="#c4b5fd" fillOpacity="0.3" />
        <circle cx="0" cy="-16" r="3" fill="#c4b5fd" fillOpacity="0.25" />
      </g>
      
      {/* Radiant circles emanating from the centre */}
      <circle cx="200" cy="70" r="35" fill="none" stroke="#a78bfa" strokeWidth="0.5" strokeOpacity="0.15" />
      <circle cx="200" cy="70" r="55" fill="none" stroke="#a78bfa" strokeWidth="0.5" strokeOpacity="0.1" />
      <circle cx="200" cy="70" r="75" fill="none" stroke="#a78bfa" strokeWidth="0.5" strokeOpacity="0.06" />
      
      {/* Knight silhouette on the right — representing the Jobava option */}
      <g transform="translate(310,145) scale(0.6)" opacity="0.4">
        <path d="M-5,6 L-7,-12 Q-8,-22 -2,-26 L0,-28 Q3,-25 5,-22 L7,-16 Q9,-12 7,-8 L7,0 Q4,3 -3,3 Z" fill="#c4b5fd" />
        <circle cx="-1" cy="-20" r="1.5" fill="#0c1220" />
      </g>
      
      {/* Small sparkle dots */}
      {[[85,30],[320,25],[360,80],[40,150],[340,170]].map(([x,y],i) => (
        <circle key={`sp${i}`} cx={x} cy={y} r={1.2} fill="#a78bfa" fillOpacity={0.25 + i*0.05}>
          <animate attributeName="opacity" values={`${0.3};0.05;0.3`} dur={`${2.5+i*0.8}s`} repeatCount="indefinite" />
        </circle>
      ))}
      
      {/* Ground line */}
      <line x1="100" y1="160" x2="300" y2="160" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.3" />
      
      {/* Label */}
      <text x="200" y="188" textAnchor="middle" fill="#a78bfa" fillOpacity="0.25" fontSize="8" fontFamily="system-ui" letterSpacing="3">LONDON SYSTEM</text>
    </svg>
  );
}

/* ================================================================== */
/*  Queen's Gambit  — two pawns centre, radiant arrow & crown          */
/* ================================================================== */
function QueensGambitArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="qg-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0e1a" /><stop offset="1" stopColor="#110a1a" />
        </linearGradient>
        <radialGradient id="qg-glow" cx="200" cy="90" r="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.18" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="qg-arrow" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.15" /><stop offset="0.5" stopColor="#fbbf24" stopOpacity="0.4" /><stop offset="1" stopColor="#fbbf24" stopOpacity="0.15" />
        </linearGradient>
        <filter id="qg-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="qg-f2"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#qg-bg)" />
      <rect width="400" height="200" fill="url(#qg-glow)" />

      {/* Queen crown silhouette — the Queen's Gambit emblem */}
      <g transform="translate(200,42)">
        {/* Crown base */}
        <path d="M-28,10 L-22,-2 Q-18,-8 -14,-10 Q-10,-12 -6,-8 L0,0 L6,-8 Q10,-12 14,-10 Q18,-8 22,-2 L28,10 Z" fill="#fbbf24" fillOpacity="0.6" />
        {/* Crown points */}
        <circle cx="-20" cy="-3" r="4" fill="#fbbf24" fillOpacity="0.8" filter="url(#qg-f)" />
        <circle cx="0" cy="2" r="5" fill="#fbbf24" fillOpacity="0.9" filter="url(#qg-f)" />
        <circle cx="20" cy="-3" r="4" fill="#fbbf24" fillOpacity="0.8" filter="url(#qg-f)" />
        {/* Jewel accent */}
        <circle cx="0" cy="6" r="2.5" fill="#f59e0b" fillOpacity="0.9" />
      </g>

      {/* White pawn on d4 (left centre) */}
      <g transform="translate(150,92)">
        <circle cx="0" cy="-18" r="13" fill="#fbbf24" fillOpacity="0.85" />
        <path d="M-8,-7 L-12,24 Q0,30 12,24 L8,-7 Z" fill="#fbbf24" fillOpacity="0.8" />
        <ellipse cx="0" cy="26" rx="17" ry="6" fill="#fbbf24" fillOpacity="0.7" />
        {/* Glow ring */}
        <circle cx="0" cy="-18" r="19" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.5" filter="url(#qg-f)" />
      </g>

      {/* Black pawn on d5 (right centre) — the target */}
      <g transform="translate(250,92)">
        <circle cx="0" cy="-18" r="13" fill="#94a3b8" fillOpacity="0.85" />
        <path d="M-8,-7 L-12,24 Q0,30 12,24 L8,-7 Z" fill="#64748b" fillOpacity="0.8" />
        <ellipse cx="0" cy="26" rx="17" ry="6" fill="#64748b" fillOpacity="0.7" />
      </g>

      {/* The gambit arrow — c4->d5, offering the pawn */}
      <path d="M170,130 Q185,103 230,105" fill="none" stroke="url(#qg-arrow)" strokeWidth="4" strokeOpacity="0.7" strokeDasharray="8 4">
        <animate attributeName="strokeDashoffset" from="0" to="-24" dur="1.5s" repeatCount="indefinite" />
      </path>
      {/* Arrowhead */}
      <polygon points="230,105 218,97 220,113" fill="#fbbf24" fillOpacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
      </polygon>

      {/* Support pawn on c4 — the gambit pawn */}
      <g transform="translate(115,130) scale(0.65)">
        <circle cx="0" cy="-16" r="10" fill="#f59e0b" fillOpacity="0.6" />
        <path d="M-5,-6 L-8,16 Q0,20 8,16 L5,-6 Z" fill="#f59e0b" fillOpacity="0.55" />
        <ellipse cx="0" cy="18" rx="12" ry="4.5" fill="#f59e0b" fillOpacity="0.5" />
      </g>

      {/* Variation labels */}
      <g opacity="0.3">
        <text x="90" y="172" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="system-ui" letterSpacing="2">QGD</text>
        <text x="200" y="172" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="system-ui" letterSpacing="2">QGA</text>
        <text x="310" y="172" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="system-ui" letterSpacing="2">SLAV</text>
      </g>

      {/* Connecting lines to variations */}
      <line x1="135" y1="110" x2="90" y2="165" stroke="#fbbf24" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="2 2" />
      <line x1="200" y1="110" x2="200" y2="165" stroke="#fbbf24" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="2 2" />
      <line x1="265" y1="110" x2="310" y2="165" stroke="#fbbf24" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="2 2" />

      {/* Title */}
      <text x="200" y="190" textAnchor="middle" fill="#fbbf24" fillOpacity="0.2" fontSize="8" fontFamily="system-ui" letterSpacing="4">QUEEN'S GAMBIT</text>

      {/* Small decorative sparkles */}
      {[[70,30],[330,45],[360,140],[40,160],[300,30]].map(([x,y],i) => (
        <circle key={`sp${i}`} cx={x} cy={y} r={1.2} fill="#fbbf24" fillOpacity={0.2 + i*0.06}>
          <animate attributeName="opacity" values={`0.3;0.05;0.3`} dur={`${2+i*0.7}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* ================================================================== */
/*  Average Centipawn Loss Guide  gauge + accuracy rings              */
/* ================================================================== */
function AverageCentipawnLossGuideArt() {
  return (
    <svg viewBox="0 0 400 220" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aclg-bg" x1="0" y1="0" x2="400" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#14102a" />
        </linearGradient>
        <linearGradient id="aclg-gauge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22c55e" /><stop offset="0.5" stopColor="#fbbf24" /><stop offset="1" stopColor="#ef4444" />
        </linearGradient>
        <radialGradient id="aclg-glow" cx="200" cy="110" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.22" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="aclg-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="220" fill="url(#aclg-bg)" />
      <rect width="400" height="220" fill="url(#aclg-glow)" />
      {/* Circular gauge arc */}
      <path d="M 80 160 A 90 90 0 0 1 320 160" fill="none" stroke="url(#aclg-gauge)" strokeWidth="14" strokeLinecap="round" strokeOpacity="0.85" />
      <path d="M 80 160 A 90 90 0 0 1 320 160" fill="none" stroke="#475569" strokeWidth="14" strokeLinecap="round" strokeOpacity="0.2" strokeDasharray="2 6" />
      {/* Needle pointing to "average" zone */}
      <line x1="200" y1="160" x2="255" y2="105" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" filter="url(#aclg-f)" />
      <circle cx="200" cy="160" r="8" fill="#fbbf24" fillOpacity="0.9" />
      {/* Tick labels */}
      <text x="75" y="180" textAnchor="middle" fill="#22c55e" fillOpacity="0.6" fontSize="11" fontWeight="600">0</text>
      <text x="200" y="55" textAnchor="middle" fill="#fbbf24" fillOpacity="0.6" fontSize="11" fontWeight="600">50</text>
      <text x="325" y="180" textAnchor="middle" fill="#ef4444" fillOpacity="0.6" fontSize="11" fontWeight="600">100+</text>
      {/* Center value */}
      <text x="200" y="145" textAnchor="middle" fill="#f1f5f9" fontSize="28" fontWeight="700" fillOpacity="0.9">42</text>
      <text x="200" y="165" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="500">ACPL</text>
      {/* Floating accuracy rings */}
      <circle cx="120" cy="70" r="18" fill="none" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 3">
        <animate attributeName="strokeDashoffset" from="14" to="0" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="290" cy="60" r="14" fill="none" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.35" strokeDasharray="3 4">
        <animate attributeName="strokeDashoffset" from="14" to="0" dur="2.5s" repeatCount="indefinite" />
      </circle>
      {/* Small pawn silhouette */}
      <g transform="translate(340,120) scale(0.6)">
        <circle cx="0" cy="-14" r="8" fill="#94a3b8" fillOpacity="0.4" />
        <path d="M-5,-7 L-8,12 Q0,16 8,12 L5,-7 Z" fill="#94a3b8" fillOpacity="0.4" />
        <ellipse cx="0" cy="14" rx="10" ry="3.5" fill="#94a3b8" fillOpacity="0.35" />
      </g>
    </svg>
  );
}

/* ================================================================== */
/*  Best Chess Variants  4 variant cards fanned out                   */
/* ================================================================== */
function BestChessVariantsArt() {
  return (
    <svg viewBox="0 0 400 240" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bcv-bg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="bcv-glow" cx="200" cy="100" r="140" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.18" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <filter id="bcv-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="240" fill="url(#bcv-bg)" />
      <rect width="400" height="240" fill="url(#bcv-glow)" />
      {/* Card 1 - Chess960 (left, rotated) */}
      <g transform="translate(90,100) rotate(-12)">
        <rect x="-45" y="-65" width="90" height="130" rx="8" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.5" />
        <text x="0" y="-45" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="700" fillOpacity="0.8">960</text>
        {[0,1,2,3,4,5,6,7].map(i => (
          <rect key={`f1${i}`} x={-35+i*9} y="-30" width="8" height="8" fill={i%2===0?"#334155":"#1e293b"} stroke="#475569" strokeWidth="0.3" />
        ))}
        {[0,1,2,3,4,5,6,7].map(i => (
          <rect key={`f2${i}`} x={-35+i*9} y="-20" width="8" height="8" fill={i%2===1?"#334155":"#1e293b"} stroke="#475569" strokeWidth="0.3" />
        ))}
        <circle cx="-28" cy="-26" r="3" fill="#a78bfa" fillOpacity="0.6" />
        <rect x="-19" y="-29" width="5" height="6" rx="1" fill="#a78bfa" fillOpacity="0.6" />
        <circle cx="-5" cy="-26" r="3" fill="#a78bfa" fillOpacity="0.6" />
        <rect x="5" y="-29" width="5" height="6" rx="1" fill="#a78bfa" fillOpacity="0.6" />
        <circle cx="16" cy="-26" r="3" fill="#a78bfa" fillOpacity="0.6" />
        <rect x="25" y="-29" width="5" height="6" rx="1" fill="#a78bfa" fillOpacity="0.6" />
      </g>
      {/* Card 2 - Crazyhouse (center-left, slightly rotated) */}
      <g transform="translate(160,95) rotate(-4)">
        <rect x="-45" y="-65" width="90" height="130" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" />
        <text x="0" y="-45" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="700" fillOpacity="0.8">CRAZY</text>
        <circle cx="-20" cy="-25" r="5" fill="#f59e0b" fillOpacity="0.5" />
        <circle cx="0" cy="-25" r="5" fill="#f59e0b" fillOpacity="0.5" />
        <circle cx="20" cy="-25" r="5" fill="#f59e0b" fillOpacity="0.5" />
        <line x1="-20" y1="-18" x2="-20" y2="-5" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
        <polygon points="-20,-5 -23,-10 -17,-10" fill="#f59e0b" fillOpacity="0.6" />
        <line x1="20" y1="-18" x2="20" y2="-5" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
        <polygon points="20,-5 17,-10 23,-10" fill="#f59e0b" fillOpacity="0.6" />
      </g>
      {/* Card 3 - King of the Hill (center-right) */}
      <g transform="translate(240,95) rotate(4)">
        <rect x="-45" y="-65" width="90" height="130" rx="8" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.5" />
        <text x="0" y="-45" textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="700" fillOpacity="0.8">KOTH</text>
        <path d="M-25,15 L0,-20 L25,15 Z" fill="#22c55e" fillOpacity="0.25" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.4" />
        <g transform="translate(0,-20) scale(0.5)">
          <rect x="-2" y="-14" width="4" height="6" fill="#4ade80" fillOpacity="0.7" />
          <rect x="-5" y="-12" width="10" height="3" fill="#4ade80" fillOpacity="0.7" />
          <circle cx="0" cy="-5" r="5" fill="#4ade80" fillOpacity="0.7" />
          <path d="M-4,0 L-7,10 Q0,13 7,10 L4,0 Z" fill="#4ade80" fillOpacity="0.7" />
        </g>
      </g>
      {/* Card 4 - Atomic (right, rotated) */}
      <g transform="translate(310,100) rotate(12)">
        <rect x="-45" y="-65" width="90" height="130" rx="8" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.5" />
        <text x="0" y="-45" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700" fillOpacity="0.8">ATOMIC</text>
        <g transform="translate(0,-15)">
          {[0,45,90,135,180,225,270,315].map((deg,i) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = Math.cos(rad) * 8;
            const y1 = Math.sin(rad) * 8;
            const x2 = Math.cos(rad) * 16;
            const y2 = Math.sin(rad) * 16;
            return <line key={`ex${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ef4444" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" />;
          })}
          <circle cx="0" cy="0" r="6" fill="#ef4444" fillOpacity="0.5" />
        </g>
      </g>
      {/* Sparkles */}
      {[[50,40],[350,50],[200,30],[120,200],[280,210]].map(([x,y],i) => (
        <circle key={`sp${i}`} cx={x} cy={y} r={1.5} fill="#a78bfa" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values={`0.3;0.05;0.3`} dur={`${2+i*0.6}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* ================================================================== */
/*  Mistakes by Rating  pyramid with piece tiers                      */
/* ================================================================== */
function MistakesByRatingArt() {
  return (
    <svg viewBox="0 0 400 240" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mbr-bg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#14102a" />
        </linearGradient>
        <linearGradient id="mbr-pyr" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.7" /><stop offset="0.5" stopColor="#f59e0b" stopOpacity="0.6" /><stop offset="1" stopColor="#22c55e" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="mbr-glow" cx="200" cy="120" r="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.15" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#mbr-bg)" />
      <rect width="400" height="240" fill="url(#mbr-glow)" />
      {/* Pyramid tiers */}
      <path d="M200,40 L280,200 L120,200 Z" fill="url(#mbr-pyr)" stroke="#475569" strokeWidth="1" strokeOpacity="0.4" />
      {/* Tier dividers */}
      <line x1="170" y1="120" x2="230" y2="120" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="150" y1="160" x2="250" y2="160" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* Tier labels */}
      <text x="200" y="110" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700" fillOpacity="0.85">BLUNDERS</text>
      <text x="200" y="150" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="600" fillOpacity="0.75">MISTAKES</text>
      <text x="200" y="190" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="500" fillOpacity="0.65">INACCURACIES</text>
      {/* Rating labels on left */}
      <text x="70" y="80" textAnchor="middle" fill="#64748b" fontSize="9" fillOpacity="0.6">1200</text>
      <text x="70" y="140" textAnchor="middle" fill="#64748b" fontSize="9" fillOpacity="0.6">1600</text>
      <text x="70" y="200" textAnchor="middle" fill="#64748b" fontSize="9" fillOpacity="0.6">2000+</text>
      {/* Blunder icon at top */}
      <g transform="translate(200,60) scale(0.7)">
        <circle cx="0" cy="0" r="8" fill="#ef4444" fillOpacity="0.7" />
        <text x="0" y="4" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">??</text>
      </g>
      {/* Mistake icon middle */}
      <g transform="translate(200,140) scale(0.6)">
        <circle cx="0" cy="0" r="8" fill="#f59e0b" fillOpacity="0.6" />
        <text x="0" y="4" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">?</text>
      </g>
      {/* Inaccuracy icon bottom */}
      <g transform="translate(200,180) scale(0.5)">
        <circle cx="0" cy="0" r="8" fill="#22c55e" fillOpacity="0.5" />
        <text x="0" y="4" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">?!</text>
      </g>
      {/* Falling pieces from top (blunders) */}
      <g transform="translate(150,70) rotate(30)">
        <circle cx="0" cy="0" r="4" fill="#94a3b8" fillOpacity="0.4" />
        <path d="M-3,3 L-5,14 Q0,17 5,14 L3,3 Z" fill="#94a3b8" fillOpacity="0.4" />
      </g>
      <g transform="translate(260,90) rotate(-45)">
        <path d="M-4,5 L-6,-10 Q-7,-18 -2,-22 L0,-24 Q2,-21 4,-18 L6,-12 Q8,-8 6,-4 L6,2 Q3,5 -2,5 Z" fill="#94a3b8" fillOpacity="0.35" />
      </g>
      {/* Rising graph line */}
      <path d="M60,210 Q120,180 200,150 Q280,120 340,80" fill="none" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="6 4">
        <animate attributeName="strokeDashoffset" from="20" to="0" dur="2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

/* ================================================================== */
/*  Opening Principles  compass + board with arrows                   */
/* ================================================================== */
function OpeningPrinciplesArt() {
  return (
    <svg viewBox="0 0 400 220" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="op-bg" x1="0" y1="0" x2="400" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="op-glow" cx="200" cy="110" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06b6d4" stopOpacity="0.2" /><stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <filter id="op-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="220" fill="url(#op-bg)" />
      <rect width="400" height="220" fill="url(#op-glow)" />
      {/* Mini chess board */}
      {[0,1,2,3,4,5,6,7].map(r =>
        [0,1,2,3,4,5,6,7].map(c => (
          <rect key={`b${r}${c}`} x={120+c*20} y={40+r*18} width="20" height="18" fill={(r+c)%2===0?"#334155":"#1e293b"} stroke="#475569" strokeWidth="0.3" />
        ))
      )}
      {/* Center squares highlighted */}
      <rect x="180" y="76" width="20" height="18" fill="#06b6d4" fillOpacity="0.3" />
      <rect x="200" y="76" width="20" height="18" fill="#06b6d4" fillOpacity="0.3" />
      <rect x="180" y="94" width="20" height="18" fill="#06b6d4" fillOpacity="0.3" />
      <rect x="200" y="94" width="20" height="18" fill="#06b6d4" fillOpacity="0.3" />
      {/* Development arrows */}
      <line x1="140" y1="170" x2="180" y2="100" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.7" strokeDasharray="4 3">
        <animate attributeName="strokeDashoffset" from="14" to="0" dur="1.5s" repeatCount="indefinite" />
      </line>
      <polygon points="180,100 175,108 183,106" fill="#22c55e" fillOpacity="0.7" />
      <line x1="260" y1="170" x2="220" y2="100" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.7" strokeDasharray="4 3">
        <animate attributeName="strokeDashoffset" from="14" to="0" dur="1.5s" repeatCount="indefinite" />
      </line>
      <polygon points="220,100 217,108 225,106" fill="#22c55e" fillOpacity="0.7" />
      {/* Pawn advances */}
      <line x1="200" y1="160" x2="200" y2="115" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="3 3" />
      <polygon points="200,115 196,122 204,122" fill="#fbbf24" fillOpacity="0.6" />
      {/* Knight jump */}
      <path d="M150,165 Q160,140 175,110" fill="none" stroke="#06b6d4" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="4 3" />
      <polygon points="175,110 170,118 178,116" fill="#06b6d4" fillOpacity="0.6" />
      {/* Compass rose at top */}
      <g transform="translate(200,28)" filter="url(#op-f)">
        <circle cx="0" cy="0" r="16" fill="none" stroke="#67e8f9" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="0" y1="-14" x2="0" y2="14" stroke="#67e8f9" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="-14" y1="0" x2="14" y2="0" stroke="#67e8f9" strokeWidth="1" strokeOpacity="0.6" />
        <polygon points="0,-14 3,-6 0,-8 -3,-6" fill="#67e8f9" fillOpacity="0.8" />
      </g>
      {/* Principle labels */}
      <text x="80" y="190" textAnchor="middle" fill="#64748b" fontSize="8" fillOpacity="0.6">CENTER</text>
      <text x="200" y="200" textAnchor="middle" fill="#64748b" fontSize="8" fillOpacity="0.6">DEVELOP</text>
      <text x="320" y="190" textAnchor="middle" fill="#64748b" fontSize="8" fillOpacity="0.6">CASTLE</text>
    </svg>
  );
}

/* ================================================================== */
/*  Opening Traps  bear trap + chess pieces                           */
/* ================================================================== */
function OpeningTrapsArt() {
  return (
    <svg viewBox="0 0 400 220" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ot-bg" x1="0" y1="0" x2="400" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#1c1008" />
        </linearGradient>
        <radialGradient id="ot-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.2" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <filter id="ot-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="220" fill="url(#ot-bg)" />
      <rect width="400" height="220" fill="url(#ot-glow)" />
      {/* Ground */}
      <rect x="0" y="150" width="400" height="70" fill="#1e293b" fillOpacity="0.5" />
      <line x1="0" y1="150" x2="400" y2="150" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* Trap jaws - open */}
      <g transform="translate(200,145)">
        {/* Left jaw */}
        <path d="M-60,0 L-50,-35 L-20,-15 L0,-40 L20,-15 L50,-35 L60,0" fill="none" stroke="#94a3b8" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round" strokeLinejoin="round" />
        {/* Right jaw (mirrored, slightly offset for open effect) */}
        <path d="M-60,5 L-50,40 L-20,20 L0,45 L20,20 L50,40 L60,5" fill="none" stroke="#94a3b8" strokeWidth="3" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Trap base */}
        <ellipse cx="0" cy="5" rx="55" ry="12" fill="none" stroke="#64748b" strokeWidth="2" strokeOpacity="0.4" />
        {/* Bait - pawn on a string */}
        <g transform="translate(0,-55)">
          <line x1="0" y1="0" x2="0" y2="20" stroke="#64748b" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="3 2" />
          <g transform="translate(0,25) scale(0.8)">
            <circle cx="0" cy="-10" r="7" fill="#fbbf24" fillOpacity="0.8" />
            <path d="M-5,-4 L-8,14 Q0,18 8,14 L5,-4 Z" fill="#fbbf24" fillOpacity="0.7" />
            <ellipse cx="0" cy="16" rx="10" ry="3.5" fill="#fbbf24" fillOpacity="0.6" />
          </g>
        </g>
      </g>
      {/* Warning signs */}
      <g transform="translate(80,80)">
        <path d="M0,-20 L18,15 L-18,15 Z" fill="none" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.7" />
        <line x1="0" y1="-8" x2="0" y2="5" stroke="#ef4444" strokeWidth="2.5" strokeOpacity="0.8" strokeLinecap="round" />
        <circle cx="0" cy="10" r="1.5" fill="#ef4444" fillOpacity="0.8" />
      </g>
      <g transform="translate(320,85) scale(0.8)">
        <path d="M0,-20 L18,15 L-18,15 Z" fill="none" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.6" />
        <line x1="0" y1="-8" x2="0" y2="5" stroke="#ef4444" strokeWidth="2.5" strokeOpacity="0.7" strokeLinecap="round" />
        <circle cx="0" cy="10" r="1.5" fill="#ef4444" fillOpacity="0.7" />
      </g>
      {/* Unsuspecting knight approaching */}
      <g transform="translate(120,120) scale(0.6)">
        <path d="M-5,6 L-7,-12 Q-8,-22 -2,-26 L0,-28 Q3,-25 5,-22 L7,-16 Q9,-12 7,-8 L7,0 Q4,3 -3,3 Z" fill="#cbd5e1" fillOpacity="0.6" />
        <circle cx="-1" cy="-20" r="1.5" fill="#0c1220" fillOpacity="0.7" />
        <ellipse cx="0" cy="6" rx="8" ry="3" fill="#cbd5e1" fillOpacity="0.5" />
      </g>
      {/* Motion lines */}
      <line x1="140" y1="115" x2="160" y2="110" stroke="#64748b" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="140" y1="125" x2="160" y2="120" stroke="#64748b" strokeWidth="1" strokeOpacity="0.3" />
      {/* Snap lines (jaw closing animation hint) */}
      <line x1="170" y1="140" x2="230" y2="140" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 3">
        <animate attributeName="strokeDashoffset" from="14" to="0" dur="0.8s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/* ================================================================== */
/*  FireChess vs AimChess  VS scene with two platforms                */
/* ================================================================== */
function FirechessVsAimchessArt() {
  return (
    <svg viewBox="0 0 400 220" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fva-bg" x1="0" y1="0" x2="400" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#14102a" />
        </linearGradient>
        <linearGradient id="fva-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f97316" stopOpacity="0.3" /><stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fva-right" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0.3" /><stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <filter id="fva-f"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="220" fill="url(#fva-bg)" />
      <rect width="200" height="220" fill="url(#fva-left)" />
      <rect x="200" width="200" height="220" fill="url(#fva-right)" />
      {/* VS circle in center */}
      <circle cx="200" cy="110" r="28" fill="#0c1220" stroke="#f59e0b" strokeWidth="2.5" strokeOpacity="0.8" filter="url(#fva-f)" />
      <text x="200" y="118" textAnchor="middle" fill="#f59e0b" fontSize="18" fontWeight="800" fillOpacity="0.9">VS</text>
      {/* Left side - FireChess */}
      <g transform="translate(100,110)">
        {/* Flame/knight hybrid */}
        <path d="M-20,30 Q-25,10 -15,-5 Q-20,-20 -10,-30 Q-5,-35 0,-32 Q5,-35 10,-30 Q20,-20 15,-5 Q25,10 20,30 Q0,40 -20,30 Z" fill="#f97316" fillOpacity="0.5" />
        <path d="M-8,-15 Q-5,-25 0,-28 Q5,-25 8,-15" fill="none" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
        {/* Knight head silhouette */}
        <g transform="translate(0,-5) scale(0.9)">
          <path d="M-6,8 L-8,-10 Q-9,-20 -2,-24 L0,-26 Q3,-23 6,-20 L8,-14 Q10,-10 8,-6 L8,2 Q4,6 -4,6 Z" fill="#fbbf24" fillOpacity="0.6" />
          <circle cx="-1" cy="-18" r="2" fill="#0c1220" fillOpacity="0.8" />
        </g>
        <text x="0" y="55" textAnchor="middle" fill="#f97316" fontSize="11" fontWeight="700" fillOpacity="0.8">FIRECHESS</text>
        {/* Feature dots */}
        <circle cx="-30" cy="45" r="2" fill="#f97316" fillOpacity="0.5" />
        <circle cx="-15" cy="50" r="2" fill="#f97316" fillOpacity="0.5" />
        <circle cx="0" cy="52" r="2" fill="#f97316" fillOpacity="0.5" />
        <circle cx="15" cy="50" r="2" fill="#f97316" fillOpacity="0.5" />
        <circle cx="30" cy="45" r="2" fill="#f97316" fillOpacity="0.5" />
      </g>
      {/* Right side - AimChess */}
      <g transform="translate(300,110)">
        {/* Target/crosshair */}
        <circle cx="0" cy="-10" r="22" fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.6" />
        <circle cx="0" cy="-10" r="14" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" />
        <circle cx="0" cy="-10" r="6" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="0" y1="-32" x2="0" y2="12" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="-22" y1="-10" x2="22" y2="-10" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.4" />
        <circle cx="0" cy="-10" r="3" fill="#3b82f6" fillOpacity="0.5" />
        <text x="0" y="55" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="700" fillOpacity="0.8">AIMCHESS</text>
        {/* Feature dots */}
        <circle cx="-30" cy="45" r="2" fill="#3b82f6" fillOpacity="0.5" />
        <circle cx="-15" cy="50" r="2" fill="#3b82f6" fillOpacity="0.5" />
        <circle cx="0" cy="52" r="2" fill="#3b82f6" fillOpacity="0.5" />
        <circle cx="15" cy="50" r="2" fill="#3b82f6" fillOpacity="0.5" />
        <circle cx="30" cy="45" r="2" fill="#3b82f6" fillOpacity="0.5" />
      </g>
      {/* Comparison bars at bottom */}
      <rect x="60" y="180" width="80" height="6" rx="3" fill="#f97316" fillOpacity="0.6" />
      <rect x="60" y="192" width="65" height="6" rx="3" fill="#f97316" fillOpacity="0.4" />
      <rect x="260" y="180" width="60" height="6" rx="3" fill="#3b82f6" fillOpacity="0.5" />
      <rect x="260" y="192" width="75" height="6" rx="3" fill="#3b82f6" fillOpacity="0.35" />
      {/* Lightning bolts between */}
      <path d="M175,95 L170,105 L178,102 L172,115" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M225,95 L220,105 L228,102 L222,115" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" />
    </svg>
  );
}

/* ================================================================== */
/*  How to Review Games  magnifier + replay arrows                    */
/* ================================================================== */
function ReviewGamesArt() {
  return (
    <svg viewBox="0 0 400 220" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hrg-bg" x1="0" y1="0" x2="400" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="hrg-glow" cx="200" cy="100" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.2" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <filter id="hrg-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="220" fill="url(#hrg-bg)" />
      <rect width="400" height="220" fill="url(#hrg-glow)" />
      {/* Game notation sheet */}
      <rect x="80" y="40" width="120" height="140" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" strokeOpacity="0.5" />
      {/* Notation lines */}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <line key={`nl${i}`} x1="90" y1={58+i*13} x2="180" y2={58+i*13} stroke="#475569" strokeWidth="0.5" strokeOpacity="0.4" />
      ))}
      {/* Highlighted move */}
      <rect x="88" y="100" width="100" height="12" rx="2" fill="#8b5cf6" fillOpacity="0.25" />
      <text x="95" y="110" fill="#a78bfa" fontSize="8" fontFamily="monospace" fillOpacity="0.8">12. Nf3?</text>
      {/* Rewind/replay arrows */}
      <g transform="translate(280,80)" filter="url(#hrg-f)">
        <path d="M0,0 A20,20 0 1,1 -15,15" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeOpacity="0.7" strokeLinecap="round" />
        <polygon points="-15,15 -20,8 -12,5" fill="#8b5cf6" fillOpacity="0.7" />
      </g>
      <g transform="translate(280,140)">
        <path d="M0,0 A20,20 0 1,0 15,-15" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round" />
        <polygon points="15,-15 20,-8 12,-5" fill="#06b6d4" fillOpacity="0.6" />
      </g>
      {/* Magnifying glass over notation */}
      <circle cx="140" cy="106" r="25" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeOpacity="0.7" filter="url(#hrg-f)" />
      <circle cx="140" cy="106" r="25" fill="#8b5cf6" fillOpacity="0.08" />
      <line x1="158" y1="124" x2="180" y2="146" stroke="#a78bfa" strokeWidth="5" strokeOpacity="0.6" strokeLinecap="round" />
      {/* Thought bubble with question mark */}
      <g transform="translate(320,50)">
        <ellipse cx="0" cy="0" rx="18" ry="14" fill="#1e293b" stroke="#64748b" strokeWidth="1" strokeOpacity="0.5" />
        <ellipse cx="-12" cy="16" rx="6" ry="5" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" strokeOpacity="0.4" />
        <ellipse cx="-20" cy="26" rx="4" ry="3" fill="#1e293b" stroke="#64748b" strokeWidth="0.6" strokeOpacity="0.3" />
        <text x="0" y="5" textAnchor="middle" fill="#a78bfa" fontSize="16" fontWeight="700" fillOpacity="0.8">?</text>
      </g>
      {/* Correction arrow */}
      <line x1="240" y1="170" x2="280" y2="150" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="5 3">
        <animate attributeName="strokeDashoffset" from="16" to="0" dur="1.2s" repeatCount="indefinite" />
      </line>
      <polygon points="280,150 272,152 276,146" fill="#22c55e" fillOpacity="0.6" />
      <text x="295" y="145" fill="#4ade80" fontSize="8" fillOpacity="0.7">Better!</text>
    </svg>
  );
}

/* ================================================================== */
/*  Opening Tree  branching repertoire tree                           */
/* ================================================================== */
function OpeningTreeArt() {
  return (
    <svg viewBox="0 0 400 240" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ot2-bg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1220" /><stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="ot2-glow" cx="200" cy="120" r="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.15" /><stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <filter id="ot2-f"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="240" fill="url(#ot2-bg)" />
      <rect width="400" height="240" fill="url(#ot2-glow)" />
      {/* Tree trunk */}
      <path d="M200,220 L200,180" stroke="#94a3b8" strokeWidth="4" strokeOpacity="0.6" strokeLinecap="round" />
      {/* Main branches */}
      <path d="M200,180 Q160,150 120,120" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />
      <path d="M200,180 Q240,150 280,120" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />
      <path d="M200,180 Q200,140 200,100" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />
      {/* Sub-branches left */}
      <path d="M120,120 Q100,100 80,90" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      <path d="M120,120 Q130,95 140,80" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      {/* Sub-branches right */}
      <path d="M280,120 Q300,100 320,90" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      <path d="M280,120 Q270,95 260,80" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      {/* Sub-branches center */}
      <path d="M200,100 Q180,80 170,60" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      <path d="M200,100 Q220,80 230,60" fill="none" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      {/* Leaf nodes - opening names */}
      <g filter="url(#ot2-f)">
        <circle cx="80" cy="85" r="10" fill="#22c55e" fillOpacity="0.5" />
        <text x="80" y="89" textAnchor="middle" fill="#4ade80" fontSize="7" fontWeight="600" fillOpacity="0.9">e4</text>
      </g>
      <g filter="url(#ot2-f)">
        <circle cx="140" cy="75" r="10" fill="#22c55e" fillOpacity="0.5" />
        <text x="140" y="79" textAnchor="middle" fill="#4ade80" fontSize="7" fontWeight="600" fillOpacity="0.9">d4</text>
      </g>
      <g filter="url(#ot2-f)">
        <circle cx="170" cy="55" r="10" fill="#f59e0b" fillOpacity="0.5" />
        <text x="170" y="59" textAnchor="middle" fill="#fbbf24" fontSize="7" fontWeight="600" fillOpacity="0.9">Nf3</text>
      </g>
      <g filter="url(#ot2-f)">
        <circle cx="230" cy="55" r="10" fill="#f59e0b" fillOpacity="0.5" />
        <text x="230" y="59" textAnchor="middle" fill="#fbbf24" fontSize="7" fontWeight="600" fillOpacity="0.9">c4</text>
      </g>
      <g filter="url(#ot2-f)">
        <circle cx="260" cy="75" r="10" fill="#06b6d4" fillOpacity="0.5" />
        <text x="260" y="79" textAnchor="middle" fill="#67e8f9" fontSize="7" fontWeight="600" fillOpacity="0.9">g3</text>
      </g>
      <g filter="url(#ot2-f)">
        <circle cx="320" cy="85" r="10" fill="#06b6d4" fillOpacity="0.5" />
        <text x="320" y="89" textAnchor="middle" fill="#67e8f9" fontSize="7" fontWeight="600" fillOpacity="0.9">b3</text>
      </g>
      {/* Root node */}
      <circle cx="200" cy="220" r="12" fill="#f59e0b" fillOpacity="0.6" filter="url(#ot2-f)" />
      <text x="200" y="224" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="700" fillOpacity="0.9">YOU</text>
      {/* Percentage labels on branches */}
      <text x="155" y="145" fill="#64748b" fontSize="7" fillOpacity="0.6">45%</text>
      <text x="245" y="145" fill="#64748b" fontSize="7" fillOpacity="0.6">30%</text>
      <text x="200" y="135" fill="#64748b" fontSize="7" fillOpacity="0.6">25%</text>
      {/* Small board icons on some leaves */}
      <rect x="75" y="80" width="4" height="4" fill="#334155" stroke="#475569" strokeWidth="0.3" />
      <rect x="79" y="80" width="4" height="4" fill="#1e293b" stroke="#475569" strokeWidth="0.3" />
      <rect x="75" y="84" width="4" height="4" fill="#1e293b" stroke="#475569" strokeWidth="0.3" />
      <rect x="79" y="84" width="4" height="4" fill="#334155" stroke="#475569" strokeWidth="0.3" />
      {/* Decorative sparkles */}
      {[[60,50],[340,40],[200,30],[120,200],[280,190]].map(([x,y],i) => (
        <circle key={`sp${i}`} cx={x} cy={y} r={1.2} fill="#4ade80" fillOpacity={0.2+i*0.05}>
          <animate attributeName="opacity" values={`0.25;0.05;0.25`} dur={`${2+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* ================================================================== */
/*  Batch: previously-default posts                                    */
/* ================================================================== */

/* Caro-Kann: solid pawn wall c6/d5 with a knight peeking over */
function CaroKannArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ck-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#101a14" /><stop offset="1" stopColor="#0a1410" />
        </linearGradient>
        <radialGradient id="ck-glow" cx="200" cy="110" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" stopOpacity="0.2" /><stop offset="1" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <filter id="ck-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#ck-bg)" />
      <rect width="400" height="200" fill="url(#ck-glow)" />
      {/* pawn chain: c6-d5 wedge */}
      <g filter="url(#ck-f)">
        {/* c6 pawn */}
        <g transform="translate(160,80)">
          <circle cx="0" cy="-14" r="8" fill="#34d399" />
          <path d="M-9,10 C-9,-2 -5,-6 0,-6 C5,-6 9,-2 9,10 Z" fill="#34d399" />
          <rect x="-12" y="10" width="24" height="5" rx="2" fill="#34d399" />
        </g>
        {/* d5 pawn */}
        <g transform="translate(230,65)">
          <circle cx="0" cy="-14" r="8" fill="#6ee7b7" />
          <path d="M-9,10 C-9,-2 -5,-6 0,-6 C5,-6 9,-2 9,10 Z" fill="#6ee7b7" />
          <rect x="-12" y="10" width="24" height="5" rx="2" fill="#6ee7b7" />
        </g>
      </g>
      {/* knight silhouette behind */}
      <path d="M120,150 C118,128 128,118 138,112 C134,104 136,96 144,92 C142,86 146,80 152,80 C158,80 160,86 158,90 C168,94 172,104 170,114 C178,120 182,132 180,150 Z"
        fill="#065f46" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.6" />
      {/* diagonal structure lines */}
      <line x1="160" y1="95" x2="230" y2="80" stroke="#34d399" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 3" />
      {/* white pawn approaching */}
      <g transform="translate(290,140)" opacity="0.85">
        <circle cx="0" cy="-14" r="8" fill="#e2e8f0" />
        <path d="M-9,10 C-9,-2 -5,-6 0,-6 C5,-6 9,-2 9,10 Z" fill="#e2e8f0" />
        <rect x="-12" y="10" width="24" height="5" rx="2" fill="#e2e8f0" />
      </g>
      <text x="200" y="180" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700" letterSpacing="3" fillOpacity="0.7">1. e4 c6</text>
      {[[70,50],[330,45],[300,170],[95,175]].map(([x,y],i) => (
        <circle key={`ck${i}`} cx={x} cy={y} r={1.2} fill="#34d399" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.2+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Accuracy by rating: rising gauge + rating steps */
function AccuracyRatingArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ar-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0e1424" /><stop offset="1" stopColor="#0a1020" />
        </linearGradient>
        <radialGradient id="ar-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.2" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <filter id="ar-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#ar-bg)" />
      <rect width="400" height="200" fill="url(#ar-glow)" />
      {/* ascending bars with accuracy % */}
      {[68,74,81,87,92].map((v,i) => (
        <g key={i}>
          <rect x={90+i*46} y={150-v} width="30" height={v} rx="3" fill="#38bdf8" fillOpacity={0.25+i*0.12} />
          <text x={105+i*46} y={146-v} textAnchor="middle" fill="#7dd3fc" fontSize="9" fontWeight="700">{v}%</text>
          <text x={105+i*46} y="162" textAnchor="middle" fill="#475569" fontSize="8">{800+i*400}</text>
        </g>
      ))}
      {/* rising trend line */}
      <path d="M95,120 C160,110 240,85 305,55" fill="none" stroke="#7dd3fc" strokeWidth="2" filter="url(#ar-f)" />
      <circle cx="305" cy="55" r="4" fill="#7dd3fc" filter="url(#ar-f)" />
      {[[60,45],[340,40],[200,35],[120,185]].map(([x,y],i) => (
        <circle key={`ar${i}`} cx={x} cy={y} r={1.2} fill="#38bdf8" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Blunder patterns: warning triangles cascading by rating */
function BlunderPatternsArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bp-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1c1010" /><stop offset="1" stopColor="#140b0b" />
        </linearGradient>
        <radialGradient id="bp-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.2" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <filter id="bp-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#bp-bg)" />
      <rect width="400" height="200" fill="url(#bp-glow)" />
      {/* falling blunder marks by rating band */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <path d={`M${105+i*60},${120-i*14} l14,24 h-28 Z`} fill="none" stroke="#f87171" strokeWidth="2" strokeOpacity={0.9-i*0.18} filter="url(#bp-f)" />
          <text x={105+i*60} y={140-i*14} textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="800">!</text>
          <text x={105+i*60} y="172" textAnchor="middle" fill="#475569" fontSize="8">{["800","1400","2000","2400"][i]}</text>
        </g>
      ))}
      {/* downward count */}
      <text x="200" y="60" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700" letterSpacing="2" fillOpacity="0.8">BLUNDERS PER 100 MOVES</text>
      <path d="M110,72 L290,72" stroke="#7f1d1d" strokeWidth="1" strokeOpacity="0.5" />
      {[[65,55],[335,50],[300,180],[90,185]].map(([x,y],i) => (
        <circle key={`bp${i}`} cx={x} cy={y} r={1.2} fill="#ef4444" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.4+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Gambits: pawn offered on a plate, flame trail */
function GambitsArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gb-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#161021" /><stop offset="1" stopColor="#0f0a18" />
        </linearGradient>
        <radialGradient id="gb-glow" cx="200" cy="105" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0.22" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <filter id="gb-f"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#gb-bg)" />
      <rect width="400" height="200" fill="url(#gb-glow)" />
      {/* sacrificed pawn with flame trail */}
      <g transform="translate(200,105)" filter="url(#gb-f)">
        <circle cx="0" cy="-18" r="10" fill="#c084fc" />
        <path d="M-11,12 C-11,-3 -6,-8 0,-8 C6,-8 11,-3 11,12 Z" fill="#c084fc" />
        <rect x="-14" y="12" width="28" height="6" rx="2.5" fill="#c084fc" />
      </g>
      {/* flames */}
      <path d="M170,130 C165,112 172,100 178,94 C176,104 184,108 182,118 C190,112 194,120 190,130 Z" fill="#f59e0b" fillOpacity="0.8" />
      <path d="M222,132 C220,116 228,106 234,102 C232,110 239,114 237,122 C244,118 247,125 243,132 Z" fill="#f97316" fillOpacity="0.7" />
      {/* decline/accept arrows */}
      <path d="M145,80 C160,70 175,68 188,74" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeOpacity="0.6" markerEnd="url(#gb-arr)" />
      <path d="M255,78 C242,70 228,68 214,73" fill="none" stroke="#f87171" strokeWidth="1.5" strokeOpacity="0.6" />
      <text x="138" y="76" fill="#4ade80" fontSize="8" fontWeight="700" fillOpacity="0.7">ACCEPT?</text>
      <text x="252" y="72" fill="#f87171" fontSize="8" fontWeight="700" fillOpacity="0.7">DECLINE?</text>
      {[[70,50],[330,45],[200,35],[110,180],[290,175]].map(([x,y],i) => (
        <circle key={`gb${i}`} cx={x} cy={y} r={1.2} fill="#a855f7" fillOpacity={0.2+i*0.05}>
          <animate attributeName="opacity" values="0.28;0.07;0.28" dur={`${2.1+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Metrics to track: dashboard tiles with sparkline */
function MetricsArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mt-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0d1420" /><stop offset="1" stopColor="#0a1018" />
        </linearGradient>
        <radialGradient id="mt-glow" cx="200" cy="100" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f97316" stopOpacity="0.16" /><stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <filter id="mt-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#mt-bg)" />
      <rect width="400" height="200" fill="url(#mt-glow)" />
      {/* metric cards */}
      {[
        { x: 95, label: "ACPL", val: "42", color: "#fb923c" },
        { x: 175, label: "ACCURACY", val: "81%", color: "#38bdf8" },
        { x: 255, label: "BLUNDERS", val: "3", color: "#f87171" },
      ].map((c,i) => (
        <g key={i}>
          <rect x={c.x} y="70" width="66" height="52" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
          <text x={c.x+33} y="88" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="700" letterSpacing="1">{c.label}</text>
          <text x={c.x+33} y="110" textAnchor="middle" fill={c.color} fontSize="15" fontWeight="800" filter="url(#mt-f)">{c.val}</text>
        </g>
      ))}
      {/* sparkline under */}
      <path d="M95,150 C130,142 160,152 195,140 C230,128 260,146 305,132" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeOpacity="0.7" />
      {[95,145,195,245,305].map((x,i) => (
        <circle key={`mtp${i}`} cx={x} cy={[150,146,140,138,132][i]} r="2" fill="#fb923c" fillOpacity="0.8" />
      ))}
      {[[60,45],[340,40],[200,32]].map(([x,y],i) => (
        <circle key={`mt${i}`} cx={x} cy={y} r={1.2} fill="#f97316" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.3+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Improvement mistakes: loop with a break */
function ImprovementMistakesArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="im-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#12141c" /><stop offset="1" stopColor="#0c0e14" />
        </linearGradient>
        <radialGradient id="im-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f43f5e" stopOpacity="0.16" /><stop offset="1" stopColor="#f43f5e" stopOpacity="0" />
        </radialGradient>
        <filter id="im-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#im-bg)" />
      <rect width="400" height="200" fill="url(#im-glow)" />
      {/* circular loop arrow */}
      <path d="M200,55 A45,45 0 1 1 155,100" fill="none" stroke="#64748b" strokeWidth="2.5" strokeOpacity="0.5" />
      <path d="M152,92 L155,102 L164,96" fill="none" stroke="#64748b" strokeWidth="2.5" strokeOpacity="0.5" />
      {/* break point with X */}
      <g filter="url(#im-f)">
        <circle cx="200" cy="55" r="11" fill="#f43f5e" fillOpacity="0.25" />
        <path d="M195,50 L205,60 M205,50 L195,60" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* escape arrow upward */}
      <path d="M200,44 C200,30 210,26 224,24" fill="none" stroke="#4ade80" strokeWidth="2" strokeOpacity="0.8" />
      <path d="M218,20 L226,23 L221,29" fill="none" stroke="#4ade80" strokeWidth="2" strokeOpacity="0.8" />
      <text x="236" y="28" fill="#4ade80" fontSize="9" fontWeight="700" fillOpacity="0.8">FIX IT</text>
      <text x="200" y="165" textAnchor="middle" fill="#64748b" fontSize="9" fillOpacity="0.7">the same mistake, every month</text>
      {[[70,50],[330,45],[120,180],[290,178]].map(([x,y],i) => (
        <circle key={`im${i}`} cx={x} cy={y} r={1.2} fill="#f43f5e" fillOpacity={0.22+i*0.05}>
          <animate attributeName="opacity" values="0.28;0.07;0.28" dur={`${2+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Pattern recognition: motif tiles, one highlighted */
function PatternRecognitionArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pr-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0e121e" /><stop offset="1" stopColor="#0a0e16" />
        </linearGradient>
        <radialGradient id="pr-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#818cf8" stopOpacity="0.2" /><stop offset="1" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
        <filter id="pr-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#pr-bg)" />
      <rect width="400" height="200" fill="url(#pr-glow)" />
      {/* motif symbols row: fork pin skewer discovered */}
      {[
        { icon: "⑂", label: "FORK" },
        { icon: "⇤", label: "PIN" },
        { icon: "⊳", label: "SKEWER" },
        { icon: "◎", label: "DISC." },
      ].map((m,i) => (
        <g key={i}>
          <rect x={92+i*58} y="72" width="46" height="52" rx="6"
            fill={i===1 ? "#818cf8" : "#0f172a"} fillOpacity={i===1 ? 0.15 : 1}
            stroke={i===1 ? "#818cf8" : "#1e293b"} strokeWidth={i===1 ? 1.5 : 1}
            filter={i===1 ? "url(#pr-f)" : undefined} />
          <text x={115+i*58} y="104" textAnchor="middle" fill={i===1 ? "#a5b4fc" : "#475569"} fontSize="20">{m.icon}</text>
          <text x={115+i*58} y="136" textAnchor="middle" fill={i===1 ? "#a5b4fc" : "#475569"} fontSize="7" fontWeight="700" letterSpacing="1">{m.label}</text>
        </g>
      ))}
      {/* neural connect lines */}
      <path d="M115,72 C140,50 180,48 200,44 M173,72 C190,56 210,52 230,50" fill="none" stroke="#818cf8" strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="3 3" />
      {[[60,50],[340,45],[200,170],[120,175]].map(([x,y],i) => (
        <circle key={`pr${i}`} cx={x} cy={y} r={1.2} fill="#818cf8" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.2+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Pawn structure: chains, islands marked */
function PawnStructureArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ps-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#141610" /><stop offset="1" stopColor="#0e100c" />
        </linearGradient>
        <radialGradient id="ps-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a3e635" stopOpacity="0.14" /><stop offset="1" stopColor="#a3e635" stopOpacity="0" />
        </radialGradient>
        <filter id="ps-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#ps-bg)" />
      <rect width="400" height="200" fill="url(#ps-glow)" />
      {/* pawn chain ascending */}
      {[[140,130],[175,110],[210,90],[245,70]].map(([x,y],i) => (
        <g key={i} transform={`translate(${x},${y})`} opacity={0.65+i*0.12}>
          <circle cx="0" cy="-9" r="5.5" fill="#bef264" />
          <path d="M-6.5,7 C-6.5,-1 -3.5,-4 0,-4 C3.5,-4 6.5,-1 6.5,7 Z" fill="#bef264" />
          <rect x="-8" y="7" width="16" height="3.5" rx="1.5" fill="#bef264" />
        </g>
      ))}
      {/* chain connection */}
      <path d="M140,124 L175,104 L210,84 L245,64" stroke="#a3e635" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 3" fill="none" />
      {/* isolated pawn marked weak */}
      <g transform="translate(295,135)">
        <circle cx="0" cy="-9" r="5.5" fill="#e2e8f0" />
        <path d="M-6.5,7 C-6.5,-1 -3.5,-4 0,-4 C3.5,-4 6.5,-1 6.5,7 Z" fill="#e2e8f0" />
        <rect x="-8" y="7" width="16" height="3.5" rx="1.5" fill="#e2e8f0" />
        <circle cx="0" cy="0" r="16" fill="none" stroke="#f87171" strokeWidth="1.5" strokeOpacity="0.7" strokeDasharray="3 3" filter="url(#ps-f)" />
      </g>
      <text x="295" y="170" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="700" fillOpacity="0.7">ISOLATED</text>
      <text x="185" y="160" textAnchor="middle" fill="#a3e635" fontSize="8" fontWeight="700" fillOpacity="0.6">CHAIN</text>
      {[[65,48],[335,42],[110,180]].map(([x,y],i) => (
        <circle key={`ps${i}`} cx={x} cy={y} r={1.2} fill="#a3e635" fillOpacity={0.22+i*0.05}>
          <animate attributeName="opacity" values="0.26;0.07;0.26" dur={`${2.4+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Skill levels: ascending stair with pieces */
function SkillLevelsArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sl-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10121c" /><stop offset="1" stopColor="#0b0d15" />
        </linearGradient>
        <radialGradient id="sl-glow" cx="200" cy="100" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.16" /><stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id="sl-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#sl-bg)" />
      <rect width="400" height="200" fill="url(#sl-glow)" />
      {/* stairs */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x={95+i*55} y={150-i*28} width="55" height={20+i*28} fill="#1e293b" fillOpacity={0.4+i*0.15} stroke="#334155" strokeWidth="0.5" />
          <text x={122+i*55} y="168" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="700">{["800","1400","2000","2600"][i]}</text>
        </g>
      ))}
      {/* piece glyphs on steps: pawn knight bishop queen */}
      {["♙","♞","♝","♛"].map((p,i) => (
        <text key={i} x={122+i*55} y={138-i*28} textAnchor="middle" fontSize="22"
          fill={["#94a3b8","#7dd3fc","#c4b5fd","#fbbf24"][i]}
          filter={i===3 ? "url(#sl-f)" : undefined}>{p}</text>
      ))}
      {[[60,45],[340,40],[200,30]].map(([x,y],i) => (
        <circle key={`sl${i}`} cx={x} cy={y} r={1.2} fill="#fbbf24" fillOpacity={0.22+i*0.05}>
          <animate attributeName="opacity" values="0.28;0.07;0.28" dur={`${2.1+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Thinking process: branching candidate moves with checkmark path */
function ThinkingProcessArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tp-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0f141c" /><stop offset="1" stopColor="#0b0f14" />
        </linearGradient>
        <radialGradient id="tp-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2dd4bf" stopOpacity="0.18" /><stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
        <filter id="tp-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#tp-bg)" />
      <rect width="400" height="200" fill="url(#tp-glow)" />
      {/* decision tree */}
      <circle cx="110" cy="100" r="6" fill="#2dd4bf" filter="url(#tp-f)" />
      {[[170,65],[170,100],[170,135]].map(([x,y],i) => (
        <g key={i}>
          <line x1="116" y1="100" x2={x-6} y2={y} stroke={i===1 ? "#2dd4bf" : "#334155"} strokeWidth={i===1 ? 2 : 1.2} strokeOpacity={i===1 ? 0.8 : 0.5} />
          <circle cx={x} cy={y} r="5" fill={i===1 ? "#2dd4bf" : "#1e293b"} stroke={i===1 ? "#5eead4" : "#334155"} strokeWidth="1" />
        </g>
      ))}
      {/* second level on chosen branch */}
      {[[240,85],[240,115]].map(([x,y],i) => (
        <g key={`b${i}`}>
          <line x1="175" y1="100" x2={x-5} y2={y} stroke="#2dd4bf" strokeWidth="1.5" strokeOpacity="0.6" />
          <circle cx={x} cy={y} r="4.5" fill="#134e4a" stroke="#2dd4bf" strokeWidth="1" />
        </g>
      ))}
      <path d="M248,85 L300,85" stroke="#2dd4bf" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="4 3" />
      {/* checkmark */}
      <path d="M305,82 l5,6 l10,-11" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" filter="url(#tp-f)" />
      <text x="110" y="126" textAnchor="middle" fill="#475569" fontSize="8">POSITION</text>
      <text x="170" y="156" textAnchor="middle" fill="#475569" fontSize="8">CANDIDATES</text>
      <text x="288" y="70" fill="#5eead4" fontSize="8" fontWeight="700" fillOpacity="0.7">EVALUATE</text>
      {[[65,50],[340,45],[200,175]].map(([x,y],i) => (
        <circle key={`tp${i}`} cx={x} cy={y} r={1.2} fill="#2dd4bf" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.3+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* How long to get good: hourglass + rising curve */
function HowLongArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hl-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#131019" /><stop offset="1" stopColor="#0d0a12" />
        </linearGradient>
        <radialGradient id="hl-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e879f9" stopOpacity="0.16" /><stop offset="1" stopColor="#e879f9" stopOpacity="0" />
        </radialGradient>
        <filter id="hl-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#hl-bg)" />
      <rect width="400" height="200" fill="url(#hl-glow)" />
      {/* hourglass */}
      <g stroke="#e879f9" strokeWidth="2" strokeOpacity="0.7" fill="none" filter="url(#hl-f)">
        <path d="M130,60 L170,60 L150,100 Z" />
        <path d="M130,140 L170,140 L150,100 Z" />
      </g>
      {/* sand */}
      <path d="M138,68 L162,68 L150,92 Z" fill="#e879f9" fillOpacity="0.5" />
      <path d="M140,132 L160,132 L150,108 Z" fill="#e879f9" fillOpacity="0.7" />
      <line x1="150" y1="95" x2="150" y2="105" stroke="#f0abfc" strokeWidth="1.5">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
      </line>
      {/* rising skill curve */}
      <path d="M210,140 C250,138 270,110 300,80 C312,67 322,60 330,58" fill="none" stroke="#4ade80" strokeWidth="2" strokeOpacity="0.8" />
      <path d="M324,56 L332,57 L328,64" fill="none" stroke="#4ade80" strokeWidth="2" strokeOpacity="0.8" />
      <text x="255" y="158" fill="#475569" fontSize="8">HOURS IN →</text>
      <text x="236" y="72" fill="#4ade80" fontSize="8" fontWeight="700" fillOpacity="0.7" transform="rotate(-24 236 72)">RATING</text>
      {[[65,50],[335,45],[200,35],[115,175]].map(([x,y],i) => (
        <circle key={`hl${i}`} cx={x} cy={y} r={1.2} fill="#e879f9" fillOpacity={0.22+i*0.05}>
          <animate attributeName="opacity" values="0.26;0.07;0.26" dur={`${2.2+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Analyze games guide: checklist over board corner */
function AnalyzeGuideArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ag-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0d1218" /><stop offset="1" stopColor="#090d12" />
        </linearGradient>
        <radialGradient id="ag-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.16" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <filter id="ag-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#ag-bg)" />
      <rect width="400" height="200" fill="url(#ag-glow)" />
      {/* checklist card */}
      <rect x="130" y="52" width="140" height="100" rx="8" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
      {["Find the turning point","Compare your move vs best","Name the pattern"].map((t,i) => (
        <g key={i}>
          <rect x="142" y={66+i*26} width="12" height="12" rx="3" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.7" />
          <path d={`M144,${72+i*26} l3,3 l5,-6`} fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" />
          <text x="162" y={76+i*26} fill="#94a3b8" fontSize="8.5">{t}</text>
        </g>
      ))}
      {/* magnifier corner */}
      <circle cx="282" cy="140" r="16" fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeOpacity="0.7" filter="url(#ag-f)" />
      <line x1="293" y1="151" x2="306" y2="164" stroke="#67e8f9" strokeWidth="4" strokeOpacity="0.7" strokeLinecap="round" />
      {[[65,48],[340,42],[200,32],[105,178]].map(([x,y],i) => (
        <circle key={`ag${i}`} cx={x} cy={y} r={1.2} fill="#22d3ee" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Tournament prep: trophy + calendar grid */
function TournamentPrepArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tn-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#171310" /><stop offset="1" stopColor="#100d0a" />
        </linearGradient>
        <radialGradient id="tn-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.2" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="tn-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#tn-bg)" />
      <rect width="400" height="200" fill="url(#tn-glow)" />
      {/* trophy */}
      <g transform="translate(140,95)" filter="url(#tn-f)">
        <path d="M-18,-25 h36 v10 c0,14 -8,22 -18,22 c-10,0 -18,-8 -18,-22 Z" fill="#fbbf24" />
        <path d="M-18,-22 h-10 c0,10 6,16 12,17 M18,-22 h10 c0,10 -6,16 -12,17" fill="none" stroke="#fbbf24" strokeWidth="4" />
        <rect x="-4" y="7" width="8" height="12" fill="#f59e0b" />
        <rect x="-14" y="19" width="28" height="6" rx="2" fill="#f59e0b" />
      </g>
      {/* calendar */}
      <rect x="205" y="55" width="110" height="90" rx="8" fill="#0f172a" stroke="#292524" strokeWidth="1" />
      <rect x="205" y="55" width="110" height="18" rx="8" fill="#1c1917" />
      <text x="260" y="68" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="700">ROUND 1</text>
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
        <rect key={i} x={213+(i%4)*25} y={80+Math.floor(i/4)*20} width="20" height="15" rx="3"
          fill={i===5 ? "#f59e0b" : "#1c1917"} fillOpacity={i===5 ? 0.6 : 1} />
      ))}
      <text x="228" y="91" textAnchor="middle" fill="#0c0a09" fontSize="8" fontWeight="800">✓</text>
      {[[65,48],[340,42],[200,32],[105,180]].map(([x,y],i) => (
        <circle key={`tn${i}`} cx={x} cy={y} r={1.2} fill="#f59e0b" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.4+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Read engine analysis: eval bar + depth lines */
function EngineReadArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="er-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0c1216" /><stop offset="1" stopColor="#080d10" />
        </linearGradient>
        <radialGradient id="er-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4ade80" stopOpacity="0.14" /><stop offset="1" stopColor="#4ade80" stopOpacity="0" />
        </radialGradient>
        <filter id="er-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#er-bg)" />
      <rect width="400" height="200" fill="url(#er-glow)" />
      {/* vertical eval bar */}
      <rect x="105" y="50" width="18" height="100" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
      <rect x="105" y="50" width="18" height="62" rx="4" fill="#e2e8f0" fillOpacity="0.85" />
      <text x="114" y="165" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="700" filter="url(#er-f)">+1.4</text>
      {/* engine lines */}
      {[
        { d: "22", line: "Nf3 Nc6 Bb5 a6", ev: "+1.4", w: 128 },
        { d: "22", line: "Bc4 Nf6 d3 Bc5", ev: "+1.1", w: 108 },
        { d: "21", line: "d4 exd4 Nxd4 d5", ev: "+0.9", w: 92 },
      ].map((l,i) => (
        <g key={i}>
          <rect x="140" y={58+i*32} width={l.w} height="24" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
          <text x="148" y={74+i*32} fill="#94a3b8" fontSize="8.5" fontFamily="monospace">{l.line}</text>
          <text x={140+l.w-6} y={74+i*32} textAnchor="end" fill={i===0 ? "#4ade80" : "#64748b"} fontSize="8.5" fontWeight="700">{l.ev}</text>
        </g>
      ))}
      <text x="140" y="52" fill="#475569" fontSize="7.5" fontWeight="700" letterSpacing="1">DEPTH 22 · STOCKFISH 18</text>
      {[[65,48],[340,42],[200,32]].map(([x,y],i) => (
        <circle key={`er${i}`} cx={x} cy={y} r={1.2} fill="#4ade80" fillOpacity={0.22+i*0.05}>
          <animate attributeName="opacity" values="0.26;0.07;0.26" dur={`${2.2+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* King & pawn endgame: lone king + passed pawn to promotion */
function KingPawnEndgameArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="kp-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#101318" /><stop offset="1" stopColor="#0b0e12" />
        </linearGradient>
        <radialGradient id="kp-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#facc15" stopOpacity="0.18" /><stop offset="1" stopColor="#facc15" stopOpacity="0" />
        </radialGradient>
        <filter id="kp-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#kp-bg)" />
      <rect width="400" height="200" fill="url(#kp-glow)" />
      {/* king glyph */}
      <text x="150" y="118" textAnchor="middle" fontSize="40" fill="#e2e8f0" filter="url(#kp-f)">♔</text>
      {/* passed pawn */}
      <g transform="translate(225,120)">
        <circle cx="0" cy="-10" r="6.5" fill="#facc15" />
        <path d="M-7.5,8 C-7.5,-1.5 -4,-4.5 0,-4.5 C4,-4.5 7.5,-1.5 7.5,8 Z" fill="#facc15" />
        <rect x="-9.5" y="8" width="19" height="4" rx="2" fill="#facc15" />
      </g>
      {/* promotion path */}
      <path d="M225,100 C225,80 225,66 225,54" stroke="#facc15" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="4 3" fill="none" />
      <text x="225" y="46" textAnchor="middle" fontSize="20" fill="#fde047" filter="url(#kp-f)">♕</text>
      {/* the square rule box */}
      <rect x="196" y="56" width="58" height="58" fill="none" stroke="#64748b" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
      <text x="270" y="70" fill="#64748b" fontSize="8" fillOpacity="0.7">the square</text>
      {/* black king far away */}
      <text x="305" y="150" textAnchor="middle" fontSize="30" fill="#475569">♚</text>
      {[[65,48],[340,42],[115,180]].map(([x,y],i) => (
        <circle key={`kp${i}`} cx={x} cy={y} r={1.2} fill="#facc15" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.1+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Pawn tension: two pawns head-to-head, springs */
function PawnTensionArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pt-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#141114" /><stop offset="1" stopColor="#0e0b0e" />
        </linearGradient>
        <radialGradient id="pt-glow" cx="200" cy="100" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fb7185" stopOpacity="0.2" /><stop offset="1" stopColor="#fb7185" stopOpacity="0" />
        </radialGradient>
        <filter id="pt-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#pt-bg)" />
      <rect width="400" height="200" fill="url(#pt-glow)" />
      {/* white pawn pushing up */}
      <g transform="translate(200,128)">
        <circle cx="0" cy="-10" r="7" fill="#e2e8f0" />
        <path d="M-8,9 C-8,-1.5 -4.5,-5 0,-5 C4.5,-5 8,-1.5 8,9 Z" fill="#e2e8f0" />
        <rect x="-10" y="9" width="20" height="4.5" rx="2" fill="#e2e8f0" />
      </g>
      {/* black pawn pushing down */}
      <g transform="translate(200,74) scale(1,-1)">
        <circle cx="0" cy="-10" r="7" fill="#64748b" />
        <path d="M-8,9 C-8,-1.5 -4.5,-5 0,-5 C4.5,-5 8,-1.5 8,9 Z" fill="#64748b" />
        <rect x="-10" y="9" width="20" height="4.5" rx="2" fill="#64748b" />
      </g>
      {/* tension springs between */}
      <path d="M188,92 l6,4 l-6,4 l6,4 l-6,4 M212,92 l-6,4 l6,4 l-6,4 l6,4" fill="none" stroke="#fb7185" strokeWidth="1.8" strokeOpacity="0.8" filter="url(#pt-f)" />
      {/* side options */}
      <text x="150" y="105" fill="#4ade80" fontSize="9" fontWeight="700" fillOpacity="0.7">PUSH?</text>
      <text x="238" y="105" fill="#f87171" fontSize="9" fontWeight="700" fillOpacity="0.7">TAKE?</text>
      {[[65,48],[340,42],[200,175],[110,172]].map(([x,y],i) => (
        <circle key={`pt${i}`} cx={x} cy={y} r={1.2} fill="#fb7185" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.3+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Rook endgames: rook cutting off the king (bridge) */
function RookEndgameArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rk-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0f1319" /><stop offset="1" stopColor="#0a0e13" />
        </linearGradient>
        <radialGradient id="rk-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#60a5fa" stopOpacity="0.18" /><stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
        <filter id="rk-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#rk-bg)" />
      <rect width="400" height="200" fill="url(#rk-glow)" />
      {/* mini board */}
      {[0,1,2,3].map(r => [0,1,2,3].map(c => (
        <rect key={`${r}${c}`} x={150+c*26} y={48+r*26} width="26" height="26"
          fill={(r+c)%2 ? "#1e293b" : "#334155"} fillOpacity="0.6" />
      )))}
      {/* rook on the 4th rank */}
      <text x="163" y="70" textAnchor="middle" fontSize="19" fill="#93c5fd" filter="url(#rk-f)">♖</text>
      {/* cut-off line across the rank */}
      <line x1="150" y1="87" x2="254" y2="87" stroke="#60a5fa" strokeWidth="2" strokeOpacity="0.7" filter="url(#rk-f)" />
      {/* black king above the cut */}
      <text x="241" y="68" textAnchor="middle" fontSize="17" fill="#64748b">♚</text>
      {/* passed pawn below */}
      <text x="189" y="148" textAnchor="middle" fontSize="15" fill="#e2e8f0">♙</text>
      <text x="200" y="180" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="700" letterSpacing="2" fillOpacity="0.7">CUT OFF THE KING</text>
      {[[65,48],[340,42],[110,180],[300,178]].map(([x,y],i) => (
        <circle key={`rk${i}`} cx={x} cy={y} r={1.2} fill="#60a5fa" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Skill gap: two players, widening gap chart */
function SkillGapArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sg-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#12101a" /><stop offset="1" stopColor="#0d0b13" />
        </linearGradient>
        <radialGradient id="sg-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c084fc" stopOpacity="0.18" /><stop offset="1" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
        <filter id="sg-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#sg-bg)" />
      <rect width="400" height="200" fill="url(#sg-glow)" />
      {/* two diverging lines */}
      <path d="M90,140 C150,132 230,110 310,60" fill="none" stroke="#c084fc" strokeWidth="2.5" filter="url(#sg-f)" />
      <path d="M90,140 C150,138 230,132 310,124" fill="none" stroke="#475569" strokeWidth="2" strokeOpacity="0.7" />
      {/* gap wedge */}
      <path d="M310,60 L310,124" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.7" />
      <text x="318" y="95" fill="#fb7185" fontSize="9" fontWeight="700" fillOpacity="0.8">THE GAP</text>
      {/* markers */}
      <circle cx="90" cy="140" r="4" fill="#94a3b8" />
      <circle cx="310" cy="60" r="4.5" fill="#c084fc" filter="url(#sg-f)" />
      <circle cx="310" cy="124" r="4" fill="#475569" />
      <text x="90" y="162" textAnchor="middle" fill="#64748b" fontSize="8">SAME GAMES PLAYED</text>
      {[[60,48],[200,32],[110,180]].map(([x,y],i) => (
        <circle key={`sg${i}`} cx={x} cy={y} r={1.2} fill="#c084fc" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.2+i*0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* Stop repeating mistakes: circular arrows with a wall */
function StopRepeatingArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sr-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#151016" /><stop offset="1" stopColor="#0f0b10" />
        </linearGradient>
        <radialGradient id="sr-glow" cx="200" cy="100" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fb923c" stopOpacity="0.18" /><stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
        <filter id="sr-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="200" fill="url(#sr-bg)" />
      <rect width="400" height="200" fill="url(#sr-glow)" />
      {/* repeat cycle */}
      <path d="M165,75 A42,42 0 1 1 158,118" fill="none" stroke="#64748b" strokeWidth="2.5" strokeOpacity="0.55" />
      <path d="M152,112 L159,120 L166,112" fill="none" stroke="#64748b" strokeWidth="2.5" strokeOpacity="0.55" />
      <text x="200" y="105" textAnchor="middle" fill="#94a3b8" fontSize="9" fillOpacity="0.7">same blunder</text>
      {/* wall / shield blocking the cycle */}
      <g filter="url(#sr-f)">
        <rect x="238" y="58" width="10" height="86" rx="3" fill="#fb923c" fillOpacity="0.85" />
      </g>
      {/* scan beam hitting the wall */}
      <path d="M205,100 L236,100" stroke="#fbbf24" strokeWidth="2" strokeDasharray="5 3" strokeOpacity="0.8">
        <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="1.6s" repeatCount="indefinite" />
      </path>
      {/* escape path after wall */}
      <path d="M252,100 C275,100 290,86 300,70" fill="none" stroke="#4ade80" strokeWidth="2" strokeOpacity="0.8" />
      <path d="M294,70 L302,66 L300,75" fill="none" stroke="#4ade80" strokeWidth="2" strokeOpacity="0.8" />
      <text x="292" y="58" fill="#4ade80" fontSize="9" fontWeight="700" fillOpacity="0.8">SCANNED</text>
      {[[65,48],[340,160],[110,180]].map(([x,y],i) => (
        <circle key={`sr${i}`} cx={x} cy={y} r={1.2} fill="#fb923c" fillOpacity={0.25+i*0.05}>
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.4+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}
