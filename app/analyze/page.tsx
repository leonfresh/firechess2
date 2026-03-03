"use client";

/**
 * /analyze — PGN Game Analyzer
 *
 * Paste or upload a PGN to get a full move-by-move analysis with:
 *   - Stockfish evaluation per move (client-side WASM)
 *   - Move classification (brilliant/best/good/inaccuracy/mistake/blunder)
 *   - Positional motif detection via the existing explainMoves() engine
 *   - Interactive board with eval bar and move navigation
 *   - "Explain" button per move using the ExplanationModal
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import type { Square as CbSquare } from "react-chessboard/dist/chessboard/types";
import { Chessboard } from "react-chessboard";
import { EvalBar } from "@/components/eval-bar";
import { ExplanationModal } from "@/components/explanation-modal";
import { explainMoves, type PositionExplanation } from "@/lib/position-explainer";
import { stockfishPool } from "@/lib/stockfish-client";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import { SAMPLE_GAMES } from "@/lib/sample-games";

/* ────────────────────────── Types ────────────────────────── */

type MoveClassification = "brilliant" | "best" | "good" | "book" | "inaccuracy" | "mistake" | "blunder";

type AnalyzedMove = {
  /** Move index (0-based) */
  idx: number;
  /** SAN notation */
  san: string;
  /** UCI notation */
  uci: string;
  /** FEN before this move */
  fenBefore: string;
  /** FEN after this move */
  fenAfter: string;
  /** Engine eval BEFORE this move (from white's perspective) */
  evalBefore: number;
  /** Engine eval AFTER this move (from white's perspective) */
  evalAfter: number;
  /** Engine best move for the position before */
  bestMove: string | null;
  /** Best move FEN for PV display */
  bestMoveSan: string | null;
  /** CP loss (always >= 0) */
  cpLoss: number;
  /** Classification */
  classification: MoveClassification;
  /** Which side played */
  color: "w" | "b";
  /** Full move number */
  moveNumber: number;
  /** PV moves (UCI) from engine */
  pvMoves: string[];
};

/* ────────────────────────── Constants ────────────────────────── */

const ENGINE_DEPTH = 14;

const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant: "text-cyan-400",
  best: "text-emerald-400",
  good: "text-emerald-400/70",
  book: "text-slate-400",
  inaccuracy: "text-amber-400",
  mistake: "text-orange-400",
  blunder: "text-red-400",
};

const CLASSIFICATION_BG: Record<MoveClassification, string> = {
  brilliant: "bg-cyan-500/15",
  best: "bg-emerald-500/15",
  good: "bg-emerald-500/10",
  book: "bg-white/[0.04]",
  inaccuracy: "bg-amber-500/15",
  mistake: "bg-orange-500/15",
  blunder: "bg-red-500/15",
};

