---
title: "Score de précision aux échecs expliqué : ce que 90%+ signifie réellement"
description: "Que signifie réellement votre score de précision aux échecs ? Comment il est calculé, ce que 90%+ vous dit vraiment, et pourquoi la précision diffère de la perte de centipions."
date: "2026-07-25"
author: "FireChess Team"
tags: ["analyse", "fondamentaux", "perte-centipions"]
canonical: https://firechess.com/fr/blog/chess-accuracy-score-explained
---

Vous terminez une partie et le rapport de précision indique 94,2%. C'est bien ? Excellent ? Et pourquoi votre adversaire affiche 91,7% alors qu'il a perdu ?

Les scores de précision sont l'une des métriques les plus mal comprises aux échecs. Décortiquons exactement ce qu'ils signifient — et ce qu'ils ne signifient pas.

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
  <text x="340" y="38" text-anchor="middle" fill="white" font-size="18" font-weight="700" letter-spacing="0.3" font-family="system-ui">Ventilation du score de précision</text>
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
    <text y="30" text-anchor="middle" fill="white" font-size="32" font-weight="800" font-family="system-ui" filter="url(#acGlow)">94,2%</text>
    <text y="50" text-anchor="middle" fill="#a5b4fc" font-size="13" font-family="system-ui">Précision</text>
    <!-- Scale labels -->
    <text x="-96" y="16" fill="#ef4444" font-size="11" text-anchor="middle" font-family="system-ui">0</text>
    <text x="0" y="-98" fill="#f59e0b" font-size="11" text-anchor="middle" font-family="system-ui">50</text>
    <text x="96" y="16" fill="#10b981" font-size="11" text-anchor="middle" font-family="system-ui">100</text>
  </g>
  <!-- Rating brackets (right panel) -->
  <g transform="translate(420, 60)">
    <text fill="#94a3b8" font-size="12" font-weight="600" font-family="system-ui" letter-spacing="0.3">PRÉCISION TYPIQUE PAR NIVEAU</text>
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

## Comment la précision est calculée

Les scores de précision aux échecs — que ce soit de Lichess, Chess.com, ou FireChess — sont tous construits sur le même concept : la [perte de centipions](/blog/what-is-centipawn-loss).

Voici la formule en termes simples :

1. Pour chaque coup que vous avez joué, un moteur évalue la position avant et après.
2. Il compare votre coup au meilleur coup possible trouvé par le moteur.
3. La différence d'évaluation (mesurée en centipions) est votre « perte » pour ce coup.
4. Votre précision est une fonction de la petitesse de votre perte moyenne sur tous les coups.

La formule exacte varie selon la plateforme. Chess.com utilise une fonction de conversion qui mappe la perte moyenne de centipions à un pourcentage de 0 à 100. Lichess utilise une approche similaire. FireChess utilise la perte de centipions brute par coup, regroupée en classifications (brilliant, best, excellent, good, inaccuracy, mistake, blunder).

