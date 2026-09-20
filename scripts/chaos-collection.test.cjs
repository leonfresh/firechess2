const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
/** The Armoury: the collection modal must list every power, piece and anomaly, and mark what the
 * player actually owns. Loaded with a fake modifier table so the assertions are exact. */
const MODS=[{id:'alpha',name:'Alpha Power',description:'Does alpha things.',tier:'common',piece:'p'},
 {id:'beta',name:'Beta Power',description:'Does beta things.',tier:'legendary',piece:'q'},
 {id:'camel',name:'Camel',description:'Hops like a long knight.',tier:'rare',piece:'n'}];
const ANOMALIES=[{id:'fools-king',tarotNumber:0,tarotRoman:'0',tarotName:'The Fool',name:"Fool's King",description:'Chaos from move one.',icon:'🃏',trigger:'passive'}];
function load(){
 let cursor=0;const values=[];
 const react={...require('react'),useEffect(fn){try{fn()}catch{}},useRef(v){return{current:v}},useMemo(fn){return fn()},useState(v){const i=cursor++;if(!(i in values))values[i]=v;return[values[i],n=>values[i]=typeof n==='function'?n(values[i]):n]}};
 const module={exports:{}};
 const shims={
  '@/lib/chaos-chess':{ALL_MODIFIERS:MODS},
  '@/lib/chaos-anomalies':{ALL_ANOMALIES:ANOMALIES},
  '@/lib/chaos-collection':{GUEST_UNLOCKED_IDS:new Set(['alpha']),getProgressionInfo:gamesPlayed=>({nextIdx:1,total:2,nextModId:'beta',gamesNeeded:5,prevThreshold:0,windowSize:5,gamesInWindow:gamesPlayed,pct:40,remaining:3})},
  '@/lib/chaos-client-identity':{chaosIdentityHeaders:()=>({})},
  '@/lib/guest-id':{getGuestId:()=>'guest-1'},
  '@/components/chaos-hub-icon':{ChaosHubIcon:()=>({type:'svg',props:{}})},
  './power-art':{PowerArt:p=>({type:'div',props:{className:'power-art',...p}})},
 };
 vm.runInNewContext(ts.transpile(fs.readFileSync('discord-activity/app/collection.tsx','utf8'),{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),
  {module,exports:module.exports,require:name=>shims[name]??(name==='react'?react:name==='react/jsx-runtime'?require(name):{}),Date,URL,Math,console,setTimeout,clearTimeout,Set,Promise,
   fetch:async url=>({ok:true,json:async()=>String(url).includes('collection')?{unlockedIds:['alpha'],total:MODS.length,gold:340,goldWeek:55}:{profile:{games:2}}})});
 return {exports:module.exports,reset:()=>{cursor=0}};
}
const walk=(n,out=[])=>{if(!n)return out;if(Array.isArray(n)){n.forEach(x=>walk(x,out));return out}if(typeof n==='object'){out.push(n);walk(n.props?.children,out)}return out};
const texts=nodes=>nodes.flatMap(n=>{const c=n.props?.children;if(typeof c==='string')return[c];if(Array.isArray(c))return c.filter(x=>typeof x==='string');return[]}).join(' | ');
test('the collection lists every power with its owned state',async()=>{
 const {exports,reset}=load();
 walk(exports.ActivityCollection({card:true})).find(n=>n.props?.className==='lobby-destination').props.onClick();
 reset();
 walk(exports.ActivityCollection({card:true}));
 await new Promise(r=>setTimeout(r,0));
 reset();
 const nodes=walk(exports.ActivityCollection({card:true}));
 const body=texts(nodes);
 for(const mod of MODS) assert.ok(body.includes(mod.name),`${mod.name} must be listed`);
 assert.ok(body.includes('Does beta things.'),'each power shows its rule text');
 assert.ok(body.includes('1 of 3 powers in your kit.'),'the header counts what the player owns');
 assert.ok(nodes.some(n=>n.props?.role==='progressbar'&&n.props['aria-valuenow']===40),'the next-unlock bar reflects progression');
 assert.ok(body.includes('Next unlock: Beta Power — 3 more games.'),'the next unlock is named');
});
test('every tab is reachable and the card is a button, not a link',()=>{
 const {exports}=load();
 const nodes=walk(exports.ActivityCollection({card:true}));
 const tabs=nodes.filter(n=>n.props?.['aria-pressed']!==undefined).map(n=>n.props.children);
 assert.deepEqual(tabs,['Powers (3)','Pieces (9)','Anomalies (1)']);
 const card=nodes.find(n=>n.props?.className==='lobby-destination');
 assert.equal(card.type,'button','the collection card must be a button — activity.css hides anchors');
 assert.equal(card.props.href,undefined);
});
test('the armoury shows the gold balance the player has earned',async()=>{
 const {exports,reset}=load();
 walk(exports.ActivityCollection({card:true})).find(n=>n.props?.className==='lobby-destination').props.onClick();
 reset();
 walk(exports.ActivityCollection({card:true}));
 await new Promise(r=>setTimeout(r,0));
 reset();
 const nodes=walk(exports.ActivityCollection({card:true}));
 const pill=nodes.find(n=>n.props?.className==='collection-gold');
 assert.ok(pill,'the gold pill must render when the API reports a balance');
 assert.match(pill.props['aria-label'],/^340 gold, 55 earned this week$/);
 // A player with no earning identity gets no pill at all rather than a zero.
 const source=fs.readFileSync('discord-activity/app/collection.tsx','utf8');
 assert.match(source,/typeof d\?\.gold === "number"/,'gold is only shown when the API returns a number');
});
test('the pieces and anomalies tabs cover the full catalogue',()=>{
 const source=fs.readFileSync('discord-activity/app/collection.tsx','utf8');
 for(const id of ['camel','dragon-rook','knook','archbishop','amazon','night-rider','rook-cannon','pawn-capture-forward','railgun'])
  assert.ok(source.includes(`"${id}"`),`${id} must appear in the piece list`);
 assert.match(source,/\/activity\/anomalies\/\$\{a\.id\}\.webp/,'anomalies show their tarot art');
 assert.match(source,/ALL_ANOMALIES\.map/,'every anomaly is listed');
});
