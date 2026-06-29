# Landing Page Modernization — Detailed Implementation Plan

Bringing the FireChess homepage up to modern (2026) landing-page standards, informed by SaaS design research and a code-level audit of `app/page.tsx`, `components/home/*`, `components/navbar.tsx`, and `app/globals.css`.

This is a **living document** — implement one phase at a time, check items off, and fill in the metrics tables. Each phase is independently shippable.

---

## Guiding principles (from research)

- **Speed = trust.** A homepage slower than ~2s loses people before they see the product.
- **Interactive product demo in the hero.** ✅ _Already done (the slideshow)._
- **Minimal, _meaningful_ motion**, with `prefers-reduced-motion` respected.
- **Conversion-focused nav** — few links, one clear CTA, smart sticky header.
- **Fewer, spacious sections** — one idea per section.
- **Credible social proof** — real testimonials + a trust strip.

Research sources: SaaSFrame "10 SaaS landing trends 2026", Memorable.design "Hero sections 2026", Moburst "Landing page trends 2026", Stan.vision "SaaS website design", HelpfulHero "Modern landing examples".

---

## Current-state facts (audited 2026-06-29)

| Fact | Value | Implication |
| --- | --- | --- |
| `app/page.tsx` | **8,539 lines, top-level `"use client"`** | Whole homepage hydrates on client |
| `useState`/`useRef`/`useEffect` in page | **~35+ hooks** (see §1.1) | Almost all are scan/report state |
| Inline report JSX | **~lines 2799–8358** (single `<section>`) | ~5,500 lines of report live on the homepage |
| `next/image` on homepage | **0** (3 raw `<img>`) | Unoptimized images |
| `prefers-reduced-motion` handling | **None anywhere** | Accessibility + modern-baseline gap |
| `components/navbar.tsx` | **1,471 lines, ~57 links**, 1 `sticky` + 3 `fixed` | Decision-paralysis nav |
| Config | `next.config.ts` (TypeScript) | Bundle analyzer wrap must be TS |
| Existing report routes | `app/report/[id]/page.tsx`, `app/scan/[id]/page.tsx` | Report may not need to be inline (see §1.0) |

### ✅ Already shipped (prior sessions)

- Hero redesign: bold two-line headline (gradient-clip bug fixed), single CTA, calmer copy.
- Two-column hero (copy left, interactive slideshow demo right).
- Hero demo = interactive 3-tab product slideshow.
- Spacing rhythm doubled (`space-y-12/14/16` → `20/24/28`).
- Scan tool (`#analyzer`) moved directly under the hero.
- Discord section (`components/home/discord-cta.tsx`).
- Redundant social-proof strip removed.

---

## Phase 0 — Baseline measurement _(do first, ~½ day, risk: none)_

### 0.1 Lighthouse

- [ ] `npm run build && npm start`, then run Chrome Lighthouse (mobile preset, throttled) on `/`.
- [ ] Record LCP, INP, CLS, TBT, total JS transferred in the table below.

### 0.2 Bundle analyzer

- [ ] Install: `npm i -D @next/bundle-analyzer`
- [ ] Wrap `next.config.ts`:
  ```ts
  import withBundleAnalyzerInit from "@next/bundle-analyzer";
  const withBundleAnalyzer = withBundleAnalyzerInit({ enabled: process.env.ANALYZE === "true" });
  // ...existing config object as `nextConfig`...
  export default withBundleAnalyzer(nextConfig);
  ```
- [ ] Run `ANALYZE=true npm run build`; screenshot the `/` route treemap; note the biggest contributors.
- [ ] Record **First Load JS** for `/` from the `next build` route table.

### 0.3 Record baseline

| Metric (mobile) | Baseline | After P1 | Target |
| --- | --- | --- | --- |
| LCP | _tbd_ | | < 2.5s |
| INP | _tbd_ | | < 200ms |
| CLS | _tbd_ | | < 0.1 |
| TBT | _tbd_ | | < 200ms |
| `/` First Load JS | _tbd_ | | ↓ 30%+ |

---

## Phase 1 — Performance foundation _(highest leverage, ~2–4 days, risk: medium-high)_

**Problem:** the page file is a single ~8,500-line `"use client"` component, so every imported section is bundled + hydrated client-side. The inline report (~5,500 lines) dominates.

