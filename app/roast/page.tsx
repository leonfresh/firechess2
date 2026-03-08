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

import { useBoardTheme, useShowCoordinates, useCustomPieces } from "@/lib/use-coins";
import { playSound, preloadSounds, preloadRoastSounds } from "@/lib/sounds";
import { stockfishPool } from "@/lib/stockfish-client";
import { fetchExplorerMoves } from "@/lib/lichess-explorer";
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
  getGameIntro,
  GAME_SUMMARY_LINES,
  REVEAL_CORRECT,
  REVEAL_TOO_HIGH,
  REVEAL_TOO_LOW,
  type AnalyzedMove,
  type MoveClassification,
  type GameSummary,
  type MoveAnnotation,
} from "@/lib/roast-commentary";
import { RoastAvatar, type RoastMood, MOOD_IMAGES, ANIMATED_MOODS } from "@/components/roast-avatar";
import { useTTS } from "@/lib/use-tts";
import { useSession } from "@/components/session-provider";
import Link from "next/link";

/* ================================================================== */
/*  Ghost reaction emoji mapping                                        */
/* ================================================================== */

/** Reaction options shown in the picker during daily challenges */
const REACTION_OPTIONS: { key: string; label: string; image?: string }[] = [
  { key: "lmao",      label: "LMAO",       image: "/pepe-emojis/animated/690612-pepe-lmao.gif" },
  { key: "shocked",   label: "Shocked",    image: "/pepe-emojis/monkaS.png" },
  { key: "clapping",  label: "Clapping",   image: "/pepe-emojis/animated/80293-pepeclap.gif" },
  { key: "rage",      label: "Rage",       image: "/pepe-emojis/4178-pepe-rage.png" },
  { key: "gamercry",  label: "Crying",     image: "/pepe-emojis/animated/411644-gamer-pepe-cry.gif" },
  { key: "cantwatch", label: "Can't Watch", image: "/pepe-emojis/animated/pepe-with-hands-covering-ears.gif" },
  { key: "bigeyes",   label: "Big Eyes",   image: "/pepe-emojis/animated/28654-bigeyes.gif" },
  { key: "💀",        label: "Skull" },
  { key: "🔥",        label: "Fire" },
  { key: "🤡",        label: "Clown" },
];

/** Map ghost reaction emoji keys to image paths for floating display */
const GHOST_EMOJI_IMAGES: Record<string, string> = {
  lmao:      "/pepe-emojis/animated/690612-pepe-lmao.gif",
  shocked:   "/pepe-emojis/monkaS.png",
  clapping:  "/pepe-emojis/animated/80293-pepeclap.gif",
  rage:      "/pepe-emojis/4178-pepe-rage.png",
  gamercry:  "/pepe-emojis/animated/411644-gamer-pepe-cry.gif",
  cantwatch: "/pepe-emojis/animated/pepe-with-hands-covering-ears.gif",
  bigeyes:   "/pepe-emojis/animated/28654-bigeyes.gif",
  clown:     "/pepe-emojis/4825_PepeClown.png",
  crylaugh:  "/pepe-emojis/2982-pepecry.png",
  hyped:     "/pepe-emojis/animated/88627-pepehype.gif",
  firesgun:  "/pepe-emojis/animated/815161-pepe-fires-gun.gif",
  madpuke:   "/pepe-emojis/animated/84899-pepe-madpuke.gif",
  nope:      "/pepe-emojis/animated/41292-pepe-nopes.gif",
  toxic:     "/pepe-emojis/animated/972934-pepe-with-toxic-sign.gif",
  loving:    "/pepe-emojis/animated/98260-pepe-loving.gif",
};

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
  source?: "lichess" | "chess.com";
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
  /** Best continuation line as SAN moves (for tactic replay), e.g. ["Nxf7+", "Kxf7", "Qxd8"] */
  tacticLine?: string[];
}

type PageState = "choose-source" | "loading" | "intro" | "watching" | "guessing" | "revealed";

/* ================================================================== */
/*  Piece values (for sacrifice detection)                              */
/* ================================================================== */

const _PIECE_VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
function _pieceVal(p: string | undefined | null): number { return _PIECE_VAL[p ?? ""] ?? 0; }

/** Convert a UCI PV line into SAN moves (best-effort, returns as many as parse successfully) */
function uciPvToSan(fen: string, uciMoves: string[]): string[] {
  const result: string[] = [];
  const sim = new Chess(fen);
  for (const uci of uciMoves) {
    try {
      const m = sim.move({ from: uci.slice(0, 2) as any, to: uci.slice(2, 4) as any, promotion: (uci.slice(4, 5) || undefined) as any });
      if (!m) break;
      result.push(m.san);
    } catch { break; }
  }
  return result;
}

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

