DO $$
DECLARE h text := 'career-test-'||gen_random_uuid(); g text := 'career-test-'||gen_random_uuid(); r text:=gen_random_uuid()::text; c text:=gen_random_uuid()::text; v integer;
BEGIN
 INSERT INTO chaos_player(id,name) VALUES(h,'Test host'),(g,'Test guest');
 INSERT INTO chaos_room(id,"roomCode","hostId","guestId",status,"isMatchmaking","timeControlSeconds","moveHistory","chaosState")
 VALUES(r,c,h,g,'playing',true,300,'[{"from":"e2","to":"e4","color":"w"},{"from":"e7","to":"e5","color":"b"}]','{"_sync":{"draftProtocol":2,"ratedQueue":true}}');
 UPDATE chaos_room SET status='finished',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":true,"result":{"winner":"white","reason":"Checkmate"}}}' WHERE id=r;
 SELECT rating INTO v FROM chaos_player WHERE id=h; IF v<>1216 THEN RAISE EXCEPTION 'Wrong winner rating: %',v; END IF;
 SELECT rating INTO v FROM chaos_player WHERE id=g; IF v<>1184 THEN RAISE EXCEPTION 'Wrong loser rating'; END IF;
 UPDATE chaos_room SET status='finished' WHERE id=r;
 SELECT games INTO v FROM chaos_player WHERE id=h; IF v<>1 THEN RAISE EXCEPTION 'Duplicate result counted'; END IF;
 UPDATE chaos_room SET status='playing',"hostColor"='black',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":true,"gameNumber":1}}' WHERE id=r;
 UPDATE chaos_room SET status='resigned-black',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":true,"gameNumber":1,"result":{"winner":"white","reason":"Resignation"}}}' WHERE id=r;
 SELECT count(*) INTO v FROM chaos_match WHERE room_id=r; IF v<>2 THEN RAISE EXCEPTION 'Rematch history overwritten'; END IF;
 SELECT rating INTO v FROM chaos_player WHERE id=h; IF v>=1216 THEN RAISE EXCEPTION 'Rematch color swap scored wrong'; END IF;
 UPDATE chaos_room SET status='playing',"isMatchmaking"=false,"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":false,"gameNumber":2}}' WHERE id=r;
 UPDATE chaos_room SET status='finished',"chaosState"='{"_sync":{"draftProtocol":2,"ratedQueue":false,"gameNumber":2,"result":{"winner":"draw","reason":"Draw agreed"}}}' WHERE id=r;
 SELECT games INTO v FROM chaos_player WHERE id=h; IF v<>2 THEN RAISE EXCEPTION 'Friend room was rated'; END IF;
 SELECT count(*) INTO v FROM chaos_match WHERE room_id=r; IF v<>3 THEN RAISE EXCEPTION 'Casual game missing'; END IF;
 DELETE FROM chaos_room WHERE id=r;
 SELECT count(*) INTO v FROM chaos_match WHERE room_id=r; IF v<>3 THEN RAISE EXCEPTION 'Deleting room removed history'; END IF;
 DELETE FROM chaos_match WHERE room_id=r;
 DELETE FROM chaos_player WHERE id IN(h,g);
END $$;
