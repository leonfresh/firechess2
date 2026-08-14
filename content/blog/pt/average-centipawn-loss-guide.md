---
title: "Perda Media de Centopea (ACPL): O Que E e Como Reduzir a Sua"
description: "Aprenda o que perda media de centopea significa no xadrez, como o ACPL e calculado, como e um bom ACPL em cada nivel de rating, e formas comprovadas de reduzi-lo."
date: "2026-08-14"
author: "FireChess Team"
tags: ["centipawn loss", "chess improvement", "game analysis", "ACPL", "move quality"]
canonical: https://firechess.com/pt/blog/average-centipawn-loss-guide
---

Voce acabou de jogar uma partida de 40 lances e o motor diz que seu ACPL foi 67. Isso e bom? Ruim? Medio para seu rating? A maioria dos jogadores de clube ve numeros de perda de centopea na sua tela de analise e nao faz ideia do que significam — so sabem que menor e melhor. Mas entender o ACPL e uma das formas mais rapidas de diagnosticar exatamente onde suas partidas erram, porque divide cada lance em uma nota de qualidade mensuravel.

A perda media de centopea (ACPL) e o melhor proxy unico de quao bem voce jogou relativo a melhor escolha do motor em cada lance. Nao e uma metrica perfeita — nenhum unico numero captura a historia completa de uma partida de xadrez — mas e o unico numero que diz se suas derrotas vem de um unico lance grave catastrofico ou de um padrao de pequenas imprecisoes. Essa distincao muda como voce deve treinar.

Envie suas partidas recentes para o [scanner da FireChess em /analyze](/analyze) e vera seu ACPL dividido por qualidade de lance: quantos lances **Melhor (!)** voce fez, quantas **Imprecisoes (?!)** acumulou, e onde os **Lances Graves (??)** pousaram. Essa divisao e onde a verdadeira perspectiva mora.

## O Que E Perda de Centopea?

Um centopea e um centesimo de peao — a unidade padrao que motores usam para avaliar posicoes de xadrez. Se o melhor lance do motor da a voce uma avaliacao de +1.50 (significando que voce esta a frente por um peao e meio), e voce joga um lance que da +0.80 em vez disso, sua perda de centopea naquele lance e 70 centopeas. Voce cedeu 0.70 peoes de vantagem por nao jogar a melhor escolha do motor.

A perda media de centopea (ACPL) simplesmente pega essa perda por lance e tira a media de todos os seus lances em uma partida. Se voce jogou 40 lances com uma perda total de centopea de 2.800, seu ACPL e 70. Algumas ferramentas contam apenas lances nao-forçados (pulando recapturas e respostas obvias); outras contam tudo. A FireChess conta todos os lances mas os separa em faixas de qualidade para voce ver a distribuicao.

Aqui esta a ideia-chave que a maioria dos jogadores perde: **ACPL nao e sobre jogar o melhor lance toda hora.** E sobre evitar os grandes erros. Uma partida onde voce joga 35 lances de qualidade "Bom" e comete um lance grave de 300cp tera ACPL mais alto do que uma partida com 40 lances de nivel "Imprecisao" mas sem lances graves. A partida dominada por lances graves *parece* pior porque e — um grande erro custa mais do que muitos pequenos.

### A Posicao Que Ilustra Isso

Tome esta posicao de uma Ruy Lopez, uma das aberturas mais analisadas do xadrez:

<chess-position fen="r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 b - - 0 9" caption="Pretas jogam na Ruy Lopez. A melhor escolha do motor e 9...Nb8 (a variacao Breyer, reposicionando o cavalo para d7). Jogar 9...Na5 em vez disso custa aproximadamente 25-30 centopeas — um lance na fronteira Bom-Imprecisao." orientation="black"></chess-position>

Pretas tem varios lances razoaveis aqui. O motor prefere **9...Nb8** — a famosa manobra Breyer, onde o cavalo recua para eventualmente redirecionar via d7 para melhores quadrados. Parece passivo, mas e uma arma de campeonato mundial por decadas. O lance **9...Na5** parece mais atacante (atacando o bispo), mas e ligeiramente menos preciso porque enfraquece o controle Preto de c5 e nao melhora a coordenacao.

