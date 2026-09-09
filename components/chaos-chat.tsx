"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./chaos-chat.module.css";

export type ChatLine = { id: string; text: string; mine: boolean; ts: number };

export function ChaosChat({ messages, connected, busy, error, onSend }: {
  messages: ChatLine[]; connected: boolean; busy: boolean; error: string;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [seen, setSeen] = useState<string>();
  const pending = useRef<{text: string; previous: string[]} | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const last = messages.at(-1)?.id;
  const seenIndex = messages.findIndex(m => m.id === seen);
  const unread = messages.slice(seenIndex + 1).filter(m => !m.mine).length;
  useEffect(() => {
    const sent = pending.current;
    if (sent && messages.some(m => m.mine && m.text === sent.text && !sent.previous.includes(m.id))) {
      setText(""); pending.current = null;
    }
  }, [messages, last]);
  useEffect(() => {
    if (!open) return;
    setSeen(last);
    // Scroll this panel only; never pull the board out of view.
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [open, last]);
  return <section className={`chaos-match-chat ${styles.panel}`} aria-label="Match chat">
    <button className={styles.toggle} aria-expanded={open} onClick={() => setOpen(!open)}>
      <span>Match chat <small>Just you and your opponent</small></span>
      <span>{!open && !muted && unread > 0 ? <b className={styles.badge}>{unread}</b> : null} {open ? "−" : "+"}</span>
    </button>
    {open && <div className={styles.body}>
      <div className={styles.tools}><span>{connected ? "Connected" : "Reconnecting…"}</span><button onClick={() => setMuted(!muted)} aria-pressed={muted}>{muted ? "Unmute opponent" : "Mute opponent"}</button></div>
      <div className={styles.log} ref={log} role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 && <p className={styles.empty}>Say hello. Wish them luck. Blame the cards.</p>}
        {messages.filter(m => !muted || m.mine).map(m => <div key={m.id} className={`${styles.message} ${m.mine ? styles.mine : ""}`}><small>{m.mine ? "You" : "Opponent"}</small><p>{m.text}</p></div>)}
        {muted && <p className={styles.empty}>Opponent messages are hidden.</p>}
      </div>
      <form className={styles.form} onSubmit={e => { e.preventDefault(); if (!text.trim() || !connected || busy) return; pending.current = {text: text.trim(), previous: messages.map(m => m.id)}; onSend(text.trim()); }}>
        <input aria-label="Message your opponent" placeholder="Your message…" value={text} onChange={e => setText(e.target.value)} maxLength={300} autoComplete="off" onKeyDown={e => e.stopPropagation()} />
        <button disabled={!text.trim() || !connected || busy} type="submit">Send</button>
      </form>
      <p className={styles.note} role="status">{error || (busy ? "Saving…" : "Be kind · Last 50 messages saved in this room")}</p>
    </div>}
  </section>;
}
