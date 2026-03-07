/**
 * Roast Commentary Engine — Meme Edition 🔥
 *
 * Position-aware commentary with chess.js board analysis (forks, pins,
 * hanging pieces, king safety, pawn structure, development) wrapped in
 * AnarchyChess / Gotham Chess / internet-brain humor with emojis.
 */

import { Chess, type PieceSymbol, type Color, type Square } from "chess.js";
import { OPENING_GUIDES, type OpeningGuide } from "./opening-guides";

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export type MoveClassification =
  | "brilliant"
  | "great"
  | "best"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "miss";

export interface AnalyzedMove {
  san: string;
  uci: string;
  moveNumber: number;
  color: "w" | "b";
  fen: string;
  fenAfter: string;
  cpBefore: number;
  cpAfter: number;
  bestMoveSan: string | null;
  /** UCI notation for the engine's best move, e.g. "e2e4" */
  bestMoveUci: string | null;
  cpLoss: number;
  classification: MoveClassification;
  isCapture: boolean;
  isCheck: boolean;
  isCastle: boolean;
  isPromotion: boolean;
  pieceType: string;
  capturedPiece?: string;
  hungPiece: boolean;
  hungWhat?: string;
  sacrificedMaterial: boolean;
  wasBookMove: boolean;
  mateInN: number | null;
  missedMateInN: number | null;
  walkedIntoFork: boolean;
  walkedIntoPin: boolean;
  evalSwing: number;
  isResignationWorthy: boolean;
  /** Seconds spent on this move (from %clk data), or null if unavailable */
  timeSpent: number | null;
}

export interface GameSummary {
  moves: AnalyzedMove[];
  whiteElo: number;
  blackElo: number;
  avgElo: number;
  result: string;
  opening: string;
  totalBlunders: number;
  totalMistakes: number;
  worstMove: AnalyzedMove | null;
  bestMove: AnalyzedMove | null;
  biggestSwing: AnalyzedMove | null;
}

/** Board annotation returned alongside commentary text */
export interface MoveAnnotation {
  arrows: [string, string, string][]; // [from, to, rgba color]
  markers: { square: string; emoji: string }[];
}

export interface CommentResult {
  text: string;
  annotations: MoveAnnotation;
}

const NO_ANNOTATIONS: MoveAnnotation = { arrows: [], markers: [] };

/* ================================================================== */
/*  Classification                                                      */
/* ================================================================== */

export function classifyMove(cpLoss: number, isBestMove: boolean): MoveClassification {
  if (isBestMove) return "best";
  if (cpLoss <= 10) return "great";
  if (cpLoss <= 25) return "good";
  if (cpLoss <= 50) return "inaccuracy";
  if (cpLoss <= 150) return "mistake";
  return "blunder";
}

/* ================================================================== */
/*  Helpers — chess.js board inspection                                 */
/* ================================================================== */

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

const PIECE_NAMES: Record<string, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

function pn(t: string, cap = false): string {
  const n = PIECE_NAMES[t] ?? "piece";
  return cap ? n[0].toUpperCase() + n.slice(1) : n;
}

function opp(c: Color): Color {
  return c === "w" ? "b" : "w";
}

function fileIdx(s: string): number { return s.charCodeAt(0) - 97; }
function rankIdx(s: string): number { return parseInt(s[1]) - 1; }
function sq(f: number, r: number): Square | null {
  if (f < 0 || f > 7 || r < 0 || r > 7) return null;
  return `${FILES[f]}${RANKS[r]}` as Square;
}

interface PieceInfo { type: PieceSymbol; color: Color; square: Square }

function allPieces(chess: Chess): PieceInfo[] {
  const out: PieceInfo[] = [];
  for (const f of FILES) for (const r of RANKS) {
    const s = `${f}${r}` as Square;
    const p = chess.get(s);
    if (p) out.push({ type: p.type, color: p.color, square: s });
  }
  return out;
}

function findKing(chess: Chess, color: Color): Square | null {
  for (const p of allPieces(chess)) if (p.type === "k" && p.color === color) return p.square;
  return null;
}

/* ================================================================== */
/*  Board Analysis Functions                                            */
/* ================================================================== */

function detectHanging(chess: Chess, color: Color): PieceInfo[] {
  const hanging: PieceInfo[] = [];
  try {
    const oppColor = opp(color);
    const oppMoves = chess.moves({ verbose: true });
    const attacked = new Set(oppMoves.filter(m => m.captured).map(m => m.to));

    // Check if the opponent (side to move) has their own pieces under attack.
    // If their most-valuable-attacked piece is worth >= the "hanging" piece,
    // they likely can't afford to capture ours because they must save theirs first.
    let maxOppThreat = 0;
    for (const p of allPieces(chess)) {
      if (p.color === oppColor && p.type !== "k" && chess.isAttacked(p.square, color)) {
        // Only count as a counter-threat if the attacked piece can't also capture our hanging piece
        // (e.g., if their queen is attacked but could capture the hanging piece, it's still "free")
        const val = PIECE_VALUES[p.type] ?? 0;
        if (val > maxOppThreat) {
          // Check if this threatened opponent piece has a move that captures one of our attacked pieces
          const canCaptureHanging = oppMoves.some(m => m.from === p.square && m.captured && attacked.has(m.to));
          if (!canCaptureHanging) {
            maxOppThreat = val;
          }
        }
      }
    }

    for (const p of allPieces(chess)) {
      if (p.color === color && p.type !== "k" && attacked.has(p.square) && (PIECE_VALUES[p.type] ?? 0) >= 3) {
        // Only flag as hanging if the piece is NOT defended by any friendly piece
        if (!chess.isAttacked(p.square, color)) {
          // Skip if opponent has their own piece under bigger threat that they must save first
          if (maxOppThreat >= (PIECE_VALUES[p.type] ?? 0)) continue;
          hanging.push(p);
        }
      }
    }
  } catch { /* not opponent's turn */ }
  return hanging;
}

function isAttacking(_chess: Chess, from: Square, attacker: PieceInfo, target: Square): boolean {
  const dFile = fileIdx(target) - fileIdx(from);
  const dRank = rankIdx(target) - rankIdx(from);
  switch (attacker.type) {
    case "n": { const af = Math.abs(dFile), ar = Math.abs(dRank); return (af === 2 && ar === 1) || (af === 1 && ar === 2); }
    case "p": { const dir = attacker.color === "w" ? 1 : -1; return dRank === dir && Math.abs(dFile) === 1; }
    case "b": return Math.abs(dFile) === Math.abs(dRank) && dFile !== 0 && pathClear(_chess, from, target);
    case "r": return (dFile === 0 || dRank === 0) && (dFile !== 0 || dRank !== 0) && pathClear(_chess, from, target);
    case "q": return ((dFile === 0 || dRank === 0) || (Math.abs(dFile) === Math.abs(dRank))) && (dFile !== 0 || dRank !== 0) && pathClear(_chess, from, target);
    case "k": return Math.abs(dFile) <= 1 && Math.abs(dRank) <= 1 && (dFile !== 0 || dRank !== 0);
    default: return false;
  }
}

function pathClear(chess: Chess, from: Square, to: Square): boolean {
  const sf = fileIdx(from), sr = rankIdx(from), tf = fileIdx(to), tr = rankIdx(to);
  const df = Math.sign(tf - sf), dr = Math.sign(tr - sr);
  let f = sf + df, r = sr + dr;
  while (f !== tf || r !== tr) {
    const s = sq(f, r);
    if (!s || chess.get(s)) return false;
    f += df; r += dr;
  }
  return true;
}

function detectForks(chess: Chess, square: Square, piece: PieceInfo): PieceInfo[] {
  const attacked: PieceInfo[] = [];
  for (const t of allPieces(chess)) {
    if (t.color === piece.color || t.type === "p") continue;
    if (isAttacking(chess, square, piece, t.square)) attacked.push(t);
  }
  return attacked;
}

type PinInfo = { pinner: PieceInfo; pinned: PieceInfo; target: PieceInfo };

function sliderDirs(t: PieceSymbol): [number, number][] {
  if (t === "b") return [[1,1],[1,-1],[-1,1],[-1,-1]];
  if (t === "r") return [[1,0],[-1,0],[0,1],[0,-1]];
  return [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
}

function isAligned(from: Square, to: Square, df: number, dr: number): boolean {
  const dFile = fileIdx(to) - fileIdx(from), dRank = rankIdx(to) - rankIdx(from);
  if (df === 0 && dr === 0) return false;
  if (df === 0) return dFile === 0 && Math.sign(dRank) === Math.sign(dr);
  if (dr === 0) return dRank === 0 && Math.sign(dFile) === Math.sign(df);
  return Math.abs(dFile) === Math.abs(dRank) && Math.sign(dFile) === Math.sign(df) && Math.sign(dRank) === Math.sign(dr);
}

function detectPins(chess: Chess, pinnedColor: Color): PinInfo[] {
  const pins: PinInfo[] = [];
  const pinnerColor = opp(pinnedColor);
  const sliders = allPieces(chess).filter(p => p.color === pinnerColor && (p.type === "b" || p.type === "r" || p.type === "q"));
  const targets = allPieces(chess).filter(p => p.color === pinnedColor && (p.type === "k" || p.type === "q" || p.type === "r"));
  for (const slider of sliders) {
    for (const tgt of targets) {
      for (const [df, dr] of sliderDirs(slider.type)) {
        if (!isAligned(slider.square, tgt.square, df, dr)) continue;
        const between: PieceInfo[] = [];
        let f = fileIdx(slider.square) + df, r = rankIdx(slider.square) + dr;
        while (f !== fileIdx(tgt.square) || r !== rankIdx(tgt.square)) {
          const s = sq(f, r);
          if (!s) break;
          const p = chess.get(s);
          if (p) between.push({ type: p.type, color: p.color, square: s });
          f += df; r += dr;
        }
        if (between.length === 1 && between[0].color === pinnedColor && between[0].type !== "k") {
          // Filter out false pins:
          // 1. If the "target" behind is a rook/queen that can X-ray / oppose the pinner
          //    on the same line (e.g. Rook behind a piece opposing an enemy queen on a file),
          //    that's defensive opposition, not a meaningful pin.
          const pinnedVal = PIECE_VALUES[between[0].type] ?? 0;
          const targetVal = PIECE_VALUES[tgt.type] ?? 0;
          const pinnerVal = PIECE_VALUES[slider.type] ?? 0;
          // Skip if the "pinned" piece is worth ≥ the target behind it (no real pin leverage)
          if (pinnedVal >= targetVal && tgt.type !== "k") continue;
          // Skip rook/queen opposition: target is a slider that can attack the pinner through the
          // pinned piece on the same line (e.g. rook opposing queen on same file/rank)
          if (tgt.type !== "k" && (tgt.type === "r" || tgt.type === "q") && targetVal >= pinnerVal) {
            // Check if the target can slide toward the pinner (same line)
            const canOppose = (tgt.type === "q") || // queen always covers the line
              (tgt.type === "r" && (df === 0 || dr === 0)); // rook covers ranks/files
            if (canOppose) continue;
          }
          pins.push({ pinner: slider, pinned: between[0], target: tgt });
        }
      }
    }
  }
  return pins;
}

/* ================================================================== */
/*  Threat Detection — what does a move threaten?                       */
/* ================================================================== */

interface ThreatInfo {
  /** Square being threatened */
  square: Square;
  /** Piece being threatened */
  piece: PieceInfo;
  /** What is doing the threatening */
  attacker: PieceInfo;
  /** Type of threat */
  type: "capture" | "fork" | "skewer" | "discovery";
}

/** Detect what meaningful threats a move creates (new attacks on valuable pieces) */
function detectNewThreats(before: Chess, after: Chess, moverColor: Color): ThreatInfo[] {
  const threats: ThreatInfo[] = [];
  const oppColor = opp(moverColor);

  // Get squares attacked before and after
  try {
    // Find new attacks on opponent's pieces (attacks that didn't exist before)
    const oppPieces = allPieces(after).filter(p => p.color === oppColor && p.type !== "p");
    
    for (const target of oppPieces) {
      const wasAttacked = before.isAttacked(target.square, moverColor);
      const nowAttacked = after.isAttacked(target.square, moverColor);
      
      if (nowAttacked && !wasAttacked) {
        // Find who's attacking this square now
        const myPieces = allPieces(after).filter(p => p.color === moverColor);
        for (const attacker of myPieces) {
          if (isAttacking(after, attacker.square, attacker, target.square)) {
            threats.push({
              square: target.square,
              piece: target,
              attacker,
              type: "capture",
            });
            break; // one attacker is enough for commentary
          }
        }
      }
    }
  } catch {}

  return threats;
}

/** Format threats as a brief commentary snippet */
function formatThreats(threats: ThreatInfo[]): string | null {
  if (threats.length === 0) return null;
  const valuable = threats.filter(t => (PIECE_VALUES[t.piece.type] ?? 0) >= 3);
  if (valuable.length === 0) return null;
  
  if (valuable.length === 1) {
    const t = valuable[0];
    return `threatening the ${pn(t.piece.type)} on ${t.square}`;
  }
  if (valuable.length >= 2) {
    const names = valuable.slice(0, 2).map(t => `${pn(t.piece.type)} on ${t.square}`);
    return `threatening both the ${names.join(" and the ")}`;
  }
  return null;
}

function kingSafety(chess: Chess, color: Color): { score: number; issues: string[] } {
  const king = findKing(chess, color);
  if (!king) return { score: 100, issues: [] };
  const issues: string[] = [];
  let score = 100;
  const kf = fileIdx(king), kr = rankIdx(king);
  const shieldRank = color === "w" ? kr + 1 : kr - 1;
  let shield = 0;
  for (let f = Math.max(0, kf - 1); f <= Math.min(7, kf + 1); f++) {
    const s = sq(f, shieldRank);
    if (s) { const p = chess.get(s); if (p?.type === "p" && p.color === color) shield++; }
  }
  if (shield === 0) { score -= 30; issues.push("no pawn shield 🫣"); }
  else if (shield === 1) { score -= 15; issues.push("thin pawn shield 😬"); }
  const pieces = allPieces(chess);
  if (pieces.length > 12 && kf >= 3 && kf <= 4) {
    const backRank = color === "w" ? 0 : 7;
    if (kr === backRank) { score -= 25; issues.push("king stuck in the centre 👑💀"); }
  }
  for (let f = Math.max(0, kf - 1); f <= Math.min(7, kf + 1); f++) {
    const hasPawn = pieces.some(p => p.type === "p" && p.color === color && fileIdx(p.square) === f);
    if (!hasPawn) {
      const hasHeavy = pieces.some(p => (p.type === "r" || p.type === "q") && p.color === opp(color) && fileIdx(p.square) === f);
      if (hasHeavy) { score -= 20; issues.push(`open ${FILES[f]}-file near king with enemy heavy piece 🚨`); }
    }
  }
  return { score: Math.max(0, score), issues };
}

function development(chess: Chess, color: Color): { developed: number; total: number; stuck: string[] } {
  const backRank = color === "w" ? "1" : "8";
  let developed = 0, total = 0;
  const stuck: string[] = [];
  for (const p of allPieces(chess)) {
    if (p.color !== color || p.type === "k" || p.type === "p") continue;
    // Rooks belong on the back rank — only count minor pieces + queen as "stuck"
    if (p.type === "r") continue;
    total++;
    if (p.square[1] === backRank) stuck.push(`${pn(p.type, true)} on ${p.square}`);
    else developed++;
  }
  return { developed, total, stuck };
}

function pawnIssues(chess: Chess, color: Color): { doubled: string[]; isolated: string[]; passed: string[] } {
  const pawns = allPieces(chess).filter(p => p.type === "p" && p.color === color);
  const oppPawns = allPieces(chess).filter(p => p.type === "p" && p.color === opp(color));
  const doubled: string[] = [], isolated: string[] = [], passed: string[] = [];
  const fileCounts = new Map<number, Square[]>();
  for (const p of pawns) {
    const f = fileIdx(p.square);
    fileCounts.set(f, [...(fileCounts.get(f) ?? []), p.square]);
  }
  for (const [f, sqs] of fileCounts) {
    if (sqs.length >= 2) doubled.push(`${FILES[f]}-file (${sqs.join(", ")})`);
  }
  for (const p of pawns) {
    const f = fileIdx(p.square);
    if (!pawns.some(pp => Math.abs(fileIdx(pp.square) - f) === 1)) isolated.push(p.square);
  }
  for (const p of pawns) {
    const f = fileIdx(p.square), r = rankIdx(p.square);
    let isPassed = true;
    for (const op of oppPawns) {
      if (Math.abs(fileIdx(op.square) - f) <= 1) {
        if (color === "w" && rankIdx(op.square) > r) { isPassed = false; break; }
        if (color === "b" && rankIdx(op.square) < r) { isPassed = false; break; }
      }
    }
    if (isPassed) passed.push(p.square);
  }
  return { doubled, isolated, passed };
}

function countAttackers(chess: Chess, square: string, _attackerColor: Color): number {
  let count = 0;
  try { const moves = chess.moves({ verbose: true }); for (const m of moves) { if (m.to === square) count++; } } catch {}
  return count;
}

/* ================================================================== */
/*  Positional Analysis Helpers                                         */
/* ================================================================== */

/** Return info about passed pawns — how advanced they are and if they're supported */
function passedPawnInfo(chess: Chess, color: Color): { square: Square; rank: number; supported: boolean; connected: boolean }[] {
  const { passed } = pawnIssues(chess, color);
  return passed.map(sq => {
    const s = sq as Square;
    const r = rankIdx(s);
    const advancement = color === "w" ? r : 7 - r; // 0 = starting rank, 6 = promotion rank
    // Supported: is there a friendly piece defending this pawn?
    const supported = chess.isAttacked(s, color);
    // Connected: adjacent friendly pawn
    const f = fileIdx(s);
    const allPawns = allPieces(chess).filter(p => p.type === "p" && p.color === color);
    const connected = allPawns.some(p => Math.abs(fileIdx(p.square) - f) === 1 && Math.abs(rankIdx(p.square) - r) <= 1);
    return { square: s, rank: advancement, supported, connected };
  });
}

/** Measure king centralization — important in endgames */
function kingCentralization(chess: Chess, color: Color): { score: number; square: Square | null } {
  const king = findKing(chess, color);
  if (!king) return { score: 0, square: null };
  const kf = fileIdx(king), kr = rankIdx(king);
  // Distance from center (d4/e4/d5/e5)
  const distFile = Math.min(Math.abs(kf - 3), Math.abs(kf - 4));
  const distRank = Math.min(Math.abs(kr - 3), Math.abs(kr - 4));
  // Score: 0 = corner, 4 = center
  const score = 4 - (distFile + distRank);
  return { score: Math.max(0, score), square: king };
}

/** Detect material imbalance — e.g. rook vs two minors, bishop pair, etc. */
function materialImbalance(chess: Chess): {
  whitePieces: Record<string, number>;
  blackPieces: Record<string, number>;
  bishopPair: { w: boolean; b: boolean };
  exchangeSac: Color | null;
  rookVsMinors: Color | null;
} {
  const wp: Record<string, number> = { q: 0, r: 0, b: 0, n: 0, p: 0 };
  const bp: Record<string, number> = { q: 0, r: 0, b: 0, n: 0, p: 0 };
  const wBishopColors = new Set<string>();
  const bBishopColors = new Set<string>();
  for (const p of allPieces(chess)) {
    if (p.type === "k") continue;
    if (p.color === "w") {
      wp[p.type]++;
      if (p.type === "b") wBishopColors.add((fileIdx(p.square) + rankIdx(p.square)) % 2 === 0 ? "dark" : "light");
    } else {
      bp[p.type]++;
      if (p.type === "b") bBishopColors.add((fileIdx(p.square) + rankIdx(p.square)) % 2 === 0 ? "dark" : "light");
    }
  }
  const wBishopPair = wBishopColors.size >= 2;
  const bBishopPair = bBishopColors.size >= 2;

  // Exchange sacrifice: one side has fewer rooks but more minors
  let exchangeSac: Color | null = null;
  if (wp.r < bp.r && (wp.b + wp.n) > (bp.b + bp.n)) exchangeSac = "w"; // white gave up exchange
  if (bp.r < wp.r && (bp.b + bp.n) > (wp.b + wp.n)) exchangeSac = "b";

  // Rook vs two minor pieces
  let rookVsMinors: Color | null = null;
  if (wp.r > bp.r && (bp.b + bp.n) - (wp.b + wp.n) >= 2) rookVsMinors = "w"; // white has rook, black has minors
  if (bp.r > wp.r && (wp.b + wp.n) - (bp.b + bp.n) >= 2) rookVsMinors = "b";

  return { whitePieces: wp, blackPieces: bp, bishopPair: { w: wBishopPair, b: bBishopPair }, exchangeSac, rookVsMinors };
}

/** Detect opposite-colored bishops — important for endgame assessment */
function hasOppositeColorBishops(chess: Chess): boolean {
  const bishops = allPieces(chess).filter(p => p.type === "b");
  const wBishops = bishops.filter(p => p.color === "w");
  const bBishops = bishops.filter(p => p.color === "b");
  if (wBishops.length !== 1 || bBishops.length !== 1) return false;
  const wColor = (fileIdx(wBishops[0].square) + rankIdx(wBishops[0].square)) % 2;
  const bColor = (fileIdx(bBishops[0].square) + rankIdx(bBishops[0].square)) % 2;
  return wColor !== bColor;
}

/** Detect "bad" bishop — bishop blocked by its own pawns on the same color squares */
function detectBadBishop(chess: Chess, color: Color): { square: Square; blockedPawns: number } | null {
  const bishops = allPieces(chess).filter(p => p.type === "b" && p.color === color);
  if (bishops.length === 0) return null;
  const pawns = allPieces(chess).filter(p => p.type === "p" && p.color === color);
  for (const bishop of bishops) {
    const bishopColorSq = (fileIdx(bishop.square) + rankIdx(bishop.square)) % 2;
    const blocked = pawns.filter(p => (fileIdx(p.square) + rankIdx(p.square)) % 2 === bishopColorSq).length;
    if (blocked >= 4) return { square: bishop.square, blockedPawns: blocked };
  }
  return null;
}

/** Count control of central squares (d4, d5, e4, e5) */
function centralControl(chess: Chess, color: Color): { controlled: number; occupied: number } {
  const centers: Square[] = ["d4", "d5", "e4", "e5"] as Square[];
  let controlled = 0, occupied = 0;
  for (const sq of centers) {
    if (chess.isAttacked(sq, color)) controlled++;
    const p = chess.get(sq);
    if (p && p.color === color) occupied++;
  }
  return { controlled, occupied };
}

/** Measure space advantage — how many squares in the opponent's half are controlled */
function spaceAdvantage(chess: Chess, color: Color): number {
  let space = 0;
  const oppHalfRanks = color === "w" ? [4, 5, 6, 7] : [0, 1, 2, 3]; // ranks 5-8 for white, 1-4 for black
  for (const f of [0, 1, 2, 3, 4, 5, 6, 7]) {
    for (const r of oppHalfRanks) {
      const s = sq(f, r);
      if (s && chess.isAttacked(s, color)) space++;
    }
  }
  return space;
}


type SkewerInfo = {
  attacker: PieceInfo;
  front: PieceInfo;   // higher-value piece being attacked
  behind: PieceInfo;  // lower-value piece behind it
};

/** Detect skewers: a slider attacks a valuable piece that, when it moves, exposes a lesser piece behind */
function detectSkewers(chess: Chess, attackerColor: Color): SkewerInfo[] {
  const skewers: SkewerInfo[] = [];
  const victimColor = opp(attackerColor);
  const sliders = allPieces(chess).filter(p => p.color === attackerColor && (p.type === "b" || p.type === "r" || p.type === "q"));

  for (const slider of sliders) {
    for (const [df, dr] of sliderDirs(slider.type)) {
      const line: PieceInfo[] = [];
      let cf = fileIdx(slider.square) + df, cr = rankIdx(slider.square) + dr;
      while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
        const s = sq(cf, cr);
        if (!s) break;
        const p = chess.get(s);
        if (p) {
          if (p.color === victimColor) line.push({ type: p.type, color: p.color, square: s });
          else break;
          if (line.length === 2) break;
        }
        cf += df; cr += dr;
      }
      if (line.length === 2) {
        const frontVal = PIECE_VALUES[line[0].type] ?? 0;
        const behindVal = PIECE_VALUES[line[1].type] ?? 0;
        // Skip skewers to pawns — too low value to be meaningful
        if (behindVal <= 1) continue;
        // Skip if the behind piece is defended (protected skewer = no material gain)
        if (chess.isAttacked(line[1].square as Square, victimColor)) continue;
        if (frontVal > behindVal && frontVal >= 3) {
          skewers.push({ attacker: slider, front: line[0], behind: line[1] });
        }
      }
    }
  }
  return skewers;
}

