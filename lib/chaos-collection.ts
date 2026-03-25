/**
 * Shared constants for the Chaos Chess modifier collection / unlock system.
 * Used by both the client page and the server-side API routes.
 */

/**
 * Modifier IDs available to all players without signing up.
 * All 7 commons + 10 rares + 3 milder epics = 20 unlocked.
 * Locked (~10): the high-power epics + all legendaries.
 */
export const GUEST_UNLOCKED_IDS = new Set([
  // Commons (all 7)
  "pawn-charge",
  "pawn-capture-forward",
  "camel",
  "dragon-bishop",
  "kings-chains",
  "dragon-rook",
  "pawn-promotion-early",
  // Rares (10 of 11 — amazon locked as premium)
  "night-rider",
  "phantom-rook",
  "sniper-bishop",
  "enpassant-everywhere",
  "knook",
  "archbishop",
  "king-ascension",
  "usurper",
  "bishop-bounce",
  // Epics (3 of 8 — milder ones)
  "queen-teleport",
  "bishop-cannon",
  "pawn-fortress",
]);

/** localStorage key for an earn-then-signup pending unlock */
export const LS_PENDING_UNLOCK = "firechess_pending_unlock";

/** localStorage key tracking whether guest has already earned their first-win unlock */
export const LS_FIRST_WIN_DONE = "firechess_chaos_first_win_done";

/**
 * localStorage key for the set of modifier IDs a guest has already previewed.
 * Stored as a JSON array. Previewed cards are excluded from future draft pools,
 * so guests gradually see weaker cards until they sign in to unlock permanently.
 */
export const LS_PREVIEWED_MODS = "firechess_chaos_previewed_mods";

/**
 * localStorage key — when "1", skip the "are you sure?" confirmation before
 * using a preview card. Set when user checks "don't ask again".
 */
export const LS_PREVIEW_NO_CONFIRM = "firechess_chaos_preview_no_confirm";

/**
 * Ordered list of modifier IDs that unlock progressively for signed-in users.
 * Unlock thresholds are front-loaded so new players earn early mods quickly.
 * Ordered weakest → strongest so casual players earn mild upgrades first.
 */
export const PROGRESSION_UNLOCK_ORDER: readonly string[] = [
  "king-wrath", // game  2 — Regicide (rare)
  "forced-en-passant", // game  5 — Forced En Passant (rare)
  "queen-cannon", // game  9 — Queen Cannon (epic)
  "collateral-rook", // game 14 — Collateral Damage (epic)
  "nuclear-queen", // game 20 — Nuclear Queen (legendary)
  "rook-cannon", // game 27 — Rook Cannon (legendary)
  "knight-horde", // game 35 — Knight Horde (legendary)
  "undead-army", // game 44 — Undead Army (legendary)
  "railgun", // game 54 — Railgun (legendary)
  "kamikaze-bishop", // game 60 — Kamikaze Bishop (legendary)
  "amazon", // game 65 — The Amazon (legendary)
];

/**
 * Cumulative games-played threshold for each unlock in PROGRESSION_UNLOCK_ORDER.
 * Gaps increase arithmetically (2, 3, 4, 5 …) so early mods arrive fast
 * while later legendaries still require meaningful investment.
 */
export const UNLOCK_AT_GAMES: readonly number[] = [
  2, // king-wrath
  5, // forced-en-passant
  9, // queen-cannon
  14, // collateral-rook
  20, // nuclear-queen
  27, // rook-cannon
  35, // knight-horde
  44, // undead-army
  54, // railgun
  60, // kamikaze-bishop
  65, // amazon
];

/** @deprecated Use UNLOCK_AT_GAMES for per-step thresholds instead. */
export const GAMES_PER_UNLOCK = 5;
