"use client";
import { useEffect, useState } from "react";
import styles from "./chaos-opening-move.module.css";

export function OpeningMoveNotice({ deadline, mine }: { deadline: number; mine: boolean }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer); }, [deadline]);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  return <div className={styles.notice} data-urgent={seconds <= 10}>
    <span>{mine ? "Make your first move" : "Waiting for opponent’s first move"}<small>Match aborts if no move is made. No rating change.</small></span>
    <strong role="timer" aria-label="Seconds until match aborts">{seconds}s</strong>
  </div>;
}

export function AbortedMatch({reason, onLobby}: {reason: string; onLobby: () => void}) {
  return <div className={styles.backdrop}><div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="abort-title">
    <h2 id="abort-title">Match aborted</h2><p>{reason}</p><p>No winner. No rating change.</p><button onClick={onLobby} autoFocus>Back to lobby</button>
  </div></div>;
}
