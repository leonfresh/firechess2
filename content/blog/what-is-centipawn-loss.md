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
<svg width="640" height="300" viewBox="0 0 640 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cpbg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#080c18"/><stop offset="1" stop-color="#0d1020"/>
    </linearGradient>
    <filter id="cpg"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="cpgl" cx="320" cy="130" r="200" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#f59e0b" stop-opacity="0.06"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="300" rx="18" fill="url(#cpbg)"/>
  <rect x="1" y="1" width="638" height="298" rx="17" stroke="white" stroke-opacity="0.04"/>
  <rect width="640" height="300" rx="18" fill="url(#cpgl)"/>
  <!-- Balance scale post -->
  <rect x="316" y="80" width="8" height="140" fill="#374151"/>
  <rect x="310" y="210" width="20" height="6" rx="3" fill="#4b5563"/>
  <rect x="300" y="214" width="40" height="5" rx="2" fill="#374151"/>
  <!-- Scale beam (tilted — right side heavier) -->
  <line x1="160" y1="88" x2="480" y2="78" stroke="#6b7280" stroke-width="4" stroke-linecap="round"/>
  <!-- Left pan chains -->
  <line x1="200" y1="90" x2="200" y2="130" stroke="#4b5563" stroke-width="1.5"/>
  <line x1="160" y1="88" x2="160" y2="128" stroke="#4b5563" stroke-width="1.5"/>
  <!-- Left pan plate -->
  <ellipse cx="180" cy="132" rx="40" ry="6" fill="#334155" stroke="#4b5563" stroke-width="1"/>
  <!-- White king on left pan (drawn) -->
  <g fill="#d1d5db" transform="translate(180, 100)">
    <rect x="-1.5" y="-22" width="3" height="8"/><rect x="-4" y="-19" width="8" height="3"/>
    <circle r="6" cy="-10"/><path d="M-5,-4 L-8,10 L8,10 L5,-4 Z"/><rect x="-9" y="10" width="18" height="4" rx="1.5"/>
  </g>
  <!-- Left label -->
  <text x="180" y="158" text-anchor="middle" fill="#6ee7b7" font-size="14" font-weight="600">Best Move</text>
  <text x="180" y="178" text-anchor="middle" fill="#6ee7b7" font-size="28" font-weight="700" filter="url(#cpg)">+0.50</text>
  <!-- Right pan chains -->
  <line x1="440" y1="80" x2="440" y2="120" stroke="#4b5563" stroke-width="1.5"/>
  <line x1="480" y1="78" x2="480" y2="118" stroke="#4b5563" stroke-width="1.5"/>
  <!-- Right pan plate (lower = heavier) -->
  <ellipse cx="460" cy="122" rx="40" ry="6" fill="#334155" stroke="#4b5563" stroke-width="1"/>
  <!-- Stack of centipawn coins on right pan -->
  <g transform="translate(460, 90)">
    <ellipse rx="14" ry="3" cy="20" fill="#b45309" stroke="#d97706" stroke-width="0.5"/>
    <ellipse rx="14" ry="3" cy="15" fill="#b45309" stroke="#d97706" stroke-width="0.5"/>
    <ellipse rx="14" ry="3" cy="10" fill="#d97706" stroke="#f59e0b" stroke-width="0.5"/>
    <ellipse rx="14" ry="3" cy="5" fill="#d97706" stroke="#f59e0b" stroke-width="0.5"/>
    <ellipse rx="14" ry="3" cy="0" fill="#f59e0b" stroke="#fbbf24" stroke-width="0.5"/>
    <text y="4" text-anchor="middle" fill="#451a03" font-size="7" font-weight="700">CP</text>
  </g>
  <!-- Right label -->
  <text x="460" y="148" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="600">Your Move</text>
  <text x="460" y="168" text-anchor="middle" fill="#fbbf24" font-size="28" font-weight="700">+0.10</text>
  <!-- Equals and result -->
  <text x="320" y="178" text-anchor="middle" fill="#475569" font-size="24">=</text>
  <!-- CPL result glow -->
  <g filter="url(#cpg)">
    <rect x="270" y="228" width="100" height="44" rx="12" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.3" stroke-width="1.5"/>
  </g>
  <text x="320" y="248" text-anchor="middle" fill="#f87171" font-size="13" font-weight="600">CPL</text>
  <text x="320" y="268" text-anchor="middle" fill="#f87171" font-size="22" font-weight="700">40</text>
  <!-- Scale bar at bottom -->
  <rect x="50" y="284" width="540" height="8" rx="4" fill="#1e293b"/>
  <rect x="50" y="284" width="135" height="8" rx="4" fill="#10b981" fill-opacity="0.4"/>
  <rect x="185" y="284" width="135" height="8" fill="#f59e0b" fill-opacity="0.35"/>
  <rect x="320" y="284" width="135" height="8" fill="#ef4444" fill-opacity="0.35"/>
  <rect x="455" y="284" width="135" height="8" rx="4" fill="#7f1d1d" fill-opacity="0.4"/>
  <!-- Particles -->
  <circle cx="80" cy="50" r="1" fill="#10b981" opacity="0.1"><animate attributeName="opacity" values="0.1;0.03;0.1" dur="3s" repeatCount="indefinite"/></circle>
  <circle cx="570" cy="40" r="1.5" fill="#f59e0b" opacity="0.08"><animate attributeName="opacity" values="0.08;0.02;0.08" dur="4s" repeatCount="indefinite"/></circle>
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
<svg width="600" height="300" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acbg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#080c18"/><stop offset="1" stop-color="#0d1020"/>
    </linearGradient>
    <filter id="acg"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="acgl" cx="0.5" cy="0.8" r="0.5">
      <stop offset="0" stop-color="#fbbf24" stop-opacity="0.15"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="300" rx="16" fill="url(#acbg)"/>
  <rect x="1" y="1" width="598" height="298" rx="15" stroke="white" stroke-opacity="0.04"/>
  <!-- Ground -->
  <rect x="0" y="235" width="600" height="65" fill="#111827" opacity="0.5"/>
  <line x1="0" y1="235" x2="600" y2="235" stroke="#1f2937"/>
  <!-- Title -->
  <text x="300" y="30" text-anchor="middle" fill="white" font-size="15" font-weight="700" letter-spacing="0.5">AVERAGE CPL BY PLAYING STRENGTH</text>
  <!-- 6 kings growing from left (small/dim beginner) to right (tall/bright GM) -->
  <!-- Beginner — tiny dim king -->
  <g transform="translate(65, 0)" opacity="0.35">
    <rect x="-10" y="225" width="20" height="10" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <g fill="#f87171" transform="translate(0, 210) scale(0.55)">
      <rect x="-1.5" y="-22" width="3" height="8"/><rect x="-4" y="-19" width="8" height="3"/>
      <circle r="6" cy="-10"/><path d="M-5,-4 L-8,10 L8,10 L5,-4 Z"/><rect x="-9" y="10" width="18" height="4" rx="1.5"/>
    </g>
    <text y="252" text-anchor="middle" fill="#f87171" font-size="12" font-weight="700">90–150+</text>
    <text y="268" text-anchor="middle" fill="#64748b" font-size="10">Beginner</text>
  </g>
  <!-- Intermediate — small king -->
  <g transform="translate(160, 0)" opacity="0.5">
    <rect x="-12" y="222" width="24" height="12" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <g fill="#f87171" transform="translate(0, 198) scale(0.7)">
      <rect x="-1.5" y="-22" width="3" height="8"/><rect x="-4" y="-19" width="8" height="3"/>
      <circle r="6" cy="-10"/><path d="M-5,-4 L-8,10 L8,10 L5,-4 Z"/><rect x="-9" y="10" width="18" height="4" rx="1.5"/>
    </g>
    <text y="252" text-anchor="middle" fill="#f87171" font-size="12" font-weight="700">60–90</text>
    <text y="268" text-anchor="middle" fill="#64748b" font-size="10">Intermediate</text>
  </g>
  <!-- Expert — medium king -->
  <g transform="translate(255, 0)" opacity="0.65">
    <rect x="-13" y="218" width="26" height="14" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <g fill="#fbbf24" transform="translate(0, 185) scale(0.85)">
      <rect x="-1.5" y="-22" width="3" height="8"/><rect x="-4" y="-19" width="8" height="3"/>
      <circle r="6" cy="-10"/><path d="M-5,-4 L-8,10 L8,10 L5,-4 Z"/><rect x="-9" y="10" width="18" height="4" rx="1.5"/>
    </g>
    <text y="252" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700">40–60</text>
    <text y="268" text-anchor="middle" fill="#64748b" font-size="10">Expert</text>
  </g>
  <!-- IM/FM — taller king -->
  <g transform="translate(350, 0)" opacity="0.8">
    <rect x="-14" y="214" width="28" height="15" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <g fill="#67e8f9" transform="translate(0, 170) scale(1.0)">
      <rect x="-1.5" y="-22" width="3" height="8"/><rect x="-4" y="-19" width="8" height="3"/>
      <circle r="6" cy="-10"/><path d="M-5,-4 L-8,10 L8,10 L5,-4 Z"/><rect x="-9" y="10" width="18" height="4" rx="1.5"/>
    </g>
    <text y="252" text-anchor="middle" fill="#67e8f9" font-size="12" font-weight="700">25–40</text>
    <text y="268" text-anchor="middle" fill="#64748b" font-size="10">IM / FM</text>
  </g>
  <!-- GM — tall king with glow -->
  <g transform="translate(445, 0)" opacity="0.9">
    <rect x="-14" y="210" width="28" height="16" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <g fill="#6ee7b7" transform="translate(0, 152) scale(1.15)">
      <rect x="-1.5" y="-22" width="3" height="8"/><rect x="-4" y="-19" width="8" height="3"/>
      <circle r="6" cy="-10"/><path d="M-5,-4 L-8,10 L8,10 L5,-4 Z"/><rect x="-9" y="10" width="18" height="4" rx="1.5"/>
    </g>
    <text y="252" text-anchor="middle" fill="#6ee7b7" font-size="12" font-weight="700">15–25</text>
    <text y="268" text-anchor="middle" fill="#64748b" font-size="10">Grandmaster</text>
  </g>
  <!-- Super GM — tallest king, bright glow -->
  <g transform="translate(540, 0)">
    <rect x="-15" y="205" width="30" height="18" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <circle cy="140" r="40" fill="url(#acgl)"/>
    <g fill="#fbbf24" transform="translate(0, 130) scale(1.35)" filter="url(#acg)">
      <rect x="-1.5" y="-22" width="3" height="8"/><rect x="-4" y="-19" width="8" height="3"/>
      <circle r="6" cy="-10"/><path d="M-5,-4 L-8,10 L8,10 L5,-4 Z"/><rect x="-9" y="10" width="18" height="4" rx="1.5"/>
    </g>
    <text y="252" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700">10–15</text>
    <text y="268" text-anchor="middle" fill="#64748b" font-size="10">Super GM</text>
  </g>
  <!-- Rising accuracy arrow -->
  <path d="M65 200 C200 195 400 170 540 120" stroke="#334155" stroke-width="1.5" fill="none" stroke-dasharray="4 3" opacity="0.3">
    <animate attributeName="stroke-dashoffset" from="14" to="0" dur="3s" repeatCount="indefinite"/>
  </path>
  <text x="300" y="287" text-anchor="middle" fill="#3f3f46" font-size="11" font-style="italic">Lower ACPL = more accurate play</text>
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
