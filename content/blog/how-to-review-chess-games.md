---
title: "How to Review Your Chess Games: The Post-Game Analysis Guide"
description: "Learn how to review your chess games like a 2000+ rated player. Step-by-step post-game analysis routine with real positions and FireChess scanner tips."
date: "2026-07-24"
author: "FireChess Team"
tags: ["analysis", "improvement", "game-review", "study-routine"]
canonical: https://firechess.com/blog/how-to-review-chess-games
---

You just lost a game you felt you were winning. You know you should review it — every coach says so, every improvement guide lists it as step one. But when you open the analysis board, you stare at the position after move 30 and think: *now what?*

Most club players treat post-game analysis like homework — something they know they should do but rarely do well. They click through the engine's top lines, nod at the computer's suggestions, and close the tab without learning anything concrete. The result? They make the same mistakes next game.

This guide changes that. By the end, you'll have a **specific, repeatable 10-minute routine** for reviewing any chess game — win, draw, or loss. You'll know exactly what to look for, in what order, and how to turn each review into actionable improvement. We'll walk through real positions from actual games so you can see the process in action.

---

## Why Most Game Reviews Fail (And What to Do Instead)

Here's the uncomfortable truth: **90% of club players review their games wrong.** They either skip review entirely, or they do it in a way that produces zero improvement.

The three most common mistakes:

**Mistake 1: Letting the engine play the game for you.** You click "analyse," watch Stockfish evaluate every move at depth 22, and read the engine's top three lines for each position. This is passive. You're reading a report, not thinking about chess. Your brain doesn't retain information it didn't work to produce.

**Mistake 2: Only looking at blunders.** You find the moves where the eval bar swung by 300+ centipawns, think "oh, I shouldn't have hung my queen," and move on. But the game was already lost two moves before the blunder — when you played a passive move that left your pieces uncoordinated. Blunders are symptoms, not causes.

**Mistake 3: Reviewing without a plan.** You open the board, scroll to move 15, see something interesting, jump to move 30, check the endgame, and close the tab 4 minutes later having learned nothing systematic.

The fix is a structured routine. Here's the one I've seen work for thousands of players who use the [FireChess scanner](/analyze) to review their games.

---

## The 10-Minute Post-Game Review Routine

Every game review follows the same five steps. Do them in order — don't skip ahead.

### Step 1: Replay Without the Engine (2 minutes)

Before you turn on any engine, replay the entire game from memory — or at least the critical moments. Click through the moves on a clean board with no evaluation bar, no arrows, no engine suggestions.

Your goal: **identify the three moments that mattered most.** These are usually:

- The moment the position changed character (opening → middlegame transition, pawn structure change, piece trade that shifted the balance)
- The moment you felt uncertain (you spent 2+ minutes on a single move)
- The moment the game was decided (the blunder, the winning sacrifice, the endgame error)

Write these three moments down — even just the move numbers. "Move 12: I traded bishops and ruined my pawn structure. Move 18: I missed the tactic. Move 25: I misplayed the rook endgame."

This step is crucial because it forces you to think about the game before the engine tells you what to think. In the [FireChess analysis tool](/analyze), you can hide the evaluation bar while replaying, then reveal it after you've formed your own assessment.

### Step 2: Check the Opening Phase (2 minutes)

Now turn on the engine — but focus only on moves 1-15. Compare your moves against the engine's top suggestion for each position.

What you're looking for:

**Opening inaccuracies that created long-term problems.** These are the silent killers. You didn't hang a piece — you played a slightly inaccurate move on move 8 that gave your opponent a permanent positional advantage.

Here's a real example. In an Italian Game, White plays the natural-looking 8.Bg5:

<chess-position fen="r1bqk2r/ppppbppp/2n2n2/4p1B1/2B1P3/3P1N2/PPP2PPP/RN1QK2R b KQkq - 2 5" caption="After 8.Bg5 — looks natural, but Black can equalise easily with ...h6 followed by ...d6. The pin on the knight is temporary, and White has committed the bishop prematurely." orientation="white"></chess-position>

