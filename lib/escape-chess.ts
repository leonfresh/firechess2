/**
 * Escape Chess — Extraction Raid Mode
 *
 * A chess variant inspired by Escape from Tarkov.
 * You are a PMC raiding enemy territory (the chessboard).
 * Objective: Move your King to the extraction zone before time runs out.
 * Captures drop loot (chaos modifiers).
 * Enemy reinforcements arrive every N moves.
 */

import type { ChaosModifier } from "@/lib/chaos-chess";
import { ALL_MODIFIERS } from "@/lib/chaos-chess";

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export type RaidDifficulty = "scav" | "pmc" | "boss";

export type RaidStatus = "lobby" | "briefing" | "playing" | "loot" | "extracted" | "wiped";

export interface RaidConfig {
  id: RaidDifficulty;
  name: string;
  subtitle: string;
  icon: string;
  /** Stockfish depth */
  depth: number;
  /** Max player moves before the raid fails */
  moveLimit: number;
  /** Enemy starts with this many random chaos mods */
  enemyStartMods: number;
  /** Enemy gains another mod every N player moves */
  reinforcementEvery: number;
  /** Number of checks the player can survive before wiping */
  maxHits: number;
  description: string;
  /** Thematic flavour for the briefing screen */
  briefing: string;
  flavorColor: string;
  /** Full starting FEN for the whole board (both sides). */
  startingFen: string | null;
}

export interface RaidState {
  status: RaidStatus;
  difficulty: RaidDifficulty;
  /** Chaos modifiers the player has looted from captures */
  playerMods: ChaosModifier[];
  /** Chaos modifiers the enemy has received as reinforcements */
  enemyMods: ChaosModifier[];
  /** Number of player half-moves executed */
  movesUsed: number;
  /** Enemy reinforcement counter (reset every reinforcementEvery moves) */
  movesSinceReinforcement: number;
  /** Remaining check survivals */
  hitsRemaining: number;
  /** Pending loot choices — shown when player captures a piece */
  pendingLootChoices: ChaosModifier[] | null;
  /** The piece type that was just looted (for flavor text) */
  pendingLootPiece: string | null;
  /** Which extraction zone is active this raid ("alfa" | "bravo") */
  activeZone: "alfa" | "bravo";
  /** Accumulated event log messages */
  eventLog: RaidEventEntry[];
  /** How many pieces the player extracted with (captured enemy pieces count) */
  lootedPieceCount: number;
}

export interface RaidEventEntry {
  id: number;
  type: "info" | "loot" | "reinforcement" | "danger" | "extraction";
  message: string;
  icon?: string;
}

/* ================================================================== */
/*  Raid configurations                                                 */
/* ================================================================== */

/** Standard starting FEN */
const STANDARD_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * SCAV RUN — beginner-friendly fight.
 * Black: King + Bishop + 6 pawns (no rooks/knights — hittable targets).
 * White (player): King + Knight + 4 pawns — knight can actually capture pawns/bishop.
 */
const SCAV_FEN = "2b1k3/pp2pppp/8/8/8/8/2PP1PP1/1N2K3 w - - 0 1";

/**
 * PMC RAID — standard enemy, player has king + pawns + 1 bishop + 1 knight.
 * No queen, no rooks — recruit them from captures.
 */
const PMC_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/2B1KN2 w - - 0 1";

export const RAID_CONFIGS: Record<RaidDifficulty, RaidConfig> = {
  scav: {
    id: "scav",
    name: "SCAV RUN",
    subtitle: "Build your army from nothing",
    icon: "🧟",
    depth: 3,
    moveLimit: 60,
    enemyStartMods: 0,
    reinforcementEvery: 99,
    maxHits: 4,
    description: "You drop in light — King, Knight, and 4 pawns. The area is mostly cleared: just a bishop and some pawns standing between you and extraction.",
    briefing: "Light kit — King, Knight, and 4 pawns. Enemy is a skeleton crew: bishop and pawns only. Use your knight to capture their pieces, recruit them, then push to the extraction zone.",
    flavorColor: "text-emerald-400",
    startingFen: SCAV_FEN,
  },
  pmc: {
    id: "pmc",
    name: "PMC RAID",
    subtitle: "Standard loadout, fight to grow",
    icon: "⚔️",
    depth: 7,
    moveLimit: 45,
    enemyStartMods: 1,
    reinforcementEvery: 12,
    maxHits: 3,
    description: "You have a partial loadout — pawns, bishop, knight. Enemy has full squad. Recruit heavy pieces from the battlefield.",
    briefing: "Full hostile PMC activity. You're missing your heavy arms — recruit them by taking down enemy pieces. Reinforcements arrive every 12 moves. Move fast.",
    flavorColor: "text-amber-400",
    startingFen: PMC_FEN,
  },
  boss: {
    id: "boss",
    name: "BOSS RAID",
    subtitle: "Maximum risk, maximum loot",
    icon: "💀",
    depth: 14,
    moveLimit: 30,
    enemyStartMods: 2,
    reinforcementEvery: 8,
    maxHits: 1,
    description: "The Boss is in. You start with full kit, but so does the enemy — plus elite mods. Only the best PMCs survive.",
    briefing: "WARNING: BOSS CONFIRMED. You have your full army but the Boss has enhanced weaponry from the start. One hit and you're done. Do you accept?",
    flavorColor: "text-red-400",
    startingFen: STANDARD_FEN,
  },
};

