# Discord playtest follow-up

- [x] Inspect saved match records; add board/power/status context to moves, keep the previous 10 games through rematches, and log rejected actions to runtime logs. Member-only history is available at `/api/chaos/sync?roomId=…&history=1`.
- [x] Show opponent powers without requiring a hidden tab.
- [x] Replace 30-second move timer with server-owned 2+1, 5+3 and 10+5 clocks. Server applies elapsed time and increments, ignores submitted timer values, and settles flags on commands/reads. Matchmaking matches the chosen preset.
- [x] Clear active-player banner and distinct selection/destination colours. Your turn is lime, opponent turn orange; friendly selection/destinations blue, enemy previews orange, powered destinations purple.
- [x] Both sides move before their power pick; pause both server clocks during picks.
- [x] Synchronize and enforce freezing/protection on both clients and server.
- [x] Enemy-piece click inspection, including assigned powers and frozen/protected/chained status, in a compact mobile panel.
- [x] Implement server-validated rated results, a separate Activity leaderboard, Discord OAuth identity and persistent account-wide match history. Real embedded sign-in smoke test is pending user confirmation below.
- [x] Confirm pause behaviour: visible 20-second power picker with automatic selection. Browser countdown uses elapsed time and catches up after backgrounding.
- [x] Server-owned offers and 20-second deadlines for power picks and opening anomalies. Reloads preserve the deadline; Cloudflare Durable Object alarms settle idle picks even with no connected players.
- [x] Three opening ability choices, including reveal/layout fixes for three cards.
- [x] Shorten draft power descriptions while keeping warnings and usage limits. Opening-anomaly descriptions can receive a separate copy pass.
- [x] Queen-moving king: refresh powered escapes on incoming apparent mate; server determines the result instead of trusting the client's standard-chess finished flag.
- [x] Amazon: generated toy PBR illustration, clearer crowned horse/queen-body SVG, renderer test for both colors.
- [x] First batch: 49 regression tests, TypeScript check, mobile browser smoke check and hosted two-client recovery test. Remaining items above still need implementation and their own verification.

## Evidence — September 7, 2026

Saved room KWD7KT ended at `1Q4k1/5ppp/4p3/8/8/1B6/P1P2P1P/5K2 b - - 0 26`. Ordinary chess reports mate, but King Ascension permits g8–b8 to capture the checking queen. This position now has a regression test.

Hosted test room 3P84ES passed through Discord's real proxy and Cloudflare WebSockets: both clients reconnected during opening choices, normal play and both drafts; duplicate actions, HTTP fallback, rematch color swap and agreed draw all passed. 77 live requests, 43 notifications; observed p50 524 ms, p95 1914 ms. Database round trips remain the main latency cost; this is not a latency optimization or a high-load test.

Old match logs cannot be reconstructed beyond the snapshots and move history already saved. Rejected-action logs use the hosting provider's retention; the recent-game archive is bounded to 10 rematches per room. Persistent account-wide history and rated results are still outstanding.

## Match clocks follow-up

New timed rooms default to 5+3. Clock anchors live in persisted room metadata and start after both opening choices. A browser projects the last server clock using elapsed time; it cannot award a timeout or add an increment. Reads and commands commit expired clocks with the existing revision compare-and-swap. The initial clock release settled disconnected games on the next read/command. The server draft follow-up below adds background alarms.

The initial release retained bundled move-and-pick drafts. The server draft follow-up below replaces this for new rooms; verified rated play remains unfinished.

Verified: 59 regression tests, TypeScript and both production builds passed. Discord-proxy clock tests passed for 2+1 (W4FXEG), 5+3 (HGPWQV), and 10+5 (NTBR46), including forged clock values, duplicate retries and reconnects. Cloudflare recovery room JJ9AWQ passed both draft handoffs and rematch (77 requests, 43 notifications; p50 540 ms, p95 1376 ms). Mobile browser room P674BT confirmed 2+1 creation, opening choices, the running White clock, and switching to Black's clock after e2–e4. Test rooms were ended.

Deployed backend `dpl_2zaNaj6SDFQ4b5ZcLoW6Eky1Funu` and Activity `dpl_9Drc4V9WUZk8kGS8iaR2gZmHLBEw`. Cloudflare gateway did not require redeployment.

## Server draft follow-up

