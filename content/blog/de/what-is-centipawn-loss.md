---
title: "Durchschnittlicher Centipawn-Verlust erklärt: Was ACPL bedeutet & wie du ihn verbesserst"
description: "Der durchschnittliche Centipawn-Verlust (ACPL) misst die Zuggqualität im Schach. Erfahre, was er bedeutet, sieh Beispiele auf dem Brett und nutze FireChess, um deinen zu senken."
date: "2026-07-26"
author: "FireChess Team"
tags: ["analyse", "grundlagen", "verbesserung", "centipawn-verlust"]
canonical: https://firechess.com/de/blog/what-is-centipawn-loss
---

Du hast gerade ein hart erkämpftes 45-minütiges Spiel beendet. Du öffnest das Analysebrett, startest die Engine, und da steht es: **„Durchschnittlicher Centipawn-Verlust: 72."**

Was bedeutet diese Zahl eigentlich? Ist 72 gut? Schlecht? Wie wird sie überhaupt berechnet? Und warum sollte es dich interessieren?

Wenn du jemals auf einen Centipawn-Verlust-Score gestarrt hast und dich verwirrter als informiert fühlst, bist du nicht allein. Der durchschnittliche Centipawn-Verlust (ACPL) steht im Zentrum der modernen Schachanalyse — jede große Plattform von Lichess über Chess.com bis FireChess verwendet ihn — aber die meisten Spieler verstehen nicht vollständig, was die Zahl repräsentiert oder wie man sie nutzt.

Diese Anleitung behebt das. Am Ende wirst du genau wissen, was Centipawn-Verlust ist, wie Stockfish diese mysteriösen Zahlen zuweist, wie FireChess den Centipawn-Verlust in die Zugabzeichen übersetzt, die du auf dem Analysebrett siehst (Genial !!, Best !, Gut ✓, Ungenauigkeit ?!, Fehler ?, Patzer ??), und — am wichtigsten — wie du den Centipawn-Verlust nutzen kannst, um deine größten Schwächen zu finden und schneller zu verbessern.

---

## Was ist ein Centipawn? Die Einheit der Schachanalyse

Das Wort „Centipawn" ist ein Kofferwort aus **centi** (ein Hundertstel) und **Pawn** (Bauer). Ein Centipawn entspricht 1/100 des Wertes eines Bauern auf dem Schachbrett.

Stell es dir als die kleinste bedeutungsvolle Einheit des Schachvorteils vor. So wie ein Gramm winzige Massen und ein Cent winzige Geldbeträge misst, misst ein Centipawn winzige Vorteile und Nachteile in einer Schachstellung.

**Die Grundannahme:** Ein Bauer ist 100 Centipawns wert. Das ist nicht willkürlich — es ist eine Konvention, die sich aus Jahrzehnten der Computerschachforschung ergeben hat. Die fünf traditionellen Materialwerte setzen sich wie folgt zusammen:

| Figur | Centipawn-Wert |
|-------|----------------|
| Bauer | 100 cp |
| Springer | 320 cp (≈3,2 Bauern) |
| Läufer | 330 cp (≈3,3 Bauern) |
| Turm | 500 cp (5 Bauern) |
| Dame | 900 cp (9 Bauern) |

Dies sind Ausgangswerte. Die Engine passt diese Werte dynamisch an die Stellung, Figurenaktivität, Königsicherheit, Bauernstruktur und Dutzende anderer Faktoren an. Ein Springer auf einem perfekten Vorposten könnte mit 350 cp bewertet werden; derselbe Springer, der am Brettrand feststeckt, könnte auf 280 cp fallen.

**Centipawn-Verlust** misst also den Unterschied zwischen deinem Zug und dem besten Zug der Engine, ausgedrückt in diesen Einheiten. Wenn der beste Zug in einer Stellung der Engine +0,50 ergibt (ein 50-Centipawn-Vorteil) und dein Zug +0,20 ergibt, beträgt dein Centipawn-Verlust für diesen Zug 30 cp — der Unterschied zwischen dem Optimalen und dem, was du gespielt hast. **Durchschnittlicher Centipawn-Verlust (ACPL)** ist einfach der Mittelwert dieser Verluste pro Zug über ein gesamtes Spiel — die einzelne Zahl, die du in deinem Analysebericht siehst. Für eine detaillierte Aufschlüsselung, wie sich diese Werte auf Bewertungsstufen beziehen, siehe unsere [ACPL-nach-Bewertungsstufe-Anleitung](/blog/average-centipawn-loss-by-rating), oder lies unsere [vollständige ACPL-Anleitung](/blog/average-centipawn-loss-guide) für praktische Strategien, um deinen zu senken.

---

## Wie Schach-Engines den Centipawn-Verlust berechnen

Hier wird die Erklärung meistens ungenau, also seien wir präzise. Wenn dich mehr interessiert, wie Plattformen diese Zahlen in Genauigkeitsprozente umwandeln, siehe unsere [Genauigkeits-Score-Anleitung](/blog/chess-accuracy-score-explained).

### Schritt 1: Die Engine bewertet die Stellung vor deinem Zug

Wenn du Stockfish ein Spiel analysieren lässt, betrachtet er die Stellung direkt vor deinem Zug und weist ihr eine numerische Bewertung zu. Das ist die vertraute „Eval-Bar"-Zahl, die du während der Analyse siehst — eine positive Zahl bedeutet, Weiß steht besser, eine negative Zahl bedeutet, Schwarz steht besser.

Eine Stellung, die mit **+0,73** bewertet wird, bedeutet, Weiß hat einen Vorteil, der 70 Centipawns entspricht — etwa drei Viertel eines Bauern. Eine Stellung bei **-1,20** bedeutet, Schwarz liegt um etwa einen Bauern und 20 Centipawns vorn.

### Schritt 2: Die Engine betrachtet alle möglichen Züge

Stockfish untersucht jeden legalen Zug in der Stellung und berechnet die beste Bewertung, die nach jedem Zug erreicht werden kann. Er tut dies, indem er viele Züge vorausschaut — typischerweise 20-30 Halbzüge tief in der Online-Analyse — und einen Suchalgorithmus namens Alpha-Beta-Beschneidung kombiniert mit neuronaler Netzwerk-Bewertung verwendet.

Für jeden Kandidatenzug fragt die Engine: *„Wenn ich diesen ziehe, was ist das bestmögliche Ergebnis für beide Seiten in den nächsten 20+ Zügen?"*

### Schritt 3: Centipawn-Verlust = Beste Bewertung — Bewertung deines Zuges

Die Formel ist unkompliziert:

```
Centipawn-Verlust = Bewertung(Bester Zug) - Bewertung(Dein Zug)
```

Angepasst an die Perspektive: Wenn der beste Zug +1,00 bewertet wird und dein Zug +0,70, beträgt dein Centipawn-Verlust **30 cp**. Du hast 30 Centipawns Vorteil gegenüber dem optimalen Zug aufgegeben.

