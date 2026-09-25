"use client";
import { useEffect, useRef, useState } from "react";
import { playSound } from "@/lib/sounds";
import styles from "./chaos-opening-move.module.css";

export function OpeningMoveNotice({ deadline, mine }: { deadline: number; mine: boolean }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer); }, [deadline]);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  // Your first move: a cue when the window opens and a tick with 10 seconds left.
  const cued = useRef({ start: 0, ten: 0 });
  useEffect(() => {
    if (!mine) return;
    if (cued.current.start !== deadline) { cued.current.start = deadline; playSound("bell-double"); }
    if (seconds <= 10 && seconds > 0 && cued.current.ten !== deadline) { cued.current.ten = deadline; playSound("clock-tick"); }
  }, [mine, deadline, seconds]);
  return <div className={styles.notice} data-urgent={seconds <= 10}>
    <span>{mine ? "Make your first move" : "Waiting for opponent’s first move"}<small>Match aborts if no move is made. No rating change.</small></span>
    <strong role="timer" aria-label="Seconds until match aborts">{seconds}s</strong>
  </div>;
}

export function AbortedMatch({reason, onLobby, onRequeue}: {reason: string; onLobby: () => void; onRequeue?: () => void}) {
  return <div className={styles.backdrop}><div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="abort-title">
    <h2 id="abort-title">Match aborted</h2><p>{reason}</p><p>No winner. No rating change.</p>
    {onRequeue && <button onClick={onRequeue} autoFocus>Find a new opponent</button>}
    <button onClick={onLobby} autoFocus={!onRequeue} data-secondary={onRequeue ? "true" : undefined}>Back to lobby</button>
  </div></div>;
}
