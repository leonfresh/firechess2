"use client";

/**
 * RefTracker — reads ?ref= from the URL and persists it as a first-click cookie.
 *
 * Rules:
 * - First-click wins: if fc_ref cookie is already set, do nothing.
 * - Cookie lasts 90 days from the first visit.
 * - Value is lowercased and URL-encoded for safety.
 *
 * Wrap in <Suspense> in the layout because useSearchParams
 * suspends during static prerendering.
 */

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const COOKIE_NAME = "fc_ref";
const COOKIE_DAYS = 90;

export function RefTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    // First-click wins: only set if not already present
    const alreadySet = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith(COOKIE_NAME + "="));
    if (alreadySet) return;

    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_DAYS);
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(ref.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }, [searchParams]);

  return null;
}
