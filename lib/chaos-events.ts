"use client";
/**
 * Player-journey events for Chaos Chess (see /api/chaos/event and migrations/chaos-events.sql):
 * what happens between opening Chaos and finishing a game. The order here is the funnel the
 * dashboard shows. The server infers the surface (a Discord identity means the Activity).
 */
import { chaosIdentityHeaders } from "@/lib/chaos-client-identity";
import { getGuestId } from "@/lib/guest-id";

export const CHAOS_EVENTS = [
  "lobby_view",
  "practice_start",
  "queue_start",
  "queue_cancel",
  "wait_ai",
  "invite",
  "match_found",
] as const;
export type ChaosEvent = (typeof CHAOS_EVENTS)[number];

/** Fire-and-forget; lobby_view is sent once per page load. */
let lobbySeen = false;
export function trackChaos(event: ChaosEvent, detail?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  if (event === "lobby_view") { if (lobbySeen) return; lobbySeen = true; }
  try {
    void fetch("/api/chaos/event", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Guest-Id": getGuestId(), ...chaosIdentityHeaders() },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({ event, ...(detail ? { detail } : {}) }),
    }).catch(() => {});
  } catch {
    // Analytics must never break the game.
  }
}
