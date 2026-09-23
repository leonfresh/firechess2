const {test}=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
const {kingFinishPieces}=require('../lib/chaos-king-finish.ts');const {achievementProgress}=require('../lib/chaos-achievements.ts');
const fen='7k/8/5N2/8/8/8/8/K7 w - - 0 1';
test('terminal capture resolves victim and attacker without mutating the engine FEN',()=>{assert.deepEqual(kingFinishPieces(fen,{from:'f6',to:'h8'}),{mover:'wN',king:'bK'});assert.equal(fen,'7k/8/5N2/8/8/8/8/K7 w - - 0 1');});
test('ranged capture preserves its stationary flag',()=>{const c={from:'f6',to:'h8',pieceStays:true};assert.ok(kingFinishPieces(fen,c));assert.equal(c.pieceStays,true);});
test('invalid targets and same-side kings cannot produce a king finish',()=>{assert.equal(kingFinishPieces(fen,{from:'f6',to:'a1'}),null);assert.equal(kingFinishPieces(fen,{from:'f6',to:'h7'}),null);assert.equal(kingFinishPieces(fen,{from:'x9',to:'h8'}),null);});
test('achievement threshold does not leak earned dates or replay for locked badges',()=>{assert.equal(achievementProgress('ten-wins',9,'today','match').unlocked,false);assert.equal(achievementProgress('ten-wins',9,'today','match').match,null);assert.equal(achievementProgress('ten-wins',10,'today','match').unlocked,true);assert.equal(achievementProgress('ten-wins',20,'today','match').progress,10);});
test('achievement difficulty tiers cover all four levels without changing earned targets',()=>{
 const {ACHIEVEMENTS}=require('../lib/chaos-achievements.ts');assert.deepEqual([...new Set(ACHIEVEMENTS.map(a=>a.tier))].sort(),['Epic','Legendary','Normal','Rare']);assert.equal(achievementProgress('first-win',1,null,null).tier,'Normal');assert.equal(achievementProgress('king-taker',1,null,null).tier,'Epic');assert.equal(achievementProgress('ten-wins',10,null,null).tier,'Legendary');
});
test('social links encode the exact replay and use the public host without session context',()=>{
 const {achievementShare}=require('../lib/chaos-achievements.ts');const s=achievementShare('king-taker','room:2&test=1');const url=new URL(s.url);assert.equal(url.origin,'https://chaos.firechess.com');assert.equal(url.searchParams.get('match'),'room:2&test=1');assert.equal(url.searchParams.get('achievement'),'king-taker');assert.equal(new URL(s.reddit).searchParams.get('url'),s.url);assert.equal(new URL(s.x).searchParams.get('url'),s.url);assert.equal(new URL(s.facebook).searchParams.get('u'),s.url);assert.match(s.title,/Epic/);assert.equal(achievementShare('invented','match'),null);assert.equal(achievementShare('first-win',''),null);
});
