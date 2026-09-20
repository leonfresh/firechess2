/**
 * Card balance fixes (Sep 2026), from the archive audit in docs/chaos-cards-audit-and-shop.md:
 *   sniper-bishop  range 2 -> 3      (measured worst card, z -2.3)
 *   kings-chains   freeze 1 -> 2     (z -2.0, unusable without walking the king into danger)
 *   kamikaze-bishop legendary -> epic (z -2.0 at legendary price)
 *   railgun        1 -> 2 charges    (z -2.5, one shot whiffs too often to be a legendary)
 */
const test = require('node:test');
const assert = require('node:assert');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(require('fs').readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { Chess } = require('chess.js');
const { ALL_MODIFIERS, RAILGUN_MAX_SHOTS, createChaosState } = require('../lib/chaos-chess.ts');
const { getChaosMoves, computeChainedSquare } = require('../lib/chaos-moves.ts');

const mod = (id) => {
  const m = ALL_MODIFIERS.find((x) => x.id === id);
  assert.ok(m, `${id} missing from ALL_MODIFIERS`);
  return m;
};
const sniperShots = (fen) =>
  getChaosMoves(new Chess(fen), [mod('sniper-bishop')], 'w').filter(
    (m) => m.modifierId === 'sniper-bishop',
  );

test('sniper bishop reaches 3 squares', () => {
  // White bishop d4, black rook g7: exactly 3 squares along the a1-h8 diagonal.
  const shots = sniperShots('7k/6r1/8/8/3B4/8/8/4K3 w - - 0 10');
  assert.deepEqual(shots.map((m) => m.to), ['g7']);
  assert.equal(shots[0].pieceStays, true, 'ranged capture must not move the bishop');
});

test('sniper bishop still cannot reach 4 squares', () => {
  // Black rook h8 is 4 diagonals from d4; black king parks on a8 out of the way.
  assert.equal(sniperShots('k6r/8/8/8/3B4/8/8/4K3 w - - 0 10').length, 0);
});

test('sniper bishop cannot shoot through a blocker', () => {
  // White pawn e5 sits between the bishop on d4 and the rook on g7.
  assert.equal(sniperShots('7k/6r1/8/4P3/3B4/8/8/4K3 w - - 0 10').length, 0);
});

test("king's chains freezes within 2 squares", () => {
  // Black rook c3 is two files and two ranks from the white king on e1.
  assert.equal(computeChainedSquare(new Chess('4k3/8/8/8/8/2r5/8/4K3 w - - 0 1'), 'w'), 'c3');
});

test("king's chains ignores pieces 3 squares away", () => {
  assert.equal(computeChainedSquare(new Chess('4k3/8/8/8/3r4/8/8/4K3 w - - 0 1'), 'w'), null);
});

test("king's chains still freezes the most valuable piece in range", () => {
  // Rook c3 (500) outranks the adjacent pawn d2 (100).
  assert.equal(
    computeChainedSquare(new Chess('4k3/8/8/8/8/2r5/3p4/4K3 w - - 0 1'), 'w'),
    'c3',
  );
});

test("king's chains never freezes a king", () => {
  // Enemy king on e3 is the only piece within 2 squares of the white king.
  assert.equal(computeChainedSquare(new Chess('8/8/8/8/8/4k3/8/4K3 w - - 0 1'), 'w'), null);
});

test('kamikaze bishop is priced epic', () => {
  assert.equal(mod('kamikaze-bishop').tier, 'epic');
});

test('railgun carries two charges', () => {
  assert.equal(RAILGUN_MAX_SHOTS, 2);
  const state = createChaosState();
  assert.equal(state.playerRailgunShots, 0);
  assert.equal(state.aiRailgunShots, 0);
});

test('card text matches the shipped rules', () => {
  assert.match(mod('sniper-bishop').description, /up to 3 squares/);
  assert.match(mod('kings-chains').description, /within 2 squares/);
  assert.match(mod('railgun').description, /Twice per game/);
});
