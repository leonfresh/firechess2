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

const LICHESS_PIECE_CDN =
  "https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece";

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
  {
    id: "piece-default",
    name: "Default",
    price: 0,
    setName: null,
    style: "Classic",
  },
  {
    id: "piece-cburnett",
    name: "CBurnett",
    price: 0,
    setName: "cburnett",
    style: "Standard",
  },
  {
    id: "piece-merida",
    name: "Merida",
    price: 20,
    setName: "merida",
    style: "Traditional",
  },
  {
    id: "piece-alpha",
    name: "Alpha",
    price: 20,
    setName: "alpha",
    style: "Clean",
  },
  {
    id: "piece-california",
    name: "California",
    price: 35,
    setName: "california",
    style: "Modern",
  },
  {
    id: "piece-cardinal",
    name: "Cardinal",
    price: 50,
    setName: "cardinal",
    style: "Elegant",
  },
  {
    id: "piece-staunty",
    name: "Staunty",
    price: 35,
    setName: "staunty",
    style: "Classic",
  },
  {
    id: "piece-tatiana",
    name: "Tatiana",
    price: 55,
    setName: "tatiana",
    style: "Ornate",
  },
  {
    id: "piece-maestro",
    name: "Maestro",
    price: 75,
    setName: "maestro",
    style: "Bold",
  },
  {
    id: "piece-fresca",
    name: "Fresca",
    price: 40,
    setName: "fresca",
    style: "Minimal",
  },
  {
    id: "piece-gioco",
    name: "Gioco",
    price: 55,
    setName: "gioco",
    style: "Modern",
  },
  {
    id: "piece-governor",
    name: "Governor",
    price: 80,
    setName: "governor",
    style: "Regal",
  },
  {
    id: "piece-kosal",
    name: "Kosal",
    price: 85,
    setName: "kosal",
    style: "Artistic",
  },
  {
    id: "piece-chessnut",
    name: "Chessnut",
    price: 45,
    setName: "chessnut",
    style: "Chunky",
  },
  {
    id: "piece-companion",
    name: "Companion",
    price: 50,
    setName: "companion",
    style: "Clean",
  },
  {
    id: "piece-pixel",
    name: "Pixel",
    price: 130,
    setName: "pixel",
    style: "Retro",
  },
  {
    id: "piece-horsey",
    name: "Horsey",
    price: 150,
    setName: "horsey",
    style: "Fun",
  },
  {
    id: "piece-anarcandy",
    name: "Anarcandy",
    price: 140,
    setName: "anarcandy",
    style: "Colorful",
  },
  {
    id: "piece-fantasy",
    name: "Fantasy",
    price: 100,
    setName: "fantasy",
    style: "Decorative",
  },
  {
    id: "piece-spatial",
    name: "Spatial",
    price: 100,
    setName: "spatial",
    style: "3D",
  },
  {
    id: "piece-celtic",
    name: "Celtic",
    price: 120,
    setName: "celtic",
    style: "Ornate",
  },
  {
    id: "piece-dubrovny",
    name: "Dubrovny",
    price: 120,
    setName: "dubrovny",
    style: "Royal",
  },
  {
    id: "piece-shapes",
    name: "Shapes",
    price: 200,
    setName: "shapes",
    style: "Abstract",
  },
  {
    id: "piece-letter",
    name: "Letter",
    price: 250,
    setName: "letter",
    style: "Minimalist",
  },
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
):
  | Record<
      string,
      ({ squareWidth }: { squareWidth: number }) => React.ReactElement
    >
  | undefined {
  if (!setName) return undefined;

  const pieces = [
    "wP",
    "wN",
    "wB",
    "wR",
    "wQ",
    "wK",
    "bP",
    "bN",
    "bB",
    "bR",
    "bQ",
    "bK",
  ];
  const result: Record<
    string,
    ({ squareWidth }: { squareWidth: number }) => React.ReactElement
  > = {};

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
  window.dispatchEvent(
    new CustomEvent("fc-piece-theme-changed", { detail: id }),
  );
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
  /** If set, only users on this plan can unlock it */
  requiresPlan?: "lifetime";
};

