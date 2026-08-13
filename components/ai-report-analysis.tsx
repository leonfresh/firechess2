"use client";

import { Brain, Sparkles, Lightbulb, Swords, Target, Zap } from "lucide-react";
import type { AnalysisResult } from "@/lib/use-report-analysis";

const BADGE_TIER_STYLES: Record<string, string> = {
  positive: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  neutral: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  negative: "bg-red-500/10 text-red-300 border-red-500/20",
};

export function AiReportAnalysis({ analysis, loading }: { analysis: AnalysisResult | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-[1.75rem] border border-sky-500/15 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.06),rgba(15,23,42,0.5)_50%,rgba(2,6,23,0.9)_100%)] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 animate-pulse text-sky-400" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-[#ff5a1f]/10" />
            <div className="h-3 w-72 animate-pulse rounded bg-[#ff5a1f]/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="rounded-[1.75rem] border border-sky-500/15 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.06),rgba(15,23,42,0.5)_50%,rgba(2,6,23,0.9)_100%)] p-6 sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20">
            <Brain className="h-6 w-6 text-sky-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">AI Coach Analysis</p>
              <span className="rounded-full bg-gradient-to-r from-sky-500/20 to-violet-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-300">
                <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />AI
              </span>
            </div>
            <p className="text-xs text-[#8d8696]">Generated from your scan data</p>
          </div>
        </div>
      </div>

      {analysis.badges.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {analysis.badges.map((badge, i) => (
            <span
              key={i}
              className={`group relative rounded-full border px-2.5 py-1 text-[10px] font-semibold ${BADGE_TIER_STYLES[badge.tier] || BADGE_TIER_STYLES.neutral}`}
              title={badge.explanation}
            >
              {badge.label}
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[9px] text-[#f0edf2] opacity-0 shadow transition-opacity group-hover:opacity-100">
                {badge.explanation}
              </span>
            </span>
          ))}
        </div>
      )}

      <p className="mb-5 text-base font-semibold leading-relaxed text-sky-100">
        &ldquo;{analysis.verdict}&rdquo;
      </p>

      {analysis.coachNote && (
        <div className="mb-6 rounded-xl border border-[#1e1a24] bg-black/30 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-semibold text-white">Coach&apos;s Note</p>
          </div>
          <p className="text-sm leading-relaxed text-[#f0edf2]">{analysis.coachNote}</p>
        </div>
      )}

      {(analysis.strengths.length > 0 || analysis.weaknesses.length > 0) && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          {analysis.strengths.length > 0 && (
            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-emerald-400" />
                <p className="text-xs font-bold text-emerald-300">Strengths</p>
              </div>
              <ul className="space-y-1.5">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#f0edf2]">
                    <span className="mt-0.5 text-emerald-400">+</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.weaknesses.length > 0 && (
            <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Swords className="h-4 w-4 text-red-400" />
                <p className="text-xs font-bold text-red-300">Growth Areas</p>
              </div>
              <ul className="space-y-1.5">
                {analysis.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#f0edf2]">
                    <span className="mt-0.5 text-red-400">−</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {analysis.nextSteps.length > 0 && (
        <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-bold text-amber-300">Next Steps</p>
          </div>
          <ol className="space-y-1.5">
            {analysis.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#f0edf2]">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[9px] font-bold text-amber-400">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
