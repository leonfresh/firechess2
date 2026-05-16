/**
 * Curated sample reports shown on the homepage.
 * After running a scan and saving a public report, paste the report ID from
 * the URL (/report/[id]) into the `reportId` field. Leave it as an empty
 * string while the scan is pending — the card will show a "Coming soon" state.
 *
 * Highlights are populated automatically once you run the scan and can be
 * copy-pasted from the report summary numbers.
 */

export type SampleReportTier = "elite" | "club" | "beginner";

export type SampleReport = {
  /** Chess.com or Lichess username (case-insensitive for API calls) */
  username: string;
  /** Display name override (optional, defaults to username) */
  displayName?: string;
  source: "chess.com" | "lichess";
  /** Approximate peak or current blitz rating shown as context */
  rating: number;
  tier: SampleReportTier;
  /** Short role/context label shown under the name */
  label: string;
  /** Report UUID from /report/[id]. Leave "" until the scan is done. */
  reportId: string;
  /** Key numbers pulled from the report for the preview card */
  highlights: {
    gamesScanned?: number;
    openingLeaks?: number;
    missedTactics?: number;
    endgameMistakes?: number;
  };
};

export const SAMPLE_REPORTS: SampleReport[] = [
  // ── Elite ──────────────────────────────────────────────────────────────────
  {
    username: "hikaru",
    displayName: "Hikaru Nakamura",
    source: "chess.com",
    rating: 3300,
    tier: "elite",
    label: "GM · World #2",
    reportId: "", // TODO: paste report ID after scan
    highlights: {},
  },
  {
    username: "MagnusCarlsen",
    displayName: "Magnus Carlsen",
    source: "chess.com",
    rating: 3400,
    tier: "elite",
    label: "GM · World #1",
    reportId: "", // TODO: paste report ID after scan
    highlights: {},
  },
  {
    username: "GothamChess",
    displayName: "Levy Rozman",
    source: "chess.com",
    rating: 2400,
    tier: "elite",
    label: "IM · GothamChess",
    reportId: "", // TODO: paste report ID after scan
    highlights: {},
  },

  // ── Club ───────────────────────────────────────────────────────────────────
  {
    username: "AlexandraBotez",
    displayName: "Alexandra Botez",
    source: "chess.com",
    rating: 1800,
    tier: "club",
    label: "WFM · Botez Live",
    reportId: "", // TODO: paste report ID after scan
    highlights: {},
  },
  {
    username: "AndreaBotez",
    displayName: "Andrea Botez",
    source: "chess.com",
    rating: 2000,
    tier: "club",
    label: "Streamer · Botez Live",
    reportId: "", // TODO: paste report ID after scan
    highlights: {},
  },
  {
    username: "EricRosen",
    displayName: "Eric Rosen",
    source: "chess.com",
    rating: 2400,
    tier: "club",
    label: "IM · Oh no my queen",
    reportId: "", // TODO: paste report ID after scan
    highlights: {},
  },

  // ── Beginner / PogChamps ───────────────────────────────────────────────────
  {
    username: "BIG_TONKA_T",
    displayName: "Tyler1",
    source: "chess.com",
    rating: 500,
    tier: "beginner",
    label: "Streamer · PogChamps",
    reportId: "", // TODO: paste report ID after scan
    highlights: {},
  },
  {
    username: "xqcow",
    displayName: "xQc",
    source: "chess.com",
    rating: 700,
    tier: "beginner",
    label: "Streamer · PogChamps",
    reportId: "", // TODO: paste report ID after scan
    highlights: {},
  },
  {
    username: "MoistCr1TiKaL",
    displayName: "MoistCr1TiKaL",
    source: "chess.com",
    rating: 700,
    tier: "beginner",
    label: "Streamer · PogChamps",
    reportId: "", // TODO: paste report ID after scan
    highlights: {},
  },
];

export const TIER_META: Record<
  SampleReportTier,
  { label: string; description: string; color: string; accent: string }
> = {
  elite: {
    label: "Elite",
    description: "Even GMs have patterns worth fixing",
    color: "from-amber-400/20 via-orange-400/10 to-transparent",
    accent: "text-amber-300",
  },
  club: {
    label: "Club Players",
    description: "Rated 1400–2000 — the biggest improvement zone",
    color: "from-sky-400/15 via-cyan-400/8 to-transparent",
    accent: "text-sky-300",
  },
  beginner: {
    label: "PogChamps",
    description: "Streamers who learned on camera — relatable patterns",
    color: "from-emerald-400/15 via-teal-400/8 to-transparent",
    accent: "text-emerald-300",
  },
};
