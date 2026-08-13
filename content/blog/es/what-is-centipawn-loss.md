---
title: "Promedio de Pérdida de Centipeones Explicado: Qué Significa el ACPL y Cómo Mejorarlo"
description: "El promedio de pérdida de centipeones (ACPL) mide la calidad de las jugadas en ajedrez. Aprende qué significa, ve ejemplos en el tablero y usa FireChess para reducir el tuyo."
date: "2026-07-26"
author: "FireChess Team"
tags: ["análisis", "fundamentos", "mejora", "pérdida-centipeones"]
canonical: https://firechess.com/es/blog/what-is-centipawn-loss
---

Acabas de terminar una partida intensa de 45 minutos. Abres el tablero de análisis, ejecutas el motor y ahí está: **"Pérdida promedio de centipeones: 72."**

¿Qué significa realmente ese número? ¿Es 72 bueno? ¿Malo? ¿Cómo se calcula? ¿Y por qué debería importarte?

Si alguna vez has mirado una puntuación de pérdida de centipeones y te has sentido más confundido que informado, no estás solo. La pérdida promedio de centipeones (ACPL) está en el centro del análisis de ajedrez moderno —todas las plataformas principales, desde Lichess hasta Chess.com y FireChess, la usan— pero la mayoría de los jugadores no entienden completamente qué representa el número ni cómo usarlo.

Esta guía lo corrige. Al final, sabrás exactamente qué es la pérdida de centipeones, cómo Stockfish asigna esos números misteriosos, cómo FireChess traduce la pérdida de centipeones en las insignias de jugada que ves en el tablero de análisis (Brillante !!, Mejor !, Buena ✓, Imprecisión ?!, Error ?, Grave ??) y —lo más importante— cómo usar la pérdida de centipeones para encontrar tus mayores debilidades y mejorar más rápido.

---

## ¿Qué es un Centipeón? La Unidad del Análisis Ajedrecístico

La palabra "centipeón" es una combinación de **centi** (una centésima) y **peón**. Un centipeón equivale a 1/100 del valor de un peón en el tablero de ajedrez.

Piensa en él como la unidad más pequeña de ventaja ajedrecística significativa. Así como un gramo mide cantidades diminutas de masa y un centavo mide cantidades diminutas de moneda, un centipeón mide pequeñas ventajas y desventajas en una posición de ajedrez.

**La suposición base:** Un peón vale 100 centipeones. Esto no es arbitrario —es una convención que surgió de décadas de investigación en ajedrez computacional. Los cinco valores materiales tradicionales se mapean así:

| Pieza | Valor en Centipeones |
|-------|---------------------|
| Peón | 100 cp |
| Caballo | 320 cp (≈3.2 peones) |
| Alfil | 330 cp (≈3.3 peones) |
| Torre | 500 cp (5 peones) |
| Dama | 900 cp (9 peones) |

Estos son puntos de partida. El motor ajusta estos valores dinámicamente según la posición, actividad de piezas, seguridad del rey, estructura de peones y docenas de otros factores. Un caballo en un puesto perfecto podría evaluarse en 350 cp; el mismo caballo atrapado en el borde del tablero podría caer a 280 cp.

**La pérdida de centipeones**, entonces, mide la diferencia entre tu jugada y la mejor jugada del motor, expresada en estas unidades. Si la mejor jugada en una posición da al motor +0.50 (una ventaja de 50 centipeones) y tu jugada da +0.20, tu pérdida de centipeones para esa jugada es 30 cp —la diferencia entre lo óptimo y lo que jugaste. **El promedio de pérdida de centipeones (ACPL)** es simplemente la media de estas pérdidas por jugada a lo largo de toda una partida —el único número que ves en tu informe de análisis. Para un desglose detallado de cómo estos valores se mapean a niveles de puntuación, consulta nuestra [guía de ACPL por puntuación](/blog/average-centipawn-loss-by-rating), o lee nuestra [guía completa de ACPL](/blog/average-centipawn-loss-guide) para estrategias prácticas para reducir el tuyo.

---

## Cómo los Motores de Ajedrez Calculan la Pérdida de Centipeones

Aquí es donde la mayoría de las explicaciones se vuelven difusas, así que seamos precisos. Si te interesa más cómo las plataformas convierten estos números en porcentajes de precisión, consulta nuestra [guía de puntuación de precisión](/blog/chess-accuracy-score-explained).

### Paso 1: El Motor Evalúa la Posición Antes de Tu Jugada

Cuando pides a Stockfish que analice una partida, mira la posición justo antes de tu jugada y le asigna una evaluación numérica. Este es el número familiar de la "barra de evaluación" que ves durante el análisis —un número positivo significa que las Blancas están mejor, un número negativo significa que las Negras están mejor.

Una posición evaluada en **+0.73** significa que las Blancas tienen una ventaja equivalente a 70 centipeones —aproximadamente tres cuartos de un peón. Una posición en **-1.20** significa que las Negras están por delante por aproximadamente el equivalente a un peón y 20 centipeones.

### Paso 2: El Motor Considera Todas las Jugadas Posibles

Stockfish examina cada jugada legal en la posición y calcula la mejor evaluación que puede lograr después de cada una. Lo mirando muchas jugadas por delante —típicamente 20-30 medios movimientos de profundidad en análisis online— y usando un algoritmo de búsqueda llamado poda alfa-beta combinada con evaluación de red neuronal.

Para cada jugada candidata, el motor pregunta: *"Si juego esto, ¿cuál es el mejor resultado posible para ambos lados en los próximos 20+ movimientos?"*

### Paso 3: Pérdida de Centipeones = Mejor Evaluación — Evaluación de Tu Jugada

La fórmula es sencilla:

```
Pérdida de Centipeones = Evaluación(Mejor Jugada) - Evaluación(Tu Jugada)
```

Ajustada por perspectiva: si la mejor jugada se evalúa en +1.00 y tu jugada se evalúa en +0.70, tu pérdida de centipeones es **30 cp**. Cediste 30 centipeones de ventaja en comparación con la jugada óptima.

El motor típicamente normaliza esto para que siempre se muestre como un número positivo (la *pérdida* que incurriste). Una "pérdida de centipeones de 45" significa que perdiste 45 centipeones de ventaja en relación con la mejor jugada en esa posición.

---

## Ejemplos Concretos: Pérdida de Centipeones en el Tablero

Hagamos esto real con posiciones actuales. Cada una demuestra un escenario diferente de pérdida de centipeones que encontrarás en tus propias partidas.

### Ejemplo 1: Una Imprecisión Menor (15-25 cp de Pérdida)

<chess-position fen="r1bq1rk1/ppp2ppp/2np1n2/4p3/2P5/2NP1NP1/PP2PPBP/R1BQ1RK1 w - - 0 10" caption="Una estructura típica de Ataque Indio del Rey. La mejor jugada de las Blancas es 10.Be3, completando el desarrollo. Jugar 10.b3 en su lugar (preparando Bb2) pierde unos 18 cp —una imprecisión menor. El motor prefiere el alfil en e3 donde apunta a la debilidad en d6. Este es el tipo de imprecisión que FireChess marca con una insignia amarilla '?!'." badge="inaccuracy" arrows="c1e3:green,b2b3:orange"></chess-position>

En la posición de arriba, las Blancas tienen una posición cómoda (+0.45). La mejor jugada es 10.Be3, desarrollando el alfil a su casilla más activa. Si las Blancas juegan 10.b3 en su lugar, la evaluación cae a aproximadamente +0.27 —una pérdida de centipeones de **18 cp**. FireChess la etiquetaría como **Imprecisión (?!)**.

Este es el tipo más común de pérdida de centipeones para jugadores intermedios: pequeñas imprecisiones posicionales que no pierden la partida pero se acumulan a lo largo de 40 jugadas.

### Ejemplo 2: Un Error Claro (40-80 cp de Pérdida)

<chess-position fen="r1bqk2r/pppp1ppp/2n5/4P3/2B1n3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 7" caption="Las Blancas juegan. La mejor continuación es 7.Nc3, desarrollando y atacando el caballo en e4. Jugar 7.O-O? en su lugar permite a las Negras consolidar con ...d5, igualando. Pérdida de centipeones: aproximadamente 55 cp. Insignia FireChess: Error (?)." badge="mistake" arrows="b1c3:green,e1g1:orange"></chess-position>

Las Blancas tienen una ligera ventaja (+0.60) después de la apertura. La mejor jugada es 7.Nc3, golpeando el caballo suelto en e4 y manteniendo presión. Si las Blancas enrocan con 7.O-O?, las Negras juegan 7...d5 y de repente las Negras están completamente bien. La evaluación cambia de +0.60 a aproximadamente +0.05 —una pérdida de centipeones de **55 cp**. FireChess esto con una insignia naranja **Error (?)**.

Observa que esto no es un grave táctico —las Blancas no regalaron una pieza. Pero las Blancas cedieron toda la ventaja de apertura en un solo paso en falso posicional. Así es como se ve un "error": no pierde la partida, pero es genuinamente dañino.

### Ejemplo 3: Un Grave (80-150 cp de Pérdida)

<chess-position fen="r1b1kb1r/ppp2ppp/2n5/3qp3/8/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 7" caption="Las Blancas juegan. Las Negras acaban de jugar ...Qe5, dejando la dama sin defensa. La única buena jugada es Nxe5, ganando la dama. Cualquier otra jugada —por ejemplo, Be2— es un grave de 900 cp. Insignia FireChess: Grave (??)." badge="blunder" arrows="f3e5:green"></chess-position>

Este es el tipo más dramático de pérdida de centipeones. Las Blancas pueden capturar la dama negra con 7.Nxe5, ganando +9.00 en evaluación. Cualquier otra jugada normal —desarrollar un alfil, enrocar— tira una dama completa. La pérdida de centipeones por no ver Nxe5 es aproximadamente **900 cp**. FireChess etiqueta esto como un **Grave (??)** rojo.

Los graves de esta magnitud usualmente provienen de ceguera tácticas —simplemente no viste que la captura estaba disponible. El número de pérdida de centipeones te dice exactamente cuánto dejaste en el tablero.

### Ejemplo 4: Juego Casi Perfecto (0-15 cp de Pérdida)

<chess-position fen="r2q1rk1/ppp2ppp/2n1bn2/3p4/3P4/2NQ1N2/PPP2PPP/R1B2RK1 w - - 6 10" caption="Una posición tranquila de un Gambito de Dama Rehusado. Las Blancas tienen varias jugadas razonables. 11.Bg5, 11.Bf4 y 11.Rd1 están todas a 5-10 cp entre sí. Incluso la elección 'subóptima' aquí apenas se registra como pérdida de centipeones. Insignia FireChess: Mejor (!) o Buena (✓)." badge="best" arrows="c1g5:green,c1f4:green"></chess-position>

En posiciones tranquilas y simétricas, la pérdida de centipeones entre jugadas razonables puede ser mínima. Aquí, las tres jugadas candidatas de las Blancas —11.Bg5, 11.Bf4 y 11.Rd1— se evalúan todas entre +0.25 y +0.30. Elegir la "equivocada" cuesta como máximo **5-8 cp**. FireChess etiquetaría cualquiera de estas como **Mejor (!)** o **Buena (✓)**.

