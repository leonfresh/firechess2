"use client";

/**
 * Engine Assist panel — the "legal cheat" widget.
 *
 * Shows what the engine would play against the opponent's last move: top 3
 * lines with evals, the engine's expected continuation, and the motifs the
 * top move creates. The parent owns all fetching/tracking; this component is
 * presentational.
 *
 * Honesty rule: every claim here traces to engine output or a deterministic
 * board check (detectTacticalThemes via explainMoves). Nothing is invented.
 */

import { useMemo } from "react";
import type { LocalEngineLine } from "@/lib/stockfish-client";
import { formatEval } from "@/lib/engine-lines";
import { explainMoves } from "@/lib/position-explainer";
import { pvToSan } from "@/lib/engine-lines";

const THEME_ICONS: Record<string, string> = {
  "Hanging Piece": "💀",
  "Hangs Material": "💀",
  "Trapped Piece": "🪤",
  "Weakening Move": "🏚️",
  "Walks Into Fork": "🍴",
  "Walks Into Pin": "📌",
  "Back-Rank Mate Threat": "🏰",
  "Back Rank": "🏰",
  "Exposed King": "🔓",
  "King Exposure": "👑",
  "Losing Exchange": "📉",
  "Passive Retreat": "🐢",
  "Knight Fork": "♞",
  Skewer: "🎯",
  Pin: "📌",
  "Discovered Attack": "⚡",
  "X-Ray Attack": "🔭",
  Check: "➕",
  "Develops Piece": "🌱",
  Development: "🌱",
  "Central Control": "🎯",
  Castling: "🏰",
  "Attacks Piece": "⚔️",
  "Defends Piece": "🛡️",
  Capture: "⚔️",
  Promotion: "👑",
  "Pawn Advance": "➡️",
};

const RANKS = ["#1", "#2", "#3"];

export type EngineAssistPanelProps = {
  fen: string;
  open: boolean;
  lines: LocalEngineLine[] | null;
  loading: boolean;
  depth: number;
  peeksUsed: number;
  /** null = unlimited peeks */
  peekBudget: number | null;
  activeUci: string | null;
  onToggle: () => void;
  onSelectLine: (uci: string) => void;
};

export function EngineAssistPanel({
  fen,
  open,
  lines,
  loading,
  depth,
  peeksUsed,
  peekBudget,
  activeUci,
  onToggle,
  onSelectLine,
}: EngineAssistPanelProps) {
  const peeksLeft = peekBudget === null ? null : Math.max(0, peekBudget - peeksUsed);
  const canPeek = peeksLeft === null || peeksLeft > 0;

  /** Motifs the engine's top move creates — deterministic board checks only. */
  const topThemes = useMemo(() => {
    if (!open || !lines?.length) return [] as string[];
    const top = lines[0];
    if (!top?.bestMove) return [];
    try {
      const insight = explainMoves(fen, top.bestMove, top.bestMove, 0, top.cp, top.cp);
      return insight.played.themes.filter((t) => !/^(Quiet|Best Move|Book)/i.test(t)).slice(0, 4);
    } catch {
      return [];
    }
  }, [open, lines, fen]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#1e1a24] bg-[#121015]/70 backdrop-blur-xl [box-shadow:inset_0_1px_0_rgba(255,255,255,0.03)]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#1e1a24] px-4 py-3">
        <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-[#ff5a1f] to-[#ff8c42] shadow-[0_0_12px_rgba(255,90,31,0.35)]" />
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#ff8c42]">
          Engine Assist
        </span>
        <span className="ml-auto text-[11px] text-[#565061]">
          {peeksLeft === null
            ? `${peeksUsed} peek${peeksUsed === 1 ? "" : "s"}`
            : `${peeksLeft} of ${peekBudget} peeks left`}
        </span>
      </div>

      {!open ? (
        <div className="flex flex-col gap-3 p-4">
          <p className="text-xs leading-relaxed text-[#8d8696]">
            See what the engine would play against the opponent&apos;s last move —
            top 3 lines, evals, and the board arrow. Every move you make while the
            panel is open is logged as <span className="text-[#ff8c42]">assisted</span>;
            your engine-free moves are logged separately.
          </p>
          <button
            onClick={onToggle}
            disabled={!canPeek}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              canPeek
                ? "bg-gradient-to-r from-[#ff5a1f] to-[#ff8c42] text-[#070608] shadow-[0_0_20px_rgba(255,90,31,0.25)] hover:brightness-110"
                : "cursor-not-allowed border border-[#1e1a24] bg-white/[0.02] text-[#565061]"
            }`}
          >
            {canPeek ? "Show engine moves" : "No peeks left — play this one yourself"}
          </button>
          <p className="text-center text-[11px] text-[#565061]">
            Depth {depth} · position pre-analysed, opens instantly
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3">
          {loading && !lines?.length ? (
            <div className="px-1 py-3 text-xs text-[#8d8696]">Engine thinking…</div>
          ) : !lines?.length ? (
            <div className="px-1 py-3 text-xs text-[#8d8696]">
              No engine lines for this position.
            </div>
          ) : (
            lines.slice(0, 3).map((line, i) => {
              const san = pvToSan(fen, line.pvMoves).slice(0, 4);
              const active = activeUci != null && line.bestMove === activeUci;
              return (
                <button
                  key={`${line.bestMove ?? "line"}-${i}`}
                  onClick={() => line.bestMove && onSelectLine(line.bestMove)}
                  className={`flex flex-col gap-1 rounded-xl border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-[#ff5a1f]/40 bg-[#ff5a1f]/[0.08]"
                      : "border-[#1e1a24] bg-white/[0.02] hover:border-[#ff5a1f]/25 hover:bg-[#ff5a1f]/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold ${
                        i === 0 ? "text-[#ff8c42]" : "text-[#565061]"
                      }`}
                    >
                      {RANKS[i]}
                    </span>
                    <span className="flex-1 truncate font-mono text-sm text-[#f0edf2]">
                      {san.join(" ") || "—"}
                    </span>
                    <span
                      className={`font-mono text-xs ${
                        line.mateIn != null
                          ? "text-[#ff5a1f]"
                          : i === 0
                            ? "text-[#ff8c42]"
                            : "text-[#8d8696]"
                      }`}
                    >
                      {formatEval(line)}
                    </span>
                  </div>
                  {i === 0 && topThemes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {topThemes.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#8d8696]"
                        >
                          {THEME_ICONS[t] ? `${THEME_ICONS[t]} ` : ""}
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          )}

          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-[10px] text-[#565061]">
              Click a line to draw its arrow
            </span>
            <button
              onClick={onToggle}
              className="rounded-lg border border-[#1e1a24] px-2.5 py-1 text-[11px] text-[#8d8696] transition-colors hover:border-[#ff5a1f]/25 hover:text-[#ff8c42]"
            >
              Hide
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
