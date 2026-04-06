"use client";

/**
 * SetupWizard — First-run setup modal for new authenticated users.
 *
 * 3 steps:
 *   1. Platform (Lichess / Chess.com) + username
 *   2. Self-reported rating range
 *   3. Primary focus (maps to scanMode)
 *
 * On complete, writes to the same "firechess-user-prefs" key that the
 * homepage analyzer form already reads — so the form is pre-filled.
 *
 * localStorage keys:
 *   "fc-setup-done" — "1" after wizard is completed or skipped
 */

import { useState, useEffect } from "react";

const KEY_DONE = "fc-setup-done";
const PREFS_KEY = "firechess-user-prefs";

function isDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY_DONE) === "1";
}
function markDone(): void {
  if (typeof window !== "undefined") localStorage.setItem(KEY_DONE, "1");
}

// ─── Types ───────────────────────────────────────────────────────────
type Platform = "lichess" | "chesscom";
type RatingRange =
  | "u800"
  | "800-1200"
  | "1200-1500"
  | "1500-1800"
  | "1800+"
  | "unsure";
type FocusArea =
  | "both"
  | "tactics"
  | "openings"
  | "endgames"
  | "time-management";

const RATING_OPTIONS: { id: RatingRange; label: string; sub: string }[] = [
  { id: "u800", label: "Under 800", sub: "Just starting out" },
  { id: "800-1200", label: "800 – 1200", sub: "Learning the basics" },
  { id: "1200-1500", label: "1200 – 1500", sub: "Intermediate club player" },
  { id: "1500-1800", label: "1500 – 1800", sub: "Competitive club player" },
  { id: "1800+", label: "1800+", sub: "Advanced / tournament" },
  { id: "unsure", label: "Not sure", sub: "Haven't checked recently" },
];

const FOCUS_OPTIONS: {
  id: FocusArea;
  emoji: string;
  label: string;
  sub: string;
}[] = [
  {
    id: "both",
    emoji: "🔍",
    label: "Everything",
    sub: "Full analysis across all areas",
  },
  {
    id: "tactics",
    emoji: "⚔️",
    label: "Tactics & Blunders",
    sub: "Spot what's costing you material",
  },
  {
    id: "openings",
    emoji: "📖",
    label: "Opening Knowledge",
    sub: "Fix your first 10–15 moves",
  },
  {
    id: "endgames",
    emoji: "♟",
    label: "Endgame Technique",
    sub: "Convert wins and hold draws",
  },
  {
    id: "time-management",
    emoji: "⏱",
    label: "Time Management",
    sub: "Stop losing on the clock",
  },
];

