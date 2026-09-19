#!/usr/bin/env node
/**
 * Chaos Chess growth tracker — the weekly scorecard for "is this spreading?".
 *
 *   node scripts/chaos-growth-report.mjs            # capture + print the report (delivered by cron)
 *   node scripts/chaos-growth-report.mjs --history   # print the stored trend, never writes
 *   node scripts/chaos-growth-report.mjs --json      # machine-readable capture
 *   node scripts/chaos-growth-report.mjs --days 30   # widen the window
 *
 * Every capture writes one row per metric into `chaos_metric` (migrations/chaos-metrics.sql), so the
 * history is queryable later instead of living in a chat log. The report compares this window with
 * the previous capture, scores the targets the plan was built on, and names the next experiment.
 *
 * Read-only against every other table. Runs standalone (Node + fetch, no deps).
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const number = (name, fallback) => {
  const raw = argv.find(a => a.startsWith(`--${name}=`)) ?? (argv.indexOf(`--${name}`) >= 0 ? argv[argv.indexOf(`--${name}`) + 1] : undefined);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};
const DAYS = number('days', 7);
const historyOnly = flag('history');
const asJson = flag('json');

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }),
);
const DB_URL = env.DATABASE_URL_UNPOOLED;
const host = new URL(DB_URL).hostname;
async function q(sql) {
  const res = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Neon-Connection-String': DB_URL},
    body: JSON.stringify({query: sql, params: []}),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()).rows;
}
/** Postgres identifiers are case-sensitive; the chaos tables use camelCase columns. */
const W = `now() - make_interval(days => ${DAYS})`;
// Player-day pairs across rooms (naive UTC +10h for Sydney days) and archived games.
const SEATS = `
seats as (
  select id, day from (
    select "hostId" as id, (("createdAt" + interval '10 hours')::date) as day from chaos_room where "guestId" is not null
    union all select "guestId" as id, (("createdAt" + interval '10 hours')::date) as day from chaos_room where "guestId" is not null
    union all select host_id as id, (ended_at at time zone 'Australia/Sydney')::date as day from chaos_match
    union all select guest_id as id, (ended_at at time zone 'Australia/Sydney')::date as day from chaos_match) t
  group by id, day)`;

const METRICS = {
  games: `select count(*)::numeric as v, jsonb_build_object('rated', count(*) filter (where rated),
      'rooms', count(distinct room_id)) as detail
    from chaos_match where ended_at > ${W}`,
  rated_games: `select count(*)::numeric as v from chaos_match where rated and ended_at > ${W}`,
  players: `with ${SEATS}
    select count(distinct id)::numeric as v from seats where day >= (now() - make_interval(days => ${DAYS}))::date`,
  new_players: `with ${SEATS}, firsts as (select id, min(day) as first_day from seats group by id)
    select count(*)::numeric as v from firsts
    where first_day >= (now() - make_interval(days => ${DAYS}))::date`,
  cohort_return_pct: `with ${SEATS}, firsts as (select id, min(day) as first_day from seats group by id),
    cohort as (select id, first_day from firsts where first_day >= (now() - make_interval(days => ${DAYS}))::date),
    days as (select c.id, count(distinct s.day)::int as d from cohort c join seats s on s.id = c.id group by c.id)
    select round(100 * coalesce(count(*) filter (where d > 1), 0)::numeric / greatest(count(*), 1), 1) as v,
      jsonb_build_object('cohort', count(*)) as detail from days`,
  games_per_room: `select round(count(*)::numeric / greatest(count(distinct room_id), 1), 2) as v
    from chaos_match where ended_at > ${W}`,
  timed_games: `select count(*)::numeric as v from chaos_match
    where ended_at > ${W} and (record->>'timeControlSeconds')::int > 0`,
  no_rush_games: `select count(*)::numeric as v from chaos_match
    where ended_at > ${W} and (record->>'timeControlSeconds')::int <= 0`,
  queue_joins: `select count(*)::numeric as v from chaos_room
    where "guestId" is not null and "createdAt" > ${W} and ("chaosState"->'_sync'->>'ratedQueue') = 'true'`,
  launches: `select count(*)::numeric as v,
      jsonb_build_object('players', count(distinct player_id), 'guilds', count(distinct guild_id)) as detail
    from chaos_launch where created_at > ${W}`,
  same_instance_games: `select count(*)::numeric as v from chaos_match m
    where m.ended_at > ${W} and exists (
      select 1 from chaos_launch h join chaos_launch g on h.instance_id = g.instance_id
      where h.player_id = m.host_id and g.player_id = m.guest_id
        and h.created_at between m.ended_at - interval '12 hours' and m.ended_at
        and g.created_at between m.ended_at - interval '12 hours' and m.ended_at)`,
};

