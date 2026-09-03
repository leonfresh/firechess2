// Quick deterministic fixtures for the move-why engine (node 25 native TS).
// Usage: node scripts/why-fixture.mjs
import { analyzeMoveWhy } from "../lib/move-why.ts";
import { Chess } from "chess.js";

const IVANCHUK = `1. c4 e5 2. g3 Nf6 3. Bg2 d5 4. cxd5 Nxd5 5. Nc3 Nb6 6. Nf3 Nc6 7. O-O Be7 8. d3 O-O 9. Be3 Be6 10. Na4 Nxa4 11. Qxa4 f6 12. Rfc1 Qd7 13. Qc2 Nd4 14. Bxd4 exd4 15. a4 Bd6 16. a5 Rae8 17. Nd2 f5 18. Nc4 Bf7 19. a6 b6 20. Qb3 Kh8 21. Rc2 Qe6 22. Rac1 g5 23. Nxd6 cxd6 24. Rc7 h5 25. Bf3 f4 26. Bxh5 Bxh5 27. Qc4 d5 28. Qc6 fxg3 29. hxg3 g4 30. Qxb6`;

const cases = [
  {
    name: "missed mate in one (Rh8# available)",
    fen: "k7/8/1K6/8/8/8/8/7R w - - 0 1",
    played: "Kc5",
    best: "Rh8#",
    cpLoss: 900,
    cls: "blunder",
  },
  {
    name: "hangs a rook (Rf2?? Rxf2)",
    fen: "7k/8/5r2/8/8/8/8/5R1K w - - 0 1",
    played: "Rf2",
    best: "Ra1",
    cpLoss: 500,
    cls: "blunder",
    refutation: ["Rxf2"],
  },
  {
    name: "missed knight fork K+R (Nc7+)",
    fen: "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1",
    played: "Kd2",
    best: "Nc7+",
    cpLoss: 500,
    cls: "blunder",
    bestPv: ["Nc7+", "Kd8", "Nxa8"],
  },
  {
    name: "quiet inaccuracy fallback (no tactic)",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 2 3",
    played: "a3",
    best: "Bb5",
    cpLoss: 40,
    cls: "inaccuracy",
    refutation: ["a6", "Ba4", "b5"],
  },
  {
    name: "walks into a pin (queen behind)",
    fen: "r3k2r/pp3ppp/2p1b3/1q6/4P3/2N2N2/PPP2PPP/R1BQ1RK1 w kq - 0 12",
    played: "Nd5",
    best: "Re1",
    cpLoss: 130,
    cls: "mistake",
    refutation: ["Nxd5"],
  },
  {
    name: "REAL fork (engine-confirmed): 27.Qc4 allows Qxc4! overloading both rooks",
    fromPgn: { pgn: IVANCHUK, plies: 52 }, // after 26...Bxh5, white to move
    played: "Qc4",
    best: "Qb5",
    cpLoss: 200,
    cls: "mistake",
    refutation: ["Qxc4", "Rxc4", "Bxc4"],
    expectLabel: "fork",
  },
  {
    name: "recapture guard: 10...Nxa4 is an even trade, not a hang",
    fromPgn: { pgn: IVANCHUK, plies: 19 }, // after 10.Na4, black to move
    played: "Nxa4",
    best: "Nd7",
    cpLoss: 40,
    cls: "inaccuracy",
    refutation: ["Qxa4", "a6"],
    expectNotLabel: "hang",
  },
];

const sanToUci = (fen, san) => {
  const chess = new Chess(fen);
  const m = chess.move(san);
  return m ? { uci: `${m.from}${m.to}${m.promotion ?? ""}`, san: m.san } : null;
};

const fenAt = (pgn, plies) => {
  const chess = new Chess();
  const tokens = pgn.replace(/\d+\./g, " ").split(/\s+/).filter(Boolean);
  for (const t of tokens.slice(0, plies)) {
    if (!chess.move(t)) return null;
  }
  return chess.fen();
};

let failures = 0;
for (const c of cases) {
  const fen = c.fen ?? fenAt(c.fromPgn.pgn, c.fromPgn.plies);
  if (!fen) {
    console.log(`✗ ${c.name}: fen resolution failed`);
    failures++;
    continue;
  }
  const played = sanToUci(fen, c.played);
  const best = sanToUci(fen, c.best);
  if (!played || !best) {
    console.log(`✗ ${c.name}: move parse failed`);
    failures++;
    continue;
  }
  const chess = new Chess(fen);
  chess.move(played.san);
  const why = analyzeMoveWhy({
    fenBefore: fen,
    playedUci: played.uci,
    playedSan: played.san,
    fenAfterPlayed: chess.fen(),
    bestUci: best.uci,
    bestSan: best.san,
    bestPvSans: c.bestPv ?? [best.san],
    refutationSans: c.refutation ?? [],
    cpLoss: c.cpLoss,
    classification: c.cls,
  });
  console.log(`\n=== ${c.name} ===`);
  console.log(
    why
      ? `[${why.label}] ${why.reason}${why.detail ? "\n  → " + why.detail : ""}`
      : "(no explanation produced)",
  );
  if (c.expectNotLabel && why && why.label.toLowerCase().includes(c.expectNotLabel.toLowerCase())) {
    console.log(`✗ UNEXPECTED LABEL: ${why.label} (should not contain ${c.expectNotLabel})`);
    failures++;
  } else if (c.expectNotLabel && why) {
    console.log(`✓ no "${c.expectNotLabel}" label`);
  }
}
console.log(failures === 0 ? "\nALL FIXTURES PASSED" : `\n${failures} FIXTURE FAILURES`);
process.exit(failures === 0 ? 0 : 1);
