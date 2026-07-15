#!/usr/bin/env node
/**
 * classify-structures.mjs — structural position classifier for chess games.
 *
 * Analyzes PGN input (stdin) and classifies each game's structural features:
 * fianchetto patterns, center types, castling, IQP, pawn chains, etc.
 *
 * USAGE
 *   node scripts/chess-stats/classify-structures.mjs < games.pgn > structures.json
 *   node scripts/chess-stats/classify-structures.mjs --limit 10000 < games.pgn
 */

import readline from "node:readline";
import { Chess } from "chess.js";

const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i !== -1 ? Number(process.argv[i + 1]) : Infinity;
})();

const CENTER_SQ = ["d4", "d5", "e4", "e5"];
const FIANCHETTO_CFG = {
  w: { kingside: { b: "g2", p: "g3" }, queenside: { b: "b2", p: "b3" } },
  b: { kingside: { b: "g7", p: "g6" }, queenside: { b: "b7", p: "b6" } },
};

// ── Board helpers ──

function findKing(chess, color) {
  const b = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = b[r][f];
      if (p && p.type === "k" && p.color === color) {
        return { file: f, rank: 8 - r, square: "abcdefgh"[f] + (8 - r) };
      }
    }
  }
  return null;
}

// ── Detectors ──

function hasFianchetto(chess, color, side) {
  const cfg = FIANCHETTO_CFG[color][side];
  const bishop = chess.get(cfg.b);
  const pawn = chess.get(cfg.p);
  return !!(bishop && bishop.type === "b" && bishop.color === color
    && pawn && pawn.type === "p" && pawn.color === color);
}

function detectFianchetto(chess, color) {
  const ks = hasFianchetto(chess, color, "kingside");
  const qs = hasFianchetto(chess, color, "queenside");
  if (ks && qs) return "double";
  if (ks || qs) return "single";
  return "none";
}

function detectCenter(chess) {
  const count = CENTER_SQ.filter(sq => {
    const p = chess.get(sq);
    return p && p.type === "p";
  }).length;
  if (count >= 3) return "closed";
  if (count === 0) return "open";
  return "semi-open";
}

function detectCastling(chess) {
  const wk = (() => { const k = findKing(chess, "w"); return k && k.rank === 1 && (k.file === 2 || k.file === 6); })();
  const bk = (() => { const k = findKing(chess, "b"); return k && k.rank === 8 && (k.file === 2 || k.file === 6); })();
  if (!wk && !bk) return "none";
  if (wk && bk) {
    const ws = findKing(chess, "w");
    const bs = findKing(chess, "b");
    const wSide = ws.file <= 3 ? "queenside" : "kingside";
    const bSide = bs.file <= 3 ? "queenside" : "kingside";
    return wSide !== bSide ? "opposite" : "same-side";
  }
  return wk ? "white-only" : "black-only";
}

function detectIQP(chess, color) {
  const r = color === "w" ? 4 : 5;
  const dp = chess.get(`d${r}`);
  if (!dp || dp.type !== "p" || dp.color !== color) return false;
  for (let ir = 2; ir <= 7; ir++) {
    const c = chess.get(`c${ir}`);
    const e = chess.get(`e${ir}`);
    if (c && c.type === "p" && c.color === color) return false;
    if (e && e.type === "p" && e.color === color) return false;
  }
  return true;
}

function detectPawnStructure(chess, color) {
  const files = {};
  for (let f = 0; f < 8; f++) {
    files[f] = [];
    for (let r = 2; r <= 7; r++) {
      const p = chess.get("abcdefgh"[f] + r);
      if (p && p.type === "p" && p.color === color) files[f].push(r);
    }
  }
  const total = Object.values(files).reduce((s, r) => s + r.length, 0);
  if (total === 0) return "no-pawns";
  const doubled = Object.values(files).filter(r => r.length >= 2).length;
  const isolated = Object.keys(files).filter((_, i) => {
    return files[i].length > 0 && (!files[i - 1] || files[i - 1].length === 0) && (!files[i + 1] || files[i + 1].length === 0);
  }).length;
  if (isolated > 0 && doubled > 0) return "shattered";
  if (isolated > 0) return "isolated";
  if (doubled > 0) return "doubled";
  return "healthy";
}

