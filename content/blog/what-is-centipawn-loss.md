---
title: "Average Centipawn Loss Explained: What ACPL Means & How to Improve"
description: "Average centipawn loss (ACPL) measures move quality in chess. Learn what it means, see board examples, and use FireChess to lower yours."
date: "2026-07-26"
author: "FireChess Team"
tags: ["analysis", "fundamentals", "improvement", "centipawn-loss"]
canonical: https://firechess.com/blog/what-is-centipawn-loss
---

You've just finished a hard-fought 45-minute game. You open the analysis board, run the engine, and there it is: **"Average Centipawn Loss: 72."**

What does that number actually mean? Is 72 good? Bad? How is it even calculated? And why should you care?

If you've ever stared at a centipawn loss score and felt more confused than informed, you're not alone. Average centipawn loss (ACPL) sits at the centre of modern chess analysis — every major platform from Lichess to Chess.com to FireChess uses it — but most players don't fully understand what the number represents or how to use it.

This guide fixes that. By the end, you'll know exactly what centipawn loss is, how Stockfish assigns those mysterious numbers, how FireChess translates centipawn loss into the move badges you see on the analysis board (Brilliant !!, Best !, Good ✓, Inaccuracy ?!, Mistake ?, Blunder ??), and — most importantly — how to use centipawn loss to find your biggest weaknesses and improve faster.

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

**Centipawn loss**, then, measures the difference between your move and the engine's best move, expressed in these units. If the best move in a position gives the engine +0.50 (a 50-centipawn advantage) and your move gives +0.20, your centipawn loss for that move is 30 cp — the difference between the optimal and what you played. **Average centipawn loss (ACPL)** is simply the mean of these per-move losses across an entire game — the single number you see on your analysis report. For a detailed breakdown of how these values map to rating levels, see our [ACPL by rating guide](/blog/average-centipawn-loss-by-rating), or read our [complete ACPL guide](/blog/average-centipawn-loss-guide) for practical strategies to lower yours.

---

## How Chess Engines Calculate Centipawn Loss

This is where most explanations get fuzzy, so let's be precise. If you're more interested in how platforms convert these numbers into accuracy percentages, see our [accuracy score guide](/blog/chess-accuracy-score-explained).

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

---

## Concrete Examples: Centipawn Loss on the Board

Let's make this real with actual positions. Each one demonstrates a different centipawn loss scenario you'll encounter in your own games.

### Example 1: A Minor Inaccuracy (15-25 cp Loss)

<chess-position fen="r1bq1rk1/ppp2ppp/2np1n2/4p3/2P5/2NP1NP1/PP2PPBP/R1BQ1RK1 w - - 0 10" caption="A typical King's Indian Attack structure. White's best move is 10.Be3, completing development. Playing 10.b3 instead (preparing Bb2) loses about 18 cp — a minor inaccuracy. The engine prefers the bishop on e3 where it targets the d6 weakness. This is the kind of inaccuracy that FireChess marks with a yellow '?!' badge." badge="inaccuracy" arrows="c1e3:green,b2b3:orange"></chess-position>

In the position above, White has a comfortable position (+0.45). The best move is 10.Be3, developing the bishop to its most active square. If White plays 10.b3 instead, the evaluation drops to roughly +0.27 — a centipawn loss of **18 cp**. FireChess would label this an **Inaccuracy (?!)**.

This is the most common type of centipawn loss for intermediate players: small positional imprecisions that don't lose the game but accumulate over 40 moves.

### Example 2: A Clear Mistake (40-80 cp Loss)

<chess-position fen="r1bqk2r/pppp1ppp/2n5/4P3/2B1n3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 7" caption="White to move. The best continuation is 7.Nc3, developing and attacking the knight on e4. Playing 7.O-O? instead allows Black to consolidate with ...d5, equalising. Centipawn loss: approximately 55 cp. FireChess badge: Mistake (?)." badge="mistake" arrows="b1c3:green,e1g1:orange"></chess-position>

