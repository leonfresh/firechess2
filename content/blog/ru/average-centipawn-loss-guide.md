---
title: "Средний Centipawn Loss (ACPL): Что это и как снизить ваш"
description: "Узнайте, что значит средний centipawn loss в шахматах, как рассчитывается ACPL, какой хороший ACPL на каждом уровне и proven способы его снижения."
date: "2026-08-14"
author: "FireChess Team"
tags: ["centipawn loss", "chess improvement", "game analysis", "ACPL", "move quality"]
canonical: https://firechess.com/ru/blog/average-centipawn-loss-guide
---

Вы только что сыграли 40-ходовую партию, и движок говорит, что ваш ACPL — 67. Это хорошо? Плохо? Средне для вашего рейтинга? Most клубных игроков видят числа centipawn loss на экране анализа и не имеют понятия, что они значат — they просто знают, что ниже лучше. Но понимание ACPL — one из fastest способов диагностировать exactly, где ваши партии идут не так, потому что оно breaks каждый ход на измеримую качественную оценку.

Средний centipawn loss (ACPL) — best прокси того, насколько хорошо вы играли relative к первому выбору движка на каждом ходе. Это не идеальная метрика — no single число captures полную историю шахматной партии — но это то единственное число, которое tells, идут ли ваши потери от одного катастрофического зевка или паттерна мелких неточностей. Это различие changes, как вы should тренироваться.

Загрузите последние партии в [сканер FireChess на /analyze](/analyze) и вы увидите ACPL, разбитый по качеству ходов: сколько **Лучших (!)** ходов сделали, сколько **Неточностей (?!)** накопили и где приземлились **Зевки (??)**. Эта разбивка — where реальный инсайт lives.

## Что такое centipawn loss?

Centipawn — одна сотая пешки — стандартная единица, которую движки используют для оценки шахматных позиций. Если лучший ход движка даёт оценку +1.50 (meaning вы впереди на полторы пешки), а вы играете ход, дающий +0.80 вместо этого, ваш centipawn loss на этом ходе — 70 centipawn. Вы отдали 0.70 пешки преимущества, не сыграв первый выбор движка.

Средний centipawn loss (ACPL) simply берёт эту потерю за ход и усредняет across all ходов в партии. Если вы сыграли 40 ходов с общей потерей 2 800 centipawn, ваш ACPL — 70. Некоторые инструменты считают только не-вынуждающие ходы (пропуская отбития и очевидные ответы); другие считают всё. FireChess считает all ходы, but separates на качественные полосы, чтобы вы видели распределение.

Вот ключевой инсайт, который most игроков misses: **ACPL — не про игру лучшим ходом every раз.** Это про avoid крупные ошибки. Партия, где вы played 35 ходов «Хорошего» качества и сделали one зевок на 300 cp, будет иметь higher ACPL, чем партия с 40 ходами уровня «Неточность», but без зевков. Зевков-dominated партия *feels* worse, потому что так и есть — one крупная ошибка costs more many мелких. Смотрите наше [руководство по метрикам улучшения](/blog/chess-improvement-metrics-to-track), чтобы понять, как ACPL fits в общее отслеживание прогресса.

### Позиция, иллюстрирующая это

Возьмите эту позицию из испанской партии, одного из most анализируемых дебютов в шахматах:

<chess-position fen="r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 b - - 0 9" caption="Ход чёрных в испанской партии. Первый выбор движка — 9...Nb8 (вариант Брейера, переброска коня к d7 на лучшие поля). Ход 9...Na5 вместо costs roughly 25-30 centipawn — на границе Хороший/Неточность." orientation="black"></chess-position>

У чёрных several разумных хода. Движок предпочитает **9...Nb8** — знаменитый маневр Брейера, where конь отступает, чтобы eventually переброситься через d7 на лучшие поля. Выглядит пассивно, but decades был оружием чемпионата мира. Ход **9...Na5** выглядит более активным (атакует слона), but slightly менее точен, потому что ослабляет контроль чёрных над c5 и не improves координацию.

Разница? About 25-30 centipawn. Один ход не kills. Но если делаете five such ходов за партию — each отдавая 25 cp вместо нахождения лучшего — вы пожертвовали 125 centipawn. Это more полной пешки преимущества, surrendered through «не quite right» ходы alone. Over full партии they накапливаются до 15-25 ACPL пунктов — разница между «крепким клубным игроком» и «нуждается в серьёзной работе».

