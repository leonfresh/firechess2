"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

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
      style={{ width: 22, height }}
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
        className={`absolute inset-x-0 text-center text-[9px] font-bold leading-none ${
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

export function HeroDemoBoard() {
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
    if (!autoplay) return;
    const interval = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % scenarios.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [autoplay, scenarios.length]);

  const goNext = () => { setAutoplay(false); setIndex((prev) => (prev + 1) % scenarios.length); };
  const goPrev = () => { setAutoplay(false); setIndex((prev) => (prev - 1 + scenarios.length) % scenarios.length); };

  const customSquare = ((props: any) => {
    const square = props?.square as string | undefined;
    const targetSq = current.mistakeArrow?.[1];
    const showBadge = square === targetSq;
    return (
      <div style={props?.style} className="relative h-full w-full">
        {props?.children}
        {showBadge && (
          <span
            className="pointer-events-none absolute right-0.5 top-0.5 z-[40] rounded px-1 py-[1px] text-[8px] font-bold text-white shadow"
            style={{ backgroundColor: badgeColor(current.badge) }}
          >
            {current.badge}
          </span>
        )}
      </div>
    );
  }) as any;

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
    <div className="mx-auto w-full max-w-[580px]">
      <article className="glass-card-hover group relative overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1fr_230px]">

          {/* Board side */}
          <div className="relative border-b border-white/[0.04] bg-white/[0.01] p-4 md:border-b-0 md:border-r">
            <div className="flex items-start gap-2">
              <MiniEvalBar evalCp={current.evalBefore} height={320} />
              <div className="relative overflow-hidden rounded-xl">
                <Chessboard
                  id="hero-demo-board"
                  position={current.fen}
                  arePiecesDraggable={false}
                  boardWidth={296}
                  animationDuration={0}
                  customSquare={customSquare}
                  customSquareStyles={customSquareStyles}
                  customArrows={arrows as any[]}
                  boardOrientation={boardOrientation}
                  customDarkSquareStyle={{ backgroundColor: "#779952" }}
                  customLightSquareStyle={{ backgroundColor: "#edeed1" }}
                />
              </div>
            </div>

            {/* Arrow legend */}
            <div className="mt-2 flex items-center gap-3 pl-[26px]">
              <span className="flex items-center gap-1 text-[9px] text-slate-500">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Best
              </span>
              <span className="flex items-center gap-1 text-[9px] text-slate-500">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Yours
              </span>
              {current.dbArrow && (
                <span className="flex items-center gap-1 text-[9px] text-slate-500">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> DB pick
                </span>
              )}
            </div>
          </div>

          {/* Info side */}
          <div className="space-y-3 p-4">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">{current.title}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: badgeColor(current.badge) }}
                    >
                      {current.tag}
                    </span>
                    {current.repeatedHabit && (
                      <span className="rounded-md bg-fuchsia-500/15 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-400">Repeated Habit</span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-slate-400">
                    You reached this position <span className="font-semibold text-slate-200">{current.reachCount}</span> times
                    and played <span className="font-mono text-red-400">{current.playedSan}</span>{" "}
                    <span className="font-semibold text-slate-200">{current.moveCount}</span> times.
                  </p>
                </div>

                {/* DB-approved banner */}
                {current.dbApproved && (
                  <div className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/[0.06] px-2.5 py-1.5">
                    <span className="text-sm">📚</span>
                    <span className="text-[9px] font-medium text-indigo-400">Known Opening Line</span>
                  </div>
                )}

                {/* Stat grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
                    <p className="text-[8px] font-medium uppercase tracking-wider text-slate-500">Eval Loss</p>
                    <p className="text-sm font-bold text-red-400">{formatEval(current.cpLoss)}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
                    <p className="text-[8px] font-medium uppercase tracking-wider text-slate-500">Eval Before</p>
                    <p className="text-sm font-bold text-slate-200">{formatEval(current.evalBefore)}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
                    <p className="text-[8px] font-medium uppercase tracking-wider text-slate-500">Eval After</p>
                    <p className="text-sm font-bold text-slate-200">{formatEval(current.evalAfter)}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
                    <p className="text-[8px] font-medium uppercase tracking-wider text-slate-500">Best Move</p>
                    <p className="text-sm font-bold font-mono text-emerald-400">{current.bestSan}</p>
                  </div>
                </div>

          </div>
        </div>

        {/* Bottom controls bar */}
        <div className="flex items-center gap-2 border-t border-white/[0.04] px-4 py-2.5">
              <button type="button" className="btn-secondary flex h-7 items-center gap-1 px-2.5 text-[11px]" onClick={goPrev}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                Prev
              </button>
              <button type="button" className="btn-secondary flex h-7 items-center gap-1 px-2.5 text-[11px]" onClick={goNext}>
                Next
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button
                type="button"
                className={`flex h-7 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-medium transition-all duration-200 ${
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
              <div className="ml-auto flex items-center gap-1">
                {scenarios.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setAutoplay(false); setIndex(i); }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index % scenarios.length ? "w-4 bg-emerald-400" : "w-1.5 bg-white/10 hover:bg-white/20"
                    }`}
                  />
                ))}
              </div>
        </div>
      </article>
    </div>
  );
}
