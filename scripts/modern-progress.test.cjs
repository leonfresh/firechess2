const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),path=require('node:path'),assert=require('node:assert/strict');
const file=path.resolve('components/modern-preview/progress-data.ts'),m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,file);
const base={id:'a',chessUsername:'player',source:'chesscom',estimatedAccuracy:75,scanMode:'both',engineDepth:12,maxMoves:30,cpThreshold:50,maxGames:50,gamesStartDate:100,gamesEndDate:200};
const later={...base,id:'b',gamesStartDate:201,gamesEndDate:300,estimatedAccuracy:80};
const bad=[{...base,id:'overlap',gamesStartDate:150,gamesEndDate:250},{...base,id:'other',chessUsername:'other'},{...base,id:'depth',engineDepth:24},{...base,id:'nodates',gamesStartDate:null},{...base,id:'invalid',estimatedAccuracy:NaN}];
assert.deepEqual(m.exports.comparableHistory([later,base,...bad],base).map(r=>r.id),['a','b']);
assert.deepEqual(m.exports.comparableHistory([base],{...base,engineDepth:null}),[]);
assert.deepEqual(m.exports.comparableHistory([later,{...base,id:'same-player',chessUsername:'PLAYER'}],base).map(r=>r.id),['same-player','b']);
console.log('PASS: comparisons exclude overlaps, other players, changed settings, missing dates and invalid values.');
