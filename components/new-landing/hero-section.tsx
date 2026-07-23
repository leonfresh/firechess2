"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Flame, Search, Target } from "lucide-react";

export type SiteStats = { totalUsers: number; activeUsers30d: number; totalReports: number; proMembers: number; lifetimeMembers: number; } | null;

const PROBLEMS = [
  { icon: "📉", title: "Stuck at the same rating?", text: "You've been 1800 for six months. Your scan shows why — the exact patterns keeping you from your next rating jump." },
  { icon: "♟", title: "Losing in the same opening?", text: "The Vienna Gambit keeps beating you. Opening leak detection pinpoints the exact moves where it falls apart." },
  { icon: "⏱️", title: "Winning then blundering?", text: "You reach good positions but collapse in time trouble. Clock pressure analysis tracks how your accuracy degrades." },
  { icon: "🧩", title: "Missing the same tactic?", text: "You hung a fork 5 times last week. Our missed-tactic detector clusters every one by theme — forks, pins, skewers." },
  { icon: "🏁", title: "Endgames leaking rating?", text: "You convert 38% of winning endgames. We rank your weakness by piece type: rook endgames, opposite bishops, queen vs rook." },
  { icon: "⚔", title: "No plan in the middlegame?", text: "Your accuracy drops 25% after move 15. Positional motif analysis shows which structures you handle poorly." },
];

export function HeroSection({
  siteStats, onScanClick, onSeeSampleClick,
}: { siteStats: SiteStats; onScanClick?: () => void; onSeeSampleClick?: () => void; }) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const el = scrollRef.current;
    if (!el) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % PROBLEMS.length;
        el.scrollTo({ left: next * 290, behavior: "smooth" });
        return next;
      });
    }, 5000);
    const pause = () => clearInterval(intervalRef.current);
    const resume = () => {
      intervalRef.current = setInterval(() => {
        setActiveIndex((prev) => {
          const next = (prev + 1) % PROBLEMS.length;
          el.scrollTo({ left: next * 290, behavior: "smooth" });
          return next;
        });
      }, 5000);
    };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    return () => { clearInterval(intervalRef.current); el.removeEventListener("mouseenter", pause); el.removeEventListener("mouseleave", resume); };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/[0.03] blur-[150px]" />
        <div className="absolute right-1/4 top-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.02] blur-[120px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ── Left: dynamic headline + CTA ── */}
          <div className="flex flex-col">
            {/* Badge */}
            <div className={`mb-6 flex w-fit items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-4 py-1.5 backdrop-blur-sm transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-orange-200/80">Stockfish 18 Powered</span>
            </div>

            {/* Dynamic headline */}
            <div className="mb-3 h-32 sm:h-36 lg:h-40">
              <p
                key={activeIndex}
                className="animate-fade-in-up text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                {PROBLEMS[activeIndex].title}
              </p>
            </div>

            {/* CTA */}
            <div className={`mb-4 flex flex-col items-start gap-4 transition-all duration-700 delay-200 sm:flex-row ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
              <button onClick={onScanClick} className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/30">
                <Search className="h-5 w-5" />Scan my games<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a href="/review" className="hidden sm:inline-flex items-center gap-2.5 rounded-xl border border-white/[0.12] bg-white/[0.04] px-8 py-4 text-base font-semibold text-slate-200 transition-all hover:border-white/[0.2] hover:bg-white/[0.08] hover:text-white">
                <Target className="h-5 w-5" />Game review<ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <button onClick={onSeeSampleClick} className={`text-left text-xs text-slate-600 underline underline-offset-4 transition hover:text-slate-400 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>Explore sample reports →</button>
          </div>

          {/* ── Right: scrollable card teasers ── */}
          <div className={`flex flex-col transition-all duration-700 delay-[250ms] ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            {/* Dot indicators */}
            <div className="mb-4 flex items-center gap-2">
              {PROBLEMS.map((_, i) => (
                <button
                  key={i} onClick={() => { setActiveIndex(i); scrollRef.current?.scrollTo({ left: i * 290, behavior: "smooth" }); }}
                  className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-6 bg-orange-400" : "w-1.5 bg-white/[0.12] hover:bg-white/[0.2]"}`}
                />
              ))}
            </div>

            {/* Cards row */}
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.08] [&::-webkit-scrollbar-track]:bg-transparent">
              {PROBLEMS.map((problem, i) => (
                <div
                  key={i}
                  className={`group min-w-[240px] shrink-0 cursor-pointer rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    i === activeIndex
                      ? "border-orange-500/30 bg-orange-500/[0.06] shadow-lg shadow-orange-500/5"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-orange-500/20 hover:bg-orange-500/[0.04]"
                  }`}
                  onClick={() => { setActiveIndex(i); scrollRef.current?.scrollTo({ left: i * 290, behavior: "smooth" }); }}
                >
                  <span className={`inline-block text-2xl transition-transform duration-300 ${i === activeIndex ? "scale-110" : ""} group-hover:scale-110`}>{problem.icon}</span>
                  <p className={`mt-3 text-sm font-bold leading-tight transition-colors ${i === activeIndex ? "text-orange-100" : "text-white group-hover:text-orange-100"}`}>
                    {problem.title}
                  </p>
                </div>
              ))}
            </div>

            {/* Active card description below the cards */}
            <div className="mt-5 min-h-[72px]">
              <p key={activeIndex} className="animate-fade-in-up text-sm leading-relaxed text-slate-400">
                {PROBLEMS[activeIndex].text}
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {siteStats && (
          <div className={`mt-16 flex flex-wrap items-center justify-center gap-8 text-center transition-all duration-700 delay-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <div><p className="text-2xl font-bold text-white">{siteStats.totalUsers.toLocaleString()}</p><p className="text-xs text-slate-500">Total users</p></div>
            <div className="h-8 w-px bg-white/[0.08]" />
            <div><p className="text-2xl font-bold text-white">{siteStats.totalReports.toLocaleString()}</p><p className="text-xs text-slate-500">Reports generated</p></div>
            <div className="h-8 w-px bg-white/[0.08]" />
            <div><p className="text-2xl font-bold text-white">{siteStats.proMembers.toLocaleString()}</p><p className="text-xs text-slate-500">Pro members</p></div>
          </div>
        )}
      </div>
    </section>
  );
}
