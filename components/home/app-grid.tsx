"use client";

import Link from "next/link";

interface AppTile {
  icon: string;
  label: string;
  href: string;
  desc: string;
  badge?: "new" | "hot" | "pro";
  color: string;
}

const APPS: AppTile[] = [
  // Row 1 — Play
  { icon: "🎲", label: "Chaos Chess", href: "/chaos", desc: "Rule-breaking multiplayer chess", badge: "hot", color: "from-rose-600 to-rose-900" },
  { icon: "🤺", label: "Opening Sparring", href: "/sparring", desc: "Practice openings vs AI", badge: "new", color: "from-emerald-600 to-emerald-900" },
  { icon: "🧩", label: "Puzzles", href: "/puzzles", desc: "Tactics from your own games", color: "from-cyan-600 to-cyan-900" },
  { icon: "🏰", label: "Dungeon", href: "/dungeon", desc: "Roguelike chess survival", color: "from-violet-600 to-violet-900" },
  // Row 2 — Analyze
  { icon: "🔬", label: "Game Scanner", href: "/analyze", desc: "Full scan: openings, tactics, time", color: "from-blue-600 to-blue-900" },
  { icon: "🌳", label: "Opening Tree", href: "/my-openings", desc: "Track your repertoire leaks", badge: "new", color: "from-emerald-600 to-emerald-900" },
  { icon: "♟️", label: "Tactics Board", href: "/tactics", desc: "Pattern recognition trainer", color: "from-orange-600 to-orange-900" },
  { icon: "🏁", label: "Endgame Lab", href: "/endgames", desc: "Endgame analysis & training", color: "from-sky-600 to-sky-900" },
  { icon: "💣", label: "Mistakes", href: "/mistakes", desc: "Your repeated blunders", color: "from-red-600 to-red-900" },
  // Row 3 — Improve
  { icon: "📈", label: "Coach", href: "/coach", desc: "AI-powered improvement plan", badge: "pro", color: "from-purple-600 to-purple-900" },
  { icon: "🎯", label: "Daily Challenge", href: "/daily", desc: "New puzzle every day", color: "from-green-600 to-green-900" },
  { icon: "🧠", label: "Tutor", href: "/tutor", desc: "Personalised chess lessons", color: "from-indigo-600 to-indigo-900" },
  { icon: "📚", label: "Study Plan", href: "/learn?tab=plan", desc: "Plans from your game data", color: "from-teal-600 to-teal-900" },
  { icon: "🏋️", label: "Training", href: "/train", desc: "Drills & spaced repetition", color: "from-rose-600 to-rose-900" },
  // Row 4 — Explore
  { icon: "🕵️", label: "Guess ELO", href: "/guess", desc: "Guess rating from the game", color: "from-pink-600 to-pink-900" },
  { icon: "🗺️", label: "Openings", href: "/openings", desc: "Browse opening explorer", color: "from-lime-600 to-lime-900" },
  { icon: "🎓", label: "Learn", href: "/learn", desc: "Guided chess courses", color: "from-cyan-600 to-cyan-900" },
  { icon: "🏅", label: "Leaderboard", href: "/leaderboard", desc: "Top players & rankings", color: "from-amber-600 to-amber-900" },
  { icon: "🏆", label: "Best Game", href: "/dashboard", desc: "Your best performances", color: "from-yellow-600 to-yellow-900" },
  // Row 5 — Social
  { icon: "👥", label: "Community", href: "/community", desc: "Share, discuss, challenge", color: "from-blue-600 to-blue-900" },
  { icon: "👤", label: "Players", href: "/players", desc: "Search & follow players", color: "from-sky-600 to-sky-900" },
  { icon: "⚡", label: "Blitz Arena", href: "/chaos", desc: "Fast chess arena matches", color: "from-amber-600 to-amber-900" },
  { icon: "💬", label: "Feedback", href: "/feedback", desc: "Report bugs & suggest ideas", color: "from-gray-600 to-gray-900" },
];

const DOCK_APPS: AppTile[] = [
  { icon: "🔬", label: "Scanner", href: "/analyze", desc: "", color: "from-blue-600 to-blue-900" },
  { icon: "🎲", label: "Chaos", href: "/chaos", desc: "", color: "from-rose-600 to-rose-900" },
  { icon: "🤺", label: "Sparring", href: "/sparring", desc: "", badge: "new", color: "from-emerald-600 to-emerald-900" },
  { icon: "🧩", label: "Puzzles", href: "/puzzles", desc: "", color: "from-cyan-600 to-cyan-900" },
  { icon: "🌳", label: "Openings", href: "/my-openings", desc: "", color: "from-emerald-600 to-emerald-900" },
];

const COLS = 5;

