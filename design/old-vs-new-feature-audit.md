# Original vs redesigned experience

## Method and authentication

Compared the same real one-game scan on original and new report routes, and supplied that report as a saved-report fixture to both dashboards. A fresh headless Chrome context simulated Free and Pro `/api/me` responses, with every non-GET request blocked. No real account, subscription, purchase, goal or report was created or deleted by this harness. `scripts/compare-redesign.cjs` produces screenshots, page text and summaries in the OS temp directory.

Separately verified the real server session path using a five-minute, non-admin JWT for a synthetic nonexistent identity. Token existed only in process memory. `/api/auth/session` and `/api/me` accepted it; `/api/reports` returned an empty list. This verifies session decoding and the authenticated read path, not OAuth, email delivery, subscription lookup for an actual customer, or account creation.

Provider diagnosis: `.env.local` has none of the required Google, Lichess or Resend provider credentials (nor the common Google/Resend aliases checked). `/api/auth/providers` returns `{}`. No production auth bypass or provider was added. Real provider login still needs genuine credentials and callback configuration.

## Feature parity

| Area | Original | Redesign | Recommendation |
|---|---|---|---|
| Scanning | Chess.com, Lichess, PGN; advanced settings; remembers scan preferences | Sources/settings present; real guest scan passed; preferences not restored | Restore scan preferences before homepage switch |
| Opponent preparation | Dedicated opponent scan entry | Any public username works, but dedicated entry absent | Add a compact opponent-preparation entry |
| Report lifecycle | Processing, regenerate, expiry warning, save | Ready-report viewing; links back for lifecycle operations; temporary scan labelled saved | Integrate lifecycle controls and correct guest labelling before report replacement |
| Finding exploration | Section cards and board actions | Unified categories, search, pagination, legal exploration, arrows, practice, engine-line playback | Preserve new organization |
| Guided report tour | Whole-report GuidedWalk and entry choice | Individual move explanation only | Restore optional whole-report walkthrough |
| AI coaching | Loads cached analysis or generates it via useReportAnalysis | Reads result.aiAnalysis only | Restore generation/loading/error path, respecting plan policy |
| Share/export | Highlight cards and PNG downloads | Copy-link action only | Restore share/export tools |
| Positional learning | Motif detail, standalone lesson builder, opposite-side castling analysis | Basic findings/structures plus time-positional lesson cross-reference | Restore missing standalone lessons and castling analysis |
| Report detail | Rankings, repertoire statistics, mental game, endgames, best-game replay | Much of this preserved in disclosures | Keep disclosures; check larger data fixtures before declaring complete parity |
| Dashboard practice | Daily challenge directly from saved tactics | Links out to training | Restore a compact daily practice card |
| Dashboard planning | StudyPlanWidget, goals and achievements | Absent | Restore as secondary panels |
| Repertoire workflow | Dashboard panel plus add-from-opening-card | Links to old dashboard; no integrated management/add workflow | High-priority restoration |
| Saved report management | Delete report, inline detail, player selection/history | Search/list/resume; management delegated to original | Restore delete and relevant player filters |
| Progress | Accuracy/rating charts and progress highlights | Comparable, non-overlapping accuracy history only | Retain stricter comparisons; add useful additional measures without invented rating claims |
| Training | Eight functional modes | New hub routes to existing eight-mode trainer | Modes retained; game interiors remain original |
| Global navigation | Large legacy menu | Shared header/footer; Play directory | Retained destinations with clearer grouping |
| Monetization | Original entitlements | Proposed, stricter client-side preview limits | Server enforcement still required; simulated Pro UI is not a paywall test |

## Replacement recommendation

The redesign is not feature-complete. Homepage can be considered separately after restoring preference convenience and making the scan-to-report route choice deliberate. Do not retire the original report/dashboard until lifecycle actions, repertoire, planning/daily practice, share tools and guided coaching are carried over. Keep game routes in place.

Browser simulation is useful to unblock UI work but must not be reported as successful end-to-end provider login or payment testing. A one-game fixture does not exercise every conditional report section or multi-report history.

## Restoration implementation

- Added daily challenge, goals, study plans, achievements and repertoire panels to the signed-in redesigned dashboard, using existing components. Added player selection for practice and saved-report deletion with confirmation and failure handling. Demo mode cannot delete reports or mount account tools.
- Added an expandable report workspace that fetches the current public scan and mounts the existing ScanSessionPage inside the redesigned page. This restores save/regenerate/expiry controls, guided walkthrough, AI generation, lessons, castling and motif analysis, repertoire additions and share cards through the existing workflow. These advanced tools retain their original layout/access rules; this is component reuse, not independent modern implementations.
- Restored shared fc-scan-prefs storage with plan-aware limits and storage-error handling; PGN contents are not persisted. Added opponent-preparation guidance to the scan form.
- Added stored estimated-rating and weighted-CP-loss columns to comparable progress values.
- The authenticated UI harness blocks all mutations: it verifies rendering/access states and loading of tools, not real deletion, study-plan writes, OAuth, payment or AI generation. Server-side paywall migration remains separate.
