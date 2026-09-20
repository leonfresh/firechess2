# Replacement readiness — local acceptance check

## Verified with the real local application

- Submitted the new landing form as a guest: GothamChess, Chess.com, one game, depth 6, full report. Created scan `834657ca-0093-4529-afaa-bfb256b35f42` and completed analysis. This is a temporary guest report, not a saved account report.
- Opened that scan through `/newreportpage?id=834657ca-0093-4529-afaa-bfb256b35f42`: eight stored findings, six Free playable positions and two locked findings.
- Next-position control moved from position 1 to 2. Practice rejected an illegal string. Nxb7 was accepted as the correct answer. Refresh preserved one completed practice position.
- Demo dashboard rendered nine public reports; searching Gotham showed the matching report. Continue-last-scan linked to the newly created scan.
- Go Pro while signed out navigated to sign-in with `/newpricing` callback.
- Existing trainer correctly required sign-in before starting its modes.
- Anonymous checkout API request initially returned HTTP 500. Fixed authentication order so it now returns HTTP 401. Added HTTP 503 handling for missing Stripe configuration after authentication.

## Not proven / remaining before full replacement

- `/api/auth/providers` returns `{}` on this local instance. Real signed-in saved reports, Pro/Lifetime state, training sessions, billing and payment completion were not tested. No auth bypass or real payment was used.
- New scan creation still opens the original report processing/result route. Saving, management and some training journeys intentionally lead to existing routes.
- New report sends the complete result into a client component and filters findings by client plan state. These preview limits are not a server-enforced paywall. Scan creation also lacks server validation of the proposed numeric Free plan caps. Resolve entitlement policy and server enforcement before selling these restrictions as live behavior.
- One-game depth-6 run verifies wiring and persistence, not analysis quality or long-running performance. Initial local requests were slow during development compilation; no production performance conclusion drawn.
- No homepage or report route replacement was made during this check.

## Support launcher restoration

The global support launcher now appears on redesigned routes as well as existing pages, while remaining excluded from embeds. Verified at 390 × 844: exactly one visible 48 × 48 launcher, guest navigation to /feedback and simulated signed-in navigation to /support. No message was submitted. Unread polling now runs only for signed-in users and ignores responses after unmount.

Before public cutover: verify real provider callback and account persistence; test checkout/webhook/cancellation with Stripe test mode; enforce the final Free/Pro policy on the server; run a production build and production-mode route smoke test; decide the canonical homepage and completed-report routing. Existing UI simulations do not establish these production flows.
