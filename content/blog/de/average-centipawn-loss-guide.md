---
title: "Durchschnittlicher Centipawn-Verlust (ACPL): Was es ist und wie du deinen senkst"
description: "Lerne, was durchschnittlicher Centipawn-Verlust im Schach bedeutet, wie ACPL berechnet wird, wie guter ACPL auf jeder Wertungsstufe aussieht und bewährte Wege, ihn zu senken."
date: "2026-08-14"
author: "FireChess Team"
tags: ["centipawn loss", "chess improvement", "game analysis", "ACPL", "move quality"]
canonical: https://firechess.com/de/blog/average-centipawn-loss-guide
---

Du hast gerade eine 40-Zug-Partie gespielt und der Motor sagt, dein ACPL war 67. Ist das gut? Schlecht? Durchschnittlich für deine Wertung? Die meisten Vereinsspieler sehen Centipawn-Verlust-Zahlen auf ihrem Analysebildschirm und haben keine Ahnung, was sie bedeuten — sie wissen nur, dass niedriger besser ist. Aber ACPL zu verstehen ist einer der schnellsten Wege, genau zu diagnostizieren, wo deine Partien schiefgehen, weil er jeden einzelnen Zug in eine messbare Qualitätsnote aufteilt.

Durchschnittlicher Centipawn-Verlust (ACPL) ist die einzelste beste Kennzahl dafür, wie gut du im Verhältnis zur Top-Wahl des Motors bei jedem Zug gespielt hast. Es ist keine perfekte Kennzahl — keine einzelne Zahl erfasst die ganze Geschichte einer Schachpartie — aber es ist die eine Zahl, die dir sagt, ob deine Verluste von einem katastrophalen Patzer oder einem Muster kleiner Ungenauigkeiten herrühren. Diese Unterscheidung verändert, wie du trainieren solltest.

