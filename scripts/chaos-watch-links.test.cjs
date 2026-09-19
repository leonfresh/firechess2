const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
/** The Watchtower is a page. Entry buttons must navigate to /watch (with the
 * game or tab preselected) and never open a modal again. */
function load(){
 const values=[];let cursor=0;
 const react={...require('react'),useEffect(){},useRef(v){return {current:v}},useMemo(fn){return fn()},useState(v){const i=cursor++;if(!(i in values))values[i]=v;return [values[i],n=>values[i]=typeof n==='function'?n(values[i]):n]}};
 const module={exports:{}};
 vm.runInNewContext(ts.transpile(fs.readFileSync('components/chaos-watch.tsx','utf8'),{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),{module,exports:module.exports,require:n=>n==='react'?react:n==='react/jsx-runtime'?require(n):n==='next/link'?require(n):n==='chess.js'?require(n):n.includes('chaos-watch')?{describeWatchFrame:f=>f.label,expandVisual:s=>({...s,playerModifiers:[],aiModifiers:[]})}:n.includes('chaos-pieces')?{buildChaosCustomPieces:()=>({})}:n.includes('chaos-anomalies')?{getAnomalyById:()=>undefined}:{},Date,URL,Math});
 return {exports:module.exports,reset:()=>{cursor=0}};
}
const walk=(n,out=[])=>{if(!n)return out;if(Array.isArray(n)){n.forEach(x=>walk(x,out));return out}if(typeof n==='object'){out.push(n);walk(n.props?.children,out)}return out};
test('watch entry buttons open the full page instead of a modal',()=>{
 const {exports}=load(),{ChaosWatchButton}=exports;
 assert.equal(ChaosWatchButton({}).props.href,'/watch');
 assert.equal(ChaosWatchButton({initialTab:'archive'}).props.href,'/watch?tab=archive');
 assert.equal(ChaosWatchButton({matchId:'abc:0'}).props.href,'/watch?match=abc%3A0');
 assert.equal(ChaosWatchButton({matchId:'abc:0',label:'Replay'}).props.children,'Replay');
 const card=ChaosWatchButton({card:true,initialTab:'live'});
 assert.equal(card.props.className,'lobby-destination');
 assert.equal(card.props.href,'/watch');
});
test('the activity replays card opens the watchtower as a modal',()=>{
 const values=[];let cursor=0;
 const react={...require('react'),useEffect(){},useRef(v){return {current:v}},useMemo(fn){return fn()},useState(v){const i=cursor++;if(!(i in values))values[i]=v;return [values[i],n=>values[i]=typeof n==='function'?n(values[i]):n]}};
 const ChaosWatch=p=>({type:'section',props:p});
 const shims={'@/components/chaos-watch':{ChaosWatch},'@/components/chaos-hub-icon':{ChaosHubIcon:()=>({type:'svg',props:{}})},'@/components/chaos-watch.module.css':{__esModule:true,default:{dialog:'dialog_hash'}}};
 const module={exports:{}};
 vm.runInNewContext(ts.transpile(fs.readFileSync('discord-activity/app/replays.tsx','utf8'),{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),
  {module,exports:module.exports,require:n=>shims[n]??(n==='react'?react:n==='react/jsx-runtime'?require(n):{}),Date,URL,Math,console,setTimeout,clearTimeout});
 const {ActivityReplays}=module.exports;
 const first=walk(ActivityReplays({card:true}));
 const card=first.find(n=>n.props?.className==='lobby-destination');
 assert.equal(card.type,'button','the replays card is a button — activity.css hides anchors');
 assert.equal(card.props.href,undefined,'the replays card must not navigate away');
 card.props.onClick();
 cursor=0;
 const nodes=walk(ActivityReplays({card:true}));
 const dialog=nodes.find(n=>n.type==='dialog');
 assert.ok(dialog,'opening the card renders a dialog');
 assert.equal(dialog.props.className,'dialog_hash');
 const watch=walk(dialog).find(n=>n.type===ChaosWatch);
 assert.ok(watch,'the dialog hosts the watchtower');
 assert.equal(watch.props.initialTab,'archive','replays open on the archive tab');
 assert.equal(typeof watch.props.onClose,'function','the modal can close itself');
});
test('the watchtower opens as a page, never a dialog',()=>{
 const source=fs.readFileSync('components/chaos-watch.tsx','utf8');
 assert.ok(!/showModal|<dialog/.test(source),'The watchtower must not open a modal');
 const {exports,reset}=load();reset();
 const nodes=walk(exports.ChaosWatch({initialRoom:'room-1'}));
 assert.ok(nodes.length>0,'The watchtower must render');
 assert.ok(!nodes.some(n=>n.type==='dialog'),'No dialog element may be rendered');
});