New Activity rooms opt into draft protocol 2. Moves commit before their power pick; the server owns the offered cards, validates choices, and preserves the 20-second deadline through rerolls and reconnects. Opening anomalies also have persisted offers and a 20-second deadline. Durable Object alarms settle picks and clocks without a connected browser. Older rooms retain the legacy protocol.

Fixed initial room recovery losing its session storage during React Strict Mode startup. Authoritative snapshots restore both power sets, move history, draft state and last-move highlights. Local two-browser play and 71 regression tests passed. Hosted deployment verification is pending below. Ratings with verified Discord identity and permanent account-wide history remain outstanding.

Production verification: backend `dpl_7PXCwkmxo7eZb43dJTkc9uLTHMLZ`, Activity `dpl_DUbFKXtUzdHhDc76N48eLB9rSz6T`, Worker `ddffa3a6-4e63-42ec-9979-70cc62822e45` deployed successfully. Discord-proxy room 9C2N6K verified the automatic draft pick directly in database storage before any client read, then Black's move-before-pick, idempotent retry and White's resumed clock. Legacy room GPWLDS passed reconnects, both drafts, HTTP fallback, freeze enforcement and rematch; 77 requests, 43 notifications, p50 536 ms and p95 1076 ms. TypeScript and all 71 regression tests passed. Test rooms ended; this is functional verification, not a load test.
Opening room BQXHQ3 also verified both anomaly auto-picks and White clock startup directly in storage with no client reads or sockets. The room was ended.

## Verified identity, ratings and history

Implemented Discord identify-only OAuth, backend profile lookup and signed 12-hour in-memory Activity credentials. No client-supplied user ID is trusted. Production OAuth client credentials and redirect are configured; Discord accepted the client credentials in a controlled invalid-code probe. Real browser consent completed, but Chrome blocked the local code-verification form; the actual in-Discord launch/name display is awaiting user confirmation.

Public timed matchmaking is rated when both players have verified profiles and each color has made a move. Friend rooms, practice, untimed games and shorter games are casual. Ratings start at 1200, use symmetric Elo K=32, and are separate from the legacy website ladder. The database result trigger atomically saves the game and updates both ratings, locking player rows in a consistent order. Room/round IDs prevent double scoring. Rematches preserve separate records and swapped colors. Detailed history is participant-only and survives room deletion. New records are retained; older games cannot be reconstructed.

Verification: 79 regression tests; root and Activity TypeScript checks; both production builds; transactional database tests; Discord-proxy integration room 33AXMQ covering queue eligibility through join, both rating changes, duplicate result retries, private history, forged identity rejection and separate rematch records. Test profiles and rooms removed. Mobile 390px career dialog and history have no horizontal overflow. Privacy and terms now describe profile/rating/history processing.

Deployment: Activity dpl_E5PBK8ParLjKBkRhMBKX87kvq5qH. Backend dpl_CJ4ncX2eU9vKhRPJfDCRcRWzC5NW deployed successfully, including the updated privacy and terms. Worker needs no update. Operational migration: migrations/chaos-career.sql via scripts/chaos-career-migrate.mjs. Do not reset the independent Activity ladder from the legacy client-reported rating route.

## Final-position pause and sound rework

The Activity leaves the final board unobscured for 2.5 seconds, with a small result notice, before opening/focusing the result modal. Game-over state remains immediate, so no extra moves or clock time are allowed during the presentation pause. Unmounting cancels the reveal timer.

The Activity now uses clean, original short cartoon cues for crowd, scratch, horn and long voice effects. Brief bruh, oof and vine-boom samples remain from the original pack. Reaction playback is limited to 1.6 seconds and spaced 1.8 seconds apart; ordinary move/check cues remain immediate. Separate meme volume is exposed beside the master volume, and muting stops currently playing audio. The old forced meme mute is migrated once to a gentle 55% reaction level while preserving the master setting.

Verified: 82 regression tests and root/Activity TypeScript checks passed, including result delay/cancellation, reaction spacing and mute behavior. Production Activity dpl_2AgiNCf1GtfxTnaYa4WJRRNjstwq deployed successfully. All six new WAV cues verified through Discord’s proxy.

## Devil replacement

Devil is now Pitchfork Pawns: passive forward pawn captures from the opening, in addition to normal diagonal captures. It injects the existing Bayonet modifier and excludes that duplicate from drafts, so its movement, king-safety checks, AI support, and custom pawn piece visuals use the established implementation. Removed the freeze activation UI and server command. Previously saved freeze effects can finish their duration, but new activations are rejected. Start a new match to receive the replacement opening bonus.

