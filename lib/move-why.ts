/**
 * move-why.ts — the "why" engine for FireChess coach mode.
 *
 * Turns engine output (played move vs best move, evals, and the engine's
 * refutation line) into a concrete human explanation of WHY a move was an
 * inaccuracy, mistake or blunder — instead of just "loses 0.4 pawns of eval".
 *
 * Design principle: never invent. Every reason must trace to a verified fact:
 *   - a real tactical pattern that exists on the board (fork / pin / skewer /
 *     hanging piece / mate) — cross-checked against the engine's own reply
 *     whenever the reply is cheap enough that an unconfirmed claim could lie;
 *   - a measured feature delta between the played move and the best move
 *     (development, castling, king safety, pawn structure, initiative);
 *   - or, as a last resort, an honest fallback that says "the engine prefers
 *     X because of Y" without pretending to know more than it does.
 *
 * Pure function of board state + engine data — runs client-side, no I/O.
 */
import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import { explainer } from "./position-explainer";

const {
  pieceAt,
  pieceName,
  oppColor,
  formatSquare,
  countDeveloped,
  canStillCastle,
  kingSafetyScore,
  pawnStructure,
  detectFork,
  detectPins,
  detectHangingPieces,
  detectWeakenedSquares,
  detectSkewer,
  classifyGamePhase,
  analyzeSpeedChange,
  PIECE_VALUES,
  EXTENDED_CENTER,
} = explainer;

/* ────────────────────────── Types ────────────────────────── */

export interface MoveWhy {
  /** Short chip label, e.g. "Hanging piece" / "Missed fork". */
  label: string;
  /** One concrete spoken sentence — the actual reason. */
  reason: string;
  /** Optional follow-up: what the engine does about it (refutation line). */
  detail?: string;
}

export interface MoveWhyInput {
  fenBefore: string;
  playedUci: string;
  playedSan: string;
  fenAfterPlayed: string;
  bestUci: string | null;
  bestSan: string | null;
  /** Engine PV from fenBefore (best move first), as SANs. */
  bestPvSans?: string[];
  /** Engine PV from fenAfterPlayed — the opponent's best reply. SANs. */
  refutationSans?: string[];
  cpLoss: number;
  classification: "inaccuracy" | "mistake" | "blunder";
  /** Eval BEFORE the move from White's perspective (for context). */
  evalBeforeWhite?: number;
}

type MaybeWhy = MoveWhy | null;

/* ────────────────────────── Helpers ────────────────────────── */

function playUci(fen: string, uci: string): Chess | null {
  try {
    const chess = new Chess(fen);
    const m = chess.move({
      from: uci.slice(0, 2) as Square,
      to: uci.slice(2, 4) as Square,
      promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined,
    });
    return m ? chess : null;
  } catch {
    return null;
  }
}

function getAllPieces(chess: Chess): { type: PieceSymbol; color: Color; square: Square }[] {
  return chess
    .board()
    .flat()
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ type: p.type, color: p.color, square: p.square }));
}

/** Cheapest defender of `sq` among pieces of `color` (piece value), or null. */
function cheapestDefender(
  chess: Chess,
  sq: string,
  color: Color,
): { value: number; type: PieceSymbol; square: Square } | null {
  try {
    const tFile = sq.charCodeAt(0) - 97;
    // chess.js board() is indexed from rank 8 (row 0) — invert rank numbers.
    const tRank = parseInt(sq[1], 10) - 1;
    const tRow = 7 - tRank;
    const board = chess.board();
    let best: { value: number; type: PieceSymbol; square: Square } | null = null;
    for (const piece of getAllPieces(chess)) {
      if (piece.color !== color) continue;
      const pFile = piece.square.charCodeAt(0) - 97;
      const pRank = parseInt(piece.square[1], 10) - 1;
      const pRow = 7 - pRank;
      const df = tFile - pFile;
      const dr = tRank - pRank;
      const type = piece.type;
      let attacks = false;

      if (type === "n") {
        attacks = Math.abs(df) + Math.abs(dr) === 3 && df !== 0 && dr !== 0;
      } else if (type === "k") {
        attacks = Math.abs(df) <= 1 && Math.abs(dr) <= 1;
      } else if (type === "p") {
        const pushDir = piece.color === "w" ? 1 : -1;
        attacks = dr === pushDir && Math.abs(df) === 1;
      } else {
        const isDiag = Math.abs(df) === Math.abs(dr) && df !== 0;
        const isOrth = df === 0 ? dr !== 0 : dr === 0;
        if (df === 0 && dr === 0) continue;
        if (type === "b" && !isDiag) continue;
        if (type === "r" && !isOrth) continue;
        if (type === "q" && !isDiag && !isOrth) continue;
        // Walk in board-row space (rows invert ranks).
        const stepFile = Math.sign(df);
        const stepRow = -Math.sign(dr);
        let cf = pFile + stepFile;
        let cr = pRow + stepRow;
        let blocked = false;
        while (cf !== tFile || cr !== tRow) {
          if (cf < 0 || cf > 7 || cr < 0 || cr > 7) {
            blocked = true;
            break;
          }
          if (board[cr]?.[cf]) {
            blocked = true;
            break;
          }
          cf += stepFile;
          cr += stepRow;
        }
        attacks = !blocked && cf === tFile && cr === tRow;
      }

      if (attacks) {
        const v = type === "k" ? 99 : PIECE_VALUES[type] ?? 0;
        if (!best || v < best.value) best = { value: v, type, square: piece.square };
      }
    }
    return best;
  } catch {
    return null;
  }
}