A diferenca? Cerca de 25-30 centopeas. Um lance nao te mata. Mas se voce faz cinco lances assim em uma partida — cada um cedendo 25cp em vez de encontrar o melhor lance — voce doou 125 centopeas. Isso e mais do que um peao inteiro de vantagem que voce rendeu atraves de lances "nao quite certos." Ao longo de uma partida inteira, esses se acumulam em 15-25 pontos de ACPL, a diferenca entre "jogador de clube solido" e "precisa de trabalho serio."

## Como o ACPL E Calculado

O calculo e direto:

1. Para cada lance, o motor avalia a posicao **antes** do seu lance e a posicao **apos** seu lance
2. A perda de centopea = (avaliacao apos seu lance) − (avaliacao apos o melhor lance do motor)
3. ACPL = soma de todas as perdas de centopea por lance ÷ total de lances

Algumas nuances importantes:

- **Avaliacoes sao da perspectiva do lado que move.** Se Brancas jogam um lance que cai a avaliacao de +2.00 para +0.50, a perda de centopea Branca e 150cp. Se Pretas jogam um lance que cai a avaliacao de +0.50 para +2.00 (da perspectiva Preta, isso e −0.50 para −2.00), Pretas tambem perdem 150cp.
- **Lances forçados ainda sao contados** na maioria das ferramentas. Se voce tem apenas um lance legal que nao perde material, ainda "perde" centopeas se nao for a linha preferida do motor. Isso infla levemente o ACPL em posicoes afiadas.
- **Profundidade importa.** Um motor na depth 12 dara avaliacoes diferentes da depth 20. Consistencia dentro de uma ferramenta importa mais do que numeros absolutos. A FireChess usa Stockfish na depth 16 para analise — fundo o suficiente para avaliacoes confiaveis sem demorar para sempre. Para uma analise mais profunda de como a perda de centopea funciona nas suas partidas, veja nosso [explicador completo de perda de centopea](/blog/what-is-centipawn-loss).

### O Que o Sistema de Selos da FireChess Diz a Voce

