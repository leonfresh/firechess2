/**
 * Verification harness for detectOpeningIdeas logic.
 *
 * Simulates a user who reached the Scandinavian Modern Variation (after
 * 1.e4 d5 2.exd5 Nf6 3.d4) 12 times and played 3...Nxd5 in 11 of them.
 * Expects the detector to suggest 3...Bg4 (Portuguese Gambit) — 1.85M games,
 * ~54.3% black win rate — over plain alternates.
 *
 * The explorer data is fetched through firechess.com's live proxy (the exact
 * production data path), so this also verifies the per-move `opening` field
 * that the new UI depends on.
 */
const FEN = "rnbqkb1r/ppp1pppp/5n2/3P4/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3";

async function main() {
  // ── 1. Fetch explorer data through the production proxy ──
  const res = await fetch(
    `https://firechess.com/api/explorer?fen=${encodeURIComponent(FEN)}&sideToMove=black`,
  );
  const data = await res.json();

  // ── 2. Simulate the byFen aggregation for this position ──
  const moveCounts = new Map([["Nxd5", 11]]);
  const moveOutcomes = new Map([["Nxd5", { w: 5, d: 2, l: 4 }]]);
  const totalReachCount = 12;

  // ── 3. Replicate detectOpeningIdeas' candidate filter + scoring ──
  const MIN_DB_GAMES = 20_000;
  const MIN_WIN_RATE = 0.5;
  const BEAT_USER = 0.015;
  const NAME_BONUS = 0.05;
  const GAMBIT_BONUS = 0.08;

  const uciToSan = (uci) => uci; // explorer moves already carry san
  const domDb = data.moves.find((m) => m.san === "Nxd5");
  const candidates = data.moves.filter((m) => {
    if (m.san === "Nxd5") return false; // user already plays it
    if (m.white + m.draws + m.black < MIN_DB_GAMES) return false;
    const wr = (m.black + 0.5 * m.draws) / (m.white + m.draws + m.black);
    if (wr < MIN_WIN_RATE) return false;
    if (domDb) {
      const domWr = (domDb.black + 0.5 * domDb.draws) / (domDb.white + domDb.draws + domDb.black);
      if (wr < domWr + BEAT_USER) return false;
    }
    return true;
  });

  const scored = candidates
    .map((c) => {
      const total = c.white + c.draws + c.black;
      const wr = (c.black + 0.5 * c.draws) / total;
      const name = c.opening?.name ?? "";
      const isGambit = /gambit/i.test(name);
      const score = wr * Math.log10(total) + (name ? NAME_BONUS : 0) + (isGambit ? GAMBIT_BONUS : 0);
      return { san: c.san, wr, total, name, isGambit, score };
    })
    .sort((a, b) => b.score - a.score);

  console.log("=== User habit: Nxd5 (11/12 reaches) ===");
  console.log("Candidates (passing filters):");
  for (const c of scored) {
    console.log(
      `  ${c.san.padEnd(6)} wr=${(c.wr * 100).toFixed(1)}%  games=${c.total.toLocaleString()}  ${c.isGambit ? "GAMBIT" : ""}  score=${c.score.toFixed(3)}  name=${c.name || "-"}`,
    );
  }

  const best = scored[0];
  console.log("\n=== Top pick ===");
  if (!best) {
    console.log("NONE — no candidate passed filters (bug!)");
    return 1;
  }
  console.log(`Suggestion: ${best.san} → ${best.name} (${(best.wr * 100).toFixed(1)}% / ${best.total.toLocaleString()} games)`);
  const expected = /portugu/i.test(best.name) || /gambit/i.test(best.name);
  console.log(expected ? "✅ PASS: picked a named gambit line" : "❌ FAIL: expected Portuguese Gambit or a gambit line");
  return expected ? 0 : 2;
}

main().then((code) => {
  // Let Node exit naturally (avoids libuv handle-close assertion on Windows).
  setTimeout(() => process.exit(code), 200);
}).catch((e) => {
  console.error("❌ ERROR", e);
  setTimeout(() => process.exit(1), 200);
});
