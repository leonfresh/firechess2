---
title: "Wie man Schach-Motoranalysen liest: Ein kompletter Guide für Vereinsspieler"
description: "Lerne, Schach-Motoranalysen zu lesen — Bewertungswerte, Tiefe, Hauptvarianten und Centipawn-Verlust. Praktische Tipps, um Stockfish für echte Verbesserung zu nutzen."
date: "2026-07-27"
author: "FireChess Team"
tags: ["analysis", "improvement", "engine", "stockfish", "fundamentals"]
canonical: https://firechess.com/de/blog/how-to-read-chess-engine-analysis
---

Du hast gerade eine Partie auf FireChess unter [/analyze](/analyze) hochgeladen. Die Motorvarianten leuchten auf. Eine Zahl blinkt: **+1.8**. Ein Pfeil zeigt von e2 nach e4. Die Zugliste zeigt **„Tiefe 22"** neben einer Zugsequenz, die du nicht verstehst.

Du starrst darauf und denkst: *„OK… aber was sagt mir das eigentlich über meine Partie?"*

Du bist nicht allein. Die meisten Vereinsspieler zwischen 1000 und 1800 behandeln die Motoranalyse wie eine Blackbox — sie prüfen die Endbewertung, werfen einen Blick auf den Genauigkeitswert und machen weiter. Sie lassen 90% des Verbesserungswerts auf dem Tisch.

Dieser Guide zerlegt jedes Stück Motorausgabe, dem du auf FireChess, Lichess, Chess.com oder jeder anderen Plattform begegnen wirst. Am Ende wirst du wissen, wie man Bewertungswerte liest, Tiefe versteht, die Hauptvariante entschlüsselt und — am wichtigsten — alles davon nutzt, um sich tatsächlich im Schach zu verbessern.

---

## Was die Motorbewertungszahl bedeutet

Die wichtigste einzelne Zahl in der Schach-Motoranalyse ist der **Bewertungswert** — die Zahl, die neben jeder Stellung erscheint, normalerweise in Bauern ausgedrückt.

Hier die Skala:

| Bewertung | Bedeutung | Wie es sich in einer Partie anfühlt |
|-----------|---------|----------------------|
| **0.00** | Völlig ausgeglichen | Keine Seite hat irgendeinen Vorteil |
| **+0.1 bis +0.5** | Leichter Vorteil für Weiß | Kleiner positionsbezogener Vorsprung — vielleicht eine bessere Bauernstruktur oder leichter Raumvorteil |
| **+0.5 bis +1.5** | Klarer Vorteil für Weiß | Weiß hat einen bedeutenden Vorsprung — bessere Figuren, mehr Raum oder ein Angriffsziel |
| **+1.5 bis +3.0** | Gewinnvorteil für Weiß | Weiß sollte mit präzisem Spiel gewinnen — meistens ein Materialvorteil oder vernichtender Angriff |
| **+3.0+** | Weiß gewinnt | Technische Konvertierung — die Partie ist effektiv vorbei |
| **-0.1 bis -3.0+** | Dieselbe Skala für Schwarz | Negative Zahlen begünstigen Schwarz |

Die wichtigste Erkenntnis: **Bewertungen werden in Centipawns gemessen.** Ein Centipawn = 1/100stel eines Bauern. Also +1.50 bedeutet, Weiß ist um das Äquivalent von eineinhalb Bauern voraus.

### Was als „gewinnend" gilt

Ein häufiger Fehler unter Vereinsspielern ist die Annahme, dass +0.5 bedeutet „Ich gewinne." Das stimmt nicht. Hier die Realität:

- **Unter +1.0**: Die Partie ist noch sehr im Spiel. Ein 1200-Spieler könnte das leicht mit einem Fehler in beide Richtungen kippen.
- **+1.0 bis +2.0**: Die bevorzugte Seite hat einen klaren Vorsprung, aber die Konvertierung erfordert präzise Technik.
- **Über +2.0**: Hier ist der Motor zuversichtlich. Wenn du bei +2.5 bist und den Vorteil hast, solltest du gewinnen — aber „sollte" und „wird" sind auf der Vereinsebene verschiedene Dinge.

