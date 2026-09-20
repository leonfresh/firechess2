# Chaos Chess launch checklist

Updated: 2026-09-07

## Hosting and persistence

The database stores rooms, board state, powers, opening choices and ordered sync events. Clients use `/api/chaos/live` WebSockets for commands and immediate commit notifications, then read ordered events over the same socket. `/api/chaos/sync` remains the authenticated command handler and HTTP recovery path. This is database-backed synchronization, not a direct browser-to-realtime-database subscription.

The Activity frontend is deployed at `https://chaos-chess-activity.vercel.app`, with the API at `https://www.firechess.com` and hibernating WebSockets at `https://chaos-chess-live.cixxyz.workers.dev`. Discord's root and `/live` URL mappings now use these permanent hosts. A full match passed through Discord's actual HTTP and WebSocket proxy with both local Next.js servers stopped.

Discovery is enabled in Discord, with KittyStudios as the support server. Discovery does not deploy or host the application.

## Priority 1 — Multiplayer QA and recovery

- [x] Complete a fresh two-player match flow: opening picks, alternating moves, both power picks, continued play and a terminal result. Verified in two independent browser sessions.
- [x] Refresh each side during opening choices, between power picks and during normal play; verify the same position and correct turn recover. Browser checks cover opening reloads, both sides' normal play, White's unconfirmed first draft and Black's between-pick recovery; hosted socket recovery covers seven checkpoints. Physical-device resume and exhaustive power combinations remain separate checks.
- [x] Interrupt connectivity with an action pending; verify recovery applies it exactly once and never silently overwrites newer state. Verified with the actual transport hook under controlled network failures; not a real-device airplane-mode test.
- [x] Exercise simultaneous submissions and stale clients against the real API/database.
- [x] Exercise draw offers, acceptance, resignation and rematch; verify colors swap and pieces unlock. API coverage for all; browser coverage for offering and accepting a draw.
- [ ] Cover powers that spawn pieces, alter movement or change the board without a normal move. Abundance spawn coverage and Camel reducer coverage exist; broader ability combinations and browser execution remain outstanding.
- [x] Verify event-window recovery after a client misses more events than the retained log. Reducer retention plus actual transport hook gap recovery tested.
- [x] Record defects and regression checks below. Treat passing tests as bounded evidence, not exhaustive validation or a load test.

Existing checks: `node --test scripts/chaos-sync.test.cjs scripts/chaos-draft-handoff.test.cjs` and `node scripts/chaos-sync-http-test.mjs`. The HTTP check creates isolated test rooms and finishes them.

## Priority 2 — Permanent hosting

- [x] Provision shared messaging for Vercel: `chaos-chess-live` Upstash Redis Free plan (500,000 commands/month), connected to `firechess2` Production, Preview and Development. Created through Vercel Marketplace on 2026-09-07; no separate provider signup needed.
- [x] Replace the planned Redis gateway with a separate Cloudflare Worker and hibernating Durable Objects on Free. Hosted full-match verification passed through Discord's proxy.
- [x] Deploy the current API and Activity client together to stable hosting. Both Vercel production builds passed on 2026-09-07.
- [x] Set the Activity's production `FIRECHESS_ORIGIN` to the hosted API, and configure required secrets privately on the host.
- [x] Replace temporary Discord URL mappings with stable HTTPS origins. Saved and reloaded in the Developer Portal.
- [ ] Verify iframe policy, Discord authentication, guest membership, assets, audio and AI workers through Discord's proxy.
- [x] Prove a fresh two-player match works with the local servers and tunnels stopped. Full Discord-proxy match suite passed (`4L39WM`, 42 notifications).
- [x] Document rollback, error monitoring and operating costs in `workers/chaos-live/README.md`.
- [x] Run a bounded concurrent-room load test and record latency/error rates before expanding to launch-scale testing. Four rooms/eight simulated players passed; see timing record below. This does not establish launch capacity.
- [ ] Reduce and remeasure hosted request latency; this smoke test saw approximately 0.5-second medians and up to 2 seconds for individual requests.

## Priority 3 — Mobile and onboarding