/** Fetch JSON with an AbortController timeout covering headers + body */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJsonWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch text with an AbortController timeout covering headers + body */
async function fetchTextWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch a random game from Chess.com as fallback */
async function fetchChessComRandomGame(): Promise<{
  id: string;
  pgn: string;
  whitePlayer: string;
  blackPlayer: string;
  whiteElo: number;
  blackElo: number;
} | null> {
  try {
    // Use titled players for a good elo range (FM ~2200-2400, CM ~2000-2200, NM ~2000-2300)
    const titles = ["FM", "CM", "NM"];
    const title = titles[Math.floor(Math.random() * titles.length)];

    const listData = await fetchJsonWithTimeout(
      `https://api.chess.com/pub/titled/${title}`,
      {},
      6000
    );
    const players: string[] = listData.players ?? [];
    if (players.length === 0) return null;

    // Shuffle and try up to 5 random players
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(5, shuffled.length); i++) {
      try {
        const username = shuffled[i].toLowerCase();

        // Get game archives
        const archData = await fetchJsonWithTimeout(
          `https://api.chess.com/pub/player/${username}/games/archives`,
          {},
          5000
        );
        const archives: string[] = archData.archives ?? [];
        if (archives.length === 0) continue;

        // Get latest month's games
        const latestUrl = archives[archives.length - 1];
        const gamesData = await fetchJsonWithTimeout(latestUrl, {}, 5000);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const games = (gamesData.games ?? []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (g: any) =>
            g.pgn &&
            g.rules === "chess" &&
            g.rated &&
            g.white?.rating &&
            g.black?.rating &&
            g.time_class &&
            ["blitz", "rapid"].includes(g.time_class)
        );
        if (games.length === 0) continue;

        const picked = games[Math.floor(Math.random() * games.length)];
        const gameUrl: string = picked.url ?? "";
        const urlParts = gameUrl.split("/");
        const gameId = urlParts[urlParts.length - 1] || `cc-${Date.now()}`;

        return {
          id: gameId,
          pgn: picked.pgn,
          whitePlayer: picked.white.username ?? "White",
          blackPlayer: picked.black.username ?? "Black",
          whiteElo: picked.white.rating,
          blackElo: picked.black.rating,
        };
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/* ================================================================== */
/*  Main component                                                      */
/* ================================================================== */

export default function RoastPage() {
  /* ── Board rendering ── */
  const [boardSize, setBoardSize] = useState(0);
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  /* ── Board visual FX state ── */
  const [screenShake, setScreenShake] = useState<"mild" | "heavy" | "slam" | null>(null);
  const [boardFlash, setBoardFlash] = useState<"red" | "gold" | null>(null);
  const [eliminationText, setEliminationText] = useState<string | null>(null);
  const [pieceRain, setPieceRain] = useState<{ piece: string; id: number }[]>([]);
  const [streakFire, setStreakFire] = useState(false);
  const [boardCrack, setBoardCrack] = useState(false);
  const pieceRainId = useRef(0);

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

  /* ── Streamer Mode (OBS-friendly) ── */
  const [streamerMode, setStreamerMode] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("streamer") === "1") setStreamerMode(true);
  }, []);

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
  const [dailyPlayerCount, setDailyPlayerCount] = useState<number | null>(null);

  /* ── Ghost reactions state (daily challenge social layer) ── */
  const [ghostReactions, setGhostReactions] = useState<Record<number, { emoji: string; displayName: string | null }[]>>({});
  const [activeGhosts, setActiveGhosts] = useState<{ emoji: string; displayName: string | null; id: number; x: number; y: number }[]>([]);
  const ghostIdRef = useRef(0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [reactionConfirm, setReactionConfirm] = useState<string | null>(null); // flash confirmation
  const dailyDateRef = useRef<string>("");

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

    // Fetch daily player count for welcome screen
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/roast/daily-reactions?date=${today}`)
      .then(r => r.json())
      .then(data => { if (typeof data.playerCount === "number") setDailyPlayerCount(data.playerCount); })
      .catch(() => {});
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

  /* ── Tactic Replay state ── */
  const [tacticReplaying, setTacticReplaying] = useState(false);
  const [tacticReplayStep, setTacticReplayStep] = useState(0);
  const tacticReplayRef = useRef<{ savedFen: string; savedLastMove: { from: string; to: string } | null; savedAutoplay: boolean } | null>(null);
  const tacticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // Keep usedLines across games for session-level dedup (trim to last 200 to avoid unbounded growth)
    if (usedLines.current.size > 200) {
      const arr = [...usedLines.current];
      usedLines.current = new Set(arr.slice(-200));
    }
    setActiveComment(null);
    setCurrentMood("neutral");
    setScore(0);
    setQuizScore(0);
    setLastScoreGain(null);
    setScoreSaved(false);
    // Reset visual FX
    setScreenShake(null);
    setBoardFlash(null);
    setEliminationText(null);
    setPieceRain([]);
    setStreakFire(false);
    setBoardCrack(false);
    // Reset ghost reactions
    setGhostReactions({});
    setActiveGhosts([]);
    setMyReaction(null);
    setReactionPickerOpen(false);
    dailyDateRef.current = "";

    try {
      let gameId: string | null = null;
      let whitePlayer = "White";
      let blackPlayer = "Black";
      let whiteElo = 1500;
      let blackElo = 1500;
      let pgn = "";
      let source: "lichess" | "chess.com" = "lichess";

      // ── Try Lichess first (with timeouts) ──
      try {
        // Step 1: Get puzzle batch from Lichess
        const puzzleData = await fetchJsonWithTimeout(
          "https://lichess.org/api/puzzle/batch/next?nb=50",
          { headers: { Accept: "application/json" } },
          6000
        );
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
              const text = await fetchTextWithTimeout(
                `https://lichess.org/api/games/user/${player.id}?max=20&rated=true&perfType=blitz,rapid&opening=true`,
                { headers: { Accept: "application/x-ndjson" } },
                8000
              );
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

        if (!gameId) throw new Error("No Lichess games found");

        // Step 2: Export the full PGN
        pgn = await fetchTextWithTimeout(
          `https://lichess.org/game/export/${gameId}?evals=false&clocks=true&opening=true`,
          { headers: { Accept: "application/x-chess-pgn" } },
          6000
        );
        source = "lichess";
      } catch (lichessErr) {
        console.warn("Lichess fetch failed, trying Chess.com fallback:", lichessErr);

        // ── Chess.com fallback ──
        const ccGame = await fetchChessComRandomGame();
        if (!ccGame) throw new Error("Both Lichess and Chess.com failed");

        gameId = ccGame.id;
        whitePlayer = ccGame.whitePlayer;
        blackPlayer = ccGame.blackPlayer;
        whiteElo = ccGame.whiteElo;
        blackElo = ccGame.blackElo;
        pgn = ccGame.pgn;
        source = "chess.com";
      }

      // Parse opening/result from PGN
      const openingMatch = pgn.match(/\[Opening "(.+?)"\]/);
      const resultMatch = pgn.match(/\[Result "(.+?)"\]/);
      const terminationMatch = pgn.match(/\[Termination "(.+?)"\]/);
      const result = resultMatch?.[1] ?? "*";

      const data: GameData = {
        id: gameId!,
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
        source,
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

      // Limit to first 200 half-moves (100 full moves) to keep it reasonable
      const maxMoves = Math.min(sans.length, 200);

      for (let i = 0; i < maxMoves; i++) {
        const fenBefore = chess.fen();

        // Evaluate position before the move
        let cpBefore = 0;
        try {
          const evalBefore = await stockfishPool.evaluateFen(fenBefore, 12);
          cpBefore = evalBefore?.cp ?? 0;
        } catch {}

        // Get the best move from this position (up to 6 plies for tactic replay)
        let bestMoveSan: string | null = null;
        let bestMoveUci: string | null = null;
        let pvUciMoves: string[] = [];
        try {
          const pv = await stockfishPool.getPrincipalVariation(fenBefore, 6, 12);
          if (pv?.pvMoves?.[0]) {
            bestMoveUci = pv.pvMoves[0];
            pvUciMoves = pv.pvMoves;
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
        const _hungThresh = moveResult.piece === "p" ? 350 : 200; // pawns need higher cpLoss — weak pawns aren't "hung"
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
          isEnPassant: moveResult.flags.includes("e"),
          pieceType: moveResult.piece,
          capturedPiece: moveResult.captured ?? undefined,
          hungPiece: cpLoss > _hungThresh && !moveResult.captured,
          hungWhat: cpLoss > _hungThresh && !moveResult.captured ? moveResult.piece : undefined,
          sacrificedMaterial: !!moveResult.captured && cpLoss > 150 && (_pieceVal(moveResult.piece) - _pieceVal(moveResult.captured)) >= 3,
          wasBookMove: i < 10 && cpLoss < 10,
          mateInN: null,
          missedMateInN: null,
          walkedIntoFork: false,
          walkedIntoPin: false,
          evalSwing: cpLoss,
          isResignationWorthy: cpAfter > 500 && cpBefore > -200,
          timeSpent: clocks[i] ?? null,
        };

        // Enrich opening moves with Lichess explorer data (win rate & game count)
        if (moveNumber <= 15) {
          try {
            const sideToMove = moveResult.color === "w" ? "white" as const : "black" as const;
            const explorer = await fetchExplorerMoves(fenBefore, sideToMove);
            const dbMove = explorer.moves.find(
              (m) => m.san === moveResult.san || m.uci === analyzedMove.uci
            );
            if (dbMove && dbMove.totalGames >= 50) {
              analyzedMove.dbWinRate = dbMove.winRate;
              analyzedMove.dbGames = dbMove.totalGames;
            }
          } catch { /* explorer unavailable — proceed without DB data */ }
        }

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

        // Build tactic line for blunders/mistakes where there was a forcing best move
        const isTacticWorthy = cpLoss >= 100 && bestMoveSan && pvUciMoves.length >= 2
          && (bestMoveSan.includes("+") || bestMoveSan.includes("x") || bestMoveSan.includes("#"));
        const tacticLine = isTacticWorthy ? uciPvToSan(fenBefore, pvUciMoves) : undefined;

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
          tacticLine,
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
          from: "",
          to: "",
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

      // Inject personalized player intro as the first synthetic move (plays with TTS in-game)
      const playerIntro = getGameIntro(whitePlayer, blackPlayer);
      const firstFen = analyzed.length > 0 ? analyzed[0].fenBefore : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      analyzed.unshift({
        san: "",
        fen: firstFen,
        fenBefore: firstFen,
        from: "",
        to: "",
        color: "w",
        moveNumber: 0,
        cp: 0,
        cpLoss: 0,
        bestMoveSan: null,
        classification: "good",
        comment: playerIntro,
        piece: "p",
        isCapture: false,
        isCheck: false,
      });

      setMoves(analyzed);
      setBlunders(totalBlunders);
      setMistakes(totalMistakes);
      setInaccuracies(totalInaccuracies);
      setAnalyzing(false);

      // Intro screen — personalized line with name banter when possible
      const intro = getGameIntro(whitePlayer, blackPlayer);
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
    // Keep usedLines across games for session-level dedup (trim to last 200 to avoid unbounded growth)
    if (usedLines.current.size > 200) {
      const arr = [...usedLines.current];
      usedLines.current = new Set(arr.slice(-200));
    }
    setActiveComment(null);
    setCurrentMood("neutral");
    setScore(0);
    setQuizScore(0);
    setLastScoreGain(null);
    setScoreSaved(false);
    // Reset visual FX
    setScreenShake(null);
    setBoardFlash(null);
    setEliminationText(null);
    setPieceRain([]);
    setStreakFire(false);
    setBoardCrack(false);
    // Reset ghost reactions
    setGhostReactions({});
    setActiveGhosts([]);
    setMyReaction(null);
    setReactionPickerOpen(false);
    dailyDateRef.current = "";

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

      const maxMoves = Math.min(sans.length, 200);

      for (let i = 0; i < maxMoves; i++) {
        const fenBefore = chess.fen();
        let cpBefore = 0;
        try { const evalBefore = await stockfishPool.evaluateFen(fenBefore, 12); cpBefore = evalBefore?.cp ?? 0; } catch {}

        let bestMoveSan: string | null = null;
        let bestMoveUci: string | null = null;
        let pvUciMoves: string[] = [];
        try {
          const pv = await stockfishPool.getPrincipalVariation(fenBefore, 6, 12);
          if (pv?.pvMoves?.[0]) {
            bestMoveUci = pv.pvMoves[0];
            pvUciMoves = pv.pvMoves;
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
        const _hungThresh2 = moveResult.piece === "p" ? 350 : 200; // pawns need higher cpLoss — weak pawns aren't "hung"
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
          isEnPassant: moveResult.flags.includes("e"),
          pieceType: moveResult.piece,
          capturedPiece: moveResult.captured ?? undefined,
          hungPiece: cpLoss > _hungThresh2 && !moveResult.captured,
          hungWhat: cpLoss > _hungThresh2 && !moveResult.captured ? moveResult.piece : undefined,
          sacrificedMaterial: !!moveResult.captured && cpLoss > 150 && (_pieceVal(moveResult.piece) - _pieceVal(moveResult.captured)) >= 3,
          wasBookMove: i < 10 && cpLoss < 10,
          mateInN: null,
          missedMateInN: null,
          walkedIntoFork: false,
          walkedIntoPin: false,
          evalSwing: cpLoss,
          isResignationWorthy: cpAfter > 500 && cpBefore > -200,
          timeSpent: clocks[i] ?? null,
        };

        // Enrich opening moves with Lichess explorer data (win rate & game count)
        if (moveNumber <= 15) {
          try {
            const sideToMove = moveResult.color === "w" ? "white" as const : "black" as const;
            const explorer = await fetchExplorerMoves(fenBefore, sideToMove);
            const dbMove = explorer.moves.find(
              (m) => m.san === moveResult.san || m.uci === analyzedMove.uci
            );
            if (dbMove && dbMove.totalGames >= 50) {
              analyzedMove.dbWinRate = dbMove.winRate;
              analyzedMove.dbGames = dbMove.totalGames;
            }
          } catch { /* explorer unavailable — proceed without DB data */ }
        }

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

        // Build tactic line for blunders/mistakes where there was a forcing best move
        const isTacticWorthy = cpLoss >= 100 && bestMoveSan && pvUciMoves.length >= 2
          && (bestMoveSan.includes("+") || bestMoveSan.includes("x") || bestMoveSan.includes("#"));
        const tacticLine = isTacticWorthy ? uciPvToSan(fenBefore, pvUciMoves) : undefined;

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
          tacticLine,
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
          from: "",
          to: "",
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

      // Inject personalized player intro as the first synthetic move (plays with TTS in-game)
      const playerIntro = getGameIntro(whitePlayer, blackPlayer);
      const firstFen = analyzed.length > 0 ? analyzed[0].fenBefore : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      analyzed.unshift({
        san: "",
        fen: firstFen,
        fenBefore: firstFen,
        from: "",
        to: "",
        color: "w",
        moveNumber: 0,
        cp: 0,
        cpLoss: 0,
        bestMoveSan: null,
        classification: "good",
        comment: playerIntro,
        piece: "p",
        isCapture: false,
        isCheck: false,
      });

      setMoves(analyzed);
      setBlunders(totalBlunders);
      setMistakes(totalMistakes);
      setInaccuracies(totalInaccuracies);
      setAnalyzing(false);

      // Intro screen — personalized line with name banter when possible
      const intro = getGameIntro(whitePlayer, blackPlayer);
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

      // Fetch ghost reactions from other players for this daily
      dailyDateRef.current = today;
      try {
        const reactRes = await fetch(`/api/roast/daily-reactions?date=${today}`);
        if (reactRes.ok) {
          const data = await reactRes.json();
          setGhostReactions(data.reactions ?? {});
        }
      } catch { /* ghost reactions are optional */ }
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
    if (tacticReplaying) return; // wait for tactic replay animation to finish
    if (activeDecision) return; // wait for decision to be dismissed
    if (pendingDecisionIdx !== null) return; // wait for pending quiz to resolve before advancing
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
      // Delay before elo guess — if TTS just finished, short pause is enough;
      // otherwise scale with comment length so the user can read it.
      const closingDelay = (tts.enabled && activeComment)
        ? 1800  // TTS already read it out — short beat before guess
        : activeComment ? Math.max(4000, activeComment.length * 30) : 2000;
      const t = setTimeout(() => {
        setActiveComment(null);
        playSound("drumroll");
        setPageState("guessing");
      }, closingDelay);
      return () => clearTimeout(t);
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
        setLastMove(move.san ? { from: move.from, to: move.to } : null);

        // Only play piece-move sounds for real moves (not synthetic intro/closing)
        if (move.san) {
          if (move.isCheck) playSound("check");
          else if (move.isCapture) playSound("capture");
          else playSound("move");
        }

        // Gameshow sound effects + viral meme sounds + VISUAL FX based on move classification
        if (move.comment) {
          const cls = move.classification;
          const isHungPiece = move.cpLoss > 200 && !move.isCapture;
          setTimeout(() => {
            if (cls === "blunder") {
              if (isHungPiece) {
                playSound("mario-death");
              } else if (move.cpLoss > 500) {
                // Ultra-hilarious moment — massive blunder
                const r2 = Math.random();
                if (r2 < 0.3) playSound("ohnono-laugh");
                else if (r2 < 0.65) playSound("emotional-damage");
                else playSound("bruh");
              } else {
                const r = Math.random();
                if (r < 0.35) playSound("vine-boom");
                else if (r < 0.6) playSound("roblox-oof");
                else playSound("crowd-ooh");
              }

              // ── VISUAL FX: Blunder effects ──
              if (move.cpLoss > 500 || isHungPiece) {
                // Catastrophic — BOARD SLAM + CRACK + ELIMINATION TEXT
                setScreenShake("slam");
                setBoardFlash("red");
                setBoardCrack(true);
                const hungPieceName = move.piece === "q" ? "♛" : move.piece === "r" ? "♜" : move.piece === "b" ? "♝" : move.piece === "n" ? "♞" : "♟";
                setEliminationText(isHungPiece ? `${hungPieceName} ELIMINATED` : "ELIMINATED");
                // Piece rain for hung pieces
                if (isHungPiece) {
                  const newPieces = Array.from({ length: 8 }, () => {
                    pieceRainId.current++;
                    return { piece: hungPieceName, id: pieceRainId.current };
                  });
                  setPieceRain(prev => [...prev, ...newPieces]);
                  setTimeout(() => setPieceRain(prev => prev.filter(p => !newPieces.find(n => n.id === p.id))), 3000);
                }
                setTimeout(() => { setScreenShake(null); setBoardFlash(null); }, 600);
                setTimeout(() => setBoardCrack(false), 2000);
                setTimeout(() => setEliminationText(null), 2200);
              } else if (move.cpLoss > 200) {
                // Bad blunder — HEAVY SHAKE + RED FLASH
                setScreenShake("heavy");
                setBoardFlash("red");
                setTimeout(() => { setScreenShake(null); setBoardFlash(null); }, 500);
              } else {
                // Normal blunder — MILD SHAKE
                setScreenShake("mild");
                setTimeout(() => setScreenShake(null), 400);
              }
            } else if (cls === "brilliant") {
              playSound(Math.random() < 0.5 ? "airhorn" : "applause-short");
              // ── VISUAL FX: Brilliant — GOLD FLASH + CONFETTI
              setBoardFlash("gold");
              setShowConfetti(true);
              setTimeout(() => setBoardFlash(null), 800);
              setTimeout(() => setShowConfetti(false), 3000);
            } else if (cls === "best" || cls === "great") {
              playSound("bell");
            } else if (cls === "mistake") {
              const r = Math.random();
              if (r < 0.3) playSound("bro-serious");
              else if (r < 0.55) playSound("cute-laugh");
              else playSound("honk");
              // ── VISUAL FX: Mistake — MILD SHAKE
              setScreenShake("mild");
              setTimeout(() => setScreenShake(null), 350);
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

        // ── VISUAL FX: Streak fire border ──
        if (streak >= 3) { setStreakFire(true); } else { setStreakFire(false); }

        // ── Ghost reactions: show other players' reactions at this move ──
        if (isDaily && ghostReactions[next] && ghostReactions[next].length > 0) {
          const moveGhosts = ghostReactions[next];
          // Stagger ghost appearances over 1.5s
          moveGhosts.forEach((g, i) => {
            setTimeout(() => {
              ghostIdRef.current++;
              const ghost = {
                emoji: g.emoji,
                displayName: g.displayName,
                id: ghostIdRef.current,
                x: 0, // unused (horizontal is CSS-driven)
                y: 5 + Math.random() * 80, // random vertical lane (% of board)
              };
              setActiveGhosts(prev => [...prev, ghost]);
              // Remove after marquee scroll
              setTimeout(() => {
                setActiveGhosts(prev => prev.filter(ag => ag.id !== ghost.id));
              }, 5500);
            }, i * 300); // stagger by 300ms each
          });
        }
        // Reset current user's reaction for new move
        setMyReaction(null);

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
  }, [pageState, autoplay, currentIdx, moves, speed, typingDone, activeComment, tts.enabled, tts.speaking, ttsDoneSignal, activeDecision, pendingDecisionIdx, tacticReplaying]);

  /* ── Tactic Replay — animate through the engine's best continuation ── */
  const startTacticReplay = useCallback(() => {
    const move = currentIdx >= 0 && currentIdx < moves.length ? moves[currentIdx] : null;
    if (!move?.tacticLine || move.tacticLine.length < 2 || tacticReplaying) return;

    // Save current state
    tacticReplayRef.current = {
      savedFen: fen,
      savedLastMove: lastMove,
      savedAutoplay: autoplay,
    };
    setAutoplay(false);
    setTacticReplaying(true);
    setTacticReplayStep(0);
    setActiveArrows([]);
    setActiveMarkers([]);

    // Start from the position BEFORE the player's move (fenBefore)
    setFen(move.fenBefore);
    setLastMove(null);

    // Animate through the tactic line
    const line = move.tacticLine;
    let step = 0;
    const sim = new Chess(move.fenBefore);

    const playNextStep = () => {
      if (step >= line.length) {
        // Hold final position for 1.5s then revert
        tacticTimerRef.current = setTimeout(() => {
          if (tacticReplayRef.current) {
            setFen(tacticReplayRef.current.savedFen);
            setLastMove(tacticReplayRef.current.savedLastMove);
            setAutoplay(tacticReplayRef.current.savedAutoplay);
          }
          setTacticReplaying(false);
          setTacticReplayStep(0);
          tacticReplayRef.current = null;
        }, 1500);
        return;
      }

      const san = line[step];
      try {
        const m = sim.move(san);
        if (m) {
          setFen(sim.fen());
          setLastMove({ from: m.from, to: m.to });
          setTacticReplayStep(step + 1);

          // Play appropriate sound
          if (san.includes("+") || san.includes("#")) playSound("check");
          else if (san.includes("x")) playSound("capture");
          else playSound("move");
        }
      } catch { /* skip */ }

      step++;
      tacticTimerRef.current = setTimeout(playNextStep, 800);
    };

    // Small delay before first move
    tacticTimerRef.current = setTimeout(playNextStep, 400);
  }, [currentIdx, moves, fen, lastMove, autoplay, tacticReplaying]);

  // Cleanup tactic replay timer on unmount
  useEffect(() => {
    return () => {
      if (tacticTimerRef.current) clearTimeout(tacticTimerRef.current);
    };
  }, []);

  /* ── Deferred decision popup — waits for TTS + typewriter to finish + reading time ── */
  const decisionReadyTime = useRef<number | null>(null);
  const ttsStartedForDecision = useRef(false);
  const [decisionTick, setDecisionTick] = useState(0); // force re-render for deferred decision timing
  useEffect(() => {
    if (pendingDecisionIdx === null || pageState !== "watching") {
      decisionReadyTime.current = null;
      ttsStartedForDecision.current = false;
      return;
    }
    if (!typingDone) { decisionReadyTime.current = null; ttsStartedForDecision.current = false; return; } // wait for text to finish typing

    // If TTS is enabled, we need to wait for it to START speaking first, then FINISH
    if (tts.enabled) {
      if (tts.speaking) {
        // TTS is actively speaking — mark that it started, reset timer, keep waiting
        ttsStartedForDecision.current = true;
        decisionReadyTime.current = null;
        return;
      }
      // TTS is not speaking — but has it started yet for this comment?
      if (!ttsStartedForDecision.current) {
        // TTS hasn't started speaking yet — wait for it to begin
        // Use a real counter to force re-render instead of setPendingDecisionIdx(prev => prev) which is a no-op
        const waitTimer = setTimeout(() => {
          setDecisionTick(t => t + 1);
        }, 250);
        return () => clearTimeout(waitTimer);
      }
      // TTS started and finished — fall through to reading delay
    }

    // Mark when text/TTS finished, then add a reading delay
    if (decisionReadyTime.current === null) {
      decisionReadyTime.current = Date.now();
    }
    const elapsed = Date.now() - decisionReadyTime.current;
    // Scale reading delay with the comment length — longer text needs more time
    const commentLen = moves[pendingDecisionIdx]?.comment?.length ?? 0;
    const readingDelay = tts.enabled
      ? Math.max(2000, commentLen * 12)    // TTS already read it, just need post-TTS buffer
      : Math.max(4000, commentLen * 32);   // reading only — scale with length
    if (elapsed < readingDelay) {
      const timer = setTimeout(() => {
        // Force a re-render to re-check this effect with real state change
        setDecisionTick(t => t + 1);
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

    // Q10: Best move streak prediction — only ask when there's real runway and meaningful target
    if (bestMovesSoFar >= 5 && pctDone >= 0.3 && pctDone < 0.65) {
      const targetExtra = Math.max(5, Math.ceil(bestMovesSoFar * 0.5));
      const target = bestMovesSoFar + targetExtra;
      questionPool.push(() => {
        const totalBest = moves.filter(m => m.classification === "best" || m.classification === "brilliant").length;
        return {
          moveIdx: next,
          question: `🎯 ${bestMovesSoFar} best/brilliant moves so far. Will they break ${target}?`,
          options: [
            { label: "Yes — surprise accuracy incoming", emoji: "🎯" },
            { label: "No — they've peaked", emoji: "📉" },
          ],
          correctIdx: totalBest > target ? 0 : 1,
          explanation: totalBest > target
            ? `${totalBest} total! They actually showed up today 🎯`
            : `Only ${totalBest} total. They indeed peaked early 📉`,
        };
      });
    }

    // ── PREDICT THE MOVE ── critical moment predictions with funny options ──

    // Joke / meme wrong-answer pool
    const jokePool = [
      { label: "Botez Gambit the queen 👑💀", emoji: "♕" },
      { label: "Resign immediately", emoji: "🏳️" },
      { label: "Offer a draw and pray 🤝", emoji: "🤝" },
      { label: "Disconnect and blame lag", emoji: "📡" },
      { label: "Push a random pawn", emoji: "🐾" },
      { label: "Sacrifice the rook for vibes", emoji: "♜" },
      { label: "Premove something random", emoji: "🏃" },
      { label: "Throw in a spite check", emoji: "♔" },
      { label: "Stare at the board and flag", emoji: "⏰" },
      { label: "Rage castle into danger", emoji: "🏰" },
      { label: "Hang a piece for content", emoji: "🎬" },
      { label: "Play the worst move possible", emoji: "🤡" },
    ];
    const pickJokes = (exclude: string[], count: number) => {
      const filtered = jokePool.filter(j => !exclude.some(e => j.label.includes(e)));
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };
    const shuffleWithCorrect = (opts: { label: string; emoji: string }[], correctLabel: string) => {
      const shuffled = [...opts].sort(() => Math.random() - 0.5);
      return { options: shuffled, correctIdx: shuffled.findIndex(o => o.label === correctLabel) };
    };

    // P1: Predict the blunder — ask what player will do, they pick the blunder (or the engine move, or a joke)
    if (nextMove && (nextMove.classification === "blunder" || nextMove.classification === "mistake") &&
        nextMove.bestMoveSan && nextMove.san !== nextMove.bestMoveSan) {
      questionPool.push(() => {
        const side = nextMove.color === "w" ? "White" : "Black";
        const jokes = pickJokes([nextMove.san, nextMove.bestMoveSan ?? ""], 1);
        const rawOpts = [
          { label: `Play ${nextMove.san}`, emoji: "♟️" },
          { label: `Play ${nextMove.bestMoveSan} (engine's pick)`, emoji: "🤖" },
          ...jokes,
        ];
        const { options, correctIdx } = shuffleWithCorrect(rawOpts, `Play ${nextMove.san}`);
        return {
          moveIdx: next,
          question: `🔮 What will ${side} play here?`,
          options,
          correctIdx,
          explanation: nextMove.classification === "blunder"
            ? `They played ${nextMove.san}... a BLUNDER! The engine wanted ${nextMove.bestMoveSan}. Classic. 💀`
            : `They played ${nextMove.san} — a mistake. ${nextMove.bestMoveSan} was better 🫠`,
        };
      });
      // Push twice so predictions appear more often than trivia
      questionPool.push(questionPool[questionPool.length - 1]);
    }

    // P2: Predict a brilliant/best move — players rarely guess right, extra hype when they do
    if (nextMove && (nextMove.classification === "brilliant" || nextMove.classification === "best") &&
        nextMove.san && movesLeft >= 4) {
      questionPool.push(() => {
        const side = nextMove.color === "w" ? "White" : "Black";
        // Build decoy moves — pick a legal-but-wrong move from the actual position
        let decoy: string | null = null;
        try {
          const posChess = new Chess(nextMove.fenBefore);
          const legalMoves = posChess.moves().filter(m => m !== nextMove.san);
          if (legalMoves.length > 0) {
            decoy = legalMoves[Math.floor(Math.random() * legalMoves.length)];
          }
        } catch { /* fallback to jokes only */ }
        const jokes = pickJokes([nextMove.san, decoy ?? ""], decoy ? 1 : 2);
        const rawOpts = [
          { label: `Play ${nextMove.san}`, emoji: "🧠" },
          ...(decoy ? [{ label: `Play ${decoy}`, emoji: "🤔" }] : []),
          ...jokes,
        ];
        const { options, correctIdx } = shuffleWithCorrect(rawOpts, `Play ${nextMove.san}`);
        return {
          moveIdx: next,
          question: `🎯 Critical moment — what will ${side} find?`,
          options,
          correctIdx,
          explanation: nextMove.classification === "brilliant"
            ? `BRILLIANT! They found ${nextMove.san}! Even the engine is impressed 🧠✨`
            : `They found the best move: ${nextMove.san}! Maybe there's hope after all 🎯`,
        };
      });
    }

    // P3: Predict a sacrifice / big trade (next move is a capture with piece value loss but intentional)
    if (nextMove && nextMove.isCapture && nextMove.piece &&
        (nextMove.classification === "good" || nextMove.classification === "best" || nextMove.classification === "brilliant") &&
        (nextMove.piece === "q" || nextMove.piece === "r" || nextMove.piece === "n" || nextMove.piece === "b")) {
      questionPool.push(() => {
        const side = nextMove.color === "w" ? "White" : "Black";
        const pieceNames: Record<string, string> = { q: "Queen", r: "Rook", n: "Knight", b: "Bishop", p: "Pawn", k: "King" };
        const pieceName = pieceNames[nextMove.piece ?? "p"] ?? "piece";
        const jokes = pickJokes([nextMove.san], 1);
        const rawOpts = [
          { label: `${pieceName} takes — ${nextMove.san}`, emoji: "⚔️" },
          { label: "They'll play it safe, no captures", emoji: "🛡️" },
          ...jokes,
        ];
        const { options, correctIdx } = shuffleWithCorrect(rawOpts, `${pieceName} takes — ${nextMove.san}`);
        return {
          moveIdx: next,
          question: `⚔️ ${side} has a capture here. Will they go for it?`,
          options,
          correctIdx,
          explanation: `They went for ${nextMove.san}! ${
            nextMove.classification === "brilliant" ? "And it was BRILLIANT! 🧠✨" :
            nextMove.classification === "best" ? "And it was the best move! 🎯" :
            "Acceptable violence ⚔️"
          }`,
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
      // Announce quiz with a hype intro line, then the question
      const quizIntros = [
        "Aaaand it's QUIZ TIME! 🎯🔔",
        "STOP EVERYTHING — it's quiz o'clock! 🕐🔥",
        "Hold up, hold up, HOLD UP — time for a question! 🎤",
        "The board can wait. YOUR BRAIN can't. Quiz time! 🧠⚡",
        "Pop quiz, hotshot. Let's see what you've got 🎯",
        "Alright chat, time to prove you actually watch chess 📺🤔",
        "BZZZT! 🔔 Quiz incoming — no Googling, no engine, just vibes 🗿",
        "Quick! Before the next move drops — QUIZ TIME 🎰",
        "The game pauses. The quiz begins. There is no escape 🫡",
        "Time to separate the chess players from the chess watchers 👀🎯",
        "We interrupt this blunderfest for a quick brain check 🧠💀",
        "And NOW, the moment you didn't ask for — it's QUIZ TIME! 🎪",
        "Okay okay okay — let's test that chess IQ real quick 🤓🔥",
        "Drop everything. Quiz mode activated. This is not a drill 🚨",
        "Before we continue this masterclass in suffering — a question 📋",
      ];
      const intro = quizIntros[Math.floor(Math.random() * quizIntros.length)];
      const fullComment = `${intro}\n\n${decision.question}`;
      setActiveComment(fullComment);
      setCommentHistory(prev => [...prev, fullComment]);
      setMobileClippyOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDecisionIdx, typingDone, tts.enabled, tts.speaking, pageState, decisionTick]);

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
      setLastMove(m.san ? { from: m.from, to: m.to } : null);
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
      setLastMove(last.san ? { from: last.from, to: last.to } : null);
      setCurrentIdx(moves.length - 1);
      const comments = moves.map(m => m.comment).filter(Boolean) as string[];
      setCommentHistory(comments);
    }
    setAutoplay(false);
    setPageState("guessing");
  }, [moves]);

  /* ── Quiz auto-continue countdown ── */
  const [quizCountdown, setQuizCountdown] = useState<number | null>(null);
  const quizTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start 5s countdown when a quiz answer is selected and explanation TTS finishes
  useEffect(() => {
    if (decisionAnswer === null || !activeDecision) {
      setQuizCountdown(null);
      if (quizTimerRef.current) { clearInterval(quizTimerRef.current); quizTimerRef.current = null; }
      return;
    }
    // Wait for TTS explanation to finish before starting countdown
    if (tts.enabled && tts.speaking) return;
    // Start countdown
    setQuizCountdown(5);
    quizTimerRef.current = setInterval(() => {
      setQuizCountdown(prev => {
        if (prev === null || prev <= 1) {
          // Auto-continue
          if (quizTimerRef.current) { clearInterval(quizTimerRef.current); quizTimerRef.current = null; }
          setDecisionShown(prevSet => new Set([...prevSet, activeDecision.moveIdx]));
          setActiveDecision(null);
          setDecisionAnswer(null);
          setAutoplay(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (quizTimerRef.current) { clearInterval(quizTimerRef.current); quizTimerRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionAnswer, activeDecision, tts.enabled, tts.speaking]);

  /* ── Keyboard navigation (arrow keys, space, F, quiz 1-2-3) ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Quiz keyboard shortcuts 1-2-3-4
      const quizVisible = activeDecision && typingDone && (decisionAnswer !== null || !tts.enabled || !tts.speaking);
      if (activeDecision && decisionAnswer === null && quizVisible) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= activeDecision.options.length) {
          e.preventDefault();
          const idx = num - 1;
          const isCorrect = idx === activeDecision.correctIdx;
          const noCorrectAnswer = activeDecision.correctIdx === -1;
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
          if (tts.enabled && activeDecision.explanation) {
            setTimeout(() => tts.speak(activeDecision.explanation), 600);
          }
          return;
        }
      }
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
      // Ctrl+Shift+S toggles streamer mode
      if (e.key === "S" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setStreamerMode(p => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pageState, currentIdx, moves.length, goToMove, activeDecision, decisionAnswer, typingDone, tts]);

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

  /* ── Ambient glow color based on current game state ── */
  const ambientGlow = (() => {
    if (!currentMove || pageState === "choose-source") return { color: "251, 146, 60", intensity: 0.04 }; // warm orange idle
    switch (currentMove.classification) {
      case "brilliant": return { color: "168, 85, 247", intensity: 0.08 }; // purple
      case "best": case "great": return { color: "34, 197, 94", intensity: 0.06 }; // green
      case "good": return { color: "59, 130, 246", intensity: 0.04 }; // blue
      case "inaccuracy": return { color: "234, 179, 8", intensity: 0.05 }; // yellow
      case "mistake": return { color: "249, 115, 22", intensity: 0.06 }; // orange
      case "blunder": return { color: "239, 68, 68", intensity: 0.08 }; // red
      case "miss": return { color: "239, 68, 68", intensity: 0.07 }; // red
      default: return { color: "251, 146, 60", intensity: 0.03 }; // warm
    }
  })();

  /* ── Board pepe badge image (computed outside JSX to avoid styled-jsx IIFE scoping issues) ── */
  // Only show on moves that have NO commentary (fills visual gap on silent moves)
  const boardPepeImg: string | null = (() => {
    if (!currentMove || pageState !== "watching") return null;
    if (currentMove.comment) return null; // Don't show when there's commentary — avoid visual clutter
    if (currentMove.san.includes("#")) return "/pepe-emojis/4642-death.png";
    // Classification-specific pool that EXCLUDES the sidebar avatar image
    const candidates: Record<string, string[]> = {
      brilliant: ["/pepe-emojis/2230-poggies-peepo.png", "/pepe-emojis/animated/80293-pepeclap.gif", "/pepe-emojis/9088-pepe-gigachad.png", "/pepe-emojis/animated/88627-pepehype.gif"],
      great: ["/pepe-emojis/11998-pepe-king.png", "/pepe-emojis/81504-pepeok.png", "/pepe-emojis/9088-pepe-gigachad.png"],
      best: ["/pepe-emojis/11998-pepe-king.png", "/pepe-emojis/81504-pepeok.png", "/pepe-emojis/9088-pepe-gigachad.png"],
      good: ["/pepe-emojis/81504-pepeok.png", "/pepe-emojis/3959-hmm.png"],
      book: ["/pepe-emojis/8557-peepodetective.png", "/pepe-emojis/3959-hmm.png"],
      inaccuracy: ["/pepe-emojis/60250-think.png", "/pepe-emojis/animated/28654-bigeyes.gif", "/pepe-emojis/monkaS.png"],
      mistake: ["/pepe-emojis/2982-pepecry.png", "/pepe-emojis/4825_PepeClown.png", "/pepe-emojis/animated/41292-pepe-nopes.gif", "/pepe-emojis/7332-copium.png"],
      blunder: ["/pepe-emojis/animated/690612-pepe-lmao.gif", "/pepe-emojis/animated/411644-gamer-pepe-cry.gif", "/pepe-emojis/animated/84899-pepe-madpuke.gif", "/pepe-emojis/4178-pepe-rage.png", "/pepe-emojis/animated/59958-pepeclownblobtrain.gif"],
      miss: ["/pepe-emojis/6757_Sadge.png", "/pepe-emojis/animated/411644-gamer-pepe-cry.gif"],
    };
    const avatarImg = MOOD_IMAGES[currentMood];
    const pool = (candidates[currentMove.classification] ?? ["/pepe-emojis/3959-hmm.png"]).filter(p => p !== avatarImg);
    if (pool.length === 0) return candidates[currentMove.classification]?.[0] ?? "/pepe-emojis/3959-hmm.png";
    return pool[currentIdx % pool.length];
  })();
  const boardPepeIsCheckmate = currentMove?.san.includes("#") ?? false;

  /* ── Inline Decision UI (replaces modal — board stays visible) ── */
  // Show quiz options once question is typed + spoken. After answering, keep visible during explanation TTS.
  const showDecisionOptions = activeDecision && typingDone &&
    (decisionAnswer !== null || !tts.enabled || !tts.speaking);
  const inlineDecisionUI = showDecisionOptions ? (
    <div className="mt-2 space-y-2 animate-fadeIn">
      <div className="space-y-1.5">
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
                // TTS: read the explanation after a short delay so the sound effect plays first
                if (tts.enabled && activeDecision.explanation) {
                  setTimeout(() => tts.speak(activeDecision.explanation), 600);
                }
              }}
              disabled={answered}
              className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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
              <span className="text-base">{opt.emoji}</span>
              <span className="text-[10px] text-slate-500 font-mono w-4">{idx + 1}</span>
              <span className={answered && isSelected ? (isCorrect || noCorrectAnswer ? "text-green-300" : "text-red-300") : answered && isCorrect && !noCorrectAnswer ? "text-green-300" : "text-white"}>
                {opt.label}
              </span>
              {answered && isCorrect && !noCorrectAnswer && <span className="ml-auto text-green-400 text-xs">✓ +100</span>}
              {answered && isSelected && !isCorrect && !noCorrectAnswer && <span className="ml-auto text-red-400 text-xs">✗</span>}
            </button>
          );
        })}
      </div>
      {decisionAnswer !== null && (
        <div className="animate-fadeIn space-y-2">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2">
            <p className="text-xs text-amber-200 leading-relaxed">{activeDecision.explanation}</p>
          </div>
          {/* Continue button waits for explanation TTS to finish */}
          {(!tts.enabled || !tts.speaking) && (
          <button
            onClick={() => {
              if (quizTimerRef.current) { clearInterval(quizTimerRef.current); quizTimerRef.current = null; }
              setQuizCountdown(null);
              setDecisionShown(prev => new Set([...prev, activeDecision.moveIdx]));
              setActiveDecision(null);
              setDecisionAnswer(null);
              setAutoplay(true);
            }}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 hover:scale-[1.02] active:scale-95 uppercase tracking-wider"
          >
            Continue{quizCountdown !== null ? ` (${quizCountdown}s)` : ""} ▶
          </button>
          )}
        </div>
      )}
    </div>
  ) : null;

  /* ══════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                            */
  /* ══════════════════════════════════════════════════════════════════ */

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      {/* Background — floating particles and faint emoji */}
      {!streamerMode && (
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Floating embers — tiny drifting particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`ember-${i}`}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${10 + i * 11}%`,
              bottom: `${8 + (i % 5) * 7}%`,
              background: `rgba(${ambientGlow.color}, ${0.15 + (i % 3) * 0.08})`,
              boxShadow: `0 0 6px rgba(${ambientGlow.color}, 0.2)`,
              animation: `ember-drift ${8 + i * 2}s ease-in-out ${i * 1.5}s infinite`,
            }}
          />
        ))}

        {/* Faint floating chess emoji */}
        {(() => {
          const emojis = ["♟", "♞", "♝", "♜", "♛", "♚", "🏆", "🎯", "🔥", "💀", "🗿", "🤡", "⚡"];
          return Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`bg-emoji-${i}`}
              className="absolute select-none"
              style={{
                fontSize: 14 + (i % 4) * 6,
                left: `${5 + ((i * 17 + 7) % 90)}%`,
                bottom: `${-5 + (i % 6) * 5}%`,
                opacity: 0.04 + (i % 3) * 0.015,
                animation: `ember-drift ${12 + i * 3}s ease-in-out ${i * 2.2}s infinite`,
                filter: "blur(0.5px)",
              }}
            >
              {emojis[i % emojis.length]}
            </div>
          ));
        })()}
      </div>
      )}

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

      {/* Piece rain — chess pieces falling from top on hung pieces */}
      {pieceRain.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[55] overflow-hidden">
          {pieceRain.map((p) => {
            const left = 10 + Math.random() * 80;
            const delay = Math.random() * 0.6;
            const duration = 1.8 + Math.random() * 1.5;
            const size = 28 + Math.random() * 24;
            const rotation = Math.random() * 720 - 360;
            const drift = (Math.random() - 0.5) * 120;
            return (
              <div
                key={p.id}
                className="absolute animate-piece-fall"
                style={{
                  left: `${left}%`,
                  top: "-8%",
                  fontSize: size,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  // @ts-expect-error -- CSS custom property
                  "--rotation": `${rotation}deg`,
                  "--drift": `${drift}px`,
                }}
              >
                {p.piece}
              </div>
            );
          })}
        </div>
      )}

      <div className={`relative z-10 mx-auto px-4 py-8 sm:px-6 lg:px-8 ${streamerMode ? "max-w-[1600px]" : "max-w-6xl"}`}>
        {/* Streamer mode toggle (always visible in top-right) */}
        {(pageState === "watching" || pageState === "guessing" || pageState === "revealed") && (
          <button
            onClick={() => setStreamerMode(p => !p)}
            className={`fixed top-3 right-3 z-[80] rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              streamerMode
                ? "border-2 border-purple-500/60 bg-purple-500/20 text-purple-300 shadow-lg shadow-purple-500/20"
                : "border border-white/10 bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.08]"
            }`}
            title="Toggle Streamer Mode (OBS-friendly)"
          >
            📺 {streamerMode ? "Streamer" : "Stream"}
          </button>
        )}

        {/* Header — Gameshow title card (compact when playing, full hero on landing) */}
        {pageState !== "choose-source" && !streamerMode ? (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/[0.06] via-red-500/[0.04] to-orange-500/[0.06] px-6 py-3 shadow-lg shadow-orange-500/10">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,146,60,0.3)]">
                  Roast the Elo 🔥
                </span>
              </h1>
              <span className="rounded-md bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                Alpha
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Watch real games. Read the roasts. Guess the rating.
            </p>
            {/* Gameshow scoreboard */}
            {gamesPlayed > 0 && (
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="relative flex items-center gap-2.5 rounded-full border border-amber-500/30 px-5 py-2 shadow-xl" style={{
                  background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(245,158,11,0.04) 100%)",
                  boxShadow: "0 0 20px rgba(251,191,36,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}>
                  <span className="text-[10px] text-amber-300/60 uppercase tracking-[0.2em] font-bold">Score</span>
                  <span className="text-xl font-black text-amber-400 tabular-nums" style={{ textShadow: "0 0 16px rgba(251,191,36,0.6)" }}>
                    {score.toLocaleString()}
                  </span>
                  {lastScoreGain && (
                    <span className="absolute -top-5 right-2 text-sm font-black text-green-400 animate-bounce" style={{ textShadow: "0 0 10px rgba(34,197,94,0.5)" }}>
                      +{lastScoreGain}
                    </span>
                  )}
                </div>
                {streakCount >= 2 && (
                <div className="flex items-center gap-1.5 rounded-full border border-orange-500/40 px-3.5 py-1.5 shadow-lg" style={{
                  background: "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(239,68,68,0.08) 100%)",
                  boxShadow: "0 0 16px rgba(249,115,22,0.2)",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}>
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

                {/* Alpha warning */}
                <div className="mx-auto mb-5 max-w-lg rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-600/5 px-5 py-4 shadow-lg shadow-amber-500/10">
                  <p className="text-sm font-black text-amber-400 uppercase tracking-wider mb-1.5">⚠️ Alpha — Expect Rough Edges</p>
                  <p className="text-sm text-amber-200/80 leading-relaxed">
                    Commentary lines may be inaccurate or out of context — we&apos;re still tuning the engine.
                    Found a bug? Please report it in <a href="/feedback" className="underline font-semibold text-amber-300 hover:text-amber-200 transition-colors">Feedback</a>!
                  </p>
                </div>

                {/* Sound suggestion */}
                <div className="mx-auto mb-6 max-w-lg rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 px-5 py-4 shadow-lg shadow-emerald-500/10">
                  <p className="text-base text-emerald-200/90 leading-relaxed text-center">
                    🔊 <span className="font-black text-emerald-300 text-lg">Turn your sound on!</span>
                  </p>
                  <p className="text-sm text-emerald-300/60 text-center mt-1">
                    Move sounds, meme SFX, and TTS voice narration for the full gameshow experience.
                  </p>
                </div>

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
                  setInputMode("random");
                  setIsDaily(true);
                  fetchDailyGame();
                }}
                className={`group rounded-2xl border p-5 sm:p-6 text-center transition-all cursor-pointer relative overflow-hidden ${
                  dailyCompleted
                    ? "border-emerald-500/30 bg-emerald-500/[0.06] hover:border-emerald-500/40 hover:bg-emerald-500/[0.10]"
                    : "border-amber-500/20 bg-amber-500/[0.04] hover:border-amber-500/40 hover:bg-amber-500/[0.08]"
                }`}
              >
                <span className="mb-2 sm:mb-3 flex justify-center text-2xl sm:text-3xl">{dailyCompleted ? (dailyCompleted.result === "correct" ? "🎯" : dailyCompleted.result === "close" ? "🔥" : "📅") : "📅"}</span>
                <p className={`text-xs sm:text-sm font-bold ${dailyCompleted ? "text-emerald-400" : "text-amber-400 group-hover:text-amber-300"}`}>
                  {dailyCompleted ? "Rewatch ▶" : "Daily Challenge"}
                </p>
                <p className="mt-1 text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                  {dailyCompleted ? `${dailyCompleted.guess} → ${dailyCompleted.elo} Elo` : "Same game for everyone today"}
                </p>
                {!dailyCompleted && dailyPlayerCount !== null && dailyPlayerCount > 0 && (
                  <p className="mt-1.5 text-[10px] text-amber-400/60 font-medium flex items-center justify-center gap-1">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    {dailyPlayerCount} player{dailyPlayerCount !== 1 ? "s" : ""} today
                  </p>
                )}
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

            {/* Alpha feedback CTA */}
            <div className="mt-10 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-slate-400">
                🔥 Roast the Elo is in <span className="font-semibold text-orange-300">Alpha</span> — some commentary may be wrong. If you caught a bug or something feels off,{" "}
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

        {/* ── Intro screen — Beast Games / Squid Game Stage Reveal ── */}
        {pageState === "intro" && game && !analyzing && (
          <div className="flex flex-col items-center gap-6 py-12 animate-fadeIn">
            {/* ROUND number — Beast Games style */}
            <div className="animate-round-flash text-center mb-2">
              <p className="text-5xl sm:text-6xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-600" style={{ textShadow: "0 0 40px rgba(239,68,68,0.4)" }}>
                ROUND {gamesPlayed + 1}
              </p>
              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto mt-2" />
            </div>

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
                {!challengeId && game.source && (
                  <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      game.source === "lichess" ? "text-slate-400" : "text-green-400"
                    }`}>
                      {game.source === "lichess" ? "♞ Lichess Game" : "♟ Chess.com Game"}
                    </span>
                  </div>
                )}
                <p className="text-xs uppercase tracking-[0.25em] text-orange-400/60 font-bold mb-3">🎬 Coming Up</p>
                <p className="text-xl font-bold text-orange-300 mb-5">&ldquo;{introLine}&rdquo;</p>

                {/* Player matchup — VS card */}
                <div className="flex items-center justify-center gap-3 mb-5">
                  <div className="flex-1 text-right">
                    <div className="inline-block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wider">White</p>
                      <p className="text-sm font-bold text-white truncate max-w-[120px]">{game.whitePlayer}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
                    <span className="text-xs font-black text-red-400">VS</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="inline-block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Black</p>
                      <p className="text-sm font-bold text-white truncate max-w-[120px]">{game.blackPlayer}</p>
                    </div>
                  </div>
                </div>

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
          <div className={`grid grid-cols-1 gap-4 lg:gap-6 ${streamerMode ? "lg:grid-cols-[1fr_420px]" : "lg:grid-cols-[1fr_360px]"}`}>
            {/* Board column */}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              {/* LIVE ON AIR indicator — mobile only (desktop shows in sidebar) */}
              {pageState === "watching" && (
                <div className="flex lg:hidden items-center gap-2.5 mb-1">
                  <div className="relative flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-500/[0.12] px-3.5 py-1 shadow-lg shadow-red-500/10">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400">Live</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider">Round {gamesPlayed + 1}</span>
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

              <div className="w-full max-w-[640px]">
                {/* Premium board frame with reactive glow */}
                <div className="relative rounded-2xl p-[3px] transition-all duration-700" style={{
                  background: `linear-gradient(135deg, rgba(${ambientGlow.color}, ${ambientGlow.intensity * 3}) 0%, rgba(255,255,255,0.06) 50%, rgba(${ambientGlow.color}, ${ambientGlow.intensity * 2}) 100%)`,
                  boxShadow: `0 0 40px rgba(${ambientGlow.color}, ${ambientGlow.intensity * 1.5}), 0 0 80px rgba(${ambientGlow.color}, ${ambientGlow.intensity * 0.5}), inset 0 1px 0 rgba(255,255,255,0.08)`,
                }}>
                <div className={`overflow-hidden rounded-[13px] relative ${
                  screenShake === "slam" ? "animate-board-slam" :
                  screenShake === "heavy" ? "animate-board-shake-heavy" :
                  screenShake === "mild" ? "animate-board-shake-mild" : ""
                }`}>
                  <Chessboard
                    id="roast-board"
                    position={fen}
                    boardOrientation={orientation}
                    onBoardWidthChange={setBoardSize}
                    arePiecesDraggable={false}
                    animationDuration={200}
                    customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                    customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                    showBoardNotation={showCoords}
                    customSquareStyles={customSquareStyles}
                    customPieces={customPieces}
                    customArrows={activeArrows.map(([from, to, color]) => [from as CbSquare, to as CbSquare, color] as [CbSquare, CbSquare, string])}
                  />

                  {/* ── Board flash overlay (red for blunders, gold for brilliancies) ── */}
                  {boardFlash && (
                    <div className={`absolute inset-0 pointer-events-none z-10 animate-board-flash ${
                      boardFlash === "red" ? "bg-red-500/30" : "bg-amber-400/25"
                    }`} />
                  )}

                  {/* ── Board crack overlay (catastrophic blunders) ── */}
                  {boardCrack && (
                    <div className="absolute inset-0 pointer-events-none z-20 animate-fadeIn">
                      <svg viewBox="0 0 100 100" className="w-full h-full opacity-40" preserveAspectRatio="none">
                        <path d="M45 0 L48 18 L42 28 L50 45 L44 55 L48 72 L43 85 L47 100" stroke="white" strokeWidth="0.8" fill="none" className="animate-crack-draw" />
                        <path d="M50 45 L58 52 L65 48" stroke="white" strokeWidth="0.5" fill="none" className="animate-crack-draw" />
                        <path d="M42 28 L35 35 L30 32" stroke="white" strokeWidth="0.5" fill="none" className="animate-crack-draw" />
                      </svg>
                    </div>
                  )}

                  {/* ── ELIMINATED text (Squid Game style) ── */}
                  {eliminationText && (
                    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-elimination-in">
                      <div className="bg-red-600/90 px-6 py-3 rounded-lg border-2 border-red-400 shadow-2xl shadow-red-500/50 backdrop-blur-sm">
                        <p className="text-xl sm:text-2xl font-black text-white uppercase tracking-[0.2em] text-center whitespace-nowrap" style={{ textShadow: "0 0 20px rgba(255,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)" }}>
                          {eliminationText}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Ghost reaction marquee (danmaku-style horizontal scroll) ── */}
                  {isDaily && activeGhosts.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                      {activeGhosts.map((ghost) => {
                        const pepeImage = GHOST_EMOJI_IMAGES[ghost.emoji];
                        return (
                          <div
                            key={ghost.id}
                            className="absolute animate-ghost-marquee"
                            style={{
                              top: `${ghost.y}%`,
                            }}
                          >
                            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-[2px] rounded-full pl-1 pr-2 py-0.5 shadow-lg border border-white/10">
                              {pepeImage ? (
                                <img
                                  src={pepeImage}
                                  alt={ghost.emoji}
                                  className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-lg"
                                  draggable={false}
                                />
                              ) : (
                                <span className="text-xl sm:text-2xl drop-shadow-lg select-none">{ghost.emoji}</span>
                              )}
                              {ghost.displayName && ghost.displayName !== "Anonymous" && (
                                <span className="text-[9px] text-white/80 font-medium whitespace-nowrap">
                                  {ghost.displayName}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Emoji markers (OUTSIDE overflow-hidden so they won't clip at board edges) ── */}
                {activeMarkers.length > 0 && boardSize > 0 && (
                  <div className="absolute pointer-events-none z-[100]" style={{ width: boardSize, height: boardSize, left: 3, top: 3 }}>
                    {activeMarkers.map((m, i) => {
                      const sqSize = boardSize / 8;
                      const fileI = m.square.charCodeAt(0) - 97;
                      const rankI = parseInt(m.square[1]) - 1;
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

                {/* ── Emoji markers (OUTSIDE overflow-hidden so they won't clip at board edges) ── */}
                {activeMarkers.length > 0 && boardSize > 0 && (
                  <div className="absolute pointer-events-none z-[100]" style={{ width: boardSize, height: boardSize, left: 3, top: 3 }}>
                    {activeMarkers.map((m, i) => {
                      const sqSize = boardSize / 8;
                      const fileI = m.square.charCodeAt(0) - 97;
                      const rankI = parseInt(m.square[1]) - 1;
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

                {/* ── Pepe reaction badge (OUTSIDE overflow-hidden so it won't clip at edges) ── */}
                {boardPepeImg && boardSize > 0 && currentMove && (
                  (() => {
                    const toSqStr = currentMove.to;
                    const sqSize = boardSize / 8;
                    const fileI = toSqStr.charCodeAt(0) - 97;
                    const rankI = parseInt(toSqStr[1]) - 1;
                    const x = orientation === "white" ? fileI * sqSize : (7 - fileI) * sqSize;
                    const y = orientation === "white" ? (7 - rankI) * sqSize : rankI * sqSize;
                    const pepeSize = boardPepeIsCheckmate ? sqSize * 0.5 : sqSize * 0.36;
                    const pad = 3; // matches p-[3px] on the frame wrapper
                    return (
                      <div
                        className="absolute z-[100] pointer-events-none animate-bounce-once"
                        key={`pepe-${currentIdx}-${currentMood}`}
                        style={{
                          left: pad + x + sqSize - pepeSize * 0.35,
                          top: pad + y - pepeSize * 0.35,
                          width: pepeSize,
                          height: pepeSize,
                        }}
                      >
                        <div className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] w-full h-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={boardPepeImg}
                            alt={boardPepeIsCheckmate ? "checkmate" : currentMove.classification}
                            className="object-contain w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  })()
                )}

                </div>{/* close premium frame wrapper */}
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

              {/* Commentary text below board (hidden on mobile — mobile clippy shows it) */}
              {activeComment && (pageState === "watching" || pageState === "guessing") && (
                <div className="w-full max-w-[640px] animate-fadeIn">
                  <div className="hidden lg:block relative rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.08] px-4 py-2.5 overflow-hidden">
                    {/* Reactive accent line at top */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-700" style={{ background: `linear-gradient(90deg, transparent, rgba(${ambientGlow.color}, 0.6), transparent)` }} />
                    {tacticReplaying ? (
                      <div className="text-xs sm:text-sm text-center">
                        <span className="text-amber-400 font-bold animate-pulse">🎯 Best continuation:</span>
                        <span className="text-white/90 ml-2 font-mono">
                          {currentMove?.tacticLine?.slice(0, tacticReplayStep).join(" → ") || "..."}
                        </span>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm text-white/90 leading-relaxed text-center relative">
                          {typewriterText}
                          {!typingDone && <span className="animate-blink text-orange-400">|</span>}
                        </p>
                        {typingDone && currentMove?.tacticLine && currentMove.tacticLine.length >= 2 && !tacticReplaying && (
                          <div className="flex justify-center mt-2">
                            <button
                              onClick={startTacticReplay}
                              className="text-[10px] sm:text-xs px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors font-medium"
                            >
                              🎯 Show What Was Missed
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {/* Inline quiz options — visible only on non-lg screens where sidebar is hidden */}
                  <div className="lg:hidden">{inlineDecisionUI}</div>
                </div>
              )}

              {/* ── Daily Challenge: Ghost Reaction Picker ── */}
              {isDaily && (pageState === "watching" || pageState === "guessing") && currentIdx >= 0 && (
                <div className="w-full max-w-[640px]">
                  <div className="relative flex items-center gap-1.5 px-1">
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold whitespace-nowrap mr-1">
                      👻 React
                    </span>
                    {REACTION_OPTIONS.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => {
                          if (myReaction === r.key) return; // already reacted
                          setMyReaction(r.key);
                          // POST reaction to API
                          fetch("/api/roast/daily-reactions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              date: dailyDateRef.current,
                              moveIdx: currentIdx,
                              emoji: r.key,
                            }),
                          }).catch(() => {});
                          // Show own reaction as a ghost immediately
                          ghostIdRef.current++;
                          const selfGhost = {
                            emoji: r.key,
                            displayName: user?.name ?? "You",
                            id: ghostIdRef.current,
                            x: 0,
                            y: 10 + Math.random() * 70, // random vertical lane
                          };
                          setActiveGhosts(prev => [...prev, selfGhost]);
                          setTimeout(() => setActiveGhosts(prev => prev.filter(g => g.id !== selfGhost.id)), 5500);
                          // Flash confirmation
                          setReactionConfirm(r.key);
                          setTimeout(() => setReactionConfirm(null), 1200);
                          // Bump audience meter slightly — your reaction energizes the crowd
                          setAudienceMeter(prev => Math.min(100, prev + 3));
                        }}
                        className={`group relative rounded-md p-1 transition-all duration-200 hover:scale-125 hover:bg-white/10 ${
                          myReaction === r.key
                            ? "scale-125 bg-orange-500/20 ring-2 ring-orange-400/70 shadow-[0_0_12px_rgba(251,146,60,0.3)]"
                            : ""
                        }`}
                        title={r.label}
                      >
                        {r.image ? (
                          <img src={r.image} alt={r.label} className="w-6 h-6 sm:w-7 sm:h-7" draggable={false} />
                        ) : (
                          <span className="text-base sm:text-lg">{r.key}</span>
                        )}
                        {/* Selected checkmark */}
                        {myReaction === r.key && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold shadow-md">✓</span>
                        )}
                      </button>
                    ))}
                    {/* Ghost count indicator */}
                    {(() => {
                      const reactionsAtMove = ghostReactions[currentIdx];
                      if (!reactionsAtMove || reactionsAtMove.length === 0) return null;
                      return (
                        <span className="ml-auto text-[10px] text-slate-500 tabular-nums">
                          👻 {reactionsAtMove.length} reaction{reactionsAtMove.length !== 1 ? "s" : ""}
                        </span>
                      );
                    })()}
                    {/* Reaction sent confirmation */}
                    {reactionConfirm && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none animate-reaction-confirm">
                        <div className="bg-orange-500/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1">
                          <span>Sent!</span>
                          {(() => {
                            const img = GHOST_EMOJI_IMAGES[reactionConfirm];
                            return img ? <img src={img} alt="" className="w-4 h-4" /> : <span>{reactionConfirm}</span>;
                          })()}
                        </div>
                      </div>
                    )}
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
                    <span className="text-[10px] text-right tabular-nums whitespace-nowrap flex items-center gap-1" style={{
                      color: audienceMeter > 70 ? "#4ade80" : audienceMeter > 40 ? "#facc15" : "#f87171",
                    }}>
                      {audienceMeter > 85 ? "🤯 Hyped" : audienceMeter > 70 ? "😍 Loving it" : audienceMeter > 55 ? "🙂 Engaged" : audienceMeter > 40 ? "😐 Meh" : audienceMeter > 20 ? "😬 Cringe" : "💀 Bored"}
                    </span>
                  </div>

                  {/* Beast Games-style elimination + survival stats */}
                  {currentIdx >= 0 && (
                    <div className="flex items-center justify-between px-1 mt-1.5">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const blundersNow = moves.slice(0, currentIdx + 1).filter(m => m.classification === "blunder").length;
                          const mistakesNow = moves.slice(0, currentIdx + 1).filter(m => m.classification === "mistake").length;
                          return (
                            <>
                              {blundersNow > 0 && (
                                <span className="text-[10px] font-bold text-red-400 flex items-center gap-0.5">
                                  💀 {blundersNow} eliminated
                                </span>
                              )}
                              {mistakesNow > 0 && (
                                <span className="text-[10px] font-bold text-orange-400/60 flex items-center gap-0.5">
                                  ⚠️ {mistakesNow}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-[10px] text-slate-600 tabular-nums">
                        {Math.round(((currentIdx + 1) / moves.length) * 100)}% complete
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Playback controls */}
              {(pageState === "watching" || pageState === "guessing" || pageState === "revealed") && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-1 sm:mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm px-3 py-2" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                  <button
                    onClick={() => goToMove(Math.max(-1, currentIdx - 1))}
                    title="Previous move (←)"
                    className="group rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-slate-400 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
                  >
                    ◀ Prev
                    <kbd className="hidden sm:inline-block ml-1.5 text-[9px] text-slate-600 bg-white/[0.06] px-1 py-0.5 rounded font-mono group-hover:text-slate-400">←</kbd>
                  </button>
                  {pageState === "watching" && (
                    <button
                      onClick={() => setAutoplay(prev => !prev)}
                      title="Play/Pause (Space)"
                      className={`group rounded-lg border px-4 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                        autoplay
                          ? "border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-500/10"
                          : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {autoplay ? "⏸ Pause" : "▶ Play"}
                      <kbd className="hidden sm:inline-block ml-1.5 text-[9px] text-slate-600 bg-white/[0.06] px-1 py-0.5 rounded font-mono group-hover:text-slate-400">⎵</kbd>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setAutoplay(false);
                      goToMove(Math.min(moves.length - 1, currentIdx + 1));
                    }}
                    title="Next move (→)"
                    className="group rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-slate-400 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
                  >
                    Next ▶
                    <kbd className="hidden sm:inline-block ml-1.5 text-[9px] text-slate-600 bg-white/[0.06] px-1 py-0.5 rounded font-mono group-hover:text-slate-400">→</kbd>
                  </button>
                  {/* Flip board */}
                  <button
                    onClick={() => setOrientation(o => o === "white" ? "black" : "white")}
                    title="Flip board (F)"
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
                  <div className="relative h-2 rounded-full bg-white/[0.04] border border-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${((currentIdx + 1) / moves.length) * 100}%`,
                        background: `linear-gradient(90deg, rgba(${ambientGlow.color}, 0.8), rgba(${ambientGlow.color}, 1))`,
                        boxShadow: `0 0 12px rgba(${ambientGlow.color}, 0.4)`,
                      }}
                    />
                    {/* Classification event markers on the timeline */}
                    {moves.map((m, i) => {
                      const cls = m.classification;
                      if (cls !== "blunder" && cls !== "mistake" && cls !== "brilliant" && cls !== "great") return null;
                      const color = cls === "blunder" ? "#ef4444" : cls === "mistake" ? "#f97316" : cls === "brilliant" ? "#06b6d4" : "#22c55e";
                      return (
                        <button
                          key={i}
                          onClick={() => { setAutoplay(false); goToMove(i); }}
                          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-black/40 cursor-pointer hover:scale-150 transition-transform z-10"
                          style={{ left: `${((i + 0.5) / moves.length) * 100}%`, background: color, boxShadow: `0 0 4px ${color}` }}
                          title={`Move ${m.moveNumber}: ${m.san} — ${cls}`}
                        />
                      );
                    })}
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
              {/* LIVE ON AIR indicator — desktop sidebar (mobile shows above board) */}
              {pageState === "watching" && (
                <div className="hidden lg:flex items-center gap-2.5">
                  <div className="relative flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-500/[0.12] px-3.5 py-1 shadow-lg shadow-red-500/10">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400">Live</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider">Round {gamesPlayed + 1}</span>
                </div>
              )}
              {/* ── Live Roast: Avatar + Speech Bubble (hidden on mobile, shown under board instead) ── */}
              <div className="hidden lg:block rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-4 backdrop-blur-sm" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)" }}>
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
                <div className={`flex items-start gap-3 mb-4 ${streamerMode ? "min-h-[140px]" : "min-h-[100px]"}`}>
                  <div className="relative flex-shrink-0">
                    <RoastAvatar mood={currentMood} size={streamerMode ? 88 : 68} />
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
                        <div className="absolute -left-2 top-5 w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-white/[0.08]" />
                        {/* Bubble */}
                        <div className="relative rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] px-4 py-3 animate-fadeIn overflow-hidden" style={{ boxShadow: `0 0 20px rgba(${ambientGlow.color}, ${ambientGlow.intensity * 0.5})` }}>
                          {/* Reactive accent */}
                          <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl transition-colors duration-700" style={{ background: `rgba(${ambientGlow.color}, 0.4)` }} />
                          {tacticReplaying ? (
                            <div className={`leading-relaxed ${streamerMode ? "text-base" : "text-sm"}`}>
                              <span className="text-amber-400 font-bold animate-pulse">🎯 Best continuation:</span>
                              <span className="text-white/90 ml-2 font-mono text-xs">
                                {currentMove?.tacticLine?.slice(0, tacticReplayStep).join(" → ") || "..."}
                              </span>
                            </div>
                          ) : (
                            <>
                              <p className={`text-slate-200 leading-relaxed ${streamerMode ? "text-base" : "text-sm"}`}>
                                {typewriterText}
                                {!typingDone && <span className="animate-blink text-orange-400">|</span>}
                              </p>
                              {typingDone && currentMove?.tacticLine && currentMove.tacticLine.length >= 2 && !tacticReplaying && (
                                <button
                                  onClick={startTacticReplay}
                                  className="mt-2 text-[10px] px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors font-medium"
                                >
                                  🎯 Show What Was Missed
                                </button>
                              )}
                            </>
                          )}
                          {/* Inline quiz options — sidebar (lg+) */}
                          {inlineDecisionUI}
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
                    className={`overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 ${streamerMode ? "h-[240px] lg:h-[280px]" : "h-[140px] lg:h-[180px]"}`}
                  >
                    {commentHistory.length === 0 && pageState === "watching" && (
                      <p className="text-[11px] text-slate-700 italic">No comments yet…</p>
                    )}
                    {commentHistory.map((c, i) => (
                      <div
                        key={i}
                        className={`pl-2 border-l-2 border-white/[0.06] py-0.5 animate-fadeIn ${streamerMode ? "text-sm text-slate-400" : "text-xs text-slate-500"}`}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Move list (compact) */}
              {(pageState === "watching" || pageState === "guessing" || pageState === "revealed") && (
                <div className="hidden lg:block rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-4 backdrop-blur-sm" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)" }}>
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
                  <p className="text-[10px] uppercase tracking-[0.3em] text-red-400/80 font-bold mb-1 animate-pulse">⏱️ DECISION TIME</p>
                  <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-orange-300 to-amber-300 uppercase tracking-wider" style={{ textShadow: "0 0 20px rgba(251,146,60,0.3)" }}>
                    🎯 Lock It In!
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1.5">What&apos;s the average Elo of these players?</p>
                  {/* Source badge + stakes reminder */}
                  <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                    {game?.source && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        game.source === "lichess"
                          ? "border-white/10 bg-white/5 text-slate-400"
                          : "border-green-500/20 bg-green-500/5 text-green-400"
                      }`}>
                        {game.source === "lichess" ? "♞ Lichess" : "♟ Chess.com"}
                      </span>
                    )}
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-0.5">
                      <span className="text-[10px] text-red-400 font-bold">🏆 {score > 0 ? `${score} pts at stake` : "300 pts for perfect guess"}</span>
                    </div>
                  </div>
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
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto py-4 sm:py-8" onClick={() => setRevealModalOpen(false)}>
            <div className="relative w-[96vw] max-w-2xl rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-4 sm:p-6 shadow-2xl shadow-amber-500/20 overflow-hidden my-auto" onClick={e => e.stopPropagation()}>
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

              <div className="relative">
                {/* ── Two-column grid on md+, single column on mobile ── */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* ═══ LEFT COLUMN: Reveal + Stats ═══ */}
                  <div className="space-y-3">
                {/* Animated Elo Counter */}
                <div className="text-center">
                  <p className="text-xs text-amber-400/60 uppercase tracking-[0.2em] font-bold mb-1">The Rating Is...</p>
                  <p className="text-4xl sm:text-5xl md:text-6xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-200" style={{ textShadow: "0 0 40px rgba(251,191,36,0.3)" }}>
                    {revealCounterElo ?? game.avgElo}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    White: {game.whiteElo} · Black: {game.blackElo}
                  </p>
                  {game.source && (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold mt-1.5 ${
                      game.source === "lichess"
                        ? "border-white/10 bg-white/5 text-slate-400"
                        : "border-green-500/20 bg-green-500/5 text-green-400"
                    }`}>
                      {game.source === "lichess" ? "♞ Lichess" : "♟ Chess.com"}
                    </span>
                  )}
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

                {/* Sarcastic score judgment */}
                {selectedBracket !== null && (() => {
                  const dist = Math.abs(selectedBracket - getEloBracketIdx(game.avgElo));
                  const guessedHigher = selectedBracket > getEloBracketIdx(game.avgElo);
                  const totalErrors = blunders + mistakes;
                  let judgment = "";
                  if (dist === 0) {
                    // Perfect guess
                    if (totalErrors >= 6) judgment = `With ${blunders} blunders and ${mistakes} mistakes? Yeah that was basically a neon sign saying "I'm ${game.avgElo} elo." Free points 🎯`;
                    else if (totalErrors >= 3) judgment = `Fair enough — ${totalErrors} errors total, the math checked out. You've clearly watched too many Guess the Elo videos 📺🧠`;
                    else judgment = `Clean game, hard to read, and you STILL nailed it. Either you're a psychic or you've been doing this way too long 🔮`;
                  } else if (dist === 1) {
                    // Close
                    if (guessedHigher && totalErrors >= 4) judgment = `You gave them more credit than they deserved? With ${blunders} blunders?? I respect the optimism but c'mon 😭`;
                    else if (guessedHigher) judgment = `Guessed a bit high — honestly the game was cleaner than expected for ${game.avgElo}. They had us fooled too 🤷`;
                    else if (totalErrors >= 5) judgment = `You rated them low and honestly? With ${blunders} blunders they PLAYED like patzers. Can't blame you for that read 💀`;
                    else if (totalErrors >= 3) judgment = `A bit low but I get it — ${totalErrors} errors made them look worse than they are. The patzer energy was real 🐸`;
                    else judgment = `Close! The game was surprisingly solid for this elo. Even their mistakes looked intentional... they weren't, but they LOOKED it 🗿`;
                  } else if (dist >= 4) {
                    // Way off
                    if (guessedHigher && totalErrors >= 5) judgment = `You guessed THAT high?? They had ${blunders} blunders! Were you watching the same game as the rest of us? 💀😭`;
                    else if (guessedHigher) judgment = `Respectfully: galaxy brain moment. You saw a ${game.avgElo} game and thought they were GOOD. The delusion is inspiring 🗿`;
                    else if (totalErrors <= 2) judgment = `You thought THIS was low elo? They barely made any mistakes! The disrespect to ${game.avgElo}-rated players is unreal 😤`;
                    else judgment = `Way off but honestly the game was chaotic enough that I can't even judge. Actually I can. I judge you negatively 💀`;
                  } else {
                    // dist 2-3 (moderate miss)
                    if (guessedHigher && totalErrors >= 4) judgment = `${blunders} blunders and you thought they were BETTER than ${game.avgElo}?? They were playing like they just learned what en passant is 🤡`;
                    else if (guessedHigher) judgment = `Overrated them a bit. I get it though — sometimes a patzer plays one clean sequence and you think they're Magnus. They're not 🐸`;
                    else if (totalErrors >= 5) judgment = `Rated them low and look — with ${blunders} blunders and ${mistakes} mistakes, they DID play like absolute patzers. The data agreed with you. The elo didn't 📊💀`;
                    else if (totalErrors >= 3) judgment = `A bit too harsh but I see it — ${totalErrors} errors, some questionable choices. They played like someone who knows the rules but forgot the strategy 🫠`;
                    else judgment = `Underestimated them. The game was actually pretty clean — guess they're having a good day. Even patzers get lucky sometimes 🍀`;
                  }
                  return judgment ? (
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                      <p className="text-xs text-slate-400 text-center leading-relaxed">{judgment}</p>
                    </div>
                  ) : null;
                })()}

                  </div>{/* end LEFT COLUMN */}

                  {/* ═══ RIGHT COLUMN: Score, Actions, Share ═══ */}
                  <div className="space-y-3">

                {/* Leaderboard toggle button */}
                {leaderboardData.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowLeaderboard(p => !p)}
                        className="w-full rounded-xl border border-amber-500/20 bg-amber-500/[0.03] px-3 py-2.5 text-xs font-bold text-amber-400/70 uppercase tracking-wider hover:bg-amber-500/[0.08] transition-all flex items-center justify-center gap-1.5"
                      >
                        🏆 Weekly Leaderboard {showLeaderboard ? "▲" : "▼"}
                      </button>
                      {showLeaderboard && (
                        <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-3 space-y-2 animate-fadeIn">
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
                    {/* Download / native-share card */}
                    <button
                      onClick={async () => {
                        const diff = selectedBracket !== null ? Math.abs(selectedBracket - getEloBracketIdx(game.avgElo)) : 99;
                        const result = diff === 0 ? "PERFECT" : diff === 1 ? "CLOSE" : "MISS";
                        // Pick best roast line from commentary (longest non-trivial line)
                        const bestRoast = [...commentHistory]
                          .filter(c => c.length > 30 && !c.startsWith("Move"))
                          .sort((a, b) => b.length - a.length)[0] ?? "";
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
                          opening: game.opening ?? "",
                          roast: bestRoast,
                        });
                        const url = `/api/roast/share-card?${params.toString()}`;
                        try {
                          const res = await fetch(url);
                          const blob = await res.blob();
                          const file = new File([blob], "roast-the-elo.png", { type: "image/png" });
                          // Try native share with image (mobile)
                          if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
                            await navigator.share({
                              title: "Roast the Elo",
                              text: `🐸 I guessed ${selectedBracket !== null ? ELO_BRACKETS[selectedBracket].label : "?"} — actual Elo was ${game.avgElo}!`,
                              files: [file],
                            });
                            return;
                          }
                          // Desktop fallback: auto-download
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = blobUrl;
                          a.download = "roast-the-elo.png";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                          setShareText("Saved!");
                          setTimeout(() => setShareText(null), 2000);
                        } catch {
                          // Final fallback — open in new tab
                          window.open(url, "_blank");
                        }
                      }}
                      className={`rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-3 py-2.5 text-xs font-medium text-purple-300 hover:bg-purple-500/[0.12] hover:border-purple-500/30 transition-all flex items-center justify-center gap-1.5 ${!game.id ? "col-span-2" : ""}`}
                    >
                      🖼️ Share Card
                    </button>
                  </div>
                  {/* Best Roasts highlight card */}
                  {commentHistory.filter(c => c.length > 30 && !c.startsWith("Move")).length >= 2 && (
                    <button
                      onClick={async () => {
                        const diff = selectedBracket !== null ? Math.abs(selectedBracket - getEloBracketIdx(game.avgElo)) : 99;
                        const result = diff === 0 ? "PERFECT" : diff === 1 ? "CLOSE" : "MISS";
                        // Pick top 3 roast lines (longest, funniest) from commentary
                        const topLines = [...commentHistory]
                          .filter(c => c.length > 30 && !c.startsWith("Move"))
                          .sort((a, b) => b.length - a.length)
                          .slice(0, 3);
                        const params = new URLSearchParams({
                          elo: String(game.avgElo),
                          result,
                          opening: game.opening ?? "",
                          lines: topLines.join("||"),
                        });
                        const url = `/api/roast/highlight-card?${params.toString()}`;
                        try {
                          const res = await fetch(url);
                          const blob = await res.blob();
                          const file = new File([blob], "roast-highlights.png", { type: "image/png" });
                          if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
                            await navigator.share({
                              title: "Best Roast Moments",
                              text: `🐸 My best roast moments — Elo was ${game.avgElo}!`,
                              files: [file],
                            });
                            return;
                          }
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = blobUrl;
                          a.download = "roast-highlights.png";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                          setShareText("Saved!");
                          setTimeout(() => setShareText(null), 2000);
                        } catch {
                          window.open(url, "_blank");
                        }
                      }}
                      className="w-full rounded-xl border border-pink-500/20 bg-pink-500/[0.06] px-3 py-2.5 text-xs font-medium text-pink-300 hover:bg-pink-500/[0.12] hover:border-pink-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      💀 Share Best Roasts
                    </button>
                  )}
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

                  </div>{/* end RIGHT COLUMN */}
                </div>{/* end grid */}
              </div>
            </div>
          </div>
        )}

        {/* Streamer mode OBS watermark */}
        {streamerMode && (pageState === "watching" || pageState === "guessing") && (
          <div className="fixed bottom-4 left-4 z-[80] flex items-center gap-2 rounded-xl border border-orange-500/20 bg-black/60 backdrop-blur-sm px-4 py-2">
            <span className="text-sm">🔥</span>
            <span className="text-sm font-black text-orange-400 tracking-wide">firechess.app/roast</span>
            <div className="flex items-center gap-1 ml-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live</span>
            </div>
          </div>
        )}

        {/* Footer — Gameshow credits style */}
        <div className={`mt-12 text-center text-xs text-slate-600 border-t border-white/[0.04] pt-6 ${streamerMode ? "hidden" : ""}`}>
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
                {/* Inline quiz options — mobile clippy */}
                {inlineDecisionUI}
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
        @keyframes bounceOnce {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(5deg); opacity: 1; }
          70% { transform: scale(0.9) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-bounce-once {
          animation: bounceOnce 0.5s ease-out both;
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

        /* Spotlight pulse on reveal */
        @keyframes spotlight-pulse {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        .animate-spotlight-pulse {
          animation: spotlight-pulse 2s ease-out forwards;
        }

        /* ══════ Board Visual FX Animations ══════ */

        /* Screen shake — mild (mistakes, small blunders) */
        @keyframes board-shake-mild {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2px, 1px); }
          30% { transform: translate(2px, -1px); }
          50% { transform: translate(-1px, 2px); }
          70% { transform: translate(1px, -2px); }
          90% { transform: translate(-1px, 1px); }
        }
        .animate-board-shake-mild {
          animation: board-shake-mild 0.35s ease-out;
        }

        /* Screen shake — heavy (big blunders) */
        @keyframes board-shake-heavy {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-4px, 2px) rotate(-0.5deg); }
          20% { transform: translate(5px, -3px) rotate(0.5deg); }
          30% { transform: translate(-3px, 4px) rotate(-0.3deg); }
          40% { transform: translate(4px, -2px) rotate(0.4deg); }
          50% { transform: translate(-5px, 3px) rotate(-0.5deg); }
          60% { transform: translate(3px, -4px) rotate(0.3deg); }
          70% { transform: translate(-2px, 2px) rotate(-0.2deg); }
          80% { transform: translate(2px, -1px) rotate(0.1deg); }
          90% { transform: translate(-1px, 1px) rotate(0deg); }
        }
        .animate-board-shake-heavy {
          animation: board-shake-heavy 0.5s ease-out;
        }

        /* Board slam — catastrophic blunders (dramatic drop + bounce) */
        @keyframes board-slam {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          5% { transform: translate(0, -8px) scale(1.02) rotate(0deg); }
          15% { transform: translate(-6px, 6px) scale(0.98) rotate(-1deg); }
          25% { transform: translate(5px, -4px) scale(1.01) rotate(0.8deg); }
          35% { transform: translate(-4px, 5px) scale(0.99) rotate(-0.6deg); }
          45% { transform: translate(3px, -3px) scale(1) rotate(0.4deg); }
          55% { transform: translate(-2px, 2px) rotate(-0.3deg); }
          65% { transform: translate(2px, -1px) rotate(0.2deg); }
          75% { transform: translate(-1px, 1px) rotate(-0.1deg); }
          85% { transform: translate(1px, 0px) rotate(0deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        .animate-board-slam {
          animation: board-slam 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* Board flash overlay */
        @keyframes board-flash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-board-flash {
          animation: board-flash 0.5s ease-out forwards;
        }

        /* Crack lines drawing in */
        @keyframes crack-draw {
          0% { stroke-dashoffset: 200; opacity: 0; }
          10% { opacity: 0.6; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        .animate-crack-draw {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: crack-draw 2s ease-out forwards;
        }

        /* ELIMINATED text — dramatic scale-in */
        @keyframes elimination-in {
          0% { opacity: 0; transform: scale(3) rotate(-5deg); }
          30% { opacity: 1; transform: scale(0.9) rotate(1deg); }
          50% { transform: scale(1.05) rotate(-0.5deg); }
          70% { transform: scale(1) rotate(0deg); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: scale(0.95) translateY(5px); }
        }
        .animate-elimination-in {
          animation: elimination-in 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }


        /* Piece rain — falling chess pieces */
        @keyframes piece-fall {
          0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
          15% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(var(--rotation, 360deg)) translateX(var(--drift, 0px)); opacity: 0; }
        }
        .animate-piece-fall {
          animation: piece-fall 2.5s ease-in forwards;
        }

        /* ROUND announcement flash — Beast Games style */
        @keyframes round-flash {
          0% { opacity: 0; transform: scale(0.5); letter-spacing: 0.5em; }
          30% { opacity: 1; transform: scale(1.1); }
          50% { transform: scale(1); }
          100% { opacity: 1; transform: scale(1); letter-spacing: 0.3em; }
        }
        .animate-round-flash {
          animation: round-flash 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Ghost reaction — danmaku-style horizontal scroll (right → left) */
        @keyframes ghost-marquee {
          0% { left: 105%; opacity: 0; }
          4% { left: 92%; opacity: 1; }
          92% { left: -12%; opacity: 0.85; }
          100% { left: -20%; opacity: 0; }
        }
        .animate-ghost-marquee {
          animation: ghost-marquee 5s linear forwards;
        }

        /* Reaction confirm pulse */
        @keyframes reaction-confirm {
          0% { transform: scale(1); opacity: 1; }
          30% { transform: scale(1.6); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .animate-reaction-confirm {
          animation: reaction-confirm 1s ease-out forwards;
        }

        /* Film grain noise animation */
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }
        .animate-grain {
          animation: grain 8s steps(10) infinite;
        }

        /* Floating ember particles */
        @keyframes ember-drift {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
          25% { transform: translateY(-30vh) translateX(15px) scale(1.2); opacity: 1; }
          50% { transform: translateY(-55vh) translateX(-10px) scale(0.8); opacity: 0.7; }
          75% { transform: translateY(-75vh) translateX(20px) scale(1.1); opacity: 0.4; }
          100% { transform: translateY(-95vh) translateX(5px) scale(0.6); opacity: 0; }
        }
      `}</style>
    </main>
  );
}
