const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpile(require('fs').readFileSync(file, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), file);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Chess } = require('chess.js');
const { ALL_MODIFIERS, createChaosState, updateTrackedPieces } = require('../lib/chaos-chess.ts');
const { applyServerDraft } = require('../lib/chaos-server-draft.ts');
const { getChaosMoves, getChaosAttackedSquares, applyDraftEffect } = require('../lib/chaos-moves.ts');
const ids = ['camel', 'knook', 'night-rider'];
const permutations = xs => xs.length ? xs.flatMap(x => permutations(xs.filter(y => y !== x)).map(rest => [x, ...rest])) : [[]];
const mods = ids.map(id => ALL_MODIFIERS.find(m => m.id === id));
function board(side, count = 1) {
  const g = new Chess('7k/8/8/8/8/8/8/K7 w - - 0 1');
  g.put({ type: 'n', color: side }, 'd4');
  if (count === 2) g.put({ type: 'n', color: side }, 'f4');
  return g;
}
for (const side of ['w', 'b']) {
  for (const order of permutations(ids)) test(`${side}: ${order.join(' + ')} retains all powers with one or two knights`, () => {
    for (const count of [1, 2]) {
      const g = board(side, count);
      let state = createChaosState();
      for (const id of order) state = applyServerDraft(g.fen(), state, { color: side === 'w' ? 'white' : 'black', phase: 3 }, id).state;
      const assignments = order.map(id => state.assignedSquares[`${side}_${id}`]);
      assert.equal(new Set(assignments).size, count, 'Use an unupgraded knight before stacking');
      const combined = getChaosMoves(g, mods, side, state.assignedSquares);
      const attacks = getChaosAttackedSquares(g, mods, side, state.assignedSquares);
      for (const mod of mods) {
        const individual = getChaosMoves(g, [mod], side, state.assignedSquares);
        assert.ok(individual.length, mod.id);
        assert.ok(individual.every(m => m.from === state.assignedSquares[`${side}_${mod.id}`]));
        assert.ok(individual.every(m => combined.some(c => c.from === m.from && c.to === m.to && c.modifierId === m.modifierId)));
        assert.ok(individual.every(m => attacks.has(m.to)), 'Movement and attack map agree');
      }
      const moved = updateTrackedPieces(state, 'd4', 'e6', false);
      for (const id of order) assert.equal(moved.assignedSquares[`${side}_${id}`], state.assignedSquares[`${side}_${id}`] === 'd4' ? 'e6' : 'f4');
      const captured = updateTrackedPieces(moved, 'g7', 'e6', true);
      for (const id of order) if (moved.assignedSquares[`${side}_${id}`] === 'e6') assert.equal(captured.assignedSquares[`${side}_${id}`], null);
    }
  });
  test(`${side}: stale or captured assignments never transfer to another knight`, () => {
    const g = board(side, 2);
    for (const square of [null, 'e5', 'a1', 'h8']) {
      const assigned = Object.fromEntries(ids.map(id => [`${side}_${id}`, square]));
      assert.deepEqual(getChaosMoves(g, mods, side, assigned), []);
      assert.equal(getChaosAttackedSquares(g, mods, side, assigned).size, 0);
    }
  });
  test(`${side}: Knight Horde does not duplicate a single-piece upgrade`, () => {
    const g = board(side);
    const grown = applyDraftEffect(g, ALL_MODIFIERS.find(m => m.id === 'knight-horde'), side, 0);
    assert.equal(grown.board().flat().filter(p => p?.type === 'n' && p.color === side).length, 3);
    const assigned = Object.fromEntries(ids.map(id => [`${side}_${id}`, 'd4']));
    assert.ok(getChaosMoves(grown, mods, side, assigned).every(m => m.from === 'd4'));
  });
}
