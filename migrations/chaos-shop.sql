-- Chaos Chess shop: cards bought with gold. Phase 2 of docs/chaos-cards-audit-and-shop.md.
--
-- Keyed by chaos_player.id so it works for Discord snowflakes and website uuids alike. The older
-- chaos_unlock table is keyed by a website user FK and cannot hold a Discord identity, so it stays
-- for website accounts and this one carries everything the shop sells.
--
-- Gold is only ever deducted by the buy route, which reads prices from lib/chaos-shop.ts and guards
-- the update with "gold >= price", so a double-click or a replayed request cannot overspend.

CREATE TABLE IF NOT EXISTS chaos_player_unlock (
  id text PRIMARY KEY,
  player_id text NOT NULL,
  modifier_id text NOT NULL,
  price_paid integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'shop',
  unlocked_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS chaos_player_unlock_pair
  ON chaos_player_unlock(player_id, modifier_id);

CREATE INDEX IF NOT EXISTS chaos_player_unlock_player
  ON chaos_player_unlock(player_id);
