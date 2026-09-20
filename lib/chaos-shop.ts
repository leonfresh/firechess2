/**
 * The gold shop: cards you buy once and then draft forever.
 *
 * Every base card is free (see lib/chaos-collection.ts), so the shop sells variety, not power. The
 * buy route reads prices from here and never trusts an amount sent by the client.
 */
import { ALL_MODIFIERS, SHOP_CARD_IDS, type ChaosModifier } from "./chaos-chess";

/** Price by tier: roughly 6, 16 and 36 games at the gold rates in archive_chaos_match(). */
export const SHOP_PRICES: Readonly<Record<string, number>> = {
  common: 100,
  rare: 150,
  epic: 400,
  legendary: 900,
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
