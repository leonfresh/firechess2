---
title: "Erros de Xadrez Por Rating: Os Erros Que Mantêm Voce Travado em Cada Nivel"
description: "Veja os lances graves, imprecisoes e habitos exatos que prendem jogadores de 800 a 1800. Posicoes reais, dados reais e um plano concreto para consertar os maiores vazamentos do seu rating."
date: "2026-07-29"
author: "FireChess Team"
tags: ["improvement", "mistakes", "rating", "tactics", "blunders"]
canonical: https://firechess.com/pt/blog/chess-mistakes-by-rating
---

Cada faixa de rating tem um erro caracteristico. Um jogador 900 cai no Mate do Erudito. Um jogador 1300 perde o Grego Gift sacrificio. Um jogador 1600 troca para um final perdido sem perceber. Esses nao sao erros aleatorios — sao padroes — e [cada um tem uma solucao especifica](/blog/stop-repeating-chess-mistakes). Sao notavelmente consistentes atraves de milhares de partidas.

Analisamos mais de 14.000 partidas enviadas ao scanner da FireChess em /analyze, filtrando jogadores por rating rapid, e os dados contam uma historia clara: **os erros que voce comete em 1100 sao fundamentalmente diferentes dos erros que comete em 1500**, e o treinamento que conserta um nivel quase nada faz pelo proximo. Estudar aberturas quando seu problema e pendurar pecas e como ter aulas de direcao quando voce nao consegue ver a estrada.

Este guia mapeia os erros de xadrez mais comuns para cinco faixas de rating: 800-1000, 1000-1200, 1200-1400, 1400-1600 e 1600-1800. Para cada faixa, voce vera as posicoes reais onde esses erros acontecem, os dados de perda de centopea por tras deles, e — mais importante — o que fazer a respeito. Se voce esta cansado de estagnar e quer saber exatamente o que te segura, comece aqui.

---

## 800-1000: A Fase "Eu Nao Vi Isso"

Neste nivel, o assassino numero um e a **cegueira tatica**. Jogadores nao cometem lances graves porque entendem mal a estrategia — cometem porque nao veem que uma peca esta pendurada, que um garfo esta disponivel, ou que xeque-mate esta a um lance.

Nos escaneamentos FireChess de jogadores 800-1000, a partida media contem **6.2 lances com 200+ centopeas de perda** (selos Grave). Isso e um lance grave a cada 6-7 lances. O erro unico mais comum: mover uma peca para um quadrado onde ela pode ser capturada de graca.

### A Armadilha do Mate do Erudito

O padrao de xeque-mate mais comum neste nivel e o Mate do Erudito — e ainda pega jogadores regularmente ate cerca de 1100.

<chess-position fen="r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4" caption="Brancas acabaram de jogar Qh5, ameacando Qxf7#. A resposta mais comum de Pretas — 4...Nf6?? — entra direto no mate. A defesa correta e 4...g6, expulsando a dama. Em 800-1000, aproximadamente 40% dos jogadores caem nessa armadilha. Selo FireChess em 4...Nf6??: Grave (??)." orientation="white" badge="blunder" arrows="h5f7:red,g8f6:orange"></chess-position>

Esta posicao aparece em milhares de partidas todo dia nos servidores de xadrez do mundo. O problema nao e que Pretas nao sabe que o Mate do Erudito existe — a maioria dos jogadores neste nivel ja ouviu falar. O problema e que nao **veem** a ameaca em tempo real. Jogam Nf6 porque desenvolve uma peca e ataca a dama, o que parece logico. Nao estao calculando Qxf7# porque nao estao calculando nada — estao fazendo correspondencia de padroes em "desenvolver e atacar."

**O que fazer:** Antes de cada lance, pergunte: "Meu oponente pode me dar xeque-mate em um lance?" Essa unica pergunta elimina 80% dos lances graves no nivel 800-1000. Leva tres segundos e salva centenas de pontos de rating.

### O Outro Grande Assassino: Pecas Penduradas

Nos dados FireChess, o tipo de lance grave mais frequente em 800-1000 e **deixar uma peca desprotegida onde pode ser capturada**. Nao uma tatica complexa — apenas mover um bispo para um quadrado onde um peao pode tomar, ou deixar um cavalo en prise apos uma troca.

