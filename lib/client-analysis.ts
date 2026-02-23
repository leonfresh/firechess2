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
    white?: { user?: { name?: string } };
    black?: { user?: { name?: string } };
  };
};

type ChessComArchiveList = {
  archives?: string[];
};

type ChessComGame = {
  pgn?: string;
  rules?: string;
  white?: { username?: string };
  black?: { username?: string };
};

type ChessComMonthArchive = {
  games?: ChessComGame[];
};

type SourceGame = {
  moves: string;
  whiteName?: string;
  blackName?: string;
  /** Clock times in centiseconds per half-move (ply), if available */
  clocks?: number[];
};

export type AnalysisSource = "lichess" | "chesscom";
export type ScanMode = "openings" | "tactics" | "both";

export type AnalysisProgress = {
  phase: "fetch" | "parse" | "aggregate" | "eval" | "tactics" | "done";
  message: string;
  current?: number;
  total?: number;
};

type AnalyzeOptions = {
  maxGames?: number;
  maxOpeningMoves?: number;
  cpLossThreshold?: number;
  engineDepth?: number;
  source?: AnalysisSource;
  scanMode?: ScanMode;
  /** Cap the number of missed tactics returned (default 25) */
  maxTactics?: number;
  onProgress?: (progress: AnalysisProgress) => void;
};

const MIN_POSITION_REPEATS = 3;
const CP_LOSS_THRESHOLD = 100;
const DEFAULT_MAX_GAMES = 200;
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
      message: `Chess.com archive ${archiveIndex + 1}/${archives.length}...`,
      current: archiveIndex + 1,
      total: archives.length
    });

    const monthData = await fetchJsonWithRetry<ChessComMonthArchive>(archiveUrl, 3, 20000);
    const monthGames = [...(monthData.games ?? [])].reverse();

    for (const game of monthGames) {
      if (collected.length >= maxGames) break;
      if (game.rules && game.rules !== "chess") continue;
      if (!game.pgn) continue;

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
  const maxGames = clampInt(options?.maxGames, DEFAULT_MAX_GAMES, 1, 1000);
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
      message: "Downloading recent games from Chess.com archives..."
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
      message: "Downloading recent games from Lichess..."
    });

    const payload = await fetchGamesNdjsonWithRetry(
      `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${maxGames}&moves=true&tags=false&opening=false&clocks=true&evals=false&pgnInJson=false`,
      3
    );

    games = sourceGamesFromLichess(parseGamesPayload(payload));
  }

  emitProgress(options, {
    phase: "parse",
    message: "Parsing games and extracting opening moves..."
  });

  const byFen = new Map<string, { totalReachCount: number; moveCounts: Map<string, number> }>();
  let gamesAnalyzed = 0;
  const gameTraces: GameOpeningTrace[] = [];

  if (doOpenings) {
  for (let gameIndex = 0; gameIndex < games.length; gameIndex += 1) {
    const game = games[gameIndex];

    if (gameIndex % 10 === 0 || gameIndex === games.length - 1) {
      emitProgress(options, {
        phase: "parse",
        message: `Processed ${gameIndex + 1}/${games.length} games...`,
        current: gameIndex + 1,
        total: games.length
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
    message: `Found ${repeatedEntries.length} repeated opening positions (min 3 games).`
  });

  emitProgress(options, {
    phase: "eval",
    message: `Evaluating positions with local Stockfish depth ${engineDepth} (no Lichess Cloud Eval).`
  });

  for (let index = 0; index < repeatedEntries.length; index += 1) {
    const [fenBefore, data] = repeatedEntries[index];

    repeatedPositions += 1;

    if (index % 5 === 0 || index === repeatedEntries.length - 1) {
      emitProgress(options, {
        phase: "eval",
        message: `Evaluating position ${index + 1}/${repeatedEntries.length}...`,
        current: index + 1,
        total: repeatedEntries.length
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
    message: "Scanning games for missed tactics..."
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

    if (gameIndex % 10 === 0 || gameIndex === games.length - 1) {
      emitProgress(options, {
        phase: "tactics",
        message: `Scanning game ${gameIndex + 1}/${games.length} for missed tactics...`,
        current: gameIndex + 1,
        total: games.length
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
    message: `Analysis complete: ${leaks.length} opening leaks, ${missedTactics.length} missed tactics.`
  });

  return {
    username,
    gamesAnalyzed,
    repeatedPositions,
    leaks,
    missedTactics,
    diagnostics: {
      gameTraces,
      positionTraces
    }
  };
}
