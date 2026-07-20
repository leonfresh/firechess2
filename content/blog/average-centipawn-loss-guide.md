---
title: "Average Centipawn Loss (ACPL): What It Is and How to Lower Yours"
description: "Learn what average centipawn loss means in chess, how ACPL is calculated, what good ACPL looks like at every rating level, and proven ways to reduce it."
date: "2026-07-21"
author: "FireChess Team"
tags: ["centipawn loss", "chess improvement", "game analysis", "ACPL", "move quality"]
canonical: https://firechess.com/blog/average-centipawn-loss-guide
---

You just played a 40-move game and the engine says your ACPL was 67. Is that good? Bad? Average for your rating? Most club players see centipawn loss numbers on their analysis screen and have no idea what they mean — they just know lower is better. But understanding ACPL is one of the fastest ways to diagnose exactly where your games go wrong, because it breaks every single move into a measurable quality grade.

Average centipawn loss (ACPL) is the single best proxy for how well you played relative to the engine's top choice on every move. It's not a perfect metric — no single number captures the full story of a chess game — but it's the one number that tells you whether your losses come from one catastrophic blunder or a pattern of small inaccuracies. That distinction changes how you should train.

Upload your recent games to [FireChess's scanner at /analyze](/analyze) and you'll see your ACPL broken down by move quality: how many **Best (!)** moves you made, how many **Inaccuracies (?!)** you racked up, and where the **Blunders (??)** landed. That breakdown is where the real insight lives.

## What Is Centipawn Loss?

A centipawn is one-hundredth of a pawn — the standard unit engines use to evaluate chess positions. If the engine's best move gives you an evaluation of +1.50 (meaning you're ahead by one and a half pawns), and you play a move that gives +0.80 instead, your centipawn loss on that move is 70 centipawns. You gave up 0.70 pawns worth of advantage by not playing the engine's top choice.

Average centipawn loss (ACPL) simply takes that per-move loss and averages it across all your moves in a game. If you played 40 moves with a total centipawn loss of 2,800, your ACPL is 70. Some tools count only non-forced moves (skipping recaptures and obvious replies); others count everything. FireChess counts all moves but separates them into quality bands so you can see the distribution.

Here's the key insight most players miss: **ACPL is not about playing the best move every time.** It's about avoiding the big mistakes. A game where you play 35 moves of "Good" quality and make one 300cp blunder will have higher ACPL than a game with 40 "Inaccuracy"-level moves but no blunders. The blunder-dominated game *feels* worse because it is — one big mistake costs more than many small ones.

### The Position That Illustrates It

Take this position from a Ruy Lopez, one of the most analyzed openings in chess:

<chess-position fen="r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 b - - 0 9" caption="Black to move in the Ruy Lopez. The engine's top choice is 9...Nb8 (the Breyer variation, repositioning the knight to d7). Playing 9...Na5 instead costs roughly 25-30 centipawns — a Good-to-Inaccuracy borderline move." orientation="black"></chess-position>

Black has several reasonable moves here. The engine prefers **9...Nb8** — the famous Breyer maneuver, where the knight retreats to eventually reroute via d7 to better squares. It looks passive, but it's been a world championship weapon for decades. The move **9...Na5** looks more active (attacking the bishop), but it's slightly less accurate because it weakens Black's control of c5 and doesn't improve coordination.

The difference? About25-30 centipawns. One move doesn't kill you. But if you make five moves like this in a game — each giving up25cp instead of finding the best move — you've donated 125 centipawns. That's more than a full pawn of advantage you've surrendered through "not quite right" moves alone. Over a full game, these add up to 15-25 ACPL points, the difference between "solid club player" and "needs serious work."

## How ACPL Is Calculated

The calculation is straightforward:

