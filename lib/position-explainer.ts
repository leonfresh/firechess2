/**
 * position-explainer.ts
 *
 * Chess position analysis engine that generates human-like coaching explanations.
 * Runs entirely client-side with chess.js — no LLM needed.
 *
 * Analysis covers:
 *  - Tactical themes (pins, forks, skewers, discovered attacks, back-rank, etc.)
 *  - Positional themes (development, center control, pawn structure, piece activity)
 *  - King safety assessment
 *  - Material balance
 *  - Move characterisation (why a move is good or bad)
 */

import { Chess, type PieceSymbol, type Color, type Square } from "chess.js";

/* ────────────────────────── Types ────────────────────────── */

export type PositionExplanation = {
  /** One-liner summary suitable for a badge */
  headline: string;
  /** 2-4 sentence coaching paragraph explaining what happened */
  coaching: string;
  /** Identified themes (tactical + positional) */
  themes: string[];
  /** Specific observations about the position */
  observations: string[];
};

export type MoveExplanation = {
  played: PositionExplanation;
  best: PositionExplanation;
};

type PieceInfo = {
  type: PieceSymbol;
  color: Color;
  square: Square;
};

type SquareControl = {
  white: number;
  black: number;
};

/* ────────────────────────── Helpers ────────────────────────── */

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
const CENTER_SQUARES = new Set(["d4", "d5", "e4", "e5"]);
const EXTENDED_CENTER = new Set(["c3", "c4", "c5", "c6", "d3", "d4", "d5", "d6", "e3", "e4", "e5", "e6", "f3", "f4", "f5", "f6"]);

