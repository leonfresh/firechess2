/**
 * Chaos Chess rated-ladder audit.
 *
 * Answers: how much Chaos Chess has actually been played, and why zero games
 * have ever been rated on the verified ladder (chaos_match.rated / chaos_player).
 *
 *   node scripts/chaos-rated-audit.mjs
 *
 * Read-only. Uses DATABASE_URL_UNPOOLED from .env.local via Neon SQL-over-HTTP.
 * Rated eligibility is decided by the chaos_archive_result trigger; the gate list
 * here mirrors migrations/chaos-career.sql exactly.
 */
import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }),
);
const DB_URL = env.DATABASE_URL_UNPOOLED;
const host = new URL(DB_URL).hostname;

async function q(sql) {
  const res = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': DB_URL },
    body: JSON.stringify({ query: sql, params: [] }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}
const out = (label, r) => console.log(`\n### ${label}\n` + JSON.stringify(r.rows ?? r, null, 1));

// Mirrors the six trigger gates. "signed" = the seat id is not a guest_<uuid>.
const GATES = `
with g as (
 select r.*,
  coalesce((r."chaosState"->'_sync'->>'ratedQueue')::boolean,false) as in_queue,
  r."timeControlSeconds">0 as timed,
  r."hostId"<>coalesce(r."guestId",'') as distinct_ids,
  (r."chaosState"->'_sync'->>'draftProtocol')='2' as dp2,
  (select count(*) from jsonb_array_elements(coalesce(r."moveHistory",'[]'::jsonb)) m where m->>'color'='w')>0 as wmoved,
  (select count(*) from jsonb_array_elements(coalesce(r."moveHistory",'[]'::jsonb)) m where m->>'color'='b')>0 as bmoved,
  exists(select 1 from chaos_player p where p.id=r."hostId") as h_known,
  exists(select 1 from chaos_player p where p.id=r."guestId") as g_known,
  (r."chaosState"->'_sync'->'result'->>'winner') as winner
 from chaos_room r where r."guestId" is not null)`;

out('archived games (chaos_match)', await q(
  `select count(*)::int as games, count(*) filter (where rated)::int as rated, count(distinct room_id)::int as rooms,
          min(ended_at)::date as first, max(ended_at)::date as last from chaos_match`));

out('verified ladder (chaos_player)', await q(
  `select count(*)::int as registered, count(*) filter (where games>0)::int as played,
          coalesce(sum(games),0)::int as games_recorded from chaos_player`));

out('which trigger gate blocks each finished game', await q(`${GATES}
select case
  when not in_queue then '1. never entered the rated queue (friend room / AI)'
  when not timed then '2. no timed clock (No rush)'
  when not dp2 then '3. legacy draft protocol'
  when not wmoved or not bmoved then '4. one side never moved'
  when not h_known or not g_known then '5. a player has no chaos_player row (not signed in)'
  else 'ELIGIBLE' end as blocking_gate,
  count(*)::int as n
from g where winner in ('white','black','draw') group by 1 order by n desc`));

out('queue vs friend rooms — the "only missed the queue" count', await q(`${GATES}
select in_queue, count(*)::int as rooms,
  count(*) filter (where h_known and g_known)::int as both_signed,
  count(*) filter (where timed)::int as timed,
  count(*) filter (where wmoved and bmoved)::int as both_moved,
  count(*) filter (where h_known and g_known and timed and wmoved and bmoved and winner in ('white','black','draw'))::int as would_have_been_rated_if_queued
from g where dp2 group by 1 order by 1`));

out('queue pairings per day (last 14d)', await q(
  `select "updatedAt"::date as day, count(*)::int as pairings from chaos_room
   where ("chaosState"->'_sync'->>'ratedQueue')='true' and "updatedAt" > now() - interval '14 days'
   group by 1 order by 1 desc`));

out('legacy website ladder (chaos_rating)', await q(
  `select count(*)::int as players, sum("gamesPlayed")::int as games,
          count(*) filter (where "updatedAt" > now() - interval '7 days')::int as active_7d,
          max("updatedAt")::date as last_activity from chaos_rating`));
