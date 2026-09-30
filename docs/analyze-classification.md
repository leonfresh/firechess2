# PGN analyzer move classification

`app/analyze/page.tsx` classifies each played move by **centipawn loss** from the
mover's point of view, using `classifyCpLoss` / `evalForMover` from
`lib/move-quality.ts` (the same thresholds as the `/coach` review surface).

Before this, the analyzer used the raw position evaluation (`Math.abs(e.cp)` of
the position *before* the move), so any move in a >3-pawn position was labelled
`best` or `blunder` regardless of the move. A move that kept a winning or lost
position is now `good`; real losses in a balanced position still map to
`best` / `good` / `inaccuracy` / `mistake` / `blunder` by loss.

The evaluation after move *i* is the evaluation of the position before move
*i + 1*, so the next ply's eval is reused as the "after" eval; only the final
position costs one extra engine call.

## Regression check

No test runner is configured and the change tool rejects new `.js`/`.cjs` files,
so run this one-liner from the project root:

```sh
node -e "const fs=require('fs'),ts=require('typescript'),M=require('module'),p=require('path');const f=p.resolve('lib/move-quality.ts'),m=new M(f);m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);const{classifyCpLoss,evalForMover}=m.exports,a=require('assert').strict;a.equal(evalForMover(120,'b'),-120);a.equal(classifyCpLoss(0,true,500,500),'best');a.equal(classifyCpLoss(10,false,500,490),'good');a.equal(classifyCpLoss(20,false,-300,-320),'good');a.equal(classifyCpLoss(40,false,20,-20),'inaccuracy');a.equal(classifyCpLoss(120,false,20,-100),'mistake');a.equal(classifyCpLoss(350,false,20,-330),'blunder');a.equal(classifyCpLoss(NaN,false,0,0),'good');console.log('pgn classification regressions passed');"
```
