---
title: "What Is Centipawn Loss in Chess? The Complete Guide"
description: "Centipawn loss explained simply — what it measures, how chess engines calculate it, and how to use average centipawn loss (ACPL) to track improvement and find your biggest mistakes."
date: "2026-07-11"
author: "FireChess Team"
tags: ["analysis", "fundamentals", "improvement", "centipawn-loss"]
canonical: https://firechess.com/blog/what-is-centipawn-loss
---

You've just finished a hard-fought 45-minute game. You open the analysis board, run the engine, and there it is: **"Average Centipawn Loss: 72."**

What does that number actually mean? Is 72 good? Bad? How is it even calculated? And why should you care?

If you've ever stared at a centipawn loss score and felt more confused than informed, you're not alone. The concept sits at the centre of modern chess analysis — every major platform from Lichess to Chess.com to FireChess uses it — but most players don't fully understand what the number represents or how to use it.

This guide fixes that. By the end, you'll know exactly what centipawn loss is, how Stockfish assigns those mysterious numbers, and — most importantly — how to use centipawn loss to find your biggest weaknesses and improve faster.

---

## What Is a Centipawn? The Unit of Chess Analysis

The word "centipawn" is a portmanteau of **centi** (one-hundredth) and **pawn**. One centipawn equals 1/100 of a pawn's value on the chessboard.

Think of it as the smallest meaningful unit of chess advantage. Just as a gram measures tiny amounts of mass and a cent measures tiny amounts of currency, a centipawn measures tiny advantages and disadvantages in a chess position.

**The baseline assumption:** A pawn is worth 100 centipawns. This isn't arbitrary — it's a convention that emerged from decades of computer chess research. The five traditional material values map as follows:

| Piece | Centipawn Value |
|-------|-----------------|
| Pawn | 100 cp |
| Knight | 320 cp (≈3.2 pawns) |
| Bishop | 330 cp (≈3.3 pawns) |
| Rook | 500 cp (5 pawns) |
| Queen | 900 cp (9 pawns) |

These are starting points. The engine adjusts these values dynamically based on position, piece activity, king safety, pawn structure, and dozens of other factors. A knight on a perfect outpost might be evaluated at 350 cp; the same knight stuck on the edge of the board might drop to 280 cp.

**Centipawn loss**, then, measures the difference between your move and the engine's best move, expressed in these units. If the best move in a position gives the engine +0.50 (a 50-centipawn advantage) and your move gives +0.20, your centipawn loss for that move is 30 cp — the difference between the optimal and what you played.

---

## How Chess Engines Calculate Centipawn Loss

This is where most explanations get fuzzy, so let's be precise.

### Step 1: The Engine Evaluates the Position Before Your Move

When you ask Stockfish to analyse a game, it looks at the position just before your move and assigns it a numerical evaluation. This is the familiar "eval bar" number you see during analysis — a positive number means White is better, a negative number means Black is better.

A position evaluated at **+0.73** means White has an advantage equivalent to 73 centipawns — roughly three-quarters of a pawn. A position at **-1.20** means Black is ahead by about the equivalent of one pawn and 20 centipawns.

### Step 2: The Engine Considers All Possible Moves

Stockfish examines every legal move in the position and calculates the best evaluation it can achieve after each one. It does this by looking ahead many moves — typically 20-30 ply (half-moves) deep in online analysis — and using a search algorithm called alpha-beta pruning combined with neural network evaluation.

For each candidate move, the engine asks: *"If I play this, what's the best possible outcome for both sides over the next 20+ moves?"*

### Step 3: Centipawn Loss = Best Evaluation — Your Move's Evaluation

The formula is straightforward:

```
Centipawn Loss = Evaluation(Best Move) - Evaluation(Your Move)
```

Adjusted for perspective: if the best move evaluates to +1.00 and your move evaluates to +0.70, your centipawn loss is **30 cp**. You gave up 30 centipawns of advantage compared to the optimal move.

The engine typically normalises this so it's always displayed as a positive number (the *loss* you incurred). A "centipawn loss of 45" means you lost 45 centipawns of advantage relative to the best move in that position.

### A Concrete Example

<chess-position fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" caption="Starting position — evaluation is 0.00, perfectly equal. Any deviation from best play starts accumulating centipawn loss." />

