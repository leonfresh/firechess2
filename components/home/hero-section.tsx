"use client";

import {
  ArrowRight,
  Crosshair,
  Flame,
  PlayCircle,
  Repeat,
  Search,
  Star,
  Target,
} from "lucide-react";
import { HeroProductScreenshot } from "@/components/hero-product-screenshot";

const REDDIT_THREAD_URL =
  "https://www.reddit.com/r/chessbeginners/comments/1re8jgm/i_made_a_free_tool_that_finds_the_mistakes_you/";

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
 * Homepage hero — Opal-inspired centered layout.
 *
 * Structure mirrors what makes opal.google feel inviting: the animated product
 * demo sits ON TOP, a short calm headline beneath it, and a SINGLE primary CTA.
 * Everything is centered with generous whitespace and minimal body copy — the
 * demo does the explaining, not paragraphs. Keeps the dark "fire" identity; the
 * airiness comes from spacing and one-idea-per-block structure, not a light bg.
 */
export function HeroSection({ siteStats, onScanClick, onSeeSampleClick }: Props) {
  return (
    <header className="animate-fade-in-up">
      <div className="relative overflow-hidden px-2 py-10 sm:px-4 sm:py-14 lg:py-20">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-red-500/[0.04] blur-[120px]" />

        {/* ── Two-column hero — copy left, slideshow right ──────────────
            A tall multi-tab demo sits better beside the copy than on top of
            it; this keeps the headline + CTA visible without the demo pushing
            them down the page. */}
        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14">
          {/* Copy column */}
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/15 bg-orange-400/[0.06] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.28em] text-orange-100/75">
              <Repeat className="h-3 w-3" />
              Find the leaks you keep repeating
            </span>

            {/* Headline — two explicit lines so the italic gradient phrase gets
                its own line box. Inline wrapping + tight leading + italic was
                clipping the glyphs of the gradient word. pb gives the descenders
                and clip box room. */}
            <h1 className="text-[3.25rem] font-black leading-[1.0] tracking-[-0.05em] text-white sm:text-6xl lg:text-[4.5rem]">
              <span className="block">Stop losing the</span>
              <span className="block bg-gradient-to-r from-amber-200 via-orange-300 to-red-400 bg-clip-text pb-2 italic text-transparent">
                same way twice.
              </span>
            </h1>

            {/* Subhead — one line, no paragraph */}
            <p className="max-w-xl text-lg leading-relaxed text-[#f0edf2]/90">
              FireChess scans your Lichess &amp; Chess.com games with Stockfish
              18, finds the mistakes you keep repeating, and turns each one into
              a position you can drill.
            </p>

            {/* Single primary CTA */}
            <button
              type="button"
              onClick={onScanClick}
              className="btn-cta-fire group inline-flex h-14 items-center justify-center gap-2 rounded-xl px-8 text-base font-semibold text-white"
            >
              Scan my games — free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Quiet secondary affordances — sample link, free-forever, trailer */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-[#8d8696] lg:justify-start">
              <button
                type="button"
                onClick={onSeeSampleClick}
                className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-white"
              >
                <PlayCircle className="h-4 w-4 text-orange-400" />
                See a sample report
              </button>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                Free forever · no credit card
              </span>
              <a
                href="https://www.youtube.com/watch?v=MpWsW10YE5M"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[#f0edf2]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch the 90-sec trailer
              </a>
              <a
                href={REDDIT_THREAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[#f0edf2]"
              >
                <Star className="h-3.5 w-3.5 text-amber-300" />
                Real feedback on r/chessbeginners
              </a>
            </div>
          </div>

          {/* Demo column — the restored multi-tab slideshow */}
          <div className="relative mx-auto w-full max-w-[40rem] lg:max-w-none">
            <div className="pointer-events-none absolute -inset-10 rounded-full bg-orange-500/[0.07] blur-3xl" />
            <div className="relative rounded-[2rem] bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent p-[1.5px] shadow-[0_0_90px_-20px_rgba(249,115,22,0.2),0_50px_120px_-56px_rgba(0,0,0,0.9)]">
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

        {/* ── Differentiators — what plain Lichess can't give you ──── */}
        <div className="relative mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 lg:mt-16">
          {[
            { icon: Repeat, label: "Repeated-leak detection" },
            { icon: Crosshair, label: "Drill mode on your own positions" },
            { icon: Target, label: "Tilt & clock analysis" },
          ].map((c) => (
            <span
              key={c.label}
              className="flex items-center gap-2 text-sm text-[#8d8696]"
            >
              <c.icon className="h-4 w-4 text-orange-300/70" />
              {c.label}
            </span>
          ))}
        </div>

        {/* ── Activity metrics row ─────────────────────────────────── */}
        {/*
          Only the cumulative, flattering numbers. The Pro/Lifetime member
          counts were removed deliberately: tiny counts read as "nobody buys
          this" (negative social proof) and hurt conversion more than they help.
          Re-add them once the numbers are large enough to be persuasive.
        */}
        <div className="relative mt-14 border-t border-[#1e1a24] pt-10 lg:mt-16">
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
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
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1 text-center"
              >
                <div className="flex items-center gap-2">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span
                    className={`text-3xl font-bold tabular-nums ${item.color}`}
                  >
                    {item.value != null ? item.value.toLocaleString() : "—"}
                  </span>
                </div>
                <p className="text-sm text-[#8d8696]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
