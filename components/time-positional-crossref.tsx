"use client";

import { useState } from "react";
import { Chessboard } from "@/components/chessboard-compat";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import type { TimePositionalReport, TimePositionalInsight } from "@/lib/time-positional-crossref";
import { generateLessonFromInsight } from "@/lib/generate-lesson";
import type { ReportLesson } from "@/lib/generate-lesson";
import { ReportLessonModal } from "@/components/report-lesson-modal";

const VERDICT_COLORS = {
  rushed: {
    accent: "amber",
    label: "Rushed",
    icon: "💨",
    cardBg: "border-amber-500/20 bg-amber-500/[0.04]",
    bar: "bg-amber-400",
    chip: "bg-amber-500/15 text-amber-400",
  },
  wasted: {
    accent: "red",
    label: "Overthinking",
    icon: "⏳",
    cardBg: "border-red-500/20 bg-red-500/[0.04]",
    bar: "bg-red-400",
    chip: "bg-red-500/15 text-red-400",
  },
} as const;

function InsightCard({ insight, onLearn }: { insight: TimePositionalInsight; onLearn?: () => void }) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const [expanded, setExpanded] = useState(false);
  const colors = VERDICT_COLORS[insight.timeVerdict];

  const pct = ((insight.overlapCount / insight.totalVerdictCount) * 100).toFixed(0);
  const cpPawns = (insight.avgCpLossOnMotif / 100).toFixed(1);

  return (
    <div className={`overflow-hidden rounded-2xl border ${colors.cardBg}`}>
      <div className={`h-[3px] w-full ${colors.bar} opacity-60`} style={{ width: `${Math.max(10, Number(pct))}%` }} />

      <div className="p-5 md:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-lg">
              {insight.motifIcon}
            </span>
            <div>
              <p className="text-sm font-bold text-white">{insight.motifName}</p>
              <p className="text-[11px] text-slate-400">
                x {insight.overlapCount} correlated moments
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${colors.chip}`}>
              {colors.icon} {colors.label}
            </span>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold text-slate-300">
              {pct}% overlap
            </span>
          </div>
        </div>

        {/* Insight text */}
        <p className="text-sm leading-relaxed text-slate-300">{insight.insight}</p>

        {/* Stats row */}
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span>~{insight.avgSecondsOnMotif.toFixed(1)}s avg per move</span>
          <span>·</span>
          <span>~{cpPawns} pawns lost each</span>
        </div>

        {onLearn && (
          <div className="mt-3">
            <button
              type="button"
              onClick={onLearn}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-violet-300 transition hover:border-violet-400/40 hover:bg-violet-500/[0.14] hover:text-violet-200"
            >
              📖 Learn this pattern
            </button>
          </div>
        )}

        {/* Expandable examples */}
        {insight.exampleFens.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-slate-200"
            >
              {expanded ? "Hide" : "Show"} example positions
              <svg
                className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expanded && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {insight.exampleFens.map((fen, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]"
                  >
                    <div className="p-2">
                      <Chessboard
                        id={`crossref-${insight.motifName}-${i}`}
                        position={fen}
                        boardWidth={180}
                        boardOrientation={fen.includes(" w ") ? "white" : "black"}
                        arePiecesDraggable={false}
                        customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                        customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                        customPieces={customPieces}
                        customBoardStyle={{ borderRadius: "8px", overflow: "hidden" }}
                      />
                    </div>
                    <p className="px-3 pb-3 text-[10px] text-slate-500">
                      Example {i + 1}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TimePositionalCrossRef({
  report,
}: {
  report: TimePositionalReport;
}) {
  const [lesson, setLesson] = useState<ReportLesson | null>(null);

  if (report.insights.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-emerald-500/[0.12] bg-emerald-500/[0.04] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/[0.15] text-xs text-emerald-400">✓</span>
          <span className="text-sm text-slate-300">{report.summary}</span>
        </div>
      </div>
    );
  }

  const rushedInsights = report.insights.filter((i) => i.timeVerdict === "rushed");
  const wastedInsights = report.insights.filter((i) => i.timeVerdict === "wasted");

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="rounded-2xl border border-transparent bg-gradient-to-r from-violet-500/[0.06] via-fuchsia-500/[0.04] to-amber-500/[0.04] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia-400/70">
              Time x Positional
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {report.summary}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>{report.totalOverlaps} overlaps found</span>
            {report.unmatchedCount > 0 && (
              <span className="text-slate-600">· {report.unmatchedCount} unmatched</span>
            )}
          </div>
        </div>
      </div>

      {/* Insights grid */}
      <div className="space-y-4">
        {rushedInsights.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-400">
                💨 Rushed moves &amp; positional habits
              </span>
              <span className="text-[10px] text-slate-600">
                Moving too fast in positions that needed a check
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {rushedInsights.map((insight) => (
                <InsightCard
                  key={`rushed-${insight.motifName}`}
                  insight={insight}
                  onLearn={() => setLesson(generateLessonFromInsight(insight))}
                />
              ))}
            </div>
          </div>
        )}

        {wastedInsights.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-400">
                ⏳ Overthinking &amp; positional habits
              </span>
              <span className="text-[10px] text-slate-600">
                Spending too long on decisions that pattern recognition should handle
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {wastedInsights.map((insight) => (
                <InsightCard
                  key={`wasted-${insight.motifName}`}
                  insight={insight}
                  onLearn={() => setLesson(generateLessonFromInsight(insight))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coaching takeaway */}
      <div className="rounded-[1.25rem] border border-fuchsia-500/15 bg-fuchsia-500/[0.04] p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-400/70">
          Coach takeaway
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {rushedInsights.length > 0 && wastedInsights.length > 0
            ? "You have both rushing and overthinking patterns tied to specific positional mistakes. Fix the rushing first — those are costing more per move. Once your fast decisions are cleaner, work on speeding up the routine positions you're overthinking."
            : rushedInsights.length > 0
              ? "Your main fix is speed discipline in specific positions. Run a quick blunder-check before commiting when you feel the urge to move fast. The pattern recognition will come with reps."
              : "Your main fix is trusting your instincts in routine positions. Save deep calculation for genuinely complex moments. Pattern drills on these motifs will make the right decision feel automatic."}
        </p>
      </div>

      <ReportLessonModal
        open={lesson !== null}
        lesson={lesson}
        onClose={() => setLesson(null)}
      />
    </div>
  );
}
