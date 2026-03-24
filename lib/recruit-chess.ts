/**
 * Recruit Chess — The Bazaar meets chess.
 *
 * Draft your army from a rotating shop, attach chaos modifiers to each piece,
 * upgrade duplicates (bronze → silver → gold), then watch Stockfish battle
 * your chaos-powered army vs ghost opponents in fully animated chess fights.
 */

import { Chess, type Square } from "chess.js";
import {
  ALL_MODIFIERS,
  type ChaosModifier,
  type ChaosState,
  type PieceType,
  createChaosState,
  TIER_COLORS,
} from "./chaos-chess";

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export type UpgradeTier = "bronze" | "silver" | "gold";

export type CommanderId =
  | "tactician"
  | "fortress"
  | "gambit-king"
  | "endgame-wizard"
  | "swarm";

export interface RecruitedPiece {
  /** Unique instance ID for this piece card in the army */
  id: string;
  pieceType: PieceType;
  modifierId: string;
  /** Merged upgrade tier: 3 dupes → silver, 3 silvers → gold */
  tier: UpgradeTier;
  /** Slot index in the army board (null = bench) */
  slot: number | null;
}

export interface ShopSlot {
  id: string;
  pieceType: PieceType;
  modifierId: string;
  /** Tier of the underlying modifier (common/rare/epic/legendary) */
  modifierTier: ChaosModifier["tier"];
  cost: number;
  frozen: boolean;
}

export interface Commander {
  id: CommanderId;
  name: string;
  tagline: string;
  passive: string;
  passiveIcon: string;
  /** Starting pieces (given for free before round 1) */
  startingPieces: Array<{
    pieceType: PieceType;
    modifierId: string;
    tier: UpgradeTier;
  }>;
  icon: string;
  bgGradient: string;
  borderClass: string;
  accentColor: string;
  glowColor: string;
}

export type EncounterType =
  | "docks"
  | "blacksmith"
  | "tavern"
  | "shrine"
  | "library"
  | "forge"
  | "arena"
  | "treasure-vault"
  | "cursed-altar";

export interface EncounterChoice {
  id: string;
  type: EncounterType;
  title: string;
  description: string;
  icon: string;
  /** +N gold for docks / arena / treasure-vault */
  goldGain?: number;
  /** Free piece for tavern / treasure-vault / cursed-altar */
  freePiece?: { pieceType: PieceType; modifierId: string; tier: UpgradeTier };
  /** Modifier id to imbue for shrine */
  shrineModifierId?: string;
  /** Library: gold cost to upgrade one piece (bronze → silver) */
  upgradeGoldCost?: number;
  /** Arena: gold earned per surviving piece from last battle */
  arenaGoldPerSurvivor?: number;
  /** Cursed-altar: HP sacrifice cost */
  hpCost?: number;
  /** Cursed-altar: extra gold from the pact */
  boonGold?: number;
}

export interface RecruitGameState {
  phase:
    | "commander-select"
    | "shop"
    | "arrange"
    | "fight"
    | "encounter"
    | "round-result"
    | "game-over";
  round: number;
  hp: number;
  gold: number;
  maxArmySlots: number;
  commander: CommanderId | null;
  army: RecruitedPiece[];
  bench: RecruitedPiece[];
  shop: ShopSlot[];
  shopTier: number;
  winStreak: number;
  loseStreak: number;
  roundResults: RoundResult[];
  fightResult: FightResult | null;
  ghostOpponent: GhostBuild | null;
  /** FEN for the arrange phase (player can drag pieces before fighting) */
  arrangeFen?: string;
  /** Present when phase === "encounter" */
  pendingEncounterChoices?: EncounterChoice[];
}

export interface FightResult {
  won: boolean;
  reason: "checkmate" | "material" | "stalemate" | "timeout";
  hpDamageTaken: number;
  hpDamageDealt: number;
  replayMoves: FightMove[];
  playerSurvivingPieces: number;
  opponentSurvivingPieces: number;
}

export interface FightMove {
  /** FEN *before* this move is applied */
  fen: string;
  from: string;
  to: string;
  isCapture: boolean;
  isChaosMove: boolean;
  chaosLabel?: string;
  /** Side that just moved: "player" = white, "opponent" = black */
  side: "player" | "opponent";
  annotation?: string;
  /** Any squares cleared as a side-effect (nuclear queen, railgun) */
  sideEffectSquares?: string[];
}

export interface GhostBuild {
  displayName: string;
  commander: CommanderId;
  army: Array<{
    pieceType: PieceType;
    modifierId: string;
    tier: UpgradeTier;
  }>;
  round: number;
  rating: number;
  isAI: boolean;
  /** True for special boss fights (rounds 3, 6, 8) */
  isBoss?: boolean;
  /** Boss display title */
  bossTitle?: string;
  /** Flavour text shown before the boss fight */
  bossTagline?: string;
}

export interface RoundResult {
  round: number;
  won: boolean;
  hpChange: number;
  ghostName: string;
}

/* ================================================================== */
/*  Upgrade tier styling                                                */
/* ================================================================== */

export const UPGRADE_TIER_STYLES: Record<
  UpgradeTier,
  {
    bg: string;
    border: string;
    text: string;
    glow: string;
    label: string;
    icon: string;
  }
