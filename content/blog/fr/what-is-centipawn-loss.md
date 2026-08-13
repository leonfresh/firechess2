---
title: "Perte moyenne de centipions expliquée : ce que l'ACPL signifie et comment s'améliorer"
description: "La perte moyenne de centipions (ACPL) mesure la qualité des coups aux échecs. Découvrez ce que cela signifie, voyez des exemples sur l'échiquier, et utilisez FireChess pour réduire la vôtre."
date: "2026-07-26"
author: "FireChess Team"
tags: ["analyse", "fondamentaux", "progression", "perte-centipions"]
canonical: https://firechess.com/fr/blog/what-is-centipawn-loss
---

Vous venez de terminer une partie disputée de 45 minutes. Vous ouvrez le plateau d'analyse, lancez le moteur, et le voilà : **« Perte moyenne de centipions : 72. »**

Que signifie réellement ce chiffre ? 72, c'est bien ? Mal ? Comment est-ce même calculé ? Et pourquoi devriez-vous vous en soucier ?

Si vous avez déjà fixé un score de perte de centipions en vous sentant plus confus qu'informé, vous n'êtes pas seul. La perte moyenne de centipions (ACPL) se trouve au centre de l'analyse d'échecs moderne — chaque plateforme majeure de Lichess à Chess.com à FireChess l'utilise — mais la plupart des joueurs ne comprennent pas pleinement ce que le chiffre représente ni comment l'utiliser.

Ce guide corrige cela. À la fin, vous saurez exactement ce qu'est la perte de centipions, comment Stockfish assigne ces chiffres mystérieux, comment FireChess traduit la perte de centipions en badges de coups que vous voyez sur le plateau d'analyse (Brilliant !!, Best !, Good ✓, Inaccuracy ?!, Mistake ?, Blunder ??), et — surtout — comment utiliser la perte de centipions pour trouver vos plus grandes faiblesses et progresser plus vite.

---

## Qu'est-ce qu'un centipion ? L'unité d'analyse des échecs

Le mot « centipion » est un mot-valise de **centi** (un centième) et **pion**. Un centipion vaut 1/100 de la valeur d'un pion sur l'échiquier.

Pensez-y comme la plus petite unité significative d'avantage aux échecs. Tout comme un gramme mesure de petites quantités de masse et un centime de petites quantités de monnaie, un centipion mesure de petits avantages et désavantages dans une position d'échecs.

**L'hypothèse de base :** Un pion vaut 100 centipions. Ce n'est pas arbitraire — c'est une convention née de décennies de recherche en échecs informatiques. Les cinq valeurs matérielles traditionnelles se décomposent comme suit :

| Pièce | Valeur en centipions |
|-------|---------------------|
| Pion | 100 cp |
| Cavalier | 320 cp (≈3,2 pions) |
| Fou | 330 cp (≈3,3 pions) |
| Tour | 500 cp (5 pions) |
| Dame | 900 cp (9 pions) |

Ce sont des points de départ. Le moteur ajuste ces valeurs dynamiquement en fonction de la position, de l'activité des pièces, de la sécurité du roi, de la structure de pions, et de dizaines d'autres facteurs. Un cavalier sur un avant-poste parfait pourrait être évalué à 350 cp ; le même cavalier coincé au bord de l'échiquier pourrait tomber à 280 cp.

**La perte de centipions**, donc, mesure la différence entre votre coup et le meilleur coup du moteur, exprimée dans ces unités. Si le meilleur coup d'une position donne au moteur +0,50 (un avantage de 50 centipions) et votre coup donne +0,20, votre perte de centipions pour ce coup est de 30 cp — la différence entre l'optimal et ce que vous avez joué. **La perte moyenne de centipions (ACPL)** est simplement la moyenne de ces pertes par coup sur l'ensemble d'une partie — le chiffre unique que vous voyez sur votre rapport d'analyse. Pour une ventilation détaillée de la correspondance entre ces valeurs et les niveaux de classement, consultez notre [guide ACPL par niveau](/blog/average-centipawn-loss-by-rating), ou lisez notre [guide ACPL complet](/blog/average-centipawn-loss-guide) pour des stratégies pratiques de réduction.

---

## Comment les moteurs d'échecs calculent la perte de centipions

C'est là que la plupart des explications deviennent floues, alors soyons précis. Si vous êtes plus intéressé par la façon dont les plateformes convertissent ces chiffres en pourcentages de précision, consultez notre [guide du score de précision](/blog/chess-accuracy-score-explained).

### Étape 1 : Le moteur évalue la position avant votre coup

Quand vous demandez à Stockfish d'analyser une partie, il regarde la position juste avant votre coup et lui assigne une évaluation numérique. C'est le chiffre familier de la « barre d'éval » que vous voyez pendant l'analyse — un chiffre positif signifie que les Blancs sont mieux, un chiffre négatif signifie que les Noirs sont mieux.

Une position évaluée à **+0,73** signifie que les Blancs ont un avantage équivalent à 73 centipions — environ trois quarts d'un pion. Une position à **-1,20** signifie que les Noirs sont en avance d'environ l'équivalent d'un pion et 20 centipions.

### Étape 2 : Le moteur considère tous les coups possibles

Stockfish examine chaque coup légal dans la position et calcule la meilleure évaluation qu'il peut obtenir après chacun. Il le fait en regardant plusieurs coups en avant — typiquement 20-30 demi-coups de profondeur dans l'analyse en ligne — et en utilisant un algorithme de recherche appelé élagage alpha-bêta combiné à une évaluation par réseau de neurones.

Pour chaque coup candidat, le moteur se demande : *« Si je joue ceci, quel est le meilleur résultat possible pour les deux camps sur les 20+ prochains coups ? »*