Esta es una idea clave: no toda la pérdida de centipeones es igual. Una pérdida de 10 centipeones en una Siciliana aguda donde solo una jugada mantiene la posición es un gran problema. Una pérdida de 10 centipeones en una posición tranquila donde cinco jugadas son jugables es ruido.

### Ejemplo 5: El Grave de Apertura (150+ cp de Pérdida)

<chess-position fen="rnbqkbnr/ppp2ppp/3p4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3" caption="Las Negras juegan en la Defensa Philidor. Jugar la aparentemente natural 3...Bg4? clava el caballo pero pierde un peón después de 4.Bxf7+! Kxf7 5.Ng5+. Pérdida de centipeones: aproximadamente 250 cp. Insignia FireChess: Grave (??)." badge="blunder" arrows="c4f7:red,f3g5:green"></chess-position>

La Defensa Philidor (1.e4 e5 2.Nf3 d6 3.Bc4) parece inocente, pero las Negras deben tener cuidado. La jugada 3...Bg4? se siente lógica —clavar el caPero cae en 4.Bxf7+! Después de 4...Kxf7 5.Ng5+, las Negras pierden el derecho a enrocar y un peón. La pérdida de centipeones es aproximadamente **250 cp** para una sola jugada. Este es el tipo de trampa de apertura que FireChess marca con una insignia roja **Grave (??)**.

### Ejemplo 6: Precisión en el Final (10 cp vs 50 cp)

<chess-position fen="8/8/8/4k3/8/3KP3/8/8 w - - 0 1" caption="Un final simple de rey y peón. Las Blancas juegan. 1.Ke2? (perdiendo la oposición) cuesta unos 45 cp y convierte una victoria en tablas. 1.Kd2! mantiene la oposición y gana. La diferencia entre +1.20 y +0.08 es 112 cp —una sola jugada cambiando el resultado de la partida." badge="blunder" arrows="e3d2:green,e3e2:red"></chess-position>

Los finales son donde la pérdida de centipeones se vuelve brutalmente implacable. En la posición de arriba, las Blancas deben jugar 1.Kd2! para mantener la oposición y ganar. Jugar 1.Ke2? pierde la oposición y la evaluación se desploma de +1.20 a +0.08 —una pérdida de centipeones de **112 cp**. Un solo movimiento de rey. Partida terminada. FireChess esto como un **Grave (??)** porque el cambio de evaluación es decisivo.

La misma pérdida de centipeones de 112 en el medio juego podría ser un error parcial en una posición compleja. En el final, con tan pocas piezas restantes, es catastrófico. El contexto importa.

---

## Insignias de Jugada de FireChess: Qué Significa Cada Etiqueta

Cuando analizas una partida en FireChess, cada jugada obtiene una insignia de color junto a ella en la lista de jugadas. Estas insignias no son aleatorias —se mapean directamente a rangos de pérdida de centipeones. Aquí está el mapeo completo para que sepas exactamente qué significa cada etiqueta cuando la ves. Para una exploración más profunda de cómo funcionan las puntuaciones de precisión, consulta nuestra [guía de puntuación de precisión](/blog/chess-accuracy-score-explained).

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
  <text x="360" y="40" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700" letter-spacing="0.4" font-family="system-ui">Insignias de Jugada FireChess — Mapeo de Pérdida de Centipeones</text>
  <text x="360" y="62" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Cada insignia corresponde a un rango de pérdida de centipeones. Menor = mejor. Tu ACPL promedia estas en cada jugada.</text>
  <!-- Badge cards -->
  <!-- Brilliant: 0-10 cp loss, but only for sacrifices that work -->
  <g transform="translate(30, 90)">
    <rect width="660" height="54" rx="10" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#22d3ee" font-size="18" font-weight="800" font-family="system-ui">!!</text>
    <text x="54" y="34" fill="#22d3ee" font-size="15" font-weight="700" font-family="system-ui">Brillante</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp de pérdida · Sacrificio de mejor jugada que cambia la evaluación a tu favor</text>
  </g>
  <!-- Best: 0-10 cp loss -->
  <g transform="translate(30, 150)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#34d399" font-size="18" font-weight="800" font-family="system-ui">!</text>
    <text x="54" y="34" fill="#34d399" font-size="15" font-weight="700" font-family="system-ui">Mejor</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp de pérdida · Igualaste la primera opción del motor</text>
  </g>
  <!-- Good: 10-25 cp loss -->
  <g transform="translate(30, 210)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.05" stroke="#10b981" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#6ee7b7" font-size="18" font-weight="800" font-family="system-ui">✓</text>
    <text x="54" y="34" fill="#6ee7b7" font-size="15" font-weight="700" font-family="system-ui">Buena</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">10-25 cp de pérdida · Juego sólido, ligeramente subóptimo pero dentro de la lógica de la posición</text>
  </g>
  <!-- Book: 0-12 cp in first 15 moves -->
  <g transform="translate(30, 270)">
    <rect width="660" height="54" rx="10" fill="#94a3b8" fill-opacity="0.06" stroke="#94a3b8" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#cbd5e1" font-size="18" font-weight="800" font-family="system-ui">DB</text>
    <text x="54" y="34" fill="#cbd5e1" font-size="15" font-weight="700" font-family="system-ui">Libro</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-12 cp de pérdida · Jugadas 1-15 siguiendo teoría de apertura conocida — el motor lo trata como nivel de libro</text>
  </g>
  <!-- Inaccuracy: 25-75 cp loss -->
  <g transform="translate(30, 330)">
    <rect width="660" height="54" rx="10" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fbbf24" font-size="18" font-weight="800" font-family="system-ui">?!</text>
    <text x="54" y="34" fill="#fbbf24" font-size="15" font-weight="700" font-family="system-ui">Imprecisión</text>
    <text x="200" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">25-75 cp de pérdida · Un pequeño desliz —no pierde, pero falta una mejor opción. Te costó medio peón.</text>
  </g>
  <!-- Mistake: 75-200 cp loss -->
  <g transform="translate(30, 390)">
    <rect width="660" height="54" rx="10" fill="#f97316" fill-opacity="0.08" stroke="#f97316" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fb923c" font-size="18" font-weight="800" font-family="system-ui">?</text>
    <text x="54" y="34" fill="#fb923c" font-size="15" font-weight="700" font-family="system-ui">Error</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">75-200 cp de pérdida · Un fallo real que costó 1-2 peones. Necesita revisión.</text>
  </g>
  <!-- Blunder: 200+ cp loss -->
  <g transform="translate(30, 450)">
    <rect width="660" height="54" rx="10" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#f87171" font-size="18" font-weight="800" font-family="system-ui">??</text>
    <text x="54" y="34" fill="#f87171" font-size="15" font-weight="700" font-family="system-ui">Grave</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">200+ cp de pérdida · Un error grave —colgaste material, perdiste una táctica ganadora o debilitaste fatalmente tu posición</text>
  </g>
