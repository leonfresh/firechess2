"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

type DemoScenario = {
  opening: string;
  subtitle: string;
  fen: string;
  bestMove: string | null;
  playedMove: string;
  bestArrow: [string, string, string?] | null;
  mistakeArrow: [string, string, string?];
  badge: "Inaccuracy" | "Mistake" | "Blunder";
  note: string;
};

const SCENARIOS: DemoScenario[] = [
  {
    opening: "Repeated Opening Leak",
    subtitle: "Inaccuracy",
    fen: "r1bqkbnr/pp1ppppp/2n5/2p5/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3",
    bestMove: "Nf3",
    playedMove: "Qh5",
    bestArrow: null,
    mistakeArrow: ["d1", "h5", "rgba(239,68,68,0.95)"],
    badge: "Inaccuracy",
    note: "Played Qh5; best was Nf3. Seen 4x."
  },
  {
    opening: "Repeated Opening Leak",
    subtitle: "Inaccuracy",
    fen: "rnbqkb1r/pppppppp/8/8/3Pn2B/8/PPP1PPPP/RN1QKBNR b KQkq - 4 3",
    bestMove: "g5",
    playedMove: "g6",
    bestArrow: null,
    mistakeArrow: ["g7", "g6", "rgba(239,68,68,0.95)"],
    badge: "Inaccuracy",
    note: "Played g6; best was g5. Seen 3x."
  },
  {
    opening: "Repeated Opening Leak",
    subtitle: "Repeated Habit",
    fen: "r2qkb1r/ppp2ppp/2bp1n2/4p3/3PP3/2N2N2/PPP2PPP/R1BQK2R w KQkq - 0 7",
    bestMove: "Qd3",
    playedMove: "d5",
    bestArrow: null,
    mistakeArrow: ["d4", "d5", "rgba(239,68,68,0.95)"],
    badge: "Inaccuracy",
    note: "Played d5; best was Qd3. Seen 3x."
  },
  {
    opening: "Repeated Opening Leak",
    subtitle: "Repeated Habit",
    fen: "rnbqkb1r/pppp1ppp/4pn2/8/3PP3/2N5/PPP2PPP/R1BQKBNR b KQkq - 0 3",
    bestMove: "d5",
    playedMove: "Bb4",
    bestArrow: null,
    mistakeArrow: ["f8", "b4", "rgba(239,68,68,0.95)"],
    badge: "Inaccuracy",
    note: "Played Bb4; best was d5. Seen 5x."
  },
  {
    opening: "Repeated Opening Leak",
    subtitle: "Repeated Habit",
    fen: "rnbqkb1r/ppp1pppp/5n2/3P4/8/8/PPPP1PPP/RNBQKBNR w KQkq - 1 3",
    bestMove: "d4",
    playedMove: "Nc3",
    bestArrow: null,
    mistakeArrow: ["b1", "c3", "rgba(239,68,68,0.95)"],
    badge: "Inaccuracy",
    note: "Played Nc3; best was d4. Seen 6x."
  },
  {
    opening: "Repeated Opening Leak",
    subtitle: "Repeated Habit",
    fen: "r1bqk1nr/pppp1ppp/2n5/1Bb1p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    bestMove: "c3",
    playedMove: "Bxc6",
    bestArrow: null,
    mistakeArrow: ["b5", "c6", "rgba(239,68,68,0.95)"],
    badge: "Inaccuracy",
    note: "Played Bxc6; best was c3. Seen 5x."
  },
  {
    opening: "Repeated Opening Leak",
    subtitle: "Repeated Habit • Missed Capture",
    fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
    bestMove: "Nxe5",
    playedMove: "Bb5",
    bestArrow: null,
    mistakeArrow: ["f1", "b5", "rgba(239,68,68,0.95)"],
    badge: "Inaccuracy",
    note: "Played Bb5; best was Nxe5. Seen 3x."
  }
];

function moveToArrow(fen: string, move: string | null | undefined, color: string): [string, string, string?] | null {
  if (!move) return null;
  try {
    const chess = new Chess(fen);
    let result = null as ReturnType<Chess["move"]> | null;

    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move)) {
      result = chess.move({
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        promotion: (move.slice(4, 5).toLowerCase() || undefined) as "q" | "r" | "b" | "n" | undefined
      });
    } else {
      result = chess.move(move);
    }

    if (!result?.from || !result?.to) return null;
    return [result.from, result.to, color];
  } catch {
    return null;
  }
}

function badgeColor(label: DemoScenario["badge"]): string {
  if (label === "Blunder") return "#ef4444";
  if (label === "Mistake") return "#f59e0b";
  return "#f97316";
}

export function HeroDemoBoard() {
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const scenarios = useMemo(() => {
    return SCENARIOS.map((scenario) => ({
      ...scenario,
      bestArrow: moveToArrow(scenario.fen, scenario.bestMove, "rgba(34,197,94,0.95)"),
      mistakeArrow:
        moveToArrow(scenario.fen, scenario.playedMove, "rgba(239,68,68,0.95)") ?? scenario.mistakeArrow
    }));
  }, []);

  const current = useMemo(() => scenarios[index % scenarios.length], [index, scenarios]);

  useEffect(() => {
    setIndex(0);
  }, [scenarios]);

  useEffect(() => {
    if (!autoplay) return;

    const interval = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % scenarios.length);
    }, 3800);

    return () => window.clearInterval(interval);
  }, [autoplay, scenarios.length]);

  const goNext = () => {
    setAutoplay(false);
    setIndex((prev) => (prev + 1) % scenarios.length);
  };

  const goPrev = () => {
    setAutoplay(false);
    setIndex((prev) => (prev - 1 + scenarios.length) % scenarios.length);
  };

  const customSquare = ((props: any) => {
    const square = props?.square as string | undefined;
    const showBadge = square === current.mistakeArrow[1];

    return (
      <div style={props?.style} className="relative h-full w-full">
        {props?.children}
        {showBadge ? (
          <span
            className="pointer-events-none absolute right-0.5 top-0.5 z-[40] rounded px-1 py-[1px] text-[9px] font-bold text-white shadow"
            style={{ backgroundColor: badgeColor(current.badge) }}
          >
            {current.badge}
          </span>
        ) : null}
      </div>
    );
  }) as any;

  return (
    <div className="mx-auto w-full max-w-[400px]">
      <div className="glass-card group relative overflow-hidden p-4">
        {/* Subtle glow behind board */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] to-transparent" />

        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">{current.opening}</span>
            <span className="tag-amber text-[10px]">{current.subtitle}</span>
          </div>

          <div className="overflow-hidden rounded-xl">
            <Chessboard
              id="hero-demo-board"
              position={current.fen}
              arePiecesDraggable={false}
              boardWidth={368}
              animationDuration={0}
              customSquare={customSquare}
              customArrows={[
                ...(current.bestArrow ? [current.bestArrow as any] : []),
                current.mistakeArrow as any
              ]}
              customDarkSquareStyle={{ backgroundColor: "#779952" }}
              customLightSquareStyle={{ backgroundColor: "#edeed1" }}
            />
          </div>

          <p className="mt-3 h-8 overflow-hidden text-xs leading-4 text-slate-400"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical"
            }}
          >
            {current.note}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary flex h-8 items-center gap-1.5 px-3 text-xs"
              onClick={goPrev}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Prev
            </button>
            <button
              type="button"
              className="btn-secondary flex h-8 items-center gap-1.5 px-3 text-xs"
              onClick={goNext}
            >
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
            <div className="ml-auto flex items-center gap-1">
              {scenarios.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index % scenarios.length ? "w-4 bg-emerald-400" : "w-1.5 bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