function detectKingSafety(chess, color) {
  const king = findKing(chess, color);
  if (!king) return "exposed";
  const back = color === "w" ? 1 : 8;
  if (king.rank !== back) return "exposed";
  const pr = color === "w" ? 2 : 7;
  let shield = 0;
  for (let f = Math.max(0, king.file - 1); f <= Math.min(7, king.file + 1); f++) {
    const p = chess.get("abcdefgh"[f] + pr);
    if (p && p.type === "p" && p.color === color) shield++;
  }
  if (shield >= 3) return "secure";
  if (shield >= 2) return "adequate";
  if (shield >= 1) return "thin";
  return "exposed";
}

function detectPawnChainLength(chess, color) {
  // Build pawn map
  const pawns = {};
  for (let f = 0; f < 8; f++) {
    for (let r = 2; r <= 7; r++) {
      const sq = "abcdefgh"[f] + r;
      const p = chess.get(sq);
      if (p && p.type === "p" && p.color === color) pawns[sq] = true;
    }
  }
  let longest = 1;
  for (let f = 0; f < 8; f++) {
    for (let r = 2; r <= 7; r++) {
      const sq = "abcdefgh"[f] + r;
      if (!pawns[sq]) continue;
      let len = 1, cf = f;
      for (let nr = r + 1; nr <= 7; nr++) {
        const leftSq = cf > 0 ? "abcdefgh"[cf - 1] + nr : null;
        const rightSq = cf < 7 ? "abcdefgh"[cf + 1] + nr : null;
        if (leftSq && pawns[leftSq]) { len++; cf--; }
        else if (rightSq && pawns[rightSq]) { len++; cf++; }
        else break;
      }
      if (len > longest) longest = len;
    }
  }
  return longest;
}

// ── Aggregator ──

const data = {}; // axis -> pattern -> { games, wins, draws, losses }

function record(axis, pattern, winner, userColor) {
  if (!data[axis]) data[axis] = {};
  if (!data[axis][pattern]) data[axis][pattern] = { games: 0, wins: 0, draws: 0, losses: 0 };
  const s = data[axis][pattern];
  s.games++;
  if (winner === "draw") s.draws++;
  else if (winner === userColor) s.wins++;
  else s.losses++;
}

// ── PGN parsing ──

const TAG_RE = /^\[(\w+)\s+"(.*)"\]\s*$/;
const allGames = [];
let buf = "";
let hasEvent = false;

for await (const line of readline.createInterface({ input: process.stdin, crlfDelay: Infinity })) {
  if (line.startsWith("[Event ")) {
    if (hasEvent) flush();
    hasEvent = true;
  }
  buf += line + "\n";
}
flush();

function flush() {
  if (!hasEvent || !buf.trim()) { buf = ""; return; }
  const lines = buf.trim().split("\n");
  buf = "";
  
  const headers = {};
  let movetextIdx = -1;
  let result = null;

  for (let i = 0; i < lines.length; i++) {
    const m = TAG_RE.exec(lines[i]);
    if (m) {
      headers[m[1]] = m[2];
      if (m[1] === "Result") result = m[2];
    } else if (lines[i].trim() !== "" && movetextIdx === -1) {
      movetextIdx = i;
    }
  }

  if (movetextIdx === -1) return;
  const movesText = lines.slice(movetextIdx).join(" ").trim();
  if (!movesText) return;
  allGames.push({ result, movesText });
}

// ── Analyze ──

const SAN_NUM = /^\d+\./;

