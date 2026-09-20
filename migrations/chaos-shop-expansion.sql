-- Preserve explicit legacy unlocks; prior access to the free pool is not a purchase.
INSERT INTO chaos_player_unlock(id, player_id, modifier_id, price_paid, source)
SELECT "userId" || ':' || "modifierId", "userId", "modifierId", 0, 'legacy-earned'
FROM chaos_unlock
WHERE "modifierId" IN ('night-rider','phantom-rook','bishop-bounce','queen-teleport')
ON CONFLICT DO NOTHING;

-- One transaction for ownership, payment and its receipt. Lock the player so
-- simultaneous purchases cannot overspend or charge twice for the same card.
CREATE OR REPLACE FUNCTION buy_chaos_power(p_player text, p_card text, p_price integer)
RETURNS TABLE(outcome text, balance integer)
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE current_gold integer;
BEGIN
  IF p_price <= 0 THEN RAISE EXCEPTION 'Invalid shop price'; END IF;
  SELECT gold INTO current_gold FROM chaos_player WHERE id = p_player FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT 'insufficient'::text, 0; RETURN; END IF;
  IF EXISTS(SELECT 1 FROM chaos_player_unlock WHERE player_id=p_player AND modifier_id=p_card) THEN
    RETURN QUERY SELECT 'owned'::text, current_gold; RETURN;
  END IF;
  IF current_gold < p_price THEN
    RETURN QUERY SELECT 'insufficient'::text, current_gold; RETURN;
  END IF;
  INSERT INTO chaos_player_unlock(id,player_id,modifier_id,price_paid,source)
    VALUES(p_player || ':' || p_card,p_player,p_card,p_price,'shop');
  UPDATE chaos_player SET gold=gold-p_price WHERE id=p_player;
  INSERT INTO chaos_gold_ledger(id,player_id,match_id,amount,reason)
    VALUES(p_player || ':' || p_card || ':unlock',p_player,NULL,-p_price,'unlock');
  RETURN QUERY SELECT 'purchased'::text, current_gold-p_price;
END;
$$;
