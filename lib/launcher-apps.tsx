/**
 * Launcher App Registry
 *
 * All available apps for the iPad launcher.
 * Icons are render functions so the same SVG can be sized for grid vs dock.
 * Backgrounds use flat solid colours (iOS-style) rather than gradients.
 */

export type AppDef = {
  id: string;
  label: string;
  /** Tailwind bg utility class for the icon tile */
  bg: string;
  /** Subtle glow colour for hover/active shadows */
  glow: string;
  /** Legacy gradient string kept for page.tsx compatibility */
  gradient: string;
  href: string;
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
  /*  Analyze  */
  {
    id: "analyze",
    label: "Analyze",
    href: "/",
    bg: "bg-[#16653a]",
    glow: "rgba(16,185,129,0.5)",
    gradient: "from-emerald-600 to-emerald-800",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M7 20 L17 20 L16 17 C15.5 15 14 13.5 13 13 L13 11 C14.5 10 16 8.5 15 6 C14 3.5 11 2.5 9 3.5 C7 4.5 6.5 7 7 9 C7.5 11 9 11.5 9 11.5 L8.5 13 C7.5 13.5 6.5 15.5 6.5 17 Z" fill="rgba(255,255,255,0.9)" />
        <circle cx="16.5" cy="9.5" r="4" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" />
        <path d="M19.3 12.3 L22 15" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" />
        <path d="M15 8.5 L16 9.8 L18.2 7.8" stroke="rgba(170,255,200,0.9)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  /*  My Openings  */
  {
    id: "my-openings",
    label: "My Openings",
    href: "/my-openings",
    bg: "bg-[#0c5f9e]",
    glow: "rgba(14,165,233,0.5)",
    gradient: "from-sky-600 to-blue-800",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M3 6.5 Q3 5 5 5 L11.3 5.5 L11.3 20 L5 19.5 Q3 19.5 3 18 Z" fill="rgba(255,255,255,0.9)" />
        <path d="M12.7 5.5 L19 5 Q21 5 21 6.5 L21 18 Q21 19.5 19 19.5 L12.7 20 Z" fill="rgba(255,255,255,0.72)" />
        <path d="M12 5 L12 20" stroke="rgba(0,50,130,0.3)" strokeWidth="1.5" />
        <line x1="5.5" y1="9" x2="10.5" y2="9" stroke="rgba(0,50,130,0.55)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="5.5" y1="11.5" x2="10.5" y2="11.5" stroke="rgba(0,50,130,0.4)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5.5" y1="14" x2="8.5" y2="14" stroke="rgba(0,50,130,0.3)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M15 10.5 L13.5 13.5 H15.5 L13.5 18 L20 12 H17.5 Z" fill="rgba(30,100,220,0.85)" />
      </svg>
    ),
  },
  /*  Chaos Chess  */
  {
    id: "chaos",
    label: "Chaos Chess",
    href: "/chaos",
    bg: "bg-[#5b21b6]",
    glow: "rgba(168,85,247,0.55)",
    gradient: "from-purple-700 to-fuchsia-800",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M3 17.5 H21 L19.5 12.5 L15.5 7.5 L12 12.5 L8.5 7.5 L4.5 12.5 Z" fill="rgba(255,255,255,0.9)" />
        <circle cx="4.5" cy="6.5" r="2" fill="rgba(220,180,255,0.9)" />
        <circle cx="12" cy="4.5" r="2.4" fill="rgba(240,210,255,1)" />
        <circle cx="19.5" cy="6.5" r="2" fill="rgba(220,180,255,0.9)" />
        <rect x="3" y="17.5" width="18" height="2.5" rx="1.2" fill="rgba(255,255,255,0.55)" />
        <path d="M14 2 L10.5 10.5 H13.5 L10 22 L18.5 9.5 H15 Z" fill="rgba(255,240,50,0.95)" stroke="rgba(255,255,150,0.4)" strokeWidth="0.4" />
      </svg>
    ),
  },
  /*  Train  */
  {
    id: "train",
    label: "Train",
    href: "/train",
    bg: "bg-[#b45309]",
    glow: "rgba(245,158,11,0.5)",
    gradient: "from-amber-600 to-orange-800",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <circle cx="12" cy="12" r="9.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" fill="none" />
        <circle cx="12" cy="12" r="5.8" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" fill="none" />
        <circle cx="12" cy="12" r="2.6" fill="rgba(255,255,255,0.95)" />
        <line x1="12" y1="12" x2="20" y2="4" stroke="rgba(255,220,80,0.9)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M17 2.5 L22 2.5 L22 7.5" stroke="rgba(255,220,80,0.9)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  /*  Openings Explorer  */
  {
    id: "openings",
    label: "Openings",
    href: "/openings",
    bg: "bg-[#1d4ed8]",
    glow: "rgba(59,130,246,0.5)",
    gradient: "from-blue-700 to-blue-900",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <rect x="2.5" y="2.5" width="19" height="19" rx="2" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <rect x="2.5" y="2.5" width="4.75" height="4.75" fill="rgba(255,255,255,0.72)" />
        <rect x="11.87" y="2.5" width="4.75" height="4.75" fill="rgba(255,255,255,0.72)" />
        <rect x="7.12" y="7.25" width="4.75" height="4.75" fill="rgba(255,255,255,0.72)" />
        <rect x="16.75" y="7.25" width="4.75" height="4.75" fill="rgba(255,255,255,0.72)" />
        <rect x="2.5" y="12" width="4.75" height="4.75" fill="rgba(255,255,255,0.72)" />
        <rect x="11.87" y="12" width="4.75" height="4.75" fill="rgba(255,255,255,0.72)" />
        <rect x="7.12" y="16.75" width="4.75" height="4.75" fill="rgba(255,255,255,0.72)" />
        <rect x="16.75" y="16.75" width="4.75" height="4.75" fill="rgba(255,255,255,0.72)" />
        <circle cx="12" cy="12" r="3.8" fill="rgba(99,179,255,0.95)" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
      </svg>
    ),
  },
  /*  Leaderboard  */
  {
    id: "leaderboard",
    label: "Leaderboard",
    href: "/leaderboard",
    bg: "bg-[#92400e]",
    glow: "rgba(234,179,8,0.55)",
    gradient: "from-yellow-700 to-amber-800",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M7.5 2.5 H16.5 L15.5 10.5 C15.5 13.5 14 15.5 12 15.5 C10 15.5 8.5 13.5 8.5 10.5 Z" fill="rgba(255,220,50,0.95)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
        <path d="M7.5 5 C5.5 5 4.5 6 4.5 8.5 C4.5 10.5 6 12 8 11.5" fill="none" stroke="rgba(255,210,40,0.75)" strokeWidth="2" strokeLinecap="round" />
        <path d="M16.5 5 C18.5 5 19.5 6 19.5 8.5 C19.5 10.5 18 12 16 11.5" fill="none" stroke="rgba(255,210,40,0.75)" strokeWidth="2" strokeLinecap="round" />
        <path d="M10.5 15.5 L10 19 H9 L9 21 H15 L15 19 H14 L13.5 15.5 Z" fill="rgba(255,255,255,0.75)" />
        <rect x="8" y="21" width="8" height="1.5" rx="0.7" fill="rgba(255,255,255,0.5)" />
        <path d="M12 5.5 L13 8.5 H16 L13.5 10.2 L14.5 13.2 L12 11.5 L9.5 13.2 L10.5 10.2 L8 8.5 H11 Z" fill="rgba(255,255,255,0.9)" />
      </svg>
    ),
  },
  /*  Dungeon  */
  {
    id: "dungeon",
    label: "Dungeon",
    href: "/dungeon",
    bg: "bg-[#7f1d1d]",
    glow: "rgba(220,38,38,0.55)",
    gradient: "from-red-800 to-red-950",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <rect x="2" y="3" width="4.5" height="9" fill="rgba(255,255,255,0.65)" rx="0.5" />
        <rect x="17.5" y="3" width="4.5" height="9" fill="rgba(255,255,255,0.65)" rx="0.5" />
        <rect x="2" y="3" width="1.5" height="3" fill="rgba(255,255,255,0.45)" />
        <rect x="5" y="3" width="1.5" height="3" fill="rgba(255,255,255,0.45)" />
        <rect x="17.5" y="3" width="1.5" height="3" fill="rgba(255,255,255,0.45)" />
        <rect x="20.5" y="3" width="1.5" height="3" fill="rgba(255,255,255,0.45)" />
        <rect x="6.5" y="9" width="11" height="13" rx="0.5" fill="rgba(255,255,255,0.5)" />
        <path d="M9.5 22 L9.5 14.5 Q9.5 12 12 12 Q14.5 12 14.5 14.5 L14.5 22 Z" fill="rgba(120,0,0,0.9)" />
        <circle cx="12" cy="16.5" r="2.8" fill="rgba(255,200,200,0.85)" />
        <circle cx="11" cy="16" r="0.75" fill="rgba(100,0,0,0.9)" />
        <circle cx="13" cy="16" r="0.75" fill="rgba(100,0,0,0.9)" />
        <path d="M10.8 18 C10.8 17.4 13.2 17.4 13.2 18" stroke="rgba(100,0,0,0.8)" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  /*  Roast  */
  {
    id: "roast",
    label: "Roast",
    href: "/roast",
    bg: "bg-[#c2410c]",
    glow: "rgba(249,115,22,0.55)",
    gradient: "from-orange-700 to-red-800",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M12 1 C8 6 6 10 8.5 14 C9.5 15.8 11 15.8 11 14 C11 16.5 11.5 19.5 12 21 C12.5 19.5 13 16.5 13 14 C13 15.8 14.5 15.8 15.5 14 C18 10 16 6 12 1 Z" fill="rgba(255,175,30,0.97)" />
        <path d="M12 6 C10.5 9.5 10.5 15 12 18 C13.5 15 13.5 9.5 12 6 Z" fill="rgba(255,40,0,0.97)" />
        <ellipse cx="12" cy="22" rx="5.5" ry="1.5" fill="rgba(255,100,0,0.25)" />
      </svg>
    ),
  },
  /*  Guess ELO  */
  {
    id: "guess-elo",
    label: "Guess ELO",
    href: "/guess",
    bg: "bg-[#4c1d95]",
    glow: "rgba(139,92,246,0.55)",
    gradient: "from-violet-800 to-purple-950",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <rect x="2" y="15.5" width="5" height="7" rx="1.2" fill="rgba(180,150,255,0.65)" />
        <rect x="9.5" y="10.5" width="5" height="12" rx="1.2" fill="rgba(200,170,255,0.85)" />
        <rect x="17" y="13" width="5" height="9.5" rx="1.2" fill="rgba(180,150,255,0.65)" />
        <circle cx="4.5" cy="13.5" r="2" fill="rgba(180,150,255,0.55)" />
        <circle cx="12" cy="8.5" r="2" fill="rgba(220,200,255,0.9)" />
        <circle cx="19.5" cy="11" r="2" fill="rgba(180,150,255,0.55)" />
        <path d="M4.5 13.5 L12 8.5 L19.5 11" stroke="rgba(200,170,255,0.6)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M10.5 6.5 L12 3 L13.5 6.5" stroke="rgba(255,220,80,0.8)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="10.5" y1="6" x2="13.5" y2="6" stroke="rgba(255,220,80,0.8)" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  /*  Changelog  */
  {
    id: "changelog",
    label: "Changelog",
    href: "/changelog",
    bg: "bg-[#0e7490]",
    glow: "rgba(6,182,212,0.5)",
    gradient: "from-cyan-700 to-teal-800",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M5 3.5 Q5 2 7 2 L16 2 L20.5 6.5 L20.5 21 Q20.5 22.5 18.5 22.5 L7 22.5 Q5 22.5 5 21 Z" fill="rgba(255,255,255,0.88)" />
        <path d="M16 2 L16 6.5 L20.5 6.5" fill="rgba(0,100,130,0.25)" stroke="rgba(0,100,140,0.3)" strokeWidth="0.8" />
        <line x1="8" y1="10" x2="17" y2="10" stroke="rgba(0,70,120,0.55)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="8" y1="13" x2="17" y2="13" stroke="rgba(0,70,120,0.4)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="16" x2="14" y2="16" stroke="rgba(0,70,120,0.35)" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="8" y="18.5" width="9" height="2.8" rx="1.4" fill="rgba(6,182,212,0.9)" />
        <text x="9.2" y="20.6" fontSize="2.8" fill="rgba(255,255,255,0.95)" fontFamily="sans-serif" fontWeight="bold" letterSpacing="0.4">NEW</text>
      </svg>
    ),
  },
  /*  Pricing  */
  {
    id: "pricing",
    label: "Pricing",
    href: "/pricing",
    bg: "bg-[#9d174d]",
    glow: "rgba(236,72,153,0.5)",
    gradient: "from-pink-800 to-rose-950",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M12 2 L20.5 5.5 L20.5 12 C20.5 17.5 16.5 21 12 22.5 C7.5 21 3.5 17.5 3.5 12 L3.5 5.5 Z" fill="rgba(255,255,255,0.88)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
        <path d="M12 6.5 L13.5 11 H18 L14.5 13.5 L16 18 L12 15.5 L8 18 L9.5 13.5 L6 11 H10.5 Z" fill="rgba(180,0,70,0.9)" />
      </svg>
    ),
  },
  /*  About  */
  {
    id: "about",
    label: "About",
    href: "/about",
    bg: "bg-[#374151]",
    glow: "rgba(100,116,139,0.45)",
    gradient: "from-slate-600 to-slate-800",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <circle cx="12" cy="12" r="9.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" fill="rgba(255,255,255,0.06)" />
        <circle cx="12" cy="8" r="2" fill="rgba(255,255,255,0.95)" />
        <rect x="10.75" y="11.5" width="2.5" height="7" rx="1.25" fill="rgba(255,255,255,0.9)" />
      </svg>
    ),
  },
  /*  Blog  */
  {
    id: "blog",
    label: "Blog",
    href: "/blog",
    bg: "bg-[#065f46]",
    glow: "rgba(16,185,129,0.45)",
    gradient: "from-emerald-800 to-teal-900",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <rect x="2.5" y="3.5" width="19" height="17" rx="2.5" fill="rgba(255,255,255,0.88)" />
        <rect x="5" y="6" width="7" height="5.5" rx="1" fill="rgba(6,150,100,0.45)" />
        <path d="M5 9.5 L7 8 L9 10.5 L10.5 9 L12 11.5 L5 11.5 Z" fill="rgba(6,150,100,0.7)" />
        <line x1="14" y1="7" x2="19.5" y2="7" stroke="rgba(0,60,80,0.55)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="14" y1="9.5" x2="19.5" y2="9.5" stroke="rgba(0,60,80,0.4)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5" y1="14" x2="19.5" y2="14" stroke="rgba(0,60,80,0.35)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5" y1="16.5" x2="19.5" y2="16.5" stroke="rgba(0,60,80,0.3)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5" y1="19" x2="14" y2="19" stroke="rgba(0,60,80,0.25)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  /*  Support  */
  {
    id: "support",
    label: "Support",
    href: "/support",
    bg: "bg-[#1e3a8a]",
    glow: "rgba(59,130,246,0.5)",
    gradient: "from-blue-900 to-indigo-950",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M12 3 C7 3 4 6.5 4 11 L4 14.5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M12 3 C17 3 20 6.5 20 11 L20 14.5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="2.5" y="12.5" width="4" height="6.5" rx="2" fill="rgba(255,255,255,0.88)" />
        <rect x="17.5" y="12.5" width="4" height="6.5" rx="2" fill="rgba(255,255,255,0.88)" />
        <path d="M21.5 17 C21.5 20 19.5 21.5 17" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="16.5" cy="21.5" r="1.3" fill="rgba(255,255,255,0.75)" />
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
