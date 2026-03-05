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
        hanging.push(p);
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
): string | null {
  try {
    return _generatePositionAware(move, usedLines, summary);
  } catch {
    return _fallbackLine(move);
  }
}

function _generatePositionAware(
  move: AnalyzedMove,
  used: Set<string>,
  summary: GameSummary,
): string | null {
  const before = new Chess(move.fen);
  let after: Chess;
  try { after = new Chess(move.fenAfter); } catch { return _fallbackLine(move); }

  const moverColor = move.color as Color;
  const fromSq = move.uci.slice(0, 2) as Square;
  const toSq = move.uci.slice(2, 4) as Square;
  const movedPiece = before.get(fromSq);
  const landedPiece = after.get(toSq);
  const capturedPiece = before.get(toSq);

  if (move.classification === "brilliant" || (move.classification === "best" && move.sacrificedMaterial)) {
    return _emit(used, _brilliantRoast(move, after, toSq, landedPiece));
  }

  if (move.classification === "great" || move.classification === "best") {
    if (Math.random() > 0.35) return null;
    return _emit(used, _goodMoveRoast(move, after, toSq));
  }

  if (move.missedMateInN && move.missedMateInN <= 5) {
    return _emit(used, _missedMateRoast(move));
  }

  if (move.classification === "blunder") {
    return _emit(used, _blunderRoast(move, before, after, moverColor, fromSq, toSq, movedPiece, capturedPiece, summary));
  }

  if (move.classification === "mistake") {
    return _emit(used, _mistakeRoast(move, before, after, moverColor));
  }

  if (move.classification === "inaccuracy") {
    if (Math.random() > 0.4) return null;
    return _emit(used, _inaccuracyRoast(move, after, moverColor));
  }

  return null;
}

function _emit(used: Set<string>, line: string): string {
  used.add(line);
  return line;
}

/* ================================================================== */
/*  Roast Generators — meme edition 🔥                                  */
/* ================================================================== */

function _brilliantRoast(
  move: AnalyzedMove,
  after: Chess,
  toSq: Square,
  landed: ReturnType<Chess["get"]>,
): string {
  const lines: (() => string)[] = [
    () => `🤯 ${move.san}?! EXCUSE ME?? That's actually BRILLIANT. ${pn(move.pieceType, true)} to ${toSq}? Engine approved, I'm shooketh 🔥`,
    () => `✨ Nah hold up. ${move.san} is literally Stockfish's #1 choice. WHERE was this energy 3 moves ago when they were throwing?? 😤`,
    () => `🧠 ${pn(move.pieceType, true)} to ${toSq}. That's the best move on the board. I'm actually speechless. This person has NO business playing this well 💀`,
    () => {
      if (move.sacrificedMaterial && landed)
        return `⚡ A REAL sacrifice! ${pn(landed.type, true)} to ${toSq} — gives up material for a crushing attack. Tal energy fr fr 👑🔥`;
      return `✨ ${move.san} — the only move, the hardest move, and they found it. Alekhine is smiling from heaven rn 🫡`;
    },
    () => `🌟 Galaxy-brain ${move.san}. The kind of move that makes you re-check the elo. Still low. Mind = blown 🤯`,
    () => {
      const forks = landed ? detectForks(after, toSq, { type: landed.type, color: landed.color, square: toSq }) : [];
      if (forks.length >= 2) {
        const targets = forks.map(f => `${pn(f.type)} on ${f.square}`).join(" and ");
        return `🍴 ${move.san} FORKS the ${targets}! Actually calculated?? At this elo?? I'm calling hacks 🕵️✨`;
      }
      return `🔥 ${move.san} is absolutely disgusting. In a good way. Chef's kiss 💋👨‍🍳`;
    },
    () => `⚡ ${move.san} goes HARD. The position just shifted and the opponent didn't even see it coming. Built different ngl 💅`,
    () => `👑 Best move in the entire game and it's not even close. ${pn(move.pieceType, true)} to ${toSq}. *chef's kiss* 🤌✨`,
  ];
  return pick(lines)();
}

