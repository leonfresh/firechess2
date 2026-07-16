---
title: "Average Centipawn Loss by Rating Level"
description: "Complete guide to average centipawn loss (ACPL) ranges by chess rating from beginner to grandmaster, plus how to benchmark and improve yours."
date: "2026-07-05"
author: "FireChess Team"
tags: ["analysis", "fundamentals", "improvement", "centipawn-loss"]
canonical: https://firechess.com/blog/average-centipawn-loss-by-rating
---

You just played 10 rapid games and your average centipawn loss (ACPL) was 65. Is that good? Bad? Average? The answer depends entirely on your rating — and knowing what's normal for your level is the first step to actually using centipawn loss to improve.

Average centipawn loss is the most reliable objective measure of playing strength because it strips away the noise of openings, time controls, and opponent quality. A 1400-rated player who averages 55 ACPL is genuinely playing better than a 1400 who averages 85 — regardless of who wins more games. Rating points come and go with variance, but your centipawn loss reveals the actual quality of your decisions move by move. This makes ACPL the single best metric for tracking whether your training is working, especially in the short term when your rating might not move much.

In this guide, we'll break down exactly what ranges to expect at every level, why consistency matters just as much as your average, and how to use this data to target your training. For a deeper look at how accuracy percentage maps to centipawn loss, see our companion guide: [Chess Accuracy Score Explained](/blog/chess-accuracy-score-explained).

## Average Centipawn Loss by Rating: The Full Table

