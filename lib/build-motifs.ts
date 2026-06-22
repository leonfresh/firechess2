export type TaggedPosition = {
  tags: string[];
  cpLoss: number;
  fenBefore: string;
  userMove?: string;
  bestMove?: string | null;
  evalAfterUser?: number;
  gameUrl?: string;
};

export type MotifExample = {
  fenBefore: string;
  userMove?: string;
  bestMove?: string | null;
  cpLoss: number;
  gameUrl?: string;
};

export type DerivedMotif = {
  name: string;
  icon: string;
  count: number;
  avgCpLoss: number;
  examples: MotifExample[];
};

export type MotifDefinition = {
  name: string;
  icon: string;
  positional?: boolean;
  match: (position: TaggedPosition) => boolean;
};

export const POSITIONAL_MOTIF_NAMES = new Set([
  "Unnecessary Captures",
  "Premature Trades",
  "Released Tension",
  "Passive Retreats",
  "Trading Advantage",
  "Greedy Pawn Grabs",
  "Weakened Pawn Structure",
  "Wrong Recaptures",
  "Missed Development",
  "King Exposure",
  "Piece Activity",
  "Premature Pawn Breaks",
  "General Inaccuracy",
  "Neglected Castling",
  "Aimless Moves",
  "Overextended Pawns",
  "Center Neglect",
  "Hanging Pieces",
]);

export const STILL_WINNING_THRESHOLD = 350;

export const MOTIF_DEFS: MotifDefinition[] = [
  {
    name: "Hanging Pieces",
    icon: "💀",
    positional: true,
    match: (position) => position.tags.includes("Hanging Piece"),
  },
  {
    name: "Missed Mate",
    icon: "👑",
    match: (position) => position.tags.includes("Missed Mate"),
  },
  {
    name: "Missed Check",
    icon: "⚡",
    match: (position) => position.tags.includes("Missed Check"),
  },
  {
    name: "Missed Capture",
    icon: "🗡️",
    match: (position) =>
      position.tags.includes("Missed Capture") ||
      position.tags.includes("Forcing Capture"),
  },
  {
    name: "Back Rank Threats",
    icon: "🏰",
    match: (position) => position.tags.includes("Back Rank"),
  },
  {
    name: "Knight Tactics",
    icon: "♞",
    match: (position) => position.tags.includes("Knight Fork?"),
  },
  {
    name: "Queen Tactics",
    icon: "♛",
    match: (position) => position.tags.includes("Queen Tactic"),
  },
  {
    name: "Converting Advantage",
    icon: "📈",
    match: (position) => position.tags.includes("Converting Advantage"),
  },
  {
    name: "Equal Position Misses",
    icon: "⚖️",
    match: (position) => position.tags.includes("Equal Position"),
  },
  {
    name: "Unnecessary Captures",
    icon: "🚫",
    positional: true,
    match: (position) => position.tags.includes("Unnecessary Capture"),
  },
  {
    name: "Premature Trades",
    icon: "🤝",
    positional: true,
    match: (position) => position.tags.includes("Premature Trade"),
  },
  {
    name: "Released Tension",
    icon: "💨",
    positional: true,
    match: (position) => position.tags.includes("Released Tension"),
  },
  {
    name: "Passive Retreats",
    icon: "🐢",
    positional: true,
    match: (position) => position.tags.includes("Passive Retreat"),
  },
  {
    name: "Trading Advantage",
    icon: "📉",
    positional: true,
    match: (position) => position.tags.includes("Trading Advantage"),
  },
  {
    name: "Greedy Pawn Grabs",
    icon: "🍕",
    positional: true,
    match: (position) => position.tags.includes("Greedy Pawn Grab"),
  },
  {
    name: "Weakened Pawn Structure",
    icon: "🏚️",
    positional: true,
    match: (position) => position.tags.includes("Weakened Pawn Structure"),
  },
  {
    name: "Wrong Recaptures",
    icon: "↩️",
    positional: true,
    match: (position) => position.tags.includes("Wrong Recapture"),
  },
  {
    name: "Missed Development",
    icon: "🐌",
    positional: true,
    match: (position) => position.tags.includes("Missed Development"),
  },
  {
    name: "King Exposure",
    icon: "👑",
    positional: true,
    match: (position) => position.tags.includes("King Exposure"),
  },
  {
    name: "Piece Activity",
    icon: "📊",
    positional: true,
    match: (position) => position.tags.includes("Piece Activity"),
  },
  {
    name: "Premature Pawn Breaks",
    icon: "⚔️",
    positional: true,
    match: (position) => position.tags.includes("Premature Pawn Break"),
  },
  {
    name: "General Inaccuracy",
    icon: "⚠️",
    positional: true,
    match: (position) => position.tags.includes("Inaccuracy"),
  },
  {
    name: "Neglected Castling",
    icon: "🏰",
    positional: true,
    match: (position) => position.tags.includes("Neglected Castling"),
  },
  {
    name: "Aimless Moves",
    icon: "🌀",
    positional: true,
    match: (position) => position.tags.includes("Aimless Move"),
  },
  {
    name: "Overextended Pawns",
    icon: "📏",
    positional: true,
    match: (position) => position.tags.includes("Overextended Pawn"),
  },
  {
    name: "Center Neglect",
    icon: "🎯",
    positional: true,
    match: (position) => position.tags.includes("Center Neglect"),
  },
];

