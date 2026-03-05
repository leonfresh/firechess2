"use client";

/**
 * Dungeon Tactics — Inline SVG illustrations for bosses, scenes, and story moments.
 * All art is pure SVG with CSS animations, no external images needed.
 */

/* ================================================================== */
/*  Boss Portraits                                                      */
/* ================================================================== */

/** Act 1 Boss: The Stone Rook — a towering chess rook carved from living stone */
export function StoneRookPortrait({ size = 160 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="rook-stone" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="50%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <linearGradient id="rook-glow" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
        <filter id="rook-shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.5" />
        </filter>
        <filter id="glow-green">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="80" cy="80" r="75" fill="#1f2937" stroke="#374151" strokeWidth="2" />
      <circle cx="80" cy="80" r="70" fill="none" stroke="#22c55e" strokeWidth="0.5" opacity="0.3" />

      {/* Rook body */}
      <g filter="url(#rook-shadow)">
        {/* Base */}
        <rect x="48" y="120" width="64" height="12" rx="3" fill="url(#rook-stone)" />
        {/* Lower body */}
        <path d="M52 120 L56 70 L104 70 L108 120 Z" fill="url(#rook-stone)" />
        {/* Upper neck */}
        <rect x="54" y="60" width="52" height="14" rx="2" fill="#4b5563" />
        {/* Battlements (crenellations) */}
        <rect x="50" y="40" width="12" height="22" rx="1" fill="#6b7280" />
        <rect x="66" y="40" width="12" height="22" rx="1" fill="#6b7280" />
        <rect x="82" y="40" width="12" height="22" rx="1" fill="#6b7280" />
        <rect x="98" y="40" width="12" height="22" rx="1" fill="#6b7280" />
        {/* Top connecting bar */}
        <rect x="50" y="55" width="60" height="7" rx="1" fill="#4b5563" />
      </g>

      {/* Glowing runes etched into body */}
      <g filter="url(#glow-green)" opacity="0.8">
        <path d="M68 80 L75 75 L82 80 L75 85 Z" fill="#22c55e" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M85 90 L92 85 L99 90 L92 95 Z" fill="#22c55e" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.5s" repeatCount="indefinite" />
        </path>
        <line x1="65" y1="100" x2="95" y2="100" stroke="#22c55e" strokeWidth="1" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
        </line>
        <line x1="68" y1="108" x2="92" y2="108" stroke="#22c55e" strokeWidth="0.8" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2.7s" repeatCount="indefinite" />
        </line>
      </g>

      {/* Eyes — glowing green in the darkness between battlements */}
      <g filter="url(#glow-green)">
        <circle cx="72" cy="48" r="3" fill="#22c55e">
          <animate attributeName="r" values="3;3.5;3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="88" cy="48" r="3" fill="#22c55e">
          <animate attributeName="r" values="3;3.5;3" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Stone texture cracks */}
      <g stroke="#374151" strokeWidth="0.5" fill="none" opacity="0.6">
        <path d="M70 85 L73 95 L68 105" />
        <path d="M95 78 L92 88 L96 98" />
        <path d="M78 110 L83 115 L80 120" />
      </g>
    </svg>
  );
}

