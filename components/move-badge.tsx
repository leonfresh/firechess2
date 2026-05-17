"use client";

import type { MoveClassification } from "@/lib/move-quality";
import {
  MOVE_CLASSIFICATION_BADGE_FILL,
  MOVE_CLASSIFICATION_BG,
  MOVE_CLASSIFICATION_BORDER,
  MOVE_CLASSIFICATION_COLORS,
  MOVE_CLASSIFICATION_LABELS,
  MOVE_CLASSIFICATION_SHORT_LABELS,
} from "@/lib/move-quality";

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
      <span
        className={`pointer-events-none absolute right-0.5 top-0.5 z-[40] rounded-md px-1 py-[1px] text-[9px] font-black text-white shadow ${className}`}
        style={{ backgroundColor: MOVE_CLASSIFICATION_BADGE_FILL[classification] }}
        title={MOVE_CLASSIFICATION_LABELS[classification]}
      >
        {MOVE_CLASSIFICATION_SHORT_LABELS[classification]}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${MOVE_CLASSIFICATION_BORDER[classification]} ${MOVE_CLASSIFICATION_BG[classification]} ${MOVE_CLASSIFICATION_COLORS[classification]} ${className}`}
      title={MOVE_CLASSIFICATION_LABELS[classification]}
    >
      <span className="font-black">{MOVE_CLASSIFICATION_SHORT_LABELS[classification]}</span>
      <span>{MOVE_CLASSIFICATION_LABELS[classification]}</span>
    </span>
  );
}
