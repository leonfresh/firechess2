"use client";

import type { CSSProperties, MouseEvent } from "react";

const OPENING_BARS = [
  { label: "Sicilian Najdorf", pct: 34 },
  { label: "London System", pct: 58 },
  { label: "Italian Game", pct: 71 },
  { label: "Caro-Kann", pct: 82 },
];

const CARDS = [
  {
    span: "md:col-span-4",
    icon: "🔥",
    title: "Opening leak detection",
    body: "We track every opening position you reach more than twice and grade the moves you actually play — including the line where you win 30% when book says 55%.",
    visual: true,
  },
  {
    span: "md:col-span-2",
    icon: "⏱️",
    title: "Time trouble profiling",
    body: "See exactly when your moves degrade — by clock position, not just move number.",
  },
  {
    span: "md:col-span-2",
    icon: "♟️",
    title: "Endgame conversion",
    body: "How many winning endgames do you actually convert? Most players guess wrong by 40%.",
  },
  {
    span: "md:col-span-2",
    icon: "🧩",
    title: "Missed tactics, clustered",
    body: "Your 91 missed tactics aren't 91 problems — they're usually 3 motifs you can't see.",
  },
  {
    span: "md:col-span-2",
    icon: "🤖",
    title: "AI coach summary",
    body: "Plain-English read of your entire report. What to fix first, in order of rating impact.",
  },
  {
    span: "md:col-span-4",
    icon: "📚",
    title: "Lessons built from your own games",
    body: "Every leak spawns an interactive lesson using positions you reached — not generic puzzles. Replay the moment, find the move, understand the idea, then get quizzed on it in a fresh position. The drill adapts until the pattern sticks.",
  },
  {
    span: "md:col-span-2",
    icon: "📈",
    title: "Rescan & compare",
    body: "Scan again next month and diff the reports. Watch your leak count fall as rating climbs.",
  },
];

function spotlight(e: MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function Nl3Features() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6 lg:px-10">
      <div className="mb-16 max-w-[640px]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-3.5 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ff8c42]">
            What you get
          </span>
        </div>
        <h2 className="mb-4 text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
          Not another game review.
          <br />A diagnosis.
        </h2>
        <p className="text-[16.5px] leading-relaxed text-[#8d8696]">
          Engines tell you a move was bad. FireChess tells you why you keep
          making it — across hundreds of games.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        {CARDS.map((c) => (
          <div
            key={c.title}
            onMouseMove={spotlight}
            className={`nl3-bento relative overflow-hidden rounded-[20px] border border-[#1e1a24] bg-[#121015] p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ff5a1f]/20 ${c.span}`}
            style={{ "--mx": "50%", "--my": "50%" } as CSSProperties}
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] text-xl">
              {c.icon}
            </div>
            <h3 className="mb-2 text-[17.5px] font-semibold tracking-[-0.015em] text-white">
              {c.title}
            </h3>
            <p className="text-sm leading-relaxed text-[#8d8696]">{c.body}</p>

            {c.visual && (
              <div className="mt-5 rounded-xl border border-[#1e1a24] bg-[#070608] p-4">
                {OPENING_BARS.map((b) => (
                  <div key={b.label} className="mb-2 flex items-center gap-2.5 last:mb-0">
                    <span className="w-[110px] shrink-0 text-[11px] text-[#8d8696]">
                      {b.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1e1a24]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ff5a1f] to-[#ff8c42]"
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-[11px] text-[#ff8c42]">
                      {b.pct}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
