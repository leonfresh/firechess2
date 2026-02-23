import { Chess } from "chess.js";
import { stockfishClient } from "@/lib/stockfish-client";
import type {
  AnalyzeResponse,
  GameOpeningTrace,
  MissedTactic,
  MoveSquare,
  PlayerColor,
  PositionEvalTrace,
  RepeatedOpeningLeak
} from "@/lib/types";

type LichessGame = {
  moves?: string;
  clocks?: number[];
  players?: {
    white?: { user?: { name?: string }; rating?: number };
    black?: { user?: { name?: string }; rating?: number };
  };
};

type ChessComArchiveList = {
  archives?: string[];
};

type ChessComGame = {
  pgn?: string;
  rules?: string;
  time_class?: string;
  white?: { username?: string; rating?: number };
  black?: { username?: string; rating?: number };
};

type ChessComMonthArchive = {
  games?: ChessComGame[];
};

type SourceGame = {
  moves: string;
  whiteName?: string;
  blackName?: string;
  /** Player ratings if available from the source */
  whiteRating?: number;
  blackRating?: number;
  /** Clock times in centiseconds per half-move (ply), if available */
  clocks?: number[];
};

export type AnalysisSource = "lichess" | "chesscom";
export type ScanMode = "openings" | "tactics" | "both";
export type Speed = "bullet" | "blitz" | "rapid" | "classical";
export type TimeControl = Speed | "all";

export type AnalysisProgress = {
  phase: "fetch" | "parse" | "aggregate" | "eval" | "tactics" | "done";
  message: string;
  detail?: string;
  current?: number;
  total?: number;
  /** Overall progress 0-100 across all phases */
  percent: number;
};

type AnalyzeOptions = {
  maxGames?: number;
  maxOpeningMoves?: number;
  cpLossThreshold?: number;
  engineDepth?: number;
  source?: AnalysisSource;
  scanMode?: ScanMode;
  /** Filter games by time control — single value or array for multi-select (default "all") */
  timeControl?: TimeControl | TimeControl[];
  /** Cap the number of missed tactics returned (default 25) */
  maxTactics?: number;
  onProgress?: (progress: AnalysisProgress) => void;
};

const MIN_POSITION_REPEATS = 3;
const CP_LOSS_THRESHOLD = 100;
const DEFAULT_MAX_GAMES = 300;
const DEFAULT_MAX_OPENING_MOVES = 12;

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function isUciMove(move: string): boolean {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
}

function applyMoveToken(chess: Chess, moveToken: string): boolean {
  try {
    if (isUciMove(moveToken)) {
      return !!chess.move({
        from: moveToken.slice(0, 2),
        to: moveToken.slice(2, 4),
        promotion: moveToken.slice(4, 5) || undefined
      });
    }

    return !!chess.move(moveToken);
  } catch {
    return false;
  }
}

function parseGamesPayload(payload: string): LichessGame[] {
  return payload
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as LichessGame;
      } catch {
        return null;
      }
    })
    .filter((g): g is LichessGame => g !== null);
}

function sourceGamesFromLichess(games: LichessGame[]): SourceGame[] {
  return games
    .filter((game) => typeof game.moves === "string" && game.moves.trim().length > 0)
    .map((game) => ({
      moves: game.moves!.trim(),
      whiteName: game.players?.white?.user?.name,
      blackName: game.players?.black?.user?.name,
      whiteRating: game.players?.white?.rating,
      blackRating: game.players?.black?.rating,
      clocks: game.clocks
    }));
}

function parseMovesFromChessComPgn(pgn: string): { moves: string; clocks: number[] } | null {
  try {
    // Extract %clk annotations before loading (chess.js strips comments)
    const clockRegex = /\{\[%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)\]\}/g;
    const clocks: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = clockRegex.exec(pgn)) !== null) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = parseFloat(match[3]);
      // Store as centiseconds to match Lichess format
      clocks.push(Math.round((hours * 3600 + minutes * 60 + seconds) * 100));
    }

    const chess = new Chess();
    chess.loadPgn(pgn, { strict: false });
    const history = chess.history();
    if (!history.length) return null;
    return { moves: history.join(" "), clocks: clocks.length > 0 ? clocks : [] };
  } catch {
    return null;
  }
}

function scoreToCpFromUserPerspective(scoreCp: number | null, sideToMoveAtFen: PlayerColor, userColor: PlayerColor): number {
  if (typeof scoreCp !== "number") return 0;
  const multiplier = sideToMoveAtFen === userColor ? 1 : -1;
  return scoreCp * multiplier;
}