function sq(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${FILES[file]}${RANKS[rank]}` as Square;
}

function fileIdx(s: Square): number {
  return s.charCodeAt(0) - "a".charCodeAt(0);
}

function rankIdx(s: Square): number {
  return parseInt(s[1]) - 1;
}

function pieceAt(chess: Chess, square: Square): PieceInfo | null {
  const p = chess.get(square);
  if (!p) return null;
  return { type: p.type, color: p.color, square };
}

function getAllPieces(chess: Chess): PieceInfo[] {
  const pieces: PieceInfo[] = [];
  for (const f of FILES) {
    for (const r of RANKS) {
      const s = `${f}${r}` as Square;
      const p = chess.get(s);
      if (p) pieces.push({ type: p.type, color: p.color, square: s });
    }
  }
  return pieces;
}

function pieceName(type: PieceSymbol, capitalize = false): string {
  const n = PIECE_NAMES[type];
  return capitalize ? n.charAt(0).toUpperCase() + n.slice(1) : n;
}

function colorName(c: Color): string {
  return c === "w" ? "White" : "Black";
}

function oppColor(c: Color): Color {
  return c === "w" ? "b" : "w";
}

function formatSquare(s: string): string {
  return s;
}

/* ────────────────────── Material Analysis ────────────────────── */

function materialCount(chess: Chess, color: Color): Record<PieceSymbol, number> {
  const counts: Record<PieceSymbol, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  const pieces = getAllPieces(chess);
  for (const p of pieces) {
    if (p.color === color) counts[p.type]++;
  }
  return counts;
}

function materialValue(chess: Chess, color: Color): number {
  const counts = materialCount(chess, color);
  return counts.p * 1 + counts.n * 3 + counts.b * 3 + counts.r * 5 + counts.q * 9;
}

function materialBalance(chess: Chess): number {
  return materialValue(chess, "w") - materialValue(chess, "b");
}

function describeMaterialDiff(chess: Chess, perspective: Color): string {
  const wMat = materialCount(chess, "w");
  const bMat = materialCount(chess, "b");
  const userMat = perspective === "w" ? wMat : bMat;
  const oppMat = perspective === "w" ? bMat : wMat;

  const diffs: string[] = [];
  for (const piece of ["q", "r", "b", "n", "p"] as PieceSymbol[]) {
    const diff = userMat[piece] - oppMat[piece];
    if (diff > 0) diffs.push(`+${diff} ${pieceName(piece)}${diff > 1 ? "s" : ""}`);
    else if (diff < 0) diffs.push(`${diff} ${pieceName(piece)}${Math.abs(diff) > 1 ? "s" : ""}`);
  }
  return diffs.length > 0 ? diffs.join(", ") : "equal material";
}

/* ────────────────────── Development Analysis ─────────────────── */

function countDeveloped(chess: Chess, color: Color): { developed: number; total: number; details: string[] } {
  const pieces = getAllPieces(chess).filter(p => p.color === color);
  const details: string[] = [];
  let developed = 0;
  let total = 0;

  const backRank = color === "w" ? "1" : "8";

  for (const p of pieces) {
    if (p.type === "k" || p.type === "p") continue;
    total++;
    const onBack = p.square[1] === backRank;
    if (!onBack) {
      developed++;
    } else {
      details.push(`${pieceName(p.type, true)} on ${p.square} is still undeveloped`);
    }
  }

  return { developed, total, details };
}

function hasCastled(chess: Chess, color: Color): boolean {
  // Check by looking at king position — if it's on g1/c1 or g8/c8 and
  // there's a rook nearby in the expected castled position
  const kingSquare = findKing(chess, color);
  if (!kingSquare) return false;

  if (color === "w") {
    return kingSquare === "g1" || kingSquare === "c1";
  }
  return kingSquare === "g8" || kingSquare === "c8";
}

function canStillCastle(chess: Chess, color: Color): boolean {
  const rights = chess.getCastlingRights(color);
  return rights.k || rights.q;
}

/* ────────────────────── King Safety ──────────────────────── */

function findKing(chess: Chess, color: Color): Square | null {
  const pieces = getAllPieces(chess);
  for (const p of pieces) {
    if (p.type === "k" && p.color === color) return p.square;
  }
  return null;
}

function kingSafetyScore(chess: Chess, color: Color): { score: number; issues: string[] } {
  const king = findKing(chess, color);
  if (!king) return { score: 0, issues: [] };

  const issues: string[] = [];
  let score = 100; // start at 100, deduct for problems

  const kFile = fileIdx(king);
  const kRank = rankIdx(king);
  const pawnShieldRank = color === "w" ? kRank + 1 : kRank - 1;

  // Check for pawn shield
  let shieldPawns = 0;
  for (let f = Math.max(0, kFile - 1); f <= Math.min(7, kFile + 1); f++) {
    const shieldSq = sq(f, pawnShieldRank);
    if (shieldSq) {
      const p = pieceAt(chess, shieldSq);
      if (p && p.type === "p" && p.color === color) {
        shieldPawns++;
      }
    }
  }
  if (shieldPawns === 0) {
    score -= 30;
    issues.push("no pawn shield in front of the king");
  } else if (shieldPawns === 1) {
    score -= 15;
    issues.push("thin pawn shield (only 1 pawn)");
  }

  // King in center (not castled) in the middlegame
  const totalPieces = getAllPieces(chess).length;
  if (totalPieces > 10) {
    if (color === "w" && (kRank === 0 && kFile >= 3 && kFile <= 4)) {
      score -= 25;
      issues.push("king still in the center during middlegame");
    } else if (color === "b" && (kRank === 7 && kFile >= 3 && kFile <= 4)) {
      score -= 25;
      issues.push("king still in the center during middlegame");
    }
  }

  // Open files near king
  const allPieces = getAllPieces(chess);
  for (let f = Math.max(0, kFile - 1); f <= Math.min(7, kFile + 1); f++) {
    const hasFriendlyPawn = allPieces.some(p => p.type === "p" && p.color === color && fileIdx(p.square) === f);
    if (!hasFriendlyPawn) {
      const hasEnemyRookOrQueen = allPieces.some(p =>
        (p.type === "r" || p.type === "q") && p.color === oppColor(color) && fileIdx(p.square) === f
      );
      if (hasEnemyRookOrQueen) {
        score -= 20;
        issues.push(`open ${FILES[f]}-file near king with enemy heavy piece`);
      }
    }
  }

  return { score: Math.max(0, score), issues };
}

/* ──────────────────── Center Control ─────────────────────── */

function centerControl(chess: Chess, color: Color): { pawnsInCenter: number; piecesAttackingCenter: number; observations: string[] } {
  const pieces = getAllPieces(chess).filter(p => p.color === color);
  const observations: string[] = [];
  let pawnsInCenter = 0;
  let piecesAttackingCenter = 0;

  for (const p of pieces) {
    if (p.type === "p" && CENTER_SQUARES.has(p.square)) {
      pawnsInCenter++;
    }
  }

  // Count pieces that attack center squares
  try {
    const moves = chess.moves({ verbose: true });
    const attackedCenterSquares = new Set<string>();
    for (const m of moves) {
      if (CENTER_SQUARES.has(m.to) || EXTENDED_CENTER.has(m.to)) {
        piecesAttackingCenter++;
        if (CENTER_SQUARES.has(m.to)) attackedCenterSquares.add(m.to);
      }
    }
  } catch {
    // If not this side's turn, we can't enumerate moves directly
  }

  if (pawnsInCenter >= 2) observations.push("strong pawn center");
  else if (pawnsInCenter === 1) observations.push("one central pawn");
  else observations.push("no central pawns");

  return { pawnsInCenter, piecesAttackingCenter, observations };
}

/* ──────────────────── Pawn Structure ─────────────────────── */

function pawnStructure(chess: Chess, color: Color): { issues: string[]; assets: string[] } {
  const pawns = getAllPieces(chess).filter(p => p.type === "p" && p.color === color);
  const oppPawns = getAllPieces(chess).filter(p => p.type === "p" && p.color === oppColor(color));
  const issues: string[] = [];
  const assets: string[] = [];

  // Doubled pawns
  const fileCounts = new Map<number, number>();
  for (const p of pawns) {
    const f = fileIdx(p.square);
    fileCounts.set(f, (fileCounts.get(f) ?? 0) + 1);
  }
  for (const [f, count] of fileCounts) {
    if (count >= 2) issues.push(`doubled pawns on the ${FILES[f]}-file`);
  }

  // Isolated pawns
  for (const p of pawns) {
    const f = fileIdx(p.square);
    const hasNeighbor = pawns.some(pp => {
      const pf = fileIdx(pp.square);
      return Math.abs(pf - f) === 1;
    });
    if (!hasNeighbor) {
      issues.push(`isolated pawn on ${formatSquare(p.square)}`);
    }
  }

  // Passed pawns
  for (const p of pawns) {
    const f = fileIdx(p.square);
    const r = rankIdx(p.square);
    const direction = color === "w" ? 1 : -1;
    let isPassed = true;

    for (const op of oppPawns) {
      const opF = fileIdx(op.square);
      const opR = rankIdx(op.square);
      if (Math.abs(opF - f) <= 1) {
        if (color === "w" && opR > r) { isPassed = false; break; }
        if (color === "b" && opR < r) { isPassed = false; break; }
      }
    }

    if (isPassed) {
      const advancedRank = color === "w" ? r + 1 : 8 - r;
      assets.push(`passed pawn on ${formatSquare(p.square)}${advancedRank >= 6 ? " (advanced!)" : ""}`);
    }
  }

  return { issues, assets };
}

/* ──────────────────── Tactical Detection ─────────────────── */

type TacticalTheme = {
  name: string;
  description: string;
};

/**
 * Detect tactical themes in a position AFTER a move has been played.
 * We look at what the move achieves (or what it allows the opponent to do).
 */
function detectTacticalThemes(
  fenBefore: string,
  moveSan: string,
  moveUci: string,
  fenAfter: string,
  isUserMove: boolean,
  cpLoss: number,
  bestMoveUci?: string
): TacticalTheme[] {
  const themes: TacticalTheme[] = [];

  try {
    const before = new Chess(fenBefore);
    const after = new Chess(fenAfter);
    const moverColor = before.turn();
    const moverName = colorName(moverColor);
    const opponentColor = oppColor(moverColor);

    // Piece that moved
    const fromSq = moveUci.slice(0, 2) as Square;
    const toSq = moveUci.slice(2, 4) as Square;
    const movedPiece = pieceAt(before, fromSq);
    const capturedPiece = pieceAt(before, toSq);
    const landedPiece = pieceAt(after, toSq);

    // === CAPTURES ===
    if (capturedPiece && capturedPiece.color === opponentColor) {
      if (movedPiece && PIECE_VALUES[movedPiece.type] < PIECE_VALUES[capturedPiece.type]) {
        themes.push({
          name: "Winning Exchange",
          description: `Captures a ${pieceName(capturedPiece.type)} (${PIECE_VALUES[capturedPiece.type]} pts) with a ${pieceName(movedPiece.type)} (${PIECE_VALUES[movedPiece.type]} pts)`
        });
      } else if (movedPiece && PIECE_VALUES[movedPiece.type] > PIECE_VALUES[capturedPiece.type]) {
        themes.push({
          name: "Losing Exchange",
          description: `Trades a ${pieceName(movedPiece.type)} (${PIECE_VALUES[movedPiece.type]} pts) for a ${pieceName(capturedPiece.type)} (${PIECE_VALUES[capturedPiece.type]} pts)`
        });
      }
    }

    // === CHECKS ===
    if (after.isCheck()) {
      themes.push({
        name: "Check",
        description: `Gives check with the ${pieceName(landedPiece?.type ?? "p")}`
      });

      if (after.isCheckmate()) {
        themes.push({
          name: "Checkmate",
          description: "Delivers checkmate!"
        });
      }
    }

    // === FORK DETECTION ===
    if (landedPiece) {
      const forkedPieces = detectFork(after, toSq, landedPiece);
      if (forkedPieces.length >= 2) {
        const targets = forkedPieces.map(p => pieceName(p.type, true)).join(" and ");
        themes.push({
          name: `${pieceName(landedPiece.type, true)} Fork`,
          description: `The ${pieceName(landedPiece.type)} on ${toSq} attacks both the ${targets}`
        });
      }
    }

    // === PIN DETECTION ===
    const pins = detectPins(after, opponentColor);
    if (pins.length > 0) {
      for (const pin of pins.slice(0, 2)) {
        themes.push({
          name: "Pin",
          description: `${pieceName(pin.pinner.type, true)} on ${pin.pinner.square} pins the ${pieceName(pin.pinned.type)} on ${pin.pinned.square} to the ${pieceName(pin.target.type)} on ${pin.target.square}`
        });
      }
    }

    // === DISCOVERED ATTACK ===
    // If the moved piece uncovers an attack by a piece behind it
    if (movedPiece) {
      const discovered = detectDiscoveredAttack(before, after, fromSq, moverColor);
      if (discovered) {
        themes.push({
          name: "Discovered Attack",
          description: discovered
        });
      }
    }

    // === BACK RANK WEAKNESS ===
    const oppKing = findKing(after, opponentColor);
    if (oppKing) {
      const oppKingRank = rankIdx(oppKing);
      const isBackRank = (opponentColor === "w" && oppKingRank === 0) || (opponentColor === "b" && oppKingRank === 7);
      if (isBackRank && after.isCheck()) {
        themes.push({
          name: "Back Rank",
          description: "Check on the back rank — the king has no escape squares"
        });
      }
    }

    // === HANGING PIECE (for user's bad move) ===
    if (isUserMove && cpLoss >= 100) {
      const hanging = detectHangingPieces(after, moverColor);
      if (hanging.length > 0) {
        for (const h of hanging.slice(0, 2)) {
          themes.push({
            name: "Hanging Piece",
            description: `The ${pieceName(h.type)} on ${h.square} is undefended and can be captured`
          });
        }
      }
    }

    // === TRAPPED PIECE ===
    if (isUserMove && movedPiece && movedPiece.type !== "p" && movedPiece.type !== "k") {
      const trapped = isPieceTrapped(after, toSq, moverColor);
      if (trapped) {
        themes.push({
          name: "Trapped Piece",
          description: `The ${pieceName(movedPiece.type)} on ${toSq} may be trapped with limited safe squares`
        });
      }
    }

    // === UNDEFENDED SQUARE / WEAKENING MOVE ===
    if (isUserMove && movedPiece?.type === "p") {
      const weakened = detectWeakenedSquares(before, after, fromSq, moverColor);
      if (weakened.length > 0) {
        themes.push({
          name: "Weakening Move",
          description: `Advancing the pawn weakens ${weakened.join(", ")}`
        });
      }
    }

    // === GAME PHASE ===
    const phase = classifyGamePhase(before);
    themes.push({ name: phase, description: `This position is in the ${phase.toLowerCase()} phase` });

    // === ENDGAME TYPE ===
    if (phase === "Endgame") {
      const egType = classifyEndgameType(before);
      if (egType) {
        themes.push({ name: egType, description: `A ${egType.toLowerCase()} with specific strategic considerations` });
      }
    }

    // === SKEWER DETECTION ===
    const skewers = detectSkewer(after, moverColor);
    if (skewers.length > 0 && !isUserMove) {
      const sk = skewers[0];
      themes.push({
        name: "Skewer",
        description: `The ${pieceName(sk.attacker.type)} on ${sk.attacker.square} skewers the ${pieceName(sk.front.type)} on ${sk.front.square} — when it moves, the ${pieceName(sk.behind.type)} behind it can be captured`
      });
    }
    // For user's bad move: opponent gains a skewer
    if (isUserMove && cpLoss >= 100) {
      const oppSkewers = detectSkewer(after, opponentColor);
      if (oppSkewers.length > 0) {
        const sk = oppSkewers[0];
        themes.push({
          name: "Skewer",
          description: `Your move allows a skewer: the opponent's ${pieceName(sk.attacker.type)} attacks your ${pieceName(sk.front.type)} on ${sk.front.square}, and your ${pieceName(sk.behind.type)} on ${sk.behind.square} is behind it`
        });
      }
    }

    // === DISCOVERED CHECK ===
    if (isDiscoveredCheck(before, moveUci, after)) {
      themes.push({
        name: "Discovered Check",
        description: `Moving the ${pieceName(movedPiece?.type ?? "p")} reveals a check from a hidden attacking piece — a powerful forcing move`
      });
    }

    // === DOUBLE CHECK ===
    if (isDoubleCheck(before, moveUci, after)) {
      themes.push({
        name: "Double Check",
        description: "Two pieces give check simultaneously — the king must move since you can't block both attacks"
      });
    }

    // === EXPOSED KING ===
    if (isUserMove && isKingExposed(after, moverColor) && !isKingExposed(before, moverColor)) {
      themes.push({
        name: "Exposed King",
        description: "Your king is poorly protected after this move, making it vulnerable to attacks"
      });
    }
    if (!isUserMove && isKingExposed(after, opponentColor)) {
      themes.push({
        name: "Exposed King",
        description: "The opponent's king has few defenders, creating attacking opportunities"
      });
    }

    // === ADVANCED PAWN ===
    if (movedPiece?.type === "p") {
      const advancedPawnsBefore = detectAdvancedPawns(before, moverColor);
      const advancedPawnsAfter = detectAdvancedPawns(after, moverColor);
      if (advancedPawnsAfter.length > advancedPawnsBefore.length) {
        const rank = rankIdx(toSq);
        const promoRank = moverColor === "w" ? 7 : 0;
        const distance = Math.abs(promoRank - rank);
        themes.push({
          name: "Advanced Pawn",
          description: distance <= 2
            ? `Pawn on ${toSq} is deep in enemy territory and threatens to promote${distance === 1 ? " in one move" : ""}`
            : `Pawn on ${toSq} is well advanced into the opponent's position`
        });
      }
    }

    // === KINGSIDE / QUEENSIDE ATTACK ===
    if (!isUserMove && after.isCheck()) {
      const oppCastleSide = getCastlingSide(before, opponentColor);
      if (oppCastleSide === "kingside") {
        themes.push({ name: "Kingside Attack", description: "An attack targeting the opponent's castled king on the kingside" });
      } else if (oppCastleSide === "queenside") {
        themes.push({ name: "Queenside Attack", description: "An attack targeting the opponent's castled king on the queenside" });
      }
    }

    // === ATTACKING f2/f7 ===
    if (isAttackingF2F7(before, after, moveUci, moverColor)) {
      const target = moverColor === "w" ? "f7" : "f2";
      themes.push({
        name: "Attacking f2/f7",
        description: `Targets the vulnerable ${target} pawn — the weakest point in the opponent's position at the start`
      });
    }

    // === X-RAY ATTACK ===
    const xrays = detectXRay(after, moverColor);
    if (xrays.length > 0 && !isUserMove) {
      const xr = xrays[0];
      themes.push({
        name: "X-Ray Attack",
        description: `The ${pieceName(xr.attacker.type)} on ${xr.attacker.square} attacks through the ${pieceName(xr.through.type)} on ${xr.through.square}`
      });
    }

    // === EN PASSANT ===
    if (isEnPassant(before, moveUci)) {
      themes.push({
        name: "En Passant",
        description: "Captures the opponent's pawn en passant — a special pawn capture after the opponent's two-square advance"
      });
    }

    // === PROMOTION ===
    if (isPromotion(moveUci)) {
      if (isUnderpromotion(moveUci)) {
        const promo = moveUci[4];
        const promoName = promo === "n" ? "knight" : promo === "r" ? "rook" : "bishop";
        themes.push({
          name: "Underpromotion",
          description: `Promotes to a ${promoName} instead of a queen — sometimes the stronger tactical choice`
        });
      } else {
        themes.push({
          name: "Promotion",
          description: "Promotes a pawn to a queen — a decisive gain in material"
        });
      }
    }

    // === CASTLING ===
    if (moveSan === "O-O" || moveSan === "O-O-O") {
      themes.push({
        name: "Castling",
        description: moveSan === "O-O"
          ? "Castles kingside — securing the king and activating the rook"
          : "Castles queenside — the king is safe on the long side while the rook enters the game"
      });
    }

    // === SACRIFICE ===
    if (isSacrifice(before, moveUci, cpLoss, !isUserMove)) {
      themes.push({
        name: "Sacrifice",
        description: "Gives up material for a tactical or positional advantage — the opponent must accept, but the followup is strong"
      });
    }

    // === CHECKMATE PATTERNS ===
    if (after.isCheckmate()) {
      if (isSmotheredMate(after)) {
        themes.push({
          name: "Smothered Mate",
          description: "A knight delivers checkmate while the king is smothered by its own pieces — a classic tactical pattern"
        });
      } else if (isBackRankMate(after)) {
        themes.push({
          name: "Back-Rank Mate",
          description: "Checkmate on the back rank — the king is trapped behind its own pawns"
        });
      } else if (isArabianMate(after)) {
        themes.push({
          name: "Arabian Mate",
          description: "Rook and knight cooperate to checkmate a king driven into a corner — one of the oldest known mating patterns"
        });
      } else if (isAnastasiaMate(after)) {
        themes.push({
          name: "Anastasia's Mate",
          description: "A knight and rook deliver checkmate along an edge file — the king's own pieces block its escape"
        });
      } else if (isBodensMate(after)) {
        themes.push({
          name: "Boden's Mate",
          description: "Two bishops deliver checkmate on crisscrossing diagonals — typically after a sacrifice opens the position"
        });
      } else if (isCornerMate(after)) {
        themes.push({
          name: "Corner Mate",
          description: "A knight delivers checkmate to a king trapped in the corner of the board"
        });
      } else if (isDovetailMate(after)) {
        themes.push({
          name: "Dovetail Mate",
          description: "The queen delivers checkmate adjacent to the king — the king's diagonal escape squares are blocked by its own pieces"
        });
      } else if (isSwallowsTailMate(after)) {
        themes.push({
          name: "Swallow's Tail Mate",
          description: "The queen delivers checkmate — the two escape squares diagonally behind the king are blocked by its own pieces, forming a swallow's tail"
        });
      } else if (isEpauletteMate(after)) {
        themes.push({
          name: "Epaulette Mate",
          description: "The king is flanked on both sides by its own pieces like epaulettes, leaving it helpless against checkmate"
        });
      } else if (isDoubleBishopMate(after)) {
        themes.push({
          name: "Double Bishop Mate",
          description: "Two bishops cooperate to deliver checkmate — demonstrating the power of the bishop pair"
        });
      } else if (isKillBoxMate(after)) {
        themes.push({
          name: "Kill Box Mate",
          description: "The queen creates a lethal box around the king, controlling all escape squares from a distance"
        });
      } else if (isMorphyMate(after)) {
        themes.push({
          name: "Opera Mate",
          description: "A bishop and rook deliver checkmate on the back rank — named after Morphy's famous Opera Game"
        });
      } else if (isPillsburyMate(after)) {
        themes.push({
          name: "Pillsbury's Mate",
          description: "A rook delivers mate supported by a bishop on the diagonal — a classic coordination pattern"
        });
      } else if (isHookMate(after)) {
        themes.push({
          name: "Hook Mate",
          description: "Rook, knight, and pawn cooperate in a lethal combination to deliver checkmate"
        });
      } else if (isVukovicMate(after)) {
        themes.push({
          name: "Vukovic Mate",
          description: "Rook and knight combine to deliver checkmate — a coordinated mating pattern"
        });
      } else if (isBlindSwineMate(after)) {
        themes.push({
          name: "Blind Swine Mate",
          description: "Two rooks on the 7th rank cooperate to deliver checkmate — the 'pigs' finish the job"
        });
      }
    }

    // === CAPTURING DEFENDER ===
    if (!isUserMove) {
      const capDefDesc = detectCapturingDefender(before, after, moveUci);
      if (capDefDesc) {
        themes.push({ name: "Capturing Defender", description: capDefDesc });
      }
    }

    // === GOAL CLASSIFICATION (based on eval swing) ===
    if (isUserMove) {
      if (cpLoss >= 600) {
        themes.push({ name: "Crushing", description: "This move gave away a crushing advantage or allowed one for the opponent" });
      } else if (cpLoss >= 200) {
        themes.push({ name: "Advantage", description: "A significant advantage was lost with this move" });
      } else if (cpLoss <= 20 && cpLoss >= 0) {
        themes.push({ name: "Equality", description: "This move maintains rough equality — neither side gains a meaningful advantage" });
      }
    }

    // === ATTRACTION ===
    if (!isUserMove) {
      const attractionDesc = detectAttraction(before, after, moveUci, true);
      if (attractionDesc) {
        themes.push({ name: "Attraction", description: attractionDesc });
      }
    }

    // === DEFLECTION ===
    if (!isUserMove) {
      const deflectionDesc = detectDeflection(before, after, moveUci);
      if (deflectionDesc) {
        themes.push({ name: "Deflection", description: deflectionDesc });
      }
    }
    // User's move allows a deflection
    if (isUserMove && cpLoss >= 100) {
      const deflectionDesc = detectDeflection(before, after, moveUci);
      if (deflectionDesc) {
        themes.push({ name: "Deflection", description: "Your move deflects a piece from a key defensive duty, worsening your position" });
      }
    }

    // === INTERFERENCE ===
    if (!isUserMove) {
      const interferenceDesc = detectInterference(before, after, moveUci);
      if (interferenceDesc) {
        themes.push({ name: "Interference", description: interferenceDesc });
      }
    }

    // === CLEARANCE ===
    if (!isUserMove) {
      const clearanceDesc = detectClearance(before, after, moveUci);
      if (clearanceDesc) {
        themes.push({ name: "Clearance", description: clearanceDesc });
      }
    }

    // === INTERMEZZO (Zwischenzug) ===
    if (isUserMove && bestMoveUci) {
      const intermezzoDesc = detectIntermezzo(before, moveUci, after, bestMoveUci);
      if (intermezzoDesc) {
        themes.push({ name: "Intermezzo", description: intermezzoDesc });
      }
    }

    // === QUIET MOVE (for best move explanations) ===
    if (!isUserMove && !after.isCheck() && !capturedPiece && cpLoss === 0) {
      const oppResponses = after.moves({ verbose: true });
      const hasImmediateThreat = oppResponses.some(m => m.captured);
      if (!hasImmediateThreat) {
        themes.push({
          name: "Quiet Move",
          description: "A subtle move that doesn't capture or check, but sets up an unavoidable threat for later"
        });
      }
    }

    // === DEFENSIVE MOVE ===
    if (!isUserMove && !capturedPiece && !after.isCheck()) {
      // If the user's move was an attack and the best response is quiet/defensive
      const userAfter = before.moves({ verbose: true }).find(m => `${m.from}${m.to}${m.promotion ?? ""}` === moveUci);
      if (userAfter && (userAfter.captured || moveSan.includes("+"))) {
        themes.push({
          name: "Defensive Move",
          description: "A precise defensive move that parries the attack while maintaining the position"
        });
      }
    }

    // === ZUGZWANG ===
    // Very approximate: if the opponent has very few moves and all are bad
    if (!isUserMove) {
      const oppLegalMoves = after.moves().length;
      if (oppLegalMoves <= 3 && oppLegalMoves > 0 && !after.isCheck()) {
        themes.push({
          name: "Zugzwang",
          description: "The opponent has very few moves, and any move they make will worsen their position"
        });
      }
    }

    // === OPPONENT THREATS AFTER USER'S MOVE ===
    // Detect what the opponent can now do — forks, pins, hanging pieces etc.
    if (isUserMove && cpLoss >= 100) {
      try {
        const oppMoves = after.moves({ verbose: true });

        // --- Opponent fork threats ---
        for (const m of oppMoves) {
          const simAfterOpp = new Chess(after.fen());
          const oppResult = simAfterOpp.move(m);
          if (!oppResult) continue;
          const oppLandedPiece = pieceAt(simAfterOpp, m.to as Square);
          if (!oppLandedPiece) continue;
          const forkedPieces = detectFork(simAfterOpp, m.to as Square, oppLandedPiece);
          // Only flag forks hitting genuinely valuable targets (K+piece, Q+R, etc.)
          const valuableForked = forkedPieces.filter(p => p.type === "k" || p.type === "q" || p.type === "r");
          if (forkedPieces.length >= 2 && valuableForked.length >= 1) {
            const targets = forkedPieces.map(p => pieceName(p.type, true)).join(" and ");
            const attackerName = pieceName(oppLandedPiece.type, true);
            themes.push({
              name: "Walks Into Fork",
              description: `Your move allows **${oppResult.san}**, a ${attackerName.toLowerCase()} fork attacking your ${targets}. This leads to severe material loss.`
            });
            break; // one fork is enough
          }
        }

        // --- Opponent pin threats that weren't there before ---
        const pinsBefore = detectPins(before, moverColor);
        const pinsAfterUser = detectPins(after, moverColor);
        const newPins = pinsAfterUser.filter(pa =>
          !pinsBefore.some(pb =>
            pb.pinned.square === pa.pinned.square && pb.pinner.square === pa.pinner.square
          )
        );
        for (const pin of newPins.slice(0, 1)) {
          themes.push({
            name: "Walks Into Pin",
            description: `Your move allows the opponent's ${pieceName(pin.pinner.type)} on ${pin.pinner.square} to pin your ${pieceName(pin.pinned.type)} on ${pin.pinned.square} to your ${pieceName(pin.target.type)}. The pinned piece cannot move safely.`
          });
        }

        // --- Opponent can win material via direct capture ---
        const userPiecesBefore = getAllPieces(before).filter(p => p.color === moverColor);
        const userPiecesAfter = getAllPieces(after).filter(p => p.color === moverColor);
        // Check if opponent has a strong capture available
        const oppCaptures = oppMoves.filter(m => m.captured);
        for (const cap of oppCaptures) {
          const capturedType = cap.captured;
          if (!capturedType) continue;
          const capValue = PIECE_VALUES[capturedType] ?? 0;
          const attackerType = pieceAt(after, cap.from as Square)?.type;
          const attackerValue = attackerType ? (PIECE_VALUES[attackerType] ?? 0) : 0;
          // Winning capture: capturing something worth more, or capturing undefended piece
          if (capValue >= 3 && capValue > attackerValue) {
            const victimName = pieceName(capturedType, true);
            themes.push({
              name: "Hangs Material",
              description: `Your move leaves the ${victimName} on ${cap.to} unprotected. The opponent can capture it with **${cap.san}**, winning material.`
            });
            break; // one is enough
          }
        }

        // --- Opponent back-rank mate threat ---
        const userKingSq = findKing(after, moverColor);
        if (userKingSq) {
          const userKingRank = rankIdx(userKingSq);
          const isOnBackRank = (moverColor === "w" && userKingRank === 0) || (moverColor === "b" && userKingRank === 7);
          if (isOnBackRank) {
            for (const m of oppMoves) {
              const simMate = new Chess(after.fen());
              const mateResult = simMate.move(m);
              if (mateResult && simMate.isCheckmate()) {
                themes.push({
                  name: "Back-Rank Mate Threat",
                  description: `Your move allows **${mateResult.san}** — back-rank checkmate! The king has no escape because the back rank is blocked.`
                });
                break;
              }
            }
          }
        }
      } catch {
        // best-effort opponent threat scanning
      }
    }

  } catch {
    // Defensive — never crash the UI
  }

  return themes;
}

