"use client";

import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { useState } from "react";
import { deferOnboarding } from "@/components/onboarding-tour";
import { CHANGELOG } from "@/lib/changelog";
import { Check } from "lucide-react";

const plans = [
  {
    id: "free" as const,
    name: "Free",
    originalPrice: null as string | null,
    price: "$0",
    period: "forever",
    subtitle: "Everything you need to find your leaks.",
    badge: null as string | null,
    features: [
      "Up to 300 recent games per scan",
      "Engine depth up to 12",
      "Full opening leak detection + drill mode",
      "Up to 10 missed tactics per scan",
      "Up to 10 endgame mistakes per scan",
      "All scan modes (Openings / Tactics / Endgames / Time)",
      "Strengths & Weaknesses radar + insight scores",
      "Basic mental game stats (stability, tilt, post-loss)",
      "Opening Explorer on every card",
      "Move explanations (Best / Played / DB move)",
      "Save reports to dashboard & track progress",
      "Lichess + Chess.com support",
    ],
    cta: "Start scanning — free",
    highlight: false,
  },
  {
    id: "pro" as const,
    name: "Pro",
    originalPrice: "$8",
    price: "$5",
    period: "/mo",
    subtitle: "For players serious about climbing.",
    badge: "Launch pricing — 37% off",
    features: [
      "Everything in Free, plus —",
      "Unlimited games per scan",
      "Higher engine depth (13–24)",
      "Unlimited missed tactics scanner",
      "Unlimited endgame mistake scanner",
      "Motif pattern analysis — find recurring weaknesses",
      "Time pressure detection on missed tactics",
      "Dedicated tactics & endgame drill modes",
      "Full Mental Game breakdown — archetype, color stats, momentum, streaks",
      "Deep Analysis — full study plans & coaching tips per dimension",
      "Brilliant Move Detection — real sacrifice moments from your games",
      "Chaos Chess: 4 Opening Anomaly choices + all 22 Tarot anomalies",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    id: "lifetime" as const,
    name: "Lifetime",
    originalPrice: "$99",
    price: "$59",
    period: "one-time",
    subtitle: "Pay once, keep Pro forever.",
    badge: "Founding member pricing",
    features: [
      "Everything in Pro — forever",
      "One-time payment, no recurring fees",
      "Lock in before price increases",
      "Support an indie dev building for chess players",
    ],
    cta: "Get Lifetime access",
    highlight: false,
  },
];

export default function PricingPage() {
  const { authenticated, plan } = useSession();
  const [checkoutLoading, setCheckoutLoading] = useState<
    "pro" | "lifetime" | null
  >(null);

  const handleUpgrade = async (checkoutPlan: "pro" | "lifetime" = "pro") => {
    if (!authenticated) {
      deferOnboarding();
      window.location.href = "/auth/signin";
      return;
    }
    setCheckoutLoading(checkoutPlan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          checkoutPlan === "lifetime" ? { plan: "lifetime" } : {},
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const isPro = plan === "pro" || plan === "lifetime";

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#070608]">
      {/* Dot grid + vignette background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1.4px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(ellipse 90% 55% at 50% 0%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 55% at 50% 0%, black, transparent)",
          }}
        />
        <div
          className="absolute left-1/2 top-[-200px] h-[500px] w-[900px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255,90,31,0.08), transparent 65%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a1f]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ff8c42]">
              Pricing
            </span>
          </div>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl">
            Free is a full product.
            <br />
            Pro is a{" "}
            <span
              className="italic text-[#ff5a1f]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              faster fix.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#8d8696] sm:text-lg">
            Scanning your games is free, no card required. Upgrade only when
            you want bigger limits and deeper analysis.
          </p>

          {/* Launch pricing banner */}
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.04] p-5 text-left">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] text-xl">
                🔥
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-white">
                  Launch pricing — 37% off
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[#8d8696]">
                  Subscribe now at{" "}
                  <span className="font-semibold text-[#ff8c42]">
                    $5/mo instead of $8/mo
                  </span>{" "}
                  and keep that rate forever. Or grab{" "}
                  <span className="font-semibold text-[#ff8c42]">
                    Lifetime access for a one-time $59
                  </span>
                  .
                </p>
                <p className="mt-2 text-xs font-medium text-[#565061]">
                  Early adopters keep this rate forever — lock it in while you
                  can.
                </p>
              </div>
            </div>
          </div>

          {/* Quick feature pills */}
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              "Opening leak detection",
              "Missed tactics scanner",
              "Endgame mistake finder",
              "Mental game analysis",
            ].map((text) => (
              <div
                key={text}
                className="flex items-center justify-center rounded-xl border border-[#1e1a24] bg-[#121015] px-3 py-2.5 text-xs text-[#8d8696]"
              >
                {text}
              </div>
            ))}
          </div>
        </header>

        {/* Plan Cards */}
        <div className="mt-16 grid items-start gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <article
              key={p.name}
              className={`relative flex h-full flex-col rounded-2xl border p-7 transition-colors duration-300 ${
                p.highlight
                  ? "border-[#ff5a1f]/35 bg-[#121015]"
                  : "border-[#1e1a24] bg-[#121015] hover:border-[#2a2433]"
              }`}
            >
              {p.highlight && (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,90,31,0.06), transparent 45%)",
                    }}
                  />
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#ff5a1f] px-3.5 py-1 text-[11px] font-bold text-white shadow-[0_0_20px_rgba(255,90,31,0.35)]">
                    Most popular
                  </span>
                </>
              )}
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">{p.name}</h2>
                  {p.badge && !p.highlight && (
                    <span className="rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#ff8c42]">
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#565061]">{p.subtitle}</p>

                <div className="mt-5 flex items-baseline gap-2.5">
                  <span className="text-[42px] font-extrabold leading-none tracking-[-0.03em] text-white">
                    {p.price}
                  </span>
                  <span className="text-sm text-[#565061]">{p.period}</span>
                  {p.originalPrice && (
                    <span className="text-sm text-[#565061] line-through">
                      {p.originalPrice}
                    </span>
                  )}
                </div>
                {p.id === "pro" && (
                  <p className="mt-2 text-xs font-medium text-[#ff8c42]/80">
                    Early adopters keep this rate forever
                  </p>
                )}

                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-[13.5px] leading-snug text-[#c9c3d1]"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff5a1f]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={!!checkoutLoading}
                  onClick={
                    p.id === "pro"
                      ? () => handleUpgrade("pro")
                      : p.id === "lifetime"
                        ? () => handleUpgrade("lifetime")
                        : undefined
                  }
                  className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
                    p.highlight
                      ? "btn-cta-fire text-white"
                      : p.id === "lifetime"
                        ? "border border-[#ff5a1f]/30 bg-[#ff5a1f]/[0.08] text-[#ff8c42] hover:bg-[#ff5a1f]/[0.14]"
                        : "border border-[#1e1a24] bg-[#181520] text-[#f0edf2] hover:border-[#2a2433] hover:bg-[#1c1826]"
                  }`}
                >
                  {(p.id === "pro" || p.id === "lifetime") && isPro ? (
                    plan === "lifetime" ? (
                      "Lifetime member"
                    ) : p.id === "lifetime" ? (
                      "Switch to Lifetime"
                    ) : (
                      "Current plan"
                    )
                  ) : checkoutLoading === p.id ? (
                    <span className="inline-flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Redirecting to Stripe…
                    </span>
                  ) : (
                    p.cta
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Trust row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-[#565061]">
          <span className="inline-flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-[#ff5a1f]" /> Free forever tier
          </span>
          <span className="inline-flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-[#ff5a1f]" /> No credit card to
            start
          </span>
          <span className="inline-flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-[#ff5a1f]" /> Cancel anytime
          </span>
          <span className="inline-flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-[#ff5a1f]" /> Secure checkout via
            Stripe
          </span>
        </div>

        {/* Brilliant Move Detection spotlight */}
        <div className="relative mt-20 overflow-hidden rounded-2xl border border-[#1e1a24] bg-[#121015] p-7 md:p-9">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,90,31,0.1), transparent 65%)",
            }}
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] text-3xl">
              💎
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold tracking-[-0.01em] text-white">
                  Brilliant Move Detection
                </h3>
                <span className="rounded-full border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#ff8c42]">
                  Pro exclusive
                </span>
                <span className="rounded-full border border-[#1e1a24] bg-[#181520] px-2.5 py-0.5 text-[11px] font-medium text-[#8d8696]">
                  Not on AimChess
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#8d8696]">
                FireChess scans your real games for genuine piece sacrifices —
                moves where you actually gave up material for a positional or
                tactical edge, and the engine confirms it was objectively
                correct. Unlike Chess.com&apos;s move badges, this cross-game
                scanner surfaces your <em className="text-[#f0edf2]">best</em>{" "}
                moments across hundreds of games in one place.
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs text-[#565061]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#ff5a1f]" />
                  Real material sacrifices only — no false positives
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#ff5a1f]" />
                  Verified by Stockfish at higher depths
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#ff5a1f]" />
                  Replay the exact position with the PV line
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mt-20">
          <div className="mb-10 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-3.5 py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ff8c42]">
                Compare
              </span>
            </div>
            <h2 className="text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl">
              Full plan comparison.
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#1e1a24] bg-[#121015]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1e1a24] bg-[#0d0b0e]">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#565061]">
                      Feature
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#8d8696]">
                      Free
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#ff8c42]">
                      Pro
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#8d8696]">
                      Lifetime
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[#c9c3d1]">
                  {[
                    ["Recent games per scan", "Up to 300", "Unlimited", "Unlimited"],
                    ["Engine depth", "Up to 12", "Up to 24", "Up to 24"],
                    ["Opening leak detection", "✓", "✓", "✓"],
                    ["Opening drill mode", "✓", "✓", "✓"],
                    ["Scan mode selector", "All modes", "All modes", "All modes"],
                    ["Strengths & Weaknesses radar", "✓", "✓", "✓"],
                    [
                      "Deep Analysis insight scores",
                      "Scores only",
                      "+ study plans & coaching",
                      "+ study plans & coaching",
                    ],
                    ["Opening Explorer (Lichess DB)", "✓", "✓", "✓"],
                    ["Move explanations", "✓", "✓", "✓"],
                    ["Missed tactics", "Up to 10 per scan", "Unlimited", "Unlimited"],
                    ["Endgame mistakes", "Up to 10 per scan", "Unlimited", "Unlimited"],
                    ["Motif pattern analysis", "—", "✓", "✓"],
                    ["Time pressure detection", "—", "✓", "✓"],
                    ["Brilliant Move Detection", "—", "✓", "✓"],
                    ["Tactics drill mode", "—", "✓", "✓"],
                    ["Endgame drill mode", "—", "✓", "✓"],
                    ["Mental game: basic stats", "✓", "✓", "✓"],
                    [
                      "Mental game: full breakdown",
                      "—",
                      "Archetype, color, streaks, form",
                      "✓",
                    ],
                    ["Save reports to dashboard", "✓", "✓", "✓"],
                    ["Chaos Chess anomaly choices", "2 choices", "4 choices", "4 choices"],
                    ["Chaos Chess anomaly pool", "2 of 22", "All 22", "All 22"],
                    ["Recurring cost", "—", "$5/month", "$59 one-time"],
                  ].map(([feature, free, pro, lifetime]) => (
                    <tr
                      key={feature}
                      className="border-t border-[#1e1a24] transition-colors hover:bg-[#181520]/50"
                    >
                      <td className="px-5 py-3.5 text-[#8d8696]">{feature}</td>
                      <td className="px-5 py-3.5">{free}</td>
                      <td className="px-5 py-3.5 font-medium text-[#ff8c42]">
                        {pro}
                      </td>
                      <td className="px-5 py-3.5">{lifetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* vs Aimchess */}
        <div className="mt-20">
          <div className="mb-10 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1e1a24] bg-[#121015] px-4 py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8d8696]">
                vs. Aimchess
              </span>
            </div>
            <h2 className="text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl">
              Why not just use Aimchess?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#8d8696]">
              Aimchess is one of the most well-known chess analysis tools. But
              take a close look at what their free tier actually gives you —
              and what&apos;s locked behind their paywall.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Aimchess card */}
            <div className="overflow-hidden rounded-2xl border border-[#1e1a24] bg-[#121015]">
              <div className="flex items-center justify-between border-b border-[#1e1a24] bg-[#0d0b0e] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#181520] text-sm font-bold text-[#8d8696]">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f0edf2]">
                      Aimchess Free
                    </p>
                    <p className="text-[11px] text-[#565061]">aimchess.com</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#181520] px-2.5 py-1 text-[11px] font-semibold text-[#8d8696]">
                  40 games only
                </span>
              </div>
              <div className="space-y-2.5 px-5 py-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#565061]">
                  Performance rating by category
                </p>
                {[
                  { label: "Opening", pct: 59 },
                  { label: "Advantage Capitalization", pct: 69 },
                ].map((cat) => (
                  <div key={cat.label} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-xs text-[#8d8696]">
                      {cat.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1e1a24]">
                      <div
                        className="h-full rounded-full bg-[#3a3444]"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs tabular-nums text-[#565061]">
                      {cat.pct}%
                    </span>
                  </div>
                ))}
                {["Tactics", "Resourcefulness", "Time Management", "Endgame"].map(
                  (cat) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-xs text-[#565061]">
                        {cat}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1e1a24]">
                        <div className="h-full w-full rounded-full bg-[#1e1a24]" />
                      </div>
                      <span className="text-[#565061]">🔒</span>
                    </div>
                  ),
                )}
                <div className="mt-4 rounded-xl border border-[#1e1a24] bg-[#0d0b0e] px-4 py-3 text-center">
                  <p className="text-xs font-medium text-[#8d8696]">
                    Register to get extended report for free
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#565061]">
                    Still missing most features after signup
                  </p>
                </div>
              </div>
            </div>

            {/* FireChess card */}
            <div className="overflow-hidden rounded-2xl border border-[#ff5a1f]/25 bg-[#121015]">
              <div className="flex items-center justify-between border-b border-[#ff5a1f]/15 bg-[#ff5a1f]/[0.05] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff5a1f]/[0.12] text-base">
                    🔥
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f0edf2]">
                      FireChess Free
                    </p>
                    <p className="text-[11px] text-[#565061]">firechess.com</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#ff5a1f]/[0.12] px-2.5 py-1 text-[11px] font-semibold text-[#ff8c42]">
                  Up to 300 games
                </span>
              </div>
              <div className="space-y-2.5 px-5 py-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#565061]">
                  All analysis categories — fully unlocked
                </p>
                {[
                  "Opening Leaks",
                  "Tactics Missed",
                  "Endgame Mistakes",
                  "Time Management",
                  "Mental Game",
                  "Strengths Radar",
                ].map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-xs text-[#c9c3d1]">
                      {label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1e1a24]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ff5a1f] to-[#ff8c42]"
                        style={{ width: `${55 + i * 7}%` }}
                      />
                    </div>
                    <span className="text-sm text-[#ff5a1f]">✓</span>
                  </div>
                ))}
                <div className="mt-4 rounded-xl border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.05] px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-[#ff8c42]">
                    No account needed to start
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#565061]">
                    Everything above is free immediately
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stat callouts */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Games scanned", aimchess: "40", firechess: "300" },
              { label: "Tactics section", aimchess: "🔒 Locked", firechess: "✓ Free" },
              { label: "Endgame section", aimchess: "🔒 Locked", firechess: "✓ Free" },
              { label: "Time Management", aimchess: "🔒 Locked", firechess: "✓ Free" },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-[#1e1a24] bg-[#121015] p-3 text-center"
              >
                <p className="mb-2 text-[11px] text-[#565061]">{row.label}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-[#0d0b0e] px-2 py-1">
                    <span className="text-[10px] text-[#565061]">Aimchess</span>
                    <span className="text-xs font-medium text-[#8d8696]">
                      {row.aimchess}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-[#ff5a1f]/[0.06] px-2 py-1">
                    <span className="text-[10px] text-[#8d8696]">FireChess</span>
                    <span className="text-xs font-bold text-[#ff8c42]">
                      {row.firechess}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-1.5">
            <Link
              href="/blog/firechess-vs-aimchess-comparison-2026"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#ff8c42] transition-colors hover:text-[#ff5a1f]"
            >
              Read the full comparison article
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <p className="text-[11px] text-[#565061]">
              Comparison based on Aimchess free tier as of March 2026.
            </p>
          </div>
        </div>

        {/* Solo dev story */}
        <div className="relative mt-20 overflow-hidden rounded-2xl border border-[#1e1a24] bg-[#121015] p-7 md:p-9">
          <div
            className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,90,31,0.06), transparent 65%)",
            }}
          />
          <div className="relative space-y-5">
            <h3 className="text-xl font-bold tracking-[-0.01em] text-white">
              Built solo, with love for chess
            </h3>
            <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-[#8d8696]">
              <p>
                FireChess is built and maintained by one person — a{" "}
                <a
                  href="https://lichess.org/@/LeonFresh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ff8c42] hover:underline"
                >
                  ~2200 rapid player on Lichess
                </a>{" "}
                and developer who got frustrated with the lack of good
                multi-game analysis tools. There&apos;s no VC funding, no team
                of 20, no enterprise sales pipeline. Just me, Stockfish, and a
                lot of late nights.
              </p>
              <p>
                Your $5/month (or $59 lifetime) directly funds server costs,
                Stockfish engine improvements, and lets me keep building
                features like the ones you see here. Every Pro subscriber means
                I can spend more time making FireChess better instead of
                worrying about keeping the lights on.
              </p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-4">
              {[
                "Solo developer",
                "Ship fixes in hours",
                "Direct feedback loop",
                "Made by a chess player",
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-2.5 rounded-xl border border-[#1e1a24] bg-[#0d0b0e] px-4 py-3 text-[13px] text-[#8d8696]"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5a1f]" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dev Notes */}
        <div className="mt-20 overflow-hidden rounded-2xl border border-[#1e1a24] bg-[#121015] p-7 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] text-lg">
                📋
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Dev Notes</h3>
                <p className="text-xs text-[#565061]">
                  What&apos;s new — actively maintained by one dev
                </p>
              </div>
            </div>
            <Link
              href="/changelog"
              className="hidden items-center gap-1.5 rounded-full border border-[#1e1a24] bg-[#181520] px-3.5 py-1.5 text-xs font-medium text-[#8d8696] transition-colors hover:border-[#2a2433] hover:text-[#f0edf2] sm:inline-flex"
            >
              View all
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {CHANGELOG.slice(0, 3).map((entry, i) => (
              <Link
                key={entry.version}
                href="/changelog"
                className="group flex gap-4 rounded-xl border border-[#1e1a24] bg-[#0d0b0e] p-4 transition-colors hover:border-[#2a2433] hover:bg-[#181520]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] text-sm font-bold text-[#ff8c42]">
                  v{entry.version}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-semibold text-white group-hover:text-[#ff8c42]">
                      {entry.title}
                    </h4>
                    {i === 0 && (
                      <span className="shrink-0 rounded-full bg-[#ff5a1f]/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ff8c42]">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#565061]">
                    {entry.date}
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {entry.changes.slice(0, 2).map((c) => (
                      <li
                        key={c.text}
                        className="flex items-start gap-1.5 text-xs text-[#8d8696]"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#ff5a1f]/40" />
                        {c.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <svg
                  className="mt-1 h-4 w-4 shrink-0 text-[#565061] transition-colors group-hover:text-[#ff8c42]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ))}
          </div>

          <Link
            href="/changelog"
            className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-[#ff8c42] transition-colors hover:text-[#ff5a1f] sm:hidden"
          >
            View all updates
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Roadmap */}
        <div className="mt-20 rounded-2xl border border-[#1e1a24] bg-[#121015] p-7 md:p-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">What&apos;s next</h3>
            <span className="rounded-full border border-[#1e1a24] bg-[#0d0b0e] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8d8696]">
              Roadmap
            </span>
          </div>
          <p className="mt-2 text-sm text-[#8d8696]">
            Realistic next milestones — what I&apos;m actively working on and
            what&apos;s coming soon.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                priority: true,
                status: "In progress",
                title: "Progress tracking over time",
                desc: "Compare your reports week-over-week. See if your leak count, accuracy, and radar scores are improving with trend charts on your dashboard.",
              },
              {
                priority: true,
                status: "In progress",
                title: "Smarter move explanations",
                desc: "Better AI-generated explanations for why the engine's move is better — with plans, threats, and positional concepts instead of just engine lines.",
              },
              {
                priority: false,
                status: "Next up",
                title: "PGN import & export",
                desc: "Upload PGN files directly instead of fetching from Lichess/Chess.com. Export your analysis as annotated PGN to study in other tools.",
              },
              {
                priority: false,
                status: "Next up",
                title: "Opening repertoire builder",
                desc: "Auto-generate a repertoire from your actual games. See which lines you play, where you deviate, and suggested improvements.",
              },
              {
                priority: false,
                status: "Planned",
                title: "Study collections & spaced repetition",
                desc: "Save positions into study sets. Practice them with spaced repetition so you actually remember the correct moves.",
              },
              {
                priority: false,
                status: "Exploring",
                title: "Coaching tools & team dashboards",
                desc: "Multi-student management for coaches. Share reports, assign homework positions, and track student progress.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className={`rounded-xl border p-5 transition-colors ${
                  item.priority
                    ? "border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.04]"
                    : "border-[#1e1a24] bg-[#0d0b0e]"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  {item.priority ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#ff8c42]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5a1f]" />
                      {item.status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#1e1a24] bg-[#181520] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#565061]">
                      {item.status}
                    </span>
                  )}
                </div>
                <h4 className="text-base font-semibold text-white">
                  {item.title}
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-[#8d8696]">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative mt-24 overflow-hidden rounded-2xl border border-[#1e1a24] bg-[#121015] px-6 py-16 text-center">
            <div
              className="pointer-events-none absolute bottom-[-160px] left-1/2 h-[360px] w-[720px] max-w-[100vw] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, rgba(255,90,31,0.12), transparent 65%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl font-bold leading-[1.06] tracking-[-0.03em] text-white sm:text-4xl">
              Your next 100 games shouldn&apos;t
              <br />
              repeat your{" "}
              <span
                className="italic text-[#ff5a1f]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                last 100.
              </span>
            </h2>
            <p className="mt-4 text-sm text-[#8d8696]">
              Free scan. 300 games. Two minutes. No credit card.
            </p>
            <Link
              href="/#scan-section"
              className="btn-cta-fire mt-8 inline-flex h-12 items-center justify-center rounded-xl px-8 text-[15px] font-semibold text-white"
            >
              Scan my games — free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