White has a slight advantage (+0.60) after the opening. The best move is 7.Nc3, hitting the loose knight on e4 and maintaining pressure. If White castles with 7.O-O?, Black plays 7...d5 and suddenly Black is completely fine. The evaluation swings from +0.60 to roughly +0.05 — a centipawn loss of **55 cp**. FireChess marks this with an orange **Mistake (?)** badge.

Notice this isn't a tactical blunder — White didn't hang a piece. But White gave away the entire opening advantage in one positional misstep. This is what a "mistake" looks like: not game-losing, but genuinely damaging.

### Example 3: A Blunder (80-150 cp Loss)

<chess-position fen="r1b1kb1r/ppp2ppp/2n5/3qp3/8/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 7" caption="White to move. Black has just played ...Qe5, leaving the queen undefended. The only good move is Nxe5, winning the queen. Any other move — say, Be2 — is a 900 cp blunder. FireChess badge: Blunder (??)." badge="blunder" arrows="f3e5:green"></chess-position>

This is the most dramatic type of centipawn loss. White can capture the black queen with 7.Nxe5, gaining +9.00 in evaluation. Any other normal move — developing a bishop, castling — throws away a full queen. The centipawn loss for missing Nxe5 is roughly **900 cp**. FireChess labels this a red **Blunder (??)**.

Blunders of this magnitude usually come from tactical blindness — you simply didn't see the capture was available. The centipawn loss number tells you exactly how much you left on the board.

### Example 4: Near-Perfect Play (0-15 cp Loss)

<chess-position fen="r2q1rk1/ppp2ppp/2n1bn2/3p4/3P4/2NQ1N2/PPP2PPP/R1B2RK1 w - - 6 10" caption="A quiet position from a Queen's Gambit Declined. White has several reasonable moves. 11.Bg5, 11.Bf4, and 11.Rd1 are all within 5-10 cp of each other. Even the 'suboptimal' choice here barely registers as centipawn loss. FireChess badge: Best (!) or Good (✓)." badge="best" arrows="c1g5:green,c1f4:green"></chess-position>

In quiet, symmetrical positions, the centipawn loss between reasonable moves can be tiny. Here, White's three candidate moves — 11.Bg5, 11.Bf4, and 11.Rd1 — all evaluate between +0.25 and +0.30. Choosing the "wrong" one costs at most **5-8 cp**. FireChess would label any of these as **Best (!)** or **Good (✓)**.

This is a key insight: not all centipawn loss is created equal. A 10-centipawn loss in a razor-sharp Sicilian where only one move holds the position is a big deal. A 10-centipawn loss in a quiet position where five moves are playable is noise.

### Example 5: The Opening Blunder (150+ cp Loss)

<chess-position fen="rnbqkbnr/ppp2ppp/3p4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3" caption="Black to play in the Philidor Defence. Playing the natural-looking 3...Bg4? pins the knight but loses a pawn after 4.Bxf7+! Kxf7 5.Ng5+. Centipawn loss: approximately 250 cp. FireChess badge: Blunder (??)." badge="blunder" arrows="c4f7:red,f3g5:green"></chess-position>

The Philidor Defence (1.e4 e5 2.Nf3 d6 3.Bc4) looks innocent, but Black must be careful. The move 3...Bg4? feels logical — pin the knight — but it walks into 4.Bxf7+! After 4...Kxf7 5.Ng5+, Black loses castling rights and a pawn. The centipawn loss is roughly **250 cp** for a single move. This is the kind of opening trap that FireChess flags with a red **Blunder (??)** badge.

### Example 6: Endgame Precision (10 cp vs 50 cp)

<chess-position fen="8/8/8/4k3/8/3KP3/8/8 w - - 0 1" caption="A simple king and pawn endgame. White to move. 1.Ke2? (losing the opposition) costs about 45 cp and turns a win into a draw. 1.Kd2! maintains the opposition and wins. The difference between +1.20 and +0.08 is 112 cp — a single move changing the game outcome." badge="blunder" arrows="e3d2:green,e3e2:red"></chess-position>