<chess-position fen="r2qk2r/1b1n1p1p/p1pp1npQ/1p2p3/3PP3/P1N2P2/1PP1N1PP/1K1R1B1R b kq - 1 12" caption="Kasparow gegen Topalow, 1999 — nach 12.Kb1. Der Motor bewertet dies als etwa +2.0 für Weiß. Kasparow hat einen massiven Entwicklungsvorsprung, seine Dame ist bereits auf h6 und greift den Königsflügel an, und Schwarz' Figuren sind verheddert. Aber Topalows Stellung sieht oberflächlich ‚in Ordnung' aus — er hat alle seine Figuren und keine unmittelbaren Drohungen. Das ist die Art von Stellung, in der die Motorbewertung dir etwas sagt, das deine Augen verpassen." orientation="black"></chess-position>

Wenn du eine +2.0-Bewertung siehst und denkst *„aber es sieht ausgeglichen aus"*, sieht der Motor meistens Dinge, die du nicht siehst: Figurenaktivitätsunterschiede, langfristige Schwächen oder erzwungene Sequenzen zu einer dominanten Stellung.

---

## Tiefe verstehen: Warum der Motor immer noch „denkt"

Neben dem Bewertungswert siehst du eine Zahl mit der Bezeichnung **Tiefe** — typischerweise etwas wie „Tiefe 20" oder „Tiefe 25". Das ist das zweitwichtigste Stück Motorausgabe, und fast niemand erklärt es Vereinsspielern.

**Tiefe bedeutet, wie viele Halbzüge (Plys) der Motor vorausberechnet hat.** Eine Tiefe von 20 bedeutet, der Motor hat Stellungen 20 Halbzüge tief bewertet — das sind 10 Vollzüge für jede Seite.

### Niedrige Tiefe vs. Hohe Tiefe

| Tiefe | Was es bedeutet | Zuverlässigkeit |
|-------|-------------|------------|
| 10-15 | Flach — der Motor fängt gerade an | Kann Taktik 3-4 Züge tief verpassen |
| 16-20 | Solide — erwischt die meisten taktischen Schläge | Gut genug für Eröffnungsanalyse |
| 21-28 | Tief — der Motor ist zuversichtlich | Der Sweet Spot für Nachanalyse |
| 30+ | Sehr tief — meist nur in Endspielen oder erzwungenen Varianten | Extrem zuverlässig, dauert aber länger |

Das Kritische zu verstehen: **Bewertungen ändern sich mit zunehmender Tiefe.** Eine Stellung, die bei Tiefe 15 wie +0.5 aussieht, könnte bei Tiefe 25 zu +1.8 werden, weil der Motor einen taktischen Schlag findet, der bei niedrigerer Tiefe nicht sichtbar war.

### Praktische Implikation

Wenn du deine eigenen Partien überprüfst, **vertraue der Bewertung nicht, bis die Tiefe mindestens 20 beträgt.** Auf FireChess wird das automatisch gehandhabt. Aber wenn du eine lokale Stockfish-Installation nutzt, achte auf die Tiefenzahl. Wenn sie noch steigt, könnte sich die Bewertung ändern.

---

## Die Hauptvariante: Die empfohlene Variante des Motors lesen

Unter dem Bewertungswert siehst du eine Zugsequenz — etwas wie **„Sxe5 dxe5 Dh5+ g6 Dxe5"**. Das ist die **Hauptvariante**, oder **PV** (Principal Variation). Es ist die beste Vermutung des Motors, wie die Partie von der aktuellen Stellung aus weitergehen sollte, unter der Annahme, dass beide Seiten die besten verfügbaren Züge spielen.

### Eine PV korrekt lesen

