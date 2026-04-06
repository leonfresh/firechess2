"use client";

/**
 * HeroProductAnimation
 *
 * A self-contained SVG / CSS animation that cycles through 4 "screens"
 * to tell the FireChess product story in the hero section.
 *
 * Phases:
 *   0 input    — Control Center form, username typewriter, button pulse
 *   1 scanning — Progress bar + phase-step indicators
 *   2 leaks    — Opening leak cards with a mini chess-board SVG, staggered reveal
 *   3 insights — SVG radar chart + positional motif chips
 */

import { useEffect, useRef, useState } from "react";
import { Chessboard } from "@/components/chessboard-compat";

// ─── Phase config ───────────────────────────────────────────────────
const PHASES = ["input", "scanning", "leaks", "insights"] as const;
type Phase = (typeof PHASES)[number];

const PHASE_MS: Record<Phase, number> = {
  input: 5200,
  scanning: 4000,
  leaks: 4800,
  insights: 5000,
};

// ─── Demo data ──────────────────────────────────────────────────────
const LEAKS = [
  {
    opening: "Ruy Lopez",
    variant: "Exchange Variation",
    games: 14,
    cp: 1.17,
    pct: 78,
  },
  {
    opening: "Sicilian Defense",
    variant: "e3 Anti-Sicilian",
    games: 8,
    cp: 0.82,
    pct: 62,
  },
  {
    opening: "King's Indian",
    variant: "Averbakh Variation",
    games: 5,
    cp: 0.54,
    pct: 45,
  },
];