// ─── Component ───────────────────────────────────────────────────────
export function SetupWizard({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [rating, setRating] = useState<RatingRange | null>(null);
  const [focus, setFocus] = useState<FocusArea>("both");

  useEffect(() => {
    if (show && !isDone()) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [show]);

  // Admin debug: listen for force-reopen event
  useEffect(() => {
    function onReopen() {
      setStep(1);
      setPlatform(null);
      setUsername("");
      setUsernameError("");
      setRating(null);
      setFocus("both");
      setVisible(true);
    }
    window.addEventListener("fc:debug:reopen-wizard", onReopen);
    return () => window.removeEventListener("fc:debug:reopen-wizard", onReopen);
  }, []);

  function handleSkip() {
    markDone();
    setVisible(false);
  }

  function handleStep1Continue() {
    if (!platform) return;
    if (!username.trim()) {
      setUsernameError("Please enter your username");
      return;
    }
    setUsernameError("");
    setStep(2);
  }

  function handleStep2Continue() {
    if (!rating) return;
    setStep(3);
  }

  function handleComplete() {
    // Merge into existing prefs or create fresh
    let existing: Record<string, unknown> = {};
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) existing = JSON.parse(raw);
    } catch {}

    const updated = {
      ...existing,
      username: username.trim(),
      source: platform,
      scanMode: focus,
    };

    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    markDone();
    setVisible(false);

    // Small delay then scroll to analyzer form
    setTimeout(() => {
      const el = document.getElementById("analyzer");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Card */}
      <div className="relative w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e0a07] shadow-2xl shadow-black/60">
          {/* Top gradient strip */}
          <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-red-500" />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-7 flex items-start justify-between">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
                    Quick Setup
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white sm:text-2xl">
                  {step === 1 && "Connect your chess account"}
                  {step === 2 && "What's your current rating?"}
                  {step === 3 && "What do you want to improve?"}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {step === 1 &&
                    "FireChess fetches and analyzes your real games."}
                  {step === 2 &&
                    "We'll surface the most relevant guides and tips."}
                  {step === 3 &&
                    "This sets the default scan focus — you can change it anytime."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="flex-shrink-0 rounded-lg p-1.5 text-stone-600 transition-colors hover:bg-white/[0.05] hover:text-stone-400"
                aria-label="Skip setup"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Platform picker */}
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Your platform
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          id: "lichess" as Platform,
                          label: "Lichess",
                          icon: (
                            <svg
                              className="h-6 w-6"
                              viewBox="0 0 50 50"
                              fill="currentColor"
                            >
                              <path d="M38.956.5c-3.53.418-6.452 2.525-8.662 4.96C28.352 3.69 26.252 2.6 24 2.6c-2 0-3.85.94-5.29 2.85C13.194 2.942 9.16.886 4.917.5 2.098.226.15 2.248.15 5.07c0 4.014 2.727 7.47 6.453 9.098L4.7 33.989c-.022 5.96 2.557 10.205 7.17 12.487C14.753 48.042 19.276 49.5 24 49.5c4.724 0 9.247-1.458 12.13-3.024 4.613-2.282 7.192-6.527 7.17-12.487l-1.903-19.82C45.123 12.54 47.85 9.084 47.85 5.07c0-2.822-1.948-4.844-4.767-4.57h-4.127z" />
                            </svg>
                          ),
                        },
                        {
                          id: "chesscom" as Platform,
                          label: "Chess.com",
                          icon: (
                            <svg
                              className="h-6 w-6"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M9 20c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-1H9v1zm3-18C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" />
                            </svg>
                          ),
                        },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-semibold transition-all ${
                          platform === p.id
                            ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                            : "border-white/[0.07] bg-white/[0.03] text-stone-300 hover:border-white/[0.12] hover:bg-white/[0.06]"
                        }`}
                      >
                        <span
                          className={
                            platform === p.id
                              ? "text-orange-400"
                              : "text-stone-500"
                          }
                        >
                          {p.icon}
                        </span>
                        {p.label}
                        {platform === p.id && (
                          <span className="ml-auto text-orange-500">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Username on{" "}
                    {platform === "chesscom"
                      ? "Chess.com"
                      : platform === "lichess"
                        ? "Lichess"
                        : "your platform"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      platform === "chesscom"
                        ? "YourChessComName"
                        : "your_lichess_name"
                    }
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (usernameError) setUsernameError("");
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleStep1Continue()
                    }
                    className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition-colors focus:bg-white/[0.05] ${
                      usernameError
                        ? "border-red-500/40 focus:border-red-500/60"
                        : "border-white/[0.08] focus:border-orange-500/40"
                    }`}
                  />
                  {usernameError && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {usernameError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-xs text-stone-600 transition-colors hover:text-stone-400"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={handleStep1Continue}
                    disabled={!platform}
                    className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {RATING_OPTIONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRating(r.id)}
                      className={`flex flex-col rounded-xl border px-3.5 py-3 text-left transition-all ${
                        rating === r.id
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06]"
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${rating === r.id ? "text-emerald-300" : "text-stone-200"}`}
                      >
                        {r.label}
                      </span>
                      <span className="mt-0.5 text-[11px] text-stone-600">
                        {r.sub}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-stone-600 transition-colors hover:text-stone-400"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleStep2Continue}
                    disabled={!rating}
                    className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex flex-col gap-2.5">
                  {FOCUS_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFocus(f.id)}
                      className={`flex items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-all ${
                        focus === f.id
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className="text-xl">{f.emoji}</span>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-semibold ${focus === f.id ? "text-emerald-300" : "text-stone-200"}`}
                        >
                          {f.label}
                        </p>
                        <p className="text-xs text-stone-600">{f.sub}</p>
                      </div>
                      {focus === f.id && (
                        <span className="text-emerald-500">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-stone-600 transition-colors hover:text-stone-400"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                  >
                    Start Analyzing →
                  </button>
                </div>
              </div>
            )}

            {/* Step indicator */}
            <div className="mt-6 flex justify-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all ${
                    s === step
                      ? "w-6 bg-orange-500"
                      : s < step
                        ? "w-3 bg-orange-500/40"
                        : "w-3 bg-white/[0.08]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
