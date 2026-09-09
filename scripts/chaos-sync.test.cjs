/* Run: node --test scripts/chaos-sync.test.cjs */
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpile(require('fs').readFileSync(file, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), file);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Chess } = require('chess.js');
const { reduceCommand, metadata, cleanState } = require('../lib/chaos-room-sync.ts');
const { createChaosState } = require('../lib/chaos-chess.ts');
let sequence = 0;
const fresh = () => ({ id: 'room', hostId: 'host', guestId: 'guest', hostColor: 'white', fen: new Chess().fen(), chaosState: createChaosState(), status: 'playing', moveHistory: [] });
function command(room, message) { return { id: `test-action-${String(++sequence).padStart(12, '0')}`, baseRevision: metadata(room).stateRevision, message }; }
function apply(room, actor, message) { return { ...room, ...reduceCommand(room, actor, command(room, message)) }; }
function ready() { let r=fresh(); r=apply(r,'host',{type:'anomaly_pick',anomalyId:null}); return apply(r,'guest',{type:'anomaly_pick',anomalyId:null}); }
function move(r, from='e2',to='e4') { const g=new Chess(r.fen);g.move({from,to});return {type:'move',fen:g.fen(),lastMoveFrom:from,lastMoveTo:to,chaosState:cleanState(r.chaosState),status:'playing'}; }
test('opening choices persist independently and moves wait for both',()=>{
 let r=fresh();assert.throws(()=>apply(r,'host',move(r)),/Both opening/);
 r=apply(r,'host',{type:'anomaly_pick',anomalyId:null});assert.equal(metadata(r).picks.host,null);assert.equal(metadata(r).picks.guest,undefined);
 r=apply(r,'guest',{type:'anomaly_pick',anomalyId:'sun'});assert.equal(cleanState(r.chaosState).aiAnomaly,'sun');
 assert.throws(()=>apply(r,'guest',{type:'anomaly_pick',anomalyId:'world'}),/already saved/);
});
test('only room members can act, and color is derived from membership',()=>{
 const r=ready();assert.throws(()=>apply(r,'outsider',move(r)),/Not in this room/);assert.throws(()=>apply(r,'guest',{...move(r),color:'white'}),/not your turn/);
});
test('duplicate acknowledgements do not append another move',()=>{
 const r=ready(),c=command(r,move(r));const next={...r,...reduceCommand(r,'host',c)};
 assert.equal(next.moveHistory.length,1);assert.equal(reduceCommand(next,'host',c),null);
});
test('stale commands cannot overwrite a newer position',()=>{
 const r=ready(),stale=command(r,move(r,'d2','d4'));const next=apply(r,'host',move(r));
 assert.throws(()=>reduceCommand(next,'host',stale),/board changed/);assert.equal(new Chess(next.fen).get('e4').type,'p');
});
test('invalid positions, forged powers and altered ordinary moves are rejected',()=>{
 const r=ready(),m=move(r);assert.throws(()=>apply(r,'host',{...m,fen:'bad'}),/Invalid board/);
 assert.throws(()=>apply(r,'host',{...m,fen:new Chess().fen()}),/Board changes/);
 assert.throws(()=>apply(r,'host',{...m,chaosState:{...m.chaosState,playerModifiers:[{id:'invented'}]}}),/Unknown/);
});
test('draw acceptance requires an opponent offer',()=>{
 let r=ready();assert.throws(()=>apply(r,'host',{type:'draw-accept'}),/No opponent/);r=apply(r,'host',{type:'draw-offer'});
 assert.throws(()=>apply(r,'host',{type:'draw-accept'}),/No opponent/);r=apply(r,'guest',{type:'draw-accept'});assert.equal(r.status,'finished');
});
test('rematch resets only after both requests and swaps persisted colors once',()=>{
 let r=ready();r=apply(r,'host',move(r));r=apply(r,'guest',{type:'resign'});const oldFen=r.fen;
 r=apply(r,'host',{type:'rematch'});assert.equal(r.fen,oldFen);assert.equal(r.hostColor,'white');
 const c=command(r,{type:'rematch'});r={...r,...reduceCommand(r,'guest',c)};
 assert.equal(r.fen,new Chess().fen());assert.equal(r.hostColor,'black');assert.equal(r.moveHistory.length,0);assert.equal(reduceCommand(r,'guest',c),null);
});
test('missed events remain ordered and replayable',()=>{
 let r=ready();r=apply(r,'host',move(r));r=apply(r,'guest',move(r,'e7','e5'));
 assert.deepEqual(metadata(r).events.map(e=>e.revision),[1,2,3,4]);assert.equal(metadata(r).events.at(-1).message.fen,r.fen);
 assert.equal(cleanState(r.chaosState)._sync,undefined);
});
const { ALL_MODIFIERS } = require('../lib/chaos-chess.ts');
const { getChaosMoves, executeChaosMove } = require('../lib/chaos-moves.ts');

