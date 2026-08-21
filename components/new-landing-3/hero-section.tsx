"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Play } from "lucide-react";
import { HeroBoard } from "./hero-board";
import type { SiteStats } from "./types";

export function Nl3Hero({
  siteStats,
  onScanClick,
  onSeeSampleClick,
}: {
  siteStats: SiteStats;
  onScanClick: () => void;
  onSeeSampleClick: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const games = siteStats?.totalReports
    ? `${(siteStats.totalReports * 300).toLocaleString()}+`
    : "128,400+";
  const players = siteStats?.activeUsers30d
    ? siteStats.activeUsers30d.toLocaleString()
    : "6,200";

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 sm:pt-40 lg:px-8">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#ff5a1f]/[0.05] blur-[150px]" />
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-red-500/[0.03] blur-[120px]" />
      </div>
      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_90%_60%_at_50%_30%,black,transparent)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Copy */}
        <div
          className={`flex flex-col items-center text-center transition-all duration-700 lg:items-start lg:text-left ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-4 py-1.5">
            <span className="nl3-pulse-dot h-1.5 w-1.5 rounded-full bg-[#ff5a1f] shadow-[0_0_8px_#ff5a1f]" />
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#ff8c42]">
              Stockfish 18 · Deep pattern analysis
            </span>
          </div>

          <h1 className="mb-6 text-[42px] font-extrabold leading-[1.02] tracking-[-0.035em] text-white sm:text-6xl lg:text-[72px]">
            Your mistakes
            <br />
            repeat.{" "}
            <span className="font-serif italic tracking-[-0.02em] text-[#ff5a1f] [text-shadow:0_0_40px_rgba(255,90,31,0.35)]">
              We find
            </span>
            <br />
            them first.
          </h1>

          <p className="mb-9 max-w-lg text-lg leading-relaxed text-[#8d8696]">
            FireChess scans your Lichess & Chess.com games and isolates the{" "}
            <strong className="font-semibold text-white">recurring leaks</strong>{" "}
            costing you rating — then drills each one until it disappears from
            your games.
          </p>

          <div className="mb-11 flex flex-col gap-3.5 sm:flex-row">
            <button
              onClick={onScanClick}
              className="nl3-cta nl3-cta-glow inline-flex h-14 items-center justify-center gap-2.5 rounded-[13px] bg-[#ff5a1f] px-8 text-[15.5px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            >
              Scan my games — free
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onSeeSampleClick}
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-[13px] border border-[#1e1a24] bg-transparent px-7 text-[15px] font-medium text-[#8d8696] transition-all duration-200 hover:border-[#ff5a1f]/30 hover:bg-[#ff5a1f]/[0.08] hover:text-white"
            >
              <Play className="h-4 w-4" />
              Watch a live report
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-start">
            {["Free forever", "No credit card", "300 games in ~2 min", "Stockfish 18"].map(
              (t) => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 text-[13px] text-[#565061]"
                >
                  <Check className="h-3.5 w-3.5 text-[#ff5a1f]" strokeWidth={3} />
                  {t}
                </span>
              ),
            )}
            <a
              href="https://www.youtube.com/watch?v=MpWsW10YE5M"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] text-[#565061] transition-colors hover:text-[#f0edf2]"
            >
              <Play className="h-3 w-3 text-[#ff5a1f]" fill="currentColor" />
              Watch the 90-sec trailer
            </a>
          </div>
        </div>

        {/* Product card */}
        <div
          className={`relative transition-all delay-200 duration-700 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="overflow-hidden rounded-[20px] border border-[#1e1a24] bg-[#121015] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.02)]">
            {/* Chrome bar */}
            <div className="flex items-center gap-2.5 border-b border-[#1e1a24] bg-[#0d0b0e] px-4 py-3">
              <div className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
              <div className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
              <div className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
              <div className="ml-1.5 flex-1 rounded-lg bg-[#070608] px-3.5 py-1.5 font-mono text-xs text-[#565061]">
                firechess.com/report/4aa8…eadf2
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-[#28c840]/25 bg-[#28c840]/10 px-2.5 py-1 sm:flex">
                <span className="nl3-pulse-dot h-1.5 w-1.5 rounded-full bg-[#3ddc5e]" />
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#3ddc5e]">
                  Live
                </span>
              </div>
            </div>

            {/* Board stage */}
            <div className="relative grid place-items-center bg-[#070608] px-6 py-7">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:22px_22px]" />
              <HeroBoard />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 border-t border-[#1e1a24]">
              {[
                { n: "300", l: "Games scanned", orange: false },
                { n: "7", l: "Opening leaks", orange: true },
                { n: "41", l: "Missed tactics", orange: true },
              ].map((m, i) => (
                <div
                  key={m.l}
                  className={`py-4 text-center ${i > 0 ? "border-l border-[#1e1a24]" : ""}`}
                >
                  <div
                    className={`text-[22px] font-bold tracking-[-0.02em] ${
                      m.orange ? "text-[#ff5a1f]" : "text-white"
                    }`}
                  >
                    {m.n}
                  </div>
                  <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.1em] text-[#565061]">
                    {m.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="relative mx-auto mt-16 max-w-7xl overflow-hidden border-y border-[#1e1a24] bg-[#0d0b0e] py-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="nl3-ticker flex w-max gap-14">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex gap-14" aria-hidden={dup === 1}>
              {[
                { s: games, t: "games analyzed" },
                { s: players, t: "players scanning this month" },
                { s: "+127", t: "avg rating gain after fixing top 3 leaks" },
                { s: "Stockfish 18", t: "depth 22 analysis" },
                { s: "91%", t: "find a leak they never noticed" },
              ].map((x) => (
                <span
                  key={x.t}
                  className="flex items-center gap-2.5 whitespace-nowrap text-[13.5px] text-[#8d8696]"
                >
                  <strong className="text-[15px] font-semibold text-white">{x.s}</strong>
                  {x.t}
                  <span className="ml-10 text-[9px] text-[#ff5a1f]">◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