### Étape 3 : Perte de centipions = Meilleure évaluation — Évaluation de votre coup

La formule est simple :

```
Perte de centipions = Évaluation(Meilleur coup) - Évaluation(Votre coup)
```

Ajustée selon la perspective : si le meilleur coup évalue à +1,00 et votre coup évalue à +0,70, votre perte de centipions est de **30 cp**. Vous avez abandonné 30 centipions d'avantage par rapport au coup optimal.

Le moteur normalise cela pour que ce soit toujours affiché comme un nombre positif (la *perte* que vous avez encourue). Une « perte de centipions de 45 » signifie que vous avez perdu 45 centipions d'avantage par rapport au meilleur coup dans cette position.

---

## Exemples concrets : La perte de centipions sur l'échiquier

Rendons cela réel avec des positions réelles. Chacune illustre un scénario de perte de centipions différent que vous rencontrerez dans vos propres parties.

### Exemple 1 : Une légère imprécision (perte de 15-25 cp)

<chess-position fen="r1bq1rk1/ppp2ppp/2np1n2/4p3/2P5/2NP1NP1/PP2PPBP/R1BQ1RK1 w - - 0 10" caption="Une structure typique d'Attaque indienne du roi. Le meilleur coup des Blancs est 10.Be3, terminant le développement. Jouer 10.b3 à la place (préparant Bb2) perd environ 18 cp — une légère imprécision. Le moteur préfère le fou sur e3 où il cible la faiblesse en d6. C'est le genre d'imprécision que FireChess marque avec un badge jaune '?!'." badge="inaccuracy" arrows="c1e3:green,b2b3:orange"></chess-position>

Dans la position ci-dessus, les Blancs ont une position confortable (+0,45). Le meilleur coup est 10.Be3, développant le fou sur sa case la plus active. Si les Blancs jouent 10.b3 à la place, l'évaluation tombe à environ +0,27 — une perte de centipions de **18 cp**. FireChess la marquerait d'une **Inaccuracy (?!)**.

C'est le type de perte de centipions le plus courant pour les joueurs intermédiaires : de petites imprécisions positionnelles qui ne perdent pas la partie mais s'accumulent sur 40 coups.

### Exemple 2 : Une erreur claire (perte de 40-80 cp)

<chess-position fen="r1bqk2r/pppp1ppp/2n5/4P3/2B1n3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 7" caption="Trait aux Blancs. La meilleure continuation est 7.Nc3, développant et attaquant le cavalier en e4. Jouer 7.O-O? à la place permet aux Noirs de consolider avec ...d5, égalisant. Perte de centipions : environ 55 cp. Badge FireChess : Mistake (?)." badge="mistake" arrows="b1c3:green,e1g1:orange"></chess-position>

Les Blancs ont un léger avantage (+0,60) après l'ouverture. Le meilleur coup est 7.Nc3, frappant le cavalier lâché en e4 et maintenant la pression. Si les Blancs roquent avec 7.O-O?, les Noirs jouent 7...d5 et soudain les Noirs sont complètement bien. L'évaluation passe de +0,60 à environ +0,05 — une perte de centipions de **55 cp**. FireChess marque cela d'un badge orange **Mistake (?)**.

Notez que ce n'est pas un blunder tactique — les Blancs n'ont pas laissé de pièce en prise. Mais les Blancs ont abandonné tout l'avantage de l'ouverture en une erreur positionnelle. C'est à quoi ressemble une « erreur » : pas perdante, mais réellement dommageable.

### Exemple 3 : Un blunder (perte de 80-150 cp)

<chess-position fen="r1b1kb1r/ppp2ppp/2n5/3qp3/8/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 7" caption="Trait aux Blancs. Les Noirs viennent de jouer ...Qe5, laissant la dame sans défense. Le seul bon coup est Nxe5, gagnant la dame. Tout autre coup — par exemple Be2 — est un blunder de 900 cp. Badge FireChess : Blunder (??)." badge="blunder" arrows="f3e5:green"></chess-position>

C'est le type de perte de centipions le plus dramatique. Les Blancs peuvent capturer la dame noire avec 7.Nxe5, gagnant +9,00 en évaluation. Tout autre coup normal — développer un fou, roquer — jette une dame entière. La perte de centipions pour manquer Nxe5 est d'environ **900 cp**. FireChess l'étiquette d'un **Blunder (??)** rouge.

Les blunders de cette ampleur viennent généralement d'une cécité tactique — vous n'avez tout simplement pas vu que la capture était disponible. Le chiffre de perte de centipions vous indique exactement ce que vous avez laissé sur l'échiquier.

### Exemple 4 : Un jeu quasi parfait (perte de 0-15 cp)

<chess-position fen="r2q1rk1/ppp2ppp/2n1bn2/3p4/3P4/2NQ1N2/PPP2PPP/R1B2RK1 w - - 6 10" caption="Une position calme d'un Gambit de la Dame Refusé. Les Blancs ont plusieurs coups raisonnables. 11.Bg5, 11.Bf4, et 11.Rd1 sont tous à 5-10 cp les uns des autres. Même le choix « sous-optimal » ici se traduit à peine par une perte de centipions. Badge FireChess : Best (!) ou Good (✓)." badge="best" arrows="c1g5:green,c1f4:green"></chess-position>

Dans les positions calmes et symétriques, la perte de centipions entre des coups raisonnables peut être minuscule. Ici, les trois coups candidats des Blancs — 11.Bg5, 11.Bf4, et 11.Rd1 — s'évaluent tous entre +0,25 et +0,30. Choisir le « mauvais » coûte au maximum **5-8 cp**. FireChess étiquetterait chacun d'eux comme **Best (!)** ou **Good (✓)**.

