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

import type { AnomalyId } from "./chaos-anomalies";

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export type ModifierTier = "common" | "rare" | "epic" | "legendary";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export interface ChaosModifier {
  id: string;
  name: string;
  description: string;
  /** Optional caveat shown as a warning note in the tooltip */
  warning?: string;
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
  /**
   * Track assigned squares for single-piece modifiers (archbishop, knook).
   * Key: "{color}_{modId}" e.g. "w_archbishop", "b_knook".
   * Value: current square of the assigned piece, or null if captured.
   */
  assignedSquares?: Record<string, string | null>;
  /**
   * Multiplayer draft step (server-perspective, always relative to White/Black):
   *   0 = no draft in progress
   *   1 = White has drafted, waiting for Black
   *   2 = both have drafted, phase complete
   */
  draftStep?: number;

  /* ── Opening Anomalies ── */
  /** Anomaly the local player (white / the human) has chosen */
  playerAnomaly?: AnomalyId | null;
  /** Anomaly the opponent (AI or remote player) has */
  aiAnomaly?: AnomalyId | null;
  /** Whether the player has already used their once-per-game ability */
  playerAnomalyUsed?: boolean;
  aiAnomalyUsed?: boolean;
  /** Moon anomaly: becomes available after Phase 2 (turn 10) */
  playerMoonUnlocked?: boolean;
  aiMoonUnlocked?: boolean;
  /** Justice anomaly: immune piece tracking */
  playerImmuneSquare?: string | null;
  playerImmuneTurnsLeft?: number;
  aiImmuneSquare?: string | null;
  aiImmuneTurnsLeft?: number;
  /** Devil anomaly: frozen opponent piece tracking */
  playerFrozenSquare?: string | null; // square the player froze (an opponent piece)
  playerFrozenTurnsLeft?: number;
  aiFrozenSquare?: string | null; // square the AI froze (a player piece)
  aiFrozenTurnsLeft?: number;
  /** World anomaly: player has a bonus turn ready (after opponent's move) */
  playerWorldReady?: boolean;
  aiWorldReady?: boolean;
  /** Temperance: has the reroll been used this phase */
  playerTemperanceUsedThisPhase?: boolean;
  /** Captured pieces list for Judgement resurrection (stored as "{color}{type}" e.g. "wQ") */
  playerCapturedForJudgement?: string[];
  aiCapturedForJudgement?: string[];
  /**
   * Nuclear Queen cooldown: the blast is suppressed while fullMoveNumber < this.
   * 0 = no cooldown (always available at game start).
   * Set to `currentFullMove + 4` after each blast — meaning 3 full turns must
   * pass before the queen can detonate again.
   */
  playerNuclearCooldownUntil?: number;
  aiNuclearCooldownUntil?: number;
}

/* ================================================================== */
/*  Modifier definitions                                                */
/* ================================================================== */

