const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const mod={exports:{}};
vm.runInNewContext(ts.transpile(fs.readFileSync('lib/chaos-busy-hours.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{module:mod,exports:mod.exports,Array,Math,Number});
const {busiestLocalHour,hourLabel}=mod.exports;
const peakAt=(utcHour,games=30)=>Array.from({length:24},(_,h)=>h===utcHour?games:0);

test('shifts the UTC peak into the viewer\'s zone',()=>{
 assert.equal(busiestLocalHour(peakAt(10),0),10);      // UTC
 assert.equal(busiestLocalHour(peakAt(10),-600),20);   // Sydney, UTC+10: 10:00 UTC is 8pm
 assert.equal(busiestLocalHour(peakAt(2),240),22);     // New York, UTC-4: wraps to the previous day
 assert.equal(busiestLocalHour(peakAt(10),-330),16);   // India, UTC+5:30 rounds to the nearest hour
});
test('a broad evening beats one noisy hour',()=>{
 const counts=Array(24).fill(0);counts[3]=12;counts[18]=8;counts[19]=9;counts[20]=8;
 assert.equal(busiestLocalHour(counts,0),19);
});
test('too few games, or a malformed payload, shows nothing',()=>{
 assert.equal(busiestLocalHour(peakAt(10,19),0),null);
 assert.equal(busiestLocalHour([1,2,3],0),null);
 assert.equal(busiestLocalHour(Array(24).fill(-5),0),null);
});
test('labels read naturally',()=>{
 assert.deepEqual([0,1,11,12,13,20,23].map(hourLabel),['midnight','1am','11am','noon','1pm','8pm','11pm']);
});