Eine PV beginnt immer mit dem Zug der Seite, die am Zug ist. Wenn also Weiß am Zug ist und die PV „Sxe5 dxe5 Dh5+ g6 Dxe5" zeigt, ist die Sequenz:

1. **Weiß** spielt Sxe5 (schlägt auf e5)
2. **Schwarz** antwortet mit dxe5 (schlägt zurück)
3. **Weiß** spielt Dh5+ (Dame nach h5 mit Schach)
4. **Schwarz** blockiert mit g6 (Bauer nach g6)
5. **Weiß** spielt Dxe5 (Dame schlägt auf e5)

Jedes Zügepaar repräsentiert einen Vollzug. Eine PV von 10 Zügen bedeutet, der Motor hat 5 Vollzüge vorausberechnet.

### Warum die PV für deine Verbesserung wichtig ist

Die PV zeigt dir, **was der Motor als beste Zugsequenz ansieht.** Wenn du eine Partie überprüfst und eine PV siehst, die von dem abweicht, was du tatsächlich gespielt hast, hast du eine Lerngelegenheit gefunden:

1. **Vergleiche deinen Zug mit der ersten Wahl des Motors.** Wie viel schlechter war dein Zug? Auf FireChess zeigt sich das als Centipawn-Verlust.
2. **Folge der PV für 3-4 Züge.** Schau nicht nur auf den ersten Zug — verstehe *warum* die Variante des Motors funktioniert.
3. **Prüfe, ob die PV in einer Stellung endet, die du verstehst.**

---

## Centipawn-Verlust: Die Kennzahl, die die Schachverbesserung veränderte

Wenn du FireChess' [/analyze](/analyze)-Tool genutzt hast, hast du **Centipawn-Verlust** (CPL) gesehen — die Zahl, die zeigt, wie viel schlechter dein Zug im Vergleich zur Top-Wahl des Motors war. Das ist die einzelne umsetzbarste Kennzahl in der Schachanalyse.

Hier die Aufschlüsselung: Jeder Zug, den du spielst, wird mit dem besten Zug des Motors verglichen. Die Differenz in der Bewertung (gemessen in Centipawns) ist dein Centipawn-Verlust für diesen Zug. Durchschnitt über alle Züge, und du bekommst deinen **Durchschnittlichen Centipawn-Verlust (ACPL)** — die Zahl, die FireChess prominent in deinen Scanergebnissen anzeigt.

### Das FireChess-Zugabzeichen-System

FireChess übersetzt Centipawn-Verlust in visuelle Abzeichen, die auf jedem Zug im Analysebrett erscheinen:

<svg viewBox="0 0 660 340" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:660px;margin:1.5rem auto;display:block;">
  <rect width="660" height="340" rx="8" fill="#0a0e1a"/>
  <text x="330" y="32" text-anchor="middle" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="16" font-weight="700">FireChess Zugabzeichen-System — Centipawn-Verlust-Bereiche</text>
  <!-- Brilliant -->
  <rect x="30" y="55" width="600" height="36" rx="4" fill="#06b6d4" fill-opacity="0.18"/>
  <text x="50" y="78" fill="#06b6d4" font-family="system-ui,sans-serif" font-size="14" font-weight="700">!!</text>
  <text x="80" y="78" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Genial</text>
  <text x="200" y="78" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">0-10 cp — Außergewöhnlicher Zug, oft ein überraschendes Opfer</text>
  <!-- Best -->
  <rect x="30" y="97" width="600" height="36" rx="4" fill="#10b981" fill-opacity="0.18"/>
  <text x="50" y="120" fill="#10b981" font-family="system-ui,sans-serif" font-size="14" font-weight="700">!</text>
  <text x="80" y="120" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Bester</text>
  <text x="200" y="120" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">0-10 cp — Die Top-Wahl des Motors</text>
  <!-- Good -->
  <rect x="30" y="139" width="600" height="36" rx="4" fill="#34d399" fill-opacity="0.14"/>
  <text x="50" y="162" fill="#34d399" font-family="system-ui,sans-serif" font-size="14" font-weight="700">✓</text>
  <text x="80" y="162" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Gut</text>
  <text x="200" y="162" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">10-25 cp — Starker Zug, nahe am Optimum</text>
  <!-- Book -->
  <rect x="30" y="181" width="600" height="36" rx="4" fill="#94a3b8" fill-opacity="0.14"/>
  <text x="50" y="204" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="14" font-weight="700">DB</text>
  <text x="80" y="204" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Theorie</text>
  <text x="200" y="204" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">0-12 cp — Bekannter theoretischer Zug (Züge 1-15)</text>
  <!-- Inaccuracy -->
  <rect x="30" y="223" width="600" height="36" rx="4" fill="#f59e0b" fill-opacity="0.14"/>
  <text x="50" y="246" fill="#f59e0b" font-family="system-ui,sans-serif" font-size="14" font-weight="700">?!</text>
  <text x="80" y="246" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Ungenauigkeit</text>
  <text x="200" y="246" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">25-75 cp — Leichter Fehler, verliert etwas Vorteil</text>
  <!-- Mistake -->
  <rect x="30" y="265" width="600" height="36" rx="4" fill="#f97316" fill-opacity="0.14"/>
  <text x="50" y="288" fill="#f97316" font-family="system-ui,sans-serif" font-size="14" font-weight="700">?</text>
  <text x="80" y="288" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Fehler</text>
  <text x="200" y="288" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">75-200 cp — Signifikanter Fehler, ändert die Bewertung</text>
  <!-- Blunder -->
  <rect x="30" y="307" width="600" height="28" rx="4" fill="#ef4444" fill-opacity="0.18"/>
  <text x="50" y="326" fill="#ef4444" font-family="system-ui,sans-serif" font-size="14" font-weight="700">??</text>
  <text x="80" y="326" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="13">Patzer</text>
  <text x="200" y="326" fill="#64748b" font-family="system-ui,sans-serif" font-size="12">200+ cp — Partieentscheidender Fehler</text>
</svg>

Die Zusammenfassung oben in einem FireChess-Scan zeigt etwas wie:

> **Weiß 78.7% Genauigkeit · Bester 11 · Theorie 8 · Gut 3 · Patzer 2 · ACPL 43.2**

Diese eine Zeile sagt dir mehr über die Partie als jede andere Kennzahl.

### Was ACPL dir tatsächlich sagt

Dein ACPL ist die einzelne beste Kennzahl dafür, wie gut du gespielt hast, unabhängig davon, ob du gewonnen oder verloren hast. Hier eine grobe Orientierung nach Wertungsstufe:

| Wertung | Typischer ACPL | Wie es aussieht |
|--------|-------------|-------------------|
| 800-1000 | 100-150 | Häufige Patzer, mehrere ??-Abzeichen pro Partie |
| 1000-1200 | 70-100 | Gelegentliche Patzer, regelmäßige Fehler |
| 1200-1500 | 45-70 | Weniger Patzer, aber Ungenauigkeiten häufen sich |
| 1500-1800 | 30-50 | Meistens gute Züge mit gelegentlichen Fehlern |
| 1800-2200 | 15-30 | Konstant stark, seltene Fehler |
| 2200+ | 5-15 | Nahezu perfekte Genauigkeit |

Für einen tieferen Einblick, was Centipawn-Verlust bedeutet und wie er berechnet wird, lies [Was ist Centipawn-Verlust? ACPL erklärt](/blog/what-is-centipawn-loss). Wenn du wissen willt, wie dein ACPL im Vergleich zu Spielern deiner Wertung abschneidet, prüfe [Durchschnittlicher Centipawn-Verlust nach Wertung](/blog/average-centipawn-loss-by-rating).

---

## Wie du Motoranalyse tatsächlich zur Verbesserung nutzt

Hier gehen die meisten Vereinsspieler falsch: Sie starten den Motor, schauen auf die Bewertung, prüfen ihren Genauigkeitswert und schließen den Tab. Sie haben 2 Minuten damit verbracht, Daten zu sammeln, die sie in 5 Minuten vergessen.

