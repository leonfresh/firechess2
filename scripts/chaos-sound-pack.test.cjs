const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(require('fs').readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const Module = require('module');
const path = require('path');
// Resolve the "@/" alias used by the libraries.
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolve.call(this, request.startsWith('@/') ? path.join(__dirname, '..', request.slice(2)) : request, ...rest);
};
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
/** Chaos sound identity: one pack for the website and the Activity, restored when leaving Chaos. */
let played = [];
global.Audio = class { constructor(src) { this.src = src; } play() { played.push(this.src); return Promise.resolve(); } pause() {} };
const sounds = require('../lib/sounds.ts');
const pack = require('../lib/chaos-sound-pack.ts');
const last = (name) => { played = []; sounds.playSound(name); return played[0]; };

test('the check sound is real audio everywhere (Check.mp3 was a link to a silent file)', () => {
  assert.equal(last('check'), '/activity/audio/check.wav');
  const wav = fs.readFileSync('public/activity/audio/check.wav');
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.ok(wav.length > 5000);
});

test('the new cues exist as generated files', () => {
  for (const name of ['tick', 'revive', 'whoosh']) assert.ok(fs.statSync(`public/activity/audio/${name}.wav`).size > 5000, name);
  assert.equal(last('clock-tick'), '/activity/audio/tick.wav');
});

test('a website Chaos page installs the cartoon cues, keeps real meme clips, and leaving restores the site', () => {
  assert.equal(last('move'), '/sounds/Move.mp3');
  const leave = pack.installChaosSounds();
  assert.equal(last('move'), '/activity/audio/move.wav');
  assert.equal(last('reveal-stinger'), '/activity/audio/draft.wav');
  assert.equal(last('airhorn'), '/sounds/viral/airhorn.mp3', 'real clip, behind the meme toggle');
  leave();
  assert.equal(last('move'), '/sounds/Move.mp3', 'roast/puzzles/analysis get their own sounds back');
});

test('two Chaos pages (watch + game) only restore once both are gone', () => {
  const a = pack.installChaosSounds(), b = pack.installChaosSounds();
  a();
  assert.equal(last('move'), '/activity/audio/move.wav');
  b();
  assert.equal(last('move'), '/sounds/Move.mp3');
});

test('reactions are rate-limited in the Chaos pack', () => {
  const leave = pack.installChaosSounds();
  played = [];
  sounds.playSound('crowd-ooh'); sounds.playSound('airhorn'); sounds.playSound('record-scratch');
  assert.equal(played.length, 1, 'one reaction per 1.8s');
  sounds.playSound('move'); sounds.playSound('capture');
  assert.equal(played.length, 3, 'game cues are never throttled');
  leave();
});

test('inside the Activity the permanent pack (cartoon memes) is never swapped or reset by shared pages', () => {
  pack.installChaosSounds({ permanent: true, cartoonMemes: true });
  const leave = pack.installChaosSounds();
  assert.equal(last('airhorn'), '/activity/audio/win.wav');
  leave();
  assert.equal(last('move'), '/activity/audio/move.wav');
});
