---
title: "How to Read Chess Engine Analysis: A Complete Guide for Club Players"
description: "Learn to read chess engine analysis — eval scores, depth, principal variations, and centipawn loss. Practical tips to use Stockfish for real improvement."
date: "2026-08-22"
author: "FireChess Team"
tags: ["analysis", "improvement", "engine", "stockfish", "fundamentals"]
canonical: https://firechess.com/blog/how-to-read-chess-engine-analysis
---

You've just uploaded a game to FireChess at [/analyze](/analyze). The engine lines light up. A number flashes: **+1.8**. An arrow points from e2 to e4. The move list shows **"depth 22"** next to a sequence of moves you don't understand.

You stare at it and think: *"OK… but what does any of this actually tell me about my game?"*

You're not alone. Most club players between 1000 and 1800 treat engine analysis like a black box — they check the final evaluation, glance at the accuracy score, and move on. They're leaving 90% of the improvement value on the table.

This guide breaks down every piece of engine output you'll encounter on FireChess, Lichess, Chess.com, or any other platform. By the end, you'll know how to read evaluation scores, understand depth, decode the principal variation, and — most importantly — use all of it to actually get better at chess.

---

## What the Engine Evaluation Number Means

The single most important number in chess engine analysis is the **evaluation score** — the number that appears next to each position, usually expressed in pawns. If you want to see how these evaluations translate into your own games, upload a PGN to [FireChess at /analyze](/analyze).

Here's the scale:

| Evaluation | Meaning | How It Feels in a Game |
|-----------|---------|----------------------|
| **0.00** | Dead equal | Neither side has any advantage |
| **+0.1 to +0.5** | Slight edge for White | A small positional pull — maybe a better pawn structure or slight space advantage |
| **+0.5 to +1.5** | Clear advantage for White | White has a meaningful edge — better pieces, more space, or a target to attack |
| **+1.5 to +3.0** | Winning advantage for White | White should win with accurate play — usually a material advantage or crushing attack |
| **+3.0+** | White is winning | Technical conversion — the game is effectively over |
| **-0.1 to -3.0+** | Same scale for Black | Negative numbers favour Black |

The key insight: **evaluations are measured in centipawns**. One centipawn = 1/100th of a pawn. So +1.50 means White is ahead by the equivalent of one and a half pawns.

### What Counts as "Winning"

A common mistake among club players is assuming that +0.5 means "I'm winning." It doesn't. Here's the reality:

- **Under +1.0**: The game is still very much in play. A 1200-rated player could easily swing this either way with one mistake.
- **+1.0 to +2.0**: The advantaged side has a clear edge, but converting it requires accurate technique. Many games at club level are still decided by blunders at this eval.
- **Over +2.0**: This is where the engine is confident. If you're at +2.5 and you're the one with the advantage, you should be winning — but "should" and "will" are different things at the club level.

<chess-position fen="r2qk2r/1b1n1p1p/p1pp1npQ/1p2p3/3PP3/P1N2P2/1PP1N1PP/1K1R1B1R b kq - 1 12" caption="Kasparov vs Topalov, 1999 — after 12.Kb1. The engine evaluates this as roughly +2.0 for White. Kasparov has a massive lead in development, his queen is already on h6 attacking the kingside, and Black's pieces are tangled up. But Topalov's position looks superficially 'fine' — he has all his pieces and no immediate threats. This is the kind of position where the engine score tells you something your eyes miss." orientation="black" arrows="d8e7:green" badge="best"></chess-position>

When you see a +2.0 evaluation and think *"but it looks equal,"* the engine is usually seeing things you can't: piece activity differences, long-term weaknesses, or forced sequences that lead to a dominant position.

---

## Understanding Depth: Why the Engine Keeps "Thinking"

Next to the evaluation score, you'll see a number labeled **depth** — typically something like "depth 20" or "depth 25." This is the second-most important piece of engine output, and almost nobody explains it to club players.

