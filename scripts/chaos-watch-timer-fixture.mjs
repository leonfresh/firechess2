import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync,readFileSync,existsSync,unlinkSync} from 'node:fs';
import dotenv from 'dotenv';import {neon} from '@neondatabase/serverless';import {Chess} from 'chess.js';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
/** Leaves one 5+3 room playing with the clock already running, so the Watchtower
 * timer UI can be checked against a real live game. */
const sql=neon(process.env.DATABASE_URL),base=process.env.CHAOS_TEST_ORIGIN||'https://www.firechess.com',file='.vercel/watch-timer-fixture.json';
if(process.argv.includes('--cleanup')){
 if(existsSync(file)){
  const f=JSON.parse(readFileSync(file));
  await sql`delete from chaos_match where room_id=${f.roomId}`;
  await sql`delete from chaos_room where id=${f.roomId}`;
  for(const id of [f.host,f.guest])await sql`delete from chaos_player where id=${id}`;
  unlinkSync(file);
 }
 console.log('Timer fixture removed.');process.exit();
}
async function request(path,user,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(user?{'X-Guest-Id':user}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
const host='guest_'+randomUUID(),guest='guest_'+randomUUID();
try{
 await sql`insert into chaos_player(id,name) values(${host},'Watchtower Clock White'),(${guest},'Watchtower Clock Black')`;
 const room=await request('/api/chaos/create',host,{draftProtocol:2,hostColor:'white',timeControlSeconds:300,incrementSeconds:3});
 writeFileSync(file,JSON.stringify({roomId:room.roomId,host,guest}));
 await request('/api/chaos/join',guest,{roomCode:room.roomCode});
 let state=await request('/api/chaos/sync?roomId='+room.roomId,host);
 const send=async(user,message)=>state=await request('/api/chaos/sync',user,{roomId:room.roomId,id:randomUUID(),baseRevision:state.stateRevision,message});
 await send(host,{type:'anomaly_pick',anomalyId:null});await send(guest,{type:'anomaly_pick',anomalyId:null});
 const play=async(user,san)=>{const g=new Chess(state.snapshot.fen),m=g.move(san);await send(user,{type:'move',fen:g.fen(),lastMoveFrom:m.from,lastMoveTo:m.to,chaosState:state.snapshot.chaosState});};
 await play(host,'e4');await play(guest,'e5');
 const live=await request('/api/chaos/watch?room='+room.roomId);
 assert.ok(live.clock&&live.clock.active==='w','The fixture must leave a running clock with White to move');
 console.log('LIVE_TIMED_ROOM='+room.roomId);
 console.log('white_ms='+live.clock.w+' black_ms='+live.clock.b);
}catch(e){console.error(e);await sql`delete from chaos_room where id=${JSON.parse(readFileSync(file,'utf8')).roomId}`.catch(()=>{});process.exit(1);}
