"use client";

const STEPS = [
  {
    n: "01",
    tag: "~5 sec",
    title: "Connect your account",
    body: "Paste your Lichess or Chess.com username. We pull your last 300 games automatically — blitz, rapid, or both.",
  },
  {
    n: "02",
    tag: "~2 min",
    title: "Stockfish reads everything",
    body: "Every move is evaluated at depth 22. We cluster the mistakes by opening, position type, and phase to find the patterns, not one-offs.",
  },
  {
    n: "03",
    tag: "Forever",
    title: "Drill the leaks away",
    body: "Each leak becomes an interactive lesson built from your own games. Fix the top three and watch the next scan come back cleaner.",
  },
];

export function Nl3HowItWorks() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6 lg:px-10">
      <div className="mb-16 max-w-[640px]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-3.5 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ff8c42]">
            How it works
          </span>
        </div>
        <h2 className="mb-4 text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
          From raw games to a<br />
          fixable list, in three steps.
        </h2>
        <p className="text-[16.5px] leading-relaxed text-[#8d8696]">
          No setup, no imports, no PGN wrangling. Type your username and the
          pipeline handles the rest.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="group relative rounded-[18px] border border-[#1e1a24] bg-[#121015] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#ff5a1f]/20 hover:bg-[#181520]"
          >
            <span className="absolute right-5 top-5 rounded-full border border-[#1e1a24] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#565061]">
              {s.tag}
            </span>
            <div className="mb-4 bg-gradient-to-b from-[#ff5a1f] to-transparent bg-clip-text text-[64px] font-extrabold leading-none tracking-[-0.04em] text-transparent opacity-90">
              {s.n}
            </div>
            <h3 className="mb-2.5 text-[19px] font-semibold tracking-[-0.015em] text-white">
              {s.title}
            </h3>
            <p className="text-[14.5px] leading-relaxed text-[#8d8696]">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
