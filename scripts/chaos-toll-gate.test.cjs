/* Run: node --test scripts/chaos-toll-gate.test.cjs
 * Toll Gate replaced Forced En Passant (Sep 2026): the opponent's pawns may never advance two
 * squares. The rule lives in blockedMove (server + king-capture + client) and in getChaosMoves
 * (so a Torpedo Pawn's charge is filtered for the board, the AI and outcome checks alike).
 */
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpile(require('fs').readFileSync(file, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), file);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Chess } = require('chess.js');
const { ALL_MODIFIERS, createChaosState } = require('../lib/chaos-chess.ts');
const { getChaosMoves } = require('../lib/chaos-moves.ts');
const { blockedMove } = require('../lib/chaos-outcome.ts');
const { reduceCommand, metadata, cleanState } = require('../lib/chaos-room-sync.ts');

const power = id => ALL_MODIFIERS.find(m => m.id === id);
const board = (side, pieces = []) => {
  const g = new Chess(`7k/8/8/8/8/8/8/K7 ${side} - - 0 10`);
  for (const [square, type, color = side] of pieces) g.put({ type, color }, square);
  return g;
};
const stateWith = (side, mods) => ({ ...createChaosState(), [side === 'w' ? 'playerModifiers' : 'aiModifiers']: mods });

test('Toll Gate replaced Forced En Passant in the draft pool', () => {
  const card = power('toll-gate');
  assert.ok(card, 'Toll Gate must exist in ALL_MODIFIERS');
  assert.equal(card.tier, 'rare');
  assert.equal(card.piece, 'p');
  assert.deepEqual(card.phases, [2, 3], 'it keeps the retired card\'s draft slots');
  assert.match(card.description, /never advance two squares/);
  assert.equal(ALL_MODIFIERS.some(m => m.id === 'forced-en-passant'), false, 'the retired card must be gone from the pool');
});

for (const side of ['w', 'b']) {
  const enemy = side === 'w' ? 'b' : 'w';
  const start = side === 'w' ? 'e2' : 'e7';
  const single = side === 'w' ? 'e3' : 'e6';
  const double = side === 'w' ? 'e4' : 'e5';
  const advanced = side === 'w' ? 'd4' : 'd5';
  const charged = side === 'w' ? 'd6' : 'd3';

  test(`${side}: Toll Gate blocks the two-square advance and nothing else`, () => {
    const g = board(side, [[start, 'p']]);
    const guarded = stateWith(enemy, [power('toll-gate')]);
    assert.match(blockedMove(g, guarded, side, start, double), /Toll Gate/, 'the opening double step is refused');
    assert.equal(blockedMove(g, guarded, side, start, single), null, 'the single step stays legal');
    assert.equal(blockedMove(g, stateWith(side, [power('toll-gate')]), side, start, double), null, 'our own card never binds our own pawns');
    const charge = board(side, [[advanced, 'p']]);
    assert.match(blockedMove(charge, guarded, side, advanced, charged), /Toll Gate/, 'an advanced pawn cannot leap two squares either');
  });

  test(`${side}: Torpedo Pawns cannot charge through a Toll Gate`, () => {
    const from = side === 'w' ? 'd4' : 'd5';
    const to = side === 'w' ? 'd6' : 'd3';
    const g = board(side, [[from, 'p']]);
    const charge = [power('pawn-charge')];
    assert.ok(getChaosMoves(g, charge, side).some(m => m.modifierId === 'pawn-charge' && m.to === to), 'the charge is offered without a gate');
    assert.equal(getChaosMoves(g, charge, side, undefined, [power('toll-gate')]).some(m => m.modifierId === 'pawn-charge'), false, 'the gate filters the charge for every consumer');
    // The gate must not silence the rest of the pawn kit.
    const ahead = side === 'w' ? 'd5' : 'd4';
    const bayonet = board(side, [[advanced, 'p'], [ahead, 'r', enemy]]);
    assert.ok(getChaosMoves(bayonet, [power('pawn-capture-forward')], side, undefined, [power('toll-gate')]).some(m => m.modifierId === 'pawn-capture-forward'), 'other pawn powers still generate');
  });
}

test('the server refuses a double push when the opponent holds Toll Gate', () => {
  let room = { id: 'room', hostId: 'host', guestId: 'guest', hostColor: 'white', fen: new Chess().fen(), chaosState: createChaosState(), status: 'playing', moveHistory: [] };
  let sequence = 0;
  const command = (r, message) => ({ id: `toll-${String(++sequence).padStart(12, '0')}`, baseRevision: metadata(r).stateRevision, message });
  const apply = (r, actor, message) => ({ ...r, ...reduceCommand(r, actor, command(r, message)) });
  const move = (r, from, to) => { const g = new Chess(r.fen); g.move({ from, to }); return { type: 'move', fen: g.fen(), lastMoveFrom: from, lastMoveTo: to, chaosState: cleanState(r.chaosState), status: 'playing' }; };
  room = apply(room, 'host', { type: 'anomaly_pick', anomalyId: null });
  room = apply(room, 'guest', { type: 'anomaly_pick', anomalyId: null });
  room = { ...room, chaosState: { ...room.chaosState, aiModifiers: [power('toll-gate')] } };
  assert.throws(() => apply(room, 'host', move(room, 'e2', 'e4')), /Toll Gate/, 'the host cannot push two squares past the guest\'s gate');
  const after = apply(room, 'host', move(room, 'e2', 'e3'));
  assert.equal(new Chess(after.fen).get('e3').type, 'p', 'the single step still saves');
});
