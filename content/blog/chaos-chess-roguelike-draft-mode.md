---
title: "Chaos Chess: We Built a Roguelike Draft Mode Inspired by Clash Royale"
description: "How we took the addictive card-drafting loop from Clash Royale's new draft mode and built Chaos Chess — a roguelike chess experience where both players draft permanent piece modifiers every 5 turns."
date: "2026-03-12"
author: "FireChess Team"
tags: ["chaos chess", "game modes", "chess variants", "feature"]
---

Chess is 1,500 years old. The rules haven't changed since the 15th century. And yet, every few years, someone finds a way to make it feel completely new.

We built Chaos Chess — and the design spark didn't come from another chess game. It came from **Clash Royale**.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="260" viewBox="0 0 680 260" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dc-bg" x1="0" y1="0" x2="680" y2="260" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0618"/><stop offset="1" stop-color="#0d0a1e"/>
    </linearGradient>
    <radialGradient id="dc-glow" cx="340" cy="130" r="220" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#a855f7" stop-opacity="0.14"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="680" height="260" rx="18" fill="url(#dc-bg)"/>
  <rect x="1" y="1" width="678" height="258" rx="17" stroke="#a855f7" stroke-opacity="0.18"/>
  <rect width="680" height="260" rx="18" fill="url(#dc-glow)"/>

  <!-- Header -->
  <text x="340" y="32" text-anchor="middle" fill="white" font-size="15" font-weight="800">Draft Phase 2 of 5 — Pick Your Modifier</text>
  <text x="340" y="50" text-anchor="middle" fill="#94a3b8" font-size="11">Turn 10 reached · Choose one permanent upgrade for your pieces</text>

  <!-- Divider -->
  <line x1="40" y1="60" x2="640" y2="60" stroke="#a855f7" stroke-opacity="0.12" stroke-width="1"/>

  <!-- CARD 1: Common — Pawn Charge -->
  <rect x="28" y="74" width="190" height="158" rx="12" fill="#0f1a2e" stroke="#22c55e" stroke-opacity="0.35" stroke-width="1.5"/>
  <!-- tier strip -->
  <rect x="28" y="74" width="190" height="28" rx="12" fill="#22c55e" fill-opacity="0.10"/>
  <rect x="28" y="90" width="190" height="12" fill="#22c55e" fill-opacity="0.10"/>
  <text x="123" y="91" text-anchor="middle" fill="#4ade80" font-size="9" font-weight="700" letter-spacing="1.5">COMMON</text>
  <!-- icon area -->
  <rect x="90" y="110" width="66" height="50" rx="10" fill="#22c55e" fill-opacity="0.07"/>
  <text x="123" y="145" text-anchor="middle" font-size="30">&#x1F3C3;</text>
  <!-- name -->
  <text x="123" y="178" text-anchor="middle" fill="white" font-size="12" font-weight="700">Pawn Charge</text>
  <!-- desc lines -->
  <text x="123" y="196" text-anchor="middle" fill="#94a3b8" font-size="9.5">Pawns move 2 squares from</text>
  <text x="123" y="209" text-anchor="middle" fill="#94a3b8" font-size="9.5">any rank, not just the start.</text>
  <!-- piece tag -->
  <rect x="73" y="218" width="100" height="14" rx="7" fill="#22c55e" fill-opacity="0.12" stroke="#22c55e" stroke-opacity="0.25"/>
  <text x="123" y="228" text-anchor="middle" fill="#4ade80" font-size="8.5" font-weight="600">Affects Pawns</text>

  <!-- CARD 2: Epic — Queen Teleport (selected, enlarged) -->
  <rect x="244" y="64" width="192" height="178" rx="12" fill="#150b2a" stroke="#a855f7" stroke-opacity="0.85" stroke-width="2"/>
  <!-- outer glow ring -->
  <rect x="241" y="61" width="198" height="184" rx="14" fill="none" stroke="#a855f7" stroke-opacity="0.22" stroke-width="5"/>
  <!-- tier strip -->
  <rect x="244" y="64" width="192" height="28" rx="12" fill="#a855f7" fill-opacity="0.16"/>
  <rect x="244" y="80" width="192" height="12" fill="#a855f7" fill-opacity="0.16"/>
  <text x="340" y="81" text-anchor="middle" fill="#c084fc" font-size="9" font-weight="700" letter-spacing="1.5">EPIC</text>
  <!-- icon area -->
  <rect x="304" y="100" width="72" height="54" rx="10" fill="#a855f7" fill-opacity="0.10"/>
  <text x="340" y="138" text-anchor="middle" font-size="33">&#x1F300;</text>
  <!-- name -->
  <text x="340" y="172" text-anchor="middle" fill="white" font-size="13" font-weight="800">Queen Teleport</text>
  <!-- desc lines -->
  <text x="340" y="191" text-anchor="middle" fill="#e2d9f3" font-size="9.5">Your queen warps to any</text>
  <text x="340" y="204" text-anchor="middle" fill="#e2d9f3" font-size="9.5">empty square, once per game.</text>
  <!-- piece tag -->
  <rect x="284" y="214" width="112" height="14" rx="7" fill="#a855f7" fill-opacity="0.15" stroke="#a855f7" stroke-opacity="0.35"/>
  <text x="340" y="224" text-anchor="middle" fill="#c084fc" font-size="8.5" font-weight="600">Affects Queen</text>
  <!-- Selected badge -->
  <rect x="294" y="235" width="92" height="14" rx="7" fill="#a855f7" fill-opacity="0.3"/>
  <text x="340" y="245" text-anchor="middle" fill="#f3e8ff" font-size="8" font-weight="700" letter-spacing="0.5">&#x2713; SELECTED</text>

  <!-- CARD 3: Rare — Collateral Rook -->
  <rect x="462" y="74" width="190" height="158" rx="12" fill="#0f1a2e" stroke="#3b82f6" stroke-opacity="0.35" stroke-width="1.5"/>
  <!-- tier strip -->
  <rect x="462" y="74" width="190" height="28" rx="12" fill="#3b82f6" fill-opacity="0.10"/>
  <rect x="462" y="90" width="190" height="12" fill="#3b82f6" fill-opacity="0.10"/>
  <text x="557" y="91" text-anchor="middle" fill="#60a5fa" font-size="9" font-weight="700" letter-spacing="1.5">RARE</text>
  <!-- icon area -->
  <rect x="524" y="110" width="66" height="50" rx="10" fill="#3b82f6" fill-opacity="0.07"/>
  <text x="557" y="145" text-anchor="middle" font-size="30">&#x1F4A5;</text>
  <!-- name -->
  <text x="557" y="178" text-anchor="middle" fill="white" font-size="12" font-weight="700">Collateral Rook</text>
  <!-- desc lines -->
  <text x="557" y="196" text-anchor="middle" fill="#94a3b8" font-size="9.5">Your rook captures every</text>
  <text x="557" y="209" text-anchor="middle" fill="#94a3b8" font-size="9.5">piece in its path at once.</text>
  <!-- piece tag -->
  <rect x="507" y="218" width="100" height="14" rx="7" fill="#3b82f6" fill-opacity="0.12" stroke="#3b82f6" stroke-opacity="0.25"/>
  <text x="557" y="228" text-anchor="middle" fill="#60a5fa" font-size="8.5" font-weight="600">Affects Rooks</text>

  <!-- Footer -->
  <text x="340" y="251" text-anchor="middle" fill="#4b5563" font-size="10">Click or tap a card to permanently draft it for the rest of the game</text>
