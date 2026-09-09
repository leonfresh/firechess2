const ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),file);
const {test}=require('node:test'),assert=require('node:assert/strict');
const {Chess}=require('chess.js');
const {createSyncState,startServerOpening,metadata,cleanState,reduceCommand,settleRoom,snapshot,nextDeadline}=require('../lib/chaos-room-sync.ts');
let seq=0;
function fresh(){let r={id:'draft-room',hostId:'host',guestId:'guest',hostColor:'white',fen:new Chess().fen(),chaosState:createSyncState(true),status:'playing',moveHistory:[],timeControlSeconds:120,incrementSeconds:1};r.chaosState=startServerOpening(r,1000);return r}
function cmd(r,message){return {id:`draft-action-${++seq}`.padEnd(24,'0'),baseRevision:metadata(r).stateRevision,message}}
function apply(r,actor,message,now=2000){return {...r,...reduceCommand(r,actor,cmd(r,message),now)}}
function ready(){let r=fresh();r=apply(r,'host',{type:'anomaly_pick',anomalyId:null});return apply(r,'guest',{type:'anomaly_pick',anomalyId:null})}
function move(r,actor,from,to,now){const g=new Chess(r.fen);g.move({from,to});return apply(r,actor,{type:'move',fen:g.fen(),lastMoveFrom:from,lastMoveTo:to,chaosState:cleanState(r.chaosState)},now)}
function draft(){let r=ready();r.fen=r.fen.replace('0 1','0 5');return move(r,'host','e2','e4',5000)}
test('move is committed before server deals a fixed offer and pauses both clocks',()=>{
 const r=draft(),d=metadata(r).draft;
 assert.equal(new Chess(r.fen).get('e4').type,'p');assert.equal(r.moveHistory.length,1);
 assert.equal(d.color,'white');assert.equal(d.phase,1);assert.equal(d.choices.length,3);assert.equal(d.deadline,25000);
 assert.equal(metadata(r).clock.active,null);assert.equal(nextDeadline(r),25000);
 assert.throws(()=>move(r,'guest','e7','e5',6000),/Waiting for the power/);
 assert.throws(()=>apply(r,'host',{type:'draft_freeze'},6000),/server starts/);
});
test('manual pick validates owner, exact offer and draft identity',()=>{
 const r=draft(),d=metadata(r).draft,message={type:'power_pick',draftId:d.id,modifierId:d.choices[0]};
 assert.throws(()=>apply(r,'guest',message,6000),/ended/);
 assert.throws(()=>apply(r,'host',{...message,modifierId:'amazon'},6000),/offered/);
 assert.throws(()=>apply(r,'host',{...message,draftId:'previous'},6000),/ended/);
 const c=cmd(r,message),next={...r,...reduceCommand(r,'host',c,6000)};
 assert.equal(metadata(next).draft,undefined);assert.equal(cleanState(next.chaosState).playerModifiers.length,1);
 assert.equal(metadata(next).clock.active,'b');assert.equal(reduceCommand(next,'host',c,7000),null);
});
test('Black moves before its own draft; both phases advance once',()=>{
 let r=draft(),d=metadata(r).draft;r=apply(r,'host',{type:'power_pick',draftId:d.id,modifierId:d.choices[0]},6000);
 assert.equal(cleanState(r.chaosState).currentPhase,0);assert.equal(metadata(r).draft,undefined);
 r=move(r,'guest','e7','e5',8000);d=metadata(r).draft;assert.equal(d.color,'black');assert.equal(d.phase,1);
 r=apply(r,'guest',{type:'power_pick',draftId:d.id,modifierId:d.choices[0]},10000);
 assert.equal(cleanState(r.chaosState).currentPhase,1);assert.equal(metadata(r).clock.active,'w');
 assert.equal(r.moveHistory.length,2);
});
test('disconnected draft auto-picks at its original deadline and late reconnect charges elapsed time',()=>{
 const r=draft(),d=metadata(r).draft;
 assert.equal(settleRoom(r,24999),null);
 const next={...r,...settleRoom(r,35000)};
 assert.equal(metadata(next).draft,undefined);assert.equal(metadata(next).clock.since,25000);
 assert.equal(snapshot(next,35000).clock.b,110000);assert.equal(metadata(next).events.at(-1).actor,'system');
 assert.equal(cleanState(next.chaosState).playerModifiers[0].id,d.choices[0]);assert.equal(settleRoom(next,35000),null);
 const late={...r,...settleRoom(r,200000)};assert.equal(late.status,'finished');assert.equal(metadata(late).result.winner,'white');
});
test('late manual choices cannot beat the automatic choice',()=>{
 const r=draft(),d=metadata(r).draft;
 const next=apply(r,'host',{type:'power_pick',draftId:d.id,modifierId:d.choices[1]},25000);
 assert.equal(cleanState(next.chaosState).playerModifiers[0].id,d.choices[0]);
});
test('opening offers survive reads; both idle players receive one offered anomaly at 20 seconds',()=>{
 const r=fresh(),opening=metadata(r).opening;
 assert.equal(opening.offers.host.length,3);assert.equal(opening.offers.guest.length,3);
 assert.equal(snapshot(r,5000).opening.deadline,21000);assert.equal(settleRoom(r,20999),null);
 const next={...r,...settleRoom(r,22000)};
 assert.equal(metadata(next).picks.host,opening.offers.host[0]);assert.equal(metadata(next).picks.guest,opening.offers.guest[0]);
 assert.equal(metadata(next).clock.since,21000);assert.equal(snapshot(next,22000).clock.w,119000);
 assert.throws(()=>apply(r,'host',{type:'anomaly_pick',anomalyId:'not-offered'},2000),/offered/);
});
test('reroll preserves deadline and can only be used once',()=>{
 let r=draft();r.chaosState.playerAnomaly='temperance';let d=metadata(r).draft;
 const before=[...d.choices];r=apply(r,'host',{type:'power_reroll',draftId:d.id,modifierId:before[0]},10000);d=metadata(r).draft;
 assert.equal(d.deadline,25000);assert.equal(d.choices.length,4);assert.ok(!d.choices.includes(before[0]));
 assert.throws(()=>apply(r,'host',{type:'power_reroll',draftId:d.id,modifierId:d.choices[0]},11000),/unavailable/);
});
test('assigned-piece and spawn effects are applied server-side',()=>{
 for (const id of ['camel','knight-horde','undead-army']) {
  let r=draft();const d=metadata(r).draft;d.choices=[id];
  if(id==='undead-army'){const g=new Chess(r.fen);g.remove('a2');r.fen=g.fen();}
  const before=new Chess(r.fen).board().flat().filter(Boolean).length;
  r=apply(r,'host',{type:'power_pick',draftId:d.id,modifierId:id},6000);
  if(id==='camel')assert.equal(cleanState(r.chaosState).assignedSquares.w_camel,'b1');
  else assert.equal(new Chess(r.fen).board().flat().filter(Boolean).length,before+(id==='knight-horde'?2:1));
 }
});

test('joining preserves public matchmaking eligibility after the queue listing closes',()=>{const r=fresh();r.isMatchmaking=true;r.chaosState=startServerOpening(r,1000);r.isMatchmaking=false;assert.equal(metadata(r).ratedQueue,true);let casual=fresh();casual.isMatchmaking=false;casual.chaosState=startServerOpening(casual,1000);assert.equal(metadata(casual).ratedQueue,false);});
