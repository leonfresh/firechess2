"use client";

/**
 * LauncherEditor
 *
 * Renders the full iPad-style launcher in an edit mode where users can:
 *  - Enter "jiggle mode" via the Edit button (icons wobble, ✕ badges appear)
 *  - Drag icons to reorder within grid and dock
 *  - Remove apps via the ✕ badge
 *  - Add apps from an available-apps picker
 *  - Save their changes or reset to the parent-provided default
 */

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  LAUNCHER_APPS,
  DEFAULT_LAUNCHER,
  getAppById,
  type AppDef,
  type LauncherConfig,
} from "@/lib/launcher-apps";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface LauncherEditorProps {
  /** Starting config (loaded from API). Falls back to DEFAULT_LAUNCHER. */
  initialConfig: LauncherConfig;
  /** Called when the user saves. Receives the new config. */
  onSave: (config: LauncherConfig) => Promise<void>;
  /** If provided, shown as a "Reset to Default" target label */
  defaultConfig?: LauncherConfig;
  /** Heading text shown above the device (optional) */
  title?: string;
}

type Section = "grid" | "dock";

/* ------------------------------------------------------------------ */
/*  AppIcon & EmptySlot — top-level so their identity is stable across  */
/*  re-renders; nested functions would remount on every state change,  */
/*  breaking drag-and-drop entirely.                                   */
/* ------------------------------------------------------------------ */

interface AppIconProps {
  app: AppDef;
  section: Section;
  index: number;
  isEditing: boolean;
  isDrop: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRemove: () => void;
}