**Depth means how many half-moves (plies) ahead the engine has calculated.** A depth of 20 means the engine has evaluated positions 20 half-moves deep — that's 10 full moves for each side.

Here's why it matters:

### Low Depth vs High Depth

| Depth | What It Means | Reliability |
|-------|-------------|------------|
| 10-15 | Shallow — the engine is just getting started | Can miss tactics 3-4 moves deep |
| 16-20 | Solid — catches most tactical shots | Good enough for opening analysis |
| 21-28 | Deep — the engine is confident | The sweet spot for post-game analysis |
| 30+ | Very deep — usually only in endgames or forced lines | Extremely reliable, but takes longer |

The critical thing to understand: **evaluations change as depth increases.** A position that looks like +0.5 at depth 15 might become +1.8 at depth 25 because the engine finds a deep tactical shot that wasn't visible at lower depth. Conversely, a position that looks like +3.0 at depth 12 might drop to +0.8 at depth 24 because the engine discovers a defensive resource for the losing side.

This is why FireChess runs Stockfish at significant depth before presenting results. A shallow evaluation can be misleading — you might think you're winning when the engine just hasn't found the defense yet.

### Practical Implication

When you're reviewing your own games, **don't trust the evaluation until the depth is at least 20.** On FireChess, this is handled automatically — the engine runs deep enough before showing results. But if you're using a local Stockfish installation or an online analysis board, watch the depth number. If it's still climbing, the evaluation might change.

For endgames with few pieces, the engine needs even more depth because the search tree extends further. A rook endgame at depth 18 might show +0.3, but at depth 30 it might reveal a forced winning sequence that evaluates to +4.0. For practical endgame improvement, see our [rook endgames guide](/blog/rook-endgames-guide-club-players) and [king and pawn endgames guide](/blog/king-and-pawn-endgames-guide).

---

## The Principal Variation: Reading the Engine's Recommended Line

Below the evaluation score, you'll see a sequence of moves — something like **"Nxe5 dxe5 Qh5+ g6 Qxe5"**. This is the **principal variation**, or **PV**. It's the engine's best guess at how the game should continue from the current position, assuming both sides play the best available moves.

The PV is the most underused piece of engine data for club players. Here's how to read it:

### Reading a PV Correctly

A PV always starts with the move for the side to move. So if it's White's turn and the PV shows "Nxe5 dxe5 Qh5+ g6 Qxe5," the sequence is:

1. **White** plays Nxe5 (captures on e5)
2. **Black** responds with dxe5 (captures back)
3. **White** plays Qh5+ (queen to h5 with check)
4. **Black** blocks with g6 (pawn to g6)
5. **White** plays Qxe5 (queen captures on e5)

Each pair of moves represents one full move. A PV of 10 moves means the engine has calculated 5 full moves ahead.

### Q: Why the PV Matters for Your Improvement

The PV shows you **what the engine thinks is the best sequence of moves.** When you review a game and see a PV that differs from what you actually played, you've found a learning opportunity. For a complete framework on turning analysis into improvement, see [How to Analyze Your Chess Games](/blog/how-to-analyze-chess-games-guide).

1. **Compare your move to the engine's first choice.** How much worse was your move? On FireChess, this shows up as centipawn loss — the difference in evaluation between the engine's top move and the move you played.

2. **Follow the PV for 3-4 moves.** Don't just look at the first move — understand *why* the engine's line works. The second and third moves in the PV often reveal the tactical or strategic point.

3. **Check if the PV ends in a position you understand.** If the PV leads to a position where you have a knight vs a bad bishop, that's a strategic concept you can file away for future games.

