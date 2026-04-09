"use client";

/**
 * ProWelcomeModal — one-time modal shown to Pro and Lifetime members.
 *
 * Triggers two ways:
 *   1. URL param: `?upgraded=pro` or `?upgraded=lifetime` after Stripe checkout
 *   2. Existing Pro/Lifetime user who has never seen it (plan detected via session)
 *
 * localStorage key: "fc-pro-welcomed" — "1" after dismissed; never shows again.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/session-provider";

const LS_KEY = "fc-pro-welcomed";

const FEATURES = [
  {
    icon: "🔍",
    title: "Scan up to 5,000 games",
    body: "Go deep into your history — not just recent games, but months or years of patterns.",
  },
  {
    icon: "⚡",
    title: "Higher engine depth (13–24)",
    body: "Stockfish 18 at full power finds the mistakes a shallower scan would miss.",
  },
  {
    icon: "♟️",
    title: "Unlimited tactics & endgames",
    body: "Every missed tactic and every botched endgame — no cap, no hiding the embarrassing ones.",
  },
  {
    icon: "🧠",
    title: "Full mental game breakdown",
    body: "Your archetype, tilt patterns, momentum swings, color stats, and win/loss streaks.",
  },
  {
    icon: "📖",
    title: "Motif pattern analysis",
    body: "Spot recurring positional weaknesses — the mistakes you keep making without knowing it.",
  },
  {
    icon: "🃏",
    title: "Chaos Chess — fully unlocked",
    body: "All 22 Tarot anomalies and every Opening Anomaly available to pick.",
  },
];

export function ProWelcomeModal() {
  const { plan, loading } = useSession();
  const [open, setOpen] = useState(false);
  const [planType, setPlanType] = useState<"pro" | "lifetime">("pro");

  // Trigger 1: Stripe checkout redirect (?upgraded=pro or ?upgraded=lifetime)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(LS_KEY) === "1") return;
    const upgraded = new URLSearchParams(window.location.search).get(
      "upgraded",
    );
    if (upgraded !== "pro" && upgraded !== "lifetime") return;

    setPlanType(upgraded);
    setOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("upgraded");
    window.history.replaceState({}, "", url.toString());
  }, []);

  // Trigger 2: Existing Pro/Lifetime user who hasn't seen the modal yet
  useEffect(() => {
    if (loading) return;
    if (plan !== "pro" && plan !== "lifetime") return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(LS_KEY) === "1") return;
    // Don't double-fire if trigger 1 already opened it
    const upgraded = new URLSearchParams(window.location.search).get(
      "upgraded",
    );
    if (upgraded === "pro" || upgraded === "lifetime") return;

    setPlanType(plan);
    const t = setTimeout(() => setOpen(true), 1000);
    return () => clearTimeout(t);
  }, [loading, plan]);

  const dismiss = () => {
    localStorage.setItem(LS_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  const isLifetime = planType === "lifetime";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg animate-fade-in-up rounded-2xl bg-slate-900/98 shadow-2xl ring-1 ring-white/10 overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-80 rounded-full blur-[80px] ${
              isLifetime ? "bg-amber-500/[0.12]" : "bg-emerald-500/[0.12]"
            }`}
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          aria-label="Dismiss"
        >
          ✕
        </button>

        <div className="relative px-6 pb-6 pt-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div
              className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-4xl ring-1 ${
                isLifetime
                  ? "bg-amber-500/15 ring-amber-500/25"
                  : "bg-emerald-500/15 ring-emerald-500/25"
              }`}
            >
              {isLifetime ? "♾️" : "🚀"}
            </div>
            <h2 className="text-2xl font-black text-white">
              {isLifetime ? "You're in — forever." : "Welcome to Pro."}
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              {isLifetime ? (
                <>
                  Welcome to{" "}
                  <span className="font-semibold text-amber-300">
                    FireChess Lifetime Pro
                  </span>
                  . Here&apos;s everything you&apos;ve unlocked.
                </>
              ) : (
                <>
                  You now have full access to{" "}
                  <span className="font-semibold text-emerald-300">
                    FireChess Pro
                  </span>
                  . Here&apos;s what&apos;s waiting for you.
                </>
              )}
            </p>
          </div>

          {/* Feature grid */}
          <div className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
              >
                <span className="mt-0.5 text-xl leading-none">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{f.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="mb-5 text-center text-xs text-slate-500">
            {isLifetime
              ? "No recurring fees. No feature downgrades. You're locked in as a founding member."
              : "Your Pro features are active right now — start a scan to see the difference."}
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/"
              onClick={dismiss}
              className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-bold text-black shadow-lg transition-opacity hover:opacity-90 bg-gradient-to-r ${
                isLifetime
                  ? "from-amber-500 to-orange-500"
                  : "from-emerald-500 to-cyan-500"
              }`}
            >
              Start Your First Pro Scan
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              Explore Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