function _goodMoveRoast(
  move: AnalyzedMove,
  after: Chess,
  toSq: Square,
): string {
  const lines: (() => string)[] = [
    () => `✅ ${move.san} — can't roast this one. solid af. And I'm mad about it tbh 😤`,
    () => `👑 ${pn(move.pieceType, true)} to ${toSq}. Right move, right reasons. Ngl kinda sus at this elo 🤨`,
    () => `🫡 Engine top choice? At THIS elo? *runs background check* 🕵️`,
    () => {
      if (move.isCastle) return `🏰 Castling! FINALLY. The king was one more move away from witness protection 🫣💨`;
      return `✅ ${move.san} is clean. Accurate. The kind of move that makes me think they actually have a coach 🧐`;
    },
    () => {
      const dev = development(after, move.color as Color);
      if (dev.stuck.length === 0 && dev.total > 0)
        return `💅 ${move.san} — all pieces developed and coordinating. This is what chess is SUPPOSED to look like. Rare W 📈`;
      return `🫡 Solid ${move.san}. Stockfish approves. I grudgingly approve. Don't let it go to your head 😤`;
    },
    () => `👍 ${move.san} — no notes. Well played. Now do it again (you won't) 🫠`,
    () => `💪 ${move.san} is textbook. Based and positionally-pilled 📚`,
  ];
  return pick(lines)();
}

function _missedMateRoast(move: AnalyzedMove): string {
  const n = move.missedMateInN!;
  const lines: (() => string)[] = [
    () => `💀 They had MATE IN ${n}. M-A-T-E. IN. ${n}. And they played ${move.san}?! I'm calling the police 🚨🚨`,
    () => `🫠 Mate in ${n} was RIGHT THERE. On the board. STARING at them. They chose ${move.san} instead. actual pain 😭`,
    () => `😱 HOW do you miss mate in ${n}?! The winning move is literally CHECKMATE and they played ${move.san}. I can't breathe 💀`,
    () => `🚨 Imagine having mate in ${n} and thinking "nah let me play ${move.san} and improve my position." YOUR POSITION IS MATE BRO 🗿`,
    () => `☠️ Missing mate in ${n} should be a criminal offence. ${move.san} instead of winning the game outright. suffering.jpg 😭`,
    () => `🤡 Mate in ${n} available but ${move.san} felt right apparently. It was not. It was so very not. 💀`,
    () => `⚰️ Mate blindness activated. Forced checkmate in ${n} on the board. They played ${move.san}. I need to lie down 🫠`,
  ];
  return pick(lines)();
}

