const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),{Chess}=require('chess.js');
const chessModule={exports:{}};
vm.runInNewContext(ts.transpile(fs.readFileSync('lib/chaos-chess.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{module:chessModule,exports:chessModule.exports,require:n=>n==='./chaos-anomalies'?{ALL_ANOMALIES:[]}:require(n)});
const mod={exports:{}};vm.runInNewContext(ts.transpile(fs.readFileSync('lib/chaos-impact.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{module:mod,exports:mod.exports,require:n=>n==='./chaos-chess'?chessModule.exports:require(n)});
const {kamikazeImpact}=mod.exports;
for(const color of ['w','b'])test(`mutual kill animates both pieces for ${color}, once per board change`,()=>{
 const g=new Chess(`7k/8/8/3b4/8/2N5/8/K7 ${color} - - 0 1`);
 if(color==='b'){g.put({type:'b',color:'w'},'c3');g.put({type:'n',color:'b'},'d5');}
 const before=g.fen();g.remove('c3');g.remove('d5');const after=g.fen();
 const hit=kamikazeImpact(before,after,{w:true,b:true});
 assert.equal(hit.square,color==='w'?'d5':'c3');assert.equal(hit.pieces.length,2);
 assert.equal(kamikazeImpact(after,after,{w:true,b:true}),null);
 assert.equal(kamikazeImpact(before,after,{w:false,b:false}),null);
});
test('ordinary captures and restored initial positions do not look like mutual kills',()=>{
 const g=new Chess('7k/8/8/3b4/8/2N5/8/K7 w - - 0 1'),before=g.fen();g.move({from:'c3',to:'d5'});
 assert.equal(kamikazeImpact(before,g.fen(),{w:false,b:true}),null);
 assert.equal(kamikazeImpact(new Chess().fen(),g.fen(),{w:true,b:true}),null);
});
const state={white:[],black:[],playerNuclearCooldownUntil:0,aiNuclearCooldownUntil:0};
const frame=(fen,extra={})=>({fen,state,...extra});
const {watchTransition}=mod.exports;
test('watch cues capture, promotion, castling and ordinary check',()=>{
 let g=new Chess('7k/8/8/3b4/8/2N5/8/K7 w - - 0 1'),before=g.fen();g.move('Nxd5');
 assert.equal(watchTransition(frame(before),frame(g.fen(),{from:'c3',to:'d5'})).effects[0].kind,'capture');
 g=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');before=g.fen();g.move({from:'a7',to:'a8',promotion:'q'});
 assert.equal(watchTransition(frame(before),frame(g.fen(),{from:'a7',to:'a8'})).effects[0].kind,'promotion');
 g=new Chess('4k3/8/8/8/8/8/8/4K2R w K - 0 1');before=g.fen();g.move('O-O');
 assert.equal(watchTransition(frame(before),frame(g.fen(),{from:'e1',to:'g1'})).effects.filter(e=>e.kind==='castle').length,2);
 g=new Chess('7k/8/8/8/8/8/R7/K7 w - - 0 1');before=g.fen();g.move('Rh2+');
 assert.ok(watchTransition(frame(before),frame(g.fen(),{from:'a2',to:'h2'})).effects.some(e=>e.kind==='check'));
});
test('watch requires the authoritative result for mate, including unchanged final frames',()=>{
 const g=new Chess();['f3','e5','g4'].forEach(m=>g.move(m));const before=g.fen();g.move('Qh4#');const after=g.fen();
 assert.ok(!watchTransition(frame(before),frame(after,{from:'d8',to:'h4'})).effects.some(e=>e.kind==='checkmate'));
 const result={winner:'black',reason:'Chaos checkmate'};
 assert.equal(watchTransition(frame(before),frame(after),result).sound,'chaos-mate');
 assert.equal(watchTransition(frame(after),frame(after),result).effects[0].square,'e1');
 assert.equal(watchTransition(frame(after),frame(after)).sound,null);
});
test('watch does not invent effects when a live poll skips moves',()=>{
 const g=new Chess(),before=g.fen();g.move('e4');g.move('d5');g.move('exd5');
 assert.equal(watchTransition(frame(before),frame(g.fen(),{from:'e4',to:'d5'})).effects.length,0);
});
test('watch handles kamikaze snapshots, nuclear cooldowns and new drafts',()=>{
 const before='7k/8/8/3b4/8/2N5/8/K7 w - - 0 1',after='7k/8/8/8/8/8/8/K7 b - - 0 1';
 const armed={...state,black:['kamikaze-bishop']};
 assert.equal(watchTransition(frame(before,{state:armed}),frame(after,{state:armed,from:'c3',to:'d5'})).effects[0].kind,'kamikaze');
 const g=new Chess('7k/8/8/3b4/8/3Q4/8/K7 w - - 0 1'),start=g.fen();g.move('Qxd5');
 const nuclear={...state,white:['nuclear-queen']};
 assert.equal(watchTransition(frame(start,{state:nuclear}),frame(g.fen(),{from:'d3',to:'d5',state:{...nuclear,playerNuclearCooldownUntil:6}})).effects[0].kind,'nuclear');
 assert.equal(watchTransition(frame(start),frame(start,{state:nuclear})).effects[0].kind,'power');
});
test('power picks highlight the actual affected squares instead of d4',()=>{
 const fen=new Chess().fen();
 const one=watchTransition(frame(fen),frame(fen,{state:{...state,white:['archbishop'],assignedSquares:{w_archbishop:'f1'}}}));
 assert.deepEqual(Array.from(one.effects,e=>e.square),['f1']);
 const all=watchTransition(frame(fen),frame(fen,{state:{...state,black:['kamikaze-bishop']}}));
 assert.deepEqual(Array.from(all.effects,e=>e.square).sort(),['c8','f8']);
 const unknown=watchTransition(frame(fen),frame(fen,{state:{...state,white:['archbishop']}}));
 assert.equal(unknown.effects.length,0,'do not invent an assignment missing from an older replay');
 const dead=watchTransition(frame(fen),frame(fen,{state:{...state,white:['archbishop'],assignedSquares:{w_archbishop:null}}}));
 assert.equal(dead.effects.length,0);
});
test('power reveal is preserved when archive combines a move and its draft pick',()=>{
 const g=new Chess(),before=g.fen();g.move('e4');
 const result=watchTransition(frame(before),frame(g.fen(),{from:'e2',to:'e4',state:{...state,white:['dragon-bishop']}}));
 assert.deepEqual(Array.from(result.effects.filter(e=>e.kind==='power'),e=>e.square).sort(),['c1','f1']);
});

const {sniperImpact}=mod.exports;
// Fixtures keep the black king OFF the c3 bishop's diagonal (g8, not g7/h8) and put the
// victim ON it (b4), so the board is quiet before the shot and the capture is legal.
test('a sniper shot reads as one vanished piece with the shooter still standing',()=>{
 const g=new Chess('6k1/8/8/8/1n6/2B5/8/K7 w - - 0 1'),before=g.fen();
 g.remove('b4');const after=g.fen();
 const hit=sniperImpact(before,after,{w:true,b:false});
 assert.equal(hit.square,'b4');assert.equal(hit.pieces.length,1);assert.equal(hit.pieces[0],'bN');
 assert.equal(sniperImpact(before,after,{w:false,b:false}),null);
 assert.equal(sniperImpact(after,after,{w:true,b:false}),null);
});
test('a normal capture and a kamikaze kill are never mistaken for a sniper shot',()=>{
 const g=new Chess('6k1/8/8/8/1n6/2B5/8/K7 w - - 0 1'),before=g.fen();
 const capturing=new Chess(before);capturing.move({from:'c3',to:'b4'});
 assert.equal(sniperImpact(before,capturing.fen(),{w:true,b:false}),null);
 const killed=new Chess(before);killed.remove('b4');killed.remove('c3');
 assert.equal(sniperImpact(before,killed.fen(),{w:true,b:true}),null);
});
test('the watch cues a sniper shot with PEW! and leaves ordinary moves alone',()=>{
 const g=new Chess('6k1/8/8/8/1n6/2B5/8/K7 w - - 0 1'),before=g.fen();
 g.remove('b4');const after=g.fen().replace(' w ',' b ');
 const armedState={white:['sniper-bishop'],black:[],playerNuclearCooldownUntil:0,aiNuclearCooldownUntil:0};
 const transition=watchTransition(frame(before,{state:armedState}),frame(after,{from:'c3',to:'b4',state:armedState}));
 const kinds=transition.effects.map(e=>e.kind);
 assert.ok(kinds.includes('sniper'),'expected a sniper effect, got '+kinds.join(','));
 assert.equal(transition.sound,'chaos-pew');
 const plain=new Chess('6k1/8/8/8/8/2B5/8/K7 w - - 0 1'),plainBefore=plain.fen();plain.move({from:'a1',to:'b1'});
 assert.equal(watchTransition(frame(plainBefore),frame(plain.fen(),{from:'a1',to:'b1'})).sound,'move');
});
