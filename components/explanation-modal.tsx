"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Chess } from "chess.js";
import type { PieceSymbol } from "chess.js";
import { Chessboard } from "react-chessboard";
import { EvalBar } from "@/components/eval-bar";
import { useBoardTheme, useShowCoordinates } from "@/lib/use-coins";
import { stockfishClient } from "@/lib/stockfish-client";
import type { PositionExplanation, ThemeCard } from "@/lib/position-explainer";

/* ─────────────── Shared types for all card kinds ─────────────── */

/** Tactic / Endgame structured explanation */
export type SimpleExplanation = {
  type: string;       // "winning" | "punishment" | "best" | "consequence"
  move: string;
  impact: string;
  evalAfter?: string;
  line?: string;
  bestMove?: string;
  context?: string;   // e.g. "Failed Conversion"
};

export type ExplanationModalProps = {
  open: boolean;
  onClose: () => void;
  /** Card category for theming */
  variant: "opening" | "tactic" | "endgame";
  /** Active tab (opening only) */
  activeTab?: "played" | "best" | "db" | null;
  /** Rich explanation data (opening leaks) */
  richExplanation?: PositionExplanation | null;
  /** Simple explanation data (tactics / endgames) */
  simpleExplanation?: SimpleExplanation | null;
  /** Fallback plain-text explanation */
  plainExplanation?: string;
  /** Title shown in modal header */
  title?: string;
  /** Subtitle for extra context */
  subtitle?: string;
  /** Starting FEN for the chessboard */
  fen?: string;
  /** UCI moves to animate on the board */
  uciMoves?: string[];
  /** Board orientation */
  boardOrientation?: "white" | "black";
};

/* ─── Helpers ─── */

function isUci(m: string): boolean { return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m); }

function variantColors(variant: "opening" | "tactic" | "endgame", activeTab?: "played" | "best" | "db" | null) {
  if (variant === "opening") {
    if (activeTab === "best") return { accent: "emerald", border: "border-emerald-500/20", bg: "bg-emerald-500/[0.04]", text: "text-emerald-400", pill: "bg-emerald-500/15 text-emerald-400", grad: "from-emerald-500/[0.06] to-transparent" };
    if (activeTab === "db") return { accent: "blue", border: "border-blue-500/20", bg: "bg-blue-500/[0.04]", text: "text-blue-400", pill: "bg-blue-500/15 text-blue-400", grad: "from-blue-500/[0.06] to-transparent" };
    return { accent: "red", border: "border-red-500/20", bg: "bg-red-500/[0.04]", text: "text-red-400", pill: "bg-red-500/15 text-red-400", grad: "from-red-500/[0.06] to-transparent" };
  }
  if (variant === "tactic") return { accent: "amber", border: "border-amber-500/20", bg: "bg-amber-500/[0.04]", text: "text-amber-400", pill: "bg-amber-500/15 text-amber-400", grad: "from-amber-500/[0.06] to-transparent" };
  return { accent: "sky", border: "border-sky-500/20", bg: "bg-sky-500/[0.04]", text: "text-sky-400", pill: "bg-sky-500/15 text-sky-400", grad: "from-sky-500/[0.06] to-transparent" };
}

function severityClasses(severity: ThemeCard["severity"], variant: "opening" | "tactic" | "endgame") {
  if (severity === "critical") return { border: "border-red-500/20", bg: "bg-red-500/[0.04]", text: "text-red-400" };
  if (severity === "warning") return { border: "border-amber-500/20", bg: "bg-amber-500/[0.04]", text: "text-amber-400" };
  const c = variantColors(variant);
  return { border: c.border, bg: c.bg, text: c.text };
}

function md(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
}

/** Pre-compute animation steps from a starting FEN + UCI moves */
function buildSteps(startFen: string, uciMoves: string[]): { uci: string; san: string; fen: string }[] {
  const steps: { uci: string; san: string; fen: string }[] = [];
  try {
    const chess = new Chess(startFen);
    for (const uci of uciMoves.slice(0, 20)) {
      if (!isUci(uci)) break;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.slice(4, 5) || undefined;
      const r = chess.move({ from, to, promotion: promotion as PieceSymbol | undefined });
      if (!r) break;
      steps.push({ uci, san: r.san, fen: chess.fen() });
    }
  } catch { /* ignore */ }
  return steps;
}

/* ═══════════════════════════════════════════════════════════════════
   ExplanationModal — full-screen modal with chessboard + explanations
   ═══════════════════════════════════════════════════════════════════ */