1. For each move, the engine evaluates the position **before** your move and the position **after** your move
2. The centipawn loss = (evaluation after your move) − (evaluation after the engine's best move)
3. ACPL = sum of all per-move centipawn losses ÷ total moves

Some important nuances:

- **Evaluations are from the moving side's perspective.** If White plays a move that drops the eval from +2.00 to +0.50, White's centipawn loss is 150cp. If Black plays a move that drops the eval from +0.50 to +2.00 (from Black's perspective, that's −0.50 to −2.00), Black also loses 150cp.
- **Forced moves are still counted** in most tools. If you have only one legal move that doesn't lose material, you'll still "lose" centipawns if it's not the engine's preferred line. This inflates ACPL slightly in sharp positions.
- **Depth matters.** An engine at depth 12 will give different evaluations than depth 20. Consistency within one tool matters more than absolute numbers. FireChess uses Stockfish at depth 16 for analysis — deep enough for reliable evaluations without taking forever.

### What the FireChess Badge System Tells You

When you scan a game on FireChess, every move gets classified into one of seven quality bands. The badge system maps directly to centipawn loss:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="720" height="560" viewBox="0 0 720 560" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cpBg" x1="0" y1="0" x2="720" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
  </defs>
  <rect width="720" height="560" rx="18" fill="url(#cpBg)"/>
  <rect x="1" y="1" width="718" height="558" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="360" y="40" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700" letter-spacing="0.4" font-family="system-ui">FireChess Move Badges — Centipawn Loss Mapping</text>
  <text x="360" y="62" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Each badge corresponds to a centipawn loss range. Lower = better. Your ACPL averages these across every move.</text>
  
  <!-- Brilliant -->
  <g transform="translate(30, 90)">
    <rect width="660" height="54" rx="10" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#22d3ee" font-size="18" font-weight="800" font-family="system-ui">!!</text>
    <text x="54" y="34" fill="#22d3ee" font-size="15" font-weight="700" font-family="system-ui">Brilliant</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp loss · Best-move sacrifice that swings the evaluation in your favour</text>
  </g>
  
  <!-- Best -->
  <g transform="translate(30, 150)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#34d399" font-size="18" font-weight="800" font-family="system-ui">!</text>
    <text x="54" y="34" fill="#34d399" font-size="15" font-weight="700" font-family="system-ui">Best</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp loss · You matched the engine's top choice</text>
  </g>
  
  <!-- Good -->
  <g transform="translate(30, 210)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.05" stroke="#10b981" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#6ee7b7" font-size="18" font-weight="800" font-family="system-ui">✓</text>
    <text x="54" y="34" fill="#6ee7b7" font-size="15" font-weight="700" font-family="system-ui">Good</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">10-25 cp loss · Solid play, slightly suboptimal but stays within the position's logic</text>
  </g>
  
  <!-- Book -->
  <g transform="translate(30, 270)">
    <rect width="660" height="54" rx="10" fill="#94a3b8" fill-opacity="0.06" stroke="#94a3b8" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#cbd5e1" font-size="18" font-weight="800" font-family="system-ui">DB</text>
    <text x="54" y="34" fill="#cbd5e1" font-size="15" font-weight="700" font-family="system-ui">Book</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-12 cp loss · Move 1-15 following known opening theory</text>
  </g>
  
  <!-- Inaccuracy -->
  <g transform="translate(30, 330)">
    <rect width="660" height="54" rx="10" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fbbf24" font-size="18" font-weight="800" font-family="system-ui">?!</text>
    <text x="54" y="34" fill="#fbbf24" font-size="15" font-weight="700" font-family="system-ui">Inaccuracy</text>
    <text x="200" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">25-75 cp loss · A small slip — cost you about half a pawn</text>
  </g>
  
  <!-- Mistake -->
  <g transform="translate(30, 390)">
    <rect width="660" height="54" rx="10" fill="#f97316" fill-opacity="0.08" stroke="#f97316" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fb923c" font-size="18" font-weight="800" font-family="system-ui">?</text>
    <text x="54" y="34" fill="#fb923c" font-size="15" font-weight="700" font-family="system-ui">Mistake</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">75-200 cp loss · A real miss that dropped about 1-2 pawns</text>
  </g>
  
  <!-- Blunder -->
  <g transform="translate(30, 450)">
    <rect width="660" height="54" rx="10" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#f87171" font-size="18" font-weight="800" font-family="system-ui">??</text>
    <text x="54" y="34" fill="#f87171" font-size="15" font-weight="700" font-family="system-ui">Blunder</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">200+ cp loss · Hung material, missed a winning tactic, or fatally weakened your position</text>
  </g>
</svg>
</div>

The summary panel at the top of a FireChess scan shows something like:

> **White 78.7% accuracy · Best 11 · Book 8 · Good 3 · Blunder 2 · ACPL 43.2**

That single line tells you more about the game than any other metric. The ACPL number is the average; the badge distribution tells you *where* the problems are. A player with 2 Blunders and 0 Inaccuracies has a different problem than one with 0 Blunders and 12 Inaccuracies — even if their ACPL is identical.

## What Is a Good ACPL by Rating?

This is the question everyone asks, and the honest answer is: **it depends on the time control, the position type, and the engine depth.** But from thousands of FireChess scans across all rating levels, here are the typical ranges:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="380" viewBox="0 0 680 380" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acplBg" x1="0" y1="0" x2="680" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#0d1225"/>
    </linearGradient>
  </defs>
  <rect width="680" height="380" rx="16" fill="url(#acplBg)"/>
  <rect x="1" y="1" width="678" height="378" rx="15" stroke="#1e293b" stroke-opacity="0.5"/>
  <text x="340" y="36" text-anchor="middle" fill="#f1f5f9" font-size="18" font-weight="700" font-family="system-ui">ACPL by Rating Level (Typical Ranges)</text>
  <text x="340" y="56" text-anchor="middle" fill="#64748b" font-size="12" font-family="system-ui">Based on analysis of club-level games · Lower is better</text>
  
  <!-- Grid lines -->
  <line x1="180" y1="80" x2="180" y2="340" stroke="#1e293b" stroke-width="1"/>
  <line x1="310" y1="80" x2="310" y2="340" stroke="#1e293b" stroke-width="1"/>
  <line x1="440" y1="80" x2="440" y2="340" stroke="#1e293b" stroke-width="1"/>
  <line x1="570" y1="80" x2="570" y2="340" stroke="#1e293b" stroke-width="1"/>
  
  <!-- Axis labels -->
  <text x="180" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">50</text>
  <text x="310" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">100</text>
  <text x="440" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">150</text>
  <text x="570" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">200</text>
  
  <!-- Rating rows -->
  <!-- 2200+: ACPL 15-30 -->
  <text x="50" y="100" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">2200+</text>
  <rect x="140" y="86" width="130" height="22" rx="4" fill="#10b981" fill-opacity="0.7"/>
  <text x="205" y="102" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">15-30 ACPL</text>
  
  <!-- 1800-2200: ACPL 30-50 -->
  <text x="50" y="145" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">1800-2200</text>
  <rect x="140" y="131" width="200" height="22" rx="4" fill="#10b981" fill-opacity="0.5"/>
  <text x="240" y="147" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">30-50 ACPL</text>
  
  <!-- 1400-1800: ACPL 50-80 -->
  <text x="50" y="190" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">1400-1800</text>
  <rect x="140" y="176" width="260" height="22" rx="4" fill="#f59e0b" fill-opacity="0.6"/>
  <text x="270" y="192" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">50-80 ACPL</text>
  
  <!-- 1000-1400: ACPL 80-130 -->
  <text x="50" y="235" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">1000-1400</text>
  <rect x="140" y="221" width="340" height="22" rx="4" fill="#f97316" fill-opacity="0.5"/>
  <text x="310" y="237" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">80-130 ACPL</text>
  
  <!-- Under 1000: ACPL 130-200+ -->
  <text x="50" y="280" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">Under 1000</text>
  <rect x="140" y="266" width="420" height="22" rx="4" fill="#ef4444" fill-opacity="0.45"/>
  <text x="350" y="282" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">130-200+ ACPL</text>
  
  <!-- Legend -->
  <text x="340" y="325" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">Ranges assume 15+10 or longer time control · Blitz/rapid games run 10-20% higher</text>
</svg>
</div>

A few things jump out from the data:

**The 1400-1800 band is where most club players live**, and an ACPL of50-80 is completely normal. You're not "bad" at 65 ACPL — you're average for your rating. The problem is if your ACPL *stays* at 65 as you try to climb. To break 1800, you need to consistently get under 50.

**Blitz inflates everything.** A 1600-rated player might have45 ACPL in a15+10 game but 80 ACPL in 3+0 blitz. The speed of play matters enormously. Always compare ACPL within the same time control.

**One blunder destroys the average.** A 1500 player who plays38 moves at15cp average (excellent for that rating) but makes one 400cp blunder ends up with ~25 ACPL for that game. The blunder alone added10 points to the average. This is why the badge distribution matters more than the raw number — a game with1 Blunder and39 Good moves is very different from a game with20 Inaccuracies.

## Why Your ACPL Is Higher Than It Should Be

After scanning thousands of games on FireChess, the same patterns appear again and again. Here are the three biggest ACPL killers at the club level, with real positions to show what they look like.

### Pattern 1: The Opening Knowledge Gap

The most common ACPL spike happens in the first 15 moves. Players who don't know their opening well enough make "reasonable-looking" moves that subtly weaken their position by30-50 centipawns each. Five such moves and you've donated150+ centipawns before the middlegame even starts.

<chess-position fen="r1bq1rk1/pppnbppp/5n2/3p2B1/3P4/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8" caption="White to move in the Queen's Gambit Declined. After the natural 8.Bd3, Black has solid equality. But if White plays 8.Ne5?! instead, Black gets easy play with ...dxc4 and ...Nd5. Check your opening ACPL in FireChess's 'Opening Leaks' section." orientation="white"></chess-position>

The Queen's Gambit Declined is one of the most theoretically dense openings in chess. If you're a 1500-rated player and you reach this position, you might play **8.Bd3** (the main line, solid) or you might play **8.Ne5?!** (looks active, attacking f7, but actually gives Black easy equality). The engine's evaluation difference is only about 20-30 centipawns, but the resulting positions are dramatically different in practice — after 8.Ne5 Black gets a comfortable game with ...dxc4, ...Nd5, and ...f6, while after 8.Bd3 White maintains a small but persistent edge.

This is what "Opening Leaks" in FireChess shows you: positions where you consistently choose the second-best move in your openings. If you play the QGD as White and you see a cluster of **?!** badges on moves 6-10, that's not random — it's a systematic knowledge gap you can fix by studying those specific positions.

### Pattern 2: The Middlegame Calculation Miss

The biggest ACPL spikes (200+ centipawns on a single move) happen when you miss a tactical shot — either your opponent's or your own. This is different from the opening problem: opening inaccuracies are small and consistent, while calculation misses are large and sporadic.

<chess-position fen="r1bqkb1r/ppp2Npp/2n5/3np3/2B5/8/PPPP1PPP/RNBQK2R b KQkq - 0 6" caption="Black to move after 6.Nxf7 in the Fried Liver Attack. The engine says Black should play 6...Kxf7, accepting the sacrifice and entering a sharp but defensible position. The move 6...Ke8?? is a blunder — it looks safer but loses to7.Qf3. One wrong king move costs 300+ centipawns." orientation="black"></chess-position>

The Fried Liver Attack is a perfect ACPL case study. After **6.Nxf7**, Black faces a critical decision. The engine says **6...Kxf7** is the only real move — it's scary (your king is exposed on f7) but objectively sound. The move **6...Ke8??** looks natural (keep the king safe, don't take the knight) but is actually a catastrophic blunder losing300+ centipawns because White plays7.Qf3 and Black's position collapses.

