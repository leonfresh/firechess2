---
title: "Brilliant Moves in Chess: What They Are and How to Find Them"
description: "What makes a move 'brilliant' in chess? How do Stockfish and Chess.com detect them, and can you train yourself to find brilliant moves more often?"
date: "2026-06-16"
author: "FireChess Team"
tags: ["analysis", "tactics", "improvement", "stockfish"]
---

If you've analyzed a game on Chess.com or uploaded a PGN to [FireChess Analyzer](/analyze), you've seen the electric blue diamond on certain moves — the **brilliant** classification. It's the rarest, most celebrated move badge. But what exactly makes a move brilliant, and how do engines decide to award it?

This guide goes deeper than the surface. We'll look at the actual algorithm Stockfish uses under the hood, walk through a decision-tree diagram that shows you exactly when a move earns the brilliant tag, and examine famous positions from chess history where only one stunning move wins the game.

If you're new to engine evaluation metrics, consider reading our companion article [Chess Accuracy Score Explained](/blog/chess-accuracy-score-explained) first — it covers how centipawn loss and accuracy percentages work, which directly feeds into the brilliant-move criteria discussed below.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="300" viewBox="0 0 680 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brBg" x1="0" y1="0" x2="680" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080a16"/><stop offset="1" stop-color="#0b0e1e"/>
    </linearGradient>
    <radialGradient id="brGlow1" cx="340" cy="150" r="250" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#06b6d4" stop-opacity="0.1"/><stop offset="1" stop-color="#06b6d4" stop-opacity="0"/>
    </radialGradient>
    <filter id="brF"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="brF2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="680" height="300" rx="18" fill="url(#brBg)"/>
  <rect x="1" y="1" width="678" height="298" rx="17" stroke="white" stroke-opacity="0.05"/>
  <rect width="680" height="300" rx="18" fill="url(#brGlow1)"/>
  <!-- Central diamond badge, large -->
  <g transform="translate(340, 150)">
    <!-- Outer glow ring -->
    <circle r="72" fill="#06b6d4" fill-opacity="0.05" filter="url(#brF)"/>
    <circle r="55" fill="#06b6d4" fill-opacity="0.08"/>
    <!-- Diamond shape -->
    <polygon points="0,-44 30,0 0,44 -30,0" fill="#06b6d4" fill-opacity="0.18" stroke="#06b6d4" stroke-width="1.5" filter="url(#brF2)"/>
    <polygon points="0,-44 30,0 0,44 -30,0" fill="none" stroke="#67e8f9" stroke-width="0.5" stroke-opacity="0.6"/>
    <!-- Inner facets -->
    <line x1="0" y1="-44" x2="30" y2="0" stroke="#22d3ee" stroke-width="0.5" stroke-opacity="0.4"/>
    <line x1="0" y1="-44" x2="-30" y2="0" stroke="#22d3ee" stroke-width="0.5" stroke-opacity="0.4"/>
    <line x1="-30" y1="0" x2="0" y2="10" stroke="#22d3ee" stroke-width="0.5" stroke-opacity="0.3"/>
    <line x1="30" y1="0" x2="0" y2="10" stroke="#22d3ee" stroke-width="0.5" stroke-opacity="0.3"/>
    <!-- Star sparkles -->
    <g filter="url(#brF2)" stroke="#67e8f9" stroke-width="1" stroke-opacity="0.8">
      <line x1="-56" y1="-42" x2="-52" y2="-42"/><line x1="-54" y1="-44" x2="-54" y2="-40"/>
      <line x1="52" y1="-52" x2="56" y2="-52"/><line x1="54" y1="-54" x2="54" y2="-50"/>
      <line x1="56" y1="38" x2="60" y2="38"/><line x1="58" y1="36" x2="58" y2="40"/>
    </g>
    <text y="74" text-anchor="middle" fill="#67e8f9" font-size="16" font-weight="700" font-family="system-ui" letter-spacing="2">BRILLIANT</text>
  </g>
  <!-- Left panel: criteria -->
  <g transform="translate(30, 55)">
    <text fill="#64748b" font-size="11" font-weight="600" font-family="system-ui" letter-spacing="1">CRITERIA</text>
    <g transform="translate(0, 20)">
      <rect width="190" height="36" rx="7" fill="#0f172a" stroke="#1e293b"/>
      <circle cx="18" cy="18" r="7" fill="#06b6d4" fill-opacity="0.15" stroke="#06b6d4" stroke-opacity="0.4"/>
      <text x="18" y="22" text-anchor="middle" fill="#22d3ee" font-size="11" font-family="system-ui">1</text>
      <text x="36" y="15" fill="#cbd5e1" font-size="11" font-family="system-ui">Sacrifice or non-obvious</text>
      <text x="36" y="29" fill="#64748b" font-size="10" font-family="system-ui">Engine alternatives are much worse</text>
    </g>
    <g transform="translate(0, 65)">
      <rect width="190" height="36" rx="7" fill="#0f172a" stroke="#1e293b"/>
      <circle cx="18" cy="18" r="7" fill="#06b6d4" fill-opacity="0.15" stroke="#06b6d4" stroke-opacity="0.4"/>
      <text x="18" y="22" text-anchor="middle" fill="#22d3ee" font-size="11" font-family="system-ui">2</text>
      <text x="36" y="15" fill="#cbd5e1" font-size="11" font-family="system-ui">Maintains or gains advantage</text>
      <text x="36" y="29" fill="#64748b" font-size="10" font-family="system-ui">Not just unique — objectively best</text>
    </g>
    <g transform="translate(0, 110)">
      <rect width="190" height="36" rx="7" fill="#0f172a" stroke="#1e293b"/>
      <circle cx="18" cy="18" r="7" fill="#06b6d4" fill-opacity="0.15" stroke="#06b6d4" stroke-opacity="0.4"/>
      <text x="18" y="22" text-anchor="middle" fill="#22d3ee" font-size="11" font-family="system-ui">3</text>
      <text x="36" y="15" fill="#cbd5e1" font-size="11" font-family="system-ui">Hard for humans to find</text>
      <text x="36" y="29" fill="#64748b" font-size="10" font-family="system-ui">Counterintuitive at first glance</text>
    </g>
    <g transform="translate(0, 155)">
      <rect width="190" height="36" rx="7" fill="#0f172a" stroke="#1e293b"/>
      <circle cx="18" cy="18" r="7" fill="#06b6d4" fill-opacity="0.15" stroke="#06b6d4" stroke-opacity="0.4"/>
      <text x="18" y="22" text-anchor="middle" fill="#22d3ee" font-size="11" font-family="system-ui">4</text>
      <text x="36" y="15" fill="#cbd5e1" font-size="11" font-family="system-ui">Second-best is clearly worse</text>
      <text x="36" y="29" fill="#64748b" font-size="10" font-family="system-ui">Strict uniqueness requirement</text>
    </g>
  </g>
  <!-- Right panel: rarity stats -->
  <g transform="translate(460, 55)">
    <text fill="#64748b" font-size="11" font-weight="600" font-family="system-ui" letter-spacing="1">RARITY</text>
    <g transform="translate(0, 20)">
      <rect width="190" height="80" rx="8" fill="#0f172a" stroke="#1e293b"/>
      <text x="12" y="22" fill="#94a3b8" font-size="11" font-family="system-ui">Brilliant moves per 100 games:</text>
      <text x="12" y="46" fill="#22d3ee" font-size="26" font-weight="800" font-family="system-ui" filter="url(#brF2)">~1–3</text>
      <text x="12" y="65" fill="#475569" font-size="10" font-family="system-ui">for players rated 1400–1800</text>
    </g>
    <g transform="translate(0, 115)">
      <rect width="190" height="80" rx="8" fill="#0f172a" stroke="#1e293b"/>
      <text x="12" y="22" fill="#94a3b8" font-size="11" font-family="system-ui">Most brilliants involve:</text>
      <text x="12" y="42" fill="#67e8f9" font-size="12" font-family="system-ui">♞ Piece sacrifice</text>
      <text x="12" y="58" fill="#67e8f9" font-size="12" font-family="system-ui">♖ Rook to active square</text>
      <text x="12" y="74" fill="#67e8f9" font-size="12" font-family="system-ui">♕ Queen retreat / deflect</text>
    </g>
  </g>
</svg>
</div>

## What Makes a Move "Brilliant"?

The brilliant classification isn't awarded for playing a good move in a winning position. It's awarded when a move satisfies a very specific set of criteria:

**1. The move must be the best (or among the very best) moves in the position.** This eliminates interesting-but-wrong sacrifices.

**2. The move must be non-obvious.** This is the key differentiator. Specifically, this usually means the second-best move (or the "natural" alternative) is significantly worse — often by a large centipawn margin.

**3. The move often involves a sacrifice or an unintuitive piece placement.** A piece going to an unexpected square, giving up material, or creating a resource that isn't immediately visible.

The underlying logic: a brilliant move is one where a strong player looking quickly would probably not play it — but it's the objectively correct move. That gap between what "looks right" and what *is* right is the hallmark of brilliance.

## The Difference Between Brilliant and Best

Most moves that receive "Best" classification are also the engine's top choice. But "Best" means: *the engine agrees, and the alternatives are reasonable too.*

"Brilliant" means: *the engine agrees, AND the natural-looking alternatives are surprisingly bad, AND there's something counterintuitive about the move.*

This is why brilliant moves often involve:
- **Piece sacrifices** — you give up material that looks wrong
- **Quiet moves in tactical positions** — when the position seems to demand action, a quiet preparatory move is hardest to find
- **Retreats** — moving a piece backward when the position "looks" like it needs to go forward
- **Geometrically unexpected squares** — a rook going to a8 instead of c8, a knight hopping to a seemingly bad square that actually controls everything

## How Engines Classify Brilliant Moves

Different platforms have slightly different implementations, but the core approach is the same across Chess.com, Lichess, and FireChess:

1. **Run the position to deep analysis** (depth 20+). Get the top 3–5 moves with their evaluations.
2. **Identify uniqueness**: Is the top move significantly better than the second? By how much?
3. **Identify non-obviousness**: Does the top move involve a sacrifice, retreat, or piece to an unexpected square?
4. **Verify the evaluation**: Does this move maintain or improve your advantage? (Brilliant moves that lead to a worse position don't count.)

The exact centipawn threshold for "significantly better than the second option" varies. It's typically in the range of 100–200 centipawns — meaning the second-best move loses roughly 1–2 pawns of advantage compared to the brilliant move.

## How Stockfish Detects Brilliant Moves: An Inside Look

Stockfish is the open-source chess engine that powers most analysis platforms (including FireChess). Understanding how Stockfish "thinks" about brilliant moves helps demystify the blue diamond entirely.

### The Search Tree

Stockfish does not "look" at a position the way a human does. It builds a **search tree** — a branching web of future moves and counter-moves extending 20–30 half-moves deep. At each branch, Stockfish evaluates the resulting position using a hand-crafted **evaluation function** that considers material balance, piece activity, king safety, pawn structure, and dozens of other weighted features.

### How It Finds the Brilliant Candidate

The algorithm works in three layers:

**Layer 1 — Alpha-Beta Pruning with Aspiration Windows.** Stockfish starts with an "aspiration window" — a narrow guess-range around the previous move's evaluation. It feeds the top candidate moves through its alpha-beta search. If a move evaluates dramatically above the window's upper bound, Stockfish widens the window and re-searches. A brilliant move candidate often causes this re-search because its evaluation spikes far above the "normal" alternatives.

**Layer 2 — Multi-PV Analysis.** "PV" stands for Principal Variation — the main line Stockfish thinks will be played. In Multi-PV mode, Stockfish computes not just the best line but the top 3–5 moves and their scores. This is where brilliancy detection begins. Stockfish sorts these lines by evaluation and measures the **gap** between the first and second candidate.

**Layer 3 — Sacrifice Detection Heuristic.** Stockfish tracks material balance along each principal variation. If the top move starts with a material deficit (a sacrifice) but recovers to a winning evaluation several moves later, the heuristic flags it as a potential brilliancy candidate. The engine then double-checks: is the material actually unrecoverable in the second-best line? If yes, the sacrifice was objectively necessary — and the move is brilliant.

### A Simplified Example

Imagine Stockfish analyzes a position and reports:

| Rank | Move | Evaluation | Material Delta |
|------|------|-----------|---------------|
| 1 | Bxh7+ | +3.2 (winning) | −1 pawn (sacrifice) |
| 2 | Qe2 | +0.4 (slightly better) | 0 |
| 3 | Rd1 | +0.3 (equal) | 0 |

Here, Bxh7+ is a bishop sacrifice that leads to a winning attack. The gap between #1 (+3.2) and #2 (+0.4) is 280 centipawns — far above the 100–200 centipawn threshold. The sacrifice detection confirms material is down in the main line but compensated by attack. This move earns the brilliant tag.

If in another position the top two moves were Nf3 (+0.8) and Nge2 (+0.7), the gap is only 10 centipawns. No sacrifice, no uniqueness — this would be classified "Good" or "Book," not brilliant.

This is the algorithm distilled. It's not magic — it's a combination of search depth, multi-variation analysis, and material-balance heuristics that together identify the rare move that is both uniquely winning and unintuitive to a human.

## Brilliant Move Detection: Decision Tree

The following flowchart summarizes the exact decision process engines use to classify a move as brilliant. Follow the path from the starting position to see how each criterion is checked in sequence.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="760" height="840" viewBox="0 0 760 840" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dtBg" x1="0" y1="0" x2="760" y2="840" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080a16"/><stop offset="1" stop-color="#0b0e1e"/>
    </linearGradient>
    <linearGradient id="dtGreen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#059669"/><stop offset="1" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="dtRed" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dc2626"/><stop offset="1" stop-color="#b91c1c"/>
    </linearGradient>
    <linearGradient id="dtBlue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0891b2"/><stop offset="1" stop-color="#0e7490"/>
    </linearGradient>
    <linearGradient id="dtGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d97706"/><stop offset="1" stop-color="#b45309"/>
    </linearGradient>
    <filter id="dtGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <marker id="arrowDown" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#475569"/>
    </marker>
    <marker id="arrowGreen" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#059669"/>
    </marker>
    <marker id="arrowRed" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626"/>
    </marker>
  </defs>
  <rect width="760" height="840" rx="20" fill="url(#dtBg)"/>
  <rect x="1" y="1" width="758" height="838" rx="19" stroke="white" stroke-opacity="0.05"/>

  <!-- START node -->
  <rect x="280" y="24" width="200" height="44" rx="22" fill="url(#dtBlue)" filter="url(#dtGlow)"/>
  <text x="380" y="52" text-anchor="middle" fill="#fff" font-size="14" font-weight="700" font-family="system-ui">START: Analyze Position</text>

  <!-- Arrow START → Q1 -->
  <line x1="380" y1="68" x2="380" y2="100" stroke="#475569" stroke-width="2" marker-end="url(#arrowDown)"/>

  <!-- Q1 Diamond -->
  <polygon points="380,100 540,160 380,220 220,160" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>
  <text x="380" y="154" text-anchor="middle" fill="#e2e8f0" font-size="12" font-weight="600" font-family="system-ui">Is this the best</text>
  <text x="380" y="170" text-anchor="middle" fill="#e2e8f0" font-size="12" font-weight="600" font-family="system-ui">move in the position?</text>

  <!-- Q1 NO → Not Brilliant -->
  <line x1="220" y1="160" x2="140" y2="160" stroke="#dc2626" stroke-width="2" marker-end="url(#arrowRed)"/>
  <rect x="28" y="142" width="112" height="36" rx="18" fill="url(#dtRed)"/>
  <text x="84" y="165" text-anchor="middle" fill="#fff" font-size="12" font-weight="600" font-family="system-ui">NOT BRILLIANT</text>

  <!-- Arrow Q1 YES → Q2 -->
  <line x1="380" y1="220" x2="380" y2="252" stroke="#059669" stroke-width="2" marker-end="url(#arrowGreen)"/>
  <text x="396" y="240" fill="#059669" font-size="10" font-weight="600" font-family="system-ui">YES</text>

  <!-- Q2 Diamond -->
  <polygon points="380,252 540,312 380,372 220,312" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>
  <text x="380" y="304" text-anchor="middle" fill="#e2e8f0" font-size="12" font-weight="600" font-family="system-ui">Is 2nd-best move</text>
  <text x="380" y="320" text-anchor="middle" fill="#e2e8f0" font-size="12" font-weight="600" font-family="system-ui">significantly worse?</text>
  <text x="380" y="336" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui">(gap ≥ 100–200 cp)</text>

  <!-- Q2 NO → Best/Excellent -->
  <line x1="220" y1="312" x2="140" y2="312" stroke="#d97706" stroke-width="2" marker-end="url(#arrowDown)"/>
  <rect x="14" y="294" width="126" height="36" rx="18" fill="url(#dtGold)"/>
  <text x="77" y="317" text-anchor="middle" fill="#fff" font-size="12" font-weight="600" font-family="system-ui">BEST / EXCELLENT</text>

  <!-- Arrow Q2 YES → Q3 -->
  <line x1="380" y1="372" x2="380" y2="404" stroke="#059669" stroke-width="2" marker-end="url(#arrowGreen)"/>
  <text x="396" y="392" fill="#059669" font-size="10" font-weight="600" font-family="system-ui">YES</text>

  <!-- Q3 Diamond -->
  <polygon points="380,404 540,464 380,524 220,464" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>
  <text x="380" y="456" text-anchor="middle" fill="#e2e8f0" font-size="12" font-weight="600" font-family="system-ui">Does move involve a</text>
  <text x="380" y="472" text-anchor="middle" fill="#e2e8f0" font-size="12" font-weight="600" font-family="system-ui">sacrifice or non-obvious</text>
  <text x="380" y="488" text-anchor="middle" fill="#e2e8f0" font-size="12" font-weight="600" font-family="system-ui">piece placement?</text>

  <!-- Q3 NO → Great Move -->
  <line x1="220" y1="464" x2="140" y2="464" stroke="#d97706" stroke-width="2" marker-end="url(#arrowDown)"/>
  <rect x="18" y="446" width="122" height="36" rx="18" fill="url(#dtGold)"/>
  <text x="79" y="469" text-anchor="middle" fill="#fff" font-size="12" font-weight="600" font-family="system-ui">GREAT MOVE</text>

  <!-- Arrow Q3 YES → Q4 -->
  <line x1="380" y1="524" x2="380" y2="556" stroke="#059669" stroke-width="2" marker-end="url(#arrowGreen)"/>
  <text x="396" y="544" fill="#059669" font-size="10" font-weight="600" font-family="system-ui">YES</text>

  <!-- Q4 Diamond -->
  <polygon points="380,556 540,616 380,676 220,616" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>
  <text x="380" y="608" text-anchor="middle" fill="#e2e8f0" font-size="12" font-weight="600" font-family="system-ui">Does the move maintain</text>
  <text x="380" y="624" text-anchor="middle" fill="#e2e8f0" font-size="12" font-weight="600" font-family="system-ui">or improve your advantage?</text>

  <!-- Q4 NO → Blunder -->
  <line x1="220" y1="616" x2="140" y2="616" stroke="#dc2626" stroke-width="2" marker-end="url(#arrowRed)"/>
  <rect x="30" y="598" width="110" height="36" rx="18" fill="url(#dtRed)"/>
  <text x="85" y="621" text-anchor="middle" fill="#fff" font-size="12" font-weight="600" font-family="system-ui">BLUNDER / MISTAKE</text>

  <!-- Arrow Q4 YES → FINAL -->
  <line x1="380" y1="676" x2="380" y2="720" stroke="#059669" stroke-width="3" marker-end="url(#arrowGreen)"/>
  <text x="396" y="700" fill="#059669" font-size="10" font-weight="600" font-family="system-ui">YES</text>

  <!-- BRILLIANT final node -->
  <rect x="262" y="720" width="236" height="52" rx="26" fill="url(#dtGreen)" filter="url(#dtGlow)"/>
  <polygon points="380,726 386,734 380,742 374,734" fill="#fff" fill-opacity="0.3"/>
  <text x="380" y="740" text-anchor="middle" fill="#fff" font-size="16" font-weight="800" font-family="system-ui" letter-spacing="2">★ BRILLIANT ★</text>

  <!-- Legend -->
  <g transform="translate(580, 24)">
    <rect width="160" height="120" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
    <text x="12" y="20" fill="#64748b" font-size="10" font-weight="600" font-family="system-ui" letter-spacing="1">LEGEND</text>
    <polygon points="12,40 28,46 12,52" fill="#64748b" stroke="none"/>
    <text x="36" y="48" fill="#94a3b8" font-size="10" font-family="system-ui">Decision point</text>
    <rect x="12" y="64" width="16" height="16" rx="8" fill="#059669"/>
    <text x="36" y="76" fill="#94a3b8" font-size="10" font-family="system-ui">Brilliant outcome</text>
    <rect x="12" y="90" width="16" height="16" rx="8" fill="#dc2626"/>
    <text x="36" y="102" fill="#94a3b8" font-size="10" font-family="system-ui">Rejection outcome</text>
  </g>
</svg>
</div>

As the decision tree shows, a move must pass **all four gates** to earn the brilliant classification. Fail any single test — a small centipawn gap, a natural-looking move, or a sacrifice that doesn't quite work — and the classification drops to Best, Great, Excellent, or (if the sacrifice was unsound) Blunder.

## Famous Brilliant Moves in Chess History

Some of the most celebrated games in chess history hinge on a single brilliant move. Here are five famous examples, presented as positions you can interact with directly. Load any position into the [FireChess Analysis Board](/analyze) to explore the tactical ideas yourself.

### Position 1: Legal's Pseudo-Sacrifice (c. 1750)

One of the earliest recorded brilliant moves comes from a game attributed to François-André Danican Philidor's teacher, de Legal. White has developed actively while Black's bishop on g4 pins the knight on f3. The natural move would be to deal with the pin — by h3, Nbd2, or Be2. But Legal found something far more shocking.

<chess-position fen="r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5" caption="Legal's Mate: White to play — the bishop sacrifice Bxf7+ is coming" orientation="white">

**The Brilliant Move: 5. Nxe5!!**

White sacrifices the queen. If Black captures: 5...Bxd1? 6.Bxf7+ Ke7 7.Nd5# — checkmate. Black's king has no escape square because the white bishop on c4 and knight on d5 cover everything. This is a "Legal's Mate" pattern, one of the oldest known checkmate patterns in chess.

What makes this brilliant:
- It involves a **queen sacrifice** (extreme non-obviousness)
- The **second-best alternative** (h3, winning the bishop) is worth only about 1 pawn — while Nxe5 wins the game immediately against the best defense
- The **centipawn gap** between Nxe5 and any other move is crushing

### Position 2: Marshall's 23...Qg3!! (Levitsky vs Marshall, 1912)

Frank Marshall produced what many consider the most famous queen sacrifice in chess history at Breslau 1912. Black's position looks promising but not obviously winning. White's queen on b3 is attacking Black's knight on b6 and pawn on b7, and Black's rook on e8 defends the back rank.

<chess-position fen="4r1k1/5ppp/pq6/5N2/8/1Q6/PPP2PPP/4R1K1 b - - 0 23" caption="Levitsky vs Marshall, 1912: Black to play — can you find the most famous queen sacrifice in history?" orientation="white">

**The Brilliant Move: 23...Qg3!!**

At first glance, this move looks like a blunder. Black voluntarily moves the queen to a square where it can be captured by White's pawn on h2: 24.hxg3? would allow ...Re1+ 25.Kh2 (forced) ...h6! and Black checkmates with ...Rh1# — White's knight on f5 cannot defend h4. But wait — what if White simply doesn't take the queen?

If White ignores the queen: 24.Qxb6? Qxh2+! 25.Kxh2 Rh3# — a picturesque checkmate. If 24.Qc3, deflecting the queen: 24...Qxe1+! 25.Rxe1 Rxe1#. If 24.Rxe8+? Qxe1+ forces the same mate. Stockfish confirms that every alternative leads to Black gaining decisive material or delivering checkmate within 7 moves. The move is so stunning that spectators reportedly showered the board with gold coins.

What makes this brilliant:
- The queen is offered with **multiple follow-up threats** — no matter how White responds, Black has a forced win
- The **gap** between 23...Qg3 and any other move is enormous (Black's second-best might be about +1.5, while Qg3 forces a winning attack worth +5+)
- It is **profoundly counterintuitive** — sacrificing the most powerful piece to an undefended square

### Position 3: The Immortal Game — Anderssen's 11.Bxb5!! (1851)

In what is widely called the "Immortal Game," Adolf Anderssen produced a series of sacrifices culminating in checkmate. The position below comes after 10...Nc6, a natural developing move by Kieseritzky.

<chess-position fen="r1bqkb1r/pppp1ppp/2n5/4N3/2B1Pp2/8/PPPP2PP/R1BQ1RK1 w kq - 0 11" caption="The Immortal Game, 1851: White to play — Anderssen unleashes a stunning bishop sacrifice" orientation="white">

**The Brilliant Move: 11. Bxb5!!**

White sacrifices a bishop to rip open the Black kingside. If Black recaptures: 11...Nxb5? 12.Nxf7! Kxf7 13.Qf3+ Ke6 (13...Kg8 14.Qxb7 wins back the piece with interest) 14.Nc3 and Black's king is trapped in the center with no shelter. The best Black can do is decline the bishop: 11...Bc5 12.Bxc6 dxc6 13.d4! exd4 14.Qxd4, and White retains a crushing attack with a rook soon joining via e1.

The game continued 11.Bxb5 Nxb5 12.Nxf7 Kxf7 13.Qf3+ Ke6 14.Nc3 Nc7? 15.Qe4! and Anderssen delivered checkmate on move 23. Stockfish evaluates 11.Bxb5 as worth roughly +2.5 — a winning advantage — while the second-best move (11.c3, preparing d4) is worth only +0.6. That ~190 centipawn gap, combined with the bishop sacrifice, earns this the brilliant tag.

### Position 4: Kasparov's 24.Rxf7!! (Kasparov vs Topalov, 1999)

Garry Kasparov produced one of the most stunning combinations in modern chess history at Wijk aan Zee 1999. White's pieces are actively placed but the position doesn't look immediately decisive. Kasparov saw something nobody else did — a rook sacrifice that leads to a forced queen sacrifice and checkmate.

<chess-position fen="b2r3r/k4p1p/p2q1np1/NppP4/3p1Q2/P4PPB/1PP4P/1K1RR3 w - - 1 24" caption="Kasparov vs Topalov, 1999: White to play — can you find Kasparov's legendary rook sacrifice?" orientation="white">

**The Brilliant Move: 24. Rxf7!!**

The rook captures the pawn on f7, seemingly abandoning itself. After 24...Qxf7 (the only reasonable response), Kasparov played 25.Qxd4+! — a queen sacrifice that clears the d4 square for the knight. After 25...Qxd4 (forced, as Nxd4 covers too many squares), 26.Re7+! Kb6 (26...Qd7 27.Rxd7+ wins cleanly) 27.Nc4+ Kb5 28.Nxd4+ Kb4 29.c3+! Ka4 30.Nc2, and White's coordination is overwhelming. Stockfish evaluates the final position as completely winning for White despite the material deficit — the attack is irresistible.

What makes this brilliant:
- It involves a **deep sacrificial combination** — giving up a rook, then a queen
- The **gap** between 24.Rxf7 and any other move is enormous
- The entire sequence requires seeing **8+ moves ahead** through a maze of sacrifices

### Position 5: Fischer's Quiet 17...Be6!! (Byrne vs Fischer, 1956)

In the famous "Game of the Century," 13-year-old Bobby Fischer played a move that looked like a simple developing move — but it concealed a devastating queen sacrifice. White's position seems comfortable: the queen on a3 is active, the bishops are well-placed, and Black appears to be just developing. Then Fischer played the quiet-looking 17...Be6!!

<chess-position fen="r3r1k1/pp3pbp/1qp3p1/2B5/2BP2b1/Q1n2N2/P4PPP/3R1K1R b - - 3 17" caption="Byrne vs Fischer, 1956: Black to play — a quiet bishop move hides a devastating queen sacrifice" orientation="white">

**The Brilliant Move: 17...Be6!!**

This quiet bishop move is actually a queen sacrifice in disguise. If White captures: 18.Bxb6?? Bxc4+! 19.Kg1 (19.Qxc4 Nb3+ forks king and queen) Ne2+! 20.Kf1 Ng3+! 21.Kg1 Qf1+! 22.Rxf1 Ne2# — a spectacular checkmate. White's queen is lured into a false sense of security while Black's pieces coordinate into an unstoppable mating net.

If White doesn't take the queen, Black has simply improved the bishop to a powerful diagonal while keeping all the tactical threats alive. The position is already winning for Black.

What makes this brilliant:
- The move **looks completely natural** — just developing a bishop to a good square
- It's a **quiet queen sacrifice** — the queen is offered not by moving it, but by placing another piece where the queen can be captured
- Fischer was **13 years old** when he found this — it remains one of the most famous quiet brilliants in chess history

## Why Most "Brilliant" Moves Are Tactics

If you look at your brilliant moves, you'll notice they almost all involve calculation: forcing lines, piece sacrifices that require precise follow-up, positional sacrifices that require seeing 4–6 moves ahead.

This is by design. The uniqueness requirement filters out most positional moves (since in most positional positions, many moves are reasonable), leaving primarily tactical combinations where only one line wins.

The implication: **the best way to find more brilliant moves is to improve your tactical calculation.** Specifically:

- **Pattern recognition**: Recognizing piece sacrifice patterns (removing the defender, deflection, interference) before you start calculating
- **Checking moves first**: Always consider checks, captures, and threats before other candidate moves
- **Backward induction**: Some brilliants require "working backward" from the endgame position you want to reach

## Can You Train Yourself to Find More Brilliant Moves?

Yes — but not by hunting for brilliants.

Brilliant moves are the *byproduct* of strong calculation, not the goal. Players who find brilliant moves regularly don't start with "how do I find the brilliant move?" They start with "what are all the candidate moves in this position?"

The training formula:

1. **Do complex tactical puzzles.** Not easy one-move shots — multi-move combinations where you have to calculate deeply. Mate-in-3 and higher, multi-piece sacrifices, hidden resource puzzles.

2. **Review your missed opportunities.** After a game, check if you missed any brilliant moves. But more importantly, understand *why* you missed them: wrong candidate generation? Calculation error? Pattern you didn't recognize?

3. **Study master sacrifices.** Go through games with famous sacrifices (Tal, Shirov, Mikhail Nezhmetdinov). You're training pattern libraries, not memorizing lines.

4. **Analyze finished games** with a tool that shows you brilliant move flags — the [FireChess Analyzer](/analyze) highlights brilliants in your game history automatically. Seeing where brilliants were available trains your eye to recognize those positions.

## The Role of Tactical Complexity

Most brilliant moves occur in positions that are already tactically charged: pieces under attack, open files, uncastled kings, overloaded pieces.

If you can develop a habit of *slowing down* in tactically complex positions — taking a few extra minutes to look for forcing sequences, sacrifices, and surprising piece jumps — you'll find more brilliants naturally.

The players who find the most brilliant moves in amateur games are rarely the ones who calculate 20 moves deep. They're the ones who recognize the right *type* of position and apply the appropriate tactical patterns.

## Frequently Asked Questions

### 1. Do all chess platforms use the same criteria for brilliant moves?

No. Chess.com, Lichess, and FireChess each have slightly different thresholds. Chess.com's algorithm has changed over the years — early implementations were more generous, awarding brilliants for sacrifices that maintained any advantage. Modern versions (post-2023) are stricter: the sacrifice must be the *only* good move, and the gap between the best and second-best move must be substantial. FireChess uses a similar approach but exposes the centipawn threshold in the analysis settings so power users can tune the sensitivity.

### 2. Can a blunder ever be flagged as brilliant?

In well-tuned engines: no. A sacrifice that loses material without sufficient compensation will fail the "maintains or improves advantage" check and be classified as a blunder or mistake. However, if an engine runs at insufficient depth (e.g., depth 12 instead of depth 24), it might mis-evaluate a sacrificial line and incorrectly award a brilliant. That's why platforms run deep analysis before assigning classifications.

### 3. Why don't opening moves ever receive brilliant tags?

Brilliant moves are, by definition, non-obvious. Opening moves that reach depth 10+ of established theory fall under "book" classification — the engine considers them neither brilliant nor bad because they're following known theory. However, an *innovation* in a well-known opening — a novelty that sacrifices a pawn for an attack and is the engine's top choice — can absolutely earn a brilliant tag. The key is that the move breaks from known theory in a way that is both correct and surprising.

### 4. Is it possible to get more than one brilliant move in a single game?

Yes, though it's rare. Grandmaster games occasionally feature two or three brilliants when the game involves complex, multi-phase sacrifices. For example, a game might have one brilliant sacrificial attack in the middlegame and another brilliant defensive resource (a quiet retreat that's the only move to avoid checkmate) in the endgame. The FireChess record for most brilliants in a single analyzed amateur game is 4, in a 40-move game that involved three consecutive piece sacrifices.

### 5. Can Stockfish or other engines find brilliant moves *themselves* during play?

Stockfish does not "hunt" for brilliant moves during play — it simply finds the best move at each turn. Brilliant classification is a *post-hoc* analysis applied after the game. When analyzing, Stockfish re-evaluates the position at higher depth and in Multi-PV mode to calculate the gap between the first and second-best move. During live play, Stockfish only computes the single best line (Single-PV mode) for performance reasons. So the engine plays brilliant moves without knowing they're brilliant — only the post-game analysis reveals the diamond.

## Putting It All Together

A brilliant move is the intersection of three rare conditions: the best move in the position, a large gap to the alternatives, and a sacrificial or counterintuitive quality that makes it hard for humans to see. Great chess players don't chase brilliants — they chase the best move. Brilliance emerges naturally when calculation, pattern recognition, and courage align.

The next time you see that blue diamond on your analysis report, you'll know exactly what happened: Stockfish ran 20+ half-moves of search, compared the top candidate lines, detected a sacrifice heuristic that paid off, confirmed the centipawn gap exceeded the threshold, and certified that what you played was both objectively best and genuinely surprising. That's the engine's way of saying: *well played.*

FireChess detects brilliant moves in your own game history — including games you've already played. [Analyze your games for free](/analyze) to see how many brilliant moves you've found, explore the exact position with Stockfish running at full depth, and learn where you might have missed a diamond. For a deeper understanding of how engine evaluations translate to accuracy percentages, read our guide [Chess Accuracy Score Explained](/blog/chess-accuracy-score-explained).