export const ALL_MODIFIERS: ChaosModifier[] = [
  // ── Phase 1 (Turn 5) — Movement & Minor Buffs ──
  {
    id: "pawn-charge",
    name: "Torpedo Pawns",
    description:
      "Your pawns can move 2 squares forward from ANY rank, not just their starting rank. Suddenly every pawn is a threat.",
    tier: "common",
    icon: "🚀",
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
    id: "camel",
    name: "Camel",
    description:
      "One of your Knights transforms into a Camel — it leaps 1 square in one direction and 3 in the other, a colorbound extended jump.",
    tier: "common",
    icon: "🐫",
    piece: "n",
    phases: [1, 2],
  },
  {
    id: "dragon-bishop",
    name: "Dragon Bishop",
    description:
      "Your bishops ascend — each bishop can also step one square in any cardinal direction (orthogonal), mirroring the Shogi Dragon Horse (龍馬).",
    tier: "common",
    icon: "🐉",
    piece: "b",
    phases: [1, 2],
  },
  {
    id: "kings-chains",
    name: "King's Chains",
    description:
      "Your king's presence paralyzes the highest-value adjacent enemy piece — it cannot move or capture. The chained piece still threatens squares.",
    tier: "common",
    icon: "⛓️",
    piece: "k",
    phases: [1, 2],
  },
  {
    id: "dragon-rook",
    name: "Dragon Rook",
    description:
      "Your rooks are promoted — each rook can also step one square diagonally, mirroring the Shogi Dragon King (龍王).",
    tier: "common",
    icon: "🐲",
    piece: "r",
    phases: [1, 2],
  },

  // ── Phase 2-3 (Turn 10-15) — Utility & Disruption ──
  {
    id: "pegasus",
    name: "Pegasus",
    description:
      "One knight gains a double L-jump — the second jump must advance toward the opponent (forward ranks only).",
    tier: "rare",
    icon: "🦄",
    piece: "n",
    phases: [2, 3],
  },
  {
    id: "phantom-rook",
    name: "Phantom Rook",
    description:
      "Rooks can move through friendly pieces (but not enemy pieces).",
    tier: "rare",
    icon: "👻",
    piece: "r",
    phases: [2, 3],
  },
  {
    id: "sniper-bishop",
    name: "Sniper Bishop",
    description:
      "Bishops can 'shoot' and capture any enemy piece on the same diagonal up to 2 squares away, without moving.",
    tier: "rare",
    icon: "🎯",
    piece: "b",
    phases: [2, 3],
  },
  {
    id: "pawn-fortress",
    name: "Pawn Fortress",
    description:
      "When one of your pawns is captured, there's a 50% chance it respawns on its starting square (if empty).",
    tier: "rare",
    icon: "🏰",
    piece: "p",
    phases: [2, 3],
  },
  {
    id: "enpassant-everywhere",
    name: "En Passant Everywhere",
    description:
      "En passant can be performed on any pawn that moved 1 or 2 squares, not just from the starting rank. Holy hell.",
    tier: "rare",
    icon: "♟️",
    piece: "p",
    phases: [2, 3],
  },
  {
    id: "king-wrath",
    name: "Regicide",
    description:
      "When your King captures an enemy piece, revive one of your captured pieces on any empty square in your back rank.",
    tier: "rare",
    icon: "👑",
    piece: "k",
    phases: [2, 3],
  },
  {
    id: "knook",
    name: "The Knook",
    description:
      "One of your Knights transforms into the legendary Knook — it moves as both a Knight AND a Rook.",
    tier: "rare",
    icon: "🏇",
    piece: "n",
    phases: [2, 3, 4],
  },
  {
    id: "archbishop",
    name: "The Archbishop",
    description:
      "One of your Bishops transforms into an Archbishop — it moves as both a Bishop AND a Knight.",
    tier: "rare",
    icon: "🏛️",
    piece: "b",
    phases: [2, 3, 4],
  },

  // ── Phase 3-4 (Turn 15-20) — Powerful disruption ──
  {
    id: "queen-teleport",
    name: "Warp Queen",
    description:
      "Once per game, the Queen can teleport to any empty square on the board.",
    tier: "epic",
    icon: "🌀",
    piece: "q",
    phases: [3, 4],
  },
  {
    id: "collateral-rook",
    name: "Collateral Damage",
    description:
      "When a Rook captures, it also destroys any piece immediately behind the captured target.",
    warning:
      "Collateral hits do not capture the King — the Rook must land on the King's square directly.",
    tier: "epic",
    icon: "💥",
    piece: "r",
    phases: [3, 4],
  },
  {
    id: "bishop-bounce",
    name: "Ricochet Bishop",
    description:
      "Bishops can bounce their movement off the edge of the board once per turn.",
    tier: "epic",
    icon: "🪃",
    piece: "b",
    phases: [3, 4],
  },
  {
    id: "pawn-promotion-early",
    name: "Battlefield Promotion",
    description:
      "Pawns on the 4th rank or below (5th rank or above for black) can promote early on the 5th rank (4th for black).",
    tier: "epic",
    icon: "⭐",
    piece: "p",
    phases: [3, 4],
  },
  {
    id: "bishop-cannon",
    name: "Bishop Cannon",
    description:
      "Bishops can jump over exactly one piece on a diagonal to capture the piece behind it — Xiangqi cannon, but diagonal.",
    tier: "epic",
    icon: "🔮",
    piece: "b",
    phases: [3, 4, 5],
  },
  {
    id: "forced-en-passant",
    name: "Forced En Passant",
    description:
      "Your OPPONENT is forced to play en passant whenever it's available — it becomes their only legal move. Brick incoming!",
    tier: "rare",
    icon: "🧱",
    piece: "p",
    phases: [2, 3],
  },

  // ── Phase 4-5 (Turn 20-25) — Pure Chaos ──
  {
    id: "nuclear-queen",
    name: "Nuclear Queen",
    description:
      "When the Queen captures, all 8 surrounding squares are cleared of ALL pieces (friend AND foe).",
    warning:
      "The explosion does not kill the King — only a direct capture wins the game.",
    tier: "legendary",
    icon: "☢️",
    piece: "q",
    phases: [4, 5],
  },
  {
    id: "amazon",
    name: "The Amazon",
    description:
      "Your Queen transforms into an Amazon — she can also move like a Knight.",
    tier: "legendary",
    icon: "👸",
    piece: "q",
    phases: [4, 5],
  },
  {
    id: "knight-horde",
    name: "Knight Horde",
    description:
      "Spawn 2 extra Knights on random empty squares on your side of the board.",
    tier: "legendary",
    icon: "🐎",
    piece: "n",
    phases: [4, 5],
  },
  {
    id: "undead-army",
    name: "Undead Army",
    description:
      "Spawns all your missing pawns on random empty squares on your 2nd and 3rd ranks (6th and 7th for black). Any pawn not currently on the board will come back.",
    tier: "legendary",
    icon: "💀",
    piece: "p",
    phases: [4, 5],
  },
  {
    id: "king-ascension",
    name: "King Ascension",
    description:
      "Your King can capture like a Queen — striking any range along diagonals and files. It still moves one square at a time, so it can be checkmated.",
    tier: "legendary",
    icon: "🔱",
    piece: "k",
    phases: [4, 5],
  },
  {
    id: "rook-cannon",
    name: "Rook Cannon",
    description:
      "Rooks can jump over exactly one piece (like a cannon in Xiangqi) to capture behind it.",
    tier: "legendary",
    icon: "💣",
    piece: "r",
    phases: [4, 5],
  },
];

