"use client";

import Link from "next/link";
import { useState } from "react";

interface AppTile {
  icon: string;
  label: string;
  href: string;
  desc: string;
  badge?: "new" | "hot" | "pro";
  row: number;
  col: number;
  color: string; // gradient color for the icon background
}

const APPS: AppTile[] = [
  // Row 1 — Play
  { icon: "🎲", label: "Chaos Chess", href: "/chaos", desc: "Multiplayer chess with rule-breaking power-ups", badge: "hot", row: 0, col: 0, color: "from-rose-600 to-rose-800" },
  { icon: "⚡", label: "Blitz Arena", href: "/chaos?mode=arena", desc: "Fast-paced chaos chess arena", row: 0, col: 1, color: "from-amber-600 to-amber-800" },
  { icon: "🤺", label: "Opening Sparring", href: "/sparring", desc: "Practice openings against AI", badge: "new", row: 0, col: 2, color: "from-emerald-600 to-emerald-800" },
  { icon: "🏰", label: "Dungeon", href: "/dungeon", desc: "Roguelike chess survival", row: 0, col: 3, color: "from-violet-600 to-violet-800" },
  { icon: "🧩", label: "Puzzles", href: "/puzzles", desc: "Tactical puzzles from your games", row: 0, col: 4, color: "from-cyan-600 to-cyan-800" },

  // Row 2 — Analyze
  { icon: "🔬", label: "Game Scanner", href: "/analyze", desc: "Full scan: openings, tactics, endgames, time", row: 1, col: 0, color: "from-blue-600 to-blue-800" },
  { icon: "🌳", label: "Opening Tree", href: "/my-openings", desc: "Repertoire & leak rates", badge: "new", row: 1, col: 1, color: "from-emerald-600 to-emerald-800" },
  { icon: "♟️", label: "Tactics Board", href: "/tactics", desc: "Tactical pattern trainer", row: 1, col: 2, color: "from-orange-600 to-orange-800" },
  { icon: "🏁", label: "Endgame Lab", href: "/endgames", desc: "Endgame analysis & training", row: 1, col: 3, color: "from-sky-600 to-sky-800" },
  { icon: "💣", label: "Mistakes", href: "/mistakes", desc: "Repeated blunders by pattern", row: 1, col: 4, color: "from-red-600 to-red-800" },

  // Row 3 — Improve
  { icon: "🏆", label: "Best Game", href: "/best-game", desc: "Your highest accuracy game", row: 2, col: 0, color: "from-yellow-600 to-yellow-800" },
  { icon: "🎯", label: "Daily Challenge", href: "/daily", desc: "A new puzzle every day", row: 2, col: 1, color: "from-green-600 to-green-800" },
  { icon: "📈", label: "Coach", href: "/coach", desc: "AI-powered improvement plan", badge: "pro", row: 2, col: 2, color: "from-purple-600 to-purple-800" },
  { icon: "🧠", label: "Tutor", href: "/tutor", desc: "Personalised chess lessons", row: 2, col: 3, color: "from-indigo-600 to-indigo-800" },
  { icon: "📚", label: "Study Plan", href: "/learn?tab=plan", desc: "Structured plan from your games", row: 2, col: 4, color: "from-teal-600 to-teal-800" },

  // Row 4 — Explore
  { icon: "🕵️", label: "Guess ELO", href: "/guess", desc: "Guess rating from the game", row: 3, col: 0, color: "from-pink-600 to-pink-800" },
  { icon: "🗺️", label: "Openings", href: "/openings", desc: "Browse opening explorer", row: 3, col: 1, color: "from-lime-600 to-lime-800" },
  { icon: "🎓", label: "Learn", href: "/learn", desc: "Guided chess courses", row: 3, col: 2, color: "from-cyan-600 to-cyan-800" },
  { icon: "🏋️", label: "Training", href: "/train", desc: "Drills & spaced repetition", row: 3, col: 3, color: "from-rose-600 to-rose-800" },
  { icon: "🏅", label: "Leaderboard", href: "/leaderboard", desc: "Top players & rankings", row: 3, col: 4, color: "from-amber-600 to-amber-800" },

  // Row 5 — Social
  { icon: "👥", label: "Community", href: "/community", desc: "Share, discuss, challenge", row: 4, col: 0, color: "from-blue-600 to-blue-800" },
  { icon: "👤", label: "Players", href: "/players", desc: "Search & follow players", row: 4, col: 1, color: "from-sky-600 to-sky-800" },
  { icon: "🎮", label: "Social Play", href: "/play", desc: "Play with friends online", row: 4, col: 2, color: "from-violet-600 to-violet-800" },
];

const DOCK_APPS: AppTile[] = [
  { icon: "🔬", label: "Scanner", href: "/analyze", desc: "", row: 0, col: 0, color: "from-blue-600 to-blue-800" },
  { icon: "🎲", label: "Chaos", href: "/chaos", desc: "", row: 0, col: 1, color: "from-rose-600 to-rose-800" },
  { icon: "🤺", label: "Sparring", href: "/sparring", desc: "", badge: "new", row: 0, col: 2, color: "from-emerald-600 to-emerald-800" },
  { icon: "🧩", label: "Puzzles", href: "/puzzles", desc: "", row: 0, col: 3, color: "from-cyan-600 to-cyan-800" },
  { icon: "🌳", label: "Tree", href: "/my-openings", desc: "", row: 0, col: 4, color: "from-emerald-600 to-emerald-800" },
];

