/**
 * BiggestTakeawayCard — the hero verdict pinned at the top of /report.
 * Distills the whole scan into one prioritized, actionable insight.
 */

import type { AnalyzeResponse } from "@/lib/types";
import {
  computeBiggestTakeaway,
  type BiggestTakeaway,
} from "@/lib/biggest-takeaway";

const STYLES: Record<
  BiggestTakeaway["severity"],
  { ring: string; glow: string; accent: string; chip: string; label: string }
> = {
  critical: {
    ring: "border-red-500/30",
    glow: "bg-red-500/10",
    accent: "text-red-300",
    chip: "border-red-500/30 bg-red-500/10 text-red-300",
    label: "Critical",
  },
  major: {
    ring: "border-amber-500/30",
    glow: "bg-amber-500/10",
    accent: "text-amber-300",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    label: "Major",
  },
  moderate: {
    ring: "border-cyan-500/30",
    glow: "bg-cyan-500/10",
    accent: "text-cyan-300",
    chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    label: "Worth fixing",
  },
  good: {
    ring: "border-emerald-500/30",
    glow: "bg-emerald-500/10",
    accent: "text-emerald-300",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    label: "Looking solid",
  },
};

export function BiggestTakeawayCard({
  result,
}: {
  result: AnalyzeResponse | null | undefined;
}) {
  const t = computeBiggestTakeaway(result);
  if (!t) return null;
  const s = STYLES[t.severity];

  return (
    <section
      className={`relative mt-6 overflow-hidden rounded-[1.75rem] border ${s.ring} bg-white/[0.03] p-6 sm:p-7`}
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full ${s.glow} blur-[100px]`}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            🎯 Your biggest takeaway
          </p>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${s.chip}`}
          >
            {s.label}
          </span>
        </div>

        <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
          {t.headline}
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
          {t.detail}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {t.stat ? (
            <span
              className={`rounded-xl border px-3.5 py-2 text-sm font-bold ${s.chip}`}
            >
              {t.stat}
            </span>
          ) : null}
          {t.evidenceMove ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-1.5 font-mono font-semibold text-red-300 line-through">
                {t.evidenceMove.user}
              </span>
              <span className="text-slate-500">→</span>
              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5 font-mono font-semibold text-emerald-300">
                {t.evidenceMove.best ?? "study it"}
              </span>
            </div>
          ) : null}
        </div>

        <div
          className={`mt-5 flex items-start gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5`}
        >
          <span className="text-lg leading-none">💡</span>
          <p className="text-sm leading-relaxed text-slate-200">
            <span className={`font-semibold ${s.accent}`}>Fix this next: </span>
            {t.fix}
          </p>
        </div>
      </div>
    </section>
  );
}
