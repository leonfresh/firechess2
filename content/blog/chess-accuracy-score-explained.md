---
title: "Chess Accuracy Score Explained: What 90%+ Actually Means"
description: "What does your chess accuracy score actually mean? How it's calculated, what 90%+ really tells you, and why accuracy differs from centipawn loss."
date: "2026-07-25"
author: "FireChess Team"
tags: ["analysis", "fundamentals", "centipawn-loss"]
---

You finish a game and the accuracy report says 94.2%. Is that good? Great? And why does your opponent show 91.7% when they lost?

Accuracy scores are one of the most misunderstood metrics in chess. Let's unpack exactly what they mean — and what they don't.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="300" viewBox="0 0 680 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acBg" x1="0" y1="0" x2="680" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
    <radialGradient id="acG1" cx="200" cy="100" r="200" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6366f1" stop-opacity="0.07"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="acG2" cx="500" cy="200" r="180" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#10b981" stop-opacity="0.07"/><stop offset="1" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <filter id="acGlow">
      <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="680" height="300" rx="18" fill="url(#acBg)"/>
  <rect x="1" y="1" width="678" height="298" rx="17" stroke="white" stroke-opacity="0.05"/>
  <rect width="680" height="300" rx="18" fill="url(#acG1)"/>
  <rect width="680" height="300" rx="18" fill="url(#acG2)"/>
  <!-- Title -->
  <text x="340" y="38" text-anchor="middle" fill="white" font-size="18" font-weight="700" letter-spacing="0.3" font-family="system-ui">Accuracy Score Breakdown</text>
  <!-- Accuracy gauge arc (left panel) -->
  <g transform="translate(170, 160)">
    <!-- Background arc -->
    <path d="M -90 0 A 90 90 0 0 1 90 0" stroke="#1e293b" stroke-width="16" fill="none" stroke-linecap="round"/>
    <!-- Colored arc: 94.2% -->
    <path d="M -90 0 A 90 90 0 0 1 75 -49" stroke="url(#acArcGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
    <defs>
      <linearGradient id="acArcGrad" x1="-90" y1="0" x2="90" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ef4444"/><stop offset="0.5" stop-color="#f59e0b"/><stop offset="1" stop-color="#10b981"/>
      </linearGradient>
    </defs>
    <!-- Needle -->
    <line x1="0" y1="0" x2="72" y2="-47" stroke="#6366f1" stroke-width="3" stroke-linecap="round" filter="url(#acGlow)"/>
    <circle r="7" fill="#6366f1" filter="url(#acGlow)"/>
    <!-- Score text -->
    <text y="30" text-anchor="middle" fill="white" font-size="32" font-weight="800" font-family="system-ui" filter="url(#acGlow)">94.2%</text>
    <text y="50" text-anchor="middle" fill="#a5b4fc" font-size="13" font-family="system-ui">Accuracy</text>
    <!-- Scale labels -->
    <text x="-96" y="16" fill="#ef4444" font-size="11" text-anchor="middle" font-family="system-ui">0</text>
    <text x="0" y="-98" fill="#f59e0b" font-size="11" text-anchor="middle" font-family="system-ui">50</text>
    <text x="96" y="16" fill="#10b981" font-size="11" text-anchor="middle" font-family="system-ui">100</text>
  </g>
  <!-- Rating brackets (right panel) -->
  <g transform="translate(420, 60)">
    <text fill="#94a3b8" font-size="12" font-weight="600" font-family="system-ui" letter-spacing="0.3">TYPICAL ACCURACY BY RATING</text>
    <!-- Rows -->
    <g transform="translate(0, 24)">
      <rect width="200" height="28" rx="6" fill="#1e293b" fill-opacity="0.6"/>
      <text x="10" y="18" fill="#94a3b8" font-size="12" font-family="system-ui">1000–1200</text>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#334155"/>
      <rect x="110" y="8" width="30" height="10" rx="4" fill="#ef4444" fill-opacity="0.7"/>
      <text x="168" y="18" fill="#ef4444" font-size="12" font-family="system-ui">~72%</text>
    </g>
    <g transform="translate(0, 60)">
      <rect width="200" height="28" rx="6" fill="#1e293b" fill-opacity="0.6"/>
      <text x="10" y="18" fill="#94a3b8" font-size="12" font-family="system-ui">1200–1600</text>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#334155"/>
      <rect x="110" y="8" width="37" height="10" rx="4" fill="#f59e0b" fill-opacity="0.7"/>
      <text x="168" y="18" fill="#f59e0b" font-size="12" font-family="system-ui">~80%</text>
    </g>
    <g transform="translate(0, 96)">
      <rect width="200" height="28" rx="6" fill="#1e293b" fill-opacity="0.6"/>
      <text x="10" y="18" fill="#94a3b8" font-size="12" font-family="system-ui">1600–2000</text>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#334155"/>
      <rect x="110" y="8" width="42" height="10" rx="4" fill="#22d3ee" fill-opacity="0.7"/>
      <text x="168" y="18" fill="#22d3ee" font-size="12" font-family="system-ui">~87%</text>
    </g>
    <g transform="translate(0, 132)">
      <rect width="200" height="28" rx="6" fill="#1e293b" fill-opacity="0.6"/>
      <text x="10" y="18" fill="#94a3b8" font-size="12" font-family="system-ui">2000–2400</text>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#334155"/>
      <rect x="110" y="8" width="47" height="10" rx="4" fill="#10b981" fill-opacity="0.7"/>
      <text x="168" y="18" fill="#10b981" font-size="12" font-family="system-ui">~93%</text>
    </g>
    <g transform="translate(0, 168)">
      <rect width="200" height="28" rx="6" fill="#1e293b" fill-opacity="0.6"/>
      <text x="10" y="18" fill="#94a3b8" font-size="12" font-family="system-ui">2400+ (GM)</text>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#334155"/>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#6366f1" fill-opacity="0.9" filter="url(#acGlow)"/>
      <text x="168" y="18" fill="#a5b4fc" font-size="12" font-family="system-ui">~97%</text>
    </g>
  </g>
