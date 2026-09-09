import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';import {randomUUID,createHmac} from 'node:crypto';import dotenv from 'dotenv';import {neon} from '@neondatabase/serverless';import {Chess} from 'chess.js';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});const sql=neon(process.env.DATABASE_URL);
process.env.CHAOS_LIVE_SECRET=JSON.parse(readFileSync('.vercel/chaos-live-secrets.json','utf8')).CHAOS_LIVE_SECRET;
const base=process.env.CHAOS_TEST_ORIGIN||'https://1546003954616500245.discordsays.com/.proxy';
const uid=()=> 'discord_00000'+String(BigInt('0x'+randomUUID().replaceAll('-','').slice(0,10))).padStart(12,'0').slice(-12);
const host=uid(),guest=uid();function token(id){const p=Buffer.from(JSON.stringify({aud:'chaos-discord-v1',sub:id,exp:Date.now()+600000})).toString('base64url');return p+'.'+createHmac('sha256',process.env.CHAOS_LIVE_SECRET).update(p).digest('base64url');}
async function req(user,path,body,status=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'X-Chaos-Identity':token(user),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
let roomId;await sql`insert into chaos_player(id,name) values(${host},'Integration test'),(${guest},'Integration test')`;
try{
 const room=await req(host,'/api/chaos/create',{draftProtocol:2,hostColor:'white',timeControlSeconds:300,incrementSeconds:3});roomId=room.roomId;
 // An old creation date keeps this fixture out of the public queue while testing its normal join path.
 await sql`update chaos_room set "isMatchmaking"=true,"createdAt"=now()-interval '1 day' where id=${roomId}`;
 await req(guest,'/api/chaos/join',{roomCode:room.roomCode});
 let state=await req(host,'/api/chaos/sync?roomId='+roomId);
 const send=async(user,message,id=randomUUID())=>state=await req(user,'/api/chaos/sync',{roomId,id,baseRevision:state.stateRevision,message});
 await send(host,{type:'anomaly_pick',anomalyId:null});await send(guest,{type:'anomaly_pick',anomalyId:null});
 for(const [user,san]of[[host,'e4'],[guest,'e5']]){const chess=new Chess(state.snapshot.fen),m=chess.move(san);await send(user,{type:'move',fen:chess.fen(),chaosState:state.snapshot.chaosState,lastMoveFrom:m.from,lastMoveTo:m.to});}
 const id=randomUUID();await send(guest,{type:'resign'},id);await send(guest,{type:'resign'},id);
 let career=await req(host,'/api/chaos/career');assert.equal(career.profile.rating,1216);assert.equal(career.profile.games,1);assert.equal(career.games.length,1);assert.equal(career.games[0].delta,16);
 const other=await req(guest,'/api/chaos/career');assert.equal(other.profile.rating,1184);
 const game=await req(host,'/api/chaos/career?match='+encodeURIComponent(career.games[0].id));assert.equal(game.match.record.moves.length,2);
 await req(uid(),'/api/chaos/career?match='+encodeURIComponent(career.games[0].id),undefined,404);
 const forged=await fetch(base+'/api/chaos/career',{headers:{'X-Chaos-Identity':'forged','X-Guest-Id':'guest_'+randomUUID()}});assert.equal(forged.status,401);
 await send(host,{type:'rematch'});await send(guest,{type:'rematch'});assert.equal(state.snapshot.hostColor,'black');
 await send(host,{type:'resign'});career=await req(host,'/api/chaos/career');assert.equal(career.games.length,2);assert.equal(career.games[0].rated,false);assert.equal(career.profile.games,1);
 console.log('PASS '+room.roomCode+': authenticated rated match, both Elo changes, duplicate retry, private full history, forged-token rejection, and separate casual rematch record through Discord proxy.');
}finally{
 if(roomId){await sql`delete from chaos_match where room_id=${roomId}`;await sql`delete from chaos_room where id=${roomId}`;}
 await sql`delete from chaos_player where id in (${host},${guest})`;
 console.log('Isolated test profiles and rooms removed.');
}
