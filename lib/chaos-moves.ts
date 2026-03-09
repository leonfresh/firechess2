/**
 * Chaos Chess — Move Engine
 *
 * Generates extra legal moves based on active modifiers and executes
 * them by directly manipulating the chess.js board state (put/remove).
 *
 * chess.js only enforces standard rules, so we layer custom moves on
 * top: the UI shows them as additional legal-move highlights, and when
 * the player picks one we apply it via board manipulation then feed the
 * resulting FEN back into a fresh Chess instance.
 */

import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import type { ChaosModifier } from "./chaos-chess";

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export type ChaosMove = {
  from: Square;
  to: Square;
  /** What kind of extra move this is */
  type: "move" | "capture" | "spawn";
  /** Which modifier enables this move */
  modifierId: string;
  /** Human-readable label for the tooltip */
  label: string;
  /** Squares to additionally clear after the move (e.g. collateral/nuclear) */
  sideEffects?: Square[];
  /** Piece to place at `to` (for spawn moves where the source piece doesn't move) */
  spawnPiece?: { type: PieceSymbol; color: Color };
  /** If true the piece at `from` stays (sniper / spawn) */
  pieceStays?: boolean;
  /** If true, the player should choose the promotion piece before execution */
  promotionChoice?: boolean;
};

/* ================================================================== */
/*  Board helpers                                                       */
/* ================================================================== */

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

