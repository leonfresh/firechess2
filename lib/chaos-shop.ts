import { ALL_ANOMALIES } from "./chaos-anomalies";
import { ANOMALY_PRICES, anomalyKey } from "./chaos-anomaly-unlocks";
/**
 * The gold shop: cards you buy once and then draft forever.
 *
 * Every base card is free (see lib/chaos-collection.ts), so the shop sells variety, not power. The
 * buy route reads prices from here and never trusts an amount sent by the client.
 */
import { ALL_MODIFIERS, SHOP_CARD_IDS, type ChaosModifier } from "./chaos-chess";

/**
 * Price by tier. Halved on 2026-09-26: regulars really earn 12-20 gold a game (archive_chaos_match()
 * pays 10, +15 a win, +5 timed, +25 first win of the day), and at 150 for a rare only 4 of 121
 * players could buy anything. Now a first card is about 3 games away. Chaos Hour pays match gold twice.
 */
export const SHOP_PRICES: Readonly<Record<string, number>> = {
  common: 50,
  rare: 75,
  epic: 200,
  legendary: 450,
};

export type ShopEntry = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  phases: number[];
  price: number;
};

/** Everything the shop sells, cheapest first, so the list reads as a progression. */
export function shopCatalog(): ShopEntry[] {
  return ALL_MODIFIERS.filter((m) => SHOP_CARD_IDS.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      icon: m.icon,
      tier: m.tier,
      phases: [...m.phases],
      price: priceOf(m) ?? 900,
    }))
    .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
}

/** Server-side price for a purchasable card, or null when the card is not for sale. */
export function priceOf(mod: Pick<ChaosModifier, "id" | "tier">): number | null {
  if (!SHOP_CARD_IDS.has(mod.id)) return null;
  return SHOP_PRICES[mod.tier] ?? SHOP_PRICES.legendary;
}

/** True when the id names a card the shop sells. */
export function isShopCard(id: string): boolean {
  return SHOP_CARD_IDS.has(id);
}

/** The shop cards a player owns, given every unlock row loaded for them. */
export function ownedShopIds(unlockRows: readonly string[]): string[] {
  return unlockRows.filter((id) => SHOP_CARD_IDS.has(id));
}

/** Combined catalogue; anomaly storage IDs are namespaced away from modifier IDs. */
export function fullShopCatalog(): ShopEntry[] {
 return [...shopCatalog(), ...ALL_ANOMALIES.filter(a=>a.id in ANOMALY_PRICES).map(a=>({id:anomalyKey(a.id),name:a.name,description:a.description,icon:a.icon,tier:'anomaly',phases:[],price:ANOMALY_PRICES[a.id]}))];
}
