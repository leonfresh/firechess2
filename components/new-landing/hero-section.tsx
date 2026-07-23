"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Crosshair, Flame, Repeat, Search, Target, Zap } from "lucide-react";

export type SiteStats = {
  totalUsers: number;
  activeUsers30d: number;
  totalReports: number;
  proMembers: number;
  lifetimeMembers: number;
} | null;

const PROBLEMS = [
  { icon: "📉", title: "Stuck at the same rating?", text: "You've been 1800 for six months. Your scan will show you why." },
  { icon: "♟", title: "Losing in the same opening?", text: "The Vienna Gambit keeps beating you. The scan finds the exact moves where it falls apart." },
  { icon: "⏱️", title: "Winning then blundering?", text: "You reach good positions but collapse in time trouble. The pattern is real — we can measure it." },
  { icon: "🧩", title: "Missing the same tactic?", text: "You hung a fork in 5 of your last 10 games. That's not bad luck — that's a habit." },
  { icon: "🏁", title: "Endgames leaking rating?", text: "You convert 38% of winning endgames. The scan pinpoints your weakest type." },
  { icon: "⚔", title: "No plan in the middlegame?", text: "Your accuracy drops 25% after move 15. The positional report shows the structures you struggle with." },
];

export function HeroSection({
  siteStats,
  onScanClick,
  onSeeSampleClick,
}: {
  siteStats: SiteStats;
  onScanClick?: () => void;
  onSeeSampleClick?: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  // Auto-scroll the problem cards
  useEffect(() => {
    if (!mounted) return;
    const scrollContainer = document.getElementById("problem-scroll");
    if (!scrollContainer) return;
    let interval = setInterval(() => {
      if (scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 10) {
        scrollContainer.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollContainer.scrollBy({ left: 290, behavior: "smooth" });
      }
    }, 4000);
    // Pause on hover
    const onEnter = () => clearInterval(interval);
    const onLeave = () => {
      interval = setInterval(() => {
        if (scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 10) {
          scrollContainer.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollContainer.scrollBy({ left: 290, behavior: "smooth" });
        }
      }, 4000);
    };
    scrollContainer.addEventListener("mouseenter", onEnter);
    scrollContainer.addEventListener("mouseleave", onLeave);
    return () => {
      clearInterval(interval);
      scrollContainer.removeEventListener("mouseenter", onEnter);
      scrollContainer.removeEventListener("mouseleave", onLeave);
    };
  }, [mounted]);

  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/[0.03] blur-[150px]" />
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-red-500/[0.02] blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/[0.02] blur-[100px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Badge */}
        <div className={`mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-4 py-1.5 backdrop-blur-sm transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-xs font-medium uppercase tracking-wider text-orange-200/80">Stockfish 18 Powered</span>
        </div>

        {/* Core headline */}
        <h1 className={`mx-auto mb-4 max-w-4xl text-center text-3xl font-bold leading-[1.1] tracking-tight text-white transition-all duration-700 delay-100 sm:text-5xl lg:text-6xl ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <span className="block">See every pattern you miss,</span>
          <span className="block bg-gradient-to-r from-amber-200 via-orange-300 to-red-400 bg-clip-text text-transparent">
            not just the next move.
          </span>
        </h1>

        <p className={`mx-auto mb-8 mt-4 max-w-2xl text-center text-base leading-relaxed text-slate-400 transition-all duration-700 delay-200 sm:text-lg ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          Find what holds your game back in minutes. Analyze 300 games and discover the exact patterns, habits, and blind spots keeping you from your next rating jump.
        </p>

        {/* Two CTA buttons */}
        <div className={`mb-16 flex flex-col items-center justify-center gap-4 transition-all duration-700 delay-300 sm:flex-row ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <button
            onClick={onScanClick}
            className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/30"
          >
            <Search className="h-5 w-5" />
            Scan my games — free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <a
            href="/review"
            className="inline-flex items-center gap-2.5 rounded-xl border border-white/[0.12] bg-white/[0.04] px-8 py-4 text-base font-semibold text-slate-200 transition-all hover:border-white/[0.2] hover:bg-white/[0.08] hover:text-white"
          >
            <Target className="h-5 w-5" />
            Single game review
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Horizontal scroll: problems FireChess solves */}
        <div className={`mb-20 transition-all duration-700 delay-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Does any of this sound familiar?
          </p>
          <div
            id="problem-scroll"
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.08] [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {PROBLEMS.map((problem, i) => (
              <div
                key={i}
                className="group min-w-[260px] shrink-0 cursor-default rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/20 hover:bg-orange-500/[0.04] hover:shadow-lg hover:shadow-orange-500/5"
              >
                <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{problem.icon}</span>
                <p className="mt-3 text-sm font-bold text-white transition-colors group-hover:text-orange-100">{problem.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400 transition-colors group-hover:text-slate-300">{problem.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row (unchanged from original) */}
        {siteStats && (
          <div className={`flex flex-wrap items-center justify-center gap-8 text-center transition-all duration-700 delay-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <div>
              <p className="text-2xl font-bold text-white">{siteStats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Total users</p>
            </div>
            <div className="h-8 w-px bg-white/[0.08]" />
            <div>
              <p className="text-2xl font-bold text-white">{siteStats.totalReports.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Reports generated</p>
            </div>
            <div className="h-8 w-px bg-white/[0.08]" />
            <div>
              <p className="text-2xl font-bold text-white">{siteStats.proMembers.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Pro members</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
