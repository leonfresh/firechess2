---
title: "Puntuación de Precisión en Ajedrez Explicada: Qué Significa Realmente 90%+"
description: "¿Qué significa realmente tu puntuación de precisión en ajedrez? Cómo se calcula, qué te dice realmente 90%+ y por qué la precisión difiere de la pérdida de centipeones."
date: "2026-07-25"
author: "FireChess Team"
tags: ["análisis", "fundamentos", "pérdida-centipeones"]
---

Terminas una partida y el informe de precisión dice 94.2%. ¿Es eso bueno? ¿Excelente? ¿Y por qué tu oponente muestra 91.7% cuando perdió?

Las puntuaciones de precisión son una de las métricas más incomprendidas en el ajedrez. Vamos a desglosar exactamente qué significan —y qué no.

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
  <text x="340" y="38" text-anchor="middle" fill="white" font-size="18" font-weight="700" letter-spacing="0.3" font-family="system-ui">Desglose de Puntuación de Precisión</text>
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
    <text y="50" text-anchor="middle" fill="#a5b4fc" font-size="13" font-family="system-ui">Precisión</text>
    <!-- Scale labels -->
    <text x="-96" y="16" fill="#ef4444" font-size="11" text-anchor="middle" font-family="system-ui">0</text>
    <text x="0" y="-98" fill="#f59e0b" font-size="11" text-anchor="middle" font-family="system-ui">50</text>
    <text x="96" y="16" fill="#10b981" font-size="11" text-anchor="middle" font-family="system-ui">100</text>
  </g>
  <!-- Rating brackets (right panel) -->
  <g transform="translate(420, 60)">
    <text fill="#94a3b8" font-size="12" font-weight="600" font-family="system-ui" letter-spacing="0.3">PRECISIÓN TÍPICA POR PUNTUACIÓN</text>
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

## Cómo se Calcula la Precisión

Las puntuaciones de precisión en ajedrez —ya sea de Lichess, Chess.com o FireChess— se construyen todas sobre el mismo concepto: **[pérdida de centipeones](/blog/what-is-centipawn-loss)**.

Aquí está la fórmula en palabras simples:

1. Para cada jugada que hiciste, un motor evalúa la posición antes y después.
2. Compara tu jugada con la mejor jugada posible que encontró el motor.
3. La diferencia en evaluación (medida en centipeones) es tu "pérdida" para esa jugada.
4. Tu precisión es una función de cuán pequeña fue tu pérdida promedio en todas las jugadas.

La fórmula exacta varía por plataforma. Chess.com usa una función de conversión que mapea la pérdida promedio de centipeones a un porcentaje de 0–100. Lichess usa un enfoque similar. FireChess usa la pérdida de centipeones bruta por jugada, agrupada en clasificaciones (brillante, mejor, excelente, buena, imprecisión, error, grave).

Para entender la precisión, primero necesitas entender el número bruto del que proviene. Si aún no estás familiarizado con el concepto, lee nuestra guía completa: [¿Qué es la Pérdida de Centipeones?](/blog/what-is-centipawn-loss) —cubre cómo Stockfish calcula evaluaciones y qué significan esos números en términos prácticos.

## Por Qué Puedes Perder con 94% de Precisión

Esta es la mayor fuente de confusión. La precisión mide **cuán cerca seguiste la recomendación del motor** —no si ganaste.

Imagina este escenario: Tu oponente jugó una apertura ligeramente imprecisa al principio de la partida. No la castigaste de manera óptima, pero tampoco cometiste un grave obvio. Ambos jugaron con 90%+ de precisión. Pero como la imprecisión de tu oponente creó una posición estratégicamente desventajosa para él, perdió el final a pesar de su alta puntuación de precisión.

La precisión te dice qué tan bien jugaste *dadas las posiciones que surgieron*. No te dice:
- Si las posiciones eran objetivamente iguales o desiguales
- Si tu oponente creó presión que te forzó a un juego pasivo
- Si un grave de apertura desde la jugada 4 te puso en una posición perdedora temprano

