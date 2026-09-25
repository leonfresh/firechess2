const ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
const {test}=require('node:test'),assert=require('node:assert/strict'),{Chess}=require('chess.js');
const {createSyncState,startServerOpening,metadata,reduceCommand,settleRoom,nextDeadline,snapshot,cleanState}=require('../lib/chaos-room-sync.ts');
let seq=0;const cmd=(r,message)=>({id:`opening-test-${++seq}`.padEnd(24,'0'),baseRevision:metadata(r).stateRevision,message});
const apply=(r,actor,message,now)=>({...r,...reduceCommand(r,actor,cmd(r,message),now)});
function fresh(color='white',base=300){let r={id:'abort-test',hostId:'h',guestId:'g',hostColor:color,fen:new Chess().fen(),chaosState:createSyncState(true),status:'playing',moveHistory:[],timeControlSeconds:base,incrementSeconds:3};r.chaosState=startServerOpening(r,1000);return r;}
function ready(color='white',base=300){let r=fresh(color,base);r=apply(r,'h',{type:'anomaly_pick',anomalyId:null},2000);return apply(r,'g',{type:'anomaly_pick',anomalyId:null},3000);}
function move(r,actor,from,to,now){const g=new Chess(r.fen);g.move({from,to});return apply(r,actor,{type:'move',fen:g.fen(),lastMoveFrom:from,lastMoveTo:to,chaosState:cleanState(r.chaosState)},now);}
for(const color of ['white','black']) test(`first-turn abort works with host playing ${color}`,()=>{
 let r=ready(color),white=color==='white'?'h':'g',black=white==='h'?'g':'h';
 assert.deepEqual(snapshot(r).openingMove,{side:'w',deadline:63000});assert.equal(nextDeadline(r),63000);
 assert.equal(settleRoom(r,62999),null);
 const expired={...r,...settleRoom(r,63000)};assert.equal(expired.status,'aborted');assert.equal(metadata(expired).result.winner,'aborted');assert.equal(metadata(expired).clock.active,null);assert.equal(nextDeadline(expired),null);
 r=move(r,white,'e2','e4',32000);assert.deepEqual(metadata(r).openingMove,{side:'b',deadline:92000});
 const late=move(r,black,'e7','e5',92000);assert.equal(late.status,'aborted');assert.equal(late.fen,r.fen);
 r=move(r,black,'e7','e5',91000);assert.equal(metadata(r).openingMove,undefined);assert.equal(settleRoom(r,130000),null);
});
test('chat and repeated reads cannot extend the first-move deadline',()=>{
 let r=ready();r=apply(r,'h',{type:'chat',text:'Hello'},5000);assert.equal(metadata(r).openingMove.deadline,63000);
 assert.equal(snapshot(r,15000).openingMove.deadline,63000);assert.equal(snapshot(r,45000).openingMove.deadline,63000);
 r=apply(r,'g',{type:'draw-offer'},30000);assert.equal(metadata(r).openingMove.deadline,63000);
});
test('anomaly selection time is separate and late settlement uses the actual deadline',()=>{
 let r=fresh();assert.equal(snapshot(r).openingMove,null);assert.equal(nextDeadline(r),21000);
 r=apply(r,'h',{type:'anomaly_pick',anomalyId:null},2000);assert.equal(snapshot(r).openingMove,null);
 r={...r,...settleRoom(r,22000)};assert.equal(metadata(r).openingMove.deadline,81000);
 const late={...fresh(),...settleRoom(fresh(),82000)};assert.equal(late.status,'aborted');
});
test('untimed games also abort and rematches receive a fresh opening window',()=>{
 let r=ready('white',-1);assert.equal(snapshot(r).clock,null);r={...r,...settleRoom(r,63000)};assert.equal(r.status,'aborted');
 r=apply(r,'h',{type:'rematch'},64000);r=apply(r,'g',{type:'rematch'},65000);
 assert.equal(r.status,'playing');assert.equal(r.hostColor,'black');assert.deepEqual(metadata(r).openingMove,{side:'w',deadline:125000});assert.deepEqual(metadata(r).firstMoves,[]);
});
test('the abort message states the real window',()=>{
 let r=ready();r={...r,...settleRoom(r,63000)};assert.equal(metadata(r).result.reason,'White did not make their first move within 60 seconds.');
});
test('existing rooms without the new rule are not retroactively aborted',()=>{
 const r=ready();delete r.chaosState._sync.openingMoveRule;delete r.chaosState._sync.openingMove;
 assert.equal(settleRoom(r,120000),null);
});