### 1.0 Decision gate — does the report need to be inline? ⚠️ _do this first_

The biggest lever isn't splitting client/server — it's **whether the full report renders on the homepage at all**.

- [ ] Investigate the existing `app/report/[id]/page.tsx` and `app/scan/[id]/page.tsx` routes — do they already render the same report?
- [ ] Trace the scan flow in `app/page.tsx`: after a scan completes, it sets `result` + `state="done"` and renders the inline report (`result !== null && …`, ~line 2800). Check whether it _also_ persists a report and could instead `router.push` to a report route.
- [ ] **Decide:**
  - **Option A — Navigate to report route** after scan (recommended if routes are equivalent): delete the ~5,500-line inline report from `page.tsx`. Homepage becomes mostly static. _Massive_ win.
  - **Option B — Keep inline** but lazy-load the report tree via `next/dynamic` so it's not in the initial chunk.
- [ ] Record the decision in the log at the bottom. **The rest of Phase 1 depends on this.**

### 1.1 Inventory: interactive vs static

Group the homepage by what truly needs client JS.

**Interactive (must stay client):**
- Scan form + state machine: `username`, `source`, `pgnText`, `gameCount`, `sinceDate`, `untilDate`, `moveCount`, `cpThreshold`, `engineDepth`, `state`, `error`, `notice`, `isLaunchingScan`, `result`, plus submit/scroll handlers (`onSubmit`, `scrollToAnalyzer`, `scrollToSampleReports`, `triggerHeroAnimation`).
- Hero demo slideshow (`HeroProductScreenshot`) — self-contained client island already.
- Toasts, restore banner, daily-login popup, Pro/welcome modals.

**Static (can be server-rendered):**
- Hero headline/copy/CTA markup (CTA needs a tiny client click handler).
- `HowItWorks`, `SampleReportsSection`, `EmailCapture` (its form is its own island), `DiscordCta`, testimonials, Final CTA, `HomepageBlogSection`.

> ⚠️ Gotcha: most static sections are gated by `state === "idle"` (client state) so they hide during a scan. If we go **Option A** (navigate away to report route), the idle-gating disappears and these can be plainly server-rendered. If **Option B**, they must stay inside the client island. This is why §1.0 comes first.

### 1.2 ✅ CHOSEN: Option A2 — reuse `<ScanSessionReport>` inline

_Decided 2026-06-29: keep instant results, replace the duplicated inline report JSX with the shared component._

> **PROGRESS (2026-06-29, branch `landing-modernization`):**
> - [x] Step 1 — adapter `instantScanPayload` (useMemo) added.
> - [x] Step 2 — swap done: inline report (5,555 lines) replaced with `<ScanSessionReport>`. `app/page.tsx` 8,597 → 3,050 lines. tsc clean, idle homepage HTTP 200, committed `d955a81`.
> - [ ] Step 3 — **only required props wired** (`scan`, `reportMeta`, `hasProAccess`, `authenticated`). **Omitted (optional):** `onSave`/`saveStatus`, `guidedLaunchSignal`, `onCreateCommunityPost`, `scanProgress`, `perPhaseProgress`. → save-prompt, guided-launch-from-modal, community-post, and live-progress-in-report are not wired yet. Wire if the live test shows they're needed.
> - [x] Step 4 — dead-code cleanup DONE. Removed ~90 unused symbols + the dead legacy instant-browser-scan path (`runBrowserAnalysis`, `onBrowserProgress`, `tacticMotifs`/motif memos, `quickScanMode`, hero-anim helpers, pos-explain state, etc.). `app/page.tsx` now **2,412 lines** (from 8,597 — a 72% reduction). `tsc --noUnusedLocals` clean; full `tsc` clean; homepage renders 200.
> - **Discovery:** the primary scan flow already POSTs to `/api/scans` and navigates to `/report/[id]` — the inline report/loading/instant-browser path was legacy. The inline `<ScanSessionReport>` now only serves the *restore-cached-report* path. (A dead `state === "loading"` UI block remains — `setState("loading")` is never called — left as an optional future trim.)
> - [ ] **LIVE-SCAN TEST (yours):** run a real username through the homepage and confirm the report renders + matches `/report/[id]`; check PNG export, save-to-dashboard, Pro gating, guided walk.

