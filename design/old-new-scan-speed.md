# Old and new scan speed comparison

Measured 2026-09-09 UTC using Chrome on the same machine, sequential scans,
12 leonfresh Lichess games, full report, depth 12, 30 opening moves, threshold
50 cp, all time controls, no date filters. All five completed scans have the
same scan signature, confirming the same analysis inputs and game set.

| Entry point / report | Run 1 | Run 2 |
| --- | ---: | ---: |
| Actual pre-redesign deployment, classic report | 10.103 s | 8.437 s |
| Current modern landing and report | 9.152 s | 7.310 s |
| Retained /oldlanding, current report | 7.926 s | — |

Timing is the server-recorded scan creation to final update, including game
fetching, engine startup, analysis, and result persistence. It excludes initial
landing-page load and manual form entry. Browser observations verified reports
completed. Full document navigation between runs reset engine memory caches.
Downloaded games can remain cached; the historical origin's first run had a
fresh origin cache, so its second run is the closer warm-cache comparison.
Historical deployment ran as a guest; current production used the signed-in
Lifetime account. Scan signatures and effective analysis settings matched.

Historical deployment: dpl_Gk3xq7qyiM8HqzWXJZCEDg1YUmL2.
Current deployment: dpl_71MJdhDoEp6crQ61LpV9gGe1Eng2 (f3409ee).

Scan IDs in table order:
- Historical: 670cf852-65b6-4824-81db-b3568e6678bc, 25253eb3-0418-43ca-bc43-6833175e0180
- Modern: fd41f669-cdae-430b-8b92-2e6b88860013, 0cd6c1da-e81c-497b-b56f-deb1057147a4
- Retained old landing: 20ffcc2d-41a4-415a-8e69-9816c6637567

Shared signature: 59dbb049388c167bb781acaf4cd973a2d7a47af437dfe43e36574fd8e50ee00b.

## Findings

No evidence of an engine slowdown caused by the landing redesign in this small
sample. The rollout's source diff did not change client-analysis.ts or
stockfish-client.ts. The later f3409ee optimization shares pending evaluations.
Two trials do not establish a reliable percentage speedup, nor do 12-game runs
establish performance at 300 games.

The classic report visibly exposed partial results while analysis continued:
five endgame findings were available while the scan still showed Running and
positional analysis. The new progress screen waits until all analysis finishes
before exposing the report. That is a real regression in time to usable results,
distinct from total scan runtime. Both versions also showed the misleading 97%
progress behavior. No application changes were made during this comparison.