Die Engine normalisiert dies in der Regel so, dass es immer als positive Zahl angezeigt wird (der *Verlust*, den du erlitten hast). Ein „Centipawn-Verlust von 45" bedeutet, dass du 45 Centipawns Vorteil relativ zum besten Zug in dieser Stellung verloren hast.

---

## Konkrete Beispiele: Centipawn-Verlust auf dem Brett

Lass uns das mit echten Stellungen veranschaulichen. Jede zeigt ein anderes Centipawn-Verlust-Szenario, dem du in deinen eigenen Spielen begegnen wirst.

### Beispiel 1: Eine geringe Ungenauigkeit (15-25 cp Verlust)

<chess-position fen="r1bq1rk1/ppp2ppp/2np1n2/4p3/2P5/2NP1NP1/PP2PPBP/R1BQ1RK1 w - - 0 10" caption="Eine typische Königsindische Aufbaustruktur. Weiß bester Zug ist 10.Le3, was die Entwicklung abschließt. Stattdessen 10.b3 zu spielen (mit der Idee Lb2) kostet etwa 18 cp — eine geringe Ungenauigkeit. Die Engine bevorzugt den Läufer auf e3, wo er die Schwäche auf d6 angreift. Dies ist die Art von Ungenauigkeit, die FireChess mit einem gelben '?!'-Abzeichen markiert." badge="inaccuracy" arrows="c1e3:green,b2b3:orange"></chess-position>

In der obigen Stellung hat Weiß eine komfortable Stellung (+0,45). Der beste Zug ist 10.Le3, der den Läufer auf sein aktivstes Feld entwickelt. Wenn Weiß stattdessen 10.b3 spielt, fällt die Bewertung auf etwa +0,27 — ein Centipawn-Verlust von **18 cp**. FireChess würde dies als **Ungenauigkeit (?!)** kennzeichnen.

Dies ist die häufigste Art von Centipawn-Verlust für Vereinsspieler: kleine positionelle Ungenauigkeiten, die das Spiel nicht verlieren, sich aber über 40 Züge ansammeln.

### Beispiel 2: Ein klarer Fehler (40-80 cp Verlust)

<chess-position fen="r1bqk2r/pppp1ppp/2n5/4P3/2B1n3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 7" caption="Weiß am Zug. Die beste Fortsetzung ist 7.Sc3, was den Springer auf e4 entwickelt und angreift. Stattdessen 7.0-0? zu erlaubt Schwarz mit ...d5 auszugleichen. Centipawn-Verlust: etwa 55 cp. FireChess-Abzeichen: Fehler (?)." badge="mistake" arrows="b1c3:green,e1g1:orange"></chess-position>

Weiß hat nach der Eröffnung einen leichten Vorteil (+0,60). Der beste Zug ist 7.Sc3, der den losen Springer auf e4 trifft und Druck aufrechterhält. Wenn Weiß mit 7.0-0? rochiert, spielt Schwarz 7...d5 und plötzlich ist Schwarz völlig ausgeglichen. Die Bewertung schwankt von +0,60 auf etwa +0,05 — ein Centipawn-Verlust von **55 cp**. FireChess markiert dies mit einem orangenen **Fehler (?)-**Abzeichen.

Beachte, dass dies kein taktischer Patzer ist — Weiß hat keine Figur hängen lassen. Aber Weiß hat den gesamten Eröffnungsvorteil in einem einzigen positionellen Fehltritt verschenkt. Das ist ein „Fehler": nicht partieentscheidend, aber wirklicher Schaden.

### Beispiel 3: Ein Patzer (80-150 cp Verlust)

<chess-position fen="r1b1kb1r/ppp2ppp/2n5/3qp3/8/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 7" caption="Weiß am Zug. Schwarz hat gerade ...De5 gespielt und die Dame ungedeckt gelassen. Der einzige gute Zug ist Sxe5, der die Dame gewinnt. Jeder andere Zug — sagen wir Le2 — ist ein 900-cp-Patzer. FireChess-Abzeichen: Patzer (??)." badge="blunder" arrows="f3e5:green"></chess-position>

Dies ist die dramatischste Art von Centipawn-Verlust. Weiß kann mit 7.Sxe5 die schwarze Dame schlagen und +9,00 in der Bewertung gewinnen. Jeder andere normale Zug — einen Läufer entwickeln, rochieren — wirft eine volle Dame weg. Der Centipawn-Verlust für das Versäumen von Sxe5 beträgt etwa **900 cp**. FireChess kennzeichnet dies als rotes **Patzer (??)**-Abzeichen.

Patzer dieser Größenordnung entstehen meist durch taktische Blindheit — man hat einfach nicht gesehen, dass der Schlag möglich war. Die Centipawn-Verlust-Zahl sagt dir genau, wie viel du auf dem Brett gelassen hast.

### Beispiel 4: Fast perfektes Spiel (0-15 cp Verlust)

<chess-position fen="r2q1rk1/ppp2ppp/2n1bn2/3p4/3P4/2NQ1N2/PPP2PPP/R1B2RK1 w - - 6 10" caption="Eine ruhige Stellung aus dem Damengambit. Weiß hat mehrere vernünftige Züge. 11.Lg5, 11.Lf4 und 11.Td1 liegen alle innerhalb von 5-10 cp voneinander entfernt. Selbst die ‚suboptimale' Wahl registriert hier kaum als Centipawn-Verlust. FireChess-Abzeichen: Best (!) oder Gut (✓)." badge="best" arrows="c1g5:green,c1f4:green"></chess-position>

In ruhigen, symmetrischen Stellungen kann der Centipawn-Verlust zwischen vernünftigen Zügen winzig sein. Hier bewerten sich Weiß' drei Kandidatenzüge — 11.Lg5, 11.Lf4 und 11.Td1 — alle zwischen +0,25 und +0,30. Die „falsche" Wahl kostet höchstens **5-8 cp**. FireChess würde jeden dieser Züge als **Best (!)** oder **Gin (✓)** kennzeichnen.

Das ist eine wichtige Erkenntnis: Nicht jeder Centipawn-Verlust ist gleich. 10 Centipawns Verlust in einem scharfen Sizilianer, wo nur ein Zug die Stellung hält, ist eine große Sache. 10 Centipawns Verlust in einer ruhigen Stellung, in der fünf Züge spielbar sind, ist Rauschen.

### Beispiel 5: Der Eröffnungs-Patzer (150+ cp Verlust)

<chess-position fen="rnbqkbnr/ppp2ppp/3p4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3" caption="Schwarz am Zug in der Philidor-Verteidigung. Den natürlich aussehenden Zug 3...Lg4? zu spielen, fesselt den Springer, verliert aber einen Bauern nach 4.Lxf7+! Kxf7 5.Sg5+. Centipawn-Verlust: etwa 250 cp. FireChess-Abzeichen: Patzer (??)." badge="blunder" arrows="c4f7:red,f3g5:green"></chess-position>