<chess-position fen="r1bqk1nr/pppp1ppp/2n5/b7/2B1P3/2p2N2/P4PPP/RNBQ1RK1 w kq - 0 8" caption="Evans Gambit after 7...dxc3. White has sacrificed a pawn for rapid development and attacking chances. The engine's PV starts with 8.Qb3 (green arrow), aiming at f7, followed by a sequence involving Nxc3, d4, and Bg5. Pushing 8.e5 (red arrow) is tempting but a mistake — it blocks the bishop and gives Black time to consolidate. Understanding the PV here teaches you *why* gambit play works — not just that White is 'compensated,' but exactly how the compensation manifests over the next 4-5 moves." orientation="white" arrows="d1b3:green,e4e5:red" badge="best"></chess-position>

---

## Centipawn Loss: The Metric That Changed Chess Improvement

If you've used FireChess's [/analyze](/analyze) tool, you've seen **centipawn loss** (CPL) — the number that shows how much worse your move was compared to the engine's top choice. This is the single most actionable metric in chess analysis, and it's the backbone of the FireChess move badge system.

Here's the breakdown: every move you play is compared to the engine's best move. The difference in evaluation (measured in centipawns) is your centipawn loss for that move. Average that across all your moves, and you get your **Average Centipawn Loss (ACPL)** — the number that FireChess displays prominently in your scan results.

### The FireChess Move Badge System

FireChess translates centipawn loss into visual badges that appear on each move in the analysis board:

| Badge | Symbol | CP Loss Range | What It Means |
|-------|--------|-------------|--------------|
| Brilliant | !! | 0-10 cp | An exceptional move — often a surprising sacrifice |
| Best | ! | 0-10 cp | The engine's top choice |
| Good | ✓ | 10-25 cp | A strong move, close to optimal |
| Book | DB | 0-12 cp (moves 1-15) | A known theoretical move |
| Inaccuracy | ?! | 25-75 cp | A slight mistake — loses some advantage |
| Mistake | ? | 75-200 cp | A significant error — changes the evaluation meaningfully |
| Blunder | ?? | 200+ cp | A game-changing mistake |

