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
import type { Square as CbSquare } from "react-chessboard/dist/chessboard/types";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates, useCustomPieces } from "@/lib/use-coins";
import { playSound, preloadSounds, preloadRoastSounds } from "@/lib/sounds";
import { stockfishPool } from "@/lib/stockfish-client";
import {
  classifyMove,
  generateMoveComment,
  getEloFlavorLine,
  getOpeningRoast,
  getEloGuessComment,
  getClosingRoast,
  getGuessReaction,
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
  type MoveAnnotation,
} from "@/lib/roast-commentary";
import { RoastAvatar, type RoastMood } from "@/components/roast-avatar";
import { useTTS } from "@/lib/use-tts";
import { useSession } from "@/components/session-provider";
import Link from "next/link";

/* ================================================================== */
/*  Typewriter hook                                                     */
/* ================================================================== */

function useTypewriter(text: string | null, charDelay = 14) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(true);

  useEffect(() => {
    if (!text) { setDisplayed(""); setIsDone(true); return; }
    setIsDone(false);
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(timer); setIsDone(true); }
    }, charDelay);
    return () => clearInterval(timer);
  }, [text, charDelay]);

  return { displayed, isDone };
}

/* ================================================================== */
/*  Helpers                                                             */
/* ================================================================== */

/** Count consecutive best/great/brilliant moves ending at `idx` */
function bestStreakAt(moves: { classification: MoveClassification }[], idx: number): number {
  let streak = 0;
  for (let i = idx; i >= 0; i--) {
    const c = moves[i].classification;
    if (c === "best" || c === "great" || c === "brilliant") streak++;
    else break;
  }
  return streak;
}

/* ================================================================== */
/*  Mood from classification                                            */
/* ================================================================== */

function getMood(move: { classification: MoveClassification; cpLoss: number } | null, blunderCount?: number, bestStreak?: number): RoastMood {
  if (!move) return "neutral";
  switch (move.classification) {
    case "brilliant": {
      const r = Math.random();
      if (r < 0.25) return "clapping";   // animated applause
      if (r < 0.5) return "gigachad";
      if (r < 0.75) return "hyped";      // animated hype
      return "mindblown";
    }
    case "great": case "best": {
      const r = Math.random();
      // Galaxy brain only on 4+ best-move streaks — keep it rare & special
      if ((bestStreak ?? 0) >= 4 && r < 0.15) return "galaxybrain";
      if (r < 0.15) return "loving";     // animated good vibes
      if (r < 0.5) return "king";
      return "smug";
    }
    case "good": return Math.random() < 0.15 ? "smug" : "neutral";
    case "inaccuracy": {
      const r = Math.random();
      if (r < 0.15) return "bigeyes";    // animated wide eyes
      if (r < 0.35) return "detective";
      return "suspicious";
    }
    case "mistake": {
      const r = Math.random();
      if (r < 0.15) return "nope";       // animated nope
      if (r < 0.3) return "firesgun";    // animated rage
      if (r < 0.45) return "copium";
      if (r < 0.6) return "crylaugh";
      if (r < 0.8) return "clown";
      return "disappointed";
    }
    case "blunder": {
      // More expressive for blunders — escalate with repeated blunders
      const r = Math.random();
      if (move.cpLoss > 600) {
        // Catastrophic blunder — extreme animated reactions
        if (r < 0.25) return "madpuke";     // animated vomit
        if (r < 0.5) return "lmao";         // animated dying laughing
        if (r < 0.75) return "cantwatch";   // animated covering ears
        return "gamercry";                   // animated gamer cry
      }
      if (move.cpLoss > 400) {
        if (r < 0.2) return "lmao";          // animated
        if (r < 0.4) return "gamercry";      // animated
        if (r < 0.6) return "clown";
        return "laughing";
      }
      if ((blunderCount ?? 0) >= 4) {
        // Blunder train — special animated clown train!
        if (r < 0.4) return "clowntrain";   // animated clown parade
        if (r < 0.7) return "cantwatch";
        return "rage";
      }
      if (r < 0.2) return "bigeyes";        // animated shock
      if (r < 0.4) return "crylaugh";
      if (r < 0.6) return "laughing";
      return "shocked";
    }
    default: return "neutral";
  }
}

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
  arrows?: [string, string, string][];
  markers?: { square: string; emoji: string }[];
}

type PageState = "choose-source" | "loading" | "intro" | "watching" | "guessing" | "revealed";

/* ================================================================== */
/*  Piece values (for sacrifice detection)                              */
/* ================================================================== */

const _PIECE_VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
function _pieceVal(p: string | undefined | null): number { return _PIECE_VAL[p ?? ""] ?? 0; }

/* ================================================================== */
/*  PGN Parsing                                                         */
/* ================================================================== */

/** Parse PGN moves and extract clock times if available.
 *  Returns { sans, clocks } where clocks[i] is time remaining in seconds after move i, or null. */