## Как рассчитывается ACPL

Расчёт straightforward:

1. Для каждого хода движок оценивает позицию **до** вашего хода и позицию **после**
2. Centipawn loss = (оценка после вашего хода) − (оценка после лучшего хода движка)
3. ACPL = сумма all потерь за ход ÷ общее число ходов

Some важные нюансы:

- **Оценки с перспективы ходящей стороны.** Если белые делают ход, опускающий оценку с +2.00 до +0.50, centipawn loss белых — 150 cp. Если чёрные делают ход, опускающий оценку с +0.50 до +2.00 (с перспективы чёрных, это −0.50 до −2.00), чёрные тоже теряют 150 cp.
- **Вынуждающие ходы всё ещё считаются** в most инструментах. Если у вас only один легальный ход, не теряющий материал, вы всё ещё «теряете» centipawn, если это не предпочтительная линия движка. Это slightly завышает ACPL в острых позициях.
- **Глубина matters.** Движок на глубине 12 даст other оценки, чем на глубине 20. Consistency внутри одного инструмента matters more абсолютных чисел. FireChess использует Stockfish на глубине 16 для анализа — достаточно глубоко для надёжных оценок без вечного ожидания. Для более глубокого understanding, как centipawn loss works across ваших партий, смотрите наше [полное объяснение centipawn loss](/blog/what-is-centipawn-loss).

### Что tells система значков FireChess

Когда сканируете партию на FireChess, каждый ход классифицируется в one из семи качественных полос. Система значков напрямую correspond centipawn loss:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="720" height="560" viewBox="0 0 720 560" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cpBg" x1="0" y1="0" x2="720" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080d1a"/><stop offset="1" stop-color="#0d1425"/>
    </linearGradient>
  </defs>
  <rect width="720" height="560" rx="18" fill="url(#cpBg)"/>
  <rect x="1" y="1" width="718" height="558" rx="17" stroke="white" stroke-opacity="0.05"/>
  <text x="360" y="40" text-anchor="middle" fill="#f1f5f9" font-size="20" font-weight="700" letter-spacing="0.4" font-family="system-ui">FireChess Move Badges — Centipawn Loss Mapping</text>
  <text x="360" y="62" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="system-ui">Each badge corresponds to a centipawn loss range. Lower = better. Your ACPL averages these across every move.</text>
  
  <!-- Brilliant -->
  <g transform="translate(30, 90)">
    <rect width="660" height="54" rx="10" fill="#06b6d4" fill-opacity="0.08" stroke="#06b6d4" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#22d3ee" font-size="18" font-weight="800" font-family="system-ui">!!</text>
    <text x="54" y="34" fill="#22d3ee" font-size="15" font-weight="700" font-family="system-ui">Brilliant</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp loss · Best-move sacrifice that swings the evaluation in your favour</text>
  </g>
  
  <!-- Best -->
  <g transform="translate(30, 150)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#34d399" font-size="18" font-weight="800" font-family="system-ui">!</text>
    <text x="54" y="34" fill="#34d399" font-size="15" font-weight="700" font-family="system-ui">Best</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-10 cp loss · You matched the engine's top choice</text>
  </g>
  
  <!-- Good -->
  <g transform="translate(30, 210)">
    <rect width="660" height="54" rx="10" fill="#10b981" fill-opacity="0.05" stroke="#10b981" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#6ee7b7" font-size="18" font-weight="800" font-family="system-ui">✓</text>
    <text x="54" y="34" fill="#6ee7b7" font-size="15" font-weight="700" font-family="system-ui">Good</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">10-25 cp loss · Solid play, slightly suboptimal but stays within the position's logic</text>
  </g>
  
  <!-- Book -->
  <g transform="translate(30, 270)">
    <rect width="660" height="54" rx="10" fill="#94a3b8" fill-opacity="0.06" stroke="#94a3b8" stroke-opacity="0.15"/>
    <text x="20" y="34" fill="#cbd5e1" font-size="18" font-weight="800" font-family="system-ui">DB</text>
    <text x="54" y="34" fill="#cbd5e1" font-size="15" font-weight="700" font-family="system-ui">Book</text>
    <text x="140" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">0-12 cp loss · Move 1-15 following known opening theory</text>
  </g>
  
  <!-- Inaccuracy -->
  <g transform="translate(30, 330)">
    <rect width="660" height="54" rx="10" fill="#f59e0b" fill-opacity="0.08" stroke="#f59e0b" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fbbf24" font-size="18" font-weight="800" font-family="system-ui">?!</text>
    <text x="54" y="34" fill="#fbbf24" font-size="15" font-weight="700" font-family="system-ui">Inaccuracy</text>
    <text x="200" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">25-75 cp loss · A small slip — cost you about half a pawn</text>
  </g>
  
  <!-- Mistake -->
  <g transform="translate(30, 390)">
    <rect width="660" height="54" rx="10" fill="#f97316" fill-opacity="0.08" stroke="#f97316" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#fb923c" font-size="18" font-weight="800" font-family="system-ui">?</text>
    <text x="54" y="34" fill="#fb923c" font-size="15" font-weight="700" font-family="system-ui">Mistake</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">75-200 cp loss · A real miss that dropped about 1-2 pawns</text>
  </g>
  
  <!-- Blunder -->
  <g transform="translate(30, 450)">
    <rect width="660" height="54" rx="10" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.2"/>
    <text x="20" y="34" fill="#f87171" font-size="18" font-weight="800" font-family="system-ui">??</text>
    <text x="54" y="34" fill="#f87171" font-size="15" font-weight="700" font-family="system-ui">Blunder</text>
    <text x="170" y="34" fill="#94a3b8" font-size="13" font-family="system-ui">200+ cp loss · Hung material, missed a winning tactic, or fatally weakened your position</text>
  </g>
