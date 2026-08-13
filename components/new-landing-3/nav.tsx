"use client";

import Link from "next/link";
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

const LINKS = [
  { label: "How it works", id: "how-it-works" },
  { label: "Features", id: "features" },
  { label: "Sample reports", id: "sample-reports" },
  { label: "Pricing", id: "pricing" },
];

export function Nl3Nav({ onScanClick }: { onScanClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[70] transition-all duration-300 ${
        scrolled
          ? "border-b border-[#1e1a24] bg-[#070608]/90 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em] text-white"
        >
          <FlameMark />
          FireChess
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => goTo(l.id)}
              className="text-[13.5px] font-medium text-[#8d8696] transition-colors hover:text-white"
            >
              {l.label}
            </button>
          ))}
          <Link
            href="/chaos"
            className="text-[13.5px] font-medium text-[#8d8696] transition-colors hover:text-white"
          >
            Chaos Chess
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <AuthButton />
          </div>
          <button
            onClick={onScanClick}
            className="rounded-[9px] bg-[#ff5a1f] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_0_24px_rgba(255,90,31,0.25)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_34px_rgba(255,90,31,0.4)]"
          >
            Scan my games
          </button>
        </div>
      </nav>
    </header>
  );
}
