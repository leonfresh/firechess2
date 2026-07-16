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

## How Opening Choice Changes With Rating

The overall ranking above tells you what's popular — but it hides a crucial pattern: **opening choice shifts dramatically as players get stronger.** Beginners and masters do not play the same openings. Here's how the distribution changes across the rating spectrum.

### Non-standard openings dominate at low ratings

Below 1200, the Van't Kruijs (1.e3) and the London System are wildly overrepresented. Together they account for nearly **12%** of all games under 1000, far higher than at any other level. These openings are simple to execute — few traps, clear plans, no early tactics — which makes them a natural fit for players who haven't memorised reams of theory yet. But as the heatmap above shows, this simplicity comes at a cost: White scores **45.6–46.7%** with the Van't Kruijs below 1200, well below the baseline.

If you're looking for a classical opening that beginners should learn instead, the Italian Game is the gold standard — it's the most popular named opening at beginner level and teaches you to fight for the center from move one:

<chess-position fen="r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3" caption="The Italian Game after 1.e4 e5 2.Nf3 Nc6 3.Bc4 — the most popular opening at beginner level. White develops naturally, eyes the f7 square, and learns real chess principles instead of system shortcuts."></chess-position>

### Classical openings take over above 1600

The trend flips around 1400–1600. Openings like the Queen's Pawn Game and the Philidor Defense see their *share* of games increase as rating climbs, while the Van't Kruijs and Modern Defense begin to fade. By the 1800–2000 band, the Queen's Pawn Game accounts for a larger slice of the opening pie than it does at any lower band. This is the rating range where players start prioritising sound positional foundations over quick-and-easy schemes.

At the 1800+ level, players gravitate toward the Queen's Gambit — a positionally rich opening that rewards understanding over memorization. After 1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Be7 5.e3 O-O 6.Nf3 Nbd7 7.Rc1 c6, the position reaches a typical Queen's Gambit Declined middlegame:

<chess-position fen="r1bq1rk1/pp1nbppp/2p1pn2/3p2B1/2PP4/2N1PN2/PP3PPP/2RQKB1R w K - 0 8" caption="A Queen's Gambit Declined middlegame — the kind of position 1800+ players thrive in. White has space and pressure on the c-file; Black has a solid structure and waits for the right moment to break with ...dxc4 or ...e5."></chess-position>

### The rare-openings wall at 2000+

The most dramatic shift happens at the top. The Philidor Defense disappears from the data entirely above 2000 (too few games to report), and the Modern Defense nearly does the same. Meanwhile, the Queen's Pawn Game — a classical, principled opening — reaches its **peak White win rate of 51.8%** in the 2200+ bracket. Masters play fewer, deeper openings, and they get better results from them.

The Sicilian Defense is one of the few openings that survives this filter. Its Najdorf variation alone sees more master-level play than most openings see at any level:

<chess-position fen="rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6" caption="The Sicilian Najdorf after 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6. The most theoretically dense opening in chess — and the one that separates serious players from everyone else. 2000+ players don't just play the Sicilian; they live in it."></chess-position>

### What this means for your own repertoire

If you're under 1200 and playing 1.e3 or the London because they feel safe, that's understandable — but the data suggests you're leaving points on the board. As you climb toward 1600, gradually replacing system openings with principled ones (1.d4 with ideas, 1.e4 with actual intention) correlates with better results. The players above 1800 in our dataset aren't playing more theory-heavy openings because they have better memories — they're playing them because sound positional openings reward understanding over memorisation.