- [ ] Complete real-device Discord testing on iOS and Android. Both platforms were enabled on 2026-09-07 at the user's request after browser smoke checks; native Discord behavior remains unverified.
- [ ] Check board sizing, touch selection/deselection, draft scrolling and ability controls on narrow screens.
- [x] Add a short first-match explanation: opening anomaly → chess moves → successive power drafts. Expandable first-match guide added to the Activity lobby.
- [ ] Explain frozen pieces, unavailable abilities and rejected moves in the interface.
- [ ] Check reduced motion, sound controls, keyboard navigation and readable contrast.

## Priority 4 — Balance and pacing

- [ ] Play complete matches with varied power combinations and both colors.
- [ ] Review forced stalls, confusing captures, runaway advantages and draft pacing.
- [x] Keep all Activity powers available while validating the core game. Code audit confirms Activity drafts omit the unlock restriction and skip collection-based choice filtering.
- Monetization remains deferred until the match loop is reliable and understandable; this is a product decision, not an unfinished launch task.

## QA record

### 2026-09-07 — Pending draft recovery fix and gateway callback removal

- White's unconfirmed move, exact offered cards and pending phase are journaled in tab session storage. Reload restores them only if the authoritative board, phase and player color still match. Server rejection clears the journal; confirming/finishing removes it. The server still validates the eventual bundled move+power command. This restores a reload in the same tab, not a new device.
- Hosted browser room `QXQEEL`: c2–c3 opened King's Chains/Torpedo Pawns/Dragon Bishop; reloading restored the same cards and pending board. White confirmed Dragon Bishop, Black chose Torpedo Pawns and moved d7–d6, then White reloaded into normal play at round 6 with its power intact. The former repeat-the-triggering-move problem was not reproduced after the fix.
- Removed the Vercel→Cloudflare notification callback for gateway-authenticated commands. The gateway notifies peers after a successful API response, even if the submitting socket has disconnected. HTTP fallback retains the protected callback. No notification is sent for rejected commands; action receipts and revision checks are unchanged.
- All 32 automated checks passed, including new pending-draft restoration/staleness tests and gateway commit delivery tests. Both production builds passed. API deployment `dpl_A4WvUPKi8BGGMJRjDTcgpMwjxEES`, Activity `dpl_54gZi4917riSRXXMxq58C2eehw4Y`, Worker `7726e9f1-a017-47c1-b365-7948ceaddfaa`.
- Repeated the same four-room concurrency test: all passed, 176 live requests, 24 notifications per room (sender notifications are now omitted). Rooms `5L4CAH`, `X3FMNV`, `LZJYB4`, `TB8WED`. Per-room p50=533/575/508/518 ms, p95=1368/1163/1346/1724 ms, maxima=1750/1532/1963/2913 ms.
- The timing comparison does **not** demonstrate a latency improvement; the latency checklist item remains open. Next measurement should separate gateway/API/database processing from network travel and local serialization before choosing another optimization.
- Final hosted recovery suite `6653A2` passed all seven reconnect checkpoints and HTTP fallback duplicate recovery through Discord's proxy (76 requests, 42 notifications). This verifies the callback optimization preserves the fallback path.

### 2026-09-07 — Browser reloads, concurrent rooms and picker usability