Die Philidor-Verteidigung (1.e4 e5 2.Sf3 d6 3.Lc4) sieht unschuldig aus, aber Schwarz muss vorsichtig sein. Der Zug 3...Lg4? fühlt sich logisch an — den Springer fesseln — aber er läuft in 4.Lxf7+! Nach 4...Kxf7 5.Sg5+ verliert Schwarz die Rochaderechte und einen Bauern. Der Centipawn-Verlust beträgt etwa **250 cp** für einen einzelnen Zug. Das ist die Art von Eröffnungsfalle, die FireChess mit einem roten **Patzer (??)**-Abzeichen markiert.

### Beispiel 6: Endspielpräzision (10 cp vs. 50 cp)

<chess-position fen="8/8/8/4k3/8/3KP3/8/8 w - - 0 1" caption="Ein einfaches König-und-Bauer-Endspiel. Weiß am Zug. 1.Ke2? (verliert die Opposition) kostet etwa 45 cp und verwandelt einen Gewinn in ein Remis. 1.Kd2! behält die Opposition und gewinnt. Der Unterschied zwischen +1,20 und +0,08 beträgt 112 cp — ein einzelner Zug ändert das Spielergebnis." badge="blunder" arrows="e3d2:green,e3e2:red"></chess-position>

Endspiele sind dort, wo Centipawn-Verlust gnadenlos wird. In der obigen Stellung muss Weiß 1.Kd2! spielen, um die Opposition zu behalten und zu gewinnen. 1.Ke2? zu spielen verliert die Opposition und die Bewertung stürzt von +1,20 auf +0,08 ab — ein Centipawn-Verlust von **112 cp**. Ein einziger Königszug. Spiel vorbei. FireChess markiert dies als **Patzer (??)**, weil der Bewertungsschwung entscheidend ist.

Derselbe Centipawn-Verlust von 112 im Mittelspiel könnte ein teilweiser Fehler in einer komplexen Stellung sein. Im Endspiel, mit so wenigen Figuren übrig, ist es katastrophal. Kontext zählt.

---

## FireChess-Zugabzeichen: Was jedes Label bedeutet

Wenn du ein Spiel auf FireChess analysierst, erhält jeder Zug ein farbiges Abzeichen neben sich in der Zugliste. Diese Abzeichen sind nicht zufällig — sie entsprechen direkt den Centipawn-Verlust-Bereichen. Hier die vollständige Zuordnung, damit du genau weißt, was jedes Label bedeutet. Für einen tieferen Einblick in die Genauigkeits-Scores siehe unsere [Genauigkeits-Score-Anleitung](/blog/chess-accuracy-score-explained).

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="720" height="560" viewBox="0 0 720 560" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cpBg" x1="0" y1="0" x2="720" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
  </defs>
  <rect width="720" height="560" rx="18" fill="url(#cpBg)"/>
  <rect x="1" y="1" width="718" height="558" rx="17" stroke="white" stroke-opacity="0.05"/>
  <!-- Title -->
  <text x="360" y="40" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700" letter-spacing="0.4" font-family="system-ui">FireChess-Zugabzeichen — Centipawn-Verlust-Zuordnung</text>
  <text x="360" y="62" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Jedes Abzeichen entspricht einem Centipawn-Verlust-Bereich. Niedriger = besser. Dein ACPL mittelt diese über jeden Zug.</text>
  <!-- Badge cards -->
  <!-- Brilliant: 0-10 cp loss, but only for sacrifices that work -->
  <g transform="translate(30, 90)">
    <rect width="660" height="54" rx="10" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#22d3ee" font-size="18" font-weight="800" font-family="system-ui">!!</text>
    <text x="54" y="34" fill="#22d3ee" font-size="15" font-weight="700" font-family="system-ui">Genial</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp Verlust · Bester-Zug-Opfer, das die Bewertung zu deinen Gunsten verschiebt</text>
  </g>
  <!-- Best: 0-10 cp loss -->
  <g transform="translate(30, 150)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#34d399" font-size="18" font-weight="800" font-family="system-ui">!</text>
    <text x="54" y="34" fill="#34d399" font-size="15" font-weight="700" font-family="system-ui">Best</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp Verlust · Du hast die Top-Wahl der Engine getroffen</text>
  </g>
  <!-- Good: 10-25 cp loss -->
  <g transform="translate(30, 210)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.05" stroke="#10b981" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#6ee7b7" font-size="18" font-weight="800" font-family="system-ui">✓</text>
    <text x="54" y="34" fill="#6ee7b7" font-size="15" font-weight="700" font-family="system-ui">Gut</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">10-25 cp Verlust · Solides Spiel, leicht suboptimal, aber innerhalb der Stellungslogik</text>
  </g>
  <!-- Book: 0-12 cp in first 15 moves -->
  <g transform="translate(30, 270)">
    <rect width="660" height="54" rx="10" fill="#94a3b8" fill-opacity="0.06" stroke="#94a3b8" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#cbd5e1" font-size="18" font-weight="800" font-family="system-ui">DB</text>
    <text x="54" y="34" fill="#cbd5e1" font-size="15" font-weight="700" font-family="system-ui">Theorie</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-12 cp Verlust · Züge 1-15 folgen bekannter Eröffnungstheorie — Engine behandelt als Theorie-Niveau</text>
  </g>
  <!-- Inaccuracy: 25-75 cp loss -->
  <g transform="translate(30, 330)">
    <rect width="660" height="54" rx="10" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fbbf24" font-size="18" font-weight="800" font-family="system-ui">?!</text>
    <text x="54" y="34" fill="#fbbf24" font-size="15" font-weight="700" font-family="system-ui">Ungenauigkeit</text>
    <text x="200" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">25-75 cp Verlust · Ein kleiner Ausrutscher — nicht verlierend, aber eine bessere Option verpasst. Kostete etwa einen halben Bauern.</text>
  </g>
  <!-- Mistake: 75-200 cp loss -->
  <g transform="translate(30, 390)">
    <rect width="660" height="54" rx="10" fill="#f97316" fill-opacity="0.08" stroke="#f97316" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fb923c" font-size="18" font-weight="800" font-family="system-ui">?</text>
    <text x="54" y="34" fill="#fb923c" font-size="15" font-weight="700" font-family="system-ui">Fehler</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">75-200 cp Verlust · Ein wirklicher Fehltritt, der etwa 1-2 Bauern kostete. Sollte überprüft werden.</text>
  </g>
  <!-- Blunder: 200+ cp loss -->
  <g transform="translate(30, 450)">
    <rect width="660" height="54" rx="10" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#f87171" font-size="18" font-weight="800" font-family="system-ui">??</text>
    <text x="54" y="34" fill="#f87171" font-size="15" font-weight="700" font-family="system-ui">Patzer</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">200+ cp Verlust · Ein schwerer Fehler — Figur hängen lassen, gewinnende Taktik verpasst oder Stellung tödlich geschwächt</text>
  </g>