This is the kind of move that shows up as a red **?? Blunder** badge in FireChess. And here's the thing: if you're rated under 1600, you've probably made this exact mistake or one like it. Not because you're bad at chess, but because the "safe" move *feels* right. Pattern recognition tells you "don't move the king into the open" — but calculation would tell you that Kxf7 is actually the safer move because of the specific tactical resources available.

After scanning your games, look at the "Blunder" section — each one usually has a story like this. A move that felt safe but wasn't. A capture that seemed winning but had a hidden defense. These are the200+ centipawn losses that destroy your ACPL average.

### Pattern 3: The Endgame Conversion Failure

The third ACPL killer is less dramatic but equally damaging: playing the endgame poorly. A position that's +2.00 (winning) slowly bleeds to +0.50 (drawn) because you don't know the technique. Each move loses15-30 centipawns — never a blunder, never even a mistake, just a steady stream of inaccuracies.

<chess-position fen="8/5kpp/8/8/8/4R3/r4PPP/6K1 w - - 0 1" caption="White to move in a rook endgame. The active 1.Ra3 is much stronger than the passive 1.Rf3+?! — trading rooks or putting the rook behind the pawn is key technique. Endgame ACPL is where most club players lose the most points relative to masters." orientation="white"></chess-position>

In this rook endgame, White has a clear advantage (extra pawn, active rook). But the difference between **1.Ra3** (active, targeting the a-file) and **1.Rf3+?!** (passive, checking without a plan) is about 40 centipawns. Over 15 endgame moves, choosing the "safe" but passive option every time can cost 200+ centipawns total — the equivalent of giving back the entire advantage.

