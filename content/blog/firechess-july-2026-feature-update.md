---
title: "What's New on FireChess: July 2026 — Daily Training, Roast My Elo, Chaos Anomalies & More"
description: "FireChess July 2026 update: Daily Training blunder drills, Roast My Elo commentary, and new analysis features for club players."
date: 2026-07-06
author: "FireChess Team"
tags:
  - firechess updates
  - chess analysis
  - chess improvement
  - chess training
  - chaos chess
  - roast my elo
  - roadmap
---

Since launching earlier this year, FireChess has been on a constant update cadence — and between February and May 2026 alone, we shipped 28 releases covering everything from a full roguelike chess variant to a personalised daily training routine powered by your own games.

Whether you're a 1200-rated player looking for structured improvement or a 1800-rated club player wanting to sharpen your tactics, the last few months have brought features that genuinely change how you can use FireChess. Here's everything worth knowing.

## Daily Training: Your Personalised Chess Workout

The biggest improvement-oriented feature to land on FireChess is **Daily Training** (`/daily`). Launched in April as version 27, it gives every user — free and Pro alike — a short, personalised training session that resets each day.

Here's how it works:

- **5 targeted puzzles** matched to your weakest tactical themes, pulled from Lichess's puzzle database. If you keep missing forks or pins, Daily Training serves you exactly those motifs.
- **Up to 3 blunder drills** drawn from your own games. FireChess scans your missed tactics (any move where centipawn loss spiked above 50) and turns them into replayable positions. Each day is seeded differently, so you never repeat the same drill.
- **Streak tracking** — complete a session and your streak increments. Miss a day and it resets. Your current streak is shown in the session header and on the completion card.
- **A completion screen** showing your correct/total score, a per-task dot grid (green for correct, red for missed), and links to more training.

The smartest part: if you haven't run a tactics scan yet, Daily Training shows 5 puzzles and displays an in-session notice explaining that blunder drills unlock after you scan your games at the [FireChess analysis page](/analyze). It's a gentle onboarding nudge, not a hard gate.

> **For club players (1200-1800):** This is the single highest-ROI feature on the site. Instead of grinding generic puzzles, you're drilling your actual mistakes — the moves you personally keep missing. Do 5 minutes of Daily Training every day for two weeks, and watch your blunder rate drop.

## Roast My Elo: Harsh Feedback, Real Improvement

If Daily Training is the serious improvement mode, **Roast My Elo** (`/roast`) is where FireChess shows its personality. Launched in March (version 23), it grabs real Lichess games and replays them move by move with AnarchyChess-style roast commentary powered by Stockfish.

The feature has quickly become one of the most popular on the site — our GSC data shows it getting 17 clicks from 233 impressions with a 7.3% CTR and average position of 6.8, making it FireChess's third most-clicked page after the homepage and Chaos Chess.

What makes it work:

- **600+ unique roast lines** across 6 categories — opening roasts, blunder roasts, Elo flavour lines, guess comments, closing roasts, and positional shade. The commentary pool is large enough that you rarely see repeats.
- **Animated roast avatar** that reacts to the game — hyped, shocked, crying, smug, or confused depending on blunder count, best-move streaks, and Elo bracket.
- **Elo bracket guessing** — after watching the game, pick a bracket (600–800, 1200–1400, 2000+) and find out how far off you were. The closer your guess, the higher you climb on the [Roast leaderboard](/roast/leaderboard).
- **Autoplay with adjustable speed** — 0.5×, 1×, 2×, 4× — commentary fires on each move automatically.
- **Shareable result card** — shows your Elo guess, actual Elo, roast grade, and a copy-to-clipboard share link.

If you haven't tried it yet, load up a game between two 800s and watch the carnage unfold with roast commentary. It's educational and genuinely funny.

## Chaos Chess Opening Anomalies: 22 Tarot-Based Powers

Chaos Chess (`/chaos`) was already FireChess's most popular page — our GSC data shows 59 clicks from 348 impressions, a 16.95% CTR, and an average position of 3.2. It's the highest-traffic page on the site after the homepage. And version 25 made it even deeper with **Opening Anomalies**.

