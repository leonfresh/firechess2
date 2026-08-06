---
title: "Chess Improvement Metrics: Track Your Progress with ACPL, Accuracy & More"
description: "Track your chess improvement with ACPL, accuracy, puzzle ratings, and opening prep. Concrete targets by rating level plus a monthly review checklist."
date: "2026-08-05"
author: "FireChess Team"
tags: ["improvement", "analysis", "centipawn-loss", "accuracy", "fundamentals"]
canonical: https://firechess.com/blog/chess-improvement-metrics-to-track
---

You study openings. You solve tactics puzzles. You play rapid games and review them afterward. But three months later, your rating has barely moved.

Sound familiar? The problem usually isn't effort — it's measurement. You're putting in the work without tracking whether it's actually working. You don't know which part of your game is improving and which is stagnating.

The fix is straightforward: track the right [chess improvement metrics](/blog/what-is-centipawn-loss) every month and let the data guide your study. This guide covers the four numbers that matter most — average centipawn loss, accuracy score, puzzle performance, and opening preparation — with concrete targets for every rating level from 800 to 2000.

---

## Why Most Players Plateau (And How Metrics Fix It)

The club player's improvement cycle usually looks like this: play 20 games, feel like you're getting better, check your rating, see it hasn't moved, get frustrated, repeat. The problem is that "feeling like you're getting better" is not data.

Your rating is a lagging indicator. It moves slowly, it's affected by opponent strength, and it doesn't tell you *why* you lost. A player who drops from 1400 to 1350 might have improved their tactics but regressed in endgames — the rating doesn't show the split.

[Chess metrics](/blog/chess-accuracy-score-explained) solve this by giving you leading indicators. Instead of waiting for your rating to move, you can see your ACPL dropping, your accuracy climbing, and your puzzle solve rate improving weeks before the rating follows.

The key insight: **don't track your rating. Track the metrics that drive your rating.** Rating is the outcome. ACPL, accuracy, and puzzle performance are the inputs. Fix the inputs and the outcome takes care of itself.

### The Four Numbers That Matter

| Metric | What It Measures | Where to Find It | Update Frequency |
|--------|-----------------|-------------------|-----------------|
| **Average Centipawn Loss (ACPL)** | Move quality — how far your moves deviate from the engine's best | [FireChess /analyze](/analyze), Lichess, Chess.com | After every game |
| **Accuracy Score** | Overall game quality as a percentage | [FireChess /analyze](/analyze), Chess.com | After every game |
| **Puzzle Rating** | Tactical pattern recognition speed and accuracy | FireChess, Lichess, Chess.com | After every session |
| **Opening Preparation** | Whether you're following theory or improvising | [FireChess scanner](/analyze), opening tree | Weekly review |

These four numbers cover the three pillars of chess skill: tactics (puzzle rating), execution (ACPL + accuracy), and preparation (opening tree). If all four are improving, your rating will follow. If one is lagging, you know exactly where to focus.

---

## Metric 1: Average Centipawn Loss (ACPL)

[ACPL](/blog/what-is-centipawn-loss) is the single most revealing chess metric. It measures the average difference between your moves and the engine's best move, in centipawns (hundredths of a pawn). Lower is better.

If you play 40 moves and your ACPL is 60, that means on average each of your moves gave up 0.6 pawns worth of advantage. That adds up to 24 pawns over the game — roughly equivalent to giving up two full pieces through accumulated inaccuracy.

### What ACPL Actually Tells You

ACPL captures *consistency*, not brilliance. A player who makes 38 decent moves and 2 blunders (ACPL ~80) plays worse overall than a player who makes 40 slightly above-average moves (ACPL ~35). The first player might find a brilliant sacrifice, but the blunders cancel it out.

This is why ACPL is more useful than accuracy for tracking improvement. Accuracy uses a logarithmic scale that compresses differences at the top end — two players with 78% and 82% accuracy might have very different ACPLs. ACPL gives you the raw, unsmoothed picture.

### ACPL Targets by Rating

In over 14,000 FireChess scans, here's what we see at each level:

<chess-position fen="r1bqk2r/pppp1ppp/2n5/8/1bBPn3/2N2N2/PP3PPP/R1BQK2R w KQkq - 0 8" caption="Italian Game after 7...Nxe4?? — a typical 1200-level blunder. Black captures the e-pawn but loses the knight to Qb3 or a4. This single move might cost 200+ centipawns." orientation="white" moves="Qb3,a4"></chess-position>

