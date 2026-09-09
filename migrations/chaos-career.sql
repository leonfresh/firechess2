-- New Activity ladder is separate from the legacy client-reported website ladder.
CREATE TABLE IF NOT EXISTS chaos_player (
 id text PRIMARY KEY, name text NOT NULL,
 rating integer NOT NULL DEFAULT 1200, games integer NOT NULL DEFAULT 0,
 wins integer NOT NULL DEFAULT 0, losses integer NOT NULL DEFAULT 0, draws integer NOT NULL DEFAULT 0,
 peak integer NOT NULL DEFAULT 1200
);
CREATE TABLE IF NOT EXISTS chaos_match (
 id text PRIMARY KEY, room_id text NOT NULL, game_number integer NOT NULL,
 host_id text NOT NULL, guest_id text NOT NULL, host_color text NOT NULL,
 winner text NOT NULL, reason text NOT NULL, rated boolean NOT NULL DEFAULT false,
 host_before integer, guest_before integer, host_delta integer, guest_delta integer,
 ended_at timestamptz NOT NULL DEFAULT now(), record jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS chaos_match_host ON chaos_match(host_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS chaos_match_guest ON chaos_match(guest_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS chaos_match_public_recent ON chaos_match(ended_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS chaos_room_live_recent ON chaos_room("updatedAt" DESC,id DESC) WHERE status='playing' AND "guestId" IS NOT NULL;
CREATE OR REPLACE FUNCTION archive_chaos_match() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
 result jsonb; match_id text; num integer; inserted integer;
 eligible boolean; hr integer; gr integer; delta integer; score numeric;
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
 eligible := coalesce((NEW."chaosState"->'_sync'->>'ratedQueue')::boolean,false) AND NEW."timeControlSeconds">0
 AND NEW."hostId" <> NEW."guestId"
 AND NEW."chaosState"->'_sync'->>'draftProtocol'='2'
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW."moveHistory",'[]'::jsonb)) m WHERE m->>'color'='w')
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW."moveHistory",'[]'::jsonb)) m WHERE m->>'color'='b')
 AND EXISTS(SELECT 1 FROM chaos_player WHERE id=NEW."hostId")
 AND EXISTS(SELECT 1 FROM chaos_player WHERE id=NEW."guestId");
 IF NOT coalesce(eligible,false) THEN RETURN NEW; END IF;
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
