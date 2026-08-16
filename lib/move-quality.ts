import { Chess, type PieceSymbol } from "chess.js";

export type MoveClassification =
  | "brilliant"
  | "best"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export const MOVE_CLASSIFICATION_LABELS: Record<MoveClassification, string> = {
  brilliant: "Brilliant",
  best: "Best",
  good: "Good",
  book: "Book",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

export const MOVE_CLASSIFICATION_SHORT_LABELS: Record<
  MoveClassification,
  string
> = {
  brilliant: "!!",
  best: "!",
  good: "✓",
  book: "DB",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

export const MOVE_CLASSIFICATION_EMOJI: Record<MoveClassification, string> = {
  brilliant: "💎",
  best: "✅",
  good: "👍",
  book: "📖",
  inaccuracy: "⚠️",
  mistake: "❌",
  blunder: "💀",
};

export const MOVE_CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant: "text-cyan-300",
  best: "text-emerald-300",
  good: "text-emerald-200/90",
  book: "text-slate-300",
  inaccuracy: "text-amber-300",
  mistake: "text-orange-300",
  blunder: "text-red-300",
};

export const MOVE_CLASSIFICATION_BG: Record<MoveClassification, string> = {
  brilliant: "bg-cyan-500/15",
  best: "bg-emerald-500/15",
  good: "bg-emerald-500/10",
  book: "bg-white/[0.05]",
  inaccuracy: "bg-amber-500/15",
  mistake: "bg-orange-500/15",
  blunder: "bg-red-500/15",
};

export const MOVE_CLASSIFICATION_BORDER: Record<MoveClassification, string> = {
  brilliant: "border-cyan-500/30",
  best: "border-emerald-500/25",
  good: "border-emerald-500/15",
  book: "border-white/[0.08]",
  inaccuracy: "border-amber-500/25",
  mistake: "border-orange-500/25",
  blunder: "border-red-500/30",
};

export const MOVE_CLASSIFICATION_BADGE_FILL: Record<
  MoveClassification,
  string
> = {
  brilliant: "#06b6d4",
  best: "#10b981",
  good: "#34d399",
  book: "#94a3b8",
  inaccuracy: "#f59e0b",
  mistake: "#f97316",
  blunder: "#ef4444",
};

type MovePieceDetails = {
  san: string;
  piece: PieceSymbol;
  captured?: PieceSymbol;
  moveLosesMaterial: boolean;
  canBeTakenBack: boolean;
};

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function normalizeUci(move: string | null): {
  from: string;
  to: string;
  promotion?: PieceSymbol;
} | null {
  if (!move || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
    return null;
  }

  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: (move.slice(4, 5) || undefined) as PieceSymbol | undefined,
  };
}

function countAttackers(fen: string, targetSquare: string, color: "w" | "b") {
  const fenParts = fen.split(" ");
  if (fenParts.length < 2) return 0;
  fenParts[1] = color;

  try {
    const chess = new Chess(fenParts.join(" "));
    return chess
      .moves({ verbose: true })
      .filter((move) => move.to === targetSquare).length;
  } catch {
    return 0;
  }
}

function getMovePieceDetails(
  fenBefore: string,
  moveUci: string | null,
): MovePieceDetails | null {
  const parsed = normalizeUci(moveUci);
  if (!parsed) return null;

  try {
    const beforeChess = new Chess(fenBefore);
    const movingPiece = beforeChess.get(
      parsed.from as Parameters<Chess["get"]>[0],
    );
    if (!movingPiece) return null;

    const move = beforeChess.move({
      from: parsed.from,
      to: parsed.to,
      promotion: parsed.promotion,
    });
    if (!move) return null;

    const movedValue = PIECE_VALUES[move.piece];
    const capturedValue = move.captured ? PIECE_VALUES[move.captured] : 0;
    const moveLosesMaterial = movedValue - capturedValue >= 2;
    const canBeTakenBack =
      countAttackers(
        beforeChess.fen(),
        move.to,
        move.color === "w" ? "b" : "w",
      ) > 0 && countAttackers(beforeChess.fen(), move.to, move.color) === 0;

    return {
      san: move.san,
      piece: move.piece,
      captured: move.captured,
      moveLosesMaterial,
      canBeTakenBack,
    };
  } catch {
    return null;
  }
}

