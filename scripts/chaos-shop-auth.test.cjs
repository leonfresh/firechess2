const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function route(identity){
 const calls=[]; const module={exports:{}};
 const db={select:()=>({from:()=>({where:async condition=>{calls.push(condition);return[];}})})};
 vm.runInNewContext(ts.transpile(fs.readFileSync('app/api/chaos/shop/route.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{exports:module.exports,module,require(name){
 if(name==='next/server')return{NextResponse:{json:(body,init)=>({body,status:init?.status??200})}};
 if(name==='@/lib/chaos-auth')return{getChaosUserId:async()=>identity,isGuestId:id=>id?.startsWith('guest_')};
 if(name==='@/lib/db')return{db};
 if(name==='@/lib/schema')return{chaosPlayerUnlock:{playerId:'player_id'}};
 if(name==='drizzle-orm')return{eq:(column,value)=>({column,value})};
 if(name==='@/lib/chaos-shop')return{shopCatalog:()=>[]};
 return{};
 }});
 return{...module.exports,calls};
}
for(const id of ['discord_123','website-user']) test('shop reads ownership using verified account '+id,async()=>{
 const r=route(id);await r.GET({headers:{get:()=> 'signed-credential-not-a-player-id'}});assert.equal(r.calls[0].value,id);
});
for(const id of [null,'guest_123'])test('shop refuses anonymous purchases before reading a body or touching storage: '+id,async()=>{
 const r=route(id);const response=await r.POST({json(){throw new Error('must not read')}});assert.equal(response.status,401);assert.equal(r.calls.length,0);
});

for(const id of ['vaulting-knight','bank-shot','night-rider','phantom-rook','bishop-bounce','queen-teleport']) test(`legacy unlock endpoint refuses paid card ${id}`,async()=>{
 const module={exports:{}};let writes=0;
 vm.runInNewContext(ts.transpile(fs.readFileSync('app/api/chaos/collection/route.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{exports:module.exports,module,require(name){
  if(name==='next/server')return{NextResponse:{json:(body,init)=>({body,status:init?.status??200})}};
  if(name==='@/lib/auth')return{auth:async()=>({user:{id:'test-account'}})};
  if(name==='@/lib/chaos-chess')return{ACTIVE_MODIFIERS:[{id}],SHOP_CARD_IDS:new Set([id])};
  if(name==='@/lib/db')return{db:{insert(){writes++;throw Error('Paid card must never be granted here');}}};
  return{};
 }});
 const response=await module.exports.POST({json:async()=>({modifierId:id})});
 assert.equal(response.status,403);assert.equal(writes,0);
});
