const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('finished replay can play again, rewind, and play a second time',()=>{
 const values=[]; let cursor=0;
 const react={...require('react'),useEffect(){},useRef(v){return {current:v}},useMemo(fn){return fn()},useState(v){const i=cursor++;if(!(i in values))values[i]=v;return [values[i],n=>values[i]=typeof n==='function'?n(values[i]):n]}};
 const module={exports:{}};
 vm.runInNewContext(ts.transpile(fs.readFileSync('components/chaos-watch.tsx','utf8'),{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),{module,exports:module.exports,require:n=>n==='react'?react:n==='react/jsx-runtime'?require(n):n==='chess.js'?require(n):n.includes('chaos-watch')?{describeWatchFrame:f=>f.label,expandVisual:s=>({...s,playerModifiers:[],aiModifiers:[]})}:n.includes('chaos-pieces')?{buildChaosCustomPieces:()=>({})}:n.includes('chaos-anomalies')?{getAnomalyById:()=>undefined}:{},Date,URL});
 const render=()=>{cursor=0;return module.exports.ChaosWatch({initialMatch:'test'})};
 const find=(n,p)=>{if(!n)return;if(Array.isArray(n))return n.map(x=>find(x,p)).find(Boolean);if(p(n))return n;return find(n.props?.children,p)};
 render();values[4]={white:'Alice',black:'Bob',frames:[0,1,2].map(()=>({fen:new (require('chess.js').Chess)().fen(),state:{},label:'Position'}))};values[6]=2;
 for(let run=0;run<2;run++){
  const play=find(render(),n=>n.type==='button'&&['Play','Play again'].includes(n.props.children));
  assert.ok(play&&!play.props.disabled,'Playback must be available at the final frame');play.props.onClick();assert.equal(values[6],0);assert.equal(values[7],true);
  const first=find(render(),n=>n.props?.['aria-label']==='First position');first.props.onClick();assert.equal(values[7],false);values[6]=2;
 }
});

