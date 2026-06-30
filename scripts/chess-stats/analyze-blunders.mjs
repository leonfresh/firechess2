#!/usr/bin/env node
/**
 * analyze-blunders.mjs — blunder rate by player rating, from Lichess eval data.
 *
 * Lichess includes inline `{ [%eval X] }` annotations on games that were computer
 * analyzed. We walk those evals move by move and count "blunders" — a move that
 * worsens the mover's evaluation by >= 2.00 pawns (200 cp). Each player's blunders
 * are attributed to THAT player's own rating (not the game average), so the result
 * is a clean "how often does a 1200 hang something vs a 2200" curve.
 *
 * USAGE (stream a slice; only analyzed games count toward the sample):
 *   zstdcat lichess_db_standard_rated_2026-05.pgn.zst \
 *     | node scripts/chess-stats/analyze-blunders.mjs --limit 120000 \
 *     > scripts/chess-stats/out/blunders-by-rating.json
 *
 *   # verify on the bundled sample (note: sample has no evals -> 0 games)
 *   node scripts/chess-stats/analyze-blunders.mjs < scripts/chess-stats/sample.pgn
 *
 * --limit N  : stop after N *analyzed* (eval-bearing) games.
 */

import readline from "node:readline";

const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i !== -1 ? Number(process.argv[i + 1]) : Infinity;
})();

const BLUNDER_CP = 200; // 2.00 pawns
const CAP_CP = 1000; // clamp mate / huge evals to +-10.00 so they don't dominate

const BANDS = [
  { id: "<1000", min: 0, max: 999 },
  { id: "1000-1199", min: 1000, max: 1199 },
  { id: "1200-1399", min: 1200, max: 1399 },
  { id: "1400-1599", min: 1400, max: 1599 },
  { id: "1600-1799", min: 1600, max: 1799 },
  { id: "1800-1999", min: 1800, max: 1999 },
  { id: "2000-2199", min: 2000, max: 2199 },
  { id: "2200+", min: 2200, max: Infinity },
];
function bandFor(elo) {
  for (const b of BANDS) if (elo >= b.min && elo <= b.max) return b.id;
  return null;
}

// band -> { moves, blunders, games }
const stat = new Map();
for (const b of BANDS) stat.set(b.id, { moves: 0, blunders: 0, games: 0 });

const EVAL_RE = /\[%eval\s+(#?-?\d+(?:\.\d+)?)\]/g;
function toCp(token) {
  if (token.startsWith("#") || token.startsWith("-#")) {
    const neg = token.includes("-");
    return neg ? -CAP_CP : CAP_CP;
  }
  if (token.startsWith("#-")) return -CAP_CP;
  const v = Math.round(parseFloat(token) * 100);
  return Math.max(-CAP_CP, Math.min(CAP_CP, v));
}

let cur = {};
let movetext = "";
let haveHeaders = false;
let evalGames = 0;

function flush() {
  if (haveHeaders && movetext.includes("%eval")) {
    const we = Number(cur.WhiteElo);
    const be = Number(cur.BlackElo);
    if (Number.isFinite(we) && Number.isFinite(be) && we > 0 && be > 0) {
      const wBand = bandFor(we);
      const bBand = bandFor(be);
      // collect evals in ply order
      const evals = [];
      let m;
      EVAL_RE.lastIndex = 0;
      while ((m = EVAL_RE.exec(movetext))) evals.push(toCp(m[1]));
      if (evals.length >= 4) {
        let wMoves = 0, wBl = 0, bMoves = 0, bBl = 0;
        let prev = 0; // assume ~0.00 at start
        for (let i = 0; i < evals.length; i++) {
          const e = evals[i];
          const whiteMoved = i % 2 === 0;
          if (whiteMoved) {
            wMoves++;
            if (prev - e >= BLUNDER_CP) wBl++; // eval dropped for White
          } else {
            bMoves++;
            if (e - prev >= BLUNDER_CP) bBl++; // eval rose = worse for Black
          }
          prev = e;
        }
        if (wBand) { const s = stat.get(wBand); s.moves += wMoves; s.blunders += wBl; s.games++; }
        if (bBand) { const s = stat.get(bBand); s.moves += bMoves; s.blunders += bBl; s.games++; }
        evalGames++;
      }
    }
  }
  cur = {};
  movetext = "";
  haveHeaders = false;
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
const TAG_RE = /^\[(\w+)\s+"(.*)"\]\s*$/;
let stop = false;
for await (const line of rl) {
  if (stop) break;
  if (line.startsWith("[Event ")) flush();
  const m = TAG_RE.exec(line);
  if (m) { cur[m[1]] = m[2]; haveHeaders = true; }
  else if (line && !line.startsWith("[")) movetext += " " + line;
  if (evalGames >= LIMIT) stop = true;
}
flush();

const out = {
  generatedAt: new Date().toISOString(),
  analyzedGames: evalGames,
  blunderThresholdCp: BLUNDER_CP,
  byBand: BANDS.map((b) => {
    const s = stat.get(b.id);
    return {
      band: b.id,
      games: s.games,
      moves: s.moves,
      blunders: s.blunders,
      blundersPer100Moves: s.moves ? +((s.blunders / s.moves) * 100).toFixed(2) : null,
      blundersPerGame: s.games ? +(s.blunders / s.games).toFixed(2) : null,
    };
  }),
};
process.stdout.write(JSON.stringify(out, null, 2) + "\n");
process.stderr.write(`\n✓ analyzed ${evalGames} eval games\n`);