Pour comprendre la précision, vous devez d'abord comprendre le nombre brut dont elle découle. Si vous n'êtes pas déjà familier avec le concept, lisez notre guide complet : [Qu'est-ce que la perte de centipions ?](/blog/what-is-centipawn-loss) — il couvre comment Stockfish calcule les évaluations et ce que ces chiffres signifient réellement en pratique.

## Pourquoi vous pouvez perdre avec 94% de précision

C'est la plus grande source de confusion. La précision mesure **à quel point vous avez suivi la recommandation du moteur** — pas si vous avez gagné.

Imaginez ce scénario : Votre adversaire a joué un coup d'ouverture légèrement imprécis en début de partie. Vous ne l'avez pas puni de manière optimale, mais vous n'avez pas non plus blunder quoi que ce soit d'évident. Vous avez tous les deux joué à 90%+ de précision. Mais parce que l'imprécision de votre adversaire a créé une position stratégiquement désavantageuse pour lui, il a perdu la finale malgré son score de précision élevé.

La précision vous dit à quel point vous avez joué *étant donné les positions qui sont apparues*. Elle ne vous dit pas :
- Si les positions étaient objectivement égales ou inégales
- Si votre adversaire a créé une pression qui vous a forcé au jeu passif
- Si un blunder d'ouverture au coup 4 vous a mis en position perdante tôt

**Une défaite à 95% de précision signifie souvent que vous avez bien joué mais êtes parti d'une position pire.** Une victoire à 75% de précision signifie souvent que votre adversaire a blunder plus que vous.

C'est aussi pourquoi la **perte moyenne de centipions** et le % de précision racontent des histoires différentes. Deux joueurs peuvent tous les deux obtenir 92% de précision, mais l'un avait une moyenne stable de 20 cp sur tous les coups tandis que l'autre avait beaucoup de coups à 0 cp ponctués d'une seule erreur de 80 cp. Le % de précision semble identique, mais le profil de perte de centipions est complètement différent. Pour en savoir plus sur cette distinction, consultez [comment la perte de centipions est calculée](/blog/what-is-centipawn-loss#how-acpl-is-calculated).

## À quoi ressemble réellement une précision « brillante »

La plupart des joueurs se fixent sur le haut de l'échelle. Alors à quoi ressemble 99%+ de précision ?

C'est essentiellement impossible à maintenir sur une partie entière. Même des moteurs de classe mondiale jouant au même niveau enregistrent quelques pourcents de perte de précision sur 50+ coups. Une partie à 99% de précision signifie généralement :
- La partie était extrêmement courte
- La plupart des « coups » étaient des captures forcées ou des reprises sans vraie décision
- Un joueur gagnait si facilement que chaque « alternative » était catastrophique, faisant de chaque coup un coup optimal

Pour une vraie progression, suivez la **précision moyenne sur 20+ parties**, pas un pic d'une seule partie. Consultez nos [repères de précision par niveau](/blog/chess-accuracy-by-rating-guide) pour comprendre ce que votre précision moyenne signifie à votre niveau.

## Précision vs. Perte de centipions — la différence profonde

Une question courante est : « Si la précision vient de la perte de centipions, pourquoi regarder les deux ? » La réponse courte est que **la précision est une métrique traitée** tandis que **la perte de centipions sont des données brutes** — et chacune sert un but différent.

### Ce que mesure la perte de centipions

La [perte de centipions](/blog/what-is-centipawn-loss) est la différence absolue d'évaluation (en centièmes de pion) entre votre coup choisi et le meilleur coup du moteur. Si Stockfish dit que le meilleur coup donne +1,00 et votre coup donne +0,40, votre perte de centipions pour ce coup est de 60. Simple.

La perte moyenne de centipions (ACPL) est la moyenne de ces différences par coup sur l'ensemble de la partie. C'est un nombre direct, non traité. Il n'y a pas de mise à l'échelle, pas de plafond, pas de courbe — il vous dit simplement, en moyenne, à quel point votre jeu était éloigné de l'optimal.

### Ce que mesure le % de précision

Le % de précision prend ces données brutes de perte de centipions et les passe à travers une **fonction de conversion non linéaire**. Le but de cette conversion est de rendre la métrique plus intuitive : une échelle de 0 à 100 que les humains peuvent saisir immédiatement.

Mais voici le détail critique : **le % de précision n'est pas proportionnel à la perte de centipions**.

### La relation non linéaire

La relation entre votre perte moyenne de centipions et votre % de précision suit une courbe — les petites pertes en haut de l'échelle vous punissent beaucoup plus que les grandes pertes en bas. Cela a de vraies implications pratiques :

| Perte moyenne de centipions | % de précision approximatif | Ce que cela signifie |
|---|---|---|
| 0 cp | 99,9%+ | Jeu moteur parfait — essentiellement inaccessible pour les humains |
| 10 cp | ~93% | Une très bonne partie de club, la plupart des coups étaient excellents ou meilleurs |
| 25 cp | ~82% | Une partie correcte avec quelques imperfections notables |
| 50 cp | ~68% | Plusieurs imprécisions ou une erreur modérée |
| 100 cp | 50% | Erreurs claires ; probablement un blunder ou deux |
| 200 cp | ~32% | Blunders multiples, ou une erreur catastrophique |
| 500 cp | ~15% | Le moteur reconnaît à peine la partie comme du jeu d'échecs |

Le passage de 10 cp à 25 cp (seulement 15 centipions supplémentaires en moyenne) fait tomber votre précision de ~93% à ~82% — un coup de 11 points. Mais le passage de 100 cp à 200 cp (100 centipions supplémentaires) vous fait passer de 50% à 32% — seulement 18 points pour plus de 6× l'augmentation de centipions.

**Pourquoi c'est important :** Un seul coup de 70 cp dans une partie par ailleurs propre (disons, 15 coups à 5 cp chacun) vous donne une moyenne de ~9 cp, ce qui correspond à ~93% de précision. La même erreur de 70 cp dans une partie désordonnée (15 coups moyennant 30 cp) vous donne une moyenne de ~33 cp, ce qui correspond à ~78%. L'erreur vous a coûté de manière identique en termes de moteur, mais son impact sur le % de précision dépend entièrement de la qualité du reste de votre partie.

Le graphique ci-dessous visualise cela directement :

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
  <text x="340" y="32" text-anchor="middle" fill="white" font-size="16" font-weight="700" letter-spacing="0.3">% de précision vs. Perte moyenne de centipions (Relation non linéaire)</text>
  <!-- Plot area: left=70, right=30, top=55, bottom=55 → width=580, height=250 -->
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
  <text x="360" y="350" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="0.3">Perte moyenne de centipions (cp)</text>
  <text x="18" y="180" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="0.3" transform="rotate(-90, 18, 180)">% de précision</text>
  <!-- Fill under curve -->
  <path d="M70 55 L 76 65.2 L 82 81.6 L 88 97.5 L 94 112.5 L 100 126.6 L 106 139.7 L 112 151.9 L 118 163.2 L 124 173.7 L 130 183.5 L 136 192.5 L 142 200.9 L 148 208.6 L 154 215.8 L 160 222.5 L 166 228.7 L 172 234.5 L 178 239.8 L 184 244.8 L 190 249.4 L 196 253.7 L 202 257.7 L 208 261.4 L 214 264.8 L 220 268.0 L 226 270.9 L 232 273.7 L 238 276.2 L 244 278.6 L 250 280.8 L 256 282.8 L 262 284.7 L 268 286.5 L 274 288.2 L 280 289.8 L 286 291.3 L 292 292.7 L 298 294.0 L 304 295.2 L 310 296.3 L 316 297.4 L 322 298.4 L 328 299.4 L 334 300.3 L 340 301.2 L 346 302.0 L 352 302.8 L 358 303.5 L 364 304.2 L 370 304.9 L 376 305.5 L 382 306.1 L 388 306.7 L 394 307.2 L 400 307.7 L 406 308.2 L 412 308.7 L 418 309.1 L 424 309.5 L 430 309.9 L 436 310.3 L 442 310.7 L 448 311.1 L 454 311.4 L 460 311.8 L 466 312.1 L 472 312.4 L 478 312.7 L 484 313.0 L 490 313.3 L 496 313.5 L 502 313.8 L 508 314.1 L 514 314.3 L 520 314.5 L 526 314.8 L 532 315.0 L 538 315.2 L 544 315.4 L 550 315.6 L 556 315.8 L 562 316.0 L 568 316.2 L 574 316.4 L 580 316.6 L 586 316.8 L 592 317.0 L 598 317.1 L 604 317.3 L 610 317.5 L 616 317.6 L 622 317.8 L 628 317.9 L 634 318.1 L 640 318.2 L 646 318.3 L 650 318.5 Z" fill="url(#fillGrad)"/>
  <!-- Curve -- computed polyline from accuracy = 100 / (1 + (cpLoss/100)^1.1) -->
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
    <text x="29" y="130" text-anchor="middle" fill="#10b981" fill-opacity="0.5" font-size="10" transform="rotate(-90, 29, 130)">PLAGE GM</text>
  </g>
  <g transform="translate(186, 55)">
    <rect x="0" y="-2" width="116" height="250" fill="#f59e0b" fill-opacity="0.06" rx="2"/>
    <text x="58" y="130" text-anchor="middle" fill="#f59e0b" fill-opacity="0.5" font-size="10" transform="rotate(-90, 58, 130)">PLAGE CLUB</text>
  </g>
  <g transform="translate(302, 55)">
    <rect x="0" y="-2" width="348" height="250" fill="#ef4444" fill-opacity="0.06" rx="2"/>
    <text x="174" y="130" text-anchor="middle" fill="#ef4444" fill-opacity="0.5" font-size="10" transform="rotate(-90, 174, 130)">PLAGE PERTE IMPORTANTE</text>
  </g>
</svg>
</div>

Message clé : **le % de précision est compressé en haut et étiré en bas.** Une amélioration de 20 cp de 100 cp à 80 cp déplace votre précision de 50% à 57% — modeste. Mais la même amélioration de 20 cp de 20 cp à 0 cp déplace votre précision de 86% à 100% — près de trois fois l'impact. Le moteur punit chaque minuscule déviation par rapport au jeu parfait de manière disproportionnée. C'est une des raisons pour lesquelles les grands maîtres s'obsèdent pour des améliorations apparemment « petites » dans leur jeu : gratter 5 cp de votre moyenne est beaucoup plus difficile au sommet, et la récompense de précision est beaucoup plus abrupte.

## Un exemple concret : Un coup qui change tout

Rendons cela réel avec une position spécifique de la **Défense des deux cavaliers**, une ouverture aiguë où une seule décision peut faire basculer l'évaluation de plusieurs pions.

### La position

> **FEN :** `r1bqkb1r/ppp2ppp/2n5/3Pp3/2B5/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 5`

Cela survient après : **1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5**

```
      Trait aux Blancs ? Non — c'est aux Noirs de jouer.
      ┌─ Position après 5.exd5 ──────────────────────┐
      │  r . b q k b . r                              │
      │  p p p . . p p p                              │
      │  . . n . . . . .                              │
      │  . . . P p . . .                              │
      │  . . B . . . . .                              │
      │  . . . . . N . .                              │
      │  P P P P . P P P                              │
      │  R N B Q K . . R                              │
      │  Trait aux Noirs                               │
      └──────────────────────────────────────────────┘
```

Les Noirs font face à une décision critique. La continuation *correcte* est **Na5** — attaquant le fou clair des Blancs avant qu'il ne puisse infliger des dégâts. Le *blunder* est **Nxd5?**, qui semble naturel (reprenant le pion et centralisant le cavalier) mais tombe dans la célèbre **Attaque du Foie Frit**.

### Les deux chemins

| Chemin | Coup | Éval après | Perte de centipions | Impact sur la précision |
|---|---|---|---|---|
| Meilleur du moteur | **Na5** attaquant le fou | ~+0,9 (Blancs légèrement mieux — les Noirs ont une compensation avec le cavalier mal placé) | 0 cp | ~95%+ pour ce coup |
| Blunder naturel | **Nxd5?** reprenant | ~+3,5 (Blancs gagnent — **7.Nxf7!** suit) | 260 cp | ~25% pour ce coup |
| Alternative solide | **b5** (variante Ulvestad) | ~+0,8 (jouable, aigu) | ~10 cp | ~90% |

La réalité brutale : **Nxd5?** ressemble à un coup de développement normal. Vous capturez le pion, centralisez votre cavalier, restez actif. Mais l'évaluation de Stockfish hurle que vous venez de faire une erreur de 260 centipions — assez pour faire chuter la précision de votre partie d'un potentiel 92% à quelque chose comme 65% en un seul coup.

### Avant et après : Le swing d'évaluation

**Avant le coup des Noirs (position après 5.exd5) :** L'évaluation est d'environ **+0,3** en faveur des Blancs — un léger avantage d'avoir un pion de plus (même si c'est un sacrifice temporaire). La position est encore dans le domaine du jeu d'échecs normal.

**Après Nxd5? (l'erreur des Noirs) :** Les Blancs jouent **7.Nxf7!** — le sacrifice du Foie Frit. Après Kxf7 Qf3+ Ke6, les Blancs n'ont qu'une pièce pour le cavalier sacrifié, mais l'écrasement est irrésistible. L'évaluation bondit à **+3,5+**. Le roi noir est au centre, exposé, et les Blancs ont Qf3 menaçant mat, Nc3 attaquant le cavalier cloué, et toutes les pièces blanches prêtes à se joindre à l'attaque.

**Après Na5 (correct) :** L'évaluation des Blancs est +0,9 — les Blancs ont un avantage stable, mais les Noirs ont un jeu raisonnable. La différence de précision entre les deux continuations est énorme.

Cela illustre une vérité cruciale sur le score de précision : **le moteur juge le coup lui-même, pas votre intention.** Un coup « naturel » qui semble bon à un humain peut être une catastrophe de 260 cp pour Stockfish. Votre % de précision reflètera le jugement du moteur, capturant exactement à quel point votre chemin choisi s'est écarté de l'optimal.

> Cette position et la ligne du Foie Frit sont discutées plus en détail dans notre guide sur la [perte de centipions dans les séquences tactiques](/blog/what-is-centipawn-loss#centipawn-loss-in-tactical-sequences).

## Plongée dans les positions : La précision en action

La théorie est une chose — voyons comment la précision se joue dans de vraies positions. Voici trois positions qui montrent exactement comment la perte de centipions se traduit en précision, et pourquoi le jugement du moteur diverge souvent de l'intuition humaine.

### Position 1 : Le coup à 99% vs. le coup à 70%

<chess-position
  fen="r1bq1r2/ppp2kpp/2n5/3np3/2B5/5N2/PPPP1PPP/RNBQK2R w KQ - 0 7"
  caption="Trait aux Blancs — Nxe5+ et Qf3+ récupèrent tous les deux la pièce, mais le moteur voit une différence de 1,5 pion entre eux."
  orientation="white"
  arrows="b1c3:green,f3e5:red" badge="best"></chess-position>

Cette position survient dans l'Attaque du Foie Frit après **1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5 6.Nxf7 Kxf7**. Les Blancs ont sacrifié une pièce en f7 et doivent maintenant récupérer. Deux coups gagnent — mais le moteur en préfère fortement un.

| Coup | Éval après | Perte de centipions | Précision par coup | Ce qui se passe |
|---|---|---|---|---|
| **Nxe5+** (meilleur du moteur) | **+4,0** — Les Blancs gagnent | 0 cp | **~99%** | Récupère la pièce proprement. Après 7...Kd6 8.Qf3+ Ke6 9.Nxc6, les Blancs ont une pièce de plus avec une position écrasante. |
| **Qf3+** (alternative tentante) | **+2,5** — Les Blancs gagnent toujours | ~150 cp | **~70%** | Récupère aussi la pièce, mais les Noirs obtiennent une position plus coordonnée après 7...Ke6 8.Nxc6 Nxc6, et l'avantage des Blancs est moins dominant. |

Les deux coups mènent à une position gagnante. Mais l'écart de 150 centipions entre eux reflète une vraie différence stratégique : **Nxe5+** récupère la pièce immédiatement avec un échec forçant, maintenant le contrôle total. **Qf3+** retarde la récupération, donnant aux Noirs le temps de se consolider.

La précision par coup capture cela avec précision : ~99% pour Nxe5+ signifie que le moteur le considère essentiellement comme le seul bon coup. ~70% pour Qf3+ signifie qu'une part significative du potentiel de la position a été laissée sur la table. Cet écart — 29 points de pourcentage — porte entièrement sur *à quel point* vous avez converti, pas *si* vous avez converti.

### Position 2 : L'imprécision qui gagne quand même

<chess-position
  fen="8/5k2/8/2pPP3/2P5/2K5/6R1/2r5 w - - 0 1"
  caption="Trait aux Blancs — Rg7+ et Kd6 gagnent tous les deux, mais l'un maximise la précision tandis que l'autre invite un risque inutile."
  orientation="white"
  arrows="c3b3:green,c3d3:red" badge="best"></chess-position>

Les Blancs ont une finale de tour dominante : pions passés connectés sur la 5e rangée, une tour active, et la tour noire coincée à défendre passivement. Deux coups gagnent — mais la différence de précision est révélatrice.

| Coup | Éval après | Perte de centipions | Impact sur la précision de la partie | Ce qui se passe |
|---|---|---|---|---|
| **Rg7+** (meilleur du moteur) | **+9,0** — complètement gagnant | 0 cp | **~92%** | Prend la 7e rangée avec échec. Après 1...Kf8 2.Rf7+ Rxf7 3.exf7, le pion d promeut pendant que le pion e le soutient. |
| **Kd6** (alternative raisonnable) | **+5,5** — gagnant quand même | ~350 cp | **~82%** | Gagne aussi, mais les Noirs obtiennent plus de ressources défensives. La conversion prend plus de temps et nécessite un suivi plus précis. |

Kd6 n'est pas un blunder — c'est clairement gagnant quand même. Mais l'écart de 350 centipions montre que les Blancs ont abandonné une part significative de l'avantage. Dans une partie plus longue, ce terrain perdu pourrait donner aux Noirs des contre-chances qui n'existeraient pas après Rg7+.

**C'est l'idée clé :** même dans une position gagnante, la précision mesure *l'efficacité* de votre conversion. Une partie où vous aviez +9,0 et avez converti à 92% de précision est une qualité de jeu fondamentalement différente d'une où vous aviez +9,0 et avez converti à 82%. Le moteur voit la différence — et votre score de précision aussi.

### Position 3 : La finale où la précision compte le plus

<chess-position
  fen="8/4k3/4P3/4K3/8/8/8/8 b - - 0 1"
  caption="Trait aux Noirs — Kd8 fait nulle. Kf8 perd. Un seul coup fait la différence entre une nulle et une défaite."
  orientation="black"
  arrows="e7e8:green,e7d8:red" badge="best"></chess-position>

C'est une finale roi et pion où les Blancs ont un pion sur la 7e rangée, soutenu par le roi. L'unique tâche des Noirs est de rester devant le pion. Le choix est binaire :

| Coup | Résultat | Perte de centipions | Précision par coup | Pourquoi |
|---|---|---|---|---|
| **Kd8** (correct) | **Nulle** | 0 cp | **~99%** | Bloque le pion de promouvoir. Les Blancs ne peuvent pas progresser — le roi ne peut pas contourner sans abandonner le pion. |
| **Kf8** (perdant) | **Défaite** | ~900 cp | **~5%** | Laisse le pion promouvoir immédiatement avec e8=Q. Partie terminée. |

C'est le cas extrême : la même position, le même joueur, et l'écart de précision entre les deux coups est de **94 points de pourcentage**. En milieu de partie, une erreur de 900 cp pourrait survenir par une omission tactique complexe. Dans une finale comme celle-ci, il n'y a rien à calculer — c'est de la connaissance pure. Vous savez que le pion promeut ou vous ne le savez pas.

**Les finales sont l'endroit où les scores de précision sont les plus brutalement honnêtes.** À l'ouverture, vous pourriez obtenir 90% en suivant la théorie mémorisée. En milieu de partie, des tactiques complexes créent de l'ambiguïté. Mais en finale, chaque coup est une décision claire avec une évaluation claire. Il n'y a nulle part où se cacher. Un seul mauvais coup de roi peut transformer une position nulle en défaite — et votre score de précision le reflètera instantanément.

C'est pourquoi suivre votre précision en finale séparément de votre précision en milieu de partie est si précieux. Si votre précision globale est de 85% mais votre précision en finale est de 70%, vous savez exactement où concentrer votre étude.

## Le problème de phase : Où votre précision chute réellement

La recherche sur les parties amateurs montre constamment que la précision ne chute pas uniformément à travers toutes les phases :

**Ouverture (coups 1–15) :** La plupart des joueurs ont une précision élevée ici parce qu'ils suivent des lignes mémorisées. La précision « semble bonne » mais ne reflète pas le calcul réel — elle reflète la préparation.

**Milieu de partie (coups 15–35) :** C'est là que les chutes les plus aiguës se produisent. Les tactiques se complexifient, la pression du temps monte, et vos schémas mémorisés s'épuisent. Cette phase est le domaine à plus fort effet de levier pour l'amélioration.

**Finale (coups 35+) :** Beaucoup de joueurs perdent aussi en précision ici, mais souvent à cause de la pression accumulée ou d'une position techniquement perdue — pas d'erreurs de calcul.

Quand vous analysez vos parties, regardez la précision *par phase*, pas seulement le chiffre global. L'analyse de perte de centipions peut aider — consultez [suivi de la perte de centipions par phase de partie](/blog/what-is-centipawn-loss#acpl-by-game-phase).

## Comment utiliser la précision pour réellement progresser

1. **Cherchez les coups aberrants.** Triez vos coups par perte de centipions et étudiez les 3 premiers. Ce sont vos décisions les plus coûteuses.

2. **Suivez par système d'ouverture.** Vous pourriez moyenner 88% dans l'Italienne mais seulement 79% dans la Dragon Sicilienne. Cet écart vous indique où votre préparation s'arrête et votre calcul commence.

3. **Comparez des cadres de temps similaires.** Une partie de blitz de 5 minutes à 80% vs. une partie rapide de 15 minutes à 87% est normal. Si votre précision rapide est proche de votre précision blitz, vous n'utilisez pas le temps supplémentaire efficacement. Pour en savoir plus sur l'évolution de la perte de centipions avec le cadre de temps, consultez [perte moyenne de centipions par cadre de temps](/blog/what-is-centipawn-loss#acpl-by-time-control).

4. **Générez un rapport de partie.** FireChess scanne vos N dernières parties depuis Lichess ou Chess.com et regroupe vos chutes de précision en schémas — [fuites d'ouverture](/blog/how-to-find-opening-weaknesses) répétées, angles morts tactiques typiques, échecs de technique en finale — pour que vous puissiez voir les tendances plutôt que des fluctuations individuelles.

5. **Ne poursuivez pas 99%.** Une partie à 99% de précision est généralement une partie courte avec des coups forcés. Visez la constance dans la plage 85–92% sur de nombreuses parties, et utilisez la perte de centipions pour mesurer l'*ampleur* de vos erreurs, pas seulement leur nombre.

Le chiffre de précision seul est une boussole. La [ventilation de la perte de centipions](/blog/what-is-centipawn-loss) est la carte.

## FAQ : Score de précision aux échecs

### Q : Comment trouver mon score de précision ?

Importez vos parties sur [le scanner FireChess à /analyze](/analyze) — il affiche votre précision par coup, la ventilation de perte de centipions, et la distribution des badges (combien de Best, Good, Inaccuracy, Mistake, et Blunder vous avez joués). Vous pouvez scanner des parties depuis Lichess ou Chess.com, ou coller un PGN directement.

### Q : La précision aux échecs est-elle la même chose que le « pourcentage de meilleurs coups » ?

Non. Le % de précision n'est pas simplement « nombre de meilleurs coups divisé par coups totaux ». La plupart des plateformes utilisent une formule pondérée qui tient compte de la gravité de chaque erreur. Un seul blunder de 100 cp tire votre précision vers le bas bien plus que trois imprécisions de 5 cp, même si le « pourcentage de meilleurs coups » les pondérerait de manière égale. Lichess utilise une formule basée sur la somme des carrés des pertes de centipions, tandis que Chess.com applique une courbe sigmoïde à la moyenne.

### Q : Pourquoi ma précision augmente-t-elle parfois après un blunder ?

Elle n'augmente pas — la précision globale de la partie diminue toujours après un blunder comparé à ce qu'elle aurait été. Mais le calcul de précision *par coup* peut produire des résultats contre-intuitifs si le blunder mène à une séquence forcée où tous les coups restants sont évidents. Par exemple, si vous perdez une dame et que tous les coups restants sont des reprises forcées à 0 cp de perte, la précision finale peut sembler plus élevée que prévu — mais elle est toujours inférieure à ce qu'elle aurait été sans le blunder. La distortion vient de la nature forcée du jeu subséquent.

### Q : Quelle est une bonne précision pour mon niveau ?

Consultez le graphique en haut de cet article pour les plages typiques, mais voici des directives générales :

| Niveau | Précision typique | Ce que ça signifie |
|---|---|---|
| Sous 1000 | 60–70% | Erreurs multiples par partie ; blunders toutes les 5-7 coups |
| 1000–1400 | 70–78% | Blunders occasionnels ; jeu d'ouverture incohérent |
| 1400–1800 | 78–85% | Peu de blunders évidents ; les erreurs sont des imprécisions |
| 1800–2200 | 85–92% | Blunders rares ; la plupart des imprécisions sont positionnelles |
| 2200+ (MI/MI) | 92–96% | Une ou deux petites imprécisions par partie |
| 2500+ (GM) | 95–98% | Les coups qui semblent « imprécis » sont souvent des compromis stratégiques |

N'oubliez pas : ces valeurs varient significativement selon le cadre de temps et la complexité de l'ouverture.

### Q : La précision peut-elle être négative ou dépasser 100% ?

Certaines plateformes (comme Chess.com) limitent la précision à 0–100. D'autres (comme Lichess) permettent théoriquement de dépasser légèrement 100% si chaque coup était meilleur que la première suggestion du moteur (ce qui arrive dans de rares cas où le moteur change d'avis entre les itérations). En pratique, les valeurs supérieures à 100% ne sont essentiellement jamais affichées. Les valeurs plafond comme 99,9% apparaissent dans des parties très courtes et forcées. À l'extrême basse, une partie avec des blunders de taille dame peut approcher 0%, bien que la plupart des plateformes n'affichent rien en dessous de 1–5%.

### Q : En quoi la précision diffère-t-elle de la perte de centipions ?

C'est la question la plus courante, et la réponse est que **le % de précision est une transformation compressée et non linéaire de la perte de centipions** :

- **La perte de centipions** sont des données brutes — la différence réelle entre votre coup et le meilleur du moteur, mesurée en centièmes de pion. Elle est additive, linéaire, et directement comparable entre les parties.
- **Le % de précision** est une métrique traitée — elle prend les pertes de centipions, applique une courbe (ou une autre fonction non linéaire), et les mappe à un pourcentage de 0 à 100. Elle est intuitive mais perd l'information sur l'ampleur brute.

Utilisez la perte de centipions quand vous voulez savoir *combien* vous avez perdu par coup. Utilisez le % de précision quand vous voulez un résumé rapide et compréhensible. Pour une progression sérieuse, suivez les deux. Consultez notre ventilation complète dans [Qu'est-ce que la perte de centipions ?](/blog/what-is-centipawn-loss).

---

*Vous voulez trouver où votre précision chute réellement ? Générez un rapport FireChess — il scanne vos parties récentes et vous montre les positions où vous avez le plus perdu de terrain, avec des ventilations de perte de centipions et de précision par coup, par ouverture, par phase, et par cadre de temps.*
