const ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
const {test}=require('node:test'),assert=require('node:assert/strict'),{Chess}=require('chess.js');
const {ALL_MODIFIERS,SHOP_CARD_IDS,RETIRED_SHOP_CARD_IDS,rollDraftChoices,createChaosState}=require('../lib/chaos-chess.ts');
const {getChaosMoves,getChaosAttackedSquares,executeChaosMove}=require('../lib/chaos-moves.ts');
const {draftChoices}=require('../lib/chaos-server-draft.ts');
const mods=(...ids)=>ids.map(id=>ALL_MODIFIERS.find(m=>m.id===id));
const moves=(g,ids,color='w',opponents=[])=>getChaosMoves(g,mods(...ids),color,undefined,mods(...opponents));

for(const color of ['w','b']) test(`vault jumps blockers and captures on landing for ${color}`,()=>{
 const g=new Chess(`7k/8/3${color==='w'?'p':'P'}4/8/1${color==='w'?'p':'P'}1${color==='w'?'N':'n'}${color==='w'?'P':'p'}3/8/8/K7 ${color} - - 0 1`);
 const legal=moves(g,['vaulting-knight'],color).filter(m=>m.from==='d4');
 assert.deepEqual(legal.map(m=>m.to).sort(),['b4','d2','d6','f4']);
 assert.equal(legal.find(m=>m.to==='b4').type,'capture');
 const next=executeChaosMove(g,legal.find(m=>m.to==='f4'),mods('vaulting-knight'));
 assert.equal(next.get('f4').type,'n');assert.equal(next.get('e4').type,'p');
 assert.equal(next.turn(),color==='w'?'b':'w');
});
test('vault stacks with Camel and Knook without losing either movement',()=>{
 const g=new Chess('7k/8/8/8/3N4/8/8/K7 w - - 0 1');
 const all=moves(g,['vaulting-knight','camel','knook']);
 for(const [id,to] of [['vaulting-knight','f4'],['camel','e7'],['knook','d7']]) assert.ok(all.some(m=>m.modifierId===id&&m.to===to));
});
test('vault cannot capture a king or expose its own king, but its jump gives check',()=>{
 const g=new Chess('4r2k/8/8/8/8/8/4N3/4K3 w - - 0 1');
 assert.ok(!moves(g,['vaulting-knight']).some(m=>m.to==='c2'));
 const check=new Chess('8/8/3k4/8/3N4/8/8/K7 w - - 0 1');
 assert.ok(getChaosAttackedSquares(check,mods('vaulting-knight'),'w').has('d6'));
 assert.ok(!moves(check,['vaulting-knight']).some(m=>m.to==='d6'));
});
test('bank shot follows an empty edge and stops at the first blocker',()=>{
 const g=new Chess('3q1n1k/8/8/8/3R4/8/8/K7 w - - 0 1');
 assert.ok(!moves(g,['bank-shot']).some(m=>m.bounceSquare==='d8'),'occupied bend cannot be used');
 const clear=new Chess('1n3n1k/8/8/8/3R4/8/8/K7 w - - 0 1');
 const top=moves(clear,['bank-shot']).filter(m=>m.bounceSquare==='d8');
 assert.deepEqual(top.map(m=>m.to).sort(),['b8','c8','e8','f8']);
 const hit=top.find(m=>m.to==='f8'),next=executeChaosMove(clear,hit,mods('bank-shot'));
 assert.equal(next.get('f8').type,'r');assert.equal(next.get('d4'),undefined);
});
test('bank-shot attacks drive king safety for the opponent',()=>{
 const g=new Chess('8/8/8/8/3r4/8/1K6/7k w - - 0 1');
 const attacks=getChaosAttackedSquares(g,mods('bank-shot'),'b');
 assert.ok(attacks.has('b1'));assert.ok(attacks.has('b8'));assert.ok(!attacks.has('c3'));
});
test('bank shot collateral follows the final leg instead of the diagonal between endpoints',()=>{
 const g=new Chess('4nn1k/8/8/8/3R4/8/8/K7 w - - 0 1');
 const m=moves(g,['bank-shot','collateral-rook']).find(m=>m.to==='e8'&&m.bounceSquare==='d8');
 assert.ok(m);const next=executeChaosMove(g,m,mods('bank-shot','collateral-rook'));
 assert.equal(next.get('e8').type,'r');assert.equal(next.get('f8'),undefined);
});
test('bank shot never captures a king and a friendly blocker is defended but not a move',()=>{
 const g=new Chess('1N5k/8/8/8/3R4/8/8/K7 w - - 0 1');
 const all=moves(g,['bank-shot']);assert.ok(!all.some(m=>m.to==='b8'||m.to==='h8'));
 const attacks=getChaosAttackedSquares(g,mods('bank-shot'),'w');assert.ok(attacks.has('b8'));assert.ok(attacks.has('h8'));
});
test('retired cards remain decodable but are absent from new drafts',()=>{
 for(const id of RETIRED_SHOP_CARD_IDS) assert.ok(ALL_MODIFIERS.some(m=>m.id===id));
 for(let seed=0;seed<60;seed++) for(let phase=1;phase<=5;phase++) assert.ok(rollDraftChoices(phase,[],seed).every(m=>!RETIRED_SHOP_CARD_IDS.has(m.id)));
});
test('server drafts include only owned shop powers and never return retired powers',()=>{
 const state=createChaosState(),fen=new Chess().fen();let sawVault=false,sawBank=false;
 for(let i=0;i<100;i++) {
  for(let phase=1;phase<=3;phase++) {
   assert.ok(draftChoices(fen,state,'white',phase).every(id=>![...SHOP_CARD_IDS,...RETIRED_SHOP_CARD_IDS].includes(id)));
   const owned=draftChoices(fen,state,'black',phase,[],['vaulting-knight','bank-shot']);
   sawVault ||= owned.includes('vaulting-knight');sawBank ||= owned.includes('bank-shot');
  }
 }
 assert.ok(sawVault&&sawBank);
});

