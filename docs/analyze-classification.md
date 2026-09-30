# PGN analyzer move classification

`app/analyze/page.tsx` classifies each played move by **centipawn loss** from the
mover's point of view via `classifyPlies` in `lib/move-quality.ts`, which uses
`classifyCpLoss` / `evalForMover` (the same thresholds as the `/coach` surface).

Before this, the analyzer used the raw position evaluation (`Math.abs(e.cp)` of
the position *before* the move), so any move in a >3-pawn position was labelled
`best` or `blunder` regardless of the move. A move that kept a winning or lost
position is now `good`; real losses in a balanced position still map to
`best` / `good` / `inaccuracy` / `mistake` / `blunder` by loss.

The evaluation after move *i* is the evaluation of the position before move
*i + 1*, so the next ply's eval is reused as the "after" eval; only the final
position costs one extra engine call.

## Regression check

Run the checked-in node test (Node 22.6+):

```sh
node --experimental-strip-types --test scripts/analyze-classify.test.ts
```

It imports `lib/move-quality.ts` directly, so `chess.js` resolves from the repo's
`node_modules`. The old `Module._compile` one-liner failed with
`Cannot find module 'chess.js'`.