/** Does any friendly piece of `color` defend `sq` (static scan)? */
function isSquareDefended(chess: Chess, sq: string, color: Color): boolean {
  return cheapestDefender(chess, sq, color) !== null;
}

/** Is a fork real? The attacker must survive: no defender that can capture it
 *  UNLESS that defender is itself one of the forked targets (overloaded — it
 *  can't both capture the attacker and escape). A queen "forking" two rooks
 *  while an innocent pawn can take her is not a fork. */
function isRealFork(
  chess: Chess,
  landedSq: string,
  landed: { type: PieceSymbol; color: Color },
  forked: { type: PieceSymbol; color: Color; square: Square }[],
): boolean {
  const opp = landed.color === "w" ? "b" : "w";
  const defender = cheapestDefender(chess, landedSq, opp);
  if (defender) {
    const defenderIsForked = forked.some((p) => p.square === defender.square);
    if (defender.type !== "k" && !defenderIsForked) {
      return false; // they just capture the forking piece
    }
  }
  return forked.some((p) => {
    if (p.type === "k") return true;
    if (p.type !== "q" && p.type !== "r") return false;
    return !isSquareDefended(chess, p.square, opp);
  });
}

/** Fork targets as natural prose: "king and rook" — highest value first. */
function forkTargetNames(forked: { type: PieceSymbol }[]): string {
  const val = (t: PieceSymbol) => (t === "k" ? 99 : PIECE_VALUES[t] ?? 0);
  return [...forked]
    .sort((a, b) => val(b.type) - val(a.type))
    .map((p) => pieceName(p.type))
    .join(" and ");
}

/** Cheapest capture on `sq` available to the side to move, if any. */
function cheapestCapture(
  chess: Chess,
  sq: string,
): { san: string; value: number } | null {
  try {
    const caps = chess
      .moves({ verbose: true })
      .filter((m) => m.captured && m.to === sq);
    if (caps.length === 0) return null;
    let best = caps[0];
    let bestVal = Infinity;
    for (const m of caps) {
      const v = PIECE_VALUES[(m.piece ?? "p") as PieceSymbol] ?? 1;
      if (v < bestVal) {
        bestVal = v;
        best = m;
      }
    }
    return { san: best.san, value: bestVal };
  } catch {
    return null;
  }
}

/** Human description of the moved piece, e.g. "your knight" / "the queen". */
function myPiece(piece: { type: PieceSymbol }, possessive: boolean): string {
  const name = pieceName(piece.type);
  return possessive ? `your ${name}` : `the ${name}`;
}

function sideName(color: Color): string {
  return color === "w" ? "White" : "Black";
}

/* ══════════════════════════════════════════════════════════════
   Candidate rules — each returns a concrete why, or null.
   ══════════════════════════════════════════════════════════════ */

interface Ctx {
  before: Chess;
  mover: Color;
  opp: Color;
  afterPlayed: Chess;
  afterBest: Chess | null;
  refSans: string[];
  bestPvSans: string[];
  from: Square;
  to: Square;
  piece: { type: PieceSymbol; color: Color; square: Square } | null;
  captured: { type: PieceSymbol; color: Color; square: Square } | null;
  cpLoss: number;
  classification: "inaccuracy" | "mistake" | "blunder";
  bestUci: string;
  bestSan: string;
  playedSan: string;
  evalBeforeMover: number;
}

