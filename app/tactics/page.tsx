import type { Metadata } from "next";
import Link from "next/link";
import { TACTIC_MOTIFS } from "@/lib/tactics-motifs";
import { TacticIllustration } from "@/components/tactics-illustrations";

export const metadata: Metadata = {
  title: "Chess Tactics — Patterns Every Player Must Know",
  description:
    "Master essential chess tactical patterns: pins, forks, skewers, discovered attacks, back-rank mates, and more. Interactive guides with examples and FEN positions.",
  alternates: { canonical: "https://firechess.com/tactics" },
  openGraph: {
    title: "Chess Tactics Guide | FireChess",
    description:
      "Learn every essential chess tactic — pins, forks, skewers, discovered attacks, back-rank mates, smothered mates, zwischenzug, deflection, and interference.",
    url: "https://firechess.com/tactics",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Tactics — Every Pattern Explained | FireChess",
    description:
      "Pin, fork, skewer, discovered attack, back-rank mate — master all essential chess tactics with clear examples.",
  },
};

const DIFFICULTY_COLORS: Record<string, { badge: string; dot: string }> = {
  beginner: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
  },
  intermediate: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
  },
  advanced: {
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-400",
  },
};

const FREQ_LABEL: Record<string, string> = {
  "very-common": "Very common",
  common: "Common",
  uncommon: "Uncommon",
};

function JsonLd() {
  const base = "https://firechess.com";
  const url = `${base}/tactics`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Chess Tactics", item: url },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Essential Chess Tactical Patterns",
    description:
      "A complete guide to chess tactical motifs every player must know.",
    url,
    numberOfItems: TACTIC_MOTIFS.length,
    itemListElement: TACTIC_MOTIFS.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `${base}/tactics/${t.id}`,
      description: t.tagline,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </>
  );
}