const ROWS = 5;
const COLS = 5;

function AppIcon({ app, size = "md" }: { app: AppTile; size?: "sm" | "md" }) {
  const isSm = size === "sm";
  return (
    <Link
      href={app.href}
      className="group relative flex flex-col items-center gap-1"
    >
      {/* Icon square — iOS-style super-rounded rect with glossy finish */}
      <div
        className={`relative overflow-hidden rounded-[22%] ${
          isSm ? "h-12 w-12 sm:h-14 sm:w-14" : "h-14 w-14 sm:h-[68px] sm:w-[68px]"
        } bg-gradient-to-b ${app.color} shadow-lg shadow-black/30 transition-all duration-200 group-hover:scale-110 group-active:scale-95`}
      >
        {/* Inner gradient gloss — skeuomorphic glass reflection */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
        {/* Shine spot */}
        <div className="pointer-events-none absolute -left-1 -top-1 h-3/5 w-3/5 rounded-full bg-gradient-to-br from-white/15 to-transparent blur-sm" />

        {/* Emoji icon */}
        <span className="relative z-10 flex h-full w-full items-center justify-center text-xl sm:text-2xl drop-shadow-lg">
          {app.icon}
        </span>

        {/* Badge */}
        {app.badge && (
          <span
            className={`absolute -right-0.5 -top-0.5 z-20 rounded-full px-1 py-0.5 text-[7px] font-bold uppercase leading-none tracking-wider shadow-lg ${
              app.badge === "new"
                ? "bg-emerald-500 text-white"
                : app.badge === "hot"
                  ? "bg-rose-500 text-white"
                  : "bg-amber-500 text-black"
            }`}
          >
            {app.badge === "new" ? "New" : app.badge === "hot" ? "Hot" : "Pro"}
          </span>
        )}

        {/* Hover overlay: show description */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[22%] bg-black/80 p-1 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
          <span className="text-[8px] leading-tight text-white/90 sm:text-[9px]">
            {app.desc}
          </span>
        </div>
      </div>

      {/* Label — iOS home screen style */}
      <span
        className={`max-w-[72px] truncate text-center text-[10px] font-semibold leading-tight text-white/80 drop-shadow-sm sm:text-[11px] ${
          isSm ? "hidden sm:block" : ""
        }`}
      >
        {app.label}
      </span>
    </Link>
  );
}

export function AppGridSection() {
  const [currentPage, setCurrentPage] = useState(0);

  // Single grid page — all apps in one view (no scroll)
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Your Chess Hub
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Everything you need to play, analyse, and improve
        </p>
      </div>

      {/* ── iPad frame ── */}
      <div className="mx-auto flex justify-center">
        <div
          className="relative inline-block rounded-[32px] bg-gradient-to-b from-[#2c2c2e] to-[#1c1c1e] p-[6px] shadow-2xl shadow-black/50 sm:rounded-[38px] sm:p-[8px]"
          style={{
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Bezel inner glow */}
          <div className="pointer-events-none absolute inset-[6px] rounded-[26px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:inset-[8px] sm:rounded-[30px]" />

          {/* Screen */}
          <div className="relative overflow-hidden rounded-[26px] bg-[#0a0d14] sm:rounded-[30px]">
            {/* Subtle screen gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

            {/* Status bar */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1 sm:px-6 sm:pt-4">
              <span className="text-[11px] font-semibold text-white/60">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-4 rounded-[2px] border border-white/30 relative overflow-hidden">
                  <div className="absolute inset-0 m-[1px] rounded-[1px] bg-emerald-400 w-[70%]" />
                </div>
                <svg className="h-3 w-3 text-white/50" viewBox="0 0 16 16">
                  <path
                    fill="currentColor"
                    d="M8 2a6 6 0 100 12A6 6 0 008 2z"
                    opacity="0.4"
                  />
                  <path
                    fill="currentColor"
                    d="M8 3a5 5 0 100 10A5 5 0 008 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Home screen content — 5×5 grid */}
            <div className="px-3 pb-2 pt-1 sm:px-4 sm:pb-3">
              {/* Row labels (side labels like iOS categories) */}
              {Array.from({ length: ROWS }).map((_, row) => {
                const rowApps = APPS.filter((a) => a.row === row);
                return (
                  <div key={row} className="flex items-start justify-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    {Array.from({ length: COLS }).map((_, col) => {
                      const app = rowApps.find((a) => a.col === col);
                      return (
                        <div
                          key={col}
                          className="flex-shrink-0"
                          style={{ width: `${100 / COLS}%` }}
                        >
                          {app ? <AppIcon app={app} /> : <div />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Dock */}
            <div className="flex justify-center pb-2 pt-1 sm:pb-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-4 sm:py-2.5">
                {DOCK_APPS.map((app) => (
                  <AppIcon key={app.href} app={app} size="sm" />
                ))}
              </div>
            </div>

            {/* Home indicator */}
            <div className="flex justify-center pb-2">
              <div className="h-[4px] w-[28px] rounded-full bg-white/30 sm:w-[32px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