Generated a matching toy PBR pawn/pitchfork squad illustration in assets/anomalies/devil.webp; asset preparation installs it in the Activity. Updated the anomaly definition and CSV. Both-color forward captures, attack squares, injection, duplicate draft exclusion and rejected freeze commands are tested. All 83 regression tests and both TypeScript checks pass. Backend dpl_Ag6FAedBcg323fmSWobPF3s9eoek and Activity dpl_B1h8t9TA9BXkQZygXDbTgULJ4Bb7 deployed. Discord-proxy room RNDKFG verified both colors receiving the modifier and making forward captures, with old freeze actions rejected. Test room ended. New artwork checksum matches the deployed Discord-proxy asset.

## Knight upgrade collisions

Checked Camel, Knook and Night Rider in all six draft orders, for both colors with one and two knights. Single-piece upgrades use separate knights when available, then stack on the first knight; their move sets remain additive. Tracking moves every stacked power together and clears them on capture. Knight Horde adds ordinary knights without copying single-piece powers.

Fixed Camel falling back to another knight when its tracked square is stale; movement now agrees with the attack map and the other single-piece upgrades. Removed lingering modifier overlays for captured upgraded pieces. Piece detail names list multiple assigned knight upgrades together, while the board keeps the newest upgrade's existing artwork. Dedicated combination artwork is not part of this change.

Verification: 16 new regression tests, 99 total passing; root and Activity TypeScript checks pass. This is a targeted knight interaction audit, not a claim that every modifier combination is exhaustively tested.

Deployment: backend dpl_4T1hEh6RZ76WkZKpRmmvet9E53z3 and Activity dpl_Hd6AgSisbvQNbVaXwuvb1fNKuEGh built successfully. Activity and Discord proxy return HTTP 200. Worker unchanged.

## Bishop, rook and cross-piece interactions (September 8)

Fixed Archbishop tracking after stationary Sniper captures and Usurper king swaps, including AI and player special-move paths. Tracking can reconcile with the resulting board to clear powers destroyed by collateral or mutual kills. The multiplayer reducer derives existing assignments from the validated board, overriding stale client assignments. Ordinary AI/player capture paths also reconcile destroyed upgrades.

Railgun plus Collateral now applies collateral behind every direct hit. Ranged captures of Kamikaze bishops destroy the attacker, including a bishop hit by a secondary Railgun ray, matching the card text. Collateral still excludes kings. Bishop/rook extra movement options coexist in either draft order; upgrades do not automatically extend each other's range (for example, Archbishop knight jumps do not become sniper shots).

Battlefield Promotion now uses rank 5 for White / rank 4 for Black as advertised, and multiplayer accepts all four promotion choices. Tests cover pawn movement powers coexisting, both-color bishop/rook combinations, king swaps, stationary captures, collateral cleanup and authoritative state tracking. Existing Amazon/Nuclear Queen cooldown tests also pass.

Verification: 117 regression tests and root/Activity TypeScript checks pass, including king safety after ranged Kamikaze retaliation. This is targeted coverage, not exhaustive testing of every anomaly, revival and modifier combination.

Deployed backend dpl_BzSXVSaJaqAPPavR6P74WkM84Xkt and Activity dpl_DouvLZuH2hsECnLFqjNZvzC3aKKy successfully. Worker unchanged. Hosted Discord-proxy/Cloudflare recovery test passed in room BMR8K8: 77 requests, 43 notifications, reconnection during openings/play/drafts, HTTP fallback, duplicate retries, rematch and draw. Test room finished.

## Piece identity and card redesign (September 8)

Redesigned eight SVG identities in both colors: Camel (long muzzle and humps), Railgun (cyan electric rails), Usurper (swap arrows), Emperor (reach ring), Kamikaze Bishop (bomb/fuse), Sniper Bishop (scoped barrel), Bishop Cannon (purple cannon) and Ricochet Bishop (bounce arrow). The three new bishop identities are wired to actual board rendering. Their obsolete emoji/crosshair overlays are suppressed for the toy set. Existing hybrid identity precedence is preserved.

Added a compact count for multiple powers on a piece, excluding spawned armies and powers assigned to other or captured pieces. Full names remain available in piece details. Generated three replacement toy PBR card illustrations using built-in image_gen: Pawn Fortress now shows revival on a home tile, Forced En Passant a mandatory diagonal capture, and Camel an unmistakable camel instead of a horse. Source PNGs and compact WebP assets are in the workspace; prompts are in scripts/identity-redesign-prompts.json.

