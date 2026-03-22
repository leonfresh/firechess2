/**
 * Chaos Chess — Opening Anomalies
 *
 * Before each game, a player picks 1 Anomaly from a random selection.
 * Free players see 2 random choices; Pro players see 4.
 * The anomaly is asymmetric — only affects the picking player's pieces.
 * Themed after the 22 Major Arcana of the Tarot.
 */

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export type AnomalyId =
  | "fool"
  | "magician"
  | "high-priestess"
  | "empress"
  | "emperor"
  | "hierophant"
  | "lovers"
  | "chariot"
  | "strength"
  | "hermit"
  | "wheel-of-fortune"
  | "justice"
  | "hanged-man"
  | "death"
  | "temperance"
  | "devil"
  | "tower"
  | "star"
  | "moon"
  | "sun"
  | "judgement"
  | "world";

export type AnomalyTrigger =
  | "passive" // always active, no UI button needed
  | "once-per-game" // shows an activation button in-game
  | "draft-modifier" // modifies the draft system
  | "fen-mod"; // modifies the starting position (then passive)

export interface AnomalyDefinition {
  id: AnomalyId;
  tarotNumber: number; // 0–21
  tarotRoman: string; // "0", "I", "II", …
  tarotName: string; // "The Fool", etc.
  name: string; // short ability name
  description: string; // full description shown on card
  icon: string; // emoji icon
  trigger: AnomalyTrigger;
  /** Modifier IDs to inject into the player's modifier list at game start */
  injectModifiers?: string[];
  /** Modifier IDs removed from that player's draft pool for the entire game */
  removesFromDraft?: string[];
  /** Tailwind gradient classes for the card background */
  bgGradient: string;
  /** Tailwind border class */
  borderClass: string;
  /** CSS rgba glow color for epic cards */
  glowColor: string;
  /** Text color class for tier / accent */
  accentColor: string;
}

/* ================================================================== */
/*  All 22 Anomaly Definitions                                         */
/* ================================================================== */