function computeFenAfterMove(fenBefore: string, moveToken: string): string | null {
  const chess = new Chess(fenBefore);
  const ok = applyMoveToken(chess, moveToken);
  return ok ? chess.fen() : null;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGamesNdjsonWithRetry(url: string, retries = 3): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          headers: { Accept: "application/x-ndjson" },
          cache: "no-store"
        },
        15000
      );

      if (response.ok) {
        return await response.text();
      }

      if (attempt < retries && (response.status === 408 || response.status === 429 || response.status >= 500)) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const backoffMs = retryAfter > 0 ? retryAfter * 1000 : 500 * Math.pow(2, attempt);
        await sleep(backoffMs);
        continue;
      }

      throw new Error(`Lichess games request failed (${response.status})`);
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await sleep(500 * Math.pow(2, attempt));
      }
    }
  }

  if (lastError instanceof Error) {
    throw new Error(
      `Browser cannot reach lichess.org (network timeout or block). Last error: ${lastError.message}`
    );
  }

  throw new Error("Browser cannot reach lichess.org (network timeout or block)");
}

/**
 * Stream Lichess NDJSON and call onGame for each parsed game line,
 * allowing real-time progress updates during download.
 */
async function streamLichessGames(
  url: string,
  maxGames: number,
  onGame: (count: number) => void,
  retries = 3
): Promise<LichessGame[]> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        url,
        { headers: { Accept: "application/x-ndjson" }, cache: "no-store" },
        60000 // longer timeout for streaming
      );

      if (!response.ok) {
        if (attempt < retries && (response.status === 408 || response.status === 429 || response.status >= 500)) {
          await sleep(500 * Math.pow(2, attempt));
          continue;
        }
        throw new Error(`Lichess games request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback: no streaming support
        const text = await response.text();
        const games = parseGamesPayload(text);
        onGame(games.length);
        return games.slice(0, maxGames);
      }

      const decoder = new TextDecoder();
      const games: LichessGame[] = [];
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete last line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            games.push(JSON.parse(trimmed) as LichessGame);
            onGame(games.length);
          } catch { /* skip malformed lines */ }

          if (games.length >= maxGames) {
            reader.cancel();
            return games.slice(0, maxGames);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          games.push(JSON.parse(buffer.trim()) as LichessGame);
          onGame(games.length);
        } catch { /* skip */ }
      }

      return games.slice(0, maxGames);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(500 * Math.pow(2, attempt));
      }
    }
  }

  if (lastError instanceof Error) {
    throw new Error(`Browser cannot reach lichess.org (network timeout or block). Last error: ${lastError.message}`);
  }
  throw new Error("Browser cannot reach lichess.org (network timeout or block)");
}

async function fetchJsonWithRetry<T>(
  url: string,
  retries = 3,
  timeoutMs = 15000,
  accept = "application/json"
): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          headers: { Accept: accept },
          cache: "no-store"
        },
        timeoutMs
      );

      if (response.ok) {
        return (await response.json()) as T;
      }

      if (attempt < retries && (response.status === 408 || response.status === 429 || response.status >= 500)) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const backoffMs = retryAfter > 0 ? retryAfter * 1000 : 500 * Math.pow(2, attempt);
        await sleep(backoffMs);
        continue;
      }

      throw new Error(`Request failed (${response.status})`);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(500 * Math.pow(2, attempt));
      }
    }
  }

  if (lastError instanceof Error) {
    throw new Error(`Network request failed. Last error: ${lastError.message}`);
  }

  throw new Error("Network request failed");
}

async function fetchChessComGamesInReverse(
  username: string,
  maxGames: number,
  options?: AnalyzeOptions
): Promise<SourceGame[]> {
  const normalizedUsername = normalizeName(username);
  const baseUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games`;

  const archiveList = await fetchJsonWithRetry<ChessComArchiveList>(`${baseUrl}/archives`, 3, 15000);
  const archives = [...(archiveList.archives ?? [])].reverse();

  if (archives.length === 0) {
    return [];
  }

  const collected: SourceGame[] = [];

  for (let archiveIndex = 0; archiveIndex < archives.length; archiveIndex += 1) {
    if (collected.length >= maxGames) break;

    const archiveUrl = archives[archiveIndex];
    emitProgress(options, {
      phase: "fetch",
      message: `📦 Downloading game archives`,
      detail: `Archive ${archiveIndex + 1} of ${archives.length}`,
      current: archiveIndex + 1,
      total: archives.length,
      percent: 2 + Math.round(((archiveIndex + 1) / archives.length) * 36),
    });

    const monthData = await fetchJsonWithRetry<ChessComMonthArchive>(archiveUrl, 3, 20000);
    const monthGames = [...(monthData.games ?? [])].reverse();

    for (const game of monthGames) {
      if (collected.length >= maxGames) break;
      if (game.rules && game.rules !== "chess") continue;
      if (!game.pgn) continue;

      // Time control filter for Chess.com games
      const tcRaw = options?.timeControl;
      const tcArr = Array.isArray(tcRaw) ? tcRaw : tcRaw ? [tcRaw] : ["all"];
      if (!tcArr.includes("all") && game.time_class) {
        // Chess.com uses "daily" instead of "classical" — map classical → both "classical" and "rapid" for chess.com
        const allowed = new Set<string>();
        for (const tc of tcArr) {
          if (tc === "classical") { allowed.add("rapid"); allowed.add("daily"); }
          else allowed.add(tc);
        }
        if (!allowed.has(game.time_class)) continue;
      }

      const whiteName = game.white?.username;
      const blackName = game.black?.username;
      const involvesUser =
        (whiteName && normalizeName(whiteName) === normalizedUsername) ||
        (blackName && normalizeName(blackName) === normalizedUsername);

      if (!involvesUser) continue;

      const parsed = parseMovesFromChessComPgn(game.pgn);
      if (!parsed) continue;

      collected.push({
        moves: parsed.moves,
        whiteName,
        blackName,
        whiteRating: game.white?.rating,
        blackRating: game.black?.rating,
        clocks: parsed.clocks.length > 0 ? parsed.clocks : undefined
      });
    }
  }

  return collected.slice(0, maxGames);
}

function emitProgress(options: AnalyzeOptions | undefined, progress: AnalysisProgress) {
  options?.onProgress?.(progress);
}

function clampInt(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function normalizeUci(move: string | null): MoveSquare | null {
  if (!move) return null;
  if (!isUciMove(move)) return null;
  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move.slice(4, 5) || undefined
  };
}

function sanForMove(fen: string, move: string | null): string | null {
  const parsed = normalizeUci(move);
  if (!parsed) return null;

  try {
    const chess = new Chess(fen);
    const result = chess.move({
      from: parsed.from,
      to: parsed.to,
      promotion: parsed.promotion as "q" | "r" | "b" | "n" | undefined
    });
    return result?.san ?? null;
  } catch {
    return null;
  }
}

function deriveLeakTags(args: {
  fenBefore: string;
  userMove: string;
  bestMove: string | null;
  cpLoss: number;
  reachCount: number;
  moveCount: number;
}): string[] {
  const tags = new Set<string>();
  const { fenBefore, userMove, bestMove, cpLoss, reachCount, moveCount } = args;
  const userSan = sanForMove(fenBefore, userMove);
  const bestSan = sanForMove(fenBefore, bestMove);

  if (cpLoss >= 250) tags.add("Major Blunder");
  else if (cpLoss >= 150) tags.add("Tactical Miss");

  if (reachCount > 0 && moveCount / reachCount >= 0.7) {
    tags.add("Repeated Habit");
  }

  if (bestSan?.includes("O-O") && !userSan?.includes("O-O")) {
    tags.add("King Safety");
  }

  if (bestSan?.includes("+") && !userSan?.includes("+")) {
    tags.add("Missed Check");
  }

  if (bestSan?.includes("x") && !userSan?.includes("x")) {
    tags.add("Missed Capture");
  }

  const bestParsed = normalizeUci(bestMove);
  const userParsed = normalizeUci(userMove);
  const centerSquares = new Set(["d4", "e4", "d5", "e5"]);

  if (bestParsed && userParsed && centerSquares.has(bestParsed.to) && !centerSquares.has(userParsed.to)) {
    tags.add("Center Control");
  }

  try {
    const chess = new Chess(fenBefore);
    const fullMoveNumber = Number(chess.fen().split(" ")[5] ?? "1");
    if (fullMoveNumber <= 10 && userParsed) {
      const movedPiece = chess.get(userParsed.from as Parameters<Chess["get"]>[0]);
      if (movedPiece?.type === "q" || movedPiece?.type === "k") {
        tags.add("Opening Development");
      }
    }
  } catch {
    // keep best-effort tags only
  }

  if (tags.size === 0) {
    tags.add("Inaccuracy");
  }

  return [...tags].slice(0, 3);
}

/**
 * Convert a SAN move token to UCI format using chess.js
 */
function moveToUci(chess: Chess, moveToken: string): string | null {
  try {
    const tempChess = new Chess(chess.fen());
    const result = tempChess.move(moveToken, { strict: false });
    if (!result) return null;
    return result.from + result.to + (result.promotion ?? "");
  } catch {
    return null;
  }
}

/**
 * Derive descriptive tags for a missed tactic
 */
function deriveTacticTags(args: {
  fenBefore: string;
  userMove: string;
  bestMove: string;
  bestMoveSan: string;
  cpLoss: number;
  cpBefore: number;
}): string[] {
  const tags: string[] = [];
  const { fenBefore, bestMoveSan, cpLoss, cpBefore } = args;

  // Severity
  if (cpLoss >= 600) tags.push("Winning Blunder");
  else if (cpLoss >= 400) tags.push("Major Miss");
  else tags.push("Tactical Miss");

  // Type of tactic
  if (bestMoveSan.includes("#")) {
    tags.push("Missed Mate");
  } else if (bestMoveSan.includes("+") && bestMoveSan.includes("x")) {
    tags.push("Forcing Capture");
  } else if (bestMoveSan.includes("+")) {
    tags.push("Missed Check");
  } else if (bestMoveSan.includes("x")) {
    tags.push("Missed Capture");
  }

  // Context
  if (cpBefore >= 200) {
    tags.push("Converting Advantage");
  } else if (cpBefore >= -50 && cpBefore <= 50) {
    tags.push("Equal Position");
  }

  // Piece type from SAN
  try {
    if (bestMoveSan.startsWith("N") && bestMoveSan.includes("x")) {
      tags.push("Knight Fork?");
    } else if (bestMoveSan.startsWith("Q") && bestMoveSan.includes("x")) {
      tags.push("Queen Tactic");
    }
  } catch {
    // best-effort
  }

  // Check if it's a back-rank or king attack pattern
  try {
    const chess = new Chess(fenBefore);
    const sideToMove = chess.turn() === "w" ? "white" : "black";
    const oppKingSquare = findKingSquare(chess, sideToMove === "white" ? "black" : "white");
    if (oppKingSquare) {
      const rank = oppKingSquare.charAt(1);
      if ((sideToMove === "white" && rank === "8") || (sideToMove === "black" && rank === "1")) {
        if (bestMoveSan.includes("+") || bestMoveSan.includes("#")) {
          tags.push("Back Rank");
        }
      }
    }
  } catch {
    // best-effort
  }

  return tags.slice(0, 3);
}

function findKingSquare(chess: Chess, color: "white" | "black"): string | null {
  const board = chess.board();
  const targetColor = color === "white" ? "w" : "b";
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      if (square && square.type === "k" && square.color === targetColor) {
        const fileChar = String.fromCharCode("a".charCodeAt(0) + file);
        const rankChar = String(8 - rank);
        return fileChar + rankChar;
      }
    }
  }
  return null;
}

