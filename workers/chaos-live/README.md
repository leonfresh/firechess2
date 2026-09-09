# Chaos Chess permanent live hosting

Cloudflare Worker: `https://chaos-chess-live.cixxyz.workers.dev`

One hibernating Durable Object routes each room's sockets. Vercel's existing
`/api/chaos/sync` authenticates commands and commits them to Neon using revision
checks and idempotency receipts. For gateway-authenticated commands, the Durable
Object wakes opponents after the successful API reply, avoiding a callback round
trip. HTTP fallback calls the Worker's protected `/notify` endpoint after commit.

The gateway has no interval or outbound persistent connection. Cloudflare can
hibernate it between requests. Game state remains in Neon; no Redis is required.

## Configuration

- Cloudflare secret `CHAOS_LIVE_SECRET`: same random secret as the API.
- API: `CHAOS_LIVE_SECRET` and `CHAOS_LIVE_ORIGIN` (Worker HTTPS origin).
- Activity: `FIRECHESS_ORIGIN=https://www.firechess.com`,
  `NEXT_PUBLIC_CHAOS_CLOUDFLARE_LIVE=true`, and the Discord client ID.
- Discord URL mapping `/live` → `chaos-chess-live.cixxyz.workers.dev`.
- Worker `ALLOWED_ORIGINS`: exact frontend origins and the app's discordsays.com
  origin. Update this when adding a frontend domain.

The API issues two-hour room-scoped tickets after checking membership. Tickets
travel in the WebSocket subprotocol, not the URL. The API rechecks membership on
every forwarded read/command. Expired tickets trigger reconnect and renewal;
HTTP fallback retains the original action ID while that happens.

## Deploy and verify

`npx wrangler deploy --config workers/chaos-live/wrangler.jsonc`

Root Vercel project: `firechess2`. Activity project: `chaos-chess-activity`, with
root directory `discord-activity` and source files outside the root enabled.
The Activity's install command installs both the root and child dependencies.
Use npm's checked-in lockfile; the older pnpm lockfile is not authoritative.

Run `node --test scripts/chaos-cloudflare.test.cjs` plus the existing transport
and reducer suites. For a hosted full match, set `CHAOS_TEST_ORIGIN` to the API,
`CHAOS_TEST_CLOUDFLARE=true`, then run
`node scripts/chaos-sync-http-test.mjs --live`. It uses isolated guest identities
and finishes its test room.

## Operations and rollback

- `/health` checks Worker availability, not database health. The full match test
  checks the complete path. Watch Workers errors/requests and Vercel sync-route
  failures; notification failures emit a warning without undoing committed moves.
- Roll back the API or Activity using Vercel's previous deployment. Preserve the
  secret while older clients are connected. `wrangler rollback` restores the
  previous Worker version. Do not remove the Durable Object migration.
- Emergency transport rollback: set `NEXT_PUBLIC_CHAOS_CLOUDFLARE_LIVE=false`
  and rebuild the frontend. Hosted Vercel will use HTTP recovery; local custom
  servers can still use their Node WebSocket gateway.
- Cloudflare is on Free: quota exhaustion can interrupt service. Check actual
  usage before upgrading. Existing Vercel Pro and Neon usage remain billable
  according to their plans. The previously created free Upstash database is
  unused by this implementation.

Pricing: https://developers.cloudflare.com/durable-objects/platform/pricing/

## Server deadlines

Protocol 2 rooms persist opening offers, draft offers and 20-second deadlines in the API room. The gateway schedules a Durable Object alarm for the next opening, draft or clock deadline. Alarms call the authenticated internal sync endpoint, commit the expired choice/clock, schedule the next deadline and notify connected players. No connected socket is required. Deploy the backend before this Worker when updating the alarm protocol.

Verify an automatic pick with no client reads using `CHAOS_TEST_ORIGIN=https://www.firechess.com`, `CHAOS_TEST_VERIFY_ALARM=true`, then `node scripts/chaos-server-draft-http-test.mjs`. The optional storage assertion reads the existing ignored `.vercel/playtest-production.env`; never commit that file. The test finishes its isolated room.