Endgames are where centipawn loss becomes brutally unforgiving. In the position above, White must play 1.Kd2! to maintain the opposition and win. Playing 1.Ke2? loses the opposition and the evaluation crashes from +1.20 to +0.08 — a centipawn loss of **112 cp**. One king move. Game over. FireChess marks this as a **Blunder (??)** because the evaluation swing is decisive.

The same centipawn loss of 112 in the middlegame might be a partial mistake in a complex position. In the endgame, with so few pieces left, it's catastrophic. Context matters.

---

## FireChess Move Badges: What Each Label Means

When you analyse a game on FireChess, each move gets a coloured badge next to it in the move list. These badges aren't random — they map directly to centipawn loss ranges. Here's the complete mapping so you know exactly what each label means when you see it. For a deeper dive into how accuracy scores work, see our [accuracy score guide](/blog/chess-accuracy-score-explained).

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="720" height="560" viewBox="0 0 720 560" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cpBg" x1="0" y1="0" x2="720" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
  </defs>
  <rect width="720" height="560" rx="18" fill="url(#cpBg)"/>
  <rect x="1" y="1" width="718" height="558" rx="17" stroke="white" stroke-opacity="0.05"/>
  <!-- Title -->
  <text x="360" y="40" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700" letter-spacing="0.4" font-family="system-ui">FireChess Move Badges — Centipawn Loss Mapping</text>
  <text x="360" y="62" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Each badge corresponds to a centipawn loss range. Lower = better. Your ACPL averages these across every move.</text>
  <!-- Badge cards -->
  <!-- Brilliant: 0-10 cp loss, but only for sacrifices that work -->
  <g transform="translate(30, 90)">
    <rect width="660" height="54" rx="10" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#22d3ee" font-size="18" font-weight="800" font-family="system-ui">!!</text>
    <text x="54" y="34" fill="#22d3ee" font-size="15" font-weight="700" font-family="system-ui">Brilliant</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp loss · Best-move sacrifice that swings the evaluation in your favour</text>
  </g>
  <!-- Best: 0-10 cp loss -->
  <g transform="translate(30, 150)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#34d399" font-size="18" font-weight="800" font-family="system-ui">!</text>
    <text x="54" y="34" fill="#34d399" font-size="15" font-weight="700" font-family="system-ui">Best</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp loss · You matched the engine's top choice</text>
  </g>
  <!-- Good: 10-25 cp loss -->
  <g transform="translate(30, 210)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.05" stroke="#10b981" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#6ee7b7" font-size="18" font-weight="800" font-family="system-ui">✓</text>
    <text x="54" y="34" fill="#6ee7b7" font-size="15" font-weight="700" font-family="system-ui">Good</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">10-25 cp loss · Solid play, slightly suboptimal but stays within the position's logic</text>
  </g>
  <!-- Book: 0-12 cp in first 15 moves -->
  <g transform="translate(30, 270)">
    <rect width="660" height="54" rx="10" fill="#94a3b8" fill-opacity="0.06" stroke="#94a3b8" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#cbd5e1" font-size="18" font-weight="800" font-family="system-ui">DB</text>
    <text x="54" y="34" fill="#cbd5e1" font-size="15" font-weight="700" font-family="system-ui">Book</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-12 cp loss · Move 1-15 following known opening theory — engine treats as book-level</text>
  </g>
  <!-- Inaccuracy: 25-75 cp loss -->
  <g transform="translate(30, 330)">
    <rect width="660" height="54" rx="10" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fbbf24" font-size="18" font-weight="800" font-family="system-ui">?!</text>
    <text x="54" y="34" fill="#fbbf24" font-size="15" font-weight="700" font-family="system-ui">Inaccuracy</text>
    <text x="200" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">25-75 cp loss · A small slip — not losing, but missing a better option. Cost you about half a pawn.</text>
  </g>
  <!-- Mistake: 75-200 cp loss -->
  <g transform="translate(30, 390)">
    <rect width="660" height="54" rx="10" fill="#f97316" fill-opacity="0.08" stroke="#f97316" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fb923c" font-size="18" font-weight="800" font-family="system-ui">?</text>
    <text x="54" y="34" fill="#fb923c" font-size="15" font-weight="700" font-family="system-ui">Mistake</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">75-200 cp loss · A real miss that dropped about 1-2 pawns. Needs review.</text>
  </g>
  <!-- Blunder: 200+ cp loss -->
  <g transform="translate(30, 450)">
    <rect width="660" height="54" rx="10" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#f87171" font-size="18" font-weight="800" font-family="system-ui">??</text>
    <text x="54" y="34" fill="#f87171" font-size="15" font-weight="700" font-family="system-ui">Blunder</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">200+ cp loss · A heavy error — hung material, missed a winning tactic, or fatally weakened your position</text>
  </g>
