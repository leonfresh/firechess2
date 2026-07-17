---
title: "How to Analyze Your Chess Games Effectively"
description: "A step-by-step process for reviewing your chess games that actually leads to improvement, not just scrolling through engine lines."
date: "2026-02-12"
author: "FireChess Team"
tags: ["analysis", "improvement"]
---

Most chess players analyze their games wrong. They plug a game into an engine, scroll through the moves, see where the evaluation changed, think "oh, I should have played that," and move on. Two weeks later, they make the exact same mistake.

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="680" height="300" viewBox="0 0 680 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="a1bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a0d15"/><stop offset="1" stop-color="#0d1020"/>
    </linearGradient>
    <filter id="a1g"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="a1s" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#10b981" stop-opacity="0.2"/><stop offset="1" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="680" height="300" rx="18" fill="url(#a1bg)"/>
  <rect x="1" y="1" width="678" height="298" rx="17" stroke="white" stroke-opacity="0.04"/>
  <!-- Stone ground -->
  <rect x="0" y="220" width="680" height="80" fill="#111827" opacity="0.5"/>
  <line x1="0" y1="220" x2="680" y2="220" stroke="#1f2937"/>
  <!-- Ground cracks -->
  <g stroke="#1f2937" stroke-width="0.5" opacity="0.4">
    <path d="M50 240 L80 250 L60 270"/><path d="M200 235 L220 260"/><path d="M400 245 L420 265 L410 280"/><path d="M580 230 L600 255"/>
  </g>
  <!-- Glowing path connecting stations -->
  <path d="M68 210 C120 210 120 210 170 210 C220 210 220 210 272 210 C320 210 320 210 374 210 C420 210 420 210 476 210 C520 210 520 210 578 210" stroke="#10b981" stroke-width="2" stroke-opacity="0.2" fill="none" stroke-dasharray="6 4">
    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="3s" repeatCount="indefinite"/>
  </path>
  <!-- Station 1: PLAY — Drawn pawn on pedestal -->
  <g transform="translate(68, 0)">
    <rect x="-14" y="198" width="28" height="14" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <circle cy="172" r="30" fill="url(#a1s)"/>
    <g fill="#d1d5db" transform="translate(0, 170)">
      <circle r="6" cy="-12"/><path d="M-4,-6 L-7,6 L-9,10 L9,10 L7,6 L4,-6 Z"/><rect x="-10" y="10" width="20" height="4" rx="1.5"/>
    </g>
    <text y="230" text-anchor="middle" fill="#6ee7b7" font-size="14" font-weight="700">PLAY</text>
  </g>
  <!-- Station 2: REFLECT — Drawn king with ? marks -->
  <g transform="translate(170, 0)">
    <rect x="-14" y="198" width="28" height="14" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <circle cy="165" r="30" fill="url(#a1s)"/>
    <g fill="#67e8f9" transform="translate(0, 158)">
      <rect x="-1.5" y="-22" width="3" height="8"/><rect x="-4" y="-19" width="8" height="3"/>
      <circle r="6" cy="-10"/><path d="M-5,-4 L-8,10 L8,10 L5,-4 Z"/><rect x="-9" y="10" width="18" height="4" rx="1.5"/>
    </g>
    <text x="18" y="140" fill="#67e8f9" font-size="14" opacity="0.5">?</text>
    <text x="-16" y="148" fill="#67e8f9" font-size="10" opacity="0.3">?</text>
    <text y="230" text-anchor="middle" fill="#67e8f9" font-size="14" font-weight="700">REFLECT</text>
  </g>
  <!-- Station 3: ANALYZE — Drawn knight with magnifying glass -->
  <g transform="translate(272, 0)">
    <rect x="-14" y="198" width="28" height="14" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <circle cy="165" r="35" fill="url(#a1s)"/>
    <g fill="#6ee7b7" transform="translate(0, 158)">
      <path d="M-2,-16 L-6,-13 L-8,-7 L-5,-2 L-7,7 L-7,10 L7,10 L7,7 L1,-3 L3,-11 L1,-16 Z"/>
      <path d="M-4,-13 L-8,-19 L-1,-15"/><circle cx="-2" cy="-8" r="1.5" fill="#0a0d15"/>
      <rect x="-8" y="10" width="16" height="3.5" rx="1"/>
    </g>
    <circle cx="16" cy="148" r="10" fill="none" stroke="#6ee7b7" stroke-width="1.5" opacity="0.5"/>
    <line x1="23" y1="155" x2="30" y2="162" stroke="#6ee7b7" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
    <text y="230" text-anchor="middle" fill="#6ee7b7" font-size="14" font-weight="700">ANALYZE</text>
  </g>
  <!-- Station 4: PATTERN — Drawn bishop with radar overlay -->
  <g transform="translate(374, 0)">
    <rect x="-14" y="198" width="28" height="14" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <circle cy="165" r="30" fill="url(#a1s)"/>
    <g fill="#67e8f9" transform="translate(0, 158)">
      <ellipse rx="3.5" ry="4.5" cy="-14"/><line x1="0" y1="-19" x2="0" y2="-22" stroke="#67e8f9" stroke-width="2"/>
      <path d="M-3.5,-9 L-6,7 L-8,10 L8,10 L6,7 L3.5,-9 Z"/><rect x="-9" y="10" width="18" height="3.5" rx="1"/>
    </g>
    <polygon points="374,138 388,152 384,168 364,168 360,152" fill="#06b6d4" fill-opacity="0.06" stroke="#67e8f9" stroke-width="0.5" opacity="0.4" transform="translate(-374, 0)"/>
    <text y="230" text-anchor="middle" fill="#67e8f9" font-size="14" font-weight="700">PATTERN</text>
  </g>
  <!-- Station 5: FIX — Drawn queen with checkmark glow -->
  <g transform="translate(578, 0)">
    <rect x="-14" y="198" width="28" height="14" rx="2" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <circle cy="165" r="35" fill="url(#a1s)"/>
    <g fill="#6ee7b7" transform="translate(0, 158)" filter="url(#a1g)">
      <circle r="4" cy="-16"/><path d="M-10,-8 L-8,-16 L-4,-8 L0,-18 L4,-8 L8,-16 L10,-8 Z"/>
      <path d="M-9,-8 L-10,8 L10,8 L9,-8 Z"/><rect x="-11" y="8" width="22" height="4" rx="1.5"/>
    </g>
    <path d="M12 140 L16 146 L26 132" stroke="#6ee7b7" stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round"/>
    <text y="230" text-anchor="middle" fill="#6ee7b7" font-size="14" font-weight="700">FIX</text>
  </g>
  <!-- Cavern ceiling stalactites -->
  <g fill="#111827" opacity="0.5">
    <polygon points="30,0 38,25 22,25"/><polygon points="100,0 110,35 90,35"/><polygon points="200,0 208,20 192,20"/>
    <polygon points="340,0 348,30 332,30"/><polygon points="480,0 487,22 473,22"/><polygon points="600,0 608,28 592,28"/>
  </g>
  <!-- Atmospheric particles -->
  <circle cx="140" cy="50" r="1.5" fill="#10b981" opacity="0.12"><animate attributeName="opacity" values="0.12;0.03;0.12" dur="3s" repeatCount="indefinite"/></circle>
  <circle cx="440" cy="30" r="1" fill="#06b6d4" opacity="0.08"><animate attributeName="opacity" values="0.08;0.02;0.08" dur="4s" repeatCount="indefinite"/></circle>
  <circle cx="620" cy="55" r="1.5" fill="#10b981" opacity="0.1"><animate attributeName="opacity" values="0.1;0.03;0.1" dur="2.5s" repeatCount="indefinite"/></circle>
  <text x="340" y="268" text-anchor="middle" fill="#3f3f46" font-size="12" font-style="italic">The journey from move to mastery</text>
