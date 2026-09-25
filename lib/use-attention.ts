"use client";
/**
 * Get a player's attention when a match needs them and they are looking elsewhere (another tab, or
 * Discord in the background): the tab title flashes the message, and one cue plays with a short
 * vibration on phones. Stops as soon as the page is visible and focused again, or the message
 * clears. In Sept 2026 about a third of matched games aborted because the first move never came.
 */
import { useEffect } from "react";
import { playSound } from "@/lib/sounds";

export function useAttention(message: string | null) {
  useEffect(() => {
    if (!message) return;
    const original = document.title;
    const away = () => document.hidden || !document.hasFocus();
    if (away()) {
      playSound("bell-double");
      try { navigator.vibrate?.(180); } catch {}
    }
    let on = false;
    const timer = setInterval(() => {
      if (!away()) { if (on) { document.title = original; on = false; } return; }
      on = !on;
      document.title = on ? message : original;
    }, 1000);
    return () => { clearInterval(timer); document.title = original; };
  }, [message]);
}