/**
 * Count attackers on a square using pseudo-legal geometry (including pinned
 * pieces and kings). chess.js `.moves()` only returns legal moves, which
 * misses attackers that can't actually capture — pinned pieces, and kings
 * that would move into check. For sacrifice detection we need "can this
 * piece theoretically take?" not "is this capture legal right now?"
 */

/** Check if a piece geometrically attacks a square (ignoring pins/checks). */
function pieceAttacksSquare(
  pieceType: PieceSymbol,
  fromSquare: string,
  toSquare: string,
  board: ({ type: PieceSymbol; color: "w" | "b"; square: string } | null)[][],
): boolean {
  const fromFile = fromSquare.charCodeAt(0) - 97;
  const fromRank = 8 - parseInt(fromSquare[1]);
  const toFile = toSquare.charCodeAt(0) - 97;
  const toRank = 8 - parseInt(toSquare[1]);
  const df = Math.abs(toFile - fromFile);
  const dr = Math.abs(toRank - fromRank);

  switch (pieceType) {
    case "p": {
      // Pawns attack diagonally
      return df === 1 && dr === 1;
    }
    case "n": {
      return (df === 2 && dr === 1) || (df === 1 && dr === 2);
    }
    case "b": {
      if (df !== dr || df === 0) return false;
      return isPathClear(fromFile, fromRank, toFile, toRank, board);
    }
    case "r": {
      if ((df !== 0 && dr !== 0) || (df === 0 && dr === 0)) return false;
      return isPathClear(fromFile, fromRank, toFile, toRank, board);
    }
    case "q": {
      if (df !== dr && df !== 0 && dr !== 0) return false;
      if (df === 0 && dr === 0) return false;
      return isPathClear(fromFile, fromRank, toFile, toRank, board);
    }
    case "k": {
      return df <= 1 && dr <= 1 && (df + dr) > 0;
    }
    default:
      return false;
  }
}

/** Check if the path between two squares is clear of other pieces. */
function isPathClear(
  fromFile: number,
  fromRank: number,
  toFile: number,
  toRank: number,
  board: ({ type: PieceSymbol; color: "w" | "b"; square: string } | null)[][],
): boolean {
  const stepF = Math.sign(toFile - fromFile);
  const stepR = Math.sign(toRank - fromRank);
  let f = fromFile + stepF;
  let r = fromRank + stepR;
  while (f !== toFile || r !== toRank) {
    if (board[r]?.[f]) return false;
    f += stepF;
    r += stepR;
  }
  return true;
}

/**
 * A sacrifice is detected when:
 * 1. A non-pawn piece moves to a square where it gives up more material than it captures
 * 2. The opponent has at least one CHEAPER piece that geometrically attacks that square
 *    (including pinned pieces and king-adjacent squares that chess.js considers illegal)
 * 3. 1-ply lookahead: the recapture is not a hidden trap where the original mover
 *    immediately wins back more material
 *
 * This avoids false positives like Qc8+ (queen to empty square giving check where
 * nobody can actually take it), and "relative pin" traps where appearing to give
 * a piece away actually wins material back immediately.
 *
 * Key difference from naive approach: we count pseudo-legal attackers (pinned pieces,
 * kings that would be in check) because a sacrifice is about the MATERIAL OFFER, not
 * about whether the opponent can legally accept it right now. The Greek Gift Bxh7+
 * is a sacrifice even when Kxh7 is illegal due to Ng5 covering h7.
 */
