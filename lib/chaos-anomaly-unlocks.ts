/** Anomaly unlocks expand your own opening pool; they never increase ability strength. */
export const ANOMALY_PRICES: Readonly<Record<string, number>> = {
  // Halved with the card prices on 2026-09-26 (see SHOP_PRICES in lib/chaos-shop.ts).
  magician:125, "high-priestess":75, lovers:75, chariot:75, hermit:75,
  "hanged-man":75, death:125, tower:125, moon:125, judgement:150, world:150,
};
export const anomalyKey = (id: string) => `anomaly:${id}`;
export function ownsAnomaly(id: string, owned: readonly string[] = []) {
  return !(id in ANOMALY_PRICES) || owned.includes(anomalyKey(id));
}
export function cosmeticMastery(games: number) {
  const count = Math.max(0, Math.floor(games));
  return {games:count, tier:count>=40?'gold':count>=15?'silver':count>=5?'bronze':'none', next:count>=40?null:count>=15?40:count>=5?15:5};
}
