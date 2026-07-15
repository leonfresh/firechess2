#!/usr/bin/env node
/**
 * Generate synthetic test PGN with known structural features.
 * Uses hand-written PGN strings (no chess.js replay) to isolate parser testing.
 */

function makePgn(event, white, black, result, eco, opening, moves) {
  return [
    `[Event "${event}"]`,
    `[Site "https://lichess.org/test"]`,
    `[White "${white}"]`,
    `[Black "${black}"]`,
    `[Result "${result}"]`,
    `[WhiteElo "1500"]`,
    `[BlackElo "1500"]`,
    `[ECO "${eco}"]`,
    `[Opening "${opening}"]`,
    `[TimeControl "600+0"]`,
    ``,
    moves + " " + result,
    ``
  ].join("\n");
}

// Game 1: Fianchetto (g3, Bg2) — Modern Defense setup
process.stdout.write(makePgn(
  "Testing Fianchetto", "player01", "opponent01", "1-0", "B06", "Modern Defense",
  `1. d4 g6 2. c4 Bg7 3. Nc3 d6 4. e4 Nf6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Be3 Nd7 10. Qd2 a5 11. Rac1 Nc5 12. b3 Bd7 13. g3 c6`
));

// Game 2: Double Fianchetto (g3/Bg2 + b3/Bb2) — English
process.stdout.write(makePgn(
  "Testing Double Fianchetto", "player02", "opponent02", "0-1", "A15", "English Opening",
  `1. g3 d5 2. Bg2 Nf6 3. Nf3 c5 4. O-O Nc6 5. b3 e6 6. Bb2 Be7 7. d4 cxd4 8. Nxd4 O-O 9. Nxc6 bxc6 10. Nd2 Bb7 11. e4 dxe4 12. Nxe4 Nxe4 13. Bxe4 Qc7 14. Qd3 Rfd8 15. Rfe1 Rac8`
));

// Game 3: French Defense — Closed Center
process.stdout.write(makePgn(
  "Testing Closed Center", "player03", "opponent03", "1-0", "C02", "French Advance",
  `1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 Bd7 7. b4 cxd4 8. cxd4 Na5 9. Be2 Ne7 10. O-O Nc6 11. Be3 Rc8 12. Nbd2 Be7 13. Rb1 O-O 14. h3 Rfd8 15. Re1 Bb5`
));

// Game 4: Opposite Castling — Sicilian Dragon
process.stdout.write(makePgn(
  "Testing Opposite Castling", "player04", "opponent04", "1-0", "B78", "Sicilian Dragon",
  `1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4 Bd7 10. O-O-O Rc8 11. Bb3 Ne5 12. Kb1 a6 13. h4 h5 14. Bh6 Bxh6 15. Qxh6 Rxc3 16. bxc3 Qa5 17. Rd4 Rfc8 18. Rhd1`
));

// Game 5: IQP — Alapin Sicilian
process.stdout.write(makePgn(
  "Testing IQP", "player05", "opponent05", "1/2-1/2", "B22", "Alapin Sicilian",
  `1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nf6 5. Nf3 e6 6. Be3 cxd4 7. cxd4 Be7 8. Nc3 Qd6 9. Bd3 O-O 10. O-O b6 11. Qe2 Bb7 12. Rac1 Nbd7 13. Rfe1 Rac8 14. a3 Rfe8 15. Bf4 Qd8 16. Qe3 Nf8`
));

// Game 6: Open Center — Italian Game
process.stdout.write(makePgn(
  "Testing Open Center", "player06", "opponent06", "1-0", "C54", "Italian Game",
  `1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Be7 6. e5 Nd5 7. Nxd4 O-O 8. Nxc6 bxc6 9. Bd3 d5 10. exd6 cxd6 11. c3 Bf6 12. Bf4 Re8 13. Nd2 Bb7 14. Qf3 g6 15. Rae1 Qd7 16. Qh3 Rad8`
));

process.stderr.write(`Generated 6 test games\n`);
