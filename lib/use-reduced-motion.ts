import { useEffect, useState } from "react";

/**
 * Tracks the user's `prefers-reduced-motion` setting.
 *
 * Returns `true` when the OS/browser requests reduced motion, so JS-driven
 * loops (autoplaying carousels, board demos, etc.) can pause themselves.
 * Purely decorative CSS animation is handled globally in `app/globals.css`;
 * this hook is for animation that JavaScript drives on a timer.
 *
 * SSR-safe: starts `false` and updates after mount.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}
