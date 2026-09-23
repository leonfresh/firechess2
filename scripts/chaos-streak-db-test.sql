-- Chaos Chess streak test. Runs inside a transaction that scripts/chaos-streak-db-test.mjs rolls back.
-- Earlier days are faked with backdated 'match' ledger rows at noon Sydney time.
DO $$
DECLARE
 a text := 'streak-test-'||gen_random_uuid(); b text := 'streak-test-'||gen_random_uuid(); c text := 'streak-test-'||gen_random_uuid();
 r1 text := gen_random_uuid()::text; r2 text := gen_random_uuid()::text;
 seat text := 'guest_'||gen_random_uuid();
 today date := (now() AT TIME ZONE 'Australia/Sydney')::date;
 v integer; n integer;
BEGIN
 INSERT INTO chaos_player(id,name) VALUES(a,'Streak A'),(b,'Streak B'),(c,'Streak C');
 -- a: played the last two days. b: played two days ago only (the run is broken). c: nine days running.
 INSERT INTO chaos_gold_ledger(id,player_id,match_id,amount,reason,created_at)
 SELECT 'streakfix-'||p||'-'||k, p, 'streakfix-'||p||'-'||k, 10, 'match', ((today-k)::timestamp + interval '12 hours') AT TIME ZONE 'Australia/Sydney'
 FROM (VALUES(a,1),(a,2),(b,2)) f(p,k)
 UNION ALL
 SELECT 'streakfix-'||c||'-'||k, c, 'streakfix-'||c||'-'||k, 10, 'match', ((today-k)::timestamp + interval '12 hours') AT TIME ZONE 'Australia/Sydney'
 FROM generate_series(1,9) k;

 -- 1. Timed game, a (White) wins on day 3: 10 + 15 + 5 + 25 daily win + 20 streak. b restarts at day 1: no bonus.
 INSERT INTO chaos_room(id,"roomCode","hostId","guestId",status,"isMatchmaking","timeControlSeconds","moveHistory","chaosState")
 VALUES(r1,left(r1,6),a,b,'playing',false,300,'[{"from":"e2","to":"e4","color":"w"},{"from":"e7","to":"e5","color":"b"}]','{"_sync":{"draftProtocol":2}}');
 UPDATE chaos_room SET status='finished',"chaosState"='{"_sync":{"draftProtocol":2,"result":{"winner":"white","reason":"Checkmate"}}}' WHERE id=r1;
 SELECT gold INTO v FROM chaos_player WHERE id=a; IF v<>75 THEN RAISE EXCEPTION 'day-3 streak gold: % (want 75)',v; END IF;
 SELECT amount INTO v FROM chaos_gold_ledger WHERE player_id=a AND reason='streak'; IF v<>20 THEN RAISE EXCEPTION 'day-3 streak bonus: % (want 20)',v; END IF;
 SELECT gold INTO v FROM chaos_player WHERE id=b; IF v<>15 THEN RAISE EXCEPTION 'broken-streak gold: % (want 15)',v; END IF;
 SELECT count(*) INTO n FROM chaos_gold_ledger WHERE player_id=b AND reason='streak'; IF n<>0 THEN RAISE EXCEPTION 'a broken streak paid a bonus'; END IF;
 IF chaos_streak_length(a)<>3 OR chaos_streak_length(b)<>1 THEN RAISE EXCEPTION 'streak lengths: %/% (want 3/1)',chaos_streak_length(a),chaos_streak_length(b); END IF;

 -- 2. A rematch on the same day pays no second streak bonus.
 UPDATE chaos_room SET status='playing',"chaosState"='{"_sync":{"draftProtocol":2,"gameNumber":1}}' WHERE id=r1;
 UPDATE chaos_room SET status='finished',"chaosState"='{"_sync":{"draftProtocol":2,"gameNumber":1,"result":{"winner":"white","reason":"Checkmate"}}}' WHERE id=r1;
 SELECT count(*) INTO n FROM chaos_gold_ledger WHERE player_id=a AND reason='streak'; IF n<>1 THEN RAISE EXCEPTION 'streak rows after rematch: % (want 1)',n; END IF;
 SELECT gold INTO v FROM chaos_player WHERE id=a; IF v<>105 THEN RAISE EXCEPTION 'rematch gold: % (want 105)',v; END IF;

 -- 3. Day 10 is capped at +50, and a signed-out opponent seat earns and streaks nothing.
 INSERT INTO chaos_room(id,"roomCode","hostId","guestId",status,"isMatchmaking","timeControlSeconds","moveHistory","chaosState")
 VALUES(r2,left(r2,6),c,seat,'playing',false,0,'[]','{"_sync":{"draftProtocol":2}}');
 UPDATE chaos_room SET status='finished',"chaosState"='{"_sync":{"draftProtocol":2,"result":{"winner":"white","reason":"Checkmate"}}}' WHERE id=r2;
 SELECT amount INTO v FROM chaos_gold_ledger WHERE player_id=c AND reason='streak'; IF v<>50 THEN RAISE EXCEPTION 'day-10 streak bonus: % (want 50)',v; END IF;
 SELECT gold INTO v FROM chaos_player WHERE id=c; IF v<>100 THEN RAISE EXCEPTION 'day-10 gold: % (want 100)',v; END IF;
 SELECT count(*) INTO n FROM chaos_gold_ledger WHERE player_id=seat; IF n<>0 THEN RAISE EXCEPTION 'a guest seat minted gold'; END IF;
END $$;