/** Act 2 Boss: The Pale Bishop — a faceless figure in flowing white robes */
export function PaleBishopPortrait({ size = 160 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="bishop-robe" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="60%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="bishop-inner" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1" />
        </linearGradient>
        <filter id="bishop-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="bishop-shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="80" cy="80" r="75" fill="#1e1b4b" stroke="#312e81" strokeWidth="2" />
      <circle cx="80" cy="80" r="70" fill="none" stroke="#a78bfa" strokeWidth="0.5" opacity="0.2" />

      {/* Floating body / robes */}
      <g filter="url(#bishop-shadow)">
        {/* Main robe body — bishop mitre shape */}
        <path d="M80 22 L60 55 L50 130 L80 140 L110 130 L100 55 Z" fill="url(#bishop-robe)" opacity="0.9" />
        {/* Inner robe fold */}
        <path d="M80 30 L68 58 L60 125 L80 132 L100 125 L92 58 Z" fill="url(#bishop-inner)" />
        {/* Robe draping lines */}
        <path d="M68 60 L62 128" stroke="#94a3b8" strokeWidth="0.5" fill="none" opacity="0.6" />
        <path d="M92 60 L98 128" stroke="#94a3b8" strokeWidth="0.5" fill="none" opacity="0.6" />
        <path d="M80 35 L80 135" stroke="#94a3b8" strokeWidth="0.3" fill="none" opacity="0.4" />
      </g>

      {/* Bishop mitre top — the slit */}
      <path d="M75 22 L80 18 L85 22" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.6" />

      {/* Blank face — the absence is the horror */}
      <ellipse cx="80" cy="50" rx="14" ry="16" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
      {/* Subtle shadow suggesting eye sockets but no eyes */}
      <ellipse cx="74" cy="48" rx="4" ry="3" fill="#cbd5e1" opacity="0.5" />
      <ellipse cx="86" cy="48" rx="4" ry="3" fill="#cbd5e1" opacity="0.5" />

      {/* Floating game notation pages swirling around */}
      <g opacity="0.6">
        <rect x="35" y="70" width="12" height="16" rx="1" fill="#e2e8f0" opacity="0.4" transform="rotate(-15 41 78)">
          <animateTransform attributeName="transform" type="rotate" values="-15 41 78;-10 41 78;-15 41 78" dur="4s" repeatCount="indefinite" />
        </rect>
        <rect x="112" y="60" width="11" height="14" rx="1" fill="#e2e8f0" opacity="0.35" transform="rotate(12 118 67)">
          <animateTransform attributeName="transform" type="rotate" values="12 118 67;18 118 67;12 118 67" dur="5s" repeatCount="indefinite" />
        </rect>
        <rect x="42" y="100" width="10" height="13" rx="1" fill="#e2e8f0" opacity="0.3" transform="rotate(-8 47 107)">
          <animateTransform attributeName="transform" type="rotate" values="-8 47 107;-3 47 107;-8 47 107" dur="3.5s" repeatCount="indefinite" />
        </rect>
      </g>

      {/* Purple aura */}
      <g filter="url(#bishop-glow)">
        <ellipse cx="80" cy="80" rx="35" ry="55" fill="none" stroke="#a78bfa" strokeWidth="0.8" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.15;0.3" dur="3s" repeatCount="indefinite" />
        </ellipse>
      </g>

      {/* Diagonal line — bishop movement */}
      <line x1="30" y1="145" x2="130" y2="15" stroke="#a78bfa" strokeWidth="0.5" opacity="0.15" strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;8" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="30" y1="15" x2="130" y2="145" stroke="#a78bfa" strokeWidth="0.5" opacity="0.15" strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;-8" dur="2s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/** Act 3 Boss: The Dark Engine — a crystalline sentient chess machine */
export function DarkEnginePortrait({ size = 160 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="engine-crystal" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
        <linearGradient id="engine-shell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <filter id="engine-glow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="engine-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#dc2626" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Background */}
      <circle cx="80" cy="80" r="75" fill="#0c0a09" stroke="#292524" strokeWidth="2" />

      {/* Outer ring / housing — mechanical */}
      <circle cx="80" cy="80" r="55" fill="none" stroke="#3f3f46" strokeWidth="3" />
      <circle cx="80" cy="80" r="52" fill="none" stroke="#27272a" strokeWidth="1" />

      {/* Gear teeth around the ring */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 360) / 16;
        const rad = (angle * Math.PI) / 180;
        const x1 = 80 + Math.cos(rad) * 52;
        const y1 = 80 + Math.sin(rad) * 52;
        const x2 = 80 + Math.cos(rad) * 60;
        const y2 = 80 + Math.sin(rad) * 60;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3f3f46" strokeWidth="3" strokeLinecap="round" />
        );
      })}

      {/* Rotating inner ring */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0 80 80;360 80 80" dur="20s" repeatCount="indefinite" />
        <circle cx="80" cy="80" r="40" fill="none" stroke="#dc2626" strokeWidth="0.5" opacity="0.4" strokeDasharray="3 6" />
      </g>

      {/* Central crystal — the "brain" */}
      <g filter="url(#engine-glow)">
        <polygon points="80,35 100,65 95,105 80,115 65,105 60,65" fill="url(#engine-crystal)" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.6;0.9" dur="2s" repeatCount="indefinite" />
        </polygon>
        {/* Crystal facets */}
        <polygon points="80,35 100,65 80,55" fill="rgba(255,255,255,0.1)" />
        <polygon points="80,35 60,65 80,55" fill="rgba(255,255,255,0.05)" />
        <polygon points="95,105 80,115 80,95" fill="rgba(0,0,0,0.2)" />
      </g>

      {/* Pulsing red eye in the crystal */}
      <g filter="url(#engine-glow)">
        <circle cx="80" cy="72" r="6" fill="#ef4444">
          <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="72" r="3" fill="#fca5a5" />
      </g>

      {/* Energy lines radiating from crystal */}
      <g opacity="0.5">
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 80 + Math.cos(rad) * 20;
          const y1 = 72 + Math.sin(rad) * 20;
          const x2 = 80 + Math.cos(rad) * 45;
          const y2 = 72 + Math.sin(rad) * 45;
          return (
            <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#dc2626" strokeWidth="0.8" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur={`${1.5 + (angle % 3) * 0.5}s`} repeatCount="indefinite" />
            </line>
          );
        })}
      </g>

      {/* Small orbiting dots — calculations */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0 80 80;-360 80 80" dur="8s" repeatCount="indefinite" />
        <circle cx="80" cy="35" r="2" fill="#fca5a5" opacity="0.6" />
        <circle cx="115" cy="80" r="1.5" fill="#fca5a5" opacity="0.4" />
        <circle cx="80" cy="125" r="2" fill="#fca5a5" opacity="0.5" />
      </g>

      {/* Binary / calculation text hints */}
      <text x="38" y="138" fill="#dc2626" fontSize="5" opacity="0.2" fontFamily="monospace">0110 1001</text>
      <text x="88" y="148" fill="#dc2626" fontSize="5" opacity="0.15" fontFamily="monospace">EVAL: -M3</text>
    </svg>
  );
}