/** 1 — the player had mate in one and didn't take it. */
function missedMate(c: Ctx): MaybeWhy {
  if (c.cpLoss < 40) return null;
  const check = new Chess(c.before.fen());
  check.move({
    from: c.bestUci.slice(0, 2) as Square,
    to: c.bestUci.slice(2, 4) as Square,
    promotion: (c.bestUci.slice(4, 5) || undefined) as PieceSymbol | undefined,
  });
  if (!check.isCheckmate()) return null;
  const mateSan = c.bestSan.endsWith("#") ? c.bestSan : `${c.bestSan}#`;
  return {
    label: "Missed mate",
    reason: `You had mate in one — ${mateSan} was sitting right there.`,
  };
}

/** 2 — the move allows the opponent an immediate mate. */
function allowsMate(c: Ctx): MaybeWhy {
  if (c.afterPlayed.isCheck()) return null;
  for (const m of c.afterPlayed.moves({ verbose: true })) {
    const sim = new Chess(c.afterPlayed.fen());
    try {
      sim.move({ from: m.from, to: m.to, promotion: m.promotion });
    } catch {
      continue;
    }
    if (sim.isCheckmate()) {
      const backRank =
        (c.mover === "w" && m.to[1] === "1") || (c.mover === "b" && m.to[1] === "8");
      const mateType = backRank
        ? "back-rank mate — your king has no escape square"
        : "forced mate — there is no defense";
      return {
        label: "Allows mate",
        reason: `It allows ${m.san} — ${mateType}.`,
        detail:
          c.refSans.length >= 2
            ? `The engine plays it without hesitation: ${c.refSans.slice(0, 2).join(", ")}.`
            : undefined,
      };
    }
  }
  return null;
}

/** 3 — the move hangs material the opponent can grab immediately.
 *  Static claims are only made for FULLY undefended pieces; a defended piece
 *  needs the engine's own reply (the refutation) to confirm it's really lost
 *  — hidden defenders make static "hanging" calls unreliable. */
function hangsMaterial(c: Ctx): MaybeWhy {
  const hanging = detectHangingPieces(c.afterPlayed, c.mover);
  for (const h of hanging) {
    if (PIECE_VALUES[h.type] < 3) continue;
    // Recapture guard: if the moved piece just captured something worth at
    // least its own value, the opponent taking it back is an even trade —
    // not a hang (e.g. 10...Nxa4 11.Qxa4 is just an exchange).
    if (
      c.captured &&
      h.square === c.to &&
      PIECE_VALUES[c.captured.type] >= PIECE_VALUES[h.type]
    ) {
      continue;
    }
    const cap = cheapestCapture(c.afterPlayed, h.square);
    if (!cap) continue;
    const engineConfirms = c.refSans.length > 0 && c.refSans[0] === cap.san;
    const undefended = !isSquareDefended(c.afterPlayed, h.square, c.mover);
    if (!undefended && !(engineConfirms && c.cpLoss >= 150)) continue;
    return {
      label: "Hanging piece",
      reason: `Your ${pieceName(h.type)} on ${formatSquare(h.square)} is hanging — ${cap.san} just takes it.`,
      detail:
        c.refSans.length >= 2 && engineConfirms
          ? `The engine grabs it and keeps going: ${c.refSans.slice(0, 2).join(", ")}.`
          : undefined,
    };
  }
  return null;
}

/** 4 — the move walks into an enemy fork the engine follows through on. */
function walksIntoFork(c: Ctx): MaybeWhy {
  try {
    const oppMoves = c.afterPlayed.moves({ verbose: true });
    for (const m of oppMoves) {
      if (m.piece === "p" && !m.captured) continue; // only pieces that land with punch
      const sim = playUci(c.afterPlayed.fen(), `${m.from}${m.to}${m.promotion ?? ""}`);
      if (!sim) continue;
      const landed = pieceAt(sim, m.to as Square);
      if (!landed) continue;
      const forked = detectFork(sim, m.to as Square, landed);
      if (forked.length < 2) continue;
      const engineConfirms = c.refSans.length > 0 && c.refSans[0] === m.san;
      // Static claims need a big enough loss AND a geometrically real fork
      // (attacker survives, valuable target undefended). Engine-confirmed
      // forks skip the checks — the engine is the arbiter.
      if (!engineConfirms) {
        if (c.cpLoss < 150) continue;
        if (!isRealFork(sim, m.to as Square, landed, forked)) continue;
      }
      const targets = forkTargetNames(forked);
      const attacker = pieceName(landed.type);
      return {
        label: `${attacker.charAt(0).toUpperCase()}${attacker.slice(1)} fork`,
        reason: `It walks into ${m.san} — a ${attacker} fork hitting your ${targets} at the same time.`,
        detail:
          engineConfirms && c.refSans.length >= 2
            ? `The engine plays it: ${c.refSans.slice(0, 2).join(", ")}.`
            : undefined,
      };
    }
  } catch {
    /* best-effort */
  }
  return null;
}

