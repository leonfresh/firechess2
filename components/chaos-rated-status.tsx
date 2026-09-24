"use client";
import { useChaosAccount } from "@/lib/use-chaos-account";
import { chaosIdentityHeaders } from "@/lib/chaos-client-identity";
import styles from "./chaos-rated-status.module.css";

export function ChaosRatedStatus({ mode = "online", unlimited = false, compact = false }: {
  mode?: "online" | "friends" | "practice";
  unlimited?: boolean;
  compact?: boolean;
}) {
  const { data, error, isLoading, mutate } = useChaosAccount();
  const player = data?.player;
  // Both queue matches and friend matches count since Sep 2026 — a timed clock, two signed-in
  // players and a move each is what makes a game rated. Practice and No rush stay casual.
  const eligible = !!player && !error && !isLoading && mode !== "practice" && !unlimited;
  const casual = mode === "practice" || unlimited || (!isLoading && !error && !player);
  const reason = mode === "practice" ? "Practice against the AI does not change your rating."
    : unlimited ? "No rush games are casual. Choose a timed clock for rated play."
    : isLoading ? "Checking your account before the game."
    : error ? "Your sign-in status could not be checked. Try again before starting a rated game."
    : !player ? "Guest games are casual. Sign in before playing a timed game to qualify for rated play."
    : mode === "friends" ? "Your friend must also be signed in and make a move. Only the first three games between the same two players each day count."
    : "You qualify for rated matchmaking. Your opponent must also be signed in, and both players must make a move.";
  return <section className={styles.card} aria-label="Account and rated eligibility">
    <div className={styles.heading}>
      <strong>{isLoading ? "Checking sign-in…" : error ? "Account status unavailable" : player ? `Signed in as ${player.name}` : "Playing as a guest"}</strong>
      <span className={styles.badge} data-rated={eligible}>
        {eligible ? "Rated eligible" : casual ? "Casual" : error ? "Eligibility unavailable" : "Checking eligibility"}
      </span>
    </div>
    {compact ? <details className={styles.details}><summary>Rating details</summary><p>{reason}</p><p>Rated games need a timed clock and a move from each player. Up to three games between the same two players count per day.</p></details> : <p>{reason}</p>}
    {!isLoading && !error && !player && !chaosIdentityHeaders()["X-Chaos-Identity"] && (
      <a className={styles.signIn} href="https://www.firechess.com/api/chaos/website-login">Sign in to unlock rated play <span aria-hidden="true">↗</span></a>
    )}
    {error && <button type="button" className={styles.signIn} onClick={() => void mutate()}>Retry account check</button>}
    {eligible && !compact && <small>Rated results update your ladder rating. A displayed username alone does not make every match rated.</small>}
  </section>;
}
