"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  OPENING_GUIDES,
  OPENING_CATEGORIES,
  type OpeningGuide,
} from "@/lib/opening-guides";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  advanced: "bg-red-500/15 text-red-400 border-red-500/20",
};

function DifficultyBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${DIFFICULTY_COLORS[level] ?? "bg-white/10 text-white"}`}
    >
      {level}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Position Card (mini board placeholder with FEN label)               */
/* ------------------------------------------------------------------ */

function PositionCard({ fen, label, note }: { fen: string; label: string; note: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-xs font-bold text-white">{label}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{note}</p>
      <p className="mt-2 select-all rounded bg-black/30 px-2 py-1 font-mono text-[10px] text-slate-500 break-all">
        {fen}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Guide Accordion Card                                                */
/* ------------------------------------------------------------------ */

function GuideCard({ guide }: { guide: OpeningGuide }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-white/[0.10]">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-start gap-4 p-5 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-white">{guide.name}</h3>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
              {guide.eco}
            </span>
            <DifficultyBadge level={guide.difficulty} />
          </div>
          <p className="mt-1 text-sm text-slate-400">{guide.tagline}</p>
          <p className="mt-2 font-mono text-xs text-emerald-400/80">{guide.moves}</p>
        </div>
        <svg
          className={`mt-1.5 h-5 w-5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-5">
          {/* Key Ideas */}
          <Section title="💡 Key Ideas">
            <ul className="space-y-1">
              {guide.keyIdeas.map((idea, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {idea}
                </li>
              ))}
            </ul>
          </Section>

          {/* Plans */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="⬜ Plans for White">
              <ul className="space-y-1">
                {guide.whitePlans.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                    {p}
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="⬛ Plans for Black">
              <ul className="space-y-1">
                {guide.blackPlans.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                    {p}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* Traps */}
          {guide.traps.length > 0 && (
            <Section title="⚠️ Common Traps">
              <div className="space-y-2">
                {guide.traps.map((t, i) => (
                  <div key={i} className="rounded-xl border border-red-500/10 bg-red-500/[0.04] p-3">
                    <p className="text-sm font-semibold text-red-400">{t.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{t.description}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Critical Positions */}
          {guide.positions.length > 0 && (
            <Section title="📌 Critical Positions">
              <div className="grid gap-3 sm:grid-cols-2">
                {guide.positions.map((pos, i) => (
                  <PositionCard key={i} {...pos} />
                ))}
              </div>
            </Section>
          )}

          {/* Famous Players */}
          {guide.players.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Famous Practitioners
              </p>
              <div className="flex flex-wrap gap-1.5">
                {guide.players.map((p, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-xs text-slate-400"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function OpeningsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let guides = OPENING_GUIDES;
    if (activeCategory) {
      guides = guides.filter((g) => g.category === activeCategory);
    }
    if (difficultyFilter) {
      guides = guides.filter((g) => g.difficulty === difficultyFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      guides = guides.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.eco.toLowerCase().includes(q) ||
          g.tagline.toLowerCase().includes(q) ||
          g.moves.toLowerCase().includes(q)
      );
    }
    return guides;
  }, [activeCategory, difficultyFilter, search]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">
          Opening Cheat Sheets
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {OPENING_GUIDES.length} curated guides covering key ideas, plans for both sides, common
          traps, and critical positions.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === null
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/[0.15]"
            }`}
          >
            All ({OPENING_GUIDES.length})
          </button>
          {OPENING_CATEGORIES.map((cat) => {
            const count = OPENING_GUIDES.filter((g) => g.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                    : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/[0.15]"
                }`}
              >
                {cat.icon} {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search + difficulty */}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search openings…"
            className="flex-1 min-w-[200px] rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-emerald-500/40"
          />
          <div className="flex gap-1">
            {(["beginner", "intermediate", "advanced"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  difficultyFilter === d
                    ? DIFFICULTY_COLORS[d]
                    : "border-white/[0.08] bg-white/[0.03] text-slate-500 hover:text-slate-300"
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guide List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
            <p className="text-sm text-slate-500">No openings match your filters.</p>
          </div>
        )}
        {filtered.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-slate-500">
        These guides give you a quick overview — for deeper study, analyze your own games on the{" "}
        <Link href="/analyze" className="text-emerald-400 hover:underline">
          Analyze
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
