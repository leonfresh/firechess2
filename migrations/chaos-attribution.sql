-- Chaos Chess player sources. Additive only, safe to re-run.
--   node scripts/chaos-career-migrate.mjs migrations/chaos-attribution.sql
--
-- chaos_launch gains the Discord share-link context: referrer_id (the Discord user who shared the
-- link), custom_id (our tag, e.g. join:ABC234 from the lobby invite button) and location_id.
-- chaos_first_touch keeps where each player identity (website account, Discord or browser guest)
-- first arrived from: referring host, utm tags and ?ref=. One row per identity, first touch wins.
-- Code that writes these tolerates the migration not having run yet.

ALTER TABLE chaos_launch ADD COLUMN IF NOT EXISTS referrer_id text;
ALTER TABLE chaos_launch ADD COLUMN IF NOT EXISTS custom_id text;
ALTER TABLE chaos_launch ADD COLUMN IF NOT EXISTS location_id text;

CREATE TABLE IF NOT EXISTS chaos_first_touch (
 player_id text PRIMARY KEY,
 created_at timestamptz NOT NULL DEFAULT now(),
 surface text NOT NULL,
 referrer_host text,
 utm_source text,
 utm_medium text,
 utm_campaign text,
 ref text,
 landing text
);
