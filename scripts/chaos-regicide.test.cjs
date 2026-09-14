const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpile(require('fs').readFileSync(file, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), file);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Chess } = require('chess.js');
const { ALL_MODIFIERS } = require('../lib/chaos-chess.ts');
const { getChaosMoves, executeChaosMove, applyPostMoveEffects } = require('../lib/chaos-moves.ts');
const { createChaosState } = require('../lib/chaos-chess.ts');
const { reduceCommand, metadata, cleanState } = require('../lib/chaos-room-sync.ts');
for (const color of ['w', 'b']) for (const power of ['emperor', 'king-ascension', 'fools-king', 'standard']) {
  test(`${color}: Regicide stacks with ${power}`, () => {
    const game = new Chess(`7k/8/8/8/8/8/8/K7 ${color} - - 0 10`);
    const from = color === 'w' ? 'a1' : 'h8';
    const to = color === 'w' ? (power === 'standard' ? 'a2' : power === 'fools-king' ? 'b3' : 'a3') : (power === 'standard' ? 'h7' : power === 'fools-king' ? 'g6' : 'h6');
    game.put({ type: 'p', color: color === 'w' ? 'b' : 'w' }, to);
    const mods = ALL_MODIFIERS.filter(m => m.id === 'king-wrath' || m.id === power);
    const anomaly = ['emperor', 'fools-king'].includes(power) ? power : null;
    const move = power === 'standard' ? {from,to} : getChaosMoves(game, mods, color, {}, [], { playerAnomaly: anomaly }).find(m => m.from === from && m.to === to);
    assert.ok(move);
    let after;
    if (power === 'standard') {
      const normal = new Chess(game.fen()); normal.move(move);
      after = applyPostMoveEffects(normal, from, to, true, 'k', color, mods, [], 'p');
    } else after = executeChaosMove(game, move, mods);
    assert.ok(after);
    assert.equal(after.board().flat().filter(p => p?.color === color && p.type === 'q').length, 1, 'King capture must revive one queen');
    let room = { id: 'regicide', hostId: 'host', guestId: 'guest', hostColor: 'white', fen: new Chess().fen(), chaosState: createChaosState(), status: 'playing', moveHistory: [] };
    let sequence = 0;
    const apply = (actor, message) => {
      room = { ...room, ...reduceCommand(room, actor, { id: `regicide-command-${++sequence}`, baseRevision: metadata(room).stateRevision, message }) };
    };
    apply('host', { type: 'anomaly_pick', anomalyId: color === 'w' ? anomaly : null });
    apply('guest', { type: 'anomaly_pick', anomalyId: color === 'b' ? anomaly : null });
    room.fen = game.fen();
    room.chaosState[color === 'w' ? 'playerModifiers' : 'aiModifiers'] = mods;
    const revived = after.board().flat().find(p => p?.color === color && p.type === 'q');
    // Force the server's default random choice to differ from the client's.
    const random = Math.random;
    Math.random = () => revived.square[0] === 'a' ? 0.999 : 0;
    try {
      const message = { type: 'chaos_move', newFen: after.fen(), lastMoveFrom: from, lastMoveTo: to, chaosState: cleanState(room.chaosState) };
      const forged = new Chess(after.fen());
      forged.put({ type: 'r', color }, revived.square);
      assert.throws(() => apply(color === 'w' ? 'host' : 'guest', { ...message, newFen: forged.fen() }), /Board changes/);
      apply(color === 'w' ? 'host' : 'guest', message);
      assert.equal(room.fen, after.fen());
    } finally { Math.random = random; }
  });
}
test('Regicide does not revive on a quiet Dominion move or a full back rank', () => {
  const mods = ALL_MODIFIERS.filter(m => m.id === 'king-wrath');
  const game = new Chess('7k/8/8/8/8/8/8/K7 w - - 0 10');
  const quiet = getChaosMoves(game, mods, 'w', {}, [], { playerAnomaly: 'emperor' }).find(m => m.to === 'a3');
  assert.equal(executeChaosMove(game, quiet, mods).board().flat().filter(p => p?.type === 'q').length, 0);
  const full = new Chess('7k/8/8/8/8/p7/8/RNBBKBNR w - - 0 10');
  // Use a vertical capture from a king away from its occupied back rank.
  full.remove('e1'); full.put({type:'n',color:'w'},'e1'); full.put({type:'k',color:'w'},'a5');
  const move = getChaosMoves(full, [...mods, ALL_MODIFIERS.find(m => m.id === 'king-ascension')], 'w').find(m => m.to === 'a3');
  assert.ok(move);
  assert.equal(executeChaosMove(full, move, mods).board().flat().filter(p => p?.type === 'q').length, 0);
});
test('replay pick descriptions use the anomaly chosen by that color', () => {
  const {describeWatchAnomaly} = require('../lib/chaos-watch.ts');
  const state = {playerAnomaly:'emperor',aiAnomaly:'fools-king'};
  assert.match(describeWatchAnomaly({label:'white chose an anomaly',state}), /2 squares/);
  assert.match(describeWatchAnomaly({label:'black chose an anomaly',state}), /Knight/);
  assert.equal(describeWatchAnomaly({label:'white chose an anomaly',state:{}}),null);
  assert.equal(describeWatchAnomaly({label:'e4',state}),null);
});