</svg>
</div>

## The Clash Royale Draft Problem — and the Chess Opportunity

If you've played Clash Royale recently, you know the new **Draft Challenges** mode. You and your opponent alternate picking cards from a shared pool, so you're always reacting to what the other person takes. It's tense, it's strategic, and it completely changes how the game feels even though the underlying mechanics didn't change at all.

That last part is what got me thinking.

What if you could apply that drafting loop to chess? Not the cards themselves — chess doesn't need cards. But the **core loop**: play a few rounds, then stop and make a strategic choice that permanently changes the rules for both players, then keep playing. The game mutates in real time. Every match is a completely different experience.

The result is **Chaos Chess**.

## How Chaos Chess Works

The rules start simple: it's regular chess. You play against Stockfish AI, a friend you invite with a room code, or a random opponent through matchmaking.

But at **turns 5, 10, 15, 20, and 25**, the game freezes.

Both players are shown three modifier cards — like a Clash Royale draft — and each picks one. The modifier they choose is **permanent for the rest of the game**. It changes how their pieces move, what they can capture, or grants entirely new abilities.

Your opponent picks their own modifier at the same time. You watch what they chose. Now you know they have a ghost rook that slides through pieces, or a queen that can teleport once per game. You play around it. You draft counters. The same strategic layer that makes draft modes compelling in Clash Royale plays out over a chessboard.

After the draft, the game resumes. Both players now have different pieces than they started with. By turn 25, you and your opponent will have 5 modifiers each, and the board is playing by rules that didn't exist at move one.

## The Modifier Tiers

Modifiers come in four tiers, just like card rarities in Clash Royale:

**🟢 Common** — Movement upgrades. Pawns that can charge from any rank. Knights that can also step like a king. Bishops that can sprint an extra square. These are strong but predictable.

**🔵 Rare** — Tactical abilities. A Rook that deals collateral damage to every piece it passes through. A Bishop that bounces off walls like a billiard ball. A Pawn that promotes on rank 5 instead of rank 8. These change how you calculate lines.

**🟣 Epic** — Piece transformations. The Knook — a knight that also has rook moves. The Archbishop — a bishop fused with a knight. Queen Teleport. Phantom Rook that phases through pieces. These feel broken until you realize your opponent probably has something equally broken.

**🟡 Legendary** — Game-warping. Nuclear Queen — captures destroy adjacent squares. King Ascension — your king gains the movement of a queen. Undead Army — captures revive your pieces on the back rank. The AI saving a Legendary for phase 5 is terrifying.

## Fairy Pieces with Real Custom Art

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

The reason Clash Royale's draft mode is so popular — and why we think Chaos Chess captures the same energy — is that drafting solves a specific frustration in pure skill games: the feeling that your loss was inevitable before it started because your opponent's deck was better.

When both players are building their "deck" simultaneously in real time over the course of the game, wins and losses feel earned. You're not just playing better chess than your opponent — you're out-drafting them, out-adapting them, and finding combinations they didn't see coming.

The modifier that crushes you in one game is the modifier your opponent doesn't draft in the next. The meta shifts every match.

## Try It

Chaos Chess is live at [firechess.com/chaos](https://firechess.com/chaos). No account required for solo play against Stockfish. For rated multiplayer you'll need to sign in, but that takes 10 seconds with a magic link.

If you've ever felt like chess needed a shake-up but didn't want to abandon the game you love — this is for you.

The pieces are the same. The board is the same. But by move 20, nothing else will be.