Quando voce escaneia uma partida na FireChess, cada lance e classificado em uma das sete faixas de qualidade. O sistema de selos mapeia diretamente para perda de centopea:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="720" height="560" viewBox="0 0 720 560" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cpBg" x1="0" y1="0" x2="720" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
  </defs>
  <rect width="720" height="560" rx="18" fill="url(#cpBg)"/>
  <rect x="1" y="1" width="718" height="558" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="360" y="40" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700" letter-spacing="0.4" font-family="system-ui">Selos de Lance FireChess — Mapeamento de Perda de Centopea</text>
  <text x="360" y="62" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Cada selo corresponde a uma faixa de perda de centopea. Menor = melhor. Seu ACPL faz media disso em cada lance.</text>
  
  <!-- Brilliant -->
  <g transform="translate(30, 90)">
    <rect width="660" height="54" rx="10" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#22d3ee" font-size="18" font-weight="800" font-family="system-ui">!!</text>
    <text x="54" y="34" fill="#22d3ee" font-size="15" font-weight="700" font-family="system-ui">Brilhante</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp de perda · Lance que melhor move sacrificio que oscila a avaliacao a seu favor</text>
  </g>
  
  <!-- Best -->
  <g transform="translate(30, 150)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#34d399" font-size="18" font-weight="800" font-family="system-ui">!</text>
    <text x="54" y="34" fill="#34d399" font-size="15" font-weight="700" font-family="system-ui">Melhor</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp de perda · Voce combinou com a melhor escolha do motor</text>
  </g>
  
  <!-- Good -->
  <g transform="translate(30, 210)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.05" stroke="#10b981" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#6ee7b7" font-size="18" font-weight="800" font-family="system-ui">✓</text>
    <text x="54" y="34" fill="#6ee7b7" font-size="15" font-weight="700" font-family="system-ui">Bom</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">10-25 cp de perda · Jogo solido, ligeiramente subotimo mas fica dentro da logica da posicao</text>
  </g>
  
  <!-- Book -->
  <g transform="translate(30, 270)">
    <rect width="660" height="54" rx="10" fill="#94a3b8" fill-opacity="0.06" stroke="#94a3b8" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#cbd5e1" font-size="18" font-weight="800" font-family="system-ui">DB</text>
    <text x="54" y="34" fill="#cbd5e1" font-size="15" font-weight="700" font-family="system-ui">Livro</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-12 cp de perda · Lances 1-15 seguindo teoria de abertura conhecida</text>
  </g>
  
  <!-- Inaccuracy -->
  <g transform="translate(30, 330)">
    <rect width="660" height="54" rx="10" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fbbf24" font-size="18" font-weight="800" font-family="system-ui">?!</text>
    <text x="54" y="34" fill="#fbbf24" font-size="15" font-weight="700" font-family="system-ui">Imprecisao</text>
    <text x="200" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">25-75 cp de perda · Um escorregao — custou cerca de meio peao</text>
  </g>
  
  <!-- Mistake -->
  <g transform="translate(30, 390)">
    <rect width="660" height="54" rx="10" fill="#f97316" fill-opacity="0.08" stroke="#f97316" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fb923c" font-size="18" font-weight="800" font-family="system-ui">?</text>
    <text x="54" y="34" fill="#fb923c" font-size="15" font-weight="700" font-family="system-ui">Erro</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">75-200 cp de perda · Um erro real que caiu cerca de 1-2 peoes</text>
  </g>
  
  <!-- Blunder -->
  <g transform="translate(30, 450)">
    <rect width="660" height="54" rx="10" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#f87171" font-size="18" font-weight="800" font-family="system-ui">??</text>
    <text x="54" y="34" fill="#f87171" font-size="15" font-weight="700" font-family="system-ui">Grave</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">200+ cp de perda · Pendurou material, perdeu uma tatica vencedora, ou enfraqueceu fatalmente sua posicao</text>
  </g>
</svg>
</div>

O painel de resumo no topo de um escaneamento FireChess mostra algo como:

> **Brancas 78.7% acuracia · Melhor 11 · Livro 8 · Bom 3 · Grave 2 · ACPL 43.2**

Essa unica linha diz mais sobre a partida do que qualquer outra metrica. O numero ACPL e a media; a distribuicao de selos diz *onde* os problemas estao. Um jogador com 2 Graves e 0 Imprecisoes tem um problema diferente de um com 0 Graves e 12 Imprecisoes — mesmo que o ACPL seja identico.

## Qual E um Bom ACPL Por Rating?

Essa e a pergunta que todo mundo faz, e a resposta honesta e: **depende do controle de tempo, do tipo de posicao e da profundidade do motor.** Mas de milhares de escaneamentos FireChess em todos os niveis de rating, aqui estao as faixas tipicas:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="380" viewBox="0 0 680 380" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acplBg" x1="0" y1="0" x2="680" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#0d1225"/>
    </linearGradient>
  </defs>
  <rect width="680" height="380" rx="16" fill="url(#acplBg)"/>
  <rect x="1" y="1" width="678" height="378" rx="15" stroke="#1e293b" stroke-opacity="0.5"/>
  <text x="340" y="36" text-anchor="middle" fill="#f1f5f9" font-size="18" font-weight="700" font-family="system-ui">ACPL por Nivel de Rating (Faixas Tipicas)</text>
  <text x="340" y="56" text-anchor="middle" fill="#64748b" font-size="12" font-family="system-ui">Baseado em analise de partidas de nivel de clube · Menor e melhor</text>
  
  <line x1="180" y1="80" x2="180" y2="340" stroke="#1e293b" stroke-width="1"/>
  <line x1="310" y1="80" x2="310" y2="340" stroke="#1e293b" stroke-width="1"/>
  <line x1="440" y1="80" x2="440" y2="340" stroke="#1e293b" stroke-width="1"/>
  <line x1="570" y1="80" x2="570" y2="340" stroke="#1e293b" stroke-width="1"/>
  
  <text x="180" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">50</text>
  <text x="310" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">100</text>
  <text x="440" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">150</text>
  <text x="570" y="360" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">200</text>
  
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
  
  <text x="50" y="280" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">Abaixo de 1000</text>
  <rect x="140" y="266" width="420" height="22" rx="4" fill="#ef4444" fill-opacity="0.45"/>
  <text x="350" y="282" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">130-200+ ACPL</text>
  
  <text x="340" y="325" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">Faixas assumem controle de tempo 15+10 ou mais longo · Blitz/rapid rodam 10-20% mais alto</text>