/** Detect discovered attacks: moving a piece uncovers an attack by a friendly slider behind it */
function detectDiscoveredAttack(
  before: Chess,
  after: Chess,
  fromSq: Square,
  moverColor: Color,
): { slider: PieceInfo; target: PieceInfo } | null {
  const oppColor = opp(moverColor);
  const friendlySliders = allPieces(before).filter(p =>
    p.color === moverColor && p.square !== fromSq && (p.type === "b" || p.type === "r" || p.type === "q")
  );

  for (const slider of friendlySliders) {
    for (const [df, dr] of sliderDirs(slider.type)) {
      if (!isAligned(slider.square, fromSq, df, dr)) continue;

      // Walk from slider past fromSq to find newly-attacked targets
      let cf = fileIdx(slider.square) + df, cr = rankIdx(slider.square) + dr;
      let passedFrom = false;
      while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
        const s = sq(cf, cr);
        if (!s) break;
        if (s === fromSq) { passedFrom = true; cf += df; cr += dr; continue; }
        const pBefore = before.get(s);
        if (pBefore && !passedFrom) break; // blocked before fromSq
        const pAfter = after.get(s);
        if (pAfter && passedFrom) {
          if (pAfter.color === oppColor && (PIECE_VALUES[pAfter.type] ?? 0) >= 3) {
            // Skip if the target is well-defended AND the slider is worth >= the target
            // (e.g. a queen "discovering" onto a defended rook = no real gain)
            const sliderVal = PIECE_VALUES[slider.type] ?? 0;
            const targetVal = PIECE_VALUES[pAfter.type] ?? 0;
            const isDefended = after.isAttacked(s, oppColor);
            if (isDefended && sliderVal >= targetVal) break; // not a real discovery threat
            return { slider, target: { type: pAfter.type, color: pAfter.color, square: s } };
          }
          break;
        }
        cf += df; cr += dr;
      }
    }
  }
  return null;
}

/** Detect back-rank weakness/threat: king is on the back rank with pawns blocking escape
 *  AND the opponent actually has heavy pieces (rook/queen) that could exploit it */
function detectBackRankWeakness(chess: Chess, color: Color): boolean {
  const king = findKing(chess, color);
  if (!king) return false;
  const kr = rankIdx(king);
  const backRank = color === "w" ? 0 : 7;
  if (kr !== backRank) return false;

  // Opponent must have at least one rook or queen to threaten the back rank
  const oppColor = opp(color);
  const oppHeavy = allPieces(chess).filter(p => p.color === oppColor && (p.type === "r" || p.type === "q"));
  if (oppHeavy.length === 0) return false;

  // Check if all squares in front of the king are blocked by friendly pawns
  const kf = fileIdx(king);
  const forward = color === "w" ? 1 : -1;
  let blocked = 0;
  for (let f = Math.max(0, kf - 1); f <= Math.min(7, kf + 1); f++) {
    const s = sq(f, kr + forward);
    if (s) {
      const p = chess.get(s);
      if (p && p.type === "p" && p.color === color) blocked++;
    }
  }
  return blocked >= 2; // At least 2 pawns blocking escape → back rank vulnerable
}