This is the hardest pattern to fix because endgame technique requires specific knowledge, not just "be more careful." You need to know that rook activity matters more than rook safety, that passed pawns should be pushed, that king activity wins endgames. The good news: endgame study has the highest ROI of any chess training. Moving your ACPL from 80 to 60 in endgames alone can drop your overall ACPL by 5-10 points.

## How to Lower Your ACPL: A Practical Guide

Knowing your ACPL is useless without knowing how to improve it. Here's what actually works, ranked by effectiveness for club players.

### Fix Your Blunders First

This sounds obvious but most players do it wrong. They try to "think harder" or "be more careful" — which doesn't work because blunders aren't caused by insufficient effort. They're caused by **pattern recognition gaps**. You didn't miss the tactic because you didn't calculate; you missed it because you didn't *see* it.

The fix: solve tactical puzzles that focus on the patterns you actually miss. Don't do random puzzle sets. After scanning20+ games on FireChess, look at your blunder positions — they'll cluster around specific motifs. If your blunders are mostly back-rank mates, study back-rank mates. If they're mostly knight forks, study knight forks. Targeted practice beats volume.

For most players rated under 1600, eliminating blunders alone drops ACPL by 15-25 points. That's the single biggest improvement available.

### Learn Your Openings Deeper (Not Wider)

