const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(require('fs').readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Chess } = require('chess.js');
const { ALL_MODIFIERS } = require('../lib/chaos-chess.ts');
const { getChaosMoves, executeChaosMove } = require('../lib/chaos-moves.ts');
/** Battlefield Promotion: pawns promote on rank 6 (White) / rank 3 (Black), whichever power moved them there. */
const powers = (...ids) => ids.map(id => ALL_MODIFIERS.find(m => m.id === id));
function board(side, pieces) {
  const g = new Chess(`k7/8/8/8/8/8/8/7K ${side} - - 0 30`);
  for (const [square, type, color] of pieces) g.put({ type, color }, square);
  return g;
}
const find = (moves, from, to) => moves.filter(m => m.from === from && m.to === to);

test('a Torpedo Pawns double step onto rank 3 promotes a Black pawn (replay 92e97c43, h5 to h3)', () => {
  const g = board('b', [['h5', 'p', 'b']]);
  const [move] = find(getChaosMoves(g, powers('pawn-charge', 'pawn-promotion-early'), 'b'), 'h5', 'h3');
  assert.ok(move, 'the charge exists');
  assert.equal(move.spawnPiece?.type, 'q');
  assert.equal(move.promotionChoice, true);
  assert.equal(executeChaosMove(g, move, powers('pawn-charge', 'pawn-promotion-early')).get('h3')?.type, 'q');
});

test('a White torpedo onto rank 6, or jumping past it to rank 7, promotes', () => {
  const g = board('w', [['c4', 'p', 'w'], ['f5', 'p', 'w']]);
  const moves = getChaosMoves(g, powers('pawn-charge', 'pawn-promotion-early'), 'w');
  assert.equal(find(moves, 'c4', 'c6')[0]?.spawnPiece?.type, 'q');
  assert.equal(find(moves, 'f5', 'f7')[0]?.spawnPiece?.type, 'q');
});

test('without Battlefield Promotion a torpedo onto rank 6 stays a pawn', () => {
  const g = board('w', [['c4', 'p', 'w']]);
  assert.equal(find(getChaosMoves(g, powers('pawn-charge'), 'w'), 'c4', 'c6')[0]?.spawnPiece, undefined);
});

test('a pawn already past the promotion rank promotes on its next step or capture', () => {
  const g = board('b', [['h3', 'p', 'b'], ['g2', 'n', 'w']]);
  const moves = getChaosMoves(g, powers('pawn-promotion-early'), 'b');
  assert.equal(find(moves, 'h3', 'h2')[0]?.spawnPiece?.type, 'q', 'step onto rank 2');
  assert.equal(find(moves, 'h3', 'g2')[0]?.spawnPiece?.type, 'q', 'capture onto rank 2');
});

test('backward pawn moves never promote early', () => {
  const g = board('w', [['e7', 'p', 'w'], ['d6', 'n', 'b']]);
  const back = find(getChaosMoves(g, powers('conscription', 'pawn-promotion-early'), 'w'), 'e7', 'd6')[0];
  assert.ok(back, 'Conscription can capture backwards');
  assert.equal(back.spawnPiece, undefined);
});

test('the promoting torpedo is offered first, and the plain one stays valid for the server', () => {
  const g = board('b', [['h5', 'p', 'b']]);
  const options = find(getChaosMoves(g, powers('pawn-charge', 'pawn-promotion-early'), 'b'), 'h5', 'h3');
  assert.equal(options.length, 2);
  assert.equal(options[0].spawnPiece?.type, 'q', 'the board takes the first match: promotion');
  assert.equal(options[1].spawnPiece, undefined);
});