</svg>
</div>

### Q: Wie die Abzeichen mit deinem Spielbericht zusammenhängen

Wenn du ein Spiel auf FireChess hochlädst und die Analyse startest, zeigt die Zusammenfassung oben auf der Seite eine Aufschlüsselung:

- **Weiß 78,7% Genauigkeit · Best 11 · Theorie 8 · Gut 3 · Patzer 2 · ACPL 43,2**
- **Schwarz 75,5% Genauigkeit · Best 8 · Theorie 6 · Gut 3 · Ungenauigkeit 2 · Fehler 1 · Patzer 3 · ACPL 50,6**

Jede dieser Zählungen ist eine direkte Übersetzung der Centipawn-Verlust-Bereiche. Ein „Patzer" bedeutet, dass dieser Zug 200+ Centipawn-Verlust hatte. Ein „Fehler" bedeutet 75-200 cp. Eine „Ungenauigkeit" bedeutet 25-75 cp. Der ACPL am Ende mittelt all diese zu einer einzelnen Zahl.

**Was diese Tabelle dir sofort sagt:**

- Zug 13.e5? zeigt ein ??-Abzeichen — das ist ein Patzer mit 200+ Centipawn-Verlust
- Zug 6.Sxf7! zeigt ein !-Abzeichen — bester Zug, 0-10 cp Verlust
- Zug 18.Lxd4 zeigt ein ✓-Abzeichen — guter Zug, 10-25 cp Verlust, solide, aber nicht der absolute Beste

Das ist die Verbindung zwischen der abstrakten Centipawn-Verlust-Zahl und dem konkreten Abzeichen auf deinem Bildschirm. Wenn du dein nächstes Spiel spielst und auf FireChess hochlädst, wird jedes Abzeichen, das du siehst, von Centipawn-Verlust unter der Haube angetrieben.

---

## Wie verschiedene Centipawn-Verlust-Werte auf dem Brett aussehen

Zahlen auf einer Seite sind abstrakt. Lass sie uns auf ein echtes Schachbrett legen, damit du sehen kannst, was verschiedene Centipawn-Verlust-Scores repräsentieren. Wenn du sehen willst, wie diese Bereiche Bewertungsstufen zugeordnet sind, hat unsere [ACPL-nach-Bewertungsstufe-Anleitung](/blog/average-centipawn-loss-by-rating) die vollständige Aufschlüsselung.

### Centipawn-Verlust 0-15: Fast perfektes Spiel

Auf diesem Niveau findest du den besten Zug oder etwas Nah dran. Das ist der Bereich von Großmeisterleistungen in den meisten Stellungen. 10 Centipawns Verlust bedeutet, dass du einen Zug gespielt hast, der objektiv fast so gut ist wie die erste Wahl der Engine — vielleicht hast du ein leicht weniger optimales Feld für deinen Läufer gewählt, oder einen anderen Bauernvormarsch, der trotzdem solide ist.

FireChess-Abzeichen auf diesem Niveau: **Genial (!!)** oder **Best (!)**.

### Centipawn-Verlust 15-40: Kleine Ungenauigkeiten

Das ist der Bereich starker Vereinsspieler und Experten (1800-2200 Bewertung). Du patzt nicht — du findest einfach nicht die präziseste Fortsetzung. 25 Centipawns Verlust bedeutet typischerweise, dass du einen soliden Entwicklungszug gespielt hast, als ein aggressiverer oder subtilerer Zug verfügbar war.

FireChess-Abzeichen auf diesem Niveau: **Ungenauigkeit (?!)** — das gelbe Abzeichen.

### Centipawn-Verlust 40-80: Klare Fehler

Das ist der häufigste Centipawn-Verlust-Bereich für Vereinsspieler mittleren Niveaus (1200-1600). Du machst Fehler, die etwa einen halben bis ganzen Bauern Vorteil weggeben. Dies sind oft positionelle Fehler — eine Figur falsch platziert, die falschen Figuren getauscht, oder einen Bauern geschoben, der eine Schwäche erzeugt.

FireChess-Abzeichen auf diesem Niveau: **Fehler (?)** — das orangene Abzeichen.

### Centipawn-Verlust 80-150: Patzer

Ein Centipawn-Verlust über 80 ist fast immer ein taktischer Fehler oder eine schwere positionelle Fehleinschätzung. Bei 100+ cp hast du im Wesentlichen einen ganzen Bauern Vorteil verschenkt — oft durch eine hängende Figur, eine verpasste Gabel oder ein schweres positionelles Zugeständnis.

FireChess-Abzeichen auf diesem Niveau: **Patzer (??)** — das rote Abzeichen.

### Centipawn-Verlust 150+: Partieentscheidende Fehler

Auf diesem Niveau hast du wahrscheinlich eine ganze Figur verloren oder einen entscheidenden Angriff erlaubt. 300+ Centipawns Verlust bedeutet fast immer, dass du einen Springer oder Läufer hängen lassen hast, ein erzwungenes Matt verpasst hast oder in eine verheerende Taktik gelaufen bist.

<chess-position fen="rnb1kbnr/pppp1ppp/8/3q4/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4" caption="Schwarzes Dame wurde gerade vom Bauern auf e4 geschlagen, nachdem Schwarz einen Patzer machte, indem er sie nach d5 zog, ohne den Bauernschlag auf diesem Feld zu bedenken. Centipawn-Verlust für Schwarz: +950 cp — eine volle Dame verloren." analysis="true" badge="blunder" arrows="e4d5:red"></chess-position>

---

## Wie Centipawn-Verlust in Genauigkeit übersetzt wird (und umgekehrt)

Viele Schachanalyse-Plattformen, einschließlich FireChess, zeigen sowohl einen **Genauigkeitsprozentsatz** als auch einen **durchschnittlichen Centipawn-Verlust (ACPL)** für jedes Spiel. Leute fragen oft: „Sind sie nicht dasselbe?"

Sie korrelieren, aber sie messen verschiedene Dinge.

**Durchschnittlicher Centipawn-Verlust** ist der rohe mathematische Durchschnitt, wie viele Centipawns du pro Zug aufgegeben hast. Es ist eine absolute Zahl — 55 ACPL bedeutet dasselbe von Spiel zu Spiel, unabhängig davon, wie scharf oder ruhig die Stellung war.