export async function analyzeOpeningLeaksInBrowser(
  username: string,
  options?: AnalyzeOptions
): Promise<AnalyzeResponse> {
  const source: AnalysisSource = options?.source ?? "lichess";
  const maxGames = clampInt(options?.maxGames, DEFAULT_MAX_GAMES, 1, 5000);
  const maxOpeningMoves = clampInt(options?.maxOpeningMoves, DEFAULT_MAX_OPENING_MOVES, 1, 30);
  const cpLossThreshold = clampInt(options?.cpLossThreshold, CP_LOSS_THRESHOLD, 1, 1000);
  const engineDepth = clampInt(options?.engineDepth, 10, 6, 24);
  const maxOpeningPlies = maxOpeningMoves * 2;
  const scanMode: ScanMode = options?.scanMode ?? "both";
  const doOpenings = scanMode === "openings" || scanMode === "both";
  const doTactics = scanMode === "tactics" || scanMode === "both";

  let games: SourceGame[] = [];

  if (source === "chesscom") {
    emitProgress(options, {
      phase: "fetch",
      message: "🌐 Connecting to Chess.com",
      detail: "Fetching your recent game archives...",
      percent: 2,
    });

    try {
      games = await fetchChessComGamesInReverse(username, maxGames, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      throw new Error(`Browser cannot reach api.chess.com. Last error: ${message}`);
    }
  } else {
    emitProgress(options, {
      phase: "fetch",
      message: "🌐 Connecting to Lichess",
      detail: "Streaming your recent games...",
      percent: 2,
    });

    // Build Lichess URL with optional time control filter (supports multi-select)
    const tcRaw = options?.timeControl;
    const tcArr = Array.isArray(tcRaw) ? tcRaw : tcRaw ? [tcRaw] : ["all"];
    const lichessPerfs = tcArr
      .filter((t): t is Speed => t !== "all")
      .map((t) => t); // Lichess perfType values match our Speed type directly
    const perfParam = lichessPerfs.length > 0
      ? `&perfType=${lichessPerfs.join(",")}`
      : "";
    const lichessUrl = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${maxGames}&moves=true&opening=false&clocks=true&evals=false&pgnInJson=false${perfParam}`;

    const lichessGames = await streamLichessGames(
      lichessUrl,
      maxGames,
      (count) => {
        emitProgress(options, {
          phase: "fetch",
          message: "🌐 Downloading from Lichess",
          detail: `${count} of ${maxGames} games received`,
          current: count,
          total: maxGames,
          percent: 2 + Math.round((count / maxGames) * 36),
        });
      },
      3
    );

    games = sourceGamesFromLichess(lichessGames);
  }

  emitProgress(options, {
    phase: "parse",
    message: "📖 Parsing games",
    detail: `Extracting opening moves from ${games.length} games...`,
    percent: 40,
  });

  const byFen = new Map<string, { totalReachCount: number; moveCounts: Map<string, number> }>();
  let gamesAnalyzed = 0;
  const playerRatings: number[] = [];
  const gameTraces: GameOpeningTrace[] = [];

  if (doOpenings) {
  for (let gameIndex = 0; gameIndex < games.length; gameIndex += 1) {
    const game = games[gameIndex];

    if (gameIndex % 10 === 0 || gameIndex === games.length - 1) {
      emitProgress(options, {
        phase: "parse",
        message: `📖 Parsing games`,
        detail: `${gameIndex + 1} of ${games.length} games processed`,
        current: gameIndex + 1,
        total: games.length,
        percent: 40 + Math.round(((gameIndex + 1) / games.length) * 15),
      });
    }

    if (!game.moves) continue;

    const whiteName = game.whiteName;
    const blackName = game.blackName;
    const target = normalizeName(username);

    const userColor: PlayerColor | null =
      whiteName && normalizeName(whiteName) === target
        ? "white"
        : blackName && normalizeName(blackName) === target
          ? "black"
          : null;

    if (!userColor) continue;

    // Collect player rating
    const gameRating = userColor === "white" ? game.whiteRating : game.blackRating;
    if (gameRating && gameRating > 0) playerRatings.push(gameRating);

    gamesAnalyzed += 1;

    const chess = new Chess();
    const moveTokens = game.moves.split(" ").filter(Boolean).slice(0, maxOpeningPlies);
    const openingMovesPlayed: string[] = [];

    for (let ply = 0; ply < moveTokens.length; ply += 1) {
      const sideToMove: PlayerColor = ply % 2 === 0 ? "white" : "black";
      const token = moveTokens[ply];

      if (sideToMove === userColor) {
        const fenBefore = chess.fen();
        const existing = byFen.get(fenBefore) ?? {
          totalReachCount: 0,
          moveCounts: new Map<string, number>()
        };

        existing.totalReachCount += 1;
        existing.moveCounts.set(token, (existing.moveCounts.get(token) ?? 0) + 1);
        byFen.set(fenBefore, existing);
      }

      const ok = applyMoveToken(chess, token);
      if (!ok) break;
      openingMovesPlayed.push(token);
    }

    gameTraces.push({
      gameIndex: gameTraces.length + 1,
      userColor,
      openingMoves: openingMovesPlayed
    });
  }
  } // end if (doOpenings)

  // Count games even in tactics-only mode
  if (!doOpenings) {
    for (const game of games) {
      if (!game.moves) continue;
      const whiteName = game.whiteName;
      const blackName = game.blackName;
      const target = normalizeName(username);
      const userColor =
        (whiteName && normalizeName(whiteName) === target)
          ? "white"
          : (blackName && normalizeName(blackName) === target)
            ? "black"
            : null;
      if (userColor) gamesAnalyzed += 1;
    }
  }

  const leaks: RepeatedOpeningLeak[] = [];
  const positionTraces: PositionEvalTrace[] = [];
  let repeatedPositions = 0;

  if (doOpenings) {
  const repeatedEntries = [...byFen.entries()].filter(([, data]) => data.totalReachCount >= MIN_POSITION_REPEATS);

  emitProgress(options, {
    phase: "aggregate",
    message: `🔍 ${repeatedEntries.length} recurring positions found`,
    detail: "Positions you've reached 3+ times — these are your opening habits",
    percent: 56,
  });

  emitProgress(options, {
    phase: "eval",
    message: `🧠 Stockfish evaluation starting`,
    detail: `Depth ${engineDepth} analysis on ${repeatedEntries.length} positions`,
    percent: 58,
  });

  for (let index = 0; index < repeatedEntries.length; index += 1) {
    const [fenBefore, data] = repeatedEntries[index];

    repeatedPositions += 1;

    if (index % 5 === 0 || index === repeatedEntries.length - 1) {
      emitProgress(options, {
        phase: "eval",
        message: `🧠 Evaluating positions`,
        detail: `Position ${index + 1} of ${repeatedEntries.length}`,
        current: index + 1,
        total: repeatedEntries.length,
        percent: 58 + Math.round(((index + 1) / repeatedEntries.length) * 22),
      });
    }

    let chosenMove = "";
    let chosenCount = -1;

    for (const [move, count] of data.moveCounts.entries()) {
      if (count > chosenCount) {
        chosenMove = move;
        chosenCount = count;
      }
    }

    if (!chosenMove) continue;

    const fenAfter = computeFenAfterMove(fenBefore, chosenMove);
    if (!fenAfter) {
      positionTraces.push({
        fenBefore,
        userMove: chosenMove,
        bestMove: null,
        reachCount: data.totalReachCount,
        moveCount: chosenCount,
        evalBefore: null,
        evalAfter: null,
        cpLoss: null,
        flagged: false,
        skippedReason: "invalid_move"
      });
      continue;
    }

    const sideToMove: PlayerColor = fenBefore.includes(" w ") ? "white" : "black";
    const beforeEval = await stockfishClient.evaluateFen(fenBefore, engineDepth);
    const afterEval = await stockfishClient.evaluateFen(fenAfter, engineDepth);

    if (!beforeEval || !afterEval) {
      positionTraces.push({
        fenBefore,
        userMove: chosenMove,
        bestMove: beforeEval?.bestMove ?? null,
        reachCount: data.totalReachCount,
        moveCount: chosenCount,
        evalBefore: null,
        evalAfter: null,
        cpLoss: null,
        flagged: false,
        skippedReason: "missing_eval"
      });
      continue;
    }

    const evalBefore = scoreToCpFromUserPerspective(beforeEval.cp, sideToMove, sideToMove);
    const opponentToMove: PlayerColor = sideToMove === "white" ? "black" : "white";
    const evalAfter = scoreToCpFromUserPerspective(afterEval.cp, opponentToMove, sideToMove);
    const cpLoss = evalBefore - evalAfter;
    const flagged = cpLoss > cpLossThreshold;
    const tags = deriveLeakTags({
      fenBefore,
      userMove: chosenMove,
      bestMove: beforeEval.bestMove,
      cpLoss,
      reachCount: data.totalReachCount,
      moveCount: chosenCount
    });

    positionTraces.push({
      fenBefore,
      userMove: chosenMove,
      bestMove: beforeEval.bestMove,
      reachCount: data.totalReachCount,
      moveCount: chosenCount,
      evalBefore,
      evalAfter,
      cpLoss,
      flagged
    });

    if (!flagged) continue;

    leaks.push({
      fenBefore,
      fenAfter,
      userMove: chosenMove,
      bestMove: beforeEval.bestMove,
        tags,
      reachCount: data.totalReachCount,
      moveCount: chosenCount,
      cpLoss,
      evalBefore,
      evalAfter,
      sideToMove,
      userColor: sideToMove
    });
  }

  leaks.sort((a, b) => b.cpLoss - a.cpLoss);
  } // end if (doOpenings)

  /* ── Phase: Missed Tactics Detection ─────────────────────────── */

  const TACTIC_CP_THRESHOLD = 200;
  const MAX_TACTICS = options?.maxTactics ?? 25;
  const missedTactics: MissedTactic[] = [];

  if (doTactics) {

  emitProgress(options, {
    phase: "tactics",
    message: "⚔️ Hunting for missed tactics",
    detail: `Scanning ${games.length} games for blunders and missed wins...`,
    percent: 81,
  });

  const seenTacticFens = new Set<string>();

  for (let gameIndex = 0; gameIndex < games.length; gameIndex += 1) {
    if (missedTactics.length >= MAX_TACTICS) break;

    const game = games[gameIndex];
    if (!game.moves) continue;

    const whiteName = game.whiteName;
    const blackName = game.blackName;
    const target = normalizeName(username);

    const userColor: PlayerColor | null =
      whiteName && normalizeName(whiteName) === target
        ? "white"
        : blackName && normalizeName(blackName) === target
          ? "black"
          : null;

    if (!userColor) continue;

    // Collect rating if not already done via openings scan
    if (!doOpenings) {
      const gameRating = userColor === "white" ? game.whiteRating : game.blackRating;
      if (gameRating && gameRating > 0) playerRatings.push(gameRating);
    }

    if (gameIndex % 10 === 0 || gameIndex === games.length - 1) {
      emitProgress(options, {
        phase: "tactics",
        message: `⚔️ Scanning for missed tactics`,
        detail: `Game ${gameIndex + 1} of ${games.length}`,
        current: gameIndex + 1,
        total: games.length,
        percent: 81 + Math.round(((gameIndex + 1) / games.length) * 16),
      });
    }

    const chess = new Chess();
    const allTokens = game.moves.split(" ").filter(Boolean);

    for (let ply = 0; ply < allTokens.length; ply += 1) {
      if (missedTactics.length >= MAX_TACTICS) break;

      const sideToMove: PlayerColor = ply % 2 === 0 ? "white" : "black";
      const token = allTokens[ply];
      const fenBefore = chess.fen();

      if (sideToMove === userColor && !seenTacticFens.has(fenBefore)) {
        // Quick heuristic: check if captures or checks exist
        const legalMoves = chess.moves({ verbose: true });
        const hasForcingMoves = legalMoves.some(
          (m) => m.captured || m.san.includes("+") || m.san.includes("#")
        );

        if (hasForcingMoves) {
          // Evaluate position before the move
          const beforeEval = await stockfishClient.evaluateFen(fenBefore, engineDepth);

          if (beforeEval && beforeEval.bestMove) {
            // Check if best move is a forcing move (capture/check)
            const bestMoveSan = sanForMove(fenBefore, beforeEval.bestMove);
            const isBestMoveForcing =
              bestMoveSan &&
              (bestMoveSan.includes("x") || bestMoveSan.includes("+") || bestMoveSan.includes("#"));

            if (isBestMoveForcing) {
              // Check if user played a different move
              const userUci = moveToUci(chess, token);

              if (userUci && userUci !== beforeEval.bestMove) {
                // Evaluate after user's move
                const fenAfterUser = computeFenAfterMove(fenBefore, token);

                if (fenAfterUser) {
                  const afterEval = await stockfishClient.evaluateFen(fenAfterUser, engineDepth);

                  if (afterEval) {
                    const cpBefore = scoreToCpFromUserPerspective(
                      beforeEval.cp,
                      sideToMove,
                      userColor
                    );
                    const opponentSide: PlayerColor = sideToMove === "white" ? "black" : "white";
                    const cpAfterUser = scoreToCpFromUserPerspective(
                      afterEval.cp,
                      opponentSide,
                      userColor
                    );

                    const cpLoss = cpBefore - cpAfterUser;

                    // Skip if user was already heavily losing
                    if (cpBefore < -300) {
                      // Don't flag tactics when already lost
                    } else if (cpLoss >= TACTIC_CP_THRESHOLD) {
                      const fullMoveNumber = Math.floor(ply / 2) + 1;
                      const tacticTags = deriveTacticTags({
                        fenBefore,
                        userMove: userUci,
                        bestMove: beforeEval.bestMove,
                        bestMoveSan: bestMoveSan,
                        cpLoss,
                        cpBefore
                      });

                      // Extract clock time for this ply (centiseconds → seconds)
                      let timeRemainingSec: number | null = null;
                      if (game.clocks && ply < game.clocks.length) {
                        timeRemainingSec = Math.round(game.clocks[ply] / 100);
                      }

                      // Add time pressure tag if under 30 seconds
                      if (typeof timeRemainingSec === "number" && timeRemainingSec <= 30) {
                        tacticTags.push("Time Pressure");
                      }

                      missedTactics.push({
                        fenBefore,
                        fenAfter: fenAfterUser,
                        userMove: userUci,
                        bestMove: beforeEval.bestMove,
                        cpBefore,
                        cpAfter: cpAfterUser,
                        cpLoss,
                        sideToMove,
                        userColor,
                        gameIndex: gameIndex + 1,
                        moveNumber: fullMoveNumber,
                        tags: tacticTags,
                        timeRemainingSec
                      });

                      seenTacticFens.add(fenBefore);
                    }
                  }
                }
              }
            }
          }
        }
      }

      const ok = applyMoveToken(chess, token);
      if (!ok) break;
    }
  }

  missedTactics.sort((a, b) => b.cpLoss - a.cpLoss);
  } // end if (doTactics)

  emitProgress(options, {
    phase: "done",
    message: `✅ Analysis complete`,
    detail: `Found ${leaks.length} opening leak${leaks.length !== 1 ? "s" : ""} and ${missedTactics.length} missed tactic${missedTactics.length !== 1 ? "s" : ""}`,
    percent: 100,
  });

  // Compute median player rating from games
  const playerRating: number | null = playerRatings.length > 0
    ? (() => {
        const sorted = [...playerRatings].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
          ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
          : sorted[mid];
      })()
    : null;

  // ── Compute Time Management Score (0-100) from clock data ──
  // Measures: consistency of move timing, avoiding time scrambles, not wasting time
  const timeManagementScore = (() => {
    const allMoveTimesMs: number[] = [];
    let timeScrambleCount = 0;
    let gamesWithClocks = 0;

    for (const game of games) {
      if (!game.clocks || game.clocks.length < 4) continue;
      gamesWithClocks++;

      const target = normalizeName(username);
      const userColor: "white" | "black" | null =
        game.whiteName && normalizeName(game.whiteName) === target ? "white"
        : game.blackName && normalizeName(game.blackName) === target ? "black"
        : null;
      if (!userColor) continue;

      // Extract user's clock values (every other ply starting at 0 for white, 1 for black)
      const startPly = userColor === "white" ? 0 : 1;
      const userClocks: number[] = [];
      for (let p = startPly; p < game.clocks.length; p += 2) {
        userClocks.push(game.clocks[p]); // centiseconds remaining
      }

      if (userClocks.length < 2) continue;

      // Compute time spent per move (diff between consecutive own clocks)
      // Note: clocks[i] is remaining time AFTER move i, so time spent = clocks[i-1] - clocks[i]
      // (can be negative if increment is given — clamp to 0)
      const startTime = userClocks[0]; // remaining after first move
      for (let i = 1; i < userClocks.length; i++) {
        const spent = Math.max(0, userClocks[i - 1] - userClocks[i]);
        allMoveTimesMs.push(spent); // in centiseconds
      }

      // Check for time scramble: remaining time drops below 10% of initial time
      const initialTime = userClocks[0]; // rough initial time (after move 1)
      if (initialTime > 0) {
        const minRemaining = Math.min(...userClocks);
        if (minRemaining < initialTime * 0.1) {
          timeScrambleCount++;
        }
      }
    }

    if (gamesWithClocks < 2 || allMoveTimesMs.length < 10) return null;

    // Convert to seconds for readability
    const moveTimesSec = allMoveTimesMs.map(c => c / 100);

    // 1. Consistency: coefficient of variation (lower = more consistent = better)
    const mean = moveTimesSec.reduce((s, v) => s + v, 0) / moveTimesSec.length;
    const variance = moveTimesSec.reduce((s, v) => s + (v - mean) ** 2, 0) / moveTimesSec.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 2;
    // CV of ~0.5 = very consistent (90+), CV of ~1.5 = erratic (~40), CV of ~3+ = terrible
    const consistencyScore = Math.max(0, Math.min(100, 100 * Math.exp(-cv * 0.8)));

    // 2. Time scramble penalty: percentage of games with scrambles
    const scrambleRate = timeScrambleCount / gamesWithClocks;
    // 0% scrambles = 100, 20% = ~67, 50% = ~37
    const scrambleScore = Math.max(0, Math.min(100, 100 * Math.exp(-scrambleRate * 2)));

    // 3. Time waste: penalise if >30% of total time is spent in the first 5 moves
    const earlyMoves = moveTimesSec.slice(0, Math.min(5, moveTimesSec.length));
    const totalTime = moveTimesSec.reduce((s, v) => s + v, 0);
    const earlyTime = earlyMoves.reduce((s, v) => s + v, 0);
    const earlyRatio = totalTime > 0 ? earlyTime / totalTime : 0;
    // 15% early = perfect (100), 30% = ~74, 50% = ~37
    const wasteScore = Math.max(0, Math.min(100, 100 * Math.exp(-Math.max(0, earlyRatio - 0.15) * 5)));

    // Weighted blend
    return Math.round(consistencyScore * 0.45 + scrambleScore * 0.35 + wasteScore * 0.20);
  })();

  return {
    username,
    gamesAnalyzed,
    repeatedPositions,
    leaks,
    missedTactics,
    playerRating,
    timeManagementScore,
    diagnostics: {
      gameTraces,
      positionTraces
    }
  };
}
