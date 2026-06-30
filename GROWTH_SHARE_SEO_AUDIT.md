# FireChess — Viral Share + SEO Audit (Have vs. Need)

_Audited 2026-06-30 against the goal of growing the site **without outreach** (SEO + product-led viral loops). Scope: on-site share infrastructure and SEO/discoverability. Off-site tactics (Product Hunt, Reddit, short-form video) are out of scope for this doc — those don't live in the codebase._

---

## TL;DR

The SEO foundation is **already strong** — comprehensive metadata, a data-driven sitemap, robots rules, JSON-LD, and per-page text metadata across ~46 pages. The roast/legends features already generate beautiful shareable card images.

There is **one glaring, high-leverage gap**: the **core scanner output (`/report/[id]`) has no shareable image and no per-report link preview.** It only offers a "Copy Link" button. The single most-shared artifact in the whole product — "here's my leak report" — produces a generic site preview when posted. Fixing this is the biggest viral lever available.

Secondary gap: the ~200+ SEO content pages all share **one generic OG image** (an emoji ♟ placeholder), so every shared opening/tactic/player link looks identical.

---

## ✅ What we already have (and it's good)

### SEO / metadata
- **Root metadata** ([app/layout.tsx](app/layout.tsx)) — `metadataBase`, title template (`%s | FireChess`), description, 15 keywords, OpenGraph block, Twitter `summary_large_image` card, robots directives, canonical, manifest. Solid.
- **Per-page metadata** — `generateMetadata` / static `metadata` exists across **46 files** (openings, tactics, endgames, positions, time-controls, mistakes, improve, games, players, glossary, legends, blog, community…). Each templated page sets its own title/description.
- **Sitemap** ([app/sitemap.ts](app/sitemap.ts)) — fully data-driven; auto-includes every opening guide, tactic motif, endgame, positional motif, time control, mistake, rating guide, famous game, GM profile, glossary term, and blog post. Excellent and self-maintaining.
- **Robots** ([app/robots.ts](app/robots.ts)) — allows crawl, disallows private routes (`/api/`, `/dashboard`, `/account`, `/admin/`, `/support/`), points to sitemap.
- **JSON-LD** ([components/json-ld.tsx](components/json-ld.tsx)) — `Organization`, `WebApplication`, `WebSite` (rendered globally in layout), plus reusable `Breadcrumb`, `FAQ`, and `Article` components.
- **Blog** — **21 posts** in [content/blog](content/blog), already including SEO-shaped pieces like `firechess-vs-aimchess-comparison-2026.md`, `free-chess-analysis-tools-2026.md`, and rating-plateau / endgame-pattern articles. Good start on the comparison + long-tail strategy.

### Share / viral infrastructure
- **Roast share cards** — three(!) dynamic `ImageResponse` endpoints: [share-card](app/api/roast/share-card/route.tsx), [moment-card](app/api/roast/moment-card/route.tsx), [highlight-card](app/api/roast/highlight-card/route.tsx). Polished, parameterized, branded.
- **Legends share card** — [app/api/legends/share-card/route.tsx](app/api/legends/share-card/route.tsx).
- **Root OG + Twitter images** — [app/opengraph-image.tsx](app/opengraph-image.tsx) + [app/twitter-image.tsx](app/twitter-image.tsx) (1200×630, branded).
- **Referral tracking** — `RefTracker` mounted globally in layout; `?ref=` plumbing exists, and there's a coins/shop system to tie incentives to.
- **Report sharing (partial)** — `/report/[id]` exists, generates an expiring public share page, with a **Copy Link** button and a Save flow ([components/scan-session-page.tsx:432](components/scan-session-page.tsx)).
- **Card UI components** — `brilliant-move-card`, `mistake-card`, `tactic-card`, `endgame-card`, `time-card` (on-page result cards; not yet exported as shareable images).
- Footer social links to Reddit, X/Twitter, GitHub, Discord.

---

## ❌ What we need (gaps, ranked by leverage)