/* ──────────── Fork Detection ──────────── */

function detectFork(chess: Chess, square: Square, piece: PieceInfo): PieceInfo[] {
  // Get all squares attacked by this piece
  const attacked: PieceInfo[] = [];
  const opponentColor = oppColor(piece.color);

  // Use a temp board where it's this piece's turn to see what it attacks
  try {
    // We check if the piece on `square` attacks any valuable opponent pieces
    const allPieces = getAllPieces(chess).filter(p => p.color === opponentColor);
    for (const target of allPieces) {
      if (target.type === "p") continue; // pawns don't count as fork targets usually
      if (isAttacking(chess, square, piece, target.square)) {
        attacked.push(target);
      }
    }
  } catch {
    // best-effort
  }

  return attacked;
}

function isAttacking(chess: Chess, from: Square, attacker: PieceInfo, target: Square): boolean {
  // Simple geometric attack check
  const fFile = fileIdx(from);
  const fRank = rankIdx(from);
  const tFile = fileIdx(target);
  const tRank = rankIdx(target);
  const dFile = tFile - fFile;
  const dRank = tRank - fRank;

  switch (attacker.type) {
    case "n": {
      // Knight attacks L-shaped
      const adFile = Math.abs(dFile);
      const adRank = Math.abs(dRank);
      return (adFile === 2 && adRank === 1) || (adFile === 1 && adRank === 2);
    }
    case "p": {
      // Pawn attacks diagonally forward
      const direction = attacker.color === "w" ? 1 : -1;
      return dRank === direction && Math.abs(dFile) === 1;
    }
    case "b": {
      if (Math.abs(dFile) !== Math.abs(dRank) || dFile === 0) return false;
      return isPathClear(chess, from, target);
    }
    case "r": {
      if (dFile !== 0 && dRank !== 0) return false;
      return isPathClear(chess, from, target);
    }
    case "q": {
      if (dFile !== 0 && dRank !== 0 && Math.abs(dFile) !== Math.abs(dRank)) return false;
      return isPathClear(chess, from, target);
    }
    case "k": {
      return Math.abs(dFile) <= 1 && Math.abs(dRank) <= 1 && (dFile !== 0 || dRank !== 0);
    }
    default:
      return false;
  }
}

function isPathClear(chess: Chess, from: Square, to: Square): boolean {
  const fFile = fileIdx(from);
  const fRank = rankIdx(from);
  const tFile = fileIdx(to);
  const tRank = rankIdx(to);
  const stepFile = Math.sign(tFile - fFile);
  const stepRank = Math.sign(tRank - fRank);
  let curFile = fFile + stepFile;
  let curRank = fRank + stepRank;

  while (curFile !== tFile || curRank !== tRank) {
    const s = sq(curFile, curRank);
    if (!s) return false;
    if (chess.get(s)) return false;
    curFile += stepFile;
    curRank += stepRank;
  }
  return true;
}

/* ──────────── Pin Detection ──────────── */

type PinInfo = {
  pinner: PieceInfo;
  pinned: PieceInfo;
  target: PieceInfo;
};

function detectPins(chess: Chess, pinnedColor: Color): PinInfo[] {
  const pins: PinInfo[] = [];
  const pinnerColor = oppColor(pinnedColor);
  const sliders = getAllPieces(chess).filter(p =>
    p.color === pinnerColor && (p.type === "b" || p.type === "r" || p.type === "q")
  );
  const targetPieces = getAllPieces(chess).filter(p =>
    p.color === pinnedColor && (p.type === "k" || p.type === "q" || p.type === "r")
  );

  for (const slider of sliders) {
    for (const target of targetPieces) {
      // Check if there's exactly one piece of pinnedColor between slider and target
      const dirs = getSliderDirections(slider.type);
      for (const [dFile, dRank] of dirs) {
        if (!isAligned(slider.square, target.square, dFile, dRank)) continue;

        // Walk from slider toward target, collecting pieces in between
        const between: PieceInfo[] = [];
        let curFile = fileIdx(slider.square) + dFile;
        let curRank = rankIdx(slider.square) + dRank;

        while (curFile !== fileIdx(target.square) || curRank !== rankIdx(target.square)) {
          const s = sq(curFile, curRank);
          if (!s) break;
          const p = pieceAt(chess, s);
          if (p) between.push(p);
          curFile += dFile;
          curRank += dRank;
        }

        // Pin: exactly one piece in between, and it belongs to the pinned color
        if (between.length === 1 && between[0].color === pinnedColor && between[0].type !== "k") {
          // Also ensure the pinned piece is less valuable than or equal to the target
          pins.push({
            pinner: slider,
            pinned: between[0],
            target
          });
        }
      }
    }
  }

  return pins;
}

function getSliderDirections(type: PieceSymbol): [number, number][] {
  if (type === "b") return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (type === "r") return [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // queen
  return [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
}

function isAligned(from: Square, to: Square, dFile: number, dRank: number): boolean {
  const fFile = fileIdx(from);
  const fRank = rankIdx(from);
  const tFile = fileIdx(to);
  const tRank = rankIdx(to);
  const df = tFile - fFile;
  const dr = tRank - fRank;

  if (dFile === 0 && dRank === 0) return false;
  if (dFile === 0) return df === 0 && Math.sign(dr) === Math.sign(dRank);
  if (dRank === 0) return dr === 0 && Math.sign(df) === Math.sign(dFile);
  return Math.abs(df) === Math.abs(dr) && Math.sign(df) === Math.sign(dFile) && Math.sign(dr) === Math.sign(dRank);
}

/* ──────────── Discovered Attack Detection ──────────── */

function detectDiscoveredAttack(
  before: Chess,
  after: Chess,
  fromSq: Square,
  moverColor: Color
): string | null {
  // Look for friendly sliding pieces (B, R, Q) that were behind the moved piece
  // and now attack a new high-value target
  const opponentColor = oppColor(moverColor);
  const friendlySliders = getAllPieces(before).filter(p =>
    p.color === moverColor && (p.type === "b" || p.type === "r" || p.type === "q")
  );

  for (const slider of friendlySliders) {
    if (slider.square === fromSq) continue; // the moved piece itself

    // Was the moved piece between this slider and a valuable target?
    const dirs = getSliderDirections(slider.type);
    for (const [dFile, dRank] of dirs) {
      if (!isAligned(slider.square, fromSq, dFile, dRank)) continue;

      // Walk from slider past fromSq to see if there's a new attack
      let curFile = fileIdx(slider.square) + dFile;
      let curRank = rankIdx(slider.square) + dRank;
      let passedFrom = false;

      while (curFile >= 0 && curFile <= 7 && curRank >= 0 && curRank <= 7) {
        const s = sq(curFile, curRank);
        if (!s) break;

        if (s === fromSq) {
          passedFrom = true;
          curFile += dFile;
          curRank += dRank;
          continue;
        }

        const pBefore = pieceAt(before, s);
        const pAfter = pieceAt(after, s);

        // If there was a piece blocking before (not fromSq), stop
        if (pBefore && !passedFrom) break;

        // After the move, if there's a blocking piece, stop
        if (pAfter && passedFrom) {
          if (pAfter.color === opponentColor && PIECE_VALUES[pAfter.type] >= 3) {
            return `Moving the piece from ${fromSq} uncovers an attack by the ${pieceName(slider.type)} on ${slider.square} against the ${pieceName(pAfter.type)} on ${s}`;
          }
          break;
        }

        curFile += dFile;
        curRank += dRank;
      }
    }
  }

  return null;
}

/* ──────────── Hanging Piece Detection ──────────── */

function detectHangingPieces(chess: Chess, color: Color): PieceInfo[] {
  const hanging: PieceInfo[] = [];
  const pieces = getAllPieces(chess).filter(p => p.color === color && p.type !== "k");

  // Get all opponent attacks
  try {
    const oppMoves = chess.moves({ verbose: true });
    const attackedSquares = new Set(oppMoves.filter(m => m.captured).map(m => m.to));

    for (const p of pieces) {
      if (attackedSquares.has(p.square) && PIECE_VALUES[p.type] >= 3) {
        hanging.push(p);
      }
    }
  } catch {
    // Not the opponent's turn — we can't enumerate their moves.
    // Fall back: skip hanging piece detection in this case.
  }

  return hanging;
}

/* ──────────── Trapped Piece Detection ──────────── */

function isPieceTrapped(chess: Chess, square: Square, color: Color): boolean {
  try {
    // Count how many legal moves this piece has
    const moves = chess.moves({ verbose: true, square });
    const safeMoves = moves.filter(m => {
      // A "safe" move is one where the piece isn't captured immediately
      const testChess = new Chess(chess.fen());
      testChess.move({ from: m.from, to: m.to, promotion: m.promotion as PieceSymbol | undefined });
      const oppMoves = testChess.moves({ verbose: true });
      const recaptured = oppMoves.some(om => om.to === m.to && om.captured);
      if (!recaptured) return true;
      // If recaptured, check if we'd lose material
      const piece = pieceAt(chess, square);
      if (!piece) return true;
      const capturedValue = m.captured ? PIECE_VALUES[m.captured as PieceSymbol] : 0;
      return capturedValue >= PIECE_VALUES[piece.type];
    });
    return safeMoves.length <= 1;
  } catch {
    return false;
  }
}

/* ──────────── Weakened Squares Detection ──────────── */

function detectWeakenedSquares(before: Chess, after: Chess, pawnFrom: Square, color: Color): string[] {
  const weakened: string[] = [];
  const f = fileIdx(pawnFrom);
  const r = rankIdx(pawnFrom);

  // When a pawn advances, the squares it used to guard diagonally may become weak
  const guardedBefore: string[] = [];
  const direction = color === "w" ? 1 : -1;

  // Squares the pawn was guarding
  for (const df of [-1, 1]) {
    const gf = f + df;
    const gr = r + direction;
    const gs = sq(gf, gr);
    if (gs) guardedBefore.push(gs);
  }

  // Check if those squares are now unprotected by any friendly pawn
  const friendlyPawns = getAllPieces(after).filter(p => p.type === "p" && p.color === color);
  for (const gs of guardedBefore) {
    const gFile = fileIdx(gs as Square);
    const gRank = rankIdx(gs as Square);
    const stillGuarded = friendlyPawns.some(p => {
      const pf = fileIdx(p.square);
      const pr = rankIdx(p.square);
      return Math.abs(pf - gFile) === 1 && pr + direction === gRank;
    });
    if (!stillGuarded) {
      weakened.push(formatSquare(gs));
    }
  }

  return weakened;
}

/* ──────────── Skewer Detection ──────────── */

function detectSkewer(chess: Chess, color: Color): { attacker: PieceInfo; front: PieceInfo; behind: PieceInfo }[] {
  const skewers: { attacker: PieceInfo; front: PieceInfo; behind: PieceInfo }[] = [];
  const attackerColor = color;
  const victimColor = oppColor(color);
  const sliders = getAllPieces(chess).filter(p => p.color === attackerColor && (p.type === "b" || p.type === "r" || p.type === "q"));
  const targets = getAllPieces(chess).filter(p => p.color === victimColor && p.type !== "p");

  for (const slider of sliders) {
    const dirs = getSliderDirections(slider.type);
    for (const [dFile, dRank] of dirs) {
      // Walk along this direction collecting opponent pieces
      const line: PieceInfo[] = [];
      let cf = fileIdx(slider.square) + dFile;
      let cr = rankIdx(slider.square) + dRank;
      while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
        const s = sq(cf, cr);
        if (!s) break;
        const p = pieceAt(chess, s);
        if (p) {
          if (p.color === victimColor) line.push(p);
          else break; // friendly piece blocks
          if (line.length === 2) break;
        }
        cf += dFile;
        cr += dRank;
      }
      // Skewer: front piece is MORE valuable than behind piece
      if (line.length === 2) {
        const frontVal = PIECE_VALUES[line[0].type];
        const behindVal = PIECE_VALUES[line[1].type];
        if (frontVal > behindVal && frontVal >= 3) {
          skewers.push({ attacker: slider, front: line[0], behind: line[1] });
        }
      }
    }
  }
  return skewers;
}

/* ──────────── Advanced Pawn Detection ──────────── */

function detectAdvancedPawns(chess: Chess, color: Color): PieceInfo[] {
  return getAllPieces(chess).filter(p => {
    if (p.type !== "p" || p.color !== color) return false;
    const rank = rankIdx(p.square);
    // Advanced = rank 5-7 for white (idx 4-6), rank 0-2 for black (idx 0-2)
    return color === "w" ? rank >= 4 : rank <= 3;
  });
}

/* ──────────── Exposed King Detection ──────────── */

function isKingExposed(chess: Chess, color: Color): boolean {
  const k = kingSafetyScore(chess, color);
  return k.score < 50;
}

/* ──────────── Castling Side Detection ──────────── */

function getCastlingSide(chess: Chess, color: Color): "kingside" | "queenside" | null {
  const king = findKing(chess, color);
  if (!king) return null;
  const f = fileIdx(king);
  if (f >= 5) return "kingside";  // g or h file
  if (f <= 2) return "queenside"; // a, b, or c file
  return null;
}

/* ──────────── X-Ray Detection ──────────── */

/** Check if a piece x-rays (attacks through) an enemy piece to defend/attack a square behind it */
function detectXRay(chess: Chess, color: Color): { attacker: PieceInfo; through: PieceInfo; target: Square }[] {
  const xrays: { attacker: PieceInfo; through: PieceInfo; target: Square }[] = [];
  const sliders = getAllPieces(chess).filter(p => p.color === color && (p.type === "b" || p.type === "r" || p.type === "q"));
  const oppColor_ = oppColor(color);

  for (const slider of sliders) {
    const dirs = getSliderDirections(slider.type);
    for (const [dFile, dRank] of dirs) {
      let cf = fileIdx(slider.square) + dFile;
      let cr = rankIdx(slider.square) + dRank;
      let throughPiece: PieceInfo | null = null;
      while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
        const s = sq(cf, cr);
        if (!s) break;
        const p = pieceAt(chess, s);
        if (p) {
          if (!throughPiece && p.color === oppColor_) {
            throughPiece = p;
          } else if (throughPiece && p.color === oppColor_ && (p.type === "k" || p.type === "q" || p.type === "r")) {
            xrays.push({ attacker: slider, through: throughPiece, target: s });
            break;
          } else {
            break;
          }
        }
        cf += dFile;
        cr += dRank;
      }
    }
  }
  return xrays;
}

