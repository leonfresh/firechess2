"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns a responsive board width that fits inside the container element.
 * Accounts for the container's own padding, the eval-bar (24px) and the
 * flex gap.  Falls back to `fallback` until the ref is mounted.
 */
export function useBoardSize(fallback = 400) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(fallback);

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
      const evalBarOverhead = 24 + 12;
      const available = contentWidth - evalBarOverhead;
      setSize(Math.max(260, Math.min(available, fallback)));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);

  return { ref, size };
}
