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
      setSize(Math.max(260, Math.min(available, fallback)));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback, hasEvalBar]);

  return { ref, size };
}
