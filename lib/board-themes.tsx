import React from "react";

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

/* ================================================================== */
/*  Piece Themes (Lichess piece sets)                                   */
/* ================================================================== */

/**
 * Piece sets sourced from Lichess (github.com/lichess-org/lila).
 * SVGs served from GitHub raw CDN.
 * react-chessboard expects piece codes like "wP", "wN", "wB", "wR", "wQ", "wK",
 * "bP", "bN", "bB", "bR", "bQ", "bK" — which matches Lichess file naming exactly.
 */

const LICHESS_PIECE_CDN = "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece";

export type PieceTheme = {
  id: string;
  name: string;
  /** Coin cost (0 = free / default) */
  price: number;
  /** Lichess set folder name — used to build CDN URLs.  null = react-chessboard default */
  setName: string | null;
  /** Descriptive style tag */
  style: string;
};

export const PIECE_THEMES: PieceTheme[] = [
  { id: "piece-default", name: "Default",       price: 0,   setName: null,             style: "Classic" },
  { id: "piece-cburnett", name: "CBurnett",     price: 0,   setName: "cburnett",       style: "Standard" },
  { id: "piece-merida",  name: "Merida",         price: 20,  setName: "merida",         style: "Traditional" },
  { id: "piece-alpha",   name: "Alpha",          price: 20,  setName: "alpha",          style: "Clean" },
  { id: "piece-california", name: "California",  price: 35,  setName: "california",     style: "Modern" },
  { id: "piece-cardinal", name: "Cardinal",      price: 50,  setName: "cardinal",       style: "Elegant" },
  { id: "piece-staunty", name: "Staunty",        price: 35,  setName: "staunty",        style: "Classic" },
  { id: "piece-tatiana",  name: "Tatiana",        price: 55,  setName: "tatiana",        style: "Ornate" },
  { id: "piece-maestro",  name: "Maestro",        price: 75,  setName: "maestro",        style: "Bold" },
  { id: "piece-fresca",   name: "Fresca",         price: 40,  setName: "fresca",         style: "Minimal" },
  { id: "piece-gioco",    name: "Gioco",          price: 55,  setName: "gioco",          style: "Modern" },
  { id: "piece-governor", name: "Governor",       price: 80,  setName: "governor",       style: "Regal" },
  { id: "piece-kosal",    name: "Kosal",          price: 85,  setName: "kosal",          style: "Artistic" },
  { id: "piece-chessnut", name: "Chessnut",       price: 45,  setName: "chessnut",       style: "Chunky" },
  { id: "piece-companion", name: "Companion",     price: 50,  setName: "companion",      style: "Clean" },
  { id: "piece-pixel",    name: "Pixel",          price: 130, setName: "pixel",          style: "Retro" },
  { id: "piece-horsey",   name: "Horsey",         price: 150, setName: "horsey",         style: "Fun" },
  { id: "piece-anarcandy", name: "Anarcandy",     price: 140, setName: "anarcandy",      style: "Colorful" },
  { id: "piece-fantasy",  name: "Fantasy",         price: 100, setName: "fantasy",        style: "Decorative" },
  { id: "piece-spatial",  name: "Spatial",         price: 100, setName: "spatial",        style: "3D" },
  { id: "piece-celtic",   name: "Celtic",          price: 120, setName: "celtic",         style: "Ornate" },
  { id: "piece-dubrovny", name: "Dubrovny",        price: 120, setName: "dubrovny",       style: "Royal" },
  { id: "piece-shapes",   name: "Shapes",          price: 200, setName: "shapes",         style: "Abstract" },
  { id: "piece-letter",   name: "Letter",          price: 250, setName: "letter",         style: "Minimalist" },
];

/**
 * Build the URL for a specific piece image.
 * @param setName - Lichess set folder name
 * @param piece   - e.g. "wK", "bQ"
 */
export function getPieceImageUrl(setName: string, piece: string): string {
  return `${LICHESS_PIECE_CDN}/${setName}/${piece}.svg`;
}

/**
 * Generate the customPieces prop for react-chessboard.
 * Returns undefined (use defaults) when setName is null.
 */
