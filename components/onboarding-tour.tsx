"use client";

/**
 * OnboardingTour — Step-by-step spotlight walkthrough for new users.
 *
 * Shows a tooltip pointing at each dashboard section, explaining what
 * it does. Auto-triggers once after first sign-up. Deferred if the
 * user came from the pricing page (they probably want to subscribe first).
 *
 * localStorage keys:
 *   "fc-onboarding-done"     — "1" when tour completed / skipped
 *   "fc-onboarding-deferred" — "1" when user signed up from pricing;
 *                               cleared after they leave pricing and
 *                               visit dashboard next time
 */

import { useState, useEffect, useCallback, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Tour steps                                                          */
/* ------------------------------------------------------------------ */

export type TourStep = {
  /** CSS selector for the element to spotlight */
  target: string;
  /** Tooltip title */
  title: string;
  /** Tooltip body */
  body: string;
  /** Which side to place the tooltip */
  placement?: "top" | "bottom" | "left" | "right";
};

const STEPS: TourStep[] = [
  {
    target: "[data-tour='stats']",
    title: "Your Stats at a Glance",
    body: "Track how many reports you've run, total games scanned, leaks found, and tactics missed — all in one place.",
    placement: "bottom",
  },
  {
    target: "[data-tour='study-plan']",
    title: "Personalized Study Plan",
    body: "Every scan creates a custom study plan based on your weaknesses. Check off tasks to earn coins and build a streak.",
    placement: "bottom",
  },
  {
    target: "[data-tour='daily-login']",
    title: "Daily Login Rewards",
    body: "Come back each day to claim escalating coin rewards. Complete a full 7-day streak for a big bonus!",
    placement: "bottom",
  },
  {
    target: "[data-tour='daily-challenge']",
    title: "Daily Challenge",
    body: "A missed tactic from your own games — try to find the best move each day. Correct answers earn 10 coins.",
    placement: "bottom",
  },
  {
    target: "[data-tour='goals']",
    title: "Goals & Achievements",
    body: "Set accuracy or rating targets and unlock achievements as you improve. Each achievement earns 20 coins.",
    placement: "bottom",
  },
  {
    target: "[data-tour='radar']",
    title: "Strengths Radar",
    body: "A 6-dimension chart showing your accuracy, openings, tactics, composure, time management, and resilience at a glance.",
    placement: "top",
  },
  {
    target: "[data-tour='progress']",
    title: "Progress Over Time",
    body: "After 2+ scans you'll see accuracy and CP loss charts — the best way to track improvement.",
    placement: "top",
  },
  {
    target: "[data-tour='coin-shop']",
    title: "Coin Shop",
    body: "Spend your earned coins on board themes, eval bar skins, and profile titles. Buy once, swap freely.",
    placement: "top",
  },
  {
    target: "[data-tour='reports']",
    title: "Report History",
    body: "Every saved scan appears here. Expand any report to review your full analysis, radar, and individual cards.",
    placement: "top",
  },
];

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                     */
/* ------------------------------------------------------------------ */

const KEY_DONE = "fc-onboarding-done";
const KEY_DEFERRED = "fc-onboarding-deferred";

function isDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY_DONE) === "1";
}

function markDone(): void {
  if (typeof window !== "undefined") localStorage.setItem(KEY_DONE, "1");
}

export function isOnboardingDeferred(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_DEFERRED) === "1";
}

export function deferOnboarding(): void {
  if (typeof window !== "undefined") localStorage.setItem(KEY_DEFERRED, "1");
}

export function clearDeferral(): void {
  if (typeof window !== "undefined") localStorage.removeItem(KEY_DEFERRED);
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  /* ── Check if we should show the tour ── */
  useEffect(() => {
    if (isDone()) return;

    // If deferred (signed up from pricing), clear the deferral flag but don't
    // show the tour yet — they'll see it on their NEXT dashboard visit.
    if (isOnboardingDeferred()) {
      clearDeferral();
      return;
    }

    // Slight delay so the dashboard has rendered and elements exist
    const t = setTimeout(() => setActive(true), 1200);
    return () => clearTimeout(t);
  }, []);

  /* ── Position the spotlight on the current step's target ── */
  const updateRect = useCallback(() => {
    if (!active) return;
    const el = document.querySelector(STEPS[step].target);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect(r);
      // Scroll into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      // Element doesn't exist — skip this step
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        finish();
      }
    }
  }, [active, step]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [updateRect]);

  /* ── Actions ── */
  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const finish = () => {
    markDone();
    setActive(false);
  };

  if (!active || !rect) return null;

  const current = STEPS[step];
  const pad = 8; // padding around the spotlight

  /* ── Tooltip position ── */
  const tooltipW = Math.min(320, window.innerWidth - 32);
  const tooltipEstH = 170; // conservative estimate of tooltip height
  const gap = 12;
  const margin = 16; // min distance from screen edge

  const centerX = rect.left + rect.width / 2;
  const clampedLeft = Math.max(margin, Math.min(centerX - tooltipW / 2, window.innerWidth - tooltipW - margin));

  // Decide placement: prefer the step's declared side, but flip if it would go off-screen
  let placement = current.placement ?? "bottom";
  const spaceBelow = window.innerHeight - (rect.bottom + pad + gap);
  const spaceAbove = rect.top - pad - gap;

  if (placement === "bottom" && spaceBelow < tooltipEstH && spaceAbove > spaceBelow) {
    placement = "top";
  } else if (placement === "top" && spaceAbove < tooltipEstH && spaceBelow > spaceAbove) {
    placement = "bottom";
  }

  let tooltipStyle: React.CSSProperties = { width: tooltipW };

  if (placement === "bottom") {
    const top = rect.bottom + pad + gap;
    // Clamp so it doesn't go below viewport
    tooltipStyle.top = Math.min(top, window.innerHeight - tooltipEstH - margin);
    tooltipStyle.left = clampedLeft;
  } else if (placement === "top") {
    const bottom = window.innerHeight - rect.top + pad + gap;
    // Clamp so it doesn't go above viewport
    tooltipStyle.bottom = Math.min(bottom, window.innerHeight - tooltipEstH - margin);
    tooltipStyle.left = clampedLeft;
  }

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: "auto" }}>
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - pad}
              y={rect.top - pad}
              width={rect.width + pad * 2}
              height={rect.height + pad * 2}
              rx={16}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.70)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight ring */}
      <div
        className="pointer-events-none absolute rounded-2xl ring-2 ring-violet-500/60 transition-all duration-500"
        style={{
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        }}
      />

      {/* Click-through spotlight area */}
      <div
        className="absolute"
        style={{
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          pointerEvents: "none",
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute animate-fade-in-up rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-sm"
        style={{ ...tooltipStyle, pointerEvents: "auto" }}
      >
        {/* Step indicator */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-5 bg-violet-500"
                    : i < step
                    ? "w-1.5 bg-violet-500/40"
                    : "w-1.5 bg-white/10"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] tabular-nums text-slate-500">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        <h3 className="text-sm font-bold text-white">{current.title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{current.body}</p>

        {/* Nav buttons */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={prev}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500"
            >
              {step < STEPS.length - 1 ? "Next" : "Finish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
