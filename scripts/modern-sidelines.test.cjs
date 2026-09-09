const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const ts = require('typescript'), assert = require('node:assert/strict');
let explorerMoves = [];
function load(relative) {
  const file = path.resolve(relative), mod = new Module(file, module);
  mod.filename = file; mod.paths = module.paths;
  const original = mod.require.bind(mod);
  mod.require = name => name === '@/lib/lichess-explorer'
    ? { fetchExplorerMoves: async () => ({ moves: explorerMoves }) } : original(name);
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, file);
  return mod.exports;
}
const {buildReportPositions} = load('components/modern-preview/report-data.ts');
const {qualifiesAsSideline, lookupSideline} = load('components/modern-preview/sideline-data.ts');
const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const row = {fenBefore:fen,userMove:'e2e4',bestMove:'d2d4',cpLoss:80,dbApproved:true,dbWinRate:.53,dbGames:6000};
const result = {leaks:[row],oneOffMistakes:[],missedTactics:[],endgameMistakes:[]};
const [pattern] = buildReportPositions(result,true);
assert.deepEqual(pattern.sideline,{approved:true,score:.53,games:6000});
assert.equal(pattern.severity,'Offbeat sideline');
assert.equal(pattern.best,'d4');
assert.equal(pattern.cpLoss,80);
assert.equal(buildReportPositions({...result,leaks:[{...row,dbApproved:false}]},true)[0].sideline,undefined);
assert.equal(qualifiesAsSideline(120,6000,.53),true);
assert.equal(qualifiesAsSideline(120,49,.9),false);
assert.equal(qualifiesAsSideline(120,6000,.2),false);
assert.equal(qualifiesAsSideline(500,6000,.53),false);
assert.equal(qualifiesAsSideline(null,6000,.53),false);
(async()=>{
  explorerMoves=[{uci:'e2e4',totalGames:6000,winRate:.53}];
  assert.deepEqual(await lookupSideline(pattern),pattern.sideline);
  explorerMoves=[{uci:'d2d4',totalGames:6000,winRate:.53}];
  assert.equal(await lookupSideline(pattern),undefined,'must match the played move');
  console.log('PASS: stored sideline data survives mapping, engine assessment stays intact, and explorer fallback uses the played move and classic thresholds.');
})().catch(error=>{console.error(error);process.exitCode=1;});
