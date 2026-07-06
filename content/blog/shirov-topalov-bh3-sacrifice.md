---
title: "The Immortal Bh3 Sacrifice: Shirov vs Topalov 1998 — The Greatest Endgame Move in Chess History"
description: "Analyze Alexei Shirov's legendary 47...Bh3!! against Veselin Topalov at Linares 1998 — a bishop sacrifice so deep that computers thought it was losing and even Kasparov was stumped."
date: 2026-07-06
author: "FireChess Team"
tags: ["shirov topalov bh3", "greatest chess moves", "famous chess games", "endgame sacrifice", "chess brilliancy", "zugzwang"]
---

Some chess moves are brilliant. A rare few transcend the game itself. Alexei Shirov's **47...Bh3!!** against Veselin Topalov at Linares 1998 is one of them — a bishop sacrifice so counter-intuitive that chess engines of the era evaluated it as a losing blunder, and even Garry Kasparov, watching from the ringside, couldn't immediately explain what Shirov had seen.

Play through the full game below. The critical moment comes at move 47:

<chess-position fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -" moves="d4,Nf6,c4,g6,Nc3,d5,cxd5,Nxd5,e4,Nxc3,bxc3,Bg7,Bb5+,c6,Ba4,O-O,Ne2,Nd7,O-O,e5,f3,Qe7,Be3,Rd8,Qc2,Nb6,Bb3,Be6,Rad1,Nc4,Bc1,b5,f4,exd4,Nxd4,Bg4,Rde1,Qc5,Kh1,a5,h3,Bd7,a4,bxa4,Ba2,Be8,e5,Nb6,f5,Nd5,Bd2,Nb4,Qxa4,Nxa2,Qxa2,Bxe5,fxg6,hxg6,Bg5,Rd5,Re3,Qd6,Qe2,Bd7,c4,Bxd4,cxd5,Bxe3,Qxe3,Re8,Qc3,Qxd5,Bh6,Re5,Rf3,Qc5,Qa1,Bf5,Re3,f6,Rxe5,Qxe5,Qa2+,Qd5,Qxd5+,cxd5,Bd2,a4,Bc3,Kf7,h4,Ke6,Kg1,Bh3,gxh3,Kf5,Kf2,Ke4,Bxf6,d4,Be7,Kd3,Bc5,Kc4,Be7,Kb3" orientation="white" caption="Topalov vs Shirov, Linares 1998 — Play through the entire game, from the Grünfeld opening to the legendary bishop sacrifice and the endgame king march"></chess-position>

## The Setup: Linares 1998

The 1998 Linares super-tournament was one of the strongest events of its era. Veselin Topalov (White, 2740) faced Alexei Shirov (Black, 2710) in the tenth round. The game began as a **Grünfeld Defense, Exchange Variation** — a sharp opening where Black concedes central space to activate pieces against White's pawn center.

Both players navigated the opening accurately. The game saw queens and rooks exchanged early, transitioning into a complex opposite-colored bishops endgame. By move 40, the position had crystallized.

## The Critical Moment: 47.Kg1

Topalov played **47.Kg1**, a natural-looking move that brings the king toward the center. It was the last move before disaster.

<chess-position fen="8/8/4kpp1/3p1b2/p6P/2B5/6P1/6K1 b - - 2 47" caption="Position after 47.Kg1 — White's king centralizes, but this normal-looking move loses. Black to play." orientation="black"></chess-position>

## 47...Bh3!! — The Move That Broke Chess

> "The best endgame move ever played." — Various grandmasters

Shirov played **47...Bh3!!**, placing his bishop on a square attacked by White's g2-pawn and adjacent to the h4-pawn. On the surface, it's a simple blunder: one of White's pawns can capture for free.

<chess-position fen="8/8/4kpp1/3p4/p6P/2B4b/6P1/6K1 w - - 3 48" moves="gxh3,Kf5,Kf2,Ke4,Bxf6,d4,Be7,Kd3,Bc5,Kc4,Be7,Kb3" analysis caption="47...Bh3!! — The bishop is en prise to two pawns, yet neither capture saves White. Play through the main line (analysis badges via Stockfish)." orientation="black"></chess-position>

But the sacrifice is the point. Here's why:

### If White Captures: 48.gxh3

If Topalov had played **48.gxh3**, Black's king immediately runs to the center:

> **48.gxh3 Kf5 49.Kf2 Ke4**

