import {NextRequest,NextResponse} from 'next/server';
import {getChaosUserId,isGuestId} from '@/lib/chaos-auth';
import {db} from '@/lib/db';
import {sql} from 'drizzle-orm';
import {ACHIEVEMENTS,achievementProgress} from '@/lib/chaos-achievements';
import {STREAK_TIME_ZONE,summarizeStreak} from '@/lib/chaos-streak';
export async function GET(req:NextRequest){
 const id=await getChaosUserId(req);
 if(!id||isGuestId(id))return NextResponse.json({error:'Sign in to view achievements'},{status:401});
 const result=await db.execute(sql`
 WITH played AS (
 SELECT m.id,m.ended_at,m.reason,m.winner,
 CASE WHEN (m.host_id=${id} AND m.host_color='white') OR (m.guest_id=${id} AND m.host_color='black') THEN 'white' ELSE 'black' END AS side,
 m.record->'state' AS state
 FROM chaos_match m WHERE (m.host_id=${id} OR m.guest_id=${id}) AND m.host_id<>m.guest_id
 AND m.reason !~* 'abort|disconnect|abandon' AND jsonb_array_length(coalesce(m.record->'moves','[]'::jsonb))>=2
 ), feats AS (
 SELECT p.id,p.ended_at,feat FROM played p CROSS JOIN LATERAL unnest(ARRAY[
 'regular',CASE WHEN winner=side THEN 'first-win' END,CASE WHEN winner=side THEN 'ten-wins' END,
 CASE WHEN winner=side AND reason ~* 'king captured' THEN 'king-taker' END,
 CASE WHEN winner=side AND reason ~* 'checkmate' THEN 'checkmate' END,
 CASE WHEN jsonb_array_length(coalesce(state->(CASE WHEN side='white' THEN 'playerModifiers' ELSE 'aiModifiers' END),'[]'::jsonb))>=5 THEN 'full-stash' END
 ]) AS feat WHERE feat IS NOT NULL
 ) SELECT feat,count(*)::int AS progress,
 (array_agg(ended_at ORDER BY ended_at,id))[CASE WHEN feat IN ('regular','ten-wins') THEN 10 ELSE 1 END] AS earned,
 (array_agg(id ORDER BY ended_at,id))[CASE WHEN feat IN ('regular','ten-wins') THEN 10 ELSE 1 END] AS match
 FROM feats GROUP BY feat`);
 // Streak days: distinct Sydney dates with match gold, the same rows archive_chaos_match() counts.
 const days=await db.execute(sql`SELECT (now() AT TIME ZONE ${STREAK_TIME_ZONE})::date::text AS today,
 coalesce((SELECT array_agg(d ORDER BY d DESC) FROM (SELECT DISTINCT (created_at AT TIME ZONE ${STREAK_TIME_ZONE})::date::text AS d
 FROM chaos_gold_ledger WHERE player_id=${id} AND reason='match' ORDER BY d DESC LIMIT 400) x),'{}') AS days`);
 const streak=summarizeStreak((days.rows[0]?.days as string[])??[],String(days.rows[0]?.today));
 const achievements=ACHIEVEMENTS.map(def=>{const row=result.rows.find(r=>r.feat===def.id);return achievementProgress(def.id,Number(row?.progress??0),row?.earned?new Date(String(row.earned)).toISOString():null,row?.match?String(row.match):null);});
 return NextResponse.json({achievements,streak},{headers:{'Cache-Control':'private, no-store'}});
}
