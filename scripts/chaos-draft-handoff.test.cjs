const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
const source=(process.env.CHAOS_HANDOFF_BASELINE ? require('child_process').execFileSync('git',['show','HEAD:app/chaos/page.tsx'],{encoding:'utf8',maxBuffer:10e6}) : fs.readFileSync('app/chaos/page.tsx','utf8')).replace(/\r\n/g,'\n');
const start=source.indexOf('          if (\n            draftStep === 1');
const end=source.indexOf('          if (\n            draftStep === 2',start);
assert.ok(start>=0 && end>start,'Actual draft handler must be found');
test('receiving White\'s draft lets Black move before their choice',()=>{
 const pick={id:'camel',name:'Camel',icon:'C',tier:'common',description:'Leap'};
 const incoming={currentPhase:0,aiModifiers:[pick],playerModifiers:[]};
 const state={status:'playing',choices:[],pending:0};
 const ctx={authenticated:false,guestPreviewedMods:[],triedLockedModsThisGame:[],justDraftedRef:{current:false},draftStep:1,playerColor:'black',incoming,triggeredDraftForPhaseRef:{current:-1},pendingDraftAfterRevealRef:{current:null},gameRef:{current:{fen:()=>''}},g:{},presentation:{activity:true},
 rollPlayerDraftChoices:()=>[pick],countPiecesFromFen:()=>({}),setOpponentDraftReveal:()=>{},setEventLog:()=>{},spawnPepe:()=>{},tierPepe:()=>'',recomputeChaosMoves:()=>{},
 setChaosState:s=>{const next=typeof s==='function'?s(incoming):s;state.choices=next.draftChoices??[]},setGameStatus:s=>state.status=s,gameStatusRef:{current:'playing'},setPendingPhase:p=>state.pending=p,setWaitingForOpponentDraft:()=>{}};
 vm.runInNewContext(ts.transpile(`(()=>{${source.slice(start,end)}})()`,{target:ts.ScriptTarget.ES2022}),ctx);
 assert.equal(state.status,'playing');assert.equal(state.choices.length,0);
 assert.equal(ctx.pendingDraftAfterRevealRef.current.phase,1);
 assert.equal(ctx.pendingDraftAfterRevealRef.current.choices.length,1);
});

test('accepting a rematch clears a previous draft freeze so pieces can be selected',()=>{
 const a=source.indexOf('  const handleAcceptRematch = useCallback('), b=source.indexOf('\n    // Swap colors',a);
 assert.ok(a>=0&&b>a);
 const body=source.slice(source.indexOf('=> {',a)+4,b);
 let frozen=true;
 const ctx={PEPE:{hyped:""},Chess:require('chess.js').Chess,createChaosState:()=>({}),gameStatusRef:{current:'game-over'},recomputeChaosMoves:()=>{},playSound:()=>{}};
 for(const name of body.match(/\bset[A-Z]\w+/g)??[])ctx[name]=()=>{};
 for(const match of body.matchAll(/\b(\w+Ref)\.current/g))ctx[match[1]]={current:null};
 ctx.setWaitingForOpponentDraft=v=>frozen=v;
 vm.runInNewContext(ts.transpile(`(()=>{${body}})()`,{target:ts.ScriptTarget.ES2022}),ctx);
 assert.equal(frozen,false);
});


