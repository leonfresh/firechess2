/**
 * Chaos Chess admin metrics, read-only. Shared by /api/admin/chaos (the /admin/chaos dashboard) and
 * scripts/chaos-report.mjs (the same numbers in a terminal), so the two can never disagree.
 *
 * Deliberately import-free: callers pass a query runner, and the script transpiles this file on the
 * fly. `days` is clamped to an integer before it is inlined, so no caller input reaches the SQL text.
 *
 * Days are Australia/Sydney calendar days, the boundary gold, daily wins and streaks already use.
 * Sources: chaos_match (finished games, written by the archive trigger), chaos_room (every room,
 * including ones nobody joined), chaos_launch (Discord Activity launches), chaos_gold_ledger.
 */

export type QueryRunner = (text: string) => Promise<Record<string, unknown>[]>;

export type ChaosAdminStats = Awaited<ReturnType<typeof loadChaosAdminStats>>;

const TZ = "'Australia/Sydney'";
const DECIDED = "('finished','resigned-white','resigned-black')";

export function clampDays(value: unknown): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 120) : 30;
}

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

export async function loadChaosAdminStats(query: QueryRunner, rawDays: unknown = 30) {
  const days = clampDays(rawDays);
  const since = `now() - interval '${days} days'`;
  // Every seat of every archived game, with its Sydney day. Guest seats count as players here.
  const seats = `(SELECT host_id AS pid, ended_at, (ended_at AT TIME ZONE ${TZ})::date AS d FROM chaos_match
    UNION ALL SELECT guest_id, ended_at, (ended_at AT TIME ZONE ${TZ})::date FROM chaos_match)`;

  const [summary, daily, launchesDaily, funnel, launches, buckets, cohorts, streaks, endings, economy, purchases, powers, anomalies] =
    await Promise.all([
      query(`WITH g AS (SELECT * FROM chaos_match WHERE ended_at > ${since}),
        pl AS (SELECT host_id pid FROM g UNION ALL SELECT guest_id FROM g),
        firsts AS (SELECT pid, min(ended_at) f FROM ${seats} s GROUP BY pid)
        SELECT (SELECT count(*) FROM g)::int games,
          (SELECT count(DISTINCT pid) FROM pl)::int players,
          (SELECT count(DISTINCT pid) FROM pl WHERE pid NOT LIKE 'guest\\_%')::int signed_in_players,
          (SELECT count(*) FROM firsts WHERE f > ${since})::int new_players,
          (SELECT count(*) FROM g WHERE rated)::int rated,
          (SELECT count(*) FROM g WHERE game_number > 0)::int rematches,
          (SELECT count(*) FROM g WHERE reason ~* 'time')::int timeouts,
          (SELECT count(*) FROM g WHERE host_id ~ '^discord_' AND guest_id ~ '^discord_')::int discord_games,
          (SELECT count(*) FROM g WHERE (host_id ~ '^discord_') <> (guest_id ~ '^discord_'))::int mixed_games,
          (SELECT round(avg(jsonb_array_length(coalesce(record->'moves','[]'::jsonb))), 1) FROM g) avg_moves`),
      query(`WITH s AS ${seats}, fst AS (SELECT pid, min(d) fd FROM s GROUP BY pid),
        g AS (SELECT (ended_at AT TIME ZONE ${TZ})::date d, count(*) games FROM chaos_match WHERE ended_at > ${since} GROUP BY 1)
        SELECT g.d::text AS day, g.games::int,
          (SELECT count(DISTINCT pid) FROM s WHERE s.d = g.d)::int active,
          (SELECT count(*) FROM fst WHERE fd = g.d)::int new_players
        FROM g ORDER BY g.d`),
      query(`SELECT (created_at AT TIME ZONE ${TZ})::date::text AS day, count(*)::int launches
        FROM chaos_launch WHERE created_at > ${since} GROUP BY 1`),
      query(`WITH r AS (SELECT * FROM chaos_room WHERE "createdAt" > ${since}),
        hosts AS (SELECT "hostId" h, bool_or("guestId" IS NOT NULL) matched FROM r GROUP BY 1)
        SELECT count(*)::int created,
          count(*) FILTER (WHERE "guestId" IS NOT NULL)::int joined,
          count(*) FILTER (WHERE "guestId" IS NOT NULL AND jsonb_array_length(coalesce("moveHistory",'[]'::jsonb)) > 0)::int moved,
          count(*) FILTER (WHERE "guestId" IS NOT NULL AND status IN ${DECIDED})::int decided,
          count(*) FILTER (WHERE "guestId" IS NULL)::int never_joined,
          count(*) FILTER (WHERE status = 'aborted')::int aborted,
          (SELECT count(*) FROM hosts)::int hosts,
          (SELECT count(*) FROM hosts WHERE NOT matched
            AND NOT EXISTS (SELECT 1 FROM chaos_match m WHERE (m.host_id = h OR m.guest_id = h) AND m.ended_at > ${since}))::int hosts_never_played
        FROM r`),
      query(`SELECT count(*)::int launches, count(DISTINCT player_id)::int players, count(DISTINCT guild_id)::int guilds,
          count(DISTINCT player_id) FILTER (WHERE EXISTS (SELECT 1 FROM chaos_match m
            WHERE (m.host_id = l.player_id OR m.guest_id = l.player_id) AND m.ended_at >= l.created_at))::int launchers_who_played
        FROM chaos_launch l WHERE created_at > ${since}`),
      query(`WITH c AS (SELECT pid, count(*) n FROM ${seats} s WHERE ended_at > ${since} GROUP BY pid)
        SELECT CASE WHEN n = 1 THEN '1' WHEN n <= 3 THEN '2-3' WHEN n <= 10 THEN '4-10' ELSE '11+' END AS bucket,
          count(*)::int players, sum(n)::int games FROM c GROUP BY 1 ORDER BY min(n)`),
      query(`WITH s AS ${seats}, f AS (SELECT pid, min(d) fd, count(DISTINCT d) days FROM s GROUP BY pid)
        SELECT date_trunc('week', fd)::date::text AS cohort, count(*)::int players,
          count(*) FILTER (WHERE days >= 2)::int returned,
          count(*) FILTER (WHERE EXISTS (SELECT 1 FROM s WHERE s.pid = f.pid AND s.d BETWEEN f.fd + 1 AND f.fd + 7))::int returned_7d,
          ((now() AT TIME ZONE ${TZ})::date - max(fd))::int age_days
        FROM f WHERE fd > (now() AT TIME ZONE ${TZ})::date - ${days} GROUP BY 1 ORDER BY 1`),
      query(`WITH d AS (SELECT DISTINCT player_id, (created_at AT TIME ZONE ${TZ})::date d FROM chaos_gold_ledger WHERE reason = 'match'),
        isl AS (SELECT player_id, d, d - (row_number() OVER (PARTITION BY player_id ORDER BY d))::int grp FROM d),
        runs AS (SELECT player_id, max(d) e, count(*) len FROM isl GROUP BY player_id, grp),
        t AS (SELECT (now() AT TIME ZONE ${TZ})::date t)
        SELECT count(*) FILTER (WHERE e >= t - 1)::int live,
          count(*) FILTER (WHERE e >= t - 1 AND len >= 2)::int live_2,
          count(*) FILTER (WHERE e >= t - 1 AND len >= 3)::int live_3,
          count(*) FILTER (WHERE e >= t - 1 AND len >= 7)::int live_7,
          coalesce(max(len), 0)::int best_ever,
          (SELECT coalesce(sum(amount), 0) FROM chaos_gold_ledger WHERE reason = 'streak' AND created_at > ${since})::int streak_gold
        FROM runs, t`),
      query(`SELECT reason, count(*)::int games FROM chaos_match WHERE ended_at > ${since} GROUP BY 1 ORDER BY 2 DESC`),
      query(`SELECT reason, count(*)::int entries, sum(amount)::int gold FROM chaos_gold_ledger WHERE created_at > ${since} GROUP BY 1 ORDER BY 3 DESC`),
      query(`SELECT modifier_id AS item, count(*)::int bought, sum(price_paid)::int gold FROM chaos_player_unlock
        WHERE source = 'shop' AND unlocked_at > ${since} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 15`),
      // One row per (game, side, power): stacking the same power twice still counts once.
      query(`WITH g AS (SELECT id, winner, record->'state' st FROM chaos_match WHERE ended_at > ${since}),
        s AS (SELECT DISTINCT g.id, 'white' side, g.winner, m->>'id' pid, m->>'name' pname FROM g, jsonb_array_elements(coalesce(st->'playerModifiers','[]'::jsonb)) m
          UNION SELECT DISTINCT g.id, 'black', g.winner, m->>'id', m->>'name' FROM g, jsonb_array_elements(coalesce(st->'aiModifiers','[]'::jsonb)) m)
        SELECT pid AS id, max(pname) AS name, count(*)::int games, count(*) FILTER (WHERE winner = side)::int wins,
          count(*) FILTER (WHERE winner = 'draw')::int draws FROM s WHERE pid IS NOT NULL GROUP BY 1 ORDER BY 3 DESC, 1`),
      query(`WITH g AS (SELECT winner, record->'state' st FROM chaos_match WHERE ended_at > ${since}),
        s AS (SELECT 'white' side, winner, st->>'playerAnomaly' a FROM g UNION ALL SELECT 'black', winner, st->>'aiAnomaly' FROM g)
        SELECT a AS id, count(*)::int games, count(*) FILTER (WHERE winner = side)::int wins,
          count(*) FILTER (WHERE winner = 'draw')::int draws FROM s WHERE a IS NOT NULL GROUP BY 1 ORDER BY 2 DESC, 1`),
    ]);

  const launchByDay = new Map(launchesDaily.map((r) => [String(r.day), num(r.launches)]));
  const score = (r: Record<string, unknown>) => {
    const games = num(r.games);
    return games ? (num(r.wins) + num(r.draws) / 2) / games : 0;
  };
  const s = summary[0] ?? {};

  return {
    days,
    generatedAt: new Date().toISOString(),
    summary: {
      games: num(s.games), players: num(s.players), signedInPlayers: num(s.signed_in_players),
      newPlayers: num(s.new_players), rated: num(s.rated), rematches: num(s.rematches),
      timeouts: num(s.timeouts), discordGames: num(s.discord_games), mixedGames: num(s.mixed_games),
      avgMoves: num(s.avg_moves),
    },
    daily: daily.map((r) => ({
      day: String(r.day), games: num(r.games), active: num(r.active), newPlayers: num(r.new_players),
      launches: launchByDay.get(String(r.day)) ?? 0,
    })),
    funnel: {
      created: num(funnel[0]?.created), joined: num(funnel[0]?.joined), moved: num(funnel[0]?.moved),
      decided: num(funnel[0]?.decided), neverJoined: num(funnel[0]?.never_joined), aborted: num(funnel[0]?.aborted),
      hosts: num(funnel[0]?.hosts), hostsNeverPlayed: num(funnel[0]?.hosts_never_played),
    },
    launches: {
      launches: num(launches[0]?.launches), players: num(launches[0]?.players), guilds: num(launches[0]?.guilds),
      launchersWhoPlayed: num(launches[0]?.launchers_who_played),
    },
    retention: {
      buckets: buckets.map((r) => ({ bucket: String(r.bucket), players: num(r.players), games: num(r.games) })),
      cohorts: cohorts.map((r) => ({
        cohort: String(r.cohort), players: num(r.players), returned: num(r.returned),
        returned7d: num(r.returned_7d), ageDays: num(r.age_days),
      })),
    },
    streaks: {
      live: num(streaks[0]?.live), live2: num(streaks[0]?.live_2), live3: num(streaks[0]?.live_3),
      live7: num(streaks[0]?.live_7), bestEver: num(streaks[0]?.best_ever), streakGold: num(streaks[0]?.streak_gold),
    },
    endings: endings.map((r) => ({ reason: String(r.reason), games: num(r.games) })),
    economy: {
      ledger: economy.map((r) => ({ reason: String(r.reason), entries: num(r.entries), gold: num(r.gold) })),
      purchases: purchases.map((r) => ({ item: String(r.item), bought: num(r.bought), gold: num(r.gold) })),
    },
    balance: {
      powers: powers.map((r) => ({ id: String(r.id), name: String(r.name ?? r.id), games: num(r.games), wins: num(r.wins), draws: num(r.draws), score: score(r) })),
      anomalies: anomalies.map((r) => ({ id: String(r.id), games: num(r.games), wins: num(r.wins), draws: num(r.draws), score: score(r) })),
    },
  };
}