> = {
  bronze: {
    bg: "bg-amber-950/50",
    border: "border-amber-700/40",
    text: "text-amber-600",
    glow: "",
    label: "Bronze",
    icon: "🥉",
  },
  silver: {
    bg: "bg-slate-800/60",
    border: "border-slate-400/40",
    text: "text-slate-300",
    glow: "shadow-slate-400/20",
    label: "Silver",
    icon: "🥈",
  },
  gold: {
    bg: "bg-yellow-950/60",
    border: "border-yellow-400/50",
    text: "text-yellow-300",
    glow: "shadow-yellow-400/30",
    label: "Gold",
    icon: "🥇",
  },
};

/* ================================================================== */
/*  Commander Definitions                                               */
/* ================================================================== */

export const COMMANDERS: Commander[] = [
  {
    id: "tactician",
    name: "The Tactician",
    tagline: "Every knight is a weapon.",
    passive:
      "Knight modifier cards cost 1 less gold (min 1). Your starting knight comes pre-upgraded to Silver.",
    passiveIcon: "🧠",
    startingPieces: [
      { pieceType: "n", modifierId: "camel", tier: "silver" },
      { pieceType: "p", modifierId: "pawn-charge", tier: "bronze" },
      { pieceType: "p", modifierId: "pawn-charge", tier: "bronze" },
    ],
    icon: "🧠",
    bgGradient: "from-blue-950/90 to-cyan-900/50",
    borderClass: "border-blue-400/40",
    accentColor: "text-blue-400",
    glowColor: "rgba(59,130,246,0.35)",
  },
  {
    id: "fortress",
    name: "The Fortress",
    tagline: "Your pawns are walls. Your rooks are cannons.",
    passive:
      "Start with an extra pawn slot unlocked. Rook modifiers appear twice as often in your shop.",
    passiveIcon: "🏰",
    startingPieces: [
      { pieceType: "r", modifierId: "dragon-rook", tier: "bronze" },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier: "bronze" },
      { pieceType: "p", modifierId: "pawn-charge", tier: "bronze" },
    ],
    icon: "🏰",
    bgGradient: "from-stone-950/90 to-gray-900/50",
    borderClass: "border-stone-400/40",
    accentColor: "text-stone-300",
    glowColor: "rgba(168,162,158,0.35)",
  },
  {
    id: "gambit-king",
    name: "The Gambit King",
    tagline: "High risk. Higher reward.",
    passive:
      "Start with 2 less HP but Epic+ modifier cards appear 40% more often in your shop.",
    passiveIcon: "💀",
    startingPieces: [
      { pieceType: "b", modifierId: "bishop-cannon", tier: "silver" },
      { pieceType: "n", modifierId: "night-rider", tier: "bronze" },
    ],
    icon: "👑",
    bgGradient: "from-red-950/90 to-rose-900/50",
    borderClass: "border-red-500/40",
    accentColor: "text-red-400",
    glowColor: "rgba(239,68,68,0.4)",
  },
  {
    id: "endgame-wizard",
    name: "The Endgame Wizard",
    tagline: "Slow build. Unstoppable finish.",
    passive:
      "Every 3 rounds, your King automatically gains a random modifier from the legendary pool.",
    passiveIcon: "🔮",
    startingPieces: [
      { pieceType: "b", modifierId: "dragon-bishop", tier: "bronze" },
      { pieceType: "b", modifierId: "dragon-bishop", tier: "bronze" },
      { pieceType: "p", modifierId: "pawn-charge", tier: "bronze" },
    ],
    icon: "🔮",
    bgGradient: "from-violet-950/90 to-purple-900/50",
    borderClass: "border-violet-500/40",
    accentColor: "text-violet-400",
    glowColor: "rgba(139,92,246,0.4)",
  },
  {
    id: "swarm",
    name: "The Swarm",
    tagline: "Death by a thousand cuts.",
    passive:
      "Upgrades trigger at 2 identical cards instead of 3. Start with 4 pawn cards.",
    passiveIcon: "🐝",
    startingPieces: [
      { pieceType: "p", modifierId: "pawn-charge", tier: "bronze" },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier: "bronze" },
      { pieceType: "p", modifierId: "pawn-charge", tier: "bronze" },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier: "bronze" },
    ],
    icon: "🐝",
    bgGradient: "from-yellow-950/90 to-amber-900/50",
    borderClass: "border-yellow-500/40",
    accentColor: "text-yellow-400",
    glowColor: "rgba(234,179,8,0.4)",
  },
];

export function getCommander(id: CommanderId): Commander {
  return COMMANDERS.find((c) => c.id === id)!;
}

/* ================================================================== */
/*  Shop modifier pool: which modifiers map to which piece types        */
/* ================================================================== */

/**
 * Modifier cards available per piece type in the Recruit shop.
 * Each entry: { modifierId, weight (higher = more common) }
 * Weights sum controls relative probability.
 */
const PIECE_MOD_POOL: Record<
  PieceType,
  Array<{ modifierId: string; weight: number }>
