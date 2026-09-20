-- Chaos Chess gold. Phase 1 of docs/chaos-cards-audit-and-shop.md: earning only, nothing spendable yet.
--
-- Gold is minted inside archive_chaos_match(), the trigger that already runs server-side on every
-- finished game, so the client can never invent currency and no new auth is needed (chaos_player
-- rows already exist for Discord snowflakes and website accounts).
--
-- Rules:
--   base 10 for finishing a game, +15 for a win, +5 when the clock was timed, +25 for the first
--   win of the day (Australia/Sydney). Any archived game pays, casual or rated, because No rush is
--   about 60% of played games. At most 8 paying games per pair per rolling 24 hours, so two friends
--   cannot farm each other. Only registered identities earn: guest_* seats have no chaos_player row.

ALTER TABLE chaos_player ADD COLUMN IF NOT EXISTS gold integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS chaos_gold_ledger (
 id text PRIMARY KEY,
 player_id text NOT NULL,
 match_id text,
 amount integer NOT NULL,
 reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chaos_gold_ledger_player ON chaos_gold_ledger(player_id, created_at DESC);

CREATE OR REPLACE FUNCTION archive_chaos_match() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
 result jsonb; match_id text; num integer; inserted integer;
 eligible boolean; hr integer; gr integer; delta integer; score numeric;
 capped integer;
 pair_paid integer; h_paid boolean; g_paid boolean; h_amount integer; g_amount integer;
 h_first boolean; g_first boolean; h_win boolean; g_win boolean;
BEGIN
 IF NEW.status NOT IN ('finished','resigned-white','resigned-black') OR OLD.status IN ('finished','resigned-white','resigned-black') OR NEW."guestId" IS NULL THEN RETURN NEW; END IF;
 result := NEW."chaosState"->'_sync'->'result';
 IF result IS NULL OR result->>'winner' NOT IN ('white','black','draw') THEN RETURN NEW; END IF;
 num := coalesce((NEW."chaosState"->'_sync'->>'gameNumber')::integer,0);
 match_id := NEW.id || ':' || num;
 INSERT INTO chaos_match(id,room_id,game_number,host_id,guest_id,host_color,winner,reason,record)
 VALUES(match_id,NEW.id,num,NEW."hostId",NEW."guestId",NEW."hostColor",result->>'winner',coalesce(result->>'reason','Game finished'),
 jsonb_build_object('frames',NEW."chaosState"->'_sync'->'replayFrames','fen',NEW.fen,'state',NEW."chaosState" - '_sync','moves',NEW."moveHistory",'timeControlSeconds',NEW."timeControlSeconds",'incrementSeconds',NEW."incrementSeconds"))
 ON CONFLICT(id) DO NOTHING;
 GET DIAGNOSTICS inserted = ROW_COUNT;
 IF inserted = 0 THEN RETURN NEW; END IF;

 -- ── Gold: every archived game pays, casual or rated ───────────────────────────
 pair_paid := (SELECT count(DISTINCT l.match_id) FROM chaos_gold_ledger l
   JOIN chaos_match m ON m.id = l.match_id
   WHERE l.reason = 'match' AND l.created_at > now() - interval '24 hours'
   AND ((m.host_id = NEW."hostId" AND m.guest_id = NEW."guestId")
     OR (m.host_id = NEW."guestId" AND m.guest_id = NEW."hostId")));
 IF pair_paid < 8 THEN
  h_paid := NEW."hostId" NOT LIKE 'guest\_%' AND EXISTS(SELECT 1 FROM chaos_player WHERE id = NEW."hostId");
  g_paid := NEW."guestId" NOT LIKE 'guest\_%' AND EXISTS(SELECT 1 FROM chaos_player WHERE id = NEW."guestId");
  h_win := result->>'winner' = NEW."hostColor";
  g_win := result->>'winner' <> 'draw' AND NOT h_win;
  h_first := h_paid AND h_win AND NOT EXISTS(SELECT 1 FROM chaos_gold_ledger
    WHERE player_id = NEW."hostId" AND reason = 'daily_win'
    AND (created_at AT TIME ZONE 'Australia/Sydney')::date = (now() AT TIME ZONE 'Australia/Sydney')::date);
  g_first := g_paid AND g_win AND NOT EXISTS(SELECT 1 FROM chaos_gold_ledger
    WHERE player_id = NEW."guestId" AND reason = 'daily_win'
    AND (created_at AT TIME ZONE 'Australia/Sydney')::date = (now() AT TIME ZONE 'Australia/Sydney')::date);
  IF h_paid THEN
   h_amount := 10 + (case when h_win then 15 else 0 end) + (case when NEW."timeControlSeconds" > 0 then 5 else 0 end);
   INSERT INTO chaos_gold_ledger(id,player_id,match_id,amount,reason) VALUES(match_id||':host',NEW."hostId",match_id,h_amount,'match');
   IF h_first THEN
    INSERT INTO chaos_gold_ledger(id,player_id,match_id,amount,reason) VALUES(match_id||':host:daily',NEW."hostId",match_id,25,'daily_win');
    h_amount := h_amount + 25;
   END IF;
   UPDATE chaos_player SET gold = gold + h_amount WHERE id = NEW."hostId";
  END IF;
  IF g_paid THEN
   g_amount := 10 + (case when g_win then 15 else 0 end) + (case when NEW."timeControlSeconds" > 0 then 5 else 0 end);
   INSERT INTO chaos_gold_ledger(id,player_id,match_id,amount,reason) VALUES(match_id||':guest',NEW."guestId",match_id,g_amount,'match');
   IF g_first THEN
    INSERT INTO chaos_gold_ledger(id,player_id,match_id,amount,reason) VALUES(match_id||':guest:daily',NEW."guestId",match_id,25,'daily_win');
    g_amount := g_amount + 25;
   END IF;
   UPDATE chaos_player SET gold = gold + g_amount WHERE id = NEW."guestId";
  END IF;
 END IF;

 -- ── Rated ladder (unchanged) ──────────────────────────────────────────────────
 eligible := NEW."timeControlSeconds">0
 AND NEW."hostId" <> NEW."guestId"
 AND NEW."chaosState"->'_sync'->>'draftProtocol'='2'
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW."moveHistory",'[]'::jsonb)) m WHERE m->>'color'='w')
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW."moveHistory",'[]'::jsonb)) m WHERE m->>'color'='b')
 AND EXISTS(SELECT 1 FROM chaos_player WHERE id=NEW."hostId")
 AND EXISTS(SELECT 1 FROM chaos_player WHERE id=NEW."guestId");
 IF NOT coalesce(eligible,false) THEN RETURN NEW; END IF;
 -- MAX_RATED_GAMES_PER_PAIR_PER_DAY = 3. Counted only over already-rated games, so hitting the
 -- cap leaves every later result in the same day as casual history instead of blocking the pair.
 capped := (SELECT count(*) FROM chaos_match WHERE rated=true AND ended_at > now() - interval '24 hours'
  AND ((host_id=NEW."hostId" AND guest_id=NEW."guestId") OR (host_id=NEW."guestId" AND guest_id=NEW."hostId")));
 IF capped >= 3 THEN RETURN NEW; END IF;
 -- Stable lock order serializes simultaneous results involving the same players.
 PERFORM id FROM chaos_player WHERE id IN (NEW."hostId",NEW."guestId") ORDER BY id FOR UPDATE;
 SELECT rating INTO hr FROM chaos_player WHERE id=NEW."hostId";
 SELECT rating INTO gr FROM chaos_player WHERE id=NEW."guestId";
 score := CASE WHEN result->>'winner'='draw' THEN 0.5 WHEN result->>'winner'=NEW."hostColor" THEN 1 ELSE 0 END;
 delta := round(32 * (score - 1/(1+power(10::numeric,(gr-hr)::numeric/400))));
 UPDATE chaos_player SET rating=rating+delta,peak=greatest(peak,rating+delta),games=games+1,
 wins=wins+(score=1)::integer,losses=losses+(score=0)::integer,draws=draws+(score=0.5)::integer WHERE id=NEW."hostId";
 UPDATE chaos_player SET rating=rating-delta,peak=greatest(peak,rating-delta),games=games+1,
 wins=wins+(score=0)::integer,losses=losses+(score=1)::integer,draws=draws+(score=0.5)::integer WHERE id=NEW."guestId";
 UPDATE chaos_match SET rated=true,host_before=hr,guest_before=gr,host_delta=delta,guest_delta=-delta WHERE id=match_id;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS chaos_archive_result ON chaos_room;
CREATE TRIGGER chaos_archive_result AFTER UPDATE ON chaos_room FOR EACH ROW EXECUTE FUNCTION archive_chaos_match();
