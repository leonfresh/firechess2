"use client";

import { useState } from "react";
import { getTodayTip, getTipByIndex, TIP_TYPE_LABELS, DAILY_TIPS } from "@/lib/daily-tips";

/**
 * DailyTipWidget — shows today's chess tip / quote / fact / pattern.
 * Rotates by day of year; users can also browse previous/next tips.
 */
export function DailyTipWidget() {
  const todayTip = getTodayTip();
  const [offset, setOffset] = useState(0);
  const tip = offset === 0 ? todayTip : getTipByIndex(todayTip.id - 1 + offset);
  const meta = TIP_TYPE_LABELS[tip.type] ?? TIP_TYPE_LABELS.tip;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.10]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <h3 className="text-sm font-bold text-white">Daily Chess {meta.label}</h3>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            tip.type === "quote" ? "border-blue-500/20 bg-blue-500/10 text-blue-400" :
            tip.type === "tip" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" :
            tip.type === "fact" ? "border-amber-500/20 bg-amber-500/10 text-amber-400" :
            "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-400"
          }`}>
            {tip.type}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="mt-3 min-h-[60px]">
        <p className={`text-sm leading-relaxed ${tip.type === "quote" ? "italic text-slate-300" : "text-slate-300"}`}>
          {tip.type === "quote" ? `"${tip.text}"` : tip.text}
        </p>
        {tip.author && (
          <p className="mt-1.5 text-xs text-slate-500">— {tip.author}</p>
        )}
        {tip.category && (
          <span className="mt-2 inline-block rounded bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-500">
            {tip.category}
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
          title="Previous tip"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Prev
        </button>
        <span className="text-[10px] text-slate-600">
          #{tip.id} of {DAILY_TIPS.length}
        </span>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
          title="Next tip"
        >
          Next
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
