"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LayoutGrid, Route } from "lucide-react";
import type { ReportViewMode } from "@/components/guided-walk/report-view-toggle";

/* ────────────────────────────────────────────────────────────────────────
 * ReportEntryChoice
 *
 * A one-time prompt shown when you open an already-complete report. Asks how
 * you want to read it: a Guided tour (one card at a time) or the Full report.
 *
 * The choice is remembered per report (localStorage) so revisits don't nag —
 * the sticky Guided/Full toggle is always there to switch later.
 *
 * This only fires for reports that were already "ready" when the page opened;
 * fresh scans are handled by the scan-complete modal instead.
 * ──────────────────────────────────────────────────────────────────────── */

export function ReportEntryChoice({
  open,
  onChoose,
}: {
  open: boolean;
  onChoose: (mode: ReportViewMode) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  const options: {
    value: ReportViewMode;
    label: string;
    blurb: string;
    icon: React.ReactNode;
    accent: string;
    iconWrap: string;
  }[] = [
    {
      value: "guided",
      label: "Take the guided tour",
      blurb:
        "Walk through your biggest findings one card at a time — your top leak, a missed tactic, and a weekly plan.",
      icon: <Route className="h-5 w-5" />,
      accent:
        "border-emerald-400/40 bg-emerald-500/[0.08] hover:border-emerald-400/70 hover:bg-emerald-500/[0.14]",
      iconWrap: "bg-emerald-500/15 text-emerald-300",
    },
    {
      value: "full",
      label: "View the full report",
      blurb:
        "See every opening leak, tactic, endgame, and clock detail in one scrollable breakdown.",
      icon: <LayoutGrid className="h-5 w-5" />,
      accent:
        "border-cyan-400/40 bg-cyan-500/[0.08] hover:border-cyan-400/70 hover:bg-cyan-500/[0.14]",
      iconWrap: "bg-cyan-500/15 text-cyan-300",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Skip and open the full report"
        onClick={() => onChoose("full")}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg animate-fade-in-up rounded-[1.5rem] border border-white/[0.1] bg-slate-950/95 p-6 shadow-2xl shadow-black/50 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Your report is ready
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-[1.75rem]">
          How do you want to read it?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          You can switch between these any time from the bar at the top.
        </p>

        <div className="mt-5 grid gap-3">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChoose(option.value)}
              className={`group flex items-start gap-4 rounded-2xl border p-4 text-left transition ${option.accent}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${option.iconWrap}`}
              >
                {option.icon}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-white">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                  {option.blurb}
                </span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