> = {
  p: [
    { modifierId: "pawn-charge", weight: 10 },
    { modifierId: "pawn-capture-forward", weight: 10 },
    { modifierId: "pawn-promotion-early", weight: 4 },
  ],
  n: [
    { modifierId: "camel", weight: 8 },
    { modifierId: "night-rider", weight: 5 },
  ],
  b: [
    { modifierId: "dragon-bishop", weight: 8 },
    { modifierId: "bishop-bounce", weight: 5 },
    { modifierId: "bishop-cannon", weight: 4 },
  ],
  r: [
    { modifierId: "dragon-rook", weight: 8 },
    { modifierId: "phantom-rook", weight: 5 },
    { modifierId: "collateral-rook", weight: 4 },
    { modifierId: "rook-cannon", weight: 4 },
    { modifierId: "railgun", weight: 2 },
  ],
  q: [
    { modifierId: "amazon", weight: 2 },
    { modifierId: "nuclear-queen", weight: 2 },
  ],
  k: [
    { modifierId: "kings-chains", weight: 3 },
    { modifierId: "king-ascension", weight: 2 },
  ],
};

/** Piece costs by type */
export const PIECE_COSTS: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 4,
  q: 5,
  k: 6,
};

/** Extra gold cost based on modifier tier */
const MODIFIER_TIER_PREMIUM: Record<string, number> = {
  common: 0,
  rare: 1,
  epic: 1,
  legendary: 2,
};

/** Which piece types appear in the shop at each shop tier */
const SHOP_TIER_PIECE_POOL: Record<number, PieceType[]> = {
  1: ["p", "p", "p", "n", "b"],
  2: ["p", "n", "b", "b", "r"],
  3: ["n", "b", "r", "r", "r"],
  4: ["r", "r", "q", "b", "k"],
  5: ["r", "q", "q", "k", "k"],
};

/**
 * Minimum shop tier required for a modifier to appear.
 * Legendary modifiers are gated behind late-game tiers so they feel earned.
 */
const MODIFIER_MIN_SHOP_TIER: Record<string, number> = {
  amazon: 4,
  "nuclear-queen": 4,
  railgun: 3,
  "king-ascension": 4,
  "kings-chains": 4,
  "rook-cannon": 3,
  "night-rider": 2,
};

function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let rand = Math.random() * total;
  for (const item of items) {
    rand -= item.weight;
    if (rand <= 0) return item;
  }
  return items[items.length - 1];
}

function genSlotId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Generate a fresh 5-slot shop for the given round / shop tier */
export function generateShop(
  round: number,
  commanderId: CommanderId,
  existingShop: ShopSlot[],
): ShopSlot[] {
  const tier = Math.min(5, Math.ceil(round / 2));
  const piecePool = SHOP_TIER_PIECE_POOL[tier] ?? SHOP_TIER_PIECE_POOL[1];

  const slots: ShopSlot[] = [];

  for (let i = 0; i < 5; i++) {
    // Check if this slot was frozen from the previous shop
    const previousSlot = existingShop[i];
    if (previousSlot?.frozen) {
      slots.push({ ...previousSlot, frozen: false });
      continue;
    }

    // Pick a random piece type from the tier's pool
    const pieceType = piecePool[
      Math.floor(Math.random() * piecePool.length)
    ] as PieceType;

    // Pick a compatible modifier (filter by shop tier restrictions)
    const currentShopTier = Math.min(5, Math.ceil(round / 2));
    const rawModPool = PIECE_MOD_POOL[pieceType] ?? [
      { modifierId: "pawn-charge", weight: 1 },
    ];
    const filteredModPool = rawModPool.filter(
      (entry) =>
        (MODIFIER_MIN_SHOP_TIER[entry.modifierId] ?? 1) <= currentShopTier,
    );
    const modPool = filteredModPool.length > 0 ? filteredModPool : rawModPool;
    const picked = weightedPick(modPool);
    const modDef = ALL_MODIFIERS.find((m) => m.id === picked.modifierId);
    const tierPremium = MODIFIER_TIER_PREMIUM[modDef?.tier ?? "common"] ?? 0;
    const cost =
      PIECE_COSTS[pieceType] +
      tierPremium +
      (commanderId === "tactician" && pieceType === "n" ? -1 : 0);

    slots.push({
      id: genSlotId(),
      pieceType,
      modifierId: picked.modifierId,
      modifierTier: modDef?.tier ?? "common",
      cost: Math.max(1, cost),
      frozen: false,
    });
  }

  return slots;
}

/** Reroll shop slots (unfrozen only) */
export function rerollShop(
  shop: ShopSlot[],
  round: number,
  commanderId: CommanderId,
): ShopSlot[] {
  const newShop = generateShop(round, commanderId, shop);
  // Preserve frozen slots
  return newShop.map((slot, i) => (shop[i]?.frozen ? shop[i] : slot));
}

/* ================================================================== */
/*  Army management helpers                                             */
/* ================================================================== */

/** Check if purchasing a piece would trigger an upgrade (2 or 3 matching cards) */
export function checkUpgrade(
  army: RecruitedPiece[],
  bench: RecruitedPiece[],
  incomingPiece: { pieceType: PieceType; modifierId: string },
  commanderId: CommanderId,
): {
  shouldUpgrade: boolean;
  upgradeFrom: UpgradeTier;
  upgradeTo: UpgradeTier;
  matchingIds: string[];
} | null {
  const threshold = commanderId === "swarm" ? 2 : 3;
  const all = [...army, ...bench];

  // Find matching pieces (same type + same modifier)
  const matching = all.filter(
    (p) =>
      p.pieceType === incomingPiece.pieceType &&
      p.modifierId === incomingPiece.modifierId,
  );

  if (matching.length + 1 >= threshold) {
    // Find the tier of existing pieces
    const tiers = matching.map((p) => p.tier);
    const lowestTier: UpgradeTier =
      tiers.includes("bronze") || tiers.length === 0
        ? "bronze"
        : tiers.includes("silver")
          ? "silver"
          : "gold";

    const upgradeTo: UpgradeTier =
      lowestTier === "bronze"
        ? "silver"
        : lowestTier === "silver"
          ? "gold"
          : "gold";

    if (lowestTier === "gold") return null; // already max

    return {
      shouldUpgrade: true,
      upgradeFrom: lowestTier,
      upgradeTo,
      matchingIds: matching.slice(0, threshold - 1).map((p) => p.id),
    };
  }

  return null;
}

