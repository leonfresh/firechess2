# Scan performance investigation

## Observed production scan

On 2026-09-09 UTC, scan `90b185fb-75c9-4d74-9ccd-56d4a67012bc`
analyzed 300 Lichess games for leonfresh at depth 12. Its public API reports
creation at 15:03:07 and its final update at 15:27:57 (24m50s wall time;
this is not isolated engine CPU time). The browser showed tactics at game
230/300 while openings and endgames were complete. It eventually rendered
344 findings in the modern report.

The 97% overall indicator was ahead of the remaining tactics work because
parallel phases share a monotonically increasing maximum percentage.
This presentation issue remains separate from engine execution time.

## Confirmed redundant work

The pool cached completed evaluations but not pending evaluations. Parallel
sections requesting the same FEN/depth could send identical work to all four
workers. `node scripts/stockfish-pool.test.cjs` exercises the real pool and
client against a deterministic UCI worker double. Before the change, four
concurrent depth-12 requests produced four searches and failed the assertion.
Afterward they produce one. Different depth/skill settings stay isolated,
completed deeper evaluations remain reusable, and failed requests can retry.

This is a search-count regression test, not an end-to-end speed benchmark.
The optimization preserves requested depth and analysis coverage. It does not
establish that a 300-game scan is now four times faster: unique positions still
need their own searches, and a fresh matched full-scan timing is outstanding.