for (const side of ['w','b']) test(`${side}: Battlefield Promotion accepts all four choices on the advertised rank`,()=>{
  for (const promoted of ['q','r','b','n']) {
    let r=ready();const from=side==='w'?'d4':'d5',to=side==='w'?'d5':'d4';
    const g=new Chess(`7k/8/8/8/8/8/8/K7 ${side} - - 0 10`);g.put({type:'p',color:side},from);r.fen=g.fen();
    const mods=[ALL_MODIFIERS.find(m=>m.id==='pawn-promotion-early')];
    r.chaosState={...r.chaosState,[side==='w'?'playerModifiers':'aiModifiers']:mods};
    const cm=getChaosMoves(g,mods,side).find(m=>m.from===from&&m.to===to);assert.ok(cm);
    const after=executeChaosMove(g,{...cm,spawnPiece:{type:promoted,color:side}},mods);
    const next=apply(r,side==='w'?'host':'guest',{type:'chaos_move',newFen:after.fen(),lastMoveFrom:from,lastMoveTo:to,chaosState:cleanState(r.chaosState)});
    assert.equal(new Chess(next.fen).get(to).type,promoted);
  }
});

for (const side of ['w','b']) test(`${side}: server preserves sniper Archbishop assignment despite a stale client and follows a king swap`,()=>{
  for (const id of ['sniper-bishop','usurper']) {
    let r=ready();
    const g=new Chess(`7k/8/8/8/3${side==='w'?'B':'b'}4/8/8/K7 ${side} - - 0 10`);
    if(id==='sniper-bishop') g.put({type:'n',color:side==='w'?'b':'w'},'b2');
    r.fen=g.fen();
    const mods=['archbishop',id].map(id=>ALL_MODIFIERS.find(m=>m.id===id));
    r.chaosState={...r.chaosState,[side==='w'?'playerModifiers':'aiModifiers']:mods,assignedSquares:{[`${side}_archbishop`]:'d4'}};
    const cm=getChaosMoves(g,mods,side,r.chaosState.assignedSquares).find(m=>m.modifierId===id && (id!=='usurper'||m.to==='d4'));
    assert.ok(cm);
    const after=executeChaosMove(g,cm,mods);
    const proposed={...cleanState(r.chaosState),assignedSquares:{[`${side}_archbishop`]:'e5'}};
    const next=apply(r,side==='w'?'host':'guest',{type:'chaos_move',newFen:after.fen(),lastMoveFrom:cm.from,lastMoveTo:cm.to,chaosState:proposed});
    assert.equal(cleanState(next.chaosState).assignedSquares[`${side}_archbishop`],id==='usurper'?cm.from:'d4');
  }
});

for (const side of ['w','b']) test(`Amazon + Nuclear Queen shares a five-turn cooldown for ${side}`,()=>{
 const mods=['amazon','nuclear-queen'].map(id=>ALL_MODIFIERS.find(m=>m.id===id));
 const fen=side==='w'?'7k/8/1rp5/8/3Q4/8/8/7K w - - 0 10':'7k/8/8/3q4/8/1RP5/8/7K b - - 0 10';
 const from=side==='w'?'d4':'d5',to=side==='w'?'c6':'c3',neighbor=side==='w'?'b6':'b3';
 const key=side==='w'?'playerNuclearCooldownUntil':'aiNuclearCooldownUntil';
 const actor=side==='w'?'host':'guest';
 let r=ready();r.fen=fen;r.chaosState={...r.chaosState,[side==='w'?'playerModifiers':'aiModifiers']:mods};
 const capture=(room,until)=>{const g=new Chess(room.fen);const cm=getChaosMoves(g,mods,side).find(m=>m.from===from&&m.to===to);assert.ok(cm);const next=executeChaosMove(g,cm,mods,[],until);return {type:'chaos_move',newFen:next.fen(),lastMoveFrom:from,lastMoveTo:to,chaosState:{...cleanState(room.chaosState),[key]:0}};};
 const fired=apply(r,actor,capture(r,0));assert.equal(cleanState(fired.chaosState)[key],15);assert.equal(new Chess(fired.fen).get(neighbor),undefined);
 r.fen=fen.replace('0 10','0 14');r.chaosState={...r.chaosState,[key]:15};
 assert.throws(()=>apply(r,actor,capture(r,0)),/Board changes/,'Early explosion must be rejected');
 const cooling=apply(r,actor,capture(r,15));assert.ok(new Chess(cooling.fen).get(neighbor));assert.equal(cleanState(cooling.chaosState)[key],15,'Cannot erase cooldown with client state');
 r.fen=fen.replace('0 10','0 15');const readyAgain=apply(r,actor,capture(r,15));assert.equal(new Chess(readyAgain.fen).get(neighbor),undefined);assert.equal(cleanState(readyAgain.chaosState)[key],20);
});

