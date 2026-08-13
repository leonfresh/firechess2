"use client";

import Link from "next/link";

type App = {
  name: string;
  icon: string;
  href: string;
  grad: string;
  badge?: { text: string; cls: string };
};

const APPS: App[] = [
  { name: "Chaos Chess", icon: "🎲", href: "/chaos", grad: "linear-gradient(135deg,#ff5a1f,#b91c1c)", badge: { text: "HOT", cls: "bg-[#f43f5e]" } },
  { name: "Scan", icon: "🔥", href: "/#scan-section", grad: "linear-gradient(135deg,#f59e0b,#b45309)" },
  { name: "Game Review", icon: "🎯", href: "/review", grad: "linear-gradient(135deg,#3b82f6,#1e40af)" },
  { name: "Puzzles", icon: "🧩", href: "/puzzles", grad: "linear-gradient(135deg,#8b5cf6,#5b21b6)" },
  { name: "Lessons", icon: "📚", href: "/learn", grad: "linear-gradient(135deg,#10b981,#065f46)" },
  { name: "Tactics", icon: "⚡", href: "/tactics", grad: "linear-gradient(135deg,#ec4899,#9d174d)" },
  { name: "Endgames", icon: "🏁", href: "/endgames", grad: "linear-gradient(135deg,#14b8a6,#0f766e)" },
  { name: "Leaderboard", icon: "🏆", href: "/leaderboard", grad: "linear-gradient(135deg,#eab308,#a16207)", badge: { text: "PRO", cls: "bg-[#f59e0b]" } },
  { name: "Daily", icon: "📅", href: "/daily", grad: "linear-gradient(135deg,#06b6d4,#155e75)", badge: { text: "NEW", cls: "bg-[#10b981]" } },
  { name: "Dungeon", icon: "🏰", href: "/dungeon", grad: "linear-gradient(135deg,#6366f1,#3730a3)" },
];

const DOCK = APPS.slice(0, 4);

export function Nl3AppLauncher() {
  return (
    <div className="border-y border-[#1e1a24] bg-[#0d0b0e]">
      <section className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-[640px] text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-3.5 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ff8c42]">
              More than a scanner
            </span>
          </div>
          <h2 className="mb-4 text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
            One site. Every way to play
            <br />
            and improve.
          </h2>
          <p className="text-[16.5px] leading-relaxed text-[#8d8696]">
            Your report is the hub. From there, jump into Chaos Chess, drill
            tactics, review games move-by-move, or climb the leaderboard.
          </p>
        </div>

        {/* Device frame */}
        <div className="mx-auto max-w-[860px] rounded-[30px] bg-gradient-to-b from-[#2a2a2e] to-[#17171a] p-3 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          <div className="relative overflow-hidden rounded-[20px] bg-[#070608] px-5 pb-7 pt-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,90,31,0.06)_1px,transparent_1px),radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:90px_90px,46px_46px]" />

            {/* Status bar */}
            <div className="relative flex items-center justify-between px-2 pb-4 text-xs font-semibold text-[#8d8696]">
              <span>9:41</span>
              <span>FireChess</span>
              <span className="tracking-tighter">●●●</span>
            </div>

            {/* App grid */}
            <div className="relative grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5">
              {APPS.map((a) => (
                <Link
                  key={a.name}
                  href={a.href}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div className="relative">
                    <div
                      className="grid h-14 w-14 place-items-center overflow-hidden rounded-[24%] text-2xl shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:scale-110 group-active:scale-90 sm:h-16 sm:w-16"
                      style={{ background: a.grad }}
                    >
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent to-45%" />
                      <span className="relative">{a.icon}</span>
                    </div>
                    {a.badge && (
                      <span
                        className={`absolute -right-2 -top-2 z-10 grid h-5 min-w-[20px] place-items-center rounded-full border-2 border-[#070608] px-1.5 text-[9px] font-extrabold tracking-wide text-white ${a.badge.cls}`}
                      >
                        {a.badge.text}
                      </span>
                    )}
                  </div>
                  <span className="text-center text-[11px] font-medium leading-tight text-[#8d8696] transition-colors group-hover:text-white">
                    {a.name}
                  </span>
                </Link>
              ))}
            </div>

            {/* Dock */}
            <div className="relative mx-auto mt-6 flex w-fit justify-center gap-3.5 rounded-[18px] bg-[#ff5a1f]/[0.05] px-4 py-2.5 backdrop-blur-md">
              {DOCK.map((a) => (
                <Link
                  key={a.name}
                  href={a.href}
                  className="group relative grid h-12 w-12 place-items-center overflow-hidden rounded-[24%] text-xl shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] hover:scale-110 active:scale-90"
                  style={{ background: a.grad }}
                  aria-label={a.name}
                >
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent to-45%" />
                  <span className="relative">{a.icon}</span>
                </Link>
              ))}
            </div>

            <div className="relative mx-auto mt-4 h-1 w-[120px] rounded-full bg-[#ff5a1f]/25" />
          </div>
        </div>
      </section>
    </div>
  );
}