Verified actual piece renderer at 72px and 40px, both colors, including hybrid stacks. All card images loaded in a 390px browser viewport with no horizontal overflow. Fifteen relevant asset/renderer regression tests and both TypeScript checks passed. Gameplay rules unchanged by this visual pass.

Deployed Activity dpl_BZZ7NwMBbaiSdas9AFTixLxyqybN and backend dpl_2VczFQj8f7TZ52KKR9ovVWDhRVAm. All 19 redesigned image files (16 SVGs and 3 WebPs) matched local SHA-256 hashes when fetched through the actual Discord proxy. Preview screenshots: .vercel/pieces-redesigned.png and .vercel/cards-mobile-redesigned.png. Review servers and browser closed.

## Custom domain setup — DNS and multiplayer verified

Added chaos.firechess.com to Vercel project chaos-chess-activity. Sav manages this domain's Cloudflare-backed DNS. Added A record chaos -> 76.76.21.21, DNS Only, through the user's signed-in Sav dashboard. Existing records and nameservers were preserved. Public DNS resolves correctly; Vercel reports verified=true and misconfigured=false. Issued the HTTPS certificate successfully and verified the browser lobby at https://chaos.firechess.com.

Deployed Worker version 3f978fe5-7247-4573-a7f9-484393d4410b with https://chaos.firechess.com added to ALLOWED_ORIGINS; existing origins preserved. Discord URL mappings remain on the existing working hosts.

Deployed app/chaos/about landing page and middleware routing for bare /chaos in root deployment dpl_HaXCAKr1Qwpk9PVNX5m7Xio4E9tf. Production /chaos reaches /chaos/about and returns the landing page; query-bearing game links remain unchanged, including /chaos?play=1. Existing Activity still imports the same shared app/chaos/page.tsx game source. Landing page uses local brand artwork, browser CTA to the custom domain, and Discord activity link. TypeScript and production build passed. Visually reviewed desktop page, and verified production landing text, both CTA destinations and cover asset. Stopped the temporary local preview server.

Hosted Cloudflare WebSocket recovery test passed through the new origin: room S42GHS finished, 77 requests and 43 live notifications. Covered reconnects during opening/play/drafting, sequential picks, HTTP fallback, duplicate retries, rematch and agreed draw. Observed request latency p50 506ms / p95 1372ms; this confirms function, not zero-latency play. Custom-domain lobby, piece SVG, card WebP and move audio return HTTPS 200. Domain setup is complete.


## In-game match chat (September 8)

Replaced the hidden legacy chat panel with a collapsible navy/lime match chat in the Activity and shared game. Includes unread count, opponent mute, accessible input and a scroll-contained message log. Mobile starts collapsed; reviewed the actual app in a 390px iframe and desktop Chrome. Messages render as plain text, max 300 characters, with a server-enforced one-second sender cooldown and room-membership checks.

The last 50 messages are persisted separately from the short move/event replay window in room sync metadata and restored from snapshots. Server-derived host/guest identity prevents sender spoofing. UI waits for acknowledgement; failed messages retain the input. Rejected chat commands do not drop queued board moves. Chat preserves board revision, clocks and draft pauses. Privacy page now documents room chat storage.

Verification: both TypeScript checks, both production builds and 46 reducer/transport tests passed. Real Cloudflare WebSocket message and duplicate retry passed in private test room UNEV5N; browser UI received it, replied, muted, and recovered both messages on reload. Opponent HTTP snapshot confirmed the UI reply. Test room finished by resignation. Backend deployment dpl_9REBskVdjddt1gu6zHyyxh2JTMhg; Activity dpl_9kwTJCe571Fu3pWcJXR8mYjtZ6SF. Worker unchanged. Physical mobile keyboard/Discord client interaction was not tested in this pass.


## Anomaly piece identity fix (September 8)

Reproduced Fool's King rendering the ordinary wK/bK image in the actual board renderer. Root cause: no Fool's King SVG or anomaly mapping existed. Added original FK royal-knight SVGs with king cross and crown, IP reversible pawns for Inversion, and MQ crescent queens for Nocturnal Hunt once unlocked. Both colors share the existing toy set's bevels, palette and pedestal. Root fairy assets and Activity assets are generated/copied together.

