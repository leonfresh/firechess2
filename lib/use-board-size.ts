"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns a responsive board width that fits inside the container element.
 * Falls back to `fallback` until the ref is mounted.
 */
export function useBoardSize(fallback = 400) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      // Available width minus eval-bar (24px) and gap (12px)
      const available = el.clientWidth - 36;
      // Clamp between 260 (small phones) and the fallback max
      setSize(Math.max(260, Math.min(available, fallback)));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);

  return { ref, size };
}