</svg>
</div>

Sound familiar? Here's how to analyze your games in a way that actually sticks.

## The Problem with Engine-Only Analysis

Engines are incredible tools. Stockfish can see 30+ moves deep and evaluate positions with superhuman accuracy. But there's a fundamental problem: **the engine doesn't know why you made a mistake**.

When an engine shows you that 14.Nf5 was better than your 14.Be3, it doesn't tell you whether:

- You didn't consider Nf5 at all
- You considered it but rejected it for the wrong reason
- You were in time trouble and played too fast
- You misunderstood the position entirely

The *reason* for the mistake is what you need to fix. The engine only shows you the *result*.

## A Better Analysis Process

### Step 1: Replay Without an Engine First

Before opening any analysis tool, replay your game from memory. At each critical moment, write down (or mentally note):

- What was I thinking here?
- What alternatives did I consider?
- Where did I feel uncertain?

This takes discipline, but it's the most valuable step. Your own thought process during the game is information that no engine can provide.

### Step 2: Identify Critical Moments

Not every move deserves deep analysis. Focus on:

- **Turning points** — where the evaluation shifted significantly
- **Decisions** — positions where you had 2-3 reasonable options
- **Time pressure moves** — moves you played quickly in a complex position
- **Opening deviations** — where you left known theory