Echte Verbesserung durch Motoranalyse erfordert einen Prozess. Hier ist der, der funktioniert:

### Schritt 1: Identifiziere die kritischen Momente

Analysiere nicht jeden Zug. Konzentriere dich auf die Punkte, an denen die Bewertung **signifikant schwankte** — wo die Stellung von gewinnend zu verloren wechselte oder von ausgeglichen zu klar schlechter.

### Schritt 2: Verstehe für jeden kritischen Zug, WARUM er schlecht ist

Das ist der Schritt, den fast jeder überspringt. Wenn du siehst, dass dein Zug 14.Lg5 ein Fehler war (Bewertung sank von +0.3 auf -1.2), notiere nicht nur „Lg5 war schlecht." Frage:

1. **Was schlug der Motor stattdessen vor?** Schau auf den grün hervorgehobenen besten Zug.
2. **Was ist anders am Zug des Motors?** Verteidigt er etwas? Greift er etwas an? Hält er Spannung?
3. **Was passiert, wenn du der PV 3-4 Züge folgst?** Die Variante des Motors enthüllt usually den taktischen oder strategischen Grund, warum dein Zug scheiterte.

### Schritt 3: Kategorisiere deine Fehler

Nach der Überprüfung von 5-10 deiner Partien werden Muster sichtbar. Die meisten Vereinsspieler machen wiederholt dieselben Fehlertypen:

- **Taktische Blindheit**: Gabeln, Fesselungen, Spieße verfehlen. Du siehst viele Patzer (??)-Abzeichen.
- **Eröffnungsvorbereitungslücken**: Deine Ungenauigkeits-Abzeichen (?!) häufen sich bei Zügen 5-12.
- **Endselftechnikfehler**: Deine Fehler häufen sich nach Zug 30.
- **Zeitnot-Patzer**: Deine Genauigkeit fällt in den letzten 5 Minuten der Partie steil ab.

### Schritt 4: Studiere ein Muster gleichzeitig

Versuche nicht, alles auf einmal zu fixieren. Wenn deine Analyse zeigt, dass du 50+ Centipawns pro Partie durch taktische Blindheit verlierst, verbringe zwei Wochen mit Aufgaben, die auf die spezifischen Motive abzielen, die du verpasst.

<chess-position fen="8/1r3pkp/p5p1/8/8/8/P4PPP/R4RK1 w - - 0 1" caption="Ein typisches Turmendspiel. Der Motor bewertet dies als +0.8 für Weiß — ein kleiner, aber realer Vorteil basierend auf aktivierer Turmplatzierung und besserer Königsposition. Für Vereinsspieler sind Stellungen wie diese, wo sich Centipawn-Verlust akkumuliert." orientation="white"></chess-position>

---

## Motor-Tiefe vs. Motorbewertung: Wenn sie nicht übereinstimmen

Eine der verwirrendesten Dinge in der Motoranalyse ist, wenn sich die Bewertung **dramatisch ändert**, während der Motor tiefer rechnet.

Die Antwort ist fast immer eine dieser:

### Der Motor fand einen tiefen taktischen Schlag

Bei niedrigerer Tiefe konnte der Motor eine Kombination nicht sehen, die sich 8-10 Züge tief erstreckt. Sobald er weit genug rechnete, entdeckte er eine erzwingende Sequenz, die Material gewinnt oder matt setzt.

### Der Motor fand eine Verteidigungsressource

Das Gegenteil passiert auch: Die Bewertung fällt von +3.0 auf +0.6, weil der Motor bei Tiefe 22 einen klugen Verteidigungszug entdeckte, den er bei Tiefe 14 verpasste.

### Der Motor wechselt zwischen gleichwertigen Top-Zügen

