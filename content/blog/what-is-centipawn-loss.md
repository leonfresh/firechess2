---
title: "What Is Centipawn Loss and Why It Matters"
description: "Understanding centipawn loss (CPL) — the key metric engines use to measure your chess accuracy, and how to use it to improve."
date: "2026-02-18"
author: "FireChess Team"
tags: ["analysis", "fundamentals"]
---

If you've ever analyzed a chess game with an engine, you've seen evaluation numbers like +0.5 or -1.2. But what do they actually mean? And how can a simple number tell you how well you played?

The answer lies in **centipawn loss** — the most important metric in computer chess analysis.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="600" height="220" viewBox="0 0 600 220" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="220" rx="16" fill="#0f172a"/>
  <rect x="1" y="1" width="598" height="218" rx="15" stroke="white" stroke-opacity="0.06"/>
  <text x="300" y="32" text-anchor="middle" fill="white" font-size="14" font-weight="700">How Centipawn Loss Works</text>
  <!-- Position before -->
  <rect x="40" y="52" width="150" height="70" rx="10" fill="#10b981" fill-opacity="0.1" stroke="#10b981" stroke-opacity="0.3"/>
  <text x="115" y="75" text-anchor="middle" fill="#6ee7b7" font-size="11" font-weight="600">Position Before</text>
  <text x="115" y="100" text-anchor="middle" fill="#6ee7b7" font-size="22" font-weight="700">+0.50</text>
  <!-- Arrow -->
  <path d="M200 87 L245 87" stroke="#334155" stroke-width="2"/>
  <polygon points="245,82 255,87 245,92" fill="#334155"/>
  <text x="228" y="78" text-anchor="middle" fill="#94a3b8" font-size="9">Your</text>
  <text x="228" y="68" text-anchor="middle" fill="#94a3b8" font-size="9">Move</text>
  <!-- Position after -->
  <rect x="265" y="52" width="150" height="70" rx="10" fill="#f59e0b" fill-opacity="0.1" stroke="#f59e0b" stroke-opacity="0.3"/>
  <text x="340" y="75" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="600">Position After</text>
  <text x="340" y="100" text-anchor="middle" fill="#fbbf24" font-size="22" font-weight="700">+0.10</text>
  <!-- Equals -->
  <text x="440" y="92" text-anchor="middle" fill="#475569" font-size="22">=</text>
  <!-- CPL result -->
  <rect x="460" y="52" width="110" height="70" rx="10" fill="#ef4444" fill-opacity="0.12" stroke="#ef4444" stroke-opacity="0.3"/>
  <text x="515" y="75" text-anchor="middle" fill="#f87171" font-size="11" font-weight="600">CP Loss</text>
  <text x="515" y="100" text-anchor="middle" fill="#f87171" font-size="22" font-weight="700">40 cp</text>
  <!-- Bottom labels -->
  <text x="115" y="150" text-anchor="middle" fill="#94a3b8" font-size="10">Engine's best move</text>
  <text x="115" y="164" text-anchor="middle" fill="#94a3b8" font-size="10">would keep +0.50</text>
  <text x="340" y="150" text-anchor="middle" fill="#94a3b8" font-size="10">Your move dropped</text>
  <text x="340" y="164" text-anchor="middle" fill="#94a3b8" font-size="10">the eval to +0.10</text>
  <text x="515" y="150" text-anchor="middle" fill="#94a3b8" font-size="10">You lost 0.40 pawns</text>
  <text x="515" y="164" text-anchor="middle" fill="#94a3b8" font-size="10">of advantage</text>
  <!-- Scale bar -->
  <rect x="40" y="190" width="520" height="8" rx="4" fill="#1e293b"/>
  <rect x="40" y="190" width="130" height="8" rx="4" fill="#10b981"/>
  <rect x="170" y="190" width="130" height="8" rx="0" fill="#f59e0b"/>
  <rect x="300" y="190" width="130" height="8" rx="0" fill="#ef4444"/>
  <rect x="430" y="190" width="130" height="8" rx="4" fill="#7f1d1d"/>
  <text x="105" y="212" text-anchor="middle" fill="#6ee7b7" font-size="9">0-20 cp: Good</text>
  <text x="235" y="212" text-anchor="middle" fill="#fbbf24" font-size="9">20-50: Inaccuracy</text>
  <text x="365" y="212" text-anchor="middle" fill="#f87171" font-size="9">50-100: Mistake</text>
  <text x="495" y="212" text-anchor="middle" fill="#fca5a5" font-size="9">100+: Blunder</text>
