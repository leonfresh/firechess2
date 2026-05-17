"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { PositionAnalysisBoard, buildStandaloneAnalysisHref } from "@/components/position-analysis-board";

export function AnalysisBoardModal({
  open,
  onClose,
  fen,
  orientation = "white",
  title,
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  fen: string;
  orientation?: "white" | "black";
  title?: string;
  subtitle?: string;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[140] bg-slate-950/85 p-3 backdrop-blur-md sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Position analysis board"
    >
      <div
        className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#030712] shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/65">
              Report analysis
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              Clean analysis board
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:border-white/[0.16] hover:text-white"
            aria-label="Close analysis board"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
          <PositionAnalysisBoard
            initialFen={fen}
            initialOrientation={orientation}
            title={title}
            subtitle={subtitle}
            standaloneHref={buildStandaloneAnalysisHref({
              fen,
              orientation,
              title,
            })}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
