---
title: "Perdida Promedio de Centipeones (ACPL): Que Es y Como Reducir la Tuya"
description: "Aprende que significa la perdida promedio de centipeones en ajedrez, como se calcula el ACPL, que ACPL bueno se ve en cada nivel de rating, y formas probadas de reducirlo."
date: "2026-08-14"
author: "FireChess Team"
tags: ["perdida de centipeones", "mejora en ajedrez", "analisis de partidas", "ACPL", "calidad de movimiento"]
canonical: https://firechess.com/es/blog/average-centipawn-loss-guide
---

Acabas de jugar una partida de 40 movimientos y el motor dice que tu ACPL fue 67. ¿Es bueno? ¿Malo? ¿Promedio para tu rating? La mayoria de los jugadores de club ven numeros de perdida de centipeones en su pantalla de analisis y no tienen idea de que significan — solo saben que menor es mejor. Pero entender el ACPL es una de las formas mas rapidas de diagnosticar exactamente donde van mal tus partidas, porque desglosa cada movimiento individual en una calificacion de calidad medible.

La perdida promedio de centipeones (ACPL) es el mejor proxy de que tan bien jugaste relativo a la mejor opcion del motor en cada movimiento. No es una metrica perfecta — ningun numero individual captura la historia completa de una partida de ajedrez — pero es el unico numero que te dice si tus derrotas vienen de un solo grave catastrofico o de un patron de pequenas imprecisiones. Esa distincion cambia como deberias entrenar.

Sube tus partidas recientes al [escaner de FireChess en /analyze](/analyze) y veras tu ACPL desglosado por calidad de movimiento: cuantos movimientos **Mejor (!)** hiciste, cuantas **Imprecisiones (?!)** acumulaste, y donde aterrizaron los **Graves (??)**. Ese desglose es donde vive la verdadera idea.

## ¿Que Es la Perdida de Centipeones?

Un centipeon es una centesima de peon — la unidad estandar que los motores usan para evaluar posiciones de ajedrez. Si la mejor jugada del motor te da una evaluacion de +1.50 (significando que llevas ventaja de un peon y medio), y juegas un movimiento que da +0.80 en su lugar, tu perdida de centipeones en ese movimiento es 70 centipeones. Cedio 0.70 peones de ventaja por no jugar la primera opcion del motor.

La perdida promedio de centipeones (ACPL) simplemente toma esa perdida por movimiento y la promedia a traves de todos tus movimientos en una partida. Si jugaste 40 movimientos con una perdida total de centipeones de 2,800, tu ACPL es 70. Algunas herramientas cuentan solo movimientos no forzados (saltando recapturas y respuestas obvias); otras cuentan todo. FireChess cuenta todos los movimientos pero los separa en bandas de calidad para que puedas ver la distribucion.

Aqui esta la idea clave que la mayoria de los jugadores pierden: **el ACPL no se trata de jugar la mejor jugada cada vez.** Se trata de evitar los errores grandes. Una partida donde juegas 35 movimientos de calidad "Bueno" y haces un grave de 300cp tendra mayor ACPL que una partida con 40 movimientos de nivel "Imprecision" pero sin graves. La partida dominada por el grave *se siente* peor porque lo es — un error grande cuesta mas que muchos pequenos. Consulta nuestra [guia de metricas de mejora en ajedrez](/blog/chess-improvement-metrics-to-track) para entender como el ACPL encaja en tu seguimiento de mejora general.

### La Posicion Que Lo Ilustra

Toma esta posicion de una Ruy Lopez, una de las aperturas mas analizadas en ajedrez:

<chess-position fen="r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 b - - 0 9" caption="Las Negras juegan en la Ruy Lopez. La primera opcion del motor es 9...Nb8 (la variante Breyer, reposicionando el caballo a d7). Jugar 9...Na5 en su lugar cuesta aproximadamente 25-30 centipeones — un movimiento en el limite Bueno-a-Imprecision." orientation="black"></chess-position>

Las Negras tienen varios movimientos razonables aqui. El motor prefiere **9...Nb8** — la famosa maniobra Breyer, donde el caballo retrocede para eventualmente redirigirse via d7 a mejores casilleros. Se ve pasivo, pero ha sido un arma de campeonato mundial durante decadas. El movimiento **9...Na5** se ve mas activo (atacando al alfil), pero es ligeramente menos preciso porque debilita el control Negro de c5 y no mejora la coordinacion.

