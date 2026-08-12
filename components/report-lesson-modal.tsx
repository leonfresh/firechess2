"use client";

import { useState, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { playSound } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";
import { stockfishClient } from "@/lib/stockfish-client";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import { useBoardSize } from "@/lib/use-board-size";
import type {
  TextSlide,
  InteractSlide,
  ChoiceSlide,
  ReplaySlide,
  ReportLesson,
} from "@/lib/generate-lesson";

/* ── Mini lesson player ───────────────────────────────────────────── */

function ReportLessonPlayer({
  lesson,
  onClose,
}: {
  lesson: ReportLesson;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const slide = lesson.slides[idx];
  const total = lesson.slides.length;

  const next = useCallback(() => {
    if (idx + 1 >= total) {
      setDone(true);
      playSound("correct");
      earnCoins("study_task");
    } else {
      setIdx((i) => i + 1);
    }
  }, [idx, total]);

  // Keyboard: ArrowRight/Space/Enter → next
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, done]);

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <span className="text-4xl">✓</span>
        <h2 className="text-xl font-bold text-white">Pattern learned</h2>
        <p className="text-sm text-slate-400">{lesson.title}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.1] transition-colors"
        >
          Back to report
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Progress bar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-1 gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= idx ? "bg-white" : "bg-white/[0.08]"}`}
            />
          ))}
        </div>
        <span className="text-[11px] tabular-nums text-slate-500">{idx + 1}/{total}</span>
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div key={idx} className="mx-auto w-full" style={{ maxWidth: "min(100%, 900px)" }}>
          {slide.kind === "text" && <TextSlideView slide={slide} onNext={next} />}
          {slide.kind === "interact" && <InteractSlideView slide={slide} onNext={next} />}
          {slide.kind === "choice" && <ChoiceSlideView slide={slide} onNext={next} />}
          {slide.kind === "replay" && <ReplaySlideView slide={slide} onNext={next} />}
        </div>
      </div>
    </div>
  );
}

/* ── Text slide ────────────────────────────────────────────────────── */

function TextSlideView({ slide, onNext }: { slide: TextSlide; onNext: () => void }) {
  const { ref, size } = useBoardSize(480);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {slide.fen && (
        <div ref={ref} className="shrink-0 mx-auto lg:mx-0">
          <Chessboard
            id={`lesson-text-${slide.heading}`}
            position={slide.fen}
            boardWidth={size}
            boardOrientation={slide.orientation ?? "white"}
            arePiecesDraggable={false}
            customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
            customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
            customPieces={customPieces}
            customBoardStyle={{ borderRadius: "12px", overflow: "hidden" }}
            customArrows={slide.arrows?.map(([from, to]) => [from, to, "rgba(245,158,11,0.8)"]) as any}
            customSquareStyles={Object.fromEntries(
              (slide.highlights ?? []).map((sq) => [sq, { backgroundColor: "rgba(245,158,11,0.15)" }]),
            )}
          />
        </div>
      )}

      <div className="flex-1 space-y-4">
        <h2 className="text-xl font-bold text-white">{slide.heading}</h2>
        <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">{slide.body}</p>
        {slide.insight && (
          <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/70">Key insight</p>
            <p className="mt-1 text-sm text-amber-200/90">{slide.insight}</p>
          </div>
        )}
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

/* ── Interact slide ────────────────────────────────────────────────── */

function InteractSlideView({ slide, onNext }: { slide: InteractSlide; onNext: () => void }) {
  const { ref, size } = useBoardSize(560);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const [played, setPlayed] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [evalCp, setEvalCp] = useState<number | null>(null);

  const fen = slide.fen;
  const correct = slide.correctMoves ?? [];
  const wrong = slide.wrongMoves ?? [];
  const orientation = slide.orientation ?? (fen.includes(" b ") ? "black" : "white");

  // Evaluate the position on mount
  useEffect(() => {
    stockfishClient.evaluateFen(fen, 12).then((e) => {
      if (e?.cp != null) setEvalCp(orientation === "black" ? -e.cp : e.cp);
    });
  }, [fen, orientation]);

  const onDrop = useCallback(
    (from: string, to: string, _piece: string) => {
      if (result) return;
      const uci = `${from}${to}`;
      setPlayed(uci);
      setResult(correct.includes(uci) ? "correct" : "wrong");
      if (correct.includes(uci)) playSound("correct");
      else playSound("wrong");
    },
    [result, correct],
  );

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-center max-w-lg">
        <h2 className="text-xl font-bold text-white">{slide.heading}</h2>
        <p className="mt-2 text-sm text-slate-400">{slide.instruction}</p>
      </div>

      <div className="flex items-start gap-3">
        {evalCp != null && <EvalBar evalCp={evalCp} height={size} />}
        <div ref={ref}>
          <Chessboard
            id={`lesson-interact-${slide.heading}`}
            position={fen}
            boardWidth={size - (evalCp != null ? 28 : 0)}
            boardOrientation={orientation}
            arePiecesDraggable={!result}
            onPieceDrop={onDrop as any}
            customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
            customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
            customPieces={customPieces}
            customBoardStyle={{ borderRadius: "12px", overflow: "hidden" }}
          />
        </div>
      </div>

      {result && (
        <div className={`w-full max-w-md rounded-xl border p-4 text-center ${result === "correct" ? "border-emerald-500/20 bg-emerald-500/[0.06]" : "border-red-500/20 bg-red-500/[0.06]"}`}>
          <p className={`text-sm font-semibold ${result === "correct" ? "text-emerald-400" : "text-red-400"}`}>
            {result === "correct" ? "Correct!" : "Not quite"}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {result === "correct" ? slide.correctExplanation : slide.wrongExplanation}
          </p>
          <button
            type="button"
            onClick={onNext}
            className="mt-3 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Choice slide ──────────────────────────────────────────────────── */

function ChoiceSlideView({ slide, onNext }: { slide: ChoiceSlide; onNext: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const isCorrect = selected === slide.correctIndex;

  const pick = (i: number) => {
    if (selected != null) return;
    setSelected(i);
    if (i === slide.correctIndex) playSound("correct");
    else playSound("wrong");
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center max-w-lg">
        <h2 className="text-xl font-bold text-white">{slide.heading}</h2>
        <p className="mt-2 text-sm text-slate-400">{slide.question}</p>
      </div>

      <div className="w-full max-w-md space-y-2">
        {slide.choices.map((choice, i) => {
          const isSelected = selected === i;
          const showCorrect = selected != null && i === slide.correctIndex;
          const showWrong = isSelected && !isCorrect;

          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={selected != null}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                showCorrect
                  ? "border-emerald-500/30 bg-emerald-500/[0.1] text-emerald-200"
                  : showWrong
                    ? "border-red-500/30 bg-red-500/[0.1] text-red-200"
                    : isSelected
                      ? "border-white/20 bg-white/[0.08] text-white"
                      : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-white/[0.15] hover:bg-white/[0.06]"
              }`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {selected != null && (
        <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
          <p className="text-sm text-slate-300">{slide.explanation}</p>
          <button
            type="button"
            onClick={onNext}
            className="mt-3 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Replay slide ──────────────────────────────────────────────────── */

function ReplaySlideView({ slide, onNext }: { slide: ReplaySlide; onNext: () => void }) {
  const { ref, size } = useBoardSize(560);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const [moveIdx, setMoveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const fen = useCallback(() => {
    if (!slide.moves.length || moveIdx === 0) return slide.startFen ?? "start";
    const c = new Chess(slide.startFen);
    for (let m = 0; m < moveIdx && m < slide.moves.length; m++) {
      try { c.move(slide.moves[m]); } catch { break; }
    }
    return c.fen();
  }, [slide.startFen, slide.moves, moveIdx]);

  // Auto-play
  useEffect(() => {
    if (!playing) return;
    if (moveIdx >= slide.moves.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setMoveIdx((i) => i + 1), slide.intervalMs ?? 900);
    return () => clearTimeout(t);
  }, [playing, moveIdx, slide.moves.length, slide.intervalMs]);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-center max-w-lg">
        <h2 className="text-xl font-bold text-white">{slide.heading}</h2>
        <p className="mt-2 text-sm text-slate-400">{slide.body}</p>
      </div>

      <div ref={ref}>
        <Chessboard
          id={`lesson-replay-${slide.heading}`}
          position={fen()}
          boardWidth={size}
          boardOrientation={slide.orientation ?? "white"}
          arePiecesDraggable={false}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          customPieces={customPieces}
          customBoardStyle={{ borderRadius: "12px", overflow: "hidden" }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMoveIdx(Math.max(0, moveIdx - 1))}
          disabled={moveIdx === 0}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.06] disabled:opacity-30"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06]"
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          type="button"
          onClick={() => setMoveIdx(Math.min(slide.moves.length, moveIdx + 1))}
          disabled={moveIdx >= slide.moves.length}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.06] disabled:opacity-30"
        >
          ▶
        </button>
        <span className="text-[11px] text-slate-500 tabular-nums">
          {moveIdx}/{slide.moves.length}
        </span>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
      >
        Continue →
      </button>
    </div>
  );
}

/* ── Modal wrapper ─────────────────────────────────────────────────── */

export function ReportLessonModal({
  open,
  lesson,
  onClose,
}: {
  open: boolean;
  lesson: ReportLesson | null;
  onClose: () => void;
}) {
  if (!open || !lesson) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a]">
      <ReportLessonPlayer lesson={lesson} onClose={onClose} />
    </div>
  );
}