/** Create initial game state for a new Recruit Chess run */
export function createInitialGameState(
  commanderId: CommanderId,
): RecruitGameState {
  const commander = getCommander(commanderId);
  const isGambit = commanderId === "gambit-king";

  // Build starting army from commander's pieces
  const army: RecruitedPiece[] = commander.startingPieces.map((sp, i) => ({
    id: `start-${i}`,
    pieceType: sp.pieceType,
    modifierId: sp.modifierId,
    tier: sp.tier,
    slot: i,
  }));

  return {
    phase: "shop",
    round: 1,
    hp: isGambit ? 8 : 10,
    gold: 3,
    maxArmySlots: commanderId === "fortress" ? 7 : 6,
    commander: commanderId,
    army,
    bench: [],
    shop: generateShop(1, commanderId, []),
    shopTier: 1,
    winStreak: 0,
    loseStreak: 0,
    roundResults: [],
    fightResult: null,
    ghostOpponent: null,
  };
}

/** Gold income per round (passive + streak bonuses) */
export function calcGoldIncome(
  round: number,
  winStreak: number,
  loseStreak: number,
): number {
  const base = Math.min(5, 3 + Math.floor(round / 3));
  const streakBonus =
    winStreak >= 4 ? 3 : winStreak >= 3 ? 2 : winStreak >= 2 ? 1 : 0;
  return base + streakBonus;
}

/* ================================================================== */
/*  Fight FEN builder                                                   */
/* ================================================================== */

/**
 * Build a valid starting FEN for the fight from two armies.
 *
 * White = player's army, positioned on ranks 1-2.
 * Black = ghost opponent, positioned on ranks 7-8 (mirrored).
 *
 * The King is always placed on the e-file. Non-pawn pieces fill rank 1
 * outward from e1. Pawns fill rank 2. Overflow non-pawns go on rank 3.
 */
export function buildFightFen(
  playerArmy: Array<Pick<RecruitedPiece, "pieceType">>,
  opponentArmy: Array<Pick<RecruitedPiece, "pieceType">>,
): string {
  // 8x8 board: board[rank][file] where rank 0 = rank 1, rank 7 = rank 8
  const board: Array<Array<string | null>> = Array.from({ length: 8 }, () =>
    Array(8).fill(null),
  );

  function placeArmy(
    pieces: Array<Pick<RecruitedPiece, "pieceType">>,
    isWhite: boolean,
  ) {
    const color = isWhite ? 1 : -1; // 1 = white, -1 = black side
    const rank1 = isWhite ? 0 : 7; // rank index for main row
    const rank2 = isWhite ? 1 : 6; // pawn row
    const rank3 = isWhite ? 2 : 5; // overflow row

    const toFenChar = (type: PieceType) =>
      isWhite ? type.toUpperCase() : type.toLowerCase();

    // Always put king on e-file (file 4)
    board[rank1][4] = toFenChar("k");

    // Separate pieces
    const nonPawnNonKing = pieces
      .filter((p) => p.pieceType !== "p" && p.pieceType !== "k")
      .map((p) => p.pieceType);
    const pawns = pieces
      .filter((p) => p.pieceType === "p")
      .map((p) => p.pieceType);

    // Non-pawn pieces fill rank 1 outward from e: d, f, c, g, b, h, a
    const rank1Slots = [3, 5, 2, 6, 1, 7, 0]; // file indices excluding e(4)
    let r1Idx = 0;
    const rank3Pieces: PieceType[] = [];

    for (const pt of nonPawnNonKing) {
      if (r1Idx < rank1Slots.length) {
        board[rank1][rank1Slots[r1Idx++]] = toFenChar(pt as PieceType);
      } else {
        rank3Pieces.push(pt as PieceType);
      }
    }

    // Pawns on rank 2 (a2–h2), max 8
    const pawnCount = Math.min(8, pawns.length);
    for (let f = 0; f < pawnCount; f++) {
      board[rank2][f] = toFenChar("p");
    }

    // Overflow non-pawns go on rank 3
    for (let i = 0; i < rank3Pieces.length && i < 8; i++) {
      // Find next empty rank3 slot
      for (let f = 0; f < 8; f++) {
        if (!board[rank3][f]) {
          board[rank3][f] = toFenChar(rank3Pieces[i]);
          break;
        }
      }
    }
    void color; // suppress unused warning
  }

  placeArmy(playerArmy, true);
  placeArmy(opponentArmy, false);

  // Encode board to FEN piece placement (rank 8 → rank 1)
  const ranks: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let rowStr = "";
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        if (empty > 0) {
          rowStr += empty;
          empty = 0;
        }
        rowStr += piece;
      } else {
        empty++;
      }
    }
    if (empty > 0) rowStr += empty;
    ranks.push(rowStr);
  }

  // No castling rights (pieces not in standard positions), no en passant
  return `${ranks.join("/")} w - - 0 1`;
}

