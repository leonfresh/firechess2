---
title: "We Analyzed 1.5 Million Games: The Most-Played Openings at Every Rating"
description: "A data dive into 1.5 million rated Lichess games from 2026. Which openings are most popular at each rating level, where White's advantage actually kicks in, and the opening that quietly loses for White at every level."
date: "2026-06-30"
author: "FireChess Team"
tags: ["chess statistics", "chess openings", "most popular chess openings", "chess win rates", "chess data"]
---

We pulled **1,500,000 rated games** from the public [Lichess database](https://database.lichess.org/) (May 2026) and broke them down by the average rating of the two players. No engine opinions, no theory — just what actually happens on the board across 8 rating bands, from beginners under 1000 to masters above 2200.

Here's what 1.5 million games say.

## White's advantage is *earned*, not given

The classic claim is "White is better because it moves first." The data says it's more subtle than that — White's edge **grows as players get stronger.** In the most common opening, the Queen's Pawn Game, White scores **48%** in the under-1000 pool but **51.8%** once you reach 2200+:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="664" height="362" viewBox="0 0 664 362" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="hmBg" x1="0" y1="0" x2="664" y2="362" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#0d1222"/></linearGradient></defs>
  <rect width="664" height="362" rx="16" fill="url(#hmBg)"/>
  <rect x="1" y="1" width="662" height="360" rx="15" stroke="#334155" stroke-opacity="0.5"/>
  <text x="20" y="30" fill="#f1f5f9" font-size="15" font-weight="800" font-family="system-ui,sans-serif">White win % by opening &amp; rating</text>
  <text x="20" y="48" fill="#64748b" font-size="11" font-family="system-ui,sans-serif">green = White scores well · red = Black scores well · 1,500,000 Lichess games, May 2026</text>
  <text x="205" y="56" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600" font-family="system-ui,sans-serif">&lt;1k</text>
  <text x="263" y="56" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600" font-family="system-ui,sans-serif">1.0k</text>
  <text x="321" y="56" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600" font-family="system-ui,sans-serif">1.2k</text>
  <text x="379" y="56" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600" font-family="system-ui,sans-serif">1.4k</text>
  <text x="437" y="56" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600" font-family="system-ui,sans-serif">1.6k</text>
  <text x="495" y="56" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600" font-family="system-ui,sans-serif">1.8k</text>
  <text x="553" y="56" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600" font-family="system-ui,sans-serif">2.0k</text>
  <text x="611" y="56" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600" font-family="system-ui,sans-serif">2.2k+</text>
  <text x="20" y="88" fill="#cbd5e1" font-size="12" font-family="system-ui,sans-serif">Queen's Pawn</text>
  <rect x="177.5" y="65.5" width="55" height="37" rx="4" fill="#5b3751"/>
  <text x="205" y="88" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48</text>
  <rect x="235.5" y="65.5" width="55" height="37" rx="4" fill="#3b3f54"/>
  <text x="263" y="88" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">49.6</text>
  <rect x="293.5" y="65.5" width="55" height="37" rx="4" fill="#433d54"/>
  <text x="321" y="88" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">49.2</text>
  <rect x="351.5" y="65.5" width="55" height="37" rx="4" fill="#1c6c5f"/>
  <text x="379" y="88" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">51</text>
  <rect x="409.5" y="65.5" width="55" height="37" rx="4" fill="#137c63"/>
  <text x="437" y="88" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">51.4</text>
  <rect x="467.5" y="65.5" width="55" height="37" rx="4" fill="#255b5b"/>
  <text x="495" y="88" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">50.6</text>
  <rect x="525.5" y="65.5" width="55" height="37" rx="4" fill="#1c6c5f"/>
  <text x="553" y="88" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">51</text>
  <rect x="583.5" y="65.5" width="55" height="37" rx="4" fill="#0a8d67"/>
  <text x="611" y="88" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">51.8</text>
  <text x="20" y="128" fill="#cbd5e1" font-size="12" font-family="system-ui,sans-serif">Caro-Kann</text>
  <rect x="177.5" y="105.5" width="55" height="37" rx="4" fill="#bc1e48"/>
  <text x="205" y="128" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">43.1</text>
  <rect x="235.5" y="105.5" width="55" height="37" rx="4" fill="#693350"/>
  <text x="263" y="128" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">47.3</text>
  <rect x="293.5" y="105.5" width="55" height="37" rx="4" fill="#5b3751"/>
  <text x="321" y="128" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48</text>
  <rect x="351.5" y="105.5" width="55" height="37" rx="4" fill="#513952"/>
  <text x="379" y="128" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48.5</text>
  <rect x="409.5" y="105.5" width="55" height="37" rx="4" fill="#573852"/>
  <text x="437" y="128" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48.2</text>
  <rect x="467.5" y="105.5" width="55" height="37" rx="4" fill="#6b3350"/>
  <text x="495" y="128" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">47.2</text>
  <rect x="525.5" y="105.5" width="55" height="37" rx="4" fill="#5d3651"/>
  <text x="553" y="128" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">47.9</text>
  <rect x="583.5" y="105.5" width="55" height="37" rx="4" fill="#6f324f"/>
  <text x="611" y="128" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">47</text>
  <text x="20" y="168" fill="#cbd5e1" font-size="12" font-family="system-ui,sans-serif">Van't Kruijs</text>
  <rect x="177.5" y="145.5" width="55" height="37" rx="4" fill="#8a2a4d"/>
  <text x="205" y="168" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">45.6</text>
  <rect x="235.5" y="145.5" width="55" height="37" rx="4" fill="#75304f"/>
  <text x="263" y="168" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">46.7</text>
  <rect x="293.5" y="145.5" width="55" height="37" rx="4" fill="#5b3751"/>
  <text x="321" y="168" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48</text>
  <rect x="351.5" y="145.5" width="55" height="37" rx="4" fill="#5f3651"/>
  <text x="379" y="168" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">47.8</text>
  <rect x="409.5" y="145.5" width="55" height="37" rx="4" fill="#573852"/>
  <text x="437" y="168" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48.2</text>
  <rect x="467.5" y="145.5" width="55" height="37" rx="4" fill="#4f3a52"/>
  <text x="495" y="168" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48.6</text>
  <rect x="525.5" y="145.5" width="55" height="37" rx="4" fill="#433d54"/>
  <text x="553" y="168" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">49.2</text>
  <rect x="583.5" y="145.5" width="55" height="37" rx="4" fill="#842c4d"/>
  <text x="611" y="168" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">45.9</text>
  <text x="20" y="208" fill="#cbd5e1" font-size="12" font-family="system-ui,sans-serif">Philidor</text>
  <rect x="177.5" y="185.5" width="55" height="37" rx="4" fill="#235f5c"/>
  <text x="205" y="208" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">50.7</text>
  <rect x="235.5" y="185.5" width="55" height="37" rx="4" fill="#354055"/>
  <text x="263" y="208" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">49.9</text>
  <rect x="293.5" y="185.5" width="55" height="37" rx="4" fill="#393f54"/>
  <text x="321" y="208" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">49.7</text>
  <rect x="351.5" y="185.5" width="55" height="37" rx="4" fill="#334155"/>
  <text x="379" y="208" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">50</text>
  <rect x="409.5" y="185.5" width="55" height="37" rx="4" fill="#0e8565"/>
  <text x="437" y="208" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">51.6</text>
  <rect x="467.5" y="185.5" width="55" height="37" rx="4" fill="#1e293b"/>
  <text x="495" y="208" text-anchor="middle" fill="#475569" font-size="11" font-weight="600" font-family="system-ui,sans-serif">—</text>
  <rect x="525.5" y="185.5" width="55" height="37" rx="4" fill="#1e293b"/>
  <text x="553" y="208" text-anchor="middle" fill="#475569" font-size="11" font-weight="600" font-family="system-ui,sans-serif">—</text>
  <rect x="583.5" y="185.5" width="55" height="37" rx="4" fill="#1e293b"/>
  <text x="611" y="208" text-anchor="middle" fill="#475569" font-size="11" font-weight="600" font-family="system-ui,sans-serif">—</text>
  <text x="20" y="248" fill="#cbd5e1" font-size="12" font-family="system-ui,sans-serif">Modern</text>
  <rect x="177.5" y="225.5" width="55" height="37" rx="4" fill="#1e293b"/>
  <text x="205" y="248" text-anchor="middle" fill="#475569" font-size="11" font-weight="600" font-family="system-ui,sans-serif">—</text>
  <rect x="235.5" y="225.5" width="55" height="37" rx="4" fill="#9c264b"/>
  <text x="263" y="248" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">44.7</text>
  <rect x="293.5" y="225.5" width="55" height="37" rx="4" fill="#473c53"/>
  <text x="321" y="248" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">49</text>
  <rect x="351.5" y="225.5" width="55" height="37" rx="4" fill="#3f3e54"/>
  <text x="379" y="248" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">49.4</text>
  <rect x="409.5" y="225.5" width="55" height="37" rx="4" fill="#5b3751"/>
  <text x="437" y="248" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48</text>
  <rect x="467.5" y="225.5" width="55" height="37" rx="4" fill="#4b3b53"/>
  <text x="495" y="248" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48.8</text>
  <rect x="525.5" y="225.5" width="55" height="37" rx="4" fill="#3f3e54"/>
  <text x="553" y="248" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">49.4</text>
  <rect x="583.5" y="225.5" width="55" height="37" rx="4" fill="#613551"/>
  <text x="611" y="248" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">47.7</text>
  <text x="20" y="288" fill="#cbd5e1" font-size="12" font-family="system-ui,sans-serif">Scandinavian</text>
  <rect x="177.5" y="265.5" width="55" height="37" rx="4" fill="#7e2d4e"/>
  <text x="205" y="288" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">46.2</text>
  <rect x="235.5" y="265.5" width="55" height="37" rx="4" fill="#374055"/>
  <text x="263" y="288" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">49.8</text>
  <rect x="293.5" y="265.5" width="55" height="37" rx="4" fill="#613551"/>
  <text x="321" y="288" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">47.7</text>
  <rect x="351.5" y="265.5" width="55" height="37" rx="4" fill="#75304f"/>
  <text x="379" y="288" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">46.7</text>
  <rect x="409.5" y="265.5" width="55" height="37" rx="4" fill="#493b53"/>
  <text x="437" y="288" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48.9</text>
  <rect x="467.5" y="265.5" width="55" height="37" rx="4" fill="#4d3a53"/>
  <text x="495" y="288" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48.7</text>
  <rect x="525.5" y="265.5" width="55" height="37" rx="4" fill="#593751"/>
  <text x="553" y="288" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="600" font-family="system-ui,sans-serif">48.1</text>
  <rect x="583.5" y="265.5" width="55" height="37" rx="4" fill="#1e293b"/>
  <text x="611" y="288" text-anchor="middle" fill="#475569" font-size="11" font-weight="600" font-family="system-ui,sans-serif">—</text>
  <text x="20" y="342" fill="#64748b" font-size="10.5" font-family="system-ui,sans-serif">Columns = average rating of the two players. "—" = too few games in that bucket to be meaningful.</text>
</svg>
</div>

Read the green band across the top: in the Queen's Pawn Game, the cells get greener left-to-right — White converts the first-move advantage more reliably the higher the rating. Beginners hand it back; masters bank it.

## The Caro-Kann punishes White hardest at the bottom

Look at the Caro-Kann Defense row. At under-1000, White scores just **43.1%** — the Caro is a *brutal* matchup for beginner White players, who don't know the plans and drift into a passive, slowly-losing middlegame. By the 1400–1800 range White claws back toward even (**48.5–48.2%**). If you're a low-rated player who hates facing the Caro-Kann, the numbers agree with you.

## The opening that quietly loses for White — at every level

Notice the **Van't Kruijs** row (that's 1.e3) glowing red almost all the way across. It's the **#3 most-played opening on Lichess** — yet White underperforms with it at nearly every rating, scoring below 50% from beginner to master. It's popular because it's *easy*, not because it's *good*. If 1.e3 is your move, this is your sign to try 1.e4 or 1.d4 instead — and [scan your own games](/) to see how much it's costing you.