/** 5 — the move walks into a brand-new pin (against king or queen). */
function walksIntoPin(c: Ctx): MaybeWhy {
  if (c.cpLoss < 100) return null;
  const pinsAfter = detectPins(c.afterPlayed, c.mover);
  if (pinsAfter.length === 0) return null;
  const pinsBefore = detectPins(c.before, c.mover);
  const newPin = pinsAfter.find(
    (pa) =>
      (pa.target.type === "k" || pa.target.type === "q") &&
      !pinsBefore.some(
        (pb) => pb.pinned.square === pa.pinned.square && pb.pinner.square === pa.pinner.square,
      ),
  );
  if (!newPin) return null;
  return {
    label: "Walks into a pin",
    reason: `It lets the ${pieceName(newPin.pinner.type)} on ${newPin.pinner.square} pin your ${pieceName(newPin.pinned.type)} on ${newPin.pinned.square} to your ${pieceName(newPin.target.type)} — that piece is frozen.`,
  };
}

/** 6 — the move allows an enemy skewer against valuable pieces. */
function allowsSkewer(c: Ctx): MaybeWhy {
  if (c.cpLoss < 100) return null;
  const skewers = detectSkewer(c.afterPlayed, c.opp);
  if (skewers.length === 0) return null;
  const sk = skewers[0];
  const behindVal = PIECE_VALUES[sk.behind.type] ?? 0;
  const frontVal = PIECE_VALUES[sk.front.type] ?? 0;
  if (Math.max(behindVal, frontVal) < 4) return null; // only juicy skewers
  return {
    label: "Allows a skewer",
    reason: `It allows a skewer: the ${pieceName(sk.attacker.type)} on ${sk.attacker.square} hits your ${pieceName(sk.front.type)} on ${sk.front.square}, with your ${pieceName(sk.behind.type)} lined up behind it.`,
  };
}

/** 7 — the player had a winning tactic available and didn't play it. */
function missedTactic(c: Ctx): MaybeWhy {
  // Don't lecture about missed wins from a dead position.
  if (c.evalBeforeMover < -250) return null;
  if (c.cpLoss < 50) return null;
  if (!c.afterBest) return null;
  const bestTo = c.bestUci.slice(2, 4) as Square;
  const landed = pieceAt(c.afterBest, bestTo);

  // 7a — missed fork (best move lands a piece attacking two valuable targets;
  //     the engine chose it, so no static defense checks needed)
  if (landed && (landed.type === "n" || landed.type === "b" || landed.type === "q" || landed.type === "r")) {
    const forked = detectFork(c.afterBest, bestTo, landed);
    if (forked.length >= 2) {
      const score = forked.reduce((s, p) => s + (PIECE_VALUES[p.type] ?? 0), 0);
      const hasBigTarget = forked.some((p) => p.type === "k" || p.type === "q" || p.type === "r");
      if (score >= 5 && hasBigTarget) {
        const targets = forkTargetNames(forked);
        const attacker = pieceName(landed.type);
        return {
          label: "Missed fork",
          reason: `You missed a fork: ${c.bestSan} hits both your opponent's ${targets} at once with the ${attacker}.`,
          detail:
            c.bestPvSans.length >= 3
              ? `After ${c.bestPvSans[1]}, ${c.bestPvSans[2]} and the material falls off.`
              : undefined,
        };
      }
    }
  }

  // 7b — missed winning capture (only when the victim is fully undefended)
  const victim = pieceAt(c.before, bestTo);
  if (victim && victim.color === c.opp && PIECE_VALUES[victim.type] >= 2) {
    const undefended = !isSquareDefended(c.before, bestTo, c.opp);
    if (undefended) {
      return {
        label: "Missed capture",
        reason: `You missed ${c.bestSan} — it wins the ${pieceName(victim.type)} on ${formatSquare(bestTo)} for free.`,
      };
    }
  }

  // 7c — missed promotion
  if (c.bestUci.length === 5 && c.cpLoss >= 80) {
    return {
      label: "Missed promotion",
      reason: `You missed ${c.bestSan} — the pawn promotes.`,
    };
  }

  return null;
}