</svg>
</div>

Algumas coisas saltam dos dados:

**A faixa 1400-1800 e onde a maioria dos jogadores de clube vive**, e um ACPL de 50-80 e completamente normal. Voce nao e "ruim" em 65 ACPL — voce e medio para seu rating. O problema e se seu ACPL *fica* em 65 conforme voce tenta subir. Para quebrar 1800, voce precisa consistentemente ficar abaixo de 50.

**Blitz infla tudo.** Um jogador 1600 pode ter 45 ACPL em uma partida 15+10 mas 80 ACPL em blitz 3+0. A velocidade de jogo importa enormemente. Sempre compare ACPL dentro do mesmo controle de tempo.

**Um lance grave destroi a media.** Um jogador 1500 que joga 38 lances em media de 15cp (excelente para esse rating) mas comete um lance grave de 400cp termina com ~25 ACPL para aquela partida. O lance grave sozinho adicionou 10 pontos a media. E por isso que a distribuicao de selos importa mais do que o numero bruto — uma partida com 1 Grave e 39 lances Bom e muito diferente de uma com 20 Imprecisoes.

## Por Que Seu ACPL E Mais Alto Do Que Deveria

Apos escanear milhares de partidas na FireChess, os mesmos padroes aparecem repetidamente. Aqui estao os tres maiores assassinos de ACPL no nivel de clube, com posicoes reais para mostrar como parecem.

### Padrao 1: A Lacuna de Conhecimento de Abertura

O pico mais comum de ACPL acontece nos primeiros 15 lances. Jogadores que nao conhecem bem sua abertura fazem lances "de aparencia razoavel" que sutilmente enfraquecem sua posicao em 30-50 centopeas cada. Cinco desses lances e voce doou 150+ centopeas antes do meio-jogo comecar.

<chess-position fen="r1bq1rk1/pppnbppp/5n2/3p2B1/3P4/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8" caption="Brancas jogam no Gambito da Dama Recusado. Apos o natural 8.Bd3, Pretas tem igualdade solida. Mas se Brancas jogarem 8.Ne5?! em vez disso, Pretas ganha jogo facil com ...dxc4 e ...Nd5. Verifique seu ACPL de abertura na secao 'Vazamentos de Abertura' da FireChess." orientation="white"></chess-position>

### Padraro 2: O Erro de Calculo do Meio-Jogo

Os maiores picos de ACPL (200+ centopeas em um unico lance) acontecem quando voce perde um tiro tatico — seja do oponente ou seu proprio. Isso e diferente do problema de abertura: imprecisoes de abertura sao pequenas e consistentes, enquanto erros de calculo sao grandes e esporadicos.

<chess-position fen="r1bqkb1r/ppp2Npp/2n5/3np3/2B5/8/PPPP1PPP/RNBQK2R b KQkq - 0 6" caption="Pretas jogam apos 6.Nxf7 no Ataque Fígado Frito. O motor diz que Pretas deve jogar 6...Kxf7, aceitando o sacrificio e entrando em uma posicao afiada mas defensavel. O lance 6...Ke8?? e um lance grave — parece mais seguro mas perde para 7.Qf3. Um errado lance de rei custa 300+ centopeas." orientation="black"></chess-position>

### Padrao 3: A Falha de Conversao de Final