</svg>
</div>

Сводная панель вверху сканирования FireChess shows что-то вроде:

> **White 78.7% accuracy · Best 11 · Book 8 · Good 3 · Blunder 2 · ACPL 43.2**

Эта single строка tells more о партии, чем any другая метрика. Число ACPL — среднее; распределение значков tells *где* проблемы. Игрок с 2 Зевками и 0 Неточностями имеет different проблему, чем с 0 Зевками и 12 Неточностями — even если ACPL идентичен.

## Хороший ли ACPL по рейтингам?

Это вопрос, который everyone спрашивает, и честный ответ: **зависит от контроля времени, типа позиции и глубины движка.** Но из thousands сканирований FireChess across all уровней, вот типичные диапазоны:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="380" viewBox="0 0 680 380" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="acplBg" x1="0" y1="0" x2="680" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#0d1225"/>
    </linearGradient>
  </defs>
  <rect width="680" height="380" rx="16" fill="url(#acplBg)"/>
  <rect x="1" y="1" width="678" height="378" rx="15" stroke="#1e293b" stroke-opacity="0.5"/>
  <text x="340" y="36" text-anchor="middle" fill="#f1f5f9" font-size="18" font-weight="700" font-family="system-ui">ACPL by Rating Level (Typical Ranges)</text>
  <text x="340" y="56" text-anchor="middle" fill="#64748b" font-size="12" font-family="system-ui">Based on analysis of club-level games · Lower is better</text>
  
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
  
  <text x="50" y="280" fill="#f1f5f9" font-size="13" font-weight="600" font-family="system-ui">Under 1000</text>
  <rect x="140" y="266" width="420" height="22" rx="4" fill="#ef4444" fill-opacity="0.45"/>
  <text x="350" y="282" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui">130-200+ ACPL</text>
  
  <text x="340" y="325" text-anchor="middle" fill="#64748b" font-size="11" font-family="system-ui">Ranges assume 15+10 or longer time control · Blitz/rapid games run 10-20% higher</text>
</svg>
</div>

Несколько вещей выделяются из данных:

**Диапазон 1400-1800 — where most клубных игроков живут**, и ACPL 50-80 completely нормально. Вы не «плохи» на 65 ACPL — вы average для вашего рейтинга. Проблема, если ACPL *остаётся* на 65 по мере попытки роста. Чтобы пробить 1800, нужно consistently быть under 50. Смотрите наше [руководство ACPL по рейтингам](/blog/average-centipawn-loss-by-rating) для подробного взгляда на то, как centipawn loss shifts across каждого диапазона.

