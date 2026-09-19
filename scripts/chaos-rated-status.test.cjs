const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), ts=require('typescript');
const {renderToStaticMarkup}=require('react-dom/server');
function render(account, props={}, discord=false) {
  const module={exports:{}};
  vm.runInNewContext(ts.transpile(fs.readFileSync('components/chaos-rated-status.tsx','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}),{
    module,exports:module.exports,
    require:n=>n==='react/jsx-runtime'?require(n):n.includes('use-chaos-account')?{useChaosAccount:()=>({...account,mutate:()=>{}})}:n.includes('chaos-client-identity')?{chaosIdentityHeaders:()=>discord?{'X-Chaos-Identity':'signed'}:{}}:n.endsWith('.module.css')?{__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})}:{},
  });
  return renderToStaticMarkup(module.exports.ChaosRatedStatus(props));
}
const signed={data:{player:{id:'account',name:'Alice'}},isLoading:false};
test('guest sees casual status and a direct sign-in action',()=>{
  const html=render({data:{player:null},isLoading:false});
  assert.match(html,/Playing as a guest/);assert.match(html,/>Casual</);
  assert.match(html,/href="https:\/\/www.firechess.com\/api\/chaos\/website-login"/);
  assert.match(html,/Sign in to unlock rated play/);
});
test('signed-in timed matchmaking is eligible, with opponent conditions explicit',()=>{
  const html=render(signed);
  assert.match(html,/Signed in as Alice/);assert.match(html,/>Rated eligible</);
  assert.match(html,/opponent must also be signed in/);assert.match(html,/both players must make a move/);
  assert.doesNotMatch(html,/Sign in to unlock/);
});
for(const [props,reason] of [[{unlimited:true},/No rush games are casual/],[{mode:'practice'},/Practice against the AI/]])
  test(`signed-in ${JSON.stringify(props)} stays casual`,()=>{
    const html=render(signed,props);assert.match(html,/>Casual</);assert.match(html,reason);assert.doesNotMatch(html,/>Rated eligible</);
  });
test('signed-in friend matches are rated eligible too, with the daily pair cap spelled out',()=>{
  const html=render(signed,{mode:'friends'});
  assert.match(html,/>Rated eligible</);assert.match(html,/friend must also be signed in/i);
  assert.match(html,/first three games between the same two players each day count/i);
  assert.doesNotMatch(html,/always casual/i);
});
test('guest friend matches stay casual',()=>{
  const html=render({data:{player:null},isLoading:false},{mode:'friends'});
  assert.match(html,/>Casual</);assert.match(html,/Playing as a guest/);assert.doesNotMatch(html,/>Rated eligible</);
});
test('loading and failure do not misrepresent the player as a guest or rated',()=>{
  const loading=render({isLoading:true});assert.match(loading,/Checking sign-in/);assert.doesNotMatch(loading,/Playing as a guest|Sign in to unlock|>Rated eligible</);
  const failed=render({...signed,error:new Error('offline')});assert.match(failed,/Eligibility unavailable/);assert.match(failed,/Retry account check/);assert.doesNotMatch(failed,/>Rated eligible</);
});
test('Discord players receive signed-in eligibility without a website sign-in prompt',()=>{
  const html=render({data:{player:{id:'discord_123456789012345678',name:'Discord Alice'}},isLoading:false},{},true);
  assert.match(html,/Signed in as Discord Alice/);assert.match(html,/>Rated eligible</);assert.doesNotMatch(html,/href=/);
});
test('account panels share an in-flight signed request and ignore results after unmount',async()=>{
  let current, requests=0, resolve;
  const pending=new Promise(done=>resolve=done);
  const module={exports:{}};
  const react={useCallback:fn=>fn,useState:initial=>{
    const owner=current,index=owner.values.length;owner.values.push(initial);
    return [initial,value=>{owner.values[index]=typeof value==='function'?value(owner.values[index]):value}];
  },useEffect:fn=>current.cleanup=fn()};
  vm.runInNewContext(ts.transpile(fs.readFileSync('lib/use-chaos-account.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{
    module,exports:module.exports,window:{addEventListener(){},removeEventListener(){}},
    require:n=>n==='react'?react:{chaosIdentityHeaders:()=>({'X-Chaos-Identity':'signed-discord'})},
    fetch:(url,options)=>{requests++;assert.equal(url,'/api/chaos/account');assert.equal(options.headers['X-Chaos-Identity'],'signed-discord');return pending;},
  });
  const first={values:[]},second={values:[]};
  current=first;module.exports.useChaosAccount();current=second;module.exports.useChaosAccount();
  assert.equal(requests,1);first.cleanup();
  resolve({ok:true,json:async()=>signed.data});
  await new Promise(done=>setImmediate(done));
  assert.equal(first.values[0].isLoading,true);
  assert.equal(second.values[0].data.player.name,'Alice');
  second.cleanup();
});