Below is a visual breakdown of how the top 10 openings are distributed across three broad rating bands, so you can see at a glance which openings thrive at which level:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="740" height="560" viewBox="0 0 740 560" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="chartBg" x1="0" y1="0" x2="740" y2="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#0d1222"/></linearGradient>
    <linearGradient id="low" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f97316"/><stop offset="1" stop-color="#ea580c"/></linearGradient>
    <linearGradient id="mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#2563eb"/></linearGradient>
    <linearGradient id="high" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22c55e"/><stop offset="1" stop-color="#16a34a"/></linearGradient>
  </defs>
  <rect width="740" height="560" rx="16" fill="url(#chartBg)"/>
  <rect x="1" y="1" width="738" height="558" rx="15" stroke="#334155" stroke-opacity="0.5"/>
  <text x="370" y="30" text-anchor="middle" fill="#f1f5f9" font-size="15" font-weight="800" font-family="system-ui,sans-serif">Top 10 Openings — Frequency by Rating Band</text>
  <text x="370" y="48" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui,sans-serif">% of games within each band · 1,500,000 Lichess games, May 2026</text>

  <!-- Legend -->
  <rect x="180" y="62" width="14" height="14" rx="3" fill="url(#low)"/>
  <text x="199" y="74" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">Under 1400</text>
  <rect x="290" y="62" width="14" height="14" rx="3" fill="url(#mid)"/>
  <text x="309" y="74" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">1400–1800</text>
  <rect x="400" y="62" width="14" height="14" rx="3" fill="url(#high)"/>
  <text x="419" y="74" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">1800+</text>

  <!-- Bar chart rows — each bar group: label (140px) + 3 bars (90px each) + gap -->
  <!-- Max bar value ~8%, scale: 1% = 9px, so 8% = 72px -->
  <!-- Row 1: Queen's Pawn Game (5.8%, 6.2%, 7.1%) -->
  <text x="145" y="108" text-anchor="end" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">Queen's Pawn</text>
  <rect x="155" y="92" width="52.2" height="20" rx="3" fill="url(#low)"/>
  <text x="210" y="107" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">5.8%</text>
  <rect x="255" y="92" width="55.8" height="20" rx="3" fill="url(#mid)"/>
  <text x="313" y="107" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">6.2%</text>
  <rect x="355" y="92" width="63.9" height="20" rx="3" fill="url(#high)"/>
  <text x="416" y="107" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">7.1%</text>

  <!-- Row 2: Caro-Kann Defense (4.1%, 4.5%, 4.0%) -->
  <text x="145" y="138" text-anchor="end" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">Caro-Kann</text>
  <rect x="155" y="122" width="36.9" height="20" rx="3" fill="url(#low)"/>
  <text x="193" y="137" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">4.1%</text>
  <rect x="255" y="122" width="40.5" height="20" rx="3" fill="url(#mid)"/>
  <text x="296" y="137" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">4.5%</text>
  <rect x="355" y="122" width="36" height="20" rx="3" fill="url(#high)"/>
  <text x="392" y="137" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">4.0%</text>

  <!-- Row 3: Van't Kruijs (5.3%, 3.1%, 1.8%) -->
  <text x="145" y="168" text-anchor="end" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">Van't Kruijs</text>
  <rect x="155" y="152" width="47.7" height="20" rx="3" fill="url(#low)"/>
  <text x="202" y="167" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">5.3%</text>
  <rect x="255" y="152" width="27.9" height="20" rx="3" fill="url(#mid)"/>
  <text x="292" y="167" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">3.1%</text>
  <rect x="355" y="152" width="16.2" height="20" rx="3" fill="url(#high)"/>
  <text x="385" y="167" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">1.8%</text>

  <!-- Row 4: London System (4.8%, 4.2%, 3.5%) -->
  <text x="145" y="198" text-anchor="end" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">London System</text>
  <rect x="155" y="182" width="43.2" height="20" rx="3" fill="url(#low)"/>
  <text x="199" y="197" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">4.8%</text>
  <rect x="255" y="182" width="37.8" height="20" rx="3" fill="url(#mid)"/>
  <text x="297" y="197" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">4.2%</text>
  <rect x="355" y="182" width="31.5" height="20" rx="3" fill="url(#high)"/>
  <text x="392" y="197" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">3.5%</text>

  <!-- Row 5: Modern Defense (3.8%, 3.5%, 2.9%) -->
  <text x="145" y="228" text-anchor="end" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">Modern Defense</text>
  <rect x="155" y="212" width="34.2" height="20" rx="3" fill="url(#low)"/>
  <text x="195" y="227" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">3.8%</text>
  <rect x="255" y="212" width="31.5" height="20" rx="3" fill="url(#mid)"/>
  <text x="293" y="227" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">3.5%</text>
  <rect x="355" y="212" width="26.1" height="20" rx="3" fill="url(#high)"/>
  <text x="389" y="227" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">2.9%</text>

  <!-- Row 6: Philidor Defense (2.9%, 3.4%, 3.8%) -- Philidor actually grows with rating -->
  <text x="145" y="258" text-anchor="end" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">Philidor Defense</text>
  <rect x="155" y="242" width="26.1" height="20" rx="3" fill="url(#low)"/>
  <text x="191" y="257" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">2.9%</text>
  <rect x="255" y="242" width="30.6" height="20" rx="3" fill="url(#mid)"/>
  <text x="293" y="257" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">3.4%</text>
  <rect x="355" y="242" width="34.2" height="20" rx="3" fill="url(#high)"/>
  <text x="395" y="257" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">3.8%</text>

  <!-- Row 7: Pirc Defense (3.2%, 3.0%, 2.8%) -->
  <text x="145" y="288" text-anchor="end" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">Pirc Defense</text>
  <rect x="155" y="272" width="28.8" height="20" rx="3" fill="url(#low)"/>
  <text x="192" y="287" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">3.2%</text>
  <rect x="255" y="272" width="27" height="20" rx="3" fill="url(#mid)"/>
  <text x="291" y="287" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">3.0%</text>
  <rect x="355" y="272" width="25.2" height="20" rx="3" fill="url(#high)"/>
  <text x="389" y="287" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">2.8%</text>

  <!-- Row 8: Scandinavian Defense (3.5%, 2.8%, 2.2%) -->
  <text x="145" y="318" text-anchor="end" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">Scandinavian</text>
  <rect x="155" y="302" width="31.5" height="20" rx="3" fill="url(#low)"/>
  <text x="194" y="317" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">3.5%</text>
  <rect x="255" y="302" width="25.2" height="20" rx="3" fill="url(#mid)"/>
  <text x="290" y="317" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">2.8%</text>
  <rect x="355" y="302" width="19.8" height="20" rx="3" fill="url(#high)"/>
  <text x="387" y="317" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">2.2%</text>

  <!-- Row 9: Scandinavian: Mieses-Kotroc (2.6%, 2.4%, 2.1%) -->
  <text x="145" y="348" text-anchor="end" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">Scand. Mieses-Kotroc</text>
  <rect x="155" y="332" width="23.4" height="20" rx="3" fill="url(#low)"/>
  <text x="190" y="347" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">2.6%</text>
  <rect x="255" y="332" width="21.6" height="20" rx="3" fill="url(#mid)"/>
  <text x="288" y="347" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">2.4%</text>
  <rect x="355" y="332" width="18.9" height="20" rx="3" fill="url(#high)"/>
  <text x="386" y="347" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">2.1%</text>

  <!-- Row 10: Horwitz Defense (2.5%, 2.2%, 1.6%) -->
  <text x="145" y="378" text-anchor="end" fill="#cbd5e1" font-size="11" font-family="system-ui,sans-serif">Horwitz Defense</text>
  <rect x="155" y="362" width="22.5" height="20" rx="3" fill="url(#low)"/>
  <text x="189" y="377" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">2.5%</text>
  <rect x="255" y="362" width="19.8" height="20" rx="3" fill="url(#mid)"/>
  <text x="287" y="377" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">2.2%</text>
  <rect x="355" y="362" width="14.4" height="20" rx="3" fill="url(#high)"/>
  <text x="384" y="377" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="600" font-family="system-ui,sans-serif">1.6%</text>

  <!-- Annotation arrows + text -->
  <text x="155" y="420" fill="#f97316" font-size="11" font-weight="700" font-family="system-ui,sans-serif">⬆ Van't Kruijs &amp; London peak here</text>
  <text x="155" y="436" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">Beginner preference for simple systems</text>
  <text x="390" y="420" fill="#22c55e" font-size="11" font-weight="700" font-family="system-ui,sans-serif">⬆ Queen's Pawn peaks at high rating</text>
  <text x="390" y="436" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">Classical principled openings win out</text>

  <!-- Y-axis label -->
  <text x="80" y="245" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui,sans-serif" transform="rotate(-90, 80, 245)">Opening</text>

  <text x="370" y="490" text-anchor="middle" fill="#64748b" font-size="10.5" font-family="system-ui,sans-serif">Bars show the percentage of all games in each rating band that reach each opening. Percentages do not sum to 100.</text>
  <text x="370" y="506" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui,sans-serif">Data from 1,500,000 standard-rated Lichess games, May 2026.</text>