/* ================================================================== */
/*  Extract modifiers from army into a ChaosState                      */
/* ================================================================== */

/**
 * Build a ChaosState from a recruited army.
 * Multiple copies of the same modifier: highest upgrade tier wins.
 * Gold-tier upgrade: modifier gets a synthetic "legendary" override.
 */
export function extractChaosStateFromArmy(
  playerArmy: Array<Pick<RecruitedPiece, "pieceType" | "modifierId" | "tier">>,
  opponentArmy: Array<
    Pick<RecruitedPiece, "pieceType" | "modifierId" | "tier">
  >,
): ChaosState {
  function buildMods(
    army: Array<Pick<RecruitedPiece, "pieceType" | "modifierId" | "tier">>,
  ): ChaosModifier[] {
    // Collect unique modifiers, keeping the highest upgrade tier version
    const seen = new Map<
      string,
      { tier: UpgradeTier; mod: ChaosModifier | null }
    >();
    for (const piece of army) {
      const baseMod = ALL_MODIFIERS.find((m) => m.id === piece.modifierId);
      if (!baseMod) continue;
      const existing = seen.get(piece.modifierId);
      const tierOrder: UpgradeTier[] = ["bronze", "silver", "gold"];
      if (
        !existing ||
        tierOrder.indexOf(piece.tier) > tierOrder.indexOf(existing.tier)
      ) {
        seen.set(piece.modifierId, { tier: piece.tier, mod: baseMod });
      }
    }

    const result: ChaosModifier[] = [];
    for (const [, { tier, mod }] of seen) {
      if (!mod) continue;
      // Gold upgrade = legendary tier visual/priority (modifier effect stays the same)
      const upgradedMod: ChaosModifier =
        tier === "gold" ? { ...mod, tier: "legendary" } : mod;
      result.push(upgradedMod);
    }
    return result;
  }

  const cs = createChaosState();
  return {
    ...cs,
    playerModifiers: buildMods(playerArmy),
    aiModifiers: buildMods(opponentArmy),
    // All phases already "active" since modifiers are pre-loaded for the fight
    currentPhase: 5,
    isDrafting: false,
  };
}

/* ================================================================== */
/*  Material counting                                                   */
/* ================================================================== */

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/** Count total material value for one side */
export function countMaterial(game: Chess, color: "w" | "b"): number {
  let total = 0;
  for (const row of game.board()) {
    for (const sq of row) {
      if (sq && sq.color === color) {
        total += PIECE_VALUES[sq.type] ?? 0;
      }
    }
  }
  return total;
}

/** Count surviving piece count (non-king) for a side */
export function countPieces(game: Chess, color: "w" | "b"): number {
  let count = 0;
  for (const row of game.board()) {
    for (const sq of row) {
      if (sq && sq.color === color && sq.type !== "k") count++;
    }
  }
  return count;
}

/* ================================================================== */
/*  HP damage calculation                                               */
/* ================================================================== */

/**
 * How much HP damage the loser takes:
 * = 1 + (winner's surviving non-king pieces)
 */
export function calcHpDamage(game: Chess, winnerColor: "w" | "b"): number {
  return 1 + countPieces(game, winnerColor);
}

/* ================================================================== */
/*  Ghost opponent generation                                           */
/* ================================================================== */

/* ================================================================== */
/*  Boss builds                                                         */
/* ================================================================== */

export function isBossRound(round: number): boolean {
  return round === 3 || round === 6 || round === 8;
}

interface BossConfig {
  displayName: string;
  bossTitle: string;
  bossTagline: string;
  commander: CommanderId;
  army: GhostBuild["army"];
  rating: number;
}

const BOSS_CONFIGS: Record<number, BossConfig> = {
  3: {
    displayName: "The Iron Phalanx",
    bossTitle: "⚔️ BOSS ENCOUNTER",
    bossTagline:
      "An impenetrable wall of steel advances. Nothing gets through.",
    commander: "fortress",
    army: [
      { pieceType: "r", modifierId: "dragon-rook", tier: "silver" },
      { pieceType: "r", modifierId: "phantom-rook", tier: "silver" },
      { pieceType: "r", modifierId: "collateral-rook", tier: "silver" },
      { pieceType: "p", modifierId: "pawn-charge", tier: "silver" },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier: "silver" },
      { pieceType: "p", modifierId: "pawn-charge", tier: "silver" },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier: "silver" },
      { pieceType: "n", modifierId: "camel", tier: "silver" },
    ],
    rating: 1400,
  },
  6: {
    displayName: "The Dark Archmage",
    bossTitle: "💀 BOSS ENCOUNTER",
    bossTagline:
      "Ancient sorcery channels through every piece. Long-range devastation.",
    commander: "endgame-wizard",
    army: [
      { pieceType: "b", modifierId: "dragon-bishop", tier: "gold" },
      { pieceType: "b", modifierId: "bishop-cannon", tier: "gold" },
      { pieceType: "b", modifierId: "bishop-bounce", tier: "silver" },
      { pieceType: "n", modifierId: "night-rider", tier: "gold" },
      { pieceType: "n", modifierId: "night-rider", tier: "silver" },
      { pieceType: "r", modifierId: "railgun", tier: "silver" },
      { pieceType: "q", modifierId: "nuclear-queen", tier: "silver" },
      { pieceType: "p", modifierId: "pawn-promotion-early", tier: "silver" },
      { pieceType: "p", modifierId: "pawn-charge", tier: "silver" },
    ],
    rating: 1800,
  },
  8: {
    displayName: "The Void Champion",
    bossTitle: "👁 FINAL BOSS",
    bossTagline: "The ultimate test. Maximum chaos. No survivors expected.",
    commander: "gambit-king",
    army: [
      { pieceType: "q", modifierId: "nuclear-queen", tier: "gold" },
      { pieceType: "q", modifierId: "amazon", tier: "gold" },
      { pieceType: "r", modifierId: "railgun", tier: "gold" },
      { pieceType: "r", modifierId: "rook-cannon", tier: "gold" },
      { pieceType: "b", modifierId: "dragon-bishop", tier: "gold" },
      { pieceType: "b", modifierId: "bishop-cannon", tier: "gold" },
      { pieceType: "n", modifierId: "night-rider", tier: "gold" },
      { pieceType: "k", modifierId: "king-ascension", tier: "gold" },
      { pieceType: "p", modifierId: "pawn-promotion-early", tier: "gold" },
      { pieceType: "p", modifierId: "pawn-charge", tier: "gold" },
    ],
    rating: 2400,
  },
};