</svg>
</div>

### Q: How the Badges Connect to Your Game Report

When you upload a game to FireChess and run the analysis, the summary panel at the top of the page shows you a breakdown:

- **White 78.7% accuracy · Best 11 · Book 8 · Good 3 · Blunder 2 · ACPL 43.2**
- **Black 75.5% accuracy · Best 8 · Book 6 · Good 3 · Inaccuracy 2 · Mistake 1 · Blunder 3 · ACPL 50.6**

Each of those counts is a direct translation of centipawn loss ranges. A "Blunder" means that move had 200+ centipawn loss. A "Mistake" means 75-200 cp. An "Inaccuracy" means 25-75 cp. The ACPL at the bottom averages all of these into a single number.

**What this table tells you instantly:**

- Move 13.e5? shows a ?? badge — that's a blunder with 200+ centipawn loss
- Move 6.Nxf7! shows a ! badge — best move, 0-10 cp loss
- Move 18.Bxd4 shows a ✓ badge — good move, 10-25 cp loss, solid but not the absolute best

This is the connection between the abstract centipawn loss number and the concrete badge you see on your screen. When you play your next game and upload it to FireChess, every badge you see is driven by centipawn loss under the hood.

---

## What Different Centipawn Loss Values Look Like on the Board

Numbers on a page are abstract. Let's put them on a real chessboard so you can see what different centipawn loss scores represent. If you want to see these ranges mapped to rating levels, our [ACPL by rating guide](/blog/average-centipawn-loss-by-rating) has the full breakdown.

### Centipawn Loss 0-15: Near-Perfect Play

At this level, you're finding the best move or something close to it. This is the range of grandmaster performance in most positions. A 10-centipawn loss means you played a move that's objectively almost as good as the engine's first choice — maybe you chose a slightly less optimal square for your bishop, or a different pawn advance that's still sound.

FireChess badges at this level: **Brilliant (!!)** or **Best (!)** .

### Centipawn Loss 15-40: Small Inaccuracies

This is the range of strong club players and experts (1800-2200 rating). You're not blundering — you're just not finding the most precise continuation. A 25-centipawn loss typically means you played a solid-developing move when a more aggressive or more subtle move was available.

FireChess badge at this level: **Inaccuracy (?!)** — the yellow badge.

### Centipawn Loss 40-80: Clear Mistakes

This is the most common centipawn loss range for intermediate club players (1200-1600). You're making mistakes that give away roughly half a pawn to a full pawn of advantage. These are often positional errors — misplacing a piece, trading the wrong pieces, or pushing a pawn that creates a weakness.

FireChess badge at this level: **Mistake (?)** — the orange badge.

### Centipawn Loss 80-150: Blunders

A centipawn loss over 80 is almost always a tactical mistake or a severe positional misjudgment. At 100+ cp, you've essentially given away a full pawn worth of advantage — often through a hanging piece, a missed fork, or a serious positional concession.

FireChess badge at this level: **Blunder (??)** — the red badge.

### Centipawn Loss 150+: Game-Losing Mistakes

At this level, you've probably dropped a full piece or allowed a decisive attack. A 300+ centipawn loss almost always means you hung a knight or bishop, missed a forced mate, or walked into a devastating tactic.