export type MissedTactic = {
  fenBefore: string;
  userMove?: string;
  bestMove?: string | null;
  cpLoss: number;
  cpAfter: number;
  tags: string[];
  gameUrl?: string;
};

export type RepeatedOpeningLeak = {
  fenBefore: string;
  userMove?: string;
  bestMove?: string | null;
  cpLoss: number;
  tags?: string[];
  evalAfter?: number;
  gameUrl?: string;
};

export type PositionalFinding = {
  fenBefore: string;
  userMove?: string;
  bestMove?: string | null;
  cpLoss: number;
  tags?: string[];
  gameUrl?: string;
};

export function buildMotifs(
  missedTactics: MissedTactic[],
  leaks: RepeatedOpeningLeak[],
  oneOffMistakes: RepeatedOpeningLeak[],
  positionalFindings: PositionalFinding[],
): DerivedMotif[] {
  const allPositions: TaggedPosition[] = [];

  for (const tactic of missedTactics) {
    allPositions.push({
      tags: tactic.tags,
      cpLoss: tactic.cpLoss,
      fenBefore: tactic.fenBefore,
      userMove: tactic.userMove,
      bestMove: tactic.bestMove,
      evalAfterUser: -tactic.cpAfter,
    });
  }

  for (const leak of leaks) {
    if (!leak.tags?.length) continue;
    allPositions.push({
      tags: leak.tags,
      cpLoss: leak.cpLoss,
      fenBefore: leak.fenBefore,
      userMove: leak.userMove,
      bestMove: leak.bestMove,
      evalAfterUser:
        typeof leak.evalAfter === "number" ? -leak.evalAfter : undefined,
    });
  }

  for (const mistake of oneOffMistakes) {
    if (!mistake.tags?.length) continue;
    allPositions.push({
      tags: mistake.tags,
      cpLoss: mistake.cpLoss,
      fenBefore: mistake.fenBefore,
      userMove: mistake.userMove,
      bestMove: mistake.bestMove,
      evalAfterUser:
        typeof mistake.evalAfter === "number" ? -mistake.evalAfter : undefined,
    });
  }

  for (const finding of positionalFindings) {
    if (!finding.tags?.length) continue;
    allPositions.push({
      tags: finding.tags,
      cpLoss: finding.cpLoss,
      fenBefore: finding.fenBefore,
      userMove: finding.userMove,
      bestMove: finding.bestMove,
      gameUrl: finding.gameUrl,
    });
  }

  if (allPositions.length === 0) return [];

  const groups: DerivedMotif[] = [];

  for (const definition of MOTIF_DEFS) {
    const seenFens = new Set<string>();
    const matching: TaggedPosition[] = [];

    for (const position of allPositions) {
      if (!definition.match(position) || seenFens.has(position.fenBefore)) {
        continue;
      }

      if (
        typeof position.evalAfterUser === "number" &&
        position.evalAfterUser > STILL_WINNING_THRESHOLD
      ) {
        continue;
      }

      seenFens.add(position.fenBefore);
      matching.push(position);
    }

    const minCount = definition.positional ? 1 : 2;
    if (matching.length < minCount) continue;

    const avgCpLoss =
      matching.reduce((sum, position) => sum + position.cpLoss, 0) /
      matching.length;

    groups.push({
      name: definition.name,
      icon: definition.icon,
      count: matching.length,
      avgCpLoss,
      examples: [...matching]
        .sort((left, right) => right.cpLoss - left.cpLoss)
        .slice(0, 6)
        .map((position) => ({
          fenBefore: position.fenBefore,
          userMove: position.userMove,
          bestMove: position.bestMove,
          cpLoss: position.cpLoss,
          gameUrl: position.gameUrl,
        })),
    });
  }

  return groups.sort((left, right) => right.avgCpLoss - left.avgCpLoss);
}