**Блиц завышает всё.** Игрок 1600 может иметь 45 ACPL в 15+10, but 80 ACPL в 3+0 блице. Скорость игры enormously matters. Всегда сравнивайте ACPL within одного контроля времени.

**One зевок destroys среднее.** Игрок 1500, played 38 ходов со средним 15 cp (excellent для рейтинга), but сделавший one зевок на 400 cp, ends с ~25 ACPL за эту партию. Зевок alone added 10 пунктов к среднему. Поэтому распределение значков matters more raw числа — партия с 1 Зевком и 39 Хорошими ходами very different от 20 Неточностями.

## Почему ваш ACPL выше, чем should быть

После сканирования thousands партий на FireChess одни и те же паттерны appears снова и снова. Вот три biggest ACPL killers на клубном уровне, с реальными позициями для показа.

### Паттерн 1: Пробел дебютных знаний

Most частый скачок ACPL happens в первых 15 ходах. Игроки, которые не знают свой дебют достаточно хорошо, делают «разумно выглядящие» ходы, которые subtly ослабляют позицию на 30-50 centipawn каждый. Пять such ходов, и вы пожертвовали 150+ centipawn до того, как миттельшпиль even начался.

<chess-position fen="r1bq1rk1/pppnbppp/5n2/3p2B1/3P4/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8" caption="Ход белых в ферзевом гамбите в отказе. После естественного 8.Bd3 у чёрных крепкое равенство. Но если белые играют 8.Ne5?! вместо, чёрные получают лёгкую игру с ...dxc4 и ...Nd5. Проверьте ваш дебютный ACPL в разделе FireChess 'Opening Leaks'." orientation="white"></chess-position>

Ферзевый гамбит в отказе — one из most теоретически плотных дебютов в шахматах. Если вы 1500 и reaches this позицию, можете сыграть **8.Bd3** (главная линия, крепко) или **8.Ne5?!** (выглядит активно, атакует f7, but actually даёт чёрным easy равенство). Разница оценки движка only about 20-30 centipawn, but resulting позиции dramatically different на практике — после 8.Ne5 чёрные получают комфортную игру с ...dxc4, ...Nd5 и ...f6, while после 8.Bd3 белые сохраняют small, but persistent перевел.

Это what «Opening Leaks» в [инструменте анализа FireChess](/analyze) показывает: позиции, где вы consistently выбираете второй по качеству ход в дебютах. Если играете QGD за белых и видите кластер значков **?!** на ходах 6-10 — это не случайность, а системный пробел знаний, который можно исправить изучением those specific позиций.

### Паттерн 2: Миттельшпильный просчёт

Наибольшие скачки ACPL (200+ centipawn за один ход) happens, когда вы misses тактический удар — either противника или свой. Это different от дебютной проблемы: дебютные неточности мелкие и consistent, while просчёты крупные и sporadic.

<chess-position fen="r1bqkb1r/ppp2Npp/2n5/3np3/2B5/8/PPPP1PPP/RNBQK2R b KQkq - 0 6" caption="Ход чёрных после 6.Nxf7 в атаке Фрид Ливера. Движок говорит, что чёрные should сыграть 6...Kxf7, принимая жертву и entering острую, но defensible позицию. Ход 6...Ke8?? — зевок — выглядит safer, but проигрывает 7.Qf3. Один wrong ход королём costs 300+ centipawn." orientation="black"></chess-position>

Атака Фрид Ливера — perfect ACPL case study. После **6.Nxf7** чёрные facing критическое решение. Движок говорит, что **6...Kxf7** — only real ход — страшно (ваш король открыт на f7), but объективно sound. Ход **6...Ke8??** выглядит natural (держать короля safe, не брать коня), but actually катастрофический зевок, losing 300+ centipawn, because белые играют 7.Qf3 и позиция чёрных collapses.

Это kind хода, который shows как красный значок **?? Зевок** в FireChess. И вот thing: если rated under 1600, вы probably делали this exact ошибку или similar. Не потому что плохо играете в шахматы, а потому что «безопасный» ход *feels* правильно. Распознавание паттернов tells «не двигайте короля в open», but вычисление would tells, что Kxf7 actually safer ход благодаря specific тактическим ресурсам.

После сканирования партий, посмотрите на раздел «Зевки» — each usually имеет историю like this. Ход, feel safe, but не был. Взятие, seeming winning, but с скрытой защитой. These 200+ centipawn потери, destroying ваш ACPL average.

