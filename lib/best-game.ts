import { Chess } from "chess.js";

/**
 * lib/best-game.ts — shared "best game" selector for scan reports.
 *
 * Used by three surfaces so they always agree:
 *   - /report/[id]       (full-report "Your best game" section)
 *   - guided tour step   (the report wizard's best-game showcase)
 *   - /best-game/[id]    (standalone full replay page)
 *
 * Input is the persisted AnalyzeResponse: `result.games` (SAN move lists +
 * headers) plus the engine findings, whose `gameIndex` fields are 1-based
 * positions into that same `games` array.
 *
 * Ranking, in order:
 *   1. Only the scanned user's own games (≥ 6 plies) are candidates.
 *   2. Wins beat draws/losses.
 *   3. Score = 3×brilliants − missed tactics − endgame errors (+2 for a
 *      checkmate finish) — engine findings attributed via gameIndex.
 *   4. Longer games win ties; earlier games win final ties (deterministic).
 *
 * Everything is engine-free and runs at render time, so it also works on any
 * stored report that kept its `games` payload.
 */

export type BestGameCandidateGame = {
  moves: string;
  whiteName?: string;
  blackName?: string;
  winner?: string;
  gameUrl?: string;
  openingName?: string;
  whiteRating?: number;
  blackRating?: number;
};

type IndexedFinding = { gameIndex?: number };

export type BestGameInput = {
  /** Scanned username — matched against game headers to find the user's side. */
  username: string;
  games?: BestGameCandidateGame[];
  brilliantMoves?: IndexedFinding[];
  missedTactics?: IndexedFinding[];
  endgameMistakes?: IndexedFinding[];
};

export type TailPly = {
  san: string;
  /** Full-move number of this ply (1-based). */
  moveNumber: number;
  color: "w" | "b";
  from: string;
  to: string;
  /** FEN immediately before the move. */
  fenBefore: string;
  /** FEN after the move. */
  fenAfter: string;
  isCheck: boolean;
  isMate: boolean;
};

export type MateInfo = {
  /** SAN of the mating move, e.g. "Qxh7#". */
  san: string;
  /** Full-move number the mate happened on. */
  moveNumber: number;
  /** Color that delivered mate. */
  color: "w" | "b";
  from: string;
  to: string;
  fenBefore: string;
  /** Final FEN of the game (mate position). */
  fen: string;
  /** Human pattern label: "Smothered mate" | "Back-rank mate" | null. */
  pattern: string | null;
};

export type BestGame = {
  /** 0-based index into result.games. */
  index: number;
  userColor: "white" | "black";
  isWin: boolean;
  /** True when the user's last move delivered checkmate. */
  endedInMate: boolean;
  /** Total plies in the game. */
  moveCount: number;
  score: number;
  brilliantCount: number;
  missedTacticsInGame: number;
  endgameErrorsInGame: number;
  opponentName?: string;
  opponentRating?: number;
  mate?: MateInfo;
  /** Last up-to-8 plies with full detail, for a mini step-through. */
  tail: TailPly[];
  /* Raw game fields, kept so consumers can render headers / links. */
  moves: string;
  whiteName?: string;
  blackName?: string;
  winner?: string;
  gameUrl?: string;
  openingName?: string;
  whiteRating?: number;
  blackRating?: number;
};

const MIN_PLIES = 6;
const MATE_BONUS = 2;
const BRILLIANT_POINTS = 3;
const ERROR_POINTS = 1;
const TAIL_PLIES = 8;

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/* ────────────────────────────────────────────────────────────────────────
 * Mate pattern classification (geometry + chess.js attack checks, no engine)
 * ──────────────────────────────────────────────────────────────────────── */

