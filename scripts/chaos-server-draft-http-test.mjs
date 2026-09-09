import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Chess} from 'chess.js';
const origin=process.env.CHAOS_TEST_ORIGIN || 'http://localhost:3002';
const host=`guest_${randomUUID()}`,guest=`guest_${randomUUID()}`;
async function request(user,path,body){const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{'X-Guest-Id':user,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;}
const created=await request(host,'/api/chaos/create',{hostColor:'white',draftProtocol:2,timeControlSeconds:300,incrementSeconds:3});
const roomId=created.roomId;
await request(guest,'/api/chaos/join',{roomCode:created.roomCode});
let state=await request(host,`/api/chaos/sync?roomId=${roomId}`);
const send=async(user,message,id=randomUUID())=>{state=await request(user,'/api/chaos/sync',{roomId,message,id,baseRevision:state.stateRevision});return state};
try {
 assert.equal(state.snapshot.draftProtocol,2);assert.equal(state.snapshot.opening.offers.host.length,3);
 const deadline=state.snapshot.opening.deadline;
 const reconnect=await request(guest,`/api/chaos/sync?roomId=${roomId}`);assert.equal(reconnect.snapshot.opening.deadline,deadline);
 await send(host,{type:'anomaly_pick',anomalyId:null});await send(guest,{type:'anomaly_pick',anomalyId:null});
 for(const [index,san] of ['e4','e5','Nf3','Nc6','Bc4','Bc5','d3','d6','Nc3'].entries()) {
  const game=new Chess(state.snapshot.fen),move=game.move(san);
  await send(index%2?guest:host,{type:'move',fen:game.fen(),chaosState:state.snapshot.chaosState,lastMoveFrom:move.from,lastMoveTo:move.to});
 }
 const draft=state.snapshot.draft;assert.equal(draft.color,'white');assert.equal(draft.choices.length,3);assert.equal(state.snapshot.clock.active,null);
 assert.equal(new Chess(state.snapshot.fen).get('c3').type,'n');
 const offered=await request(guest,`/api/chaos/sync?roomId=${roomId}`);assert.deepEqual(offered.snapshot.draft,draft);
 console.log(`PASS ${created.roomCode}: move saved before White's pick; offered cards and deadline survive reconnect. Waiting for auto-pick.`);
 await new Promise(resolve=>setTimeout(resolve,Math.max(0,draft.deadline-Date.now()+2500)));
 if(process.env.CHAOS_TEST_VERIFY_ALARM==='true') {
  const dotenv=await import('dotenv');dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
  const {neon}=await import('@neondatabase/serverless');const sql=neon(process.env.DATABASE_URL);
  const rows=await sql`select "chaosState" from chaos_room where id=${roomId}`;
  assert.equal(rows[0].chaosState._sync.draft,undefined,'Cloudflare must auto-pick before any client reads');
  console.log('PASS: durable alarm auto-picked with no connected clients, verified directly in storage.');
 }
 state=await request(guest,`/api/chaos/sync?roomId=${roomId}`);
 assert.equal(state.snapshot.draft,null);assert.equal(state.snapshot.chaosState.playerModifiers[0].id,draft.choices[0]);assert.equal(state.snapshot.clock.active,'b');
 const game=new Chess(state.snapshot.fen),move=game.move('Nf6');
 await send(guest,{type:'move',fen:game.fen(),chaosState:state.snapshot.chaosState,lastMoveFrom:move.from,lastMoveTo:move.to});
 const black=state.snapshot.draft;assert.equal(black.color,'black');
 const id=randomUUID(),pick={type:'power_pick',draftId:black.id,modifierId:black.choices[0]};
 await send(guest,pick,id);const revision=state.revision;await send(guest,pick,id);assert.equal(state.revision,revision);
 assert.equal(state.snapshot.chaosState.currentPhase,1);assert.equal(state.snapshot.clock.active,'w');
 console.log('PASS: Black moved before its pick; duplicate pick is harmless and White resumes.');
} finally {await send(host,{type:'resign'});console.log(`Finished test room ${created.roomCode}.`);}
