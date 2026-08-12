"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { stockfishClient } from "@/lib/stockfish-client";
import { useBoardTheme, useCustomPieces, useShowCoordinates } from "@/lib/use-coins";
import { useBoardSize } from "@/lib/use-board-size";

type AnalyzedMove = {
  san: string; uci: string; fenBefore: string; fenAfter: string;
  color: "w" | "b"; moveNumber: number;
  evalCp: number | null; classification: string | null;
};

export default function AnalyzePage() {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();
  const { ref: boardRef, size: boardSize } = useBoardSize(560);
  const [pgn, setPgn] = useState("");
  const [moves, setMoves] = useState<AnalyzedMove[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [analysing, setAnalysing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const currentFen = currentIdx >= 0 && moves[currentIdx]
    ? moves[currentIdx].fenAfter
    : moves.length > 0 ? moves[0].fenBefore : "start";

  const currentEval = currentIdx >= 0 && moves[currentIdx]
    ? moves[currentIdx].evalCp : null;

  const parsePgn = (text: string) => {
    setError("");
    const chess = new Chess();
    try {
      chess.loadPgn(text);
      const history = chess.history({ verbose: true });
      if (history.length < 2) { setError("Need at least 2 moves to analyze."); return null; }
      return history;
    } catch {
      setError("Invalid PGN. Check the format and try again.");
      return null;
    }
  };

  const analyse = useCallback(async () => {
    const history = parsePgn(pgn);
    if (!history) return;
    setAnalysing(true);
    setMoves([]);
    setCurrentIdx(-1);
    const replay = new Chess();
    const result: AnalyzedMove[] = [];
    for (let i = 0; i < Math.min(history.length, 80); i++) {
      const h = history[i];
      const fenBefore = replay.fen();
      const uci = `${h.from}${h.to}${h.promotion ?? ""}`;
      replay.move(h.san);
      const fenAfter = replay.fen();
      let evalCp: number | null = null;
      let classification: string | null = null;
      try {
        const e = await stockfishClient.evaluateFen(fenBefore, 12);
        if (e?.cp != null) {
          const side = fenBefore.includes(" w ") ? "white" : "black";
          evalCp = side === "white" ? e.cp : -e.cp;
          const isBest = e.bestMove === uci || e.bestMove?.startsWith(uci.slice(0, 4));
          if (isBest || (e.bestMove && Math.abs(e.cp) < 20)) classification = "best";
          else if (Math.abs(e.cp) > 300) classification = "blunder";
          else if (Math.abs(e.cp) > 150) classification = "mistake";
          else if (Math.abs(e.cp) > 50) classification = "inaccuracy";
          else classification = "good";
        }
      } catch { /* eval failed — skip */ }
      result.push({ san: h.san, uci, fenBefore, fenAfter, color: h.color, moveNumber: Math.ceil((i + 1) / 2), evalCp, classification });
      setProgress(Math.round(((i + 1) / Math.min(history.length, 80)) * 100));
      setMoves([...result]);
      await new Promise((r) => setTimeout(r, 5));
    }
    setAnalysing(false);
  }, [pgn]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPgn(text);
      const headers = text.match(/\[(\w+)\s+"([^"]*)"\]/g) ?? [];
      for (const h of headers) {
        const m = h.match(/\[(\w+)\s+"([^"]*)"\]/);
        if (m && m[1] === "Event") !title && setTitle(m[2]);
      }
    };
    reader.readAsText(file);
  };

  const classificationColor = (cls: string | null) => {
    if (!cls) return "text-slate-500";
    if (cls === "best" || cls === "good") return "text-emerald-400";
    if (cls === "blunder") return "text-red-400";
    if (cls === "mistake") return "text-orange-400";
    return "text-amber-400";
  };

  const classificationBg = (cls: string | null) => {
    if (cls === "blunder") return "bg-red-500/10 border-red-500/20";
    if (cls === "mistake") return "bg-orange-500/10 border-orange-500/20";
    return "";
  };

  // Group moves by full-move number for display
  const movePairs = useMemo(() => {
    const pairs: { white: AnalyzedMove | null; black: AnalyzedMove | null }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({ white: moves[i] ?? null, black: moves[i + 1] ?? null });
    }
    return pairs;
  }, [moves]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white">PGN Analyzer</h1>
          <p className="mt-2 text-sm text-slate-400">Drop a PGN file or paste it below. Powered by Stockfish 18 in your browser.</p>
        </div>

        {moves.length === 0 && !analysing ? (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${dragOver ? "border-orange-400/50 bg-orange-500/[0.05]" : "border-white/[0.08] bg-white/[0.02]"}`}
            >
              <p className="text-lg font-semibold text-white">Drop PGN file here</p>
              <p className="mt-1 text-sm text-slate-500">or</p>
              <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.08] transition-colors">
                Browse files
              </button>
              <input ref={fileRef} type="file" accept=".pgn,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Paste PGN</div>
              <textarea
                value={pgn}
                onChange={(e) => setPgn(e.target.value)}
                placeholder={`[Event "My Game"]\n1. e4 e5 2. Nf3 Nc6...`}
                rows={8}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 pt-8 pb-4 font-mono text-sm text-slate-300 placeholder-slate-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30 resize-y"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="button" onClick={analyse} disabled={!pgn.trim()} className="w-full rounded-xl bg-white px-6 py-3.5 text-base font-bold text-black hover:bg-white/90 disabled:opacity-30 transition-colors">
              Analyze with Stockfish 18
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Board */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                {analysing && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                    Analyzing... {progress}%
                  </div>
                )}
              </div>
              <div ref={boardRef} className="w-full max-w-[560px]">
                <div className="flex items-start gap-2">
                  {currentEval != null && <EvalBar evalCp={currentEval} height={boardSize} />}
                  <Chessboard
                    id="analyzer-board"
                    position={currentFen}
                    boardWidth={boardSize - (currentEval != null ? 28 : 0)}
                    boardOrientation="white"
                    arePiecesDraggable={false}
                    customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                    customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                    customPieces={customPieces}
                    showBoardNotation={showCoords}
                    customBoardStyle={{ borderRadius: "12px", overflow: "hidden" }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCurrentIdx(Math.max(-1, currentIdx - 1))} disabled={currentIdx < 0} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.06] disabled:opacity-30">◀</button>
                <button type="button" onClick={() => setCurrentIdx(-1)} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.06]">⟳ Start</button>
                <button type="button" onClick={() => setCurrentIdx(Math.min(moves.length - 1, currentIdx + 1))} disabled={currentIdx >= moves.length - 1} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 hover:bg-white/[0.06] disabled:opacity-30">▶</button>
                <span className="text-[11px] text-slate-500 tabular-nums">{currentIdx + 1}/{moves.length}</span>
              </div>
            </div>

            {/* Movelist */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 max-h-[600px] overflow-y-auto">
              <h3 className="mb-3 text-sm font-semibold text-white">Move list</h3>
              <div className="space-y-1">
                {movePairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-1 text-sm font-mono">
                    <span className="w-8 text-right text-[10px] text-slate-500">{i + 1}.</span>
                    {pair.white && (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx(i * 2)}
                        className={`px-1.5 py-0.5 rounded ${currentIdx === i * 2 ? "bg-white/[0.1] text-white" : "text-slate-300 hover:bg-white/[0.05]"} ${classificationColor(pair.white.classification)}`}
                      >
                        {pair.white.san}
                      </button>
                    )}
                    {pair.black && (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx(i * 2 + 1)}
                        className={`px-1.5 py-0.5 rounded ${currentIdx === i * 2 + 1 ? "bg-white/[0.1] text-white" : "text-slate-300 hover:bg-white/[0.05]"} ${classificationColor(pair.black.classification)}`}
                      >
                        {pair.black.san}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              {!analysing && moves.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-[11px] text-slate-500">
                    {moves.filter((m) => m.classification === "blunder").length} blunders ·{" "}
                    {moves.filter((m) => m.classification === "mistake").length} mistakes ·{" "}
                    {moves.filter((m) => m.classification === "best").length} best moves
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {moves.length > 0 && !analysing && (
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => { setMoves([]); setPgn(""); setCurrentIdx(-1); setTitle(""); }} className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.08] transition-colors">
              Analyze another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