The position above shows what drives high ACPL at the 1200 level. Black played 7...Nxe4, grabbing a pawn that looks free but loses a piece to Qb3 (attacking f7 and b7) or a4 (trapping the bishop). One tactical oversight, 200+ centipawns gone in a single move.

Here's what ACPL looks like across rating levels:

| Rating | Typical ACPL | What It Means |
|--------|-------------|---------------|
| **800-1000** | 120-200 | Hanging pieces regularly, missing 1-move tactics |
| **1000-1200** | 80-120 | Occasional blunders, poor endgame technique |
| **1200-1400** | 55-80 | Fewer blunders, but positional misunderstandings |
| **1400-1600** | 35-55 | Solid play with occasional inaccuracies |
| **1600-1800** | 25-40 | Good consistency, small positional errors |
| **1800-2000** | 18-30 | Strong play, only subtle inaccuracies |
| **2000+** | 10-20 | Near-perfect execution, very few mistakes |

**Your target:** Drop your ACPL by 10-15 points from wherever you are now. A 1400 player going from 65 ACPL to 50 ACPL will see rating gains within 2-3 weeks.

### Q: How to Track ACPL

Upload your games to [FireChess's scanner at /analyze](/analyze). After each rapid or classical game, check your ACPL. Don't track blitz — the time pressure inflates ACPL and gives you noisy data.

Calculate your rolling 10-game ACPL average. Plot it weekly. If it's trending down, your play quality is improving regardless of what your rating says. If it's flat or climbing, you need to identify the leak.

**The ACPL breakdown on FireChess** shows exactly where your centipawns are leaking. Open any scanned game and look at the move-by-move list — every move is rated with a FireChess badge (brilliant, best, good, book, inaccuracy, mistake, or blunder). If you see clusters of red and amber badges in the opening, your preparation needs work. If they're concentrated in the endgame, your technique needs drilling.

---

## Metric 2: Accuracy Score

Your [accuracy score](/blog/chess-accuracy-score-explained) is a percentage that summarizes how closely your moves matched the engine's top choices. Unlike ACPL (which is a raw average), accuracy uses a logarithmic curve — the difference between 90% and 95% accuracy is much harder to achieve than the difference between 60% and 65%.

Accuracy is the number most platforms show you prominently. Chess.com gives you a "Game Review" accuracy. Lichess shows it after analysis. FireChess displays it alongside your ACPL and move badges.

### Q: Why Accuracy Alone Is Misleading

Here's the trap: accuracy compresses information. A player with 72% accuracy and a player with 78% accuracy might look similar, but their games could be completely different. The 72% player might play 35 perfect moves and 5 blunders. The 78% player might play 40 slightly inaccurate moves with no blunders.

This is why you should track [ACPL](/blog/what-is-centipawn-loss) alongside accuracy. ACPL tells you the *magnitude* of your errors. Accuracy tells you the *frequency* of good moves. Together, they paint the full picture.

### Accuracy Targets by Rating

| Rating | Typical Accuracy | FireChess Move Profile |
|--------|-----------------|----------------------|
| **800-1000** | 40-55% | Many ?? Blunder and ? Mistake badges |
| **1000-1200** | 50-65% | Mix of ?!, ?, and occasional ! Best badges |
| **1200-1400** | 60-72% | Fewer blunders, more ?! Inaccuracy badges |
| **1400-1600** | 68-80% | Mostly ✓ Good and ! Best, occasional ?! |
| **1600-1800** | 75-85% | Consistent ! Best and ✓ Good, rare mistakes |
| **1800-2000** | 80-90% | Predominantly ! Best, few inaccuracies |
| **2000+** | 85-95% | Near-perfect, occasional !! Brilliant moves |

<chess-position fen="rnbq1rk1/4bppp/p2p1n2/1p2p3/4P3/1NN1B3/PPP1BPPP/R2Q1RK1 w - - 0 10" caption="Sicilian Najdorf after 9...b5 — a positional inaccuracy that drops White's advantage from +0.8 to +0.3. This kind of move shows up as a ?! Inaccuracy badge on FireChess, costing 25-75 centipawns. Not a blunder, but it adds up." orientation="white"></chess-position>

The position above illustrates a typical 1400-1600 accuracy leak. Black played 9...b5, which looks natural (expanding on the queenside) but weakens the c6 square and allows White to build pressure with Rc1 and a4. This single move isn't catastrophic — it costs maybe 30-40 centipawns — but over a 40-move game, several such inaccuracies push ACPL from 35 to 55 and accuracy from 78% to 68%.

### Q: How to Use Accuracy for Improvement

After every game, upload it to [FireChess at /analyze](/analyze) and note your accuracy score. But don't just look at the number — look at the *distribution* of move badges.

The FireChess badge summary at the top of your scan results shows something like: **Best 14 · Book 6 · Good 8 · Inaccuracy 5 · Mistake 2 · Blunder 1 · ACPL 47.3**

That breakdown is more useful than the accuracy number alone. A player with 5 inaccuracies and 2 mistakes needs different training than a player with 12 good moves and 3 blunders. The first player needs [positional understanding](/blog/chess-middlegame-strategy-finding-a-plan). The second needs [tactical alertness](/blog/how-to-stop-blundering-chess).

**Action step:** Sort your last 20 scanned games by accuracy on FireChess. Find the bottom 5. What do they have in common? Opening mistakes? Endgame collapses? Time pressure blunders? That pattern tells you exactly what to study next.


---

## Metric 3: Puzzle Performance

Your puzzle rating is the purest measure of [tactical pattern recognition](/blog/chess-pattern-recognition). Unlike game ratings (which are affected by time management, opening preparation, and stamina), puzzle rating isolates one skill: can you find the best move in a tactical position?

Puzzle performance predicts game performance more reliably than most players expect. A 1600-rated player with a 1900 puzzle rating is about to break through. A 1600-rated player with a 1400 puzzle rating has a tactics leak that's holding them back.

### What to Track

Track three things from your puzzle sessions:

1. **Puzzle rating** — the overall number
2. **Solve rate** — what percentage of puzzles you get right on the first try
3. **Speed** — how long you spend on each puzzle (longer isn't always better, but consistently fast-wrong is a red flag)

### Puzzle Rating vs Game Rating

The gap between your puzzle rating and your game rating tells a story:

| Puzzle vs Game Rating Gap | What It Means | What to Study |
|--------------------------|---------------|---------------|
| **Puzzle rating 300+ higher** | Normal — puzzles are easier than games | Nothing unusual, keep solving |
| **Puzzle rating 100-300 higher** | Healthy range for most players | Maintain current routine |
| **Puzzle rating within 100** | You see tactics but miss them in games | Work on [time management](/blog/chess-time-management-tips) and board vision |
| **Puzzle rating below game rating** | Rare — usually means you rush puzzles | Slow down, calculate deeper |

### The Tactical Pattern Gap

The biggest insight from [FireChess scans](/analyze) is that most club players don't miss tactics because they can't calculate — they miss them because they don't *look*. The pattern isn't stored in memory, so the brain doesn't flag the position as tactical.

<chess-position fen="rn2kb1r/pp2pppp/2p2n2/q4b2/2BP4/2N5/PPP1NPPP/R1BQK2R w KQkq - 4 7" caption="Scandinavian Defense after 6...Bf5?? — Black develops naturally but allows 7.Bxf7+! winning a pawn and exposing the king. This pattern (bishop sacrifice on f7 with queen support) appears in dozens of openings. If you solve it in puzzles, you should spot it in games." orientation="white" moves="Bxf7"></chess-position>

The position above shows a pattern that appears in countless games: the bishop sacrifice on f7. After 6...Bf5, White plays 7.Bxf7+! Kxf7 (forced) and then Ng5+ or Qb3+ picks up material with a devastating attack. If you've solved 50 puzzles with this motif, you should find it in 5 seconds over the board.

If you *can't* find it in a game but *can* find it in a puzzle, the issue is attention, not knowledge. Your brain doesn't recognize the game position as "tactical" because the context is different — in a puzzle, you *know* a tactic exists. In a game, you have to sense it.

**Fix:** Before every move in a game, ask: "Is there a check, capture, or threat I should consider?" This 5-second habit activates the same pattern-recognition pathways that puzzles train. See our guide on [building a thinking process](/blog/chess-thinking-process) for the full pre-move checklist.

### Q: How to Structure Puzzle Sessions

- **Daily:** 15-20 minutes of rated puzzles on any platform
- **Focus sessions:** 30 minutes on one motif (pins, forks, discovered attacks) — use themed puzzle sets
- **Weekly review:** Check your solve rate. If it's above 80%, the puzzles are too easy — increase difficulty. Below 50% means they're too hard — drop down a level

The goal isn't to solve puzzles fast. It's to solve them *correctly* and *recognize the pattern instantly*. Speed comes naturally after the pattern is stored.


---

## Metric 4: Opening Preparation

Most club players either memorize openings blindly or improvise from move 3. Both approaches cost centipawns. The metric that captures this is your **opening accuracy** — how many of your first 15 moves match established theory.

FireChess tracks this automatically. When you scan a game, the opening moves are tagged as "Book" (matching known theory) or flagged with a badge if they deviate. If your first 10 moves produce 3 inaccuracies, that's not a middlegame problem — it's an [opening preparation](/blog/chess-opening-principles) problem.

### Q: How to Measure Opening Preparation

Use the [FireChess scanner](/analyze) to find your opening leaks:

1. Upload your last 20 games
2. Look at the "Opening Leaks" section — it groups every repeated position you've played incorrectly
3. Count how many times you left theory early (before move 10) and what it cost you

If you're consistently leaving theory by move 6 in the Sicilian, you don't need to memorize 20 moves of Najdorf theory. You need to learn the *ideas* behind the first 8 moves so you don't drift into bad positions. Our guide on [studying openings without memorizing](/blog/how-to-study-chess-openings-without-memorizing) covers this approach.

<chess-position fen="rnbq1rk1/p1p1bpp1/1p2p2p/3n4/3P3B/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 9" caption="Queen's Gambit Declined after 8...Nxd5 — a critical position where White must know the right continuation. The difference between 9.Bxe7 (best, +0.6) and 9.Nxd5 (inaccuracy, +0.1) is 50 centipawns. That's one move separating a "good" game from a mediocre one." orientation="white" moves="Bxe7,Nxd5"></chess-position>

The QGD position above is the kind of moment where preparation pays off. After 8...Nxd5, White has several options. 9.Bxe7 is the mainline — it captures the bishop and maintains a small but lasting advantage. 9.Nxd5 exd5 is also playable but equalizes more quickly. A player who knows the ideas plays 9.Bxe7 without hesitation. A player who's improvising might spend 3 minutes here and still pick the wrong move.

### Opening Accuracy Targets

| Rating | Book Moves (out of first 15) | What to Focus On |
|--------|------------------------------|-----------------|
| **800-1200** | 4-7 moves | Learn the *ideas* of your openings, not lines |
| **1200-1400** | 6-9 moves | Know the main plans for both sides |
| **1400-1600** | 8-11 moves | Study the critical positions where theory branches |
| **1600-1800** | 10-13 moves | Learn sidelines and anti-systems opponents play |
| **1800+** | 12-15 moves | Deep preparation in your main openings |

**Don't memorize — understand.** A 1400 player who knows *why* they play d4-c4-Nc3 in the Queen's Gambit will outperform one who memorizes 15 moves of theory but doesn't understand the resulting middlegame plans. Use [your opening tree](/blog/my-opening-tree-chess-repertoire) to identify the positions you actually reach, then study those specific positions rather than entire opening databases.

### The Repertoire Audit

Once a month, scan 10+ games with [FireChess](/analyze) and look at your opening tree. It shows every position you've reached, how many times, and your win rate from each. If you've played the Italian Game 15 times with a 40% win rate, that's a leak. Either study the critical positions deeper or switch to an opening that fits your style better.

See our guide on [finding opening weaknesses](/blog/how-to-find-opening-weaknesses) for a step-by-step audit process.


---

## Your Monthly Chess Improvement Dashboard

Here's the review process that separates improving players from stagnant ones. Do this on the first of every month — it takes 20 minutes and tells you exactly what to study next.

### Step 1: Gather Your Numbers

Scan your last 20 rapid or classical games on [FireChess /analyze](/analyze). Record:

- **Rolling 10-game ACPL** — average of your last 10 games
- **Accuracy distribution** — percentage of games above 70% accuracy
- **Opening book moves** — average number of theory moves in the first 15
- **Blunder rate** — number of ?? Blunder badges per game

### Step 2: Compare to Last Month

The numbers only matter in context. Here's a tracking template:

<svg viewBox="0 0 660 340" xmlns="http://www.w3.org/2000/svg" style="background:#0a0e1a;border-radius:12px;font-family:system-ui,sans-serif">
  <text x="330" y="30" text-anchor="middle" fill="#f1f5f9" font-size="16" font-weight="600">Monthly Improvement Tracker — Sample 3-Month Progress</text>
  <text x="330" y="50" text-anchor="middle" fill="#64748b" font-size="11">Club player starting at 1350 rating, 75 ACPL</text>

  <!-- Grid lines -->
  <line x1="80" y1="80" x2="80" y2="290" stroke="#1e293b" stroke-width="1"/>
  <line x1="80" y1="290" x2="620" y2="290" stroke="#1e293b" stroke-width="1"/>
  <line x1="80" y1="220" x2="620" y2="220" stroke="#1e293b" stroke-width="1"/>
  <line x1="80" y1="150" x2="620" y2="150" stroke="#1e293b" stroke-width="1"/>

  <!-- Y axis labels -->
  <text x="70" y="295" text-anchor="end" fill="#64748b" font-size="10">1350</text>
  <text x="70" y="225" text-anchor="end" fill="#64748b" font-size="10">1400</text>
  <text x="70" y="155" text-anchor="end" fill="#64748b" font-size="10">1450</text>
  <text x="70" y="85" text-anchor="end" fill="#64748b" font-size="10">1500</text>

  <!-- Month labels -->
  <text x="170" y="310" text-anchor="middle" fill="#64748b" font-size="11">Month 1</text>
  <text x="350" y="310" text-anchor="middle" fill="#64748b" font-size="11">Month 2</text>
  <text x="530" y="310" text-anchor="middle" fill="#64748b" font-size="11">Month 3</text>

  <!-- Rating line (green) -->
  <polyline points="170,290 350,230 530,160" fill="none" stroke="#10b981" stroke-width="2.5"/>
  <circle cx="170" cy="290" r="5" fill="#10b981"/>
  <circle cx="350" cy="230" r="5" fill="#10b981"/>
  <circle cx="530" cy="160" r="5" fill="#10b981"/>
  <text x="170" y="283" text-anchor="middle" fill="#10b981" font-size="10">1350</text>
  <text x="350" y="223" text-anchor="middle" fill="#10b981" font-size="10">1395</text>
  <text x="530" y="153" text-anchor="middle" fill="#10b981" font-size="10">1455</text>

  <!-- ACPL line (red, inverted - lower is better) -->
  <polyline points="170,150 350,200 530,260" fill="none" stroke="#e13c48" stroke-width="2.5" stroke-dasharray="6,3"/>
  <circle cx="170" cy="150" r="5" fill="#e13c48"/>
  <circle cx="350" cy="200" r="5" fill="#e13c48"/>
  <circle cx="530" cy="260" r="5" fill="#e13c48"/>
  <text x="170" y="143" text-anchor="middle" fill="#e13c48" font-size="10">72</text>
  <text x="350" y="193" text-anchor="middle" fill="#e13c48" font-size="10">58</text>
  <text x="530" y="253" text-anchor="middle" fill="#e13c48" font-size="10">43</text>

  <!-- Legend -->
  <line x1="180" y1="330" x2="210" y2="330" stroke="#10b981" stroke-width="2.5"/>
  <text x="215" y="334" fill="#f1f5f9" font-size="10">Rating (higher = better)</text>
  <line x1="380" y1="330" x2="410" y2="330" stroke="#e13c48" stroke-width="2.5" stroke-dasharray="6,3"/>
  <text x="415" y="334" fill="#f1f5f9" font-size="10">ACPL (lower = better)</text>
</svg>

Notice how the ACPL starts dropping in Month 1, but the rating doesn't meaningfully move until Month 2. This is the lag effect — your play quality improves first, then the rating catches up. If you'd stopped tracking in Month 1 because "my rating hasn't changed," you'd have missed the improvement signal.

### Step 3: Set Next Month's Targets

Based on the data, pick ONE metric to focus on. Don't try to improve all four simultaneously — that's a recipe for spreading yourself thin.

**Decision tree:**
- ACPL above your rating's typical range? → Focus on [blunder reduction](/blog/how-to-stop-blundering-chess)
- Accuracy below target? → Focus on [middlegame strategy](/blog/chess-middlegame-strategy-finding-a-plan)
- Puzzle rating stagnating? → Increase puzzle volume and focus on [pattern recognition](/blog/chess-pattern-recognition)
- Book moves below target? → Study [opening principles](/blog/chess-opening-principles) for your main repertoire

### Step 4: Log and Compare

Keep a simple spreadsheet or document with your monthly numbers. After 3 months, the trend is unmistakable — and it's the most motivating thing you can see. Numbers going in the right direction mean you're improving, even if the rating graph has noise in it.


---

## Putting It All Together: The Improvement Flywheel

The four metrics feed into each other. Better [opening preparation](/blog/chess-opening-principles) means you reach better middlegame positions, which lowers your ACPL. Solving more [tactical puzzles](/blog/chess-pattern-recognition) means you spot more in-game tactics, which raises your accuracy. Reviewing with [engine analysis](/blog/how-to-read-chess-engine-analysis) shows you *where* your centipawns leak, which directs your study.

This is the improvement flywheel: **study → play → measure → study the right thing → play better → measure again.**

The players who break through rating plateaus aren't smarter or more talented. They're the ones who measure what matters and direct their effort accordingly. Stop guessing what to study. [Scan your games on FireChess](/analyze), track the four metrics, and let the data tell you where the next 100 rating points are hiding.

---

## Frequently Asked Questions

### Q: What is the most important chess metric to track?

Average centipawn loss (ACPL) is the single most revealing metric because it measures move quality directly. Unlike accuracy (which uses a compressed scale), ACPL gives you raw feedback on how far your moves deviate from the engine's best. Track your rolling 10-game ACPL average — if it's dropping, you're improving. See our [complete ACPL guide](/blog/what-is-centipawn-loss) for rating-specific targets.

### Q: How do I find my centipawn loss for each game?

Upload your PGN to [FireChess's scanner at /analyze](/analyze). After the scan completes, each game shows your ACPL, accuracy score, and a move-by-move breakdown with FireChess badges (brilliant, best, good, book, inaccuracy, mistake, blunder). You can also find ACPL on Lichess (Analysis → Computer Analysis) and Chess.com (Game Review).

### Q: What is average centipawn loss and how does it help my improvement?

Average centipawn loss (ACPL) measures the average deviation of your moves from the engine's top choice, in hundredths of a pawn. A lower ACPL means more consistent, higher-quality play. For club players, tracking ACPL over time reveals improvement trends that rating alone misses — your ACPL might drop 15 points before your rating moves, giving you early confirmation that your training is working. Our [ACPL-by-rating guide](/blog/average-centipawn-loss-by-rating) has specific targets for every level.

### Q: How often should I check my chess metrics?

Check ACPL and accuracy after every rapid or classical game. Do a weekly summary of your rolling averages. Perform a full monthly review using the dashboard template above — compare all four metrics to last month and set one focus area for the next month. Don't check after blitz games — the time pressure makes the data noisy and unreliable.

### Q: Can I guess my Elo from my playing style?

Yes — your [move quality metrics](/blog/guess-the-elo-chess) correlate strongly with rating. A player averaging 40 ACPL and 75% accuracy typically plays at the 1400-1600 level, regardless of their actual rating. If your metrics are above your rating's typical range, a rating jump is coming. If they're below, you have a specific area to work on. FireChess's [Elo estimation tool](/blog/guess-elo-from-pgn) analyzes your move patterns to estimate your playing strength.

### Q: What is a good accuracy score for a chess beginner?

A beginner (800-1000 rating) typically scores 40-55% accuracy. If you're consistently above 55%, you're playing above your level and your rating will climb. Below 40% suggests you're hanging pieces or missing basic tactics — focus on [blunder reduction](/blog/how-to-stop-blundering-chess) before anything else. Accuracy targets increase with rating: 1200 players average 60-72%, while 1600 players hit 68-80%.

### Q: How do I track improvement if my rating keeps fluctuating?

Rating fluctuation is normal — it doesn't mean you're not improving. That's exactly why you should track ACPL, accuracy, and puzzle performance alongside rating. If your ACPL drops from 65 to 50 over two months but your rating only moves from 1380 to 1410, the metrics tell the real story. Your play quality improved significantly; the rating will catch up. Use the [monthly dashboard template](#step-2-compare-to-last-month) above to track trends, not individual data points.
