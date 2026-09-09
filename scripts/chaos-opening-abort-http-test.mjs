// Owned test rooms only. Direct DB reads verify Cloudflare alarms without API reads settling the room.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import dotenv from 'dotenv';
import {neon} from '@neondatabase/serverless';
import {Chess} from 'chess.js';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
const sql=neon(process.env.DATABASE_URL), base=process.env.CHAOS_TEST_ORIGIN||'https://chaos.firechess.com';
const rooms=[],users=[];
async function req(user,path,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'X-Guest-Id':user,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
try {
  for(const idle of ['w','b']) {
    const host='guest_'+randomUUID(),guest='guest_'+randomUUID();users.push(host,guest);
    await sql`insert into chaos_player(id,name) values(${host},'Opening abort test'),(${guest},'Opening abort test')`;
    const room=await req(host,'/api/chaos/create',{draftProtocol:2,hostColor:'white',timeControlSeconds:300,incrementSeconds:3});rooms.push(room.roomId);
    // Exercise rated eligibility without exposing a test room in the public lobby.
    await sql`update chaos_room set "isMatchmaking"=true,"createdAt"=now()-interval '1 day' where id=${room.roomId}`;
    await req(guest,'/api/chaos/join',{roomCode:room.roomCode});
    let state=await req(host,'/api/chaos/sync?roomId='+room.roomId);
    const send=async(user,message)=>state=await req(user,'/api/chaos/sync',{roomId:room.roomId,id:randomUUID(),baseRevision:state.stateRevision,message});
    await send(host,{type:'anomaly_pick',anomalyId:null});await send(guest,{type:'anomaly_pick',anomalyId:null});
    if(idle==='b'){const chess=new Chess(state.snapshot.fen);chess.move('e4');await send(host,{type:'move',fen:chess.fen(),lastMoveFrom:'e2',lastMoveTo:'e4',chaosState:state.snapshot.chaosState});}
    assert.equal(state.snapshot.openingMove.side,idle);assert.ok(state.snapshot.openingMove.deadline-state.snapshot.serverNow<=30000);
    console.log(`Armed ${idle==='w'?'White':'Black'} opening abort in private room ${room.roomCode}.`);
  }
  console.log('Leaving both rooms without clients for 35 seconds.');
  await new Promise(resolve=>setTimeout(resolve,35000));
  for(const id of rooms){const [r]=await sql`select status,"chaosState" from chaos_room where id=${id}`;assert.equal(r.status,'aborted','Alarm must settle before any reconnect');assert.equal(r.chaosState._sync.result.winner,'aborted');const records=await sql`select id from chaos_match where room_id=${id}`;assert.equal(records.length,0);}
  for(const id of users){const [p]=await sql`select rating,games,wins,losses,draws from chaos_player where id=${id}`;assert.deepEqual(p,{rating:1200,games:0,wins:0,losses:0,draws:0});}
  console.log('PASS: both Cloudflare alarms aborted unattended rooms; no ratings, stats or completed-game records changed.');
} finally {
  for(const id of rooms){await sql`delete from chaos_match where room_id=${id}`;await sql`delete from chaos_room where id=${id}`;}
  for(const id of users)await sql`delete from chaos_player where id=${id}`;
}
