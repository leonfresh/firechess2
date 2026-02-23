import { Chess } from "chess.js";
import type {
  AggregatedPosition,
  PlayerColor,
  RepeatedOpeningLeak
} from "@/lib/types";

type LichessPlayer = {
  user?: {
    name?: string;
  };
};

type LichessGame = {
  id?: string;
  moves?: string;
  players?: {
    white?: LichessPlayer;
    black?: LichessPlayer;
  };
};

type CloudPv = {
  cp?: number;
  mate?: number;
  moves?: string;
};

type CloudEvalResponse = {
  pvs?: CloudPv[];
};

type HttpError = Error & {
  status?: number;
};

const MIN_POSITION_REPEATS = 3;
const CP_LOSS_THRESHOLD = 100;
const MATE_CP = 100000;
const DEFAULT_MAX_GAMES = 100;
const DEFAULT_MAX_OPENING_MOVES = 12;

type AnalyzeOptions = {
  maxGames?: number;
  maxOpeningMoves?: number;
  cpLossThreshold?: number;
};

const cloudEvalCache = new Map<string, CloudEvalResponse | null>();

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function isUciMove(move: string): boolean {
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
}

function parseUciMove(move: string) {
  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move.slice(4, 5) || undefined
  };
}

function applyMoveToken(chess: Chess, moveToken: string): boolean {
  try {
    if (isUciMove(moveToken)) {
      const parsed = parseUciMove(moveToken);
      return !!chess.move(parsed);
    }

    return !!chess.move(moveToken);
  } catch {
    return false;
  }
}

function parseGamesPayload(payload: string): LichessGame[] {
  const trimmed = payload.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed as LichessGame[];
    if (parsed?.games && Array.isArray(parsed.games)) {
      return parsed.games as LichessGame[];
    }
  } catch {
    // NDJSON fallback below
  }

  return trimmed
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

function colorForUser(game: LichessGame, username: string): PlayerColor | null {
  const target = normalizeName(username);
  const whiteName = game.players?.white?.user?.name;
  const blackName = game.players?.black?.user?.name;

  if (whiteName && normalizeName(whiteName) === target) return "white";
  if (blackName && normalizeName(blackName) === target) return "black";
  return null;
}

function aggregateOpeningPositions(
  games: LichessGame[],
  username: string,
  maxOpeningPlies: number
): {
  aggregated: AggregatedPosition[];
  gamesAnalyzed: number;
} {
  const byFen = new Map<
    string,
    { totalReachCount: number; moveCounts: Map<string, number> }
  >();

  let gamesAnalyzed = 0;

  for (const game of games) {
    if (!game.moves) continue;

    const userColor = colorForUser(game, username);
    if (!userColor) continue;

    gamesAnalyzed += 1;

    const chess = new Chess();
    const moveTokens = game.moves.split(" ").filter(Boolean).slice(0, maxOpeningPlies);

    for (let plyIndex = 0; plyIndex < moveTokens.length; plyIndex += 1) {
      const sideToMove: PlayerColor = plyIndex % 2 === 0 ? "white" : "black";
      const token = moveTokens[plyIndex];

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
    }
  }

  const aggregated: AggregatedPosition[] = [];

  for (const [fenBefore, data] of byFen.entries()) {
    if (data.totalReachCount < MIN_POSITION_REPEATS) continue;

    let chosenMove = "";
    let chosenMoveCount = -1;
    const moveCountsObj: Record<string, number> = {};

    for (const [move, count] of data.moveCounts.entries()) {
      moveCountsObj[move] = count;
      if (count > chosenMoveCount) {
        chosenMove = move;
        chosenMoveCount = count;
      }
    }

    if (!chosenMove) continue;

    aggregated.push({
      fenBefore,
      totalReachCount: data.totalReachCount,
      moveCounts: moveCountsObj,
      chosenMove,
      chosenMoveCount
    });
  }

  return { aggregated, gamesAnalyzed };
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

function makeHttpError(message: string, status?: number): HttpError {
  const err = new Error(message) as HttpError;
  err.status = status;
  return err;
}

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

async function fetchTextWithRetry(url: string, init: RequestInit, retries = 3): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init);

      if (response.ok) {
        return await response.text();
      }

      if (response.status === 404) {
        throw makeHttpError("Lichess user not found", 404);
      }

      if (isTransientStatus(response.status) && attempt < retries) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const backoffMs = retryAfter > 0 ? retryAfter * 1000 : 500 * Math.pow(2, attempt);
        await sleep(backoffMs);
        continue;
      }

      throw makeHttpError(`Lichess games request failed (${response.status})`, response.status);
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
    }
  }

  if (lastError instanceof Error) {
    if ("status" in lastError) {
      throw lastError;
    }

    throw new Error(`Network error while downloading games: ${lastError.message}`);
  }

  throw new Error("Network error while downloading games");
}