C'est une idée clé : toute perte de centipions ne se vaut pas. Une perte de 10 centipions dans une Sicilienne aiguisée où un seul coup maintient la position est un gros problème. Une perte de 10 centipions dans une position calme où cinq coups sont jouables est du bruit.

### Exemple 5 : Le blunder d'ouverture (perte de 150+ cp)

<chess-position fen="rnbqkbnr/ppp2ppp/3p4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3" caption="Trait aux Noirs dans la Défense Philidor. Jouer le naturel 3...Bg4? cloue le cavalier mais perd un pion après 4.Bxf7+! Kxf7 5.Ng5+. Perte de centipions : environ 250 cp. Badge FireChess : Blunder (??)." badge="blunder" arrows="c4f7:red,f3g5:green"></chess-position>

La Défense Philidor (1.e4 e5 2.Nf3 d6 3.Bc4) semble inoffensive, mais les Noirs doivent être prudents. Le coup 3...Bg4? semble logique — clouer le cavalier — mais il tombe dans 4.Bxf7+! Après 4...Kxf7 5.Ng5+, les Noirs perdent le droit de roque et un pion. La perte de centipions est d'environ **250 cp** pour un seul coup. C'est le genre de piège d'ouverture que FireChess signale d'un badge **Blunder (??)** rouge.

### Exemple 6 : Précision en finale (10 cp vs 50 cp)

<chess-position fen="8/8/8/4k3/8/3KP3/8/8 w - - 0 1" caption="Une simple finale roi et pion. Trait aux Blancs. 1.Ke2? (perdant l'opposition) coûte environ 45 cp et transforme un gain en nulle. 1.Kd2! maintient l'opposition et gagne. La différence entre +1,20 et +0,08 est de 112 cp — un seul coup changeant l'issue de la partie." badge="blunder" arrows="e3d2:green,e3e2:red"></chess-position>

Les finales sont l'endroit où la perte de centipions devient brutalement impitoyable. Dans la position ci-dessus, les Blancs doivent jouer 1.Kd2! pour maintenir l'opposition et gagner. Jouer 1.Ke2? perd l'opposition et l'évaluation s'effondre de +1,20 à +0,08 — une perte de centipions de **112 cp**. Un seul coup de roi. Partie terminée. FireChess marque cela d'un **Blunder (??)** parce que le swing d'évaluation est décisif.

La même perte de centipions de 112 en milieu de partie pourrait être une erreur partielle dans une position complexe. En finale, avec si peu de pièces restantes, c'est catastrophique. Le contexte compte.

---

## Badges de coups FireChess : Ce que chaque étiquette signifie

Quand vous analysez une partie sur FireChess, chaque coup reçoit un badge coloré à côté dans la liste des coups. Ces badges ne sont pas aléatoires — ils correspondent directement aux plages de perte de centipions. Voici la correspondance complète pour que vous sachiez exactement ce que chaque étiquette signifie quand vous la voyez. Pour une analyse plus approfondie du fonctionnement des scores de précision, consultez notre [guide du score de précision](/blog/chess-accuracy-score-explained).

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
  <text x="360" y="40" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700" letter-spacing="0.4" font-family="system-ui">Badges de coups FireChess — Correspondance des centipions</text>
  <text x="360" y="62" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Chaque badge correspond à une plage de perte de centipions. Plus bas = mieux. Votre ACPL les moyenne sur chaque coup.</text>
  <!-- Badge cards -->
  <!-- Brilliant: 0-10 cp loss, but only for sacrifices that work -->
  <g transform="translate(30, 90)">
    <rect width="660" height="54" rx="10" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#22d3ee" font-size="18" font-weight="800" font-family="system-ui">!!</text>
    <text x="54" y="34" fill="#22d3ee" font-size="15" font-weight="700" font-family="system-ui">Brilliant</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp de perte · Sacrifice meilleur coup faisant basculer l'évaluation en votre faveur</text>
  </g>
  <!-- Best: 0-10 cp loss -->
  <g transform="translate(30, 150)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#34d399" font-size="18" font-weight="800" font-family="system-ui">!</text>
    <text x="54" y="34" fill="#34d399" font-size="15" font-weight="700" font-family="system-ui">Best</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp de perte · Vous avez égalé le premier choix du moteur</text>
  </g>
  <!-- Good: 10-25 cp loss -->
  <g transform="translate(30, 210)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.05" stroke="#10b981" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#6ee7b7" font-size="18" font-weight="800" font-family="system-ui">✓</text>
    <text x="54" y="34" fill="#6ee7b7" font-size="15" font-weight="700" font-family="system-ui">Good</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">10-25 cp de perte · Jeu solide, légèrement sous-optimal mais reste dans la logique de la position</text>
  </g>
  <!-- Book: 0-12 cp in first 15 moves -->
  <g transform="translate(30, 270)">
    <rect width="660" height="54" rx="10" fill="#94a3b8" fill-opacity="0.06" stroke="#94a3b8" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#cbd5e1" font-size="18" font-weight="800" font-family="system-ui">DB</text>
    <text x="54" y="34" fill="#cbd5e1" font-size="15" font-weight="700" font-family="system-ui">Book</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-12 cp de perte · Coups 1-15 suivant la théorie d'ouverture connue — le moteur traite comme niveau livre</text>
  </g>
  <!-- Inaccuracy: 25-75 cp loss -->
  <g transform="translate(30, 330)">
    <rect width="660" height="54" rx="10" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fbbf24" font-size="18" font-weight="800" font-family="system-ui">?!</text>
    <text x="54" y="34" fill="#fbbf24" font-size="15" font-weight="700" font-family="system-ui">Inaccuracy</text>
    <text x="200" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">25-75 cp de perte · Un petit glissement — pas perdant, mais manquant une meilleure option. Vous a coûté environ un demi-pion.</text>
  </g>
  <!-- Mistake: 75-200 cp loss -->
  <g transform="translate(30, 390)">
    <rect width="660" height="54" rx="10" fill="#f97316" fill-opacity="0.08" stroke="#f97316" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fb923c" font-size="18" font-weight="800" font-family="system-ui">?</text>
    <text x="54" y="34" fill="#fb923c" font-size="15" font-weight="700" font-family="system-ui">Mistake</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">75-200 cp de perte · Une vraie erreur ayant coûté 1-2 pions. À revoir.</text>
  </g>
  <!-- Blunder: 200+ cp loss -->
  <g transform="translate(30, 450)">
    <rect width="660" height="54" rx="10" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#f87171" font-size="18" font-weight="800" font-family="system-ui">??</text>
    <text x="54" y="34" fill="#f87171" font-size="15" font-weight="700" font-family="system-ui">Blunder</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">200+ cp de perte · Une lourde erreur — pièce en prise, tactique gagnante manquée, ou affaiblissement fatal de votre position</text>
  </g>
