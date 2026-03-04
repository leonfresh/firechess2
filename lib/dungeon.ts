/**
 * Dungeon Tactics — Roguelike puzzle mode game engine.
 *
 * Core loop: navigate a branching dungeon map, solve chess puzzles as "battles",
 * collect perks, manage HP, encounter events, and fight bosses.
 */

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export type Difficulty = "easy" | "medium" | "hard" | "boss";

export type NodeType = "battle" | "elite" | "shop" | "mystery" | "boss" | "rest" | "start";

export type PerkRarity = "common" | "rare" | "epic" | "legendary" | "cursed";

export interface Perk {
  id: string;
  name: string;
  description: string;
  rarity: PerkRarity;
  icon: string;
  /** Stat modifiers applied when perk is acquired */
  effects: Partial<PlayerStats>;
  /** One-time or passive */
  kind: "passive" | "consumable";
  /** True if the perk has been consumed (one-time use) */
  consumed?: boolean;
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  attack: number;    // bonus time per puzzle (+2s per point)
  defense: number;   // damage reduction
  luck: number;      // better rolls, dodge chance
}

export interface MapNode {
  id: string;
  floor: number;
  type: NodeType;
  /** Column position (0-2) for branching paths */
  col: number;
  /** Which nodes this connects to on the next floor */
  connections: string[];
  /** Has the player visited this node? */
  visited: boolean;
  /** Difficulty for battle/elite/boss nodes */
  difficulty?: Difficulty;
}

export type EventChoice = {
  label: string;
  description: string;
  outcome: EventOutcome;
};

export type EventOutcome = {
  hpChange?: number;
  coinsChange?: number;
  addPerk?: string;     // perk id
  removePerk?: string;  // perk id
  message: string;
};

export interface MysteryEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  choices: EventChoice[];
}

export interface DungeonRun {
  seed: number;
  map: MapNode[];
  currentNodeId: string;
  currentFloor: number;
  stats: PlayerStats;
  perks: Perk[];
  coins: number;
  streak: number;
  bestStreak: number;
  puzzlesSolved: number;
  puzzlesFailed: number;
  floorsCleared: number;
  status: "exploring" | "battle" | "perk-select" | "event" | "shop" | "rest" | "dead" | "victory";
  /** Perks offered after elite/boss fights or every 3 battle floors */
  perkChoices: Perk[];
  /** Current mystery event */
  activeEvent: MysteryEvent | null;
  /** Streak multiplier for coins */
  streakMultiplier: number;
}

/* ================================================================== */
/*  Perks Catalogue                                                     */
/* ================================================================== */

