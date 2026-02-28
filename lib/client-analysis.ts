import { Chess } from "chess.js";
import { stockfishPool } from "@/lib/stockfish-client";
import { fetchExplorerMoves } from "@/lib/lichess-explorer";
import type {
  AnalyzeResponse,
  EndgameMistake,
  EndgameStats,
  EndgameType,
  GameOpeningTrace,
  MentalStats,
  OpeningSummary,
  MissedTactic,
  MoveSquare,
  PlayerColor,
  PositionEvalTrace,
  RepeatedOpeningLeak,
  TimeMoment,
  TimeManagementReport,
  TimeVerdict,
} from "@/lib/types";

type LichessGame = {
  id?: string;
  createdAt?: number;
  moves?: string;
  clocks?: number[];
  winner?: string; // "white" | "black" | absent for draw
  status?: string;
  players?: {
    white?: { user?: { name?: string }; rating?: number };
    black?: { user?: { name?: string }; rating?: number };
  };
  opening?: { eco?: string; name?: string };
};

type ChessComArchiveList = {
  archives?: string[];
};

type ChessComGame = {
  pgn?: string;
  rules?: string;
  time_class?: string;
  end_time?: number;
  white?: { username?: string; rating?: number; result?: string };
  black?: { username?: string; rating?: number; result?: string };
};

type ChessComMonthArchive = {
  games?: ChessComGame[];
};

type GameOutcome = "white" | "black" | "draw";

type GameTermination = "mate" | "resign" | "timeout" | "draw" | "stalemate" | "other";

type SourceGame = {
  moves: string;
  /** When the game was played (epoch ms) — for incremental caching */
  playedAt?: number;
  whiteName?: string;
  blackName?: string;
  /** Player ratings if available from the source */
  whiteRating?: number;
  blackRating?: number;
  /** Clock times in centiseconds per half-move (ply), if available */
  clocks?: number[];
  /** Game winner: "white" | "black" | "draw" */
  winner?: GameOutcome;
  /** How the game ended */
  termination?: GameTermination;
  /** Opening name if available from source (Lichess or Chess.com PGN) */
  openingName?: string;
};

export type AnalysisSource = "lichess" | "chesscom";
export type ScanMode = "openings" | "tactics" | "endgames" | "both";
export type Speed = "bullet" | "blitz" | "rapid" | "classical";
export type TimeControl = Speed | "all";

export type AnalysisProgress = {
  phase: "fetch" | "parse" | "aggregate" | "eval" | "tactics" | "endgames" | "done";
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
  /** Cap the number of missed tactics returned (default Infinity = no cap) */
  maxTactics?: number;
  /** Cap the number of endgame mistakes returned (default 50) */
  maxEndgames?: number;
  /** Only include games played after this epoch timestamp (milliseconds) */
  since?: number;
  onProgress?: (progress: AnalysisProgress) => void;
};

const MIN_POSITION_REPEATS = 3;
const CP_LOSS_THRESHOLD = 100;
const DEFAULT_MAX_GAMES = 300;
const DEFAULT_MAX_OPENING_MOVES = 30;

/**
 * Process items concurrently with a fixed concurrency limit.
 * Each "lane" picks the next unprocessed item, so all lanes stay busy.
 * Yields to the browser event loop periodically to prevent UI freezes.
 */
async function parallelForEach<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let nextIndex = 0;
  const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));
  const lane = async () => {
    let sinceYield = 0;
    while (nextIndex < items.length) {
      const i = nextIndex++;
      await fn(items[i], i);
      sinceYield++;
      // Yield to browser every 4 tasks to keep UI responsive
      if (sinceYield >= 4) {
        sinceYield = 0;
        await yieldToMain();
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, lane)
  );
}

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
    .map((game) => {
      let winner: GameOutcome | undefined;
      if (game.winner === "white") winner = "white";
      else if (game.winner === "black") winner = "black";
      else if (game.status && game.status !== "started" && game.status !== "created") winner = "draw";
      // Map Lichess status to unified termination
      let termination: GameTermination | undefined;
      const st = game.status;
      if (st === "mate") termination = "mate";
      else if (st === "resign") termination = "resign";
      else if (st === "outoftime" || st === "timeout") termination = "timeout";
      else if (st === "stalemate") termination = "stalemate";
      else if (st === "draw" || winner === "draw") termination = "draw";
      else if (winner) termination = "other";

      return {
        moves: game.moves!.trim(),
        playedAt: game.createdAt,
        whiteName: game.players?.white?.user?.name,
        blackName: game.players?.black?.user?.name,
        whiteRating: game.players?.white?.rating,
        blackRating: game.players?.black?.rating,
        clocks: game.clocks,
        winner,
        termination,
        openingName: game.opening?.name,
      };
    });
}