function sq(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${FILES[file]}${RANKS[rank]}` as Square;
}

function sqToCoords(s: Square): [number, number] {
  return [FILES.indexOf(s[0] as typeof FILES[number]), RANKS.indexOf(s[1] as typeof RANKS[number])];
}

function isEnemy(game: Chess, square: Square, color: Color): boolean {
  const p = game.get(square);
  return !!p && p.color !== color;
}

function isEmpty(game: Chess, square: Square): boolean {
  return !game.get(square);
}

function isFriendly(game: Chess, square: Square, color: Color): boolean {
  const p = game.get(square);
  return !!p && p.color === color;
}

function allSquaresOf(game: Chess, pieceType: PieceSymbol, color: Color): Square[] {
  const result: Square[] = [];
  for (const f of FILES) {
    for (const r of RANKS) {
      const s = `${f}${r}` as Square;
      const p = game.get(s);
      if (p && p.type === pieceType && p.color === color) result.push(s);
    }
  }
  return result;
}

function emptySquaresInRanks(game: Chess, rankRange: number[]): Square[] {
  const result: Square[] = [];
  for (const f of FILES) {
    for (const ri of rankRange) {
      const s = sq(FILES.indexOf(f), ri);
      if (s && isEmpty(game, s)) result.push(s);
    }
  }
  return result;
}

/** Check if moving a piece would leave our king in check */
function wouldLeaveKingInCheck(
  game: Chess,
  from: Square,
  to: Square,
  color: Color,
  sideEffects?: Square[],
  pieceStays?: boolean,
): boolean {
  // Build a temporary position
  const piece = game.get(from);
  if (!piece) return true;

  const fen = game.fen();
  const tmp = new Chess(fen);

  if (!pieceStays) tmp.remove(from);
  tmp.remove(to);
  tmp.put({ type: piece.type, color: piece.color }, to);

  if (sideEffects) {
    for (const s of sideEffects) {
      tmp.remove(s);
    }
  }

  // Check if our king is attacked
  const kingSquares = allSquaresOf(tmp, "k", color);
  if (kingSquares.length === 0) return true; // shouldn't happen

  return tmp.isAttacked(kingSquares[0], color === "w" ? "b" : "w");
}

/* ================================================================== */
/*  Move generators per modifier                                        */
/* ================================================================== */

type MoveGen = (game: Chess, color: Color, modifiers: ChaosModifier[]) => ChaosMove[];

/** Pawns can move 2 from any rank */
function genPawnCharge(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const dir = color === "w" ? 1 : -1;
  const pawns = allSquaresOf(game, "p", color);

  for (const ps of pawns) {
    const [f, r] = sqToCoords(ps);
    // Already on start rank → chess.js handles it
    if (color === "w" && r === 1) continue;
    if (color === "b" && r === 6) continue;

    const oneAhead = sq(f, r + dir);
    const twoAhead = sq(f, r + 2 * dir);
    if (!oneAhead || !twoAhead) continue;
    if (!isEmpty(game, oneAhead) || !isEmpty(game, twoAhead)) continue;
    if (wouldLeaveKingInCheck(game, ps, twoAhead, color)) continue;

    moves.push({
      from: ps, to: twoAhead, type: "move",
      modifierId: "pawn-charge", label: "Pawn Charge (2 forward)",
    });
  }
  return moves;
}

/** Pawns can capture straight ahead */
function genPawnBayonet(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const dir = color === "w" ? 1 : -1;
  const pawns = allSquaresOf(game, "p", color);

  for (const ps of pawns) {
    const [f, r] = sqToCoords(ps);
    const target = sq(f, r + dir);
    if (!target) continue;
    if (!isEnemy(game, target, color)) continue;
    if (wouldLeaveKingInCheck(game, ps, target, color)) continue;

    moves.push({
      from: ps, to: target, type: "capture",
      modifierId: "pawn-capture-forward", label: "Bayonet (forward capture)",
    });
  }
  return moves;
}

/** Knights can also move 1 square in any direction */
function genKnightRetreat(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const knights = allSquaresOf(game, "n", color);
  const kingDirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  for (const ns of knights) {
    const [f, r] = sqToCoords(ns);
    for (const [df, dr] of kingDirs) {
      const target = sq(f + df, r + dr);
      if (!target) continue;
      if (isFriendly(game, target, color)) continue;
      // chess.js already allows normal knight moves; skip squares knights can already reach
      if (wouldLeaveKingInCheck(game, ns, target, color)) continue;

      moves.push({
        from: ns, to: target, type: isEnemy(game, target, color) ? "capture" : "move",
        modifierId: "knight-retreat", label: "Tactical Retreat (1-sq move)",
      });
    }
  }
  return moves;
}

/** Bishops can move 1 square orthogonally */
function genBishopSlide(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const bishops = allSquaresOf(game, "b", color);
  const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const bs of bishops) {
    const [f, r] = sqToCoords(bs);
    for (const [df, dr] of orthoDirs) {
      const target = sq(f + df, r + dr);
      if (!target) continue;
      if (isFriendly(game, target, color)) continue;
      if (wouldLeaveKingInCheck(game, bs, target, color)) continue;

      moves.push({
        from: bs, to: target, type: isEnemy(game, target, color) ? "capture" : "move",
        modifierId: "bishop-slide", label: "Bishop Sprint (1-sq ortho)",
      });
    }
  }
  return moves;
}

/** Rooks can move 1 square diagonally */
function genRookCharge(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const rooks = allSquaresOf(game, "r", color);
  const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const rs of rooks) {
    const [f, r] = sqToCoords(rs);
    for (const [df, dr] of diagDirs) {
      const target = sq(f + df, r + dr);
      if (!target) continue;
      if (isFriendly(game, target, color)) continue;
      if (wouldLeaveKingInCheck(game, rs, target, color)) continue;

      moves.push({
        from: rs, to: target, type: isEnemy(game, target, color) ? "capture" : "move",
        modifierId: "rook-charge", label: "Rook Rush (1-sq diagonal)",
      });
    }
  }
  return moves;
}

/** Phantom Rook: rooks can slide through friendly pieces */
function genPhantomRook(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const rooks = allSquaresOf(game, "r", color);
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const rs of rooks) {
    const [f, r] = sqToCoords(rs);
    for (const [df, dr] of dirs) {
      let cf = f + df;
      let cr = r + dr;
      let passedFriendly = false;

      while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
        const target = sq(cf, cr)!;
        const piece = game.get(target);

        if (piece) {
          if (piece.color === color) {
            passedFriendly = true;
            // Continue sliding through
          } else {
            // Enemy piece — can capture if we passed through a friendly
            if (passedFriendly) {
              if (!wouldLeaveKingInCheck(game, rs, target, color)) {
                moves.push({
                  from: rs, to: target, type: "capture",
                  modifierId: "phantom-rook", label: "Phantom Rook (through allies)",
                });
              }
            }
            break; // Can't go past enemies
          }
        } else if (passedFriendly) {
          // Empty square after passing through friendly
          if (!wouldLeaveKingInCheck(game, rs, target, color)) {
            moves.push({
              from: rs, to: target, type: "move",
              modifierId: "phantom-rook", label: "Phantom Rook (through allies)",
            });
          }
        }

        cf += df;
        cr += dr;
      }
    }
  }
  return moves;
}

/** Knook: first knight gains rook movement */
function genKnook(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const knights = allSquaresOf(game, "n", color);
  if (knights.length === 0) return moves;

  const knookSquare = knights[0]; // First knight becomes the Knook
  const [f, r] = sqToCoords(knookSquare);
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [df, dr] of dirs) {
    let cf = f + df;
    let cr = r + dr;
    while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
      const target = sq(cf, cr)!;
      const piece = game.get(target);

      if (piece) {
        if (piece.color !== color) {
          if (!wouldLeaveKingInCheck(game, knookSquare, target, color)) {
            moves.push({
              from: knookSquare, to: target, type: "capture",
              modifierId: "knook", label: "The Knook (rook move)",
            });
          }
        }
        break;
      }

      if (!wouldLeaveKingInCheck(game, knookSquare, target, color)) {
        moves.push({
          from: knookSquare, to: target, type: "move",
          modifierId: "knook", label: "The Knook (rook move)",
        });
      }
      cf += df;
      cr += dr;
    }
  }
  return moves;
}

/** Amazon: queen also moves like a knight */
function genAmazon(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const queens = allSquaresOf(game, "q", color);
  const knightOffsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

  for (const qs of queens) {
    const [f, r] = sqToCoords(qs);
    for (const [df, dr] of knightOffsets) {
      const target = sq(f + df, r + dr);
      if (!target) continue;
      if (isFriendly(game, target, color)) continue;
      if (wouldLeaveKingInCheck(game, qs, target, color)) continue;

      moves.push({
        from: qs, to: target, type: isEnemy(game, target, color) ? "capture" : "move",
        modifierId: "amazon", label: "The Amazon (knight-jump)",
      });
    }
  }
  return moves;
}

/** King Ascension: king moves like a queen */
function genKingAscension(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const kings = allSquaresOf(game, "k", color);
  if (kings.length === 0) return moves;

  const kingSquare = kings[0];
  const [f, r] = sqToCoords(kingSquare);
  const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  for (const [df, dr] of dirs) {
    let cf = f + df;
    let cr = r + dr;
    let distance = 0;

    while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
      distance++;
      if (distance <= 1) { cf += df; cr += dr; continue; } // skip 1-sq moves (already legal)

      const target = sq(cf, cr)!;
      const piece = game.get(target);

      if (piece) {
        if (piece.color !== color) {
          if (!wouldLeaveKingInCheck(game, kingSquare, target, color)) {
            moves.push({
              from: kingSquare, to: target, type: "capture",
              modifierId: "king-ascension", label: "King Ascension (queen range)",
            });
          }
        }
        break;
      }

      if (!wouldLeaveKingInCheck(game, kingSquare, target, color)) {
        moves.push({
          from: kingSquare, to: target, type: "move",
          modifierId: "king-ascension", label: "King Ascension (queen range)",
        });
      }
      cf += df;
      cr += dr;
    }
  }
  return moves;
}

/** Collateral Damage Rook: after rook capture, also destroy piece behind target */
function getCollateralSquare(game: Chess, from: Square, to: Square): Square | null {
  const [ff, fr] = sqToCoords(from);
  const [tf, tr] = sqToCoords(to);
  const df = Math.sign(tf - ff);
  const dr = Math.sign(tr - fr);
  const behind = sq(tf + df, tr + dr);
  if (!behind) return null;
  const piece = game.get(behind);
  if (!piece) return null;
  return behind;
}

/** Nuclear Queen: after queen capture, clear all 8 surrounding squares */
function getNuclearSquares(game: Chess, to: Square, color: Color): Square[] {
  const [f, r] = sqToCoords(to);
  const result: Square[] = [];
  for (const [df, dr] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
    const s = sq(f + df, r + dr);
    if (s && game.get(s)) {
      // Don't destroy own king!
      const p = game.get(s);
      if (p && p.type === "k" && p.color === color) continue;
      result.push(s);
    }
  }
  return result;
}

/** Sniper Bishop: can capture enemies on same diagonal within 2 squares without moving */
function genSniperBishop(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const bishops = allSquaresOf(game, "b", color);
  const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const bs of bishops) {
    const [f, r] = sqToCoords(bs);
    for (const [df, dr] of diagDirs) {
      for (let dist = 1; dist <= 2; dist++) {
        const target = sq(f + df * dist, r + dr * dist);
        if (!target) break;
        const piece = game.get(target);
        if (piece) {
          if (piece.color !== color) {
            // Sniper: capture without moving
            moves.push({
              from: bs, to: target, type: "capture",
              modifierId: "sniper-bishop", label: "Sniper Bishop (ranged capture)",
              pieceStays: true,
            });
          }
          break; // can't see past pieces
        }
      }
    }
  }
  return moves;
}

/** Pegasus: Knights can make a double L-jump (two knight moves in one turn) */
function genPegasus(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const knights = allSquaresOf(game, "n", color);
  const knightOffsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const seen = new Set<string>();

  for (const ns of knights) {
    const [f, r] = sqToCoords(ns);

    // First jump: all 8 possible intermediate squares (Pegasus flies over everything)
    for (const [df1, dr1] of knightOffsets) {
      const midF = f + df1;
      const midR = r + dr1;
      if (midF < 0 || midF > 7 || midR < 0 || midR > 7) continue;

      // Second jump from intermediate square
      for (const [df2, dr2] of knightOffsets) {
        const finalF = midF + df2;
        const finalR = midR + dr2;
        if (finalF < 0 || finalF > 7 || finalR < 0 || finalR > 7) continue;

        const target = sq(finalF, finalR)!;

        // Can't end on starting square
        if (target === ns) continue;
        // Can't land on friendly piece
        if (isFriendly(game, target, color)) continue;

        // Deduplicate same from→to (multiple intermediate paths)
        const key = `${ns}-${target}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Skip squares reachable by a normal single-knight jump (chess.js handles those)
        const df = finalF - f;
        const dr = finalR - r;
        const isNormalKnight =
          (Math.abs(df) === 2 && Math.abs(dr) === 1) ||
          (Math.abs(df) === 1 && Math.abs(dr) === 2);
        if (isNormalKnight) continue;

        if (wouldLeaveKingInCheck(game, ns, target, color)) continue;

        moves.push({
          from: ns,
          to: target,
          type: isEnemy(game, target, color) ? "capture" : "move",
          modifierId: "pegasus",
          label: "Pegasus (double L-jump)",
        });
      }
    }
  }
  return moves;
}