¿La diferencia? Alrededor de 25-30 centipeones. Un movimiento no te mata. Pero si haces cinco movimientos como este en una partida — cada uno cediendo 25cp en lugar de encontrar la mejor jugada — has donado 125 centipeones. Eso es mas de un peon completo de ventaja que has cedido a traves de movimientos de "no quite correctos" solamente. A lo largo de una partida completa, estos se acumulan en 15-25 puntos de ACPL, la diferencia entre "jugador de club solido" y "necesita trabajo serio."

## Como Se Calcula el ACPL

El calculo es directo:

1. Para cada movimiento, el motor evalua la posicion **antes** de tu movimiento y la posicion **despues** de tu movimiento
2. La perdida de centipeones = (evaluacion despues de tu movimiento) − (evaluacion despues de la mejor jugada del motor)
3. ACPL = suma de todas las perdidas de centipeones por movimiento ÷ total de movimientos

Algunas sutilezas importantes:

- **Las evaluaciones son desde la perspectiva del bando que mueve.** Si las Blancas juegan un movimiento que baja la evaluacion de +2.00 a +0.50, la perdida de centipeones de las Blancas es 150cp. Si las Negras juegan un movimiento que baja la evaluacion de +0.50 a +2.00 (desde la perspectiva Negra, eso es -0.50 a -2.00), las Negras tambien pierden 150cp.
- **Los movimientos forzados aun se cuentan** en la mayoria de las herramientas. Si tienes solo un movimiento legal que no pierde material, aun "pierdes" centipeones si no es la linea preferida del motor. Esto infla ligeramente el ACPL en posiciones afiladas.
- **La profundidad importa.** Un motor a profundidad 12 dara evaluaciones diferentes que a profundidad 20. La consistencia dentro de una herramienta importa mas que los numeros absolutos. FireChess usa Stockfish a profundidad 16 para analisis — lo suficientemente profundo para evaluaciones confiables sin tardar una eternidad. Para una inmersion mas profunda en como funciona la perdida de centipeones a traves de tus partidas, consulta nuestra [explicacion completa de perdida de centipeones](/blog/what-is-centipawn-loss).

### Que Te Dice el Sistema de Insignias de FireChess