/** 8 — threw away a winning position. */
function squanderedWin(c: Ctx): MaybeWhy {
  if (c.evalBeforeMover < 300) return null;
  if (c.cpLoss < 250) return null;
  return {
    label: "Squandered win",
    reason: `You had a winning position — ${c.bestSan} keeps the advantage rolling, but this lets it slip.`,
    detail:
      c.refSans.length >= 2
        ? `Now the engine only needs ${c.refSans[0]}, ${c.refSans[1]} to take over.`
        : undefined,
  };
}

/** 9 — the king stays in the center when castling was the point. */
function missedCastle(c: Ctx): MaybeWhy {
  if (c.cpLoss < 40) return null;
  if (c.evalBeforeMover < -300) return null;
  if (!c.bestSan.startsWith("O-O")) return null;
  if (c.playedSan.startsWith("O-O")) return null;
  if (!canStillCastle(c.before, c.mover)) return null;
  const ksPlayed = kingSafetyScore(c.afterPlayed, c.mover);
  const ksBest = c.afterBest ? kingSafetyScore(c.afterBest, c.mover) : null;
  const centerIssue = ksPlayed.issues.some((i) => i.includes("center"));
  if (ksBest && ksBest.score < ksPlayed.score - 5 && !centerIssue) return null;
  if (!centerIssue && ksPlayed.score >= 70) return null; // king is fine; castle wasn't urgent
  return {
    label: "King stuck in the center",
    reason: `Your king stays in the middle of the board — ${c.bestSan} tucks it behind a pawn wall and brings a rook in. In this position that safety was the point.`,
    detail: centerIssue ? "A king in the center is a target once the position opens up." : undefined,
  };
}

/** 10 — development left unfinished while a tempo was spent elsewhere. */
function missedDevelopment(c: Ctx): MaybeWhy {
  if (c.cpLoss < 25) return null;
  if (c.evalBeforeMover < -300) return null;
  const phase = classifyGamePhase(c.before);
  if (phase !== "Opening") return null;
  const devBefore = countDeveloped(c.before, c.mover);
  if (devBefore.developed >= devBefore.total) return null;
  if (!c.afterBest) return null;
  const devAfterBest = countDeveloped(c.afterBest, c.mover);
  if (devAfterBest.developed <= devBefore.developed) return null;

  // Best move develops a piece that was still at home.
  const homeRank = c.mover === "w" ? "1" : "8";
  const bestFrom = c.bestUci.slice(0, 2);
  const bestPiece = pieceAt(c.before, bestFrom as Square);
  if (!bestPiece || bestPiece.type === "p" || bestFrom[1] !== homeRank) return null;
  const bestPieceName = pieceName(bestPiece.type);

  // Was the played move a wasted tempo? (pawn move, or moving an already-out piece)
  const playedFrom = c.piece;
  const playedWasPawn = c.piece?.type === "p";
  const playedFromHome = playedFrom && playedFrom.square[1] === homeRank;
  const alreadyDeveloped = playedFrom && !playedFromHome && playedFrom.square[1] !== homeRank && !c.captured;
  const wastedTempo = playedWasPawn || alreadyDeveloped;

  if (!wastedTempo) return null;

  const undevelopedCount = devBefore.total - devBefore.developed;
  const wasteDesc = playedWasPawn
    ? "a pawn move"
    : "moving a piece that was already in play";

  return {
    label: "Development",
    reason: `Your development is unfinished (${devBefore.developed}/${devBefore.total} pieces out) and you spent this move on ${wasteDesc} — ${c.bestSan} brings the ${bestPieceName} out for the first time.`,
    detail:
      undevelopedCount > 1
        ? `Each extra tempo you hand over makes it harder to catch up.`
        : undefined,
  };
}