export const ALL_ANOMALIES: AnomalyDefinition[] = [
  /* 0 — The Fool */
  {
    id: "fool",
    tarotNumber: 0,
    tarotRoman: "0",
    tarotName: "The Fool",
    name: "Wanderer",
    description:
      "Your pawns can move 1 square diagonally forward (movement only — not a capture). Blocked and last-rank-reaching squares are skipped.",
    icon: "🃏",
    trigger: "passive",
    bgGradient: "from-yellow-950/90 to-amber-900/50",
    borderClass: "border-yellow-500/40",
    glowColor: "rgba(234,179,8,0.25)",
    accentColor: "text-yellow-400",
  },

  /* I — The Magician */
  {
    id: "magician",
    tarotNumber: 1,
    tarotRoman: "I",
    tarotName: "The Magician",
    name: "Manifestation",
    description:
      "Your Queen leaps like a knight from move 1. The Amazon modifier is built-in and won't appear in your draft pool.",
    icon: "🪄",
    trigger: "passive",
    injectModifiers: ["amazon"],
    removesFromDraft: ["amazon"],
    bgGradient: "from-violet-950/90 to-purple-900/50",
    borderClass: "border-violet-500/40",
    glowColor: "rgba(139,92,246,0.35)",
    accentColor: "text-violet-400",
  },

  /* II — The High Priestess */
  {
    id: "high-priestess",
    tarotNumber: 2,
    tarotRoman: "II",
    tarotName: "The High Priestess",
    name: "Inner Vision",
    description:
      "Each draft phase you see 1 extra modifier choice that your opponent cannot see. Your drafts stay one step ahead.",
    icon: "🔮",
    trigger: "draft-modifier",
    bgGradient: "from-blue-950/90 to-indigo-900/50",
    borderClass: "border-blue-400/40",
    glowColor: "rgba(96,165,250,0.25)",
    accentColor: "text-blue-400",
  },

  /* III — The Empress */
  {
    id: "empress",
    tarotNumber: 3,
    tarotRoman: "III",
    tarotName: "The Empress",
    name: "Abundance",
    description:
      "Start with 2 extra pawns on c3 and f3 (c6 and f6 for Black). A generous opening presence.",
    icon: "🌿",
    trigger: "fen-mod",
    bgGradient: "from-emerald-950/90 to-green-900/50",
    borderClass: "border-emerald-500/40",
    glowColor: "rgba(16,185,129,0.25)",
    accentColor: "text-emerald-400",
  },

  /* IV — The Emperor */
  {
    id: "emperor",
    tarotNumber: 4,
    tarotRoman: "IV",
    tarotName: "The Emperor",
    name: "Dominion",
    description:
      "Your King can move up to 2 squares in any direction (a leap — intermediate squares don't block). Authority knows no bounds.",
    icon: "👑",
    trigger: "passive",
    bgGradient: "from-amber-950/90 to-yellow-900/50",
    borderClass: "border-amber-500/40",
    glowColor: "rgba(245,158,11,0.3)",
    accentColor: "text-amber-400",
  },

  /* V — The Hierophant */
  {
    id: "hierophant",
    tarotNumber: 5,
    tarotRoman: "V",
    tarotName: "The Hierophant",
    name: "Sacred Passage",
    description:
      "Your Bishops slide through your own pieces diagonally. Dragon Bishop is built-in and removed from your draft pool.",
    icon: "⛩️",
    trigger: "passive",
    injectModifiers: ["dragon-bishop"],
    removesFromDraft: ["dragon-bishop"],
    bgGradient: "from-cyan-950/90 to-sky-900/50",
    borderClass: "border-cyan-500/40",
    glowColor: "rgba(6,182,212,0.25)",
    accentColor: "text-cyan-400",
  },

  /* VI — The Lovers */
  {
    id: "lovers",
    tarotNumber: 6,
    tarotRoman: "VI",
    tarotName: "The Lovers",
    name: "The Pact",
    description:
      "Once per game: swap any 2 of your own pieces (counts as your turn). The soul of sacrifice made whole.",
    icon: "💞",
    trigger: "once-per-game",
    bgGradient: "from-pink-950/90 to-rose-900/50",
    borderClass: "border-pink-500/40",
    glowColor: "rgba(236,72,153,0.3)",
    accentColor: "text-pink-400",
  },

  /* VII — The Chariot */
  {
    id: "chariot",
    tarotNumber: 7,
    tarotRoman: "VII",
    tarotName: "The Chariot",
    name: "Unstoppable",
    description:
      "Your Rooks phase through your own pieces from move 1. Phantom Rook is built-in and removed from your draft pool.",
    icon: "🚀",
    trigger: "passive",
    injectModifiers: ["phantom-rook"],
    removesFromDraft: ["phantom-rook"],
    bgGradient: "from-orange-950/90 to-amber-900/50",
    borderClass: "border-orange-500/40",
    glowColor: "rgba(249,115,22,0.3)",
    accentColor: "text-orange-400",
  },

  /* VIII — Strength */
  {
    id: "strength",
    tarotNumber: 8,
    tarotRoman: "VIII",
    tarotName: "Strength",
    name: "Royal Strike",
    description:
      "Once per game: your King makes a queen-range capture from wherever it stands. The sovereign strikes without moving.",
    icon: "⚡",
    trigger: "once-per-game",
    bgGradient: "from-red-950/90 to-rose-900/50",
    borderClass: "border-red-500/40",
    glowColor: "rgba(239,68,68,0.35)",
    accentColor: "text-red-400",
  },

  /* IX — The Hermit */
  {
    id: "hermit",
    tarotNumber: 9,
    tarotRoman: "IX",
    tarotName: "The Hermit",
    name: "Deeper Wells",
    description:
      "All your draft choices are drawn from 1 tier higher than the current phase (Phase 1 → Rare, Phase 2 → Epic, etc.).",
    icon: "🕯️",
    trigger: "draft-modifier",
    bgGradient: "from-slate-900/90 to-zinc-800/50",
    borderClass: "border-slate-400/40",
    glowColor: "rgba(148,163,184,0.2)",
    accentColor: "text-slate-400",
  },

  /* X — Wheel of Fortune */
  {
    id: "wheel-of-fortune",
    tarotNumber: 10,
    tarotRoman: "X",
    tarotName: "Wheel of Fortune",
    name: "Fate's Hand",
    description:
      "Each draft phase your choices come from a random tier between 1 and the current phase number. Chaos rewards the brave.",
    icon: "🎡",
    trigger: "draft-modifier",
    bgGradient: "from-yellow-950/90 to-orange-900/50",
    borderClass: "border-yellow-400/40",
    glowColor: "rgba(250,204,21,0.25)",
    accentColor: "text-yellow-300",
  },

  /* XI — Justice */
  {
    id: "justice",
    tarotNumber: 11,
    tarotRoman: "XI",
    tarotName: "Justice",
    name: "The Verdict",
    description:
      "Once per game: mark one of your pieces Immune for 3 full turns. It cannot be captured by any means — standard or chaos.",
    icon: "⚖️",
    trigger: "once-per-game",
    bgGradient: "from-indigo-950/90 to-blue-900/50",
    borderClass: "border-indigo-500/40",
    glowColor: "rgba(99,102,241,0.3)",
    accentColor: "text-indigo-400",
  },

  /* XII — The Hanged Man */
  {
    id: "hanged-man",
    tarotNumber: 12,
    tarotRoman: "XII",
    tarotName: "The Hanged Man",
    name: "Transmutation",
    description:
      "Once per game: transform any one of your pieces into any other type (not King). Perspective shifts everything.",
    icon: "🔄",
    trigger: "once-per-game",
    bgGradient: "from-teal-950/90 to-cyan-900/50",
    borderClass: "border-teal-500/40",
    glowColor: "rgba(20,184,166,0.3)",
    accentColor: "text-teal-400",
  },

  /* XIII — Death */
  {
    id: "death",
    tarotNumber: 13,
    tarotRoman: "XIII",
    tarotName: "Death",
    name: "The Wake",
    description:
      "Whenever you capture an enemy piece worth at least a knight, a pawn spawns on the square your piece moved FROM.",
    icon: "💀",
    trigger: "passive",
    bgGradient: "from-zinc-900/90 to-stone-800/50",
    borderClass: "border-zinc-500/40",
    glowColor: "rgba(113,113,122,0.2)",
    accentColor: "text-zinc-400",
  },

  /* XIV — Temperance */
  {
    id: "temperance",
    tarotNumber: 14,
    tarotRoman: "XIV",
    tarotName: "Temperance",
    name: "Rebalance",
    description:
      "Once per draft phase: discard one of your modifier choices and draw 2 fresh replacements. Balance over randomness.",
    icon: "🌊",
    trigger: "draft-modifier",
    bgGradient: "from-sky-950/90 to-blue-900/50",
    borderClass: "border-sky-500/40",
    glowColor: "rgba(14,165,233,0.25)",
    accentColor: "text-sky-400",
  },

  /* XV — The Devil */
  {
    id: "devil",
    tarotNumber: 15,
    tarotRoman: "XV",
    tarotName: "The Devil",
    name: "Bargain",
    description:
      "Once per game: freeze one enemy piece for 2 full turns. It cannot move or use chaos abilities. The price is paid.",
    icon: "😈",
    trigger: "once-per-game",
    bgGradient: "from-red-950/90 to-rose-900/50",
    borderClass: "border-rose-600/40",
    glowColor: "rgba(225,29,72,0.4)",
    accentColor: "text-rose-400",
  },

  /* XVI — The Tower */
  {
    id: "tower",
    tarotNumber: 16,
    tarotRoman: "XVI",
    tarotName: "The Tower",
    name: "Collapse",
    description:
      "Your Rooks gain 1-step diagonal movement from move 1. Dragon Rook is built-in and removed from your draft pool.",
    icon: "🏗️",
    trigger: "passive",
    injectModifiers: ["dragon-rook"],
    removesFromDraft: ["dragon-rook"],
    bgGradient: "from-stone-900/90 to-zinc-800/50",
    borderClass: "border-stone-500/40",
    glowColor: "rgba(168,162,158,0.25)",
    accentColor: "text-stone-400",
  },

  /* XVII — The Star */
  {
    id: "star",
    tarotNumber: 17,
    tarotRoman: "XVII",
    tarotName: "The Star",
    name: "Guiding Light",
    description:
      "All your Knights permanently gain Camel leaps (1,3 jumps) on top of their normal movement. Stars align.",
    icon: "⭐",
    trigger: "passive",
    bgGradient: "from-purple-950/90 to-fuchsia-900/50",
    borderClass: "border-purple-400/40",
    glowColor: "rgba(168,85,247,0.3)",
    accentColor: "text-purple-400",
  },

  /* XVIII — The Moon */
  {
    id: "moon",
    tarotNumber: 18,
    tarotRoman: "XVIII",
    tarotName: "The Moon",
    name: "Nocturnal Hunt",
    description:
      "From Turn 10 (Phase 2): your Queen can capture any adjacent diagonal enemy without physically moving (queen stays, once per turn).",
    icon: "🌑",
    trigger: "passive",
    bgGradient: "from-slate-900/90 to-gray-800/50",
    borderClass: "border-slate-400/40",
    glowColor: "rgba(100,116,139,0.3)",
    accentColor: "text-slate-300",
  },

  /* XIX — The Sun */
  {
    id: "sun",
    tarotNumber: 19,
    tarotRoman: "XIX",
    tarotName: "The Sun",
    name: "First Light",
    description:
      "Once per game: every eligible pawn surges forward 1 free square (skips blocked pawns and pawns that would promote), then you still make your normal move.",
    icon: "☀️",
    trigger: "once-per-game",
    bgGradient: "from-yellow-950/90 to-amber-800/50",
    borderClass: "border-yellow-300/40",
    glowColor: "rgba(253,224,71,0.3)",
    accentColor: "text-yellow-200",
  },

  /* XX — Judgement */
  {
    id: "judgement",
    tarotNumber: 20,
    tarotRoman: "XX",
    tarotName: "Judgement",
    name: "Resurrection",
    description:
      "Once per game: call back one captured piece — it returns to its original starting square (if that square is empty). The trumpet sounds.",
    icon: "🎺",
    trigger: "once-per-game",
    bgGradient: "from-orange-950/90 to-amber-900/50",
    borderClass: "border-orange-400/40",
    glowColor: "rgba(251,146,60,0.3)",
    accentColor: "text-orange-400",
  },

  /* XXI — The World */
  {
    id: "world",
    tarotNumber: 21,
    tarotRoman: "XXI",
    tarotName: "The World",
    name: "Final Act",
    description:
      "Once per game: after your opponent completes their move, take 1 free bonus move before your regular turn begins.",
    icon: "🌍",
    trigger: "once-per-game",
    bgGradient: "from-emerald-950/90 to-teal-900/50",
    borderClass: "border-emerald-400/40",
    glowColor: "rgba(52,211,153,0.4)",
    accentColor: "text-emerald-300",
  },
];