function AppIcon({ app, section, isEditing, isDrop, onDragStart, onDragOver, onDrop, onDragEnd, onRemove }: AppIconProps) {
  const isGrid = section === "grid";

  const bubble = (
    <div
      className={[
        "relative flex items-center justify-center rounded-[22%]",
        app.bg,
        isGrid
          ? "aspect-square w-full max-w-[72px] shadow-lg transition-all duration-200 group-hover:-translate-y-1 group-hover:scale-110"
          : "h-12 w-12 shadow-md transition-all duration-200 group-hover:-translate-y-0.5 group-hover:scale-110",
      ].join(" ")}
      style={{ boxShadow: `0 6px 20px ${app.glow}` }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[22%] bg-gradient-to-b from-white/[0.22] to-transparent" />
      {app.icon(isGrid ? "h-9 w-9" : "h-7 w-7")}
      {isEditing && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white ring-1 ring-white/30 transition-transform hover:scale-110"
          aria-label={`Remove ${app.label}`}
        >
          <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5">
            <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );

  const wrapperClass = [
    "group relative flex flex-col items-center",
    isGrid ? "gap-1.5" : "gap-1",
    isEditing ? "animate-jiggle cursor-grab" : "",
    isDrop ? "opacity-50" : "",
  ].filter(Boolean).join(" ");

  const labelEl = (
    <span className={[
      "line-clamp-1 text-center font-medium leading-tight",
      isGrid ? "text-[10px] text-white/75 group-hover:text-white" : "text-[9px] text-white/50 group-hover:text-white/80",
    ].join(" ")}>
      {app.label}
    </span>
  );

  if (isEditing) {
    return (
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={wrapperClass}
      >
        {bubble}
        {labelEl}
      </div>
    );
  }

  return (
    <Link href={app.href} className={wrapperClass}>
      {bubble}
      {labelEl}
    </Link>
  );
}

function EmptySlot({ section, onAdd }: { section: Section; onAdd: () => void }) {
  return (
    <button onClick={onAdd} className="group flex flex-col items-center gap-1.5">
      <div className="flex aspect-square w-full max-w-[72px] items-center justify-center rounded-[22%] border-2 border-dashed border-white/20 bg-white/[0.03] transition-colors group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white/30 group-hover:text-emerald-400">
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[10px] text-white/25 group-hover:text-emerald-400/70">Add</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function LauncherEditor({
  initialConfig,
  onSave,
  defaultConfig = DEFAULT_LAUNCHER,
  title,
}: LauncherEditorProps) {
  const [config, setConfig] = useState<LauncherConfig>(() => ({
    grid: [...initialConfig.grid],
    dock: [...initialConfig.dock],
  }));
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState<Section | null>(null);

  // Drag state refs (avoid re-renders during drag)
  const dragSrc = useRef<{ section: Section; index: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ section: Section; index: number } | null>(null);

  /* ── Derived ─────────────────────────────────────────── */
  const isDirty =
    JSON.stringify(config) !== JSON.stringify({ grid: [...initialConfig.grid], dock: [...initialConfig.dock] });

  const usedIds = new Set([...config.grid, ...config.dock]);
  const availableApps = LAUNCHER_APPS.filter((a) => !usedIds.has(a.id));

  /* ── Actions ─────────────────────────────────────────── */

  function removeApp(section: Section, index: number) {
    setConfig((prev) => {
      const arr = [...prev[section]];
      arr.splice(index, 1);
      return { ...prev, [section]: arr };
    });
  }

  function addApp(section: Section, id: string) {
    setConfig((prev) => {
      const arr = [...prev[section]];
      const maxSlots = section === "grid" ? 10 : 4;
      if (arr.length >= maxSlots) return prev;
      return { ...prev, [section]: [...arr, id] };
    });
    setShowPicker(null);
  }

  function resetToDefault() {
    if (!confirm("Reset launcher to default? Your custom layout will be lost.")) return;
    setConfig({ grid: [...defaultConfig.grid], dock: [...defaultConfig.dock] });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  /* ── Drag & Drop ────────────────────────────────────── */

  const handleDragStart = useCallback(
    (section: Section, index: number) => (e: React.DragEvent) => {
      dragSrc.current = { section, index };
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleDragOver = useCallback(
    (section: Section, index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTarget({ section, index });
    },
    [],
  );

  const handleDrop = useCallback(
    (section: Section, toIndex: number) => (e: React.DragEvent) => {
      e.preventDefault();
      if (!dragSrc.current) return;
      const { section: fromSection, index: fromIndex } = dragSrc.current;

      if (fromSection === section) {
        // Reorder within the same section
        setConfig((prev) => {
          const arr = [...prev[section]];
          const [item] = arr.splice(fromIndex, 1);
          arr.splice(toIndex, 0, item);
          return { ...prev, [section]: arr };
        });
      } else {
        // Move between sections
        const maxSlots = section === "grid" ? 10 : 4;
        setConfig((prev) => {
          const fromArr = [...prev[fromSection]];
          const toArr = [...prev[section]];
          if (toArr.length >= maxSlots) return prev; // section full — no-op
          const [item] = fromArr.splice(fromIndex, 1);
          toArr.splice(toIndex, 0, item);
          return { ...prev, [fromSection]: fromArr, [section]: toArr };
        });
      }

      dragSrc.current = null;
      setDropTarget(null);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    dragSrc.current = null;
    setDropTarget(null);
  }, []);

  // Allow dropping onto the section container itself (not just individual icons)
  const handleSectionDrop = useCallback(
    (section: Section) => (e: React.DragEvent) => {
      e.preventDefault();
      if (!dragSrc.current) return;
      const { section: fromSection, index: fromIndex } = dragSrc.current;
      if (fromSection === section) { dragSrc.current = null; setDropTarget(null); return; }
      const maxSlots = section === "grid" ? 10 : 4;
      setConfig((prev) => {
        const fromArr = [...prev[fromSection]];
        const toArr = [...prev[section]];
        if (toArr.length >= maxSlots) return prev;
        const [item] = fromArr.splice(fromIndex, 1);
        toArr.push(item);
        return { ...prev, [fromSection]: fromArr, [section]: toArr };
      });
      dragSrc.current = null;
      setDropTarget(null);
    },
    [],
  );

  const handleSectionDragOver = useCallback(
    (section: Section) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [],
  );

  /* ── App picker modal ─────────────────────────────── */

  function AppPicker() {
    const section = showPicker;
    if (!section) return null;

    const maxSlots = section === "grid" ? 10 : 4;
    const currentCount = config[section].length;
    const canAdd = currentCount < maxSlots;

    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
        onClick={() => setShowPicker(null)}
      >
        <div
          className="w-full max-w-md rounded-t-2xl border border-white/[0.08] bg-[#0c1520] p-5 sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Add to {section === "grid" ? "Grid" : "Dock"}</h3>
              <p className="mt-0.5 text-xs text-white/40">
                {currentCount}/{maxSlots} slots used
              </p>
            </div>
            <button
              onClick={() => setShowPicker(null)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 10 10" fill="none" className="h-3 w-3">
                <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {availableApps.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">All apps are already in your launcher.</p>
          ) : !canAdd ? (
            <p className="py-6 text-center text-sm text-white/40">
              {section === "grid" ? "Grid is full (10 apps max)." : "Dock is full (4 apps max)."}
              {" "}Remove an app first.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {availableApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => addApp(section, app.id)}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`flex aspect-square w-full items-center justify-center rounded-[22%] ${app.bg} transition-all group-hover:scale-110 group-hover:shadow-lg`}
                    style={{ boxShadow: `0 4px 14px ${app.glow}` }}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[22%] bg-gradient-to-b from-white/[0.2] to-transparent" />
                    {app.icon("h-6 w-6")}
                  </div>
                  <span className="line-clamp-1 text-center text-[10px] font-medium text-white/70 group-hover:text-white">
                    {app.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Main render ─────────────────────────────────── */

  const gridApps = config.grid.map(getAppById).filter(Boolean) as AppDef[];
  const dockApps = config.dock.map(getAppById).filter(Boolean) as AppDef[];
  const gridSlots = isEditing && gridApps.length < 10 ? [...gridApps, null] : gridApps;

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title && <p className="text-sm font-medium text-white/70">{title}</p>}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={resetToDefault}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/80"
              >
                Reset
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-white/[0.12] bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
              >
                Done
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                <path
                  d="M11 2.5 L13.5 5 L5.5 13 L2 14 L3 10.5 Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              Edit Layout
            </button>
          )}
        </div>
      </div>

      {/* iPad device mockup */}
      <div className="relative mx-auto w-full max-w-[700px]">
        {/* Device shadow glow */}
        <div className="pointer-events-none absolute inset-x-8 bottom-0 h-16 rounded-[40px] bg-emerald-500/[0.08] blur-2xl" />

        {/* Device outer body */}
        <div className="relative rounded-[36px] border border-white/[0.1] bg-gradient-to-b from-[#1c2a3a] via-[#111c2a] to-[#0c1520] p-[10px] shadow-2xl shadow-black/70 ring-1 ring-white/[0.04]">
          {/* Side buttons (decorative) */}
          <div className="absolute -left-[3px] top-24 h-8 w-[3px] rounded-l-sm bg-gradient-to-b from-white/[0.08] to-white/[0.04]" />
          <div className="absolute -left-[3px] top-36 h-12 w-[3px] rounded-l-sm bg-gradient-to-b from-white/[0.08] to-white/[0.04]" />
          <div className="absolute -right-[3px] top-28 h-14 w-[3px] rounded-r-sm bg-gradient-to-b from-white/[0.08] to-white/[0.04]" />

          {/* Screen */}
          <div className="overflow-hidden rounded-[28px] bg-[#060e18]">
            {/* Status bar */}
            <div className="flex items-center justify-between bg-[#060e18] px-5 py-2">
              <span className="text-[11px] font-semibold tabular-nums text-white/50">9:41</span>
              <div className="flex items-center gap-1">
                {/* Signal bars */}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <rect x="0" y="7" width="2.5" height="3" rx="0.5" fill="rgba(255,255,255,0.5)" />
                  <rect x="3.5" y="4.5" width="2.5" height="5.5" rx="0.5" fill="rgba(255,255,255,0.5)" />
                  <rect x="7" y="2" width="2.5" height="8" rx="0.5" fill="rgba(255,255,255,0.5)" />
                  <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="rgba(255,255,255,0.2)" />
                </svg>
                {/* Wifi */}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M7 8.5 C7 8.5 7 8.5 7 8.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M4.5 6.5 C5.5 5.2 8.5 5.2 9.5 6.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                  <path d="M2 4 C4 1.5 10 1.5 12 4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </svg>
                {/* Battery */}
                <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
                  <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <rect x="1.5" y="1.5" width="13" height="8" rx="1.5" fill="rgba(255,255,255,0.55)" />
                  <path d="M19.5 3.5 C20.3 3.5 20.3 7.5 19.5 7.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Wallpaper + icons */}
            <div
              className="relative px-4 pb-3 pt-2"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 20%, rgba(16,185,129,0.08) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.07) 0%, transparent 55%), #060e18",
              }}
            >
              {/* Dot grid wallpaper */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />

              {/* Editing banner */}
              {isEditing && (
                <div className="relative mb-3 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-center text-[11px] text-white/50">
                  Drag to reorder · Tap <span className="font-bold text-white/70">✕</span> to remove · Tap <span className="font-bold text-emerald-400">+</span> to add
                </div>
              )}

              {/* App grid */}
              <div
                className="relative grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-5 sm:gap-x-4"
                onDragOver={isEditing ? handleSectionDragOver("grid") : undefined}
                onDrop={isEditing ? handleSectionDrop("grid") : undefined}
              >
                {gridSlots.map((app, i) =>
                  app ? (
                    <AppIcon
                      key={app.id}
                      app={app}
                      section="grid"
                      index={i}
                      isEditing={isEditing}
                      isDrop={dropTarget?.section === "grid" && dropTarget?.index === i}
                      onDragStart={handleDragStart("grid", i)}
                      onDragOver={handleDragOver("grid", i)}
                      onDrop={handleDrop("grid", i)}
                      onDragEnd={handleDragEnd}
                      onRemove={() => removeApp("grid", i)}
                    />
                  ) : (
                    <EmptySlot key={`empty-grid-${i}`} section="grid" onAdd={() => setShowPicker("grid")} />
                  ),
                )}
              </div>

              {/* Dock separator */}
              <div className="my-4 border-t border-white/[0.06]" />

              {/* Dock */}
              <div
                className="flex items-center justify-around rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 backdrop-blur-md"
                onDragOver={isEditing ? handleSectionDragOver("dock") : undefined}
                onDrop={isEditing ? handleSectionDrop("dock") : undefined}
              >
                {dockApps.map((app, i) => (
                  <AppIcon
                    key={app.id}
                    app={app}
                    section="dock"
                    index={i}
                    isEditing={isEditing}
                    isDrop={dropTarget?.section === "dock" && dropTarget?.index === i}
                    onDragStart={handleDragStart("dock", i)}
                    onDragOver={handleDragOver("dock", i)}
                    onDrop={handleDrop("dock", i)}
                    onDragEnd={handleDragEnd}
                    onRemove={() => removeApp("dock", i)}
                  />
                ))}
                {isEditing && dockApps.length < 4 && (
                  <button
                    onClick={() => setShowPicker("dock")}
                    className="group flex flex-col items-center gap-1"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[20%] border-2 border-dashed border-white/20 bg-white/[0.03] transition-colors group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10">
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white/30 group-hover:text-emerald-400">
                        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="text-[9px] text-white/25 group-hover:text-emerald-400/70">Add</span>
                  </button>
                )}
              </div>
            </div>

            {/* Home indicator */}
            <div className="flex justify-center bg-[#060e18] pb-2 pt-1">
              <div className="h-1 w-24 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Save row */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 8 L7 10 L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Saving…
            </>
          ) : (
            "Save Layout"
          )}
        </button>
      </div>

      {/* App picker modal */}
      <AppPicker />
    </div>
  );
}
