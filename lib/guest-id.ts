"use client";

const STORAGE_KEY = "firechess_guest_id";

/**
 * Get (or generate) a stable guest ID stored in localStorage.
 * Format: `guest_<uuid>` — distinguishable from real user IDs.
 */
export function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
