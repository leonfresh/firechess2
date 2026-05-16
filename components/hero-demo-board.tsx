"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { useBoardSize } from "@/lib/use-board-size";
import {
  useBoardTheme,
  useShowCoordinates,
  useCustomPieces,
} from "@/lib/use-coins";
import type { RepeatedOpeningLeak } from "@/lib/types";

/* ── Mini eval bar (matches the real EvalBar look) ── */
function MiniEvalBar({ evalCp, height }: { evalCp: number; height: number }) {
  const whitePercent = Math.min(98, Math.max(2, 50 + evalCp / 14));
  const label =
    Math.abs(evalCp) >= 10000
      ? evalCp > 0
        ? "M"
        : "-M"
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
  evalBefore: number; // cp from white POV
  evalAfter: number; // cp from white POV
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

function moveToArrow(
  fen: string,
  move: string,
  color: string,
): [string, string, string?] | null {
  if (!move) return null;
  try {
    const chess = new Chess(fen);
    // Try UCI first
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
      const result = chess.move({
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        promotion: (move.slice(4, 5).toLowerCase() || undefined) as
          | "q"
          | "r"
          | "b"
          | "n"
          | undefined,
      });
      if (result?.from && result?.to) return [result.from, result.to, color];
    }
    // Fall back to SAN
    const result = chess.move(move);
    if (!result?.from || !result?.to) return null;
    return [result.from, result.to, color];
  } catch {
    return null;
  }
}

