"use client";

const TESTIMONIALS = [
  {
    gain: "+164 in 3 months",
    quote:
      "My report said 34% of my losses came from one Caro-Kann sideline. I had no idea. Drilled it for two weeks, stopped playing it, and the rating graph turned around.",
    name: "Daniel K.",
    meta: "1850 → 2014 · Chess.com rapid",
    grad: "linear-gradient(135deg,#ff5a1f,#c23a10)",
  },
  {
    gain: "+98 in 6 weeks",
    quote:
      "I thought I was bad at endgames. Turns out I was winning 77% of won positions — my real problem was missing knight forks in the middlegame. Fixing the right thing matters.",
    name: "Sara M.",
    meta: "1420 → 1518 · Lichess blitz",
    grad: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  },
  {
    gain: "+210 since January",
    quote:
      "The rescan diff is the addictive part. Every month I scan again and watch my leak count drop — 11 leaks in January, 4 in March. It's like a fitness tracker for chess.",
    name: "James T.",
    meta: "1690 → 1900 · Pro member",
    grad: "linear-gradient(135deg,#8b5cf6,#5b21b6)",
  },
];

export function Nl3Testimonials() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto mb-14 max-w-[640px] text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-3.5 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ff8c42]">
            Players
          </span>
        </div>
        <h2 className="text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
          They found their leak.
          <br />
          Then they fixed it.
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="flex flex-col gap-4 rounded-[18px] border border-[#1e1a24] bg-[#121015] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ff5a1f]/20"
          >
            <span className="w-fit rounded-full border border-[#28c840]/20 bg-[#28c840]/[0.08] px-3 py-1 text-xs font-bold text-[#3ddc5e]">
              ▲ {t.gain}
            </span>
            <p className="text-[15px] leading-relaxed text-[#f0edf2]">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-auto flex items-center gap-3">
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-[15px] font-bold text-white"
                style={{ background: t.grad }}
              >
                {t.name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white">{t.name}</h5>
                <div className="mt-0.5 text-xs text-[#565061]">{t.meta}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
