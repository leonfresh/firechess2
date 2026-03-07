"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns a responsive board width that fits inside the container element.
 * Accounts for the container's own padding, and optionally the eval-bar (24px)
 * plus flex gap.  Falls back to `fallback` until the ref is mounted.
 *
 * Pass `evalBar: false` when the board has no eval bar sidebar.
 */
export function useBoardSize(fallback = 400, opts?: { evalBar?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(fallback);
  const hasEvalBar = opts?.evalBar !== false;

  useEffect(() => {
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

      // On mobile / tablet, use viewport-relative sizing rather than fixed pixel caps.
      // This ensures the board scales naturally with ANY device size.
      const vw = window.innerWidth;
      let maxSize = fallback;
      if (vw < 1024) {
        const vh = window.visualViewport?.height ?? window.innerHeight;
        // Board should be at most 88% of viewport width (leave side padding)
        const maxByWidth = vw * 0.88;
        // Board should also leave ~250px for navbar + player labels + commentary + controls
        const maxByHeight = Math.max(260, vh - 250);
        maxSize = Math.min(maxByWidth, maxByHeight, fallback);
      }

      setSize(Math.max(260, Math.min(available, maxSize)));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Also listen for visual viewport resize (iOS keyboard, address bar)
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [fallback, hasEvalBar]);

  return { ref, size };
}
