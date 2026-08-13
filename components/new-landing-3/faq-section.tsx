"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. A 300-game scan with the full report — leaks, tactics, endgames, AI coach — is free every month. Pro removes limits and adds progress tracking, nothing else is paywalled.",
  },
  {
    q: "Which platforms are supported?",
    a: "Lichess and Chess.com natively — just your username, no login. You can also upload a PGN directly if your games live somewhere else.",
  },
  {
    q: "How is this different from Lichess computer analysis?",
    a: "Per-game analysis tells you move 23 was a blunder. FireChess aggregates 300 games and tells you that 40% of your blunders are knight forks in the French — and then drills knight-fork patterns until you stop falling for them.",
  },
  {
    q: "What rating range is this for?",
    a: "Roughly 800–2400. Below 800 the patterns are too noisy to cluster; above 2400 you'll want a human coach for nuance. Club players (1200–1800) see the biggest gains.",
  },
];

export function Nl3Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="mx-auto max-w-[820px] px-4 py-24 sm:px-6">
      <div className="mb-12">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-3.5 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ff8c42]">
            FAQ
          </span>
        </div>
        <h2 className="text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
          Quick answers.
        </h2>
      </div>

      <div>
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="border-b border-[#1e1a24]">
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-1 py-6 text-left text-[16.5px] font-semibold tracking-[-0.01em] text-white"
              >
                {f.q}
                <span
                  className={`text-xl font-light transition-transform duration-300 ${
                    isOpen ? "rotate-45 text-[#ff5a1f]" : "text-[#565061]"
                  }`}
                >
                  +
                </span>
              </button>
              <div
                className="grid transition-all duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[680px] px-1 pb-6 text-[15px] leading-relaxed text-[#8d8696]">
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