function parseAndClassify(movesText) {
  const clean = movesText.replace(/\s*(1-0|0-1|1\/2-1\/2)\s*$/, "").trim();
  const tokens = clean.split(/\s+/);
  const chess = new Chess();
  let ply = 0;
  let classified = false;

  for (const token of tokens) {
    if (!token || SAN_NUM.test(token)) continue;
    try {
      const r = chess.move(token);
      if (r) ply++;
    } catch { /* skip */ }
    // Classify at ply 15 (structures settled)
    if (ply === 15 && !classified) {
      const winner = "unknown"; // placeholder, we handle winner outside
      const uc = "white";
      const opp = "black";
      const uF = detectFianchetto(chess, uc[0]);
      const oF = detectFianchetto(chess, opp[0]);
      const uD = hasFianchetto(chess, uc[0], "kingside") && hasFianchetto(chess, uc[0], "queenside");
      classified = true;
      return {
        ply,
        snapshots: { uF, oF, uD,
          center: detectCenter(chess),
          castling: detectCastling(chess),
          iqpW: detectIQP(chess, "w"),
          iqpB: detectIQP(chess, "b"),
          pawnStruct: detectPawnStructure(chess, uc[0]),
          kingSafety: detectKingSafety(chess, uc[0]),
          chainLen: detectPawnChainLength(chess, uc[0]),
        },
      };
    }
  }

  return { ply, snapshots: null };
}

let classified = 0;
const winnerMap = { "1-0": "white", "0-1": "black", "1/2-1/2": "draw" };

for (const g of allGames) {
  if (classified >= LIMIT) break;
  const { result, movesText } = g;
  const { ply, snapshots: S } = parseAndClassify(movesText);
  if (!S) continue;

  const winner = winnerMap[result] || null;
  const uc = "white"; // user's perspective
  const opp = "black";

  record("fianchetto", S.uF, winner, uc);
  if (S.oF !== "none") record("fianchetto", "opponent-" + S.oF, winner, uc);
  record("doubleFianchetto", S.uD ? "double" : "not-double", winner, uc);
  record("centerType", S.center, winner, uc);
  record("castling", S.castling, winner, uc);
  record("iqp", S.iqpW ? "white-iqp" : S.iqpB ? "black-iqp" : "none", winner, uc);
  record("pawnStructure", S.pawnStruct, winner, uc);
  record("kingSafety", S.kingSafety, winner, uc);
  record("pawnChain", S.chainLen >= 3 ? `chain-${S.chainLen}` : "none", winner, uc);

  classified++;
}

// ── Format output ──

const AXES = ["fianchetto", "doubleFianchetto", "centerType", "castling", "iqp", "pawnStructure", "kingSafety", "pawnChain"];
const byAxis = {};
const allInsights = [];

for (const axis of AXES) {
  const entries = data[axis] ? Object.entries(data[axis]).map(([pattern, s]) => ({
    pattern, games: s.games, wins: s.wins, draws: s.draws, losses: s.losses,
    winPct: s.games > 0 ? +((s.wins / s.games) * 100).toFixed(1) : 0,
  })).sort((a, b) => b.games - a.games) : [];

  // Generate insight if significant patterns found
  const sig = entries.filter(e => e.games >= 3);
  if (sig.length >= 2) {
    const sorted = [...sig].sort((a, b) => b.winPct - a.winPct);
    const gap = +(sorted[0].winPct - sorted[sorted.length - 1].winPct).toFixed(1);
    if (gap >= 10) {
      allInsights.push({
        axis,
        best: { pattern: sorted[0].pattern, winPct: sorted[0].winPct, games: sorted[0].games },
        worst: { pattern: sorted[sorted.length - 1].pattern, winPct: sorted[sorted.length - 1].winPct, games: sorted[sorted.length - 1].games },
        gap,
        text: `Win ${sorted[0].winPct}% in ${axis}=${sorted[0].pattern} vs ${sorted[sorted.length - 1].winPct}% in ${axis}=${sorted[sorted.length - 1].pattern} (${gap}pt gap).`,
      });
    }
  }
  byAxis[axis] = entries;
}

process.stdout.write(JSON.stringify({
  generatedAt: new Date().toISOString(),
  gamesParsed: classified,
  totalGamesFound: allGames.length,
  byAxis,
  topInsights: allInsights,
}, null, 2) + "\n");
process.stderr.write(`✓ classified ${classified} games across ${AXES.length} axes\n`);
