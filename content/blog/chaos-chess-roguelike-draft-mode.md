---
title: "Chaos Chess: We Built a Chess Variant Inspired by Clash Royale's C.H.A.O.S Mode"
description: "How we took the permanent modifier system from Clash Royale's C.H.A.O.S mode and built Chaos Chess — a chess experience where both players pick permanent piece modifiers every 5 turns, with rarity escalating as the game goes on."
date: "2026-03-14"
author: "FireChess Team"
tags: ["chaos chess", "game modes", "chess variants", "feature"]
---

Chess is 1,500 years old. The rules haven't changed since the 15th century. And yet, every few years, someone finds a way to make it feel completely new.

We built Chaos Chess — and the design spark didn't come from another chess game. It came from **Clash Royale**.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="290" viewBox="0 0 680 290" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ccBg" x1="0" y1="0" x2="680" y2="290" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0a0618"/><stop offset="1" stop-color="#0d0a1e"/></linearGradient>
    <radialGradient id="ccGlow" cx="340" cy="145" r="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a855f7" stop-opacity="0.13"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></radialGradient>
    <filter id="ccSelGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="680" height="290" rx="18" fill="url(#ccBg)"/>
  <rect x="1" y="1" width="678" height="288" rx="17" stroke="#a855f7" stroke-opacity="0.16"/>
  <rect width="680" height="290" rx="18" fill="url(#ccGlow)"/>
  <text x="340" y="30" text-anchor="middle" fill="white" font-size="14" font-weight="800">Draft Phase 2 of 5 — Pick Your Modifier</text>
  <text x="340" y="48" text-anchor="middle" fill="#94a3b8" font-size="11">Turn 10 reached · Choose one permanent upgrade for your pieces</text>
  <line x1="40" y1="58" x2="640" y2="58" stroke="#a855f7" stroke-opacity="0.1"/>
  <!-- CARD 1: COMMON - Pawn Charge -->
  <rect x="28" y="70" width="188" height="192" rx="12" fill="#0f1a2e" stroke="#22c55e" stroke-opacity="0.3" stroke-width="1.5"/>
  <rect x="28" y="70" width="188" height="30" rx="12" fill="#22c55e" fill-opacity="0.09"/>
  <rect x="28" y="88" width="188" height="12" fill="#22c55e" fill-opacity="0.09"/>
  <text x="122" y="89" text-anchor="middle" fill="#4ade80" font-size="9" font-weight="700" letter-spacing="1.5">COMMON</text>
  <!-- pawn icon -->
  <circle cx="122" cy="126" r="10" fill="#d1d5db" fill-opacity="0.85"/>
  <path d="M115,136 L112,148 L114,152 L130,152 L132,148 L129,136 Z" fill="#d1d5db" fill-opacity="0.85"/>
  <rect x="110" y="152" width="24" height="5" rx="2" fill="#d1d5db" fill-opacity="0.7"/>
  <text x="122" y="178" text-anchor="middle" fill="white" font-size="12" font-weight="700">Pawn Charge</text>
  <text x="122" y="196" text-anchor="middle" fill="#94a3b8" font-size="10">Pawns move 2 squares</text>
  <text x="122" y="210" text-anchor="middle" fill="#94a3b8" font-size="10">from any rank.</text>
  <rect x="62" y="222" width="120" height="16" rx="8" fill="#22c55e" fill-opacity="0.1" stroke="#22c55e" stroke-opacity="0.2"/>
  <text x="122" y="233" text-anchor="middle" fill="#4ade80" font-size="9" font-weight="600">Affects Pawns</text>
  <!-- CARD 2: EPIC - Queen Teleport (selected) -->
  <rect x="238" y="58" width="204" height="216" rx="12" fill="#150b2a" stroke="#a855f7" stroke-opacity="0.9" stroke-width="2" filter="url(#ccSelGlow)"/>
  <rect x="234" y="54" width="212" height="224" rx="14" fill="none" stroke="#a855f7" stroke-opacity="0.18" stroke-width="6"/>
  <rect x="238" y="58" width="204" height="30" rx="12" fill="#a855f7" fill-opacity="0.16"/>
  <rect x="238" y="76" width="204" height="12" fill="#a855f7" fill-opacity="0.16"/>
  <text x="340" y="77" text-anchor="middle" fill="#c084fc" font-size="9" font-weight="700" letter-spacing="1.5">EPIC</text>
  <!-- queen icon -->
  <circle cx="340" cy="118" r="12" fill="#c084fc" fill-opacity="0.9"/>
  <path d="M328,114 L320,104 L328,112 L334,100 L340,112 L346,100 L352,112 L360,104 L352,114 Z" fill="#c084fc" fill-opacity="0.7"/>
  <path d="M325,118 L322,136 L358,136 L355,118 Z" fill="#c084fc" fill-opacity="0.85"/>
  <rect x="320" y="136" width="40" height="6" rx="2" fill="#c084fc" fill-opacity="0.7"/>
  <!-- teleport arc lines -->
  <path d="M296,118 Q280,100 296,82" stroke="#a855f7" stroke-opacity="0.4" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/>
  <path d="M384,118 Q400,100 384,82" stroke="#a855f7" stroke-opacity="0.4" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/>
  <text x="340" y="162" text-anchor="middle" fill="white" font-size="13" font-weight="800">Queen Teleport</text>
  <text x="340" y="180" text-anchor="middle" fill="#e2d9f3" font-size="10">Your queen warps to any</text>
  <text x="340" y="194" text-anchor="middle" fill="#e2d9f3" font-size="10">empty square, once per game.</text>
  <rect x="274" y="206" width="132" height="16" rx="8" fill="#a855f7" fill-opacity="0.13" stroke="#a855f7" stroke-opacity="0.3"/>
  <text x="340" y="217" text-anchor="middle" fill="#c084fc" font-size="9" font-weight="600">Affects Queen</text>
  <rect x="284" y="228" width="112" height="18" rx="9" fill="#a855f7" fill-opacity="0.28"/>
  <text x="340" y="240" text-anchor="middle" fill="#f3e8ff" font-size="9" font-weight="700" letter-spacing="0.5">✓  SELECTED</text>
  <!-- CARD 3: RARE - Collateral Rook -->
  <rect x="464" y="70" width="188" height="192" rx="12" fill="#0f1a2e" stroke="#3b82f6" stroke-opacity="0.3" stroke-width="1.5"/>
  <rect x="464" y="70" width="188" height="30" rx="12" fill="#3b82f6" fill-opacity="0.09"/>
  <rect x="464" y="88" width="188" height="12" fill="#3b82f6" fill-opacity="0.09"/>
  <text x="558" y="89" text-anchor="middle" fill="#60a5fa" font-size="9" font-weight="700" letter-spacing="1.5">RARE</text>
  <!-- rook icon -->
  <rect x="545" y="110" width="26" height="6" rx="1.5" fill="#93c5fd" fill-opacity="0.85"/>
  <rect x="547" y="104" width="5" height="8" rx="1" fill="#93c5fd" fill-opacity="0.85"/>
  <rect x="555" y="104" width="5" height="8" rx="1" fill="#93c5fd" fill-opacity="0.85"/>
  <rect x="563" y="104" width="5" height="8" rx="1" fill="#93c5fd" fill-opacity="0.85"/>
  <rect x="547" y="116" width="22" height="22" rx="1.5" fill="#93c5fd" fill-opacity="0.85"/>
  <rect x="543" y="138" width="30" height="5" rx="2" fill="#93c5fd" fill-opacity="0.7"/>
  <!-- explosion sparks -->
  <line x1="582" y1="120" x2="594" y2="112" stroke="#60a5fa" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="584" y1="128" x2="598" y2="128" stroke="#60a5fa" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="582" y1="136" x2="593" y2="145" stroke="#60a5fa" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
  <text x="558" y="178" text-anchor="middle" fill="white" font-size="12" font-weight="700">Collateral Rook</text>
  <text x="558" y="196" text-anchor="middle" fill="#94a3b8" font-size="10">Captures every piece</text>
  <text x="558" y="210" text-anchor="middle" fill="#94a3b8" font-size="10">in its path at once.</text>
  <rect x="498" y="222" width="120" height="16" rx="8" fill="#3b82f6" fill-opacity="0.1" stroke="#3b82f6" stroke-opacity="0.2"/>
  <text x="558" y="233" text-anchor="middle" fill="#60a5fa" font-size="9" font-weight="600">Affects Rooks</text>
  <text x="340" y="272" text-anchor="middle" fill="#4b5563" font-size="10">Click or tap a card to permanently draft it for the rest of the game</text>
</svg>
</div>

## The Clash Royale C.H.A.O.S Mode — and the Chess Opportunity

If you've played Clash Royale recently, you might know **C.H.A.O.S mode**. Every 50–60 seconds, the battle pauses and both players are simultaneously shown two modifier options for one of their cards — each card has three possible modifiers across the rarity tiers. You both pick at the same time; pick randomly if you don't choose in 10 seconds. Once both players have chosen, the battle resumes with the modifier now permanently active for the rest of the match. The modifiers get rarer and more powerful as the game progresses: Common on the first pick, Rare through the middle rounds, and a guaranteed Epic in overtime.

That last part is what got me thinking.

What if you could apply that drafting loop to chess? Not the cards themselves — chess doesn't need cards. But the **core loop**: play a few rounds, then stop and make a strategic choice that permanently changes the rules for both players, then keep playing. The game mutates in real time. Every match is a completely different experience.

The result is **Chaos Chess**.

## How Chaos Chess Works

The rules start simple: it's regular chess. You play against Stockfish AI, a friend you invite with a room code, or a random opponent through matchmaking.

But at **turns 5, 10, 15, 20, and 25**, the game freezes.

Both players are shown three modifier cards — mirroring the simultaneous pick structure of C.H.A.O.S — and each picks one. The modifier they choose is **permanent for the rest of the game**. It changes how their pieces move, what they can capture, or grants entirely new abilities.

Your opponent picks their own modifier at the same time. You watch what they chose. Now you know they have a ghost rook that slides through pieces, or a queen that can teleport once per game. You play around it. You pick counters. The same strategic tension that makes C.H.A.O.S so compelling in Clash Royale plays out over a chessboard.

After the draft, the game resumes. Both players now have different pieces than they started with. By turn 25, you and your opponent will have 5 modifiers each, and the board is playing by rules that didn't exist at move one.

## The Modifier Tiers

Modifiers come in four tiers, just like card rarities in Clash Royale:

**🟢 Common** — Movement upgrades. Pawns that can charge from any rank. Knights that can also step like a king. Bishops that can sprint an extra square. These are strong but predictable.

**🔵 Rare** — Tactical abilities. A Rook that deals collateral damage to every piece it passes through. A Bishop that bounces off walls like a billiard ball. A Pawn that promotes on rank 5 instead of rank 8. These change how you calculate lines.

**🟣 Epic** — Piece transformations. The Knook — a knight that also has rook moves. The Archbishop — a bishop fused with a knight. Queen Teleport. Phantom Rook that phases through pieces. These feel broken until you realize your opponent probably has something equally broken.

**🟡 Legendary** — Game-warping. Nuclear Queen — captures destroy adjacent squares. King Ascension — your king gains the movement of a queen. Undead Army — captures revive your pieces on the back rank. The AI saving a Legendary for phase 5 is terrifying.

## Opening Anomalies: The Pre-Game Layer

The modifier draft starts at move 5. But we wanted to add a strategic layer that began *before* move one.

**Opening Anomalies** are a set of 22 Tarot-themed pre-game powers. Before the game starts, each player secretly picks one anomaly from a revealed set of four choices (free players choose from two; Pro unlocks all four). The choice is permanent for the entire match — your opponent never sees what you picked until you use it.

Anomalies are different from modifiers in a key way: they're **board-shaping passives, not piece upgrades**. Where a modifier turns your knight into a Knook or gives your rook collateral damage, an anomaly rewires the rules around you.

Some examples:

- **The Fool** — Your pawns can also step diagonally forward onto empty squares, like a wandering knight pawn.
- **The Emperor** — Your king can leap up to two squares in any direction, once per turn.
- **The Moon** — After turn 10, your queen gains ghost movement: she can pass through any piece to reach her target.
- **The Star** — Your knights also move as camel pieces (3+1 jumps), making them almost impossible to block.
- **Death** — Every 5 turns, a pawn is born on a random empty square on your second rank. You start generating material for free.
- **Strength** — Activate once per game: your king can move and capture like a queen for that turn.
- **Judgement** — Activate once per game: revive any piece you've lost and place it anywhere on your back rank.

Each anomaly also has a **once-per-game activation ability** — a button you can press at any point in the match. The Sun anomaly adds a free random modifier mid-game. Judgement brings a captured piece back to life. The Hanged Man lets you transform one of your pieces into any other.

The strategic tension is the same as the modifier draft — you're reading your opponent's anomaly, playing around what they might do — but compressed into a single secret pick at the start.

### The Stockfish Challenge

One honest engineering note: Stockfish doesn't know about anomaly powers. It evaluates positions using standard chess rules. A queen with Moon anomaly can move through pieces after turn 10, but Stockfish doesn't know that — it only sees the resulting position after each move, not the ghost movement that created it.

We've addressed this with a custom threat-scoring layer: after each Stockfish evaluation, we run a secondary pass that scores the anomaly-powered threats the engine can't see. Fool diagonal pawn captures, Emperor king leaps, Star camel captures, nuclear queen blast radii — these all feed into a penalty/bonus system that adjusts Stockfish's raw evaluations. It's not perfect, but it means the AI at least *responds* to the presence of these powers when choosing its moves, rather than being completely blind to them.

It's a more interesting opponent because of it. You can still surprise it. But you can't just steamroll it with a Moon queen after turn 10 and have it do nothing.



When a transformative modifier turns your knight into an Archbishop or your rook into a Knook, the piece image actually changes on the board. We commissioned custom SVG fairy piece sets that show up the moment you draft the modifier.

There's also a visual overlay system: pieces with active modifiers get emoji badges, pulsing glows, and SVG decorations so you (and your opponent) always know at a glance what each piece can do. A piece with the ghost modifier gets a faded, haunted look and a 👻 badge. The Nuclear Queen gets a ☢️ badge and a green radioactive glow. The War Pawn — which happens when you draft both Pawn Charge and Pawn Bayonet — gets replaced entirely with an entirely new SVG piece art.

You're never confused about what your pieces can do. The board tells you.

## The Engine Under the Hood

The hard engineering problem was making these moves actually work.

Chess engines like chess.js have a fixed move generator. They know nothing about Knooks or ghost rooks. Our solution was to build a **custom move engine layered on top** of chess.js: after computing standard legal moves, we run a second pass that generates all the extra legal moves that active modifiers unlock. The UI shows both sets as valid destinations. When you play a chaos move, we manipulate the board state directly and feed the resulting position back into a fresh Chess instance.

This means Stockfish can still analyze the resulting positions — it just can't reason about the chaos moves themselves, which actually makes it a more interesting opponent because you can surprise it.

## A Real Competitive Mode

Chaos Chess isn't just a casual sandbox. It has a full **ELO rating system** starting at 1200, with K-factor adjustments (K=40 provisional, K=20 for rated players, K=10 above 2000). After every ranked game your rating updates.

There are five time controls — Unlimited through Bullet, Blitz, and Rapid — and clocks keep running through the draft phases. Fast drafters have an edge.

The **Chaos Chess Leaderboard** at [firechess.com/leaderboard/chaos](https://firechess.com/leaderboard/chaos) tracks the top 50 players with rating tier badges. The tiers mirror the modifier rarities: 1200 is Challenger, 1600 is Expert, 2000+ is Master tier.

## Why Draft Modes Work

The reason Clash Royale's C.H.A.O.S mode is so satisfying — and why we think Chaos Chess captures the same energy — is that simultaneous modifier selection solves a specific frustration in pure skill games: the feeling that your loss was inevitable before it started because your opponent was already stronger.

When both players are building their "deck" simultaneously in real time over the course of the game, wins and losses feel earned. You're not just playing better chess than your opponent — you're out-drafting them, out-adapting them, and finding combinations they didn't see coming.

The modifier that crushes you in one game is the modifier your opponent doesn't draft in the next. The meta shifts every match.

## Try It

Chaos Chess is live at [firechess.com/chaos](https://firechess.com/chaos). No account required for solo play against Stockfish. For rated multiplayer you'll need to sign in, but that takes 10 seconds with a magic link.

If you've ever felt like chess needed a shake-up but didn't want to abandon the game you love — this is for you.

The pieces are the same. The board is the same. But by move 20, nothing else will be.
