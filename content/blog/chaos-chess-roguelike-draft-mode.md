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
<svg width="700" height="300" viewBox="0 0 700 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="chBg" x1="0" y1="0" x2="700" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0618"/><stop offset="1" stop-color="#12071e"/>
    </linearGradient>
    <radialGradient id="purpGlow" cx="350" cy="150" r="260" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#a855f7" stop-opacity="0.12"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="700" height="300" rx="18" fill="url(#chBg)"/>
  <rect x="1" y="1" width="698" height="298" rx="17" stroke="#a855f7" stroke-opacity="0.15"/>
  <rect width="700" height="300" rx="18" fill="url(#purpGlow)"/>

  <!-- Title -->
  <text x="350" y="38" text-anchor="middle" fill="white" font-size="18" font-weight="800" letter-spacing="0.5">Draft Phase — Pick Your Modifier</text>
  <text x="350" y="58" text-anchor="middle" fill="#94a3b8" font-size="12">Turn 10 · Phase 2 of 5 · Your pick</text>

  <!-- Card 1 — Common -->
  <rect x="30" y="76" width="194" height="196" rx="14" fill="#1e293b" stroke="#22c55e" stroke-opacity="0.4" stroke-width="1.5"/>
  <rect x="30" y="76" width="194" height="40" rx="14" fill="#22c55e" fill-opacity="0.12"/>
  <rect x="30" y="102" width="194" height="14" rx="0" fill="#22c55e" fill-opacity="0.12"/>
  <text x="127" y="98" text-anchor="middle" fill="#22c55e" font-size="10" font-weight="700" letter-spacing="1">COMMON</text>
  <text x="127" y="138" text-anchor="middle" fill="white" font-size="28">🏃</text>
  <text x="127" y="166" text-anchor="middle" fill="white" font-size="14" font-weight="700">Pawn Charge</text>
  <text x="127" y="186" text-anchor="middle" fill="#94a3b8" font-size="11">Pawns can move 2</text>
  <text x="127" y="202" text-anchor="middle" fill="#94a3b8" font-size="11">squares from any rank,</text>
  <text x="127" y="218" text-anchor="middle" fill="#94a3b8" font-size="11">not just the start.</text>
  <rect x="68" y="246" width="118" height="18" rx="9" fill="#22c55e" fill-opacity="0.15" stroke="#22c55e" stroke-opacity="0.3"/>
  <text x="127" y="259" text-anchor="middle" fill="#4ade80" font-size="10" font-weight="600">♟ Affects Pawns</text>

  <!-- Card 2 — Epic (highlighted/selected) -->
  <rect x="253" y="68" width="194" height="212" rx="14" fill="#1e1030" stroke="#a855f7" stroke-opacity="0.8" stroke-width="2"/>
  <rect x="253" y="68" width="194" height="40" rx="14" fill="#a855f7" fill-opacity="0.18"/>
  <rect x="253" y="94" width="194" height="14" rx="0" fill="#a855f7" fill-opacity="0.18"/>
  <text x="350" y="90" text-anchor="middle" fill="#c084fc" font-size="10" font-weight="700" letter-spacing="1">EPIC</text>
  <text x="350" y="133" text-anchor="middle" fill="white" font-size="30">🌀</text>
  <text x="350" y="162" text-anchor="middle" fill="white" font-size="14" font-weight="700">Queen Teleport</text>
  <text x="350" y="182" text-anchor="middle" fill="#94a3b8" font-size="11">Your queen can teleport</text>
  <text x="350" y="198" text-anchor="middle" fill="#94a3b8" font-size="11">to any empty square</text>
  <text x="350" y="214" text-anchor="middle" fill="#94a3b8" font-size="11">once per game.</text>
  <rect x="291" y="242" width="118" height="18" rx="9" fill="#a855f7" fill-opacity="0.15" stroke="#a855f7" stroke-opacity="0.4"/>
  <text x="350" y="255" text-anchor="middle" fill="#c084fc" font-size="10" font-weight="600">♛ Affects Queen</text>
  <!-- selected glow ring -->
  <rect x="250" y="65" width="200" height="218" rx="16" fill="none" stroke="#a855f7" stroke-opacity="0.35" stroke-width="4"/>

  <!-- Card 3 — Rare -->
  <rect x="476" y="76" width="194" height="196" rx="14" fill="#1e293b" stroke="#3b82f6" stroke-opacity="0.4" stroke-width="1.5"/>
  <rect x="476" y="76" width="194" height="40" rx="14" fill="#3b82f6" fill-opacity="0.10"/>
  <rect x="476" y="102" width="194" height="14" rx="0" fill="#3b82f6" fill-opacity="0.10"/>
  <text x="573" y="98" text-anchor="middle" fill="#60a5fa" font-size="10" font-weight="700" letter-spacing="1">RARE</text>
  <text x="573" y="138" text-anchor="middle" fill="white" font-size="28">💥</text>
  <text x="573" y="166" text-anchor="middle" fill="white" font-size="14" font-weight="700">Collateral Rook</text>
  <text x="573" y="186" text-anchor="middle" fill="#94a3b8" font-size="11">Your rook captures</text>
  <text x="573" y="202" text-anchor="middle" fill="#94a3b8" font-size="11">all pieces in its path,</text>
  <text x="573" y="218" text-anchor="middle" fill="#94a3b8" font-size="11">not just the first.</text>
  <rect x="514" y="246" width="118" height="18" rx="9" fill="#3b82f6" fill-opacity="0.12" stroke="#3b82f6" stroke-opacity="0.3"/>
  <text x="573" y="259" text-anchor="middle" fill="#60a5fa" font-size="10" font-weight="600">♜ Affects Rooks</text>

  <!-- "Choose" label at bottom -->
  <text x="350" y="291" text-anchor="middle" fill="#475569" font-size="11">Tap or click any card to draft it permanently</text>
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