</svg>
</div>

### Q : Comment les badges se connectent à votre rapport de partie

Quand vous importez une partie sur FireChess et lancez l'analyse, le panneau récapitulatif en haut de la page vous montre une ventilation :

- **Blancs 78,7% de précision · Best 11 · Book 8 · Good 3 · Blunder 2 · ACPL 43,2**
- **Noirs 75,5% de précision · Best 8 · Book 6 · Good 3 · Inaccuracy 2 · Mistake 1 · Blunder 3 · ACPL 50,6**

Chacun de ces comptes est une traduction directe des plages de perte de centipions. Un « Blunder » signifie que ce coup avait 200+ de perte de centipions. Un « Mistake » signifie 75-200 cp. Une « Inaccuracy » signifie 25-75 cp. L'ACPL en bas moyenne tout cela en un chiffre unique.

**Ce que ce tableau vous dit instantanément :**

- Le coup 13.e5? montre un badge ?? — c'est un blunder avec 200+ de perte de centipions
- Le coup 6.Nxf7! montre un badge ! — meilleur coup, 0-10 cp de perte
- Le coup 18.Bxd4 montre un badge ✓ — bon coup, 10-25 cp de perte, solide mais pas le meilleur absolu

C'est le lien entre le chiffre abstrait de perte de centipions et le badge concret que vous voyez sur votre écran. Quand vous jouez votre prochaine partie et l'importez sur FireChess, chaque badge que vous voyez est alimenté par la perte de centipions sous le capot.

---

## À quoi ressemblent différentes valeurs de perte de centipions sur l'échiquier

Les chiffres sur une page sont abstraits. Mettons-les sur un vrai échiquier pour que vous puissiez voir ce que représentent différents scores de perte de centipions. Si vous voulez voir ces plages mappées aux niveaux de classement, notre [guide ACPL par niveau](/blog/average-centipawn-loss-by-rating) a la ventilation complète.

### Perte de centipions 0-15 : Un jeu quasi parfait

À ce niveau, vous trouvez le meilleur coup ou quelque chose de proche. C'est la plage de performance de grand maître dans la plupart des positions. Une perte de 10 centipions signifie que vous avez joué un coup objectivement presque aussi bon que le premier choix du moteur — peut-être avez-vous choisi une case légèrement moins optimale pour votre fou, ou une avancée de pion différente mais toujours correcte.

Badges FireChess à ce niveau : **Brilliant (!!)** ou **Best (!)**.

### Perte de centipions 15-40 : Petites imprécisions

C'est la plage des forts joueurs de club et experts (classement 1800-2200). Vous ne blunder pas — vous ne trouvez simplement pas la continuation la plus précise. Une perte de 25 centipions signifie typiquement que vous avez joué un coup de développement solide quand un coup plus agressif ou plus subtil était disponible.

Badge FireChess à ce niveau : **Inaccuracy (?!)** — le badge jaune.

### Perte de centipions 40-80 : Erreurs claires

C'est la plage de perte de centipions la plus courante pour les joueurs de club intermédiaires (1200-1600). Vous faites des erreurs qui abandonnent environ un demi-pion à un pion entier d'avantage. Ce sont souvent des erreurs positionnelles — mal placer une pièce, échanger les mauvaises pièces, ou pousser un pion qui crée une faiblesse.

Badge FireChess à ce niveau : **Mistake (?)** — le badge orange.

### Perte de centipions 80-150 : Blunders

Une perte de centipions supérieure à 80 est presque toujours une erreur tactique ou un mauvais jugement positionnel sévère. Au-dessus de 100 cp, vous avez essentiellement abandonné un pion entier d'avantage — souvent par une pièce en prise, une fourchette manquée, ou une concession positionnelle sérieuse.

Badge FireChess à ce niveau : **Blunder (??)** — le badge rouge.

### Perte de centipions 150+ : Erreurs perdantes

À ce niveau, vous avez probablement perdu une pièce complète ou permis une attaque décisive. Une perte de centipions de 300+ signifie presque toujours que vous avez laissé un cavalier ou un fou en prise, manqué un mat forcé, ou marché dans une tactique dévastatrice.

<chess-position fen="rnb1kbnr/pppp1ppp/8/3q4/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4" caption="La dame noire vient d'être capturée par le pion en e4 après que les Noirs aient blunder en la déplaçant en d5 sans considérer la capture de pion sur cette case. Perte de centipions pour les Noirs : +950 cp — une dame entière perdue." analysis="true" badge="blunder" arrows="e4d5:red"></chess-position>

---

## Comment la perte de centipions se traduit en précision (et vice versa)