</svg>
</div>

### Q: Cómo las Insignias se Conectan con Tu Informe de Partida

Cuando subes una partida a FireChess y ejecutas el análisis, el panel de resumen en la parte superior de la página te muestra un desglose:

- **Blancas 78.7% precisión · Mejor 11 · Libro 8 · Buena 3 · Grave 2 · ACPL 43.2**
- **Negras 75.5% precisión · Mejor 8 · Libro 6 · Buena 3 · Imprecisión 2 · Error 1 · Grave 3 · ACPL 50.6**

Cada uno de esos conteos es una traducción directa de los rangos de pérdida de centipeones. Un "Grave" significa que esa jugada tuvo 200+ centipeones de pérdida. Un "Error" significa 75-200 cp. Una "Imprecisión" significa 25-75 cp. El ACPL al final promedia todo esto en un solo número.

**Lo que esta tabla te dice instantáneamente:**

- La jugada 13.e5? muestra una insignia ?? —ese es un grave con 200+ centipeones de pérdida
- La jugada 6.Nxf7! muestra una insignia ! —mejor jugada, 0-10 cp de pérdida
- La jugada 18.Bxd4 muestra una insignia ✓ —buena jugada, 10-25 cp de pérdida, sólida pero no la absolutamente mejor

Esta es la conexión entre el número abstracto de pérdida de centipeones y la insignia concreta que ves en tu pantalla. Cuando juegues tu próxima partida y la subas a FireChess, cada insignia que ves está impulsada por la pérdida de centipeones bajo el capó.

---

## Cómo se Ven los Diferentes Valores de Pérdida de Centipeones en el Tablero

Los números en una página son abstractos. Pongámoslos en un tablero de ajedrez real para que puedas ver qué representan las diferentes puntuaciones de pérdida de centipeones. Si quieres ver estos rangos mapeados a niveles de puntuación, nuestra [guía de ACPL por puntuación](/blog/average-centipawn-loss-by-rating) tiene el desglose completo.

### Pérdida de Centipeones 0-15: Juego Casi Perfecto

A este nivel, estás encontrando la mejor jugada o algo cercano a ella. Este es el rango de rendimiento de gran maestro en la mayoría de las posiciones. Una pérdida de 10 centipeones significa que jugaste una jugada que objetivamente es casi tan buena como la primera opción del motor —quizás elegiste una casilla ligeramente menos óptima para tu alfil, o un avance de peón diferente que aún es sólido.

Insignias FireChess a este nivel: **Brillante (!!)** o **Mejor (!)**.

### Pérdida de Centipeones 15-40: Imprecisiones Pequeñas

Este es el rango de jugadores de club fuertes y expertos (puntuación 1800-2200). No estás cometiendo graves —simplemente no estás encontrando la continuación más precisa. Una pérdida de 25 centipeones típicamente significa que jugaste una jugada sólida de desarrollo cuando una jugada más aguda o más sutil estaba disponible.

Insignia FireChess a este nivel: **Imprecisión (?!)** —la insignia amarilla.

### Pérdida de Centipeones 40-80: Errores Claros

Este es el rango más común de pérdida de centipeones para jugadores de club intermedios (1200-1600). Estás cometiendo errores que ceden aproximadamente medio peón a un peón completo de ventaja. Estos son a menudo errores posicionales —mal ubicar una pieza, cambiar las piezas equivocadas, o empujar un peón que crea una debilidad.

Insignia FireChess a este nivel: **Error (?)** —la insignia naranja.

### Pérdida de Centipeones 80-150: Graves

Una pérdida de centipeones sobre 80 es casi siempre un error táctico o un juicio posicional severo. A 100+ cp, esencialmente has regalado un peón completo de ventaja —a menudo por una pieza colgada, un tenedor perdido, o una concesión posicional seria.

Insignia FireChess a este nivel: **Grave (??)** —la insignia roja.

### Pérdida de Centipeones 150+: Errores que Pierden la Partida

A este nivel, probablemente has perdido una pieza completa o permitido un ataque decisivo. Una pérdida de 300+ centipeones casi siempre significa que colgaste un caballo o alfil, perdiste un mate forzado, o caíste en una táctica devastadora.

<chess-position fen="rnb1kbnr/pppp1ppp/8/3q4/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4" caption="La dama negra acaba de ser capturada por el peón en e4 después de que las Negras cometieran un grave moviéndola a d5 sin considerar la captura del peón en esa casilla. Pérdida de centipeones para las Negras: +950 cp —una dama completa perdida." analysis="true" badge="blunder" arrows="e4d5:red"></chess-position>