const {createSyncState,cleanState,reduceCommand,metadata}=require('../lib/chaos-room-sync.ts');
for(const color of ['w','b']) for(const id of ['vaulting-knight','bank-shot']) test(`authoritative multiplayer accepts ${id} for ${color}`,()=>{
 const state=createSyncState(true);
 state[color==='w'?'playerModifiers':'aiModifiers']=mods(id);
 state._sync.picks={host:null,guest:null};state._sync.openingMoveRule=false;
 const type=id==='vaulting-knight'?'n':'r';
 const fen=`7k/8/8/8/3${color==='w'?type.toUpperCase():type}4/8/8/K7 ${color} - - 0 1`;
 const board=new Chess(fen),move=moves(board,[id],color).find(m=>m.to===(id==='vaulting-knight'?'f4':'f8'));
 assert.ok(move);const next=executeChaosMove(board,move,mods(id));assert.ok(next);
 const room={id:'new-power-test',hostId:'host',guestId:'guest',hostColor:'white',fen,chaosState:state,status:'playing',moveHistory:[]};
 const patch=reduceCommand(room,color==='w'?'host':'guest',{id:`action-${id}-${color}`,baseRevision:metadata(room).stateRevision,message:{type:'chaos_move',newFen:next.fen(),lastMoveFrom:move.from,lastMoveTo:move.to,chaosState:cleanState(state)}},1000);
 assert.equal(new Chess(patch.fen).get(move.to).type,type);
 assert.equal(patch.moveHistory.length,1);
});

