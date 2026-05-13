"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { playSound } from "@/lib/sounds";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import { stockfishClient } from "@/lib/stockfish-client";
import type { GhostGameMove, GhostCookCandidate } from "@/lib/schema";

/* ────────────────────────────────────────────────── Types ──────────── */

export type LegendGame = {
  id: string;
  whiteName: string;
  blackName: string;
  whiteElo: number | null;
  blackElo: number | null;
  tournament: string;
  eventDate: string;
  result: string;
  eco: string | null;
  openingName: string | null;
  moves: GhostGameMove[];
  playAs: "white" | "black";
  startPly: number;
  endPly: number;
  missionTitle: string;
  missionContext: string;
  missionObjective: string;
  difficulty: "beginner" | "intermediate" | "expert";
  tags: string[];
  featured: boolean;
  cookCandidates: GhostCookCandidate[];
  sourceUrl: string | null;
};

/* ────────────────────────────────────────────────── Helpers ────────── */

/** Clamp centipawn loss into a clean 0–1 sync contribution */
function syncContribution(
  userUci: string,
  masterUci: string,
  cookCandidates: GhostCookCandidate[],
  ply: number,
): number {
  // Check if user played master's exact move
  if (userUci === masterUci) return 1;

  // Check if user found a Cook (better than master) — still counts as sync ≥ 0.8
  const cook = cookCandidates.find(
    (c) => c.ply === ply && c.stockfishBestUci === userUci,
  );
  if (cook) return 0.85;

  return 0;
}

function uciToFromTo(uci: string): {
  from: string;
  to: string;
  promotion?: string;
} {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.slice(4, 5) || undefined,
  };
}