/* ================================================================== */
/*  Act Scene Illustrations                                             */
/* ================================================================== */

/** Act 1: Cavern entrance with stalactites and torchlight */
export function CavernScene({ width = 320, height = 80 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 320 80" className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="cavern-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c1917" />
          <stop offset="100%" stopColor="#0c0a09" />
        </linearGradient>
        <radialGradient id="torch-glow" cx="0.5" cy="0.8" r="0.5">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="80" fill="url(#cavern-bg)" rx="8" />

      {/* Stalactites */}
      <polygon points="30,0 35,22 25,22" fill="#292524" />
      <polygon points="60,0 67,30 53,30" fill="#1c1917" />
      <polygon points="120,0 126,18 114,18" fill="#292524" />
      <polygon points="200,0 205,25 195,25" fill="#1c1917" />
      <polygon points="260,0 266,20 254,20" fill="#292524" />
      <polygon points="290,0 295,15 285,15" fill="#1c1917" />

      {/* Ground / stalagmites */}
      <polygon points="0,80 20,60 40,80" fill="#292524" />
      <polygon points="80,80 95,65 110,80" fill="#1c1917" />
      <polygon points="240,80 255,62 270,80" fill="#292524" />
      <polygon points="300,80 310,70 320,80" fill="#1c1917" />

      {/* Torches */}
      <rect x="148" y="40" width="4" height="20" fill="#78350f" rx="1" />
      <circle cx="150" cy="38" r="6" fill="url(#torch-glow)">
        <animate attributeName="r" values="6;8;6" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx="150" cy="38" r="3" fill="#f97316" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.4;0.7" dur="0.8s" repeatCount="indefinite" />
      </circle>

      {/* Chess piece silhouettes in the shadows */}
      <g opacity="0.15" fill="#78716c">
        {/* Pawn */}
        <circle cx="75" cy="60" r="4" />
        <rect x="72" y="64" width="6" height="8" rx="1" />
        {/* Knight */}
        <path d="M230 55 L232 48 L238 45 L240 50 L240 65 L228 65 Z" />
      </g>
    </svg>
  );
}