**Una pérdida con 95% de precisión a menudo significa que jugaste bien pero empezaste desde una peor posición.** Una victoria con 75% de precisión a menudo significa que tu oponente cometió más graves que tú.

Esta es también la razón por la que el **promedio de pérdida de centipeones** y el % de precisión cuentan historias diferentes. Dos jugadores podrían ambos marcar 92% de precisión, pero uno tuvo un promedio estable de 20 cp en todas las jugadas mientras que el otro tuvo muchas jugadas de 0 cp interrumpidas por un solo error de 80 cp. El % de precisión se ve igual, pero el perfil de pérdida de centipeones es completamente diferente. Para más sobre esta distinción, consulta [cómo se calcula la pérdida de centipeones](/blog/what-is-centipawn-loss#how-acpl-is-calculated).

## Cómo se Ve Realmente una Precisión "Brillante"

La mayoría de los jugadores se fijan en la parte superior de la escala. Entonces, ¿cómo se ve 99%+ de precisión?

Es esencialmente imposible de mantener a lo largo de toda una partida. Incluso motores de clase mundial jugando al mismo nivel registran unos puntos porcentuales de pérdida de precisión en 50+ jugadas. Una partida con 99% de precisión generalmente significa:
- La partida fue extremadamente corta
- La mayoría de las "jugadas" fueron capturas forzadas o recapturas sin decisión real
- Un jugador estaba ganando tan fácilmente que cada "alternativa" era catastrófica, haciendo que cada jugada contara como óptima

Para una mejora real, rastrea la **precisión promedio en 20+ partidas**, no un pico de una sola partida. Consulta nuestros [puntos de referencia de precisión por puntuación](/blog/chess-accuracy-by-rating-guide) para entender qué significa tu precisión promedio a tu nivel.

## Precisión vs. Pérdida de Centipeones — la Diferencia Más Profunda

Una pregunta común es: "Si la precisión proviene de la pérdida de centipeones, ¿por qué mirar ambas?" La respuesta corta es que **la precisión es una métrica procesada** mientras que **la pérdida de centipeones son datos brutos** —y cada una sirve a un propósito diferente.

### Qué Mide la Pérdida de Centipeones

La [pérdida de centipeones](/blog/what-is-centipawn-loss) es la diferencia absoluta en evaluación (en centésimas de peón) entre tu jugada elegida y la mejor jugada del motor. Si Stockfish dice que la mejor jugada da +1.00 y tu jugada da +0.40, tu pérdida de centipeones para esa jugada es 60. Directo.

El promedio de pérdida de centipeones (ACPL) es la media de estas diferencias por jugada a lo largo de toda la partida. Es un número directo y sin procesar. No hay escalado, ni recorte, ni curva —simplemente te dice, en promedio, cuán lejos del óptimo estuvo tu juego.

### Qué Mide el % de Precisión

El % de precisión toma esos datos brutos de pérdida de centipeones y los pasa por una **función de conversión no lineal**. El propósito de esta conversión es hacer la métrica más intuitiva: una escala de 0–100 que los humanos pueden captar inmediatamente.

Pero aquí está el detalle crítico: **el % de precisión no es proporcional a la pérdida de centipeones**.

### La Relación No Lineal

La relación entre tu pérdida promedio de centipeones y tu % de precisión sigue una curva —las pérdidas pequeñas en la parte superior de la escala te penalizan mucho más que las pérdidas grandes en la parte inferior. Esto tiene implicaciones prácticas reales:

| Pérdida Promedio de Centipeones | % de Precisión Aproximado | Qué Significa |
|---|---|---|
| 0 cp | 99.9%+ | Juego perfecto de motor —esencialmente inalcanzable para humanos |
| 10 cp | ~93% | Una partida de club muy fuerte, la mayoría de jugadas fueron excelentes o mejores |
| 25 cp | ~82% | Una partida decente con algunas imperfecciones notables |
| 50 cp | ~68% | Varias imprecisiones o un error moderado |
| 100 cp | 50% | Errores claros; probablemente uno o dos graves |
| 200 cp | ~32% | Múltiples graves, o un error catastrófico |
| 500 cp | ~15% | El motor apenas reconoce la partida como ajedrez |

El salto de 10 cp a 25 cp (solo 15 centipeones extra en promedio) reduce tu precisión de ~93% a ~82% —un golpe de 11 puntos. Pero el salto de 100 cp a 200 cp (100 centipeones extra) te reduce de 50% a 32% —solo 18 puntos para más de 6× el aumento de centipeones.

**Por qué esto importa:** Un solo error de 70 cp en una partida por lo demás limpia (digamos, 15 jugadas a 5 cp cada una) te da un promedio de ~9 cp, que se mapea a ~93% de precisión. El mismo error de 70 cp en una partida desordenada (15 jugadas promediando 30 cp) te da un promedio de ~33 cp, que se mapea a ~78%. El error te costó igual en términos del motor, pero su impacto en el % de precisión depende completamente de la calidad del resto de tu partida.

El gráfico de abajo visualiza esto directamente:

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
  <text x="340" y="32" text-anchor="middle" fill="white" font-size="16" font-weight="700" letter-spacing="0.3">% de Precisión vs. Pérdida Promedio de Centipeones (Relación No Lineal)</text>
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
  <text x="360" y="350" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="0.3">Pérdida Promedio de Centipeones (cp)</text>
  <text x="18" y="180" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="0.3" transform="rotate(-90, 18, 180)">% de Precisión</text>
  <!-- Fill under curve -->
  <path d="M70 55 L 76 65.2 L 82 81.6 L 88 97.5 L 94 112.5 L 100 126.6 L 106 139.7 L 112 151.9 L 118 163.2 L 124 173.7 L 130 183.5 L 136 192.5 L 142 200.9 L 148 208.6 L 154 215.8 L 160 222.5 L 166 228.7 L 172 234.5 L 178 239.8 L 184 244.8 L 190 249.4 L 196 253.7 L 202 257.7 L 208 261.4 L 214 264.8 L 220 268.0 L 226 270.9 L 232 273.7 L 238 276.2 L 244 278.6 L 250 280.8 L 256 282.8 L 262 284.7 L 268 286.5 L 274 288.2 L 280 289.8 L 286 291.3 L 292 292.7 L 298 294.0 L 304 295.2 L 310 296.3 L 316 297.4 L 322 298.4 L 328 299.4 L 334 300.3 L 340 301.2 L 346 302.0 L 352 302.8 L 358 303.5 L 364 304.2 L 370 304.9 L 376 305.5 L 382 306.1 L 388 306.7 L 394 307.2 L 400 307.7 L 406 308.2 L 412 308.7 L 418 309.1 L 424 309.5 L 430 309.9 L 436 310.3 L 442 310.7 L 448 311.1 L 454 311.4 L 460 311.8 L 466 312.1 L 472 312.4 L 478 312.7 L 484 313.0 L 490 313.3 L 496 313.5 L 502 313.8 L 508 314.1 L 514 314.3 L 520 314.5 L 526 314.8 L 532 315.0 L 538 315.2 L 544 315.4 L 550 315.6 L 556 315.8 L 562 316.0 L 568 316.2 L 574 316.4 L 580 316.6 L 586 316.8 L 592 317.0 L 598 317.1 L 604 317.3 L 610 317.5 L 616 317.6 L 622 317.8 L 628 317.9 L 634 318.1 L 640 318.2 L 646 318.3 L 650 318.5 Z" fill="url(#fillGrad)"/>
  <!-- Curve -- computed polyline from accuracy = 100 / (1 + (cpLoss/100)^1.1) -->
  <!-- x = 70 + cpLoss * 1.16, y = 305 - accuracy * 2.5 -->
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
    <text x="29" y="130" text-anchor="middle" fill="#10b981" fill-opacity="0.5" font-size="10" transform="rotate(-90, 29, 130)">RANGO GM</text>
  </g>
  <g transform="translate(186, 55)">
    <rect x="0" y="-2" width="116" height="250" fill="#f59e0b" fill-opacity="0.06" rx="2"/>
    <text x="58" y="130" text-anchor="middle" fill="#f59e0b" fill-opacity="0.5" font-size="10" transform="rotate(-90, 58, 130)">RANGO CLUB</text>
  </g>
  <g transform="translate(302, 55)">
    <rect x="0" y="-2" width="348" height="250" fill="#ef4444" fill-opacity="0.06" rx="2"/>
    <text x="174" y="130" text-anchor="middle" fill="#ef4444" fill-opacity="0.5" font-size="10" transform="rotate(-90, 174, 130)">RANGO DE GRAN PÉRDIDA</text>
  </g>
</svg>
</div>

Clave: **el % de precisión está comprimido en la parte superior y estirado en la inferior.** Una mejora de 20 cp de 100 cp a 80 cp mueve tu precisión de 50% a 57% —modesto. Pero la misma mejora de 20 cp de 20 cp a 0 cp mueve tu precisión de 86% a 100% —casi tres veces el impacto. El motor castiga cada pequeña desviación del juego perfecto de manera desproporcionada. Esta es una razón por la que los grandes maestros obsesionan con mejoras aparentemente "pequeñas" en su juego: reducir 5 cp de tu promedio es mucho más difícil en la parte superior, y la recompensa de precisión es mucho más pronunciada.

## Un Ejemplo Concreto: Una Jugada Que lo Cambia Todo

Hagamos esto real con una posición específica de la **Defensa de los Dos Caballos**, una apertura aguda donde una sola decisión puede cambiar la evaluación por varios peones.

### La Posición

> **FEN:** `r1bqkb1r/ppp2ppp/2n5/3Pp3/2B5/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 5`

Esto surge después de: **1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5**

```
      ¿Las Blancas mueven? No — es el turno de las Negras.
      ┌─ Posición después de 5.exd5 ──────────────────────┐
      │  r . b q k b . r                              │
      │  p p p . . p p p                              │
      │  . . n . . . . .                              │
      │  . . . P p . . .                              │
      │  . . B . . . . .                              │
      │  . . . . . N . .                              │
      │  P P P P . P P P                              │
      │  R N B Q K . . R                              │
      │  Las Negras juegan                                 │
      └──────────────────────────────────────────────┘
```

Las Negras enfrentan una decisión crítica. La continuación *correcta* es **Na5** —atacando el alfil de casillas claras antes de que pueda infligir daño. El *grave* es **Nxd5?**, que parece natural (recapturar el peón y centralizar el caballo) pero cae en el infame **Ataque del Hígado Frito**.

### Los Dos Caminos

| Camino | Jugada | Eval Después | Pérdida de Centipeones | Impacto en Precisión |
|---|---|---|---|---|
| Mejor del motor | **Na5** atacando el alfil | ~+0.9 (Blancas ligeramente mejor — las Negras tienen compensación con el caballo mal ubicado) | 0 cp | ~95%+ para esta jugada |
| Grave natural | **Nxd5?** recapturando | ~+3.5 (Blancas ganan — sigue **7.Nxf7!**) | 260 cp | ~25% para esta jugada |
| Alternativa sólida | **b5** (variación Ulvestad) | ~+0.8 (jugable, aguda) | ~10 cp | ~90% |

La realidad brutal: **Nxd5?** parece una jugada normal de desarrollo. Capturas el peón, centralizas tu caballo, te mantienes activo. Pero la evaluación de Stockfish grita que acabas de cometer un error de 260 centipeones —suficiente para reducir la precisión de tu partida de un potencial 92% a algo como 65% en una sola jugada.

### Antes y Después: El Cambio de Evaluación

**Antes de la jugada de las Negras (posición después de 5.exd5):** La evaluación es aproximadamente **+0.3** a favor de las Blancas —una ligera ventaja por tener un peón de más (aunque es un sacrificio temporal). La posición aún está en el terreno del ajedrez normal.

**Después de Nxd5? (error de las Negras):** Las Blancas juegan **7.Nxf7!** —el sacrificio del Hígado Frito. Después de Kxf7 Qf3+ Ke6, las Blancas tienen solo una pieza por el caballo sacrificado, pero el ataque es abrumador. La evaluación salta a **+3.5+**. El rey de las Negras está en el centro, expuesto, y las Blancas tienen Qf3 amenazando mate, Nc3 atacando el caballo clavado, y todas las piezas blancas listas para unirse al ataque.

**Después de Na5 (correcto):** La evaluación de las Blancas es +0.9 —las Blancas tienen una ventaja estable, pero las Negras tienen juego razonable. La diferencia de precisión entre las dos continuaciones es enorme.

Esto ilustra una verdad crucial sobre la puntuación de precisión: **el motor juzga la jugada en sí, no tu intención.** Una jugada "natural" que se ve bien para un humano puede ser una catástrofe de 260 cp para Stockfish. Tu % de precisión reflejará el juicio del motor, capturando exactamente cuán lejos se desvió tu camino elegido del óptimo.

> Esta posición y la línea del Hígado Frito se discuten más en nuestra guía de [pérdida de centipeones en secuencias tácticas](/blog/what-is-centipawn-loss#centipawn-loss-in-tactical-sequences).

## Análisis Profundo de Posiciones: La Precisión en Acción

La teoría es una cosa —veamos cómo se desarrolla la precisión en posiciones reales. A continuación hay tres posiciones que muestran exactamente cómo la pérdida de centipeones se traduce en precisión, y por qué el juicio del motor a menudo diverge de la intuición humana.

### Posición 1: La Jugada del 99% vs. la Jugada del 70%

<chess-position
  fen="r1bq1r2/ppp2kpp/2n5/3np3/2B5/5N2/PPPP1PPP/RNBQK2R w KQ - 0 7"
  caption="Las Blancas juegan — tanto Nxe5+ como Qf3+ recuperan la pieza, pero el motor ve una diferencia de 1.5 peones entre ellas."
  orientation="white"
  arrows="b1c3:green,f3e5:red" badge="best"></chess-position>

Esta posición surge en el Ataque del Hígado Frito después de **1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5 6.Nxf7 Kxf7**. Las Blancas sacrificaron una pieza en f7 y ahora necesitan recuperar. Ambas jugadas ganan —pero el motor prefiere fuertemente una.

| Jugada | Eval Después | Pérdida de Centipeones | Precisión por Jugada | Qué Pasa |
|---|---|---|---|---|
| **Nxe5+** (mejor del motor) | **+4.0** — las Blancas ganan | 0 cp | **~99%** | Recupera la pieza limpiamente. Después de 7...Kd6 8.Qf3+ Ke6 9.Nxc6, las Blancas tienen una pieza de más con una posición aplastante. |
| **Qf3+** (alternativa tentadora) | **+2.5** — las Blancas aún ganan | ~150 cp | **~70%** | También recupera la pieza, pero las Negras obtienen una posición más coordinada después de 7...Ke6 8.Nxc6 Nxc6, y la ventaja de las Blancas es menos dominante. |

Ambas jugadas llevan a una posición ganadora. Pero la brecha de 150 centipeones entre ellas refleja una diferencia estratégica real: **Nxe5+** recupera la pieza inmediatamente con un jaque forzado, manteniendo control total. **Qf3+** retrasa la recuperación, dando a las Negras tiempo para consolidar.

La precisión por jugada captura esto con precisión: ~99% para Nxe5+ significa que el motor la considera esencialmente la única buena jugada. ~70% para Qf3+ significa que una parte significativa del potencial de la posición se quedó en el tablero. Esa brecha —29 puntos porcentuales— se trata enteramente de *qué tan bien* convertiste, no de *si* convertiste.

### Posición 2: La Imprecisión Que Aún Gana

<chess-position
  fen="8/5k2/8/2pPP3/2P5/2K5/6R1/2r5 w - - 0 1"
  caption="Las Blancas juegan — tanto Rg7+ como Kd6 ganan, pero una maximiza la precisión mientras la otra invita riesgo innecesario."
  orientation="white"
  arrows="c3b3:green,c3d3:red" badge="best"></chess-position>

Las Blancas tienen un final de torre dominante: peones pasados conectados en la 5ª fila, una torre activa, y la torre negra atrapada defendiendo pasivamente. Ambas jugadas ganan —pero la diferencia de precisión es reveladora.

| Jugada | Eval Después | Pérdida de Centipeones | Impacto en Precisión | Qué Pasa |
|---|---|---|---|---|
| **Rg7+** (mejor del motor) | **+9.0** — completamente ganadora | 0 cp | **~92%** | Toma la 7ª fila con jaque. Después de 1...Kf8 2.Rf7+ Rxf7 3.exf7, el peón d promociona mientras el peón e lo apoya. |
| **Kd6** (alternativa razonable) | **+5.5** — aún ganando | ~350 cp | **~82%** | También gana, pero las Negras obtienen más recursos defensivos. La conversión toma más tiempo y requiere seguimiento más preciso. |

Kd6 no es un grave —aún está claramente ganando. Pero la brecha de 350 centipeones muestra que las Blancas cedieron una parte significativa de la ventaja. En una partida más larga, ese terreno perdido podría dar a las Negras contrajuego que no existiría después de Rg7+.

**Esta es la idea clave:** incluso en una posición ganadora, la precisión mide *qué tan eficientemente* convertiste. Una partida donde tenías +9.0 y convertiste con 92% de precisión es una calidad de juego fundamentalmente diferente a una donde tenías +9.0 y convertiste con 82%. El motor ve la diferencia —y tu puntuación de precisión también.

### Posición 3: El Final Donde la Precisión Importa Más

<chess-position
  fen="8/4k3/4P3/4K3/8/8/8/8 b - - 0 1"
  caption="Las Negras juegan — Kd8 es tablas. Kf8 pierde. Una jugada es la diferencia entre tablas y derrota."
  orientation="black"
  arrows="e7e8:green,e7d8:red" badge="best"></chess-position>

Este es un final de rey y peón donde las Blancas tienen un peón en la 7ª fila, apoyado por el rey. El único trabajo de las Negras es mantenerse frente al peón. La elección es binaria:

| Jugada | Resultado | Pérdida de Centipeones | Precisión por Jugada | Por Qué |
|---|---|---|---|---|
| **Kd8** (correcto) | **Tablas** | 0 cp | **~99%** | Bloquea al peón de promocionar. Las Blancas no pueden progresar —el rey no puede flanquear sin abandonar el peón. |
| **Kf8** (perdedor) | **Derrota** | ~900 cp | **~5%** | Deja al peón promocionar inmediatamente con e8=Q. Partida terminada. |

Este es el caso extremo: la misma posición, el mismo jugador, y la brecha de precisión entre las dos jugadas es de **94 puntos porcentuales**. En el medio juego, un error de 900 cp podría ocurrir por una omisión táctica compleja. En un final como este, no hay nada que calcular —es conocimiento puro. O sabes que el peón promociona o no.

**Los finales son donde las puntuaciones de precisión son más brutalmente honestas.** En la apertura, podrías marcar 90% siguiendo teoría memorizada. En el medio juego, las tácticas complejas crean ambigüedad. Pero en el final, cada jugada es una decisión clara con una evaluación clara. No hay dónde esconderse. Un solo movimiento equivocado de rey puede convertir una posición tablas en derrota —y tu puntuación de precisión lo reflejará instantáneamente.

Por eso rastrear tu precisión de final separada de tu precisión de medio juego es tan valioso. Si tu precisión general es 85% pero tu precisión de final es 70%, sabes exactamente dónde enfocar tu estudio.

## El Problema de Fase: Dónde Baja Realmente Tu Precisión

La investigación en partidas de aficionados muestra consistentemente que la precisión no baja uniformemente en todas las fases:

**Apertura (jugadas 1–15):** La mayoría de los jugadores tienen alta precisión aquí porque siguen líneas memorizadas. La precisión "se ve bien" pero no refleja cálculo real —refleja preparación.

**Medio juego (jugadas 15–35):** Aquí es donde ocurren las caídas más pronunciadas. Las tácticas se vuelven complejas, la presión del tiempo aumenta, y tus patrones memorizados se agotan. Esta fase es el área de mayor apalancamiento para la mejora.

**Final (jugadas 35+):** Muchos jugadores también pierden precisión aquí, pero a menudo es por presión acumulada o una posición técnicamente perdida —no errores de cálculo.

Cuando analices tus partidas, mira la precisión *por fase*, no solo el número general. El análisis de pérdida de centipeones puede ayudar con esto —consulta [rastreo de pérdida de centipeones por fase de partida](/blog/what-is-centipawn-loss#acpl-by-game-phase).

## Cómo Usar la Precisión para Realmente Mejorar

1. **Busca las jugadas atípicas.** Ordena tus jugadas por pérdida de centipeones y estudia las 3 principales. Esas son tus decisiones más costosas.

2. **Rastrea a través de sistemas de apertura.** Podrías promediar 88% en la Italiana pero solo 79% en la Siciliana Dragón. Esa brecha te dónde termina tu preparación y dónde comienza tu cálculo.

3. **Compara controles de tiempo similares.** Una partida de blitz de 5 minutos al 80% vs. una partida rápida de 15 minutos al 87% es normal. Si tu precisión rápida está cerca de tu precisión de blitz, no estás usando el tiempo extra efectivamente. Para más sobre cómo la pérdida de centipeones escala con el control de tiempo, consulta [pérdida promedio de centipeones por control de tiempo](/blog/what-is-centipawn-loss#acpl-by-time-control).

4. **Ejecuta un informe de partida.** FireChess escanea tus últimas N partidas de Lichess o Chess.com y agrupa tus caídas de precisión en patrones —[fugas de apertura](/blog/how-to-find-opening-weaknesses) repetidas, puntos ciegos tácticos típicos, fallos de técnica de final— para que puedas ver tendencias en lugar de fluctuaciones individuales.

5. **No persigas 99%.** Una partida con 99% de precisión es usualmente una partida corta con jugadas forzadas. Apunta a consistencia en el rango 85–92% en muchas partidas, y usa la pérdida de centipeones para medir la *magnitud* de tus errores, no solo su conteo.

El número de precisión solo es una brújula. El [desglose de pérdida de centipeones](/blog/what-is-centipawn-loss) es el mapa.

## FAQ: Puntuación de Precisión en Ajedrez

### Q: ¿Cómo encuentro mi puntuación de precisión?

Sube tus partidas al [escáner de FireChess en /analyze](/analyze) —muestra tu precisión por jugada, desglose de pérdida de centipeones, y la distribución de insignias (cuántas jugadas Mejor, Buena, Imprecisión, Error y Grave hiciste). Puedes escanear partidas de Lichess o Chess.com, o pegar un PGN directamente.

### Q: ¿Es la precisión en ajedrez lo mismo que el "porcentaje de mejores jugadas"?

No. El % de precisión no es simplemente "número de mejores jugadas dividido por jugadas totales." La mayoría de las plataformas usan una fórmula ponderada que considera la severidad de cada error. Un solo grave de 100 cp arrastra tu precisión mucho más que tres imprecisiones de 5 cp, aunque el "porcentaje de mejores jugadas" las ponderaría igual. Lichess usa una fórmula basada en la suma de pérdidas de centipeones al cuadrado, mientras que Chess.com aplica una curva tipo sigmoide al promedio.

### Q: ¿Por qué mi precisión a veces aumenta después de un grave?

No lo hace —la precisión general de la partida siempre disminuye después de un grave comparado con donde habría estado. Pero el cálculo de precisión *por jugada* puede producir resultados contraintuitivos si el grave lleva a una secuencia forzada donde todas las jugadas restantes son obvias. Por ejemplo, si cuelgas una dama y luego todas las jugadas restantes son recapturas forzadas con 0 cp de pérdida, la precisión final podría parecer más alta de lo esperado —pero aún es menor de lo que habría sido sin el grave. La distorsión proviene de la naturaleza forzada del juego posterior.

### Q: ¿Cuál es una buena precisión para mi nivel de puntuación?

Consulta el gráfico en la parte superior de este artículo para rangos típicos, pero guías generales:

| Puntuación | Precisión Típica | Qué Significa |
|---|---|---|
| Bajo 1000 | 60–70% | Múltiples errores por partida; graves cada 5–7 jugadas |
| 1000–1400 | 70–78% | Graves ocasionales; juego de apertura inconsistente |
| 1400–1800 | 78–85% | Pocos graves completos; los errores son imprecisiones |
| 1800–2200 | 85–92% | Graves raros; la mayoría de imprecisiones son posicionales |
| 2200+ (NM/IM) | 92–96% | Una o dos imprecisiones pequeñas por partida |
| 2500+ (GM) | 95–98% | Jugadas que parecen "imprecisas" son a menudo compromisos estratégicos |

Recuerda: estos varían significativamente por control de tiempo y complejidad de apertura.

### Q: ¿Puede la precisión ser negativa o superar 100%?

Algunas plataformas (como Chess.com) limitan la precisión a 0–100. Otras (como Lichess) permiten que supere ligeramente 100% en teoría si cada jugada fue mejor que la sugerencia principal del motor (lo que ocurre en casos raros donde el motor cambia de opinión entre iteraciones). En la práctica, valores sobre 100% esencialmente nunca se muestran. Valores máximos como 99.9% aparecen en partidas muy cortas y forzadas. En el extremo bajo, una partida con múltiples graves del tamaño de una dama puede acercarse a 0%, aunque la mayoría de las plataformas no muestran nada debajo de 1–5%.

### Q: ¿En qué se diferencia la precisión de la pérdida de centipeones?

Esta es la pregunta más común, y la respuesta es que **el % de precisión es una transformación comprimida y no lineal de la pérdida de centipeones**:

- **La pérdida de centipeones** son datos brutos —la diferencia real entre tu jugada y la mejor del motor, medida en centésimas de peón. Es aditiva, lineal y directamente comparable entre partidas.
- **El % de precisión** es una métrica procesada —toma las pérdidas de centipeones, aplica una curva (u otra función no lineal), y las mapea a un porcentaje de 0–100. Es intuitiva pero pierde la información de magnitud bruta.

Usa la pérdida de centipeones cuando quieras saber *cuánto* perdiste por jugada. Usa el % de precisión cuando quieras un resumen rápido y comprensible. Para mejora seria, rastrea ambos. Consulta nuestro desglose completo en [¿Qué es la Pérdida de Centipeones?](/blog/what-is-centipawn-loss).

---

*¿Quieres encontrar dónde baja realmente tu precisión? Ejecuta un informe FireChess —escanea tus partidas recientes y te muestra las posiciones donde perdiste más terreno, con desgloses de pérdida de centipeones y precisión por jugada, apertura, fase y control de tiempo.*