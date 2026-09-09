const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const moduleUnderTest={exports:{}};
vm.runInNewContext(ts.transpile(fs.readFileSync('lib/chaos-pending-draft.ts','utf8'),{module:ts.ModuleKind.CommonJS}),{module:moduleUnderTest,exports:moduleUnderTest.exports});
const {recoverPendingDraft}=moduleUnderTest.exports;
const saved={baseFen:'before',fen:'after',phase:1,move:{from:'c2',to:'c3'},state:{isDrafting:true,draftChoices:[{id:'camel'}]}};
test('reload preserves the exact pending move and offered cards',()=>{
 const result=recoverPendingDraft(JSON.stringify(saved),'before',0,'white');
 assert.equal(JSON.stringify(result),JSON.stringify(saved));
});
test('server advancement and another side cannot resurrect an obsolete draft',()=>{
 for(const [fen,phase,color] of [['changed',0,'white'],['before',1,'white'],['before',0,'black']])assert.equal(recoverPendingDraft(JSON.stringify(saved),fen,phase,color),null);
});
test('missing or damaged browser journal safely falls back to the saved board',()=>{
 for(const raw of [null,'{','{}',JSON.stringify({...saved,move:null})])assert.equal(recoverPendingDraft(raw,'before',0,'white'),null);
});