---

## Cómo la Pérdida de Centipeones se Traduce en Precisión (y Viceversa)

Muchas plataformas de análisis ajedrecístico, incluyendo FireChess, muestran tanto un **porcentaje de precisión** como un **promedio de pérdida de centipeones (ACPL)** para cada partida. La gente a menudo pregunta: "¿No son lo mismo?"

Están correlacionados, pero miden cosas diferentes.

**El promedio de pérdida de centipeones** es el promedio matemático bruto de cuántos centipeones cediste por jugada. Es un número absoluto —55 ACPL significa lo mismo de partida en partida, sin importar cuán aguda o tranquila fuera la posición.

**El porcentaje de precisión** es una puntuación normalizada que convierte la pérdida de centipeones en una escala del 0-100% basada en cuán cerca estuvieron tus jugadas de la mejor del motor. Está diseñado para ser más intuitivo: 95% de precisión significa que jugaste a nivel élite; 60% significa que estuviste luchando.

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
  <text x="360" y="35" text-anchor="middle" fill="#f1f5f9" font-size="17" font-weight="700" font-family="system-ui">Conversión ACPL → Precisión</text>
  <text x="360" y="55" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Precisión típica para un promedio de pérdida de centipeones dado. Curvada porque los graves arrastran más el ACPL que la precisión.</text>
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
  <text x="360" y="328" fill="#64748b" font-size="11" font-family="system-ui" text-anchor="middle">Pérdida Promedio de Centipeones (ACPL)</text>
  <!-- Conversion curve -->
  <path d="M 80 105 Q 192 118 304 155 Q 416 200 528 245 Q 584 268 640 288" stroke="url(#convLine)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Data points -->
  <circle cx="80" cy="105" r="5" fill="#10b981"/>
  <text x="80" y="95" fill="#10b981" font-size="10" font-family="system-ui" text-anchor="middle">GM</text>
  <circle cx="192" cy="118" r="5" fill="#10b981"/>
  <text x="192" y="108" fill="#10b981" font-size="10" font-family="system-ui" text-anchor="middle">Maestro</text>
  <circle cx="304" cy="155" r="5" fill="#f59e0b"/>
  <text x="304" y="145" fill="#f59e0b" font-size="10" font-family="system-ui" text-anchor="middle">Experto</text>
  <circle cx="416" cy="200" r="5" fill="#f59e0b"/>
  <text x="416" y="190" fill="#f59e0b" font-size="10" font-family="system-ui" text-anchor="middle">Club</text>
  <circle cx="528" cy="245" r="5" fill="#ef4444"/>
  <text x="528" y="235" fill="#ef4444" font-size="10" font-family="system-ui" text-anchor="middle">Casual</text>
  <circle cx="640" cy="288" r="5" fill="#ef4444"/>
  <text x="640" y="278" fill="#ef4444" font-size="10" font-family="system-ui" text-anchor="middle">Principiante</text>
</svg>
</div>

| ACPL | Precisión Típica (FireChess) | Mezcla Típica de Insignias | Qué Significa |
|------|------------------------------|---------------------------|---------------|
| 10-20 | 95-99% | Mayormente !!, !, ✓ | Nivel gran maestro |
| 25-35 | 90-94% | !, ✓, pocos ?! | Nivel Maestro / MI |
| 40-50 | 85-89% | !, ✓, algunos ?! y ? | Experto / club fuerte |
| 55-70 | 78-84% | Mezcla de !, ✓, ?!, ? | Jugador de club (1400-1600) |
| 70-90 | 72-78% | Más ?, ?!, ocasional ?? | Jugador de club casual |
| 90-150 | 65-72% | Frecuentes ? y ?? | Principiante / intermedio |
| 150+ | Debajo de 65% | Muchos ??, graves que alteran la partida | Principiante completo |

La relación no es perfectamente lineal. Una partida con un grave de 300 centipeones y 39 jugadas perfectas podría darte 55 ACPL pero 94% de precisión. El grave arrastra más el ACPL que el porcentaje, porque la precisión penaliza los graves fuertemente pero no infinitamente.

**Guía práctica:** Usa el ACPL para rastrear mejora a largo plazo (es más granular) y la precisión para comparaciones rápidas de partida a partida (es más intuitivo). Cuando revises tu informe FireChess, mira los conteos de insignias en la parte superior —si ves más **Graves (??)** que jugadas **Mejor (!)**, sabes exactamente dónde enfocarte.

Para una explicación más profunda de la métrica de precisión en sí, consulta nuestra guía de [puntuación de precisión en ajedrez explicada](/blog/chess-accuracy-score-explained).

---

## Conceptos Erróneos Comunes Sobre la Pérdida de Centipeones

Aclaremos los malentendidos que causan más confusión.

### Mito 1: "Poca pérdida de centipeones significa que jugué perfectamente"

**Realidad:** Una baja pérdida de centipeones significa que tus jugadas estuvieron *cerca* de la mejor del motor —pero solo dentro de la profundidad en que el motor estaba buscando. Stockfish a profundidad 20 podría dar a una jugada una evaluación de 0.00, y a profundidad 40 la misma jugada podría ser -0.40. Además, la pérdida de centipeones no captura la dificultad de encontrar las jugadas: una pérdida de 5 centipeones en una secuencia táctica forzada es menos impresionante que una pérdida de 5 centipeones en una partida tranquila de maniobra posicional.

### Mito 2: "Un error de -1.00 siempre es tan malo como otro error de -1.00"

**Realidad:** El mismo valor de centipeones puede significar cosas muy diferentes según la posición. Perder 100 centipeones en una posición completamente igualada significa que pasaste de igualado a claramente peor —eso es un grave genuino. Perder 100 centipeones desde una posición donde ya estabas abajo 300 centipeones (perdiste una pieza) es casi insignificante —pasaste de estar perdiendo a seguir perdiendo.