### Паттерн 3: Провал конверсии эндшпиля

Third ACPL killer менее dramatic, but equally damaging: плохая игра в эндшпиле. Позиция +2.00 (winning) slowly кровоточит до +0.50 (ничья), because не знаете технику. Каждый ход теряет 15-30 centipawn — never зевок, even не ошибка, just steady поток неточностей.

<chess-position fen="8/5kpp/8/8/8/4R3/r4PPP/6K1 w - - 0 1" caption="Ход белых в ладейном окончании. Активный 1.Ra3 much stronger пассивного 1.Rf3+?! — размен ладей или постановка ладьи позади пешки — ключевая техника. Эндшпильный ACPL — where most клубных игроков теряют most очков relative мастерам." orientation="white"></chess-position>

В this ладейном окончании у белых явное преимущество (лишняя пешка, активная ладья). Но разница между **1.Ra3** (активно, targeting a-линию) и **1.Rf3+?!** (пассивно, шах без плана) — about 40 centipawn. Over 15 эндшпильных ходов выбор «безопасного», but пассивного варианта every раз может costs 200+ centipawn всего — эквивалент возврата всего преимущества.

Это hardest паттерн для исправления, because техника эндшпиля requires specific знания, а не просто «будьте careful». Нужно знать, что активность ладьи matters more безопасности, что проходные should продвигаться, что активность короля выигрывает окончания. Хорошая новость: изучение эндшпиля имеет highest ROI любого шахматного тренинга. Перенос ACPL с 80 на 60 в окончаниях alone может снизить общий ACPL на 5-10 пунктов.

## Как снизить ACPL: Practical руководство

Знание ACPL бесполезно без знания, как improves. Вот what actually works, ranked по эффективности для клубных игроков.

### Исправьте зевки first

Звучит очевидно, but most игроков делают wrong. They пытаются «думать harder» или «быть more careful» — что не works, because зевки не caused недостаточным усилием. Они caused **пробелами распознавания паттернов**. Вы не пропустили тактику, потому что не вычисляли; пропустили, потому что не *увидели*.

Исправление: решайте тактические задачки, focusing на паттернах, которые actually misses. Не делайте случайные наборы задачек. После сканирования 20+ партий на FireChess, посмотрите на позиции зевков — they кластеризуются вокруг specific мотивов. Если зевки mostly маты на последней горизонтали — изучайте маты на последней горизонтали. Если mostly коневые вилки — изучайте коневые вилки. Целенаправленная практика beats объём.

Для most игроков rated under 1600, устранение зевков alone снижает ACPL на 15-25 пунктов. Это single biggest доступное улучшение. Наше руководство по [как перестать зевать](/blog/how-to-stop-blundering-chess) охватывает most эффективные паттерны тактической тренировки.

### Изучайте дебюты глубже (не шире)

Раздел [дебютных утечек](/blog/how-to-find-opening-weaknesses) в анализе FireChess — золотая жила. Если играете 1.e4 и ваш ACPL в первых 10 ходах 60+ — вы проигрываете партию до начала. Но исправление — не запоминать more теорию, а понять *почему* движок предпочитает certain ходы в позициях, которые actually reaches.

Изучите конкретные линии, где делаете неточности. Если consistently играете wrong ход на 8-м ходу Найдорфа, изучите *ту* позицию, а не всё дерево Найдорфа. Глубина в основных линиях, не ширина across many дебютов — what снижает дебютный ACPL.

После сканирования партий отсортируйте дебютные ходы по centipawn loss. Наибольшие потери — where should focuses. Три часа целенаправленного дебютного изучения worst позиций может снизить дебютный ACPL на 10-20 пунктов — permanent улучшение, paying off в каждой партии.

### Улучшайте технику эндшпиля

Эндшпильный ACPL — where biggest разрыв между клубными игроками и мастерами. У 1500 может быть 90+ ACPL в окончаниях; у 2200 — 25-35. Разница не в вычислениях — в знании.

Изучите these эндшпильные основы по порядку:
1. **Пешечные окончания** — оппозиция, ключевые поля, правило квадрата
2. **Ладейные окончания** — позиция Лусены, позиция Филидора, принципы активности ладьи
3. **Окончания слон vs конь** — когда каждая фигура лучше, как играть каждую сторону

