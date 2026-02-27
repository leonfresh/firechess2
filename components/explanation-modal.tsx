"use client";

import { useCallback, useEffect } from "react";
import type { PositionExplanation, ThemeCard } from "@/lib/position-explainer";

/* ─────────────── Shared types for all card kinds ─────────────── */

/** Tactic / Endgame structured explanation */
export type SimpleExplanation = {
  type: string;       // "winning" | "punishment" | "best" | "consequence"
  move: string;
  impact: string;
  evalAfter?: string;
  line?: string;
  bestMove?: string;
  context?: string;   // e.g. "Failed Conversion"
};

export type ExplanationModalProps = {
  open: boolean;
  onClose: () => void;
  /** Card category for theming */
  variant: "opening" | "tactic" | "endgame";
  /** Active tab (opening only) */
  activeTab?: "played" | "best" | "db" | null;
  /** Rich explanation data (opening leaks) */
  richExplanation?: PositionExplanation | null;
  /** Simple explanation data (tactics / endgames) */
  simpleExplanation?: SimpleExplanation | null;
  /** Fallback plain-text explanation */
  plainExplanation?: string;
  /** Title shown in modal header */
  title?: string;
  /** Subtitle for extra context */
  subtitle?: string;
};

/* ─── Color helpers ─── */

function variantColors(variant: "opening" | "tactic" | "endgame", activeTab?: "played" | "best" | "db" | null) {
  if (variant === "opening") {
    if (activeTab === "best") return { accent: "emerald", border: "border-emerald-500/20", bg: "bg-emerald-500/[0.04]", text: "text-emerald-400", pill: "bg-emerald-500/15 text-emerald-400", grad: "from-emerald-500/[0.06] to-transparent" };
    if (activeTab === "db") return { accent: "blue", border: "border-blue-500/20", bg: "bg-blue-500/[0.04]", text: "text-blue-400", pill: "bg-blue-500/15 text-blue-400", grad: "from-blue-500/[0.06] to-transparent" };
    return { accent: "red", border: "border-red-500/20", bg: "bg-red-500/[0.04]", text: "text-red-400", pill: "bg-red-500/15 text-red-400", grad: "from-red-500/[0.06] to-transparent" };
  }
  if (variant === "tactic") return { accent: "amber", border: "border-amber-500/20", bg: "bg-amber-500/[0.04]", text: "text-amber-400", pill: "bg-amber-500/15 text-amber-400", grad: "from-amber-500/[0.06] to-transparent" };
  return { accent: "sky", border: "border-sky-500/20", bg: "bg-sky-500/[0.04]", text: "text-sky-400", pill: "bg-sky-500/15 text-sky-400", grad: "from-sky-500/[0.06] to-transparent" };
}

function severityClasses(severity: ThemeCard["severity"], variant: "opening" | "tactic" | "endgame") {
  if (severity === "critical") return { border: "border-red-500/20", bg: "bg-red-500/[0.04]", text: "text-red-400" };
  if (severity === "warning") return { border: "border-amber-500/20", bg: "bg-amber-500/[0.04]", text: "text-amber-400" };
  // info → use variant accent
  const c = variantColors(variant);
  return { border: c.border, bg: c.bg, text: c.text };
}

function md(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
}

/* ═══════════════════════════════════════════════════════════════════
   ExplanationModal — full-screen modal for move explanations
   ═══════════════════════════════════════════════════════════════════ */

