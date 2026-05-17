---
title: "Brilliant Moves in Chess: What They Are and How to Find Them"
description: "What makes a move 'brilliant' in chess? How do Chess.com and other platforms detect them, and can you train yourself to find brilliant moves more often?"
date: "2026-06-16"
author: "FireChess Team"
tags: ["analysis", "tactics", "improvement"]
---

If you've analyzed a game on Chess.com, you've seen the electric blue diamond on certain moves — the **brilliant** classification. It's the rarest, most celebrated move badge. But what exactly makes a move brilliant, and how do engines decide to award it?

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

4. **Analyze finished games** with a tool that shows you brilliant move flags. Seeing where brilliants were available trains your eye to recognize those positions.

## The Role of Tactical Complexity

Most brilliant moves occur in positions that are already tactically charged: pieces under attack, open files, uncastled kings, overloaded pieces.

If you can develop a habit of *slowing down* in tactically complex positions — taking a few extra minutes to look for forcing sequences, sacrifices, and surprising piece jumps — you'll find more brilliants naturally.

The players who find the most brilliant moves in amateur games are rarely the ones who calculate 20 moves deep. They're the ones who recognize the right *type* of position and apply the appropriate tactical patterns.

---

*FireChess detects brilliant moves in your own game history — including games you've already played. See how many brilliant moves you've found, and use the analysis board to explore the positions where the engine found one that you missed.*