Каждое takes about 5-10 часов для proper изучения. Вместе they могут снизить эндшпильный ACPL с 90 до 50 — 40-пунктовое улучшение, translates в 10-15 пунктов общего ACPL и significant рост рейтинга.

### Используйте структурированную рутину анализа

Most игроков неправильно анализируют свои партии. They смотрят на оценку движка, видят красный ход и думают «should был сыграть предложение движка». Это не обучение — это simply видеть ответ.

Вместо этого используйте эту рутину после каждой партии:

1. **Определите три хода с наибольшим ACPL.** Не предложения движка — ваши худшие ходы. Что сыграли и почему?
2. **Найдите корневую причину.** Это просчёт (видели правильный ход, but оценили wrong)? Пробел знаний (не знали паттерн)? Решение в цейтноте?
3. **Изучите паттерн.** Если просчёт — решите 5 similar задачек. Если пробел знаний — прочитайте about that конкретное окончание или дебютную позицию.
4. **Отслеживайте ACPL over time.** Не focuses на single партиях — смотрите на 30-партийное скользящее среднее. Если падает — тренировка работает.

Сканер FireChess делает эту рутину быстрой — загрузите PGN, увидьте разбивку, drill в worst ходы и отслеживайте улучшение over time. [Страница анализа на /analyze](/analyze) gives распределение значков, пошаговую разбивку и кластеры дебютных утечек — всё в one view.

## Разница между ACPL и точностью

Игроки often путают ACPL с точностью, and some инструменты используют термины interchangeably. Они related, but different:

| Метрика | Что измеряет | Шкала | Применение |
|--------|-----------------|-------|----------|
| ACPL | Средний centipawn loss за ход | Чем ниже, тем лучше (0-200+) | Диагностика specific слабостей |
| Точность | Насколько ходы matches первому выбору движка | 0-100% | Общий показатель качества игры |

Точность — процент — tells, how often played «правильный» ход. ACPL tells, насколько *wrong* были wrong ходы. Партия с 85% точности и 60 ACPL имеет few крупных ошибок. С 85% и 35 ACPL — many мелких. Та же точность, very different проблемы.

FireChess показывает обе метрики. Процент точности полезен для быстрой проверки здоровья. ACPL и распределение значков — what нужно для targeted улучшения. Когда someone asks «какая хорошая точность в шахматах?» — ответ depends от сложности позиции — but ACPL more consistent across different типов партий. Для полного сравнения, смотрите наше [руководство по показателю точности](/blog/chess-accuracy-score-explained).

## Распространённые мифы об ACPL

**«Более низкий ACPL always means лучшая игра.»** Не necessarily. В полностью ничейной позиции оба игрока могут иметь 15 ACPL — they играют точно, but ничего не happens. В острой тактической партии оба могут иметь 60 ACPL despite хорошей игры, because позиции настолько сложны, что even хорошие ходы теряют some centipawn. Контекст matters. Подробнее о том, [как зевки и ACPL interacts по рейтингам](/blog/chess-blunder-patterns-by-rating).

**«Мне нужно играть как движок для низкого ACPL.»** Нет. Нужно avoid зевки и знать дебюты. Игрок 1600 с хорошими дебютными знаниями и крепкой тактикой может достичь 40-50 ACPL without единого «блестящего» хода. Consistency beats блеск.

**«ACPL не учитывает сложность позиции.»** Это partly true — тихую позицию easier играть точно, чем острую. Но over large выборке партий сложность averages. Если ACPL consistently высок across all типов партий — проблема в вас, а не в позициях.

**«Centipawn бессмысленны, because движки disagree.»** Разные движки и глубины дают slightly different оценки, but *относительные* оценки remarkably consistent. Если ход — зевок на глубине 16, он almost always зевок и на глубине 20. Абсолютное число может shift на 5-10 cp, but паттерн стабилен.

## Отслеживание ACPL over time

ACPL one партии tells almost ничего. Шахматы слишком вариативны — можете сыграть чистую партию на 25 ACPL, followed катастрофой на 120, и neither represents ваш «истинный» уровень. Что matters — тренд.

