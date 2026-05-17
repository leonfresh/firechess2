---
title: "Chess Accuracy Score Explained: What 90%+ Actually Means"
description: "What is the chess accuracy score, how is it calculated, and what does a 90%+ accuracy actually tell you about how well you played? A deep dive."
date: "2026-06-04"
author: "FireChess Team"
tags: ["analysis", "fundamentals"]
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

Chess accuracy scores — whether from Lichess, Chess.com, or FireChess — are all built on the same concept: **centipawn loss**.

Here's the formula in plain English:

1. For every move you played, an engine evaluates the position before and after.
2. It compares your move to the best possible move the engine found.
3. The difference in evaluation (measured in centipawns) is your "loss" for that move.
4. Your accuracy is a function of how small your average loss was across all moves.

The exact formula varies by platform. Chess.com uses a conversion function that maps average centipawn loss to a percentage from 0–100. Lichess uses a similar approach. FireChess uses the raw centipawn loss per-move, grouped into classifications (brilliant, best, excellent, good, inaccuracy, mistake, blunder).

## Why You Can Lose With 94% Accuracy

This is the biggest source of confusion. Accuracy measures **how closely you followed the engine's recommendation** — not whether you won.

Imagine this scenario: Your opponent played a slightly inaccurate opening move early in the game. You didn't punish it optimally, but you also didn't blunder anything obvious. You both played at 90%+ accuracy. But because your opponent's inaccuracy created a strategically disadvantaged position for them, they lost the endgame despite their high accuracy score.

Accuracy tells you how well you played *given the positions that arose*. It doesn't tell you:
- Whether the positions were objectively equal or unequal
- Whether your opponent created pressure that forced you into passive play
- Whether an opening blunder from move 4 put you in a losing position early

**A 95% accurate loss often means you played well but started from a worse position.** A 75% accurate win often means your opponent blundered more than you did.

## What "Brilliant" Accuracy Actually Looks Like

Most players fixate on the top of the scale. So what does 99%+ accuracy look like?

It's essentially impossible to sustain across an entire game. Even world-class engines playing at the same level register a few percent accuracy loss over 50+ moves. A 99% accurate game usually means:
- The game was extremely short
- Most of the "moves" were forced captures or recaptures with no real decision
- One player was winning so easily that every "alternative" was catastrophic, making every move count as optimal

For real improvement, track **average accuracy across 20+ games**, not a single-game spike.

## Accuracy vs. Centipawn Loss: Which Should You Track?

| Metric | Pros | Cons |
|--------|------|------|
| Accuracy % | Intuitive 0–100 scale | Hides which phase cost you most |
| Avg centipawn loss | Raw, precise | Less intuitive |
| Move classification breakdown | Shows pattern of mistakes | Requires counting |

For actual improvement, **move classification is most useful**. Knowing you had 1 blunder, 2 mistakes, and 4 inaccuracies tells you more than "85% accuracy." The blunder was probably worth 3x the centipawn loss of all the inaccuracies combined.

## The Phase Problem: Where Your Accuracy Actually Drops

Research on amateur games consistently shows that accuracy doesn't drop evenly across all phases:

**Opening (moves 1–15):** Most players have high accuracy here because they're following memorized lines. Accuracy "looks good" but doesn't reflect actual calculation — it reflects preparation.

**Middlegame (moves 15–35):** This is where the sharpest drops occur. Tactics get complex, time pressure builds, and your memorized patterns run out. This phase is the highest-leverage area for improvement.

**Endgame (moves 35+):** Many players lose accuracy here too, but often it's from accumulated pressure or a technically lost position — not calculation errors.

When you analyze your games, look at accuracy *by phase*, not just the overall number.

## How to Use Accuracy to Actually Improve

1. **Look for the outlier moves.** Sort your moves by centipawn loss and study the top 3. Those are your most expensive decisions.

2. **Track across opening systems.** You might average 88% in the Italian but only 79% in the Sicilian Dragon. That gap tells you where your preparation ends and your calculation begins.

3. **Compare similar time controls.** A 5-minute blitz game at 80% vs. a 15-minute rapid game at 87% is normal. If your rapid accuracy is close to your blitz accuracy, you're not using the extra time effectively.

4. **Run a game report.** FireChess scans your last N games from Lichess or Chess.com and groups your accuracy drops into patterns — repeated opening leaks, typical tactical blindspots, endgame technique failures — so you can see trends instead of individual fluctuations.

The accuracy number alone is a compass. The breakdown is the map.

---

*Want to find where your accuracy actually drops? Run a FireChess report — it scans your recent games and shows you the positions where you lost the most ground.*
