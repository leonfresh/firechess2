-- Chaos Chess gold earning test. Runs the real trigger against the real schema, then cleans up.
--   node scripts/chaos-gold-db-test.mjs
-- Fixtures are prefixed gold-test-/guest_/goldcap- and removed at the end.
DO $$
DECLARE
 h text := 'gold-test-'||gen_random_uuid(); g text := 'gold-test-'||gen_random_uuid();
 r text := gen_random_uuid()::text; c text := gen_random_uuid()::text;
 seat text := 'guest_'||gen_random_uuid();
 v integer; n integer;
BEGIN
 INSERT INTO chaos_player(id,name) VALUES(h,'Gold host'),(g,'Gold guest');

 -- 1. Timed game, host (White) wins: 10 base + 15 win + 5 timed + 25 first win of the day.
 INSERT INTO chaos_room(id,"roomCode","hostId","guestId",status,"isMatchmaking","timeControlSeconds","moveHistory","chaosState")
 VALUES(r,c,h,g,'playing',true,300,'[{"from":"e2","to":"e4","color":"w"},{"from":"e7","to":"e5","color":"b"}]','{"_sync":{"draftProtocol":2,"ratedQueue":true}}');
 UPDATE chaos_room SET status='finished',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":true,"result":{"winner":"white","reason":"Checkmate"}}}' WHERE id=r;
 SELECT gold INTO v FROM chaos_player WHERE id=h; IF v<>55 THEN RAISE EXCEPTION 'host first game gold: % (want 55)',v; END IF;
 SELECT gold INTO v FROM chaos_player WHERE id=g; IF v<>15 THEN RAISE EXCEPTION 'guest first game gold: % (want 15)',v; END IF;
 SELECT count(*) INTO n FROM chaos_gold_ledger WHERE player_id=h; IF n<>2 THEN RAISE EXCEPTION 'host ledger rows: % (want match + daily_win)',n; END IF;
 SELECT count(*) INTO n FROM chaos_gold_ledger WHERE player_id=g AND reason='daily_win'; IF n<>0 THEN RAISE EXCEPTION 'the loser was paid a daily win bonus'; END IF;

 -- 2. Rematch (guest wins): 10 + 15 + 5 each, plus the guest's first win of the day (+25). No second
 --    daily bonus for the host, and no timed bonus when there is no clock.
 UPDATE chaos_room SET status='playing',"hostColor"='black',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":true,"gameNumber":1}}' WHERE id=r;
 UPDATE chaos_room SET status='resigned-black',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":true,"gameNumber":1,"result":{"winner":"white","reason":"Resignation"}}}' WHERE id=r;
 SELECT gold INTO v FROM chaos_player WHERE id=h; IF v<>70 THEN RAISE EXCEPTION 'host after loss: % (want 70)',v; END IF;
 SELECT gold INTO v FROM chaos_player WHERE id=g; IF v<>70 THEN RAISE EXCEPTION 'guest after win: % (want 70)',v; END IF;
 SELECT count(*) INTO n FROM chaos_gold_ledger WHERE player_id=g AND reason='daily_win'; IF n<>1 THEN RAISE EXCEPTION 'guest daily win rows: % (want 1)',n; END IF;
 SELECT count(*) INTO n FROM chaos_gold_ledger WHERE player_id=h AND reason='daily_win'; IF n<>1 THEN RAISE EXCEPTION 'host daily win rows: % (want 1)',n; END IF;

 -- 3. No rush game (no clock): base + win only.
 UPDATE chaos_room SET status='playing',"timeControlSeconds"=0,"hostColor"='white',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":false,"gameNumber":2}}' WHERE id=r;
 UPDATE chaos_room SET status='finished',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":false,"gameNumber":2,"result":{"winner":"white","reason":"Checkmate"}}}' WHERE id=r;
 SELECT gold INTO v FROM chaos_player WHERE id=h; IF v<>95 THEN RAISE EXCEPTION 'no-rush host gold: % (want 95)',v; END IF;
 SELECT gold INTO v FROM chaos_player WHERE id=g; IF v<>80 THEN RAISE EXCEPTION 'no-rush guest gold: % (want 80)',v; END IF;

 -- 4. A signed-out seat earns nothing, and the registered opponent still gets paid.
 UPDATE chaos_room SET status='playing',"guestId"=seat,"timeControlSeconds"=300,"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":false,"gameNumber":3}}' WHERE id=r;
 UPDATE chaos_room SET status='finished',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":false,"gameNumber":3,"result":{"winner":"white","reason":"Checkmate"}}}' WHERE id=r;
 SELECT gold INTO v FROM chaos_player WHERE id=h; IF v<>125 THEN RAISE EXCEPTION 'host gold after guest seat: % (want 125)',v; END IF;
 SELECT count(*) INTO n FROM chaos_gold_ledger WHERE player_id=seat; IF n<>0 THEN RAISE EXCEPTION 'a guest seat minted gold'; END IF;

 -- 5. Anti-farm: eight paid games in the window stop further payouts for that pair.
 INSERT INTO chaos_match(id,room_id,game_number,host_id,guest_id,host_color,winner,reason,record)
 SELECT 'goldcap-'||x, r, 100+x, h, g, 'white', 'white', 'Checkmate', '{}'::jsonb FROM generate_series(1,8) x;
 INSERT INTO chaos_gold_ledger(id,player_id,match_id,amount,reason)
 SELECT 'goldcap-'||x||':host', h, 'goldcap-'||x, 10, 'match' FROM generate_series(1,8) x;
 UPDATE chaos_room SET status='playing',"guestId"=g,"timeControlSeconds"=300,"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":false,"gameNumber":4}}' WHERE id=r;
 UPDATE chaos_room SET status='finished',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":false,"gameNumber":4,"result":{"winner":"white","reason":"Checkmate"}}}' WHERE id=r;
 SELECT gold INTO v FROM chaos_player WHERE id=h; IF v<>125 THEN RAISE EXCEPTION 'pair cap did not stop the payout: % (want 125)',v; END IF;

 DELETE FROM chaos_gold_ledger WHERE player_id IN (h,g,seat) OR match_id LIKE 'goldcap-%';
 DELETE FROM chaos_match WHERE room_id=r;
 DELETE FROM chaos_room WHERE id=r;
 DELETE FROM chaos_player WHERE id IN (h,g);
END $$;