The move Bg5 isn't a blunder — it's an inaccuracy. On the surface it looks fine: you pin the knight, develop a piece, put pressure on f6. But the engine shows that after 8...h6 9.Bh4 d6, Black has a comfortable position because the bishop on h4 is passive and White hasn't achieved anything concrete.

If you're reviewing this game, the key insight isn't "Bg5 is bad" — it's understanding **why** the engine prefers alternatives like 8.a4 or 8.Nbd2. Those moves don't look as natural, but they prepare a more effective plan.

**What to do in FireChess:** Upload your PGN to [/analyze](/analyze) and look at the "Opening Leaks" section in the scan results. It groups every position where your move deviated from theory by more than 50 centipawns. If you see the same position appearing in multiple games, that's your opening study priority.

### Step 3: Find the Critical Moment (3 minutes)

This is the most important step. Every game has a **critical moment** — the position where the evaluation changed most dramatically, or where you had the hardest decision.

Skip to the move where you spent the most time (your chess clock tells you this), or where the centipawn loss spiked highest. Study that position for a full minute without making any moves.

Ask yourself three questions:

1. **What did I think during the game?** (Write it down — your in-game thought process is valuable data)
2. **What does the engine recommend?** (Check the top 2-3 lines)
3. **Why is the engine's move better?** (Don't just memorise the move — understand the idea)

Here's an example from a Sicilian Najdorf. White launches a kingside attack with g4, and Black must decide how to respond:

<chess-position fen="r2q1rk1/1p1nbppp/p2pbn2/4p3/4P1P1/1NN1BP2/PPPQ3P/2KR1B1R b - - 0 11" caption="Black to move in a sharp Sicilian Najdorf. White has just played g4, threatening g5 to kick the knight. Black's response here determines whether the kingside attack succeeds or fizzles." orientation="black"></chess-position>

