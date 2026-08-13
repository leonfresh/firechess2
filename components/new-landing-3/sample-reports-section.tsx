"use client";

import Link from "next/link";
import { SAMPLE_REPORTS, TIER_META } from "@/lib/sample-reports";

/** Per-player one-line insight shown on hover. */
const INSIGHTS: Record<string, string> = {
  hikaru: "Speed demon bleeds in the endgame",
  MagnusCarlsen: "Even the GOAT leaks — one opening, consistently",
  GothamChess: "135 missed tactics — but only 4 motifs",
  AlexandraBotez: "Endgames leak hardest under time pressure",
  supersecret12345: "8 opening leaks across just 3 openings",
  EricRosen: "341 endgame slips — conversion is the fix",
  BIG_TONKA_T: "15 opening leaks — classic improving-player pattern",
  XQCow1: "Fast improvement once the top 3 were drilled",
  turbofisto: "298 missed tactics — almost all one motif",
};

const AVATAR_FALLBACK =
  "linear-gradient(135deg,#ff5a1f,#c23a10)";

export function Nl3SampleReports() {
  return (
    <div id="sample-reports" className="border-y border-[#1e1a24] bg-[#0d0b0e]">
      <section className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto mb-16 max-w-[640px] text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-3.5 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ff8c42]">
              Real scans, real players
            </span>
          </div>
          <h2 className="mb-4 text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
            See what a report looks like.
          </h2>
          <p className="text-[16.5px] leading-relaxed text-[#8d8696]">
            These are live FireChess reports. Click any card to open the full
            interactive breakdown — openings, tactics, endgames, time
            management, AI coach.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_REPORTS.map((r) => {
            const name = r.displayName ?? r.username;
            const initials = name
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <Link
                key={r.reportId}
                href={`/report/${r.reportId}`}
                className="nl3-sheen group relative rounded-[18px] border border-[#1e1a24] bg-[#121015] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#ff5a1f]/25"
              >
                {r.username === "MagnusCarlsen" && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-[#ff5a1f] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_4px_14px_rgba(255,90,31,0.4)]">
                    Most viewed
                  </span>
                )}
                <div className="mb-4 flex items-center gap-3.5">
                  {r.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.imageUrl}
                      alt={name}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-white"
                      style={{ background: AVATAR_FALLBACK }}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="truncate text-base font-semibold tracking-[-0.01em] text-white">
                      {name}
                    </h4>
                    <div className="mt-0.5 truncate text-xs text-[#565061]">
                      {r.label} · {r.rating}
                    </div>
                  </div>
                  <span className="ml-auto text-[11px] text-[#565061] transition-colors group-hover:text-[#ff8c42]">
                    ↗
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-[10px] border border-[#1e1a24] bg-[#070608] px-2 py-2.5 text-center">
                    <div className="text-[17px] font-bold tracking-[-0.02em] text-[#ff5a1f]">
                      {r.highlights.openingLeaks ?? "—"}
                    </div>
                    <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.08em] text-[#565061]">
                      Opening leaks
                    </div>
                  </div>
                  <div className="rounded-[10px] border border-[#1e1a24] bg-[#070608] px-2 py-2.5 text-center">
                    <div className="text-[17px] font-bold tracking-[-0.02em] text-[#f87171]">
                      {r.highlights.missedTactics ?? "—"}
                    </div>
                    <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.08em] text-[#565061]">
                      Missed tactics
                    </div>
                  </div>
                  <div className="rounded-[10px] border border-[#1e1a24] bg-[#070608] px-2 py-2.5 text-center">
                    <div className="text-[17px] font-bold tracking-[-0.02em] text-[#fbbf24]">
                      {r.highlights.endgameMistakes ?? "—"}
                    </div>
                    <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.08em] text-[#565061]">
                      Endgame slips
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 translate-y-1 text-[12.5px] text-[#ff8c42] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {INSIGHTS[r.username] ?? TIER_META[r.tier].description} →
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
