"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
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
/*  Line Player — animated board that plays through the opening         */
/* ------------------------------------------------------------------ */

/** Parse a move string like "1.e4 e5 2.Nf3 Nc6 3.Bc4" → ["e4","e5","Nf3","Nc6","Bc4"] */
function parseSanMoves(raw: string): string[] {
  return raw
    .replace(/\d+\./g, "") // strip move numbers
    .replace(/\.\.\./g, "") // strip ellipses
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function LinePlayer({ moves: rawMoves }: { moves: string }) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();

  const sans = useMemo(() => parseSanMoves(rawMoves), [rawMoves]);

  /* Build all FENs from start through each move */
  const fens = useMemo(() => {
    const g = new Chess();
    const arr = [g.fen()];
    for (const san of sans) {
      try {
        g.move(san);
        arr.push(g.fen());
      } catch {
        break;
      }
    }
    return arr;
  }, [sans]);

  const maxIndex = fens.length - 1;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when the component remounts / rawMoves changes
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [rawMoves]);

  // Auto-play interval
  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setIndex((prev) => {
          if (prev >= maxIndex) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, maxIndex]);

  const goBack = useCallback(() => {
    setPlaying(false);
    setIndex((p) => Math.max(0, p - 1));
  }, []);
  const goForward = useCallback(() => {
    setPlaying(false);
    setIndex((p) => Math.min(maxIndex, p));
  }, [maxIndex]);
  const goForwardStep = useCallback(() => {
    setPlaying(false);
    setIndex((p) => Math.min(maxIndex, p + 1));
  }, [maxIndex]);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);
  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      // if at end, restart
      if (!p) setIndex((i) => (i >= maxIndex ? 0 : i));
      return !p;
    });
  }, [maxIndex]);

  /* Move label under the board */
  const moveLabel = useMemo(() => {
    if (index === 0) return "Starting position";
    const moveNum = Math.ceil(index / 2);
    const isBlack = index % 2 === 0;
    return `${moveNum}${isBlack ? "..." : "."} ${sans[index - 1]}`;
  }, [index, sans]);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Board */}
      <div className="w-full max-w-[340px] rounded-xl overflow-hidden">
        <Chessboard
          id={`opening-${rawMoves.slice(0, 20)}`}
          position={fens[index]}
          arePiecesDraggable={false}
          animationDuration={300}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          customPieces={customPieces}
        />
      </div>

      {/* Move label */}
      <p className="text-xs font-mono text-slate-400">{moveLabel}</p>

      {/* Transport controls */}
      <div className="flex items-center gap-1">
        {/* Reset */}
        <button
          type="button"
          onClick={reset}
          disabled={index === 0 && !playing}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          title="Reset"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        </button>
        {/* Step back */}
        <button
          type="button"
          onClick={goBack}
          disabled={index === 0}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          title="Back"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {/* Play / Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-emerald-400 transition-colors hover:bg-emerald-500/25"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        {/* Step forward */}
        <button
          type="button"
          onClick={goForwardStep}
          disabled={index >= maxIndex}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          title="Forward"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {/* End */}
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setIndex(maxIndex);
          }}
          disabled={index >= maxIndex}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          title="Go to end"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M13 5l7 7-7 7M6 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 flex-wrap justify-center">
        {fens.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setPlaying(false);
              setIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-4 bg-emerald-400"
                : i < index
                  ? "w-1.5 bg-emerald-400/40"
                  : "w-1.5 bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Position Card (mini board with label)                               */
/* ------------------------------------------------------------------ */

function PositionCard({
  fen,
  label,
  note,
}: {
  fen: string;
  label: string;
  note: string;
}) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-xs font-bold text-white mb-2">{label}</p>
      <div className="w-full overflow-hidden rounded-lg mb-2">
        <Chessboard
          id={`pos-${fen.slice(0, 16)}`}
          position={fen}
          arePiecesDraggable={false}
          animationDuration={0}
          showBoardNotation={false}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          customPieces={customPieces}
        />
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400">{note}</p>
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
          <p className="mt-2 font-mono text-xs text-emerald-400/80">
            {guide.moves}
          </p>
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
          {/* Opening Line Board — play through the moves */}
          <div className="flex justify-center">
            <LinePlayer moves={guide.moves} />
          </div>

          {/* Key Ideas */}
          <Section title="💡 Key Ideas">
            <ul className="space-y-1">
              {guide.keyIdeas.map((idea, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-300"
                >
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
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-400"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                    {p}
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="⬛ Plans for Black">
              <ul className="space-y-1">
                {guide.blackPlans.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-400"
                  >
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
                  <div
                    key={i}
                    className="rounded-xl border border-red-500/10 bg-red-500/[0.04] p-3"
                  >
                    <p className="text-sm font-semibold text-red-400">
                      {t.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {t.description}
                    </p>
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

          {/* Link to full SEO guide page */}
          <div className="pt-1">
            <Link
              href={`/openings/${guide.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              View full {guide.name} guide
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
          g.moves.toLowerCase().includes(q),
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
          {OPENING_GUIDES.length} curated guides covering key ideas, plans for
          both sides, common traps, and critical positions.
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
            const count = OPENING_GUIDES.filter(
              (g) => g.category === cat.id,
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setActiveCategory(activeCategory === cat.id ? null : cat.id)
                }
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
                onClick={() =>
                  setDifficultyFilter(difficultyFilter === d ? null : d)
                }
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
            <p className="text-sm text-slate-500">
              No openings match your filters.
            </p>
          </div>
        )}
        {filtered.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-slate-500">
        These guides give you a quick overview — for deeper study, analyze your
        own games on the{" "}
        <Link href="/analyze" className="text-emerald-400 hover:underline">
          Analyze
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