The critical decision: should Black play 11...h6 (preventing g5 and keeping the knight on f6), 11...d5 (striking at the centre before White's attack develops), or 11...a5 (preparing queenside counterplay)?

In the game, Black played 11...h5 — a natural-looking move that stops g4-g5 but creates a permanent weakness on g5 and locks the kingside in White's favour. The engine prefers 11...d5, which is much harder to find over the board because it opens the centre while your king is still on g8.

**The lesson:** When you review, don't just note "the engine says d5 is best." Ask yourself: **what pattern would I need to recognise to find d5 in a future game?** The answer: in sharp Sicilian positions, central breaks are often more effective than passive defence. That's a pattern you can apply to dozens of future games.

### Step 4: Review the Endgame (2 minutes)

Most club players skip endgame review entirely. This is a mistake — **endgames are where the biggest rating gains hide.** A 1200 player who studies endgames will beat a 1200 player who studies openings almost every time.

Check your endgame for these common leaks:

**Rook activity.** The most common endgame mistake is a passive rook. Your rook should be behind passed pawns (yours or your opponent's), on the seventh rank, or cutting off the enemy king. If your rook is sitting on the first rank doing nothing, you're probably losing.

<chess-position fen="4r1k1/5pp1/7p/8/8/7P/5PP1/4R1K1 w - - 0 1" caption="White to move in a rook endgame. The key principle: activate your rook. Re1-e7 or Re1-d1 preparing to invade are both strong. Re1-e5 (centralising) is tempting but passive — the rook does more work on the seventh rank." orientation="white"></chess-position>

**King activity.** In endgames without queens, the king is a fighting piece. If your king is still on g1 when there are no threats, you're playing a piece down. Walk the king toward the centre.

**Pawn structure.** Count your pawn islands. Count your opponent's. Passed pawns, connected passed pawns, outside passed pawns — these decide most endgames, not tactical tricks.

**What to do in FireChess:** After scanning your games, filter the move list to moves 30+ and sort by centipawn loss. The endgame moves with the highest loss are your study targets. If you see a pattern (e.g., you consistently lose rook endgames), that's your next study topic.

### Step 5: Write One Takeaway (1 minute)

The final step — and the one most people skip. Write down **one specific thing** you learned from this game. Not "I need to study tactics" or "I should blunder less." Something concrete:

- "In the Italian Game, don't play Bg5 before Black plays ...h6 — the bishop gets stranded."
- "When my opponent plays g4 in the Sicilian, look for ...d5 central breaks first."
- "In rook endgames, I need to activate my rook before pushing pawns."

Keep these takeaways in a notebook or a file. After 20 games, you'll have 20 specific lessons. That's more useful than any opening repertoire book.

---

## What the Engine Actually Tells You (And What It Doesn't)

The engine evaluation is a number — positive means White is better, negative means Black is better. But the number alone doesn't tell you *why* one side is better or *what to do about it.*

Here's how to read engine output like a strong player:

### Centipawn Loss: The Number That Matters Most

Your **average centipawn loss (ACPL)** measures how much evaluation you gave up with each move. If Stockfish's top choice evaluates to +0.50 and your move evaluates to -0.20, your centipawn loss for that move is 70 centipawns.

For reference, here's what ACPL looks like by level:

| Rating | Typical ACPL | What It Means |
|--------|-------------|---------------|
| 800-1000 | 120-180 | Hanging pieces regularly, missing basic tactics |
| 1000-1200 | 80-120 | Occasional blunders, weak endgame play |
| 1200-1500 | 50-80 | Good tactical vision, positional inaccuracies |
| 1500-1800 | 35-50 | Solid play, occasional strategic errors |
| 1800-2000 | 25-35 | Strong play, subtle inaccuracies |
| 2000+ | 15-25 | Near-perfect execution with small inaccuracies |

<svg viewBox="0 0 620 320" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:620px;margin:1.5rem auto;display:block">
  <rect width="620" height="320" fill="#0a0e1a" rx="12"/>
  <text x="310" y="32" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="16" font-weight="700" text-anchor="middle">Average Centipawn Loss by Rating Level</text>
  <line x1="80" y1="260" x2="590" y2="260" stroke="#1e293b" stroke-width="1"/>
  <line x1="80" y1="200" x2="590" y2="200" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="4"/>
  <line x1="80" y1="140" x2="590" y2="140" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="4"/>
  <line x1="80" y1="80" x2="590" y2="80" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="4"/>
  <text x="72" y="264" fill="#64748b" font-family="system-ui,sans-serif" font-size="11" text-anchor="end">0</text>
  <text x="72" y="204" fill="#64748b" font-family="system-ui,sans-serif" font-size="11" text-anchor="end">60</text>
  <text x="72" y="144" fill="#64748b" font-family="system-ui,sans-serif" font-size="11" text-anchor="end">120</text>
  <text x="72" y="84" fill="#64748b" font-family="system-ui,sans-serif" font-size="11" text-anchor="end">180</text>
  <rect x="100" y="60" width="70" height="200" fill="#e13c48" rx="4"/>
  <text x="135" y="278" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">800-1000</text>
  <text x="135" y="52" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle">150</text>
  <rect x="195" y="100" width="70" height="160" fill="#f59e0b" rx="4"/>
  <text x="230" y="278" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">1000-1200</text>
  <text x="230" y="92" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle">100</text>
  <rect x="290" y="140" width="70" height="120" fill="#f59e0b" rx="4"/>
  <text x="325" y="278" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">1200-1500</text>
  <text x="325" y="132" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle">65</text>
  <rect x="385" y="180" width="70" height="80" fill="#10b981" rx="4"/>
  <text x="420" y="278" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">1500-1800</text>
  <text x="420" y="172" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle">42</text>
  <rect x="480" y="210" width="70" height="50" fill="#10b981" rx="4"/>
  <text x="515" y="278" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">1800-2000</text>
  <text x="515" y="202" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle">30</text>
  <text x="80" y="300" fill="#64748b" font-family="system-ui,sans-serif" font-size="10">Source: Aggregate data from 14,000+ FireChess scans</text>
</svg>

If your ACPL is 72 and you're rated 1400, that's normal — you're giving up about 72 centipawns per move through a combination of tactical errors and positional inaccuracies. The goal isn't to reach 0 (even grandmasters don't do that); it's to **identify which moves contribute most to your centipawn loss and fix those first.**

### The Move Quality Spectrum

FireChess translates centipawn loss into visual badges that appear directly on the analysis board. When you scan a game at [/analyze](/analyze), each move gets classified:

| Badge | Symbol | Centipawn Loss | What Happened |
|-------|--------|---------------|---------------|
| Brilliant | !! | 0-10 cp | Best move, hard to find |
| Best | ! | 0-10 cp | Engine's top choice |
| Good | ✓ | 10-25 cp | Solid, slight inaccuracy |
| Book | DB | 0-12 cp (moves 1-15) | Theory move |
| Inaccuracy | ?! | 25-75 cp | Small mistake, position worsened |
| Mistake | ? | 75-200 cp | Significant error, eval shifted |
| Blunder | ?? | 200+ cp | Game-changing mistake |

The **badge distribution** tells a story. A game with 11 Best, 3 Good, 2 Inaccuracies, and 1 Blunder is very different from a game with 6 Best, 4 Inaccuracies, 3 Mistakes, and 0 Blunders — even if the ACPL is similar. The first game has one critical error to fix; the second has systemic positional problems.

When reviewing a game in FireChess, look at the badge summary at the top of the scan results. It shows the count for each badge type plus your ACPL. Use this to prioritise what to study.

### Eval Graphs: Reading the Story of the Game

The evaluation graph (sometimes called the "eval bar" or "evaluation chart") plots the engine's assessment at every move. Learning to read it tells you more about your games than any individual move analysis.

**Steady climb from move 1:** One side was better throughout. If you were on the losing side, your opening was the problem — study that specific opening.

**Sharp spikes:** Tactical battles. Multiple blunders from both sides. Study the positions where the graph spiked to understand what tactics were available.

**Gradual decline:** Slow positional squeeze. No single blunder — just a series of small inaccuracies that added up. This is the hardest type of loss to diagnose, and it usually means you need to study strategic concepts (pawn structures, piece coordination, prophylaxis).

**Flat line that suddenly drops:** A single catastrophic blunder in an otherwise equal game. This is the easiest to fix — one tactical pattern to learn.

---

## The Five Types of Mistakes You'll Find

After reviewing 20+ games with this routine, you'll notice your mistakes fall into five categories. Each one requires a different study approach.

### Q: Tactical Oversights (Hangs and Missed Tactics)

**What it looks like:** You left a piece undefended, missed a fork, or didn't see your opponent's threat. The eval bar drops by 200+ centipawns in one move.

**How to fix it:** Before each move, do a **safety check** — are any of your pieces undefended? Is any piece attacked twice but defended once? This 5-second habit eliminates 80% of one-move blunders. For missed tactics, solve 10 puzzles per day on your puzzle rating level (not higher).

### Q: Opening Knowledge Gaps

**What it looks like:** You're out of book by move 8, and the engine shows your last 3 moves were inaccuracies. You end up in a position with no clear plan.

**How to fix it:** Use the [FireChess scanner](/analyze) to find your most common opening positions, then study the first 3-5 moves of deviation from theory. Don't memorise 20 moves of theory — learn the **ideas** behind the first critical decision in your opening.

### Q: Positional Misjudgements

**What it looks like:** Your ACPL is low (you didn't blunder), but you lost slowly. The eval gradually shifted against you over 15 moves. You traded a good bishop for a bad knight, or you pushed pawns that created weaknesses.

**How to fix it:** Study pawn structures for your openings. If you play the Sicilian, learn the typical pawn breaks (d5 for Black, f4-f5 for White). If you play the London, learn when to push e4 vs when to keep the pawn on e3.

### Q: Time Management Failures

**What it looks like:** You spent 8 minutes on move 12 (a non-critical position) and then had 30 seconds for the entire endgame. Your endgame centipawn loss is 150+ because you were in time trouble.

**How to fix it:** Set a personal clock rule: never spend more than 3 minutes on a single move in the opening or middlegame (unless it's a forcing sequence). Save at least 5 minutes for the endgame. Most games at club level are decided in the endgame, not the opening.

### Q: Endgame Technique Errors

**What it looks like:** You had a winning endgame but couldn't convert. You traded into a drawn position, or you pushed the wrong pawn, or your king was in the wrong place.

**How to fix it:** Study the three most common endgame types: rook endgames, king-and-pawn endgames, and minor piece endgames. You don't need to know everything — just the key positions (Lucena, Philidor, opposition, triangulation) and the general principles (activate your rook, centralise your king, push passed pawns).

---

## Building a Review Habit That Actually Sticks

Knowing the process is useless if you don't do it consistently. Here's how to make game review a habit, not a chore.

### Review Immediately After the Game

Don't wait until tomorrow. Within 5 minutes of finishing a game, spend 2 minutes on Step 1 (replay without engine) and Step 5 (write one takeaway). Your in-game thought process is fresh — by tomorrow, you'll have forgotten what you were thinking during the critical moment.

### Review One Game Per Day (Not Every Game)

You play 5-10 games in a session. Don't review all of them. Pick **the one game where you learned the most** — usually a loss, but sometimes a win where you got lucky. A focused 10-minute review of one game beats a superficial review of five.

### Track Your Patterns

After 20 games, look at your takeaways. Do they cluster around a specific type of mistake? A specific opening? A specific phase of the game?

Most players discover one of two patterns:

**Pattern A: The same mistake keeps appearing.** "I keep missing forks on f7." "I keep trading into lost endgames." This is gold — you've found your single biggest improvement opportunity. Study that one thing for a week and your rating will jump.

**Pattern B: Different mistakes every game.** This means your fundamentals need work — not any specific weakness, but basic board vision, calculation, and pattern recognition. Tactical puzzles and slow games (15+10 or longer) will help more than targeted study.

### Use the FireChess Scanner as Your Review Hub

The [/analyze](/analyze) page lets you upload PGN files or paste FEN positions for instant analysis. After scanning a game, the results show:

- **Move-by-move breakdown** with centipawn loss for each move
- **Opening identification** with theory reference
- **Badge distribution** showing your move quality spectrum
- **Critical moments** flagged with engine recommendations

Instead of setting up a local Stockfish installation and configuring UCI options, you can get professional-grade analysis in your browser. Upload your games after each session and follow the 10-minute routine above using the scan results.

---

## Advanced Review Techniques

Once the basic routine is second nature, add these techniques to deepen your analysis.

### Guess-the-Move Training

Open your game at the critical moment (Step 3 position) and **cover the actual move you played.** Now try to find the engine's top move. If you find it, great — that pattern is already in your toolbox. If you don't, study the position until you understand why the engine's move is best.

This technique is far more effective than passively reading engine lines because it forces you to calculate. You're training the same skill you use during a real game.

### Compare Multiple Games from the Same Opening

If you play the Italian Game as White in 30% of your games, scan all of them and compare the opening phase. [My Opening Tree](/blog/my-opening-tree-chess-repertoire/) automates this — it maps every line you've played and color-codes by win rate. You'll likely find that you repeat the same inaccuracy in every game — a move that feels natural but is slightly inaccurate.

For example, in a typical Italian middlegame where Black has traded on e6:

<chess-position fen="r2q1rk1/ppp1b1pp/2nppn2/4p3/4P3/3P1N1P/PPP2PP1/RNBQR1K1 w - - 0 9" caption="White to move after Black played ...Be6 and ...fxe6. The open f-file gives Black counterplay. White must decide between Nbd2-f1-g3 (slow but solid) and Ng5 (aggressive but committal)." orientation="white"></chess-position>

If you find that you consistently choose the wrong plan in this type of position, that's a targeted study topic. You don't need to study the entire Italian Game — just this specific structure with the open f-file.

### Analyse Your Opponent's Mistakes Too

Don't just look at your own moves. When your opponent made a mistake, ask: **did I notice it during the game?** If you did, great — your tactical vision is working. If you didn't (and the engine shows your opponent's move was a blunder but you played something else), you missed a tactical opportunity.

This is especially useful for wins. Most players skip reviewing games they won, but your opponent's blunders reveal gaps in your tactical awareness.

---

## What NOT to Do During Review

A few anti-patterns to avoid:

**Don't memorise engine lines.** The engine's top line at depth 20 is useless to a 1400 player. You can't calculate that deep, and the position will have changed long before you reach the engine's suggested move 5. Focus on the **first move** of the engine's suggestion and understand the **idea** behind it.

**Don't blame external factors.** "I lost because of time trouble" or "I lost because they played a weird opening." Maybe — but what could you have done differently? Even in time trouble, you chose specific moves. Review those choices.

**Don't review when tilted.** If you just lost 3 games in a row, your review will be emotional, not analytical. Take a break. Come back in an hour with a clear head.

**Don't use the engine to justify your moves.** Some players look for the one engine line where their move works and say "see, it was fine." That's confirmation bias. If the engine shows your move loses 200 centipawns in the main line, the fact that there's one sideline where it works doesn't make it good.

---

### Q: How long should I spend reviewing each chess game?

For club players, 10 minutes is the sweet spot. Long enough to cover all five steps (replay, opening, critical moment, endgame, takeaway), short enough to do after every session. If you only have 5 minutes, skip the endgame review and focus on the critical moment — that's where the biggest learning happens. Grandmasters spend 30-60 minutes per game, but they're analysing subtleties that don't matter below 2000 rating.

### Q: Should I review games I won, or only losses?

Review both. Wins often contain the same mistakes as losses — you just got away with them. If you won a game with an ACPL of 85, you made significant errors that a stronger opponent would have punished. The [FireChess scanner](/analyze) shows your move quality regardless of the result. Some of the most valuable reviews come from wins where you were worse at some point.

### Q: What's the difference between centipawn loss and accuracy score?

Centipawn loss (ACPL) measures the average evaluation drop per move in hundredths of a pawn. Accuracy score (0-100%) is a different metric that weighs moves differently — a blunder in a winning position hurts your accuracy more than a blunder in a lost position. Both are useful: ACPL tells you how much evaluation you're giving up, accuracy tells you how well you played relative to the position's complexity. See our [centipawn loss guide](/blog/what-is-centipawn-loss) and [accuracy score guide](/blog/chess-accuracy-score-explained) for detailed breakdowns.

### Q: How do I review games without an engine?

Engine-free review is actually the best way to start. Replay the game, identify critical moments, and try to evaluate each position yourself before checking the engine. If you only have a phone and no engine, play through the game on a physical board and write down your thoughts at each critical moment. When you later check with an engine (even days later), you'll learn more because you've already formed your own assessment.

### Q: Can I review games from chess.com or Lichess on FireChess?

Yes. Export your game as a PGN file from either platform (on Lichess: click the gear icon → "Export PGN"; on Chess.com: click "Share" → "PGN"). Then paste the PGN into the [FireChess scanner](/analyze) for analysis. FireChess shows move-by-move centipawn loss, badge classification, and opening identification — all in one place.

### Q: How many games should I review per week?

One per day is ideal — 7 reviews per week. If that's too many, start with 3 per week (after your longest sessions). The key is consistency: reviewing 3 games every week for a month produces far more improvement than reviewing 20 games once and then stopping.

### Q: What if I can't find the critical moment in my game?

If you can't identify the turning point, look at the evaluation graph in [FireChess's analysis](/analyze). The steepest drop in eval marks the critical moment. If the graph is flat and then drops suddenly, you had a single blunder. If it gradually declines over many moves, look for the first move where you felt uncertain — that's usually where the problems started.

---

## Start Reviewing Today

Post-game analysis is the single highest-ROI activity for chess improvement. It doesn't require memorising openings, solving thousands of puzzles, or studying grandmaster games. It requires 10 minutes, a structured routine, and the willingness to be honest about your mistakes.

Here's your action plan:

1. **Play a game** (any time control, any platform)
2. **Export the PGN** and upload it to [FireChess's scanner](/analyze)
3. **Follow the 5-step routine:** replay without engine (2 min), check the opening (2 min), find the critical moment (3 min), review the endgame (2 min), write one takeaway (1 min)
4. **Repeat after your next session**

After 20 games of consistent review, you'll have a personalised study plan based on your actual weaknesses — not guesswork, not generic advice, but data from your own games. That's how improvement actually works.