The black king reaches e4 one tempo faster than White's king can reach e3. With the black king blocking the d-pawn's path and controlling the promotion square, Black's passed d-pawn becomes unstoppable. After **50.Bxf6 d4**, the pawn advances. White's bishop can't stop both the d-pawn and the a-pawn from promoting:

> **51.Be7 Kd3 52.Bc5 Kc4 53.Be7 Kb3**

The white king is still stuck on f2, guarding the g-pawn. Black's king marches to b3 to support the a-pawn, and White must resign. The sacrifice cost Black the bishop but earned the decisive tempo needed to win the king-and-pawn race.

### If White Declines: 48.Kf2

What if Topalov tried a different strategy, moving the king toward the center without capturing?

<chess-position fen="8/8/4kpp1/3p4/p6P/2B4b/6P1/6K1 w - - 3 48" moves="Kf2,Kf5,Ke3,Bxg2" orientation="black" caption="If White declines the sacrifice with 48.Kf2, Black simply takes the g2-pawn, creating three connected passed pawns on the kingside."></chess-position>

> **48.Kf2 Kf5 49.Ke3 Bxg2**

Now Black simply captures the g2-pawn, giving Black **three connected passed pawns** on the kingside. White's bishop can't halt the advancing pawns, and Black's king has full freedom. This line is even worse for White — Black converts with minimal resistance.

## Why Computers Couldn't See It

In 1998, chess engines evaluated positions based on material. A bishop is worth roughly three pawns. Sacrificing a bishop for a tempo check — with no immediate compensation — registered as a massive blunder in the evaluation function.

The reason the sacrifice works is purely **positional**: it's about king activity in an opposite-colored bishops endgame. In such endgames, the bishops operate on different color complexes, so an extra pawn (or even two) often means nothing if the enemy king can blockade. But Shirov realized the *tempo* gained by forcing the pawn capture — clearing the path for his king — was worth more than the bishop itself.

Modern engines like **Stockfish 18** evaluate 47...Bh3!! at roughly -5.0 (decisive for Black) after just a few seconds of search. They can see the full 10-ply king march that humans calculate by intuition.

## Lessons for Club Players (1200-1800)

This game teaches several critical endgame concepts that directly apply to your own games:

### 1. King Activity Trumps Material in Endgames

Shirov sacrificed a full bishop for a single tempo. In most middlegames this would be catastrophic. But in the endgame, especially with opposite-colored bishops, the **active king is worth more than a minor piece**. When you have a material advantage but your king is passive, consider whether sacrificing material to activate the king could win.

### 2. Opposite-Colored Bishops Favor the Attacker

When bishops run on different colors, the defender's bishop can't attack the opponent's pawns. This means **passed pawns on the opposite color from the defender's bishop are extremely dangerous**. In the Shirov game, Black's d-pawn was on a dark square (same as White's bishop), but Black's king could shepherd it forward while White's bishop watched helplessly from c3.

### 3. Don't Trust Static Evaluations in King-and-Pawn Races

This game is a perfect example of why you should calculate concretely rather than trust "material count." Even a modern player relying on a quick Stockfish check might think "bishop for nothing? Bad." But the concrete calculation proves otherwise. Always check **king activity** and **tempo counts** in endgame positions.

### More Chess Improvement Resources

- **[Analyze Your Own Games Free](https://firechess.com/)** — FireChess scans your Lichess or Chess.com games with Stockfish 18 to find tactical patterns you miss
- **[Chaos Chess](https://firechess.com/chaos)** — Train your calculation under randomized conditions
- **[Guess the Elo](https://firechess.com/roast)** — Test your positional judgment against real games
- **[Chess Endgame Patterns Club Players Miss](https://firechess.com/blog/endgame-patterns-club-players-miss)** — The zugzwang and king-activity patterns that win games

## Other Famous Sacrifices

- **The Game of the Century** — [Byrne vs Fischer, 1956](https://firechess.com/games/game-of-the-century)
- **Kasparov's Immortal** — [Kasparov vs Topalov, 1999](https://firechess.com/games/kasparov-immortal-1999)
- **The Immortal Zugzwang Game** — [Sämisch vs Nimzowitsch, 1923](https://firechess.com/games/immortal-zugzwang)

---

*What makes a move immortal? It's not just the outcome — it's the idea behind it. Shirov's 47...Bh3!! was a move that defied material logic, computational evaluation, and even grandmaster intuition. It's a reminder that chess, at its highest level, remains an art form — one where a single bishop sacrifice can earn its place in history forever.*
