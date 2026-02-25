"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

/* ── Types ── */
export type CardViewMode = "carousel" | "list";

interface CardCarouselProps {
  children: ReactNode[];
  /** Extra element(s) to always render after the cards (e.g. DrillMode) in list mode,
   *  or below the carousel in carousel mode. */
  footer?: ReactNode;
  viewMode: CardViewMode;
}

/* ── Component ── */
export function CardCarousel({ children, footer, viewMode }: CardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = children.length;

  /* ── Keep activeIndex in bounds when children change ── */
  useEffect(() => {
    if (activeIndex >= total) setActiveIndex(Math.max(0, total - 1));
  }, [total, activeIndex]);

  /* ── Observe which card is snapped into view ── */
  useEffect(() => {
    if (viewMode !== "carousel") return;
    const el = scrollRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root: el, threshold: 0.6 },
    );

    const cards = el.querySelectorAll<HTMLElement>("[data-idx]");
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [viewMode, total]);

  /* ── Scroll to a specific card ── */
  const scrollTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`[data-idx="${idx}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  const goPrev = () => { const i = Math.max(0, activeIndex - 1); setActiveIndex(i); scrollTo(i); };
  const goNext = () => { const i = Math.min(total - 1, activeIndex + 1); setActiveIndex(i); scrollTo(i); };

  /* ── List mode: plain vertical stack ── */
  if (viewMode === "list") {
    return (
      <>
        <div className="space-y-6">
          {children.map((child, idx) => (
            <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
              {child}
            </div>
          ))}
        </div>
        {footer}
      </>
    );
  }

  /* ── Carousel mode ── */
  return (
    <div className="space-y-3">
      {/* Navigation header */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={activeIndex === 0}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Previous card"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L9.832 10l2.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
          Prev
        </button>

        <span className="text-sm font-semibold tabular-nums text-white">
          {activeIndex + 1} <span className="text-slate-500">of</span> {total}
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={activeIndex === total - 1}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Next card"
        >
          Next
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L10.168 10 6.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Scrollable card track */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, idx) => (
          <div
            key={idx}
            data-idx={idx}
            className="w-full flex-shrink-0 snap-center"
          >
            {child}
          </div>
        ))}
      </div>

      {/* Dot indicators (max 12 dots, collapse for large sets) */}
      {total > 1 && total <= 20 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setActiveIndex(i); scrollTo(i); }}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? "w-4 bg-emerald-400"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Bottom navigation hint */}
      {total > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={activeIndex === 0}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L9.832 10l2.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
            Prev Position
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={activeIndex === total - 1}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          >
            Next Position
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L10.168 10 6.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {footer}
    </div>
  );
}

/* ── View-mode toggle button ── */
export function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: CardViewMode;
  onChange: (m: CardViewMode) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
          mode === "list"
            ? "bg-white/[0.1] text-white shadow-sm"
            : "text-slate-500 hover:text-slate-300"
        }`}
        aria-label="List view"
      >
        {/* List icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        List
      </button>
      <button
        type="button"
        onClick={() => onChange("carousel")}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
          mode === "carousel"
            ? "bg-white/[0.1] text-white shadow-sm"
            : "text-slate-500 hover:text-slate-300"
        }`}
        aria-label="Carousel view"
      >
        {/* Swipe/cards icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M9 18l3-3-3-3" />
        </svg>
        Swipe
      </button>
    </div>
  );
}
