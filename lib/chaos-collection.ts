/**
 * Shared constants for the Chaos Chess modifier collection / unlock system.
 * Used by both the client page and the server-side API routes.
 */

import { ACTIVE_MODIFIERS, SHOP_CARD_IDS } from "./chaos-chess";

/**
 * Modifier IDs available to every player, signed in or not: the whole set except the shop cards.
 * Shop cards are bought with gold (lib/chaos-shop.ts); nothing else is gated any more, so a new
 * player can play the full game and the shop's promise is variety rather than power.
 */
export const GUEST_UNLOCKED_IDS: ReadonlySet<string> = new Set(
  ACTIVE_MODIFIERS.filter((m) => !SHOP_CARD_IDS.has(m.id)).map((m) => m.id),
);

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
 * The games-played unlock ladder is gone: every base card is unlocked for everyone from the first
 * game, and the shop (lib/chaos-shop.ts) sells the rest. There is no longer a "next unlock" to
 * compute, so the ladder tables and getProgressionInfo() were removed with it - nothing in the app
 * gates a card on games played any more.
 */