Mark 5-8 critical moments per game. If you try to analyze every move deeply, you'll burn out and remember nothing.

Here's a real example of a critical moment from an Italian Game middlegame:

<chess-position fen="r1bq1rk1/1pp2ppp/p1pb1n2/4N3/2BpP3/5Q2/PPPN1PPP/R1B2RK1 w - - 0 12" caption="Italian Game middlegame — White's pieces (Ne5, Bc4, Qf3) all point at f7, but the critical move isn't a direct attack. The engine reveals d4! as best, opening the center for White's superior coordination. This is the kind of position where analysis catches moves you'd never find at the board." badge="best" arrows="e5f7:green">
</chess-position>
White's knight on e5, bishop on c4, and queen on f3 all aim at f7. Your instinct might be to pile on with moves like Qg3 or Ng5. But analysis reveals that **d4!** is the critical move — it rips open the center, activates White's pieces, and leaves Black's passive Ba7 stranded. Without engine analysis, this quiet-looking pawn break is almost impossible to find over the board.

### Step 3: Use the Engine Surgically

Now turn on the engine, but only for your marked critical moments. For each one:

1. Look at the engine's top move
2. Understand *why* it's better (not just that it is)
3. Compare it to what you played
4. Identify the thinking error that led you astray

**Example of good analysis:**

> "I played 14.Be3 because I wanted to develop my bishop. The engine preferred 14.Nf5 because it attacks g7 and d6 simultaneously, and Black can't defend both. My mistake was focusing on general development when there was a concrete tactical opportunity. I need to check for forcing moves before making quiet moves."

**Example of bad analysis:**

> "Engine says 14.Nf5 is +1.2, I played 14.Be3 which is +0.4. Okay, noted."

The first analysis will change your thinking. The second won't.

### Step 4: Categorize Your Mistakes

After analyzing several games, patterns emerge. Common categories:

<div style="margin: 2rem 0; display: flex; justify-content: center;">
<svg width="600" height="310" viewBox="0 0 600 310" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mc1bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#080c18"/><stop offset="1" stop-color="#0d1020"/>
    </linearGradient>
    <filter id="mc1g"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="mc1gl" cx="0.5" cy="0.8" r="0.5">
      <stop offset="0" stop-color="#10b981" stop-opacity="0.12"/><stop offset="1" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="310" rx="16" fill="url(#mc1bg)"/>
  <rect x="1" y="1" width="598" height="308" rx="15" stroke="white" stroke-opacity="0.04"/>
  <!-- Stone ground -->
  <rect x="0" y="245" width="600" height="65" fill="#111827" opacity="0.5"/>
  <line x1="0" y1="245" x2="600" y2="245" stroke="#1f2937"/>
  <g stroke="#1f2937" stroke-width="0.5" opacity="0.3"><path d="M80 260 L100 275"/><path d="M300 255 L320 270"/><path d="M480 260 L500 278"/></g>
  <!-- Title -->
  <text x="300" y="28" text-anchor="middle" fill="white" font-size="15" font-weight="700" letter-spacing="0.5">MISTAKE CATEGORIES</text>
  <text x="300" y="46" text-anchor="middle" fill="#475569" font-size="12" font-style="italic">Typical for 1200–1800 rated players</text>
  <!-- 1. Tactical 38% — Tall drawn knight piece -->
  <g transform="translate(68, 0)">
    <rect x="-16" y="233" width="32" height="12" rx="3" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <rect x="-12" y="108" width="24" height="137" rx="4" fill="#10b981" fill-opacity="0.06" stroke="#10b981" stroke-opacity="0.2"/>
    <g fill="#10b981" transform="translate(0, 88)" filter="url(#mc1g)">
      <path d="M-3,-16 L-7,-13 L-10,-6 L-7,-1 L-9,8 L-9,12 L9,12 L9,8 L1,-3 L4,-11 L1,-16 Z"/>
      <path d="M-5,-13 L-10,-20 L-2,-15"/><circle cx="-3" cy="-8" r="2" fill="#080c18"/>
      <rect x="-10" y="12" width="20" height="4" rx="1"/>
    </g>
    <text y="265" text-anchor="middle" fill="#6ee7b7" font-size="13" font-weight="600">Tactical</text>
    <text y="284" text-anchor="middle" fill="#6ee7b7" font-size="17" font-weight="700">38%</text>
  </g>
  <!-- 2. Positional 25% — Drawn bishop piece -->
  <g transform="translate(178, 0)">
    <rect x="-16" y="233" width="32" height="12" rx="3" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <rect x="-12" y="150" width="24" height="95" rx="4" fill="#06b6d4" fill-opacity="0.06" stroke="#06b6d4" stroke-opacity="0.2"/>
    <g fill="#06b6d4" transform="translate(0, 130)">
      <ellipse rx="4" ry="5.5" cy="-14"/><line x1="0" y1="-20" x2="0" y2="-24" stroke="#06b6d4" stroke-width="2"/>
      <path d="M-4,-8 L-7,8 L-9,12 L9,12 L7,8 L4,-8 Z"/><rect x="-10" y="12" width="20" height="4" rx="1"/>
    </g>
    <text y="265" text-anchor="middle" fill="#67e8f9" font-size="13" font-weight="600">Positional</text>
    <text y="284" text-anchor="middle" fill="#67e8f9" font-size="17" font-weight="700">25%</text>
  </g>
  <!-- 3. Calculation 18% — Drawn queen piece -->
  <g transform="translate(288, 0)">
    <rect x="-16" y="233" width="32" height="12" rx="3" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <rect x="-12" y="175" width="24" height="70" rx="4" fill="#f59e0b" fill-opacity="0.06" stroke="#f59e0b" stroke-opacity="0.2"/>
    <g fill="#f59e0b" transform="translate(0, 158)">
      <circle r="4" cy="-13"/><path d="M-9,-6 L-7,-13 L-3.5,-6 L0,-15 L3.5,-6 L7,-13 L9,-6 Z"/>
      <path d="M-8,-6 L-9,8 L9,8 L8,-6 Z"/><rect x="-10" y="8" width="20" height="4" rx="1"/>
    </g>
    <text y="265" text-anchor="middle" fill="#fbbf24" font-size="13" font-weight="600">Calculation</text>
    <text y="284" text-anchor="middle" fill="#fbbf24" font-size="17" font-weight="700">18%</text>
  </g>
  <!-- 4. Time 12% — Clock face drawing -->
  <g transform="translate(398, 0)">
    <rect x="-16" y="233" width="32" height="12" rx="3" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <rect x="-12" y="195" width="24" height="50" rx="4" fill="#ef4444" fill-opacity="0.06" stroke="#ef4444" stroke-opacity="0.2"/>
    <g transform="translate(0, 190)" fill="none" stroke="#ef4444" stroke-width="1.5">
      <circle r="12"/><line x1="0" y1="0" x2="0" y2="-7" stroke-width="1.5"/><line x1="0" y1="0" x2="5" y2="3" stroke-width="1"/>
      <circle r="1.5" fill="#ef4444"/>
    </g>
    <text y="265" text-anchor="middle" fill="#f87171" font-size="13" font-weight="600">Time</text>
    <text y="284" text-anchor="middle" fill="#f87171" font-size="17" font-weight="700">12%</text>
  </g>
  <!-- 5. Opening 7% — Small drawn pawn piece -->
  <g transform="translate(508, 0)">
    <rect x="-16" y="233" width="32" height="12" rx="3" fill="#1f2937" stroke="#334155" stroke-width="0.5"/>
    <rect x="-12" y="210" width="24" height="35" rx="4" fill="#a855f7" fill-opacity="0.06" stroke="#a855f7" stroke-opacity="0.2"/>
    <g fill="#a855f7" transform="translate(0, 202)">
      <circle r="5" cy="-8"/><path d="M-3,-3 L-5,5 L-7,8 L7,8 L5,5 L3,-3 Z"/><rect x="-8" y="8" width="16" height="3" rx="1"/>
    </g>
    <text y="265" text-anchor="middle" fill="#c084fc" font-size="13" font-weight="600">Opening</text>
    <text y="284" text-anchor="middle" fill="#c084fc" font-size="17" font-weight="700">7%</text>
  </g>
  <!-- Particles -->
  <circle cx="40" cy="65" r="1" fill="#10b981" opacity="0.1"><animate attributeName="opacity" values="0.1;0.03;0.1" dur="3s" repeatCount="indefinite"/></circle>
  <circle cx="560" cy="55" r="1.5" fill="#a855f7" opacity="0.08"><animate attributeName="opacity" values="0.08;0.02;0.08" dur="4s" repeatCount="indefinite"/></circle>