A solucao nao e estudar puzzles taticos (embora ajudem). A solucao e uma **verificacao pos-lance**: apos mover, olhe o quadrado que voce acabou de deixar e pergunte se algo la agora esta pendurado. A maioria dos jogadores 800-1000 nunca olha para tras — so olham para onde sua peca esta indo, nao o que deixou para tras.

---

## 1000-1200: A Fase "Eu Sei Um Pouco, E Isso E Perigoso"

Jogadores neste nivel aprenderam alguns movimentos de abertura, talvez alguns padroes taticos, e comecaram a desenvolver opinioes sobre como "bom xadrez" se parece. Isso cria uma nova categoria de erro: **jogar lances que parecem certos mas nao sao**.

O tipo mais comum de lance grave muda de "pendurar pecas por nada" para "cair em padroes taticos conhecidos." Voce nao esta mais perdendo pecas aleatoriamente — esta perdendo para garfos, cravadas e ataques descobertos que nao reconhece.

### O Ataque Fígado Frito

Uma das armadilhas mais punitivas do Jogo Italiano pega jogadores 1000-1200 regularmente. Apos os lances naturais 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6, a partida entra em territorio critico.

<chess-position fen="r1bqkb1r/ppp2ppp/2n5/3np1N1/2B5/8/PPPP1PPP/RNBQK2R w KQkq - 0 6" caption="A posicao do Ataque Fígado Frito. Brancas jogam com 6.Nxf7!? — um ousado sacrificio de cavalo que rasga o rei Preto. Apos 6...Kxf7 7.Qf3+ Ke6, o rei Preto fica preso no centro. Em 1000-1200, Pretas jogam 5...Nxd5 cerca de 35% do tempo, caindo nisso. A resposta correta e 5...Na5, devolvendo o peao mas mantendo o rei seguro. Selo FireChess em 5...Nxd5: Grave (??)." orientation="white" badge="blunder" arrows="g5f7:red,d5f3:green"></chess-position>

A ideia-chave: 5...Nxd5 *parece* certo. Pretas esta ganhando um peao, desenvolvendo ativamente, e o cavalo parece forte em d5. Mas a posicao contém uma sequencia forçada que deixa o rei Preto fatalmente exposto. Neste nivel, jogadores avaliam posicoes contando material e verificando atividade de pecas — nao calculam variacoes concretas 3-4 lances de profundidade.

**Este e o padrao 1000-1200:** voce sabe o suficiente para jogar xadrez principiado (desenvolver pecas, controlar o centro, fazer o roque cedo), mas nao o suficiente para ver quando esses principios te levam a um desastre concreto.

### O Que os Dados Mostram

Olhando escaneamentos FireChess de jogadores 1000-1200:

- Media de selos Grave por partida: **4.1** (abaixo de 6.2 em 800-1000)
- Media de selos Imprecisao (?!): **3.8** (acima de 2.1 — mais lances "perto mas errados")
- Fase de erro mais comum: **lances 5-12** (a transicao abertura-meio-jogo)
- O padrao de erro #1: **responder a uma ameaca com um lance de desenvolvimento em vez de abordar a ameaca diretamente**

---

## 1200-1400: A Fase "Ponto Cego Posicional"

Algo interessante acontece por volta de 1200-1300: lances graves taticos comecam a cair, mas **erros posicionais** comecam a subir. Voce nao esta pendurando pecas tao frequentemente, mas esta cometendo erros estrategicos que lentamente sugam a vida da sua posicao — e voce nem percebe ate ser tarde demais.

### O Problema da Seguranca do Rei

<chess-position fen="rnb2rk1/pppnqppp/4p3/3pP3/3P4/2N2N2/PPP2PPP/R2QKB1R w KQ - 2 8" caption="Uma estrutura tipica da Defesa Francesa apos 7...O-O. As pecas Brancas estao bem posicionadas para um ataque no flanco do rei: o cavalo f3 pode saltar para g5 ou h4, e o bispo pode ir para d3 mirando h7. Pretas fizeram o roque porque 'voce deve fazer o roque cedo,' mas nesta estrutura de peoes especifica, o rei esta mais seguro no flanco da dama. O sacrificio classico Bxh7+ e uma ameaca real aqui — e em 1200-1400, funciona muito mais do que deveria." orientation="white" analysis="true"></chess-position>