</svg>
</div>

## How Accuracy Is Calculated

Chess accuracy scores — whether from Lichess, Chess.com, or FireChess — are all built on the same concept: **[centipawn loss](/blog/what-is-centipawn-loss)**.

Here's the formula in plain English:

1. For every move you played, an engine evaluates the position before and after.
2. It compares your move to the best possible move the engine found.
3. The difference in evaluation (measured in centipawns) is your "loss" for that move.
4. Your accuracy is a function of how small your average loss was across all moves.

The exact formula varies by platform. Chess.com uses a conversion function that maps average centipawn loss to a percentage from 0–100. Lichess uses a similar approach. FireChess uses the raw centipawn loss per-move, grouped into classifications (brilliant, best, excellent, good, inaccuracy, mistake, blunder).

To understand accuracy, you first need to understand the raw number it comes from. If you're not already familiar with the concept, read our complete guide: [What Is Centipawn Loss?](/blog/what-is-centipawn-loss) — it covers how Stockfish calculates evaluations and what those numbers actually mean in practical terms.

## Why You Can Lose With 94% Accuracy

This is the biggest source of confusion. Accuracy measures **how closely you followed the engine's recommendation** — not whether you won.

Imagine this scenario: Your opponent played a slightly inaccurate opening move early in the game. You didn't punish it optimally, but you also didn't blunder anything obvious. You both played at 90%+ accuracy. But because your opponent's inaccuracy created a strategically disadvantaged position for them, they lost the endgame despite their high accuracy score.

Accuracy tells you how well you played *given the positions that arose*. It doesn't tell you:
- Whether the positions were objectively equal or unequal
- Whether your opponent created pressure that forced you into passive play
- Whether an opening blunder from move 4 put you in a losing position early

**A 95% accurate loss often means you played well but started from a worse position.** A 75% accurate win often means your opponent blundered more than you did.