Existing hybrid/equipment sculpts are retained for Inversion and Moon stacks, with their anomaly badge still shown. Emperor, Sacred Passage and Guiding Light already had mappings. Draft-only and one-shot anomalies do not permanently replace every piece. No movement rules changed.

Verified 28 renderer regression tests, including the original red/green Fool's King case, both player colors, unaffected opponents, six anomaly mappings, Moon unlock timing and Amazon preservation. Visually reviewed actual renderer at 72px and 40px. Both TypeScript checks and production builds passed. Deployed backend dpl_AkcLYnLtakM6hgfyV8nGT5tCf7EN and Activity dpl_5qq63Y8vzqyEBtsRdyQXdmC8HD1j. All six new SVGs matched local SHA-256 hashes when fetched through the actual Discord proxy. Review server and browser closed.


## Opening AFK auto-abort (September 8)

New server-protocol rooms give each side 30 seconds to make their first move, starting after opening anomaly choices complete. White's accepted first move starts Black's full window; after both have moved there is no per-move AFK limit. Applies to timed and untimed PvP, not AI practice. Existing rooms without the rule are left unchanged. Rematches reset the window.

Deadlines are persisted in room metadata, exposed through snapshots and scheduled through the existing Cloudflare Durable Object alarms. Reads and commands also settle overdue rooms. Chat, reconnects and rejected moves cannot extend the window. An overdue room becomes aborted with winner=aborted, which the existing completed-game/rating trigger excludes; the UI presents no contest and no rating change. A server-aligned countdown appears above the board, with an amber warning for the last ten seconds.

Verification: 67 sync, transport, draft, clock and opening-abort tests passed, plus both TypeScript checks and both production builds. Hosted tests left White-idle and Black-idle rooms without clients for 35 seconds; direct database reads confirmed Cloudflare alarms had already aborted both rooms, with all four test profiles unchanged at 1200 rating and zero games/wins/losses/draws, and no completed-game records. Live Chrome UI verified the countdown and automatic no-contest modal in room 8XD4TJ. All test rooms/profiles were cleaned up. Deployed backend dpl_GwVsmdeHqX1RFSz7HA6zAwUu4GRN and Activity dpl_2iwqjZJBq7A8469mBqz4xUKadbEU. Worker code unchanged.


## September 9 — public archive and spectating

- Added **Watch & replays** in the Activity navigation and `/watch` shareable views. Public matchmaking and friend matches are included, as requested.
- Live rooms refresh every 10 seconds; an open spectator board refreshes every 3 seconds. Spectating is read-only and shows both players, chosen powers, turn, draft countdown and match clocks. Hidden views stop polling.
- Completed games are listed with result, time control and date. Replays support stepping, autoplay, a timeline slider, board flip and share links. My games also links to its saved replay.
- New authoritative game recordings include board and visual state changes for moves, power picks and abilities. Each rematch has a separate durable archive. Existing recorded FENs are used for older games, with a visible limitation notice for missing historical transformations/openings.
- Extracted the shared toy/hybrid piece renderer so playing, spectating and replaying use the same pieces.
- Public API projects only gameplay fields: no chat, player auth IDs, join codes, credentials, private draft offers or reconnect metadata. Chat does not add replay frames. Updated the Activity privacy notice to describe public gameplay visibility.
- Added recent archive/live-room indexes and extended the existing atomic archive trigger to retain the replay timeline. Rating behavior is unchanged.
- Verification: replay/privacy/member-only reducer tests; existing sync/draft/opening-abort and 28 piece identity tests; atomic database archive/rematch/rating checks; live HTTP test with owned friend rooms for listing, board state, identity/chat redaction, spectator rejection and an immutable replay across rematch. Browser verified automatic move updates, final-position replay navigation, modal tabs and 390px layout/navigation.
- Scope: multiplayer only; no AI practice archive. Historical data cannot recover positions or transformations that were never stored. Spectator updates currently use polling, not spectator WebSocket subscriptions. Waiting/aborted games are excluded from the completed archive; inactive playing rooms older than two hours are not listed.

- Production Activity release: `dpl_2ny1xra5Zh9hGhvWJu2teXSt6DWi`. Custom-domain and Discord-proxy replay reads verified. Shared links use the canonical public domain; personal-history replays open in a dialog to preserve the embedded Discord session.


## September 9 — main lobby navigation and leaderboard clarity

