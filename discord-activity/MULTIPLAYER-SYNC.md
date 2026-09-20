# Multiplayer sync

The shared game uses `/api/chaos/sync` for authenticated commands and event recovery. The old unversioned move writer returns HTTP 410; the PartyKit relay is retired.

## Integrity and delivery

- The API derives the player and colour from room membership. Guest identifiers are bearer credentials and are no longer returned by the state endpoint.
- Each command carries a random action ID. Retrying after a lost response returns the existing receipt instead of applying the action twice.
- Board commands carry the state revision they were created against. Stale commands get HTTP 409 and the saved snapshot.
- Database updates compare the room revision in a single conditional update. Concurrent opening picks merge through retries; competing board writes cannot both win.
- Opening choices, draft freezes, draw offers, resignations and both rematch requests are persisted alongside the room.
- The client sends commands over `/api/chaos/live`. The gateway authenticates through the existing API, then sends a commit notification to room subscribers after a successful database update. Subscribers immediately fetch ordered events over the socket. There is no 750 ms polling delay while live.
- A 10-second reconciliation read catches missed notifications. If the socket fails, HTTP polling resumes every 750 ms; pending actions retain their original ID and base revision. Socket reconnection backs off from 500 ms to 10 seconds with jitter. Connectivity and visibility changes also trigger recovery.
- WebSocket membership is checked before subscription and on every read/command. Browser origins are checked, messages are size-limited, and ping/pong heartbeats remove dead connections. The Activity forwards upgrades through its existing origin, including Discord's `/.proxy` path.
- The most recent 64 events and 256 receipts are retained. A client that falls behind the event window receives the saved snapshot.
- Refreshing the same tab recovers its active room from sessionStorage. An uncommitted local move is replaced by the saved board.

## Rule validation

The API validates ownership, turn order, legal and power-enabled move targets, resulting board changes, opening powers, draft progression, and draw/rematch consent. It uses the existing chess and chaos move engines. Random draft spawns are constrained to their permitted piece counts and board regions.

This remains a proposed-state protocol, not a fully server-executed game engine. Exhaustive adversarial validation of every ability counter and power combination is not established by these tests. Do not describe it as cheat-proof or as having passed a launch-scale load test.

## Verification

- `node --test scripts/chaos-sync.test.cjs`
- `node --test scripts/chaos-transport.test.cjs scripts/chaos-live.test.mjs`
- `node scripts/chaos-sync-http-test.mjs --live` exercises the same complete match through WebSockets. Set `CHAOS_TEST_ORIGIN=http://localhost:3001` to include the Activity proxy.
- `node scripts/chaos-sync-http-test.mjs` against the local backend on port 3002 (creates isolated guest test rooms and finishes them).
- Root and Activity production builds.
- Two independent browser sessions: opening choices, alternating moves, draft handoff, refresh recovery and rematch.

Deployment must include both the backend and Activity client. Existing clients using the retired writer must reload. These changes are currently local unless explicitly deployed.

The API must run with `npm run start:live` on a persistent Node host. Commit fan-out currently uses a process-local event; deploy one API instance. Before horizontal scaling, replace that fan-out with shared pub/sub. The database still orders writes across instances, and reconciliation recovers missed notifications, but immediate delivery across separate processes is not guaranteed.
