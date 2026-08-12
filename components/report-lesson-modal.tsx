"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { playSound } from "@/lib/sounds";
import { earnCoins } from "@/lib/coins";
import { stockfishClient } from "@/lib/stockfish-client";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        next();
      }
      if (e.key === "Escape" && !done) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, done, onClose]);

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#14532d] bg-[#0c1a12] text-3xl">✓</div>
        <h2 className="text-xl font-semibold tracking-tight text-[#e4e4e7]">Pattern learned</h2>
        <p className="text-sm text-[#8b8b93]">{lesson.title}</p>
        <button type="button" onClick={onClose} className="rounded-xl bg-[#111113] px-6 py-2.5 text-sm font-medium text-[#a1a1aa] hover:bg-[#161618] transition-colors">
          Back to report
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      <div className="flex items-center gap-4 border-b border-[#161618] px-4 py-3">
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5c5c64] hover:text-[#e4e4e7] hover:bg-[#111113] transition-colors shrink-0" title="Exit lesson">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <div className="flex flex-1 gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= idx ? "bg-[#e4e4e7]" : "bg-[#1f1f22]"}`}/>
          ))}
        </div>
        <span className="text-[11px] tabular-nums text-[#5c5c64] shrink-0 font-medium">{idx + 1}/{total}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:flex lg:items-center lg:justify-center lg:overflow-hidden lg:py-2">
        <div key={idx} className="lesson-slide my-auto w-full lg:flex lg:items-center" style={{ maxWidth: "min(100%, 1400px)" }}>
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
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 lg:h-full lg:flex-row lg:items-center lg:gap-10">
      {slide.fen && (
        <div className="w-full min-w-0 flex justify-center lg:w-[54%] lg:shrink-0">
          <Chessboard id={`lesson-text-${slide.heading}`} position={slide.fen} boardOrientation={slide.orientation ?? "white"} arePiecesDraggable={false}
            customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }} customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
            customPieces={customPieces} customBoardStyle={{ borderRadius: "12px", overflow: "hidden" }} />
        </div>
      )}
      <div className="flex w-full min-w-0 flex-col items-center gap-4 text-center lg:w-[46%] lg:max-h-full lg:overflow-y-auto lg:items-start lg:text-left lg:pr-1">
        <h2 className="text-xl font-semibold tracking-tight leading-tight text-[#e4e4e7] lg:text-2xl">{slide.heading}</h2>
        <p className="text-sm leading-6 text-[#a1a1aa] lg:text-[15px] lg:leading-7 whitespace-pre-line">{slide.body}</p>
        {slide.insight && (
          <div className="w-full rounded-xl border border-[#1f1f22] bg-[#111113] px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#5c5c64]">Key insight</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#a1a1aa]">{slide.insight}</p>
          </div>
        )}
        <button type="button" onClick={onNext} className="mt-2 rounded-xl bg-[#111113] px-6 py-2.5 text-sm font-medium text-[#a1a1aa] hover:bg-[#161618] transition-colors">Continue →</button>
      </div>
    </div>
  );
}

/* ── Interact slide ────────────────────────────────────────────────── */

