"use client";

/**
 * /coach — Instructional Game Coach
 *
 * Import a PGN or pick a famous game for move-by-move instructional narration.
 * Stockfish analysis classifies every move; the coach-commentary engine generates
 * Danya-style explanations for every tactic and positional motif.
 *
 * Features:
 * - PGN paste / file import or famous game picker
 * - Client-side Stockfish analysis (depth 12)
 * - Instructional narration with Naroditsky-style analogies
 * - Phase banners (Opening / Middlegame / Endgame)
 * - Key moment auto-pause for blunders/tactics
 * - Eval bar + move classification icons
 * - TTS narration
 * - Cinematic mode for clean screen recording
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { stockfishPool } from "@/lib/stockfish-client";
import { playSound, preloadSounds } from "@/lib/sounds";
import {
  useBoardTheme,
  useShowCoordinates,
  useCustomPieces,
  usePieceTheme,
} from "@/lib/use-coins";
import { useTTS } from "@/lib/use-tts";
import {
  SAMPLE_GAMES,
  GAME_CATEGORIES,
  type GameCategory,
} from "@/lib/sample-games";
import {
  generateCoachLine,
  generateVariationLine,
  buildLessonSummary,
  type MoveClassification,
  type CoachMove,
  type PrevMoveContext,
  type GameContext,
} from "@/lib/coach-commentary";

/* ══════════════════════════════════════════════════════════════════
   Types
══════════════════════════════════════════════════════════════════ */

interface CoachAnalyzedMove {
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  from: string;
  to: string;
  color: "w" | "b";
  moveNumber: number;
  /** Centipawns from White's perspective, BEFORE the move */
  evalBeforeWhite: number;
  /** Centipawns from White's perspective, AFTER the move */
  evalAfterWhite: number;
  cpLoss: number;
  classification: MoveClassification;
  bestMoveSan: string | null;
  pvMoves: string[];
  narration: string | null;
  variationText: string | null;
  isKeyMoment: boolean;
  keyMomentLabel: string | null;
  themes: string[];
}

interface GameInfo {
  white: string;
  black: string;
  whiteElo: number | null;
  blackElo: number | null;
  opening: string;
  result: string;
}

type PageState = "idle" | "analysing" | "coaching";

/* ══════════════════════════════════════════════════════════════════
   Classification helpers
══════════════════════════════════════════════════════════════════ */

function classifyMove(
  cpLoss: number,
  isBestMove: boolean,
  evalBeforeMover: number,
  evalAfterMover: number,
): MoveClassification {
  if (isBestMove && cpLoss < 5) return "best";
  const stillWinning = evalAfterMover >= 400;
  const wasWinning = evalBeforeMover >= 400;
  if (wasWinning && stillWinning) {
    if (cpLoss <= 50) return "good";
    if (cpLoss <= 200) return "inaccuracy";
    return "mistake";
  }
  if (cpLoss <= 10) return "best";
  if (cpLoss <= 25) return "good";
  if (cpLoss <= 75) return "inaccuracy";
  if (cpLoss <= 200) return "mistake";
  return "blunder";
}

function isBookMove(cpLoss: number, moveIndex: number): boolean {
  return moveIndex < 10 && cpLoss < 10;
}

const CLASSIFICATION_ICON: Record<MoveClassification, string> = {
  brilliant: "!!",
  best: "!",
  good: "",
  book: "📖",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

const CLASSIFICATION_COLOR: Record<MoveClassification, string> = {
  brilliant: "text-cyan-400",
  best: "text-emerald-400",
  good: "text-emerald-400/60",
  book: "text-slate-400",
  inaccuracy: "text-amber-400",
  mistake: "text-orange-400",
  blunder: "text-red-400",
};

const CLASSIFICATION_BG: Record<MoveClassification, string> = {
  brilliant: "bg-cyan-500/15 border-cyan-500/30",
  best: "bg-emerald-500/15 border-emerald-500/20",
  good: "bg-emerald-500/8 border-transparent",
  book: "bg-white/[0.03] border-transparent",
  inaccuracy: "bg-amber-500/15 border-amber-500/20",
  mistake: "bg-orange-500/15 border-orange-500/20",
  blunder: "bg-red-500/15 border-red-500/30",
};

function formatEval(cp: number): string {
  if (Math.abs(cp) >= 99000) {
    const n = 100000 - Math.abs(cp);
    const sign = cp > 0 ? "+" : "-";
    return n <= 0 ? `${sign}M` : `${sign}M${n}`;
  }
  const p = cp / 100;
  return `${p > 0 ? "+" : ""}${(Math.round(p * 10) / 10).toFixed(1)}`;
}

/* ══════════════════════════════════════════════════════════════════
   PGN parsing
══════════════════════════════════════════════════════════════════ */

function parsePgn(pgn: string):
  | {
      moves: {
        san: string;
        uci: string;
        fenBefore: string;
        fenAfter: string;
        color: "w" | "b";
        moveNumber: number;
      }[];
      headers: Record<string, string>;
    }
  | { error: string } {
  const headers: Record<string, string> = {};
  for (const line of pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) ?? []) {
    const m = line.match(/\[(\w+)\s+"([^"]*)"\]/);
    if (m) headers[m[1]] = m[2];
  }

  try {
    const game = new Chess();
    game.loadPgn(pgn);
    const history = game.history({ verbose: true });
    const replay = new Chess();
    const moves = [];
    for (const move of history) {
      const fenBefore = replay.fen();
      const uci = `${move.from}${move.to}${move.promotion ?? ""}`;
      replay.move(move.san);
      const fenAfter = replay.fen();
      const fullMove = parseInt(fenBefore.split(" ")[5] ?? "1");
      moves.push({
        san: move.san,
        uci,
        fenBefore,
        fenAfter,
        color: move.color,
        moveNumber: fullMove,
      });
    }
    return { moves, headers };
  } catch {
    // fallback: manual token parse
  }

  try {
    let moveText = pgn
      .replace(/\[.*?\]\s*/g, "")
      .replace(/\{[^}]*\}/g, "")
      .replace(/\([^)]*\)/g, "")
      .replace(/\$\d+/g, "")
      .replace(/\b(1-0|0-1|1\/2-1\/2|\*)\s*$/, "")
      .trim();

    const tokens = moveText
      .split(/\s+/)
      .filter((t) => t && !/^\d+\.+$/.test(t));
    if (tokens.length === 0) return { error: "No moves found in PGN." };

    const chess = new Chess();
    const moves = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)) continue;
      const fenBefore = chess.fen();
      const color = chess.turn();
      const fullMove = parseInt(fenBefore.split(" ")[5] ?? "1");

      let result = null;
      try {
        result = chess.move(token);
      } catch {
        /* handled below */
      }
      if (!result)
        return { error: `Illegal move "${token}" at move ${fullMove}` };

      const fenAfter = chess.fen();
      const uci = `${result.from}${result.to}${result.promotion ?? ""}`;
      moves.push({
        san: result.san,
        uci,
        fenBefore,
        fenAfter,
        color,
        moveNumber: fullMove,
      });
    }
    return { moves, headers };
  } catch (err) {
    return { error: "Could not parse PGN. Check the format and try again." };
  }
}

