---
title: "How Often Do Chess Players Blunder? We Counted, by Rating"
description: "We analyzed 60,000 computer-reviewed Lichess games to measure how often players actually blunder at every rating — from beginners to masters. The drop-off is steeper than you'd think, and it says exactly how to improve."
date: "2026-06-30"
author: "FireChess Team"
tags: ["chess blunders", "chess statistics", "how to stop blundering", "chess improvement", "chess data"]
---

Everyone says "stop blundering and you'll gain 300 points." But how often do players *actually* blunder — and how much does it really change as you climb? We measured it.

We took **60,000 computer-analyzed games** from the public [Lichess database](https://database.lichess.org/) and counted every move that threw away 2+ pawns of advantage, bucketing each player's blunders at their *own* rating. Here's the curve:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="664" height="320" viewBox="0 0 664 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="blBg" x1="0" y1="0" x2="664" y2="320" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#0d1222"/></linearGradient></defs>
  <rect width="664" height="320" rx="16" fill="url(#blBg)"/>
  <rect x="1" y="1" width="662" height="318" rx="15" stroke="#334155" stroke-opacity="0.5"/>
  <text x="24" y="30" fill="#f1f5f9" font-size="15" font-weight="800" font-family="system-ui,sans-serif">Blunders per 100 moves, by player rating</text>
  <text x="24" y="48" fill="#64748b" font-size="11" font-family="system-ui,sans-serif">A "blunder" = a move that worsens your position by 2+ pawns · 60,000 analyzed Lichess games, May 2026</text>
  <line x1="48" y1="268" x2="644" y2="268" stroke="#1e293b" stroke-width="1"/><text x="40" y="272" text-anchor="end" fill="#475569" font-size="10" font-family="system-ui,sans-serif">0</text>
  <line x1="48" y1="215.19195305951382" x2="644" y2="215.19195305951382" stroke="#1e293b" stroke-width="1"/><text x="40" y="219.19195305951382" text-anchor="end" fill="#475569" font-size="10" font-family="system-ui,sans-serif">3</text>
  <line x1="48" y1="162.38390611902764" x2="644" y2="162.38390611902764" stroke="#1e293b" stroke-width="1"/><text x="40" y="166.38390611902764" text-anchor="end" fill="#475569" font-size="10" font-family="system-ui,sans-serif">6</text>
  <line x1="48" y1="109.57585917854149" x2="644" y2="109.57585917854149" stroke="#1e293b" stroke-width="1"/><text x="40" y="113.57585917854149" text-anchor="end" fill="#475569" font-size="10" font-family="system-ui,sans-serif">9</text>
  <line x1="48" y1="56.76781223805531" x2="644" y2="56.76781223805531" stroke="#1e293b" stroke-width="1"/><text x="40" y="60.76781223805531" text-anchor="end" fill="#475569" font-size="10" font-family="system-ui,sans-serif">12</text>
  <rect x="62.2" y="58.0" width="46.2" height="210.0" rx="4" fill="rgb(225,60,72)"/>
  <text x="85.3" y="51.0" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700" font-family="system-ui,sans-serif">11.93</text>
  <text x="85.3" y="286" text-anchor="middle" fill="#94a3b8" font-size="10.5" font-family="system-ui,sans-serif">&lt;1k</text>
  <rect x="136.7" y="95.3" width="46.2" height="172.7" rx="4" fill="rgb(195,78,80)"/>
  <text x="159.8" y="88.3" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700" font-family="system-ui,sans-serif">9.81</text>
  <text x="159.8" y="286" text-anchor="middle" fill="#94a3b8" font-size="10.5" font-family="system-ui,sans-serif">1.0k</text>
  <rect x="211.2" y="113.8" width="46.2" height="154.2" rx="4" fill="rgb(165,96,88)"/>
  <text x="234.3" y="106.8" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700" font-family="system-ui,sans-serif">8.76</text>
  <text x="234.3" y="286" text-anchor="middle" fill="#94a3b8" font-size="10.5" font-family="system-ui,sans-serif">1.2k</text>
  <rect x="285.7" y="129.5" width="46.2" height="138.5" rx="4" fill="rgb(135,114,96)"/>
  <text x="308.8" y="122.5" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700" font-family="system-ui,sans-serif">7.87</text>
  <text x="308.8" y="286" text-anchor="middle" fill="#94a3b8" font-size="10.5" font-family="system-ui,sans-serif">1.4k</text>
  <rect x="360.2" y="144.3" width="46.2" height="123.7" rx="4" fill="rgb(106,131,105)"/>
  <text x="383.3" y="137.3" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700" font-family="system-ui,sans-serif">7.03</text>
  <text x="383.3" y="286" text-anchor="middle" fill="#94a3b8" font-size="10.5" font-family="system-ui,sans-serif">1.6k</text>
  <rect x="434.7" y="152.5" width="46.2" height="115.5" rx="4" fill="rgb(76,149,113)"/>
  <text x="457.8" y="145.5" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700" font-family="system-ui,sans-serif">6.56</text>
  <text x="457.8" y="286" text-anchor="middle" fill="#94a3b8" font-size="10.5" font-family="system-ui,sans-serif">1.8k</text>
  <rect x="509.2" y="163.4" width="46.2" height="104.6" rx="4" fill="rgb(46,167,121)"/>
  <text x="532.3" y="156.4" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700" font-family="system-ui,sans-serif">5.94</text>
  <text x="532.3" y="286" text-anchor="middle" fill="#94a3b8" font-size="10.5" font-family="system-ui,sans-serif">2.0k</text>
  <rect x="583.7" y="177.5" width="46.2" height="90.5" rx="4" fill="rgb(16,185,129)"/>
  <text x="606.8" y="170.5" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700" font-family="system-ui,sans-serif">5.14</text>
  <text x="606.8" y="286" text-anchor="middle" fill="#94a3b8" font-size="10.5" font-family="system-ui,sans-serif">2.2k+</text>
  <text x="48" y="308" fill="#64748b" font-size="10.5" font-family="system-ui,sans-serif">Rating band (each player counted at their own rating)</text>
</svg>
</div>

## A beginner blunders more than twice as often as a master

At under-1000, players toss away a 2-pawn swing **11.93 times per 100 moves** — roughly **once every 8 moves.** By master level (2200+) that falls to **5.14** — about once every 19 moves. The curve is smooth and relentless: every rating band blunders measurably less than the one below it.

| Rating | Blunders / 100 moves | Blunders / game |
| --- | --- | --- |
| Under 1000 | 11.93 | 3.4 |
| 1000-1199 | 9.81 | 2.89 |
| 1200-1399 | 8.76 | 2.69 |
| 1400-1599 | 7.87 | 2.52 |
| 1600-1799 | 7.03 | 2.34 |
| 1800-1999 | 6.56 | 2.25 |
| 2000-2199 | 5.94 | 2.12 |
| 2200+ | 5.14 | 1.95 |

## The uncomfortable takeaway: it's *all* blunders

Notice what this means. The difference between a 1200 and a 1900 isn't opening knowledge or deep strategy — it's that the 1900 blunders **1.7× less often.** Strength at the amateur level is mostly *not hanging things.* The players who climb fastest aren't the ones who studied the most theory — they're the ones who cut out the free gifts.

## Even masters blunder once every ~20 moves

The other surprise: blundering never goes to zero. Even 2200+ players throw away two pawns about **1.95 times per game.** Perfection isn't the goal — *fewer* mistakes than your opponent is. Chess at every level is a blunder-trading contest; you just want to trade at a better rate than the person across the board.

## How to actually blunder less

The data points at a clear method:

1. **Find your repeat blunders.** Most players don't hang pieces randomly — they hang them in the *same* situations (the same pin, the same back-rank, the same overloaded defender). Patterns are fixable; randomness isn't.
2. **Do a one-second check before every move:** is anything of mine hanging? This single habit is worth more rating than any opening course below 1800.
3. **Review your own losses for the *turning-point* move** — the one blunder that flipped the eval — instead of the whole game.

That's exactly what FireChess is built for: [scan your Lichess or Chess.com games](/) and it surfaces your most-repeated blunders, the tactics you keep missing, and the exact moves where your rating leaks. Free, no signup.

---

*Methodology: 60,000 computer-analyzed standard games from the [Lichess open database](https://database.lichess.org/), May 2026. A "blunder" is any move that worsens the mover's engine evaluation by ≥ 2.00 pawns (mate scores capped at ±10). Only games with engine analysis are included, and each player's blunders are counted against their own rating. Reproducible via `scripts/chess-stats/analyze-blunders.mjs`.*
