const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(require('fs').readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Chess } = require('chess.js');
const { ALL_MODIFIERS, createChaosState, updateTrackedPieces } = require('../lib/chaos-chess.ts');
const { getChaosMoves, executeChaosMove } = require('../lib/chaos-moves.ts');
const powers = (...ids) => ids.map(id => ALL_MODIFIERS.find(m => m.id === id));
function setup(side, pieces) {
  const g = new Chess(`7k/8/8/8/8/8/8/K7 ${side} - - 0 10`);
  for (const [square, type, color = side] of pieces) { if (type === 'k') g.remove(color === 'w' ? 'a1' : 'h8'); g.put({ type, color }, square); }
  return g;
}
for (const side of ['w', 'b']) {
  const enemy = side === 'w' ? 'b' : 'w';
  test(`${side}: a sniper cannot expose its king by triggering Kamikaze`, () => {
    const g = setup(side, [['d1','k'], ['d4','b'], ['d8','r',enemy], ['b2','b',enemy]]);
    const mods = powers('sniper-bishop');
    assert.ok(getChaosMoves(g, mods, side).some(m => m.to === 'b2'));
    assert.ok(!getChaosMoves(g, mods, side, {}, powers('kamikaze-bishop')).some(m => m.to === 'b2'));
  });
  test(`${side}: pawn charge, bayonet and early promotion keep their distinct options`, () => {
    const from = side === 'w' ? 'd4' : 'd5', to = side === 'w' ? 'd5' : 'd4';
    const g = setup(side, [[from,'p']]);
    const mods = powers('pawn-charge','pawn-capture-forward','pawn-promotion-early');
    const promotion = getChaosMoves(g, mods, side).find(m => m.modifierId === 'pawn-promotion-early' && m.to === to);
    assert.ok(promotion, 'Promotion must use the rank printed on the card');
    assert.equal(executeChaosMove(g, promotion, mods).get(to).type, 'q');
    assert.ok(getChaosMoves(g, mods, side).some(m => m.modifierId === 'pawn-charge'));
    g.put({type:'r',color:enemy},to);
    const bayonet = getChaosMoves(g, mods, side).find(m => m.modifierId === 'pawn-capture-forward' && m.to === to);
    assert.ok(bayonet);
    assert.equal(executeChaosMove(g, bayonet, mods).get(to).color, side);
  });
  test(`${side}: Archbishop sniper keeps its jumps and clears the captured upgrade`, () => {
    const g = setup(side, [['d4', 'b'], ['b2', 'b', enemy]]);
    const mods = powers('archbishop', 'dragon-bishop', 'sniper-bishop', 'bishop-cannon', 'bishop-bounce');
    const state = { ...createChaosState(), assignedSquares: { [`${side}_archbishop`]: 'd4', [`${enemy}_archbishop`]: 'b2' } };
    const shot = getChaosMoves(g, mods, side, state.assignedSquares).find(m => m.modifierId === 'sniper-bishop');
    assert.ok(shot);
    const after = executeChaosMove(g, shot, mods);
    const next = updateTrackedPieces(state, shot.from, shot.to, true, { pieceStays: shot.pieceStays, board: after });
    assert.equal(next.assignedSquares[`${side}_archbishop`], 'd4');
    assert.equal(next.assignedSquares[`${enemy}_archbishop`], null);
    const moves = getChaosMoves(after, mods, side, next.assignedSquares);
    assert.ok(moves.some(m => m.modifierId === 'archbishop' && m.from === 'd4'));
    assert.ok(moves.some(m => m.modifierId === 'dragon-bishop' && m.from === 'd4'));
  });
  test(`${side}: Usurper carries the swapped Archbishop upgrade with the bishop`, () => {
    const g = setup(side, [['d4', 'b']]);
    const from = side === 'w' ? 'a1' : 'h8';
    const mods = powers('archbishop', 'usurper');
    const state = { ...createChaosState(), assignedSquares: { [`${side}_archbishop`]: 'd4' } };
    const swap = getChaosMoves(g, mods, side, state.assignedSquares).find(m => m.modifierId === 'usurper' && m.to === 'd4');
    assert.ok(swap);
    const after = executeChaosMove(g, swap, mods);
    const next = updateTrackedPieces(state, from, 'd4', false, { swap: true, board: after });
    assert.equal(next.assignedSquares[`${side}_archbishop`], from);
    assert.equal(after.get(from).type, 'b');
  });
  test(`${side}: Railgun applies collateral behind every hit without destroying kings`, () => {
    const g = setup(side, [['d4','r'], ['b4','p',enemy], ['a4','n'], ['f4','p',enemy], ['g4','b',enemy], ['d6','p',enemy], ['d7','k',enemy]]);
    // Relocate the enemy king rather than leaving two kings on the board.

    const mods = powers('railgun','collateral-rook','dragon-rook','rook-cannon','phantom-rook');
    const shot = getChaosMoves(g, mods, side).find(m => m.modifierId === 'railgun');
    assert.ok(shot);
    const after = executeChaosMove(g, shot, mods);
    for (const square of ['b4','a4','f4','g4','d6']) assert.equal(after.get(square), undefined, square);
    assert.equal(after.get('d4').type, 'r');
    assert.equal(after.get('d7').type, 'k');
    const state = { ...createChaosState(), assignedSquares: { [`${enemy}_archbishop`]: 'g4' } };
    assert.equal(updateTrackedPieces(state, 'd4', shot.to, true, { pieceStays:true, board:after }).assignedSquares[`${enemy}_archbishop`], null);
  });
  test(`${side}: ranged captures trigger Kamikaze even on a secondary railgun target`, () => {
    for (const ranged of ['sniper-bishop', 'railgun']) {
      const g = setup(side, ranged === 'sniper-bishop' ? [['d4','b'],['b2','b',enemy]] : [['d4','r'],['b4','p',enemy],['f4','b',enemy]]);
      const mods = powers(ranged);
      const shot = getChaosMoves(g, mods, side).find(m => m.modifierId === ranged);
      assert.ok(shot);
      const after = executeChaosMove(g, shot, mods, powers('kamikaze-bishop'));
      assert.equal(after.get('d4'), undefined, 'The attacker is destroyed as promised by the card');
      assert.equal(after.get(ranged === 'sniper-bishop' ? 'b2' : 'f4'), undefined);
    }
  });
  test(`${side}: bishop and rook movement upgrades remain available in either draft order`, () => {
    for (const [type, ids] of [['b',['archbishop','dragon-bishop','bishop-bounce','bishop-cannon','sniper-bishop']], ['r',['dragon-rook','phantom-rook','rook-cannon','railgun']]]) {
      const g = setup(side, [['d4',type],['e5','p'],['f6','p',enemy],['e4','p'],['f4','p',enemy],['b6','p',enemy],['b4','p',enemy]]);
      const assigned = { [`${side}_archbishop`]: 'd4' };
      for (const order of [ids, [...ids].reverse()]) {
        const all = getChaosMoves(g, powers(...order), side, assigned);
        for (const id of ids) {
          const individual = getChaosMoves(g, powers(id), side, assigned);
          assert.ok(individual.length, id);
          assert.ok(individual.every(m => all.some(a => a.from === m.from && a.to === m.to && a.modifierId === m.modifierId)));
        }
      }
    }
  });
}
