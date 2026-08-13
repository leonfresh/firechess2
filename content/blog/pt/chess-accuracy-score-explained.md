---
title: "Pontuação de Acurácia de Xadrez Explicada: O Que 90%+ Realmente Significa"
description: "O que sua pontuação de acurácia de xadrez realmente significa? Como é calculada, o que 90%+ realmente diz, e por que acurácia difere da perda de peões-centavos."
date: "2026-07-25"
author: "FireChess Team"
tags: ["análise", "fundamentos", "perda-de-peões-centavos"]
---

Você termina uma partida e o relatório de acurácia diz 94,2%. Isso é bom? Ótimo? E por que seu oponente mostra 91,7% mesmo tendo perdido?

As pontuações de acurácia são uma das métricas mais incompreendidas no xadrez. Vamos descomplicar exatamente o que elas significam —e o que não significam.

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
  <text x="340" y="38" text-anchor="middle" fill="white" font-size="18" font-weight="700" letter-spacing="0.3" font-family="system-ui">Detalhamento da Pontuação de Acurácia</text>
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
    <text y="50" text-anchor="middle" fill="#a5b4fc" font-size="13" font-family="system-ui">Acurácia</text>
    <!-- Scale labels -->
    <text x="-96" y="16" fill="#ef4444" font-size="11" text-anchor="middle" font-family="system-ui">0</text>
    <text x="0" y="-98" fill="#f59e0b" font-size="11" text-anchor="middle" font-family="system-ui">50</text>
    <text x="96" y="16" fill="#10b981" font-size="11" text-anchor="middle" font-family="system-ui">100</text>
  </g>
  <!-- Rating brackets (right panel) -->
  <g transform="translate(420, 60)">
    <text fill="#94a3b8" font-size="12" font-weight="600" font-family="system-ui" letter-spacing="0.3">ACURÁCIA TÍPICA POR RATING</text>
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

## Como a Acurácia é Calculada

As pontuações de acurácia de xadrez —seja do Lichess, Chess.com ou FireChess— são todas construídas sobre o mesmo conceito: **[perda de peões-centavos](/blog/what-is-centipawn-loss)**.

Aqui está a fórmula em linguagem simples:

1. Para cada lance que você jogou, um motor avalia a posição antes e depois.
2. Ele compara seu lance com o melhor lance possível que o motor encontrou.
3. A diferença na avaliação (medida em peões-centavos) é sua "perda" para aquele lance.
4. Sua acurácia é uma função de quão pequena foi sua perda média em todos os lances.

A fórmula exata varia por plataforma. O Chess.com usa uma função de conversão que mapeia a perda média de peões-centavos para uma porcentagem de 0–100. O Lichess usa uma abordagem semelhante. O FireChess usa a perda bruta de peões-centavos por lance, agrupada em classificações (brilhante, melhor, excelente, boa, imprecisão, erro, grave).

Para entender a acurácia, você primeiro precisa entender o número bruto de onde ela vem. Se você ainda não está familiarizado com o conceito, leia nosso guia completo: [O Que é Perda de Peões-Centavos?](/blog/what-is-centipawn-loss) —ele cobre como o Stockfish calcula avaliações e o que esses números realmente significam em termos práticos.

## Por Que Você Pode Perder Com 94% de Acurácia

Esta é a maior fonte de confusão. A acurácia mede **quão proximamente você seguiu a recomendação do motor** —não se você venceu.

Imagine este cenário: Seu oponente jogou uma abertura levemente imprecisa no início da partida. Você não puniu de forma ótima, mas também não cometeu nenhum grave óbvio. Vocês dois jogaram com 90%+ de acurácia. Mas como a imprecisão do oponente criou uma posição estrategicamente desvantajosa para ele, ele perdeu o final apesar da alta pontuação de acurácia.

A acurácia diz quão bem você jogou *dadas as posições que surgiram*. Ela não diz:
- Se as posições eram objetivamente iguais ou desiguais
- Se seu oponente criou pressão que o forçou a um jogo passivo
- Se um grave de abertura no lance 4 o colocou em uma posição perdida desde cedo

