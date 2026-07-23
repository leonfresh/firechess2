"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Crosshair,
  Flame,
  Repeat,
  Search,
  Target,
  Zap,
} from "lucide-react";
import { HeroProductAnimation } from "./hero-product-animation";

export type SiteStats = {
  totalUsers: number;
  activeUsers30d: number;
  totalReports: number;
  proMembers: number;
  lifetimeMembers: number;
} | null;

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

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:px-8">
      {/* Ambient background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/[0.03] blur-[150px]" />
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-red-500/[0.02] blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/[0.02] blur-[100px]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy column */}
          <div
            className={`flex flex-col items-center text-center transition-all duration-700 lg:items-start lg:text-left ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-4 py-1.5 backdrop-blur-sm">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-orange-200/80">
                Stockfish 18 Powered
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="block">Your chess has</span>
              <span className="block bg-gradient-to-r from-amber-200 via-orange-300 to-red-400 bg-clip-text text-transparent">
                patterns.
              </span>
              <span className="block">Find them.</span>
            </h1>

            {/* Subhead */}
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-slate-400 sm:text-xl">
              FireChess scans your Lichess & Chess.com games to find the
              mistakes you keep repeating — then turns each one into a drill
              you can actually fix.
            </p>

            {/* CTA group */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={onScanClick}
                className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-8 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Scan my games — free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>

              <button
                onClick={onSeeSampleClick}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-8 text-base font-medium text-slate-300 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                <Search className="h-4 w-4" />
                See sample reports
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 lg:justify-start">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                  <Zap className="h-3 w-3 text-emerald-400" />
                </div>
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20">
                  <Target className="h-3 w-3 text-orange-400" />
                </div>
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20">
                  <Crosshair className="h-3 w-3 text-amber-400" />
                </div>
                <span>Stockfish 18</span>
              </div>
            </div>

            {/* Stats */}
            {siteStats && (
              <div className="mt-10 flex items-center gap-8 border-t border-white/[0.06] pt-8">
                <div>
                  <div className="text-2xl font-bold text-white sm:text-3xl">
                    {siteStats.totalReports.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">Reports generated</div>
                </div>
                <div className="h-12 w-px bg-white/[0.06]" />
                <div>
                  <div className="text-2xl font-bold text-white sm:text-3xl">
                    {siteStats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">Players improved</div>
                </div>
                <div className="h-12 w-px bg-white/[0.06]" />
                <div>
                  <div className="text-2xl font-bold text-white sm:text-3xl">
                    {siteStats.lifetimeMembers.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">Lifetime members</div>
                </div>
              </div>
            )}
          </div>

          {/* Visual column — animated product demo */}
          <div
            className={`relative transition-all delay-200 duration-700 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="relative mx-auto max-w-[520px]">
              {/* Glow effect */}
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-orange-500/15 to-red-500/15 opacity-40 blur-3xl" />

              {/* Product animation */}
              <HeroProductAnimation />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 4s ease-in-out 2s infinite;
        }
      `}</style>
    </section>
  );
}
