# Chaos Chess Discord Activity

The Activity imports the shared game from the parent FireChess project. See [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) for remaining work and [MULTIPLAYER-SYNC.md](MULTIPLAYER-SYNC.md) for the current protocol.

## What runs where

The database persists rooms and game state. A Next.js API validates and saves actions. A persistent WebSocket carries commands, responses and commit notifications; each notification immediately requests ordered events. HTTP polling remains as a fallback when the socket is unavailable, with a 10-second reconciliation check while live. Both the Activity frontend and API must be hosted and reachable. A remote database alone does not host the game.

This development setup runs the backend on port 3002 and the Activity on port 3001, exposed through a temporary Discord tunnel. Discovery has been enabled separately in the Developer Portal. Permanent application hosting is still a launch requirement.

## Local setup

1. Install dependencies from the parent checkout; keep the parent source available.
2. Set `NEXT_PUBLIC_DISCORD_CLIENT_ID` in the Activity environment and `FIRECHESS_ORIGIN=http://127.0.0.1:3002` for this local setup.
3. Run the parent API with its database environment configured. Build the parent and run `npm run start:live` with `PORT=3002`; local guest checks also need `AUTH_TRUST_HOST=true`. In PowerShell set these with `$env:PORT='3002'` and `$env:AUTH_TRUST_HOST='true'`. `npm run dev:live` supports development. Plain `next start` only supports HTTP fallback.
4. In this folder run `npm run build` and `npm start`, or `npm run dev` for development.
5. Open `/chaos`. For Discord testing, map the Activity origin and required external asset origins in the Developer Portal.

The SDK waits for Discord READY before mounting. `/.proxy` routes serve the Activity bundles and API requests through Discord. Public environment variables and `FIRECHESS_ORIGIN` must be correct when building a deployment.

## Multiplayer checks

From the parent folder:

```sh
node --test scripts/chaos-sync.test.cjs scripts/chaos-draft-handoff.test.cjs scripts/chaos-transport.test.cjs
node scripts/chaos-sync-http-test.mjs
node --test scripts/chaos-live.test.mjs
node scripts/chaos-sync-http-test.mjs --live
```

The HTTP check uses port 3002 by default (`CHAOS_TEST_ORIGIN` overrides it), creates isolated guest test rooms and finishes them. The hook tests simulate failures and recovery without hitting a real network.

PartyKit is retired for game synchronization. The old unversioned move writer returns 410. Legacy PartyKit files and environment settings are not required to run the current game. `npm run test:transport` exercises the active transport including socket loss and HTTP fallback.

## Hosting and release

Deploy the API and Activity together, set a stable HTTPS `FIRECHESS_ORIGIN`, update Discord URL mappings, and verify a match with local servers stopped. The Activity checkout must include the parent source and dependencies. Do not copy only this child directory to a host.

Use a persistent Node web service for the API (`npm run start:live`) and Activity (`npm start` in this folder). The Activity forwards `/api/chaos/live` and `/.proxy/api/chaos/live` upgrades to the API, so no separate public WebSocket hostname or secret URL is needed. Configure the reverse proxy to support upgrades. The API currently uses one process for immediate commit fan-out: run one API instance until shared pub/sub is added. Multiple instances preserve database correctness, but another instance's commits may wait for reconciliation. This is not yet a horizontally scaled deployment.

Browser preview checks do not establish real-device iOS/Android support or verify Discord-specific identity and iframe behavior. Follow the launch checklist before promoting the game broadly.