- `scripts/chaos-concurrency-test.mjs` ran four complete hosted matches simultaneously through Discord's proxy (eight players; 176 measured live requests). All four completed without test failures and each received 42 notifications. Rooms: `EESS8F`, `G25PAX`, `WYLQCK`, `YG9GSD`.
- Per-room request p50: 484/514/529/541 ms; p95: 1082/1480/1025/1486 ms; maxima: 1205/1985/1486/1822 ms. These are client-observed read/command timings, including local serialization waits, from this machine through Discord, Cloudflare, Vercel and Neon. They are not pure WebSocket transmission or opponent-render latency. No capacity claim follows from four rooms.
- Browser room `4E7DDP`: independent sessions reloaded during opening selection, recovered during normal play, and restored Black's picker after White drafted Dragon Bishop. Black selected Camel, played the c6–b3 leap, and White reloaded and recovered the correct position and turn.
- Browser room `4E7DDP` finished in Draw by Agreement; White displayed “Match complete.” No page errors were reported in Black's browser session.
- Known recovery UX gap: reloading White's first draft before confirmation restores the last committed board, requiring the triggering move to be repeated. Repeating c2–c3 reopened the draft successfully. The unconfirmed move/picker is not persisted; do not mark full draft reload UX complete.
- Short-viewport clicks on the old off-screen anomaly footer did not activate it in the automation, while keyboard focus + Enter worked. This was not a saved-pick failure. Changed draft layout so only cards scroll and actions remain visible.
- Verified new power-picker footer at 375×667: bounds y=529–650, document width=375, no horizontal overflow. Selected and confirmed Camel through the updated picker. Screenshot: local temp `chaos-mobile-draft-qa.png`. This uses desktop Chromium viewport emulation, not native touch hardware.
- Added an expandable first-match guide covering opening choices, click-to-move/deselect and White-then-Black power drafts. Activity production build passed and deployment `dpl_6qMuuFqQZReck5jp4RBtZ5rKdqHj` is live.
- Remaining priorities: exact first-draft UI restoration, physical Discord mobile sessions, broader special abilities and balance, keyboard/contrast audit, and latency improvement before larger load testing.

### 2026-09-07 — Additional hosted recovery testing

- Added `--recovery` to `scripts/chaos-sync-http-test.mjs`. It destroys both client sockets and obtains new room tickets/connections during opening choices, completed opening choices, normal play, the first power choice, between power choices, completed power choices and an HTTP fallback commit. Each side's saved board, powers, picks and state revision must match before/after reconnect.
- Standard hosted match `X5DUBW` passed every checkpoint through Discord's actual proxy and finished in a draw, with 60 live notifications.
- An action committed through HTTP was retried with the same ID after reconnect. Its revision stayed unchanged and exactly one corresponding event remained. This tests duplicate recovery after a known commit; it does not simulate a physical device losing its radio mid-request.
- All 28 automated reducer, draft-handoff, transport, renderer and Cloudflare checks passed again.
- Added `--abundance` to exercise both sides' spawned pawns against the hosted backend instead of only the local reducer.
- Abundance match `88LSFG` passed: c3/f3 white pawns and c6/f6 black pawns persisted, both players recovered at all seven checkpoints, and the match completed after a rematch and sequential drafts. It received 60 notifications. The rematch uses the normal opening, so this does not claim every later power was tested in combination with Abundance.
- Source review confirms reduced-motion CSS and a screen-shake guard exist, but keyboard, contrast and full reduced-motion browser checks are still pending. Earlier touch smoke checks are recorded below; they do not complete physical-device testing.

### 2026-09-07 — Cloudflare and Vercel permanent deployment

- Deployed `chaos-chess-live` in the existing Cloudflare account on Free. No domain/DNS edits or paid upgrades. The earlier free Redis resource is unused.
- Added signed room-scoped live tickets, hibernating socket attachments, exact allowed origins, bounded messages/connections and post-commit notifications shared with HTTP fallback. Neon remains authoritative.
- All existing 25 checks and three new Cloudflare checks passed. The new tests cover cross-runtime signature verification, forged/foreign-room credentials, origin restrictions, protected notifications and restored hibernating sessions.
- Root TypeScript check and both hosted production builds passed. Set `npm ci` explicitly to avoid the stale pnpm lockfile blocking deployment.
- Full real-database WebSocket matches passed against the hosted API (`7DMEJQ`) and hosted Activity proxy (`M8QVU8`), with 42 commit notifications each. Both test rooms finished in an agreed draw after rematch and sequential power drafts.
- Hosted browser smoke check: lobby and anomaly selection rendered; e2–e4 received an AI e7–e6 reply. Logo, audio and Stockfish WASM returned HTTP 200.
- Current API deployment: `dpl_EV2AAoKDgMruVHUcyL6cb8gtjFb7`. Activity: `dpl_45oaaqXQwL4LsGZcf2YFLxjeusU5`. Worker version: `0fd44602-0b3b-4374-acb1-6f7a16a2ba66`.
- Discord mappings saved and reloaded: `/` → `chaos-chess-activity.vercel.app`, `/live` → `chaos-chess-live.cixxyz.workers.dev`. The unused `/party` tunnel mapping was replaced; CDN mappings were preserved.
- With local Next.js servers on 3001/3002 stopped, the full match suite passed through `https://1546003954616500245.discordsays.com/.proxy` and its `/live` WebSocket mapping (room `83S5PJ`, 42 notifications). The proxied browser lobby rendered and logo, audio and Stockfish WASM returned 200. This is proxy transport verification, not a physical-device Discord SDK session test.
- Old Chaos Chess tunnels were then stopped and the full Discord-proxy match suite passed again (`4L39WM`, 42 notifications). Native Discord launch/session and physical mobile checks remain pending.

