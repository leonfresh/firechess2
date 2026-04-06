import type { Metadata } from "next";
import Link from "next/link";
import { ENDGAME_GUIDES } from "@/lib/endgame-guides";
import { EndgameIllustration } from "@/components/endgame-illustrations";

export const metadata: Metadata = {
  title: "Chess Endgame Guides — Master King, Rook, and Pawn Endings",
  description:
    "Essential chess endgame theory: king and pawn endings, rook endgames (Lucena & Philidor), bishop vs knight, queen endgames, and knight endings. Step-by-step guides with FEN examples.",
  alternates: { canonical: "https://firechess.com/endgames" },
  openGraph: {
    title: "Chess Endgame Guides | FireChess",
    description:
      "Master king-pawn endings, rook endgames, bishop vs knight, queen endgames, and knight endings with clear theory, key positions, and FEN examples.",
    url: "https://firechess.com/endgames",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Endgame Guides — King, Rook, Queen & More | FireChess",
    description:
      "Lucena, Philidor, opposition, key squares — master essential endgame theory step by step.",
  },
};

const DIFFICULTY_COLORS: Record<string, { badge: string }> = {
  beginner: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  intermediate: { badge: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  advanced: { badge: "border-red-500/30 bg-red-500/10 text-red-400" },
};

function JsonLd() {
  const base = "https://firechess.com";
  const url = `${base}/endgames`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Endgame Guides", item: url },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Chess Endgame Guides",
    description: "A complete reference for essential chess endgame theory.",
    url,
    numberOfItems: ENDGAME_GUIDES.length,
    itemListElement: ENDGAME_GUIDES.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.name,
      url: `${base}/endgames/${e.id}`,
      description: e.tagline,
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

export default function EndgamesIndexPage() {
  const beginnerGuides = ENDGAME_GUIDES.filter(
    (g) => g.difficulty === "beginner",
  );
  const intermediateGuides = ENDGAME_GUIDES.filter(
    (g) => g.difficulty === "intermediate",
  );
  const advancedGuides = ENDGAME_GUIDES.filter(
    (g) => g.difficulty === "advanced",
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
          <span className="text-stone-300">Endgames</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
            <EndgameHeroArt />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Chess Endgame Guides
          </h1>
          <p className="mt-3 max-w-2xl text-base text-stone-300">
            Endgames decide games. Whether you're converting a winning advantage
            or defending a difficult position, knowing core theory — Lucena,
            Philidor, opposition, key squares — is non-negotiable. These{" "}
            {ENDGAME_GUIDES.length} guides cover everything from beginner king
            &amp; pawn endings to advanced queen theory.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-500">
            <Link
              href="/openings"
              className="hover:text-stone-300 transition-colors"
            >
              → Opening guides
            </Link>
            <Link
              href="/tactics"
              className="hover:text-stone-300 transition-colors"
            >
              → Tactics patterns
            </Link>
            <Link
              href="/train"
              className="hover:text-stone-300 transition-colors"
            >
              → Practice endgames
            </Link>
          </div>
        </header>

        {/* Beginner */}
        {beginnerGuides.length > 0 && (
          <section className="mb-12" aria-labelledby="eg-beginner">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[0.06]" />
              <h2
                id="eg-beginner"
                className="text-xs font-bold uppercase tracking-widest text-emerald-400"
              >
                Beginner Endgames
              </h2>
              <span className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {beginnerGuides.map((g) => (
                <EndgameCard key={g.id} guide={g} />
              ))}
            </div>
          </section>
        )}

        {/* Intermediate */}
        {intermediateGuides.length > 0 && (
          <section className="mb-12" aria-labelledby="eg-intermediate">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[0.06]" />
              <h2
                id="eg-intermediate"
                className="text-xs font-bold uppercase tracking-widest text-amber-400"
              >
                Intermediate Endgames
              </h2>
              <span className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {intermediateGuides.map((g) => (
                <EndgameCard key={g.id} guide={g} />
              ))}
            </div>
          </section>
        )}

        {/* Advanced */}
        {advancedGuides.length > 0 && (
          <section className="mb-12" aria-labelledby="eg-advanced">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[0.06]" />
              <h2
                id="eg-advanced"
                className="text-xs font-bold uppercase tracking-widest text-red-400"
              >
                Advanced Endgames
              </h2>
              <span className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {advancedGuides.map((g) => (
                <EndgameCard key={g.id} guide={g} />
              ))}
            </div>
          </section>
        )}

        {/* Why endgames matter */}
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-3 text-base font-bold text-white">
            Why Endgame Study Pays Off
          </h2>
          <p className="text-sm leading-relaxed text-stone-400">
            Most players focus on openings — but endgame knowledge has a direct
            impact on your rating. Every time you reach an endgame, the side
            with better theoretical knowledge converts or defends correctly. GM
            Reuben Fine estimated that 80% of all chess games pass through the
            endgame. Start with king &amp; pawn endings, then add rook
            technique, and your conversion rate will climb immediately.
          </p>
          <Link
            href="/analyze"
            className="mt-4 inline-block rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-stone-300 hover:border-white/20 transition-colors"
          >
            Analyze your endgame technique →
          </Link>
        </div>
      </div>
    </>
  );
}

function EndgameCard({ guide }: { guide: (typeof ENDGAME_GUIDES)[number] }) {
  const colors =
    DIFFICULTY_COLORS[guide.difficulty] ?? DIFFICULTY_COLORS.beginner;
  return (
    <Link
      href={`/endgames/${guide.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/10 hover:bg-white/[0.04]"
    >
      {/* Illustration */}
      <div className="overflow-hidden">
        <div className="transition-transform duration-300 group-hover:scale-[1.02]">
          <EndgameIllustration id={guide.id} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colors.badge}`}
          >
            {guide.difficulty}
          </span>
          <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-stone-500">
            {guide.material}
          </span>
        </div>
        <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">
          {guide.name}
        </h3>
        <p className="text-xs leading-relaxed text-stone-400">
          {guide.tagline}
        </p>
      </div>
    </Link>
  );
}

/* ── Hero SVG for endgames index ── */
function EndgameHeroArt() {
  return (
    <svg viewBox="0 0 800 220" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="eh-bg"
          x1="0"
          y1="0"
          x2="800"
          y2="220"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#081218" />
          <stop offset="0.5" stopColor="#0c1220" />
          <stop offset="1" stopColor="#14100a" />
        </linearGradient>
        <radialGradient
          id="eh-g1"
          cx="133"
          cy="110"
          r="160"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.18" />
          <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="eh-g2"
          cx="400"
          cy="110"
          r="160"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#60a5fa" stopOpacity="0.15" />
          <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="eh-g3"
          cx="667"
          cy="110"
          r="160"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.16" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="eh-f">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="800" height="220" fill="url(#eh-bg)" />
      <rect width="800" height="220" fill="url(#eh-g1)" />
      <rect width="800" height="220" fill="url(#eh-g2)" />
      <rect width="800" height="220" fill="url(#eh-g3)" />

      {/* Minimal board grid */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
        <line
          key={c}
          x1={30 + c * 92}
          y1="20"
          x2={30 + c * 92}
          y2="200"
          stroke="#1e293b"
          strokeWidth="0.5"
          strokeOpacity="0.5"
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((r) => (
        <line
          key={r}
          x1="30"
          y1={20 + r * 36}
          x2="766"
          y2={20 + r * 36}
          stroke="#1e293b"
          strokeWidth="0.5"
          strokeOpacity="0.4"
        />
      ))}

      {/* LEFT: King and pawn — king leads pawn up */}
      {/* Promotion hint */}
      <rect
        x={30}
        y={20}
        width={92}
        height={36}
        fill="#22c55e"
        fillOpacity="0.12"
      />
      <text
        x={76}
        y={43}
        textAnchor="middle"
        fill="#22c55e"
        fillOpacity="0.55"
        fontSize="18"
      >
        ♕
      </text>

      {/* White King leading */}
      <rect
        x={124}
        y={44}
        width={3}
        height={6}
        fill="#22c55e"
        fillOpacity={0.9}
      />
      <rect
        x={121}
        y={46}
        width={9}
        height={3}
        fill="#22c55e"
        fillOpacity={0.9}
      />
      <circle cx={127} cy={56} r={8} fill="#22c55e" fillOpacity={0.82} />
      <path
        d="M121,63 L117,76 Q127,81 137,76 L133,63 Z"
        fill="#22c55e"
        fillOpacity={0.78}
      />
      <ellipse
        cx={127}
        cy={78}
        rx={12}
        ry={4}
        fill="#22c55e"
        fillOpacity={0.72}
      />
      <circle
        cx={127}
        cy={62}
        r={22}
        fill="#22c55e"
        fillOpacity="0.08"
        filter="url(#eh-f)"
      />

      {/* Pawn on e6 */}
      <circle cx={127} cy={130} r={7} fill="#22c55e" fillOpacity={0.72} />
      <path
        d="M121,137 L117,152 Q127,158 137,152 L133,137 Z"
        fill="#22c55e"
        fillOpacity={0.67}
      />
      <ellipse
        cx={127}
        cy={154}
        rx={11}
        ry={3.5}
        fill="#22c55e"
        fillOpacity={0.62}
      />

      {/* Path arrow */}
      <path
        d="M127,120 Q127,100 127,90"
        fill="none"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeOpacity="0.35"
        strokeDasharray="4 4"
      />

      {/* MIDDLE: Rook endgame — the bridge */}
      {/* Rook on 4th file, 5th rank */}
      <rect
        x={364}
        y={116}
        width={5}
        height={4}
        rx={1}
        fill="#60a5fa"
        fillOpacity={0.88}
      />
      <rect
        x={368}
        y={116}
        width={5}
        height={4}
        rx={1}
        fill="#60a5fa"
        fillOpacity={0.88}
      />
      <rect
        x={372}
        y={116}
        width={5}
        height={4}
        rx={1}
        fill="#60a5fa"
        fillOpacity={0.88}
      />
      <rect
        x={361}
        y={119}
        width={18}
        height={15}
        rx={2}
        fill="#60a5fa"
        fillOpacity={0.82}
      />
      <ellipse
        cx={370}
        cy={135}
        rx={12}
        ry={3.5}
        fill="#60a5fa"
        fillOpacity={0.75}
      />
      <circle
        cx={370}
        cy={126}
        r={24}
        fill="#60a5fa"
        fillOpacity="0.08"
        filter="url(#eh-f)"
      />

      {/* King on 7th — just promoted */}
      <rect
        x={429}
        y={80}
        width={3}
        height={6}
        fill="#60a5fa"
        fillOpacity={0.85}
      />
      <rect
        x={426}
        y={82}
        width={9}
        height={3}
        fill="#60a5fa"
        fillOpacity={0.85}
      />
      <circle cx={432} cy={92} r={8} fill="#60a5fa" fillOpacity={0.77} />
      <path
        d="M426,99 L422,112 Q432,117 442,112 L438,99 Z"
        fill="#60a5fa"
        fillOpacity={0.73}
      />
      <ellipse
        cx={432}
        cy={114}
        rx={12}
        ry={4}
        fill="#60a5fa"
        fillOpacity={0.67}
      />

      {/* Pawn on 7th rank */}
      <circle cx={432} cy={47} r={7} fill="#60a5fa" fillOpacity={0.72} />
      <path
        d="M426,54 L422,69 Q432,75 442,69 L438,54 Z"
        fill="#60a5fa"
        fillOpacity={0.67}
      />
      <ellipse
        cx={432}
        cy={71}
        rx={11}
        ry={3.5}
        fill="#60a5fa"
        fillOpacity={0.62}
      />

      {/* Black rook checking */}
      <rect
        x={307}
        y={152}
        width={5}
        height={4}
        rx={1}
        fill="#e2e8f0"
        fillOpacity={0.45}
      />
      <rect
        x={311}
        y={152}
        width={5}
        height={4}
        rx={1}
        fill="#e2e8f0"
        fillOpacity={0.45}
      />
      <rect
        x={315}
        y={152}
        width={5}
        height={4}
        rx={1}
        fill="#e2e8f0"
        fillOpacity={0.45}
      />
      <rect
        x={304}
        y={155}
        width={18}
        height={15}
        rx={2}
        fill="#e2e8f0"
        fillOpacity={0.38}
      />
      <ellipse
        cx={313}
        cy={171}
        rx={12}
        ry={3.5}
        fill="#e2e8f0"
        fillOpacity={0.35}
      />
      <line
        x1="324"
        y1="162"
        x2="358"
        y2="162"
        stroke="#ef4444"
        strokeWidth="1.2"
        strokeOpacity="0.35"
        strokeDasharray="4 3"
      />

      {/* RIGHT: Opposition kings facing each other */}
      {/* White king */}
      <rect
        x={595}
        y={92}
        width={3}
        height={6}
        fill="#f59e0b"
        fillOpacity={0.9}
      />
      <rect
        x={592}
        y={94}
        width={9}
        height={3}
        fill="#f59e0b"
        fillOpacity={0.9}
      />
      <circle cx={598} cy={104} r={9} fill="#f59e0b" fillOpacity={0.83} />
      <path
        d="M592,112 L587,126 Q598,132 609,126 L604,112 Z"
        fill="#f59e0b"
        fillOpacity={0.78}
      />
      <ellipse
        cx={598}
        cy={128}
        rx={13}
        ry={4.5}
        fill="#f59e0b"
        fillOpacity={0.72}
      />
      <circle
        cx={598}
        cy={110}
        r={28}
        fill="#f59e0b"
        fillOpacity="0.08"
        filter="url(#eh-f)"
      />

      {/* Black king */}
      <rect
        x={687}
        y={92}
        width={3}
        height={6}
        fill="#94a3b8"
        fillOpacity={0.75}
      />
      <rect
        x={684}
        y={94}
        width={9}
        height={3}
        fill="#94a3b8"
        fillOpacity={0.75}
      />
      <circle cx={690} cy={104} r={9} fill="#94a3b8" fillOpacity={0.67} />
      <path
        d="M684,112 L679,126 Q690,132 701,126 L696,112 Z"
        fill="#94a3b8"
        fillOpacity={0.62}
      />
      <ellipse
        cx={690}
        cy={128}
        rx={13}
        ry={4.5}
        fill="#94a3b8"
        fillOpacity={0.57}
      />

      {/* Opposition gap square glowing */}
      <rect
        x={613}
        y={92}
        width={72}
        height={72}
        fill="#f59e0b"
        fillOpacity="0.07"
      />

      {/* Mutual tension */}
      <line
        x1="614"
        y1="110"
        x2="679"
        y2="110"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />

      {/* Section labels */}
      <text
        x={127}
        y={210}
        textAnchor="middle"
        fill="#22c55e"
        fillOpacity="0.4"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        KING &amp; PAWN
      </text>
      <text
        x={400}
        y={210}
        textAnchor="middle"
        fill="#60a5fa"
        fillOpacity="0.4"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        ROOK ENDGAME
      </text>
      <text
        x={644}
        y={210}
        textAnchor="middle"
        fill="#f59e0b"
        fillOpacity="0.4"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        OPPOSITION
      </text>
    </svg>
  );
}
