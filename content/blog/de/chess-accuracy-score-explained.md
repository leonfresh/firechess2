---
title: "Schach-Genauigkeits-Score erklärt: Was 90%+ wirklich bedeutet"
description: "Was bedeutet dein Schach-Genauigkeits-Score eigentlich? Wie er berechnet wird, was 90%+ wirklich aussagt und warum sich Genauigkeit von Centipawn-Verlust unterscheidet."
date: "2026-07-25"
author: "FireChess Team"
tags: ["analyse", "grundlagen", "centipawn-verlust"]
canonical: https://firechess.com/de/blog/chess-accuracy-score-explained
---

Du beendest ein Spiel und der Genauigkeitsbericht sagt 94,2%. Ist das gut? Großartig? Und warum zeigt dein Gegner 91,7%, obwohl er verloren hat?

Genauigkeits-Scores sind eine der am meisten missverstandenen Metriken im Schach. Lass uns genau aufschlüsseln, was sie bedeuten — und was nicht.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="300" viewBox="0 0 680 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acBg" x1="0" y1="0" x2="680" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
    <radialGradient id="acG1" cx="200" cy="100" r="200" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6366f1" stop-opacity="0.07"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="acG2" cx="500" cy="200" r="180" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#10b981" stop-opacity="0.07"/><stop offset="1" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <filter id="acGlow">
      <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="680" height="300" rx="18" fill="url(#acBg)"/>
  <rect x="1" y="1" width="678" height="298" rx="17" stroke="white" stroke-opacity="0.05"/>
  <rect width="680" height="300" rx="18" fill="url(#acG1)"/>
  <rect width="680" height="300" rx="18" fill="url(#acG2)"/>
  <!-- Title -->
  <text x="340" y="38" text-anchor="middle" fill="white" font-size="18" font-weight="700" letter-spacing="0.3" font-family="system-ui">Genauigkeits-Score Aufschlüsselung</text>
  <!-- Accuracy gauge arc (left panel) -->
  <g transform="translate(170, 160)">
    <!-- Background arc -->
    <path d="M -90 0 A 90 90 0 0 1 90 0" stroke="#1e293b" stroke-width="16" fill="none" stroke-linecap="round"/>
    <!-- Colored arc: 94.2% -->
    <path d="M -90 0 A 90 90 0 0 1 75 -49" stroke="url(#acArcGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
    <defs>
      <linearGradient id="acArcGrad" x1="-90" y1="0" x2="90" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ef4444"/><stop offset="0.5" stop-color="#f59e0b"/><stop offset="1" stop-color="#10b981"/>
      </linearGradient>
    </defs>
    <!-- Needle -->
    <line x1="0" y1="0" x2="72" y2="-47" stroke="#6366f1" stroke-width="3" stroke-linecap="round" filter="url(#acGlow)"/>
    <circle r="7" fill="#6366f1" filter="url(#acGlow)"/>
    <!-- Score text -->
    <text y="30" text-anchor="middle" fill="white" font-size="32" font-weight="800" font-family="system-ui" filter="url(#acGlow)">94.2%</text>
    <text y="50" text-anchor="middle" fill="#a5b4fc" font-size="13" font-family="system-ui">Genauigkeit</text>
    <!-- Scale labels -->
    <text x="-96" y="16" fill="#ef4444" font-size="11" text-anchor="middle" font-family="system-ui">0</text>
    <text x="0" y="-98" fill="#f59e0b" font-size="11" text-anchor="middle" font-family="system-ui">50</text>
    <text x="96" y="16" fill="#10b981" font-size="11" text-anchor="middle" font-family="system-ui">100</text>
  </g>
  <!-- Rating brackets (right panel) -->
  <g transform="translate(420, 60)">
    <text fill="#94a3b8" font-size="12" font-weight="600" font-family="system-ui" letter-spacing="0.3">TYPISCHE GENAUIGKEIT NACH BEWERTUNG</text>
    <!-- Rows -->
    <g transform="translate(0, 24)">
      <rect width="200" height="28" rx="6" fill="#1e293b" fill-opacity="0.6"/>
      <text x="10" y="18" fill="#94a3b8" font-size="12" font-family="system-ui">1000–1200</text>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#334155"/>
      <rect x="110" y="8" width="30" height="10" rx="4" fill="#ef4444" fill-opacity="0.7"/>
      <text x="168" y="18" fill="#ef4444" font-size="12" font-family="system-ui">~72%</text>
    </g>
    <g transform="translate(0, 60)">
      <rect width="200" height="28" rx="6" fill="#1e293b" fill-opacity="0.6"/>
      <text x="10" y="18" fill="#94a3b8" font-size="12" font-family="system-ui">1200–1600</text>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#334155"/>
      <rect x="110" y="8" width="37" height="10" rx="4" fill="#f59e0b" fill-opacity="0.7"/>
      <text x="168" y="18" fill="#f59e0b" font-size="12" font-family="system-ui">~80%</text>
    </g>
    <g transform="translate(0, 96)">
      <rect width="200" height="28" rx="6" fill="#1e293b" fill-opacity="0.6"/>
      <text x="10" y="18" fill="#94a3b8" font-size="12" font-family="system-ui">1600–2000</text>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#334155"/>
      <rect x="110" y="8" width="42" height="10" rx="4" fill="#22d3ee" fill-opacity="0.7"/>
      <text x="168" y="18" fill="#22d3ee" font-size="12" font-family="system-ui">~87%</text>
    </g>
    <g transform="translate(0, 132)">
      <rect width="200" height="28" rx="6" fill="#1e293b" fill-opacity="0.6"/>
      <text x="10" y="18" fill="#94a3b8" font-size="12" font-family="system-ui">2000–2400</text>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#334155"/>
      <rect x="110" y="8" width="47" height="10" rx="4" fill="#10b981" fill-opacity="0.7"/>
      <text x="168" y="18" fill="#10b981" font-size="12" font-family="system-ui">~93%</text>
    </g>
    <g transform="translate(0, 168)">
      <rect width="200" height="28" rx="6" fill="#1e293b" fill-opacity="0.6"/>
      <text x="10" y="18" fill="#94a3b8" font-size="12" font-family="system-ui">2400+ (GM)</text>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#334155"/>
      <rect x="110" y="8" width="50" height="10" rx="4" fill="#6366f1" fill-opacity="0.9" filter="url(#acGlow)"/>
      <text x="168" y="18" fill="#a5b4fc" font-size="12" font-family="system-ui">~97%</text>
    </g>
  </g>
