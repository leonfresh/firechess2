/**
 * Weekly "weakness of the week" content — the engine behind the lead-magnet
 * promise on the homepage ("a free weekly weakness report").
 *
 * Each entry is a real, recurring mistake pattern that trips up players in a
 * given rating bracket. The digest rotates through them week by week so the
 * email delivers genuine value even to subscribers who have never scanned a
 * game — which is what keeps the list alive and open rates high.
 *
 * Used by:
 *   - /api/cron/weekly-digest  (the weekly email)
 *   - /api/subscribe           (the welcome email's first tip)
 */

export type WeaknessTip = {
  /** Short motif / pattern name, e.g. "Hanging a piece in one move". */
  title: string;
  /** One-sentence summary of why this leaks rating. */
  blurb: string;
  /** A concrete fix — the actionable part. */
  fix: string;
  /** Theme tag for grouping / future drilling. */
  theme: "tactics" | "openings" | "endgames" | "clock" | "mindset";
};

export type RatingBracket = "beginner" | "intermediate" | "advanced";

/** Map a numeric rating to a bracket. Lichess and Chess.com both work here. */
export function ratingBracket(rating: number | null | undefined): RatingBracket {
  if (rating == null) return "intermediate";
  if (rating < 1200) return "beginner";
  if (rating < 1800) return "intermediate";
  return "advanced";
}

const BY_BRACKET: Record<RatingBracket, WeaknessTip[]> = {
  beginner: [
    {
      title: "Hanging a piece in one move",
      blurb: "Roughly 1 in 3 losses under 1000 comes from leaving a piece undefended for a single move.",
      fix: "Before every move, blunder-check: 'What does this piece attack, and what attacks it?'",
      theme: "tactics",
    },
    {
      title: "Forgetting to castle",
      blurb: "An uncastled king is the #1 reason games end in 20 moves at this level.",
      fix: "Aim to castle by move 10 unless you have a concrete reason not to.",
      theme: "openings",
    },
    {
      title: "Trading everything when ahead",
      blurb: "Simplifying feels safe, but trading your last attacker lets the opponent defend forever.",
      fix: "When up material, keep pieces on that attack — trades help the defender.",
      theme: "mindset",
    },
    {
      title: "Missing the back-rank mate",
      blurb: "The most common tactical pattern below 1200 — your own pawns block the escape square.",
      fix: "Glance at the back rank before every opponent move; create a luft when cramped.",
      theme: "tactics",
    },
  ],
  intermediate: [
    {
      title: "Drifting in the opening",
      blurb: "Developing pieces without a plan after move 8 is where most 1200–1600 games are quietly lost.",
      fix: "After the opening principles, ask 'which pawn structure am I fighting for?' before moving.",
      theme: "openings",
    },
    {
      title: "Missing a fork or pin",
      blurb: "Two-piece tactics decide the majority of games between 1200 and 1700.",
      fix: "Spend 5 minutes a day on knight forks and pins — pattern recognition beats calculation here.",
      theme: "tactics",
    },
    {
      title: "Drawing won endgames",
      blurb: "Up an exchange or a pawn, the most common result at this level is still a draw.",
      fix: "Learn the Lucena and Philidor positions cold — they cover most rook endgames.",
      theme: "endgames",
    },
    {
      title: "Time trouble from move 15",
      blurb: "Burning 5 minutes on move 12 leaves nothing for the decisive moments.",
      fix: "Cap opening thinking at 2 minutes total; trust your prep and play the middlegame with time.",
      theme: "clock",
    },
  ],
  advanced: [
    {
      title: "Overextending the kingside attack",
      blurb: "Above 1800, unsound sacrifices succeed less often — and the counterattack is fatal.",
      fix: "Before sac'ing, count defenders, not attackers — and check the opponent's open lines.",
      theme: "tactics",
    },
    {
      title: "Misjudging the isolated pawn",
      blurb: "Playing for or against the IQP is decided by minor-piece activity, not the pawn itself.",
      fix: "When facing an IQP, trade into the endgame; when holding one, keep knights and avoid blockades.",
      theme: "openings",
    },
    {
      title: "Trading into a worse endgame",
      blurb: "Simplification isn't neutral — it crystallises a small disadvantage into a lost one.",
      fix: "Before every trade, ask if the resulting endgame favours you. Doubt? Keep tension.",
      theme: "endgames",
    },
    {
      title: "Pre-move autopilot in the opening",
      blurb: "At 1800+, opponents punish the one move you played without thinking.",
      fix: "Even in your repertoire, take 15 seconds on move 8 to check for deviations.",
      theme: "clock",
    },
  ],
};

/**
 * Deterministically pick the week's weakness for a bracket so every subscriber
 * in that bracket sees the same tip in a given week (feels coherent), but it
 * rotates each week. Determinism also makes the welcome email match whatever
 * the current week's digest shows.
 */
export function weeklyWeakness(
  bracket: RatingBracket,
  weekIndex: number,
): WeaknessTip {
  const tips = BY_BRACKET[bracket];
  return tips[weekIndex % tips.length];
}

/** Current ISO-week index (weeks since epoch). Use for rotation. */
export function currentWeekIndex(now: Date = new Date()): number {
  // ~52.18 weeks per year; integer rotation is fine for this purpose.
  return Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
}