export const ALL_PERKS: Perk[] = [
  // Common
  { id: "iron-shield", name: "Iron Shield", description: "Take 5 less damage from wrong answers", rarity: "common", icon: "🛡️", effects: { defense: 1 }, kind: "passive" },
  { id: "lucky-horseshoe", name: "Lucky Horseshoe", description: "+2 Luck — better perk rolls and dodge chance", rarity: "common", icon: "🧲", effects: { luck: 2 }, kind: "passive" },
  { id: "gold-magnet", name: "Gold Magnet", description: "+3 bonus coins per solved puzzle", rarity: "common", icon: "🧲", effects: {}, kind: "passive" },
  { id: "thick-armor", name: "Thick Armor", description: "+15 max HP", rarity: "common", icon: "🪖", effects: { maxHp: 15, hp: 15 }, kind: "passive" },
  { id: "swift-boots", name: "Swift Boots", description: "+1 Attack — extra thinking time", rarity: "common", icon: "👢", effects: { attack: 1 }, kind: "passive" },
  { id: "health-potion", name: "Health Potion", description: "Restore 25 HP (consumable)", rarity: "common", icon: "🧪", effects: { hp: 25 }, kind: "consumable" },

  // Rare
  { id: "vampiric-blade", name: "Vampiric Blade", description: "Heal 10 HP on every correct solve", rarity: "rare", icon: "🗡️", effects: {}, kind: "passive" },
  { id: "berserker-rage", name: "Berserker's Rage", description: "+50% coins but take +10 extra damage", rarity: "rare", icon: "🔥", effects: {}, kind: "passive" },
  { id: "combo-king", name: "Combo King", description: "Streak multiplier grows faster (×2 after 2, not 3)", rarity: "rare", icon: "⚡", effects: {}, kind: "passive" },
  { id: "scouts-map", name: "Scout's Map", description: "See node types 2 floors ahead", rarity: "rare", icon: "🗺️", effects: {}, kind: "passive" },
  { id: "second-wind", name: "Second Wind", description: "Get 2 attempts per puzzle instead of 1", rarity: "rare", icon: "💨", effects: {}, kind: "passive" },
  { id: "treasure-hunter", name: "Treasure Hunter", description: "Mystery events always offer coin rewards", rarity: "rare", icon: "💎", effects: {}, kind: "passive" },

  // Epic
  { id: "glass-cannon", name: "Glass Cannon", description: "See which piece to move, but take 2× damage", rarity: "epic", icon: "🔮", effects: {}, kind: "passive" },
  { id: "zen-master", name: "Zen Master", description: "Unlimited time on puzzles, but no hints allowed", rarity: "epic", icon: "🧘", effects: {}, kind: "passive" },
  { id: "double-edged", name: "Double-Edged Sword", description: "+3 Attack, −20 max HP", rarity: "epic", icon: "⚔️", effects: { attack: 3, maxHp: -20 }, kind: "passive" },
  { id: "midas-touch", name: "Midas Touch", description: "2× coins from all sources", rarity: "epic", icon: "👑", effects: {}, kind: "passive" },

  // Legendary
  { id: "phoenix-feather", name: "Phoenix Feather", description: "Revive once with 30 HP when you die", rarity: "legendary", icon: "🔥", effects: {}, kind: "consumable" },
  { id: "gm-crown", name: "Grandmaster's Crown", description: "Boss puzzles give 3× reward", rarity: "legendary", icon: "♚", effects: {}, kind: "passive" },
  { id: "immortal-game", name: "The Immortal Game", description: "+50 max HP and heal to full", rarity: "legendary", icon: "⭐", effects: { maxHp: 50 }, kind: "passive" },

  // Cursed
  { id: "cursed-mirror", name: "Cursed Mirror", description: "Board is flipped to the opponent's perspective — but +100% coins", rarity: "cursed", icon: "🪞", effects: {}, kind: "passive" },
  { id: "cursed-clock", name: "Cursed Clock", description: "Halve your thinking time, but heal 5 HP per solve", rarity: "cursed", icon: "⏰", effects: {}, kind: "passive" },
  { id: "devils-pawn", name: "Devil's Pawn", description: "Take 5 damage every 3 floors, but +2 to all stats", rarity: "cursed", icon: "♟️", effects: { attack: 2, defense: 2, luck: 2 }, kind: "passive" },
];

/* ================================================================== */
/*  Mystery Events                                                      */
/* ================================================================== */