const CLASSIFICATION_ICONS: Record<MoveClassification, string> = {
  brilliant: "!!",
  best: "!",
  good: "",
  book: "📖",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

const CLASSIFICATION_BORDER: Record<MoveClassification, string> = {
  brilliant: "border-cyan-500/30",
  best: "border-emerald-500/20",
  good: "border-emerald-500/10",
  book: "border-white/[0.06]",
  inaccuracy: "border-amber-500/20",
  mistake: "border-orange-500/20",
  blunder: "border-red-500/30",
};

function classifyMove(cpLoss: number, isBestMove: boolean): MoveClassification {
  if (isBestMove) return "best";
  if (cpLoss <= 25) return "good";
  if (cpLoss <= 75) return "inaccuracy";
  if (cpLoss <= 200) return "mistake";
  return "blunder";
}

const CLASSIFICATION_EMOJI: Record<MoveClassification, string> = {
  brilliant: "💎",
  best: "✅",
  good: "👍",
  book: "📖",
  inaccuracy: "⚠️",
  mistake: "❌",
  blunder: "💀",
};

function formatEval(cp: number): string {
  if (Math.abs(cp) >= 99000) {
    const n = 100000 - Math.abs(cp);
    const sign = cp > 0 ? "+" : "-";
    return n <= 0 ? `${sign}Mate` : `${sign}M${n}`;
  }
  const pawns = cp / 100;
  return `${pawns > 0 ? "+" : ""}${(Math.round(pawns * 10) / 10).toFixed(1)}`;
}

type PgnParseResult = {
  moves: { san: string; uci: string; fenBefore: string; fenAfter: string; color: "w" | "b"; moveNumber: number }[];
  headers: Record<string, string>;
};

function parsePgn(pgn: string): PgnParseResult | { error: string } {
  try {
    // Extract headers
    const headers: Record<string, string> = {};
    const headerLines = pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) ?? [];
    for (const line of headerLines) {
      const match = line.match(/\[(\w+)\s+"([^"]*)"\]/);
      if (match) headers[match[1]] = match[2];
    }

    // Try chess.js loadPgn first (handles standard PGN best)
    try {
      const game = new Chess();
      game.loadPgn(pgn);
      const history = game.history({ verbose: true });
      const replay = new Chess();
      const moves: PgnParseResult["moves"] = [];

      for (const move of history) {
        const fenBefore = replay.fen();
        const uci = `${move.from}${move.to}${move.promotion ?? ""}`;
        replay.move(move.san);
        const fenAfter = replay.fen();
        const fullMove = parseInt(fenBefore.split(" ")[5] ?? "1");
        moves.push({ san: move.san, uci, fenBefore, fenAfter, color: move.color, moveNumber: fullMove });
      }

      return { moves, headers };
    } catch {
      // loadPgn failed — fall back to manual parsing for better error messages
    }

    // Manual replay: strip headers, comments, variations, NAGs, and result
    let moveText = pgn
      .replace(/\[.*?\]\s*/g, "")        // remove header tags
      .replace(/\{[^}]*\}/g, "")         // remove comments
      .replace(/\([^)]*\)/g, "")         // remove variations (single-level)
      .replace(/\$\d+/g, "")             // remove NAGs ($1, $2, etc.)
      .replace(/\b(1-0|0-1|1\/2-1\/2|\*)\s*$/, "") // remove game result
      .trim();

    // Tokenise: split on whitespace, drop move numbers like "1." "12..."
    const tokens = moveText.split(/\s+/).filter(t => t && !/^\d+\.+$/.test(t));

    if (tokens.length === 0) {
      return { error: "No moves found in PGN." };
    }

    const chess = new Chess();
    const moves: PgnParseResult["moves"] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // Skip result tokens that might appear mid-text
      if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)) continue;
      const fenBefore = chess.fen();
      const color = chess.turn();
      const fullMove = parseInt(fenBefore.split(" ")[5] ?? "1");

      try {
        const result = chess.move(token);
        if (!result) {
          return { error: `Illegal move "${token}" at move ${fullMove}${color === "w" ? "" : "..."} — the position does not allow this move.` };
        }
        const fenAfter = chess.fen();
        const uci = `${result.from}${result.to}${result.promotion ?? ""}`;
        moves.push({ san: result.san, uci, fenBefore, fenAfter, color, moveNumber: fullMove });
      } catch {
        return { error: `Invalid move "${token}" at move ${fullMove}${color === "w" ? "" : "..."} — the PGN may be corrupted or use a non-standard format.` };
      }
    }

    return { moves, headers };
  } catch {
    return { error: "Could not parse PGN. Please check the format and try again." };
  }
}

/* ────────────────────────── Component ────────────────────────── */

