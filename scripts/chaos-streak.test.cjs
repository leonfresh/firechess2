const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const mod={exports:{}};
vm.runInNewContext(ts.transpile(fs.readFileSync('lib/chaos-streak.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{module:mod,exports:mod.exports,require});
const {streakBonus}=mod.exports,summarizeStreak=(...a)=>({...mod.exports.summarizeStreak(...a)});

test('bonus matches migrations/chaos-streak.sql: nothing on day 1, +10 a day, capped at +50',()=>{
 assert.deepEqual([0,1,2,3,5,6,7,30].map(streakBonus),[0,0,10,20,40,50,50,50]);
});
test('no games means no streak, and today is worth nothing yet',()=>{
 assert.deepEqual(summarizeStreak([],'2026-09-24'),{current:0,best:0,playedToday:false,nextBonus:0});
});
test('played today extends the run and shows tomorrow\'s bonus',()=>{
 assert.deepEqual(summarizeStreak(['2026-09-22','2026-09-23','2026-09-24'],'2026-09-24'),{current:3,best:3,playedToday:true,nextBonus:30});
});
test('a run ending yesterday stays alive until today is over',()=>{
 assert.deepEqual(summarizeStreak(['2026-09-22','2026-09-23'],'2026-09-24'),{current:2,best:2,playedToday:false,nextBonus:20});
});
test('a missed day resets the current run but keeps the best',()=>{
 const s=summarizeStreak(['2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-22'],'2026-09-24');
 assert.equal(s.current,0);assert.equal(s.best,4);assert.equal(s.nextBonus,0);
});
test('month boundaries, duplicates and order do not matter',()=>{
 const s=summarizeStreak(['2026-10-01','2026-09-30','2026-10-01','2026-09-29'],'2026-10-01');
 assert.equal(s.current,3);assert.equal(s.best,3);
});
