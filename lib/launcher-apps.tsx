/**
 * Launcher App Registry
 *
 * All available apps for the iPad launcher.
 * Icons are render functions so the same SVG can be sized for grid (h-7 w-7) vs dock (h-6 w-6).
 */

export type AppDef = {
  id: string;
  label: string;
  href: string;
  gradient: string;
  glow: string;
  icon: (className: string) => React.ReactNode;
};

export type LauncherConfig = {
  /** Ordered list of app IDs shown in the main grid (max 10) */
  grid: string[];
  /** Ordered list of app IDs shown in the dock (max 4) */
  dock: string[];
};

export const DEFAULT_LAUNCHER: LauncherConfig = {
  grid: [
    "my-openings",
    "chaos",
    "train",
    "openings",
    "leaderboard",
    "dungeon",
    "roast",
    "guess-elo",
    "changelog",
    "pricing",
  ],
  dock: ["analyze", "chaos", "my-openings", "train"],
};

export const LAUNCHER_APPS: AppDef[] = [
  /* ── Analyze (home scanner) ─────────────────────────────── */
  {
    id: "analyze",
    label: "Analyze",
    href: "/",
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <circle
          cx="10.5"
          cy="10.5"
          r="6.5"
          fill="rgba(255,255,255,0.12)"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.8"
        />
        <path
          d="M15.5 15.5 L20.5 20.5"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M8 10.5 L10 12.5 L13.5 8.5"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  },

  /* ── My Openings ─────────────────────────────────────────── */
  {
    id: "my-openings",
    label: "My Openings",
    href: "/my-openings",
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <circle cx="4" cy="12" r="2.2" fill="rgba(255,255,255,0.95)" />
        <line x1="6.2" y1="12" x2="9.5" y2="7" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="6.2" y1="12" x2="9.5" y2="17" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="11.5" cy="7" r="2" fill="rgba(255,255,255,0.9)" />
        <circle cx="11.5" cy="17" r="2" fill="rgba(255,255,255,0.9)" />
        <line x1="13.5" y1="7" x2="17" y2="4.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="13.5" y1="7" x2="17" y2="9.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="18.5" cy="4.5" r="1.6" fill="rgba(255,255,255,0.7)" />
        <circle cx="18.5" cy="9.5" r="1.6" fill="rgba(255,255,255,0.7)" />
        <line x1="13.5" y1="17" x2="17" y2="14.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="13.5" y1="17" x2="17" y2="19.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="18.5" cy="14.5" r="1.6" fill="rgba(255,255,255,0.55)" />
        <circle cx="18.5" cy="19.5" r="1.6" fill="rgba(255,255,255,0.55)" />
      </svg>
    ),
  },

  /* ── Chaos Chess ─────────────────────────────────────────── */
  {
    id: "chaos",
    label: "Chaos Chess",
    href: "/chaos",
    gradient: "from-purple-600 to-fuchsia-600",
    glow: "rgba(168,85,247,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path
          d="M3 16 H21 L19.5 11.5 L16 7 L12 12 L8 7 L4.5 11.5 Z"
          fill="rgba(255,255,255,0.88)"
        />
        <circle cx="4.5" cy="6.5" r="1.8" fill="rgba(255,220,255,0.9)" />
        <circle cx="12" cy="4.5" r="2.2" fill="rgba(255,230,255,1)" />
        <circle cx="19.5" cy="6.5" r="1.8" fill="rgba(255,220,255,0.9)" />
        <rect x="3" y="17" width="18" height="2.5" rx="1.2" fill="rgba(255,255,255,0.6)" />
        <path
          d="M13.5 2.5 L10.5 9.5 H13 L10 17 L17.5 8 H14.5 Z"
          fill="rgba(255,240,80,0.92)"
          stroke="rgba(255,255,150,0.4)"
          strokeWidth="0.4"
        />
      </svg>
    ),
  },

  /* ── Train ───────────────────────────────────────────────── */
  {
    id: "train",
    label: "Train",
    href: "/train",
    gradient: "from-amber-500 to-orange-600",
    glow: "rgba(245,158,11,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <rect x="1.5" y="9.5" width="4" height="5" rx="1.5" fill="rgba(255,255,255,0.9)" />
        <rect x="18.5" y="9.5" width="4" height="5" rx="1.5" fill="rgba(255,255,255,0.9)" />
        <rect x="3.5" y="8" width="2.5" height="8" rx="1.2" fill="rgba(255,255,255,0.75)" />
        <rect x="18" y="8" width="2.5" height="8" rx="1.2" fill="rgba(255,255,255,0.75)" />
        <rect x="6" y="11" width="12" height="2" rx="1" fill="rgba(255,255,255,0.6)" />
      </svg>
    ),
  },

  /* ── Openings ─────────────────────────────────────────────── */
  {
    id: "openings",
    label: "Openings",
    href: "/openings",
    gradient: "from-sky-500 to-blue-600",
    glow: "rgba(14,165,233,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M3 5 Q3 4 4.5 4 L11 4.5 L11 20 L4.5 20 Q3 20 3 19 Z" fill="rgba(255,255,255,0.9)" />
        <path d="M13 4.5 L19.5 4 Q21 4 21 5 L21 19 Q21 20 19.5 20 L13 20 Z" fill="rgba(255,255,255,0.78)" />
        <path d="M12 4 L12 20" stroke="rgba(0,60,140,0.35)" strokeWidth="2" />
        <line x1="5" y1="8" x2="10" y2="8" stroke="rgba(10,60,150,0.6)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="5" y1="11" x2="10" y2="11" stroke="rgba(10,60,150,0.5)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5" y1="14" x2="8.5" y2="14" stroke="rgba(10,60,150,0.4)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5" y1="17" x2="9" y2="17" stroke="rgba(10,60,150,0.35)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M15.5 9 L14 12 H16 L14 17 L19 11 H16.5 Z" fill="rgba(14,60,160,0.75)" />
      </svg>
    ),
  },

  /* ── Leaderboard ──────────────────────────────────────────── */
  {
    id: "leaderboard",
    label: "Leaderboard",
    href: "/leaderboard",
    gradient: "from-yellow-500 to-amber-600",
    glow: "rgba(234,179,8,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path
          d="M7 3 H17 L16 10 C16 13 14.5 14.5 12 14.5 C9.5 14.5 8 13 8 10 Z"
          fill="rgba(255,255,255,0.92)"
        />
        <path
          d="M7 5 C5 5 4 6 4 8 C4 10 5.5 11 7.5 10.5"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M17 5 C19 5 20 6 20 8 C20 10 18.5 11 16.5 10.5"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M10.5 14.5 L10 18 H9 L9 20 H15 L15 18 H14 L13.5 14.5 Z" fill="rgba(255,255,255,0.75)" />
        <rect x="8" y="20" width="8" height="1.5" rx="0.75" fill="rgba(255,255,255,0.6)" />
        <path d="M10 7.5 L11.2 6 L12 8.5 L13.5 6 L14 8 L12 9.5 Z" fill="rgba(250,200,0,0.85)" />
      </svg>
    ),
  },

  /* ── Dungeon ──────────────────────────────────────────────── */
  {
    id: "dungeon",
    label: "Dungeon",
    href: "/dungeon",
    gradient: "from-red-600 to-rose-700",
    glow: "rgba(220,38,38,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path
          d="M12 3 C8 3 5.5 6 5.5 9.5 C5.5 12.5 7 14 8 14.5 L8 16.5 H16 L16 14.5 C17 14 18.5 12.5 18.5 9.5 C18.5 6 16 3 12 3 Z"
          fill="rgba(255,255,255,0.88)"
        />
        <circle cx="9.5" cy="10" r="1.8" fill="rgba(180,0,0,0.7)" />
        <circle cx="14.5" cy="10" r="1.8" fill="rgba(180,0,0,0.7)" />
        <path d="M10.5 13.5 C10.5 12.5 13.5 12.5 13.5 13.5" stroke="rgba(180,0,0,0.6)" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="9" y="16.5" width="2" height="1.8" rx="0.5" fill="rgba(255,255,255,0.55)" />
        <rect x="13" y="16.5" width="2" height="1.8" rx="0.5" fill="rgba(255,255,255,0.55)" />
        <line x1="3" y1="21" x2="21" y2="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="21" y1="21" x2="3" y2="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },

  /* ── Roast ────────────────────────────────────────────────── */
  {
    id: "roast",
    label: "Roast",
    href: "/roast",
    gradient: "from-orange-500 to-red-600",
    glow: "rgba(249,115,22,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path
          d="M12 2 C9 6 7 9 8.5 12.5 C9.2 14 10.5 14 10.5 12.5 C10.5 14.5 11 17 12 18.5 C13 17 13.5 14.5 13.5 12.5 C13.5 14 14.8 14 15.5 12.5 C17 9 15 6 12 2 Z"
          fill="rgba(255,190,50,0.95)"
        />
        <path d="M12 8 C11 10.5 11.2 14 12 16 C12.8 14 13 10.5 12 8 Z" fill="rgba(255,60,10,0.95)" />
        <ellipse cx="12" cy="20.5" rx="5" ry="1.5" fill="rgba(255,255,255,0.18)" />
      </svg>
    ),
  },

  /* ── Guess ELO ────────────────────────────────────────────── */
  {
    id: "guess-elo",
    label: "Guess ELO",
    href: "/guess",
    gradient: "from-violet-600 to-purple-700",
    glow: "rgba(124,58,237,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <rect x="3" y="16" width="3" height="5" rx="1" fill="rgba(255,255,255,0.5)" />
        <rect x="7.5" y="12" width="3" height="9" rx="1" fill="rgba(255,255,255,0.65)" />
        <rect x="12" y="14" width="3" height="7" rx="1" fill="rgba(255,255,255,0.5)" />
        <circle cx="17" cy="9" r="5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
        <path d="M21 13 L23.5 15.5" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" />
        <path
          d="M15.5 7.5 C16 6 17.5 5.5 19 6.5"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    ),
  },

  /* ── Changelog ────────────────────────────────────────────── */
  {
    id: "changelog",
    label: "Changelog",
    href: "/changelog",
    gradient: "from-cyan-500 to-blue-600",
    glow: "rgba(6,182,212,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path
          d="M5 4 Q5 2.5 6.5 2.5 L16 2.5 Q18 2.5 18 4.5 L18 19.5 Q18 21 16.5 21 L6.5 21 Q5 21 5 19.5 Z"
          fill="rgba(255,255,255,0.88)"
        />
        <line x1="8" y1="7" x2="15" y2="7" stroke="rgba(0,70,160,0.55)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="8" y1="10" x2="15" y2="10" stroke="rgba(0,70,160,0.45)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="13" x2="12" y2="13" stroke="rgba(0,70,160,0.4)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="17" cy="18" r="6" fill="rgba(6,182,212,0.95)" />
        <path
          d="M17 14.5 L17 17 L19 17"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M20.5 15 C19.5 13.5 18.3 13 17 13 C15 13 13.5 14.5 13.5 16.5"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    ),
  },

  /* ── Pricing ──────────────────────────────────────────────── */
  {
    id: "pricing",
    label: "Pricing",
    href: "/pricing",
    gradient: "from-pink-500 to-rose-600",
    glow: "rgba(236,72,153,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <polygon points="12,3 20,9 17,21 7,21 4,9" fill="rgba(255,255,255,0.88)" />
        <polygon points="12,3 20,9 12,9 4,9" fill="rgba(255,255,255,0.3)" />
        <polygon points="12,9 20,9 17,21 12,15" fill="rgba(255,100,150,0.25)" />
        <polygon points="12,9 4,9 7,21 12,15" fill="rgba(255,150,180,0.2)" />
        <line x1="12" y1="3" x2="12" y2="21" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        <line x1="4" y1="9" x2="20" y2="9" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <polygon points="9,4.5 11,7 8,7" fill="rgba(255,255,255,0.55)" />
      </svg>
    ),
  },

  /* ── About ────────────────────────────────────────────────── */
  {
    id: "about",
    label: "About",
    href: "/about",
    gradient: "from-slate-500 to-slate-600",
    glow: "rgba(100,116,139,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" fill="rgba(255,255,255,0.08)" />
        <circle cx="12" cy="8.5" r="1.5" fill="rgba(255,255,255,0.9)" />
        <rect x="11" y="11.5" width="2" height="6.5" rx="1" fill="rgba(255,255,255,0.85)" />
      </svg>
    ),
  },

  /* ── Blog ─────────────────────────────────────────────────── */
  {
    id: "blog",
    label: "Blog",
    href: "/blog",
    gradient: "from-teal-500 to-cyan-600",
    glow: "rgba(20,184,166,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <rect x="3" y="4" width="18" height="16" rx="2.5" fill="rgba(255,255,255,0.85)" />
        <line x1="7" y1="9" x2="17" y2="9" stroke="rgba(0,80,120,0.6)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="7" y1="12" x2="17" y2="12" stroke="rgba(0,80,120,0.45)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="7" y1="15" x2="13" y2="15" stroke="rgba(0,80,120,0.35)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },

  /* ── Support ──────────────────────────────────────────────── */
  {
    id: "support",
    label: "Support",
    href: "/support",
    gradient: "from-indigo-500 to-blue-600",
    glow: "rgba(99,102,241,0.5)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" fill="rgba(255,255,255,0.08)" />
        <path
          d="M9 9.5 C9 7.5 15 7.5 15 9.5 C15 11 13.5 11.5 12.5 12.5 C12 13 12 13.5 12 14"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="12" cy="16.5" r="1.2" fill="rgba(255,255,255,0.9)" />
      </svg>
    ),
  },
];

/** Look up an app definition by ID. Returns undefined if not found. */
export function getAppById(id: string): AppDef | undefined {
  return LAUNCHER_APPS.find((a) => a.id === id);
}

/** All app IDs in the default config (grid + dock, deduped) */
export const ALL_DEFAULT_IDS = Array.from(
  new Set([...DEFAULT_LAUNCHER.grid, ...DEFAULT_LAUNCHER.dock]),
);