</svg>
</div>

## Centipawns: The Universal Chess Currency

A **centipawn** (cp) is 1/100th of a pawn. When an engine says a position is "+50 cp," it means White has an advantage equivalent to half a pawn. When it says "-125 cp," Black is ahead by about 1.25 pawns.

This standardized unit lets us compare positions across completely different games and openings. Whether you're playing the Sicilian or the London System, a +50 cp advantage means roughly the same thing.

## What Is Centipawn Loss (CPL)?

**Centipawn loss** measures how much evaluation you lose with each move compared to the engine's top choice.

Here's how it works:

1. The engine evaluates the position before your move
2. You play your move
3. The engine evaluates the new position
4. The difference between the best possible evaluation and the actual evaluation after your move is your **centipawn loss** for that move

**Example:**

- Position evaluation before your move: +0.50 (White is slightly better)
- Engine's best move would maintain +0.50
- You play a different move, and the evaluation drops to +0.10
- Your centipawn loss: **40 cp** (you gave away 0.4 pawns of advantage)

## Average CPL: Your Accuracy Score

Your **average centipawn loss** (ACPL) across a game tells you how accurately you played overall. Lower is better:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="560" height="230" viewBox="0 0 560 230" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="560" height="230" rx="16" fill="#0f172a"/>
  <rect x="1" y="1" width="558" height="228" rx="15" stroke="white" stroke-opacity="0.06"/>
  <text x="280" y="30" text-anchor="middle" fill="white" font-size="13" font-weight="700">Average CPL by Playing Strength</text>
  <!-- Bars -->
  <rect x="40" y="50" width="60" height="24" rx="5" fill="#10b981" fill-opacity="0.35" stroke="#10b981" stroke-opacity="0.5"/>
  <text x="50" y="66" fill="#6ee7b7" font-size="10" font-weight="600">10-15</text>
  <text x="115" y="66" fill="#94a3b8" font-size="10">Super GM (2700+)</text>
  <rect x="40" y="80" width="95" height="24" rx="5" fill="#10b981" fill-opacity="0.25" stroke="#10b981" stroke-opacity="0.35"/>
  <text x="50" y="96" fill="#6ee7b7" font-size="10" font-weight="600">15-25</text>
  <text x="150" y="96" fill="#94a3b8" font-size="10">Grandmaster</text>
  <rect x="40" y="110" width="140" height="24" rx="5" fill="#06b6d4" fill-opacity="0.25" stroke="#06b6d4" stroke-opacity="0.35"/>
  <text x="50" y="126" fill="#67e8f9" font-size="10" font-weight="600">25-40</text>
  <text x="195" y="126" fill="#94a3b8" font-size="10">IM / FM</text>
  <rect x="40" y="140" width="200" height="24" rx="5" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-opacity="0.35"/>
  <text x="50" y="156" fill="#fbbf24" font-size="10" font-weight="600">40-60</text>
  <text x="255" y="156" fill="#94a3b8" font-size="10">Expert (1800-2100)</text>
  <rect x="40" y="170" width="290" height="24" rx="5" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-opacity="0.3"/>
  <text x="50" y="186" fill="#f87171" font-size="10" font-weight="600">60-90</text>
  <text x="345" y="186" fill="#94a3b8" font-size="10">Intermediate (1400-1800)</text>
  <rect x="40" y="200" width="400" height="24" rx="5" fill="#ef4444" fill-opacity="0.1" stroke="#ef4444" stroke-opacity="0.2"/>
  <text x="50" y="216" fill="#fca5a5" font-size="10" font-weight="600">90-150+</text>
  <text x="455" y="216" fill="#94a3b8" font-size="10">Beginner (&lt;1400)</text>
