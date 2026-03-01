"use client";

import Link from "next/link";
import { useEffect } from "react";

import { LATEST_VERSION } from "@/lib/constants";
import { CHANGELOG } from "@/lib/changelog";
import type { ChangeType } from "@/lib/changelog";

/* ─── Helpers ─── */

const TYPE_STYLES: Record<ChangeType, { label: string; bg: string; text: string; border: string }> = {
  feature:     { label: "New",         bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  improvement: { label: "Improved",    bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/20" },
  fix:         { label: "Fix",         bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20" },
  design:      { label: "Design",      bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20" },
};

const TYPE_ICONS: Record<ChangeType, string> = {
  feature: "✨",
  improvement: "📈",
  fix: "🔧",
  design: "🎨",
};

/* ─── Page ─── */

export default function ChangelogPage() {
  // Mark as seen when user visits
  useEffect(() => {
    try {
      localStorage.setItem("firechess_changelog_seen", String(LATEST_VERSION));
    } catch {}
  }, []);

  const totalChanges = CHANGELOG.reduce((s, e) => s + e.changes.length, 0);

  return (
    <div className="min-h-screen bg-[#030712]">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-10 md:py-24">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 text-3xl shadow-lg">
            📋
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Dev Notes
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            What&apos;s new in FireChess — {CHANGELOG.length} update{CHANGELOG.length !== 1 ? "s" : ""}, {totalChanges} changes
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to FireChess
          </Link>
        </div>

        {/* Timeline */}
        <div className="relative space-y-8">
          {/* Vertical line */}
          <div className="pointer-events-none absolute left-[19px] top-2 bottom-2 hidden w-px bg-gradient-to-b from-fuchsia-500/30 via-cyan-500/20 to-transparent md:block" />

          {CHANGELOG.map((entry, ei) => (
            <div key={entry.version} className="relative">
              {/* Timeline dot (desktop) */}
              <div className="pointer-events-none absolute left-[12px] top-7 hidden h-4 w-4 rounded-full border-2 border-fuchsia-500/40 bg-[#030712] md:block">
                <div className="absolute inset-1 rounded-full bg-fuchsia-500/60" />
              </div>

              {/* Card */}
              <div
                className={`animate-fade-in-up overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent md:ml-10`}
                style={{ animationDelay: `${ei * 80}ms` }}
              >
                {/* Card header */}
                <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-4 md:px-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/15 text-lg">
                    {ei === 0 ? "🔥" : "📦"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-white">{entry.title}</h2>
                    <p className="text-xs text-slate-500">{entry.date} · v{entry.version}</p>
                  </div>
                  {ei === 0 && (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Latest
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="px-5 pt-4 md:px-6">
                  <p className="text-[13px] leading-relaxed text-slate-400">{entry.description}</p>
                </div>

                {/* Change items */}
                <div className="space-y-2 px-5 pb-5 pt-4 md:px-6">
                  {entry.changes.map((change, ci) => {
                    const style = TYPE_STYLES[change.type];
                    const icon = TYPE_ICONS[change.type];
                    return (
                      <div
                        key={ci}
                        className={`flex gap-3 rounded-xl border ${style.border} bg-gradient-to-r from-white/[0.02] to-transparent p-3 transition-all hover:from-white/[0.04]`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.bg} text-sm`}>
                          {icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center gap-2">
                            <span className={`rounded-md ${style.bg} px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                              {style.label}
                            </span>
                          </div>
                          <p className="text-[12px] leading-relaxed text-slate-300">{change.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs text-slate-600">
            More updates coming soon — follow{" "}
            <a
              href="https://x.com/firechess"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 underline decoration-slate-700 transition-colors hover:text-white"
            >
              @firechess
            </a>{" "}
            for announcements
          </p>
        </div>
      </div>
    </div>
  );
}
