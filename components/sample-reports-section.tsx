"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  SAMPLE_REPORTS,
  TIER_META,
  type SampleReportTier,
} from "@/lib/sample-reports";

const TIERS: SampleReportTier[] = ["elite", "club", "beginner"];

function RatingPip({ rating }: { rating: number }) {
  const filled =
    rating >= 2700
      ? 5
      : rating >= 2000
        ? 4
        : rating >= 1500
          ? 3
          : rating >= 1200
            ? 2
            : 1;
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1 w-3.5 rounded-full ${i <= filled ? "bg-orange-400/80" : "bg-white/[0.10]"}`}
        />
      ))}
    </span>
  );
}

function PlatformBadge({ source }: { source: "chess.com" | "lichess" }) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest ${
        source === "chess.com"
          ? "bg-emerald-500/[0.12] text-emerald-300/80"
          : "bg-sky-500/[0.12] text-sky-300/80"
      }`}
    >
      {source === "chess.com" ? "Chess.com" : "Lichess"}
    </span>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-base font-bold tabular-nums text-white">
        {value}
      </span>
      <span className="text-[10px] leading-none text-slate-500">{label}</span>
    </div>
  );
}

function SampleReportCard({
  report,
}: {
  report: (typeof SAMPLE_REPORTS)[number];
}) {
  const hasReport = Boolean(report.reportId);
  const hasHighlights = Object.keys(report.highlights).some(
    (k) => report.highlights[k as keyof typeof report.highlights] !== undefined,
  );

  const avatarInitial = (report.displayName ?? report.username)
    .charAt(0)
    .toUpperCase();

  const cardInner = (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 ${
        hasReport
          ? "cursor-pointer hover:border-orange-400/20 hover:bg-white/[0.04] hover:shadow-[0_16px_48px_-20px_rgba(249,115,22,0.16)]"
          : "opacity-60"
      }`}
    >
      {/* Subtle glow on hover */}
      {hasReport && (
        <div className="pointer-events-none absolute inset-0 rounded-[1.4rem] bg-gradient-to-br from-orange-400/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}

      {/* Header: avatar + name */}
      <div className="relative flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {report.imageUrl ? (
            <div className="h-11 w-11 overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image
                src={report.imageUrl}
                alt={report.displayName ?? report.username}
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400/30 to-red-500/20 text-base font-bold text-white shadow-inner">
              {avatarInitial}
            </div>
          )}
          {/* Platform dot */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full text-[6px] font-bold ${
              report.source === "chess.com"
                ? "bg-emerald-500/90 text-emerald-950"
                : "bg-sky-500/90 text-sky-950"
            }`}
          >
            {report.source === "chess.com" ? "C" : "L"}
          </span>
        </div>

        {/* Name + label */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">
            {report.displayName ?? report.username}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-400">
            {report.label}
          </p>
        </div>

        {/* Rating badge */}
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold tabular-nums text-white/80">
            {report.rating.toLocaleString()}
          </p>
          <RatingPip rating={report.rating} />
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-white/[0.06]" />

      {/* Stats or coming-soon */}
      <div className="flex-1">
        {hasReport && hasHighlights ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            {report.highlights.openingLeaks !== undefined && (
              <StatPill
                value={report.highlights.openingLeaks}
                label="Opening leaks"
              />
            )}
            {report.highlights.missedTactics !== undefined && (
              <StatPill
                value={report.highlights.missedTactics}
                label="Missed tactics"
              />
            )}
            {report.highlights.endgameMistakes !== undefined && (
              <StatPill
                value={report.highlights.endgameMistakes}
                label="Endgame slips"
              />
            )}
            {report.highlights.gamesScanned !== undefined && (
              <div className="col-span-3 mt-1 text-center text-[10px] text-slate-500">
                {report.highlights.gamesScanned.toLocaleString()} games scanned
              </div>
            )}
          </div>
        ) : hasReport ? (
          <p className="text-center text-xs text-slate-500 italic">
            Full report available →
          </p>
        ) : (
          <p className="text-center text-xs text-slate-600 italic">
            Report coming soon
          </p>
        )}
      </div>

      {/* CTA */}
      {hasReport && (
        <div className="mt-4 flex items-center justify-between">
          <PlatformBadge source={report.source} />
          <span className="flex items-center gap-1 text-xs font-semibold text-orange-300/80 transition-colors group-hover:text-orange-300">
            View report
            <svg
              className="h-3 w-3 translate-x-0 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>
        </div>
      )}
    </div>
  );

  if (!hasReport) return cardInner;

  return (
    <Link href={`/report/${report.reportId}`} className="block h-full">
      {cardInner}
    </Link>
  );
}

export function SampleReportsSection() {
  const [activeTier, setActiveTier] = useState<SampleReportTier | "all">("all");

  const visible =
    activeTier === "all"
      ? SAMPLE_REPORTS
      : SAMPLE_REPORTS.filter((r) => r.tier === activeTier);

  // Only render section at all if there is at least one ready OR coming-soon report
  if (SAMPLE_REPORTS.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.05] bg-white/[0.015] px-5 py-8 sm:px-8 sm:py-10">
      {/* Background glow */}
      <div className="pointer-events-none absolute right-[-10%] top-[-15%] h-64 w-64 rounded-full bg-orange-400/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-5%] h-48 w-48 rounded-full bg-amber-500/[0.04] blur-3xl" />

      {/* Section header */}
      <div className="relative mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-orange-400/[0.07] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.32em] text-orange-100/60">
            Sample Reports
          </span>
          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
            See what FireChess finds at every level
          </h2>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-slate-400">
            Real scans from recognizable players — from world champions to
            beginners. Every level has patterns worth fixing.
          </p>
        </div>

        {/* Tier filter pills */}
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            onClick={() => setActiveTier("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              activeTier === "all"
                ? "bg-orange-400/15 text-orange-200 ring-1 ring-orange-400/30"
                : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
            }`}
          >
            All
          </button>
          {TIERS.map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
                activeTier === tier
                  ? `bg-orange-400/15 text-orange-200 ring-1 ring-orange-400/30`
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
              }`}
            >
              {TIER_META[tier].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tier strips */}
      {activeTier === "all" ? (
        <div className="relative space-y-8">
          {TIERS.map((tier) => {
            const reports = SAMPLE_REPORTS.filter((r) => r.tier === tier);
            if (reports.length === 0) return null;
            const meta = TIER_META[tier];
            return (
              <div key={tier}>
                {/* Tier label */}
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`h-px flex-1 bg-gradient-to-r ${meta.color}`}
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-[0.18em] ${meta.accent}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      — {meta.description}
                    </span>
                  </div>
                  <div
                    className={`h-px flex-1 bg-gradient-to-l ${meta.color}`}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {reports.map((r) => (
                    <SampleReportCard key={r.username} report={r} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <SampleReportCard key={r.username} report={r} />
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <div className="relative mt-8 border-t border-white/[0.06] pt-6 text-center">
        <p className="text-sm text-slate-400">Want to see your own patterns?</p>
        <button
          type="button"
          onClick={() =>
            document.getElementById("analyzer")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-orange-400/[0.08] px-5 py-2.5 text-sm font-semibold text-orange-200 transition-colors hover:bg-orange-400/[0.14] hover:text-orange-100"
        >
          Scan your games free
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
