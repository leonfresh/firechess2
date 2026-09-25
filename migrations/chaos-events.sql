-- Chaos Chess player journey events. Additive, safe to re-run.
--   node scripts/chaos-career-migrate.mjs migrations/chaos-events.sql
--
-- What happens between opening Chaos and finishing a game: lobby views, practice games, queue
-- starts, cancels and timeouts, AI-while-waiting, invites and matches found. Recorded by
-- /api/chaos/event from an allow-list, keyed by the Chaos identity (account, Discord or browser
-- guest id), and read only as aggregates on /admin/chaos.

CREATE TABLE IF NOT EXISTS chaos_event (
 id bigserial PRIMARY KEY,
 created_at timestamptz NOT NULL DEFAULT now(),
 player_id text NOT NULL,
 surface text NOT NULL,
 event text NOT NULL,
 detail jsonb
);
CREATE INDEX IF NOT EXISTS chaos_event_by_event ON chaos_event(event, created_at DESC);
CREATE INDEX IF NOT EXISTS chaos_event_by_player ON chaos_event(player_id, created_at DESC);
