"use client";

import { useState } from "react";
import {
  Brain,
  Crosshair,
  Flame,
  LineChart,
  Repeat,
  Swords,
  Target,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Crosshair,
    title: "Opening Leak Detection",
    description:
      "Find the exact moves where your openings fall apart. See which lines you keep losing and why.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    span: "col-span-1 row-span-1",
  },
  {
    icon: Brain,
    title: "Pattern Recognition",
    description:
      "AI identifies recurring mistakes across hundreds of games.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    span: "col-span-1 row-span-1",
  },
  {
    icon: Target,
    title: "Personalized Drills",
    description: "Turn every mistake into a trainable position.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    span: "col-span-1 row-span-1",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    description: "Watch your accuracy improve over time.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    span: "col-span-1 row-span-1",
  },
  {
    icon: Swords,
    title: "Tactical Blindspots",
    description: "Discover the tactics you consistently miss.",
    color: "text-red-400",
    bg: "bg-red-500/10",
    span: "col-span-1 row-span-1",
  },
  {
    icon: Repeat,
    title: "Endgame Analysis",
    description: "Find where your endgames go wrong.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    span: "col-span-1 row-span-1",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get your full report in under 60 seconds.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    span: "col-span-1 row-span-1",
  },
];

export function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="relative px-4 py-24 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[0.03] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
            Features
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              stop repeating
            </span>{" "}
            mistakes
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            One scan reveals the patterns holding your rating back. Then we
            turn each leak into a drill you can actually fix.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={feature.title}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0f15] p-6 transition-all duration-500 hover:border-white/[0.12] ${feature.span} ${
                  isHovered ? "z-10 scale-[1.02] shadow-2xl" : ""
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hover glow */}
                <div
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.05] to-transparent" />
                </div>

                <div className="relative">
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} transition-transform duration-500 group-hover:scale-110`}
                  >
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {feature.description}
                  </p>
                </div>

                {/* Corner accent */}
                <div
                  className={`absolute -bottom-8 -right-8 h-24 w-24 rounded-full ${feature.bg} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-medium text-orange-400 transition-colors hover:text-orange-300"
          >
            <Flame className="h-4 w-4" />
            See all features
          </a>
        </div>
      </div>
    </section>
  );
}
