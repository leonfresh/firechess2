"use client";
import { useChaosAccount } from "@/lib/use-chaos-account";
import { chaosIdentityHeaders } from "@/lib/chaos-client-identity";
import styles from "./chaos-rated-status.module.css";

export function ChaosRatedStatus({ mode = "online", unlimited = false }: {
  mode?: "online" | "friends" | "practice";
  unlimited?: boolean;
}) {
  const { data, error, isLoading, mutate } = useChaosAccount();
  const player = data?.player;
  const eligible = !!player && !error && !isLoading && mode === "online" && !unlimited;
  const reason = mode === "friends" ? "Friend matches are always casual, even when both players are signed in."
    : mode === "practice" ? "Practice against the AI does not change your rating."
    : unlimited ? "No rush games are casual. Choose a timed clock for rated play."
    : isLoading ? "Checking your account before matchmaking."
    : error ? "Your sign-in status could not be checked. Try again before seeking a rated game."
    : !player ? "Guest matches are casual. Sign in before joining timed matchmaking to qualify for rated play."
    : "You qualify for rated matchmaking. Your opponent must also be signed in, and both players must make a move.";
  return <section className={styles.card} aria-label="Account and rated eligibility">
    <div className={styles.heading}>
      <strong>{isLoading ? "Checking sign-in…" : error ? "Account status unavailable" : player ? `Signed in as ${player.name}` : "Playing as a guest"}</strong>
      <span className={styles.badge} data-rated={eligible}>
        {eligible ? "Rated eligible" : mode !== "online" || unlimited || (!isLoading && !error && !player) ? "Casual" : error ? "Eligibility unavailable" : "Checking eligibility"}
      </span>
    </div>
    <p>{reason}</p>
    {!isLoading && !error && !player && !chaosIdentityHeaders()["X-Chaos-Identity"] && (
      <a className={styles.signIn} href="https://www.firechess.com/api/chaos/website-login">Sign in to unlock rated play <span aria-hidden="true">↗</span></a>
    )}
    {error && <button type="button" className={styles.signIn} onClick={() => void mutate()}>Retry account check</button>}
    {eligible && <small>Rated results update your ladder rating. A username alone does not make every match rated.</small>}
  </section>;
}