**Uma derrota com 95% de acurácia frequentemente significa que você jogou bem, mas começou de uma posição pior.** Uma vitória com 75% de acurácia frequentemente significa que seu oponente cometeu mais graves do que você.

É também por isso que a **perda média de peões-centavos** e a % de acurácia contam histórias diferentes. Dois jogadores podem ambos marcar 92% de acurácia, mas um teve uma média constante de 20 cp em todos os lances enquanto o outro teve muitos lances de 0 cp pontuados por um único erro de 80 cp. A % de acurácia parece a mesma, mas o perfil de perda de peões-centavos é completamente diferente. Para mais sobre essa distinção, veja [como a perda de peões-centavos é calculada](/blog/what-is-centipawn-loss#how-acpl-is-calculated).

## O Que uma Acurácia "Brilhante" Realmente Parece

A maioria dos jogadores fixa-se no topo da escala. Então como é 99%+ de acurácia?

É essencialmente impossível sustentar ao longo de uma partida inteira. Mesmo motores de classe mundial jogando no mesmo nível registram alguns porcento de perda de acurácia em 50+ lances. Uma partida com 99% de acurácia geralmente significa:
- A partida foi extremamente curta
- A maioria dos "lances" foram capturas ou recapturas forçadas sem decisão real
- Um jogador estava vencendo tão facilmente que toda "alternativa" era catastrófica, fazendo cada lance contar como ótimo

Para melhoria real, acompanhe a **acurácia média em 20+ partidas**, não um pico de partida única. Consulte nosso [guia de benchmarks de acurácia por rating](/blog/chess-accuracy-by-rating-guide) para entender o que sua acurácia média significa no seu nível.

## Acurácia vs. Perda de Peões-Centavos — a Diferença Mais Profunda

Uma pergunta comum é: "Se a acurácia vem da perda de peões-centavos, por que olhar para ambas?" A resposta curta é que **acurácia é uma métrica processada** enquanto **perda de peões-centavos é dado bruto** —e cada uma serve a um propósito diferente.

### O Que a Perda de Peões-Centavos Mede

[A perda de peões-centavos](/blog/what-is-centipawn-loss) é a diferença absoluta na avaliação (em centésimos de um peão) entre o lance escolhido e o melhor lance do motor. Se o Stockfish diz que o melhor lance dá +1,00 e seu lance dá +0,40, sua perda de peões-centavos para aquele lance é 60. Simples.

A perda média de peões-centavos (ACPL) é a média dessas diferenças por lance ao longo de toda a partida. É um número direto, não processado. Não há escalonamento, limitação ou curva —simplesmente diz, em média, quão longe do ótimo foi o seu jogo.

### O Que a % de Acurácia Mede

A % de acurácia pega os dados brutos de perda de peões-centavos e os passa por uma **função de conversão não-linear**. O propósito dessa conversão é tornar a métrica mais intuitiva: uma escala 0–100 que humanos podem entender imediatamente.

Mas aqui está o detalhe crítico: **a % de acurácia não é proporcional à perda de peões-centavos**.

### A Relação Não-Linear

A relação entre sua perda média de peões-centavos e sua % de acurácia segue uma curva —perdas pequenas no topo da escala punem muito mais do que perdas grandes na base. Isso tem implicações práticas reais:

| Perda Média de Peões-Centavos | % Acurácia Aproximada | O Que Significa |
|-------------------------------|----------------------|-----------------|
| 0 cp | 99,9%+ | Jogo perfeito de motor —essencialmente inatingível para humanos |
| 10 cp | ~93% | Uma partida de clube muito forte, a maioria dos lances foram excelentes ou melhores |
| 25 cp | ~82% | Uma partida decente com algumas imperfeições notáveis |
| 50 cp | ~68% | Várias imprecisões ou um erro moderado |
| 100 cp | 50% | Erros claros; provavelmente um ou dois graves |
| 200 cp | ~32% | Múltiplos graves, ou um erro catastrófico |
| 500 cp | ~15% | O motor mal reconhece o jogo como xadrez |

O salto de 10 cp para 25 cp (apenas 15 peões-centavos extras em média) cai sua acurácia de ~93% para ~82% —um impacto de 11 pontos. Mas o salto de 100 cp para 200 cp (100 peões-centavos extras) cai de 50% para 32% —apenas 18 pontos para mais de 6× o aumento em peões-centavos.

**Por que isso importa:** Um único erro de 70 cp em uma partida limpa (digamos, 15 lances com 5 cp cada) lhe dá uma média de ~9 cp, que mapeia para ~93% de acurácia. O mesmo erro de 70 cp em uma partida confusa (15 lances com média de 30 cp) lhe dá uma média de ~33 cp, que mapeia para ~78%. O erro lhe custou igualmente em termos do motor, mas seu impacto na % de acurácia depende inteiramente da qualidade do resto do seu jogo.

O gráfico abaixo visualiza isso diretamente:

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
  <text x="340" y="32" text-anchor="middle" fill="white" font-size="16" font-weight="700" letter-spacing="0.3">% Acurácia vs. Perda Média de Peões-Centavos (Relação Não-Linear)</text>
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
  <text x="360" y="350" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="0.3">Perda Média de Peões-Centavos (cp)</text>
  <text x="18" y="180" text-anchor="middle" fill="#94a3b8" font-size="12" letter-spacing="0.3" transform="rotate(-90, 18, 180)">% Acurácia</text>
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
    <text x="29" y="130" text-anchor="middle" fill="#10b981" fill-opacity="0.5" font-size="10" transform="rotate(-90, 29, 130)">FAIXA GM</text>
  </g>
  <g transform="translate(186, 55)">
    <rect x="0" y="-2" width="116" height="250" fill="#f59e0b" fill-opacity="0.06" rx="2"/>
    <text x="58" y="130" text-anchor="middle" fill="#f59e0b" fill-opacity="0.5" font-size="10" transform="rotate(-90, 58, 130)">FAIXA CLUBE</text>
  </g>
  <g transform="translate(302, 55)">
    <rect x="0" y="-2" width="348" height="250" fill="#ef4444" fill-opacity="0.06" rx="2"/>
    <text x="174" y="130" text-anchor="middle" fill="#ef4444" fill-opacity="0.5" font-size="10" transform="rotate(-90, 174, 130)">FAIXA DE GRANDE PERDA</text>
  </g>
</svg>
</div>

Mensagem principal: **a % de acurácia é comprimida no topo e esticada na base.** Uma melhoria de 20 cp de 100 cp para 80 cp move sua acurácia de 50% para 57% —modesto. Mas a mesma melhoria de 20 cp de 20 cp para 0 cp move sua acurácia de 86% para 100% —quase três vezes o impacto. O motor pune cada pequeno desvio do jogo perfeito desproporcionalmente. Esta é uma razão pela qual grandes mestres obcecam por melhorias aparentemente "pequenas" no seu jogo: reduzir 5 cp da sua média é muito mais difícil no topo, e a recompensa de acurácia é muito mais íngreme.

## Um Exemplo Concreto: Um Lance Que Muda Tudo

Vamos tornar isso real com uma posição específica da **Defesa dos Dois Cavalos**, uma abertura afiada onde uma única decisão pode oscilar a avaliação em vários peões.

### A Posição

> **FEN:** `r1bqkb1r/ppp2ppp/2n5/3Pp3/2B5/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 5`

Isso surge após: **1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5**

```
      Brancas jogam? Não — é a vez das Pretas.
      ┌─ Posição após 5.exd5 ──────────────────────┐
      │  r . b q k b . r                              │
      │  p p p . . p p p                              │
      │  . . n . . . . .                              │
      │  . . . P p . . .                              │
      │  . . B . . . . .                              │
      │  . . . . . N . .                              │
      │  P P P P . P P P                              │
      │  R N B Q K . . R                              │
      │  Pretas jogam                                  │
      └──────────────────────────────────────────────┘
```

As Pretas enfrentam uma decisão crítica. A continuação *correta* é **Na5** —atacando o bispo de casas claras das Brancas antes que ele possa causar dano. O *grave* é **Nxd5?**, que parece natural (recapturando o peão e centralizando o cavalo) mas cai no infame **Ataque Fígado Frito**.

### Os Dois Caminhos

| Caminho | Lance | Avaliação Após | Perda de Peões-Centavos | Impacto na Acurácia |
|---------|-------|----------------|------------------------|---------------------|
| Melhor do motor | **Na5** atacando o bispo | ~+0,9 (Brancas levemente melhores — Pretas têm compensação com o cavalo mal colocado) | 0 cp | ~95%+ para este lance |
| Grave natural | **Nxd5?** recapturando | ~+3,5 (Brancas estão vencendo — **7.Nxf7!** segue) | 260 cp | ~25% para este lance |
| Alternativa sólida | **b5** (variação Ulvestad) | ~+0,8 (jogável, afiada) | ~10 cp | ~90% |

A realidade brutal: **Nxd5?** parece um lance normal de desenvolvimento. Você captura o peão, centraliza seu cavalo, fica ativo. Mas a avaliação do Stockfish grita que você acabou de cometer um erro de 260 peões-centavos —o suficiente para cair sua acurácia de jogo de um potencial 92% para algo como 65% em um único lance.

### Antes e Depois: A Oscilação da Avaliação

**Antes do lance das Pretas (posição após 5.exd5):** A avaliação é aproximadamente **+0,3** a favor das Brancas —uma leve vantagem por ter um peão a mais (mesmo sendo um sacrifício temporário). A posição ainda está no reino do xadrez normal.

**Após Nxd5? (erro das Pretas):** As Brancas jogam **7.Nxf7!** —o sacrifício do Fígado Frito. Após Kxf7 Qf3+ Ke6, as Brancas têm apenas uma peça pelo cavalo sacrificado, mas o ataque é avassalador. A avaliação pula para **+3,5+**. O rei Preto está no centro, exposto, e as Brancas têm Qf3 ameaçando mate, Nc3 atacando o cavalo cravado, e todas as peças Brancas prontas para entrar no ataque.

**Após Na5 (correto):** A avaliação das Brancas é +0,9 —as Brancas têm uma vantagem estável, mas as Pretas têm jogo razoável. A diferença de acurácia entre as duas continuações é enorme.

Isso ilustra uma verdade crucial sobre a pontuação de acurácia: **o motor julga o lance em si, não sua intenção.** Um lance "natural" que parece bom para um humano pode ser uma catástrofe de 260 cp para o Stockfish. Sua % de acurácia refletirá o julgamento do motor, capturando exatamente quão longe seu caminho escolhido se desviou do ótimo.

> Esta posição e a linha do Fígado Frito são discutidas mais adiante em nosso guia de [perda de peões-centavos em sequências táticas](/blog/what-is-centipawn-loss#centipawn-loss-in-tactical-sequences).

## Mergulho Profundo em Posições: Acurácia em Ação

Teoria é uma coisa —vamos ver como a acurácia se desempenha em posições reais. Abaixo estão três posições que mostram exatamente como a perda de peões-centavos se traduz em acurácia, e por que o julgamento do motor frequentemente diverge da intuição humana.

### Posição 1: O Lance de 99% vs. o Lance de 70%

<chess-position
  fen="r1bq1r2/ppp2kpp/2n5/3np3/2B5/5N2/PPPP1PPP/RNBQK2R w KQ - 0 7"
  caption="Brancas jogam — tanto Nxe5+ quanto Qf3+ recuperam a peça, mas o motor vê uma diferença de 1,5 peão entre eles."
  orientation="white"
  arrows="b1c3:green,f3e5:red" badge="best"></chess-position>

Esta posição surge no Ataque Fígado Frito após **1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5 6.Nxf7 Kxf7**. As Brancas sacrificaram uma peça em f7 e agora precisam recapturar. Dois lances ambos vencem —mas o motor fortemente prefere um.

| Lance | Avaliação Após | Perda de Peões-Centavos | Acurácia por Lance | O Que Acontece |
|-------|----------------|------------------------|---------------------|----------------|
| **Nxe5+** (melhor do motor) | **+4,0** — Brancas estão vencendo | 0 cp | **~99%** | Ganha a peça limpa. Após 7...Kd6 8.Qf3+ Ke6 9.Nxc6, as Brancas têm uma peça a mais com posição avassaladora. |
| **Qf3+** (alternativa tentadora) | **+2,5** — Brancas ainda vencendo | ~150 cp | **~70%** | Também ganha a peça, mas as Pretas obtêm uma posição mais coordenada após 7...Ke6 8.Nxc6 Nxc6, e a vantagem das Brancas é menos dominante. |

Ambos os lances levam a uma posição vencedora. Mas o intervalo de 150 peões-centavos entre eles reflete uma diferença estratégica real: **Nxe5+** recupera a peça imediatamente com um xeque forçado, mantendo controle total. **Qf3+** atrasa a recaptura, dando às Pretas tempo para consolidar.

A acurácia por lance captura isso precisamente: ~99% para Nxe5+ significa que o motor considera essencialmente o único bom lance. ~70% para Qf3+ significa que uma parte significativa do potencial da posição foi deixada na mesa. Essa diferença —29 pontos percentuais— é inteiramente sobre *quão bem* você converteu, não *se* você converteu.

### Posição 2: A Imprecisão Que Ainda Vence

<chess-position
  fen="8/5k2/8/2pPP3/2P5/2K5/6R1/2r5 w - - 0 1"
  caption="Brancas jogam — tanto Rg7+ quanto Kd6 vencem, mas um maximiza a acurácia enquanto o outro convida risco desnecessário."
  orientation="white"
  arrows="c3b3:green,c3d3:red" badge="best"></chess-position>

As Brancas têm um final de torre dominante: peões passados conectados na 5ª fileira, uma torre ativa, e a torre Preta presa defendendo passivamente. Dois lances ambos vencem —mas a diferença de acurácia é reveladora.

| Lance | Avaliação Após | Perda de Peões-Centavos | Impacto na Acurácia do Jogo | O Que Acontece |
|-------|----------------|------------------------|----------------------------|----------------|
| **Rg7+** (melhor do motor) | **+9,0** — completamente vencedor | 0 cp | **~92%** | Toma a 7ª fileira com xeque. Após 1...Kf8 2.Rf7+ Rxf7 3.exf7, o peão-d promove enquanto o peão-e o apoia. |
| **Kd6** (alternativa razoável) | **+5,5** — ainda vencendo | ~350 cp | **~82%** | Também vence, mas as Pretas obtêm mais recursos defensivos. A conversão leva mais tempo e requer acompanhamento mais preciso. |

Kd6 não é um grave —ainda está claramente vencendo. Mas o intervalo de 350 peões-centavos mostra que as Brancas cederam uma parte significativa da vantagem. Em uma partida mais longa, essa vantagem perdida poderia dar às Pretas contrajogo que não existiria após Rg7+.

**Este é o insight crucial:** mesmo em uma posição vencedora, a acurácia mede *quão eficientemente* você converteu. Uma partida onde você teve +9,0 e converteu com 92% de acurácia é uma qualidade de jogo fundamentalmente diferente de uma onde você teve +9,0 e converteu com 82%. O motor vê a diferença —e sua pontuação de acurácia também.

### Posição 3: O Final Onde a Acurácia Mais Importa

<chess-position
  fen="8/4k3/4P3/4K3/8/8/8/8 b - - 0 1"
  caption="Pretas jogam — Kd8 empata. Kf8 perde. Um lance é a diferença entre empate e derrota."
  orientation="black"
  arrows="e7e8:green,e7d8:red" badge="best"></chess-position>

Este é um final de rei e peão onde as Brancas têm um peão na 7ª fileira, apoiado pelo rei. O único trabalho das Pretas é ficar na frente do peão. A escolha é binária:

| Lance | Resultado | Perda de Peões-Centavos | Acurácia por Lance | Por quê |
|-------|-----------|------------------------|---------------------|---------|
| **Kd8** (correto) | **Empate** | 0 cp | **~99%** | Bloqueia o peão de promover. As Brancas não podem progredir —o rei não pode flanquear sem abandonar o peão. |
| **Kf8** (perdedor) | **Derrota** | ~900 cp | **~5%** | Deixa o peão promover imediatamente com e8=Q. Fim de jogo. |

Este é o caso extremo: a mesma posição, o mesmo jogador, e a diferença de acurácia entre os dois lances é de **94 pontos percentuais**. No meio-jogo, um erro de 900 cp pode acontecer através de uma falha tática complexa. Em um final como este, não há nada para calcular —é conhecimento puro. Ou você sabe que o peão promove ou não sabe.

**Os finais são onde as pontuações de acurácia são mais brutalmente honestas.** Na abertura, você pode marcar 90% seguindo teoria memorizada. No meio-jogo, táticas complexas criam ambiguidade. Mas no final, cada lance é uma decisão clara com uma avaliação clara. Não há onde se esconder. Um único lance errado de rei pode transformar uma posição empatada em uma derrota —e sua pontuação de acurácia refletirá isso instantaneamente.

É por isso que acompanhar sua acurácia de final separadamente da sua acurácia de meio-jogo é tão valioso. Se sua acurácia geral é 85% mas sua acurácia de final é 70%, você sabe exatamente onde focar seu estudo.

## O Problema da Fase: Onde Sua Acurácia Realmente Cai

Pesquisas em partidas amadoras consistentemente mostram que a acurácia não cai uniformemente em todas as fases:

**Abertura (lances 1–15):** A maioria dos jogadores tem alta acurácia aqui porque estão seguindo linhas memorizadas. A acurácia "parece boa" mas não reflete cálculo real —reflete preparação.

**Meio-jogo (lances 15–35):** É aqui que as quedas mais acentuadas ocorrem. As táticas ficam complexas, a pressão de tempo aumenta, e seus padrões memorizados se esgotam. Esta fase é a área de maior alavancagem para melhoria.

**Final (lances 35+):** Muitos jogadores perdem acurácia aqui também, mas frequentemente é por pressão acumulada ou uma posição tecnicamente perdida —não erros de cálculo.

Quando você analisa suas partidas, olhe a acurácia *por fase*, não apenas o número geral. A análise de perda de peões-centavos pode ajudar com isso —veja [acompanhando a perda de peões-centavos por fase do jogo](/blog/what-is-centipawn-loss#acpl-by-game-phase).

## Como Usar a Acurácia Para Realmente Melhorar

1. **Procure os lances discrepantes.** Ordene seus lances por perda de peões-centavos e estude os 3 principais. Essas são suas decisões mais caras.

2. **Acompanhe por sistemas de abertura.** Você pode ter média de 88% na Italiana mas apenas 79% na Siciliana Dragão. Essa diferença diz onde sua preparação termina e seu cálculo começa.

3. **Compare controles de tempo semelhantes.** Uma partida de blitz de 5 minutos com 80% vs. uma partida rápida de 15 minutos com 87% é normal. Se sua acurácia rápida está próxima da sua acurácia blitz, você não está usando o tempo extra efetivamente. Para mais sobre como a perda de peões-centavos escala com o controle de tempo, veja [perda média de peões-centavos por controle de tempo](/blog/what-is-centipawn-loss#acpl-by-time-control).

4. **Rode um relatório de jogo.** O FireChess escaneia suas últimas N partidas do Lichess ou Chess.com e agrupa suas quedas de acurácia em padrões —[vazamentos de abertura](/blog/how-to-find-opening-weaknesses) repetidos, pontos cegos táticos típicos, falhas de técnica de final— para que você possa ver tendências em vez de flutuações individuais.

5. **Não busque 99%.** Uma partida com 99% de acurácia geralmente é uma partida curta com lances forçados. Busque consistência na faixa de 85–92% em muitas partidas, e use a perda de peões-centavos para medir a *magnitude* dos seus erros, não apenas a contagem.

O número de acurácia sozinho é uma bússola. O [detalhamento de perda de peões-centavos](/blog/what-is-centipawn-loss) é o mapa.

## FAQ: Pontuação de Acurácia de Xadrez

### Q: Como encontro minha pontuação de acurácia?

Faça upload das suas partidas no [scanner do FireChess em /analyze](/analyze) —ele mostra sua acurácia por lance, detalhamento de perda de peões-centavos, e a distribuição de emblemas (quantos lances Melhor, Boa, Imprecisão, Erro e Grave você jogou). Você pode escanear partidas do Lichess ou Chess.com, ou colar um PGN diretamente.

### Q: A acurácia de xadrez é a mesma coisa que "porcentagem de melhores lances"?

Não. A % de acurácia não é simplesmente "número de melhores lances dividido pelo total de lances." A maioria das plataformas usa uma fórmula ponderada que leva em conta a gravidade de cada erro. Um único grave de 100 cp arrasta sua acurácia para baixo muito mais do que três imprecisões de 5 cp, mesmo que a "porcentagem de melhor lance" as pese igualmente. O Lichess usa uma fórmula baseada na soma dos quadrados das perdas de peões-centavos, enquanto o Chess.com aplica uma curva semelhante a sigmoide na média.

### Q: Por que minha acurácia às vezes aumenta após um grave?

Ela não aumenta —a acurácia geral do jogo sempre diminui após um grave comparado a onde teria estado. Mas o cálculo de acurácia *por lance* pode produzir resultados contra-intuitivos se o grave levar a uma sequência forçada onde todos os lances restantes são óbvios. Por exemplo, se você pendura uma dama e então todos os lances restantes são recapturas forçadas com 0 cp de perda, a acurácia final pode parecer mais alta do que esperado —mas ainda é menor do que teria sido sem o grave. A distorção vem da natureza forçada do jogo subsequente.

### Q: Qual é uma boa acurácia para o meu nível de rating?

Consulte o gráfico no topo deste artigo para faixas típicas, mas diretrizes amplas:

| Rating | Acurácia Típica | O Que Significa |
|--------|-----------------|-----------------|
| Abaixo de 1000 | 60–70% | Múltiplos erros por partida; graves a cada 5–7 lances |
| 1000–1400 | 70–78% | Graves ocasionais; jogo de abertura inconsistente |
| 1400–1800 | 78–85% | Poucos graves completos; erros são imprecisões |
| 1800–2200 | 85–92% | Graves raros; a maioria das imprecisões são posicionais |
| 2200+ (NM/MI) | 92–96% | Uma ou duas imprecisões pequenas por partida |
| 2500+ (GM) | 95–98% | Lances que parecem "imprecisos" são frequentemente trocas estratégicas |

Lembre-se: estes variam significativamente por controle de tempo e complexidade de abertura.

### Q: A acurácia pode ser negativa ou ultrapassar 100%?

Algumas plataformas (como o Chess.com) limitam a acurácia a 0–100. Outras (como o Lichess) permitem que vá levemente acima de 100% em teoria se cada lance foi melhor que a primeira sugestão do motor (o que acontece em casos raros onde o motor muda de ideia entre iterações). Na prática, valores acima de 100% são essencialmente nunca exibidos. Valores de teto como 99,9% aparecem em partidas muito curtas e forçadas. No extremo baixo, uma partida com múltiplos graves do tamanho de uma dama pode se aproximar de 0%, embora a maioria das plataformas não exiba nada abaixo de 1–5%.

### Q: Como a acurácia difere da perda de peões-centavos?

Esta é a pergunta mais comum, e a resposta é **a % de acurácia é uma transformação comprimida e não-linear da perda de peões-centavos**:

- **Perda de peões-centavos** é dado bruto —a diferença real entre seu lance e o melhor do motor, medida em centésimos de um peão. É aditiva, linear, e diretamente comparável entre partidas.
- **% de acurácia** é uma métrica processada —ela pega as perdas de peões-centavos, aplica uma curva (ou outra função não-linear), e as mapeia para uma porcentagem 0–100. É intuitiva mas perde a informação da magnitude bruta.

Use perda de peões-centavos quando você quer saber *quanto* perdeu por lance. Use % de acurácia quando quer um resumo rápido e compreensível. Para melhoria séria, acompanhe ambas. Consulte nosso detalhamento completo em [O Que é Perda de Peões-Centavos?](/blog/what-is-centipawn-loss).

---

*Quer descobrir onde sua acurácia realmente cai? Rode um relatório FireChess —ele escaneia suas partidas recentes e mostra as posições onde você perdeu mais terreno, com detalhamentos de perda de peões-centavos e acurácia por lance, fase e controle de tempo.*
