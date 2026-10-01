# FireChess auth/entitlement test harness

`scripts/firechess-auth-unlock.test.ts` is an isolated harness for the auth,
entitlement and unlock cards. It loads the **real** route/helper modules and
replaces only their boundaries (auth, admin, db, llm, report-unlock,
sample-reports) through a small CommonJS shim, so the shipped logic runs. The
test does not re-implement the logic and does not grep source.

## Run

```sh
node --experimental-strip-types --test scripts/firechess-auth-unlock.test.ts
```

## Covers

- `app/api/report/analyze` POST: missing id (400); unknown, not-ready and
  expired scans (404); foreign signed-in user (403, no LLM call); owner (prompt
  built from the **stored** scan; client-supplied counts ignored); matching guest
  owner token; admin; cached `aiAnalysis` served without a paid call; and the
  per-caller limiter (6 allowed, 7th 429).
- `lib/scan-access.ts`: `redactScanResultForFree` caps every finding list at 6,
  keeps aggregates and does **not** mutate the stored result; `resolveFullAccess`
  for sample / guest-token / owner / foreign-free / one-off unlock / Pro / admin.
- `app/auth/signin/signin-redirect.ts`: `/report/<id>` allowed, open-redirect
  shapes rejected.
- `lib/unlock-poll.ts` (the loop both unlock effects run): delayed webhook
  unlock fires `onUnlocked` once and mirrors the flag on every response; a failed
  check is not confirmed and can recover; the attempt budget is respected; a
  false response clears the flag; cancellation stops the loop.
- `lib/unlock-follow-up.ts` (the real `onUnlocked` callbacks): the classic page
  applies the entitled full payload from `/api/scans/<id>`, keeps the Free view
  on a failed / non-ok / empty fetch and recovers on the next attempt, and does
  not apply after cancellation; the modern report refreshes the server data once.
  Two end-to-end tests drive these callbacks through the real `pollUnlock` loop.

## Isolated boundaries

No real database reads or writes, no credentials and no paid model calls:
`@/lib/db`, `@/lib/auth`, `@/lib/admin`, `@/lib/llm-chat`, `./report-unlock`
and `./sample-reports` are mocks injected only into the test loader. The loader
is **fail-closed** — an unmocked app import throws instead of loading the real
module — and global `fetch` is replaced with a throwing stub, so an accidental
external network call fails the test. The app runtime is unchanged.

## Limitations

- These are mocks, not live OAuth, Stripe or LLM-provider integration.
- The unlock effects are covered by executing the shared loop (`lib/unlock-poll.ts`)
  and the real follow-up callbacks (`lib/unlock-follow-up.ts`) they call,
  including delayed polling, payload-fetch failure/recovery, attempt budget,
  false reset and cancellation. The React effect bodies are thin wiring around
  those functions and are not rendered (no DOM/React renderer in this repo).
- The classic/modern UI gating itself is not rendered here.

## Related checks

```sh
node --experimental-strip-types --test app/auth/signin/signin-redirect.test.ts
node --experimental-strip-types --test scripts/analyze-classify.test.ts
node --experimental-strip-types --test scripts/onboarding-tour-targets.test.ts
node --experimental-strip-types --test scripts/unlock-refresh.test.ts
```
