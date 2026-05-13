"use client";

import { useEffect } from "react";
import { CommunityPostComposer } from "@/components/community-post-composer";
import type {
  CommunityPostKind,
  CommunitySourceType,
} from "@/lib/community-shared";

export function CommunityPostComposerModal({
  open,
  onClose,
  initialKind = "position",
  initialSourceType = "manual",
  initialFen = "",
  initialPgn = "",
  initialTitle = "",
  initialPrompt = "",
  initialOpeningName = "",
}: {
  open: boolean;
  onClose: () => void;
  initialKind?: CommunityPostKind;
  initialSourceType?: CommunitySourceType;
  initialFen?: string;
  initialPgn?: string;
  initialTitle?: string;
  initialPrompt?: string;
  initialOpeningName?: string;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/80 p-2 backdrop-blur-md sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create community post"
    >
      <div
        className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#030712] shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/65">
              Community
            </p>
            <p className="mt-1 text-sm font-semibold text-white">Quick post</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:border-white/[0.16] hover:text-white"
            aria-label="Close composer"
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
          <CommunityPostComposer
            initialKind={initialKind}
            initialSourceType={initialSourceType}
            initialFen={initialFen.trim()}
            initialPgn={initialPgn}
            initialTitle={initialTitle}
            initialPrompt={initialPrompt}
            initialOpeningName={initialOpeningName}
            minimal
          />
        </div>
      </div>
    </div>
  );
}
