/**
 * Chaos Chess — Roguelike chess modifier system.
 *
 * Play a normal game of chess against Stockfish. At set turn milestones
 * (turns 5, 10, 15, 20, 25) the game freezes and both you and the AI
 * draft a permanent modifier that mutates piece behaviour for the rest
 * of the game.
 *
 * Modifiers are implemented as custom move-generators layered on top of
 * chess.js — each modifier describes extra legal moves a piece type gains,
 * or passive effects (shield, revive, collateral).
 */

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export type ModifierTier = "common" | "rare" | "epic" | "legendary";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export interface ChaosModifier {
  id: string;
  name: string;
  description: string;
  tier: ModifierTier;
  icon: string;
  /** Which piece type this modifies (null = global) */
  piece: PieceType | null;
  /** Which draft phases this can appear in (1-5) */
  phases: number[];
}

/** Tracks which modifiers each side has drafted */
export interface ChaosState {
  /** Modifiers the human player has drafted */
  playerModifiers: ChaosModifier[];
  /** Modifiers the AI has drafted */
  aiModifiers: ChaosModifier[];
  /** Current draft phase (1-5), 0 = not started */
  currentPhase: number;
  /** Full move number that triggers each phase */
  phaseTriggers: number[];
  /** Whether the game is currently in a draft freeze */
  isDrafting: boolean;
  /** Which side is drafting ("player" | "ai" | null) */
  draftingSide: "player" | "ai" | null;
  /** The 3 modifier choices offered in the current draft */
  draftChoices: ChaosModifier[];
}

/* ================================================================== */
/*  Modifier definitions                                                */
/* ================================================================== */

