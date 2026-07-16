"use client";

import Link from "next/link";
import { useRef, useState } from "react";

interface AppTile {
  icon: string;
  label: string;
  href: string;
  desc: string;
  badge?: "new" | "hot" | "pro";
  category: "analyze" | "play" | "improve" | "social";
}

const ALL_APPS: AppTile[] = [
  // ── Play ──
  {
    icon: "🎲",
    label: "Chaos Chess",
    href: "/chaos",
    desc: "Multiplayer chess with rule-breaking power-ups",
    badge: "hot",
    category: "play",
  },
  {
    icon: "⚡",
    label: "Blitz Arena",
    href: "/chaos?mode=arena",
    desc: "Fast-paced chaos chess arena matches",
    category: "play",
  },
  {
    icon: "🤺",
    label: "Opening Sparring",
    href: "/sparring",
    desc: "Practice specific openings against AI",
    badge: "new",
    category: "play",
  },
  {
    icon: "🧩",
    label: "Puzzles",
    href: "/puzzles",
    desc: "Tactical puzzles from your own games",
    category: "play",
  },
  {
    icon: "🎯",
    label: "Daily Challenge",
    href: "/daily",
    desc: "A new puzzle or challenge every day",
    category: "play",
  },
  {
    icon: "🕵️",
    label: "Guess the ELO",
    href: "/guess",
    desc: "Can you guess the rating from the game?",
    category: "play",
  },

  // ── Analyze ──
  {
    icon: "🔬",
    label: "Game Scanner",
    href: "/analyze",
    desc: "Full scan: openings, tactics, endgames, time",
    category: "analyze",
  },
  {
    icon: "🌳",
    label: "Opening Tree",
    href: "/my-openings",
    desc: "Track your opening repertoire & leak rates",
    badge: "new",
    category: "analyze",
  },
  {
    icon: "🏁",
    label: "Endgame Lab",
    href: "/endgames",
    desc: "Endgame position analysis & training",
    category: "analyze",
  },
  {
    icon: "💣",
    label: "Mistakes",
    href: "/mistakes",
    desc: "Your most repeated blunders by pattern",
    category: "analyze",
  },
  {
    icon: "🏆",
    label: "Best Game",
    href: "/best-game",
    desc: "Find your highest-accuracy performance",
    category: "analyze",
  },
  {
    icon: "♟️",
    label: "Tactics Board",
    href: "/tactics",
    desc: "Tactical pattern recognition trainer",
    category: "analyze",
  },

  // ── Improve ──
  {
    icon: "🧠",
    label: "Tutor",
    href: "/tutor",
    desc: "Personalised chess lessons & feedback",
    category: "improve",
  },
  {
    icon: "🎓",
    label: "Learn",
    href: "/learn",
    desc: "Guided courses: openings to endgames",
    category: "improve",
  },
  {
    icon: "🏋️",
    label: "Training",
    href: "/train",
    desc: "Drills & spaced repetition for key patterns",
    category: "improve",
  },
  {
    icon: "📈",
    label: "Coach",
    href: "/coach",
    desc: "AI-powered game review & improvement plan",
    badge: "pro",
    category: "improve",
  },
  {
    icon: "📚",
    label: "Study Plan",
    href: "/learn?tab=plan",
    desc: "Build a structured study plan from your games",
    category: "improve",
  },
  {
    icon: "🏰",
    label: "Dungeon",
    href: "/dungeon",
    desc: "Roguelike chess: survive increasingly hard positions",
    category: "play",
  },

  // ── Social ──
  {
    icon: "🏅",
    label: "Leaderboard",
    href: "/leaderboard",
    desc: "Top players & chaos chess rankings",
    category: "social",
  },
  {
    icon: "👥",
    label: "Community",
    href: "/community",
    desc: "Share games, discuss, and challenge friends",
    category: "social",
  },
  {
    icon: "👤",
    label: "Players",
    href: "/players",
    desc: "Search & follow other chess players",
    category: "social",
  },
  {
    icon: "🗺️",
    label: "Openings",
    href: "/openings",
    desc: "Browse the opening explorer database",
    category: "analyze",
  },
];

const CAT_ORDER: { key: string; label: string; color: string }[] = [
  { key: "play", label: "Play", color: "from-emerald-500/20 to-emerald-600/5" },
  {
    key: "analyze",
    label: "Analyze",
    color: "from-blue-500/20 to-blue-600/5",
  },
  {
    key: "improve",
    label: "Improve",
    color: "from-purple-500/20 to-purple-600/5",
  },
  {
    key: "social",
    label: "Social",
    color: "from-amber-500/20 to-amber-600/5",
  },
];

export function AppGridSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);

  const scroll = (dir: number) => {
    if (!scrollRef.current) return;
    const amt = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: amt * dir, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    setScrollPos(scrollRef.current.scrollLeft);
  };

  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Section header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Your Chess Hub
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Everything you need to play, analyse, and improve — all in one place.
        </p>
      </div>

      {/* Category scroll — like Poki's game grid */}
      <div className="relative">
        {/* Scroll arrows */}
        <button
          type="button"
          onClick={() => scroll(-1)}
          className={`absolute -left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900/90 text-white backdrop-blur-sm transition-all hover:bg-slate-800 sm:flex ${
            scrollPos <= 2 ? "opacity-0" : "opacity-100"
          }`}
          aria-label="Scroll left"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          className={`absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900/90 text-white backdrop-blur-sm transition-all hover:bg-slate-800 sm:flex ${
            scrollRef.current
              ? scrollPos >=
                scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 2
                ? "opacity-0"
                : "opacity-100"
              : "opacity-100"
          }`}
          aria-label="Scroll right"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Scrollable grid */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto overscroll-x-contain pb-2 scrollbar-hide"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {CAT_ORDER.map((cat) => {
            const apps = ALL_APPS.filter((a) => a.category === cat.key);
            return (
              <div
                key={cat.key}
                className="flex-shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Category label */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {cat.label}
                  </span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                {/* App tiles — responsive grid within each category */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 min-w-[320px]">
                  {apps.map((app) => (
                    <Link
                      key={app.href}
                      href={app.href}
                      className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {/* Badge */}
                      {app.badge && (
                        <span
                          className={`absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                            app.badge === "new"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : app.badge === "hot"
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {app.badge === "new"
                            ? "New"
                            : app.badge === "hot"
                              ? "Hot"
                              : "Pro"}
                        </span>
                      )}
                      {/* Icon */}
                      <span className="text-2xl sm:text-3xl">{app.icon}</span>
                      {/* Label */}
                      <span className="text-[10px] font-semibold leading-tight text-slate-300 group-hover:text-white sm:text-[11px]">
                        {app.label}
                      </span>
                      {/* Description (shown on hover/focus) */}
                      <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-900/95 p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                        <span className="text-[10px] leading-snug text-slate-300 sm:text-[11px]">
                          {app.desc}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