O terceiro assassino de ACPL e menos dramatico mas igualmente daninho: jogar o final mal. Uma posicao que e +2.00 (vencedora) lentamente sangra para +0.50 (empatada) porque voce nao conhece a tecnica. Cada lance perde 15-30 centopeas — nunca um lance grave, nunca ate um erro, apenas um fluxo constante de imprecisoes.

<chess-position fen="8/5kpp/8/8/8/4R3/r4PPP/6K1 w - - 0 1" caption="Brancas jogam em um final de torre. O ativo 1.Ra3 e muito mais forte que o passivo 1.Rf3+?! — trocar torres ou colocar a torre atras do peao e tecnica-chave. O ACPL de final e onde a maioria dos jogadores de clube perde mais pontos relativos a mestres." orientation="white"></chess-position>

## Como Reduzir Seu ACPL: Um Guia Pratico

Saber seu ACPL e inutil sem saber como melhora-lo. Aqui e o que realmente funciona, ordenado por eficacia para jogadores de clube.

### Conserte Seus Lances Graves Primeiro

Isso parece obvio mas a maioria dos jogadores faz errado. Tentam "pensar mais forte" ou "ser mais cuidadoso" — o que nao funciona porque lances graves nao sao causados por esforco insuficiente. Sao causados por **lacunas de reconhecimento de padroes**. Voce nao perdeu a tatica porque nao calculou; perdeu porque nao a *viu*.

A solucao: resolva puzzles taticos que focam nos padroes que voce realmente perde. Nao faca conjuntos de puzzles aleatorios. Apos escanear 20+ partidas na FireChess, olhe suas posicoes de lance grave — elas se agruparao em torno de motivos especificos. Se seus lances graves sao majoritariamente mates de fila de tras, estude mates de fila de tras. Se sao majoritariamente garfos de cavalo, estude garfos de cavalo. Pratica direcionada supera volume.

Para a maioria dos jogadores abaixo de 1600, eliminar lances graves sozinho cai o ACPL em 15-25 pontos. Essa e a maior melhoria disponivel.

### Aprenda Suas Aberturas Mais Fundo (Nao Mais Largo)

A secao de [vazamento de abertura](/blog/how-to-find-opening-weaknesses) na analise FireChess e uma mina de ouro. Se voce joga 1.e4 e seu ACPL nos primeiros 10 lances e 60+, voce esta perdendo a partida antes dela comecar. Mas a solucao nao e memorizar mais teoria — e entender *por que* o motor prefere certos lances nas posicoes que voce realmente alcancou.

Estude as linhas especificas onde voce faz imprecisoes. Se voce consistentemente joga o lance errado no lance 8 da Najdorf, aprenda as ideias *dessa* posicao, nao a arvore inteira da Najdorf. Profundidade nas suas linhas principais, nao amplitude atraves de muitas aberturas, e o que cai o ACPL de abertura.

### Melhore Sua Tecnica de Final

O ACPL de final e onde a maior diferenca entre jogadores de clube e mestres existe. Um jogador 1500 pode ter 90+ ACPL em finais; um jogador 2200 tem 25-35. A diferenca nao e calculo — e conhecimento.

Aprenda esses fundamentos de final em ordem:
1. **Finais de rei e peoes** — oposicao, quadrados-chave, regra do quadrado
2. **Finais de torre** — posicao de Lucena, posicao de Philidor, principios de atividade de torre
3. **Finais de bispo vs cavalo** — quando cada peca e melhor, como jogar cada lado

Cada um desses leva cerca de 5-10 horas para estudar adequadamente. Combinados, podem cair o ACPL de final de 90 para 50 — uma melhoria de 40 pontos que se traduz em 10-15 pontos de ACPL geral e um salto significativo de rating.

### Use uma Rotina de Analise Estruturada

A maioria dos jogadores analisa suas partidas errado. Olham a avaliacao do motor, veem um lance vermelho e pensam "deveria ter jogado a sugestao do motor." Isso nao e aprendizado — e apenas ver a resposta.

