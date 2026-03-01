"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates } from "@/lib/use-coins";

/* ── Mini eval bar (matches the real EvalBar look) ── */
function MiniEvalBar({ evalCp, height }: { evalCp: number; height: number }) {
  const whitePercent = Math.min(98, Math.max(2, 50 + evalCp / 14));
  const label =
    Math.abs(evalCp) >= 10000
      ? evalCp > 0 ? "M" : "-M"
      : `${evalCp > 0 ? "+" : ""}${(evalCp / 100).toFixed(1)}`;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg"
      style={{ width: 26, height }}
    >
      {/* Black side */}
      <div
        className="absolute inset-x-0 top-0 bg-[#312e2b] transition-all duration-500"
        style={{ height: `${100 - whitePercent}%` }}
      />
      {/* White side */}
      <div
        className="absolute inset-x-0 bottom-0 bg-[#f0d9b5] transition-all duration-500"
        style={{ height: `${whitePercent}%` }}
      />
      {/* Label */}
      <span
        className={`absolute inset-x-0 text-center text-[10px] font-bold leading-none ${
          evalCp >= 0 ? "bottom-1 text-[#312e2b]" : "top-1 text-[#f0d9b5]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Scenario carousel ── */

type DemoScenario = {
  title: string;
  tag: string;
  tagColor: "amber" | "indigo";
  fen: string;
  bestMove: string;
  playedMove: string;
  playedSan: string;
  bestSan: string;
  badge: "Mistake" | "Sideline";
  evalBefore: number;   // cp from white POV
  evalAfter: number;    // cp from white POV
  cpLoss: number;
  reachCount: number;
  moveCount: number;
  repeatedHabit: boolean;
  dbApproved: boolean;
  dbPick?: { san: string; uci: string };
};

const SCENARIOS: DemoScenario[] = [
  {
    title: "Repeated Opening Leak",
    tag: "Mistake",
    tagColor: "amber",
    fen: "r1bqkbnr/pp1ppppp/2n5/2p5/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3",
    bestMove: "g1f3",
    playedMove: "d1h5",
    playedSan: "Qh5",
    bestSan: "Nf3",
    badge: "Mistake",
    evalBefore: 17,
    evalAfter: -100,
    cpLoss: 117,
    reachCount: 3,
    moveCount: 1,
    repeatedHabit: false,
    dbApproved: false,
  },
  {
    title: "Repeated Opening Leak",
    tag: "Mistake",
    tagColor: "amber",
    fen: "rn2kbnr/ppp1pppp/8/q7/8/2N2Q1P/PPPP1PP1/R1B1KB1R b KQkq - 0 6",
    bestMove: "a5c7",
    playedMove: "b8c6",
    playedSan: "Nc6",
    bestSan: "c6",
    badge: "Mistake",
    evalBefore: 90,
    evalAfter: 205,
    cpLoss: 115,
    reachCount: 3,
    moveCount: 3,
    repeatedHabit: true,
    dbApproved: false,
  },
  {
    title: "Repeated Opening Leak",
    tag: "Mistake",
    tagColor: "amber",
    fen: "rnbqkbnr/1p1p1ppp/p3p3/2p5/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
    bestMove: "f3e5",
    playedMove: "c4e2",
    playedSan: "Be2",
    bestSan: "Ne5",
    badge: "Mistake",
    evalBefore: 15,
    evalAfter: -93,
    cpLoss: 108,
    reachCount: 3,
    moveCount: 1,
    repeatedHabit: false,
    dbApproved: false,
  },
  {
    title: "Offbeat Sideline",
    tag: "Sideline",
    tagColor: "indigo",
    fen: "r1bqk1nr/pppp1ppp/2n5/1Bb1p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    bestMove: "c2c3",
    playedMove: "b5c6",
    playedSan: "Bxc6",
    bestSan: "c3",
    badge: "Sideline",
    evalBefore: 53,
    evalAfter: -3,
    cpLoss: 56,
    reachCount: 4,
    moveCount: 3,
    repeatedHabit: true,
    dbApproved: true,
  },
  {
    title: "Offbeat Sideline",
    tag: "Sideline",
    tagColor: "indigo",
    fen: "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
    bestMove: "e4e5",
    playedMove: "b1c3",
    playedSan: "Nc3",
    bestSan: "e5",
    badge: "Sideline",
    evalBefore: 83,
    evalAfter: 27,
    cpLoss: 56,
    reachCount: 5,
    moveCount: 3,
    repeatedHabit: false,
    dbApproved: true,
  },
  {
    title: "Offbeat Sideline",
    tag: "Sideline",
    tagColor: "indigo",
    fen: "rnbqkb1r/ppp1pppp/5n2/3P4/8/8/PPPP1PPP/RNBQKBNR w KQkq - 1 3",
    bestMove: "d2d4",
    playedMove: "b1c3",
    playedSan: "Nc3",
    bestSan: "d4",
    badge: "Sideline",
    evalBefore: 65,
    evalAfter: 11,
    cpLoss: 54,
    reachCount: 3,
    moveCount: 3,
    repeatedHabit: true,
    dbApproved: true,
    dbPick: { san: "Bb5+", uci: "f1b5" },
  },
];

function moveToArrow(fen: string, uci: string, color: string): [string, string, string?] | null {
  if (!uci || uci.length < 4) return null;
  try {
    const chess = new Chess(fen);
    const result = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci.slice(4, 5).toLowerCase() || undefined) as "q" | "r" | "b" | "n" | undefined,
    });
    if (!result?.from || !result?.to) return null;
    return [result.from, result.to, color];
  } catch {
    return null;
  }
}

function formatEval(cp: number): string {
  if (Math.abs(cp) >= 10000) return cp > 0 ? "#" : "-#";
  return `${cp >= 0 ? "+" : ""}${(cp / 100).toFixed(2)}`;
}

function badgeColor(badge: DemoScenario["badge"]): string {
  return badge === "Mistake" ? "#f59e0b" : "#818cf8";
}

export function HeroDemoBoard({ paused }: { paused?: boolean }) {
  const { ref: heroBoardRef, size: heroBoardSize } = useBoardSize(380);
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const scenarios = useMemo(() => {
    return SCENARIOS.map((s) => ({
      ...s,
      bestArrow: moveToArrow(s.fen, s.bestMove, "rgba(34,197,94,0.95)"),
      mistakeArrow: moveToArrow(s.fen, s.playedMove, "rgba(239,68,68,0.95)"),
      dbArrow: s.dbPick ? moveToArrow(s.fen, s.dbPick.uci, "rgba(59,130,246,0.85)") : null,
    }));
  }, []);

  const current = useMemo(() => scenarios[index % scenarios.length], [index, scenarios]);

  useEffect(() => { setIndex(0); }, [scenarios]);

  useEffect(() => {
    if (!autoplay || paused) return;
    const interval = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % scenarios.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [autoplay, paused, scenarios.length]);

  const goNext = () => { setAutoplay(false); setIndex((prev) => (prev + 1) % scenarios.length); };
  const goPrev = () => { setAutoplay(false); setIndex((prev) => (prev - 1 + scenarios.length) % scenarios.length); };

  const customSquare = useMemo(() => {
    const targetSq = current.mistakeArrow?.[1];
    const badge = current.badge;
    const Sq = (props: any) => {
      const square = props?.square as string | undefined;
      const showBadge = square === targetSq;
      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {showBadge && (
            <span
              className="pointer-events-none absolute right-0.5 top-0.5 z-[40] rounded px-1 py-[1px] text-[8px] font-bold text-white shadow"
              style={{ backgroundColor: badgeColor(badge) }}
            >
              {badge}
            </span>
          )}
        </div>
      );
    };
    return Sq;
  }, [current.mistakeArrow, current.badge]) as any;

  // Custom highlighted squares for the bad move (red tint)
  const customSquareStyles = useMemo(() => {
    if (!current.mistakeArrow) return {};
    return {
      [current.mistakeArrow[0]]: { backgroundColor: "rgba(239, 68, 68, 0.3)" },
      [current.mistakeArrow[1]]: { backgroundColor: "rgba(239, 68, 68, 0.45)" },
    };
  }, [current]);

  const arrows = useMemo(() => {
    const arr: [string, string, string?][] = [];
    if (current.bestArrow) arr.push(current.bestArrow);
    if (current.mistakeArrow) arr.push(current.mistakeArrow);
    if (current.dbArrow) arr.push(current.dbArrow);
    return arr;
  }, [current]);

  const boardOrientation = current.fen.includes(" b ") ? "black" : "white";

  return (
    <div className="mx-auto w-full max-w-[740px]">
      <article className="glass-card-hover group relative overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1fr_280px]">

          {/* Board side */}
          <div ref={heroBoardRef} className="relative border-b border-white/[0.04] bg-white/[0.01] p-4 sm:p-5 md:border-b-0 md:border-r">
            <div className="flex items-start gap-2.5">
              <MiniEvalBar evalCp={current.evalBefore} height={heroBoardSize} />
              <div className="relative overflow-hidden rounded-xl shadow-lg shadow-black/30">
                <Chessboard
                  id="hero-demo-board"
                  position={current.fen}
                  arePiecesDraggable={false}
                  boardWidth={heroBoardSize}
                  animationDuration={0}
                  customSquare={customSquare}
                  customSquareStyles={customSquareStyles}
                  customArrows={arrows as any[]}
                  boardOrientation={boardOrientation}
                  customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                  customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                  showBoardNotation={showCoords}
                />
              </div>
            </div>

            {/* Arrow legend */}
            <div className="mt-3 flex items-center gap-4 pl-[30px]">
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Best move
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> Your move
              </span>
              {current.dbArrow && (
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" /> DB pick
                </span>
              )}
            </div>
          </div>

          {/* Info side */}
          <div className="flex flex-col gap-3 p-4 sm:p-5">
                {/* Header badge row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: badgeColor(current.badge) }}
                  >
                    {current.tag}
                  </span>
                  {current.repeatedHabit && (
                    <span className="flex items-center gap-1 rounded-lg bg-fuchsia-500/15 px-2 py-1 text-[10px] font-bold text-fuchsia-400">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                      Repeated
                    </span>
                  )}
                  {current.dbApproved && (
                    <span className="flex items-center gap-1 rounded-lg bg-indigo-500/15 px-2 py-1 text-[10px] font-bold text-indigo-400">
                      📚 Known Line
                    </span>
                  )}
                </div>

                {/* KEY INSIGHT — big highlighted callout */}
                <div className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Pattern Detected</p>
                  <p className="mt-1.5 text-[13px] leading-snug text-slate-200">
                    You reached this position{" "}
                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-bold text-amber-400">{current.reachCount}×</span>{" "}
                    and played{" "}
                    <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 font-mono font-bold text-red-400">{current.playedSan}</span>{" "}
                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-bold text-amber-400">{current.moveCount}×</span>
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">Better:</span>
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-sm font-bold text-emerald-400">{current.bestSan}</span>
                  </div>
                </div>

                {/* Eval comparison bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Eval Shift</span>
                    <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-400">{formatEval(current.cpLoss)} lost</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-center">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Before</p>
                      <p className="text-base font-bold text-slate-200">{formatEval(current.evalBefore)}</p>
                    </div>
                    <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] px-3 py-2 text-center">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">After</p>
                      <p className="text-base font-bold text-red-400">{formatEval(current.evalAfter)}</p>
                    </div>
                  </div>
                </div>

          </div>
        </div>

        {/* Bottom controls bar */}
        <div className="flex items-center gap-2.5 border-t border-white/[0.04] px-4 sm:px-5 py-3">
              <button type="button" className="btn-secondary flex h-8 items-center gap-1 px-3 text-xs" onClick={goPrev}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                Prev
              </button>
              <button type="button" className="btn-secondary flex h-8 items-center gap-1 px-3 text-xs" onClick={goNext}>
                Next
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button
                type="button"
                className={`flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all duration-200 ${
                  autoplay
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-glow-sm"
                    : "border-white/[0.1] bg-white/[0.04] text-slate-400 hover:bg-white/[0.06]"
                }`}
                onClick={() => setAutoplay((prev) => !prev)}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${autoplay ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`} />
                {autoplay ? "Auto" : "Paused"}
              </button>
              {/* Dots indicator */}
              <div className="ml-auto flex items-center gap-1.5">
                {scenarios.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setAutoplay(false); setIndex(i); }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === index % scenarios.length ? "w-5 bg-emerald-400" : "w-2 bg-white/10 hover:bg-white/20"
                    }`}
                  />
                ))}
              </div>
        </div>
      </article>
    </div>
  );
}