This is also why **average centipawn loss** and accuracy % tell different stories. Two players might both score 92% accuracy, but one had a steady 20 cp average across all moves while the other had many 0 cp moves punctuated by a single 80 cp mistake. The accuracy % looks the same, but the centipawn loss profile is completely different. For more on this distinction, see [how centipawn loss is calculated](/blog/what-is-centipawn-loss#how-acpl-is-calculated).

## What "Brilliant" Accuracy Actually Looks Like

Most players fixate on the top of the scale. So what does 99%+ accuracy look like?

It's essentially impossible to sustain across an entire game. Even world-class engines playing at the same level register a few percent accuracy loss over 50+ moves. A 99% accurate game usually means:
- The game was extremely short
- Most of the "moves" were forced captures or recaptures with no real decision
- One player was winning so easily that every "alternative" was catastrophic, making every move count as optimal

For real improvement, track **average accuracy across 20+ games**, not a single-game spike.

## Accuracy vs. Centipawn Loss — the Deeper Difference

A common question is: "If accuracy comes from centipawn loss, why look at both?" The short answer is that **accuracy is a processed metric** while **centipawn loss is raw data** — and each serves a different purpose.

### What Centipawn Loss Measures

[Centipawn loss](/blog/what-is-centipawn-loss) is the absolute difference in evaluation (in hundredths of a pawn) between your chosen move and the engine's best move. If Stockfish says the best move gives +1.00 and your move gives +0.40, your centipawn loss for that move is 60. Straightforward.

Average centipawn loss (ACPL) is the mean of these per-move differences across the entire game. It's a direct, unprocessed number. There's no scaling, no clamping, no curve — it simply tells you, on average, how far from optimal your play was.

### What Accuracy % Measures

Accuracy % takes that raw centipawn loss data and runs it through a **non-linear conversion function**. The purpose of this conversion is to make the metric more intuitive: a 0–100 scale that humans can immediately grasp.

But here's the critical detail: **accuracy % is not proportional to centipawn loss**.

### The Non-Linear Relationship

The relationship between your average centipawn loss and your accuracy % follows a curve — small losses at the top of the scale punish you much harder than large losses at the bottom. This has real practical implications:

| Average Centipawn Loss | Approximate Accuracy % | What This Means |
|---|---|---|
| 0 cp | 99.9%+ | Perfect engine play — essentially unreachable for humans |
| 10 cp | ~93% | A very strong club game, most moves were excellent or best |
| 25 cp | ~82% | A decent game with a few noticeable imperfections |
| 50 cp | ~68% | Several inaccuracies or one moderate mistake |
| 100 cp | 50% | Clear mistakes; likely a blunder or two |
| 200 cp | ~32% | Multiple blunders, or one catastrophic error |
| 500 cp | ~15% | The engine barely recognises the game as chess |

The jump from 10 cp to 25 cp (just 15 extra centipawns on average) drops your accuracy from ~93% to ~82% — an 11-point hit. But the jump from 100 cp to 200 cp (100 extra centipawns) drops you from 50% to 32% — only 18 points for more than 6× the centipawn increase.

**Why this matters:** A single 70 cp mistake in an otherwise clean game (say, 15 moves at 5 cp each) gives you an average of ~9 cp, which maps to ~93% accuracy. The same 70 cp mistake in a messy game (15 moves averaging 30 cp) gives you an average of ~33 cp, which maps to ~78%. The mistake cost you identically in engine terms, but its impact on the accuracy % depends entirely on the quality of the rest of your game.

The chart below visualises this directly:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="360" viewBox="0 0 680 360" fill="none" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <defs>
    <linearGradient id="abBg" x1="0" y1="0" x2="680" y2="360" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
    <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#6366f1"/><stop offset="0.5" stop-color="#a78bfa"/><stop offset="1" stop-color="#c4b5fd"/>
    </linearGradient>
    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6366f1" stop-opacity="0.2"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
    </linearGradient>
    <filter id="curveGlow">
      <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="680" height="360" rx="18" fill="url(#abBg)"/>
  <rect x="1" y="1" width="678" height="358" rx="17" stroke="white" stroke-opacity="0.05"/>
  <!-- Title -->
  <text x="340" y="32" text-anchor="middle" fill="white" font-size="16" font-weight="700" letter-spacing="0.3">Accuracy % vs. Average Centipawn Loss (Non-Linear Relationship)</text>
  <!-- Plot area: left=70, right=30, top=55, bottom=55 → width=580, height=250 -->
  <!-- Grid lines (horizontal) -->
  <g stroke="#1e293b" stroke-width="1" stroke-dasharray="4 3">
    <line x1="70" y1="55" x2="650" y2="55"/>
    <line x1="70" y1="117.5" x2="650" y2="117.5"/>
    <line x1="70" y1="180" x2="650" y2="180"/>
    <line x1="70" y1="242.5" x2="650" y2="242.5"/>
    <line x1="70" y1="305" x2="650" y2="305"/>
  </g>
  <!-- Y-axis labels -->
  <text x="60" y="59" text-anchor="end" fill="#64748b" font-size="11">100%</text>
  <text x="60" y="121.5" text-anchor="end" fill="#64748b" font-size="11">75%</text>
  <text x="60" y="184" text-anchor="end" fill="#64748b" font-size="11">50%</text>
  <text x="60" y="246.5" text-anchor="end" fill="#64748b" font-size="11">25%</text>
  <text x="60" y="309" text-anchor="end" fill="#64748b" font-size="11">0%</text>
  <!-- Grid lines (vertical) -->
  <g stroke="#1e293b" stroke-width="1" stroke-dasharray="4 3">
    <line x1="70" y1="55" x2="70" y2="305"/>
    <line x1="186" y1="55" x2="186" y2="305"/>
    <line x1="302" y1="55" x2="302" y2="305"/>
    <line x1="418" y1="55" x2="418" y2="305"/>
    <line x1="534" y1="55" x2="534" y2="305"/>
    <line x1="650" y1="55" x2="650" y2="305"/>
  </g>
  <!-- X-axis labels -->
  <text x="70" y="322" text-anchor="middle" fill="#64748b" font-size="11">0</text>
  <text x="186" y="322" text-anchor="middle" fill="#64748b" font-size="11">100</text>
  <text x="302" y="322" text-anchor="middle" fill="#64748b" font-size="11">200</text>
  <text x="418" y="322" text-anchor="middle" fill="#64748b" font-size="11">300</text>
  <text x="534" y="322" text-anchor="middle" fill="#64748b" font-size="11">400</text>
  <text x="650" y="322" text-anchor="middle" fill="#64748b" font-size="11">500</text>
  <!-- Axis titles -->
  <text x="360" y="350" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="0.3">Average Centipawn Loss (cp)</text>
  <text x="18" y="180" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="0.3" transform="rotate(-90, 18, 180)">Accuracy %</text>
  <!-- Fill under curve -->
  <path d="M70 55 L 76 65.2 L 82 81.6 L 88 97.5 L 94 112.5 L 100 126.6 L 106 139.7 L 112 151.9 L 118 163.2 L 124 173.7 L 130 183.5 L 136 192.5 L 142 200.9 L 148 208.6 L 154 215.8 L 160 222.5 L 166 228.7 L 172 234.5 L 178 239.8 L 184 244.8 L 190 249.4 L 196 253.7 L 202 257.7 L 208 261.4 L 214 264.8 L 220 268.0 L 226 270.9 L 232 273.7 L 238 276.2 L 244 278.6 L 250 280.8 L 256 282.8 L 262 284.7 L 268 286.5 L 274 288.2 L 280 289.8 L 286 291.3 L 292 292.7 L 298 294.0 L 304 295.2 L 310 296.3 L 316 297.4 L 322 298.4 L 328 299.4 L 334 300.3 L 340 301.2 L 346 302.0 L 352 302.8 L 358 303.5 L 364 304.2 L 370 304.9 L 376 305.5 L 382 306.1 L 388 306.7 L 394 307.2 L 400 307.7 L 406 308.2 L 412 308.7 L 418 309.1 L 424 309.5 L 430 309.9 L 436 310.3 L 442 310.7 L 448 311.1 L 454 311.4 L 460 311.8 L 466 312.1 L 472 312.4 L 478 312.7 L 484 313.0 L 490 313.3 L 496 313.5 L 502 313.8 L 508 314.1 L 514 314.3 L 520 314.5 L 526 314.8 L 532 315.0 L 538 315.2 L 544 315.4 L 550 315.6 L 556 315.8 L 562 316.0 L 568 316.2 L 574 316.4 L 580 316.6 L 586 316.8 L 592 317.0 L 598 317.1 L 604 317.3 L 610 317.5 L 616 317.6 L 622 317.8 L 628 317.9 L 634 318.1 L 640 318.2 L 646 318.3 L 650 318.5 Z" fill="url(#fillGrad)"/>
  <!-- Curve -- computed polyline from accuracy = 100 / (1 + (cpLoss/100)^1.1) -->
  <!-- x = 70 + cpLoss * 1.16, y = 305 - accuracy * 2.5 -->
  <polyline points="70,55 76,65.2 82,81.6 88,97.5 94,112.5 100,126.6 106,139.7 112,151.9 118,163.2 124,173.7 130,183.5 136,192.5 142,200.9 148,208.6 154,215.8 160,222.5 166,228.7 172,234.5 178,239.8 184,244.8 190,249.4 196,253.7 202,257.7 208,261.4 214,264.8 220,268.0 226,270.9 232,273.7 238,276.2 244,278.6 250,280.8 256,282.8 262,284.7 268,286.5 274,288.2 280,289.8 286,291.3 292,292.7 298,294.0 304,295.2 310,296.3 316,297.4 322,298.4 328,299.4 334,300.3 340,301.2 346,302.0 352,302.8 358,303.5 364,304.2 370,304.9 376,305.5 382,306.1 388,306.7 394,307.2 400,307.7 406,308.2 412,308.7 418,309.1 424,309.5 430,309.9 436,310.3 442,310.7 448,311.1 454,311.4 460,311.8 466,312.1 472,312.4 478,312.7 484,313.0 490,313.3 496,313.5 502,313.8 508,314.1 514,314.3 520,314.5 526,314.8 532,315.0 538,315.2 544,315.4 550,315.6 556,315.8 562,316.0 568,316.2 574,316.4 580,316.6 586,316.8 592,317.0 598,317.1 604,317.3 610,317.5 616,317.6 622,317.8 628,317.9 634,318.1 640,318.2 646,318.3 650,318.5" stroke="url(#curveGrad)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#curveGlow)"/>
  <!-- Highlighted data point markers -->
  <g>
    <!-- 10 cp / 92.6% -->
    <circle cx="81.6" cy="73.5" r="5" fill="#10b981" stroke="#080d1a" stroke-width="2"/>
    <text x="81.6" y="64" text-anchor="middle" fill="#10b981" font-size="9">10 cp → 93%</text>
    <!-- 50 cp / 68.2% -->
    <circle cx="128" cy="134.5" r="5" fill="#f59e0b" stroke="#080d1a" stroke-width="2"/>
    <text x="128" y="148" text-anchor="middle" fill="#f59e0b" font-size="9">50 cp → 68%</text>
    <!-- 100 cp / 50.0% -->
    <circle cx="186" cy="180" r="5" fill="#f97316" stroke="#080d1a" stroke-width="2"/>
    <text x="186" y="194" text-anchor="middle" fill="#f97316" font-size="9">100 cp → 50%</text>
    <!-- 200 cp / 31.8% -->
    <circle cx="302" cy="225.5" r="5" fill="#ef4444" stroke="#080d1a" stroke-width="2"/>
    <text x="302" y="240" text-anchor="middle" fill="#ef4444" font-size="9">200 cp → 32%</text>
  </g>
  <!-- Zone annotations -->
  <g transform="translate(70, 55)">
    <rect x="0" y="-2" width="58" height="250" fill="#10b981" fill-opacity="0.06" rx="2"/>
    <text x="29" y="130" text-anchor="middle" fill="#10b981" fill-opacity="0.5" font-size="10" transform="rotate(-90, 29, 130)">GM RANGE</text>
  </g>
  <g transform="translate(186, 55)">
    <rect x="0" y="-2" width="116" height="250" fill="#f59e0b" fill-opacity="0.06" rx="2"/>
    <text x="58" y="130" text-anchor="middle" fill="#f59e0b" fill-opacity="0.5" font-size="10" transform="rotate(-90, 58, 130)">CLUB RANGE</text>
  </g>
  <g transform="translate(302, 55)">
    <rect x="0" y="-2" width="348" height="250" fill="#ef4444" fill-opacity="0.06" rx="2"/>
    <text x="174" y="130" text-anchor="middle" fill="#ef4444" fill-opacity="0.5" font-size="10" transform="rotate(-90, 174, 130)">LARGE LOSS RANGE</text>
  </g>
</svg>
</div>

Key takeaway: **accuracy % is compressed at the top and stretched at the bottom.** A 20-cp improvement from 100 cp to 80 cp moves your accuracy from 50% to 57% — modest. But the same 20-cp improvement from 20 cp to 0 cp moves your accuracy from 86% to 100% — nearly three times the impact. The engine punishes every tiny deviation from perfect play disproportionately. This is one reason why grandmasters obsess over seemingly "small" improvements in their play: shaving 5 cp off your average is much harder at the top, and the accuracy reward is much steeper.

## A Concrete Example: One Move That Changes Everything

Let's make this real with a specific position from the **Two Knights Defense**, a sharp opening where a single decision can swing the evaluation by several pawns.

### The Position

> **FEN:** `r1bqkb1r/ppp2ppp/2n5/3Pp3/2B5/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 5`

This arises after: **1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5**

```
      White to move? No — it's Black's turn.
      ┌─ Position after 5.exd5 ──────────────────────┐
      │  r . b q k b . r                              │
      │  p p p . . p p p                              │
      │  . . n . . . . .                              │
      │  . . . P p . . .                              │
      │  . . B . . . . .                              │
      │  . . . . . N . .                              │
      │  P P P P . P P P                              │
      │  R N B Q K . . R                              │
      │  Black to move                                 │
      └──────────────────────────────────────────────┘
```

Black faces a critical decision. The *correct* continuation is **Na5** — attacking White's light-squared bishop before it can inflict damage. The *blunder* is **Nxd5?**, which seems natural (recapturing the pawn and centralising the knight) but falls into the infamous **Fried Liver Attack**.

### The Two Paths

| Path | Move | Eval After | Centipawn Loss | Accuracy Impact |
|---|---|---|---|---|
| Engine best | **Na5** attacking the bishop | ~+0.9 (White slightly better — Black has compensation with the misplaced knight) | 0 cp | ~95%+ for this move |
| Natural blunder | **Nxd5?** recapturing | ~+3.5 (White is winning — **7.Nxf7!** follows) | 260 cp | ~25% for this move |
| Solid alternative | **b5** (Ulvestad variation) | ~+0.8 (playable, sharp) | ~10 cp | ~90% |

The brutal reality: **Nxd5?** looks like a normal developing move. You capture the pawn, centralise your knight, stay active. But Stockfish's evaluation screams that you've just made a 260-centipawn mistake — enough to drop your game accuracy from a potential 92% to something like 65% in a single move.

### Before and After: The Evaluation Swing

**Before Black's move (position after 5.exd5):** The evaluation is approximately **+0.3** in White's favour — a slight advantage from having an extra pawn (even though it's a temporary sacrifice). The position is still in the realm of normal chess.

**After Nxd5? (Black's mistake):** White plays **7.Nxf7!** — the Fried Liver sacrifice. After Kxf7 Qf3+ Ke6, White has only one piece for the sacrificed knight, but the attack is overwhelming. The evaluation jumps to **+3.5+**. Black's king is in the centre, exposed, and White has Qf3 threatening mate, Nc3 attacking the pinned knight, and all of White's pieces ready to join the attack.

**After Na5 (correct):** White's evaluation is +0.9 — White has a stable advantage, but Black has reasonable play. The accuracy difference between the two continuations is enormous.

This illustrates a crucial truth about accuracy scoring: **the engine judges the move itself, not your intention.** A "natural" move that looks good to a human can be a 260-cp catastrophe to Stockfish. Your accuracy % will reflect the engine's judgment, capturing exactly how far your chosen path strayed from the optimal one.

> This position and the Fried Liver line are discussed further in our guide to [centipawn loss in tactical sequences](/blog/what-is-centipawn-loss#centipawn-loss-in-tactical-sequences).

## Position Deep Dive: Accuracy in Action

Theory is one thing — let's see how accuracy plays out in real positions. Below are three positions that show exactly how centipawn loss translates to accuracy, and why the engine's judgment often diverges from human intuition.

### Position 1: The99% Move vs. the 70% Move

<chess-position
  fen="r1bq1r2/ppp2kpp/2n5/3np3/2B5/5N2/PPPP1PPP/RNBQK2R w KQ - 0 7"
  caption="White to move — both Nxe5+ and Qf3+ win the piece back, but the engine sees a 1.5-pawn difference between them."
  orientation="white"
 arrows="b1c3:green,f3e5:red" badge="best"></chess-position>

This position arises in the Fried Liver Attack after **1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5 6.Nxf7 Kxf7**. White sacrificed a piece on f7 and now needs to recapture. Two moves both win — but the engine strongly prefers one.

| Move | Eval After | Centipawn Loss | Per-Move Accuracy | What Happens |
|---|---|---|---|---|
| **Nxe5+** (engine best) | **+4.0** — White is winning | 0 cp | **~99%** | Wins the piece cleanly. After 7...Kd6 8.Qf3+ Ke6 9.Nxc6, White has an extra piece with a crushing position. |
| **Qf3+** (tempting alternative) | **+2.5** — White is still winning | ~150 cp | **~70%** | Also wins the piece, but Black gets a more coordinated position after 7...Ke6 8.Nxc6 Nxc6, and White's advantage is less dominant. |

Both moves lead to a winning position. But the150-centipawn gap between them reflects a real strategic difference: **Nxe5+** recovers the piece immediately with a forcing check, maintaining full control. **Qf3+** delays the recapture, giving Black time to consolidate.

The per-move accuracy captures this precisely: ~99% for Nxe5+ means the engine considers it essentially the only good move. ~70% for Qf3+ means a significant chunk of the position's potential was left on the table. That gap — 29 percentage points — is entirely about *how well* you converted, not *whether* you converted.

### Position 2: The Inaccuracy That Still Wins

<chess-position
  fen="8/5k2/8/2pPP3/2P5/2K5/6R1/2r5 w - - 0 1"
  caption="White to move — both Rg7+ and Kd6 win, but one maximises accuracy while the other invites unnecessary risk."
  orientation="white"
 arrows="c3b3:green,c3d3:red" badge="best"></chess-position>

White has a dominant rook endgame: connected passed pawns on the 5th rank, an active rook, and Black's rook stuck defending passively. Two moves both win — but the accuracy difference is telling.

| Move | Eval After | Centipawn Loss | Game Accuracy Impact | What Happens |
|---|---|---|---|---|
| **Rg7+** (engine best) | **+9.0** — completely winning | 0 cp | **~92%** | Takes the7th rank with check. After 1...Kf8 2.Rf7+ Rxf7 3.exf7, the d-pawn promotes while the e-pawn supports it. |
| **Kd6** (reasonable alternative) | **+5.5** — still winning | ~350 cp | **~82%** | Also wins, but Black gets more defensive resources. The conversion takes longer and requires more precise follow-up. |

Kd6 is not a blunder — it's still clearly winning. But the350-centipawn gap shows that White gave up a significant chunk of the advantage. In a longer game, that lost ground could give Black counterplay that wouldn't exist after Rg7+.

**This is the key insight:** even in a winning position, accuracy measures *how efficiently* you converted. A game where you had +9.0 and converted at92% accuracy is a fundamentally different quality of play than one where you had +9.0 and converted at82%. The engine sees the difference — and so does your accuracy score.

### Position 3: The Endgame Where Accuracy Matters Most

<chess-position
  fen="8/4k3/4P3/4K3/8/8/8/8 b - - 0 1"
  caption="Black to move — Kd8 draws. Kf8 loses. One move is the difference between a draw and a loss."
  orientation="black"
 arrows="e7e8:green,e7d8:red" badge="best"></chess-position>

This is a king-and-pawn endgame where White has a pawn on the7th rank, supported by the king. Black's only job is to stay in front of the pawn. The choice is binary:

| Move | Result | Centipawn Loss | Per-Move Accuracy | Why |
|---|---|---|---|---|
| **Kd8** (correct) | **Draw** | 0 cp | **~99%** | Blocks the pawn from promoting. White can't make progress — the king can't outflank without abandoning the pawn. |
| **Kf8** (losing) | **Loss** | ~900 cp | **~5%** | Lets the pawn promote immediately with e8=Q. Game over. |

This is the extreme case: the same position, the same player, and the accuracy gap between the two moves is **94 percentage points**. In the middlegame, a900-cp mistake might happen through a complex tactical oversight. In an endgame like this, there's nothing to calculate — it's pure knowledge. You either know the pawn promotes or you don't.

**Endgames are where accuracy scores are most brutally honest.** In the opening, you might score90% by following memorised theory. In the middlegame, complex tactics create ambiguity. But in the endgame, every move is a clear decision with a clear evaluation. There's nowhere to hide. A single wrong king move can turn a drawn position into a loss — and your accuracy score will reflect it instantly.

This is why tracking your endgame accuracy separately from your middlegame accuracy is so valuable. If your overall accuracy is85% but your endgame accuracy is70%, you know exactly where to focus your study.

## The Phase Problem: Where Your Accuracy Actually Drops

Research on amateur games consistently shows that accuracy doesn't drop evenly across all phases:

**Opening (moves 1–15):** Most players have high accuracy here because they're following memorized lines. Accuracy "looks good" but doesn't reflect actual calculation — it reflects preparation.

**Middlegame (moves 15–35):** This is where the sharpest drops occur. Tactics get complex, time pressure builds, and your memorized patterns run out. This phase is the highest-leverage area for improvement.

**Endgame (moves 35+):** Many players lose accuracy here too, but often it's from accumulated pressure or a technically lost position — not calculation errors.

When you analyze your games, look at accuracy *by phase*, not just the overall number. Centipawn loss analysis can help with this — see [tracking centipawn loss by game phase](/blog/what-is-centipawn-loss#acpl-by-game-phase).

## How to Use Accuracy to Actually Improve

1. **Look for the outlier moves.** Sort your moves by centipawn loss and study the top 3. Those are your most expensive decisions.

2. **Track across opening systems.** You might average 88% in the Italian but only 79% in the Sicilian Dragon. That gap tells you where your preparation ends and your calculation begins.

3. **Compare similar time controls.** A 5-minute blitz game at 80% vs. a 15-minute rapid game at 87% is normal. If your rapid accuracy is close to your blitz accuracy, you're not using the extra time effectively. For more on how centipawn loss scales with time control, see [average centipawn loss by time control](/blog/what-is-centipawn-loss#acpl-by-time-control).

4. **Run a game report.** FireChess scans your last N games from Lichess or Chess.com and groups your accuracy drops into patterns — repeated [opening leak](/blog/how-to-find-opening-weaknesses)s, typical tactical blindspots, endgame technique failures — so you can see trends instead of individual fluctuations.

5. **Don't chase 99%.** A 99% accurate game is usually a short game with forced moves. Aim for consistency in the 85–92% range over many games, and use centipawn loss to measure the *magnitude* of your mistakes, not just their count.

The accuracy number alone is a compass. The [centipawn loss breakdown](/blog/what-is-centipawn-loss) is the map.

## FAQ: Chess Accuracy Score

### Q: How do I find my accuracy score?

Upload your games to [FireChess's scanner at /analyze](/analyze) — it shows your per-move accuracy, centipawn loss breakdown, and the badge distribution (how many Best, Good, Inaccuracy, Mistake, and Blunder moves you made). You can scan games from Lichess or Chess.com, or paste a PGN directly.

### Q: Is chess accuracy the same as "percentage of best moves"?

No. Accuracy % is not simply "number of best moves divided by total moves." Most platforms use a weighted formula that accounts for the severity of each mistake. A single 100-cp blunder drags your accuracy down much more than three 5-cp inaccuracies, even though the "best move percentage" would weigh them equally. Lichess uses a formula based on the sum of squared centipawn losses, while Chess.com applies a sigmoid-like curve to the average.

### Q: Why does my accuracy sometimes increase after a blunder?

It doesn't — the overall game accuracy always decreases after a blunder compared to where it would have been. But the *per-move* accuracy calculation can produce counterintuitive results if the blunder leads to a forced sequence where all remaining moves are obvious. For example, if you hang a queen and then all remaining moves are forced recaptures with 0 cp loss, the final accuracy might seem higher than expected — but it's still lower than it would have been without the blunder. The distortion comes from the forced nature of the subsequent play.

### Q: What's a good accuracy for my rating level?

See the chart at the top of this article for typical ranges, but broad guidelines:

| Rating | Typical Accuracy | What It Means |
|---|---|---|
| Under 1000 | 60–70% | Multiple mistakes per game; blunders every 5–7 moves |
| 1000–1400 | 70–78% | Occasional blunders; inconsistent opening play |
| 1400–1800 | 78–85% | Few outright blunders; mistakes are inaccuracies |
| 1800–2200 | 85–92% | Rare blunders; most inaccuracies are positional |
| 2200+ (NM/IM) | 92–96% | One or two small inaccuracies per game |
| 2500+ (GM) | 95–98% | Moves that appear "inaccurate" are often strategic trade-offs |

Remember: these vary significantly by time control and opening complexity.

### Q: Can accuracy be negative or go above 100%?

Some platforms (like Chess.com) clamp accuracy to 0–100. Others (like Lichess) allow it to go slightly above 100% in theory if every move was better than the engine's top suggestion (which happens in rare cases where the engine changes its mind across iterations). In practice, values above 100% are essentially never shown. Ceiling values like 99.9% appear in very short, forced games. On the low end, a game with multiple queen-sized blunders can approach 0%, though most platforms display nothing below 1–5%.

### Q: How is accuracy different from centipawn loss?

This is the most common question, and the answer is **accuracy % is a compressed, non-linear transformation of centipawn loss**:

- **Centipawn loss** is raw data — the actual difference between your move and the engine's best, measured in hundredths of a pawn. It's additive, linear, and directly comparable across games.
- **Accuracy %** is a processed metric — it takes centipawn losses, applies a curve (or another non-linear function), and maps them to a 0–100 percentage. It's intuitive but loses the raw magnitude information.

Use centipawn loss when you want to know *how much* you lost per move. Use accuracy % when you want a quick, understandable summary. For serious improvement, track both. See our full breakdown in [What Is Centipawn Loss?](/blog/what-is-centipawn-loss).

---

*Want to find where your accuracy actually drops? Run a FireChess report — it scans your recent games and shows you the positions where you lost the most ground, with per-move centipawn loss and accuracy breakdowns by opening, phase, and time control.*
