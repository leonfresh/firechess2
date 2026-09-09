const ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
const {test}=require('node:test'),assert=require('node:assert/strict');
const {Chess}=require('chess.js');
const {ALL_MODIFIERS}=require('../lib/chaos-chess.ts');
const {getChaosMoves,executeChaosMove}=require('../lib/chaos-moves.ts');
const mods=['kings-chains','dragon-rook','archbishop','knight-horde'].map(id=>ALL_MODIFIERS.find(m=>m.id===id)).filter(Boolean);
test('screenshot archbishop on c1 can capture checking queen on d3',()=>{
 const game=new Chess('rn2kb2/pp3pp1/8/7p/N1pp4/2Pq3P/PPK2nP1/RNB3NR w - - 0 22');
 const move=getChaosMoves(game,mods,'w',{w_archbishop:'c1'}).find(m=>m.from==='c1'&&m.to==='d3');
 assert.ok(move,'Archbishop must have the c1-d3 knight capture');
 const after=executeChaosMove(game,move,mods,[]);
 assert.equal(after.get('d3')?.type,'b');assert.equal(after.get('d3')?.color,'w');
 assert.equal(after.isAttacked('c2','b'),false);
});

test('AI apparent-checkmate path refreshes the archbishop escape moves',()=>{
 const source=fs.readFileSync(require('node:path').join(__dirname,'../app/chaos/page.tsx'),'utf8');
 const start=source.indexOf('        // If the AI just checkmated the player,');
 const end=source.indexOf('        onComplete?.(activeGame2, cs2);',start);
 assert.ok(start>=0&&end>start);
 const game=new Chess('rn2kb2/pp3pp1/8/7p/N1pp4/2Pq3P/PPK2nP1/RNB3NR w - - 0 22');
 assert.equal(game.isCheckmate(),true,'Ordinary chess incorrectly regards this chaos position as mate');
 let offered=[];
 require('node:vm').runInNewContext(ts.transpile(source.slice(start,end),{target:ts.ScriptTarget.ES2022}),{
  activeGame2:game,playerColor:'white',cs2:{},checkGameEnd:()=>false,setTimeout:fn=>fn(),
  recomputeChaosMoves:()=>{offered=getChaosMoves(game,mods,'w',{w_archbishop:'c1'});},
 });
 assert.ok(offered.some(m=>m.from==='c1'&&m.to==='d3'),'AI handoff must refresh the special capture even when standard chess says mate');
});
