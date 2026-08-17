"use client";

import { NotepadText } from "lucide-react";

/** Section-specific colour pairs */
const SECTION_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  openings: {
    bg: "bg-[#ff5a1f]/[0.08]",
    border: "border-[#ff5a1f]/25",
    text: "text-[#ff8c42]",
    accent: "bg-[#ff5a1f]/[0.08]",
  },
  tactics: {
    bg: "bg-red-500/5",
    border: "border-red-400/20",
    text: "text-red-200",
    accent: "bg-red-400/15",
  },
  endgames: {
    bg: "bg-[#ff5a1f]/[0.08]",
    border: "border-[#ff5a1f]/25",
    text: "text-[#ff8c42]",
    accent: "bg-[#ff5a1f]/[0.08]",
  },
  positional: {
    bg: "bg-[#ff5a1f]/[0.08]",
    border: "border-[#ff5a1f]/25",
    text: "text-[#ff8c42]",
    accent: "bg-[#ff5a1f]/[0.08]",
  },
};

/** Map section IDs to readable labels */
const SECTION_LABELS: Record<string, string> = {
  openings: "Opening",
  tactics: "Tactics",
  endgames: "Endgames",
  positional: "Positional",
};

type CoachStickyNoteProps = {
  /** Section key matching the API response */
  section: string;
  /** The coach note text from the LLM */
  note: string;
  /** Optional override for the label */
  label?: string;
};

export function CoachStickyNote({ section, note, label }: CoachStickyNoteProps) {
  const colors = SECTION_COLORS[section] ?? SECTION_COLORS.openings;

  // Sticky note: rotated slightly, paper-like feel
  return (
    <div
      className={`relative -mx-1 my-6 rounded-[1.15rem] border ${colors.border} ${colors.bg} p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] sm:mx-0`}
      style={{ transform: "rotate(-0.5deg)" }}
    >
      {/* Pin dot */}
      <div className="absolute -top-1.5 left-8 h-3 w-3 rounded-full border border-[#ff5a1f]/25 bg-gradient-to-b from-[#ff5a1f] to-[#ff8c42] shadow" />

      <div className="flex items-start gap-2">
        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${colors.accent}`}>
          <NotepadText className={`h-3.5 w-3.5 ${colors.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
            {label ?? SECTION_LABELS[section] ?? section} — Coach&apos;s Note
          </p>
          <p className="text-[13px] leading-relaxed text-[#f0edf2]">{note}</p>
        </div>
      </div>
    </div>
  );
}
