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

/** Check if a square holds an enemy king — chaos moves must NEVER target the king */
function isEnemyKing(game: Chess, square: Square, color: Color): boolean {
  const p = game.get(square);
  return !!p && p.color !== color && p.type === "k";
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

/**
 * Check if a chaos move would expose our king to an opponent's chaos-modifier attack.
 * Supplements wouldLeaveKingInCheck which only covers standard piece attacks.
 */
function wouldLeaveKingToChaosAttack(
  game: Chess,
  move: ChaosMove,
  color: Color,
  opponentModifiers: ChaosModifier[],
  assignedSquares?: Record<string, string | null>,
): boolean {
  const piece = game.get(move.from);
  if (!piece) return false;

  const tmp = new Chess(game.fen());
  if (!move.pieceStays) tmp.remove(move.from);
  tmp.remove(move.to);
  if (move.spawnPiece) {
    tmp.put(move.spawnPiece, move.to);
  } else if (!move.pieceStays) {
    tmp.put({ type: piece.type, color: piece.color }, move.to);
  }
  if (move.sideEffects) {
    for (const s of move.sideEffects) tmp.remove(s);
  }

  const kingSquares = allSquaresOf(tmp, "k", color);
  if (kingSquares.length === 0) return true;

  const oppColor: Color = color === "w" ? "b" : "w";
  const chaosAttacked = getChaosAttackedSquares(tmp, opponentModifiers, oppColor, assignedSquares);
  return chaosAttacked.has(kingSquares[0]);
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

/** Camel: first knight becomes a Camel — leaps (1,3) or (3,1) in any orientation */
function genCamel(game: Chess, color: Color, trackedSquare?: string | null): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const knights = allSquaresOf(game, "n", color);
  if (knights.length === 0) return moves;

  // Use tracked square if available
  let camelSquare: Square = knights[0];
  if (trackedSquare !== undefined) {
    if (trackedSquare === null) return moves; // Original piece was captured
    const p = game.get(trackedSquare as any);
    if (p && p.type === "n" && p.color === color) {
      camelSquare = trackedSquare as Square;
    }
    // else: tracking is stale (knight moved) — fall back to first knight found
  }

  const [f, r] = sqToCoords(camelSquare);
  // Camel leaps: all (1,3) and (3,1) offsets (8 destinations)
  const camelLeaps = [[-3,-1],[-3,1],[-1,-3],[-1,3],[1,-3],[1,3],[3,-1],[3,1]];

  for (const [df, dr] of camelLeaps) {
    const target = sq(f + df, r + dr);
    if (!target) continue;
    if (isFriendly(game, target, color)) continue;
    if (wouldLeaveKingInCheck(game, camelSquare, target, color)) continue;

    moves.push({
      from: camelSquare, to: target,
      type: isEnemy(game, target, color) ? "capture" : "move",
      modifierId: "camel", label: "Camel leap (1×3)",
    });
  }
  return moves;
}

/** Dragon Bishop (dragon-bishop): bishops also step 1 square orthogonally — Shogi Dragon Horse (龍馬) */
function genDragonBishop(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const bishops = allSquaresOf(game, "b", color);
  const orthSteps: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];

  for (const bs of bishops) {
    const [f, r] = sqToCoords(bs);
    for (const [df, dr] of orthSteps) {
      const target = sq(f + df, r + dr);
      if (!target) continue;
      if (isFriendly(game, target, color)) continue;
      if (wouldLeaveKingInCheck(game, bs, target, color)) continue;

      moves.push({
        from: bs, to: target, type: isEnemy(game, target, color) ? "capture" : "move",
        modifierId: "dragon-bishop", label: "Dragon Bishop step (ortho)",
      });
    }
  }
  return moves;
}