function extractOpeningFromPgn(pgn: string): string | undefined {
  // Try [Opening "..."] header first
  const openingMatch = pgn.match(/\[Opening\s+"([^"]+)"\]/);
  if (openingMatch?.[1]) return openingMatch[1];
  // Try [ECOUrl "..."] and extract from the URL path
  const ecoUrlMatch = pgn.match(/\[ECOUrl\s+"[^"]*\/([^"]+)"\]/);
  if (ecoUrlMatch?.[1]) return ecoUrlMatch[1].replace(/-/g, " ");
  return undefined;
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
  let archives = [...(archiveList.archives ?? [])].reverse();

  // When a "since" filter is set, skip archives older than the target month
  const sinceMs = options?.since;
  if (sinceMs) {
    const sinceDate = new Date(sinceMs);
    const sinceYYYYMM = `${sinceDate.getUTCFullYear()}/${String(sinceDate.getUTCMonth() + 1).padStart(2, "0")}`;
    archives = archives.filter((url) => {
      // Archive URLs end in /YYYY/MM
      const match = url.match(/\/(\d{4}\/\d{2})$/);
      return match ? match[1] >= sinceYYYYMM : true;
    });
  }

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

      // Skip games before the "since" date
      if (sinceMs && game.end_time && game.end_time * 1000 < sinceMs) continue;

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

      // Determine winner from Chess.com result field
      let winner: GameOutcome | undefined;
      if (game.white?.result === "win") winner = "white";
      else if (game.black?.result === "win") winner = "black";
      else if (game.white?.result || game.black?.result) winner = "draw";

      // Map Chess.com result to unified termination
      const loserResult = winner === "white" ? game.black?.result : winner === "black" ? game.white?.result : game.white?.result;
      let termination: GameTermination | undefined;
      if (loserResult === "checkmated") termination = "mate";
      else if (loserResult === "resigned") termination = "resign";
      else if (loserResult === "timeout" || loserResult === "abandoned") termination = "timeout";
      else if (loserResult === "stalemate") termination = "stalemate";
      else if (winner === "draw") termination = "draw";
      else if (winner) termination = "other";

      collected.push({
        moves: parsed.moves,
        playedAt: game.end_time ? game.end_time * 1000 : undefined,
        whiteName,
        blackName,
        whiteRating: game.white?.rating,
        blackRating: game.black?.rating,
        clocks: parsed.clocks.length > 0 ? parsed.clocks : undefined,
        winner,
        termination,
        openingName: extractOpeningFromPgn(game.pgn!),
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

/* ── Game cache ─────────────────────────────────────── */

const GAME_CACHE_PREFIX = "fc-gcache-";
const GAME_CACHE_MAX_GAMES = 5000;
const GAME_CACHE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

type GameCacheEntry = {
  savedAt: number;
  games: SourceGame[];
};

function gameCacheKey(username: string, source: string, tc: string[]): string {
  return `${GAME_CACHE_PREFIX}${source}-${username.toLowerCase()}-${[...tc].sort().join(",")}`;
}

/** Fingerprint for dedup: player names + first 80 chars of moves */
function gameFingerprint(g: SourceGame): string {
  return `${(g.whiteName ?? "").toLowerCase()}|${(g.blackName ?? "").toLowerCase()}|${g.moves.slice(0, 80)}`;
}

function loadGameCache(username: string, source: string, tc: string[]): GameCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(gameCacheKey(username, source, tc));
    if (!raw) return null;
    const entry: GameCacheEntry = JSON.parse(raw);
    if (Date.now() - entry.savedAt > GAME_CACHE_MAX_AGE_MS) {
      localStorage.removeItem(gameCacheKey(username, source, tc));
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function saveGameCache(username: string, source: string, tc: string[], games: SourceGame[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = games.slice(0, GAME_CACHE_MAX_GAMES);
    const entry: GameCacheEntry = { savedAt: Date.now(), games: trimmed };
    localStorage.setItem(gameCacheKey(username, source, tc), JSON.stringify(entry));
  } catch {
    // localStorage quota exceeded — silently skip
  }
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

  // === Severity ===
  if (cpLoss >= 600) tags.add("Crushing");
  else if (cpLoss >= 250) tags.add("Major Blunder");
  else if (cpLoss >= 150) tags.add("Tactical Miss");

  if (reachCount > 0 && moveCount / reachCount >= 0.7) {
    tags.add("Repeated Habit");
  }

  // === Game Phase ===
  try {
    const chess = new Chess(fenBefore);
    const pieces = chess.board().flat().filter(Boolean);
    const totalPieces = pieces.length;
    const fullMoveNumber = Number(chess.fen().split(" ")[5] ?? "1");
    const queens = pieces.filter(p => p?.type === "q").length;

    if (fullMoveNumber <= 12 && totalPieces >= 28) {
      tags.add("Opening");
    } else if (totalPieces <= 12 || (queens === 0 && totalPieces <= 16)) {
      tags.add("Endgame");
      // Endgame sub-type
      const nonKP = pieces.filter(p => p && p.type !== "k" && p.type !== "p");
      const hasPawns = pieces.some(p => p?.type === "p");
      const types = new Set(nonKP.map(p => p?.type));
      if (nonKP.length === 0 && hasPawns) tags.add("Pawn Endgame");
      else if (types.size === 1 && types.has("r")) tags.add("Rook Endgame");
      else if (types.size === 1 && types.has("b")) tags.add("Bishop Endgame");
      else if (types.size === 1 && types.has("n")) tags.add("Knight Endgame");
      else if (types.size === 1 && types.has("q")) tags.add("Queen Endgame");
      else if (types.size === 2 && types.has("q") && types.has("r")) tags.add("Queen and Rook");
    } else {
      tags.add("Middlegame");
    }

    // === Motifs ===
    if (bestSan?.includes("O-O") && !userSan?.includes("O-O")) {
      tags.add("King Safety");
    }

    if (bestSan?.includes("+") && !userSan?.includes("+")) {
      tags.add("Missed Check");
    }

    if (bestSan?.includes("x") && !userSan?.includes("x")) {
      tags.add("Missed Capture");
    }

    // Castling move
    if (userSan === "O-O" || userSan === "O-O-O") {
      tags.add("Castling");
    }

    // Promotion
    if (userMove.length === 5) {
      const promo = userMove[4];
      if (promo === "q") tags.add("Promotion");
      else tags.add("Underpromotion");
    }
    if (bestMove && bestMove.length === 5) {
      tags.add("Promotion");
    }

    const bestParsed = normalizeUci(bestMove);
    const userParsed = normalizeUci(userMove);
    const centerSquares = new Set(["d4", "e4", "d5", "e5"]);

    if (bestParsed && userParsed && centerSquares.has(bestParsed.to) && !centerSquares.has(userParsed.to)) {
      tags.add("Center Control");
    }

    if (fullMoveNumber <= 10 && userParsed) {
      const movedPiece = chess.get(userParsed.from as Parameters<Chess["get"]>[0]);
      if (movedPiece?.type === "q" || movedPiece?.type === "k") {
        tags.add("Opening Development");
      }
    }

    // Attacked f2/f7
    if (bestParsed && (bestParsed.to === "f2" || bestParsed.to === "f7") && userParsed?.to !== bestParsed.to) {
      tags.add("Attacking f2/f7");
    }

    // Fork detection (lightweight): check if best move is a knight/queen moving to attack two pieces
    if (bestParsed) {
      try {
        const testChess = new Chess(fenBefore);
        const result = testChess.move({ from: bestParsed.from, to: bestParsed.to, promotion: bestParsed.promotion } as any);
        if (result) {
          const piece = testChess.get(bestParsed.to as Parameters<Chess["get"]>[0]);
          if (piece && (piece.type === "n" || piece.type === "q")) {
            // Count attacked opponent pieces worth 3+
            const oppColor = piece.color === "w" ? "b" : "w";
            const moves = testChess.moves({ verbose: true, square: bestParsed.to as any });
            const attackedPieces = moves.filter(m => m.captured && m.from === bestParsed!.to);
            if (attackedPieces.length >= 2) tags.add("Fork");
          }
          // Discovered attack: if the move gives check but the moved piece isn't the checker
          if (testChess.isCheck() && result.san.includes("+") && !result.san.startsWith("N") && piece?.type !== "q") {
            tags.add("Discovered Attack");
          }
          // Pin: check if opponent has a pinned piece after best move
          // (lightweight heuristic — just check if best move gives check through a piece line)
        }
      } catch { /* best effort */ }
    }

    // Hanging piece: user's move might leave something hanging
    if (cpLoss >= 200 && userParsed) {
      const movedPiece = chess.get(userParsed.from as Parameters<Chess["get"]>[0]);
      if (movedPiece && movedPiece.type !== "p" && movedPiece.type !== "k") {
        tags.add("Hanging Piece");
      }
    }

    // En passant
    if (userParsed) {
      const up = chess.get(userParsed.from as Parameters<Chess["get"]>[0]);
      if (up?.type === "p") {
        const fromFile = userParsed.from.charCodeAt(0);
        const toFile = userParsed.to.charCodeAt(0);
        const target = chess.get(userParsed.to as Parameters<Chess["get"]>[0]);
        if (!target && fromFile !== toFile) {
          tags.add("En Passant");
        }
      }
    }

    // Sacrifice in best move
    if (bestParsed) {
      const bestPiece = chess.get(bestParsed.from as Parameters<Chess["get"]>[0]);
      const bestTarget = chess.get(bestParsed.to as Parameters<Chess["get"]>[0]);
      if (bestPiece && bestTarget) {
        const pv: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        if (pv[bestPiece.type] > pv[bestTarget.type] + 1) {
          tags.add("Sacrifice");
        }
      }
    }

    // Skewer / Pin / X-Ray (lightweight: check if user's blunder allows a slider line attack)
    if (cpLoss >= 150 && userParsed) {
      const uPiece = chess.get(userParsed.from as Parameters<Chess["get"]>[0]);
      if (uPiece && (uPiece.type === "r" || uPiece.type === "b" || uPiece.type === "q")) {
        // Moving a slider might expose a line
        tags.add("Tactical Pattern");
      }
    }

    // Advanced Pawn
    if (userParsed) {
      const uPiece = chess.get(userParsed.from as Parameters<Chess["get"]>[0]);
      if (uPiece?.type === "p") {
        const toRank = parseInt(userParsed.to[1]);
        const isAdvanced = uPiece.color === "w" ? toRank >= 6 : toRank <= 3;
        if (isAdvanced) tags.add("Advanced Pawn");
      }
    }

    // Exposed King (user moves king shield pawn)
    if (cpLoss >= 100 && userParsed) {
      const uPiece = chess.get(userParsed.from as Parameters<Chess["get"]>[0]);
      if (uPiece?.type === "p") {
        const kingPos = chess.board().flat().find(p => p?.type === "k" && p.color === uPiece.color);
        if (kingPos) {
          const kFile = kingPos.square.charCodeAt(0) - "a".charCodeAt(0);
          const pFile = userParsed.from.charCodeAt(0) - "a".charCodeAt(0);
          if (Math.abs(kFile - pFile) <= 1) {
            tags.add("Exposed King");
          }
        }
      }
    }
  } catch {
    // keep best-effort tags only
  }

  if (tags.size === 0) {
    tags.add("Inaccuracy");
  }

  return [...tags].slice(0, 5);
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
  const { fenBefore, userMove, bestMove, bestMoveSan, cpLoss, cpBefore } = args;

  // ── Severity ──
  if (cpLoss >= 600) tags.push("Winning Blunder");
  else if (cpLoss >= 400) tags.push("Major Miss");
  else tags.push("Tactical Miss");

  // ── Mate / Check / Capture classification ──
  if (bestMoveSan.includes("#")) {
    tags.push("Missed Mate");
  } else if (bestMoveSan.includes("+") && bestMoveSan.includes("x")) {
    tags.push("Forcing Capture");
  } else if (bestMoveSan.includes("+")) {
    tags.push("Missed Check");
  } else if (bestMoveSan.includes("x")) {
    tags.push("Missed Capture");
  }

  // ── Context ──
  if (cpBefore >= 200) {
    tags.push("Converting Advantage");
  } else if (cpBefore >= -50 && cpBefore <= 50) {
    tags.push("Equal Position");
  } else if (cpBefore <= -100) {
    tags.push("Defensive Resource");
  }

  // ── Detailed motif detection via board analysis ──
  try {
    const chess = new Chess(fenBefore);
    const sideToMove = chess.turn() === "w" ? "white" : "black";
    const bestParsed = normalizeUci(bestMove);
    const userParsed = normalizeUci(userMove);

    // --- Game phase ---
    const boardPieces = chess.board().flat().filter(Boolean);
    const totalPieces = boardPieces.length;
    const queens = boardPieces.filter(p => p?.type === "q").length;
    const fullMoveNumber = Number(chess.fen().split(" ")[5] ?? "1");

    if (fullMoveNumber <= 12 && totalPieces >= 28) {
      tags.push("Opening");
    } else if (totalPieces <= 12 || (queens === 0 && totalPieces <= 16)) {
      tags.push("Endgame");
    } else {
      tags.push("Middlegame");
    }

    if (bestParsed) {
      const testChess = new Chess(fenBefore);
      const result = testChess.move({
        from: bestParsed.from,
        to: bestParsed.to,
        promotion: bestParsed.promotion as "q" | "r" | "b" | "n" | undefined,
      } as any);

      if (result) {
        const movedPiece = result.piece;
        const oppColor = testChess.turn(); // after move, it's opponent's turn

        // --- Fork detection ---
        // The moved piece now attacks 2+ opponent pieces worth 3+
        const movesFromDest = testChess.moves({ verbose: true, square: bestParsed.to as any });
        const attackedPieces = movesFromDest.filter(
          (m) => m.captured && m.from === bestParsed!.to
        );
        if (attackedPieces.length >= 2) {
          if (movedPiece === "n") tags.push("Knight Fork");
          else if (movedPiece === "q") tags.push("Queen Fork");
          else if (movedPiece === "p") tags.push("Pawn Fork");
          else tags.push("Fork");
        }

        // --- Discovered attack ---
        if (testChess.isCheck() && result.san.includes("+")) {
          // The move gives check but the piece itself isn't a natural checker from that square
          if (movedPiece !== "q" && movedPiece !== "r" && movedPiece !== "b") {
            tags.push("Discovered Attack");
          } else {
            // For sliders, check if a different piece is giving check
            const kingSquare = findKingSquare(testChess, oppColor === "w" ? "white" : "black");
            if (kingSquare) {
              // If the moved piece isn't aligned with the king, it's discovered
              const df = Math.abs(bestParsed.to.charCodeAt(0) - kingSquare.charCodeAt(0));
              const dr = Math.abs(parseInt(bestParsed.to[1]) - parseInt(kingSquare[1]));
              const aligned = df === 0 || dr === 0 || df === dr;
              if (!aligned) tags.push("Discovered Attack");
            }
          }
        }

        // --- Discovered check (via piece move that unmasks a slider) ---
        if (testChess.isCheck() && movedPiece === "p") {
          tags.push("Discovered Check");
        }

        // --- Double check ---
        if (testChess.isCheck()) {
          // Count how many pieces give check
          const oppKingSq = findKingSquare(testChess, oppColor === "w" ? "white" : "black");
          if (oppKingSq) {
            const attackerColor = oppColor === "w" ? "b" : "w";
            let checkerCount = 0;
            const allSquares = testChess.board().flat().filter(Boolean);
            for (const sq of allSquares) {
              if (sq && sq.color === attackerColor) {
                const pieceMoves = testChess.moves({ verbose: true, square: sq.square as any });
                if (pieceMoves.some(m => m.to === oppKingSq)) checkerCount++;
              }
            }
            if (checkerCount >= 2) tags.push("Double Check");
          }
        }

        // --- Pin detection ---
        // After best move, check if an opponent piece is pinned
        const oppSquares = testChess.board().flat().filter(
          (sq) => sq && sq.color === oppColor
        );
        for (const sq of oppSquares) {
          if (!sq || sq.type === "k") continue;
          // A piece is pinned if removing it would expose the king to check
          // Lightweight: check if it has fewer legal moves than pseudo-legal moves
          const legalMoves = testChess.moves({ verbose: true, square: sq.square as any });
          if (legalMoves.length === 0 && sq.type !== "p") {
            // Piece can't move at all — likely pinned (or blocked, but pins are more common for non-pawns)
            tags.push("Pin");
            break;
          }
        }

        // --- Skewer detection ---
        // If best move is a slider attacking through a valuable piece to one behind
        if (movedPiece === "r" || movedPiece === "b" || movedPiece === "q") {
          if (result.captured) {
            // After capturing, check if the slider now attacks another piece on the same line
            const continuations = testChess.moves({ verbose: true, square: bestParsed.to as any });
            const furtherCaptures = continuations.filter((m) => m.captured && m.from === bestParsed!.to);
            if (furtherCaptures.length > 0) tags.push("Skewer");
          }
        }

        // --- Trapped piece ---
        // Best move captures a piece that had no escape squares
        if (result.captured) {
          const capturedType = result.captured;
          if (capturedType !== "p" && capturedType !== "k") {
            // Check if the captured piece had moves before the best move
            const priorChess = new Chess(fenBefore);
            const victimMoves = priorChess.moves({ verbose: true }).filter(
              (m) => m.from === bestParsed!.to
            );
            if (victimMoves.length <= 1) tags.push("Trapped Piece");
          }
        }

        // --- Sacrifice ---
        if (bestParsed) {
          const srcPiece = new Chess(fenBefore).get(bestParsed.from as any);
          const destPiece = new Chess(fenBefore).get(bestParsed.to as any);
          if (srcPiece && destPiece) {
            const pv: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
            if (pv[srcPiece.type] > pv[destPiece.type] + 1) {
              tags.push("Sacrifice");
            }
          } else if (srcPiece && !destPiece && !result.captured) {
            // Non-capture move with a big piece to a square under attack
            const oppMoves = testChess.moves({ verbose: true });
            const isHanging = oppMoves.some((m) => m.to === bestParsed!.to && m.captured);
            if (isHanging && srcPiece.type !== "p") tags.push("Sacrifice");
          }
        }

        // --- Zwischenzug (intermediate move) ---
        // Best move is a check or capture but NOT the most "obvious" recapture
        if (result.san.includes("+") && !result.captured) {
          // Check without capturing — could be an in-between move
          tags.push("Zwischenzug");
        }
      }
    }

    // --- Back rank ---
    const oppKingSquare = findKingSquare(chess, sideToMove === "white" ? "black" : "white");
    if (oppKingSquare) {
      const rank = oppKingSquare.charAt(1);
      if ((sideToMove === "white" && rank === "8") || (sideToMove === "black" && rank === "1")) {
        if (bestMoveSan.includes("+") || bestMoveSan.includes("#")) {
          tags.push("Back Rank");
        }
      }
    }

    // --- Hanging piece (user left a piece hanging) ---
    if (cpLoss >= 200 && userParsed) {
      const movedPiece = chess.get(userParsed.from as any);
      if (movedPiece && movedPiece.type !== "p" && movedPiece.type !== "k") {
        tags.push("Hanging Piece");
      }
    }

    // --- Overloaded piece ---
    // User moved a piece that was defending multiple things
    if (cpLoss >= 200 && userParsed) {
      const priorMoves = chess.moves({ verbose: true, square: userParsed.from as any });
      const defendedSquares = priorMoves.filter((m) => m.captured).length;
      if (defendedSquares >= 2) tags.push("Overloaded Piece");
    }

    // --- Deflection ---
    // Best move forces an opponent piece away from a key defensive square
    if (bestParsed && bestMoveSan.includes("x")) {
      // Capturing a defender — check if the captured piece was defending something
      const capturedSquare = bestParsed.to;
      const preChess = new Chess(fenBefore);
      const defenderMoves = preChess.moves({ verbose: true }).filter(
        (m) => m.from === capturedSquare && m.captured
      );
      if (defenderMoves.length >= 1) tags.push("Deflection");
    }

    // --- Promotion ---
    if (bestMove.length === 5) {
      const promo = bestMove[4];
      if (promo === "q") tags.push("Missed Promotion");
      else tags.push("Missed Underpromotion");
    }

    // --- Pawn break ---
    if (bestParsed) {
      const srcPiece = chess.get(bestParsed.from as any);
      if (srcPiece?.type === "p" && bestMoveSan.includes("x")) {
        tags.push("Pawn Break");
      }
    }

  } catch {
    // best-effort — keep whatever tags we have
  }

  // Deduplicate and cap at 5 tags
  return [...new Set(tags)].slice(0, 5);
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

/* ── Endgame Detection & Classification ────────────────────────── */

/** Standard piece values for material counting (king excluded) */
const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

/** Count total non-pawn material for one side (in standard piece-value units) */
function countMaterial(chess: Chess, color: "w" | "b"): { pieces: number; pawns: number; counts: Record<string, number> } {
  const board = chess.board();
  let pieces = 0;
  let pawns = 0;
  const counts: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const sq = board[rank][file];
      if (!sq || sq.color !== color || sq.type === "k") continue;
      counts[sq.type] = (counts[sq.type] ?? 0) + 1;
      if (sq.type === "p") { pawns++; } else { pieces += PIECE_VALUE[sq.type] ?? 0; }
    }
  }
  return { pieces, pawns, counts };
}

/** Detect if a position is an endgame: both sides have ≤ 13 non-pawn material points */
function isEndgame(chess: Chess): boolean {
  const w = countMaterial(chess, "w");
  const b = countMaterial(chess, "b");
  return w.pieces <= 13 && b.pieces <= 13;
}

/** Classify the endgame type from piece configuration */
function classifyEndgameType(chess: Chess): EndgameType {
  const w = countMaterial(chess, "w");
  const b = countMaterial(chess, "b");

  const wc = w.counts;
  const bc = b.counts;

  const wN = wc.n ?? 0, wB = wc.b ?? 0, wR = wc.r ?? 0, wQ = wc.q ?? 0;
  const bN = bc.n ?? 0, bB = bc.b ?? 0, bR = bc.r ?? 0, bQ = bc.q ?? 0;
  const totalN = wN + bN, totalB = wB + bB, totalR = wR + bR, totalQ = wQ + bQ;
  const totalMinors = totalN + totalB;

  // No pieces at all → pure pawn endgame
  if (w.pieces === 0 && b.pieces === 0) return "Pawn";

  // Opposite-color bishops: each side has exactly 1 bishop, no other pieces
  if (totalB === 2 && totalN === 0 && totalR === 0 && totalQ === 0 && wB === 1 && bB === 1) {
    const board = chess.board();
    let wBishopDark = false;
    let bBishopDark = false;
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const sq = board[rank][file];
        if (sq?.type === "b") {
          const isDark = (rank + file) % 2 === 0;
          if (sq.color === "w") wBishopDark = isDark;
          else bBishopDark = isDark;
        }
      }
    }
    if (wBishopDark !== bBishopDark) return "Opposite Bishops";
  }

  // Queen + Rook (heavy piece endgame)
  if (totalQ > 0 && totalR > 0 && totalMinors === 0) return "Queen + Rook";

  // Queen + Minor
  if (totalQ > 0 && totalMinors > 0 && totalR === 0) return "Queen + Minor";

  // Pure queen endgame: queens, no rooks/minors
  if (totalQ > 0 && totalR === 0 && totalMinors === 0) return "Queen";

  // Rook + Bishop (rooks + bishops, no knights/queens)
  if (totalR > 0 && totalB > 0 && totalN === 0 && totalQ === 0) return "Rook + Bishop";

  // Rook + Knight (rooks + knights, no bishops/queens)
  if (totalR > 0 && totalN > 0 && totalB === 0 && totalQ === 0) return "Rook + Knight";

  // Rook + minor (mixed minors with rooks, no queens)
  if (totalR > 0 && totalMinors > 0 && totalQ === 0) return "Rook + Minor";

  // Pure rook endgame: only rooks, no minors/queens
  if (totalR > 0 && totalMinors === 0 && totalQ === 0) return "Rook";

  // Minor piece endgames — specific types
  if (totalR === 0 && totalQ === 0 && totalMinors > 0) {
    // Two Bishops (bishop pair vs anything)
    if ((wB === 2 && bB === 0 && bN === 0) || (bB === 2 && wB === 0 && wN === 0)) return "Two Bishops";
    if (wB === 2 || bB === 2) return "Two Bishops";

    // Two Knights
    if (totalN >= 2 && totalB === 0) return "Two Knights";

    // Bishop + Knight vs K (or pawns)
    if ((wB === 1 && wN === 1 && bB === 0 && bN === 0) || (bB === 1 && bN === 1 && wB === 0 && wN === 0)) return "Bishop + Knight";

    // Knight vs Knight
    if (totalN === 2 && totalB === 0 && wN === 1 && bN === 1) return "Knight vs Knight";

    // Bishop vs Bishop (same color or mixed — opposite bishops handled above)
    if (totalB === 2 && totalN === 0 && wB === 1 && bB === 1) return "Bishop vs Bishop";

    // Knight vs Bishop
    if (totalN === 1 && totalB === 1) {
      if (wN === 1 && bB === 1) return "Knight vs Bishop";
      if (wB === 1 && bN === 1) return "Bishop vs Knight";
    }

    // Generic minor piece fallback
    return "Minor Piece";
  }

  return "Complex";
}

/** Determine the game result from the final FEN / move list. Returns 1 (white win), 0 (draw), -1 (black win) or null */
function inferGameResult(chess: Chess): 1 | 0 | -1 | null {
  if (chess.isCheckmate()) {
    // The side to move is checkmated → the other side won
    return chess.turn() === "w" ? -1 : 1;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return 0;
  }
  return null; // game ended by resignation/timeout — can't tell from FEN alone
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
  const doEndgames = scanMode === "endgames" || scanMode === "both";

  let games: SourceGame[] = [];

  // ── Game cache: avoid re-downloading games we already have ──
  const tcRaw = options?.timeControl;
  const tcArr = Array.isArray(tcRaw) ? tcRaw : tcRaw ? [tcRaw] : ["all"];
  const cache = loadGameCache(username, source, tcArr);

  // Determine effective "since" for incremental fetch
  let fetchSince = options?.since ?? 0;
  // Only use incremental fetch if cache already covers the requested game count.
  // If the user asks for MORE games than we have cached, do a full fetch so we
  // pick up the older games the cache doesn't contain.
  const cacheCoversRequest = cache && cache.games.length >= maxGames;
  if (cache && cache.games.length > 0 && cacheCoversRequest) {
    const cachedNewestAt = Math.max(...cache.games.map(g => g.playedAt ?? 0));
    if (cachedNewestAt > 0) {
      fetchSince = Math.max(fetchSince, cachedNewestAt + 1);
    }
    emitProgress(options, {
      phase: "fetch",
      message: "💾 Found cached games",
      detail: `${cache.games.length} games from previous scan — checking for new ones`,
      percent: 1,
    });
  } else if (cache && cache.games.length > 0) {
    emitProgress(options, {
      phase: "fetch",
      message: "🔄 Fetching more games",
      detail: `You requested ${maxGames} games but only ${cache.games.length} were cached — doing a full fetch`,
      percent: 1,
    });
  }

  if (source === "chesscom") {
    emitProgress(options, {
      phase: "fetch",
      message: "🌐 Connecting to Chess.com",
      detail: cache ? "Fetching new games only..." : "Fetching your recent game archives...",
      percent: 2,
    });

    try {
      // Pass cache-aware since to avoid re-downloading known games
      const fetchOpts = fetchSince > 0 ? { ...options, since: fetchSince } : options;
      games = await fetchChessComGamesInReverse(username, maxGames, fetchOpts);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      throw new Error(`Browser cannot reach api.chess.com. Last error: ${message}`);
    }
  } else {
    emitProgress(options, {
      phase: "fetch",
      message: "🌐 Connecting to Lichess",
      detail: cache ? "Fetching new games only..." : "Streaming your recent games...",
      percent: 2,
    });

    // Build Lichess URL with optional time control filter (supports multi-select)
    const lichessPerfs = tcArr
      .filter((t): t is Speed => t !== "all")
      .map((t) => t); // Lichess perfType values match our Speed type directly
    const perfParam = lichessPerfs.length > 0
      ? `&perfType=${lichessPerfs.join(",")}`
      : "";
    const sinceParam = fetchSince > 0 ? `&since=${fetchSince}` : "";
    const lichessUrl = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${maxGames}&moves=true&opening=true&clocks=true&evals=false&pgnInJson=false${perfParam}${sinceParam}`;

    const hasSinceFilter = fetchSince > 0;
    const lichessGames = await streamLichessGames(
      lichessUrl,
      maxGames,
      (count) => {
        emitProgress(options, {
          phase: "fetch",
          message: "🌐 Downloading from Lichess",
          detail: hasSinceFilter
            ? `${count} new games received so far`
            : `${count} of ${maxGames} games received`,
          current: count,
          total: hasSinceFilter ? undefined : maxGames,
          percent: hasSinceFilter
            ? Math.min(38, 2 + Math.round(count / 10))
            : 2 + Math.round((count / maxGames) * 36),
        });
      },
      3
    );

    games = sourceGamesFromLichess(lichessGames);
  }

  // ── Merge with cached games (dedup by fingerprint) ──
  // Only merge when we used incremental fetch (cache covered the request).
  // If we did a full re-fetch, the fresh results are authoritative.
  const newGameCount = games.length;
  if (cacheCoversRequest && cache && cache.games.length > 0 && games.length < maxGames) {
    const fingerprints = new Set(games.map(gameFingerprint));
    let additions = cache.games.filter(g => !fingerprints.has(gameFingerprint(g)));
    // Apply user's original since filter to cached games
    if (options?.since) {
      additions = additions.filter(g => !g.playedAt || g.playedAt >= options.since!);
    }
    if (additions.length > 0) {
      games = [...games, ...additions].slice(0, maxGames);
      emitProgress(options, {
        phase: "fetch",
        message: `💾 ${newGameCount} new + ${additions.length} cached`,
        detail: `${games.length} total games ready for analysis`,
        percent: 39,
      });
    }
  }

  // Save merged games to cache for next time
  saveGameCache(username, source, tcArr, games);

  emitProgress(options, {
    phase: "parse",
    message: "📖 Parsing games",
    detail: `Extracting opening moves from ${games.length} games...`,
    percent: 40,
  });

  const byFen = new Map<string, { totalReachCount: number; moveCounts: Map<string, number>; moveOutcomes: Map<string, { w: number; d: number; l: number }>; openingName?: string }>();
  /** Track the last known opening name for each FEN (from source API) */
  const fenOpeningName = new Map<string, string>();
  let gamesAnalyzed = 0;
  const playerRatings: number[] = [];
  const gameTraces: GameOpeningTrace[] = [];
  const openingSummaries: OpeningSummary[] = [];
  /** Ply at which to snapshot the FEN for opening identification */
  const OPENING_ID_PLY = 8;

  if (doOpenings) {
  for (let gameIndex = 0; gameIndex < games.length; gameIndex += 1) {
    const game = games[gameIndex];

    // Yield to browser every 20 games to prevent UI freeze
    if (gameIndex > 0 && gameIndex % 20 === 0) {
      await new Promise<void>((r) => setTimeout(r, 0));
    }

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
    let openingIdentityFen: string | null = null;

    // Track last known opening name as we walk through plies
    let lastKnownOpening = game.openingName;

    for (let ply = 0; ply < moveTokens.length; ply += 1) {
      const sideToMove: PlayerColor = ply % 2 === 0 ? "white" : "black";
      const token = moveTokens[ply];

      if (sideToMove === userColor) {
        const fenBefore = chess.fen();

        // Associate the last known opening name with this FEN
        if (lastKnownOpening && !fenOpeningName.has(fenBefore)) {
          fenOpeningName.set(fenBefore, lastKnownOpening);
        }

        const existing = byFen.get(fenBefore) ?? {
          totalReachCount: 0,
          moveCounts: new Map<string, number>(),
          moveOutcomes: new Map<string, { w: number; d: number; l: number }>(),
        };

        existing.totalReachCount += 1;
        existing.moveCounts.set(token, (existing.moveCounts.get(token) ?? 0) + 1);

        // Track game outcome per move
        const outcomes = existing.moveOutcomes.get(token) ?? { w: 0, d: 0, l: 0 };
        if (game.winner === userColor) outcomes.w += 1;
        else if (game.winner === "draw") outcomes.d += 1;
        else if (game.winner) outcomes.l += 1; // opponent won
        existing.moveOutcomes.set(token, outcomes);

        byFen.set(fenBefore, existing);
      }

      const ok = applyMoveToken(chess, token);
      if (!ok) break;
      openingMovesPlayed.push(token);

      // Capture FEN for opening identification (at OPENING_ID_PLY or last available ply)
      if (ply < OPENING_ID_PLY) openingIdentityFen = chess.fen();
    }

    // Record opening summary if we have enough moves (at least 4 plies = 2 full moves)
    if (openingIdentityFen && openingMovesPlayed.length >= 4) {
      const outcome: "win" | "draw" | "loss" =
        (!game.winner || game.winner === "draw") ? "draw"
        : game.winner === userColor ? "win"
        : "loss";
      openingSummaries.push({ fen: openingIdentityFen, userColor, result: outcome, openingName: game.openingName });
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
  const oneOffMistakes: RepeatedOpeningLeak[] = [];
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

  let evalCompleted = 0;
  await parallelForEach(repeatedEntries, stockfishPool.size, async ([fenBefore, data], index) => {
    repeatedPositions += 1;
    evalCompleted++;

    if (evalCompleted % 5 === 0 || evalCompleted === repeatedEntries.length) {
      emitProgress(options, {
        phase: "eval",
        message: `🧠 Evaluating positions`,
        detail: `Position ${evalCompleted} of ${repeatedEntries.length}`,
        current: evalCompleted,
        total: repeatedEntries.length,
        percent: 58 + Math.round((evalCompleted / repeatedEntries.length) * 22),
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

    if (!chosenMove) return;

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
      return;
    }

    const sideToMove: PlayerColor = fenBefore.includes(" w ") ? "white" : "black";
    const beforeEval = await stockfishPool.evaluateFen(fenBefore, engineDepth);

    if (!beforeEval) {
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
        skippedReason: "missing_eval"
      });
      return;
    }

    // Early-exit: if user played the engine's best move, skip the 2nd eval call
    const bestMoveSan = sanForMove(fenBefore, beforeEval.bestMove);
    if (bestMoveSan && bestMoveSan === chosenMove) {
      positionTraces.push({
        fenBefore,
        userMove: chosenMove,
        bestMove: beforeEval.bestMove,
        reachCount: data.totalReachCount,
        moveCount: chosenCount,
        evalBefore: scoreToCpFromUserPerspective(beforeEval.cp, sideToMove, sideToMove),
        evalAfter: null,
        cpLoss: 0,
        flagged: false
      });
      return;
    }

    const afterEval = await stockfishPool.evaluateFen(fenAfter, engineDepth);

    if (!afterEval) {
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
      return;
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

    if (!flagged) return;

    // ── Database validation: check if the Lichess DB approves this move ──
    // Formula-based: more games + higher win rate → higher CPL tolerance.
    // e.g. Dutch (500K games, 50% WR) → dbScore ≈ 228, so CPL 51 is a sideline.
    let dbApproved = false;
    let dbWinRate: number | undefined;
    let dbGames: number | undefined;
    try {
      const explorer = await fetchExplorerMoves(fenBefore, sideToMove);
      const dbMove = explorer.moves.find(
        (m) => m.san === chosenMove || m.uci === chosenMove
      );
      if (dbMove && dbMove.totalGames >= 50 && dbMove.winRate >= 0.40) {
        const dbScore = Math.min(300, Math.log10(dbMove.totalGames) * 40 * (dbMove.winRate / 0.50));
        if (cpLoss <= dbScore) {
          dbApproved = true;
          dbWinRate = dbMove.winRate;
          dbGames = dbMove.totalGames;
        }
      }
    } catch { /* explorer unavailable — proceed without DB data */ }

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
      userColor: sideToMove,
      dbApproved,
      dbWinRate,
      dbGames,
      userWins: data.moveOutcomes.get(chosenMove)?.w ?? 0,
      userDraws: data.moveOutcomes.get(chosenMove)?.d ?? 0,
      userLosses: data.moveOutcomes.get(chosenMove)?.l ?? 0,
      openingName: fenOpeningName.get(fenBefore),
    });
  });

  // Real leaks first (sorted by cpLoss desc), then DB-approved sidelines
  leaks.sort((a, b) => {
    if (a.dbApproved !== b.dbApproved) return a.dbApproved ? 1 : -1;
    return b.cpLoss - a.cpLoss;
  });

  /* ── One-off opening mistakes (positions reached exactly 2 times with significant cpLoss) ── */
  const ONE_OFF_CP_THRESHOLD = 150; // higher bar since there's less data
  const MAX_ONE_OFFS = 20;
  const MAX_ONE_OFF_SCREENS = 60; // cap positions to screen for speed
  const ONE_OFF_SCREEN_DEPTH = 5; // cheaper screen pass
  const oneOffEntries = [...byFen.entries()].filter(
    ([, data]) => data.totalReachCount >= 2 && data.totalReachCount < MIN_POSITION_REPEATS
  ).slice(0, MAX_ONE_OFF_SCREENS);

  if (oneOffEntries.length > 0) {
    emitProgress(options, {
      phase: "eval",
      message: "🔎 Checking one-off opening mistakes",
      detail: `Screening ${oneOffEntries.length} non-repeated positions`,
      percent: 80,
    });
  }

  await parallelForEach(oneOffEntries, stockfishPool.size, async ([fenBefore, data], oIdx) => {
    if (oneOffMistakes.length >= MAX_ONE_OFFS) return;

    let chosenMove = "";
    let chosenCount = -1;
    for (const [move, count] of data.moveCounts.entries()) {
      if (count > chosenCount) {
        chosenMove = move;
        chosenCount = count;
      }
    }
    if (!chosenMove) return;

    const fenAfter = computeFenAfterMove(fenBefore, chosenMove);
    if (!fenAfter) return;

    const sideToMove: PlayerColor = fenBefore.includes(" w ") ? "white" : "black";

    // Quick screen at low depth first
    const screenBefore = await stockfishPool.evaluateFen(fenBefore, ONE_OFF_SCREEN_DEPTH);
    const screenAfter = await stockfishPool.evaluateFen(fenAfter, ONE_OFF_SCREEN_DEPTH);
    if (!screenBefore || !screenAfter) return;

    const screenEvalBefore = scoreToCpFromUserPerspective(screenBefore.cp, sideToMove, sideToMove);
    const opponentToMove: PlayerColor = sideToMove === "white" ? "black" : "white";
    const screenEvalAfter = scoreToCpFromUserPerspective(screenAfter.cp, opponentToMove, sideToMove);
    const screenCpLoss = screenEvalBefore - screenEvalAfter;

    if (screenCpLoss < ONE_OFF_CP_THRESHOLD) return;

    // Confirm at full depth
    const beforeEval = await stockfishPool.evaluateFen(fenBefore, engineDepth);
    const afterEval = await stockfishPool.evaluateFen(fenAfter, engineDepth);
    if (!beforeEval || !afterEval) return;

    const evalBefore = scoreToCpFromUserPerspective(beforeEval.cp, sideToMove, sideToMove);
    const evalAfter = scoreToCpFromUserPerspective(afterEval.cp, opponentToMove, sideToMove);
    const cpLoss = evalBefore - evalAfter;

    if (cpLoss < ONE_OFF_CP_THRESHOLD) return;

    const tags = deriveLeakTags({
      fenBefore,
      userMove: chosenMove,
      bestMove: beforeEval.bestMove,
      cpLoss,
      reachCount: data.totalReachCount,
      moveCount: chosenCount,
    });

    // DB validation — formula-based sideline detection
    let dbApproved = false;
    let dbWinRate: number | undefined;
    let dbGames: number | undefined;
    try {
      const explorer = await fetchExplorerMoves(fenBefore, sideToMove);
      const dbMove = explorer.moves.find(
        (m) => m.san === chosenMove || m.uci === chosenMove
      );
      if (dbMove && dbMove.totalGames >= 50 && dbMove.winRate >= 0.40) {
        const dbScore = Math.min(300, Math.log10(dbMove.totalGames) * 40 * (dbMove.winRate / 0.50));
        if (cpLoss <= dbScore) {
          dbApproved = true;
          dbWinRate = dbMove.winRate;
          dbGames = dbMove.totalGames;
        }
      }
    } catch { /* skip */ }

    // Don't flag DB-approved sidelines as one-off mistakes
    if (dbApproved) return;

    oneOffMistakes.push({
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
      userColor: sideToMove,
      userWins: data.moveOutcomes.get(chosenMove)?.w ?? 0,
      userDraws: data.moveOutcomes.get(chosenMove)?.d ?? 0,
      userLosses: data.moveOutcomes.get(chosenMove)?.l ?? 0,
      openingName: fenOpeningName.get(fenBefore),
    });
  });

  oneOffMistakes.sort((a, b) => b.cpLoss - a.cpLoss);

  } // end if (doOpenings)

  /* ── Phase: Missed Tactics Detection ─────────────────────────── */

  const TACTIC_CP_THRESHOLD = 200;
  // When tactics is a side-scan (openings mode), use cheaper screen depth for speed
  const SCREEN_DEPTH = (scanMode === "openings") ? 5 : 8;
  const SCREEN_CP_THRESHOLD = 100; // minimum CPL at screen depth to confirm at full depth
  const MAX_TACTICS = options?.maxTactics ?? Infinity;
  const missedTactics: MissedTactic[] = [];
  let totalTacticsFound = doTactics ? 0 : -1; // -1 sentinel = tactics not scanned

  if (doTactics) {

  const tacticsStart = doEndgames ? 73 : 81;
  const tacticsSpan = doEndgames ? 12 : 16;

  emitProgress(options, {
    phase: "tactics",
    message: "⚔️ Hunting for missed tactics",
    detail: `Scanning ${games.length} games for blunders and missed wins...`,
    percent: tacticsStart,
  });

  const seenTacticFens = new Set<string>();

  let tacticsGamesCompleted = 0;
  await parallelForEach(
    games.map((game, i) => ({ game, gameIndex: i })),
    stockfishPool.size,
    async ({ game, gameIndex }) => {
    if (!game.moves) return;

    const whiteName = game.whiteName;
    const blackName = game.blackName;
    const target = normalizeName(username);

    const userColor: PlayerColor | null =
      whiteName && normalizeName(whiteName) === target
        ? "white"
        : blackName && normalizeName(blackName) === target
          ? "black"
          : null;

    if (!userColor) return;

    // Collect rating if not already done via openings scan
    if (!doOpenings) {
      const gameRating = userColor === "white" ? game.whiteRating : game.blackRating;
      if (gameRating && gameRating > 0) playerRatings.push(gameRating);
    }

    tacticsGamesCompleted++;
    if (tacticsGamesCompleted % 10 === 0 || tacticsGamesCompleted === games.length) {
      emitProgress(options, {
        phase: "tactics",
        message: `⚔️ Scanning for missed tactics`,
        detail: `Game ${tacticsGamesCompleted} of ${games.length}`,
        current: tacticsGamesCompleted,
        total: games.length,
        percent: tacticsStart + Math.round((tacticsGamesCompleted / games.length) * tacticsSpan),
      });
    }

    const chess = new Chess();
    const allTokens = game.moves.split(" ").filter(Boolean);

    for (let ply = 0; ply < allTokens.length; ply += 1) {

      const sideToMove: PlayerColor = ply % 2 === 0 ? "white" : "black";
      const token = allTokens[ply];
      const fenBefore = chess.fen();

      if (sideToMove === userColor && !seenTacticFens.has(fenBefore)) {
        // Quick heuristic: skip dead-quiet positions (< 4 pieces total = trivial)
        const boardPieces = chess.board().flat().filter(Boolean);
        if (boardPieces.length < 4) {
          const ok = applyMoveToken(chess, token);
          if (!ok) break;
          continue;
        }

        // Check if captures or checks exist (forcing moves)
        const legalMoves = chess.moves({ verbose: true });
        const hasForcingMoves = legalMoves.some(
          (m) => m.captured || m.san.includes("+") || m.san.includes("#")
        );

        if (hasForcingMoves) {
          // === Two-pass depth screening ===
          // Pass 1: cheap screen at low depth
          const screenBefore = await stockfishPool.evaluateFen(fenBefore, SCREEN_DEPTH);
          if (!screenBefore || !screenBefore.bestMove) {
            const ok = applyMoveToken(chess, token);
            if (!ok) break;
            continue;
          }

          // Check if the best move at screen depth is forcing
          const screenBestSan = sanForMove(fenBefore, screenBefore.bestMove);
          const isScreenBestForcing =
            screenBestSan &&
            (screenBestSan.includes("x") || screenBestSan.includes("+") || screenBestSan.includes("#"));

          if (!isScreenBestForcing) {
            const ok = applyMoveToken(chess, token);
            if (!ok) break;
            continue;
          }

          // Quick screen: did user play the best move? If so, skip.
          const screenUserUci = moveToUci(chess, token);
          if (!screenUserUci || screenUserUci === screenBefore.bestMove) {
            const ok = applyMoveToken(chess, token);
            if (!ok) break;
            continue;
          }

          // Screen-depth eval after user's move
          const screenFenAfter = computeFenAfterMove(fenBefore, token);
          if (!screenFenAfter) {
            const ok = applyMoveToken(chess, token);
            if (!ok) break;
            continue;
          }
          const screenAfter = await stockfishPool.evaluateFen(screenFenAfter, SCREEN_DEPTH);
          if (!screenAfter) {
            const ok = applyMoveToken(chess, token);
            if (!ok) break;
            continue;
          }

          const screenCpBefore = scoreToCpFromUserPerspective(screenBefore.cp, sideToMove, userColor);
          const screenOpponent: PlayerColor = sideToMove === "white" ? "black" : "white";
          const screenCpAfter = scoreToCpFromUserPerspective(screenAfter.cp, screenOpponent, userColor);
          const screenCpLoss = screenCpBefore - screenCpAfter;

          // If screen CPL is below threshold, skip — not a real tactic
          if (screenCpLoss < SCREEN_CP_THRESHOLD) {
            const ok = applyMoveToken(chess, token);
            if (!ok) break;
            continue;
          }

          // Count this as a confirmed tactic at screen depth
          totalTacticsFound++;

          // If we already have enough detailed samples, skip full-depth confirmation
          if (missedTactics.length >= MAX_TACTICS) {
            seenTacticFens.add(fenBefore);
            const ok = applyMoveToken(chess, token);
            if (!ok) break;
            continue;
          }

          // === Pass 2: confirm at full depth ===
          const beforeEval = await stockfishPool.evaluateFen(fenBefore, engineDepth);

          if (beforeEval && beforeEval.bestMove) {
            const bestMoveSan = sanForMove(fenBefore, beforeEval.bestMove);
            const isBestMoveForcing =
              bestMoveSan &&
              (bestMoveSan.includes("x") || bestMoveSan.includes("+") || bestMoveSan.includes("#"));

            if (isBestMoveForcing) {
              const userUci = moveToUci(chess, token);

              if (userUci && userUci !== beforeEval.bestMove) {
                const fenAfterUser = computeFenAfterMove(fenBefore, token);

                if (fenAfterUser) {
                  const afterEval = await stockfishPool.evaluateFen(fenAfterUser, engineDepth);

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
  });

  missedTactics.sort((a, b) => b.cpLoss - a.cpLoss);
  } // end if (doTactics)

  /* ── Phase: Endgame Analysis ────────────────────────────────── */

  const ENDGAME_CP_THRESHOLD = 80; // flag endgame mistakes ≥ 80cp
  const MAX_ENDGAME_MISTAKES = options?.maxEndgames ?? Infinity;
  const endgameMistakes: EndgameMistake[] = [];

  // Track conversion/hold data for stats
  let wonEndgames = 0;      // endgames where user had eval > +150 at start
  let convertedWins = 0;    // of those, how many were actually won
  let slightlyWorse = 0;    // endgames where user had eval between -50 and -150
  let heldDraws = 0;        // of those, how many were drawn
  let totalEndgameCpLoss = 0;
  let totalEndgameMoves = 0;
  const typeStats = new Map<EndgameType, { count: number; totalCpLoss: number; mistakes: number }>();

  if (doEndgames) {

  const endgameStart = doTactics ? 86 : 81;
  const endgameSpan = doTactics ? 11 : 16;

  emitProgress(options, {
    phase: "endgames",
    message: "♟️ Scanning endgames",
    detail: `Analysing endgame play across ${games.length} games...`,
    percent: endgameStart,
  });

  const ENDGAME_SCREEN_DEPTH = 8;

  let endgameGamesCompleted = 0;
  await parallelForEach(
    games.map((game, i) => ({ game, gameIndex: i })),
    stockfishPool.size,
    async ({ game, gameIndex }) => {
    if (endgameMistakes.length >= MAX_ENDGAME_MISTAKES) return;

    if (!game.moves) return;

    const target = normalizeName(username);
    const userColor: PlayerColor | null =
      game.whiteName && normalizeName(game.whiteName) === target
        ? "white"
        : game.blackName && normalizeName(game.blackName) === target
          ? "black"
          : null;
    if (!userColor) return;

    // Collect rating if needed
    if (!doOpenings && !doTactics) {
      const gameRating = userColor === "white" ? game.whiteRating : game.blackRating;
      if (gameRating && gameRating > 0) playerRatings.push(gameRating);
    }

    endgameGamesCompleted++;
    if (endgameGamesCompleted % 10 === 0 || endgameGamesCompleted === games.length) {
      emitProgress(options, {
        phase: "endgames",
        message: "♟️ Scanning endgames",
        detail: `Game ${endgameGamesCompleted} of ${games.length}`,
        current: endgameGamesCompleted,
        total: games.length,
        percent: endgameStart + Math.round((endgameGamesCompleted / games.length) * endgameSpan),
      });
    }

    const chess = new Chess();
    const allTokens = game.moves.split(" ").filter(Boolean);
    let enteredEndgame = false;
    let endgameStartEval: number | null = null;
    let endgameType: EndgameType = "Complex";

    for (let ply = 0; ply < allTokens.length; ply += 1) {
      const token = allTokens[ply];
      const fenBefore = chess.fen();
      const sideToMove: PlayerColor = ply % 2 === 0 ? "white" : "black";

      // Check if we've entered the endgame
      if (!enteredEndgame && isEndgame(chess)) {
        enteredEndgame = true;
        endgameType = classifyEndgameType(chess);

        // Get eval at endgame start to track conversion/hold — always evaluate,
        // regardless of whose move it is (previous code skipped ~50% of games)
        const startEv = await stockfishPool.evaluateFen(fenBefore, Math.min(engineDepth, 12));
        if (startEv) {
          endgameStartEval = scoreToCpFromUserPerspective(startEv.cp, sideToMove, userColor);
        }
      }

      if (enteredEndgame && sideToMove === userColor) {
        // Early exit: stop deep-scanning this game once we have enough endgame samples
        if (endgameMistakes.length >= MAX_ENDGAME_MISTAKES && MAX_ENDGAME_MISTAKES !== Infinity) {
          const ok = applyMoveToken(chess, token);
          if (!ok) break;
          continue;
        }

        // Endgame move sampling: evaluate captures, checks, and every 2nd move
        const egLegalMoves = chess.moves({ verbose: true });
        const userMoveToken = token;
        const egUserMove = egLegalMoves.find(m => m.san === userMoveToken || m.lan === userMoveToken);
        const isCapture = egUserMove?.captured;
        const isCheck = userMoveToken.includes("+") || userMoveToken.includes("#");
        // endgamePlyCounter tracks user plies in endgame for sampling
        if (!isCapture && !isCheck && totalEndgameMoves % 2 !== 0) {
          // Skip non-forcing moves on odd indices (sample every 2nd quiet move)
          totalEndgameMoves += 1;
          const ok = applyMoveToken(chess, token);
          if (!ok) break;
          continue;
        }

        // Evaluate the user's endgame move — two-pass depth screening
        // Pass 1: cheap screen at low depth
        const screenBefore = await stockfishPool.evaluateFen(fenBefore, ENDGAME_SCREEN_DEPTH);
        if (!screenBefore || !screenBefore.bestMove) {
          totalEndgameMoves += 1;
          const ok = applyMoveToken(chess, token);
          if (!ok) break;
          continue;
        }

        const userUci = moveToUci(chess, token);
        // If user played the engine's top choice at screen depth, skip (no mistake)
        if (!userUci || userUci === screenBefore.bestMove) {
          totalEndgameMoves += 1;
          const ok = applyMoveToken(chess, token);
          if (!ok) break;
          continue;
        }

        const fenAfterUser = computeFenAfterMove(fenBefore, token);
        if (!fenAfterUser) {
          totalEndgameMoves += 1;
          const ok = applyMoveToken(chess, token);
          if (!ok) break;
          continue;
        }

        const screenAfter = await stockfishPool.evaluateFen(fenAfterUser, ENDGAME_SCREEN_DEPTH);
        if (!screenAfter) {
          totalEndgameMoves += 1;
          const ok = applyMoveToken(chess, token);
          if (!ok) break;
          continue;
        }

        const screenCpBefore = scoreToCpFromUserPerspective(screenBefore.cp, sideToMove, userColor);
        const screenOpponent: PlayerColor = sideToMove === "white" ? "black" : "white";
        const screenCpAfter = scoreToCpFromUserPerspective(screenAfter.cp, screenOpponent, userColor);
        const screenCpLoss = Math.max(0, screenCpBefore - screenCpAfter);

        // If screen shows no significant loss, count as clean move and skip full depth
        if (screenCpLoss < ENDGAME_CP_THRESHOLD * 0.6) {
          totalEndgameCpLoss += screenCpLoss;
          totalEndgameMoves += 1;
          // Update type stats with screen values
          const ts = typeStats.get(endgameType) ?? { count: 0, totalCpLoss: 0, mistakes: 0 };
          ts.count += 1;
          ts.totalCpLoss += screenCpLoss;
          typeStats.set(endgameType, ts);
          const ok = applyMoveToken(chess, token);
          if (!ok) break;
          continue;
        }

        // Pass 2: confirm at full depth
        const beforeEval = await stockfishPool.evaluateFen(fenBefore, engineDepth);

        if (beforeEval && beforeEval.bestMove) {

          if (userUci) {

            if (fenAfterUser) {
              const afterEval = await stockfishPool.evaluateFen(fenAfterUser, engineDepth);

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

                const cpLoss = Math.max(0, cpBefore - cpAfterUser);
                totalEndgameCpLoss += cpLoss;
                totalEndgameMoves += 1;

                // Update type stats
                const ts = typeStats.get(endgameType) ?? { count: 0, totalCpLoss: 0, mistakes: 0 };
                ts.count += 1;
                ts.totalCpLoss += cpLoss;

                if (cpLoss >= ENDGAME_CP_THRESHOLD) {
                  ts.mistakes += 1;

                  if (endgameMistakes.length < MAX_ENDGAME_MISTAKES) {
                    const fullMoveNumber = Math.floor(ply / 2) + 1;
                    const tags: string[] = [];

                    if (cpLoss >= 300) tags.push("Blunder");
                    else if (cpLoss >= 150) tags.push("Mistake");
                    else tags.push("Inaccuracy");

                    // Add endgame-specific tags
                    if (endgameType !== "Complex") tags.push(endgameType + " Endgame");

                    // Check if it's a conversion failure (was winning, blundered)
                    if (cpBefore > 150 && cpAfterUser < 50) tags.push("Failed Conversion");
                    // Check for stalemate-related errors
                    const afterChess = new Chess(fenAfterUser);
                    if (afterChess.isStalemate()) tags.push("Stalemate!");

                    endgameMistakes.push({
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
                      endgameType,
                      tags
                    });
                  }
                }

                typeStats.set(endgameType, ts);
              }
            }
          }
        }
      }

      const ok = applyMoveToken(chess, token);
      if (!ok) break;
    }

    // Track conversion/hold for this game's endgame
    // Use game.winner from the source API (Lichess/Chess.com) instead of
    // inferGameResult which can only detect checkmate/stalemate from FEN
    // and misses resignation/timeout (the vast majority of games).
    if (enteredEndgame && endgameStartEval !== null && game.winner) {
      const userWon = game.winner === userColor;
      const drew = game.winner === "draw";

      if (endgameStartEval > 100) {
        // User had a winning advantage at endgame start
        wonEndgames++;
        if (userWon) convertedWins++;
      } else if (endgameStartEval >= -200 && endgameStartEval <= -50) {
        // User was slightly worse — did they hold?
        slightlyWorse++;
        if (drew || userWon) heldDraws++;
      }
    }
  });

  endgameMistakes.sort((a, b) => b.cpLoss - a.cpLoss);
  } // end if (doEndgames)

  // Compute endgame stats
  const endgameStats: EndgameStats | null = totalEndgameMoves > 0 ? (() => {
    const byType: EndgameStats["byType"] = [];
    let worstAvg = -1;
    let weakestType: EndgameType | null = null;

    for (const [type, data] of typeStats) {
      const avg = data.count > 0 ? data.totalCpLoss / data.count : 0;
      byType.push({ type, count: data.count, avgCpLoss: Math.round(avg), mistakes: data.mistakes });
      if (avg > worstAvg && data.count >= 3) { worstAvg = avg; weakestType = type; }
    }
    byType.sort((a, b) => b.avgCpLoss - a.avgCpLoss);
    // Filter out categories with only 1 position — too small a sample to rank reliably
    const rankedByType = byType.filter(t => t.count >= 2);

    return {
      totalPositions: totalEndgameMoves,
      avgCpLoss: Math.round(totalEndgameCpLoss / totalEndgameMoves),
      conversionRate: wonEndgames >= 3 ? Math.round((convertedWins / wonEndgames) * 100) : null,
      holdRate: slightlyWorse >= 3 ? Math.round((heldDraws / slightlyWorse) * 100) : null,
      byType: rankedByType,
      weakestType,
    };
  })() : null;

  emitProgress(options, {
    phase: "done",
    message: `✅ Analysis complete`,
    detail: `Found ${leaks.length} opening leak${leaks.length !== 1 ? "s" : ""}, ${missedTactics.length} missed tactic${missedTactics.length !== 1 ? "s" : ""}, and ${endgameMistakes.length} endgame mistake${endgameMistakes.length !== 1 ? "s" : ""}`,
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

  // ── Compute detailed Time Management Report with per-move moments ──
  const timeManagement: TimeManagementReport | null = (() => {
    if (timeManagementScore == null) return null;

    const target = normalizeName(username);
    const moments: TimeMoment[] = [];
    let totalSpentSec = 0;
    let totalMoves = 0;
    let scrambleCount = 0;
    let gamesWithClocks = 0;

    // Pre-build a set of missed-tactic FENs for cross-referencing
    const tacticFenSet = new Set(missedTactics.map(t => t.fenBefore));

    for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
      const game = games[gameIndex];
      if (!game.clocks || game.clocks.length < 4) continue;
      gamesWithClocks++;

      const userColor: PlayerColor | null =
        game.whiteName && normalizeName(game.whiteName) === target ? "white"
        : game.blackName && normalizeName(game.blackName) === target ? "black"
        : null;
      if (!userColor) continue;

      const startPly = userColor === "white" ? 0 : 1;
      const userClocks: number[] = [];
      for (let p = startPly; p < game.clocks.length; p += 2) {
        userClocks.push(game.clocks[p]); // centiseconds remaining
      }
      if (userClocks.length < 2) continue;

      // Detect time scramble for this game
      const initialTime = userClocks[0];
      if (initialTime > 0 && Math.min(...userClocks) < initialTime * 0.1) {
        scrambleCount++;
      }

      // Walk the game moves to pair clock data with position info
      const allTokens = (game.moves ?? "").split(" ").filter(Boolean);
      const chess = new Chess();
      let userMoveIdx = 0; // index into userClocks

      for (let ply = 0; ply < allTokens.length; ply++) {
        const sideToMove: PlayerColor = ply % 2 === 0 ? "white" : "black";
        const fenBefore = chess.fen();
        const token = allTokens[ply];

        if (sideToMove === userColor) {
          // Compute time spent (this is userMoveIdx+1 vs userMoveIdx)
          // userClocks[0] is remaining after first user move, etc.
          if (userMoveIdx > 0 && userMoveIdx < userClocks.length) {
            const spent = Math.max(0, userClocks[userMoveIdx - 1] - userClocks[userMoveIdx]) / 100;
            const remaining = userClocks[userMoveIdx] / 100;
            const fullMoveNumber = Math.floor(ply / 2) + 1;

            totalSpentSec += spent;
            totalMoves++;

            // Assess position complexity using lightweight heuristics:
            // 1. Are there forcing moves (captures, checks)?
            // 2. Is this a known missed-tactic position?
            // 3. Move number (opening = low complexity for time)
            // 4. Piece count (endgame = potentially complex)
            const legalMoves = chess.moves({ verbose: true });
            const captures = legalMoves.filter(m => m.captured);
            const checks = legalMoves.filter(m => m.san.includes("+") || m.san.includes("#"));
            const hasForcingMoves = captures.length > 0 || checks.length > 0;
            const boardPieces = chess.board().flat().filter(Boolean);
            const pieceCount = boardPieces.length;
            const isTactical = hasForcingMoves && (captures.length >= 2 || checks.length >= 1);
            const isKnownTactic = tacticFenSet.has(fenBefore);

            // Complexity 0-100
            let complexity = 30; // baseline
            if (fullMoveNumber <= 6) complexity = 10; // book territory, should be fast
            else if (fullMoveNumber <= 12) complexity = 25; // early middlegame
            if (isTactical) complexity += 25;
            if (isKnownTactic) complexity += 30;
            if (legalMoves.length >= 30) complexity += 10; // many options
            if (pieceCount <= 8 && fullMoveNumber >= 25) complexity += 15; // endgame tech

            // King safety: open king (missing pawn shield) = natural to think longer
            {
              const ourColor = userColor === "white" ? "w" : "b";
              const board = chess.board();
              const kingSquare = (() => {
                for (let r = 0; r < 8; r++)
                  for (let c = 0; c < 8; c++) {
                    const p = board[r][c];
                    if (p && p.type === "k" && p.color === ourColor) return { r, c };
                  }
                return null;
              })();
              if (kingSquare) {
                // Check pawns directly shielding the king (row in front, ±1 col)
                const shieldRow = ourColor === "w" ? kingSquare.r - 1 : kingSquare.r + 1;
                if (shieldRow >= 0 && shieldRow < 8) {
                  let shieldPawns = 0;
                  for (let dc = -1; dc <= 1; dc++) {
                    const sc = kingSquare.c + dc;
                    if (sc >= 0 && sc < 8) {
                      const sq = board[shieldRow][sc];
                      if (sq && sq.type === "p" && sq.color === ourColor) shieldPawns++;
                    }
                  }
                  // Missing 2+ shield pawns = exposed king, bump complexity
                  if (shieldPawns <= 1 && fullMoveNumber > 10 && pieceCount > 10) {
                    complexity += 20;
                  }
                }
                // Also check if opponent has pieces aimed at king area (checks available)
                if (checks.length > 0) complexity += 10;
              }
            }

            complexity = Math.min(100, complexity);

            // Cross reference with missed tactics to get cpLoss + bestMove
            const matchingTactic = missedTactics.find(
              t => t.fenBefore === fenBefore && t.gameIndex === gameIndex + 1
            );
            const cpLoss = matchingTactic?.cpLoss ?? null;
            const bestMove = matchingTactic?.bestMove ?? null;

            // Compute average time per move so far for this game
            const gameMoveTimesSoFar: number[] = [];
            for (let j = 1; j <= userMoveIdx && j < userClocks.length; j++) {
              gameMoveTimesSoFar.push(Math.max(0, userClocks[j - 1] - userClocks[j]) / 100);
            }
            const gameAvg = gameMoveTimesSoFar.length > 0
              ? gameMoveTimesSoFar.reduce((s, v) => s + v, 0) / gameMoveTimesSoFar.length
              : spent;

            // Determine verdict
            let verdict: TimeVerdict = "neutral";
            let reason = "";

            // WASTED: spent >3× game average on a simple position (complexity < 30)
            if (spent > gameAvg * 3 && complexity < 30 && spent > 5) {
              verdict = "wasted";
              if (fullMoveNumber <= 6) {
                reason = `Spent ${spent.toFixed(1)}s on move ${fullMoveNumber} — deep in book territory where theory is well established. Save time for critical moments.`;
              } else {
                reason = `Spent ${spent.toFixed(1)}s on a straightforward position (complexity ${complexity}/100). Your game average is ${gameAvg.toFixed(1)}s — this cost you valuable clock time.`;
              }
            }
            // RUSHED: spent <40% of game average on a complex position (complexity ≥ 60)
            else if (spent < gameAvg * 0.4 && complexity >= 60 && spent < 10) {
              verdict = "rushed";
              if (isKnownTactic) {
                reason = `Only ${spent.toFixed(1)}s on a critical tactical moment (you missed a tactic here${cpLoss ? ` losing ${(cpLoss / 100).toFixed(1)} pawns` : ""}). This position deserved deep calculation.`;
              } else {
                reason = `Only ${spent.toFixed(1)}s on a complex position with ${legalMoves.length} legal moves and forcing options. Slowing down here could have found better moves.`;
              }
            }
            // JUSTIFIED: spent significant time and got it right (no cpLoss or low cpLoss) on complex position
            else if (spent > gameAvg * 1.5 && complexity >= 50 && (cpLoss === null || cpLoss < 50)) {
              verdict = "justified";
              if (isKnownTactic) {
                reason = `Invested ${spent.toFixed(1)}s on a tactical position and found the right idea. Good time allocation on a critical moment.`;
              } else {
                reason = `Spent ${spent.toFixed(1)}s on a complex position (complexity ${complexity}/100) and played accurately. This is exactly when to invest time.`;
              }
            }

            // Only record notable moments (not neutral ones or very short games)
            if (verdict !== "neutral" && allTokens.length >= 10) {
              // Get user move as UCI
              let userMoveUci = token;
              try {
                const tempChess = new Chess(fenBefore);
                if (isUciMove(token)) {
                  const result = tempChess.move({
                    from: token.slice(0, 2),
                    to: token.slice(2, 4),
                    promotion: token.slice(4, 5) || undefined,
                  });
                  if (result) userMoveUci = `${result.from}${result.to}${result.promotion ?? ""}`;
                } else {
                  const result = tempChess.move(token);
                  if (result) userMoveUci = `${result.from}${result.to}${result.promotion ?? ""}`;
                }
              } catch { /* keep original */ }

              moments.push({
                gameIndex: gameIndex + 1,
                moveNumber: fullMoveNumber,
                fen: fenBefore,
                userMove: userMoveUci,
                userColor,
                timeSpentSec: Math.round(spent * 10) / 10,
                timeRemainingSec: Math.round(remaining),
                complexity,
                verdict,
                reason,
                cpLoss,
                isTactical,
                evalBefore: matchingTactic?.cpBefore ?? null,
                bestMove,
              });
            }
          }
          userMoveIdx++;
        }

        // Apply the move
        try {
          if (isUciMove(token)) {
            chess.move({
              from: token.slice(0, 2),
              to: token.slice(2, 4),
              promotion: token.slice(4, 5) || undefined,
            });
          } else {
            chess.move(token);
          }
        } catch {
          break;
        }
      }
    }

    if (moments.length === 0 && gamesWithClocks < 2) return null;

    // Sort: wasted/rushed first (bad moments), then justified (good moments)
    const verdictOrder: Record<TimeVerdict, number> = { wasted: 0, rushed: 1, justified: 2, neutral: 3 };
    moments.sort((a, b) => {
      const vd = verdictOrder[a.verdict] - verdictOrder[b.verdict];
      if (vd !== 0) return vd;
      // Within same verdict, sort by impact (time spent descending for wasted, cpLoss for rushed)
      if (a.verdict === "wasted") return b.timeSpentSec - a.timeSpentSec;
      if (a.verdict === "rushed") return (b.cpLoss ?? 0) - (a.cpLoss ?? 0);
      return b.complexity - a.complexity;
    });

    // Cap at 30 moments to keep payload reasonable
    const cappedMoments = moments.slice(0, 30);

    return {
      score: timeManagementScore,
      moments: cappedMoments,
      gamesWithClockData: gamesWithClocks,
      avgTimePerMove: totalMoves > 0 ? Math.round((totalSpentSec / totalMoves) * 10) / 10 : 0,
      timeScrambleCount: scrambleCount,
      justifiedThinks: moments.filter(m => m.verdict === "justified").length,
      wastedThinks: moments.filter(m => m.verdict === "wasted").length,
      rushedMoves: moments.filter(m => m.verdict === "rushed").length,
    };
  })();

  // ── Compute Mental / Psychology Stats from game outcomes ──
  const mentalStats: MentalStats | null = (() => {
    if (games.length < 3) return null;

    const target = normalizeName(username);
    type UserResult = "win" | "loss" | "draw";
    type GameMeta = {
      result: UserResult;
      termination?: GameTermination;
      userColor: "white" | "black";
      moveCount: number; // total half-moves (plies) in the game
    };
    const gameMetas: GameMeta[] = [];

    for (const game of games) {
      const userColor: "white" | "black" | null =
        game.whiteName && normalizeName(game.whiteName) === target ? "white"
        : game.blackName && normalizeName(game.blackName) === target ? "black"
        : null;
      if (!userColor) continue;

      let result: UserResult;
      if (!game.winner || game.winner === "draw") result = "draw";
      else if (game.winner === userColor) result = "win";
      else result = "loss";

      const moveCount = game.moves ? game.moves.trim().split(/\s+/).length : 0;

      gameMetas.push({ result, termination: game.termination, userColor, moveCount });
    }

    if (gameMetas.length < 3) return null;

    const total = gameMetas.length;
    const wins = gameMetas.filter(g => g.result === "win").length;
    const losses = gameMetas.filter(g => g.result === "loss").length;
    const draws = gameMetas.filter(g => g.result === "draw").length;

    // Tilt rate: after a loss, how often does the next game also result in a loss?
    let postLossGames = 0;
    let postLossLosses = 0;
    let postLossWins = 0;
    for (let i = 1; i < gameMetas.length; i++) {
      if (gameMetas[i - 1].result === "loss") {
        postLossGames++;
        if (gameMetas[i].result === "loss") postLossLosses++;
        if (gameMetas[i].result === "win") postLossWins++;
      }
    }
    const tiltRate = postLossGames > 0 ? (postLossLosses / postLossGames) * 100 : 0;
    const postLossWinRate = postLossGames > 0 ? (postLossWins / postLossGames) * 100 : 0;

    // Timeout rate: % of games user lost on time
    const userTimeouts = gameMetas.filter(g => g.result === "loss" && g.termination === "timeout").length;
    const timeoutRate = total > 0 ? (userTimeouts / total) * 100 : 0;

    // Resign rate: % of losses that were resignations
    const userResigns = gameMetas.filter(g => g.result === "loss" && g.termination === "resign").length;
    const resignRate = losses > 0 ? (userResigns / losses) * 100 : 0;

    // Max streak (longest consecutive wins or losses)
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    for (const g of gameMetas) {
      if (g.result === "win") {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (g.result === "loss") {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    }
    const maxStreak = Math.max(maxWinStreak, maxLossStreak);
    const streakType: "win" | "loss" = maxWinStreak >= maxLossStreak ? "win" : "loss";

    // Stability score (0-100): based on how consistent results are.
    // Use a sliding window of 5 games, measure std dev of score (1=win, 0.5=draw, 0=loss)
    // High stability = low variance across windows = predictable performance
    const scores: number[] = gameMetas.map(g => g.result === "win" ? 1 : g.result === "draw" ? 0.5 : 0);
    const windowSize = Math.min(5, Math.floor(scores.length / 2));
    let stabilityScore = 50;
    if (windowSize >= 2) {
      const windowAvgs: number[] = [];
      for (let i = 0; i <= scores.length - windowSize; i++) {
        const window = scores.slice(i, i + windowSize);
        windowAvgs.push(window.reduce((s, v) => s + v, 0) / window.length);
      }
      if (windowAvgs.length >= 2) {
        const wMean = windowAvgs.reduce((s, v) => s + v, 0) / windowAvgs.length;
        const wVariance = windowAvgs.reduce((s, v) => s + (v - wMean) ** 2, 0) / windowAvgs.length;
        const wStd = Math.sqrt(wVariance);
        // std of 0 = perfect stability (100), std of 0.4+ = very unstable (~20)
        stabilityScore = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-wStd * 4))));
      }
    }

    return {
      stability: stabilityScore,
      tiltRate: Math.round(tiltRate * 10) / 10,
      postLossWinRate: Math.round(postLossWinRate * 10) / 10,
      timeoutRate: Math.round(timeoutRate * 10) / 10,
      maxStreak,
      streakType,
      resignRate: Math.round(resignRate * 10) / 10,
      totalGames: total,
      wins,
      losses,
      draws,

      // ── Pro-only advanced breakdowns ──
      // Color performance
      whiteWinRate: (() => {
        const wGames = gameMetas.filter(g => g.userColor === "white");
        if (wGames.length === 0) return 0;
        return Math.round((wGames.filter(g => g.result === "win").length / wGames.length) * 1000) / 10;
      })(),
      blackWinRate: (() => {
        const bGames = gameMetas.filter(g => g.userColor === "black");
        if (bGames.length === 0) return 0;
        return Math.round((bGames.filter(g => g.result === "win").length / bGames.length) * 1000) / 10;
      })(),
      whiteGames: gameMetas.filter(g => g.userColor === "white").length,
      blackGames: gameMetas.filter(g => g.userColor === "black").length,

      // Early collapse: losses in ≤40 plies (20 full moves)
      earlyLossRate: losses > 0
        ? Math.round((gameMetas.filter(g => g.result === "loss" && g.moveCount <= 40).length / losses) * 1000) / 10
        : 0,

      // Draw rate
      drawRate: total > 0 ? Math.round((draws / total) * 1000) / 10 : 0,

      // Post-win momentum
      postWinWinRate: (() => {
        let postWinGames = 0;
        let postWinWins = 0;
        for (let i = 1; i < gameMetas.length; i++) {
          if (gameMetas[i - 1].result === "win") {
            postWinGames++;
            if (gameMetas[i].result === "win") postWinWins++;
          }
        }
        return postWinGames > 0 ? Math.round((postWinWins / postWinGames) * 1000) / 10 : 0;
      })(),

      // Average game length in wins vs losses (convert plies to full moves)
      avgMovesWin: (() => {
        const winGames = gameMetas.filter(g => g.result === "win" && g.moveCount > 0);
        if (winGames.length === 0) return 0;
        return Math.round(winGames.reduce((s, g) => s + g.moveCount, 0) / winGames.length / 2);
      })(),
      avgMovesLoss: (() => {
        const lossGames = gameMetas.filter(g => g.result === "loss" && g.moveCount > 0);
        if (lossGames.length === 0) return 0;
        return Math.round(lossGames.reduce((s, g) => s + g.moveCount, 0) / lossGames.length / 2);
      })(),

      maxWinStreak,
      maxLossStreak,

      // Comeback rate: wins in games ≥60 plies (likely had to fight back)
      comebackRate: wins > 0
        ? Math.round((gameMetas.filter(g => g.result === "win" && g.moveCount >= 60).length / wins) * 1000) / 10
        : 0,

      // Decisiveness: % of non-draw games
      decisiveness: total > 0 ? Math.round(((wins + losses) / total) * 1000) / 10 : 0,

      // Mate finish rate: % of wins that ended in checkmate
      mateFinishRate: wins > 0
        ? Math.round((gameMetas.filter(g => g.result === "win" && g.termination === "mate").length / wins) * 1000) / 10
        : 0,

      // Recent form: last 10 games as W/L/D
      recentForm: gameMetas.slice(-10).map(g =>
        g.result === "win" ? "W" as const : g.result === "loss" ? "L" as const : "D" as const
      ),

      // Emotional archetype
      archetype: (() => {
        const winRate = total > 0 ? wins / total : 0;
        const tiltPct = tiltRate;
        const stab = stabilityScore;

        // Grinder: high comeback + long avg wins
        const avgWinMoves = gameMetas.filter(g => g.result === "win" && g.moveCount > 0);
        const avgWM = avgWinMoves.length > 0
          ? avgWinMoves.reduce((s, g) => s + g.moveCount, 0) / avgWinMoves.length / 2
          : 30;

        if (tiltPct >= 55) return "🔥 The Tilter";
        if (stab >= 75 && winRate >= 0.55) return "🧊 Ice Veins";
        if (stab >= 75 && winRate < 0.55) return "⚖️ The Rock";
        if (maxLossStreak >= 6) return "📉 Spiral Risk";
        if (maxWinStreak >= 7) return "🚀 Momentum Player";
        if (avgWM >= 45) return "⚙️ The Grinder";
        if (resignRate >= 70) return "🏳️ Quick Quitter";
        if (draws / Math.max(1, total) >= 0.25) return "🤝 The Diplomat";
        if (winRate >= 0.6) return "💪 The Closer";
        if (postLossWinRate >= 50) return "🔄 Bounce-Back King";
        return "🎯 The Competitor";
      })(),
    };
  })();

  return {
    username,
    gamesAnalyzed,
    repeatedPositions,
    leaks,
    oneOffMistakes,
    missedTactics,
    totalTacticsFound,
    endgameMistakes,
    endgameStats,
    playerRating,
    timeManagementScore,
    timeManagement,
    mentalStats,
    openingSummaries: openingSummaries.length > 0 ? openingSummaries : undefined,
    diagnostics: {
      gameTraces,
      positionTraces
    }
  };
}
