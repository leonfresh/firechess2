const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{Chess}=require('chess.js');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
const {ALL_MODIFIERS}=require('../lib/chaos-chess.ts');
/** Every power on a piece must be visible: as its sculpt, or as a badge when an anomaly skin or a
 * second sculpted power owns the silhouette (standard piece sets and the toy set). */
const art={exports:{}};
vm.runInNewContext(ts.transpile(fs.readFileSync('lib/chaos-piece-art.ts','utf8'),{module:ts.ModuleKind.CommonJS}),art);
const mod={exports:{}};
vm.runInNewContext(ts.transpile(fs.readFileSync('components/chaos-pieces.tsx','utf8'),{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),
 {module:mod,exports:mod.exports,console,require:n=>n==='react'?React:n==='chess.js'?{Chess}:n==='@/lib/chaos-piece-art'?art.exports:n==='@/lib/board-themes'?{getPieceImageUrl:(s,c)=>`/pieces/${s}/${c}.svg`}:{}});
const M=id=>ALL_MODIFIERS.find(m=>m.id===id);
const walk=(n,o=[])=>{if(!n||typeof n!=='object')return o;if(Array.isArray(n)){n.forEach(x=>walk(x,o));return o}o.push(n);walk(n.props?.children,o);return o};
function render(set,anomaly,ids,code,square){
 const pieces=mod.exports.buildChaosCustomPieces(set,ids.map(M),[],'white',new Chess(),{},undefined,undefined,0,0,anomaly,null);
 const nodes=walk(pieces[code]({squareWidth:64,square}));
 return {art:nodes.map(n=>n.props?.style?.backgroundImage).find(Boolean),
  icons:nodes.map(n=>n.props?.emoji).filter(Boolean),
  badges:nodes.map(n=>n.props?.['data-power-badge']).filter(Boolean)};
}
const CASES=[['hierophant',['dragon-bishop'],'wB','c1'],['hierophant',['sniper-bishop'],'wB','c1'],['star',['knook'],'wN','b1'],
 ['star',['night-rider'],'wN','b1'],['emperor',['king-ascension'],'wK','e1'],['fools-king',['usurper'],'wK','e1'],[null,['camel','knook'],'wN','b1']];

for (const [anomaly,ids,code,square] of CASES) test(`standard set: ${anomaly ?? 'no anomaly'} + ${ids.join('+')} shows every power`,()=>{
 const r=render('cburnett',anomaly,ids,code,square);
 const hidden=ids.filter(id=>!r.art.includes(`/${code[0]}${art.exports.FAIRY_PIECE_CODES[id]}.svg`));
 assert.ok(hidden.length>0,'the case really has a power whose sculpt is not on show');
 for(const id of hidden) assert.ok(r.icons.includes(M(id).icon) || r.icons.length>0, `${id} needs a badge`);
 assert.ok(r.icons.length>=hidden.length);
});

for (const [anomaly,ids,code,square] of CASES) test(`toy set: ${anomaly ?? 'no anomaly'} + ${ids.join('+')} badges the hidden power`,()=>{
 const r=render('chaos-toy',anomaly,ids,code,square);
 assert.ok(r.badges.length>=1);
});

test('a single sculpted power shows its sculpt and no duplicate badge',()=>{
 for (const [id,code,square] of [['knook','wN','b1'],['camel','wN','b1'],['king-ascension','wK','e1'],['usurper','wK','e1'],['sniper-bishop','wB','c1']]) {
  const r=render('cburnett',null,[id],code,square);
  assert.equal(r.art,`url(/pieces/fairy/w${art.exports.FAIRY_PIECE_CODES[id]}.svg)`,id);
  assert.deepEqual([...r.icons],[],`${id} is already visible as its sculpt`);
 }
});
