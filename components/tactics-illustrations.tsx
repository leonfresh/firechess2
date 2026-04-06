/**
 * Tactics Illustrations — unique chess-themed SVG artwork per tactic motif.
 * Follows the blog-featured-images.tsx style: drawn piece silhouettes,
 * atmospheric gradients, glow filters, and subtle animations. Pure SVG.
 */

export function TacticIllustration({ id }: { id: string }) {
  switch (id) {
    case "pins":
      return <PinsArt />;
    case "forks":
      return <ForksArt />;
    case "skewers":
      return <SkewersArt />;
    case "discovered-attack":
      return <DiscoveredArt />;
    case "back-rank-mate":
      return <BackRankArt />;
    case "smothered-mate":
      return <SmotheredArt />;
    case "zwischenzug":
      return <ZwischenzugArt />;
    case "deflection":
      return <DeflectionArt />;
    case "interference":
      return <InterferenceArt />;
    default:
      return <DefaultTacticArt />;
  }
}

/* tiny shared piece helpers */
function Pawn({
  x,
  y,
  fill,
  opacity = 0.8,
}: {
  x: number;
  y: number;
  fill: string;
  opacity?: number;
}) {
  return (
    <g>
      <circle cx={x} cy={y - 9} r={5.5} fill={fill} fillOpacity={opacity} />
      <path
        d={`M${x - 4},${y - 4} L${x - 6},${y + 6} Q${x},${y + 10} ${x + 6},${y + 6} L${x + 4},${y - 4} Z`}
        fill={fill}
        fillOpacity={opacity * 0.9}
      />
      <ellipse
        cx={x}
        cy={y + 7}
        rx={8}
        ry={3}
        fill={fill}
        fillOpacity={opacity * 0.85}
      />
    </g>
  );
}

function Rook({
  x,
  y,
  fill,
  opacity = 0.8,
}: {
  x: number;
  y: number;
  fill: string;
  opacity?: number;
}) {
  return (
    <g>
      <rect
        x={x - 7}
        y={y - 20}
        width={4}
        height={8}
        rx={1}
        fill={fill}
        fillOpacity={opacity}
      />
      <rect
        x={x - 1}
        y={y - 20}
        width={4}
        height={8}
        rx={1}
        fill={fill}
        fillOpacity={opacity}
      />
      <rect
        x={x + 3}
        y={y - 20}
        width={4}
        height={8}
        rx={1}
        fill={fill}
        fillOpacity={opacity}
      />
      <rect
        x={x - 7}
        y={y - 13}
        width={14}
        height={14}
        rx={2}
        fill={fill}
        fillOpacity={opacity}
      />
      <ellipse
        cx={x}
        cy={y + 2}
        rx={10}
        ry={3.5}
        fill={fill}
        fillOpacity={opacity * 0.85}
      />
    </g>
  );
}

function Bishop({
  x,
  y,
  fill,
  opacity = 0.8,
}: {
  x: number;
  y: number;
  fill: string;
  opacity?: number;
}) {
  return (
    <g>
      <circle cx={x} cy={y - 18} r={3.5} fill={fill} fillOpacity={opacity} />
      <path
        d={`M${x},${y - 14} Q${x - 8},${y - 2} ${x - 6},${y + 6} Q${x},${y + 9} ${x + 6},${y + 6} Q${x + 8},${y - 2} ${x},${y - 14} Z`}
        fill={fill}
        fillOpacity={opacity * 0.9}
      />
      <ellipse
        cx={x}
        cy={y + 8}
        rx={9}
        ry={3}
        fill={fill}
        fillOpacity={opacity * 0.85}
      />
    </g>
  );
}

function King({
  x,
  y,
  fill,
  opacity = 0.8,
}: {
  x: number;
  y: number;
  fill: string;
  opacity?: number;
}) {
  return (
    <g>
      <rect
        x={x - 1.5}
        y={y - 28}
        width={3}
        height={8}
        fill={fill}
        fillOpacity={opacity}
      />
      <rect
        x={x - 4.5}
        y={y - 25}
        width={9}
        height={3}
        fill={fill}
        fillOpacity={opacity}
      />
      <circle
        cx={x}
        cy={y - 16}
        r={7}
        fill={fill}
        fillOpacity={opacity * 0.9}
      />
      <path
        d={`M${x - 6},${y - 10} L${x - 10},${y + 4} Q${x},${y + 9} ${x + 10},${y + 4} L${x + 6},${y - 10} Z`}
        fill={fill}
        fillOpacity={opacity * 0.85}
      />
      <ellipse
        cx={x}
        cy={y + 6}
        rx={12}
        ry={4}
        fill={fill}
        fillOpacity={opacity * 0.8}
      />
    </g>
  );
}

