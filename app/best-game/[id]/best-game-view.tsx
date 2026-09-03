"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { MoveBadge } from "@/components/move-badge";
import { useBoardSize } from "@/lib/use-board-size";
import {
  useBoardTheme,
  useShowCoordinates,
  useCustomPieces,
} from "@/lib/use-coins";

import type { BestGame } from "@/lib/best-game";

type AnnotatedMove = {
  san: string;
  moveNumber: number;
  side: "w" | "b";
  fen: string;
};

export function BestGameView({
  bestGame,
  scanId,
  username,
}: {
  bestGame: BestGame;
  scanId: string;
  username: string;
}) {
  const { ref: boardRef, size: boardSize } = useBoardSize(480);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();
  const [ply, setPly] = useState(0);

  // Parse PGN into annotated moves
  const moves = useMemo((): AnnotatedMove[] => {
    const tokens = bestGame.moves.trim().split(/\s+/);
    const result: AnnotatedMove[] = [];
    const chess = new Chess();
    for (const san of tokens) {
      try {
        const move = chess.move(san);
        if (move) {
          result.push({
            san: move.san,
            moveNumber: chess.moveNumber() - 1,
            side: move.color === "w" ? "w" : "b",
            fen: chess.fen(),
          });
        }
      } catch {
        break;
      }
    }
    return result;
  }, [bestGame.moves]);

  const totalPlies = moves.length;
  const currentFen = ply === 0 ? new Chess().fen() : moves[ply - 1].fen;
  const orientation = bestGame.userColor === "black" ? ("black" as const) : ("white" as const);

  const resultLabel =
    bestGame.winner === "white"
      ? "1–0"
      : bestGame.winner === "black"
        ? "0–1"
        : "½–½";

  const isWin = bestGame.isWin;

  const handleAnalyze = () => {
    try {
      const chess = new Chess();
      const tokens = bestGame.moves.trim().split(/\s+/);
      const headers = [
        `[Event "Best Game — ${username}"]`,
        `[Site "${bestGame.gameUrl ?? "FireChess"}"]`,
        `[White "${bestGame.whiteName ?? username}"]`,
        `[Black "${bestGame.blackName ?? "?"}"]`,
        `[Result "${bestGame.winner === "white" ? "1-0" : bestGame.winner === "black" ? "0-1" : "½-½"}"]`,
      ];
      if (bestGame.openingName) headers.push(`[Opening "${bestGame.openingName}"]`);
      if (bestGame.whiteRating) headers.push(`[WhiteElo "${bestGame.whiteRating}"]`);
      if (bestGame.blackRating) headers.push(`[BlackElo "${bestGame.blackRating}"]`);
      for (const san of tokens) {
        try { chess.move(san); } catch { break; }
      }
      const pgn = `${headers.join("\n")}\n\n${chess.pgn({ maxWidth: 80, newline: "\n" })}`;
      sessionStorage.setItem("firechess-library-pgn", pgn);
      sessionStorage.setItem("firechess-analyze-autostart", "workbench");
    } catch { /* ignore */ }
    window.location.href = "/analyze";
  };

  const goToStart = useCallback(() => setPly(0), []);
  const goBack = useCallback(() => setPly((p) => Math.max(0, p - 1)), []);
  const goForward = useCallback(() => setPly((p) => Math.min(totalPlies, p + 1)), [totalPlies]);
  const goToEnd = useCallback(() => setPly(totalPlies), [totalPlies]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goBack(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goForward(); }
      else if (e.key === "Home") { e.preventDefault(); goToStart(); }
      else if (e.key === "End") { e.preventDefault(); goToEnd(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack, goForward, goToStart, goToEnd]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href={`/report/${scanId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
      >
        ← Back to scan report
      </Link>

      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20">
          <span className="text-3xl">{isWin ? "🏆" : "⭐"}</span>
        </div>
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          {isWin ? "Your Best Win" : "Your Best Game"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {bestGame.whiteName ?? "?"} vs {bestGame.blackName ?? "?"}
          {" · "}
          {resultLabel}
          {bestGame.openingName ? ` · ${bestGame.openingName}` : ""}
        </p>
        {bestGame.endedInMate && bestGame.mate ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/[0.08] px-4 py-1.5 font-mono text-sm font-bold text-red-300">
            <span className="text-base">♛</span>
            {bestGame.mate.san}
            <span className="font-sans font-semibold text-red-200/80">
              {bestGame.mate.pattern
                ? `${bestGame.mate.pattern.toLowerCase()} · move ${bestGame.mate.moveNumber}`
                : `Checkmate · move ${bestGame.mate.moveNumber}`}
            </span>
          </p>
        ) : null}
      </div>

      {/* Board + moves */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
        {/* Board */}
        <div>
          <div ref={boardRef} className="mx-auto w-full max-w-[480px]">
            <div className="flex items-start gap-2">
              <EvalBar evalCp={0} height={boardSize} />
              <div className="overflow-hidden rounded-xl shadow-lg shadow-black/30">
                <Chessboard
                  id={`best-game-${scanId}`}
                  position={currentFen}
                  boardOrientation={orientation}
                  boardWidth={boardSize}
                  arePiecesDraggable={false}
                  customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                  customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                  showBoardNotation={showCoords}
                  customPieces={customPieces}
                />
              </div>
            </div>
          </div>

          {/* Navigation controls */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button onClick={goToStart} disabled={ply === 0} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30" title="Start">
              ⏮
            </button>
            <button onClick={goBack} disabled={ply === 0} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30" title="Previous">
              ◀
            </button>
            <span className="min-w-[5rem] text-center text-sm font-mono text-slate-400">
              {ply > 0 ? moves[ply - 1]?.san : "—"}
            </span>
            <button onClick={goForward} disabled={ply >= totalPlies} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30" title="Next">
              ▶
            </button>
            <button onClick={goToEnd} disabled={ply >= totalPlies} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30" title="End">
              ⏭
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-slate-500">
            {Math.ceil(ply / 2)}/{Math.ceil(totalPlies / 2)} move
            {ply > 0 ? ` · ${ply % 2 === 1 ? "White" : "Black"} to play` : ""}
          </p>
        </div>

        {/* Move list */}
        <div>
          {/* Game info card */}
          <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">White</p>
                <p className="mt-0.5 font-bold text-white">{bestGame.whiteName ?? "?"}</p>
                {bestGame.whiteRating != null && <p className="text-xs text-slate-400">{bestGame.whiteRating}</p>}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Black</p>
                <p className="mt-0.5 font-bold text-white">{bestGame.blackName ?? "?"}</p>
                {bestGame.blackRating != null && <p className="text-xs text-slate-400">{bestGame.blackRating}</p>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-300">{resultLabel}</span>
              {bestGame.endedInMate ? (
                <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-300">
                  Checkmate · move {bestGame.mate?.moveNumber}
                </span>
              ) : null}
              {bestGame.brilliantCount > 0 && (
                <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                  {bestGame.brilliantCount} brilliant{bestGame.brilliantCount > 1 ? "s" : ""}
                </span>
              )}
              {bestGame.missedTacticsInGame > 0 && (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300/90">
                  {bestGame.missedTacticsInGame} missed tactic{bestGame.missedTacticsInGame > 1 ? "s" : ""}
                </span>
              )}
              {bestGame.endgameErrorsInGame > 0 && (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300/90">
                  {bestGame.endgameErrorsInGame} endgame slip{bestGame.endgameErrorsInGame > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Move list */}
          <div className="max-h-[32rem] overflow-y-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-1">
              {Array.from({ length: Math.ceil(totalPlies / 2) }, (_, i) => {
                const w = moves[i * 2];
                const b = moves[i * 2 + 1];
                const wActive = ply === i * 2 + 1;
                const bActive = ply === i * 2 + 2;
                return (
                  <div key={i} className={`contents text-sm ${wActive || bActive ? "rounded bg-white/[0.06]" : ""}`}>
                    <span className="text-[11px] font-mono text-slate-500">{i + 1}.</span>
                    <button
                      onClick={() => setPly(i * 2 + 1)}
                      className={`rounded px-1.5 py-0.5 text-left font-mono transition ${
                        wActive ? "bg-orange-500/20 font-bold text-orange-200" : "text-slate-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      {w?.san ?? ""}
                    </button>
                    <button
                      onClick={() => b ? setPly(i * 2 + 2) : undefined}
                      className={`rounded px-1.5 py-0.5 text-left font-mono transition ${
                        bActive ? "bg-orange-500/20 font-bold text-orange-200" : "text-slate-300 hover:bg-white/[0.04]"
                      } ${!b ? "opacity-30" : ""}`}
                    >
                      {b?.san ?? ""}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full analysis button */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAnalyze}
              className="btn-cta-fire group inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Full Analysis with Stockfish
            </button>

            {bestGame.gameUrl?.startsWith("http") && (
              <a
                href={bestGame.gameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View on {bestGame.gameUrl.includes("lichess") ? "Lichess" : "Chess.com"}
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