<chess-position fen="rnb1kbnr/pppp1ppp/8/3q4/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4" caption="Black's queen has just been captured by the pawn on e4 after Black blundered by moving it to d5 without considering the pawn capture on that square. Centipawn loss for Black: +950 cp — a full queen lost." analysis="true" badge="blunder" arrows="e4d5:red"></chess-position>

---

## How Centipawn Loss Translates to Accuracy (and Vice Versa)

Many chess analysis platforms, including FireChess, display both an **accuracy percentage** and an **average centipawn loss (ACPL)** for each game. People often ask: "Aren't they the same thing?"

They're correlated, but they measure different things.

**Average centipawn loss** is the raw mathematical average of how many centipawns you gave up per move. It's an absolute number — 55 ACPL means the same thing game to game, regardless of how sharp or quiet the position was.

**Accuracy percentage** is a normalised score that converts centipawn loss into a 0-100% scale based on how close your moves were to the engine's best. It's designed to be more intuitive: 95% accuracy means you played at an elite level; 60% means you were struggling.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="720" height="340" viewBox="0 0 720 340" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="convBg" x1="0" y1="0" x2="720" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
    <linearGradient id="convLine" x1="60" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#10b981"/><stop offset="0.5" stop-color="#f59e0b"/><stop offset="1" stop-color="#ef4444"/>
    </linearGradient>
  </defs>
  <rect width="720" height="340" rx="18" fill="url(#convBg)"/>
  <rect x="1" y="1" width="718" height="338" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="360" y="35" text-anchor="middle" fill="#f1f5f9" font-size="17" font-weight="700" font-family="system-ui">ACPL → Accuracy Conversion</text>
  <text x="360" y="55" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Typical accuracy for a given average centipawn loss. Curved because blunders drag ACPL more than accuracy.</text>
  <!-- Y axis -->
  <line x1="80" y1="80" x2="80" y2="290" stroke="#334155" stroke-width="1"/>
  <text x="30" y="110" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">99%</text>
  <text x="30" y="155" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">90%</text>
  <text x="30" y="200" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">80%</text>
  <text x="30" y="245" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">70%</text>
  <text x="30" y="290" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">60%</text>
  <!-- X axis -->
  <line x1="80" y1="290" x2="640" y2="290" stroke="#334155" stroke-width="1"/>
  <text x="80" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">10</text>
  <text x="192" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">30</text>
  <text x="304" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">50</text>
  <text x="416" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">70</text>
  <text x="528" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">100</text>
  <text x="640" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">150</text>
  <text x="360" y="328" fill="#64748b" font-size="11" font-family="system-ui" text-anchor="middle">Average Centipawn Loss (ACPL)</text>
  <!-- Conversion curve -->
  <path d="M 80 105 Q 192 118 304 155 Q 416 200 528 245 Q 584 268 640 288" stroke="url(#convLine)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Data points -->
  <circle cx="80" cy="105" r="5" fill="#10b981"/>
  <text x="80" y="95" fill="#10b981" font-size="10" font-family="system-ui" text-anchor="middle">GM</text>
  <circle cx="192" cy="118" r="5" fill="#10b981"/>
  <text x="192" y="108" fill="#10b981" font-size="10" font-family="system-ui" text-anchor="middle">Master</text>
  <circle cx="304" cy="155" r="5" fill="#f59e0b"/>
  <text x="304" y="145" fill="#f59e0b" font-size="10" font-family="system-ui" text-anchor="middle">Expert</text>
  <circle cx="416" cy="200" r="5" fill="#f59e0b"/>
  <text x="416" y="190" fill="#f59e0b" font-size="10" font-family="system-ui" text-anchor="middle">Club</text>
  <circle cx="528" cy="245" r="5" fill="#ef4444"/>
  <text x="528" y="235" fill="#ef4444" font-size="10" font-family="system-ui" text-anchor="middle">Casual</text>
  <circle cx="640" cy="288" r="5" fill="#ef4444"/>
  <text x="640" y="278" fill="#ef4444" font-size="10" font-family="system-ui" text-anchor="middle">Beginner</text>