test('legacy saved freeze state remains enforced until its existing duration expires',()=>{
 let r=fresh();r=apply(r,'host',{type:'anomaly_pick',anomalyId:'devil'});r=apply(r,'guest',{type:'anomaly_pick',anomalyId:null});
 r.chaosState.aiFrozenSquare='e7';r.chaosState.aiFrozenTurnsLeft=2;
 assert.throws(()=>apply(r,'host',{type:'ability',square:'d7'}),/cannot target/);
 r=apply(r,'host',move(r));
 assert.throws(()=>apply(r,'guest',move(r,'e7','e5')),/frozen/);
 r=apply(r,'guest',move(r,'d7','d5'));r=apply(r,'host',move(r,'d2','d4'));
 assert.equal(cleanState(r.chaosState).aiFrozenSquare,null);
 assert.doesNotThrow(()=>apply(r,'guest',move(r,'e7','e5')));
});

test('protection is server-validated for both colors and cannot target an enemy',()=>{
 let r=fresh();r=apply(r,'host',{type:'anomaly_pick',anomalyId:null});r=apply(r,'guest',{type:'anomaly_pick',anomalyId:'justice'});
 r=apply(r,'host',move(r));
 assert.throws(()=>apply(r,'guest',{type:'ability',square:'e4'}),/cannot target/);
 r=apply(r,'guest',{type:'ability',square:'d7'});
 assert.equal(cleanState(r.chaosState).aiImmuneSquare,'d7');
 r=apply(r,'guest',move(r,'d7','d5'));
 assert.throws(()=>apply(r,'host',move(r,'e4','d5')),/protected/);
});

test('client cannot end a playable room by sending a finished flag',()=>{
 const r=ready();assert.equal(apply(r,'host',{...move(r),status:'finished'}).status,'playing');
});

test('saved playtest king can capture the distant queen to escape apparent mate',()=>{
 const {chaosOutcome}=require('../lib/chaos-outcome.ts');
 const g=new Chess('1Q4k1/5ppp/4p3/8/8/1B6/P1P2P1P/5K2 b - - 0 26');
 const state={...createChaosState(),aiModifiers:[ALL_MODIFIERS.find(m=>m.id==='king-ascension')]};
 assert.equal(g.isCheckmate(),true);
 assert.equal(chaosOutcome(g,state),null);
 assert.ok(getChaosMoves(g,state.aiModifiers,'b').some(m=>m.from==='g8'&&m.to==='b8'));
});
test('powered moves cannot smuggle unrelated board edits',()=>{
 let r=ready();r.chaosState={...r.chaosState,playerModifiers:[ALL_MODIFIERS.find(m=>m.id==='camel')],assignedSquares:{w_camel:'b1'}};
 const g=new Chess(r.fen),option=getChaosMoves(g,cleanState(r.chaosState).playerModifiers,'w',{w_camel:'b1'}).find(m=>m.from==='b1'&&m.to==='a4');
 assert.ok(option);const after=executeChaosMove(g,option,cleanState(r.chaosState).playerModifiers,[]);
 const msg={type:'chaos_move',newFen:after.fen(),lastMoveFrom:'b1',lastMoveTo:'a4',chaosState:{...cleanState(r.chaosState),assignedSquares:{w_camel:'a4'}},status:'playing'};
 assert.doesNotThrow(()=>apply(r,'host',msg));after.remove('d8');assert.throws(()=>apply(r,'host',{...msg,newFen:after.fen()}),/Board changes/);
});
test('both players can bundle their move followed by their power pick',()=>{
 let r=ready();for(const [actor,from,to] of [['host','e2','e4'],['guest','e7','e5'],['host','g1','f3'],['guest','b8','c6'],['host','f1','c4'],['guest','g8','f6'],['host','d2','d3'],['guest','f8','c5']])r=apply(r,actor,move(r,from,to));
 r=apply(r,'host',{type:'draft_freeze'});
 let m=move(r,'c2','c3');m.type='draft';m.chaosState={...m.chaosState,playerModifiers:[ALL_MODIFIERS.find(m=>m.id==='camel')],draftStep:1};
 r=apply(r,'host',m);assert.equal(metadata(r).frozenBy,undefined);
 m=move(r,'d7','d6');m.type='draft';m.chaosState={...m.chaosState,aiModifiers:[ALL_MODIFIERS.find(m=>m.id==='dragon-rook')],currentPhase:1,draftStep:2};
 r=apply(r,'guest',m);assert.equal(cleanState(r.chaosState).currentPhase,1);assert.equal(metadata(r).stateRevision,10);assert.equal(new Chess(r.fen).turn(),'w');
});
test('anomaly-injected powers agree for both players',()=>{
 let r=fresh();r=apply(r,'host',{type:'anomaly_pick',anomalyId:null});r=apply(r,'guest',{type:'anomaly_pick',anomalyId:'chariot'});
 assert.ok(cleanState(r.chaosState).aiModifiers.length);assert.doesNotThrow(()=>apply(r,'host',move(r)));
});
test('empty draft messages cannot replace the board',()=>{
 const r=ready();const other=new Chess(r.fen);other.remove('d8');
 assert.throws(()=>apply(r,'host',{type:'draft',fen:other.fen(),chaosState:cleanState(r.chaosState)}),/Board change requires/);
});

