"use client";

import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";

/**
 * HeroBoard — looping "scan → radar → takeaway" report preview.
 *
 * Phase 1 (scan): a real 8-ply tactic plays on the board while leak cards
 *   fill in beside it.
 * Phase 2 (radar): board swaps for the strengths radar, axes draw in.
 * Phase 3 (takeaway): the AI-coach verdict card.
 * Loops cleanly: full reset, then replay.
 */

type Phase = "scan" | "radar" | "takeaway";
const PHASE_MS: Record<Phase, number> = { scan: 9600, radar: 4200, takeaway: 4200 };

// ── Scan script ───────────────────────────────────────────────────────
type Step = {
  san: string;
  arrows?: [string, string, string][];
  leak?: { label: string; sub: string; sev: "red" | "amber" | "orange" };
};
const SCRIPT: Step[] = [
  { san: "e4" },
  { san: "e5" },
  { san: "Nf3", arrows: [["g1", "f3", "rgba(34,197,94,0.85)"]] },
  { san: "Nc6" },
  {
    san: "Bc4",
    leak: { label: "Italian Game reached", sub: "×14 games · your score 43%", sev: "orange" },
  },
  {
    san: "Nd4",
    arrows: [["c6", "d4", "rgba(239,68,68,0.85)"]],
    leak: { label: "Nd4?! — blunder", sub: "−2.1 · misses Nxe5 tactic", sev: "red" },
  },
  {
    san: "Nxe5",
    arrows: [["f3", "e5", "rgba(34,197,94,0.85)"]],
    leak: { label: "Motif: loose knight", sub: "recurs in 6 of 14 games", sev: "amber" },
  },
];
const TICK_MS = 1200;

const SEV_CLS: Record<string, string> = {
  red: "border-red-500/25 bg-red-500/[0.06] text-red-400",
  amber: "border-amber-500/25 bg-amber-500/[0.06] text-amber-400",
  orange: "border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] text-[#ff8c42]",
};

// ── Radar geometry ────────────────────────────────────────────────────
const CX = 80, CY = 80, R = 58;
const RADAR_VALS = [0.42, 0.66, 0.34, 0.55, 0.38]; // Openings, Tactics, Endgames, Time, Patterns
const RADAR_LABELS = ["Openings", "Tactics", "Endgames", "Time", "Patterns"];
const LABEL_OFFSETS: [number, number][] = [
  [0, -14], [14, -4], [12, 10], [-12, 10], [-14, -4],
];
function radarPt(i: number, val: number): string {
  const a = -Math.PI / 2 + ((2 * Math.PI) / 5) * i;
  return `${(CX + R * val * Math.cos(a)).toFixed(1)},${(CY + R * val * Math.sin(a)).toFixed(1)}`;
}
const GRID = [0.25, 0.5, 0.75, 1].map((f) =>
  Array.from({ length: 5 }, (_, i) => radarPt(i, f)).join(" "),
);
const DATA_POLY = RADAR_VALS.map((v, i) => radarPt(i, v)).join(" ");
const AXES = RADAR_VALS.map((_, i) => {
  const a = -Math.PI / 2 + ((2 * Math.PI) / 5) * i;
  return {
    x2: CX + R * Math.cos(a),
    y2: CY + R * Math.sin(a),
    lx: CX + (R + 14) * Math.cos(a) + LABEL_OFFSETS[i][0],
    ly: CY + (R + 14) * Math.sin(a) + LABEL_OFFSETS[i][1],
  };
});