Por eso los motores de ajedrez reportan la **evaluación antes y después** de tu jugada, no solo el delta. Una posición de -5.00 donde juegas una jugada de -5.20: la pérdida de centipeones es solo 20, pero aún estás completamente perdido.

### Mito 3: "Deberías intentar conseguir 0 de pérdida de centipeones en cada partida"

**Realidad:** Incluso Magnus Carlsen promedia 15-25 ACPL en partidas clásicas. Los humanos no juegan como motores —y no deberían intentarlo. La meta no es la perfección (que no existe en un contexto humano); la meta es **reducir tus mayores errores**. Una partida con 38 jugadas sólidas y un grave de 200 centipeones es una partida que necesitas analizar; una partida con 40 jugadas promediando 45 centipeones de pérdida cada una es una partida donde jugaste consistentemente a tu nivel.

### Mito 4: "La pérdida de centipeones es comparable entre diferentes controles de tiempo"

**Realidad:** Como cubrimos en nuestra [guía de ACPL por puntuación](/blog/average-centipawn-loss-by-rating), tu pérdida de centipeones se infla dramáticamente a medida que se agota el reloj. Un jugador que promedia 40 ACPL en clásico podría promediar 70 en blitz y 110 en bala. Siempre compara dentro del mismo control de tiempo.

### Mito 5: "Todos los motores dan la misma pérdida de centipeones"

**Realidad:** Diferentes motores e incluso diferentes configuraciones del mismo motor producen diferentes números de pérdida de centipeones para la misma partida. Stockfish 18 a profundidad 22 reportará evaluaciones diferentes que Stockfish 16 a profundidad 18. Las evaluaciones de Lichess tienden a ser más indulgentes que las de Chess.com o FireChess debido a diferencias de profundidad.

<chess-position fen="r1bqk2r/pppp1ppp/2n5/4P3/2B5/5N2/PPP2PPP/RNBQK2R b KQkq - 0 5" caption="Las Blancas tienen un peón limpio gracias al peón e5, con un centro fuerte y piezas desarrolladas. La ventaja en centipeones aquí es aproximadamente +100-120 cp. La tarea de las Negras es minimizar más pérdidas." analysis="true" badge="mistake" arrows="e4e5:green"></chess-position>

---

## Cómo Usar la Pérdida de Centipeones en Tu Análisis de Partidas

Aquí es donde la teoría se convierte en práctica. Aquí hay un flujo de trabajo paso a paso para usar la pérdida de centipeones para realmente mejorar —usando las insignias de FireChess como tu guía visual. Para un desglose completo de cómo se ven la precisión y el ACPL en cada nivel de puntuación, consulta nuestra [guía de puntos de referencia de precisión por puntuación](/blog/chess-accuracy-by-rating-guide).

### Paso 1: Sube Tu Partida a FireChess

Importa partidas desde Lichess, Chess.com, o pega un PGN en la [herramienta de análisis de FireChess](/analyze). FireChess analiza cada jugada y produce un informe con pérdida de centipeones por jugada, por fase y por apertura. El panel de resumen muestra inmediatamente tu desglose de insignias —contadores de Mejor, Libro, Buena, Imprecisión, Error y Grave para ambos jugadores.

### Paso 2: Encuentra Tus Jugadas Más Costosas

Busca en la lista de jugadas las insignias **rojas Grave (??)** y **naranjas Error (?)**. Estos son tus puntos calientes de pérdida de centipeones. Las 3-5 jugadas principales (tus mayores errores) son donde deberías enfocar tu atención. **No distribuyas tu limitado tiempo de estudio entre cada imprecisión de 20 centipeones —encuentra los graves de 200 centipeones y corrígelos primero.**

### Paso 3: Categoriza el Error

Para cada gran error, pregúntate:
- ¿Fue un **grave táctico** (perdiste un tenedor, clavada, descubierta)?
- ¿Fue un **error posicional** (casilla equivocada, cambio malo)?
- ¿Fue **falta de tiempo** (bandera, menos de 30 segundos)?
- ¿Fue un **error de apertura** (respuesta equivocada a algo desconocido)?

Categoriza cada uno. Después de 10 partidas, surgirán patrones. Si cada gran error es táctico, tu entrenamiento táctico debería ser tu prioridad. Si cada gran error es en la apertura, necesitas preparación de aperturas. Si la falta de tiempo es el culpable, trabaja en gestión del tiempo.

### Paso 4: Calcula Tu ACPL por Fases

No solo mires el promedio general. Desglósalo:

| Fase | Tu ACPL | ACPL Objetivo (Tu Puntuación) |
|------|---------|-------------------------------|
| Apertura (1-15) | | |
| Medio juego (16-35) | | |
| Final (36+) | | |

La mayoría de los jugadores de club encuentran que su ACPL de medio juego es 1.5x a 2x su ACPL de apertura. Eso te dice exactamente dónde debería ir tu tiempo de entrenamiento. Si estás marcando 35 ACPL en aperturas pero 80 ACPL en el medio juego, no necesitas más estudio de aperturas —necesitas reconocimiento de patrones de medio juego.

### Paso 5: Rastrea Tu ACPL a lo Largo del Tiempo

El ACPL es un **indicador adelantado** de mejora. Tu puntuación podría estancarse por semanas mientras tu ACPL baja lentamente —y luego tu puntuación se pone al día. Rastrea tu promedio mensual de ACPL en lugar de tu puntuación diaria, y verás progreso incluso antes de que tu puntuación se mueve. Observa cómo se distribuyen tus insignias: menos **??** y **?**, más **!** y **!!**.

