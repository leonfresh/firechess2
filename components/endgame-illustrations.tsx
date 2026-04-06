/**
 * Endgame Illustrations — unique chess-themed SVG artwork per endgame type.
 * Follows the blog-featured-images.tsx style: dark atmospheric gradients,
 * chess piece silhouettes, glow filters. Pure SVG, no external assets.
 */

export function EndgameIllustration({ id }: { id: string }) {
  switch (id) {
    case "king-pawn":
      return <KingPawnArt />;
    case "rook":
      return <RookArt />;
    case "bishop-vs-knight":
      return <BishopKnightArt />;
    case "opposition":
      return <OppositionArt />;
    case "queen":
      return <QueenArt />;
    case "knight":
      return <KnightEndgameArt />;
    default:
      return <DefaultEndgameArt />;
  }
}

/* ================================================================== */
/*  1. King & Pawn — king leading pawn to promotion                    */
/* ================================================================== */
function KingPawnArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="kp-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1a14" />
          <stop offset="1" stopColor="#0c1220" />
        </linearGradient>
        <radialGradient
          id="kp-glow"
          cx="270"
          cy="80"
          r="130"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.2" />
          <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="kp-road"
          x1="180"
          y1="0"
          x2="350"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#22c55e" stopOpacity="0" />
          <stop offset="1" stopColor="#22c55e" stopOpacity="0.4" />
        </linearGradient>
        <filter id="kp-f">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="200" fill="url(#kp-bg)" />
      <rect width="400" height="200" fill="url(#kp-glow)" />

      {/* Board rank lines — horizontal */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((r) => (
        <line
          key={r}
          x1="50"
          y1={30 + r * 22}
          x2="370"
          y2={30 + r * 22}
          stroke="#1e293b"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
      ))}
      {/* File lines */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
        <line
          key={c}
          x1={50 + c * 40}
          y1="30"
          x2={50 + c * 40}
          y2="176"
          stroke="#1e293b"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
      ))}

      {/* Promotion glow on top-right */}
      <rect
        x={290}
        y={30}
        width={80}
        height={22}
        fill="#fbbf24"
        fillOpacity="0.2"
        rx={2}
      />
      <text
        x={330}
        y={46}
        textAnchor="middle"
        fill="#fbbf24"
        fillOpacity="0.7"
        fontSize="11"
        fontWeight="700"
        letterSpacing="1"
      >
        ♕
      </text>

      {/* Key squares highlighted */}
      {[
        [210, 52],
        [250, 52],
        [290, 52],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={40}
          height={22}
          fill="#22c55e"
          fillOpacity="0.18"
          rx={2}
        />
      ))}
      <text
        x={254}
        y={34}
        textAnchor="middle"
        fill="#22c55e"
        fillOpacity="0.55"
        fontSize="7"
        letterSpacing="1"
      >
        KEY SQUARES
      </text>

      {/* Path of the king */}
      <path
        d="M130,152 Q170,120 210,96 Q250,74 285,56"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        strokeOpacity="0.4"
        strokeDasharray="6 5"
      >
        <animate
          attributeName="strokeDashoffset"
          from="22"
          to="0"
          dur="2.5s"
          repeatCount="indefinite"
        />
      </path>

      {/* King */}
      <g>
        <rect
          x={123}
          y={126}
          width={3}
          height={7}
          fill="#22c55e"
          fillOpacity={0.88}
        />
        <rect
          x={119}
          y={129}
          width={11}
          height={3}
          fill="#22c55e"
          fillOpacity={0.88}
        />
        <circle cx={130} cy={139} r={8} fill="#22c55e" fillOpacity={0.82} />
        <path
          d={`M124,146 L119,158 Q130,164 141,158 L136,146 Z`}
          fill="#22c55e"
          fillOpacity={0.78}
        />
        <ellipse
          cx={130}
          cy={160}
          rx={13}
          ry={4}
          fill="#22c55e"
          fillOpacity={0.72}
        />
      </g>

      {/* Pawn below the king */}
      <circle cx={130} cy={173} r={6} fill="#22c55e" fillOpacity={0.7} />
      <path
        d="M124,179 L120,192 Q130,196 140,192 L136,179 Z"
        fill="#22c55e"
        fillOpacity={0.65}
      />
      <ellipse
        cx={130}
        cy={193}
        rx={10}
        ry={3}
        fill="#22c55e"
        fillOpacity={0.6}
      />

      <text
        x={200}
        y={196}
        textAnchor="middle"
        fill="#22c55e"
        fillOpacity="0.4"
        fontSize="9"
        letterSpacing="2"
      >
        KING LEADS — PAWN FOLLOWS
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  2. Rook Endgames — Lucena bridge building                          */
/* ================================================================== */
function RookArt() {
  return (
    <svg viewBox="0 0 400 210" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="re-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#10180a" />
        </linearGradient>
        <radialGradient
          id="re-glow"
          cx="200"
          cy="105"
          r="140"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#60a5fa" stopOpacity="0.2" />
          <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
        <filter id="re-f">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="210" fill="url(#re-bg)" />
      <rect width="400" height="210" fill="url(#re-glow)" />

      {/* File grid — 8 files */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
        <line
          key={c}
          x1={30 + c * 43}
          y1="20"
          x2={30 + c * 43}
          y2="190"
          stroke="#1e293b"
          strokeWidth="0.7"
          strokeOpacity="0.7"
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((r) => (
        <line
          key={r}
          x1="30"
          y1={20 + r * 34}
          x2="374"
          y2={20 + r * 34}
          stroke="#1e293b"
          strokeWidth="0.7"
          strokeOpacity="0.5"
        />
      ))}

      {/* Pawn on 7th rank */}
      <circle cx={245} cy={41} r={8} fill="#60a5fa" fillOpacity={0.82} />
      <path
        d="M237,49 L233,64 Q245,70 257,64 L253,49 Z"
        fill="#60a5fa"
        fillOpacity={0.78}
      />
      <ellipse
        cx={245}
        cy={66}
        rx={14}
        ry={4.5}
        fill="#60a5fa"
        fillOpacity={0.72}
      />
      <text
        x={245}
        y={22}
        textAnchor="middle"
        fill="#60a5fa"
        fillOpacity="0.5"
        fontSize="8"
        letterSpacing="1"
      >
        7TH RANK
      </text>

      {/* White King shielded — building the bridge */}
      <g>
        <rect
          x={244}
          y={82}
          width={3}
          height={7}
          fill="#60a5fa"
          fillOpacity={0.9}
        />
        <rect
          x={240}
          y={85}
          width={11}
          height={3}
          fill="#60a5fa"
          fillOpacity={0.9}
        />
        <circle cx={247} cy={96} r={9} fill="#60a5fa" fillOpacity={0.82} />
        <path
          d={`M241,104 L236,118 Q247,124 258,118 L253,104 Z`}
          fill="#60a5fa"
          fillOpacity={0.78}
        />
        <ellipse
          cx={247}
          cy={120}
          rx={14}
          ry={4.5}
          fill="#60a5fa"
          fillOpacity={0.72}
        />
      </g>

      {/* White rook "bridge" */}
      <rect
        x={189}
        y={134}
        width={6}
        height={5}
        rx={1}
        fill="#60a5fa"
        fillOpacity={0.88}
      />
      <rect
        x={192}
        y={134}
        width={6}
        height={5}
        rx={1}
        fill="#60a5fa"
        fillOpacity={0.88}
      />
      <rect
        x={195}
        y={134}
        width={6}
        height={5}
        rx={1}
        fill="#60a5fa"
        fillOpacity={0.88}
      />
      <rect
        x={186}
        y={138}
        width={22}
        height={18}
        rx={2}
        fill="#60a5fa"
        fillOpacity={0.82}
      />
      <ellipse
        cx={197}
        cy={157}
        rx={14}
        ry={4}
        fill="#60a5fa"
        fillOpacity={0.75}
      />
      {/* Bridge label */}
      <path
        d="M197,150 Q197,130 220,122"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        strokeDasharray="3 3"
      />
      <text
        x={230}
        y={120}
        fill="#60a5fa"
        fillOpacity="0.5"
        fontSize="8"
        letterSpacing="1"
      >
        BRIDGE
      </text>

      {/* Black king trying to get closer */}
      <g opacity="0.6">
        <rect
          x={73}
          y={82}
          width={3}
          height={7}
          fill="#94a3b8"
          fillOpacity={0.7}
        />
        <rect
          x={69}
          y={85}
          width={11}
          height={3}
          fill="#94a3b8"
          fillOpacity={0.7}
        />
        <circle cx={76} cy={96} r={9} fill="#94a3b8" fillOpacity={0.62} />
        <path
          d={`M70,104 L65,118 Q76,124 87,118 L82,104 Z`}
          fill="#94a3b8"
          fillOpacity={0.58}
        />
        <ellipse
          cx={76}
          cy={120}
          rx={14}
          ry={4.5}
          fill="#94a3b8"
          fillOpacity={0.55}
        />
      </g>

      {/* Black rook giving side checks */}
      <g>
        <rect
          x={57}
          y={154}
          width={6}
          height={5}
          rx={1}
          fill="#e2e8f0"
          fillOpacity={0.55}
        />
        <rect
          x={60}
          y={154}
          width={6}
          height={5}
          rx={1}
          fill="#e2e8f0"
          fillOpacity={0.55}
        />
        <rect
          x={63}
          y={154}
          width={6}
          height={5}
          rx={1}
          fill="#e2e8f0"
          fillOpacity={0.55}
        />
        <rect
          x={54}
          y={158}
          width={22}
          height={18}
          rx={2}
          fill="#e2e8f0"
          fillOpacity={0.45}
        />
        <ellipse
          cx={65}
          cy={177}
          rx={14}
          ry={4}
          fill="#e2e8f0"
          fillOpacity={0.4}
        />
      </g>
      {/* Check arrows from black rook */}
      <line
        x1="78"
        y1="165"
        x2="182"
        y2="165"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        strokeDasharray="4 3"
      />

      <text
        x={200}
        y={203}
        textAnchor="middle"
        fill="#60a5fa"
        fillOpacity="0.4"
        fontSize="9"
        letterSpacing="2"
      >
        LUCENA — BUILD THE BRIDGE
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  3. Bishop vs Knight — open diagonal vs octopus square             */
/* ================================================================== */
function BishopKnightArt() {
  return (
    <svg viewBox="0 0 400 210" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="bk-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#120c1a" />
        </linearGradient>
        <radialGradient
          id="bk-l"
          cx="100"
          cy="105"
          r="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="bk-r"
          cx="300"
          cy="105"
          r="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#c084fc" stopOpacity="0.22" />
          <stop offset="1" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
        <filter id="bk-f">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="210" fill="url(#bk-bg)" />
      <rect width="400" height="210" fill="url(#bk-l)" />
      <rect width="400" height="210" fill="url(#bk-r)" />

      {/* Divider */}
      <line
        x1="200"
        y1="10"
        x2="200"
        y2="200"
        stroke="#334155"
        strokeWidth="1"
        strokeOpacity="0.4"
        strokeDasharray="4 4"
      />
      <text
        x={200}
        y={14}
        textAnchor="middle"
        fill="#475569"
        fillOpacity="0.5"
        fontSize="8"
        letterSpacing="1"
      >
        VS
      </text>

      {/* Left — Bishop with diagonal rays */}
      <line
        x1="30"
        y1="210"
        x2="175"
        y2="32"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
      <line
        x1="30"
        y1="210"
        x2="175"
        y2="32"
        stroke="#fbbf24"
        strokeWidth="1"
        strokeOpacity="0.55"
        strokeDasharray="6 5"
      >
        <animate
          attributeName="strokeDashoffset"
          from="22"
          to="0"
          dur="2.8s"
          repeatCount="indefinite"
        />
      </line>
      {/* Bishop piece */}
      <g>
        <circle cx={100} cy={92} r={5} fill="#fbbf24" fillOpacity={0.93} />
        <path
          d="M100,97 Q92,107 94,116 Q100,120 106,116 Q108,107 100,97 Z"
          fill="#fbbf24"
          fillOpacity={0.87}
        />
        <ellipse
          cx={100}
          cy={118}
          rx={11}
          ry={3.5}
          fill="#fbbf24"
          fillOpacity={0.83}
        />
      </g>
      <circle
        cx={100}
        cy={105}
        r={25}
        fill="#fbbf24"
        fillOpacity="0.1"
        filter="url(#bk-f)"
      />

      {/* Open position indicator left */}
      <text
        x={100}
        y={168}
        textAnchor="middle"
        fill="#fbbf24"
        fillOpacity="0.55"
        fontSize="9"
        fontWeight="700"
        letterSpacing="1"
      >
        OPEN POSITION
      </text>
      <text
        x={100}
        y={183}
        textAnchor="middle"
        fill="#fbbf24"
        fillOpacity="0.4"
        fontSize="8"
        letterSpacing="1"
      >
        BISHOP RULES
      </text>

      {/* Right — Knight on outpost */}
      <path
        d="M220,130 L230,108 Q232,96 238,92 L240,90 Q242,87 244,88 L246,90 Q248,92 248,96 L250,102 Q252,106 250,112 L250,120 Q248,122 241,122 Z"
        fill="#c084fc"
        fillOpacity={0.87}
      />
      <circle
        cx={248 - 10 + 1}
        cy={96}
        r={2}
        fill="#0c1220"
        fillOpacity={0.6}
      />
      <ellipse
        cx={238}
        cy={124}
        rx={12}
        ry={3.5}
        fill="#c084fc"
        fillOpacity={0.82}
      />
      <circle
        cx={238}
        cy={112}
        r={26}
        fill="#c084fc"
        fillOpacity="0.1"
        filter="url(#bk-f)"
      />

      {/* Knight's reach dots */}
      {[
        [-20, -42],
        [-42, -20],
        [-42, 20],
        [-20, 42],
        [20, 42],
        [42, 20],
        [42, -20],
        [20, -42],
      ].map(([dx, dy], i) => (
        <circle
          key={i}
          cx={238 + dx}
          cy={112 + dy}
          r={3.5}
          fill="#c084fc"
          fillOpacity="0.3"
        />
      ))}

      {/* Closed position indicator right */}
      <text
        x={300}
        y={168}
        textAnchor="middle"
        fill="#c084fc"
        fillOpacity="0.55"
        fontSize="9"
        fontWeight="700"
        letterSpacing="1"
      >
        CLOSED POSITION
      </text>
      <text
        x={300}
        y={183}
        textAnchor="middle"
        fill="#c084fc"
        fillOpacity="0.4"
        fontSize="8"
        letterSpacing="1"
      >
        KNIGHT OUTPOST
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  4. Opposition — two kings facing off                              */
/* ================================================================== */
function OppositionArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="op-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#1a1008" />
        </linearGradient>
        <radialGradient
          id="op-glow"
          cx="200"
          cy="100"
          r="140"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.18" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="op-f">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="200" fill="url(#op-bg)" />
      <rect width="400" height="200" fill="url(#op-glow)" />

      {/* Board squares 5x3 center */}
      {[-2, -1, 0, 1, 2].map((c) =>
        [-1, 0, 1].map((r) => (
          <rect
            key={`${r}${c}`}
            x={200 + c * 44 - 22}
            y={100 + r * 36 - 18}
            width={44}
            height={36}
            fill={(c + r) % 2 === 0 ? "#1e293b" : "#0f172a"}
            fillOpacity={0.55}
          />
        )),
      )}

      {/* Opposition gap indicator — the empty square between kings */}
      <rect
        x={178}
        y={82}
        width={44}
        height={36}
        fill="#f59e0b"
        fillOpacity="0.12"
        rx={2}
      />
      <text
        x={200}
        y={106}
        textAnchor="middle"
        fill="#f59e0b"
        fillOpacity="0.5"
        fontSize="8"
        letterSpacing="1"
      >
        GAP
      </text>

      {/* White king (has the opposition) */}
      <g>
        <rect
          x={98}
          y={88}
          width={3}
          height={7}
          fill="#f59e0b"
          fillOpacity={0.92}
        />
        <rect
          x={94}
          y={91}
          width={11}
          height={3}
          fill="#f59e0b"
          fillOpacity={0.92}
        />
        <circle cx={101} cy={102} r={9} fill="#f59e0b" fillOpacity={0.84} />
        <path
          d={`M95,110 L90,124 Q101,130 112,124 L107,110 Z`}
          fill="#f59e0b"
          fillOpacity={0.8}
        />
        <ellipse
          cx={101}
          cy={126}
          rx={14}
          ry={4.5}
          fill="#f59e0b"
          fillOpacity={0.74}
        />
      </g>
      <circle
        cx={101}
        cy={108}
        r={28}
        fill="#f59e0b"
        fillOpacity="0.08"
        filter="url(#op-f)"
      />
      <text
        x={101}
        y={155}
        textAnchor="middle"
        fill="#f59e0b"
        fillOpacity="0.5"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        HAS OPPOSITION
      </text>

      {/* Black king (to move, must yield) */}
      <g opacity={0.78}>
        <rect
          x={286}
          y={88}
          width={3}
          height={7}
          fill="#94a3b8"
          fillOpacity={0.85}
        />
        <rect
          x={282}
          y={91}
          width={11}
          height={3}
          fill="#94a3b8"
          fillOpacity={0.85}
        />
        <circle cx={289} cy={102} r={9} fill="#94a3b8" fillOpacity={0.75} />
        <path
          d={`M283,110 L278,124 Q289,130 300,124 L295,110 Z`}
          fill="#94a3b8"
          fillOpacity={0.72}
        />
        <ellipse
          cx={289}
          cy={126}
          rx={14}
          ry={4.5}
          fill="#94a3b8"
          fillOpacity={0.68}
        />
      </g>
      <text
        x={289}
        y={155}
        textAnchor="middle"
        fill="#94a3b8"
        fillOpacity="0.4"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        MUST YIELD
      </text>

      {/* Mutual tension arrows */}
      <line
        x1="116"
        y1="100"
        x2="176"
        y2="100"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <line
        x1="224"
        y1="100"
        x2="275"
        y2="100"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />

      <text
        x={200}
        y={190}
        textAnchor="middle"
        fill="#f59e0b"
        fillOpacity="0.4"
        fontSize="9"
        letterSpacing="2"
      >
        DIRECT OPPOSITION
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  5. Queen Endgames — queen vs pawn on 7th rank                     */
/* ================================================================== */
function QueenArt() {
  return (
    <svg viewBox="0 0 400 210" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="qe-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#1a0a14" />
          <stop offset="1" stopColor="#0c1220" />
        </linearGradient>
        <radialGradient
          id="qe-glow"
          cx="200"
          cy="105"
          r="150"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#f472b6" stopOpacity="0.2" />
          <stop offset="1" stopColor="#f472b6" stopOpacity="0" />
        </radialGradient>
        <filter id="qe-f">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="210" fill="url(#qe-bg)" />
      <rect width="400" height="210" fill="url(#qe-glow)" />

      {/* Grid */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
        <line
          key={`c${c}`}
          x1={30 + c * 42}
          y1="20"
          x2={30 + c * 42}
          y2="190"
          stroke="#1e293b"
          strokeWidth="0.7"
          strokeOpacity="0.6"
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((r) => (
        <line
          key={`r${r}`}
          x1="30"
          y1={20 + r * 34}
          x2="366"
          y2={20 + r * 34}
          stroke="#1e293b"
          strokeWidth="0.7"
          strokeOpacity="0.5"
        />
      ))}

      {/* Promotion square glowing */}
      <rect
        x={282}
        y={20}
        width={42}
        height={34}
        fill="#fbbf24"
        fillOpacity="0.2"
      />
      <text
        x={303}
        y={42}
        textAnchor="middle"
        fill="#fbbf24"
        fillOpacity="0.7"
        fontSize="15"
      >
        ♕
      </text>
      <text
        x={303}
        y={20}
        textAnchor="middle"
        fill="#fbbf24"
        fillOpacity="0.4"
        fontSize="7"
        letterSpacing="1"
      >
        PROMOTES
      </text>

      {/* Pawn on 7th rank (about to promote) — black pawn */}
      <circle cx={303} cy={72} r={8} fill="#94a3b8" fillOpacity={0.85} />
      <path
        d="M295,80 L291,95 Q303,101 315,95 L311,80 Z"
        fill="#94a3b8"
        fillOpacity={0.8}
      />
      <ellipse
        cx={303}
        cy={97}
        rx={14}
        ry={4.5}
        fill="#94a3b8"
        fillOpacity={0.73}
      />
      <text
        x={303}
        y={58}
        textAnchor="middle"
        fill="#94a3b8"
        fillOpacity="0.5"
        fontSize="7"
        letterSpacing="1"
      >
        7TH RANK
      </text>

      {/* King defending the pawn */}
      <g>
        <rect
          x={301}
          y={118}
          width={3}
          height={7}
          fill="#64748b"
          fillOpacity={0.78}
        />
        <rect
          x={297}
          y={121}
          width={11}
          height={3}
          fill="#64748b"
          fillOpacity={0.78}
        />
        <circle cx={304} cy={132} r={9} fill="#64748b" fillOpacity={0.7} />
        <path
          d={`M298,140 L293,154 Q304,160 315,154 L310,140 Z`}
          fill="#64748b"
          fillOpacity={0.66}
        />
        <ellipse
          cx={304}
          cy={156}
          rx={14}
          ry={4.5}
          fill="#64748b"
          fillOpacity={0.62}
        />
      </g>

      {/* White Queen approaching — checks path */}
      <g>
        <circle cx={108} cy={100} r={4} fill="#f472b6" fillOpacity={0.92} />
        <circle cx={92} cy={100} r={4} fill="#f472b6" fillOpacity={0.92} />
        <circle cx={116} cy={100} r={4} fill="#f472b6" fillOpacity={0.92} />
        <path
          d="M100,104 Q84,115 90,125 Q100,130 110,125 Q116,115 100,104 Z"
          fill="#f472b6"
          fillOpacity={0.85}
        />
        <path
          d="M90,124 Q100,130 110,124 L108,140 Q100,144 92,140 Z"
          fill="#f472b6"
          fillOpacity={0.82}
        />
        <ellipse
          cx={100}
          cy={142}
          rx={14}
          ry={4.5}
          fill="#f472b6"
          fillOpacity={0.78}
        />
      </g>
      <circle
        cx={100}
        cy={118}
        r={26}
        fill="#f472b6"
        fillOpacity="0.1"
        filter="url(#qe-f)"
      />

      {/* Check rays */}
      <line
        x1="115"
        y1="110"
        x2="285"
        y2="78"
        stroke="#f472b6"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        strokeDasharray="5 4"
      >
        <animate
          attributeName="strokeDashoffset"
          from="18"
          to="0"
          dur="2s"
          repeatCount="indefinite"
        />
      </line>

      <text
        x={200}
        y={202}
        textAnchor="middle"
        fill="#f472b6"
        fillOpacity="0.45"
        fontSize="9"
        letterSpacing="2"
      >
        QUEEN USES CHECKS TO APPROACH
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  6. Knight Endgame — knight counting moves across the board         */
/* ================================================================== */
function KnightEndgameArt() {
  return (
    <svg viewBox="0 0 400 210" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="ne-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#081218" />
        </linearGradient>
        <radialGradient
          id="ne-glow"
          cx="200"
          cy="105"
          r="150"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#34d399" stopOpacity="0.18" />
          <stop offset="1" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
        <filter id="ne-f">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="210" fill="url(#ne-bg)" />
      <rect width="400" height="210" fill="url(#ne-glow)" />

      {/* Full 8x8 board — small squares */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((r) =>
        [0, 1, 2, 3, 4, 5, 6, 7].map(
          (c) =>
            (r + c) % 2 === 1 && (
              <rect
                key={`${r}${c}`}
                x={12 + c * 47}
                y={12 + r * 23}
                width={47}
                height={23}
                fill="#1e293b"
                fillOpacity={0.5}
              />
            ),
        ),
      )}

      {/* Knight's long journey path */}
      <path
        d="M35,195 Q65,172 88,150 Q120,128 152,105 Q190,83 232,65 Q268,48 300,35"
        fill="none"
        stroke="#34d399"
        strokeWidth="2"
        strokeOpacity="0.4"
        strokeDasharray="6 5"
      >
        <animate
          attributeName="strokeDashoffset"
          from="22"
          to="0"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>

      {/* Start position — knight */}
      <path
        d="M30,195 L28,177 Q27,167 33,163 L35,161 Q37,158 39,160 L41,162 Q43,164 43,168 L44,174 Q46,178 44,184 L44,192 Q42,194 35,194 Z"
        fill="#34d399"
        fillOpacity={0.85}
      />
      <circle cx={39} cy={166} r={1.5} fill="#081218" fillOpacity={0.7} />
      <ellipse
        cx={36}
        cy={196}
        rx={9}
        ry={2.5}
        fill="#34d399"
        fillOpacity={0.75}
      />

      {/* Move count dots along path */}
      {[
        [88, 155],
        [152, 110],
        [232, 72],
        [300, 42],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={5} fill="#34d399" fillOpacity={0.35} />
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill="#34d399"
            fillOpacity="0.7"
            fontSize="7"
            fontWeight="700"
          >
            {i + 1}
          </text>
        </g>
      ))}

      {/* Target pawn */}
      <circle cx={310} cy={38} r={7} fill="#94a3b8" fillOpacity={0.8} />
      <path
        d="M303,45 L299,58 Q310,64 321,58 L317,45 Z"
        fill="#94a3b8"
        fillOpacity={0.75}
      />
      <ellipse
        cx={310}
        cy={60}
        rx={12}
        ry={3.5}
        fill="#94a3b8"
        fillOpacity={0.7}
      />
      <circle
        cx={310}
        cy={50}
        r={18}
        fill="none"
        stroke="#34d399"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />

      {/* "Slow" labels */}
      <text
        x={200}
        y={200}
        textAnchor="middle"
        fill="#34d399"
        fillOpacity="0.45"
        fontSize="9"
        letterSpacing="2"
      >
        COUNT KNIGHT MOVES — NEVER ASSUME
      </text>
    </svg>
  );
}

function DefaultEndgameArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="de-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#0c1a10" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#de-bg)" />
      <text
        x="200"
        y="110"
        textAnchor="middle"
        fill="#22c55e"
        fillOpacity="0.5"
        fontSize="48"
      >
        ♚
      </text>
    </svg>
  );
}