### 2026-09-07 — Vercel prerequisites

- Confirmed the signed-in Pro team is `leon-freshs-projects` and the existing backend project is `firechess2`.
- Created `chaos-chess-live` in Upstash's Free plan, primary region `iad1`, eviction disabled, without adding a paid plan. Connected it with the `CHAOS_REDIS` environment-variable prefix. Its connection variables include `CHAOS_REDIS_REDIS_URL` and `CHAOS_REDIS_KV_REST_API_*`.
- Verified CLI authentication as `leonfresh`, linked this checkout to the existing Vercel project, and pulled Development variables into the ignored `.vercel/chaos-development.env` file without overwriting `.env.local` or displaying secrets.
- This completes Redis/account setup only. No Vercel application deployment or Discord origin switch has happened yet.

### 2026-09-07 — Mobile smoke checks and platform enablement

- Checked the lobby, opening anomaly picker, board and first power draft in Chromium at iPhone 15 (393px) and Pixel 9 (412px) viewport presets. Also checked 375×667 portrait and 852×393 landscape for horizontal overflow; none found.
- Explicitly enabled touch emulation and dispatched real browser touch-start/end input: e2 selection displayed destinations, a second tap removed them, and e2–e4 executed with an AI reply. Continued using touch through five moves and reached the power draft.
- Selected and confirmed The Verdict opening anomaly, then Dragon Bishop at the first power draft; play resumed with the next draft at turn 10. Card selection/confirmation used browser clicks; piece moves used touch input. No page errors were reported.
- Saved Web, iOS and Android as supported platforms in Discord's Developer Portal, then reloaded and verified all three persisted. Orientation remains Unlocked.
- These are Chromium viewport/touch smoke checks, not physical iPhone/Android or native Discord tests. The user's mobile tester should relaunch the Activity and verify login, audio, multiplayer and suspend/resume behavior.
- `scripts/chaos-mobile-touch.mjs` can repeat piece taps against an isolated agent-browser CDP session using `CHAOS_MOBILE_CDP` and square arguments. It reads DOM results; it does not alter game state directly.

### 2026-09-06 — WebSocket transport

- Added authenticated WebSocket commands and immediate post-commit notifications through the existing Activity origin. The database command reducer, action receipts and revision checks remain shared with HTTP.
- Preserved HTTP fallback, reconnect backoff, pending action IDs, missed-event snapshots and periodic reconciliation.
- All 25 automated checks passed, including real socket membership/origin checks, immediate delivery, notifications during an in-flight request, and lost-socket retries with the original action ID.
- Both production builds passed. Pinned Next.js to the previously running 15.5.21 release so dependency installation cannot silently restore the older lockfile version.
- The complete real-database match suite passed over WebSockets directly (`RSNDAB`) and through the Activity upgrade proxy (`EBZ5F8`), each receiving 42 server-pushed notifications. This covers opening choices, move conflicts, duplicate retries, sequential drafts, continued play, resignation, rematch and an agreed draw.
- Fixed duplicate upgrade handling between Next's rewrite proxy and the custom Activity gateway; the final Activity-path match test passed afterward.
- The same full suite also passed through the local `/.proxy/api/chaos/live` path (`7YR89S`, 42 notifications), and over HTTP fallback (`PUCAXP`). This checks our Discord-compatible path, not Discord's hosted proxy itself.
- Current local servers run the persistent WebSocket entry point. Permanent hosting, Discord's actual production proxy, real mobile networks and multi-instance pub/sub remain unverified or pending. No deployment was performed.

### 2026-09-06 — Current pass

Automated checks completed:

- The actual HTTP transport hook passes simulated lost-acknowledgement retries, conflict rollback/queue clearing, refresh snapshots with skipped opening choices, and event-window gap recovery (`scripts/chaos-transport.test.cjs`). These are controlled failure simulations, not a load test.
- The real database/API test passes concurrent opening picks, membership, competing moves, duplicate retries, event replay, resignation, rematch color swaps, both sequential draft picks, enforcement of draft waiting, resumed play and an agreed draw. Isolated test room `C3ZC3F` finished.
- The reducer retains exactly the latest 64 events while preserving the current room snapshot.

Defects found and fixed:

1. **Abundance had no multiplayer pawn placement.** The server now persists its extra pawns as part of the opening choice, and multiplayer startup applies both players' placements. Duplicate opening choices cannot reapply the effect. A regression test first failed on the missing c3 pawn and now passes for both colors.
2. **Hover updates replaced custom piece renderer identities.** This remounted the pointer target during selection. The board compatibility wrapper now memoizes the converted piece components. The renderer-identity regression test failed before the fix and passes after it. The exact browser click-to-move sequence subsequently succeeded.

Browser checks: room `NKU86W` created and joined by independent in-app and Edge sessions; a saved opening choice recovered after refresh. After fixing pointer selection, both sides moved through the first draft. White picked Pawn Bayonet; Black refreshed between picks, recovered the picker, chose Torpedo Pawns and moved d7–d6. White received the move with phase 1 complete and the next draft at turn 10. White then offered a draw, Black accepted, and White displayed “Match complete” and “Draw by Agreement”. The test match finished cleanly.

Both production builds and all 21 automated checks passed. Commands: the existing reducer/handoff suites plus `scripts/chaos-transport.test.cjs` and `scripts/chessboard-renderers.test.cjs`.

Still pending: real-device Discord mobile checks, all power combinations, launch-scale load testing, and permanent hosting. Do not treat these bounded checks as a complete launch certification.

## Launch gate

Promote broadly only after multiplayer recovery checks pass, permanent hosting is verified independently of this computer, and the advertised Discord platforms have been tested. Artwork is complete for the 22 opening anomalies; further artwork is lower priority than these gates.


### 2026-09-07 — Special moves, ability feedback and measured latency

- Added six authoritative reducer checks for Dragon Bishop, Dragon Rook and Rook Cannon, each for White and Black. They verify the expected special destination, turn transfer and rejection of an unrelated injected piece. All 38 automated checks and root TypeScript validation pass. This is targeted coverage, not all power combinations.
- Once-per-match activation controls now remain visible with a disabled reason: used this match, available on your turn, or saving your move. Browser practice check selected Bargain, activated it on e7, and verified the disabled “Bargain: Used this match” control. No page errors. Contextual frozen/chained/immune piece feedback remains outstanding.
- Added request-local Server-Timing measurements for room reads, rules, writes, notification callbacks and total API handling, with gateway API duration forwarded in response diagnostics. Measurements contain no credentials or game contents. The hosted test records these alongside client timings.
- Full hosted Discord-proxy recovery match `LY7PU7` passed all seven reconnect checkpoints, HTTP fallback/idempotent retry, sequential drafts, rematch and agreed draw; 42 notifications, 76 requests. Client p50 506 ms, p95 1305 ms, max 1333 ms. These include client queue waits and are not opponent-render latency.
- API stage medians: read 213.5 ms (76 samples), rules 1.6 ms (27), write 225.7 ms (21), total 399.4 ms (76). Max read 834.7 ms, write 841.5 ms. Database round trips dominate measured server work; investigate API/database region placement and reducing round trips next. This pass does not claim a latency improvement.
- Both production builds passed. API deployment `dpl_2WjjaDxMJ3mVzykDiXZjAZxADPYn`; Activity `dpl_aJMuKMzBeuRHxhaffbS5wJrhkXKz`; Worker version `b03ea3b6-0c88-41d1-8476-5f5a07b92a58`.
- Still open: physical iOS/Android Discord testing, broader ability combinations and balance, frozen/immune move explanations, full keyboard/contrast checks, and latency reduction before larger load tests.


### 2026-09-07 — Extra-choice picker layout