function isSacrificialMove(fenBefore: string, moveUci: string | null): boolean {
  const parsed = normalizeUci(moveUci);
  if (!parsed) return false;

  try {
    const g = new Chess(fenBefore);
    const piece = g.get(parsed.from as Parameters<Chess["get"]>[0]);
    if (!piece) return false;

    // Pawns are excluded — pawn brilliancy is evaluated by engine eval, not material loss
    if (piece.type === "p") return false;

    const capturedPiece = g.get(parsed.to as Parameters<Chess["get"]>[0]);
    const movedValue = PIECE_VALUES[piece.type] ?? 0;
    const capturedValue = capturedPiece
      ? (PIECE_VALUES[capturedPiece.type] ?? 0)
      : 0;

    // Moving piece must be worth MORE than what it captures
    if (movedValue <= capturedValue) return false;

    const result = g.move({
      from: parsed.from,
      to: parsed.to,
      promotion: parsed.promotion ?? "q",
    } as any);
    if (!result) return false;

    // A mating move is not a sacrifice — it's just mate. Chess.com classifies
    // these as Best, not Brilliant.
    if (g.isCheckmate()) return false;

    const opponentColor = piece.color === "w" ? "b" : "w";
    const targetSquare = parsed.to;
    const board = g.board();

    // Count ALL geometric attackers on the target square (pseudo-legal:
    // includes pinned pieces that can't legally capture). chess.js legal-move
    // generation hides pinned attackers, so we use pure geometry instead —
    // a sacrifice is about the material OFFER, not about whether the opponent
    // can legally accept it right now.
    let attackerCount = 0;
    let hasCheaperAttacker = false;
    let kingAttacks = false;

    for (const row of board) {
      for (const sq of row) {
        if (!sq || sq.color !== opponentColor) continue;
        if (!pieceAttacksSquare(sq.type, sq.square, targetSquare, board))
          continue;
        if (sq.type === "k") {
          kingAttacks = true;
          continue;
        }
        attackerCount++;
        if ((PIECE_VALUES[sq.type] ?? 0) < movedValue) {
          hasCheaperAttacker = true;
        }
      }
    }

    // A bare king adjacency (no other attackers) is not a real offer — a king
    // next to the sacrificed piece usually means mate or stalemate geometry,
    // not a genuine material investment. BUT: if the king CAN'T legally take
    // (e.g. Greek Gift where Ng5 covers h7), the material IS genuinely offered
    // — accepting loses on the spot.
    if (attackerCount === 0 && !kingAttacks) return false;
    if (!hasCheaperAttacker && attackerCount > 0) return false;

    // 1-ply lookahead: check if the recapture is a hidden trap.
    // If the opponent recaptures, can the original mover immediately win back
    // more material than was sacrificed? If so, it's not a real sacrifice —
    // it's a tactical sequence.
    const legalCaptures = g
      .moves({ verbose: true })
      .filter((m) => m.to === targetSquare);

    // King-only attacker cases:
    if (attackerCount === 0 && kingAttacks) {
      if (legalCaptures.length === 0) {
        // King can't take (Greek Gift pattern) — genuine sacrifice
        return true;
      }
      // King CAN take — let the 1-ply lookahead below decide if it's a trap
    }

    // If there are legal captures, check each one
    for (const cap of legalCaptures) {
      const capValue = PIECE_VALUES[cap.piece] ?? 0;
      const netGainForOpponent = movedValue - capValue;

      const g2 = new Chess(g.fen());
      const capResult = g2.move({
        from: cap.from,
        to: cap.to,
        promotion: "q",
      } as any);
      if (!capResult) continue;

      // Can the original mover immediately win back more than the opponent gained?
      const opponentIsActuallyLosing = g2
        .moves({ verbose: true })
        .some((m2) => {
          if (!m2.captured) return false;
          const winVal = PIECE_VALUES[m2.captured] ?? 0;
          const costVal = PIECE_VALUES[m2.piece] ?? 0;
          return winVal - costVal > netGainForOpponent;
        });

      if (!opponentIsActuallyLosing) {
        // Found a recapture where the opponent doesn't lose material back —
        // this IS a genuine sacrifice
        return true;
      }
    }

    // No legal captures (all attackers are pinned or king can't take).
    // This is the Greek Gift / pinned-sac case: the material is offered but
    // accepting is impossible or catastrophic. This IS a genuine sacrifice.
    if (legalCaptures.length === 0 && attackerCount > 0) {
      return true;
    }

    // All legal recaptures lead to the opponent losing material back —
    // it's a trap, not a sacrifice
    return false;
  } catch {
    return false;
  }
}

/**
 * A brilliant candidate is a genuine piece sacrifice: the moving non-pawn piece
 * gives up more material than it captures, the opponent can immediately recapture
 * with a cheaper piece, and the recapture is not a hidden trap.
 */
export function isBrilliantCandidate(
  fenBefore: string,
  moveUci: string | null,
  engineDepth?: number,
) {
  return isSacrificialMove(fenBefore, moveUci);
}

export function isBookMove(moveIndex: number, cpLoss: number) {
  return moveIndex < 16 && cpLoss <= 12;
}