| Mes | ACPL | Puntuación | Tendencia de Insignias | Notas |
|-----|------|------------|----------------------|-------|
| Mes 1 | 72 | 1420 | 5??, 8? por partida | Línea base |
| Mes 2 | 65 | 1450 | 3??, 6? por partida | El trabajo táctico rinde frutos |
| Mes 3 | 58 | 1510 | 1??, 4? por partida | Mejora clara |
| Mes 4 | 55 | 1530 | 0??, 3? por partida | Meseta —tiempo para estudio posicional |

---

## Diferencias entre Plataformas: Lichess vs. Chess.com vs. FireChess

Si has analizado la misma partida en múltiples plataformas, probablemente has notado diferentes números de ACPL. Esto no es un error —es una característica de diferentes configuraciones del motor.

| Plataforma | Motor | Profundidad Típica | Sesgo ACPL | ¿Insignias de Jugada? |
|------------|-------|-------------------|-----------|----------------------|
| Lichess | Stockfish (varios) | 22 ply | ~10% menor (más indulgente) | Sí (imprecisión/error/grave) |
| Chess.com | Cloud Stockfish | 25-30 ply | Línea base | Sí (brillante/mejor/buena/libro/imprecisión/error/grave) |
| FireChess | Stockfish 18 | Profundidad balanceada | Comparable a Chess.com | Sí —sistema completo de 7 insignias (!!, !, ✓, DB, ?!, ?, ??) |

**Por qué la diferencia:** Un motor más débil o menor profundidad ve menos posibilidades tácticas, así que considera más jugadas "suficientemente buenas" como iguales a la mejor jugada. Tu pérdida de centipeones aparece menor porque el motor no te penaliza tan severamente por perder una táctica profunda de 25 movimientos.

**Lo que esto significa para ti:** Siempre compara contra tus propios datos históricos en la *misma plataforma*. No compares tu ACPL de Lichess de 55 con el ACPL de Chess.com de un amigo de 55 —se miden diferente. Usa FireChess consistentemente para tu seguimiento de mejora y aprende a leer el sistema de insignias —es el más granular de cualquier plataforma. Para una comparación más profunda de plataformas de análisis, consulta nuestra [guía de mejora Lichess vs. Chess.com](/blog/lichess-vs-chess-com-improvement).

---

## FAQ: Respuestas Rápidas a Preguntas Comunes

### Q: ¿Qué es un buen promedio de pérdida de centipeones?

Depende completamente de tu puntuación y control de tiempo. Para un jugador con puntuación 1500 en rápido, cualquier cosa debajo de 60 es buena. Para un jugador con puntuación 2000, debajo de 45 es lo esperado. Consulta nuestra [tabla de ACPL por puntuación](/blog/average-centipawn-loss-by-rating) para puntos de referencia detallados.

### Q: ¿Es la pérdida de centipeones lo mismo que la precisión?

No. El porcentaje de precisión es una puntuación normalizada (0-100%) basada en la pérdida de centipeones. La pérdida de centipeones es la medida matemática bruta. Se correlacionan fuertemente pero no son idénticas. Las insignias de jugada de FireChess están entre ellas —las insignias traducen la pérdida de centipeones en una etiqueta legible para humanos. Para un desglose completo de cómo funciona la precisión, consulta nuestra [guía de puntuación de precisión en ajedrez](/blog/chess-accuracy-score-explained).

### Q: ¿Qué significa el promedio de pérdida de centipeones?

El promedio de pérdida de centipeones (ACPL) es la diferencia media por jugada entre la jugada que jugaste y la mejor jugada del motor, medida en centipeones (1/100 de un peón). Si tu ACPL es 60, eso significa que en promedio cada jugada que jugaste fue 60 centipeones —aproximadamente 0.6 peones— peor que la primera opción del motor. Menor es mejor: los grandes maestros promedian 15-25 ACPL, mientras que los jugadores de club típicamente marcan 50-80. FireChess traduce la pérdida de centipeones de cada jugada en una insignia de color (Mejor, Imprecisión, Grave, etc.) para que puedas ver de un vistazo dónde perdiste más. Consulta nuestra [guía de ACPL por puntuación](/blog/average-centipawn-loss-by-rating) para puntos de referencia en cada nivel.

### Q: ¿Qué es una pérdida de centipeones de 100?

Una pérdida de centipeones de 100 significa que cediste el equivalente a un peón completo de ventaja en una sola jugada. Esto es un grave genuino en la mayoría de las posiciones. FireChess esto con una insignia roja **?? Grave**.

### Q: ¿Qué significan las insignias de jugada en FireChess?

Cada insignia se mapea a un rango de pérdida de centipeones:
- **!! Brillante** (0-10 cp, sacrificio que funciona) —insignia cian
- **! Mejor** (0-10 cp, igualando la primera opción del motor) —insignia verde
- **✓ Buena** (10-25 cp, sólida pero no la absolutamente mejor) —insignia verde claro
- **DB Libro** (0-12 cp, primeras 15 jugadas, teoría conocida) —insignia gris
- **?! Imprecisión** (25-75 cp, pequeño desliz) —insignia amarilla
- **? Error** (75-200 cp, fallo real) —insignia naranja
- **?? Grave** (200+ cp, error grave) —insignia roja

### Q: ¿Por qué mi pérdida de centipeones varía tanto entre partidas?

Es normal. Una partida donde enfrentas una Defensa Siciliana aguda y tienes que calcular tácticas complejas naturalmente producirá mayor pérdida de centipeones que una partida lenta de Gambito de Dama donde juegas teoría conocida durante 20 jugadas. Promedia en 10+ partidas antes de sacar conclusiones.

### Q: ¿Cuántas partidas necesito para una lectura confiable de ACPL?

