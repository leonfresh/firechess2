-- Retire the original pawn shop cards. Preserve unlock rows for historical records.
-- The refund ledger entry is the idempotency key. Credit and ledger insert are one statement.
WITH refunds AS (
  INSERT INTO chaos_gold_ledger (id, player_id, match_id, amount, reason)
  SELECT u.id || ':retired-refund', u.player_id, NULL, u.price_paid, 'retired-card-refund'
  FROM chaos_player_unlock u
  JOIN chaos_player p ON p.id = u.player_id
  WHERE u.modifier_id IN ('conscription', 'phalanx', 'hostile-takeover')
    AND u.source = 'shop' AND u.price_paid > 0
  ON CONFLICT (id) DO NOTHING
  RETURNING player_id, amount
), totals AS (
  SELECT player_id, sum(amount)::integer AS amount FROM refunds GROUP BY player_id
)
UPDATE chaos_player p SET gold = p.gold + totals.amount
FROM totals WHERE p.id = totals.player_id
RETURNING totals.amount AS refunded_gold;
