---
title: "Wie man Schachpartien analysiert: Der Nachanalyse-Guide"
description: "Lerne, deine Schachpartien wie ein 2000+ Spieler zu analysieren. Schritt-für-Schritt-Nachanalyse-Routine mit echten Stellungen und FireChess-Scanner-Tipps."
date: "2026-07-24"
author: "FireChess Team"
tags: ["analysis", "improvement", "game-review", "study-routine"]
canonical: https://firechess.com/de/blog/how-to-review-chess-games
---

Du hast gerade eine Partie verloren, von der du dachtest, du gewinnst sie. Du weißt, du solltest sie analysieren — jeder Trainer sagt es, jeder Verbesserungsguide listet es als Schritt eins auf. Aber wenn du das Analysebrett öffnest, starrst du auf die Stellung nach Zug 30 und denkst: *und jetzt?*

Die meisten Vereinsspieler behandeln die Nachanalyse wie Hausaufgaben — etwas, von dem sie wissen, dass sie es tun sollten, aber selten gut tun. Sie klicken durch die besten Varianten des Motors, nicken bei den Vorschlägen des Computers und schließen den Tab, ohne etwas Konkretes gelernt zu haben. Das Ergebnis? Sie machen in der nächsten Partie dieselben Fehler.

Dieser Guide ändert das. Am Ende wirst du eine **spezifische, wiederholbare 10-Minuten-Routine** haben, um jede Schachpartie zu überprüfen — Sieg, Remis oder Niederlage. Du wirst genau wissen, wonach du suchen musst, in welcher Reihenfolge, und wie du jede Überprüfung in umsetzbare Verbesserung verwandelst. Wir gehen durch echte Stellungen aus tatsächlichen Partien, damit du den Prozess in Aktion sehen kannst.

---

## Warum die meisten Partieanalysen scheitern (und was man stattdessen tun sollte)

Die unbequeme Wahrheit: **90% der Vereinsspieler analysieren ihre Partien falsch.** Sie überspringen entweder die Analyse ganz, oder sie tun es auf eine Weise, die null Verbesserung produziert.

Die drei häufigsten Fehler:

**Fehler 1: Den Motor die Partie für dich spielen lassen.** Du klickst auf „Analysieren", schaust zu, wie Stockfish jeden Zug bei Tiefe 22 bewertet, und liest die Top-3-Varianten des Motors für jede Stellung. Das ist passiv. Du liest einen Bericht, denkst nicht über Schach nach. Dein Gehirn behält keine Informationen, die es nicht erarbeiten musste.

**Fehler 2: Nur auf Patzer schauen.** Du findest die Züge, bei denen die Bewertungsleiste um 300+ Centipawns schwankte, denkst „oh, ich hätte meine Dame nicht hängen lassen sollen", und machst weiter. Aber die Partie war schon zwei Züge vor dem Patzer verloren — als du einen passiven Zug machtest, der deine Figuren unkoordiniert ließ. Patzer sind Symptome, keine Ursachen.

**Fehler 3: Ohne Plan analysieren.** Du öffnest das Brett, scrollst zu Zug 15, siehst etwas Interessantes, springst zu Zug 30, prüfst das Endspiel und schließt den Tab nach 4 Minuten, ohne etwas Systematisches gelernt zu haben.

Die Lösung ist eine strukturierte Routine. Hier ist die, die ich bei Tausenden von Spielern funktionieren gesehen habe, die den [FireChess-Scanner](/analyze) nutzen, um ihre Partien zu analysieren.

---

## Die 10-Minuten-Nachanalyse-Routine

Jede [Partieanalyse](/blog/how-to-analyze-chess-games-guide) folgt denselben fünf Schritten. Tu sie in der Reihenfolge — spring nicht vor.

### Schritt 1: Ohne Motor wiederholen (2 Minuten)

Bevor du irgendeinen Motor einschaltest, wiederhole die gesamte Partie aus dem Gedächtnis — oder zumindest die kritischen Momente. Klicke die Züge auf einem sauberen Brett ohne Bewertungsleiste, ohne Pfeile, ohne Motorvorschläge durch.

Dein Ziel: **Identifiziere die drei wichtigsten Momente.** Das sind normalerweise:

- Der Moment, in dem sich der Charakter der Stellung änderte (Eröffnung → Mittelspiel-Übergang, Bauernstrukturänderung, Figurentausch, der das Gleichgewicht verschob)
- Der Moment, in dem du unsicher warst (du hast 2+ Minuten für einen einzelnen Zug gebraucht)
- Der Moment, in dem die Partie entschieden wurde (der Patzer, das Gewinnopfer, der Endselfehler)