<svg viewBox="0 0 660 340" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:660px;margin:1.5rem auto;display:block;">
  <rect width="660" height="340" rx="8" fill="#0a0e1a"/>
  <text x="330" y="32" text-anchor="middle" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="16" font-weight="700">FireChess Move Badge System — CP Loss Ranges</text>
  <!-- Brilliant -->
  <rect x="30" y="55" width="600" height="36" rx="4" fill="#06b6d4" fill-opacity="0.18"/>
  <text x="50" y="78" fill="#06b6d4" font-family="system-ui,sans-serif" font-size="14" font-weight="700">!!</text>
  <text x="80" y="78" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Brilliant</text>
  <text x="200" y="78" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">0-10 cp — Exceptional move, often a surprising sacrifice</text>
  <rect x="560" y="63" width="50" height="20" rx="4" fill="#06b6d4" fill-opacity="0.3"/>
  <text x="585" y="78" text-anchor="middle" fill="#06b6d4" font-family="system-ui,sans-serif" font-size="11" font-weight="600">0-10</text>
  <!-- Best -->
  <rect x="30" y="97" width="600" height="36" rx="4" fill="#10b981" fill-opacity="0.18"/>
  <text x="50" y="120" fill="#10b981" font-family="system-ui,sans-serif" font-size="14" font-weight="700">!</text>
  <text x="80" y="120" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Best</text>
  <text x="200" y="120" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">0-10 cp — The engine's top choice</text>
  <rect x="560" y="105" width="50" height="20" rx="4" fill="#10b981" fill-opacity="0.3"/>
  <text x="585" y="120" text-anchor="middle" fill="#10b981" font-family="system-ui,sans-serif" font-size="11" font-weight="600">0-10</text>
  <!-- Good -->
  <rect x="30" y="139" width="600" height="36" rx="4" fill="#34d399" fill-opacity="0.14"/>
  <text x="50" y="162" fill="#34d399" font-family="system-ui,sans-serif" font-size="14" font-weight="700">✓</text>
  <text x="80" y="162" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Good</text>
  <text x="200" y="162" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">10-25 cp — Strong move, close to optimal</text>
  <rect x="560" y="147" width="50" height="20" rx="4" fill="#34d399" fill-opacity="0.3"/>
  <text x="585" y="162" text-anchor="middle" fill="#34d399" font-family="system-ui,sans-serif" font-size="11" font-weight="600">10-25</text>
  <!-- Book -->
  <rect x="30" y="181" width="600" height="36" rx="4" fill="#94a3b8" fill-opacity="0.14"/>
  <text x="50" y="204" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="14" font-weight="700">DB</text>
  <text x="80" y="204" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Book</text>
  <text x="200" y="204" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">0-12 cp — Known theoretical move (moves 1-15)</text>
  <rect x="560" y="189" width="50" height="20" rx="4" fill="#94a3b8" fill-opacity="0.3"/>
  <text x="585" y="204" text-anchor="middle" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="11" font-weight="600">0-12</text>
  <!-- Inaccuracy -->
  <rect x="30" y="223" width="600" height="36" rx="4" fill="#f59e0b" fill-opacity="0.14"/>
  <text x="50" y="246" fill="#f59e0b" font-family="system-ui,sans-serif" font-size="14" font-weight="700">?!</text>
  <text x="80" y="246" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Inaccuracy</text>
  <text x="200" y="246" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">25-75 cp — Slight mistake, loses some advantage</text>
  <rect x="560" y="231" width="50" height="20" rx="4" fill="#f59e0b" fill-opacity="0.3"/>
  <text x="585" y="246" text-anchor="middle" fill="#f59e0b" font-family="system-ui,sans-serif" font-size="11" font-weight="600">25-75</text>
  <!-- Mistake -->
  <rect x="30" y="265" width="600" height="36" rx="4" fill="#f97316" fill-opacity="0.14"/>
  <text x="50" y="288" fill="#f97316" font-family="system-ui,sans-serif" font-size="14" font-weight="700">?</text>
  <text x="80" y="288" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Mistake</text>
  <text x="200" y="288" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">75-200 cp — Significant error, changes evaluation</text>
  <rect x="560" y="273" width="50" height="20" rx="4" fill="#f97316" fill-opacity="0.3"/>
  <text x="585" y="288" text-anchor="middle" fill="#f97316" font-family="system-ui,sans-serif" font-size="11" font-weight="600">75-200</text>
  <!-- Blunder -->
  <rect x="30" y="307" width="600" height="28" rx="4" fill="#ef4444" fill-opacity="0.18"/>
  <text x="50" y="326" fill="#ef4444" font-family="system-ui,sans-serif" font-size="14" font-weight="700">??</text>
  <text x="80" y="326" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Blunder</text>
  <text x="200" y="326" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">200+ cp — Game-changing mistake</text>
  <rect x="560" y="313" width="50" height="16" rx="4" fill="#ef4444" fill-opacity="0.3"/>
  <text x="585" y="326" text-anchor="middle" fill="#ef4444" font-family="system-ui,sans-serif" font-size="11" font-weight="600">200+</text>
</svg>

When you scan your games on FireChess, you'll see a summary at the top: something like **"Best 11 · Book 8 · Good 3 · Inaccuracy 4 · Blunder 2 · ACPL 43.2"**. This tells you at a glance where your game quality sits.

### What ACPL Actually Tells You

Your ACPL is the single best proxy for how well you played, regardless of whether you won or lost. A player with 25 ACPL played exceptionally well; a player with 85 ACPL made significant errors throughout the game.

Here's a rough guide by rating level:

| Rating | Typical ACPL | What It Looks Like |
|--------|-------------|-------------------|
| 800-1000 | 100-150 | Frequent blunders, multiple ?? badges per game |
| 1000-1200 | 70-100 | Occasional blunders, regular mistakes |
| 1200-1500 | 45-70 | Fewer blunders, but inaccuracies pile up |
| 1500-1800 | 30-50 | Mostly good moves with occasional mistakes |
| 1800-2200 | 15-30 | Consistently strong, rare mistakes |
| 2200+ | 5-15 | Near-perfect accuracy |