- Put prominent Leaderboard, Watch live and Replays destination cards directly below the main lobby introduction, above decorative artwork. Each opens the relevant in-Activity view; Replays opens the archive immediately. Small header shortcuts remain available during gameplay.
- Replaced the Activity's old purple Find Opponent button with the raised lime primary action. Search/cancel/found states follow the same palette; the website fallback is preserved.
- Diagnosed the apparently broken leaderboard: 25 saved matches, zero eligible rated results. Signed-in matches were casual friend rooms; the two timed queue records lacked two signed-in profiles. No retroactive Elo changes were made.
- Added a public standings API independent of private career/auth loading. Community standings count actual completed game results (both sides must have moved), including friend games. The separate rated ladder keeps existing eligibility rules and explains its empty state. My games remains private and has independent error/retry handling.
- Verified 17 real players appear in Community, rated ladder explanation, direct archive navigation, desktop and 390px layout. New HTTP regression test checks public access, both seat colors, wins/draws/losses, empty/one-sided game exclusion, private ID redaction and separation of casual results from Elo. Owned fixtures cleaned up.

- Released root/API `dpl_8zaLSsBMsSXngU21WZWUhSDybxWz` and Activity `dpl_9Ms4HHp33bbx2EvjrWAPJVLu54ug`. Both production builds and type checks passed. Anonymous standings verified on the custom domain and Discord proxy (17 Community players; no eligible rated finishes yet).

## Match sharing (September 9)
- Added public, database-backed match summary and 1200x630 PNG sharing cards. Only public names/results/statistics are projected.
- Added Activity /share replay landing with Open Graph/Twitter preview and Play CTA. Replay copy buttons use rich-preview links.
- Completed multiplayer results offer a card preview, native share/copy fallback, PNG download and selectable link. Practice/aborted games do not claim an archived replay.
- Verified both TypeScript projects, real archive summary, 404 missing game, PNG rendering, metadata and browser replay playback controls.


## Open challenge lobby (September 9)
- Replaced anonymous room-code list with player/rating, provisional marker, clock, rated eligibility, own-challenge status and join rows; all/my-clock filter; responsive styling and accessible labels.
- Retained quick pairing: Find opponent posts an open challenge when no matching player exists. Existing 60-second search lifetime remains.
- Public list omits identity IDs, private friend rooms, incompatible draft protocols, claimed and expired rooms.
- Fixed late queue cancellation cancelling a started match; direct joins reject expired challenges.
- HTTP integration test verifies concurrent join has one winner, list projection/own status, expiry and cancellation race; owned fixtures removed.

- Layout review: Lobby is the default subtab beside Quick pairing; removed nested scroll container so challenge rows remain part of the page flow. Browser verified posting shows own challenge and cancellation controls; Activity TypeScript passed.

## Website Discord entry point (September 9)
- Added a responsive Play on Discord banner to website pages, including share/replay pages. Launches the official Activity URL in a new tab.
- Hidden when frame_id is present or running on Discord's Activity proxy, including connection errors/casual fallback.
- Activity TypeScript check passed.

- Browser verified banner/link on website and absence with frame_id; no Discord login or user messages triggered.
- Follow-up: removed the full-width Discord banner per feedback. The website now has a quiet outlined Play on Discord link beside Sound in the main header; removed the redundant Preview label. Embedded sessions still hide the link.
- Discord entry point refined to a 40px Discord-blue icon at the far right of the main header, with an accessible label and Play on Discord tooltip. TypeScript passed.
- Clarified destinations: labeled Play on Discord header button launches Activity; separate Join our Discord community link on lobby points to https://discord.gg/YS8fc4FtEk.
- Lobby width: removed the 1260px cap, made desktop columns fill browser width with 24–64px responsive edge padding, and aligned the header gutters. Existing narrow-screen layout retained.

## Later rule changes (September 20)
- Battlefield Promotion nerfed one rank: pawns now promote on rank 6 for White / rank 3 for Black. The earlier rank-5/rank-4 note above is superseded; the card text, the engine constant (`EARLY_PROMO_RANK` in `lib/chaos-moves.ts`) and both sync tests move together.
- Forced En Passant retired and replaced by Toll Gate (rare, phases 2-3): the opponent's pawns can never advance two squares, which also stops a Torpedo Pawn's charge. Enforced in `blockedMove` (server + client + king-capture) and filtered in `getChaosMoves`; the retired card's illustration was renamed to `toll-gate` and reused.