export function getCustomPieces(
  setName: string | null,
): Record<string, ({ squareWidth }: { squareWidth: number }) => React.ReactElement> | undefined {
  if (!setName) return undefined;

  const pieces = ["wP", "wN", "wB", "wR", "wQ", "wK", "bP", "bN", "bB", "bR", "bQ", "bK"];
  const result: Record<string, ({ squareWidth }: { squareWidth: number }) => React.ReactElement> = {};

  for (const p of pieces) {
    const url = getPieceImageUrl(setName, p);
    result[p] = ({ squareWidth }: { squareWidth: number }) => (
      <div
        style={{
          width: squareWidth,
          height: squareWidth,
          backgroundImage: `url(${url})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />
    );
  }

  return result;
}

/* ─── Active piece theme (localStorage) ─── */

const KEY_ACTIVE_PIECE_THEME = "fc-piece-theme";

export function getActivePieceThemeId(): string {
  if (typeof window === "undefined") return "piece-default";
  return localStorage.getItem(KEY_ACTIVE_PIECE_THEME) ?? "piece-default";
}

export function getActivePieceTheme(): PieceTheme {
  const id = getActivePieceThemeId();
  return PIECE_THEMES.find((t) => t.id === id) ?? PIECE_THEMES[0];
}

export function setActivePieceTheme(id: string): void {
  localStorage.setItem(KEY_ACTIVE_PIECE_THEME, id);
  window.dispatchEvent(new CustomEvent("fc-piece-theme-changed", { detail: id }));
}

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

/* ================================================================== */
/*  Eval Bar Skins                                                      */
/* ================================================================== */

export type EvalBarSkin = {
  id: string;
  name: string;
  price: number;
  /** Gradient colours for the white (advantage) side */
  whiteGradient: [string, string];
  /** Gradient colours for the black (advantage) side */
  blackGradient: [string, string];
  /** Two colours for shop card preview swatch */
  preview: [string, string];
};

export const EVAL_BAR_SKINS: EvalBarSkin[] = [
  {
    id: "eval-default",
    name: "Classic",
    price: 0,
    whiteGradient: ["#f1f5f9", "#e2e8f0"],
    blackGradient: ["#1e293b", "#0f172a"],
    preview: ["#f1f5f9", "#1e293b"],
  },
  {
    id: "eval-emerald",
    name: "Emerald",
    price: 40,
    whiteGradient: ["#d1fae5", "#a7f3d0"],
    blackGradient: ["#064e3b", "#022c22"],
    preview: ["#d1fae5", "#064e3b"],
  },
  {
    id: "eval-amber",
    name: "Amber Gold",
    price: 60,
    whiteGradient: ["#fef3c7", "#fde68a"],
    blackGradient: ["#78350f", "#451a03"],
    preview: ["#fef3c7", "#78350f"],
  },
  {
    id: "eval-rose",
    name: "Rose Quartz",
    price: 80,
    whiteGradient: ["#ffe4e6", "#fecdd3"],
    blackGradient: ["#881337", "#4c0519"],
    preview: ["#ffe4e6", "#881337"],
  },
  {
    id: "eval-cyber",
    name: "Cyber",
    price: 100,
    whiteGradient: ["#67e8f9", "#22d3ee"],
    blackGradient: ["#164e63", "#083344"],
    preview: ["#67e8f9", "#164e63"],
  },
  {
    id: "eval-purple",
    name: "Royal Purple",
    price: 120,
    whiteGradient: ["#e9d5ff", "#c4b5fd"],
    blackGradient: ["#581c87", "#3b0764"],
    preview: ["#e9d5ff", "#581c87"],
  },
];

/* ─── Active eval skin (localStorage) ─── */

const KEY_ACTIVE_EVAL_SKIN = "fc-eval-skin";

export function getActiveEvalSkinId(): string {
  if (typeof window === "undefined") return "eval-default";
  return localStorage.getItem(KEY_ACTIVE_EVAL_SKIN) ?? "eval-default";
}

export function getActiveEvalSkin(): EvalBarSkin {
  const id = getActiveEvalSkinId();
  return EVAL_BAR_SKINS.find((s) => s.id === id) ?? EVAL_BAR_SKINS[0];
}

export function setActiveEvalSkin(id: string): void {
  localStorage.setItem(KEY_ACTIVE_EVAL_SKIN, id);
  window.dispatchEvent(new CustomEvent("fc-eval-skin-changed", { detail: id }));
}

/* ================================================================== */
/*  Board Coordinates toggle                                            */
/* ================================================================== */

const KEY_SHOW_COORDS = "fc-board-coords";

export function getShowCoordinates(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(KEY_SHOW_COORDS);
  return v === null ? true : v === "1";
}

export function setShowCoordinates(show: boolean): void {
  localStorage.setItem(KEY_SHOW_COORDS, show ? "1" : "0");
  window.dispatchEvent(new CustomEvent("fc-coords-changed", { detail: show }));
}
