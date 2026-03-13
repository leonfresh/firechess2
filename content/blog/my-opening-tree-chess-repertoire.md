---
title: "My Opening Tree: Map Every Opening You've Ever Played"
description: "FireChess scans your Lichess or Chess.com games and builds a live opening tree showing exactly where you win, lose, and go wrong in your repertoire."
date: "2026-03-13"
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

The tree is color-coded. Green nodes are lines where you're performing well. Red nodes are lines where you're bleeding points. The deeper you go into the tree, the more specific the feedback gets.

Instead of knowing vaguely that "I'm not great against the French," you can see that your win rate against the French Advance Variation specifically is 29% across 24 games, while the French Tarrasch is fine. That's actionable. You know exactly which line to study.

## The Problem with Generic Opening Study

Most opening advice is generic. "Study the Sicilian." "Learn your pawn structures." "Know the Italian Game."

None of that tells you *which* Sicilian variation is burning your rating, or whether the Italian is your strongest line or your worst. Generic advice leads to generic preparation — and generic preparation doesn't fix specific weaknesses.

My Opening Tree is the opposite of generic. It's built entirely from *your* game history. The tree it generates won't look like anyone else's, because no two players have the same opening habits.

## How to Read the Tree

The tree starts at the initial position and branches at every move. When you play a move, you follow one branch. Your opponent's response splits that branch further. By move 6 or 7, the tree has captured the unique structure of your personal repertoire.

**Node size** reflects how many of your games passed through that position. A thick, prominent node means that line comes up often. A thin node means it's rare — you probably don't need to worry about it.

**Win rate percentage** is calculated from your perspective: wins divided by decisive games. A 50% node is neutral. Above 55% is a strength. Below 45% is a weakness worth addressing. Below 35% is a leak that's actively costing you rating points.

**Depth control** lets you set how many moves deep the tree scans — from a shallow 8-ply pass that shows your opening tendencies, all the way to 30 plies that maps the transition into the early middlegame.

## Finding Your Leaks in Two Minutes

Here's the fastest way to use it:

1. Enter your username and select your most recent 200 games
2. Filter to your color (white or black separately — your repertoires are different)
3. Expand the tree two or three levels deeper than you normally think about
4. Sort by win rate, lowest first

The red nodes at the bottom of that sort are your leaks. Pick the one with the most games — that's the line costing you the most rating over time.

Then click the node. You'll see the exact position you're repeatedly struggling with, and you can open that FEN in FireChess's full analysis suite: Stockfish evaluation, best move suggestions, and the opening explorer showing what the theory recommends.

## White and Black Are Different Repertoires

A mistake many players make is treating their chess as one unified thing. In reality, you have two separate repertoires — one for white and one for black — and they have different strengths and weaknesses.

My Opening Tree lets you filter by color. You might find that you're a sharp, aggressive e4 player as White with a 65% win rate, but as Black against d4 you're passive and struggling. Or the opposite. The filter surfaces exactly this kind of asymmetry.

Most improvement plans ignore this distinction. Studying your weaknesses as White and your weaknesses as Black requires different material.

## Explore the Lines You Never Knew You Had

One of the surprises players report is discovering lines they didn't realize they were playing. You thought you only played the Ruy Lopez as White, but the tree shows you've entered the Italian Game 40 times without noticing. You thought you always responded to 1.d4 with the King's Indian, but there are 15 games where you played the Nimzo — and those 15 games have a 73% win rate.

The tree reveals habits you've never articulated. Some of those habits are good. Some need to go.

## Try It

My Opening Tree is at [firechess.com/my-openings](https://firechess.com/my-openings). It's free to use — enter any Lichess username and the tree builds in under 30 seconds. Chess.com support is included too.

If you've wanted a clearer picture of your actual opening repertoire — not the one you think you play, but the one you actually play — this is it.