function Queen({
  x,
  y,
  fill,
  opacity = 0.8,
}: {
  x: number;
  y: number;
  fill: string;
  opacity?: number;
}) {
  return (
    <g>
      <circle cx={x - 9} cy={y - 24} r={3} fill={fill} fillOpacity={opacity} />
      <circle cx={x} cy={y - 28} r={3.5} fill={fill} fillOpacity={opacity} />
      <circle cx={x + 9} cy={y - 24} r={3} fill={fill} fillOpacity={opacity} />
      <path
        d={`M${x - 12},${y - 22} L${x - 10},${y - 6} Q${x},${y - 2} ${x + 10},${y - 6} L${x + 12},${y - 22} Q${x},${y - 14} ${x - 12},${y - 22} Z`}
        fill={fill}
        fillOpacity={opacity * 0.9}
      />
      <path
        d={`M${x - 10},${y - 7} Q${x},${y + 2} ${x + 10},${y - 7} L${x + 8},${y + 6} Q${x},${y + 10} ${x - 8},${y + 6} Z`}
        fill={fill}
        fillOpacity={opacity * 0.85}
      />
      <ellipse
        cx={x}
        cy={y + 8}
        rx={11}
        ry={3.5}
        fill={fill}
        fillOpacity={opacity * 0.8}
      />
    </g>
  );
}

function Knight({
  x,
  y,
  fill,
  opacity = 0.8,
}: {
  x: number;
  y: number;
  fill: string;
  opacity?: number;
}) {
  return (
    <g>
      <path
        d={`M${x - 5},${y + 8} L${x - 7},${y - 8} Q${x - 8},${y - 20} ${x - 2},${y - 24} L${x + 2},${y - 26} Q${x + 6},${y - 24} ${x + 8},${y - 20} L${x + 9},${y - 14} Q${x + 7},${y - 8} ${x + 7},${y + 2} Q${x + 4},${y + 4} ${x - 3},${y + 4} Z`}
        fill={fill}
        fillOpacity={opacity * 0.9}
      />
      <circle cx={x + 1} cy={y - 18} r={1.5} fill="#0c1220" fillOpacity={0.6} />
      <ellipse
        cx={x}
        cy={y + 9}
        rx={10}
        ry={3}
        fill={fill}
        fillOpacity={opacity * 0.8}
      />
    </g>
  );
}

