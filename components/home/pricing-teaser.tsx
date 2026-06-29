import Link from "next/link";
import { Check } from "lucide-react";

/**
 * Compact pricing teaser for the landing page — mirrors the real /pricing tiers
 * (Free $0 / Pro $5-mo, launch 37% off / Lifetime $59) so the price is visible
 * up front without making visitors hunt for it. Links through to /pricing for
 * the full comparison + checkout. Static (no client JS).
 */
const TIERS = [
  {
    name: "Free",
    price: "$0",
    was: null as string | null,
    blurb: "Everything you need to find your leaks.",
    features: [
      "Up to 300 games per scan",
      "Full opening-leak detection + drill mode",
      "10 tactics + 10 endgames per scan",
      "Strengths radar + mental-game stats",
    ],
    cta: "Start free",
    href: "#analyzer",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$5",
    suffix: "/mo",
    was: "$8",
    badge: "Most popular · 37% off",
    blurb: "For players serious about climbing.",
    features: [
      "Everything in Free, plus —",
      "Unlimited games, tactics & endgames",
      "Engine depth up to 24",
      "Motif analysis + brilliant-move detection",
      "Full mental-game breakdown & study plans",
    ],
    cta: "Go Pro",
    href: "/pricing",
    highlight: true,
  },
  {
    name: "Lifetime",
    price: "$59",
    was: "$99",
    blurb: "Pay once, keep Pro forever.",
    features: [
      "Everything in Pro — forever",
      "One-time payment, no subscription",
      "Lock in founding-member pricing",
    ],
    cta: "Get Lifetime",
    href: "/pricing",
    highlight: false,
  },
];

export function PricingTeaser() {
  return (
    <section className="scroll-reveal">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-white md:text-4xl">
            Simple pricing — start free
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Scanning your games is free, no card required. Upgrade only when you
            want bigger limits and deeper analysis.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={
                "relative flex h-full flex-col rounded-2xl border p-6 " +
                (tier.highlight
                  ? "border-orange-500/40 bg-orange-500/[0.05]"
                  : "border-white/[0.08] bg-white/[0.02]")
              }
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-3 py-1 text-[11px] font-bold text-slate-950">
                  {tier.badge}
                </span>
              )}

              <h3 className="text-lg font-bold text-white">{tier.name}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">
                  {tier.price}
                </span>
                {tier.suffix && (
                  <span className="text-sm text-slate-400">{tier.suffix}</span>
                )}
                {tier.was && (
                  <span className="text-sm text-slate-500 line-through">
                    {tier.was}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-400">{tier.blurb}</p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={
                  "mt-6 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors " +
                  (tier.highlight
                    ? "btn-cta-fire text-white"
                    : "border border-white/15 text-slate-100 hover:border-white/25 hover:bg-white/[0.05]")
                }
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link
            href="/pricing"
            className="underline-offset-2 hover:text-slate-300 hover:underline"
          >
            See the full feature comparison →
          </Link>
        </p>
      </div>
    </section>
  );
}