function parsePgnWithClocks(pgn: string): { sans: string[]; clocks: (number | null)[] } {
  const chess = new Chess();
  try { chess.loadPgn(pgn); } catch { return { sans: [], clocks: [] }; }
  const sans = chess.history();

  // Extract %clk comments from raw PGN movelist
  // Format: 1. e4 { [%clk 0:05:00] } 1... e5 { [%clk 0:05:00] }
  const moveSection = pgn.replace(/\[.*?\]\s*/g, "").trim();
  const clkRegex = /\{[^}]*\[%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)\s*\][^}]*\}/g;
  const rawClocks: number[] = [];
  let m;
  while ((m = clkRegex.exec(moveSection)) !== null) {
    rawClocks.push(parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]));
  }

  // Compute time SPENT on each move = prev clock - current clock
  const clocks: (number | null)[] = [];
  if (rawClocks.length >= sans.length) {
    // Separate white and black clocks
    const whiteClocks: number[] = [];
    const blackClocks: number[] = [];
    for (let i = 0; i < rawClocks.length; i++) {
      if (i % 2 === 0) whiteClocks.push(rawClocks[i]);
      else blackClocks.push(rawClocks[i]);
    }
    for (let i = 0; i < sans.length; i++) {
      const isWhite = i % 2 === 0;
      const arr = isWhite ? whiteClocks : blackClocks;
      const moveIdx = isWhite ? Math.floor(i / 2) : Math.floor(i / 2);
      if (moveIdx === 0) {
        // First move — can't compute time spent without initial clock
        clocks.push(null);
      } else if (moveIdx < arr.length) {
        const spent = arr[moveIdx - 1] - arr[moveIdx];
        clocks.push(spent > 0 ? Math.round(spent * 10) / 10 : null);
      } else {
        clocks.push(null);
      }
    }
  } else {
    // No clock data available
    for (let i = 0; i < sans.length; i++) clocks.push(null);
  }

  return { sans, clocks };
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
  const [pageState, setPageState] = useState<PageState>("choose-source");
  const [game, setGame] = useState<GameData | null>(null);
  const [moves, setMoves] = useState<MoveWithComment[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [fen, setFen] = useState("start");
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [introLine, setIntroLine] = useState("");
  const [autoplay, setAutoplay] = useState(true);
  const [speed, setSpeed] = useState<number>(2400); // ms between moves (no-comment)
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedBracket, setSelectedBracket] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [quizScore, setQuizScore] = useState(0); // bonus points from mid-game quizzes
  const [lastScoreGain, setLastScoreGain] = useState<number | null>(null); // for floating +pts animation
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

  const [shareText, setShareText] = useState<string | null>(null);
  const [guessReaction, setGuessReaction] = useState<string | null>(null);
  const [mobileClippyOpen, setMobileClippyOpen] = useState(false);

  /* ── Gameshow FX state ── */
  const [showConfetti, setShowConfetti] = useState(false);
  const [audienceMeter, setAudienceMeter] = useState(50); // 0-100 crowd sentiment
  const [streakCount, setStreakCount] = useState(0);
  const [revealCounterElo, setRevealCounterElo] = useState<number | null>(null);
  const [spotlightPulse, setSpotlightPulse] = useState(false);
  const [lockedIn, setLockedIn] = useState(false);
  const [isRewatching, setIsRewatching] = useState(false);
  const [revealModalOpen, setRevealModalOpen] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<{ userName: string; userImage: string | null; score: number; gamesPlayed: number }[]>([]);

  /* ── Mid-game decision state ── */
  interface GameshowDecision {
    moveIdx: number;
    question: string;
    options: { label: string; emoji: string }[];
    correctIdx: number;
    explanation: string;
  }
  const [activeDecision, setActiveDecision] = useState<GameshowDecision | null>(null);
  const [decisionAnswer, setDecisionAnswer] = useState<number | null>(null);
  const [decisionShown, setDecisionShown] = useState(new Set<number>());
  const [pendingDecisionIdx, setPendingDecisionIdx] = useState<number | null>(null);

  /* ── Auth + score saving ── */
  const { authenticated, user, loading: sessionLoading } = useSession();
  const [scoreSaved, setScoreSaved] = useState(false);
  const [savingScore, setSavingScore] = useState(false);

  /* ── Source selection state ── */
  const [inputMode, setInputMode] = useState<"random" | "import" | "paste" | null>(null);
  const [loadSource, setLoadSource] = useState<"lichess" | "chesscom">("lichess");
  const [loadUsername, setLoadUsername] = useState("");
  const [loadingGames, setLoadingGames] = useState(false);
  const [recentGames, setRecentGames] = useState<{ white: string; black: string; whiteElo: number; blackElo: number; date: string; result: string; pgn: string; event?: string }[]>([]);
  const [loadError, setLoadError] = useState("");
  const [pgnInput, setPgnInput] = useState("");

  /* ── Daily Challenge state ── */
  const [dailyCompleted, setDailyCompleted] = useState<{ date: string; result: string; elo: number; guess: string } | null>(null);
  const [isDaily, setIsDaily] = useState(false);

  // Load persisted score/streak and daily challenge on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("fc-roast-daily");
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toISOString().slice(0, 10);
        if (data.date === today) setDailyCompleted(data);
      }
    } catch { /* ignore */ }
    try {
      const session = localStorage.getItem("fc-roast-session");
      if (session) {
        const data = JSON.parse(session);
        if (typeof data.score === "number") setScore(data.score);
        if (typeof data.gamesPlayed === "number") setGamesPlayed(data.gamesPlayed);
        if (typeof data.streakCount === "number") setStreakCount(data.streakCount);
        if (typeof data.quizScore === "number") setQuizScore(data.quizScore);
      }
    } catch { /* ignore */ }

    // Fetch leaderboard on mount for welcome screen
    fetch("/api/roast/leaderboard?period=weekly&limit=5")
      .then(r => r.json())
      .then(d => setLeaderboardData(d.entries ?? []))
      .catch(() => {});
  }, []);

  // Persist score/streak to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined" || gamesPlayed === 0) return;
    localStorage.setItem("fc-roast-session", JSON.stringify({ score, gamesPlayed, streakCount, quizScore }));
  }, [score, gamesPlayed, streakCount, quizScore]);

  /* ── Challenge link state ── */
  const [challengeId, setChallengeId] = useState<string | null>(null);

  /* ── Active comment + typewriter ── */
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const { displayed: typewriterText, isDone: typingDone } = useTypewriter(activeComment);
  const [currentMood, setCurrentMood] = useState<RoastMood>("neutral");
  const [activeArrows, setActiveArrows] = useState<[string, string, string][]>([]);
  const [activeMarkers, setActiveMarkers] = useState<{ square: string; emoji: string }[]>([]);

  /* ── TTS ── */
  const tts = useTTS();
  const [ttsDoneSignal, setTtsDoneSignal] = useState(0);

  // Speak new comments
  useEffect(() => {
    if (activeComment && tts.enabled) {
      tts.speak(activeComment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeComment, tts.enabled]);

  /* ── Fetch a new game ── */
  const fetchGame = useCallback(async () => {
    tts.stop();
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
    setGuessReaction(null);
    setMobileClippyOpen(false);
    setShowConfetti(false);
    setAudienceMeter(50);
    setRevealCounterElo(null);
    setSpotlightPulse(false);
    setLockedIn(false);
    setIsRewatching(false);
    setActiveDecision(null);
    setDecisionAnswer(null);
    setDecisionShown(new Set());
    setPendingDecisionIdx(null);
    usedLines.current.clear();
    setActiveComment(null);
    setCurrentMood("neutral");
    setScore(0);
    setQuizScore(0);
    setLastScoreGain(null);
    setScoreSaved(false);

    try {
      // Fetch puzzles from Lichess to discover game IDs (client-side)
      let gameId: string | null = null;
      let whitePlayer = "White";
      let blackPlayer = "Black";
      let whiteElo = 1500;
      let blackElo = 1500;

      // Step 1: Get puzzle batch from Lichess
      const puzzleRes = await fetch("https://lichess.org/api/puzzle/batch/next?nb=50", {
        headers: { Accept: "application/json" },
      });

      if (puzzleRes.ok) {
        const puzzleData = await puzzleRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const puzzles: any[] = puzzleData.puzzles ?? [];
        if (puzzles.length > 0) {
          // Shuffle and try to find a game from a player's recent history
          const shuffled = [...puzzles].sort(() => Math.random() - 0.5);

          for (let i = 0; i < Math.min(3, shuffled.length) && !gameId; i++) {
            const pz = shuffled[i];
            if (!pz?.game?.players?.length) continue;
            const player = pz.game.players[Math.floor(Math.random() * pz.game.players.length)];
            if (!player?.id) continue;

            try {
              const userRes = await fetch(
                `https://lichess.org/api/games/user/${player.id}?max=20&rated=true&perfType=blitz,rapid&opening=true`,
                { headers: { Accept: "application/x-ndjson" } }
              );
              if (userRes.ok) {
                const text = await userRes.text();
                const lines = text.trim().split("\n").filter(Boolean);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const games: any[] = lines
                  .map((l) => { try { return JSON.parse(l); } catch { return null; } })
                  .filter((g) =>
                    g && g.variant === "standard" && g.rated &&
                    g.status !== "started" &&
                    g.players?.white?.user && g.players?.black?.user &&
                    g.players?.white?.rating && g.players?.black?.rating
                  );
                const decisive = games.filter((g) => g.winner);
                const pool = decisive.length > 0 ? decisive : games;
                if (pool.length > 0) {
                  const picked = pool[Math.floor(Math.random() * pool.length)];
                  gameId = picked.id;
                  whitePlayer = picked.players.white.user.name;
                  blackPlayer = picked.players.black.user.name;
                  whiteElo = picked.players.white.rating;
                  blackElo = picked.players.black.rating;
                }
              }
            } catch { continue; }
          }

          // Fallback: use the puzzle's own source game
          if (!gameId) {
            const pz = shuffled[0];
            const w = pz.game?.players?.find((p: { color: string }) => p.color === "white");
            const b = pz.game?.players?.find((p: { color: string }) => p.color === "black");
            if (pz.game?.id && w && b) {
              gameId = pz.game.id;
              whitePlayer = w.name;
              blackPlayer = b.name;
              whiteElo = w.rating ?? 1500;
              blackElo = b.rating ?? 1500;
            }
          }
        }
      }

      if (!gameId) throw new Error("No games found");

      // Step 2: Export the full PGN
      const pgnRes = await fetch(
        `https://lichess.org/game/export/${gameId}?evals=false&clocks=true&opening=true`,
        { headers: { Accept: "application/x-chess-pgn" } }
      );
      if (!pgnRes.ok) throw new Error("Failed to export game");
      const pgn = await pgnRes.text();

      // Parse opening/result from PGN
      const openingMatch = pgn.match(/\[Opening "(.+?)"\]/);
      const resultMatch = pgn.match(/\[Result "(.+?)"\]/);
      const terminationMatch = pgn.match(/\[Termination "(.+?)"\]/);
      const result = resultMatch?.[1] ?? "*";

      const data: GameData = {
        id: gameId,
        pgn,
        whitePlayer,
        blackPlayer,
        whiteElo,
        blackElo,
        avgElo: Math.round((whiteElo + blackElo) / 2),
        opening: openingMatch?.[1] ?? "Unknown Opening",
        result,
        termination: terminationMatch?.[1] ?? "",
        winner: result === "1-0" ? "white" : result === "0-1" ? "black" : null,
      };

      setGame(data);

      // Randomly orient the board
      setOrientation(Math.random() > 0.5 ? "white" : "black");

      // Parse and analyze the game
      const { sans, clocks } = parsePgnWithClocks(data.pgn);
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
        let bestMoveUci: string | null = null;
        try {
          const pv = await stockfishPool.getPrincipalVariation(fenBefore, 1, 12);
          if (pv?.pvMoves?.[0]) {
            bestMoveUci = pv.pvMoves[0];
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
        // Mover's eval went from cpBefore to -cpAfter, so loss = cpBefore + cpAfter
        const sideMultiplier = moveResult.color === "w" ? 1 : -1;
        const evalBeforeForSide = cpBefore * sideMultiplier;
        const evalAfterForSide = -cpAfter * sideMultiplier;
        const cpLoss = Math.max(0, cpBefore + cpAfter);

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
          bestMoveUci,
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
          sacrificedMaterial: !!moveResult.captured && cpLoss > 150 && _pieceVal(moveResult.piece) > _pieceVal(moveResult.captured),
          wasBookMove: i < 10 && cpLoss < 10,
          mateInN: null,
          missedMateInN: null,
          walkedIntoFork: false,
          walkedIntoPin: false,
          evalSwing: cpLoss,
          isResignationWorthy: cpAfter > 500 && cpBefore > -200,
          timeSpent: clocks[i] ?? null,
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

        const commentResult = generateMoveComment(analyzedMove, usedSet, gameSummary);

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
          comment: commentResult?.text ?? null,
          piece: moveResult.piece,
          isCapture: !!moveResult.captured,
          isCheck: chess.isCheck(),
          arrows: commentResult?.annotations.arrows,
          markers: commentResult?.annotations.markers,
        });

        setAnalysisProgress(Math.round(((i + 1) / maxMoves) * 100));
      }

      // Inject opening roast at the last book move (the exact moment of the opening)
      const openingRoast = getOpeningRoast(data.opening);
      let lastBookIdx = -1;
      for (let i = analyzed.length - 1; i >= 0; i--) {
        if (analyzed[i].classification === "book" || (i < 10 && analyzed[i].cpLoss < 10)) { lastBookIdx = i; break; }
      }
      // Place on the last book move, or the first uncommented early move as fallback
      const openingTarget = lastBookIdx >= 0
        ? lastBookIdx
        : analyzed.findIndex((m, i) => i >= 2 && i <= 5 && !m.comment);
      if (openingTarget >= 0) {
        analyzed[openingTarget].comment = openingRoast;
      } else if (analyzed.length > 2) {
        analyzed[2].comment = analyzed[2].comment || openingRoast;
      }

      // Inject closing game summary as a separate synthetic entry AFTER the last move
      // so the last move's own commentary plays first
      if (analyzed.length > 0) {
        const lastMove = analyzed[analyzed.length - 1];
        const closingRoast = getClosingRoast(totalBlunders, totalMistakes, totalInaccuracies, analyzed.length);
        analyzed.push({
          san: "",
          fen: lastMove.fen,
          fenBefore: lastMove.fen,
          from: lastMove.to,
          to: lastMove.to,
          color: lastMove.color === "w" ? "b" : "w",
          moveNumber: lastMove.moveNumber + (lastMove.color === "b" ? 1 : 0),
          cp: lastMove.cp,
          cpLoss: 0,
          bestMoveSan: null,
          classification: "good",
          comment: closingRoast,
          piece: "p",
          isCapture: false,
          isCheck: false,
        });
      }

      // Inject 1-2 elo-guessing comments based on game quality patterns
      const blunderCount = analyzed.filter(m => m.classification === "blunder").length;
      const brilliantCount = analyzed.filter(m => m.classification === "brilliant" || m.classification === "best").length;
      const totalMvs = analyzed.length;

      // Determine quality assessment at ~40% of game
      const earlyIdx = Math.floor(totalMvs * 0.4);
      const earlyBlunders = analyzed.slice(0, earlyIdx).filter(m => m.classification === "blunder").length;
      const earlyBest = analyzed.slice(0, earlyIdx).filter(m => m.classification === "brilliant" || m.classification === "best").length;

      let earlyQuality: "surprising_good" | "clueless" | "mid" | "rollercoaster" = "mid";
      if (earlyBlunders >= 2 && earlyBest >= 2) earlyQuality = "rollercoaster";
      else if (earlyBlunders >= 2) earlyQuality = "clueless";
      else if (earlyBest >= 3) earlyQuality = "surprising_good";

      const eloTarget1 = analyzed.findIndex((m, i) => {
        const pct = i / totalMvs;
        return pct >= 0.38 && pct <= 0.48 && !m.comment;
      });
      if (eloTarget1 >= 0) {
        analyzed[eloTarget1].comment = getEloGuessComment(earlyQuality);
      }

      // Second elo comment at ~55% if quality shifts
      const lateIdx = Math.floor(totalMvs * 0.55);
      const lateBlunders = analyzed.slice(earlyIdx, lateIdx).filter(m => m.classification === "blunder").length;
      const lateBest = analyzed.slice(earlyIdx, lateIdx).filter(m => m.classification === "brilliant" || m.classification === "best").length;

      let lateQuality: "surprising_good" | "clueless" | "mid" | "rollercoaster" = "mid";
      if (lateBlunders >= 1 && lateBest >= 1) lateQuality = "rollercoaster";
      else if (lateBlunders >= 2) lateQuality = "clueless";
      else if (lateBest >= 2) lateQuality = "surprising_good";

      if (lateQuality !== earlyQuality) {
        const eloTarget2 = analyzed.findIndex((m, i) => {
          const pct = i / totalMvs;
          return pct >= 0.52 && pct <= 0.60 && !m.comment;
        });
        if (eloTarget2 >= 0) {
          analyzed[eloTarget2].comment = getEloGuessComment(lateQuality);
        }
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

  /* ── Process a user-provided PGN (import or paste) ── */
  const processProvidedPgn = useCallback(async (pgn: string, knownWhiteElo?: number, knownBlackElo?: number) => {
    tts.stop();
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
    setGuessReaction(null);
    setMobileClippyOpen(false);
    setShowConfetti(false);
    setAudienceMeter(50);
    setRevealCounterElo(null);
    setSpotlightPulse(false);
    setLockedIn(false);
    setIsRewatching(false);
    setActiveDecision(null);
    setDecisionAnswer(null);
    setDecisionShown(new Set());
    setPendingDecisionIdx(null);
    usedLines.current.clear();
    setActiveComment(null);
    setCurrentMood("neutral");
    setScore(0);
    setQuizScore(0);
    setLastScoreGain(null);
    setScoreSaved(false);

    try {
      // Extract headers from PGN
      const getHeader = (name: string) => {
        const m = pgn.match(new RegExp(`\\[${name}\\s+"([^"]*)"\\]`));
        return m?.[1] ?? "";
      };

      const whitePlayer = getHeader("White") || "White";
      const blackPlayer = getHeader("Black") || "Black";
      const whiteElo = knownWhiteElo || parseInt(getHeader("WhiteElo")) || 1500;
      const blackElo = knownBlackElo || parseInt(getHeader("BlackElo")) || 1500;
      const opening = getHeader("Opening") || getHeader("ECO") || "Unknown Opening";
      const result = getHeader("Result") || "*";
      const termination = getHeader("Termination") || "";
      const site = getHeader("Site") || "";
      // Try to extract game ID from Lichess URLs
      const lichessMatch = site.match(/lichess\.org\/(\w{8})/);
      const gameId = lichessMatch?.[1] || `custom-${Date.now()}`;

      const data: GameData = {
        id: gameId,
        pgn,
        whitePlayer,
        blackPlayer,
        whiteElo,
        blackElo,
        avgElo: Math.round((whiteElo + blackElo) / 2),
        opening,
        result,
        termination,
        winner: result === "1-0" ? "white" : result === "0-1" ? "black" : null,
      };

      setGame(data);
      setOrientation(Math.random() > 0.5 ? "white" : "black");

      const { sans, clocks } = parsePgnWithClocks(data.pgn);
      if (sans.length < 6) {
        throw new Error("Game too short (need at least 6 moves)");
      }

      setAnalyzing(true);
      setAnalysisProgress(0);

      const chess = new Chess();
      const analyzed: MoveWithComment[] = [];
      const usedSet = usedLines.current;

      let totalBlunders = 0;
      let totalMistakes = 0;
      let totalInaccuracies = 0;

      const maxMoves = Math.min(sans.length, 60);

      for (let i = 0; i < maxMoves; i++) {
        const fenBefore = chess.fen();
        let cpBefore = 0;
        try { const evalBefore = await stockfishPool.evaluateFen(fenBefore, 12); cpBefore = evalBefore?.cp ?? 0; } catch {}

        let bestMoveSan: string | null = null;
        let bestMoveUci: string | null = null;
        try {
          const pv = await stockfishPool.getPrincipalVariation(fenBefore, 1, 12);
          if (pv?.pvMoves?.[0]) {
            bestMoveUci = pv.pvMoves[0];
            const tmp = new Chess(fenBefore);
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const m = tmp.move({ from: pv.pvMoves[0].slice(0, 2), to: pv.pvMoves[0].slice(2, 4), promotion: pv.pvMoves[0].slice(4, 5) || undefined } as any);
              bestMoveSan = m?.san ?? null;
            } catch {}
          }
        } catch {}

        let moveResult;
        try { moveResult = chess.move(sans[i]); } catch { break; }
        if (!moveResult) break;

        const fenAfter = chess.fen();
        let cpAfter = 0;
        try { const evalAfter = await stockfishPool.evaluateFen(fenAfter, 12); cpAfter = evalAfter?.cp ?? 0; } catch {}

        const sideMultiplier = moveResult.color === "w" ? 1 : -1;
        const evalBeforeForSide = cpBefore * sideMultiplier;
        const evalAfterForSide = -cpAfter * sideMultiplier;
        const cpLoss = Math.max(0, cpBefore + cpAfter);
        const isBestMove = bestMoveSan === moveResult.san;
        const classification = classifyMove(cpLoss, isBestMove);

        if (classification === "blunder") totalBlunders++;
        if (classification === "mistake") totalMistakes++;
        if (classification === "inaccuracy") totalInaccuracies++;

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
          bestMoveUci,
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
          sacrificedMaterial: !!moveResult.captured && cpLoss > 150 && _pieceVal(moveResult.piece) > _pieceVal(moveResult.captured),
          wasBookMove: i < 10 && cpLoss < 10,
          mateInN: null,
          missedMateInN: null,
          walkedIntoFork: false,
          walkedIntoPin: false,
          evalSwing: cpLoss,
          isResignationWorthy: cpAfter > 500 && cpBefore > -200,
          timeSpent: clocks[i] ?? null,
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

        const commentResult = generateMoveComment(analyzedMove, usedSet, gameSummary);

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
          comment: commentResult?.text ?? null,
          piece: moveResult.piece,
          isCapture: !!moveResult.captured,
          isCheck: chess.isCheck(),
          arrows: commentResult?.annotations.arrows,
          markers: commentResult?.annotations.markers,
        });

        setAnalysisProgress(Math.round(((i + 1) / maxMoves) * 100));
      }

      // Inject opening roast at the last book move (the exact moment of the opening)
      const openingRoast = getOpeningRoast(data.opening);
      let lastBookIdx = -1;
      for (let i = analyzed.length - 1; i >= 0; i--) {
        if (analyzed[i].classification === "book" || (i < 10 && analyzed[i].cpLoss < 10)) { lastBookIdx = i; break; }
      }
      const openingTarget = lastBookIdx >= 0
        ? lastBookIdx
        : analyzed.findIndex((m, i) => i >= 2 && i <= 5 && !m.comment);
      if (openingTarget >= 0) analyzed[openingTarget].comment = openingRoast;
      else if (analyzed.length > 2) analyzed[2].comment = analyzed[2].comment || openingRoast;

      // Inject closing game summary as a separate synthetic entry AFTER the last move
      if (analyzed.length > 0) {
        const lastMove = analyzed[analyzed.length - 1];
        const closingRoast = getClosingRoast(totalBlunders, totalMistakes, totalInaccuracies, analyzed.length);
        analyzed.push({
          san: "",
          fen: lastMove.fen,
          fenBefore: lastMove.fen,
          from: lastMove.to,
          to: lastMove.to,
          color: lastMove.color === "w" ? "b" : "w",
          moveNumber: lastMove.moveNumber + (lastMove.color === "b" ? 1 : 0),
          cp: lastMove.cp,
          cpLoss: 0,
          bestMoveSan: null,
          classification: "good",
          comment: closingRoast,
          piece: "p",
          isCapture: false,
          isCheck: false,
        });
      }

      // Elo-guessing comments
      const totalMvs = analyzed.length;
      const earlyIdx = Math.floor(totalMvs * 0.4);
      const earlyBlunders = analyzed.slice(0, earlyIdx).filter(m => m.classification === "blunder").length;
      const earlyBest = analyzed.slice(0, earlyIdx).filter(m => m.classification === "brilliant" || m.classification === "best").length;
      let earlyQuality: "surprising_good" | "clueless" | "mid" | "rollercoaster" = "mid";
      if (earlyBlunders >= 2 && earlyBest >= 2) earlyQuality = "rollercoaster";
      else if (earlyBlunders >= 2) earlyQuality = "clueless";
      else if (earlyBest >= 3) earlyQuality = "surprising_good";
      const eloTarget1 = analyzed.findIndex((m, i) => { const pct = i / totalMvs; return pct >= 0.38 && pct <= 0.48 && !m.comment; });
      if (eloTarget1 >= 0) analyzed[eloTarget1].comment = getEloGuessComment(earlyQuality);

      const lateIdx = Math.floor(totalMvs * 0.55);
      const lateBlunders = analyzed.slice(earlyIdx, lateIdx).filter(m => m.classification === "blunder").length;
      const lateBest = analyzed.slice(earlyIdx, lateIdx).filter(m => m.classification === "brilliant" || m.classification === "best").length;
      let lateQuality: "surprising_good" | "clueless" | "mid" | "rollercoaster" = "mid";
      if (lateBlunders >= 1 && lateBest >= 1) lateQuality = "rollercoaster";
      else if (lateBlunders >= 2) lateQuality = "clueless";
      else if (lateBest >= 2) lateQuality = "surprising_good";
      if (lateQuality !== earlyQuality) {
        const eloTarget2 = analyzed.findIndex((m, i) => { const pct = i / totalMvs; return pct >= 0.52 && pct <= 0.60 && !m.comment; });
        if (eloTarget2 >= 0) analyzed[eloTarget2].comment = getEloGuessComment(lateQuality);
      }

      setMoves(analyzed);
      setBlunders(totalBlunders);
      setMistakes(totalMistakes);
      setInaccuracies(totalInaccuracies);
      setAnalyzing(false);

      const intro = GAME_INTRO[Math.floor(Math.random() * GAME_INTRO.length)];
      setIntroLine(intro);
      setPageState("intro");
    } catch (err) {
      console.error("Failed to process game:", err);
      alert(err instanceof Error ? err.message : "Failed to process game");
      setPageState("choose-source");
      setAnalyzing(false);
    }
  }, []);

  /* ── Fetch the daily challenge game (same for everyone each day) ── */
  const fetchDailyGame = useCallback(async () => {
    setIsDaily(true);
    try {
      // Use Lichess daily puzzle — its source game is the same for everyone today
      const dailyRes = await fetch("https://lichess.org/api/puzzle/daily", {
        headers: { Accept: "application/json" },
      });
      if (!dailyRes.ok) throw new Error("Failed to fetch daily puzzle");
      const daily = await dailyRes.json();
      const gameId = daily?.game?.id;
      if (!gameId) throw new Error("No game in daily puzzle");

      // Get a recent game from one of the puzzle's players for variety
      const players = daily?.game?.players ?? [];
      const player = players[0];
      if (!player?.id) throw new Error("No player found");

      // Use a date-seeded index to deterministically pick a game
      const today = new Date().toISOString().slice(0, 10);
      const seed = today.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

      const userRes = await fetch(
        `https://lichess.org/api/games/user/${player.id}?max=20&rated=true&perfType=blitz,rapid&opening=true`,
        { headers: { Accept: "application/x-ndjson" } }
      );
      if (!userRes.ok) throw new Error("Failed to load player games");
      const text = await userRes.text();
      const lines = text.trim().split("\n").filter(Boolean);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const games: any[] = lines
        .map((l) => { try { return JSON.parse(l); } catch { return null; } })
        .filter((g: Record<string, unknown>) =>
          g && (g as { variant: string }).variant === "standard" && (g as { rated: boolean }).rated &&
          (g as { status: string }).status !== "started" &&
          (g as { players: { white?: { user?: unknown }; black?: { user?: unknown } } }).players?.white?.user &&
          (g as { players: { white?: { user?: unknown }; black?: { user?: unknown } } }).players?.black?.user
        );

      if (games.length === 0) throw new Error("No valid games");
      const picked = games[seed % games.length];

      // Export and process the game using the existing flow
      const pgnRes = await fetch(
        `https://lichess.org/game/export/${picked.id}?evals=false&clocks=true&opening=true`,
        { headers: { Accept: "application/x-chess-pgn" } }
      );
      if (!pgnRes.ok) throw new Error("Failed to export daily game");
      const pgn = await pgnRes.text();

      const wElo = picked.players?.white?.rating ?? 1500;
      const bElo = picked.players?.black?.rating ?? 1500;
      await processProvidedPgn(pgn, wElo, bElo);
    } catch (err) {
      console.error("Daily game failed, falling back to random:", err);
      setIsDaily(false);
      fetchGame();
    }
  }, [fetchGame, processProvidedPgn]);

  /* ── Fetch recent games from Lichess / Chess.com ── */
  const fetchRecentGames = useCallback(async () => {
    const username = loadUsername.trim();
    if (!username) { setLoadError("Enter a username"); return; }
    setLoadingGames(true);
    setLoadError("");
    setRecentGames([]);

    try {
      if (loadSource === "lichess") {
        const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=10&moves=true&opening=true&clocks=true&evals=false&pgnInBody=true`;
        const res = await fetch(url, { headers: { Accept: "application/x-chess-pgn" } });
        if (!res.ok) {
          if (res.status === 404) throw new Error("User not found on Lichess");
          throw new Error(`Lichess API error (${res.status})`);
        }
        const text = await res.text();
        const games = text.split(/\n\n(?=\[Event )/).filter(g => g.trim());
        if (games.length === 0) throw new Error("No games found for this user");
        const parsed = games.map(pgn => {
          const headers: Record<string, string> = {};
          const headerLines = pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) ?? [];
          for (const line of headerLines) {
            const m = line.match(/\[(\w+)\s+"([^"]*)"\]/);
            if (m) headers[m[1]] = m[2];
          }
          return {
            white: headers.White ?? "?",
            black: headers.Black ?? "?",
            whiteElo: parseInt(headers.WhiteElo) || 1500,
            blackElo: parseInt(headers.BlackElo) || 1500,
            date: headers.UTCDate ?? headers.Date ?? "?",
            result: headers.Result ?? "?",
            event: headers.Event,
            pgn: pgn.trim(),
          };
        });
        setRecentGames(parsed);
      } else {
        const archRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`);
        if (!archRes.ok) {
          if (archRes.status === 404) throw new Error("User not found on Chess.com");
          throw new Error(`Chess.com API error (${archRes.status})`);
        }
        const archData = await archRes.json();
        const archives: string[] = archData.archives ?? [];
        if (archives.length === 0) throw new Error("No games found for this user");

        const latestUrl = archives[archives.length - 1];
        const gamesRes = await fetch(latestUrl);
        if (!gamesRes.ok) throw new Error("Failed to fetch games from Chess.com");
        const gamesData = await gamesRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allGames: any[] = gamesData.games ?? [];

        const last10 = allGames.filter((g: { pgn?: string }) => g.pgn).slice(-10).reverse();
        if (last10.length === 0) throw new Error("No games with PGN found");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed = last10.map((g: any) => {
          const pgn = g.pgn!;
          const headers: Record<string, string> = {};
          const headerLines = pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) ?? [];
          for (const line of headerLines) {
            const m = line.match(/\[(\w+)\s+"([^"]*)"\]/);
            if (m) headers[m[1]] = m[2];
          }
          return {
            white: headers.White ?? g.white?.username ?? "?",
            black: headers.Black ?? g.black?.username ?? "?",
            whiteElo: parseInt(headers.WhiteElo) || g.white?.rating || 1500,
            blackElo: parseInt(headers.BlackElo) || g.black?.rating || 1500,
            date: headers.UTCDate ?? headers.Date ?? (g.end_time ? new Date(g.end_time * 1000).toISOString().slice(0, 10) : "?"),
            result: headers.Result ?? "?",
            event: headers.Event,
            pgn: pgn.trim(),
          };
        });
        setRecentGames(parsed);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load games");
    } finally {
      setLoadingGames(false);
    }
  }, [loadUsername, loadSource]);

  /* ── Initialize ── */
  useEffect(() => {
    preloadSounds();
    preloadRoastSounds();
  }, []);

  /* ── Challenge link: auto-load game from URL ?game=XXXXX ── */
  const fetchGameById = useCallback(async (id: string) => {
    try {
      // Export the full PGN from Lichess  
      const pgnRes = await fetch(
        `https://lichess.org/game/export/${id}?evals=false&clocks=true&opening=true`,
        { headers: { Accept: "application/x-chess-pgn" } }
      );
      if (!pgnRes.ok) throw new Error("Failed to load challenge game");
      const pgn = await pgnRes.text();

      // Extract elo from PGN headers
      const whiteEloMatch = pgn.match(/\[WhiteElo "(\d+)"\]/);
      const blackEloMatch = pgn.match(/\[BlackElo "(\d+)"\]/);
      const wElo = whiteEloMatch ? parseInt(whiteEloMatch[1]) : undefined;
      const bElo = blackEloMatch ? parseInt(blackEloMatch[1]) : undefined;

      setChallengeId(id);
      await processProvidedPgn(pgn, wElo, bElo);
    } catch (err) {
      console.error("Challenge game failed:", err);
      // Fall back to source selection
      setPageState("choose-source");
    }
  }, [processProvidedPgn]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get("game");
    if (gameParam) {
      // Clear the URL param so refreshing doesn't re-trigger
      window.history.replaceState({}, "", window.location.pathname);
      fetchGameById(gameParam);
    }
  }, [fetchGameById]);

  /* ── Autoplay (waits for typewriter + TTS to finish) ── */
  useEffect(() => {
    if (pageState !== "watching" || !autoplay) return;
    if (activeDecision) return; // wait for decision to be dismissed
    if (!typingDone) return; // wait for speech bubble animation
    // If TTS is active and still speaking, wait for it to finish
    if (tts.enabled && tts.speaking) {
      // Register a one-shot callback to re-trigger this effect
      tts.onDone.current = () => {
        tts.onDone.current = null;
        setTtsDoneSignal(n => n + 1);
      };
      return () => { tts.onDone.current = null; };
    }

    if (currentIdx >= moves.length - 1) {
      setTimeout(() => {
        setActiveComment(null);
        playSound("drumroll");
        setPageState("guessing");
      }, 1500);
      return;
    }

    // Reading time scales with comment length — longer messages get more time
    const delay = activeComment
      ? Math.max(2500, Math.min(6000, activeComment.length * 28))
      : speed;

    const timer = setTimeout(() => {
      const next = currentIdx + 1;
      const move = moves[next];
      if (move) {
        setCurrentIdx(next);
        setFen(move.fen);
        setLastMove({ from: move.from, to: move.to });

        if (move.isCheck) playSound("check");
        else if (move.isCapture) playSound("capture");
        else playSound("move");

        // Gameshow sound effects + viral meme sounds based on move classification
        if (move.comment) {
          const cls = move.classification;
          const isHungPiece = move.cpLoss > 200 && !move.isCapture;
          setTimeout(() => {
            if (cls === "blunder") {
              if (isHungPiece) {
                playSound("mario-death");
              } else if (move.cpLoss > 500) {
                playSound(Math.random() < 0.5 ? "emotional-damage" : "bruh");
              } else {
                const r = Math.random();
                if (r < 0.35) playSound("vine-boom");
                else if (r < 0.6) playSound("roblox-oof");
                else playSound("crowd-ooh");
              }
            } else if (cls === "brilliant") {
              playSound(Math.random() < 0.5 ? "airhorn" : "applause-short");
            } else if (cls === "best" || cls === "great") {
              playSound("bell");
            } else if (cls === "mistake") {
              const r = Math.random();
              if (r < 0.3) playSound("bro-serious");
              else if (r < 0.55) playSound("ohnono-laugh");
              else playSound("honk");
            } else if (cls === "inaccuracy" && move.cpLoss > 80) {
              playSound(Math.random() < 0.5 ? "record-scratch" : "nani");
            }
          }, 300);
          // Update audience meter
          if (cls === "blunder") setAudienceMeter(prev => Math.max(0, prev - 25));
          else if (cls === "mistake") setAudienceMeter(prev => Math.max(0, prev - 12));
          else if (cls === "inaccuracy") setAudienceMeter(prev => Math.max(0, prev - 5));
          else if (cls === "brilliant") setAudienceMeter(prev => Math.min(100, prev + 20));
          else if (cls === "best" || cls === "great") setAudienceMeter(prev => Math.min(100, prev + 10));
          else if (cls === "good") setAudienceMeter(prev => Math.min(100, prev + 3));
        }

        const streak = bestStreakAt(moves, next);
        if (move.comment) {
          setActiveComment(move.comment);
          setCommentHistory(prev => [...prev, move.comment!]);
          setCurrentMood(getMood(move, blunders, streak));
          setActiveArrows(move.arrows ?? []);
          setActiveMarkers(move.markers ?? []);
          setMobileClippyOpen(true); // Auto-open clippy on mobile when there's a comment
        } else {
          setActiveComment(null);
          setCurrentMood(getMood(move, blunders, streak));
          setActiveArrows([]);
          setActiveMarkers([]);
        }

        // Mid-game decision triggers — mark for deferred popup (after TTS/text finishes)
        if (!decisionShown.has(next)) {
          const pctDone = next / moves.length;
          const shouldTrigger =
            (pctDone >= 0.28 && pctDone <= 0.35 && !Array.from(decisionShown).some(d => d / moves.length >= 0.25 && d / moves.length <= 0.40)) ||
            (pctDone >= 0.55 && pctDone <= 0.65 && !Array.from(decisionShown).some(d => d / moves.length >= 0.50 && d / moves.length <= 0.70));
          if (shouldTrigger && move.comment) {
            setPendingDecisionIdx(next);
          }
        }
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageState, autoplay, currentIdx, moves, speed, typingDone, activeComment, tts.enabled, tts.speaking, ttsDoneSignal, activeDecision]);

  /* ── Deferred decision popup — waits for TTS + typewriter to finish + reading time ── */
  const decisionReadyTime = useRef<number | null>(null);
  useEffect(() => {
    if (pendingDecisionIdx === null || pageState !== "watching") {
      decisionReadyTime.current = null;
      return;
    }
    if (!typingDone) { decisionReadyTime.current = null; return; } // wait for text to finish typing
    if (tts.enabled && tts.speaking) { decisionReadyTime.current = null; return; } // wait for TTS to finish

    // Mark when text/TTS finished, then add a reading delay
    if (decisionReadyTime.current === null) {
      decisionReadyTime.current = Date.now();
    }
    const elapsed = Date.now() - decisionReadyTime.current;
    // Scale reading delay with the comment length — longer text needs more time
    const commentLen = moves[pendingDecisionIdx]?.comment?.length ?? 0;
    const readingDelay = tts.enabled
      ? Math.max(1200, commentLen * 15)   // TTS reads it, just need a small buffer
      : Math.max(3500, commentLen * 30);   // reading only — scale with length
    if (elapsed < readingDelay) {
      const timer = setTimeout(() => {
        // Force a re-render to re-check this effect
        setPendingDecisionIdx(prev => prev);
      }, readingDelay - elapsed + 50);
      return () => clearTimeout(timer);
    }

    const next = pendingDecisionIdx;
    const move = moves[next];
    if (!move) { setPendingDecisionIdx(null); return; }

    const pctDone = next / moves.length;
    const cls = move.classification;
    const nextMove = next + 1 < moves.length ? moves[next + 1] : null;
    const blundersSoFar = moves.slice(0, next + 1).filter(m => m.classification === "blunder").length;
    const mistakesSoFar = moves.slice(0, next + 1).filter(m => m.classification === "mistake").length;
    const bestMovesSoFar = moves.slice(0, next + 1).filter(m => m.classification === "best" || m.classification === "brilliant").length;
    const totalMoves = moves.length;
    const movesLeft = totalMoves - next;
    const whiteBlunders = moves.slice(0, next + 1).filter(m => m.classification === "blunder" && m.color === "w").length;
    const blackBlunders = moves.slice(0, next + 1).filter(m => m.classification === "blunder" && m.color === "b").length;
    const captureCount = moves.slice(0, next + 1).filter(m => m.isCapture).length;
    const checkCount = moves.slice(0, next + 1).filter(m => m.isCheck).length;

    // Build a pool of eligible questions based on game context
    type QBuilder = () => GameshowDecision;
    const questionPool: QBuilder[] = [];

    // Q1: What happens after a blunder (classic)
    if (cls === "blunder" || cls === "mistake") {
      questionPool.push(() => ({
        moveIdx: next,
        question: `🤔 That ${cls} just happened. What do you think happens next?`,
        options: [
          { label: "They recover with a good move", emoji: "💪" },
          { label: "It gets worse", emoji: "📉" },
          { label: "Opponent blunders back", emoji: "🤝" },
        ],
        correctIdx: nextMove ? (
          nextMove.classification === "blunder" || nextMove.classification === "mistake" ? 2 :
          nextMove.cpLoss > 50 ? 1 : 0
        ) : 1,
        explanation: nextMove?.classification === "blunder"
          ? "The blunder trades! Both sides are dropping pieces 💀"
          : nextMove?.cpLoss === 0 ? "They actually found the best move! Redemption arc 🎬"
          : "The chaos continues... as expected at this level 🫠",
      }));
    }

    // Q2: Total blunders prediction
    if (blundersSoFar >= 2 && pctDone < 0.5) {
      questionPool.push(() => {
        const totalB = moves.filter(m => m.classification === "blunder").length;
        const remaining = totalB - blundersSoFar;
        return {
          moveIdx: next,
          question: `🎯 We're ${Math.round(pctDone * 100)}% through with ${blundersSoFar} blunders. How many total by the end?`,
          options: [
            { label: `${blundersSoFar} — they've learned`, emoji: "🎓" },
            { label: `${blundersSoFar + 2}-${blundersSoFar + 4} — buckle up`, emoji: "🎢" },
            { label: `${blundersSoFar + 5}+ — trainwreck`, emoji: "🚂💥" },
          ],
          correctIdx: remaining <= 0 ? 0 : remaining <= 4 ? 1 : 2,
          explanation: totalB <= blundersSoFar
            ? "They actually cleaned it up! Character development 📈"
            : totalB >= blundersSoFar + 5
            ? `${totalB} total blunders. This game is a crime scene 🔍`
            : `${totalB} total blunders. Par for the course 🏌️`,
        };
      });
    }

    // Q3: Who has more blunders? (when both sides have blundered)
    if (whiteBlunders > 0 && blackBlunders > 0 && pctDone < 0.6) {
      questionPool.push(() => {
        const totalW = moves.filter(m => m.classification === "blunder" && m.color === "w").length;
        const totalB = moves.filter(m => m.classification === "blunder" && m.color === "b").length;
        return {
          moveIdx: next,
          question: `⚖️ White has ${whiteBlunders} blunders, Black has ${blackBlunders}. Who finishes with more?`,
          options: [
            { label: `${game?.whitePlayer ?? "White"} blunders more`, emoji: "⬜" },
            { label: "They tie in blunders", emoji: "🤝" },
            { label: `${game?.blackPlayer ?? "Black"} blunders more`, emoji: "⬛" },
          ],
          correctIdx: totalW > totalB ? 0 : totalW === totalB ? 1 : 2,
          explanation: totalW === totalB
            ? `Both ended with ${totalW} blunders. Perfectly balanced, as all things should be 🗿`
            : `${totalW > totalB ? "White" : "Black"} ended with ${Math.max(totalW, totalB)} blunders vs ${Math.min(totalW, totalB)}. ${Math.max(totalW, totalB) >= 5 ? "Yikes." : "Could be worse."} 💀`,
        };
      });
    }

    // Q4: How does the game end?
    if (pctDone >= 0.4 && pctDone <= 0.7 && game) {
      questionPool.push(() => {
        const isCheckmate = game.termination?.toLowerCase().includes("checkmate") || game.result === "1-0" || game.result === "0-1";
        const isDraw = game.result === "1/2-1/2";
        const isResign = game.termination?.toLowerCase().includes("resign");
        return {
          moveIdx: next,
          question: "🏁 How does this game end?",
          options: [
            { label: "Checkmate", emoji: "♟️" },
            { label: "Resignation", emoji: "🏳️" },
            { label: "Draw/Stalemate", emoji: "🤝" },
          ],
          correctIdx: isDraw ? 2 : isResign ? 1 : 0,
          explanation: isDraw
            ? "A draw! Neither side could finish the other off 🤝"
            : isResign
            ? "They resigned! Couldn't take the heat anymore 🏳️🔥"
            : "Checkmate! Someone actually got mated 💀♟️",
        };
      });
    }

    // Q5: Will there be a brilliant move in the rest of the game?
    if (pctDone >= 0.3 && pctDone <= 0.6) {
      questionPool.push(() => {
        const brilliantsLeft = moves.slice(next + 1).filter(m => m.classification === "brilliant").length;
        return {
          moveIdx: next,
          question: "✨ Will either player find a BRILLIANT move in the rest of this game?",
          options: [
            { label: "Yes — someone pulls out a banger", emoji: "🧠" },
            { label: "No — mediocrity all the way", emoji: "🫠" },
          ],
          correctIdx: brilliantsLeft > 0 ? 0 : 1,
          explanation: brilliantsLeft > 0
            ? `Yes! ${brilliantsLeft} brilliant move${brilliantsLeft > 1 ? "s" : ""} still coming. Even a broken clock... 🧠✨`
            : "Nope. Pure mediocrity til the end. As expected 🫠💀",
        };
      });
    }

    // Q6: How many total captures in the game?
    if (pctDone >= 0.35 && pctDone <= 0.55) {
      const totalCaptures = moves.filter(m => m.isCapture).length;
      questionPool.push(() => ({
        moveIdx: next,
        question: `⚔️ There have been ${captureCount} captures so far. How many total by the end?`,
        options: [
          { label: `${captureCount}-${captureCount + 3} — it calms down`, emoji: "🕊️" },
          { label: `${captureCount + 4}-${captureCount + 8} — some more fireworks`, emoji: "🎆" },
          { label: `${captureCount + 9}+ — BLOODBATH`, emoji: "🩸" },
        ],
        correctIdx: (() => {
          const remaining = totalCaptures - captureCount;
          if (remaining <= 3) return 0;
          if (remaining <= 8) return 1;
          return 2;
        })(),
        explanation: (() => {
          const remaining = totalCaptures - captureCount;
          if (remaining <= 3) return "Peace was an option after all 🕊️";
          if (remaining <= 8) return `${totalCaptures} total captures. Healthy amount of violence ⚔️`;
          return `${totalCaptures} total captures! A bloodbath! Bodies everywhere! 🩸💀`;
        })(),
      }));
    }

    // Q7: Will there be a check in the next 5 moves?
    if (movesLeft >= 5) {
      const checksInNext5 = moves.slice(next + 1, next + 6).filter(m => m.isCheck).length;
      questionPool.push(() => ({
        moveIdx: next,
        question: "♔ Will there be a check in the next 5 moves?",
        options: [
          { label: "Yes — someone's getting checked", emoji: "♚" },
          { label: "No — kings are chilling", emoji: "😎" },
        ],
        correctIdx: checksInNext5 > 0 ? 0 : 1,
        explanation: checksInNext5 > 0
          ? `${checksInNext5} check${checksInNext5 > 1 ? "s" : ""}! The king can't catch a break ♔💀`
          : "The kings lived peacefully for 5 whole moves. Rare achievement unlocked 😎👑",
      }));
    }

    // Q8: What's the next blunder type? (when game is chaotic)
    if (blundersSoFar + mistakesSoFar >= 3 && movesLeft >= 8) {
      const nextBad = moves.slice(next + 1).find(m => m.classification === "blunder" || m.classification === "mistake");
      questionPool.push(() => ({
        moveIdx: next,
        question: "🎪 The next mistake/blunder will be by which side?",
        options: [
          { label: game?.whitePlayer ?? "White", emoji: "⬜" },
          { label: game?.blackPlayer ?? "Black", emoji: "⬛" },
          { label: "Neither — they both play well", emoji: "🤯" },
        ],
        correctIdx: !nextBad ? 2 : nextBad.color === "w" ? 0 : 1,
        explanation: !nextBad
          ? "They actually cleaned it up! Nobody saw that coming 🤯"
          : `${nextBad.color === "w" ? "White" : "Black"} cracks first with ${nextBad.san}. The prophecy is fulfilled 🔮`,
      }));
    }

    // Q10: Best move streak prediction
    if (bestMovesSoFar >= 3 && pctDone < 0.6) {
      questionPool.push(() => {
        const totalBest = moves.filter(m => m.classification === "best" || m.classification === "brilliant").length;
        return {
          moveIdx: next,
          question: `🎯 ${bestMovesSoFar} best/brilliant moves so far. Will they break ${bestMovesSoFar + 3}?`,
          options: [
            { label: "Yes — surprise accuracy incoming", emoji: "🎯" },
            { label: "No — they've peaked", emoji: "📉" },
          ],
          correctIdx: totalBest > bestMovesSoFar + 3 ? 0 : 1,
          explanation: totalBest > bestMovesSoFar + 3
            ? `${totalBest} total! They actually showed up today 🎯`
            : `Only ${totalBest} total. They indeed peaked early 📉`,
        };
      });
    }

    let decision: GameshowDecision | null = null;

    if (questionPool.length > 0) {
      // Pick a random question from the eligible pool
      const builder = questionPool[Math.floor(Math.random() * questionPool.length)];
      decision = builder();
    } else {
      // Fallback: audience engagement question (still varied)
      const fallbacks: QBuilder[] = [
        () => ({
          moveIdx: next,
          question: `🎭 ${checkCount} checks so far. Is this game aggressive or boring?`,
          options: [
            { label: "Aggressive — someone is out for blood", emoji: "🔥" },
            { label: "Chill — just vibes", emoji: "☮️" },
            { label: "Chaotic — nobody knows what's happening", emoji: "🌪️" },
          ],
          correctIdx: -1,
          explanation: `You've seen ${checkCount} checks and ${captureCount} captures so far. You be the judge 📊`,
        }),
        () => ({
          moveIdx: next,
          question: "🤔 Quick prediction: does the game end in under 10 more moves?",
          options: [
            { label: "Yes — it's wrapping up", emoji: "⏰" },
            { label: "No — there's more chaos ahead", emoji: "🎪" },
          ],
          correctIdx: movesLeft <= 10 ? 0 : 1,
          explanation: movesLeft <= 10
            ? `Only ${movesLeft} moves left! Your instincts are sharp ⏰`
            : `${movesLeft} moves still to go. Buckle up for more 🎪`,
        }),
        () => ({
          moveIdx: next,
          question: `📊 Move ${move.moveNumber}: What's your read on the accuracy so far?`,
          options: [
            { label: "Better than expected for this level", emoji: "🎓" },
            { label: "About what I'd expect", emoji: "🤷" },
            { label: "HOW are these people playing chess", emoji: "🤡" },
          ],
          correctIdx: -1,
          explanation: `${blundersSoFar} blunders and ${mistakesSoFar} mistakes so far — everyone has an opinion 📊🗿`,
        }),
      ];
      decision = fallbacks[Math.floor(Math.random() * fallbacks.length)]();
    }

    setPendingDecisionIdx(null);
    if (decision) {
      playSound("bell");
      setActiveDecision(decision);
      setDecisionAnswer(null);
      setAutoplay(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDecisionIdx, typingDone, tts.enabled, tts.speaking, pageState]);

  /* ── Scroll comment box to bottom ── */
  useEffect(() => {
    if (commentBoxRef.current) {
      commentBoxRef.current.scrollTop = commentBoxRef.current.scrollHeight;
    }
  }, [commentHistory]);

  /* ── Start watching after intro ── */
  const startWatching = useCallback(() => {
    playSound("intro-jingle");
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
    // Show the current move's comment in the speech bubble (if any)
    const cur = idx >= 0 ? moves[idx] : null;
    setCurrentMood(cur ? getMood(cur, blunders, bestStreakAt(moves, idx)) : "neutral");
    if (cur?.comment) {
      setActiveComment(cur.comment);
      setActiveArrows(cur.arrows ?? []);
      setActiveMarkers(cur.markers ?? []);
    } else {
      setActiveComment(null);
      setActiveArrows([]);
      setActiveMarkers([]);
    }
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

  /* ── Keyboard navigation (arrow keys, space, F) ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (pageState !== "watching" && pageState !== "guessing" && pageState !== "revealed") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setAutoplay(false);
        goToMove(Math.max(-1, currentIdx - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setAutoplay(false);
        goToMove(Math.min(moves.length - 1, currentIdx + 1));
      } else if (e.key === " " && pageState === "watching") {
        e.preventDefault();
        setAutoplay(prev => !prev);
      } else if (e.key === "f" || e.key === "F") {
        setOrientation(o => o === "white" ? "black" : "white");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pageState, currentIdx, moves.length, goToMove]);

  /* ── Guess handling ── */
  const handleGuess = useCallback((bracketIdx: number) => {
    if (!game || selectedBracket !== null) return;
    setSelectedBracket(bracketIdx);
    setLockedIn(true);

    const actualIdx = getEloBracketIdx(game.avgElo);
    const distance = Math.abs(bracketIdx - actualIdx);

    let result: "correct" | "close" | "wrong";
    let revealPool: readonly string[];

    if (distance === 0) {
      result = "correct";
      revealPool = REVEAL_CORRECT;
      playSound("correct");
      setTimeout(() => playSound("bell-double"), 200);
      setTimeout(() => playSound("applause"), 500);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      setStreakCount(prev => prev + 1);
    } else if (distance === 1) {
      result = "close";
      revealPool = REVEAL_CORRECT;
      playSound("correct");
      setTimeout(() => playSound("bell"), 200);
      setTimeout(() => playSound("applause-short"), 400);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setStreakCount(prev => prev + 1);
    } else if (bracketIdx > actualIdx) {
      result = "wrong";
      revealPool = REVEAL_TOO_HIGH;
      playSound("wrong");
      setTimeout(() => playSound("buzzer"), 150);
      if (distance >= 4) {
        setTimeout(() => playSound("emotional-damage"), 500);
      } else if (distance >= 3) {
        setTimeout(() => playSound(Math.random() < 0.5 ? "sad-trombone" : "he-needs-milk"), 600);
      }
      setStreakCount(0);
    } else {
      result = "wrong";
      revealPool = REVEAL_TOO_LOW;
      playSound("wrong");
      setTimeout(() => playSound("buzzer"), 150);
      if (distance >= 4) {
        setTimeout(() => playSound("emotional-damage"), 500);
      } else if (distance >= 3) {
        setTimeout(() => playSound(Math.random() < 0.5 ? "sad-trombone" : "he-needs-milk"), 600);
      }
      setStreakCount(0);
    }

    {
      const pts = result === "correct" ? 300 : result === "close" ? 100 : distance === 2 ? 50 : 0;
      if (pts > 0) {
        setScore(prev => prev + pts);
        setLastScoreGain(pts);
        setTimeout(() => setLastScoreGain(null), 1500);
      }
    }
    setGamesPlayed(prev => prev + 1);

    const line = revealPool[Math.floor(Math.random() * revealPool.length)]
      .replace("{elo}", String(game.avgElo));
    setRevealLine(line);

    setEloFlavor(getEloFlavorLine(game.avgElo));

    // Guess reaction commentary
    const reaction = getGuessReaction(bracketIdx, actualIdx, game.avgElo, blunders, moves.length);
    setGuessReaction(reaction);
    setActiveComment(reaction);
    setCommentHistory(prev => [...prev, reaction]);
    setCurrentMood(
      result === "correct" ? (Math.random() < 0.5 ? "moneyrain" : "clapping")
      : result === "close" ? (Math.random() < 0.5 ? "dogehug" : "hyped")
      : distance >= 4 ? (Math.random() < 0.5 ? "toxic" : "madpuke")
      : distance >= 3 ? (Math.random() < 0.5 ? "lmao" : "cantwatch")
      : "disappointed"
    );
    setMobileClippyOpen(true);

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

    // Spotlight pulse on reveal
    setSpotlightPulse(true);
    setTimeout(() => setSpotlightPulse(false), 2000);

    // Animated elo counter reveal
    setRevealCounterElo(0);
    const target = game.avgElo;
    const steps = 30;
    const stepTime = 40;
    let step = 0;
    const counterInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setRevealCounterElo(Math.round(target * eased));
      if (step >= steps) {
        clearInterval(counterInterval);
        setRevealCounterElo(target);
      }
    }, stepTime);

    // Play reveal stinger before transition
    setTimeout(() => playSound("reveal-stinger"), 300);
    setTimeout(() => { setPageState("revealed"); setLockedIn(false); setRevealModalOpen(true); }, 600);

    // Fetch leaderboard for reveal modal
    fetch("/api/roast/leaderboard?period=weekly&limit=5")
      .then(r => r.json())
      .then(d => setLeaderboardData(d.entries ?? []))
      .catch(() => {});

    // Save daily challenge result to localStorage
    if (isDaily && game) {
      const dailyData = {
        date: new Date().toISOString().slice(0, 10),
        result,
        elo: game.avgElo,
        guess: ELO_BRACKETS[bracketIdx]?.label ?? "?",
      };
      localStorage.setItem("fc-roast-daily", JSON.stringify(dailyData));
      setDailyCompleted(dailyData);
    }
  }, [game, selectedBracket, moves.length, blunders, mistakes, inaccuracies, isDaily]);

  /* ── Square styles ── */
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: "rgba(255, 255, 0, 0.25)" };
    customSquareStyles[lastMove.to] = { backgroundColor: "rgba(255, 255, 0, 0.35)" };
  }
  // King check red glow (like Lichess)
  const _checkMove = currentIdx >= 0 && currentIdx < moves.length ? moves[currentIdx] : null;
  if (_checkMove?.isCheck && fen !== "start") {
    try {
      const checkBoard = new (require("chess.js").Chess)(fen);
      const turn = checkBoard.turn();
      // Find the king that's in check
      const board = checkBoard.board();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const sq = board[r][f];
          if (sq && sq.type === "k" && sq.color === turn) {
            const file = String.fromCharCode(97 + f);
            const rank = String(8 - r);
            customSquareStyles[`${file}${rank}`] = {
              background: "radial-gradient(circle, rgba(255, 0, 0, 0.6) 0%, rgba(255, 0, 0, 0.3) 40%, transparent 70%)",
              borderRadius: "50%",
            };
          }
        }
      }
    } catch {}
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
      {/* Background — TV gameshow stage: curtain edges, spotlights, warm glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Stage curtain side panels */}
        <div className="absolute top-0 left-0 w-16 sm:w-24 h-full bg-gradient-to-r from-red-950/40 to-transparent" />
        <div className="absolute top-0 right-0 w-16 sm:w-24 h-full bg-gradient-to-l from-red-950/40 to-transparent" />
        {/* Top stage valance */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-red-950/30 to-transparent" />
        {/* Warm ambient floating lights */}
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-red-500/[0.04] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-orange-500/[0.04] blur-[100px]" />
        <div className="animate-float absolute left-1/3 bottom-20 h-64 w-64 rounded-full bg-amber-500/[0.03] blur-[80px]" />
        {/* Spotlight sweep */}
        <div className="animate-spotlight absolute top-0 left-1/2 h-[120vh] w-[200px] -translate-x-1/2 bg-gradient-to-b from-orange-400/[0.03] via-transparent to-transparent blur-[60px]" />
        {/* Spotlight pulse on guess reveal */}
        {spotlightPulse && (
          <div className="animate-spotlight-pulse absolute inset-0 bg-radial-gradient from-amber-400/[0.08] to-transparent" style={{ background: "radial-gradient(circle at center 30%, rgba(251,191,36,0.08) 0%, transparent 60%)" }} />
        )}
        {/* Stage floor reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-500/[0.02] to-transparent" />
      </div>

      {/* Confetti burst */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.8;
            const duration = 2 + Math.random() * 2;
            const size = 6 + Math.random() * 8;
            const colors = ["#f97316", "#ef4444", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const rotation = Math.random() * 360;
            const drift = (Math.random() - 0.5) * 100;
            return (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${left}%`,
                  top: "-5%",
                  width: size,
                  height: size * (0.6 + Math.random() * 0.8),
                  backgroundColor: color,
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  transform: `rotate(${rotation}deg)`,
                  // @ts-expect-error -- CSS custom property for drift
                  "--drift": `${drift}px`,
                }}
              />
            );
          })}
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header — Gameshow title card (compact when playing, full hero on landing) */}
        {pageState !== "choose-source" ? (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/[0.06] via-red-500/[0.04] to-orange-500/[0.06] px-6 py-3 shadow-lg shadow-orange-500/10">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,146,60,0.3)]">
                  Roast the Elo 🔥
                </span>
              </h1>
              <span className="rounded-md bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                Beta
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Watch real games. Read the roasts. Guess the rating.
            </p>
            {/* Gameshow scoreboard */}
            {gamesPlayed > 0 && (
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="relative flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/[0.06] px-4 py-1.5 shadow-lg shadow-amber-500/10">
                  <span className="text-xs text-amber-300/70 uppercase tracking-wider font-bold">Score</span>
                  <span className="text-xl font-black text-amber-400 tabular-nums" style={{ textShadow: "0 0 12px rgba(251,191,36,0.5)" }}>
                    {score.toLocaleString()}
                  </span>
                  {lastScoreGain && (
                    <span className="absolute -top-4 right-2 text-xs font-black text-green-400 animate-bounce">
                      +{lastScoreGain}
                    </span>
                  )}
                </div>
                {streakCount >= 2 && (
                <div className="flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/[0.1] px-3 py-1.5 animate-pulse shadow-lg shadow-orange-500/20">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-bold text-orange-300">{streakCount} STREAK</span>
                </div>
              )}
            </div>
          )}
        </div>
        ) : null}

        {/* ── LANDING PAGE HERO (only on choose-source) ── */}
        {pageState === "choose-source" && !analyzing && (
          <div className="mx-auto max-w-3xl animate-fadeIn">
            {/* Hero section */}
            <div className="relative mb-10 text-center">
              {/* Background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[80px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(251,146,60,0.12) 0%, rgba(239,68,68,0.05) 40%, transparent 70%)" }} />

              <div className="relative">
                {/* Title */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <RoastAvatar mood="smug" size={56} />
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                      Roast the Elo
                    </span>
                  </h1>
                </div>

                {/* Tagline */}
                <p className="text-lg sm:text-xl text-slate-300 font-medium mb-2">
                  Can you guess a player&apos;s rating just by watching them play?
                </p>
                <p className="text-sm text-slate-500 max-w-lg mx-auto mb-8">
                  Watch real chess games move by move with hilarious roast commentary, then guess the Elo. 
                  Inspired by Gotham Chess &amp; r/AnarchyChess.
                </p>

                {/* How it works — 3 steps */}
                <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8 max-w-xl mx-auto">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                    <div className="text-2xl sm:text-3xl mb-2">👀</div>
                    <p className="text-xs sm:text-sm font-bold text-white mb-1">Watch</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">
                      See every move with savage Pepe commentary
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                    <div className="text-2xl sm:text-3xl mb-2">🤔</div>
                    <p className="text-xs sm:text-sm font-bold text-white mb-1">Guess</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">
                      Pick the Elo bracket — Beginner to Master
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                    <div className="text-2xl sm:text-3xl mb-2">🔥</div>
                    <p className="text-xs sm:text-sm font-bold text-white mb-1">Get Roasted</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">
                      See how close you were + share with friends
                    </p>
                  </div>
                </div>

                {/* Primary CTA — big "Play Now" button */}
                <button
                  type="button"
                  onClick={() => { setInputMode("random"); setIsDaily(false); fetchGame(); }}
                  className="group relative mx-auto rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-10 py-4 text-lg font-black text-white shadow-2xl shadow-orange-500/30 transition-all hover:brightness-110 hover:scale-[1.03] hover:shadow-orange-500/50 active:scale-95 uppercase tracking-wider cursor-pointer"
                >
                  <span className="relative z-10 flex items-center gap-2">🎲 Play Random Game</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-20 transition-opacity blur-xl" />
                </button>
              </div>
            </div>

            {/* Scoreboard when returning */}
            {gamesPlayed > 0 && (
              <div className="mb-8 flex items-center justify-center gap-4">
                <div className="relative flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/[0.06] px-4 py-1.5 shadow-lg shadow-amber-500/10">
                  <span className="text-xs text-amber-300/70 uppercase tracking-wider font-bold">Score</span>
                  <span className="text-xl font-black text-amber-400 tabular-nums" style={{ textShadow: "0 0 12px rgba(251,191,36,0.5)" }}>
                    {score.toLocaleString()}
                  </span>
                  {lastScoreGain && (
                    <span className="absolute -top-4 right-2 text-xs font-black text-green-400 animate-bounce">
                      +{lastScoreGain}
                    </span>
                  )}
                </div>
                {streakCount >= 2 && (
                  <div className="flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/[0.1] px-3 py-1.5 animate-pulse shadow-lg shadow-orange-500/20">
                    <span className="text-sm">🔥</span>
                    <span className="text-xs font-bold text-orange-300">{streakCount} STREAK</span>
                  </div>
                )}
              </div>
            )}

            {/* Weekly Leaderboard */}
            {leaderboardData.length > 0 && (
              <div className="mb-8 rounded-2xl border border-amber-500/15 bg-gradient-to-b from-amber-500/[0.04] to-transparent p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">🏆 Weekly Top Players</h3>
                  <a href="/roast/leaderboard" className="text-[10px] text-amber-400/50 hover:text-amber-400 transition-colors">View all →</a>
                </div>
                <div className="space-y-1.5">
                  {leaderboardData.slice(0, 5).map((entry, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/[0.03]">
                      <span className="text-sm w-5 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                      {entry.userImage ? (
                        <img src={entry.userImage} alt="" className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[8px] text-slate-500">?</div>
                      )}
                      <span className="text-xs text-slate-300 flex-1 truncate">{entry.userName ?? "Anonymous"}</span>
                      <span className="text-xs text-amber-400 font-bold tabular-nums">{entry.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* More ways to play */}
            <div className="mb-6">
              <p className="text-xs text-slate-600 uppercase tracking-widest font-bold text-center mb-4">Or choose your game</p>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {/* Daily Challenge */}
              <button
                type="button"
                onClick={() => {
                  if (dailyCompleted) return;
                  setInputMode("random");
                  setIsDaily(true);
                  fetchDailyGame();
                }}
                disabled={!!dailyCompleted}
                className={`group rounded-2xl border p-5 sm:p-6 text-center transition-all cursor-pointer relative overflow-hidden ${
                  dailyCompleted
                    ? "border-emerald-500/30 bg-emerald-500/[0.06] opacity-70"
                    : "border-amber-500/20 bg-amber-500/[0.04] hover:border-amber-500/40 hover:bg-amber-500/[0.08]"
                }`}
              >
                <span className="mb-2 sm:mb-3 flex justify-center text-2xl sm:text-3xl">{dailyCompleted ? (dailyCompleted.result === "correct" ? "🎯" : dailyCompleted.result === "close" ? "🔥" : "📅") : "📅"}</span>
                <p className={`text-xs sm:text-sm font-bold ${dailyCompleted ? "text-emerald-400" : "text-amber-400 group-hover:text-amber-300"}`}>
                  {dailyCompleted ? "Completed ✓" : "Daily Challenge"}
                </p>
                <p className="mt-1 text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                  {dailyCompleted ? `${dailyCompleted.guess} → ${dailyCompleted.elo} Elo` : "Same game for everyone today"}
                </p>
                {!dailyCompleted && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                )}
              </button>

              {/* Import from Lichess / Chess.com */}
              <button
                type="button"
                onClick={() => setInputMode("import")}
                className={`group rounded-2xl border p-5 sm:p-6 text-center transition-all cursor-pointer ${
                  inputMode === "import"
                    ? "border-blue-500/30 bg-blue-500/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-blue-500/20 hover:bg-blue-500/[0.04]"
                }`}
              >
                <span className="mb-2 sm:mb-3 flex justify-center text-2xl sm:text-3xl">📥</span>
                <p className="text-xs sm:text-sm font-bold text-blue-400 group-hover:text-blue-300">Import Games</p>
                <p className="mt-1 text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">From Lichess or Chess.com</p>
              </button>

              {/* Paste PGN */}
              <button
                type="button"
                onClick={() => setInputMode("paste")}
                className={`group rounded-2xl border p-5 sm:p-6 text-center transition-all cursor-pointer ${
                  inputMode === "paste"
                    ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/20 hover:bg-emerald-500/[0.04]"
                }`}
              >
                <span className="mb-2 sm:mb-3 flex justify-center text-2xl sm:text-3xl">📋</span>
                <p className="text-xs sm:text-sm font-bold text-emerald-400 group-hover:text-emerald-300">Paste PGN</p>
                <p className="mt-1 text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">Paste any PGN to roast</p>
              </button>
              </div>
            </div>

            {/* ── Import from Lichess / Chess.com panel ── */}
            {inputMode === "import" && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] p-5 animate-fadeIn space-y-4">
                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">📥 Load Recent Games</h3>

                <div className="flex gap-2">
                  <div className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 shrink-0">
                    <button type="button" onClick={() => { setLoadSource("lichess"); setRecentGames([]); setLoadError(""); }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${loadSource === "lichess" ? "bg-white/[0.1] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>
                      Lichess
                    </button>
                    <button type="button" onClick={() => { setLoadSource("chesscom"); setRecentGames([]); setLoadError(""); }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${loadSource === "chesscom" ? "bg-white/[0.1] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>
                      Chess.com
                    </button>
                  </div>
                  <input
                    type="text"
                    value={loadUsername}
                    onChange={(e) => setLoadUsername(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") fetchRecentGames(); }}
                    placeholder={loadSource === "lichess" ? "Lichess username" : "Chess.com username"}
                    className="flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/40"
                  />
                  <button type="button" onClick={fetchRecentGames} disabled={loadingGames}
                    className="shrink-0 rounded-xl bg-white/[0.06] px-4 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/[0.1] hover:text-white disabled:opacity-50 cursor-pointer transition-all">
                    {loadingGames ? "Loading..." : "Load"}
                  </button>
                </div>

                {loadError && <p className="text-xs text-red-400">{loadError}</p>}

                {recentGames.length > 0 && (
                  <div className="space-y-1.5 max-h-80 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/30 p-2">
                    {recentGames.map((game, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setRecentGames([]);
                          setInputMode(null);
                          processProvidedPgn(game.pgn, game.whiteElo, game.blackElo);
                        }}
                        className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-left transition-all hover:border-blue-500/20 hover:bg-blue-500/[0.04] cursor-pointer"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-300">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-300 group-hover:text-blue-300 truncate">
                            {game.white} vs {game.black}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {game.date} · {game.result}{game.event ? ` · ${game.event}` : ""}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${game.result === "1-0" ? "border-white/10 text-white" : game.result === "0-1" ? "border-slate-600 text-slate-400" : "border-slate-700 text-slate-500"}`}>
                          {game.result}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Paste PGN panel ── */}
            {inputMode === "paste" && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 animate-fadeIn space-y-4">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">📋 Paste Your PGN</h3>
                <textarea
                  value={pgnInput}
                  onChange={(e) => setPgnInput(e.target.value)}
                  placeholder={'[Event "Rated Blitz game"]\n[White "Player1"]\n[Black "Player2"]\n...\n\n1. e4 e5 2. Nf3 Nc6 ...'}
                  rows={8}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/40 font-mono resize-y"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!pgnInput.trim()) return;
                    setInputMode(null);
                    processProvidedPgn(pgnInput.trim());
                  }}
                  disabled={!pgnInput.trim()}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Roast This Game 🔥
                </button>
              </div>
            )}

            {/* Beta feedback CTA */}
            <div className="mt-10 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-slate-400">
                🔥 Roast the Elo is in <span className="font-semibold text-orange-300">Beta</span> — if you caught a bug or something feels off,{" "}
                <a href="/feedback" className="font-medium text-orange-400 underline decoration-orange-400/30 underline-offset-2 transition-colors hover:text-orange-300">
                  please leave feedback
                </a>.
              </p>
            </div>
          </div>
        )}

        {/* ── Loading / Analyzing ── */}
        {(pageState === "loading" || analyzing) && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            {challengeId && (
              <div className="rounded-full border border-orange-500/30 bg-orange-500/[0.08] px-5 py-1.5 mb-2">
                <p className="text-xs font-bold text-orange-300 uppercase tracking-wider">⚔️ Challenge Mode</p>
              </div>
            )}
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

        {/* ── Intro screen — Gameshow Stage Reveal ── */}
        {pageState === "intro" && game && !analyzing && (
          <div className="flex flex-col items-center gap-6 py-12 animate-fadeIn">
            <div className="relative rounded-3xl border-2 border-orange-500/30 bg-gradient-to-b from-red-950/20 via-zinc-900/95 to-zinc-950 p-8 text-center max-w-lg overflow-hidden shadow-2xl shadow-orange-500/10">
              {/* Stage curtain top */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-800/60 via-red-600/40 to-red-800/60" />
              {/* Stage light accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-orange-400/[0.08] rounded-full blur-[50px] pointer-events-none" />
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-orange-400/30 rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-orange-400/30 rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-orange-400/30 rounded-bl-3xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-orange-400/30 rounded-br-3xl" />
              <div className="relative">
                {challengeId && (
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1">
                    <span className="text-xs">⚔️</span>
                    <span className="text-[10px] font-bold text-orange-300 uppercase tracking-wider">Friend&apos;s Challenge</span>
                  </div>
                )}
                <p className="text-xs uppercase tracking-[0.25em] text-orange-400/60 font-bold mb-3">🎬 Coming Up</p>
                <p className="text-xl font-bold text-orange-300 mb-5">&ldquo;{introLine}&rdquo;</p>
                <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                    <p className="text-base mb-0.5">📋</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Opening</p>
                    <p className="text-white font-medium text-[11px] mt-0.5">{game.opening.length > 20 ? game.opening.slice(0, 20) + "…" : game.opening}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                    <p className="text-base mb-0.5">🕐</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Moves</p>
                    <p className="text-white font-bold mt-0.5">{moves.length}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                    <p className="text-base mb-0.5">🏁</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Result</p>
                    <p className="text-slate-500 font-mono mt-0.5">???</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={startWatching}
              className="group relative rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 px-12 py-5 text-lg font-black text-white shadow-2xl shadow-orange-500/30 transition-all hover:brightness-110 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/40 active:scale-95 uppercase tracking-wider border border-orange-400/20"
            >
              <span className="relative z-10">🍿 Start the Show</span>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-20 transition-opacity blur-xl" />
              {/* Pulse ring */}
              <div className="absolute -inset-1 rounded-2xl border border-orange-500/30 animate-pulse" />
            </button>
          </div>
        )}

        {/* ── Main game view (watching / guessing / revealed) ── */}
        {(pageState === "watching" || pageState === "guessing" || pageState === "revealed") && (
          <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-[1fr_360px]">
            {/* Board column */}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              {/* LIVE ON AIR indicator */}
              {pageState === "watching" && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/[0.1] px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Live</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">Round {gamesPlayed + 1}</span>
                </div>
              )}
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
                {currentMove && pageState === "revealed" && (
                  <span className={`text-xs font-bold ${classColor(currentMove.classification)}`}>
                    {classIcon(currentMove.classification)} {currentMove.classification}
                  </span>
                )}
              </div>

              <div ref={boardRef} className="w-full max-w-[640px]">
                <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/40 relative">
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
                    customArrows={activeArrows.map(([from, to, color]) => [from as CbSquare, to as CbSquare, color] as [CbSquare, CbSquare, string])}
                  />
                  {/* Emoji marker overlay */}
                  {activeMarkers.length > 0 && boardSize > 0 && (
                    <div className="absolute inset-0 pointer-events-none" style={{ width: boardSize, height: boardSize }}>
                      {activeMarkers.map((m, i) => {
                        const sqSize = boardSize / 8;
                        const fileI = m.square.charCodeAt(0) - 97; // a=0 .. h=7
                        const rankI = parseInt(m.square[1]) - 1;   // 1=0 .. 8=7
                        const x = orientation === "white" ? fileI * sqSize : (7 - fileI) * sqSize;
                        const y = orientation === "white" ? (7 - rankI) * sqSize : rankI * sqSize;
                        return (
                          <span
                            key={`${m.square}-${i}`}
                            className="absolute select-none drop-shadow-lg"
                            style={{
                              left: x + sqSize * 0.58,
                              top: y - sqSize * 0.08,
                              fontSize: sqSize * 0.38,
                              lineHeight: 1,
                            }}
                          >
                            {m.emoji}
                          </span>
                        );
                      })}
                    </div>
                  )}
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

              {/* Commentary text below board (shown on all sizes) */}
              {activeComment && (pageState === "watching" || pageState === "guessing") && (
                <div className="w-full max-w-[640px] animate-fadeIn">
                  <div className="rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-2">
                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed text-center">
                      {typewriterText}
                      {!typingDone && <span className="animate-blink text-orange-400">|</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Audience Reaction Meter */}
              {(pageState === "watching" || pageState === "guessing") && (
                <div className="w-full max-w-[640px]">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold whitespace-nowrap">
                      👥 Crowd
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${audienceMeter}%`,
                          background: audienceMeter > 70
                            ? "linear-gradient(90deg, #22c55e, #4ade80)"
                            : audienceMeter > 40
                            ? "linear-gradient(90deg, #eab308, #facc15)"
                            : "linear-gradient(90deg, #ef4444, #f87171)",
                          boxShadow: audienceMeter > 70
                            ? "0 0 8px rgba(34,197,94,0.4)"
                            : audienceMeter < 30
                            ? "0 0 8px rgba(239,68,68,0.4)"
                            : "none",
                        }}
                      />
                    </div>
                    <span className="text-[10px] w-8 text-right tabular-nums" style={{
                      color: audienceMeter > 70 ? "#4ade80" : audienceMeter > 40 ? "#facc15" : "#f87171",
                    }}>
                      {audienceMeter > 70 ? "😍" : audienceMeter > 40 ? "😐" : audienceMeter > 20 ? "😬" : "💀"}
                    </span>
                  </div>
                </div>
              )}

              {/* Playback controls */}
              {(pageState === "watching" || pageState === "guessing" || pageState === "revealed") && (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                  <button
                    onClick={() => goToMove(Math.max(-1, currentIdx - 1))}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-400 hover:bg-white/[0.06] transition-colors"
                  >
                    ◀ Prev
                  </button>
                  {pageState === "watching" && (
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
                  )}
                  <button
                    onClick={() => {
                      setAutoplay(false);
                      goToMove(Math.min(moves.length - 1, currentIdx + 1));
                    }}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-400 hover:bg-white/[0.06] transition-colors"
                  >
                    Next ▶
                  </button>
                  {/* Flip board */}
                  <button
                    onClick={() => setOrientation(o => o === "white" ? "black" : "white")}
                    title="Flip board"
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-sm text-slate-400 hover:bg-white/[0.06] transition-colors"
                  >
                    🔄
                  </button>
                  {pageState === "watching" && (
                    <>
                      <select
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-400 cursor-pointer"
                      >
                        <option value={4000}>🐌 Slow</option>
                        <option value={2400}>🚶 Normal</option>
                        <option value={1400}>🏃 Fast</option>
                        <option value={700}>⚡ Blitz</option>
                      </select>
                      <button
                        onClick={isRewatching ? () => {
                          setPageState("choose-source");
                          setInputMode(null);
                          setLoadError("");
                          setRecentGames([]);
                          setPgnInput("");
                          setIsDaily(false);
                          setChallengeId(null);
                          setScoreSaved(false);
                        } : skipToGuess}
                        className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        {isRewatching ? "Next Round 🔥" : "Skip to Guess →"}
                      </button>
                    </>
                  )}
                  {pageState === "revealed" && !revealModalOpen && (
                    <button
                      onClick={() => setRevealModalOpen(true)}
                      className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      📊 Show Results
                    </button>
                  )}
                </div>
              )}

              {/* Move progress bar */}
              {(pageState === "watching" || pageState === "guessing" || pageState === "revealed") && moves.length > 0 && (
                <div className="w-full max-w-[640px]">
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
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* ── Live Roast: Avatar + Speech Bubble (hidden on mobile, shown under board instead) ── */}
              <div className="hidden lg:block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3 flex items-center gap-1.5">
                  🎙️ Live Roast
                  {tts.supported && (
                    <button
                      onClick={tts.toggle}
                      title={tts.enabled ? `TTS on (${tts.voiceName})` : "Enable text-to-speech"}
                      className={`ml-auto rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all ${
                        tts.enabled
                          ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                          : "border-white/10 bg-white/[0.03] text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {tts.enabled ? "🔊 TTS" : "🔇 TTS"}
                    </button>
                  )}
                </h3>

                {/* Avatar + Speech Bubble */}
                <div className="flex items-start gap-3 mb-4 min-h-[100px]">
                  <div className="relative flex-shrink-0">
                    <RoastAvatar mood={currentMood} size={68} />
                    {currentMood === "clown" && (
                      <span className="absolute -top-2 -right-2 text-[10px] font-bold text-red-400 animate-bounce select-none pointer-events-none"
                        style={{ textShadow: "0 0 6px rgba(239,68,68,0.5)" }}>
                        honk honk
                      </span>
                    )}
                  </div>
                  <div className="relative flex-1 min-w-0">
                    {activeComment ? (
                      <>
                        {/* Triangle tail */}
                        <div className="absolute -left-2 top-5 w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-orange-500/20" />
                        {/* Bubble */}
                        <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.06] px-4 py-3 animate-fadeIn">
                          <p className="text-sm text-slate-200 leading-relaxed">
                            {typewriterText}
                            {!typingDone && <span className="animate-blink text-orange-400">|</span>}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-[80px] text-xs text-slate-600 italic">
                        {pageState === "watching" ? "Watching the game... 👀" : "Ready for roast 🔥"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Commentary History (compact) */}
                <div className="border-t border-white/[0.04] pt-3">
                  <h4 className="text-[10px] uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1">
                    📜 Commentary Log
                  </h4>
                  <div
                    ref={commentBoxRef}
                    className="h-[140px] lg:h-[180px] overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
                  >
                    {commentHistory.length === 0 && pageState === "watching" && (
                      <p className="text-[11px] text-slate-700 italic">No comments yet…</p>
                    )}
                    {commentHistory.map((c, i) => (
                      <div
                        key={i}
                        className="text-xs text-slate-500 pl-2 border-l-2 border-white/[0.06] py-0.5 animate-fadeIn"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Move list (compact) */}
              {(pageState === "watching" || pageState === "guessing" || pageState === "revealed") && (
                <div className="hidden lg:block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
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
                          } ${pageState === "revealed" ? (m.classification === "blunder" ? "text-red-400" : m.classification === "mistake" ? "text-orange-400" : "") : ""}`}
                        >
                          {m.color === "w" ? `${m.moveNumber}. ` : ""}{m.san}{" "}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Guess + Reveal moved to centered modals — sidebar only has commentary + moves ── */}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/*  CENTERED MODAL: Mid-Game Decision                              */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeDecision && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-[90vw] max-w-lg rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-2xl shadow-amber-500/20 overflow-hidden">
              {/* Spotlight glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-60 bg-amber-400/[0.06] rounded-full blur-[80px] pointer-events-none" />
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-amber-400/50 rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-amber-400/50 rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-amber-400/50 rounded-bl-3xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-amber-400/50 rounded-br-3xl" />

              <div className="relative">
                {/* Header */}
                <div className="text-center mb-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/60 font-bold mb-2">🎪 Gameshow Moment</p>
                  <h3 className="text-lg sm:text-xl font-black text-white leading-snug">{activeDecision.question}</h3>
                  <p className="text-[11px] text-slate-500 mt-2">Move {currentMove?.moveNumber ?? "?"} · {Math.round((currentIdx / moves.length) * 100)}% through the game</p>
                </div>

                {/* Options */}
                <div className="space-y-2.5 mb-4">
                  {activeDecision.options.map((opt, idx) => {
                    const answered = decisionAnswer !== null;
                    const isCorrect = idx === activeDecision.correctIdx;
                    const isSelected = decisionAnswer === idx;
                    const noCorrectAnswer = activeDecision.correctIdx === -1;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (answered) return;
                          setDecisionAnswer(idx);
                          if (isCorrect && !noCorrectAnswer) {
                            playSound("correct");
                            setScore(prev => prev + 100);
                            setQuizScore(prev => prev + 100);
                            setLastScoreGain(100);
                            setTimeout(() => setLastScoreGain(null), 1500);
                          } else if (noCorrectAnswer) {
                            playSound("correct");
                          } else {
                            playSound("wrong");
                          }
                        }}
                        disabled={answered}
                        className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-sm font-bold transition-all cursor-pointer group ${
                          answered
                            ? isCorrect && !noCorrectAnswer
                              ? "border-green-400/60 bg-green-500/15 scale-[1.02]"
                              : isSelected && !noCorrectAnswer
                              ? "border-red-400/60 bg-red-500/15"
                              : isSelected && noCorrectAnswer
                              ? "border-amber-400/60 bg-amber-500/15 scale-[1.02]"
                              : "border-white/[0.04] bg-white/[0.01] opacity-40"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-amber-500/40 hover:bg-amber-500/[0.06] hover:scale-[1.01] active:scale-[0.98]"
                        }`}
                      >
                        <span className={`text-lg transition-transform ${!answered ? "group-hover:scale-125" : ""}`}>{opt.emoji}</span>
                        <span className={answered && isSelected ? (isCorrect || noCorrectAnswer ? "text-green-300" : "text-red-300") : answered && isCorrect && !noCorrectAnswer ? "text-green-300" : "text-white"}>
                          {opt.label}
                        </span>
                        {answered && isCorrect && !noCorrectAnswer && <span className="ml-auto text-green-400">✓ +100</span>}
                        {answered && isSelected && !isCorrect && !noCorrectAnswer && <span className="ml-auto text-red-400">✗</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation + Continue (shown after answer) */}
                {decisionAnswer !== null && (
                  <div className="animate-fadeIn space-y-3">
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
                      <p className="text-xs sm:text-sm text-amber-200 leading-relaxed">{activeDecision.explanation}</p>
                    </div>
                    <button
                      onClick={() => {
                        setDecisionShown(prev => new Set([...prev, activeDecision.moveIdx]));
                        setActiveDecision(null);
                        setDecisionAnswer(null);
                        setAutoplay(true);
                      }}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 hover:scale-[1.02] active:scale-95 uppercase tracking-wider"
                    >
                      Continue Watching ▶
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/*  CENTERED MODAL: Guess the Elo (non-closable)                   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {pageState === "guessing" && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-[92vw] max-w-lg rounded-3xl border-2 border-orange-500/40 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-2xl shadow-orange-500/20 overflow-hidden">
              {/* Stage spotlight glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-400/[0.08] rounded-full blur-[80px] pointer-events-none" />
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-orange-400/50 rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-orange-400/50 rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-orange-400/50 rounded-bl-3xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-orange-400/50 rounded-br-3xl" />

              <div className="relative">
                {/* Pepe avatar positioned center-top */}
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    <RoastAvatar mood={currentMood} size={56} />
                  </div>
                </div>

                <div className="text-center mb-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-orange-400/60 font-bold mb-1">🎬 Final Answer</p>
                  <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-300 uppercase tracking-wider" style={{ textShadow: "0 0 20px rgba(251,146,60,0.3)" }}>
                    🎯 Lock It In!
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1.5">What&apos;s the average Elo of these players?</p>
                </div>

                <div className="space-y-2">
                  {ELO_BRACKETS.map((bracket, idx) => {
                    const isSelected = selectedBracket === idx;
                    const isLocked = selectedBracket !== null;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleGuess(idx)}
                        disabled={isLocked}
                        className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all cursor-pointer group ${
                          isSelected
                            ? "border-orange-400 bg-orange-500/20 scale-[1.02] shadow-lg shadow-orange-500/20"
                            : isLocked
                            ? "border-white/[0.04] bg-white/[0.01] opacity-30"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-orange-500/40 hover:bg-orange-500/[0.08] hover:scale-[1.01] active:scale-[0.98]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={`text-lg transition-transform ${!isLocked ? "group-hover:scale-125" : ""}`}>{bracket.emoji}</span>
                          <span className={isSelected ? "text-orange-300" : "text-white"}>{bracket.label}</span>
                        </span>
                        <span className={`text-xs font-mono ${isSelected ? "text-orange-400" : "text-slate-500"}`}>{bracket.range}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Lock-in animation */}
                {lockedIn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 animate-fadeIn rounded-3xl">
                    <div className="text-center">
                      <p className="text-3xl font-black text-orange-400 animate-bounce" style={{ textShadow: "0 0 20px rgba(251,146,60,0.5)" }}>
                        LOCKED IN! 🔒
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/*  CENTERED MODAL: Reveal (closable, with Next Round)              */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {pageState === "revealed" && game && revealModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto py-8" onClick={() => setRevealModalOpen(false)}>
            <div className="relative w-[92vw] max-w-lg rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-2xl shadow-amber-500/20 overflow-hidden my-auto" onClick={e => e.stopPropagation()}>
              {/* Close button */}
              <button
                onClick={() => setRevealModalOpen(false)}
                className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-zinc-800/80 border border-white/10 text-slate-400 text-sm flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-colors"
                title="Close (view board)"
              >
                ✕
              </button>
              {/* Spotlight glow behind elo */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-400/[0.1] rounded-full blur-[80px] pointer-events-none" />
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-amber-400/50 rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-amber-400/50 rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-amber-400/50 rounded-bl-3xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-amber-400/50 rounded-br-3xl" />

              <div className="relative space-y-4">
                {/* Animated Elo Counter */}
                <div className="text-center">
                  <p className="text-xs text-amber-400/60 uppercase tracking-[0.2em] font-bold mb-1">The Rating Is...</p>
                  <p className="text-5xl sm:text-7xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-200" style={{ textShadow: "0 0 40px rgba(251,191,36,0.3)" }}>
                    {revealCounterElo ?? game.avgElo}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    White: {game.whiteElo} · Black: {game.blackElo}
                  </p>
                </div>

                {/* Result badge */}
                {selectedBracket !== null && (() => {
                  const dist = Math.abs(selectedBracket - getEloBracketIdx(game.avgElo));
                  const badge = dist === 0 ? { text: "PERFECT", color: "from-green-400 to-emerald-400", border: "border-green-500/40", bg: "bg-green-500/10", glow: "shadow-green-500/30" }
                    : dist === 1 ? { text: "CLOSE", color: "from-amber-300 to-yellow-300", border: "border-amber-500/40", bg: "bg-amber-500/10", glow: "shadow-amber-500/30" }
                    : { text: "MISS", color: "from-red-400 to-orange-400", border: "border-red-500/40", bg: "bg-red-500/10", glow: "shadow-red-500/30" };
                  return (
                    <div className={`mx-auto w-fit rounded-full border-2 ${badge.border} ${badge.bg} px-6 py-1.5 shadow-lg ${badge.glow}`}>
                      <span className={`text-base font-black uppercase tracking-wider bg-gradient-to-r ${badge.color} bg-clip-text text-transparent`}>
                        {badge.text} {dist === 0 ? "🎯" : dist === 1 ? "🔥" : "💀"}
                      </span>
                    </div>
                  );
                })()}

                <p className="text-sm text-amber-300 text-center font-medium">{revealLine}</p>
                <p className="text-xs text-slate-400 text-center italic">{eloFlavor}</p>

                {/* Guess reaction commentary */}
                {guessReaction && (
                  <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.04] px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 mt-0.5">
                        <RoastAvatar mood={currentMood} size={36} />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{guessReaction}</p>
                    </div>
                  </div>
                )}

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

                {/* Inline Leaderboard */}
                {leaderboardData.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-3 space-y-2">
                    <p className="text-xs text-amber-400/70 uppercase tracking-wider font-bold text-center">🏆 Weekly Leaderboard</p>
                    <div className="space-y-1">
                      {leaderboardData.slice(0, 5).map((entry, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={`w-5 text-center font-bold ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-slate-500"}`}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                          </span>
                          {entry.userImage && (
                            <img src={entry.userImage} alt="" className="w-4 h-4 rounded-full" />
                          )}
                          <span className="text-slate-300 flex-1 truncate">{entry.userName ?? "Anonymous"}</span>
                          <span className="text-amber-400 font-bold tabular-nums">{entry.score.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-center">
                      <a href="/roast/leaderboard" className="text-[10px] text-amber-400/50 hover:text-amber-400 transition-colors">
                        View full leaderboard →
                      </a>
                    </div>
                  </div>
                )}

                {/* Your Score */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Your Score</span>
                    <span className="text-lg font-black text-amber-400 tabular-nums">{score.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500">Games: {gamesPlayed} · Streak: {streakCount} · Quiz: {quizScore}</span>
                  </div>
                </div>

                {/* Result + Opening + Lichess link */}
                <div className="text-center text-xs text-slate-500 space-y-0.5">
                  <p>🏁 {game.result}{game.termination ? ` — ${game.termination}` : ""}</p>
                  <p>📋 {game.opening}</p>
                  <a
                    href={`https://lichess.org/${game.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-slate-500 hover:text-slate-300 transition-colors mt-1"
                  >
                    View on Lichess ↗
                  </a>
                </div>

                {/* Share & Actions */}
                <div className="space-y-2">
                  {/* Share row */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Twitter / X share */}
                    <a
                      href={(() => {
                        const bracket = selectedBracket !== null ? ELO_BRACKETS[selectedBracket] : null;
                        const actualBracket = ELO_BRACKETS[getEloBracketIdx(game.avgElo)];
                        const diff = selectedBracket !== null ? Math.abs(selectedBracket - getEloBracketIdx(game.avgElo)) : 99;
                        const emoji = diff === 0 ? "🎯" : diff === 1 ? "🔥" : "💀";
                        const tweet = `${emoji} Roast the Elo — I guessed ${bracket?.label ?? "?"} and the real Elo was ${game.avgElo}!\n\n💀 ${blunders} blunders · ❌ ${mistakes} mistakes\n\n🐸 Can you do better?`;
                        const url = game.id ? `https://firechess.app/roast?game=${game.id}` : "https://firechess.app/roast";
                        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-300 transition-all flex items-center justify-center gap-1.5"
                    >
                      𝕏 Post
                    </a>
                    {/* Share (native on mobile, clipboard fallback) */}
                    <button
                      onClick={async () => {
                        const bracket = selectedBracket !== null ? ELO_BRACKETS[selectedBracket] : null;
                        const actualBracket = ELO_BRACKETS[getEloBracketIdx(game.avgElo)];
                        const diff = selectedBracket !== null ? Math.abs(selectedBracket - getEloBracketIdx(game.avgElo)) : 99;
                        const emoji = diff === 0 ? "🎯" : diff === 1 ? "🔥" : "💀";
                        const text = [
                          `${emoji} Roast the Elo — I guessed ${bracket?.label ?? "?"} and the actual Elo was ${game.avgElo} (${actualBracket.label})`,
                          `💀 ${blunders} blunders · ❌ ${mistakes} mistakes · ⚠️ ${inaccuracies} inaccuracies`,
                          `🐸 Try it yourself:`,
                        ].join("\n");
                        const url = game.id ? `https://firechess.app/roast?game=${game.id}` : "https://firechess.app/roast";
                        // Use native share on mobile, clipboard fallback on desktop
                        if (typeof navigator.share === "function") {
                          try {
                            await navigator.share({ title: "Roast the Elo", text, url });
                            return;
                          } catch { /* user cancelled or not supported */ }
                        }
                        navigator.clipboard.writeText(text + "\n" + url).then(() => {
                          setShareText("Copied!");
                          setTimeout(() => setShareText(null), 2000);
                        }).catch(() => {
                          setShareText("Copy failed");
                          setTimeout(() => setShareText(null), 2000);
                        });
                      }}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition-all flex items-center justify-center gap-1.5"
                    >
                      {shareText ?? "📤 Share"}
                    </button>
                  </div>
                  {/* Challenge + Download row */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Challenge a Friend */}
                    {game.id && (
                      <button
                        onClick={() => {
                          const url = `https://firechess.app/roast?game=${game.id}`;
                          navigator.clipboard.writeText(url).then(() => {
                            setShareText("Link copied!");
                            setTimeout(() => setShareText(null), 2000);
                          });
                        }}
                        className="rounded-xl border border-orange-500/20 bg-orange-500/[0.06] px-3 py-2.5 text-xs font-medium text-orange-300 hover:bg-orange-500/[0.12] hover:border-orange-500/30 transition-all flex items-center justify-center gap-1.5"
                      >
                        🔗 Challenge a Friend
                      </button>
                    )}
                    {/* Download share card */}
                    <button
                      onClick={() => {
                        const diff = selectedBracket !== null ? Math.abs(selectedBracket - getEloBracketIdx(game.avgElo)) : 99;
                        const result = diff === 0 ? "PERFECT" : diff === 1 ? "CLOSE" : "MISS";
                        const params = new URLSearchParams({
                          elo: String(game.avgElo),
                          guess: selectedBracket !== null ? ELO_BRACKETS[selectedBracket].label : "?",
                          result,
                          blunders: String(blunders),
                          mistakes: String(mistakes),
                          inaccuracies: String(inaccuracies),
                          score: String(score),
                          games: String(gamesPlayed),
                          streak: String(streakCount),
                        });
                        const url = `/api/roast/share-card?${params.toString()}`;
                        // Open in new tab so user can save/share the image
                        window.open(url, "_blank");
                      }}
                      className={`rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-3 py-2.5 text-xs font-medium text-purple-300 hover:bg-purple-500/[0.12] hover:border-purple-500/30 transition-all flex items-center justify-center gap-1.5 ${!game.id ? "col-span-2" : ""}`}
                    >
                      🖼️ Share Card
                    </button>
                  </div>
                  {/* Rewatch */}
                  <button
                    onClick={() => {
                      setPageState("watching");
                      setCurrentIdx(-1);
                      setFen("start");
                      setLastMove(null);
                      setCommentHistory([]);
                      setActiveComment(null);
                      setAutoplay(true);
                      setIsRewatching(true);
                      setSelectedBracket(null);
                      setDecisionShown(new Set());
                      setPendingDecisionIdx(null);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-slate-400 hover:bg-white/[0.08] transition-all"
                  >
                    🔁 Rewatch
                  </button>
                </div>

                {/* ── Save Score CTA ── */}
                {!sessionLoading && !authenticated && score > 0 && (
                  <Link
                    href="/auth/signin"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-3 text-sm font-bold text-amber-300 shadow-lg shadow-amber-500/10 transition-all hover:border-amber-500/50 hover:brightness-110"
                  >
                    <span className="text-lg">🏆</span>
                    <span>Sign in to save your score &amp; hit the leaderboard</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                )}
                {!sessionLoading && authenticated && score > 0 && (
                  <button
                    disabled={savingScore || scoreSaved}
                    onClick={async () => {
                      setSavingScore(true);
                      try {
                        const res = await fetch("/api/roast/scores", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ score, gamesPlayed, streakCount, quizScore }),
                        });
                        if (res.ok) setScoreSaved(true);
                      } catch { /* ignore */ } finally {
                        setSavingScore(false);
                      }
                    }}
                    className={`group flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                      scoreSaved
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : "border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-300 shadow-lg shadow-amber-500/10 hover:border-amber-500/50 hover:brightness-110"
                    }`}
                  >
                    {savingScore ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" /><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                        Saving…
                      </>
                    ) : scoreSaved ? (
                      <>✅ Score saved to leaderboard!</>
                    ) : (
                      <>
                        <span className="text-lg">🏆</span>
                        <span>Save Score to Leaderboard</span>
                      </>
                    )}
                  </button>
                )}

                {/* Leaderboard link */}
                {scoreSaved && (
                  <Link
                    href="/roast/leaderboard"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition-all"
                  >
                    📊 View Leaderboard
                  </Link>
                )}

                <button
                  onClick={() => {
                    setPageState("choose-source");
                    setInputMode(null);
                    setLoadError("");
                    setRecentGames([]);
                    setPgnInput("");
                    setIsDaily(false);
                    setChallengeId(null);
                    setScoreSaved(false);
                  }}
                  className="group relative w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-base font-black text-white shadow-xl shadow-orange-500/25 transition-all hover:brightness-110 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/40 active:scale-95 uppercase tracking-wider"
                >
                  <span className="relative z-10">🔥 Next Round</span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-20 transition-opacity blur-xl" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer — Gameshow credits style */}
        <div className="mt-12 text-center text-xs text-slate-600 border-t border-white/[0.04] pt-6">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-700 mb-2">A Production Of</p>
          <p>Games sourced from the <a href="https://lichess.org" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400 underline decoration-dotted">Lichess</a> database. Analysis by Stockfish.</p>
          <p className="mt-1">Inspired by Gotham Chess &amp; r/AnarchyChess. No GMs were harmed in the making of this show.</p>
        </div>
      </div>

      {/* ── Mobile Clippy: Floating avatar + speech bubble (visible below lg breakpoint) ── */}
      {(pageState === "watching" || pageState === "guessing" || pageState === "revealed") && (
        <div className="fixed bottom-4 right-4 z-50 lg:hidden flex flex-col items-end gap-2">
          {/* Speech bubble (expanded) */}
          {mobileClippyOpen && activeComment && (
            <div className="animate-fadeIn max-w-[280px] sm:max-w-[340px]">
              <div className="relative rounded-2xl border border-orange-500/30 bg-zinc-900/95 backdrop-blur-md px-4 py-3 shadow-2xl shadow-black/50">
                {/* Close button */}
                <button
                  onClick={() => setMobileClippyOpen(false)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-zinc-800 border border-white/10 text-slate-400 text-xs flex items-center justify-center hover:bg-zinc-700 transition-colors"
                >
                  ✕
                </button>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {typewriterText}
                  {!typingDone && <span className="animate-blink text-orange-400">|</span>}
                </p>
                {/* Triangle tail pointing to avatar */}
                <div className="absolute -bottom-2 right-6 w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] border-t-orange-500/30" />
              </div>
            </div>
          )}
          {/* Avatar button */}
          <button
            onClick={() => setMobileClippyOpen(prev => !prev)}
            className="relative flex-shrink-0 rounded-full bg-zinc-900/90 backdrop-blur-md border-2 border-orange-500/30 p-1.5 shadow-xl shadow-black/40 transition-all active:scale-90 hover:border-orange-500/50"
          >
            <RoastAvatar mood={currentMood} size={52} />
            {activeComment && !mobileClippyOpen && (
              <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-orange-500 border-2 border-zinc-900 animate-pulse" />
            )}
            {currentMood === "clown" && (
              <span className="absolute -top-3 -right-1 text-[10px] font-bold text-red-400 animate-bounce select-none pointer-events-none"
                style={{ textShadow: "0 0 6px rgba(239,68,68,0.5)" }}>
                honk
              </span>
            )}
          </button>
        </div>
      )}

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
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 0.8s step-end infinite;
        }
        /* Confetti particles */
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
          25% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) translateX(var(--drift, 0px)); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall 3s ease-out forwards;
        }
        /* Spotlight sweep */
        @keyframes spotlight-sweep {
          0%, 100% { transform: translateX(-200%) rotate(-5deg); opacity: 0.5; }
          50% { transform: translateX(200%) rotate(5deg); opacity: 1; }
        }
        .animate-spotlight {
          animation: spotlight-sweep 12s ease-in-out infinite;
        }
        /* Spotlight pulse on reveal */
        @keyframes spotlight-pulse {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        .animate-spotlight-pulse {
          animation: spotlight-pulse 2s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
