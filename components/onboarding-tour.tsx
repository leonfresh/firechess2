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
  const [showPrompt, setShowPrompt] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  /* ── Check if we should show the tour prompt ── */
  useEffect(() => {
    if (isDone()) return;

    // If deferred (signed up from pricing), clear the deferral flag but don't
    // show the tour yet — they'll see it on their NEXT dashboard visit.
    if (isOnboardingDeferred()) {
      clearDeferral();
      return;
    }

    // Show the optional tour prompt after a slight delay
    const t = setTimeout(() => setShowPrompt(true), 900);
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
  const startTour = () => {
    setShowPrompt(false);
    setActive(true);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const finish = () => {
    markDone();
    setShowPrompt(false);
    setActive(false);
  };

  /* ── Prompt modal ── */
  if (showPrompt && !active) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={finish}
        />
        {/* Card */}
        <div className="relative animate-fade-in-up rounded-2xl border border-white/10 bg-slate-900/98 p-7 shadow-2xl"
          style={{ width: Math.min(380, (typeof window !== "undefined" ? window.innerWidth : 400) - 32) }}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 text-2xl">
            👋
          </div>
          <h2 className="text-lg font-bold text-white">Welcome to FireChess!</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Take a quick <span className="font-medium text-slate-200">2-minute tour</span> to learn what every section of your dashboard does — or dive straight in.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={startTour}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 active:scale-95"
            >
              Start Tour
            </button>
            <button
              type="button"
              onClick={finish}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
            >
              Skip for now
            </button>
          </div>
          <p className="mt-3 text-center text-[10px] text-slate-600">You can always find help in the support page.</p>
        </div>
      </div>
    );
  }

  if (!active || !rect) return null;

  const current = STEPS[step];
  const pad = 8; // padding around the spotlight

  // Arrow direction: does the spotlight sit above or below the bottom toolbar?
  const spotlightCenterY = rect.top + rect.height / 2;
  const viewportCenter = window.innerHeight / 2;
  const isAboveCenter = spotlightCenterY < viewportCenter;

  const tooltipWidth = Math.min(400, window.innerWidth - 32);

  return (
    <>
      {/* Dark overlay with cutout — pointer-events disabled so clicks pass through */}
      <svg
        className="pointer-events-none fixed inset-0 z-[9998] h-full w-full"
        style={{ top: 0, left: 0 }}
      >
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
          fill="rgba(0,0,0,0.72)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight ring */}
      <div
        className="pointer-events-none fixed z-[9999] rounded-2xl ring-2 ring-violet-500/70 transition-all duration-500"
        style={{
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        }}
      />

      {/* Tooltip — permanently fixed at bottom-center; never moves between steps */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] rounded-2xl border border-white/10 bg-slate-900/97 p-5 shadow-2xl backdrop-blur-md"
        style={{
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          width: tooltipWidth,
        }}
      >
        {/* Direction hint arrow */}
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-sm text-violet-400">
            {isAboveCenter ? "↑" : "↓"}
          </span>
          <p className="text-[11px] text-slate-500">
            {isAboveCenter ? "Highlighted above" : "Highlighted below"} · step {step + 1} of {STEPS.length}
          </p>
          {/* Progress dots */}
          <div className="ml-auto flex items-center gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-5 bg-violet-500"
                    : i < step
                    ? "w-1.5 bg-violet-500/40"
                    : "w-1.5 bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        <h3 className="text-sm font-bold text-white">{current.title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{current.body}</p>

        {/* Nav — always the same layout so buttons never jump */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="shrink-0 text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            End tour
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.06] disabled:opacity-30"
            >
              Back
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 active:scale-95"
            >
              {step < STEPS.length - 1 ? "Next →" : "Finish ✓"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
