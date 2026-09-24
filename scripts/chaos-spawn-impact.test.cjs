const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(require('fs').readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnImpacts } = require('../lib/chaos-impact.ts');
/** Revive / summon effects: pieces that appear outside the move itself, and nothing else. */
const none = { w: [], b: [] };
const plain = (r) => JSON.parse(JSON.stringify(r));

test('Pawn Fortress: a captured pawn back on its start square is REVIVED', () => {
  // Black knight takes the pawn on e4; the White pawn returns to e2.
  const r = spawnImpacts('4k3/8/8/8/4P3/5n2/8/4K3 b - - 0 1', '4k3/8/8/8/4n3/8/4P3/4K3 w - - 0 2', { from: 'f3', to: 'e4' }, { w: ['pawn-fortress'], b: [] });
  assert.deepEqual(plain(r), [{ square: 'e2', piece: 'wP', kind: 'revive' }]);
});

test('Regicide: the piece revived on the back rank after a king capture is REVIVED', () => {
  const r = spawnImpacts('4k3/8/8/8/8/8/3pK3/8 w - - 0 1', '4k3/8/8/8/8/8/3K4/3Q4 b - - 0 1', { from: 'e2', to: 'd2' }, { w: ['king-wrath'], b: [] });
  assert.deepEqual(plain(r), [{ square: 'd1', piece: 'wQ', kind: 'revive' }]);
});

test('draft spawns: Knight Horde and Phalanx SUMMON, Undead Army REVIVES', () => {
  const start = '4k3/8/8/8/8/8/8/4K3 w - - 0 5';
  const horde = spawnImpacts(start, '4k3/8/8/8/8/2N2N2/8/4K3 w - - 0 5', null, { w: ['knight-horde'], b: [] }, { w: ['knight-horde'], b: [] });
  assert.deepEqual(plain(horde).map(s => s.kind + s.piece), ['summonwN', 'summonwN']);
  const undead = spawnImpacts(start, '4k3/8/8/8/8/8/PP6/4K3 w - - 0 5', null, { w: ['undead-army'], b: [] }, { w: ['undead-army'], b: [] });
  assert.deepEqual(plain(undead).map(s => s.kind), ['revive', 'revive']);
});

test("The Wake: a pawn appearing on the square the capturer left is SUMMONED", () => {
  const r = spawnImpacts('4k3/8/8/3n4/8/2N5/8/4K3 w - - 0 1', '4k3/8/8/3N4/8/2P5/8/4K3 b - - 0 1', { from: 'c3', to: 'd5' }, none);
  assert.deepEqual(plain(r), [{ square: 'c3', piece: 'wP', kind: 'summon' }]);
});

test('ordinary moves, castling, promotion, Usurper swaps, takeovers and sniper shots spawn nothing', () => {
  assert.deepEqual(plain(spawnImpacts('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', { from: 'e2', to: 'e4' }, none)), []);
  assert.deepEqual(plain(spawnImpacts('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1', { from: 'e1', to: 'g1' }, none)), []);
  assert.deepEqual(plain(spawnImpacts('4k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'Q3k3/8/8/8/8/8/8/4K3 b - - 0 1', { from: 'a7', to: 'a8' }, none)), []);
  assert.deepEqual(plain(spawnImpacts('4k2r/8/3b4/8/8/8/8/7K b - - 0 1', '4b2r/8/3k4/8/8/8/8/7K w - - 0 2', { from: 'e8', to: 'd6' }, { w: [], b: ['usurper'] })), []);
  assert.deepEqual(plain(spawnImpacts('4k3/8/8/8/8/5n2/4P3/4K3 b - - 0 1', '4k3/8/8/8/8/8/4N3/4K3 w - - 0 2', { from: 'f3', to: 'e2' }, none)), [], 'Hostile Takeover flips the piece on the landing square');
  assert.deepEqual(plain(spawnImpacts('4k3/8/8/1B6/8/8/6p1/4K3 w - - 0 1', '4k3/8/8/1B6/8/8/8/4K3 b - - 0 1', { from: 'b5', to: 'g2' }, none)), []);
});

test('a stale or mismatched move reports nothing rather than a false spawn', () => {
  // Board shows Black's knight move, but the move handed in is an older White move.
  assert.deepEqual(plain(spawnImpacts('4k3/8/8/8/8/5n2/8/4K2R b - - 0 1', '4k3/8/8/8/8/8/4n3/4K2R w - - 0 2', { from: 'e2', to: 'e4' }, none)), []);
});