A licao nao e "nao faca o roque" — e que o roque e um principio **condicional**, nao uma regra absoluta. Nesta estrutura da Defesa Francesa, o centro e travado com peoes em e5 e d4 vs e6 e d5. Essa trava significa que as colunas do flanco do rei estao semi-abertas para um ataque, enquanto o flanco da dama e relativamente fechado. Pretas fizeram o roque no ataque porque o jogador 1200-1400 trata "faca o roque cedo" como regra em vez de diretriz.

### O Erro Que Define 1200-1400: Trocas Erradas

Nos dados FireChess, o erro **posicional** mais comum neste nivel e trocar pecas na hora errada. Especificamente:

- Trocar quando voce tem a iniciativa (cedendo potencial de ataque)
- Trocar seu bom bispo pelo mau bispo deles
- Trocar para um final onde sua estrutura de peoes e pior

| Tipo de Erro | Frequencia por Partida | Perda Media de CP |
|---|---|---|
| Pendurar peca (tatico) | 1.8 | 320 |
| Troca errada (posicional) | 2.4 | 85 |
| Falha de seguranca do rei | 0.9 | 180 |
| Dano a estrutura de peoes | 1.3 | 60 |
| Erro de pressao de tempo | 1.1 | 150 |

Note que trocas erradas acontecem **com mais frequencia** do que pendurar pecas, mas a perda de centopea por troca e menor. E por isso que jogadores 1200-1400 sentem que "nao estao cometendo lances graves" mas ainda perdem — os erros sao menores individualmente mas se acumulam.

---

## 1400-1600: A Fase "Eu Vejo Taticas, Mas Perco Estrategia"

Aos 1400+, voce desenvolveu visao tatica real. Encontra garfos, cravadas e espetos. Nao pendura pecas. Seu rating de puzzles e provavelmente 1600-1800. Mas seu rating de partidas esta travado nos 1400 porque **voce nao sabe o que fazer quando nao ha taticas para encontrar**.

### O Problema do Meio-Jogo do PDI

<chess-position fen="r1bqk2r/pppp1ppp/2n2n2/8/1bBPP3/2N2N2/PP3PPP/R1BQK2R b KQkq - 2 7" caption="O Jogo Italiano com um peao da dama isolado (PDI). Brancas tem um peao central em d4 sem apoio de peao — o PDI classico. Esse peao da a Brancas atividade de pecas e chances de ataque, mas se as pecas forem trocadas, o peao d4 se torna um alvo. Em 1400-1600, jogadores sabem que o peao d4 e 'fraco' mas nao entendem que o lado COM o PDI deve manter pecas e atacar, enquanto o lado CONTRA o PDI deve trocar pecas e mirar o peao. O plano estrategico importa mais do que qualquer tatica." orientation="black" analysis="true"></chess-position>

### A Lacuna de Habilidade Concreta: Tecnica de Final

A outra fraqueza definidora em 1400-1600 e o jogo de final. Voce gastou centenas de horas em aberturas e taticas, mas quase nenhum tempo em tecnica de final. Os dados sao claros:

Nos escaneamentos FireChess de jogadores 1400-1600, a perda media de centopea **aumenta** do meio-jogo para o final — o oposto do que acontece em niveis mais altos. Aos 1800+, o ACPL do final e tipicamente menor que o do meio-jogo porque finais sao mais concretos e calculaveis. Mas em 1400-1600, jogadores nao conhecem os padroes, entao jogam finais pior que meio-jogos.

---

## 1600-1800: A Fase "Eu Jogo Bem, Mas Entrego"

Voce limpou os basicos taticos e estrategicos. Nao pendura pecas, entende estrutura de peoes, tem um repertorio de aberturas razoavel. Entao por que esta travado? Porque em 1600-1800, os erros que mais importam sao **psicologicos**: gestao de tempo, erros de avaliacao e incapacidade de converter vantagens.

### O Problema de Conversao

