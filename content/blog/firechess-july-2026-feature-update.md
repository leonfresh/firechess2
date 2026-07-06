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
