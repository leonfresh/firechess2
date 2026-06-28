"use client";

import {
  ArrowRight,
  Crosshair,
  Flame,
  Infinity as InfinityIcon,
  PlayCircle,
  Repeat,
  Search,
  Star,
  Target,
} from "lucide-react";
import { HeroProductScreenshot } from "@/components/hero-product-screenshot";

export type SiteStats = {
  totalUsers: number;
  activeUsers30d: number;
  totalReports: number;
  proMembers: number;
  lifetimeMembers: number;
} | null;

type Props = {
  siteStats: SiteStats;
  /**
   * Fired when the primary "Scan my games" CTA is clicked.
   * The page uses this to smooth-scroll to the analyzer form.
   */
  onScanClick?: () => void;
  /**
   * Fired when the "See a sample report" CTA is clicked.
   * The page uses this to smooth-scroll to the inline sample-reports section.
   */
  onSeeSampleClick?: () => void;
};

/**
 * Homepage hero.
 *
 * Messaging wedge: repeated mistakes / leaks — FireChess's true differentiator
 * vs generic Lichess / Chess.com analysis. Leads with the differentiated
 * promise, then a sample-report CTA so visitors see the payoff before
 * committing a username.
 */
export function HeroSection({ siteStats, onScanClick, onSeeSampleClick }: Props) {
  return (
    <header className="animate-fade-in-up">
      <div
        className="relative overflow-hidden rounded-[2.75rem] px-5 py-7 shadow-[0_40px_120px_-64px_rgba(20,8,5,0.95)] sm:px-8 sm:py-9 lg:px-10 lg:py-10"
        style={{
          background:
            "linear-gradient(150deg, rgba(10, 9, 13, 0.97) 0%, rgba(19, 13, 16, 0.96) 42%, rgba(34, 19, 12, 0.95) 70%, rgba(56, 25, 12, 0.92) 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/35 to-transparent" />
        <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-orange-400/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-red-500/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-1/3 h-48 w-48 rounded-full bg-amber-500/[0.04] blur-3xl" />

        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-10">
          {/* ── Copy column ─────────────────────────────────────────── */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-400/[0.07] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.28em] text-orange-100/70">
                <Repeat className="h-3 w-3" />
                Find the leaks you keep repeating
              </span>

              <div className="space-y-2">
                <h1 className="text-5xl font-black leading-[0.96] tracking-[-0.05em] text-white md:text-6xl lg:text-[4.45rem]">
                  Stop losing the
                </h1>
                <h1 className="bg-gradient-to-r from-amber-200 via-orange-300 to-red-400 bg-clip-text text-5xl font-black italic leading-[0.96] tracking-[-0.05em] text-transparent md:text-6xl lg:text-[4.45rem]">
                  same way twice.
                </h1>
              </div>
            </div>

            <p className="text-base leading-relaxed text-slate-300/90 md:text-lg lg:max-w-xl">
              FireChess scans your Lichess &amp; Chess.com games with Stockfish
              18 to find the{" "}
              <span className="font-semibold text-white">
                opening mistakes you repeat every week
              </span>
              , the tactics you miss, and the endgames you fumble — then turns
              each one into a drillable position.
            </p>

            {/* ── CTAs ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-start">
              <button
                type="button"
                onClick={onScanClick}
                className="btn-cta-fire group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold text-white"
              >
                Scan my games — free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={onSeeSampleClick}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-6 text-base font-semibold text-slate-100 transition-colors duration-200 hover:bg-orange-400/[0.08] hover:text-white"
              >
                <PlayCircle className="h-4 w-4 text-orange-300" />
                See a sample report
              </button>
              <a
                href="https://www.youtube.com/watch?v=MpWsW10YE5M"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold text-slate-400 transition-colors duration-200 hover:text-white"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch trailer
              </a>
            </div>

            {/* Differentiator chips — what you can't get on plain Lichess */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 lg:justify-start">
              {[
                { icon: Repeat, label: "Repeated-leak detection" },
                { icon: Crosshair, label: "Drill mode on your positions" },
                { icon: Target, label: "Tilt & clock analysis" },
              ].map((c) => (
                <span
                  key={c.label}
                  className="flex items-center gap-1.5 text-[13px] text-slate-500"
                >
                  <c.icon className="h-3.5 w-3.5 text-orange-300/70" />
                  <span className="text-slate-300">{c.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* ── Visual column ──────────────────────────────────────── */}
          <div className="relative mx-auto w-full max-w-[38rem] lg:max-w-none">
            <div className="pointer-events-none absolute -inset-10 rounded-full bg-orange-500/[0.06] blur-3xl" />
            <div className="relative rounded-[2rem] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-[1.5px] shadow-[0_0_80px_-16px_rgba(249,115,22,0.22),0_48px_120px_-52px_rgba(0,0,0,0.95)]">
              <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-[#050508]">
                <HeroProductScreenshot paused={false} />
                <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                  </span>
                  <span className="text-[10px] font-medium text-white/60">
                    Live demo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Activity metrics row ─────────────────────────────────── */}
        {/*
          Activity-based proof, not vanity user counts. For an early-stage
          product "games scanned" and "leaks found" feel alive even with a
          small user base, and map directly to the value proposition.
        */}
        <div className="relative mt-8 border-t border-white/[0.07] pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {[
              {
                value: siteStats?.totalReports,
                label: "Reports created",
                icon: Search,
                color: "text-emerald-400",
              },
              {
                value: siteStats?.totalUsers,
                label: "Players signed up",
                icon: Flame,
                color: "text-orange-400",
              },
              {
                value: siteStats?.proMembers,
                label: "Pro members",
                icon: Star,
                color: "text-amber-400",
              },
              {
                value: siteStats?.lifetimeMembers,
                label: "Lifetime members",
                icon: InfinityIcon,
                color: "text-red-400",
              },
            ].map((item, i) => (
              <div
                key={item.label}
                className="group relative px-4 py-3 transition-colors hover:bg-white/[0.02]"
              >
                {i > 0 && (
                  <div className="absolute left-0 top-3 hidden h-8 w-px bg-white/[0.06] sm:block" />
                )}
                <div className="flex items-center gap-2.5">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span
                    className={`text-xl font-bold tabular-nums ${item.color}`}
                  >
                    {item.value != null ? item.value.toLocaleString() : "—"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/** Compact social-proof strip used directly below the hero. */
export function HeroSocialProofStrip({ siteStats }: { siteStats: SiteStats }) {
  const items = [
    { value: "Lichess + Chess.com", label: "Both platforms" },
    { value: "Stockfish 18", label: "Engine-powered" },
    {
      value: "Openings · Tactics · Endgames",
      label: "Full coverage",
    },
    { value: "Free forever", label: "No credit card" },
  ];
  return (
    <div className="scroll-reveal flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-2">
      {items.map((stat, i) => (
        <div
          key={stat.label}
          className="chip-pop flex items-center gap-2"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400/60" />
          <span className="text-sm font-semibold text-white/85">
            {stat.value}
          </span>
          <span className="text-sm text-slate-500">— {stat.label}</span>
        </div>
      ))}
    </div>
  );
}