for(const hostColor of ['white','black']) test(`opponent ownership never leaks into the mover's draft when host is ${hostColor}`,()=>{
 for(let i=0;i<25;i++) {
  const state=createSyncState(true);state._sync.picks={host:null,guest:null};state._sync.openingMoveRule=false;
  const actor=hostColor==='white'?'host':'guest',other=actor==='host'?'guest':'host';
  state._sync.shopOwned={[actor]:[],[other]:[...SHOP_CARD_IDS]};
  const board=new Chess(new Chess().fen().replace('0 1','0 5')),fen=board.fen();board.move('e4');
  const room={id:'personal-draft',hostId:'host',guestId:'guest',hostColor,fen,chaosState:state,status:'playing',moveHistory:[]};
  const patch=reduceCommand(room,actor,{id:`personal-draft-${i}`,baseRevision:0,message:{type:'move',fen:board.fen(),lastMoveFrom:'e2',lastMoveTo:'e4',chaosState:cleanState(state)}},1000);
  assert.ok(metadata({...room,...patch}).draft.choices.every(id=>!SHOP_CARD_IDS.has(id)));
 }
});
for(const color of ['w','b']) test(`Phantom is quiet phasing; Cannon retains jump captures for ${color}`,()=>{
 const g=new Chess(`7k/8/8/8/8/8/8/K7 ${color} - - 0 10`),enemy=color==='w'?'b':'w';
 for(const [sq,type,c] of [['d4','r',color],['e4','p',color],['h4','n',enemy]])g.put({type,color:c},sq);
 const phantom=moves(g,['phantom-rook'],color);
 assert.ok(phantom.some(m=>m.from==='d4'&&m.to==='f4'&&m.type==='move'));
 assert.ok(!phantom.some(m=>m.to==='h4'));
 assert.ok(!getChaosAttackedSquares(g,mods('phantom-rook'),color).has('h4'));
 assert.ok(moves(g,['rook-cannon'],color).some(m=>m.to==='h4'&&m.type==='capture'));
 assert.ok(moves(g,['phantom-rook','rook-cannon'],color).some(m=>m.to==='h4'&&m.modifierId==='rook-cannon'));
 g.put({type:'p',color},'f4');assert.ok(moves(g,['phantom-rook'],color).some(m=>m.to==='g4'));
 assert.ok(!moves(g,['rook-cannon'],color).some(m=>m.to==='h4'));
 g.remove('e4');g.remove('f4');assert.ok(g.moves({square:'d4',verbose:true}).some(m=>m.to==='h4'),'normal rook captures stay legal');
 g.put({type:'p',color:enemy},'e4');assert.ok(!moves(g,['phantom-rook'],color).some(m=>['f4','g4','h4'].includes(m.to)));
});
for(const color of ['w','b']) test(`server enforces quiet Phantom phasing for ${color}`,()=>{
 const state=createSyncState(true);state[color==='w'?'playerModifiers':'aiModifiers']=mods('phantom-rook');
 state._sync.picks={host:null,guest:null};state._sync.openingMoveRule=false;
 const g=new Chess(`7k/8/8/8/8/8/8/K7 ${color} - - 0 10`);
 for(const [sq,type,c] of [['d4','r',color],['e4','p',color],['h4','n',color==='w'?'b':'w']])g.put({type,color:c},sq);
 const room={id:'phantom-rule',hostId:'host',guestId:'guest',hostColor:'white',fen:g.fen(),chaosState:state,status:'playing',moveHistory:[]};
 const submit=(to,fen)=>reduceCommand(room,color==='w'?'host':'guest',{id:`phantom-rule-action-${color}-${to}`,baseRevision:metadata(room).stateRevision,message:{type:'chaos_move',newFen:fen,lastMoveFrom:'d4',lastMoveTo:to,chaosState:cleanState(state)}},1000);
 const quiet=moves(g,['phantom-rook'],color).find(m=>m.to==='f4');
 assert.equal(new Chess(submit('f4',executeChaosMove(g,quiet,mods('phantom-rook')).fen()).fen).get('f4').type,'r');
 const illegal=new Chess(g.fen());illegal.remove('d4');illegal.remove('h4');illegal.put({type:'r',color},'h4');
 const fen=illegal.fen().split(' ');fen[1]=color==='w'?'b':'w';
 assert.throws(()=>submit('h4',fen.join(' ')),/Move is not enabled by this piece/);
});