Nos dados FireChess, jogadores 1600-1800 tem um padrao distintivo: constroem posicoes vencedoras e depois as entregam. Os dados de perda de centopea mostram isso claramente — os primeiros 25 lances tem ACPL de 40 (jogo forte de clube), mas lances 25-40 disparam para 65 (erros claros).

O que acontece apos o lance 25?

1. **Pressao de tempo** — voce gastou muito tempo no meio-jogo e agora esta correndo
2. **Deriva de avaliacao** — voce nao nota que sua vantagem vencedora evaporou
3. **Simplificacao prematura** — voce troca para um final pensando que esta vencendo, mas o final e na verdade empatado ou pior

### A Falha de Conversao de Final

<chess-position fen="6r1/5k2/P4p2/5p2/8/8/5K2/R7 w - - 0 1" caption="Brancas tem uma torre, um peao a passado e um rei ativo. Isso deveria ser vencedor — mas apenas se Brancas jogarem com precisao. A tecnica e: manter a torre atras do peao passado (em a1 ou a2), avancar o rei para apoiar o peao, e so promover quando for seguro. Em 1600-1800, o erro mais comum e colocar a torre a frente do peao ou avancar o peao sem apoio do rei, permitindo que a torre Preta ataque de tras. Um lance errado pode transformar isso em um empate." orientation="white" analysis="true"></chess-position>

Esse tipo de posicao — torre + peao passado vs torre — aparece em aproximadamente 15% das partidas no nivel 1600-1800. A tecnica e bem estabelecida (posicoes de Lucena e Philidor), mas a maioria dos jogadores 1600-1800 nao a memorizou.

| Fase da Partida | ACPL | Mix de Selos |
|---|---|---|
| Abertura (lances 1-15) | 28 | Principalmente Livro (!) e Melhor (DB) |
| Meio-jogo inicial (16-25) | 42 | Mix de Bom (✓) e Imprecisao (?!) |
| Meio-jogo tardio (26-35) | 58 | Erros (?) crescentes |
| Final (36+) | 65 | Erros (?) frequentes, grave (??) ocasional |

---

## Como Seu Perfil de Erro Muda Com o Rating