/* ──────────── Game Phase Classification ──────────── */

function classifyGamePhase(chess: Chess): "Opening" | "Middlegame" | "Endgame" {
  const pieces = getAllPieces(chess);
  const totalPieces = pieces.length;
  const fullMoveNumber = parseInt(chess.fen().split(" ")[5] ?? "1", 10);
  const queens = pieces.filter(p => p.type === "q").length;

  if (fullMoveNumber <= 12 && totalPieces >= 28) return "Opening";
  if (totalPieces <= 12 || (queens === 0 && totalPieces <= 16)) return "Endgame";
  return "Middlegame";
}

/* ──────────── Endgame Type Classification ──────────── */

function classifyEndgameType(chess: Chess): string | null {
  const pieces = getAllPieces(chess);
  const nonKingNonPawn = pieces.filter(p => p.type !== "k" && p.type !== "p");
  const pawns = pieces.filter(p => p.type === "p");
  const hasPawns = pawns.length > 0;

  if (nonKingNonPawn.length === 0 && hasPawns) return "Pawn Endgame";

  const pieceTypes = new Set(nonKingNonPawn.map(p => p.type));

  if (pieceTypes.size === 1) {
    if (pieceTypes.has("r")) return "Rook Endgame";
    if (pieceTypes.has("b")) return "Bishop Endgame";
    if (pieceTypes.has("n")) return "Knight Endgame";
    if (pieceTypes.has("q")) return "Queen Endgame";
  }

  if (pieceTypes.size === 2) {
    if (pieceTypes.has("q") && pieceTypes.has("r")) return "Queen and Rook";
  }

  return null;
}

/* ──────────── Smothered Mate Detection ──────────── */

function isSmotheredMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const king = findKing(chess, loserColor);
  if (!king) return false;
  // King must be surrounded by own pieces on all adjacent squares
  const kf = fileIdx(king);
  const kr = rankIdx(king);
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const s = sq(kf + df, kr + dr);
      if (!s) continue;
      const p = pieceAt(chess, s);
      if (!p || p.color !== loserColor) return false;
    }
  }
  // Check if the checking piece is a knight
  const checkers = getAllPieces(chess).filter(p => p.color === oppColor(loserColor) && p.type === "n");
  return checkers.some(n => isAttacking(chess, n.square, n, king));
}

/* ──────────── Back-Rank Mate Pattern Detection ──────────── */

function isBackRankMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const kRank = rankIdx(king);
  const isBackRank = (loserColor === "w" && kRank === 0) || (loserColor === "b" && kRank === 7);
  if (!isBackRank) return false;
  // The rank in front should be blocked by own pieces
  const nextRank = loserColor === "w" ? 1 : 6;
  const kFile = fileIdx(king);
  for (let df = -1; df <= 1; df++) {
    const s = sq(kFile + df, nextRank);
    if (!s) continue;
    const p = pieceAt(chess, s);
    if (p && p.color === loserColor) return true; // at least one blocker on second rank
  }
  return false;
}

/* ──────────── Discovered Check Detection ──────────── */

function isDiscoveredCheck(before: Chess, moveUci: string, after: Chess): boolean {
  if (!after.isCheck()) return false;
  const moverColor = before.turn();
  const from = moveUci.slice(0, 2) as Square;
  const to = moveUci.slice(2, 4) as Square;
  // The checking piece should NOT be the piece that moved
  const movedPiece = pieceAt(after, to);
  if (!movedPiece) return false;
  const oppKing = findKing(after, oppColor(moverColor));
  if (!oppKing) return false;
  // If the moved piece is directly checking, it's not a discovered check
  if (isAttacking(after, to, movedPiece, oppKing)) return false;
  return true;
}

/* ──────────── Double Check Detection ──────────── */

function isDoubleCheck(before: Chess, moveUci: string, after: Chess): boolean {
  if (!after.isCheck()) return false;
  const moverColor = before.turn();
  const oppKing = findKing(after, oppColor(moverColor));
  if (!oppKing) return false;
  // Count how many pieces are giving check
  const attackers = getAllPieces(after).filter(p => p.color === moverColor && p.type !== "k");
  let checkCount = 0;
  for (const a of attackers) {
    if (isAttacking(after, a.square, a, oppKing) && isPathClear(after, a.square, oppKing)) {
      checkCount++;
    }
    // Knight doesn't need path clear
    if (a.type === "n" && isAttacking(after, a.square, a, oppKing)) {
      checkCount++;
    }
  }
  // Deduplicate knight checks that were counted twice
  return checkCount >= 2;
}

/* ──────────── Sacrifice Detection ──────────── */

function isSacrifice(before: Chess, moveUci: string, cpLoss: number, isForBestMove: boolean): boolean {
  // A sacrifice: the move gives up material but gains a strategic/tactical advantage
  // For best moves: capturing with a more valuable piece, or moving to a square where piece can be taken
  const from = moveUci.slice(0, 2) as Square;
  const to = moveUci.slice(2, 4) as Square;
  const movedPiece = pieceAt(before, from);
  const capturedPiece = pieceAt(before, to);
  if (!movedPiece) return false;

  if (capturedPiece) {
    // Capturing with a more valuable piece is a sacrifice candidate
    return PIECE_VALUES[movedPiece.type] > PIECE_VALUES[capturedPiece.type] + 1 && (isForBestMove || cpLoss < 50);
  }
  return false;
}

/* ──────────── En Passant Detection ──────────── */

function isEnPassant(before: Chess, moveUci: string): boolean {
  const from = moveUci.slice(0, 2) as Square;
  const to = moveUci.slice(2, 4) as Square;
  const piece = pieceAt(before, from);
  if (!piece || piece.type !== "p") return false;
  // En passant: pawn captures to an empty square diagonally
  const captured = pieceAt(before, to);
  if (captured) return false; // normal capture, not en passant
  return fileIdx(from) !== fileIdx(to); // diagonal move to empty square = en passant
}

/* ──────────── Promotion Detection ──────────── */

function isPromotion(moveUci: string): boolean {
  return moveUci.length === 5; // e.g., "e7e8q"
}

function isUnderpromotion(moveUci: string): boolean {
  if (moveUci.length !== 5) return false;
  const promo = moveUci[4];
  return promo === "n" || promo === "r" || promo === "b";
}

/* ──────────── Attacking f2/f7 Detection ──────────── */

function isAttackingF2F7(before: Chess, after: Chess, moveUci: string, moverColor: Color): boolean {
  const to = moveUci.slice(2, 4) as Square;
  const targetSq = moverColor === "w" ? "f7" : "f2";
  // Direct attack on f2/f7
  if (to === targetSq) return true;
  // Piece now attacks f2/f7
  const landedPiece = pieceAt(after, to);
  if (landedPiece && isAttacking(after, to, landedPiece, targetSq as Square)) {
    // Only tag if f2/f7 is still defended by a pawn or king
    const oppColor_ = oppColor(moverColor);
    const fPawn = pieceAt(before, targetSq as Square);
    if (fPawn && fPawn.type === "p" && fPawn.color === oppColor_) return true;
  }
  return false;
}

/* ──────────── Checkers Detection ──────────── */

/** Find all pieces of `attackerColor` that are giving check to the opposing king */
function getCheckers(chess: Chess, kingSq: Square, attackerColor: Color): PieceInfo[] {
  const checkers: PieceInfo[] = [];
  const attackers = getAllPieces(chess).filter(p => p.color === attackerColor);
  for (const a of attackers) {
    if (a.type === "n") {
      if (isAttacking(chess, a.square, a, kingSq)) checkers.push(a);
    } else if (a.type === "p") {
      if (isAttacking(chess, a.square, a, kingSq)) checkers.push(a);
    } else if (a.type !== "k") {
      if (isAttacking(chess, a.square, a, kingSq) && isPathClear(chess, a.square, kingSq)) {
        checkers.push(a);
      }
    }
  }
  return checkers;
}

/** Get squares adjacent to a given square */
function adjacentSquares(s: Square): Square[] {
  const f = fileIdx(s);
  const r = rankIdx(s);
  const result: Square[] = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const ns = sq(f + df, r + dr);
      if (ns) result.push(ns);
    }
  }
  return result;
}

/* ──────────── Arabian Mate Detection ──────────── */

/** Rook + knight mate, king in or near a corner, rook on the edge */
function isArabianMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const kf = fileIdx(king);
  const kr = rankIdx(king);
  // King in corner or one step from corner
  const nearCorner = (kf <= 1 || kf >= 6) && (kr <= 1 || kr >= 6);
  if (!nearCorner) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  const rookChecker = checkers.find(c => c.type === "r");
  if (!rookChecker) return false;
  // Rook should be on edge file or rank
  const rf = fileIdx(rookChecker.square);
  const rr = rankIdx(rookChecker.square);
  const rookOnEdge = rf === 0 || rf === 7 || rr === 0 || rr === 7;
  if (!rookOnEdge) return false;
  // Knight must exist and cover escape squares
  const knights = getAllPieces(chess).filter(p => p.color === winnerColor && p.type === "n");
  return knights.length > 0;
}

/* ──────────── Anastasia's Mate Detection ──────────── */

/** Knight + rook, king on edge file, own pieces block escape */
function isAnastasiaMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const kf = fileIdx(king);
  // King should be on or near an edge file (a/b or g/h)
  const onEdge = kf <= 1 || kf >= 6;
  if (!onEdge) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  const rookChecker = checkers.find(c => c.type === "r" || c.type === "q");
  if (!rookChecker) return false;
  // Knight should be nearby, blocking escape
  const knights = getAllPieces(chess).filter(p => p.color === winnerColor && p.type === "n");
  if (knights.length === 0) return false;
  // Check that own pawns/pieces block escape (not just the knight)
  const adj = adjacentSquares(king);
  const ownBlockers = adj.filter(s => {
    const p = pieceAt(chess, s);
    return p && p.color === loserColor;
  });
  return ownBlockers.length >= 1;
}

/* ──────────── Boden's Mate Detection ──────────── */

/** Two bishops deliver mate on crossing diagonals */
function isBodensMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  // At least one bishop giving check
  const bishopCheckers = checkers.filter(c => c.type === "b");
  if (bishopCheckers.length === 0) return false;
  // Another bishop covering escape squares
  const allBishops = getAllPieces(chess).filter(p => p.color === winnerColor && p.type === "b");
  if (allBishops.length < 2) return false;
  // Both bishops should be involved — one checks, the other covers escapes
  return true;
}

/* ──────────── Corner Mate Detection ──────────── */

/** Knight gives checkmate to a king in the actual corner */
function isCornerMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const corners = new Set(["a1", "a8", "h1", "h8"]);
  if (!corners.has(king)) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  return checkers.some(c => c.type === "n");
}

/* ──────────── Double Bishop Mate Detection ──────────── */

/** Two bishops cooperate to deliver checkmate */
function isDoubleBishopMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  const bishopCheck = checkers.some(c => c.type === "b");
  if (!bishopCheck) return false;
  const allBishops = getAllPieces(chess).filter(p => p.color === winnerColor && p.type === "b");
  // Need at least 2 bishops, and at least one checking
  return allBishops.length >= 2;
}

/* ──────────── Dovetail Mate (Cozio's Mate) Detection ──────────── */

/** Queen delivers mate, king's two diagonally adjacent escape squares blocked by own pieces */
function isDovetailMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  if (!checkers.some(c => c.type === "q")) return false;
  // Queen should be adjacent to king
  const queenChecker = checkers.find(c => c.type === "q");
  if (!queenChecker) return false;
  const qf = fileIdx(queenChecker.square);
  const qr = rankIdx(queenChecker.square);
  const kf = fileIdx(king);
  const kr = rankIdx(king);
  const isAdjacentToKing = Math.abs(qf - kf) <= 1 && Math.abs(qr - kr) <= 1;
  if (!isAdjacentToKing) return false;
  // Two diagonal escape squares (away from queen) should be blocked by own pieces
  const adj = adjacentSquares(king);
  const diagSquares = adj.filter(s => {
    const sf = fileIdx(s);
    const sr = rankIdx(s);
    return Math.abs(sf - kf) === 1 && Math.abs(sr - kr) === 1 && s !== queenChecker.square;
  });
  const blockedByOwn = diagSquares.filter(s => {
    const p = pieceAt(chess, s);
    return p && p.color === loserColor;
  });
  return blockedByOwn.length >= 2;
}

/* ──────────── Epaulette Mate Detection ──────────── */

/** King flanked on both sides (same rank) by own pieces, mated by queen/rook */
function isEpauletteMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const kf = fileIdx(king);
  const kr = rankIdx(king);
  // Check squares to the left and right on the same rank
  const leftSq = sq(kf - 1, kr);
  const rightSq = sq(kf + 1, kr);
  if (!leftSq || !rightSq) return false;
  const leftPiece = pieceAt(chess, leftSq);
  const rightPiece = pieceAt(chess, rightSq);
  // Both flanking squares must have own pieces
  return !!(leftPiece && leftPiece.color === loserColor && rightPiece && rightPiece.color === loserColor);
}

/* ──────────── Hook Mate Detection ──────────── */

/** Rook + knight + pawn cooperate: rook on adjacent file, knight blocks, pawn covers */
function isHookMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  const rookChecker = checkers.find(c => c.type === "r");
  if (!rookChecker) return false;
  // Knight and pawn of winner should be nearby
  const pieces = getAllPieces(chess).filter(p => p.color === winnerColor);
  const hasKnight = pieces.some(p => p.type === "n");
  const hasPawn = pieces.some(p => p.type === "p" && Math.abs(fileIdx(p.square) - fileIdx(king)) <= 2 && Math.abs(rankIdx(p.square) - rankIdx(king)) <= 2);
  return hasKnight && hasPawn;
}

/* ──────────── Kill Box Mate Detection ──────────── */

