/**
 * Shared visual theme for FireChess share cards (OG images + downloadable PNGs).
 * Matches the site: dark #0c0f15 background, green/cream board, orange accent.
 */

export const CARD_COLORS = {
  bg: "#0c0f15",
  bgDeep: "#090b10",
  panel: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.10)",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  textFaint: "#64748b",
  brand: "#fb923c",
  lightSq: "#edeed1",
  darkSq: "#779952",
  green: "#4ade80",
  red: "#f87171",
  cyan: "#22d3ee",
  gold: "#fbbf24",
  purple: "#a78bfa",
} as const;

export type ShareCardKind = "brilliant" | "tactic" | "mental" | "vibe";

export const CARD_KIND_CONFIG: Record<
  ShareCardKind,
  { color: string; glow: string; label: string; emoji: string }
> = {
  brilliant: {
    color: CARD_COLORS.cyan,
    glow: "rgba(34,211,238,0.14)",
    label: "BRILLIANT MOVE",
    emoji: "\u{1F48E}",
  },
  tactic: {
    color: CARD_COLORS.red,
    glow: "rgba(248,113,113,0.14)",
    label: "MISSED TACTIC",
    emoji: "\u{1F3AF}",
  },
  mental: {
    color: CARD_COLORS.purple,
    glow: "rgba(167,139,250,0.14)",
    label: "MENTAL ARCHETYPE",
    emoji: "\u{1F9E0}",
  },
  vibe: {
    color: CARD_COLORS.brand,
    glow: "rgba(251,146,60,0.14)",
    label: "SCAN REPORT",
    emoji: "\u{1F525}",
  },
};

/** Card pixel sizes */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const SQUARE_SIZE = { width: 1080, height: 1080 } as const;

export const PIECE_SET = "cburnett";
export const LICHESS_PIECE_CDN =
  "https://raw.githubusercontent.com/lichess-org/lila/master/public/piece";
