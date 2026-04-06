"use client";

/**
 * AdminDebug — floating debug panel, only visible for admin users.
 *
 * Renders as a collapsible widget in the bottom-right corner.
 * Dispatches custom DOM events that other components can listen for.
 */

import { useState } from "react";
import { useSession } from "@/components/session-provider";

const PREFS_KEY = "firechess-user-prefs";
const KEY_SETUP_DONE = "fc-setup-done";
const REPORT_KEY_PREFIX = "fc-last-report";

const SCAN_MODES = [
  "openings",
  "tactics",
  "endgames",
  "both",
  "time-management",
];

export function AdminDebug() {
  const { isAdmin } = useSession();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isAdmin) return null;

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function reopenWizard() {
    localStorage.removeItem(KEY_SETUP_DONE);
    window.dispatchEvent(new CustomEvent("fc:debug:reopen-wizard"));
    setOpen(false);
    notify("Setup wizard reopened ✓");
  }

  function clearPrefs() {
    localStorage.removeItem(PREFS_KEY);
    notify("User prefs cleared — reload to see effect");
  }

  function clearReportCache() {
    for (const mode of SCAN_MODES) {
      localStorage.removeItem(`${REPORT_KEY_PREFIX}-${mode}`);
    }
    notify("Report cache cleared ✓");
  }

  function clearAllDebugFlags() {
    localStorage.removeItem(KEY_SETUP_DONE);
    localStorage.removeItem("fc-onboarding-done");
    notify("All first-run flags cleared ✓");
  }

  const BUTTONS: {
    label: string;
    icon: string;
    action: () => void;
    color: string;
  }[] = [
    {
      label: "Open Welcome Onboarding",
      icon: "🧙",
      action: reopenWizard,
      color: "hover:bg-emerald-500/20 hover:text-emerald-300",
    },
    {
      label: "Clear All First-run Flags",
      icon: "🚩",
      action: clearAllDebugFlags,
      color: "hover:bg-amber-500/20 hover:text-amber-300",
    },
    {
      label: "Clear User Prefs",
      icon: "🗑",
      action: clearPrefs,
      color: "hover:bg-orange-500/20 hover:text-orange-300",
    },
    {
      label: "Clear Report Cache",
      icon: "📋",
      action: clearReportCache,
      color: "hover:bg-sky-500/20 hover:text-sky-300",
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[9990] flex select-none flex-col items-end gap-2">
      {/* Toast */}
      {toast && (
        <div className="animate-fade-in rounded-xl border border-white/[0.10] bg-slate-900/95 px-4 py-2 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-sm">
          {toast}
        </div>
      )}

      {/* Collapsible panel */}
      {open && (
        <div className="animate-fade-in w-60 overflow-hidden rounded-2xl border border-white/[0.10] bg-slate-900/95 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
            <span className="text-base">🔧</span>
            <span className="flex-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              Admin Debug
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-600 transition-colors hover:text-slate-300"
              aria-label="Close debug panel"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-0.5 p-2">
            {BUTTONS.map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-slate-400 transition-all ${btn.color}`}
              >
                <span className="text-base leading-none">{btn.icon}</span>
                {btn.label}
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="border-t border-white/[0.06] px-4 py-2.5">
            <p className="text-[10px] text-slate-600">Only visible to admins</p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle admin debug panel"
        className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-all ${
          open
            ? "border-white/[0.15] bg-slate-700 text-white shadow-slate-900/50"
            : "border-white/[0.08] bg-slate-800/90 text-slate-500 shadow-slate-900/50 hover:border-white/[0.15] hover:text-slate-300"
        }`}
      >
        <span className="text-sm leading-none">{open ? "✕" : "🔧"}</span>
      </button>
    </div>
  );
}