De nombreuses plateformes d'analyse d'échecs, y compris FireChess, affichent à la fois un **pourcentage de précision** et une **perte moyenne de centipions (ACPL)** pour chaque partie. On demande souvent : « Ne sont-ils pas la même chose ? »

Ils sont corrélés, mais mesurent des choses différentes.

**La perte moyenne de centipions** est la moyenne mathématique brute de combien de centipions vous avez abandonnés par coup. C'est un nombre absolu — 55 ACPL signifie la même chose d'une partie à l'autre, indépendamment de la position aiguë ou calme.

**Le pourcentage de précision** est un score normalisé qui convertit la perte de centipions en une échelle de 0-100% basée sur la proximité de vos coups avec ceux du moteur. Il est conçu pour être plus intuitif : 95% de précision signifie que vous avez joué à un niveau d'élite ; 60% signifie que vous étiez en difficulté.

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
  <text x="360" y="35" text-anchor="middle" fill="#f1f5f9" font-size="17" font-weight="700" font-family="system-ui">Conversion ACPL → Précision</text>
  <text x="360" y="55" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Précision typique pour une perte moyenne de centipions donnée. Courbe car les blunders tirent l'ACPL plus que la précision.</text>
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
  <text x="360" y="328" fill="#64748b" font-size="11" font-family="system-ui" text-anchor="middle">Perte moyenne de centipions (ACPL)</text>
  <!-- Conversion curve -->
  <path d="M 80 105 Q 192 118 304 155 Q 416 200 528 245 Q 584 268 640 288" stroke="url(#convLine)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Data points -->
  <circle cx="80" cy="105" r="5" fill="#10b981"/>
  <text x="80" y="95" fill="#10b981" font-size="10" font-family="system-ui" text-anchor="middle">GM</text>
  <circle cx="192" cy="118" r="5" fill="#10b981"/>
  <text x="192" y="108" fill="#10b981" font-size="10" font-family="system-ui" text-anchor="middle">Maître</text>
  <circle cx="304" cy="155" r="5" fill="#f59e0b"/>
  <text x="304" y="145" fill="#f59e0b" font-size="10" font-family="system-ui" text-anchor="middle">Expert</text>
  <circle cx="416" cy="200" r="5" fill="#f59e0b"/>
  <text x="416" y="190" fill="#f59e0b" font-size="10" font-family="system-ui" text-anchor="middle">Club</text>
  <circle cx="528" cy="245" r="5" fill="#ef4444"/>
  <text x="528" y="235" fill="#ef4444" font-size="10" font-family="system-ui" text-anchor="middle">Occasionnel</text>
  <circle cx="640" cy="288" r="5" fill="#ef4444"/>
  <text x="640" y="278" fill="#ef4444" font-size="10" font-family="system-ui" text-anchor="middle">Débutant</text>
</svg>
</div>

| ACPL | Précision typique (FireChess) | Mélange de badges typique | Ce que ça signifie |
|------|------------------------------|--------------------------|-------------------|
| 10-20 | 95-99% | Surtout !!, !, ✓ | Niveau grand maître |
| 25-35 | 90-94% | !, ✓, peu de ?! | Niveau Maître / MI |
| 40-50 | 85-89% | !, ✓, certains ?! et ? | Expert / fort club |
| 55-70 | 78-84% | Mélange de !, ✓, ?, ?! | Joueur de club (1400-1600) |
| 70-90 | 72-78% | Plus de ?, ?!, occasionnel ?? | Joueur de club occasionnel |
| 90-150 | 65-72% | ? et ?? fréquents | Débutant / intermédiaire |
| 150+ | En dessous de 65% | Beaucoup de ??, blunders changeant la partie | Débutant complet |

La relation n'est pas parfaitement linéaire. Une partie avec un blunder de 300 centipions et 39 coups parfaits pourrait vous donner 55 ACPL mais 94% de précision. Le blunder tire l'ACPL plus que le pourcentage, car la précision pénalise lourdement les blunders mais pas infiniment.

**Conseil pratique :** Utilisez l'ACPL pour suivre l'amélioration à long terme (plus granulaire) et la précision pour des comparaisons rapides entre parties (plus intuitive). Quand vous consultez votre rapport FireChess, regardez les comptes de badges en haut — si vous voyez plus de **Blunders (??)** que de **Best (!)**, vous savez exactement où vous concentrer.

Pour une explication plus approfondie de la métrique de précision elle-même, consultez notre guide sur [les scores de précision aux échecs expliqués](/blog/chess-accuracy-score-explained).

---

## Idées reçues sur la perte de centipions

Dissipons les malentendus qui causent le plus de confusion.

### Mythe 1 : « Une faible perte de centipions signifie que j'ai joué parfaitement »

**Réalité :** Une faible perte de centipions signifie que vos coups étaient *proches* du meilleur du moteur — mais seulement dans la profondeur de recherche du moteur. Stockfish à la profondeur 20 peut donner un coup d'évaluation 0,00, et à la profondeur 40 le même coup pourrait être -0,40. De plus, la perte de centipions ne capture pas la difficulté de trouver les coups : une perte de 5 centipions dans une séquence tactique forcée est moins impressionnante qu'une perte de 5 centipions dans une partie de manœuvre positionnelle calme.

### Mythe 2 : « Une erreur de -1,00 est toujours aussi mauvaise qu'une autre de -1,00 »

**Réalité :** La même valeur de centipions peut signifier des choses très différentes selon la position. Perdre 100 centipions dans une position morte-égale signifie que vous êtes passé d'égal à clairement pire — c'est un vrai blunder. Perdre 100 centipions à partir d'une position où vous êtes déjà à -300 centipions (pièce perdue) est presque insignifiant — vous êtes passé de perdant à perdant.

