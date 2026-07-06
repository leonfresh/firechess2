---
title: "What's New on FireChess: July 2026 — Daily Training, Roast My Elo, Chaos Anomalies & More"
description: "Daily Training with blunder drills, Roast My Elo with Stockfish roast commentary, Chaos Chess Opening Anomalies, Unified Reports, and a Lifetime plan — the biggest FireChess updates of H1 2026."
date: 2026-07-06
author: "FireChess Team"
tags:
  - firechess updates
  - chess analysis
  - chess improvement
  - chess training
  - chaos chess
  - roast my elo
---

Since launching earlier this year, FireChess has been on a constant update cadence — and between February and May 2026 alone, we shipped 28 releases covering everything from a full roguelike chess variant to a personalised daily training routine powered by your own games.

Whether you're a 1200-rated player looking for structured improvement or a 1800-rated club player wanting to sharpen your tactics, the last few months have brought features that genuinely change how you can use FireChess. Here's everything worth knowing.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 420" width="100%" style="max-width:680px;border-radius:16px;margin:24px 0;background:#080d1a;font-family:'Segoe UI','SF Pro',system-ui,sans-serif">
  <defs>
    <linearGradient id="bgGlow2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1525"/>
      <stop offset="100%" stop-color="#080d1a"/>
    </linearGradient>
    <linearGradient id="spotGlow2" x1="0" y1="0" x2="0.5" y2="0.8">
      <stop offset="0%" stop-color="#ff4757" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#080d1a" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="titleGrad2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff4757"/>
      <stop offset="60%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
    <linearGradient id="cardBg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#131a30" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="680" height="420" rx="16" fill="url(#bgGlow2)"/>
  <rect width="680" height="420" rx="16" fill="url(#spotGlow2)"/>
  <rect x="1" y="1" width="678" height="418" rx="15" fill="none" stroke="#1e293b" stroke-width="1"/>

  <!-- Feature tag line -->
  <text x="28" y="30" font-size="8" fill="#ff4757" font-weight="700" letter-spacing="2">🔥 FIRECHESS · H1 2026</text>
  <text x="28" y="52" font-size="17" font-weight="800" fill="url(#titleGrad2)">What's New on FireChess</text>
  <text x="28" y="70" font-size="11" fill="#94a3b8">28 releases · 4 major features · 1 lifetime plan</text>

  <!-- Chessboard – 140x140, 17.5px squares, starting position -->
  <g transform="translate(28, 85)">
    <rect x="-1" y="-1" width="142" height="142" rx="4" fill="#1a204060" stroke="#334155" stroke-width="0.8"/>
    <!-- Ranks -->
    <g>
      <rect x="0" y="0" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="17.5" y="0" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="35" y="0" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="52.5" y="0" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="70" y="0" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="87.5" y="0" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="105" y="0" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="122.5" y="0" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="0" y="17.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="17.5" y="17.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="35" y="17.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="52.5" y="17.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="70" y="17.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="87.5" y="17.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="105" y="17.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="122.5" y="17.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="0" y="35" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="17.5" y="35" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="35" y="35" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="52.5" y="35" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="70" y="35" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="87.5" y="35" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="105" y="35" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="122.5" y="35" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="0" y="52.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="17.5" y="52.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="35" y="52.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="52.5" y="52.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="70" y="52.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="87.5" y="52.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="105" y="52.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="122.5" y="52.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="0" y="70" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="17.5" y="70" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="35" y="70" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="52.5" y="70" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="70" y="70" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="87.5" y="70" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="105" y="70" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="122.5" y="70" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="0" y="87.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="17.5" y="87.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="35" y="87.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="52.5" y="87.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="70" y="87.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="87.5" y="87.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="105" y="87.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="122.5" y="87.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="0" y="105" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="17.5" y="105" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="35" y="105" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="52.5" y="105" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="70" y="105" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="87.5" y="105" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="105" y="105" width="17.5" height="17.5" fill="#ebd5b3"/><rect x="122.5" y="105" width="17.5" height="17.5" fill="#2d5a27"/>
      <rect x="0" y="122.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="17.5" y="122.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="35" y="122.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="52.5" y="122.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="70" y="122.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="87.5" y="122.5" width="17.5" height="17.5" fill="#ebd5b3"/>
      <rect x="105" y="122.5" width="17.5" height="17.5" fill="#2d5a27"/><rect x="122.5" y="122.5" width="17.5" height="17.5" fill="#ebd5b3"/>
    </g>
    <!-- Pieces: starting position -->
    <g font-family="'Segoe UI Symbol','Noto Sans Chess','Arial Unicode MS',sans-serif" text-anchor="middle" dominant-baseline="central" font-size="14">
      <text x="8.75" y="8.75" fill="#111">♜</text><text x="26.25" y="8.75" fill="#111">♞</text><text x="43.75" y="8.75" fill="#111">♝</text>
      <text x="61.25" y="8.75" fill="#111">♛</text><text x="78.75" y="8.75" fill="#111">♚</text><text x="96.25" y="8.75" fill="#111">♝</text>
      <text x="113.75" y="8.75" fill="#111">♞</text><text x="131.25" y="8.75" fill="#111">♜</text>
      <text x="8.75" y="26.25" fill="#111">♟</text><text x="26.25" y="26.25" fill="#111">♟</text><text x="43.75" y="26.25" fill="#111">♟</text>
      <text x="61.25" y="26.25" fill="#111">♟</text><text x="78.75" y="26.25" fill="#111">♟</text><text x="96.25" y="26.25" fill="#111">♟</text>
      <text x="113.75" y="26.25" fill="#111">♟</text><text x="131.25" y="26.25" fill="#111">♟</text>
      <text x="8.75" y="113.75" fill="#fff">♙</text><text x="26.25" y="113.75" fill="#fff">♙</text><text x="43.75" y="113.75" fill="#fff">♙</text>
      <text x="61.25" y="113.75" fill="#fff">♙</text><text x="78.75" y="113.75" fill="#fff">♙</text><text x="96.25" y="113.75" fill="#fff">♙</text>
      <text x="113.75" y="113.75" fill="#fff">♙</text><text x="131.25" y="113.75" fill="#fff">♙</text>
      <text x="8.75" y="131.25" fill="#fff">♖</text><text x="26.25" y="131.25" fill="#fff">♘</text><text x="43.75" y="131.25" fill="#fff">♗</text>
      <text x="61.25" y="131.25" fill="#fff">♕</text><text x="78.75" y="131.25" fill="#fff">♔</text><text x="96.25" y="131.25" fill="#fff">♗</text>
      <text x="113.75" y="131.25" fill="#fff">♘</text><text x="131.25" y="131.25" fill="#fff">♖</text>
    </g>
    <g font-size="7" fill="#4a5568" font-family="monospace">
      <text x="2" y="138">a</text><text x="19" y="138">b</text><text x="37" y="138">c</text>
      <text x="54" y="138">d</text><text x="72" y="138">e</text><text x="89" y="138">f</text>
      <text x="107" y="138">g</text><text x="124" y="138">h</text>
      <text x="138" y="12">8</text><text x="138" y="30">7</text><text x="138" y="47">6</text>
      <text x="138" y="65">5</text><text x="138" y="82">4</text><text x="138" y="100">3</text>
      <text x="138" y="117">2</text><text x="138" y="135">1</text>
    </g>
  </g>

  <!-- Feature cards on the right -->
  <g transform="translate(188, 85)">
    <!-- Card 1: Daily Training -->
    <rect x="0" y="0" width="230" height="38" rx="8" fill="url(#cardBg2)" stroke="#22d3ee30" stroke-width="0.5"/>
    <rect x="8" y="8" width="22" height="22" rx="6" fill="#22d3ee15"/>
    <text x="19" y="20" font-size="12" fill="#22d3ee" text-anchor="middle" dominant-baseline="central">📅</text>
    <text x="36" y="14" font-size="9" fill="#22d3ee" font-weight="700">Daily Training</text>
    <text x="36" y="27" font-size="8" fill="#64748b">5 puzzles + blunder drills from your games</text>

    <!-- Card 2: Roast My Elo -->
    <rect x="0" y="46" width="230" height="38" rx="8" fill="url(#cardBg2)" stroke="#f59e0b30" stroke-width="0.5"/>
    <rect x="8" y="54" width="22" height="22" rx="6" fill="#f59e0b15"/>
    <text x="19" y="66" font-size="12" fill="#f59e0b" text-anchor="middle" dominant-baseline="central">🔥</text>
    <text x="36" y="60" font-size="9" fill="#f59e0b" font-weight="700">Roast My Elo</text>
    <text x="36" y="73" font-size="8" fill="#64748b">Watch games w/ Stockfish roast commentary</text>

    <!-- Card 3: Chaos Anomalies -->
    <rect x="0" y="92" width="230" height="38" rx="8" fill="url(#cardBg2)" stroke="#a78bfa30" stroke-width="0.5"/>
    <rect x="8" y="100" width="22" height="22" rx="6" fill="#a78bfa15"/>
    <text x="19" y="112" font-size="12" fill="#a78bfa" text-anchor="middle" dominant-baseline="central">🌀</text>
    <text x="36" y="106" font-size="9" fill="#a78bfa" font-weight="700">Chaos Opening Anomalies</text>
    <text x="36" y="119" font-size="8" fill="#64748b">22 Tarot-based pre-game powers</text>

    <!-- Card 4: Unified Reports -->
    <rect x="0" y="138" width="230" height="38" rx="8" fill="url(#cardBg2)" stroke="#48bb7830" stroke-width="0.5"/>
    <rect x="8" y="146" width="22" height="22" rx="6" fill="#48bb7815"/>
    <text x="19" y="158" font-size="12" fill="#48bb78" text-anchor="middle" dominant-baseline="central">📊</text>
    <text x="36" y="152" font-size="9" fill="#48bb78" font-weight="700">Unified Reports</text>
    <text x="36" y="165" font-size="8" fill="#64748b">One scan covers openings, tactics, endgames</text>
  </g>

  <!-- Bottom info bar -->
  <g transform="translate(28, 250)">
    <rect x="0" y="0" width="390" height="28" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="0.5"/>
    <text x="195" y="17" font-size="9" fill="#475569" text-anchor="middle" font-weight="600">🔗 All features live at firechess.com — start with a free scan</text>
  </g>

  <!-- Version badge -->
  <g transform="translate(470, 85)">
    <rect x="0" y="0" width="170" height="170" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="0.5"/>
    <text x="85" y="24" font-size="9" fill="#64748b" text-anchor="middle">RELEASES IN 2026</text>
    <text x="85" y="52" font-size="36" fill="#ff4757" text-anchor="middle" font-weight="800" filter="url(#glow)">28</text>
    <text x="85" y="68" font-size="9" fill="#94a3b8" text-anchor="middle">major + minor updates</text>
    <line x1="15" y1="80" x2="155" y2="80" stroke="#1e293b" stroke-width="0.5"/>
    <text x="85" y="96" font-size="9" fill="#64748b" text-anchor="middle">LATEST VERSION</text>
    <text x="85" y="116" font-size="18" fill="#22d3ee" text-anchor="middle" font-weight="700">v28</text>
    <text x="85" y="132" font-size="8" fill="#64748b" text-anchor="middle">Unified Reports</text>
    <text x="85" y="145" font-size="8" fill="#475569" text-anchor="middle">released May 14, 2026</text>
    <rect x="25" y="152" width="120" height="1" fill="#ff475720"/>
  </g>