/* ================================================================== */
/*  1. Pins  bishop ray locking a pinned piece to the king            */
/* ================================================================== */
function PinsArt() {
  return (
    <svg viewBox="0 0 400 210" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="pin-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#130e22" />
        </linearGradient>
        <radialGradient
          id="pin-glow"
          cx="200"
          cy="105"
          r="130"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.2" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <filter id="pin-f">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="pin-soft">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <rect width="400" height="210" fill="url(#pin-bg)" />
      <rect width="400" height="210" fill="url(#pin-glow)" />

      {/* Board grid – subtle */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect
            x={100 + i * 40}
            y={50}
            width={40}
            height={40}
            fill={i % 2 === 0 ? "#1e293b" : "#0f172a"}
            fillOpacity={0.6}
          />
          <rect
            x={100 + i * 40}
            y={90}
            width={40}
            height={40}
            fill={i % 2 === 1 ? "#1e293b" : "#0f172a"}
            fillOpacity={0.6}
          />
          <rect
            x={100 + i * 40}
            y={130}
            width={40}
            height={40}
            fill={i % 2 === 0 ? "#1e293b" : "#0f172a"}
            fillOpacity={0.6}
          />
        </g>
      ))}

      {/* Pin ray — diagonal from bishop through knight to king */}
      <line
        x1="82"
        y1="187"
        x2="318"
        y2="52"
        stroke="#a78bfa"
        strokeWidth="3"
        strokeOpacity="0.25"
        filter="url(#pin-soft)"
      />
      <line
        x1="82"
        y1="187"
        x2="318"
        y2="52"
        stroke="#a78bfa"
        strokeWidth="1.5"
        strokeOpacity="0.7"
        strokeDasharray="6 4"
      >
        <animate
          attributeName="strokeDashoffset"
          from="20"
          to="0"
          dur="2.5s"
          repeatCount="indefinite"
        />
      </line>

      {/* Bishop (attacker) */}
      <Bishop x={95} y={185} fill="#c4b5fd" opacity={0.9} />

      {/* Pinned knight — highlighted with freeze ring */}
      <circle
        cx={200}
        cy={130}
        r={22}
        fill="none"
        stroke="#a78bfa"
        strokeWidth="2"
        strokeOpacity="0.6"
      />
      <circle cx={200} cy={130} r={22} fill="#a78bfa" fillOpacity="0.06" />
      <Knight x={200} y={135} fill="#94a3b8" opacity={0.85} />
      {/* Freeze icon */}
      <text x={222} y={113} fill="#a78bfa" fillOpacity="0.8" fontSize="12">
        ✕
      </text>

      {/* King (pinned against) */}
      <King x={310} y={65} fill="#cbd5e1" opacity={0.7} />

      {/* Labels */}
      <text
        x={75}
        y={205}
        textAnchor="middle"
        fill="#a78bfa"
        fillOpacity="0.6"
        fontSize="9"
        fontWeight="600"
        letterSpacing="1"
      >
        BISHOP
      </text>
      <text
        x={200}
        y={175}
        textAnchor="middle"
        fill="#a78bfa"
        fillOpacity="0.55"
        fontSize="9"
        fontWeight="600"
        letterSpacing="1"
      >
        PINNED
      </text>
      <text
        x={310}
        y={82}
        textAnchor="middle"
        fill="#64748b"
        fillOpacity="0.7"
        fontSize="9"
        fontWeight="600"
        letterSpacing="1"
      >
        KING
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  2. Forks  knight forking king and rook                            */
/* ================================================================== */
function ForksArt() {
  return (
    <svg viewBox="0 0 400 210" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="fork-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#0e1a10" />
        </linearGradient>
        <radialGradient
          id="fork-glow"
          cx="200"
          cy="130"
          r="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#4ade80" stopOpacity="0.18" />
          <stop offset="1" stopColor="#4ade80" stopOpacity="0" />
        </radialGradient>
        <filter id="fork-f">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="210" fill="url(#fork-bg)" />
      <rect width="400" height="210" fill="url(#fork-glow)" />

      {/* Board squares */}
      {[0, 1, 2, 3, 4, 5].map((r) =>
        [0, 1, 2, 3, 4, 5].map(
          (c) =>
            (r + c) % 2 === 1 && (
              <rect
                key={`${r}${c}`}
                x={80 + c * 40}
                y={30 + r * 30}
                width={40}
                height={30}
                fill="#1e293b"
                fillOpacity={0.5}
              />
            ),
        ),
      )}

      {/* Knight jump lines to both targets */}
      <line
        x1="200"
        y1="155"
        x2="130"
        y2="60"
        stroke="#4ade80"
        strokeWidth="2"
        strokeOpacity="0.5"
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
      <line
        x1="200"
        y1="155"
        x2="290"
        y2="60"
        stroke="#4ade80"
        strokeWidth="2"
        strokeOpacity="0.5"
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

      {/* Target circles */}
      <circle
        cx={130}
        cy={73}
        r={22}
        fill="#4ade80"
        fillOpacity="0.08"
        stroke="#4ade80"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <circle
        cx={290}
        cy={73}
        r={22}
        fill="#4ade80"
        fillOpacity="0.08"
        stroke="#4ade80"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />

      {/* Forking knight */}
      <Knight x={200} y={160} fill="#4ade80" opacity={0.9} />
      {/* Glow */}
      <circle
        cx={200}
        cy={153}
        r={18}
        fill="#4ade80"
        fillOpacity="0.12"
        filter="url(#fork-f)"
      />

      {/* King target */}
      <King x={130} y={78} fill="#cbd5e1" opacity={0.75} />
      {/* Rook target */}
      <Rook x={290} y={78} fill="#cbd5e1" opacity={0.75} />

      {/* Fork label */}
      <text
        x={200}
        y={198}
        textAnchor="middle"
        fill="#4ade80"
        fillOpacity="0.5"
        fontSize="10"
        fontWeight="700"
        letterSpacing="2"
      >
        FORK
      </text>
      <text
        x={130}
        y={115}
        textAnchor="middle"
        fill="#4ade80"
        fillOpacity="0.45"
        fontSize="8"
        letterSpacing="1"
      >
        TARGET 1
      </text>
      <text
        x={290}
        y={115}
        textAnchor="middle"
        fill="#4ade80"
        fillOpacity="0.45"
        fontSize="8"
        letterSpacing="1"
      >
        TARGET 2
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  3. Skewers  rook skewering king through to queen                  */
/* ================================================================== */
function SkewersArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="sk-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#1a1208" />
        </linearGradient>
        <radialGradient
          id="sk-glow"
          cx="200"
          cy="100"
          r="150"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fb923c" stopOpacity="0.18" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
        <filter id="sk-f">
          <feGaussianBlur stdDeviation="6" result="bl" />
          <feMerge>
            <feMergeNode in="bl" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker
          id="sk-arr"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fb923c" fillOpacity="0.8" />
        </marker>
      </defs>
      <rect width="400" height="200" fill="url(#sk-bg)" />
      <rect width="400" height="200" fill="url(#sk-glow)" />

      {/* Rank line */}
      <line
        x1="40"
        y1="100"
        x2="370"
        y2="100"
        stroke="#fb923c"
        strokeWidth="2.5"
        strokeOpacity="0.3"
        markerEnd="url(#sk-arr)"
      />
      <line
        x1="40"
        y1="100"
        x2="370"
        y2="100"
        stroke="#fb923c"
        strokeWidth="1"
        strokeOpacity="0.7"
        strokeDasharray="8 5"
      >
        <animate
          attributeName="strokeDashoffset"
          from="26"
          to="0"
          dur="2s"
          repeatCount="indefinite"
        />
      </line>

      {/* Rook attacker */}
      <Rook x={55} y={100} fill="#fb923c" opacity={0.9} />
      <circle
        cx={55}
        cy={95}
        r={20}
        fill="#fb923c"
        fillOpacity="0.1"
        filter="url(#sk-f)"
      />

      {/* King (valuable piece being skewered) */}
      <King x={200} y={100} fill="#cbd5e1" opacity={0.8} />
      {/* Arrow "King must move" */}
      <text
        x={200}
        y={150}
        textAnchor="middle"
        fill="#fb923c"
        fillOpacity="0.55"
        fontSize="9"
        letterSpacing="1"
      >
        MUST MOVE
      </text>
      <line
        x1="200"
        y1="142"
        x2="200"
        y2="130"
        stroke="#fb923c"
        strokeOpacity="0.4"
        strokeWidth="1"
        markerEnd="url(#sk-arr)"
      />

      {/* Queen (exposed after king moves) */}
      <Queen x={330} y={100} fill="#94a3b8" opacity={0.6} />
      {/* Reveal cross */}
      <text
        x={330}
        y={150}
        textAnchor="middle"
        fill="#ef4444"
        fillOpacity="0.6"
        fontSize="9"
        letterSpacing="1"
      >
        EXPOSED
      </text>

      {/* Labels */}
      <text
        x={55}
        y={130}
        textAnchor="middle"
        fill="#fb923c"
        fillOpacity="0.5"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        ROOK
      </text>
      <text
        x={200}
        y={48}
        textAnchor="middle"
        fill="#64748b"
        fillOpacity="0.45"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        KING
      </text>
      <text
        x={330}
        y={48}
        textAnchor="middle"
        fill="#64748b"
        fillOpacity="0.45"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        QUEEN
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  4. Discovered Attack  piece steps aside revealing hidden attacker */
/* ================================================================== */
function DiscoveredArt() {
  return (
    <svg viewBox="0 0 400 210" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="da-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#0c1820" />
        </linearGradient>
        <radialGradient
          id="da-glow"
          cx="200"
          cy="100"
          r="130"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.2" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <filter id="da-f">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="210" fill="url(#da-bg)" />
      <rect width="400" height="210" fill="url(#da-glow)" />

      {/* Board squares */}
      {[0, 1, 2, 3, 4].map((r) =>
        [0, 1, 2, 3, 4].map(
          (c) =>
            (r + c) % 2 === 1 && (
              <rect
                key={`${r}${c}`}
                x={80 + c * 48}
                y={20 + r * 36}
                width={48}
                height={36}
                fill="#1e293b"
                fillOpacity={0.45}
              />
            ),
        ),
      )}

      {/* Rook hidden behind knight — battery */}
      <Rook x={100} y={110} fill="#38bdf8" opacity={0.9} />

      {/* "Hidden" glow behind knight */}
      <circle
        cx={100}
        cy={105}
        r={24}
        fill="#38bdf8"
        fillOpacity="0.1"
        filter="url(#da-f)"
      />

      {/* Knight (blocking piece, about to move) — shown moving */}
      <g opacity="0.5">
        <Knight x={200} y={110} fill="#94a3b8" opacity={0.5} />
      </g>
      {/* Arrow showing knight's move */}
      <path
        d="M215,90 Q250,50 285,75"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeOpacity="0.7"
        strokeDasharray="5 4"
        markerEnd="url(#da-arr)"
      />
      <defs>
        <marker
          id="da-arr"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" fillOpacity="0.8" />
        </marker>
      </defs>

      {/* Knight destination */}
      <Knight x={290} y={82} fill="#fbbf24" opacity={0.85} />

      {/* Rook's ray now open */}
      <line
        x1="124"
        y1="105"
        x2="365"
        y2="105"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeOpacity="0.5"
        strokeDasharray="6 4"
      >
        <animate
          attributeName="strokeDashoffset"
          from="20"
          to="0"
          dur="2s"
          repeatCount="indefinite"
        />
      </line>

      {/* Target of the rook attack */}
      <Queen x={365} y={110} fill="#e2e8f0" opacity={0.6} />
      <circle
        cx={365}
        cy={105}
        r={16}
        fill="none"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />

      {/* Labels */}
      <text
        x={100}
        y={145}
        textAnchor="middle"
        fill="#38bdf8"
        fillOpacity="0.5"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        ROOK FIRES
      </text>
      <text
        x={200}
        y={145}
        textAnchor="middle"
        fill="#fbbf24"
        fillOpacity="0.45"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        MOVES AWAY
      </text>
      <text
        x={365}
        y={145}
        textAnchor="middle"
        fill="#ef4444"
        fillOpacity="0.45"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        ATTACKED
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  5. Back-Rank Mate  rook delivering mate on the 8th rank           */
/* ================================================================== */
function BackRankArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="br-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#1a0a0a" />
          <stop offset="1" stopColor="#0c1220" />
        </linearGradient>
        <radialGradient
          id="br-glow"
          cx="200"
          cy="50"
          r="140"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <filter id="br-f">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="200" fill="url(#br-bg)" />
      <rect width="400" height="200" fill="url(#br-glow)" />

      {/* 8x2 board — back rank + the pawn row */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
        <g key={c}>
          <rect
            x={40 + c * 40}
            y={20}
            width={40}
            height={40}
            fill={c % 2 === 0 ? "#1e293b" : "#0f172a"}
            fillOpacity={0.7}
          />
          <rect
            x={40 + c * 40}
            y={60}
            width={40}
            height={40}
            fill={c % 2 === 1 ? "#1e293b" : "#0f172a"}
            fillOpacity={0.55}
          />
          <rect
            x={40 + c * 40}
            y={100}
            width={40}
            height={40}
            fill={c % 2 === 0 ? "#1e293b" : "#0f172a"}
            fillOpacity={0.4}
          />
        </g>
      ))}

      {/* Three black pawns forming the "prison" */}
      <Pawn x={220} y={92} fill="#64748b" opacity={0.75} />
      <Pawn x={260} y={92} fill="#64748b" opacity={0.75} />
      <Pawn x={300} y={92} fill="#64748b" opacity={0.75} />

      {/* King trapped on back rank */}
      <King x={260} y={42} fill="#94a3b8" opacity={0.8} />
      {/* Trapped indicator */}
      <rect
        x={222}
        y={20}
        width={120}
        height={40}
        fill="#ef4444"
        fillOpacity="0.07"
        rx={4}
      />

      {/* White rook delivering mate */}
      <Rook x={100} y={42} fill="#ef4444" opacity={0.9} />
      <circle
        cx={100}
        cy={38}
        r={20}
        fill="#ef4444"
        fillOpacity="0.15"
        filter="url(#br-f)"
      />

      {/* Rook ray */}
      <line
        x1="120"
        y1="38"
        x2="228"
        y2="38"
        stroke="#ef4444"
        strokeWidth="2.5"
        strokeOpacity="0.5"
        strokeDasharray="6 4"
      >
        <animate
          attributeName="strokeDashoffset"
          from="20"
          to="0"
          dur="1.8s"
          repeatCount="indefinite"
        />
      </line>

      {/* "Checkmate" label */}
      <text
        x={200}
        y={175}
        textAnchor="middle"
        fill="#ef4444"
        fillOpacity="0.6"
        fontSize="18"
        fontWeight="800"
        letterSpacing="3"
      >
        CHECKMATE
      </text>
      <text
        x={200}
        y={192}
        textAnchor="middle"
        fill="#64748b"
        fillOpacity="0.5"
        fontSize="9"
        letterSpacing="1"
      >
        KING HAS NOWHERE TO GO
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  6. Smothered Mate  knight jumps in, king suffocates               */
/* ================================================================== */
function SmotheredArt() {
  return (
    <svg viewBox="0 0 400 210" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="sm-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#12080e" />
        </linearGradient>
        <radialGradient
          id="sm-glow"
          cx="300"
          cy="55"
          r="130"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#f472b6" stopOpacity="0.2" />
          <stop offset="1" stopColor="#f472b6" stopOpacity="0" />
        </radialGradient>
        <filter id="sm-f">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="210" fill="url(#sm-bg)" />
      <rect width="400" height="210" fill="url(#sm-glow)" />

      {/* g8 corner area — 3x3 board */}
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}${c}`}
            x={200 + c * 55}
            y={20 + r * 55}
            width={55}
            height={55}
            fill={(r + c) % 2 === 1 ? "#1e293b" : "#0f172a"}
            fillOpacity={0.7}
          />
        )),
      )}

      {/* King cornered */}
      <King x={310} y={57} fill="#94a3b8" opacity={0.82} />

      {/* Friendly rook smothering the king */}
      <Rook x={255} y={57} fill="#64748b" opacity={0.7} />

      {/* Friendly pawns above */}
      <Pawn x={255} y={32} fill="#64748b" opacity={0.65} />
      <Pawn x={310} y={32} fill="#64748b" opacity={0.65} />

      {/* Knight delivering mate */}
      <Knight x={255} y={105} fill="#f472b6" opacity={0.92} />
      <circle
        cx={255}
        cy={100}
        r={22}
        fill="#f472b6"
        fillOpacity="0.12"
        filter="url(#sm-f)"
      />

      {/* Knight jump arc */}
      <path
        d="M255,100 Q225,148 200,185"
        fill="none"
        stroke="#f472b6"
        strokeWidth="2"
        strokeOpacity="0.4"
        strokeDasharray="5 4"
      />

      {/* Checkmark over king */}
      <text
        x={341}
        y={68}
        fill="#ef4444"
        fillOpacity="0.8"
        fontSize="22"
        fontWeight="900"
      >
        +
      </text>

      {/* All escape squares blocked indicator */}
      {[
        [310, 105],
        [365, 57],
        [365, 105],
      ].map(([cx, cy], i) => (
        <text
          key={i}
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill="#ef4444"
          fillOpacity="0.4"
          fontSize="16"
        >
          ✕
        </text>
      ))}

      <text
        x={200}
        y={200}
        textAnchor="middle"
        fill="#f472b6"
        fillOpacity="0.5"
        fontSize="10"
        fontWeight="700"
        letterSpacing="2"
      >
        SMOTHERED — NO ESCAPE
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  7. Zwischenzug  unexpected in-between move arrow                  */
/* ================================================================== */
function ZwischenzugArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="zw-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#0c1a14" />
        </linearGradient>
        <radialGradient
          id="zw-glow"
          cx="200"
          cy="100"
          r="130"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#34d399" stopOpacity="0.18" />
          <stop offset="1" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
        <filter id="zw-f">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker
          id="zw-arr"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" fillOpacity="0.9" />
        </marker>
        <marker
          id="zw-dim"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" fillOpacity="0.5" />
        </marker>
      </defs>
      <rect width="400" height="200" fill="url(#zw-bg)" />
      <rect width="400" height="200" fill="url(#zw-glow)" />

      {/* "Expected" faded path */}
      <line
        x1="80"
        y1="100"
        x2="200"
        y2="100"
        stroke="#475569"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        strokeDasharray="6 5"
        markerEnd="url(#zw-dim)"
      />
      <text
        x={140}
        y={88}
        textAnchor="middle"
        fill="#475569"
        fillOpacity="0.4"
        fontSize="8"
        letterSpacing="1"
      >
        EXPECTED
      </text>

      {/* The IN-BETWEEN move curving up */}
      <path
        d="M80,100 Q130,30 240,55"
        fill="none"
        stroke="#34d399"
        strokeWidth="2.5"
        strokeOpacity="0.8"
        markerEnd="url(#zw-arr)"
      />
      <text
        x={155}
        y={35}
        textAnchor="middle"
        fill="#34d399"
        fillOpacity="0.8"
        fontSize="9"
        fontWeight="700"
        letterSpacing="1"
      >
        IN-BETWEEN MOVE!
      </text>

      {/* Pieces */}
      <Queen x={80} y={100} fill="#94a3b8" opacity={0.75} />
      {/* "Expected" capture target — faded */}
      <Pawn x={200} y={100} fill="#475569" opacity={0.4} />
      {/* Real target of zwischenzug */}
      <King x={245} y={60} fill="#e2e8f0" opacity={0.75} />
      <circle cx={245} cy={55} r={22} fill="#ef4444" fillOpacity="0.12" />
      <text
        x={245}
        y={82}
        textAnchor="middle"
        fill="#ef4444"
        fillOpacity="0.5"
        fontSize="10"
      >
        CHECK!
      </text>

      {/* Confusion lines */}
      <text
        x={200}
        y={175}
        textAnchor="middle"
        fill="#34d399"
        fillOpacity="0.5"
        fontSize="10"
        fontWeight="800"
        letterSpacing="2"
      >
        ZWISCHENZUG
      </text>
      <text
        x={200}
        y={190}
        textAnchor="middle"
        fill="#64748b"
        fillOpacity="0.4"
        fontSize="8"
        letterSpacing="1"
      >
        IN-BETWEEN MOVE BEFORE RECAPTURE
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  8. Deflection  piece pulled away from defending its post          */
/* ================================================================== */
function DeflectionArt() {
  return (
    <svg viewBox="0 0 400 210" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="def-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#1a100a" />
        </linearGradient>
        <radialGradient
          id="def-glow"
          cx="200"
          cy="105"
          r="130"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#f97316" stopOpacity="0.18" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <filter id="def-f">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker
          id="def-arr"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" fillOpacity="0.8" />
        </marker>
      </defs>
      <rect width="400" height="210" fill="url(#def-bg)" />
      <rect width="400" height="210" fill="url(#def-glow)" />

      {/* Defender on its post — center */}
      <Rook x={200} y={105} fill="#94a3b8" opacity={0.8} />

      {/* What it was defending — bottom target */}
      <King x={200} y={175} fill="#64748b" opacity={0.6} />
      <line
        x1="200"
        y1="125"
        x2="200"
        y2="155"
        stroke="#64748b"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        strokeDasharray="3 3"
      />
      <text
        x={200}
        y={198}
        textAnchor="middle"
        fill="#64748b"
        fillOpacity="0.4"
        fontSize="8"
        letterSpacing="1"
      >
        DEFENDED
      </text>

      {/* Sacrifice bait pulling the defender */}
      <Queen x={330} y={105} fill="#f97316" opacity={0.88} />
      <circle
        cx={330}
        cy={100}
        r={22}
        fill="#f97316"
        fillOpacity="0.12"
        filter="url(#def-f)"
      />

      {/* Deflection arrow — defender being lured right */}
      <path
        d="M220,100 Q278,68 310,90"
        fill="none"
        stroke="#f97316"
        strokeWidth="2.5"
        strokeOpacity="0.7"
        markerEnd="url(#def-arr)"
      />
      <text
        x={265}
        y={64}
        textAnchor="middle"
        fill="#f97316"
        fillOpacity="0.65"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        FORCED
      </text>

      {/* Exposed! — the defender has left */}
      <text
        x={200}
        y={50}
        textAnchor="middle"
        fill="#ef4444"
        fillOpacity="0.75"
        fontSize="14"
        fontWeight="800"
        letterSpacing="2"
      >
        DEFENDER GONE!
      </text>
      <line
        x1="55"
        y1="57"
        x2="155"
        y2="57"
        stroke="#ef4444"
        strokeWidth="1"
        strokeOpacity="0.35"
      />
      <line
        x1="245"
        y1="57"
        x2="350"
        y2="57"
        stroke="#ef4444"
        strokeWidth="1"
        strokeOpacity="0.35"
      />

      <text
        x={200}
        y={200}
        textAnchor="middle"
        fill="#f97316"
        fillOpacity="0.4"
        fontSize="9"
        letterSpacing="2"
      >
        DEFLECTION
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  9. Interference  piece placed between two connected defenders     */
/* ================================================================== */
function InterferenceArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="int-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#080c1a" />
        </linearGradient>
        <radialGradient
          id="int-glow"
          cx="200"
          cy="100"
          r="130"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#818cf8" stopOpacity="0.2" />
          <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
        <filter id="int-f">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="200" fill="url(#int-bg)" />
      <rect width="400" height="200" fill="url(#int-glow)" />

      {/* Communication line between two defenders — a horizontal rank */}
      <line
        x1="50"
        y1="100"
        x2="360"
        y2="100"
        stroke="#818cf8"
        strokeWidth="2"
        strokeOpacity="0.2"
      />
      <text
        x={205}
        y={88}
        textAnchor="middle"
        fill="#818cf8"
        fillOpacity="0.3"
        fontSize="8"
        letterSpacing="2"
      >
        COMMUNICATION LINE
      </text>

      {/* Two linked defenders */}
      <Rook x={80} y={100} fill="#94a3b8" opacity={0.75} />
      <Queen x={340} y={100} fill="#94a3b8" opacity={0.75} />

      {/* Connecting dashed line between them */}
      <line
        x1="102"
        y1="95"
        x2="318"
        y2="95"
        stroke="#818cf8"
        strokeWidth="1.5"
        strokeOpacity="0.5"
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

      {/* Interference piece drops on their line */}
      <Knight x={205} y={100} fill="#818cf8" opacity={0.92} />
      <circle
        cx={205}
        cy={95}
        r={24}
        fill="#818cf8"
        fillOpacity="0.13"
        filter="url(#int-f)"
      />

      {/* X marks on either side of the blocker */}
      <text
        x={152}
        y={103}
        fill="#ef4444"
        fillOpacity="0.7"
        fontSize="14"
        fontWeight="900"
      >
        ✕
      </text>
      <text
        x={257}
        y={103}
        fill="#ef4444"
        fillOpacity="0.7"
        fontSize="14"
        fontWeight="900"
      >
        ✕
      </text>

      {/* Label */}
      <text
        x={205}
        y={160}
        textAnchor="middle"
        fill="#818cf8"
        fillOpacity="0.6"
        fontSize="10"
        fontWeight="700"
        letterSpacing="2"
      >
        INTERFERENCE
      </text>
      <text
        x={205}
        y={178}
        textAnchor="middle"
        fill="#64748b"
        fillOpacity="0.45"
        fontSize="8"
        letterSpacing="1"
      >
        BLOCK THEIR CONNECTION
      </text>
    </svg>
  );
}

/* Default fallback */
function DefaultTacticArt() {
  return (
    <svg viewBox="0 0 400 200" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="dt-bg"
          x1="0"
          y1="0"
          x2="400"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="1" stopColor="#1a1208" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#dt-bg)" />
      <Knight x={200} y={100} fill="#f59e0b" opacity={0.85} />
    </svg>
  );
}