</svg>
</div>

| ACPL | Typical Accuracy (FireChess) | Typical Badge Mix | What It Means |
|------|------------------------------|-------------------|---------------|
| 10-20 | 95-99% | Mostly !!, !, ✓ | Grandmaster level |
| 25-35 | 90-94% | !, ✓, few ?! | Master / IM level |
| 40-50 | 85-89% | !, ✓, some ?! and ? | Expert / strong club |
| 55-70 | 78-84% | Mix of !, ✓, ?!, ? | Club player (1400-1600) |
| 70-90 | 72-78% | More ?, ?!, occasional ?? | Casual club player |
| 90-150 | 65-72% | Frequent ? and ?? | Beginner / intermediate |
| 150+ | Below 65% | Many ??, game-altering blunders | Complete beginner |

The relationship isn't perfectly linear. A game with one 300-centipawn blunder and 39 perfect moves might give you 55 ACPL but 94% accuracy. The blunder drags down the ACPL more than it drags down the percentage, because accuracy penalises blunders heavily but not infinitely.

**Practical guidance:** Use ACPL for tracking long-term improvement (it's more granular) and accuracy for quick game-to-game comparisons (it's more intuitive). When you scan your FireChess report, look at the badge counts at the top — if you see more **Blunders (??)** than **Best (!)** moves, you know exactly where to focus.

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

<chess-position fen="r1bqk2r/pppp1ppp/2n5/4P3/2B5/5N2/PPP2PPP/RNBQK2R b KQkq - 0 5" caption="White is up a clean pawn thanks to the e5 pawn, with a strong centre and developed pieces. The centipawn advantage here is approximately +100-120 cp. Black's task is to minimise further losses." analysis="true" badge="mistake" arrows="e4e5:green"></chess-position>

---

## How to Use Centipawn Loss in Your Game Analysis

This is where theory becomes practice. Here's a step-by-step workflow for using centipawn loss to actually improve — using the FireChess badges as your visual guide.

### Step 1: Upload Your Game to FireChess