function _blunderRoast(
  move: AnalyzedMove,
  before: Chess, after: Chess,
  moverColor: Color,
  _fromSq: Square, _toSq: Square,
  movedPiece: ReturnType<Chess["get"]>,
  capturedPiece: ReturnType<Chess["get"]>,
  summary: GameSummary,
): string {
  const elo = summary.avgElo;

  // 1. Early disaster
  if (move.moveNumber <= 8) {
    return pick([
      `🚨 Move ${move.moveNumber} and the position is already COOKED. ${move.san}?? Speedrun any% 💀`,
      `😭 Move ${move.moveNumber}. ${move.san}. The game JUST STARTED and someone's already in shambles 📉`,
      `💀 We're ${move.moveNumber} moves in and ${move.san} just ended this person's whole career. The opening lasted shorter than my attention span 🫠`,
      `🗿 ${move.san} on move ${move.moveNumber}. The chess equivalent of faceplanting at the starting line. Very cool very normal 😭`,
    ])!;
  }

  // 2. Hanging pieces
  const hanging = detectHanging(after, moverColor);
  if (hanging.length > 0) {
    const worst = hanging.reduce((a, b) => (PIECE_VALUES[b.type] ?? 0) > (PIECE_VALUES[a.type] ?? 0) ? b : a);
    const vName = pn(worst.type);
    const onSq = worst.square;
    const numAtt = countAttackers(after, onSq, opp(moverColor));
    return pick([
      `💀 ${move.san} and the ${vName} on ${onSq} is just SITTING there. Free. Like samples at Costco.${numAtt > 1 ? ` ${numAtt} pieces staring at it like 👀` : ""} 🆓`,
      `🤡 They played ${move.san} and left a whole ${vName} on ${onSq} up for grabs. Material DONATED to charity 🎁`,
      `☠️ The ${vName} on ${onSq}: "Am I a joke to you?" After ${move.san}? Apparently yes. RIP bozo 🪦`,
      `😭 ${move.san} — the ${vName} on ${onSq} has no friends. No defence, no compensation, just vibes fr fr 🗿`,
      `🆓 After ${move.san}, the ${vName} on ${onSq} is undefended. The opponent doesn't even need to think. It's literally free real estate 🏠`,
      `💀 ${move.san} and the ${vName} on ${onSq} is doing its best piñata impression. One hit and candy falls out 🎪🪅`,
    ])!;
  }

  // 3. Fork
  try {
    const oppMoves = after.moves({ verbose: true });
    for (const m of oppMoves) {
      const sim = new Chess(after.fen());
      const res = sim.move(m);
      if (!res) continue;
      const lp = sim.get(m.to as Square);
      if (!lp) continue;
      const forked = detectForks(sim, m.to as Square, { type: lp.type, color: lp.color, square: m.to as Square });
      const valuable = forked.filter(f => f.type === "k" || f.type === "q" || f.type === "r");
      if (forked.length >= 2 && valuable.length >= 1) {
        const targets = forked.map(f => `${pn(f.type)} on ${f.square}`).join(" and ");
        return pick([
          `🍴 ${move.san} walks straight into ${res.san} — a ${pn(lp.type)} fork hitting the ${targets}. Like stepping on a rake in Looney Tunes 💀`,
          `⚡ After ${move.san}, opponent plays ${res.san} and FORKS the ${targets}. Did they think the ${pn(lp.type)} was decorative?? 🗿`,
          `😱 ${move.san} allows a devastating ${pn(lp.type)} fork on ${m.to}: ${targets}. This is the "I didn't look at the whole board" special 🫠`,
          `🍴💀 They forked UP. ${move.san} → ${res.san} forks the ${targets}. It was at this moment they knew 😭`,
        ])!;
      }
    }
  } catch {}

  // 4. Pin
  const pinsBefore = detectPins(before, moverColor);
  const pinsAfter = detectPins(after, moverColor);
  const newPins = pinsAfter.filter(pa => !pinsBefore.some(pb => pb.pinned.square === pa.pinned.square && pb.pinner.square === pa.pinner.square));
  if (newPins.length > 0) {
    const pin = newPins[0];
    return pick([
      `📌 ${move.san} and now the ${pn(pin.pinned.type)} on ${pin.pinned.square} is PINNED to the ${pn(pin.target.type)} by the ${pn(pin.pinner.type)} on ${pin.pinner.square}. Stuck. Can't move. Just standing there like 🗿`,
      `🔒 After ${move.san}, the ${pn(pin.pinner.type)} on ${pin.pinner.square} pins the ${pn(pin.pinned.type)} on ${pin.pinned.square} to the ${pn(pin.target.type)}. That piece is a decoration now fr 🖼️`,
      `💀 ${move.san} walks into an absolute pin: ${pn(pin.pinner.type)} ${pin.pinner.square} → ${pn(pin.pinned.type)} ${pin.pinned.square} → ${pn(pin.target.type)} ${pin.target.square}. Self-handcuffing speedrun 🔒🏃`,
    ])!;
  }

  // 5. Bad sacrifice
  if (move.sacrificedMaterial || (capturedPiece && move.cpLoss > 150)) {
    const sacWhat = movedPiece ? pn(movedPiece.type) : "piece";
    return pick([
      `🤡 They sacrificed the ${sacWhat} with ${move.san}! Bold! Brave! ...and terrible 💀`,
      `⚔️ SACRIFICE! Except the position doesn't justify it at ALL. ${move.san} is just losing material. This isn't Tal, this is tragedy 🎭😭`,
      `📖 "I'll sac the ${sacWhat} and get attacking chances" — narrator: there were no attacking chances 🕳️💀`,
      `🗿 ${move.san} gives up the ${sacWhat} for absolutely nothing. Kasparov could've made this work. This is not Kasparov 🤡`,
    ])!;
  }

  // 6. King safety
  const ks = kingSafety(after, moverColor);
  if (ks.score < 50 && ks.issues.length > 0) {
    const issue = ks.issues[0];
    return pick([
      `👑💀 ${move.san} and the king is in DANGER. ${issue}. More exposed than your browser history 🫣`,
      `🏃 After ${move.san}: ${issue}. This king needs witness protection not another pawn move 😭`,
      `🚨 ${move.san} leaves the king wide open — ${issue}. Can't keep getting away with this 🗿`,
    ])!;
  }

  // 7. Development
  if (move.moveNumber > 10) {
    const dev = development(after, moverColor);
    if (dev.stuck.length >= 3) {
      return pick([
        `😤 ${move.san} — and there are STILL ${dev.stuck.length} pieces on the back rank: ${dev.stuck.slice(0, 2).join(", ")}. It's move ${move.moveNumber}. DEVELOP. The army is at home watching Netflix 📺💀`,
        `🛋️ After ${move.san}, the ${dev.stuck[0]} still hasn't moved. ${dev.stuck.length} pieces are just vibing on the bench at move ${move.moveNumber} 🫠`,
        `💀 ${move.san} but ${dev.stuck.length} pieces are STILL undeveloped on move ${move.moveNumber}. The position is collapsing and half the army hasn't even shown up. This is fine 🔥🐶`,
      ])!;
    }
  }

  // 8. Pawn structure
  const pawns = pawnIssues(after, moverColor);
  if (pawns.doubled.length >= 2 || pawns.isolated.length >= 3) {
    return pick([
      `🚧 ${move.san} — and the pawn structure is a war crime 🏚️${pawns.doubled.length > 0 ? ` Doubled pawns on the ${pawns.doubled[0]}.` : ""}${pawns.isolated.length > 0 ? ` ${pawns.isolated.length} isolated pawns.` : ""} Rubble, not a position 💀`,
      `🤮 After ${move.san}, look at this pawn structure.${pawns.doubled.length > 0 ? ` Doubled on ${pawns.doubled[0]}.` : ""}${pawns.isolated.length > 0 ? ` ${pawns.isolated.length} isolated pawns.` : ""} Philidor is rolling in his grave 🪦`,
    ])!;
  }

  // 9. Generic
  return pick([
    `💀 ${move.san}. Oh no. Oh NO. The eval bar just had a seizure. Position went from playable to "queue next game" 🎮🫠`,
    `😭 ${move.san} — and just like that, the advantage evaporates. Poof. Gone. Reduced to atoms 🚰`,
    `☠️ Ladies and gentlemen… ${move.san}. This move belongs in a museum. The Museum of Bad Decisions 🏛️💀`,
    `🗿 ${move.san} was so bad the chess pieces filed a complaint. Self-sabotage fr 😭`,
    `😱 I physically recoiled. ${move.san}? THAT was the plan? Rough doesn't even cover it 💀`,
    `🫠 ${move.san}. The kind of move that makes you Alt+F4 and go touch grass. Gg go next 🌱`,
    `🚨 Somewhere, a chess coach just felt a disturbance in the force. ${move.san}. In ${new Date().getFullYear()}. In this economy 💀🗿`,
  ])!;
}

