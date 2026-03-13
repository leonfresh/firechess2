---
title: "Chaos Chess: We Built a Roguelike Draft Mode Inspired by Clash Royale"
description: "How we took the addictive card-drafting loop from Clash Royale's new draft mode and built Chaos Chess — a roguelike chess experience where both players draft permanent piece modifiers every 5 turns."
date: "2026-03-12"
author: "FireChess Team"
tags: ["chaos chess", "game modes", "chess variants", "feature"]
---

Chess is 1,500 years old. The rules haven't changed since the 15th century. And yet, every few years, someone finds a way to make it feel completely new.

We built Chaos Chess — and the design spark didn't come from another chess game. It came from **Clash Royale**.

<div style="margin: 2rem 0; border-radius: 16px; background: linear-gradient(135deg, #0a0618 0%, #0d0a1e 100%); border: 1px solid rgba(168,85,247,0.18); padding: 20px 16px; box-shadow: 0 0 40px rgba(168,85,247,0.08);">
  <div style="text-align: center; margin-bottom: 12px;">
    <div style="color: white; font-size: 15px; font-weight: 800; margin-bottom: 4px;">Draft Phase 2 of 5 — Pick Your Modifier</div>
    <div style="color: #94a3b8; font-size: 12px;">Turn 10 reached · Choose one permanent upgrade for your pieces</div>
  </div>
  <div style="height: 1px; background: rgba(168,85,247,0.12); margin-bottom: 16px;"></div>
  <div style="display: flex; gap: 10px; justify-content: center; align-items: center;">

    <div style="flex: 1; max-width: 185px; background: #0f1a2e; border: 1.5px solid rgba(34,197,94,0.35); border-radius: 12px; overflow: hidden;">
      <div style="background: rgba(34,197,94,0.1); padding: 6px 0; text-align: center;">
        <span style="color: #4ade80; font-size: 10px; font-weight: 700; letter-spacing: 1.5px;">COMMON</span>
      </div>
      <div style="padding: 14px 10px; text-align: center;">
        <div style="font-size: 30px; margin-bottom: 8px; line-height: 1;">🏃</div>
        <div style="color: white; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Pawn Charge</div>
        <div style="color: #94a3b8; font-size: 11px; line-height: 1.5;">Pawns move 2 squares from any rank, not just the start.</div>
      </div>
      <div style="background: rgba(34,197,94,0.08); border-top: 1px solid rgba(34,197,94,0.18); padding: 6px; text-align: center;">
        <span style="color: #4ade80; font-size: 10px; font-weight: 600;">Affects Pawns</span>
      </div>
    </div>

    <div style="flex: 1; max-width: 205px; background: #150b2a; border: 2px solid rgba(168,85,247,0.85); border-radius: 12px; overflow: hidden; box-shadow: 0 0 28px rgba(168,85,247,0.22), 0 0 0 4px rgba(168,85,247,0.08);">
      <div style="background: rgba(168,85,247,0.18); padding: 6px 0; text-align: center;">
        <span style="color: #c084fc; font-size: 10px; font-weight: 700; letter-spacing: 1.5px;">EPIC</span>
      </div>
      <div style="padding: 16px 10px 12px; text-align: center;">
        <div style="font-size: 34px; margin-bottom: 8px; line-height: 1;">🌀</div>
        <div style="color: white; font-size: 14px; font-weight: 800; margin-bottom: 6px;">Queen Teleport</div>
        <div style="color: #e2d9f3; font-size: 11px; line-height: 1.5;">Your queen warps to any empty square, once per game.</div>
      </div>
      <div style="background: rgba(168,85,247,0.1); border-top: 1px solid rgba(168,85,247,0.25); padding: 6px; text-align: center;">
        <span style="color: #c084fc; font-size: 10px; font-weight: 600;">Affects Queen</span>
      </div>
      <div style="background: rgba(168,85,247,0.28); padding: 5px; text-align: center;">
        <span style="color: #f3e8ff; font-size: 10px; font-weight: 700; letter-spacing: 0.5px;">✓ SELECTED</span>
      </div>
    </div>

    <div style="flex: 1; max-width: 185px; background: #0f1a2e; border: 1.5px solid rgba(59,130,246,0.35); border-radius: 12px; overflow: hidden;">
      <div style="background: rgba(59,130,246,0.1); padding: 6px 0; text-align: center;">
        <span style="color: #60a5fa; font-size: 10px; font-weight: 700; letter-spacing: 1.5px;">RARE</span>
      </div>
      <div style="padding: 14px 10px; text-align: center;">
        <div style="font-size: 30px; margin-bottom: 8px; line-height: 1;">💥</div>
        <div style="color: white; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Collateral Rook</div>
        <div style="color: #94a3b8; font-size: 11px; line-height: 1.5;">Your rook captures every piece in its path at once.</div>
      </div>
      <div style="background: rgba(59,130,246,0.08); border-top: 1px solid rgba(59,130,246,0.18); padding: 6px; text-align: center;">
        <span style="color: #60a5fa; font-size: 10px; font-weight: 600;">Affects Rooks</span>
      </div>
    </div>

  </div>
  <div style="text-align: center; margin-top: 14px; color: #4b5563; font-size: 11px;">Click or tap a card to permanently draft it for the rest of the game</div>
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
