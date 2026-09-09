const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{Chess}=require('chess.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../components/chaos-pieces.tsx'),'utf8');
const code=source.slice(source.indexOf('type Corner ='),source.length).replace(/export /g,'');
const ctx={React,MODIFIER_OVERLAYS:{},getPieceImageUrl:()=>'',exports:{}};
vm.runInNewContext(ts.transpile(code+'\nexports.build=buildChaosCustomPieces;',{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}),ctx);
function image(node){return node?.props?.style?.backgroundImage || React.Children.toArray(node?.props?.children).map(image).find(Boolean);}
function count(node){return node?.props?.['data-power-count'] || React.Children.toArray(node?.props?.children).map(count).find(Boolean);}
test('stack indicators count only powers belonging to that piece, excluding spawned armies',()=>{
 const mods=[{id:'archbishop',piece:'b',name:'Archbishop'},{id:'sniper-bishop',piece:'b',name:'Sniper'}];
 const pieces=ctx.exports.build('chaos-toy',mods,[],'white',new Chess(),{w_archbishop:'c1'});
 assert.equal(count(pieces.wB({squareWidth:40,square:'c1'})),2);
 assert.equal(count(pieces.wB({squareWidth:40,square:'f1'})),undefined);
 const captured=ctx.exports.build('chaos-toy',mods,[],'white',new Chess(),{w_archbishop:null});
 assert.equal(count(captured.wB({squareWidth:40,square:'c1'})),undefined);
});
for(const [ids,kind] of [[['pawn-capture-forward'],'PB'],[['pawn-charge'],'PC'],[['pawn-capture-forward','pawn-charge'],'PW'],[['knook'],'C'],[['amazon'],'Am'],[['sniper-bishop'],'SB'],[['bishop-cannon'],'BC'],[['bishop-bounce'],'BB'],[['railgun'],'RG'],[['usurper'],'Usp'],[['kamikaze-bishop'],'KB'],[['camel'],'Ca']]) {
 test(`${ids.join('+')} selects its dedicated toy piece for both colors`,()=>{
  for(const color of ['w','b']){
   const type=['C','Ca'].includes(kind)?'n':kind==='Am'?'q':['SB','BC','BB','KB'].includes(kind)?'b':kind==='RG'?'r':kind==='Usp'?'k':'p';const mods=ids.map(id=>({id,piece:type}));
   const pieces=ctx.exports.build('chaos-toy',mods,mods,'white',new Chess());
   const square=({n:'b',q:'d',b:'c',r:'a',k:'e'})[type] ? ({n:'b',q:'d',b:'c',r:'a',k:'e'})[type]+(color==='w'?'1':'8') : (color==='w'?'a2':'a7');
   assert.equal(image(pieces[color+type.toUpperCase()]({squareWidth:64,square})),`url(/activity/pieces/${color}${kind}.svg)`);
  }
 });
}

for(const color of ['w','b']) test('Fools King has a distinct silhouette for '+color,()=>{
 const pieces=ctx.exports.build('chaos-toy',[],[],'white',new Chess(),undefined,undefined,undefined,undefined,undefined,'fools-king','fools-king');
 assert.equal(image(pieces[color+'K']({squareWidth:64,square:color==='w'?'e1':'e8'})), 'url(/activity/pieces/'+color+'FK.svg)');
});


for(const playerColor of ['white','black']) for(const [anomaly,type,kind] of [['fools-king','K','FK'],['emperor','K','EK'],['hierophant','B','Hb'],['star','N','Ca'],['hanged-man','P','IP'],['moon','Q','MQ']]) test(`${anomaly} respects ${playerColor} ownership`,()=>{
 const pc=playerColor==='white'?'w':'b',enemy=pc==='w'?'b':'w';
 const pieces=ctx.exports.build('chaos-toy',[],[],playerColor,new Chess(),undefined,undefined,undefined,undefined,undefined,anomaly,null,true,false);
 const sq=c=>({K:'e',B:'c',N:'b',P:'a',Q:'d'})[type]+(type==='P'?(c==='w'?'2':'7'):(c==='w'?'1':'8'));
 assert.equal(image(pieces[pc+type]({squareWidth:40,square:sq(pc)})),`url(/activity/pieces/${pc}${kind}.svg)`);
 assert.equal(image(pieces[enemy+type]({squareWidth:40,square:sq(enemy)})),`url(/activity/pieces/${enemy}${type}.svg)`);
});
test('Moon changes the queen only after its unlock, preserving Amazon equipment',()=>{
 const make=(mods,unlocked)=>ctx.exports.build('chaos-toy',mods,[],'white',new Chess(),undefined,undefined,undefined,undefined,undefined,'moon',null,unlocked,false);
 assert.equal(image(make([],false).wQ({squareWidth:64,square:'d1'})),'url(/activity/pieces/wQ.svg)');
 // Existing badge remains on hybrid pieces; it must not erase the Amazon sculpt.
 ctx.Emoji=()=>null;
 assert.equal(image(make([{id:'amazon',piece:'q'}],true).wQ({squareWidth:64,square:'d1'})),'url(/activity/pieces/wAm.svg)');
});