The opening leaks section in FireChess analysis is a goldmine. If you play 1.e4 and your ACPL in the first 10 moves is 60+, you're losing the game before it starts. But the fix isn't to memorize more theory — it's to understand *why* the engine prefers certain moves in the positions you actually reach.

Study the specific lines where you make inaccuracies. If you consistently play the wrong move on move 8 of the Najdorf, learn *that* position's ideas, not the entire Najdorf tree. Depth in your main lines, not breadth across many openings, is what drops opening ACPL.

After scanning your games, sort the opening moves by centipawn loss. The highest-loss positions are where you should focus. Three hours of targeted opening study on your worst positions can reduce opening ACPL by 10-20 points — a permanent improvement that pays off in every game.

### Improve Your Endgame Technique

Endgame ACPL is where the biggest gap between club players and masters exists. A 1500 player might have 90+ ACPL in endgames; a 2200 player has 25-35. The difference isn't calculation — it's knowledge.

Learn these endgame fundamentals in order:
1. **King and pawn endgames** — opposition, key squares, the rule of the square
2. **Rook endgames** — Lucena position, Philidor position, rook activity principles
3. **Bishop vs. knight endgames** — when each piece is better, how to play each side

Each of these takes about 5-10 hours to study properly. Combined, they can drop endgame ACPL from90 to50 — a40-point improvement that translates to10-15 points of overall ACPL and a significant rating jump.