</svg>
</div>

## Wie Genauigkeit berechnet wird

Schach-Genauigkeits-Scores — ob von Lichess, Chess.com oder FireChess — basieren alle auf demselben Konzept: **[Centipawn-Verlust](/blog/what-is-centipawn-loss)**.

Hier ist die Formel in einfacher Sprache:

1. Für jeden Zug, den du spielst, bewertet eine Engine die Stellung vor und danach.
2. Sie vergleicht deinen Zug mit dem besten möglichen Zug, den die Engine gefunden hat.
3. Der Unterschied in der Bewertung (gemessen in Centipawns) ist dein „Verlust" für diesen Zug.
4. Deine Genauigkeit ist eine Funktion davon, wie klein dein durchschnittlicher Verlust über alle Züge war.

Die genaue Formel variiert je nach Plattform. Chess.com verwendet eine Umwandlungsfunktion, die den durchschnittlichen Centipawn-Verlust auf einen Prozentsatz von 0–100 abbildet. Lichess verwendet einen ähnlichen Ansatz. FireChess verwendet den rohen Centipawn-Verlust pro Zug, gruppiert in Klassifizierungen (Genial, Best, Ausgezeichnet, Gut, Ungenauigkeit, Fehler, Patzer).

Um Genauigkeit zu verstehen, musst du zuerst die rohe Zahl verstehen, aus der sie stammt. Wenn du mit dem Konzept noch nicht vertraut bist, lies unsere vollständige Anleitung: [Was ist Centipawn-Verlust?](/blog/what-is-centipawn-loss) — sie behandelt, wie Stockfish Bewertungen berechnet und was diese Zahlen in der Praxis tatsächlich bedeuten.

## Warum du mit 94% Genauigkeit verlieren kannst

Das ist die größte Quelle der Verwirrung. Genauigkeit misst **wie eng du der Empfehlung der Engine gefolgt bist** — nicht ob du gewonnen hast.

Stell dir dieses Szenario vor: Dein Gegner spielte einen leicht ungenauen Eröffnungszug früh im Spiel. Du hast ihn nicht optimal bestraft, aber du hast auch nichts Offensichtliches gepatzt. Ihr habt beide mit 90%+ Genauigkeit gespielt. Aber weil die Ungenauigkeit deines Gegners eine strategisch benachteiligte Stellung für ihn erzeugte, verlor er das Endspiel trotz seines hohen Genauigkeits-Scores.

Genauigkeit sagt dir, wie gut du gespielt hast *in Anbetracht der entstandenen Stellungen*. Sie sagt dir nicht:
- Ob die Stellungen objektiv ausgeglichen oder unausgeglichen waren
- Ob dein Gegner Druck erzeugte, der dich in passives Spiel zwang
- Ob ein Eröffnungs-Patzer ab Zug 4 dich früh in eine verlierende Stellung brachte

**Ein 95% genauer Verlust bedeutet oft, dass du gut gespielt hast, aber von einer schlechteren Stellung aus startetest.** Ein 75% genauer Gewinn bedeutet oft, dass dein Gegner mehr gepatzt hat als du.