export const ALL_EVENTS: MysteryEvent[] = [
  {
    id: "mysterious-gm",
    title: "The Mysterious Grandmaster",
    description: "A hooded figure blocks your path. \"Solve my puzzle in one attempt for a rare reward… or walk away.\"",
    icon: "🧙",
    choices: [
      { label: "Accept the challenge", description: "Fight an elite puzzle for a guaranteed rare+ perk", outcome: { message: "The grandmaster nods. Prepare yourself!" } },
      { label: "Walk away", description: "Continue safely", outcome: { message: "Perhaps another time…", hpChange: 5 } },
    ],
  },
  {
    id: "cursed-piece",
    title: "The Cursed Chess Piece",
    description: "A dark chess piece gleams on a pedestal. You feel its power… and its malice.",
    icon: "♟️",
    choices: [
      { label: "Take the cursed piece", description: "+3 Attack but take 5 damage every 3 floors", outcome: { addPerk: "devils-pawn", message: "Dark energy surges through you. Power… at a cost." } },
      { label: "Destroy it", description: "Gain 15 HP", outcome: { hpChange: 15, message: "The piece crumbles to dust. You feel lighter." } },
      { label: "Leave it", description: "Nothing happens", outcome: { message: "Wisdom is knowing when not to act." } },
    ],
  },
  {
    id: "treasure-room",
    title: "Hidden Treasure Room",
    description: "You stumble into a room filled with golden chess trophies!",
    icon: "💰",
    choices: [
      { label: "Grab the gold (30 coins)", description: "But a trap triggers — lose 15 HP", outcome: { coinsChange: 30, hpChange: -15, message: "Gold! But the trap stings…" } },
      { label: "Carefully take some (15 coins)", description: "No trap", outcome: { coinsChange: 15, message: "A modest but safe haul." } },
      { label: "Search for a hidden perk", description: "50% chance of a perk, 50% empty", outcome: { message: "You search the room thoroughly…" } },
    ],
  },
  {
    id: "ancient-book",
    title: "Ancient Chess Manuscript",
    description: "A dusty tome lies open on a stone table. Its pages glow with tactical knowledge.",
    icon: "📖",
    choices: [
      { label: "Study it thoroughly", description: "+2 Attack (but takes time — lose 10 HP from fatigue)", outcome: { hpChange: -10, message: "Hours pass. Your tactical vision sharpens." } },
      { label: "Skim it quickly", description: "+1 Attack, no cost", outcome: { message: "A few useful patterns caught your eye." } },
      { label: "Take the book", description: "Gain 20 coins from selling it later", outcome: { coinsChange: 20, message: "Knowledge has a price, and this one's worth 20 coins." } },
    ],
  },
  {
    id: "chess-gambler",
    title: "The Chess Gambler",
    description: "\"I'll bet you double or nothing! 50 coins on a coin flip.\" The gambler grins.",
    icon: "🎲",
    choices: [
      { label: "Take the bet", description: "50% chance: win 30 coins or lose 15 coins", outcome: { message: "The coin spins in the air..." } },
      { label: "Play it safe", description: "Gain 5 coins for being wise", outcome: { coinsChange: 5, message: "\"Boring, but smart.\" The gambler flips you a coin." } },
    ],
  },
  {
    id: "healing-spring",
    title: "Mystical Spring",
    description: "Crystal clear water cascades into a pool. It radiates a healing aura.",
    icon: "🌊",
    choices: [
      { label: "Drink deeply", description: "Heal 30 HP", outcome: { hpChange: 30, message: "Warmth flows through your body. You feel renewed." } },
      { label: "Bottle some for later", description: "Gain a Health Potion perk", outcome: { addPerk: "health-potion", message: "You carefully fill a vial with the glowing water." } },
    ],
  },
  {
    id: "fallen-knight",
    title: "The Fallen Knight",
    description: "A wounded chess knight lies on the ground. \"Help me… and I'll share my knowledge.\"",
    icon: "♞",
    choices: [
      { label: "Help the knight (−10 HP)", description: "Gain a random rare perk", outcome: { hpChange: -10, message: "The knight teaches you an ancient technique." } },
      { label: "Take his equipment", description: "+1 Defense, +1 Attack", outcome: { message: "You salvage useful gear from the fallen warrior." } },
      { label: "Walk past", description: "Nothing happens", outcome: { message: "You press onward." } },
    ],
  },
  {
    id: "chess-spirit",
    title: "Spirit of Capablanca",
    description: "The ghostly image of a great chess master appears. \"Choose your path wisely, young player.\"",
    icon: "👻",
    choices: [
      { label: "\"Teach me tactics\"", description: "+2 Attack", outcome: { message: "\"See the board with new eyes.\" Your tactical vision expands." } },
      { label: "\"Make me resilient\"", description: "+20 max HP, heal 20", outcome: { hpChange: 20, message: "\"Endurance wins more games than brilliance.\"" } },
      { label: "\"Bless my fortune\"", description: "+3 Luck", outcome: { message: "\"Fortune favors the prepared mind.\"" } },
    ],
  },
];

/* ================================================================== */
/*  Map Generation                                                      */
/* ================================================================== */

/** Seeded PRNG for deterministic daily runs */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickNodeType(floor: number, col: number, rng: () => number): NodeType {
  // Boss every 10 floors
  if (floor % 10 === 0) return "boss";

  // Rest every 3 floors before boss (floor 7, 17, 27, etc.)
  if (floor % 10 === 7) return "rest";

  const roll = rng();

  // Early floors are simpler
  if (floor <= 3) {
    if (roll < 0.7) return "battle";
    if (roll < 0.85) return "mystery";
    return "shop";
  }

  // Mid floors
  if (floor <= 15) {
    if (roll < 0.45) return "battle";
    if (roll < 0.65) return "elite";
    if (roll < 0.8) return "mystery";
    if (roll < 0.9) return "shop";
    return "rest";
  }

  // Late floors — more elites and events
  if (roll < 0.35) return "battle";
  if (roll < 0.6) return "elite";
  if (roll < 0.75) return "mystery";
  if (roll < 0.85) return "shop";
  return "rest";
}

