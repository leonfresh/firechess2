"use client";

/* ────────────────────────────────────────────────────────────────────────
 * ReportViewToggle
 *
 * The sticky Guided / Full pill shown at the top of a report region. It pins
 * to the top of the viewport as the user scrolls so the view switch is always
 * one tap away — regardless of how far down the full report they are.
 *
 * Rendered once at the top of both the report page (`/report/[id]`) and the
 * homepage post-scan section.
 * ──────────────────────────────────────────────────────────────────────── */

export type ReportViewMode = "guided" | "full";

export function ReportViewToggle({
  viewMode,
  onChange,
  disabled = false,
}: {
  viewMode: ReportViewMode;
  onChange: (mode: ReportViewMode) => void;
  disabled?: boolean;
}) {
  const options: { value: ReportViewMode; label: string }[] = [
    { value: "guided", label: "Guided" },
    { value: "full", label: "Full Report" },
  ];

  return (
    <div className="sticky top-0 z-40 -mx-4 mb-1 border-b border-white/[0.06] bg-[#030712]/85 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
        <span className="mr-1 hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:inline">
          View
        </span>
        <div
          className={`inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-black/30 p-1 transition ${
            disabled ? "pointer-events-none opacity-40" : ""
          }`}
        >
          {options.map((option) => {
            const selected = viewMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                disabled={disabled}
                aria-pressed={selected}
                className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition ${
                  selected
                    ? "bg-white text-slate-950 shadow-sm shadow-black/30"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
