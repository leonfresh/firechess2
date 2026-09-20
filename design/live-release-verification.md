# Live release verification — 2026-09-10

Production commit: `237405ae6ba9584949712d4c7e4eae7bab28757d`.
Vercel deployment: `dpl_4qEitgdvE54AUMM19WfzYGuYXZzy`, Ready, aliased to https://www.firechess.com.

## Passed

- Production build completed, including type checks and generation of 454 static pages.
- Progress-comparison test and custom chessboard renderer identity test passed.
- Public homepage renders the modern design with one navigation header.
- Canonical GothamChess sample report renders 873 findings for the existing signed-in Lifetime session.
- Next position moved from position 1 to 2; practice accepted c5 as the correct move.
- Advanced workspace loaded the classic report tools without recursively rendering the modern report.
- At 390 × 844, the homepage and settled report layout fit the viewport; mobile navigation opened and routed to the dashboard.
- A one-game, depth-6 Lichess scan completed, opened the modern report, and persisted after reload: `40b8a651-ac27-4e21-9795-45a213142a54`. It had zero findings, so it tests scan lifecycle and empty state, not analysis quality. No save-to-account action was taken.
- Real signed-in dashboard loaded saved reports, Lifetime status and practice/planning tools. No saved reports were deleted or account settings changed.
- `/newdashboard`, `/newpricing`, `/newtraining`, `/play`, `/chaos` and `/watch` returned HTTP 200.
- Public auth provider endpoint listed Google, Lichess and Resend. A fresh OAuth callback was not performed.
- Original scan preferences (Lichess, 300 games, depth 24) and browser viewport were restored after the test.

## Remaining

- Stripe checkout completion/webhooks and new account writes were not exercised.
- Existing client-side plan limits are not a server-enforced paywall.
- Browser console errors observed were from installed third-party Chrome extensions; they were not app exceptions.

The original checkout is on the released main commit. Later local changes remain uncommitted. The isolated release checkout is `C:/Users/leonf/NextJs/firechess2-release`.

## Loading-screen follow-up

Commit `44f8d5c3e2f63096d97021518eaecf547b7c23f6` fixes the missed loading/error presentation. Deployment `dpl_AhUS2h3pjrCRATwpiQigimXfmxr2` is Ready on the public domain.

Five regression tests pass: modern processing, modern failure/retry controls, explicit classic fallback, partial-versus-ready rendering, and selected-mode progress. The production build passed.

Live desktop: ten-game depth-12 Lichess scan `add0d487-509c-42d7-a402-a74c384860c6` showed the modern progress screen then opened the modern report with 144 findings. Live mobile (390 × 844): one-game Chess.com scan `4b447a70-c3d1-41c4-b46d-6513f2ec8149` showed the same modern progress design then completed. Browser viewport and original scan preferences were restored. No save-to-account actions were taken.

## Depth-12 performance patch f3409ee
Production dpl_71MJdhDoEp6crQ61LpV9gGe1Eng2 is Ready on www.firechess.com. Build and regression tests passed. Live 12-game depth-12 scan fd41f669-cdae-430b-8b92-2e6b88860013 completed with 148 findings; public scan timestamps 2026-09-09 15:32:57 to 15:33:06 UTC (9 seconds). This validates completion, not matched 300-game speedup. Vercel error-log query for the last 10 minutes returned no logs.