/** Act 2: Library with towering bookshelves */
export function LibraryScene({ width = 320, height = 80 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 320 80" className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lib-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f0e24" />
        </linearGradient>
      </defs>
      <rect width="320" height="80" fill="url(#lib-bg)" rx="8" />

      {/* Bookshelves — repeating pattern */}
      {[20, 70, 130, 190, 250].map((x, i) => (
        <g key={i} opacity={0.4 + (i % 2) * 0.15}>
          {/* Shelf structure */}
          <rect x={x} y="10" width="40" height="65" fill="none" stroke="#312e81" strokeWidth="0.5" rx="1" />
          {/* Books — colorful spines */}
          {[14, 22, 30, 38, 46, 54, 62].map((by, j) => (
            <rect key={j} x={x + 3 + (j % 3) * 2} y={by} width={5 + (j % 4)} height={6} rx="0.5"
              fill={["#7c3aed", "#6366f1", "#8b5cf6", "#a78bfa", "#6d28d9", "#4f46e5", "#818cf8"][j]}
              opacity={0.5 + (j % 3) * 0.15} />
          ))}
        </g>
      ))}

      {/* Floating pages */}
      <g>
        <rect x="160" y="20" width="8" height="10" rx="1" fill="#e2e8f0" opacity="0.2" transform="rotate(-20 164 25)">
          <animateTransform attributeName="transform" type="rotate" values="-20 164 25;-10 164 25;-20 164 25" dur="5s" repeatCount="indefinite" />
        </rect>
        <rect x="180" y="35" width="6" height="8" rx="1" fill="#e2e8f0" opacity="0.15" transform="rotate(15 183 39)">
          <animateTransform attributeName="transform" type="rotate" values="15 183 39;25 183 39;15 183 39" dur="4s" repeatCount="indefinite" />
        </rect>
      </g>

      {/* Purple light source */}
      <circle cx="160" cy="40" r="30" fill="#7c3aed" opacity="0.04" />
    </svg>
  );
}

/** Act 3: The Eternal Board — chess tiles stretching to horizon */
export function EternalBoardScene({ width = 320, height = 80 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 320 80" className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="board-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0a09" />
          <stop offset="100%" stopColor="#1c1917" />
        </linearGradient>
        <linearGradient id="board-perspective" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="320" height="80" fill="url(#board-bg)" rx="8" />

      {/* Perspective chess board tiles */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 12 }).map((_, col) => {
          const isDark = (row + col) % 2 === 0;
          const perspective = 1 - row * 0.1;
          const tileW = 28 * perspective;
          const tileH = 10 * perspective;
          const x = 160 + (col - 6) * tileW;
          const y = 10 + row * tileH;
          if (x < -10 || x > 330) return null;
          return (
            <rect key={`${row}-${col}`} x={x} y={y} width={tileW - 1} height={tileH - 0.5}
              fill={isDark ? "#27272a" : "#44403c"} opacity={0.3 - row * 0.03} />
          );
        })
      )}

      {/* Vanishing point glow */}
      <circle cx="160" cy="10" r="20" fill="#dc2626" opacity="0.08" />

      {/* Towering chess pieces silhouette */}
      <g opacity="0.2" fill="#57534e">
        {/* King */}
        <rect x="145" y="30" width="8" height="30" rx="1" />
        <circle cx="149" cy="28" r="5" />
        <line x1="149" y1="22" x2="149" y2="18" stroke="#57534e" strokeWidth="2" />
        <line x1="146" y1="20" x2="152" y2="20" stroke="#57534e" strokeWidth="1.5" />
        {/* Queen */}
        <rect x="170" y="35" width="7" height="25" rx="1" />
        <circle cx="173.5" cy="33" r="4" />
        <polygon points="170 30 173.5 22 177 30" />
      </g>

      {/* Red energy lines on the ground */}
      <line x1="0" y1="75" x2="320" y2="75" stroke="#dc2626" strokeWidth="0.5" opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.2;0.1" dur="3s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/* ================================================================== */