**Genauigkeitsprozent** ist ein normalisierter Score, der den Centipawn-Verlust in eine 0-100%-Skala umwandelt, basierend darauf, wie nah deine Züge an der besten Wahl der Engine waren. Er ist darauf ausgelegt, intuitiver zu sein: 95% Genauigkeit bedeutet, du hast auf Elite-Niveau gespielt; 60% bedeutet, du hattest Schwierigkeiten.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="720" height="340" viewBox="0 0 720 340" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="convBg" x1="0" y1="0" x2="720" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
    <linearGradient id="convLine" x1="60" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#10b981"/><stop offset="0.5" stop-color="#f59e0b"/><stop offset="1" stop-color="#ef4444"/>
    </linearGradient>
  </defs>
  <rect width="720" height="340" rx="18" fill="url(#convBg)"/>
  <rect x="1" y="1" width="718" height="338" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="360" y="35" text-anchor="middle" fill="#f1f5f9" font-size="17" font-weight="700" font-family="system-ui">ACPL → Genauigkeits-Umwandlung</text>
  <text x="360" y="55" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Typische Genauigkeit für einen gegebenen durchschnittlichen Centipawn-Verlust. Gekrümmt, weil Patzer den ACPL stärker senken als die Genauigkeit.</text>
  <!-- Y axis -->
  <line x1="80" y1="80" x2="80" y2="290" stroke="#334155" stroke-width="1"/>
  <text x="30" y="110" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">99%</text>
  <text x="30" y="155" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">90%</text>
  <text x="30" y="200" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">80%</text>
  <text x="30" y="245" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">70%</text>
  <text x="30" y="290" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">60%</text>
  <!-- X axis -->
  <line x1="80" y1="290" x2="640" y2="290" stroke="#334155" stroke-width="1"/>
  <text x="80" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">10</text>
  <text x="192" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">30</text>
  <text x="304" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">50</text>
  <text x="416" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">70</text>
  <text x="528" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">100</text>
  <text x="640" y="310" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">150</text>
  <text x="360" y="328" fill="#64748b" font-size="11" font-family="system-ui" text-anchor="middle">Durchschnittlicher Centipawn-Verlust (ACPL)</text>
  <!-- Conversion curve -->
  <path d="M 80 105 Q 192 118 304 155 Q 416 200 528 245 Q 584 268 640 288" stroke="url(#convLine)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Data points -->
  <circle cx="80" cy="105" r="5" fill="#10b981"/>
  <text x="80" y="95" fill="#10b981" font-size="10" font-family="system-ui" text-anchor="middle">GM</text>
  <circle cx="192" cy="118" r="5" fill="#10b981"/>
  <text x="192" y="108" fill="#10b981" font-size="10" font-family="system-ui" text-anchor="middle">Meister</text>
  <circle cx="304" cy="155" r="5" fill="#f59e0b"/>
  <text x="304" y="145" fill="#f59e0b" font-size="10" font-family="system-ui" text-anchor="middle">Experte</text>
  <circle cx="416" cy="200" r="5" fill="#f59e0b"/>
  <text x="416" y="190" fill="#f59e0b" font-size="10" font-family="system-ui" text-anchor="middle">Verein</text>
  <circle cx="528" cy="245" r="5" fill="#ef4444"/>
  <text x="528" y="235" fill="#ef4444" font-size="10" font-family="system-ui" text-anchor="middle">Freizeit</text>
  <circle cx="640" cy="288" r="5" fill="#ef4444"/>
  <text x="640" y="278" fill="#ef4444" font-size="10" font-family="system-ui" text-anchor="middle">Anfänger</text>
</svg>
</div>

| ACPL | Typische Genauigkeit (FireChess) | Typische Abzeichen-Verteilung | Was es bedeutet |
|------|----------------------------------|-------------------------------|-----------------|
| 10-20 | 95-99% | Hauptsächlich !!, !, ✓ | Großmeister-Niveau |
| 25-35 | 90-94% | !, ✓, wenige ?! | Meister / IM-Niveau |
| 40-50 | 85-89% | !, ✓, einige ?! und ? | Experte / starker Verein |
| 55-70 | 78-84% | Mischung aus !, ✓, ?!, ? | Vereinsspieler (1400-1600) |
| 70-90 | 72-78% | Mehr ?, ?!, gelegentlich ?? | Freizeit-Vereinsspieler |
| 90-150 | 65-72% | Häufig ? und ?? | Anfänger / Mittelfeld |
| 150+ | Unter 65% | Viele ??, partieverändernde Patzer | Kompletter Anfänger |

Die Beziehung ist nicht perfekt linear. Ein Spiel mit einem 300-Centipawn-Patzer und 39 perfekten Zügen könnte dir 55 ACPL, aber 94% Genauigkeit geben. Der Patzer zieht den ACPL stärker herunter als den Prozentsatz, weil die Genauigkeit Patzer stark bestraft, aber nicht unendlich.

**Praktische Empfehlung:** Verwende ACPL zur Verfolgung langfristiger Verbesserung (er ist granularer) und Genauigkeit für schnelle Spiel-zu-Spiel-Vergleiche (er ist intuitiver). Wenn du deinen FireChess-Bericht überfliegst, schau auf die Abzeichen-Zählungen oben — wenn du mehr **Patzer (??)** als **Best (!)**-Züge siehst, weißt du genau, worauf du dich konzentrieren solltest.

Für eine tiefere Erklärung des Genauigkeits-Metriks selbst siehe unsere Anleitung zu [Schach-Genauigkeits-Scores erklärt](/blog/chess-accuracy-score-explained).

---

## Häufige Missverständnisse über Centipawn-Verlust

Lass uns die Missverständnisse ausräumen, die am meisten Verwirrung stiften.

### Mythos 1: „Niedriger Centipawn-Verlust bedeutet, ich habe perfekt gespielt"

**Realität:** Ein niedriger Centipawn-Verlust bedeutet, dass deine Züge *nah* an der besten Wahl der Engine waren — aber nur innerhalb der Tiefe, die die Engine durchsucht hat. Stockfish bei Tiefe 20 könnte einem Zug eine 0,00-Bewertung geben, und bei Tiefe 40 könnte derselbe Zug -0,40 sein. Zusätzlich erfasst der Centipawn-Verlust nicht die Schwierigkeit, Züge zu finden: 5 Centipawns Verlust in einer erzwungenen taktischen Sequenz ist weniger beeindruckend als 5 Centipawns Verlust in einem ruhigen positionellen Manöver-Spiel.

### Mythos 2: „Ein -1,00-Fehler ist immer genauso schlimm wie ein anderer -1,00-Fehler"

**Realität:** Derselbe Centipawn-Wert kann sehr verschiedene Dinge bedeuten, je nach Stellung. 100 Centipawns in einer ausgeglichenen Stellung zu verlieren bedeutet, du gingst von ausgeglichen zu klar schlechter — das ist ein wirklicher Patzer. 100 Centipawns aus einer Stellung zu verlieren, in der du bereits 300 Centipawns im Rückstand warst (eine Figur verloren), ist fast bedeutungslos — du gingst von verlierend zu verlierend.

