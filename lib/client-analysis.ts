import { Chess } from "chess.js";
import { stockfishClient } from "@/lib/stockfish-client";
import type {
  AnalyzeResponse,
  GameOpeningTrace,
  MoveSquare,
  PlayerColor,
  PositionEvalTrace,
  RepeatedOpeningLeak
} from "@/lib/types";

type LichessGame = {
  moves?: string;
  players?: {
    white?: { user?: { name?: string } };
    black?: { user?: { name?: string } };
  };
};

export type AnalysisProgress = {
  phase: "fetch" | "parse" | "aggregate" | "eval" | "done";
  message: string;
  current?: number;
  total?: number;
};

type AnalyzeOptions = {
  maxGames?: number;
  maxOpeningMoves?: number;
  cpLossThreshold?: number;
  engineDepth?: number;
  onProgress?: (progress: AnalysisProgress) => void;
};

const MIN_POSITION_REPEATS = 3;
const CP_LOSS_THRESHOLD = 100;
const DEFAULT_MAX_GAMES = 100;
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

export async function analyzeOpeningLeaksInBrowser(
  username: string,
  options?: AnalyzeOptions
): Promise<AnalyzeResponse> {
  const maxGames = clampInt(options?.maxGames, DEFAULT_MAX_GAMES, 1, 500);
  const maxOpeningMoves = clampInt(options?.maxOpeningMoves, DEFAULT_MAX_OPENING_MOVES, 1, 30);
  const cpLossThreshold = clampInt(options?.cpLossThreshold, CP_LOSS_THRESHOLD, 1, 1000);
  const engineDepth = clampInt(options?.engineDepth, 10, 6, 24);
  const maxOpeningPlies = maxOpeningMoves * 2;

  emitProgress(options, {
    phase: "fetch",
    message: "Downloading recent games from Lichess..."
  });

  const payload = await fetchGamesNdjsonWithRetry(
    `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${maxGames}&moves=true&tags=false&opening=false&clocks=false&evals=false&pgnInJson=false`,
    3
  );

  emitProgress(options, {
    phase: "parse",
    message: "Parsing games and extracting opening moves..."
  });

  const games = parseGamesPayload(payload);

  const byFen = new Map<string, { totalReachCount: number; moveCounts: Map<string, number> }>();
  let gamesAnalyzed = 0;
  const gameTraces: GameOpeningTrace[] = [];

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

    const whiteName = game.players?.white?.user?.name;
    const blackName = game.players?.black?.user?.name;
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

  const leaks: RepeatedOpeningLeak[] = [];
  const positionTraces: PositionEvalTrace[] = [];
  let repeatedPositions = 0;
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

  emitProgress(options, {
    phase: "done",
    message: `Analysis complete: ${leaks.length} repeated opening leaks found.`
  });

  return {
    username,
    gamesAnalyzed,
    repeatedPositions,
    leaks,
    diagnostics: {
      gameTraces,
      positionTraces
    }
  };
}
