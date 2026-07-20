"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Brain,
  Crosshair,
  FileSearch,
  LineChart,
  Scan,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: FileSearch,
    title: "Connect your accounts",
    description:
      "Link Lichess or Chess.com in seconds. We scan up to 300 of your recent games with Stockfish 18 — completely free.",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI finds your patterns",
    description:
      "Our engine identifies the mistakes you keep repeating: opening leaks, missed tactics, endgame blunders, and time trouble.",
  },
  {
    number: "03",
    icon: Target,
    title: "Drill your weaknesses",
    description:
      "Every leak becomes a personalized training position. Practice exactly what you need to fix, nothing you don't.",
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setActiveStep(index);
          }
        });
      },
      { threshold: 0.5 }
    );

    const elements = sectionRef.current?.querySelectorAll("[data-index]");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative px-4 py-24 sm:px-6 lg:px-8"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
            How it works
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            From scan to improvement in{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              three steps
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            No setup, no credit card, no waiting. Connect your account and get
            your first report in under a minute.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 lg:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;
            return (
              <div
                key={step.number}
                data-index={index}
                className={`group relative rounded-2xl border p-8 transition-all duration-500 ${
                  isActive
                    ? "border-orange-500/30 bg-gradient-to-b from-orange-500/[0.08] to-transparent"
                    : "border-white/[0.06] bg-[#0c0f15] hover:border-white/[0.12]"
                }`}
              >
                {/* Step number */}
                <div className="mb-6 flex items-center justify-between">
                  <span
                    className={`font-mono text-5xl font-bold transition-colors duration-500 ${
                      isActive ? "text-orange-500/40" : "text-white/[0.06]"
                    }`}
                  >
                    {step.number}
                  </span>
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 ${
                      isActive
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-white/[0.04] text-slate-400 group-hover:bg-white/[0.08]"
                    }`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                </div>

                <h3 className="mb-3 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="leading-relaxed text-slate-400">
                  {step.description}
                </p>

                {/* Progress indicator */}
                <div
                  className={`absolute bottom-0 left-0 h-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ${
                    isActive ? "w-full opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { icon: Scan, value: "2.4M+", label: "Games analyzed" },
            { icon: Target, value: "156K", label: "Leaks found" },
            { icon: TrendingUp, value: "+247", label: "Avg. rating gain" },
            { icon: Zap, value: "47s", label: "Avg. scan time" },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group rounded-xl border border-white/[0.06] bg-[#0c0f15] p-6 text-center transition-all duration-300 hover:border-orange-500/20 hover:bg-orange-500/[0.03]"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-white sm:text-3xl">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