/** 11 — a pawn move that permanently damages the pawn structure. */
function damagesStructure(c: Ctx): MaybeWhy {
  if (c.cpLoss < 25) return null;
  if (classifyGamePhase(c.before) === "Endgame") return null;
  if (c.piece?.type !== "p") return null;
  const beforeIssues = pawnStructure(c.before, c.mover).issues;
  const afterIssues = pawnStructure(c.afterPlayed, c.mover).issues;
  const fresh = afterIssues.filter((i) => !beforeIssues.includes(i));
  if (fresh.length === 0) return null;
  return {
    label: "Pawn structure",
    reason: `It leaves a permanent mark on your pawns — ${fresh.join(" and ")}.`,
    detail: "Structural weaknesses never move; they become targets you defend all game.",
  };
}

/** 12 — a pawn push that abandons squares it used to guard. */
function weakeningPawnPush(c: Ctx): MaybeWhy {
  if (c.cpLoss < 25) return null;
  if (classifyGamePhase(c.before) === "Endgame") return null;
  if (c.piece?.type !== "p") return null;
  const weakened = detectWeakenedSquares(c.before, c.afterPlayed, c.from, c.mover);
  if (weakened.length === 0) return null;
  return {
    label: "Weakening move",
    reason: `The push abandons ${weakened.join(" and ")} — squares your pawn used to guard are now open for the opponent's pieces.`,
  };
}

/** 13 — the move makes the mover's own king position measurably worse. */
function worsenedKingSafety(c: Ctx): MaybeWhy {
  if (c.cpLoss < 30) return null;
  if (c.piece?.type === "p") return null; // pawn-king cases live in rules 11/12
  const before = kingSafetyScore(c.before, c.mover);
  const after = kingSafetyScore(c.afterPlayed, c.mover);
  if (after.score >= before.score - 15) return null;
  const fresh = after.issues.filter((i) => !before.issues.includes(i));
  if (fresh.length === 0) return null;
  return {
    label: "King safety",
    reason: `Your own king position gets worse: ${fresh.join("; ")}.`,
    detail: `The engine's ${c.bestSan} avoids that entirely.`,
  };
}

/** 14 — passive move in a sharp position where the best move strikes. */
function gaveUpInitiative(c: Ctx): MaybeWhy {
  if (c.cpLoss < 40) return null;
  if (!c.afterBest) return null;
  const bestIsForcing = c.afterBest.isCheck() || !!pieceAt(c.before, c.bestUci.slice(2, 4) as Square);
  if (!bestIsForcing) return null;
  const speed = analyzeSpeedChange(c.before.fen(), c.afterPlayed.fen(), c.mover);
  const sharp = speed.speedBefore.score >= 55;
  if (!sharp) return null;
  const moverName = sideName(c.mover);
  const checkClause = c.afterBest.isCheck() ? "+" : "";
  return {
    label: "Too slow here",
    reason: `This is a sharp position — it demands concrete action, not a quiet move. ${c.bestSan}${checkClause} keeps ${moverName}'s initiative rolling.`,
  };
}

/** 15 — quiet inaccuracies: piece placement problems. */
function poorPlacement(c: Ctx): MaybeWhy {
  if (c.cpLoss < 20) return null;
  if (!c.piece || c.piece.type === "p" || c.piece.type === "k") return null;
  const piece = c.piece;
  const to = c.to;

  // 15a — knight lands on the rim / back rank where it controls little.
  if (piece.type === "n" && (to[0] === "a" || to[0] === "h" || to[1] === "1" || to[1] === "8")) {
    const rim = to[0] === "a" || to[0] === "h";
    return {
      label: "Knight on the rim",
      reason: rim
        ? `The knight lands on ${formatSquare(to)} — on the edge of the board it controls half the squares it would from the center.`
        : `The knight retreats to ${formatSquare(to)} on the back rank, where it does very little.`,
    };
  }

  // 15b — active piece retreats to the back rank (loss of activity).
  const backRank = c.mover === "w" ? "1" : "8";
  if (to[1] === backRank && c.from[1] !== backRank) {
    return {
      label: "Passive retreat",
      reason: `It pulls your ${pieceName(piece.type)} back to ${formatSquare(to)} where it stops participating — ${c.bestSan} keeps it in the game.`,
    };
  }

  return null;
}

