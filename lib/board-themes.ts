/**
 * Board themes — cosmetic board colour schemes purchasable with coins.
 *
 * Each theme defines dark/light square colours for react-chessboard.
 * The active theme is stored in localStorage ("fc-board-theme").
 * The default green/cream theme is always available for free.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type BoardTheme = {
  id: string;
  name: string;
  /** Coin cost (0 = free / default) */
  price: number;
  darkSquare: string;
  lightSquare: string;
  /** Preview gradient for shop cards */
  preview: [string, string];
};

/* ------------------------------------------------------------------ */
/*  Theme catalogue                                                     */
/* ------------------------------------------------------------------ */

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: "classic",
    name: "Classic Green",
    price: 0,
    darkSquare: "#779952",
    lightSquare: "#edeed1",
    preview: ["#779952", "#edeed1"],
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    price: 50,
    darkSquare: "#4a7fb5",
    lightSquare: "#d4e4f7",
    preview: ["#4a7fb5", "#d4e4f7"],
  },
  {
    id: "midnight",
    name: "Midnight",
    price: 75,
    darkSquare: "#5c4b8a",
    lightSquare: "#c8bfe7",
    preview: ["#5c4b8a", "#c8bfe7"],
  },
  {
    id: "coral",
    name: "Coral Reef",
    price: 60,
    darkSquare: "#c0695d",
    lightSquare: "#f5ddd9",
    preview: ["#c0695d", "#f5ddd9"],
  },
  {
    id: "walnut",
    name: "Walnut Wood",
    price: 80,
    darkSquare: "#8b6c42",
    lightSquare: "#dbc5a0",
    preview: ["#8b6c42", "#dbc5a0"],
  },
  {
    id: "ice",
    name: "Ice Crystal",
    price: 100,
    darkSquare: "#6ba3be",
    lightSquare: "#e8f4f8",
    preview: ["#6ba3be", "#e8f4f8"],
  },
  {
    id: "royal",
    name: "Royal Burgundy",
    price: 120,
    darkSquare: "#8b2252",
    lightSquare: "#f2d7e3",
    preview: ["#8b2252", "#f2d7e3"],
  },
  {
    id: "neon",
    name: "Neon Hacker",
    price: 150,
    darkSquare: "#1a3a2a",
    lightSquare: "#0d1f15",
    preview: ["#1a3a2a", "#0d1f15"],
  },
  {
    id: "candy",
    name: "Cotton Candy",
    price: 90,
    darkSquare: "#b784a7",
    lightSquare: "#f3e0ee",
    preview: ["#b784a7", "#f3e0ee"],
  },
  {
    id: "ember",
    name: "Ember Glow",
    price: 200,
    darkSquare: "#c44536",
    lightSquare: "#f7e1bf",
    preview: ["#c44536", "#f7e1bf"],
  },
];

/* ------------------------------------------------------------------ */
/*  Profile titles                                                      */
/* ------------------------------------------------------------------ */

export type ProfileTitle = {
  id: string;
  name: string;
  price: number;
  /** Tailwind classes for the badge */
  badgeClass: string;
};

export const PROFILE_TITLES: ProfileTitle[] = [
  { id: "title-student",    name: "Chess Student",        price: 30,  badgeClass: "bg-slate-500/20 text-slate-300" },
  { id: "title-tactician",  name: "Tactician",            price: 50,  badgeClass: "bg-cyan-500/20 text-cyan-400" },
  { id: "title-strategist", name: "Strategist",           price: 75,  badgeClass: "bg-violet-500/20 text-violet-400" },
  { id: "title-analyst",    name: "Master Analyst",       price: 120, badgeClass: "bg-emerald-500/20 text-emerald-400" },
  { id: "title-scholar",    name: "Elite Scholar",        price: 200, badgeClass: "bg-amber-500/20 text-amber-400" },
  { id: "title-grandmaster",name: "Grandmaster",          price: 500, badgeClass: "bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300" },
];

/* ------------------------------------------------------------------ */
/*  Active selections (localStorage)                                    */
/* ------------------------------------------------------------------ */

const KEY_ACTIVE_THEME = "fc-board-theme";
const KEY_ACTIVE_TITLE = "fc-profile-title";

export function getActiveThemeId(): string {
  if (typeof window === "undefined") return "classic";
  return localStorage.getItem(KEY_ACTIVE_THEME) ?? "classic";
}

export function getActiveTheme(): BoardTheme {
  const id = getActiveThemeId();
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}

export function setActiveTheme(id: string): void {
  localStorage.setItem(KEY_ACTIVE_THEME, id);
  window.dispatchEvent(new CustomEvent("fc-theme-changed", { detail: id }));
}

export function getActiveTitleId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY_ACTIVE_TITLE) ?? null;
}

export function getActiveTitle(): ProfileTitle | null {
  const id = getActiveTitleId();
  if (!id) return null;
  return PROFILE_TITLES.find((t) => t.id === id) ?? null;
}

export function setActiveTitle(id: string | null): void {
  if (id) {
    localStorage.setItem(KEY_ACTIVE_TITLE, id);
  } else {
    localStorage.removeItem(KEY_ACTIVE_TITLE);
  }
  window.dispatchEvent(new CustomEvent("fc-title-changed", { detail: id }));
}

/**
 * Hook-friendly: returns the board styles object for react-chessboard.
 * Call this from components to get the current theme's styles.
 */
export function getBoardStyles(): {
  customDarkSquareStyle: React.CSSProperties;
  customLightSquareStyle: React.CSSProperties;
} {
  const theme = getActiveTheme();
  return {
    customDarkSquareStyle: { backgroundColor: theme.darkSquare },
    customLightSquareStyle: { backgroundColor: theme.lightSquare },
  };
}
