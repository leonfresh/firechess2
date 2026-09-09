import {NextRequest,NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {sql} from 'drizzle-orm';
import {getChaosUserId} from '@/lib/chaos-auth';
export const dynamic='force-dynamic';
export async function GET(req: NextRequest) {
 try {
  const user=await getChaosUserId(req);
  if(!user)return NextResponse.json({error:'Sign in to see your games'}, {status:401});
  const matchId=req.nextUrl.searchParams.get('match');
  const headers={'Cache-Control':'no-store'};
  const roomId=req.nextUrl.searchParams.get('room');
  if(roomId){
   const records=await db.execute(sql`select rated,case when host_id=${user} then host_before else guest_before end as before,case when host_id=${user} then host_delta else guest_delta end as delta from chaos_match where room_id=${roomId} and (host_id=${user} or guest_id=${user}) order by game_number desc limit 1`);
   return NextResponse.json({result:records.rows[0]??null},{headers});
  }
  if(matchId){
   const records=await db.execute(sql`select * from chaos_match where id=${matchId} and (host_id=${user} or guest_id=${user})`);
   if(!records.rows.length)return NextResponse.json({error:'Game not found'}, {status:404,headers});
   return NextResponse.json({match:records.rows[0]}, {headers});
  }
  const page=Math.max(0,Math.min(10000,Number(req.nextUrl.searchParams.get('page'))||0));
  const [profile,leaders,games]=await Promise.all([
   db.execute(sql`select * from chaos_player where id=${user}`),
   db.execute(sql`select name,rating,games,wins,losses,draws from chaos_player where games>0 order by rating desc,games desc,id limit 50`),
   db.execute(sql`select m.id,m.room_id,m.host_color,m.winner,m.reason,m.rated,m.ended_at,
    case when m.host_id=${user} then m.host_color else case when m.host_color='white' then 'black' else 'white' end end as color,
    case when m.host_id=${user} then m.host_delta else m.guest_delta end as delta,
    coalesce(p.name,'Guest player') as opponent,
    m.record->'timeControlSeconds' as base,m.record->'incrementSeconds' as increment
    from chaos_match m left join chaos_player p on p.id=case when m.host_id=${user} then m.guest_id else m.host_id end
    where m.host_id=${user} or m.guest_id=${user} order by m.ended_at desc,m.id desc limit 21 offset ${Math.floor(page)*20}`)
  ]);
  return NextResponse.json({profile:profile.rows[0]??null,leaders:leaders.rows,games:games.rows.slice(0,20),hasMore:games.rows.length>20}, {headers});
 }catch{return NextResponse.json({error:'Could not load standings. Please try again.'},{status:503});}
}