</svg>
</div>

- **Tactical oversights** — missed forks, pins, skewers, discovered attacks

Here's a position where the tactical opportunity is right on the surface — but a rushed player walks right past it:

<chess-position fen="r1bq1rk1/ppp2ppp/2n1bn2/3pp3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 7" caption="Black has just played …Be6, challenging White's bishop. Most players continue quietly with Be2 or Bb5, but analysis reveals the tactical shot Bxf7+! — after Rxf7 Ng5, White wins material with a devastating attack on the weakened kingside." badge="best" arrows="c4b5:green">
</chess-position>
White can play **Bxf7+!** here — a temporary sacrifice that rips open Black's king. After Rxf7 Ng5, the knight attacks f7 and h7 simultaneously, and White's attack is crushing. A player who skips analysis sees a quiet position; the engine shows a forced winning sequence hiding in plain sight. This is exactly the kind of "I can't believe I missed that" moment that makes analysis worth doing.

- **Positional misunderstandings** — wrong plan, bad piece placement
- **Calculation errors** — saw the idea but miscalculated a variation
- **Time management** — good position but blundered under time pressure
- **Opening preparation** — played a suboptimal move in a known position

Knowing your dominant error type tells you what to study. If 60% of your mistakes are tactical, puzzle training will help more than studying strategy books.

### Step 5: Create an Action Item

Every analysis session should produce at least one concrete takeaway. Here's an endgame where the analysis takeaway is crystal clear:

<chess-position fen="8/8/3k4/2pPp3/3KP3/8/8/8 w - - 0 1" caption="White has a protected passed pawn on d5 and a more active king. The winning move is Kf5!, seizing control and winning the e5 pawn. Many players would passively wait here — analysis reveals the concrete path to victory." badge="best" arrows="d4c4:green">
</chess-position>
White's protected passed pawn on d5 and active king give a decisive advantage. The winning move is **Kf5!** — taking the e5 pawn and using the passed d-pawn to promote. Many club players would play passively here, shuffling the king without a plan. Analysis reveals the concrete winning technique: activate your king, attack the weak pawns, and push your passer. This kind of endgame position is easy to draw if you don't know the method — and easy to win once analysis shows you the plan.

- "Before playing a quiet developing move, check all captures and checks first"
- "In IQP positions, always consider d4-d5 pawn breaks"
- "Stop playing a4 in the Sicilian — it weakens b4 and doesn't achieve anything"

Write it down. Review your action items before your next game. This is how analysis translates into better play.

## How Many Games Should You Analyze?

Quality over quantity, always.

**Deeply analyze 2-3 games per week** rather than superficially checking 20. A thorough analysis of a single game — where you understand every critical moment — is worth more than a quick engine check of ten games.

For players who want to improve consistently:

| Games Played per Week | Games to Analyze Deeply | Quick Engine Scan |
|----------------------|------------------------|-------------------|
| 3-5 | 1-2 | All |
| 5-10 | 2-3 | All |
| 10-20 | 3-4 | Losses + interesting wins |
| 20+ | 4-5 | Losses only |

Always prioritize your losses and unexpected draws. Wins feel good but teach you less.

## Bulk Analysis: When It Makes Sense

Deep, manual analysis is ideal but time-consuming. There's a complementary approach: **bulk scanning** across many games to find patterns.

Instead of analyzing each game individually, you scan 50-100 games and look for:

- **Repeated positions** where you consistently err
- **Average accuracy** by game phase (opening, middlegame, endgame)  
- **Tactical pattern gaps** — specific motifs you keep missing
- **Rating correlation** — whether your losses have common themes

This bird's-eye view reveals systemic weaknesses that game-by-game analysis can miss. You might discover that your accuracy drops sharply after move 35, suggesting endgame study is needed. Or that you consistently lose 40 centipawns in certain opening structures.

## The Best Tools for Analysis

### For Deep Analysis

- **Lichess Analysis Board** — free, uses Stockfish, great for move-by-move review
- **Chess.com Game Review** — provides human-readable insights (premium feature)
- **A physical board** — seriously, replaying games on a real board improves memory

### For Bulk Pattern Detection

- **FireChess** — scans your games for repeated mistakes, opening leaks, missed tactics, and endgame errors. Runs Stockfish 18 in your browser for privacy.
- **Chess.com Insights** — shows trends over time (premium feature)
- **Custom PGN analysis** — for tech-savvy players who want to build their own scripts

### For Targeted Training

- **Puzzle training** (Lichess, Chess.com) — fixes tactical weakness
- **Endgame trainers** (Lichess Practice, chess endgames app) — fixes endgame weakness
- **Opening trainers** (Chessable, drill mode tools) — fixes opening weakness

## Putting It All Together

Here's a weekly analysis routine that works:

**Monday:** Quick scan — review weekend games with an engine, note big mistakes
**Wednesday:** Deep analysis — pick your most instructive loss and go through the 5-step process
**Friday:** Pattern review — review your action items from the week, scan your recent games for recurring patterns
**Weekend:** Play and apply what you've learned

The key is **consistency over intensity**. Thirty minutes of focused analysis three times a week beats a five-hour marathon once a month.

## Frequently Asked Questions

### How long should I spend analyzing a single game?

For a thorough deep analysis following the 5-step process, budget 20-30 minutes per game. That breaks down to roughly 5 minutes replaying without an engine, 5 minutes identifying critical moments, 10-15 minutes on engine-assisted analysis of those moments, and 5 minutes writing your action items. If you're short on time, even a focused 10-minute review of your 3 biggest mistakes is far better than nothing. The goal isn't to analyze every move — it's to extract lessons that stick.

### Should I analyze my wins or just my losses?

Always prioritize losses and unexpected draws, but don't ignore wins entirely. Wins where you were winning from the opening teach you little. However, wins where you were worse and came back, or where you missed a faster finish, are highly instructive. A good rule of thumb: analyze 70% losses, 20% hard-fought wins, and 10% draws. You can often learn more from a loss where you had a good position and blundered than from a clean win where your opponent blundered on move 8.

### What's better: engine analysis or analyzing without an engine first?

Neither alone — they serve different purposes. Analyzing without an engine first (Step 1) captures your thought process and reveals *why* you made decisions. Engine analysis (Step 3) shows you what the objective best move was. Doing only engine analysis means you see the right move but never understand why you missed it. Doing only manual analysis means you might reinforce incorrect evaluations. The 5-step process combines both: think first, then check with the engine, then reconcile the difference.

### How many games do I need to analyze before I see improvement?

Most players notice a difference after analyzing 10-15 games deeply — typically 4-6 weeks of consistent work. But the real improvement comes from *acting on your action items*. If your analysis reveals you consistently miss tactical shots on the back rank, and you train back-rank puzzles for two weeks, you'll see results quickly. If you analyze 50 games but never change your training or habits, you won't improve. Analysis without follow-through is just entertainment.

### Can I use AI or automated analysis instead of doing it manually?

Automated tools like FireChess are excellent for *bulk scanning* — spotting patterns across dozens of games that you'd never catch manually. But they can't replace the self-reflection step. An AI can tell you that you consistently miscalculate in time trouble, but only you can decide whether that's because you panic, spend too long on earlier moves, or don't know the positions well enough to play quickly. Use automated tools to identify *what* your problems are, then use manual analysis to understand *why* they happen and build a fix.

## Start Analyzing Smarter

If you want to jumpstart your analysis, try scanning your last 50 games with FireChess. In a few minutes you'll see your repeated mistakes, accuracy trends, and weakest areas — giving you a clear roadmap for improvement. The basic scan is free, and everything runs privately in your browser.