</svg>

## Daily Training: Your Personalised Chess Workout

The biggest improvement-oriented feature to land on FireChess is **Daily Training** (`/daily`). Launched in April as version 27, it gives every user — free and Pro alike — a short, personalised training session that resets each day.

Here's how it works:

- **5 targeted puzzles** matched to your weakest tactical themes, pulled from Lichess's puzzle database. If you keep missing forks or pins, Daily Training serves you exactly those motifs.
- **Up to 3 blunder drills** drawn from your own games. FireChess scans your missed tactics (any move where centipawn loss spiked above 50) and turns them into replayable positions. Each day is seeded differently, so you never repeat the same drill.
- **Streak tracking** — complete a session and your streak increments. Miss a day and it resets. Your current streak is shown in the session header and on the completion card.
- **A completion screen** showing your correct/total score, a per-task dot grid (green for correct, red for missed), and links to more training.

The smartest part: if you haven't run a tactics scan yet, Daily Training shows 5 puzzles and displays an in-session notice explaining that blunder drills unlock after you scan your games at the [FireChess analysis page](https://firechess.com/). It's a gentle onboarding nudge, not a hard gate.

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

## What's Next?

28 releases in under 5 months is a fast cadence, and we're not slowing down. The public [changelog](/changelog) is the canonical source for every update, but here's what's on the near-term roadmap:

- **Community features** — deeper social mechanics around shared reports and training
- **Opening Sparring expansion** — the sparring mode (`/sparring`) is getting more lines and adaptive difficulty
- **Dungeon Tactics** — the `/dungeon` gamified tactics mode will add new floors and boss puzzles

If you have a feature request, the [Discord community](https://discord.gg/y9NCXcdvs8) is the best place to share it — many of the features above (including Roast My Elo and Opening Anomalies) started as user suggestions.

## Start Using the New Features

The best way to experience everything FireChess now offers is to [scan your games](https://firechess.com/) — it's free, takes seconds, and needs no account. From there:

- Try **[Daily Training](https://firechess.com/daily)** for 5 minutes every day
- **[Roast an Elo](https://firechess.com/roast)** for the entertainment value (and the learning)
- **[Play Chaos Chess](https://firechess.com/chaos)** with Opening Anomalies if you want a completely fresh take on the game
- **[Check your reports](https://firechess.com/)** and see if your accuracy is trending up

**Related reading:**
- [Average Centipawn Loss by Elo: What's a Good ACPL Rating?](/blog/average-centipawn-loss-by-elo) — Understand your accuracy metrics
- [FireChess vs Aimchess Comparison](/blog/firechess-vs-aimchess-comparison-2026) — How FireChess stacks up against the competition
- [Guess the Elo from PGN](/blog/guess-elo-from-pgn) — Estimate rating from game data alone