/** Dragon Rook (dragon-rook): rooks also step 1 square diagonally — Shogi Dragon King (龍王) */
function genDragonRook(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const rooks = allSquaresOf(game, "r", color);
  const diagSteps: [number, number][] = [[-1,-1],[-1,1],[1,-1],[1,1]];

  for (const rs of rooks) {
    const [f, r] = sqToCoords(rs);
    for (const [df, dr] of diagSteps) {
      const target = sq(f + df, r + dr);
      if (!target) continue;
      if (isFriendly(game, target, color)) continue;
      if (wouldLeaveKingInCheck(game, rs, target, color)) continue;

      moves.push({
        from: rs, to: target, type: isEnemy(game, target, color) ? "capture" : "move",
        modifierId: "dragon-rook", label: "Dragon Rook step (diag)",
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
function genKnook(game: Chess, color: Color, trackedSquare?: string | null): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const knights = allSquaresOf(game, "n", color);
  if (knights.length === 0) return moves;

  // Use tracked square if available (prevents transfer when original is captured)
  let knookSquare = knights[0];
  if (trackedSquare !== undefined) {
    if (trackedSquare === null) return moves; // Original piece was captured
    const p = game.get(trackedSquare as any);
    if (p && p.type === "n" && p.color === color) {
      knookSquare = trackedSquare as Square;
    } else {
      return moves; // Tracked square no longer has our knight — piece is dead
    }
  }
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

/** Archbishop: first bishop gains knight movement */
function genArchbishop(game: Chess, color: Color, trackedSquare?: string | null): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const bishops = allSquaresOf(game, "b", color);
  if (bishops.length === 0) return moves;

  // Use tracked square if available (prevents transfer when original is captured)
  let archbishopSquare: Square = bishops[0];
  if (trackedSquare !== undefined) {
    if (trackedSquare === null) return moves; // Original piece was captured
    const p = game.get(trackedSquare as any);
    if (p && p.type === "b" && p.color === color) {
      archbishopSquare = trackedSquare as Square;
    } else {
      return moves; // Tracked square no longer has our bishop — piece is dead
    }
  }
  const [f, r] = sqToCoords(archbishopSquare);
  const knightOffsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

  for (const [df, dr] of knightOffsets) {
    const target = sq(f + df, r + dr);
    if (!target) continue;
    if (isFriendly(game, target, color)) continue;
    if (wouldLeaveKingInCheck(game, archbishopSquare, target, color)) continue;

    moves.push({
      from: archbishopSquare, to: target,
      type: isEnemy(game, target, color) ? "capture" : "move",
      modifierId: "archbishop", label: "The Archbishop (knight-jump)",
    });
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
      const target = sq(cf, cr)!;
      const piece = game.get(target);

      if (piece) {
        // Ray is blocked — only generate a chaos capture at distance > 1
        // (distance-1 captures are already generated by chess.js and must not be duplicated)
        if (distance > 1 && piece.color !== color) {
          if (!wouldLeaveKingInCheck(game, kingSquare, target, color)) {
            moves.push({
              from: kingSquare, to: target, type: "capture",
              modifierId: "king-ascension", label: "King Ascension (queen capture)",
            });
          }
        }
        break; // stop the ray regardless
      }

      // Empty square — no queen-range *moves*, king still moves 1 sq normally via chess.js
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
      // Don't destroy any king!
      const p = game.get(s);
      if (p && p.type === "k") continue;
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

/** Ricochet Bishop: bishops can bounce their diagonal off the board edge once per move */
function genBishopBounce(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const bishops = allSquaresOf(game, "b", color);
  const diagDirs: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const bs of bishops) {
    const [sf, sr] = sqToCoords(bs);

    for (const [idf, idr] of diagDirs) {
      let cf = sf;
      let cr = sr;
      let df = idf;
      let dr = idr;
      let bounced = false;

      // Walk up to 14 steps (max diagonal across the board after a bounce)
      for (let step = 0; step < 14; step++) {
        const nf = cf + df;
        const nr = cr + dr;

        // Both axes off-board: corner bounce — reverse both
        const fOff = nf < 0 || nf > 7;
        const rOff = nr < 0 || nr > 7;

        if (fOff && rOff) {
          if (bounced) break;
          bounced = true;
          df = -df;
          dr = -dr;
          continue;
        }

        if (fOff || rOff) {
          // One axis off-board: reflect that component
          if (bounced) break;
          bounced = true;
          if (fOff) df = -df;
          if (rOff) dr = -dr;
          continue;
        }

        cf = nf;
        cr = nr;

        // Skip the squares chess.js already covers (pre-bounce straight diagonal from origin)
        // but stop if any piece is blocking the path to the wall
        if (!bounced) {
          if (game.get(sq(cf, cr)! as any)) break; // blocked before reaching edge
          continue;
        }

        const target = sq(cf, cr)!;

        if (isFriendly(game, target, color)) break; // blocked by own piece

        if (!wouldLeaveKingInCheck(game, bs, target, color)) {
          moves.push({
            from: bs, to: target,
            type: isEnemy(game, target, color) ? "capture" : "move",
            modifierId: "bishop-bounce",
            label: "Ricochet Bishop (wall bounce)",
          });
        }

        if (isEnemy(game, target, color)) break; // can't pass through captures
      }
    }
  }
  return moves;
}

/** Pegasus: One knight can make a double L-jump (two knight moves in one turn, 2nd jump forward only) */
function genPegasus(game: Chess, color: Color, trackedSquare?: string | null): ChaosMove[] {
  const moves: ChaosMove[] = [];

  // Require explicit tracking — never fall back to knights[0].
  // undefined means the key was never written (shouldn't happen after draft),
  // null means the tracked knight was captured. Either way: no moves.
  if (trackedSquare === undefined || trackedSquare === null) return moves;

  const p = game.get(trackedSquare as any);
  if (!p || p.type !== "n" || p.color !== color) return moves; // knight is gone

  const pegasusSquare = trackedSquare as Square;

  const knightOffsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const seen = new Set<string>();
  const [f, r] = sqToCoords(pegasusSquare);

  // First jump: all 8 possible intermediate squares (Pegasus flies over everything)
  for (const [df1, dr1] of knightOffsets) {
    const midF = f + df1;
    const midR = r + dr1;
    if (midF < 0 || midF > 7 || midR < 0 || midR > 7) continue;

    // Second jump: forward only (rank must advance toward opponent's side)
    for (const [df2, dr2] of knightOffsets) {
      const isForward = color === "w" ? dr2 > 0 : dr2 < 0;
      if (!isForward) continue;

      const finalF = midF + df2;
      const finalR = midR + dr2;
      if (finalF < 0 || finalF > 7 || finalR < 0 || finalR > 7) continue;

      const target = sq(finalF, finalR)!;

      // Can't end on starting square
      if (target === pegasusSquare) continue;
      // Can't land on friendly piece
      if (isFriendly(game, target, color)) continue;

      // Deduplicate same from→to (multiple intermediate paths)
      const key = `${pegasusSquare}-${target}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Skip squares reachable by a normal single-knight jump (chess.js handles those)
      const df = finalF - f;
      const dr = finalR - r;
      const isNormalKnight =
        (Math.abs(df) === 2 && Math.abs(dr) === 1) ||
        (Math.abs(df) === 1 && Math.abs(dr) === 2);
      if (isNormalKnight) continue;

      // Nerf: only allow long-range jumps (Chebyshev distance >= 3).
      // Removes adjacent diagonal captures and other nearby squares.
      if (Math.max(Math.abs(df), Math.abs(dr)) < 3) continue;

      if (wouldLeaveKingInCheck(game, pegasusSquare, target, color)) continue;

      moves.push({
        from: pegasusSquare,
        to: target,
        type: isEnemy(game, target, color) ? "capture" : "move",
        modifierId: "pegasus",
        label: "Pegasus (double L-jump)",
      });
    }
  }
  return moves;
}

/** Bishop Cannon: bishops can jump over exactly one piece diagonally to capture behind it (Xiangqi-style, diagonal) */
function genBishopCannon(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const bishops = allSquaresOf(game, "b", color);
  const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const bs of bishops) {
    const [f, r] = sqToCoords(bs);
    for (const [df, dr] of dirs) {
      let cf = f + df;
      let cr = r + dr;
      let jumped = false;

      while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
        const target = sq(cf, cr)!;
        const piece = game.get(target);

        if (piece) {
          if (!jumped) {
            // First piece: jump over it
            jumped = true;
          } else {
            // Second piece: capture if enemy
            if (piece.color !== color) {
              if (!wouldLeaveKingInCheck(game, bs, target, color)) {
                moves.push({
                  from: bs,
                  to: target,
                  type: "capture",
                  modifierId: "bishop-cannon",
                  label: "Bishop Cannon (diagonal jump capture)",
                });
              }
            }
            break;
          }
        }

        cf += df;
        cr += dr;
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

/** En Passant Everywhere: capture any pawn that moved just 1 square (2-sq is already chess.js EP) */
function genEnPassantEverywhere(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const history = game.history({ verbose: true });
  if (history.length === 0) return moves;

  const last = history[history.length - 1];
  // Only opponent pawn moves
  if (last.piece !== "p" || last.color === color) return moves;

  const [toFile, toRank] = sqToCoords(last.to as Square);
  const [, fromRank] = sqToCoords(last.from as Square);

  // Standard 2-square advance already generates EP via chess.js FEN — only add 1-square
  if (Math.abs(toRank - fromRank) !== 1) return moves;

  // EP landing = the square the pawn just came from (one step back)
  const epLanding = sq(toFile, fromRank);
  if (!epLanding || !isEmpty(game, epLanding)) return moves;

  const ourDir = color === "w" ? 1 : -1;

  // Our pawns on the same rank as the opponent pawn, ±1 file
  for (const df of [-1, 1]) {
    const ourPawnSq = sq(toFile + df, toRank);
    if (!ourPawnSq) continue;
    const p = game.get(ourPawnSq);
    if (!p || p.type !== "p" || p.color !== color) continue;

    // EP landing must be forward for our color (fromRank - toRank is opposite to pawnDir)
    if ((fromRank - toRank) * ourDir <= 0) continue;

    if (wouldLeaveKingInCheck(game, ourPawnSq, epLanding, color, [last.to as Square])) continue;

    moves.push({
      from: ourPawnSq,
      to: epLanding,
      type: "capture",
      modifierId: "enpassant-everywhere",
      label: "En Passant Everywhere!",
      sideEffects: [last.to as Square],
    });
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

/** Queen can teleport to any empty square on the board */
function genQueenTeleport(game: Chess, color: Color): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const queens = allSquaresOf(game, "q", color);
  if (queens.length === 0) return moves;

  // Standard queen reachable squares (via chess.js) — skip duplicates so we
  // only add squares the queen cannot already reach through normal movement.
  const normalReach = new Set<string>();
  for (const qs of queens) {
    for (const m of game.moves({ square: qs as any, verbose: true })) {
      normalReach.add(`${qs}-${m.to}`);
    }
  }

  for (const qs of queens) {
    for (const f of FILES) {
      for (const r of RANKS) {
        const target = `${f}${r}` as Square;
        if (target === qs) continue;
        if (!isEmpty(game, target)) continue; // teleport to empty squares only
        if (normalReach.has(`${qs}-${target}`)) continue; // already reachable normally
        if (wouldLeaveKingInCheck(game, qs, target, color)) continue;
        moves.push({
          from: qs,
          to: target,
          type: "move",
          modifierId: "queen-teleport",
          label: "Warp Queen (teleport)",
        });
      }
    }
  }
  return moves;
}

const MODIFIER_GENERATORS: Record<string, (game: Chess, color: Color, trackedSquare?: string | null) => ChaosMove[]> = {
  "pawn-charge": genPawnCharge,
  "pawn-capture-forward": genPawnBayonet,
  "camel": genCamel,
  "dragon-bishop": genDragonBishop,
  "dragon-rook": genDragonRook,
  "phantom-rook": genPhantomRook,
  "knook": genKnook,
  "archbishop": genArchbishop,
  "amazon": genAmazon,
  "king-ascension": genKingAscension,
  "sniper-bishop": genSniperBishop,
  "pawn-promotion-early": genEarlyPromotion,
  "pegasus": genPegasus,
  "rook-cannon": genRookCannon,
  "bishop-cannon": genBishopCannon,
  "queen-teleport": genQueenTeleport,
  "bishop-bounce": genBishopBounce,
  "enpassant-everywhere": genEnPassantEverywhere,
};

/**
 * Generate all extra legal moves enabled by the active modifiers.
 * These are moves BEYOND what chess.js considers legal.
 *
 * @param opponentModifiers - Pass opponent's modifiers to also filter out moves
 *   that would expose our king to an opponent chaos-modifier attack (e.g. Pegasus,
 *   Amazon). Without this the standard `wouldLeaveKingInCheck` check is used alone,
 *   which is blind to chaos-controlled squares.
 */
export function getChaosMoves(
  game: Chess,
  modifiers: ChaosModifier[],
  color: Color,
  assignedSquares?: Record<string, string | null>,
  opponentModifiers?: ChaosModifier[],
): ChaosMove[] {
  const moves: ChaosMove[] = [];
  const seen = new Set<string>();
  const colorKey = color; // "w" or "b"

  for (const mod of modifiers) {
    const gen = MODIFIER_GENERATORS[mod.id];
    if (!gen) continue;

    // Pass tracked square for single-piece modifiers
    const trackedKey = `${colorKey}_${mod.id}`;
    const trackedSquare = assignedSquares?.[trackedKey];

    for (const m of gen(game, color, trackedSquare)) {
      const key = `${m.from}-${m.to}-${m.modifierId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // Also verify this move doesn't expose our king to an opponent chaos attack
      if (
        opponentModifiers &&
        opponentModifiers.length > 0 &&
        wouldLeaveKingToChaosAttack(game, m, color, opponentModifiers, assignedSquares)
      ) {
        continue;
      }
      moves.push(m);
    }
  }

  return moves;
}

/**
 * Get all squares attacked by a color's pieces via chaos modifiers.
 * Used for king safety — no self-check or enemy-king filtering.
 * This tells us which squares a side CONTROLS via its chaos-modified pieces,
 * so the opponent's king must not walk into them.
 */
export function getChaosAttackedSquares(
  game: Chess,
  modifiers: ChaosModifier[],
  attackerColor: Color,
  assignedSquares?: Record<string, string | null>,
): Set<Square> {
  const attacked = new Set<Square>();
  const modIds = new Set(modifiers.map((m) => m.id));

  /* helper: add sliding-ray attack squares */
  const addSliding = (startF: number, startR: number, dirs: number[][]) => {
    for (const [df, dr] of dirs) {
      let cf = startF + df;
      let cr = startR + dr;
      while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
        const t = sq(cf, cr)!;
        attacked.add(t);
        if (game.get(t)) break; // blocked by any piece
        cf += df;
        cr += dr;
      }
    }
  };

  const knightOffsets: number[][] = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const cardinals: number[][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const diagonals: number[][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const allDirs: number[][] = [...cardinals, ...diagonals];

  /* Knook: first knight attacks along rook lines */
  if (modIds.has("knook")) {
    const trackedKnook = assignedSquares?.[`${attackerColor}_knook`];
    let knookSq: Square | null = null;
    if (trackedKnook !== undefined) {
      if (trackedKnook !== null) {
        const p = game.get(trackedKnook as any);
        if (p && p.type === "n" && p.color === attackerColor) knookSq = trackedKnook as Square;
      }
    } else {
      const knights = allSquaresOf(game, "n", attackerColor);
      if (knights.length > 0) knookSq = knights[0];
    }
    if (knookSq) {
      const [f, r] = sqToCoords(knookSq);
      addSliding(f, r, cardinals);
    }
  }

  /* Archbishop: first bishop attacks knight squares */
  if (modIds.has("archbishop")) {
    const trackedArch = assignedSquares?.[`${attackerColor}_archbishop`];
    let archSq: Square | null = null;
    if (trackedArch !== undefined) {
      if (trackedArch !== null) {
        const p = game.get(trackedArch as any);
        if (p && p.type === "b" && p.color === attackerColor) archSq = trackedArch as Square;
      }
    } else {
      const bishops = allSquaresOf(game, "b", attackerColor);
      if (bishops.length > 0) archSq = bishops[0];
    }
    if (archSq) {
      const [f, r] = sqToCoords(archSq);
      for (const [df, dr] of knightOffsets) {
        const t = sq(f + df, r + dr);
        if (t) attacked.add(t);
      }
    }
  }

  /* Amazon: all queens attack knight squares */
  if (modIds.has("amazon")) {
    for (const qs of allSquaresOf(game, "q", attackerColor)) {
      const [f, r] = sqToCoords(qs);
      for (const [df, dr] of knightOffsets) {
        const t = sq(f + df, r + dr);
        if (t) attacked.add(t);
      }
    }
  }

  /* King Ascension: king attacks like queen (beyond 1 sq — 1-sq already covered by chess.js) */
  if (modIds.has("king-ascension")) {
    const kings = allSquaresOf(game, "k", attackerColor);
    if (kings.length > 0) {
      const [f, r] = sqToCoords(kings[0]);
      // King Ascension: captures along queen rays but doesn't move there,
      // so only mark squares that have an enemy piece (capture threats only).
      for (const [df, dr] of allDirs) {
        let cf = f + df;
        let cr = r + dr;
        let distance = 0;
        while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
          distance++;
          const t = sq(cf, cr)!;
          const p = game.get(t);
          if (p) {
            if (distance > 1 && p.color !== attackerColor) attacked.add(t);
            break;
          }
          cf += df; cr += dr;
        }
      }
    }
  }

  /* Pegasus: tracked/first knight attacks double-L squares (forward-only 2nd jump) */
  if (modIds.has("pegasus")) {
    const trackedPegasus = assignedSquares?.[`${attackerColor}_pegasus`];
    let pegasusSq: Square | null = null;
    if (trackedPegasus !== undefined && trackedPegasus !== null) {
      const p = game.get(trackedPegasus as any);
      if (p && p.type === "n" && p.color === attackerColor) pegasusSq = trackedPegasus as Square;
    }
    // If trackedPegasus is undefined or null, no Pegasus attack squares exist.
    if (pegasusSq) {
      const [f, r] = sqToCoords(pegasusSq);
      for (const [df1, dr1] of knightOffsets) {
        const mf = f + df1;
        const mr = r + dr1;
        if (mf < 0 || mf > 7 || mr < 0 || mr > 7) continue;
        for (const [df2, dr2] of knightOffsets) {
          // Forward-only 2nd jump
          const isForward = attackerColor === "w" ? dr2 > 0 : dr2 < 0;
          if (!isForward) continue;
          const ff = mf + df2;
          const fr = mr + dr2;
          if (ff < 0 || ff > 7 || fr < 0 || fr > 7) continue;
          const t = sq(ff, fr);
          if (!t || t === pegasusSq) continue;
          const dff = ff - f;
          const dfr = fr - r;
          const isNormal = (Math.abs(dff) === 2 && Math.abs(dfr) === 1) || (Math.abs(dff) === 1 && Math.abs(dfr) === 2);
          if (!isNormal && Math.max(Math.abs(dff), Math.abs(dfr)) >= 3) attacked.add(t);
        }
      }
    }
  }

  /* Sniper Bishop: diag 1-2 squares */
  if (modIds.has("sniper-bishop")) {
    for (const bs of allSquaresOf(game, "b", attackerColor)) {
      const [f, r] = sqToCoords(bs);
      for (const [df, dr] of diagonals) {
        for (let dist = 1; dist <= 2; dist++) {
          const t = sq(f + df * dist, r + dr * dist);
          if (!t) break;
          attacked.add(t);
          if (game.get(t)) break;
        }
      }
    }
  }

  /* Ricochet Bishop: bishops attack the bounced-diagonal squares */
  if (modIds.has("bishop-bounce")) {
    for (const bs of allSquaresOf(game, "b", attackerColor)) {
      const [sf, sr] = sqToCoords(bs);
      for (const [idf, idr] of diagonals) {
        let cf = sf;
        let cr = sr;
        let df = idf as number;
        let dr = idr as number;
        let bounced = false;
        for (let step = 0; step < 14; step++) {
          const nf = cf + df;
          const nr = cr + dr;
          const fOff = nf < 0 || nf > 7;
          const rOff = nr < 0 || nr > 7;
          if (fOff && rOff) { if (bounced) break; bounced = true; df = -df; dr = -dr; continue; }
          if (fOff || rOff) { if (bounced) break; bounced = true; if (fOff) df = -df; if (rOff) dr = -dr; continue; }
          cf = nf; cr = nr;
          if (!bounced) {
            if (game.get(sq(cf, cr)! as any)) break; // blocked before reaching edge
            continue;
          }
          const t = sq(cf, cr)!;
          attacked.add(t);
          if (game.get(t)) break;
        }
      }
    }
  }

  /* Camel: first knight attacks all (1,3) and (3,1) leap squares */
  if (modIds.has("camel")) {
    const trackedKey = `${attackerColor}_camel`;
    const tracked = assignedSquares?.[trackedKey];
    let camelSquares: Square[];
    if (tracked !== undefined) {
      if (tracked === null) {
        camelSquares = [];
      } else {
        const p = game.get(tracked as Square);
        camelSquares = (p && p.type === "n" && p.color === attackerColor) ? [tracked as Square] : [];
      }
    } else {
      camelSquares = allSquaresOf(game, "n", attackerColor).slice(0, 1);
    }
    const camelLeaps = [[-3,-1],[-3,1],[-1,-3],[-1,3],[1,-3],[1,3],[3,-1],[3,1]];
    for (const ns of camelSquares) {
      const [f, r] = sqToCoords(ns);
      for (const [df, dr] of camelLeaps) {
        const t = sq(f + df, r + dr);
        if (t) attacked.add(t);
      }
    }
  }

  /* Dragon Rook: rooks also attack 1 step diagonally (Shogi Dragon King) */
  if (modIds.has("dragon-rook")) {
    for (const rs of allSquaresOf(game, "r", attackerColor)) {
      const [f, r] = sqToCoords(rs);
      for (const [df, dr] of [[-1,-1],[-1,1],[1,-1],[1,1]] as [number,number][]) {
        const t = sq(f + df, r + dr);
        if (t) attacked.add(t);
      }
    }
  }

  /* Dragon Bishop: bishops also attack 1 step orthogonally (Shogi Dragon Horse) */
  if (modIds.has("dragon-bishop")) {
    for (const bs of allSquaresOf(game, "b", attackerColor)) {
      const [f, r] = sqToCoords(bs);
      for (const [df, dr] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
        const t = sq(f + df, r + dr);
        if (t) attacked.add(t);
      }
    }
  }

  /* Phantom Rook: rooks slide through friendly pieces */
  if (modIds.has("phantom-rook")) {
    for (const rs of allSquaresOf(game, "r", attackerColor)) {
      const [f, r] = sqToCoords(rs);
      for (const [df, dr] of cardinals) {
        let cf = f + df;
        let cr = r + dr;
        while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
          const t = sq(cf, cr)!;
          attacked.add(t);
          const p = game.get(t);
          if (p && p.color !== attackerColor) break; // blocked by enemy
          // friendly pieces are transparent
          cf += df;
          cr += dr;
        }
      }
    }
  }

  /* Pawn Capture Forward (Bayonet): pawns attack 1 sq straight ahead */
  if (modIds.has("pawn-capture-forward")) {
    const dir = attackerColor === "w" ? 1 : -1;
    for (const ps of allSquaresOf(game, "p", attackerColor)) {
      const [f, r] = sqToCoords(ps);
      const t = sq(f, r + dir);
      if (t) attacked.add(t);
    }
  }

  /* Rook Cannon: jump-capture squares */
  if (modIds.has("rook-cannon")) {
    for (const rs of allSquaresOf(game, "r", attackerColor)) {
      const [f, r] = sqToCoords(rs);
      for (const [df, dr] of cardinals) {
        let cf = f + df;
        let cr = r + dr;
        let jumped = false;
        while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
          const t = sq(cf, cr)!;
          const p = game.get(t);
          if (p) {
            if (!jumped) {
              jumped = true;
            } else {
              attacked.add(t);
              break;
            }
          }
          cf += df;
          cr += dr;
        }
      }
    }
  }

  /* Bishop Cannon: diagonal jump-capture squares */
  if (modIds.has("bishop-cannon")) {
    const diags = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const bs of allSquaresOf(game, "b", attackerColor)) {
      const [f, r] = sqToCoords(bs);
      for (const [df, dr] of diags) {
        let cf = f + df;
        let cr = r + dr;
        let jumped = false;
        while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
          const t = sq(cf, cr)!;
          const p = game.get(t);
          if (p) {
            if (!jumped) {
              jumped = true;
            } else {
              attacked.add(t);
              break;
            }
          }
          cf += df;
          cr += dr;
        }
      }
    }
  }

  return attacked;
}

/**
 * Returns true if the side-to-move's king is attacked by the opponent's
 * chaos-modifier abilities (e.g. archbishop knight jumps) but NOT necessarily
 * by standard piece attacks. Use this to enforce chaos-check evasion.
 */
export function isKingUnderChaosAttack(
  game: Chess,
  attackerModifiers: ChaosModifier[],
  attackerColor: Color,
  assignedSquares?: Record<string, string | null>,
): boolean {
  const defenderColor: Color = attackerColor === "w" ? "b" : "w";
  const kings = allSquaresOf(game, "k", defenderColor);
  if (kings.length === 0) return false;
  const attacked = getChaosAttackedSquares(game, attackerModifiers, attackerColor, assignedSquares);
  return attacked.has(kings[0]);
}

/** Piece values in centipawns for chaos threat evaluation */
const PIECE_VALUE_CP: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 0,
};

/**
 * Compute a centipawn penalty for a position based on the opponent's chaos threats.
 *
 * After the AI makes a move, the opponent (player) gets to respond.
 * If the player has chaos modifiers (e.g. sniper bishop), they can capture
 * AI pieces that Stockfish doesn't know are threatened.
 *
 * This function generates all opponent chaos moves in the given position
 * and returns the value of the best capture the opponent can make.
 * The AI should subtract this from its eval to account for the threat.
 *
 * @param game - Position after the AI's candidate move
 * @param opponentModifiers - The opponent's (player's) chaos modifiers
 * @param opponentColor - The opponent's color
 * @returns centipawn penalty (positive = bad for the AI)
 */
export function computeChaosThreatPenalty(
  game: Chess,
  opponentModifiers: ChaosModifier[],
  opponentColor: Color,
  assignedSquares?: Record<string, string | null>,
  getCustomVal?: (sq: string, type: string, color: "w" | "b") => number,
): number {
  const chaosMoves = getChaosMoves(game, opponentModifiers, opponentColor, assignedSquares);
  if (chaosMoves.length === 0) return 0;
  const valFn = getCustomVal ?? ((_sq: string, type: string) => PIECE_VALUE_CP[type] ?? 0);

  let maxThreat = 0;

  for (const cm of chaosMoves) {
    // Only care about captures (moves that land on an enemy piece)
    const targetPiece = game.get(cm.to as any);
    if (!targetPiece || targetPiece.color === opponentColor) continue;

    const value = valFn(cm.to, targetPiece.type, targetPiece.color as "w" | "b");
    if (value <= 0) continue;

    // For sniper bishop (pieceStays = true), the capture is "free" — full value
    // For normal chaos captures, the attacker moves there and may be recaptured,
    // so discount by the attacker's value (like a trade)
    let netThreat: number;
    if (cm.pieceStays) {
      // Free capture — attacker doesn't move (sniper, phantom)
      netThreat = value;
    } else {
      // Attacker moves to the square — might get recaptured
      const piece = game.get(cm.from as any);
      const attackerValue = piece ? valFn(cm.from, piece.type, piece.color as "w" | "b") : 0;
      // If attacker is worth less than target, it's a good trade
      // If attacker is worth more, the opponent might not take it
      // Be conservative: assume the trade happens if target >= attacker
      netThreat = Math.max(0, value - attackerValue * 0.5);
    }

    // Side effects (nuclear queen, collateral rook) — add value of destroyed pieces
    if (cm.sideEffects) {
      for (const sq of cm.sideEffects) {
        const se = game.get(sq as any);
        if (se && se.color !== opponentColor) {
          netThreat += valFn(sq, se.type, se.color as "w" | "b");
        }
      }
    }

    if (netThreat > maxThreat) maxThreat = netThreat;
  }

  return maxThreat;
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

  // Strip castling rights that are no longer valid after chaos manipulation.
  // chess.js v4 throws if a castling right exists but its rook/king is gone.
  const rawCastling = fenParts[2] || "-";
  if (rawCastling !== "-") {
    const wk  = tmp.get("e1" as Square);
    const bk  = tmp.get("e8" as Square);
    const wKR = tmp.get("h1" as Square);
    const wQR = tmp.get("a1" as Square);
    const bKR = tmp.get("h8" as Square);
    const bQR = tmp.get("a8" as Square);
    let c = "";
    if (rawCastling.includes("K") && wk?.type === "k" && wk.color === "w" && wKR?.type === "r" && wKR.color === "w") c += "K";
    if (rawCastling.includes("Q") && wk?.type === "k" && wk.color === "w" && wQR?.type === "r" && wQR.color === "w") c += "Q";
    if (rawCastling.includes("k") && bk?.type === "k" && bk.color === "b" && bKR?.type === "r" && bKR.color === "b") c += "k";
    if (rawCastling.includes("q") && bk?.type === "k" && bk.color === "b" && bQR?.type === "r" && bQR.color === "b") c += "q";
    fenParts[2] = c || "-";
  }

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

/** Returns the most valuable piece type missing from the board vs starting count */
function getMostValuableCapturedPiece(game: Chess, color: Color, modifiers: ChaosModifier[]): PieceSymbol | null {
  const start: Record<string, number> = { q: 1, r: 2, b: 2, n: 2, p: 8 };
  // Knight-horde spawns 2 extra knights — count those as "expected"
  if (modifiers.some((m) => m.id === "knight-horde")) start.n += 2;
  const onBoard: Record<string, number> = { q: 0, r: 0, b: 0, n: 0, p: 0 };
  for (const f of FILES) {
    for (const r of RANKS) {
      const s = `${f}${r}` as Square;
      const p = game.get(s);
      if (p && p.color === color && p.type !== "k") {
        onBoard[p.type] = (onBoard[p.type] ?? 0) + 1;
      }
    }
  }
  for (const type of ["q", "r", "b", "n", "p"] as PieceSymbol[]) {
    if ((onBoard[type] ?? 0) < (start[type] ?? 0)) return type;
  }
  return null;
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
  /** The opponent (victim) side's modifiers — for reactive effects like Pawn Fortress */
  opponentModifiers?: ChaosModifier[],
  /** The type of the captured piece (needed for Pawn Fortress check) */
  capturedType?: PieceSymbol,
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

  // Pawn Fortress — victim's captured pawn has 50% chance to respawn on its start square
  if (
    capturedPiece &&
    capturedType === "p" &&
    opponentModifiers?.some((m) => m.id === "pawn-fortress") &&
    Math.random() < 0.5
  ) {
    // The captured pawn's color is the opponent of the mover
    const pawnColor: Color = color === "w" ? "b" : "w";
    // Starting rank for that pawn color
    const startRank = pawnColor === "w" ? "2" : "7";
    const file = to[0] as string; // file of capture square = pawn's file
    const startSquare = `${file}${startRank}` as Square;
    if (!tmp.get(startSquare)) {
      tmp.put({ type: "p", color: pawnColor }, startSquare);
      modified = true;
    }
  }

  // Regicide (king-wrath) — king capture revives the most valuable fallen piece on the back rank
  if (capturedPiece && movingPieceType === "k" && modifiers.some((m) => m.id === "king-wrath")) {
    const revivedType = getMostValuableCapturedPiece(tmp, color, modifiers);
    if (revivedType) {
      const backRank = color === "w" ? "1" : "8";
      const empties = FILES.map((f) => `${f}${backRank}` as Square).filter((s) => !tmp.get(s));
      if (empties.length > 0) {
        const chosen = empties[Math.floor(Math.random() * empties.length)];
        tmp.put({ type: revivedType, color }, chosen);
        modified = true;
      }
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

/* ================================================================== */
/*  King Shield — absorb check by removing the checking piece           */
/* ================================================================== */

/**
 * Find which enemy squares are currently giving check to the specified king.
 */
export function findCheckingSquares(game: Chess, checkedColor: Color): Square[] {
  const kingSquare = allSquaresOf(game, "k", checkedColor)[0];
  if (!kingSquare) return [];
  const [kf, kr] = sqToCoords(kingSquare);
  const attColor: Color = checkedColor === "w" ? "b" : "w";
  const checkers: Square[] = [];

  // Knights
  for (const [df, dr] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
    const s = sq(kf + df, kr + dr);
    if (s) { const p = game.get(s); if (p && p.type === "n" && p.color === attColor) checkers.push(s); }
  }

  // Diagonals (bishops/queen)
  for (const [df, dr] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    let cf = kf + df, cr = kr + dr;
    while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
      const s = sq(cf, cr)!;
      const p = game.get(s);
      if (p) {
        if (p.color === attColor && (p.type === "b" || p.type === "q")) checkers.push(s);
        break;
      }
      cf += df; cr += dr;
    }
  }

  // Files/ranks (rooks/queen)
  for (const [df, dr] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    let cf = kf + df, cr = kr + dr;
    while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
      const s = sq(cf, cr)!;
      const p = game.get(s);
      if (p) {
        if (p.color === attColor && (p.type === "r" || p.type === "q")) checkers.push(s);
        break;
      }
      cf += df; cr += dr;
    }
  }

  // Pawns
  const pawnDir = checkedColor === "w" ? 1 : -1;
  for (const df of [-1, 1]) {
    const s = sq(kf + df, kr + pawnDir);
    if (s) { const p = game.get(s); if (p && p.type === "p" && p.color === attColor) checkers.push(s); }
  }

  return checkers;
}

/**
 * Compute which enemy square the Kings-Chains modifier should freeze.
 * Returns the square of the highest-value enemy piece adjacent to `ownerColor`'s
 * king, or null if none are adjacent.
 */
export function computeChainedSquare(
  game: Chess,
  ownerColor: Color,
): string | null {
  const enemyColor: Color = ownerColor === "w" ? "b" : "w";
  const kingSquares = allSquaresOf(game, "k", ownerColor);
  if (kingSquares.length === 0) return null;
  const [kf, kr] = sqToCoords(kingSquares[0]);

  let bestSq: string | null = null;
  let bestVal = 0;

  for (const [df, dr] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]] as [number,number][]) {
    const s = sq(kf + df, kr + dr);
    if (!s) continue;
    const piece = game.get(s as Square);
    if (!piece || piece.color !== enemyColor || piece.type === "k") continue;
    const val = PIECE_VALUE_CP[piece.type] ?? 0;
    if (val > bestVal) {
      bestVal = val;
      bestSq = s;
    }
  }
  return bestSq;
}

/**
 * Activate the King Shield: remove the first checking piece from the board.
 * Returns a new Chess instance with the checking piece removed, or null if
 * the position isn't actually in check.
 */
export function applyKingShield(game: Chess, checkedColor: Color): Chess | null {
  if (!game.isCheck()) return null;
  const checkers = findCheckingSquares(game, checkedColor);
  if (checkers.length === 0) return null;

  // Flip the turn back to the attacker so they must make another move.
  const attackerColor: Color = checkedColor === "w" ? "b" : "w";
  const fenParts = game.fen().split(" ");
  fenParts[1] = attackerColor;
  fenParts[3] = "-"; // reset en passant

  let shielded: Chess;
  try {
    shielded = new Chess(fenParts.join(" "));
  } catch {
    return null;
  }

  // Find the defended king
  const kingSquares = allSquaresOf(shielded, "k", checkedColor);
  if (kingSquares.length === 0) return null;
  const kingSq = kingSquares[0];
  const [kf, kr] = sqToCoords(kingSq);

  // Prevent the attacker from immediately capturing the king on the very next move.
  // For each checking piece:
  //   - knights / adjacent pieces: remove the checker (guard absorbed the attack)
  //   - sliding pieces at distance > 1: insert a guard pawn between them and the king
  for (const checkerSq of checkers) {
    const piece = shielded.get(checkerSq as Square);
    if (!piece) continue;

    const [cf, cr] = sqToCoords(checkerSq as Square);
    const dist = Math.max(Math.abs(kf - cf), Math.abs(kr - cr));

    if (piece.type === "n" || dist <= 1) {
      // Cannot be blocked by an interposing pawn — remove the checker
      shielded.remove(checkerSq as Square);
      continue;
    }

    // Sliding piece at distance > 1: walk from checker toward king and place a
    // guard pawn on the first empty, non-promotion-rank square in that ray.
    const dtf = Math.sign(kf - cf);
    const dtr = Math.sign(kr - cr);
    let inserted = false;
    let sf = cf + dtf;
    let sr = cr + dtr;
    while (sf !== kf || sr !== kr) {
      const guardSq = sq(sf, sr);
      if (guardSq && !shielded.get(guardSq as Square) && sr > 0 && sr < 7) {
        shielded.put({ type: "p", color: checkedColor }, guardSq as Square);
        inserted = true;
        break;
      }
      sf += dtf;
      sr += dtr;
    }
    if (!inserted) {
      // No safe interposing square — remove the checker
      shielded.remove(checkerSq as Square);
    }
  }

  return shielded;
}

/**
 * Detect "chaos checkmate": the side to move is in check according to chess.js,
 * but chess.js doesn't call it checkmate because there are ostensibly legal
 * king-escape moves — however all those escapes land on squares controlled
 * by the opponent's chaos pieces (e.g. Pegasus controlling many squares).
 *
 * Supplements Chess.isCheckmate() for positions where chaos modifiers seal off
 * every standard escape. Returns true only when:
 *   1. The king is in standard check
 *   2. chess.js does NOT already call it checkmate
 *   3. Every legal move is a king move that ends on a chaos-controlled square
 *   4. No non-king (blocking/interposing) legal move exists
 */
export function isChaosCheckmate(
  game: Chess,
  oppModifiers: ChaosModifier[],
  oppColor: Color,
  assignedSquares?: Record<string, string | null>,
  /** The checked side's own chaos modifiers — if they have chaos moves that escape check, it's not checkmate */
  defenderModifiers?: ChaosModifier[],
): boolean {
  if (!game.inCheck()) return false;
  if (game.isCheckmate()) return false; // already handled by standard path

  const myColor = game.turn() as Color;

  // If the defender has chaos moves available, those may also escape check.
  // getChaosMoves filters via wouldLeaveKingInCheck so only genuine escapes survive.
  if (defenderModifiers && defenderModifiers.length > 0) {
    const defChaos = getChaosMoves(game, defenderModifiers, myColor, assignedSquares, oppModifiers);
    if (defChaos.length > 0) return false;
  }

  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return true;

  // Determine which squares are chained (can't move) due to King's Chains
  const chainedSquares = new Set<string>();
  if (assignedSquares) {
    const oppChainKey = `${oppColor}_kings-chains`;
    const chained = assignedSquares[oppChainKey];
    if (chained) chainedSquares.add(chained);
  }

  for (const move of legalMoves) {
    const piece = game.get(move.from as Square);
    if (!piece) continue;

    // Chained piece can't move — treat this move as unavailable
    if (chainedSquares.has(move.from)) continue;

    if (piece.type !== "k") {
      // A non-king blocking/interposing move exists — not chaos checkmate
      return false;
    }

    // King move: check if the destination is safe from chaos attacks
    const tmp = new Chess(game.fen());
    tmp.remove(move.from as Square);
    const occupant = tmp.get(move.to as Square);
    if (occupant) tmp.remove(move.to as Square);
    tmp.put({ type: "k", color: myColor }, move.to as Square);

    const chaosAttacked = getChaosAttackedSquares(tmp, oppModifiers, oppColor, assignedSquares);
    if (!chaosAttacked.has(move.to as Square)) {
      return false; // A safe king escape exists — not chaos checkmate
    }
  }

  return true; // Every king escape goes to a chaos-controlled square
}