export function classifyMatePattern(
  finalFen: string,
  matedColor: "w" | "b",
): string | null {
  let chess: Chess;
  try {
    chess = new Chess(finalFen);
  } catch {
    return null;
  }
  if (!chess.isCheckmate()) return null;

  const attackerColor: "w" | "b" = matedColor === "w" ? "b" : "w";
  const rows = chess.board();
  // rows[0] is rank 8 … rows[7] is rank 1; cols a..h
  let kingSq: string | null = null;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = rows[r][f];
      if (sq && sq.type === "k" && sq.color === matedColor) {
        kingSq = `${"abcdefgh"[f]}${8 - r}`;
      }
    }
  }
  if (!kingSq) return null;

  const file = kingSq.charCodeAt(0) - 96; // a=1
  const rank = Number(kingSq[1]);
  const isCorner =
    (file === 1 || file === 8) && (rank === 1 || rank === 8);

  const isBackRank = matedColor === "w" ? rank === 1 : rank === 8;
  if (!isCorner && !isBackRank) return null;

  // Neighbours (up/diagonal from the king's own perspective are toward the
  // centre of the board — the "forward" exits a back-rank king needs).
  const exits: string[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const nf = file + df;
      const nr = rank + dr;
      if (nf >= 1 && nf <= 8 && nr >= 1 && nr <= 8) {
        exits.push(`${"abcdefgh"[nf - 1]}${nr}`);
      }
    }
  }

  const ownBlocked = new Set<string>();
  const covered = new Set<string>();
  for (const sq of exits) {
    const piece = chess.get(sq as never);
    if (piece && piece.color === matedColor) ownBlocked.add(sq);
    else if (chess.isAttacked(sq as never, attackerColor)) covered.add(sq);
  }

  // King fully boxed = every exit is either his own piece or attacked.
  const fullyBoxed = exits.every((sq) => ownBlocked.has(sq) || covered.has(sq));
  if (!fullyBoxed) return null;

  // Smothered mate: king in the corner, all three exits walled by the king's
  // own pieces, check delivered by a knight (uncapturable by geometry).
  const matingPiece = findMatingPiece(chess, attackerColor, kingSq);
  if (isCorner && ownBlocked.size === 3 && matingPiece === "n") {
    return "Smothered mate";
  }

  // Back-rank mate: the king's pawn shield sits in front (≥ 2 of the forward
  // exits — up + both diagonals — are his own pieces).
  const forwardExits = exits.filter((sq) => {
    const nr = Number(sq[1]);
    return matedColor === "w" ? nr === rank + 1 : nr === rank - 1;
  });
  const forwardOwn = forwardExits.filter((sq) => ownBlocked.has(sq)).length;
  if (forwardOwn >= 2) return "Back-rank mate";

  return null;
}

/** Which piece type gave check to the king (from the final mate position). */
function findMatingPiece(
  chess: Chess,
  attackerColor: "w" | "b",
  kingSq: string,
): "q" | "r" | "b" | "n" | "p" | null {
  const rows = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = rows[r][f];
      if (!sq || sq.color !== attackerColor) continue;
      const s = `${"abcdefgh"[f]}${8 - r}`;
      if (chess.isAttacked(kingSq as never, attackerColor)) {
        // isAttacked doesn't say WHO attacks — find pieces attacking the king.
        const c = new Chess(chess.fen());
        const from = c.get(s as never);
        if (!from) continue;
        if (from.type === "q" || from.type === "r" || from.type === "b") {
          const moves = c.moves({ square: s as never, verbose: true });
          if (moves.some((m) => m.to === kingSq)) return from.type as "q" | "r" | "b";
        }
        if (from.type === "n") {
          const moves = c.moves({ square: s as never, verbose: true });
          if (moves.some((m) => m.to === kingSq)) return "n";
        }
        if (from.type === "p") {
          const moves = c.moves({ square: s as never, verbose: true });
          if (moves.some((m) => m.to === kingSq)) return "p";
        }
      }
    }
  }
  return null;
}

/* ──────────────────────────────────────────────────────────────────────── */

/** Replay a stored SAN move list; returns per-ply detail or null on failure. */
export function replayGame(
  moves: string,
): { plies: TailPly[]; fen: string; mateAtEnd: boolean } | null {
  const tokens = moves.trim().split(/\s+/).filter(Boolean);
  const chess = new Chess();
  const plies: TailPly[] = [];
  try {
    for (const token of tokens) {
      const fenBefore = chess.fen();
      const move = chess.move(token);
      if (!move) return null;
      plies.push({
        san: move.san,
        moveNumber: Math.floor(plies.length / 2) + 1,
        color: move.color,
        from: move.from,
        to: move.to,
        fenBefore,
        fenAfter: chess.fen(),
        isCheck: chess.isCheck(),
        isMate: chess.isCheckmate(),
      });
    }
  } catch {
    return null;
  }
  return { plies, fen: chess.fen(), mateAtEnd: chess.isCheckmate() };
}

