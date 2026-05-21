"use client";

import type { MoveClassification } from "@/lib/move-quality";
import {
  MOVE_CLASSIFICATION_BG,
  MOVE_CLASSIFICATION_BORDER,
  MOVE_CLASSIFICATION_COLORS,
  MOVE_CLASSIFICATION_LABELS,
  MOVE_CLASSIFICATION_SHORT_LABELS,
} from "@/lib/move-quality";

const BADGE_SVG: Record<MoveClassification, string> = {
  brilliant: "/move-badges/brilliant.svg",
  best: "/move-badges/best.svg",
  good: "/move-badges/good.svg",
  book: "/move-badges/book.svg",
  inaccuracy: "/move-badges/inaccuracy.svg",
  mistake: "/move-badges/mistake.svg",
  blunder: "/move-badges/blunder.svg",
};

export function BookOpenIcon({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function MoveBadge({
  classification,
  variant = "pill",
  className = "",
}: {
  classification: MoveClassification;
  variant?: "pill" | "corner";
  className?: string;
}) {
  if (variant === "corner") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={BADGE_SVG[classification]}
        alt={MOVE_CLASSIFICATION_LABELS[classification]}
        title={MOVE_CLASSIFICATION_LABELS[classification]}
        className={`pointer-events-none absolute right-0 top-0 z-40 h-6 w-6 drop-shadow-md ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${MOVE_CLASSIFICATION_BORDER[classification]} ${MOVE_CLASSIFICATION_BG[classification]} ${MOVE_CLASSIFICATION_COLORS[classification]} ${className}`}
      title={MOVE_CLASSIFICATION_LABELS[classification]}
    >
      {classification === "book" ? (
        <BookOpenIcon size={12} />
      ) : (
        <span className="font-black">
          {MOVE_CLASSIFICATION_SHORT_LABELS[classification]}
        </span>
      )}
      <span>{MOVE_CLASSIFICATION_LABELS[classification]}</span>
    </span>
  );
}