function AppIcon({ app, size = "md" }: { app: AppTile; size?: "sm" | "md" }) {
  const isSm = size === "sm";
  return (
    <Link
      href={app.href}
      className="group relative flex flex-col items-center gap-1.5"
      aria-label={app.desc || app.label}
    >
      <div
        className={`relative overflow-hidden rounded-[24%] ${
          isSm
            ? "h-12 w-12 sm:h-[52px] sm:w-[52px]"
            : "h-[62px] w-[62px] sm:h-[76px] sm:w-[76px]"
        } bg-gradient-to-b ${app.color} shadow-lg shadow-black/40 transition-all duration-150 group-hover:scale-110 group-active:scale-90`}
      >
        {/* Glass reflection */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="pointer-events-none absolute -left-1 -top-1 h-1/2 w-1/2 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-sm" />

        <span className="relative z-10 flex h-full w-full items-center justify-center text-2xl sm:text-3xl drop-shadow-lg [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.5))]">
          {app.icon}
        </span>

        {app.badge && (
          <span
            className={`absolute -right-0.5 -top-0.5 z-20 rounded-full px-1 py-[1px] text-[6px] font-bold uppercase leading-none tracking-wider shadow-lg ${
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

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[24%] bg-black/85 p-1 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
          <span className="text-[8px] leading-tight text-white/90 sm:text-[9px]">
            {app.desc}
          </span>
        </div>
      </div>

      <span
        className={`max-w-[72px] truncate text-center text-[10px] font-semibold leading-tight text-white/80 drop-shadow-sm sm:text-[11px] ${
          isSm ? "hidden sm:block" : "block"
        }`}
      >
        {app.label}
      </span>
    </Link>
  );
}

export function AppGridSection() {
  // Arrange into rows manually for a clean 5-wide grid
  const rows: AppTile[][] = [];
  for (let i = 0; i < APPS.length; i += COLS) {
    rows.push(APPS.slice(i, i + COLS));
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 text-center sm:mb-8">
        <h2 className="text-xl font-bold text-white sm:text-2xl">
          All FireChess Modes
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Play, analyse, improve — everything in one place
        </p>
      </div>

      <div className="mx-auto flex justify-center">
        <div
          className="relative inline-block w-full max-w-[620px] rounded-[28px] bg-gradient-to-b from-[#2c2c2e] to-[#1c1c1e] p-[5px] shadow-2xl shadow-black/60 sm:rounded-[34px] sm:p-[7px]"
          style={{
            boxShadow:
              "0 25px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Bezel inner ring */}
          <div className="pointer-events-none absolute inset-[5px] rounded-[23px] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] sm:inset-[7px] sm:rounded-[27px]" />

          {/* Screen */}
          <div className="relative overflow-hidden rounded-[23px] bg-[#0b0e14] sm:rounded-[27px]">
            {/* Screen grain */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent" />

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 pt-2.5 pb-1 sm:px-5 sm:pt-3 sm:pb-1.5">
              <span className="text-[10px] font-semibold text-white/50 sm:text-[11px]">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <div className="flex items-center gap-1.5">
                <svg className="h-[11px] w-[11px] text-white/40 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 9l4-4 4 4" /><path d="M1 17l4-4 4 4" />
                </svg>
                <div className="relative h-2.5 w-[18px] rounded-[2px] border border-white/25 overflow-hidden">
                  <div className="absolute inset-0 m-[1.5px] rounded-[1px] bg-emerald-400 w-[60%]" />
                </div>
              </div>
            </div>

            {/* App grid */}
            <div className="px-3 pb-1 pt-0.5 sm:px-4">
              {rows.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 last:mb-0">
                  {row.map((app) => (
                    <div key={app.href} className="flex-shrink-0" style={{ width: `${100 / COLS}%`, maxWidth: "80px" }}>
                      <AppIcon app={app} />
                    </div>
                  ))}
                  {/* Fill empty slots so alignment stays clean */}
                  {row.length < COLS &&
                    Array.from({ length: COLS - row.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="flex-shrink-0" style={{ width: `${100 / COLS}%`, maxWidth: "80px" }} />
                    ))}
                </div>
              ))}
            </div>

            {/* Dock */}
            <div className="flex justify-center pb-1.5 pt-0.5 sm:pb-2">
              <div className="flex items-center gap-1.5 rounded-2xl bg-white/[0.06] px-3 py-1.5 backdrop-blur-md sm:gap-2 sm:px-4 sm:py-2">
                {DOCK_APPS.map((app) => (
                  <AppIcon key={app.href} app={app} size="sm" />
                ))}
              </div>
            </div>

            {/* Home indicator */}
            <div className="flex justify-center pb-1.5 sm:pb-2">
              <div className="h-[3px] w-[24px] rounded-full bg-white/25 sm:h-[4px] sm:w-[28px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