- Fixed the modifier picker’s fixed three-column grid: four/five choices now use matching desktop columns. Compact viewports show card art/name/rarity with the selected description below and confirmation retained.
- Production Activity build passed; deployed `dpl_932GXT49zANtfup97RhNy6xobP5r`.
- Browser layout fixture renders the actual ActivityDraft component with four real modifiers and production CSS (placeholder artwork): 1280×900 uses four columns without card scrolling; 375×667 uses two columns without card scrolling/horizontal overflow. Inserting full selected-card text leaves footer bottom at 611px in the 667px viewport. This is a layout check, not a native mobile or full Inner Vision match test.


### 2026-09-07 — Consistent match screens

- Added an Activity-specific result view for victory, defeat and draw, using custom SVG kings, enamel panels, warm typography, match stats, power badges and rematch/lobby actions. Replaces the legacy meme/rating/website-promotion panel in the Activity. Existing game and rematch handlers remain in use.
- Matched promotion dialogs (including custom piece art), resurrection, opponent anomaly activation, draw offers, waiting/matched screens and Discord connection/error screens to the same palette and raised controls. Activity floating reactions and result-header artwork use game assets.
- Production build and five draft/reload/rematch regression checks passed. Deployment `dpl_6nCauPw1zkmRCjn9RqzjE9Dop743`.
- Live browser: practice resignation shows the new defeat screen; Play again opens the anomaly picker; repeated resignation then Back to lobby returns to the lobby. Tab focus wraps between result actions. At 375×667 both actions remain visible (bottom 516px); desktop screenshot inspected. No page errors. Native mobile, full multiplayer rematch UI, victory/draw visual states and rare ability dialog flows were not exercised in this pass.


### 2026-09-07 — Archbishop check escape and piece identity

- Reproduced the screenshot position (`rn2kb2/pp3pp1/8/7p/N1pp4/2Pq3P/PPK2nP1/RNB3NR w - - 0 22`). Standard chess reports checkmate; the c1 archbishop can legally capture the d3 queen with its knight move.
- Found the AI ordinary-move handoff skipped recomputing special moves whenever chess.js reported checkmate. The later chaos-aware end check kept the game running, but its special-move list remained empty. Now refreshes those moves before the delayed end check.
- Added `scripts/chaos-archbishop.test.cjs`: capture/king safety plus the actual extracted AI handoff branch. The handoff check failed before the change and passes after it. All 24 targeted move/reducer/draft tests and TypeScript check pass. The exact screenshot position was reproduced in code, not in the user's live session.
- New original white/black Archbishop SVGs use a horse profile, bishop ornament and split ribbon base inspired by the reference, with existing toy-set colors. Shared generator updates board art and card previews; rendered both colors for inspection.
- Production builds passed: Activity `dpl_B24mDyy25LAogY87949NRPgLDsRr`, website `dpl_BzE2a38Do1SQcScjgYzag7A9RyU8`. Both served Archbishop SVGs return HTTP 200 and match the new generated assets.


### 2026-09-07 — Pawn and hybrid sculpts; deployment alert

- New original silhouettes for Pawn Bayonet (helmet/spear), Knook (horse/tower), Torpedo Pawn (thruster fins), War Pawn (thruster/spear), Amazon (crowned horse) and Night Rider (crescent mane). Both colors rendered and visually inspected as a lineup.
- Fixed individual pawn powers missing from the renderer's fairy-piece selection list; Torpedo and Bayonet now use their dedicated SVGs, while the combined power keeps War Pawn. Four renderer regression tests cover both sides and the combined power.
- Investigated the 01:50 UTC failed deployment `firechess2-effx13wtv`: `ERR_PNPM_OUTDATED_LOCKFILE`, with ws missing and Next version mismatch in pnpm-lock.yaml. Later production deployments are Ready and already use npm ci via local vercel.json. Also persisted npm ci as the Vercel project's install command and read it back; no broad dependency upgrades or unrelated git changes.
- Both production builds passed: Activity `dpl_3575ZacS4utzmedSh6afQCxhkzTT`, website `dpl_HinhXC3gAJKh82bHCWYHo6UWUon4`. All 12 published SVGs returned success and matched local generated files.