From the starting position, the best move is widely accepted as 1.e4 or 1.d4 (evaluation roughly +0.20 for White's first-move advantage). If you play 1.a3, the evaluation drops to roughly 0.00, and your centipawn loss for that move is about **20 cp** — you gave up 20 centipawns of White's starting advantage with a single unnecessary move.

Each subsequent move adds to or subtracts from your cumulative centipawn loss. Your **average centipawn loss (ACPL)** is simply the total centipawn loss across all your moves divided by the number of moves you played.

<chess-position fen="r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" caption="The Italian Game after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 — a balanced opening with near-zero centipawn loss for both sides if played correctly." />

---

## What Different Centipawn Loss Values Look Like on the Board

Numbers on a page are abstract. Let's put them on a real chessboard so you can see what different centipawn loss scores represent.

### Centipawn Loss 0-15: Near-Perfect Play

At this level, you're finding the best move or something close to it. This is the range of grandmaster performance in most positions. A 10-centipawn loss means you played a move that's objectively almost as good as the engine's first choice — maybe you chose a slightly less optimal square for your bishop, or a different pawn advance that's still sound.

### Centipawn Loss 15-40: Small Inaccuracies

This is the range of strong club players and experts (1800-2200 rating). You're not blundering — you're just not finding the most precise continuation. A 25-centipawn loss typically means you played a solid-developing move when a more aggressive or more subtle move was available.

### Centipawn Loss 40-80: Clear Mistakes

This is the most common centipawn loss range for intermediate club players (1200-1600). You're making mistakes that give away roughly half a pawn to a full pawn of advantage. These are often positional errors — misplacing a piece, trading the wrong pieces, or pushing a pawn that creates a weakness.

### Centipawn Loss 80-150: Blunders

A centipawn loss over 80 is almost always a tactical mistake or a severe positional misjudgment. At 100+ cp, you've essentially given away a full pawn worth of advantage — often through a hanging piece, a missed fork, or a serious positional concession.

### Centipawn Loss 150+: Game-Losing Mistakes

At this level, you've probably dropped a full piece or allowed a decisive attack. A 300+ centipawn loss almost always means you hung a knight or bishop, missed a forced mate, or walked into a devastating tactic.

<chess-position fen="rnb1kbnr/pppp1ppp/8/4q3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4" caption="Black's queen has just been captured by the pawn on e4 after Black blundered by moving it to e5 without considering the pawn capture. Centipawn loss for Black: +950 cp — a full queen lost." analysis="true" />

---

## Centipawn Loss vs. Accuracy Percentage

Many chess analysis platforms, including FireChess, display both an **accuracy percentage** and an **average centipawn loss (ACPL)** for each game. People often ask: "Aren't they the same thing?"

They're correlated, but they measure different things.

**Average centipawn loss** is the raw mathematical average of how many centipawns you gave up per move. It's an absolute number — 55 ACPL means the same thing game to game, regardless of how sharp or quiet the position was.

**Accuracy percentage** is a normalised score that converts centipawn loss into a 0-100% scale based on how close your moves were to the engine's best. It's designed to be more intuitive: 95% accuracy means you played at an elite level; 60% means you were struggling.

| ACPL | Typical Accuracy (FireChess) | What It Means |
|------|------------------------------|---------------|
| 10-20 | 95-99% | Grandmaster level |
| 25-35 | 90-94% | Master / IM level |
| 40-50 | 85-89% | Expert / strong club |
| 55-70 | 78-84% | Club player (1400-1600) |
| 70-90 | 72-78% | Casual club player |
| 90-150 | 65-72% | Beginner / intermediate |
| 150+ | Below 65% | Complete beginner |

The relationship isn't perfectly linear. A game with one 300-centipawn blunder and 39 perfect moves might give you 55 ACPL but 94% accuracy. The blunder drags down the ACPL more than it drags down the percentage, because accuracy penalises blunders heavily but not infinitely.

**Practical guidance:** Use ACPL for tracking long-term improvement (it's more granular) and accuracy for quick game-to-game comparisons (it's more intuitive).

For a deeper explanation of the accuracy metric itself, see our guide to [chess accuracy scores explained](/blog/chess-accuracy-score-explained).

---

## Common Misconceptions About Centipawn Loss

Let's clear up the misunderstandings that cause the most confusion.

### Myth 1: "Low centipawn loss means I played perfectly"

**Reality:** A low centipawn loss means your moves were *close* to the engine's best — but only within the depth the engine was searching. Stockfish at depth 20 might give a move 0.00 evaluation, and at depth 40 the same move could be -0.40. Additionally, centipawn loss doesn't capture the difficulty of finding moves: a 5-centipawn loss in a forcing tactical sequence is less impressive than a 5-centipawn loss in a quiet positional manoeuvring game.

### Myth 2: "A -1.00 mistake is always as bad as another -1.00 mistake"

**Reality:** The same centipawn value can mean very different things depending on the position. Losing 100 centipawns in a dead-equal position means you went from equal to clearly worse — that's a genuine blunder. Losing 100 centipawns from a position where you're already down 300 centipawns (lost a piece) is almost meaningless — you went from losing to losing.

This is why chess engines report **evaluation before and after** your move, not just the delta. A -5.00 position where you play a -5.20 move: the centipawn loss is only 20, but you're still dead lost.

### Myth 3: "You should try to get 0 centipawn loss every game"

**Reality:** Even Magnus Carlsen averages 15-25 ACPL in classical games. Human beings don't play like engines — and they shouldn't try to. The goal isn't perfection (which doesn't exist in a human context); the goal is **reducing your biggest mistakes**. A game with 38 solid moves and one 200-centipawn blunder is a game you need to analyse; a game with 40 moves averaging 45-centipawn loss each is a game where you played at your level consistently.