/* ================================================================== */
/*  Utility Functions                                                   */
/* ================================================================== */

/** Simple seeded PRNG (mulberry32) — same as in chaos-chess.ts */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Roll `count` random anomalies from the full pool (no duplicates).
 * Always returns exactly `count` unique anomalies.
 * Free users: caller shows the first 2 as active, the rest as locked.
 * Pro users: caller shows all as active.
 */
export function rollAnomalyChoices(
  count: number,
  seed?: number,
): AnomalyDefinition[] {
  const rng = seed != null ? seededRandom(seed) : Math.random;
  const pool = [...ALL_ANOMALIES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/** Look up an anomaly by id */
export function getAnomalyById(id: AnomalyId): AnomalyDefinition | undefined {
  return ALL_ANOMALIES.find((a) => a.id === id);
}

/**
 * Original starting squares for each piece type.
 * Used by Judgement (Resurrection) to determine where to return a captured piece.
 * Keys are "{color}{pieceType}" (e.g. "wq" = white queen, "bn" = black knight).
 */
export const PIECE_STARTING_SQUARES: Record<string, string[]> = {
  wR: ["a1", "h1"],
  wN: ["b1", "g1"],
  wB: ["c1", "f1"],
  wQ: ["d1"],
  wP: ["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"],
  bR: ["a8", "h8"],
  bN: ["b8", "g8"],
  bB: ["c8", "f8"],
  bQ: ["d8"],
  bP: ["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"],
};