const MOTIFS = [
  {
    icon: "💀",
    name: "Hanging Pieces",
    count: 8,
    cls: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  {
    icon: "⚔️",
    name: "Missed Tactics",
    count: 5,
    cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: "🐢",
    name: "Passive Retreats",
    count: 4,
    cls: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: "📏",
    name: "Overextended Pawns",
    count: 3,
    cls: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
];

// ─── SVG Radar ──────────────────────────────────────────────────────
const CX = 80,
  CY = 80,
  R = 62;
const RADAR_VALS = [0.72, 0.57, 0.44, 0.65, 0.7];
const RADAR_LABELS = ["Openings", "Tactics", "Endgames", "Time", "Patterns"];
const LABEL_OFFSETS: [number, number][] = [
  [0, -14], // top
  [14, -4], // right-top
  [12, 10], // right-bottom
  [-12, 10], // left-bottom
  [-14, -4], // left-top
];

function radarPt(i: number, val: number): string {
  const a = -Math.PI / 2 + ((2 * Math.PI) / 5) * i;
  return `${(CX + R * val * Math.cos(a)).toFixed(1)},${(CY + R * val * Math.sin(a)).toFixed(1)}`;
}
function gridPoly(frac: number): string {
  return Array.from({ length: 5 }, (_, i) => radarPt(i, frac)).join(" ");
}
const DATA_POLY = RADAR_VALS.map((v, i) => radarPt(i, v)).join(" ");
const AXIS_LINES = RADAR_VALS.map((_, i) => {
  const a = -Math.PI / 2 + ((2 * Math.PI) / 5) * i;
  return {
    x2: (CX + R * Math.cos(a)).toFixed(1),
    y2: (CY + R * Math.sin(a)).toFixed(1),
    lx: (CX + (R + 14) * Math.cos(a) + LABEL_OFFSETS[i][0]).toFixed(1),
    ly: (CY + (R + 14) * Math.sin(a) + LABEL_OFFSETS[i][1]).toFixed(1),
  };
});

// ─── Mini SVG chess board (8×8) with arrows ─────────────────────────
const LIGHT = "#4a5568",
  DARK = "#2d3748"; // dark-palette board
function sq(f: number, r: number): string {
  return `${f * 14},${r * 14}`;
}
// Green arrow e2→e4 (best), red arrow e2→c4 (played mistake)
const BOARD_SQUARES = Array.from({ length: 64 }, (_, n) => ({
  x: (n % 8) * 14,
  y: Math.floor(n / 8) * 14,
  light: (Math.floor(n / 8) + (n % 8)) % 2 === 0,
}));
// Arrow coords: file 4 = e, ranks 0-indexed from top = rank 8 at top
// e2 = file 4, rank 6 (0idx) → center (4*14+7, 6*14+7) = (63, 91)
// e4 = file 4, rank 4 → center (63, 63)
// c4 = file 2, rank 4 → center (35, 63)
const BOARD_W = 8 * 14; // 112

// ─── Keyframes injected once ─────────────────────────────────────────
const KEYFRAMES = `
@keyframes hpa-slide-up {
  from { transform: translateY(14px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes hpa-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes hpa-progress {
  from { width: 0%; }
  to   { width: 82%; }
}
@keyframes hpa-type {
  from { max-width: 0; }
  to   { max-width: 160px; }
}
@keyframes hpa-cursor {
  50% { opacity: 0; }
}
@keyframes hpa-btn-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.40); }
  50%      { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
}
@keyframes hpa-radar {
  0%   { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes hpa-check-in {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
@keyframes hpa-phase-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

// ─── Phase sub-components ────────────────────────────────────────────

function InputPhase() {
  return (
    <div style={{ animation: "hpa-phase-enter 0.45s ease both" }}>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-sm">
          ⚡
        </span>
        <div>
          <p className="text-xs font-bold text-white">Control Center</p>
          <p className="text-[10px] text-slate-500">Configure your scan</p>
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold text-cyan-400">
          <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400" />{" "}
          Live
        </span>
      </div>

      {/* Platform + username bar */}
      <div className="mb-2.5 flex items-center overflow-hidden rounded-xl border border-amber-500/30 bg-white/[0.04]">
        <div className="flex shrink-0 items-center gap-0.5 px-1.5 py-1.5">
          <span className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-2 py-1 text-[10px] font-bold text-slate-950">
            Lichess
          </span>
          <span className="px-2 py-1 text-[10px] font-semibold text-slate-500">
            Chess.com
          </span>
        </div>
        <div className="mx-1 h-4 w-px bg-white/10" />
        {/* Typewriter username */}
        <div className="flex items-center gap-0 py-2 pl-2">
          <span
            className="overflow-hidden whitespace-nowrap text-xs font-medium text-white"
            style={{ animation: "hpa-type 2.4s steps(13,end) 0.4s both" }}
          >
            MagnusCarlsen
          </span>
          <span
            className="ml-0.5 inline-block h-3 w-px bg-emerald-400"
            style={{ animation: "hpa-cursor 0.8s step-end infinite" }}
          />
        </div>
      </div>

      {/* Scan mode row */}
      <div className="mb-2.5 grid grid-cols-4 gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
        {[
          { label: "📖 Openings", active: true },
          { label: "⚡ Tactics", active: false },
          { label: "♟️ Endgames", active: false },
          { label: "⏱️ Time", active: false },
        ].map(({ label, active }) => (
          <div
            key={label}
            className={`rounded-md py-1 text-center text-[9px] font-semibold ${
              active
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950"
                : "text-slate-500"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Settings row */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { label: "Games", value: "300" },
          { label: "Moves", value: "30" },
          { label: "Depth", value: "12" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5"
          >
            <p className="text-[8px] font-medium uppercase tracking-wider text-slate-600">
              {label}
            </p>
            <p className="text-xs font-bold text-slate-200">{value}</p>
          </div>
        ))}
      </div>

      {/* Scan button — pulses after a delay */}
      <div
        className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-2.5 text-xs font-bold text-white"
        style={{ animation: "hpa-btn-pulse 1.2s ease-in-out 3.2s infinite" }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        Scan Games
      </div>
    </div>
  );
}

