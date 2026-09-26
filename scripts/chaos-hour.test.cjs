/**
 * Chaos Hour: the lobby countdown and the gold trigger must agree on the same hour.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(fs.readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { CHAOS_HOUR_UTC, chaosHourState, formatWait } = require('../lib/chaos-hour.ts');

const at = (iso) => Date.parse(iso);

test('live from the top of the hour until just before the next', () => {
  assert.equal(chaosHourState(at('2026-09-26T20:00:00Z')).live, true);
  const late = chaosHourState(at('2026-09-26T20:59:30Z'));
  assert.equal(late.live, true);
  assert.equal(late.endsIn, 30_000);
  assert.equal(chaosHourState(at('2026-09-26T21:00:00Z')).live, false);
});

test('counts down to today or rolls over to tomorrow', () => {
  const before = chaosHourState(at('2026-09-26T17:46:00Z'));
  assert.equal(before.live, false);
  assert.equal(formatWait(before.startsIn), '2h 14m');
  const after = chaosHourState(at('2026-09-26T21:30:00Z'));
  assert.equal(after.start.toISOString(), '2026-09-27T20:00:00.000Z');
  assert.equal(formatWait(after.startsIn), '22h 30m');
  assert.equal(formatWait(20_000), 'under a minute');
});

test('the SQL trigger uses the same hour, and the Discord heads-up fires 15 minutes before it', () => {
  const sql = fs.readFileSync('migrations/chaos-hour.sql', 'utf8');
  assert.ok(sql.includes(`AT TIME ZONE 'UTC') = ${CHAOS_HOUR_UTC}`), 'chaos_hour_active() must match CHAOS_HOUR_UTC');
  assert.ok(sql.includes("'chaos_hour'"), 'the bonus is its own ledger line');
  const cron = JSON.parse(fs.readFileSync('vercel.json', 'utf8')).crons.find((c) => c.path === '/api/chaos/hour/post');
  assert.equal(cron.schedule, `45 ${CHAOS_HOUR_UTC - 1} * * *`);
});