function InteractSlideView({ slide, onNext }: { slide: InteractSlide; onNext: () => void }) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const [played, setPlayed] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [evalCp, setEvalCp] = useState<number | null>(null);
  const [continuation, setContinuation] = useState<string[]>([]);
  const [contIdx, setContIdx] = useState(-1);
  const [showingCont, setShowingCont] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fen = slide.fen;
  const correct = slide.correctMoves ?? [];
  const orientation = slide.orientation ?? (fen.includes(" b ") ? "black" : "white");

  // Eval bar
  useEffect(() => {
    stockfishClient.evaluateFen(fen, 12).then((e) => {
      if (e?.cp != null) setEvalCp(orientation === "black" ? -e.cp : e.cp);
    });
  }, [fen, orientation]);

  // Auto-play continuation
  useEffect(() => {
    if (!showingCont || contIdx >= continuation.length) return;
    timerRef.current = setTimeout(() => setContIdx((i) => i + 1), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [showingCont, contIdx, continuation.length]);

  const displayFen = (() => {
    if (!showingCont || contIdx < 0) return fen;
    const c = new Chess(fen);
    const firstCorrect = correct[0];
    if (firstCorrect) {
      try {
        const parsed = firstCorrect.length === 4 ? { from: firstCorrect.slice(0,2), to: firstCorrect.slice(2,4) } : null;
        if (parsed) c.move({ from: parsed.from as CbSquare, to: parsed.to as CbSquare, promotion: firstCorrect[4] as any });
      } catch {}
    }
    for (let i = 0; i < contIdx && i < continuation.length; i++) {
      try { c.move(continuation[i]); } catch { break; }
    }
    return c.fen();
  })();

  // Square highlights: opponent's last move (from/to) and correct move highlighting
  const sqStyles: Record<string, React.CSSProperties> = {};
  if (slide.opponentLastMove) {
    sqStyles[slide.opponentLastMove.from] = { backgroundColor: "rgba(255,170,0,0.15)" };
    sqStyles[slide.opponentLastMove.to] = { backgroundColor: "rgba(255,170,0,0.22)" };
  }

  const onDrop = useCallback(
    (from: string, to: string) => {
      if (result) return false;
      const uci = `${from}${to}`;
      setPlayed(uci);
      const isCorrect = correct.some((m) => m === uci || m === uci + "q" || (m.startsWith(from) && m.slice(2, 4) === to));
      setResult(isCorrect ? "correct" : "wrong");
      if (isCorrect) {
        playSound("correct");
        // Fetch continuation
        const c = new Chess(fen);
        const firstCorrect = correct[0];
        let afterFen = fen;
        if (firstCorrect) {
          try {
            const parsed = firstCorrect.length === 4 ? { from: firstCorrect.slice(0,2) as CbSquare, to: firstCorrect.slice(2,4) as CbSquare, promotion: firstCorrect[4] as any } : null;
            if (parsed) { c.move(parsed); afterFen = c.fen(); }
          } catch {}
        }
        stockfishClient.getPrincipalVariation(afterFen, 4, 12).then((pv) => {
          if (pv?.pvMoves?.length) setContinuation(pv.pvMoves);
        });
      } else {
        playSound("wrong");
      }
      return true;
    },
    [result, correct, fen],
  );

  const startContinuation = () => {
    setShowingCont(true);
    setContIdx(0);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 lg:h-full lg:flex-row lg:items-center lg:gap-8">
      <div className="w-full min-w-0 flex justify-center lg:w-[58%] lg:shrink-0">
        <div className="flex items-start gap-2">
          {evalCp != null && <EvalBar evalCp={evalCp} height={420} />}
          <Chessboard id={`lesson-interact-${slide.heading}`} position={displayFen}
            boardOrientation={orientation} arePiecesDraggable={!result && !showingCont}
            onPieceDrop={onDrop as any} customSquareStyles={sqStyles}
            customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }} customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
            customPieces={customPieces} customBoardStyle={{ borderRadius: "12px", overflow: "hidden" }} />
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-col items-center gap-3 text-center lg:w-[42%] lg:max-h-full lg:overflow-y-auto lg:items-start lg:text-left lg:pr-1">
        <h2 className="text-xl font-semibold tracking-tight leading-tight text-[#e4e4e7] lg:text-2xl">{slide.heading}</h2>
        <p className="text-sm leading-6 text-[#a1a1aa] lg:text-[15px] lg:leading-7">{slide.instruction}</p>
        {slide.opponentLastMove && (
          <p className="text-[11px] font-medium text-[#5c5c64]">
            Opponent just played <span className="text-[#a1a1aa]">{slide.opponentLastMove.from}→{slide.opponentLastMove.to}</span>
          </p>
        )}
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#5c5c64]">{orientation === "white" ? "White" : "Black"} to move</p>

        {result === "correct" && !showingCont && continuation.length > 0 && (
          <button type="button" onClick={startContinuation}
            className="w-full rounded-xl border border-[#1f1f22] bg-[#111113] px-4 py-3 text-sm font-medium text-[#a1a1aa] hover:bg-[#161618] transition-colors">
            ▶ See why this move works
          </button>
        )}

        {showingCont && contIdx >= continuation.length && (
          <div className="w-full rounded-xl border border-[#14532d] bg-[#0c1a12] p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#4ade80] mb-1">Correct</p>
            <p className="text-sm leading-relaxed text-[#a1a1aa]">{slide.correctExplanation}</p>
            <button type="button" onClick={onNext} className="mt-3 rounded-xl bg-[#111113] px-5 py-2 text-sm font-medium text-[#a1a1aa] hover:bg-[#161618] transition-colors">Continue →</button>
          </div>
        )}

        {result === "wrong" && (
          <div className="w-full rounded-xl border border-[#7f1d1d] bg-[#1c0c0c] p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#f87171] mb-1">Not quite</p>
            <p className="text-sm leading-relaxed text-[#a1a1aa]">{slide.wrongExplanation}</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => { setResult(null); setPlayed(null); }}
                className="rounded-xl bg-[#111113] px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:bg-[#161618] transition-colors">Try again</button>
              <button type="button" onClick={onNext}
                className="rounded-xl bg-[#111113] px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:bg-[#161618] transition-colors">Skip →</button>
            </div>
          </div>
        )}
      </div>
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
        <h2 className="text-xl font-semibold tracking-tight text-[#e4e4e7]">{slide.heading}</h2>
        <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{slide.question}</p>
      </div>
      <div className="w-full max-w-md space-y-2">
        {slide.choices.map((choice, i) => {
          const isSelected = selected === i;
          const showCorrect = selected != null && i === slide.correctIndex;
          const showWrong = isSelected && !isCorrect;
          return (
            <button key={i} type="button" onClick={() => pick(i)} disabled={selected != null}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                showCorrect ? "border-[#14532d] bg-[#0c1a12] text-[#4ade80]" :
                showWrong ? "border-[#7f1d1d] bg-[#1c0c0c] text-[#f87171]" :
                "border-[#1f1f22] bg-[#111113] text-[#a1a1aa] hover:border-[#2a2a2e] hover:bg-[#161618]"
              }`}>{choice}</button>
          );
        })}
      </div>
      {selected != null && (
        <div className="w-full max-w-md rounded-xl border border-[#1f1f22] bg-[#111113] p-4 text-center">
          <p className="text-sm leading-relaxed text-[#a1a1aa]">{slide.explanation}</p>
          <button type="button" onClick={onNext} className="mt-3 rounded-xl bg-[#161618] px-5 py-2 text-sm font-medium text-[#a1a1aa] hover:bg-[#1f1f22] transition-colors">Continue →</button>
        </div>
      )}
    </div>
  );
}

/* ── Replay slide ──────────────────────────────────────────────────── */

function ReplaySlideView({ slide, onNext }: { slide: ReplaySlide; onNext: () => void }) {
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

  useEffect(() => {
    if (!playing) return;
    if (moveIdx >= slide.moves.length) { setPlaying(false); return; }
    const t = setTimeout(() => setMoveIdx((i) => i + 1), slide.intervalMs ?? 900);
    return () => clearTimeout(t);
  }, [playing, moveIdx, slide.moves.length, slide.intervalMs]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center max-w-lg">
        <h2 className="text-xl font-semibold tracking-tight text-[#e4e4e7]">{slide.heading}</h2>
        <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{slide.body}</p>
      </div>
      <Chessboard id={`lesson-replay-${slide.heading}`} position={fen()} boardOrientation={slide.orientation ?? "white"} arePiecesDraggable={false}
        customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }} customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
        customPieces={customPieces} customBoardStyle={{ borderRadius: "12px", overflow: "hidden" }} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setMoveIdx(Math.max(0, moveIdx - 1))} disabled={moveIdx === 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5c5c64] hover:text-[#e4e4e7] hover:bg-[#111113] disabled:opacity-30 transition-colors">◀</button>
        <button type="button" onClick={() => setPlaying(!playing)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5c5c64] hover:text-[#e4e4e7] hover:bg-[#111113] transition-colors">{playing ? "⏸" : "▶"}</button>
        <button type="button" onClick={() => setMoveIdx(Math.min(slide.moves.length, moveIdx + 1))} disabled={moveIdx >= slide.moves.length}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5c5c64] hover:text-[#e4e4e7] hover:bg-[#111113] disabled:opacity-30 transition-colors">▶</button>
        <span className="text-[11px] tabular-nums text-[#5c5c64]">{moveIdx}/{slide.moves.length}</span>
      </div>
      <button type="button" onClick={onNext} className="rounded-xl bg-[#111113] px-5 py-2 text-sm font-medium text-[#a1a1aa] hover:bg-[#161618] transition-colors">Continue →</button>
    </div>
  );
}

/* ── Modal wrapper ─────────────────────────────────────────────────── */

export function ReportLessonModal({ open, lesson, onClose }: { open: boolean; lesson: ReportLesson | null; onClose: () => void }) {
  if (!open || !lesson) return null;
  return (
    <div className="fixed inset-0 z-50">
      <ReportLessonPlayer lesson={lesson} onClose={onClose} />
    </div>
  );
}
