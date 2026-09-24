const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{Chess}=require('chess.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../components/chaos-pieces.tsx'),'utf8');
const code=source.slice(source.indexOf('type Corner ='),source.length).replace(/export /g,'');
const artContext={exports:{}};
vm.runInNewContext(ts.transpile(fs.readFileSync(require('node:path').join(__dirname,'../lib/chaos-piece-art.ts'),'utf8'),{module:ts.ModuleKind.CommonJS}),artContext);
const ctx={FAIRY_PIECE_CODES:artContext.exports.FAIRY_PIECE_CODES,React,MODIFIER_OVERLAYS:{},getPieceImageUrl:()=>'',exports:{}};
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
for(const [ids,kind] of [[['conscription'],'CS'],[['hostile-takeover'],'HT'],[['pawn-capture-forward'],'PB'],[['pawn-charge'],'PC'],[['pawn-capture-forward','pawn-charge'],'PW'],[['knook'],'C'],[['amazon'],'Am'],[['sniper-bishop'],'SB'],[['bishop-cannon'],'BC'],[['bishop-bounce'],'BB'],[['railgun'],'RG'],[['usurper'],'Usp'],[['kamikaze-bishop'],'KB'],[['camel'],'Ca']]) {
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


test('new pawn powers preserve stacked equipment and mark the takeover only while armed',()=>{
 const mods=[{id:'pawn-charge',piece:'p'},{id:'pawn-capture-forward',piece:'p'},{id:'conscription',piece:'p'},{id:'hostile-takeover',piece:'p'}];
 function labels(node){return [node?.props?.['aria-label'],...React.Children.toArray(node?.props?.children).flatMap(labels)].filter(Boolean);}
 for(const color of ['w','b']) {
 const square=color==='w'?'a2':'a7';
 let pieces=ctx.exports.build('chaos-toy',mods,mods,'white',new Chess());
 const node=pieces[color+'P']({squareWidth:40,square});
 assert.equal(image(node),`url(/activity/pieces/${color}PW.svg)`);
 assert.ok(labels(node).includes('Backward pawn captures'));
 assert.ok(labels(node).includes('Hostile Takeover armed'));
 pieces=ctx.exports.build('chaos-toy',mods.slice(0,3),mods.slice(0,3),'white',new Chess());
 assert.ok(!labels(pieces[color+'P']({squareWidth:40,square})).includes('Hostile Takeover armed'));
 }
});


test('Phalanx does not claim a persistent power on ordinary reinforced pawns',()=>{
 const mods=[{id:'phalanx',piece:'p'},{id:'conscription',piece:'p'}];
 const pieces=ctx.exports.build('chaos-toy',mods,mods,'white',new Chess());
 assert.equal(count(pieces.wP({squareWidth:40,square:'a2'})),undefined);
});

for(const color of ['w','b']) test(`new equipment retains hybrid silhouettes and caps badges for ${color}`,()=>{
 const power=(id,piece,icon)=>({id,piece,name:id,icon});
 const mods=[power('knook','n','♜'),power('camel','n','♞'),power('vaulting-knight','n','↟')];
 const square=color==='w'?'b1':'b8';
 const pieces=ctx.exports.build('chaos-toy',mods,mods,'white',new Chess(),{[color+'_knook']:square,[color+'_camel']:square});
 const node=pieces[color+'N']({squareWidth:40,square});
 assert.equal(image(node),`url(/activity/pieces/${color}Ca.svg)`);
 function collect(node){return [node,...React.Children.toArray(node?.props?.children).flatMap(collect)].filter(Boolean);}
 const nodes=collect(node);
 assert.equal(nodes.filter(n=>n?.props?.['data-power-badge']).length,2);
 assert.equal(nodes.find(n=>n?.props?.['data-power-overflow']),undefined,'the sculpt replaces the Camel badge');
 assert.ok(!nodes.some(n=>n?.props?.['data-power-badge']==='camel'));
 const lone=ctx.exports.build('chaos-toy',[mods[2]],[mods[2]],'white',new Chess());
 assert.equal(image(lone[color+'N']({squareWidth:40,square})),`url(/activity/pieces/${color}VK.svg)`);
 const rooks=[power('bank-shot','r','↱'),power('railgun','r','⚡')];
 const stack=ctx.exports.build('chaos-toy',rooks,rooks,'white',new Chess());
 assert.equal(image(stack[color+'R']({squareWidth:40,square:color==='w'?'a1':'a8'})),`url(/activity/pieces/${color}RG.svg)`);
});

test('the nuclear queen badge shows its cooldown instead of the icon while cooling',()=>{
 const nuke={id:'nuclear-queen',piece:'q',name:'Nuclear Queen',icon:'☢'};
 function collect(node){return [node,...React.Children.toArray(node?.props?.children).flatMap(collect)].filter(Boolean);}
 const badge=node=>collect(node).find(n=>(n?.props?.['data-power-badge']==='nuclear-queen'||n?.props?.['data-power-status']==='nuclear-queen'));
 const build=(p,ai)=>ctx.exports.build('chaos-toy',[nuke],[nuke],'white',new Chess(),undefined,undefined,undefined,p,ai);
 const cooling=badge(build(3,0).wQ({squareWidth:40,square:'d1'}));
 assert.equal(cooling.props['data-nuke-cd'],3,'the badge carries the turns left');
 assert.equal(cooling.props.children,3,'and prints the number');
 assert.match(cooling.props.title,/3 turns/);
 const readyNode=build(0,0).wQ({squareWidth:40,square:'d1'});
 assert.equal(badge(readyNode),undefined,'the reactor sculpt replaces the ready badge');
 assert.equal(image(readyNode),'url(/activity/pieces/wNQ.svg)');
 // Each queen reads its own clock.
 assert.equal(badge(build(0,5).bQ({squareWidth:40,square:'d8'})).props['data-nuke-cd'],5);
 assert.equal(badge(build(0,5).wQ({squareWidth:40,square:'d1'})),undefined);
});

test('art removes redundant badges but preserves extra powers and caps overflow',()=>{
 const collect=n=>[n,...React.Children.toArray(n?.props?.children).flatMap(collect)].filter(Boolean);
 const mods=['archbishop','sniper-bishop','bishop-cannon','bishop-bounce'].map(id=>({id,piece:'b',name:id,icon:'x'}));
 const pieces=ctx.exports.build('chaos-toy',mods,[],'white',new Chess(),{w_archbishop:'c1'});
 const node=pieces.wB({squareWidth:40,square:'c1'}),nodes=collect(node);
 assert.equal(image(node),'url(/activity/pieces/wA.svg)');
 assert.deepEqual(nodes.filter(n=>n.props?.['data-power-badge']).map(n=>n.props['data-power-badge']),['sniper-bishop','bishop-cannon']);
 assert.equal(nodes.find(n=>n.props?.['data-power-overflow']).props['data-power-overflow'],1);
 assert.match(node.props.title,/archbishop, sniper-bishop, bishop-cannon, bishop-bounce/);
 const lone=ctx.exports.build('chaos-toy',[mods[0]],[],'white',new Chess(),{w_archbishop:'c1'});
 assert.equal(collect(lone.wB({squareWidth:40,square:'c1'})).filter(n=>n.props?.['data-power-badge']).length,0);
});
test('cooldown stays visible even when the power would be behind overflow',()=>{
 const mods=['amazon','queen-cannon','queen-teleport','nuclear-queen'].map(id=>({id,piece:'q',name:id,icon:'x'}));
 const pieces=ctx.exports.build('chaos-toy',mods,[],'white',new Chess(),undefined,undefined,undefined,4,0);
 const collect=n=>[n,...React.Children.toArray(n?.props?.children).flatMap(collect)].filter(Boolean);
 const nodes=collect(pieces.wQ({squareWidth:40,square:'d1'}));
 assert.equal(nodes.find(n=>n.props?.['data-power-status']==='nuclear-queen').props.children,4);
 assert.ok(!nodes.some(n=>n.props?.['data-power-badge']==='nuclear-queen'));
});

test('phantom-rook has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'phantom-rook',name:'phantom-rook',piece:'r'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('r'==='p'?'a': 'r'==='r'?'a':'r'==='q'?'d':'e')+('r'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'R']({squareWidth:40,square})),`url(/activity/pieces/${color}PR.svg)`);}});
test('nuclear-queen has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'nuclear-queen',name:'nuclear-queen',piece:'q'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('q'==='p'?'a': 'q'==='r'?'a':'q'==='q'?'d':'e')+('q'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'Q']({squareWidth:40,square})),`url(/activity/pieces/${color}NQ.svg)`);}});
test('queen-teleport has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'queen-teleport',name:'queen-teleport',piece:'q'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('q'==='p'?'a': 'q'==='r'?'a':'q'==='q'?'d':'e')+('q'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'Q']({squareWidth:40,square})),`url(/activity/pieces/${color}WQ.svg)`);}});
test('kings-chains has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'kings-chains',name:'kings-chains',piece:'k'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('k'==='p'?'a': 'k'==='r'?'a':'k'==='q'?'d':'e')+('k'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'K']({squareWidth:40,square})),`url(/activity/pieces/${color}KC.svg)`);}});
test('king-wrath has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'king-wrath',name:'king-wrath',piece:'k'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('k'==='p'?'a': 'k'==='r'?'a':'k'==='q'?'d':'e')+('k'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'K']({squareWidth:40,square})),`url(/activity/pieces/${color}KR.svg)`);}});
test('king-ascension has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'king-ascension',name:'king-ascension',piece:'k'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('k'==='p'?'a': 'k'==='r'?'a':'k'==='q'?'d':'e')+('k'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'K']({squareWidth:40,square})),`url(/activity/pieces/${color}KA.svg)`);}});
test('collateral-rook has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'collateral-rook',name:'collateral-rook',piece:'r'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('r'==='p'?'a': 'r'==='r'?'a':'r'==='q'?'d':'e')+('r'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'R']({squareWidth:40,square})),`url(/activity/pieces/${color}CR.svg)`);}});
test('pawn-fortress has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'pawn-fortress',name:'pawn-fortress',piece:'p'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('p'==='p'?'a': 'p'==='r'?'a':'p'==='q'?'d':'e')+('p'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'P']({squareWidth:40,square})),`url(/activity/pieces/${color}PF.svg)`);}});
test('enpassant-everywhere has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'enpassant-everywhere',name:'enpassant-everywhere',piece:'p'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('p'==='p'?'a': 'p'==='r'?'a':'p'==='q'?'d':'e')+('p'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'P']({squareWidth:40,square})),`url(/activity/pieces/${color}EP.svg)`);}});
test('pawn-promotion-early has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'pawn-promotion-early',name:'pawn-promotion-early',piece:'p'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('p'==='p'?'a': 'p'==='r'?'a':'p'==='q'?'d':'e')+('p'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'P']({squareWidth:40,square})),`url(/activity/pieces/${color}PP.svg)`);}});
test('toll-gate has a matching sculpt for both colours',()=>{for(const color of ['w','b']){const mod={id:'toll-gate',name:'toll-gate',piece:'p'};const pieces=ctx.exports.build('chaos-toy',[mod],[mod],'white',new Chess());const square=('p'==='p'?'a': 'p'==='r'?'a':'p'==='q'?'d':'e')+('p'==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));assert.equal(image(pieces[color+'P']({squareWidth:40,square})),`url(/activity/pieces/${color}TG.svg)`);}});
