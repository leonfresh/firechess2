"use client";

import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { useState } from "react";
import { deferOnboarding } from "@/components/onboarding-tour";

const plans = [
  {
    id: "free" as const,
    icon: "🆓",
    name: "Free",
    originalPrice: null as string | null,
    price: "$0",
    subtitle: "Great for trying FireChess",
    badge: null as string | null,
    features: [
      "Up to 300 recent games per scan",
      "Engine depth up to 12",
      "Full opening leak detection + drill mode",
      "Up to 10 missed tactics per scan",
      "Up to 10 endgame mistakes per scan",
      "All scan modes (Openings / Tactics / Endgames / All)",
      "Strengths & Weaknesses radar + insight scores",
      "Basic mental game stats (stability, tilt, post-loss)",
      "Opening Explorer on every card",
      "Move explanations (Best / Played / DB move)",
      "Save reports to dashboard & track progress",
      "Lichess + Chess.com support"
    ],
    cta: "Get Started Free",
    highlight: false
  },
  {
    id: "pro" as const,
    icon: "🚀",
    name: "Pro",
    originalPrice: "$8",
    price: "$5/mo",
    subtitle: "For serious improvers",
    badge: "🔥 Launch pricing — 37% off",
    features: [
      "Up to 5,000 games per scan",
      "Higher engine depth (13–24)",
      "Unlimited missed tactics scanner",
      "Unlimited endgame mistake scanner",
      "Motif pattern analysis — find recurring weaknesses",
      "Time pressure detection on missed tactics",
      "Dedicated tactics & endgame drill modes",
      "Full Mental Game breakdown — archetype, color stats, momentum, streaks",
      "Deep Analysis — full study plans & coaching tips per dimension"
    ],
    cta: "Upgrade with Stripe",
    highlight: true
  },
  {
    id: "lifetime" as const,
    icon: "♾️",
    name: "Lifetime",
    originalPrice: "$99",
    price: "$59",
    subtitle: "Pay once, keep Pro forever",
    badge: "⚡ Founding member pricing",
    features: [
      "Everything in Pro — forever",
      "One-time payment, no recurring fees",
      "Lock in before price increases",
      "Support an indie dev building for chess players",
    ],
    cta: "Get Lifetime Access",
    highlight: false
  }
];

