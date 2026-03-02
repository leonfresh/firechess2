/**
 * Positional pattern definitions with GM quotes.
 *
 * Each pattern has:
 *  - tag: the string used in the analysis tags array
 *  - label: human-readable label for UI display
 *  - icon: emoji icon
 *  - quote: famous GM quote about this pattern
 *  - author: who said it
 *  - color: tailwind color class for badges
 */

export type PositionalPattern = {
  tag: string;
  label: string;
  icon: string;
  quote: string;
  author: string;
  color: string;
};

/**
 * All recognized positional patterns with GM wisdom.
 */
export const POSITIONAL_PATTERNS: PositionalPattern[] = [
  {
    tag: "Unnecessary Capture",
    label: "Unnecessary Capture",
    icon: "🚫",
    quote: "To take is a mistake.",
    author: "GM Igor Smirnov",
    color: "amber",
  },
  {
    tag: "Premature Trade",
    label: "Premature Trade",
    icon: "🤝",
    quote: "Don't trade pieces unless you have a concrete reason to do so.",
    author: "GM Yasser Seirawan",
    color: "orange",
  },
  {
    tag: "Released Tension",
    label: "Released Tension",
    icon: "💥",
    quote: "Maintain the tension! The side that resolves it first usually gets the worse deal.",
    author: "GM Aron Nimzowitsch",
    color: "rose",
  },
  {
    tag: "Premature Pawn Break",
    label: "Premature Pawn Break",
    icon: "⚔️",
    quote: "Do not hurry. The pawn structure is everything — it determines the entire game.",
    author: "GM Philidor",
    color: "red",
  },
  {
    tag: "Passive Retreat",
    label: "Passive Retreat",
    icon: "🐢",
    quote: "A piece that is not actively placed is a wasted piece. Every move must serve a purpose.",
    author: "GM Siegbert Tarrasch",
    color: "slate",
  },
  {
    tag: "Trading Advantage",
    label: "Trading Away Advantage",
    icon: "📉",
    quote: "When you have the advantage, don't trade — make your opponent suffer.",
    author: "GM Garry Kasparov",
    color: "violet",
  },
  {
    tag: "Weakened Pawn Structure",
    label: "Weakened Pawn Structure",
    icon: "🏚️",
    quote: "Pawns are the soul of chess.",
    author: "GM Philidor",
    color: "yellow",
  },
  {
    tag: "King Exposure",
    label: "Exposed Own King",
    icon: "👑",
    quote: "The king is a fighting piece. Use it! But never leave it exposed in the middlegame.",
    author: "GM Wilhelm Steinitz",
    color: "red",
  },
  {
    tag: "Missed Development",
    label: "Missed Development",
    icon: "🐌",
    quote: "Develop your pieces to good squares, castle early, and connect your rooks.",
    author: "GM José Raúl Capablanca",
    color: "blue",
  },
  {
    tag: "Wrong Recapture",
    label: "Wrong Recapture",
    icon: "↩️",
    quote: "Recapturing towards the center is almost always correct.",
    author: "GM Siegbert Tarrasch",
    color: "cyan",
  },
  {
    tag: "Piece Activity",
    label: "Reduced Piece Activity",
    icon: "📊",
    quote: "A knight on the rim is dim.",
    author: "Traditional chess proverb",
    color: "indigo",
  },
  {
    tag: "Prophylaxis",
    label: "Missed Prophylaxis",
    icon: "🛡️",
    quote: "The threat is stronger than the execution. First restrain, then blockade, then destroy.",
    author: "GM Aron Nimzowitsch",
    color: "teal",
  },
  {
    tag: "Greedy Pawn Grab",
    label: "Greedy Pawn Grab",
    icon: "🍕",
    quote: "The punishment for grabbing pawns is usually a lost tempo, and tempi are worth more than pawns.",
    author: "GM Garry Kasparov",
    color: "orange",
  },
  {
    tag: "Inaccuracy",
    label: "General Inaccuracy",
    icon: "⚠️",
    quote: "Every chess master was once a beginner. Small inaccuracies compound into lost games.",
    author: "GM Irving Chernev",
    color: "slate",
  },
  {
    tag: "Neglected Castling",
    label: "Neglected Castling",
    icon: "🏰",
    quote: "Castle early and often — a king in the center is a target, not a ruler.",
    author: "GM Reuben Fine",
    color: "blue",
  },
  {
    tag: "Aimless Move",
    label: "Aimless Moves",
    icon: "🌀",
    quote: "Every move must have a purpose. If you can't explain why you played it, you shouldn't have.",
    author: "GM Savielly Tartakower",
    color: "violet",
  },
  {
    tag: "Overextended Pawn",
    label: "Overextended Pawns",
    icon: "📏",
    quote: "Pawns cannot move backwards. Every pawn move creates a permanent weakness.",
    author: "GM Siegbert Tarrasch",
    color: "red",
  },
  {
    tag: "Center Neglect",
    label: "Center Neglect",
    icon: "🎯",
    quote: "The player who controls the center controls the game.",
    author: "GM Wilhelm Steinitz",
    color: "teal",
  },
];

const patternMap = new Map(POSITIONAL_PATTERNS.map((p) => [p.tag, p]));

/**
 * Look up the GM quote for a positional pattern tag.
 * Returns null if the tag is not a known positional pattern.
 */
export function getPatternQuote(tag: string): { quote: string; author: string } | null {
  const p = patternMap.get(tag);
  return p ? { quote: p.quote, author: p.author } : null;
}

/**
 * Find all positional pattern objects that match any of the given tags.
 */
export function getMatchingPatterns(tags: string[]): PositionalPattern[] {
  return tags.map((t) => patternMap.get(t)).filter(Boolean) as PositionalPattern[];
}

/**
 * Check if any tag in the array is a positional pattern.
 */
export function hasPositionalPattern(tags: string[]): boolean {
  return tags.some((t) => patternMap.has(t));
}
