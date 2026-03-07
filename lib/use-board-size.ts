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

      // On mobile, cap board so it doesn't consume all vertical space.
      // Use visualViewport (more reliable on iOS) or window.innerHeight.
      const vw = window.innerWidth;
      let maxByHeight = Infinity;
      if (vw < 1024) {
        const vh = window.visualViewport?.height ?? window.innerHeight;
        // Reserve ~260px for player labels, commentary, controls, navbar, etc.
        maxByHeight = Math.max(260, vh - 280);
      }

      setSize(Math.max(260, Math.min(available, fallback, maxByHeight)));
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