/** Convert a move (UCI or SAN) to SAN notation for display */
function toSan(fen: string, move: string | null): string | null {
  if (!move) return null;
  try {
    const chess = new Chess(fen);
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
      const result = chess.move({
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        promotion: (move.slice(4, 5).toLowerCase() || undefined) as
          | "q"
          | "r"
          | "b"
          | "n"
          | undefined,
      });
      return result?.san ?? null;
    }
    const result = chess.move(move);
    return result?.san ?? null;
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

/** Convert user report leaks into demo scenarios */
function leaksToScenarios(leaks: RepeatedOpeningLeak[]): DemoScenario[] {
  // Pick the most interesting leaks — mix of mistakes and sidelines
  const mistakes = leaks
    .filter((l) => !l.dbApproved && l.cpLoss >= 30)
    .sort((a, b) => b.cpLoss - a.cpLoss);
  const sidelines = leaks
    .filter((l) => l.dbApproved)
    .sort((a, b) => b.reachCount - a.reachCount);

  const picked: RepeatedOpeningLeak[] = [];
  // Alternate between mistakes and sidelines, up to 6 total
  const mMax = Math.min(mistakes.length, 4);
  const sMax = Math.min(sidelines.length, 3);
  let mi = 0,
    si = 0;
  while (picked.length < 6 && (mi < mMax || si < sMax)) {
    if (mi < mMax) picked.push(mistakes[mi++]);
    if (picked.length < 6 && si < sMax) picked.push(sidelines[si++]);
  }

  return picked
    .map((l): DemoScenario | null => {
      const playedSan = toSan(l.fenBefore, l.userMove);
      const bestSan = toSan(l.fenBefore, l.bestMove);
      if (!playedSan || !bestSan) return null;

      const isSideline = !!l.dbApproved;
      return {
        title: isSideline ? "Offbeat Sideline" : "Repeated Opening Leak",
        tag: isSideline ? "Sideline" : "Mistake",
        tagColor: isSideline ? "indigo" : "amber",
        fen: l.fenBefore,
        bestMove: l.bestMove ?? "",
        playedMove: l.userMove,
        playedSan,
        bestSan,
        badge: isSideline ? "Sideline" : "Mistake",
        evalBefore: l.evalBefore,
        evalAfter: l.evalAfter,
        cpLoss: l.cpLoss,
        reachCount: l.reachCount,
        moveCount: l.moveCount,
        repeatedHabit: l.reachCount > 0 && l.moveCount / l.reachCount >= 0.7,
        dbApproved: !!l.dbApproved,
      };
    })
    .filter((s): s is DemoScenario => s !== null);
}

export function HeroDemoBoard({
  paused,
  userLeaks,
}: {
  paused?: boolean;
  userLeaks?: RepeatedOpeningLeak[];
}) {
  const { ref: heroBoardRef, size: heroBoardSize } = useBoardSize(300);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const scenarios = useMemo(() => {
    const base =
      (userLeaks?.length ? leaksToScenarios(userLeaks) : []).length > 0
        ? leaksToScenarios(userLeaks!)
        : SCENARIOS;
    return base.map((s) => ({
      ...s,
      bestArrow: moveToArrow(s.fen, s.bestMove, "rgba(34,197,94,0.95)"),
      mistakeArrow: moveToArrow(s.fen, s.playedMove, "rgba(239,68,68,0.95)"),
      dbArrow: s.dbPick
        ? moveToArrow(s.fen, s.dbPick.uci, "rgba(59,130,246,0.85)")
        : null,
    }));
  }, [userLeaks]);

  const current = useMemo(
    () => scenarios[index % scenarios.length],
    [index, scenarios],
  );

  useEffect(() => {
    setIndex(0);
  }, [scenarios]);

  useEffect(() => {
    if (!autoplay || paused) return;
    const interval = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % scenarios.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [autoplay, paused, scenarios.length]);

  const goNext = () => {
    setAutoplay(false);
    setIndex((prev) => (prev + 1) % scenarios.length);
  };
  const goPrev = () => {
    setAutoplay(false);
    setIndex((prev) => (prev - 1 + scenarios.length) % scenarios.length);
  };

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
    <article className="w-full overflow-hidden rounded-[1.7rem] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(7,11,28,0.88),rgba(10,16,36,0.94)_48%,rgba(29,18,49,0.92))] shadow-[0_34px_90px_-52px_rgba(125,211,252,0.45)] backdrop-blur-sm sm:grid sm:grid-cols-[auto_1fr]">
      {/* ── Left column: board ── */}
      <div ref={heroBoardRef} className="p-2.5 sm:border-r sm:border-white/[0.05] sm:p-3">
        <div className="flex items-start gap-1.5">
          <MiniEvalBar evalCp={current.evalBefore} height={heroBoardSize} />
          <div className="relative min-w-0 overflow-hidden rounded-[1.15rem] bg-[linear-gradient(180deg,rgba(7,11,28,0.96),rgba(30,43,90,0.88)_60%,rgba(236,72,153,0.26))] p-1 shadow-2xl shadow-black/40 ring-1 ring-white/[0.08]">
            <Chessboard
              id="hero-demo-board"
              position={current.fen}
              arePiecesDraggable={false}
              boardWidth={heroBoardSize}
              animationDuration={0}
              customSquareStyles={customSquareStyles}
              customArrows={arrows as any[]}
              boardOrientation={boardOrientation}
              customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
              customLightSquareStyle={{
                backgroundColor: boardTheme.lightSquare,
              }}
              showBoardNotation={showCoords}
              customPieces={customPieces}
            />
          </div>
        </div>
      </div>

      {/* ── Right column: info strip + controls ── */}
      <div className="flex min-w-0 flex-col">
        {/* Info strip */}
        <div className="flex-1 border-t border-white/[0.05] px-2.5 py-2 sm:border-t-0 sm:px-3 sm:py-3">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white"
              style={{ backgroundColor: badgeColor(current.badge) }}
            >
              {current.tag}
            </span>
            {current.repeatedHabit && (
              <span className="flex items-center gap-1 rounded-md bg-fuchsia-500/15 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-400">
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 014-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
                Repeated
              </span>
            )}
            {current.dbApproved && (
              <span className="rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400">
                📚 Known Line
              </span>
            )}
            {/* Eval delta pushed right */}
            <span className="ml-auto rounded-md bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400 tabular-nums">
              {formatEval(current.cpLoss)} lost
            </span>
          </div>

          {/* Title */}
          <p className="mt-2 text-[11px] font-semibold leading-snug text-slate-200">
            {current.title}
          </p>

          {/* Pattern line */}
          <p className="mt-1.5 text-[10px] leading-snug text-slate-300">
            <span className="rounded bg-amber-500/15 px-1 font-bold text-amber-300">
              {current.reachCount}×
            </span>
            {" reach · "}
            <span className="rounded bg-red-500/15 px-1 font-mono font-bold text-red-300">
              {current.playedSan}
            </span>
            {" vs "}
            <span className="rounded bg-emerald-500/15 px-1 font-mono font-bold text-emerald-300">
              {current.bestSan}
            </span>
          </p>

          {/* Eval before/after — inline chips */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-slate-400 tabular-nums">
              {formatEval(current.evalBefore)}
            </span>
            <svg
              className="h-3 w-3 shrink-0 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-red-400 tabular-nums">
              {formatEval(current.evalAfter)}
            </span>
            {/* Legend */}
            <span className="ml-auto flex items-center gap-2 text-[8px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Best
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                Played
              </span>
            </span>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center gap-1.5 border-t border-white/[0.05] px-2.5 py-1.5 sm:px-3">
          <button
            type="button"
            className="btn-secondary flex h-6 items-center gap-1 px-2 text-[10px]"
            onClick={goPrev}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Prev
          </button>
          <button
            type="button"
            className="btn-secondary flex h-6 items-center gap-1 px-2 text-[10px]"
            onClick={goNext}
          >
            Next
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            type="button"
            className={`flex h-6 items-center gap-1.5 rounded-lg border px-2 text-[10px] font-medium transition-all duration-200 ${
              autoplay
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-white/[0.08] bg-white/[0.03] text-slate-500 hover:text-slate-300"
            }`}
            onClick={() => setAutoplay((prev) => !prev)}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${autoplay ? "animate-pulse bg-emerald-400" : "bg-slate-600"}`}
            />
            {autoplay ? "Auto" : "Paused"}
          </button>
          <div className="ml-auto flex items-center gap-1">
            {scenarios.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setAutoplay(false);
                setIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index % scenarios.length
                  ? "w-4 bg-emerald-400"
                  : "w-1.5 bg-white/[0.08] hover:bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
    </article>
  );
}