function getDifficulty(floor: number, type: NodeType): Difficulty {
  if (type === "boss") return "boss";
  if (type === "elite") {
    if (floor <= 10) return "medium";
    if (floor <= 20) return "hard";
    return "boss";
  }
  // Regular battle
  if (floor <= 5) return "easy";
  if (floor <= 15) return "medium";
  return "hard";
}

export function generateMap(seed: number, totalFloors = 30): MapNode[] {
  const rng = seededRandom(seed);
  const nodes: MapNode[] = [];

  // Start node
  nodes.push({
    id: "start",
    floor: 0,
    type: "start",
    col: 1,
    connections: ["1-0", "1-1", "1-2"],
    visited: true,
  });

  for (let floor = 1; floor <= totalFloors; floor++) {
    const cols = floor % 10 === 0 ? 1 : 3; // Boss floors have single node
    
    for (let col = 0; col < cols; col++) {
      const actualCol = cols === 1 ? 1 : col; // Center boss nodes
      const type = pickNodeType(floor, actualCol, rng);
      const diff = getDifficulty(floor, type);

      // Connections to next floor
      const nextFloor = floor + 1;
      const connections: string[] = [];
      if (nextFloor <= totalFloors) {
        const nextIsBoss = nextFloor % 10 === 0;
        if (nextIsBoss) {
          connections.push(`${nextFloor}-1`);
        } else {
          // Connect to same col and adjacent cols
          connections.push(`${nextFloor}-${actualCol}`);
          if (actualCol > 0) connections.push(`${nextFloor}-${actualCol - 1}`);
          if (actualCol < 2) connections.push(`${nextFloor}-${actualCol + 1}`);
        }
      }

      nodes.push({
        id: `${floor}-${actualCol}`,
        floor,
        type,
        col: actualCol,
        connections,
        visited: false,
        difficulty: type === "battle" || type === "elite" || type === "boss" ? diff : undefined,
      });
    }
  }

  return nodes;
}

/* ================================================================== */
/*  Damage Calculation                                                  */
/* ================================================================== */

export function calculateDamage(difficulty: Difficulty, stats: PlayerStats, perks: Perk[]): number {
  const baseDamage: Record<Difficulty, number> = {
    easy: 10,
    medium: 20,
    hard: 35,
    boss: 50,
  };

  let damage = baseDamage[difficulty];

  // Defense reduction (5 per point)
  damage = Math.max(5, damage - stats.defense * 5);

  // Berserker's Rage: +10 extra damage
  if (perks.some(p => p.id === "berserker-rage")) damage += 10;

  // Glass Cannon: 2× damage
  if (perks.some(p => p.id === "glass-cannon")) damage *= 2;

  return Math.round(damage);
}

export function calculateHeal(difficulty: Difficulty, perks: Perk[]): number {
  let heal = 0;

  // Vampiric Blade: heal 10 on correct
  if (perks.some(p => p.id === "vampiric-blade")) heal += 10;

  // Cursed Clock: heal 5 on correct
  if (perks.some(p => p.id === "cursed-clock")) heal += 5;

  return heal;
}

/* ================================================================== */
/*  Coin Calculation                                                    */
/* ================================================================== */

export function calculateCoins(
  difficulty: Difficulty,
  streak: number,
  perks: Perk[],
): number {
  const baseCoins: Record<Difficulty, number> = {
    easy: 5,
    medium: 8,
    hard: 12,
    boss: 20,
  };

  let coins = baseCoins[difficulty];

  // Streak multiplier
  const hasComboKing = perks.some(p => p.id === "combo-king");
  const streakThreshold = hasComboKing ? 2 : 3;
  let multiplier = 1;
  if (streak >= streakThreshold * 3) multiplier = 3;
  else if (streak >= streakThreshold * 2) multiplier = 2;
  else if (streak >= streakThreshold) multiplier = 1.5;

  coins = Math.round(coins * multiplier);

  // Gold Magnet: +3
  if (perks.some(p => p.id === "gold-magnet")) coins += 3;

  // Berserker's Rage: +50%
  if (perks.some(p => p.id === "berserker-rage")) coins = Math.round(coins * 1.5);

  // Midas Touch: 2×
  if (perks.some(p => p.id === "midas-touch")) coins *= 2;

  // GM Crown: 3× on boss
  if (difficulty === "boss" && perks.some(p => p.id === "gm-crown")) coins *= 3;

  // Cursed Mirror: 2×
  if (perks.some(p => p.id === "cursed-mirror")) coins *= 2;

  return coins;
}

