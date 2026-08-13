"use client";

import { Dumbbell, ScanSearch, Search } from "lucide-react";

/**
 * Homepage "How it works" — 3-step explainer shown when no scan is in flight.
 * Presentational; no external state deps.
 */
export function HowItWorks() {
  const steps = [
    {
      step: "1",
      icon: Search,
      title: "Enter your username",
      text: "Pick Lichess or Chess.com. We pull your recent games automatically — nothing to export.",
    },
    {
      step: "2",
      icon: ScanSearch,
      title: "Get your report",
      text: "Stockfish scans your openings, tactics, endgames, and clock usage in one pass.",
    },
    {
      step: "3",
      icon: Dumbbell,
      title: "Drill the leaks",
      text: "Every repeated mistake becomes a position you can replay, share, or train until it sticks.",
    },
  ];

  return (
    <section className="scroll-reveal mx-auto w-full max-w-5xl">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-300/80">
          How it works
        </p>
        <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
          From username to game plan in three steps
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#8d8696] sm:text-base">
          No uploads, no setup. FireChess reads your public games and does the
          rest — right in your browser.
        </p>
      </div>

      <div className="relative mt-8 grid gap-4 sm:grid-cols-3">
        <div
          className="pointer-events-none absolute left-[18%] right-[18%] top-9 hidden h-px bg-gradient-to-r from-orange-400/0 via-orange-400/25 to-orange-400/0 sm:block"
          aria-hidden="true"
        />
        {steps.map((item) => (
          <div
            key={item.step}
            className="group relative rounded-2xl border border-[#1e1a24] p-5 text-center transition-all duration-300 hover:border-orange-400/15 hover:shadow-[0_0_40px_-16px_rgba(249,115,22,0.12)]"
          >
            <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <item.icon className="h-5 w-5 text-orange-300" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(249,115,22,0.5)]">
                {item.step}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#8d8696]">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