/* ================================================================== */
/*  Ghost opponent generation                                           */
/* ================================================================== */

/** Named ghost opponents for regular fights */
const GHOST_NAMES = [
  "Phantom Kasparov",
  "Ghost Fischer",
  "The Undead Bishop",
  "Shadow Magnus",
  "Specter Tal",
  "Wraith Karpov",
  "Poltergeist Petrosian",
  "Haunted Morphy",
  "The Null Knight",
  "Echo Carlsen",
  "The Pale Rook",
  "Void Queen Nimzo",
  "Cursed Anand",
  "The Hollow Knight",
  "Rift Dragadorf",
];

/** Army archetypes: different strategic identities for ghost opponents */
type GhostArchetype =
  | "pawn-storm"
  | "knight-web"
  | "bishop-battery"
  | "rook-fortress"
  | "queen-rush"
  | "balanced-chaos"
  | "swarm-blitz"
  | "siege-engine";

function buildArchetypeArmy(
  archetype: GhostArchetype,
  round: number,
): GhostBuild["army"] {
  type ArmyPiece = {
    pieceType: PieceType;
    modifierId: string;
    tier: UpgradeTier;
  };
  const tier: UpgradeTier =
    round >= 7 ? "gold" : round >= 4 ? "silver" : "bronze";
  const earlyTier: UpgradeTier = "bronze";
  const lateTier: UpgradeTier = round >= 6 ? "gold" : "silver";

  const armies: Record<GhostArchetype, ArmyPiece[]> = {
    "pawn-storm": [
      { pieceType: "p", modifierId: "pawn-charge", tier },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier },
      { pieceType: "p", modifierId: "pawn-charge", tier },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier },
      { pieceType: "p", modifierId: "pawn-promotion-early", tier },
      { pieceType: "r", modifierId: "dragon-rook", tier },
      { pieceType: "n", modifierId: "camel", tier },
    ],
    "knight-web": [
      { pieceType: "n", modifierId: "camel", tier },
      { pieceType: "n", modifierId: "night-rider", tier },
      { pieceType: "n", modifierId: "camel", tier },
      { pieceType: "b", modifierId: "bishop-bounce", tier },
      { pieceType: "p", modifierId: "pawn-charge", tier },
      { pieceType: "r", modifierId: "phantom-rook", tier },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier },
    ],
    "bishop-battery": [
      { pieceType: "b", modifierId: "dragon-bishop", tier },
      { pieceType: "b", modifierId: "bishop-bounce", tier },
      {
        pieceType: "b",
        modifierId: "bishop-cannon",
        tier: round >= 3 ? tier : earlyTier,
      },
      { pieceType: "n", modifierId: "night-rider", tier },
      { pieceType: "p", modifierId: "pawn-charge", tier },
      { pieceType: "r", modifierId: "phantom-rook", tier },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier },
    ],
    "rook-fortress": [
      { pieceType: "r", modifierId: "dragon-rook", tier },
      { pieceType: "r", modifierId: "phantom-rook", tier },
      {
        pieceType: "r",
        modifierId: "collateral-rook",
        tier: round >= 3 ? tier : earlyTier,
      },
      { pieceType: "p", modifierId: "pawn-charge", tier },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier },
      { pieceType: "n", modifierId: "camel", tier },
      { pieceType: "p", modifierId: "pawn-charge", tier },
    ],
    "queen-rush":
      round <= 2
        ? [
            { pieceType: "p", modifierId: "pawn-charge", tier },
            { pieceType: "n", modifierId: "camel", tier },
            { pieceType: "b", modifierId: "dragon-bishop", tier },
          ]
        : [
            {
              pieceType: "q",
              modifierId: round >= 5 ? "nuclear-queen" : "amazon",
              tier,
            },
            { pieceType: "b", modifierId: "dragon-bishop", tier },
            { pieceType: "n", modifierId: "night-rider", tier },
            { pieceType: "r", modifierId: "phantom-rook", tier },
            { pieceType: "p", modifierId: "pawn-charge", tier },
            { pieceType: "p", modifierId: "pawn-capture-forward", tier },
          ],
    "balanced-chaos": [
      { pieceType: "n", modifierId: "night-rider", tier },
      { pieceType: "b", modifierId: "dragon-bishop", tier },
      { pieceType: "r", modifierId: "phantom-rook", tier },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier },
      { pieceType: "p", modifierId: "pawn-charge", tier },
      { pieceType: "r", modifierId: "dragon-rook", tier },
      {
        pieceType: "q",
        modifierId: "amazon",
        tier: round >= 5 ? tier : earlyTier,
      },
    ],
    "swarm-blitz": [
      { pieceType: "p", modifierId: "pawn-charge", tier },
      { pieceType: "p", modifierId: "pawn-charge", tier },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier },
      { pieceType: "p", modifierId: "pawn-promotion-early", tier },
      { pieceType: "n", modifierId: "camel", tier },
      { pieceType: "n", modifierId: "camel", tier },
      { pieceType: "b", modifierId: "bishop-bounce", tier },
    ],
    "siege-engine": [
      {
        pieceType: "r",
        modifierId: "rook-cannon",
        tier: round >= 3 ? tier : earlyTier,
      },
      {
        pieceType: "r",
        modifierId: "railgun",
        tier: round >= 4 ? tier : earlyTier,
      },
      { pieceType: "b", modifierId: "bishop-cannon", tier },
      { pieceType: "n", modifierId: "night-rider", tier },
      { pieceType: "p", modifierId: "pawn-charge", tier },
      {
        pieceType: "q",
        modifierId: "nuclear-queen",
        tier: round >= 5 ? lateTier : earlyTier,
      },
      { pieceType: "p", modifierId: "pawn-capture-forward", tier },
    ],
  };

  return (armies[archetype] ?? armies["balanced-chaos"]).slice(0, 3 + round);
}