export function HeroBoard() {
  const [phase, setPhase] = useState<Phase>("scan");
  const [fen, setFen] = useState(() => new Chess().fen());
  const [ply, setPly] = useState(0);
  const [leaks, setLeaks] = useState<Step["leak"][]>([]);

  // Scan phase: play the tactic move-by-move, then advance the phase.
  useEffect(() => {
    if (phase !== "scan") return;
    const game = new Chess();
    setFen(game.fen());
    setPly(0);
    setLeaks([]);
    let cancelled = false;
    let i = 0;
    const iv = setInterval(() => {
      if (cancelled) return;
      if (i >= SCRIPT.length) {
        clearInterval(iv);
        setTimeout(() => !cancelled && setPhase("radar"), 1600);
        return;
      }
      const step = SCRIPT[i];
      try {
        game.move(step.san);
        setFen(game.fen());
        setPly(i + 1);
      } catch { /* skip illegal */ }
      if (step.leak) setLeaks((l) => [...l, step.leak!]);
      i++;
    }, TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [phase]);

  // Radar / takeaway phases: timed advance, loop back to scan.
  useEffect(() => {
    if (phase === "scan") return;
    const t = setTimeout(
      () => setPhase(phase === "radar" ? "takeaway" : "scan"),
      PHASE_MS[phase],
    );
    return () => clearTimeout(t);
  }, [phase]);

  const activeArrows = (
    ply > 0 && ply <= SCRIPT.length ? SCRIPT[ply - 1].arrows : undefined
  ) as [string, string, string][] | undefined;

  return (
    <div className="relative flex min-h-[300px] w-full items-center justify-center gap-4">
      {/* ── Scan phase ── */}
      {phase === "scan" && (
        <>
          <div className="relative z-[1] w-[min(300px,72vw)] shrink-0 overflow-hidden rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]">
            <Chessboard
              position={fen}
              boardWidth={300}
              arePiecesDraggable={false}
              animationDuration={300}
              customDarkSquareStyle={{ backgroundColor: "#779952" }}
              customLightSquareStyle={{ backgroundColor: "#edeed1" }}
              customArrows={activeArrows}
            />
          </div>
          <div className="relative z-[1] hidden w-[168px] flex-col justify-center gap-2 sm:flex">
            {leaks.length === 0 && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#565061]">
                scanning<span className="nl3-pulse-dot">…</span>
              </p>
            )}
            {leaks.map((l, i) => (
              <div
                key={`${l!.label}-${i}`}
                className={`animate-fade-in-up rounded-[10px] border px-2.5 py-2 ${SEV_CLS[l!.sev]}`}
              >
                <p className="text-[11px] font-bold leading-tight">{l!.label}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-[#8d8696]">{l!.sub}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Radar phase ── */}
      {phase === "radar" && (
        <div className="animate-fade-in-up relative z-[1] flex w-full items-center justify-center gap-6">
          <svg viewBox="0 0 160 160" className="h-[260px] w-[260px]">
            {GRID.map((pts) => (
              <polygon key={pts} points={pts} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            ))}
            {AXES.map((a, i) => (
              <g key={i}>
                <line x1={CX} y1={CY} x2={a.x2} y2={a.y2} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                <text x={a.lx} y={a.ly} textAnchor="middle" fill="#8d8696" fontSize="8.5" fontWeight="600">
                  {RADAR_LABELS[i]}
                </text>
              </g>
            ))}
            <polygon
              points={DATA_POLY}
              fill="rgba(255,90,31,0.14)"
              stroke="#ff5a1f"
              strokeWidth="1.5"
              style={{
                transformOrigin: "center",
                animation: "nl3-radar-in 0.7s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            />
          </svg>
          <div className="hidden flex-col gap-2 sm:flex">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#565061]">
              Strengths radar
            </p>
            {RADAR_LABELS.map((l, i) => (
              <div key={l} className="flex items-center gap-2 text-[11px]">
                <span className="w-[64px] text-[#8d8696]">{l}</span>
                <div className="h-1.5 w-[72px] overflow-hidden rounded-full bg-[#1e1a24]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ff5a1f] to-[#ff8c42]"
                    style={{ width: `${RADAR_VALS[i] * 100}%` }}
                  />
                </div>
                <span className="font-semibold text-[#ff8c42]">{Math.round(RADAR_VALS[i] * 100)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Takeaway phase ── */}
      {phase === "takeaway" && (
        <div className="animate-fade-in-up relative z-[1] mx-auto w-full max-w-[420px] rounded-[14px] border border-[#ff5a1f]/20 bg-[#121015] p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#ff5a1f]/[0.12] text-sm">🤖</span>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#565061]">
              AI coach · biggest takeaway
            </p>
          </div>
          <p className="text-[15px] font-semibold leading-snug text-white">
            Your endgame conversion is 41% —{" "}
            <span className="text-[#ff5a1f]">18 points below</span> players at
            your rating.
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-[#8d8696]">
            Fixing this one leak is worth roughly{" "}
            <strong className="text-white">+120 rating</strong>. Drill the 6
            rook-ending positions below — they came from your own games.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ff5a1f] px-3.5 py-2 text-[12.5px] font-semibold text-white">
            Start the drill →
          </div>
        </div>
      )}

      {/* Phase dots */}
      <div className="absolute bottom-2 left-1/2 z-[2] flex -translate-x-1/2 gap-1.5">
        {(["scan", "radar", "takeaway"] as Phase[]).map((p) => (
          <span
            key={p}
            className={`h-1 rounded-full transition-all duration-300 ${
              phase === p ? "w-4 bg-[#ff5a1f]" : "w-1 bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