/** Queen delivers mate while covering all escape squares in a rectangular pattern */
function isKillBoxMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  const queenChecker = checkers.find(c => c.type === "q");
  if (!queenChecker) return false;
  // Queen should NOT be adjacent — it's at distance forming a "box"
  const qf = fileIdx(queenChecker.square);
  const qr = rankIdx(queenChecker.square);
  const kf = fileIdx(king);
  const kr = rankIdx(king);
  const dist = Math.max(Math.abs(qf - kf), Math.abs(qr - kr));
  return dist === 2;
}

/* ──────────── Morphy's / Opera Mate Detection ──────────── */

/** Bishop + rook cooperate: rook delivers mate on back rank, bishop covers diagonal */
function isMorphyMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const kr = rankIdx(king);
  const backRank = loserColor === "w" ? 0 : 7;
  if (kr !== backRank) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  const rookChecker = checkers.find(c => c.type === "r");
  if (!rookChecker) return false;
  // Bishop should be covering a diagonal escape square
  const bishops = getAllPieces(chess).filter(p => p.color === winnerColor && p.type === "b");
  if (bishops.length === 0) return false;
  // Check if bishop covers any of king's escape squares
  const adj = adjacentSquares(king);
  for (const b of bishops) {
    for (const s of adj) {
      if (isAttacking(chess, b.square, b, s) && isPathClear(chess, b.square, s)) return true;
    }
  }
  return false;
}

/* ──────────── Pillsbury's Mate Detection ──────────── */

/** Rook supported by bishop delivers mate, typically on a file next to king */
function isPillsburyMate(chess: Chess): boolean {
  // Pillsbury's: rook mates on a file, supported by a bishop on the diagonal
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  const rookChecker = checkers.find(c => c.type === "r");
  if (!rookChecker) return false;
  // Bishop supporting the rook (defending it)
  const bishops = getAllPieces(chess).filter(p => p.color === winnerColor && p.type === "b");
  for (const b of bishops) {
    if (isAttacking(chess, b.square, b, rookChecker.square) && isPathClear(chess, b.square, rookChecker.square)) {
      return true;
    }
  }
  return false;
}

/* ──────────── Swallow's Tail Mate Detection ──────────── */

/** Queen delivers mate, two escape squares behind the king are blocked by own pieces */
function isSwallowsTailMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  const queenChecker = checkers.find(c => c.type === "q");
  if (!queenChecker) return false;
  const kf = fileIdx(king);
  const kr = rankIdx(king);
  const qr = rankIdx(queenChecker.square);
  // Determine "behind" = away from the queen
  const behindDir = kr > qr ? 1 : kr < qr ? -1 : 0;
  if (behindDir === 0) return false;
  // Two diagonal squares behind
  const left = sq(kf - 1, kr + behindDir);
  const right = sq(kf + 1, kr + behindDir);
  if (!left || !right) return false;
  const lp = pieceAt(chess, left);
  const rp = pieceAt(chess, right);
  return !!(lp && lp.color === loserColor && rp && rp.color === loserColor);
}

/* ──────────── Vukovic Mate Detection ──────────── */

/** Rook + knight mate (generalized — not necessarily corner) */
function isVukovicMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  const checkers = getCheckers(chess, king, winnerColor);
  // One of rook/knight gives check, the other covers escapes
  const hasRookChecker = checkers.some(c => c.type === "r");
  const hasKnightChecker = checkers.some(c => c.type === "n");
  if (hasRookChecker) {
    return getAllPieces(chess).some(p => p.color === winnerColor && p.type === "n");
  }
  if (hasKnightChecker) {
    return getAllPieces(chess).some(p => p.color === winnerColor && p.type === "r");
  }
  return false;
}

/* ──────────── Blind Swine Mate Detection ──────────── */

/** Two rooks on the 7th rank cooperate to deliver checkmate */
function isBlindSwineMate(chess: Chess): boolean {
  if (!chess.isCheckmate()) return false;
  const loserColor = chess.turn();
  const winnerColor = oppColor(loserColor);
  const king = findKing(chess, loserColor);
  if (!king) return false;
  // Winner should have two rooks on the 7th rank (from winner's perspective)
  const seventhRank = winnerColor === "w" ? 6 : 1; // 0-indexed: rank 7 for white = idx 6
  const rooksOnSeventh = getAllPieces(chess).filter(
    p => p.color === winnerColor && p.type === "r" && rankIdx(p.square) === seventhRank
  );
  if (rooksOnSeventh.length < 2) return false;
  // One of the rooks should be the checker
  const checkers = getCheckers(chess, king, winnerColor);
  return checkers.some(c => c.type === "r" && rankIdx(c.square) === seventhRank);
}

/* ──────────── Capturing Defender Detection ──────────── */

/** Detect if a move captures a piece that was defending another piece, leaving it vulnerable */
function detectCapturingDefender(before: Chess, after: Chess, moveUci: string): string | null {
  try {
    const to = moveUci.slice(2, 4) as Square;
    const moverColor = before.turn();
    const oppC = oppColor(moverColor);
    const capturedPiece = pieceAt(before, to);
    if (!capturedPiece || capturedPiece.color !== oppC) return null;
    // What was the captured piece defending?
    const oppPiecesBefore = getAllPieces(before).filter(p => p.color === oppC && p.square !== to && PIECE_VALUES[p.type] >= 3);
    for (const ward of oppPiecesBefore) {
      if (isAttacking(before, to, capturedPiece, ward.square)) {
        if (capturedPiece.type !== "n" && !isPathClear(before, to, ward.square)) continue;
        // Check if ward is now undefended
        const wardAfter = pieceAt(after, ward.square);
        if (!wardAfter) continue; // ward was also captured somehow
        // Check if any other opponent piece still defends ward
        const otherDefenders = getAllPieces(after).filter(p => p.color === oppC && p.square !== ward.square);
        const stillDefended = otherDefenders.some(d => {
          if (!isAttacking(after, d.square, d, ward.square)) return false;
          if (d.type !== "n" && d.type !== "p" && !isPathClear(after, d.square, ward.square)) return false;
          return true;
        });
        if (!stillDefended) {
          return `Captures the ${pieceName(capturedPiece.type)} on ${to}, which was the key defender of the ${pieceName(ward.type)} on ${ward.square} — now it's unprotected`;
        }
      }
    }
  } catch { /* best-effort */ }
  return null;
}

/* ──────────── Attraction Detection ──────────── */

/** Detect if the best move lures a key piece to a worse square via sacrifice/check */
function detectAttraction(before: Chess, after: Chess, moveUci: string, isForBestMove: boolean): string | null {
  if (!isForBestMove) return null;
  try {
    const from = moveUci.slice(0, 2) as Square;
    const to = moveUci.slice(2, 4) as Square;
    const movedPiece = pieceAt(before, from);
    const capturedPiece = pieceAt(before, to);
    if (!movedPiece || !capturedPiece) return null;
    // Sacrifice: attacker is more valuable than captured piece, or it's a check
    const isSac = PIECE_VALUES[movedPiece.type] > PIECE_VALUES[capturedPiece.type] || after.isCheck();
    if (!isSac) return null;
    // After opponent recaptures on 'to', check if a tactic appears
    const oppMoves = after.moves({ verbose: true });
    const recapture = oppMoves.find(m => m.to === to);
    if (!recapture) return null;
    const sim = new Chess(after.fen());
    const result = sim.move(recapture);
    if (!result) return null;
    // Check if a fork, pin, or skewer now exists
    const simPieces = getAllPieces(sim);
    const bestColor = movedPiece.color;
    for (const p of simPieces.filter(pp => pp.color === bestColor)) {
      if (p.type !== "k" && p.type !== "p") {
        const forks = detectFork(sim, p.square, p);
        if (forks.length >= 2) {
          return `The sacrifice on ${to} lures the ${pieceName(capturedPiece.type)} into position, allowing a devastating fork`;
        }
      }
    }
    const skewers = detectSkewer(sim, bestColor);
    if (skewers.length > 0) {
      return `The sacrifice on ${to} attracts the opponent's piece to a square where it falls victim to a skewer`;
    }
    const pins = detectPins(sim, oppColor(bestColor));
    if (pins.length > 0) {
      return `The sacrifice on ${to} draws the opponent's piece into a pin`;
    }
  } catch { /* best-effort */ }
  return null;
}

/* ──────────── Deflection Detection ──────────── */

/** Detect if a move forces a defending piece away from its duty */
function detectDeflection(before: Chess, after: Chess, moveUci: string): string | null {
  try {
    const to = moveUci.slice(2, 4) as Square;
    const moverColor = before.turn();
    const oppC = oppColor(moverColor);
    // If we attacked a piece that was defending something else
    const landedPiece = pieceAt(after, to);
    if (!landedPiece) return null;
    // Check if we're attacking a key defender
    const oppPieces = getAllPieces(after).filter(p => p.color === oppC && p.type !== "k" && p.type !== "p");
    for (const defender of oppPieces) {
      // Check if this piece is attacked by our moved piece
      if (!isAttacking(after, to, landedPiece, defender.square)) continue;
      if (landedPiece.type !== "n" && !isPathClear(after, to, defender.square)) continue;
      // Check what this defender is currently protecting
      const oppPiecesToDefend = getAllPieces(after).filter(p => p.color === oppC && p.square !== defender.square && PIECE_VALUES[p.type] >= 3);
      for (const ward of oppPiecesToDefend) {
        if (isAttacking(after, defender.square, defender, ward.square)) {
          if (defender.type !== "n" && !isPathClear(after, defender.square, ward.square)) continue;
          // This defender protects the ward — if deflected, ward becomes vulnerable
          return `Attacks the ${pieceName(defender.type)} on ${defender.square}, deflecting it from defending the ${pieceName(ward.type)} on ${ward.square}`;
        }
      }
    }
  } catch { /* best-effort */ }
  return null;
}

/* ──────────── Interference Detection ──────────── */

/** Detect if a piece is placed between two enemy pieces, disrupting their coordination */
function detectInterference(before: Chess, after: Chess, moveUci: string): string | null {
  try {
    const to = moveUci.slice(2, 4) as Square;
    const moverColor = before.turn();
    const oppC = oppColor(moverColor);
    const tf = fileIdx(to);
    const tr = rankIdx(to);
    // Look for opponent slider pairs where our piece now blocks the line
    const oppSliders = getAllPieces(after).filter(p => p.color === oppC && (p.type === "r" || p.type === "b" || p.type === "q"));
    for (let i = 0; i < oppSliders.length; i++) {
      for (let j = i + 1; j < oppSliders.length; j++) {
        const a = oppSliders[i];
        const b = oppSliders[j];
        const af = fileIdx(a.square);
        const ar = rankIdx(a.square);
        const bf = fileIdx(b.square);
        const br = rankIdx(b.square);
        // Check if our piece on 'to' lies on the line between a and b
        // Same file
        if (af === bf && af === tf) {
          if ((ar < tr && tr < br) || (br < tr && tr < ar)) {
            // Check they were connected before
            if (isPathClear(before, a.square, b.square)) {
              return `Places a piece on ${to} between the opponent's ${pieceName(a.type)} on ${a.square} and ${pieceName(b.type)} on ${b.square}, disrupting their coordination`;
            }
          }
        }
        // Same rank
        if (ar === br && ar === tr) {
          if ((af < tf && tf < bf) || (bf < tf && tf < af)) {
            if (isPathClear(before, a.square, b.square)) {
              return `Places a piece on ${to} between the opponent's ${pieceName(a.type)} on ${a.square} and ${pieceName(b.type)} on ${b.square}, cutting their connection`;
            }
          }
        }
        // Same diagonal
        if (Math.abs(af - bf) === Math.abs(ar - br) && Math.abs(af - tf) === Math.abs(ar - tr) && Math.abs(bf - tf) === Math.abs(br - tr)) {
          const between = (af < tf && tf < bf) || (bf < tf && tf < af);
          if (between && isPathClear(before, a.square, b.square)) {
            return `Places a piece on ${to} on the diagonal between the opponent's ${pieceName(a.type)} on ${a.square} and ${pieceName(b.type)} on ${b.square}`;
          }
        }
      }
    }
    // Also check if our piece blocks a defender from protecting another piece
    for (const slider of oppSliders) {
      const sf = fileIdx(slider.square);
      const sr = rankIdx(slider.square);
      const defended = getAllPieces(after).filter(p => p.color === oppC && p.square !== slider.square && PIECE_VALUES[p.type] >= 3);
      for (const ward of defended) {
        const wf = fileIdx(ward.square);
        const wr = rankIdx(ward.square);
        // Is our piece between the slider and ward?
        const onSameFile = sf === wf && sf === tf && ((sr < tr && tr < wr) || (wr < tr && tr < sr));
        const onSameRank = sr === wr && sr === tr && ((sf < tf && tf < wf) || (wf < tf && tf < sf));
        const onSameDiag = Math.abs(sf - wf) === Math.abs(sr - wr) && Math.abs(sf - tf) === Math.abs(sr - tr) && Math.abs(wf - tf) === Math.abs(wr - tr) && ((sf < tf && tf < wf) || (wf < tf && tf < sf));
        if ((onSameFile || onSameRank || onSameDiag) && isPathClear(before, slider.square, ward.square)) {
          return `Interferes between the ${pieceName(slider.type)} on ${slider.square} and the ${pieceName(ward.type)} on ${ward.square} it was protecting`;
        }
      }
    }
  } catch { /* best-effort */ }
  return null;
}

/* ──────────── Clearance Detection ──────────── */

/** Detect if a piece moves primarily to clear a line/square for another piece */
function detectClearance(before: Chess, after: Chess, moveUci: string): string | null {
  try {
    const from = moveUci.slice(0, 2) as Square;
    const to = moveUci.slice(2, 4) as Square;
    const moverColor = before.turn();
    const movedPiece = pieceAt(before, from);
    if (!movedPiece) return null;
    // Check if any friendly piece now has access to the vacated square or the cleared line
    const friendlyPieces = getAllPieces(after).filter(p => p.color === moverColor && p.square !== to);
    // Check: can a friendly piece now move to 'from' (the vacated square)?
    for (const fp of friendlyPieces) {
      if (fp.type === "k" || fp.type === "p") continue;
      if (isAttacking(after, fp.square, fp, from)) {
        if (fp.type === "n" || isPathClear(after, fp.square, from)) {
          // Before the move, fp couldn't reach 'from' because our piece was there
          // This is a clearance if the vacated square is strategically useful
          // Check if the file/rank/diagonal was opened for a slider
          if (fp.type === "r" || fp.type === "q" || fp.type === "b") {
            const ff = fileIdx(from);
            const fr = rankIdx(from);
            const pf = fileIdx(fp.square);
            const pr = rankIdx(fp.square);
            // Same file/rank/diagonal — the slider can now see through
            const aligned = ff === pf || fr === pr || Math.abs(ff - pf) === Math.abs(fr - pr);
            if (aligned) {
              return `Clears the line for the ${pieceName(fp.type)} on ${fp.square}, which now has access to the ${fileIdx(from) === fileIdx(fp.square) ? "file" : rankIdx(from) === rankIdx(fp.square) ? "rank" : "diagonal"}`;
            }
          }
        }
      }
    }
  } catch { /* best-effort */ }
  return null;
}

/* ──────────── Intermezzo Detection ──────────── */

