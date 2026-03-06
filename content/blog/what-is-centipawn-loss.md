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
<svg width="640" height="280" viewBox="0 0 640 280" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cp-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0c1220"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="cp-glow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="cp-green" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cp-red" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="280" rx="16" fill="url(#cp-bg)"/>
  <!-- background pawn watermark -->
  <text x="540" y="240" text-anchor="middle" fill="white" font-size="160" opacity="0.012">♟</text>
  <text x="320" y="36" text-anchor="middle" fill="white" font-size="16" font-weight="700" letter-spacing="1">HOW CENTIPAWN LOSS WORKS</text>
  <!-- Position Before card -->
  <circle cx="120" cy="120" r="70" fill="url(#cp-green)"/>
  <g filter="url(#cp-glow)">
    <rect x="50" y="70" width="140" height="100" rx="14" fill="#10b981" fill-opacity="0.06" stroke="#10b981" stroke-opacity="0.3" stroke-width="1.5"/>
  </g>
  <text x="120" y="100" text-anchor="middle" fill="#6ee7b7" font-size="14" font-weight="600">Best Engine Move</text>
  <text x="120" y="140" text-anchor="middle" fill="#6ee7b7" font-size="36" font-weight="700">+0.50</text>
  <text x="120" y="192" text-anchor="middle" fill="#64748b" font-size="13">Engine keeps the</text>
  <text x="120" y="210" text-anchor="middle" fill="#64748b" font-size="13">full advantage</text>
  <!-- Animated arrow -->
  <path d="M200 120 C240 120 260 120 295 120" stroke="#475569" stroke-width="2" stroke-dasharray="6 4">
    <animate attributeName="stroke-dashoffset" values="10;0" dur="1.5s" repeatCount="indefinite"/>
  </path>
  <text x="248" y="108" text-anchor="middle" fill="#94a3b8" font-size="14" font-weight="600">Your Move</text>
  <polygon points="293,115 305,120 293,125" fill="#475569"/>
  <!-- Position After card -->
  <rect x="310" y="70" width="140" height="100" rx="14" fill="#f59e0b" fill-opacity="0.06" stroke="#f59e0b" stroke-opacity="0.25" stroke-width="1.5"/>
  <text x="380" y="100" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="600">After Your Move</text>
  <text x="380" y="140" text-anchor="middle" fill="#fbbf24" font-size="36" font-weight="700">+0.10</text>
  <text x="380" y="192" text-anchor="middle" fill="#64748b" font-size="13">Dropped the eval</text>
  <text x="380" y="210" text-anchor="middle" fill="#64748b" font-size="13">by 40 centipawns</text>
  <!-- Equals -->
  <text x="470" y="128" text-anchor="middle" fill="#475569" font-size="28">=</text>
  <!-- CPL Result -->
  <circle cx="550" cy="120" r="65" fill="url(#cp-red)"/>
  <g filter="url(#cp-glow)">
    <rect x="490" y="70" width="120" height="100" rx="14" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.3" stroke-width="1.5"/>
  </g>
  <text x="550" y="98" text-anchor="middle" fill="#f87171" font-size="14" font-weight="600">Centipawn Loss</text>
  <text x="550" y="142" text-anchor="middle" fill="#f87171" font-size="40" font-weight="700">40</text>
  <text x="550" y="160" text-anchor="middle" fill="#f87171" font-size="14">centipawns</text>
  <!-- Scale bar -->
  <rect x="50" y="238" width="540" height="12" rx="6" fill="#1e293b"/>
  <rect x="50" y="238" width="135" height="12" rx="6" fill="#10b981" fill-opacity="0.5"/>
  <rect x="185" y="238" width="135" height="12" fill="#f59e0b" fill-opacity="0.4"/>
  <rect x="320" y="238" width="135" height="12" fill="#ef4444" fill-opacity="0.4"/>
  <rect x="455" y="238" width="135" height="12" rx="6" fill="#7f1d1d" fill-opacity="0.5"/>
  <text x="118" y="270" text-anchor="middle" fill="#6ee7b7" font-size="13">0–20: Good</text>
  <text x="252" y="270" text-anchor="middle" fill="#fbbf24" font-size="13">20–50: Inaccuracy</text>
  <text x="388" y="270" text-anchor="middle" fill="#f87171" font-size="13">50–100: Mistake</text>
  <text x="522" y="270" text-anchor="middle" fill="#fca5a5" font-size="13">100+: Blunder</text>
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
<svg width="600" height="320" viewBox="0 0 600 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acpl-bg" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="#0c1220"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="acpl-glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="600" height="320" rx="16" fill="url(#acpl-bg)"/>
  <!-- background chess king watermark -->
  <text x="520" y="280" text-anchor="middle" fill="white" font-size="140" opacity="0.012">♚</text>
  <text x="300" y="36" text-anchor="middle" fill="white" font-size="16" font-weight="700" letter-spacing="1">AVERAGE CPL BY PLAYING STRENGTH</text>
  <!-- Super GM -->
  <g filter="url(#acpl-glow)">
    <rect x="50" y="58" width="80" height="32" rx="8" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-opacity="0.4" stroke-width="1.5"/>
  </g>
  <text x="90" y="80" text-anchor="middle" fill="#6ee7b7" font-size="16" font-weight="700">10–15</text>
  <text x="148" y="80" fill="#94a3b8" font-size="15">Super GM (2700+)</text>
  <text x="550" y="80" fill="#6ee7b7" font-size="13">♚</text>
  <!-- GM -->
  <rect x="50" y="98" width="120" height="32" rx="8" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.25"/>
  <text x="110" y="120" text-anchor="middle" fill="#6ee7b7" font-size="16" font-weight="700">15–25</text>
  <text x="188" y="120" fill="#94a3b8" font-size="15">Grandmaster</text>
  <!-- IM/FM -->
  <rect x="50" y="138" width="180" height="32" rx="8" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.25"/>
  <text x="140" y="160" text-anchor="middle" fill="#67e8f9" font-size="16" font-weight="700">25–40</text>
  <text x="248" y="160" fill="#94a3b8" font-size="15">International Master / FM</text>
  <!-- Expert -->
  <rect x="50" y="178" width="260" height="32" rx="8" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.25"/>
  <text x="180" y="200" text-anchor="middle" fill="#fbbf24" font-size="16" font-weight="700">40–60</text>
  <text x="328" y="200" fill="#94a3b8" font-size="15">Expert (1800–2100)</text>
  <!-- Intermediate -->
  <rect x="50" y="218" width="370" height="32" rx="8" fill="#ef4444" fill-opacity="0.06" stroke="#ef4444" stroke-opacity="0.2"/>
  <text x="235" y="240" text-anchor="middle" fill="#f87171" font-size="16" font-weight="700">60–90</text>
  <text x="438" y="240" fill="#94a3b8" font-size="15">Intermediate (1400–1800)</text>
  <!-- Beginner -->
  <rect x="50" y="258" width="500" height="32" rx="8" fill="#ef4444" fill-opacity="0.04" stroke="#ef4444" stroke-opacity="0.12"/>
  <text x="300" y="280" text-anchor="middle" fill="#fca5a5" font-size="16" font-weight="700">90–150+</text>
  <text x="468" y="280" fill="#94a3b8" font-size="15">Beginner</text>
  <!-- decorative line -->
  <line x1="40" y1="304" x2="560" y2="304" stroke="white" stroke-opacity="0.04"/>
  <text x="300" y="316" text-anchor="middle" fill="#475569" font-size="12" font-style="italic">Lower ACPL = more accurate play. Track yours over time.</text>
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