export default function AnalyzePage() {
  /* ── PGN input state ── */
  const [pgnText, setPgnText] = useState("");
  const [error, setError] = useState("");

  /* ── Analysis state ── */
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [analyzedMoves, setAnalyzedMoves] = useState<AnalyzedMove[]>([]);
  const [gameHeaders, setGameHeaders] = useState<Record<string, string>>({});

  /* ── Navigation state ── */
  const [selectedMoveIdx, setSelectedMoveIdx] = useState(-1); // -1 = starting position
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");

  /* ── Explain modal state ── */
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainData, setExplainData] = useState<{
    explanation: PositionExplanation;
    title: string;
    subtitle: string;
    fen: string;
    uciMoves: string[];
    tab: "played" | "best";
  } | null>(null);

  /* ── Hooks ── */
  const { ref: boardRef, size: boardSize } = useBoardSize(360);
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();
  const moveListRef = useRef<HTMLDivElement>(null);

  /* ── Preload sounds ── */
  useEffect(() => { preloadSounds(); }, []);

  /* ── Derived state ── */
  const currentFen = useMemo(() => {
    if (selectedMoveIdx < 0) {
      // Starting position - use first move's fenBefore or default start
      return analyzedMoves.length > 0 ? analyzedMoves[0].fenBefore : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }
    return analyzedMoves[selectedMoveIdx]?.fenAfter ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  }, [selectedMoveIdx, analyzedMoves]);

  const currentEval = useMemo(() => {
    if (analyzedMoves.length === 0) return 0;
    if (selectedMoveIdx < 0) return analyzedMoves[0]?.evalBefore ?? 0;
    return analyzedMoves[selectedMoveIdx]?.evalAfter ?? 0;
  }, [selectedMoveIdx, analyzedMoves]);

  const selectedMove = selectedMoveIdx >= 0 ? analyzedMoves[selectedMoveIdx] : null;

  /* ── Summary stats ── */
  const summary = useMemo(() => {
    if (analyzedMoves.length === 0) return null;
    const whiteMoves = analyzedMoves.filter(m => m.color === "w");
    const blackMoves = analyzedMoves.filter(m => m.color === "b");

    const avgCpLoss = (moves: AnalyzedMove[]) => {
      const losses = moves.map(m => m.cpLoss);
      return losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    };

    const accuracy = (acpl: number) => Math.min(99.5, Math.max(25, 100 * Math.exp(-acpl / 120)));

    const count = (moves: AnalyzedMove[], cls: MoveClassification) => moves.filter(m => m.classification === cls).length;

    const whiteAcpl = avgCpLoss(whiteMoves);
    const blackAcpl = avgCpLoss(blackMoves);

    return {
      white: {
        acpl: Math.round(whiteAcpl * 10) / 10,
        accuracy: Math.round(accuracy(whiteAcpl) * 10) / 10,
        brilliant: count(whiteMoves, "brilliant"),
        best: count(whiteMoves, "best"),
        good: count(whiteMoves, "good"),
        book: count(whiteMoves, "book"),
        inaccuracy: count(whiteMoves, "inaccuracy"),
        mistake: count(whiteMoves, "mistake"),
        blunder: count(whiteMoves, "blunder"),
      },
      black: {
        acpl: Math.round(blackAcpl * 10) / 10,
        accuracy: Math.round(accuracy(blackAcpl) * 10) / 10,
        brilliant: count(blackMoves, "brilliant"),
        best: count(blackMoves, "best"),
        good: count(blackMoves, "good"),
        book: count(blackMoves, "book"),
        inaccuracy: count(blackMoves, "inaccuracy"),
        mistake: count(blackMoves, "mistake"),
        blunder: count(blackMoves, "blunder"),
      },
    };
  }, [analyzedMoves]);

  /* ── Eval graph data ── */
  const evalGraph = useMemo(() => {
    if (analyzedMoves.length === 0) return [];
    return [
      { x: 0, cp: analyzedMoves[0].evalBefore },
      ...analyzedMoves.map((m, i) => ({ x: i + 1, cp: m.evalAfter })),
    ];
  }, [analyzedMoves]);

  /* ── Start analysis ── */
  const analyzeGame = useCallback(async () => {
    setError("");
    const trimmed = pgnText.trim();
    if (!trimmed) {
      setError("Please paste a PGN to analyze.");
      return;
    }

    const parsed = parsePgn(trimmed);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    if (parsed.moves.length === 0) {
      setError("No moves found in PGN. Please check the format and try again.");
      return;
    }

    setAnalyzing(true);
    setAnalyzedMoves([]);
    setSelectedMoveIdx(-1);
    setGameHeaders(parsed.headers);
    setProgress({ current: 0, total: parsed.moves.length });

    const results: AnalyzedMove[] = [];

    // Evaluate starting position
    const startEval = await stockfishPool.evaluateFen(parsed.moves[0].fenBefore, ENGINE_DEPTH);
    let prevEvalWhite = startEval?.cp ?? 15; // slight white advantage default

    for (let i = 0; i < parsed.moves.length; i++) {
      const move = parsed.moves[i];
      setProgress({ current: i + 1, total: parsed.moves.length });

      // Evaluate position after this move
      const evalResult = await stockfishPool.evaluateFen(move.fenAfter, ENGINE_DEPTH);
      // Get best move for the position before
      const bestResult = await stockfishPool.evaluateFen(move.fenBefore, ENGINE_DEPTH);
      // Get PV for the position before
      const pvResult = await stockfishPool.getPrincipalVariation(move.fenBefore, 6, ENGINE_DEPTH);

      // Normalize evals to white's perspective
      const evalAfterWhite = evalResult ? (move.color === "w" ? -evalResult.cp : evalResult.cp) : prevEvalWhite;
      const evalBeforeWhite = prevEvalWhite;

      // CP loss from the mover's perspective
      const evalBeforeMover = move.color === "w" ? evalBeforeWhite : -evalBeforeWhite;
      const evalAfterMover = move.color === "w" ? evalAfterWhite : -evalAfterWhite;
      const cpLoss = Math.max(0, evalBeforeMover - evalAfterMover);

      // Was this the engine's best move?
      const isBestMove = bestResult?.bestMove === move.uci ||
        (bestResult?.bestMove && move.uci.startsWith(bestResult.bestMove.slice(0, 4)) && cpLoss <= 5);

      // Convert best move UCI to SAN
      let bestMoveSan: string | null = null;
      if (bestResult?.bestMove) {
        try {
          const tempGame = new Chess(move.fenBefore);
          const from = bestResult.bestMove.slice(0, 2);
          const to = bestResult.bestMove.slice(2, 4);
          const promo = bestResult.bestMove.slice(4, 5) || undefined;
          const r = tempGame.move({ from, to, promotion: promo as any });
          if (r) bestMoveSan = r.san;
        } catch {}
      }

      results.push({
        idx: i,
        san: move.san,
        uci: move.uci,
        fenBefore: move.fenBefore,
        fenAfter: move.fenAfter,
        evalBefore: evalBeforeWhite,
        evalAfter: evalAfterWhite,
        bestMove: bestResult?.bestMove ?? null,
        bestMoveSan,
        cpLoss,
        classification: classifyMove(cpLoss, !!isBestMove),
        color: move.color,
        moveNumber: move.moveNumber,
        pvMoves: pvResult?.pvMoves ?? [],
      });

      prevEvalWhite = evalAfterWhite;

      // Update moves progressively
      setAnalyzedMoves([...results]);
    }

    setAnalyzing(false);
    setSelectedMoveIdx(0);
    playSound("move");
  }, [pgnText]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (analyzedMoves.length === 0) return;
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedMoveIdx(prev => Math.max(-1, prev - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedMoveIdx(prev => Math.min(analyzedMoves.length - 1, prev + 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setSelectedMoveIdx(-1);
      } else if (e.key === "End") {
        e.preventDefault();
        setSelectedMoveIdx(analyzedMoves.length - 1);
      } else if (e.key === "f") {
        setBoardOrientation(o => o === "white" ? "black" : "white");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [analyzedMoves.length]);

  /* ── Auto-scroll move list ── */
  useEffect(() => {
    if (selectedMoveIdx < 0 || !moveListRef.current) return;
    const el = moveListRef.current.querySelector(`[data-move-idx="${selectedMoveIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedMoveIdx]);

  /* ── Explain move ── */
  const openExplain = useCallback((move: AnalyzedMove, tab: "played" | "best") => {
    const explanation = explainMoves(
      move.fenBefore,
      move.uci,
      move.bestMove,
      move.cpLoss,
      move.color === "w" ? move.evalBefore : -move.evalBefore,
      move.color === "w" ? move.evalAfter : -move.evalAfter,
    );

    const ex = tab === "played" ? explanation.played : explanation.best;
    const pvMoveList = tab === "best" ? move.pvMoves : [move.uci];

    setExplainData({
      explanation: ex,
      title: tab === "played"
        ? `Why ${move.san} is ${move.classification === "blunder" ? "a blunder" : move.classification === "mistake" ? "a mistake" : "inaccurate"}`
        : `Why ${move.bestMoveSan ?? "the engine move"} is better`,
      subtitle: `Move ${move.moveNumber}${move.color === "w" ? "." : "..."} — ${formatEval(move.evalBefore)} → ${formatEval(move.evalAfter)}`,
      fen: move.fenBefore,
      uciMoves: pvMoveList,
      tab,
    });
    setExplainOpen(true);
  }, []);

  /* ── Handle board piece drop (navigate to that point) ── */
  const onPieceDrop = useCallback(() => false, []);

  /* ── Eval bar graph (mini sparkline) ── */
  const evalGraphSvg = useMemo(() => {
    if (evalGraph.length < 2) return null;
    const w = 600;
    const h = 60;
    const maxCp = 400;
    const points = evalGraph.map((pt, i) => {
      const x = (i / (evalGraph.length - 1)) * w;
      const clamped = Math.max(-maxCp, Math.min(maxCp, pt.cp));
      const y = h / 2 - (clamped / maxCp) * (h / 2);
      return `${x},${y}`;
    });

    // Find the selected move position on the graph
    const selectedX = selectedMoveIdx >= 0
      ? ((selectedMoveIdx + 1) / (evalGraph.length - 1)) * w
      : 0;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[60px] cursor-pointer" preserveAspectRatio="none"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const idx = Math.round(ratio * (evalGraph.length - 1)) - 1;
          setSelectedMoveIdx(Math.max(-1, Math.min(analyzedMoves.length - 1, idx)));
        }}
      >
        {/* Background */}
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
        {/* Center line */}
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* White advantage area */}
        <polygon
          points={`0,${h / 2} ${points.map((p, i) => {
            const clamped = Math.max(-maxCp, Math.min(maxCp, evalGraph[i].cp));
            const y = h / 2 - (clamped / maxCp) * (h / 2);
            return y < h / 2 ? p : `${(i / (evalGraph.length - 1)) * w},${h / 2}`;
          }).join(" ")} ${w},${h / 2}`}
          fill="rgba(255,255,255,0.08)"
        />
        {/* Black advantage area */}
        <polygon
          points={`0,${h / 2} ${points.map((p, i) => {
            const clamped = Math.max(-maxCp, Math.min(maxCp, evalGraph[i].cp));
            const y = h / 2 - (clamped / maxCp) * (h / 2);
            return y > h / 2 ? p : `${(i / (evalGraph.length - 1)) * w},${h / 2}`;
          }).join(" ")} ${w},${h / 2}`}
          fill="rgba(100,100,100,0.1)"
        />
        {/* Eval line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
        />
        {/* Blunder/mistake markers */}
        {analyzedMoves.map((m, i) => {
          if (m.classification !== "blunder" && m.classification !== "mistake") return null;
          const x = ((i + 1) / (evalGraph.length - 1)) * w;
          const clamped = Math.max(-maxCp, Math.min(maxCp, m.evalAfter));
          const y = h / 2 - (clamped / maxCp) * (h / 2);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={m.classification === "blunder" ? "#ef4444" : "#f97316"}
              opacity="0.8"
            />
          );
        })}
        {/* Selected move indicator */}
        {selectedMoveIdx >= 0 && (
          <line x1={selectedX} y1="0" x2={selectedX} y2={h} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        )}
      </svg>
    );
  }, [evalGraph, selectedMoveIdx, analyzedMoves]);

  /* ═══════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Game Analyzer
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Paste a PGN to get move-by-move analysis with Stockfish — entirely in your browser
          </p>
        </div>

        {/* ── PGN Input (shown when no analysis is running/done) ── */}
        {analyzedMoves.length === 0 && !analyzing && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Paste your PGN
              </label>
              <textarea
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                placeholder={`[Event "Casual Game"]\n[White "You"]\n[Black "Opponent"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 ...`}
                className="h-64 w-full resize-none rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20"
              />

              {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
              )}

              <button
                onClick={analyzeGame}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:brightness-110 active:scale-[0.98]"
              >
                🔍 Analyze Game
              </button>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span className="rounded-full border border-white/[0.06] px-2.5 py-1">
                  Depth {ENGINE_DEPTH}
                </span>
                <span className="rounded-full border border-white/[0.06] px-2.5 py-1">
                  Client-side Stockfish 18
                </span>
                <span className="rounded-full border border-white/[0.06] px-2.5 py-1">
                  ← → keyboard nav
                </span>
                <span className="rounded-full border border-white/[0.06] px-2.5 py-1">
                  F to flip board
                </span>
              </div>
            </div>

            {/* Sample PGN buttons */}
            <div className="space-y-3">
              <p className="text-center text-xs font-medium text-slate-500">Or load a famous game:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_GAMES.map((game) => (
                  <button
                    key={game.label}
                    onClick={() => setPgnText(game.pgn)}
                    className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition-all hover:border-blue-500/20 hover:bg-blue-500/[0.04]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-sm group-hover:bg-blue-500/10">♟</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-300 group-hover:text-blue-300 truncate">{game.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{game.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Analysis progress ── */}
        {analyzing && (
          <div className="mx-auto mb-6 max-w-2xl">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-blue-300">
                  Analyzing move {progress.current} of {progress.total}...
                </p>
                <span className="text-xs font-mono text-blue-400/60">
                  {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                  style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Analysis results ── */}
        {analyzedMoves.length > 0 && (
          <div className="space-y-4">
            {/* Game info header */}
            {(gameHeaders.White || gameHeaders.Black) && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-sm border border-white/20 bg-white" />
                      <span className="text-sm font-bold text-white">{gameHeaders.White ?? "White"}</span>
                      {gameHeaders.WhiteElo && <span className="text-xs text-slate-500">({gameHeaders.WhiteElo})</span>}
                    </div>
                    <span className="text-xs text-slate-500">vs</span>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-sm border border-white/20 bg-slate-800" />
                      <span className="text-sm font-bold text-white">{gameHeaders.Black ?? "Black"}</span>
                      {gameHeaders.BlackElo && <span className="text-xs text-slate-500">({gameHeaders.BlackElo})</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {gameHeaders.Event && <span>{gameHeaders.Event}</span>}
                    {gameHeaders.Date && <span>{gameHeaders.Date}</span>}
                    {gameHeaders.Result && (
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 font-bold text-slate-300">
                        {gameHeaders.Result}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Summary stats */}
            {summary && !analyzing && (
              <div className="grid grid-cols-2 gap-3">
                {/* White stats */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-sm border border-white/30 bg-white" />
                    <span className="text-sm font-bold text-white">{gameHeaders.White ?? "White"}</span>
                  </div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black tabular-nums text-white">{summary.white.accuracy}%</span>
                    <span className="text-xs text-slate-500">accuracy</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.white.brilliant > 0 && <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] font-bold text-cyan-400">!! {summary.white.brilliant}</span>}
                    {summary.white.best > 0 && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">Best {summary.white.best}</span>}
                    {summary.white.good > 0 && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400/70">Good {summary.white.good}</span>}
                    {summary.white.inaccuracy > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-400">?! {summary.white.inaccuracy}</span>}
                    {summary.white.mistake > 0 && <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-bold text-orange-400">? {summary.white.mistake}</span>}
                    {summary.white.blunder > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-400">?? {summary.white.blunder}</span>}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">ACPL: {summary.white.acpl}</p>
                </div>

                {/* Black stats */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-sm border border-white/20 bg-slate-700" />
                    <span className="text-sm font-bold text-white">{gameHeaders.Black ?? "Black"}</span>
                  </div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black tabular-nums text-white">{summary.black.accuracy}%</span>
                    <span className="text-xs text-slate-500">accuracy</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.black.brilliant > 0 && <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] font-bold text-cyan-400">!! {summary.black.brilliant}</span>}
                    {summary.black.best > 0 && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">Best {summary.black.best}</span>}
                    {summary.black.good > 0 && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400/70">Good {summary.black.good}</span>}
                    {summary.black.inaccuracy > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-400">?! {summary.black.inaccuracy}</span>}
                    {summary.black.mistake > 0 && <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-bold text-orange-400">? {summary.black.mistake}</span>}
                    {summary.black.blunder > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-400">?? {summary.black.blunder}</span>}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">ACPL: {summary.black.acpl}</p>
                </div>
              </div>
            )}

            {/* Eval graph */}
            {evalGraph.length > 1 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                {evalGraphSvg}
              </div>
            )}

            {/* Main analysis area: Board + Move list */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
              {/* Board column */}
              <div className="flex flex-col items-center gap-3">
                <div ref={boardRef} className="w-full max-w-[640px]">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <EvalBar evalCp={currentEval} height={boardSize} />
                    <div className="overflow-hidden rounded-xl">
                      <Chessboard
                        id="analyze-board"
                        position={currentFen}
                        boardOrientation={boardOrientation}
                        boardWidth={boardSize}
                        arePiecesDraggable={false}
                        onPieceDrop={onPieceDrop}
                        animationDuration={200}
                        customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                        customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                        showBoardNotation={showCoords}
                      />
                    </div>
                  </div>
                </div>

                {/* Board controls */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setSelectedMoveIdx(-1)} disabled={selectedMoveIdx <= -1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="First move (Home)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="11 19 2 12 11 5"/><line x1="22" y1="5" x2="22" y2="19"/></svg>
                  </button>
                  <button onClick={() => setSelectedMoveIdx(p => Math.max(-1, p - 1))} disabled={selectedMoveIdx <= -1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous move (←)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button onClick={() => setSelectedMoveIdx(p => Math.min(analyzedMoves.length - 1, p + 1))} disabled={selectedMoveIdx >= analyzedMoves.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next move (→)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button onClick={() => setSelectedMoveIdx(analyzedMoves.length - 1)} disabled={selectedMoveIdx >= analyzedMoves.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Last move (End)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 19 22 12 13 5"/><line x1="2" y1="5" x2="2" y2="19"/></svg>
                  </button>
                  <div className="mx-1 h-5 w-px bg-white/[0.08]" />
                  <button onClick={() => setBoardOrientation(o => o === "white" ? "black" : "white")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
                    title="Flip board (F)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/></svg>
                  </button>
                  <button onClick={() => { setAnalyzedMoves([]); setGameHeaders({}); setSelectedMoveIdx(-1); }}
                    className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
                    title="New game">
                    New game
                  </button>
                </div>

                {/* Current move info */}
                {selectedMove && (
                  <div className={`w-full max-w-[640px] rounded-xl border ${CLASSIFICATION_BORDER[selectedMove.classification]} ${CLASSIFICATION_BG[selectedMove.classification]} p-3`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black font-mono ${CLASSIFICATION_COLORS[selectedMove.classification]}`}>
                          {selectedMove.moveNumber}{selectedMove.color === "w" ? "." : "..."}{selectedMove.san}
                        </span>
                        {CLASSIFICATION_ICONS[selectedMove.classification] && (
                          <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${CLASSIFICATION_BG[selectedMove.classification]} ${CLASSIFICATION_COLORS[selectedMove.classification]}`}>
                            {CLASSIFICATION_ICONS[selectedMove.classification]}
                          </span>
                        )}
                        <span className="text-sm">{CLASSIFICATION_EMOJI[selectedMove.classification]}</span>
                        <span className="text-xs capitalize text-slate-400">{selectedMove.classification}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">
                          {formatEval(selectedMove.evalBefore)} → {formatEval(selectedMove.evalAfter)}
                        </span>
                        {selectedMove.cpLoss > 0 && (
                          <span className={`text-xs font-bold ${CLASSIFICATION_COLORS[selectedMove.classification]}`}>
                            −{(selectedMove.cpLoss / 100).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Best move & action buttons */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {selectedMove.bestMoveSan && selectedMove.bestMove !== selectedMove.uci && (
                        <p className="text-xs text-slate-400">
                          Best: <span className="font-bold text-emerald-400">{selectedMove.bestMoveSan}</span>
                        </p>
                      )}
                      {selectedMove.cpLoss >= 30 && (
                        <div className="flex gap-1.5 ml-auto">
                          <button
                            onClick={() => openExplain(selectedMove, "played")}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                          >
                            Explain played
                          </button>
                          {selectedMove.bestMove && (
                            <button
                              onClick={() => openExplain(selectedMove, "best")}
                              className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                            >
                              Explain best
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Move list column */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col w-[280px] lg:w-auto" style={{ maxHeight: boardSize + 120 }}>
                <div className="border-b border-white/[0.06] px-4 py-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Moves</h3>
                </div>
                <div ref={moveListRef} className="flex-1 overflow-y-auto p-2">
                  <div className="grid" style={{ gridTemplateColumns: "auto 1fr 1fr" }}>
                    {/* Group moves by pairs (white + black) */}
                    {(() => {
                      const rows: React.ReactNode[] = [];
                      let i = 0;
                      while (i < analyzedMoves.length) {
                        const whiteMove = analyzedMoves[i]?.color === "w" ? analyzedMoves[i] : null;
                        const blackMove = whiteMove
                          ? (analyzedMoves[i + 1]?.color === "b" ? analyzedMoves[i + 1] : null)
                          : (analyzedMoves[i]?.color === "b" ? analyzedMoves[i] : null);
                        const moveNum = whiteMove?.moveNumber ?? blackMove?.moveNumber ?? 0;

                        rows.push(
                          <div key={`row-${i}`} className="contents">
                            {/* Move number */}
                            <div className="flex items-center px-2 py-0.5 text-[11px] font-mono text-slate-600">
                              {moveNum}.
                            </div>
                            {/* White move */}
                            {whiteMove ? (
                              <button
                                data-move-idx={whiteMove.idx}
                                onClick={() => setSelectedMoveIdx(whiteMove.idx)}
                                className={`relative flex items-center gap-1 rounded-md px-2 py-0.5 text-left text-xs font-mono transition-colors ${
                                  selectedMoveIdx === whiteMove.idx
                                    ? `${CLASSIFICATION_BG[whiteMove.classification]} ${CLASSIFICATION_COLORS[whiteMove.classification]} font-bold`
                                    : "text-slate-300 hover:bg-white/[0.06]"
                                }`}
                              >
                                <span>{whiteMove.san}</span>
                                {whiteMove.classification !== "good" && whiteMove.classification !== "book" && (
                                  <span className={`text-[10px] ${CLASSIFICATION_COLORS[whiteMove.classification]}`}>
                                    {CLASSIFICATION_ICONS[whiteMove.classification]}
                                  </span>
                                )}
                                <span className="absolute -top-1.5 -right-1 text-[9px] leading-none" title={whiteMove.classification}>
                                  {CLASSIFICATION_EMOJI[whiteMove.classification]}
                                </span>
                              </button>
                            ) : (
                              <div />
                            )}
                            {/* Black move */}
                            {blackMove ? (
                              <button
                                data-move-idx={blackMove.idx}
                                onClick={() => setSelectedMoveIdx(blackMove.idx)}
                                className={`relative flex items-center gap-1 rounded-md px-2 py-0.5 text-left text-xs font-mono transition-colors ${
                                  selectedMoveIdx === blackMove.idx
                                    ? `${CLASSIFICATION_BG[blackMove.classification]} ${CLASSIFICATION_COLORS[blackMove.classification]} font-bold`
                                    : "text-slate-300 hover:bg-white/[0.06]"
                                }`}
                              >
                                <span>{blackMove.san}</span>
                                {blackMove.classification !== "good" && blackMove.classification !== "book" && (
                                  <span className={`text-[10px] ${CLASSIFICATION_COLORS[blackMove.classification]}`}>
                                    {CLASSIFICATION_ICONS[blackMove.classification]}
                                  </span>
                                )}
                                <span className="absolute -top-1.5 -right-1 text-[9px] leading-none" title={blackMove.classification}>
                                  {CLASSIFICATION_EMOJI[blackMove.classification]}
                                </span>
                              </button>
                            ) : (
                              <div />
                            )}
                          </div>
                        );

                        i += whiteMove ? (blackMove ? 2 : 1) : 1;
                      }
                      return rows;
                    })()}
                  </div>

                  {/* Result */}
                  {gameHeaders.Result && !analyzing && (
                    <div className="mt-2 text-center text-xs font-bold text-slate-500">
                      {gameHeaders.Result}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Key moments — only blunders and mistakes */}
            {!analyzing && analyzedMoves.some(m => m.classification === "blunder" || m.classification === "mistake") && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="mb-3 text-sm font-bold text-white">Key Moments</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {analyzedMoves
                    .filter(m => m.classification === "blunder" || m.classification === "mistake")
                    .map(m => (
                      <button
                        key={m.idx}
                        onClick={() => setSelectedMoveIdx(m.idx)}
                        className={`group flex items-center gap-3 rounded-xl border ${CLASSIFICATION_BORDER[m.classification]} ${CLASSIFICATION_BG[m.classification]} p-3 text-left transition-all hover:brightness-110`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-black ${CLASSIFICATION_COLORS[m.classification]}`}>
                          {CLASSIFICATION_ICONS[m.classification]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold ${CLASSIFICATION_COLORS[m.classification]}`}>
                            {m.moveNumber}{m.color === "w" ? "." : "..."}{m.san}
                            <span className="ml-1.5 text-xs text-slate-500 font-normal capitalize">{m.classification}</span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {formatEval(m.evalBefore)} → {formatEval(m.evalAfter)}
                            {m.bestMoveSan && <span className="ml-1.5">Best: <span className="text-emerald-400/70">{m.bestMoveSan}</span></span>}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <span
                            onClick={(e) => { e.stopPropagation(); openExplain(m, "played"); }}
                            className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20 cursor-pointer"
                          >
                            Why?
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explanation Modal — reuses the existing ExplanationModal component */}
      <ExplanationModal
        open={explainOpen}
        onClose={() => setExplainOpen(false)}
        variant="opening"
        activeTab={explainData?.tab ?? "played"}
        richExplanation={explainData?.explanation ?? null}
        title={explainData?.title}
        subtitle={explainData?.subtitle}
        fen={explainData?.fen}
        uciMoves={explainData?.uciMoves}
        boardOrientation={boardOrientation}
        autoPlay
      />
    </div>
  );
}