/*  Story Moment Illustrations                                          */
/* ================================================================== */

/** Victory — a radiant crown above a chess board, light streaming up */
export function VictoryIllustration({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="vic-gold" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="vic-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Radiant background */}
      <circle cx="70" cy="70" r="68" fill="#1c1917" />

      {/* Light rays */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x1 = 70 + Math.cos(angle) * 20;
        const y1 = 50 + Math.sin(angle) * 20;
        const x2 = 70 + Math.cos(angle) * 65;
        const y2 = 50 + Math.sin(angle) * 65;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth="1" opacity={0.15 + (i % 3) * 0.05}>
            <animate attributeName="opacity" values={`${0.15 + (i % 3) * 0.05};${0.05};${0.15 + (i % 3) * 0.05}`} dur={`${2 + (i % 4) * 0.5}s`} repeatCount="indefinite" />
          </line>
        );
      })}

      {/* Crown */}
      <g filter="url(#vic-glow)">
        <polygon points="40,55 50,30 60,45 70,25 80,45 90,30 100,55" fill="url(#vic-gold)" />
        <rect x="40" y="55" width="60" height="8" rx="2" fill="#d97706" />
        {/* Gems */}
        <circle cx="55" cy="40" r="3" fill="#ef4444" />
        <circle cx="70" cy="32" r="3" fill="#3b82f6" />
        <circle cx="85" cy="40" r="3" fill="#22c55e" />
      </g>

      {/* Chess pieces beneath — now free */}
      <g opacity="0.3">
        <rect x="50" y="75" width="5" height="20" rx="1" fill="#fbbf24" />
        <circle cx="52.5" cy="73" r="4" fill="#fbbf24" />
        <rect x="65" y="80" width="4" height="15" rx="1" fill="#fbbf24" />
        <circle cx="67" cy="78" r="3" fill="#fbbf24" />
        <rect x="80" y="75" width="5" height="20" rx="1" fill="#fbbf24" />
        <circle cx="82.5" cy="73" r="4" fill="#fbbf24" />
      </g>

      {/* Small stars */}
      <g fill="#fbbf24">
        <circle cx="25" cy="30" r="1.5" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" /></circle>
        <circle cx="115" cy="25" r="1" opacity="0.3"><animate attributeName="opacity" values="0.3;0.1;0.3" dur="2.5s" repeatCount="indefinite" /></circle>
        <circle cx="30" cy="90" r="1" opacity="0.35"><animate attributeName="opacity" values="0.35;0.1;0.35" dur="1.8s" repeatCount="indefinite" /></circle>
        <circle cx="110" cy="85" r="1.5" opacity="0.4"><animate attributeName="opacity" values="0.4;0.15;0.4" dur="3s" repeatCount="indefinite" /></circle>
      </g>
    </svg>
  );
}

