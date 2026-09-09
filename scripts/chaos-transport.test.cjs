// Exercises the actual transport hook with a deterministic network and scheduler.
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {randomUUID}=require('node:crypto');
const source=ts.transpile(fs.readFileSync(require('node:path').join(__dirname,'../lib/use-party-room.ts'),'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const packet=(revision=0,extra={})=>({revision,stateRevision:revision,actor:'host',events:[],snapshot:{fen:'saved'},...extra});
function harness(responses, live=false){
 const effects=[],messages=[],calls=[],timers=new Map();let timerId=0;
 const module={exports:{}};
 const react={useEffect:fn=>effects.push(fn),useRef:value=>({current:value}),useCallback:fn=>fn,useState:value=>[value,()=>{}]};
 const sockets=[];
 class FakeSocket {
  static OPEN=1;
  readyState=0; sent=[];
  constructor(){sockets.push(this)}
  send(raw){this.sent.push(JSON.parse(raw))}
  open(){this.readyState=1;this.onopen?.()}
  reply(data,status=200){this.onmessage?.({data:JSON.stringify({type:'response',id:this.sent.at(-1).id,status,data})})}
  changed(){this.onmessage?.({data:JSON.stringify({type:'changed'})})}
  close(){this.readyState=3;this.onclose?.()}
 }
 const ctx={module,exports:module.exports,process:{env:{}},AbortController,AbortSignal,URL,performance,crypto:{randomUUID},
 ...(live?{WebSocket:FakeSocket}:{}),
 require:name=>name==='react'?react:{getGuestId:()=> 'isolated-guest',chaosIdentityHeaders:()=>({'X-Chaos-Identity':'test-identity'})},
 window:{location:{href:'http://localhost:3001/chaos'},addEventListener(){},removeEventListener(){}},document:{addEventListener(){},removeEventListener(){}},
 setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id),
 fetch:async(path,options)=>{calls.push({path,headers:options.headers,body:options.body?JSON.parse(options.body):null});const response=responses.shift();if(response instanceof Error)throw response;assert.ok(response,'Unexpected network call');return {ok:(response.status??200)<400,status:response.status??200,json:async()=>response.data};}};
 vm.runInNewContext(source,ctx);
 const hook=module.exports.usePartyRoom('isolated-room',m=>messages.push(m),'white');
 const cleanup=effects[0]();
 return {hook,messages,calls,cleanup,sockets,async tick(){await settle();const entry=timers.entries().next().value;assert.ok(entry,'Expected scheduled recovery');timers.delete(entry[0]);entry[1]();await settle();}};
}
test('a lost acknowledgement retries the same action ID and original revision',async()=>{
 const h=harness([{data:packet()},new Error('lost response'),{data:packet(1)}]);
 try {await settle();h.hook.send({type:'move',fen:'proposed'});await settle();await h.tick();
 assert.equal(h.calls.length,3);assert.equal(h.calls[1].body.id,h.calls[2].body.id);assert.equal(h.calls[2].body.baseRevision,0);
 assert.equal(h.messages.length,0);
 }finally{h.cleanup();}
});
test('a conflict restores the canonical snapshot and drops dependent queued actions',async()=>{
 const h=harness([{data:packet()},{status:409,data:{...packet(2),error:'stale'}},{data:packet(2)}]);
 try{await settle();h.hook.send({type:'move',fen:'stale'});h.hook.send({type:'draft',fen:'dependent'});await settle();await h.tick();
 assert.equal(h.calls.filter(c=>c.body).length,1);assert.equal(h.messages.at(-1).type,'sync_error');assert.equal(h.messages.at(-1).snapshot.fen,'saved');
 }finally{h.cleanup();}
});
test('refresh recovery uses a snapshot and preserves an explicit skipped opening choice',async()=>{
 const h=harness([{data:packet(5,{opponentPick:null,events:[{revision:5,actor:'guest',message:{type:'move'}}]})}]);
 try{await settle();assert.equal(h.messages[0].type,'sync_snapshot');assert.equal(h.messages[1].type,'anomaly_pick');assert.equal(h.messages[1].anomalyId,null);assert.equal(h.messages.length,2);}finally{h.cleanup();}
});
test('falling behind the event window replaces state instead of replaying partial moves',async()=>{
 const h=harness([{data:packet()},{data:packet(80,{gap:true,events:[{revision:80,actor:'guest',message:{type:'move'}}]})}]);
 try{await settle();await h.tick();assert.equal(h.messages.length,1);assert.equal(h.messages[0].type,'sync_snapshot');}finally{h.cleanup();}
});

test('a live notification delivers an opponent event without waiting for a polling timer',async()=>{
 const h=harness([{data:packet()}],true);
 try {
  await settle();const s=h.sockets[0];s.open();s.reply(packet());await settle();
  s.changed();assert.equal(s.sent.at(-1).type,'read');
  s.reply(packet(1,{events:[{revision:1,actor:'guest',message:{type:'move',fen:'new'}}]}));await settle();
  assert.equal(h.messages.at(-1).fen,'new');assert.equal(h.calls.length,1);
 }finally{h.cleanup();}
});

test('own acknowledgements deliver authoritative clock corrections without replaying the move',async()=>{
 const clock={w:119000,b:120000,active:'b',since:1000};
 const h=harness([{data:packet(0,{snapshot:{clock:null,timeControlSeconds:120,incrementSeconds:1}})},
  {data:packet(1,{snapshot:{clock,timeControlSeconds:120,incrementSeconds:1},events:[{revision:1,actor:'host',message:{type:'move',fen:'new'}}]})}]);
 try {await settle();h.hook.send({type:'move',fen:'new'});await settle();
  assert.equal(h.messages.filter(m=>m.type==='move').length,0);
  assert.equal(h.messages.at(-1).type,'clock_sync');assert.equal(h.messages.at(-1).clock.w,119000);
  assert.equal(h.messages.at(-1).base,120);
 }finally{h.cleanup();}
});

test('server drafts restore the actor own committed move and fixed deadline from its acknowledgement',async()=>{
 const base={draftProtocol:2,openingPicks:{host:null,guest:null},serverNow:1000,fen:'before'};
 const draft={id:'phase-1',color:'white',choices:['camel'],deadline:21000};
 const h=harness([{data:packet(0,{snapshot:base})},{data:packet(1,{snapshot:{...base,fen:'after',draft},events:[{revision:1,actor:'host',message:{type:'move'}}]})}]);
 try {await settle();h.hook.send({type:'move',fen:'after'});await settle();
  const saved=h.messages.filter(m=>m.type==='sync_snapshot').at(-1).snapshot;
  assert.equal(saved.fen,'after');assert.equal(saved.draft.deadline,21000);assert.equal(saved.actor,'host');
  assert.equal(h.messages.filter(m=>m.type==='move').length,0);
 }finally{h.cleanup();}
});

test('unpicked server opening offers do not unlock the board as an ordinary snapshot',async()=>{
 const opening={deadline:21000,offers:{host:['fool'],guest:['sun']}};
 const h=harness([{data:packet(1,{snapshot:{draftProtocol:2,opening,openingPicks:{host:null}},events:[{revision:1,actor:'guest',message:{type:'join'}}]})}]);
 try {await settle();assert.equal(h.messages.filter(m=>m.type==='sync_snapshot'||m.type==='join').length,0);assert.equal(h.messages.find(m=>m.type==='opening_sync').snapshot.opening.deadline,21000);}
 finally{h.cleanup();}
});

test('a socket lost after sending a command retries over HTTP with the same action ID and revision',async()=>{
 const h=harness([{data:packet()},{data:packet(1)}],true);
 try {
  await settle();const s=h.sockets[0];s.open();s.reply(packet());await settle();
  h.hook.send({type:'move',fen:'new'});const action=s.sent.at(-1).action;
  s.close();await settle();
  // Socket reconnect and the immediate fallback cycle both have timers.
  await h.tick();if(h.calls.length<2)await h.tick();
  assert.equal(h.calls[1].body.id,action.id);assert.equal(h.calls[1].body.baseRevision,action.baseRevision);
 }finally{h.cleanup();}
});

test('a notification during an in-flight read causes an immediate follow-up read',async()=>{
 const h=harness([{data:packet()}],true);
 try {
  await settle();const s=h.sockets[0];s.open();s.changed();s.reply(packet());await settle();await h.tick();
  assert.equal(s.sent.length,2);s.reply(packet(1));await settle();
 }finally{h.cleanup();}
});

test('verified identity is carried on room reads and commands',async()=>{const h=harness([{data:packet()},{data:packet(1)}]);try{await settle();h.hook.send({type:'draw-offer'});await settle();assert.equal(h.calls.length,2);for(const call of h.calls)assert.equal(call.headers['X-Chaos-Identity'],'test-identity');}finally{h.cleanup();}});


test('chat history restores after an event gap without duplicate event delivery',async()=>{
 const chat=[{id:'chat-1',actor:'guest',text:'Good game',ts:123}];
 const h=harness([{data:packet(80,{gap:true,snapshot:{chat},events:[{revision:80,actor:'guest',message:{type:'chat',text:'Good game'}}]})}]);
 try{await settle();const sync=h.messages.filter(m=>m.type==='chat_sync');assert.equal(sync.length,1);assert.equal(sync[0].messages[0].id,'chat-1');assert.equal(sync[0].actor,'host');assert.equal(h.messages.filter(m=>m.type==='chat').length,0);}finally{h.cleanup();}
});

test('rejected chat does not discard a queued move or roll back the board',async()=>{
 const h=harness([{data:packet()},{status:429,data:{error:'Wait a moment'}},{data:packet(1)}]);
 try{await settle();h.hook.send({type:'chat',text:'Hello'});h.hook.send({type:'move',fen:'next'});await settle();await h.tick();
 assert.equal(h.calls.filter(c=>c.body).length,2);assert.equal(h.messages.filter(m=>m.type==='sync_error').length,0);assert.equal(h.messages.filter(m=>m.type==='chat_error').length,1);
 }finally{h.cleanup();}
});