/** Detect if a move is an intermezzo (zwischenzug) — an in-between move before the expected reply */
function detectIntermezzo(before: Chess, moveUci: string, after: Chess, bestMoveUci: string): string | null {
  try {
    // If the position had a capture (previous move captured something),
    // and the best response is NOT a recapture but a forcing move (check/threat)
    const to = moveUci.slice(2, 4) as Square;
    const capturedPiece = pieceAt(before, to);
    if (!capturedPiece) return null; // Previous move needs to be a capture for intermezzo context
    // Best response — if it's NOT recapturing on 'to' but instead a check or major threat
    const bestTo = bestMoveUci.slice(2, 4) as Square;
    if (bestTo === to) return null; // Recapture = normal, not intermezzo
    // Is the best move a check?
    const sim = new Chess(before.fen());
    const bestResult = sim.move({ from: bestMoveUci.slice(0, 2) as Square, to: bestTo, promotion: bestMoveUci[4] as any });
    if (bestResult && sim.isCheck()) {
      return `Instead of recapturing on ${to}, the in-between check **${bestResult.san}** is even stronger — a zwischenzug that gains tempo`;
    }
    // Is the best move a major threat?
    if (bestResult) {
      const afterBest = new Chess(sim.fen());
      const oppResponses = afterBest.moves({ verbose: true });
      const mustDealWithThreat = oppResponses.length <= 3;
      if (mustDealWithThreat) {
        return `Instead of the expected recapture on ${to}, **${bestResult.san}** is an intermezzo — a forcing in-between move`;
      }
    }
  } catch { /* best-effort */ }
  return null;
}

/* ──────────── Open File Detection ──────────── */

function openFiles(chess: Chess, color: Color): { open: string[]; semiOpen: string[] } {
  const allPieces = getAllPieces(chess);
  const open: string[] = [];
  const semiOpen: string[] = [];

  for (let f = 0; f < 8; f++) {
    const friendlyPawns = allPieces.filter(p => p.type === "p" && p.color === color && fileIdx(p.square) === f);
    const enemyPawns = allPieces.filter(p => p.type === "p" && p.color === oppColor(color) && fileIdx(p.square) === f);

    if (friendlyPawns.length === 0 && enemyPawns.length === 0) {
      open.push(FILES[f] + "-file");
    } else if (friendlyPawns.length === 0 && enemyPawns.length > 0) {
      semiOpen.push(FILES[f] + "-file");
    }
  }

  return { open, semiOpen };
}

/* ──────────── Piece Activity ──────────── */

function pieceActivity(chess: Chess, color: Color): { active: string[]; passive: string[] } {
  const active: string[] = [];
  const passive: string[] = [];

  try {
    const turnColor = chess.turn();
    if (turnColor !== color) return { active, passive }; // can only analyze for side to move

    const moves = chess.moves({ verbose: true });
    const pieceSquares = new Map<string, number>();

    for (const m of moves) {
      pieceSquares.set(m.from, (pieceSquares.get(m.from) ?? 0) + 1);
    }

    const pieces = getAllPieces(chess).filter(p => p.color === color && p.type !== "k" && p.type !== "p");
    for (const p of pieces) {
      const moveCount = pieceSquares.get(p.square) ?? 0;
      if (moveCount >= 5) {
        active.push(`${pieceName(p.type, true)} on ${p.square} is very active (${moveCount} available moves)`);
      } else if (moveCount <= 1 && p.type !== "k") {
        passive.push(`${pieceName(p.type, true)} on ${p.square} is passive (only ${moveCount} move${moveCount === 1 ? "" : "s"})`);
      }
    }
  } catch {
    // best-effort
  }

  return { active, passive };
}

/* ────────────── Bishop Pair Detection ────────────── */

function hasBishopPair(chess: Chess, color: Color): boolean {
  const bishops = getAllPieces(chess).filter(p => p.type === "b" && p.color === color);
  if (bishops.length < 2) return false;

  // Check they're on different colored squares
  const squareColors = bishops.map(b => (fileIdx(b.square) + rankIdx(b.square)) % 2);
  return squareColors[0] !== squareColors[1];
}

/* ─────────────────── Main Explanation Generator ─────────────────── */

/* ═══════════════════════════════════════════════════════════════════
   COACHING INTELLIGENCE LAYER
   Pattern-matching heuristics that produce instructive, principle-
   based coaching text — simulates the kind of explanations a titled
   player would give during a lesson.
   ═══════════════════════════════════════════════════════════════════ */

type MoveFunction =
  | "developing"    // brings a piece off the back rank
  | "castling"      // castles
  | "attacking"     // creates a direct threat (check, capture, or attack on undefended piece)
  | "defending"     // moves a piece to defend a threatened piece / square
  | "prophylactic"  // prevents an opponent plan without an immediate tactical point
  | "pawn-advance"  // pushes a pawn (gaining space, fixing structure, or weakening something)
  | "trading"       // initiates an exchange of equal-value pieces
  | "retreating"    // moves a piece backwards
  | "repositioning" // moves a piece sideways or to a better diagonal / file
  | "unknown";

function classifyMoveFunction(
  chess: Chess,
  uci: string,
  san: string,
  fenAfter: string | null,
): MoveFunction {
  if (san.startsWith("O-O")) return "castling";

  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  const moverColor = chess.turn();
  const piece = pieceAt(chess, from);
  if (!piece) return "unknown";

  const captured = pieceAt(chess, to);
  const backRank = moverColor === "w" ? "1" : "8";

  // Capture → attacking or trading
  if (captured) {
    if (Math.abs(PIECE_VALUES[piece.type] - PIECE_VALUES[captured.type]) <= 1 && piece.type !== "p") {
      return "trading";
    }
    return "attacking";
  }

  // Check → attacking
  if (fenAfter) {
    try { if (new Chess(fenAfter).isCheck()) return "attacking"; } catch {}
  }

  // Pawn push
  if (piece.type === "p") return "pawn-advance";

  // Retreat to back rank
  if (to[1] === backRank && from[1] !== backRank) return "retreating";

  // Developing from back rank
  if (from[1] === backRank && to[1] !== backRank && piece.type !== "k") return "developing";

  // Repositioning — same rank or toward center
  return "repositioning";
}

/** Identify which chess principle(s) the played move violates. */
type PrincipleViolation = {
  principle: string;
  explanation: string;
  tip: string;
};

function detectPrincipleViolations(
  before: Chess,
  fenAfterUser: string | null,
  userUci: string,
  userSan: string,
  bestUci: string | null,
  cpLoss: number,
  moveFunc: MoveFunction,
): PrincipleViolation[] {
  const violations: PrincipleViolation[] = [];
  const moverColor = before.turn();
  const fromSq = userUci.slice(0, 2) as Square;
  const toSq = userUci.slice(2, 4) as Square;
  const piece = pieceAt(before, fromSq);
  if (!piece) return violations;

  const totalPieces = getAllPieces(before).length;
  const dev = countDeveloped(before, moverColor);
  const isOpening = totalPieces >= 28; // most pieces still on the board
  const isMiddlegame = totalPieces >= 14 && totalPieces < 28;
  const isEndgame = totalPieces < 14;

  // ── Opening Principles ──

  // Don't move the same piece twice in the opening
  if (isOpening && dev.developed < dev.total && piece.type !== "p") {
    // Check if this piece was already developed (off back rank) and is moving again
    const backRank = moverColor === "w" ? "1" : "8";
    if (fromSq[1] !== backRank && toSq[1] !== backRank) {
      violations.push({
        principle: "Develop New Pieces First",
        explanation: `You moved your already-developed ${pieceName(piece.type)} again while ${dev.total - dev.developed} piece${dev.total - dev.developed > 1 ? "s are" : " is"} still on the back rank.`,
        tip: "In the opening, prioritise getting all your minor pieces out before manoeuvring pieces that are already in play. Each new piece adds firepower."
      });
    }
  }

  // Don't bring the queen out early
  if (isOpening && piece.type === "q" && dev.developed < dev.total - 1) {
    violations.push({
      principle: "Don't Develop the Queen Early",
      explanation: "Moving the queen out while minor pieces are still undeveloped invites tempo-gaining attacks by the opponent.",
      tip: "Develop knights and bishops first — they can't be chased as easily. The queen is most powerful when the position is already open."
    });
  }

  // Castle early
  if (isOpening && !hasCastled(before, moverColor) && canStillCastle(before, moverColor) && moveFunc !== "castling") {
    // Was castling available and we did something else?
    const moves = before.moves({ verbose: true });
    const canCastleNow = moves.some(m => m.san.startsWith("O-O"));
    if (canCastleNow && cpLoss >= 50) {
      violations.push({
        principle: "Castle Early for King Safety",
        explanation: "Castling was available but you chose a different move, leaving your king in the centre.",
        tip: "When castling is available and there's no urgent tactical need, castle! It tucks the king away safely and connects the rooks."
      });
    }
  }

  // ── Middlegame Principles ──

  // Don't trade when you're ahead in development
  if (moveFunc === "trading" && isOpening && dev.developed > dev.total / 2) {
    const oppDev = countDeveloped(before, oppColor(moverColor));
    if (dev.developed > oppDev.developed + 1) {
      violations.push({
        principle: "Don't Simplify When Ahead in Development",
        explanation: "Trading pieces when you have a development lead removes the advantage — you want more pieces on the board to exploit your faster mobilisation.",
        tip: "Keep the tension! When you're ahead in development, look for ways to open the position and create tactics instead of simplifying."
      });
    }
  }

  // Moving towards the edge (non-pawn, non-king)
  if (piece.type !== "p" && piece.type !== "k" && piece.type !== "r") {
    const fromEdge = Math.min(fileIdx(fromSq), 7 - fileIdx(fromSq), rankIdx(fromSq), 7 - rankIdx(fromSq));
    const toEdge = Math.min(fileIdx(toSq), 7 - fileIdx(toSq), rankIdx(toSq), 7 - rankIdx(toSq));
    if (toEdge < fromEdge && toEdge === 0 && cpLoss >= 80) {
      violations.push({
        principle: "Knights and Bishops Belong in the Centre",
        explanation: `Moving the ${pieceName(piece.type)} to the edge (${toSq}) reduces its scope — a ${pieceName(piece.type)} in the centre controls more squares.`,
        tip: piece.type === "n"
          ? "\"A knight on the rim is dim\" — knights need central outposts to be effective. Look for protected squares like d4, e5, c5."
          : "Bishops are strong on long diagonals aimed at the centre. Corner squares often result in a passive bishop."
      });
    }
  }

  // Weakening the pawn structure without compensation
  if (piece.type === "p" && fenAfterUser) {
    try {
      const afterUser = new Chess(fenAfterUser);
      const structBefore = pawnStructure(before, moverColor);
      const structAfter = pawnStructure(afterUser, moverColor);
      const newIssues = structAfter.issues.filter(i => !structBefore.issues.includes(i));
      if (newIssues.length > 0 && cpLoss >= 60) {
        violations.push({
          principle: "Don't Create Pawn Weaknesses Without Compensation",
          explanation: `This pawn move creates ${newIssues.join(" and ")} — a static weakness that persists for the rest of the game.`,
          tip: "Every pawn move is permanent. Before pushing a pawn, ask: 'What squares am I weakening?' and 'Do I get enough in return (space, open lines, attack)?'"
        });
      }
    } catch {}
  }

  // Ignoring a concrete threat
  if (bestUci && cpLoss >= 150 && fenAfterUser) {
    try {
      const bestFrom = bestUci.slice(0, 2) as Square;
      const bestTo = bestUci.slice(2, 4) as Square;
      const bestCaptured = pieceAt(before, bestTo);
      if (bestCaptured && PIECE_VALUES[bestCaptured.type] >= 3) {
        // The best move was capturing a significant piece — user missed a tactic
        violations.push({
          principle: "Check for Captures and Threats First",
          explanation: `There was a ${pieceName(bestCaptured.type)} available for capture on ${bestTo}, but you played a different move and missed the opportunity.`,
          tip: "Before each move, scan the board with the checklist: **Checks → Captures → Threats**. This simple habit catches most tactical opportunities."
        });
      }
    } catch {}
  }

  // Retreating when you should be attacking
  if (moveFunc === "retreating" && cpLoss >= 100) {
    try {
      const evalBefore = materialBalance(before);
      const matAdv = moverColor === "w" ? evalBefore : -evalBefore;
      if (matAdv >= 2) {
        violations.push({
          principle: "When Ahead, Don't Retreat — Attack",
          explanation: "You have a material advantage. Retreating gives the opponent time to consolidate. Convert the advantage by keeping pressure.",
          tip: "When you're up material, trade pieces (not pawns) and keep the initiative. Every piece exchange when ahead brings you closer to a winning endgame."
        });
      }
    } catch {}
  }

  // ── Endgame Principles ──

  if (isEndgame) {
    // King should be active in the endgame
    if (piece.type === "k") {
      // Moving the king is good in the endgame — no violation
    } else {
      const king = findKing(before, moverColor);
      if (king) {
        const kRank = rankIdx(king);
        const backR = moverColor === "w" ? 0 : 7;
        if (kRank === backR && cpLoss >= 50) {
          violations.push({
            principle: "Activate the King in the Endgame",
            explanation: "Your king is still on the back rank. In the endgame, the king is a fighting piece — it should march towards the centre.",
            tip: "Once queens are off the board, the king belongs in the centre (d4/e4/d5/e5). An active king can support passed pawns and dominate the opponent's."
          });
        }
      }
    }

    // Push passed pawns
    if (piece.type !== "p") {
      const pStruct = pawnStructure(before, moverColor);
      if (pStruct.assets.some(a => a.includes("passed"))) {
        violations.push({
          principle: "Push Your Passed Pawns",
          explanation: "You have a passed pawn that could advance, but you moved a piece instead. Passed pawns are the main winning technique in endgames.",
          tip: "Passed pawns must be pushed! Support them with your king and pieces. A passed pawn on the 6th or 7th rank often wins by itself."
        });
      }
    }
  }

  return violations;
}

/** Generate a contrast sentence explaining WHY the best move is better. */
function generateContrastInsight(
  before: Chess,
  userUci: string,
  userFunc: MoveFunction,
  bestUci: string | null,
  bestSan: string | null,
  fenAfterBest: string | null,
  cpLoss: number,
): string | null {
  if (!bestUci || !bestSan) return null;

  const moverColor = before.turn();
  const bestFunc = classifyMoveFunction(before, bestUci, bestSan, fenAfterBest);

  // Concrete contrast based on move function mismatch
  if (userFunc === "retreating" && bestFunc === "attacking") {
    return `Instead of retreating, the key idea was **${bestSan}** — staying aggressive and maintaining the initiative. In chess, a move forward in a strong position is almost always better than a move backward.`;
  }
  if (userFunc === "pawn-advance" && bestFunc === "developing") {
    return `Rather than pushing a pawn, the priority was **${bestSan}** — getting a new piece into the game. Pieces create threats; extra pawn moves in the opening often just waste time.`;
  }
  if (userFunc === "pawn-advance" && bestFunc === "castling") {
    return `Instead of a pawn push, you should have castled with **${bestSan}**. King safety almost always takes priority over gaining space.`;
  }
  if (userFunc === "trading" && bestFunc === "developing") {
    return `Rather than exchanging pieces, **${bestSan}** develops a new piece with more impact. Simplifying too early can let the opponent equalise.`;
  }
  if (userFunc === "repositioning" && bestFunc === "attacking") {
    return `Instead of a quiet repositioning move, **${bestSan}** creates a concrete threat that the opponent must deal with immediately. Active moves that force a response are usually stronger.`;
  }
  if (userFunc === "developing" && bestFunc === "attacking") {
    return `While developing is usually good, here **${bestSan}** was stronger because it creates an immediate tactical threat. When a forcing move is available, it often takes priority.`;
  }
  if (userFunc === "attacking" && bestFunc === "defending") {
    return `Your attacking move was premature. **${bestSan}** first shores up a defensive weakness, which is essential before launching an attack. Sound attacks are built on a stable position.`;
  }
  if (bestFunc === "castling") {
    return `The best move was simply **${bestSan}** — getting the king to safety. When you can castle, it should almost always be done before starting any middlegame plans.`;
  }

  // Generic but still instructive
  if (cpLoss >= 200) {
    return `The critical difference is that **${bestSan}** avoids the tactical problem your move ran into. Always look for the opponent's strongest reply before committing to a move.`;
  }
  if (cpLoss >= 100) {
    return `**${bestSan}** is more accurate because it maintains the balance of the position without creating the weakness your move introduced.`;
  }

  return null;
}