Manchmal sind zwei Züge in der Bewertung fast identisch (sagen wir +0.41 vs +0.38), und der Motor wechselt zwischen ihnen, wenn die Tiefe steigt. Gerate nicht in Panik, wenn die Bewertung um weniger als 0.3 Bauern schwankt — das ist normales Motorverhalten.

---

## Häufige Fehler beim Lesen von Motoranalysen

### Falle 1: „Der Motor sagt +0.3, also stehe ich besser"

Eine +0.3-Bewertung ist **vernachlässigbar**. In der Praxis bedeutet sie nichts. Behandle alles zwischen -0.5 und +0.5 als ausgeglichen.

### Falle 2: „Ich sollte immer den Top-Zug des Motors spielen"

Die erste und zweite Wahl des Motors sind oft um weniger als 0.1 Bauern getrennt. Wenn du die zweitbeste Wahl des Motors gespielt und nur 3 Centipawns verloren hast, ist das ein **Genialer** oder **Bester** Zug.

### Falle 3: „Die Eröffnungszüge des Motors sind die besten Züge"

Motoren haben nicht immer recht bei Eröffnungen. In vielen scharfen Eröffnungsvarianten kann der bevorzugte Zug des Motors bei Tiefe 25 von dem abweichen, den Großmeister tatsächlich spielen.

### Falle 4: „Ich habe gewonnen, also wird meine Analyse gut aussehen"

Gewinnen und gut spielen sind verschiedene Dinge. Du kannst eine Partie mit einem ACPL von 120 gewinnen, wenn dein Gegner mehr patzt als du.

---

## Alles zusammensetzen: Eine 10-Minuten-Analyse-Routine

Hier eine praktische Routine nach jeder gewerteten Partie:

**Minuten 1-2: Hochladen und scannen.** Gehe zu [FireChess /analyze](/analyze) und lade deine PGN hoch.

**Minuten 3-4: Zusammenfassung prüfen.** Schau dir deinen ACPL und die Abzeichenverteilung an. Wenn dein ACPL unter 40 liegt, hast du gut gespielt. Über 70? Es gibt signifikante Verbesserungsbereiche.

**Minuten 5-7: Die kritischen Züge überprüfen.** Klicke auf jeden Patzer und Fehler. Für jeden: Was hast du gespielt? Was war der Vorschlag des Motors? Folge der PV des Motors 3 Züge lang.

**Minuten 8-9: Die Eröffnung prüfen.** Schau dir Züge 1-15 auf Theorie (DB) vs. Nicht-Theorie-Züge an.

**Minute 10: Eine Erkenntnis notieren.** Schreibe EINE Sache auf, auf die du dich in der nächsten Partie konzentrieren wirst.

---

### Was bedeutet eine +1.5-Bewertung im Schach?

Eine +1.5-Bewertung bedeutet, Weiß hat einen Vorteil, der eineinhalb Bauern entspricht. In der Praxis sollte Weiß mit präzisem Spiel gewinnen, aber auf der Vereinsebene (unter 1800) kann dieser Vorteil leicht hin und her schwanken.

### Wie genau ist Stockfish bei Tiefe 20?

Stockfish bei Tiefe 20 ist für taktische Stellungen extrem genau — er verfehlt selten Kombinationen, die kürzer als 8-10 Züge sind. Für Nachanalyse ist Tiefe 20-25 mehr als ausreichend für Vereinsspieler.

### Was ist ein guter Centipawn-Verlust für einen 1500-Spieler?

Ein 1500-Spieler hat typischerweise einen ACPL zwischen 45 und 70. Wenn dein ACPL konstant unter 50 liegt, spielst du über deinem Wertungsniveau. Wenn er über 80 liegt, konzentriere dich auf die Reduzierung von Patzern.

### Sollte ich immer den Zug spielen, den der Motor empfiehlt?

Nicht unbedingt. Die Top-Züge des Motors sind oft um weniger als 10 Centipawns getrennt — beide sind ausgezeichnet. Der Motor berücksichtigt auch nicht deinen Stil, die Tendenzen deines Gegners oder praktische Überlegungen wie Zeitnot.