C'est pourquoi les moteurs d'échecs rapportent **l'évaluation avant et après** votre coup, pas seulement le delta. Une position -5,00 où vous jouez un coup -5,20 : la perte de centipions n'est que de 20, mais vous êtes quand même mort-perdu.

### Mythe 3 : « Vous devriez essayer d'obtenir 0 de perte de centipions à chaque partie »

**Réalité :** Même Magnus Carlsen moyenne 15-25 ACPL en parties classiques. Les êtres humains ne jouent pas comme des moteurs — et ils ne devraient pas essayer. L'objectif n'est pas la perfection (qui n'existe pas dans un contexte humain) ; l'objectif est de **réduire vos plus grandes erreurs**. Une partie avec 38 coups solides et un blunder de 200 centipions est une partie à analyser ; une partie avec 40 coups moyennant chacun 45 centipions de perte est une partie où vous avez joué à votre niveau de manière constante.

### Mythe 4 : « La perte de centipions est comparable entre différents cadres de temps »

**Réalité :** Comme nous le couvrons dans notre [guide ACPL par niveau](/blog/average-centipawn-loss-by-rating), votre perte de centipions s'enflamme dramatiquement quand l'horloge tourne. Un joueur qui moyenne 40 ACPL en classique pourrait moyenner 70 en blitz et 110 en bullet. Comparez toujours dans le même cadre de temps.

### Mythe 5 : « Tous les moteurs donnent la même perte de centipions »

**Réalité :** Différents moteurs et même différents paramètres de moteur produisent des chiffres de perte de centipions différents pour la même partie. Stockfish 18 à la profondeur 22 rapportera des évaluations différentes de Stockfish 16 à la profondeur 18. Les évaluations de Lichess tendent à être plus clémentes que celles de Chess.com ou FireChess à cause des différences de profondeur.

<chess-position fen="r1bqk2r/pppp1ppp/2n5/4P3/2B5/5N2/PPP2PPP/RNBQK2R b KQkq - 0 5" caption="Les Blancs ont un pion net grâce au pion e5, avec un fort centre et des pièces développées. L'avantage en centipions ici est d'environ +100-120 cp. La tâche des Noirs est de minimiser les pertes supplémentaires." analysis="true" badge="mistake" arrows="e4e5:green"></chess-position>

---

## Comment utiliser la perte de centipions dans l'analyse de vos parties

C'est là que la théorie devient pratique. Voici un workflow pas à pas pour utiliser la perte de centipions pour réellement progresser — en utilisant les badges FireChess comme guide visuel. Pour une ventilation complète de ce que la précision et l'ACPL représentent à chaque niveau, consultez notre [guide des repères de précision par niveau](/blog/chess-accuracy-by-rating-guide).

### Étape 1 : Importez votre partie sur FireChess

Importez des parties depuis Lichess, Chess.com, ou collez un PGN dans [l'outil d'analyse FireChess](/analyze). FireChess analyse chaque coup et produit un rapport avec la perte de centipions par coup, par phase, et par ouverture. Le panneau récapitulatif montre immédiatement votre ventilation de badges — Best, Book, Good, Inaccuracy, Mistake, Blunder pour les deux joueurs.

### Étape 2 : Trouvez vos plus gros coups individuels

Scannez la liste des coups pour les badges **rouges Blunder (??)** et **orange Mistake (?)**. Ce sont vos points chauds de perte de centipions. Les 3-5 premiers coups (vos plus grandes erreurs) sont là où vous devriez concentrer votre attention. **Ne dispersez pas votre temps d'étude limité sur chaque imprécision de 20 centipions — trouvez les blunders de 200 centipions et corrigez-les d'abord.**

### Étape 3 : Catégorisez l'erreur

Pour chaque grosse erreur, demandez-vous :
- Était-ce un **blunder tactique** (fourchette, clouage, enfilade manqués) ?
- Était-ce une **erreur positionnelle** (mauvaise case, mauvais échange) ?
- Était-ce la **pression du temps** (drapeau, moins de 30 secondes) ?
- Était-ce une **erreur d'ouverture** (mauvaise réponse à quelque chose d'inconnu) ?

Catégorisez chacune. Après 10 parties, des schémas émergeront. Si chaque grosse erreur est tactique, votre entraînement tactique devrait être prioritaire. Si chaque grosse erreur est à l'ouverture, vous avez besoin de préparation d'ouverture. Si la pression du temps est la coupable, travaillez la gestion du temps.

### Étape 4 : Calculez votre ACPL phase par phase

Ne regardez pas seulement la moyenne globale. Décomposez-la :

| Phase | Votre ACPL | ACPL cible (Votre niveau) |
|-------|-----------|--------------------------|
| Ouverture (1-15) | | |
| Milieu de partie (16-35) | | |
| Finale (36+) | | |

La plupart des joueurs de club découvrent que leur ACPL en milieu de partie est 1,5x à 2x leur ACPL à l'ouverture. Cela vous indique exactement où votre temps d'entraînement devrait aller. Si vous avez 35 ACPL à l'ouverture mais 80 ACPL en milieu de partie, vous n'avez pas besoin de plus d'étude d'ouverture — vous avez besoin de reconnaissance de schémas en milieu de partie.

### Étape 5 : Suivez votre ACPL dans le temps

L'ACPL est un **indicateur avancé** de progression. Votre classement peut stagner pendant des semaines pendant que votre ACPL baisse lentement — et puis votre classement rattrape. Suivez votre ACPL mensuel plutôt que votre classement quotidien, et vous verrez des progrès même avant que votre classement bouge. Surveillez la distribution de vos badges évoluer : moins de **??** et **?**, plus de **!** et **!!**.