<svg viewBox="0 0 660 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:660px;margin:1.5rem auto;display:block;">
  <rect width="660" height="300" rx="8" fill="#0a0e1a"/>
  <text x="330" y="30" text-anchor="middle" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="16" font-weight="700">Average Centipawn Loss by Rating Level</text>
  <!-- Grid lines -->
  <line x1="120" y1="50" x2="120" y2="250" stroke="#1e293b" stroke-width="1"/>
  <line x1="120" y1="250" x2="620" y2="250" stroke="#1e293b" stroke-width="1"/>
  <line x1="220" y1="50" x2="220" y2="250" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="4,4"/>
  <line x1="320" y1="50" x2="320" y2="250" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="4,4"/>
  <line x1="420" y1="50" x2="420" y2="250" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="4,4"/>
  <line x1="520" y1="50" x2="520" y2="250" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="4,4"/>
  <!-- Axis labels -->
  <text x="120" y="268" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="11">0</text>
  <text x="220" y="268" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="11">30</text>
  <text x="320" y="268" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="11">60</text>
  <text x="420" y="268" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="11">90</text>
  <text x="520" y="268" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="11">120</text>
  <text x="620" y="268" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="11">150</text>
  <!-- Bars (midpoint of ACPL range, scaled: 150cp = 500px width) -->
  <!-- 800-1000: 125cp midpoint → 417px -->
  <rect x="120" y="55" width="417" height="28" rx="4" fill="#ef4444" fill-opacity="0.7"/>
  <text x="115" y="74" text-anchor="end" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12">800-1000</text>
  <text x="545" y="74" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" font-weight="600">100-150</text>
  <!-- 1000-1200: 85cp midpoint → 283px -->
  <rect x="120" y="90" width="283" height="28" rx="4" fill="#f97316" fill-opacity="0.7"/>
  <text x="115" y="109" text-anchor="end" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12">1000-1200</text>
  <text x="411" y="109" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" font-weight="600">70-100</text>
  <!-- 1200-1500: 57.5cp midpoint → 192px -->
  <rect x="120" y="125" width="192" height="28" rx="4" fill="#f59e0b" fill-opacity="0.7"/>
  <text x="115" y="144" text-anchor="end" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12">1200-1500</text>
  <text x="320" y="144" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" font-weight="600">45-70</text>
  <!-- 1500-1800: 40cp midpoint → 133px -->
  <rect x="120" y="160" width="133" height="28" rx="4" fill="#34d399" fill-opacity="0.7"/>
  <text x="115" y="179" text-anchor="end" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12">1500-1800</text>
  <text x="261" y="179" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" font-weight="600">30-50</text>
  <!-- 1800-2200: 22.5cp midpoint → 75px -->
  <rect x="120" y="195" width="75" height="28" rx="4" fill="#10b981" fill-opacity="0.7"/>
  <text x="115" y="214" text-anchor="end" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12">1800-2200</text>
  <text x="203" y="214" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" font-weight="600">15-30</text>
  <!-- 2200+: 10cp midpoint → 33px -->
  <rect x="120" y="230" width="33" height="28" rx="4" fill="#06b6d4" fill-opacity="0.7"/>
  <text x="115" y="249" text-anchor="end" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12">2200+</text>
  <text x="161" y="249" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" font-weight="600">5-15</text>
</svg>

For a deeper dive into what centipawn loss means and how it's calculated, read [What Is Centipawn Loss? ACPL Explained](/blog/what-is-centipawn-loss). If you want to know how your ACPL compares to players at your rating, check [Average Centipawn Loss by Rating](/blog/average-centipawn-loss-by-rating).

---

## How to Actually Use Engine Analysis to Improve

Here's where most club players go wrong: they run the engine, look at the evaluation, check their accuracy score, and close the tab. They've spent 2 minutes getting data they'll forget in 5 minutes.