Deshalb erzählen **durchschnittlicher Centipawn-Verlust** und Genauigkeits-% auch verschiedene Geschichten. Zwei Spieler könnten beide 92% Genauigkeit erzielen, aber einer hatte einen gleichmäßigen 20-cp-Durchschnitt über alle Züge, während der andere viele 0-cp-Züge hatte, durchbrochen von einem einzigen 80-cp-Fehler. Der Genauigkeits-% sieht gleich aus, aber das Centipawn-Verlust-Profil ist完全不同. Für mehr zu dieser Unterscheidung siehe [wie Centipawn-Verlust berechnet wird](/blog/what-is-centipawn-loss#wie-acpl-berechnet-wird).

## Was „genaues" Spiel tatsächlich aussieht

Die meisten Spieler fixieren sich auf die Spitze der Skala. Wie sieht also 99%+ Genauigkeit aus?

Es ist im Wesentlichen unmöglich, das über ein ganzes Spiel aufrechtzuerhalten. Selbst Weltklasse-Engines, die auf dem gleichen Niveau spielen, registrieren ein paar Prozent Genauigkeitsverlust über 50+ Züge. Ein 99% genaues Spiel bedeutet meistens:
- Das Spiel war extrem kurz
- Die meisten „Züge" waren erzwungene Schläge oder Rückschläge ohne echte Entscheidung
- Ein Spieler gewann so leicht, dass jede „Alternative" katastrophal war, was jeden Zug als optimal zählte

Für echte Verbesserung verfolge die **durchschnittliche Genauigkeit über 20+ Spiele**, nicht einen einzelnen Spiel-Spike. Siehe unsere [Genauigkeits-Benchmarks-nach-Bewertungsstufe-Anleitung](/blog/chess-accuracy-by-rating-guide) zu verstehen, was deine durchschnittliche Genauigkeit auf deinem Niveau bedeutet.

## Genauigkeit vs. Centipawn-Verlust — der tiefere Unterschied

Eine häufige Frage ist: „Wenn Genauigkeit von Centipawn-Verlust kommt, warum beides anschauen?" Die kurze Antwort ist, dass **Genauigkeit eine verarbeitete Metrik** ist, während **Centipawn-Verlust Rohdaten** sind — und jedem dient ein anderer Zweck.

### Was Centipawn-Verlust misst

[Centipawn-Verlust](/blog/what-is-centipawn-loss) ist die absolute Bewertungsdifferenz (in Hundertsteln eines Bauern) zwischen deinem gewählten Zug und dem besten Zug der Engine. Wenn Stockfish sagt, der beste Zug gibt +1,00 und dein Zug gibt +0,40, beträgt dein Centipawn-Verlust für diesen Zug 60. Unkompliziert.

Durchschnittlicher Centipawn-Verlust (ACPL) ist der Mittelwert dieser Zug-zu-Zug-Unterschiede über das gesamte Spiel. Es ist eine direkte, unverarbeitete Zahl. Es gibt keine Skalierung, keine Begrenzung, keine Kurve — sie sagt dir einfach, im Durchschnitt, wie weit von optimal dein Spiel war.

### Was Genauigkeits-% misst

Genauigkeits-% nimmt diese rohen Centipawn-Verlust-Daten und lässt sie durch eine **nichtlineare Umwandlungsfunktion** laufen. Der Zweck dieser Umwandlung ist, die Metrik intuitiver zu machen: eine 0–100-Skala, die Menschen sofort erfassen können.

Aber hier ist das kritische Detail: **Genauigkeits-% ist nicht proportional zum Centipawn-Verlust**.

### Die nichtlineare Beziehung

Die Beziehung zwischen deinem durchschnittlichen Centipawn-Verlust und deinem Genauigkeits-% folgt einer Kurve — kleine Verluste an der Spitze der Skala bestrafen dich viel härter als große Verluste am unteren Ende. Das hat reale praktische Auswirkungen:

| Durchschnittlicher Centipawn-Verlust | Ungefährer Genauigkeits-% | Was das bedeutet |
|---|---|---|
| 0 cp | 99,9%+ | Perfektes Engine-Spiel — für Menschen im Wesentlichen unerreichbar |
| 10 cp | ~93% | Ein sehr starkes Vereinsspiel, die meisten Züge waren ausgezeichnet oder best |
| 25 cp | ~82% | Ein anständiges Spiel mit einigen spürbaren Unvollkommenheiten |
| 50 cp | ~68% | Mehrere Ungenauigkeiten oder ein moderater Fehler |
| 100 cp | 50% | Klare Fehler; wahrscheinlich ein oder zwei Patzer |
| 200 cp | ~32% | Mehrere Patzer oder ein katastrophaler Fehler |
| 500 cp | ~15% | Die Engine erkennt das Spiel kaum als Schach |

Der Sprung von 10 cp auf 25 cp (nur 15 zusätzliche Centipawns im Durchschnitt) senkt deine Genauigkeit von ~93% auf ~82% — ein 11-Punkt-Einbruch. Aber der Sprung von 100 cp auf 200 cp (100 zusätzliche Centipawns) senkt dich von 50% auf 32% — nur 18 Punkte für mehr als das 6-fache des Centipawn-Anstiegs.

**Warum das wichtig ist:** Ein einziger 70-cp-Fehler in einem sonst sauberen Spiel (sagen wir, 15 Züge à 5 cp) gibt dir einen Durchschnitt von ~9 cp, was ~93% Genauigkeit ergibt. Derselbe 70-cp-Fehler in einem chaotischen Spiel (15 Züge mit durchschnittlich 30 cp) gibt dir einen Durchschnitt von ~33 cp, was ~78% ergibt. Der Fehler kostete dich motorisch gleich, aber seine Auswirkung auf den Genauigkeits-% hängt完全 von der Qualität des Restes deines Spiels ab.

Das folgende Diagramm veranschaulicht das direkt:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="360" viewBox="0 0 680 360" fill="none" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <defs>
    <linearGradient id="abBg" x1="0" y1="0" x2="680" y2="360" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
    <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#6366f1"/><stop offset="0.5" stop-color="#a78bfa"/><stop offset="1" stop-color="#c4b5fd"/>
    </linearGradient>
    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6366f1" stop-opacity="0.2"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
    </linearGradient>
    <filter id="curveGlow">
      <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="680" height="360" rx="18" fill="url(#abBg)"/>
  <rect x="1" y="1" width="678" height="358" rx="17" stroke="white" stroke-opacity="0.05"/>
  <!-- Title -->
  <text x="340" y="32" text-anchor="middle" fill="white" font-size="16" font-weight="700" letter-spacing="0.3">Genauigkeits-% vs. Durchschnittlicher Centipawn-Verlust (Nichtlineare Beziehung)</text>
  <!-- Grid lines (horizontal) -->
  <g stroke="#1e293b" stroke-width="1" stroke-dasharray="4 3">
    <line x1="70" y1="55" x2="650" y2="55"/>
    <line x1="70" y1="117.5" x2="650" y2="117.5"/>
    <line x1="70" y1="180" x2="650" y2="180"/>
    <line x1="70" y1="242.5" x2="650" y2="242.5"/>
    <line x1="70" y1="305" x2="650" y2="305"/>
  </g>
  <!-- Y-axis labels -->
  <text x="60" y="59" text-anchor="end" fill="#64748b" font-size="11">100%</text>
  <text x="60" y="121.5" text-anchor="end" fill="#64748b" font-size="11">75%</text>
  <text x="60" y="184" text-anchor="end" fill="#64748b" font-size="11">50%</text>
  <text x="60" y="246.5" text-anchor="end" fill="#64748b" font-size="11">25%</text>
  <text x="60" y="309" text-anchor="end" fill="#64748b" font-size="11">0%</text>
  <!-- Grid lines (vertical) -->
  <g stroke="#1e293b" stroke-width="1" stroke-dasharray="4 3">
    <line x1="70" y1="55" x2="70" y2="305"/>
    <line x1="186" y1="55" x2="186" y2="305"/>
    <line x1="302" y1="55" x2="302" y2="305"/>
    <line x1="418" y1="55" x2="418" y2="305"/>
    <line x1="534" y1="55" x2="534" y2="305"/>
    <line x1="650" y1="55" x2="650" y2="305"/>
  </g>
  <!-- X-axis labels -->
  <text x="70" y="322" text-anchor="middle" fill="#64748b" font-size="11">0</text>
  <text x="186" y="322" text-anchor="middle" fill="#64748b" font-size="11">100</text>
  <text x="302" y="322" text-anchor="middle" fill="#64748b" font-size="11">200</text>
  <text x="418" y="322" text-anchor="middle" fill="#64748b" font-size="11">300</text>
  <text x="534" y="322" text-anchor="middle" fill="#64748b" font-size="11">400</text>
  <text x="650" y="322" text-anchor="middle" fill="#64748b" font-size="11">500</text>
  <!-- Axis titles -->
  <text x="360" y="350" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="0.3">Durchschnittlicher Centipawn-Verlust (cp)</text>
  <text x="18" y="180" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="0.3" transform="rotate(-90, 18, 180)">Genauigkeits-%</text>
  <!-- Fill under curve -->
  <path d="M70 55 L 76 65.2 L 82 81.6 L 88 97.5 L 94 112.5 L 100 126.6 L 106 139.7 L 112 151.9 L 118 163.2 L 124 173.7 L 130 183.5 L 136 192.5 L 142 200.9 L 148 208.6 L 154 215.8 L 160 222.5 L 166 228.7 L 172 234.5 L 178 239.8 L 184 244.8 L 190 249.4 L 196 253.7 L 202 257.7 L 208 261.4 L 214 264.8 L 220 268.0 L 226 270.9 L 232 273.7 L 238 276.2 L 244 278.6 L 250 280.8 L 256 282.8 L 262 284.7 L 268 286.5 L 274 288.2 L 280 289.8 L 286 291.3 L 292 292.7 L 298 294.0 L 304 295.2 L 310 296.3 L 316 297.4 L 322 298.4 L 328 299.4 L 334 300.3 L 340 301.2 L 346 302.0 L 352 302.8 L 358 303.5 L 364 304.2 L 370 304.9 L 376 305.5 L 382 306.1 L 388 306.7 L 394 307.2 L 400 307.7 L 406 308.2 L 412 308.7 L 418 309.1 L 424 309.5 L 430 309.9 L 436 310.3 L 442 310.7 L 448 311.1 L 454 311.4 L 460 311.8 L 466 312.1 L 472 312.4 L 478 312.7 L 484 313.0 L 490 313.3 L 496 313.5 L 502 313.8 L 508 314.1 L 514 314.3 L 520 314.5 L 526 314.8 L 532 315.0 L 538 315.2 L 544 315.4 L 550 315.6 L 556 315.8 L 562 316.0 L 568 316.2 L 574 316.4 L 580 316.6 L 586 316.8 L 592 317.0 L 598 317.1 L 604 317.3 L 610 317.5 L 616 317.6 L 622 317.8 L 628 317.9 L 634 318.1 L 640 318.2 L 646 318.3 L 650 318.5 Z" fill="url(#fillGrad)"/>
  <!-- Curve -->
  <polyline points="70,55 76,65.2 82,81.6 88,97.5 94,112.5 100,126.6 106,139.7 112,151.9 118,163.2 124,173.7 130,183.5 136,192.5 142,200.9 148,208.6 154,215.8 160,222.5 166,228.7 172,234.5 178,239.8 184,244.8 190,249.4 196,253.7 202,257.7 208,261.4 214,264.8 220,268.0 226,270.9 232,273.7 238,276.2 244,278.6 250,280.8 256,282.8 262,284.7 268,286.5 274,288.2 280,289.8 286,291.3 292,292.7 298,294.0 304,295.2 310,296.3 316,297.4 322,298.4 328,299.4 334,300.3 340,301.2 346,302.0 352,302.8 358,303.5 364,304.2 370,304.9 376,305.5 382,306.1 388,306.7 394,307.2 400,307.7 406,308.2 412,308.7 418,309.1 424,309.5 430,309.9 436,310.3 442,310.7 448,311.1 454,311.4 460,311.8 466,312.1 472,312.4 478,312.7 484,313.0 490,313.3 496,313.5 502,313.8 508,314.1 514,314.3 520,314.5 526,314.8 532,315.0 538,315.2 544,315.4 550,315.6 556,315.8 562,316.0 568,316.2 574,316.4 580,316.6 586,316.8 592,317.0 598,317.1 604,317.3 610,317.5 616,317.6 622,317.8 628,317.9 634,318.1 640,318.2 646,318.3 650,318.5" stroke="url(#curveGrad)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#curveGlow)"/>
  <!-- Highlighted data point markers -->
  <g>
    <!-- 10 cp / 92.6% -->
    <circle cx="81.6" cy="73.5" r="5" fill="#10b981" stroke="#080d1a" stroke-width="2"/>
    <text x="81.6" y="64" text-anchor="middle" fill="#10b981" font-size="9">10 cp → 93%</text>
    <!-- 50 cp / 68.2% -->
    <circle cx="128" cy="134.5" r="5" fill="#f59e0b" stroke="#080d1a" stroke-width="2"/>
    <text x="128" y="148" text-anchor="middle" fill="#f59e0b" font-size="9">50 cp → 68%</text>
    <!-- 100 cp / 50.0% -->
    <circle cx="186" cy="180" r="5" fill="#f97316" stroke="#080d1a" stroke-width="2"/>
    <text x="186" y="194" text-anchor="middle" fill="#f97316" font-size="9">100 cp → 50%</text>
    <!-- 200 cp / 31.8% -->
    <circle cx="302" cy="225.5" r="5" fill="#ef4444" stroke="#080d1a" stroke-width="2"/>
    <text x="302" y="240" text-anchor="middle" fill="#ef4444" font-size="9">200 cp → 32%</text>
  </g>
  <!-- Zone annotations -->
  <g transform="translate(70, 55)">
    <rect x="0" y="-2" width="58" height="250" fill="#10b981" fill-opacity="0.06" rx="2"/>
    <text x="29" y="130" text-anchor="middle" fill="#10b981" fill-opacity="0.5" font-size="10" transform="rotate(-90, 29, 130)">GM-BEREICH</text>
  </g>
  <g transform="translate(186, 55)">
    <rect x="0" y="-2" width="116" height="250" fill="#f59e0b" fill-opacity="0.06" rx="2"/>
    <text x="58" y="130" text-anchor="middle" fill="#f59e0b" fill-opacity="0.5" font-size="10" transform="rotate(-90, 58, 130)">VEREINSBEREICH</text>
  </g>
  <g transform="translate(302, 55)">
    <rect x="0" y="-2" width="348" height="250" fill="#ef4444" fill-opacity="0.06" rx="2"/>
    <text x="174" y="130" text-anchor="middle" fill="#ef4444" fill-opacity="0.5" font-size="10" transform="rotate(-90, 174, 130)">GROSSER VERLUSTBEREICH</text>
  </g>
</svg>
</div>

Wichtige Erkenntnis: **Genauigkeits-% ist an der Spitze komprimiert und am unteren Ende gestreckt.** Eine 20-cp-Verbesserung von 100 cp auf 80 cp bewegt deine Genauigkeit von 50% auf 57% — bescheiden. Aber dieselbe 20-cp-Verbesserung von 20 cp auf 0 cp bewegt deine Genauigkeit von 86% auf 100% — fast dreifache Auswirkung. Die Engine bestraft jede winzige Abweichung von perfektem Spiel unverhältnismäßig. Das ist ein Grund, warum Großmeister über scheinbar „kleine" Verbesserungen in ihrem Spiel besessen sind: 5 cp von deinem Durchschnitt zu schneiden ist an der Spitze viel härter, und der Genauigkeits-Lohn ist viel steiler.

## Ein konkretes Beispiel: Ein Zug, der alles ändert

Lass uns das mit einer spezifischen Stellung aus dem **Zwei-Springer-Endspiel** veranschaulichen, einer scharfen Eröffnung, in der eine einzige Entscheidung die Bewertung um mehrere Bauern verschieben kann.

### Die Stellung

> **FEN:** `r1bqkb1r/ppp2ppp/2n5/3Pp3/2B5/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 5`

Dies entsteht nach: **1.e4 e5 2.Sf3 Sc6 3.Lc4 Sf6 4.Sg5 d5 5.exd5**

```
      Weiß am Zug? Nein — Schwarz ist dran.
      ┌─ Stellung nach 5.exd5 ──────────────────────┐
      │  r . b q k b . r                              │
      │  p p p . . p p p                              │
      │  . . n . . . . .                              │
      │  . . . P p . . .                              │
      │  . . B . . . . .                              │
      │  . . . . . N . .                              │
      │  P P P P . P P P                              │
      │  R N B Q K . . R                              │
      │  Schwarz am Zug                                │
      └──────────────────────────────────────────────┘
```

Schwarz steht vor einer kritischen Entscheidung. Die *korrekte* Fortsetzung ist **Sa5** — Angriff auf Weiß' weißfeldrigen Läufer, bevor er Schaden anrichten kann. Der *Patzer* ist **Sxd5?**, was natürlich aussieht (den Bauern zurückschlagen und den Springer zentralisieren), aber in den berüchtigten **Fried-Liver-Angriff** führt.

### Die zwei Pfade

| Pfad | Zug | Bewertung danach | Centipawn-Verlust | Genauigkeits-Auswirkung |
|---|---|---|---|---|
| Engine-Best | **Sa5** greift den Läufer an | ~+0,9 (Weiß leicht besser — Schwarz hat Kompensation mit dem fehlplatzierten Springer) | 0 cp | ~95%+ für diesen Zug |
| Natürlicher Patzer | **Sxd5?**schlägt zurück | ~+3,5 (Weiß gewinnt — **7.Sxf7!** folgt) | 260 cp | ~25% für diesen Zug |
| Solide Alternative | **b5** (Ulvestad-Variante) | ~+0,8 (spielbar, scharf) | ~10 cp | ~90% |

Die brutale Realität: **Sxd5?** sieht wie ein normaler Entwicklungszug aus. Du schlägst den Bauern, zentralisierst deinen Springer, bleibst aktiv. Aber Stockfish' Bewertung schreit, dass du gerade einen 260-Centipawn-Fehler gemacht hast — genug, um deine Spiel-Genauigkeit von einem potenziellen 92% auf etwas wie 65% in einem einzigen Zug zu senken.

### Vorher und Nachher: Der Bewertungsschwung

**Vor Schwarzes Zug (Stellung nach 5.exd5):** Die Bewertung beträgt etwa **+0,3** zugunsten von Weiß — ein leichter Vorteil durch einen zusätzlichen Bauern (auch wenn es ein temporäres Opfer ist). Die Stellung ist noch im Bereich des normalen Schachs.

**Nach Sxd5? (Schwarzes Fehler):** Weiß spielt **7.Sxf7!** — das Fried-Liver-Opfer. Nach Kxf7 Df3+ Ke6 hat Weiß nur eine Figur für den geopferten Springer, aber der Angriff ist überwältigend. Die Bewertung springt auf **+3,5+**. Schwarzes König steht im Zentrum, exponiert, und Weiß hat Df3 mit Matt-Drohung, Sc3 greift den gefesselten Springer an, und alle Weiß' Figuren sind bereit, sich dem Angriff anzuschließen.

**Nach Sa5 (korrekt):** Weiß' Bewertung ist +0,9 — Weiß hat einen stabilen Vorteil, aber Schwarz hat vernünftiges Spiel. Der Genauigkeits-Unterschied zwischen den beiden Fortsetzungen ist enorm.

Das illustriert eine entscheidende Wahrheit über Genauigkeits-Bewertung: **Die Engine beurteilt den Zug selbst, nicht deine Absicht.** Ein „natürlicher" Zug, der für einen Menschen gut aussieht, kann eine 260-cp-Katastrophe für Stockfish sein. Dein Genauigkeits-% wird das Urteil der Engine widerspiegeln und genau erfassen, wie weit dein gewählter Pfad vom optimalen abwich.

> Diese Stellung und die Fried-Liver-Variante werden weiter in unserer Anleitung zu [Centipawn-Verlust in taktischen Sequenzen](/blog/what-is-centipawn-loss#centipawn-verlust-in-taktischen-sequenzen) diskutiert.

## Stellungstiefenanalyse: Genauigkeit in Aktion

Theorie ist das eine — lass uns sehen, wie Genauigkeit sich in echten Stellungen auswirkt. Unten sind drei Stellungen, die genau zeigen, wie Centipawn-Verlust in Genauigkeit übersetzt wird und warum das Urteil der Engine oft von menschlicher Intuition abweicht.

### Stellung 1: Der 99%-Zug vs. der 70%-Zug

<chess-position fen="r1bq1r2/ppp2kpp/2n5/3np3/2B5/5N2/PPPP1PPP/RNBQK2R w KQ - 0 7" caption="Weiß am Zug — sowohl Sxe5+ als auch Df3+ gewinnen die Figur zurück, aber die Engine sieht einen 1,5-Bauern-Unterschied zwischen ihnen." orientation="white" arrows="b1c3:green,f3e5:red" badge="best"></chess-position>

Diese Stellung entsteht im Fried-Liver-Angriff nach **1.e4 e5 2.Sf3 Sc6 3.Lc4 Sf6 4.Sg5 d5 5.exd5 Sxd5 6.Sxf7 Kxf7**. Weiß opferte eine Figur auf f7 und muss jetzt zurückschlagen. Beide Züge gewinnen — aber die Engine bevorzugt einen stark.

| Zug | Bewertung danach | Centipawn-Verlust | Zug-Genauigkeit | Was passiert |
|---|---|---|---|---|
| **Sxe5+** (Engine-Best) | **+4,0** — Weiß gewinnt | 0 cp | **~99%** | Gewinnt die Figur sauber. Nach 7...Kd6 8.Df3+ Ke6 9.Sxc6 hat Weiß eine zusätzliche Figur mit zerschlagener Stellung. |
| **Df3+** (verlockende Alternative) | **+2,5** — Weiß gewinnt noch | ~150 cp | **~70%** | Gewinnt auch die Figur, aber Schwarz bekommt eine besser koordinierte Stellung nach 7...Ke6 8.Sxc6 Sxc6, und Weiß' Vorteil ist weniger dominant. |

Beide Züge führen zu einer gewonnenen Stellung. Aber die 150-Centipawn-Lücke zwischen ihnen spiegelt einen echten strategischen Unterschied wider: **Sxe5+** gewinnt die Figur sofort mit einem erzwungenen Schach und behält die volle Kontrolle. **Df3+** verzögert den Rückschlag und gibt Schwarz Zeit, sich zu konsolidieren.

Die Zug-Genauigkeit erfasst das präzise: ~99% für Sxe5+ bedeutet, die Engine betrachtet es als im Wesentlichen den einzigen guten Zug. ~70% für Df3+ bedeutet, dass ein erheblicher Teil des Stellungspotentials auf dem Brett gelassen wurde. Diese Lücke — 29 Prozentpunkte — geht完全 um *wie gut* du konvertiert hast, nicht *ob* du konvertiert hast.

### Stellung 2: Die Ungenauigkeit, die trotzdem gewinnt

<chess-position fen="8/5k2/8/2pPP3/2P5/2K5/6R1/2r5 w - - 0 1" caption="Weiß am Zug — sowohl Tg7+ als auch Kd6 gewinnen, aber einer maximiert die Genauigkeit, während der andere unnötiges Risiko einlädt." orientation="white" arrows="c3b3:green,c3d3:red" badge="best"></chess-position>

Weiß hat ein dominantes Turm-Endspiel: verbundene Freibauern auf der 5. Reihe, einen aktiven Turm, und Schwarzes Turm steckt passiv fest. Beide Züge gewinnen — aber der Genauigkeits-Unterschied ist aufschlussreich.

| Zug | Bewertung danach | Centipawn-Verlust | Spiel-Genauigkeits-Auswirkung | Was passiert |
|---|---|---|---|---|
| **Tg7+** (Engine-Best) | **+9,0** — komplett gewonnen | 0 cp | **~92%** | Nimmt die 7. Reihe mit Schach. Nach 1...Kf8 2.Tf7+ Txf7 3.exf7, der d-Bauer wird zur Dame, während der e-Bauer ihn stützt. |
| **Kd6** (vernünftige Alternative) | **+5,5** — noch gewonnen | ~350 cp | **~82%** | Gewinnt auch, aber Schwarz bekommt mehr Verteidigungsressourcen. Die Konvertierung dauert länger und erfordert präziseres Folgespiel. |

Kd6 ist kein Patzer — es gewinnt noch klar. Aber die 350-Centipawn-Lücke zeigt, dass Weiß einen erheblichen Teil des Vorteils aufgab. In einem längeren Spiel könnte dieser verlorene Boden Schwarz Gegenspiel geben, das nach Tg7+ nicht existieren würde.

**Das ist die Schlüsselerkenntnis:** Selbst in einer gewonnenen Stellung misst Genauigkeit, *wie effizient* du konvertiert hast. Ein Spiel, in dem du +9,0 hattest und mit 92% Genauigkeit konvertiert hast, ist eine fundamental andere Spielqualität als eines, in dem du +9,0 hattest und mit 82% konvertiert hast. Die Engine sieht den Unterschied — und dein Genauigkeits-Score auch.

### Stellung 3: Das Endspiel, in dem Genauigkeit am meisten zählt

<chess-position fen="8/4k3/4P3/4K3/8/8/8/8 b - - 0 1" caption="Schwarz am Zug — Kd8 remisiert. Kf8 verliert. Ein Zug ist der Unterschied zwischen Remis und Niederlage." orientation="black" arrows="e7e8:green,e7d8:red" badge="best"></chess-position>

Das ist ein König-und-Bauer-Endspiel, in dem Weiß einen Bauern auf der 7. Reihe hat, gestützt vom König. Schwarzes einzige Aufgabe ist es, vor dem Bauern zu bleiben. Die Wahl ist binär:

| Zug | Ergebnis | Centipawn-Verlust | Zug-Genauigkeit | Warum |
|---|---|---|---|---|
| **Kd8** (korrekt) | **Remis** | 0 cp | **~99%** | Blockiert den Bauern an der Dame-Werdung. Weiß kann keinen Fortschritt machen — der König kann nicht umgehen, ohne den Bauern aufzugeben. |
| **Kf8** (verlierend) | **Niederlage** | ~900 cp | **~5%** | Lässt den Bauern sofort mit e8=D zur Dame werden. Spiel vorbei. |

Das ist der极端 Fall: dieselbe Stellung, derselbe Spieler, und die Genauigkeits-Lücke zwischen den beiden Zügen beträgt **94 Prozentpunkte**. Im Mittelspiel könnte ein 900-cp-Fehler durch eine komplexe taktische Übersicht passieren. In einem Endspiel wie diesem gibt es nichts zu berechnen — es ist reines Wissen. Du weißt entweder, dass der Bauer zur Dame wird, oder nicht.

**Endspiele sind dort, wo Genauigkeits-Scores am brutalsten ehrlich sind.** In der Eröffnung könntest du 90% erzielen, indem du auswendig gelernte Theorie folgst. Im Mittelspiel erzeugen komplexe Taktiken Mehrdeutigkeit. Aber im Endspiel ist jeder Zug eine klare Entscheidung mit einer klaren Bewertung. Es gibt kein Versteck. Ein einziger falscher Königszug kann eine Remis-Stellung in eine Niederlage verwandeln — und dein Genauigkeits-Score wird es sofort widerspiegeln.

Deshalb ist es so wertvoll, deine Endspiel-Genauigkeit separat von deiner Mittelspiel-Genauigkeit zu verfolgen. Wenn deine Gesamtgenauigkeit 85% beträgt, aber deine Endspiel-Genauigkeit 70%, weißt du genau, wo du dein Studium fokussieren solltest.

## Das Phasenproblem: Wo deine Genauigkeit tatsächlich fällt

Forschung an Amateurspielen zeigt durchgehend, dass Genauigkeit nicht gleichmäßig über alle Phasen fällt:

**Eröffnung (Züge 1–15):** Die meisten Spieler haben hier hohe Genauigkeit, weil sie auswendig gelernten Varianten folgen. Genauigkeit „sieht gut aus", spiegelt aber keine echte Berechnung wider — sie spiegelt Vorbereitung wider.

**Mittelspiel (Züge 15–35):** Hier finden die schärfsten Abfälle statt. Taktiken werden komplex, Zeitnot baut sich auf, und deine auswendig gelernten Muster gehen aus. Diese Phase ist der am höchsten hebelbare Bereich für Verbesserung.

**Endspiel (Züge 35+):** Viele Spieler verlieren hier auch Genauigkeit, aber oft ist es durch angesammelten Druck oder eine technisch verlorene Stellung — nicht durch Berechnungsfehler.

Wenn du deine Spiele analysierst, schau auf Genauigkeit *nach Phase*, nicht nur auf die Gesamtzahl. Centipawn-Verlust-Analyse kann dabei helfen — siehe [Centipawn-Verlust nach Spielphase verfolgen](/blog/what-is-centipawn-loss#acpl-nach-spielphase).

## Wie du Genauigkeit tatsächlich zur Verbesserung nutzt

1. **Suche nach den Ausreißer-Zügen.** Sortiere deine Züge nach Centipawn-Verlust und studiere die Top 3. Das sind deine teuersten Entscheidungen.

2. **Verfolge über Eröffnungssysteme.** Du durchschnitts vielleicht 88% im Italienischen, aber nur 79% im Sizilianischen Drachen. Diese Lücke sagt dir, wo deine Vorbereitung endet und deine Berechnung beginnt.

3. **Vergleiche ähnliche Zeitkontrollen.** Ein 5-Minuten-Blitz-Spiel bei 80% vs. ein 15-Minuten-Schnellschach-Spiel bei 87% ist normal. Wenn deine Schnellschach-Genauigkeit nahe an deiner Blitz-Genauigkeit liegt, nutzt du die zusätzliche Zeit nicht effektiv. Für mehr dazu, wie Centipawn-Verlust mit der Zeitkontrolle skaliert, siehe [durchschnittlicher Centipawn-Verlust nach Zeitkontrolle](/blog/what-is-centipawn-loss#acpl-nach-zeitkontrolle).

4. **Führe einen Spielbericht durch.** FireChess scannt deine letzten N Spiele von Lichess oder Chess.com und gruppiert deine Genauigkeitsabfälle in Muster — wiederholte [Eröffnungslecks](/blog/how-to-find-opening-weaknesses), typische taktische Blindstellen, Endspieltechnik-Versagen — damit du Trends statt einzelner Schwankungen siehst.

5. **Jage nicht 99% hinterher.** Ein 99% genaues Spiel ist meistens ein kurzes Spiel mit erzwungenen Zügen. Strebe nach Konsistenz im 85–92%-Bereich über viele Spiele und verwende Centipawn-Verlust, um die *Größe* deiner Fehler zu messen, nicht nur ihre Anzahl.

Die Genauigkeitszahl allein ist ein Kompass. Die [Centipawn-Verlust-Aufschlüsselung](/blog/what-is-centipawn-loss) ist die Karte.

## FAQ: Schach-Genauigkeits-Score

### Q: Wie finde ich meinen Genauigkeits-Score?

Lade deine Spiele auf [FireChess' Scanner unter /analyze](/analyze) hoch — er zeigt deine Zug-Genauigkeit, Centipawn-Verlust-Aufschlüsselung und die Abzeichen-Verteilung (wie viele Best, Gut, Ungenauigkeit, Fehler und Patzer-Züge du gemacht hast). Du kannst Spiele von Lichess oder Chess.com scannen oder direkt ein PGN einfügen.

### Q: Ist Schach-Genauigkeit dasselbe wie „Prozentsatz bester Züge"?

Nein. Genauigkeits-% ist nicht einfach „Anzahl bester Züge geteilt durch Gesamtzüge." Die meisten Plattformen verwenden eine gewichtete Formel, die die Schwere jedes Fehlers berücksichtigt. Ein einziger 100-cp-Patzer zieht deine Genauigkeit stärker herunter als drei 5-cp-Ungenauigkeiten, auch wenn der „Prozentsatz bester Züge" sie gleich gewichten würde. Lichess verwendet eine Formel basierend auf der Summe der quadrierten Centipawn-Verluste, während Chess.com eine sigmoid-ähnliche Kurve auf den Durchschnitt anwendet.

### Q: Warum steigt meine Genauigkeit manchmal nach einem Patzer?

Das tut sie nicht — die Gesamt-Spielgenauigkeit sinkt immer nach einem Patzer im Vergleich zu dem, wo sie gewesen wäre. Aber die *Zug-Genauigkeits*-Berechnung kann kontraintuitive Ergebnisse produzieren, wenn der Patzer zu einer erzwungenen Sequenz führt, in der alle verbleibenden Züge offensichtlich sind. Wenn du zum Beispiel eine Dame hängst und dann alle verbleibenden Züge erzwungene Rückschläge mit 0 cp Verlust sind, könnte die endgültige Genauigkeit höher erscheinen als erwartet — aber sie ist immer noch niedriger als ohne den Patzer. Die Verzerrung kommt von der erzwungenen Natur des Folgespiels.

### Q: Was ist eine gute Genauigkeit für mein Bewertungsniveau?

Siehe das Diagramm oben in diesem Artikel für typische Bereiche, aber grobe Richtlinien:

| Bewertung | Typische Genauigkeit | Was es bedeutet |
|---|---|---|
| Unter 1000 | 60–70% | Mehrere Fehler pro Spiel; Patzer alle 5–7 Züge |
| 1000–1400 | 70–78% | Gelegentliche Patzer; inkonsistentes Eröffnungsspiel |
| 1400–1800 | 78–85% | Wenige glatte Patzer; Fehler sind Ungenauigkeiten |
| 1800–2200 | 85–92% | Seltene Patzer; die meisten Ungenauigkeiten sind positionsbezogen |
| 2200+ (NM/IM) | 92–96% | Ein oder zwei kleine Ungenauigkeiten pro Spiel |
| 2500+ (GM) | 95–98% | Züge, die „ungenau" erscheinen, sind oft strategische Abwägungen |

Erinnere dich: Diese variieren显著 je nach Zeitkontrolle und Eröffnungskomplexität.

### Q: Kann Genauigkeit negativ sein oder über 100% gehen?

Einige Plattformen (wie Chess.com) begrenzen Genauigkeit auf 0–100. Andere (wie Lichess) erlauben es in Theorie, leicht über 100% zu gehen, wenn jeder Zug besser war als die Top-Empfehlung der Engine (was in seltenen Fällen passiert, in denen die Engine über Iterationen hinweg ihre Meinung ändert). In der Praxis werden Werte über 100% im Wesentlichen nie angezeigt. Deckenwerte wie 99,9% erscheinen in sehr kurzen, erzwungenen Spielen. Am unteren Ende kann ein Spiel mit mehreren damengroßen Patzern sich 0% nähern, auch wenn die meisten Plattformen nichts unter 1–5% anzeigen.

### Q: Wie unterscheidet sich Genauigkeit von Centipawn-Verlust?

Das ist die häufigste Frage, und die Antwort ist **Genauigkeits-% ist eine komprimierte, nichtlineare Transformation von Centipawn-Verlust**:

- **Centipawn-Verlust** sind Rohdaten — der tatsächliche Unterschied zwischen deinem Zug und dem besten der Engine, gemessen in Hundertsteln eines Bauern. Es ist additiv, linear und direkt über Spiele vergleichbar.
- **Genauigkeits-%** ist eine verarbeitete Metrik — sie nimmt Centipawn-Verluste, wendet eine Kurve (oder eine andere nichtlineare Funktion) an und bildet sie auf einen 0–100-Prozentsatz ab. Sie ist intuitiv, verliert aber die Rohgrößeninformation.

Verwende Centipawn-Verlust, wenn du wissen willst, *wie viel* du pro Zug verloren hast. Verwende Genauigkeits-%, wenn du eine schnelle, verständliche Zusammenfassung willst. Für ernsthafte Verbesserung verfolge beides. Siehe unsere vollständige Aufschlüsselung in [Was ist Centipawn-Verlust?](/blog/what-is-centipawn-loss).

---

*Willst du finden, wo deine Genauigkeit tatsächlich fällt? Führe einen FireChess-Bericht durch — er scannt deine letzten Spiele und zeigt dir die Stellungen, in denen du am meisten Boden verloren hast, mit Zug-Centipawn-Verlust und Genauigkeits-Aufschlüsselungen nach Eröffnung, Phase und Zeitkontrolle.*