Deshalb berichten Schach-Engines die **Bewertung vor und nach** deinem Zug, nicht nur den Delta. Eine -5,00-Stellung, in der du einen -5,20-Zug spielst: der Centipawn-Verlust beträgt nur 20, aber du bist trotzdem absolut verloren.

### Mythos 3: „Du solltest versuchen, 0 Centipawn-Verlust in jedem Spiel zu erreichen"

**Realität:** Selbst Magnus Carlsen durchschnittet 15-25 ACPL in klassischen Spielen. Menschen spielen nicht wie Engines — und sie sollten es auch nicht versuchen. Das Ziel ist nicht Perfektion (die es im menschlichen Kontext nicht gibt); das Ziel ist die **Reduzierung deiner größten Fehler**. Ein Spiel mit 38 soliden Zügen und einem 200-Centipawn-Patzer ist ein Spiel, das du analysieren solltest; ein Spiel mit 40 Zügen à 45 Centipawns Verlust ist ein Spiel, in dem du durchgehend auf deinem Niveau gespielt hast.

### Mythos 4: „Centipawn-Verlust ist über verschiedene Zeitkontrollen hinweg vergleichbar"

**Realität:** Wie wir in unserer [ACPL-nach-Bewertungsstufe-Anleitung](/blog/average-centipawn-loss-by-rating) behandeln, steigt dein Centipawn-Verlust dramatisch an, wenn die Uhr abläuft. Ein Spieler, der im Klassischen 40 ACPL durchschnittet, könnte im Blitz 70 und im Bullet 110 haben. Vergleiche immer innerhalb derselben Zeitkontrolle.

### Mythos 5: „Alle Engines geben denselben Centipawn-Verlust"

**Realität:** Verschiedene Engines und sogar verschiedene Engine-Einstellungen produzieren verschiedene Centipawn-Verlust-Zahlen für dasselbe Spiel. Stockfish 18 bei Tiefe 22 wird andere Bewertungen melden als Stockfish 16 bei Tiefe 18. Lichess' Bewertungen tendieren dazu, vergeblicher zu sein als die von Chess.com oder FireChess wegen Tiefenunterschieden.

<chess-position fen="r1bqk2r/pppp1ppp/2n5/4P3/2B5/5N2/PPP2PPP/RNBQK2R b KQkq - 0 5" caption="Weiß steht einen sauberen Bauern dank des e5-Bauern vorn, mit starkem Zentrum und entwickelten Figuren. Der Centipawn-Vorteil beträgt hier etwa +100-120 cp. Schwarzes Aufgabe ist es, weitere Verluste zu minimieren." analysis="true" badge="mistake" arrows="e4e5:green"></chess-position>

---

## Wie du Centipawn-Verlust in deiner Spielanalyse verwendest

Hier wird Theorie zur Praxis. Hier ist eine Schritt-für-Schritt-Arbeitsanleitung, um Centipawn-Verlust tatsächlich zur Verbesserung zu nutzen — mit den FireChess-Abzeichen als visuellem Leitfaden. Für eine vollständige Aufschlüsselung, wie Genauigkeit und ACPL auf jeder Bewertungsstufe aussehen, siehe unsere [Genauigkeits-Benchmarks-nach-Bewertungsstufe-Anleitung](/blog/chess-accuracy-by-rating-guide).

### Schritt 1: Lade dein Spiel auf FireChess hoch