Cuando escaneas una partida en FireChess, cada movimiento se clasifica en una de siete bandas de calidad. El sistema de insignias se mapea directamente a la perdida de centipeones:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="720" height="560" viewBox="0 0 720 560" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cpBg" x1="0" y1="0" x2="720" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
  </defs>
  <rect width="720" height="560" rx="18" fill="url(#cpBg)"/>
  <rect x="1" y="1" width="718" height="558" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="360" y="40" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700" letter-spacing="0.4" font-family="system-ui">Insignias de Movimiento FireChess — Mapeo de Perdida de Centipeones</text>
  <text x="360" y="62" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Cada insignia corresponde a un rango de perdida de centipeones. Menor = mejor. Tu ACPL promedia estos en cada movimiento.</text>
  
  <!-- Brilliant -->
  <g transform="translate(30, 90)">
    <rect width="660" height="54" rx="10" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#22d3ee" font-size="18" font-weight="800" font-family="system-ui">!!</text>
    <text x="54" y="34" fill="#22d3ee" font-size="15" font-weight="700" font-family="system-ui">Brillante</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp de perdida · Mejor jugada que cambia la evaluacion a tu favor</text>
  </g>
  
  <!-- Best -->
  <g transform="translate(30, 150)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#34d399" font-size="18" font-weight="800" font-family="system-ui">!</text>
    <text x="54" y="34" fill="#34d399" font-size="15" font-weight="700" font-family="system-ui">Mejor</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp de perdida · Coincidiste con la primera opcion del motor</text>
  </g>
  
  <!-- Good -->
  <g transform="translate(30, 210)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.05" stroke="#10b981" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#6ee7b7" font-size="18" font-weight="800" font-family="system-ui">✓</text>
    <text x="54" y="34" fill="#6ee7b7" font-size="15" font-weight="700" font-family="system-ui">Bueno</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">10-25 cp de perdida · Juego solido, ligeramente suboptimal pero dentro de la logica de la posicion</text>
  </g>
  
  <!-- Book -->
  <g transform="translate(30, 270)">
    <rect width="660" height="54" rx="10" fill="#94a3b8" fill-opacity="0.06" stroke="#94a3b8" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#cbd5e1" font-size="18" font-weight="800" font-family="system-ui">DB</text>
    <text x="54" y="34" fill="#cbd5e1" font-size="15" font-weight="700" font-family="system-ui">Libro</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-12 cp de perdida · Movimiento 1-15 siguiendo teoria de apertura conocida</text>
  </g>
  
  <!-- Inaccuracy -->
  <g transform="translate(30, 330)">
    <rect width="660" height="54" rx="10" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fbbf24" font-size="18" font-weight="800" font-family="system-ui">?!</text>
    <text x="54" y="34" fill="#fbbf24" font-size="15" font-weight="700" font-family="system-ui">Imprecision</text>
    <text x="200" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">25-75 cp de perdida · Un pequeno desliz — te costo medio peon</text>
  </g>
  
  <!-- Mistake -->
  <g transform="translate(30, 390)">
    <rect width="660" height="54" rx="10" fill="#f97316" fill-opacity="0.08" stroke="#f97316" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fb923c" font-size="18" font-weight="800" font-family="system-ui">?</text>
    <text x="54" y="34" fill="#fb923c" font-size="15" font-weight="700" font-family="system-ui">Error</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">75-200 cp de perdida · Un error real que bajo 1-2 peones</text>
  </g>
  
  <!-- Blunder -->
  <g transform="translate(30, 450)">
    <rect width="660" height="54" rx="10" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#f87171" font-size="18" font-weight="800" font-family="system-ui">??</text>
    <text x="54" y="34" fill="#f87171" font-size="15" font-weight="700" font-family="system-ui">Grave</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">200+ cp de perdida · Colgaste material, perdiste una tactica ganadora, o debilitaste fatalmente tu posicion</text>
  </g>
</svg>
</div>

El panel de resumen en la parte superior de un escaneo de FireChess muestra algo como:

> **Blancas 78.7% precision · Mejor 11 · Libro 8 · Bueno 3 · Grave 2 · ACPL 43.2**

Esa sola linea te dice mas sobre la partida que cualquier otra metrica. El numero ACPL es el promedio; la distribucion de insignias te dice *donde* estan los problemas. Un jugador con 2 Graves y 0 Imprecisiones tiene un problema diferente a uno con 0 Graves y 12 Imprecisiones — incluso si su ACPL es identico.

## ¿Que Es un Buen ACPL por Rating?

Esta es la pregunta que todos hacen, y la respuesta honesta es: **depende del control de tiempo, el tipo de posicion, y la profundidad del motor.** Pero de miles de escaneos de FireChess a traves de todos los niveles de rating, aqui estan los rangos tipicos:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="380" viewBox="0 0 680 380" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acplBg" x1="0" y1="0" x2="680" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#0d1225"/>
    </linearGradient>
  </defs>
  <rect width="680" height="380" rx="16" fill="url(#acplBg)"/>
  <rect x="1" y="1" width="678" height="378" rx="15" stroke="#1e293b" stroke-opacity="0.5"/>
  <text x="340" y="36" text-anchor="middle" fill="#f1f5f9" font-size="18" font-weight="700" font-family="system-ui">ACPL por Nivel de Rating (Rangos Tipicos)</text>
  <text x="340" y="56" text-anchor="middle" fill="#64748b" font-size="12" font-family="system-ui">Basado en analisis de partidas a nivel de club · Menor es mejor</text>
  
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
  
  <text x="50" y="280" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">Bajo 1000</text>
  <rect x="140" y="266" width="420" height="22" rx="4" fill="#ef4444" fill-opacity="0.45"/>
  <text x="350" y="282" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">130-200+ ACPL</text>
  
  <!-- Legend -->
  <text x="340" y="325" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">Rangos asumen 15+10 o control de tiempo mas largo · Blitz/rapido corre 10-20% mas alto</text>
</svg>
</div>

Algunas cosas que saltan de los datos:

**La banda 1400-1800 es donde viven la mayoria de los jugadores de club**, y un ACPL de 50-80 es completamente normal. No eres "malo" a 65 ACPL — eres promedio para tu rating. El problema es si tu ACPL *se queda* en 65 mientras intentas escalar. Para romper 1800, necesitas consistentemente estar bajo 50. Consulta nuestro [desglose de ACPL por rating](/blog/average-centipawn-loss-by-rating) para una mirada detallada a como la perdida de centipeones se desplaza en cada banda de rating.

**El blitz infla todo.** Un jugador de 1600 podria tener 45 ACPL en una partida de 15+10 pero 80 ACPL en blitz de 3+0. La velocidad de juego importa enormemente. Siempre compara ACPL dentro del mismo control de tiempo.

**Un grave destruye el promedio.** Un jugador de 1500 que juega 38 movimientos a 15cp promedio (excelente para ese rating) pero hace un grave de 400cp termina con ~25 ACPL para esa partida. El grave solo agrego 10 puntos al promedio. Es por esto que la distribucion de insignias importa mas que el numero crudo — una partida con 1 Grave y 39 Buenos movimientos es muy diferente de una partida con 20 Imprecisiones.

## Por Que Tu ACPL Es Mas Alto de lo Que Deberia Ser

Despues de escanear miles de partidas en FireChess, los mismos patrones aparecen una y otra vez. Estos son los tres mayores asesinos de ACPL a nivel de club, con posiciones reales para mostrar como se ven.

### Patron 1: La Brecha de Conocimiento de Apertura

El pico de ACPL mas comun ocurre en los primeros 15 movimientos. Los jugadores que no conocen bien su apertura hacen movimientos de "aspecto razonable" que sutilmente debilitan su posicion en 30-50 centipeones cada uno. Cinco movimientos asi y has donado 150+ centipeones antes de que el medio juego siquiera empiece.

<chess-position fen="r1bq1rk1/pppnbppp/5n2/3p2B1/3P4/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8" caption="Las Blancas juegan en el Gambito de Dama Rehusado. Despues del natural 8.Bd3, las Negras tienen igualdad solida. Pero si las Blancas juegan 8.Ne5?! en su lugar, las Negras obtienen juego facil con ...dxc4 y ...Nd5. Revisa tu ACPL de apertura en la seccion 'Fugas de Apertura' de FireChess." orientation="white"></chess-position>

El Gambito de Dama Rehusado es una de las aperturas mas densas teoricamente en ajedrez. Si eres un jugador de 1500 y llegas a esta posicion, podrias jugar **8.Bd3** (la linea principal, solida) o podrias jugar **8.Ne5?!** (se ve activo, atacando f7, pero en realidad da a las Negras igualdad facil). La diferencia de evaluacion del motor es solo de unos 20-30 centipeones, pero las posiciones resultantes son dramaticamente diferentes en la practica — despues de 8.Ne5 las Negras obtienen un juego comodo con ...dxc4, ...Nd5, y ...f6, mientras que despues de 8.Bd3 las Blancas mantienen una pequena pero persistente ventaja.

Esto es lo que las "Fugas de Apertura" en la [herramienta de analisis de FireChess](/analyze) te muestran: posiciones donde consistentemente eliges el segundo mejor movimiento en tus aperturas. Si juegas el QGD como Blancas y ves un grupo de insignias **?!** en los movimientos 6-10, eso no es aleatorio — es una brecha sistematica de conocimiento que puedes corregir estudiando esas posiciones especificas.

### Patron 2: El Error de Calculo de Medio Juego

Los picos mas grandes de ACPL (200+ centipeones en un solo movimiento) ocurren cuando pierdes un tiro tactico — ya sea de tu oponente o el tuyo. Esto es diferente del problema de apertura: las imprecisiones de apertura son pequenas y consistentes, mientras que los errores de calculo son grandes y esporadicos.

<chess-position fen="r1bqkb1r/ppp2Npp/2n5/3np3/2B5/8/PPPP1PPP/RNBQK2R b KQkq - 0 6" caption="Las Negras juegan despues de 6.Nxf7 en el Ataque del Higado Frito. El motor dice que las Negras deberian jugar 6...Kxf7, aceptando el sacrificio y entrando en una posicion afilada pero defendible. El movimiento 6...Ke8?? es un grave — se ve mas seguro pero pierde contra 7.Qf3. Un movimiento equivocado de rey cuesta 300+ centipeones." orientation="black"></chess-position>

