/**
 * Chaos Chess ELO rating system.
 *
 * Standard ELO with variable K-factor:
 *   K = 40  for players with fewer than 20 games (provisional)
 *   K = 20  for rating < 2000
 *   K = 10  for rating >= 2000
 *
 * All players start at 1200.
 */

/** Expected score for player A against player B. */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/** K-factor based on current rating and games played. */
export function kFactor(rating: number, gamesPlayed: number): number {
  if (gamesPlayed < 20) return 40; // provisional
  if (rating < 2000) return 20;
  return 10;
}

/**
 * Compute the ELO change for a player after one game.
 * @param myRating       Current ELO of this player
 * @param opponentRating Current ELO of opponent
 * @param result         1 = win, 0.5 = draw, 0 = loss
 * @param gamesPlayed    Number of ranked games played so far (before this game)
 */
export function computeEloChange(
  myRating: number,
  opponentRating: number,
  result: 1 | 0.5 | 0,
  gamesPlayed: number,
): number {
  const E = expectedScore(myRating, opponentRating);
  const K = kFactor(myRating, gamesPlayed);
  return Math.round(K * (result - E));
}

/** Default starting ELO for new chaos chess players. */
export const DEFAULT_CHAOS_ELO = 1200;

/** Time control presets: { label, base (seconds), inc (seconds) } */
export const TIME_CONTROLS = [
  { label: "∞  Unlimited", base: 0,   inc: 0 },
  { label: "3+0  Bullet",  base: 180, inc: 0 },
  { label: "5+3  Blitz",   base: 300, inc: 3 },
  { label: "10+5 Rapid",   base: 600, inc: 5 },
  { label: "15+10 Rapid",  base: 900, inc: 10 },
] as const;

export type TimeControlPreset = (typeof TIME_CONTROLS)[number];
