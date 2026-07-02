"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay: boolean },
          id: string,
        ) => void;
      };
    };
  }
}

/**
 * Lazy-loaded Google Translate widget.
 *
 * The script only loads when the user clicks the toggle, not on every page
 * load. This eliminates ~20+ HTTP requests and ~100 KB of render-blocking JS
 * from the critical path, improving LCP, CLS, and mobile performance scores.
 *
 * Once loaded, a "Language" pill toggles the native dropdown. The state
 * persists in-session but does NOT re-load the script on rehydration.
 */
export function GoogleTranslate() {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const loadScript = useCallback(() => {
    if (loaded || document.getElementById("google-translate-script")) return;
    setLoaded(true);

    window.googleTranslateElementInit = () => {
      try {
        new window.google!.translate.TranslateElement(
          { pageLanguage: "en", autoDisplay: false },
          "google_translate_element",
        );
      } catch {
        // silently fail — the widget degrades gracefully
      }
    };

    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.head.appendChild(s);
  }, [loaded]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => {
          if (!loaded) loadScript();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1.5 text-[11px] text-slate-500 transition-colors hover:text-slate-300"
        aria-label="Select language"
        aria-expanded={open}
      >
        <svg
          className="h-3 w-3 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
        </svg>
        Language
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 min-w-[160px] rounded-xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(6,10,24,0.96),rgba(18,18,38,0.95))] p-2 shadow-xl shadow-black/50 backdrop-blur-xl">
          <div
            id="google_translate_element"
            className="[&_.goog-te-combo]:w-full [&_.goog-te-combo]:rounded-lg [&_.goog-te-combo]:border [&_.goog-te-combo]:border-white/[0.1] [&_.goog-te-combo]:bg-white/[0.04] [&_.goog-te-combo]:px-2 [&_.goog-te-combo]:py-1.5 [&_.goog-te-combo]:text-xs [&_.goog-te-combo]:text-white [&_.goog-te-combo]:outline-none [&_.goog-te-combo]:focus:ring-1 [&_.goog-te-combo]:focus:ring-orange-500/50"
          />
        </div>
      )}
    </div>
  );
}