</svg>
</div>

| ACPL | Approximate Level |
|------|-------------------|
| 10-15 | Super Grandmaster |
| 15-25 | Grandmaster |
| 25-40 | International Master / FIDE Master |
| 40-60 | Expert (1800-2100) |
| 60-90 | Intermediate (1400-1800) |
| 90-150 | Beginner-Intermediate (1000-1400) |
| 150+ | Beginner |

These ranges are approximate and vary by position complexity, time control, and game length.

## Why CPL Matters for Improvement

### 1. It's Objective

Unlike subjective assessments ("I played okay"), CPL gives you a hard number. You either lost 20 centipawns or 80. There's no room for self-deception.

### 2. It Identifies Your Worst Moves

Sorting your moves by CPL instantly highlights your biggest mistakes. A move with 200+ cp loss is a blunder. A move with 50-100 cp loss is an inaccuracy. This prioritization tells you exactly where to focus your study.

### 3. It Tracks Progress Over Time

By monitoring your ACPL across games, you can see whether your accuracy is genuinely improving. A player whose ACPL drops from 65 to 45 over three months has made real, measurable progress — regardless of what happened to their rating.

### 4. It Reveals Game Phase Weaknesses

Breaking down CPL by game phase tells a powerful story:

- **High opening CPL** → you need better opening preparation
- **High middlegame CPL** → you need to work on tactical awareness and positional understanding
- **High endgame CPL** → you need endgame study

## The Limitations of CPL

CPL is powerful but not perfect. Be aware of these caveats:

### Position Complexity

In a sharp tactical position with one correct move and ten losing ones, even a good player might incur high CPL. In a quiet position where multiple moves are roughly equal, almost anyone can maintain low CPL. A single ACPL number doesn't account for how difficult the positions were.

### Forced Moves

If there's only one legal move (or one obvious recapture), low CPL on that move isn't an achievement. Some tools filter out forced moves to give a more accurate picture.

### Opening Book Moves

Moves made from memorized opening theory shouldn't count the same as over-the-board decisions. The best analysis tools let you set a move threshold (e.g., only analyze from move 8 onwards).

### Sample Size

One game isn't enough data. Your ACPL in a single game can swing wildly based on the specific positions that arose. You need at least 20-30 games for your average to be meaningful.

## How to Use CPL Effectively

### Track Your ACPL Monthly

Keep a simple log: analyze your games at the end of each week and note your average CPL. Look for trends. Are you improving? Stagnating? Getting worse in certain areas?

### Focus on High-CPL Moves

Don't try to study everything. Filter for moves where you lost 50+ centipawns and ask yourself:

- Did I miss a tactic?
- Did I misunderstand the position?
- Was I in time trouble?
- Is this a pattern I've seen before?

### Compare Game Phases

Run your games through an analyzer that breaks down CPL by opening, middlegame, and endgame. This tells you exactly which phase needs the most work.

### Set Realistic Targets

If your current ACPL is 75, don't aim for 25. Target a 10-15 point improvement over 2-3 months. Sustainable improvement is gradual.

## CPL in Practice

Here's a real example of how CPL analysis works:

You play 20 games in a week. Your analyzer reports:

- **Overall ACPL: 52** (solid intermediate play)
- **Opening ACPL: 38** (good preparation)
- **Middlegame ACPL: 48** (decent)  
- **Endgame ACPL: 71** (needs work)

The data is clear: your endgame is your weakest phase. You'd benefit most from studying basic endgame patterns — king and pawn endings, rook endings, and converting small advantages.

## Analyze Your CPL with FireChess

FireChess uses Stockfish 18 to analyze your games and calculates detailed centipawn loss metrics across every game phase. It runs entirely in your browser — your games and analysis stay private.

Upload your Lichess or Chess.com username, and get a breakdown of your accuracy, worst moves, and where to focus your improvement. The basic analysis is free.
