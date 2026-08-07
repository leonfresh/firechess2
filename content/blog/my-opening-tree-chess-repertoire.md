---
title: "My Opening Tree: Map Every Opening You've Ever Played"
description: "FireChess scans your Lichess or Chess.com games and builds a live opening tree showing exactly where you win, lose, and go wrong in your repertoire."
date: "2026-08-08"
author: "FireChess Team"
tags: ["openings", "improvement", "feature"]
---

Every chess player has a repertoire — a set of openings they play over and over. But most players don't actually *know* their repertoire. They know their first few moves, they have a vague sense of what lines they prefer, but they've never seen the full picture of where their games go right and where they collapse.

**My Opening Tree** changes that.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="320" viewBox="0 0 680 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="otBg" x1="0" y1="0" x2="680" y2="320" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0a0d18"/><stop offset="1" stop-color="#0c1120"/></linearGradient>
    <radialGradient id="otGlowG" cx="340" cy="280" r="280" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#10b981" stop-opacity="0.08"/><stop offset="1" stop-color="#10b981" stop-opacity="0"/></radialGradient>
    <filter id="otNodeGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="680" height="320" rx="18" fill="url(#otBg)"/>
  <rect x="1" y="1" width="678" height="318" rx="17" stroke="white" stroke-opacity="0.05"/>
  <rect width="680" height="320" rx="18" fill="url(#otGlowG)"/>
  <!-- watermark pieces -->
  <text x="30" y="300" fill="white" fill-opacity="0.015" font-size="90">♞</text>
  <text x="570" y="110" fill="white" fill-opacity="0.015" font-size="90">♜</text>
  <!-- title -->
  <text x="340" y="30" text-anchor="middle" fill="white" font-size="15" font-weight="800" letter-spacing="0.3">Your Opening Repertoire — Win Rate by Line</text>
  <!-- ROOT node -->
  <circle cx="340" cy="68" r="20" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
  <text x="340" y="64" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">START</text>
  <text x="340" y="76" text-anchor="middle" fill="#64748b" font-size="8">1000 games</text>
  <!-- Level 1 branches: e4 and d4 -->
  <line x1="320" y1="86" x2="210" y2="128" stroke="#334155" stroke-width="1.5"/>
  <line x1="360" y1="86" x2="470" y2="128" stroke="#334155" stroke-width="1.5"/>
  <!-- e4 node -->
  <circle cx="210" cy="144" r="22" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-opacity="0.5" stroke-width="1.5" filter="url(#otNodeGlow)"/>
  <text x="210" y="140" text-anchor="middle" fill="#6ee7b7" font-size="11" font-weight="700">1.e4</text>
  <text x="210" y="152" text-anchor="middle" fill="#6ee7b7" font-size="9">62% W</text>
  <text x="210" y="163" text-anchor="middle" fill="#475569" font-size="8">580 games</text>
  <!-- d4 node -->
  <circle cx="470" cy="144" r="22" fill="#f59e0b" fill-opacity="0.1" stroke="#f59e0b" stroke-opacity="0.4" stroke-width="1.5"/>
  <text x="470" y="140" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="700">1.d4</text>
  <text x="470" y="152" text-anchor="middle" fill="#fbbf24" font-size="9">51% W</text>
  <text x="470" y="163" text-anchor="middle" fill="#475569" font-size="8">420 games</text>
  <!-- Level 2 from e4: Sicilian, French, e5 -->
  <line x1="192" y1="164" x2="114" y2="208" stroke="#1e3a2f" stroke-width="1.5"/>
  <line x1="210" y1="166" x2="210" y2="208" stroke="#1e3a2f" stroke-width="1.5"/>
  <line x1="228" y1="164" x2="306" y2="208" stroke="#1e3a2f" stroke-width="1.5"/>
  <!-- Sicilian -->
  <circle cx="114" cy="224" r="18" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.6" stroke-width="1.5"/>
  <text x="114" y="220" text-anchor="middle" fill="#6ee7b7" font-size="9" font-weight="700">Sicilian</text>
  <text x="114" y="232" text-anchor="middle" fill="#6ee7b7" font-size="8">68% W</text>
  <!-- French -->
  <circle cx="210" cy="224" r="18" fill="#ef4444" fill-opacity="0.12" stroke="#ef4444" stroke-opacity="0.45" stroke-width="1.5"/>
  <text x="210" y="220" text-anchor="middle" fill="#f87171" font-size="9" font-weight="700">French</text>
  <text x="210" y="232" text-anchor="middle" fill="#f87171" font-size="8">38% W</text>
  <!-- e5 (Italian/Ruy) -->
  <circle cx="306" cy="224" r="18" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-opacity="0.5" stroke-width="1.5"/>
  <text x="306" y="219" text-anchor="middle" fill="#6ee7b7" font-size="9" font-weight="700">1...e5</text>
  <text x="306" y="230" text-anchor="middle" fill="#6ee7b7" font-size="8">61% W</text>
  <!-- Level 2 from d4: KID, London -->
  <line x1="452" y1="164" x2="390" y2="208" stroke="#2d2415" stroke-width="1.5"/>
  <line x1="488" y1="164" x2="550" y2="208" stroke="#2d2415" stroke-width="1.5"/>
  <!-- KID -->
  <circle cx="390" cy="224" r="18" fill="#f59e0b" fill-opacity="0.12" stroke="#f59e0b" stroke-opacity="0.45" stroke-width="1.5"/>
  <text x="390" y="219" text-anchor="middle" fill="#fbbf24" font-size="9" font-weight="700">KID</text>
  <text x="390" y="230" text-anchor="middle" fill="#fbbf24" font-size="8">54% W</text>
  <!-- London -->
  <circle cx="550" cy="224" r="18" fill="#ef4444" fill-opacity="0.12" stroke="#ef4444" stroke-opacity="0.4" stroke-width="1.5"/>
  <text x="550" y="219" text-anchor="middle" fill="#f87171" font-size="9" font-weight="700">London</text>
  <text x="550" y="230" text-anchor="middle" fill="#f87171" font-size="8">44% W</text>
  <!-- Level 3: Sicilian → Najdorf (strong) -->
  <line x1="104" y1="241" x2="80" y2="268" stroke="#0d2a1e" stroke-width="1"/>
  <line x1="124" y1="241" x2="148" y2="268" stroke="#0d2a1e" stroke-width="1"/>
  <circle cx="80" cy="280" r="14" fill="#10b981" fill-opacity="0.18" stroke="#10b981" stroke-opacity="0.7" stroke-width="1.5"/>
  <text x="80" y="276" text-anchor="middle" fill="#6ee7b7" font-size="8" font-weight="700">Najdorf</text>
  <text x="80" y="287" text-anchor="middle" fill="#6ee7b7" font-size="7">74% W</text>
  <circle cx="148" cy="280" r="14" fill="#94a3b8" fill-opacity="0.08" stroke="#94a3b8" stroke-opacity="0.25" stroke-width="1"/>
  <text x="148" y="276" text-anchor="middle" fill="#64748b" font-size="8">Dragon</text>
  <text x="148" y="287" text-anchor="middle" fill="#64748b" font-size="7">51% W</text>
  <!-- French level 3: weak line highlight -->
  <line x1="203" y1="241" x2="190" y2="268" stroke="#3a1515" stroke-width="1"/>
  <circle cx="190" cy="280" r="14" fill="#ef4444" fill-opacity="0.22" stroke="#ef4444" stroke-opacity="0.6" stroke-width="1.5"/>
  <text x="190" y="276" text-anchor="middle" fill="#f87171" font-size="8" font-weight="700">Advance</text>
  <text x="190" y="287" text-anchor="middle" fill="#f87171" font-size="7">29% W</text>
  <!-- leak badge on French Advance -->
  <rect x="176" y="293" width="28" height="11" rx="5.5" fill="#ef4444" fill-opacity="0.25"/>
  <text x="190" y="301" text-anchor="middle" fill="#fca5a5" font-size="7" font-weight="700">LEAK</text>
  <!-- Legend -->
  <rect x="490" y="268" width="12" height="12" rx="3" fill="#10b981" fill-opacity="0.25" stroke="#10b981" stroke-opacity="0.5"/>
  <text x="507" y="278" fill="#6ee7b7" font-size="10">Strong line (&gt;55%)</text>
  <rect x="490" y="286" width="12" height="12" rx="3" fill="#ef4444" fill-opacity="0.2" stroke="#ef4444" stroke-opacity="0.4"/>
  <text x="507" y="296" fill="#f87171" font-size="10">Weak line (&lt;45%)</text>
</svg>
</div>

## What My Opening Tree Actually Shows You

When you enter your Lichess or Chess.com username, FireChess fetches your last 100–500 games (your choice) and builds a branching tree of every opening you've played. Each node in the tree is a position — a specific move sequence — and each node shows you three numbers: wins, draws, losses.

The tree is color-coded. Green nodes are lines where you're performing well. Red nodes are lines where you're bleeding points — similar to the [move-by-move analysis](/analyze) you'd get from a full game scan. The deeper you go into the tree, the more specific the feedback gets.

Instead of knowing vaguely that "I'm not great against the French," you can see that your win rate against the French Advance Variation specifically is 29% across 24 games, while the French Tarrasch is fine. That's actionable. You know exactly which line to study.

## The Problem with Generic Opening Study

Most opening advice is generic. "Study the Sicilian." "Learn your pawn structures." "Know the Italian Game."

None of that tells you *which* Sicilian variation is burning your rating, or whether the Italian is your strongest line or your worst. For a deeper look at targeted opening study, see [how to study chess openings without memorizing](/blog/how-to-study-chess-openings-without-memorizing/). Generic advice leads to generic preparation — and generic preparation doesn't fix specific weaknesses.

My Opening Tree is the opposite of generic. It's built entirely from *your* game history. The tree it generates won't look like anyone else's, because no two players have the same opening habits.

## How to Read the Tree

The tree starts at the initial position and branches at every move. When you play a move, you follow one branch. Your opponent's response splits that branch further. By move 6 or 7, the tree has captured the unique structure of your personal repertoire.

**Node size** reflects how many of your games passed through that position. A thick, prominent node means that line comes up often. A thin node means it's rare — you probably don't need to worry about it.

**Win rate percentage** is calculated from your perspective: wins divided by decisive games. A 50% node is neutral. Above 55% is a strength. Below 45% is a weakness worth addressing. Below 35% is a leak that's actively costing you rating points. Combine the tree's win-rate data with your [average centipawn loss](/blog/what-is-centipawn-loss/) for a complete picture of where you're losing quality.

**Depth control** lets you set how many moves deep the tree scans — from a shallow 8-ply pass that shows your opening tendencies, all the way to 30 plies that maps the transition into the early middlegame.

## Finding Your Leaks in Two Minutes

When you step outside your prepared repertoire, the tree catches it immediately. Consider this Sicilian Dragon position after 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6 6.Be3 Bg7 7.f3 O-O 8.Qd2 Nc6 9.Bc4:

<chess-position fen="r1bq1rk1/pp2ppbp/2np1np1/8/2BPP1b1/2N2N2/PP2QPPP/R1B2RK1 w - - 0 9" orientation="white" caption="Sicilian Dragon Yugoslav Attack — what happens outside your repertoire. After 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6 6.Be3 Bg7 7.f3 O-O 8.Qd2 Nc6 9.Bc4, White is launching the Yugoslav Attack with opposite-side castling coming. If your repertoire is the Italian Game, you're in unfamiliar, razor-sharp territory. This is where the tree turns red — without specific Dragon knowledge, you'll face mating attacks you've never seen before." arrows="c1e3:green,c4f7:red" badge="blunder"></chess-position>

Here's the fastest way to use it:

1. Enter your username and select your most recent 200 games
2. Filter to your color (white or black separately — your repertoires are different)
3. Expand the tree two or three levels deeper than you normally think about
4. Sort by win rate, lowest first

The red nodes at the bottom of that sort are your [opening weaknesses](/blog/how-to-find-opening-weaknesses/). Pick the one with the most games — that's the line costing you the most rating over time.

Then click the node. You'll see the exact position you're repeatedly struggling with, and you can open that FEN in FireChess's full analysis suite: Stockfish evaluation, best move suggestions, and the opening explorer showing what the theory recommends.

## White and Black Are Different Repertoires

A mistake many players make is treating their chess as one unified thing. In reality, you have two separate repertoires — one for white and one for black — and they have different strengths and weaknesses.

My Opening Tree lets you filter by color. You might find that you're a sharp, aggressive e4 player as White with a 65% win rate, but as Black against d4 you're passive and struggling. Or the opposite. The filter surfaces exactly this kind of asymmetry.

Most improvement plans ignore this distinction. Studying your weaknesses as White and your weaknesses as Black requires different material — browse the [openings database](/openings/) to find theory for both sides of your repertoire.

## Explore the Lines You Never Knew You Had

One of the surprises players report is discovering lines they didn't realize they were playing. You thought you only played the Ruy Lopez as White, but the tree shows you've entered the Italian Game 40 times without noticing. You thought you always responded to 1.d4 with the King's Indian, but there are 15 games where you played the Nimzo — and those 15 games have a 73% win rate.

The tree reveals habits you've never articulated. Some of those habits are good. Some need to go. Understanding [opening principles](/blog/chess-opening-principles/) helps you evaluate which discovered lines are worth keeping.

## Navigating Transpositions Between Openings

One of the most powerful — and most misunderstood — features of My Opening Tree is how it handles **transpositions**. A transposition occurs when two different move orders lead to the same board position. This is far more common than most players realize, and it means your "repertoire" isn't really a set of fixed move sequences. It's a web of interconnected positions reachable through multiple paths.

**A classic example:** The King's Indian Defense can arise from 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7, or from 1.Nf3 Nf6 2.c4 g6 3.d4 Bg7, or from 1.c4 Nf6 2.Nc3 g6 3.d4 Bg7, or even from 1.g3 d5 2.Bg2 Nf6 3.Nf3 c6 4.d4 Bg7 — same setup, wildly different move orders. A player who thinks of their repertoire as "I play 1.d4" misses the fact that their King's Indian positions also arise from English and Reti move orders.

**The Nimzo-Indian and Queen's Indian** form another well-known transposition nexus. After 1.d4 Nf6 2.c4 e6, White's choice of 3.Nc3 invites the Nimzo (3...Bb4), while 3.Nf3 leads toward the Queen's Indian (3...b6) or Bogo-Indian (3...Bb4+). But if you know both, the tree will merge them at deeper levels when the pawn structures converge.

**How the tree handles this:** My Opening Tree identifies transpositions by comparing the FEN of each position rather than by tracking move order. If two different sequences land on the same board with the same rights (castling, en passant, side to move), they collapse into a single node. Your 12 games from one move order and 8 from another combine into a statistically robust sample of 20.

**Why this matters for improvement:** When you see a merged node, you know you have genuine experience with that position — not just luck from a favorable move order. Conversely, if the tree shows two separate nodes for what you thought was the same opening, your move orders diverged somewhere along the way. That divergence point is exactly where you should study: something you're doing (or your opponent is doing) is taking you into unfamiliar territory.

The transposition view is especially valuable for players who switch between 1.e4 and 1.d4, or for Black players who face multiple first moves from White. Instead of learning separate responses to 1.e4, 1.d4, 1.c4, and 1.Nf3, you can build a unified repertoire that transposes into your preferred structures regardless of what White plays on move one.

For a complete catalog of every opening covered by the tree, visit our [openings database](/openings/).

## Repertoire Coverage by Depth

The chart below visualizes how your repertoire distributes across different depths of play. The horizontal axis shows depth in plies (half-moves), and the vertical axis shows how many distinct positions you've reached at each depth.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="340" viewBox="0 0 680 340" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cdBg" x1="0" y1="0" x2="680" y2="340" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0a0d18"/><stop offset="1" stop-color="#0c1120"/></linearGradient>
    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.9"/><stop offset="100%" stop-color="#6366f1" stop-opacity="0.7"/></linearGradient>
    <linearGradient id="barGradPeak" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10b981" stop-opacity="0.9"/><stop offset="100%" stop-color="#059669" stop-opacity="0.7"/></linearGradient>
    <filter id="barGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="680" height="340" rx="18" fill="url(#cdBg)"/>
  <rect x="1" y="1" width="678" height="338" rx="17" stroke="white" stroke-opacity="0.05"/>
  <!-- title -->
  <text x="340" y="28" text-anchor="middle" fill="white" font-size="14" font-weight="800" letter-spacing="0.3">Repertoire Coverage — Distinct Positions by Depth</text>
  <!-- Y-axis labels -->
  <text x="38" y="260" text-anchor="end" fill="#475569" font-size="9">0</text>
  <text x="38" y="209" text-anchor="end" fill="#475569" font-size="9">10</text>
  <text x="38" y="159" text-anchor="end" fill="#475569" font-size="9">20</text>
  <text x="38" y="108" text-anchor="end" fill="#475569" font-size="9">30</text>
  <text x="38" y="62" text-anchor="end" fill="#475569" font-size="9">40</text>
  <!-- Grid lines -->
  <line x1="48" y1="262" x2="650" y2="262" stroke="white" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="48" y1="212" x2="650" y2="212" stroke="white" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="48" y1="162" x2="650" y2="162" stroke="white" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="48" y1="112" x2="650" y2="112" stroke="white" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="48" y1="62" x2="650" y2="62" stroke="white" stroke-opacity="0.04" stroke-width="1"/>
  <!-- Bars: width=40, gap=14, start x=64 => centers at 84, 138, 192, 246, 300, 354, 408, 462, 516, 570 -->
  <!-- Depth 1: 2 positions → height=10, y=252 -->
  <rect x="64" y="252" width="40" height="10" rx="3" fill="url(#barGrad)" fill-opacity="0.5"/>
  <text x="84" y="270" text-anchor="middle" fill="#475569" font-size="9">1</text>
  <text x="84" y="248" text-anchor="middle" fill="#64748b" font-size="7">2</text>
  <!-- Depth 2: 5 positions → height=25, y=237 -->
  <rect x="118" y="237" width="40" height="25" rx="3" fill="url(#barGrad)" fill-opacity="0.5"/>
  <text x="138" y="270" text-anchor="middle" fill="#475569" font-size="9">2</text>
  <text x="138" y="233" text-anchor="middle" fill="#64748b" font-size="7">5</text>
  <!-- Depth 3: 12 positions → height=60, y=202 -->
  <rect x="172" y="202" width="40" height="60" rx="3" fill="url(#barGrad)" fill-opacity="0.6"/>
  <text x="192" y="270" text-anchor="middle" fill="#475569" font-size="9">3</text>
  <text x="192" y="198" text-anchor="middle" fill="#94a3b8" font-size="8">12</text>
  <!-- Depth 4: 20 positions → height=100, y=162 -->
  <rect x="226" y="162" width="40" height="100" rx="3" fill="url(#barGrad)" fill-opacity="0.7"/>
  <text x="246" y="270" text-anchor="middle" fill="#475569" font-size="9">4</text>
  <text x="246" y="158" text-anchor="middle" fill="#94a3b8" font-size="8">20</text>
  <!-- Depth 5: 32 positions → height=160, y=102 -->
  <rect x="280" y="102" width="40" height="160" rx="3" fill="url(#barGrad)" fill-opacity="0.8"/>
  <text x="300" y="270" text-anchor="middle" fill="#475569" font-size="9">5</text>
  <text x="300" y="98" text-anchor="middle" fill="#cbd5e1" font-size="8">32</text>
  <!-- Depth 6: 38 positions → height=190, y=72 (peak) -->
  <rect x="334" y="72" width="40" height="190" rx="3" fill="url(#barGradPeak)" fill-opacity="0.9" filter="url(#barGlow)"/>
  <text x="354" y="270" text-anchor="middle" fill="#475569" font-size="9">6</text>
  <text x="354" y="68" text-anchor="middle" fill="#6ee7b7" font-size="8" font-weight="700">38</text>
  <!-- Depth 7: 33 positions → height=165, y=97 -->
  <rect x="388" y="97" width="40" height="165" rx="3" fill="url(#barGrad)" fill-opacity="0.8"/>
  <text x="408" y="270" text-anchor="middle" fill="#475569" font-size="9">7</text>
  <text x="408" y="93" text-anchor="middle" fill="#cbd5e1" font-size="8">33</text>
  <!-- Depth 8: 24 positions → height=120, y=142 -->
  <rect x="442" y="142" width="40" height="120" rx="3" fill="url(#barGrad)" fill-opacity="0.65"/>
  <text x="462" y="270" text-anchor="middle" fill="#475569" font-size="9">8</text>
  <text x="462" y="138" text-anchor="middle" fill="#94a3b8" font-size="8">24</text>
  <!-- Depth 9: 14 positions → height=70, y=192 -->
  <rect x="496" y="192" width="40" height="70" rx="3" fill="url(#barGrad)" fill-opacity="0.5"/>
  <text x="516" y="270" text-anchor="middle" fill="#475569" font-size="9">9</text>
  <text x="516" y="188" text-anchor="middle" fill="#64748b" font-size="7">14</text>
  <!-- Depth 10: 7 positions → height=35, y=227 -->
  <rect x="550" y="227" width="40" height="35" rx="3" fill="url(#barGrad)" fill-opacity="0.4"/>
  <text x="570" y="270" text-anchor="middle" fill="#475569" font-size="9">10</text>
  <text x="570" y="223" text-anchor="middle" fill="#64748b" font-size="7">7</text>
  <!-- X-axis label -->
  <text x="340" y="296" text-anchor="middle" fill="#64748b" font-size="10">Depth (plies)</text>
  <!-- Peak marker -->
  <line x1="334" y1="66" x2="374" y2="66" stroke="#10b981" stroke-opacity="0.6" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="384" y="69" fill="#10b981" font-size="8">peak coverage</text>
  <!-- Footprint note -->
  <text x="340" y="322" text-anchor="middle" fill="#475569" font-size="9">Coverage expands through the opening and early middlegame, then drops as games diverge into unique lines</text>
</svg>
</div>

The pattern above is typical for a 1400–1800 rated player. Coverage expands steadily from move 1 (where you have only 2–3 first moves) to a peak around moves 5–7. This is where most of your games are decided — you have enough theory to reach move 6 or 7 comfortably, but beyond that you're largely playing without a prepared map. After the peak, coverage drops because games diverge into unique middlegame positions that don't repeat across your history.

**What different player profiles look like:**

- **Disciplined specialists** show a narrower, taller peak with less spread. They play fewer openings but reach greater depth in each one — coverage stays strong deeper into the tree.
- **Recreational players** show a flatter curve with broad but shallow coverage — many openings played a few times each, none with real depth.
- **Pattern-recognition players** (who rely on understanding rather than memorized lines) show a more gradual decline after the peak, since their middlegame positions share recognizable structures even when the specific move orders differ.

The depth slider in My Opening Tree lets you zoom in on any part of this curve. Set it shallow (8–12 plies) to survey your opening tendencies and identify which responses your opponents are throwing at you most often. Crank it deep (20–30 plies) to see how your repertoire actually performs in the early middlegame, where openings end and real chess begins.

For a systematic approach to fixing the weak lines this chart reveals, read our guide on [how to find opening weaknesses](/blog/how-to-find-opening-weaknesses/).

## A Concrete Example: The Italian Game

Let's walk through a real position. Suppose you've reached this [Italian Game](/openings/italian-game) after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3 d6 6.0-0 0-0 7.Re1:

<chess-position fen="r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQR1K1 w - - 0 8" orientation="white" caption="Italian Game — the position your repertoire aims for. After 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d3 d6 6.O-O O-O 7.Re1, White has a solid setup with clear plans: the d3-d4 break, Bc1-g5 pin, or Qe2 and Rad1 buildup. This is what a well-prepared repertoire looks like — a position you've studied, you understand, and you consistently score well from." arrows="c4b3:green,c4f7:red" badge="inaccuracy"></chess-position>

This is move 8 from White's perspective. Both sides have castled, the center is semi-closed, and White needs a concrete plan. In My Opening Tree, this position would appear as a green, yellow, or red node depending on your win rate from here.

If this is a **green node** (win rate above 55%), your instincts in this type of position are paying off. You're likely finding good plans — the d3-d4 break at the right moment, Re1 maneuvers, or the classic Bc1-g5 pin on the f6 knight. Keep doing what you're doing.

If this is a **red node** (win rate below 45%), you need to study the typical plans. Here are the three most common approaches from this position:

1. **d3-d4 break (most thematic):** White advances d3-d4 at the right moment to open the center. The timing is everything — push too early and Black gets counterplay; push at the right moment and White's better development tells.
2. **Bc1-g5:** Pin the knight on f6 to increase pressure on e5. Black typically responds with h6 or Be7-g4, and the resulting play tests both sides' understanding of the Italian structures.
3. **Qe2 and Rad1:** The "slow buildup." Centralize heavy pieces on the d- and e-files before forcing a breakthrough with d4 or f4. This approach requires patience and rewards positional understanding.

The tree doesn't just tell you the position — it tells you whether you handle it well. That's the difference between generic theory ("study the Italian Game") and personal analytics ("your win rate in this specific Italian structure is 64%"). One guides your study; the other just adds to your reading list.

### French Advance: Another Example

To see how the tree flags a weakness, consider this position from the French Advance variation (mentioned earlier as a 29% win rate "leak"):

<chess-position fen="r1bqkb1r/pp1pnppp/2n1p3/2pPP3/8/N2P1N2/PP4PP/R1BQKB1R w KQkq - 0 6" orientation="white" caption="French Advance after 1.e4 e6 2.d4 d5 3.e5 c5 4.c3 Nc6 5.Nf3 Nge7 6.Na3 — a position where your opening tree might show a 29% win rate. White has space on the kingside, but the key battle revolves around the d4 pawn and f6 square. If your tree shows red here, you need to study the typical pawn breaks and knight maneuvers."></chess-position>

Here, White has played the Advance French: 1.e4 e6 2.d4 d5 3.e5 c5 4.c3 Nc6 5.Nf3 Nge7 6.Na3. The position is closed, White has space on the kingside, and the key battle will revolve around the d4 pawn and the f6 square. A 29% win rate here screams that you're mishandling this structure — likely playing too passively when aggressive breaks like b4 or the Ng5-e2-f4 maneuver are needed.

Compare this to the Italian position above. Both are White's turn, both are move 8-ish, but the character of play is totally different. That's why the tree tracks each node independently — a player who excels in open positions (Italian) might flounder in closed ones (French Advance), and the win-rate numbers catch the contrast immediately.

## Frequently Asked Questions

### Q: How many games do I need for the tree to be useful?

A: At least 50 games, and ideally 100 or more. With fewer than 50, the individual node samples become too small to draw reliable conclusions — a 75% win rate over 4 games doesn't tell you much about your true strength in that line. With 100+ games, most major branches will have 5–15 games each, which is enough to spot real trends. You can load up to 500 games from either Lichess or Chess.com. For single-game deep dives, use the [analysis tool](/analyze) at any time.

### Q: Does the tree include correspondence games or engine-assisted games?

A: By default, no. My Opening Tree automatically filters out correspondence games (they're too long to reflect real opening skill) and games where either player's accuracy exceeds 95% (likely engine-assisted). Both filters can be disabled in the settings if you want the full picture, but the default view is clean human play — OTB, rapid, and classical time controls only.

### Q: What if I changed my repertoire recently? Won't old games bias the data?

A: You can set a date range to limit the analysis to recent games only — the last 3 months, last year, or any custom window. This is invaluable after a conscious switch, like moving from the Sicilian to the Caro-Kann. Your old games aren't deleted, they're just filtered. Switch the date range back to include them whenever you want to compare your old repertoire against your new one.

### Q: How are draws counted in the win-rate calculation?

A: Draws are excluded from the win-rate percentage. The number shown is *wins ÷ (wins + losses)* — decisive games only. This gives a clearer picture of your scoring potential in each line. A 50% win rate with no draws means you're splitting points exactly. A 50% win rate with 40% draws suggests you're reaching safe positions but failing to convert. Both are useful signals, but they tell different stories — the tree lets you see the raw numbers (wins, draws, losses) underneath the percentage.

### Q: Can I share my opening tree with my coach or a training partner?

A: Yes. Every tree view generates a shareable link. You can send the full tree or a specific branch, and the recipient doesn't need a FireChess account to see it. This makes it straightforward to review your repertoire with a coach during a lesson — they see exactly where you're struggling without combing through dozens of PGN files. It's also useful for group training: share your tree with a study group and compare repertoires to find complementary lines to learn together.

## Try It

My Opening Tree is at [firechess.com/my-openings](https://firechess.com/my-openings). It's free to use — enter any Lichess username and the tree builds in under 30 seconds. Chess.com support is included too. Browse the full [openings database](/openings/) for every opening in our catalog, or learn a systematic approach to [finding your opening weaknesses](/blog/how-to-find-opening-weaknesses/).

If you've wanted a clearer picture of your actual opening repertoire — not the one you *think* you play, but the one you actually play — this is it.
