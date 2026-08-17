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
  {
    ring: string;
    glow: string;
    accent: string;
    chip: string;
    label: string;
    dot: string;
  }
> = {
  critical: {
    ring: "border-red-500/30",
    glow: "bg-red-500/10",
    accent: "text-red-300",
    chip: "border-red-500/30 bg-red-500/10 text-red-300",
    label: "Critical",
    dot: "bg-red-400",
  },
  major: {
    ring: "border-[#ff5a1f]/25",
    glow: "bg-[#ff5a1f]/[0.08]",
    accent: "text-[#ff8c42]",
    chip: "border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] text-[#ff8c42]",
    label: "Major",
    dot: "bg-[#ff5a1f]",
  },
  moderate: {
    ring: "border-[#ff5a1f]/25",
    glow: "bg-[#ff5a1f]/[0.08]",
    accent: "text-[#ff8c42]",
    chip: "border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] text-[#ff8c42]",
    label: "Worth fixing",
    dot: "bg-[#ff5a1f]",
  },
  good: {
    ring: "border-emerald-500/30",
    glow: "bg-emerald-500/10",
    accent: "text-emerald-300",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    label: "Looking solid",
    dot: "bg-emerald-400",
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
      className={`relative mt-6 overflow-hidden rounded-[1.75rem] border ${s.ring} bg-[linear-gradient(180deg,_#121214_0%,_#0A0A0B_100%)] p-6 sm:p-8`}
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full ${s.glow} blur-[110px]`}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A8578]">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />
            Your biggest takeaway
          </p>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${s.chip}`}
          >
            {s.label}
          </span>
        </div>

        <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-[1.1] tracking-tight text-[#F4F1EA] sm:text-4xl">
          {t.headline}
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#B7B2A5] sm:text-base">
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
              <span className="text-[#8A8578]">→</span>
              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5 font-mono font-semibold text-emerald-300">
                {t.evidenceMove.best ?? "study it"}
              </span>
            </div>
          ) : null}
        </div>

        <div
          className={`mt-5 flex items-start gap-3 rounded-2xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-4 py-4`}
        >
          <span className={`mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
          <p className="text-sm leading-relaxed text-[#D8D3C6]">
            <span className={`font-semibold ${s.accent}`}>Fix this next: </span>
            {t.fix}
          </p>
        </div>
      </div>
    </section>
  );
}
