/**
 * Hostile Takeover (epic, shop card): once per game, the piece that captures one of your pawns
 * defects to your side.
 *
 * The board flip lives in applyPostMoveEffects, the same hook the room-sync validator runs, so both
 * sides compute the same board. Spending the card is the client's job (the card leaves the holder's
 * modifier list), which is what makes it once per game.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(fs.readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { Chess } = require('chess.js');
const { ALL_MODIFIERS, SHOP_CARD_IDS } = require('../lib/chaos-chess.ts');
const { applyPostMoveEffects } = require('../lib/chaos-moves.ts');

const ht = ALL_MODIFIERS.find((m) => m.id === 'hostile-takeover');
assert.ok(ht, 'hostile-takeover must exist in ALL_MODIFIERS');

test('the card is an epic shop card in the mid-game phases', () => {
  assert.equal(ht.tier, 'epic');
  assert.deepEqual(ht.phases, [2, 3]);
  assert.ok(SHOP_CARD_IDS.has('hostile-takeover'), 'it is sold in the shop, not free');
  assert.ok(ht.description.toLowerCase().includes('pawn'), 'the rule must name the trigger piece');
});

test('the capturer of a pawn defects to the victim side', () => {
  // White rook c1 takes black's pawn on c5. Black holds Hostile Takeover.
  const g = new Chess('7k/8/8/2p5/8/8/8/K1R5 w - - 0 20');
  const before = g.move({ from: 'c1', to: 'c5' });
  assert.equal(before.captured, 'p', 'the test must set up a pawn capture');
  const after = applyPostMoveEffects(g, 'c1', 'c5', true, 'r', 'w', [], [ht], 'p');
  assert.ok(after, 'the effect must report a modified board');
  assert.deepEqual(after.get('c5'), { type: 'r', color: 'b' }, 'the rook now fights for black');
  assert.equal(after.get('c1'), undefined, 'the rook did not stay on c1');
});

test('a base-card capture is untouched', () => {
  const g = new Chess('7k/8/8/2p5/8/8/8/K1R5 w - - 0 20');
  g.move({ from: 'c1', to: 'c5' });
  const after = applyPostMoveEffects(g, 'c1', 'c5', true, 'r', 'w', [], [], 'p');
  assert.equal(after, null, 'without the card the board must not change');
  assert.deepEqual(g.get('c5'), { type: 'r', color: 'w' });
});

test('a king never defects: the capture of a pawn by a king leaves the king alone', () => {
  // Black king h8 walks onto a white pawn on h7 and takes it.
  const g = new Chess('7k/7P/8/8/8/8/8/K7 b - - 0 20');
  const before = g.move({ from: 'h8', to: 'h7' });
  assert.equal(before.captured, 'p');
  const after = applyPostMoveEffects(g, 'h8', 'h7', true, 'k', 'b', [], [ht], 'p');
  assert.equal(after, null, 'flipping the king would leave the mover with no king at all');
  assert.deepEqual(g.get('h7'), { type: 'k', color: 'b' });
});

test('the flip fires on the victim side only, whichever colour they play', () => {
  // Black pawn on c5 takes the white pawn on d4; white holds the card, so the black pawn defects.
  const g = new Chess('7k/8/8/2p5/3P4/8/8/K7 b - - 0 20');
  const before = g.move({ from: 'c5', to: 'd4' });
  assert.equal(before.captured, 'p');
  const after = applyPostMoveEffects(g, 'c5', 'd4', true, 'p', 'b', [], [ht], 'p');
  assert.ok(after);
  assert.deepEqual(after.get('d4'), { type: 'p', color: 'w' }, 'the pawn changed sides');
});

test('the client spends the card, so it cannot fire twice in a game', () => {
  const src = fs.readFileSync('app/chaos/page.tsx', 'utf8');
  assert.ok(src.includes('m.id !== "hostile-takeover"'), 'the holder must lose the card after it fires');
  assert.ok(/victimIsWhite/.test(src), 'the victim side decides which list loses the card');
  assert.ok(src.includes('applyPostMoveEffects'), 'the board flip stays in the shared hook');
  const sync = fs.readFileSync('lib/chaos-room-sync.ts', 'utf8');
  assert.ok(sync.includes('applyPostMoveEffects'), 'the validator must run the same effect');
});