Просканируйте хотя бы 20 партий — ideally from одного контроля времени — и посмотрите:
- **Ваш средний ACPL across all партий.** Это ваша baseline.
- **Распределение.** Есть ли few катастрофических партий, pulling среднее вверх, or consistently высокий?
- **Разбивка значков.** Сколько Зевков за партию? Сколько Неточностей?
- **Дебютный vs миттельшпильный vs эндшпильный ACPL.** Где теряете most очков?

[Сканер FireChess на /analyze](/analyze) computes всё это автоматически. Загрузите PGN, дождитесь анализа, и вы увидите exactly, где ваш centipawn loss concentrates. Используйте эти данные для фокусировки тренировки, а не просто чтобы чувствовать себя плохо о зевках.

Улучшение ACPL — долгая игра. Most игроков видят 5-10 пунктовое падение over 3 месяцев целенаправленной тренировки, что translates в 100-200 рейтинговых очков. Не впечатляюще, but real — и unlike запоминание дебютных линий, улучшение permanent, because основано на распознавании паттернов и технике, а не зубрёжке.

## FAQ

### Что такое средний centipawn loss в шахматах?

Средний centipawn loss (ACPL) измеряет, насколько ваши ходы отклоняются от лучшего выбора движка, усреднённое across all ходов в партии. Каждый ход оценивается: если первый ход движка даёт +1.50, а ваш — +1.00, вы потеряли 50 centipawn на этом ходе. Ваш ACPL — общая потеря centipawn ÷ число ходов. Ниже ACPL — ближе к рекомендациям движка. Используйте [сканер FireChess на /analyze](/analyze), чтобы увидеть ACPL с полной пошаговой разбивкой.

### Хороший ли ACPL для моего рейтинга?

Типичные диапазоны: игроки under 1000 average 130-200+ ACPL; 1000-1400 — 80-130; 1400-1800 — 50-80; 1800-2200 — 30-50; 2200+ — 15-30. These числа assumes 15+10 или дольше — блиц typically на 10-20% выше. Если ACPL в пределах вашего диапазона — focuses на снижении зевков first для наибольшего улучшения.

### Как узнать свой centipawn loss?

Загрузите PGN в [инструмент анализа FireChess на /analyze](/analyze). Сканер показывает ACPL, процент точности и разбивку значков (сколько Лучших, Хороших, Неточностей, Ошибок и Зевков ходов сделали). Также можно видеть centipawn loss за ход в пошаговом анализе. Lichess и Chess.com тоже показывают ACPL в анализе партий.

### В чём разница между centipawn loss и точностью?

Centipawn loss измеряет *сколько* оценки отдали за ход (непрерывное число). Точность измеряет *как often* сыграли первый выбор движка (процент). Партия с 85% точности и 60 ACPL имеет few крупных ошибок. С 85% и 35 ACPL — many мелких неточностей. Обе метрики полезны — точность для быстрой проверки, ACPL для targeted улучшения. Смотрите наше [руководство по centipawn loss](/blog/what-is-centipawn-loss) для additional деталей.

### Почему мой ACPL так высок в дебюте?

Скачки дебютного ACPL usually mean, что вы играете ходы, которые теоретически known inferior — не зевки, but ходы, дающие противнику более лёгкую игру. Проверьте раздел «Opening Leaks» в сканировании FireChess, чтобы увидеть, какие позиции costs most centipawn. Изучите these конкретные линии вместо попытки memorize весь дебютный репертуар. Even изучение 3-4 критических позиций на дебют может снизить дебютный ACPL на 10-20 пунктов.

### Влияет ли контроль времени на ACPL?

Absolutely. Рапид и классика produces более низкий ACPL, because есть время вычислять. Блиц и пули завышают ACPL на 10-20 пунктов, because решения принимаются быстрее. Всегда сравнивайте ACPL within одного контроля — 60 ACPL в блице much более впечатляюще, чем 60 в рапиде.

### Может ли ACPL предсказать мой шахматный рейтинг?

ACPL correlates с рейтингом, but не предсказывает напрямую. Два игрока с идентичным ACPL могут иметь very different рейтинги, если one играет более острые позиции (higher сложность, naturally higher ACPL), а other — тихие системы. Однако, если ACPL consistently 20+ пунктов выше типичного для целевого рейтинга, улучшение almost certainly поможет расти. [Просканируйте партии на FireChess](/analyze), чтобы увидеть, как ACPL compares к peers.
