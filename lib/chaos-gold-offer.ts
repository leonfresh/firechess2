/**
 * Which card to put in front of a player who can afford one (result screen, lobby notice, shop dot).
 * Pure so it can be tested: the route supplies the catalogue, what the player owns and their gold.
 */
import type { ShopEntry } from "./chaos-shop";

/** Why each ledger line was paid, in the words the result screen uses. */
export const GOLD_REASON_LABELS: Record<string, string> = {
  match: "Game played",
  daily_win: "First win today",
  streak: "Daily streak",
  chaos_hour: "Chaos Hour ×2",
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Every unowned card the balance covers, and one of them to offer. The pick varies with the seed
 * (the match id after a game) so the offer is not always the cheapest card in the shop.
 */
export function goldOffer(catalogue: readonly ShopEntry[], owned: ReadonlySet<string>, balance: number, seed = "") {
  const affordable = catalogue.filter((card) => !owned.has(card.id) && card.price <= balance);
  const offer = affordable.length ? affordable[hash(seed) % affordable.length] : null;
  return { offer, affordable: affordable.length };
}
