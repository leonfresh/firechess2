const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), ts=require('typescript');
function load(){
  const module={exports:{}};
  vm.runInNewContext(ts.transpile(fs.readFileSync('lib/chaos-launch.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),
    {module,exports:module.exports,require:()=>({})});
  return module.exports;
}
const {normalizeChaosLaunch}=load();
/** Results come from another vm realm, so compare plain JSON instead of prototypes. */
const plain=value=>JSON.parse(JSON.stringify(value));
const EMPTY={guildId:null,channelId:null,instanceId:null};
test('keeps well-formed Discord launch context',()=>{
  assert.deepEqual(plain(normalizeChaosLaunch({guildId:'1234567890123456789',channelId:'987654321098765432',instanceId:'0'})),
    {guildId:'1234567890123456789',channelId:'987654321098765432',instanceId:'0'});
});
test('drops malformed ids instead of storing them',()=>{
  assert.deepEqual(plain(normalizeChaosLaunch({guildId:'not-a-snowflake',channelId:123456789012345678,instanceId:'has space'})),EMPTY);
  assert.equal(normalizeChaosLaunch({guildId:"1' or 1=1--"}).guildId,null);
  assert.equal(normalizeChaosLaunch({instanceId:'x'.repeat(65)}).instanceId,null);
});
test('missing or junk bodies yield an empty launch record without throwing',()=>{
  for(const body of [undefined,null,{},'nonsense',42])assert.deepEqual(plain(normalizeChaosLaunch(body)),EMPTY);
});
test('a launch without an instance id is not recorded (nothing to dedupe on)',()=>{
  const launch=normalizeChaosLaunch({guildId:'1234567890123456789',channelId:'987654321098765432'});
  assert.equal(launch.instanceId,null);assert.equal(launch.guildId,'1234567890123456789');
});
