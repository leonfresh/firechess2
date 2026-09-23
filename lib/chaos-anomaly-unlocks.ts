/** Anomaly unlocks expand your own opening pool; they never increase ability strength. */
export const ANOMALY_PRICES: Readonly<Record<string, number>> = {
  magician:250, "high-priestess":150, lovers:150, chariot:150, hermit:150,
  "hanged-man":150, death:250, tower:250, moon:250, judgement:300, world:300,
};
export const anomalyKey = (id: string) => `anomaly:${id}`;
export function ownsAnomaly(id: string, owned: readonly string[] = []) {
  return !(id in ANOMALY_PRICES) || owned.includes(anomalyKey(id));
}
export function cosmeticMastery(games: number) {
  const count = Math.max(0, Math.floor(games));
  return {games:count, tier:count>=40?'gold':count>=15?'silver':count>=5?'bronze':'none', next:count>=40?null:count>=15?40:count>=5?15:5};
}