export default function PricingPage() {
  const { authenticated, plan } = useSession();
  const [checkoutLoading, setCheckoutLoading] = useState<"pro" | "lifetime" | null>(null);

  const handleUpgrade = async (checkoutPlan: "pro" | "lifetime" = "pro") => {
    if (!authenticated) {
      deferOnboarding(); // Don't show onboarding tour right after pricing sign-up
      window.location.href = "/auth/signin";
      return;
    }
    setCheckoutLoading(checkoutPlan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPlan === "lifetime" ? { plan: "lifetime" } : {}),
      });
      const data = await res.json();
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
    <div className="relative min-h-screen">
      {/* Animated orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-emerald-500/[0.07] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-cyan-500/[0.06] blur-[100px]" />
        <div className="animate-float absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 px-6 py-16 md:px-10">
        <section className="mx-auto w-full max-w-5xl space-y-16">

          {/* Hero */}
          <header className="animate-fade-in-up space-y-5 text-center">
            <span className="tag-fuchsia mx-auto">
              <span className="text-sm">♟</span> FireChess Pricing
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
              <span className="text-white">Choose your </span>
              <span className="gradient-text">training tier</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
              Start free, then unlock deeper analysis and bigger scan limits powered by Stockfish 18.
            </p>
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/[0.08] to-amber-500/[0.06] p-5 text-left">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-2xl">🔥</span>
                <div>
                  <h3 className="text-base font-bold text-white">Launch Pricing — 37% off</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    FireChess is brand new. Subscribe now at <span className="font-semibold text-orange-300">$5/mo instead of $8/mo</span> and
                    keep that rate forever — even when the price goes up. Or grab <span className="font-semibold text-amber-300">Lifetime access for a one-time $59</span>.
                  </p>
                  <p className="mt-2 text-xs font-medium text-orange-400/80">⏰ Launch pricing won&apos;t last forever — lock it in while you can.</p>
                </div>
              </div>
            </div>

              <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-2 md:grid-cols-4">
              {[
                { icon: "📊", text: "Opening leak detection" },
                { icon: "⚡", text: "Missed tactics scanner" },
                { icon: "♟️", text: "Endgame mistake finder" },
                { icon: "🧠", text: "Mental game analysis" },
              ].map((item) => (
                <div key={item.text} className="glass-card flex items-center gap-3 px-4 py-3 text-sm text-slate-300">
                  <span className="text-lg">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </header>

          {/* Social proof */}
          <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-5 py-2.5 text-sm text-slate-300">
            <span className="text-emerald-400">🔥</span>
            <span>Trusted by <span className="font-semibold text-white">hundreds</span> of chess improvers</span>
          </div>

          {/* Plan Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <article
                key={p.name}
                className={`glass-card-hover relative p-6 md:p-8 ${
                  p.highlight ? "border-emerald-500/20 shadow-glow" : p.id === "lifetime" ? "border-amber-500/20" : ""
                }`}
              >
                {p.highlight && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-500/[0.06] to-transparent" />
                )}
                {p.id === "lifetime" && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-500/[0.06] to-transparent" />
                )}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                      <span className="mr-2">{p.icon}</span>
                      {p.name}
                    </h2>
                    {p.highlight && (
                      <span className="tag-emerald text-[11px]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{p.subtitle}</p>
                  {p.badge && (
                    <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                      p.id === "lifetime"
                        ? "border-amber-500/20 bg-amber-500/[0.08] text-amber-300"
                        : "border-orange-500/20 bg-orange-500/[0.08] text-orange-300"
                    }`}>
                      {p.badge}
                    </div>
                  )}
                  <div className="mt-4 flex items-baseline gap-3">
                    {p.originalPrice && (
                      <span className="text-2xl font-bold text-slate-500 line-through decoration-red-500/60 decoration-2">{p.originalPrice}</span>
                    )}
                    <p className="text-4xl font-black gradient-text-emerald">{p.price}</p>
                    {p.id === "lifetime" && (
                      <span className="text-sm text-slate-500">one-time</span>
                    )}
                  </div>
                  {p.originalPrice && (
                    <p className="mt-2 text-sm font-medium text-orange-300/80">🔒 Early adopters keep this rate forever</p>
                  )}

                  <ul className="mt-6 space-y-3">
                    {p.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`mt-0.5 shrink-0 ${p.id === "lifetime" ? "text-amber-400" : "text-emerald-400"}`} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={!!checkoutLoading}
                    onClick={
                      p.id === "pro" ? () => handleUpgrade("pro")
                        : p.id === "lifetime" ? () => handleUpgrade("lifetime")
                        : undefined
                    }
                    className={`mt-8 w-full py-3 text-sm font-semibold transition-all duration-300 ${
                      p.id === "pro"
                        ? "btn-primary"
                        : p.id === "lifetime"
                          ? "rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110"
                          : "btn-secondary h-auto"
                    } disabled:opacity-50`}
                  >
                    {(p.id === "pro" || p.id === "lifetime") && isPro
                      ? plan === "lifetime"
                        ? "♾️ Lifetime member"
                        : p.id === "lifetime"
                          ? "Switch to Lifetime"
                          : "✓ Current plan"
                      : checkoutLoading === p.id
                        ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Redirecting to Stripe...
                          </span>
                        )
                        : p.cta}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Comparison table */}
          <div className="glass-card overflow-hidden p-6">
            <h3 className="mb-4 text-lg font-bold text-white">Plan comparison</h3>
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Feature</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Free</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-emerald-400">Pro</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-amber-400">Lifetime</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["Recent games per scan", "Up to 300", "Up to 5,000", "Up to 5,000"],
                    ["Engine depth", "Up to 12", "Up to 24", "Up to 24"],
                    ["Opening leak detection", "✓", "✓", "✓"],
                    ["Opening drill mode", "✓", "✓", "✓"],
                    ["Scan mode selector", "All modes", "All modes", "All modes"],
                    ["Strengths & Weaknesses radar", "✓", "✓", "✓"],
                    ["Deep Analysis insight scores", "✓ (scores only)", "✓ + study plans & coaching tips", "✓ + study plans & coaching tips"],
                    ["Opening Explorer (Lichess DB)", "✓", "✓", "✓"],
                    ["Move explanations", "✓", "✓", "✓"],
                    ["Missed tactics", "Up to 10 per scan", "Unlimited", "Unlimited"],
                    ["Endgame mistakes", "Up to 10 per scan", "Unlimited", "Unlimited"],
                    ["Motif pattern analysis", "—", "✓", "✓"],
                    ["Time pressure detection", "—", "✓", "✓"],
                    ["Tactics drill mode", "—", "✓", "✓"],
                    ["Endgame drill mode", "—", "✓", "✓"],
                    ["Mental game: basic stats", "✓", "✓", "✓"],
                    ["Mental game: full breakdown", "—", "✓ (archetype, color, streaks, form)", "✓"],
                    ["Save reports to dashboard", "✓", "✓", "✓"],
                    ["Recurring cost", "—", "$5/month", "$59 one-time"],
                  ].map(([feature, free, pro, lifetime]) => (
                    <tr key={feature} className="border-t border-white/[0.04]">
                      <td className="px-4 py-3 text-slate-400">{feature}</td>
                      <td className="px-4 py-3">{free}</td>
                      <td className="px-4 py-3 font-medium text-emerald-300">{pro}</td>
                      <td className="px-4 py-3 font-medium text-amber-300">{lifetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Why upgrade — solo dev story */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.06] via-amber-500/[0.04] to-emerald-500/[0.06]" />
            <div className="relative space-y-5">
              <div>
                <h3 className="text-xl font-bold text-white">Built solo, with love for chess</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  FireChess is built and maintained by one person — a{" "}
                  <a href="https://lichess.org/@/LeonFresh" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                    ~2200 rapid player on Lichess
                  </a>{" "}
                  and developer who got frustrated with the lack of good multi-game analysis tools.
                  There&apos;s no VC funding, no team of 20, no enterprise sales pipeline. Just me, Stockfish, and a lot of late nights.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Your $5/month (or $59 lifetime) directly funds server costs, Stockfish engine improvements, and lets me keep
                  building features like the ones you see here. Every Pro subscriber means I can spend more time
                  making FireChess better instead of worrying about keeping the lights on.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  I read every piece of feedback (shoutout to the{" "}
                  <a href="https://www.reddit.com/r/chessbeginners/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                    r/chessbeginners
                  </a>{" "}
                  crowd). If something&apos;s broken or missing,
                  I usually ship a fix within hours. That&apos;s the solo dev advantage — no tickets, no sprints, just results.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {[
                  { icon: "🧑‍💻", text: "Solo developer" },
                  { icon: "⚡", text: "Ship fixes in hours" },
                  { icon: "💬", text: "Direct feedback loop" },
                  { icon: "♟️", text: "Made by a chess player" },
                ].map((item) => (
                  <div key={item.text} className="stat-card flex items-center gap-3 text-sm text-slate-300">
                    <span className="text-lg">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Dev Notes */}
          <div className="glass-card overflow-hidden p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/15 text-xl">📋</span>
                <div>
                  <h3 className="text-lg font-bold text-white">Dev Notes</h3>
                  <p className="text-xs text-slate-500">What&apos;s new — actively maintained by one dev</p>
                </div>
              </div>
              <Link
                href="/changelog"
                className="hidden items-center gap-1.5 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/[0.08] px-3 py-1.5 text-xs font-medium text-fuchsia-300 transition-colors hover:bg-fuchsia-500/[0.15] sm:inline-flex"
              >
                View all
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  version: 9,
                  date: "Feb 27, 2026",
                  title: "Collapsible Sections & Mate Eval Fix",
                  highlights: [
                    "Report sections are now collapsible in list view",
                    "Eval displays correctly show \"Mate in X\" instead of 999+",
                  ],
                  tag: "latest" as const,
                },
                {
                  version: 8,
                  date: "Feb 27, 2026",
                  title: "Endgame & Tactics Fixes, Opening QoL",
                  highlights: [
                    "Endgame conversion rate fixed — was undercounting by ~90%",
                    "Ranked category breakdowns for endgames and tactics",
                  ],
                  tag: null,
                },
                {
                  version: 7,
                  date: "Feb 27, 2026",
                  title: "Study Plans, Coin Economy & Retention Suite",
                  highlights: [
                    "Coin economy + cosmetic shop with board themes & titles",
                    "Daily challenge, progress highlights, opening repertoire",
                  ],
                  tag: null,
                },
              ].map((entry) => (
                <Link
                  key={entry.version}
                  href="/changelog"
                  className="group flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-fuchsia-500/20 hover:bg-white/[0.04]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/10 text-sm font-bold text-fuchsia-400">
                    v{entry.version}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-white group-hover:text-fuchsia-300">{entry.title}</h4>
                      {entry.tag === "latest" && (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">{entry.date}</p>
                    <ul className="mt-1.5 space-y-0.5">
                      {entry.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-1.5 text-xs text-slate-400">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fuchsia-500/40" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <svg className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>

            <Link
              href="/changelog"
              className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-fuchsia-400 transition-colors hover:text-fuchsia-300 sm:hidden"
            >
              View all updates
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {/* Roadmap */}
          <div className="glass-card p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">What&apos;s next</h3>
              <span className="rounded-full border border-slate-500/20 bg-slate-500/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">Roadmap</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">Realistic next milestones — what I&apos;m actively working on and what&apos;s coming soon.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                {
                  priority: true,
                  status: "In progress",
                  title: "Progress tracking over time",
                  desc: "Compare your reports week-over-week. See if your leak count, accuracy, and radar scores are improving with trend charts on your dashboard."
                },
                {
                  priority: true,
                  status: "In progress",
                  title: "Smarter move explanations",
                  desc: "Better AI-generated explanations for why the engine's move is better — with plans, threats, and positional concepts instead of just engine lines."
                },
                {
                  priority: false,
                  status: "Next up",
                  title: "PGN import & export",
                  desc: "Upload PGN files directly instead of fetching from Lichess/Chess.com. Export your analysis as annotated PGN to study in other tools."
                },
                {
                  priority: false,
                  status: "Next up",
                  title: "Opening repertoire builder",
                  desc: "Auto-generate a repertoire from your actual games. See which lines you play, where you deviate, and suggested improvements."
                },
                {
                  priority: false,
                  status: "Planned",
                  title: "Study collections & spaced repetition",
                  desc: "Save positions into study sets. Practice them with spaced repetition so you actually remember the correct moves."
                },
                {
                  priority: false,
                  status: "Exploring",
                  title: "Coaching tools & team dashboards",
                  desc: "Multi-student management for coaches. Share reports, assign homework positions, and track student progress."
                },
              ].map((item, i) => (
                <article
                  key={item.title}
                  className={`stat-card ${item.priority ? "border-emerald-500/20" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {item.priority ? (
                      <span className="tag-emerald text-[10px]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        {item.status.toUpperCase()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/[0.06] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        {item.status}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-semibold text-white">{item.title}</h4>
                  <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link href="/" className="btn-secondary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back to scanner
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