**The recipe (reverse-engineered from `components/scan-session-page.tsx:1312`):**

`ScanSessionReport` props (signature at `components/scan-session-report.tsx:1797`):
```tsx
<ScanSessionReport
  scan={payload}                 // PublicScanSessionPayload (only .result/.status/.scanMode/.config.cpThreshold read)
  reportMeta={liveReportMeta}    // computeScanReportMeta(result, cpThreshold)  — already imported in page.tsx
  hasProAccess={hasProAccess}
  scanProgress={progress}        // homepage AnalysisProgress
  perPhaseProgress={perPhaseProgress}
  guidedLaunchSignal={guidedLaunchSignal}
  onCreateCommunityPost={openComposer}
  onSave={handleSave}
  saveStatus={saveState}
  authenticated={authenticated}
/>
```

**Step 1 — Adapter.** Add a helper that builds a `PublicScanSessionPayload` from the homepage's instant scan state (all values already exist as state):
```ts
// e.g. lib/scan-session.ts or a new lib/home-scan-adapter.ts
function buildInstantScanPayload(args): PublicScanSessionPayload {
  return {
    id: activeReportPath ?? "instant",     // synthetic; instant scans aren't persisted
    userId: null,
    chessUsername: username,
    source, scanMode,
    status: state === "loading" ? "processing" : "ready",
    config: {
      maxGames: gameCount, maxMoves: moveCount, cpThreshold, engineDepth,
      source, scanMode, speed,
      since: sinceDate ? Date.parse(sinceDate) : null,
      until: untilDate ? Date.parse(untilDate) : null,
      maxTactics: null, maxEndgames: null,
      ...(source === "pgn" ? { pgnText } : {}),
    },
    result,                                 // the instant AnalyzeResponse
    reportMeta: computeScanReportMeta(result, cpThreshold),
    error: error || null, savedReportId: null,
    expiresAt: null, createdAt: null, updatedAt: null,
  };
}
```

**Step 2 — Swap the render.** Replace the inline report block — `{result !== null && (state === "done" || state === "loading") && (<section ref={reportRef}…>…~5,000 lines…</section>)}` (starts ~`app/page.tsx:2800`, report sections at lines 3674–8146) — with `<ScanSessionReport … />` fed by the adapter, keeping the `ref={reportRef}` wrapper for scroll-to behavior.

**Step 3 — Wire the side-prop handlers** from existing homepage state: `onSave`/`saveStatus` (homepage already has save-to-dashboard logic), `authenticated`/`hasProAccess` (from `useSession`), `scanProgress` (existing `AnalysisProgress`), `guidedLaunchSignal` (homepage has guided-walk launch), `onCreateCommunityPost` (community composer, if present — else omit).

**Step 4 — Delete dead code** left after the swap: the inline report JSX and the now-unused state/handlers that only it used (e.g. `tacticsOpen`, `endgamesOpen`, `patternsOpen`, `timeManagementOpen`, `puzzleBoardOpen`, `posExplain*`, PNG-export refs, etc.). Verify each is unused before removing.

> ⚠️ **Execution notes:**
> - This is a **big-bang replacement** (~5,000 lines), not small edits — do it as a whole-file rewrite of `app/page.tsx`'s report region, ideally in an **isolated git worktree/branch** so the current good state stays safe.
> - **Parity requires a live scan** (browser engine) — must be tested by running a real Lichess/Chess.com username through the homepage and comparing the rendered report to the `/report/[id]` route. Cannot be verified by typecheck alone.
> - Watch for behaviors the inline report has that `ScanSessionReport` may handle differently: **PNG export**, **save-to-dashboard CTA**, free-vs-Pro gating, and the guided-walk entry.

### 1.3 Images