/* ══════════════════════════════════════════════════════════════════
   Typewriter hook
══════════════════════════════════════════════════════════════════ */

function useTypewriter(text: string | null, charDelay = 12) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(true);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      setIsDone(true);
      return;
    }
    setIsDone(false);
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setIsDone(true);
      }
    }, charDelay);
    return () => clearInterval(timer);
  }, [text, charDelay]);

  return { displayed, isDone };
}

/* ══════════════════════════════════════════════════════════════════
   PV → SAN conversion helper
══════════════════════════════════════════════════════════════════ */

function pvToSan(fenStart: string, pvUci: string[], maxMoves = 4): string[] {
  const chess = new Chess(fenStart);
  const sans: string[] = [];
  for (const uci of pvUci.slice(0, maxMoves)) {
    try {
      const m = chess.move({
        from: uci.slice(0, 2) as CbSquare,
        to: uci.slice(2, 4) as CbSquare,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        promotion: (uci.slice(4, 5) || undefined) as any,
      });
      if (m) sans.push(m.san);
      else break;
    } catch {
      break;
    }
  }
  return sans;
}

/* ══════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════ */

export default function CoachPage() {
  /* ── Theme / display ── */
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const pieceTheme = usePieceTheme();
  const showCoords = useShowCoordinates();
  const tts = useTTS();

  /* ── Board size (responsive) ── */
  const [boardSize, setBoardSize] = useState(480);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  /* ── Page state ── */
  const [pageState, setPageState] = useState<PageState>("idle");

  // Re-measure board size whenever the page transitions to coaching (the board div appears)
  useEffect(() => {
    const measure = () => {
      if (!boardContainerRef.current) return;
      const rect = boardContainerRef.current.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height, 600);
      if (size > 0) setBoardSize(size);
    };
    const t = setTimeout(measure, 80);
    const ro = new ResizeObserver(measure);
    if (boardContainerRef.current) ro.observe(boardContainerRef.current);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [pageState]);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [moves, setMoves] = useState<CoachAnalyzedMove[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState("");

  /* ── Idle: source-selection sub-state ── */
  const [inputMode, setInputMode] = useState<
    "paste" | "library" | "username" | null
  >(null);
  const [pgnInput, setPgnInput] = useState("");
  const [pgnError, setPgnError] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<GameCategory | "all">(
    "all",
  );
  const [loadUsername, setLoadUsername] = useState("");
  const [loadSource, setLoadSource] = useState<"lichess" | "chesscom">(
    "lichess",
  );
  const [loadingGames, setLoadingGames] = useState(false);
  const [recentGames, setRecentGames] = useState<
    {
      white: string;
      black: string;
      date: string;
      result: string;
      pgn: string;
    }[]
  >([]);
  const [loadError, setLoadError] = useState("");

  /* ── Playback ── */
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [autoplay, setAutoplay] = useState(false);
  const [speed, setSpeed] = useState(2800); // ms between moves
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [cinematic, setCinematic] = useState(false);
  const autoplayRef = useRef(autoplay);
  autoplayRef.current = autoplay;
  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;

  /* ── Derived board state ── */
  const currentFen = useMemo(() => {
    if (currentIdx < 0) return moves.length > 0 ? moves[0].fenBefore : "start";
    return moves[currentIdx]?.fenAfter ?? "start";
  }, [currentIdx, moves]);

  const currentEval = useMemo(() => {
    if (moves.length === 0) return 0;
    if (currentIdx < 0) return moves[0]?.evalBeforeWhite ?? 0;
    return moves[currentIdx]?.evalAfterWhite ?? 0;
  }, [currentIdx, moves]);

  const lastMove = useMemo(() => {
    if (currentIdx < 0) return null;
    const m = moves[currentIdx];
    return m ? { from: m.from, to: m.to } : null;
  }, [currentIdx, moves]);

  const currentMove = currentIdx >= 0 ? moves[currentIdx] : null;

  /* ── Narration typewriter ── */
  const [activeNarration, setActiveNarration] = useState<string | null>(null);
  const [activeVariation, setActiveVariation] = useState<string | null>(null);
  const { displayed: typewriterText, isDone: typingDone } =
    useTypewriter(activeNarration);

  /* ── Move list scroll ── */
  const moveListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moveListRef.current || currentIdx < 0) return;
    const el = moveListRef.current.querySelector(
      `[data-move-idx="${currentIdx}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentIdx]);

  /* ── Preload sounds ── */
  useEffect(() => {
    preloadSounds();
  }, []);

  /* ── Cinematic mode: hotkey `c` ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "c" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        setCinematic((prev) => !prev);
      }
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === " ") {
        e.preventDefault();
        setAutoplay((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves, currentIdx]);

  /* ── Round-trip ?streamer param ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("cinematic") === "1") setCinematic(true);
  }, []);

  /* ══════════════════════════════════════════════════════════════
     Analysis engine
  ══════════════════════════════════════════════════════════════ */

  const runAnalysis = useCallback(
    async (pgn: string, info: GameInfo) => {
      tts.stop();
      setPageState("analysing");
      setAnalysisProgress(0);
      setAnalysisError("");
      setMoves([]);
      setCurrentIdx(-1);
      setActiveNarration(null);
      setActiveVariation(null);
      setAutoplay(false);
      setGameInfo(info);

      const parsed = parsePgn(pgn);
      if ("error" in parsed) {
        setAnalysisError(parsed.error);
        setPageState("idle");
        return;
      }

      const { moves: rawMoves } = parsed;
      if (rawMoves.length < 5) {
        setAnalysisError("Not enough moves to analyze. Need at least 5 moves.");
        setPageState("idle");
        return;
      }

      const maxMoves = Math.min(rawMoves.length, 120);
      const analyzed: CoachAnalyzedMove[] = [];
      const usedLines = new Set<string>();

      for (let i = 0; i < maxMoves; i++) {
        const { san, uci, fenBefore, fenAfter, color, moveNumber } =
          rawMoves[i];

        // 1. Eval before move
        let cpBefore = 0;
        try {
          const e = await stockfishPool.evaluateFen(fenBefore, 12);
          cpBefore = e?.cp ?? 0;
        } catch {
          /* keep 0 */
        }

        // 2. Best move + PV
        let bestMoveSan: string | null = null;
        let pvMoves: string[] = [];
        try {
          const pv = await stockfishPool.getPrincipalVariation(
            fenBefore,
            6,
            12,
          );
          if (pv?.pvMoves?.[0]) {
            pvMoves = pv.pvMoves;
            const tmp = new Chess(fenBefore);
            try {
              const m = tmp.move({
                from: pv.pvMoves[0].slice(0, 2) as CbSquare,
                to: pv.pvMoves[0].slice(2, 4) as CbSquare,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                promotion: (pv.pvMoves[0].slice(4, 5) || undefined) as any,
              });
              bestMoveSan = m?.san ?? null;
            } catch {
              /* skip */
            }
          }
        } catch {
          /* skip */
        }

        // 3. Eval after
        let cpAfter = 0;
        try {
          const e = await stockfishPool.evaluateFen(fenAfter, 12);
          cpAfter = e?.cp ?? 0;
        } catch {
          /* keep 0 */
        }

        // 4. CP loss (from mover's perspective)
        //    cpBefore = eval for side-to-move BEFORE; cpAfter = eval for NEW side-to-move AFTER
        //    mover's eval went from cpBefore to -cpAfter → loss = cpBefore + cpAfter
        const cpLoss = Math.max(0, cpBefore + cpAfter);

        // 5. Classify
        const sideMultiplier = color === "w" ? 1 : -1;
        const evalBeforeMover = cpBefore; // already from mover's POV (stockfish gives current side)
        const evalAfterMover = -cpAfter; // flip because now opponent to move
        const isBestMove = bestMoveSan === san;
        const book = isBookMove(cpLoss, i);

        let classification = book
          ? "book"
          : classifyMove(cpLoss, isBestMove, evalBeforeMover, evalAfterMover);

        // White's-perspective evals for the eval bar
        const evalBeforeWhite = cpBefore * sideMultiplier;
        const evalAfterWhite = -cpAfter * sideMultiplier;

        // 6. Coaching narration
        const coachMove: CoachMove = {
          san,
          uci,
          fenBefore,
          fenAfter,
          color,
          moveNumber,
          cpLoss,
          classification,
          bestMoveSan,
          bestMoveUci: pvMoves[0] ?? null,
          evalBeforeWhite,
          evalAfterWhite,
        };

        const prevAnalyzed = analyzed[analyzed.length - 1];
        const prevCtx: PrevMoveContext | undefined = prevAnalyzed
          ? {
              classification: prevAnalyzed.classification,
              themes: prevAnalyzed.themes,
              san: prevAnalyzed.san,
              cpLoss: prevAnalyzed.cpLoss,
            }
          : undefined;
        const gameCtx: GameContext = {
          whiteName: info.white || undefined,
          blackName: info.black || undefined,
        };

        const { text, isKeyMoment, keyMomentLabel, themes } = generateCoachLine(
          coachMove,
          usedLines,
          prevCtx,
          gameCtx,
        );

        // For key moments, compute a "What if?" variation line
        let varLine: string | null = null;
        if (isKeyMoment || cpLoss > 150) {
          const bestLineSans = pvToSan(fenBefore, pvMoves, 4);
          let continuationSans: string[] = [];
          try {
            const contPv = await stockfishPool.getPrincipalVariation(
              fenAfter,
              4,
              8,
            );
            if (contPv?.pvMoves?.length) {
              continuationSans = pvToSan(fenAfter, contPv.pvMoves, 4);
            }
          } catch {
            /* skip */
          }
          varLine = generateVariationLine(
            coachMove,
            bestLineSans,
            continuationSans,
          );
        }

        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);

        analyzed.push({
          san,
          uci,
          fenBefore,
          fenAfter,
          from,
          to,
          color,
          moveNumber,
          evalBeforeWhite,
          evalAfterWhite,
          cpLoss,
          classification,
          bestMoveSan,
          pvMoves,
          narration: text || null,
          variationText: varLine || null,
          isKeyMoment,
          keyMomentLabel,
          themes,
        });

        setAnalysisProgress(Math.round(((i + 1) / maxMoves) * 100));

        // Play a capture sound at move 1 to prove engine is working (tiny UX detail)
        if (i === 0) playSound("move");
      }

      setMoves(analyzed);
      setPageState("coaching");
      setCurrentIdx(-1);
      setTimeout(() => setAutoplay(true), 600);
    },
    [tts],
  );

  /* ══════════════════════════════════════════════════════════════
     Autoplay loop
  ══════════════════════════════════════════════════════════════ */

  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set to true while we are waiting for TTS to finish before advancing
  const pendingTtsAdvanceRef = useRef(false);

  const scheduleNext = useCallback(
    (delay: number) => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = setTimeout(() => {
        if (!autoplayRef.current) return;
        const nextIdx = currentIdxRef.current + 1;
        if (nextIdx >= moves.length) {
          setAutoplay(false);
          return;
        }

        const move = moves[nextIdx];
        setCurrentIdx(nextIdx);
        setActiveNarration(move.narration ?? null);
        setActiveVariation(move.variationText ?? null);

        // Play sounds
        if (move.san.includes("x")) playSound("capture");
        else if (move.san.includes("+")) playSound("check");
        else playSound("move");

        // Speak narration — if TTS is on, wait for it to finish before advancing
        if (move.narration && tts.enabled) {
          const toSpeak = move.variationText
            ? `${move.narration} ${move.variationText}`
            : move.narration;
          tts.speak(toSpeak);
          pendingTtsAdvanceRef.current = true;
          // Advancement is triggered by the tts.speaking watcher below
        } else {
          // No TTS — use timer-based advance
          const pauseMs = move.isKeyMoment ? 4000 : speed;
          scheduleNext(pauseMs);
        }
      }, delay);
    },
    [moves, speed, tts],
  );

  // When TTS finishes speaking, advance to the next move if autoplay is still active
  useEffect(() => {
    if (!tts.speaking && pendingTtsAdvanceRef.current && autoplayRef.current) {
      pendingTtsAdvanceRef.current = false;
      scheduleNext(500);
    }
  }, [tts.speaking, scheduleNext]);

  // Start/stop autoplay
  useEffect(() => {
    if (autoplay && pageState === "coaching") {
      scheduleNext(autoplay && currentIdx === -1 ? 800 : speed);
    } else {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      pendingTtsAdvanceRef.current = false;
    }
    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    };
  }, [autoplay, pageState]); // intentional: only restart when autoplay toggles

  /* ── Navigation handlers ── */
  const handleNext = useCallback(() => {
    const nextIdx = currentIdxRef.current + 1;
    if (nextIdx >= moves.length) return;
    setAutoplay(false);
    setCurrentIdx(nextIdx);
    const move = moves[nextIdx];
    setActiveNarration(move.narration ?? null);
    setActiveVariation(move.variationText ?? null);
    if (move.san.includes("x")) playSound("capture");
    else if (move.san.includes("+")) playSound("check");
    else playSound("move");
    if (move.narration && tts.enabled) {
      const toSpeak = move.variationText
        ? `${move.narration} ${move.variationText}`
        : move.narration;
      tts.speak(toSpeak);
    }
  }, [moves, tts]);

  const handlePrev = useCallback(() => {
    const prevIdx = currentIdxRef.current - 1;
    if (prevIdx < -1) return;
    setAutoplay(false);
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    tts.stop();
    setCurrentIdx(prevIdx);
    const move = prevIdx >= 0 ? moves[prevIdx] : null;
    setActiveNarration(move?.narration ?? null);
    setActiveVariation(move?.variationText ?? null);
  }, [moves, tts]);

  /* ═════════════════════════════════════════════════════════════
     Recent games loader (Lichess / Chess.com)
  ══════════════════════════════════════════════════════════════ */

  const fetchRecentGames = useCallback(async () => {
    const username = loadUsername.trim();
    if (!username) {
      setLoadError("Enter a username");
      return;
    }
    setLoadingGames(true);
    setLoadError("");
    setRecentGames([]);
    try {
      if (loadSource === "lichess") {
        const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=10&moves=true&opening=true&clocks=false&evals=false`;
        const res = await fetch(url, {
          headers: { Accept: "application/x-chess-pgn" },
        });
        if (!res.ok)
          throw new Error(
            res.status === 404
              ? "User not found on Lichess"
              : `Lichess error (${res.status})`,
          );
        const text = await res.text();
        const games = text.split(/\n\n(?=\[Event )/).filter((g) => g.trim());
        if (games.length === 0) throw new Error("No games found");
        setRecentGames(
          games.map((pgn) => {
            const h: Record<string, string> = {};
            for (const l of pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) ?? []) {
              const m = l.match(/\[(\w+)\s+"([^"]*)"\]/);
              if (m) h[m[1]] = m[2];
            }
            return {
              white: h.White ?? "?",
              black: h.Black ?? "?",
              date: h.UTCDate ?? "?",
              result: h.Result ?? "?",
              pgn: pgn.trim(),
            };
          }),
        );
      } else {
        const archRes = await fetch(
          `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`,
        );
        if (!archRes.ok)
          throw new Error(
            archRes.status === 404
              ? "User not found on Chess.com"
              : `Chess.com error (${archRes.status})`,
          );
        const archives: string[] = (await archRes.json()).archives ?? [];
        if (!archives.length) throw new Error("No games found");
        const gamesData = await (
          await fetch(archives[archives.length - 1])
        ).json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const last10 = (gamesData.games ?? [])
          .filter((g: any) => g.pgn)
          .slice(-10)
          .reverse();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRecentGames(
          last10.map((g: any) => {
            const h: Record<string, string> = {};
            for (const l of (g.pgn ?? "").match(/\[(\w+)\s+"([^"]*)"\]/g) ??
              []) {
              const m = l.match(/\[(\w+)\s+"([^"]*)"\]/);
              if (m) h[m[1]] = m[2];
            }
            return {
              white: h.White ?? "?",
              black: h.Black ?? "?",
              date: h.Date ?? "?",
              result: h.Result ?? "?",
              pgn: g.pgn.trim(),
            };
          }),
        );
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load games");
    } finally {
      setLoadingGames(false);
    }
  }, [loadUsername, loadSource]);

  /* ═══════════════════════════════════════════════════════════════
     Start game helpers
  ═════════════════════════════════════════════════════════════════*/

  const startFromPgn = useCallback(
    (pgn: string) => {
      const parsed = parsePgn(pgn);
      if ("error" in parsed) {
        setPgnError(parsed.error);
        return;
      }
      const h = parsed.headers;
      const info: GameInfo = {
        white: h.White ?? "White",
        black: h.Black ?? "Black",
        whiteElo: h.WhiteElo ? parseInt(h.WhiteElo) : null,
        blackElo: h.BlackElo ? parseInt(h.BlackElo) : null,
        opening: h.Opening ?? h.ECO ?? "Unknown Opening",
        result: h.Result ?? "*",
      };
      runAnalysis(pgn, info);
    },
    [runAnalysis],
  );

  /* ═══════════════════════════════════════════════════════════════
     Summary
  ═════════════════════════════════════════════════════════════════*/

  const lessonSummary = useMemo(() => {
    if (moves.length === 0 || currentIdx < moves.length - 1) return [];
    return buildLessonSummary(moves);
  }, [moves, currentIdx]);

  /* ══════════════════════════════════════════════════════════════
     Square styles
  ══════════════════════════════════════════════════════════════ */

  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    if (!currentMove) return {};
    const cls = currentMove.classification;
    const isRed = cls === "blunder" || cls === "mistake";
    const isYellow = cls === "inaccuracy";
    const color = isRed
      ? "rgba(239,68,68,0.3)"
      : isYellow
        ? "rgba(245,158,11,0.25)"
        : "rgba(34,197,94,0.22)";
    return {
      [currentMove.from]: { backgroundColor: color },
      [currentMove.to]: { backgroundColor: color },
    };
  }, [currentMove]);

  /* ══════════════════════════════════════════════════════════════
     Phase banner
  ══════════════════════════════════════════════════════════════ */

  const phaseBanner = useMemo(() => {
    if (!currentMove || !moves.length) return null;
    const idx = currentIdx;
    if (idx < 0) return null;
    // Detect phase transitions
    const prevPhase =
      idx > 0
        ? getPhase(moves[idx - 1].evalAfterWhite, moves[idx - 1].fenBefore)
        : null;
    const curPhase = getPhase(currentMove.evalAfterWhite, currentMove.fenAfter);
    if (curPhase !== prevPhase && curPhase !== "Opening") return curPhase;
    if (idx === 0) return "Opening";
    return null;
  }, [currentIdx, currentMove, moves]);

  function getPhase(
    cp: number,
    fen: string,
  ): "Opening" | "Middlegame" | "Endgame" {
    try {
      const chess = new Chess(fen);
      const board = chess.board().flat().filter(Boolean);
      const total = board.length;
      const queens = board.filter((p) => p?.type === "q").length;
      if (total > 24) return "Opening";
      if (total <= 12 || queens === 0) return "Endgame";
      return "Middlegame";
    } catch {
      return "Middlegame";
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Move pair rendering
  ══════════════════════════════════════════════════════════════ */

  const movePairs = useMemo(() => {
    const pairs: {
      moveNum: number;
      white: CoachAnalyzedMove | null;
      black: CoachAnalyzedMove | null;
    }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        moveNum: moves[i].moveNumber,
        white: moves[i] ?? null,
        black: moves[i + 1] ?? null,
      });
    }
    return pairs;
  }, [moves]);

  /* ══════════════════════════════════════════════════════════════
     Cinematic mode URL param sync
  ══════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (cinematic) url.searchParams.set("cinematic", "1");
    else url.searchParams.delete("cinematic");
    window.history.replaceState({}, "", url.toString());
  }, [cinematic]);

  /* ══════════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════════ */

  /* ── IDLE ── */
  if (pageState === "idle") {
    return (
      <div
        className={`min-h-screen bg-[#0d0d0d] text-white ${cinematic ? "p-0" : "p-4 sm:p-8"}`}
      >
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-amber-400">♟</span>{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Chess Coach
              </span>
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Move-by-move instructional narration — tactics, patterns, and
              principles explained as they happen.
            </p>
          </div>

          {analysisError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {analysisError}
            </div>
          )}

          {/* Source picker */}
          {!inputMode && (
            <div className="grid gap-3">
              <button
                onClick={() => setInputMode("paste")}
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-amber-400/40 hover:bg-white/[0.07]"
              >
                <span className="mt-0.5 text-2xl">📋</span>
                <div>
                  <div className="font-semibold text-white">Import PGN</div>
                  <div className="mt-0.5 text-sm text-slate-400">
                    Paste your own game or any PGN notation
                  </div>
                </div>
              </button>
              <button
                onClick={() => setInputMode("library")}
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-amber-400/40 hover:bg-white/[0.07]"
              >
                <span className="mt-0.5 text-2xl">👑</span>
                <div>
                  <div className="font-semibold text-white">Famous Games</div>
                  <div className="mt-0.5 text-sm text-slate-400">
                    Learn from the greatest games ever played
                  </div>
                </div>
              </button>
              <button
                onClick={() => setInputMode("username")}
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-amber-400/40 hover:bg-white/[0.07]"
              >
                <span className="mt-0.5 text-2xl">🧑‍💻</span>
                <div>
                  <div className="font-semibold text-white">
                    Load from Account
                  </div>
                  <div className="mt-0.5 text-sm text-slate-400">
                    Fetch your recent games from Lichess or Chess.com
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* PGN paste */}
          {inputMode === "paste" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold">Paste PGN</span>
                <button
                  onClick={() => {
                    setInputMode(null);
                    setPgnError("");
                  }}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ← back
                </button>
              </div>
              <textarea
                value={pgnInput}
                onChange={(e) => {
                  setPgnInput(e.target.value);
                  setPgnError("");
                }}
                placeholder={`[Event "Example"]\n[White "Kasparov"]\n[Black "Topalov"]\n\n1. e4 d6 2. d4 Nf6 ...`}
                className="w-full h-44 resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-mono text-white placeholder:text-slate-600 focus:border-amber-400/40 focus:outline-none"
              />
              {pgnError && (
                <p className="mt-2 text-xs text-red-400">{pgnError}</p>
              )}
              <button
                onClick={() => {
                  if (pgnInput.trim()) startFromPgn(pgnInput.trim());
                }}
                disabled={!pgnInput.trim()}
                className="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-black transition hover:bg-amber-400 disabled:opacity-40"
              >
                Start Lesson
              </button>
            </div>
          )}

          {/* Famous games library */}
          {inputMode === "library" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold">Famous Games</span>
                <button
                  onClick={() => setInputMode(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ← back
                </button>
              </div>
              {/* Category filter */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setLibraryCategory("all")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${libraryCategory === "all" ? "bg-amber-500 text-black" : "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]"}`}
                >
                  All
                </button>
                {GAME_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setLibraryCategory(cat.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${libraryCategory === cat.key ? "bg-amber-500 text-black" : "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]"}`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {SAMPLE_GAMES.filter(
                  (g) =>
                    libraryCategory === "all" || g.category === libraryCategory,
                ).map((game, i) => (
                  <button
                    key={i}
                    onClick={() => startFromPgn(game.pgn)}
                    className="w-full rounded-lg border border-white/[0.07] bg-black/20 px-4 py-3 text-left transition hover:border-amber-400/30 hover:bg-white/[0.05]"
                  >
                    <div className="font-medium text-sm text-white">
                      {game.label}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {game.description}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {game.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-slate-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Username loader */}
          {inputMode === "username" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold">Load from Account</span>
                <button
                  onClick={() => setInputMode(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ← back
                </button>
              </div>
              <div className="mb-3 flex gap-2">
                <button
                  onClick={() => setLoadSource("lichess")}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${loadSource === "lichess" ? "bg-amber-500 text-black" : "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]"}`}
                >
                  Lichess
                </button>
                <button
                  onClick={() => setLoadSource("chesscom")}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${loadSource === "chesscom" ? "bg-amber-500 text-black" : "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]"}`}
                >
                  Chess.com
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={loadUsername}
                  onChange={(e) => setLoadUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchRecentGames()}
                  placeholder={
                    loadSource === "lichess"
                      ? "lichess username"
                      : "chess.com username"
                  }
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-amber-400/40 focus:outline-none"
                />
                <button
                  onClick={fetchRecentGames}
                  disabled={loadingGames}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {loadingGames ? "…" : "Load"}
                </button>
              </div>
              {loadError && (
                <p className="mt-2 text-xs text-red-400">{loadError}</p>
              )}
              {recentGames.length > 0 && (
                <div className="mt-3 max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {recentGames.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => startFromPgn(g.pgn)}
                      className="w-full rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2.5 text-left transition hover:border-amber-400/30 hover:bg-white/[0.05]"
                    >
                      <div className="text-sm font-medium">
                        {g.white} vs {g.black}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {g.date} · {g.result}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── ANALYSING ── */
  if (pageState === "analysing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] text-white">
        <div className="w-full max-w-sm px-6 text-center">
          <div className="mb-3 text-4xl">♟</div>
          <h2 className="mb-1 text-xl font-bold">Analyzing game…</h2>
          <p className="mb-6 text-sm text-slate-400">
            Stockfish is classifying every move and building the coaching
            script.
          </p>
          <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{analysisProgress}%</p>
        </div>
      </div>
    );
  }

  /* ── COACHING ── */
  const isAtEnd = currentIdx >= moves.length - 1;

  return (
    <div
      className={`min-h-screen bg-[#0d0d0d] text-white ${cinematic ? "fixed inset-0 z-50 overflow-hidden" : ""}`}
    >
      {/* ── Game header (hidden in cinematic) ── */}
      {!cinematic && gameInfo && (
        <div className="border-b border-white/[0.06] px-4 py-2.5 text-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-semibold truncate">
                {gameInfo.white}
                {gameInfo.whiteElo ? ` (${gameInfo.whiteElo})` : ""}{" "}
                <span className="text-slate-500">vs</span> {gameInfo.black}
                {gameInfo.blackElo ? ` (${gameInfo.blackElo})` : ""}
              </span>
              {gameInfo.opening !== "Unknown Opening" && (
                <span className="hidden text-xs text-slate-500 sm:block">
                  · {gameInfo.opening}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500">{gameInfo.result}</span>
              <button
                onClick={() => {
                  setPageState("idle");
                  setInputMode(null);
                  tts.stop();
                }}
                className="ml-2 rounded-md border border-white/10 px-2 py-1 text-xs text-slate-400 transition hover:border-white/20 hover:text-white"
              >
                ← New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <div
        className={`flex h-full ${cinematic ? "h-screen" : "min-h-[calc(100vh-3rem)]"} flex-col lg:flex-row`}
      >
        {/* ── Board area ── */}
        <div
          className={`flex items-center justify-center ${cinematic ? "flex-1" : "py-4 lg:py-6 lg:pl-6"}`}
        >
          <div className="flex items-center gap-2">
            {/* Eval bar */}
            <EvalBar evalCp={currentEval} height={boardSize || 480} />
            {/* Board */}
            <div
              ref={boardContainerRef}
              className="relative"
              style={{ width: boardSize || 480, height: boardSize || 480 }}
            >
              {/* Phase banner overlay */}
              {phaseBanner && (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
                  <div
                    className={`mt-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest shadow-lg
                    ${phaseBanner === "Endgame" ? "bg-purple-500/80 text-white" : "bg-amber-500/80 text-black"}`}
                  >
                    {phaseBanner}
                  </div>
                </div>
              )}
              {/* Key moment badge */}
              {currentMove?.keyMomentLabel && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center">
                  <div
                    className={`mb-2 rounded-full px-4 py-1 text-xs font-bold shadow-lg
                    ${
                      currentMove.classification === "blunder"
                        ? "bg-red-500/90 text-white"
                        : currentMove.classification === "mistake"
                          ? "bg-orange-500/90 text-white"
                          : currentMove.classification === "brilliant"
                            ? "bg-cyan-500/90 text-white"
                            : "bg-amber-500/90 text-black"
                    }`}
                  >
                    {currentMove.keyMomentLabel}
                  </div>
                </div>
              )}
              {boardSize > 0 && (
                <Chessboard
                  id="coach"
                  position={currentFen}
                  boardWidth={boardSize}
                  boardOrientation={orientation}
                  arePiecesDraggable={false}
                  customSquareStyles={squareStyles}
                  customDarkSquareStyle={
                    boardTheme
                      ? { backgroundColor: boardTheme.darkSquare }
                      : undefined
                  }
                  customLightSquareStyle={
                    boardTheme
                      ? { backgroundColor: boardTheme.lightSquare }
                      : undefined
                  }
                  customPieces={customPieces}
                  showBoardNotation={showCoords}
                />
              )}
              {/* Cinematic narration overlay */}
              {cinematic && activeNarration && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
                  <div className="m-3 rounded-xl bg-black/80 px-4 py-3 text-sm leading-relaxed text-white backdrop-blur-sm">
                    {typewriterText}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right panel (hidden in cinematic) ── */}
        {!cinematic && (
          <div className="flex flex-col gap-0 border-t border-white/[0.06] lg:w-80 lg:border-l lg:border-t-0 shrink-0">
            {/* Narration panel */}
            <div className="relative min-h-[160px] border-b border-white/[0.06] p-4">
              {activeNarration ? (
                <>
                  {currentMove?.themes.length ? (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {currentMove.themes.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-sm leading-relaxed text-slate-200">
                    {typewriterText}
                  </p>
                  {!typingDone && (
                    <span className="mt-1 inline-block h-4 w-0.5 animate-pulse bg-amber-400" />
                  )}
                  {/* What if? variation box */}
                  {activeVariation && typingDone && (
                    <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                        💡 What if?
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {activeVariation}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 text-sm">
                  <span className="mb-1 text-2xl">♟</span>
                  {currentIdx < 0
                    ? "The lesson is about to begin…"
                    : "Watching…"}
                </div>
              )}
            </div>

            {/* TTS + controls */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
              <button
                onClick={() => tts.toggle()}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${tts.enabled ? "bg-amber-500/20 text-amber-300" : "bg-white/[0.06] text-slate-400 hover:text-white"}`}
                title="Toggle voice narration"
              >
                🔊 {tts.enabled ? "Voice On" : "Voice Off"}
              </button>
              <button
                onClick={() =>
                  setOrientation((o) => (o === "white" ? "black" : "white"))
                }
                className="rounded-md bg-white/[0.06] px-2.5 py-1.5 text-xs text-slate-400 transition hover:text-white"
                title="Flip board"
              >
                ⇅ Flip
              </button>
              <button
                onClick={() => setCinematic(true)}
                className="ml-auto rounded-md bg-white/[0.06] px-2.5 py-1.5 text-xs text-slate-400 transition hover:text-white"
                title="Cinematic mode (press C)"
              >
                🎬 Cinematic
              </button>
            </div>

            {/* Move list */}
            <div
              ref={moveListRef}
              className="flex-1 overflow-y-auto px-3 py-2"
              style={{ maxHeight: 320 }}
            >
              {movePairs.map(({ moveNum, white, black }) => (
                <div key={moveNum} className="flex items-center gap-1 py-[1px]">
                  <span className="w-7 shrink-0 text-center text-[11px] text-slate-600">
                    {moveNum}.
                  </span>
                  {[white, black].map((m, side) => {
                    if (!m) return <div key={side} className="flex-1" />;
                    const idx = moves.indexOf(m);
                    const isCurrent = idx === currentIdx;
                    return (
                      <button
                        key={side}
                        data-move-idx={idx}
                        onClick={() => {
                          setAutoplay(false);
                          tts.stop();
                          setCurrentIdx(idx);
                          setActiveNarration(m.narration ?? null);
                          setActiveVariation(m.variationText ?? null);
                        }}
                        className={`flex flex-1 items-center gap-1 rounded px-2 py-[3px] text-left text-[13px] transition
                          ${isCurrent ? "bg-amber-500/20 text-amber-200" : "text-slate-300 hover:bg-white/[0.06]"}`}
                      >
                        <span className="font-medium">{m.san}</span>
                        {CLASSIFICATION_ICON[m.classification] && (
                          <span
                            className={`text-[10px] ${CLASSIFICATION_COLOR[m.classification]}`}
                          >
                            {CLASSIFICATION_ICON[m.classification]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Lesson summary */}
              {isAtEnd && lessonSummary.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wide">
                    Key Lessons
                  </div>
                  {lessonSummary.map((ls, i) => (
                    <div key={i} className="mb-2 last:mb-0">
                      <div className="text-[11px] font-medium text-slate-400">
                        {ls.moment}
                      </div>
                      <div className="text-xs text-slate-300">{ls.lesson}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Playback controls */}
            <div className="border-t border-white/[0.06] p-3">
              <div className="mb-2.5 flex items-center justify-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx < 0}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.10] disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  onClick={() => setAutoplay((prev) => !prev)}
                  className={`flex h-9 w-14 items-center justify-center rounded-lg border font-medium text-sm transition
                    ${autoplay ? "border-amber-500/40 bg-amber-500/20 text-amber-300" : "border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.12]"}`}
                >
                  {autoplay ? "⏸" : "▶"}
                </button>
                <button
                  onClick={handleNext}
                  disabled={isAtEnd}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.10] disabled:opacity-30"
                >
                  →
                </button>
              </div>
              {/* Speed slider */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Fast</span>
                <input
                  type="range"
                  min={1000}
                  max={5000}
                  step={200}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="flex-1 accent-amber-400"
                />
                <span>Slow</span>
              </div>
              {/* Move counter */}
              <div className="mt-1.5 text-center text-[11px] text-slate-600">
                {currentIdx + 1} / {moves.length} moves
              </div>
            </div>
          </div>
        )}

        {/* ── Cinematic overlay controls ── */}
        {cinematic && (
          <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/90"
              >
                ←
              </button>
              <button
                onClick={() => setAutoplay((prev) => !prev)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/80 text-black text-lg font-bold backdrop-blur-sm transition hover:bg-amber-400"
              >
                {autoplay ? "⏸" : "▶"}
              </button>
              <button
                onClick={handleNext}
                disabled={isAtEnd}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/90 disabled:opacity-30"
              >
                →
              </button>
            </div>
            <button
              onClick={() => setCinematic(false)}
              className="rounded-full bg-black/70 px-4 py-1.5 text-xs text-slate-400 backdrop-blur-sm transition hover:text-white"
            >
              Exit Cinematic
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