/** Classify the position type for context-aware commentary. */
type PositionProfile = {
  phase: "opening" | "middlegame" | "endgame";
  structure: "open" | "closed" | "semi-open";
  tension: "high" | "low";   // many captures / checks available
  advantage: "winning" | "better" | "equal" | "worse" | "losing";
};

function profilePosition(chess: Chess, evalCp: number, perspective: Color): PositionProfile {
  const totalPieces = getAllPieces(chess).length;
  const phase: PositionProfile["phase"] =
    totalPieces >= 26 ? "opening" : totalPieces >= 14 ? "middlegame" : "endgame";

  // Structure: count pawns in the center files (c-f)
  const pawns = getAllPieces(chess).filter(p => p.type === "p");
  const centralPawns = pawns.filter(p => {
    const f = fileIdx(p.square);
    return f >= 2 && f <= 5;
  });
  const lockedPairs = centralPawns.filter(p => {
    const f = fileIdx(p.square);
    const r = rankIdx(p.square);
    const oppDir = p.color === "w" ? 1 : -1;
    return centralPawns.some(op =>
      op.color !== p.color && fileIdx(op.square) === f && rankIdx(op.square) === r + oppDir
    );
  });
  const structure: PositionProfile["structure"] =
    lockedPairs.length >= 4 ? "closed" : centralPawns.length <= 2 ? "open" : "semi-open";

  // Tension
  let captureCount = 0;
  try {
    const moves = chess.moves({ verbose: true });
    captureCount = moves.filter(m => m.captured).length;
  } catch {}
  const tension: PositionProfile["tension"] = captureCount >= 4 ? "high" : "low";

  // Advantage from perspective
  const userEval = chess.turn() === perspective ? evalCp : -evalCp;
  const advantage: PositionProfile["advantage"] =
    userEval > 300 ? "winning" : userEval > 80 ? "better" : userEval > -80 ? "equal" : userEval > -300 ? "worse" : "losing";

  return { phase, structure, tension, advantage };
}

/** Generate an actionable coaching takeaway based on the full context. */
function generateCoachingTakeaway(
  profile: PositionProfile,
  violations: PrincipleViolation[],
  themes: TacticalTheme[],
  cpLoss: number,
): string {
  // Priority: if there's a principle violation, the tip from the most severe one
  if (violations.length > 0) {
    return `💡 **Lesson**: ${violations[0].tip}`;
  }

  // Tactical miss
  const tacticalNames = themes.map(t => t.name.toLowerCase());
  if (tacticalNames.some(n => n.includes("fork"))) {
    return "💡 **Lesson**: Always scan for knight forks after every opponent move — check which pieces are on the same colour squares as a potential knight outpost.";
  }
  if (tacticalNames.some(n => n.includes("pin"))) {
    return "💡 **Lesson**: When pieces are lined up on a rank, file, or diagonal, look for pin opportunities. Pinned pieces can't move without exposing a more valuable piece behind them.";
  }
  if (tacticalNames.some(n => n.includes("hanging"))) {
    return "💡 **Lesson**: Before playing any move, do a quick \"blunder check\" — scan whether any of your pieces will be left undefended.";
  }

  // Phase-specific wisdom
  if (profile.phase === "opening") {
    return "💡 **Lesson**: In the opening, follow the three golden rules: (1) control the centre, (2) develop all minor pieces, (3) castle early. Don't get fancy until you've completed your development.";
  }
  if (profile.phase === "endgame") {
    return "💡 **Lesson**: Endgame priorities: (1) activate your king, (2) push passed pawns, (3) restrict the opponent's king. Piece activity matters even more than material in endgames.";
  }

  // Generic but useful
  if (cpLoss >= 200) {
    return "💡 **Lesson**: Before playing a move, always ask \"What does my opponent do next?\" Imagining their strongest reply is the single best habit to reduce blunders.";
  }
  return "💡 **Lesson**: Take a moment before each move to consider: are there any checks, captures, or threats I should address before continuing with my plan?";
}



function parseUciToSan(fen: string, uci: string): string | null {
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const promo = uci.slice(4, 5) || undefined;
    const result = chess.move({ from, to, promotion: promo as PieceSymbol | undefined });
    return result?.san ?? null;
  } catch {
    return null;
  }
}

function fenAfterMove(fen: string, uci: string): string | null {
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const promo = uci.slice(4, 5) || undefined;
    chess.move({ from, to, promotion: promo as PieceSymbol | undefined });
    return chess.fen();
  } catch {
    return null;
  }
}

/**
 * Generate a deep, human-like coaching explanation for why a move is bad
 * and why the engine's recommended move is better.
 */
export function explainMoves(
  fenBefore: string,
  userMoveUci: string,
  bestMoveUci: string | null,
  cpLoss: number,
  evalBefore: number,
  evalAfter: number,
): MoveExplanation {
  const userSan = parseUciToSan(fenBefore, userMoveUci) ?? userMoveUci;
  const bestSan = bestMoveUci ? (parseUciToSan(fenBefore, bestMoveUci) ?? bestMoveUci) : null;
  const fenAfterUser = fenAfterMove(fenBefore, userMoveUci);
  const fenAfterBest = bestMoveUci ? fenAfterMove(fenBefore, bestMoveUci) : null;

  // ── Coaching Intelligence ──
  let coachingCtx: CoachingContext | null = null;
  try {
    const before = new Chess(fenBefore);
    const moverColor = before.turn();
    const userFunc = classifyMoveFunction(before, userMoveUci, userSan, fenAfterUser);
    const violations = detectPrincipleViolations(
      before, fenAfterUser, userMoveUci, userSan, bestMoveUci, cpLoss, userFunc
    );
    const profile = profilePosition(before, evalBefore, moverColor);
    const contrastInsight = generateContrastInsight(
      before, userMoveUci, userFunc, bestMoveUci, bestSan, fenAfterBest, cpLoss
    );
    coachingCtx = { userFunc, violations, profile, contrastInsight };
  } catch {}

  // === ANALYZE YOUR PLAYED MOVE ===
  const playedThemes = fenAfterUser
    ? detectTacticalThemes(fenBefore, userSan, userMoveUci, fenAfterUser, true, cpLoss, bestMoveUci ?? undefined)
    : [];

  const playedExplanation = buildPlayedMoveExplanation(
    fenBefore,
    fenAfterUser,
    userSan,
    userMoveUci,
    cpLoss,
    evalBefore,
    evalAfter,
    playedThemes,
    coachingCtx,
  );

  // === ANALYZE THE BEST MOVE ===
  const bestThemes = (fenAfterBest && bestMoveUci)
    ? detectTacticalThemes(fenBefore, bestSan!, bestMoveUci, fenAfterBest, false, 0)
    : [];

  const bestExplanation = buildBestMoveExplanation(
    fenBefore,
    fenAfterBest,
    bestSan,
    bestMoveUci,
    evalBefore,
    bestThemes,
    coachingCtx,
  );

  return { played: playedExplanation, best: bestExplanation };
}

type CoachingContext = {
  userFunc: MoveFunction;
  violations: PrincipleViolation[];
  profile: PositionProfile;
  contrastInsight: string | null;
};

/* ── Build explanation for the played (bad) move ── */

function buildPlayedMoveExplanation(
  fenBefore: string,
  fenAfterUser: string | null,
  userSan: string,
  userUci: string,
  cpLoss: number,
  evalBefore: number,
  evalAfter: number,
  themes: TacticalTheme[],
  ctx: CoachingContext | null,
): PositionExplanation {
  const observations: string[] = [];
  const themeNames: string[] = themes.map(t => t.name);

  let headline = "";
  const cpLossPawns = (cpLoss / 100).toFixed(1);

  // Check for dramatic opponent-threat themes to make headline more specific
  const forkTheme = themes.find(t => t.name === "Walks Into Fork");
  const pinTheme = themes.find(t => t.name === "Walks Into Pin");
  const mateTheme = themes.find(t => t.name === "Back-Rank Mate Threat");
  const hangTheme = themes.find(t => t.name === "Hangs Material");

  if (mateTheme) {
    headline = `Blunder — allows back-rank mate`;
  } else if (forkTheme) {
    headline = cpLoss >= 300
      ? `Blunder — walks into a fork, losing ${cpLossPawns} pawns`
      : `Mistake — walks into a fork, losing ${cpLossPawns} pawns`;
  } else if (hangTheme && cpLoss >= 200) {
    headline = `Blunder — hangs material, losing ${cpLossPawns} pawns`;
  } else if (pinTheme && cpLoss >= 200) {
    headline = cpLoss >= 300
      ? `Blunder — walks into a pin, losing ${cpLossPawns} pawns`
      : `Mistake — walks into a pin, losing ${cpLossPawns} pawns`;
  } else if (cpLoss >= 300) {
    headline = `Blunder — loses ${cpLossPawns} pawns of eval`;
  } else if (cpLoss >= 150) {
    headline = `Mistake — loses ${cpLossPawns} pawns of eval`;
  } else {
    headline = `Inaccuracy — loses ${cpLossPawns} pawns of eval`;
  }

  const sentences: string[] = [];

  try {
    const before = new Chess(fenBefore);
    const moverColor = before.turn();
    const moverName = colorName(moverColor);

    // What happened with the move?
    const fromSq = userUci.slice(0, 2) as Square;
    const toSq = userUci.slice(2, 4) as Square;
    const movedPiece = pieceAt(before, fromSq);
    const capturedPiece = pieceAt(before, toSq);

    // Core description
    if (movedPiece) {
      const pName = pieceName(movedPiece.type, true);
      if (capturedPiece) {
        sentences.push(
          `You played **${userSan}**, capturing the ${pieceName(capturedPiece.type)} on ${toSq} with your ${pieceName(movedPiece.type)}.`
        );
      } else {
        sentences.push(`You played **${userSan}**, moving your ${pieceName(movedPiece.type)} from ${fromSq} to ${toSq}.`);
      }
    }

    if (fenAfterUser) {
      const after = new Chess(fenAfterUser);

      // Tactical problems caused by the move
      for (const t of themes) {
        observations.push(`**${t.name}**: ${t.description}`);
      }

      // Positional damage
      const devBefore = countDeveloped(before, moverColor);
      const devAfter = countDeveloped(after, moverColor);

      // Did we move an already developed piece back?
      if (movedPiece && movedPiece.type !== "p" && movedPiece.type !== "k") {
        const backRank = moverColor === "w" ? "1" : "8";
        if (toSq[1] === backRank && fromSq[1] !== backRank) {
          sentences.push("This retreats an active piece back to the first rank, losing tempo.");
          themeNames.push("Piece Retreat");
        }
      }

      // Did it abandon the center?
      if (movedPiece?.type === "p" && CENTER_SQUARES.has(fromSq) && !CENTER_SQUARES.has(toSq)) {
        sentences.push("This gives up central control by moving a pawn out of the center.");
        themeNames.push("Center Abandonment");
      }

      // King safety impact
      const kSafetyBefore = kingSafetyScore(before, moverColor);
      const kSafetyAfter = kingSafetyScore(after, moverColor);
      if (kSafetyAfter.score < kSafetyBefore.score - 15) {
        const newIssues = kSafetyAfter.issues.filter(i => !kSafetyBefore.issues.includes(i));
        if (newIssues.length > 0) {
          sentences.push(`This weakens your king safety: ${newIssues.join("; ")}.`);
          themeNames.push("King Safety");
        }
      }

      // Pawn structure damage
      const pawnsBefore = pawnStructure(before, moverColor);
      const pawnsAfter = pawnStructure(after, moverColor);
      const newPawnIssues = pawnsAfter.issues.filter(i => !pawnsBefore.issues.includes(i));
      if (newPawnIssues.length > 0) {
        sentences.push(`This creates pawn weaknesses: ${newPawnIssues.join("; ")}.`);
        themeNames.push("Pawn Structure");
      }

      // Piece activity damage
      const actAfter = pieceActivity(after, oppColor(moverColor));
      if (actAfter.active.length > 0) {
        observations.push(actAfter.active[0]);
      }

      // Material balance change
      const matBefore = materialBalance(before);
      const matAfter = materialBalance(after);
      const matDirection = moverColor === "w" ? 1 : -1;
      const matChange = (matAfter - matBefore) * matDirection;
      if (matChange < -2) {
        sentences.push(`This loses material (${describeMaterialDiff(after, moverColor)}).`);
        themeNames.push("Material Loss");
      }

      // Consequence sentences for opponent threats (more natural language)
      const forkT = themes.find(t => t.name === "Walks Into Fork");
      const pinT = themes.find(t => t.name === "Walks Into Pin");
      const mateT = themes.find(t => t.name === "Back-Rank Mate Threat");
      const hangT = themes.find(t => t.name === "Hangs Material");

      if (mateT) {
        sentences.push("This allows a devastating back-rank checkmate — the king is trapped behind its own pawns with no escape.");
      } else if (forkT) {
        sentences.push("This walks directly into a fork, allowing the opponent to attack two pieces simultaneously and win material.");
      } else if (hangT) {
        sentences.push("This leaves a piece unprotected, allowing the opponent to capture it for free.");
      } else if (pinT) {
        sentences.push("This allows the opponent to pin one of your pieces, restricting your options and likely winning material.");
      }
    }

    // Eval context
    if (evalBefore >= 200 && evalAfter < 50) {
      sentences.push("You had a winning advantage but this move throws it away, returning the position to roughly equal.");
      themeNames.push("Squandered Advantage");
    } else if (evalBefore >= 0 && evalAfter < -200) {
      sentences.push("This move turns a balanced position into a clearly losing one.");
      themeNames.push("Decisive Error");
    } else if (evalAfter < -500) {
      sentences.push("After this move the position is almost certainly lost.");
    }

  } catch {
    sentences.push(`You played **${userSan}**, losing approximately ${cpLossPawns} pawns of evaluation.`);
  }

  // ── Coaching Intelligence enrichment ──
  if (ctx) {
    // Principle violations → highly instructive
    for (const v of ctx.violations.slice(0, 2)) {
      observations.push(`⚠️ **${v.principle}**: ${v.explanation}`);
      themeNames.push(v.principle);
    }

    // Contrast insight → explains WHY the best move was better
    if (ctx.contrastInsight) {
      observations.push(ctx.contrastInsight);
    }

    // Actionable takeaway → lesson to remember
    const takeaway = generateCoachingTakeaway(ctx.profile, ctx.violations, themes, cpLoss);
    observations.push(takeaway);
  }

  return {
    headline,
    coaching: sentences.join(" "),
    themes: [...new Set(themeNames)],
    observations,
  };
}