Schreibe diese drei Momente auf — auch nur die Zugzahlen. „Zug 12: Ich tauschte Läufer und ruinierte meine Bauernstruktur. Zug 18: Ich verfehlte die Taktik. Zug 25: Ich spielte das Turmendspiel falsch."

Dieser Schritt ist entscheidend, weil er dich zwingt, über die Partie nachzudenken, bevor der Motor dir sagt, was du denken sollst. Im [FireChess-Analyse-Tool](/analyze) kannst du die Bewertungsleiste beim Wiederholen ausblenden und sie dann einblenden, nachdem du deine eigene Einschätzung gebildet hast.

### Schritt 2: Die Eröffnungsphase prüfen (2 Minuten)

Jetzt schaltest du den Motor ein — konzentriere dich aber nur auf Züge 1-15. Vergleiche deine Züge mit dem Top-Vorschlag des Motors für jede Stellung.

Wonach du suchst:

**Eröffnungsungenauigkeiten, die langfristige Probleme schufen.** Das sind die stillen Killer. Du hast keine Figur gehängt — du hast einen leicht ungenauen Zug auf Zug 8 gemacht, der deinem Gegner einen dauerhaften positionsbezogenen Vorteil verschaffte.

Hier ein echtes Beispiel. In einer Italienischen Partie spielt Weiß den natürlich aussehenden 8.Lg5:

<chess-position fen="r1bqk2r/ppppbppp/2n2n2/4p1B1/2B1P3/3P1N2/PPP2PPP/RN1QK2R b KQkq - 2 5" caption="Nach 8.Lg5 — sieht natürlich aus, aber Schwarz kann leicht mit ...h6 gefolgt von ...d6 ausgleichen. Die Fesselung des Springers ist vorübergehend, und Weiß hat den Läufer verfrüht eingesetzt." orientation="white"></chess-position>

Der Zug Lg5 ist kein Patzer — es ist eine Ungenauigkeit. An der Oberfläche sieht es gut aus: du fesselst den Springer, entwickelst eine Figur, setzt Druck auf f6. Aber der Motor zeigt, dass nach 8...h6 9.Lh4 d6 Schwarz eine komfortable Stellung hat, weil der Läufer auf h4 passiv ist und Weiß nichts Konkretes erreicht hat.

Wenn du diese Partie analysierst, ist die wichtigste Erkenntnis nicht „Lg5 ist schlecht" — sondern zu verstehen, **warum** der Motor Alternativen wie 8.a4 oder 8.Sbd2 bevorzugt. Diese Züge sehen nicht so natürlich aus, aber sie bereiten einen effektiveren Plan vor.

**Was du in FireChess tun sollst:** Lade deine PGN auf [/analyze](/analyze) hoch und schau dir den Bereich „Eröffnungslecks" in den Scanergebnissen an. Er gruppiert jede Stellung, in der dein Zug um mehr als 50 Centipawns von der Theorie abwich. Wenn du dieselbe Stellung in mehreren Partien siehst, ist das deine Eröffnungs-Studienpriorität.

### Schritt 3: Den kritischen Moment finden (3 Minuten)

Das ist der wichtigste Schritt. Jede Partie hat einen **kritischen Moment** — die Stellung, in der sich die Bewertung am dramatischsten änderte, oder in der du die schwierigste Entscheidung hattest.

Springe zu dem Zug, für den du am meisten Zeit hattet (deine Schachuhr sagt dir das), oder bei dem der Centipawn-Verlust am höchsten war. Studiere diese Stellung eine volle Minute, ohne Züge zu machen.

Stell dir drei Fragen:

1. **Was habe ich während der Partie gedacht?** (Schreib es auf — dein gedanklicher Prozess während der Partie ist wertvolles Material)
2. **Was empfiehlt der Motor?** (Prüfe die Top-2-3 Varianten)
3. **Warum ist der Zug des Motors besser?** (Merke dir nicht nur den Zug — verstehe die Idee)

Hier ein Beispiel aus einem Sizilianischen Najdorf. Weiß startet einen Angriff am Königsflügel mit g4, und Schwarz muss entscheiden, wie er antwortet:

<chess-position fen="r2q1rk1/1p1nbppp/p2pbn2/4p3/4P1P1/1NN1BP2/PPPQ3P/2KR1B1R b - - 0 11" caption="Schwarz am Zug in einem scharfen Sizilianischen Najdorf. Weiß hat gerade g4 gespielt und droht g5, um den Springer zu vertreiben. Schwarz' Antwort hier bestimmt, ob der Angriff am Königsflügel Erfolg hat oder verpufft." orientation="black"></chess-position>

