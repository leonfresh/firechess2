/**
 * Chaos Chess rated-ladder audit.
 *
 * Answers: how much Chaos Chess has actually been played, how many finished games are rated,
 * and which rule blocks the rest. Mirrors the eligibility gates in the live
 * chaos_archive_match() trigger (migrations/chaos-career.sql).
 *
 *   node scripts/chaos-rated-audit.mjs
 *
 * Read-only. Uses DATABASE_URL_UNPOOLED from .env.local via Neon SQL-over-HTTP.
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

// Mirrors the trigger gates. "registered" = the seat has a chaos_player row (signed in).
const GATES = `
with g as (
 select r.*,
  r."timeControlSeconds">0 as timed,
  (r."chaosState"->'_sync'->>'draftProtocol')='2' as dp2,
  (select count(*) from jsonb_array_elements(coalesce(r."moveHistory",'[]'::jsonb)) m where m->>'color'='w')>0 as wmoved,
  (select count(*) from jsonb_array_elements(coalesce(r."moveHistory",'[]'::jsonb)) m where m->>'color'='b')>0 as bmoved,
  exists(select 1 from chaos_player p where p.id=r."hostId") as h_known,
  exists(select 1 from chaos_player p where p.id=r."guestId") as g_known,
  (r."chaosState"->'_sync'->>'ratedQueue')='true' as in_queue,
  (r."chaosState"->'_sync'->'result'->>'winner') as winner
 from chaos_room r where r."guestId" is not null)`;

out('archived games (chaos_match)', await q(
  `select count(*)::int as games, count(*) filter (where rated)::int as rated, count(distinct room_id)::int as rooms,
          min(ended_at)::date as first, max(ended_at)::date as last from chaos_match`));
out('ratings by day (chaos_match.rated, last 14d)', await q(
  `select ended_at::date as day, count(*)::int as games, count(*) filter (where rated)::int as rated
   from chaos_match where ended_at > now() - interval '14 days' group by 1 order by 1 desc`));
out('verified ladder (chaos_player)', await q(
  `select count(*)::int as registered, count(*) filter (where games>0)::int as played,
          coalesce(sum(games),0)::int as games_recorded from chaos_player`));

out('which rule blocks each finished game', await q(`${GATES}
select case
  when not timed then '1. no timed clock (No rush)'
  when not dp2 then '2. legacy draft protocol'
  when not wmoved or not bmoved then '3. one side never moved'
  when not h_known or not g_known then '4. a player has no chaos_player row (not signed in)'
  else '5. eligible (unless the pair already played 3 rated games that day)' end as blocking_rule,
  count(*)::int as n
from g where winner in ('white','black','draw') group by 1 order by n desc`));

out('eligible history — what the new rule would have rated', await q(`${GATES}
select count(*) filter (where timed and dp2 and wmoved and bmoved and h_known and g_known)::int as eligible_all_time,
       count(*) filter (where timed and dp2 and wmoved and bmoved and h_known and g_known and in_queue)::int as of_those_queued,
       count(*) filter (where in_queue)::int as ever_queued,
       count(*)::int as finished_games
from g where winner in ('white','black','draw')`));
out('pair concentration (a pair can only rate 3 games per day)', await q(
  `select games_between_pair, count(*)::int as pairs from (
     select least(host_id,guest_id)||'|'||greatest(host_id,guest_id) as pair, count(*)::int as games_between_pair
     from chaos_match where ended_at > now() - interval '24 hours' group by 1) t
   group by 1 order by 1 limit 10`));

out('legacy website ladder (chaos_rating, self-reported)', await q(
  `select count(*)::int as players, sum("gamesPlayed")::int as games,
          count(*) filter (where "updatedAt" > now() - interval '7 days')::int as active_7d,
          max("updatedAt")::date as last_activity from chaos_rating`));