function _mistakeRoast(
  move: AnalyzedMove,
  before: Chess, after: Chess,
  moverColor: Color,
): string {
  const hanging = detectHanging(after, moverColor);
  if (hanging.length > 0) {
    const h = hanging[0];
    return pick([
      `😬 ${move.san} — and now the ${pn(h.type)} on ${h.square} is a little en prise. That's a "hmm" from me 🤨`,
      `⚠️ After ${move.san}, the ${pn(h.type)} on ${h.square} isn't looking too safe. I'm just saying 📉`,
    ])!;
  }

  const newPins = detectPins(after, moverColor);
  if (newPins.length > 0) {
    const p = newPins[0];
    return `📌 ${move.san} and the ${pn(p.pinned.type)} on ${p.pinned.square} is pinned now. Pinned pieces = sad pieces 😔🔒`;
  }

  const ksBefore = kingSafety(before, moverColor).score;
  const ksAfter = kingSafety(after, moverColor);
  if (ksAfter.score < ksBefore - 15 && ksAfter.issues.length > 0) {
    return `⚠️ ${move.san} weakens the king — ${ksAfter.issues[0]}. Kinda sus. The king is not gonna be happy about that one 😬🫣`;
  }

  if (move.bestMoveSan) {
    return pick([
      `😬 ${move.san} when ${move.bestMoveSan} was right there. The eval bar is NOT happy about this 📉`,
      `🫤 ${move.san} instead of ${move.bestMoveSan}. The advantage just did a backflip off a cliff 🏔️💀`,
      `😤 ${move.san} — ${move.bestMoveSan} was right there staring them in the face. "Was that really the best I could do?" No. No it wasn't 🗿`,
      `📉 ${move.bestMoveSan} was calling. They didn't answer. ${move.san} instead. This is the moment where everything goes sideways 🫠`,
      `🤦 ${move.san} over ${move.bestMoveSan}. That's like studying for the wrong exam fr 📚❌`,
    ])!;
  }

  return pick([
    `😬 ${move.san} — that's not it chief. The position just got a lot worse. Someone should be nervous rn 😤`,
    `📉 ${move.san} and the position tilts. Advantage? Gone. Poof 💨`,
    `🫤 ${move.san}. The opponent should absolutely punish this. Key word: should 🤞`,
  ])!;
}