### Use a Structured Analysis Routine

Most players analyze their games wrong. They look at the engine evaluation, see a red move, and think "I should have played the engine's suggestion." That's not learning — that's just seeing the answer.

Instead, use this routine after every game:

1. **Identify your three highest-ACPL moves.** Not the engine's suggestions — your worst moves. What did you play, and why?
2. **Find the root cause.** Was it a calculation miss (you saw the right move but evaluated it wrong)? A knowledge gap (you didn't know the pattern)? A time-pressure decision?
3. **Study the pattern.** If it was a calculation miss, solve5 similar tactics. If it was a knowledge gap, read about that specific endgame or opening position.
4. **Track your ACPL over time.** Don't focus on single games — look at your30-game rolling average. If it's dropping, your training is working.

FireChess's scanner makes this routine fast — upload a PGN, see the breakdown, drill into your worst moves, and track improvement over time. The [analysis page at /analyze](/analyze) gives you the badge distribution, the move-by-move breakdown, and the opening leak clusters all in one view.

## The Difference Between ACPL and Accuracy

Players often confuse ACPL with accuracy, and some tools use the terms interchangeably. They're related but different:

| Metric | What It Measures | Scale | Use Case |
|--------|-----------------|-------|----------|
| ACPL | Average centipawn loss per move | Lower is better (0-200+) | Diagnosing specific weaknesses |
| Accuracy | How close your moves match the engine's top choice | 0-100% | Overall game quality score |

Accuracy is a percentage — it tells you how often you played the "right" move. ACPL tells you how *wrong* your wrong moves were. A game with 85% accuracy and 60 ACPL has a few big mistakes. A game with 85% accuracy and 35 ACPL has many small ones. Same accuracy, very different problems.

FireChess shows both metrics. The accuracy percentage is useful for a quick health check. The ACPL and badge distribution are what you need for targeted improvement. When someone asks "what's a good accuracy in chess?" the answer depends on the position complexity — but ACPL is more consistent across different game types.

## Common ACPL Myths Debunked

**"Lower ACPL always means better play."** Not necessarily. In a completely drawn position, both players might have15 ACPL — they're playing accurately, but nothing is happening. In a sharp tactical game, both players might have60 ACPL despite playing well, because the positions are so complex that even good moves lose some centipawns. Context matters.

**"I need to play like an engine to get low ACPL."** No. You need to avoid blunders and know your openings. A 1600 player with good opening knowledge and solid tactics can achieve40-50 ACPL without playing a single "brilliant" move. Consistency beats brilliance.

**"ACPL doesn't account for position complexity."** This is partially true — a quiet position is easier to play accurately than a sharp one. But over a large sample of games, the complexity averages out. If your ACPL is consistently high across all game types, the problem is you, not the positions.

**"Centipawns are meaningless because engines disagree."** Different engines and depths give slightly different evaluations, but the *relative* assessments are remarkably consistent. If a move is a blunder at depth 16, it's almost always a blunder at depth 20 too. The absolute number might shift by5-10cp, but the pattern is stable.

## Tracking Your ACPL Over Time

A single game's ACPL tells you almost nothing. Chess is too variable — you might play a clean game at 25 ACPL followed by a disaster at 120 ACPL, and neither represents your "true" level. What matters is the trend.

Scan at least 20 games — ideally from the same time control — and look at:
- **Your average ACPL across all games.** This is your baseline.
- **The distribution.** Do you have a few catastrophic games pulling the average up, or is it consistently high?
- **The badge breakdown.** How many Blunders per game? How many Inaccuracies?
- **Opening vs. middlegame vs. endgame ACPL.** Where are you losing the most points?

The [FireChess scanner at /analyze](/analyze) computes all of this automatically. Upload your PGN, wait for the analysis, and you'll see exactly where your centipawn loss concentrates. Use that data to focus your training, not just to feel bad about your blunders.

Improving ACPL is a long game. Most players see a5-10 point drop over 3 months of targeted training, which translates to100-200 rating points. It's not dramatic, but it's real — and unlike memorizing opening lines, the improvement is permanent because it's based on pattern recognition and technique, not rote memorization.

## FAQ

### Q: What is average centipawn loss in chess?

Average centipawn loss (ACPL) measures how far your moves deviate from the engine's best choice, averaged across all moves in a game. Each move is evaluated: if the engine's top move gives +1.50 and your move gives +1.00, you lost 50 centipawns on that move. Your ACPL is the total centipawn loss divided by the number of moves. Lower ACPL means you played closer to the engine's recommendations. Use [FireChess's scanner at /analyze](/analyze) to see your ACPL with a full move-by-move breakdown.