Em vez disso, use esta rotina apos cada partida:

1. **Identifique seus tres lances de maior ACPL.** Nao as sugestoes do motor — seus piores lances. O que voce jogou, e por que?
2. **Encontre a causa raiz.** Foi um erro de calculo (voce viu o lance certo mas avaliou errado)? Uma lacuna de conhecimento (nao conhecia o padrao)? Uma decisao de pressao de tempo?
3. **Estude o padrao.** Se foi erro de calculo, resolva 5 taticas similares. Se foi lacuna de conhecimento, leia sobre essa posicao de final ou abertura especifica.
4. **Rastreie seu ACPL ao longo do tempo.** Nao foque em partidas isoladas — olhe sua media movel de 30 partidas. Se esta caindo, seu treinamento esta funcionando.

O scanner da FireChess torna essa rotina rapida — envie um PGN, veja a divisao, aprofunde-se nos seus piores lances, e rastreie melhoria ao longo do tempo.

## A Diferenca Entre ACPL e Acuracia

Jogadores frequentemente confundem ACPL com acuracia, e algumas ferramentas usam os termos de forma intercambiavel. Sao relacionados mas diferentes:

| Metrica | O Que Mede | Escala | Caso de Uso |
|--------|-----------------|-------|----------|
| ACPL | Perda media de centopea por lance | Menor e melhor (0-200+) | Diagnosticando fracasas especificas |
| Acuracia | Quao proximo seus lances combinam com a melhor escolha do motor | 0-100% | Pontuacao geral de qualidade da partida |

Acuracia e um percentual — diz com que frequencia voce jogou o lance "certo." ACPL diz quao *errados* seus lances errados foram. Uma partida com 85% de acuracia e 60 ACPL tem alguns grandes erros. Uma partida com 85% de acuracia e 35 ACPL tem muitas pequenas imprecisoes. Mesma acuracia, problemas muito diferentes.

## Mitos Comuns de ACPL Desmascarados

**"Menor ACPL sempre significa melhor jogo."** Nao necessariamente. Em uma posicao completamente empatada, ambos jogadores podem ter 15 ACPL — estao jogando precisamente, mas nada esta acontecendo. Em uma partida tatica afiada, ambos jogadores podem ter 60 ACPL apesar de jogarem bem, porque as posicoes sao tao complexas que ate bons lances perdem alguns centopeas. Contexto importa.

**"Preciso jogar como um motor para ter ACPL baixo."** Nao. Voce precisa evitar lances graves e conhecer suas aberturas. Um jogador 1600 com bom conhecimento de abertura e taticas solidas pode alcançar 40-50 ACPL sem jogar um unico lance "brilhante." Consistencia supera brilhantismo.

**"ACPL nao leva em conta a complexidade da posicao."** Isso e parcialmente verdade — uma posicao quiet e mais facil de jogar precisamente do que uma afiada. Mas em uma amostra grande de partidas, a complexidade faz media. Se seu ACPL e consistentemente alto em todos os tipos de partida, o problema e voce, nao as posicoes.

## Rastreando Seu ACPL Ao Longo Do Tempo

O ACPL de uma unica partida diz quase nada. Xadrez e muito variavel — voce pode jogar uma partida limpa em 25 ACPL seguida de um desastre em 120 ACPL, e nenhuma representa seu nivel "verdadeiro." O que importa e a tendencia.

Escaneie pelo menos 20 partidas — idealmente do mesmo controle de tempo — e olhe:
- **Seu ACPL medio em todas as partidas.** Essa e sua linha de base.
- **A distribuicao.** Voce tem algumas partidas catastroficas puxando a media para cima, ou e consistentemente alto?
- **A divisao de selos.** Quantos Graves por partida? Quantas Imprecisoes?
- **ACPL de abertura vs meio-jogo vs final.** Onde voce esta perdendo mais pontos?

O [scanner da FireChess em /analyze](/analyze) calcula tudo isso automaticamente. Envie seu PGN, espere a analise, e vera exatamente onde sua perda de centopea se concentra. Use esses dados para focar seu treinamento, nao apenas para se sentir mal sobre seus lances graves.