export function ExplanationModal({
  open,
  onClose,
  variant,
  activeTab,
  richExplanation,
  simpleExplanation,
  plainExplanation,
  title,
  subtitle,
  fen: startFen,
  uciMoves,
  boardOrientation = "white",
}: ExplanationModalProps) {
  /* ── Board theming ── */
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();

  /* ── Animation state ── */
  const steps = useMemo(
    () => (startFen && uciMoves?.length ? buildSteps(startFen, uciMoves) : []),
    [startFen, uciMoves],
  );
  const [stepIdx, setStepIdx] = useState(-1); // -1 = starting position
  const [playing, setPlaying] = useState(false);
  const [evalCp, setEvalCp] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(320);

  const currentFen = stepIdx < 0 ? (startFen ?? "start") : (steps[stepIdx]?.fen ?? startFen ?? "start");
  const hasBoard = !!startFen;

  /* ── Board sizing ── */
  useEffect(() => {
    if (!open) return;
    const el = boardContainerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      // Leave room for eval bar (24 + 12 gap)
      setBoardSize(Math.max(200, Math.min(w - 36, 440)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  /* ── Reset when modal opens/closes or data changes ── */
  useEffect(() => {
    if (open) {
      setStepIdx(-1);
      setPlaying(false);
      setEvalCp(null);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, startFen, uciMoves]);

  /* ── Auto-play timer ── */
  useEffect(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (!playing || steps.length === 0) return;
    const id = setInterval(() => {
      setStepIdx(prev => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    intervalRef.current = id;
    return () => clearInterval(id);
  }, [playing, steps.length]);

  /* ── Eval updates for each step ── */
  useEffect(() => {
    if (!open || !currentFen || currentFen === "start") return;
    let cancelled = false;
    stockfishClient.evaluateFen(currentFen, 8).then(r => {
      if (!cancelled && r) {
        const turn = new Chess(currentFen).turn();
        setEvalCp(turn === "w" ? r.cp : -r.cp);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [open, currentFen]);

  /* ── Close on Escape ── */
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  /* ── Playback controls ── */
  const goFirst = () => { setPlaying(false); setStepIdx(-1); };
  const goPrev = () => { setPlaying(false); setStepIdx(p => Math.max(-1, p - 1)); };
  const goNext = () => { setPlaying(false); setStepIdx(p => Math.min(steps.length - 1, p + 1)); };
  const goLast = () => { setPlaying(false); setStepIdx(steps.length - 1); };
  const togglePlay = () => {
    if (stepIdx >= steps.length - 1) { setStepIdx(-1); setPlaying(true); }
    else setPlaying(p => !p);
  };

  if (!open) return null;

  const colors = variantColors(variant, activeTab);
  const hasRich = !!richExplanation;
  const hasSimple = !!simpleExplanation;
  const headerIcon = variant === "opening"
    ? (activeTab === "best" ? "✓" : activeTab === "db" ? "📊" : "✗")
    : variant === "tactic" ? "⚔️" : "♟️";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/[0.1] bg-slate-950 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        {/* ── Header ── */}
        <div className={`border-b border-white/[0.06] bg-gradient-to-r ${colors.grad} p-5 sm:p-6`}>
          <div className="flex items-center gap-4">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors.pill} text-xl`}>
              {headerIcon}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-white sm:text-xl">
                {title ?? "Move Explanation"}
              </h2>
              {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
            </div>
            {hasRich && richExplanation.evalShift && (
              <div className="text-right hidden sm:block">
                <div className={`text-2xl font-black font-mono tabular-nums ${colors.text}`}>
                  {richExplanation.evalShift}
                </div>
                <p className={`text-xs font-bold ${colors.text} opacity-60`}>eval shift</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Body: Board + Explanations ── */}
        <div className={`${hasBoard ? "grid grid-cols-1 lg:grid-cols-[auto_1fr]" : ""}`}>

          {/* ─── Board Column ─── */}
          {hasBoard && (
            <div className="border-b border-white/[0.06] lg:border-b-0 lg:border-r p-4 sm:p-5 flex flex-col items-center gap-3">
              <div ref={boardContainerRef} className="w-full max-w-[460px]">
                <div className="flex items-start gap-2">
                  <EvalBar evalCp={evalCp} height={boardSize} />
                  <div className="overflow-hidden rounded-xl">
                    <Chessboard
                      id="explanation-modal-board"
                      position={currentFen}
                      arePiecesDraggable={false}
                      boardOrientation={boardOrientation}
                      boardWidth={boardSize}
                      animationDuration={300}
                      customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                      customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                      showBoardNotation={showCoords}
                    />
                  </div>
                </div>
              </div>

              {/* Move list display */}
              {steps.length > 0 && (
                <div className="w-full max-w-[460px] rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {steps.map((s, i) => {
                      const moveNum = (() => {
                        try {
                          const prevFen = i === 0 ? startFen! : steps[i - 1].fen;
                          const turn = new Chess(prevFen).turn();
                          const fullMove = parseInt(prevFen!.split(" ")[5] ?? "1");
                          return turn === "w" ? `${fullMove}.` : (i === 0 || new Chess(steps[i - 1].fen).turn() === "w" ? `${fullMove}...` : null);
                        } catch { return null; }
                      })();
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setPlaying(false); setStepIdx(i); }}
                          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-mono transition-colors ${
                            i === stepIdx
                              ? `${colors.pill} font-bold`
                              : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          {moveNum && <span className="text-slate-500 text-[10px]">{moveNum}</span>}
                          {s.san}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Playback controls */}
              {steps.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={goFirst} disabled={stepIdx <= -1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="11 19 2 12 11 5"/><line x1="22" y1="5" x2="22" y2="19"/></svg>
                  </button>
                  <button type="button" onClick={goPrev} disabled={stepIdx <= -1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button type="button" onClick={togglePlay}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      playing ? `${colors.pill}` : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.12] hover:text-white"
                    }`}>
                    {playing ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="18"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    )}
                  </button>
                  <button type="button" onClick={goNext} disabled={stepIdx >= steps.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button type="button" onClick={goLast} disabled={stepIdx >= steps.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 19 22 12 13 5"/><line x1="2" y1="5" x2="2" y2="19"/></svg>
                  </button>
                  <span className="ml-2 text-[11px] font-mono text-slate-500 tabular-nums">
                    {stepIdx + 1 < 0 ? 0 : stepIdx + 1}/{steps.length}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ─── Explanation Column ─── */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[60vh] lg:max-h-[80vh]">

            {/* ─── Rich Explanation (Opening Leaks) ─── */}
            {hasRich && (
              <>
                {richExplanation.moveDescription && (
                  <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      🎬 What Happened
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-slate-200" dangerouslySetInnerHTML={{
                      __html: md(richExplanation.moveDescription)
                    }} />
                    <p className={`mt-1.5 text-sm font-semibold ${colors.text}`}>
                      {richExplanation.headline}
                    </p>
                  </div>
                )}

                {richExplanation.themeCards && richExplanation.themeCards.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      🏷️ Themes Detected
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {richExplanation.themeCards.map((card, i) => {
                        const sc = severityClasses(card.severity, variant);
                        return (
                          <div
                            key={i}
                            className={`flex items-start gap-2.5 rounded-xl border ${sc.border} ${sc.bg} p-3`}
                          >
                            <span className="mt-0.5 text-lg leading-none">{card.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold ${sc.text}`}>{card.label}</p>
                              {card.description && (
                                <p className="mt-0.5 text-[12px] leading-relaxed text-slate-400">{card.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-500/10 text-sm">💡</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Coaching</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300" dangerouslySetInnerHTML={{
                    __html: md(richExplanation.coaching)
                  }} />
                </div>

                {richExplanation.takeaway && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-base">🎯</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/70">Takeaway</h3>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-amber-300">
                      {richExplanation.takeaway.replace(/\*\*/g, "")}
                    </p>
                  </div>
                )}

                {richExplanation.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {richExplanation.themes.map((theme) => (
                      <span
                        key={theme}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors.border} ${colors.pill}`}
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}

                {richExplanation.observations.length > 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-500/10 text-sm">🔍</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                        Detailed Observations
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {richExplanation.observations.map((obs, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5"
                        >
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                          <p className="text-[12px] leading-relaxed text-slate-400" dangerouslySetInnerHTML={{
                            __html: md(obs)
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ─── Simple Explanation (Tactics / Endgames) ─── */}
            {hasSimple && !hasRich && (
              <>
                <div className={`rounded-xl border ${
                  simpleExplanation.type === "winning" || simpleExplanation.type === "best"
                    ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                    : "border-red-500/20 bg-red-500/[0.04]"
                } p-4`}>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    🎬 What Happened
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-base font-bold ${
                      simpleExplanation.type === "winning" || simpleExplanation.type === "best"
                        ? "text-emerald-300" : "text-red-300"
                    }`}>
                      {simpleExplanation.type === "winning" || simpleExplanation.type === "best" ? "✓ " : "✗ "}
                      <strong className="text-white">{simpleExplanation.move}</strong>
                    </p>
                    {simpleExplanation.evalAfter && (
                      <span className="shrink-0 rounded-lg bg-emerald-500/15 px-2.5 py-0.5 text-sm font-mono font-bold tabular-nums text-emerald-400">
                        {simpleExplanation.evalAfter}
                      </span>
                    )}
                  </div>
                  <p className={`mt-1.5 text-sm ${
                    simpleExplanation.type === "winning" || simpleExplanation.type === "best"
                      ? "text-emerald-400/80" : "text-red-400/80"
                  }`}>
                    {simpleExplanation.impact}
                  </p>
                </div>

                {simpleExplanation.context && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/70">{simpleExplanation.context}</h3>
                    </div>
                    <p className="text-sm text-amber-300">
                      You had a winning position but failed to convert the advantage.
                    </p>
                  </div>
                )}

                {simpleExplanation.bestMove && (
                  <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-base">🎯</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/70">
                        {simpleExplanation.type === "punishment" ? "Winning Move" : "Better Move"}
                      </h3>
                    </div>
                    <p className="text-base font-bold text-emerald-300">
                      {simpleExplanation.bestMove}
                    </p>
                  </div>
                )}

                {simpleExplanation.line && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-500/10 text-sm">📋</span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                        {simpleExplanation.type === "winning" || simpleExplanation.type === "best" ? "Best Line" : "After Your Move"}
                      </h3>
                    </div>
                    <p className="text-sm font-mono leading-loose text-slate-300 break-words">
                      {simpleExplanation.line}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ─── Plain text fallback ─── */}
            {!hasRich && !hasSimple && plainExplanation && (
              <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
                <p className="text-sm leading-relaxed text-slate-300">{plainExplanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
