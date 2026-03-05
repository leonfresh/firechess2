"use client";

/**
 * /roast — Guess the Elo (AnarchyChess Roast Edition)
 *
 * Watch real Lichess games move by move with Gotham Chess / AnarchyChess-style
 * commentary generated from Stockfish evaluations. Then guess the players' Elo.
 *
 * Features:
 * - Fetches real games from Lichess for authentic blunders
 * - Client-side Stockfish analysis for accurate move classification
 * - Massive roast commentary pool (600+ unique lines)
 * - Autoplay with adjustable speed
 * - Elo guessing with bracket system
 * - Shareable results
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates, useCustomPieces } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import { stockfishPool } from "@/lib/stockfish-client";
import {
  classifyMove,
  generateMoveComment,
  getEloFlavorLine,
  ELO_BRACKETS,
  getEloBracketIdx,
  GAME_INTRO,
  GAME_SUMMARY_LINES,
  REVEAL_CORRECT,
  REVEAL_TOO_HIGH,
  REVEAL_TOO_LOW,
  type AnalyzedMove,
  type MoveClassification,
  type GameSummary,
} from "@/lib/roast-commentary";

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

interface GameData {
  id: string;
  pgn: string;
  whitePlayer: string;
  blackPlayer: string;
  whiteElo: number;
  blackElo: number;
  avgElo: number;
  opening: string;
  result: string;
  termination: string;
  winner: "white" | "black" | null;
}

interface MoveWithComment {
  san: string;
  fen: string;         // position after the move
  fenBefore: string;    // position before the move
  from: string;
  to: string;
  color: "w" | "b";
  moveNumber: number;
  cp: number;           // eval after this move (from white's POV)
  cpLoss: number;
  bestMoveSan: string | null;
  classification: MoveClassification;
  comment: string | null;
  piece: string;
  isCapture: boolean;
  isCheck: boolean;
}

type PageState = "loading" | "intro" | "watching" | "guessing" | "revealed";

/* ================================================================== */
/*  PGN Parsing                                                         */
/* ================================================================== */

function parsePgnMoves(pgn: string): string[] {
  const chess = new Chess();
  try { chess.loadPgn(pgn); } catch { return []; }
  return chess.history();
}

/* ================================================================== */
/*  Main component                                                      */
/* ================================================================== */