Lade deine letzten Partien auf [FireChess' Scanner unter /analyze](/analyze) hoch und du wirst deinen ACPL aufgeschlüsselt nach Zugqualität sehen: wie viele **Beste (!)**-Züge du gemacht hast, wie viele **Ungenauigkeiten (?!)** du angesammelt hast und wo die **Patzer (??)** gelandet sind. Diese Aufschlüsselung ist, wo die echte Erkenntnis liegt.

## Was ist Centipawn-Verlust?

Ein Centipawn ist ein Hundertstel eines Bauern — die Standardeinheit, die Motoren zur Bewertung von Schachstellungen nutzen. Wenn der beste Zug des Motors dir eine Bewertung von +1.50 gibt (bedeutet, du bist um eineinhalb Bauern voraus), und du spielst einen Zug, der stattdessen +0.80 ergibt, ist dein Centipawn-Verlust bei diesem Zug 70 Centipawns. Du hast 0.70 Bauern Vorteil aufgegeben, indem du nicht den Top-Zug des Motors gespielt hast.

Durchschnittlicher Centipawn-Verlust (ACPL) nimmt diesen pro-Zug-Verlust und bildet den Durchschnitt über alle deine Züge in einer Partie. Wenn du 40 Züge mit einem gesamten Centipawn-Verlust von 2.800 gespielt hast, ist dein ACPL 70.

Hier die wichtigste Erkenntnis, die die meisten Spieler verpassen: **ACPL geht nicht darum, bei jedem Zug den besten Zug zu spielen.** Es geht darum, die großen Fehler zu vermeiden. Eine Partie, in der du 35 Züge „Gute" Qualität spielst und einen 300cp-Patzer machst, hat einen höheren ACPL als eine Partie mit 40 „Ungenauigkeits"-Zügen ohne Patzer. Die patzer-dominierte Partie *fühlt* sich schlechter an, weil sie es ist — ein großer Fehler kostet mehr als viele kleine.

### Die Stellung, die es veranschaulicht

Nimm diese Stellung aus einer Spanischen Partie:

<chess-position fen="r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 b - - 0 9" caption="Schwarz am Zug in der Spanischen Partie. Die Top-Wahl des Motors ist 9...Sb8 (die Breyer-Variante, Umgruppierung des Springers nach d7). Stattdessen 9...Sa5 zu spielen kostet etwa 25-30 Centipawns — ein Gut-zu-Ungenauigkeits-Grenzzug." orientation="black"></chess-position>

Schwarz hat hier mehrere vernünftige Züge. Der Motor bevorzugt **9...Sb8** — das berühmte Breyer-Manöver, bei dem der Springer sich zurückzieht, um über d7 auf bessere Felder umzugruppieren. Es sieht passiv aus, ist aber seit Jahrzehnten eine Weltmeisterschaftswaffe. Der Zug **9...Sa5** sieht aktiver aus (greift den Läufer an), ist aber etwas weniger präzise, weil er Schwarz' Kontrolle über c5 schwächt und die Koordination nicht verbessert.

Der Unterschied? Etwa 25-30 Centipawns. Ein Zug tötet dich nicht. Aber wenn du fünf solche Züge in einer Partie machst — jeder gibt 25cp auf statt den besten Zug zu finden — hast du 125 Centipawns gespendet. Das ist mehr als ein ganzer Bauer Vorteil, den du allein durch „nicht ganz richtige" Züge aufgegeben hast.

## Wie ACPL berechnet wird

Die Berechnung ist geradlinig:

1. Für jeden Zug bewertet der Motor die Stellung **vor** deinem Zug und die Stellung **nach** deinem Zug
2. Der Centipawn-Verlust = (Bewertung nach deinem Zug) − (Bewertung nach dem besten Zug des Motors)
3. ACPL = Summe aller pro-Zug Centipawn-Verluste ÷ Gesamtzüge

Einige wichtige Nuancen:

- **Bewertungen sind aus der Perspektive der ziehenden Seite.** Wenn Weiß einen Zug spielt, der die Bewertung von +2.00 auf +0.50 senkt, ist Weiß' Centipawn-Verlust 150cp.
- **Erzwungene Züge werden trotzdem gezählt** in den meisten Tools.
- **Tiefe zählt.** Ein Motor bei Tiefe 12 gibt andere Bewertungen als bei Tiefe 20. FireChess nutzt Stockfish bei Tiefe 16 für die Analyse.

### Was das FireChess-Abzeichen-System dir sagt

Wenn du eine Partie auf FireChess scannst, wird jeder Zug in eines von sieben Qualitätsbändern klassifiziert. Das Abzeichen-System ordnet sich direkt dem Centipawn-Verlust zu:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="720" height="560" viewBox="0 0 720 560" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cpBg" x1="0" y1="0" x2="720" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
  </defs>
  <rect width="720" height="560" rx="18" fill="url(#cpBg)"/>
  <rect x="1" y="1" width="718" height="558" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="360" y="40" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700" letter-spacing="0.4" font-family="system-ui">FireChess Zugabzeichen — Centipawn-Verlust-Zuordnung</text>
  <text x="360" y="62" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Jedes Abzeichen entspricht einem Centipawn-Verlust-Bereich. Niedriger = besser. Dein ACPL bildet den Durchschnitt über jeden Zug.</text>
  
  <!-- Brilliant -->
  <g transform="translate(30, 90)">
    <rect width="660" height="54" rx="10" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#22d3ee" font-size="18" font-weight="800" font-family="system-ui">!!</text>
    <text x="54" y="34" fill="#22d3ee" font-size="15" font-weight="700" font-family="system-ui">Genial</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp Verlust · Außergewöhnliches Opfer, das die Bewertung zu deinen Gunsten kippt</text>
  </g>
  
  <!-- Best -->
  <g transform="translate(30, 150)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#34d399" font-size="18" font-weight="800" font-family="system-ui">!</text>
    <text x="54" y="34" fill="#34d399" font-size="15" font-weight="700" font-family="system-ui">Bester</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp Verlust · Du hast mit der Top-Wahl des Motors übereingestimmt</text>
  </g>
  
  <!-- Good -->
  <g transform="translate(30, 210)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.05" stroke="#10b981" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#6ee7b7" font-size="18" font-weight="800" font-family="system-ui">✓</text>
    <text x="54" y="34" fill="#6ee7b7" font-size="15" font-weight="700" font-family="system-ui">Gut</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">10-25 cp Verlust · Solides Spiel, leicht suboptimal aber innerhalb der Logik der Stellung</text>
  </g>
  
  <!-- Book -->
  <g transform="translate(30, 270)">
    <rect width="660" height="54" rx="10" fill="#94a3b8" fill-opacity="0.06" stroke="#94a3b8" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#cbd5e1" font-size="18" font-weight="800" font-family="system-ui">DB</text>
    <text x="54" y="34" fill="#cbd5e1" font-size="15" font-weight="700" font-family="system-ui">Theorie</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-12 cp Verlust · Züge 1-15 nach bekannter Eröffnungstheorie</text>
  </g>
  
  <!-- Inaccuracy -->
  <g transform="translate(30, 330)">
    <rect width="660" height="54" rx="10" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fbbf24" font-size="18" font-weight="800" font-family="system-ui">?!</text>
    <text x="54" y="34" fill="#fbbf24" font-size="15" font-weight="700" font-family="system-ui">Ungenauigkeit</text>
    <text x="200" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">25-75 cp Verlust · Ein kleiner Ausrutscher — kostete etwa einen halben Bauern</text>
  </g>
  
  <!-- Mistake -->
  <g transform="translate(30, 390)">
    <rect width="660" height="54" rx="10" fill="#f97316" fill-opacity="0.08" stroke="#f97316" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fb923c" font-size="18" font-weight="800" font-family="system-ui">?</text>
    <text x="54" y="34" fill="#fb923c" font-size="15" font-weight="700" font-family="system-ui">Fehler</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">75-200 cp Verlust · Ein echter Verlust, senkte etwa 1-2 Bauern</text>
  </g>
  
  <!-- Blunder -->
  <g transform="translate(30, 450)">
    <rect width="660" height="54" rx="10" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#f87171" font-size="18" font-weight="800" font-family="system-ui">??</text>
    <text x="54" y="34" fill="#f87171" font-size="15" font-weight="700" font-family="system-ui">Patzer</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">200+ cp Verlust · Material hängen lassen, gewinnende Taktik verfehlt oder Position fatal geschwächt</text>
  </g>
</svg>
</div>

Das Zusammenfassungspanel oben in einem FireChess-Scan zeigt etwas wie:

> **Weiß 78.7% Genauigkeit · Bester 11 · Theorie 8 · Gut 3 · Patzer 2 · ACPL 43.2**

Diese eine Zeile sagt dir mehr über die Partie als jede andere Kennzahl. Die ACPL-Zahl ist der Durchschnitt; die Abzeichenverteilung sagt dir, *wo* die Probleme sind.

## Was ist ein guter ACPL nach Wertung?

Das ist die Frage, die jeder stellt, und die ehrliche Antwort ist: **Es hängt von der Zeitkontrolle, dem Stellungstyp und der Motortiefe ab.** Aber aus Tausenden von FireChess-Scans über alle Wertungsstufen sind hier die typischen Bereiche:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="380" viewBox="0 0 680 380" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acplBg" x1="0" y1="0" x2="680" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#0d1225"/>
    </linearGradient>
  </defs>
  <rect width="680" height="380" rx="16" fill="url(#acplBg)"/>
  <rect x="1" y="1" width="678" height="378" rx="15" stroke="#1e293b" stroke-opacity="0.5"/>
  <text x="340" y="36" text-anchor="middle" fill="#f1f5f9" font-size="18" font-weight="700" font-family="system-ui">ACPL nach Wertungsstufe (Typische Bereiche)</text>
  <text x="340" y="56" text-anchor="middle" fill="#64748b" font-size="12" font-family="system-ui">Basierend auf der Analyse von Vereinsspieler-Partien · Niedriger ist besser</text>
  
  <!-- Grid lines -->
  <line x1="180" y1="80" x2="180" y2="340" stroke="#1e293b" stroke-width="1"/>
  <line x1="310" y1="80" x2="310" y2="340" stroke="#1e293b" stroke-width="1"/>
  <line x1="440" y1="80" x2="440" y2="340" stroke="#1e293b" stroke-width="1"/>
  <line x1="570" y1="80" x2="570" y2="340" stroke="#1e293b" stroke-width="1"/>
  
  <!-- Axis labels -->
  <text x="180" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">50</text>
  <text x="310" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">100</text>
  <text x="440" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">150</text>
  <text x="570" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">200</text>
  
  <!-- Rating rows -->
  <text x="50" y="100" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">2200+</text>
  <rect x="140" y="86" width="130" height="22" rx="4" fill="#10b981" fill-opacity="0.7"/>
  <text x="205" y="102" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">15-30 ACPL</text>
  
  <text x="50" y="145" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">1800-2200</text>
  <rect x="140" y="131" width="200" height="22" rx="4" fill="#10b981" fill-opacity="0.5"/>
  <text x="240" y="147" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">30-50 ACPL</text>
  
  <text x="50" y="190" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">1400-1800</text>
  <rect x="140" y="176" width="260" height="22" rx="4" fill="#f59e0b" fill-opacity="0.6"/>
  <text x="270" y="192" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">50-80 ACPL</text>
  
  <text x="50" y="235" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">1000-1400</text>
  <rect x="140" y="221" width="340" height="22" rx="4" fill="#f97316" fill-opacity="0.5"/>
  <text x="310" y="237" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">80-130 ACPL</text>
  
  <text x="50" y="280" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">Unter 1000</text>
  <rect x="140" y="266" width="420" height="22" rx="4" fill="#ef4444" fill-opacity="0.45"/>
  <text x="350" y="282" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">130-200+ ACPL</text>
  
  <text x="340" y="325" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">Bereiche gehen von 15+10 oder längerer Zeitkontrolle aus · Blitz/Schnellschach-Partien liegen 10-20% höher</text>
</svg>
</div>

Einige Dinge fallen aus den Daten auf:

**Das 1400-1800-Band ist, wo die meisten Vereinsspieler leben**, und ein ACPL von 50-80 ist völlig normal. Du bist nicht „schlecht" bei 65 ACPL — du bist Durchschnitt für deine Wertung.

**Blitz inflationiert alles.** Ein 1600-Spieler mag 45 ACPL in einer 15+10-Partie haben, aber 80 ACPL im 3+0-Blitz.

**Ein Patzer zerstört den Durchschnitt.** Ein 1500-Spieler, der 38 Züge bei 15cp Durchschnitt spielt (ausgezeichnet für diese Wertung), aber einen 400cp-Patzer macht, endet mit ~25 ACPL für diese Partie. Der Patzer allein hat 10 Punkte zum Durchschnitt hinzugefügt.

## Warum dein ACPL höher ist, als er sein sollte

### Muster 1: Die Eröffnungswissenslücke

Der häufigste ACPL-Spike passiert in den ersten 15 Zügen. Spieler, die ihre Eröffnung nicht gut genug kennen, machen „vernünftig aussehende" Züge, die ihre Stellung subtil um 30-50 Centipawns pro Zug schwächen.

<chess-position fen="r1bq1rk1/pppnbppp/5n2/3p2B1/3P4/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8" caption="Weiß am Zug im Damengambit abgelehnt. Nach dem natürlichen 8.Ld3 hat Schwarz soliden Ausgleich. Aber wenn Weiß stattdessen 8.Se5?! spielt, bekommt Schwarz leichte Partie mit ...dxc4 und ...Sd5. Prüfe deinen Eröffnungs-ACPL in FireChess' „Eröffnungslecks"-Bereich." orientation="white"></chess-position>

### Muster 2: Die Mittelspiel-Rechenverfehlung

Die größten ACPL-Spikes (200+ Centipawns bei einem einzelnen Zug) passieren, wenn du einen taktischen Schlag verpasst — entweder den deines Gegners oder deinen eigenen.

### Muster 3: Das Endself-Konversionsversagen

Der dritte ACPL-Killer ist weniger dramatisch, aber ebenso schädlich: Das Endself schlecht spielen. Eine Stellung, die +2.00 (gewinnend) steht, blutet langsam auf +0.50 (remis), weil du die Technik nicht kennst. Jeder Zug verliert 15-30 Centipawns — nie ein Patzer, nie ein Fehler, nur ein stetiger Strom von Ungenauigkeiten.

<chess-position fen="8/5kpp/8/8/8/4R3/r4PPP/6K1 w - - 0 1" caption="Weiß am Zug in einem Turmendspiel. Der aktive 1.Ta3 ist viel stärker als der passive 1.Tf3+?! — Turm hinter den Bauer stellen oder Turmtausch ist Schlüsseltechnik. Der Endself-ACPL ist, wo die meisten Vereinsspieler die meisten Punkte im Vergleich zu Meistern verlieren." orientation="white"></chess-position>

## Wie du deinen ACPL senkst: Ein praktischer Guide

### Fixiere zuerst deine Patzer

Die Lösung: Löse taktische Aufgaben, die sich auf die Muster konzentrieren, die du tatsächlich verpasst. Für die meisten Spieler unter 1600 senkt die Eliminierung von Patzern allein den ACPL um 15-25 Punkte.

### Lerne deine Eröffnungen tiefer (nicht breiter)

Studiere die spezifischen Varianten, in denen du Ungenauigkeiten machst. Tiefe in deinen Hauptvarianten, nicht Breite über viele Eröffnungen, senkt den Eröffnungs-ACPL.

### Verbessere deine Endselftechnik

Lerne diese Endself-Grundlagen in dieser Reihenfolge:
1. **König-und-Bauer-Endspiele** — Opposition, Schlüsselfelder, die Regel des Quadrats
2. **Turmendspiele** — Lucena-Stellung, Philidor-Stellung, Turmaktivitätsprinzipien
3. **Läufer gegen Springer-Endspiele** — wann jede Figur besser ist

Jeder dieser Punkte dauert etwa 5-10 Stunden zum ordentlichen Studieren. Zusammen können sie den Endself-ACPL von 90 auf 50 senken — eine 40-Punkt-Verbesserung, die sich in 10-15 Punkten Gesamt-ACPL und einem signifikanten Wertungssprung niederschlägt.

### Nutze eine strukturierte Analyse-Routine

1. **Identifiziere deine drei höchsten ACPL-Züge.** Was hast du gespielt, und warum?
2. **Finde die Grundursache.** War es ein Rechenverfehlung? Eine Wissenslücke? Eine Zeitnot-Entscheidung?
3. **Studiere das Muster.** Wenn es ein Rechenverfehlung war, löse 5 ähnliche Taktiken.
4. **Verfolge deinen ACPL über die Zeit.** Konzentriere dich nicht auf einzelne Partien — schau auf deinen 30-Partien-Rollendurchschnitt.

## Der Unterschied zwischen ACPL und Genauigkeit

| Kennzahl | Was sie misst | Skala | Anwendungsfall |
|--------|-----------------|-------|----------|
| ACPL | Durchschnittlicher Centipawn-Verlust pro Zug | Niedriger ist besser (0-200+) | Spezifische Schwächen diagnostizieren |
| Genauigkeit | Wie nah deine Züge mit der Top-Wahl des Motors übereinstimmen | 0-100% | Gesamtqualität der Partie |

Genauigkeit ist ein Prozentsatz — sie sagt dir, wie oft du den „richtigen" Zug gespielt hast. ACPL sagt dir, wie *falsch* deine falschen Züge waren. Eine Partie mit 85% Genauigkeit und 60 ACPL hat ein paar große Fehler. Eine Partie mit 85% Genauigkeit und 35 ACPL hat viele kleine.

## Häufige ACPL-Mythen entlarvt

**„Niedrigerer ACPL bedeutet immer besseres Spiel."** Nicht unbedingt. In einer völlig remisen Stellung könnten beide Spieler 15 ACPL haben — sie spielen genau, aber es passiert nichts.

**„Ich muss wie ein Motor spielen, um niedrigen ACPL zu bekommen."** Nein. Du musst Patzer vermeiden und deine Eröffnungen kennen. Ein 1600-Spieler mit gutem Eröffnungswissen und solider Taktik kann 40-50 ACPL erreichen, ohne einen einzigen „genialen" Zug zu spielen.

**„ACPL berücksichtigt nicht die Stellungskomplexität."** Das ist teilweise wahr — eine ruhige Stellung ist leichter genau zu spielen als eine scharfe. Aber über eine große Stichprobe von Partien gleicht sich die Komplexität aus.

## Deinen ACPL über die Zeit verfolgen

Eine einzelne Partie sagt fast nichts. Was zählt, ist der Trend.

Scanne mindestens 20 Partien — idealerweise aus derselben Zeitkontrolle — und schau dir an:
- **Deinen durchschnittlichen ACPL über alle Partien.** Das ist deine Basis.
- **Die Verteeilung.** Hast du ein paar katastrophale Partien, die den Durchschnitt hochziehen?
- **Die Abzeichen-Aufschlüsselung.** Wie viele Patzer pro Partie? Wie viele Ungenauigkeiten?
- **Eröffnung vs. Mittelspiel vs. Endself-ACPL.** Wo verlierst du die meisten Punkte?

Der [FireChess-Scanner unter /analyze](/analyze) berechnet das alles automatisch. Lade deine PGN hoch, warte auf die Analyse, und du wirst genau sehen, wo sich dein Centipawn-Verlust konzentriert.

ACPL zu verbessern ist ein Langzeitprojekt. Die meisten Spieler sehen einen 5-10-Punkt-Rückgang über 3 Monate gezieltes Training, was sich in 100-200 Wertungspunkten niederschlägt. Es ist nicht dramatisch, aber es ist real — und anders als das Auswendiglernen von Eröffnungsvarianten ist die Verbesserung dauerhaft, weil sie auf Mustererkennung und Technik basiert, nicht auf Auswendiglernen.