Real improvement from engine analysis requires a process. Here's the one that works:

### Step 1: Identify the Critical Moments

Don't analyze every move. Focus on the points where the evaluation **swung significantly** — where the position went from winning to losing, or from equal to clearly worse. On FireChess, these are the moves with **Mistake (?)** and **Blunder (??)** badges.

<chess-position fen="r1bqk2r/ppp1bppp/2np1n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQR1K1 w kq - 0 6" caption="Ruy Lopez after 5...d6. Positions like this are where critical moments happen — both sides have solid structures, and the evaluation usually stays near 0.0 for many moves. The green arrow shows 6.c3, the engine's top choice — preparing d4 to claim the centre. The evaluation swings when one side breaks the balance: a premature pawn push, a knight landing on a weak square, or a tactical shot that exploits a back-rank weakness. Your job is to find those moments in your own games." orientation="white" arrows="c2c3:green" badge="best"></chess-position>

### Step 2: For Each Critical Move, Understand WHY It's Bad

This is the step almost everyone skips. When you see that your move 14.Bg5 was a Mistake (eval dropped from +0.3 to -1.2), don't just note "Bg5 was bad." Ask:

1. **What did the engine suggest instead?** Look at the green-highlighted best move.
2. **What's different about the engine's move?** Does it defend something? Attack something? Maintain tension?
3. **What happens if you follow the PV for 3-4 moves?** The engine's line usually reveals the tactical or strategic reason your move failed.

On FireChess, you can click any move to see the full engine line. Follow it. Don't just glance — play it out on the board until you understand the point.

### Step 3: Categorize Your Mistakes

After reviewing 5-10 of your games, patterns emerge. Most club players make the same types of mistakes repeatedly:

- **Tactical blindness**: Missing forks, pins, skewers. You see lots of Blunder (??) badges where you hung a piece.
- **Opening preparation gaps**: Your Inaccuracy (?) badges cluster in moves 5-12. You're leaving the book too early and making suboptimal moves.
- **Endgame technique errors**: Your mistakes pile up after move 30. You know the middlegame ideas but don't convert advantages.
- **Time pressure blunders**: Your accuracy drops sharply in the last 5 minutes of the game. The badges get worse as the clock ticks down.

FireChess's scan results group your moves by phase — look at the "Opening Leaks" and "Endgame Errors" sections to see where your improvement opportunities are.

### Step 4: Study One Pattern at a Time

Don't try to fix everything at once. If your analysis shows you're losing 50+ centipawns per game to tactical blindness, spend two weeks doing puzzles that target the specific motifs you're missing (forks, pins, discovered attacks). Learn more about these motifs in our [tactics guide](/blog/chess-tactics-every-player-should-know). Then rescan and check if your [ACPL improved](/blog/what-is-centipawn-loss).

<chess-position fen="8/1r3pkp/p5p1/8/8/8/P4PPP/R4RK1 w - - 0 1" caption="A typical rook endgame. The engine evaluates this as roughly +5.7 for White — a winning advantage. The green arrow shows 1.Rfb1, the engine's top choice — preparing to invade on the 7th rank. For club players, positions like this are where centipawn loss accumulates: the 'correct' moves (rook to the 7th rank, king activation) aren't hard to find individually, but knowing WHEN to switch from rook activity to king advance requires endgame knowledge that pattern study builds." orientation="white" arrows="f1b1:green" badge="best"></chess-position>

---

## Engine Depth vs Engine Evaluation: When They Disagree

One of the most confusing things in engine analysis is when the evaluation **changes dramatically** as the engine calculates deeper. You're watching the analysis run, and the eval jumps from +0.5 to +2.1 in two seconds. What happened?

The answer is almost always one of these:

### Q: The Engine Found a Deep Tactical Shot

At lower depth, the engine couldn't see a combination that extends 8-10 moves deep. Once it calculated far enough, it discovered a forcing sequence that wins material or delivers checkmate. This is common in complex middlegame positions with many pieces on the board.

