-- Where players launch the Discord Activity from. One row per handshake, unique per player and
-- activity instance so a reload inside the same instance does not double-count. Website play
-- writes nothing here.
CREATE TABLE IF NOT EXISTS chaos_launch (
 id text PRIMARY KEY,
 player_id text NOT NULL,
 guild_id text,
 channel_id text,
 instance_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS chaos_launch_player_instance ON chaos_launch(player_id, instance_id);
CREATE INDEX IF NOT EXISTS chaos_launch_recent ON chaos_launch(created_at DESC);
CREATE INDEX IF NOT EXISTS chaos_launch_guild ON chaos_launch(guild_id, created_at DESC);
