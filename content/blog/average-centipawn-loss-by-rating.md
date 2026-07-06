---
title: "Average Centipawn Loss by Rating Level"
description: "Complete guide to average centipawn loss (ACPL) ranges by chess rating from beginner to grandmaster, plus how to benchmark and improve yours."
date: "2026-07-05"
author: "FireChess Team"
tags: ["analysis", "fundamentals", "improvement", "centipawn-loss"]
canonical: https://firechess.com/blog/average-centipawn-loss-by-rating
---

You just played 10 rapid games and your average centipawn loss (ACPL) was 65. Is that good? Bad? Average? The answer depends entirely on your rating — and knowing what's normal for your level is the first step to actually using centipawn loss to improve.

Average centipawn loss is the most reliable objective measure of playing strength because it strips away the noise of openings, time controls, and opponent quality. A 1400-rated player who averages 55 ACPL is genuinely playing better than a 1400 who averages 85 — regardless of who wins more games. Let's break down exactly what ranges to expect at every level.

## Average Centipawn Loss by Rating: The Full Table

Here are the typical ACPL ranges based on analysis of thousands of rated games across major chess platforms:

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

**ACPL 120+ (Beginner):** Missing tactics multiple times per game. Typically 3–5 blunders per game where pieces are straight-up dropped or simple forks are missed. Games often end by hanging a queen or missing mate in 2.

**ACPL 70–90 (Club, 1200–1400):** The most common range. You see basic one-move threats but regularly miss two-move combinations. You lose games from positional drift rather than outright blunders — a slow accumulation of small inaccuracies rather than a single catastrophic move.

**ACPL 45–55 (1800 level):** Tactical awareness is solid. Your mistakes come more from positional misjudgment than piece safety. When you blunder, it's usually from time pressure or complex calculation, not missing a simple hanging piece. Most losses are from strategic outplays, not giveaways.

**ACPL 15–25 (GM level):** Mistakes are subtle — a slightly mis-evaluated pawn break, a piece placed on the wrong square in a closed position, or choosing the wrong plan from three roughly equal options. Games are decided by microscopic advantages that compound over 40+ moves.

## Why Every Platform's ACPL Differs

If you've checked your centipawn loss on Lichess versus Chess.com, you've noticed the numbers don't match. That's normal:

- **Lichess** uses Stockfish at a fixed depth (typically 22 ply) for analysis. Their ACPL tends to be lower because the engine finds *good* moves but not always the *absolute best*.
- **Chess.com** uses a stronger Stockfish (Cloud Engine) at higher depths. Their centipawn loss numbers tend to be higher — sometimes 10–20% higher than Lichess for the same game — because the engine finds finer distinctions between moves.
- **FireChess** uses Stockfish 18 at balanced depth, comparable to Chess.com. The ACPL table above is calibrated for FireChess-level analysis strength.

**Rule of thumb:** If you're used to Lichess numbers, add roughly 10% when comparing to FireChess or Chess.com ACPL. A "good" 40 ACPL on Lichess might register as 45–48 on FireChess.

## ACPL by Time Control

Your centipawn loss isn't constant across all time controls. Here's what typical ACPL inflation looks like:

| Time Control | ACPL vs. Classical Baseline |
|---|---|
| Classical (30+ min) | Baseline (your true accuracy) |
| Rapid (10–15 min) | +5–10 cp |
| Blitz (3–5 min) | +15–25 cp |
| Bullet (1 min) | +30–50 cp |

A 1600-rated player might average 45 ACPL in classical, 55 in rapid, and 70 in blitz. This doesn't mean they're a different player — it means time pressure forces imperfect decisions.

**Practical use:** Compare yourself only within the same time control. Don't benchmark your blitz ACPL against a classical ACPL table. If you want to know your "true" playing strength, look at your classical or rapid games.

## ACPL by Game Phase

Here's an important insight most players miss: your centipawn loss is not evenly distributed across the game.

| Phase | Typical ACPL Contribution | Why |
|---|---|---|
| Opening (moves 1–15) | Lowest | Memorized lines, simple development goals |
| Middlegame (moves 15–35) | Highest | Complex calculations, tactics, time pressure |
| Endgame (moves 35+) | Medium | Fewer pieces, but precise technique required |

A typical club player's game breakdown might look like:
- Opening ACPL: **35** (mostly theory, reasonably accurate)
- Middlegame ACPL: **80** (where the damage happens)
- Endgame ACPL: **55** (some technique, some time-scramble)

The middlegame spike is where improvement happens fastest. If your middlegame ACPL is double your opening ACPL, you're not running out of theory — you're running out of a plan.

## How to Calculate Your Average Centipawn Loss

To get a reliable ACPL reading, follow these guidelines:

1. **Minimum sample: 10 games.** A single game can swing wildly. A game where you got an overwhelming position early and cruised might show 40 ACPL. The next game where you had to defend a tricky Sicilian might be 90. Neither alone tells you anything.
2. **Same time control.** Mixing bullet and classical games gives you a meaningless average.
3. **Filter out obvious outliers.** A game where you flagged in a winning position with 2 seconds left isn't representative of your skill.
4. **Use FireChess's game scanner.** Upload your Lichess or Chess.com username and FireChess analyzes your last N games, breaking down centipawn loss by phase, opening, and time control automatically. You get a report with patterns, not just a number.

## Still Not Sure If Your ACPL Is "Good"?

Here's a simple rule: **your ACPL should be trending downward.** If you were averaging 75 a month ago and now you're down to 65, you're improving — regardless of whether your rating has moved yet. Rating is a lagging indicator; ACPL is a leading indicator.

Track these milestones:
- **ACPL under 70:** You're playing above your rating for most club levels.
- **ACPL under 50:** You're playing at expert strength, even if your rating hasn't caught up.
- **ACPL under 30:** You're producing master-level moves on a regular basis.

The rating will follow the accuracy. Focus on reducing your biggest mistakes — those 100+ cp swings — and your average will drop naturally.

---

*Upload your games to FireChess for a free analysis report showing your ACPL, accuracy score, and worst moves broken down by phase.*
