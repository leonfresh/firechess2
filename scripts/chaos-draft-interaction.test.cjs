const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
const source=fs.readFileSync('app/chaos/page.tsx','utf8').replace(/\r/g,'');
const start=source.indexOf('  const handleSquareClick = useCallback(');
const body=source.slice(start+source.slice(start).indexOf('(square: CbSquare)'),source.indexOf('\n    },\n    [',start)+6);
function handler(waiting){const calls=[];const context={gameStatus:'playing',waitingForOpponentDraft:waiting,selectedSquare:'e2',anomalyActivationMode:null,setSelectedSquare:()=>calls.push('selection'),setLegalMoveSquares:()=>calls.push('moves'),setHoverMoveSquares:()=>calls.push('hover'),exports:{}};vm.runInNewContext(ts.transpile('exports.click = '+body,{target:ts.ScriptTarget.ES2022}),context);return {click:context.exports.click,calls};}
test('opponent drafting ignores piece clicks without changing selection or movement highlights',()=>{const h=handler(true);h.click('e2');h.click('e4');assert.deepEqual(h.calls,[]);});
test('after draft a second click on the selected piece can deselect it again',()=>{const h=handler(false);h.click('e2');assert.deepEqual(h.calls,['selection','moves','hover']);});