const GHOST_ARCHETYPES: GhostArchetype[] = [
  "pawn-storm",
  "knight-web",
  "bishop-battery",
  "rook-fortress",
  "queen-rush",
  "balanced-chaos",
  "swarm-blitz",
  "siege-engine",
];

/**
 * Generate an AI ghost build for a given round.
 * Boss rounds (3, 6, 8) use the special BOSS_CONFIGS.
 */
export function generateGhostBuild(
  round: number,
  _commanderId: CommanderId,
): GhostBuild {
  // Boss rounds
  if (isBossRound(round)) {
    const boss = BOSS_CONFIGS[round];
    return {
      displayName: boss.displayName,
      commander: boss.commander,
      army: boss.army,
      round,
      rating: boss.rating,
      isAI: true,
      isBoss: true,
      bossTitle: boss.bossTitle,
      bossTagline: boss.bossTagline,
    };
  }

  // Regular ghost: pick a random name and archetype
  const name = GHOST_NAMES[Math.floor(Math.random() * GHOST_NAMES.length)];
  const archetype =
    GHOST_ARCHETYPES[Math.floor(Math.random() * GHOST_ARCHETYPES.length)];
  const army = buildArchetypeArmy(archetype, round);

  return {
    displayName: name,
    commander: COMMANDERS[Math.floor(Math.random() * COMMANDERS.length)].id,
    army: army.slice(0, Math.min(10, 3 + round)),
    round,
    rating: 800 + round * 120 + Math.floor(Math.random() * 100),
    isAI: true,
    isBoss: false,
  };
}
/* ================================================================== */
/*  Leaderboard / rating helpers                                        */
/* ================================================================== */

export function calcRecruitRating(
  roundsWon: number,
  finalHp: number,
  topRound: number,
): number {
  return roundsWon * 200 + finalHp * 50 + topRound * 30;
}

/* ================================================================== */
/*  Shop tier label                                                      */
/* ================================================================== */

export function getShopTierLabel(round: number): {
  tier: number;
  label: string;
  description: string;
} {
  const tier = Math.min(5, Math.ceil(round / 2));
  const labels: Record<number, { label: string; description: string }> = {
    1: { label: "Recruit", description: "Pawns & minor pieces" },
    2: { label: "Soldier", description: "Knights, bishops, rooks" },
    3: { label: "Captain", description: "Rooks, queens emerging" },
    4: { label: "Commander", description: "Heavy hitters" },
    5: { label: "Legend", description: "Legendary modifiers" },
  };
  return { tier, ...(labels[tier] ?? labels[1]) };
}

/* ================================================================== */
/*  Between-battle encounter generation                                 */
/* ================================================================== */

const MERCENARY_PIECES: Array<{
  type: EncounterType;
  round: number;
  pieceType: PieceType;
  modifierId: string;
  tier: UpgradeTier;
}> = [
  {
    type: "tavern",
    round: 1,
    pieceType: "n",
    modifierId: "night-rider",
    tier: "bronze",
  },
  {
    type: "tavern",
    round: 1,
    pieceType: "b",
    modifierId: "bishop-bounce",
    tier: "bronze",
  },
  {
    type: "tavern",
    round: 3,
    pieceType: "r",
    modifierId: "phantom-rook",
    tier: "bronze",
  },
  {
    type: "tavern",
    round: 3,
    pieceType: "b",
    modifierId: "dragon-bishop",
    tier: "silver",
  },
  {
    type: "tavern",
    round: 5,
    pieceType: "r",
    modifierId: "railgun",
    tier: "silver",
  },
  {
    type: "tavern",
    round: 5,
    pieceType: "q",
    modifierId: "amazon",
    tier: "silver",
  },
  {
    type: "tavern",
    round: 7,
    pieceType: "q",
    modifierId: "nuclear-queen",
    tier: "gold",
  },
];