/* ================================================================== */
/*  Extraction zones                                                     */
/* ================================================================== */

/** Extraction squares for White (player) — must land King here to extract */
export const EXTRACTION_ZONES: Record<"alfa" | "bravo", string[]> = {
  alfa: ["g8", "h8"],
  bravo: ["a8", "b8"],
};

/** Randomly pick one zone per raid */
export function rollExtractionZone(): "alfa" | "bravo" {
  return Math.random() < 0.5 ? "alfa" : "bravo";
}

/* ================================================================== */
/*  Loot tables                                                         */
/* ================================================================== */

/** Loot tiers available for each captured piece type */
const LOOT_TIER_BY_PIECE: Record<string, Array<"common" | "rare" | "epic" | "legendary">> = {
  p: ["common"],
  n: ["common", "rare"],
  b: ["common", "rare"],
  r: ["rare", "epic"],
  q: ["epic", "legendary"],
};

function pickFromTiers(tiers: Array<"common" | "rare" | "epic" | "legendary">): ChaosModifier | null {
  const pool = ALL_MODIFIERS.filter((m) => tiers.includes(m.tier));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Roll 2 distinct loot choices for capturing a piece of the given type.
 * Returns null if the given type is the King (no loot from kings).
 */
export function rollLootChoices(
  capturedPieceType: string,
  existing: ChaosModifier[],
): ChaosModifier[] | null {
  if (capturedPieceType === "k") return null;
  const tiers = LOOT_TIER_BY_PIECE[capturedPieceType] ?? ["common"];

  const existingIds = new Set(existing.map((m) => m.id));
  const pool = ALL_MODIFIERS.filter(
    (m) => tiers.includes(m.tier) && !existingIds.has(m.id),
  );
  if (!pool.length) return null;

  // Shuffle and take 2
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(2, shuffled.length));
}

/* ================================================================== */
/*  Enemy reinforcement mods (random from pool)                        */
/* ================================================================== */

/**
 * Pick a random mod for the enemy (AI) to gain as a reinforcement.
 * Prefers mods from the "common" and "rare" tiers to avoid instant overwhelm.
 */
export function rollEnemyReinforcement(existing: ChaosModifier[]): ChaosModifier | null {
  const existingIds = new Set(existing.map((m) => m.id));
  const pool = ALL_MODIFIERS.filter(
    (m) => (m.tier === "common" || m.tier === "rare") && !existingIds.has(m.id),
  );
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ================================================================== */
/*  State factory                                                       */
/* ================================================================== */

export function createRaidState(difficulty: RaidDifficulty): RaidState {
  return {
    status: "briefing",
    difficulty,
    playerMods: [],
    enemyMods: [],
    movesUsed: 0,
    movesSinceReinforcement: 0,
    hitsRemaining: RAID_CONFIGS[difficulty].maxHits,
    pendingLootChoices: null,
    pendingLootPiece: null,
    activeZone: rollExtractionZone(),
    eventLog: [],
    lootedPieceCount: 0,
  };
}

/* ================================================================== */
/*  Piece display names for event log                                   */
/* ================================================================== */

export const PIECE_NAMES: Record<string, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};

export const PIECE_LOOT_FLAVOR: Record<string, string[]> = {
  p: ["Grabbed basic ammo", "Found some meds", "Scavenged gear"],
  n: ["Looted a rare attachment", "Found tactical mods", "Grabbed combat gear"],
  b: ["Secured field intel", "Found a rare scope", "Looted advanced kit"],
  r: ["Heavy loot secured", "Found premium gear", "Acquired tactical upgrade"],
  q: ["EPIC DROP — elite cache", "Found legendary intel", "Premium extraction loot"],
};

export function getLootFlavor(pieceType: string): string {
  const flavors = PIECE_LOOT_FLAVOR[pieceType] ?? ["Found some loot"];
  return flavors[Math.floor(Math.random() * flavors.length)];
}

/* ================================================================== */
/*  Wipe flavor text                                                    */
/* ================================================================== */

export const WIPE_REASONS = {
  checkmate: [
    "Surrounded and eliminated. No extraction.",
    "Outmaneuvered. Hostile forces overwhelmed your position.",
    "Checkmated. Better luck next raid.",
  ],
  timelimit: [
    "Extraction zone went hot. You ran out of time.",
    "Time expired. Reinforcements cut off all exits.",
    "Raid timeout. You're staying in Norvinsk.",
  ],
  overthrown: [
    "King taken. Hostile agent eliminated you.",
    "You were identified and neutralized.",
    "Direct engagement — you lost.",
  ],
  hits: [
    "Injuries too severe. You bled out before extraction.",
    "Check count exceeded. Trauma bled you dry.",
    "One too many near-misses. KIA.",
  ],
};

export const EXTRACT_FLAVOR = [
  "Successful extraction! Loot secured.",
  "Made it out alive. Well played operator.",
  "EXTRACTION SUCCESSFUL — gear intact.",
  "You survived the raid. The loot is yours.",
];

export function getRandomFlavor(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