Before the first move, each player secretly chooses one of four Tarot-inspired Opening Anomalies — a permanent passive power that shapes the entire match. There are 22 anomalies across all tiers (free players choose from 2, Pro unlocks all 4 per session), each with unique mechanics and a once-per-game activation ability.

Some highlights:

- **The Fool (Wanderer Pawns)** — pawns move diagonally forward like normal, but also have a wander ability that lets them shift one square sideways.
- **The Emperor (King Leaps)** — your king can move up to 3 squares in any direction like a limited queen.
- **Death (Pawn Spawner)** — every 5 turns, a pawn spawns on a random empty square on your second rank.
- **The Tower (Fortress)** — rooks become immovable defenders with extended control.
- **The Moon (Ghost Queen)** — unlocks a phantom queen after turn 10 that can move through pieces.

The anomalies were fine-tuned with Stockfish integration so the AI correctly evaluates your anomaly-powered moves — earlier versions had a "Stockfish blindness" bug where the engine ignored anomaly moves when choosing defences, which is now fixed.

If you play Chaos Chess regularly, the Opening Anomalies add a roguelike layer that keeps every game fresh. [Start a Chaos game](https://firechess.com/chaos) and try The Emperor for an experience that feels closer to a king-of-the-hill brawl than standard chess.

## Unified Reports: One Scan for Everything

One of the most requested UX improvements landed in version 28 (May 2026): **Unified Reports**. Previously, scanning your games meant choosing between openings, tactics, or endgames separately. Now, a single scan covers all four dimensions:

- **Opening Leak Detection** — find repeated positions where you consistently play the wrong move, with drill mode to practice the correct lines.
- **Missed Tactics Scanner** — surface forks, pins, skewers, and combinations you overlooked, with motif tagging.
- **Endgame Mistake Scanner** — catch losing moves in rook, pawn, and minor piece endgames.
- **Time Management Analysis** — see which phases of the game you spend too much (or too little) time on.

Each scan now opens on a dedicated report page (`/report/[id]`) with a cleaner card-based layout inspired by the [Community](/community) posts. Free users can preview the first 9 tactics, endgames, and time-management examples, with the rest locked behind Pro. The report also caches between sessions — refreshing the page reuses your saved result instead of regenerating it.

For club players building a study plan, this is a significant quality-of-life win. [Start a unified scan](https://firechess.com/) with your Lichess or Chess.com username and get your full report in seconds.

## Magic Link Sign-in & Lifetime Plan

Two quality-of-life updates worth mentioning:

**Magic link sign-in** (v3) — no more passwords. Enter your email, click the link sent via Resend, and you're logged in. It's faster, more secure, and works immediately.

**Lifetime Pro plan** — alongside the existing monthly ($5/mo) and annual ($8/mo) Pro tiers, you can now buy Pro forever for a one-time payment of $59. The Lifetime plan includes everything in Pro — unlimited game scanning, engine depth up to 24, motif analysis, brilliant-move detection, and full mental-game breakdowns — with no recurring fees. It was launched as a founding-member offer and locked in at that price.

See the full comparison on the [pricing page](/pricing).

## Feature Release Timeline

Here's a visual look at how the major features have rolled out across the first half of 2026:

<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;background:#0f172a;border-radius:12px;padding:16px;">
  <defs>
    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <linearGradient id="upcomingGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
  </defs>
  <!-- Title -->
  <text x="400" y="36" fill="#f1f5f9" font-size="20" font-family="system-ui,sans-serif" font-weight="700" text-anchor="middle">FireChess — Feature Release Timeline</text>
  <text x="400" y="56" fill="#94a3b8" font-size="13" font-family="system-ui,sans-serif" text-anchor="middle">January – December 2026</text>
  <!-- Timeline axis -->
  <line x1="60" y1="80" x2="760" y2="80" stroke="#334155" stroke-width="2"/>
  <!-- Month markers -->
  <text x="60" y="72" fill="#64748b" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle">Jan</text>
  <text x="165" y="72" fill="#64748b" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle">Feb</text>
  <text x="270" y="72" fill="#64748b" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle">Mar</text>
  <text x="375" y="72" fill="#64748b" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle">Apr</text>
  <text x="480" y="72" fill="#64748b" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle">May</text>
  <text x="585" y="72" fill="#64748b" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle">Jun</text>
  <text x="690" y="72" fill="#64748b" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle">H2 2026</text>
  <line x1="60" y1="80" x2="60" y2="460" stroke="#1e293b" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="690" y1="80" x2="690" y2="460" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>
  <!-- Bars -->
  <!-- v3 Magic Link -->
  <rect x="62" y="100" width="90" height="32" rx="6" fill="#6366f1" opacity="0.85"/>
  <text x="107" y="120" fill="#e2e8f0" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle" font-weight="600">Magic Link</text>
  <!-- v23 Roast My Elo -->
  <rect x="230" y="145" width="90" height="32" rx="6" fill="#a855f7" opacity="0.85"/>
  <text x="275" y="165" fill="#e2e8f0" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle" font-weight="600">Roast My Elo</text>
  <!-- v25 Opening Anomalies -->
  <rect x="340" y="190" width="90" height="32" rx="6" fill="#8b5cf6" opacity="0.85"/>
  <text x="385" y="210" fill="#e2e8f0" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle" font-weight="600">Chaos Anom.</text>
  <!-- v27 Daily Training -->
  <rect x="340" y="235" width="90" height="32" rx="6" fill="#7c3aed" opacity="0.85"/>
  <text x="385" y="255" fill="#e2e8f0" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle" font-weight="600">Daily Training</text>
  <!-- v28 Unified Reports -->
  <rect x="445" y="280" width="90" height="32" rx="6" fill="#6366f1" opacity="0.85"/>
  <text x="490" y="300" fill="#e2e8f0" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle" font-weight="600">Unified Rpts</text>
  <!-- Lifetime Plan -->
  <rect x="445" y="325" width="90" height="32" rx="6" fill="#4f46e5" opacity="0.85"/>
  <text x="490" y="345" fill="#e2e8f0" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle" font-weight="600">Lifetime Plan</text>
  <!-- Upcoming H2 -->
  <rect x="672" y="145" width="70" height="170" rx="8" fill="url(#upcomingGrad)" opacity="0.3" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6,3"/>
  <text x="707" y="240" fill="#fbbf24" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle" font-weight="700" transform="rotate(-90,707,240)">Coming H2 2026 →</text>
  <!-- Legend -->
  <rect x="60" y="400" width="12" height="12" rx="2" fill="#6366f1"/>
  <text x="78" y="410" fill="#94a3b8" font-size="11" font-family="system-ui,sans-serif">Shipped</text>
  <rect x="140" y="400" width="12" height="12" rx="2" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,2"/>
  <text x="158" y="410" fill="#94a3b8" font-size="11" font-family="system-ui,sans-serif">In development</text>
  <text x="400" y="460" fill="#475569" font-size="10" font-family="system-ui,sans-serif" text-anchor="middle">28 releases across 5 months — and the pace is accelerating</text>
</svg>

## Coming Soon: The H2 2026 Roadmap

Twenty-eight releases in under five months is a fast cadence, and we're not slowing down for the second half of 2026. The public [changelog](/changelog) is the canonical source for every update, but here's a detailed look at what's on the near-term roadmap.

### Community Hub & Social Features

The biggest area of investment for H2 2026 is the **Community Hub**. Right now, the [/community](/community) page shows aggregate stats and a feed of posts, but the next iteration turns it into a full social layer for chess improvement.

You can expect:

- **Shared Reports** — publish your unified scan report with a shareable link, let friends view your strengths and weaknesses, and compare accuracy metrics side by side.
- **Training Groups** — create or join a group (your club, your Discord server, your chess team) and track everyone's Daily Training streaks on a shared dashboard. Group admins can see who's falling off and nudge them back into a routine.
- **Leaderboards** — weekly and all-time leaderboards for Daily Training accuracy, Roast My Elo guessing accuracy, and Chaos Chess win rate. Each board has a "Friends" tab so you're competing against people you know, not the entire internet.
- **Activity Feed** — see when your friends complete a training session, set a new personal best on a tactics set, or unlock an achievement in Chaos Chess.

Community features are currently in early alpha testing with a small Discord beta group. If you're interested in early access, join the [Discord](https://discord.gg/y9NCXcdvs8) and look for the "community-beta" role channel.

### Opening Sparring Gets Smarter

The Opening Sparring mode (`/sparring`) already lets you practice specific opening lines against an AI that plays the most common responses at your Elo level. The next version adds three major upgrades:

- **Adaptive difficulty** — sparring now watches your performance in real time. If you're blitzing through every line correctly, it increases the Elo simulation and throws trickier transpositions at you. If you're struggling, it slows down and feeds you simpler variations until you stabilise.
- **Spaced-repetition scheduling** — lines you keep getting wrong are resurfaced more frequently. Lines you nail twice in a row are pushed further out. It's the same spaced-repetition principle that Anki and Memrise use, applied to opening theory.
- **Expanded opening repertoire** — coverage goes from 12 major openings to 28, including the Sicilian Najdorf, King's Indian Defence, Queen's Gambit Declined, and the London System (for those who need it).

### Dungeon Tactics: New Floors & Boss Puzzles

The `/dungeon` gamified tactics mode launched as a proof of concept with 5 floors and a final boss puzzle. The H2 expansion triples the content:

- **15 floors** instead of 5, each themed around a different tactical motif (forks, pins, skewers, discovered attacks, double checks, clearance sacrifices, Zwischenzug, and more).
- **Boss puzzles** at the end of every 5-floor tier — multi-move combinations that require you to sequence 3–5 tactical ideas in the correct order.
- **Dungeon rankings** — clear a floor in fewer moves or faster time than average and your name goes on the floor leaderboard. Clear all 15 floors and you earn a "Dungeon Master" badge on your profile.
- **Daily dungeon** — a single randomly generated floor available to everyone for 24 hours. Completing it contributes to your Daily Training streak.

### Mobile & PWA Improvements

While FireChess has been usable on mobile since launch, the H2 roadmap includes a dedicated **Progressive Web App (PWA)** push:

- **Offline mode** — Daily Training puzzles will be cached so you can train without an internet connection. Your results sync when you reconnect.
- **Push notifications** — get a daily reminder when your Daily Training resets, when someone replies to your shared report, or when your Chaos Chess opponent makes a move in a correspondence game.
- **Touch-optimised board interactions** — piece drag-and-drop improvements for mobile screens, including haptic feedback on supported devices and a new "tap-to-select, tap-to-move" mode for smaller screens.

### API & Developer Tools

For the power users who've been asking: we're building a **FireChess Public API**. The initial release will include:

- **Game ingestion endpoint** — push PGN data directly to FireChess programmatically.
- **Report data API** — pull your scan results as structured JSON for custom analysis or integration with your own training tools.
- **Embeddable analysis widget** — an iframe or web component you can drop into your own site to show a FireChess accuracy widget for your latest tournament games.

The API is expected to enter closed beta in Q4 2026. Join the [Discord](https://discord.gg/y9NCXcdvs8) and flag yourself as an API tester to get early access.

### Coach & Team Features

Finally, we're building features specifically for chess coaches and team managers:

- **Student dashboards** — coaches can invite students, see their unified reports, and track their Daily Training completion rates over a week, month, or term.
- **Curriculum mode** — assign specific opening lines or tactical themes to a student and get notified when they've completed the work.
- **Team analytics** — aggregate stats across all members of a club or school team, with exportable CSV reports for grant applications or progress reviews.

These features are currently in design review and are expected to roll out in late Q3 2026.

If you have a feature request, the [Discord community](https://discord.gg/y9NCXcdvs8) is the best place to share it — many of the features above (including Roast My Elo and Opening Anomalies) started as user suggestions.

## Frequently Asked Questions

### Q: Is FireChess really free?

Yes. The core features — game scanning, Daily Training (with puzzles and streak tracking), Chaos Chess, and Roast My Elo — are all available without a subscription. Free users get one full unified report per week and access to 2 Chaos Chess anomalies per session. Pro unlocks unlimited scanning, all 4 anomalies per Chaos game, deeper Stockfish analysis (up to depth 24), and priority on new features during beta. You can see the full breakdown on the [pricing page](/pricing).

### Q: How is Daily Training different from doing puzzles on Lichess or Chess.com?

The key difference is **personalisation**. Lichess puzzles are a random sample from the entire database, sorted by rating. Chess.com's puzzle rush is speed-oriented. Daily Training on FireChess draws exclusively from positions where *you* have made mistakes in your own games — your personal blunder history. The 5 puzzles each day are also matched to the tactical themes you're weakest at, based on your unified report data. It's less content per day than a puzzle rush session, but every single position is one you could have faced in a real game and got wrong.

### Q: Do I need a Lichess or Chess.com account to use FireChess?

You need at least one — FireChess analyses games from your Lichess or Chess.com history. You don't need to install anything or grant any special permissions; just enter your username on the [analysis page](/analyze) and FireChess pulls your recent games from the public APIs. If you don't have an account on either platform, you can still play Chaos Chess and explore the site, but the core analysis features (unified reports, Daily Training blunder drills, Roast My Elo) require game data to work with.

### Q: How does Roast My Elo decide what to say?

Roast My Elo feeds each move of the game to Stockfish 17 at depth 18 and compares the actual move to the engine's top 3 recommendations. The difference in evaluation (centipawn loss) determines which category of roast fires. A 300+ centipawn loss triggers a "blunder roast" — the most savage tier. The specific line is chosen from a pool of 600+ pre-written roasts, filtered by the game's Elo bracket, phase of the game, and how many blunders have already occurred. The animated avatar reacts based on a running "roast severity score" that accumulates across the game.

### What's the difference between Chaos Chess and standard chess?

Chaos Chess uses the same board and piece movement rules as standard chess — with one critical addition: **Opening Anomalies**. Before the game starts, each player secretly picks a tarot-themed power from a hand of four options. These powers (22 in total) change the rules in asymmetric ways — your pawns might wander sideways, your king might leap like a limited queen, or a ghost queen might appear after 10 moves. The game is still recognisably chess, but the asymmetry means standard opening theory doesn't apply, so every game is a unique, creative battle. FireChess runs Chaos Chess with full Stockfish analysis, so the AI opponent correctly evaluates anomaly-powered moves.

## Start Using the New Features

The best way to experience everything FireChess now offers is to [scan your games](https://firechess.com/) — it's free, takes seconds, and needs no account. From there:

- Try **[Daily Training](https://firechess.com/daily)** for 5 minutes every day — drill your actual mistakes, not generic puzzles.
- **[Roast an Elo](https://firechess.com/roast)** for the entertainment value (and the learning) — see how harsh Stockfish can be about a 600-rated game.
- **[Play Chaos Chess](https://firechess.com/chaos)** with Opening Anomalies if you want a completely fresh take on the game — try The Emperor for a king-leaping brawl.
- **[Analyse your games](https://firechess.com/analyze)** with the new unified reports — one scan covers openings, tactics, endgames, and time management.
- **[Check your reports](https://firechess.com/)** and see if your accuracy is trending up over time.

**Related reading:**

- [Average Centipawn Loss by Elo: What's a Good ACPL Rating?](/blog/average-centipawn-loss-by-elo) — Understand your accuracy metrics
- [FireChess vs Aimchess Comparison](/blog/firechess-vs-aimchess-comparison-2026) — See how FireChess stacks up against the competition
- [Guess the Elo from PGN](/blog/guess-elo-from-pgn) — Estimate rating from game data alone, and learn [what rating looks like on the board](/blog/guess-the-elo-chess)
