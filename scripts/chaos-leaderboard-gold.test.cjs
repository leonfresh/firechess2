const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
/** The leaderboard dialog: the Gold tab must rank Chaos players by lifetime gold earned,
 * served from the same /api/chaos/standings payload as the other tabs. */
const STANDINGS={
 ranked:[{name:'Alpha',rating:1500,games:4,wins:3,losses:1,draws:0}],
 community:[{name:'Alpha',rating:1500,games:4,wins:3,losses:1,draws:0}],
 gold:[
  {name:'Kofta paneer',gold:95,games:5,earned:95,spent:0},
  {name:'SwordFish',gold:50,games:3,earned:50,spent:0},
  {name:'MrLeli',gold:50,games:0,earned:50,spent:0},
  {name:'Andy',gold:30,games:2,earned:30,spent:0}],
 goldTotals:{players:9,earned:545}};
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
   fetch:async url=>{calls.push(String(url));return{ok:true,json:async()=>STANDINGS}}});
 const render=()=>{cursor=0;effectSlot=0;return walk(module.exports.ActivityCareer({card:true}))};
 return {render,calls};
}
const walk=(n,out=[])=>{if(!n)return out;if(Array.isArray(n)){n.forEach(x=>walk(x,out));return out}if(typeof n==='object'){out.push(n);walk(n.props?.children,out)}return out};
const texts=nodes=>nodes.flatMap(n=>{const c=n.props?.children;if(typeof c==='string')return[c];if(typeof c==='number')return[String(c)];if(Array.isArray(c))return c.filter(x=>typeof x==='string'||typeof x==='number').map(String);return[]}).join(' | ');
const flush=async()=>{await new Promise(r=>setTimeout(r,0));await new Promise(r=>setTimeout(r,0));};
const tabButtons=nodes=>nodes.filter(n=>n.props?.['aria-pressed']!==undefined&&n.type==='button');

test('the leaderboard card is a button and the dialog has a Gold tab',()=>{
 const {render}=load();
 const nodes=render();
 const card=nodes.find(n=>n.props?.className==='lobby-destination');
 assert.equal(card.type,'button','the leaderboard card must be a button — activity.css hides anchors');
 assert.deepEqual(tabButtons(nodes).map(n=>n.props.children),['Community','Rated ladder','Gold','My games']);
});

test('opening the dialog fetches the chaos standings once, which carries the gold board',async()=>{
 const {render,calls}=load();
 let nodes=render();
 assert.ok(!calls.length,'closed dialog must not fetch');
 nodes.find(n=>n.props?.className==='lobby-destination').props.onClick();
 render();
 await flush();
 assert.deepEqual(calls,['/api/chaos/standings'],'the gold board rides the standings payload — no second endpoint');
 assert.ok(!calls.some(u=>u.includes('/api/leaderboard')),'no FireChess-website board is fetched from the activity');
});

test('the Gold tab lists chaos players by lifetime gold earned',async()=>{
 const {render}=load();
 render().find(n=>n.props?.className==='lobby-destination').props.onClick();
 render();
 await flush();
 tabButtons(render()).find(n=>n.props.children==='Gold').props.onClick();
 const body=texts(render());
 assert.ok(body.includes('Kofta paneer')&&body.includes('SwordFish')&&body.includes('MrLeli'),'rows list the chaos players');
 assert.ok(body.includes('95')&&body.includes('50'),'rows show lifetime earned');
 assert.ok(body.includes('in hand'),'rows still show the balance still in hand');
 assert.ok(body.includes('GOLD EARNED'),'the column header names the metric');
 assert.ok(body.includes('545')&&body.includes('9'),'the note reports site-wide totals');
 assert.ok(/Buying powers spends gold but never removes you from this board/.test(body),'the note explains spending does not cost rank');
});

test('an empty gold board renders the empty state instead of a blank list',async()=>{
 const src=fs.readFileSync('discord-activity/app/career.tsx','utf8');
 assert.match(src,/No gold earned yet\./,'an empty gold board must render its own empty state');
 assert.match(src,/standings\.gold\.length \?/,'the gold list renders only when rows exist');
});
