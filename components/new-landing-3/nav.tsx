"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthButton } from "@/components/auth-button";

/** Flame logomark — the concept's standalone flame, replaces knight+flame. */
export function FlameMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2C12 2 6 8 6 13a6 6 0 0012 0c0-2-1-3.5-1-3.5S16 11 14.5 11c.5-2.5-.5-5.5-2.5-7C12 4 12 2 12 2z"
        fill="#ff5a1f"
      />
      <path
        d="M12 22a5 5 0 01-5-5c0-1.5.5-2.6.5-2.6S8 16 9.5 16c-.3-2 .5-4 2.5-5.5 0 0 2 2.5 2 5a5 5 0 01-2 4.5z"
        fill="#ffb37a"
        opacity="0.85"
      />
    </svg>
  );
}

type MenuItem = { href: string; label: string; icon: string };
type Menu = { key: string; label: string; items: MenuItem[] };

const MENUS: Menu[] = [
  {
    key: "analyze",
    label: "Analyze",
    items: [
      { href: "/analyze", label: "PGN Analyzer", icon: "♟️" },
      { href: "/analysis", label: "Analysis Board", icon: "🧭" },
      { href: "/review", label: "Game Review", icon: "📺" },
      { href: "/my-openings", label: "My Opening Tree", icon: "🌲" },
    ],
  },
  {
    key: "play",
    label: "Play",
    items: [
      { href: "/chaos", label: "Chaos Chess", icon: "🎲" },
      { href: "/puzzles", label: "Puzzles & Drills", icon: "🎯" },
      { href: "/daily", label: "Daily Routine", icon: "📅" },
      { href: "/sparring", label: "Opening Sparring", icon: "⚔️" },
      { href: "/dungeon", label: "Dungeon Tactics", icon: "🗡️" },
      { href: "/guess", label: "Guess the Move", icon: "🧩" },
    ],
  },
  {
    key: "learn",
    label: "Learn",
    items: [
      { href: "/learn", label: "Lessons", icon: "📚" },
      { href: "/openings", label: "Openings", icon: "📖" },
      { href: "/tactics", label: "Tactics", icon: "⚡" },
      { href: "/endgames", label: "Endgames", icon: "♟" },
      { href: "/glossary", label: "Glossary", icon: "📕" },
    ],
  },
  {
    key: "explore",
    label: "Explore",
    items: [
      { href: "/blog", label: "Blog", icon: "📝" },
      { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
      { href: "/about", label: "About", icon: "ℹ️" },
      { href: "/changelog", label: "Changelog", icon: "🆕" },
    ],
  },
];

export function Nl3Nav({ onScanClick }: { onScanClick: () => void }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const menuActive = (m: Menu) => m.items.some((i) => isActive(i.href));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[70] transition-all duration-300 ${
        scrolled
          ? "border-b border-[#1e1a24] bg-[#070608]/90 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em] text-white"
        >
          <FlameMark />
          FireChess
        </Link>

        {/* Dropdown groups */}
        <div className="hidden items-center gap-0.5 lg:flex">
          {MENUS.map((m) => (
            <div
              key={m.key}
              className="relative"
              onMouseEnter={() => setOpenMenu(m.key)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                type="button"
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                  menuActive(m)
                    ? "bg-white/[0.06] text-white"
                    : "text-[#8d8696] hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {m.label}
                <svg
                  className={`h-3 w-3 text-[#565061] transition-transform ${openMenu === m.key ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                className={`absolute left-0 top-full pt-1 transition-all duration-150 ${
                  openMenu === m.key
                    ? "visible opacity-100"
                    : "invisible pointer-events-none opacity-0"
                }`}
              >
                <div className="min-w-[210px] rounded-xl border border-[#1e1a24] bg-[#0d0b0e]/97 p-1.5 shadow-xl shadow-black/50 backdrop-blur-xl">
                  {m.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                        isActive(item.href)
                          ? "bg-[#ff5a1f]/[0.08] text-[#ff8c42]"
                          : "text-[#8d8696] hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <Link
            href="/pricing"
            className={`rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
              isActive("/pricing")
                ? "bg-white/[0.06] text-white"
                : "text-[#8d8696] hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            Pricing
          </Link>
        </div>

        {/* Right: auth + scan CTA in one row */}
        <div className="flex shrink-0 items-center gap-3">
          <AuthButton />
          <button
            onClick={onScanClick}
            className="nl3-cta hidden rounded-[9px] bg-[#ff5a1f] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_0_24px_rgba(255,90,31,0.25)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_34px_rgba(255,90,31,0.4)] sm:inline-flex"
          >
            Scan my games
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#1e1a24] text-[#8d8696] lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              {mobileOpen ? (
                <path d="M3 3l10 10M13 3L3 13" />
              ) : (
                <path d="M2 4h12M2 8h12M2 12h12" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="border-t border-[#1e1a24] bg-[#070608]/97 px-4 pb-6 pt-2 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => {
              setMobileOpen(false);
              onScanClick();
            }}
            className="nl3-cta mb-4 mt-2 flex w-full items-center justify-center rounded-[10px] bg-[#ff5a1f] py-3 text-[15px] font-semibold text-white"
          >
            Scan my games — free
          </button>
          {MENUS.map((m) => (
            <div key={m.key} className="border-b border-[#1e1a24] py-2 last:border-0">
              <p className="px-1 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#565061]">
                {m.label}
              </p>
              <div className="grid grid-cols-2 gap-x-2">
                {m.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13.5px] font-medium text-[#8d8696] hover:text-white"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <Link
            href="/pricing"
            className="mt-1 block rounded-lg px-2 py-2.5 text-[14px] font-semibold text-[#ff8c42]"
          >
            Pricing →
          </Link>
        </div>
      )}
    </header>
  );
}
