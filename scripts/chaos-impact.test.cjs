const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),{Chess}=require('chess.js');
const mod={exports:{}};vm.runInNewContext(ts.transpile(fs.readFileSync('lib/chaos-impact.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{module:mod,exports:mod.exports,require});
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