### 🔴 P0 — Shareable scan report card (THE big one)
**Problem:** `/report/[id]` is the product's hero output and its most natural share moment, but it only offers "Copy Link." There is:
- **No share-card image** for a scan result (unlike roast, which has three).
- **No `generateMetadata` on `/report/[id]`** — the page is `force-dynamic` with zero metadata ([app/report/[id]/page.tsx](app/report/[id]/page.tsx)), so a posted report link renders the **generic site OG card**, not the player's stats.

**What to build:**
1. A dynamic OG endpoint, e.g. `app/api/report/share-card/route.tsx` (mirror the roast card), rendering the player's headline numbers — username, games scanned, top opening leak, blunder/mistake/inaccuracy counts, accuracy, biggest single leak. This becomes the share image.
2. `generateMetadata` on `/report/[id]` that pulls the scan from the DB and sets per-report `openGraph.images` + Twitter card to that endpoint, with a personalized title ("I scanned 312 games — here's my biggest leak").
3. A **"Share my report"** button in [scan-session-page.tsx](components/scan-session-page.tsx) next to Copy Link: `navigator.share` on mobile, download-image + copy-link on desktop.

**Why P0:** every other share surface (roast) is already covered; the actual scanner — the thing people came for — is the one that isn't. Highest viral ROI in the codebase.

### 🟠 P1 — Per-page OG images for SEO content pages
**Problem:** ~200+ indexed pages (openings, tactics, players, games, glossary…) all fall back to the **single generic root OG image** (an emoji `♟` placeholder, not even the real logo). Every shared link looks identical → low click-through from social.

**What to build:** a templated `opengraph-image.tsx` per content section (or a shared helper) that renders the page's title + category (e.g. "Sicilian Defense — Opening Guide", "Sokolov vs Kasparov — Famous Game"). Next.js supports per-route `opengraph-image` files; one parameterized component per `[slug]` segment covers a whole category.

### 🟡 P2 — Quick wins (cheap, do in a batch)
- **Google Search Console verification** is still commented out ([app/layout.tsx:93](app/layout.tsx)). Until set, you're flying blind on impressions/queries/indexing. Register + uncomment.
- **Twitter `site:` handle missing** — `twitter` block has no `site`/`creator` `@handle` (only a `creator: "FireChess"` string). Add `site: "@firechessapp"` so cards attribute correctly.
- **Real logo in OG image** — replace the `♟` emoji placeholder in [opengraph-image.tsx](app/opengraph-image.tsx) with the actual `firechess-logo.png` for brand consistency.
- **Referral incentive surfacing** — tracking exists; the *incentive* ("share → get coins / Pro days") isn't wired into the share UI. Tie a coin reward to the report share action to close the viral loop.

### 🔵 P3 — Strategic decision to make (not a clear bug)
- **AI scrapers are hard-blocked** ([app/robots.ts:22](app/robots.ts)) — `GPTBot`, `ChatGPT-User`, `CCBot`, `Google-Extended` are disallowed entirely. That protects content from training-scrape, **but also blocks FireChess from being cited by ChatGPT / Perplexity / Google AI Overviews**, which are a fast-growing zero-outreach discovery channel. Recommend: **allow** the answer-engine user-agents (`ChatGPT-User`, `PerplexityBot`) while keeping training-bots (`GPTBot`, `CCBot`) blocked. Decision is yours — flagging the tradeoff.

---

## Suggested build order

| # | Item | Effort | Leverage |
|---|------|--------|----------|
| 1 | Report share-card image + `generateMetadata` + Share button | M | 🔴🔴🔴 |
| 2 | Quick wins batch (GSC verify, Twitter handle, real logo, AI-bot policy) | S | 🟡🟡 |
| 3 | Referral coin reward wired to share action | S | 🟡🟡 |
| 4 | Per-page OG images for content sections | M–L | 🟠🟠 |
| 5 | More SEO comparison/long-tail blog posts | ongoing | 🟢 (compounds) |

**Recommended first PR:** item #1 (report share card). It's self-contained, mirrors the existing roast card so there's a proven pattern to copy, and unlocks the single highest-value viral loop in the product.

---

_Note: items here are on-site/code only. The broader no-outreach plan (SEO content cadence, Product Hunt launch, Reddit value-posts, short-form video repurposing of the trailer) lives outside the repo and isn't tracked in this file._
