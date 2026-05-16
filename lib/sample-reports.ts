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
    reportId: "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068",
    highlights: {},
  },
  {
    username: "MagnusCarlsen",
    displayName: "Magnus Carlsen",
    source: "chess.com",
    rating: 3377,
    tier: "elite",
    label: "GM · World #1",
    reportId: "4aa88749-ca3b-430e-9d03-f7dca08eadf2",
    highlights: {},
  },
  {
    username: "GothamChess",
    displayName: "Levy Rozman",
    source: "chess.com",
    rating: 2453,
    tier: "elite",
    label: "IM · GothamChess",
    reportId: "8c8d499e-1f04-4121-aabc-71a818b98ce6",
    highlights: {},
  },

  // ── Club ───────────────────────────────────────────────────────────────────
  {
    username: "AlexandraBotez",
    displayName: "Alexandra Botez",
    source: "chess.com",
    rating: 2267,
    tier: "club",
    label: "WFM · Botez Live",
    reportId: "bbacb94a-f71b-47f3-84ab-39d5696c1925",
    highlights: {},
  },
  {
    username: "supersecret12345",
    displayName: "Andrea Botez",
    source: "chess.com",
    rating: 2070,
    tier: "club",
    label: "Streamer · Botez Live",
    reportId: "f16a5e29-532c-4ee8-ba00-52fb01c20b3f",
    highlights: {},
  },
  {
    username: "EricRosen",
    displayName: "Eric Rosen",
    source: "chess.com",
    rating: 2400,
    tier: "club",
    label: "IM · Oh no my queen",
    reportId: "43d5016b-8693-40e0-bf5a-2d87434a7931",
    highlights: {},
  },

  // ── Beginner / PogChamps ───────────────────────────────────────────────────
  {
    username: "BIG_TONKA_T",
    displayName: "Tyler1",
    source: "chess.com",
    rating: 1596,
    tier: "beginner",
    label: "Streamer · PogChamps",
    reportId: "45315c3e-c79f-465d-973a-c629f7a341fd",
    highlights: {},
  },
  {
    username: "XQCow1",
    displayName: "xQc",
    source: "chess.com",
    rating: 804,
    tier: "beginner",
    label: "Streamer · PogChamps",
    reportId: "6ee89e5c-d93a-4c1b-b813-fa8a1f0df340",
    highlights: {},
  },
  {
    username: "turbofisto",
    displayName: "MoistCr1TiKaL",
    source: "chess.com",
    rating: 619,
    tier: "beginner",
    label: "Streamer · PogChamps",
    reportId: "5ec6e272-4a2e-4c7e-afa5-7c4cc0462619",
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
