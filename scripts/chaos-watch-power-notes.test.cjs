const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(require('fs').readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { describeWatchPower } = require('../lib/chaos-watch.ts');
/** Replay notes name the power behind a move. Positions are real frames from archived games. */
const frame = (fen, label, from, to, black = [], white = []) => ({ fen, label, from, to, state: { white, black } });
const G1 = ['camel', 'usurper', 'king-wrath', 'king-ascension'];

test('a Usurper swap is named, not shown as a king move (1cc01168, e8 to d6)', () => {
  const before = frame('4k2r/p7/3bpp2/1bp3p1/7p/P1P1PNPP/PRP2P2/7K b - - 0 28', 'white: h2 → h1');
  const after = frame('4b2r/p7/3kpp2/1bp3p1/7p/P1P1PNPP/PRP2P2/7K w - - 0 29', 'black: e8 → d6', 'e8', 'd6', G1);
  assert.equal(describeWatchPower(before, after), '🎭 Usurper: the king swapped places with the bishop');
});

test('a ranged king capture and the revived queen are both explained (1cc01168, d6 to g3)', () => {
  const before = frame('4b2r/p7/3kpp2/1Rp3p1/8/P1P1PNPP/P1P5/7K b - - 0 30', 'white: f2 → g3');
  const after = frame('3qb2r/p7/4pp2/1Rp3p1/8/P1P1PNkP/P1P5/7K w - - 0 31', 'black: d6 → g3', 'd6', 'g3', G1);
  const note = describeWatchPower(before, after);
  assert.match(note, /King Ascension/);
  assert.match(note, /Regicide revived a queen on d8/);
});

test('a Torpedo double step and a Battlefield Promotion are named (92e97c43)', () => {
  const torpedo = describeWatchPower(
    frame('8/p4kp1/8/4K2p/P4P2/P5P1/1P3P1q/8 b - - 0 37', 'white: c3 → e5'),
    frame('8/p4kp1/8/4K3/P4P2/P5Pp/1P3P1q/8 w - - 0 38', 'black: h5 → h3', 'h5', 'h3', ['pawn-charge']));
  assert.equal(torpedo, '🚀 Torpedo Pawns: two squares forward');
  const promotion = describeWatchPower(
    frame('r4rk1/p5pp/8/1N2P3/Pp3P2/6P1/1P3P1P/3RK2R b - - 0 23', 'white: a1 → d1'),
    frame('r4rk1/p5pp/8/1N2P3/P4P2/1q4P1/1P3P1P/3RK2R w - - 0 24', 'black: b4 → b3', 'b4', 'b3', ['pawn-promotion-early']));
  assert.equal(promotion, '⬆️ Battlefield Promotion: the pawn became a queen');
});

test('ordinary moves, captures and castling get no note', () => {
  const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  assert.equal(describeWatchPower(frame(start, 'Starting position'), frame('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', 'white: e2 → e4', 'e2', 'e4')), null);
  assert.equal(describeWatchPower(
    frame('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'x'),
    frame('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1', 'white: e1 → g1', 'e1', 'g1')), null);
  assert.equal(describeWatchPower(
    frame('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', 'x'),
    frame('4k3/8/8/3P4/8/8/8/4K3 b - - 0 1', 'white: e4 → d5', 'e4', 'd5')), null);
});

test('a move normal chess forbids is attributed to the mover\'s matching power', () => {
  const note = describeWatchPower(
    frame('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1', 'x'),
    frame('4k3/8/8/8/1N6/8/8/4K3 b - - 0 1', 'white: b1 → b4', 'b1', 'b4', [], ['camel']));
  assert.match(note, /Camel: a move only the knight's power allows/);
});
