"use client";
/**
 * Remember where this browser first arrived at Chaos Chess from, and report it for whichever
 * identity is active (/api/chaos/first-touch keeps the first row per identity). The original touch
 * is stored locally, so a guest who signs in days later is still credited to the source that
 * brought them, not to the page they signed in from. Inside the Discord Activity the referrer is
 * Discord's proxy, so only the surface is sent; chaos_launch already records the server and invite.
 */

import { chaosIdentityHeaders } from "@/lib/chaos-client-identity";
import { getGuestId } from "@/lib/guest-id";

const KEY = "chaos-first-touch";

type Touch = { referrer: string | null; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; ref: string | null; landing: string };

function captureTouch(): Touch {
  const url = new URL(window.location.href);
  let referrer: string | null = null;
  try {
    if (document.referrer && new URL(document.referrer).host !== url.host) referrer = document.referrer;
  } catch {}
  const param = (name: string) => url.searchParams.get(name);
  return { referrer, utmSource: param("utm_source"), utmMedium: param("utm_medium"), utmCampaign: param("utm_campaign"), ref: param("ref"), landing: url.pathname };
}

export function recordChaosFirstTouch(surface: "website" | "activity") {
  try {
    let touch: Touch | null = null;
    if (surface === "website") {
      try { touch = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
      if (!touch) {
        touch = captureTouch();
        try { localStorage.setItem(KEY, JSON.stringify(touch)); } catch {}
      }
    }
    void fetch("/api/chaos/first-touch", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Guest-Id": getGuestId(), ...chaosIdentityHeaders() },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({ surface, ...(touch ?? {}) }),
    }).catch(() => {});
  } catch {
    // Attribution must never break the game.
  }
}