Al menos 10 partidas en el mismo control de tiempo. Una sola partida tiene demasiada varianza de la apertura específica, el oponente y las circunstancias. Diez partidas suavizan el ruido. Los conteos de insignias también se estabilizarán en 10+ partidas.

### Q: ¿Puede la pérdida de centipeones ser negativa?

No. La pérdida de centipeones se define como la diferencia absoluta entre la evaluación de tu jugada y la evaluación de la mejor jugada. Siempre es un número no negativo. Algunas plataformas muestran "0" para la mejor jugada, significando cero centipeones perdidos.

### Q: ¿Importa la pérdida de centipeones en posiciones completamente ganadoras?

Importa menos. Cuando tienes una dama y una torre de ventaja, una imprecisión de 100 centipeones es irrelevante. Enfoca tu análisis en posiciones críticas —donde la partida estaba equilibrada y un error cambió el resultado. Nuestra [guía de ACPL por puntuación](/blog/average-centipawn-loss-by-rating) muestra qué rangos de pérdida de centipeones realmente afectan tu porcentaje de victoria en cada nivel.

### Q: ¿Es útil la pérdida de centipeones para aperturas?

Parcialmente. La pérdida de centipeones en aperturas tiende a ser muy baja porque hay teoría establecida. Una alta pérdida de centipeones en la apertura generalmente significa que saliste del libro y cometiste un error. Más útil es rastrear tu pérdida de centipeones *después de salir de la teoría* —eso es una medida de cuán bien entiendes las posiciones de medio juego resultantes. En FireChess, las jugadas de apertura típicamente muestran insignias **DB (Libro)** hasta la jugada 15 o hasta que ocurre una desviación temprana. Si tu pérdida de centipeones en apertura es consistentemente alta, usa el [escáner de debilidades de apertura](/blog/how-to-find-opening-weaknesses) para encontrar qué líneas te están costando.

### Q: ¿Cómo leo el resumen de insignias en la parte superior de mi informe FireChess?

El panel de resumen te muestra: porcentaje de precisión, conteos de insignias por tipo y ACPL. Por ejemplo: "Blancas 78.7% precisión · Mejor 11 · Libro 8 · Buena 3 · Grave 2 · ACPL 43.2". Esto significa que las Blancas jugaron 11 jugadas perfectas, 8 jugadas de libro, 3 jugadas buenas y 2 graves. La pérdida promedio fue 43.2 centipeones por jugada. Más jugadas Mejor (!) que Graves (??) siempre es una buena señal. Sube una partida a [FireChess en /analyze](/analyze) para ver tu propio desglose de insignias.

### Q: ¿Es la insignia Brillante (!!) lo mismo que una jugada Mejor (!)?

No. Una jugada Brillante (!!) es un tipo específico de jugada Mejor —es un sacrificio de pieza donde el motor confirma que el sacrificio realmente funciona (la evaluación mejora después del sacrificio). No toda jugada mejor es brillante. En la práctica, las jugadas Brillantes son raras —podrías ver 1-2 por cada 20 partidas. Una jugada Mejor (!) simplemente significa que igualaste la primera opción del motor.

---

## Tabla de Referencia Rápida: Pérdida de Centipeones por Impacto

| Pérdida de Centipeones | Clasificación | Insignia FireChess | Causa Típica | Impacto en la Partida |
|------------------------|--------------|-------------------|--------------|----------------------|
| 0-15 | Excelente | !! o ! | Mejor o casi mejor jugada | Insignificante |
| 15-25 | Buena | ✓ | Ligeramente subóptima pero sólida | Pequeña ventaja perdida |
| 25-75 | Imprecisión | ?! | Imprecisión posicional menor | Pequeña ventaja perdida |
| 75-200 | Error | ? | Fallo táctico o error posicional | Ventaja notable perdida |
| 200-300 | Grave | ?? | Pieza colgada, táctica perdida | A menudo decisiva |
| 300+ | Grave severo | ?? | Pieza perdida, concesión posicional fatal | Generalmente pierde |
| 900+ | Desastre | ?? | Dama perdida, mate forzado perdido | Partida terminada |

---

## Conclusión: Del Número a la Mejora

La pérdida de centipeones es, en esencia, una herramienta —no un juicio. Un número como "72 ACPL" no te dice nada por sí solo. Pero 72 ACPL *tendiendo hacia 60* te dice que estás mejorando. Un grave de 150 centipeones *en el mismo patrón a lo largo de tres partidas* te dice exactamente qué estudiar. Un pico de ACPL *en el medio juego pero no en la apertura* te dónde invertir tu tiempo de entrenamiento.

El sistema de insignias de FireChess es la traducción visual de todo esto. Cuando ves un **??** rojo junto a la jugada 23, sabes instantáneamente: esa jugada te costó. Cuando ves un **!!** cian junto a la jugada 31, sabes: encontraste algo especial. Los números de pérdida de centipeones debajo son la contabilidad precisa del motor —pero las insignias son lo que lo hace intuitivo.

Los jugadores que mejoran más rápido no son los que tienen la menor pérdida de centipeones. Son los que **usan** los datos de pérdida de centipeones para encontrar sus debilidades específicas y apuntar a ellas. Miran el desglose de insignias después de cada partida y preguntan: "¿De dónde vienen mis graves?"

Sube tu próxima partida a FireChess, revisa el desglose de pérdida de centipeones por fase, y encuentra el patrón que te está costando más insignias. Arregla esa cosa. Observa cómo baja tu ACPL. Observa cómo tu puntuación lo sigue.

*¿Listo para analizar tus partidas? Usa la [herramienta de análisis de FireChess](/analyze) para obtener un desglose gratuito de pérdida de centipeones con informe por fases —completo con insignias de jugada para cada jugada.*