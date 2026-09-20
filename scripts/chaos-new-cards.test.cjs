/**
 * New shop cards, engine side: Conscription (backward pawn captures) and Phalanx (raise 3 pawns
 * on your third rank). Both are rare, phases 1-2, per docs/chaos-cards-audit-and-shop.md.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(fs.readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { Chess } = require('chess.js');
const { ALL_MODIFIERS } = require('../lib/chaos-chess.ts');
const { getChaosMoves, applyDraftEffect } = require('../lib/chaos-moves.ts');

const mod = (id) => {
  const m = ALL_MODIFIERS.find((x) => x.id === id);
  assert.ok(m, `${id} must exist in ALL_MODIFIERS`);
  return m;
};

test('conscription captures diagonally backwards, both sides', () => {
  // White pawn d4, black rook c3 (back-left) and black bishop e3 (back-right).
  const g = new Chess('7k/8/8/8/3P4/2r1b3/8/4K3 w - - 0 10');
  const moves = getChaosMoves(g, [mod('conscription')], 'w');
  assert.deepEqual(
    moves.map((m) => `${m.from}-${m.to}`).sort(),
    ['d4-c3', 'd4-e3'],
    'a pawn must be able to take backwards to either side',
  );
  assert.ok(moves.every((m) => m.type === 'capture' && m.modifierId === 'conscription'));
});

test('conscription does not hand out forward captures', () => {
  // Enemy straight ahead is Bayonet's job; Conscription must stay backward-only.
  const g = new Chess('7k/8/8/3r4/3P4/8/8/4K3 w - - 0 10');
  assert.equal(getChaosMoves(g, [mod('conscription')], 'w').length, 0);
  // And an enemy two squares back is out of reach.
  const far = new Chess('7k/8/8/8/3P4/8/2r5/4K3 w - - 0 10');
  assert.equal(getChaosMoves(far, [mod('conscription')], 'w').length, 0);
});

test('conscription works for black too', () => {
  // Black pawn d5, white knight c6 (its backwards direction is up the board).
  const g = new Chess('7k/8/2N5/3p4/8/8/8/4K3 b - - 0 10');
  const moves = getChaosMoves(g, [mod('conscription')], 'b');
  assert.deepEqual(moves.map((m) => `${m.from}-${m.to}`), ['d5-c6']);
});

test('phalanx raises three pawns on the third rank', () => {
  const g = new Chess('7k/8/8/8/8/8/8/4K3 w - - 0 10');
  const after = applyDraftEffect(g, mod('phalanx'), 'w', 0);
  assert.ok(after, 'phalanx must change the board');
  const raised = ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3'].filter((s) => {
    const p = after.get(s);
    return p && p.color === 'w' && p.type === 'p';
  });
  assert.equal(raised.length, 3, 'exactly three pawns, not one per file');
  assert.equal(after.get('d6'), undefined, 'nothing appears on the black third rank');
});

test('phalanx raises only what the rank has room for', () => {
  // Only h3 is empty on white's third rank, so one pawn is the whole raise.
  const g = new Chess('7k/8/8/8/8/PPPPPPP1/8/4K3 w - - 0 10');
  const after = applyDraftEffect(g, mod('phalanx'), 'w', 0);
  assert.ok(after);
  const raised = ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3'].filter((s) => {
    const p = after.get(s);
    return p && p.color === 'w' && p.type === 'p';
  });
  assert.equal(raised.length, 8, 'seven pawns plus the one raised on h3');
  assert.ok(after.get('h3'), 'the empty square is the one that gets filled');
  const elsewhere = after.board().flat().filter((p) => p && p.color === 'w' && p.type === 'p' && p.square !== undefined);
  assert.equal(
    elsewhere.length,
    ['a3','b3','c3','d3','e3','f3','g3','h3'].filter((s) => after.get(s)?.type === 'p').length,
    'every white pawn sits on the third rank',
  );
});

test('the server accepts exactly the spawns the engine produces', () => {
  const source = fs.readFileSync('lib/chaos-room-sync.ts', 'utf8');
  assert.match(source, /new Set<DraftSpawnId>\(\["knight-horde", "undead-army", "phalanx"\]\)/,
    'phalanx must be in the draft-spawn allowlist or the server rejects the draft');
  assert.match(source, /isDraftSpawnPower\(draftedId\)/,
    'the spawn guard must be used where drafts are validated');
  assert.match(source, /draftedId === "phalanx" \? \(side === "w" \? "3" : "6"\)/,
    'phalanx spawns are validated on the third rank only');
  assert.match(source, /draftedId === "knight-horde" \? 2 : draftedId === "phalanx" \? 3/,
    'phalanx expects three spawns, not the undead-army pawn count');
});

test('both cards are priced rare and drafted early, so they are actually seen', () => {
  for (const id of ['conscription', 'phalanx']) {
    assert.equal(mod(id).tier, 'rare', `${id} tier`);
    assert.deepEqual(mod(id).phases, [1, 2], `${id} phases`);
  }
  // Shop cards must not sit in the free/guest set or the games-played ladder.
  const collection = fs.readFileSync('lib/chaos-collection.ts', 'utf8');
  assert.ok(!collection.includes('"conscription"') && !collection.includes('"phalanx"'),
    'shop cards must not be granted by the free ladder');
});
