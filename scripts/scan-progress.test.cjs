const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path'), Module=require('node:module'), ts=require('typescript');

test('last tactics game remains in progress until its engine work finishes', {timeout:5000}, async () => {
  let release, entered;
  const gate = new Promise(r=>release=r);
  const evaluating = new Promise(r=>entered=r);
  const pool = {size:1,evaluateFen:async()=>{entered();await gate;return null;}};
  const file=path.resolve('lib/client-analysis.ts'), mod=new Module(file,module);
  mod.filename=file;mod.paths=module.paths;
  mod.require=id=>id==='@/lib/stockfish-client'?{stockfishPool:pool}:id.startsWith('@/')?{}:require(id);
  mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
  const pgnText=Array.from({length:50},(_,i)=>`[Event "Game ${i}"]\n[White "Tester"]\n[Black "Opponent"]\n[Result "*"]\n\n${i===49?'1. e4 e5 2. Qh5 Nc6 3. Bc4 *':'1. e4 e5 *'}`).join('\n\n');
  let progress, ready=false;
  const run=mod.exports.analyzeOpeningLeaksInBrowser('Tester',{source:'pgn',pgnText,scanMode:'tactics',maxGames:50,onProgress:p=>{if(p.phase==='tactics')progress=p;},onSectionReady:s=>{if(s==='tactics')ready=true;}});
  try {
    await evaluating;
    console.log('While final engine search is pending:', JSON.stringify(progress));
    assert.equal(ready,false);
    assert.ok(progress.current < 50, 'must not report Game 50 of 50 as completed while the last game is still being evaluated');
  } finally { release(); await run; }
  assert.equal(ready,true);
  assert.equal(progress.current,50);
});