function difficultyBadge(d: "beginner" | "intermediate" | "expert") {
  const styles: Record<string, string> = {
    beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    expert: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return styles[d];
}

function syncColor(rate: number): string {
  if (rate >= 80) return "text-emerald-400";
  if (rate >= 50) return "text-amber-400";
  return "text-red-400";
}

function syncBarColor(rate: number): string {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-500";
  return "bg-red-500";
}

/**
 * Classify the user's move relative to the master's eval.
 * cpDiff = user's eval − master's eval (positive = user played better)
 */
type MoveBadge = { label: string; color: string; bg: string };

function classifyMoveBadge(
  userUci: string,
  masterUci: string,
  cpDiff: number,
): MoveBadge {
  if (userUci === masterUci)
    return {
      label: "⚡ Soul Sync",
      color: "text-emerald-300",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    };
  if (cpDiff >= 80)
    return {
      label: "🌀 Divergence!",
      color: "text-violet-300",
      bg: "bg-violet-500/10 border-violet-500/20",
    };
  if (cpDiff >= -30)
    return {
      label: "✓ Good",
      color: "text-blue-300",
      bg: "bg-blue-500/10 border-blue-500/20",
    };
  if (cpDiff >= -80)
    return {
      label: "~ Inaccuracy",
      color: "text-amber-300",
      bg: "bg-amber-500/10 border-amber-500/20",
    };
  if (cpDiff >= -200)
    return {
      label: "! Mistake",
      color: "text-orange-300",
      bg: "bg-orange-500/10 border-orange-500/20",
    };
  return {
    label: "✕ Blunder",
    color: "text-red-300",
    bg: "bg-red-500/10 border-red-500/20",
  };
}

/* ────────────────────────────────────────────────── Phase enum ──────── */

type Phase = "briefing" | "timelapse" | "play" | "result";

/* ────────────────────────────────────────────────── Component ──────── */

export function LegendsBoard({ game }: { game: LegendGame }) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const { ref: boardRef, size: boardSize } = useBoardSize(400, {
    evalBar: false,
  });

  const [phase, setPhase] = useState<Phase>("briefing");

  // Current board FEN
  const [fen, setFen] = useState<string>("start");

  // Ghost-trace toggle — show a faint glow on master's intended target square
  const [ghostTrace, setGhostTrace] = useState(true);

  // Ply index during time-lapse / play phase
  const [currentPly, setCurrentPly] = useState(0);

  // User's session stats
  const [movesPlayed, setMovesPlayed] = useState(0);
  const [syncPoints, setSyncPoints] = useState(0);
  const [cookFound, setCookFound] = useState(false);
  const [cookPly, setCookPly] = useState<number | null>(null);
  const [cookUci, setCookUci] = useState<string | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(
    null,
  );

  // Last move squares for highlighting
  const [lastMove, setLastMove] = useState<[string, string] | null>(null);

  // Result has been saved
  const [resultSaved, setResultSaved] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);

  // Live Stockfish analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastMoveBadge, setLastMoveBadge] = useState<MoveBadge | null>(null);

  const isFlipped = game.playAs === "black";
  const totalMoves = game.endPly - game.startPly + 1;

  /* ── Toast helper ─────────────────────────────────────────────────── */

  const showToast = useCallback(
    (msg: string, color = "text-amber-400", duration = 3000) => {
      setToast({ msg, color });
      setTimeout(() => setToast(null), duration);
    },
    [],
  );

  /* ── Time-lapse: advance board from ply 0 → startPly ─────────────── */

  useEffect(() => {
    if (phase !== "timelapse") return;

    let cancelled = false;
    const chess = new Chess();
    let i = 0;

    // Start from ply 0
    setCurrentPly(0);
    setFen("start");

    const tick = () => {
      if (cancelled) return;
      if (i >= game.startPly) {
        setFen(chess.fen());
        setPhase("play");
        setCurrentPly(game.startPly);
        return;
      }

      const mv = game.moves[i];
      if (!mv) {
        setPhase("play");
        setCurrentPly(game.startPly);
        return;
      }

      try {
        chess.move(mv.san);
        setFen(chess.fen());
        if (i === game.startPly - 1) {
          setLastMove([mv.uci.slice(0, 2), mv.uci.slice(2, 4)]);
        }
      } catch {
        /* skip illegal */
      }
      i++;
      setTimeout(tick, 80);
    };

    setTimeout(tick, 400);
    return () => {
      cancelled = true;
    };
  }, [phase, game]);

  /* ── Play phase: which ply is user's turn vs. opponent's ─────────── */

  /**
   * Ply parity:
   *  playAs "white" → user plays even plies (0,2,4…), opponent plays odd
   *  playAs "black" → user plays odd plies (1,3,5…), opponent plays even
   */
  const isUserTurn = useCallback(
    (ply: number): boolean => {
      if (game.playAs === "white") return ply % 2 === 0;
      return ply % 2 === 1;
    },
    [game.playAs],
  );

  /** Ghost trace: master's target square at current ply */
  const masterTargetSquare: string | null = useMemo(() => {
    if (!ghostTrace || phase !== "play") return null;
    if (!isUserTurn(currentPly)) return null;
    const mv = game.moves[currentPly];
    if (!mv) return null;
    return mv.uci.slice(2, 4);
  }, [ghostTrace, phase, currentPly, game.moves, isUserTurn]);

  /* ── Custom square styles: last-move highlight + ghost trace ──────── */

  const customSquareStyles: Record<string, React.CSSProperties> =
    useMemo(() => {
      const styles: Record<string, React.CSSProperties> = {};
      if (lastMove) {
        styles[lastMove[0]] = { backgroundColor: "rgba(255, 210, 0, 0.15)" };
        styles[lastMove[1]] = { backgroundColor: "rgba(255, 210, 0, 0.25)" };
      }
      if (masterTargetSquare) {
        styles[masterTargetSquare] = {
          ...(styles[masterTargetSquare] ?? {}),
          background:
            "radial-gradient(circle, rgba(251,191,36,0.45) 30%, transparent 70%)",
        };
      }
      return styles;
    }, [lastMove, masterTargetSquare]);

  /* ── Opponent plays historical move after delay ───────────────────── */

  const opponentMoveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playOpponentMove = useCallback(
    (ply: number, currentFen: string) => {
      if (opponentMoveRef.current) clearTimeout(opponentMoveRef.current);
      opponentMoveRef.current = setTimeout(() => {
        const mv = game.moves[ply];
        if (!mv) {
          setPhase("result");
          return;
        }
        const chess = new Chess(currentFen);
        try {
          const result = chess.move(mv.san);
          setFen(chess.fen());
          setLastMove([result.from, result.to]);
          playSound(result.captured ? "capture" : "move");
          const next = ply + 1;
          setCurrentPly(next);
          if (next > game.endPly) setPhase("result");
        } catch {
          setPhase("result");
        }
      }, 320);
    },
    [game.moves, game.endPly],
  );

  /* ── Handle user's piece drop ─────────────────────────────────────── */

  const handleDrop = useCallback(
    (sourceSquare: CbSquare, targetSquare: CbSquare, piece?: string) => {
      if (phase !== "play") return false;
      if (!isUserTurn(currentPly)) return false;

      const chess = new Chess(fen);
      const promotion = piece
        ? piece.toLowerCase().includes("q")
          ? undefined
          : piece.slice(1).toLowerCase()
        : undefined;

      let moveResult: ReturnType<typeof chess.move> | null = null;
      try {
        moveResult = chess.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: promotion || "q",
        });
      } catch {
        playSound("wrong");
        return false;
      }
      if (!moveResult) {
        playSound("wrong");
        return false;
      }

      const userUci = `${sourceSquare}${targetSquare}${moveResult.promotion ?? ""}`;
      const masterMv = game.moves[currentPly];
      const masterUci = masterMv?.uci ?? "";

      // Evaluate sync
      const contribution = syncContribution(
        userUci,
        masterUci,
        game.cookCandidates,
        currentPly,
      );
      const played = movesPlayed + 1;
      const points = syncPoints + contribution;
      setMovesPlayed(played);
      setSyncPoints(points);
      setLastMove([sourceSquare, targetSquare]);

      // Cook detection (pre-baked fast path)
      const isCook = game.cookCandidates.some(
        (c) => c.ply === currentPly && c.stockfishBestUci === userUci,
      );
      if (isCook && !cookFound) {
        setCookFound(true);
        setCookPly(currentPly);
        setCookUci(userUci);
        showToast(
          "🌀 Timeline Divergence! You found a stronger move!",
          "text-violet-400",
          4000,
        );
        playSound("correct");
      } else if (userUci === masterUci) {
        showToast("⚡ Perfect sync!", "text-emerald-400", 1800);
        playSound(moveResult.captured ? "capture" : "move");
      } else {
        showToast("� Legend disagrees…", "text-slate-400", 1800);
        playSound(moveResult.captured ? "capture" : "move");
      }

      const newFen = chess.fen();
      setFen(newFen);

      // ── Async Stockfish fallback: move quality + real-time cook detection ──
      const fenBeforeMove = fen;
      const capturedCookAlready = cookFound || isCook;
      const capturedPly = currentPly;
      const capturedUserUci = userUci;
      const capturedMasterUci = masterUci;

      const fenAfterMaster: string | null = (() => {
        if (!masterMv) return null;
        const tmp = new Chess(fenBeforeMove);
        try {
          tmp.move(masterMv.san);
          return tmp.fen();
        } catch {
          return null;
        }
      })();

      setIsAnalyzing(true);
      setLastMoveBadge(null);

      Promise.all([
        stockfishClient.evaluateFen(fenBeforeMove, 14),
        stockfishClient.evaluateFen(newFen, 14),
        fenAfterMaster
          ? stockfishClient.evaluateFen(fenAfterMaster, 14)
          : Promise.resolve(null),
      ])
        .then(([evalBefore, evalAfterUser, evalAfterMasterResult]) => {
          setIsAnalyzing(false);
          if (!evalBefore) return;

          const cpBefore = evalBefore.cp;
          const cpUser = evalAfterUser ? -evalAfterUser.cp : cpBefore;
          const cpMaster = evalAfterMasterResult
            ? -evalAfterMasterResult.cp
            : cpBefore;
          const cpDiff = cpUser - cpMaster;

          // Real-time cook: user’s move ≥80cp better than the master’s move
          if (!capturedCookAlready && cpDiff >= 80) {
            setCookFound(true);
            setCookPly(capturedPly);
            setCookUci(capturedUserUci);
            showToast(
              "🌀 Timeline Divergence! You found a stronger move!",
              "text-violet-400",
              4000,
            );
            playSound("correct");
            setLastMoveBadge({
              label: "🌀 Divergence!",
              color: "text-violet-300",
              bg: "bg-violet-500/10 border-violet-500/20",
            });
            return;
          }

          setLastMoveBadge(
            classifyMoveBadge(capturedUserUci, capturedMasterUci, cpDiff),
          );
        })
        .catch(() => setIsAnalyzing(false));

      const next = currentPly + 1;
      setCurrentPly(next);

      if (next > game.endPly) {
        setPhase("result");
        return true;
      }

      // Opponent's turn
      if (!isUserTurn(next)) {
        playOpponentMove(next, newFen);
      }

      return true;
    },
    [
      phase,
      fen,
      currentPly,
      isUserTurn,
      game,
      movesPlayed,
      syncPoints,
      cookFound,
      showToast,
      playOpponentMove,
    ],
  );

  /* ── Handle user's square click (mobile-friendly) ─────────────────── */

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const handleSquareClick = useCallback(
    (square: CbSquare) => {
      if (phase !== "play") return;
      if (!isUserTurn(currentPly)) return;

      if (!selectedSquare) {
        setSelectedSquare(square);
        return;
      }

      const chess = new Chess(fen);
      const pieceAtSelected = chess.get(
        selectedSquare as Parameters<typeof chess.get>[0],
      );
      if (!pieceAtSelected) {
        setSelectedSquare(square);
        return;
      }

      let moveResult: ReturnType<typeof chess.move> | null = null;
      try {
        moveResult = chess.move({
          from: selectedSquare,
          to: square,
          promotion: "q",
        });
      } catch {
        /* illegal */
      }

      if (!moveResult) {
        setSelectedSquare(square);
        return;
      }

      setSelectedSquare(null);
      handleDrop(
        selectedSquare,
        square,
        `w${pieceAtSelected.type.toUpperCase()}`,
      );
    },
    [phase, currentPly, isUserTurn, selectedSquare, fen, handleDrop],
  );

  /* ── Compute final sync rate ──────────────────────────────────────── */

  const syncRate =
    movesPlayed > 0 ? Math.round((syncPoints / movesPlayed) * 100) : 0;

  /* ── Save result once result phase is reached ─────────────────────── */

  useEffect(() => {
    if (phase !== "result" || resultSaved) return;
    setResultSaved(true);

    fetch("/api/legends/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: game.id,
        syncRate,
        movesPlayed,
        movesMatched: Math.round(syncPoints),
        cookFound,
        cookPly: cookPly ?? undefined,
        cookUci: cookUci ?? undefined,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.id) setResultId(d.id);
      })
      .catch(() => {
        /* swallow */
      });
  }, [
    phase,
    resultSaved,
    game.id,
    syncRate,
    movesPlayed,
    syncPoints,
    cookFound,
    cookPly,
    cookUci,
  ]);

  /* ── Share card URL ─────────────────────────────────────────────────── */

  const shareCardUrl = useMemo(() => {
    const base = "/api/legends/share-card";
    const p = new URLSearchParams({
      syncRate: String(syncRate),
      cookFound: cookFound ? "1" : "0",
      whiteName: game.whiteName,
      blackName: game.blackName,
      playAs: game.playAs,
      tournament: game.tournament,
      eventDate: game.eventDate,
      fen,
    });
    return `${base}?${p.toString()}`;
  }, [syncRate, cookFound, game, fen]);

  /* ── Sync meter bar width ─────────────────────────────────────────── */

  const syncBarWidth = Math.min(100, syncRate);

  /* ────────────────────────────────────────────── RENDERS ─────────── */

  /* Briefing modal */
  if (phase === "briefing") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-950/60 to-slate-900 px-6 py-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold tracking-widest uppercase mb-2">
              <span>�</span> Legends
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              {game.missionTitle}
            </h1>
          </div>

          {/* Mission info */}
          <div className="p-6 space-y-5">
            {/* Players */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="text-slate-400 text-xs uppercase tracking-widest mb-0.5">
                  White
                </div>
                <div className="text-white font-semibold">{game.whiteName}</div>
                {game.whiteElo && (
                  <div className="text-slate-500 text-xs">{game.whiteElo}</div>
                )}
              </div>
              <div className="text-slate-500 text-lg font-bold">vs</div>
              <div className="text-right">
                <div className="text-slate-400 text-xs uppercase tracking-widest mb-0.5">
                  Black
                </div>
                <div className="text-white font-semibold">{game.blackName}</div>
                {game.blackElo && (
                  <div className="text-slate-500 text-xs">{game.blackElo}</div>
                )}
              </div>
            </div>

            <div className="text-slate-400 text-xs">
              {game.tournament} · {game.eventDate?.slice(0, 4)}
              {game.openingName && (
                <>
                  {" "}
                  · <span className="text-slate-300">{game.openingName}</span>
                </>
              )}
            </div>

            {/* Difficulty */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${difficultyBadge(game.difficulty)}`}
              >
                {game.difficulty.charAt(0).toUpperCase() +
                  game.difficulty.slice(1)}
              </span>
              {game.featured && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  ⭐ Featured
                </span>
              )}
            </div>

            {/* Context */}
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-widest mb-1.5">
                Mission Briefing
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">
                {game.missionContext}
              </p>
            </div>

            {/* Objective */}
            <div className="bg-violet-500/[0.07] border border-violet-500/20 rounded-xl px-4 py-3">
              <div className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-1">
                Your Objective
              </div>
              <p className="text-violet-100 text-sm">{game.missionObjective}</p>
            </div>

            {/* You play as */}
            <div className="text-sm text-slate-300">
              You play as{" "}
              <span className="font-bold text-white">
                {game.playAs === "white" ? game.whiteName : game.blackName}
              </span>
              <span className="text-slate-500"> ({game.playAs})</span>
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <button
              onClick={() => setPhase("timelapse")}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-bold rounded-xl transition-all text-base shadow-lg shadow-violet-900/50"
            >
              Enter the Legend's Position →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Result screen */
  if (phase === "result") {
    const shareText = encodeURIComponent(
      `I matched ${syncRate}% of ${game.playAs === "white" ? game.whiteName : game.blackName}'s moves on Legends${cookFound ? " — and found a BETTER move! 🌀" : ""}. Can you beat it? firechess.com/legends/${game.id}`,
    );

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 border-b border-white/[0.06] text-center">
            <div className="text-3xl mb-1">�</div>
            <h2 className="text-xl font-black text-white">Mission Complete</h2>
            <div className="text-slate-400 text-sm mt-1">
              {game.missionTitle}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Sync rate */}
            <div className="text-center">
              <div className={`text-7xl font-black ${syncColor(syncRate)}`}>
                {syncRate}%
              </div>
              <div className="text-slate-400 text-sm mt-1">
                Sync with the Ghost
              </div>

              {/* Bar */}
              <div className="mt-3 bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${syncBarColor(syncRate)}`}
                  style={{ width: `${syncBarWidth}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-white/[0.05]">
                <div className="text-2xl font-black text-white">
                  {movesPlayed}
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  Moves Played
                </div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-white/[0.05]">
                <div className="text-2xl font-black text-white">
                  {Math.round(syncPoints)}
                </div>
                <div className="text-slate-400 text-xs mt-0.5">Matched</div>
              </div>
            </div>

            {/* Cook badge */}
            {cookFound && (
              <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl px-4 py-3 text-center">
                <div className="text-violet-400 font-black text-lg">
                  🌀 Timeline Divergence!
                </div>
                <div className="text-violet-300 text-sm mt-0.5">
                  You found a stronger move than the legend played
                </div>
              </div>
            )}

            {/* Share */}
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-xl text-center transition-colors"
              >
                Share on X
              </a>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/legends/${game.id}`;
                  navigator.clipboard?.writeText(url);
                  showToast("Link copied!", "text-emerald-400", 1500);
                }}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Copy Link
              </button>
            </div>

            {/* Play again */}
            <button
              onClick={() => {
                setPhase("briefing");
                setFen("start");
                setCurrentPly(0);
                setMovesPlayed(0);
                setSyncPoints(0);
                setCookFound(false);
                setCookPly(null);
                setCookUci(null);
                setLastMove(null);
                setResultSaved(false);
                setResultId(null);
                setIsAnalyzing(false);
                setLastMoveBadge(null);
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Play Again
            </button>

            <a
              href="/legends"
              className="block text-center text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              ← Back to missions
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* Time-lapse + Play phases — main board UI */

  const userSide = game.playAs === "white" ? game.whiteName : game.blackName;
  const liveTotal = isUserTurn(currentPly) ? movesPlayed + 1 : movesPlayed;
  const liveSyncRate =
    liveTotal > 0 ? Math.round((syncPoints / liveTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-slate-900/80 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">�</span>
          <div>
            <div className="text-white font-bold text-sm leading-tight">
              {game.missionTitle}
            </div>
            <div className="text-slate-500 text-xs">
              {game.whiteName} vs {game.blackName} ·{" "}
              {game.eventDate?.slice(0, 4)}
            </div>
          </div>
        </div>
        {phase === "timelapse" && (
          <div className="text-slate-500 text-xs animate-pulse">
            Traveling to the moment…
          </div>
        )}
        {phase === "play" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sync</span>
            <span className={`font-black text-base ${syncColor(liveSyncRate)}`}>
              {liveSyncRate}%
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-0 md:gap-4 p-2 md:p-4 max-w-6xl mx-auto w-full">
        {/* Board */}
        <div className="flex flex-col items-center gap-3 flex-1">
          {/* Opponent label */}
          <div className="text-slate-400 text-xs self-start pl-1">
            {isFlipped
              ? userSide
              : game.playAs === "white"
                ? game.blackName
                : game.whiteName}
          </div>

          <div ref={boardRef} className="w-full max-w-[560px]">
            <Chessboard
              id="legends-board"
              position={fen}
              onPieceDrop={handleDrop}
              onSquareClick={handleSquareClick}
              boardOrientation={isFlipped ? "black" : "white"}
              boardWidth={boardSize}
              customDarkSquareStyle={{
                backgroundColor: boardTheme.darkSquare,
              }}
              customLightSquareStyle={{
                backgroundColor: boardTheme.lightSquare,
              }}
              customPieces={customPieces}
              customSquareStyles={customSquareStyles}
              arePiecesDraggable={phase === "play" && isUserTurn(currentPly)}
            />
          </div>

          {/* User label */}
          <div className="text-slate-200 text-sm font-semibold self-start pl-1">
            {isFlipped
              ? game.playAs === "white"
                ? game.blackName
                : game.whiteName
              : userSide}
            <span className="text-slate-500 text-xs font-normal ml-1">
              ({game.playAs})
            </span>
          </div>

          {/* Mobile: move quality badge */}
          {phase === "play" && (isAnalyzing || lastMoveBadge) && !cookFound && (
            <div className="md:hidden w-full max-w-[560px]">
              {isAnalyzing ? (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs pl-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
                  Analysing…
                </div>
              ) : lastMoveBadge ? (
                <div
                  className={`text-xs font-bold px-2 py-1 rounded-lg border inline-block ${lastMoveBadge.bg} ${lastMoveBadge.color}`}
                >
                  {lastMoveBadge.label}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden md:flex flex-col gap-4 w-64 shrink-0">
          {/* Sync meter */}
          <div className="bg-slate-900 border border-white/[0.08] rounded-xl p-4">
            <div className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-3">
              Sync Meter
            </div>
            <div
              className={`text-4xl font-black ${syncColor(liveSyncRate)} mb-2`}
            >
              {liveSyncRate}%
            </div>
            <div className="bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${syncBarColor(liveSyncRate)}`}
                style={{ width: `${Math.min(100, liveSyncRate)}%` }}
              />
            </div>
            <div className="text-slate-500 text-xs mt-2">
              {Math.round(syncPoints)} / {movesPlayed} matched
            </div>
          </div>

          {/* Ghost trace toggle */}
          <div className="bg-slate-900 border border-white/[0.08] rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setGhostTrace((v) => !v)}
                className={`w-10 h-6 rounded-full transition-colors ${ghostTrace ? "bg-amber-500" : "bg-slate-700"} relative`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${ghostTrace ? "left-5" : "left-1"}`}
                />
              </div>
              <div>
                <div className="text-sm text-slate-200 font-medium">
                  Ghost Trace
                </div>
                <div className="text-xs text-slate-500">
                  Show master's target square
                </div>
              </div>
            </label>
          </div>

          {/* Cook badge */}
          {cookFound && (
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 text-center">
              <div className="text-violet-400 font-black">
                🌀 Timeline Divergence!
              </div>
              <div className="text-violet-300 text-xs mt-1">
                You found a better move!
              </div>
            </div>
          )}

          {/* Move quality badge (Stockfish eval) */}
          {(isAnalyzing || lastMoveBadge) && !cookFound && (
            <div
              className={`rounded-xl p-3 text-center border transition-all ${
                isAnalyzing
                  ? "bg-slate-800/60 border-white/[0.05]"
                  : `${lastMoveBadge?.bg ?? ""}`
              }`}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
                  <span className="inline-block w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
                  Analysing…
                </div>
              ) : lastMoveBadge ? (
                <div className={`font-bold text-sm ${lastMoveBadge.color}`}>
                  {lastMoveBadge.label}
                </div>
              ) : null}
            </div>
          )}

          {/* Mission context */}
          {phase === "play" && (
            <div className="bg-slate-900 border border-white/[0.08] rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-2">
                Mission
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {game.missionObjective}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-slate-800/90 backdrop-blur border border-white/[0.1] shadow-xl text-sm font-semibold ${toast.color} pointer-events-none`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
