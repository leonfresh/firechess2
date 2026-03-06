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
import { playSound, preloadSounds } from "@/lib/sounds";
import { stockfishPool } from "@/lib/stockfish-client";
import {
  classifyMove,
  generateMoveComment,
  getEloFlavorLine,
  getOpeningRoast,
  getEloGuessComment,
  getClosingRoast,
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
/*  Mood from classification                                            */
/* ================================================================== */

function getMood(move: { classification: MoveClassification; cpLoss: number } | null, blunderCount?: number): RoastMood {
  if (!move) return "neutral";
  switch (move.classification) {
    case "brilliant": return "mindblown";
    case "great": case "best": return Math.random() < 0.3 ? "thinking" : "smug";
    case "good": return Math.random() < 0.15 ? "smug" : "neutral";
    case "inaccuracy": return Math.random() < 0.3 ? "disappointed" : "suspicious";
    case "mistake": {
      const r = Math.random();
      if (r < 0.25) return "crylaugh";
      if (r < 0.45) return "clown";
      return "disappointed";
    }
    case "blunder": {
      // More expressive for blunders — escalate with repeated blunders
      const r = Math.random();
      if (move.cpLoss > 600) return r < 0.5 ? "clown" : "crylaugh";
      if (move.cpLoss > 400) {
        if (r < 0.3) return "clown";
        if (r < 0.6) return "crylaugh";
        return "laughing";
      }
      if ((blunderCount ?? 0) >= 4) return r < 0.5 ? "rage" : "clown";
      if (r < 0.3) return "crylaugh";
      if (r < 0.5) return "laughing";
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

  /* ── Source selection state ── */
  const [inputMode, setInputMode] = useState<"random" | "import" | "paste" | null>(null);
  const [loadSource, setLoadSource] = useState<"lichess" | "chesscom">("lichess");
  const [loadUsername, setLoadUsername] = useState("");
  const [loadingGames, setLoadingGames] = useState(false);
  const [recentGames, setRecentGames] = useState<{ white: string; black: string; whiteElo: number; blackElo: number; date: string; result: string; pgn: string; event?: string }[]>([]);
  const [loadError, setLoadError] = useState("");
  const [pgnInput, setPgnInput] = useState("");

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
    usedLines.current.clear();
    setActiveComment(null);
    setCurrentMood("neutral");

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

      // Inject opening roast onto an early move (book territory, moves 3-8)
      const openingRoast = getOpeningRoast(data.opening);
      const openingTarget = analyzed.findIndex((m, i) => i >= 2 && i <= 7 && !m.comment);
      if (openingTarget >= 0) {
        analyzed[openingTarget].comment = openingRoast;
      } else if (analyzed.length > 2 && !analyzed[2].comment) {
        analyzed[2].comment = openingRoast;
      }

      // Inject closing game summary roast on the last move
      // Don't overwrite blunder/mistake comments — use the second-to-last move instead
      if (analyzed.length > 0) {
        let closingIdx = analyzed.length - 1;
        const closingRoast = getClosingRoast(totalBlunders, totalMistakes, totalInaccuracies, analyzed.length);
        if (analyzed[closingIdx].comment && 
            (analyzed[closingIdx].classification === "blunder" || analyzed[closingIdx].classification === "mistake")) {
          // Last move has an important roast — put closing on second-to-last if available
          if (analyzed.length > 1 && !analyzed[closingIdx - 1].comment) {
            closingIdx = closingIdx - 1;
          } else {
            // Append closing to existing comment
            analyzed[closingIdx].comment = analyzed[closingIdx].comment + "\n\n" + closingRoast;
            closingIdx = -1; // skip overwrite
          }
        }
        if (closingIdx >= 0) {
          analyzed[closingIdx].comment = closingRoast;
        }
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
    usedLines.current.clear();
    setActiveComment(null);
    setCurrentMood("neutral");

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
        try {
          const pv = await stockfishPool.getPrincipalVariation(fenBefore, 1, 12);
          if (pv?.pvMoves?.[0]) {
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

      // Inject opening roast
      const openingRoast = getOpeningRoast(data.opening);
      const openingTarget = analyzed.findIndex((m, i) => i >= 2 && i <= 7 && !m.comment);
      if (openingTarget >= 0) analyzed[openingTarget].comment = openingRoast;
      else if (analyzed.length > 2 && !analyzed[2].comment) analyzed[2].comment = openingRoast;

      // Inject closing game summary roast on the last move
      // Don't overwrite blunder/mistake comments — use the second-to-last move instead
      if (analyzed.length > 0) {
        let closingIdx = analyzed.length - 1;
        const closingRoast = getClosingRoast(totalBlunders, totalMistakes, totalInaccuracies, analyzed.length);
        if (analyzed[closingIdx].comment && 
            (analyzed[closingIdx].classification === "blunder" || analyzed[closingIdx].classification === "mistake")) {
          if (analyzed.length > 1 && !analyzed[closingIdx - 1].comment) {
            closingIdx = closingIdx - 1;
          } else {
            analyzed[closingIdx].comment = analyzed[closingIdx].comment + "\n\n" + closingRoast;
            closingIdx = -1;
          }
        }
        if (closingIdx >= 0) {
          analyzed[closingIdx].comment = closingRoast;
        }
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
  }, []);

  /* ── Autoplay (waits for typewriter + TTS to finish) ── */
  useEffect(() => {
    if (pageState !== "watching" || !autoplay) return;
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

        if (move.comment) {
          setActiveComment(move.comment);
          setCommentHistory(prev => [...prev, move.comment!]);
          setCurrentMood(getMood(move, blunders));
          setActiveArrows(move.arrows ?? []);
          setActiveMarkers(move.markers ?? []);
        } else {
          setActiveComment(null);
          setCurrentMood(getMood(move, blunders));
          setActiveArrows([]);
          setActiveMarkers([]);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageState, autoplay, currentIdx, moves, speed, typingDone, activeComment, tts.enabled, tts.speaking, ttsDoneSignal]);

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
    // Show the current move's comment in the speech bubble (if any)
    const cur = idx >= 0 ? moves[idx] : null;
    setCurrentMood(cur ? getMood(cur, blunders) : "neutral");
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
          <p className="mt-1.5 text-xs text-slate-500">
            🚧 Beta — got feedback? <a href="/feedback" className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors">Let us know</a>
          </p>
          {gamesPlayed > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Score: <span className="font-bold text-amber-400">{score}</span> / {gamesPlayed * 3} ({gamesPlayed} games)
            </p>
          )}
        </div>

        {/* ── Source Selection ── */}
        {pageState === "choose-source" && !analyzing && (
          <div className="mx-auto max-w-2xl py-8 animate-fadeIn">
            {/* Three source option cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* Random game */}
              <button
                type="button"
                onClick={() => { setInputMode("random"); fetchGame(); }}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center transition-all hover:border-orange-500/30 hover:bg-orange-500/[0.04] cursor-pointer"
              >
                <span className="mb-3 flex justify-center text-3xl">🎲</span>
                <p className="text-sm font-bold text-orange-400 group-hover:text-orange-300">Random Game</p>
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">Watch a random Lichess game and guess the Elo</p>
              </button>

              {/* Import from Lichess / Chess.com */}
              <button
                type="button"
                onClick={() => setInputMode("import")}
                className={`group rounded-2xl border p-6 text-center transition-all cursor-pointer ${
                  inputMode === "import"
                    ? "border-blue-500/30 bg-blue-500/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-blue-500/20 hover:bg-blue-500/[0.04]"
                }`}
              >
                <span className="mb-3 flex justify-center text-3xl">📥</span>
                <p className="text-sm font-bold text-blue-400 group-hover:text-blue-300">Import Games</p>
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">Load from Lichess or Chess.com by username</p>
              </button>

              {/* Paste PGN */}
              <button
                type="button"
                onClick={() => setInputMode("paste")}
                className={`group rounded-2xl border p-6 text-center transition-all cursor-pointer ${
                  inputMode === "paste"
                    ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/20 hover:bg-emerald-500/[0.04]"
                }`}
              >
                <span className="mb-3 flex justify-center text-3xl">📋</span>
                <p className="text-sm font-bold text-emerald-400 group-hover:text-emerald-300">Paste PGN</p>
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">Paste any PGN to get it roasted</p>
              </button>
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
          </div>
        )}

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
                <p>🏁 Result: <span className="font-mono text-slate-500">???</span></p>
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
          <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-[1fr_360px]">
            {/* Board column */}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
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

              {/* Commentary text below board */}
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
                        onClick={skipToGuess}
                        className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        Skip to Guess →
                      </button>
                    </>
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

                  {/* Result + Opening */}
                  <div className="text-center text-xs text-slate-500 space-y-0.5">
                    <p>🏁 {game.result}{game.termination ? ` — ${game.termination}` : ""}</p>
                    <p>📋 {game.opening}</p>
                  </div>

                  {/* Share result */}
                  <button
                    onClick={() => {
                      const bracket = selectedBracket !== null ? ELO_BRACKETS[selectedBracket] : null;
                      const actualBracket = ELO_BRACKETS[getEloBracketIdx(game.avgElo)];
                      const diff = selectedBracket !== null ? Math.abs(selectedBracket - getEloBracketIdx(game.avgElo)) : 99;
                      const emoji = diff === 0 ? "🎯" : diff === 1 ? "🔥" : "💀";
                      const text = [
                        `${emoji} Roast the Elo — I guessed ${bracket?.label ?? "?"} and the actual Elo was ${game.avgElo} (${actualBracket.label})`,
                        `💀 ${blunders} blunders · ❌ ${mistakes} mistakes · ⚠️ ${inaccuracies} inaccuracies`,
                        `🐸 Try it yourself: firechess.app/roast`,
                      ].join("\n");
                      navigator.clipboard.writeText(text).then(() => {
                        setShareText("Copied!");
                        setTimeout(() => setShareText(null), 2000);
                      }).catch(() => {
                        setShareText("Copy failed");
                        setTimeout(() => setShareText(null), 2000);
                      });
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2"
                  >
                    {shareText ?? "📋 Share Result"}
                  </button>

                  {/* Re-watch */}
                  <button
                    onClick={() => {
                      setPageState("watching");
                      setCurrentIdx(-1);
                      setFen("start");
                      setLastMove(null);
                      setCommentHistory([]);
                      setActiveComment(null);
                      setAutoplay(true);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-400 hover:bg-white/[0.08] transition-all"
                  >
                    🔁 Re-watch Game
                  </button>

                  <button
                    onClick={() => {
                      setPageState("choose-source");
                      setInputMode(null);
                      setLoadError("");
                      setRecentGames([]);
                      setPgnInput("");
                    }}
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
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 0.8s step-end infinite;
        }
      `}</style>
    </main>
  );
}
