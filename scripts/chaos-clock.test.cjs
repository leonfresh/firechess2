const ts = require('typescript'), fs = require('fs');
require.extensions['.ts'] = (mod,file) => mod._compile(ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),file);
const {test}=require('node:test'),assert=require('node:assert/strict');
const {Chess}=require('chess.js');
const {reduceCommand,metadata,cleanState,expireClock,snapshot}=require('../lib/chaos-room-sync.ts');
const {createChaosState,ALL_MODIFIERS}=require('../lib/chaos-chess.ts');
const {projectClock,timeControl}=require('../lib/chaos-clock.ts');
let sequence=0;
const fresh=()=>({id:'r',hostId:'h',guestId:'g',hostColor:'white',fen:new Chess().fen(),chaosState:createChaosState(),status:'playing',moveHistory:[],timeControlSeconds:120,incrementSeconds:1});
function command(room,message){return {id:`clock-action-${++sequence}`.padEnd(20,'0'),baseRevision:metadata(room).stateRevision,message}}
function apply(room,actor,message,now){return {...room,...reduceCommand(room,actor,command(room,message),now)}}
function ready(){let r=apply(fresh(),'h',{type:'anomaly_pick',anomalyId:null},1000);assert.equal(metadata(r).clock,undefined);return apply(r,'g',{type:'anomaly_pick',anomalyId:null},2000)}
function move(r,from='e2',to='e4'){let g=new Chess(r.fen);g.move({from,to});return {type:'move',fen:g.fen(),lastMoveFrom:from,lastMoveTo:to,chaosState:cleanState(r.chaosState),timerWhiteMs:86400000,timerBlackMs:0}}
test('clock starts after both openings; accepted move charges elapsed time, ignores forged clocks and adds one increment',()=>{
 let r=ready();assert.deepEqual(metadata(r).clock,{w:120000,b:120000,active:'w',since:2000});
 const c=command(r,move(r));r={...r,...reduceCommand(r,'h',c,7000)};
 assert.deepEqual(metadata(r).clock,{w:116000,b:120000,active:'b',since:7000});
 assert.equal(reduceCommand(r,'h',c,9000),null);assert.equal(snapshot(r,10000).clock.b,117000);
});
test('a read settles an absent player timeout and rejects their late move',()=>{
 let r=ready();const patch=expireClock(r,122001);assert.equal(patch.status,'finished');assert.equal(metadata({...r,...patch}).result.winner,'black');
 const late=reduceCommand(r,'h',command(r,move(r)),122001);assert.equal(late.status,'finished');assert.equal(late.fen,undefined);
 assert.equal(metadata({...r,...patch}).events.at(-1).actor,'system');assert.equal(expireClock({...r,...patch},130000),null);
});
test('opening and draft wait do not charge either clock; picking resumes the next side',()=>{
 let r=ready();r.fen=new Chess().fen().replace('0 1','0 5');
 r=apply(r,'h',{type:'draft_freeze'},7000);assert.equal(metadata(r).clock.active,null);
 assert.deepEqual(snapshot(r,27000).clock,{w:115000,b:120000,active:null,since:27000});
 const m=move(r);m.type='draft';m.chaosState={...m.chaosState,playerModifiers:[ALL_MODIFIERS.find(m=>m.id==='pawn-charge')],draftStep:1};
 r=apply(r,'h',m,27000);assert.equal(metadata(r).clock.w,116000);assert.equal(metadata(r).clock.active,'b');
});
test('cannot pause the opponent or invent an early draft',()=>{
 const r=ready();assert.throws(()=>apply(r,'g',{type:'draft_freeze'},3000),/unavailable/);assert.throws(()=>apply(r,'h',{type:'draft_freeze'},3000),/unavailable/);
});
test('rematch restores full clocks and starts White after swapping seats',()=>{
 let r=ready();r=apply(r,'h',{type:'resign'},9000);assert.equal(metadata(r).clock.active,null);
 r=apply(r,'h',{type:'rematch'},10000);r=apply(r,'g',{type:'rematch'},11000);
 assert.equal(r.hostColor,'black');assert.deepEqual(metadata(r).clock,{w:120000,b:120000,active:'w',since:11000});
});
test('untimed games have no clock and invalid presets normalize safely',()=>{
 let r={...fresh(),timeControlSeconds:-1};r=apply(r,'h',{type:'anomaly_pick',anomalyId:null},1000);r=apply(r,'g',{type:'anomaly_pick',anomalyId:null},2000);
 assert.equal(metadata(r).clock,undefined);assert.equal(expireClock(r,9999999),null);
 assert.equal(timeControl(600,5).label,'10+5');assert.equal(timeControl(1e9,-5).label,'5+3');
 assert.equal(projectClock({w:120000,b:120000,active:'w',since:5000},4000).w,120000);
});
