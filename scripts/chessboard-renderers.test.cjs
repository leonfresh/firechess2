const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('hover style updates preserve custom piece component identities',()=>{
 const slots=[];let cursor=0;
 const react={...require('react'),useEffect(){},useRef(value){const i=cursor++;return slots[i]??= {current:value}},useState(value){const i=cursor++;return [slots[i]??=value,()=>{}]},useMemo(fn,deps){const i=cursor++;if(!slots[i]||deps.some((d,j)=>d!==slots[i].deps[j]))slots[i]={deps,value:fn()};return slots[i].value}};
 const module={exports:{}};
 const src=fs.readFileSync(require('node:path').join(__dirname,'../components/chessboard-compat.tsx'),'utf8');
 vm.runInNewContext(ts.transpile(src,{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),{module,exports:module.exports,require:name=>name==='react'?react:{Chessboard:()=>null,defaultPieces:{}},Date});
 const customPieces={wP:()=>null};
 function render(styles){cursor=0;const tree=module.exports.Chessboard({customPieces,customSquareStyles:styles});const find=n=>!n?undefined:n?.props?.options??(Array.isArray(n?.props?.children)?n.props.children.map(find).find(Boolean):find(n?.props?.children));return find(tree);}
 const before=render({}),after=render({e4:{backgroundColor:'green'}});
 assert.equal(after.pieces.wP,before.pieces.wP,'A hover must not remount the piece under the pointer');
});
