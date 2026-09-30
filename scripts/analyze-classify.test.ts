// Run: node --experimental-strip-types --test scripts/analyze-classify.test.ts
// Exercises the real classifier wiring the PGN analyzer uses (app/analyze):
// White/Black perspective, the next ply's eval for non-final moves, the
// final-position eval, and missing evals. Imports lib/move-quality.ts directly
// so chess.js resolves from the repo's node_modules (the old Module._compile
// one-liner could not).
import test from "node:test";
import assert from "node:assert/strict";
import { classifyPlies } from "../lib/move-quality.ts";

const ply = (
  color: "w" | "b",
  evalCp: number | null,
  uci = "e2e4",
  bestMove: string | null = null,
) => ({ uci, color, evalCp, bestMove });

test("a sound White move in a winning position is good, not a blunder", () => {
  const result = classifyPlies(
    [ply("w", 500, "d1h5", "d1h5"), ply("b", 490)],
    null,
  );
  assert.equal(result[0], "good");
  assert.equal(
    result[1],
    null,
    "a move with no following eval stays unclassified",
  );
});

test("a real White blunder in a balanced position is a blunder", () => {
  const result = classifyPlies(
    [ply("w", 20, "e2e4", "d2d4"), ply("b", -330)],
    null,
  );
  assert.equal(result[0], "blunder");
});

test("Black moves are scored from Black's point of view", () => {
  // Black is +3 before the move. Keeping -310 keeps Black winning; throwing the
  // game back to level loses three pawns.
  assert.equal(
    classifyPlies([ply("b", -300, "e7e5", "e7e5")], -310)[0],
    "best",
  );
  assert.equal(
    classifyPlies([ply("b", -300, "e7e5", "e7e5")], 0)[0],
    "blunder",
  );
});

test("non-final moves use the next ply's eval, not the final eval", () => {
  const result = classifyPlies(
    [ply("w", 20, "e2e4", "e2e4"), ply("b", 0)],
    9999,
  );
  // 20 -> 0 (next ply), not 20 -> 9999: the fallback would have made it "best".
  assert.equal(result[0], "good");
});

test("the final position scores the last move", () => {
  assert.equal(
    classifyPlies([ply("w", 20, "e2e4", "e2e4")], -400)[0],
    "blunder",
  );
});

test("missing evals produce null classifications", () => {
  assert.equal(classifyPlies([ply("w", null), ply("b", 0)], 0)[0], null);
  assert.deepEqual(
    classifyPlies([ply("w", 50), ply("b", null)], 0),
    [null, null],
  );
});

console.log("analyzer classification wiring regressions passed");