### Myth 4: "Centipawn loss is comparable across different time controls"

**Reality:** As we cover in our [ACPL by rating guide](/blog/average-centipawn-loss-by-rating), your centipawn loss inflates dramatically as the clock runs out. A player who averages 40 ACPL in classical might average 70 in blitz and 110 in bullet. Always compare within the same time control.

### Myth 5: "All engines give the same centipawn loss"

**Reality:** Different engines and even different engine settings produce different centipawn loss numbers for the same game. Stockfish 18 at depth 22 will report different evaluations than Stockfish 16 at depth 18. Lichess's evaluations tend to be more forgiving than Chess.com's or FireChess's because of depth differences.

<chess-position fen="r1bqk2r/pppp1ppp/2n5/4P3/2B5/5N2/PPP2PPP/RNBQK2R b KQkq - 0 5" caption="White is up a clean pawn thanks to the e5 pawn, with a strong centre and developed pieces. The centipawn advantage here is approximately +100-120 cp. Black's task is to minimise further losses." analysis="true" />

---

## How to Use Centipawn Loss in Your Game Analysis

This is where theory becomes practice. Here's a step-by-step workflow for using centipawn loss to actually improve.

### Step 1: Upload Your Game to FireChess

Import games from Lichess, Chess.com, or paste a PGN. FireChess analyses every move and produces a report with centipawn loss per move, per phase, and per opening.

### Step 2: Find Your Biggest Single Moves

Sort your moves by centipawn loss descending. The top 3-5 moves (your biggest mistakes) are where you should focus your attention. **Don't spread your limited study time across every 20-centipawn inaccuracy — find the 200-centipawn blunders and fix them first.**

### Step 3: Categorise the Mistake

For each big mistake, ask:
- Was it a **tactical blunder** (missed a fork, pin, skewer)?
- Was it a **positional error** (wrong square, bad trade)?
- Was it **time pressure** (flagged, under 30 seconds)?
- Was it an **opening mistake** (wrong response to something unfamiliar)?

Categorise each one. After 10 games, patterns will emerge. If every big mistake is tactical, your tactics training should be your priority. If every big mistake is in the opening, you need opening preparation. If time pressure is the culprit, work on time management.

### Step 4: Calculate Your Phase-by-Phase ACPL

Don't just look at the overall average. Break it down:

| Phase | Your ACPL | Target ACPL (Your Rating) |
|-------|-----------|--------------------------|
| Opening (1-15) | | |
| Middlegame (16-35) | | |
| Endgame (36+) | | |

Most club players find their middlegame ACPL is 1.5x to 2x their opening ACPL. That tells you exactly where your training time should go. If you're scoring 35 ACPL in openings but 80 ACPL in the middlegame, you don't need more opening study — you need middlegame pattern recognition.

### Step 5: Track Your ACPL Over Time

ACPL is a **leading indicator** of improvement. Your rating might stagnate for weeks while your ACPL slowly drops — and then your rating catches up. Track your monthly ACPL average rather than your daily rating, and you'll see progress even before your rating moves.

| Month | ACPL | Rating | Notes |
|-------|------|--------|-------|
| Month 1 | 72 | 1420 | Baseline |
| Month 2 | 65 | 1450 | Tactics work paying off |
| Month 3 | 58 | 1510 | Clear improvement |
| Month 4 | 55 | 1530 | Plateau — time for positional study |