export default function RoastPage() {
  /* ── Board rendering ── */
  const { ref: boardRef, size: boardSize } = useBoardSize(640, { evalBar: false });
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();

  /* ── Game state ── */
  const [pageState, setPageState] = useState<PageState>("loading");
  const [game, setGame] = useState<GameData | null>(null);
  const [moves, setMoves] = useState<MoveWithComment[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [fen, setFen] = useState("start");
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [introLine, setIntroLine] = useState("");
  const [autoplay, setAutoplay] = useState(true);
  const [speed, setSpeed] = useState<number>(1800); // ms between moves
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedBracket, setSelectedBracket] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [commentHistory, setCommentHistory] = useState<string[]>([]);
  const commentBoxRef = useRef<HTMLDivElement>(null);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [revealLine, setRevealLine] = useState("");
  const [summaryLine, setSummaryLine] = useState("");
  const [eloFlavor, setEloFlavor] = useState("");

  // Stats for summary
  const [blunders, setBlunders] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [inaccuracies, setInaccuracies] = useState(0);

  const usedLines = useRef(new Set<string>());

  /* ── Fetch a new game ── */
  const fetchGame = useCallback(async () => {
    setPageState("loading");
    setMoves([]);
    setCurrentIdx(-1);
    setFen("start");
    setLastMove(null);
    setCommentHistory([]);
    setAutoplay(true);
    setSelectedBracket(null);
    setRevealLine("");
    setSummaryLine("");
    setEloFlavor("");
    usedLines.current.clear();

    try {
      const res = await fetch("/api/roast");
      if (!res.ok) throw new Error("fetch failed");
      const data: GameData = await res.json();
      setGame(data);

      // Randomly orient the board
      setOrientation(Math.random() > 0.5 ? "white" : "black");

      // Parse and analyze the game
      const sans = parsePgnMoves(data.pgn);
      if (sans.length < 10) {
        // Too short, skip and retry
        setTimeout(fetchGame, 500);
        return;
      }

      setAnalyzing(true);
      setAnalysisProgress(0);

      const chess = new Chess();
      const analyzed: MoveWithComment[] = [];
      const usedSet = usedLines.current;

      let totalBlunders = 0;
      let totalMistakes = 0;
      let totalInaccuracies = 0;

      // Limit to first 60 moves to keep it reasonable
      const maxMoves = Math.min(sans.length, 60);

      for (let i = 0; i < maxMoves; i++) {
        const fenBefore = chess.fen();

        // Evaluate position before the move
        let cpBefore = 0;
        try {
          const evalBefore = await stockfishPool.evaluateFen(fenBefore, 12);
          cpBefore = evalBefore?.cp ?? 0;
        } catch {}

        // Get the best move from this position
        let bestMoveSan: string | null = null;
        try {
          const pv = await stockfishPool.getPrincipalVariation(fenBefore, 1, 12);
          if (pv?.pvMoves?.[0]) {
            // Convert UCI to SAN
            const tmp = new Chess(fenBefore);
            try {
              const m = tmp.move({ from: pv.pvMoves[0].slice(0, 2), to: pv.pvMoves[0].slice(2, 4), promotion: pv.pvMoves[0].slice(4, 5) || undefined } as any);
              bestMoveSan = m?.san ?? null;
            } catch {}
          }
        } catch {}

        // Play the actual move
        let moveResult;
        try {
          moveResult = chess.move(sans[i]);
        } catch {
          break;
        }
        if (!moveResult) break;

        const fenAfter = chess.fen();

        // Evaluate position after the move
        let cpAfter = 0;
        try {
          const evalAfter = await stockfishPool.evaluateFen(fenAfter, 12);
          cpAfter = evalAfter?.cp ?? 0;
        } catch {}

        // CP loss calculation: from the moving side's perspective
        // cpBefore is from side-to-move perspective (the player making the move)
        // cpAfter is from the NEW side-to-move perspective (opponent after the move)
        // So the player's eval went from cpBefore to -cpAfter
        const sideMultiplier = moveResult.color === "w" ? 1 : -1;
        const evalBeforeForSide = cpBefore * sideMultiplier;
        const evalAfterForSide = -cpAfter * sideMultiplier;
        const cpLoss = Math.max(0, evalBeforeForSide - evalAfterForSide);

        const isBestMove = bestMoveSan === moveResult.san;
        const classification = classifyMove(cpLoss, isBestMove);

        if (classification === "blunder") totalBlunders++;
        if (classification === "mistake") totalMistakes++;
        if (classification === "inaccuracy") totalInaccuracies++;

        // Generate commentary
        const moveNumber = Math.floor(i / 2) + 1;
        const analyzedMove: AnalyzedMove = {
          san: moveResult.san,
          uci: moveResult.from + moveResult.to + (moveResult.promotion ?? ""),
          moveNumber,
          color: moveResult.color,
          fen: fenBefore,
          fenAfter,
          cpBefore: evalBeforeForSide,
          cpAfter: evalAfterForSide,
          bestMoveSan,
          cpLoss,
          classification,
          isCapture: !!moveResult.captured,
          isCheck: chess.isCheck(),
          isCastle: moveResult.san === "O-O" || moveResult.san === "O-O-O",
          isPromotion: !!moveResult.promotion,
          pieceType: moveResult.piece,
          capturedPiece: moveResult.captured ?? undefined,
          hungPiece: cpLoss > 200 && !moveResult.captured,
          hungWhat: cpLoss > 200 ? moveResult.piece : undefined,
          sacrificedMaterial: !!moveResult.captured && cpLoss > 150,
          wasBookMove: i < 10 && cpLoss < 10,
          mateInN: null,
          missedMateInN: null,
          walkedIntoFork: false,
          walkedIntoPin: false,
          evalSwing: cpLoss,
          isResignationWorthy: evalAfterForSide < -500 && evalBeforeForSide > -200,
        };

        const gameSummary: GameSummary = {
          moves: analyzed as unknown as AnalyzedMove[],
          whiteElo: data.whiteElo,
          blackElo: data.blackElo,
          avgElo: data.avgElo,
          result: data.result,
          opening: data.opening,
          totalBlunders,
          totalMistakes,
          worstMove: null,
          bestMove: null,
          biggestSwing: null,
        };

        const comment = generateMoveComment(analyzedMove, usedSet, gameSummary);

        analyzed.push({
          san: moveResult.san,
          fen: fenAfter,
          fenBefore,
          from: moveResult.from,
          to: moveResult.to,
          color: moveResult.color,
          moveNumber,
          cp: cpAfter,
          cpLoss,
          bestMoveSan,
          classification,
          comment,
          piece: moveResult.piece,
          isCapture: !!moveResult.captured,
          isCheck: chess.isCheck(),
        });

        setAnalysisProgress(Math.round(((i + 1) / maxMoves) * 100));
      }

      setMoves(analyzed);
      setBlunders(totalBlunders);
      setMistakes(totalMistakes);
      setInaccuracies(totalInaccuracies);
      setAnalyzing(false);

      // Intro
      const intro = GAME_INTRO[Math.floor(Math.random() * GAME_INTRO.length)];
      setIntroLine(intro);
      setPageState("intro");
    } catch (err) {
      console.error("Failed to fetch game:", err);
      setTimeout(fetchGame, 2000);
    }
  }, []);

  /* ── Initialize ── */
  useEffect(() => {
    preloadSounds();
    fetchGame();
  }, [fetchGame]);

  /* ── Autoplay ── */
  useEffect(() => {
    if (pageState !== "watching" || !autoplay) return;
    if (currentIdx >= moves.length - 1) {
      // Game over, go to guessing
      setTimeout(() => setPageState("guessing"), 1500);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIdx(prev => {
        const next = prev + 1;
        const move = moves[next];
        if (move) {
          setFen(move.fen);
          setLastMove({ from: move.from, to: move.to });

          // Play sound
          if (move.isCheck) playSound("check");
          else if (move.isCapture) playSound("capture");
          else playSound("move");

          // Add comment to history
          if (move.comment) {
            setCommentHistory(prev => [...prev, move.comment!]);
          }
        }
        return next;
      });
    }, speed);

    return () => clearTimeout(timer);
  }, [pageState, autoplay, currentIdx, moves, speed]);

  /* ── Scroll comment box to bottom ── */
  useEffect(() => {
    if (commentBoxRef.current) {
      commentBoxRef.current.scrollTop = commentBoxRef.current.scrollHeight;
    }
  }, [commentHistory]);

  /* ── Start watching after intro ── */
  const startWatching = useCallback(() => {
    setPageState("watching");
    setCurrentIdx(-1);
    setFen("start");
    setLastMove(null);
  }, []);

  /* ── Manual navigation ── */
  const goToMove = useCallback((idx: number) => {
    if (idx < -1 || idx >= moves.length) return;
    setCurrentIdx(idx);
    if (idx === -1) {
      setFen("start");
      setLastMove(null);
    } else {
      const m = moves[idx];
      setFen(m.fen);
      setLastMove({ from: m.from, to: m.to });
    }
    // Show all comments up to this move
    const comments = moves.slice(0, idx + 1)
      .map(m => m.comment)
      .filter(Boolean) as string[];
    setCommentHistory(comments);
  }, [moves]);

  const skipToGuess = useCallback(() => {
    // Jump to end and go to guessing
    if (moves.length > 0) {
      const last = moves[moves.length - 1];
      setFen(last.fen);
      setLastMove({ from: last.from, to: last.to });
      setCurrentIdx(moves.length - 1);
      const comments = moves.map(m => m.comment).filter(Boolean) as string[];
      setCommentHistory(comments);
    }
    setAutoplay(false);
    setPageState("guessing");
  }, [moves]);

  /* ── Guess handling ── */
  const handleGuess = useCallback((bracketIdx: number) => {
    if (!game || selectedBracket !== null) return;
    setSelectedBracket(bracketIdx);

    const actualIdx = getEloBracketIdx(game.avgElo);
    const distance = Math.abs(bracketIdx - actualIdx);

    let result: "correct" | "close" | "wrong";
    let revealPool: readonly string[];

    if (distance === 0) {
      result = "correct";
      revealPool = REVEAL_CORRECT;
      playSound("correct");
    } else if (distance === 1) {
      result = "close";
      revealPool = REVEAL_CORRECT; // close enough gets a positive line
      playSound("correct");
    } else if (bracketIdx > actualIdx) {
      result = "wrong";
      revealPool = REVEAL_TOO_HIGH;
      playSound("wrong");
    } else {
      result = "wrong";
      revealPool = REVEAL_TOO_LOW;
      playSound("wrong");
    }

    if (result === "correct" || result === "close") {
      setScore(prev => prev + (result === "correct" ? 3 : 1));
    }
    setGamesPlayed(prev => prev + 1);

    const line = revealPool[Math.floor(Math.random() * revealPool.length)]
      .replace("{elo}", String(game.avgElo));
    setRevealLine(line);

    setEloFlavor(getEloFlavorLine(game.avgElo));

    // Summary line
    const totalMoves = moves.length;
    const freq = blunders > 0 ? Math.round(totalMoves / blunders) : totalMoves;
    const sumLine = GAME_SUMMARY_LINES[Math.floor(Math.random() * GAME_SUMMARY_LINES.length)]
      .replace("{blunders}", String(blunders))
      .replace("{mistakes}", String(mistakes))
      .replace("{inaccuracies}", String(inaccuracies))
      .replace("{elo}", String(game.avgElo))
      .replace("{totalMoves}", String(totalMoves))
      .replace("{frequency}", String(freq));
    setSummaryLine(sumLine);

    setTimeout(() => setPageState("revealed"), 600);
  }, [game, selectedBracket, moves.length, blunders, mistakes, inaccuracies]);

  /* ── Square styles ── */
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: "rgba(255, 255, 0, 0.25)" };
    customSquareStyles[lastMove.to] = { backgroundColor: "rgba(255, 255, 0, 0.35)" };
  }

  /* ── Classification color ── */
  const classColor = (c: MoveClassification) => {
    switch (c) {
      case "brilliant": return "text-cyan-400";
      case "great": case "best": return "text-emerald-400";
      case "good": return "text-green-400";
      case "book": return "text-slate-400";
      case "inaccuracy": return "text-yellow-400";
      case "mistake": return "text-orange-400";
      case "blunder": return "text-red-400";
      case "miss": return "text-red-500";
      default: return "text-slate-400";
    }
  };

  const classIcon = (c: MoveClassification) => {
    switch (c) {
      case "brilliant": return "✨";
      case "great": case "best": return "✅";
      case "good": return "👍";
      case "book": return "📖";
      case "inaccuracy": return "⚠️";
      case "mistake": return "❌";
      case "blunder": return "💀";
      case "miss": return "🫠";
      default: return "•";
    }
  };

  /* ── Current move info ── */
  const currentMove = currentIdx >= 0 && currentIdx < moves.length ? moves[currentIdx] : null;

  /* ══════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                            */
  /* ══════════════════════════════════════════════════════════════════ */

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-red-500/[0.04] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-orange-500/[0.04] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Roast the Elo 🔥
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Watch real games. Read the roasts. Guess the rating.
          </p>
          {gamesPlayed > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Score: <span className="font-bold text-amber-400">{score}</span> / {gamesPlayed * 3} ({gamesPlayed} games)
            </p>
          )}
        </div>

        {/* ── Loading / Analyzing ── */}
        {(pageState === "loading" || analyzing) && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-white/10 border-t-orange-400" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">🔥</span>
            </div>
            {analyzing ? (
              <>
                <p className="text-sm text-slate-400">Stockfish is judging every move…</p>
                <div className="w-48 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">{analysisProgress}% analyzed</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Finding a game to roast…</p>
            )}
          </div>
        )}

        {/* ── Intro screen ── */}
        {pageState === "intro" && game && !analyzing && (
          <div className="flex flex-col items-center gap-6 py-12 animate-fadeIn">
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-8 text-center max-w-lg">
              <p className="text-xl font-bold text-orange-300 mb-4">&ldquo;{introLine}&rdquo;</p>
              <div className="space-y-2 text-sm text-slate-400">
                <p>📋 Opening: <span className="text-white font-medium">{game.opening}</span></p>
                <p>🕐 {moves.length} moves played</p>
                <p>🏁 Result: <span className="font-mono text-white">{game.result}</span>
                  {game.termination && <span className="text-slate-500"> ({game.termination})</span>}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <span>💀 {blunders} blunders</span>
                <span>·</span>
                <span>❌ {mistakes} mistakes</span>
                <span>·</span>
                <span>⚠️ {inaccuracies} inaccuracies</span>
              </div>
            </div>

            <button
              onClick={startWatching}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:brightness-110 hover:scale-105 active:scale-95"
            >
              Start Watching 🍿
            </button>
          </div>
        )}

        {/* ── Main game view (watching / guessing / revealed) ── */}
        {(pageState === "watching" || pageState === "guessing" || pageState === "revealed") && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            {/* Board column */}
            <div className="flex flex-col items-center gap-3">
              {/* Player labels */}
              <div className="w-full max-w-[640px] flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`h-3 w-3 rounded-full ${orientation === "black" ? "bg-white border border-slate-400" : "bg-zinc-800 border border-zinc-500"}`} />
                  <span className="text-slate-300">{orientation === "white" ? game?.blackPlayer : game?.whitePlayer}</span>
                  {pageState === "revealed" && (
                    <span className="text-xs text-slate-500 font-mono">
                      ({orientation === "white" ? game?.blackElo : game?.whiteElo})
                    </span>
                  )}
                </div>
                {currentMove && (
                  <span className={`text-xs font-bold ${classColor(currentMove.classification)}`}>
                    {classIcon(currentMove.classification)} {currentMove.classification}
                  </span>
                )}
              </div>

              <div ref={boardRef} className="w-full max-w-[640px]">
                <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/40">
                  <Chessboard
                    id="roast-board"
                    position={fen}
                    boardOrientation={orientation}
                    boardWidth={boardSize}
                    arePiecesDraggable={false}
                    animationDuration={200}
                    customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                    customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                    showBoardNotation={showCoords}
                    customSquareStyles={customSquareStyles}
                    customPieces={customPieces}
                  />
                </div>
              </div>

              {/* Bottom player label */}
              <div className="w-full max-w-[640px] flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`h-3 w-3 rounded-full ${orientation === "white" ? "bg-white border border-slate-400" : "bg-zinc-800 border border-zinc-500"}`} />
                  <span className="text-slate-300">{orientation === "white" ? game?.whitePlayer : game?.blackPlayer}</span>
                  {pageState === "revealed" && (
                    <span className="text-xs text-slate-500 font-mono">
                      ({orientation === "white" ? game?.whiteElo : game?.blackElo})
                    </span>
                  )}
                </div>
              </div>

              {/* Playback controls */}
              {pageState === "watching" && (
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => goToMove(Math.max(-1, currentIdx - 1))}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-400 hover:bg-white/[0.06] transition-colors"
                  >
                    ◀ Prev
                  </button>
                  <button
                    onClick={() => setAutoplay(prev => !prev)}
                    className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-all ${
                      autoplay
                        ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                        : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                    }`}
                  >
                    {autoplay ? "⏸ Pause" : "▶ Play"}
                  </button>
                  <button
                    onClick={() => {
                      setAutoplay(false);
                      goToMove(Math.min(moves.length - 1, currentIdx + 1));
                    }}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-400 hover:bg-white/[0.06] transition-colors"
                  >
                    Next ▶
                  </button>
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-400 cursor-pointer"
                  >
                    <option value={3000}>🐌 Slow</option>
                    <option value={1800}>🚶 Normal</option>
                    <option value={900}>🏃 Fast</option>
                    <option value={400}>⚡ Blitz</option>
                  </select>
                  <button
                    onClick={skipToGuess}
                    className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    Skip to Guess →
                  </button>
                </div>
              )}

              {/* Move progress bar */}
              {pageState === "watching" && moves.length > 0 && (
                <div className="w-full max-w-[640px] mt-1">
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                      style={{ width: `${((currentIdx + 1) / moves.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                    <span>Move {currentMove ? currentMove.moveNumber : 0}</span>
                    <span>{currentIdx + 1}/{moves.length}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — commentary + guess */}
            <div className="flex flex-col gap-4">
              {/* Commentary box */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3 flex items-center gap-1.5">
                  🎙️ Commentary
                </h3>
                <div
                  ref={commentBoxRef}
                  className="h-[320px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
                >
                  {commentHistory.length === 0 && pageState === "watching" && (
                    <p className="text-xs text-slate-600 italic">Waiting for notable moves…</p>
                  )}
                  {commentHistory.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-sm text-slate-300 animate-fadeIn"
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Move list (compact) */}
              {(pageState === "watching" || pageState === "guessing" || pageState === "revealed") && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Moves
                  </h3>
                  <div className="h-[180px] overflow-y-auto text-xs font-mono space-y-0.5 pr-2">
                    {moves.map((m, i) => {
                      const isCurrent = i === currentIdx;
                      return (
                        <span
                          key={i}
                          onClick={() => {
                            setAutoplay(false);
                            goToMove(i);
                          }}
                          className={`inline-block cursor-pointer rounded px-1 py-0.5 transition-colors ${
                            isCurrent ? "bg-orange-500/20 text-orange-300" : "text-slate-500 hover:text-slate-300"
                          } ${m.classification === "blunder" ? "text-red-400" : m.classification === "mistake" ? "text-orange-400" : ""}`}
                        >
                          {m.color === "w" ? `${m.moveNumber}. ` : ""}{m.san}{" "}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Guess the Elo ── */}
              {pageState === "guessing" && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.03] p-5 animate-fadeIn">
                  <h3 className="text-sm font-bold text-orange-400 mb-1 text-center">🔥 Time to Guess!</h3>
                  <p className="text-xs text-slate-400 text-center mb-4">What&apos;s the average Elo of these players?</p>
                  <div className="space-y-2">
                    {ELO_BRACKETS.map((bracket, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleGuess(idx)}
                        disabled={selectedBracket !== null}
                        className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/[0.06] hover:border-orange-500/20 cursor-pointer disabled:opacity-40"
                      >
                        <span className="flex items-center gap-2">
                          <span>{bracket.emoji}</span>
                          <span className="text-white">{bracket.label}</span>
                        </span>
                        <span className="text-xs text-slate-500">{bracket.range}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Reveal ── */}
              {pageState === "revealed" && game && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5 space-y-4 animate-fadeIn">
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">{game.avgElo}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      White: {game.whiteElo} · Black: {game.blackElo}
                    </p>
                  </div>
                  <p className="text-sm text-amber-300 text-center font-medium">{revealLine}</p>
                  <p className="text-xs text-slate-400 text-center italic">{eloFlavor}</p>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-xs text-slate-400 text-center">{summaryLine}</p>
                  </div>

                  {/* Stats breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg border border-red-500/20 bg-red-500/[0.05] p-2">
                      <p className="text-lg font-bold text-red-400">{blunders}</p>
                      <p className="text-red-400/60">Blunders</p>
                    </div>
                    <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.05] p-2">
                      <p className="text-lg font-bold text-orange-400">{mistakes}</p>
                      <p className="text-orange-400/60">Mistakes</p>
                    </div>
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/[0.05] p-2">
                      <p className="text-lg font-bold text-yellow-400">{inaccuracies}</p>
                      <p className="text-yellow-400/60">Inaccuracies</p>
                    </div>
                  </div>

                  {/* View on Lichess */}
                  <a
                    href={`https://lichess.org/${game.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    View on Lichess ↗
                  </a>

                  <button
                    onClick={fetchGame}
                    className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:brightness-110 hover:scale-[1.02] active:scale-95"
                  >
                    Next Game 🔥
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-600">
          <p>Games sourced from the <a href="https://lichess.org" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400 underline decoration-dotted">Lichess</a> database. Analysis by Stockfish.</p>
          <p className="mt-1">Inspired by Gotham Chess &amp; r/AnarchyChess. No GMs were harmed in the making of this page.</p>
        </div>
      </div>

      {/* CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out both;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out 3s infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
      `}</style>
    </main>
  );
}
