const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
/** The leaderboard dialog: the Coins tab must be lazy, button-driven, and load the website's
 * public coin board (lifetime coins earned) through the activity's /api/leaderboard proxy. */
const COINS={entries:[
 {userId:'u1',name:'LeonFresh',chaosUsername:null,balance:1678,spent:1910,earned:3588},
 {userId:'u2',name:'Tanakrit Nithitirawut',chaosUsername:null,balance:256,spent:995,earned:1251},
 {userId:'u3',name:'Max',chaosUsername:'Maximus',balance:576,spent:0,earned:576}],
 totals:{players:509,earned:22833}};
const STANDINGS={ranked:[{name:'Alpha',rating:1500,games:4,wins:3,losses:1,draws:0}],community:[{name:'Alpha',rating:1500,games:4,wins:3,losses:1,draws:0}]};
function load(){
 let cursor=0,effectSlot=0;const values=[];const lastDeps=[];const calls=[];
 const react={...require('react'),useId:()=>"career-test",
  useEffect(fn,deps){const i=effectSlot++;const key=JSON.stringify(deps);if(lastDeps[i]===key)return;lastDeps[i]=key;try{fn()}catch{}},
  useRef(v){return{current:v}},
  useState(v){const i=cursor++;if(!(i in values))values[i]=v;return[values[i],n=>values[i]=typeof n==='function'?n(values[i]):n]}};
 const module={exports:{}};
 const shims={
  '@/components/chaos-watch':{ChaosWatchButton:()=>({type:'button',props:{}})},
  '@/components/chaos-hub-icon':{ChaosHubIcon:()=>({type:'svg',props:{}})},
  '@/lib/chaos-client-identity':{chaosIdentityHeaders:()=>({})},
  '@/lib/guest-id':{getGuestId:()=>'guest-1'},
  './use-activity-dialog':{useActivityDialog:()=>({ref:{current:null},onBackdropClick(){}})},
 };
 vm.runInNewContext(ts.transpile(fs.readFileSync('discord-activity/app/career.tsx','utf8'),{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),
  {module,exports:module.exports,require:name=>shims[name]??(name==='react'?react:name==='react/jsx-runtime'?require(name):{}),Date,URL,Math,console,setTimeout,clearTimeout,Set,Promise,
   window:{dispatchEvent(){}},
   fetch:async url=>{calls.push(String(url));const d=String(url).includes('/api/leaderboard/coins')?COINS:STANDINGS;return{ok:true,json:async()=>d}}});
 const render=()=>{cursor=0;effectSlot=0;return walk(module.exports.ActivityCareer({card:true}))};
 return {render,calls};
}
const walk=(n,out=[])=>{if(!n)return out;if(Array.isArray(n)){n.forEach(x=>walk(x,out));return out}if(typeof n==='object'){out.push(n);walk(n.props?.children,out)}return out};
const texts=nodes=>nodes.flatMap(n=>{const c=n.props?.children;if(typeof c==='string')return[c];if(typeof c==='number')return[String(c)];if(Array.isArray(c))return c.filter(x=>typeof x==='string'||typeof x==='number').map(String);return[]}).join(' | ');
const flush=async()=>{await new Promise(r=>setTimeout(r,0));await new Promise(r=>setTimeout(r,0));};
const tabButtons=nodes=>nodes.filter(n=>n.props?.['aria-pressed']!==undefined&&n.type==='button');

test('the leaderboard card is a button and the dialog gains a Coins tab',()=>{
 const {render}=load();
 const nodes=render();
 const card=nodes.find(n=>n.props?.className==='lobby-destination');
 assert.equal(card.type,'button','the leaderboard card must be a button — activity.css hides anchors');
 assert.deepEqual(tabButtons(nodes).map(n=>n.props.children),['Community','Rated ladder','Coins','My games']);
});

test('the coin board is fetched lazily, only when the Coins tab is opened',async()=>{
 const {render,calls}=load();
 let nodes=render();
 assert.ok(!calls.some(u=>u.includes('/api/leaderboard/coins')),'closed dialog must not request the coin board');
 nodes.find(n=>n.props?.className==='lobby-destination').props.onClick();
 render();
 await flush();
 assert.ok(!calls.some(u=>u.includes('/api/leaderboard/coins')),'community tab must not request the coin board');
 tabButtons(render()).find(n=>n.props.children==='Coins').props.onClick();
 render();
 await flush();
 assert.ok(calls.filter(u=>u.includes('/api/leaderboard/coins?limit=25')).length===1,'opening Coins fetches the board exactly once');
});

test('the Coins tab lists players by lifetime coins earned',async()=>{
 const {render}=load();
 render().find(n=>n.props?.className==='lobby-destination').props.onClick();
 render();
 await flush();
 tabButtons(render()).find(n=>n.props.children==='Coins').props.onClick();
 render();
 await flush();
 const body=texts(render());
 assert.ok(body.includes('LeonFresh')&&body.includes('Tanakrit Nithitirawut')&&body.includes('Maximus'),'rows use chaos names, falling back to account names');
 assert.ok(body.includes('3,588')&&body.includes('1,251'),'rows show lifetime earned, formatted');
 assert.ok(body.includes('1,678')&&body.includes('in the bank')&&body.includes('1,910')&&body.includes('spent'),'rows still show balance and spend');
 assert.ok(body.includes('COINS EARNED'),'the column header names the metric');
 assert.ok(body.includes('22,833')&&body.includes('509'),'the note reports site-wide totals');
 assert.ok(/never costs your rank/.test(body),'the note explains spending does not cost rank');
});

test('an empty board renders the empty state instead of a blank list',async()=>{
 const src=fs.readFileSync('discord-activity/app/career.tsx','utf8');
 assert.match(src,/No coins earned yet\./,'an empty coin board must render its own empty state');
 assert.match(src,/coins\.entries\.length \?/,'the list renders only when entries exist');
});
