import { db } from "./db";
import { sql } from "drizzle-orm";
import { cosmeticMastery } from "./chaos-anomaly-unlocks";
/** Cosmetic progress comes only from server-archived, gold-eligible matches. */
export async function readChaosMastery(playerId: string | null) {
 if (!playerId) return {};
 const result=await db.execute(sql`
 WITH played AS (
  SELECT m.record->'state' AS state,
   CASE WHEN (m.host_id=${playerId} AND m.host_color='white') OR (m.guest_id=${playerId} AND m.host_color='black') THEN 'player' ELSE 'ai' END AS side
  FROM chaos_gold_ledger l JOIN chaos_match m ON m.id=l.match_id
  WHERE l.player_id=${playerId} AND l.reason='match'
 )
 SELECT item.id, count(*)::int AS games FROM played
 CROSS JOIN LATERAL (
  SELECT value->>'id' AS id FROM jsonb_array_elements(coalesce(state->(side || 'Modifiers'),'[]'::jsonb))
  UNION SELECT 'anomaly:' || (state->>(side || 'Anomaly'))
 ) item WHERE item.id IS NOT NULL GROUP BY item.id`);
 return Object.fromEntries(result.rows.map(row=>[String(row.id),cosmeticMastery(Number(row.games))]));
}