### Q: What is a good ACPL for my rating?

Typical ranges: under 1000 rated players average130-200+ ACPL; 1000-1400 players average 80-130; 1400-1800 players average 50-80; 1800-2200 players average 30-50; and 2200+ players average 15-30. These numbers assume15+10 or longer time control — blitz games typically run10-20% higher. If your ACPL is within the range for your rating, focus on reducing blunders first for the biggest improvement.

### Q: How do I find my centipawn loss?

Upload your game PGN to [FireChess's analysis tool at /analyze](/analyze). The scanner shows your ACPL, accuracy percentage, and a badge breakdown (how many Best, Good, Inaccuracy, Mistake, and Blunder moves you made). You can also see centipawn loss per move in the move-by-move analysis. Lichess and Chess.com also show ACPL in their game analysis features.

### Q: What's the difference between centipawn loss and accuracy?

Centipawn loss measures *how much* evaluation you gave up per move (a continuous number). Accuracy measures *how often* you played the engine's top choice (a percentage). A game with 85% accuracy and 60 ACPL has a few big mistakes. A game with 85% accuracy and 35 ACPL has many small inaccuracies. Both metrics are useful — accuracy for a quick check, ACPL for targeted improvement. See our [guide to centipawn loss](/blog/what-is-centipawn-loss) for more detail.

### Q: Why is my ACPL so high in the opening?

Opening ACPL spikes usually mean you're playing moves that are theoretically known to be inferior — not blunders, but moves that give your opponent an easier game. Check the "Opening Leaks" section in your FireChess scan to see which positions cost you the most centipawns. Study those specific lines rather than trying to memorize your entire opening repertoire. Even learning3-4 critical positions per opening can drop opening ACPL by10-20 points.

### Q: Does time control affect ACPL?

Absolutely. Rapid and classical games produce lower ACPL because you have time to calculate. Blitz and bullet games inflate ACPL by10-20 points because you're making decisions faster. Always compare ACPL within the same time control — a60 ACPL in blitz is much more impressive than a60 ACPL in rapid.

### Q: Can ACPL predict my chess rating?

ACPL correlates with rating but doesn't predict it directly. Two players with identical ACPL can have very different ratings if one plays sharper positions (higher complexity, naturally higher ACPL) and the other plays quiet systems. However, if your ACPL is consistently20+ points above the typical range for your target rating, improving it will almost certainly help you climb. [Scan your games on FireChess](/analyze) to see how your ACPL compares to your rating peers.
