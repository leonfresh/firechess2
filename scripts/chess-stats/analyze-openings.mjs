#!/usr/bin/env node
/**
 * analyze-openings.mjs — streaming analyzer for the Lichess open database.
 *
 * Computes opening popularity + win rates broken down by rating band, from a
 * standard Lichess PGN dump (https://database.lichess.org/). Streams stdin line
 * by line so it handles multi-GB files in constant memory.
 *
 * USAGE
 *   # plain pgn
 *   node scripts/chess-stats/analyze-openings.mjs < games.pgn > openings-by-rating.json
 *
 *   # straight from a Lichess .zst dump (needs zstd installed)
 *   zstdcat lichess_db_standard_rated_2026-05.pgn.zst \
 *     | node scripts/chess-stats/analyze-openings.mjs > openings-by-rating.json
 *
 *   # sample only the first N games (fast smoke test)
 *   node scripts/chess-stats/analyze-openings.mjs --limit 200000 < games.pgn
 *
 * OUTPUT: JSON { generatedAt, gamesParsed, bands, openingsByBand, topOpeningsOverall }
 * ready to feed straight into a blog-post heatmap. The numbers are REAL — this is
 * what keeps "we analyzed N games" honest.
 */

import readline from "node:readline";

const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i !== -1 ? Number(process.argv[i + 1]) : Infinity;
})();

// Rating bands keyed by the average of WhiteElo + BlackElo.
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

function bandFor(avg) {
  for (const b of BANDS) if (avg >= b.min && avg <= b.max) return b.id;
  return null;
}

/** band -> opening -> { games, white, draw, black } */
const tally = new Map();
const bandTotals = new Map();
const overall = new Map();

function record(band, opening, result) {
  if (!tally.has(band)) tally.set(band, new Map());
  const m = tally.get(band);
  if (!m.has(opening)) m.set(opening, { games: 0, white: 0, draw: 0, black: 0 });
  const o = m.get(opening);
  o.games++;
  if (result === "1-0") o.white++;
  else if (result === "0-1") o.black++;
  else if (result === "1/2-1/2") o.draw++;
  bandTotals.set(band, (bandTotals.get(band) ?? 0) + 1);
  overall.set(opening, (overall.get(opening) ?? 0) + 1);
}

const TAG_RE = /^\[(\w+)\s+"(.*)"\]\s*$/;
let cur = {};
let haveHeaders = false;
let gamesParsed = 0;

function flush() {
  if (!haveHeaders) return;
  const we = Number(cur.WhiteElo);
  const be = Number(cur.BlackElo);
  const opening = cur.Opening || cur.ECO || "Unknown";
  const result = cur.Result;
  if (Number.isFinite(we) && Number.isFinite(be) && we > 0 && be > 0 && result) {
    const band = bandFor(Math.round((we + be) / 2));
    if (band) {
      record(band, opening, result);
      gamesParsed++;
    }
  }
  cur = {};
  haveHeaders = false;
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

let stop = false;
for await (const line of rl) {
  if (stop) break;
  if (line.startsWith("[Event ")) flush(); // new game starts
  const m = TAG_RE.exec(line);
  if (m) {
    cur[m[1]] = m[2];
    haveHeaders = true;
  }
  if (gamesParsed >= LIMIT) stop = true;
}
flush();

// Build sorted output.
function topOpenings(map, n = 15) {
  return [...map.entries()]
    .map(([opening, s]) => ({
      opening,
      games: s.games,
      whiteWinPct: +((s.white / s.games) * 100).toFixed(1),
      drawPct: +((s.draw / s.games) * 100).toFixed(1),
      blackWinPct: +((s.black / s.games) * 100).toFixed(1),
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, n);
}

const openingsByBand = {};
for (const band of BANDS.map((b) => b.id)) {
  if (tally.has(band)) openingsByBand[band] = topOpenings(tally.get(band));
}

const out = {
  generatedAt: new Date().toISOString(),
  gamesParsed,
  bands: Object.fromEntries(bandTotals),
  topOpeningsOverall: [...overall.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([opening, games]) => ({ opening, games })),
  openingsByBand,
};

process.stdout.write(JSON.stringify(out, null, 2) + "\n");
process.stderr.write(`\n✓ parsed ${gamesParsed} games into ${Object.keys(openingsByBand).length} rating bands\n`);
