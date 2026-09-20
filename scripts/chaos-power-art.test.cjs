const {test}=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
const {ALL_MODIFIERS}=require('../lib/chaos-chess.ts');
const {POWER_ART_SPRITES,POWER_ILLUSTRATIONS}=require('../discord-activity/app/power-art-catalog.ts');
test('every draft power has a distinct illustration, including all later tiers',()=>{
 const used=new Set();
 for(const mod of ALL_MODIFIERS){
  const file=POWER_ILLUSTRATIONS[mod.id],sprite=POWER_ART_SPRITES[mod.id];
  assert.ok(file||sprite,`${mod.name} (${mod.tier}) still falls back to a piece icon`);
  const identity=file||`atlas:${sprite}`;
  assert.ok(!used.has(identity),`${mod.name} reuses another power's artwork`);used.add(identity);
  const source=path.join(__dirname,'../discord-activity/assets',`${file||'toy-sheet'}.png`);
  assert.ok(fs.existsSync(source),`${mod.name} is mapped to a missing source`);
  if(file){
   const output=path.join(__dirname,'../discord-activity/public/activity',`${file}.webp`);
   assert.ok(fs.existsSync(output),`${mod.name} is missing its deployable thumbnail`);
   assert.ok(fs.statSync(output).size<250000,`${mod.name} thumbnail is too heavy for mobile`);
  }
 }
});