export function pickBestGame(input: BestGameInput): BestGame | null {
  const games = input.games ?? [];
  if (games.length === 0) return null;

  const username = normalizeName(input.username);
  const brilliantOf = indexFindings(input.brilliantMoves);
  const tacticsOf = indexFindings(input.missedTactics);
  const endgameOf = indexFindings(input.endgameMistakes);

  type Scored = {
    index: number;
    game: BestGameCandidateGame;
    userColor: "white" | "black";
    isWin: boolean;
    score: number;
    brilliantCount: number;
    missedTacticsInGame: number;
    endgameErrorsInGame: number;
    moveCount: number;
    replay: ReturnType<typeof replayGame>;
  };

  const scored: Scored[] = [];

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const moves = game.moves?.trim();
    if (!moves) continue;

    const whiteName = game.whiteName ? normalizeName(game.whiteName) : "";
    const blackName = game.blackName ? normalizeName(game.blackName) : "";
    const userColor: "white" | "black" | null =
      whiteName === username
        ? "white"
        : blackName === username
          ? "black"
          : null;
    if (!userColor) continue;

    const tokens = moves.split(/\s+/).filter(Boolean);
    if (tokens.length < MIN_PLIES) continue;

    const isWin = game.winner === userColor;
    const brilliantCount = brilliantOf.get(i + 1) ?? 0;
    const missedTacticsInGame = tacticsOf.get(i + 1) ?? 0;
    const endgameErrorsInGame = endgameOf.get(i + 1) ?? 0;

    // Full replay only for wins — needed to detect a checkmate finish.
    let replay: ReturnType<typeof replayGame> = null;
    if (isWin) replay = replayGame(moves);
    if (isWin && !replay) continue; // win we can't parse isn't a highlight

    const mateBonus =
      isWin && replay?.mateAtEnd === true ? MATE_BONUS : 0;
    const score =
      brilliantCount * BRILLIANT_POINTS -
      missedTacticsInGame * ERROR_POINTS -
      endgameErrorsInGame * ERROR_POINTS +
      mateBonus;

    scored.push({
      index: i,
      game,
      userColor,
      isWin,
      score,
      brilliantCount,
      missedTacticsInGame,
      endgameErrorsInGame,
      moveCount: tokens.length,
      replay,
    });
  }

  if (scored.length === 0) return null;

  scored.sort((a, b) => {
    if (a.isWin !== b.isWin) return a.isWin ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    if (b.moveCount !== a.moveCount) return b.moveCount - a.moveCount;
    return a.index - b.index;
  });

  const best = scored[0];
  const replay = best.replay ?? replayGame(best.game.moves);
  const plies = replay?.plies ?? [];
  const endedInMate = best.isWin && replay?.mateAtEnd === true;

  const last = plies[plies.length - 1];
  const mate: MateInfo | undefined = endedInMate && last
    ? {
        san: last.san,
        moveNumber: last.moveNumber,
        color: last.color,
        from: last.from,
        to: last.to,
        fenBefore: last.fenBefore,
        fen: last.fenAfter,
        pattern: classifyMatePattern(last.fenAfter, last.color === "w" ? "b" : "w"),
      }
    : undefined;

  const opponentName =
    best.userColor === "white"
      ? best.game.blackName
      : best.game.whiteName;
  const opponentRating =
    best.userColor === "white"
      ? best.game.blackRating
      : best.game.whiteRating;

  return {
    index: best.index,
    userColor: best.userColor,
    isWin: best.isWin,
    endedInMate,
    moveCount: best.moveCount,
    score: best.score,
    brilliantCount: best.brilliantCount,
    missedTacticsInGame: best.missedTacticsInGame,
    endgameErrorsInGame: best.endgameErrorsInGame,
    opponentName,
    opponentRating,
    mate,
    tail: plies.slice(-TAIL_PLIES),
    moves: best.game.moves,
    whiteName: best.game.whiteName,
    blackName: best.game.blackName,
    winner: best.game.winner,
    gameUrl: best.game.gameUrl,
    openingName: best.game.openingName,
    whiteRating: best.game.whiteRating,
    blackRating: best.game.blackRating,
  };
}

/** Map 1-based gameIndex (as stored on findings) → count per game. */
function indexFindings(
  findings?: IndexedFinding[],
): Map<number, number> {
  const map = new Map<number, number>();
  for (const f of findings ?? []) {
    if (typeof f.gameIndex !== "number" || f.gameIndex < 1) continue;
    map.set(f.gameIndex, (map.get(f.gameIndex) ?? 0) + 1);
  }
  return map;
}