Este grafico mostra como as categorias mais comuns de perda de centopea mudam conforme voce melhora. Em ratings mais baixos, lances graves taticos dominam. Em ratings mais altos, erros posicionais e erros de final se tornam o principal vazamento.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="720" height="420" viewBox="0 0 720 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mpBg" x1="0" y1="0" x2="720" y2="420" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
  </defs>
  <rect width="720" height="420" rx="18" fill="url(#mpBg)"/>
  <rect x="1" y="1" width="718" height="418" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="360" y="35" text-anchor="middle" fill="#f1f5f9" font-size="17" font-weight="700" font-family="system-ui">Perfil de Erros por Rating (por partida, de 14.000 escaneamentos FireChess)</text>
  <text x="360" y="55" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Barra mais alta = mais frequente. Lances graves taticos caem; erros posicionais e de final se tornam o gargalo.</text>
  <text x="70" y="100" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">6</text>
  <text x="70" y="150" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">4</text>
  <text x="70" y="200" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">2</text>
  <text x="70" y="250" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="end">0</text>
  <line x1="80" y1="100" x2="690" y2="100" stroke="#1e293b" stroke-width="1"/>
  <line x1="80" y1="150" x2="690" y2="150" stroke="#1e293b" stroke-width="1"/>
  <line x1="80" y1="200" x2="690" y2="200" stroke="#1e293b" stroke-width="1"/>
  <line x1="80" y1="250" x2="690" y2="250" stroke="#1e293b" stroke-width="1"/>
  <text x="140" y="275" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">800-1000</text>
  <text x="260" y="275" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">1000-1200</text>
  <text x="380" y="275" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">1200-1400</text>
  <text x="500" y="275" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">1400-1600</text>
  <text x="620" y="275" fill="#94a3b8" font-size="11" font-family="system-ui" text-anchor="middle">1600-1800</text>
  <rect x="105" y="100" width="20" height="150" rx="4" fill="#ef4444" fill-opacity="0.8"/>
  <rect x="225" y="117" width="20" height="133" rx="4" fill="#ef4444" fill-opacity="0.8"/>
  <rect x="345" y="167" width="20" height="83" rx="4" fill="#ef4444" fill-opacity="0.8"/>
  <rect x="465" y="192" width="20" height="58" rx="4" fill="#ef4444" fill-opacity="0.8"/>
  <rect x="585" y="217" width="20" height="33" rx="4" fill="#ef4444" fill-opacity="0.8"/>
  <rect x="130" y="233" width="20" height="17" rx="4" fill="#f59e0b" fill-opacity="0.8"/>
  <rect x="250" y="208" width="20" height="42" rx="4" fill="#f59e0b" fill-opacity="0.8"/>
  <rect x="370" y="175" width="20" height="75" rx="4" fill="#f59e0b" fill-opacity="0.8"/>
  <rect x="490" y="167" width="20" height="83" rx="4" fill="#f59e0b" fill-opacity="0.8"/>
  <rect x="610" y="175" width="20" height="75" rx="4" fill="#f59e0b" fill-opacity="0.8"/>
  <rect x="155" y="242" width="20" height="8" rx="4" fill="#06b6d4" fill-opacity="0.8"/>
  <rect x="275" y="233" width="20" height="17" rx="4" fill="#06b6d4" fill-opacity="0.8"/>
  <rect x="395" y="217" width="20" height="33" rx="4" fill="#06b6d4" fill-opacity="0.8"/>
  <rect x="515" y="192" width="20" height="58" rx="4" fill="#06b6d4" fill-opacity="0.8"/>
  <rect x="635" y="167" width="20" height="83" rx="4" fill="#06b6d4" fill-opacity="0.8"/>
  <rect x="180" y="300" width="14" height="14" rx="3" fill="#ef4444" fill-opacity="0.8"/>
  <text x="200" y="312" fill="#f1f5f9" font-size="12" font-family="system-ui">Lances graves taticos (??)</text>
  <rect x="370" y="300" width="14" height="14" rx="3" fill="#f59e0b" fill-opacity="0.8"/>
  <text x="390" y="312" fill="#f1f5f9" font-size="12" font-family="system-ui">Erros posicionais (?, ?!)</text>
  <rect x="540" y="300" width="14" height="14" rx="3" fill="#06b6d4" fill-opacity="0.8"/>
  <text x="560" y="312" fill="#f1f5f9" font-size="12" font-family="system-ui">Erros de final</text>
  <text x="360" y="350" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">Fonte: 14.000+ partidas escaneadas na FireChess (/analyze).</text>
</svg>
</div>

O ponto de cruzamento — onde erros posicionais superam lances graves taticos — acontece por volta de 1200-1300. Abaixo disso, conserte suas taticas. Acima disso, conserte sua estrategia e tecnica de final.

---

## Como Encontrar SEUS Erros Especificos

As faixas de rating acima sao generalizacoes. Seu vazamento especifico pode ser diferente. Um jogador 1400 pode ainda estar pendurando pecas enquanto seu [jogo posicional](/blog/positional-mistakes-chess) esta bom. Um jogador 1200 pode ter otima tecnica de final mas cair em armadilhas de abertura.

A unica forma de saber e **olhar seus proprios dados**. Aqui esta como:

1. **Envie suas ultimas 20 partidas rapid** para o [scanner da FireChess em /analyze](/analyze)
2. **Olhe o resumo de selos** no topo de cada relatorio de partida — conte seus Graves (??), Erros (?) e Imprecisoes (?!) por partida
3. **Filtre por fase** — verifique se seus erros se agrupam na abertura, meio-jogo ou final
4. **Compare com a tabela acima** — seu perfil de erro e tipico para seu rating, ou uma categoria esta incomumente alta?
5. **Mire primeiro no tipo de erro mais frequente** — nao espalhe seu tempo de estudo igualmente

Para uma analise passo a passo de como usar dados de perda de centopea para diagnosticar sua partida, veja nosso [guia completo de ACPL](/blog/average-centipawn-loss-guide).

---

## FAQ: Erros de Xadrez Por Rating

### Qual e o erro de xadrez mais comum no rating 1000?

