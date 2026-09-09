const ts=require('typescript'),fs=require('fs'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
require.extensions['.ts']=(m,p)=>m._compile(ts.transpile(fs.readFileSync(p,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),p);
const {Chess}=require('chess.js');const {getChaosMoves,executeChaosMove}=require('../lib/chaos-moves.ts');
(async()=>{const base=process.env.CHAOS_TEST_ORIGIN||'https://1546003954616500245.discordsays.com/.proxy';const host='guest_'+randomUUID(),guest='guest_'+randomUUID();
async function req(user,path,body,status=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'X-Guest-Id':user,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
const room=await req(host,'/api/chaos/create',{hostColor:'white',timeControlSeconds:300,incrementSeconds:3});let state;
try{await req(guest,'/api/chaos/join',{roomCode:room.roomCode});state=await req(host,'/api/chaos/sync?roomId='+room.roomId);const send=async(user,message)=>state=await req(user,'/api/chaos/sync',{roomId:room.roomId,id:randomUUID(),baseRevision:state.stateRevision,message});
await send(host,{type:'anomaly_pick',anomalyId:'devil'});await send(guest,{type:'anomaly_pick',anomalyId:'devil'});
for(const k of ['playerModifiers','aiModifiers'])assert.ok(state.snapshot.chaosState[k].some(m=>m.id==='pawn-capture-forward'));
await req(host,'/api/chaos/sync',{roomId:room.roomId,id:randomUUID(),baseRevision:state.stateRevision,message:{type:'ability',square:'e7'}},400);
for(const [from,to,special]of[['e2','e4'],['e7','e5'],['e4','e5',true],['d7','d6'],['d2','d4'],['d6','d5'],['e5','e6'],['d5','d4',true]]){
let game=new Chess(state.snapshot.fen);const side=game.turn(),mods=state.snapshot.chaosState[side==='w'?'playerModifiers':'aiModifiers'];
if(special){const m=getChaosMoves(game,mods,side).find(m=>m.from===from&&m.to===to);assert.ok(m);game=executeChaosMove(game,m,mods);assert.ok(game);}else game.move({from,to});
await send(side==='w'?host:guest,{type:'move',fen:game.fen(),chaosState:state.snapshot.chaosState,lastMoveFrom:from,lastMoveTo:to});
assert.equal(new Chess(state.snapshot.fen).get(to).color,side);
}
console.log('PASS '+room.roomCode+': both colors received Pitchfork Pawns, forward captures committed through Discord proxy, old freeze rejected.');
}finally{if(state)await req(host,'/api/chaos/sync',{roomId:room.roomId,id:randomUUID(),baseRevision:state.stateRevision,message:{type:'resign'}});console.log('Test room ended.');}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
