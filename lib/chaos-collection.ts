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
