const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(fs.readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { getPieceDanger, coachingTheme, buildTrainingSession, humanExplanation } = require('../lib/report-coaching.ts');
const { buildReportPositions, FREE_FINDING_LIMITS } = require('../components/modern-preview/report-data.ts');
const { PATTERNS } = require('../components/modern-preview/sample-data.ts');
test('danger counts actual attackers and defenders from a fixed player perspective', () => {
  const fen = '4k3/8/8/8/r2Q4/8/8/4K3 w - - 0 1';
  const queen = getPieceDanger(fen, 'w').find(p => p.square === 'd4');
  assert.equal(queen.level, 'red'); assert.deepEqual(queen.attackers, ['a4']); assert.deepEqual(queen.defenders, []);
  assert.equal(getPieceDanger(fen, 'w').find(p => p.square === 'e1').level, 'green');
  const defended = getPieceDanger('4k3/8/8/8/r2Q4/8/8/3RK3 w - - 0 1', 'w').find(p => p.square === 'd4');
  assert.equal(defended.level, 'yellow'); assert.deepEqual(defended.defenders, ['d1']);
  assert.ok(getPieceDanger(fen, 'b').every(p => ['a4', 'e8'].includes(p.square)));
});
test('an attacked king is red even with friendly defenders', () => {
  assert.equal(getPieceDanger('k3r3/8/8/8/8/8/8/3RK3 w - - 0 1', 'w').find(p => p.piece === 'king').level, 'red');
});
test('theme grouping joins tension tags and keeps coaching grounded', () => {
  assert.equal(coachingTheme({category:'Positional', tags:['Released Tension']}), 'Released Tension');
  assert.equal(coachingTheme({category:'Openings', tags:['Unnecessary Capture']}), 'Released Tension');
  assert.equal(coachingTheme({category:'Tactics', tags:['Hanging Piece']}), 'Hanging pieces');
  assert.match(humanExplanation(PATTERNS[0]), /compare|attacker/i);
});
test('session removes duplicate positions, caps length, and handles empty reports', () => {
  const positions = [...PATTERNS, {...PATTERNS[0], id: 'duplicate'}];
  const session = buildTrainingSession(positions, [], 3);
  assert.equal(session.length, 3);
  assert.equal(new Set(session.map(p => p.fen + p.best)).size, 3);
  assert.deepEqual(buildTrainingSession([], []), []);
  assert.equal(positions.length, PATTERNS.length + 1);
});
test('session prioritizes unpracticed positions within a theme', () => {
  const p = PATTERNS[0];
  const next = {...p, id: 'fresh', fen: PATTERNS[1].fen};
  assert.equal(buildTrainingSession([p, next], [p.id], 1)[0].id, 'fresh');
});
test('free reports cap every category at six playable positions; Pro retains all', () => {
  const p = PATTERNS[0];
  const row = {fen:p.fen,userMove:p.played,bestMove:p.best,cpLoss:120,tags:['Released Tension']};
  const rows = Array.from({length:8}, () => ({...row}));
  const result = {leaks:rows,oneOffMistakes:[],missedTactics:rows,endgameMistakes:rows,positionalFindings:rows,brilliantMoves:rows,timeManagement:{moments:rows}};
  const free = buildReportPositions(result, false);
  for (const category of Object.keys(FREE_FINDING_LIMITS)) assert.equal(free.filter(p => p.category === category).length, 6);
  assert.equal(free.filter(p => p.category === 'Openings').length, FREE_FINDING_LIMITS.Openings);
  assert.equal(buildReportPositions(result, true).length, 48);
  const withInvalid = {...result,positionalFindings:[{...row,bestMove:'invalid'},...rows]};
  assert.equal(buildReportPositions(withInvalid,false).filter(p=>p.category==='Positional').length,6);
  assert.equal(buildTrainingSession(free,[]).every(p=>free.some(f=>f.id===p.id)),true);
});

test('positional themes ignore generic tags and retain multiple actual motifs', () => {
  const {coachingThemes} = require('../lib/report-coaching.ts');
  assert.deepEqual(coachingThemes({category:'Positional',tags:['Opening','Repeated Habit','Released Tension','Passive Retreat']}), ['Released Tension','Passive Retreat']);
  assert.deepEqual(coachingThemes({category:'Positional',tags:['Tactical Miss','Repeated Habit']}), ['Improve your pieces']);
});
test('counting arrows point from each attacker and defender to the selected piece', () => {
  const {countingArrows} = require('../lib/report-coaching.ts');
  const queen = getPieceDanger('4k3/8/8/8/r2Q4/8/8/3RK3 w - - 0 1', 'w').find(p=>p.square==='d4');
  assert.deepEqual(countingArrows(queen), [['a4','d4','#ef4444dd'],['d1','d4','#facc15dd']]);
  assert.deepEqual(countingArrows(undefined), []);
});
test('previous move is recovered from the source game without revealing the puzzle answer', () => {
  const {Chess} = require('chess.js');
  const chess = new Chess(); chess.move('e4'); chess.move('e5');
  const result = {leaks:[],oneOffMistakes:[],missedTactics:[],endgameMistakes:[],positionalFindings:[{fenBefore:chess.fen(),userMove:'Nf3',bestMove:'Nc3',cpLoss:50,tags:['Opening','Missed Development'],gameUrl:'https://lichess.org/example'}],games:[{moves:'1. e4 e5 2. Nf3',gameUrl:'https://lichess.org/example'}]};
  const position = buildReportPositions(result,false)[0];
  assert.equal(position.title, 'Missed Development');
  assert.deepEqual(position.lastMove, {from:'e7',to:'e5',san:'e5'});
  assert.equal(buildReportPositions({...result,games:[]},false)[0].lastMove, undefined);
  assert.equal(buildReportPositions({...result,games:[{...result.games[0],moves:'invalid'}]},false)[0].lastMove, undefined);
});

const { trainingHeading, habitPositions, describeReply } = require('../lib/report-coaching.ts');
test('Road to 2000 requires a known positive rating below 2000', () => {
  for (const rating of [null, undefined, 0, -1, NaN, Infinity, 2000, 2300]) assert.equal(trainingHeading(rating), 'Your next training focus');
  for (const rating of [800, 1999]) assert.equal(trainingHeading(rating), 'Your road to 2000');
});
test('habit sessions select only matching accessible report positions', () => {
  const available = PATTERNS.slice(0, 6);
  const selected = habitPositions(available, 'safety');
  assert.ok(selected.every(p => available.includes(p) && ['Tactics', 'Clock'].includes(p.category)));
  assert.deepEqual(habitPositions(available, 'unknown'), []);
  assert.ok(buildTrainingSession(selected, []).every(p => selected.includes(p)));
});
test('opponent reply describes a legal capture and rejects impossible moves', () => {
  const reply = describeReply('4k3/8/8/8/r2Q4/8/8/4K3 b - - 0 1', 'a4d4');
  assert.equal(reply.text, 'Rxd4 captures your queen.');
  assert.equal(reply.from, 'a4'); assert.equal(reply.to, 'd4');
  assert.throws(() => describeReply('4k3/8/8/8/r2Q4/8/8/4K3 b - - 0 1', 'a4b5'));
});

test('a pinned defender is explained only when recapturing exposes its king', () => {
  const pinned = describeReply('k3r3/8/6b1/8/8/3N4/4P3/4K3 b - - 0 1', 'g6d3');
  assert.match(pinned.text, /captures your knight/);
  assert.equal(pinned.pinnedDefenders.length, 1);
  assert.match(pinned.pinnedDefenders[0], /pawn on e2.*king on e1/);
  const free = describeReply('k7/8/6b1/8/8/3N4/4P3/4K3 b - - 0 1', 'g6d3');
  assert.deepEqual(free.pinnedDefenders, []);
});
test('priority excludes highlights and duplicate positions', () => {
  const {coachingPriority} = require('../lib/report-coaching.ts');
  assert.equal(coachingPriority([{...PATTERNS[0],category:'Brilliants'}]), null);
  const focus = coachingPriority([PATTERNS[0], {...PATTERNS[0], id:'duplicate'}]);
  assert.equal(focus.positions.length, 1);
  assert.equal(coachingPriority([]), null);
});