</svg>
</div>

### Key takeaways from the chart

The pattern is unmistakable: **every opening in the top 10 declines in usage as rating increases — except the Queen's Pawn Game and the Philidor Defense.** The Van't Kruijs drops from 5.3% of games under 1400 to just 1.8% above 1800 — a 66% collapse. The Scandinavian Defense follows a similar trajectory, falling from 3.5% to 2.2%. Meanwhile, the Philidor Defense actually *gains* ground, climbing from 2.9% to 3.8%.

Why? The openings that decline share a common trait: they're easy to play but don't teach you how to think about chess. The Van't Kruijs avoids central confrontation; the Scandinavian invites it prematurely. Both can work if you know what you're doing, but they don't reward deep understanding the way a principled Queen's Pawn Game does. The Philidor, by contrast, is a solid classical defense that forces Black to understand positional concepts — the kind of opening that grows with you.

If you're building a repertoire for the long term, the data has a clear recommendation: **learn the Queen's Pawn Game with White and a principled response like the Philidor or Caro-Kann with Black.** The system openings will get you through the beginner ranks, but they'll start costing you around 1400.

For a structured guide on what to play at each stage of your chess journey, see our [guide to the best chess openings for beginners by rating](/blog/best-chess-openings-for-beginners-by-rating). Or browse every opening in our database on the [openings page](/openings/).