export function ExplanationModal({
  open,
  onClose,
  variant,
  activeTab,
  richExplanation,
  simpleExplanation,
  plainExplanation,
  title,
  subtitle,
}: ExplanationModalProps) {
  // Close on Escape
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const colors = variantColors(variant, activeTab);
  const hasRich = !!richExplanation;
  const hasSimple = !!simpleExplanation;
  const headerIcon = variant === "opening"
    ? (activeTab === "best" ? "✓" : activeTab === "db" ? "📊" : "✗")
    : variant === "tactic" ? "⚔️" : "♟️";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/[0.1] bg-slate-950 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        {/* ── Header ── */}
        <div className={`border-b border-white/[0.06] bg-gradient-to-r ${colors.grad} p-6 sm:p-8`}>
          <div className="flex items-center gap-4">
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.pill} text-2xl`}>
              {headerIcon}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold text-white sm:text-2xl">
                {title ?? "Move Explanation"}
              </h2>
              {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
            </div>
            {/* Eval badge */}
            {hasRich && richExplanation.evalShift && (
              <div className="text-right">
                <div className={`text-2xl font-black font-mono tabular-nums ${colors.text}`}>
                  {richExplanation.evalShift}
                </div>
                <p className={`text-xs font-bold ${colors.text} opacity-60`}>eval shift</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* ─── Rich Explanation (Opening Leaks) ─── */}
          {hasRich && (
            <>
              {/* Move Description card */}
              {richExplanation.moveDescription && (
                <div className={`rounded-xl border ${colors.border} ${colors.bg} p-5`}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    🎬 What Happened
                  </p>
                  <p className="text-base font-medium leading-relaxed text-slate-200" dangerouslySetInnerHTML={{
                    __html: md(richExplanation.moveDescription)
                  }} />
                  <p className={`mt-2 text-sm font-semibold ${colors.text}`}>
                    {richExplanation.headline}
                  </p>
                </div>
              )}

              {/* Theme Cards — 2-column grid on desktop */}
              {richExplanation.themeCards && richExplanation.themeCards.length > 0 && (
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    🏷️ Themes Detected
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {richExplanation.themeCards.map((card, i) => {
                      const sc = severityClasses(card.severity, variant);
                      return (
                        <div
                          key={i}
                          className={`flex items-start gap-3 rounded-xl border ${sc.border} ${sc.bg} p-4`}
                        >
                          <span className="mt-0.5 text-xl leading-none">{card.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-bold ${sc.text}`}>{card.label}</p>
                            {card.description && (
                              <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{card.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coaching */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-500/10 text-sm">💡</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">Coaching</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-300" dangerouslySetInnerHTML={{
                  __html: md(richExplanation.coaching)
                }} />
              </div>

              {/* Takeaway */}
              {richExplanation.takeaway && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400/70">Takeaway</h3>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-amber-300">
                    {richExplanation.takeaway.replace(/\*\*/g, "")}
                  </p>
                </div>
              )}

              {/* Theme pills */}
              {richExplanation.themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {richExplanation.themes.map((theme) => (
                    <span
                      key={theme}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${colors.border} ${colors.pill}`}
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}

              {/* Detailed Observations */}
              {richExplanation.observations.length > 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-500/10 text-sm">🔍</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">
                      Detailed Observations
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {richExplanation.observations.map((obs, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] p-3"
                      >
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-slate-600" />
                        <p className="text-[13px] leading-relaxed text-slate-400" dangerouslySetInnerHTML={{
                          __html: md(obs)
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── Simple Explanation (Tactics / Endgames) ─── */}
          {hasSimple && !hasRich && (
            <>
              {/* Move + Impact */}
              <div className={`rounded-xl border ${
                simpleExplanation.type === "winning" || simpleExplanation.type === "best"
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : "border-red-500/20 bg-red-500/[0.04]"
              } p-5`}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  🎬 What Happened
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-lg font-bold ${
                    simpleExplanation.type === "winning" || simpleExplanation.type === "best"
                      ? "text-emerald-300" : "text-red-300"
                  }`}>
                    {simpleExplanation.type === "winning" || simpleExplanation.type === "best" ? "✓ " : "✗ "}
                    <strong className="text-white">{simpleExplanation.move}</strong>
                  </p>
                  {simpleExplanation.evalAfter && (
                    <span className="shrink-0 rounded-lg bg-emerald-500/15 px-3 py-1 text-sm font-mono font-bold tabular-nums text-emerald-400">
                      {simpleExplanation.evalAfter}
                    </span>
                  )}
                </div>
                <p className={`mt-2 text-sm ${
                  simpleExplanation.type === "winning" || simpleExplanation.type === "best"
                    ? "text-emerald-400/80" : "text-red-400/80"
                }`}>
                  {simpleExplanation.impact}
                </p>
              </div>

              {/* Context (Failed Conversion etc.) */}
              {simpleExplanation.context && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400/70">{simpleExplanation.context}</h3>
                  </div>
                  <p className="text-sm text-amber-300">
                    You had a winning position but failed to convert the advantage.
                  </p>
                </div>
              )}

              {/* Best / Winning move reminder */}
              {simpleExplanation.bestMove && (
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400/70">
                      {simpleExplanation.type === "punishment" ? "Winning Move" : "Better Move"}
                    </h3>
                  </div>
                  <p className="text-lg font-bold text-emerald-300">
                    {simpleExplanation.bestMove}
                  </p>
                </div>
              )}

              {/* Engine line */}
              {simpleExplanation.line && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-500/10 text-sm">📋</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">
                      {simpleExplanation.type === "winning" || simpleExplanation.type === "best" ? "Best Line" : "After Your Move"}
                    </h3>
                  </div>
                  <p className="text-sm font-mono leading-loose text-slate-300 break-words">
                    {simpleExplanation.line}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ─── Plain text fallback ─── */}
          {!hasRich && !hasSimple && plainExplanation && (
            <div className={`rounded-xl border ${colors.border} ${colors.bg} p-5`}>
              <p className="text-sm leading-relaxed text-slate-300">{plainExplanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