El Ataque del Higado Frito es un estudio de caso perfecto de ACPL. Despues de **6.Nxf7**, las Negras enfrentan una decision critica. El motor dice que **6...Kxf7** es el unico movimiento real — es aterrador (tu rey esta expuesto en f7) pero objetivamente solido. El movimiento **6...Ke8??** se ve natural (mantén el rey seguro, no tomes el caballo) pero es en realidad un grave catastrofico que pierde 300+ centipeones porque las Blancas juegan 7.Qf3 y la posicion Negra colapsa.

Este es el tipo de movimiento que aparece como una insignia roja de **?? Grave** en FireChess. Y aqui esta la cosa: si estas calificado debajo de 1600, probablemente has cometido este error exacto o uno similar. No porque seas malo en ajedrez, sino porque el movimiento "seguro" *se siente* correcto. El reconocimiento de patrones te dice "no muevas el rey al abierto" — pero el calculo te diria que Kxf7 es en realidad el movimiento mas seguro por los recursos tacticos especificos disponibles.

Despues de escanear tus partidas, busca la seccion de "Graves" — cada uno usualmente tiene una historia como esta. Un movimiento que se sentia seguro pero no lo era. Una captura que parecia ganadora pero tenia una defensa oculta. Estas son las perdidas de 200+ centipeones que destruyen tu promedio de ACPL.

### Patron 3: El Fallo de Conversion en Finales

El tercer asesino de ACPL es menos dramatico pero igualmente danino: jugar el final mal. Una posicion que es +2.00 (ganadora) lentamente sangra a +0.50 (tablas) porque no conoces la tecnica. Cada movimiento pierde 15-30 centipeones — nunca un grave, nunca siquiera un error, solo un flujo constante de imprecisiones.

<chess-position fen="8/5kpp/8/8/8/4R3/r4PPP/6K1 w - - 0 1" caption="Las Blancas juegan en un final de torre. El activo 1.Ra3 es mucho mas fuerte que el pasivo 1.Rf3+?! — cambiar torres o poner la torre detras del peon es tecnica clave. El ACPL de final es donde la mayoria de los jugadores de club pierden mas puntos relativo a los maestros." orientation="white"></chess-position>

En este final de torre, las Blancas tienen una clara ventaja (peon extra, torre activa). Pero la diferencia entre **1.Ra3** (activo, apuntando a la columna a) y **1.Rf3+?!** (pasivo, dando jaque sin un plan) es de unos 40 centipeones. A lo largo de 15 movimientos de final, elegir la opcion "segura" pero pasiva cada vez puede costar 200+ centipeones en total — el equivalente de devolver toda la ventaja.

Este es el patron mas dificil de arreglar porque la tecnica de final requiere conocimiento especifico, no solo "ser mas cuidadoso." Necesitas saber que la actividad de torre importa mas que la seguridad de torre, que los peones pasados deben ser empujados, que la actividad del rey gana finales. La buena noticia: el estudio de finales tiene el mayor retorno de inversion de cualquier entrenamiento de ajedrez. Mover tu ACPL de 80 a 60 solo en finales puede reducir tu ACPL general en 5-10 puntos.

## Como Reducir Tu ACPL: Una Guia Practica

Saber tu ACPL es inutil sin saber como mejorarlo. Esto es lo que realmente funciona, ordenado por efectividad para jugadores de club.

### Arregla Tus Graves Primero

Esto suena obvio pero la mayoria de los jugadores lo hace mal. Intentan "pensar mas fuerte" o "ser mas cuidadosos" — lo cual no funciona porque los graves no son causados por esfuerzo insuficiente. Son causados por **lagunas de reconocimiento de patrones.** No perdiste la tactica porque no calculaste; la perdiste porque no la *viste.*

La solucion: resuelve problemas tacticos que se enfoquen en los patrones que realmente pierdes. No hagas conjuntos de problemas aleatorios. Despues de escanear 20+ partidas en FireChess, busca tus posiciones de grave — se agruparan alrededor de motivos especificos. Si tus graves son principalmente mates de fila trasera, estudia mates de fila trasera. Si son principalmente tenedores de caballo, estudia tenedores de caballo. La practica dirigida supera el volumen.