Import games from Lichess, Chess.com, or paste a PGN into [FireChess's analysis tool](/analyze). FireChess analyses every move and produces a report with centipawn loss per move, per phase, and per opening. The summary panel immediately shows your badge breakdown — Best, Book, Good, Inaccuracy, Mistake, Blunder counts for both players.

### Step 2: Find Your Biggest Single Moves

Scan the move list for **red Blunder (??)** and **orange Mistake (?)** badges. These are your centipawn-loss hotspots. The top 3-5 moves (your biggest mistakes) are where you should focus your attention. **Don't spread your limited study time across every 20-centipawn inaccuracy — find the 200-centipawn blunders and fix them first.**

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

ACPL is a **leading indicator** of improvement. Your rating might stagnate for weeks while your ACPL slowly drops — and then your rating catches up. Track your monthly ACPL average rather than your daily rating, and you'll see progress even before your rating moves. Watch your badge distribution shift: fewer **??** and **?** , more **!** and **!!** .

| Month | ACPL | Rating | Badge Trend | Notes |
|-------|------|--------|-------------|-------|
| Month 1 | 72 | 1420 | 5??, 8? per game | Baseline |
| Month 2 | 65 | 1450 | 3??, 6? per game | Tactics work paying off |
| Month 3 | 58 | 1510 | 1??, 4? per game | Clear improvement |
| Month 4 | 55 | 1530 | 0??, 3? per game | Plateau — time for positional study |

---

## Platform Differences: Lichess vs. Chess.com vs. FireChess

If you've analysed the same game on multiple platforms, you've probably noticed different ACPL numbers. This isn't a bug — it's a feature of different engine configurations.

| Platform | Engine | Typical Depth | ACPL Bias | Move Badges? |
|----------|--------|---------------|-----------|--------------|
| Lichess | Stockfish (various) | 22 ply | ~10% lower (more forgiving) | Yes (inaccuracy/mistake/blunder) |
| Chess.com | Cloud Stockfish | 25-30 ply | Baseline | Yes (brilliant/best/good/book/inaccuracy/mistake/blunder) |
| FireChess | Stockfish 18 | Balanced depth | Comparable to Chess.com | Yes — full 7-badge system (!!, !, ✓, DB, ?!, ?, ??) |

**Why the difference:** A weaker engine or lower depth sees fewer tactical possibilities, so it considers more "good enough" moves as equal to the best move. Your centipawn loss appears lower because the engine doesn't penalise you as harshly for missing a deep 25-move tactic.

**What this means for you:** Always benchmark against your own historical data on the *same platform*. Don't compare your Lichess ACPL of 55 to a friend's Chess.com ACPL of 55 — they're measured differently. Use FireChess consistently for your improvement tracking and learn to read the badge system — it's the most granular of any platform. For a deeper comparison of analysis platforms, see our [Lichess vs. Chess.com improvement guide](/blog/lichess-vs-chess-com-improvement).

---

## FAQ: Quick Answers to Common Questions

### Q: What is a good average centipawn loss?

It depends entirely on your rating and time control. For a 1500-rated player in rapid, anything under 60 is good. For a 2000-rated player, under 45 is expected. See our [ACPL by rating table](/blog/average-centipawn-loss-by-rating) for detailed benchmarks.

### Q: Is centipawn loss the same as accuracy?

No. Accuracy percentage is a normalised score (0-100%) based on centipawn loss. Centipawn loss is the raw mathematical measure. They correlate strongly but aren't identical. The FireChess move badges sit between them — badges translate centipawn loss into a human-readable label. For a full breakdown of how accuracy works, see our [chess accuracy score guide](/blog/chess-accuracy-score-explained).

### Q: What does average centipawn loss mean?

Average centipawn loss (ACPL) is the mean difference per move between the move you played and the engine's best move, measured in centipawns (1/100 of a pawn). If your ACPL is 60, that means on average each move you played was 60 centipawns — about 0.6 pawns — worse than the engine's top choice. Lower is better: grandmasters average 15-25 ACPL, while club players typically score 50-80. FireChess translates each move's centipawn loss into a coloured badge (Best, Inaccuracy, Blunder, etc.) so you can see at a glance where you lost the most. See our [ACPL by rating guide](/blog/average-centipawn-loss-by-rating) for benchmarks at every level.

### Q: What is a centipawn loss of 100?

A centipawn loss of 100 means you gave up the equivalent of one full pawn of advantage on a single move. This is a genuine blunder in most positions. FireChess marks this with a red **?? Blunder** badge.

### Q: What do the move badges on FireChess mean?

Each badge maps to a centipawn loss range:
- **!! Brilliant** (0-10 cp, sacrifice that works) — cyan badge
- **! Best** (0-10 cp, matching the engine's top choice) — green badge
- **✓ Good** (10-25 cp, solid but not the absolute best) — light green badge
- **DB Book** (0-12 cp, first 15 moves, known theory) — grey badge
- **?! Inaccuracy** (25-75 cp, small slip) — yellow badge
- **? Mistake** (75-200 cp, real miss) — orange badge
- **?? Blunder** (200+ cp, heavy error) — red badge

### Q: Why does my centipawn loss vary so much between games?

That's normal. A game where you face a sharp Sicilian Defence and have to calculate complex tactics will naturally produce higher centipawn loss than a slow Queen's Gambit game where you play known theory for 20 moves. Average across 10+ games before drawing conclusions.

### Q: How many games do I need for a reliable ACPL reading?

At least 10 games in the same time control. A single game has too much variance from the specific opening, opponent, and circumstances. Ten games smooth out the noise. The badge counts will also stabilise over 10+ games.

### Q: Can centipawn loss be negative?

No. Centipawn loss is defined as the absolute difference between your move's evaluation and the best move's evaluation. It's always a non-negative number. Some platforms display "0" for the best move, meaning zero centipawns lost.

### Q: Does centipawn loss matter in completely winning positions?

It matters less. When you're up a queen and a rook, a 100-centipawn inaccuracy is irrelevant. Focus your analysis on critical positions — where the game was balanced and a mistake changed the outcome. Our [ACPL by rating guide](/blog/average-centipawn-loss-by-rating) shows which centipawn loss ranges actually affect your win rate at each level.

### Q: Is centipawn loss useful for openings?

Partially. Opening centipawn loss tends to be very low because there's established theory. A high centipawn loss in the opening usually means you left book and made a mistake. More useful is tracking your centipawn loss *after leaving theory* — that's a measure of how well you understand the resulting middlegame positions. In FireChess, opening moves typically show **DB (Book)** badges until move 15 or until an early deviation occurs. If your opening centipawn loss is consistently high, use the [opening weaknesses scanner](/blog/how-to-find-opening-weaknesses) to find which lines are costing you.

### Q: How do I read the badge summary at the top of my FireChess report?

The summary panel shows you: accuracy percentage, badge counts by type, and ACPL. For example: "White 78.7% accuracy · Best 11 · Book 8 · Good 3 · Blunder 2 · ACPL 43.2". This means White played 11 perfect moves, 8 book moves, 3 good moves, and 2 blunders. The average loss was 43.2 centipawns per move. More Best (!) moves than Blunders (??) is always a good sign. Upload a game to [FireChess at /analyze](/analyze) to see your own badge breakdown.

### Q: Is the Brilliant (!!) badge the same as a Best (!) move?

No. A Brilliant move (!!) is a specific type of Best move — it's a piece sacrifice where the engine confirms the sacrifice actually works (the evaluation improves after the sacrifice). Not every best move is brilliant. In practice, Brilliant moves are rare — you might see 1-2 per 20 games. A Best (!) move simply means you matched the engine's top choice.

---

## Quick Reference Table: Centipawn Loss by Impact

| Centipawn Loss | Classification | FireChess Badge | Typical Cause | Impact on Game |
|----------------|---------------|-----------------|---------------|----------------|
| 0-15 | Excellent | !! or ! | Best or near-best move | Negligible |
| 15-25 | Good | ✓ | Slightly suboptimal but solid | Tiny edge lost |
| 25-75 | Inaccuracy | ?! | Minor positional imprecision | Small advantage lost |
| 75-200 | Mistake | ? | Tactical miss or positional error | Noticeable advantage lost |
| 200-300 | Blunder | ?? | Hanging piece, missed tactic | Often game-deciding |
| 300+ | Severe blunder | ?? | Lost piece, fatal positional concession | Usually loses |
| 900+ | Disaster | ?? | Lost queen, missed forced mate | Game over |

---

## Conclusion: From Number to Improvement

Centipawn loss is, at heart, a tool — not a judgment. A number like "72 ACPL" tells you nothing by itself. But 72 ACPL *trending toward 60* tells you you're improving. A 150-centipawn blunder *in the same pattern across three games* tells you exactly what to study. An ACPL spike *in the middlegame but not the opening* tells you where to invest your training time.

The FireChess badge system is the visual translation of all of this. When you see a red **??** next to move 23, you know instantly: that move cost you. When you see a cyan **!!** next to move 31, you know: you found something special. The centipawn loss numbers underneath are the engine's precise accounting — but the badges are what make it intuitive.

The players who improve fastest aren't the ones with the lowest centipawn loss. They're the ones who **use** centipawn loss data to find their specific weaknesses and target them. They look at the badge breakdown after every game and ask: "Where are my blunders coming from?"

Upload your next game to FireChess, scan the centipawn loss breakdown by phase, and find the one pattern that's costing you the most badges. Fix that one thing. Watch your ACPL drop. Watch your rating follow.

*Ready to analyse your games? Use the [FireChess analysis tool](/analyze) to get a free centipawn loss breakdown with phase-by-phase reporting — complete with move badges for every move.*