/** Death — a fallen king piece on cracked ground */
export function DeathIllustration({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="death-bg" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#1c1917" />
          <stop offset="100%" stopColor="#0c0a09" />
        </linearGradient>
        <filter id="death-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <circle cx="70" cy="70" r="68" fill="url(#death-bg)" />

      {/* Cracked ground */}
      <g stroke="#292524" strokeWidth="1" fill="none">
        <line x1="30" y1="95" x2="110" y2="95" />
        <path d="M50 95 L55 105 L48 115" />
        <path d="M70 95 L73 108 L68 120" />
        <path d="M85 95 L82 102 L88 112" />
        <path d="M60 95 L57 100" />
        <path d="M95 95 L98 103" />
      </g>

      {/* Fallen king piece — on its side */}
      <g transform="rotate(-70 70 80)" opacity="0.7">
        {/* Base */}
        <rect x="60" y="85" width="20" height="6" rx="2" fill="#57534e" />
        {/* Body */}
        <rect x="64" y="55" width="12" height="32" rx="2" fill="#44403c" />
        {/* Head */}
        <circle cx="70" cy="52" r="8" fill="#57534e" />
        {/* Cross */}
        <line x1="70" y1="42" x2="70" y2="36" stroke="#44403c" strokeWidth="2.5" />
        <line x1="66" y1="39" x2="74" y2="39" stroke="#44403c" strokeWidth="2" />
      </g>

      {/* Fading red mist */}
      <g filter="url(#death-glow)">
        <circle cx="70" cy="75" r="25" fill="#dc2626" opacity="0.06">
          <animate attributeName="opacity" values="0.06;0.03;0.06" dur="3s" repeatCount="indefinite" />
          <animate attributeName="r" values="25;30;25" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Scattered pieces */}
      <g opacity="0.2" fill="#44403c">
        <circle cx="35" cy="85" r="3" />
        <rect x="32" y="88" width="6" height="4" rx="1" />
        <circle cx="105" cy="90" r="2.5" />
        <rect x="103" y="92.5" width="5" height="3" rx="1" />
      </g>

      {/* Dim smoke wisps */}
      <g opacity="0.15" stroke="#78716c" strokeWidth="0.5" fill="none">
        <path d="M55 70 Q58 60 55 50 Q52 40 55 30">
          <animate attributeName="d" values="M55 70 Q58 60 55 50 Q52 40 55 30;M55 70 Q53 58 56 48 Q59 38 56 28;M55 70 Q58 60 55 50 Q52 40 55 30" dur="4s" repeatCount="indefinite" />
        </path>
        <path d="M85 72 Q82 62 85 52 Q88 42 85 32">
          <animate attributeName="d" values="M85 72 Q82 62 85 52 Q88 42 85 32;M85 72 Q88 60 84 50 Q80 40 84 30;M85 72 Q82 62 85 52 Q88 42 85 32" dur="5s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
}

/** Dungeon Entrance — for the start screen hero */
export function DungeonEntranceIllustration({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="entrance-arch" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#44403c" />
          <stop offset="100%" stopColor="#292524" />
        </linearGradient>
        <radialGradient id="entrance-void" cx="0.5" cy="0.6" r="0.4">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.15" />
          <stop offset="70%" stopColor="#0c0a09" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0c0a09" />
        </radialGradient>
        <filter id="entrance-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <circle cx="60" cy="60" r="58" fill="#0c0a09" stroke="#292524" strokeWidth="1.5" />

      {/* Archway */}
      <path d="M30 100 L30 45 Q30 20 60 15 Q90 20 90 45 L90 100" fill="url(#entrance-arch)" />

      {/* Inner darkness with faint red glow */}
      <path d="M36 100 L36 48 Q36 26 60 22 Q84 26 84 48 L84 100" fill="url(#entrance-void)" />

      {/* Archway brick detail */}
      <g stroke="#1c1917" strokeWidth="0.5" fill="none" opacity="0.4">
        <path d="M35 50 Q35 25 60 20 Q85 25 85 50" />
        <path d="M33 53 Q33 27 60 18 Q87 27 87 53" />
      </g>

      {/* Steps leading down */}
      <rect x="38" y="88" width="44" height="4" fill="#292524" />
      <rect x="40" y="92" width="40" height="4" fill="#1c1917" />
      <rect x="42" y="96" width="36" height="4" fill="#0c0a09" />

      {/* Torches on either side */}
      {[35, 85].map((tx) => (
        <g key={tx}>
          <rect x={tx - 2} y="45" width="4" height="15" fill="#78350f" rx="1" />
          <g filter="url(#entrance-glow)">
            <circle cx={tx} cy="42" r="5" fill="#f97316" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.15;0.3" dur={tx === 35 ? "1.2s" : "1.5s"} repeatCount="indefinite" />
            </circle>
            <circle cx={tx} cy="42" r="2.5" fill="#fbbf24" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.3;0.6" dur={tx === 35 ? "0.8s" : "1s"} repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      ))}

      {/* Chess piece silhouette inside the darkness — barely visible */}
      <g opacity="0.08" fill="#dc2626" filter="url(#entrance-glow)">
        <rect x="54" y="55" width="12" height="25" rx="2" />
        <circle cx="60" cy="52" r="7" />
        <line x1="60" y1="44" x2="60" y2="38" stroke="#dc2626" strokeWidth="2.5" />
        <line x1="56" y1="41" x2="64" y2="41" stroke="#dc2626" strokeWidth="2" />
      </g>
    </svg>
  );
}

/* ================================================================== */
/*  Helper: Get boss portrait by act                                    */
/* ================================================================== */

export function BossPortrait({ actId, size = 160 }: { actId: number; size?: number }) {
  switch (actId) {
    case 1: return <StoneRookPortrait size={size} />;
    case 2: return <PaleBishopPortrait size={size} />;
    case 3: return <DarkEnginePortrait size={size} />;
    default: return <StoneRookPortrait size={size} />;
  }
}

export function ActScene({ actId, width = 320, height = 80 }: { actId: number; width?: number; height?: number }) {
  switch (actId) {
    case 1: return <CavernScene width={width} height={height} />;
    case 2: return <LibraryScene width={width} height={height} />;
    case 3: return <EternalBoardScene width={width} height={height} />;
    default: return <CavernScene width={width} height={height} />;
  }
}

/* ================================================================== */
/*  Battle Scene Vignettes (per-act atmosphere during puzzles)          */
/* ================================================================== */

/** Generic battle scene that adapts to act */
export function BattleSceneVignette({ actId, seed = 0 }: { actId: number; seed?: number }) {
  // Seeded pseudo-random for consistent variation
  const r = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297 + 233280) * 0.5 + 0.5;
    return x;
  };

  const variants = {
    1: { bg1: "#1c1917", bg2: "#0c0a09", accent: "#f97316", glow: "#f97316" },
    2: { bg1: "#1e1b4b", bg2: "#0f0e24", accent: "#a78bfa", glow: "#7c3aed" },
    3: { bg1: "#0c0a09", bg2: "#1c1917", accent: "#dc2626", glow: "#ef4444" },
  };
  const v = variants[actId as keyof typeof variants] ?? variants[1];

  return (
    <svg width="280" height="60" viewBox="0 0 280 60" className="w-full opacity-60" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`bs-bg-${actId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.bg1} />
          <stop offset="100%" stopColor={v.bg2} />
        </linearGradient>
      </defs>
      <rect width="280" height="60" fill={`url(#bs-bg-${actId})`} rx="6" />

      {/* Terrain elements */}
      {actId === 1 && <>
        {/* Stalactites */}
        {[30, 90, 160, 220, 260].map((x, i) => (
          <polygon key={i} points={`${x},0 ${x + 4 + r(i) * 3},${12 + r(i + 10) * 10} ${x - 4},${10 + r(i + 5) * 8}`} fill="#292524" opacity={0.4 + r(i) * 0.3} />
        ))}
        {/* Torch */}
        <circle cx={140} cy={25} r={4} fill={v.accent} opacity={0.3}>
          <animate attributeName="opacity" values="0.3;0.15;0.3" dur="1.2s" repeatCount="indefinite" />
        </circle>
      </>}

      {actId === 2 && <>
        {/* Floating notation fragments */}
        {[40, 100, 180, 240].map((x, i) => (
          <rect key={i} x={x} y={10 + r(i) * 20} width={8 + r(i + 3) * 6} height={10 + r(i + 1) * 5} rx="1"
            fill="#e2e8f0" opacity={0.05 + r(i) * 0.08}
            transform={`rotate(${-10 + r(i + 2) * 20} ${x + 5} ${20 + r(i) * 10})`}>
            <animateTransform attributeName="transform" type="rotate"
              values={`${-10 + r(i + 2) * 20} ${x + 5} ${20 + r(i) * 10};${-5 + r(i + 2) * 20} ${x + 5} ${20 + r(i) * 10};${-10 + r(i + 2) * 20} ${x + 5} ${20 + r(i) * 10}`}
              dur={`${3 + r(i) * 3}s`} repeatCount="indefinite" />
          </rect>
        ))}
      </>}

      {actId === 3 && <>
        {/* Grid lines — circuit board feel */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line key={`h${i}`} x1="0" y1={i * 12} x2="280" y2={i * 12} stroke={v.accent} strokeWidth="0.3" opacity={0.08 + r(i) * 0.05} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="60" stroke={v.accent} strokeWidth="0.3" opacity={0.06 + r(i + 10) * 0.04} />
        ))}
        <circle cx="140" cy="30" r="8" fill={v.accent} opacity={0.05}>
          <animate attributeName="r" values="8;12;8" dur="3s" repeatCount="indefinite" />
        </circle>
      </>}

      {/* Chess piece silhouettes — scattered by seed */}
      {[0, 1].map(i => {
        const px = 50 + r(i + 20) * 180;
        const py = 25 + r(i + 30) * 20;
        const pieces = ["♟", "♞", "♝", "♜"];
        const piece = pieces[Math.floor(r(i + 40) * pieces.length)];
        return (
          <text key={i} x={px} y={py} fontSize="14" fill={v.accent} opacity={0.08} textAnchor="middle" dominantBaseline="central">
            {piece}
          </text>
        );
      })}
    </svg>
  );
}

/* ================================================================== */
/*  Puzzle Mode Icons (for mode badge display)                          */
/* ================================================================== */

/** Sword icon — standard tactic */
export function TacticIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2 L12 12 L10 14 L8 12 Z" fill="currentColor" opacity="0.3" />
      <line x1="7" y1="12" x2="13" y2="12" strokeLinecap="round" />
      <line x1="10" y1="13" x2="10" y2="17" strokeLinecap="round" />
      <circle cx="10" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

/** Bar chart icon — guess the eval */
export function EvalIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="10" width="3" height="7" rx="0.5" fill="currentColor" opacity="0.2" />
      <rect x="8.5" y="5" width="3" height="12" rx="0.5" fill="currentColor" opacity="0.3" />
      <rect x="14" y="8" width="3" height="9" rx="0.5" fill="currentColor" opacity="0.2" />
      <line x1="2" y1="18" x2="18" y2="18" strokeLinecap="round" />
    </svg>
  );
}

/** Magnifying glass + piece — guess the move */
export function GuessMoveIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="5" />
      <line x1="13" y1="13" x2="17" y2="17" strokeLinecap="round" strokeWidth="2" />
      <text x="9" y="11" fontSize="6" fill="currentColor" textAnchor="middle" fontWeight="bold">?</text>
    </svg>
  );
}

/** Star rating icon — guess the elo */
export function EloIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="10,2 12.5,7 18,7.5 14,11.5 15,17 10,14 5,17 6,11.5 2,7.5 7.5,7" fill="currentColor" opacity="0.15" />
      <polygon points="10,2 12.5,7 18,7.5 14,11.5 15,17 10,14 5,17 6,11.5 2,7.5 7.5,7" />
    </svg>
  );
}