Para la mayoria de los jugadores calificados debajo de 1600, eliminar graves solos reduce el ACPL en 15-25 puntos. Esa es la unica mejora mas grande disponible. Nuestra guia sobre [como dejar de cometer graves](/blog/how-to-stop-blundering-chess) cubre los patrones de entrenamiento tactico mas efectivos.

### Aprende Tus Aperturas Mas Profundo (No Mas Ancho)

La seccion de [fugas de apertura](/blog/how-to-find-opening-weaknesses) en el analisis de FireChess es una mina de oro. Si juegas 1.e4 y tu ACPL en los primeros 10 movimientos es 60+, estas perdiendo la partida antes de que empiece. Pero la solucion no es memorizar mas teoria — es entender *por que* el motor prefiere ciertos movimientos en las posiciones que realmente llegas.

Estudia las lineas especificas donde haces imprecisiones. Si consistentemente juegas el movimiento equivocado en el movimiento 8 de la Najdorf, aprende las ideas de *esa* posicion, no todo el arbol de la Najdorf. Profundidad en tus lineas principales, no amplitud en muchas aperturas, es lo que reduce el ACPL de apertura.

Despues de escanear tus partidas, ordena los movimientos de apertura por perdida de centipeones. Las posiciones de mayor perdida son donde deberias enfocarte. Tres horas de estudio dirigido de apertura en tus peores posiciones pueden reducir el ACPL de apertura en 10-20 puntos — una mejora permanente que se paga en cada partida.

### Mejora Tu Tecnica de Final

El ACPL de final es donde existe la mayor brecha entre jugadores de club y maestros. Un jugador de 1500 podria tener 90+ ACPL en finales; un jugador de 2200 tiene 25-35. La diferencia no es el calculo — es el conocimiento.

Aprende estos fundamentos de final en orden:
1. **Finales de rey y peon** — oposicion, casilleros clave, la regla del cuadrado
2. **Finales de torre** — Posicion Lucena, Posicion Filidor, principios de actividad de torre
3. **Finales de alfil vs caballo** — cuando cada pieza es mejor, como jugar cada bando

Cada uno toma unas 5-10 horas para estudiar adecuadamente. Combinados, pueden reducir el ACPL de final de 90 a 50 — una mejora de 40 puntos que se traduce en 10-15 puntos de ACPL general y un salto significativo de rating.

### Usa una Rutina de Analisis Estructurada

La mayoria de los jugadores analizan sus partidas mal. Miran la evaluacion del motor, ven un movimiento rojo, y piensan "deberia haber jugado la sugerencia del motor." Eso no es aprendizaje — eso es solo ver la respuesta.

En cambio, usa esta rutina despues de cada partida:

1. **Identifica tus tres movimientos de mayor ACPL.** No las sugerencias del motor — tus peores movimientos. ¿Que jugaste, y por que?
2. **Encuentra la causa raiz.** ¿Fue un error de calculo (viste el movimiento correcto pero lo evaluaste mal)? ¿Una laguna de conocimiento (no conociste el patron)? ¿Una decision de presion de tiempo?
3. **Estudia el patron.** Si fue un error de calculo, resuelve 5 tacticas similares. Si fue una laguna de conocimiento, lee sobre esa posicion de final o apertura especifica.
4. **Rastrea tu ACPL a lo largo del tiempo.** No te enfoques en partidas individuales — mira tu promedio movil de 30 partidas. Si esta bajando, tu entrenamiento esta funcionando.

El escaner de FireChess hace esta rutina rapida — sube un PGN, ve el desglose, profundiza en tus peores movimientos, y rastrea la mejora a lo largo del tiempo. La [pagina de analisis en /analyze](/analyze) te da la distribucion de insignias, el desglose movimiento por movimiento, y los grupos de fugas de apertura todo en una vista.

## La Diferencia Entre ACPL y Precision

Los jugadores a menudo confunden ACPL con precision, y algunas herramientas usan los terminos indistintamente. Estan relacionados pero diferentes:

| Metrica | Que Mide | Escala | Caso de Uso |
|--------|-----------------|-------|----------|
| ACPL | Perdida promedio de centipeones por movimiento | Menor es mejor (0-200+) | Diagnosticar debilidades especificas |
| Precision | Que tan cercanos estan tus movimientos a la primera opcion del motor | 0-100% | Puntuacion de calidad general de partida |

La precision es un porcentaje — te dice que tan seguido jugaste el movimiento "correcto." El ACPL te dice que tan *equivocados* estaban tus movimientos equivocados. Una partida con 85% precision y 60 ACPL tiene algunos errores grandes. Una partida con 85% precision y 35 ACPL tiene muchos pequenos. Misma precision, problemas muy diferentes.

FireChess muestra ambas metricas. El porcentaje de precision es util para un chequeo rapido de salud. El ACPL y la distribucion de insignias son lo que necesitas para una mejora dirigida. Cuando alguien pregunta "¿cual es una buena precision en ajedrez?" la respuesta depende de la complejidad de la posicion — pero el ACPL es mas consistente a traves de diferentes tipos de partida. Para una comparacion completa, consulta nuestra [guia de puntuacion de precision de ajedrez](/blog/chess-accuracy-score-explained).

## Mitos Comunes del ACPL Desmentidos

**"Menor ACPL siempre significa mejor juego."** No necesariamente. En una posicion completamente tablas, ambos jugadores podrian tener 15 ACPL — estan jugando con precision, pero no esta pasando nada. En una partida tactica afilada, ambos jugadores podrian tener 60 ACPL a pesar de jugar bien, porque las posiciones son tan complejas que incluso buenos movimientos pierden algunos centipeones. El contexto importa. Aprende mas sobre [como los graves y el ACPL interactuan por rating](/blog/chess-blunder-patterns-by-rating).

**"Necesito jugar como un motor para tener bajo ACPL."** No. Necesitas evitar graves y conocer tus aperturas. Un jugador de 1600 con buen conocimiento de aperturas y tacticas solidas puede lograr 40-50 ACPL sin jugar un solo movimiento "brillante." La consistencia supera la brillantez.

**"El ACPL no tiene en cuenta la complejidad de la posicion."** Esto es parcialmente cierto — una posicion tranquila es mas facil de jugar con precision que una afilada. Pero a lo largo de una gran muestra de partidas, la complejidad se promedia. Si tu ACPL consistentemente esta alto en todos los tipos de partida, el problema eres tu, no las posiciones.

**"Los centipeones son sin sentido porque los motores no estan de acuerdo."** Diferentes motores y profundidades dan evaluaciones ligeramente diferentes, pero las valoraciones *relativas* son notablemente consistentes. Si un movimiento es un grave a profundidad 16, casi siempre es un grave a profundidad 20 tambien. El numero absoluto podria cambiar 5-10cp, pero el patron es estable.

## Rastreando Tu ACPL a lo Largo del Tiempo

El ACPL de una sola partida te dice casi nada. El ajedrez es demasiado variable — podrias jugar una partida limpia a 25 ACPL seguida de un desastre a 120 ACPL, y ninguno representa tu nivel "real." Lo que importa es la tendencia.

Escanea al menos 20 partidas — idealmente del mismo control de tiempo — y busca:
- **Tu ACPL promedio en todas las partidas.** Esta es tu linea base.
- **La distribucion.** ¿Tienes unas pocas partidas catastroficas subiendo el promedio, o consistentemente esta alto?
- **El desglose de insignias.** ¿Cuantos Graves por partida? ¿Cuantas Imprecisiones?
- **ACPL de apertura vs medio juego vs final.** ¿Donde pierdes mas puntos?**

El [escaner de FireChess en /analyze](/analyze) calcula todo esto automaticamente. Sube tu PGN, espera el analisis, y veras exactamente donde se concentra tu perdida de centipeones. Usa esos datos para enfocar tu entrenamiento, no solo para sentirte mal por tus graves.

Mejorar el ACPL es un juego largo. La mayoria de los jugadores ven una caida de 5-10 puntos a lo largo de 3 meses de entrenamiento dirigido, lo que se traduce en 100-200 puntos de rating. No es dramatico, pero es real — y a diferencia de memorizar lineas de apertura, la mejora es permanente porque esta basada en reconocimiento de patrones y tecnica, no en memorizacion mecanica.