## Draws are nearly extinct online — until you reach master level

Online chess is decisive. Across the most popular openings, the weighted draw rate bottoms out at just **3.3%** in the 1200–1400 range, then climbs back to **4.6%** at 2200+, where players finally have the technique to hold inferior positions. If you're stuck drawing a lot below 2000, you're an outlier — most games at your level end decisively, which means most are decided by a *blunder*, not a slow grind.

## The 10 most-played openings overall

1. **Queen's Pawn Game** — 39,575 games
2. **Caro-Kann Defense** — 28,296 games
3. **Van't Kruijs Opening** — 26,030 games
4. **Queen's Pawn Game: Accelerated London System** — 24,271 games
5. **Modern Defense** — 23,679 games
6. **Philidor Defense** — 23,177 games
7. **Pirc Defense** — 22,944 games
8. **Scandinavian Defense** — 21,023 games
9. **Scandinavian Defense: Mieses-Kotroc Variation** — 20,092 games
10. **Horwitz Defense** — 19,926 games

The London System (the "Accelerated London" line of the Queen's Pawn Game) lands in the top 5 — the meme is real. And the Caro-Kann is the single most popular *defense* against 1.e4, ahead of even the Sicilian by name.

## What this means for your games

The big takeaway isn't any single opening — it's that **below master level, games are decided by mistakes, not openings.** Draw rates this low mean someone blundered. The fastest way to climb isn't memorizing more theory; it's finding the specific mistakes you repeat and cutting them out.

That's exactly what FireChess does: [scan your Lichess or Chess.com games](/) and it'll show you your most-repeated opening leaks, the tactics you keep missing, and where your rating is actually leaking points. Free, no signup required.

---

*Methodology: 1,500,000 standard rated games from the [Lichess open database](https://database.lichess.org/), May 2026. Games bucketed by the average of the two players' ratings. Win rates are from each opening's games within each band; openings with too few games in a band are shown as "—". Reproducible with the script in `scripts/chess-stats/`.*
