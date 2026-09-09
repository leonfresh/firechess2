# Landing and report release — 2026-09-10

- The canonical homepage now renders ModernLanding.
- ScanSessionPage keeps its existing processing/error lifecycle and renders ModernReport when a scan becomes ready. Opponent mode stays on its existing report flow.
- `?view=classic` retains the classic report. The embedded advanced workspace explicitly requests classic rendering to avoid recursion.
- Homepage and sample-report links point to canonical routes. Shared report links omit the classic-view parameter.
- The global navigation is hidden on the homepage because the landing supplies it; the modern report omits its own navigation on canonical report/scan routes.
- Dashboard, training and pricing redesigns remain accessible at their existing new* routes.

## Production baseline

The previous production deployment was created with the Vercel CLI from a dirty checkout: `dpl_Gk3xq7qyiM8HqzWXJZCEDg1YUmL2`, based on Git commit `afac3e968f55899223d281365dcd691bbeae08f5`.

The release preserves the deployed application source, including Chaos Chess changes absent from Git. Source files were matched against Vercel's source manifest using SHA-1; differing baseline files were recovered from that deployment and checked against the manifest. Local changes made after that deployment remain in the original checkout. Development state, credentials, database files and marketing outputs were excluded.

## Remaining scope

Real OAuth callbacks, customer account writes and Stripe payment completion require their own acceptance tests. Client-side report restrictions are presentation limits, not a newly enforced server paywall. The advanced report workspace reuses the classic tools.