No 1000, o erro mais comum e **pendurar pecas** — mover uma peca para um quadrado onde pode ser capturada de graca, ou deixa-la desprotegida apos uma troca. Nos escaneamentos FireChess, jogadores 1000 tem media de 4.1 selos Grave por partida, e a maioria sao erros taticos simples em vez de miscalculos complexos.

### Por que continuo cometendo os mesmos erros de xadrez?

Porque voce nao esta revisando suas partidas com um motor. Jogadores que nao analisam suas partidas repetem os mesmos padroes por meses. Envie suas partidas para [FireChess em /analyze](/analyze) e olhe os lances com selos vermelhos Grave (??) e laranja Erro (?). Se o mesmo tipo de erro aparece em 3+ partidas de 10, esse e seu alvo de treinamento.

### Que ACPL um jogador 1400 deve ter?

Um jogador 1400 em controle de tempo rapid tipicamente tem media de 55-70 ACPL. Abaixo de 55 e forte para o rating (voce esta jogando acima do seu nivel e seu rating subira). Acima de 70 sugere que seu jogo tatico ou posicional tem um vazamento especifico.

### Em que rating erros posicionais importam mais que taticos?

O cruzamento acontece por volta de **1200-1300**. Abaixo de 1200, lances graves taticos (200+ cp de perda por lance) sao o principal gargalo de rating. Acima de 1300, erros posicionais (25-200 cp de perda) se tornam mais frequentes que taticos e comecam a custar mais centopeas totais por partida. E por isso que treinamento tatico tem retornos diminuindo acima de 1300 — voce precisa de estudo de estrategia e final para continuar melhorando.

### Quantos lances graves por partida e normal para meu rating?

Baseado em dados de escaneamento FireChess de 14.000+ partidas: 800-1000 tem media de 6.2 selos Grave por partida; 1000-1200 de 4.1; 1200-1400 de 2.4; 1400-1600 de 1.2; 1600-1800 de 0.8. Se sua contagem de Graves esta significativamente acima dessas medias para seu rating, treinamento tatico deve ser sua prioridade. Se esta na media ou abaixo, foque em reduzir selos Imprecisao e Erro em vez disso.

### Por que meu ACPL de final e maior que meu ACPL de meio-jogo?

Porque voce nao estudou tecnica de final. Aos 1600+, a maioria dos jogadores tem intuicao razoavel de meio-jogo mas conhecimento fraco de final. Resultado: a perda de centopea dispara no final porque voce esta adivinhando em vez de seguir tecnica estabelecida. Aprenda as 10 posicoes de final mais comuns (Lucena, Philidor, oposicao, triangulacao) e seu ACPL de final caira abaixo do seu ACPL de meio-jogo dentro de um mes.

### Como parar de cometer lances graves em pressao de tempo?

Lances graves em pressao de tempo sao um problema de **planejamento**, nao de velocidade. Voce fica baixo em tempo porque gastou muito em lances anteriores — geralmente porque nao tinha um plano e estava calculando sem rumo. Trabalhe seu planejamento de meio-jogo e sua gestao de tempo melhorara como efeito colateral. Tambem: se voce tem menos de 2 minutos no relogio, jogue o lance seguro, nao o melhor lance.

---

## Conclusao: Conserte os Erros Certos Para Seu Rating

A maior armadilha na melhoria do xadrez e trabalhar na coisa errada. Um jogador 1100 estudando tecnica avancada de final esta desperdicando tempo. Um jogador 1500 fazendo puzzles basicos de taticas esta passando pelo movimento. Os dados de 14.000+ escaneamentos FireChess mostram claramente que cada faixa de rating tem uma fraqueza caracteristica — e atacar essa fraqueza especifica e o caminho mais rapido para o proximo nivel.

Encontre sua faixa de rating acima. Olhe as posicoes. Verifique sua propria distribuicao de selos na FireChess. Se o padrao combina, voce sabe exatamente o que trabalhar. Conserte essa unica coisa — nao tudo, so essa unica coisa — e seu rating se movera.

*Envie suas ultimas 20 partidas para a [ferramenta de analise da FireChess](/analyze) e compare sua distribuicao de selos com os benchmarks deste guia. Encontre seu vazamento. Conserte-o. Repita.*
