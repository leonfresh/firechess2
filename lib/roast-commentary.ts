/**
 * Roast Commentary Engine — Meme Edition 🔥
 *
 * Position-aware commentary with chess.js board analysis (forks, pins,
 * hanging pieces, king safety, pawn structure, development) wrapped in
 * AnarchyChess / Gotham Chess / internet-brain humor with emojis.
 */

import { Chess, type PieceSymbol, type Color, type Square } from "chess.js";

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
    const oppMoves = chess.moves({ verbose: true });
    const attacked = new Set(oppMoves.filter(m => m.captured).map(m => m.to));
    for (const p of allPieces(chess)) {
      if (p.color === color && p.type !== "k" && attacked.has(p.square) && (PIECE_VALUES[p.type] ?? 0) >= 3) {
        // Only flag as hanging if the piece is NOT defended by any friendly piece
        if (!chess.isAttacked(p.square, color)) {
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
          pins.push({ pinner: slider, pinned: between[0], target: tgt });
        }
      }
    }
  }
  return pins;
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
/*  Random helpers                                                      */
/* ================================================================== */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

  if (move.classification === "brilliant" || (move.classification === "best" && move.sacrificedMaterial)) {
    return _emitResult(used, _brilliantRoast(move, after, toSq, landedPiece));
  }

  if (move.classification === "great" || move.classification === "best") {
    if (Math.random() > 0.35) return null;
    return _emitResult(used, _goodMoveRoast(move, after, toSq));
  }

  if (move.missedMateInN && move.missedMateInN <= 5) {
    return _emitResult(used, _missedMateRoast(move));
  }

  if (move.classification === "blunder") {
    return _emitResult(used, _blunderRoast(move, before, after, moverColor, fromSq, toSq, movedPiece, capturedPiece, summary));
  }

  if (move.classification === "mistake") {
    return _emitResult(used, _mistakeRoast(move, before, after, moverColor));
  }

  if (move.classification === "inaccuracy") {
    if (Math.random() > 0.4) return null;
    return _emitResult(used, _inaccuracyRoast(move, after, moverColor));
  }

  return null;
}

