import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Chess} from 'chess.js';
const origin=process.env.CHAOS_TEST_ORIGIN || 'http://localhost:3002';
async function request(user,path,body){
  const response=await fetch(origin+path,{method:body?'POST':'GET',headers:{'X-Guest-Id':user,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;
}
for(const [base,inc] of [[120,1],[300,3],[600,5]]) {
  const host=`guest_${randomUUID()}`,guest=`guest_${randomUUID()}`;
  const room=await request(host,'/api/chaos/create',{hostColor:'white',timeControlSeconds:base,incrementSeconds:inc});
  const joined=await request(guest,'/api/chaos/join',{roomCode:room.roomCode});
  assert.equal(joined.timeControlSeconds,base);assert.equal(joined.incrementSeconds,inc);
  let state=await request(host,`/api/chaos/sync?roomId=${room.roomId}`);
  const send=async(user,message,id=randomUUID())=>request(user,'/api/chaos/sync',{roomId:room.roomId,baseRevision:state.stateRevision,message,id});
  try {
    state=await send(host,{type:'anomaly_pick',anomalyId:null});assert.equal(state.snapshot.clock,null);
    state=await send(guest,{type:'anomaly_pick',anomalyId:null});assert.equal(state.snapshot.clock.active,'w');
    const before=state.snapshot.clock;
    const game=new Chess(state.snapshot.fen);game.move('e4');
    const id=randomUUID(),message={type:'move',fen:game.fen(),lastMoveFrom:'e2',lastMoveTo:'e4',chaosState:state.snapshot.chaosState,timerWhiteMs:86400000,timerBlackMs:0};
    state=await send(host,message,id);assert.equal(state.snapshot.clock.active,'b');
    assert.ok(state.snapshot.clock.w<=before.w+inc*1000);assert.ok(state.snapshot.clock.w>0);
    assert.ok(state.snapshot.clock.b>0);assert.ok(state.snapshot.clock.b<=base*1000);
    const savedWhite=state.snapshot.clock.w,revision=state.revision;
    state=await send(host,message,id);assert.equal(state.revision,revision);assert.equal(state.snapshot.clock.w,savedWhite);
    const reconnect=await request(guest,`/api/chaos/sync?roomId=${room.roomId}`);
    assert.equal(reconnect.snapshot.clock.w,savedWhite);assert.ok(reconnect.snapshot.clock.b<=state.snapshot.clock.b);
    console.log(`PASS ${base/60}+${inc}: server clock, forged timer rejection, duplicate increment protection, guest reconnect (${room.roomCode}).`);
  } finally { state=await send(host,{type:'resign'});assert.equal(state.snapshot.clock?.active,null); }
}