const SHRINE_MODIFIERS_BY_ROUND: Record<number, string[]> = {
  1: ["pawn-charge", "pawn-capture-forward", "camel"],
  3: ["dragon-bishop", "night-rider", "bishop-bounce", "phantom-rook"],
  5: ["dragon-rook", "bishop-cannon", "amazon", "collateral-rook"],
  7: ["nuclear-queen", "railgun", "king-ascension", "kings-chains"],
};

function getShrineModifier(round: number): string {
  const tier = round >= 7 ? 7 : round >= 5 ? 5 : round >= 3 ? 3 : 1;
  const pool = SHRINE_MODIFIERS_BY_ROUND[tier] ?? SHRINE_MODIFIERS_BY_ROUND[1];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getMercenaryPiece(round: number): {
  pieceType: PieceType;
  modifierId: string;
  tier: UpgradeTier;
} {
  const eligible = MERCENARY_PIECES.filter((m) => m.round <= round);
  const pool = eligible.length > 0 ? eligible : MERCENARY_PIECES.slice(0, 2);
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return {
    pieceType: picked.pieceType,
    modifierId: picked.modifierId,
    tier: picked.tier,
  };
}

// Static piece label map (mirrors the one in the component)
const PIECE_LABELS_STATIC: Record<string, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};

/**
 * Generate 3 varied encounter choices between battles.
 * The pool expands in later rounds; bosses are always raw fights (no encounter).
 */
export function generateEncounterChoices(
  round: number,
  _commanderId: CommanderId,
  lastFightSurvivors = 0,
): EncounterChoice[] {
  const goldAmount = 3 + Math.floor(round / 3);
  const mercenar = getMercenaryPiece(round);
  const shrineModId = getShrineModifier(round);
  const shrineMod = ALL_MODIFIERS.find((m) => m.id === shrineModId);

  // Build the full pool for this round
  const pool: EncounterChoice[] = [
    {
      id: "docks",
      type: "docks",
      title: "The Docks",
      description: `Work the loading docks. Earn ${goldAmount} gold outright.`,
      icon: "🚢",
      goldGain: goldAmount,
    },
    {
      id: "blacksmith",
      type: "blacksmith",
      title: "The Blacksmith",
      description: "Forge a new slot — gain +1 army capacity for free.",
      icon: "⚒️",
    },
    {
      id: "tavern",
      type: "tavern",
      title: "The Tavern",
      description: `Hire a ${PIECE_LABELS_STATIC[mercenar.pieceType]} mercenary with ${ALL_MODIFIERS.find((m) => m.id === mercenar.modifierId)?.name ?? mercenar.modifierId} for free.`,
      icon: "🍺",
      freePiece: mercenar,
    },
    {
      id: "shrine",
      type: "shrine",
      title: "The Shrine",
      description: `Imbue one piece with ${shrineMod?.name ?? shrineModId}. Ancient power rewrites its modifier.`,
      icon: "⛩️",
      shrineModifierId: shrineModId,
    },
    {
      id: "library",
      type: "library",
      title: "The Library",
      description:
        "Study tomes of strategy. Pay 3 gold to promote one Bronze piece to Silver.",
      icon: "📚",
      upgradeGoldCost: 3,
    },
    {
      id: "forge",
      type: "forge",
      title: "The Forge",
      description:
        "Melt down two identical Bronze pieces into one Silver. Sacrifice two to become one.",
      icon: "🔥",
    },
  ];

  // Arena — available only if there was a previous fight with survivors
  if (lastFightSurvivors > 0) {
    const arenaGold = lastFightSurvivors * 2;
    pool.push({
      id: "arena",
      type: "arena",
      title: "The Arena",
      description: `Your ${lastFightSurvivors} survivors are celebrated. Earn ${arenaGold} gold from the crowd.`,
      icon: "🏟️",
      goldGain: arenaGold,
      arenaGoldPerSurvivor: 2,
    });
  }

  // Treasure vault — mid-game onwards
  if (round >= 3) {
    const vaultMercenar = getMercenaryPiece(round);
    pool.push({
      id: "treasure-vault",
      type: "treasure-vault",
      title: "The Treasure Vault",
      description: `A sealed vault. Open it for a mystery reward — a ${PIECE_LABELS_STATIC[vaultMercenar.pieceType]} and 2 gold.`,
      icon: "💎",
      freePiece: vaultMercenar,
      goldGain: 2,
    });
  }

  // Cursed altar — late game only
  if (round >= 5) {
    const cursedPiece = getMercenaryPiece(round);
    pool.push({
      id: "cursed-altar",
      type: "cursed-altar",
      title: "The Cursed Altar",
      description: `Dark pact: lose 1 HP but receive a ${PIECE_LABELS_STATIC[cursedPiece.pieceType]} and 4 gold. Power has a price.`,
      icon: "💀",
      hpCost: 1,
      boonGold: 4,
      freePiece: cursedPiece,
    });
  }

  // Always include docks (economic anchor). Shuffle the rest and pick 2.
  const docsChoice = pool.find((c) => c.type === "docks")!;
  const rest = pool
    .filter((c) => c.type !== "docks")
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  return [docsChoice, ...rest];
}

/* ================================================================== */
/*  Re-exports for convenience                                          */
/* ================================================================== */

export { TIER_COLORS, ALL_MODIFIERS };
export type { ChaosModifier, ChaosState };