| Mois | ACPL | Classement | Tendance des badges | Notes |
|------|------|-----------|-------------------|-------|
| Mois 1 | 72 | 1420 | 5??, 8? par partie | Référence |
| Mois 2 | 65 | 1450 | 3??, 6? par partie | Le travail tactique porte ses fruits |
| Mois 3 | 58 | 1510 | 1??, 4? par partie | Amélioration claire |
| Mois 4 | 55 | 1530 | 0??, 3? par partie | Plateau — temps pour l'étude positionnelle |

---

## Différences entre plateformes : Lichess vs. Chess.com vs. FireChess

Si vous avez analysé la même partie sur plusieurs plateformes, vous avez probablement remarqué des chiffres ACPL différents. Ce n'est pas un bug — c'est une caractéristique de différentes configurations de moteur.

| Plateforme | Moteur | Profondeur typique | Biais ACPL | Badges de coups ? |
|-----------|--------|-------------------|-----------|------------------|
| Lichess | Stockfish (divers) | 22 demi-coups | ~10% plus bas (plus clément) | Oui (inaccuracy/mistake/blunder) |
| Chess.com | Cloud Stockfish | 25-30 demi-coups | Référence | Oui (brilliant/best/good/book/inaccuracy/mistake/blunder) |
| FireChess | Stockfish 18 | Profondeur équilibrée | Comparable à Chess.com | Oui — système complet à 7 badges (!!, !, ✓, DB, ?!, ?, ??) |

**Pourquoi la différence :** Un moteur plus faible ou une profondeur moindre voit moins de possibilités tactiques, donc il considère plus de coups « suffisamment bons » comme égaux au meilleur coup. Votre perte de centipions apparaît plus basse parce que le moteur ne vous pénalise pas aussi sévèrement pour avoir manqué une tactique profonde de 25 coups.