Melhorar ACPL e um jogo longo. A maioria dos jogadores ve uma queda de 5-10 pontos ao longo de 3 meses de treinamento direcionado, o que se traduz em 100-200 pontos de rating. Nao e dramatico, mas e real — e diferente de memorizar linhas de abertura, a melhoria e permanente porque e baseada em reconhecimento de padroes e tecnica, nao memorizacao mecanica.

## FAQ

### O que e perda media de centopea no xadrez?

A perda media de centopea (ACPL) mede quao longe seus lances se desviam da melhor escolha do motor, tirando a media de todos os lances em uma partida. Cada lance e avaliado: se o melhor lance do motor da +1.50 e seu lance da +1.00, voce perdeu 50 centopeas naquele lance. Seu ACPL e a perda total de centopea dividida pelo numero de lances. Menor ACPL significa que voce jogou mais proximo das recomendacoes do motor.

### Qual e um bom ACPL para meu rating?

Faixas tipicas: jogadores abaixo de 1000 tem media de 130-200+ ACPL; 1000-1400 tem media de 80-130; 1400-1800 tem media de 50-80; 1800-2200 tem media de 30-50; e 2200+ tem media de 15-30. Esses numeros assumem controle de tempo 15+10 ou mais longo — partidas blitz tipicamente rodam 10-20% mais alto.

### Como encontro minha perda de centopea?

Envie o PGN da sua partida para a [ferramenta de analise da FireChess em /analyze](/analyze). O scanner mostra seu ACPL, percentual de acuracia e uma divisao de selos (quantos lances Melhor, Bom, Imprecisao, Erro e Grave voce fez). Voce tambem pode ver perda de centopea por lance na analise lance a lance. Lichess e Chess.com tambem mostram ACPL em seus recursos de analise de partida.

### Qual e a diferenca entre perda de centopea e acuracia?

Perda de centopea mede *quanta* avaliacao voce cedeu por lance (um numero continuo). Acuracia mede *com que frequencia* voce jogou a melhor escolha do motor (um percentual). Uma partida com 85% de acuracia e 60 ACPL tem alguns grandes erros. Uma partida com 85% de acuracia e 35 ACPL tem muitas pequenas imprecisoes. Ambas metricas sao uteis — acuracia para uma verificacao rapida, ACPL para melhoria direcionada.

### Por que meu ACPL e tao alto na abertura?

Picos de ACPL de abertura geralmente significam que voce esta jogando lances teoricamente conhecidos como inferiores — nao lances graves, mas lances que dao ao oponente um jogo mais facil. Verifique a secao "Vazamentos de Abertura" no seu escaneamento FireChess para ver quais posicoes custam mais centopeas. Estude essas linhas especificas em vez de tentar memorizar todo seu repertorio de aberturas. Aprender 3-4 posicoes criticas por abertura pode cair o ACPL de abertura em 10-20 pontos.

### O controle de tempo afeta o ACPL?

Absolutamente. Partidas rapid e classico produzem ACPL menor porque voce tem tempo para calcular. Partidas blitz e bullet inflam o ACPL em 10-20 pontos porque voce toma decisoes mais rapido. Sempre compare ACPL dentro do mesmo controle de tempo — um ACPL de 60 em blitz e muito mais impressionante do que um ACPL de 60 em rapid.

### O ACPL pode prever meu rating de xadrez?

O ACPL se correlaciona com o rating mas nao o prediz diretamente. Dois jogadores com ACPL identico podem ter ratings muito diferentes se um joga posicoes mais afiadas (maior complexidade, naturalmente maior ACPL) e o outro joga sistemas quietos. No entanto, se seu ACPL consistentemente fica 20+ pontos acima da faixa tipica para seu rating alvo, melhora-lo quase certamente te ajudara a subir. [Escaneie suas partidas na FireChess](/analyze) para ver como seu ACPL se compara aos seus pares de rating.