### Q: The Engine Found a Defensive Resource

The reverse also happens: the eval drops from +3.0 to +0.6 because the engine discovered a clever defensive move at depth 22 that it missed at depth 14. This is why you shouldn't trust shallow evaluations — the "winning" position might not actually be winning.

### Q: The Engine Is Switching Between Equal Top Moves

Sometimes two moves are nearly identical in evaluation (say +0.41 vs +0.38), and the engine flips between them as depth increases. The evaluation might look like it's jumping around, but it's actually staying within a narrow band. Don't panic if the eval fluctuates by less than 0.3 pawns — that's normal engine behaviour.

<chess-position fen="r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 1 9" caption="King's Indian Defence after 8...Ne7. The engine evaluates this as roughly equal (+0.2) at depth 20, but at depth 30+ it might find that White's d5 pawn wedge gives a lasting spatial advantage worth +0.6. The green arrow shows 9.b4, the engine's top choice — expanding on the queenside while the centre is locked. This is a classic example where the evaluation depends heavily on depth — the strategic nuances of the KID are hard for engines to fully resolve at lower depths. Use the engine's evaluation as a guide, but trust your understanding of the position's strategic themes. For more on building opening knowledge, see [How to Study Chess Openings Without Memorizing](/blog/how-to-study-chess-openings-without-memorizing)." orientation="white" arrows="b2b4:green" badge="best"></chess-position>

---

## Common Mistakes When Reading Engine Analysis

Even experienced players misuse engine analysis. Here are the traps to avoid:

### Trap 1: "The Engine Says +0.3, So I'm Better"

A +0.3 evaluation is **negligible**. In practical terms, it means nothing. The engine sees a microscopic advantage that would require perfect play to convert — and neither you nor your opponent plays perfectly. Treat anything between -0.5 and +0.5 as equal.

### Trap 2: "I Should Always Play the Engine's Top Move"

The engine's first choice and second choice are often separated by less than 0.1 pawns. If you played the engine's second-best move and lost only 3 centipawns, that's a **Brilliant** or **Best** move. Don't second-guess yourself over negligible differences.

The real learning comes from moves that lose 25+ centipawns — the Inaccuracies, Mistakes, and Blunders. Those represent meaningful evaluation swings that changed the course of the game.

### Trap 3: "The Engine's Opening Moves Are the Best Moves"

