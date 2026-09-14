const ts=require('typescript'),fs=require('fs');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
const {test}=require('node:test'),assert=require('node:assert/strict');
const {Chess}=require('chess.js');
const {createChaosState,ALL_MODIFIERS}=require('../lib/chaos-chess.ts');
const {reduceCommand,metadata}=require('../lib/chaos-room-sync.ts');
function fixture(side='w',hostColor='white',power='standard') {
  const from=side==='w'?'a1':'h8',to=power==='fools-king'?(side==='w'?'b3':'g6'):(side==='w'?'a4':'h5');
  const game=new Chess(`7k/8/8/8/8/8/8/K7 ${side} - - 0 10`);
  game.remove(side==='w'?'h8':'a1');game.put({type:'k',color:side==='w'?'b':'w'},to);
  if(power==='standard'){game.remove(from);game.put({type:'k',color:side},side==='w'?'h1':'a8');game.put({type:'r',color:side},from);}
  const owner=side==='w'?'player':'ai';
  const state={...createChaosState(),[`${owner}Modifiers`]:power==='king-ascension'?[ALL_MODIFIERS.find(m=>m.id===power)]:[],[`${owner}Anomaly`]:['strength','fools-king'].includes(power)?power:null};
  const room={id:'capture-test',hostId:'host',guestId:'guest',hostColor,fen:game.fen(),status:'playing',moveHistory:[],chaosState:{...state,_sync:{revision:0,stateRevision:0,events:[],receipts:[],picks:{host:null,guest:null},rematch:[],clock:{w:10000,b:10000,active:side,since:1000}}}};
  const actor=(side==='w'?'white':'black')===hostColor?'host':'guest';
  const command={id:'king-capture-test-00000001',baseRevision:0,message:{type:'king_capture',from,to}};
  return {room,actor,command,from,to};
}
for(const side of ['w','b'])for(const hostColor of ['white','black'])for(const power of ['standard','king-ascension','strength','fools-king'])test(`${side}/${hostColor}: ${power} king capture ends the game`,()=>{
  const {room,actor,command,from,to}=fixture(side,hostColor,power);
  const patch=reduceCommand(room,actor,command,1000),saved={...room,...patch};
  assert.equal(saved.status,'finished');assert.equal(metadata(saved).result.winner,side==='w'?'white':'black');
  assert.equal(metadata(saved).events.at(-1).message.type,'game_over');assert.equal(metadata(saved).clock.active,null);
  assert.equal(saved.moveHistory.length,1);assert.equal(saved.moveHistory[0].from,from);assert.equal(saved.moveHistory[0].to,to);
  assert.equal(reduceCommand(saved,actor,command,1000),null,'Retry must not duplicate a win');
});
test('illegal, frozen, protected, stale and wrong-turn king captures cannot claim a win',()=>{
  for(const kind of ['illegal','frozen','protected','stale','turn','opening']){
    const {room,actor,command}=fixture();
    if(kind==='illegal')command.message.from='h1';
    if(kind==='frozen'){room.chaosState.playerFrozenSquare='a1';room.chaosState.playerFrozenTurnsLeft=2;}
    if(kind==='protected'){room.chaosState.aiImmuneSquare='a4';room.chaosState.aiImmuneTurnsLeft=2;}
    if(kind==='stale')command.baseRevision=99;
    if(kind==='opening')delete room.chaosState._sync.picks.guest;
    assert.throws(()=>reduceCommand(room,kind==='turn'?'guest':actor,command,1000),undefined,kind);
  }
});

test('client intercepts a normal king capture and waits for the server result',()=>{
  const source=fs.readFileSync(require.resolve('../app/chaos/page.tsx'),'utf8');
  const start=source.indexOf('      // King-capture via chaos move — chess.js rejects kingless FENs');
  const end=source.indexOf('      // First check if this is a chaos move',start);
  assert.ok(start>0&&end>start);
  const block=ts.transpile(source.slice(start,end),{target:ts.ScriptTarget.ES2022});
  for(const side of ['w','b']){
    const {room,from,to}=fixture(side),sent=[];
    const game=new Chess(room.fen);
    const run=new Function('game','chaosState','playerColor','toServerChaosState','getKingCaptureMove','gameMode','partySendRef','from','to',block);
    const result=run(game,room.chaosState,side==='w'?'white':'black',s=>s,require('../lib/chaos-outcome.ts').getKingCaptureMove,'multiplayer',{current:m=>sent.push(m)},from,to);
    assert.equal(result,true);assert.deepEqual(sent,[{type:'king_capture',from,to}]);
    assert.equal(game.fen(),room.fen,'Do not produce an invalid kingless FEN');
  }
});
