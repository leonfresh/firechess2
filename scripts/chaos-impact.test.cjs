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