Importiere Spiele von Lichess, Chess.com, oder füge ein PGN in [FireChess' Analysewerkzeug](/analyze) ein. FireChess analysiert jeden Zug und erstellt einen Bericht mit Centipawn-Verlust pro Zug, pro Phase und pro Eröffnung. Die Zusammenfassung zeigt sofort deine Abzeichen-Aufschlüsselung — Best, Theorie, Gut, Ungenauigkeit, Fehler, Patzer-Zählungen für beide Spieler.

### Schritt 2: Finde deine größten einzelnen Züge

Durchsuche die Zugliste nach **roten Patzer (??)**- und **orangenen Fehler (?)-**Abzeichen. Das sind deine Centipawn-Verlust-Hotspots. Die Top 3-5 Züge (deine größten Fehler) sind, worauf du deine Aufmerksamkeit richten solltest. **Verteile deine begrenzte Lernzeit nicht über jede 20-Centipawn-Ungenauigkeit — finde die 200-Centipawn-Patzer und behebe sie zuerst.**

### Schritt 3: Kategorisiere den Fehler

Für jeden großen Fehler frage:
- War es ein **taktischer Patzer** (Gabel, Fesselung, Spieß verpasst)?
- War es ein **positioneller Fehler** (falsches Feld, schlechter Tausch)?
- War es **Zeitnot** (Fahne gesehen, unter 30 Sekunden)?
- War es ein **Eröffnungsfehler** (falsche Antwort auf etwas Unbekanntes)?

Kategorisiere jeden. Nach 10 Spielen werden sich Muster zeigen. Wenn jeder große Fehler taktisch ist, sollte dein Taktiktraining Priorität haben. Wenn jeder große Fehler in der Eröffnung ist, brauchst du Eröffnungsvorbereitung. Wenn Zeitnot der Übeltäter ist, arbeite an Zeitmanagement.

### Schritt 4: Berechne deinen phasenweisen ACPL

Schau nicht nur auf den Gesamtdurchschnitt. Brich es herunter:

| Phase | Dein ACPL | Ziel-ACPL (Deine Bewertung) |
|-------|-----------|----------------------------|
| Eröffnung (1-15) | | |
| Mittelspiel (16-35) | | |
| Endspiel (36+) | | |

Die meisten Vereinsspieler finden, dass ihr Mittelspiel-ACPL das 1,5- bis 2-Fache ihres Eröffnungs-ACPL ist. Das sagt dir genau, wohin deine Trainingszeit fließen sollte. Wenn du 35 ACPL in Eröffnungen, aber 80 ACPL im Mittelspiel erzielst, brauchst du nicht mehr Eröffnungsstudium — du brauchst Mittelspiel-Mustererkennung.

### Schritt 5: Verfolge deinen ACPL über die Zeit

ACPL ist ein **Frühindikator** der Verbesserung. Deine Bewertung könnte wochenlang stagnieren, während dein ACPL langsam sinkt — und dann holt deine Bewertung auf. Verfolge deinen monatlichen ACPL-Durchschnitt statt deiner täglichen Bewertung, und du wirst Fortschritte sehen, bevor sich deine Bewertung bewegt. Beobachte, wie sich deine Abzeichen-Verteilung verschiebt: weniger **??** und **?**, mehr **!** und **!!**.

| Monat | ACPL | Bewertung | Abzeichen-Trend | Anmerkungen |
|-------|------|-----------|-----------------|-------------|
| Monat 1 | 72 | 1420 | 5??, 8? pro Spiel | Ausgangswert |
| Monat 2 | 65 | 1450 | 3??, 6? pro Spiel | Taktikarbeit zahlt sich aus |
| Monat 3 | 58 | 1510 | 1??, 4? pro Spiel | Klare Verbesserung |
| Monat 4 | 55 | 1530 | 0??, 3? pro Spiel | Plateau — Zeit für positionsbezogenes Studium |

---

## Plattformunterschiede: Lichess vs. Chess.com vs. FireChess

Wenn du dasselbe Spiel auf mehreren Plattformen analysiert hast, hast du wahrscheinlich verschiedene ACPL-Zahlen bemerkt. Das ist kein Bug — es ist ein Merkmal verschiedener Engine-Konfigurationen.

| Plattform | Engine | Typische Tiefe | ACPL-Tendenz | Zugabzeichen? |
|-----------|--------|----------------|--------------|---------------|
| Lichess | Stockfish (verschiedene) | 22 Halbzüge | ~10% niedriger (vergeblicher) | Ja (Ungenauigkeit/Fehler/Patzer) |
| Chess.com | Cloud Stockfish | 25-30 Halbzüge | Basislinie | Ja (Genial/Best/Gut/Theorie/Ungenauigkeit/Fehler/Patzer) |
| FireChess | Stockfish 18 | Ausgewogene Tiefe | Vergleichbar mit Chess.com | Ja — vollständiges 7-Abzeichen-System (!!, !, ✓, DB, ?!, ?, ??) |

**Warum der Unterschied:** Eine schwächere Engine oder niedrigere Tiefe sieht weniger taktische Möglichkeiten, deshalb betrachtet sie mehr „gut genug"-Züge als gleichwertig mit dem besten Zug. Dein Centipawn-Verlust erscheint niedriger, weil die Engine dich nicht so hart bestraft, weil du eine tiefe 25-Züge-Taktik verpasst hast.

**Was das für dich bedeutet:** Benchmarke immer gegen deine eigenen historischen Daten auf *derselben Plattform*. Vergleiche nicht deinen Lichess-ACPL von 55 mit dem Chess.com-ACPL von 55 eines Freundes — sie werden unterschiedlich gemessen. Verwende FireChess konsistent für deine Verbesserungsverfolgung und lerne, das Abzeichen-System zu lesen — es ist das granularste aller Plattformen. Für einen tieferen Vergleich der Analyseplattformen siehe unsere [Lichess vs. Chess.com Verbesserungsanleitung](/blog/lichess-vs-chess-com-improvement).

---

## FAQ: Schnelle Antworten auf häufige Fragen

### Q: Was ist ein guter durchschnittlicher Centipawn-Verlust?

Es hängt完全 von deiner Bewertung und Zeitkontrolle ab. Für einen 1500-bewerteten Spieler im Schnellschach ist alles unter 60 gut. Für einen 2000-bewerteten Spieler ist unter 45 erwartet. Siehe unsere [ACPL-nach-Bewertungsstufe-Tabelle](/blog/average-centipawn-loss-by-rating) für detaillierte Benchmarks.

### Q: Ist Centipawn-Verlust dasselbe wie Genauigkeit?

Nein. Der Genauigkeitsprozent ist ein normalisierter Score (0-100%) basierend auf Centipawn-Verlust. Centipawn-Verlust ist das rohe mathematische Maß. Sie korrelieren stark, sind aber nicht identisch. Die FireChess-Zugabzeichen liegen dazwischen — Abzeichen übersetzen Centipawn-Verlust in ein menschenlesbares Label. Für eine vollständige Aufschlüsselung, wie Genauigkeit funktioniert, siehe unsere [Schach-Genauigkeits-Score-Anleitung](/blog/chess-accuracy-score-explained).

### Q: Was bedeutet durchschnittlicher Centipawn-Verlust?

Durchschnittlicher Centipawn-Verlust (ACPL) ist die mittlere Differenz pro Zug zwischen dem gespielten Zug und dem besten Zug der Engine, gemessen in Centipawns (1/100 eines Bauern). Wenn dein ACPL 60 beträgt, bedeutet das, dass im Durchschnitt jeder deiner Züge 60 Centipawns — etwa 0,6 Bauern — schlechter war als die Top-Wahl der Engine. Niedriger ist besser: Großmeister durchschnitts 15-25 ACPL, während Vereinsspieler typischerweise 50-80 erzielen. FireChess übersetzt den Centipawn-Verlust jedes Zuges in ein farbiges Abzeichen (Best, Ungenauigkeit, Patzer usw.), damit du auf einen Blick sehen kannst, wo du am meisten verloren hast. Siehe unsere [ACPL-nach-Bewertungsstufe-Anleitung](/blog/average-centipawn-loss-by-rating) für Benchmarks auf jeder Stufe.

### Q: Was ist ein Centipawn-Verlust von 100?

Ein Centipawn-Verlust von 100 bedeutet, dass du das Äquivalent eines ganzen Bauern Vorteil in einem einzelnen Zug aufgegeben hast. Das ist ein wirklicher Patzer in den meisten Stellungen. FireChess markiert dies mit einem roten **?? Patzer**-Abzeichen.

### Q: Was bedeuten die Zugabzeichen auf FireChess?

Jedes Abzeichen entspricht einem Centipawn-Verlust-Bereich:
- **!! Genial** (0-10 cp, Opfer, das funktioniert) — türkises Abzeichen
- **! Best** (0-10 cp, entspricht der Top-Wahl der Engine) — grünes Abzeichen
- **✓ Gut** (10-25 cp, solide, aber nicht der absolute Beste) — hellgrünes Abzeichen
- **DB Theorie** (0-12 cp, erste 15 Züge, bekannte Theorie) — graues Abzeichen
- **?! Ungenauigkeit** (25-75 cp, kleiner Ausrutscher) — gelbes Abzeichen
- **? Fehler** (75-200 cp, wirklicher Fehltritt) — orangenes Abzeichen
- **?? Patzer** (200+ cp, schwerer Fehler) — rotes Abzeichen

### Q: Warum variiert mein Centipawn-Verlust so stark zwischen Spielen?

Das ist normal. Ein Spiel, in dem du einem scharfen Sizilianer gegenüberstehst und komplexe Taktiken berechnen musst, produziert natürlich einen höheren Centipawn-Verlust als ein langsames Damengambit-Spiel, in dem du 20 Züge bekannte Theorie spielst. Durchschnitts über 10+ Spiele, bevor du Schlussfolgerungen ziehst.

### Q: Wie viele Spiele brauche ich für eine zuverlässige ACPL-Aussage?

Mindestens 10 Spiele in derselben Zeitkontrolle. Ein einzelnes Spiel hat zu viel Varianz durch die spezifische Eröffnung, den Gegner und die Umstände. Zehn Spiele glätten das Rauschen. Die Abzeichen-Zählungen stabilisieren sich ebenfalls über 10+ Spiele.

### Q: Kann Centipawn-Verlust negativ sein?

Nein. Centipawn-Verlust ist als absolute Differenz zwischen der Bewertung deines Zuges und der Bewertung des besten Zuges definiert. Es ist immer eine nicht-negative Zahl. Einige Plattformen zeigen „0" für den besten Zug, was bedeutet, dass null Centipawns verloren wurden.

### Q: Ist Centipawn-Verlust in komplett gewonnenen Stellungen wichtig?

Er ist weniger wichtig. Wenn du eine Dame und einen Turm vorn hast, ist eine 100-Centipawn-Ungenauigkeit irrelevant. Konzentriere deine Analyse auf kritische Stellungen — wo das Spiel ausgeglichen war und ein Fehler das Ergebnis verändert hat. Unsere [ACPL-nach-Bewertungsstufe-Anleitung](/blog/average-centipawn-loss-by-rating) zeigt, welche Centipawn-Verlust-Bereiche tatsächlich deine Gewinnrate auf jeder Stufe beeinflussen.

### Q: Ist Centipawn-Verlust nützlich für Eröffnungen?

Teilweise. Eröffnungs-Centipawn-Verlust tendiert dazu, sehr niedrig zu sein, weil es etablierte Theorie gibt. Ein hoher Centipawn-Verlust in der Eröffnung bedeutet meistens, dass du die Theorie verlassen und einen Fehler gemacht hast. Nützlicher ist es, deinen Centipawn-Verlust *nach dem Verlassen der Theorie* zu verfolgen — das ist ein Maß dafür, wie gut du die resultierenden Mittelspielstellungen verstehst. In FireChess zeigen Eröffnungszüge typischerweise **DB (Theorie)**-Abzeichen bis Zug 15 oder bis eine frühe Abweichung occurs. Wenn dein Eröffnungs-Centipawn-Verlust durchgehend hoch ist, verwende den [Eröffnungsschwächen-Scanner](/blog/how-to-find-opening-weaknesses), um herauszufinden, welche Varianten dich kosten.

### Q: Wie lese ich die Abzeichen-Zusammenfassung oben in meinem FireChess-Bericht?

Die Zusammenfassung zeigt dir: Genauigkeitsprozent, Abzeichen-Zählungen nach Typ und ACPL. Zum Beispiel: „Weiß 78,7% Genauigkeit · Best 11 · Theorie 8 · Gut 3 · Patzer 2 · ACPL 43,2". Das bedeutet, Weiß spielte 11 perfekte Züge, 8 Theoriezüge, 3 gute Züge und 2 Patzer. Der durchschnittliche Verlust betrug 43,2 Centipawns pro Zug. Mehr Best (!)-Züge als Patzer (??) ist immer ein gutes Zeichen. Lade ein Spiel auf [FireChess unter /analyze](/analyze) hoch, um deine eigene Abzeichen-Aufschlüsselung zu sehen.

### Q: Ist das Genial (!!) -Abzeichen dasselbe wie ein Best (!) -Zug?

Nein. Ein Genialer Zug (!!) ist ein spezieller Typ von Bestem Zug — es ist ein Figurenopfer, bei dem die Engine bestätigt, dass das Opfer tatsächlich funktioniert (die Bewertung verbessert sich nach dem Opfer). Nicht jeder beste Zug ist genial. In der Praxis sind Geniale Züge selten — du siehst vielleicht 1-2 pro 20 Spiele. Ein Best (!) -Zug bedeutet einfach, dass du die Top-Wahl der Engine getroffen hast.

---

## Schnellreferenz-Tabelle: Centipawn-Verlust nach Auswirkung

| Centipawn-Verlust | Klassifizierung | FireChess-Abzeichen | Typische Ursache | Auswirkung auf das Spiel |
|-------------------|-----------------|---------------------|------------------|--------------------------|
| 0-15 | Ausgezeichnet | !! oder ! | Bester oder fast bester Zug | Unbedeutend |
| 15-25 | Gut | ✓ | Leicht suboptimal, aber solide | Winziger Vorteil verloren |
| 25-75 | Ungenauigkeit | ?! | Geringe positionelle Ungenauigkeit | Kleiner Vorteil verloren |
| 75-200 | Fehler | ? | Taktischer Fehltritt oder positioneller Fehler | Spürbarer Vorteil verloren |
| 200-300 | Patzer | ?? | Figur hängen lassen, Taktik verpasst | Oft partieentscheidend |
| 300+ | Schwerer Patzer | ?? | Figur verloren, tödliches positionelles Zugeständnis | Verliert meistens |
| 900+ | Katastrophe | ?? | Dame verloren, erzwungenes Matt verpasst | Spiel vorbei |

---

## Fazit: Von der Zahl zur Verbesserung

Centipawn-Verlust ist im Kern ein Werkzeug — kein Urteil. Eine Zahl wie „72 ACPL" sagt dir allein nichts. Aber 72 ACPL *mit Tendenz Richtung 60* sagt dir, dass du dich verbesserst. Ein 150-Centipawn-Patzer *im selben Muster über drei Spiele* sagt dir genau, was du studieren solltest. Ein ACPL-Anstieg *im Mittelspiel, aber nicht in der Eröffnung* sagt dir, wo du deine Trainizeit investieren solltest.

Das FireChess-Abzeichen-System ist die visuelle Übersetzung von all dem. Wenn du ein rotes **??** neben Zug 23 siehst, weißt du sofort: dieser Zug hat dich gekostet. Wenn du ein türkises **!!** neben Zug 31 siehst, weißt du: du hast etwas Besonderes gefunden. Die Centipawn-Verlust-Zahlen darunter sind die präzise Buchführung der Engine — aber die Abzeichen sind es, die es intuitiv machen.

Die Spieler, die sich am schnellsten verbessern, sind nicht die mit dem niedrigsten Centipawn-Verlust. Es sind die, die Centipawn-Verlust-Daten **nutzen**, um ihre spezifischen Schwächen zu finden und gezielt anzugehen. Sie schauen nach jedem Spiel auf die Abzeichen-Aufschlüsselung und fragen: „Woher kommen meine Patzer?"

Lade dein nächstes Spiel auf FireChess hoch, überfliege die Centipawn-Verlust-Aufschlüsselung nach Phase und finde das eine Muster, das dich die meisten Abzeichen kostet. Behebe diese eine Sache. Sieh, wie dein ACPL sinkt. Sieh, wie deine Bewertung folgt.

*Bereit, deine Spiele zu analysieren? Nutze das [FireChess-Analysewerkzeug](/analyze), um eine kostenlose Centipawn-Verlust-Aufschlüsselung mit phasenweiser Berichterstattung zu erhalten — komplett mit Zugabzeichen für jeden Zug.*