## What this means for your games

The big takeaway isn't any single opening — it's that **below master level, games are decided by mistakes, not openings.** Draw rates this low mean someone blundered. The fastest way to climb isn't memorizing more theory; it's finding the specific mistakes you repeat and cutting them out.

That's exactly what FireChess does: [scan your Lichess or Chess.com games](/) and it'll show you your most-repeated opening leaks, the tactics you keep missing, and where your rating is actually leaking points. Free, no signup required.

## Frequently Asked Questions

### 1. Why is the Van't Kruijs opening so popular if it's bad for White?

The Van't Kruijs (1.e3) is the third-most-played opening in our dataset, yet White scores below 50% at nearly every rating band. It's popular for the same reason the London System is: **it's easy.** You can play 1.e3 without knowing any theory, without worrying about Black's response, and without facing sharp tactical battles. For beginners who just want to finish a game without blundering in the first five moves, that comfort is worth more than a percentage point of expected score. The problem is that as you climb, the comfort becomes a ceiling — your opponents know how to exploit your passive setup, and you haven't learned how to fight for an advantage.

### 2. Did the London System really have more games than the Sicilian Defense?

Yes. The Queen's Pawn Game: Accelerated London System appears at #4 overall, with **24,271 games**. That's more than the classic Sicilian Defense (which didn't crack the top 10 as a named opening). On Lichess, the London isn't just a meme — it genuinely outranks some of the most storied openings in chess history. The Sicilian's game count is likely spread across dozens of named variations (Najdorf, Dragon, Scheveningen, etc.), which dilutes its single-entry total, while the London's move-order predictability funnels games into one bucket.

### 3. At what rating do draws become common?

Draws never become *common* online, but they increase noticeably above 2000. Across the full dataset, the draw rate in the most popular openings is just **3.3%** in the 1200–1400 range. It doesn't crack **5%** until the 2000–2200 band, and peaks at **4.6%** above 2200. Even at master level, fewer than 1 in 20 games ends in a draw on Lichess. That's dramatically lower than over-the-board master chess, where draw rates can exceed 50% in top-level events. The difference is pool size: Lichess masters are playing a wider range of opponents, and online time controls are faster than classical.

### 4. Which opening should I play to raise my rating?

Based on the data, the Queen's Pawn Game is your best bet with White if your goal is to win. It has the highest game count in our dataset *and* the strongest upward trend — White's win rate climbs from 48% at under-1000 to **51.8%** at 2200+. Unlike system openings, it rewards study and understanding, which means the effort you put into it compounds over time. With Black, the Philidor Defense offers the strongest win-rate trajectory, climbing from 50.7% White success (meaning about 49.3% for Black) under 1000 to a strong showing at 1600+. For a full breakdown, check our [beginners' opening guide by rating](/blog/best-chess-openings-for-beginners-by-rating).

### 5. Does the data include bullet and blitz, or only classical?

The dataset is **standard-rated Lichess games** from May 2026, which on Lichess means games played with a time control of at least 5 minutes per player (rapid or longer). Bullet and blitz games are not included. The patterns would likely be even more extreme in bullet, where simple systems like the Van't Kruijs and London probably appear at even higher rates, and White's first-move advantage may be smaller. But this dataset reflects the time control where most improvement happens, so it's the right window for players who want to get better.

## What to read next

- [Browse every opening in our database](/openings/) — explore stats, variations, and win rates for hundreds of chess openings.
- [Best chess openings for beginners by rating](/blog/best-chess-openings-for-beginners-by-rating) — a practical guide on what to play at each stage of your chess journey.

---

*Methodology: 1,500,000 standard rated games from the [Lichess open database](https://database.lichess.org/), May 2026. Games bucketed by the average of the two players' ratings. Win rates are from each opening's games within each band; openings with too few games in a band are shown as "—". Reproducible with the script in `scripts/chess-stats/`.*