async function fetchCloudEvalWithRetry(fen: string, retries = 3): Promise<CloudEvalResponse | null> {
  if (cloudEvalCache.has(fen)) {
    return cloudEvalCache.get(fen)!;
  }

  const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1`;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let response: Response;

    try {
      response = await fetchWithTimeout(
        url,
        {
          headers: {
            Accept: "application/json"
          },
          cache: "no-store"
        },
        12000
      );
    } catch {
      if (attempt < retries) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }

      cloudEvalCache.set(fen, null);
      return null;
    }

    if (response.status === 404) {
      cloudEvalCache.set(fen, null);
      return null;
    }

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      const backoffMs = retryAfter > 0 ? retryAfter * 1000 : 500 * Math.pow(2, attempt);
      await sleep(backoffMs);
      continue;
    }

    if (!response.ok) {
      if (isTransientStatus(response.status) && attempt < retries) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }

      cloudEvalCache.set(fen, null);
      return null;
    }

    const parsed = (await response.json()) as CloudEvalResponse;
    if (!parsed.pvs?.length) {
      cloudEvalCache.set(fen, null);
      return null;
    }

    cloudEvalCache.set(fen, parsed);
    return parsed;
  }

  cloudEvalCache.set(fen, null);
  return null;
}

function scoreToCpFromUserPerspective(
  score: CloudPv | undefined,
  userColor: PlayerColor
): number {
  if (!score) return 0;

  let cp = 0;

  if (typeof score.mate === "number") {
    const sign = score.mate > 0 ? 1 : -1;
    cp = sign * (MATE_CP - Math.min(Math.abs(score.mate), 1000));
  } else {
    cp = score.cp ?? 0;
  }

  const multiplier = userColor === "white" ? 1 : -1;
  return cp * multiplier;
}

function extractBestMove(evalResponse: CloudEvalResponse): string | null {
  const pv = evalResponse.pvs?.[0];
  if (!pv?.moves) return null;
  return pv.moves.split(" ")[0] ?? null;
}

function computeFenAfterMove(fenBefore: string, moveToken: string): string | null {
  const chess = new Chess(fenBefore);
  const ok = applyMoveToken(chess, moveToken);
  return ok ? chess.fen() : null;
}

export async function fetchRecentLichessGames(username: string, max = 100): Promise<LichessGame[]> {
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${max}&moves=true&tags=false&opening=false&clocks=false&evals=false&pgnInJson=false`;
  const payload = await fetchTextWithRetry(
    url,
    {
      headers: {
        Accept: "application/x-ndjson",
        "User-Agent": "firechess-opening-leak-scanner/1.0"
      },
      cache: "no-store"
    },
    3
  );

  return parseGamesPayload(payload);
}

function clampInt(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export async function analyzeOpeningLeaks(
  username: string,
  options?: AnalyzeOptions
): Promise<{ gamesAnalyzed: number; repeatedPositions: number; leaks: RepeatedOpeningLeak[] }> {
  const maxGames = clampInt(options?.maxGames, DEFAULT_MAX_GAMES, 1, 1000);
  const maxOpeningMoves = clampInt(options?.maxOpeningMoves, DEFAULT_MAX_OPENING_MOVES, 1, 30);
  const cpLossThreshold = clampInt(options?.cpLossThreshold, CP_LOSS_THRESHOLD, 1, 1000);
  const maxOpeningPlies = maxOpeningMoves * 2;

  const games = await fetchRecentLichessGames(username, maxGames);
  const { aggregated, gamesAnalyzed } = aggregateOpeningPositions(games, username, maxOpeningPlies);

  const leaks: RepeatedOpeningLeak[] = [];

  for (const position of aggregated) {
    const fenBefore = position.fenBefore;
    const fenAfter = computeFenAfterMove(fenBefore, position.chosenMove);
    if (!fenAfter) continue;

    const sideToMove = fenBefore.includes(" w ") ? "white" : "black";

    const beforeEval = await fetchCloudEvalWithRetry(fenBefore);
    const afterEval = await fetchCloudEvalWithRetry(fenAfter);

    if (!beforeEval || !afterEval || !beforeEval.pvs?.[0] || !afterEval.pvs?.[0]) {
      continue;
    }

    const evalBefore = scoreToCpFromUserPerspective(beforeEval.pvs?.[0], sideToMove);
    const evalAfter = scoreToCpFromUserPerspective(afterEval.pvs?.[0], sideToMove);

    const cpLoss = evalBefore - evalAfter;
    if (cpLoss <= cpLossThreshold) continue;

    leaks.push({
      fenBefore,
      fenAfter,
      userMove: position.chosenMove,
      bestMove: extractBestMove(beforeEval),
      reachCount: position.totalReachCount,
      moveCount: position.chosenMoveCount,
      cpLoss,
      evalBefore,
      evalAfter,
      sideToMove,
      userColor: sideToMove
    });
  }

  leaks.sort((a, b) => b.cpLoss - a.cpLoss);

  return {
    gamesAnalyzed,
    repeatedPositions: aggregated.length,
    leaks
  };
}
