"use client";

import { useState } from "react";
import { Check, Crown, Flame, Sparkles, Zap } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    icon: Zap,
    price: "$0",
    period: "forever",
    description: "Perfect for casual players",
    features: [
      "300 games per scan",
      "Stockfish 18 analysis",
      "Opening leak detection",
      "Basic pattern recognition",
      "Community support",
    ],
    cta: "Start scanning",
    popular: false,
    gradient: "from-slate-500/20 to-slate-600/10",
    border: "border-[#1e1a24]",
    button:
      "bg-[#1e1a24] text-white hover:bg-[#ff5a1f]/[0.1] border border-[#1e1a24]",
  },
  {
    name: "Pro",
    icon: Flame,
    price: "$9",
    period: "/month",
    description: "For serious improvers",
    features: [
      "Unlimited games",
      "Deeper analysis (depth 20+)",
      "Personalized drill positions",
      "Progress tracking",
      "Priority support",
      "Export reports",
    ],
    cta: "Go Pro",
    popular: true,
    gradient: "from-orange-500/20 to-red-500/10",
    border: "border-orange-500/30",
    button:
      "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-90",
  },
  {
    name: "Lifetime",
    icon: Crown,
    price: "$149",
    period: "once",
    description: "One payment, forever yours",
    features: [
      "Everything in Pro",
      "Lifetime updates",
      "Early access to features",
      "Discord role",
      "Name in credits",
    ],
    cta: "Get Lifetime",
    popular: false,
    gradient: "from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/30",
    button:
      "bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:opacity-90",
  },
];

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );

  return (
    <section className="relative px-4 py-24 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[0.04] blur-[100px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[#8d8696]">
            Pricing
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Simple pricing for{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              serious improvement
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#8d8696]">
            Start free, upgrade when you're ready. No hidden fees, cancel
            anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.04] p-1">
            {(["monthly", "yearly"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                  billingPeriod === period
                    ? "bg-orange-500 text-white"
                    : "text-[#8d8696] hover:text-white"
                }`}
              >
                {period === "monthly" ? "Monthly" : "Yearly"}
                {period === "yearly" && (
                  <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                    -20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid gap-8 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border bg-gradient-to-b p-8 transition-all duration-500 hover:scale-[1.02] ${plan.gradient} ${plan.border} ${
                  isPopular ? "shadow-2xl ring-1 ring-orange-500/30" : ""
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                      isPopular
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-[#1e1a24] text-[#8d8696]"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-[#8d8696]">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-[#565061]">{plan.period}</span>
                  </div>
                  {billingPeriod === "yearly" && plan.name === "Pro" && (
                    <p className="mt-1 text-sm text-emerald-400">
                      $7.20/month billed yearly
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                          isPopular ? "text-orange-400" : "text-[#565061]"
                        }`}
                      />
                      <span className="text-sm text-[#f0edf2]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition-all ${plan.button}`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Money-back guarantee */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#565061]">
            <span className="font-medium text-[#8d8696]">
              30-day money-back guarantee
            </span>{" "}
            — no questions asked. If you don't improve, we refund you.
          </p>
        </div>
      </div>
    </section>
  );
}
