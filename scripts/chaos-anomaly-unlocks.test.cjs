const {test}=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
const {ALL_ANOMALIES,rollAnomalyChoices}=require('../lib/chaos-anomalies.ts');
const {ANOMALY_PRICES,anomalyKey,cosmeticMastery}=require('../lib/chaos-anomaly-unlocks.ts');
const {fullShopCatalog}=require('../lib/chaos-shop.ts');
const {createSyncState,startServerOpening,reduceCommand,metadata}=require('../lib/chaos-room-sync.ts');
const {Chess}=require('chess.js');
test('11 free starters; only personally owned anomalies join the pool',()=>{
 assert.equal(ALL_ANOMALIES.filter(a=>!(a.id in ANOMALY_PRICES)).length,11);
 for(let seed=0;seed<100;seed++){
  assert.ok(rollAnomalyChoices(22,seed).every(a=>!(a.id in ANOMALY_PRICES)));
  const owned=rollAnomalyChoices(22,seed,[anomalyKey('moon')]);assert.equal(owned.length,12);assert.ok(owned.some(a=>a.id==='moon'));assert.ok(!owned.some(a=>a.id==='world'));
 }
});
test('shop anomaly keys and server prices are unique and fixed',()=>{const c=fullShopCatalog();assert.equal(new Set(c.map(i=>i.id)).size,c.length);assert.equal(c.filter(i=>i.id.startsWith('anomaly:')).length,11);assert.ok(c.every(i=>i.price>0));});
test('server opening cannot borrow the opponent collection',()=>{
 const room={id:'unlock-room',hostId:'host',guestId:'guest',hostColor:'white',status:'playing',fen:new Chess().fen(),chaosState:createSyncState(true),moveHistory:[]};
 for(let i=0;i<30;i++){const state=startServerOpening(room,1000,{host:[],guest:Object.keys(ANOMALY_PRICES).map(anomalyKey)});assert.ok(state._sync.opening.offers.host.every(id=>!(id in ANOMALY_PRICES)));}
 const legacy={...room,chaosState:createSyncState(false)};
 assert.throws(()=>reduceCommand(legacy,'host',{id:'unowned-anomaly-action',baseRevision:0,message:{type:'anomaly_pick',anomalyId:'moon'}},1000),/Unlock this anomaly/);
});
test('mastery thresholds award cosmetic frame names only',()=>{assert.equal(cosmeticMastery(4).tier,'none');assert.equal(cosmeticMastery(5).tier,'bronze');assert.equal(cosmeticMastery(15).tier,'silver');assert.equal(cosmeticMastery(40).tier,'gold');assert.deepEqual(Object.keys(cosmeticMastery(100)).sort(),['games','next','tier']);});