/* ── Build explanation for the best (engine) move ── */

function buildBestMoveExplanation(
  fenBefore: string,
  fenAfterBest: string | null,
  bestSan: string | null,
  bestUci: string | null,
  evalBefore: number,
  themes: TacticalTheme[],
  ctx: CoachingContext | null,
): PositionExplanation {
  if (!bestSan || !bestUci) {
    return {
      headline: "No alternative found",
      coaching: "The engine did not suggest an alternative move for this position.",
      themes: [],
      observations: [],
    };
  }

  const observations: string[] = [];
  const themeNames: string[] = themes.map(t => t.name);
  const sentences: string[] = [];

  try {
    const before = new Chess(fenBefore);
    const moverColor = before.turn();
    const moverName = colorName(moverColor);

    const fromSq = bestUci.slice(0, 2) as Square;
    const toSq = bestUci.slice(2, 4) as Square;
    const movedPiece = pieceAt(before, fromSq);
    const capturedPiece = pieceAt(before, toSq);

    // Core description
    if (movedPiece) {
      if (capturedPiece) {
        sentences.push(
          `The best move is **${bestSan}**, capturing the ${pieceName(capturedPiece.type)} on ${toSq} with the ${pieceName(movedPiece.type)}.`
        );
      } else if (bestSan.startsWith("O-O")) {
        sentences.push(`The best move is **${bestSan}**, castling to bring the king to safety and activate the rook.`);
        themeNames.push("Castling");
      } else {
        sentences.push(`The best move is **${bestSan}**, placing the ${pieceName(movedPiece.type)} on ${toSq}.`);
      }
    } else {
      sentences.push(`The best move is **${bestSan}**.`);
    }

    // Tactical achievements
    for (const t of themes) {
      observations.push(`**${t.name}**: ${t.description}`);
    }

    if (fenAfterBest) {
      const after = new Chess(fenAfterBest);

      // Development improvement
      const devBefore = countDeveloped(before, moverColor);
      const devAfter = countDeveloped(after, moverColor);
      if (devAfter.developed > devBefore.developed) {
        const remaining = devAfter.total - devAfter.developed;
        sentences.push(`This develops a piece (${devAfter.developed}/${devAfter.total} developed${remaining > 0 ? `, ${remaining} still to go` : ""}).`);
        themeNames.push("Development");
      }

      // Center control improvement
      const ccBefore = centerControl(before, moverColor);
      const ccAfter = centerControl(after, moverColor);
      if (ccAfter.pawnsInCenter > ccBefore.pawnsInCenter) {
        sentences.push("This strengthens control of the center with a pawn.");
        themeNames.push("Center Control");
      }

      // King safety improvement
      if (bestSan.startsWith("O-O")) {
        themeNames.push("King Safety");
      } else {
        const ksBefore = kingSafetyScore(before, moverColor);
        const ksAfter = kingSafetyScore(after, moverColor);
        if (ksAfter.score > ksBefore.score + 10) {
          sentences.push("This improves king safety.");
          themeNames.push("King Safety");
        }
      }

      // Creates threats
      if (after.isCheck()) {
        sentences.push("This gives check, gaining the initiative.");
        themeNames.push("Initiative");
      }

      // Opens files for rooks
      if (movedPiece?.type === "p") {
        const filesBefore = openFiles(before, moverColor);
        const filesAfter = openFiles(after, moverColor);
        const newOpen = filesAfter.open.filter(f => !filesBefore.open.includes(f));
        const newSemiOpen = filesAfter.semiOpen.filter(f => !filesBefore.semiOpen.includes(f));
        if (newOpen.length > 0) {
          const hasRookOnFile = getAllPieces(after).some(p =>
            p.type === "r" && p.color === moverColor && newOpen.some(f => f[0] === FILES[fileIdx(p.square)])
          );
          if (hasRookOnFile) {
            sentences.push(`This opens the ${newOpen[0]} for your rook.`);
            themeNames.push("Open File");
          }
        }
      }

      // Bishop pair advantage
      if (hasBishopPair(after, moverColor) && !hasBishopPair(after, oppColor(moverColor))) {
        observations.push("You maintain the bishop pair, which is a long-term advantage in open positions");
        themeNames.push("Bishop Pair");
      }

      // Captures: material gain explanation
      if (capturedPiece && movedPiece) {
        const gain = PIECE_VALUES[capturedPiece.type] - (0); // we're not losing the piece if not recaptured
        if (gain >= 3) {
          sentences.push(`This wins the ${pieceName(capturedPiece.type)} (worth ${PIECE_VALUES[capturedPiece.type]} points).`);
          themeNames.push("Material Gain");
        } else if (capturedPiece.type !== "p") {
          sentences.push(`This wins the ${pieceName(capturedPiece.type)}.`);
          themeNames.push("Material Gain");
        }
      }

      // Pins created
      const pinsCreated = detectPins(after, oppColor(moverColor));
      if (pinsCreated.length > 0) {
        const pin = pinsCreated[0];
        observations.push(`Creates a pin: ${pieceName(pin.pinner.type, true)} on ${pin.pinner.square} pins the ${pieceName(pin.pinned.type)} on ${pin.pinned.square}`);
        if (!themeNames.includes("Pin")) themeNames.push("Pin");
      }

      // Pawn structure improvements
      const pawnsAfter = pawnStructure(after, moverColor);
      if (pawnsAfter.assets.length > 0) {
        for (const asset of pawnsAfter.assets.slice(0, 1)) {
          observations.push(asset);
        }
      }

      // Eval context
      if (evalBefore < -100) {
        sentences.push("This is the best way to defend a difficult position and minimise the damage.");
        themeNames.push("Defense");
      } else if (evalBefore > 300) {
        sentences.push("This continues to press the advantage and convert the winning position.");
        themeNames.push("Converting");
      }
    }
  } catch {
    sentences.push(`The engine recommends **${bestSan}** to maintain the best position.`);
  }

  // ── Coaching Intelligence: explain the thought process for finding this move ──
  if (ctx && bestUci) {
    try {
      const before = new Chess(fenBefore);
      const bestFunc = classifyMoveFunction(before, bestUci, bestSan!, fenAfterBest);

      // Thought-process guidance
      if (bestFunc === "attacking") {
        observations.push("🧠 **How to find this**: Look for forcing moves first — checks, captures, and threats that demand an immediate response.");
      } else if (bestFunc === "developing") {
        observations.push("🧠 **How to find this**: Ask yourself \"which piece is doing the least?\" and find the most active square for it.");
      } else if (bestFunc === "castling") {
        observations.push("🧠 **How to find this**: When in doubt, consider castling. King safety is almost always the top priority before starting middlegame plans.");
      } else if (bestFunc === "defending") {
        observations.push("🧠 **How to find this**: Before continuing your own plan, always check — does my opponent have a serious threat? If so, deal with it first.");
      } else if (bestFunc === "prophylactic") {
        observations.push("🧠 **How to find this**: Think about your opponent's ideal move, then prevent it. This prophylactic thinking is a hallmark of strong players.");
      } else if (bestFunc === "repositioning") {
        observations.push("🧠 **How to find this**: When there are no immediate tactics, improve your worst-placed piece. Find the piece with the fewest squares and reroute it.");
      }

      // Position-type context
      if (ctx.profile.structure === "closed" && bestFunc !== "pawn-advance") {
        observations.push("📋 In closed positions, manoeuvring is key — slowly improve your pieces to optimal squares before looking for pawn breaks.");
      } else if (ctx.profile.structure === "open" && bestFunc === "developing") {
        observations.push("📋 In open positions, piece activity is everything. Get your pieces to active squares quickly — the first player to mobilise usually gets the initiative.");
      }
    } catch {}
  }

  // Build headline
  let headline = "";
  if (themeNames.length > 0) {
    headline = themeNames.slice(0, 3).join(" · ");
  } else {
    headline = "Engine recommendation";
  }

  return {
    headline,
    coaching: sentences.join(" "),
    themes: [...new Set(themeNames)],
    observations,
  };
}

/* ────────────── Convenience: explain a leak for the UI ────────────── */

export function explainOpeningLeak(
  fenBefore: string,
  userMoveUci: string,
  bestMoveUci: string | null,
  cpLoss: number,
  evalBefore: number,
  evalAfter: number,
): MoveExplanation {
  return explainMoves(fenBefore, userMoveUci, bestMoveUci, cpLoss, evalBefore, evalAfter);
}

/* ────────────── Final Position / Resulting Position Outlook ────────────── */

/**
 * Analyze the position at the END of a principal variation line and produce
 * a human-readable coaching paragraph explaining what the resulting position
 * looks like and what it could lead to.
 *
 * `perspective` is the color of the user ("w" or "b").
 * `evalCp` is the engine eval of this FEN (from the side-to-move perspective).
 */
export function describeEndPosition(
  fen: string,
  perspective: Color,
  evalCp?: number | null,
): { summary: string; details: string[] } {
  const details: string[] = [];
  let summary = "";

  try {
    const chess = new Chess(fen);
    const perspName = perspective === "w" ? "White" : "Black";
    const oppPersp = oppColor(perspective);

    // ── Terminal states ──
    if (chess.isCheckmate()) {
      const loser = colorName(chess.turn());
      summary = `The line ends in **checkmate** — ${loser} is mated.`;
      return { summary, details };
    }
    if (chess.isStalemate()) {
      summary = "The line ends in **stalemate** — the game would be drawn.";
      return { summary, details };
    }
    if (chess.isDraw()) {
      summary = "The line ends in a **drawn position** (insufficient material or repetition).";
      return { summary, details };
    }

    // ── Eval assessment ──
    if (typeof evalCp === "number") {
      // Convert to user's perspective
      const userEval = chess.turn() === perspective ? evalCp : -evalCp;
      const evalPawns = (userEval / 100).toFixed(1);
      if (userEval > 500) {
        details.push(`Eval **+${evalPawns}** — ${perspName} has a **winning advantage**`);
      } else if (userEval > 200) {
        details.push(`Eval **+${evalPawns}** — ${perspName} has a **clear advantage**`);
      } else if (userEval > 50) {
        details.push(`Eval **+${evalPawns}** — ${perspName} has a **slight edge**`);
      } else if (userEval > -50) {
        details.push("The position is **roughly equal**");
      } else if (userEval > -200) {
        details.push(`Eval **${evalPawns}** — ${perspName} is **slightly worse**`);
      } else if (userEval > -500) {
        details.push(`Eval **${evalPawns}** — ${perspName} is **clearly worse**`);
      } else {
        details.push(`Eval **${evalPawns}** — ${perspName} is in a **losing position**`);
      }
    }

    // ── Material ──
    const matDesc = describeMaterialDiff(chess, perspective);
    if (matDesc !== "equal material") {
      details.push(`Material: ${matDesc}`);
    }

    // ── King safety ──
    const userKs = kingSafetyScore(chess, perspective);
    const oppKs = kingSafetyScore(chess, oppPersp);
    if (userKs.issues.length > 0 && userKs.score < 70) {
      details.push(`${perspName}'s king safety concerns: ${userKs.issues.slice(0, 2).join("; ")}`);
    }
    if (oppKs.issues.length > 0 && oppKs.score < 60) {
      details.push(`Opponent's king is exposed: ${oppKs.issues.slice(0, 2).join("; ")}`);
    }

    // ── Pawn structure ──
    const userPawns = pawnStructure(chess, perspective);
    const oppPawns = pawnStructure(chess, oppPersp);
    if (userPawns.assets.length > 0) {
      details.push(`${perspName} has ${userPawns.assets.slice(0, 2).join(", ")}`);
    }
    if (userPawns.issues.length > 0) {
      details.push(`${perspName} has pawn weaknesses: ${userPawns.issues.slice(0, 2).join(", ")}`);
    }
    if (oppPawns.issues.length > 0) {
      details.push(`Opponent has pawn weaknesses: ${oppPawns.issues.slice(0, 2).join(", ")}`);
    }

    // ── Piece activity ──
    const activity = pieceActivity(chess, chess.turn() === perspective ? perspective : perspective);
    if (activity.active.length > 0) details.push(activity.active[0]);
    if (activity.passive.length > 0) details.push(activity.passive[0]);

    // ── Open files ──
    const files = openFiles(chess, perspective);
    if (files.open.length > 0) {
      const rooksOnOpen = getAllPieces(chess).filter(p =>
        p.type === "r" && p.color === perspective &&
        files.open.some(f => f[0] === p.square[0])
      );
      if (rooksOnOpen.length > 0) {
        details.push(`Rook is well placed on the open ${files.open[0]}`);
      }
    }

    // ── Bishop pair ──
    if (hasBishopPair(chess, perspective) && !hasBishopPair(chess, oppPersp)) {
      details.push(`${perspName} has the bishop pair — a long-term advantage`);
    }

    // ── Pins ──
    const pinsOnOpp = detectPins(chess, oppPersp);
    if (pinsOnOpp.length > 0) {
      const pin = pinsOnOpp[0];
      details.push(`${pieceName(pin.pinned.type, true)} on ${pin.pinned.square} is pinned to the ${pieceName(pin.target.type)} — restricting opponent's options`);
    }

    // ── Development ──
    const allPieces = getAllPieces(chess).length;
    if (allPieces > 20) {
      // Middlegame — development matters
      const dev = countDeveloped(chess, perspective);
      if (dev.total > 0 && dev.developed < dev.total) {
        details.push(`${perspName} still has ${dev.total - dev.developed} piece${dev.total - dev.developed > 1 ? "s" : ""} to develop`);
      }
    }

    // ── Threats / what could happen next ──
    // Check for immediate mate threats
    if (chess.turn() !== perspective) {
      // It's the opponent's turn; see if the user has serious threats
      // by checking if the opponent has limited safe moves
      const oppMoves = chess.moves({ verbose: true });
      if (oppMoves.length <= 3 && !chess.isCheck()) {
        details.push("Opponent has very few moves — near-zugzwang might be possible");
      }
    }

    // ── Build summary ──
    if (details.length === 0) {
      summary = "The resulting position is roughly balanced with chances for both sides.";
    } else {
      // Summarize from the eval perspective
      if (typeof evalCp === "number") {
        const userEval = chess.turn() === perspective ? evalCp : -evalCp;
        if (userEval > 200) {
          summary = `After this line plays out, **${perspName} emerges with a clear advantage**.`;
        } else if (userEval > 50) {
          summary = `The resulting position gives **${perspName} a slight edge** to work with.`;
        } else if (userEval > -50) {
          summary = `The line leads to a **balanced position** where both sides have chances.`;
        } else if (userEval > -200) {
          summary = `The resulting position is **slightly uncomfortable for ${perspName}** — precision is needed.`;
        } else {
          summary = `After this line, **${perspName} faces a difficult position** and must fight for survival.`;
        }
      } else {
        summary = `Here is what the resulting position looks like:`;
      }
    }
  } catch {
    summary = "Could not analyze the resulting position.";
  }

  return { summary, details };
}
