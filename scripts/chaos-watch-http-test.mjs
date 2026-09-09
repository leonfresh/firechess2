import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync,readFileSync,existsSync,unlinkSync} from 'node:fs';
import dotenv from 'dotenv';import {neon} from '@neondatabase/serverless';import {Chess} from 'chess.js';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
const sql=neon(process.env.DATABASE_URL),base=process.env.CHAOS_TEST_ORIGIN||'https://www.firechess.com',file='.vercel/watch-fixtures.json';
if(process.argv.includes('--cleanup')){if(existsSync(file)){const f=JSON.parse(readFileSync(file));await sql`delete from chaos_match where room_id=${f.roomId}`;await sql`delete from chaos_room where id=${f.roomId}`;for(const id of [f.host,f.guest])await sql`delete from chaos_player where id=${id}`;unlinkSync(file);}console.log('Watchtower fixtures removed.');process.exit();}
const host='guest_'+randomUUID(),guest='guest_'+randomUUID();
async function request(path,user,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(user?{'X-Guest-Id':user}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
let fixture;
try{
 await sql`insert into chaos_player(id,name) values(${host},'Watchtower QA White'),(${guest},'Watchtower QA Black')`;
 const room=await request('/api/chaos/create',host,{draftProtocol:2,hostColor:'white',timeControlSeconds:-1,incrementSeconds:0});
 fixture={...room,host,guest};writeFileSync(file,JSON.stringify(fixture));
 await request('/api/chaos/join',guest,{roomCode:room.roomCode});let state=await request('/api/chaos/sync?roomId='+room.roomId,host);
 const send=async(user,message)=>state=await request('/api/chaos/sync',user,{roomId:room.roomId,id:randomUUID(),baseRevision:state.stateRevision,message});
 const move=async(user,san)=>{const g=new Chess(state.snapshot.fen),m=g.move(san);await send(user,{type:'move',fen:g.fen(),lastMoveFrom:m.from,lastMoveTo:m.to,chaosState:state.snapshot.chaosState});};
 await send(host,{type:'anomaly_pick',anomalyId:null});await send(guest,{type:'anomaly_pick',anomalyId:null});await move(host,'e4');await move(guest,'e5');
 await send(host,{type:'chat',text:'WATCH_PRIVATE_CHAT_MUST_NOT_LEAK'});
 let live=await request('/api/chaos/watch?room='+room.roomId);
 assert.equal(live.frame.fen,state.snapshot.fen);assert.equal(live.white,'Watchtower QA White');assert.equal(live.black,'Watchtower QA Black');
 const safe=JSON.stringify(live);for(const secret of [host,guest,room.roomCode,'WATCH_PRIVATE_CHAT_MUST_NOT_LEAK','offers','receipts'])assert.ok(!safe.includes(secret),secret);
 const listing=await request('/api/chaos/watch?tab=live');assert.ok(listing.games.some(g=>g.id===room.roomId));
 const denied=await fetch(base+'/api/chaos/sync',{method:'POST',headers:{'Content-Type':'application/json','X-Guest-Id':'guest_'+randomUUID()},body:JSON.stringify({roomId:room.roomId,id:randomUUID(),baseRevision:state.stateRevision,message:{type:'resign'}})});assert.equal(denied.status,403);
 await send(host,{type:'resign'});
 const archive=await request('/api/chaos/watch?match='+encodeURIComponent(room.roomId+':0'));
 assert.equal(archive.legacy,false);assert.ok(archive.frames.some(f=>f.from==='e2'&&f.to==='e4'));assert.equal(archive.result.winner,'black');assert.ok(!JSON.stringify(archive).includes('WATCH_PRIVATE'));
 const history=await request('/api/chaos/watch?tab=archive');assert.ok(history.games.some(g=>g.id===room.roomId+':0'));
 await send(host,{type:'rematch'});await send(guest,{type:'rematch'});await move(guest,'d4');await move(host,'d5');
 live=await request('/api/chaos/watch?room='+room.roomId);assert.equal(live.gameNumber,1);assert.equal(live.white,'Watchtower QA Black');
 const retained=await request('/api/chaos/watch?match='+encodeURIComponent(room.roomId+':0'));assert.deepEqual(retained.frames,archive.frames);
 console.log('PASS: public friend room listing, live board, chat/identity redaction, spectator denial, durable replay, rematch colors and separate archive.');
 console.log(JSON.stringify({roomId:room.roomId,matchId:room.roomId+':0'}));
 if(!process.argv.includes('--keep')){await sql`delete from chaos_match where room_id=${room.roomId}`;await sql`delete from chaos_room where id=${room.roomId}`;for(const id of [host,guest])await sql`delete from chaos_player where id=${id}`;unlinkSync(file);}
}catch(e){if(fixture){await sql`delete from chaos_match where room_id=${fixture.roomId}`;await sql`delete from chaos_room where id=${fixture.roomId}`;}for(const id of [host,guest])await sql`delete from chaos_player where id=${id}`;if(existsSync(file))unlinkSync(file);throw e;}
