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
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.15" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="c-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="220" fill="url(#c-bg)" />
      <rect width="400" height="220" fill="url(#c-glow)" />
      {/* Eval bar on left */}
      <rect x="40" y="30" width="18" height="160" rx="9" fill="url(#c-eval)" fillOpacity="0.75" />
      <rect x="40" y="30" width="18" height="160" rx="9" fill="none" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* Slider mark on eval bar */}
      <rect x="36" y="105" width="26" height="4" rx="2" fill="white" fillOpacity="0.8" />
      {/* Tick marks on eval bar */}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <line key={`t${i}`} x1="60" y1={30+i*20} x2="66" y2={30+i*20} stroke="#94a3b8" strokeWidth="0.5" strokeOpacity="0.5" />
      ))}
      {/* Concentric measurement circles around pawn */}
      <circle cx="210" cy="110" r="70" fill="none" stroke="#475569" strokeWidth="0.8" strokeDasharray="3 4" strokeOpacity="0.35" />
      <circle cx="210" cy="110" r="50" fill="none" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 4" strokeOpacity="0.4" />
      <circle cx="210" cy="110" r="30" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.45" />
      {/* Cross-hair lines */}
      <line x1="130" y1="110" x2="290" y2="110" stroke="#475569" strokeWidth="0.5" strokeOpacity="0.35" />
      <line x1="210" y1="30" x2="210" y2="190" stroke="#475569" strokeWidth="0.5" strokeOpacity="0.35" />
      {/* Pawn silhouette  precision target */}
      <circle cx="210" cy="88" r="11" fill="#f59e0b" fillOpacity="0.7" />
      <path d="M201,98 L194,132 Q210,139 226,132 L219,98 Z" fill="#f59e0b" fillOpacity="0.6" />
      <ellipse cx="210" cy="134" rx="20" ry="7" fill="#f59e0b" fillOpacity="0.55" />
      {/* Glowing outline on the pawn */}
      <circle cx="210" cy="88" r="11" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.6" filter="url(#c-f)" />
      {/* Floating measurement text */}
      <text x="310" y="70" textAnchor="middle" fill="#fbbf24" fillOpacity="0.25" fontSize="28" fontWeight="700">{'0.3'}</text>
      <text x="320" y="170" textAnchor="middle" fill="#ef4444" fillOpacity="0.2" fontSize="22" fontWeight="700">{'-1.2'}</text>
      <text x="105" y="60" textAnchor="middle" fill="#22c55e" fillOpacity="0.2" fontSize="22" fontWeight="700">{'+0.5'}</text>
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
          <stop offset="0" stopColor="#06b6d4" stopOpacity="0.15" /><stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <filter id="t-f"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="400" height="190" fill="url(#t-bg)" />
      <rect width="400" height="190" fill="url(#t-glow)" />
      {/* Hourglass frame */}
      <rect x="158" y="18" width="84" height="6" rx="3" fill="#94a3b8" fillOpacity="0.6" />
      <rect x="158" y="166" width="84" height="6" rx="3" fill="#94a3b8" fillOpacity="0.6" />
      {/* Hourglass glass shape */}
      <path d="M165,24 L165,68 Q200,100 200,95 Q200,100 235,68 L235,24 Z" fill="none" stroke="#67e8f9" strokeWidth="2" strokeOpacity="0.55" />
      <path d="M165,166 L165,122 Q200,90 200,95 Q200,90 235,122 L235,166 Z" fill="none" stroke="#67e8f9" strokeWidth="2" strokeOpacity="0.55" />
      {/* Sand in top chamber */}
      <path d="M168,55 Q185,62 200,58 Q215,62 232,55 L216,80 Q200,88 184,80 Z" fill="#f59e0b" fillOpacity="0.35" />
      {/* Sand stream */}
      <line x1="200" y1="90" x2="200" y2="115" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.55">
        <animate attributeName="strokeDashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
      </line>
      {/* Sand pile at bottom */}
      <path d="M182,158 Q192,148 200,145 Q208,148 218,158" fill="#f59e0b" fillOpacity="0.3" />
      <path d="M172,162 Q186,152 200,148 Q214,152 228,162" fill="#f59e0b" fillOpacity="0.2" />
      {/* Knight piece inside top chamber */}
      <g transform="translate(200,45) scale(0.7)">
        <path d="M-5,6 L-7,-12 Q-8,-22 -2,-26 L0,-28 Q3,-25 5,-22 L7,-16 Q9,-12 7,-8 L7,0 Q4,3 -3,3 Z" fill="#67e8f9" fillOpacity="0.6" />
        <circle cx="-1" cy="-20" r="1.5" fill="#0c1220" fillOpacity="0.5" />
        <ellipse cx="0" cy="6" rx="8" ry="3" fill="#67e8f9" fillOpacity="0.5" />
      </g>
      {/* Clock tick marks around hourglass */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = 200 + Math.cos(rad) * 115;
        const y = 95 + Math.sin(rad) * 85;
        return <circle key={`ck${i}`} cx={x} cy={y} r="2" fill="#64748b" fillOpacity="0.3" />;
      })}
      {/* Time pressure text watermark */}
      <text x="65" y="100" textAnchor="middle" fill="white" fillOpacity="0.05" fontSize="32" fontWeight="700">{'0:30'}</text>
      <text x="335" y="100" textAnchor="middle" fill="white" fillOpacity="0.05" fontSize="32" fontWeight="700">{'5:00'}</text>
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
/*  Default  atmospheric chess silhouette                              */
/* ================================================================== */
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