function _templateKey(text: string): string {
  // Strip move-specific text to produce a template key for dedup
  return text.replace(/[KQRBN]?[a-h]?x?[a-h][1-8][+=]?[QRBN]?[+#]?/g, "_").replace(/move \d+/gi, "_").slice(0, 60);
}

function _emitResult(used: Set<string>, result: { text: string; annotations: MoveAnnotation }): CommentResult | null {
  const key = _templateKey(result.text);
  if (used.has(key)) return null; // skip duplicate template
  used.add(key);
  return result;
}

/* ================================================================== */
/*  Roast Generators — meme edition 🔥                                  */
/* ================================================================== */

function _brilliantRoast(
  move: AnalyzedMove,
  after: Chess,
  toSq: Square,
  landed: ReturnType<Chess["get"]>,
): { text: string; annotations: MoveAnnotation } {
  const fromSq = move.uci.slice(0, 2);
  const baseArrows: [string, string, string][] = [[fromSq, toSq, "rgba(34, 197, 94, 0.85)"]];
  const baseMarkers: { square: string; emoji: string }[] = [{ square: toSq, emoji: "✨" }];

  const lines: (() => { text: string; annotations: MoveAnnotation })[] = [
    () => ({ text: `🤯 ${move.san}?! EXCUSE ME?? That's actually BRILLIANT. ${pn(move.pieceType, true)} to ${toSq}? Google "best move ever." Holy hell 🔥`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `✨ Nah hold up. ${move.san} is literally the best move on the board. WHERE was this energy 3 moves ago when they were throwing?? 😤`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🧠 ${pn(move.pieceType, true)} to ${toSq}. That's the best move on the board. I'm actually speechless. This person has NO business playing this well 💀`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => {
      if (move.sacrificedMaterial && landed)
        return { text: `⚡ A REAL sacrifice! ${pn(landed.type, true)} to ${toSq} — gives up material for a crushing attack. Tal energy fr fr 👑🔥`, annotations: { arrows: baseArrows, markers: [{ square: toSq, emoji: "⚡" }] } };
      return { text: `✨ ${move.san} — the only move, the hardest move, and they found it. Alekhine is smiling from heaven rn 🫡`, annotations: { arrows: baseArrows, markers: baseMarkers } };
    },
    () => ({ text: `🌟 Galaxy-brain ${move.san}. The kind of move that makes you re-check the elo. Still low. Mind = blown 🤯`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => {
      const forks = landed ? detectForks(after, toSq, { type: landed.type, color: landed.color, square: toSq }) : [];
      if (forks.length >= 2) {
        const targets = forks.map(f => `${pn(f.type)} on ${f.square}`).join(" and ");
        const forkArrows: [string, string, string][] = forks.map(f => [toSq, f.square, "rgba(34, 197, 94, 0.75)"] as [string, string, string]);
        return { text: `🍴 ${move.san} FORKS the ${targets}! Actually calculated?? At this elo?? I'm calling hacks 🕵️✨`, annotations: { arrows: forkArrows, markers: [{ square: toSq, emoji: "🍴" }, ...forks.map(f => ({ square: f.square, emoji: "🎯" }))] } };
      }
      return { text: `🔥 ${move.san} is absolutely disgusting. In a good way. Chef's kiss 💋👨‍🍳`, annotations: { arrows: baseArrows, markers: baseMarkers } };
    },
    () => ({ text: `⚡ ${move.san} goes HARD. The position just shifted and the opponent didn't even see it coming. Built different ngl 💅`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `👑 Best move in the entire game and it's not even close. ${pn(move.pieceType, true)} to ${toSq}. *chef's kiss* 🤌✨`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `✨ ${move.san}?! Garry Chess himself could never. This move just invented Chess 2 🎮👑`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🔥 ${move.san} — and the crowd goes HOLY HELL. Someone googled "how to play chess" and actually learned 💀🫡`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
    () => ({ text: `🧠 ${move.san}. Unquestionably one of the moves in chess history. Magnificent. Glorious. I literally do not care about my bias, this is art ✨🤌`, annotations: { arrows: baseArrows, markers: baseMarkers } }),
  ];
  return pick(lines)();
}

function _goodMoveRoast(
  move: AnalyzedMove,
  after: Chess,
  toSq: Square,
): { text: string; annotations: MoveAnnotation } {
  const fromSq = move.uci.slice(0, 2);
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(34, 197, 94, 0.7)"]], markers: [{ square: toSq, emoji: "✅" }] };
  const lines: (() => string)[] = [
    () => `✅ ${move.san} — can't roast this one. solid af. And I'm mad about it tbh 😤`,
    () => `👑 ${pn(move.pieceType, true)} to ${toSq}. Right move, right reasons. Ngl kinda sus at this elo 🤨`,
    () => `🫡 Google "${move.san} best move." Holy hell, they actually found it 💀👑`,
    () => {
      if (move.isCastle) return `🏰 Castling! FINALLY. The king was one more move away from witness protection 🫣💨`;
      return `✅ ${move.san} is clean. Accurate. The kind of move that makes me think they actually have a coach 🧐`;
    },
    () => {
      const dev = development(after, move.color as Color);
      if (dev.stuck.length === 0 && dev.total > 0)
        return `💅 ${move.san} — all pieces developed and coordinating. This is what chess is SUPPOSED to look like. Rare W 📈`;
      return `🫡 ${move.san} — alright fine, that was good. I grudgingly approve. Don't let it go to your head 😤`;
    },
    () => `👍 ${move.san} — no notes. Well played. Now do it again (you won't) 🫠`,
    () => `💪 ${move.san} is textbook. Based and positionally-pilled 📚`,
    () => {
      if (move.isCastle) return `🏰 The king retreats to safety. Even Garry Chess approves this one. Bongcloud DENIED 👑`;
      return `✅ ${move.san}. This person is unquestionably one of the players in chess history 🫡`;
    },
    () => `🫡 ${move.san} — okay who is this and what did they do with the person who blundered last move? Identity theft is not a joke 🕵️`,
    () => `✅ ${move.san}. The tu art of chess. Beautiful. No notes. Garry Chess would shed a single tear 🥲👑`,
    () => `🗿 ${move.san} — a good move? In THIS economy?? Google "good chess move." Holy hell 💀🫡`,
    () => `👑 ${move.san}. Are you kidding ??? This was actually GOOD. What the beep happened since last move 🤡✨`,
    () => `✅ ${move.san} — true will never die. And neither will this position after that move 🫡💪`,
    () => {
      if (move.isCapture) return `🍖 ${move.san} takes and it's CORRECT. Free material collected. The en passant of good decisions 🫡⛪`;
      return `🫡 ${move.san}. New response just dropped and it's actually competent. Rare 🗿✨`;
    },
  ];
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
): { text: string; annotations: MoveAnnotation } {
  const elo = summary.avgElo;
  const moveArrow: [string, string, string] = [_fromSq, _toSq, "rgba(239, 68, 68, 0.85)"];

  // 1. Early disaster
  if (move.moveNumber <= 8) {
    return { text: pick([
      `🚨 Move ${move.moveNumber} and the position is already COOKED. ${move.san}?? Speedrun any% 💀`,
      `😭 Move ${move.moveNumber}. ${move.san}. The game JUST STARTED and someone's already in shambles 📉`,
      `💀 We're ${move.moveNumber} moves in and ${move.san} just ended this person's whole career. The opening lasted shorter than my attention span 🫠`,
      `🗿 ${move.san} on move ${move.moveNumber}. The chess equivalent of faceplanting at the starting line. Very cool very normal 😭`,
      `🤡 Move ${move.moveNumber} and already a blunder. This is what happens when you skip the Bongcloud prep 👑💀`,
      `😭 Move ${move.moveNumber}. ${move.san}. Even Gavin from 3rd grade would be shaking his head rn. Incredible scenes 🗿`,
    ])!, annotations: { arrows: [moveArrow], markers: [{ square: _toSq, emoji: "💀" }] } };
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
    return { text: pick([
      `💀 ${move.san} and the ${vName} on ${onSq} is just SITTING there. Free. Like samples at Costco.${numAtt > 1 ? ` ${numAtt} pieces staring at it like 👀` : ""} 🆓`,
      `🤡 They played ${move.san} and left a whole ${vName} on ${onSq} up for grabs. Material DONATED to charity 🎁`,
      `☠️ The ${vName} on ${onSq}: "Am I a joke to you?" After ${move.san}? Apparently yes. RIP bozo 🪦`,
      `😭 ${move.san} — the ${vName} on ${onSq} has no friends. No defence, no compensation, just vibes fr fr 🗿`,
      `🆓 After ${move.san}, the ${vName} on ${onSq} is undefended. The opponent doesn't even need to think. It's literally free real estate 🏠`,
      `💀 ${move.san} and the ${vName} on ${onSq} is doing its best piñata impression. One hit and candy falls out 🎪🪅`,
      `🗿 ${move.san} — the ${vName} on ${onSq} is just standing there.${worst.type === "q" ? ` Oh no my queen! Eric Rosen is typing… 💀` : " Like a pinboard without the pin. Free material is free 🎁"}`,
      `🤡 ${move.san} and the ${vName} on ${onSq} is unprotected. Google "hanging pieces." Holy hell 🗿💀`,
    ])!, annotations: { arrows: hangArrows, markers: [{ square: onSq, emoji: "🆓" }] } };
  }

  // 3. Fork — validate forking piece is safe
  try {
    const oppMoves = after.moves({ verbose: true });
    for (const m of oppMoves) {
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
        const targets = forked.map(f => `${pn(f.type)} on ${f.square}`).join(" and ");
        const forkArrows: [string, string, string][] = [
          [m.from, forkSq, "rgba(239, 68, 68, 0.85)"],
          ...forked.map(f => [forkSq, f.square, "rgba(239, 68, 68, 0.6)"] as [string, string, string]),
        ];
        const forkMarkers = [{ square: forkSq, emoji: "🍴" }, ...forked.map(f => ({ square: f.square, emoji: "🎯" }))];
        return { text: pick([
          `🍴 ${move.san} walks straight into ${res.san} — a ${pn(lp.type)} fork hitting the ${targets}. Like stepping on a rake in Looney Tunes 💀`,
          `⚡ After ${move.san}, opponent plays ${res.san} and FORKS the ${targets}. Did they think the ${pn(lp.type)} was decorative?? 🗿`,
          `😱 ${move.san} allows a devastating ${pn(lp.type)} fork on ${m.to}: ${targets}. This is the "I didn't look at the whole board" special 🫠`,
          `🍴 They forked UP. ${move.san} → ${res.san} forks the ${targets}. It was at this moment they knew 😭`,
          `🍴 ${move.san} → ${res.san}. ${pn(lp.type, true)} fork on the ${targets}! Google "knight fork." Holy hell 🗿`,
          `💀 After ${move.san}, the opponent has ${res.san} forking the ${targets}. True will never die! But this position will 🪦`,
        ])!, annotations: { arrows: forkArrows, markers: forkMarkers } };
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
    return { text: pick([
      `📌 ${move.san} and now the ${pn(pin.pinned.type)} on ${pin.pinned.square} is PINNED to the ${pn(pin.target.type)} by the ${pn(pin.pinner.type)} on ${pin.pinner.square}. Stuck. Can't move. Just standing there like 🗿`,
      `🔒 After ${move.san}, the ${pn(pin.pinner.type)} on ${pin.pinner.square} pins the ${pn(pin.pinned.type)} on ${pin.pinned.square} to the ${pn(pin.target.type)}. That piece is a decoration now fr 🖼️`,
      `💀 ${move.san} walks into an absolute pin: ${pn(pin.pinner.type)} ${pin.pinner.square} → ${pn(pin.pinned.type)} ${pin.pinned.square} → ${pn(pin.target.type)} ${pin.target.square}. Self-handcuffing speedrun 🔒🏃`,
      `📌 ${move.san} and the ${pn(pin.pinned.type)} on ${pin.pinned.square} is PINNED. It has absorbed the adult soul of the ${pn(pin.target.type)} behind it. It cannot move. It is one with the pain 🗿💀`,
    ])!, annotations: { arrows: pinArrows, markers: pinMarkers } };
  }

  // 5. Bad sacrifice
  if (move.sacrificedMaterial || (capturedPiece && move.cpLoss > 150)) {
    const sacWhat = movedPiece ? pn(movedPiece.type) : "piece";
    return { text: pick([
      `🤡 They sacrificed the ${sacWhat} with ${move.san}! Bold! Brave! ...and terrible 💀`,
      `⚔️ SACRIFICE! Except the position doesn't justify it at ALL. ${move.san} is just losing material. This isn't Tal, this is tragedy 🎭😭`,
      `📖 "I'll sac the ${sacWhat} and get attacking chances" — narrator: there were no attacking chances 🕳️💀`,
      `🗿 ${move.san} gives up the ${sacWhat} for absolutely nothing. Kasparov could've made this work. This is not Kasparov 🤡`,
      `🤡 ${move.san} sacs the ${sacWhat}. "Trust me I saw the lines." The lines: 📊📉📉📉. You are not Tal. You are not even Petrosian doing PIPI 💀`,
      `⚔️ The ${sacWhat} has been sacrificed. Was it the Immortal Game? No. Was it even good? Also no. It's giving "I panic-clicked" energy 🗿`,
    ])!, annotations: { arrows: [moveArrow], markers: [{ square: _toSq, emoji: "🤡" }] } };
  }

  // 6. King safety
  const ks = kingSafety(after, moverColor);
  if (ks.score < 50 && ks.issues.length > 0) {
    const issue = ks.issues[0];
    const king = findKing(after, moverColor);
    const kingMarkers = king ? [{ square: king, emoji: "⚠️" }] : [];
    return { text: pick([
      `👑💀 ${move.san} and the king is in DANGER. ${issue}. More exposed than your browser history 🫣`,
      `🏃 After ${move.san}: ${issue}. This king needs witness protection not another pawn move 😭`,
      `🚨 ${move.san} leaves the king wide open — ${issue}. Can't keep getting away with this 🗿`,
    ])!, annotations: { arrows: [moveArrow], markers: kingMarkers } };
  }

  // 7. Development
  if (move.moveNumber > 10) {
    const dev = development(after, moverColor);
    if (dev.stuck.length >= 3) {
      return { text: pick([
        `😤 ${move.san} — and there are STILL ${dev.stuck.length} pieces on the back rank: ${dev.stuck.slice(0, 2).join(", ")}. It's move ${move.moveNumber}. DEVELOP. The army is at home watching Netflix 📺💀`,
        `🛋️ After ${move.san}, the ${dev.stuck[0]} still hasn't moved. ${dev.stuck.length} pieces are just vibing on the bench at move ${move.moveNumber} 🫠`,
        `💀 ${move.san} but ${dev.stuck.length} pieces are STILL undeveloped on move ${move.moveNumber}. The position is collapsing and half the army hasn't even shown up. This is fine 🔥🐶`,
      ])!, annotations: { arrows: [moveArrow], markers: dev.stuck.slice(0, 2).map(s => ({ square: s.split(" on ")[1] ?? _toSq, emoji: "💤" })) } };
    }
  }

  // 8. Pawn structure
  const pawns = pawnIssues(after, moverColor);
  if (pawns.doubled.length >= 2 || pawns.isolated.length >= 3) {
    return { text: pick([
      `🚧 ${move.san} — and the pawn structure is a war crime 🏚️${pawns.doubled.length > 0 ? ` Doubled pawns on the ${pawns.doubled[0]}.` : ""}${pawns.isolated.length > 0 ? ` ${pawns.isolated.length} isolated pawns.` : ""} Rubble, not a position 💀`,
      `🤮 After ${move.san}, look at this pawn structure.${pawns.doubled.length > 0 ? ` Doubled on ${pawns.doubled[0]}.` : ""}${pawns.isolated.length > 0 ? ` ${pawns.isolated.length} isolated pawns.` : ""} Philidor is rolling in his grave 🪦`,
    ])!, annotations: { arrows: [moveArrow], markers: [] } };
  }

  // 9. Generic
  return { text: pick([
    `💀 ${move.san}. Oh no. Oh NO. Position went from playable to "queue next game." Garry Chess is weeping 🎮🫠`,
    `😭 ${move.san} — and just like that, the advantage evaporates. Poof. Gone. Reduced to atoms 🚰`,
    `☠️ Ladies and gentlemen… ${move.san}. This move belongs in a museum. The Museum of Bad Decisions 🏛️💀`,
    `🗿 ${move.san} was so bad the chess pieces filed a complaint. Self-sabotage fr 😭`,
    `😱 I physically recoiled. ${move.san}? THAT was the plan? Rough doesn't even cover it 💀`,
    `🫠 ${move.san}. The kind of move that makes you Alt+F4 and go touch grass. Gg go next 🌱`,
    `🚨 Somewhere, a chess coach just felt a disturbance in the force. ${move.san}. In ${new Date().getFullYear()}. In this economy 💀🗿`,
    `💀 ${move.san}. Google "how to play chess." Holy hell. Actually don't—this person googled it and still ended up here 🤡`,
    `😭 ${move.san} — you know it's bad when even Petrosian would say "Are you kidding ??? What the beep are you talking about man" 🗿`,
    `☠️ ${move.san}. That was the most AnarchyChess move I've ever seen and I literally do not care to understand the thought process behind it 💀`,
    `🤡 ${move.san}. This move was doing PIPI in its pampers when good moves were being played. Absolute scenes 🗿😭`,
    `🚨 ${move.san}. Liers will kicked off... and so will this player's rating. True will never die, but this position already did 💀`,
  ])!, annotations: { arrows: [moveArrow], markers: [{ square: _toSq, emoji: "💀" }] } };
}

function _mistakeRoast(
  move: AnalyzedMove,
  before: Chess, after: Chess,
  moverColor: Color,
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
    return { text: pick([
      `😬 ${move.san} — and now the ${pn(h.type)} on ${h.square} is a little en prise. That's a "hmm" from me 🤨`,
      `⚠️ After ${move.san}, the ${pn(h.type)} on ${h.square} isn't looking too safe. I'm just saying 📉`,
    ])!, annotations: { arrows: hangArrows, markers: [{ square: h.square, emoji: "⚠️" }] } };
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

  const ksBefore = kingSafety(before, moverColor).score;
  const ksAfter = kingSafety(after, moverColor);
  if (ksAfter.score < ksBefore - 15 && ksAfter.issues.length > 0) {
    const king = findKing(after, moverColor);
    return { text: `⚠️ ${move.san} weakens the king — ${ksAfter.issues[0]}. Kinda sus. The king is not gonna be happy about that one 😬🫣`, annotations: {
      arrows: [moveArrow],
      markers: king ? [{ square: king, emoji: "⚠️" }] : [],
    } };
  }

  if (move.bestMoveSan) {
    return { text: pick([
      `😬 ${move.san} when ${move.bestMoveSan} was right there. Google "missed opportunity." Holy hell 📉`,
      `🫤 ${move.san} instead of ${move.bestMoveSan}. The advantage just did a backflip off a cliff 🏔️💀`,
      `😤 ${move.san} — ${move.bestMoveSan} was right there staring them in the face. "Was that really the best I could do?" No. No it wasn't 🗿`,
      `📉 ${move.bestMoveSan} was calling. They didn't answer. ${move.san} instead. This is the moment where everything goes sideways 🫠`,
      `🤦 ${move.san} over ${move.bestMoveSan}. That's like studying for the wrong exam fr 📚❌`,
      `🗿 ${move.san} instead of ${move.bestMoveSan}. I know what ${move.bestMoveSan} is dumbass you just blundered your advantage 💀`,
      `😬 ${move.san} played, ${move.bestMoveSan} wept. Are you kidding ??? What the beep are you talking about man 🗿🤡`,
      `💀 ${move.san} over ${move.bestMoveSan}. Google "en passant." They didn't take the best move and the brick is incoming ⛪🧱`,
      `🫠 ${move.san}. Garry Chess invented ${move.bestMoveSan} for a reason. This ain't it 👑📉`,
    ])!, annotations: { arrows: [moveArrow], markers: [] } };
  }

  return { text: pick([
    `😬 ${move.san} — that's not it chief. The position just got a lot worse. Someone should be nervous rn 😤`,
    `📉 ${move.san} and the position tilts. Advantage? Gone. Poof 💨`,
    `🫤 ${move.san}. The opponent should absolutely punish this. Key word: should 🤞`,
    `🤡 ${move.san}. Are you kidding? You were doing PIPI in your pampers when good moves were right there on the board 🗿`,
    `😬 ${move.san}. New mistake just dropped. This game is the gift that keeps on giving 🎁💀`,
    `🧱 ${move.san}. Didn't take the best move. Google "brick." The punishment is severe 🗿⛪`,
    `💀 ${move.san}. Liers will kicked off... from the advantage they had. True will never die, but their lead just did 🗿`,
  ])!, annotations: { arrows: [moveArrow], markers: [] } };
}

function _inaccuracyRoast(
  move: AnalyzedMove,
  after: Chess,
  moverColor: Color,
): { text: string; annotations: MoveAnnotation } {
  const dev = development(after, moverColor);
  const pawns = pawnIssues(after, moverColor);
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  const ann: MoveAnnotation = { arrows: [[fromSq, toSq, "rgba(168, 162, 158, 0.7)"]], markers: [] };

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
  ];
  return { text: pick(lines)(), annotations: ann };
}

function _fallbackLine(move: AnalyzedMove): { text: string; annotations: MoveAnnotation } | null {
  const cls = move.classification;
  const fromSq = move.uci.slice(0, 2);
  const toSq = move.uci.slice(2, 4);
  if (cls === "best" || cls === "great" || cls === "good") {
    return Math.random() < 0.3 ? { text: `✅ ${move.san} — solid move. Nothing to see here 🫡`, annotations: NO_ANNOTATIONS } : null;
  }
  if (cls === "blunder") return { text: `💀 ${move.san}. That one hurt. Liers will kicked off for this 😭`, annotations: { arrows: [[fromSq, toSq, "rgba(239, 68, 68, 0.85)"]], markers: [] } };
  if (cls === "mistake") return { text: `😬 ${move.san} — that's rough buddy. Position just got worse 📉`, annotations: { arrows: [[fromSq, toSq, "rgba(239, 183, 44, 0.85)"]], markers: [] } };
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
  ]);
  if (elo < 1300) return pick([
    "1000-1300 bracket. Where dreams of grandeur meet the reality of hung pieces 💀🎁",
    "This is the 'I watched one Gotham Chess video' elo range. Let's see if it helped 📺🤡",
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
  ]);
  if (elo < 2000) return pick([
    "1600-2000: now we're cooking 🍳🔥 These players have seen some things",
    "The 'I actually have an opening repertoire' bracket. Let's see if it holds up 📚🤞",
    "Advanced club players. They don't hang pieces often. Key word: OFTEN 💀",
    "At this level, the mistakes are subtle. The blunders? Spectacular and rare 🎆✨",
    "Good enough to be dangerous, not quite good enough to be consistent 😤💅",
    "1600-2000. The 'I beat Gavin from 3rd grade and it felt meaningful' bracket 🏆🗿",
    "1600-2000. Decent enough that when they blunder, even Petrosian would say 'Proffesionals knew how to lose' 🤡",
  ]);
  return pick([
    "Above 2000. These players actually know what they're doing. Usually 👑🧠",
    "Expert level. When they blunder up here, it's genuinely hard to spot why 🔍",
    "When a 2000+ player blunders, they blunder with ✨STYLE✨ 💀",
    "At this elo, the blunders are rare but when they drop? Holy hell 🤖🔍",
    "High-level chess. Where the difference between best and second-best actually matters 📊👑",
    "2000+. These players are unquestionably some of the players in chess history 👑🗿",
    "Expert chess. If they blunder up here, Hans's earpiece couldn't save them 💀🔊",
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

/** Middlegame transition commentary — injected once around 25-30% of game */
export function getMiddlegameComment(): string {
  return pick([
    "⚔️ We're entering the middlegame now. This is where the REAL chess begins. And by chess I mean blunders 💀🔥",
    "⚔️ Opening's over. Middlegame time. The book knowledge runs out and the vibes-based chess takes over 🫠📚",
    "⚔️ Alright, we're in the middlegame. From here it's all tactics, calculation, and panic-clicking. Mostly panic-clicking 🖱️💀",
    "⚔️ The pieces are developed (mostly). The kings are (hopefully) safe. Now the real battle begins. Google \"middlegame strategy.\" Holy hell 🗿⛪",
    "⚔️ Middlegame. Where plans are supposed to be made. At this elo? Plans = 'move a piece and see what happens' 🤷🔥",
    "⚔️ Theory has ended. We're in the wilderness now. Garry Chess can't save them. Nothing can 👑💀",
    "⚔️ The middlegame complex is taking shape. Tension on the board. Will they find the right plan? Spoiler: lol 🗿😭",
  ]);
}

/** Endgame transition commentary — injected once around 65-70% of game */
export function getEndgameComment(): string {
  return pick([
    "🏁 We've reached the endgame. The board is emptying out. Time for technique. Or the complete absence of it 🫠",
    "🏁 Endgame time. The moment where a good player converts and a bad player finds new and creative ways to draw. Or lose. Or stalemate 💀👑",
    "🏁 Most of the pieces are off the board. This is the endgame. Where games are won and lost. Mostly lost at this elo 🗿📉",
    "🏁 The endgame. King activity, pawn structure, zugzwang — words that exist. Whether these players know them? I literally do not care to speculate 🫠🗿",
    "🏁 We're in the endgame now. As Thanos once said. Except instead of snapping, someone's about to blunder a pawn and cry 💀🧤",
    "🏁 Endgame. Where the pawns become IMPORTANT. Google \"how to promote a pawn.\" Holy hell, they're gonna need it ⛪♟️",
    "🏁 Board's clearing out. The endgame approaches. Will they know how to convert? At this elo? *snort* 🗿💀",
  ]);
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
        "Huh, so they DO know how to play chess? Could've fooled me with the earlier moves 🤨",
        "That move was... competent??? I was NOT expecting that. My whole read on this game just shifted 😳",
        "Oh? Oh?? They're not total beginners? The plot thickens 🧐📖",
        "I was ready to call this a sub-500 game but that move has me second-guessing everything 🤯",
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
      ]);
  }
}

/* ================================================================== */
/*  Opening roast                                                       */
/* ================================================================== */

export function getOpeningRoast(opening: string): string {
  const o = opening.toLowerCase();

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
  return pick([
    `📖 ${opening}. Interesting choice. Let's see if they actually know the theory or if they're freestyling by move 3 🎤🗿`,
    `📖 ${opening}. An opening has been played. Whether they know WHY these moves are played is... debatable 🤨📚`,
    `📖 ${opening}. Google "${opening}." Holy hell — this should be interesting 💀⛪`,
    `📖 ${opening}. Garry Chess himself would have an opinion about this opening choice. I literally do not care, let's just see what happens 🗿👑`,
    `📖 ${opening}. The opening is set. Now we wait for the first blunder. It's not a question of IF, it's WHEN 💀📉`,
    `📖 ${opening}. Theory has been played. How long until someone goes off-book? Taking bets now 🎲🔥`,
    `📖 ${opening}. They chose their weapon. Let the suffering begin 🗡️🫠`,
    `📖 ${opening}. Alright, opening identified. Liers will kicked off from here. True will never die. But one of these players' positions will 🗿💀`,
  ]);
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
  "📊 This game was unquestionably one of the chess games of all time. The tu art of chess, truly 🗿👑",
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