/** 16 — honest fallback: explain what the best move does, don't bluff. */
function enginePreference(c: Ctx): MaybeWhy {
  if (c.cpLoss < 15) return null;
  const bestPiece = pieceAt(c.before, c.bestUci.slice(0, 2) as Square);
  const bestTo = c.bestUci.slice(2, 4) as Square;
  let effect = "";

  if (c.bestSan.startsWith("O-O")) {
    effect = "it gets the king to safety and connects the rooks";
  } else if (c.afterBest?.isCheck()) {
    effect = "it comes with check and seizes the initiative";
  } else if (bestPiece) {
    const victim = pieceAt(c.before, bestTo as Square);
    if (
      victim &&
      victim.color === c.opp &&
      !isSquareDefended(c.before, bestTo, c.opp)
    ) {
      effect = `it wins the ${pieceName(victim.type)} on ${formatSquare(bestTo)}`;
    } else if (victim && victim.color === c.opp) {
      effect = `it captures on ${formatSquare(bestTo)}, taking the ${pieceName(victim.type)}`;
    } else if (bestPiece.type !== "p") {
      const homeRank = c.mover === "w" ? "1" : "8";
      if (bestPiece.square[1] === homeRank && bestTo[1] !== homeRank) {
        effect = `it develops the ${pieceName(bestPiece.type)}`;
      } else if (bestPiece.type === "n" && EXTENDED_CENTER.has(bestTo as Square)) {
        effect = `it centralises the knight on ${formatSquare(bestTo)}`;
      } else if (bestPiece.type === "r") {
        const file = bestTo[0];
        effect = `it puts the rook on the ${file}-file, where it has something to do`;
      } else {
        effect = `it posts the ${pieceName(bestPiece.type)} on ${formatSquare(bestTo)}, a square with more influence`;
      }
    } else {
      const rankAdv = c.mover === "w" ? parseInt(bestTo[1], 10) : 9 - parseInt(bestTo[1], 10);
      effect =
        rankAdv >= 4
          ? `the pawn on ${formatSquare(bestTo)} cramps the opponent's space`
          : `it keeps your pawn structure intact`;
    }
  }

  const quietNote =
    c.classification === "inaccuracy" && !c.refSans.length
      ? " Nothing gets punished right away — it's a small edge that adds up."
      : "";
  const refNote =
    c.refSans.length >= 2
      ? ` After your move the engine's plan is simple: ${c.refSans.slice(0, 2).join(", ")}.`
      : "";

  return {
    label: "Precision",
    reason: `The engine prefers ${c.bestSan} — ${effect}.${quietNote}`,
    detail: refNote || undefined,
  };
}

/* ══════════════════════════════════════════════════════════════
   Entry point
   ══════════════════════════════════════════════════════════════ */

export function analyzeMoveWhy(input: MoveWhyInput): MoveWhy | null {
  const { fenBefore, playedUci, playedSan, fenAfterPlayed, bestUci, bestSan, cpLoss, classification } = input;
  try {
    if (!bestUci || !bestSan) return null;
    if (playedSan === bestSan) return null;
    if (cpLoss < 10) return null;

    const before = new Chess(fenBefore);
    const mover = before.turn();
    const opp = mover === "w" ? "b" : "w";
    const afterPlayed = new Chess(fenAfterPlayed);
    const afterBest = playUci(fenBefore, bestUci);

    const evalBeforeMover = (input.evalBeforeWhite ?? 0) * (mover === "w" ? 1 : -1);

    const c: Ctx = {
      before,
      mover,
      opp,
      afterPlayed,
      afterBest,
      refSans: input.refutationSans ?? [],
      bestPvSans: input.bestPvSans ?? [],
      from: playedUci.slice(0, 2) as Square,
      to: playedUci.slice(2, 4) as Square,
      piece: pieceAt(before, playedUci.slice(0, 2) as Square),
      captured: pieceAt(before, playedUci.slice(2, 4) as Square),
      cpLoss,
      classification,
      bestUci,
      bestSan,
      playedSan,
      evalBeforeMover,
    };

    const candidate =
      missedMate(c) ??
      allowsMate(c) ??
      hangsMaterial(c) ??
      walksIntoFork(c) ??
      missedTactic(c) ??
      squanderedWin(c) ??
      walksIntoPin(c) ??
      allowsSkewer(c) ??
      missedCastle(c) ??
      missedDevelopment(c) ??
      damagesStructure(c) ??
      weakeningPawnPush(c) ??
      worsenedKingSafety(c) ??
      gaveUpInitiative(c) ??
      poorPlacement(c) ??
      enginePreference(c);

    return candidate;
  } catch {
    return null;
  }
}