Engines are not always right about openings. In many sharp opening lines (the Sicilian Najdorf, the King's Indian, the Grünfeld), the engine's preferred move at depth 25 might differ from the move that grandmasters actually play, because the engine doesn't understand long-term strategic plans the way a human does.

Use opening databases and grandmaster games to guide your opening study, not the engine alone. Check our [opening principles guide](/blog/chess-opening-principles) for a framework on building your repertoire. The engine is most useful for checking specific tactical ideas within established opening theory.

### Trap 4: "I Won, So My Analysis Will Look Good"

Winning and playing well are different things. You can win a game with an ACPL of 120 if your opponent blunders more than you do. On the flip side, you can lose a game with an ACPL of 25 if your opponent plays a brilliant sacrificial combination.

This is why FireChess's accuracy score and ACPL are more useful than the result for understanding your actual playing strength. Scan your wins AND your losses — the improvement data is often more valuable in the games you lost. For a deeper framework on game review, see [How to Review Chess Games](/blog/how-to-review-chess-games).

---

## Putting It All Together: A 10-Minute Analysis Routine

Here's a practical routine you can run after every rated game:

**Minutes 1-2: Upload and scan.** Go to [FireChess /analyze](/analyze) and upload your PGN. Let the engine run.

**Minutes 3-4: Check the summary.** Look at your ACPL and badge distribution. If your ACPL is under 40, you played well. Over 70? There are significant improvement areas. Note the number of Blunder (??) and Mistake (?) badges — these are your priority fixes.

**Minutes 5-7: Review the critical moves.** Click on each Blunder and Mistake. For each one:
- What did you play? What was the engine's suggestion?
- Follow the engine's PV for 3 moves. Why is the engine's move better?
- Can you see the pattern? (Missed tactic? Positional misunderstanding? Time pressure?)

**Minutes 8-9: Check the opening.** Look at moves 1-15 for any Book (DB) vs non-book moves. If you left theory early with an Inaccuracy, that's a line you need to study.

**Minute 10: Note one takeaway.** Write down ONE thing you'll focus on next game. Not five things — one. "I need to check for back-rank threats before pushing pawns." That's enough.

For a complete walkthrough of game analysis techniques, see [How to Analyze Your Chess Games](/blog/how-to-analyze-chess-games). For a deeper framework on building a study plan from your own games, read [How to Build a Chess Study Plan from Your Own Games](/blog/how-to-build-a-chess-study-plan-from-your-own-games).

---

### Q: What does a +1.5 evaluation mean in chess?

A +1.5 evaluation means White has an advantage equivalent to one and a half pawns. In practical terms, White should be winning with accurate play, but at the club level (under 1800), this advantage can easily swing back and forth. The engine considers +1.5 a "clear advantage" — it's significant enough that the side with the advantage should be looking to convert, but not so large that the game is decided.

### Q: How accurate is Stockfish at depth 20?

Stockfish at depth 20 is extremely accurate for tactical positions — it rarely misses combinations shorter than 8-10 moves. However, it can still misevaluate complex strategic positions (like long-term pawn structure weaknesses) that require deeper calculation. For post-game analysis, depth 20-25 is more than sufficient for club players. FireChess runs Stockfish at significant depth to ensure reliable evaluations. Read more about how engines evaluate positions in our guide to [centipawn loss](/blog/what-is-centipawn-loss).

### Q: Why does the engine evaluation change as it calculates deeper?

The engine's evaluation changes because it discovers new information at each depth level. At depth 15, it might not see a tactical shot that becomes visible at depth 22. Conversely, it might find a defensive resource at depth 25 that it missed at depth 18. This is normal — treat evaluations as estimates that become more reliable with depth, not as absolute truths.

### Q: What is a good centipawn loss for a 1500-rated player?

A 1500-rated player typically has an Average Centipawn Loss (ACPL) between 45 and 70. If your ACPL is consistently under 50, you're playing above your rating level in terms of move quality. If it's over 80, focus on reducing blunders — those Blunder (??) badges are costing you the most centipawns. See our [Average Centipawn Loss by Rating](/blog/average-centipawn-loss-by-rating) guide for the full breakdown.

### Q: Should I always play the move the engine recommends?

Not necessarily. The engine's top two moves are often separated by less than 10 centipawns — both are excellent. The engine also doesn't account for your style, your opponent's tendencies, or practical considerations like time pressure. Use the engine's recommendations to understand *why* certain moves work, not as a rigid instruction manual. If you played the engine's second choice and lost only 5 centipawns, that's still a Best (!) move on FireChess.

### Q: How do I use FireChess to find my biggest improvement areas?

Upload your games to [FireChess /analyze](/analyze) and look at three things: (1) your ACPL — if it's over 70, you have significant room to improve; (2) the badge distribution — count the Blunder and Mistake badges to see how often you make serious errors; (3) the "Opening Leaks" section, which groups repeated mistakes in the same positions. This tells you exactly which opening lines need study.

### Q: What's the difference between engine evaluation and accuracy score?

The engine evaluation is the raw number (+1.5, -0.3, etc.) showing who's ahead and by how much. The accuracy score is a single percentage (0-100%) that summarizes how many of your moves matched the engine's top choices across the entire game. Accuracy is easier to compare across games, but evaluation gives you more information about specific positions. For a complete breakdown, see [Chess Accuracy Score Explained](/blog/chess-accuracy-score-explained).
