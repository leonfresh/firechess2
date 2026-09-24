const {test}=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
const {Chess}=require('chess.js');const {pieceMotion}=require('../lib/chaos-piece-motion.ts');
function play(game,move){const old=game.fen();game.move(move);return pieceMotion(old,game.fen());}
test('pawn travel and knight hop use exact endpoints',()=>{const g=new Chess();assert.deepEqual(play(g,'e4').moves,[{from:'e2',to:'e4',code:'wP',hop:false}]);play(g,'e5');assert.equal(play(g,'Nf3').moves[0].hop,true);});
test('capture retains the actual victim at its square',()=>{const g=new Chess();play(g,'e4');play(g,'d5');const p=play(g,'exd5');assert.deepEqual(p.victims,[{square:'d5',code:'bP'}]);assert.equal(p.moves[0].to,'d5');});
test('en passant victim stays on captured square',()=>{const g=new Chess('7k/8/8/3pP3/8/8/8/K7 w - d6 0 10');assert.deepEqual(play(g,'exd6').victims,[{square:'d5',code:'bP'}]);});
test('castling moves king and rook together',()=>{const g=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');assert.equal(play(g,'O-O').moves.length,2);});
test('promotion carries the pawn to its destination',()=>{const g=new Chess('7k/P7/8/8/8/8/8/K7 w - - 0 1');assert.equal(play(g,'a8=Q+').moves[0].code,'wP');});
test('replay seeks, backwards, same-board drafts and invalid FEN stay quiet',()=>{const g=new Chess(),start=g.fen();g.move('e4');const first=g.fen();g.move('e5');g.move('Nf3');assert.equal(pieceMotion(start,g.fen()),null);assert.equal(pieceMotion(first,start),null);assert.equal(pieceMotion(first,first),null);assert.equal(pieceMotion('bad',first),null);});
test('stationary ranged capture never invents a moving attacker',()=>{assert.deepEqual(pieceMotion('7k/8/8/8/3R1p2/8/8/K7 w - - 0 10','7k/8/8/8/3R4/8/8/K7 b - - 0 10'),{moves:[],victims:[{square:'f4',code:'bP'}]});});