/* ================================================================== */
/*  Streak Multiplier Display                                           */
/* ================================================================== */

export function getStreakMultiplier(streak: number, perks: Perk[]): number {
  const hasComboKing = perks.some(p => p.id === "combo-king");
  const t = hasComboKing ? 2 : 3;
  if (streak >= t * 3) return 3;
  if (streak >= t * 2) return 2;
  if (streak >= t) return 1.5;
  return 1;
}

/* ================================================================== */
/*  Perk Selection                                                      */
/* ================================================================== */

export function rollPerks(count: number, currentPerks: Perk[], luck: number, rng?: () => number): Perk[] {
  const rand = rng ?? Math.random;
  const ownedIds = new Set(currentPerks.map(p => p.id));

  // Available perks (filter out already owned non-consumables)
  const available = ALL_PERKS.filter(p => {
    if (p.kind === "consumable") return true; // can always get more consumables
    return !ownedIds.has(p.id);
  });

  if (available.length === 0) return [];

  // Weight by rarity — luck boosts rare+ chance
  const weights: Record<PerkRarity, number> = {
    common: 40,
    rare: 25 + luck * 2,
    epic: 15 + luck * 3,
    legendary: 5 + luck * 2,
    cursed: 15,
  };

  // Weighted random selection without replacement
  const selected: Perk[] = [];
  const pool = [...available];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, p) => sum + (weights[p.rarity] ?? 10), 0);
    let roll = rand() * totalWeight;
    let picked = pool[0];
    for (const perk of pool) {
      roll -= weights[perk.rarity] ?? 10;
      if (roll <= 0) {
        picked = perk;
        break;
      }
    }
    selected.push(picked);
    const idx = pool.indexOf(picked);
    if (idx >= 0) pool.splice(idx, 1);
  }

  return selected;
}

/* ================================================================== */
/*  Run Initialization                                                  */
/* ================================================================== */

export function createRun(seed?: number): DungeonRun {
  const s = seed ?? Math.floor(Math.random() * 2147483647);
  return {
    seed: s,
    map: generateMap(s),
    currentNodeId: "start",
    currentFloor: 0,
    stats: {
      maxHp: 100,
      hp: 100,
      attack: 0,
      defense: 0,
      luck: 0,
    },
    perks: [],
    coins: 0,
    streak: 0,
    bestStreak: 0,
    puzzlesSolved: 0,
    puzzlesFailed: 0,
    floorsCleared: 0,
    status: "exploring",
    perkChoices: [],
    activeEvent: null,
    streakMultiplier: 1,
  };
}

/** Get daily seed based on date */
export function getDailySeed(): number {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

/* ================================================================== */
/*  Node type → display info                                            */
/* ================================================================== */

export const NODE_INFO: Record<NodeType, { icon: string; label: string; color: string }> = {
  start:   { icon: "🏰", label: "Start",   color: "text-slate-400" },
  battle:  { icon: "⚔️", label: "Battle",  color: "text-blue-400" },
  elite:   { icon: "💀", label: "Elite",   color: "text-purple-400" },
  shop:    { icon: "🏪", label: "Shop",    color: "text-amber-400" },
  mystery: { icon: "❓", label: "Mystery", color: "text-cyan-400" },
  boss:    { icon: "🔥", label: "Boss",    color: "text-red-400" },
  rest:    { icon: "🏕️", label: "Rest",    color: "text-emerald-400" },
};

export const RARITY_COLORS: Record<PerkRarity, string> = {
  common: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  rare: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  epic: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  legendary: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  cursed: "border-red-500/30 bg-red-500/10 text-red-300",
};