**Ce que cela signifie pour vous :** Comparez toujours par rapport à vos propres données historiques sur la *même plateforme*. Ne comparez pas votre ACPL Lichess de 55 à l'ACPL Chess.com de 55 d'un ami — ils sont mesurés différemment. Utilisez FireChess de manière constante pour votre suivi de progression et apprenez à lire le système de badges — c'est le plus granulaire de toutes les plateformes. Pour une comparaison plus approfondie des plateformes d'analyse, consultez notre [guide d'amélioration Lichess vs. Chess.com](/blog/lichess-vs-chess-com-improvement).

---

## FAQ : Réponses rapides aux questions courantes

### Q : Qu'est-ce qu'une bonne perte moyenne de centipions ?

Cela dépend entièrement de votre classement et de votre cadre de temps. Pour un joueur classé 1500 en rapide, tout en dessous de 60 est bien. Pour un joueur classé 2000, en dessous de 45 est attendu. Consultez notre [tableau ACPL par niveau](/blog/average-centipawn-loss-by-rating) pour des repères détaillés.

### Q : La perte de centipions est-elle la même chose que la précision ?

Non. Le pourcentage de précision est un score normalisé (0-100%) basé sur la perte de centipions. La perte de centipions est la mesure mathématique brute. Ils sont fortement corrélés mais pas identiques. Les badges de coups FireChess se situent entre les deux — les badges traduisent la perte de centipions en une étiquette lisible par l'humain. Pour une ventilation complète du fonctionnement de la précision, consultez notre [guide du score de précision aux échecs](/blog/chess-accuracy-score-explained).

### Q : Que signifie la perte moyenne de centipions ?

La perte moyenne de centipions (ACPL) est la différence moyenne par coup entre le coup que vous avez joué et le meilleur coup du moteur, mesurée en centipions (1/100 d'un pion). Si votre ACPL est de 60, cela signifie qu'en moyenne chaque coup que vous avez joué était de 60 centipions — environ 0,6 pion — pire que le premier choix du moteur. Plus bas est mieux : les grands maîtres moyennent 15-25 ACPL, tandis que les joueurs de club obtiennent typiquement 50-80. FireChess traduit la perte de centipions de chaque coup en un badge coloré (Best, Inaccuracy, Blunder, etc.) pour que vous puissiez voir d'un coup d'œil où vous avez le plus perdu. Consultez notre [guide ACPL par niveau](/blog/average-centipawn-loss-by-rating) pour des repères à chaque niveau.

### Q : Qu'est-ce qu'une perte de centipions de 100 ?

Une perte de centipions de 100 signifie que vous avez abandonné l'équivalent d'un pion entier d'avantage en un seul coup. C'est un vrai blunder dans la plupart des positions. FireChess le marque d'un badge rouge **?? Blunder**.

### Q : Que signifient les badges de coups sur FireChesse ?

Chaque badge correspond à une plage de perte de centipions :
- **!! Brilliant** (0-10 cp, sacrifice qui fonctionne) — badge cyan
- **! Best** (0-10 cp, égalant le premier choix du moteur) — badge vert
- **✓ Good** (10-25 cp, solide mais pas le meilleur absolu) — badge vert clair
- **DB Book** (0-12 cp, 15 premiers coups, théorie connue) — badge gris
- **?! Inaccuracy** (25-75 cp, petit glissement) — badge jaune
- **? Mistake** (75-200 cp, vraie erreur) — badge orange
- **?? Blunder** (200+ cp, lourde erreur) — badge rouge

### Q : Pourquoi ma perte de centipions varie-t-elle autant entre les parties ?

C'est normal. Une partie où vous faites face à une Sicilienne aiguë et devez calculer des tactiques complexes produira naturellement une perte de centipions plus élevée qu'une partie de Gambit de la Dame lente où vous jouez la théorie connue pendant 20 coups. Moyennez sur 10+ parties avant de tirer des conclusions.

### Q : Combien de parties faut-il pour une lecture ACPL fiable ?

Au moins 10 parties dans le même cadre de temps. Une seule partie a trop de variance due à l'ouverture spécifique, l'adversaire et les circonstances. Dix parties lissent le bruit. Les comptes de badges se stabiliseront aussi sur 10+ parties.

### Q : La perte de centipions peut-elle être négative ?

Non. La perte de centipions est définie comme la différence absolue entre l'évaluation de votre coup et celle du meilleur coup. C'est toujours un nombre non négatif. Certaines plateformes affichent « 0 » pour le meilleur coup, signifiant zéro centipion perdu.

### Q : La perte de centipions compte-t-elle dans les positions complètement gagnantes ?

Elle compte moins. Quand vous avez une dame et une tour d'avance, une imprécision de 100 centipions est insignifiante. Concentrez votre analyse sur les positions critiques — où la partie était équilibrée et une erreur a changé l'issue. Notre [guide ACPL par niveau](/blog/average-centipawn-loss-by-rating) montre quelles plages de perte de centipions affectent réellement votre taux de victoire à chaque niveau.

### Q : La perte de centipions est-elle utile pour les ouvertures ?

Partiellement. La perte de centipions à l'ouverture tend à être très basse parce qu'il y a une théorie établie. Une perte de centipions élevée à l'ouverture signifie généralement que vous avez quitté le livre et fait une erreur. Plus utile est de suivre votre perte de centipions *après avoir quitté la théorie* — c'est une mesure de votre compréhension des positions de milieu de partie résultantes. Sur FireChess, les coups d'ouverture montrent typiquement des badges **DB (Book)** jusqu'au coup 15 ou jusqu'à une divergence précoce. Si votre perte de centipions à l'ouverture est constamment élevée, utilisez le [scanner de faiblesses d'ouverture](/blog/how-to-find-opening-weaknesses) pour trouver quelles lignes vous coûtent.

### Q : Comment lire le récapitulatif des badges en haut de mon rapport FireChess ?

Le panneau récapitulatif vous montre : pourcentage de précision, comptes de badges par type, et ACPL. Par exemple : « Blancs 78,7% de précision · Best 11 · Book 8 · Good 3 · Blunder 2 · ACPL 43,2 ». Cela signifie que les Blancs ont joué 11 coups parfaits, 8 coups de livre, 3 bons coups, et 2 blunders. La perte moyenne était de 43,2 centipions par coup. Plus de Best (!) que de Blunders (??) est toujours bon signe. Importez une partie sur [FireChess à /analyze](/analyze) pour voir votre propre ventilation de badges.

### Q : Le badge Brilliant (!!) est-il le même qu'un coup Best (!) ?

Non. Un coup Brilliant (!!) est un type spécifique de coup Best — c'est un sacrifice de pièce où le moteur confirme que le sacrifice fonctionne réellement (l'évaluation s'améliore après le sacrifice). Tous les meilleurs coups ne sont pas brillants. En pratique, les coups Brilliant sont rares — vous pourriez en voir 1-2 sur 20 parties. Un coup Best (!) signifie simplement que vous avez égalé le premier choix du moteur.

---

## Tableau de référence rapide : Perte de centipions par impact

| Perte de centipions | Classification | Badge FireChess | Cause typique | Impact sur la partie |
|---------------------|---------------|-----------------|---------------|---------------------|
| 0-15 | Excellent | !! ou ! | Meilleur coup ou quasi-meilleur | Négligeable |
| 15-25 | Bon | ✓ | Légèrement sous-optimal mais solide | Petit avantage perdu |
| 25-75 | Imprécision | ?! | Imprécision positionnelle mineure | Petit avantage perdu |
| 75-200 | Erreur | ? | Erreur tactique ou positionnelle | Avantage notable perdu |
| 200-300 | Blunder | ?? | Pièce en prise, tactique manquée | Souvent décisif |
| 300+ | Blunder sévère | ?? | Pièce perdue, concession positionnelle fatale | Perd généralement |
| 900+ | Désastre | ?? | Dame perdue, mat forcé manqué | Partie terminée |

---

## Conclusion : Du chiffre à l'amélioration

La perte de centipions est, au fond, un outil — pas un jugement. Un chiffre comme « 72 ACPL » ne dit rien en soi. Mais 72 ACPL *en tendance vers 60* dit que vous progressez. Un blunder de 150 centipions *dans le même schéma sur trois parties* dit exactement quoi étudier. Un pic d'ACPL *en milieu de partie mais pas à l'ouverture* dit où investir votre temps d'entraînement.

Le système de badges FireChess est la traduction visuelle de tout cela. Quand vous voyez un **??** rouge à côté du coup 23, vous savez instantanément : ce coup vous a coûté. Quand vous voyez un **!!** cyan à côté du coup 31, vous savez : vous avez trouvé quelque chose de spécial. Les chiffres de perte de centipions en dessous sont la comptabilité précise du moteur — mais les badges sont ce qui le rend intuitif.

Les joueurs qui progressent le plus vite ne sont pas ceux avec la plus faible perte de centipions. Ce sont ceux qui **utilisent** les données de perte de centipions pour trouver leurs faiblesses spécifiques et les cibler. Ils regardent la ventilation des badges après chaque partie et demandent : « D'où viennent mes blunders ? »

Importez votre prochaine partie sur FireChess, analysez la ventilation de la perte de centipions par phase, et trouvez le schéma unique qui vous coûte le plus de badges. Corrigez cette chose. Regardez votre ACPL baisser. Regardez votre classement suivre.

*Prêt à analyser vos parties ? Utilisez [l'outil d'analyse FireChess](/analyze) pour obtenir une ventilation gratuite de la perte de centipions avec des rapports phase par phase — complète avec des badges de coups pour chaque coup.*