export default function TacticsIndexPage() {
  const beginnerTactics = TACTIC_MOTIFS.filter(
    (t) => t.difficulty === "beginner",
  );
  const intermediateTactics = TACTIC_MOTIFS.filter(
    (t) => t.difficulty === "intermediate",
  );
  const advancedTactics = TACTIC_MOTIFS.filter(
    (t) => t.difficulty === "advanced",
  );

  return (
    <>
      <JsonLd />
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-stone-300 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-stone-300">Tactics</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="mb-4 overflow-hidden rounded-2xl border border-white/[0.06]">
            <TacticsHeroArt />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Chess Tactics — Patterns Every Player Must Know
          </h1>
          <p className="mt-3 max-w-2xl text-base text-stone-300">
            Tactical ability is the fastest way to improve at chess. These{" "}
            {TACTIC_MOTIFS.length} essential patterns — from beginner pins and
            forks to advanced interference — appear in games at every level.
            Learn to spot them and your rating will climb.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-500">
            <Link
              href="/openings"
              className="hover:text-stone-300 transition-colors"
            >
              → Opening guides
            </Link>
            <Link
              href="/endgames"
              className="hover:text-stone-300 transition-colors"
            >
              → Endgame guides
            </Link>
            <Link
              href="/train"
              className="hover:text-stone-300 transition-colors"
            >
              → Practice tactics
            </Link>
          </div>
        </header>

        {/* Beginner */}
        <section className="mb-12" aria-labelledby="beginner-heading">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.06]" />
            <h2
              id="beginner-heading"
              className="text-xs font-bold uppercase tracking-widest text-emerald-400"
            >
              Beginner Tactics
            </h2>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {beginnerTactics.map((t) => (
              <TacticCard key={t.id} tactic={t} />
            ))}
          </div>
        </section>

        {/* Intermediate */}
        <section className="mb-12" aria-labelledby="intermediate-heading">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.06]" />
            <h2
              id="intermediate-heading"
              className="text-xs font-bold uppercase tracking-widest text-amber-400"
            >
              Intermediate Tactics
            </h2>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {intermediateTactics.map((t) => (
              <TacticCard key={t.id} tactic={t} />
            ))}
          </div>
        </section>

        {/* Advanced */}
        {advancedTactics.length > 0 && (
          <section className="mb-12" aria-labelledby="advanced-heading">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[0.06]" />
              <h2
                id="advanced-heading"
                className="text-xs font-bold uppercase tracking-widest text-red-400"
              >
                Advanced Tactics
              </h2>
              <span className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {advancedTactics.map((t) => (
                <TacticCard key={t.id} tactic={t} />
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6 text-center">
          <p className="text-sm font-semibold text-amber-300">
            Ready to practice?
          </p>
          <p className="mt-1 text-xs text-stone-400">
            FireChess has thousands of rated puzzles sorted by tactical motif.
          </p>
          <Link
            href="/train"
            className="mt-4 inline-block rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
          >
            Train Tactics
          </Link>
        </div>
      </div>
    </>
  );
}

function TacticCard({ tactic }: { tactic: (typeof TACTIC_MOTIFS)[number] }) {
  const colors =
    DIFFICULTY_COLORS[tactic.difficulty] ?? DIFFICULTY_COLORS.beginner;
  return (
    <Link
      href={`/tactics/${tactic.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/10 hover:bg-white/[0.04]"
    >
      {/* Illustration */}
      <div className="overflow-hidden">
        <div className="transition-transform duration-300 group-hover:scale-[1.02]">
          <TacticIllustration id={tactic.id} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colors.badge}`}
          >
            {tactic.difficulty}
          </span>
          <span className="text-[10px] text-stone-500">
            {FREQ_LABEL[tactic.frequency]}
          </span>
        </div>
        <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
          {tactic.name}
        </h3>
        <p className="text-xs leading-relaxed text-stone-400">
          {tactic.tagline}
        </p>
      </div>
    </Link>
  );
}

/* ── Hero SVG for the tactics index page ── */
function TacticsHeroArt() {
  return (
    <svg viewBox="0 0 800 220" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="th-bg"
          x1="0"
          y1="0"
          x2="800"
          y2="220"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0c1220" />
          <stop offset="0.5" stopColor="#10160e" />
          <stop offset="1" stopColor="#14080e" />
        </linearGradient>
        <radialGradient
          id="th-g1"
          cx="200"
          cy="110"
          r="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.15" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="th-g2"
          cx="400"
          cy="110"
          r="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#4ade80" stopOpacity="0.12" />
          <stop offset="1" stopColor="#4ade80" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="th-g3"
          cx="600"
          cy="110"
          r="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#f472b6" stopOpacity="0.13" />
          <stop offset="1" stopColor="#f472b6" stopOpacity="0" />
        </radialGradient>
        <filter id="th-f">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="800" height="220" fill="url(#th-bg)" />
      <rect width="800" height="220" fill="url(#th-g1)" />
      <rect width="800" height="220" fill="url(#th-g2)" />
      <rect width="800" height="220" fill="url(#th-g3)" />

      {/* Board grid */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
        <line
          key={`vc${c}`}
          x1={50 + c * 87}
          y1="20"
          x2={50 + c * 87}
          y2="200"
          stroke="#1e293b"
          strokeWidth="0.6"
          strokeOpacity="0.5"
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((r) => (
        <line
          key={`hr${r}`}
          x1="50"
          y1={20 + r * 36}
          x2="746"
          y2={20 + r * 36}
          stroke="#1e293b"
          strokeWidth="0.6"
          strokeOpacity="0.4"
        />
      ))}

      {/* PIN illustration (left) */}
      <line
        x1="55"
        y1="200"
        x2="220"
        y2="38"
        stroke="#a78bfa"
        strokeWidth="2"
        strokeOpacity="0.35"
        strokeDasharray="8 6"
      >
        <animate
          attributeName="strokeDashoffset"
          from="28"
          to="0"
          dur="3s"
          repeatCount="indefinite"
        />
      </line>
      {/* bishop */}
      <circle cx={68} cy={188} r={7} fill="#c4b5fd" fillOpacity={0.85} />
      <path
        d="M60,194 L55,210 Q68,215 81,210 L76,194 Z"
        fill="#c4b5fd"
        fillOpacity={0.8}
      />
      {/* pinned knight */}
      <path
        d="M130,140 L128,122 Q127,112 133,108 L135,106 Q137,103 139,105 L141,107 Q143,111 143,117 L142,130 Q140,135 133,135 Z"
        fill="#94a3b8"
        fillOpacity={0.7}
      />
      {/* king */}
      <rect
        x={209}
        y={25}
        width={3}
        height={6}
        fill="#94a3b8"
        fillOpacity={0.65}
      />
      <rect
        x={206}
        y={27}
        width={9}
        height={3}
        fill="#94a3b8"
        fillOpacity={0.65}
      />
      <circle cx={212} cy={37} r={7} fill="#94a3b8" fillOpacity={0.58} />

      {/* FORK illustration (center) */}
      <line
        x1="390"
        y1="145"
        x2="330"
        y2="55"
        stroke="#4ade80"
        strokeWidth="1.8"
        strokeOpacity="0.45"
        strokeDasharray="6 5"
      >
        <animate
          attributeName="strokeDashoffset"
          from="22"
          to="0"
          dur="2.5s"
          repeatCount="indefinite"
        />
      </line>
      <line
        x1="390"
        y1="145"
        x2="470"
        y2="55"
        stroke="#4ade80"
        strokeWidth="1.8"
        strokeOpacity="0.45"
        strokeDasharray="6 5"
      >
        <animate
          attributeName="strokeDashoffset"
          from="22"
          to="0"
          dur="2.5s"
          repeatCount="indefinite"
        />
      </line>
      {/* knight forker */}
      <path
        d="M385,142 L383,124 Q382,114 388,110 L390,108 Q392,105 394,107 L396,109 Q398,113 398,119 L397,132 Q395,137 388,137 Z"
        fill="#4ade80"
        fillOpacity={0.88}
      />
      {/* targets */}
      <circle cx={330} cy={58} r={7} fill="#64748b" fillOpacity={0.6} />
      <path
        d="M324,64 L319,79 Q330,84 341,79 L336,64 Z"
        fill="#64748b"
        fillOpacity={0.55}
      />
      <rect
        x={461}
        y={42}
        width={6}
        height={5}
        rx={1}
        fill="#64748b"
        fillOpacity={0.6}
      />
      <rect
        x={467}
        y={42}
        width={6}
        height={5}
        rx={1}
        fill="#64748b"
        fillOpacity={0.6}
      />
      <rect
        x={454}
        y={46}
        width={22}
        height={16}
        rx={2}
        fill="#64748b"
        fillOpacity={0.55}
      />
      <ellipse
        cx={465}
        cy={63}
        rx={12}
        ry={3}
        fill="#64748b"
        fillOpacity={0.5}
      />

      {/* SMOTHERED MATE (right) */}
      <rect
        x={565}
        y={20}
        width={87}
        height={36}
        fill="#1e293b"
        fillOpacity={0.7}
      />
      <rect
        x={652}
        y={20}
        width={87}
        height={36}
        fill="#0f172a"
        fillOpacity={0.7}
      />
      <rect
        x={565}
        y={56}
        width={87}
        height={36}
        fill="#0f172a"
        fillOpacity={0.6}
      />
      <rect
        x={652}
        y={56}
        width={87}
        height={36}
        fill="#1e293b"
        fillOpacity={0.6}
      />
      {/* smothered king */}
      <rect
        x={687}
        y={25}
        width={3}
        height={6}
        fill="#e2e8f0"
        fillOpacity={0.7}
      />
      <rect
        x={684}
        y={27}
        width={9}
        height={3}
        fill="#e2e8f0"
        fillOpacity={0.7}
      />
      <circle cx={690} cy={37} r={7} fill="#e2e8f0" fillOpacity={0.65} />
      {/* friendly pieces blocking escape */}
      <circle cx={638} cy={30} r={6} fill="#475569" fillOpacity={0.6} />
      <path
        d="M632,36 L628,51 Q638,56 648,51 L644,36 Z"
        fill="#475569"
        fillOpacity={0.55}
      />
      <rect
        x={627}
        y={58}
        width={5}
        height={4}
        rx={1}
        fill="#64748b"
        fillOpacity={0.55}
      />
      <rect
        x={630}
        y={58}
        width={5}
        height={4}
        rx={1}
        fill="#64748b"
        fillOpacity={0.55}
      />
      <rect
        x={621}
        y={61}
        width={18}
        height={14}
        rx={2}
        fill="#64748b"
        fillOpacity={0.5}
      />
      {/* knight delivering mate */}
      <path
        d="M660,100 L658,82 Q657,72 663,68 L665,66 Q667,63 669,65 L671,67 Q673,71 673,77 L672,90 Q670,95 663,95 Z"
        fill="#f472b6"
        fillOpacity={0.88}
      />
      <circle
        cx={663}
        cy={95}
        r={18}
        fill="#f472b6"
        fillOpacity="0.1"
        filter="url(#th-f)"
      />

      {/* Labels */}
      <text
        x={130}
        y={215}
        textAnchor="middle"
        fill="#a78bfa"
        fillOpacity="0.45"
        fontSize="9"
        fontWeight="700"
        letterSpacing="1"
      >
        PIN
      </text>
      <text
        x={400}
        y={215}
        textAnchor="middle"
        fill="#4ade80"
        fillOpacity="0.45"
        fontSize="9"
        fontWeight="700"
        letterSpacing="1"
      >
        FORK
      </text>
      <text
        x={660}
        y={215}
        textAnchor="middle"
        fill="#f472b6"
        fillOpacity="0.45"
        fontSize="9"
        fontWeight="700"
        letterSpacing="1"
      >
        SMOTHERED MATE
      </text>
    </svg>
  );
}