function ScanningPhase() {
  const STEPS = [
    { key: "fetch", icon: "🌐", label: "Download" },
    { key: "parse", icon: "📖", label: "Parse" },
    { key: "eval", icon: "🧠", label: "Evaluate" },
    { key: "done", icon: "✅", label: "Done" },
  ];
  return (
    <div style={{ animation: "hpa-phase-enter 0.45s ease both" }}>
      {/* Spinner + title */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <svg
            className="h-4 w-4 animate-spin text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              className="opacity-75"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            🚀 Analyzing games...
          </p>
          <p className="truncate text-[11px] text-slate-400">
            Lichess · Blitz · 300 games · Depth 12
          </p>
        </div>
        <span
          className="shrink-0 rounded-lg bg-white/[0.06] px-2 py-1 font-mono text-[11px] font-medium text-slate-300"
          style={{ animation: "hpa-fade-in 0.3s ease 1.8s both" }}
        >
          82%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
          style={{
            animation:
              "hpa-progress 3.2s cubic-bezier(0.25,0.46,0.45,0.94) 0.2s both",
          }}
        />
      </div>

      {/* Phase steps */}
      <div className="grid grid-cols-4 gap-1">
        {STEPS.map(({ icon, label }, idx) => {
          const delay = 0.3 + idx * 0.5;
          const isDone = idx < 3;
          return (
            <div
              key={label}
              className="flex flex-col items-center gap-1"
              style={{ animation: `hpa-fade-in 0.4s ease ${delay}s both` }}
            >
              <span className="text-base">{icon}</span>
              <span
                className={`text-[10px] font-medium ${isDone ? "text-emerald-400" : "text-slate-500"}`}
              >
                {label}
              </span>
              {isDone && (
                <span
                  className="h-1 w-4 rounded-full bg-emerald-500"
                  style={{
                    animation: `hpa-check-in 0.3s ease ${delay + 0.2}s both`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Live log */}
      <div className="mt-4 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2.5">
        {[
          { msg: "✓ Downloaded 247 games", delay: 0.5 },
          { msg: "✓ Parsed 12,140 positions", delay: 1.1 },
          { msg: "⚡ Evaluating with Stockfish 18", delay: 1.7 },
        ].map(({ msg, delay }) => (
          <p
            key={msg}
            className="font-mono text-[10px] text-slate-400"
            style={{ animation: `hpa-fade-in 0.4s ease ${delay}s both` }}
          >
            {msg}
          </p>
        ))}
      </div>
    </div>
  );
}

function LeaksPhase() {
  return (
    <div style={{ animation: "hpa-phase-enter 0.45s ease both" }}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Scan Complete
          </p>
          <p className="text-sm font-bold text-white">
            <span className="text-emerald-400">3</span> Opening Leaks Found
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-500">247 games · MagnusCarlsen</p>
          <p className="text-[11px] font-bold text-amber-400">Accuracy: 74%</p>
        </div>
      </div>

      {/* Mini chessboard */}
      <div className="mb-3 flex gap-3">
        <div
          className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-lg border border-white/[0.08]"
          style={{ animation: "hpa-fade-in 0.4s ease 0.3s both" }}
        >
          <Chessboard
            position="rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"
            boardWidth={80}
            arePiecesDraggable={false}
            customDarkSquareStyle={{ backgroundColor: "#2d3a4d" }}
            customLightSquareStyle={{ backgroundColor: "#4a5e7a" }}
            customArrows={[
              ["g1", "f3", "rgba(34,197,94,0.9)"],
              ["d1", "h5", "rgba(239,68,68,0.9)"],
            ]}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-col justify-center gap-1.5">
          {[
            { color: "bg-emerald-500", label: "Best move (Nf3)" },
            { color: "bg-red-500", label: "Your move (Qh5)" },
          ].map(({ color, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-[10px] text-slate-400"
            >
              <span className={`h-2 w-2 rounded-full ${color}`} />
              {label}
            </span>
          ))}
          <span className="mt-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
            −1.17 eval lost
          </span>
        </div>
      </div>

      {/* Leak cards */}
      <div className="space-y-1.5">
        {LEAKS.map(({ opening, variant, games, cp }, i) => (
          <div
            key={opening}
            className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
            style={{
              animation: `hpa-slide-up 0.4s ease ${0.4 + i * 0.18}s both`,
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-[11px] font-semibold text-slate-100">
                {opening}
              </p>
              <p className="truncate text-[9px] text-slate-500">{variant}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
                ×{games}
              </span>
              <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                −{cp.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsPhase() {
  return (
    <div style={{ animation: "hpa-phase-enter 0.45s ease both" }}>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Strength Analysis
      </p>
      <div className="flex gap-4">
        {/* Radar SVG */}
        <div
          className="shrink-0"
          style={{
            animation:
              "hpa-radar 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both",
            transformOrigin: "center",
          }}
        >
          <svg viewBox="0 0 160 160" className="h-[150px] w-[150px]">
            {/* Grid rings */}
            {[0.25, 0.5, 0.75, 1].map((frac) => (
              <polygon
                key={frac}
                points={gridPoly(frac)}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="1"
              />
            ))}
            {/* Axis lines */}
            {AXIS_LINES.map((ax, i) => (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={ax.x2}
                y2={ax.y2}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            ))}
            {/* Data polygon */}
            <polygon
              points={DATA_POLY}
              fill="rgba(34,197,94,0.15)"
              stroke="rgba(34,197,94,0.7)"
              strokeWidth="1.5"
              style={{
                animation: "hpa-radar 0.6s ease 0.3s both",
                transformOrigin: `${CX}px ${CY}px`,
              }}
            />
            {/* Data dots */}
            {RADAR_VALS.map((v, i) => {
              const [x, y] = radarPt(i, v).split(",").map(Number);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={2.5}
                  fill="rgb(52,211,153)"
                  style={{
                    animation: `hpa-check-in 0.3s ease ${0.4 + i * 0.1}s both`,
                  }}
                />
              );
            })}
            {/* Labels */}
            {AXIS_LINES.map((ax, i) => (
              <text
                key={i}
                x={ax.lx}
                y={ax.ly}
                textAnchor="middle"
                fontSize="7"
                fill="rgba(148,163,184,0.9)"
                fontFamily="system-ui, sans-serif"
              >
                {RADAR_LABELS[i]}
              </text>
            ))}
          </svg>
        </div>

        {/* Motifs + stats */}
        <div className="flex flex-1 flex-col justify-center gap-2">
          <div className="mb-1 grid grid-cols-2 gap-2">
            {[
              { label: "Accuracy", val: "74%", color: "text-emerald-400" },
              { label: "Leaks", val: "3", color: "text-red-400" },
              { label: "Tactics missed", val: "18", color: "text-amber-400" },
              { label: "Est. rating", val: "1,640", color: "text-cyan-400" },
            ].map(({ label, val, color }, i) => (
              <div
                key={label}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5"
                style={{
                  animation: `hpa-fade-in 0.35s ease ${0.3 + i * 0.1}s both`,
                }}
              >
                <p className="text-[8px] text-slate-500">{label}</p>
                <p className={`text-xs font-bold ${color}`}>{val}</p>
              </div>
            ))}
          </div>

          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
            Top Patterns
          </p>
          <div className="flex flex-wrap gap-1">
            {MOTIFS.map(({ icon, name, count, cls }, i) => (
              <span
                key={name}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${cls}`}
                style={{
                  animation: `hpa-slide-up 0.35s ease ${0.6 + i * 0.12}s both`,
                }}
              >
                {icon} {name} <span className="opacity-70">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────
export function HeroProductAnimation({ paused }: { paused?: boolean }) {
  const [phase, setPhase] = useState<Phase>("input");
  const [phaseIdx, setPhaseIdx] = useState(0); // key for forcing remount
  const styleInjected = useRef(false);

  // Inject keyframes once
  if (typeof document !== "undefined" && !styleInjected.current) {
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => {
      setPhase((prev) => {
        const nextIdx = (PHASES.indexOf(prev) + 1) % PHASES.length;
        return PHASES[nextIdx];
      });
      setPhaseIdx((k) => k + 1);
    }, PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [phase, paused]);

  const phaseIndex = PHASES.indexOf(phase);

  return (
    <div className="relative select-none">
      {/* Glow behind the card */}
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-violet-500/10 blur-2xl" />

      {/* Browser chrome wrapper */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-slate-900/90 shadow-2xl shadow-black/40 backdrop-blur-sm">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
          <div className="mx-3 flex-1 overflow-hidden rounded-md bg-white/[0.05] px-3 py-1">
            <p className="truncate text-[10px] text-slate-500">firechess.app</p>
          </div>
        </div>

        {/* Phase content */}
        <div className="p-4">
          {phase === "input" && <InputPhase key={phaseIdx} />}
          {phase === "scanning" && <ScanningPhase key={phaseIdx} />}
          {phase === "leaks" && <LeaksPhase key={phaseIdx} />}
          {phase === "insights" && <InsightsPhase key={phaseIdx} />}
        </div>

        {/* Phase indicator dots */}
        <div className="flex items-center justify-center gap-2 border-t border-white/[0.04] px-4 py-3">
          {PHASES.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPhase(p);
                setPhaseIdx((k) => k + 1);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === phaseIndex
                  ? "w-5 bg-emerald-400"
                  : "w-1.5 bg-white/15 hover:bg-white/30"
              }`}
              aria-label={`Go to phase: ${p}`}
            />
          ))}
          <span className="ml-auto text-[9px] font-medium capitalize text-slate-600">
            {phase}
          </span>
        </div>
      </div>
    </div>
  );
}
