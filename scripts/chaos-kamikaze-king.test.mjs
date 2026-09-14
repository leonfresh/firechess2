/**
 * Kamikaze King rule tests.
 *
 * Run: npx tsx scripts/chaos-kamikaze-king.test.mjs
 *
 * A king that captures a Kamikaze Bishop is destroyed — but chess.js rejects
 * kingless FENs, so the rule can't be expressed as "remove the king". It must
 * surface as (a) no attacker removal in the lib (the page ends the game),
 * (b) a financial-loss-sized penalty in the AI's threat model, and
 * (c) a working mutual kill for every other attacker type.
 */
import { Chess } from "chess.js";
import {
  applyPostMoveEffects,
  executeChaosMove,
  computeChaosThreatPenalty,
  isKamikazeKingSuicide,
} from "../lib/chaos-moves.ts";
import { ALL_MODIFIERS } from "../lib/chaos-chess.ts";

let failures = 0;
function check(name, condition, extra = "") {
  const ok = !!condition;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
}

const kamikaze = ALL_MODIFIERS.find((m) => m.id === "kamikaze-bishop");
if (!kamikaze) throw new Error("kamikaze-bishop modifier missing");

/* ── 1. Truth table ─────────────────────────────────────────────────────── */

check("king takes kamikaze bishop = suicide", isKamikazeKingSuicide("k", "b", [kamikaze]));
check("king takes plain bishop = safe", !isKamikazeKingSuicide("k", "b", []));
check("rook takes kamikaze bishop = trade", !isKamikazeKingSuicide("r", "b", [kamikaze]));
check("king takes kamikaze knight = safe", !isKamikazeKingSuicide("k", "n", [kamikaze]));
check("no capture = safe", !isKamikazeKingSuicide("k", undefined, [kamikaze]));

/* ── 2. applyPostMoveEffects: king is never removed ─────────────────────── */

// White king e1, black bishop d2 (undefended), black king e8 — Kxd2 is legal.
const kingCaptureFen = "4k3/8/8/8/8/8/3b4/4K3 w - - 0 1";
const kingGame = new Chess(kingCaptureFen);
const kingResult = applyPostMoveEffects(
  kingGame, "e1", "d2", true, "k", "w", [], [kamikaze], "b",
);
check(
  "king capture returns null (no kingless board, no silent no-op claim)",
  kingResult === null,
  `got ${kingResult ? kingResult.fen() : "null"}`,
);

// Same capture by a rook must still mutual-kill the attacker.
const rookCaptureFen = "4k3/8/8/8/8/8/3b4/4R3 w - - 0 1"; // rook e1 -> d2? no: e1 cannot reach d2
// Use a file-adjacent capture instead: rook on a2 takes bishop on b2? Rebuild:
// black bishop d2, white rook e2 captures d2 along the file.
const rookFen = "4k3/8/8/8/8/8/3bR3/4K3 w - - 0 1";
const rookGame = new Chess(rookFen);
// Rook capture: move first, then apply effects (mirrors the page's flow)
rookGame.move({ from: "e2", to: "d2" });
const rookResult = applyPostMoveEffects(
  rookGame, "e2", "d2", true, "r", "w", [], [kamikaze], "b",
);
check(
  "rook capture still mutual-kills the attacker",
  rookResult !== null && !rookResult.get("d2"),
  rookResult ? rookResult.fen() : "null",
);
check("unused fixture sanity", !!rookCaptureFen && new Chess(kingCaptureFen).turn() === "w");

/* ── 3. executeChaosMove: a king capture survives ───────────────────────── */

const chaosGame = new Chess(kingCaptureFen);
const kingMove = {
  from: "e1",
  to: "d2",
  type: "capture",
  modifierId: "king-ascension",
  label: "King Ascension",
};
const executed = executeChaosMove(chaosGame, kingMove, [], [kamikaze]);
check(
  "chaos king capture keeps the king on the board",
  !!executed && executed.get("d2")?.type === "k",
  executed ? executed.fen() : "null",
);

/* ── 4. AI threat model: taking with the king reads as lost ─────────────── */

// Position where the AI (black) can take a kamikaze bishop with its king.
// Black king e8, white bishop d7 — Kxd7 available; white holds kamikaze-bishop.
const aiFen = "4k3/3B4/8/8/8/8/8/4K3 b - - 0 1";
const aiGame = new Chess(aiFen);
const penalty = computeChaosThreatPenalty(aiGame, [kamikaze], "w");
check("kamikaze king threat is catastrophic for the AI", penalty >= 100000, `penalty=${penalty}`);

// Same shape without the modifier: no such penalty.
const plainPenalty = computeChaosThreatPenalty(aiGame, [], "w");
check("no modifier = no kamikaze penalty", plainPenalty === 0, `penalty=${plainPenalty}`);

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