test('Abundance opening pawns persist for both sides before the first move',()=>{
 let r=fresh();r=apply(r,'host',{type:'anomaly_pick',anomalyId:'empress'});r=apply(r,'guest',{type:'anomaly_pick',anomalyId:'empress'});
 const board=new Chess(r.fen);
 for(const square of ['c3','f3'])assert.equal(board.get(square)?.color,'w',`White opening pawn at ${square}`);
 for(const square of ['c6','f6'])assert.equal(board.get(square)?.color,'b',`Black opening pawn at ${square}`);
 assert.doesNotThrow(()=>apply(r,'host',move(r)));
});

test('the retained event window stays bounded and keeps the latest snapshot',()=>{
 let r=ready();for(let i=0;i<70;i++)r={...r,...reduceCommand(r,i%2?'host':'guest',command(r,{type:'chat',text:`isolated test ${i}`}),Date.now()+i*1100)};
 assert.equal(metadata(r).events.length,64);
 assert.equal(metadata(r).events[0].revision,9);
 assert.equal(metadata(r).events.at(-1).revision,72);
 assert.equal(r.fen,new Chess().fen());
});



for (const color of ['w','b']) {
 for (const [power, piece, from, to, extra] of [
  ['dragon-bishop','b','d4','d5',[]],
  ['dragon-rook','r','d4','e5',[]],
  ['rook-cannon','r','d4','d7',[['d5','p',color],['d7','n',color==='w'?'b':'w']]],
 ]) test(`${power} validates a ${color} special move and rejects an unrelated edit`,()=>{
  let r=ready();const board=new Chess('7k/8/8/8/8/8/8/K7 '+color+' - - 0 1');
  board.put({type:piece,color},from);
  for(const [square,type,side] of extra)board.put({type,color:side},square);
  r.fen=board.fen();const modifier=ALL_MODIFIERS.find(m=>m.id===power);assert.ok(modifier);
  const field=color==='w'?'playerModifiers':'aiModifiers';
  r.chaosState={...r.chaosState,[field]:[modifier]};
  const option=getChaosMoves(board,[modifier],color,{}).find(m=>m.from===from&&m.to===to);
  assert.ok(option,'Expected special destination is available');
  const after=executeChaosMove(board,option,[modifier],[]);
  const msg={type:'chaos_move',newFen:after.fen(),lastMoveFrom:from,lastMoveTo:to,chaosState:cleanState(r.chaosState),status:'playing'};
  const actor=color==='w'?'host':'guest';
  const result=apply(r,actor,msg);assert.equal(new Chess(result.fen).get(to)?.type,piece);
  assert.equal(new Chess(result.fen).turn(),color==='w'?'b':'w');
  after.put({type:'q',color},'b2');assert.throws(()=>apply(r,actor,{...msg,newFen:after.fen()}),/Board changes/);
 });
}