export const ALL_MODIFIERS: ChaosModifier[] = [
  // ── Phase 1 (Turn 5) — Movement & Minor Buffs ──
  {
    id: "pawn-charge",
    name: "Pawn Charge",
    description: "Pawns can move 2 squares forward from any rank, not just their starting rank.",
    tier: "common",
    icon: "🏃",
    piece: "p",
    phases: [1, 2],
  },
  {
    id: "pawn-capture-forward",
    name: "Pawn Bayonet",
    description: "Pawns can capture straight ahead as well as diagonally.",
    tier: "common",
    icon: "🗡️",
    piece: "p",
    phases: [1, 2],
  },
  {
    id: "knight-retreat",
    name: "Tactical Retreat",
    description: "Knights can also move 1 square in any direction (like a King).",
    tier: "common",
    icon: "🐴",
    piece: "n",
    phases: [1, 2],
  },
  {
    id: "bishop-slide",
    name: "Bishop's Sprint",
    description: "Bishops can also move 1 square horizontally or vertically.",
    tier: "common",
    icon: "⛪",
    piece: "b",
    phases: [1, 2],
  },
  {
    id: "king-shield",
    name: "Royal Guard",
    description: "The King gains a shield — the first check each game is ignored (opponent must re-check).",
    tier: "common",
    icon: "🛡️",
    piece: "k",
    phases: [1, 2],
  },
  {
    id: "rook-charge",
    name: "Rook Rush",
    description: "Rooks can also move 1 square diagonally.",
    tier: "common",
    icon: "🏰",
    piece: "r",
    phases: [1, 2],
  },

  // ── Phase 2-3 (Turn 10-15) — Utility & Disruption ──
  {
    id: "pegasus",
    name: "Pegasus",
    description: "Knights can make a double L-jump — two knight moves in a single turn.",
    tier: "rare",
    icon: "🦄",
    piece: "n",
    phases: [2, 3],
  },
  {
    id: "phantom-rook",
    name: "Phantom Rook",
    description: "Rooks can move through friendly pieces (but not enemy pieces).",
    tier: "rare",
    icon: "👻",
    piece: "r",
    phases: [2, 3],
  },
  {
    id: "sniper-bishop",
    name: "Sniper Bishop",
    description: "Bishops can 'shoot' and capture any enemy piece on the same diagonal up to 2 squares away, without moving.",
    tier: "rare",
    icon: "🎯",
    piece: "b",
    phases: [2, 3],
  },
  {
    id: "pawn-shield-wall",
    name: "Shield Wall",
    description: "Pawns require two captures to be removed. The first capture pushes them back one square instead.",
    tier: "rare",
    icon: "🔰",
    piece: "p",
    phases: [2, 3],
  },
  {
    id: "enpassant-everywhere",
    name: "En Passant Everywhere",
    description: "En passant can be performed on any pawn that moved 1 or 2 squares, not just from the starting rank. Holy hell.",
    tier: "rare",
    icon: "⚡",
    piece: "p",
    phases: [2, 3],
  },
  {
    id: "king-wrath",
    name: "Regicide",
    description: "When your King captures an enemy piece, revive one of your captured pieces on any empty square in your back rank.",
    tier: "rare",
    icon: "👑",
    piece: "k",
    phases: [2, 3],
  },
  {
    id: "knook",
    name: "The Knook",
    description: "One of your Knights transforms into the legendary Knook — it moves as both a Knight AND a Rook.",
    tier: "rare",
    icon: "🏇",
    piece: "n",
    phases: [2, 3, 4],
  },
  {
    id: "archbishop",
    name: "The Archbishop",
    description: "One of your Bishops transforms into an Archbishop — it moves as both a Bishop AND a Knight.",
    tier: "rare",
    icon: "⛪",
    piece: "b",
    phases: [2, 3, 4],
  },

  // ── Phase 3-4 (Turn 15-20) — Powerful disruption ──
  {
    id: "queen-teleport",
    name: "Warp Queen",
    description: "Once per game, the Queen can teleport to any empty square on the board.",
    tier: "epic",
    icon: "🌀",
    piece: "q",
    phases: [3, 4],
  },
  {
    id: "collateral-rook",
    name: "Collateral Damage",
    description: "When a Rook captures, it also destroys any piece immediately behind the captured target.",
    tier: "epic",
    icon: "💥",
    piece: "r",
    phases: [3, 4],
  },
  {
    id: "bishop-bounce",
    name: "Ricochet Bishop",
    description: "Bishops can bounce their movement off the edge of the board once per turn.",
    tier: "epic",
    icon: "🪃",
    piece: "b",
    phases: [3, 4],
  },
  {
    id: "pawn-promotion-early",
    name: "Battlefield Promotion",
    description: "Pawns can promote on the 6th rank (3rd for black) instead of the last rank.",
    tier: "epic",
    icon: "⭐",
    piece: "p",
    phases: [3, 4],
  },
  {
    id: "il-vaticano",
    name: "Il Vaticano",
    description: "Two Bishops can capture two enemy pawns trapped between them in a single move. The Vatican strikes!",
    tier: "epic",
    icon: "⛪",
    piece: "b",
    phases: [3, 4, 5],
  },
  {
    id: "forced-en-passant",
    name: "Forced En Passant",
    description: "If en passant is available, it is the ONLY legal move. A brick is dropped if you try anything else.",
    tier: "epic",
    icon: "🧱",
    piece: "p",
    phases: [3, 4],
  },

  // ── Phase 4-5 (Turn 20-25) — Pure Chaos ──
  {
    id: "nuclear-queen",
    name: "Nuclear Queen",
    description: "When the Queen captures, all 8 surrounding squares are cleared of ALL pieces (friend AND foe).",
    tier: "legendary",
    icon: "☢️",
    piece: "q",
    phases: [4, 5],
  },
  {
    id: "amazon",
    name: "The Amazon",
    description: "Your Queen transforms into an Amazon — she can also move like a Knight.",
    tier: "legendary",
    icon: "👸",
    piece: "q",
    phases: [4, 5],
  },
  {
    id: "knight-horde",
    name: "Knight Horde",
    description: "Spawn 2 extra Knights on random empty squares on your side of the board.",
    tier: "legendary",
    icon: "🐎",
    piece: "n",
    phases: [4, 5],
  },
  {
    id: "undead-army",
    name: "Undead Army",
    description: "Revive ALL your captured pawns on random empty squares on your back two ranks.",
    tier: "legendary",
    icon: "💀",
    piece: "p",
    phases: [4, 5],
  },
  {
    id: "king-ascension",
    name: "King Ascension",
    description: "Your King gains Queen movement. The royal piece has had enough of hiding.",
    tier: "legendary",
    icon: "🔱",
    piece: "k",
    phases: [4, 5],
  },
  {
    id: "rook-cannon",
    name: "Rook Cannon",
    description: "Rooks can jump over exactly one piece (like a cannon in Xiangqi) to capture behind it.",
    tier: "legendary",
    icon: "💣",
    piece: "r",
    phases: [4, 5],
  },
];

/* ================================================================== */
/*   Tier styling                                                       */
/* ================================================================== */