export function isBrilliantMove(args: {
  fenBefore: string;
  moveUci: string | null;
  cpLoss: number;
  evalBeforeMover: number;
  evalAfterMover: number;
  isBestMove: boolean;
  moveIndex?: number;
  engineDepth?: number;
}) {
  const {
    fenBefore,
    moveUci,
    cpLoss,
    evalBeforeMover,
    evalAfterMover,
    isBestMove,
    moveIndex = 99,
    engineDepth,
  } = args;

  // Must be the best (or nearly best) move
  if (!isBestMove || cpLoss > 10 || isBookMove(moveIndex, cpLoss)) {
    return false;
  }

  // Chess.com: "You should not be completely winning even if you hadn't found the move."
  // If already up +3 pawns, finding a sacrifice isn't special.
  if (evalBeforeMover >= 300) return false;

  // Chess.com: "You should not be in a bad position after a Brilliant move."
  // If the position drops below -1 pawn after the sacrifice, it's not brilliant.
  if (evalAfterMover < -100) return false;

  // Must be a genuine piece sacrifice — pass depth so low-depth scans require
  // actual material loss rather than just "can be taken back" heuristic.
  const isSacrifice = isBrilliantCandidate(fenBefore, moveUci, engineDepth);
  if (!isSacrifice) return false;

  // At lower depths the eval is noisier — require a stronger positional gain
  // to avoid false positives from shallow evaluation errors.
  const evalGain = evalAfterMover - evalBeforeMover;
  const isLowDepth = engineDepth !== undefined && engineDepth <= 12;
  if (isLowDepth) {
    // Low depth: require a convincing swing AND a clear advantage after
    return evalGain >= 150 && evalAfterMover >= 250;
  }
  return evalGain >= 80 || evalAfterMover >= 150;
}

export function classifyMoveQuality(args: {
  cpLoss: number;
  isBestMove: boolean;
  evalBeforeMover: number;
  evalAfterMover: number;
  fenBefore: string;
  moveUci: string | null;
  moveIndex?: number;
}): MoveClassification {
  const {
    cpLoss,
    isBestMove,
    evalBeforeMover,
    evalAfterMover,
    fenBefore,
    moveUci,
    moveIndex = 99,
  } = args;

  if (isBookMove(moveIndex, cpLoss)) return "book";

  if (
    isBrilliantMove({
      fenBefore,
      moveUci,
      cpLoss,
      evalBeforeMover,
      evalAfterMover,
      isBestMove,
      moveIndex,
      // classifyMoveQuality doesn't have depth context; caller should use
      // isBrilliantMove directly with engineDepth for depth-aware checks.
    })
  ) {
    return "brilliant";
  }

  if (isBestMove) return "best";

  const stillWinning = evalAfterMover >= 400;
  const wasWinning = evalBeforeMover >= 400;

  if (wasWinning && stillWinning) {
    if (cpLoss <= 50) return "good";
    if (cpLoss <= 200) return "inaccuracy";
    return "mistake";
  }

  if (wasWinning && evalAfterMover >= 200) {
    if (cpLoss <= 35) return "good";
    if (cpLoss <= 120) return "inaccuracy";
    if (cpLoss <= 300) return "mistake";
    return "blunder";
  }

  if (cpLoss <= 25) return "good";
  if (cpLoss <= 75) return "inaccuracy";
  if (cpLoss <= 200) return "mistake";
  return "blunder";
}

export function buildMoveQualityCommentary(args: {
  classification: MoveClassification;
  cpLoss: number;
  evalBefore: number;
  evalAfter: number;
  bestMoveSan?: string | null;
}) {
  const swing = ((args.evalAfter - args.evalBefore) / 100).toFixed(1);

  switch (args.classification) {
    case "brilliant":
      return "A best-move sacrifice or tactical shot that changes the character of the position.";
    case "best":
      return "You matched the engine's top choice here.";
    case "good":
      return "A solid move that kept the position under control.";
    case "book":
      return "Still inside book-level territory, so the engine treats this as theory-friendly.";
    case "inaccuracy":
      return `A small slip that cost about ${(args.cpLoss / 100).toFixed(1)} pawns (${swing.startsWith("-") ? swing : `+${swing}`} swing).`;
    case "mistake":
      return `A real miss that dropped about ${(args.cpLoss / 100).toFixed(1)} pawns${args.bestMoveSan ? `; ${args.bestMoveSan} was cleaner.` : "."}`;
    case "blunder":
      return `A heavy error that changed the evaluation by roughly ${(args.cpLoss / 100).toFixed(1)} pawns${args.bestMoveSan ? `; ${args.bestMoveSan} was the save.` : "."}`;
  }
}
