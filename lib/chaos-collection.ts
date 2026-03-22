/**
 * Shared constants for the Chaos Chess modifier collection / unlock system.
 * Used by both the client page and the server-side API routes.
 */

/**
 * Modifier IDs available to all players without signing up.
 * 6 commons + 5 rares + 2 epics = 13 total.
 */
export const GUEST_UNLOCKED_IDS = new Set([
  // Commons
  "pawn-charge",
  "pawn-capture-forward",
  "camel",
  "dragon-bishop",
  "kings-chains",
  "dragon-rook",
  // Rares
  "night-rider",
  "phantom-rook",
  "sniper-bishop",
  "enpassant-everywhere",
  "knook",
  // Epics
  "queen-teleport",
  "bishop-cannon",
]);

/** localStorage key for an earn-then-signup pending unlock */
export const LS_PENDING_UNLOCK = "firechess_pending_unlock";

/** localStorage key tracking whether guest has already earned their first-win unlock */
export const LS_FIRST_WIN_DONE = "firechess_chaos_first_win_done";
