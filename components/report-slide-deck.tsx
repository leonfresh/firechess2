"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Slide = {
  id: string;
  label: string;
  icon: string;
};

type Props = {
  slides: Slide[];
  children: React.ReactNode[];
  activeSlide: string;
  onSlideChange: (id: string) => void;
};

/**
 * ReportSlideDeck — wraps report sections as horizontally swipable slides.
 * Each slide fills the viewport width with snap scrolling, dot navigation,
 * and keyboard arrow support. Sections without data are skipped automatically.
 */
export function ReportSlideDeck({
  slides,
  children,
  activeSlide,
  onSlideChange,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Map slide IDs to indices
  const slideIds = slides.map((s) => s.id);
  const validChildren = children.filter(Boolean);

  // Keep active in sync
  useEffect(() => {
    const idx = slideIds.indexOf(activeSlide);
    if (idx !== -1 && idx !== currentIdx) {
      setCurrentIdx(idx);
    }
  }, [activeSlide, slideIds, currentIdx]);

  // Scroll to a slide by index
  const scrollTo = useCallback(
    (idx: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const slides = el.querySelectorAll<HTMLElement>("[data-slide-idx]");
      const target = slides[idx];
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [],
  );

  // Observe which slide is in view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.slideIdx,
            );
            if (!Number.isNaN(idx) && idx !== currentIdx && !isTransitioning) {
              setCurrentIdx(idx);
              onSlideChange(slideIds[idx]);
            }
          }
        }
      },
      { root: el, threshold: 0.5 },
    );

    const cards = el.querySelectorAll<HTMLElement>("[data-slide-idx]");
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [slideIds, currentIdx, isTransitioning, onSlideChange]);

  const goPrev = () => {
    const i = Math.max(0, currentIdx - 1);
    setCurrentIdx(i);
    onSlideChange(slideIds[i]);
    scrollTo(i);
  };

  const goNext = () => {
    const i = Math.min(slideIds.length - 1, currentIdx + 1);
    setCurrentIdx(i);
    onSlideChange(slideIds[i]);
    scrollTo(i);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [currentIdx, slideIds]);

  if (slideIds.length === 0) return <>{children}</>;
  if (slideIds.length === 1) return <>{children}</>;

  return (
    <div className="relative">
      {/* Slide indicators */}
      <div className="mb-4 flex items-center justify-center gap-1.5">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => {
              setCurrentIdx(idx);
              onSlideChange(slide.id);
              scrollTo(idx);
            }}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
              idx === currentIdx
                ? "bg-white/[0.1] text-white"
                : "bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
            }`}
          >
            <span>{slide.icon}</span>
            <span className="hidden sm:inline">{slide.label}</span>
            {idx === currentIdx && (
              <span className="ml-0.5 text-[10px] text-slate-500">
                {idx + 1}/{slides.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scrollbar-none"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            data-slide-idx={idx}
            className="min-w-[calc(100vw-2rem)] snap-start shrink-0 sm:min-w-[calc(100%-0px)]"
          >
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-4">
              <span className="text-lg">{slide.icon}</span>
              <span className="text-sm font-bold text-white">
                {slide.label}
              </span>
              <span className="ml-auto text-[10px] text-slate-600">
                {idx + 1}/{slides.length}
              </span>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
              {children[idx]}
            </div>
          </div>
        ))}
      </div>

      {/* Arrow navigation buttons */}
      {currentIdx > 0 && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 shadow-lg backdrop-blur-sm transition hover:bg-slate-800 hover:text-white"
          aria-label="Previous section"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      {currentIdx < slideIds.length - 1 && (
        <button
          type="button"
          onClick={goNext}
          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 shadow-lg backdrop-blur-sm transition hover:bg-slate-800 hover:text-white"
          aria-label="Next section"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