Die kritische Entscheidung: Soll Schwarz 11...h6 spielen (g5 verhindern und den Springer auf f6 halten), 11...d5 (das Zentrum angreifen, bevor Weiß' Angriff sich entwickelt), oder 11...a5 (Gegenspiel am Damenflügel vorbereiten)?

In der Partie spielte Schwarz 11...h5 — ein natürlich aussehender Zug, der g4-g5 stoppt, aber eine permanente Schwäche auf g5 schafft und den Königsflügel zu Gunsten von Weiß sperrt. Der Motor bevorzugt 11...d5, der viel schwerer am Brett zu finden ist, weil er das Zentrum öffnet, während dein König noch auf g8 steht.

**Die Lektion:** Wenn du analysierst, notiere nicht nur „der Motor sagt d5 ist am besten." Frag dich: **Welches Muster müsste ich erkennen, um d5 in einer zukünftigen Partie zu finden?** Die Antwort: In scharfen Sizilianischen Stellungen sind Zentralstöße oft effektiver als passive Verteidigung. Das ist ein Muster, das du auf Dutzende zukünftiger Partien anwenden kannst.

### Schritt 4: Das Endspiel überprüfen (2 Minuten)

Die meisten Vereinsspieler überspringen die Endspielanalyse komplett. Das ist ein Fehler — **Endspiele sind dort, wo die größten Wertungsgewinne versteckt sind.** Ein 1200-Spieler, der Endspiele studiert, wird einen 1200-Spieler, der Eröffnungen studiert, fast immer schlagen.

Prüfe dein Endspiel auf diese häufigen Lecks:

**Turmaktivität.** Der häufigste Endselfehler ist ein passiver Turm. Dein Turm sollte hinter Freibauern stehen (deinen oder denen deines Gegners), auf der siebten Reihe, oder den feindlichen König abschneiden. Wenn dein Turm auf der ersten Reihe sitzt und nichts tut, verlierst du wahrscheinlich.

<chess-position fen="4r1k1/5pp1/7p/8/8/7P/5PP1/4R1K1 w - - 0 1" caption="Weiß am Zug in einem Turmendspiel. Das Schlüsselprinzip: Aktiviere deinen Turm. Te1-e7 oder Te1-d1 mit der Absicht einzudringen sind beide stark. Te1-e5 (Zentralisierung) ist verlockend, aber passiv — der Turm leistet mehr Arbeit auf der siebten Reihe." orientation="white"></chess-position>

**Königsaktivität.** In Endspielen ohne Damen ist der König eine Kampffigur. Wenn dein König noch auf g1 steht, wenn keine Drohungen bestehen, spielst du eine Figur weniger. Führe den König zum Zentrum.

**Bauernstruktur.** Zähle deine Bauerninseln. Zähle die deines Gegners. Freibauern, verbundene Freibauern, Außen-Freibauern — diese entscheiden die meisten Endspiele, nicht taktische Tricks.

**Was du in FireChess tun sollst:** Scanne deine Partien, filtere die Zugliste auf Züge 30+ und sortiere nach Centipawn-Verlust. Die Endspielzüge mit dem höchsten Verlust sind deine Studienziele. Wenn du ein Muster siehst (z.B. du verlierst regelmäßig Turmendspiele), ist das dein nächstes Studienthema.

### Schritt 5: Eine Erkenntnis aufschreiben (1 Minute)

Der letzte Schritt — und der, den die meisten überspringen. Schreibe **eine spezifische Sache** auf, die du aus dieser Partie gelernt hast. Nicht „Ich muss Taktik studieren" oder „Ich sollte weniger patzen." Etwas Konkretes:

- „In der Italienischen Partie nicht Lg5 spielen, bevor Schwarz ...h6 spielt — der Läufer strandet."
- „Wenn mein Gegner in der Sizilianischen g4 spielt, zuerst nach ...d5-Zentralstößen suchen."
- „In Turmendspielen muss ich meinen Turm aktivieren, bevor ich Bauern schiebe."

Bewahre diese Erkenntnisse in einem Notizbuch oder einer Datei auf. Nach 20 Partien hast du 20 spezifische Lektionen. Das ist nützlicher als jedes Eröffnungsrepertoire-Buch.

---

## Was der Motor dir tatsächlich sagt (und was nicht)

Die Motorbewertung ist eine Zahl — positiv bedeutet Weiß steht besser, negativ bedeutet Schwarz steht besser. Aber die Zahl allein sagt dir nicht *warum* eine Seite besser steht oder *was du dagegen tun kannst.*

So liest du Motor-Ausgaben wie ein starker Spieler:

### Centipawn-Verlust: Die wichtigste Zahl

Dein **durchschnittlicher Centipawn-Verlust (ACPL)** misst, wie viel Bewertung du mit jedem Zug aufgegeben hast. Wenn Stockfish' Top-Wahl +0.50 bewertet und dein Zug -0.20 bewertet, ist dein Centipawn-Verlust für diesen Zug 70 Centipawns.

Zur Orientierung, so sieht ACPL nach Stufe aus:

| Wertung | Typischer ACPL | Was es bedeutet |
|--------|-------------|---------------|
| 800-1000 | 120-180 | Figuren regelmäßig hängen lassen, grundlegende Taktik verfehlen |
| 1000-1200 | 80-120 | Gelegentliche Patzer, schwaches Endselfspiel |
| 1200-1500 | 50-80 | Gute taktische Vision, positionsbezogene Ungenauigkeiten |
| 1500-1800 | 35-50 | Solides Spiel, gelegentliche strategische Fehler |
| 1800-2000 | 25-35 | Starkes Spiel, subtile Ungenauigkeiten |
| 2000+ | 15-25 | Nahezu perfekte Ausführung mit kleinen Ungenauigkeiten |

<svg viewBox="0 0 620 320" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:620px;margin:1.5rem auto;display:block">
  <rect width="620" height="320" fill="#0a0e1a" rx="12"/>
  <text x="310" y="32" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="16" font-weight="700" text-anchor="middle">Durchschnittlicher Centipawn-Verlust nach Wertungsstufe</text>
  <line x1="80" y1="260" x2="590" y2="260" stroke="#1e293b" stroke-width="1"/>
  <line x1="80" y1="200" x2="590" y2="200" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="4"/>
  <line x1="80" y1="140" x2="590" y2="140" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="4"/>
  <line x1="80" y1="80" x2="590" y2="80" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="4"/>
  <text x="72" y="264" fill="#64748b" font-family="system-ui,sans-serif" font-size="11" text-anchor="end">0</text>
  <text x="72" y="204" fill="#64748b" font-family="system-ui,sans-serif" font-size="11" text-anchor="end">60</text>
  <text x="72" y="144" fill="#64748b" font-family="system-ui,sans-serif" font-size="11" text-anchor="end">120</text>
  <text x="72" y="84" fill="#64748b" font-family="system-ui,sans-serif" font-size="11" text-anchor="end">180</text>
  <rect x="100" y="60" width="70" height="200" fill="#e13c48" rx="4"/>
  <text x="135" y="278" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">800-1000</text>
  <text x="135" y="52" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle">150</text>
  <rect x="195" y="100" width="70" height="160" fill="#f59e0b" rx="4"/>
  <text x="230" y="278" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">1000-1200</text>
  <text x="230" y="92" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle">100</text>
  <rect x="290" y="140" width="70" height="120" fill="#f59e0b" rx="4"/>
  <text x="325" y="278" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">1200-1500</text>
  <text x="325" y="132" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle">65</text>
  <rect x="385" y="180" width="70" height="80" fill="#10b981" rx="4"/>
  <text x="420" y="278" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">1500-1800</text>
  <text x="420" y="172" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle">42</text>
  <rect x="480" y="210" width="70" height="50" fill="#10b981" rx="4"/>
  <text x="515" y="278" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="11" text-anchor="middle">1800-2000</text>
  <text x="515" y="202" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600" text-anchor="middle">30</text>
  <text x="80" y="300" fill="#64748b" font-family="system-ui,sans-serif" font-size="10">Quelle: Aggregierte Daten aus 14.000+ FireChess-Scans</text>
</svg>

Wenn dein ACPL 72 ist und du 1400 gewertet bist, ist das normal — du gibst etwa 72 Centipawns pro Zug durch eine Kombination aus taktischen Fehlern und positionsbezogenen Ungenauigkeiten auf. Das Ziel ist nicht, 0 zu erreichen (selbst Großmeister schaffen das nicht); es ist, **die Züge zu identifizieren, die am meisten zu deinem Centipawn-Verlust beitragen, und diese zuerst zu beheben.**

### Die Zugqualitätsskala

FireChess übersetzt Centipawn-Verlust in visuelle Abzeichen, die direkt auf dem Analysebrett erscheinen. Wenn du eine Partie auf [/analyze](/analyze) scannst, wird jeder Zug klassifiziert:

| Abzeichen | Symbol | Centipawn-Verlust | Was passiert ist |
|-------|--------|---------------|---------------|
| Genial | !! | 0-10 cp | Bester Zug, schwer zu finden |
| Bester | ! | 0-10 cp | Top-Wahl des Motors |
| Gut | ✓ | 10-25 cp | Solide, leichte Ungenauigkeit |
| Theorie | DB | 0-12 cp (Züge 1-15) | Theoriezug |
| Ungenauigkeit | ?! | 25-75 cp | Kleiner Fehler, Stellung verschlechtert |
| Fehler | ? | 75-200 cp | Signifikanter Fehler, Bewertung verschoben |
| Patzer | ?? | 200+ cp | Partieentscheidender Fehler |

Die **Abzeichenverteilung** erzählt eine Geschichte. Eine Partie mit 11 Besten, 3 Guten, 2 Ungenauigkeiten und 1 Patzer ist sehr unterschiedlich von einer Partie mit 6 Besten, 4 Ungenauigkeiten, 3 Fehlern und 0 Patzern — selbst wenn der ACPL ähnlich ist. Die erste Partie hat einen kritischen Fehler zu beheben; die zweite hat systemische positionsbezogene Probleme.

Wenn du eine Partie in FireChess analysierst, schau dir die Abzeichenzusammenfassung oben in den Scanergebnissen an. Sie zeigt die Anzahl für jeden Abzeichentyp plus deinen ACPL. Nutze das, um deine Studienprioritäten zu setzen.

### Bewertungsdiagramme: Die Geschichte der Partie lesen

Das Bewertungsdiagramm (manchmal „Bewertungsleiste" oder „Bewertungsdiagramm" genannt) trägt die Einschätzung des Motors bei jedem Zug auf. Es zu lesen sagt dir mehr über deine Partien als jede einzelne Zuganalyse.

**Stetiger Anstieg ab Zug 1:** Eine Seite war durchgehend besser. Wenn du auf der Verliererseite warst, war deine Eröffnung das Problem — studiere diese spezifische Eröffnung.

**Scharfe Spitzen:** Taktische Schlachten. Mehrere Patzer von beiden Seiten. Studiere die Stellungen, in denen die Grafik nach oben schoss, um zu verstehen, welche Taktiken verfügbar waren.

**Allmählicher Rückgang:** Langsame positionsbezogene Ausquetschung. Kein einzelner Patzer — nur eine Reihe kleiner Ungenauigkeiten, die sich aufsummierten. Das ist die schwerste Art von Niederlage zu diagnostizieren, und es bedeutet meistens, dass du strategische Konzepte studieren musst (Bauernstrukturen, Figurenkoordination, Prophylaxe).

**Flache Linie, die plötzlich fällt:** Ein einzelner katastrophaler Patzer in einer ansonsten ausgeglichenen Partie. Das ist am einfachsten zu beheben — ein taktisches Muster zu lernen.

---

## Die fünf Arten von Fehlern, die du finden wirst

Nach der Analyse von 20+ Partien mit dieser Routine wirst du bemerken, dass deine Fehler in fünf Kategorien fallen. Jede erfordert einen anderen Lernansatz.

### Taktische Übersehen (Hängenlassen und verfehlte Taktiken)

**Wie es aussieht:** Du hast eine Figur ungedeckt gelassen, eine Gabel verfehlt oder die Drohung deines Gegners nicht gesehen. Die Bewertungsleiste fällt um 200+ Centipawns in einem Zug.

**Wie du es behebst:** Mache vor jedem Zug eine **Sicherheitsprüfung** — sind deine Figuren ungedeckt? Wird eine Figur zweimal angegriffen, aber nur einmal verteidigt? Diese 5-Sekunden-Gewohnheit eliminiert 80% der Ein-Zug-Patzer. Für verfehlte Taktiken, löse 10 Aufgaben pro Tag auf deinem Aufgaben-Wertungsniveau (nicht höher).

### Eröffnungswissenslücken

**Wie es aussieht:** Du bist ab Zug 8 aus der Theorie, und der Motor zeigt, dass deine letzten 3 Züge Ungenauigkeiten waren. Du landest in einer Stellung ohne klaren Plan.

**Wie du es behebst:** Nutze den [FireChess-Scanner](/analyze), um deine häufigsten Eröffnungsstellungen zu finden, und studiere dann die ersten 3-5 Züge der Abweichung von der Theorie. Lerne nicht 20 Züge Theorie auswendig — lerne die **Ideen** hinter der ersten kritischen Entscheidung in deiner Eröffnung.

### Positionsbezogene Fehleinschätzungen

**Wie es aussieht:** Dein ACPL ist niedrig (du hast nicht gepatzt), aber du hast langsam verloren. Die Bewertung verschob sich über 15 Züge allmählich gegen dich. Du tauschtest einen guten Läufer gegen einen schlechten Springer, oder du schobst Bauern, die Schwächen erzeugten.

**Wie du es behebst:** Studiere Bauernstrukturen für deine Eröffnungen. Wenn du die Sizilianische spielst, lerne die typischen Bauernstöße (d5 für Schwarz, f4-f5 für Weiß). Wenn du das London-System spielst, lerne, wann du e4 schiebst vs. wann du den Bauern auf e3 hältst.

### Zeitmanagement-Fehler

**Wie es aussieht:** Du hast 8 Minuten für Zug 12 gebraucht (eine unkritische Stellung) und hattest dann 30 Sekunden für das gesamte Endspiel. Dein Endself-Centipawn-Verlust ist 150+, weil du in Zeitnot warst.

**Wie du es behebst:** Setze eine persönliche Uhrregel: Nie mehr als 3 Minuten für einen einzelnen Zug in der Eröffnung oder im Mittelspiel (es sei denn, es ist eine erzwingende Sequenz). Spare mindestens 5 Minuten für das Endspiel auf. Die meisten Partien auf Vereinsebene werden im Endspiel entschieden, nicht in der Eröffnung.

### Endself-Technikfehler

**Wie es aussieht:** Du hattest ein gewinnendes Endspiel, konntest aber nicht konvertieren. Du tauschtest in eine remis-Stellung, oder du schobst den falschen Bauer, oder dein König war am falschen Ort.

**Wie du es behebst:** Studiere die drei häufigsten Endspiele: Turmendspiele, König-und-Bauer-Endspiele und Leichtfigurenendspiele. Du musst nicht alles wissen — nur die Schlüsselstellungen (Lucena, Philidor, Opposition, Triangulation) und die allgemeinen Prinzipien (Turm aktivieren, König zentralisieren, Freibauern schieben).

---

## Eine Analyse-Gewohnheit aufbauen, die bleibt

Den Prozess zu kennen ist nutzlos, wenn du ihn nicht konsequent umsetzt. So machst du die Partieanalyse zur Gewohnheit, nicht zur Pflicht.

### Sofort nach der Partie analysieren

Warte nicht bis morgen. Innerhalb von 5 Minuten nach Ende einer Partie verbringe 2 Minuten mit Schritt 1 (ohne Motor wiederholen) und Schritt 5 (eine Erkenntnis aufschreiben). Dein gedanklicher Prozess während der Partie ist frisch — bis morgen hast du vergessen, was du während des kritischen Moments gedacht hast.

### Eine Partie pro Tag analysieren (nicht jede Partie)

Du spielst 5-10 Partien in einer Sitzung. Analysiere nicht alle. Wähle **die eine Partie, in der du am meisten gelernt hast** — meistens eine Niederlage, aber manchmal ein Sieg, bei dem du Glück hattest. Eine fokussierte 10-Minuten-Analyse einer Partie schlägt eine oberflächliche Analyse von fünf.

### Deine Muster verfolgen

Nach 20 Partien schau dir deine Erkenntnisse an. Gruppieren sie sich um einen bestimmten Fehlertyp? Eine bestimmte Eröffnung? Eine bestimmte Partiephase?

Die meisten Spieler entdecken eines von zwei Mustern:

**Muster A: Derselbe Fehler erscheint immer wieder.** „Ich verfehle ständig Gabeln auf f7." „Ich tausche ständig in verlorene Endspiele." Das ist Gold — du hast deine größte Verbesserungsgelegenheit gefunden. Studiere diese eine Sache für eine Woche und deine Wertung wird springen.

**Muster B: Verschiedene Fehler in jeder Partie.** Das bedeutet, dass deine Grundlagen Arbeit brauchen — nicht eine spezifische Schwäche, sondern grundlegende Brettvision, Rechnen und Mustererkennung. Taktische Aufgaben und langsame Partien (15+10 oder länger) helfen mehr als gezieltes Studium.

### FireChess-Scanner als Analyse-Hub nutzen

Die [/analyze](/analyze)-Seite ermöglicht es dir, PGN-Dateien hochzuladen oder FEN-Stellungen einzufügen für sofortige Analyse. Nach dem Scannen einer Partie zeigen die Ergebnisse:

- **Zug-für-Zug-Aufschlüsselung** mit Centipawn-Verlust für jeden Zug
- **Eröffnungsidentifikation** mit Theoriereferenz
- **Abzeichenverteilung**, die deine Zugqualitätsskala zeigt
- **Kritische Momente**, markiert mit Motorempfehlungen

Anstatt eine lokale Stockfish-Installation einzurichten und UCI-Optionen zu konfigurieren, kannst du professionelle Analyse in deinem Browser bekommen. Lade deine Partien nach jeder Sitzung hoch und folge der 10-Minuten-Routine oben mit den Scanergebnissen.

---

## Fortgeschrittene Analysentechniken

Wenn die Grundroutine zur zweiten Natur wird, füge diese Techniken hinzu, um deine Analyse zu vertiefen.

### Den-Zug-raten-Training

Öffne deine Partie beim kritischen Moment (Schritt 3-Stellung) und **verdecke den Zug, den du tatsächlich gespielt hast.** Versuche jetzt, den Top-Zug des Motors zu finden. Wenn du ihn findest, großartig — dieses Muster ist bereits in deinem Werkzeugkasten. Wenn nicht, studiere die Stellung, bis du verstehst, warum der Zug des Motors am besten ist.

Diese Technik ist viel effektiver als passives Lesen von Motorvarianten, weil sie dich zum Rechnen zwingt. Du trainierst dieselbe Fähigkeit, die du in einer echten Partie nutzt.

### Mehrere Partien derselben Eröffnung vergleichen

Wenn du die Italienische Partie als Weiß in 30% deiner Partien spielst, scanne alle und vergleiche die Eröffnungsphase. [My Opening Tree](/blog/my-opening-tree-chess-repertoire/) automatisiert das — es kartiert jede Variante, die du gespielt hast, und farbcodiert nach Gewinnrate. Du wirst wahrscheinlich feststellen, dass du dieselbe Ungenauigkeit in jeder Partie wiederholst — einen Zug, der sich natürlich anfühlt, aber leicht ungenau ist.

Zum Beispiel in einer typischen Italienischen Mittelspielstellung, in der Schwarz auf e6 getauscht hat:

<chess-position fen="r2q1rk1/ppp1b1pp/2nppn2/4p3/4P3/3P1N1P/PPP2PP1/RNBQR1K1 w - - 0 9" caption="Weiß am Zug, nachdem Schwarz ...Le6 und ...fxe6 gespielt hat. Die offene f-Linie gibt Schwarz Gegenspiel. Weiß muss entscheiden zwischen Sbd2-f1-g3 (langsam aber solide) und Sg5 (aggressiv aber verpflichtend)." orientation="white"></chess-position>

Wenn du feststellst, dass du in dieser Art von Stellung konsequent den falschen Plan wählst, ist das ein gezieltes Studienthema. Du musst nicht die gesamte Italienische Partie studieren — nur diese spezifische Struktur mit der offenen f-Linie.

### Auch die Fehler deines Gegners analysieren

Schau nicht nur auf deine eigenen Züge. Wenn dein Gegner einen Fehler gemacht hat, frag dich: **Habe ich es während der Partie bemerkt?** Wenn ja, großartig — deine taktische Vision funktioniert. Wenn nicht (und der Motor zeigt, dass der Zug deines Gegners ein Patzer war, aber du etwas anderes gespielt hast), hast du eine taktische Gelegenheit verpasst.

Das ist besonders nützlich für Siege. Die meisten Spieler überspringen die Analyse von gewonnenen Partien, aber die Patzer deines Gegners zeigen Lücken in deinem taktischen Bewusstsein.

---

## Was du NICHT bei der Analyse tun solltest

Einige Anti-Muster, die du vermeiden solltest:

**Keine Motorvarianten auswendig lernen.** Die Top-Variante des Motors bei Tiefe 20 ist nutzlos für einen 1400-Spieler. Du kannst nicht so tief rechnen, und die Stellung hat sich längst verändert, bevor du Zug 5 der Empfehlung des Motors erreichst. Konzentriere dich auf den **ersten Zug** des Motorvorschlags und verstehe die **Idee** dahinter.

**Keine externen Faktoren beschuldigen.** „Ich habe wegen Zeitnot verloren" oder „Ich habe verloren, weil sie eine seltsame Eröffnung gespielt haben." Vielleicht — aber was hättest du anders machen können? Selbst in der Zeitnot hast du bestimmte Züge gewählt. Analysiere diese Entscheidungen.

**Nicht analysieren, wenn du aufgebracht bist.** Wenn du gerade 3 Partien in Folge verloren hast, wird deine Analyse emotional sein, nicht analytisch. Mach eine Pause. Komm in einer Stunde mit klarem Kopf zurück.

**Den Motor nicht nutzen, um deine Züge zu rechtfertigen.** Manche Spieler suchen die eine Motorvariante, in der ihr Zug funktioniert, und sagen „siehst du, es war in Ordnung." Das ist Bestätigungsfehler. Wenn der Motor zeigt, dass dein Zug in der Hauptvariante 200 Centipawns verliert, macht die Tatsache, dass es eine Seitenvariante gibt, in der er funktioniert, ihn nicht gut.

---

### Wie lange sollte ich mit der Analyse jeder Schachpartie verbringen?

Für Vereinsspieler ist 10 Minuten der Sweet Spot. Lang genug, um alle fünf Schritte abzudecken (Wiederholung, Eröffnung, kritischer Moment, Endspiel, Erkenntnis), kurz genug, um es nach jeder Sitzung zu tun. Wenn du nur 5 Minuten hast, überspringe die Endselfanalyse und konzentriere dich auf den kritischen Moment — dort passiert das größte Lernen. Großmeister verbringen 30-60 Minuten pro Partie, aber sie analysieren Nuancen, die unter 2000 Wertung keine Rolle spielen.

### Sollte ich gewonnene Partien analysieren, oder nur Niederlagen?

Analysiere beides. Siege enthalten oft dieselben Fehler wie Niederlagen — du bist einfach damit davongekommen. Wenn du eine Partie mit einem ACPL von 85 gewonnen hast, hast du signifikante Fehler gemacht, die ein stärkerer Gegner bestraft hätte. Der [FireChess-Scanner](/analyze) zeigt deine Zugqualität unabhängig vom Ergebnis. Manche der wertvollsten Analysen kommen aus Siegen, in denen du an irgendeinem Punkt schlechter standest.

### Was ist der Unterschied zwischen Centipawn-Verlust und Genauigkeitswert?

Centipawn-Verlust (ACPL) misst den durchschnittlichen Bewertungsabfall pro Zug in Hundertsteln eines Bauern. Genauigkeitswert (0-100%) ist eine andere Kennzahl, die Züge unterschiedlich gewichtet — ein Patzer in einer Gewinnstellung schadet deiner Genauigkeit mehr als ein Patzer in einer verlorenen Stellung. Beide sind nützlich: ACPL sagt dir, wie viel Bewertung du aufgibst, Genauigkeit sagt dir, wie gut du im Verhältnis zur Komplexität der Stellung gespielt hast. Siehe unseren [Centipawn-Verlust-Guide](/blog/what-is-centipawn-loss) und [Genauigkeitswert-Guide](/blog/chess-accuracy-score-explained) für detaillierte Aufschlüsselungen.

### Wie analysiere ich Partien ohne Motor?

Motorfreie Analyse ist tatsächlich der beste Weg anzufangen. Wiederhole die Partie, identifiziere kritische Momente und versuche, jede Stellung selbst zu bewerten, bevor du den Motor prüfst. Wenn du nur ein Handy und keinen Motor hast, spiele die Partie auf einem physischen Brett durch und schreibe deine Gedanken bei jedem kritischen Moment auf. Wenn du später mit einem Motor prüfst (auch Tage später), lernst du mehr, weil du bereits deine eigene Einschätzung gebildet hast.

### Kann ich Partien von chess.com oder Lichess auf FireChess analysieren?

Ja. Exportiere deine Partie als PGN-Datei von beiden Plattformen (auf Lichess: klicke auf das Zahnradsymbol → „PGN exportieren"; auf Chess.com: klicke auf „Teilen" → „PGN"). Dann füge die PGN in den [FireChess-Scanner](/analyze) zur Analyse ein. FireChess zeigt Centipawn-Verlust pro Zug, Abzeichenklassifikation und Eröffnungsidentifikation — alles an einem Ort.

### Wie viele Partien sollte ich pro Woche analysieren?

Eine pro Tag ist ideal — 7 Analysen pro Woche. Wenn das zu viele sind, fang mit 3 pro Woche an (nach deinen längsten Sitzungen). Der Schlüssel ist Konsequenz: 3 Partien jede Woche über einen Monat zu analysieren bringt viel mehr Verbesserung als 20 Partien einmal zu analysieren und dann aufzuhören.

### Was, wenn ich den kritischen Moment in meiner Partie nicht finden kann?

Wenn du den Wendepunkt nicht identifizieren kannst, schau dir das Bewertungsdiagramm in [FireChess' Analyse](/analyze) an. Der steilste Abfall in der Bewertung markiert den kritischen Moment. Wenn die Grafik flach ist und dann plötzlich fällt, hattest du einen einzelnen Patzer. Wenn sie über viele Züge allmählich abfällt, suche den ersten Zug, bei dem du unsicher warst — das ist meistens, wo die Probleme begannen.

---

## Heute mit der Analyse beginnen

Die Nachanalyse ist die Aktivität mit dem höchsten ROI für Schachverbesserung. Sie erfordert kein Auswendiglernen von Eröffnungen, kein Lösen von Tausenden von Aufgaben und kein Studium von Großmeisterpartien. Sie erfordert 10 Minuten, eine strukturierte Routine und die Bereitschaft, ehrlich über deine Fehler zu sein.

Hier ist dein Aktionsplan:

1. **Spiele eine Partie** (jede Zeitkontrolle, jede Plattform)
2. **Exportiere die PGN** und lade sie auf [FireChess' Scanner](/analyze) hoch
3. **Folge der 5-Schritte-Routine:** Ohne Motor wiederholen (2 Min.), Eröffnung prüfen (2 Min.), kritischen Moment finden (3 Min.), Endspiel analysieren (2 Min.), eine Erkenntnis aufschreiben (1 Min.)
4. **Wiederhole nach deiner nächsten Sitzung**

Nach 20 Partien konsequenter Analyse hast du einen personalisierten Lernplan basierend auf deinen tatsächlichen Schwächen — nicht Vermutungen, nicht allgemeine Ratschläge, sondern Daten aus deinen eigenen Partien. So funktioniert Verbesserung tatsächlich.