function _inaccuracyRoast(
  move: AnalyzedMove,
  after: Chess,
  moverColor: Color,
): string {
  const dev = development(after, moverColor);
  const pawns = pawnIssues(after, moverColor);

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
  ];
  return pick(lines)();
}

function _fallbackLine(move: AnalyzedMove): string | null {
  const cls = move.classification;
  if (cls === "best" || cls === "great" || cls === "good") {
    return Math.random() < 0.3 ? `✅ ${move.san} — solid move. Nothing to see here 🫡` : null;
  }
  if (cls === "blunder") return `💀 ${move.san}. That one hurt. The eval bar is in pain 😭`;
  if (cls === "mistake") return `😬 ${move.san} — that's rough buddy. Position just got worse 📉`;
  if (cls === "inaccuracy") return Math.random() < 0.4 ? `🤷 ${move.san} — there was something better` : null;
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
  ]);
  if (elo < 1300) return pick([
    "1000-1300 bracket. Where dreams of grandeur meet the reality of hung pieces 💀🎁",
    "This is the 'I watched one Gotham Chess video' elo range. Let's see if it helped 📺🤡",
    "Some opening knowledge, lots of one-move blunders. Classic 1000-1300 energy 🔥💀",
    "The 'I can see two moves ahead but not three' zone. My favourite 🤌",
    "They know the rules. They just don't know what to do with them yet 🤷🗿",
  ]);
  if (elo < 1600) return pick([
    "1300-1600: the 'I'm actually decent… sometimes' bracket 😤💅",
    "Intermediate chess. They know tactics exist. Finding them in their own games? Different story 🔍💀",
    "The intermediate plateau. Where improvement goes to die and blunders go to thrive 📉🪦",
    "They have ideas. The ideas are just not always good. But they HAVE them 🧠🤡",
    "This is the elo where you start losing to people who actually study. Humbling 📚😭",
  ]);
  if (elo < 2000) return pick([
    "1600-2000: now we're cooking 🍳🔥 These players have seen some things",
    "The 'I actually have an opening repertoire' bracket. Let's see if it holds up 📚🤞",
    "Advanced club players. They don't hang pieces often. Key word: OFTEN 💀",
    "At this level, the mistakes are subtle. The blunders? Spectacular and rare 🎆✨",
    "Good enough to be dangerous, not quite good enough to be consistent 😤💅",
  ]);
  return pick([
    "Above 2000. These players actually know what they're doing. Usually 👑🧠",
    "Expert level. When they blunder up here, it's genuinely hard to spot why 🔍",
    "When a 2000+ player blunders, they blunder with ✨STYLE✨ 💀",
    "At this elo, you need an engine to find the mistakes. Let's see 🤖🔍",
    "High-level chess. Where the difference between best and second-best actually matters 📊👑",
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

export const REVEAL_TOO_HIGH = [
  "You thought they were better than that? Generous 🤡",
  "Overestimated. WAY overestimated. These are MORTALS 💀",
  "You gave too much credit. Rookie mistake fr 😤",
  "That's like thinking the guy at the park is secretly a GM 🗿",
  "You sweet summer child. This is LOW elo chess 🫠",
  "Your faith in humanity's chess ability is touching, but misplaced 💀🤝",
  "If only they were that good. If only 😭",
];

export const REVEAL_TOO_LOW = [
  "How DARE you underestimate these players 😤💅",
  "They're actually better than you thought. Uncomfortable, isn't it? 🤡",
  "You went too low! These people have TRAINING 📚💪",
  "Disrespectful. These players actually practice 🫡",
  "You judged too harshly. They blundered, but they also played SOME good moves 🤷",
  "They're higher rated than that, believe it or not 😳",
  "Even with the blunders, they're rated higher than your guess. Ratio'd 📉🤡",
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
