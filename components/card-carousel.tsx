"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ── Types ── */
export type CardViewMode = "carousel" | "list" | "grid";

interface CardCarouselProps {
  children: ReactNode[];
  /** Extra element(s) to always render after the cards (e.g. DrillMode) in list mode,
   *  or below the carousel in carousel mode. */
  footer?: ReactNode;
  viewMode: CardViewMode;
}

/* ── Grid modal ── */
function GridModal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      {/* Scroll container — only this div scrolls, overscroll-behavior prevents page scroll bleed */}
      <div className="absolute inset-0 overflow-y-auto overscroll-contain">
        <div className="flex min-h-full items-start justify-center p-3 sm:p-6 py-8 sm:py-12">
          {/* Modal */}
          <div
            className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/[0.1] bg-slate-950 shadow-2xl shadow-black/50 animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <div className="p-4 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}

/* ── Component ── */
export function CardCarousel({ children, footer, viewMode }: CardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [gridModalIndex, setGridModalIndex] = useState<number | null>(null);
  const total = children.length;

  /* ── Keep activeIndex in bounds when children change ── */
  useEffect(() => {
    if (activeIndex >= total) setActiveIndex(Math.max(0, total - 1));
  }, [total, activeIndex]);

  /* ── Virtualisation window: only mount cards within ±1 of active ── */
  const RENDER_WINDOW = 1; // cards on each side of the active card to render

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

  /* ── Scroll to a specific card (horizontal only, no page scroll) ── */
  const scrollTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`[data-idx="${idx}"]`);
    if (!card) return;
    const left = card.offsetLeft - el.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, []);

  const goPrev = () => { const i = Math.max(0, activeIndex - 1); setActiveIndex(i); scrollTo(i); };
  const goNext = () => { const i = Math.min(total - 1, activeIndex + 1); setActiveIndex(i); scrollTo(i); };

  /* ── List mode: plain vertical stack (cap animation delay at 8 items) ── */
  if (viewMode === "list") {
    return (
      <>
        <div className="space-y-6">
          {children.map((child, idx) => (
            <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(idx, 8) * 80}ms` }}>
              {child}
            </div>
          ))}
        </div>
        {footer}
      </>
    );
  }

  /* ── Grid mode: compact cards with click-to-expand modal ── */
  if (viewMode === "grid") {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setGridModalIndex(idx)}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition-all hover:border-white/[0.15] hover:bg-white/[0.04] animate-fade-in-up text-left"
              style={{ animationDelay: `${Math.min(idx, 12) * 50}ms` }}
            >
              {/* Preview: scaled-down card clipped to visible area */}
              <div className="pointer-events-none h-[280px] overflow-hidden">
                <div className="origin-top-left scale-[0.48]" style={{ width: "208%" }}>
                  {child}
                </div>
              </div>
              {/* Gradient fade at bottom */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" />
              {/* Expand overlay */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-3 pt-8">
                <span className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                  View Details
                </span>
              </div>
              {/* Card number badge */}
              <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white/70 backdrop-blur-sm">
                {idx + 1}
              </div>
            </button>
          ))}
        </div>

        {/* Grid modal */}
        {gridModalIndex !== null && (
          <GridModal onClose={() => setGridModalIndex(null)}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white/60">{gridModalIndex + 1} of {total}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGridModalIndex(Math.max(0, gridModalIndex - 1))}
                  disabled={gridModalIndex === 0}
                  className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/[0.1] disabled:opacity-30"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => setGridModalIndex(Math.min(total - 1, gridModalIndex + 1))}
                  disabled={gridModalIndex === total - 1}
                  className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/[0.1] disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </div>
            {children[gridModalIndex]}
          </GridModal>
        )}

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

      {/* Scrollable card track with edge arrow hints */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children.map((child, idx) => {
            const inWindow = Math.abs(idx - activeIndex) <= RENDER_WINDOW;
            return (
              <div
                key={idx}
                data-idx={idx}
                className="w-full flex-shrink-0 snap-center"
              >
                {inWindow ? child : (
                  /* Lightweight placeholder — preserves scroll width without mounting heavy card */
                  <div className="aspect-[4/3] w-full rounded-xl bg-white/[0.02]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Left arrow hint */}
        {activeIndex > 0 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-0 top-[200px] z-10 flex h-10 w-7 items-center justify-center rounded-r-xl bg-black/50 text-white/60 backdrop-blur-sm transition-all hover:w-9 hover:bg-black/70 hover:text-white"
            aria-label="Previous card"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L9.832 10l2.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Right arrow hint */}
        {activeIndex < total - 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-[200px] z-10 flex h-10 w-7 items-center justify-center rounded-l-xl bg-black/50 text-white/60 backdrop-blur-sm transition-all hover:w-9 hover:bg-black/70 hover:text-white"
            aria-label="Next card"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L10.168 10 6.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        )}
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
  const modes: { value: CardViewMode; label: string; icon: ReactNode }[] = [
    {
      value: "list",
      label: "List",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
    {
      value: "carousel",
      label: "Swipe",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M9 18l3-3-3-3" />
        </svg>
      ),
    },
    {
      value: "grid",
      label: "Grid",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
  ];

  return (
    <div className="inline-flex items-center rounded-xl border border-white/[0.1] bg-white/[0.04] p-1 shadow-lg shadow-black/20">
      {modes.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            mode === value
              ? "bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/10"
              : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
          }`}
          aria-label={`${label} view`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
