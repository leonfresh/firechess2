"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect fires before paint on the client; fall back to useEffect on the server
// to avoid the "useLayoutEffect does nothing on the server" React warning.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Returns a responsive board width that fits inside the container element.
 * Accounts for the container's own padding, and optionally the eval-bar (24px)
 * plus flex gap.  Falls back to `fallback` until the ref is mounted.
 *
 * Pass `evalBar: false` when the board has no eval bar sidebar.
 *
 * Uses useLayoutEffect so the correct size is calculated before the first paint,
 * preventing a flash of the oversized fallback value on mobile.
 */
export function useBoardSize(fallback = 400, opts?: { evalBar?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(fallback);
  const hasEvalBar = opts?.evalBar !== false;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const cs = getComputedStyle(el);
      const px =
        parseFloat(cs.paddingLeft || "0") +
        parseFloat(cs.paddingRight || "0");
      // Content width inside padding
      const contentWidth = el.clientWidth - px;
      // Subtract eval-bar (24px) + gap (gap-2 = 8px on mobile, gap-3 = 12px sm+)
      // Use 12px to be safe — board may be ≤4px smaller on mobile but never overflows
      const evalBarOverhead = hasEvalBar ? 24 + 12 : 0;
      const available = contentWidth - evalBarOverhead;

      // Use viewport-relative sizing so the board scales dynamically with any window size.
      const vw = window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      // Board should be at most 88% of viewport width (leave side padding)
      const maxByWidth = vw * 0.88;
      // On narrow/short viewports, also cap by height to leave room for UI
      const maxByHeight = vw < 1024 ? Math.max(260, vh - 250) : Infinity;
      const maxSize = Math.min(maxByWidth, maxByHeight, fallback);

      setSize(Math.max(260, Math.min(available, maxSize)));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Listen for window resize so viewport-relative caps update when browser is resized
    window.addEventListener("resize", update);
    // Also listen for visual viewport resize (iOS keyboard, address bar)
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [fallback, hasEvalBar]);

  return { ref, size };
}