const TARGETS = [
  {metric: 'rated_games', test: value => value > 0, label: 'first rated game', next: 'nudge the clock: more timed games, or seed a server that plays on 5+3'},
  {metric: 'same_instance_games', test: value => value > 0, label: 'in-call games (invite loop in use)', next: 'push the invite button: it is live but unused, so the loop needs a first champion'},
  {metric: 'games_per_room', test: value => value >= 2, label: 'games per room ≥ 2 (chaining working)', next: 'auto-rematch is live: watch whether rooms still stop at one game'},
  {metric: 'cohort_return_pct', test: value => value >= 25, label: 'new-player return ≥ 25%', next: 'retention: onboarding + a daily reason to come back'},
];

async function capture() {
  const rows = [];
  const values = {};
  for (const [metric, sql] of Object.entries(METRICS)) {
    const [row] = await q(sql);
    const value = Number(row?.v ?? 0);
    values[metric] = value;
    values[`${metric}:detail`] = row?.detail ?? null;
    rows.push({metric, value, detail: row?.detail ?? null});
  }
  // The Neon HTTP endpoint uses prepared statements: one INSERT, many value rows.
  const tuples = rows.map(r => `(${DAYS}, $tag$${r.metric}$tag$, ${r.value}, `
    + `${r.detail ? `$json$${JSON.stringify(r.detail)}$json$::jsonb` : 'null'})`).join(',\n');
  await q(`insert into chaos_metric (window_days, metric, value, detail) values\n${tuples}`);
  return values;
}

async function history(limit = 12) {
  // One row per metric per day: the latest capture wins, so ad-hoc runs don't spam the trend.
  return q(`select metric, value, window_days, captured_at::date as day
    from (select *, row_number() over (partition by metric, captured_at::date order by captured_at desc) as rn from chaos_metric) t
    where rn = 1 order by captured_at desc, metric limit ${limit}`);
}

async function previous() {
  const rows = await q(`select metric, value from chaos_metric
    where captured_at < (select max(captured_at) from chaos_metric) - interval '1 hour'
      and captured_at > now() - interval '30 days'
    order by captured_at desc limit ${Object.keys(METRICS).length}`);
  return Object.fromEntries(rows.map(r => [r.metric, Number(r.value)]));
}

function line(metric, value, prev, suffix = '') {
  const delta = prev === undefined ? '' : value === prev ? ' (=)' : value > prev ? ` (+${(value - prev).toFixed(value % 1 ? 1 : 0)})` : ` (−${(prev - value).toFixed(value % 1 ? 1 : 0)})`;
  return `${metric.padEnd(20)} ${String(value).padStart(6)}${delta}${suffix}`;
}

function report(values, prev) {
  const stamp = new Date().toLocaleDateString('en-AU', {timeZone: 'Australia/Sydney', day: '2-digit', month: 'short'});
  const out = [];
  out.push(`🎮 CHAOS CHESS — ${DAYS}-DAY SCORECARD (${stamp})`);
  out.push('');
  out.push(line('games', values.games, prev.games, `  rooms ${values['games:detail']?.rooms ?? 0} · rated ${values['games:detail']?.rated ?? 0}`));
  out.push(line('players', values.players, prev.players, `  new ${values.new_players}`));
  out.push(line('games_per_room', values.games_per_room, prev.games_per_room));
  out.push(line('cohort_return_pct', values.cohort_return_pct, prev.cohort_return_pct, `%  cohort ${values['cohort_return_pct:detail']?.cohort ?? 0}`));
  out.push(line('same_instance_games', values.same_instance_games, prev.same_instance_games, '  (in-call invite loop)'));
  out.push(line('launches', values.launches, prev.launches, `  players ${values['launches:detail']?.players ?? 0} · servers ${values['launches:detail']?.guilds ?? 0}`));
  out.push(line('queue_joins', values.queue_joins, prev.queue_joins));
  out.push(`timed / no-rush        ${values.timed_games} / ${values.no_rush_games}`);
  out.push('');
  const failed = [];
  for (const target of TARGETS) {
    const hit = target.test(values[target.metric]);
    if (!hit) failed.push(target);
    out.push(`${hit ? '✅' : '⛔'} ${target.label} — now ${values[target.metric]}`);
  }
  out.push('');
  out.push(failed.length
    ? `NEXT EXPERIMENT: ${failed[0].next}`
    : 'NEXT EXPERIMENT: all targets met — scale what is working: more servers, more clips, bigger events.');
  out.push(`(history: node scripts/chaos-growth-report.mjs --history)`);
  return out.join('\n');
}

if (historyOnly) {
  const rows = await history(60);
  const byMetric = {};
  for (const row of rows) (byMetric[row.metric] ??= []).push(`${row.day}:${Number(row.value)}`);
  for (const [metric, series] of Object.entries(byMetric)) console.log(`${metric.padEnd(20)} ${series.join('  ')}`);
  process.exit(0);
}

const values = await capture();
if (asJson) console.log(JSON.stringify(values, null, 1));
else console.log(report(values, await previous()));