export const TIER_COLORS: Record<ModifierTier, { bg: string; border: string; text: string; glow: string }> = {
  common:    { bg: "bg-slate-800/60",    border: "border-slate-600/40",   text: "text-slate-300",   glow: "" },
  rare:      { bg: "bg-blue-950/60",     border: "border-blue-500/40",    text: "text-blue-400",    glow: "shadow-blue-500/10" },
  epic:      { bg: "bg-purple-950/60",   border: "border-purple-500/40",  text: "text-purple-400",  glow: "shadow-purple-500/20" },
  legendary: { bg: "bg-amber-950/60",    border: "border-amber-500/40",   text: "text-amber-400",   glow: "shadow-amber-500/20" },
};

export const TIER_LABELS: Record<ModifierTier, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/* ================================================================== */
/*  Game state helpers                                                   */
/* ================================================================== */

/** The full-move numbers at which each draft phase triggers */
export const DEFAULT_PHASE_TRIGGERS = [5, 10, 15, 20, 25];

/** Create a fresh ChaosState */
export function createChaosState(): ChaosState {
  return {
    playerModifiers: [],
    aiModifiers: [],
    currentPhase: 0,
    phaseTriggers: [...DEFAULT_PHASE_TRIGGERS],
    isDrafting: false,
    draftingSide: null,
    draftChoices: [],
  };
}

/**
 * Check whether the current full-move number should trigger a draft.
 * Returns the phase number (1-5) or 0 if no trigger.
 */
export function checkDraftTrigger(fullMoveNumber: number, state: ChaosState): number {
  const nextPhase = state.currentPhase + 1;
  if (nextPhase > state.phaseTriggers.length) return 0;
  if (fullMoveNumber >= state.phaseTriggers[nextPhase - 1]) return nextPhase;
  return 0;
}

/**
 * Roll 3 random modifier choices for a given phase.
 * Avoids modifiers already drafted by the given side.
 */
export function rollDraftChoices(
  phase: number,
  alreadyDrafted: ChaosModifier[],
  seed?: number,
): ChaosModifier[] {
  const draftedIds = new Set(alreadyDrafted.map((m) => m.id));
  const pool = ALL_MODIFIERS.filter(
    (m) => m.phases.includes(phase) && !draftedIds.has(m.id),
  );

  // Seeded shuffle (Fisher-Yates)
  const rng = seed != null ? seededRandom(seed + phase * 1000) : Math.random;
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 3);
}

/** Simple seeded PRNG (mulberry32) */
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
 * Apply the player's chosen modifier and roll the AI's choice automatically.
 */
export function applyDraft(
  state: ChaosState,
  playerChoice: ChaosModifier,
  phase: number,
): ChaosState {
  const newState = { ...state };

  // Player picks their modifier
  newState.playerModifiers = [...state.playerModifiers, playerChoice];

  // AI picks the highest-tier remaining option it hasn't drafted
  const aiChoices = rollDraftChoices(phase, state.aiModifiers, Date.now());
  const aiPick = aiChoices.sort((a, b) => tierValue(b.tier) - tierValue(a.tier))[0] ?? aiChoices[0];
  if (aiPick) {
    newState.aiModifiers = [...state.aiModifiers, aiPick];
  }

  newState.currentPhase = phase;
  newState.isDrafting = false;
  newState.draftingSide = null;
  newState.draftChoices = [];

  return newState;
}

function tierValue(tier: ModifierTier): number {
  return { common: 1, rare: 2, epic: 3, legendary: 4 }[tier];
}

/**
 * Get a summary line describing an AI's drafted modifier (for the log).
 */
export function getAiDraftMessage(state: ChaosState): string | null {
  const latest = state.aiModifiers[state.aiModifiers.length - 1];
  if (!latest) return null;
  return `Stockfish drafted: ${latest.icon} ${latest.name} — ${latest.description}`;
}

/**
 * Get phase label text for the draft UI.
 */
export function getPhaseLabel(phase: number): string {
  switch (phase) {
    case 1: return "Early Game — Movement Buffs";
    case 2: return "Early-Mid — Positioning";
    case 3: return "Mid Game — Disruption";
    case 4: return "Late-Mid — Power Spike";
    case 5: return "Late Game — Pure Chaos";
    default: return "Draft Phase";
  }
}

/**
 * Check if a specific modifier is active for a side.
 */
export function hasModifier(
  state: ChaosState,
  side: "player" | "ai",
  modifierId: string,
): boolean {
  const mods = side === "player" ? state.playerModifiers : state.aiModifiers;
  return mods.some((m) => m.id === modifierId);
}
