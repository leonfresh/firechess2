// Run against the local backend: node scripts/chaos-sync-http-test.mjs
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Chess } from 'chess.js';
import { WebSocket } from 'ws';
import { once } from 'node:events';
const base=process.env.CHAOS_TEST_ORIGIN || 'http://localhost:3002';
const live=process.argv.includes('--live');
const recovery=process.argv.includes('--recovery');
const openingAnomaly=process.argv.includes('--abundance')?'empress':null;
const clients=new Map();
let notifications=0;
const liveTimings=[];
const serverTimings=[];
async function liveRequest(path,user,body) {
 let client=clients.get(user);
 if(!client) {
  let socket;
  if(process.env.CHAOS_TEST_CLOUDFLARE === 'true') {
   const roomId=body?.roomId||new URL(path,base).searchParams.get('roomId');
   const res=await fetch(`${base}/api/chaos/live-ticket?roomId=${encodeURIComponent(roomId)}`,{headers:{'X-Guest-Id':user}});
   const ticket=await res.json();
   if(!res.ok)return {status:res.status,data:ticket};
   const liveOrigin=process.env.CHAOS_TEST_LIVE_ORIGIN||ticket.origin;
   socket=new WebSocket(liveOrigin.replace(/^http/,'ws')+`/api/chaos/live?roomId=${encodeURIComponent(roomId)}`,['chaos-v1',`chaos-token.${ticket.token}`],{origin:new URL(base).origin});
  } else socket=new WebSocket(base.replace(/^http/,'ws')+(process.env.CHAOS_TEST_LIVE_PATH||'/api/chaos/live'),{origin:base});
  client={socket,tail:once(socket,'open'),pending:null};clients.set(user,client);
  socket.on('message',raw=>{const message=JSON.parse(raw);if(message.type==='changed')notifications++;
   if(message.type==='response'&&client.pending?.id===message.id){if(message.timing)serverTimings.push(message.timing);clearTimeout(client.pending.timer);client.pending.resolve({status:message.status,data:message.data});client.pending=null;}});
 }
 const run=client.tail.then(()=>new Promise((resolve,reject)=>{
  const id=randomUUID(),query=new URL(path,base).searchParams;
  const timer=setTimeout(()=>reject(new Error('Socket response timed out')),10000);
  client.pending={id,resolve,timer};
  client.socket.send(JSON.stringify({id,type:body?'command':'read',guestId:user,roomId:body?.roomId||query.get('roomId'),since:body?.since??Number(query.get('since')??-1),action:body}));
 }));
 client.tail=run;
 const started=performance.now();
 const result=await run;liveTimings.push(performance.now()-started);return result;
}
const host=`guest_${randomUUID()}`, guest=`guest_${randomUUID()}`, outsider=`guest_${randomUUID()}`;
async function request(path,user,body) {
 if(live&&path.startsWith('/api/chaos/sync'))return liveRequest(path,user,body);
 const res=await fetch(base+path,{method:body?'POST':'GET',headers:{'X-Guest-Id':user,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 return {status:res.status,data:await res.json()};
}
const created=await request('/api/chaos/create',host,{hostColor:'white',timeControlSeconds:-1});assert.equal(created.status,200);
const roomId=created.data.roomId;
assert.equal((await request('/api/chaos/join',guest,{roomCode:created.data.roomCode})).status,200);
const get=(user=host,since=-1)=>request(`/api/chaos/sync?roomId=${roomId}&since=${since}`,user);
const send=(user,message,baseRevision=0,id=randomUUID())=>request('/api/chaos/sync',user,{roomId,message,baseRevision,id});
async function reconnectBoth(label) {
 if(!recovery)return;
 const before=await Promise.all([get(host),get(guest)]);
 for(const user of [host,guest]) { const client=clients.get(user); client?.socket.terminate(); clients.delete(user); }
 const after=await Promise.all([get(host),get(guest)]);
 for(let i=0;i<2;i++) {
  assert.equal(after[i].status,200);
  const {serverNow: afterTime, ...afterSnapshot} = after[i].data.snapshot;
  const {serverNow: beforeTime, ...beforeSnapshot} = before[i].data.snapshot;
  assert.ok(afterTime >= beforeTime);
  assert.deepEqual(afterSnapshot,beforeSnapshot);
  assert.equal(after[i].data.myPick,before[i].data.myPick);
  assert.equal(after[i].data.opponentPick,before[i].data.opponentPick);
  assert.equal(after[i].data.stateRevision,before[i].data.stateRevision);
 }
 console.log(`PASS: both players reconnect during ${label}.`);
}
assert.equal((await get(outsider)).status,403);
if(live) { await get(host); await get(guest); }
await reconnectBoth('opening choices');
assert.equal((await request('/api/chaos/move',host,{roomId,newFen:new Chess().fen()})).status,410);
const picks=await Promise.all([send(host,{type:'anomaly_pick',anomalyId:openingAnomaly}),send(guest,{type:'anomaly_pick',anomalyId:openingAnomaly})]);
assert.deepEqual(picks.map(x=>x.status),[200,200]);
let saved=(await get()).data;assert.equal(saved.myPick,openingAnomaly);assert.equal(saved.opponentPick,openingAnomaly);assert.equal(saved.revision,2);
if(openingAnomaly==='empress') {
 const board=new Chess(saved.snapshot.fen);
 for(const [square,color] of [['c3','w'],['f3','w'],['c6','b'],['f6','b']])assert.deepEqual(board.get(square),{type:'p',color});
 console.log('PASS: Abundance spawns and persists all four extra pawns for both players.');
}
await reconnectBoth('completed opening choices');
const makeMove=(from,to)=>{const g=new Chess(saved.snapshot.fen);g.move({from,to});return {type:'move',fen:g.fen(),lastMoveFrom:from,lastMoveTo:to,chaosState:saved.snapshot.chaosState,status:'playing'};};
const id1=randomUUID(),id2=randomUUID();
const first=makeMove('e2','e4'),second=makeMove('d2','d4');
assert.equal((await send(guest,first,saved.stateRevision)).status,409);
const competing=await Promise.all([send(host,first,saved.stateRevision,id1),send(host,second,saved.stateRevision,id2)]);
assert.deepEqual(competing.map(x=>x.status).sort(),[200,409]);
const winner=competing[0].status===200?{message:first,id:id1}:{message:second,id:id2};
saved=(await get()).data;const revision=saved.revision;
await reconnectBoth('normal play');
assert.equal((await send(host,winner.message,0,winner.id)).status,200);assert.equal((await get()).data.revision,revision);
const replay=(await get(guest,2)).data;assert.equal(replay.events.length,1);assert.equal(replay.events[0].message.fen,saved.snapshot.fen);
assert.equal((await send(guest,{type:'resign'})).status,200);
assert.equal((await send(host,{type:'rematch'})).status,200);
assert.notEqual((await get()).data.snapshot.status,'playing');
assert.equal((await send(guest,{type:'rematch'})).status,200);
saved=(await get()).data;assert.equal(saved.snapshot.fen,new Chess().fen());assert.equal(saved.snapshot.hostColor,'black');
// In the rematch the guest is White. Read the saved position before each action,
// as a reconnecting client would, and exercise the complete sequential draft.
for(const [user,from,to] of [[guest,'e2','e4'],[host,'e7','e5'],[guest,'g1','f3'],[host,'b8','c6'],[guest,'f1','c4'],[host,'g8','f6'],[guest,'d2','d3'],[host,'f8','c5']]) {
 saved=(await get(user)).data;
 assert.equal((await send(user,makeMove(from,to),saved.stateRevision)).status,200);
}
assert.equal((await send(guest,{type:'draft_freeze'})).status,200);
await reconnectBoth('first power choice');
saved=(await get(guest)).data;
const whiteDraft={...makeMove('c2','c3'),type:'draft',chaosState:{...saved.snapshot.chaosState,playerModifiers:[{id:'dragon-bishop'}],draftStep:1}};
assert.equal((await send(guest,whiteDraft,saved.stateRevision)).status,200);
saved=(await get(host)).data;
assert.equal(saved.snapshot.chaosState.draftStep,1);
await reconnectBoth('between sequential power choices');
assert.equal((await send(host,{type:'draft_freeze'})).status,200);
assert.equal((await send(host,makeMove('d7','d6'),saved.stateRevision)).status,409);
const blackDraft={...makeMove('d7','d6'),type:'draft',chaosState:{...saved.snapshot.chaosState,aiModifiers:[{id:'dragon-rook'}],currentPhase:1,draftStep:2}};
const pickId=randomUUID();
assert.equal((await send(host,blackDraft,saved.stateRevision,pickId)).status,200);
assert.equal((await send(host,blackDraft,saved.stateRevision,pickId)).status,200);
saved=(await get(host)).data;
assert.equal(saved.snapshot.chaosState.currentPhase,1);
await reconnectBoth('completed power choices');
assert.equal((await send(guest,makeMove('b1','d2'),saved.stateRevision)).status,200);
if(recovery) {
 // Commit over HTTP while the opponent remains on WebSockets, then retry
 // the same command after reconnecting. The event must appear only once.
 const id=randomUUID(), before=(await get(host)).data;
 const action={roomId,id,baseRevision:before.stateRevision,message:{type:'draw-offer'}};
 const res=await fetch(base+'/api/chaos/sync',{method:'POST',headers:{'X-Guest-Id':host,'Content-Type':'application/json'},body:JSON.stringify(action)});
 assert.equal(res.status,200); const committed=await res.json();
 await reconnectBoth('HTTP fallback commit');
 assert.equal((await send(host,action.message,action.baseRevision,id)).status,200);
 const after=(await get(guest)).data;
 assert.equal(after.revision,committed.revision);
 assert.equal(after.events.filter(e=>e.message.type==='draw-offer').length,1);
 assert.equal((await send(guest,{type:'draw-decline'})).status,200);
 console.log('PASS: HTTP commit survives reconnect and duplicate retry without a second event.');
}
assert.equal((await send(host,{type:'draw-offer'})).status,200);assert.equal((await send(guest,{type:'draw-accept'})).status,200);
console.log('PASS: real DB membership, concurrent opening choices, atomic move conflict, idempotent retry, missed-event replay, resignation, rematch color swap and agreed draw.');
console.log(`Test room ${created.data.roomCode} finished.`);
console.log('PASS: rematch opening moves, both sequential power picks, freeze enforcement, duplicate pick retry and play after drafting.');
if(live){assert.ok(notifications>10,'Expected server-pushed commit notifications');console.log(`PASS: ${notifications} live commit notifications through ${base}.`);}
for(const client of clients.values())client.socket.close();
if(liveTimings.length){const sorted=liveTimings.sort((a,b)=>a-b);console.log(JSON.stringify({liveRequests:sorted.length,p50Ms:Math.round(sorted[Math.floor(sorted.length*.5)]),p95Ms:Math.round(sorted[Math.floor(sorted.length*.95)]),maxMs:Math.round(sorted.at(-1))}));}

if(serverTimings.length) console.log(JSON.stringify({serverTimings}));