/** Rook Cannon: rooks can jump over exactly one piece to capture behind it (Xiangqi style) */
function genRookCannon(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const rooks = allSquaresOf(game, "r", color);
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const rs of rooks) {
    const [f, r] = sqToCoords(rs);
    for (const [df, dr] of dirs) {
      let cf = f + df;
      let cr = r + dr;
      let jumped = false;

      while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
        const target = sq(cf, cr)!;
        const piece = game.get(target);

        if (piece) {
          if (!jumped) {
            // First piece encountered: jump over it
            jumped = true;
          } else {
            // Second piece encountered: can capture if enemy
            if (piece.color !== color) {
              if (!wouldLeaveKingInCheck(game, rs, target, color)) {
                moves.push({
                  from: rs,
                  to: target,
                  type: "capture",
                  modifierId: "rook-cannon",
                  label: "Rook Cannon (jump capture)",
                });
              }
            }
            break; // Can't go past second piece either way
          }
        }

        cf += df;
        cr += dr;
      }
    }
  }
  return moves;
}

/** Early promotion: pawns promote on rank 6 (white) or rank 3 (black) */
function genEarlyPromotion(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const promoRank = color === "w" ? 5 : 2; // 0-indexed: rank 6 = index 5, rank 3 = index 2
  const dir = color === "w" ? 1 : -1;
  const pawns = allSquaresOf(game, "p", color);

  for (const ps of pawns) {
    const [f, r] = sqToCoords(ps);
    // Must be one rank below promo rank
    if (r !== promoRank - dir) continue;

    // Forward move (empty target)
    const target = sq(f, promoRank);
    if (target && isEmpty(game, target) && !wouldLeaveKingInCheck(game, ps, target, color)) {
      moves.push({
        from: ps, to: target, type: "move",
        modifierId: "pawn-promotion-early",
        label: "Battlefield Promotion (early promo)",
        spawnPiece: { type: "q", color },
        promotionChoice: true,
      });
    }

    // Diagonal captures (left and right)
    for (const df of [-1, 1]) {
      const capTarget = sq(f + df, promoRank);
      if (!capTarget) continue;
      const capPiece = game.get(capTarget as any);
      if (!capPiece || capPiece.color === color) continue; // must capture enemy
      if (wouldLeaveKingInCheck(game, ps, capTarget, color)) continue;
      moves.push({
        from: ps, to: capTarget, type: "capture",
        modifierId: "pawn-promotion-early",
        label: "Battlefield Promotion (capture & promo)",
        spawnPiece: { type: "q", color },
        promotionChoice: true,
      });
    }
  }
  return moves;
}