Here are the typical ACPL ranges based on analysis of thousands of rated games across major chess platforms:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="440" viewBox="0 0 680 440" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acBg" x1="0" y1="0" x2="680" y2="440" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="680" height="440" rx="18" fill="url(#acBg)"/>
  <rect x="1" y="1" width="678" height="438" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="340" y="32" text-anchor="middle" fill="white" font-size="16" font-weight="700" font-family="system-ui">ACPL Range by Rating Band</text>
  <text x="340" y="50" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">Lower is better · bar shows the typical range</text>
  <!-- Labels column: rating bands -->
  <g font-family="system-ui" font-size="11">
    <text x="55" y="79" text-anchor="end" fill="#94a3b8">0–1000</text>
    <text x="55" y="112" text-anchor="end" fill="#94a3b8">1000–1200</text>
    <text x="55" y="145" text-anchor="end" fill="#94a3b8">1200–1400</text>
    <text x="55" y="178" text-anchor="end" fill="#94a3b8">1400–1600</text>
    <text x="55" y="211" text-anchor="end" fill="#94a3b8">1600–1800</text>
    <text x="55" y="244" text-anchor="end" fill="#94a3b8">1800–2000</text>
    <text x="55" y="277" text-anchor="end" fill="#94a3b8">2000–2200</text>
    <text x="55" y="310" text-anchor="end" fill="#94a3b8">2200–2400</text>
    <text x="55" y="343" text-anchor="end" fill="#94a3b8">2400–2600</text>
    <text x="55" y="376" text-anchor="end" fill="#94a3b8">2600+</text>
  </g>
  <!-- Scale: 0–250 ACPL mapped to 0–540px width (starting at x=70) -->
  <!-- Scale bar -->
  <line x1="70" y1="400" x2="610" y2="400" stroke="#1e293b" stroke-width="1"/>
  <text x="70" y="418" text-anchor="middle" fill="#475569" font-size="9" font-family="system-ui">0</text>
  <text x="178" y="418" text-anchor="middle" fill="#475569" font-size="9" font-family="system-ui">50</text>
  <text x="286" y="418" text-anchor="middle" fill="#475569" font-size="9" font-family="system-ui">100</text>
  <text x="394" y="418" text-anchor="middle" fill="#475569" font-size="9" font-family="system-ui">150</text>
  <text x="502" y="418" text-anchor="middle" fill="#475569" font-size="9" font-family="system-ui">200</text>
  <text x="610" y="418" text-anchor="middle" fill="#475569" font-size="9" font-family="system-ui">250</text>
  <!-- 10 rating bars: scale 2.16px per cp (540px / 250) -->
  <!-- x = 70 + (min_cp * 2.16), width = (max_cp - min_cp) * 2.16 -->
  <!-- 0–1000: 150–250 => x=70+324=394, w=100*2.16=216 -->
  <rect x="394" y="68" width="216" height="18" rx="4" fill="#ef4444" fill-opacity="0.7"/>
  <text x="616" y="81" fill="#ef4444" font-size="10" font-family="system-ui" font-weight="600">150–250+</text>
  <!-- 1000–1200: 90–150 => x=70+194.4=264, w=60*2.16=130 -->
  <rect x="264" y="101" width="130" height="18" rx="4" fill="#f97316" fill-opacity="0.7"/>
  <text x="400" y="114" fill="#f97316" font-size="10" font-family="system-ui" font-weight="600">90–150</text>
  <!-- 1200–1400: 70–90 => x=70+151.2=221, w=20*2.16=43 -->
  <rect x="221" y="134" width="43" height="18" rx="4" fill="#f59e0b" fill-opacity="0.7"/>
  <text x="270" y="147" fill="#f59e0b" font-size="10" font-family="system-ui" font-weight="600">70–90</text>
  <!-- 1400–1600: 55–70 => x=70+118.8=189, w=15*2.16=32 -->
  <rect x="189" y="167" width="32" height="18" rx="4" fill="#eab308" fill-opacity="0.7"/>
  <text x="227" y="180" fill="#eab308" font-size="10" font-family="system-ui" font-weight="600">55–70</text>
  <!-- 1600–1800: 45–55 => x=70+97.2=167, w=10*2.16=22 -->
  <rect x="167" y="200" width="22" height="18" rx="4" fill="#22d3ee" fill-opacity="0.7"/>
  <text x="195" y="213" fill="#22d3ee" font-size="10" font-family="system-ui" font-weight="600">45–55</text>
  <!-- 1800–2000: 40–50 => x=70+86.4=156, w=10*2.16=22 -->
  <rect x="156" y="233" width="22" height="18" rx="4" fill="#14b8a6" fill-opacity="0.7"/>
  <text x="184" y="246" fill="#14b8a6" font-size="10" font-family="system-ui" font-weight="600">40–50</text>
  <!-- 2000–2200: 30–40 => x=70+64.8=135, w=10*2.16=22 -->
  <rect x="135" y="266" width="22" height="18" rx="4" fill="#10b981" fill-opacity="0.7"/>
  <text x="163" y="279" fill="#10b981" font-size="10" font-family="system-ui" font-weight="600">30–40</text>
  <!-- 2200–2400: 25–35 => x=70+54=124, w=10*2.16=22 -->
  <rect x="124" y="299" width="22" height="18" rx="4" fill="#34d399" fill-opacity="0.7"/>
  <text x="152" y="312" fill="#34d399" font-size="10" font-family="system-ui" font-weight="600">25–35</text>
  <!-- 2400–2600: 15–25 => x=70+32.4=102, w=10*2.16=22 -->
  <rect x="102" y="332" width="22" height="18" rx="4" fill="#818cf8" fill-opacity="0.7"/>
  <text x="130" y="345" fill="#818cf8" font-size="10" font-family="system-ui" font-weight="600">15–25</text>
  <!-- 2600+: 10–20 => x=70+21.6=92, w=10*2.16=22 -->
  <rect x="92" y="365" width="22" height="18" rx="4" fill="#a5b4fc" fill-opacity="0.7"/>
  <text x="120" y="378" fill="#a5b4fc" font-size="10" font-family="system-ui" font-weight="600">10–20</text>
</svg>
</div>

| Rating Range | Average CPL (ACPL) | Typical Accuracy % (FireChess) | Playing Strength |
|---|---|---|---|
| 0–1000 | 150–250+ | 55–65% | Complete beginner |
| 1000–1200 | 90–150 | 65–72% | Casual player |
| 1200–1400 | 70–90 | 72–78% | Club player |
| 1400–1600 | 55–70 | 78–83% | Strong club player |
| 1600–1800 | 45–55 | 83–87% | Tournament player |
| 1800–2000 | 40–50 | 87–90% | Expert |
| 2000–2200 | 30–40 | 90–93% | Candidate Master level |
| 2200–2400 | 25–35 | 93–95% | FIDE Master / IM |
| 2400–2600 | 15–25 | 95–97% | Grandmaster |
| 2600+ | 10–20 | 97–99% | Super Grandmaster / World Class |

These ranges are a starting point. If you're a 1500 rapid player averaging 50 ACPL across 20+ games, you're playing closer to the accuracy of a 1800. The same goes the other way — an 1800 averaging 70 ACPL has work to do.

> The key takeaway: **for every ~100 rating points, your ACPL typically drops by about 5–10 cp.** There's no magic shortcut, but knowing where you stand tells you what to target.

## What These Numbers Actually Look Like on the Board

Averages can feel abstract, so here's what different ACPL values mean in practical game terms:

**ACPL 120+ (Beginner):** Missing tactics multiple times per game. Typically 3–5 blunders per game where pieces are straight-up dropped or simple forks are missed. Games often end by hanging a queen or missing mate in 2. At this level, players rarely calculate more than one move ahead, and defensive awareness is almost nonexistent — attacks go unnoticed until material is already lost.

**ACPL 90–120 (Novice, just below 1000):** A transitional zone where basic tactical patterns (one-move forks, hanging-piece checks) are spotted about half the time, but two-move combinations and discovered attacks almost always slip through. Players at this level frequently win or lose games based on who blunders last rather than who plays better chess. The most common error patterns are leaving pieces undefended and failing to check the opponent's captures before moving.

**ACPL 70–90 (Club, 1200–1400):** The most common range. You see basic one-move threats but regularly miss two-move combinations. You lose games from positional drift rather than outright blunders — a slow accumulation of small inaccuracies rather than a single catastrophic move.

**ACPL 45–55 (1800 level):** Tactical awareness is solid. Your mistakes come more from positional misjudgment than piece safety. When you blunder, it's usually from time pressure or complex calculation, not missing a simple hanging piece. Most losses are from strategic outplays, not giveaways.

**ACPL 15–25 (GM level):** Mistakes are subtle — a slightly mis-evaluated pawn break, a piece placed on the wrong square in a closed position, or choosing the wrong plan from three roughly equal options. Games are decided by microscopic advantages that compound over 40+ moves.

Consider a typical club-level position from the Italian Game:

<div class="chess-fen" style="margin: 1rem 0; padding: 0.75rem 1rem; background: #0d1425; border-radius: 8px; border: 1px solid #1e293b; font-family: monospace; color: #94a3b8; font-size: 13px;">
<strong style="color: #cbd5e1;">Position:</strong> r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3<br>
<strong style="color: #cbd5e1;">Typical mistake at 1400:</strong> Black plays 3...d6? which is passive, giving White a comfortable edge (≈40 cp advantage).<br>
<strong style="color: #cbd5e1;">Best move:</strong> 3...Nf6 or 3...Bc5 fighting for the center.
</div>

A 1400-rated player in this position might lose 50–70 cp by choosing the wrong plan over the next few moves. A 2000-rated player evaluates the same position and gains 10–15 cp of advantage through precise play.

## Why Every Platform's ACPL Differs

If you've checked your centipawn loss on Lichess versus Chess.com, you've noticed the numbers don't match. That's normal:

- **Lichess** uses Stockfish at a fixed depth (typically 22 ply) for analysis. Their ACPL tends to be lower because the engine finds *good* moves but not always the *absolute best*.
- **Chess.com** uses a stronger Stockfish (Cloud Engine) at higher depths. Their centipawn loss numbers tend to be higher — sometimes 10–20% higher than Lichess for the same game — because the engine finds finer distinctions between moves.
- **FireChess** uses Stockfish 18 at balanced depth, comparable to Chess.com. The ACPL table above is calibrated for FireChess-level analysis strength.

**Rule of thumb:** If you're used to Lichess numbers, add roughly 10% when comparing to FireChess or Chess.com ACPL. A "good" 40 ACPL on Lichess might register as 45–48 on FireChess. Cross-platform comparisons are always approximate — commit to one platform for tracking your own progress.

## ACPL by Time Control

Your centipawn loss isn't constant across all time controls. Here's what typical ACPL inflation looks like:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="640" height="230" viewBox="0 0 640 230" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tcBg" x1="0" y1="0" x2="640" y2="230" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
  </defs>
  <rect width="640" height="230" rx="18" fill="url(#tcBg)"/>
  <rect x="1" y="1" width="638" height="228" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="320" y="30" text-anchor="middle" fill="white" font-size="15" font-weight="700" font-family="system-ui">ACPL Inflation by Time Control</text>
  <g font-family="system-ui">
    <!-- Classical: baseline, bar from x=80 to x=200 (120px wide for 0 baseline) -->
    <!-- Scale: each 10 cp = 24px. Max bar: 80 cp = 192px -->
    <text x="80" y="65" text-anchor="middle" fill="#94a3b8" font-size="11">Classical</text>
    <rect x="80" y="75" width="24" height="20" rx="3" fill="#10b981" fill-opacity="0.7"/>
    <text x="64" y="89" text-anchor="end" fill="#10b981" font-size="11" font-weight="600">0cp</text>
    <!-- Rapid: +7 cp -->
    <text x="240" y="65" text-anchor="middle" fill="#94a3b8" font-size="11">Rapid</text>
    <rect x="240" y="75" width="41" height="20" rx="3" fill="#22d3ee" fill-opacity="0.7"/>
    <text x="286" y="89" text-anchor="start" fill="#22d3ee" font-size="11" font-weight="600">+7cp</text>
    <!-- Blitz: +20 cp -->
    <text x="400" y="65" text-anchor="middle" fill="#94a3b8" font-size="11">Blitz</text>
    <rect x="400" y="75" width="72" height="20" rx="3" fill="#f59e0b" fill-opacity="0.7"/>
    <text x="477" y="89" text-anchor="start" fill="#f59e0b" font-size="11" font-weight="600">+20cp</text>
    <!-- Bullet: +40 cp -->
    <text x="560" y="65" text-anchor="middle" fill="#94a3b8" font-size="11">Bullet</text>
    <rect x="560" y="75" width="72" height="20" rx="3" fill="#ef4444" fill-opacity="0.7"/>
    <text x="637" y="89" text-anchor="start" fill="#ef4444" font-size="11" font-weight="600">+40cp</text>
  </g>
  <!-- Baseline label -->
  <g transform="translate(320, 120)">
    <text text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">Baseline: Classical (30+ min) · bars show additional centipawn loss vs. classical</text>
  </g>
  <!-- Scale line -->
  <line x1="80" y1="160" x2="610" y2="160" stroke="#1e293b" stroke-width="1"/>
  <g font-family="system-ui" font-size="9" fill="#475569" text-anchor="middle">
    <text x="80" y="175">0</text>
    <text x="128" y="175">+10</text>
    <text x="176" y="175">+20</text>
    <text x="224" y="175">+30</text>
    <text x="272" y="175">+40</text>
    <text x="320" y="175">+50</text>
  </g>
  <!-- tick marks -->
  <g stroke="#1e293b" stroke-width="1">
    <line x1="80" y1="155" x2="80" y2="160"/>
    <line x1="128" y1="155" x2="128" y2="160"/>
    <line x1="176" y1="155" x2="176" y2="160"/>
    <line x1="224" y1="155" x2="224" y2="160"/>
    <line x1="272" y1="155" x2="272" y2="160"/>
    <line x1="320" y1="155" x2="320" y2="160"/>
  </g>
</svg>
</div>

| Time Control | ACPL vs. Classical Baseline |
|---|---|
| Classical (30+ min) | Baseline (your true accuracy) |
| Rapid (10–15 min) | +5–10 cp |
| Blitz (3–5 min) | +15–25 cp |
| Bullet (1 min) | +30–50 cp |

A 1600-rated player might average 45 ACPL in classical, 55 in rapid, and 70 in blitz. This doesn't mean they're a different player — it means time pressure forces imperfect decisions.

**Practical use:** Compare yourself only within the same time control. Don't benchmark your blitz ACPL against a classical ACPL table. If you want to know your "true" playing strength, look at your classical or rapid games. And when you're reviewing your [game analysis on FireChess](/analyze), always filter by time control first — mixing bullet and classical data produces a meaningless average.

## ACPL by Game Phase

Here's an important insight most players miss: your centipawn loss is not evenly distributed across the game.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="640" height="240" viewBox="0 0 640 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gpBg" x1="0" y1="0" x2="640" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
  </defs>
  <rect width="640" height="240" rx="18" fill="url(#gpBg)"/>
  <rect x="1" y="1" width="638" height="238" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="320" y="30" text-anchor="middle" fill="white" font-size="15" font-weight="700" font-family="system-ui">Typical Club Player ACPL by Game Phase</text>
  <g font-family="system-ui">
    <!-- Opening: ACPL 35, bar width = 35*3.6 = 126px -->
    <text x="80" y="70" text-anchor="middle" fill="#94a3b8" font-size="12">Opening</text>
    <rect x="80" y="78" width="126" height="24" rx="4" fill="#22d3ee" fill-opacity="0.7"/>
    <text x="214" y="94" fill="#22d3ee" font-size="12" font-weight="600">35 ACPL</text>
    <!-- Middlegame: ACPL 80, bar width = 80*3.6 = 288px -->
    <text x="80" y="120" text-anchor="middle" fill="#94a3b8" font-size="12">Middlegame</text>
    <rect x="80" y="128" width="288" height="24" rx="4" fill="#ef4444" fill-opacity="0.7"/>
    <text x="376" y="144" fill="#ef4444" font-size="12" font-weight="600">80 ACPL</text>
    <!-- Endgame: ACPL 55, bar width = 55*3.6 = 198px -->
    <text x="80" y="170" text-anchor="middle" fill="#94a3b8" font-size="12">Endgame</text>
    <rect x="80" y="178" width="198" height="24" rx="4" fill="#f59e0b" fill-opacity="0.7"/>
    <text x="286" y="194" fill="#f59e0b" font-size="12" font-weight="600">55 ACPL</text>
  </g>
  <!-- Scale -->
  <line x1="80" y1="220" x2="620" y2="220" stroke="#1e293b" stroke-width="1"/>
  <g font-family="system-ui" font-size="9" fill="#475569" text-anchor="middle">
    <text x="80" y="234">0</text>
    <text x="170" y="234">25</text>
    <text x="260" y="234">50</text>
    <text x="350" y="234">75</text>
    <text x="440" y="234">100</text>
  </g>
</svg>
</div>

| Phase | Typical ACPL Contribution | Why |
|---|---|---|
| Opening (moves 1–15) | Lowest (≈35) | Memorized lines, simple development goals |
| Middlegame (moves 15–35) | Highest (≈80) | Complex calculations, tactics, time pressure |
| Endgame (moves 35+) | Medium (≈55) | Fewer pieces, but precise technique required |

A typical club player's game breakdown might look like:
- Opening ACPL: **35** (mostly theory, reasonably accurate)
- Middlegame ACPL: **80** (where the damage happens)
- Endgame ACPL: **55** (some technique, some time-scramble)

The middlegame spike is where improvement happens fastest. If your middlegame ACPL is double your opening ACPL, you're not running out of theory — you're running out of a plan. The greatest gains come from improving your middlegame decision-making, which is where most games are decided.

## Why Variance Matters — cpLoss Distribution Within Rating Bands

Your average centipawn loss tells you one thing: your typical error size. But it doesn't tell you how *consistent* you are — and consistency might be just as important for your rating trajectory.

Two players can have the same ACPL of 65 but arrive there in completely different ways:

- **Player A (consistent):** Every game is between 55–75 ACPL. Rarely blunders big, rarely plays brilliantly. Steady, reliable chess.
- **Player B (volatile):** Games swing from 35 ACPL (plays like a master) to 120 ACPL (hangs a piece every 10 moves). The average comes out to 65, but the actual experience is a roller coaster.

Which player do you think has the higher peak rating? Research and platform data consistently show that **lower variance correlates with higher peak performance**, even when the averages are matched. A player who avoids the 120 ACPL blowout games will gain more rating points than a player who occasionally plays at 35 ACPL but also has catastrophic losses.

Here's what the spread of centipawn loss typically looks like within each rating band:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="440" viewBox="0 0 680 440" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="distBg" x1="0" y1="0" x2="680" y2="440" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
    <linearGradient id="gViolin1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ef4444"/><stop offset="1" stop-color="#f97316"/>
    </linearGradient>
    <linearGradient id="gViolin2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f97316"/><stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="gViolin3" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#eab308"/>
    </linearGradient>
    <linearGradient id="gViolin4" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#eab308"/><stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
    <linearGradient id="gViolin5" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#14b8a6"/>
    </linearGradient>
    <linearGradient id="gViolin6" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="gViolin7" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="gViolin8" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#818cf8"/>
    </linearGradient>
  </defs>
  <rect width="680" height="440" rx="18" fill="url(#distBg)"/>
  <rect x="1" y="1" width="678" height="438" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="340" y="32" text-anchor="middle" fill="white" font-size="15" font-weight="700" font-family="system-ui">Centipawn Loss Spread by Rating Band</text>
  <text x="340" y="50" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">Thick bar = 25th–75th percentile · thin line = full range · diamond = median</text>
  <!-- Labels -->
  <g font-family="system-ui" font-size="11">
    <text x="60" y="79" text-anchor="end" fill="#94a3b8">0–1000</text>
    <text x="60" y="115" text-anchor="end" fill="#94a3b8">1000–1200</text>
    <text x="60" y="151" text-anchor="end" fill="#94a3b8">1200–1400</text>
    <text x="60" y="187" text-anchor="end" fill="#94a3b8">1400–1600</text>
    <text x="60" y="223" text-anchor="end" fill="#94a3b8">1600–1800</text>
    <text x="60" y="259" text-anchor="end" fill="#94a3b8">1800–2000</text>
    <text x="60" y="295" text-anchor="end" fill="#94a3b8">2000–2200</text>
    <text x="60" y="331" text-anchor="end" fill="#94a3b8">2200–2400</text>
    <text x="60" y="367" text-anchor="end" fill="#94a3b8">2400–2600</text>
    <text x="60" y="403" text-anchor="end" fill="#94a3b8">2600+</text>
  </g>
  <!-- Scale: 0-250 cp mapped to 0-540px, starting x=75 -->
  <!-- Each cp = 2.16px -->
  <!-- x_base = 75 -->
  <!-- 0–1000: range 80–280+ (75+173=248, w=432), IQR 140–240 (75+302=377, w=216), median=200 -->
  <line x1="248" y1="70" x2="560" y2="70" stroke="#ef4444" stroke-opacity="0.3" stroke-width="3"/>
  <rect x="377" y="64" width="130" height="12" rx="3" fill="url(#gViolin1)" fill-opacity="0.6"/>
  <polygon points="507,70 515,64 515,76" fill="#ef4444"/>
  <!-- 1000–1200: range 60–200, IQR 90–150, median=120 -->
  <line x1="204" y1="106" x2="507" y2="106" stroke="#f97316" stroke-opacity="0.3" stroke-width="3"/>
  <rect x="269" y="100" width="130" height="12" rx="3" fill="url(#gViolin2)" fill-opacity="0.6"/>
  <polygon points="334,106 342,100 342,112" fill="#f97316"/>
  <!-- 1200–1400: range 40–140, IQR 65–105, median=85 -->
  <line x1="161" y1="142" x2="377" y2="142" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="3"/>
  <rect x="215" y="136" width="86" height="12" rx="3" fill="url(#gViolin3)" fill-opacity="0.6"/>
  <polygon points="258,142 266,136 266,148" fill="#f59e0b"/>
  <!-- 1400–1600: range 30–110, IQR 50–80, median=65 -->
  <line x1="140" y1="178" x2="313" y2="178" stroke="#eab308" stroke-opacity="0.3" stroke-width="3"/>
  <rect x="183" y="172" width="65" height="12" rx="3" fill="url(#gViolin4)" fill-opacity="0.6"/>
  <polygon points="215,178 223,172 223,184" fill="#eab308"/>
  <!-- 1600–1800: range 20–85, IQR 40–60, median=50 -->
  <line x1="118" y1="214" x2="259" y2="214" stroke="#22d3ee" stroke-opacity="0.3" stroke-width="3"/>
  <rect x="161" y="208" width="43" height="12" rx="3" fill="url(#gViolin5)" fill-opacity="0.6"/>
  <polygon points="183,214 191,208 191,220" fill="#22d3ee"/>
  <!-- 1800–2000: range 20–80, IQR 36–55, median=45 -->
  <line x1="118" y1="250" x2="248" y2="250" stroke="#14b8a6" stroke-opacity="0.3" stroke-width="3"/>
  <rect x="153" y="244" width="41" height="12" rx="3" fill="url(#gViolin6)" fill-opacity="0.6"/>
  <polygon points="172,250 180,244 180,256" fill="#14b8a6"/>
  <!-- 2000–2200: range 12–65, IQR 28–45, median=35 -->
  <line x1="101" y1="286" x2="215" y2="286" stroke="#10b981" stroke-opacity="0.3" stroke-width="3"/>
  <rect x="135" y="280" width="37" height="12" rx="3" fill="url(#gViolin7)" fill-opacity="0.6"/>
  <polygon points="151,286 159,280 159,292" fill="#10b981"/>
  <!-- 2200–2400: range 10–55, IQR 22–40, median=30 -->
  <line x1="97" y1="322" x2="194" y2="322" stroke="#34d399" stroke-opacity="0.3" stroke-width="3"/>
  <rect x="123" y="316" width="39" height="12" rx="3" fill="url(#gViolin8)" fill-opacity="0.6"/>
  <polygon points="140,322 148,316 148,328" fill="#34d399"/>
  <!-- 2400–2600: range 6–40, IQR 14–28, median=20 -->
  <line x1="88" y1="358" x2="161" y2="358" stroke="#818cf8" stroke-opacity="0.3" stroke-width="3"/>
  <rect x="105" y="352" width="30" height="12" rx="3" fill="#818cf8" fill-opacity="0.6"/>
  <polygon points="118,358 126,352 126,364" fill="#818cf8"/>
  <!-- 2600+: range 4–30, IQR 10–22, median=15 -->
  <line x1="84" y1="394" x2="140" y2="394" stroke="#a5b4fc" stroke-opacity="0.3" stroke-width="3"/>
  <rect x="97" y="388" width="26" height="12" rx="3" fill="#a5b4fc" fill-opacity="0.6"/>
  <polygon points="107,394 115,388 115,400" fill="#a5b4fc"/>
  <!-- Scale -->
  <line x1="75" y1="430" x2="615" y2="430" stroke="#1e293b" stroke-width="1"/>
  <g font-family="system-ui" font-size="9" fill="#475569" text-anchor="middle">
    <text x="75" y="440">0</text>
    <text x="183" y="440">50</text>
    <text x="291" y="440">100</text>
    <text x="399" y="440">150</text>
    <text x="507" y="440">200</text>
    <text x="615" y="440">250</text>
  </g>
</svg>
</div>

### What the spread tells you

Notice the pattern: as rating increases, **both the median and the spread shrink**. This isn't an accident — it reflects a fundamental reality of chess skill. Stronger players not only make smaller mistakes on average, they make *more consistently* small mistakes. The hallmark of mastery is reliability, not occasional brilliance. At the 0–1000 level, games range from 80 to 280+ ACPL — the difference between a lucky game where nothing gets hung and a disaster where pieces fall off the board every few moves. By the time you reach 2000+, the game-to-game variance is so small that a "bad game" at that level might still be cleaner than a "good game" at 1400.

**Key insight:** The width of the distribution at your rating tells you how much your performance depends on factors *other than skill* — concentration, fatigue, time management, opening familiarity. A wide spread means you're leaving points on the table through inconsistency. Narrowing that spread (by eliminating the blowup games) often raises your average more than trying to improve your peak accuracy.

Consider this: a 1600 player with an ACPL range of 40–70 (IQR 50–65) is much closer to 1800 strength than a 1600 player whose ACPL swings from 30 to 100. The first player can be trusted to perform in critical tournament games. The second is a wild card — capable of beating anyone on a good day, but also capable of losing to a 1200 on a bad one.

### How to measure your own spread

To get a meaningful picture of your ACPL variance, use [FireChess's game analysis tools](/analyze) to scan at least 20 of your recent games at the same time control. Don't just look at the average — look at the standard deviation. Here's what the numbers mean:

- **Standard deviation >50% of your average:** High variance. You have wild swings between good and bad games. Focus on cutting out the worst games.
- **Standard deviation 25–50% of your average:** Moderate variance. Normal for your level, with room to tighten up.
- **Standard deviation <25% of your average:** Low variance. You're highly consistent. Your next step is lowering the average itself.

A typical 1500-rated player might have an ACPL of 75 ±30 (average 75, std dev 30). That 30-point standard deviation means roughly two-thirds of their games fall between 45 and 105 ACPL — a massive range. Cut the bottom end (eliminate those 100+ ACPL blowouts) and their average drops to 60 without any tactical training at all.

## Frequently Asked Questions about Average Centipawn Loss

### 1. What is a good average centipawn loss for my rating?

There is no single "good" number — it depends entirely on your rating. Use the table above as your guide. A "good" ACPL for your rating is one that falls in the lower half of your band's range. For example:

- **1200–1400:** Under 75 cp is good (you're playing like a 1400+)
- **1600–1800:** Under 48 cp is good (you're playing like an 1800+)
- **2000–2200:** Under 33 cp is good (you're playing above your rating)

But remember: **a trending ACPL is better than a good ACPL.** If your numbers are dropping week over week, you're improving regardless of where you start.

### 2. Why is my ACPL higher on Chess.com than Lichess?

This is the most common question we get, and the answer is the engine depth. Chess.com uses a stronger, deeper Stockfish analysis that finds finer distinctions between moves. A move that Stockfish evaluates as +0.50 at depth 22 on Lichess might evaluate at +0.70 at depth 30 on Chess.com — the same move, but counted as a bigger inaccuracy. The difference can be 10–20% higher ACPL on Chess.com for the exact same game.

There's also a methodological difference: Chess.com's cloud analysis sometimes applies additional pruning that can make its depth uneven across the board, while Lichess consistently analyzes at a fixed depth. This means the same blunder might be caught on one platform but not the other, further skewing cross-platform comparisons. Our advice: pick one platform and stick with it for tracking your progress over time. Consistency of method matters more than which method you choose.

### 3. Can I have a low ACPL and still lose?

Absolutely — this is one of the most misunderstood aspects of centipawn loss. Centipawn loss measures the quality of your moves, not the result of the game. You can play a nearly perfect game (ACPL 25) and lose because your opponent also played accurately (ACPL 20) and had a slight positional edge from the opening. Conversely, you can win with ACPL 80 if your opponent blunders worse.

This is also why you shouldn't judge a single game's quality by its result alone. A loss where you held a difficult position for 50 moves with ACPL 30 is a far better performance than a win where your opponent blundered a piece on move 8 and you coasted with ACPL 90. **ACPL tells you how well you played, not who deserved to win.** For more on this distinction, read [Chess Accuracy Score Explained](/blog/chess-accuracy-score-explained).

### 4. How many games do I need for a reliable ACPL snapshot?

A bare minimum of 5 games, but 10–20 is where the number stabilizes. In any single game, your ACPL can swing wildly based on whether you got a comfortable opening, faced unfamiliar theory, or flagged in time pressure. A 20-game rolling average smooths out these one-off factors and gives you a number that actually reflects your playing strength. FireChess's [analyze page](/analyze) lets you batch-analyze any number of games and automatically computes rolling averages.

### 5. Is ACPL or accuracy percentage better for tracking improvement?

They measure the same underlying data but from different angles. ACPL is more precise for fine-grained improvement tracking because it isn't capped — accuracy percentage maxes out at 100% (and most players cluster between 60–99%), while ACPL gives you more room to see small changes at higher levels. A drop from 35 to 30 ACPL might move your accuracy from 91% to 93% — a small percentage change but a meaningful improvement in move quality.

There's also a psychological factor: ACPL is a "lower is better" metric where improvement shows as a decreasing number, which some players find more motivating than pushing a percentage upward. Accuracy percentage, on the other hand, is more intuitive for casual players — 94% *feels* like a strong performance in a way that "22 ACPL" might not.

**Practical rule:** Use ACPL for tracking day-to-day improvement. Use accuracy percentage for sharing with friends and quick benchmarking. And use both together with FireChess's accuracy score (which combines them with phase weighting) for the most complete picture.

## How to Calculate Your Average Centipawn Loss

To get a reliable ACPL reading, follow these guidelines:

1. **Minimum sample: 10 games.** A single game can swing wildly. A game where you got an overwhelming position early and cruised might show 40 ACPL. The next game where you had to defend a tricky Sicilian might be 90. Neither alone tells you anything.
2. **Same time control.** Mixing bullet and classical games gives you a meaningless average.
3. **Filter out obvious outliers.** A game where you flagged in a winning position with 2 seconds left isn't representative of your skill.
4. **Use FireChess's game scanner.** Upload your Lichess or Chess.com username and FireChess analyzes your last N games, breaking down centipawn loss by phase, opening, and time control automatically. You get a report with patterns, not just a number. The system also flags your most costly recurring mistakes so you know exactly which tactical motif or positional pattern to train next.

Here's an example of a typical middlegame position where rating level dramatically affects ACPL:

<div class="chess-fen" style="margin: 1rem 0; padding: 0.75rem 1rem; background: #0d1425; border-radius: 8px; border: 1px solid #1e293b; font-family: monospace; color: #94a3b8; font-size: 13px;">
<strong style="color: #cbd5e1;">Position:</strong> r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 5 4<br>
<strong style="color: #cbd5e1;">Italian Game, Classical Variation:</strong><br>
<strong style="color: #cbd5e1;">At 1400:</strong> Players average 65–85 ACPL from this position, often misplacing the dark-squared bishop or playing premature attacks.<br>
<strong style="color: #cbd5e1;">At 2000:</strong> Players average 35–45 ACPL, choosing solid developing moves like 5...Be7 or 5...a6 with clear plans.
</div>

Centipawn loss in the endgame also reveals a lot about a player's true level:

<div class="chess-fen" style="margin: 1rem 0; padding: 0.75rem 1rem; background: #0d1425; border-radius: 8px; border: 1px solid #1e293b; font-family: monospace; color: #94a3b8; font-size: 13px;">
<strong style="color: #cbd5e1;">Position:</strong> 8/8/8/8/4k3/8/4K3/8 w - - 0 1<br>
<strong style="color: #cbd5e1;">King and pawn endgame — opposition matters:</strong><br>
<strong style="color: #cbd5e1;">At 1200:</strong> Players lose 80+ cp here from random king moves.<br>
<strong style="color: #cbd5e1;">At 1800:</strong> Players lose <20 cp, understanding opposition and key squares.
</div>

## Still Not Sure If Your ACPL Is "Good"?

Here's a simple rule: **your ACPL should be trending downward.** If you were averaging 75 a month ago and now you're down to 65, you're improving — regardless of whether your rating has moved yet. Rating is a lagging indicator; ACPL is a leading indicator. Your rating is a backward-looking summary of your results, while your centipawn loss tells you about the quality of your chess play right now.

Track these milestones:
- **ACPL under 70:** You're playing above your rating for most club levels.
- **ACPL under 50:** You're playing at expert strength, even if your rating hasn't caught up.
- **ACPL under 30:** You're producing master-level moves on a regular basis.

The rating will follow the accuracy. Focus on reducing your biggest mistakes — those 100+ cp swings — and your average will drop naturally. Use [FireChess's analysis tools](/analyze) to identify exactly which phases of the game are costing you the most centipawns, and target your training there.

Ready to go deeper? Read our complete guide to [Chess Accuracy Score Explained](/blog/chess-accuracy-score-explained) for the full relationship between centipawn loss, accuracy percentage, and the FireChess composite score.

---

*Upload your games to [FireChess](/analyze) for a free analysis report showing your ACPL, accuracy score, variance, and worst moves broken down by phase.*
