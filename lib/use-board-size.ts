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
export function useBoardSize(
  fallback = 400,
  opts?: { evalBar?: boolean; minSize?: number; maxWidth?: number },
) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(fallback);
  const hasEvalBar = opts?.evalBar !== false;
  const minSize = opts?.minSize ?? 260;
  const maxWidth = opts?.maxWidth;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const cs = getComputedStyle(el);
      const px =
        parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0");
      // Content width inside padding
      const contentWidth = el.clientWidth - px;
      // Subtract eval-bar (24px) + gap (gap-2 = 8px on mobile, gap-3 = 12px sm+)
      // Use 12px to be safe — board may be ≤4px smaller on mobile but never overflows
      const evalBarOverhead = hasEvalBar ? 24 + 12 : 0;
      const available = contentWidth - evalBarOverhead;

      // Use viewport-relative sizing so the board scales dynamically with any window size.
      const vw = window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      // Wide screens sit beside text in the learn runner, so cap width usage there.
      const widthShare = vw >= 1024 ? 0.5 : 0.88;
      let maxByWidth = vw * widthShare;
      if (maxWidth != null) maxByWidth = Math.min(maxByWidth, maxWidth);
      // Cap by height on ALL screen sizes — subtract enough for navbar + surrounding UI.
      // On /learn we want everything on one screen: reserve ~240px for top bar + controls + padding.
      const maxByHeight = Math.max(320, vh - 240);
      const maxSize = Math.min(maxByWidth, maxByHeight, fallback);

      setSize(Math.max(minSize, Math.min(available, maxSize)));
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
  }, [fallback, hasEvalBar, minSize, maxWidth]);

  return { ref, size };
}