/* ================================================================== */
/*  Main interface                                                      */
/* ================================================================== */

const MODIFIER_GENERATORS: Record<string, (game: Chess, color: Color) => ChaosMove[]> = {
  "pawn-charge": genPawnCharge,
  "pawn-capture-forward": genPawnBayonet,
  "knight-retreat": genKnightRetreat,
  "bishop-slide": genBishopSlide,
  "rook-charge": genRookCharge,
  "phantom-rook": genPhantomRook,
  "knook": genKnook,
  "amazon": genAmazon,
  "king-ascension": genKingAscension,
  "sniper-bishop": genSniperBishop,
  "pawn-promotion-early": genEarlyPromotion,
  "pegasus": genPegasus,
  "rook-cannon": genRookCannon,
};

/**
 * Generate all extra legal moves enabled by the active modifiers.
 * These are moves BEYOND what chess.js considers legal.
 */
export function getChaosMoves(
  game: Chess,
  modifiers: ChaosModifier[],
  color: Color,
): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const seen = new Set<string>();

  for (const mod of modifiers) {
    const gen = MODIFIER_GENERATORS[mod.id];
    if (!gen) continue;

    for (const m of gen(game, color)) {
      const key = `${m.from}-${m.to}-${m.modifierId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      moves.push(m);
    }
  }

  return moves;
}

/**
 * Execute a chaos move by directly manipulating the board.
 * Returns a new Chess instance with the resulting position, or null if invalid.
 */
export function executeChaosMove(
  game: Chess,
  move: ChaosMove,
  modifiers: ChaosModifier[],
): Chess | null {
  const piece = game.get(move.from);
  if (!piece) return null;

  const fen = game.fen();
  const tmp = new Chess(fen);

  // Remove piece from source (unless it stays, e.g. sniper)
  if (!move.pieceStays) {
    tmp.remove(move.from);
  }

  // Remove target (capture)
  tmp.remove(move.to);

  // Determine what piece to place
  if (move.spawnPiece) {
    // Early promotion: place queen instead of pawn
    tmp.put(move.spawnPiece, move.to);
  } else if (!move.pieceStays) {
    tmp.put({ type: piece.type, color: piece.color }, move.to);
  }

  // Apply side effects
  if (move.sideEffects) {
    for (const s of move.sideEffects) {
      tmp.remove(s);
    }
  }

  // Check for collateral damage rook
  if (move.type === "capture" && piece.type === "r" && modifiers.some((m) => m.id === "collateral-rook")) {
    const collateral = getCollateralSquare(game, move.from, move.to);
    if (collateral) tmp.remove(collateral);
  }

  // Check for nuclear queen
  if (move.type === "capture" && piece.type === "q" && modifiers.some((m) => m.id === "nuclear-queen")) {
    const nukes = getNuclearSquares(tmp, move.to, piece.color);
    for (const s of nukes) tmp.remove(s);
  }

  // Build new FEN with flipped turn
  const fenParts = tmp.fen().split(" ");
  fenParts[1] = fenParts[1] === "w" ? "b" : "w";
  fenParts[3] = "-"; // Reset en passant
  fenParts[4] = String(Math.max(0, parseInt(fenParts[4] || "0")));
  if (fenParts[1] === "w") {
    fenParts[5] = String(parseInt(fenParts[5] || "1") + 1);
  }

  const newFen = fenParts.join(" ");

  try {
    return new Chess(newFen);
  } catch {
    return null;
  }
}

/**
 * Apply side effects to a standard chess.js move result.
 * Call this after a normal move() to apply collateral/nuclear damage.
 * Returns a new Chess instance if modifications were made, null otherwise.
 */
export function applyPostMoveEffects(
  game: Chess,
  from: Square,
  to: Square,
  capturedPiece: boolean,
  movingPieceType: PieceSymbol,
  color: Color,
  modifiers: ChaosModifier[],
): Chess | null {
  let modified = false;
  const fen = game.fen();
  const tmp = new Chess(fen);

  // Collateral Damage Rook
  if (capturedPiece && movingPieceType === "r" && modifiers.some((m) => m.id === "collateral-rook")) {
    const collateral = getCollateralSquare(game, from, to);
    if (collateral) {
      tmp.remove(collateral);
      modified = true;
    }
  }

  // Nuclear Queen
  if (capturedPiece && movingPieceType === "q" && modifiers.some((m) => m.id === "nuclear-queen")) {
    const nukes = getNuclearSquares(tmp, to, color);
    for (const s of nukes) {
      tmp.remove(s);
      modified = true;
    }
  }

  if (!modified) return null;

  // Re-create with correct state
  try {
    return new Chess(tmp.fen());
  } catch {
    return null;
  }
}

/**
 * One-time board mutations that happen when a modifier is first drafted.
 * E.g. Knight Horde spawns extra knights, Undead Army revives pawns.
 * Returns a new Chess instance if the board was modified, null otherwise.
 */
export function applyDraftEffect(
  game: Chess,
  modifier: ChaosModifier,
  color: Color,
  capturedPawns: number,
): Chess | null {
  const fen = game.fen();
  const tmp = new Chess(fen);
  let modified = false;

  if (modifier.id === "knight-horde") {
    // Spawn 2 knights on random empty squares on your half
    const halfRanks = color === "w" ? [0, 1, 2, 3] : [4, 5, 6, 7];
    const empties = emptySquaresInRanks(tmp, halfRanks);
    const shuffled = empties.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(2, shuffled.length); i++) {
      tmp.put({ type: "n", color }, shuffled[i]);
      modified = true;
    }
  }

  if (modifier.id === "undead-army") {
    // Revive captured pawns on back 2 ranks
    const backRanks = color === "w" ? [0, 1] : [6, 7];
    const empties = emptySquaresInRanks(tmp, backRanks);
    const shuffled = empties.sort(() => Math.random() - 0.5);
    const toRevive = Math.min(capturedPawns, shuffled.length);
    for (let i = 0; i < toRevive; i++) {
      tmp.put({ type: "p", color }, shuffled[i]);
      modified = true;
    }
  }

  if (!modified) return null;

  try {
    return new Chess(tmp.fen());
  } catch {
    return null;
  }
}