## FAQ

### P: ¿Que es la perdida promedio de centipeones en ajedrez?

La perdida promedio de centipeones (ACPL) mide que tan lejos se desvian tus movimientos de la mejor opcion del motor, promediado a traves de todos los movimientos en una partida. Cada movimiento se evalua: si la primera jugada del motor da +1.50 y tu movimiento da +1.00, perdiste 50 centipeones en ese movimiento. Tu ACPL es la perdida total de centipeones dividida por el numero de movimientos. Menor ACPL significa que jugaste mas cerca de las recomendaciones del motor. Usa el [escaner de FireChess en /analyze](/analyze) para ver tu ACPL con un desglose completo movimiento por movimiento.

### P: ¿Que es un buen ACPL para mi rating?

Rangos tipicos: jugadores calificados debajo de 1000 promedian 130-200+ ACPL; jugadores 1000-1400 promedian 80-130; jugadores 1400-1800 promedian 50-80; jugadores 1800-2200 promedian 30-50; y jugadores 2200+ promedian 15-30. Estos numeros asumen 15+10 o control de tiempo mas largo — las partidas de blitz tipicamente corren 10-20% mas alto. Si tu ACPL esta dentro del rango para tu rating, enfocate en reducir graves primero para la mayor mejora.

### P: ¿Como encuentro mi perdida de centipeones?

Sube el PGN de tu partida a la [herramienta de analisis de FireChess en /analyze](/analyze). El escaner muestra tu ACPL, porcentaje de precision, y un desglose de insignias (cuantos movimientos Mejor, Bueno, Imprecision, Error, y Grave hiciste). Tambien puedes ver la perdida de centipeones por movimiento en el analisis movimiento por movimiento. Lichess y Chess.com tambien muestran ACPL en sus caracteristicas de analisis de partidas.

### P: ¿Cual es la diferencia entre perdida de centipeones y precision?

La perdida de centipeones mide *cuanta* evaluacion cediste por movimiento (un numero continuo). La precision mide *que tan seguido* jugaste la primera opcion del motor (un porcentaje). Una partida con 85% precision y 60 ACPL tiene algunos errores grandes. Una partida con 85% precision y 35 ACPL tiene muchas imprecisiones pequenas. Ambas metricas son utiles — la precision para un chequeo rapido, el ACPL para una mejora dirigida. Consulta nuestra [guia de perdida de centipeones](/blog/what-is-centipawn-loss) para mas detalle.

### P: ¿Por que mi ACPL es tan alto en la apertura?

Los picos de ACPL en la apertura usualmente significan que estas jugando movimientos que son teoricamente conocidos como inferiores — no graves, pero movimientos que le dan a tu oponente un juego mas facil. Revisa la seccion "Fugas de Apertura" en tu escaneo de FireChess para ver que posiciones te cuestan mas centipeones. Estudia esas lineas especificas en lugar de intentar memorizar todo tu repertorio de aperturas. Incluso aprender 3-4 posiciones criticas por apertura puede reducir el ACPL de apertura en 10-20 puntos.

### P: ¿El control de tiempo afecta el ACPL?

Absolutamente. Las partidas rapidas y clasicas producen menor ACPL porque tienes tiempo para calcular. El blitz y bullet inflan el ACPL en 10-20 puntos porque tomas decisiones mas rapido. Siempre compara ACPL dentro del mismo control de tiempo — un 60 ACPL en blitz es mucho mas impresionante que un 60 ACPL en rapido.

### P: ¿Puede el ACPL predecir mi rating de ajedrez?

El ACPL se correlaciona con el rating pero no lo predice directamente. Dos jugadores con ACPL identico pueden tener ratings muy diferentes si uno juega posiciones mas afiladas (mayor complejidad, naturalmente mayor ACPL) y el otro juega sistemas tranquilos. Sin embargo, si tu ACPL consistentemente esta 20+ puntos por encima del rango tipico para tu rating objetivo, mejorarlo casi seguramente te ayudara a escalar. [Escanea tus partidas en FireChess](/analyze) para ver como tu ACPL se compara con tus pares de rating.