---

## Platform Differences: Lichess vs. Chess.com vs. FireChess

If you've analysed the same game on multiple platforms, you've probably noticed different ACPL numbers. This isn't a bug — it's a feature of different engine configurations.

| Platform | Engine | Typical Depth | ACPL Bias |
|----------|--------|---------------|-----------|
| Lichess | Stockfish (various) | 22 ply | ~10% lower (more forgiving) |
| Chess.com | Cloud Stockfish | 25-30 ply | Baseline |
| FireChess | Stockfish 18 | Balanced depth | Comparable to Chess.com |

**Why the difference:** A weaker engine or lower depth sees fewer tactical possibilities, so it considers more "good enough" moves as equal to the best move. Your centipawn loss appears lower because the engine doesn't penalise you as harshly for missing a deep 25-move tactic.

**What this means for you:** Always benchmark against your own historical data on the *same platform*. Don't compare your Lichess ACPL of 55 to a friend's Chess.com ACPL of 55 — they're measured differently. Use FireChess consistently for your improvement tracking.

---

## FAQ: Quick Answers to Common Questions

### What is a good average centipawn loss?
It depends entirely on your rating and time control. For a 1500-rated player in rapid, anything under 60 is good. For a 2000-rated player, under 45 is expected. See our [ACPL by rating table](/blog/average-centipawn-loss-by-rating) for detailed benchmarks.

### Is centipawn loss the same as accuracy?
No. Accuracy percentage is a normalised score (0-100%) based on centipawn loss. Centipawn loss is the raw mathematical measure. They correlate strongly but aren't identical.

### What is a centipawn loss of 100?
A centipawn loss of 100 means you gave up the equivalent of one full pawn of advantage on a single move. This is a genuine blunder in most positions.

### Why does my centipawn loss vary so much between games?
That's normal. A game where you face a sharp Sicilian Defence and have to calculate complex tactics will naturally produce higher centipawn loss than a slow Queen's Gambit game where you play known theory for 20 moves. Average across 10+ games before drawing conclusions.

### How many games do I need for a reliable ACPL reading?
At least 10 games in the same time control. A single game has too much variance from the specific opening, opponent, and circumstances. Ten games smooth out the noise.

### Can centipawn loss be negative?
No. Centipawn loss is defined as the absolute difference between your move's evaluation and the best move's evaluation. It's always a non-negative number. Some platforms display "0" for the best move, meaning zero centipawns lost.

### Does centipawn loss matter in completely winning positions?
It matters less. When you're up a queen and a rook, a 100-centipawn inaccuracy is irrelevant. Focus your analysis on critical positions — where the game was balanced and a mistake changed the outcome.

### Is centipawn loss useful for openings?
Partially. Opening centipawn loss tends to be very low because there's established theory. A high centipawn loss in the opening usually means you left book and made a mistake. More useful is tracking your centipawn loss *after leaving theory* — that's a measure of how well you understand the resulting middlegame positions.

---

## Quick Reference Table: Centipawn Loss by Impact

| Centipawn Loss | Classification | Typical Cause | Impact on Game |
|----------------|---------------|---------------|----------------|
| 0-15 | Excellent | Best or near-best move | Negligible |
| 15-40 | Inaccuracy | Minor positional imprecision | Small advantage lost |
| 40-80 | Mistake | Tactical miss or positional error | Noticeable advantage lost |
| 80-150 | Blunder | Hanging piece, missed tactic | Often game-deciding |
| 150-300 | Severe blunder | Lost piece, fatal positional concession | Usually loses |
| 300+ | Disaster | Lost queen, missed forced mate | Game over |

---

## Conclusion: From Number to Improvement

Centipawn loss is, at heart, a tool — not a judgment. A number like "72 ACPL" tells you nothing by itself. But 72 ACPL *trending toward 60* tells you you're improving. A 150-centipawn blunder *in the same pattern across three games* tells you exactly what to study. An ACPL spike *in the middlegame but not the opening* tells you where to invest your training time.

The players who improve fastest aren't the ones with the lowest centipawn loss. They're the ones who **use** centipawn loss data to find their specific weaknesses and target them.

Upload your next game to FireChess, scan the centipawn loss breakdown by phase, and find the one pattern that's costing you the most. Fix that one thing. Watch your ACPL drop. Watch your rating follow.

*Ready to analyse your games? Use the [FireChess analysis tool](/analysis) to get a free centipawn loss breakdown with phase-by-phase reporting.*
