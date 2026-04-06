"use client";

import { useEffect, useRef, useState } from "react";
import { Chessboard } from "@/components/chessboard-compat";
import { Chess } from "chess.js";
import type { ChaosModifier, ChaosState } from "@/lib/chaos-chess";

interface MoveEntry {
  from: string;
  to: string;
  timestamp?: number;
}

interface ReplayData {
  id: string;
  hostColor: "white" | "black";
  chaosState: ChaosState | null;
  moveHistory: MoveEntry[];
  createdAt: string | null;
}

function buildPositions(moves: MoveEntry[]): string[] {
  const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const fens: string[] = [INITIAL];
  const chess = new Chess();
  for (const m of moves) {
    try {
      chess.move({ from: m.from, to: m.to });
      fens.push(chess.fen());
    } catch {
      // Illegal move (e.g. chaos-only moves) — keep last FEN and continue
      fens.push(fens[fens.length - 1]);
    }
  }
  return fens;
}

function ModifierPill({ mod }: { mod: ChaosModifier }) {
  const tierColor: Record<string, string> = {
    common: "border-slate-500/30 bg-slate-700/30 text-slate-300",
    rare: "border-blue-500/30 bg-blue-900/30 text-blue-300",
    epic: "border-purple-500/30 bg-purple-900/30 text-purple-300",
    legendary: "border-amber-500/30 bg-amber-900/20 text-amber-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tierColor[mod.tier] ?? tierColor.common}`}
      title={mod.description}
    >
      {mod.icon} {mod.name}
    </span>
  );
}

export default function ChaosReplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [boardWidth, setBoardWidth] = useState(480);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/chaos/replay/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
            return;
          }
          setReplayData(data as ReplayData);
          const fens = buildPositions(
            Array.isArray(data.moveHistory) ? data.moveHistory : [],
          );
          setPositions(fens);
          setCurrentIdx(0);
        })
        .catch(() => setError("Failed to load replay."));
    });
  }, [params]);

  // Responsive board width
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (boardRef.current) {
        const w = Math.min(boardRef.current.clientWidth, 520);
        setBoardWidth(w);
      }
    });
    if (boardRef.current) obs.observe(boardRef.current);
    return () => obs.disconnect();
  }, [replayData]);

  // Auto-play
  useEffect(() => {
    if (autoPlaying) {
      autoRef.current = setInterval(() => {
        setCurrentIdx((i) => {
          if (i >= positions.length - 1) {
            setAutoPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, 800);
    } else {
      if (autoRef.current) clearInterval(autoRef.current);
    }
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [autoPlaying, positions.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrentIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setCurrentIdx((i) => Math.min(positions.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [positions.length]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center">
        <div className="max-w-sm">
          <p className="text-2xl">♟️</p>
          <h1 className="mt-4 text-lg font-bold text-white">
            Replay not available
          </h1>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <a
            href="/chaos"
            className="mt-4 inline-block rounded-xl bg-purple-600 px-5 py-2 text-sm font-bold text-white hover:bg-purple-500"
          >
            Play Chaos Chess
          </a>
        </div>
      </div>
    );
  }

  if (!replayData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
          Loading replay…
        </div>
      </div>
    );
  }

  const cs = replayData.chaosState;
  const hostColor = replayData.hostColor;
  const hostMods = cs?.playerModifiers ?? [];
  const guestMods = cs?.aiModifiers ?? [];
  const totalMoves = positions.length - 1;
  const currentFen = positions[currentIdx] ?? positions[0];

  const lastMove =
    currentIdx > 0 ? replayData.moveHistory[currentIdx - 1] : null;

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = {
      backgroundColor: "rgba(255,210,0,0.3)",
    };
    customSquareStyles[lastMove.to] = {
      backgroundColor: "rgba(255,210,0,0.45)",
    };
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <a
            href="/chaos"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to Chaos Chess
          </a>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500">
            Replay · {totalMoves} move{totalMoves !== 1 ? "s" : ""}
          </span>
          {replayData.createdAt && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-600">
                {new Date(replayData.createdAt).toLocaleDateString()}
              </span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_220px]">
          {/* Board column */}
          <div>
            <div ref={boardRef} className="w-full">
              <Chessboard
                position={currentFen}
                boardOrientation={hostColor}
                boardWidth={boardWidth}
                arePiecesDraggable={false}
                customSquareStyles={customSquareStyles}
                customBoardStyle={{ borderRadius: "12px", overflow: "hidden" }}
              />
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setAutoPlaying(false);
                  setCurrentIdx(0);
                }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                title="Go to start"
              >
                ⏮
              </button>
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                title="Previous move (←)"
              >
                ◀
              </button>
              <button
                onClick={() => setAutoPlaying((p) => !p)}
                className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                  autoPlaying
                    ? "border-purple-500/40 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                    : "border-white/10 text-slate-300 hover:text-white"
                }`}
              >
                {autoPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                onClick={() =>
                  setCurrentIdx((i) => Math.min(positions.length - 1, i + 1))
                }
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                title="Next move (→)"
              >
                ▶
              </button>
              <button
                onClick={() => {
                  setAutoPlaying(false);
                  setCurrentIdx(positions.length - 1);
                }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                title="Go to end"
              >
                ⏭
              </button>
            </div>

            {/* Move counter */}
            <p className="mt-2 text-center text-xs text-slate-500">
              Move {currentIdx} / {totalMoves}
            </p>
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-4">
            {/* Host modifiers */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                {hostColor === "white" ? "⬜" : "⬛"} Host ({hostColor})
                Modifiers
              </h3>
              {hostMods.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {hostMods.map((m) => (
                    <ModifierPill key={m.id} mod={m} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600">No modifiers</p>
              )}
            </div>

            {/* Guest modifiers */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                {hostColor === "white" ? "⬛" : "⬜"} Guest (
                {hostColor === "white" ? "black" : "white"}) Modifiers
              </h3>
              {guestMods.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {guestMods.map((m) => (
                    <ModifierPill key={m.id} mod={m} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600">No modifiers</p>
              )}
            </div>

            {/* Share / CTA */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-center">
              <p className="text-xs font-bold text-purple-300">
                ⚡ Play Chaos Chess
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Draft wild modifiers and outplay your friends
              </p>
              <a
                href="/chaos"
                className="mt-3 block w-full rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors"
              >
                Play Now — Free
              </a>
            </div>

            {/* Copy link */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="w-full rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              📋 Copy Replay Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