export const PROFILE_TITLES: ProfileTitle[] = [
  {
    id: "title-founder",
    name: "♾️ Founder",
    price: 0,
    requiresPlan: "lifetime",
    badgeClass:
      "bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 ring-1 ring-amber-400/40",
  },
  {
    id: "title-student",
    name: "Chess Student",
    price: 30,
    badgeClass: "bg-slate-500/20 text-slate-300",
  },
  {
    id: "title-tactician",
    name: "Tactician",
    price: 50,
    badgeClass: "bg-cyan-500/20 text-cyan-400",
  },
  {
    id: "title-strategist",
    name: "Strategist",
    price: 75,
    badgeClass: "bg-violet-500/20 text-violet-400",
  },
  {
    id: "title-analyst",
    name: "Master Analyst",
    price: 120,
    badgeClass: "bg-emerald-500/20 text-emerald-400",
  },
  {
    id: "title-scholar",
    name: "Elite Scholar",
    price: 200,
    badgeClass: "bg-amber-500/20 text-amber-400",
  },
  {
    id: "title-grandmaster",
    name: "Grandmaster",
    price: 500,
    badgeClass:
      "bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300",
  },
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

/* ================================================================== */
/*  Avatar Frames                                                       */
/* ================================================================== */

export type AvatarFrame = {
  id: string;
  name: string;
  price: number;
  /** CSS for the wrapper around the avatar image */
  frameStyle: React.CSSProperties;
  /** Tailwind classes for the frame wrapper */
  frameClass: string;
  /** Preview label colour */
  previewColor: string;
  /** If set, only users on this plan can unlock it */
  requiresPlan?: "lifetime";
};

export const AVATAR_FRAMES: AvatarFrame[] = [
  {
    id: "frame-founder",
    name: "Founder's Crest",
    price: 0,
    requiresPlan: "lifetime",
    frameStyle: {
      boxShadow:
        "0 0 0 2px rgba(251,191,36,0.9), 0 0 16px 6px rgba(251,191,36,0.4), 0 0 32px 12px rgba(249,115,22,0.2)",
    },
    frameClass: "ring-2 ring-amber-400",
    previewColor: "#f59e0b",
  },
  {
    id: "frame-none",
    name: "None",
    price: 0,
    frameStyle: {},
    frameClass: "",
    previewColor: "#64748b",
  },
  {
    id: "frame-emerald-glow",
    name: "Emerald Glow",
    price: 60,
    frameStyle: {
      boxShadow:
        "0 0 12px 3px rgba(16,185,129,0.5), 0 0 4px 1px rgba(16,185,129,0.3)",
    },
    frameClass: "ring-2 ring-emerald-400/60",
    previewColor: "#10b981",
  },
  {
    id: "frame-fire",
    name: "Fire Ring",
    price: 80,
    frameStyle: {
      boxShadow:
        "0 0 14px 4px rgba(249,115,22,0.5), 0 0 6px 2px rgba(239,68,68,0.4)",
    },
    frameClass: "ring-2 ring-orange-400/70",
    previewColor: "#f97316",
  },
  {
    id: "frame-ice",
    name: "Frozen Aura",
    price: 80,
    frameStyle: {
      boxShadow:
        "0 0 14px 4px rgba(56,189,248,0.5), 0 0 6px 2px rgba(147,197,253,0.4)",
    },
    frameClass: "ring-2 ring-sky-300/60",
    previewColor: "#38bdf8",
  },
  {
    id: "frame-purple",
    name: "Royal Purple",
    price: 100,
    frameStyle: {
      boxShadow:
        "0 0 16px 4px rgba(168,85,247,0.5), 0 0 6px 2px rgba(192,132,252,0.4)",
    },
    frameClass: "ring-2 ring-purple-400/70",
    previewColor: "#a855f7",
  },
  {
    id: "frame-gold",
    name: "Gold Crown",
    price: 150,
    frameStyle: {
      boxShadow:
        "0 0 16px 4px rgba(251,191,36,0.5), 0 0 8px 2px rgba(245,158,11,0.4)",
    },
    frameClass: "ring-2 ring-amber-400/70",
    previewColor: "#fbbf24",
  },
  {
    id: "frame-rainbow",
    name: "Prismatic",
    price: 200,
    frameStyle: {
      boxShadow:
        "0 0 12px 3px rgba(239,68,68,0.3), 0 0 12px 3px rgba(59,130,246,0.3), 0 0 12px 3px rgba(16,185,129,0.3)",
      animation: "frame-rainbow 3s linear infinite",
    },
    frameClass: "ring-2 ring-white/40",
    previewColor: "#ec4899",
  },
  {
    id: "frame-neon-pink",
    name: "Neon Pink",
    price: 100,
    frameStyle: {
      boxShadow:
        "0 0 14px 4px rgba(236,72,153,0.5), 0 0 6px 2px rgba(244,114,182,0.4)",
    },
    frameClass: "ring-2 ring-pink-400/70",
    previewColor: "#ec4899",
  },
  {
    id: "frame-shadow",
    name: "Dark Shadow",
    price: 75,
    frameStyle: {
      boxShadow: "0 0 20px 6px rgba(0,0,0,0.6), inset 0 0 8px rgba(0,0,0,0.3)",
    },
    frameClass: "ring-2 ring-slate-600/80",
    previewColor: "#475569",
  },
  {
    id: "frame-diamond",
    name: "Diamond",
    price: 250,
    frameStyle: {
      boxShadow:
        "0 0 16px 4px rgba(255,255,255,0.4), 0 0 8px 2px rgba(186,230,253,0.5)",
      animation: "frame-diamond 2s ease-in-out infinite alternate",
    },
    frameClass: "ring-2 ring-white/60",
    previewColor: "#e2e8f0",
  },
  {
    id: "frame-rose",
    name: "Rose Gold",
    price: 120,
    frameStyle: {
      boxShadow:
        "0 0 14px 4px rgba(251,113,133,0.4), 0 0 6px 2px rgba(253,164,175,0.3)",
    },
    frameClass: "ring-2 ring-rose-400/60",
    previewColor: "#fb7185",
  },
  {
    id: "frame-toxic",
    name: "Toxic Green",
    price: 90,
    frameStyle: {
      boxShadow:
        "0 0 14px 4px rgba(74,222,128,0.5), 0 0 6px 2px rgba(34,197,94,0.4)",
    },
    frameClass: "ring-2 ring-green-400/70",
    previewColor: "#4ade80",
  },
];

/* ─── Active avatar frame (localStorage) ─── */

const KEY_ACTIVE_FRAME = "fc-avatar-frame";

export function getActiveFrameId(): string {
  if (typeof window === "undefined") return "frame-none";
  return localStorage.getItem(KEY_ACTIVE_FRAME) ?? "frame-none";
}

export function getActiveFrame(): AvatarFrame {
  const id = getActiveFrameId();
  return AVATAR_FRAMES.find((f) => f.id === id) ?? AVATAR_FRAMES[0];
}

export function setActiveFrame(id: string): void {
  localStorage.setItem(KEY_ACTIVE_FRAME, id);
  window.dispatchEvent(new CustomEvent("fc-frame-changed", { detail: id }));
}
