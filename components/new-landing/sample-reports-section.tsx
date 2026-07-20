"use client";

import { useEffect, useRef, useState } from "react";
import { SAMPLE_REPORTS, type SampleReport } from "@/lib/sample-reports";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";

export function SampleReportsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const featured = SAMPLE_REPORTS.slice(0, 6);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featured.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, featured.length]);

  const scrollTo = (index: number) => {
    setActiveIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const next = () => scrollTo((activeIndex + 1) % featured.length);
  const prev = () =>
    scrollTo((activeIndex - 1 + featured.length) % featured.length);

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-orange-500/[0.03] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-red-500/[0.02] blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="mb-4 inline-block rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
              Sample Reports
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              See what we found for{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                players like you
              </span>
            </h2>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-400 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-400 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {featured.map((report, index) => (
              <ReportCard
                key={report.username}
                report={report}
                isActive={index === activeIndex}
                onClick={() => scrollTo(index)}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div className="mt-8 flex justify-center gap-2">
            {featured.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-8 bg-orange-500"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* View all CTA */}
        <div className="mt-12 text-center">
          <a
            href="/reports"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:border-orange-500/30 hover:bg-orange-500/[0.05] hover:text-white"
          >
            View all sample reports
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}

function ReportCard({
  report,
  isActive,
  onClick,
}: {
  report: SampleReport;
  isActive: boolean;
  onClick: () => void;
}) {
  const tierColors = {
    elite: "from-amber-400/20 to-orange-500/10 border-amber-500/20",
    club: "from-sky-400/20 to-cyan-500/10 border-sky-500/20",
    beginner: "from-emerald-400/20 to-teal-500/10 border-emerald-500/20",
  };

  const tierBadgeColors = {
    elite: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    club: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    beginner: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-b p-6 transition-all duration-500 ${tierColors[report.tier]} ${
        isActive
          ? "scale-[1.02] shadow-2xl ring-1 ring-orange-500/30"
          : "opacity-70 hover:opacity-100"
      }`}
    >
      {/* Popular badge */}
      {report.username === "hikaru" && (
        <div className="absolute -right-8 top-4 rotate-45 bg-gradient-to-r from-orange-500 to-red-500 px-8 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/10 bg-slate-800">
              {report.imageUrl ? (
                <img
                  src={report.imageUrl}
                  alt={report.displayName || report.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-400">
                  {(report.displayName || report.username)[0].toUpperCase()}
                </div>
              )}
            </div>
            <div
              className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0c0f15] ${
                report.source === "lichess" ? "bg-orange-500" : "bg-blue-500"
              }`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {report.displayName || report.username}
            </h3>
            <p className="text-xs text-slate-400">{report.label}</p>
          </div>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${tierBadgeColors[report.tier]}`}
        >
          {report.tier}
        </span>
      </div>

      {/* Rating */}
      <div className="mb-4 flex items-center gap-2">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        <span className="text-2xl font-bold text-white">{report.rating}</span>
        <span className="text-sm text-slate-500">peak rating</span>
      </div>

      {/* Stats preview */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-white">
            {report.highlights.gamesScanned || "—"}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            Games
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-orange-400">
            {report.highlights.openingLeaks || "—"}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            Leaks
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3 text-center">
          <div className="text-lg font-bold text-red-400">
            {report.highlights.missedTactics || "—"}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            Missed
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
        <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
          View full report
        </span>
        <ArrowRight className="h-4 w-4 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-orange-400" />
      </div>

      {/* Hover glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-orange-500/[0.05] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}
