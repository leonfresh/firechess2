const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(fs.readFileSync(f, 'utf8'), {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}), f);
const {recordPractice, exerciseKey, buildReviewSession, DAY, readPracticeMemory, readMission, compareMission} = require('../lib/coaching-progress.ts');
const {PATTERNS} = require('../components/modern-preview/sample-data.ts');
const pattern = PATTERNS[0];

test('misses and reveals return tomorrow; immediate correction is not spaced recall', () => {
  const now = 1000;
  let memory = recordPractice({}, pattern, 'missed', now);
  assert.equal(memory[exerciseKey(pattern)].due, now + DAY);
  memory = recordPractice(memory, pattern, 'solved', now + 20);
  assert.equal(memory[exerciseKey(pattern)].needsReview, true);
  assert.equal(memory[exerciseKey(pattern)].streak, 0);
  memory = recordPractice(memory, pattern, 'solved', now + DAY);
  assert.equal(memory[exerciseKey(pattern)].needsReview, false);
  assert.equal(memory[exerciseKey(pattern)].streak, 1);
  memory = recordPractice(memory, pattern, 'solved', now + DAY * 2);
  assert.equal(memory[exerciseKey(pattern)].due, now + DAY * 5);
  memory = recordPractice(memory, pattern, 'solved', now + DAY * 2 + 1);
  assert.equal(memory[exerciseKey(pattern)].streak, 2);
  memory = recordPractice(memory, pattern, 'revealed', now + DAY * 5);
  assert.equal(memory[exerciseKey(pattern)].streak, 0);
});
test('exercise identity survives changing report IDs and FEN counters', () => {
  const parts = pattern.fen.split(' '); parts[4] = '12'; parts[5] = '30';
  assert.equal(exerciseKey(pattern), exerciseKey({...pattern, id:'new-report-id', fen:parts.join(' ')}));
});
test('review uses only available positions, prioritizes due items and adds unseen related positions', () => {
  const other = {...PATTERNS[1], id:'related', category:pattern.category, tags:pattern.tags};
  const memory = recordPractice({}, pattern, 'missed', 0);
  assert.deepEqual(buildReviewSession([pattern], memory, 10), []);
  assert.deepEqual(buildReviewSession([pattern, other], memory, DAY).map(p=>p.id), [pattern.id, other.id]);
  assert.deepEqual(buildReviewSession([other], memory, DAY).map(p=>p.id), [other.id]);
  assert.equal(buildReviewSession([pattern, {...pattern, id:'duplicate'}, other], memory, DAY).length, 2);
});
test('malformed browser storage fails closed', () => {
  assert.deepEqual(readPracticeMemory({bad:{due:'tomorrow'}, alsoBad:null}), {});
  assert.equal(readMission({version:1, games:0}), null);
  assert.equal(readMission('wrong shape'), null);
});
const baseline = {version:1, scanId:'old', theme:'Hanging pieces', count:4, games:2, settings:'same', gameUrls:['a','b'], createdAt:'2026-09-01T00:00:00Z'};
test('mission comparison normalizes sample size and rejects overlap, missing metadata and changed settings', () => {
  const next = {...baseline, scanId:'new', count:1, gameUrls:['c','d'], createdAt:'2026-09-20T00:00:00Z'};
  assert.equal(compareMission(baseline, baseline).status, 'waiting');
  assert.match(compareMission(baseline, next).message, /200.0 → 50.0/);
  assert.equal(compareMission(baseline, {...next, settings:'different'}).status, 'incomparable');
  assert.equal(compareMission(baseline, {...next, gameUrls:['a','d']}).status, 'incomparable');
  assert.equal(compareMission(baseline, {...next, gameUrls:['d']}).status, 'incomparable');
  assert.equal(compareMission(baseline, {...next, createdAt:null}).status, 'incomparable');
  assert.equal(compareMission(baseline, {...next, createdAt:'2020-01-01'}).status, 'incomparable');
});
