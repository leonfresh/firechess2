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
  "kamikaze-bishop",
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
 * One modifier unlocks every GAMES_PER_UNLOCK games (starting at game 5).
 * All 10 locked mods unlock by game 50.
 * Ordered weakest → strongest so casual players earn mild upgrades first.
 */
export const PROGRESSION_UNLOCK_ORDER: readonly string[] = [
  "king-wrath",         // game  5 — Regicide (rare)
  "forced-en-passant",  // game 10 — Forced En Passant (rare)
  "queen-cannon",       // game 15 — Queen Cannon (epic)
  "collateral-rook",    // game 20 — Collateral Damage (epic)
  "nuclear-queen",      // game 25 — Nuclear Queen (legendary)
  "rook-cannon",        // game 30 — Rook Cannon (legendary)
  "knight-horde",       // game 35 — Knight Horde (legendary)
  "undead-army",        // game 40 — Undead Army (legendary)
  "railgun",            // game 45 — Railgun (legendary)
  "amazon",             // game 50 — The Amazon (legendary)
];

/** Games required between each progression unlock step. */
export const GAMES_PER_UNLOCK = 5;