/** Check if a piece is truly trapped (no safe escape squares AND opponent can actually win it) */
function isPieceTrapped(chess: Chess, square: Square, pieceColor: Color): boolean {
  const piece = chess.get(square);
  if (!piece || piece.type === "p" || piece.type === "k") return false;
  if ((PIECE_VALUES[piece.type] ?? 0) < 3) return false;

  try {
    const allMoves = chess.moves({ verbose: true });
    const pieceMoves = allMoves.filter(m => m.from === square);
    if (pieceMoves.length === 0) {
      // No moves at all — only trapped if opponent can actually attack the square
      const oppColor = opp(pieceColor);
      const oppPieces = allPieces(chess).filter(p => p.color === oppColor);
      const canAttack = oppPieces.some(p => isAttacking(chess, p.square, p, square));
      return canAttack;
    }

    // Must have very few moves (truly cornered)
    if (pieceMoves.length > 3) return false;

    let safeMoves = 0;
    for (const m of pieceMoves) {
      const sim = new Chess(chess.fen());
      sim.move(m);
      // Check if opponent can recapture for free
      const isRecapturedCheap = sim.moves({ verbose: true }).some(
        om => om.to === m.to && om.captured && (PIECE_VALUES[om.piece as PieceSymbol] ?? 0) <= (PIECE_VALUES[piece.type] ?? 0)
      );
      if (!isRecapturedCheap) safeMoves++;
    }
    if (safeMoves > 0) return false;

    // All moves lose material — but also verify the opponent can actually threaten/win this piece
    // (otherwise it's just a piece with limited mobility, not truly "trapped")
    const oppColor = opp(pieceColor);
    const sim2 = new Chess(chess.fen());
    // Switch to opponent's turn to check if they can target this piece
    // Simple check: can any opponent piece attack this square?
    const oppPieces = allPieces(chess).filter(p => p.color === oppColor);
    const isUnderAttack = oppPieces.some(p => isAttacking(chess, p.square, p, square));
    // Or opponent has a move that captures it
    if (!isUnderAttack) {
      // Check if opponent can reach the square in 1 move
      try {
        const fenParts = chess.fen().split(" ");
        fenParts[1] = oppColor; // flip turn
        const oppSim = new Chess(fenParts.join(" "));
        const oppMoves = oppSim.moves({ verbose: true });
        const canCapture = oppMoves.some(m => m.to === square && m.captured);
        if (!canCapture) return false; // opponent can't even reach it — not trapped
      } catch {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/* ================================================================== */
/*  Opening Guide Matching                                              */
/* ================================================================== */

/** Find the matching OpeningGuide for a game's opening name */
function matchOpeningGuide(opening: string): OpeningGuide | null {
  if (!opening) return null;
  const o = opening.toLowerCase();
  for (const guide of OPENING_GUIDES) {
    const gn = guide.name.toLowerCase();
    // exact-ish match first
    if (o.includes(gn) || gn.includes(o)) return guide;
    // keyword matching
    const keywords = gn.split(/[\s-]+/).filter(w => w.length > 3);
    if (keywords.length > 0 && keywords.every(kw => o.includes(kw))) return guide;
  }
  return null;
}

/** Get a relevant opening-specific idea or trap to use in commentary */
function getOpeningInsight(guide: OpeningGuide, moverColor: Color): string | null {
  const ideas = [
    ...guide.keyIdeas,
    ...(moverColor === "w" ? guide.whitePlans : guide.blackPlans),
  ];
  if (ideas.length === 0) return null;
  return pick(ideas);
}

/** Get a trap description if the opening has traps */
function getOpeningTrap(guide: OpeningGuide): { name: string; description: string } | null {
  if (guide.traps.length === 0) return null;
  return pick(guide.traps);
}

/* ================================================================== */
/*  Random helpers                                                      */
/* ================================================================== */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick a string from `arr` that hasn't been used yet (by template key).
 *  Falls back to random if all are "used". */
function pickUnused(arr: readonly string[], used: Set<string>): string {
  // Shuffle indices
  const idx = Array.from({ length: arr.length }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  for (const i of idx) {
    if (!used.has(_templateKey(arr[i]))) return arr[i];
  }
  return arr[idx[0]]; // all used — fall back to first shuffled
}

/* ================================================================== */
/*  Position-Aware Roast Generator                                      */
/* ================================================================== */

export function generateMoveComment(
  move: AnalyzedMove,
  usedLines: Set<string>,
  summary: GameSummary,
): CommentResult | null {
  try {
    return _generatePositionAware(move, usedLines, summary);
  } catch {
    const fb = _fallbackLine(move);
    return fb ?? null;
  }
}

function _generatePositionAware(
  move: AnalyzedMove,
  used: Set<string>,
  summary: GameSummary,
): CommentResult | null {
  const before = new Chess(move.fen);
  let after: Chess;
  try { after = new Chess(move.fenAfter); } catch {
    const fb = _fallbackLine(move);
    return fb ?? null;
  }

  const moverColor = move.color as Color;
  const fromSq = move.uci.slice(0, 2) as Square;
  const toSq = move.uci.slice(2, 4) as Square;
  const movedPiece = before.get(fromSq);
  const landedPiece = after.get(toSq);
  const capturedPiece = before.get(toSq);

  // Detect obvious recaptures — skip commentary for routine take-backs
  const isRecapture = _isObviousRecapture(move, summary);
  const ctx = _getGameContext(move, summary);

  // Time-based roasts — if clock data is available and the time spent is extreme
  if (move.timeSpent !== null && Math.random() < 0.4) {
    const timeResult = _timeRoast(move, ctx, used);
    if (timeResult) return _emitResult(used, timeResult);
  }

  // Opponent just gifted material and player didn't capitalize
  if (ctx.opponentJustBlundered && ctx.opponentGift > 150 &&
      (move.classification !== "best" && move.classification !== "great" && move.classification !== "brilliant") &&
      Math.random() < 0.5) {
    const giftResult = _opponentGiftRoast(move, ctx, used);
    if (giftResult) return _emitResult(used, giftResult);
  }

  // Momentum commentary — eval is cratering over multiple moves
  if (ctx.evalCrater > 300 && Math.random() < 0.25) {
    const momentumResult = _momentumRoast(move, ctx, used);
    if (momentumResult) return _emitResult(used, momentumResult);
  }

  // Tempo / initiative commentary — slow move in a sharp position
  if (ctx.wastingInitiative && Math.random() < 0.45) {
    const tempoResult = _tempoRoast(move, ctx, used);
    if (tempoResult) {
      if (move.classification === "mistake" || move.classification === "blunder") return _emitResultForce(used, tempoResult);
      return _emitResult(used, tempoResult);
    }
  }

  // Check-response commentary — player was responding to a check
  if (ctx.wasRespondingToCheck && Math.random() < 0.55) {
    const checkResponseResult = _checkResponseRoast(move, ctx, used);
    if (checkResponseResult) {
      if (move.classification === "blunder") return _emitResultForce(used, checkResponseResult);
      return _emitResult(used, checkResponseResult);
    }
  }

  if (move.classification === "brilliant" || (move.classification === "best" && move.sacrificedMaterial)) {
    return _emitResult(used, _brilliantRoast(move, before, after, toSq, landedPiece, ctx));
  }

  if (move.classification === "great" || move.classification === "best") {
    // Skip obvious recaptures — they're not interesting
    if (isRecapture) return null;
    if (Math.random() > 0.22) return null; // rarely comment on good moves
    // Sometimes comment on playstyle instead of the move itself
    if (Math.random() < 0.35) {
      const style = _styleRoast(move, summary, used);
      if (style) return _emitResult(used, style);
    }
    return _emitResult(used, _goodMoveRoast(move, before, after, toSq, ctx));
  }

  if (move.missedMateInN && move.missedMateInN <= 5) {
    return _emitResult(used, _missedMateRoast(move));
  }

  // Pointless / bad checks — intercept before standard handlers
  if (move.isCheck && (move.classification === "mistake" || move.classification === "inaccuracy" || move.classification === "blunder")) {
    if (Math.random() < 0.55) {
      const checkResult = _badCheckRoast(move, ctx, used);
      if (move.classification === "blunder") return _emitResultForce(used, checkResult);
      return _emitResult(used, checkResult);
    }
  }

  if (move.classification === "blunder") {
    // Blunders ALWAYS get roasted — never skip due to dedup
    return _emitResultForce(used, _blunderRoast(move, before, after, moverColor, fromSq, toSq, movedPiece, capturedPiece, summary, used, ctx));
  }

  if (move.classification === "mistake") {
    // Mistakes always get roasted too
    return _emitResultForce(used, _mistakeRoast(move, before, after, moverColor, used, ctx));
  }

  if (move.classification === "inaccuracy") {
    // Skip obvious recaptures classified as inaccuracy (e.g. recaptured with wrong piece)
    if (isRecapture && move.cpLoss < 80) return null;
    if (Math.random() > 0.4) return null;
    return _emitResult(used, _inaccuracyRoast(move, after, moverColor, used));
  }

  // Endgame-specific commentary for neutral moves
  if (ctx.isEndgame && !isRecapture && Math.random() < 0.3) {
    const endgameResult = _endgameRoast(move, after, moverColor, ctx, used);
    if (endgameResult) return _emitResult(used, endgameResult);
  }

  // Positional commentary — piece activity, space, structure (for non-recapture neutral moves)
  if (!isRecapture && !ctx.isEndgame && move.moveNumber >= 8 && Math.random() < 0.2) {
    const posResult = _positionalRoast(move, after, moverColor, ctx, used);
    if (posResult) return _emitResult(used, posResult);
  }

  // Style commentary for "good" / neutral moves that didn't trigger anything else
  if (!isRecapture && Math.random() < 0.2) {
    const style = _styleRoast(move, summary, used);
    if (style) return _emitResult(used, style);
  }

  return null;
}

/** Detect if this move is an obvious recapture on the same square the opponent
 *  just captured on — these are routine and shouldn't get commentary. */
function _isObviousRecapture(move: AnalyzedMove, summary: GameSummary): boolean {
  if (!move.isCapture) return false;
  const prevMoves = summary.moves;
  if (prevMoves.length === 0) return false;
  const lastMove = prevMoves[prevMoves.length - 1];
  // Opponent's last move was a capture, and we're taking back on the same square
  if (!lastMove.isCapture) return false;
  const lastToSq = lastMove.uci.slice(2, 4);
  const thisToSq = move.uci.slice(2, 4);
  if (lastToSq !== thisToSq) return false;
  // It's a recapture on the same square — but still interesting if it's
  // a bad recapture (high cpLoss) or involves a significantly different piece value
  if (move.cpLoss > 80) return false; // bad recapture is worth commenting on
  return true;
}

function _templateKey(text: string): string {
  // Strip move-specific text, numbers, emojis to produce a template key for dedup
  // Keep more text (80 chars) for finer-grained dedup to avoid duplicate-feeling lines
  return text
    .replace(/[KQRBN]?[a-h]?x?[a-h][1-8][+=]?[QRBN]?[+#]?/g, "_")
    .replace(/move \d+/gi, "_")
    .replace(/\d+/g, "_")
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function _emitResult(used: Set<string>, result: { text: string; annotations: MoveAnnotation }): CommentResult | null {
  const key = _templateKey(result.text);
  if (used.has(key)) return null; // skip duplicate template
  used.add(key);
  return result;
}

/** Like _emitResult but never returns null — for blunders/mistakes that MUST be roasted */
function _emitResultForce(used: Set<string>, result: { text: string; annotations: MoveAnnotation }): CommentResult {
  const key = _templateKey(result.text);
  // Still track usage, but always return the result
  used.add(key);
  return result;
}

/* ================================================================== */
/*  Roast Generators — meme edition 🔥                                  */
/* ================================================================== */

/** Build context from game history for Levy-style callbacks */
interface GameContext {
  /** e.g. "after hanging a queen 4 moves ago" */
  recentBlunder: string | null;
  /** Number of blunders by this player so far */
  playerBlunders: number;
  /** How many consecutive good/best moves this player has played */
  goodStreak: number;
  /** Was the player winning, losing, or roughly equal before this move? */
  posture: "winning" | "losing" | "equal";
  /** Did the player just throw away a big advantage recently? */
  threwAdvantage: boolean;
  /** Was the position completely lost and they're still going? */
  desperateDefense: boolean;
  /** Eval trend over last 4 player moves: total cp lost (positive = cratering) */
  evalCrater: number;
  /** Is this an endgame position? (few pieces left) */
  isEndgame: boolean;
  /** Total pieces on board */
  totalPieces: number;
  /** Did the opponent just blunder on their last move? */
  opponentJustBlundered: boolean;
  /** Opponent's last move classification */
  opponentLastClass: MoveClassification | null;
  /** How much eval the opponent just gifted (positive = gift) */
  opponentGift: number;
  /** Opening name from the game */
  opening: string | null;
  /** Was the player responding to a check? (opponent's last move was a check) */
  wasRespondingToCheck: boolean;
  /** Position is sharp: open kings, lots of tension, initiative matters */
  isSharpPosition: boolean;
  /** Player is making a slow/passive move when they should be keeping initiative */
  wastingInitiative: boolean;
  /** King safety score: 0 = safe, higher = more exposed (both sides summed) */
  kingSafetyTension: number;
}

function _getGameContext(move: AnalyzedMove, summary: GameSummary): GameContext {
  const color = move.color;
  const allMoves = summary.moves;
  const myMoves = allMoves.filter(m => m.color === color);

  // Recent blunder by this player
  let recentBlunder: string | null = null;
  for (let i = myMoves.length - 1; i >= Math.max(0, myMoves.length - 6); i--) {
    const m = myMoves[i];
    if (m.classification === "blunder") {
      const ago = myMoves.length - i;
      const what = m.hungWhat ? pn(m.hungWhat) : null;
      if (what && m.cpLoss > 200) {
        recentBlunder = ago <= 2 ? `just hung a ${what}` : `hung a ${what} ${ago} moves ago`;
      } else if (m.cpLoss > 300) {
        recentBlunder = ago <= 2 ? `just blundered badly` : `blundered ${ago} moves ago`;
      }
      break;
    }
  }

  // Count blunders by this player
  const playerBlunders = myMoves.filter(m => m.classification === "blunder").length;

  // Good streak
  let goodStreak = 0;
  for (let i = myMoves.length - 1; i >= 0; i--) {
    const cls = myMoves[i].classification;
    if (cls === "best" || cls === "great" || cls === "good" || cls === "book") goodStreak++;
    else break;
  }

  // Position evaluation posture
  const cpBefore = move.cpBefore;
  const isWhite = color === "w";
  const evalForPlayer = isWhite ? cpBefore : -cpBefore;
  let posture: "winning" | "losing" | "equal" = "equal";
  if (evalForPlayer > 200) posture = "winning";
  else if (evalForPlayer < -200) posture = "losing";

  // Threw advantage: was winning 3+ moves ago, now equal or worse
  let threwAdvantage = false;
  if (myMoves.length >= 3) {
    const earlier = myMoves[myMoves.length - 3];
    const earlierEval = isWhite ? earlier.cpBefore : -earlier.cpBefore;
    if (earlierEval > 250 && evalForPlayer < 50) threwAdvantage = true;
  }

  // Desperate defense: position is badly losing (< -400)
  const desperateDefense = evalForPlayer < -400;

  // Eval cratering: how much eval has been lost over the last 4 player moves
  let evalCrater = 0;
  if (myMoves.length >= 2) {
    const recentMy = myMoves.slice(-4);
    for (const m of recentMy) {
      evalCrater += m.cpLoss;
    }
  }

  // Endgame detection: count total pieces on the board
  let totalPieces = 0;
  try {
    const boardNow = new Chess(move.fen);
    for (const file of FILES) {
      for (const rank of RANKS) {
        const p = boardNow.get((file + rank) as Square);
        if (p && p.type !== "k") totalPieces++;
      }
    }
  } catch {}
  const isEndgame = totalPieces <= 10;

  // Opponent's last move analysis
  const oppColor = color === "w" ? "b" : "w";
  const oppMoves = allMoves.filter(m => m.color === oppColor);
  const oppLast = oppMoves.length > 0 ? oppMoves[oppMoves.length - 1] : null;
  const opponentJustBlundered = oppLast ? oppLast.classification === "blunder" : false;
  const opponentLastClass = oppLast?.classification ?? null;
  // Gift: how much eval the opponent just handed us (their cpLoss from our perspective)
  const opponentGift = oppLast ? oppLast.cpLoss : 0;

  // Was the player responding to a check? (opponent's last move gave check)
  const wasRespondingToCheck = oppLast ? oppLast.isCheck : false;

  // Position sharpness: detect open kings, high tension, initiative positions
  let kingSafetyTension = 0;
  let isSharpPosition = false;
  let wastingInitiative = false;
  try {
    const boardNow = new Chess(move.fen);
    // Check if kings are exposed (not fully castled or pawn shield broken)
    for (const kColor of ["w", "b"] as Color[]) {
      const king = findKing(boardNow, kColor);
      if (!king) continue;
      const kr = rankIdx(king);
      const kf = fileIdx(king);
      // King in the center or advanced = exposed
      if (kColor === "w" && kr >= 2) kingSafetyTension += 2;
      if (kColor === "b" && kr <= 5) kingSafetyTension += 2;
      // Count pawn shield squares
      const shieldDir = kColor === "w" ? 1 : -1;
      let shieldPawns = 0;
      for (let df = -1; df <= 1; df++) {
        const sf = kf + df;
        const sr = kr + shieldDir;
        const s = sq(sf, sr);
        if (s) {
          const p = boardNow.get(s);
          if (p && p.type === "p" && p.color === kColor) shieldPawns++;
        }
      }
      if (shieldPawns <= 1) kingSafetyTension += 2; // weak pawn shield
    }
    // High eval variance in recent moves = sharp/tactical position
    const recentAll = allMoves.slice(-6);
    const evalSwings = recentAll.filter(m => Math.abs(m.evalSwing) > 100).length;
    if (evalSwings >= 2) kingSafetyTension += 2;
    // Open position with lots of pieces = high tension
    if (totalPieces >= 16 && kingSafetyTension >= 3) isSharpPosition = true;
    if (kingSafetyTension >= 4 && !isEndgame) isSharpPosition = true;

    // Wasting initiative: position is sharp, player is winning/equal,
    // but this move is slow (pawn move on wrong side, retreat, no threat)
    if (isSharpPosition && posture !== "losing" && !move.isCapture && !move.isCheck) {
      const fromRank = parseInt(move.uci[1]);
      const toRank = parseInt(move.uci[3]);
      const isRetreat = (color === "w" && toRank < fromRank) || (color === "b" && toRank > fromRank);
      const isPawnSideline = move.pieceType === "p" && (() => {
        const pFile = fileIdx(move.uci.slice(2, 4) as Square);
        // Pawn move far from opponent's king = slow
        const oppKing = findKing(boardNow, opp(color));
        if (!oppKing) return false;
        const okf = fileIdx(oppKing);
        return Math.abs(pFile - okf) >= 3;
      })();
      if (isRetreat || isPawnSideline) wastingInitiative = true;
    }
  } catch {}

  return { recentBlunder, playerBlunders, goodStreak, posture, threwAdvantage, desperateDefense, evalCrater, isEndgame, totalPieces, opponentJustBlundered, opponentLastClass, opponentGift, opening: summary.opening ?? null, wasRespondingToCheck, isSharpPosition, wastingInitiative, kingSafetyTension };
}

function _brilliantRoast(
  move: AnalyzedMove,
  before: Chess,
  after: Chess,
  toSq: Square,
  landed: ReturnType<Chess["get"]>,
  ctx: GameContext,
): { text: string; annotations: MoveAnnotation } {
  const fromSq = move.uci.slice(0, 2);
  const baseArrows: [string, string, string][] = [[fromSq, toSq, "rgba(34, 197, 94, 0.85)"]];
  const baseMarkers: { square: string; emoji: string }[] = [{ square: toSq, emoji: "✨" }];

  // Detect threats created by this move
  const threats = detectNewThreats(before, after, move.color as Color);
  const threatStr = formatThreats(threats);
  const threatSuffix = threatStr ? ` ${threatStr}!` : "";
  // Add threat arrows to annotations
  const threatArrows: [string, string, string][] = threats
    .filter(t => (PIECE_VALUES[t.piece.type] ?? 0) >= 3)
    .slice(0, 2)
    .map(t => [t.attacker.square, t.square, "rgba(59, 130, 246, 0.65)"] as [string, string, string]);
  const allArrows: [string, string, string][] = [...baseArrows, ...threatArrows];

  // Context-aware prefix for Levy-style callbacks
  const callback = ctx.recentBlunder
    ? ` Remember when they ${ctx.recentBlunder}? Me too. But now:`
    : ctx.playerBlunders >= 3
    ? ` After ${ctx.playerBlunders} blunders this game, somehow:`
    : ctx.threwAdvantage
    ? ` They threw the game earlier, but NOW they find:`
    : "";

  const lines: (() => { text: string; annotations: MoveAnnotation })[] = [
    () => ({ text: `🤯 ${move.san}?!${callback} That's actually the best move —${threatSuffix || " WHERE has this person been hiding??"} Suspicious ngl 🕵️`, annotations: { arrows: allArrows, markers: baseMarkers } }),
    () => ({ text: `🧠 ${pn(move.pieceType, true)} to ${toSq}.${callback} The best move on the board${threatSuffix ? `, ${threatStr}` : ""}. This person has NO business playing this well at this elo 💀`, annotations: { arrows: allArrows, markers: baseMarkers } }),
    () => {
      if (move.sacrificedMaterial && landed)
        return { text: `⚡ A REAL sacrifice! ${pn(landed.type, true)} to ${toSq}. Bold. And actually CORRECT? At this elo? Google "stockfish" because I think they did 🤨🔥`, annotations: { arrows: baseArrows, markers: [{ square: toSq, emoji: "⚡" }] } };
      return { text: `🌟 ${move.san} — the only move, the hardest move, and they found it.${ctx.playerBlunders > 0 ? ` Broken clock is right twice a day I guess 🕐` : ` Even a blind squirrel finds a nut 🐿️`}`, annotations: { arrows: baseArrows, markers: baseMarkers } };
    },
    () => ({ text: `🌟 Galaxy-brain ${move.san}.${callback} The kind of move that makes you re-check the elo. Yep, still low. Just got lucky 🎲🤯`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => {
      // If the move is checkmate, skip fork detection — it's MATE, not a fork
      if (move.san.includes("#")) {
        return { text: `♟️💀 ${move.san}! CHECKMATE! They found the mate! At this elo?? I refuse to believe they calculated that. Must've been an accident 🧠✨`, annotations: { arrows: baseArrows, markers: [{ square: toSq, emoji: "♟️" }] } };
      }
      const forks = landed ? detectForks(after, toSq, { type: landed.type, color: landed.color, square: toSq }) : [];
      if (forks.length >= 2) {
        const targets = forks.map(f => `${pn(f.type)} on ${f.square}`).join(" and ");
        const forkArrows: [string, string, string][] = forks.map(f => [toSq, f.square, "rgba(34, 197, 94, 0.75)"] as [string, string, string]);
        return { text: `🍴 ${move.san} FORKS the ${targets}! Actually calculated?? At this elo?? I'm calling hacks 🕵️`, annotations: { arrows: forkArrows, markers: [{ square: toSq, emoji: "🍴" }, ...forks.map(f => ({ square: f.square, emoji: "🎯" }))] } };
      }
      return { text: `🔥 ${move.san}. Okay fine, that was disgusting. In a good way. Don't get used to it though, we all know what's coming 💀`, annotations: { arrows: baseArrows, markers: baseMarkers } };
    },
    () => ({ text: `⚡ ${move.san} goes hard.${ctx.recentBlunder ? ` WHERE was this energy when they ${ctx.recentBlunder}?? 😤` : ` But can they keep it up? Spoiler: probably not 🫠`}`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🗿 ${move.san}. Okay that was actually really good and I hate it. This isn't supposed to happen at this elo. Moving on 😤`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🤯 ${move.san}.${callback} Not gonna lie that was clean.${ctx.playerBlunders > 0 ? " But one good move doesn't make up for the rest of this game so let's not celebrate" : " But can they keep it up? Doubt it"} 🗿`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🔥 ${move.san}. Garry Chess would nod approvingly${ctx.playerBlunders > 0 ? " and then go back to being disappointed by everything else in this game" : ". Don't get used to it, the bar is still on the floor"} 💀👑`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🧠 ${move.san}.${ctx.playerBlunders >= 2 ? ` After ${ctx.playerBlunders} blunders? NOW they play well? The audacity. The RANGE of this player 🎭` : ` Objectively the best move. I'm not complimenting them, I'm complimenting Stockfish for suggesting it 🤖`}`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🤯 ${move.san}.${callback} Okay I literally had to double-check. That IS the engine's top choice. At this elo?? The simulation is glitching 🖥️💀`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `⚡ ${move.san}! ${ctx.isEndgame ? "Endgame precision out of NOWHERE." : "Middlegame brilliance."} They found the one move. THE one move.${ctx.playerBlunders > 0 ? " After all those blunders. Unbelievable 🤡" : " Still don't trust them tho 🗿"}`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🌟 ${move.san}. Hans, is that you?? Is there an earpiece under that hair?? Nobody at this elo finds that move.${callback} 🔊💀`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🧠 ${move.san}.${callback} Absolutely DISGUSTING move. In the best way. The opponent is gonna need a shower after that 🚿🔥`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🤯 ${move.san}. Even the Knook would be impressed. That's the best move on the board and they FOUND it. At THIS level. Unquestionably suspicious 🗿♞🏰`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
  ];
  return pick(lines)();
}

function _goodMoveRoast(
  move: AnalyzedMove,
  before: Chess,
  after: Chess,
  toSq: Square,
  ctx: GameContext,
): { text: string; annotations: MoveAnnotation } {
  const fromSq = move.uci.slice(0, 2);
  const goodEmojis = ["🗿", "🫠", "😤", "🤷", "😐", "💤", "🥱"];

  // Detect threats created by this move for context
  const threats = detectNewThreats(before, after, move.color as Color);
  const threatStr = formatThreats(threats);
  const threatArrows: [string, string, string][] = threats
    .filter(t => (PIECE_VALUES[t.piece.type] ?? 0) >= 3)
    .slice(0, 2)
    .map(t => [t.attacker.square, t.square, "rgba(59, 130, 246, 0.65)"] as [string, string, string]);
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(34, 197, 94, 0.7)"], ...threatArrows], markers: [{ square: toSq, emoji: pick(goodEmojis) }] };

  // Context-aware sarcasm
  const afterBlunder = ctx.recentBlunder ? ` (after they ${ctx.recentBlunder})` : "";
  const threwLine = ctx.threwAdvantage ? " Too bad the game was already over 5 moves ago" : "";

  const lines: (() => string)[] = [
    // Threat-aware lines — when the move creates real threats
    ...(threatStr ? [
      () => `🗿 ${move.san}, ${threatStr}. Fine. Whatever. I guess they know what pieces do 🫠`,
      () => `😤 ${move.san} — ${threatStr}. A move with actual PURPOSE? At this elo? Suspicious 🕵️`,
      () => `🤷 ${move.san}, ${threatStr}. They're actually making threats now instead of hanging pieces. Character development 📈`,
    ] : []),
    () => ctx.recentBlunder
      ? `🗿 ${move.san} — oh wow a normal move${afterBlunder}. Congratulations on doing the bare minimum 👏💀`
      : `🗿 ${move.san}. That's a normal move. Not gonna applaud someone for not hanging a piece 🫠`,
    () => ctx.playerBlunders >= 2
      ? `😤 ${move.san} — finally not a blunder. Only took ${ctx.playerBlunders} tries to figure out how pieces move 🗿`
      : `🤷 ${move.san}. Fine. Whatever. Can't roast this one. Moving on before I say something nice 😤`,
    () => ctx.threwAdvantage
      ? `💀 ${move.san} — sure, it's accurate now. They were winning 5 moves ago. NOW they play correctly? The barn door is OPEN, the horses are GONE 🐎🚪`
      : `😐 ${move.san}. Objectively correct. Soulless. Like a chess engine pretending to be a human. Where's the personality 🤖`,
    () => {
      if (move.isCastle) return `🏰 Castling — wow, they know the rules. Want a medal? 🎖️😤`;
      if (ctx.playerBlunders > 0 || ctx.recentBlunder) return `🗿 ${move.san}. Yeah it's good. I'm not gonna compliment them though. They know what they did earlier 💀`;
      return `🗿 ${move.san}. Yeah it's good. Not gonna compliment them though. Where's the drama? This is boring 🫠`;
    },
    () => `🤨 ${move.san}. Even Hikaru would say "okay that's fine." Not "great." Not "brilliant." Just "fine." Classic Hikaru praise 🏎️🗿`,
    () => `😤 ${move.san}. A good move. Levy would nod once and move on. No thumbnail. No red circle. Just a nod. Mid-level approval 📺🫡`,
    () => `😌 ${move.san}. Eric Rosen would play this and go "that's nice" in the most wholesome way. Meanwhile we're just trying not to fall asleep 😌💤`,
    () => {
      const dev = development(after, move.color as Color);
      if (dev.stuck.length === 0 && dev.total > 0)
        return `🫤 ${move.san} — all pieces developed. Cool. This is expected at literally any level of chess. It's like congratulating someone for tying their shoes 👟`;
      return `🗿 ${move.san}. It's fine. It's accurate. I literally do not care 🫠`;
    },
    () => `😤 ${move.san}.${afterBlunder} They played a good move. Alert the media. Stop the presses 🗞️💀`,
    () => ctx.desperateDefense
      ? `😬 ${move.san} — good move but the position is LOST. This is like rearranging deck chairs on the Titanic. Respect the fightin' spirit tho 🚢💀`
      : `🗿 ${move.san}. Behold: a move that doesn't lose material. The bar is underground and they barely cleared it 📉`,
    () => ctx.goodStreak >= 4
      ? `🤨 ${move.san} — that's ${ctx.goodStreak} good moves in a row. Okay who took over the mouse? This isn't the same person from the opening 🕵️`
      : `😤 ${move.san}. Stockfish approves. I don't care. Where's the next blunder I can roast 🫠🔥`,
    () => `🗿 ${move.san}.${threwLine || (ctx.playerBlunders > 0 ? " One good move in a sea of questionable decisions. Google 'consistency.' Holy hell" : " A perfectly normal move. My commentary energy is at 0% for this one")} 💀`,
    () => {
      if (move.isCapture) return `🤷 ${move.san} captures and it's correct. Even my dog could see that was free. Not impressed 🐕`;
      return `😐 ${move.san}. Good move. I hate it when they play well because I have nothing to say. Awkward silence 🦗`;
    },
    () => ctx.posture === "losing"
      ? `😬 ${move.san} is fine but they're still losing.${ctx.recentBlunder ? ` This game was decided when they ${ctx.recentBlunder}. Everything since is just delaying the inevitable ⏳` : " Too little too late 💀"}`
      : ctx.playerBlunders > 0
      ? `🗿 ${move.san}. Sure. Fine. Great. Can we skip to the part where they blunder again 🫠`
      : `🗿 ${move.san}. Sure. Fine. Great. Where's the content though? I need something to roast 🫠`,
    () => ctx.opponentJustBlundered
      ? `🗿 ${move.san}. Good move but let's be real, the opponent just GIFTED them this position. Hard to mess up a free gift. Hard but not impossible at this elo 🎁💀`
      : `😤 ${move.san}. Theory says this is good. Practice says I'm bored. Where's the content 🫠🗿`,
    () => ctx.isEndgame
      ? `🏁 ${move.san} in the endgame. Oh they know how pieces move! Crazy! Do they know endgame theory? LOL probably not 🗿📚`
      : `🤷 ${move.san}. A moves that screams "I have no idea what I'm doing but I'll copy what the engine says." Except they don't have an engine. Or do they 🕵️`,
    () => `🗿 ${move.san}. The Petrosian of moves. Solid, boring, and makes everyone watching want to Alt+F4. "Well done" I guess 💤`,
    () => `♟️ ${move.san}. Fischer would approve. Then again, Fischer approved of like 3 things total in his life. So. Progress? 👑🗿`,
    () => `🎩 ${move.san}. Tal would call this "boring" and sac the exchange instead. But for non-magicians? This is the right call 🪄`,
    () => `👑 ${move.san}. Morphy energy. Simple, clean, devastating. Except Morphy did this in an opera house while watching a play. Very different levels 🎭♟️`,
    () => `👑 ${move.san}. Magnus would play this while doing a crossword puzzle on his phone. For this player? It's the highlight of their chess career 🧩🗿`,
    () => `🏆 ${move.san}. This is the kind of move Magnus plays and then immediately looks bored by. Championship-level move, mortal-level excitement 👑💤`,
    () => `👑 ${move.san}. Magnus energy. Effortless. Clean. Now do it 50 more times in a row like he would. Spoiler: they won't 🗿♟️`,
    () => `😤 ${move.san}. They played a normal chess move and want applause? This is the bare minimum? Like, the FLOOR? 📉👏`,
    () => ctx.playerBlunders > 0
      ? `🗿 ${move.san}. "Don't hang pieces" ✅ "Play the best move" ❌ Somewhere in between. Mid. Ultra mid 🫠`
      : `🗿 ${move.san}. A move exists. On the board. In a game of chess. Mid. Ultra mid 🫠`,
  ];

  // Opening-aware good move commentary
  if (move.moveNumber <= 12) {
    const guide = matchOpeningGuide(ctx.opening ?? "");
    if (guide) {
      const idea = getOpeningInsight(guide, move.color as Color);
      if (idea) {
        lines.push(
          () => `📖 ${move.san} — that aligns with the ${guide.name}: "${idea}." Look at them, actually following opening principles. Suspicious 🕵️📚`,
          () => `🧠 ${move.san}. In the ${guide.name}, this follows the plan: "${idea}." Playing with purpose? In THIS economy? 🗿📖`,
        );
      }
    }
  }

  return { text: pick(lines)(), annotations: ann };
}

function _missedMateRoast(move: AnalyzedMove): { text: string; annotations: MoveAnnotation } {
  const n = move.missedMateInN!;
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(239, 68, 68, 0.85)"]], markers: [{ square: toSq, emoji: "😱" }] };
  const lines: (() => string)[] = [
    () => `💀 They had MATE IN ${n}. M-A-T-E. IN. ${n}. And they played ${move.san}?! I'm calling the police 🚨🚨`,
    () => `🫠 Mate in ${n} was RIGHT THERE. On the board. STARING at them. They chose ${move.san} instead. actual pain 😭`,
    () => `😱 HOW do you miss mate in ${n}?! The winning move is literally CHECKMATE and they played ${move.san}. I can't breathe 💀`,
    () => `🚨 Imagine having mate in ${n} and thinking "nah let me play ${move.san} and improve my position." YOUR POSITION IS MATE BRO 🗿`,
    () => `☠️ Missing mate in ${n} should be a criminal offence. ${move.san} instead of winning the game outright. suffering.jpg 😭`,
    () => `🤡 Mate in ${n} available but ${move.san} felt right apparently. It was not. It was so very not. 💀`,
    () => `⚰️ Mate blindness activated. Forced checkmate in ${n} on the board. They played ${move.san}. I need to lie down 🫠`,
    () => `💀 Mate in ${n}! MATE! IN! ${n}! But nah, ${move.san} was the move. Are you kidding ??? What the beep are you talking about man 🗿`,
    () => `😱 Google "mate in ${n}." Holy hell. They had it and played ${move.san} instead. New response just dropped: I'm in pain 😭`,
    () => `🪦 ${move.san} instead of LITERAL CHECKMATE. This person was doing PIPI in their pampers when others were learning patterns 💀🤡`,
    () => `🚨 FORCED MATE IN ${n}! And they played ${move.san}! The winning move was FREE and they chose to NOT WIN. You cannot make this up 🗿💀`,
    () => `💀 Mate in ${n}. CHECKMATE. You know, the thing you're supposed to DO in chess. ${move.san} was apparently more appealing. I literally cannot cope 😭`,
    () => `☠️ ${move.san} when there was mate in ${n}. Garry Chess invented checkmate for a REASON and they chose to IGNORE it 👑🤡`,
    () => `😱 Missing mate in ${n} is crazy. ${move.san}?? Even the Panzer of the Lake would call this one out. "Patzer misses a mate, patzer plays ${move.san}" 🐸💀`,
    () => `🤡 Mate in ${n}. They didn't see it. Of COURSE they didn't see it. Why would they see CHECKMATE when they can play ${move.san} instead. The Knook weeps 🗿♞🏰`,
    () => `😌 Mate in ${n}. Eric Rosen would have seen this instantly and said "oh that's nice" in the softest voice. This player saw it and said "nah" and played ${move.san} 💀😌`,
    () => `💀 Missing mate in ${n} is wild. Eric Rosen's chat would be screaming "MAAATE" in all caps. The streamer himself? Calm. The player who missed it? Also calm, but for worse reasons 😌🗿`,
  ];
  return { text: pick(lines)(), annotations: ann };
}

function _blunderRoast(
  move: AnalyzedMove,
  before: Chess, after: Chess,
  moverColor: Color,
  _fromSq: Square, _toSq: Square,
  movedPiece: ReturnType<Chess["get"]>,
  capturedPiece: ReturnType<Chess["get"]>,
  summary: GameSummary,
  used: Set<string>,
  ctx: GameContext,
): { text: string; annotations: MoveAnnotation } {
  const elo = summary.avgElo;
  const moveArrow: [string, string, string] = [_fromSq, _toSq, "rgba(239, 68, 68, 0.85)"];

  // 1. Early disaster
  if (move.moveNumber <= 8) {
    return { text: pickUnused([
      `🚨 Move ${move.moveNumber} and the position is already COOKED. ${move.san}?? Speedrun any% 💀`,
      `😭 Move ${move.moveNumber}. ${move.san}. The game JUST STARTED and someone's already in shambles 📉`,
      `💀 We're ${move.moveNumber} moves in and ${move.san} just ended this person's whole career. The opening lasted shorter than my attention span 🫠`,
      `🗿 ${move.san} on move ${move.moveNumber}. The chess equivalent of faceplanting at the starting line. Very cool very normal 😭`,
      `🤡 Move ${move.moveNumber} and already a blunder. This is what happens when you skip the Bongcloud prep 👑💀`,
      `😭 Move ${move.moveNumber}. ${move.san}. Even Gavin from 3rd grade would be shaking his head rn. Incredible scenes 🗿`,
    ], used), annotations: { arrows: [moveArrow], markers: [{ square: _toSq, emoji: "💀" }] } };
  }

  // 2. Hanging pieces
  const hanging = detectHanging(after, moverColor);
  if (hanging.length > 0) {
    const worst = hanging.reduce((a, b) => (PIECE_VALUES[b.type] ?? 0) > (PIECE_VALUES[a.type] ?? 0) ? b : a);
    const vName = pn(worst.type);
    const onSq = worst.square;
    const numAtt = countAttackers(after, onSq, opp(moverColor));
    // Arrow from attacker direction to hanging piece
    const hangArrows: [string, string, string][] = [moveArrow];
    try {
      const oppMvs = after.moves({ verbose: true });
      const firstAttacker = oppMvs.find(m => m.to === onSq && m.captured);
      if (firstAttacker) hangArrows.push([firstAttacker.from, onSq, "rgba(239, 68, 68, 0.7)"]);
    } catch {}
    return { text: pickUnused([
      `💀 ${move.san} and the ${vName} on ${onSq} is just SITTING there. Free. Like samples at Costco.${numAtt > 1 ? ` ${numAtt} pieces staring at it like 👀` : ""} 🆓`,
      `🤡 They played ${move.san} and left a whole ${vName} on ${onSq} up for grabs. Material DONATED to charity 🎁`,
      `☠️ The ${vName} on ${onSq}: "Am I a joke to you?" After ${move.san}? Apparently yes. RIP bozo 🪦`,
      `😭 ${move.san} — the ${vName} on ${onSq} has no friends. No defence, no compensation, just vibes fr fr 🗿`,
      `🆓 After ${move.san}, the ${vName} on ${onSq} is undefended. The opponent doesn't even need to think. It's literally free real estate 🏠`,
      `💀 ${move.san} and the ${vName} on ${onSq} is doing its best piñata impression. One hit and candy falls out 🎪🪅`,
      `🗿 ${move.san} — the ${vName} on ${onSq} is just standing there.${worst.type === "q" ? ` Oh no my queen! Eric Rosen would be SO calm about this. "Ohhhh nooo... my queen." Meanwhile the chat is on FIRE 🔥😌` : " Like a pinboard without the pin. Free material is free 🎁"}`,
      `🤡 ${move.san} and the ${vName} on ${onSq} is unprotected. Google "hanging pieces." Holy hell 🗿💀`,
      `💀 ${move.san} leaves the ${vName} on ${onSq} hanging. Levy would zoom in and go "THE ${vName.toUpperCase()}!!" in that voice. You know the voice 📢😭`,
      `🆓 ${move.san} and the ${vName} on ${onSq} is just free. Hikaru would take this without even looking. Captures captures captures 🏎️🗿`,
      `😌 ${move.san} and the ${vName} on ${onSq} is hanging. Eric Rosen energy: "Oh no... anyway." The calmest tragedy in chess history 🗿💀`,
      `🆓 After ${move.san}, the ${vName} on ${onSq} is just THERE. Free for the taking. Even Eric Rosen would stop being wholesome for a second to call this out 😌🎁`,
    ], used), annotations: { arrows: hangArrows, markers: [{ square: onSq, emoji: "🆓" }] } };
  }

  // 2b. Allows checkmate — check if any opponent response is mate
  try {
    const oppMovesForMate = after.moves({ verbose: true });
    for (const m of oppMovesForMate) {
      if (m.san.includes("#")) {
        const mateArrows: [string, string, string][] = [
          moveArrow,
          [m.from, m.to, "rgba(239, 68, 68, 0.85)"],
        ];
        return { text: pickUnused([
          `💀 ${move.san} allows ${m.san}. That's CHECKMATE. Not a fork, not a pin, not a threat. CHECKMATE. Game over. Pack it up 🪦♟️`,
          `☠️ ${move.san}?? ${m.san} is MATE. They literally allowed checkmate on the board. The kind of move that makes you uninstall 💀`,
          `🗿 ${move.san} and the opponent has ${m.san} — that's mate. CHECKMATE. The ultimate blunder. They didn't just lose material, they lost the GAME 🏁💀`,
          `😱 ${move.san} walks into ${m.san}. That's checkmate, folks. Not a fork, not a skewer — the game is LITERALLY over. Did they forget how chess works?? 🤡`,
          `🪦 After ${move.san}, the opponent has ${m.san}. Checkmate. THE END. This is not a drill. That's a real mate on the board and they walked right into it 💀🚶`,
          `💀 ${move.san}?? ${m.san} is forced mate! They basically resigned with extra steps. Even the pieces are embarrassed 😭♟️`,
          `☠️ ${move.san} allows CHECKMATE with ${m.san}. Hikaru would react with "oh it's just mate." The most casual death in chess history 🗿💀`,
          `🏁 ${move.san} and it's over. ${m.san} is checkmate. The game doesn't even continue. That's how bad this move is. Not recoverable. Not survivable. Just dead 💀🪦`,
        ], used), annotations: { arrows: mateArrows, markers: [{ square: m.to, emoji: "☠️" }] } };
      }
    }
  } catch {}

  // 3. Fork — validate forking piece is safe
  try {
    const oppMoves = after.moves({ verbose: true });
    for (const m of oppMoves) {
      // Skip checkmate moves — those are handled above, not forks
      if (m.san.includes("#")) continue;
      const sim = new Chess(after.fen());
      const res = sim.move(m);
      if (!res) continue;
      const lp = sim.get(m.to as Square);
      if (!lp) continue;
      // Check the forking piece isn't itself hanging after the fork move
      const forkSq = m.to as Square;
      const forkerVal = PIECE_VALUES[lp.type] ?? 0;
      let forkerSafe = true;
      try {
        const simMoves = sim.moves({ verbose: true });
        for (const recapture of simMoves) {
          if (recapture.to === forkSq && recapture.captured) {
            // If recapture is by a piece of lower or equal value, forker isn't safe
            const recapturerVal = PIECE_VALUES[recapture.piece] ?? 0;
            if (recapturerVal <= forkerVal) { forkerSafe = false; break; }
          }
        }
      } catch {}
      if (!forkerSafe) continue; // skip — the "fork" piece just gets captured

      const forked = detectForks(sim, forkSq, { type: lp.type, color: lp.color, square: forkSq });
      const valuable = forked.filter(f => f.type === "k" || f.type === "q" || f.type === "r");
      if (forked.length >= 2 && valuable.length >= 1) {
        // Check if fork is meaningful — skip if all targets are well-defended
        // (unless king is forked, which always forces a move)
        const kingForked = forked.some(f => f.type === "k");
        if (!kingForked) {
          let hasMeaningfulTarget = false;
          for (const target of forked) {
            const targetVal = PIECE_VALUES[target.type] ?? 0;
            // If forker is worth less than target, capturing wins material even if defended
            if (forkerVal < targetVal) { hasMeaningfulTarget = true; break; }
            // Check if target is undefended — any friendly piece (other than the target itself) defending the square?
            const friends = allPieces(sim).filter(p => p.color === target.color && p.square !== target.square);
            const isDefended = friends.some(p => isAttacking(sim, p.square, p, target.square));
            if (!isDefended) { hasMeaningfulTarget = true; break; }
          }
          if (!hasMeaningfulTarget) continue; // all targets well-defended, not a real fork
        }
        const targets = forked.map(f => `${pn(f.type)} on ${f.square}`).join(" and ");
        const forkArrows: [string, string, string][] = [
          [m.from, forkSq, "rgba(239, 68, 68, 0.85)"],
          ...forked.map(f => [forkSq, f.square, "rgba(239, 68, 68, 0.6)"] as [string, string, string]),
        ];
        const forkMarkers = [{ square: forkSq, emoji: "🍴" }, ...forked.map(f => ({ square: f.square, emoji: "🎯" }))];
        return { text: pickUnused([
          `🍴 ${move.san} walks straight into ${res.san} — a ${pn(lp.type)} fork hitting the ${targets}. Like stepping on a rake in Looney Tunes 💀`,
          `⚡ After ${move.san}, opponent plays ${res.san} and FORKS the ${targets}. Did they think the ${pn(lp.type)} was decorative?? 🗿`,
          `😱 ${move.san} allows a devastating ${pn(lp.type)} fork on ${m.to}: ${targets}. This is the "I didn't look at the whole board" special 🫠`,
          `🍴 They forked UP. ${move.san} → ${res.san} forks the ${targets}. It was at this moment they knew 😭`,
          `🍴 ${move.san} → ${res.san}. ${pn(lp.type, true)} fork on the ${targets}! Google "knight fork." Holy hell 🗿`,
          `� ${move.san} allows ${res.san} forking the ${targets}. Eric Rosen would calmly say "oh that's a fork" like he's commenting on the weather. Meanwhile: devastation ☁️🍴`,
          `�💀 After ${move.san}, the opponent has ${res.san} forking the ${targets}. True will never die! But this position will 🪦`,
        ], used), annotations: { arrows: forkArrows, markers: forkMarkers } };
      }
    }
  } catch {}

  // 4. Pin
  const pinsBefore = detectPins(before, moverColor);
  const pinsAfter = detectPins(after, moverColor);
  const newPins = pinsAfter.filter(pa => !pinsBefore.some(pb => pb.pinned.square === pa.pinned.square && pb.pinner.square === pa.pinner.square));
  if (newPins.length > 0) {
    const pin = newPins[0];
    const pinArrows: [string, string, string][] = [
      [pin.pinner.square, pin.pinned.square, "rgba(239, 68, 68, 0.8)"],
      [pin.pinned.square, pin.target.square, "rgba(239, 68, 68, 0.4)"],
    ];
    const pinMarkers = [{ square: pin.pinned.square, emoji: "📌" }];
    return { text: pickUnused([
      `📌 ${move.san} and now the ${pn(pin.pinned.type)} on ${pin.pinned.square} is PINNED to the ${pn(pin.target.type)} by the ${pn(pin.pinner.type)} on ${pin.pinner.square}. Stuck. Can't move. Just standing there like 🗿`,
      `🔒 After ${move.san}, the ${pn(pin.pinner.type)} on ${pin.pinner.square} pins the ${pn(pin.pinned.type)} on ${pin.pinned.square} to the ${pn(pin.target.type)}. That piece is a decoration now fr 🖼️`,
      `💀 ${move.san} walks into an absolute pin: ${pn(pin.pinner.type)} ${pin.pinner.square} → ${pn(pin.pinned.type)} ${pin.pinned.square} → ${pn(pin.target.type)} ${pin.target.square}. Self-handcuffing speedrun 🔒🏃`,
      `📌 ${move.san} and the ${pn(pin.pinned.type)} on ${pin.pinned.square} is PINNED. It has absorbed the adult soul of the ${pn(pin.target.type)} behind it. It cannot move. It is one with the pain 🗿💀`,
    ], used), annotations: { arrows: pinArrows, markers: pinMarkers } };
  }

  // 4b. Skewer
  const skewers = detectSkewers(after, opp(moverColor));
  if (skewers.length > 0) {
    const sk = skewers[0];
    const skArrows: [string, string, string][] = [
      moveArrow,
      [sk.attacker.square, sk.front.square, "rgba(239, 68, 68, 0.85)"],
      [sk.front.square, sk.behind.square, "rgba(239, 68, 68, 0.5)"],
    ];
    return { text: pickUnused([
      `🗡️ ${move.san} and the opponent's ${pn(sk.attacker.type)} SKEWERS the ${pn(sk.front.type)} on ${sk.front.square} through to the ${pn(sk.behind.type)} on ${sk.behind.square}! Move the big piece, lose the one behind it. Chess kebab 🍢💀`,
      `🔫 After ${move.san}, there's a nasty skewer: ${pn(sk.attacker.type)} on ${sk.attacker.square} stabs through the ${pn(sk.front.type)} to the ${pn(sk.behind.type)}. The geometry gods are ANGRY 📐😭`,
      `🗡️ ${move.san} walks into a textbook skewer — ${pn(sk.attacker.type)} ${sk.attacker.square} vs ${pn(sk.front.type)} ${sk.front.square} and ${pn(sk.behind.type)} ${sk.behind.square}. Two-for-one special 🏷️💀`,
      `🍢 ${move.san} and the ${pn(sk.front.type)} is skewered to the ${pn(sk.behind.type)}. Step aside or lose what's behind you. Either way: pain 🗿`,
    ], used), annotations: { arrows: skArrows, markers: [{ square: sk.front.square, emoji: "🗡️" }, { square: sk.behind.square, emoji: "🎯" }] } };
  }

  // 4c. Discovered attack
  {
    const disco = detectDiscoveredAttack(before, after, _fromSq, opp(moverColor));
    if (disco) {
      const discoArrows: [string, string, string][] = [
        moveArrow,
        [disco.slider.square, disco.target.square, "rgba(239, 68, 68, 0.8)"],
      ];
      return { text: pickUnused([
        `💥 ${move.san} opens up a DISCOVERED ATTACK — the ${pn(disco.slider.type)} on ${disco.slider.square} now blasts the ${pn(disco.target.type)} on ${disco.target.square}! The piece moved out of the way and BOOM 💣`,
        `🎭 After ${move.san}, a discovered attack! The ${pn(disco.slider.type)} was hiding behind the piece that just moved, and now it's aiming at the ${pn(disco.target.type)} on ${disco.target.square}. Surprise! 🎉💀`,
        `💥 ${move.san} uncorks a discovery: ${pn(disco.slider.type)} ${disco.slider.square} → ${pn(disco.target.type)} ${disco.target.square}. The chess equivalent of pulling a curtain to reveal the jumpscare 🎭😱`,
        `🎯 ${move.san} and suddenly the ${pn(disco.slider.type)} on ${disco.slider.square} has a clear shot at the ${pn(disco.target.type)}. Discovered attack. They didn't see it. We did 💀`,
      ], used), annotations: { arrows: discoArrows, markers: [{ square: disco.target.square, emoji: "💥" }] } };
    }
  }

  // 4d. Back-rank weakness (only after the opening — move 15+)
  if (move.moveNumber >= 15 && detectBackRankWeakness(after, moverColor)) {
    const king = findKing(after, moverColor)!;
    return { text: pickUnused([
      `🚪 ${move.san} and that back rank is WIDE OPEN. The king is trapped behind its own pawns with no escape. One heavy piece slides in and it's GG 💀🏰`,
      `☠️ After ${move.san}, the back rank is a death trap. King is stuck, pawns won't budge. All it takes is one check on the 8th rank and this game writes its own obituary 🪦`,
      `🏰 ${move.san} — the king's shelter just became the king's coffin. Back rank mate is LURKING. Someone didn't watch Levy's back rank video 📺💀`,
      `🚨 ${move.san} and the back rank is screaming for help. One rook slides in and it's lights out. This is the "I forgot to make luft" special 🕳️💀`,
    ], used), annotations: { arrows: [moveArrow], markers: [{ square: king, emoji: "🚨" }] } };
  }

  // 4e. Trapped piece
  if (movedPiece && isPieceTrapped(after, _toSq, moverColor)) {
    const trappedName = pn(movedPiece.type);
    return { text: pickUnused([
      `🪤 ${move.san} and the ${trappedName} on ${_toSq} is TRAPPED. No safe squares. Just standing there like it's in a glass box at a museum 🏛️💀`,
      `🔒 After ${move.san}, the ${trappedName} on ${_toSq} has nowhere to go. Every escape square is covered. That piece is a hostage now fr 😭🗿`,
      `🪤 ${move.san} parked the ${trappedName} on ${_toSq} with zero escape routes. It's not a piece anymore, it's a PRISONER 🚨💀`,
      `😱 ${move.san} and the ${trappedName} is stuck in quicksand on ${_toSq}. No safe moves. The opponent just needs to come collect it like DoorDash 🛵💀`,
    ], used), annotations: { arrows: [moveArrow], markers: [{ square: _toSq, emoji: "🪤" }] } };
  }

  // 5. Bad sacrifice — only trigger when the moved piece is worth MORE than the captured piece
  //    (e.g. queen takes pawn). Equal trades like bishop takes knight are NOT sacrifices.
  const _isTrueSacrifice = movedPiece && capturedPiece && (PIECE_VALUES[movedPiece.type] ?? 0) > (PIECE_VALUES[capturedPiece.type] ?? 0);
  if (move.sacrificedMaterial || (_isTrueSacrifice && move.cpLoss > 150)) {
    const sacWhat = movedPiece ? pn(movedPiece.type) : "piece";
    return { text: pickUnused([
      `🤡 They sacrificed the ${sacWhat} with ${move.san}! Bold! Brave! ...and terrible 💀`,
      `⚔️ SACRIFICE! Except the position doesn't justify it at ALL. ${move.san} is just losing material. This isn't Tal, this is tragedy 🎭😭`,
      `📖 "I'll sac the ${sacWhat} and get attacking chances" — narrator: there were no attacking chances 🕳️💀`,
      `🗿 ${move.san} gives up the ${sacWhat} for absolutely nothing. Kasparov could've made this work. This is not Kasparov 🤡`,
      `🤡 ${move.san} sacs the ${sacWhat}. "Trust me I saw the lines." The lines: 📊📉📉📉. You are not Tal. You are not even Petrosian doing PIPI 💀`,
      `⚔️ The ${sacWhat} has been sacrificed. Was it the Immortal Game? No. Was it even good? Also no. It's giving "I panic-clicked" energy 🗿`,
      `😌 ${move.san} sacs the ${sacWhat}. Eric Rosen would sac this piece, get a mating attack, and chat would go "OHHHH." This person sacs it and gets nothing. Very different vibe 🤡😌`,
    ], used), annotations: { arrows: [moveArrow], markers: [{ square: _toSq, emoji: "🤡" }] } };
  }

  // 6. King safety — only roast pawn moves in front of a castled king
  if (move.pieceType === "p") {
    const king = findKing(after, moverColor);
    if (king) {
      const kf = fileIdx(king);
      const castled = (moverColor === "w" ? (king === "g1" || king === "h1" || king === "b1" || king === "c1") : (king === "g8" || king === "h8" || king === "b8" || king === "c8"));
      const pawnFile = fileIdx(_toSq);
      const nearKing = Math.abs(pawnFile - kf) <= 1;
      if (castled && nearKing) {
        const ks = kingSafety(after, moverColor);
        if (ks.score < 50 && ks.issues.length > 0) {
          const issue = ks.issues[0];
          const kingMarkers = [{ square: king, emoji: "⚠️" }];
          return { text: pickUnused([
            `👑💀 ${move.san} pushes a pawn in front of the castled king — ${issue}. Weakening your own fortress. Outstanding move 🫣`,
            `🏃 ${move.san} — pushing pawns in front of your king after castling? ${issue}. The king is BEGGING you to stop 😭`,
            `🚨 ${move.san} weakens the pawn shield after castling — ${issue}. That's like removing the lock from your own front door 🗿`,
          ], used), annotations: { arrows: [moveArrow], markers: kingMarkers } };
        }
      }
    }
  }

  // 7. Development
  if (move.moveNumber > 10) {
    const dev = development(after, moverColor);
    if (dev.stuck.length >= 3) {
      return { text: pickUnused([
        `😤 ${move.san} — and there are STILL ${dev.stuck.length} pieces on the back rank: ${dev.stuck.slice(0, 2).join(", ")}. It's move ${move.moveNumber}. DEVELOP. The army is at home watching Netflix 📺💀`,
        `🛋️ After ${move.san}, the ${dev.stuck[0]} still hasn't moved. ${dev.stuck.length} pieces are just vibing on the bench at move ${move.moveNumber} 🫠`,
        `💀 ${move.san} but ${dev.stuck.length} pieces are STILL undeveloped on move ${move.moveNumber}. The position is collapsing and half the army hasn't even shown up. This is fine 🔥🐶`,
      ], used), annotations: { arrows: [moveArrow], markers: dev.stuck.slice(0, 2).map(s => ({ square: s.split(" on ")[1] ?? _toSq, emoji: "💤" })) } };
    }
  }

  // 8. Pawn structure
  const pawns = pawnIssues(after, moverColor);
  if (pawns.doubled.length >= 2 || pawns.isolated.length >= 3) {
    return { text: pickUnused([
      `🚧 ${move.san} — and the pawn structure is a war crime 🏚️${pawns.doubled.length > 0 ? ` Doubled pawns on the ${pawns.doubled[0]}.` : ""}${pawns.isolated.length > 0 ? ` ${pawns.isolated.length} isolated pawns.` : ""} Rubble, not a position 💀`,
      `🤮 After ${move.san}, look at this pawn structure.${pawns.doubled.length > 0 ? ` Doubled on ${pawns.doubled[0]}.` : ""}${pawns.isolated.length > 0 ? ` ${pawns.isolated.length} isolated pawns.` : ""} Philidor is rolling in his grave 🪦`,
    ], used), annotations: { arrows: [moveArrow], markers: [{ square: _toSq, emoji: "🚧" }] } };
  }

  // 8b. Opening principle violation — opening phase blunders with guide context
  if (move.moveNumber <= 15) {
    const guide = matchOpeningGuide(summary.opening);
    if (guide) {
      const insight = getOpeningInsight(guide, moverColor);
      const trap = getOpeningTrap(guide);
      if (insight && Math.random() < 0.5) {
        return { text: pickUnused([
          `📖💀 ${move.san} in the ${guide.name}?? The whole point of this opening is "${insight}" — and they did the OPPOSITE. Theory: ignored. Vibes: terrible 🗿`,
          `🧠💀 ${move.san} — in the ${guide.name}, you should be thinking about "${insight}." Instead they played THIS. The opening book is crying 📚😭`,
          `📖☠️ ${move.san} violates everything the ${guide.name} stands for. Key idea: "${insight}." What they did: the opposite. Incredible scenes 🤡`,
        ], used), annotations: { arrows: [moveArrow], markers: [{ square: _toSq, emoji: "📖" }] } };
      }
      if (trap && Math.random() < 0.5) {
        return { text: pickUnused([
          `🪤 ${move.san} in the ${guide.name} — and they don't even know about the ${trap.name}! ${trap.description.length > 80 ? trap.description.slice(0, 77) + "..." : trap.description} Watch out 👀💀`,
          `📖 ${move.san} plays right into potential ${guide.name} traps. The ${trap.name} is LURKING. If they don't know it, they're about to learn the hard way 🪤😭`,
        ], used), annotations: { arrows: [moveArrow], markers: [{ square: _toSq, emoji: "🪤" }] } };
      }
    }
  }

  // 9. Generic — with context-aware callbacks
  const ctxLine = ctx.goodStreak >= 4
    ? ` They had ${ctx.goodStreak} good moves in a row! And then THIS.`
    : ctx.threwAdvantage
    ? " They were WINNING and now look at this."
    : ctx.playerBlunders >= 3
    ? ` That's blunder number ${ctx.playerBlunders}. At this point it's a pattern.`
    : ctx.posture === "winning"
    ? " They were AHEAD. They were in CONTROL. And then."
    : "";
  return { text: pickUnused([
    `💀 ${move.san}. Oh no. Oh NO.${ctxLine} Position went from playable to "queue next game" 🎮🫠`,
    `😭 ${move.san} — and just like that, the advantage evaporates.${ctxLine} Poof. Gone. Reduced to atoms 🚰`,
    `☠️ Ladies and gentlemen… ${move.san}.${ctxLine} This move belongs in a museum. The Museum of Bad Decisions 🏛️💀`,
    `🗿 ${move.san}${ctx.goodStreak >= 3 ? ` after ${ctx.goodStreak} accurate moves in a row. The BETRAYAL. The absolute AUDACITY` : " was so bad the chess pieces filed a complaint. Self-sabotage fr"} 😭`,
    `😱 I physically recoiled. ${move.san}? THAT was the plan?${ctx.threwAdvantage ? " They went from winning to THIS." : ""} Rough doesn't even cover it 💀`,
    `🫠 ${move.san}.${ctxLine} The kind of move that makes you Alt+F4 and go touch grass. Gg go next 🌱`,
    `🚨 Somewhere, a chess coach just felt a disturbance in the force. ${move.san}.${ctx.playerBlunders >= 2 ? ` Blunder #${ctx.playerBlunders} btw.` : ""} In ${new Date().getFullYear()}. In this economy 💀🗿`,
    `💀 ${move.san}.${ctx.posture === "winning" ? " FROM A WINNING POSITION." : ""} Google "how to play chess." Holy hell 🤡`,
    `😭 ${move.san} — you know it's bad when even Petrosian would say "Are you kidding ??? What the beep are you talking about man" 🗿`,
    `☠️ ${move.san}.${ctxLine} That was the most AnarchyChess move I've ever seen and I literally do not care to understand the thought process behind it 💀`,
    `💀 ${move.san}.${ctxLine} Hikaru would hit us with the "captures captures captures" and just TAKE everything back. This player? They give. They only give 🗿🎁`,
    `😭 ${move.san}.${ctxLine} Levy would SCREAM at this. Like full GothamChess "THE ROOOOOK" energy except it's THE BLOOOONDER 📢💀`,
    `🤡 ${move.san}.${ctxLine} If Hikaru saw this on stream he'd just go "yeah that's not great" and move on. The DISRESPECT of the understatement 🗿🔥`,
    `💀 ${move.san}.${ctxLine} This is the kind of move Levy puts in the thumbnail with a red circle and an arrow. And we take those... views 📺🤡`,
    `🤡 ${move.san}.${ctx.playerBlunders >= 3 ? ` Blunder number ${ctx.playerBlunders}. This person is speedrunning to the lowest elo.` : " This move was doing PIPI in its pampers when good moves were being played."} Absolute scenes 🗿😭`,
    `🚨 ${move.san}.${ctx.goodStreak >= 3 ? ` AFTER ${ctx.goodStreak} GOOD MOVES?? They gave us hope and RIPPED it away.` : " Liers will kicked off... and so will this player's rating."} True will never die, but this position already did 💀`,
    `💀 ${move.san}.${ctx.threwAdvantage ? " FROM A WINNING POSITION." : ""} Levy would pause the video here and just stare into the camera for 10 seconds. That's the energy this deserves 📺😭`,
    `🗿 ${move.san}.${ctx.playerBlunders >= 2 ? ` Blunder number ${ctx.playerBlunders}.` : ""} Hikaru speed-running this position would never. He'd premove the right move in 0.1 seconds. This person took 30 seconds to find the WRONG one 🏎️💀`,
    `😌 ${move.san}.${ctxLine} Eric Rosen would look at this and go "Ohhhh nooo" in the most calm voice imaginable. Meanwhile the position is literally ON FIRE 🔥😌`,
    `💀 ${move.san}.${ctxLine} This is some Stafford Gambit victim energy. They walked right into it like an Eric Rosen highlight reel 🎯😌`,
    `🔥 ${move.san}.${ctxLine} Tal would have sacked a piece here and won. Fischer would have played the right move instantly. This person? They found the ONE move that loses 🗿♟️`,
    `💀 ${move.san}.${ctxLine} Fischer once said "I don't believe in psychology, I believe in good moves." This move believes in neither 🧠♟️`,
    `☠️ ${move.san}.${ctxLine} Morphy would have finished this game 15 moves ago with a queen sacrifice. Instead we get... this. The anti-Morphy 👑💀`,
    `🗿 ${move.san}.${ctxLine} Tal — the Magician from Riga — would NEVER. He'd sac the exchange and create chaos. This player created chaos by accident and it's THEIR chaos to suffer through 🎩🔥`,
    `⚡ ${move.san}.${ctxLine} Bobby Fischer played 20 perfectly prepared moves before his opponents even sat down. This person played 0 good moves after sitting down for 20 minutes 🕐💀`,
    `💀 ${move.san}.${ctxLine} Morphy literally played blindfolded against 8 opponents simultaneously and won them all. This person can't beat ONE person with their eyes OPEN 🙈♟️`,
    `👑 ${move.san}.${ctxLine} Magnus would resign here. Not because the position is lost — but because he'd be embarrassed to be associated with this game 🏆💀`,
    `🏆 ${move.san}.${ctxLine} Magnus literally beat a world champion while half asleep on stream. This player is FULLY awake and playing like this?? 😴💀`,
    `👑 ${move.san}.${ctxLine} Magnus retired from classical chess because he was bored. If he saw this game he'd retire from WATCHING chess too 📺🗿`,
    `🗿 ${move.san}.${ctxLine} "Are you kidding ??? What the **** are you talking about man." Petrosian WARNED us about players like this. Liers will kicked off 💀`,
    `🤡 ${move.san}.${ctxLine} This player was doing PIPI in their pampers when Petrosian was winning world championships. And they're STILL doing PIPI. On this board. Right now 👶🗿`,
    `💀 ${move.san}.${ctxLine} "True will never die" — but this position? This position is DECEASED. Petrosian copypasta energy in move form 🪦🗿`,
    `☠️ ${move.san}.${ctxLine} W)esley S)o would never play this. "Proffesionals knew how to lose and congratulate." This player doesn't know how to NOT lose 🗿🤡`,
    `🤡 ${move.san}.${ctxLine} "You was doing PIPI in your pampers when I was beating players much more stronger then you!" — Petrosian's ghost watching this game 👻🗿`,
  ], used), annotations: { arrows: [moveArrow, ...(move.bestMoveUci ? [[move.bestMoveUci.slice(0, 2), move.bestMoveUci.slice(2, 4), "rgba(34, 197, 94, 0.7)"] as [string, string, string]] : [])], markers: [{ square: _toSq, emoji: "💀" }] } };
}

function _mistakeRoast(
  move: AnalyzedMove,
  before: Chess, after: Chess,
  moverColor: Color,
  used: Set<string>,
  ctx: GameContext,
): { text: string; annotations: MoveAnnotation } {
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const moveArrow: [string, string, string] = [fromSq, toSq, "rgba(239, 183, 44, 0.85)"];

  const hanging = detectHanging(after, moverColor);
  if (hanging.length > 0) {
    const h = hanging[0];
    const hangArrows: [string, string, string][] = [moveArrow];
    try {
      const oppMvs = after.moves({ verbose: true });
      const att = oppMvs.find(m => m.to === h.square && m.captured);
      if (att) hangArrows.push([att.from, h.square, "rgba(239, 183, 44, 0.6)"]);
    } catch {}
    return { text: pickUnused([
      `😬 ${move.san} — and now the ${pn(h.type)} on ${h.square} is a little en prise. That's a "hmm" from me 🤨`,
      `⚠️ After ${move.san}, the ${pn(h.type)} on ${h.square} isn't looking too safe. I'm just saying 📉`,
    ], used), annotations: { arrows: hangArrows, markers: [{ square: h.square, emoji: "⚠️" }] } };
  }

  // Only flag pins that are NEW (didn't exist before the move)
  const pinsBefore = detectPins(before, moverColor);
  const pinsAfterMove = detectPins(after, moverColor);
  const newPins = pinsAfterMove.filter(pa => !pinsBefore.some(pb => pb.pinned.square === pa.pinned.square && pb.pinner.square === pa.pinner.square));
  if (newPins.length > 0) {
    const p = newPins[0];
    return { text: `📌 ${move.san} and the ${pn(p.pinned.type)} on ${p.pinned.square} is pinned now. Pinned pieces = sad pieces 😔🔒`, annotations: {
      arrows: [[p.pinner.square, p.pinned.square, "rgba(239, 183, 44, 0.8)"], [p.pinned.square, p.target.square, "rgba(239, 183, 44, 0.4)"]],
      markers: [{ square: p.pinned.square, emoji: "📌" }],
    } };
  }

  // Skewer
  const skewers = detectSkewers(after, opp(moverColor));
  if (skewers.length > 0) {
    const sk = skewers[0];
    return { text: pickUnused([
      `🗡️ ${move.san} leaves a skewer on the board — ${pn(sk.attacker.type)} pins the ${pn(sk.front.type)} on ${sk.front.square} through to the ${pn(sk.behind.type)}. Geometrically unfortunate 📐😬`,
      `🍢 After ${move.san}, there's a skewer: ${pn(sk.attacker.type)} ${sk.attacker.square} vs ${pn(sk.front.type)} and ${pn(sk.behind.type)}. Not great, Bob 🗿`,
    ], used), annotations: {
      arrows: [moveArrow, [sk.attacker.square, sk.front.square, "rgba(239, 183, 44, 0.8)"], [sk.front.square, sk.behind.square, "rgba(239, 183, 44, 0.4)"]],
      markers: [{ square: sk.front.square, emoji: "🗡️" }],
    } };
  }

  // Discovered attack
  {
    const disco = detectDiscoveredAttack(before, after, fromSq as Square, opp(moverColor));
    if (disco) {
      return { text: pickUnused([
        `💥 ${move.san} opens a discovered attack — ${pn(disco.slider.type)} on ${disco.slider.square} now hits the ${pn(disco.target.type)} on ${disco.target.square}. The curtain was pulled 🎭📉`,
        `🎯 After ${move.san}, the ${pn(disco.slider.type)} reveals an attack on the ${pn(disco.target.type)}. Discovered attacks: nature's way of saying "pay attention to the whole board" 🗿`,
      ], used), annotations: {
        arrows: [moveArrow, [disco.slider.square, disco.target.square, "rgba(239, 183, 44, 0.8)"]],
        markers: [{ square: disco.target.square, emoji: "💥" }],
      } };
    }
  }

  // Back-rank weakness (only after the opening — move 15+)
  if (move.moveNumber >= 15 && detectBackRankWeakness(after, moverColor)) {
    const king = findKing(after, moverColor)!;
    return { text: pickUnused([
      `🏰 ${move.san} and the back rank is looking sketchy. The king is boxed in by its own pawns. A rook invasion could be nasty 😬`,
      `⚠️ After ${move.san}, the back rank is vulnerable. Someone should make luft before it's too late 🕳️📉`,
    ], used), annotations: {
      arrows: [moveArrow],
      markers: [{ square: king, emoji: "⚠️" }],
    } };
  }

  // Trapped piece
  {
    const movedP = after.get(toSq as Square);
    if (movedP && isPieceTrapped(after, toSq as Square, moverColor)) {
      return { text: pickUnused([
        `🪤 ${move.san} and the ${pn(movedP.type)} on ${toSq} might be stuck. Not many safe squares to go to 😬🔒`,
        `🔒 After ${move.san}, the ${pn(movedP.type)} on ${toSq} is running out of escape routes. Careful — trapped pieces = lost pieces ⚠️`,
      ], used), annotations: {
        arrows: [moveArrow],
        markers: [{ square: toSq, emoji: "🪤" }],
      } };
    }
  }

  // King safety for mistakes — only pawn moves in front of castled king
  if (move.pieceType === "p") {
    const king = findKing(after, moverColor);
    if (king) {
      const kf = fileIdx(king);
      const toFile = fileIdx(move.uci.slice(2, 4) as Square);
      const castled = (moverColor === "w" ? (king === "g1" || king === "h1" || king === "b1" || king === "c1") : (king === "g8" || king === "h8" || king === "b8" || king === "c8"));
      const nearKing = Math.abs(toFile - kf) <= 1;
      if (castled && nearKing) {
        const ksBefore = kingSafety(before, moverColor).score;
        const ksAfter = kingSafety(after, moverColor);
        if (ksAfter.score < ksBefore - 15 && ksAfter.issues.length > 0) {
          return { text: `⚠️ ${move.san} pushes a pawn near the castled king — ${ksAfter.issues[0]}. Weakening your own king shelter is not the vibe 😬🫣`, annotations: {
            arrows: [moveArrow],
            markers: [{ square: king, emoji: "⚠️" }],
          } };
        }
      }
    }
  }

  if (move.bestMoveSan) {
    const ctxLine = ctx.goodStreak >= 3
      ? ` They had ${ctx.goodStreak} good moves in a row and THEN played this??`
      : ctx.threwAdvantage
      ? ` They were WINNING and chose violence against themselves.`
      : ctx.recentBlunder
      ? ` And remember, they ${ctx.recentBlunder}. Learning? Never heard of it.`
      : ctx.playerBlunders >= 3
      ? ` That's mistake number ${ctx.playerBlunders + 1} btw. I'm keeping count.`
      : "";
    return { text: pickUnused([
      `😬 ${move.san} when ${move.bestMoveSan} was right there.${ctxLine} Google "missed opportunity." Holy hell 📉`,
      `🫤 ${move.san} instead of ${move.bestMoveSan}.${ctxLine} The advantage just did a backflip off a cliff 🏔️💀`,
      `😤 ${move.san} — ${move.bestMoveSan} was right there staring them in the face.${ctxLine} "Was that really the best I could do?" No. No it wasn't 🗿`,
      `📉 ${move.bestMoveSan} was calling. They didn't answer. ${move.san} instead.${ctxLine} This is the moment where everything goes sideways 🫠`,
      `🤦 ${move.san} over ${move.bestMoveSan}.${ctxLine} That's like studying for the wrong exam fr 📚❌`,
      `🗿 ${move.san} instead of ${move.bestMoveSan}.${ctxLine} I know what ${move.bestMoveSan} is dumbass you just missed it 💀`,
      `😬 ${move.san} played, ${move.bestMoveSan} wept.${ctxLine} Are you kidding ??? What the beep are you talking about man 🗿🤡`,
      `💀 ${move.san} over ${move.bestMoveSan}.${ctxLine} Google "en passant." They didn't take the best move and the brick is incoming ⛪🧱`,
      `🫠 ${move.san}. Garry Chess invented ${move.bestMoveSan} for a reason.${ctxLine} This ain't it 👑📉`,
      `😤 ${move.san} instead of ${move.bestMoveSan}.${ctxLine} Hikaru's chat would be spamming "NOOOO" right now. And they'd be right 📢😭`,
      `😬 ${move.san} over ${move.bestMoveSan}.${ctxLine} Levy would hit us with the "ladies and gentlemen" and zoom into the position. THE MISTAKE energy 📺💀`,
      `😌 ${move.san} instead of ${move.bestMoveSan}.${ctxLine} Eric Rosen would calmly say "ohh that's unfortunate" while his chat has a meltdown. King of underreaction 😌💀`,
    ], used), annotations: { arrows: [moveArrow, ...(move.bestMoveUci ? [[move.bestMoveUci.slice(0, 2), move.bestMoveUci.slice(2, 4), "rgba(34, 197, 94, 0.7)"] as [string, string, string]] : [])], markers: [{ square: toSq, emoji: pick(["😬", "📉", "🤦", "😤", "🫤"]) }] } };
  }

  // Opening principle mistake — if we have a guide and we're in the opening
  if (move.moveNumber <= 15) {
    const guide = matchOpeningGuide(ctx.opening ?? "");
    if (guide && Math.random() < 0.35) {
      const idea = getOpeningInsight(guide, moverColor);
      if (idea) {
        return { text: pickUnused([
          `📖😬 ${move.san} — the ${guide.name} wants you to think about "${idea}" and instead they chose chaos. Opening theory is weeping 📚💀`,
          `🧠📉 ${move.san} in the ${guide.name}. Key plan: "${idea}." What they did: literally anything else. Bold strategy Cotton 🗿`,
        ], used), annotations: { arrows: [moveArrow], markers: [{ square: toSq, emoji: "📖" }] } };
      }
    }
  }

  const ctxFallback = ctx.goodStreak >= 3
    ? ` After ${ctx.goodStreak} solid moves they throw THIS at us??`
    : ctx.threwAdvantage
    ? ` They were winning btw. WERE.`
    : ctx.recentBlunder
    ? ` Reminder: they ${ctx.recentBlunder}. This is a recurring theme.`
    : ctx.playerBlunders >= 2
    ? ` Mistake ${ctx.playerBlunders + 1} of the game. The collection grows.`
    : "";
  return { text: pickUnused([
    `😬 ${move.san} — that's not it chief.${ctxFallback} The position just got a lot worse 😤`,
    `📉 ${move.san} and the position tilts.${ctxFallback} Advantage? Gone. Poof 💨`,
    `🫤 ${move.san}.${ctxFallback} The opponent should absolutely punish this. Key word: should 🤞`,
    `🤡 ${move.san}.${ctxFallback} You were doing PIPI in your pampers when good moves were right there on the board 🗿`,
    `😬 ${move.san}.${ctxFallback} New mistake just dropped. This game is the gift that keeps on giving 🎁💀`,
    `🧱 ${move.san}.${ctxFallback} Didn't take the best move. Google "brick." The punishment is severe 🗿⛪`,
    `💀 ${move.san}.${ctxFallback} Liers will kicked off... from the advantage they had. True will never die, but their lead just did 🗿`,
    `😤 ${move.san}.${ctxFallback} The Panzer of the Lake stirs. "That was bad and you should feel bad." The lake has spoken 🐸🌊`,
    `🫤 ${move.san}.${ctxFallback} Not a blunder, but a mistake. The difference? One is a car crash, the other is a fender bender. Both hurt 🚗💀`,
    `😬 ${move.san}.${ctxFallback} Every chess coach watching this just felt a sharp pain in their chest. Sympathy inaccuracy 🫀💀`,
    `🗿 ${move.san}.${ctxFallback} Average move in an above-average bad game. The adult soul trembles at this position 😭`,
    `📉 ${move.san}.${ctxFallback} The evaluation bar just twitched and NOT in the good direction 📊😬`,
    `🤦 ${move.san}.${ctxFallback} This is the type of move that gets posted on AnarchyChess with the caption "guess the elo" 🤡💀`,
    `😬 ${move.san}.${ctxFallback} Hikaru would call this "not great." Levy would call it content. I'm calling it pain 🗿🔥`,
    `📉 ${move.san}.${ctxFallback} THIS is why Levy's Guess the Elo series exists. This. Right here. This exact move 📺💀`,
    `🤡 ${move.san}.${ctxFallback} If Hikaru was reviewing this he'd just say "ehhh that's not ideal" and his chat would go WILD. Understatement king 👑🗿`,
    `😬 ${move.san}.${ctxFallback} Levy would make this the thumbnail. Red arrow. Shocked face. "HOW?!" in Impact font. We all know the format 📺🤡`,
    `🗿 ${move.san}.${ctxFallback} Hikaru wouldn't even comment on this. Just "captures captures" past it. Speed chess energy except it's speed ignoring 🏎️💨`,
    `😌 ${move.san}.${ctxFallback} Eric Rosen would go "oh no" so softly you'd think he was narrating a nature documentary. Meanwhile the position is DYING 🦆🗿`,
    `😬 ${move.san}.${ctxFallback} This is the kind of move that shows up in an Eric Rosen "traps and tricks" video — as the victim. They ARE the content 📺😌`,
    `♟️ ${move.san}.${ctxFallback} Fischer would have found the best move in 2 seconds flat. This person found the second-best move in 30 seconds. Close but no cigar 🕐🗿`,
    `🎩 ${move.san}.${ctxFallback} Tal would have sacrificed a piece here and created magic. Instead we get... a mistake. The anti-magic 🪄💀`,
    `👑 ${move.san}.${ctxFallback} Morphy retired at 22 because chess was too easy. This person should consider retiring because chess is too hard 😭♟️`,
    `👑 ${move.san}.${ctxFallback} Magnus would never. He'd play the right move, sip his coffee, and check his Fantasy Football team. All in 3 seconds ☕🏆`,
    `🏆 ${move.san}.${ctxFallback} Magnus once said he plays the best move because the other moves are "just worse." This player actively SEEKS the worse moves 🗿♟️`,
    `🗿 ${move.san}.${ctxFallback} "Are you kidding ??? What the **** are you talking about man." Even Petrosian's copypasta is more strategically sound than this move 💀`,
    `🤡 ${move.san}.${ctxFallback} This move was doing PIPI in its pampers when better moves were sitting RIGHT THERE on the board. Liers will kicked off... 🗿👶`,
    ], used), annotations: { arrows: [moveArrow, ...(move.bestMoveUci ? [[move.bestMoveUci.slice(0, 2), move.bestMoveUci.slice(2, 4), "rgba(34, 197, 94, 0.7)"] as [string, string, string]] : [])], markers: [{ square: toSq, emoji: pick(["😬", "📉", "🤡", "😤", "🗿"]) }] } };
}

function _inaccuracyRoast(
  move: AnalyzedMove,
  after: Chess,
  moverColor: Color,
  used: Set<string>,
): { text: string; annotations: MoveAnnotation } {
  const dev = development(after, moverColor);
  const pawns = pawnIssues(after, moverColor);
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const ann: MoveAnnotation = {
    arrows: [[fromSq, toSq, "rgba(168, 162, 158, 0.7)"], ...(move.bestMoveUci ? [[move.bestMoveUci.slice(0, 2), move.bestMoveUci.slice(2, 4), "rgba(34, 197, 94, 0.7)"] as [string, string, string]] : [])],
    markers: [{ square: toSq, emoji: pick(["🤷", "😑", "🫤", "😐", "💤"]) }],
  };

  const lines: (() => string)[] = [
    () => {
      if (dev.stuck.length >= 2 && move.moveNumber > 8)
        return `🤷 ${move.san} — with ${dev.stuck.length} pieces still on the back rank at move ${move.moveNumber}?? Maybe develop before you attack bro 😤📺`;
      return `🤷 ${move.san} — not the worst, not the best. Participation trophy energy 🏆`;
    },
    () => {
      if (pawns.isolated.length > 0)
        return `😑 ${move.san} — the pawn on ${pawns.isolated[0]} is now isolated. Not fatal, but annoying. Like a paper cut 🩹`;
      return `🫤 ${move.san} is a bit suboptimal. But honestly? Vibes and prayers 🙏`;
    },
    () => {
      if (move.bestMoveSan)
        return `🚶 ${move.san} instead of ${move.bestMoveSan}. Not a crime, more like jaywalking 👮‍♂️`;
      return `🤷 ${move.san} — a participation trophy moment. You tried bestie 💅`;
    },
    () => `😐 ${move.san} gives up a small edge. Could be better, but they could also have hung the queen. So, progress? 📈`,
    () => `🫤 There was something better than ${move.san}, but at this level? Nobody's gonna punish this. Probably. Hopefully 🤞`,
    () => `😑 ${move.san}. The C+ of chess moves. Not failing, but definitely not thriving 📝`,
    () => `🤷 ${move.san}. Unquestionably one of the moves in this game. I literally do not care to analyze this further 🗿`,
    () => `😑 ${move.san} — not great, not terrible. 3.6 roentgen. The Chernobyl of chess accuracy ☢️🫠`,
    () => `🫤 ${move.san}. Google "how to improve at chess." Actually, scratch that, they'd probably find AnarchyChess first 💀`,
    () => `🤷 ${move.san}. The Knook of moves — neither here nor there, just vibing in an alternate dimension 🗿♞🏰`,
    () => `😑 ${move.san}. New response just dropped and it's mid. This is exactly what ${move.san} is, dumbass — mid 🫠`,
    () => `🫤 ${move.san}. Not a blunder, not good, just... chess purgatory. The adult soul trembles 💀🗿`,
    () => `😑 ${move.san}. O Panzer of the Lake, what is your wisdom? "This move is mid." Thank you Panzer, very helpful 🐸🌊`,
    () => `🤷 ${move.san}. Hikaru would glance at this and go "ehhh" and move on. That's the energy this move deserves 🤷💤`,
    () => `🤷 ${move.san}. Levy would speed past this in a Guess the Elo and go "yeah okay whatever" without pausing. The move that gets no screentime 📺💤`,
    () => `😑 ${move.san}. This is the move Hikaru plays in bullet with 0.3 seconds left and STILL doesn't lose. For this player? It's their best idea after 45 seconds 🏎️🗿`,
    () => `🤷 ${move.san}. Even GothamChess would struggle to make this move interesting for content. "And then they played... a move" 📺🫠`,
    () => `� ${move.san}. Eric Rosen would play this move in a Stafford Gambit refusal and still somehow make it look fun. Here? It's just mid 🗿😌`,
    () => `�😐 ${move.san}. The chess equivalent of "it's fine" when someone asks how you're doing. It's not fine. But it's fine 🫠`,
    () => `🫤 ${move.san}. This move will not be remembered. By anyone. Ever. Including the person who played it 🗿💨`,
    () => `🤷 ${move.san}. Peak "I'll just develop and hope for the best" energy. The strategy of champions. And also beginners. Mostly beginners 🏆💀`,
    () => `🗿 ${move.san}. "You was doing PIPI in your pampers" — Sir that's an inaccuracy, not a blunder. But the energy? Pure PIPI 👶🤡`,
    () => `🤡 ${move.san}. Petrosian would call this move a "proffesional" inaccuracy. "W]esley 'S]o is not proffesional" but at least he wouldn't play this 🗿💀`,
    // Positional-awareness lines for inaccuracies
    () => {
      const bb = detectBadBishop(after, moverColor);
      if (bb) return `🧱 ${move.san} — and that bishop on ${bb.square} is SUFFOCATING behind ${bb.blockedPawns} same-color pawns. A bad bishop is like a co-worker who showed up but isn't doing anything 🗿📐`;
      return `🤷 ${move.san}. The chess equivalent of treading water. Not drowning, but not going anywhere either 🏊💤`;
    },
    () => {
      const myS = spaceAdvantage(after, moverColor);
      const oppS = spaceAdvantage(after, opp(moverColor));
      if (oppS - myS >= 6)
        return `📐 ${move.san} — and they're getting outspaced. The opponent controls more of the board. Chess claustrophobia setting in 🗜️🗿`;
      return `😑 ${move.san}. A move was made. I think. Hard to tell because nothing changed 🫠`;
    },
    () => {
      const pp = pawnIssues(after, moverColor);
      if (pp.passed.length > 0 && move.moveNumber >= 20)
        return `♟️ ${move.san} — they have a passed pawn on ${pp.passed[0]} but aren't doing anything with it. Passed pawns should be PUSHED. That's like, rule #1 📚🏃`;
      if (pp.doubled.length > 0)
        return `🚧 ${move.san} — and those doubled pawns on the ${pp.doubled[0]} aren't getting any prettier. Structural damage is permanent 🏚️`;
      return `🤷 ${move.san}. "Improvement" is a word. A word this player should Google 🗿📚`;
    },
  ];
  // Evaluate all thunks, then pick an unused one
  const evaluated = lines.map(fn => fn());
  return { text: pickUnused(evaluated, used), annotations: ann };
}

/* ================================================================== */
/*  Bad-Check Roasts — pointless / wrong checks get the meme treatment */
/* ================================================================== */

function _badCheckRoast(
  move: AnalyzedMove,
  ctx: GameContext,
  used: Set<string>,
): { text: string; annotations: MoveAnnotation } {
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const isBlunder = move.classification === "blunder";
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(168, 162, 158, 0.7)"]], markers: [{ square: toSq, emoji: isBlunder ? pick(["🤡", "💀", "⚰️"]) : pick(["🐸", "😏", "🤡", "🗿"]) }] };

  const ctxLine = ctx.threwAdvantage
    ? " They were WINNING btw."
    : ctx.recentBlunder
    ? ` And they ${ctx.recentBlunder}. Pattern recognition: zero.`
    : ctx.playerBlunders >= 2
    ? ` Check number who-cares in a series of bad decisions.`
    : "";

  const lines: string[] = [
    // Panzer of the Lake
    `🐸 ${move.san}. O Panzer of the Lake, what is your wisdom? "That check was wrong."${ctxLine} The lake has spoken 🗿🌊`,
    `🐸 ${move.san}+ — O Panzer of the Lake... "giving a check doesn't make it a good move, patzer."${ctxLine} Wisdom from the depths 🌊💀`,
    `🐸 ${move.san}. The Panzer of the Lake has reviewed this check and found it lacking. "Patzer sees a check, patzer gives a check."${ctxLine} 🗿🏖️`,
    // Hikaru tickle
    `😏 ${move.san}+ — just a little tickle. King's not even scared. Hikaru would call this a "nothing burger check" 🍔${ctxLine} 🗿`,
    `🤭 ${move.san}. Just tickling the king rn. A little tickle check, the king goes "hehe" and walks away.${ctxLine} Not even a threat 💅`,
    `😏 ${move.san}+ — ooh a check! The king is SO scared. Just kidding, it's a tickle. The king literally didn't flinch 🤷${ctxLine}`,
    `🏎️ ${move.san}+. Hikaru in bullet would premove past this check in 0.1 seconds. It's THAT irrelevant. King yawns and sidesteps 👑💤${ctxLine}`,
    `📺 ${move.san}+. Levy would pause here and go "WHY are we checking?? WHAT does this accomplish?" The answer: nothing.${ctxLine} Absolutely nothing 🗿`,
    // Patzer check energy
    `🤡 ${move.san}. Patzer sees a check, patzer plays a check. It's the law.${ctxLine} Unfortunately the law is wrong 💀`,
    `🗿 ${move.san}+. "Checks, captures, threats" — except this check threatens NOTHING.${ctxLine} Levy is rolling in his chair rn 📉`,
    `🤡 ${move.san}+. GothamChess voice: "Ladies and gentlemen... a POINTLESS check." I can hear the disappointment from here 📢${ctxLine} 😭`,
    `😬 ${move.san}+ and the check bounces right off.${ctxLine} The king said "lol" and moved one square 👑💨`,
    `😌 ${move.san}+. Eric Rosen would never give a useless check. When HE checks, it's checkmate in 3. This check? It's checkmate in... never. It's just bad ${ctxLine} 😌💀`,
    // Blunder-strength checks
    ...(isBlunder ? [
      `💀 ${move.san}+. Gave a check that LOST MATERIAL. The check that checked THEM right out of the game.${ctxLine} Extraordinary self-destruction 🤡🔥`,
      `🤡 ${move.san}+. A check. A blunder. A blunder-check. The worst kind of check possible — the kind that makes YOU worse.${ctxLine} Holy hell 💀`,
      `⚰️ ${move.san}+. "At least I gave check" they said, as their position crumbled to dust.${ctxLine} Google "pyrrhic check" ⛪🗿`,
    ] : [
      `😤 ${move.san}+ — checking for the sake of checking. "But it's a check!" Yeah, and it's also bad 🗿${ctxLine}`,
      `🫠 ${move.san}. The check that accomplished nothing. A move so mid even the engine sighed.${ctxLine} AnarchyChess would approve of the chaos tho 💀`,
    ]),
  ];

  return { text: pickUnused(lines, used), annotations: ann };
}

/* ================================================================== */
/*  Endgame Roasts — late-game with few pieces left                    */
/* ================================================================== */

function _endgameRoast(
  move: AnalyzedMove,
  after: Chess,
  moverColor: Color,
  ctx: GameContext,
  used: Set<string>,
): { text: string; annotations: MoveAnnotation } | null {
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(100, 160, 255, 0.7)"]], markers: [{ square: toSq, emoji: "🏁" }] };

  // Count specific pieces to detect common endgames
  const pieces: Record<string, number> = { wq: 0, bq: 0, wr: 0, br: 0, wb: 0, bb: 0, wn: 0, bn: 0, wp: 0, bp: 0 };
  try {
    for (const file of FILES) {
      for (const rank of RANKS) {
        const p = after.get((file + rank) as Square);
        if (p && p.type !== "k") {
          pieces[p.color + p.type]++;
        }
      }
    }
  } catch {}

  const myQ = moverColor === "w" ? pieces.wq : pieces.bq;
  const oppQ = moverColor === "w" ? pieces.bq : pieces.wq;
  const myR = moverColor === "w" ? pieces.wr : pieces.br;
  const oppR = moverColor === "w" ? pieces.br : pieces.wr;
  const totalNonPawns = pieces.wq + pieces.bq + pieces.wr + pieces.br + pieces.wb + pieces.bb + pieces.wn + pieces.bn;
  const myPawns = moverColor === "w" ? pieces.wp : pieces.bp;
  const oppPawns = moverColor === "w" ? pieces.bp : pieces.wp;
  const totalPawns = myPawns + oppPawns;

  // K+Q vs K — should be trivially winning
  if (myQ >= 1 && oppQ === 0 && totalNonPawns === 1 && totalPawns === 0 && ctx.posture === "winning") {
    if (move.classification === "blunder" || move.classification === "mistake") {
      return { text: pickUnused([
        `👑 K+Q vs K and they're STRUGGLING?? This is literally tutorial level. You have the QUEEN. Just push them to the edge and checkmate 💀🤦`,
        `💀 It's King and Queen versus a lone King. You had ONE job. ONE. And somehow it's going wrong 🤡👑`,
        `🫠 K+Q vs K. This should be over in like 10 moves. The fact that ${move.san} was played here is... concerning 👑💀`,
        `🤡 They have a QUEEN and can't find mate against a LONE KING. Google "how to checkmate with king and queen." Holy hell 🗿⛪`,
      ], used), annotations: ann };
    }
    return { text: pickUnused([
      `👑 K+Q vs K. This should be a formality. Should be. Let's see if they know the technique or if they'll stalemate 🫠💀`,
      `🏁 It's King and Queen vs lone King. The chess equivalent of a victory lap. Unless they mess it up. Which... wouldn't surprise me 🤡`,
      `👑 Down to K+Q vs K. At this elo the real question isn't IF they'll win, it's whether they'll accidentally stalemate 😬🗿`,
    ], used), annotations: ann };
  }

  // K+R vs K — should also be winning (but harder than K+Q)
  if (myR >= 1 && oppR === 0 && oppQ === 0 && totalNonPawns <= 1 && totalPawns === 0 && ctx.posture === "winning") {
    if (move.classification === "blunder" || move.classification === "mistake") {
      return { text: pickUnused([
        `🏰 K+R vs K. They have a whole ROOK and can't find the mate? Box method! BOOOOX METHOD! Google it please 💀📦`,
        `🤡 K+R vs K and they're failing. This is THE endgame you're supposed to learn first. Before openings. Before tactics. THIS ONE 📚🗿`,
        `💀 They have a rook advantage against a lone king and ${move.san} is the response? The box method is CRYING rn 📦😭`,
      ], used), annotations: ann };
    }
    return { text: pickUnused([
      `🏰 K+R vs K. The classic endgame. Do they know the box method or are they going to chase the king around like a dog chasing a car? 🐕📦`,
      `🏁 Rook endgame vs lone King. Time for the box method. Or, more likely, time for 50 random rook moves and a lucky checkmate 🗿🏰`,
    ], used), annotations: ann };
  }

  // General endgame lines
  const lines: string[] = [];

  if (ctx.posture === "winning" && (move.classification === "blunder" || move.classification === "mistake")) {
    lines.push(
      `🏁 Endgame. Winning position. ${move.san}. They're trying to snatch defeat from the jaws of victory. Classic endgame technique: none 💀`,
      `📉 In the endgame with an advantage and they play ${move.san}?? You had ONE JOB: don't blunder. The job was failed successfully 🤡`,
      `🫠 ${move.san} in a winning endgame. "I'll just convert my advantage" — narrator: they did not convert 💀📉`,
      `😤 ${move.san}. Winning endgame + panicking = this move. Precision? Never heard of her 🗿`,
    );
  }

  // Passed pawn commentary
  const myPassed = passedPawnInfo(after, moverColor);
  const oppPassed = passedPawnInfo(after, opp(moverColor));
  if (myPassed.length > 0) {
    const best = myPassed.reduce((a, b) => b.rank > a.rank ? b : a);
    if (best.rank >= 4) {
      const promoRank = moverColor === "w" ? "8" : "1";
      lines.push(
        `♟️ That passed pawn on ${best.square} is DANGEROUS. ${7 - best.rank} squares from promotion. ${best.supported ? "AND it's supported!" : "But it's unsupported — one blockade and it's stuck."} The endgame is all about this pawn now 🏃💨`,
        `🏃 Passed pawn on ${best.square} is marching toward ${best.square[0]}${promoRank}! ${best.connected ? "Connected and deadly." : "Lone ranger but still scary."} Do they know to push it? Probably not at this elo 🗿♟️`,
      );
    } else if (myPassed.length >= 2) {
      lines.push(
        `♟️ ${myPassed.length} passed pawns! In an endgame! That's a LOT of promotion candidates. The question is whether they know what to DO with them 🗿📚`,
        `🏃 Multiple passers on the board. Endgame theory says these should win. Practice says these players will find a way to mess it up 💀♟️`,
      );
    }
  }
  if (oppPassed.length > 0) {
    const best = oppPassed.reduce((a, b) => b.rank > a.rank ? b : a);
    if (best.rank >= 4 && move.classification !== "best" && move.classification !== "great") {
      lines.push(
        `🚨 The opponent has a passed pawn on ${best.square} and it's ${7 - best.rank} squares from queening! ${move.san} doesn't address this AT ALL. In endgames, passed pawns are PUBLIC ENEMY #1 🗿💀`,
        `♟️ Opponent's passer on ${best.square} is RUNNING. ${move.san} ignores it completely. Has anyone told them about blockades? Or general awareness? 😬🏃`,
      );
    }
  }

  // King activity commentary
  const myKingActivity = kingCentralization(after, moverColor);
  const oppKingActivity = kingCentralization(after, opp(moverColor));
  if (move.pieceType === "k" && myKingActivity.score >= 3) {
    lines.push(
      `👑 King marches to the center! FINALLY showing some endgame knowledge. Active king = winning king. Capablanca would nod approvingly 🧠👑`,
      `🏃 King centralization! THIS is what you're supposed to do in endgames. The king becomes a PIECE. One of the few correct endgame decisions this game 👑💪`,
    );
  } else if (myKingActivity.score <= 1 && oppKingActivity.score >= 3 && totalNonPawns <= 4) {
    lines.push(
      `👑 Their king is hiding in the corner while the opponent's king is CENTRALIZED. In the endgame, the king needs to be ACTIVE. It's not a bishop, it can go anywhere! 🗿😤`,
      `🏰 King stuck on the edge while the opponent's king owns the center. Endgame 101: centralize your king. They skipped that lecture 📚💀`,
    );
  }

  // Opposite-color bishops = drawish tendency
  if (hasOppositeColorBishops(after) && totalPawns <= 4) {
    lines.push(
      `🎨 Opposite-colored bishops endgame! This is famously drawish. Even with extra pawns, converting is PAIN. The bishops literally can't interact with each other 🤝💤`,
      `🖌️ Opposite bishop colors. The great equalizer in chess. Even if one side is "winning," these endgames are the cockroaches of chess — they refuse to die as wins 🪳🗿`,
    );
  }

  // Material imbalance commentary
  const imbalance = materialImbalance(after);
  const myColor = moverColor === "w" ? "w" : "b";
  if (imbalance.bishopPair[myColor] && !imbalance.bishopPair[myColor === "w" ? "b" : "w"] && totalPawns > 0) {
    lines.push(
      `🎯 They have the BISHOP PAIR in the endgame. Two bishops are worth more than bishop+knight in open positions. Do they know how to use it? That's the million-dollar question 🤑🗿`,
    );
  }
  if (imbalance.exchangeSac === moverColor) {
    lines.push(
      `♟️ Playing without the exchange (rook for minor piece). Bold. Petrosian famously loved exchange sacrifices. Is this a Petrosian-level positional decision or a "I blundered my rook earlier" situation? 🗿👑`,
    );
  }

  if (totalPawns > 0 && totalNonPawns <= 2) {
    lines.push(
      `🏁 We're in the endgame now. ${ctx.totalPieces} pieces left. Every tempo matters. Every pawn push is a decision. Do they know that? Probably not 🫠`,
      `♟️ Pawn endgame territory. This is where "chess is 99% tactics" meets "I don't know any endgame theory" 💀📚`,
      `🏁 ${move.san} — endgame chess. The board is clearing out. Time for technique. Or, more likely, time for suffering 🗿♟️`,
    );
  }

  if (totalPawns === 0 && totalNonPawns <= 4) {
    lines.push(
      `🏁 No pawns left. This is pure technique now. The kind of endgame that separates the prepared from the clueless 📚💀`,
      `🧹 Board is almost clean. ${ctx.totalPieces} pieces left. This is the "did you study endgames or did you skip that chapter" test 🗿📖`,
    );
  }

  if (ctx.desperateDefense) {
    lines.push(
      `⚰️ ${move.san} — endgame and losing. At this point they're playing for the stalemate trick. Which at this elo might actually work 🤞💀`,
      `🏳️ Losing endgame, fighting on. Respect the grind but the engine says it's over. The adult soul trembles 🗿😭`,
    );
  }

  if (lines.length === 0) {
    lines.push(
      `🏁 Endgame time. ${ctx.totalPieces} pieces left. Precision mode activated. Or it should be 🎯🫠`,
      `🧹 The board is thinning out. Every move matters more now. ${move.san} continues the endgame. Will it be technique or tears? 💀`,
      `🏁 ${move.san} in the endgame. At this level, endgames are won by whoever blunders last. May the best blunderer win 🤡🏆`,
      `🏁 Endgame chess. Hikaru would convert this in his sleep. These players? They're about to turn a winning endgame into modern art 🏎️🎨`,
      `🏁 ${move.san}. Levy always says "endgame technique is what separates elo brackets." This endgame is about to PROVE that 📺📉`,
    );
  }

  return { text: pickUnused(lines, used), annotations: ann };
}

/* ================================================================== */
/*  Check-Response Roasts — commentary when responding to a check      */
/* ================================================================== */

function _checkResponseRoast(
  move: AnalyzedMove,
  ctx: GameContext,
  used: Set<string>,
): { text: string; annotations: MoveAnnotation } | null {
  const cls = move.classification;
  const isBad = cls === "blunder" || cls === "mistake" || cls === "inaccuracy";
  const isGood = cls === "best" || cls === "great" || cls === "brilliant";

  if (isBad) {
    const lines = [
      `⚠️ They were in CHECK and played ${move.san}?? Of all the ways to escape check, they chose the WORST one 💀`,
      `👑 The king is under attack and ${move.san} is the response? The panic is palpable. Like choosing the fire exit that leads to more fire 🔥🚪`,
      `😨 Under check and ${move.san} is the answer. Fight or flight kicked in — and they chose "freeze" 🧊🗿`,
      `💀 Check on the board. Adrenaline pumping. And they play ${move.san}. The wrong response under pressure. Classic 😤`,
      `⚠️ ${move.san} to escape check. Bold strategy. Wrong strategy. But bold 🗿💀`,
      `😭 They were in check and panicked into ${move.san}. The king said "save me!" and the player said "how about I make it worse?" 👑💀`,
      `🫠 Check! Quick, do something! ${move.san}! ...that was the wrong something. Panic mode: activated. Accuracy: not found 🔍`,
      `👑 Under check pressure and ${move.san} crumbles. Fischer said "I don't believe in psychology" — this player believes in PANIC 😱🗿`,
    ];
    if (cls === "blunder" && move.cpLoss > 200) {
      lines.push(
        `💀 IN CHECK and they blundered ${move.cpLoss > 500 ? "the entire game" : "hard"} with ${move.san}. The king was screaming for help and got... this 👑😭`,
        `🆘 Check! Emergency! 911! And ${move.san} is the emergency response?? Send a better player, this one's broken 🚨💀`,
      );
    }
    return { text: pickUnused(lines, used), annotations: { arrows: [], markers: [] } };
  }

  if (isGood && Math.random() < 0.4) {
    const lines = [
      `👑 Under check and ${move.san} — cool, calm, collected. The king lives to fight another day 🛡️`,
      `⚡ Check! And ${move.san} is the perfect response. No panic, just precision. Respect 🗿✅`,
      `🛡️ They were in check but handled it like a pro. ${move.san} — composure under fire 🔥👑`,
      `👑 ${move.san} out of check. Smooth escape. The king barely broke a sweat 😎🛡️`,
    ];
    return { text: pickUnused(lines, used), annotations: { arrows: [], markers: [] } };
  }

  return null;
}

/* ================================================================== */
/*  Opponent Gift Roasts — when they fail to capitalize on gifts       */
/* ================================================================== */

function _opponentGiftRoast(
  move: AnalyzedMove,
  ctx: GameContext,
  used: Set<string>,
): { text: string; annotations: MoveAnnotation } | null {
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const giftSize = ctx.opponentGift > 500 ? "MASSIVE" : ctx.opponentGift > 300 ? "huge" : "nice";
  const isMiss = move.classification === "mistake" || move.classification === "inaccuracy" || move.classification === "blunder";
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(255, 200, 50, 0.7)"]], markers: [{ square: toSq, emoji: isMiss ? "🤡" : "🎁" }] };

  const lines: string[] = [];

  if (isMiss) {
    lines.push(
      `🎁 The opponent just BLUNDERED and they respond with... ${move.san}?? A ${giftSize} gift was sitting right there and they didn't unwrap it 💀🤦`,
      `🤡 Opponent handed them free material on a silver platter. They responded with ${move.san}. THEY DIDN'T TAKE THE GIFT. I'm in physical pain 😭💀`,
      `🎁 A ${giftSize} blunder by the opponent! The eval shifted! And ${move.san} doesn't capitalize AT ALL. Two people who don't want to win this game 🤝🗿`,
      `💀 The opponent just threw. Like, THREW threw. And ${move.san} completely ignores it. It's like finding money on the ground and walking past it 🫠💸`,
      `🤡 Both players are competing to see who can lose FASTER. Opponent blunders, they play ${move.san} instead of punishing. This is art. Bad art, but art 🎨💀`,
      `😤 THE OPPONENT GIFT-WRAPPED MATERIAL FOR THEM. ${move.san} just... didn't take it. At this point they BOTH deserve to lose 🗿`,
    );
  } else {
    lines.push(
      `🎁 Opponent just blundered and ${move.san} is... fine? They took the gift but didn't even say thank you. Missed the refutation but at least didn't make it worse 🤷`,
      `😏 The opponent made a ${giftSize} mistake and they played ${move.san}. Not bad, not the best punishment. Like catching someone stealing and just giving them a stern look 👀🗿`,
      `🎁 Opponent slipped up! ${move.san} is acceptable but the REAL punishment was right there. They chose mercy. Or ignorance. Same energy at this elo 💀`,
    );
  }

  return { text: pickUnused(lines, used), annotations: ann };
}

/* ================================================================== */
/*  Momentum / Eval Cratering Roasts                                   */
/* ================================================================== */

function _momentumRoast(
  move: AnalyzedMove,
  ctx: GameContext,
  used: Set<string>,
): { text: string; annotations: MoveAnnotation } | null {
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(239, 68, 68, 0.6)"]], markers: [{ square: toSq, emoji: "📉" }] };

  const crater = Math.round(ctx.evalCrater / 100); // in pawns

  const lines: string[] = [
    `📉 The eval has dropped ${crater} pawns over the last few moves. The graph looks like a cliff dive. Is this chess or base jumping? 🪂💀`,
    `📊 Losing ${crater} pawns of eval in just a few moves. The position is in FREEFALL. Someone grab a parachute 🪂😭`,
    `📉 Eval cratering HARD. Down ${crater} pawns recently. This is the chess equivalent of watching your stocks on a Monday morning 📊💀`,
    `🗿 The evaluation bar is PLUMMETING. ${crater} pawns gone in a few moves. At this rate they'll be losing by the time I finish this sentence 📉`,
    `😭 The position was fine a few moves ago. NOW look at it. ${crater} pawns worse. The collapse is real and it's spectacular 🏚️💀`,
    `📉 ${crater} pawns of advantage deleted over the last few moves. That's not a loss, that's a speedrun to resignation 🏃💨`,
    `📊 The eval chart for this player looks like a ski slope. Downhill. Fast. No stopping. ${crater} pawns gone 🎿💀`,
    `😤 Do they know the eval is cratering? ${crater} pawns lost recently. At this point even Stockfish is looking away 🤖😬`,
    `📉 ${crater} pawns of eval GONE. Hikaru's chat would be spamming "RESIGN" in all caps rn. And they'd be right 🏎️😭`,
    `📊 The eval is in FREEFALL. ${crater} pawns gone. Levy would pause the video and do the disappointed head shake. You know the one 📺😔`,
  ];

  return { text: pickUnused(lines, used), annotations: ann };
}

/* ================================================================== */
/*  Tempo / Initiative Roasts — slow moves in sharp positions          */
/* ================================================================== */

function _tempoRoast(
  move: AnalyzedMove,
  ctx: GameContext,
  used: Set<string>,
): { text: string; annotations: MoveAnnotation } | null {
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const ann: MoveAnnotation = {
    arrows: [[fromSq, toSq, "rgba(239, 183, 44, 0.7)"]],
    markers: [{ square: toSq, emoji: pick(["🐌", "⏳", "🕐", "💤"]) }],
  };

  const isRetreat = (() => {
    const fromRank = parseInt(move.uci[1]);
    const toRank = parseInt(move.uci[3]);
    return (move.color === "w" && toRank < fromRank) || (move.color === "b" && toRank > fromRank);
  })();

  const isPawnGrab = move.pieceType === "p" && !move.isCapture;
  const posDesc = ctx.kingSafetyTension >= 5
    ? "kings are EXPOSED and the position is on fire"
    : ctx.kingSafetyTension >= 3
    ? "both sides have weakened king positions"
    : "the position is tense and tactical";

  const lines: string[] = [];

  if (isRetreat) {
    lines.push(
      `🐌 ${move.san} — RETREATING when ${posDesc}?? This is a position where you need to ATTACK, not run backwards! The initiative is slipping away like sand through fingers ⏳💀`,
      `⏳ ${move.san} is a backwards move in a sharp position. The ${posDesc} and they're... retreating? The tempo gods are WEEPING 😤🔥`,
      `🕐 ${move.san}. Pulling back when the position is this sharp. That's not playing safe, that's giving the opponent a free turn. Tempo = life here 💀🐌`,
      `💤 ${move.san} goes BACKWARDS. ${posDesc.charAt(0).toUpperCase() + posDesc.slice(1)} but they chose this moment to retreat?? Initiative deleted. Tempo wasted. Pain 😭⏳`,
      `🐢 ${move.san} retreats when the position is SCREAMING for action. ${posDesc.charAt(0).toUpperCase() + posDesc.slice(1)} — this is the moment you go all in, not turtle up 🐌💀`,
      `⏳ ${move.san}. Levy would be screaming "ATTACK THE KING" at his monitor rn. Instead they went backwards. In THIS position. With ${posDesc}. Incredible 📺💀`,
    );
  } else if (isPawnGrab) {
    lines.push(
      `🐌 ${move.san} — grabbing pawns while ${posDesc}?? Priorities check: pawns are worth 1 point. Kings are worth THE ENTIRE GAME 👑💀`,
      `⏳ ${move.san} — pushing a sideline pawn when ${posDesc}. That's like reorganizing your bookshelf while your house is on fire 🔥📚`,
      `💤 ${move.san}. A quiet pawn move. When the position is this sharp. When ${posDesc}. This is the "I don't see the danger" special 🫠🐌`,
      `🐢 ${move.san} pushes a pawn on the wrong side of the board. Meanwhile ${posDesc}. Speed of the position says ATTACK — they said "nah, I'll push a pawn" 🗿⏳`,
      `😴 ${move.san}. Pawn push on the flank while ${posDesc}. Hikaru plays h4 in bullet because he CALCULATES it first. This player just... went for it 🏎️😴`,
      `⏳ ${move.san}. "When you see a good move, look for a better one." They saw a pawn push. There was definitely something better. With ${posDesc}, TEMPO IS EVERYTHING 🐌💀`,
    );
  } else {
    lines.push(
      `🐌 ${move.san} — a slow move in a FAST position. ${posDesc.charAt(0).toUpperCase() + posDesc.slice(1)} and THIS is the response? The tempo is gone now. It's gone 💨😭`,
      `⏳ ${move.san}. Position requires URGENCY — ${posDesc} — but this move has zero initiative. Like bringing a pillow to a knife fight 🛋️⚔️`,
      `🕐 ${move.san} wastes precious tempo. ${posDesc.charAt(0).toUpperCase() + posDesc.slice(1)}, and every move needs to be a threat. This one... isn't 🐌💀`,
      `💤 ${move.san}. In speed chess analysis we talk about "fast" vs "slow" positions. This position is FAST. This move is GLACIAL. Mismatch 🧊🔥`,
      `⏳ ${move.san} — no check, no capture, no threat. In a position where ${posDesc}. Stockfish probably has like 4 forcing moves here and they chose... this 🗿😤`,
      `🐌 ${move.san}. The position has that "someone's about to get mated" energy but they're making quiet moves. Read the room, bro 🫠🔥`,
    );
  }

  return { text: pickUnused(lines, used), annotations: ann };
}

/* ================================================================== */
/*  Positional Roasts — piece activity, space, structure, imbalance    */
/* ================================================================== */

function _positionalRoast(
  move: AnalyzedMove,
  after: Chess,
  moverColor: Color,
  ctx: GameContext,
  used: Set<string>,
): { text: string; annotations: MoveAnnotation } | null {
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(100, 160, 255, 0.7)"]], markers: [{ square: toSq, emoji: pick(["🧠", "📐", "🗿", "📊"]) }] };

  const lines: string[] = [];

  // Bad bishop detection
  const badBishop = detectBadBishop(after, moverColor);
  if (badBishop && Math.random() < 0.5) {
    lines.push(
      `🧱 That bishop on ${badBishop.square} is BAD — ${badBishop.blockedPawns} of their own pawns are on the same color squares. It's basically a tall pawn. The bishop is TRAPPED behind its own team 🗿📐`,
      `😤 Bishop on ${badBishop.square}: blocked by ${badBishop.blockedPawns} friendly pawns on the same color. This bishop isn't a piece, it's a wall decoration. Either trade it or fix the pawn structure 🖼️💀`,
      `🧠 The bishop on ${badBishop.square} has ${badBishop.blockedPawns} friendly pawns blocking its diagonals. That's not a bishop, that's a prisoner. Free my boy 🔒🗿`,
    );
  }

  // Space advantage / cramped position
  const mySpace = spaceAdvantage(after, moverColor);
  const oppSpace = spaceAdvantage(after, opp(moverColor));
  if (oppSpace - mySpace >= 8 && !ctx.isEndgame) {
    lines.push(
      `📐 They're getting SQUEEZED. The opponent controls way more space on the board. Their pieces have nowhere to maneuver — it's like playing chess in a closet 🧳🗿`,
      `🗜️ Space disadvantage is REAL. The opponent's pieces have room to breathe while these pieces are stacked on top of each other. Cramped positions = suffering. And they're suffering 📊💀`,
      `📐 The opponent has a huge space advantage. Every piece placement is awkward. Every plan is restricted. This is positional chess torture and they walked right into it 🗿🧱`,
    );
  } else if (mySpace - oppSpace >= 8 && !ctx.isEndgame && move.classification !== "blunder" && move.classification !== "mistake") {
    lines.push(
      `📐 Look at that space advantage! Their pieces have room to maneuver while the opponent is CRAMPED. If they can maintain this, the position plays itself 💪📊`,
      `🧠 Dominating the board spatially. Pieces have freedom, the opponent is restricted. This is the kind of positional advantage Petrosian would approve of. "Proffesionals" know about space 🗿👑`,
    );
  }

  // Central control commentary
  const myCenter = centralControl(after, moverColor);
  const oppCenter = centralControl(after, opp(moverColor));
  if (oppCenter.controlled >= 3 && myCenter.controlled <= 1 && !ctx.isEndgame && move.moveNumber >= 8) {
    lines.push(
      `🎯 The opponent OWNS the center. ${oppCenter.controlled}/4 central squares controlled vs ${myCenter.controlled}/4. The center is the heart of chess and they just handed it over. Cardiology needed 🫀💀`,
      `📐 Zero central presence while the opponent has ${oppCenter.controlled} central squares. The pieces are going to trip over each other trying to find squares. Central control = piece activity = advantages. They have none 🗿`,
    );
  }

  // Material imbalance — bishop pair, exchange sac
  if (!ctx.isEndgame) {
    const imbalance = materialImbalance(after);
    const myColor = moverColor === "w" ? "w" : "b";
    const oppColor2 = moverColor === "w" ? "b" : "w";
    if (imbalance.bishopPair[myColor] && !imbalance.bishopPair[oppColor2]) {
      if (Math.random() < 0.3) {
        lines.push(
          `🧠 They have the BISHOP PAIR. In open positions, two bishops are a WEAPON. Do they know how to open the position and let them breathe? Or will they block them behind pawns? The eternal question 📐🗿`,
          `🎯 Bishop pair vs knight+bishop. Positionally, this is an advantage — IF the position opens up. If it stays closed, those bishops might as well be pawns. Let's see what happens 🧠💀`,
        );
      }
    }
    if (imbalance.rookVsMinors === moverColor && Math.random() < 0.4) {
      lines.push(
        `♜ Rook vs two minor pieces! Material says equal-ish, but the two minors usually dominate in the middlegame. The rook needs OPEN FILES to compete. Do they have any? 🗿📐`,
      );
    }
  }

  // Passed pawn awareness in middlegame (not just endgame)
  if (!ctx.isEndgame && move.moveNumber >= 20) {
    const myPassed = passedPawnInfo(after, moverColor);
    const advancedPassers = myPassed.filter(p => p.rank >= 4);
    if (advancedPassers.length > 0) {
      const p = advancedPassers[0];
      lines.push(
        `♟️ That passed pawn on ${p.square} is getting IDEAS. ${p.supported ? "Supported and advancing." : "Needs support ASAP."} Even in the middlegame, advanced passers can decide games. Push it or protect it — just don't FORGET about it 🏃🗿`,
      );
    }
  }

  if (lines.length === 0) return null;
  return { text: pickUnused(lines, used), annotations: ann };
}

/* ================================================================== */
/*  Time-Based Roasts — when clock data reveals suspicious speed       */
/* ================================================================== */

function _timeRoast(
  move: AnalyzedMove,
  ctx: GameContext,
  used: Set<string>,
): { text: string; annotations: MoveAnnotation } | null {
  const timeSpent = move.timeSpent;
  if (timeSpent === null) return null;

  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(100, 200, 255, 0.6)"]], markers: [{ square: toSq, emoji: "⏱️" }] };

  const isBlunder = move.classification === "blunder";
  const isMistake = move.classification === "mistake";
  const isGood = move.classification === "best" || move.classification === "great" || move.classification === "brilliant";
  const isCritical = Math.abs(move.cpBefore) < 200; // position was roughly equal = critical moment

  // Fast move on critical/important position
  if (timeSpent <= 2 && isCritical && (isBlunder || isMistake)) {
    return { text: pickUnused([
      `⏱️ ${timeSpent}s on this move. ${timeSpent} SECONDS on the most important position of the game. And they blundered. THINK. USE YOUR TIME 💀⏰`,
      `⚡ Played ${move.san} in ${timeSpent} seconds. In a critical position. And it's a ${move.classification}. Maybe try using more than 0.1% of your clock 🗿⏱️`,
      `⏱️ ${timeSpent}s. The position was balanced. This was THE moment to think. They speedran to a ${move.classification} instead. Outstanding clock management 🤡`,
      `💀 ${move.san} after ${timeSpent} seconds of "thought." The position required DEEP calculation and they treated it like they were late for dinner 🍽️⏰`,
      `⏱️ ${timeSpent} seconds. Critical moment. ${move.classification}. The three horsemen of low elo chess. The fourth horseman is time trouble, and they're not even IN time trouble 🐴💀`,
    ], used), annotations: ann };
  }

  // Fast move on a blunder in general
  if (timeSpent <= 3 && isBlunder) {
    return { text: pickUnused([
      `⏱️ ${timeSpent}s and a blunder. Speed ≠ accuracy, folks. They moved faster than their brain could process 🧠💨`,
      `⚡ ${move.san} in ${timeSpent} seconds. The confidence. The speed. The blunder. All happening at once 🤡⏱️`,
      `⏱️ Premoved a blunder? Or just didn't think? ${timeSpent}s on ${move.san}. Either way: pain 💀`,
    ], used), annotations: ann };
  }

  // Super long think and still blundered
  if (timeSpent >= 60 && (isBlunder || isMistake)) {
    return { text: pickUnused([
      `⏱️ ${Math.round(timeSpent)}s of thinking... and THAT was the conclusion? ${move.san}? They burned over a minute for a ${move.classification}. The think tank has failed 💀🧠`,
      `🤯 Over a MINUTE of thinking and they played ${move.san}. A ${move.classification}. What were they calculating in there?? Their grocery list?? 🛒😭`,
      `⏱️ ${Math.round(timeSpent)} seconds on the clock used up for... ${move.san}. A ${move.classification}. All that time invested and the return was NEGATIVE 📉⏰`,
      `💀 They thought for ${Math.round(timeSpent)} seconds. Over a minute. And produced a ${move.classification}. The chess clock is just decoration at this point ⏱️🗿`,
    ], used), annotations: ann };
  }

  // Long think on an obvious move
  if (timeSpent >= 45 && isGood && move.cpLoss <= 5) {
    return { text: pickUnused([
      `⏱️ ${Math.round(timeSpent)} seconds for ${move.san}?? It's the only good move and it took them THAT long to see it 🗿⏰`,
      `😤 ${Math.round(timeSpent)}s to find the obvious move. At least they found it I guess. The clock is crying though ⏱️😭`,
      `⏱️ Over ${Math.round(timeSpent / 10) * 10} seconds on a move Stockfish finds in 0.01s. But sure, take your time. Not like the clock matters 🤖⏰`,
    ], used), annotations: ann };
  }

  // Instant premove energy on a normal move
  if (timeSpent <= 1 && !isBlunder && !isMistake) {
    if (Math.random() < 0.15) {
      return { text: pickUnused([
        `⚡ ${move.san} at LIGHT SPEED. ${timeSpent}s. Either a premove or they're channeling their inner Hikaru. Naka would be proud 🏎️💨`,
        `⏱️ ${timeSpent}s. Premove energy. Confidence is high. Whether it's justified is another question entirely 🗿⚡`,
      ], used), annotations: ann };
    }
    return null;
  }

  return null;
}

/* ================================================================== */
/*  Play-Style Commentary (aggression / passivity / trading sprees)     */
/* ================================================================== */

type PlayStyle = "aggressive" | "passive" | "trading" | null;

function _detectStyle(move: AnalyzedMove, summary: GameSummary): PlayStyle {
  const color = move.color;
  // Get recent moves by this player (last 4 of their moves)
  const myMoves = summary.moves.filter(m => m.color === color);
  const recent = myMoves.slice(-4);
  if (recent.length < 3) return null;

  // Trading spree: 3+ consecutive captures by this player
  const lastCaptures = [...recent].reverse();
  let capStreak = 0;
  for (const m of lastCaptures) {
    if (m.isCapture) capStreak++;
    else break;
  }
  if (move.isCapture) capStreak++;
  if (capStreak >= 3) return "trading";

  // Aggression: lots of checks, captures, and advancing pieces
  const allRecent = [...recent, move];
  const checks = allRecent.filter(m => m.isCheck).length;
  const captures = allRecent.filter(m => m.isCapture).length;
  let advances = 0;
  for (const m of allRecent) {
    const fromRank = parseInt(m.uci[1]);
    const toRank = parseInt(m.uci[3]);
    // Advancing = moving toward opponent's back rank
    if (color === "w" && toRank > fromRank) advances++;
    if (color === "b" && toRank < fromRank) advances++;
  }
  if (checks >= 2 || (captures >= 2 && advances >= 2) || (checks >= 1 && captures >= 2)) {
    return "aggressive";
  }

  // Passivity: retreating pieces, no captures or checks, shuffling
  const noAction = allRecent.every(m => !m.isCapture && !m.isCheck);
  let retreats = 0;
  for (const m of allRecent) {
    const fromRank = parseInt(m.uci[1]);
    const toRank = parseInt(m.uci[3]);
    if (color === "w" && toRank < fromRank) retreats++;
    if (color === "b" && toRank > fromRank) retreats++;
  }
  if (noAction && retreats >= 2) return "passive";
  // Piece shuffling — same piece type moving back and forth
  if (noAction && allRecent.length >= 4) {
    const types = allRecent.map(m => m.pieceType);
    const sameType = types.filter(t => t === move.pieceType).length;
    if (sameType >= 3) return "passive";
  }

  return null;
}

function _styleRoast(
  move: AnalyzedMove,
  summary: GameSummary,
  used: Set<string>,
): { text: string; annotations: MoveAnnotation } | null {
  const style = _detectStyle(move, summary);
  if (!style) return null;

  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const styleEmoji = style === "aggressive" ? "⚔️" : style === "passive" ? "🐌" : "♻️";
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(100, 160, 255, 0.7)"]], markers: [{ square: toSq, emoji: styleEmoji }] };

  if (style === "aggressive") {
    const text = pickUnused([
      `⚔️ They are COOKING right now. Checks, captures, threats — this is full berserker mode 🔥🗡️`,
      `🔥 Somebody woke up and chose violence today. ${move.san} continues the assault. The opponent needs therapy after this 💀`,
      `⚡ Attack attack attack! They've got that Tal energy going — just throw pieces at the king and pray 🙏💥`,
      `🗡️ ${move.san} — this player is playing like they've got somewhere to be. All gas no brakes 🏎️💨`,
      `🔥 The aggression is PALPABLE. Every move is a threat. The opponent's position is having a panic attack rn 😰⚔️`,
      `⚡ ${move.san} — they're not playing chess, they're playing Call of Duty. Just going straight in 🫡🎮`,
      `🗡️ Full aggro mode engaged. Garry Chess himself would say "slow down" but they literally do not care 💀🔥`,
      `⚔️ ${move.san} continues the rampage. This is what happens when someone watches too many Tal games 🤡💥`,
      `🔥 ${move.san}. They watched one Hikaru speed chess video and said "I can do that." Spoiler: they cannot. But they're TRYING 🏎️💀`,
      `⚡ ${move.san}. Full Levy "SACRIFICE" energy rn. They're throwing pieces at the king like it's Black Friday and material is on sale 🛒🔥`,
      `😌 ${move.san}. Giving Eric Rosen Stafford Gambit vibes. Just throw everything at the king and see what sticks. Except Rosen actually calculates first 🎯😌`,
    ], used);
    return { text, annotations: ann };
  }

  if (style === "passive") {
    const text = pickUnused([
      `🐌 They've been retreating for like 4 moves straight. Is this chess or a tactical withdrawal?? 🏳️😤`,
      `😴 ${move.san} — another quiet move. The position is begging for action and they're choosing violence... against their own clock ⏰💤`,
      `🛋️ The pieces are going BACKWARDS. This is giving "I'll just shuffle and hope they blunder" energy 🫠`,
      `🐢 ${move.san} — playing it safe is an understatement. They're playing it comatose. DO SOMETHING 😤🗿`,
      `😴 Move after move of pure nothing. No captures. No threats. Just vibes and regret 🧘‍♂️💤`,
      `🏳️ ${move.san} — the pieces are literally retreating to the starting squares. The opening was all for nothing 😭`,
      `🐌 They've entered full turtle mode. Shell up, head down, pray for a draw. Inspiring stuff 🐢🗿`,
      `😴 ${move.san}. The opposite of Tal energy. This is Petrosian energy but without the wins. Just the suffering 💀`,
      `🐢 ${move.san}. Playing like anti-Hikaru rn. Where Naka pushes, they retreat. Where Naka attacks, they shuffle. Polar opposites 🏎️↔️🐌`,
      `💤 ${move.san}. Levy would be BEGGING them to do something. "PUSH A PAWN. ATTACK SOMETHING. DO ANYTHING." They refuse 📺😤`,
    ], used);
    return { text, annotations: ann };
  }

  if (style === "trading") {
    const text = pickUnused([
      `♻️ Trade. Trade. Trade. They're liquidating pieces like it's a going-out-of-business sale 🏪💨`,
      `🤝 Another exchange! At this rate there'll be nothing left but kings staring at each other 👑👀👑`,
      `♻️ ${move.san} — they really said "if I trade everything, nobody can beat me." Galaxy-brain draw strategy 🧠🤝`,
      `🔄 The trading spree continues! Every piece is getting escorted off the board. This is chess capitalism — CONSUME 💀`,
      `🤝 ${move.san} trades again. The position is speedrunning towards a drawn endgame. Thrilling content 🫠📉`,
      `♻️ Another piece off the board. They're simplifying faster than my attention span at a classical game ⏩💤`,
      `🔄 ${move.san} — is this a chess game or a piece exchange program?? The board is getting emptier by the second 🏜️`,
      `🤝 Trade trade trade. "When in doubt, trade it out." The motto of every scared chess player ever 😬♻️`,
      `♻️ Hikaru voice: "captures, captures, captures, and we trade everything." Except when Hikaru does it, it's a PLAN. Here it's just fear 🏎️😬`,
    ], used);
    return { text, annotations: ann };
  }

  return null;
}

function _fallbackLine(move: AnalyzedMove): { text: string; annotations: MoveAnnotation } | null {
  const cls = move.classification;
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  if (cls === "best" || cls === "great" || cls === "good") {
    return Math.random() < 0.3 ? { text: `✅ ${move.san} — solid move. Nothing to see here 🫡`, annotations: NO_ANNOTATIONS } : null;
  }
  if (cls === "blunder") return { text: `💀 ${move.san}. That one hurt. Liers will kicked off for this 😭`, annotations: { arrows: [[fromSq, toSq, "rgba(239, 68, 68, 0.85)"]], markers: [{ square: toSq, emoji: "💀" }] } };
  if (cls === "mistake") return { text: `😬 ${move.san} — that's rough buddy. Position just got worse 📉`, annotations: { arrows: [[fromSq, toSq, "rgba(239, 183, 44, 0.85)"]], markers: [{ square: toSq, emoji: "😬" }] } };
  if (cls === "inaccuracy") return Math.random() < 0.4 ? { text: `🤷 ${move.san} — there was something better`, annotations: NO_ANNOTATIONS } : null;
  return null;
}

/* ================================================================== */
/*  Elo / Phase / Reveal Lines                                          */
/* ================================================================== */

export function getEloFlavorLine(elo: number): string {
  if (elo < 1000) return pick([
    "Sub-1000 chess. We're in the TRENCHES 🪖💀 Buckle up chat",
    "Below 1000 elo. Every game is a blunder contest and honestly? I'm here for it 🍿🔥",
    "Sub-1000 energy is a different kind of beautiful. Like watching a building demolition in slow-mo 🏚️💥",
    "At this elo, both players are fighting gravity as much as each other 🫠",
    "Below 1000. The pieces are on the board. That's about all we can confirm 🗿",
    "Sub-1000. Even Gavin from 3rd grade is sweating watching this. And Gavin is the strongest player 💀👑",
    "Sub-1000 elo. This is the \"I learned chess from AnarchyChess\" bracket and it shows 🤡🔥",
    "Sub-1000 chess. Levy's Guess the Elo bread and butter. This is where the CONTENT lives 📺🔥",
    "Below 1000. Even Hikaru would do a double take. Then laugh. Then move on in 0.5 seconds 🏎️💀",
    "Sub-1000. Eric Rosen would Stafford Gambit every single one of these players and it would work every single time 😌🎯",
  ]);
  if (elo < 1300) return pick([
    "1000-1300 bracket. Where dreams of grandeur meet the reality of hung pieces 💀🎁",
    "This is the 'I watched one Gotham Chess video' elo range. Let's see if it helped 📺🤡",
    "1000-1300. They watched Levy's How to Win at Chess series but skipped episode 2 📺💀",
    "1000-1300. Hikaru could beat this bracket blindfolded. With one hand. While doing a podcast. Probably 🏎️👑",
    "1000-1300. Eric Rosen's favorite opponent rating. Every game is a potential trap compilation 😌🎯",
    "Some opening knowledge, lots of one-move blunders. Classic 1000-1300 energy 🔥💀",
    "The 'I can see two moves ahead but not three' zone. My favourite 🤌",
    "They know the rules. They just don't know what to do with them yet 🤷🗿",
    "1000-1300. The 'I hang pieces but I know what en passant is' bracket. Holy hell 💀⛪",
    "1000-1300. They were doing PIPI in their pampers... actually no, they're still doing it. Live. On this board 😭",
  ]);
  if (elo < 1600) return pick([
    "1300-1600: the 'I'm actually decent… sometimes' bracket 😤💅",
    "Intermediate chess. They know tactics exist. Finding them in their own games? Different story 🔍💀",
    "The intermediate plateau. Where improvement goes to die and blunders go to thrive 📉🪦",
    "They have ideas. The ideas are just not always good. But they HAVE them 🧠🤡",
    "This is the elo where you start losing to people who actually study. Humbling 📚😭",
    "1300-1600. The 'I have an opening repertoire (it's the London)' bracket. Garry Chess wept 👑🤮",
    "Intermediate elo. They know what a Knook is but not how to avoid one 🐴🗿",
    "1300-1600. The 'I'm subbed to Levy AND Hikaru but somehow still stuck here' bracket 📺😭",
    "Intermediate chess. The elo where you know enough to be frustrated but not enough to fix it. Peak Levy viewer energy 📉🗿",
  ]);
  if (elo < 2000) return pick([
    "1600-2000: now we're cooking 🍳🔥 These players have seen some things",
    "The 'I actually have an opening repertoire' bracket. Let's see if it holds up 📚🤞",
    "Advanced club players. They don't hang pieces often. Key word: OFTEN 💀",
    "At this level, the mistakes are subtle. The blunders? Spectacular and rare 🎆✨",
    "Good enough to be dangerous, not quite good enough to be consistent 😤💅",
    "1600-2000. The 'I beat Gavin from 3rd grade and it felt meaningful' bracket 🏆🗿",
    "1600-2000. Decent enough that when they blunder, even Petrosian would say 'Proffesionals knew how to lose' 🤡",
    "1600-2000. The elo where Hikaru would say 'that's actually not terrible' and his chat would celebrate for days 🏎️🎉",
    "1600-2000. Good enough that Levy would actually analyze the position instead of just roasting. Growth 📈📺",
  ]);
  return pick([
    "Above 2000. These players actually know what they're doing. Usually 👑🧠",
    "Expert level. When they blunder up here, it's genuinely hard to spot why 🔍",
    "When a 2000+ player blunders, they blunder with ✨STYLE✨ 💀",
    "At this elo, the blunders are rare but when they drop? Holy hell 🤖🔍",
    "High-level chess. Where the difference between best and second-best actually matters 📊👑",
    "2000+. These players are unquestionably some of the players in chess history 👑🗿",
    "Expert chess. If they blunder up here, Hans's earpiece couldn't save them 💀🔊",
    "2000+. These players probably have a Hikaru poster on their wall. Or they ARE Hikaru's alt. You never know 🏎️🖼️",
    "Expert level. Even Levy would say 'okay this is actually good chess.' Rare praise. Cherish it 📺👑",
  ]);
}

export function getPhaseContext(moveNumber: number, totalMoves: number): string {
  const pct = moveNumber / totalMoves;
  if (pct < 0.25) return pick([
    "Still in the opening 📖",
    "Position is still theoretical 🤓",
    "Both sides developing. Or should be 🫠",
    "Still book territory. For now 📚",
  ]);
  if (pct < 0.7) return pick([
    "Deep in the middlegame now ⚔️",
    "The battle is fully engaged 🔥",
    "Pieces are flying across the board 💨",
    "Position is getting spicy 🌶️",
  ]);
  return pick([
    "We've reached the endgame 🏁",
    "Board is clearing out 🧹",
    "Precision matters more than ever now 🎯",
    "Endgame technique time. Or lack thereof 🫠",
  ]);
}

/**
 * Closing game summary roast — provides an overall assessment of both players.
 * Uses blunder/mistake/inaccuracy counts to generate a meme-style wrap-up.
 * Does NOT mention the result to avoid spoiling the outcome.
 */
export function getClosingRoast(
  blunders: number,
  mistakes: number,
  inaccuracies: number,
  totalMoves: number,
): string {
  const lines: string[] = [];

  // General closing lines (result-neutral)
  lines.push(
    `🏁 And that's the game! Both sides gave it everything they had. And by everything, I mean every piece. Voluntarily 💀🗿`,
    `🏁 Game over! What a ride. I'm not saying it was a rollercoaster, but my evaluation bar needs therapy 📊🫠`,
    `🏁 And that's a wrap! Time to guess the elo. Choose wisely... or don't. I'll roast you either way 🔥🤡`,
  );

  // Quality-based additions
  if (blunders >= 5) {
    lines.push(
      `📊 Overall? ${blunders} blunders in ${totalMoves} moves. Both players treated their pieces like they were disposable. RECYCLING ♻️💀`,
      `📊 ${blunders} blunders total. This was less of a chess game and more of a demolition derby. Both players brought hammers instead of brains 🔨🗿`,
      `📊 Overall assessment: ${blunders} blunders. Each player was the other's best teammate. Impressive teamwork against themselves 🤝💀`,
      `📊 ${blunders} blunders. Both players were doing PIPI in their pampers the ENTIRE game. Petrosian would file a formal complaint. "Liers will kicked off..." 👶🗿`,
    );
  } else if (blunders >= 3) {
    lines.push(
      `📊 ${blunders} blunders and ${mistakes} mistakes across the whole game. Not the worst I've seen, but definitely not something to tell your chess coach about 📉🫠`,
      `📊 ${blunders} blunders, ${mistakes} mistakes. The game had moments of brilliance surrounded by vast oceans of questionable decisions 🌊💀`,
      `📊 ${blunders} blunders. Are you kidding ??? What the **** are you talking about man ?? You are a biggest looser i ever seen in my life ! 🗿`,
    );
  } else if (blunders <= 1 && mistakes <= 2) {
    lines.push(
      `📊 Only ${blunders} blunder and ${mistakes} mistakes? Okay I'll admit it — this was actually a halfway decent game. For this elo. Don't let it go to your head 🫡📈`,
      `📊 Surprisingly clean game. ${blunders} blunders, ${mistakes} mistakes. Either they've been studying or they got really lucky. I'm going with lucky 🍀🗿`,
    );
  } else {
    lines.push(
      `📊 ${blunders} blunders, ${mistakes} mistakes, ${inaccuracies} inaccuracies. A very normal game. The kind that makes you wonder if chess was a mistake (pun intended) 🗿`,
      `📊 Final stats: ${blunders} blunders, ${mistakes} mistakes. Both players showed flashes of competence between the chaos. Like finding a diamond in a dumpster 💎🗑️`,
    );
  }

  return pick(lines);
}

/* ================================================================== */
/*  Elo guessing commentary — ambiguous skill observations             */
/* ================================================================== */

/**
 * Returns an ambiguous comment about the perceived skill level.
 * `quality` is a rough indicator:
 *   "surprising_good" — player just did something unexpectedly decent
 *   "clueless"        — they did something truly terrible
 *   "mid"             — neither great nor awful, just... mid
 *   "rollercoaster"   — game quality is wildly inconsistent
 */
export function getEloGuessComment(quality: "surprising_good" | "clueless" | "mid" | "rollercoaster"): string {
  switch (quality) {
    case "surprising_good":
      return pick([
        "Wait... that was actually a good move. Hold on, maybe they aren't as bad as I thought? 🤔🗿",
        "Okay okay I'm slightly revising my elo estimate upward after that one. SLIGHTLY 📈🫡",
        "Huh, so they DO know how to play chess? Okay respect, this is better than I expected 🤨",
        "That move was... competent??? I was NOT expecting that. My whole read on this game just shifted 😳",
        "Oh? Oh?? They're not total beginners? The plot thickens 🧐📖",
        "Okay this is genuinely above my expectations for a Guess the Elo game. I'm suspicious now 🤯",
        "Either that was a lucky mouse slip or I've been seriously underestimating this player 🐭✨",
        "Well well well, someone's been hiding their power level. That was way better than I expected 💪🫠",
      ]);
    case "clueless":
      return pick([
        "Oh no. OH NO. I thought they were better than this. I was WRONG 💀📉",
        "Okay I'm revising my estimate. Way. Way. Down. That was rough 🗿⬇️",
        "And just like that, any respect I had evaporates. What was THAT 😭🤡",
        "I was giving them too much credit. That move belongs in a museum. The bad one 🏛️💀",
        "This is looking more and more like someone who just learned the rules last week 🫠📚",
        "New theory: this is a toddler playing chess. It would explain so much 👶🗿",
        "Every time I think I've calibrated their level, they go even lower. Impressive, honestly 📉📉",
        "I... I had hope. That move destroyed it. Like a blunder destroys evaluation 💔",
      ]);
    case "mid":
      return pick([
        "It's giving... average. Not terrible, not great. Just... chess 🤷😐",
        "Peak mediocrity. The moves are fine. Not good. Not bad. Just... fine 🗿",
        "This is aggressively mid chess. Like eating plain oatmeal for every meal 🥣😑",
        "Can't tell if they're a decent player having a bad day or a bad player having a good day 🤔",
        "The level of play here is... existing. It exists. That's the nicest thing I can say 🫤",
        "They're playing the chess equivalent of driving exactly the speed limit. In the right lane. Forever 🚗💤",
      ]);
    case "rollercoaster":
      return pick([
        "This game is WILD. One move they look like a GM, next move they look like they've never seen a chess board 🎢💀",
        "The consistency here is... non-existent. Up down up down. Chess rollercoaster 🎢🤮",
        "I genuinely cannot tell what level this is. Brilliant move followed by absolute catastrophe. WHAT 🤯🗿",
        "Are two different people taking turns at the keyboard?? The skill variance is INSANE 👥😭",
        "One second I think this is 1500, next second I think it's 600. I'm getting whiplash 🏥📊",
        "Jekyll and Hyde chess. Masterful one move, crimes against chess the next 🧪💀",
        "Even Levy couldn't Guess this Elo. One move looks GM, next move looks like they just installed the app 📺🤯",
        "Hikaru would need to pause and squint at this one. The skill variance is giving him whiplash too 🏎️😳",
      ]);
  }
}

/* ================================================================== */
/*  Opening roast                                                       */
/* ================================================================== */

export function getOpeningRoast(opening: string): string {
  const o = opening.toLowerCase();
  const guide = matchOpeningGuide(opening);

  // Build a fun guide addendum if available
  const guideAddendum = (() => {
    if (!guide) return "";
    const trap = getOpeningTrap(guide);
    if (trap && Math.random() < 0.5) {
      return ` 🪤 Watch out for the ${trap.name} — ${trap.description.length > 80 ? trap.description.slice(0, 77) + "..." : trap.description}`;
    }
    const idea = pick(guide.keyIdeas);
    if (idea) {
      return ` 🧠 Key idea: ${idea.length > 80 ? idea.slice(0, 77) + "..." : idea}`;
    }
    return "";
  })();

  // Specific opening roasts
  if (o.includes("london")) return pick([
    `📖 ${opening}. The London System. The mayonnaise of chess openings. Bland, safe, and your opponent is already bored 🥱🗿`,
    `📖 ${opening}. Ah yes, the London. Bold choice if "bold" means "I learned one opening and I'm riding it to the grave" 💀🇬🇧`,
    `📖 ${opening}. The London. Google "most boring chess opening." Holy hell, they actually play it 🗿⛪`,
    `📖 ${opening}. London System. The chess equivalent of ordering plain toast at a Michelin star restaurant. Garry Chess is WEEPING 👑😭`,
  ]);

  if (o.includes("bongcloud")) return pick([
    `📖 ${opening}. THE BONGCLOUD. They actually did it. Ke2 energy. Garry Chess approves and so do I 👑☁️🔥`,
    `📖 ${opening}. Bongcloud Attack. The meme opening that's also theory now because chess is broken 💀👑`,
    `📖 ${opening}. Google "Bongcloud Attack." Holy hell. The king LEADS THE CHARGE. Chad energy ☁️🗿`,
  ]);

  if (o.includes("stafford")) return pick([
    `📖 ${opening}. The Stafford Gambit! Eric Rosen's signature weapon. Objectively dubious. Practically DEADLY at this elo 😌🎯`,
    `📖 ${opening}. Stafford Gambit — "Oh no my pawn." *proceeds to mate you in 12 moves.* This is Eric Rosen energy personified 😌💀`,
    `📖 ${opening}. The Stafford. Either they watched Eric Rosen's video and are about to cook, or they accidentally stumbled into it. Either way: TRAPS incoming 🪤🔥`,
  ]);

  if (o.includes("petrov") || o.includes("petroff")) return pick([
    `📖 ${opening}. Petrov's Defense. The "I'm going to mirror everything you do" approach. Eric Rosen would find a way to make this spicy. These players? Probably not 😌🗿`,
    `📖 ${opening}. Petrov Defense. AKA the Stafford Gambit's boring cousin. Same family, very different energy 💤⚔️`,
  ]);

  if (o.includes("italian")) return pick([
    `📖 ${opening}. The Italian Game. Classic, boring, and every 1200 plays it. Pizza never hurt anyone tho 🍕✅`,
    `📖 ${opening}. Italian Game — the training wheels of chess openings. Reliable until someone plays the Fried Liver and your world ends 🔪🍳`,
    `📖 ${opening}. Mamma mia, it's the Italian! Bc4 into hoping the opponent hangs something. A timeless strategy 🤌🇮🇹`,
  ]);

  if (o.includes("sicilian")) return pick([
    `📖 ${opening}. The Sicilian. They chose violence today. Spicy, chaotic, and someone's definitely getting mated 🌶️💀`,
    `📖 ${opening}. The Sicilian Defense — where both sides pretend they know 35 moves of theory. Spoiler: they don't 🗿📚`,
    `📖 ${opening}. Sicilian. One of the openings of all time. Unquestionably sharp, unquestionably gonna end in tears 😭⚔️`,
  ]);

  if (o.includes("french")) return pick([
    `📖 ${opening}. The French Defense. e6 into a closed position into suffering. I feel the pain already 🇫🇷💀`,
    `📖 ${opening}. The French. AKA "I'm going to build a wall of pawns and pray." Bold strategy Cotton 🧱🤞`,
    `📖 ${opening}. French Defense. Google "how to be passive-aggressive in chess." Holy hell 🗿🇫🇷`,
  ]);

  if (o.includes("caro") || o.includes("caro-kann")) return pick([
    `📖 ${opening}. The Caro-Kann. Solid, slightly boring, and your opponent just fell asleep. But hey, it works 😴✅`,
    `📖 ${opening}. Caro-Kann — the "I watched a Levy video and picked the most solid option" special 📺🗿`,
    `📖 ${opening}. Caro-Kann Defense. The chess equivalent of wearing a seatbelt AND a helmet. Safe, boring, effective 🪖📚`,
  ]);

  if (o.includes("king's gambit") || o.includes("kings gambit")) return pick([
    `📖 ${opening}. The King's Gambit! SACRIFICING A PAWN ON MOVE 2. This person woke up and chose absolute violence 🔥⚔️`,
    `📖 ${opening}. King's Gambit. Bobby Fischer said it was "busted." These players said "I literally do not care" 🗿👑`,
    `📖 ${opening}. Google "King's Gambit." Holy hell — they're giving away material before the game even starts 💀⛪`,
  ]);

  if (o.includes("queen's gambit") || o.includes("queens gambit")) return pick([
    `📖 ${opening}. The Queen's Gambit. They watched the Netflix show. Very relatable. Very 1. d4 energy 📺♟️`,
    `📖 ${opening}. Queen's Gambit. d4 d5 c4 — the "I'm a serious player" opening choice. We'll see about that 🤨📚`,
    `📖 ${opening}. Queen's Gambit. Anya Taylor-Joy could never play this badly but let's see what happens 💅💀`,
  ]);

  if (o.includes("scandinavian")) return pick([
    `📖 ${opening}. The Scandinavian. 1. e4 d5 — "I'm going to develop my queen on move 2 because I fear nothing." Chaos energy 👑💀`,
    `📖 ${opening}. Scandinavian Defense. Google "early queen development." Then Google "why you shouldn't." Holy hell 🗿`,
    `📖 ${opening}. The Scandinavian. Bold, reckless, and weirdly effective at low elo. Like a drunk driver who somehow arrives safely 🚗💀`,
  ]);

  if (o.includes("pirc") || o.includes("modern")) return pick([
    `📖 ${opening}. ${opening}. Hypermodern vibes. "Let them have the center then complain about it later." A mood 🗿🧠`,
    `📖 ${opening}. They're playing hypermodern chess. Which at this elo means "I didn't know what else to play" 💀📖`,
  ]);

  if (o.includes("english")) return pick([
    `📖 ${opening}. The English Opening. 1. c4 — the "I'm too cool for e4 or d4" move. We'll see if it pays off 🇬🇧🤨`,
    `📖 ${opening}. English. 1. c4. Explosive? No. But it's going to be a slow, painful grind 🐌⚔️`,
  ]);

  if (o.includes("dutch")) return pick([
    `📖 ${opening}. The Dutch Defense. 1...f5 — immediately weakening the kingside. This person does NOT care about safety 🇳🇱🔥`,
    `📖 ${opening}. Dutch Defense. The "I'm either a genius or an idiot" opening. No in between. We'll find out soon 🤡👑`,
  ]);

  if (o.includes("grünfeld") || o.includes("grunfeld")) return pick([
    `📖 ${opening}. The Grünfeld. Kasparov's weapon. At this elo tho? It's more like a plastic sword 🗡️💀`,
    `📖 ${opening}. Grünfeld Defense. Super sharp, super theoretical. How much of this do they actually know? My guess: zero 📚🗿`,
  ]);

  if (o.includes("king's indian") || o.includes("kings indian")) return pick([
    `📖 ${opening}. The King's Indian. Fianchetto and pray. Castle and launch a kingside attack. Or hang everything trying 🔥🙏`,
    `📖 ${opening}. King's Indian Defense. Kasparov energy. Bobby Fischer energy. At this elo? Gavin from 3rd grade energy 🗿👑`,
  ]);

  if (o.includes("ruy lopez") || o.includes("spanish")) return pick([
    `📖 ${opening}. The Ruy Lopez. The most classical of classical openings. 500 years of theory and they'll deviate by move 5 📖🗿`,
    `📖 ${opening}. Spanish Game. Bb5. The opening that says "I read a chess book once." Cultured. For now 🎩📚`,
  ]);

  if (o.includes("nimzo") || o.includes("nimzo-indian")) return pick([
    `📖 ${opening}. The Nimzo-Indian. Pinning the knight before developing. Sophisticated. Almost too sophisticated for what's about to happen 📌😭`,
    `📖 ${opening}. Nimzo-Indian. A top-tier opening choice. It's all downhill from here tho 💅📉`,
  ]);

  if (o.includes("slav")) return pick([
    `📖 ${opening}. The Slav Defense. c6 — solid, reliable, and about as exciting as watching paint dry. But hey, they haven't blundered yet 🎨😴`,
    `📖 ${opening}. Slav Defense. The "I will defend everything and you will suffer" approach. Love to see it 🗿💪`,
  ]);

  if (o.includes("philidor")) return pick([
    `📖 ${opening}. The Philidor Defense. Named after a guy from the 1700s. This opening is literally older than the United States 🇺🇸💀`,
    `📖 ${opening}. Philidor. d6. Passive but sturdy. The defensive lineman of chess openings 🏈🗿`,
  ]);

  if (o.includes("scotch")) return pick([
    `📖 ${opening}. The Scotch Game. d4 on move 3 — "I don't have time for your Italian nonsense, we're fighting NOW" 🏴󠁧󠁢󠁳󠁣󠁴󠁿⚔️`,
    `📖 ${opening}. The Scotch. Direct. Aggressive. The chess equivalent of rolling up your sleeves on move 3 💪🔥`,
  ]);

  if (o.includes("vienna")) return pick([
    `📖 ${opening}. The Vienna Game. Nc3 before Nf3 — "I want to play the King's Gambit but with plausible deniability" 🤫🔥`,
    `📖 ${opening}. Vienna Game. The hipster King's Gambit. Same chaos, more obscure moves. I respect it 🎩💀`,
  ]);

  if (o.includes("alekhine")) return pick([
    `📖 ${opening}. Alekhine's Defense. 1...Nf6 — "Come on then, push those pawns. I DARE you." Bold strategy 🗿⚔️`,
    `📖 ${opening}. Alekhine Defense. Inviting White to overextend. Either genius or copium. We'll see 🧠💀`,
  ]);

  // Generic opening roasts
  const base = pick([
    `📖 ${opening}. Interesting choice. Let's see if they actually know the theory or if they're freestyling by move 3 🎤🗿`,
    `📖 ${opening}. An opening has been played. Whether they know WHY these moves are played is... debatable 🤨📚`,
    `📖 ${opening}. Google "${opening}." Holy hell — this should be interesting 💀⛪`,
    `📖 ${opening}. Hikaru plays this in bullet and makes it look easy. These players? It's about to look VERY hard 🏎️😬`,
    `📖 ${opening}. This is the opening Levy would title "How To CRUSH With ${opening}" and then lose with on stream 📺🤡`,
    `📖 ${opening}. Garry Chess himself would have an opinion about this opening choice. I literally do not care, let's just see what happens 🗿👑`,
    `📖 ${opening}. The opening is set. Now we wait for the first blunder. It's not a question of IF, it's WHEN 💀📉`,
    `📖 ${opening}. Theory has been played. How long until someone goes off-book? Taking bets now 🎲🔥`,
    `📖 ${opening}. They chose their weapon. Let the suffering begin 🗡️🫠`,
    `📖 ${opening}. Alright, opening identified. Liers will kicked off from here. True will never die. But one of these players' positions will 🗿💀`,
  ]);
  return base + guideAddendum;
}

export const REVEAL_TOO_HIGH = [
  "You thought they were better than that? Generous 🤡",
  "Overestimated. WAY overestimated. These are MORTALS 💀",
  "You gave too much credit. Rookie mistake fr 😤",
  "That's like thinking the guy at the park is secretly a GM 🗿",
  "You sweet summer child. This is LOW elo chess 🫠",
  "Your faith in humanity's chess ability is touching, but misplaced 💀🤝",
  "If only they were that good. If only 😭",
  "You overestimated harder than these players overestimate their tactical vision 💀🤡",
  "Nah, these players were doing PIPI in their pampers at that rating. Lower. Much lower 🗿",
  "Even Hikaru's chat wouldn't overestimate this hard, and they think EVERYTHING is brilliant 🏎️🤡",
  "Levy would roast you for this guess harder than he roasts the actual games 📺💀",
];

export const REVEAL_TOO_LOW = [
  "How DARE you underestimate these players 😤💅",
  "They're actually better than you thought. Uncomfortable, isn't it? 🤡",
  "You went too low! These people have TRAINING 📚💪",
  "Disrespectful. These players actually practice 🫡",
  "You judged too harshly. They blundered, but they also played SOME good moves 🤷",
  "They're higher rated than that, believe it or not 😳",
  "Even with the blunders, they're rated higher than your guess. Ratio'd 📉🤡",
  "Too low! These players actually know what en passant is. They even take it sometimes 💀⛪",
  "You underestimated them harder than they underestimated that knight fork. Respect their grind 💪🗿",
  "Hikaru would say you're trolling with that guess. And he'd be right 🏎️🦨",
  "Levy's eyebrows would fly off his face at that underestimate. These players have TRAINING 📺💪",
];

export const REVEAL_CORRECT = [
  "NAILED IT. Are you secretly a coach?? 🎯🧠",
  "Right on the money! You've seen enough games to know 👑✨",
  "Correct! Your pattern recognition is built different 📈💅",
  "Bull's-eye. You can just SMELL the elo. Impressive and slightly concerning 🤌🔥",
  "Spot on! This is exactly what this level of chess looks like 🎯✨",
  "Crushed it. You clearly spend too much time on the internet. Same tbh 🤝💀",
  "Ding ding ding! We have a winner! 🏆🔔",
  "You know your elo brackets. Either impressive or concerning 🧠🤨",
  "Holy hell you got it right! Google 'I'm a genius.' 💀👑",
  "Correct! You are unquestionably one of the guessers in Guess the Elo history 🎯🗿",
  "Nailed it! Hikaru-level pattern recognition. Chat is going crazy rn 🏎️🎯",
  "Spot on! Levy trained you well through all those Guess the Elo episodes 📺🧠",
  "Eric Rosen would give you a calm nod and a 'nice.' The highest form of Rosen praise 😌🎯",
];

export const GAME_INTRO = [
  "Alright chat, let's see what we're working with today 🍿🔥",
  "Fresh game. Is it a masterpiece or a dumpster fire? Place your bets 🎰💀",
  "New game dropped. LET'S GO 🔥🔥🔥",
  "Let's analyze this game and try not to cry 😭🫡",
  "Buckle up. We're about to witness some chess. Or something resembling chess 🤷💀",
  "Okay what do we got? Let's see the first moves 👀🍿",
  "Time for another 'Guess the Elo.' I can already feel the pain incoming 😭🔥",
  "Let's see if these players know what they're doing. Spoiler: probably not 🤡💀",
  "Here we go. Another game, another potential crime scene 🚨🔍",
  "Welcome to 'Is This Chess or Just Two People Pushing Wood?' 🪵🗿",
  "NEW GAME NEW ME. Jk, same pain different board 😭🔥",
  "Chat I'm scared. Let's see what horrors await 💀🍿",
  "Levy voice: 'Ladies and gentlemen... we have a game.' Let's see how bad it is 📺🔥",
  "Hikaru would speed through this in 3 minutes. We're gonna take our time and SUFFER through every move 🏎️😭",
  "Eric Rosen voice: 'Oh... this is going to be interesting.' Said with the most dangerous calm 😌🔥",
  "New Guess the Elo just dropped. Holy hell 👑🔥",
  "Chess 2 update just dropped. Let's see what Garry Chess cooked this time 🍳💀",
  "Another game. Will it make me question the existence of chess education? Probably 📚🤡",
  "Let's see what happens when two people who googled 'en passant' try to play a full game 💀⛪",
  "Fresh game loaded. I'm already bracing for the PIPI energy 🗿🔥",
];

export const GAME_SUMMARY_LINES = [
  "📊 {blunders} blunders, {mistakes} mistakes, {inaccuracies} inaccuracies. A normal day in {elo} chess 💀",
  "📉 Final tally: {blunders} blunders. Both players really said 'no one's winning today' 🤝🗿",
  "🔢 {blunders} blunders in {totalMoves} moves = a blunder every {frequency} moves. Consistency is key 📈💀",
  "📈 The accuracy chart looks like a seismograph during an earthquake 📉📈📉",
  "🤷 For {elo} rated players, this could've been way worse. Could've 🫠",
  "🎢 This game was a rollercoaster. Mostly the part where it crashes 💀🔥",
  "⚔️ Both players fought hard. Unfortunately, they also fought smart moves 🤡",
  "📝 In summary: chaos, pain, and the occasional good move by accident 🎲💀",
  "🫤 I've seen worse. Not MUCH worse, but worse 🗿",
  "🎪 What a game. What an absolute CIRCUS of a game 🤡🔥",
  "� Levy would title this video 'WHAT DID I JUST WATCH' and honestly? Same 💀🔥",
  "🏎️ Hikaru could've analyzed this game in the time it took them to play move 3. Built different 👑💨",
  "�📊 This game was unquestionably one of the chess games of all time. The tu art of chess, truly 🗿👑",
  "☠️ {blunders} blunders. Garry Chess is rolling in his chess factory. Holy hell 💀",
  "📉 Google \"how did this game end like this.\" Actually don't. Save yourself. I literally do not care to relive this 🫠",
  "🪧 {blunders} blunders. Liers will kicked off the rating ladder. True will never die, but this game's quality already did 💀",
];

/* ================================================================== */
/*  Elo bracket helpers                                                 */
/* ================================================================== */

export const ELO_BRACKETS = [
  { label: "Absolute beginner", range: "< 800", min: 0, max: 800, emoji: "🐣" },
  { label: "Beginner", range: "800 – 1100", min: 800, max: 1100, emoji: "🌱" },
  { label: "Casual player", range: "1100 – 1400", min: 1100, max: 1400, emoji: "♟️" },
  { label: "Intermediate", range: "1400 – 1700", min: 1400, max: 1700, emoji: "⚔️" },
  { label: "Advanced", range: "1700 – 2000", min: 1700, max: 2000, emoji: "🏆" },
  { label: "Expert / Master", range: "2000+", min: 2000, max: 3500, emoji: "👑" },
] as const;

export function getEloBracketIdx(elo: number): number {
  if (elo < 800) return 0;
  if (elo < 1100) return 1;
  if (elo < 1400) return 2;
  if (elo < 1700) return 3;
  if (elo < 2000) return 4;
  return 5;
}

/* ================================================================== */
/*  Legacy helpers (kept for page.tsx compat)                            */
/* ================================================================== */

export function isHanging(chess: Chess, square: string): { hanging: boolean; piece?: string } {
  const piece = chess.get(square as Square);
  if (!piece) return { hanging: false };
  try {
    const moves = chess.moves({ verbose: true });
    for (const m of moves) {
      if (m.to === square && m.captured) return { hanging: true, piece: piece.type };
    }
  } catch {}
  return { hanging: false };
}

export function materialValue(piece: string): number {
  return PIECE_VALUES[piece] ?? 0;
}

export function countMaterial(chess: Chess): { white: number; black: number } {
  let white = 0, black = 0;
  for (const p of allPieces(chess)) {
    const v = PIECE_VALUES[p.type] ?? 0;
    if (p.color === "w") white += v; else black += v;
  }
  return { white, black };
}

/* ================================================================== */
/*  Guess Reaction Commentary                                           */
/* ================================================================== */

/**
 * Generate a personalised roast/reaction based on how the user's elo guess
 * compares to the actual elo. Returns a short commentary line.
 */
export function getGuessReaction(
  guessedBracketIdx: number,
  actualBracketIdx: number,
  actualElo: number,
  blunders: number,
  totalMoves: number,
): string {
  const distance = Math.abs(guessedBracketIdx - actualBracketIdx);
  const guessedBracket = ELO_BRACKETS[guessedBracketIdx];
  const actualBracket = ELO_BRACKETS[actualBracketIdx];
  const tooHigh = guessedBracketIdx > actualBracketIdx;

  // Perfect guess
  if (distance === 0) {
    return pick([
      `🎯 ${actualElo} elo and you NAILED IT. Are you a coach or just traumatised by Elo brackets? 🧠🔥`,
      `🎯 Dead on! ${actualBracket.label} detected. You've seen enough chess suffering to be an expert 💀👑`,
      `🎯 ${actualElo}. You got it. Your pattern recognition is genuinely scary rn 😳✨`,
      `🎯 Correct! ${actualElo}! You can just SMELL the elo through the screen. Built different 🤌🔥`,
      `🎯 ${actualElo}! Spot on! The blunder density gave it away, didn't it? 💀📊`,
      `🎯 That's ${actualElo} and you knew it. Google "I'm cracked at Guess the Elo" 👑🗿`,
      `🎯 Absolutely nailed it. With ${blunders} blunders in ${totalMoves} moves? Yeah, that's ${actualElo} behavior 📈🎯`,
      `🎯 ${actualElo}! You got Levy Guess the Elo energy fr. Are you secretly a chess YouTuber? 📺🤌`,
      `🎯 Spot on! Even Hikaru would nod approvingly. And Hikaru BARELY nods at anything 🏎️👑`,
    ]);
  }

  // Close guess (±1 bracket)
  if (distance === 1) {
    if (tooHigh) {
      return pick([
        `🔥 Close! You said ${guessedBracket.label} but it's actually ${actualElo}. A tiny bit generous but we'll allow it 🤝`,
        `🔥 Almost! ${actualElo} — you were one bracket too kind. These players thank you for your service 🫡`,
        `🔥 Off by one bracket — you said ${guessedBracket.range} but the real elo is ${actualElo}. The blunders were a hint 💀`,
        `🔥 SO close. ${actualElo}. You overshot slightly but you clearly know your elo brackets 📊🔥`,
      ]);
    }
    return pick([
      `🔥 Close! You said ${guessedBracket.label} but it's actually ${actualElo}. Don't undersell them! 💪`,
      `🔥 Almost! ${actualElo} — one bracket too harsh. They had some good moments too 😤`,
      `🔥 Off by just one bracket — ${actualElo}. The good moves fooled you, huh? 🧠`,
      `🔥 Nearly! ${actualElo}. They're slightly better than you gave them credit for. Growth mindset 📈`,
    ]);
  }

  // Way off (2+ brackets)
  if (tooHigh) {
    if (distance >= 3) {
      return pick([
        `💀 You said ${guessedBracket.label}?? It's ${actualElo}. That's not just wrong, that's DISRESPECTFULLY wrong 🤡`,
        `💀 ${guessedBracket.range}?! These players are ${actualElo}!! You gave them like 3 brackets too much credit 😭`,
        `💀 Brother. ${actualElo}. You were WAY off. Did you even watch the same game? 🤡💀`,
        `💀 Even Levy's chat guesses better than this and half of them are trolling 📺🤡`,
        `💀 You thought this was ${guessedBracket.label} chess?? Nah fam, ${actualElo}. The delusion is real 🗿`,
        `💀 ${actualElo}! You guessed ${guessedBracket.range}. The ${blunders} blunders should've been a clue 😭📉`,
      ]);
    }
    return pick([
      `😤 ${actualElo} — you guessed too high. ${blunders} blunders in ${totalMoves} moves and you thought they were ${guessedBracket.label}? 🤡`,
      `😤 It's ${actualElo}. You overestimated by a lot. These players make the kind of moves that keep therapists busy 💀`,
      `😤 ${guessedBracket.range}? Nah. ${actualElo}. The tactical awareness of a goldfish gave it away 🐟`,
      `😤 Too high! ${actualElo}. You gave them way too much credit for that blunder festival 🎪💀`,
    ]);
  }

  // Too low, way off
  if (distance >= 3) {
    return pick([
      `😳 ${actualElo}?! You said ${guessedBracket.label}! HOW DARE YOU underestimate these warriors 💪🗿`,
      `😳 It's actually ${actualElo}! You said ${guessedBracket.range}. Mans are HIGHER rated than that! Disrespectful 😤`,
      `😳 ${actualElo}!! ${guessedBracket.label}?? They played ${totalMoves} moves with only ${blunders} blunders and you dissed them like that? 💀`,
      `😳 Brother they're ${actualElo}. You said ${guessedBracket.range}. Even I feel bad for them rn 😭`,
    ]);
  }
  return pick([
    `🤷 ${actualElo} — you went too low. They're better than you gave them credit for. Respect the grind 💪`,
    `🤷 It's ${actualElo}! You said ${guessedBracket.label}. Even with the blunders, they're rated higher than that 📈`,
    `🤷 Too low! ${actualElo}. Some of those moves were actually decent, you just focused on the pain 😭`,
    `🤷 ${actualElo}. You underestimated them. The good moves were there, you just chose to remember the blunders 🗿`,
  ]);
}