- [ ] Convert the 3 testimonial `<img>` (~lines 8379–8434) to `next/image` with explicit `width`/`height` + `sizes`.
- [ ] Verify the testimonial images exist in `public/images/testimonials/` and add `priority={false}` (they're below the fold).

### 1.4 Code-split remaining heavy widgets

- [ ] Confirm `next/dynamic` is used for anything heavy still on the homepage (charts, trainers). `HowItWorks`/`EmailCapture` are already dynamic — extend as needed.

### 1.5 Verify

- [ ] `/verify` the idle homepage and a full scan→report flow for behavior parity.
- [ ] Re-run Phase 0 measurements; fill the "After P1" column. Target: First Load JS ↓ ≥30%.

**Acceptance:** homepage First Load JS down ≥30%; LCP/INP improved; scan→report still works; no visual regressions.

---

## Phase 2 — Motion accessibility _(~½ day, risk: low)_

**Problem:** no `prefers-reduced-motion` handling, despite many keyframes (`fade-in-up`, `hero-blur-rise`, `hero-glow-rise`, `shimmer`, `gradient-x`, `chip-pop`, ping dots) and JS autoplay loops.

### 2.1 Global CSS catch-all ✅ _done_

- [x] Append to `app/globals.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

### 2.2 Pause JS-driven loops ✅ _done_

- [x] Add `lib/use-reduced-motion.ts`:
  ```ts
  import { useEffect, useState } from "react";
  export function useReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const on = () => setReduced(mq.matches);
      on(); mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    }, []);
    return reduced;
  }
  ```
- [x] In `HeroProductScreenshot`: when reduced, **don't auto-advance tabs** (tabs stay clickable).
- [x] In `HeroDemoBoard`: when reduced, the scenario carousel interval is skipped (Prev/Next still work).
- [ ] Audit _other_ homepage `setInterval`/`setTimeout` motion and gate similarly (hero demo loops done; sweep the rest in a later pass).

### 2.3 Verify

- [x] Type-clean + homepage renders (HTTP 200).
- [ ] **Manual check (yours):** toggle OS "reduce motion" → confirm homepage is static, legible, autoplay paused. (Windows: Settings → Accessibility → Visual effects → Animation effects off.)

**Acceptance:** with reduce-motion on, no looping/auto animation; content unaffected.

---

## Phase 3 — Navigation slim-down _(re-scoped — mostly not needed)_

> **FINDING (2026-06-29):** On inspection, `navbar.tsx`'s "~57 links" was a raw
> `href` count across **desktop + mobile duplicates**. The actual UX is already
> a modern **categorized mega-menu**: 5 grouped dropdowns — **Analyze / Play /
> Learn / Community / Explore** — each holding a handful of links, mirrored in
> grouped `mobileSections`. That's the lean, grouped pattern the research
> recommends, so a slim-down refactor would be churn for little gain and is
> risky on site-wide chrome (there's also no footer component to move overflow
> into — it would have to be built). **Decision: leave the nav as-is.**
>
> Optional, low-priority polish if ever desired: merge the 2-link **Community**
> dropdown into **Explore** (5 → 4 top-level menus); make the right-side CTA
> match the hero ("Scan my games"). Not doing these now.

**Original problem statement (superseded):** `navbar.tsx` is 1,471 lines / ~57 links — opposite of the lean modern header.

### 3.1 Define the lean landing nav

- [ ] Pick ≤6 primary items (proposal: **Features, Pricing, Leaderboard, Blog** + **Sign in** + **Scan CTA**).
- [ ] Catalog the other ~50 links; route them to the **footer** and/or a single collapsed "All tools" menu.

### 3.2 Implement

- [ ] Refactor `navbar.tsx` into: slim primary bar (keeps current sticky behavior) + an optional mega-menu/footer for the long tail.
- [ ] Make the nav CTA copy match the hero ("Scan my games").
- [ ] Verify the nav still works on **other routes** (it's global) — spot-check 3–4 pages.

**Acceptance:** ≤6 primary items + CTA; everything else reachable from footer/menu; navbar file substantially smaller.

---

## Phase 4 — Section diet _(~1 day, risk: low-medium)_

Apply the earlier audit (decisions already made).

- [x] **Deleted** the dead App Launcher block + its `LauncherEditor` import, `launcherConfig` state, `saveLauncherConfig`, and loader effect.
- [x] **Deleted** the dead `state === "loading"` UI block (~638 lines; `setState("loading")` is never called) — which also contained the already-dead welcome-back / restore-cached-report banners.
- [x] **Removed the entire dead inline-report / scan-result subsystem** (decision: remove, not revive). The homepage scan navigates to `/report/[id]`; the inline report was unreachable. Net effect of Phase 1 + Phase 4: **`app/page.tsx` 8,597 → 1,267 lines (~85% smaller)**, `tsc` + `tsc --noUnusedLocals` clean, renders 200. Commits `e475f98`, `2876b1b`.
- [x] **Demoted** "More to explore" (Chaos/Sparring/Dungeon/Roast) below the Blog section (commit `0ee1333`).
- [x] **Testimonials** handled in Phase 5 (replaced, not moved — see below).
- [x] Spacing reads as distinct breathing blocks (doubled rhythm from Phase 1).

**Phase 4 is complete.**

**Acceptance:** fewer top-level sections; focus path = hero → scan → how-it-works → proof → CTA.

---

## Phase 5 — Social proof & trust _(~½–1 day, risk: low)_

**Problem:** testimonials look placeholder (stock-photo names + fabricated stats, ~lines 8362–8448); no trust/logo strip.

- [x] **Confirmed: testimonials were fabricated** (placeholder names/photos/stats). Per decision, **replaced** with an honest "What a single scan actually finds" capability band — verifiable product claims, no fake people (commit `0ee1333`). Declined to make the fake ones "look more real" (deceptive endorsement / consumer-protection risk). Real attributed testimonials can drop into the same slot later.
- [x] **Trust signals** are covered honestly: the hero stats row uses real `siteStats`, and the new band states real platform/engine facts (Lichess + Chess.com, Stockfish 18).
- [ ] _Optional, deferred:_ animated count-up on the hero stats when scrolled into view (respect Phase 2 reduced-motion).
- [ ] _Cleanup, optional:_ the now-unreferenced `public/images/testimonials/*.jpg` placeholder photos can be deleted.

**Phase 5 is effectively complete** (only optional polish remains).

**Acceptance:** every proof element is real; a credible trust signal sits above the fold.

---

## Suggested order

1. **Phase 0** (measure) →
2. **Phase 2** (reduced-motion — fast, safe, independent) →
3. **Phase 1** (performance — start with §1.0 decision gate) →
4. **Phase 3** (nav) →
5. **Phase 4** (section diet) →
6. **Phase 5** (trust).

Phase 2 precedes Phase 1 intentionally: quick independent win, and the big refactor is easier to verify once motion is settled.

---

## Decisions / open questions log

- _2026-06-29:_ Plan created. Dark "fire" theme retained (airiness from whitespace, not a light bg); light-mode variant dropped.
- _2026-06-29:_ **Phase 2 (motion accessibility) implemented** — `lib/use-reduced-motion.ts` + global CSS block in `app/globals.css`; `HeroProductScreenshot` and `HeroDemoBoard` autoplay loops now pause under reduce-motion. Pending your OS-toggle confirmation (§2.3).
- ✅ **§1.0 answered (full trace):**
  - `/report/[id]` route → `ScanSessionPage` (1,329 lines) → **`ScanSessionReport` (3,394 lines)** renders the saved report from the DB.
  - `app/page.tsx` does **NOT** import `ScanSessionReport`; it has its **own inline ~5,500-line report** (sections at lines 3674–8146). → **The homepage report is largely duplicated from the shared `ScanSessionReport` component.**
  - The scan flow already persists + navigates in one path (`router.push('/report/${id}')`, `app/page.tsx:1496`); the inline path is the **instant browser-side analysis** (`browserResult` → `setState("done")`, ~line 1246) which shows results immediately **without** a DB round-trip.
  - **Conclusion / Phase 1 decision needed:** Option A (delete inline report, navigate to `/report/[id]`) is the huge win, BUT it changes UX — the instant browser analysis would need to **persist a scan session first**, adding a round-trip before results show. The fork:
    - **A1:** persist instant scans too, then navigate → removes ~5,500 lines, unifies on `ScanSessionReport`, slight delay before results.
    - **A2:** keep instant inline results but **replace the duplicated JSX with the shared `<ScanSessionReport>` component** rendered inline → keeps instant UX, still cuts most duplication. ⭐ likely best.
    - **B:** keep as-is, just lazy-load the inline report tree. Smallest change, least benefit.
- ❓ **Open (blocks Phase 4/5):** are the three testimonials real or placeholder?