test('Devil is passive Pitchfork Pawns for either color and cannot freeze enemies',()=>{
 const {getAnomalyById}=require('../lib/chaos-anomalies.ts');
 const {getChaosMoves,executeChaosMove,getChaosAttackedSquares}=require('../lib/chaos-moves.ts');
 const {rollDraftChoices}=require('../lib/chaos-chess.ts');
 assert.equal(getAnomalyById('devil').trigger,'passive');
 for(const color of ['w','b']){
  let r=fresh();r=apply(r,'host',{type:'anomaly_pick',anomalyId:color==='w'?'devil':null});r=apply(r,'guest',{type:'anomaly_pick',anomalyId:color==='b'?'devil':null});
  const key=color==='w'?'playerModifiers':'aiModifiers',actor=color==='w'?'host':'guest';
  const mods=cleanState(r.chaosState)[key];assert.equal(mods.filter(m=>m.id==='pawn-capture-forward').length,1);
  r.fen=color==='w'?'7k/8/8/4n3/4P3/8/8/K7 w - - 0 1':'7k/8/8/4p3/4N3/8/8/K7 b - - 0 1';
  const from=color==='w'?'e4':'e5',to=color==='w'?'e5':'e4';const game=new Chess(r.fen);
  assert.throws(()=>apply(r,actor,{type:'ability',square:to}),/cannot target/);
  const move=getChaosMoves(game,mods,color).find(m=>m.from===from&&m.to===to);assert.ok(move);
  assert.ok(getChaosAttackedSquares(game,mods,color).has(to));
  const moved=executeChaosMove(game,move,mods);assert.ok(moved);
  const next=apply(r,actor,{type:'move',fen:moved.fen(),lastMoveFrom:from,lastMoveTo:to,chaosState:cleanState(r.chaosState)});
  assert.equal(new Chess(next.fen).get(to).color,color);assert.equal(new Chess(next.fen).get(from),undefined);
  assert.equal(cleanState(next.chaosState).playerFrozenSquare,null);assert.equal(cleanState(next.chaosState).aiFrozenSquare,null);
 }
 for(let seed=0;seed<60;seed++)assert.ok(!rollDraftChoices(1,[],seed,undefined,'devil').some(m=>m.id==='pawn-capture-forward'));
});


test('chat is member-only, bounded, server-attributed and idempotent without changing the board revision',()=>{
 let r=ready();const now=Date.now(), before=metadata(r).stateRevision;
 const c=command(r,{type:'chat',text:'  Good luck!  ',actor:'guest',senderName:'Admin'});
 assert.throws(()=>reduceCommand(r,'outsider',c,now),/Not in this room/);
 r={...r,...reduceCommand(r,'host',c,now)};
 assert.deepEqual(metadata(r).chat[0],{id:c.id,actor:'host',text:'Good luck!',ts:now});
 assert.equal(reduceCommand(r,'host',c,now+1),null);
 assert.throws(()=>reduceCommand(r,'host',command(r,{type:'chat',text:'spam'}),now+200),/Wait a moment/);
 assert.throws(()=>reduceCommand(r,'guest',command(r,{type:'chat',text:'x'.repeat(301)}),now),/Invalid chat/);
 assert.throws(()=>reduceCommand(r,'guest',command(r,{type:'chat',text:'   '}),now),/Invalid chat/);
 for(let i=1;i<=70;i++)r={...r,...reduceCommand(r,'host',command(r,{type:'chat',text:`line ${i}`}),now+i*1100)};
 const snapshot=require('../lib/chaos-room-sync.ts').snapshot(r);
 assert.equal(snapshot.chat.length,50);assert.equal(snapshot.chat.at(-1).text,'line 70');
 assert.equal(metadata(r).stateRevision,before);assert.equal(r.fen,new Chess().fen());
});

test('chat preserves clock elapsed time and draft pause, and a pre-chat move remains valid',()=>{
 let r=ready(), now=Date.now(), moveCommand=command(r,move(r));
 r.chaosState._sync.clock={w:300000,b:300000,active:'w',since:now};
 r={...r,...reduceCommand(r,'guest',command(r,{type:'chat',text:'Hello'}),now+2000)};
 assert.equal(metadata(r).clock.w,298000);
 r={...r,...reduceCommand(r,'host',moveCommand,now+2100)};
 assert.equal(new Chess(r.fen).get('e4').type,'p');
 r.chaosState._sync.draft={id:'draft-test',deadline:now+20000,color:'b',choices:['camel'],phase:1};
 r.chaosState._sync.clock.active=null;
 const remaining=metadata(r).clock.b;
 r={...r,...reduceCommand(r,'host',command(r,{type:'chat',text:'Nice power'}),now+4000)};
 assert.equal(metadata(r).clock.active,null);assert.equal(metadata(r).clock.b,remaining);
});