/* ================================================================== */
/*   Tier styling                                                       */
/* ================================================================== */

export const TIER_COLORS: Record<
  ModifierTier,
  { bg: string; border: string; text: string; glow: string }
> = {
  common: {
    bg: "bg-slate-800/60",
    border: "border-slate-600/40",
    text: "text-slate-300",
    glow: "",
  },
  rare: {
    bg: "bg-blue-950/60",
    border: "border-blue-500/40",
    text: "text-blue-400",
    glow: "shadow-blue-500/10",
  },
  epic: {
    bg: "bg-purple-950/60",
    border: "border-purple-500/40",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  legendary: {
    bg: "bg-amber-950/60",
    border: "border-amber-500/40",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
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
    draftStep: 0,
    playerAnomaly: null,
    aiAnomaly: null,
    playerAnomalyUsed: false,
    aiAnomalyUsed: false,
    playerMoonUnlocked: false,
    aiMoonUnlocked: false,
    playerImmuneSquare: null,
    playerImmuneTurnsLeft: 0,
    aiImmuneSquare: null,
    aiImmuneTurnsLeft: 0,
    playerFrozenSquare: null,
    playerFrozenTurnsLeft: 0,
    aiFrozenSquare: null,
    aiFrozenTurnsLeft: 0,
    playerWorldReady: false,
    aiWorldReady: false,
    playerTemperanceUsedThisPhase: false,
    playerCapturedForJudgement: [],
    aiCapturedForJudgement: [],
    playerNuclearCooldownUntil: 0,
    aiNuclearCooldownUntil: 0,
  };
}

/**
 * Check whether the current full-move number should trigger a draft.
 * Returns the phase number (1-5) or 0 if no trigger.
 */
export function checkDraftTrigger(
  fullMoveNumber: number,
  state: ChaosState,
): number {
  const nextPhase = state.currentPhase + 1;
  if (nextPhase > state.phaseTriggers.length) return 0;
  if (fullMoveNumber >= state.phaseTriggers[nextPhase - 1]) return nextPhase;
  return 0;
}

/**
 * Count pieces of each type for a given color from a FEN string.
 * Returns e.g. { p: 6, n: 2, b: 1, r: 2, q: 1, k: 1 }
 */
export function countPiecesFromFen(
  fen: string,
  color: "w" | "b",
): Partial<Record<PieceType, number>> {
  const board = fen.split(" ")[0];
  const counts: Partial<Record<PieceType, number>> = {};
  for (const ch of board) {
    if (ch === "/" || /\d/.test(ch)) continue;
    const isWhite = ch === ch.toUpperCase();
    if ((color === "w") !== isWhite) continue;
    const piece = ch.toLowerCase() as PieceType;
    counts[piece] = (counts[piece] ?? 0) + 1;
  }
  return counts;
}

/**
 * Get the centipawn value of a piece at a given square, accounting for
 * any chaos modifier upgrades (single-piece or type-wide).
 *
 * Single-piece identity upgrades (archbishop, knook, camel, pegasus) only
 * apply when the `assignedSquares` entry matches the given square.
 * Type-wide modifier bonuses stack as the highest applicable bonus.
 */
export function getChaosPieceValCp(
  square: string,
  pieceType: string,
  pieceColor: "w" | "b",
  mods: ChaosModifier[],
  assignedSquares?: Record<string, string | null>,
): number {
  const BASE: Record<string, number> = {
    p: 100,
    n: 325,
    b: 325,
    r: 500,
    q: 900,
    k: 20000,
  };
  const base = BASE[pieceType] ?? 100;
  if (!mods.length) return base;

  // Single-piece identity upgrades — only apply if this square is the assigned square
  const SINGLE_PIECE_VALS: Record<string, number> = {
    archbishop: 600, // bishop + knight ≈ 6 pawns (user-specified)
    knook: 800, // knight + rook ≈ 8 pawns (user-specified)
    camel: 300, // colorbound leaper ≈ 3 pawns
    pegasus: 450, // enhanced knight ≈ 4.5 pawns
  };
  if (assignedSquares) {
    for (const [modId, val] of Object.entries(SINGLE_PIECE_VALS)) {
      const key = `${pieceColor}_${modId}`;
      if (assignedSquares[key] === square && mods.some((m) => m.id === modId))
        return val;
    }
  }

  // Type-wide upgrades — largest applicable bonus wins (no stacking)
  const TYPE_BONUSES: Partial<Record<string, number>> = {
    "dragon-bishop": 50, // bishop + orthogonal step ≈ 3.75 pawns
    "dragon-rook": 60, // rook + diagonal step ≈ 5.6 pawns
    "phantom-rook": 50, // rook passes through friendlies
    "sniper-bishop": 75, // bishop captures without moving
    "bishop-bounce": 75, // bishop bounces off edges
    "bishop-cannon": 90, // bishop diagonal cannon capture
    "collateral-rook": 100, // rook captures destroy piece behind ≈ 6 pawns
    "rook-cannon": 100, // rook jumps to capture ≈ 6 pawns
    "nuclear-queen": 200, // queen captures clear 8 squares ≈ 11 pawns
    amazon: 150, // queen + knight ≈ 10.5 pawns
    "queen-teleport": 50, // queen teleports once
    "king-ascension": 5000, // king captures like queen
    "pawn-charge": 10,
    "pawn-capture-forward": 15,
  };
  let bonus = 0;
  for (const mod of mods) {
    if (mod.piece === (pieceType as PieceType)) {
      const b = TYPE_BONUSES[mod.id];
      if (b !== undefined && b > bonus) bonus = b;
    }
  }
  return base + bonus;
}

/**
 * Roll 3 random modifier choices for a given phase.
 * Avoids modifiers already drafted by the given side.
 * When pieceCounts is provided, ensures at least one choice is viable
 * (targets a piece the player still has on the board) and down-weights
 * modifiers for pieces the player has zero of.
 */
export function rollDraftChoices(
  phase: number,
  alreadyDrafted: ChaosModifier[],
  seed?: number,
  pieceCounts?: Partial<Record<PieceType, number>>,
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

  if (!pieceCounts) return shuffled.slice(0, 3);

  // Split into viable (has the piece or global) and non-viable (0 of target piece)
  const isViable = (m: ChaosModifier) =>
    m.piece === null || (pieceCounts[m.piece] ?? 0) > 0;
  const viable = shuffled.filter(isViable);
  const nonViable = shuffled.filter((m) => !isViable(m));

  // Build result: take from viable first, pad with non-viable if needed
  const result: ChaosModifier[] = [];
  for (const m of viable) {
    if (result.length >= 3) break;
    result.push(m);
  }
  for (const m of nonViable) {
    if (result.length >= 3) break;
    result.push(m);
  }

  return result;
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
 * In multiplayer mode (skipOpponentRoll=true), only add the player's pick —
 * the opponent picks for themselves independently.
 */
export function applyDraft(
  state: ChaosState,
  playerChoice: ChaosModifier,
  phase: number,
  options?: { skipOpponentRoll?: boolean },
): ChaosState {
  const newState = { ...state };

  // Player picks their modifier
  newState.playerModifiers = [...state.playerModifiers, playerChoice];

  if (!options?.skipOpponentRoll) {
    // AI picks the highest-tier remaining option it hasn't drafted
    const aiChoices = rollDraftChoices(phase, state.aiModifiers, Date.now());
    const aiPick =
      aiChoices.sort((a, b) => tierValue(b.tier) - tierValue(a.tier))[0] ??
      aiChoices[0];
    if (aiPick) {
      newState.aiModifiers = [...state.aiModifiers, aiPick];
    }
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
 * Update tracked piece squares after a move.
 * Call after every move to keep assignedSquares in sync.
 *
 * @param from - square the piece moved from
 * @param to   - square the piece moved to
 * @param captured - whether the move was a capture
 */
export function updateTrackedPieces(
  state: ChaosState,
  from: string,
  to: string,
  captured: boolean,
): ChaosState {
  if (!state.assignedSquares || Object.keys(state.assignedSquares).length === 0)
    return state;
  const newSquares = { ...state.assignedSquares };
  let changed = false;

  for (const [key, square] of Object.entries(newSquares)) {
    if (square === null || square === undefined) continue;

    if (from === square) {
      // The tracked piece moved
      newSquares[key] = to;
      changed = true;
    } else if (to === square && captured) {
      // A capture happened at the tracked square — tracked piece was captured
      newSquares[key] = null;
      changed = true;
    }
  }

  return changed ? { ...state, assignedSquares: newSquares } : state;
}

/**
 * Initialize tracked-piece square when a single-piece modifier is drafted.
 * E.g. for "archbishop" with color "w", records which bishop square is the archbishop.
 */
export function initTrackedPiece(
  state: ChaosState,
  modId: string,
  color: "w" | "b",
  square: string,
): ChaosState {
  return {
    ...state,
    assignedSquares: {
      ...(state.assignedSquares ?? {}),
      [`${color}_${modId}`]: square,
    },
  };
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
    case 1:
      return "Early Game — Movement Buffs";
    case 2:
      return "Early-Mid — Positioning";
    case 3:
      return "Mid Game — Disruption";
    case 4:
      return "Late-Mid — Power Spike";
    case 5:
      return "Late Game — Pure Chaos";
    default:
      return "Draft Phase";
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
